# Architecture

The site is a Vite React portfolio deployed to Vercel. The current component and data flow is also rendered in [`graph/architecture.svg`](graph/architecture.svg).

- `index.html` loads Google fonts and the React entry.
- `src/main.jsx` initializes anonymous Vercel Web Analytics and mounts React through the error boundary.
- `src/App.jsx` contains localized portfolio data, hash-routed project details, contribution loading, click audio, GSAP orchestration, semantic one-shot scene selection, and title/photo partner reactions for the desktop mascot. It reports sanitized `/` and `/project/<slug>` virtual page views.
- `src/components/DaijinMascot.jsx` owns demand-driven atlas decoding, clip-specific frame timelines, an imperative canvas clock, one-shot holding, and clip bridging independently of GSAP section selection.
- `src/styles/global.css` implements the dark dashed-border system, responsive project-card rails, Daijin's desktop left rail/portrait touch position, and the full-viewport geometry for the mobile cloned-card transition.
- `public/media/` separates audio, contribution data, images, logos, mascot atlases, and project artwork.
- `public/resume/` stores the CV PDF exposed through the resume button.

The only server-side code is `api/visits.mjs`, a Vercel function backing the footer's visitor counter with an Upstash Redis counter (see ADR-048); it needs `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, and the counter is hidden entirely when they are absent. The contribution grid reads the public GitHub contributions endpoint and falls back to a committed snapshot, then to embedded activity data. Vercel Web Analytics is a separate anonymous page-view service enabled from the project dashboard.
