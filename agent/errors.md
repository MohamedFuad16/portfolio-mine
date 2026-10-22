# Errors

Entries dated 2026-07-30 and earlier moved verbatim to `agent/archive/errors-2026-07-04-to-07-26.md` and `agent/archive/errors-2026-07-29-to-07-30.md` on 2026-10-22. They cover the preview pane limits, flow chart filters, the mobile card expand, GSAP units, focus on hidden elements, and the Node version Vite 8 needs.

- Daijin's Playful source has a malformed in-between at frame 8 followed by a turn/back-view passage.
  Playing all 46 frames makes the portrait gesture appear to spin and glitch. Keep the profile path
  restricted to clean front-facing frames 9→23→9 and decode only sheet A for it. The visible drawing
  also has transparent right padding, so canvas-box spacing is not visual spacing: profile mode needs
  its dedicated inward offset while section scenes use the wider left-rail coordinate.

- Daijin clips use two 3072×2048 6×4 WebP sheets with 512×512 cells: `-a.webp` is frames 0–22 and
  `-b.webp` is 23–45. Keep the final cell empty and draw only the exact 512px source crop, or
  neighboring frames become visible. The 18 optimized files are 12.27 MB; one active
  pair is about 48 MB decoded. Keep playback on the imperative canvas and decode only the current pair.
- Semantic section position selects Daijin's clip; it must not be used as the frame clock. The component uses
  elapsed time through `requestAnimationFrame`, skips frames after lag, and freezes its poster under
  `prefers-reduced-motion`. Scrubbing the frame index directly from scroll recreates visible cuts.
- Context performances are one-shot and hold their final selected frame. Do not restore the timed
  transition to Idle: it reads as an unrelated turnaround after every reaction and a stale timer can
  also overwrite a newer section. Full clips clamp at frame 46; Playful follows its explicit frame path.
- Daijin intentionally stays at one fixed top-left coordinate. Titles are timed to cross his perch and
  receive a short transform, rather than moving the mascot vertically or into a right rail. Keep the
  top-left `right:min(...)` clamp synchronized with the 760px mobile cutoff.
- The fixed mascot needs reserved document space even though it is outside normal flow. Desktop main
  padding is 132px and mascot height is 112px at top 10px; reducing that padding or enlarging Daijin
  recreates the portrait/title collision. Do not copy the desktop padding into the <=760px rule.
- The mascot belongs outside `#smooth-wrapper`: a fixed descendant of ScrollSmoother's transformed
  content is fixed to that transform rather than to the viewport. Keep `pointer-events:none`, hide it
  at `max-width:760px`, and unmount it while a project detail is shown.
- Interrupted `cwebp` runs can leave zero-byte files. Validate every Daijin atlas with an image
  decoder and exact 3072×2048 dimensions before trusting filename presence.

