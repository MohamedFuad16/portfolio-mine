# Decisions

## Index

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Use Vite React Static Portfolio | Accepted |
| ADR-002 | Generate Local Bitmap Portfolio Visuals | Accepted |
| ADR-003 | Use Live Project Screenshots And Public Logo Assets | Accepted |
| ADR-004 | Match Reference Portfolio Measurements | Accepted |
| ADR-005 | Use Local Avatar Decoration Layer | Accepted |
| ADR-006 | Prefer Local Icon Components And Bilingual Runtime Copy | Accepted |
| ADR-007 | Use Flip QR Avatar And Browser-Locale Copy | Accepted |
| ADR-008 | Download Remote Favicons Locally, Never Hotlink | Accepted |
| ADR-009 | Untrack node_modules and dist, Never Commit Build Output | Accepted |
| ADR-010 | Prevent Title Wrapping With Ellipsis, Not Just flex-wrap | Accepted |
| ADR-011 | Delay `visibility` Transitions Instead of Snapping Them | Accepted |
| ADR-012 | Give Every Interactive Element a Transitioned Hover State | Accepted |
| ADR-013 | Add GSAP + ScrollTrigger for Scroll Reveals via useGSAP | Accepted |
| ADR-014 | Timeline Dots: Keep Flat Original Style, Fix Only Alignment | Accepted |
| ADR-015 | Project Title: nowrap + Wrapping Heading Row | Accepted |
| ADR-016 | Adapt Reference-Image UI Patterns: Timeline Nodes, Segmented Locale Pill, Waveform Divider | Accepted |
| ADR-017 | GSAP Pass 2: Coordinated Hero Timeline, Per-Card Reveals, Scrubbed Parallax, ScrollTo Anchors | Accepted |
| ADR-018 | ScrollSmoother + DrawSVG Signature + SplitText: the Three Gotchas That Cost Debugging Time | Accepted |
| ADR-019 | Round-2 Reference Adaptations and Responsive Restructure | Accepted |
| ADR-020 | Drop the Signature Pin; Hero Order Is Name → Building → Handle | Accepted |
| ADR-021 | Signature redesign: single-stroke "hello"-style monoline (Hershey Script), replacing the Great Vibes fill | Accepted |
| ADR-022 | Signature: drop the red dot, add a perpetual tracing-highlight loop | Accepted |
| ADR-023 | Mobile layout polish, brighter dashed borders, and Android-jank mitigation | Accepted |
| ADR-024 | Tap effect: water-ripple rings (user pick) replacing the ring + dots | Accepted |
| ADR-026 | Hash-routed bilingual project detail pages + Qiita notes + headshot | Accepted |
| ADR-027 | Use fitted 16:9 project captures and lightweight system maps | Accepted |
| ADR-028 | Full-width technology rails, ClaudeShot, and mobile shared-element expansion | Accepted |
| ADR-029 | Expand the complete mobile project card and use a retro coin sound | Accepted |
| ADR-030 | Use the supplied achievement-completed interaction sound | Accepted |
| ADR-031 | Keep interactive controls silent | Accepted |

## ADR-001 - 2026-07-04 - Use Vite React Static Portfolio

Status: Accepted

Context: The workspace was empty and the request was to rebuild a portfolio clone with custom resume data.

Decision: Scaffold a Vite React single page site with static assets and embedded portfolio data.

Consequences: The site is easy to run and deploy as static files. Future content edits currently require changing `src/main.jsx`.

## ADR-002 - 2026-07-04 - Generate Local Bitmap Portfolio Visuals

Status: Accepted

Context: The reference portfolio depends on image-heavy project cards and a profile avatar. The local site needs visual assets without relying on private project screenshots.

Decision: Generate local PNG assets for the avatar and each project preview under `public/assets/`.

Consequences: The site remains self-contained and visually complete. Replacing previews with real screenshots later only requires swapping files with the same names.

## ADR-003 - 2026-07-04 - Use Live Project Screenshots And Public Logo Assets

Status: Accepted

Context: The portfolio needed to match the reference more closely with proper skill logos, real project previews, and actual project links.

Decision: Capture screenshots from live project URLs into `public/assets/`, use public Devicon/Simple Icons CDN assets for skill logos, and link each card to its live page and GitHub repo.

Consequences: Project cards now represent the real sites. Skill logos depend on public CDN availability at runtime, while project screenshots remain local.

## ADR-004 - 2026-07-04 - Match Reference Portfolio Measurements

Status: Accepted

Context: A later fidelity pass found that the clone still differed from the reference in QR behavior, font stack, button shadows, skill carousel direction, dashed borders, and project screenshot framing.

Decision: Adopt reference-derived measurements: Figtree/JetBrains fonts, 700px page shell with 18px side padding, 664px dashed sections, 120x124 avatar, 25px QR control backed by a real LinkedIn QR image, two skill marquees moving in opposite directions, 1.5px dashed borders, layered button shadows, and 300x170 project previews.

Consequences: The UI now tracks the reference more closely. The site uses the `qrcode` package to generate the static LinkedIn QR asset.

## ADR-005 - 2026-07-04 - Use Local Avatar Decoration Layer

Status: Accepted

Context: The reference profile image includes a decorative blossom layer around the avatar, and the previous local avatar looked too plain.

Decision: Generate a local transparent PNG decoration and layer it over the yacht profile photo while keeping the real QR control and hover card above it.

Consequences: The profile block now better matches the reference composition while remaining self-contained. The avatar container allows visible overflow, so child image clipping is handled by the profile photo itself.

## ADR-006 - 2026-07-04 - Prefer Local Icon Components And Bilingual Runtime Copy

Status: Accepted

Context: CDN brand/skill icons were fragile in the browser, and the portfolio needed a Japanese version plus more reference-like interactive sections.

Decision: Use `react-icons` for skills/contact marks, keep official company logos as local downloaded assets, add a React locale toggle for English/Japanese copy, use expandable work rows for details, and fetch the public GitHub contribution API at runtime with a local fallback.

Consequences: The main UI no longer depends on remote icon SVGs, Japanese copy can be switched locally without routing, work details match the reference dropdown behavior, and contribution totals can update when the public API is reachable.

## ADR-007 - 2026-07-04 - Use Flip QR Avatar And Browser-Locale Copy

Status: Accepted

Context: The avatar decoration was no longer desired, the QR behavior needed to match the reference flip interaction more closely, and the language control should not float at the top of the page.

Decision: Remove the decorative avatar overlay from the rendered UI, implement a two-sided avatar card that flips between the profile photo and LinkedIn QR, initialize locale from the browser language while persisting manual choices, move the language toggle into the profile handle row, and use the Hotel SUI Akasaka official favicon for a square readable work icon.

Consequences: The profile section is cleaner on mobile, the QR interaction is closer to the reference, Japanese/English defaults feel local to the visitor, and the Hotel SUI work tile remains visible at small sizes.

## ADR-008 - 2026-07-05 - Download Remote Favicons Locally, Never Hotlink

Status: Accepted

Context: The Japan Airlines work-experience logo was hotlinked directly from `https://www.jal.com/favicon.ico`. It rendered fine in some views but was reported broken in others — a live cross-origin favicon fetch has no guaranteed behavior across browsers/sessions (referrer policy, hotlink protection, caching), even though a plain `curl` fetch succeeded.

Decision: Download the JAL favicon locally (`public/assets/jal-favicon.png`, converted from `.ico`) and reference it the same way Altius Link and Hotel SUI Akasaka's logos already are. No work-experience logo should be a live remote URL.

Consequences: One less network dependency, consistent with ADR-006's rationale for the other two logos. Any new work-experience entry should download its logo locally rather than linking the company's own site.

## ADR-009 - 2026-07-05 - Untrack node_modules and dist, Never Commit Build Output

Status: Accepted

Context: The first commit accidentally included the full `node_modules/` (182MB) and a `dist/` build that had drifted from source (stale asset hashes), because the repo had no `.gitignore`. The stale `dist/` was actively confusing (task 1 of the 2026-07-05 cleanup was written specifically to deal with it).

Decision: Add a `.gitignore` covering `node_modules/`, `dist/`, `.tools/` (a locally downloaded `gh` CLI binary, unrelated to the project), and `.DS_Store`; `git rm --cached` the already-tracked copies.

Consequences: `dist/` must be rebuilt locally (`npm run build`) before any static-host deploy that expects it — it is no longer checked in. Anyone cloning fresh needs `npm install`. This is standard practice and avoids the exact staleness bug this ADR responds to.

## ADR-010 - 2026-07-05 - Prevent Title Wrapping With Ellipsis, Not Just flex-wrap

Status: Accepted

Context: "Hotel SUI Akasaka" (and potentially other long or Japanese-locale company/role names) wrapped mid-word in the Work Experience list on desktop, because `.experience-item h3` had no `flex-wrap` and nothing stopped the anchor's text node from breaking when the row ran out of space. A narrower mobile-only media query already worked around this by letting the status badge drop to its own line, but nothing protected the desktop layout or the name text itself.

Decision: Wrap the company name in a `.company-name` span with `white-space: nowrap; text-overflow: ellipsis`, set `min-width: 0` through the whole flex/grid chain (`.experience-summary` → `.experience-copy` → `h3` → `a`) so shrinking is actually possible, and add `flex-wrap: wrap` to the base (desktop) `h3` rule so the status badge can drop to its own line before the name is forced to wrap.

Consequences: Company names never break mid-word at any width; at the narrowest tested width (320px) names ellipsize instead (e.g. "Alt…"), which is an intentional, accepted trade-off over a broken two-line wrap.

## ADR-011 - 2026-07-05 - Delay `visibility` Transitions Instead of Snapping Them

Status: Accepted

Context: An animation/transition audit found the contribution-heatmap tooltip's fade-out was invisible in practice: `opacity` was transitioned but `visibility` (paired for accessibility/hit-testing) was not, so on mouse-out `visibility: hidden` applied instantly and the element stopped rendering before the opacity transition had a chance to play. Same root-cause class of bug could recur anywhere `opacity` + `visibility` are paired.

