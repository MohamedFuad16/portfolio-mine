# Archived decisions, ADR-060 to ADR-071

Moved verbatim from `agent/decisions.md` on 2026-10-22 to keep that file under the size limit. The text after the rule is unchanged. ADR dates: 2026-08-30 to 2026-10-13.

Path notes (added when archived, not part of the original text):
- `public/fonts/Excalifont-Regular.woff2` (ADR-064) was deleted in commit cc62326 (2026-09-25).
- `_toolkit/scripts/mockup-geometry.py`, `music.py` and `pacing.py` (ADR-068) are outside this repo, in `~/Documents/launch-videos/_toolkit/scripts/`.
- `assets/device/phone.css` and `references/japanese.md` (ADR-066) are in the launch-video skill, now at `~/.folio/skills/launch-video/assets/phone.css` and `~/.folio/skills/launch-video/references/japanese.md`. The `device/` subfolder is gone.

---

## ADR-060 — Integrate anonymous analytics and structure without dropping newer remote work (2026-08-30)

Status: Accepted.

Context: The requested cleanup and analytics work was prepared from a checkout 62 commits behind `origin/main`. The remote had since added the Daijin mascot, Internship Portal, AI Brain Platform, a scheduled GitHub contribution snapshot, and a more capable Upstash visitor API. Replaying the stale snapshot wholesale would have silently deleted those features. The user also explicitly rejected the custom GA4 setup and supplied the desired Japanese CV.

Decision: Integrate onto current `origin/main`. Preserve every newer feature and the existing `api/visits.mjs` counter. Add production-only Vercel Web Analytics with automatic history tracking disabled and manual sanitized `/` plus `/project/<slug>` page views. Do not add GA4, Google tags, raw-IP storage, or custom free-tier events. Make `src/main.jsx` entry-only, move the application, mascot, generated signature, and CSS into purpose-named source folders, and sort public files into typed `public/media/` folders. Add asset-reference validation and security headers. Replace the Japanese resume with the exact user-supplied one-page A4 PDF. Disable the marquee mask only while a skill is hovered so the GitHub icon is not clipped.

Consequences: The Vercel dashboard supplies anonymous page/referrer/country/browser/device/OS reporting with no analytics environment variable, while Upstash remains the separate de-duplicated visitor count. The free analytics tier intentionally omits custom click/section events. Source and media paths are cleaner without regressing remote features, and the scheduled contribution workflow now writes to `public/media/data/contributions.json`.

## ADR-061 — Remove the click sound; rebuild the contribution grid around one portal tooltip (2026-09-23)

Status: Accepted. Supersedes the audio part of ADR-030/031.

Context: The user found the page-click achievement sound annoying for visitors and asked for it to go. They also reported that hovering a day in the middle of the contribution grid showed an overlaid, broken tooltip. Reproduced in the browser: the tooltip for Mar 27, 2026 was cut through by the cells to its right. Cause: the cell reveal (`gsap.from` scale/opacity) left `transform: translate(0px, 0px)` inline on all 364 cells, so every cell was its own stacking context and the `::after` tooltip's `z-index: 20` could not rise above later siblings. The CSS-only tooltip could also be clipped by the section's `overflow-x: auto`.

Decision: Delete the WAV and its playback; keep the visual ripple. Replace the 364 pseudo-element tooltips with one tooltip rendered through `createPortal` into `<body>` at the hovered cell's rect, clamped to the viewport, re-anchored (not hidden) on scroll because ScrollSmoother keeps emitting scroll events while it eases. Add `clearProps` to the cell reveal so no inline transform survives. Add a four-figure stats row computed from the drawn cells (total, active days, longest and current streak, busiest day), Mon/Wed/Fri labels, month labels as buttons that dim the rest of the year and show that month's total in the caption, arrow-key navigation with a live caption, and open the phone view scrolled to the most recent weeks.

Consequences: The tooltip can no longer be covered or clipped. All stats are re-derivable from `public/media/data/contributions.json` (verified 2026-09-23: 596 total, 62 active days, 14-day longest streak, 40 on 2026-05-30). Only the calendar scrolls on phones; stats and caption stay fixed.

## ADR-062 — Ledger and CCFT projects, hover clips, tech filter, repo-aware heatmap, Cmd+K, tenure timeline, light theme (2026-09-23)

Status: Accepted.

