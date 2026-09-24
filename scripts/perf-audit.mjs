#!/usr/bin/env node
// Performance and smoothness audit for the production build.
// Usage and metric definitions live in agent/perf.md.
//
//   node scripts/perf-audit.mjs [--no-build] [--label name] [--compare old.json]
//                               [--lh-runs 3] [--smooth-runs 3] [--skip-lighthouse]
//                               [--skip-smooth] [--out-dir dir] [--dist dir]

import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { get as httpGet } from 'node:http';
import { createHash } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4190;
const URL = `http://localhost:${PORT}/`;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// Playwright is borrowed from a sibling project so this repo gains no dependency.
const PLAYWRIGHT = '/Users/mfuad16/Documents/web_drop_v2/node_modules/playwright';
const DEFAULT_OUT =
  '/private/tmp/claude-501/-Users-mfuad16-Documents-portfolio/39243d73-76d3-4fa6-9a14-d2fa853c3150/scratchpad/perf';
const PROJECT_SEL = '.project-ledger .project-shot';
// 4190 is on the Fetch spec's blocked-port list (ManageSieve), so Chrome refuses
// it with ERR_UNSAFE_PORT and Node's fetch throws "bad port" unless allowed.
const CHROME_PORT_FLAG = `--explicitly-allowed-ports=${PORT}`;

// ---------- args ----------
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const args = {
  build: !flag('--no-build'),
  label: opt('--label', ''),
  compare: opt('--compare', ''),
  lhRuns: Number(opt('--lh-runs', 3)),
  smoothRuns: Number(opt('--smooth-runs', 3)),
  skipLh: flag('--skip-lighthouse'),
  skipSmooth: flag('--skip-smooth'),
  outDir: opt('--out-dir', DEFAULT_OUT),
};
// Build into a private folder, not ./dist: other work on this repo runs
// `pnpm build` too, and a shared dist/ changed under the server mid-audit.
args.dist = resolve(opt('--dist', join(args.outDir, 'dist')));

// ---------- helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...m) => console.error('[perf]', ...m);
const median = (xs) => {
  const v = xs.filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
// Nearest-rank percentile.
const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] : null);
const round = (x, d = 1) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);

function run(cmd, cmdArgs, opts = {}) {
  return new Promise((res, rej) => {
    const child = spawn(cmd, cmdArgs, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', rej);
    child.on('close', (code) =>
      code === 0 ? res(out) : rej(new Error(`${cmd} ${cmdArgs.join(' ')} exited ${code}\n${err.slice(-2000)}`))
    );
  });
}

// ---------- preview server ----------
let preview = null;
function stopPreview() {
  if (!preview || preview.exitCode !== null) return;
  // Kill the whole group: pnpm spawns vite as a grandchild.
  try {
    process.kill(-preview.pid, 'SIGTERM');
  } catch {}
}
process.on('exit', stopPreview);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => (stopPreview(), process.exit(130)));

