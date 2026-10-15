import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const suppliedPath = (process.env.SITE_BASE_PATH || '').trim();
if (!/^(?:\/[A-Za-z0-9._-]*)*\/?$/.test(suppliedPath) || suppliedPath.split('/').some(part => part === '.' || part === '..')) throw new Error('SITE_BASE_PATH must be a safe absolute URL path.');
const basePath = suppliedPath.replace(/\/+$/, '');
const suppliedURL = process.env.SITE_URL;
const siteURL = suppliedURL ? new URL(suppliedURL.replace(/\/+$/, '') + '/') : null;
if (siteURL && (!['https:', 'http:'].includes(siteURL.protocol) || siteURL.username || siteURL.password || siteURL.search || siteURL.hash || siteURL.pathname !== basePath + '/')) throw new Error('SITE_URL must match SITE_BASE_PATH and use HTTP or HTTPS.');
const destination = new URL('../dist/', import.meta.url);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(new URL('../public/', import.meta.url), destination, { recursive: true });

async function prepare(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await prepare(file); continue; }
    if (!/\.(?:html|css|xml|txt)$/.test(entry.name)) continue;
    let content = await readFile(file, 'utf8');
    if (siteURL) content = content.replaceAll('https://clocknexa.co.uk/', siteURL.href);
    if (basePath && entry.name.endsWith('.html')) content = content.replace(/(\b(?:href|src)=["'])\/(?!\/)/gi, '$1' + basePath + '/');
    if (basePath && entry.name.endsWith('.css')) content = content.replace(/(url\(["']?)\/(?!\/)/gi, '$1' + basePath + '/');
    await writeFile(file, content);
  }
}
await prepare(fileURLToPath(destination));
await writeFile(new URL('.nojekyll', destination), '');
console.log('Built plain HTML, CSS and JavaScript into dist/ for ' + (siteURL?.href || basePath + '/') + '.');
