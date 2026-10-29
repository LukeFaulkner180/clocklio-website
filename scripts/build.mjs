import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { prepareSeo } from './seo.mjs';

const suppliedPath = (process.env.SITE_BASE_PATH || '').trim();
if (!/^(?:\/[A-Za-z0-9._-]*)*\/?$/.test(suppliedPath) || suppliedPath.split('/').some(part => part === '.' || part === '..')) throw new Error('SITE_BASE_PATH must be a safe absolute URL path.');
const basePath = suppliedPath.replace(/\/+$/, '');
const siteConfig = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
// The checked-in static pages still contain the former project URL.
const sourceSiteURL = 'https://lukefaulkner180.github.io/clocklio-website/';
const sourceAppURL = 'https://clocklio.pages.dev/';
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
    if (siteURL) content = content.replaceAll(sourceSiteURL, siteURL.href);
    content = content.replaceAll(sourceAppURL, siteConfig.appURL);
    if (basePath && entry.name.endsWith('.html')) content = content.replace(/(\b(?:href|src)=["'])\/(?!\/)/gi, '$1' + basePath + '/');
    if (basePath && entry.name.endsWith('.css')) content = content.replace(/(url\(["']?)\/(?!\/)/gi, '$1' + basePath + '/');
    await writeFile(file, content);
  }
}
await prepare(fileURLToPath(destination));
await prepareSeo(fileURLToPath(destination));

// Give each published stylesheet a content-based URL. Keep the original copy
// available for older cached pages while the current HTML loads fresh styles.
const stylesheetVersions = new Map();
for (const name of ['styles.css', 'experience.css', 'polish.css', 'resources.css', 'launch.css', 'seo-features.css', 'social-profiles.css', 'knowledge-base.css', 'geo-clockin.css']) {
  const content = await readFile(new URL(name, destination));
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  const versionedName = name.replace('.css', '.' + hash + '.css');
  stylesheetVersions.set(name, versionedName);
  await writeFile(new URL(versionedName, destination), content);
}
const socialScript = await readFile(new URL('social-profiles.js', destination));
const socialHash = createHash('sha256').update(socialScript).digest('hex').slice(0, 12);
const socialScriptName = `social-profiles.${socialHash}.js`;
await writeFile(new URL(socialScriptName, destination), socialScript);
const trainingScript = await readFile(new URL('knowledge-base.js', destination));
const trainingHash = createHash('sha256').update(trainingScript).digest('hex').slice(0, 12);
const trainingScriptName = `knowledge-base.${trainingHash}.js`;
await writeFile(new URL(trainingScriptName, destination), trainingScript);
async function versionStyles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await versionStyles(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = await readFile(file, 'utf8');
    const versioned = html.replace(/(href=["'])([^"']*\/)(styles|experience|polish|resources|launch|seo-features|social-profiles|knowledge-base)\.css(?:\?[^"']*)?(["'])/g,
      (_, attribute, prefix, name, quote) => attribute + prefix + stylesheetVersions.get(name + '.css') + quote);
    const withSocialVersion = versioned.replace(/(src=["'])([^"']*\/)social-profiles\.js(?:\?[^"']*)?(["'])/g,
      (_, attribute, prefix, quote) => attribute + prefix + socialScriptName + quote);
    const withTrainingVersion = withSocialVersion.replace(/(src=["'])([^"']*\/)knowledge-base\.js(?:\?[^"']*)?(["'])/g, (_, attribute, prefix, quote) => attribute + prefix + trainingScriptName + quote);
    await writeFile(file, withTrainingVersion);
  }
}
await versionStyles(fileURLToPath(destination));
await writeFile(new URL('.nojekyll', destination), '');
console.log('Built plain HTML, CSS and JavaScript into dist/ for ' + (siteURL?.href || basePath + '/') + '.');
