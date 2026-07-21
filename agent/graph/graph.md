# Graph

- `index.html` → boots `src/main.jsx` through Vite.
- `src/main.jsx` → owns localized portfolio data, UI components, hash routing, GitHub contribution loading, click audio, and GSAP orchestration.
- `src/main.jsx` → imports `src/styles.css` and `src/signature-path.js`; changing its card/detail markup affects both responsive CSS and GSAP selectors.
- `src/styles.css` → controls the shared dashed UI, two-column project cards, full-width technology rails, mobile full-card clone/viewport layout, and every responsive breakpoint.
- `public/assets/*-site*.png` → supplies WebDrop, Tutor-System, and TokaiHub previews to `ProjectCard` and `ProjectDetailView`.
- `public/assets/claudeshot-preview.svg` → embeds `claudeshot-icon.png`; both feed the ClaudeShot card and detail page.
- `public/assets/tokai-university-logo.svg` → is rendered by the profile metadata link.
- `public/assets/retro-coin.mp3` → is preloaded by `src/main.jsx` and cloned for page, QR, and rocket interactions.
- `public/assets/profile.jpg` and `linkedin-qr.png` → feed the avatar, lightbox, and QR flip.
- `public/resume/*.pdf` → is linked according to the active locale.
- GitHub contributions API → feeds `ContributionGrid`, which falls back to embedded data when unavailable.

## Change impact

- Project data shape → `ProjectCard`, `ProjectDetailView`, localized actions, and system maps.
- `.project` geometry and markup → mobile detail-origin measurement, inert clone face, and reverse destination.
- `.project-detail` geometry → mobile expansion target; it must fill the viewport before the real detail content replaces the cloned card face.
- `src/main.jsx` class names → GSAP selectors and `src/styles.css`; rename only with both consumers updated.
- Static asset filenames → hard-coded public URLs in `src/main.jsx` and, for ClaudeShot, the nested SVG image reference.

## Last generated
- 2026-07-22 via dependency-cruiser (npx).
