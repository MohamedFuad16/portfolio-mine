import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React plugin is what gives the dev server Fast Refresh. Without a config
// file Vite still transformed JSX through esbuild, so the build worked and the
// omission was invisible — but every edit forced a full page reload, which also
// tears down the GSAP/ScrollSmoother state you are usually trying to inspect.

/**
 * `api/visits.mjs` is a Vercel serverless function, and `vite dev` does not run
 * those — so without this the footer counter is simply absent locally and the
 * pop-in animation cannot be seen or tested. This serves the same two responses
 * from memory. Dev only (`apply: 'serve'`); it is never part of a build.
 */
function mockVisitsApi() {
  let count = 1337;
  const seen = new Set();
  return {
    name: 'mock-visits-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/visits', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        if (req.method === 'POST') {
          const key = req.headers['user-agent'] || 'unknown';
          const fresh = !seen.has(key);
          if (fresh) { seen.add(key); count += 1; }
          res.end(JSON.stringify({ count, counted: fresh }));
          return;
        }
        res.end(JSON.stringify({ count }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), mockVisitsApi()],
});
