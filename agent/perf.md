# Performance and smoothness audit

`scripts/perf-audit.mjs` measures the production build. It changes no application source. It builds into its own folder, serves that folder with `vite preview`, and runs Lighthouse and a Playwright scroll test against it.

## Run it

```sh
pnpm perf:audit                                  # build, 3 Lighthouse runs per form factor, 3 smoothness runs per viewport (~4 min)
pnpm perf:audit --label after-images             # tag the run
pnpm perf:audit --compare <old>.json             # print deltas against an earlier run
node scripts/perf-audit.mjs --no-build --skip-smooth   # Lighthouse only, on the last private build
```

| Flag | Effect |
| --- | --- |
| `--no-build` | Skip the build and serve the existing private build |
| `--label <name>` | Stored in the JSON and printed in the header |
| `--compare <file.json>` | After the run, print before, after, delta and percent for every shared summary key |
| `--lh-runs N` / `--smooth-runs N` | Runs per form factor (default 3 each). Every metric reported is the median |
| `--skip-lighthouse` / `--skip-smooth` | Run only one half |
| `--out-dir <dir>` | Where JSON goes. Default is the session scratchpad `.../scratchpad/perf` |
| `--dist <dir>` | Build output folder. Default is `<out-dir>/dist` |

Requirements:

- Chrome at `/Applications/Google Chrome.app`.
- Playwright at `/Users/mfuad16/Documents/web_drop_v2/node_modules/playwright`. The script loads it by absolute path, so this repo gains no dependency.
- Network access for the first `npx --yes lighthouse@12` download.
- Port 4190 must be free. The script refuses to start if anything answers on it.

Output:

- A table on stdout.
- `<out-dir>/<timestamp>.json` with every per-run value, medians, Lighthouse diagnostics and a flat `summary` map that `--compare` reads.
- `<out-dir>/<timestamp>-raw/lh-*.json` with the full Lighthouse reports.

### Things the script guards against

- Port 4190 is on the Fetch spec's blocked-port list (ManageSieve). Chrome refuses it with `ERR_UNSAFE_PORT`, and Node's `fetch` throws `bad port`. The script passes `--explicitly-allowed-ports=4190` to Chrome and polls with `node:http`.
- A shared `dist/` changed under the server mid-audit because other work on the repo also runs `pnpm build`. The script now builds with `--outDir <out-dir>/dist` and previews that folder. It checks that the served `index-*.js` matches the built one, and it warns if the served bundle changes between the start and the end of the run.
- A stale preview server on 4190 answered the readiness poll while the script's own server died on `--strictPort`. The script now fails fast when the port is in use.
- The JSON records `git.treeHash` (a hash of `git diff HEAD` plus untracked files) at run time, and `build.git.treeHash` for the tree that was built. Two runs on the same HEAD with a dirty tree compare only if these match.

## What each metric means

### Lighthouse (`lh.<mobile|desktop>.*`)

`npx --yes lighthouse@12` against `http://localhost:4190/`, headless, with `CHROME_PATH` set. Mobile uses the default emulation: a Moto G Power, 4x CPU slowdown and simulated slow 4G (Lantern). Desktop uses `--preset=desktop`. Only the performance, accessibility, best-practices and SEO categories run.

- `performance`, `accessibility`, `best_practices`, `seo` are category scores from 0 to 100.
- `lcp_ms` is Largest Contentful Paint.
- `fcp_ms` is First Contentful Paint.
- `tbt_ms` is Total Blocking Time: the sum of the part of each long task over 50ms between FCP and interactive.
- `cls` is Cumulative Layout Shift.
- `si_ms` is Speed Index.

Lighthouse times are simulated, so they will not match the in-page vitals below. The JSON also keeps diagnostics from the run with the median performance score. These include unused JS, render-blocking resources, byte weight, bootup time, long tasks, responsive and modern images, and console errors.

### Smoothness (`smooth.<desktop|mobile>.<scroll|projectOpen>.*`)

Playwright drives the same Chrome.

- Desktop is 1440x900 at DPR 1. The script scrolls with `mouse.wheel` steps sized so that the whole page takes about 8s. GSAP ScrollSmoother moves content on wheel input. Native `scrollTo` does not animate it. The pointer stays at the viewport centre, so project cards under it play their hover videos, as they would for a real mouse user.
- Mobile is 390x844 at DPR 3 with `isMobile`, `hasTouch`, an Android UA and CDP `Emulation.setCPUThrottlingRate {rate: 4}` from before navigation. An in-page `setInterval(16ms)` loop calls `window.scrollBy` for about 8s.
- For the project-open test, the script scrolls until `.project-ledger .project-shot` is near the viewport centre. It waits 1s, starts sampling, then clicks (desktop) or taps (mobile). It samples for 2.5s and presses Escape. The JSON records `projectOpenCheck.hashAfterOpen` (should be `#/project/ledger`) and `hashAfterEscape` (should be empty). The JSON also records `scrollReached`, and a scroll run is valid only if `scrollY` reached `max`.