Decision: Pair `visibility` with its own zero-duration transition and a `transition-delay` equal to the fade duration on the "hide" direction (`visibility 0ms linear 140ms`), and zero delay on the "show" direction. Applied here to the heatmap tooltip; use the same pattern for any future opacity+visibility pairing on this site.

Consequences: Fade-outs are now actually visible. This is a general technique worth remembering, not a one-off fix — any new hover/tooltip treatment using `visibility` (rather than just `display`) should follow it.

## ADR-012 - 2026-07-05 - Give Every Interactive Element a Transitioned Hover State

Status: Accepted

Context: A full animation audit found most primary interactive elements (nav/contact/project buttons, locale toggle, QR flip button, work-experience company links, the expand chevron, skill pills) either had no hover state at all or changed color/background instantly with no `transition`, which reads as abrupt/unpolished next to the site's otherwise-animated pieces (avatar flip, marquee, click-burst, accordion).

Decision: Add a consistent ~160ms ease transition plus a subtle hover treatment (background lighten, ~1px lift for pill buttons, color brighten for plain links/icons) to every clickable element site-wide, rather than leaving some animated and others static.

Consequences: Any new button/link component added to this site should follow the same convention — a `transition` on the properties its `:hover` rule changes, using ~160ms ease unless there's a specific reason to differ (e.g. the 220-260ms used for the chevron rotate and accordion, which are larger/slower motions by design).

## ADR-013 - 2026-07-05 - Add GSAP + ScrollTrigger for Scroll Reveals via useGSAP

Status: Accepted

Context: The site had CSS-only motion (marquee, avatar flip, click-burst, accordion) but no entrance/scroll animation. The user asked for smooth scroll animations using the official GSAP skills (github.com/greensock/gsap-skills).

