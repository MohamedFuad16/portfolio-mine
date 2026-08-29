# Conventions

- Keep `src/main.jsx` entry-only; page composition and content live in `src/App.jsx`.
- Put reusable UI in `src/components/`, generated data in `src/data/`, and styles in `src/styles/`.
- Keep public assets in `public/media/{audio,data,images,logos,mascot,projects}/`; CVs stay in `public/resume/`.
- Use CSS classes in `src/styles/global.css`; avoid inline styles except for small per-item CSS variables.
- New or renamed public assets must pass `pnpm check:assets`.
- Maintain the compact dark reference style: centered narrow column, dashed borders, low-radius controls, restrained motion.