The sampler records every `requestAnimationFrame` delta:

- `p50`, `p90`, `p99` and `max` are frame-time percentiles in ms, by nearest rank.
- `over16_pct` is the share of frames over 16.7ms. Vsync intervals jitter between 16.6 and 16.8ms, so about a third of on-time frames land here. Read it only as a delta between runs.
- `over20_pct` is the share of frames that missed at least one vsync. This is the useful jank number.
- `over33_pct` is the share of frames that took two or more vsyncs.
- `longtask_count` and `longtask_total_ms` count `longtask` PerformanceObserver entries that start inside the sampling window.
- `loaf_blocking_ms` and `loaf_top_scripts` come from Long Animation Frame entries. They give the blocking time and the script and function the frame spent time in. Function names are minified, so match them against a sourcemap build to name them.

Headless Chrome paces rAF at 60Hz, so frame times are quantised to about 16.7ms. There is no real GPU, so raster and compositor cost differ from a real device. Compare runs with each other, not with a phone.

### In-page vitals (`vitals.<desktop|mobile>.*`)

Plain `PerformanceObserver`, installed with `addInitScript` before any page code runs.

- `lcp_ms` is the last `largest-contentful-paint` entry. The observer stops at the first input.
- `cls` is the largest session window of `layout-shift` entries without recent input (gap under 1s, span under 5s), as web-vitals defines it.
- `inp_ms` is the slowest interaction from `event` entries (`durationThreshold: 16`). Each run has only two interactions (project click and Escape), so this is the worse of those two. `null` means both finished under 16ms.

These run on an unthrottled local network, so LCP here is much lower than Lighthouse's simulated mobile LCP.

### Page weight (`weight.<desktop|mobile>.*`)

These are the `transferSize` sums from Resource Timing plus the navigation entry. The script sorts them into script, style, image, font, media and other. It takes one snapshot 2s after `load` plus network idle (`load.*`) and another after the full scroll and project open (`afterScroll.total_kb`). `largest` lists the ten largest resources. Cross-origin responses without `Timing-Allow-Origin` report 0 bytes. The GitHub contributions API fetch is one of these, so cross-origin weight is undercounted.

`bundle` in the JSON lists each built JS and CSS file with raw, gzip and brotli sizes.

## Baseline, 24 Sep 2026

Tree: `redesign@da0e82b` with 16 to 19 uncommitted files from in-progress work (`git.treeHash 8b107063adb9` at build time). Served bundle: `index-Bz8Gixvj.js` from the start to the end of the run. The source JSON files are in the session scratchpad:

- `perf/2026-09-24T14-52-46-729Z.json` is the full run.
- `perf/2026-09-24T14-56-39-064Z.json` is a Lighthouse-only rerun on the same build, done because mobile varied.

The Lighthouse medians below cover all 6 runs per form factor from both files.

Verified by: `node -e "const a=require('<scratch>/perf/2026-09-24T14-52-46-729Z.json'),b=require('<scratch>/perf/2026-09-24T14-56-39-064Z.json');for(const f of ['mobile','desktop'])console.log(f,[...a.lighthouse[f].runs,...b.lighthouse[f].runs].map(r=>[r.performance,Math.round(r.lcp_ms),Math.round(r.tbt_ms),r.cls]))"`

### Lighthouse (median of 6, with range)

| Metric | Mobile | Mobile range | Desktop | Desktop range |
| --- | --- | --- | --- | --- |
| Performance | 57.5 | 46 to 63 | 85.5 | 79 to 88 |
| Accessibility | 91 | 91 | 91 | 91 |
| Best practices | 96 | 96 | 96 | 96 |
| SEO | 92 | 92 | 92 | 92 |
| LCP | 13,912 ms | 5,671 to 34,158 | 2,536 ms | 1,983 to 3,815 |
| FCP | 3,192 ms | 3,160 to 3,402 | 743 ms | 738 to 748 |
| TBT | 413 ms | 270 to 955 | 103 ms | 13 to 123 |
| CLS | 0.001 | 0 to 0.149 | 0.008 | 0 to 0.008 |
| Speed Index | 3,192 ms | 3,160 to 4,732 | 743 ms | 738 to 748 |

