# Decisions

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
