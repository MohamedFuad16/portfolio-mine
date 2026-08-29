import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const publicDir = join(root, 'public');
const missing = [];

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sourceFiles = [join(root, 'index.html'), ...walk(join(root, 'src'))].filter((path) =>
  ['.html', '.js', '.jsx', '.css'].includes(extname(path))
);

for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/['"(](\/(?:media|resume)\/[^'"\s)]+)/g)) {
    const asset = join(publicDir, match[1].slice(1));
    if (!existsSync(asset)) missing.push(`${relative(root, file)} -> ${match[1]}`);
  }
}

for (const file of walk(publicDir).filter((path) => extname(path) === '.svg')) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\bhref=["']([^"']+)["']/g)) {
    const href = match[1];
    if (/^(?:data:|https?:|#)/.test(href)) continue;
    const asset = href.startsWith('/') ? join(publicDir, href.slice(1)) : resolve(dirname(file), href);
    if (!existsSync(asset)) missing.push(`${relative(root, file)} -> ${href}`);
  }
}

if (missing.length) {
  console.error(`Missing public assets:\n${missing.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log('All referenced public assets exist.');
