# Setup

- Install: `pnpm install`
- Develop: `pnpm dev`
- Build: `pnpm build`
- Preview: `pnpm preview`

In the Codex desktop runtime, prefix commands with the bundled Node path if the shell cannot find `node`:
`PATH=/Users/mfuad16/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm build`

The app is a Vite React single page site. Static files live in `public/`; source code lives in `src/`.
