# Components

- `App`: page composition and section order. Holds the single `useGSAP(..., { scope: mainRef })` block (GSAP + ScrollTrigger) that drives all scroll/entrance animations, gated by `gsap.matchMedia` for reduced-motion. Add new scroll animations there, not as separate effects (see ADR-013).
- `SectionTitle`: dashed-corner heading label matching the reference site.
- `SkillPill`: `react-icons` component/text skill item inside two slower opposite-direction animated marquee rows; animation pauses on hover.
- `BrandIcon`: local `react-icons` helper for LinkedIn and GitHub button icons.
- Hero name action: animated red rocket button next to the name; click plays a short Web Audio chime and particle burst.
- Page click effect: any ordinary page click plays a short Web Audio chime and shows a water-ripple at the pointer — three staggered hairline rings that expand (animating width/height, not scale, so they stay thin) and fade, plus a soft center flash (`.click-burst` `i` ×3 + `::before`; ADR-024).
- Locale switch: segmented EN|日本語 pill (`.locale-switch`) in the profile handle row; defaults from browser language, remembers user choice, sets locale directly per button (no toggle function).
- `WaveDivider`: decorative monochrome waveform (17 bars from `waveHeights`) between two dotted baselines, placed above the footer; bars grow center-out on scroll, then loop a random-scaleY equalizer forever.
- `Signature`: single-stroke "hello"-style monoline "Mohamed Fuad" — one continuous `stroke` path (Hershey single-line font; data in `src/signature-path.js`, regenerate with the scratchpad `build-v3.mjs` per ADR-021) where a flat baseline flows in, writes the name, and flows out. Two overlaid paths share the data: `.sig-name` draws in then dims to 0.42, and `.sig-trace` runs a perpetual yoyo DrawSVG highlight that traces the handwriting forever (ADR-022). Stroke width from the JS `signatureStrokeWidth` export (set as the `strokeWidth` attribute, not CSS); tracer defaults to CSS `opacity:0` (reduced-motion shows only the static line).
- Avatar lightbox: clicking the profile photo plays a paused GSAP timeline (rotate/scale into a fixed blurred overlay outside #smooth-content); backdrop click or Escape reverses it.
- Scroll structure: `#smooth-wrapper > #smooth-content > main` with ScrollSmoother (refs passed, not selectors); `.page-click-effects` and `.avatar-lightbox` are fixed siblings outside the smoothed content.
- QR flip avatar: profile image flips in 3D to show `public/assets/linkedin-qr.png`, with the QR control toggling photo/back side.
- `ContributionGrid`: GitHub-style activity grid populated from the public MohamedFuad16 contributions API with a local fallback.
- `ExperienceItem`: timeline row with official logo, date/status chip, and expandable bullet details. Its `.dot` node encodes status: solid green circle = active job (`tone: 'green'`), hollow bordered circle with a lucide Check = past job (see ADR-016 for the centering math).
- `ProjectCard`: dashed project row with a captured live-site preview, bottom-right badge, actions, localized description, and tech tags.
