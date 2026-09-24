// Writes the server-rendered page into <outDir>/index.html (default dist/).
// Runs after the client build and the SSR build (scripts/build.mjs).
//
// Without this the page is an empty <div id="root"> until the whole bundle has
// downloaded and run: AI crawlers that do not execute JavaScript see nothing,
// and on a throttled phone the first text paints only after ~3.5s.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const htmlPath = `${process.argv[2] || `${root}dist`}/index.html`;
const serverEntry = pathToFileURL(`${root}.ssr/entry-server.mjs`).href;

const { render } = await import(serverEntry);
const markup = render();
const outDir = dirname(htmlPath);
let html = readFileSync(htmlPath, 'utf8');
const empty = '<div id="root"></div>';
if (!html.includes(empty)) throw new Error(`${htmlPath} has no empty #root to fill`);
html = html.replace(empty, `<div id="root">${markup}</div>`);

// With the page in the HTML, the next thing holding up first paint on a slow
// phone is the stylesheet, which shares the connection with the 190 KB script
// (measured: CSS finished at ~2.0s, first paint waited for it). Inline it so
// the first response is enough to paint. Its url()s are root-absolute.
html = html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g, (_, href) => {
  const css = readFileSync(join(outDir, href), 'utf8');
  return `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`;
});

// The theme script was the other render-blocking request. Inline it too. The
// CSP in vercel.json allows it by hash, so check that hash is still current.
const themeInit = readFileSync(join(outDir, 'theme-init.js'), 'utf8');
const hash = `sha256-${createHash('sha256').update(themeInit).digest('base64')}`;
const vercelConfig = readFileSync(join(root, 'vercel.json'), 'utf8');
if (!vercelConfig.includes(`'${hash}'`)) {
  throw new Error(`public/theme-init.js changed: put '${hash}' in script-src in vercel.json`);
}
html = html.replace('<script src="/theme-init.js"></script>', `<script>${themeInit}</script>`);

// React's server renderer adds <link rel="preload" as="image"> for every <img>
// it renders: all six project cards, the logos and the QR code, all fetched at
// high priority ahead of what the first screen needs. Keep only the photo.
// The client tree never renders these tags, so hydration is unaffected.
html = html.replace(/<link rel="preload" as="image" href="([^"]+)"\/>/g, (tag, href) =>
  href === '/media/images/profile-440.webp' ? tag : ''
);

// Start the bundle after first paint instead of racing it (public/boot.js).
html = html.replace(
  /<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/,
  (_, src) => `<script defer src="/boot.js" data-entry="${src}"></script>`
);
if (!html.includes('/boot.js')) throw new Error('module entry script not found in index.html');
writeFileSync(htmlPath, html);
rmSync(`${root}.ssr`, { recursive: true, force: true });
console.log(`prerendered ${Math.round(markup.length / 1024)} KB into ${htmlPath}`);