async function startPreview() {
  // Without this check a stale server on the port answers the readiness poll
  // while our own preview dies on --strictPort, and the audit measures the
  // wrong build.
  if ((await servedBundle()) !== null) throw new Error(`port ${PORT} is already in use; stop that server first`);
  preview = spawn('pnpm', ['preview', '--port', String(PORT), '--strictPort', '--outDir', args.dist], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  preview.stdout.on('data', (d) => (log += d));
  preview.stderr.on('data', (d) => (log += d));
  for (let i = 0; i < 60; i++) {
    if (preview.exitCode !== null) throw new Error(`vite preview exited early:\n${log}`);
    const bundle = await servedBundle();
    if (bundle !== null && preview.exitCode === null) return;
    await sleep(500);
  }
  throw new Error(`vite preview did not answer on ${PORT}:\n${log}`);
}

// The hashed entry script named by the served index.html, or null if the
// server is not answering. Compared at start and end to catch a swapped build.
function servedBundle() {
  return new Promise((res) => {
    const req = httpGet(`http://127.0.0.1:${PORT}/`, (r) => {
      let body = '';
      r.on('data', (d) => (body += d));
      r.on('end', () => res(r.statusCode === 200 ? (body.match(/assets\/(index-[\w-]+\.js)/) || [])[1] || '' : null));
    });
    req.on('error', () => res(null));
  });
}

// ---------- provenance and bundle sizes ----------
function provenance() {
  const git = (...a) => {
    try {
      return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  };
  const dirty = (git('status', '--porcelain') || '').split('\n').filter(Boolean);
  // Fingerprint of uncommitted work so two runs on the same HEAD can be told apart.
  const untracked = dirty.filter((l) => l.startsWith('??')).map((l) => l.slice(3));
  const h = createHash('sha1').update(git('diff', 'HEAD') || '');
  for (const f of untracked) {
    try {
      h.update(f).update(readFileSync(join(ROOT, f)));
    } catch {}
  }
  return {
    head: git('rev-parse', '--short', 'HEAD'),
    branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
    dirty,
    treeHash: h.digest('hex').slice(0, 12),
  };
}

function distAssets() {
  const dir = join(args.dist, 'assets');
  let files = [];
  try {
    files = readdirSync(dir);
  } catch {
    return [];
  }
  return files
    .filter((f) => /\.(js|css)$/.test(f))
    .map((f) => {
      const buf = readFileSync(join(dir, f));
      return {
        file: f,
        raw_kb: round(buf.length / 1024),
        gzip_kb: round(gzipSync(buf).length / 1024),
        brotli_kb: round(brotliCompressSync(buf).length / 1024),
      };
    })
    .sort((a, b) => b.raw_kb - a.raw_kb);
}

// ---------- Lighthouse ----------
const LH_METRICS = {
  lcp_ms: 'largest-contentful-paint',
  fcp_ms: 'first-contentful-paint',
  tbt_ms: 'total-blocking-time',
  cls: 'cumulative-layout-shift',
  si_ms: 'speed-index',
};
const LH_DIAG = [
  'unused-javascript',
  'unused-css-rules',
  'render-blocking-resources',
  'total-byte-weight',
  'bootup-time',
  'mainthread-work-breakdown',
  'largest-contentful-paint-element',
  'lcp-lazy-loaded',
  'prioritize-lcp-image',
  'uses-responsive-images',
  'modern-image-formats',
  'uses-optimized-images',
  'offscreen-images',
  'long-tasks',
  'font-display',
  'dom-size',
  'errors-in-console',
  'layout-shifts',
];

function lhDiagnostics(report) {
  const out = {};
  for (const id of LH_DIAG) {
    const a = report.audits[id];
    if (!a) continue;
    const items = (a.details?.items || []).slice(0, 8).map((it) => {
      const o = {};
      for (const k of ['url', 'totalBytes', 'wastedBytes', 'wastedMs', 'total', 'scripting', 'duration', 'startTime', 'groupLabel', 'description', 'score', 'node']) {
        if (it[k] === undefined) continue;
        o[k] = k === 'node' ? it[k]?.snippet || it[k]?.selector : it[k];
      }
      // largest-contentful-paint-element nests its node in a table
      if (it.items) o.items = it.items.slice(0, 4).map((x) => x.node?.snippet || x.phase || x);
      return o;
    });
    out[id] = { score: a.score, displayValue: a.displayValue || null, items };
  }
  return out;
}

async function lighthouse(formFactor, runs, outDir) {
  const results = [];
  for (let i = 0; i < runs; i++) {
    const file = join(outDir, `lh-${formFactor}-${i + 1}.json`);
    const flags = [
      '--yes',
      'lighthouse@12',
      URL,
      '--output=json',
      `--output-path=${file}`,
      '--quiet',
      `--chrome-flags=--headless=new --no-first-run --no-default-browser-check ${CHROME_PORT_FLAG}`,
      '--only-categories=performance,accessibility,best-practices,seo',
    ];
    if (formFactor === 'desktop') flags.push('--preset=desktop');
    log(`lighthouse ${formFactor} run ${i + 1}/${runs}`);
    await run('npx', flags, { env: { ...process.env, CHROME_PATH: CHROME } });
    const r = JSON.parse(readFileSync(file, 'utf8'));
    const row = {
      file,
      performance: r.categories.performance.score * 100,
      accessibility: r.categories.accessibility.score * 100,
      best_practices: r.categories['best-practices'].score * 100,
      seo: r.categories.seo.score * 100,
    };
    for (const [k, id] of Object.entries(LH_METRICS)) row[k] = r.audits[id]?.numericValue ?? null;
    row.diagnostics = lhDiagnostics(r);
    results.push(row);
  }
  const med = {};
  for (const k of ['performance', 'accessibility', 'best_practices', 'seo', ...Object.keys(LH_METRICS)])
    med[k] = round(median(results.map((r) => r[k])), k === 'cls' ? 3 : 0);
  // Diagnostics come from the run whose performance score is the median.
  const byPerf = [...results].sort((a, b) => a.performance - b.performance);
  const mid = byPerf[Math.floor(byPerf.length / 2)];
  return {
    median: med,
    runs: results.map(({ diagnostics, ...rest }) => rest),
    diagnostics: mid.diagnostics,
    diagnosticsFrom: mid.file,
  };
}

// ---------- in-page instrumentation ----------
// Installed before any page script runs. Plain PerformanceObserver, no packages.
function installObservers() {
  const s = (window.__perf = {
    lcp: null,
    lcpTarget: null,
    clsTotal: 0,
    clsSession: 0,
    longtasks: [],
    loaf: [],
    events: [],
    frames: [],
    sampling: false,
  });
  const describe = (el) =>
    el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}` : null;
  const po = (type, cb, extra = {}) => {
    try {
      new PerformanceObserver((l) => l.getEntries().forEach(cb)).observe({ type, buffered: true, ...extra });
    } catch {}
  };
  po('largest-contentful-paint', (e) => {
    s.lcp = e.renderTime || e.loadTime || e.startTime;
    s.lcpTarget = e.url || describe(e.element);
  });
  // CLS as web-vitals defines it: the largest session window (gap < 1s, span < 5s).
  let win = 0;
  let winStart = 0;
  let winLast = 0;
  po('layout-shift', (e) => {
    if (e.hadRecentInput) return;
    if (win && e.startTime - winLast < 1000 && e.startTime - winStart < 5000) win += e.value;
    else {
      win = e.value;
      winStart = e.startTime;
    }
    winLast = e.startTime;
    s.clsTotal += e.value;
    s.clsSession = Math.max(s.clsSession, win);
  });
  po('longtask', (e) => s.longtasks.push({ start: e.startTime, dur: e.duration }));
  po('long-animation-frame', (e) =>
    s.loaf.push({
      start: e.startTime,
      dur: e.duration,
      blocking: e.blockingDuration,
      scripts: (e.scripts || []).map((x) => ({ src: x.sourceURL, fn: x.sourceFunctionName, invoker: x.invoker, dur: x.duration })),
    })
  );
  po('event', (e) => e.interactionId && s.events.push({ id: e.interactionId, name: e.name, dur: e.duration }), {
    durationThreshold: 16,
  });
  s.start = () => {
    s.frames = [];
    s.sampling = true;
    s.t0 = performance.now();
    let last = null;
    const tick = (t) => {
      if (!s.sampling) return;
      if (last !== null) s.frames.push(t - last);
      last = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  s.stop = () => {
    s.sampling = false;
    s.t1 = performance.now();
    const inWin = (x) => x.start >= s.t0 && x.start <= s.t1;
    return {
      frames: s.frames,
      longtasks: s.longtasks.filter(inWin),
      loaf: s.loaf.filter(inWin),
      ms: s.t1 - s.t0,
    };
  };
}

function frameStats({ frames, longtasks, loaf, ms }) {
  const v = [...frames].sort((a, b) => a - b);
  const n = v.length || 1;
  // Script attribution from Long Animation Frames, summed by source file.
  const bySrc = {};
  for (const f of loaf)
    for (const sc of f.scripts) {
      const key = `${(sc.src || '(inline)').replace(/^https?:\/\/[^/]+/, '')} ${sc.fn || sc.invoker || ''}`.trim();
      bySrc[key] = (bySrc[key] || 0) + sc.dur;
    }
  return {
    window_ms: round(ms, 0),
    frames: frames.length,
    fps: round((frames.length / ms) * 1000, 1),
    p50: round(pct(v, 50)),
    p90: round(pct(v, 90)),
    p99: round(pct(v, 99)),
    max: round(v.at(-1)),
    over16_pct: round((100 * v.filter((x) => x > 16.7).length) / n),
    // Vsync intervals jitter around 16.67ms (16.6-16.8), so over16_pct counts
    // on-time frames too. over20_pct is the "missed a vsync" share.
    over20_pct: round((100 * v.filter((x) => x > 20).length) / n),
    over33_pct: round((100 * v.filter((x) => x > 33.4).length) / n),
    longtask_count: longtasks.length,
    longtask_total_ms: round(longtasks.reduce((a, b) => a + b.dur, 0), 0),
    loaf_count: loaf.length,
    loaf_blocking_ms: round(loaf.reduce((a, b) => a + (b.blocking || 0), 0), 0),
    loaf_top_scripts: Object.entries(bySrc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, d]) => ({ script: k, ms: round(d, 0) })),
  };
}

// ---------- page weight ----------
async function pageWeight(page) {
  const entries = await page.evaluate(() =>
    [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')].map((e) => ({
      name: e.name,
      initiator: e.initiatorType,
      transfer: e.transferSize || 0,
      decoded: e.decodedBodySize || 0,
    }))
  );
  const typeOf = (e) => {
    const path = e.name.split('?')[0].toLowerCase();
    if (/\.(m?js)$/.test(path) || e.initiator === 'script') return 'script';
    if (/\.css$/.test(path) || (e.initiator === 'link' && /css/.test(path))) return 'style';
    if (/\.(woff2?|ttf|otf|eot)$/.test(path)) return 'font';
    if (/\.(mp4|webm|mov|mp3|ogg|wav|m4a)$/.test(path) || ['video', 'audio'].includes(e.initiator)) return 'media';
    if (/\.(png|jpe?g|webp|avif|gif|svg|ico)$/.test(path) || e.initiator === 'img') return 'image';
    return 'other';
  };
  const byType = { script: 0, style: 0, image: 0, font: 0, media: 0, other: 0 };
  for (const e of entries) byType[typeOf(e)] += e.transfer;
  const kb = Object.fromEntries(Object.entries(byType).map(([k, b]) => [k, round(b / 1024)]));
  kb.total = round(Object.values(byType).reduce((a, b) => a + b, 0) / 1024);
  const largest = [...entries]
    .sort((a, b) => b.transfer - a.transfer)
    .slice(0, 10)
    .map((e) => ({ url: e.name.replace(/^https?:\/\/[^/]+/, ''), type: typeOf(e), kb: round(e.transfer / 1024), decoded_kb: round(e.decoded / 1024) }));
  return { kb, requests: entries.length, largest };
}

// ---------- smoothness ----------
async function smoothRun(browser, mode) {
  const mobile = mode === 'mobile';
  const context = await browser.newContext(
    mobile
      ? {
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true,
          userAgent:
            'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
        }
      : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
  );
  await context.addInitScript(installObservers);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  if (mobile) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await sleep(2000); // let the intro timeline finish
  const weightAtLoad = await pageWeight(page);
  const vitalsAtLoad = await page.evaluate(() => ({ lcp: window.__perf.lcp, lcpTarget: window.__perf.lcpTarget }));

  // Whole-page scroll over ~8s.
  const DURATION = 8000;
  const geom = await page.evaluate(() => ({ max: document.documentElement.scrollHeight - innerHeight }));
  if (!mobile) await page.mouse.move(720, 450);
  await page.evaluate(() => window.__perf.start());
  if (mobile) {
    // In-page loop so the step cadence is not limited by the protocol round trip.
    await page.evaluate(
      ({ max, duration }) =>
        new Promise((done) => {
          const t0 = performance.now();
          let sent = 0;
          const id = setInterval(() => {
            const target = Math.min(max, (max * (performance.now() - t0)) / duration);
            window.scrollBy(0, target - sent);
            sent = target;
            if (target >= max) {
              clearInterval(id);
              done();
            }
          }, 16);
        }),
      { max: geom.max, duration: DURATION }
    );
  } else {
    // ScrollSmoother moves content on wheel input; native scrollTo does not animate it.
    // Each wheel round trip takes ~30-60ms, so size the step from the measured
    // iteration time to spread the distance over the whole window.
    const t0 = Date.now();
    let sent = 0;
    let iter = 50;
    while (sent < geom.max) {
      const ti = Date.now();
      const left = Math.max(DURATION - (ti - t0), iter);
      const dy = Math.max(10, Math.min(200, ((geom.max - sent) * iter) / left));
      await page.mouse.wheel(0, dy);
      sent += dy;
      await sleep(16);
      iter = Date.now() - ti;
    }
  }
  await sleep(800); // include the smoother catching up
  const scrollRaw = await page.evaluate(() => window.__perf.stop());
  const reached = await page.evaluate(() => ({
    scrollY: window.scrollY,
    max: document.documentElement.scrollHeight - innerHeight,
  }));
  const weightAfterScroll = await pageWeight(page);

  // Project open.
  let open = null;
  let openCheck = {};
  for (let i = 0; i < 60; i++) {
    const r = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, h: innerHeight };
    }, PROJECT_SEL);
    if (!r) break;
    const off = r.cy - r.h / 2;
    if (Math.abs(off) < r.h * 0.2) {
      await sleep(1000);
      const f = await page.evaluate((sel) => {
        const b = document.querySelector(sel).getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
      }, PROJECT_SEL);
      await page.evaluate(() => window.__perf.start());
      if (mobile) await page.touchscreen.tap(f.x, f.y);
      else await page.mouse.click(f.x, f.y);
      await sleep(2500);
      const raw = await page.evaluate(() => window.__perf.stop());
      openCheck.hashAfterOpen = await page.evaluate(() => location.hash);
      await page.keyboard.press('Escape');
      await sleep(1500);
      openCheck.hashAfterEscape = await page.evaluate(() => location.hash);
      open = frameStats(raw);
      break;
    }
    if (mobile) await page.evaluate((dy) => window.scrollBy(0, dy), off);
    else await page.mouse.wheel(0, Math.max(-600, Math.min(600, off)));
    await sleep(mobile ? 400 : 300);
  }

  const vitals = await page.evaluate(() => {
    const p = window.__perf;
    const byId = {};
    for (const e of p.events) byId[e.id] = Math.max(byId[e.id] || 0, e.dur);
    const inter = Object.values(byId);
    return {
      lcp_ms: p.lcp,
      lcp_target: p.lcpTarget,
      cls: p.clsSession,
      cls_total: p.clsTotal,
      // Fewer than 50 interactions, so INP is the slowest one. null = every
      // interaction finished under the 16ms event-timing threshold.
      inp_ms: inter.length ? Math.max(...inter) : null,
      interactions: inter.length,
    };
  });
  await context.close();
  return {
    mode,
    scroll: frameStats(scrollRaw),
    scrollReached: reached,
    projectOpen: open,
    projectOpenCheck: openCheck,
    vitals: { ...vitals, lcp_ms: round(vitals.lcp_ms, 0), cls: round(vitals.cls, 4), cls_total: round(vitals.cls_total, 4) },
    vitalsAtLoad,
    weightAtLoad,
    weightAfterScroll,
    pageErrors: errors,
  };
}

// Median across runs for every numeric leaf; non-numeric leaves come from run 1.
function medianMerge(runs) {
  const walk = (vals) => {
    const first = vals[0];
    if (typeof first === 'number' || first === null) {
      const nums = vals.filter((x) => typeof x === 'number');
      return nums.length ? round(median(nums), 4) : null;
    }
    if (Array.isArray(first) || typeof first !== 'object') return first;
    const o = {};
    for (const k of Object.keys(first)) o[k] = walk(vals.map((v) => v?.[k] ?? null));
    return o;
  };
  return walk(runs);
}

// ---------- summary, printing, compare ----------
function flatten(result) {
  const s = {};
  for (const ff of ['mobile', 'desktop']) {
    const m = result.lighthouse?.[ff]?.median;
    if (m) for (const [k, v] of Object.entries(m)) s[`lh.${ff}.${k}`] = v;
  }
  for (const ff of ['desktop', 'mobile']) {
    const r = result.smoothness?.[ff]?.median;
    if (!r) continue;
    for (const part of ['scroll', 'projectOpen'])
      if (r[part])
        for (const k of ['p50', 'p90', 'p99', 'max', 'over16_pct', 'over20_pct', 'over33_pct', 'longtask_count', 'longtask_total_ms'])
          s[`smooth.${ff}.${part}.${k}`] = r[part][k];
    for (const k of ['lcp_ms', 'cls', 'inp_ms']) s[`vitals.${ff}.${k}`] = r.vitals[k];
    for (const [k, v] of Object.entries(r.weightAtLoad.kb)) s[`weight.${ff}.load.${k}_kb`] = v;
    s[`weight.${ff}.afterScroll.total_kb`] = r.weightAfterScroll.kb.total;
  }
  return s;
}

function table(rows) {
  const w = rows[0].map((_, i) => Math.max(...rows.map((r) => String(r[i] ?? '').length)));
  return rows.map((r) => r.map((c, i) => String(c ?? '-')[i ? 'padStart' : 'padEnd'](w[i])).join('  ')).join('\n');
}

const range = (runs, get) => {
  const v = runs.map(get).filter((x) => typeof x === 'number');
  return v.length > 1 ? `${round(Math.min(...v))}..${round(Math.max(...v))}` : '';
};

function printResult(res) {
  const out = [];
  out.push(`perf audit ${res.label ? `[${res.label}] ` : ''}${res.timestamp}  ${res.git.branch}@${res.git.head}${res.git.dirty.length ? ` (+${res.git.dirty.length} dirty)` : ''}  built tree ${res.build?.git?.treeHash ?? '?'}  bundle ${res.servedBundle.start}`);
  if (res.lighthouse) {
    const rows = [['lighthouse (median)', 'mobile', 'range', 'desktop', 'range']];
    for (const k of ['performance', 'accessibility', 'best_practices', 'seo', ...Object.keys(LH_METRICS)])
      rows.push([
        k,
        res.lighthouse.mobile?.median[k],
        res.lighthouse.mobile ? range(res.lighthouse.mobile.runs, (r) => r[k]) : '',
        res.lighthouse.desktop?.median[k],
        res.lighthouse.desktop ? range(res.lighthouse.desktop.runs, (r) => r[k]) : '',
      ]);
    out.push('', table(rows));
  }
  if (res.smoothness) {
    const d = res.smoothness.desktop;
    const m = res.smoothness.mobile;
    const rows = [['frames (ms, median of runs)', 'desk scroll', 'desk open', 'mob4x scroll', 'mob4x open', 'desk scroll range', 'mob scroll range']];
    for (const k of ['fps', 'p50', 'p90', 'p99', 'max', 'over16_pct', 'over20_pct', 'over33_pct', 'longtask_count', 'longtask_total_ms', 'loaf_blocking_ms'])
      rows.push([
        k,
        d?.median.scroll[k],
        d?.median.projectOpen?.[k],
        m?.median.scroll[k],
        m?.median.projectOpen?.[k],
        d ? range(d.runs, (r) => r.scroll[k]) : '',
        m ? range(m.runs, (r) => r.scroll[k]) : '',
      ]);
    out.push('', table(rows));
    const vrows = [['in-page vitals', 'desktop', 'mobile 4x']];
    for (const k of ['lcp_ms', 'cls', 'inp_ms', 'interactions']) vrows.push([k, d?.median.vitals[k], m?.median.vitals[k]]);
    out.push('', table(vrows));
    const wrows = [['transfer KB at load', 'desktop', 'mobile']];
    for (const k of ['script', 'style', 'image', 'font', 'media', 'other', 'total'])
      wrows.push([k, d?.median.weightAtLoad.kb[k], m?.median.weightAtLoad.kb[k]]);
    wrows.push(['total after scroll', d?.median.weightAfterScroll.kb.total, m?.median.weightAfterScroll.kb.total]);
    out.push('', table(wrows));
    if (d) {
      const lrows = [['largest at load (desktop run 1)', 'type', 'KB']];
      for (const r of d.runs[0].weightAtLoad.largest) lrows.push([r.url.slice(0, 60), r.type, r.kb]);
      out.push('', table(lrows));
    }
  }
  console.log(out.join('\n'));
}

function printCompare(before, after) {
  const a = before.summary;
  const b = after.summary;
  const rows = [['metric', 'before', 'after', 'delta', '%']];
  for (const k of Object.keys(b)) {
    if (!(k in a)) continue;
    const x = a[k];
    const y = b[k];
    const delta = typeof x === 'number' && typeof y === 'number' ? round(y - x, 3) : null;
    const p = delta != null && x ? round((100 * delta) / Math.abs(x)) : null;
    rows.push([k, x, y, delta == null ? '' : (delta > 0 ? '+' : '') + delta, p == null ? '' : (p > 0 ? '+' : '') + p]);
  }
  console.log(`\ncompare vs ${before.label || before.timestamp}\n` + table(rows));
}

// ---------- main ----------
async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = join(args.outDir, `${timestamp}-raw`);
  mkdirSync(runDir, { recursive: true });

  if (args.build) {
    log('pnpm build ->', args.dist);
    await run('pnpm', ['build', '--outDir', args.dist, '--emptyOutDir']);
    writeFileSync(join(args.dist, '.perf-build.json'), JSON.stringify({ builtAt: new Date().toISOString(), git: provenance() }));
  }
  const result = {
    timestamp,
    label: args.label,
    url: URL,
    git: provenance(),
    // With --no-build the tree may have moved on; this is the tree that was built.
    build: (() => {
      try {
        return JSON.parse(readFileSync(join(args.dist, '.perf-build.json'), 'utf8'));
      } catch {
        return null;
      }
    })(),
    bundle: distAssets(),
    options: { lhRuns: args.lhRuns, smoothRuns: args.smoothRuns, built: args.build },
  };

  log('starting vite preview on', PORT);
  await startPreview();
  result.servedBundle = { start: await servedBundle() };
  const built = (readFileSync(join(args.dist, 'index.html'), 'utf8').match(/assets\/(index-[\w-]+\.js)/) || [])[1];
  if (built !== result.servedBundle.start)
    throw new Error(`server returns ${result.servedBundle.start} but ${args.dist} has ${built}`);
  try {
    if (!args.skipLh) {
      result.lighthouse = {
        mobile: await lighthouse('mobile', args.lhRuns, runDir),
        desktop: await lighthouse('desktop', args.lhRuns, runDir),
      };
    }
    if (!args.skipSmooth) {
      const require = createRequire(import.meta.url);
      const { chromium } = require(PLAYWRIGHT);
      const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: [CHROME_PORT_FLAG] });
      result.smoothness = {};
      try {
        for (const mode of ['desktop', 'mobile']) {
          const runs = [];
          for (let i = 0; i < args.smoothRuns; i++) {
            log(`smoothness ${mode} run ${i + 1}/${args.smoothRuns}`);
            runs.push(await smoothRun(browser, mode));
          }
          result.smoothness[mode] = { median: medianMerge(runs), runs };
        }
      } finally {
        await browser.close();
      }
    }
    result.servedBundle.end = await servedBundle();
  } finally {
    stopPreview();
  }
  if (result.servedBundle.start !== result.servedBundle.end)
    log(`WARNING: served bundle changed during the audit (${result.servedBundle.start} -> ${result.servedBundle.end})`);

  result.summary = flatten(result);
  mkdirSync(args.outDir, { recursive: true });
  const file = join(args.outDir, `${timestamp}.json`);
  writeFileSync(file, JSON.stringify(result, null, 2));
  printResult(result);
  if (args.compare) printCompare(JSON.parse(readFileSync(args.compare, 'utf8')), result);
  console.log(`\njson: ${file}`);
}

main().catch((e) => {
  stopPreview();
  console.error(e);
  process.exit(1);
});