Decision: Add `gsap` + `@gsap/react` (installed with pnpm — this project's `node_modules` is pnpm-managed, so raw `npm install` crashes with an arborist `isDescendantOf` error). Register `ScrollTrigger` + `useGSAP` once at module load. All animation lives in a single `useGSAP(() => {...}, { scope: mainRef })` in `App`, following the official gsap-react skill (scoped selectors, automatic cleanup). Wrap everything in `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` so reduced-motion users get the natural (already-visible) layout with no `from()` applied. Reveals: hero stagger on load, section-title slide-in, generic block fade-ups, timeline line draw + row stagger, project-card stagger, contribution-grid cell ripple.

Consequences: New scroll/entrance animations should be added inside the same `useGSAP` matchMedia block, not as ad-hoc effects. Bottom-of-page elements (e.g. `footer`) must use a start the page can actually scroll to reach (`top bottom-=40`), not `top 90%`, or they never fire and stay at `opacity:0`. Install new deps with pnpm, never npm.

## ADR-014 - 2026-07-05 - Timeline Dots: Keep Flat Original Style, Fix Only Alignment

Status: Accepted

Context: The timeline status dots sat ~1.5px left of the dashed line's center. A richer dot treatment (glow ring + core highlight + pulsing "active" ring) was tried, but the user judged the perpetual pulse/glow to be bad UX and asked to keep the plain flat dot look.

Decision: Keep the original flat colored 10px dot (no glow, no pulse, no pseudo-elements) but center it on the line: `left: -23.5px` (`-22.5px` under the 760px breakpoint) plus `top: 33px; transform: translateY(-50%)` to also vertically center it on the summary row. Verified all dots and the line share the same center X in the browser.

Consequences: Prefer alignment/positioning fixes over decorative motion for the timeline nodes. If the dot size changes, recompute `left` so `itemLeft + left + width/2` still equals the line's center.

## ADR-015 - 2026-07-05 - Project Title: nowrap + Wrapping Heading Row

Status: Accepted

Context: At the full 700px layout the "Tutor-System" project title broke mid-word at the hyphen because the flex heading squeezed the `h3` to fit the Live/GitHub buttons.

Decision: Wrap the title text in `.project-title { white-space: nowrap }`, make `.project h3` and `.project-actions` `flex-shrink: 0`, and let `.project-heading` `flex-wrap: wrap` so the action buttons drop to a second line instead of crushing the title.

Consequences: Long titles now stay on one line; if a title + actions can't fit, the actions wrap below rather than the title breaking. This supersedes the ellipsis approach (ADR-010) for project titles specifically — project titles should never be truncated.

## ADR-016 - 2026-07-06 - Adapt Reference-Image UI Patterns: Timeline Nodes, Segmented Locale Pill, Waveform Divider

Status: Accepted

Context: The user supplied three reference screenshots (a voice-agent phone UI with a Talk/Chat pill toggle and a monochrome waveform over a dotted baseline, and a "Tasks & Events" card with a node timeline: filled/checked circles for done items) and asked to adapt whatever fits the dark dashed-border theme, plus richer GSAP motion.

Decision: Three adaptations. (1) Work-experience timeline nodes: past jobs are 16px hollow circles (#17191b bg, #3d4144 border) containing a small lucide `Check`; the active job is a solid #10e777 circle with no check (semantics: checked = finished, green = live). No pulse/glow — static, per the earlier ADR-014 UX ruling. Node centering math: `left = -(18.5 + width/2)` desktop, `-(17.5 + width/2)` mobile. (2) The single dashed locale button became a `.locale-switch` segmented pill (EN | 日本語) modeled on the reference's Talk/Chat control; both options always visible, `aria-pressed`, active side highlighted. (3) A decorative `WaveDivider` (dotted baseline + 17 centered bars, heights hardcoded in `waveHeights`) sits between the contact card and footer.

Consequences: Timeline semantics are now encoded in the node itself (check vs solid green), so a new "current" job entry needs `tone: 'green'` and past entries any other tone. The `copy.*.lang` string and the old `.locale-toggle` styles are gone; locale is set directly per button, not toggled.

## ADR-017 - 2026-07-06 - GSAP Pass 2: Coordinated Hero Timeline, Per-Card Reveals, Scrubbed Parallax, ScrollTo Anchors

Status: Accepted

Context: The first GSAP pass (ADR-013) used uniform fade-ups. The user asked for smoother, more advanced motion.

Decision: Inside the same single `useGSAP`/matchMedia block: hero is one `gsap.timeline` (avatar scale+rise, then identity/intro/actions overlapping via negative position offsets) with `power3.out`; project cards get per-card triggers (not one container trigger) plus a `.tags span` cascade and a scrub-driven parallax on `.project-shot img` (`fromTo` yPercent -5→5 at constant `scale: 1.12`, `ease: 'none'`, trigger top-bottom→bottom-top); timeline adds a node pop (`scale` from 0, `back.out(2.4)`) — safe on `.dot` because GSAP parses the existing `translateY(-50%)` into yPercent and preserves it; contribution cells stagger `from: 'random'`; wave bars grow `from: 'center'`; the hero `#projects` anchor uses ScrollToPlugin via a `contextSafe` click handler (reduced-motion users keep the native jump).

Consequences: Parallax needs the 1.12 scale to hide the ±5% drift — if the drift is increased, increase the scale margin to match. Event handlers added inside the matchMedia callback must be removed in its single returned cleanup. Verified: all reveal targets reach opacity 1 on scroll-through, parallax transform provably changes sign across the viewport, EN/JA both overflow-free at 375/desktop, production build clean.

## ADR-018 - 2026-07-06 - ScrollSmoother + DrawSVG Signature + SplitText: the Three Gotchas That Cost Debugging Time

Status: Accepted

Context: Added GSAP's (now-free, v3.13+) bonus plugins — ScrollSmoother, DrawSVGPlugin, SplitText — plus an avatar lightbox and a Great Vibes "Mohamed Fuad" signature drawn on scroll.

Decision & gotchas (all verified empirically in this session):
1. **Scoped useGSAP contexts can't resolve ancestor selectors.** `ScrollSmoother.create({ wrapper: '#smooth-wrapper' })` inside `useGSAP(..., { scope: mainRef })` resolved the selector INSIDE `main`, found nothing (the wrapper is main's ancestor), and silently auto-created its own wrapper — smoothing dead, layout mangled, signature trigger at end-state. Fix: pass DOM refs (`smoothWrapperRef.current`) to any plugin whose targets live outside the scope. `position: fixed` UI (click-burst layer, avatar lightbox) must sit OUTSIDE `#smooth-content` or transforms break it.
2. **opentype.js `toPathData()` emits fused numbers.** The generated d contained `...152.20Q...` — "152.2" and "0" with no separator. The browser parses up to the bad token and silently discards the rest: only "Moh" rendered, `getBBox()` 186 of 547 units, while the DOM attribute looked complete (13.5k chars). Fix: serialize `path.commands` manually with explicit spaces (scratchpad `gen-signature.js`); also `opentype.load()` is dead in v2 (use `parse(arrayBuffer)`), and Great Vibes' GSUB tables crash `font.getPath()` for full strings — assemble glyph-by-glyph with `charToGlyph` + `getKerningValue` + advances.
3. **Load-time staggered from()-tweens on children of flex rows caused the "OR pushed up" bug.** Children of `.actions` froze with inconsistent inline `translateY(14px)` (tab-visibility rAF throttling + per-child CSS transform transitions fighting GSAP). Fix: entrance animations animate CONTAINERS (`.profile`, `.intro`, `.actions`) with `clearProps: 'transform,opacity'` in defaults; per-child load-time staggers are reserved for elements with no CSS transform transitions (SplitText chars, which revert on complete).

Consequences: any future ScrollSmoother/plugin call inside the scoped useGSAP must use refs for out-of-scope elements; regenerating the signature means editing the scratchpad generator, never toPathData; keep entrance animation at container granularity. Desktop (≥761px) pins the signature and scrubs the draw (`start: 'center 75%', end: '+=300'` — chosen so the pin's end stays reachable given the short tail below); mobile plays a timed draw on enter.

## ADR-019 - 2026-07-06 - Round-2 Reference Adaptations and Responsive Restructure

Status: Accepted

Context: User supplied more reference shots (integration-pipeline card with floating icons; "hello" DrawSVG hero) and reported: work-experience hover rect flush against the icon, mobile work rows collapsing, the misplaced "OR", untouched skills listed, and wanted the waveform to keep animating.

Decision: (a) `.experience-summary` gets `padding: 0 12px; margin: 0 -12px` (10px at ≤560px) so the hover pill breathes around the icon without shifting layout. (b) New ≤560px experience layout: 3-column grid (icon spans 2 rows | name+role | chevron) with the date on its own row under the role — replaces the cramped 82px right date column; `.company-name` un-ellipsizes there (wraps naturally). (c) Skills pruned to the 15 techs actually used in projects/site (removed Java, Express, Spring Boot, Docker, MySQL, Firebase, Linux, Windows, Postman, Swagger, Supabase, Netlify, Render, Notion); marquee rows resliced 8+8. (d) Pipeline-reference adaptation: every `.skill-mark` floats on an infinite random sine yoyo. (e) Wave divider bars: after the grow-in, each bar runs an infinite `repeatRefresh` random scaleY yoyo (quiet equalizer). (f) Avatar lightbox: photo click rotates/scales the image into a fixed backdrop-blurred overlay (paused GSAP timeline, play/reverse via React state); backdrop click or Escape closes; honors prefers-reduced-motion with 0-duration.

Consequences: adding a skill means checking it's actually used in a project first. The lightbox timeline pattern (paused timeline + state-driven play/reverse + onReverseComplete visibility) is the template for future modals.

## ADR-020 - 2026-07-06 - Drop the Signature Pin; Hero Order Is Name → Building → Handle

Status: Accepted (amends ADR-018/019)

Context: The pinned signature scrub's pinSpacing spacer read as a large blank gap between "Let's Connect" and the signature on desktop, and the user wanted "Building AI agent tools" directly under the name.

Decision: The signature uses the timed 2.4s DrawSVG play on enter (`start: 'top 88%'`) at every breakpoint — no pin, no scrub — which collapsed the matchMedia back to the single reduced-motion condition. Identity order is now h1 → .building → .handle → .meta, with `.building` made `display: flex; width: fit-content; margin-top: 8px` (inline-flex ignores vertical margins).

Consequences: If a pinned moment is ever reintroduced, budget real content below it — a pin near the page end always manufactures blank space out of its spacer.

## ADR-021 - 2026-07-06 - Signature redesign: single-stroke "hello"-style monoline (Hershey Script), replacing the Great Vibes fill

Status: Accepted (supersedes the signature half of ADR-018)

Context: The user wanted the signature to match a reference "hello" logo — a single continuous pen line that flows in flat from the edge, rises into a rounded connected cursive, flows back out flat, with a red period-dot. The old signature was a filled Great Vibes outline (varying-width calligraphy), which is the wrong medium entirely: a filled outline can't be drawn as one pen stroke and doesn't read as monoline. Two rejected iterations taught the requirements precisely: (1) a separate straight baseline running *under* the word is wrong — in the reference the flat line and the word are the SAME stroke; (2) EMS Decorous Script is too spiky/angular and the stroke was far too thin.

Decision: Signature is now a true single-line (centre-line) plotter font — **Hershey Script** (rounded, connected cursive) from oskay/svg-fonts — rendered as ONE continuous `stroke` path (`fill: none`), not a fill. The generator (session scratchpad `build-v3.mjs`) parses the SVG font's `<glyph>` centre-line `d` data, lays out "Mohamed Fuad" with per-glyph advances, flips Y (font y-up → SVG y-down), shifts to x≈0, then splices the word between a flat lead-in (`M leftEdge 0 L … C … up into the first glyph`) and a flat lead-out (`C down-to-baseline … L rightEdge 0`) so the baseline and the name are one stroke. Exports: `signatureViewBox`, `signaturePath`, `signatureDot {cx,cy,r}` (red #ff241f circle), and `signatureStrokeWidth` (in user units; driven from JS via the `strokeWidth` attribute — CSS `stroke-width` must NOT be set on `.sig-name` or it would override the attribute since author CSS beats presentation attributes). Stroke ~5px on-screen at the `min(680px,92%)` display width, `stroke-linecap/linejoin: round`. DrawSVG draws the whole compound path as one gesture (3s), then the dot pops (`back.out(3)`).

Consequences: Regenerating means re-running the scratchpad generator against a single-line SVG font, never opentype.js/toPathData (those emit filled outlines). Font choice is constrained to *centre-line* fonts (EMS/Hershey families) because the draw effect needs open strokes; connected+rounded rules out the print-style EMS fonts and the spiky Decorous Script, leaving Hershey Script. `signature-path.js` no longer exports `signatureBaseline` (the baseline is spliced into `signaturePath`).

## ADR-022 - 2026-07-06 - Signature: drop the red dot, add a perpetual tracing-highlight loop

Status: Accepted (amends ADR-021)

Context: The static red period-dot felt inert; the user wanted the signature to feel continuously alive — a "nice GSAP animation that constantly traces the handwriting."

Decision: Removed the `<circle class="sig-dot">` (and its import; `signatureDot` is still exported by the generated module but unused). Added a second identical overlaid path `.sig-trace` (same `d`, same `strokeWidth`) that a glowing highlight travels along forever. On scroll-in the base `.sig-name` draws itself (2.6s) while its opacity settles to 0.42 (dimmed so the sweep reads); then an infinite `repeat:-1, yoyo:true` `fromTo` moves a ~15%-wide DrawSVG window (`0% 15%` → `85% 100%`, `sine.inOut`, 2.9s) back and forth along the whole compound path — a soft light retracing the pen line. The tracer is white with layered `drop-shadow` glows and is CSS `opacity:0` by default, flipped to 1 only inside the reduced-motion-gated GSAP block (so reduced-motion users see just the crisp static line at 0.9 opacity, no sweep). yoyo (not one-directional `repeat`) is deliberate: it is seamless — a one-way loop would jump the highlight from the right end back to the left.

Consequences: The footer signature now rests as a dim monoline with a continuously travelling glow. Two paths share `signaturePath`; if regenerated, both pick it up automatically. Keep the tracer's opacity default in CSS at 0 so the animation-off path stays clean.

## ADR-023 - 2026-07-06 - Mobile layout polish, brighter dashed borders, and Android-jank mitigation

Status: Accepted

Context: Mobile-review feedback: (1) too little space between the skills marquees and Work Experience; (2) project card left/right dashed borders invisible on a real OLED phone; (3) five tech tags wrapped as an ugly 4+1; (4) "Let's Connect" links wrapped 3+1; (5) animations reportedly janky on Android; (6) the signature's lead-in into the M looked stiff.

Decision:
- Spacing: `.skills-marquees` margin-bottom 1px→26px.
- Borders: the shared `.dashed` colour #444→#56595d. #444 on the #0b0d0e page is technically present (verified in-engine) but too low-contrast to read on OLED at low brightness — brightening is the fix, not a layout bug.
- Tags: `.tags` is now `display:grid; grid-template-columns:repeat(3,auto); justify-content/items:start` at ALL widths (not a media-query override) — every project has exactly 5 tags, so this is a deterministic 3+2 with no orphan. (A 4-tag project would become 3+1; revisit if that ever ships.)
- Contact: `.contact-links` becomes `grid` 1fr/1fr at ≤470px (even 2×2); stays flex row above.
- Android jank: the biggest cost was the perpetual `.sig-trace` — a `drop-shadow`-filtered path whose `stroke-dashoffset` changes every frame forces filter re-rasterisation. Reduced to a single small-radius glow AND the trace tween is now created `paused` with a ScrollTrigger `onToggle` so it only runs while the signature is on screen. (ScrollSmoother already uses `smoothTouch:false`, so mobile scroll was already native — not the culprit.)
- Signature lead-in: replaced the near-vertical rise with a long near-flat line easing up via a gentle S into the M (two cubics; see `build-v3.mjs`), chosen from a 4-variant offline render.

Consequences: `.tags` grid assumes ~5 tags per project; the trace only animates in-view. If the dashed colour ever feels too loud on desktop, it can be split per-breakpoint, but one value currently reads well on both.

## ADR-024 - 2026-07-06 - Tap effect: water-ripple rings (user pick) replacing the ring + dots

Status: Accepted

Context: The user found the tap "wobble" (a ring + 6 flying particle dots) unremarkable and asked for a nicer effect, keeping the same idea (chime + ripple wherever you touch). Offered four options; user chose water-ripple rings.

Decision: `.click-burst` now renders three staggered concentric rings (`<i>` ×3) that expand and fade, plus a soft radial center flash (`::before`). Key detail: the rings animate `width`/`height` (0→96px) rather than `transform: scale`, so the 1.5px border stays a hairline instead of thickening as it grows. Rings are staggered (delays 0/100/200ms) with decreasing opacity (0.72/0.5/0.34) for a rippling-outward read. The React removal timeout was bumped 900ms→1050ms so nodes outlive the 780ms + 200ms stagger. The chime (`playChime`) is unchanged.

Consequences: Effect is pure CSS keyframes off transient DOM nodes (no JS per-frame), so it's cheap. If more ring density is ever wanted, add `<i>` elements and a matching `:nth-child` delay/opacity.

## ADR-026 - 2026-07-08 - Hash-routed bilingual project detail pages + Qiita notes + headshot

Status: Accepted

Context: The user wanted every project to open its own in-depth page (same UI/style, GSAP transitions, EN/JA, data pulled from the GitHub repos), the "Thoughts in words" link pointed at a Qiita article instead of GitHub, and a professional headshot as the profile photo.

Decision:
- **Routing:** hash-based, no router lib and no Vercel rewrite config. `route` mirrors `window.location.hash`; `activeProject` = the project whose `slug` matches `#/project/<slug>`. The detail view renders as a fixed full-screen overlay (`.project-detail`, z-index 900 — below the 1000 ripple layer so taps still ripple), a sibling of the smooth-scroll shell (like the avatar lightbox), so the main page's ScrollSmoother/ScrollTrigger graph is never disturbed.
- **Open/close animation:** `shownProject` holds what's rendered. Navigating in mounts it and a `useGSAP([shownProject])` runs the entrance (fade + `.pd-animate` stagger). Navigating away animates out (`autoAlpha`) via a `useEffect([activeProject])` then clears `shownProject`. `closeProject` uses `history.back()` so the browser back button and the in-page back button share one path; body scroll is locked while open.
- **Data:** each project gained `slug` + `detail: { tagline, overview, features[], flow? }`, every field `{ en, ja }`, written from the repos' READMEs. Codex has no `flow`, so "How It Works" is conditionally hidden.
- **Entry point:** `.project-shot` became a `<button>` (reset styles) with a hover/focus "View details" hint; clicking sets the hash.
- **Qiita:** `SiQiita` added to `brandIcons`; the notes link uses `QIITA_ARTICLE` with the green logo.
- **Headshot:** `public/assets/profile.jpg` (sips → 1000×750 JPG, ~130 KB) replaces `profile-yacht.jpg` in the avatar + lightbox.

Consequences: New projects need a `slug` + `detail` block to get a page. The overlay assumes single-level routing (`#/project/<slug>`). A **new site logo is still pending** — the user will supply the file.

## ADR-027 - 2026-07-21 - Use fitted 16:9 project captures and lightweight system maps

Status: Accepted

Context: The live-project previews had mixed dimensions, including a 1280×1021 Japanese WebDrop capture, while cards and detail heroes cropped with `object-fit: cover`. Project detail copy also read like README or AI-generated marketing text, and the detail pages did not explain system architecture visually.

Decision: Recapture every browser-based live project in English and Japanese at 1440×810. Render previews with `object-fit: contain` and use a 16:9 detail hero. Rewrite each project's tagline, overview, features, and workflow in direct first-person portfolio language based on the current repository README. Add a localized four-step `ProjectArchitecture` flow rendered with semantic HTML and CSS instead of shipping a Mermaid runtime. The flow is horizontal on desktop and vertical on mobile. Also label contribution data as a rolling 12-month total because the runtime endpoint uses `y=last`.

Consequences: Project screenshots no longer lose interface edges. New project details should include four concise architecture steps with localized labels and descriptions. The system map stays small, accessible, theme-consistent, and dependency-free; use Mermaid only if a future project needs branching too complex for the four-step component.

## ADR-028 - 2026-07-21 - Full-width technology rails, ClaudeShot, and mobile shared-element expansion

Status: Accepted

Context: Tutor-System and Codex Account Switcher showed uneven empty space because the image and five technology chips competed inside a narrow two-column card. The user also preferred ClaudeShot as the fourth project, wanted the Tokai University logo visible, requested the App Store-style card expansion from rselmi.com's card-expand lab on mobile, and wanted the page click sound to feel like a coin rather than a water droplet.

Decision:
- Project cards keep a two-column preview/body row, while `.project-tech` spans both columns below it. Its five chips use a no-wrap rail; at the mobile breakpoint the chip type and padding reduce just enough for every current project to fit at 390px. Tutor's card preview is scaled to 1.12 so the central study cards read clearly without changing the source screenshot.
- Replace Codex Account Switcher with ClaudeShot, using the repository README as the source for EN/JA copy and a local SVG workflow preview built around the repository icon. ClaudeShot has only a GitHub action because it has no public web demo.
- Add the official Tokai University English wordmark beside the localized faculty label and link it to the university site.
- Mobile opening follows the reference recipe directly: measure the tapped `.project-shot`, mount the detail overlay in its final layout, then animate the detail `.pd-shot` from the measured rectangle to its final rectangle. Duration is 440ms with a calm `power3.out` curve; the detail copy begins revealing after 200ms. Reduced-motion users skip the transform. Desktop keeps the existing entrance.
- Replace the synthesized three-note Web Audio chime with the local 125ms "Arcade game jump coin" preview from Mixkit (`coin-tap.mp3`). The asset is small enough to preload and clone per interaction, allowing overlapping taps without maintaining an AudioContext.

Consequences: New project cards should keep five concise technology chips if they are expected to fit the current single-line mobile rail. Projects without a public demo should omit `live`; action rendering is conditional. The mobile transition depends on the preview and detail hero both remaining 16:9. If either shape changes, update the rect interpolation rather than adding a fixed clone size.

## ADR-029 - 2026-07-22 - Expand the complete mobile project card and use a retro coin sound

Status: Accepted (supersedes the mobile-transition and audio portions of ADR-028)

Context: The first card-expand pass animated only the project screenshot into the detail hero, so it did not reproduce the supplied reference's defining behavior: the complete card becomes the full-screen surface. The 125ms click sample also read as a short tap instead of an arcade coin event, and the official university wordmark repeated text already present in the profile metadata.

Decision: On mobile, measure the complete tapped `.project`, store its `outerHTML`, and render that markup as an inert cloned face inside the fixed `.project-detail` surface. Animate the surface from the card rectangle to the viewport over 440ms with the reference `cubic-bezier(0.32, 0.72, 0, 1)` curve while the underlying page scales to 0.95 and fades to 0.65. Fade the clone into the real detail content during the latter part of the expansion. On close, reverse the surface into the measured source card over 380ms, restore the page, and only then unmount the detail route and reveal the original card. Reduced-motion and direct-link paths show the detail immediately. Replace `coin-tap.mp3` with the approximately 1.03-second Mixkit retro game coin sample at `retro-coin.mp3`, and crop the Tokai SVG to the official symbol path only.

Consequences: The transition no longer depends on the preview and detail hero sharing a 16:9 shape; it depends on preserving clone-compatible project-card markup and CSS. Changes to `.project` structure must be checked both in the list and inside `.pd-expand-face`. The cloned face must remain inert and hidden from assistive technology. The renamed sound asset avoids stale caching of the old sample, and university name/faculty text stays in localized HTML rather than being baked into the logo.

## ADR-030 - 2026-07-22 - Use the supplied achievement-completed interaction sound

Status: Accepted (supersedes the audio choice in ADR-029)

Context: After reviewing the retro coin sample in the live portfolio, the user supplied Mixkit's `mixkit-achievement-completed-2068.wav` and requested that exact sound instead.

Decision: Copy the supplied WAV unchanged into the public asset directory as `achievement-completed.wav`, preload it once, and clone it for overlapping page, QR, and rocket interactions. Rename the JavaScript identifiers to describe an achievement sound instead of a coin. Remove the superseded `retro-coin.mp3` asset so only the selected interaction sound ships.

Consequences: The selected sound is a 3.6-second stereo PCM WAV and is substantially larger than the prior MP3, but preserving the provided file avoids altering the sound the user explicitly chose. Future replacements must update both the public path and the preloaded `Audio` source.

## ADR-031 - 2026-07-22 - Keep interactive controls silent

Status: Accepted (amends the playback scope in ADR-030)

Context: The global window click listener made the achievement sound play during normal button and navigation use, which made the site feel noisy. The user requested that button clicks remain silent.

Decision: Treat buttons, links, form controls, summaries, labels, elements with `role="button"`, and contenteditable elements as interactive targets and skip audio whenever the click originates inside one. Remove the explicit sound calls from the rocket and QR buttons. Keep ripple creation separate so visual tap feedback can remain without forcing audio.

Consequences: The achievement sound now belongs only to clicks on non-interactive page surfaces. New custom controls must use semantic HTML or an appropriate role so they automatically inherit the silent behavior.

## ADR-032 - 2026-07-25 - Whole experience card toggles, dots re-anchored

Status: Accepted

Context: The work rows only expanded via the small chevron, which is a poor target on touch. Making the row clickable required a positioned container, which silently moved the timeline dots off the dashed line.

Decision: Use the stretched-link pattern — the chevron stays the single real control and its `::after` covers the whole `.experience-summary`, which becomes `position: relative`. The company link is raised above it with `z-index`. `.dot` stays inside the summary and is centred with `top: 50%`, with `left` compensating for the summary's negative margin per breakpoint.

Consequences: One button, full keyboard access and no nested interactive elements. Dots now centre on rows of any height (fixes the wrapped "Altius Link (formerly KDDI Evolva)" row on mobile). The `left` value is coupled to the summary's margin — noted in errors.md.

## ADR-033 - 2026-07-25 - Contribution snapshot refreshed by GitHub Actions

Status: Accepted

Context: The grid depended on a single third-party API call at page load, so a slow or failed request left visitors looking at synthetic placeholder data.

Decision: `scripts/fetch-contributions.mjs` writes `public/assets/contributions.json`, run every 6 hours by `.github/workflows/update-contributions.yml`, committing only when the data actually changed. It prefers GitHub's own GraphQL API (Actions `GITHUB_TOKEN`) and falls back to the public mirror. The client reads the committed snapshot first, then still refreshes from the live API so same-day pushes appear.

Consequences: Accurate data on first paint with no API dependency, and the workflow needs no extra secret. The snapshot is committed, so contribution refreshes appear in git history.

## ADR-034 - 2026-07-25 - Border beam and thinking orb

Status: Accepted

Context: The user asked for the effects from beam.jakubantalik.com and orbs.jakubantalik.com.

Decision: Use the published packages. `border-beam` wraps the profile photo (`size="md"`, colourful, brightness 1.9) and `thinking-orbs` replaces the sparkle on the "Building AI agent tools" line, where an agent-UI motif fits the copy. Both stand down under `prefers-reduced-motion` via a shared `useReducedMotion` hook.

Consequences: Two small runtime dependencies. Forcing `overflow: visible` through BorderBeam's wrappers broke its own clipping and bled a square halo around the QR toggle, so the avatar is now wrapped in `.avatar-shell`: the beam fills it and keeps its clipping, and the QR button is a sibling pinned to the corner with a page-coloured ring so the beam passes cleanly behind it. The orb renders at the 64px preset displayed at 30px (its own tuning, not a scaled 20px orb).

## ADR-035 - 2026-07-25 - Project detail gains a real flow chart

Status: Accepted

Context: The detail pages had a four-step system map. The user wanted an actual system-architecture flow chart alongside it, not a stack of layers.

Decision: `ProjectFlowChart` renders SVG from per-project `detail.stack` data: stages run down a centre lane with optional `branch` nodes to the right, using flow-chart shapes (rounded terminators, rectangles, a decision diamond, a cylinder datastore) and labelled arrows. SVG keeps shapes and arrows aligned at any width without a diagram runtime.

Consequences: Genuine flow charts that match the dark dashed UI. Geometry is tuned twice — `FLOW_WIDE` for desktop and `FLOW_COMPACT` for phones, chosen live by `useCompactFlow` — because a 620-unit viewBox squeezed into ~325px rendered the type at ~7px. In compact mode the side arrow is too short to carry a label, so branch labels sit above their box. Node labels must stay short because SVG text does not wrap.

## ADR-036 - 2026-07-25 - Pin detail content width during the mobile expand

Status: Accepted

Context: Opening a project on mobile animates the overlay's width from the card rectangle to the viewport. `.project-detail-inner` is sized `min(760px, 100% - 32px)`, so it tracked that animation: the tagline re-wrapped mid-flight (70px -> 47px) and every heading below jumped ~18px, which read as the title bouncing.

Decision: Pin the inner column to its final width and centred offset for the duration of the open and close (`pinnedInnerLayout()`), then `clearProps` so CSS resumes owning layout.

Consequences: Measured title shift during the expand is now 0px with no re-wrap. Only the frame animates; the text never reflows.

## ADR-037 - 2026-07-26 - Fix real bugs found after the previous session's mobile "verification"

Status: Accepted

Context: The previous session reported mobile verification as clean, but real device/real-scroll testing surfaced two genuine regressions it missed: a colored glow bleeding out past the avatar's rounded corner, and the entire Work Experience list / contribution grid rendering as permanently empty (both stuck at their GSAP `opacity:0` "from" state).

Decision:
- Avatar glow: `.avatar-beam` gains `contain: paint`. BorderBeam's own `overflow: hidden` does not reliably clip its blurred bloom layer in this engine; `contain: paint` is a stronger guarantee that forces every descendant, filtered or not, to clip to the box.
- Contribution grid: added a `useEffect(() => ScrollTrigger.refresh(), [cells, total])` inside `ContributionGrid`. Cells key by `day.date`, and fallback/real data share enough recent dates that React reuses the DOM nodes across the swap rather than remounting, leaving the cell-reveal ScrollTrigger's cached trigger position stale (measured before the real data changed the section height) and the tween stuck at its initial state.
- Experience rows appeared empty during investigation too, but that traced back entirely to `javascript_exec`-driven `scrollIntoView()` not producing a real scroll for ScrollSmoother/ScrollTrigger to react to — not a code bug. A real scroll/tap resolved it immediately.

Consequences: Verification of scroll-triggered or animated UI in this environment must use a real scroll/click gesture (the `computer` tool), not JS-dispatched scrolling — see errors.md. Any other component that swaps fallback data for fetched data under a scroll-triggered reveal should follow the same `ScrollTrigger.refresh()` pattern.

## ADR-038 - 2026-07-26 - Avatar glow offset on mobile, bio split, and a real mobile card-expand bug

Status: Accepted

Context: Three more issues surfaced from the user's own device testing. (1) The border beam's glow appeared visibly offset from the avatar photo specifically on mobile. (2) The bio paragraph was too long as one block. (3) Despite the earlier "fixed" claim, opening a project's mobile card-expand still glitched on a real phone (title jumping, appears to reverse) even though it was clean on desktop and in every synthetic-click test.

Decision:
- Avatar glow offset: `.avatar` had its own hardcoded size (120x124, overridden to 108x108 at <=760px) that was never mirrored onto `.avatar-shell` (which sizes the beam). Removed the duplication: `.avatar` and `.avatar-beam` are now always `width:100%; height:100%;`, and only `.avatar-shell` carries pixel sizes per breakpoint — one sizing authority, so the beam can never drift out of sync with the photo again.
- Bio: split into `introParagraphs: [para1, para2]` per locale, rendered as two `<p>` inside an `.intro` div (was a single `<p>`), with a 14px gap between them.
- Mobile card-expand: the real bug was that the origin card's rect was measured once at click time and reused later inside the entrance/exit `useGSAP` effects, which only run after `window.location.hash` completes an async round trip. GSAP ScrollSmoother's touch-flick momentum can still be moving content during that gap on a real device — something no synthetic click can reproduce, which is exactly why prior verification missed it. Fixed by re-measuring the live `detailOriginCardRef` element fresh at the moment each animation actually builds (`measureOrigin()`), for both open and close, instead of carrying a click-time snapshot through the async re-render.

Consequences: Any future "measure once, animate later" pattern in this codebase must account for the gap between a user gesture and the React effect that consumes the measurement — re-measure at the latest synchronous point instead of assuming the DOM hasn't moved. Verified this pass with a real scroll-then-immediately-tap sequence (the worst case for stale measurements), not just a settled click.

## ADR-039 - 2026-07-26 - Excalidraw-style hand-drawn flow chart

Status: Accepted

Context: The user wanted the project detail flow charts redesigned to match a specific reference (rounded colored-outline boxes, a legend-square motif, and — explicitly — "this exact font"), which is Excalidraw's own diagram style and its bundled hand-drawn typeface ("Excalifont", formerly "Virgil").

Decision: Self-hosted the actual font. `@excalidraw/excalidraw` (MIT-licensed, and its README explicitly documents self-hosting `dist/prod/fonts` as supported usage) was fetched via `npm pack` into scratch space; the largest Latin-covering subset (`Excalifont-Regular-*.woff2`, unicode-range U+20-7E plus Latin-1/typographic extras, ~24 KB) was copied to `public/fonts/Excalifont-Regular.woff2` and declared via `@font-face` with a matching `unicode-range` (so Japanese text correctly falls through to the system font stack rather than mixing scripts). `ProjectFlowChart` now uses Excalifont for all diagram text, recolors box outlines to Excalidraw's own default swatches mapped by stage kind (`FLOW_TONE`: green terminal, blue process, orange decision, violet store) via a `--fc-tone` CSS variable per node, increased corner rounding, and applies a shared `#fc-sketch` SVG filter (`feTurbulence` + `feDisplacementMap`, subtle) to every shape/edge stroke — but not to text — for the hand-drawn wobble, while keeping title text bright/neutral for legibility on the dark card.
- `#fc-sketch` and the arrow marker use static ids; safe because only one `ProjectFlowChart` is ever mounted at a time (the routed detail view unmounts the rest).
- Verified zero text-overflow / label-overlap / out-of-viewbox issues across all four projects at both the wide and compact geometries (same automated check as ADR-035/036).

Consequences: One additional static asset (`public/fonts/Excalifont-Regular.woff2`, ~24 KB, no new runtime dependency — the npm package used to extract it was not added to package.json). Extending `FLOW_TONE` covers any new stage `kind` values added later.

## ADR-040 - 2026-07-26 - Mobile detail header shares the image's animation track, not the staggered reveal

Status: Accepted

Context: Even after ADR-038's `measureOrigin()` fix, the user still saw the mobile detail overlay "glitch up and down" on open: the image appeared first, then the back button and title visibly popped in afterward. The user's own diagnosis was correct.

Decision: `.pd-back` and `.pd-headline` carried both `pd-animate` and `pd-reveal`, but `.pd-shot` (the hero image) only ever carried `pd-animate`. The open timeline sets every `.pd-reveal` element to `{y:18, opacity:0}` and tweens it in with a stagger starting at t=0.25 — so the back button/title lagged visibly behind the already-visible image. Removed `pd-reveal` from `.pd-back` and `.pd-headline` so all three appear together on the immediate `pd-animate` track. `.pd-block` sections (Overview, What it does, etc.) keep `pd-reveal` — they're below the fold, so a staggered reveal there is fine.

Consequences: The mobile open animation now reads as one cohesive motion (frame + image + header together, content sections staggering in below). Any future element added to the detail header should get `pd-animate` only, not `pd-reveal`, to stay on the same track as the image.

## ADR-041 - 2026-07-26 - Flow chart connector lines: filter region must not depend on a zero-area bounding box

Status: Accepted

Context: The user reported the flow chart's connector lines were not visible at all. Inspecting the live SVG (`getBBox()` on every `.fc-edge`) showed each connector's bounding box has width `0` (vertical connectors) or height `0` (horizontal branch connectors), because every connector is a straight axis-aligned line. The shared `#fc-sketch` filter (ADR-039, for the hand-drawn wobble) used the default `objectBoundingBox` filter units, whose region is a percentage of the filtered element's own bounding box — a percentage of a zero-width or zero-height box is zero, so the filter region collapsed to nothing and the browser drew nothing for any line using it. Boxes and diamonds have real bounding boxes so they rendered fine; every connector was silently dropped.

Decision: Changed `#fc-sketch` to `filterUnits="userSpaceOnUse"` with an explicit region (`x={-40} y={-40} width={width + 80} height={height + 80}`, in the flow chart's own SVG coordinate space) instead of relying on the filtered element's bounding box.

Consequences: Any future SVG filter shared across shapes and thin/straight strokes in this codebase must use `userSpaceOnUse` with an explicit region, not the `objectBoundingBox` default — the default silently breaks on any zero-width or zero-height element (straight horizontal/vertical lines being the most common case). Verified connector lines and arrowheads render with labels at both flow-chart geometries (mobile 375px and desktop), no console errors, clean production build.

## ADR-042 - 2026-07-29 - Repository-wide bug sweep: layout drift, modal semantics, toolchain pinning

Status: Accepted

Context: A full audit of the repo (source, CSS, build config, workflow, and the running app) after pulling four automated snapshot commits. Everything below was reproduced by measurement in the browser or on disk, not inferred.

Decision:

1. **Timeline dots, 561-760px.** `.dot { left: -25.5px }` in the `<=760px` block had been computed as if `.experience-summary` carried no negative margin, but the `-10px` override only starts at `<=560px` — so the whole band still used `-12px` and every dot sat 12px left of the dashed line (measured: line centre 52.5px, dot centre 41px). Corrected to `-13.5px` (`35 - 52.5 + 12 - 8`). Verified 0.5px at 320/400/561/700/760/761/1280 — the residual half-pixel is the pre-existing 3px-dashed-border centring, unchanged from desktop.

2. **Project heading at <=470px.** `flex-direction: column` inherited `align-items: center` from the row layout, centring the title and Live/GitHub buttons over a card whose body text is left-aligned (measured 149.6 / 130.1 / 44.9px). Added `align-items: flex-start`; all three now share 44.9px.

3. **Contribution grid rebuilt as week columns.** It rendered 245 days row-major in 35 columns under a header of nine evenly-spaced month labels — a column meant nothing, so the labels sat above unrelated days, and the caption claimed 12 months over roughly 8 months of data. Now 52 columns x 7 rows with `grid-auto-flow: column`, `--grid-columns` driven from the data, and each month label anchored with `grid-column: <start> / span <n>` to the week its 1st falls in (months spanning fewer than 3 columns are dropped, as GitHub does). `scripts/fetch-contributions.mjs` DAYS and the app's window both moved to 52*7=364. Verified every label's `offsetLeft` equals the `offsetLeft` of the first cell in its column.

4. **"Back to projects" could leave the site.** `history.length > 1` says the tab has history, not that the previous entry is ours — a shared `#/project/...` link opened from another site sent the visitor back to that site. Now a `pushedDetailRef` records whether this app pushed the entry; deep-linked visits strip the hash with `replaceState` (plus a direct `setRoute`, since `replaceState` fires no `hashchange`) instead of pushing an entry that Back would only re-open.

5. **The detail overlay now behaves like the modal it declares.** It carried `role="dialog" aria-modal="true"` while Escape did nothing, focus never entered it, and all 33 background controls stayed tabbable. Added an Escape handler, `inert` on `#smooth-wrapper`, and focus into `.pd-back` on open / back to the originating card on close. Focus is deferred with a `requestAnimationFrame` poll on the dialog's computed `visibility`, not a fixed delay: the entrance timeline starts the overlay at `autoAlpha: 0` (`visibility: hidden`) and focusing a hidden element is silently a no-op.

6. **Toolchain pinned.** Added `.nvmrc` and an `engines` field (`^20.19.0 || >=22.12.0`); the machine default of Node 20.11.0 fails every Vite 8 command. Added `vite.config.js` with `@vitejs/plugin-react` (previously absent, so there was no Fast Refresh), moved `vite`/`@vitejs/plugin-react` to `devDependencies`, dropped the unused `qrcode` dependency, and marked the package `private`.

7. **Root guard.** Enabling the React plugin turns on HMR, and a re-executed entry module would call `createRoot` twice on the same container. The root is now cached on the element.

8. **Error boundary.** The page renders third-party contribution data straight into JSX with no boundary, so one malformed row blanked the whole document. Added a top-level boundary with a readable fallback, plus a date-shape filter in `normalise` and a guard in `formatCellDate`.

9. **Honest defaults and content.** `public/resume/Mohamed_Fuad_CV_JA.pdf` was a byte-identical copy of the English CV (same MD5), so Japanese visitors downloaded the English résumé under a Japanese filename. The user supplied the real 履歴書・職務経歴書, which now sits at that path, and the locale-aware `resumeHref` branch is restored. The hardcoded `561` contribution fallback (stale; real total 575) is now derived from the data, and `|| 561` no longer rewrites a legitimate zero. Screen-reader strings that were hardcoded English in the Japanese locale are localized. CDN icon URLs are pinned (devicon v2.17.0, simple-icons 16.27.1) with an `onError` that hides a failed logo instead of leaving a broken glyph mid-sentence. 16 unused images (~916 KB) were deleted from `public/assets/`, which ships wholesale into `dist/`.

Consequences: `--grid-columns` is now the single source of truth for the contribution grid's width — the month header, the cell grid and `.calendar-scroll`'s mobile `min-width` all derive from it, so changing the window means changing `CONTRIBUTION_WEEKS` and the script's `DAYS` together and nothing else. The edge-aware tooltip rules count from both ends (`:nth-child(-n+14)` / `:nth-last-child(-n+14)`) rather than assuming a row length, so they survive a different week count. Any future element added to the detail overlay inherits the modal behaviour for free, but anything that needs focus on open must wait for visibility the same way. The JA résumé is a real document now, so `resumeHref` is locale-aware again; keep the two PDFs in step when either is refreshed.

## ADR-043 - 2026-07-29 - Two current projects added; private repos and detail depth

Status: Accepted

Context: The user asked for the two projects they are actively working on to be added, researched from their GitHub, with a screenshot taken from the real site and a written explanation. `resume-studio-dashboard` (public, live at editor-omega-two.vercel.app) is the Internship Portal; `ai-brain-platform` (private) is the RAG research system.

Decision:

1. **Screenshots captured over CDP, not `--screenshot`.** Chrome's `--screenshot --virtual-time-budget` fast-forwards timers, which breaks Firebase auth init and captured the portal on its "Loading…" frame. A small script drives `Page.navigate` → `Page.loadEventFired` → settle → `Page.captureScreenshot` at `deviceScaleFactor: 2`, matching the existing 1440x810 preview convention. The helper lives in the session scratchpad; re-create it if previews need refreshing.
2. **Formats chosen per image.** The portal's light, gradient-heavy UI is JPEG q80 (~72 KB). The AI Brain dashboard is sharp monospace on near-black, where JPEG rings visibly, so it stays PNG quantized to a 256-colour adaptive palette (206 KB → 73 KB) with the text still crisp.
3. **Private repos get a label, not a dead link.** `project.github` is now optional; a project without it renders a non-interactive "Private repo" / 非公開リポジトリ chip in place of the GitHub button, on both the card and the detail page. Linking a private URL would 404 for every visitor.
4. **Detail pages gained two optional blocks.** `detail.highlights` renders a four-figure strip ("By the numbers" / 数字で見る) and `detail.status` renders a callout under the overview saying where the project actually stands. Both are optional, so the four existing projects are unchanged.
5. **Honest status over flattery.** The AI Brain page states that the held-out exams are not passing yet. The dashboard hero the user chose shows a red "PAID WORK RESTRICTED" banner; that is the project's real operational state and the user picked it deliberately.

Consequences: `project.github` being optional means any future card must not assume it exists. The compact (phone) flow-chart branch box is 116 user units wide — "Firestore（所有者限定）" measured 126 and spilled out of the viewBox, so branch titles must stay short and push qualifiers into the edge label or the prose. Verified both new detail pages in EN and JA at 375px and 1280px with zero flow-chart overflow and no page overflow. Also corrected TokaiHub's live URL, which still pointed at GitHub Pages after the project moved to tokaihub.mohamedfuad.com.

## ADR-044 - 2026-07-29 - The flow chart's hand-drawn filter was invisible; commit to a precise diagram

Status: Accepted
Supersedes the sketch-filter portion of ADR-039 and ADR-041.

Context: The user said the system-architecture diagram did not look clean — "not the straight lines alone, but the drawing itself." Investigated by capturing the chart at 3.2x magnification over the DevTools protocol, with the `#fc-sketch` filter on and with `filter: none` forced on every `.fc-shape` / `.fc-edge` / `.fc-store-lip`.

The two renders were **pixel-identical — max channel delta 0, no differing bounding box.** The filter chain itself was fine (replacing its primitives with `feGaussianBlur stdDeviation=6` blurred the whole chart, and raising the displacement to `scale=18` produced obvious crinkling), so the reference resolved and the filter applied. It was simply too weak to see: `feTurbulence baseFrequency="0.02"` varies over roughly 50-unit periods and `feDisplacementMap scale="2.4"` displaces by at most about one user unit, which rounds away at the rendered scale of 1.18.

So the diagram was machine-perfect geometry wearing a handwriting font. That mismatch — a sketchy typeface promising a hand-drawn diagram that the geometry never delivers — is what read as "not clean". It also cost 13 chart-sized filter buffers (700x508 user units each, since ADR-041 made the region cover the whole chart for every element) on every paint, for no visible effect.

Decision: Removed `#fc-sketch` entirely and committed to a precise diagram, keeping Excalifont for warmth:
- `stroke-linejoin: round` on shapes and `stroke-linecap: round` on lines, so corners and line ends look intentional.
- `vector-effect: non-scaling-stroke`, so stroke weight stays consistent regardless of how the viewBox is scaled to the container.
- Subtitles were `fill: var(--fc-tone)` at full saturation — Excalidraw green on a near-black panel is barely legible. Now `color-mix(in srgb, var(--fc-tone) 45%, #e6ebf0)`, which keeps the per-stage tint and restores contrast.
- Connectors lightened to `1.5` against the shapes' `2`, so the boxes lead and the connectors read as grammar between them; arrowheads recoloured to match their line instead of sitting a shade apart.

Consequences: The ADR-041 hazard is retired along with the filter — there is no longer an `objectBoundingBox`-vs-`userSpaceOnUse` trap here, because no filter is applied to zero-area shapes. If a hand-drawn look is ever wanted again, do it as **geometry** (perturb the path data, roughjs-style) rather than as a post-process filter; a displacement filter subtle enough not to look noisy is also subtle enough to be invisible. Re-verified all six charts in EN and JA at 375px and 1280px: no text outside a viewBox, no text overflowing its shape, and every connector still painted.

## ADR-045 - 2026-07-29 - Project order, a "New" flag, and the title gets its own line

Status: Accepted
Supersedes the single-row heading decision in ADR-032.

Context: The user asked for a specific project order, a "New" badge on the Internship Portal, and for the titles to be fully visible — suggesting the Live/GitHub buttons move to the next line.

Decision:

1. **Order is now AI Brain Platform, WebDrop, Internship Portal, Tutor-System, TokaiHub, ClaudeShot**, set by the order of the `projects` array. (The user first said WebDrop at the top, then gave this fuller ordering; the later, more specific instruction won.)

2. **Titles get their own full-width row, actions underneath.** ADR-032 pinned the title and the Live/GitHub buttons to one line so every card read identically, with `.project-title` truncating by ellipsis if it did not fit. Measured on the deployed site at 1280px, that was clipping three of six titles: "Internship Portal" needed 137px and got 96, "AI Brain Platform" needed 141 and got 100, and "Tutor-System" — which predates the new projects — needed 114 and got 96. The two new, longer titles made a latent problem obvious. `.project-heading` is now `flex-direction: column; align-items: flex-start`, costing one row of height per card. All six titles now measure `scrollWidth === clientWidth` at 1280px and 375px in both locales. This also made the `<=470px` column override redundant, so it was removed.

3. **A "New" flag sits top-left of the preview**, driven by `project.isNew` rather than by hardcoding a slug, so moving it later is a one-line change. Top-left is the only free corner: the status badge is bottom-right and the View-details hint is bottom-left (and on mobile the hint is permanently visible, so a bottom-left flag would have collided). Verified no overlap with either at 375px or 1280px.

4. The badge span gained an explicit `.project-badge` class. It was previously selected as `.project-shot > span:not(.project-shot-hint)`, which the new flag would also have matched.

Consequences: The heading is a column at every width now, so anything added to `.project-heading` stacks rather than competing for one row. `.project-title` keeps `white-space: nowrap` — that is what stops "Tutor-System" breaking at its hyphen (ADR-013) — and keeps `text-overflow: ellipsis` as a safety net, but with a full-width row nothing currently reaches it.

### ADR-045 addendum - 2026-07-29

The "New" flag from point 3 was removed the same day — the user did not like it. The `.project-badge` class introduced in point 4 stays, since it is what keeps the status badge selectable without relying on `span:not(.project-shot-hint)`. Points 1 and 2 (project order, and the title getting its own full-width row) stand.

Separately, the AI Brain Platform's dashboard is now published at `https://brain.mohamedfuad.com`, so a project can have a `live` URL while its repo stays private — the card renders a Live link next to the "Private repo" label. `project.github` and `project.live` are independent; neither implies the other.

## ADR-046 - 2026-07-29 - The mobile card-expand clone was reflowing; pin it to the origin card

Status: Accepted
Completes ADR-036, which pinned the wrong half of the transition.

Context: The user reported that opening a project on mobile still "realigns a bit". Every previous attempt at this (ADR-029, 036, 038, 040) was verified with synthetic clicks in the preview pane — where `document.hidden` is true, `requestAnimationFrame` never fires, and GSAP timelines never advance. In other words the animation had never actually been observed running. Recorded it properly instead: headless Chrome at 390x844 with touch emulation, a real `Input.dispatchTouchEvent` tap, `Page.startScreencast` for frames, and a per-`rAF` sampler logging the geometry of the overlay, the clone, and their contents.

Root cause: `.pd-expand-face .project { width: 100% }`. The clone is a static `outerHTML` copy of the tapped card, but it is sized as a percentage of `.pd-expand-face`, which fills `.project-detail` — and `.project-detail`'s width is exactly what the open animation tweens. So the clone re-laid out on every frame of the morph. Measured across the 25 frames where the clone is visible, as the overlay grew 350 -> 390px:

- the clone's grid column went 306 -> 338 -> 350px
- its preview image grew 353.9 -> 387.5px wide (33.6px of drift) and 18.9px taller
- **its title slid 171.9px down the screen**

That last number is the visible glitch. It is the same failure ADR-036 diagnosed and fixed for `.project-detail-inner`; the clone was simply never given the same treatment.

Decision: Added `pinnedFaceLayout(origin)`, applied to the cloned `.project` in both the open and close timelines, freezing it at the measured origin card's width and height so it cannot reflow while the frame around it animates.

**Units must be explicit.** The first attempt passed bare numbers, as `pinnedInnerLayout` does. GSAP defaults `width` to px but `minHeight` to *percent*, so it wrote `min-height: 404.75%` — the clone became 3121px tall and its title, description and tags were pushed far below the frame. The fix returns `` `${n}px` `` strings for both.

Consequences: After the fix, every clone child matches its original exactly (306x172 preview, 306x112 body, 306x52 heading, 59x18 and 51x18 tags) and drift across the animation is 0.0px in width, height and title position on all three cards tested, on both open and close, while the frame still grows 358 -> 390. The clone is anchored to the overlay's top-left, so it translates with the frame — that is the intended shared-element motion, and is why the close still shows a 25px title translation with 0px of size drift.

Anything that later animates `.project-detail`'s box must keep both pins in step: `pinnedInnerLayout()` for the real content and `pinnedFaceLayout()` for the clone.

## ADR-047 - 2026-07-29 - The mobile close measured its target through a scaled ancestor

Status: Accepted

Context: With the reflow fixed (ADR-046), recording the mobile *close* showed a second, separate bug. The overlay animated back to `[30, 130, 333, 385]` while the card it was returning to actually sits at `[20, 183, 350, 405]` — 10px right, 53px too high, 17px too narrow and 20px too short. The clone reaches full opacity right at the end of that tween, so the snapshot visibly settled beside the real card before blinking away.

Cause: while the overlay is open, `main` is left at `scale(0.95)` (the open tween dims and shrinks the page behind the overlay). `measureOrigin()` calls `getBoundingClientRect()` on the origin card, which reports the **transformed** box — so the close target was the card's scaled-down rect. The arithmetic confirms it exactly: 350 x 0.95 = 332.5 (measured 333) and 405 x 0.95 = 384.8 (measured 385). Meanwhile the close tweens `main` back to `scale(1)`, so the card grows away from the target as the overlay travels toward it.

Decision: `measureOrigin()` now neutralises `main`'s inline transform for the duration of the measurement and restores it immediately. Reading a rect forces layout but never a paint, so nothing flashes. Verified: the close now lands at `[20, 183, 350, 405]` — within 0.2px of the card on every axis, versus errors of up to 53px before.

Consequences: `measureOrigin()` is the single place that converts "where is the origin card" into animation coordinates, and it is now transform-independent. Any future effect that transforms an ancestor of the project cards is therefore safe. The general trap is worth remembering: `getBoundingClientRect()` is post-transform, so it is the wrong tool for "where will this element be once the transforms finish".

## ADR-048 - 2026-07-29 - Shimmer heading and a visitor counter with number pop-in

Status: Accepted

Context: The user asked for two things from transitions.dev: the "Shimmer text" treatment on the "Building AI agent tools" line (replacing its underline), and the "Number pop-in" animation on a new visitor counter in the footer beside the year.

Both techniques were measured from the reference rather than guessed at, by reading the live demos' computed styles and keyframes:

- **Shimmer** — `@keyframes { 0% { background-position: 100% 0 } 100% { background-position: 0 0 } }` over a gradient clipped to the glyphs. Their base/highlight are `#7c7c7c` / `#0d0d0d`; this page is near-black, so the tones are inverted (`#cfd3d8` base, `#ffffff` highlight).
- **Number pop-in** — 500ms, `cubic-bezier(0.34, 1.45, 0.64, 1)`, 70ms stagger per character, each rising from `translateY(8px)` with `opacity: 0` and `blur(2px)`, wrapper `tabular-nums`. Reimplemented with GSAP (the project's existing motion system) rather than importing their CSS, and verified against the reference numbers: measured stagger 66-67ms, travel 8.0px with a -0.5px spring overshoot, blur peak 2.00px.

Decision:

1. `.building-text` carries the shimmer as its own element — `background-clip: text` only clips to the glyphs of the element it is set on, and the sibling thinking-orb must not inherit a transparent text fill. A `background-color` in the base tone is set alongside the gradient because it is clipped to the glyphs too, so if the gradient ever fails to paint the text stays legible instead of invisible, which is the failure mode of `-webkit-text-fill-color: transparent`. Under reduced motion the gradient is dropped entirely and the text renders solid.

2. `PopInNumber` splits the value into per-character spans and replays on **both** triggers the user asked for: a ScrollTrigger with `onEnter`/`onEnterBack` so it animates every time the footer comes into view, and a `useEffect` on the value so an incoming visit visibly ticks the number over. Characters are `aria-hidden` with a single `.sr-only` copy of the value, so assistive tech reads "1,337" once instead of five separate digits.

3. **The count needed a backend.** The site had none (no `api/`, no env, no `vercel.json`), and the alternatives were a third-party counter service — which would hand every visit to someone else and can rate-limit or vanish — or nothing. On the user's decision, added `api/visits.mjs`, a Vercel function backed by Upstash Redis over its REST API (no client library, just `fetch`).

   Uniqueness is enforced **server-side**, not by trusting the browser: a key derived from the request IP and user-agent is written with `SET ... NX EX 2592000`, and the counter increments only when that write actually created the key. Clearing localStorage cannot inflate the number and neither can replaying the request. Only a truncated salted SHA-256 is stored — never the address — and it expires after 30 days. The client's localStorage flag is now just an optimisation to avoid a pointless write per reload.

Consequences: The counter is **optional by design**. `useVisitorCount` returns `null` until a real number arrives and stays `null` on any failure, and the footer omits the whole element in that case — verified with the endpoint hard-blocked at the network layer: no counter, no console errors, footer ends cleanly at "2026". So the site is correct before the Upstash env vars exist, and degrades to exactly that state if the store is ever unreachable.

`vite.config.js` gained a dev-only (`apply: 'serve'`) middleware that mocks `/api/visits` from memory, because `vite dev` does not run Vercel functions and the animation would otherwise be untestable locally.

Required environment in the Vercel project: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and optionally `VISITS_SALT`.

## ADR-049 — Human-voiced copy for Internship Portal and AI Brain Platform (2026-07-30)

Context: The user read both project pages as AI-generated and asked for them to be
fixed "naturally to match all the other projects." The specific complaints were the
em dashes and a set of status-ish fragments: "In active development", "The web app is
live", "The iOS client", "Ongoing research". They also named "Paid work" and "etc.",
neither of which existed anywhere in the source — the badges are `in progress` and
`research project` — so there was nothing to remove for those two.

Separately: the Internship Portal was being sold as a "LaTeX-to-PDF compiler". The
user's correction is that the compiler is not the point. It is an internship tracker
**and** a way to find internships by searching, and those two things are the product.

Decision:

1. **Deleted the `status` block from both projects** rather than rewriting it. Every
   phrase the user objected to lived there and nothing else did, so a rewrite would
   have been inventing new copy to fill a slot they did not want. `ProjectDetailView`
   already renders it as `{d.status && ...}`, so removing the key drops the paragraph
   with no code change. `highlights` (the AI Brain figures strip) was left alone — it
   is numbers, not prose, and was not part of the complaint.

2. **Reframed the Internship Portal around find + track.** The card description, the
   tagline, the first two feature bullets and the four-step system map now lead with
   searching the postings and moving an application from saved through to interview.
   The résumé editor survives as the last bullet, described as where the résumé you
   send gets written, and the phrase "LaTeX-to-PDF compiler" is gone from the copy.
   The map's old fourth step ("Documents / LaTeX compiled to PDF") became
   "Find / Track / Your data / Shared server".

3. **Left the system-architecture flow charts alone.** The Internship Portal chart
   still terminates in "Tectonic to PDF", because that is accurately what the compile
   endpoint does and the chart documents server responsibilities, not billing. It is
   also width-tuned per ADR-043/044 (the 116-unit phone branch box), so relabelling
   invites the overflow bugs those ADRs fixed. Flagged to the user as their call.

4. **Em dashes removed from both projects' copy, in both locales.** Prose was rewritten
   toward the plain declarative voice WebDrop already uses — short sentences, first
   person, no rhetorical questions, no semicolon chains, no "the architectural rule I
   care about most". The Japanese was rewritten in parallel, not machine-mapped from
   the new English.

Consequences: Verified by real render, not by reading the diff. Because the in-app
preview pane freezes `requestAnimationFrame` (measured this session: **0 ticks in
12.2s**, so every scroll-revealed block reads `opacity: 0` there), the check ran in
headless Chrome over CDP with `Page.startScreencast` to keep frames coming. Across
mobile 390x844 and desktop 1280x900, both slugs, both locales: no `.pd-status` in the
DOM, 0 em dashes in the rendered text, none of the named phrases present, no
horizontal overflow, all `.pd-block` sections reaching `opacity: 1` after scroll, no
console errors and no failed requests. Production build clean.

One harness lesson worth keeping: the locale preference persists in `localStorage`, so
a run that clicks 日本語 poisons every later "English" load in the same profile. The
first sweep silently reported Japanese copy under four `en` keys. Clear `localStorage`
between locale cases.

## ADR-050 — A two-line label must straddle a diamond's midline (2026-07-30)

Context: On the AI Brain page the only decision diamond that carries a subtitle,
"Did it pass?" / "Teacher grades held-out exams", had its subtitle crossing the
orange outline on both sides. Measured before the fix, at the wide geometry in
Japanese: subtitle 177.88 user units against 158.78 available, so **9.55 units of
overhang per side**. Compact/Japanese overhung by 1.05.

Cause: `FlowBox` placed the subtitle at `mid + gap` for every shape. That is correct
for a rectangle or a cylinder, which are the same width at every height, but a
diamond is only full width at its vertical midline and tapers to a point above and
below. At `dy = 13.5` of a 37-unit half-height the shape has already given up 36% of
its width, so the label was being drawn where the box no longer existed. The title
was fine only because it is short.

Decision: when a decision has a subtitle, straddle the midline — title at
`mid - (gap/2 + 1.5)`, sub at `mid + (gap/2 + 1.5)` — so both lines sit in the widest
band instead of one hanging into the taper. Non-diamond shapes keep the original
slightly-low placement, which reads better inside a constant-width box. The diamond's
own geometry is untouched, deliberately: extending the tips to gentle the taper would
have been the other fix, but the arrow into a diamond already terminates 5 units
inside its top tip (`to: y + rowH - 3` vs a tip at `y + rowH - 8`), so growing the
tips would have widened a pre-existing overlap into a visible one and required
threading the next stage's kind into `FlowArrow`. Not worth it for a text-placement
bug.

**Straddling alone was not enough, and the first verification of it was wrong.** It was
checked by computing the diamond's width at the text's *centre line* and comparing that
to `getComputedTextLength()`, which reported 8.19 units of margin and looked clean in a
3x capture. But a line of text has height, and the binding constraint is its **lower
corners**, which sit ~6.6 units below the centre where the diamond has narrowed
further. Re-tested with `SVGGeometryElement.isPointInFill` against the real path, using
all four corners of `getBBox()`: the bottom two corners were still outside in both
locales (EN sub 159.97 units, JA 177.88, against ~150 usable at that height). A
validation subagent caught this independently.

So the subtitle was **shortened** as well, the remedy ADR-043/044 already used for the
116-unit phone branch box: "Teacher grades held-out exams" → "Graded by the teacher"
(159.97 → 91.07 units) and "教師モデルが持ち出し不可試験を採点" → "教師モデルが採点"
(177.88 → 65.11). "Held-out exams" is not lost; the prose above the chart already says
the exams are commits the cheap model has never seen.

Consequences: All four `getBBox()` corners of both the title and the subtitle now test
inside the diamond path, in EN and JA, at both the wide and compact geometries — the
strict test, not the centre-line one. The other four charts contain no decision with a
subtitle, so nothing else moved. Production build clean.

Lesson: to check text against a non-rectangular shape, test the text's bounding-box
corners with `isPointInFill` against the actual path. Comparing text length to the
shape's width at the text's centre line silently passes labels that visibly cross the
outline, and comparing against the shape's *bounding box* is looser still.

## ADR-051 — GSAP applies vars in reverse, so never mix `inset` with `left`/`top` (2026-07-30)

Context: A validation subagent found that the mobile card-expand opened from the
viewport's top-left corner rather than from the tapped card. Confirmed independently
by sampling the overlay per animation frame and by a MutationObserver on its `style`
attribute. Before the fix the overlay's first painted frame was `[0, 0, 357, 478]`
while the tapped card sat at `[20, 451.23, 350, 404.75]`; `el.style.left` was `auto`
and `left` stayed 0 for all ~80 frames of every open. The error equals the card's
distance from the viewport origin, so it grew with scroll position — up to ~451px.

Cause: the open did

```js
gsap.set(el, { autoAlpha: 1, inset: 'auto', left: origin.left, top: origin.top, ... })
```

GSAP's CSSPlugin builds its PropTween list by **prepending**, so vars are applied in
the reverse of the order written. `inset: 'auto'` therefore landed *after* `left` and
`top` and reset both — `inset` is a shorthand for all four offsets. The subsequent
`.to(el, { left: 0, top: 0, ... })` then read its start values from computed style,
which for `position: fixed` with `inset: auto` resolves to the static position `0,0`,
so left/top tweened 0 → 0 and never moved.

Decision: set `right: 'auto'` and `bottom: 'auto'` explicitly instead of the `inset`
shorthand. Those are distinct properties from `left`/`top`, so no application order can
clobber the origin rect. The reduced-motion branch keeps `inset: 0` — it pairs it with
`width/height: 'auto'` and sets no left/top, so there is nothing to overwrite.

Consequences: The overlay's first style write now reads exactly the card's rect —
`left=20px top=388px width=350px height=426px right=auto bottom=auto` against a
measured origin of `[20, 387.98, 350, 425.81]` — and the open still ends at
`[0, 0, 390, 844]`, the full viewport. Verified on two cards at two scroll positions.

Why four previous ADRs missed it: the close was never affected, because it does not
touch `inset`, and it lands within 0.42px. ADR-046's per-frame sampling compared each
clone child against its original — all *relative* measurements, which stay correct even
when the whole overlay starts in the wrong place. Absolute origin was never asserted.
Any future check of this animation must compare the overlay's own first frame against
the origin card's rect.

## ADR-052 — Japanese is a real locale, not a translation layer (2026-07-30)

Context: The ADR-049 rewrite fixed two projects' copy but a validation sweep showed the
Japanese side of the site was only partly localized, and that three projects' Japanese
described a different product from their English.

Decision, in the order the problems bite:

1. **`document.documentElement.lang` now follows the locale.** `index.html` ships
   `lang="en"` and nothing ever changed it, so a Japanese visitor got a fully translated
   page still declaring itself English, and screen readers read Japanese with an English
   voice. Set in the same effect that persists the preference.

2. **Badges are localized.** `badge` had no Japanese counterpart, so all six cards *and*
   all six detail heroes showed `live app` / `in progress` / `research project` /
   `long-term project` / `student PWA` / `macOS utility` on an otherwise Japanese page.
   Added `badgeJa` to every project and a `badgeLabel(project, locale)` helper used by
   both render sites, falling back to `badge` if a translation is ever missing.

3. **Strings that were hardcoded English are now keys.** The footer's role and city and
   the contact card's "Email" (which said "Email" while the hero said "メール" for the
   same action, on the same page) became `footerRole`, `footerCity` and the existing
   `t.email`. `building` was "AIツールを開発中" against an English "Building AI agent
   tools" — the Japanese had quietly dropped "agent", which is the whole point of the
   line.

4. **Three projects' locales were reconciled.** WebDrop, Tutor-System and TokaiHub had
   Japanese card copy and taglines that were stale marketing register (feature dumps,
   モダンな, ネイティブアプリのような) against plain English. Worse, **WebDrop's Japanese
   advertised バンプペアリング — bump pairing — a mechanism the English never claims.**
   Both sides now say the same thing.

5. **The remaining AI-tells were removed from the four projects ADR-049 did not touch**,
   plus two residues in the pair it did: ClaudeShot's "keep the utility practical for
   daily use", Tutor's "Fast teaching stays in the foreground.", TokaiHub's "email
   aliases keep login familiar" and its `with…plus` weld of onboarding to theming,
   WebDrop's "when those sensors are not" (an ellipsis that never completes), AI Brain's
   tricolon and four-clause chain, and the Internship Portal's "does two things"
   followed by four. The home intro's opening tricolon went too — it was the first
   sentence a visitor read.

6. **The last two em dashes in user-facing strings** were the card `aria-label`
   ("WebDrop — View details", on all six cards in both locales, so screen-reader-only
   and easy to miss) and the ErrorBoundary copy.

Consequences: Swept 28 route × locale × breakpoint combinations at 390x844 and
1280x900 over CDP: **zero problems** — `lang` correct in all four locale/breakpoint
pairs, all six badges Japanese under `ja`, no em dash in any rendered string, no
horizontal overflow, no clipped titles, no broken images, no `.pd-block` stuck hidden,
flow-chart connectors present on all 24 detail combos, all diamond labels inside their
path, 0 console errors and 0 responses >= 400. The mobile expand still writes the
tapped card's exact rect on open (ADR-051 holds). Production build clean.