Context: The owner asked for a second overhaul round without changing section order: hover video loops on project cards, filtering by technology, a heatmap linked to repositories, experience shown as a timeline, a Cmd+K menu, a light theme, removal of the thinking orb, a new Ledger project (an annual-report extraction pipeline, presented without the company it was first built for), and CCFT replacing the AI Brain Platform. Mid-session the owner also asked to remove the year-level repository panel under the heatmap (it pulled attention) and to show product results, not engineering trivia, in Ledger's figures.

Decision:
- Ledger figures come from the live /api/benchmark-summary and /api/benchmark-runs, using the same Gemini 3.7 Flash cohort as the site's own charts: 966/966 rows exact on 47 reports across 10 companies, 31.0s mean pass, 8.9k vs 92.9k input tokens. The repo README's 75-report figure predates the published summary and is not used. The site's $0.104 per report averages all three strategies, so it is not quoted.
- Every card image gets a 1.12x parallax zoom (ADR-era scroll tween), so dense UI captures are framed inside a 78% window on a backdrop; the zoom then trims only backdrop.
- Hover clips play only for a mouse pointer or keyboard focus, never on touch or reduced motion, with preload="none". Only Ledger and CCFT have clips: the other live sites open on a login wall, an onboarding modal or an empty upload screen, which would make poor loops.
- The CCFT clip is a layered parallax built from real captures of the app (landing screen, a Haiku 4.5 Low task-table answer, reasoning slider, General/Agents/About settings), not a screen recording. A live sub-agent website run was attempted; the engine refused delegation with "CCFT verification plan is missing or conflicts with this task", so no run footage is used.
- The contribution snapshot now also stores per-day public repository counts (GraphQL, month-sized windows so no connection page truncates). Commit nodes are calendar days already; pull requests, issues and reviews are exact instants bucketed in GH_TIME_ZONE (Asia/Tokyo), which is the only zone where 2026-07-19 reconciles (9 commits + 8 events = 17). Private repositories are dropped by name. Named counts never exceed the grid count on any day (574 of 596 named). Repositories appear in the day tooltip only.
- Projects carry explicit `tags`; filter chips list only tags some project has, and matching skill pills become buttons that apply the filter.
- Experience shows tenure and a bar on a shared first-start-to-today axis. A `result`/`resultJa` field renders when present; none is filled because no measured outcomes were supplied.
- Light theme lives in src/styles/theme-light.css, scoped under :root[data-theme='light']; the app follows the system until the visitor chooses, then remembers the choice.

Consequences: Two new media folders (public/media/video). The AI Brain image and clip are gone. The heatmap depends on the Actions GITHUB_TOKEN for repository names; without it the grid still renders and tooltips simply omit repositories.

Addendum 2026-09-24: WebDrop, Internship Portal and Tutor-System now have hover clips, recorded with Playwright's recordVideo and scripted clicks (WebDrop: onboarding slides, then settings name, icon, ring, language and dark mode; Internship Portal: language switch and the sign-up form filled with a demo name and example.com email, never submitted; Tutor-System: study cards, tutor chat, analytics, library, settings). WebDrop's clip hides one toast: every profile change re-sends `client:hello` on the open socket, the server answers `unsupported_type`, and the app shows "The nearby connection could not be confirmed." That is a real WebDrop bug, reported separately rather than shown in a demo. Ledger's framed capture grew from 78% to 87% of the frame. Neither beautifului.dev nor rareui.com has a theme toggle, so the toggle is an in-house sun/moon morph (mask slide plus ray fold) driven by CSS off `data-theme`. TokaiHub needs a signed-in session; the owner logs in to a separate Chrome profile and the clip is recorded from there. TokaiHub was recorded from the owner's signed-in session in a separate Chrome profile over CDP; the sidebar card with the student ID is blurred and the clip ends before Settings, which shows grade and credit figures.

Addendum 2026-09-24 (review round): Ledger's detail page gained two bar charts (time and input tokens per report, Gemini 3.7 Flash, the 46 reports all three methods processed: 36.7s/34.7s/31.0s and 92.9k/93.2k/8.9k), colours checked with the dataviz validator (#5591ec vs #6a6e73 dark, #1f5fc4 vs #8a8f95 light). Daijin is now placed from live geometry so the paw reaches the photo, and the photo knock is driven by the mascot's own frame. A review pass fixed: the command menu opening under the project overlay (z-index 950), Escape closing both layers, the snapshot script overwriting the repo breakdown on failure, a dark-then-light flash (public/theme-init.js sets data-theme before the bundle; same-origin so it fits the report-only CSP), triplicated marquee copies in the tab order, hover clips starting on programmatic focus, an unexplained gap between a day's count and its listed repositories ("Other" row), silent truncation of PR/issue/review pages, and the first grid day's early JST hours being skipped.

