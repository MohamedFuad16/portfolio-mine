# Setup

- **Node ^20.19.0 || >=22.12.0** (pinned in `.nvmrc` and `package.json` engines).
  Vite 8 bundles rolldown, which imports `styleText` from `node:util` — on older
  Node every command dies with
  `SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'`.
  The default `node` on this machine is 20.11.0, so prefix with a newer one:
  `PATH=/opt/homebrew/bin:$PATH pnpm build`
- Install: `pnpm install`
- Develop: `pnpm dev`
- Build: `pnpm build`
- Preview: `pnpm preview`

`vite.config.js` wires up `@vitejs/plugin-react`; without it Vite still compiles
JSX through esbuild but the dev server has no Fast Refresh.

In the Codex desktop runtime, prefix commands with the bundled Node path if the shell cannot find `node`:
`PATH=/Users/mfuad16/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm build`

The app is a Vite React single page site. Static files live in `public/`; source code lives in `src/`.
