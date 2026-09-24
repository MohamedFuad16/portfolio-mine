// `pnpm build`: client build, then the SSR bundle, then the prerender that
// fills dist/index.html. Flags pass through to the client build, so
// `pnpm build --outDir some/dir` (used by scripts/perf-audit.mjs) still works.
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const at = args.indexOf('--outDir');
const outDir = resolve(at >= 0 ? args[at + 1] : 'dist');
const run = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, { stdio: 'inherit' });

run('vite', ['build', ...args]);
run('vite', ['build', '--ssr', 'src/entry-server.jsx', '--outDir', '.ssr', '--emptyOutDir']);
run('node', ['scripts/prerender.mjs', outDir]);
