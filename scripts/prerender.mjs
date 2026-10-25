// Writes the server-rendered pages into <outDir> (default dist/): index.html for
// the home page and projects/<slug>.html for each project detail page.
// Runs after the client build and the SSR build (scripts/build.mjs).
//
// Without this the page is an empty <div id="root"> until the whole bundle has
// downloaded and run: AI crawlers that do not execute JavaScript see nothing,
// and on a throttled phone the first text paints only after ~3.5s.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const htmlPath = `${process.argv[2] || `${root}dist`}/index.html`;
const serverEntry = pathToFileURL(`${root}.ssr/entry-server.mjs`).href;

const { render, projects, HOME_TITLE, projectTitle } = await import(serverEntry);
const outDir = dirname(htmlPath);
const dateModifiedPattern = /"dateModified": "[^"]*"/;
let template = readFileSync(htmlPath, 'utf8');
const empty = '<div id="root"></div>';
if (!template.includes(empty)) throw new Error(`${htmlPath} has no empty #root to fill`);
// App.jsx restores the home title after a project closes, so it must match.
const homeTitle = template.match(/<title>([^<]*)<\/title>/)?.[1].replace(/&amp;/g, '&');
if (homeTitle !== HOME_TITLE) {
  throw new Error(`index.html <title> is "${homeTitle}": set HOME_TITLE in src/App.jsx to match`);
}

const themeInit = readFileSync(join(outDir, 'theme-init.js'), 'utf8');
const hash = `sha256-${createHash('sha256').update(themeInit).digest('base64')}`;
const vercelConfig = readFileSync(join(root, 'vercel.json'), 'utf8');
if (!vercelConfig.includes(`'${hash}'`)) {
  throw new Error(`public/theme-init.js changed: put '${hash}' in script-src in vercel.json`);
}

const SITE = 'https://www.mohamedfuad.com';

// Google wants dateModified as a full ISO 8601 date-time with an offset, and a
// hand-written date went stale. Use the last commit that changed site content
// (the daily contribution snapshot does not count), shown in Tokyo time. Falls
// back to the build time when git history is not available.
function lastModified() {
  let when = new Date();
  try {
    const iso = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', 'index.html', 'src', 'public', ':!public/media/data'],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    if (iso) when = new Date(iso);
  } catch {}
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo', hourCycle: 'h23', year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(when).map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+09:00`;
}

if (!dateModifiedPattern.test(template)) throw new Error('index.html JSON-LD has no dateModified');
template = template.replace(dateModifiedPattern, `"dateModified": "${lastModified()}"`);

// Turns the client-built template into a finished page: fills #root, then the
// head transform (home: none) and the steps shared by every page.
function buildPage(markup, transformHead = (h) => h) {
  let html = template.replace(empty, `<div id="root">${markup}</div>`);
  html = transformHead(html);

  // With the page in the HTML, the next thing holding up first paint on a slow
  // phone is the stylesheet, which shares the connection with the 190 KB script
  // (measured: CSS finished at ~2.0s, first paint waited for it). Inline it so
  // the first response is enough to paint. Its url()s are root-absolute.
  html = html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g, (_, href) => {
    const css = readFileSync(join(outDir, href), 'utf8');
    return `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`;
  });

  // The theme script was the other render-blocking request. Inline it too. The
  // CSP in vercel.json allows it by hash, checked above.
  html = html.replace('<script src="/theme-init.js"></script>', () => `<script>${themeInit}</script>`);

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
  return html;
}

const escapeAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeJson = (value) => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');

// Replaces the first match, and throws when there is none, so an edit to
// index.html cannot silently ship a project page with the home head.
function swap(html, pattern, replacement, what) {
  if (!pattern.test(html)) throw new Error(`index.html head: no match for ${what}`);
  return html.replace(pattern, () => replacement);
}

function projectHead(project) {
  const url = `${SITE}/projects/${project.slug}`;
  const title = projectTitle(project);
  const image = new URL(project.image, SITE).href;
  const description = project.description;
  const personId = `${SITE}/#person`;
  const projectNode = {
    '@type': project.live ? 'SoftwareApplication' : 'SoftwareSourceCode',
    '@id': `${url}#project`,
    name: project.title,
    description,
    image,
    author: { '@id': personId },
    mainEntityOfPage: { '@id': `${url}#webpage` },
  };
  if (project.live) {
    projectNode.applicationCategory = 'WebApplication';
    projectNode.url = project.live;
  }
  if (project.github) projectNode.codeRepository = project.github;
  if (project.tech?.length) projectNode.keywords = project.tech.join(', ');
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        isPartOf: { '@id': `${SITE}/#website` },
        about: { '@id': `${url}#project` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
        inLanguage: ['en', 'ja'],
        primaryImageOfPage: image,
      },
      projectNode,
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: project.title, item: url },
        ],
      },
    ],
  };
  return (html) => {
    let h = html;
    h = swap(h, /<html lang="en">/, '<html lang="en" data-prerender-route="project">', '<html> tag');
    h = swap(h, /<title>[^<]*<\/title>/, `<title>${escapeAttr(title)}</title>`, '<title>');
    h = swap(
      h,
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escapeAttr(description)}" />`,
      'meta description'
    );
    h = swap(h, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`, 'canonical');
    const meta = (attr, name, value) =>
      swap(
        h,
        new RegExp(`<meta ${attr}="${name}" content="[^"]*" \\/>`),
        `<meta ${attr}="${name}" content="${escapeAttr(value)}" />`,
        `${name}`
      );
    h = meta('property', 'og:type', 'website');
    h = meta('property', 'og:url', url);
    h = meta('property', 'og:title', title);
    h = meta('property', 'og:description', description);
    h = meta('property', 'og:image', image);
    h = meta('name', 'twitter:title', title);
    h = meta('name', 'twitter:description', description);
    h = meta('name', 'twitter:image', image);
    // The home image is 1000x750; these images differ, so drop the dimensions.
    h = swap(h, /[ \t]*<meta property="og:image:width" content="[^"]*" \/>\n/, '', 'og:image:width');
    h = swap(h, /[ \t]*<meta property="og:image:height" content="[^"]*" \/>\n/, '', 'og:image:height');
    // profile:* only belongs with og:type profile, which is the home page.
    h = swap(h, /[ \t]*<meta property="profile:first_name" content="[^"]*" \/>\n/, '', 'profile:first_name');
    h = swap(h, /[ \t]*<meta property="profile:last_name" content="[^"]*" \/>\n/, '', 'profile:last_name');
    h = swap(
      h,
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">\n${escapeJson(graph)}\n    </script>`,
      'ld+json block'
    );
    return h;
  };
}

const pages = [{ file: htmlPath, path: '/', head: undefined }];
for (const project of projects.filter((p) => p.detail)) {
  pages.push({
    // <slug>.html, not <slug>/index.html: `vite preview` serves /projects/x
    // from projects/x.html but falls back to the home page for x/index.html.
    // vercel.json rewrites the same path to this file.
    file: join(outDir, 'projects', `${project.slug}.html`),
    path: `/projects/${project.slug}`,
    head: projectHead(project),
  });
}
for (const page of pages) {
  const markup = render(page.path);
  const html = buildPage(markup, page.head);
  mkdirSync(dirname(page.file), { recursive: true });
  writeFileSync(page.file, html);
  console.log(`prerendered ${page.path} (${Math.round(markup.length / 1024)} KB) into ${page.file}`);
}
rmSync(`${root}.ssr`, { recursive: true, force: true });