## ADR-063 — Spell UI signature as pre-generated glyph paths; font-swap layout shift fixed at the source (2026-09-25)

Status: Accepted (supersedes the signature parts of ADR-018 and ADR-022)

Context: The owner asked to replace the Hershey monoline signature with Spell UI's `<Signature>` (`npx shadcn add @spell/signature`), animated, in a good colour, without the metallic effect. The project has no shadcn or Tailwind setup. The registry component depends on `motion` and `opentype.js` (about 170KB minified) and fetches `/LastoriaBoldRegular.otf` (178KB) at runtime, which the registry item does not ship. Separately, once the hero stopped fading the intro paragraph in, Lighthouse mobile measured CLS 0.175: the Figtree swap re-wrapped the paragraph by one line.

Decision: Keep the component's rendering and timing, move the font work to build time. `scripts/make-signature.mjs` lays out "Mohamed Fuad" glyph by glyph (advance plus kerning), serializes path commands by hand (toPathData fuses numbers, ADR-018), and writes the ink bounds as the viewBox. GSAP DrawSVG replaces motion's pathLength. The font was downloaded with the owner's approval and lives in `scripts/fonts/`, never in `public/`. The mask stroke is 0.45 x font size rather than Spell's 0.22, which left the wide M loop and F bar unrevealed at this size. Colour is the ember accent. For the layout shift, a `Figtree Fallback` face (local Arial/Helvetica/Liberation Sans, size-adjust 101.2%, ascent 93.9%, descent 24.7%) narrows the swap, and a build-only Vite plugin preloads the hashed latin Figtree file so it arrives before the app renders.

Consequences: No new runtime dependency; opentype.js is a devDependency for the script. La Storia Bold is marked "Typeface (c) Abo Daniel 2019. All Rights Reserved", so the owner must confirm the licence covers a personal site before publishing. Regenerating the signature means rerunning the script, never hand-editing the data file.


## ADR-064 — Detail page lower half in each project's own colours, with shorter copy (2026-09-25)

Status: Accepted (restyles the ADR-035 flow chart; replaces the ADR-044 Excalidraw tones and font)

Context: The owner said the carousel and hero look good, but "By the numbers", the overview, "What it does" and the system map had too much text and read grey on the whole page. The system architecture information had to stay.

