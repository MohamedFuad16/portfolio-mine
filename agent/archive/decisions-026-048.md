# Archived decisions, ADR-026 to ADR-048

Moved verbatim from `agent/decisions.md` on 2026-10-22 to keep that file under the size limit. The text after the rule is unchanged. ADR dates: 2026-07-08 to 2026-07-29.

Path notes (added when archived, not part of the original text):
- `public/assets/profile.jpg` (ADR-026) is now `public/media/images/profile.jpg`.
- `public/assets/contributions.json` (ADR-033) is now `public/media/data/contributions.json`. Both moves came from commit 8a85b1c (2026-08-30).
- `public/fonts/Excalifont-Regular.woff2` (ADR-039) was deleted in commit cc62326 (2026-09-25). ADR-064 removed its last use.

---

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
