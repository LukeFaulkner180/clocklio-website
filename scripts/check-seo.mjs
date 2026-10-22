import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.env.SITE_CHECK_DIRECTORY || 'public');
const metadata = JSON.parse(await readFile(new URL('../content/seo.json', import.meta.url), 'utf8'));
const config = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
const titles = new Set(), canonicals = new Set();
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
let pages = 0;
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await walk(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    pages++;
    const relative = path.relative(root, file).split(path.sep).join('/');
    const pathname = '/' + (relative === 'index.html' ? '' : relative.replace(/index\.html$/, ''));
    const html = await readFile(file, 'utf8'), expected = metadata[pathname];
    assert.ok(expected, `Missing page metadata: ${pathname}`);
    const title = decode(html.match(/<title>([^<]+)<\/title>/)?.[1] || '');
    assert.equal(title, expected.title, pathname + ': title');
    assert.ok(!titles.has(title), pathname + ': unique title'); titles.add(title);
    const descriptions = [...html.matchAll(/<meta name="description" content="([^"]+)">/g)];
    assert.equal(descriptions.length, 1, pathname + ': one description');
    assert.equal(decode(descriptions[0][1]), expected.description);
    for (const property of ['og:title', 'og:description', 'og:image', 'og:image:alt', 'og:locale']) assert.equal([...html.matchAll(new RegExp(`<meta property="${property}" content="[^"]+">`, 'g'))].length, 1, pathname + ': ' + property);
    if (pathname === '/404.html') {
      assert.match(html, /<meta name="robots" content="noindex, follow">/);
      assert.equal((html.match(/rel="canonical"/g) || []).length, 0);
      continue;
    }
    assert.match(html, /<meta name="robots" content="index, follow">/);
    const canonical = new URL(pathname.slice(1), config.websiteURL).href;
    const canonicalTags = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)];
    assert.equal(canonicalTags.length, 1, pathname + ': one canonical');
    assert.equal(canonicalTags[0][1], canonical, pathname + ': production domain');
    canonicals.add(canonical);
    const scripts = [...html.matchAll(/<script id="dayridge-seo" type="application\/ld\+json">(.*?)<\/script>/gs)];
    assert.equal(scripts.length, 1, pathname + ': one structured data block');
    const schema = JSON.parse(scripts[0][1]);
    assert.equal(schema['@context'], 'https://schema.org');
    for (const type of ['WebSite', 'Organization', 'WebPage']) assert.equal(schema['@graph'].filter(item => item['@type'] === type).length, 1);
    const page = schema['@graph'].find(item => item['@type'] === 'WebPage');
    assert.equal(page.url, canonical); assert.equal(page.name, expected.title);
    assert.equal(schema['@graph'].some(item => ['Offer', 'Review', 'AggregateRating'].includes(item['@type'])), false);
    if (pathname !== '/') assert.ok(schema['@graph'].some(item => item['@type'] === 'BreadcrumbList'));
  }
}
await walk(root);
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const listed = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decode(match[1]));
assert.equal(listed.length, new Set(listed).size, 'Sitemap entries must be unique');
assert.deepEqual(new Set(listed), canonicals, 'Sitemap matches indexable canonical pages');
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
assert.ok(robots.includes(`Sitemap: ${new URL('sitemap.xml', config.websiteURL).href}`));
assert.doesNotMatch(robots, /Disallow:\s*\/\s*$/m);
const home = await readFile(path.join(root, 'index.html'), 'utf8');
for (const slug of ['clocking-in-software', 'staff-rota-software', 'annual-leave-management']) assert.match(home, new RegExp(`href="[^"]*/${slug}/"`), 'Homepage links to ' + slug);
console.log(`Checked SEO for ${pages} pages: unique titles, descriptions, canonical URLs, sharing metadata, structured data, homepage feature links and sitemap coverage.`);