Decision: Each project gets an `accents` list (three colours from its pixel-transition palette). `projectTones()` in App.jsx pairs each accent with the ink (#16130f or white) that has the higher WCAG contrast on it, and components set `--tone` and `--tone-ink` per element. Numbers are solid tiles with a big Instrument Serif value and one mono label, and the donut rings are gone. The overview is two or three sentences beside a tinted facts card with coloured tech chips. Each feature is a `title` plus one line (`{ title: {en, ja}, en, ja }`), shown as tinted dashed cards (two wide cards over three). The `flow` paragraph is one sentence. The system map is a row of solid chevrons (a downward column on phones). The flow chart keeps its geometry and data, and switches to solid shapes in the project's tones, Figtree labels and a tinted dashed panel. Stage roles map to tones (terminal 0, process 1, decision 2, store 0). Page tokens (`--pd-page`, `--pd-text`, `--pd-muted`, `--pd-line`, `--pd-tint`, `--pd-edge`) switch in theme-light.css. Two accents differ from the palette: Ledger uses #3771cc instead of #3f7ad6 (white text 4.7:1 instead of 4.4:1), and Tutor-System uses #c94f0e instead of the cream #fbe3c8, which vanished on the light page.

Consequences: Ledger and CCFT share blue palettes, so their pages look alike. Only those two projects have `highlights`, so the other four have no numbers section. The Excalifont @font-face rule and its styles are removed; `public/fonts/Excalifont-Regular.woff2` is no longer referenced by CSS.

## ADR-065 — Prerender the home page and load the bundle after first paint (2026-09-25)

Status: Accepted

Context: The owner asked for a much faster mobile score without losing components, quality or smoothness. Lighthouse mobile was 82 with LCP 3.5s, all render delay: the page was an empty `#root` until the 190 KB bundle ran. AI crawlers that do not run JavaScript saw no content and Bing reported a missing h1.

Decision: Server-render the home page at build time and hydrate it. State that reads the browser starts from fixed defaults (English, dark, home route, no reduced motion, non-Apple) so the hydration render matches the HTML, then a layout effect loads the visitor's values; effects that persist locale or theme skip the hydration commit via `bootRef`. The lazy border beam and the shortcut label render their prerender form first (React error 419 otherwise). Japanese visitors are hidden until the corrected commit rather than shown English first. The prerender also inlines the CSS and the theme script (CSP hash checked at build), drops React's automatic image preloads except the photo, and starts the bundle from `public/boot.js` after first contentful paint. Measured first: CSS arrived at ~2.0s on a throttled phone because it shared the link with the bundle, and Lighthouse's simulation counted every request that finished before the observed paint.

Consequences: Every component and animation stays, except the hero entrance slide and the name's letter flourish, which no longer play when the hero is already on screen from HTML (they still play for Japanese visitors, whose first view is held). Correction 2026-09-25: at the owner's request the entrance plays for everyone again. It moved from GSAP and SplitText to CSS keyframes with the same values (the name is split into `.name-char` spans in the markup, `aria-label` on `.name-text`), so it starts with the prerendered paint; the SplitText plugin is no longer imported. The app is interactive one bundle download after first paint instead of at it. Any new render-time read of `window`, `document`, `navigator` or storage must go through `fromBrowser()` or the build fails (server render) or hydration mismatches. Editing `public/theme-init.js` requires updating its hash in `vercel.json`; the build fails with the new hash otherwise.

## ADR-066 — WebDrop launch video: original phone frame and per-frame font stubs (2026-09-25)

Status: Accepted

Context: The owner asked for v3 of the WebDrop launch video in English and Japanese, with a high-quality tilted iPhone mockup. The 21st.dev component needs an API key the owner does not have. Apple's official bezels are licensed for App Store apps only, and WebDrop is a web app. For Japanese, the Noto JP variable fonts come as 124 unicode-range subsets per family (217 KB of CSS). HyperFrames lint counts only the `@font-face` rules inside each frame. When lint fails, `check` skips its contrast and layout gates.

Decision:
- Draw an original CSS phone frame (`assets/device/phone.css`): titanium rim, side buttons, island and depth edge, with the tilt set by the parent's perspective.
- Load the full Japanese font CSS once, in the `index.html` head.
- In each frame, copy the one Latin-subset rule for each Noto family it uses. The copy has the same file and unicode-range, so it changes no glyph and lets lint pass.

Consequences: No Apple artwork ships. Every check gate runs on the Japanese build. Adding a new Japanese frame means adding the same stub. Both are recorded in the skill (`references/japanese.md`) so later videos reuse them.

## ADR-067 — TokaiHub launch video: masking the owner's data and the end-card claim (2026-09-25)

Status: Accepted

Context: The owner asked for a TokaiHub launch video in English and Japanese. TokaiHub has no demo mode. Every screen reads the owner's live TIPS data through the passkey-locked bridge, including GPA, credits, attendance, student ID and legal name. The hosted app serves only the owner, so a visitor who opens the live URL reaches a sign-in wall.

Decision:
- **Recording.** Footage comes from a separate Chrome profile that the owner unlocked, copied and recorded headless.
- **Figures.** GPA, credit and attendance values are blanked in the bridge responses before the app renders, so the app shows "—".
- **Student ID.** It is hidden with an injected stylesheet rather than changed in the data, because the app wipes its cache when the ID changes.
- **Other screens.** The graduation card is hidden; the legal name is replaced by the display name.
- **End card.** At the owner's choice it links the live URL and adds "Built for one Tokai student: me." so the sign-in wall is not a surprise.

Consequences: No real figure or identifier appears in any frame, and each clip is checked at its first and last frame. Both Chrome profiles hold an unlocked device token; they are moved to the Trash after the footage is final, and the owner can revoke the device in TokaiHub's settings.

## ADR-068 — Launch videos v4: measured pacing, calm soundtrack, photoreal phone (2026-09-25)

Status: Accepted

Context: The owner found the v3 launch videos (41 s) too fast and their sound generic, with too many noise "shush" sounds. The owner then compared a busy, reference-style soundtrack (a D minor, 128 BPM track shared on X) with the old calm one and rejected the busy one as random and noisy. Mid-round the owner also rejected the CSS phone frame and asked for a real iPhone 18 Pro mockup.

Decision:
- **Pacing.** It comes from measurement (`_toolkit/scripts/pacing.py`), not from the reference, which is a waveform video with no picture to compare.
  - The v3 problems were measured: footage at 1.4 to 1.6x, first taps before the phone settled, and holds of 0 to 0.9 s.
  - v4 plays footage at about natural speed, puts the first tap after the phone lands, ends each beat on a hold of at least 1.2 s, and changes rolling text every 1.5 to 2.0 s. The result is a 57.5 s nine-beat timeline shared by both projects and both languages.
- **Soundtrack.** The old calm bed is canonical, cleaned up in `_toolkit/scripts/music.py`: the same chords and tempo, no noise elements, and a shape that follows the picture. UI clicks sit on the recorded tap times and there are no whooshes. The busy engine was dropped.
- **Phone.** It is Uiscore's "iPhone 18 Pro - Free Mockups" (Figma Community, CC BY 4.0), exported from the owner's own Figma copy. The screen is warped onto each render with a measured `matrix3d` and mask (`_toolkit/scripts/mockup-geometry.py`). Apple's official bezels stay out, because their licence covers App Store apps only.

Consequences:
- CC BY 4.0 requires attribution. The owner chose to add the Uiscore credit themselves, so the shipped credits files do not carry it yet.
- `~/Documents/launch-videos/CATALOG.md` is the base for future videos.
- Older versions, raw recordings, 4K masters and the downloaded reference went to the Trash. Re-rendering a 4K master takes about 3 minutes per project.

## ADR-069 — Launch videos served from public/ for now (2026-09-25)

Status: Accepted

Context: The detail-page carousels now open with the WebDrop and TokaiHub launch videos, one file per language, about 26 MB in total. The options were the repo's `public/` folder (Vercel CDN, inside the Hobby plan's transfer), Vercel Blob (1 GB storage and 10 GB transfer a month free on Hobby, then $0.05 per GB) and Cloudflare R2 (10 GB storage free, no transfer charges, but it needs a bucket, a subdomain and a CSP change).

