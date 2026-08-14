# Architecture

The site is a static Vite React portfolio. The current component and data flow is also rendered in [`graph/architecture.svg`](graph/architecture.svg).

- `index.html` loads Google fonts and the React entry.
- `src/main.jsx` contains localized portfolio data, React components, hash-routed project details, the GitHub contribution fetch, click audio, GSAP orchestration, semantic one-shot scene selection, and title/photo partner reactions for the desktop mascot.
- `src/DaijinMascot.jsx` owns demand-driven atlas decoding, clip-specific frame timelines, an imperative canvas clock, one-shot holding, and clip bridging independently of GSAP section selection.
- `src/styles.css` implements the dark dashed-border system, responsive project-card rails, Daijin's desktop left rail/portrait touch position, and the full-viewport geometry for the mobile cloned-card transition.
- `public/assets/` stores profile/project media, the symbol-only Tokai mark, ClaudeShot artwork, the local Mixkit achievement interaction sound, and nine 512-cell Daijin clip pairs under `assets/daijin/`.
- `public/resume/` stores the CV PDF exposed through the resume button.

The only server-side code is `api/visits.mjs`, a Vercel function backing the footer's visitor counter with an Upstash Redis counter (see ADR-048); it needs `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, and the counter is hidden entirely when they are absent. Everything else is static: the contribution grid reads the public GitHub contributions endpoint and falls back to a committed snapshot, then to embedded activity data.