### Smoothness (median of 3)

| Metric | Desktop scroll | Desktop open | Mobile 4x scroll | Mobile 4x open |
| --- | --- | --- | --- | --- |
| fps | 57.0 | 59.5 | 57.2 | 56.5 |
| p50 / p90 / p99 ms | 16.7 / 16.7 / 33.4 | 16.7 / 16.7 / 16.8 | 16.7 / 16.7 / 33.4 | 16.7 / 16.7 / 50 |
| max ms | 50.1 (33.4 to 50.1) | 16.8 | 100 (99.9 to 133.2) | 99.9 |
| over 16.7ms | 33.9% | 45% | 36.2% | 52.5% |
| over 20ms (missed vsync) | 4.8% (2.7 to 7.8) | 0% | 3.6% (2.0 to 4.4) | 1.4% |
| over 33ms | 0.8% | 0% | 1.0% | 1.4% |
| long tasks | 0 | 0 | 3, 235 ms (113 to 239) | 2, 138 ms |
| LoAF blocking | 0 ms | 0 ms | 112 ms | 42 ms |

The project opened to `#/project/ledger` and Escape cleared the hash in all 6 runs. Every scroll run reached the bottom of the page.

### In-page vitals (median of 3)

| Metric | Desktop | Mobile 4x |
| --- | --- | --- |
| LCP | 428 ms (`<p>`) | 1,192 ms (`<p>`) |
| CLS | 0.0004 | 0.0003 |
| INP (2 interactions) | 32 ms | 64 ms |

### Page weight (median of 3, KB transferred)

| Type | Desktop at load | Mobile at load |
| --- | --- | --- |
| script | 192.3 | 192.3 |
| style | 14.9 | 14.9 |
| image | 5,658 (4,370 to 5,846) | 4,370 (4,370 to 5,870) |
| font | 0 | 0 |
| media | 0 | 0 |
| other | 3.6 | 3.6 |
| total | 5,869 | 4,580 |
| total after scroll and open | 10,283 (8,993 to 10,472) | 5,982 (4,693 to 7,672) |

The largest resources at load were five mascot sprite sheets (`daijin-happy-b`, `happy-a`, `playful-a`, `idle-a` and `idle-b`, 646 to 694 KB each), `ledger-en.jpg` at 375 KB, `ccft.jpg` at 341 KB, `index-Bz8Gixvj.js` at 191 KB and `profile.jpg` at 128 KB. The 2.7 MB of desktop media after scroll is project hover videos. The mobile run never hovers, so it loads no media.

Built bundle: `index-Bz8Gixvj.js` is 583.8 KB raw, 190.9 KB gzip and 164.9 KB brotli. `index.es-C4oF6aB5.js` is 85.7 KB raw and 28.6 KB gzip. The CSS is 63.4 KB raw and 13.4 KB gzip.

### Which numbers varied

- Mobile Lighthouse LCP was 13.9s in 4 of 6 runs, 5.7s in one and 34.2s in one. Mobile performance ranged from 46 to 63, and TBT from 270 to 955ms. One run in each file had a CLS of 0.1 to 0.15, while the others were at or below 0.001.
- Image bytes at load differ by about 1.3 to 1.5 MB between runs on the same build. Mascot sheets keep loading after `load`, so the snapshot catches a different number of them each time.
- Smoothness `max` and `over20_pct` vary by about 2x between runs. Look at a change only if it moves beyond the ranges above.
- Stable across runs: FCP, Speed Index, the category scores other than performance, script bytes and INP.

### Invalid runs, discarded (24 Sep 2026)

Earlier runs that day (`14-39-37`, `14-41-16`, `14-42-18`, `14-46-06` and `14-48-33`) measured the repo's shared `dist/` through a stale preview server, not the script's own build. Their served bundle hash changed mid-run. They are not a baseline. The guards under "Things the script guards against" were added because of them.

## Prerender round, 25 Sep 2026

`pnpm perf:audit --compare` against the 82 run (2026-09-24T15-31-49-340Z): mobile performance 82 to 98, LCP 3,546 to 2,255 ms, FCP 2,631 to 1,355 ms, TBT 248 to 46 ms, CLS 0.001 to 0; desktop 99 to 100, LCP 821 to 515 ms. Scroll and project-open frame P50/P90 stay 16.7 ms on both form factors, no scroll long tasks. Load weight 447 to 417 KB (mobile). Result file: scratchpad perf/2026-09-24T16-30-20-537Z.json.
