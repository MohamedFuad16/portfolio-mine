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

Full tables, the numbers that varied and the discarded runs are in `agent/archive/perf-2026-09-24-baseline.md`. Tree `redesign@da0e82b`. Lighthouse median of 6 runs per form factor: mobile performance 57.5 (46 to 63) with LCP 13,912 ms, desktop performance 85.5 (79 to 88) with LCP 2,536 ms. Smoothness median of 3: frame P50 and P90 16.7 ms on desktop and on mobile at 4x CPU throttle, desktop scroll 57.0 fps. Transfer at load 5,869 KB desktop and 4,580 KB mobile. The source JSON files were in a session scratchpad and are no longer on this machine.

## Prerender round, 25 Sep 2026

`pnpm perf:audit --compare` against the 82 run (2026-09-24T15-31-49-340Z): mobile performance 82 to 98, LCP 3,546 to 2,255 ms, FCP 2,631 to 1,355 ms, TBT 248 to 46 ms, CLS 0.001 to 0; desktop 99 to 100, LCP 821 to 515 ms. Scroll and project-open frame P50/P90 stay 16.7 ms on both form factors, no scroll long tasks. Load weight 447 to 417 KB (mobile). Result file: scratchpad perf/2026-09-24T16-30-20-537Z.json.
