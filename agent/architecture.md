# Architecture

The site is a static Vite React portfolio.

- `index.html` loads Google fonts and the React entry.
- `src/main.jsx` contains the portfolio data arrays and presentational React components.
- `src/styles.css` implements the dark, compact, dashed-border visual system.
- `public/assets/` stores generated bitmap visuals used by the profile and project cards.
- `public/resume/` stores the CV PDF exposed through the resume button.

There is no backend, API connector, or persistence layer.