Decision: At the owner's choice, serve the web encodes from `public/media/launch/`. The carousel loads only a WebP poster until a visitor presses play.

Consequences:
- No new service, and the current CSP (`media-src 'self'`) already allows the files.
- The repo grows by about 26 MB, and each video replacement adds to git history.
- Moving to R2 later means changing the four `video` URLs and the four `poster` URLs in the project data, and adding the media host to the CSP.


## ADR-070 — A "My Toolkit" section for things made for other builders (2026-10-06)

Status: Accepted (uncommitted until the owner's remaining launch videos are ready)

Context: The owner wants to show the agent skills they write (Markdown files others can use) and the upcoming Folio SDK, separately from the finished projects, below the projects section.

Decision: A `toolkit` data array and a `ToolkitCard` that reuses the project-card layout (`.project`, so it collapses on phones the same way). An item with a `video` shows its poster and plays in place with the gallery's `GalleryVideo`; an item without one shows a dashed "Demo video coming soon" placeholder. Folio carries three dashed example slots for the owner's example lesson; `/explain` carries a "Skill files coming soon" label instead of a download link. The section sits between "More Projects" and "Thoughts in words" and has a command-palette entry.

Consequences:
- Adding the remaining videos and examples is a data edit (`video`, `poster`, `examples`, `files`) plus the files in `public/media/`.
- The Folio film is a web encode in `public/media/launch/` under ADR-069.

Amendment (2026-10-06): toolkit cards stack instead of using the project-card two-column grid. The page column is too narrow for a side-by-side video, and toolkit items lead with their media. The `/explain` example uses static screenshots of the explainer page with a thumbnail switcher, not the live HTML, so the site ships no third-party page and the images follow the page language.


## ADR-071: Video Bridge on the portfolio, shown from a local test instance (2026-10-13)

Status: Accepted (uncommitted)

Context: Video Bridge's repo is private, the live app sits behind a sign-in wall, and it has no demo mode. Screenshots from the live server would show real accounts and the owner's real library. Visitors cannot open the app to see a room.

Decision: Shoot the screens and footage from a local isolated instance with local test accounts (host Mohamed, viewers Aisha and Ken) and a library of the owner's own launch films (WebDrop, TokaiHub, Tutor-System). Nothing comes from the live server. The card links only to the live site, `https://bridge.mohamedfuad.com/`, with no GitHub link. The launch film uses the Apple theme (v5), in EN and JA cuts.

Consequences:
- Screens show test names (Mohamed, Aisha, Ken), not real users.
- A re-shoot needs the local-config folder at `~/Documents/launch-videos/videobridge/local-config`.
- The launch-video generator gained the optional keys `factsAt`, `rowAfterWindow`, `out` and `lang`. Films that do not set them render as before.
- The film files follow ADR-069 and are served from `public/media/launch/`.

Amendment (2026-10-13): the films show Big Buck Bunny (Blender Foundation, CC BY 3.0) instead of the owner's own films, so the library in the Decision above is replaced by that one title. The product-native film (v6) leads the gallery and the Apple film (v5) follows. The credit appears in the captions that show the film and on both end cards.