- The contribution grid's month header only means anything if a grid column is a week. While the grid flowed row-major in 35-day rows, the labels were decoration sitting above unrelated days. It is now `grid-auto-flow: column` with 7 rows, and both the header and the grid read the same `--grid-columns` custom property off `.calendar-scroll`; keep `CONTRIBUTION_WEEKS` (`src/App.jsx`) and `DAYS` (`scripts/fetch-contributions.mjs`) in sync or the header and the data drift apart.
- **JSX turns a mid-text line break into a space, which is wrong in Japanese.** Babel drops a newline that sits next to a tag but condenses one that falls between two runs of text into a single space. `introParagraphs.ja` was wrapped for readability and rendered 「机上の要件から 推測するのではなく」 and 「エンジニアに なりたいと」. Japanese takes no inter-word spaces, so a JA JSX fragment must break lines only where they abut a tag, or not at all. Detect it by walking every rendered text node and flagging an ASCII space with a CJK character on either side — that scan also has to whitelist the legitimate cases already on this page: spaced separators (`React + Tailwind / 日英`, `フルスタック開発 / AIエージェント`), `東海大学 情報通信学部`, date ranges (`2023年6月 - 現在`), spacing around Latin numerals (`直近12か月で 586 件`), and `Title: 詳細を見る` aria-labels.
- Two verification traps that produce phantom findings, both hit while checking this: a detail page sampled right after a cold Vite start reports its `.pd-block` reveals still at opacity 0 (they reach 1 given ~2s and 20 scroll steps), and `.visitor-count` reads `undefined` if sampled before `/api/visits` resolves. Re-test with generous waits before reporting either as a bug.
- The ClaudeShot SVG embeds a sibling `claudeshot-icon.png`; keep both under `public/media/projects/`. `pnpm check:assets` validates nested SVG references.
- Bundled Poppler lacks the Adobe-Japan1 CMap needed to render the current Japanese CV font correctly. Use native macOS Quick Look for visual PDF QA.
- A naive pairwise text-overlap detector reports ~25 of 28 route/locale/breakpoint combos as broken. Every hit pairs an element inside `.project-detail` with one inside `#smooth-content > main`: the detail overlay is `position: fixed` and sits on top of the home page, so the two genuinely overlap by design. The only other hits are `<li>`s inside a collapsed `.experience-details`, which is clipped to height 0. Exclude both before believing an overlap result.
- DaijinMascot's `draw()` read `layers[layers.length - 1].weight` before any clip was pushed; under reduced motion that threw `Cannot read properties of undefined (reading 'weight')` on the home page. Guarded with an empty-layers return (2026-09-25).
- Lighthouse's mobile LCP/FCP are simulated from an unthrottled local trace: every request that finished before the observed paint is charged to it. A deferred module script and eager below-fold images therefore inflate simulated FCP even when a throttled Chrome run paints in under a second. Measure both (scratchpad `lcp.mjs` pattern: CDP CPU 4x plus network emulation, PerformanceObserver for LCP).
- three.js r169 `renderer.clear()` does not re-enable the depth write mask. A material with `depthWrite: false` that renders last (the eye decals) leaves the mask off, so the next render z-fights and the shading shows ridges. Call `renderer.state.buffers.depth.setMask(true)` before `clear()`. Fixed in `renderTo()` in `labs/eddy-sticker-pack/js/shapes3d.js` (2026-10-22).
- `THREE.LatheGeometry` wants its profile ordered bottom to top. A top-to-bottom profile gives inward-facing faces, and the shape looks inside out. `lathe()` in `labs/eddy-sticker-pack/js/shapes3d.js` now reverses its input, so character profiles are written top to bottom (2026-10-22).
- Tiny courts diving (2026-10-22): divers walked in a straight line from the exit ladder to the tower or board, across the pool. `s.route` waypoints now keep them on the deck. The springboard's climb spot was inside its step blocks. Regression test: a scratchpad `dive-water.mjs` counted 18,596 frames on water before the fix and 0 after.
- Tiny courts (2026-10-22): every sport switch leaked about 14 GPU textures, including the sun's 2048 shadow map, because `dispose()` freed only the ground texture and geometry. It now frees materials, maps, instance buffers and `sun.dispose()`. `renderer.info.memory.textures` stays at 10 across switches.
- Tiny courts (2026-10-22): the scene loads 800 px early and rendered every frame off screen until the user scrolled it in and out. It now starts with the visibility observer's latest answer.
- Tiny courts (2026-10-22): one synchronous scene build made a 173 ms (desktop) and 464 ms (mobile, 4x throttle) long task during scroll. Most of it was painting about 200,000 specks onto a 2048 px canvas. The build is now async in phases, and ground canvases are sized at 80 px per metre.
- SilkWave (2026-10-22): with a zero-width canvas (hidden tab, mid-layout), `x / width` was NaN and `ramp()` threw on every frame. `draw()` now returns early when the canvas has no size.
- Canvas 2D `fillRect` with a negative width draws backwards from x. A clamped `Math.min(W, x + len)` end can come before its start, so plank seams painted past the floor edge. Skip the rect instead.

