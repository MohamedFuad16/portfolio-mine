# Archived perf log, baseline of 24 Sep 2026

Moved verbatim from `agent/perf.md` on 2026-10-22 to keep that file under the size limit. The text after the rule is unchanged. Run date: 2026-09-24.

Path notes (added when archived, not part of the original text):
- The two JSON files named below, `perf/2026-09-24T14-52-46-729Z.json` and `perf/2026-09-24T14-56-39-064Z.json`, were written to a session scratchpad, not to the repo. A search of `/private/tmp/claude-501`, `~/Documents` and `~/.claude` on 2026-10-22 found no copy, so the numbers below cannot be re-derived from them.

---

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
