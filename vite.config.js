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

/**
 * Preloads the latin Figtree file. The app renders its text from JS, so without
 * this the browser only discovers the font after the bundle runs, and the swap
 * from the fallback re-wraps the intro paragraph (a 0.13 layout shift in
 * Lighthouse mobile). The file name is hashed, so it is read from the bundle.
 */
function preloadBodyFont() {
  return {
    name: 'preload-body-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const font = Object.keys(ctx.bundle || {}).find((file) => /figtree-latin-wght-normal-[^/]+\.woff2$/.test(file));
        if (!font) return html;
        return [{ tag: 'link', attrs: { rel: 'preload', href: `/${font}`, as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head-prepend' }];
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), mockVisitsApi(), preloadBodyFont()],
  // The build-time prerender (scripts/prerender.mjs) runs the server bundle in
  // plain Node, which cannot import the CSS some packages ship, so bundle them.
  ssr: { noExternal: true },
});
