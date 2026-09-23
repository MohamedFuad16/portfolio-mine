# Components

- `App`: page composition and section order. Holds the single `useGSAP(..., { scope: mainRef })` block (GSAP + ScrollTrigger) that drives all scroll/entrance animations, gated by `gsap.matchMedia` for reduced-motion. Add new scroll animations there, not as separate effects (see ADR-013).
- `DaijinMascot`: desktop-only fixed mascot outside `#smooth-wrapper`. It decodes only the active
  clip's needed 6×4 WebP atlas sheets, crops authored frames into an imperative 512×512 canvas, skips
  duplicate browser refreshes while the authored frame is unchanged, and exposes clip/frame/scene
  data attributes for diagnostics. React does not rerender per frame. `App` maps semantic page
  sections to deliberate one-shot clips through one scoped ScrollTrigger; a 280ms bridge hides the
  pose jump before the action holds its last selected frame. Playful uses a clean front-facing
  9→23→9 reach timeline and never decodes its corrupted turn/back-view sheet.
- Daijin partners: `SectionTitle` emits `data-daijin-title` hooks; crossing a section plays an elastic title nudge. The old `daijin-playing-with-photo` CSS keyframe was replaced by the frame-synced GSAP knock.
- Daijin placement: `.daijin-mascot` is positioned every GSAP tick from live geometry (translate3d, eased), beside the photo in the profile scene so the playful reach's paw tip (478,230 of the 512 frame) lands 10px inside the photo's left edge, and on the left rail otherwise. The photo knock fires on mascot frame 20 (full stretch), re-arms when the paw is back down, and the reach replays every 5.2s while the profile scene holds (`playKey`). Hidden at <=760px.
- `SectionTitle`: dashed-corner heading label matching the reference site.
- `SkillPill`: `react-icons` component/text skill item inside two slower opposite-direction animated marquee rows; animation pauses on hover.
- `BrandIcon`: local `react-icons` helper for LinkedIn and GitHub button icons.
- Hero name action: animated red rocket button next to the name; click triggers the particle burst without audio.
- Page click effect: a real pointer click shows a water-ripple at the pointer. No sound; the achievement WAV was removed (ADR-061).
- Locale switch: segmented EN|日本語 pill (`.locale-switch`) in the profile handle row; defaults from browser language, remembers user choice, sets locale directly per button (no toggle function).
- `WaveDivider`: decorative monochrome waveform (17 bars from `waveHeights`) between two dotted baselines, placed above the footer; bars grow center-out on scroll, then loop a random-scaleY equalizer forever.
- `Signature`: single-stroke "hello"-style monoline "Mohamed Fuad" — one continuous `stroke` path (Hershey single-line font; data in `src/data/signature-path.js`) where a flat baseline flows in, writes the name, and flows out. Two overlaid paths share the data: `.sig-name` draws in then dims to 0.42, and `.sig-trace` runs a perpetual yoyo DrawSVG highlight that traces the handwriting forever (ADR-022).
- Avatar lightbox: clicking the profile photo plays a paused GSAP timeline (rotate/scale into a fixed blurred overlay outside #smooth-content); backdrop click or Escape reverses it.
- Scroll structure: `#smooth-wrapper > #smooth-content > main` with ScrollSmoother (refs passed, not selectors); `.page-click-effects` and `.avatar-lightbox` are fixed siblings outside the smoothed content.
- QR flip avatar: profile image flips in 3D to show `public/media/images/linkedin-qr.png`, with the QR control toggling photo/back side.
- `ContributionGrid`: GitHub-style grid from the snapshot, refreshed by the public contributions API. A stats row (total, active days, longest/current streak, busiest day) is computed from the drawn cells. One tooltip is portaled into `<body>` and lists up to three public repositories for the day from `activity` in the snapshot. Month labels are buttons that dim other months and put that month's total in the caption; the grid takes arrow keys (ADR-061/062).
- `ExperienceItem`: timeline row with official logo, date/status chip, and expandable bullet details. The whole summary row toggles it (the chevron's `::after` stretches over the row; the company link is raised above it) — see ADR-032. Its `.dot` node encodes status: solid green circle = active job (`tone: 'green'`), hollow bordered circle with a lucide Check = past job (see ADR-016 for the centering math).
- `ProjectCard`: dashed project row with a 16:9 preview, actions, localized description, and a separate full-width technology rail. The five chips remain on one line at desktop and at 390px. The preview is a `<button>` with a persistent mobile "View details" hint.
- `ProjectDetailView`: full-screen, hash-routed (`#/project/<slug>`) bilingual detail page with a 16:9 preview, concise Overview / What it does / How it works copy, a responsive system map, and tech chips. On mobile, the complete tapped `.project` markup is cloned, positioned at the measured card rectangle, and expanded to the viewport over 440ms while the underlying page scales/fades. The clone then yields to the real detail content; close reverses into the source card over 380ms. Reduced motion skips interpolation, and desktop keeps the standard fade/stagger entrance (ADR-029).
- `ProjectArchitecture`: renders each project's four-step system map as semantic HTML/CSS. It uses a horizontal connected flow on desktop and a vertical flow on mobile, avoiding a Mermaid runtime dependency.
- `ProjectFlowChart`: SVG system-architecture flow chart under the system map, driven by each project's `detail.stack`. Stages run down a centre lane; a stage may carry a `branch` drawn to its right. Shapes follow flow-chart convention (terminator, process, decision diamond, cylinder store); geometry is tuned twice (`FLOW_WIDE`/`FLOW_COMPACT`, chosen live by `useCompactFlow`) since a single geometry rendered illegibly small on phones (ADR-035). Styled to match the user's Excalidraw-style reference (ADR-039): self-hosted "Excalifont" hand-drawn typeface (`public/fonts/Excalifont-Regular.woff2`), Excalidraw's own palette per stage `kind` via `FLOW_TONE`/`--fc-tone`, and a shared `#fc-sketch` SVG filter for a hand-drawn wobble on shapes/edges only (not text). Labels must stay short — SVG text does not wrap.
- `useReducedMotion`: shared live `prefers-reduced-motion` flag used to stand down the border beam and thinking orb.
- Profile decorations: `BorderBeam` wraps the avatar. The thinking orb was removed on 2026-09-23 (ADR-062).
- Daijin media: `public/media/mascot/` contains paired 3072×2048 `-a.webp`/`-b.webp` sheets for Idle,
  Listening, Thinking, Working, Clever, Playful, Curious, Happy, and Walk. Each cell is 512×512;
  sheet A carries frames 0–22 and sheet B frames 23–45.
- `ProjectFilters`: chips from `PROJECT_TAGS` (only tags some project carries); hidden cards use the `hidden` attribute and trigger `ScrollTrigger.refresh()`. `SkillPill` renders a button when `skillTag(label)` maps to a filter.
- `ProjectCard` hover clip: optional `project.video`, played on mouse enter or focus only, `preload="none"`, faded in once playing.
- `CommandMenu`: Cmd/Ctrl+K dialog with sections, projects, actions (copy email, résumé, GitHub, LinkedIn) and settings (theme, language). Also opened by the ⌘K button in the handle row.
- Theme: `theme` state sets `data-theme` on `<html>`; overrides live in `src/styles/theme-light.css`. Toggle button sits beside the ⌘K button.
- `ExperienceItem`: tenure from `start`/`end` ("YYYY-MM", `end: null` = current) and a bar on `EXPERIENCE_RANGE`; optional `result`/`resultJa` line.
- `BenchmarkBars`: optional `detail.benchmark` on a project renders one horizontal bar chart per measure (never a shared axis), our row in the accent, direct value labels, a screen-reader table and a source caption. Used by Ledger (time and input tokens per report).

