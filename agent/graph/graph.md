# Graph

- `index.html` → boots `src/main.jsx` through Vite.
- `src/main.jsx` → initializes Vercel Web Analytics and renders `src/App.jsx` through the error boundary.
- `src/App.jsx` → owns localized portfolio data, UI components, hash routing, GitHub contribution loading, click audio, GSAP orchestration, and sanitized virtual page views.
- `src/App.jsx` → imports `src/styles/global.css`, `src/data/signature-path.js`, and `src/components/DaijinMascot.jsx`; changing card/detail markup affects responsive CSS and GSAP selectors.
- `src/App.jsx` → maps semantic sections to one-shot Daijin scenes and
  animates the corresponding title/photo partner.
- `src/components/DaijinMascot.jsx` → decodes one paired clip from `public/media/mascot/`, bridges clip changes,
  advances or holds an imperative canvas crop, skips excluded clip frames, and leaves placement to
  the responsive CSS left rail.
- `src/styles/global.css` → controls the shared dashed UI, project cards, mobile clone layout, mascot rail, and responsive breakpoints.
- `public/media/projects/` → supplies project previews; `claudeshot.svg` embeds sibling `claudeshot-icon.png`.
- `public/media/logos/`, `images/`, and `audio/` → supply profile metadata, avatar/QR, and interaction sound.
- `public/media/data/contributions.json` → provides the scheduled contribution snapshot fallback.
- `public/resume/*.pdf` → is linked according to the active locale.
- GitHub contributions API → feeds `ContributionGrid`, which falls back to embedded data when unavailable.

## Change impact

- Project data shape → `ProjectCard`, `ProjectDetailView`, localized actions, and system maps.
- `.project` geometry and markup → mobile detail-origin measurement, inert clone face, and reverse destination.
- `.project-detail` geometry → mobile expansion target; it must fill the viewport before the real detail content replaces the cloned card face.
- `src/App.jsx` class names → GSAP selectors and `src/styles/global.css`; rename only with both consumers updated.
- Static asset filenames → hard-coded public URLs in `src/App.jsx`, the contribution workflow, and nested SVG references; run `pnpm check:assets`.
- Daijin clip IDs → `src/App.jsx` section selection, `src/components/DaijinMascot.jsx` URL construction, and paired files under `public/media/mascot/`; all three must stay synchronized.
- Analytics route normalization → Vercel page reports; never include arbitrary query strings or personal data.

## Last generated
- 2026-08-30 via dependency-cruiser (npx).
