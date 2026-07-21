# Architecture

The site is a static Vite React portfolio. The current component and data flow is also rendered in [`graph/architecture.svg`](graph/architecture.svg).

- `index.html` loads Google fonts and the React entry.
- `src/main.jsx` contains localized portfolio data, React components, hash-routed project details, the GitHub contribution fetch, click audio, and GSAP orchestration.
- `src/styles.css` implements the dark dashed-border system, responsive project-card rails, and the full-viewport geometry for the mobile cloned-card transition.
- `public/assets/` stores profile/project media, the symbol-only Tokai mark, ClaudeShot artwork, and the local Mixkit achievement interaction sound.
- `public/resume/` stores the CV PDF exposed through the resume button.

There is no owned backend or persistence layer. The contribution grid reads the public GitHub contributions endpoint and falls back to embedded activity data.
