import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

// Audit every indexable static page, including help and training subpages.
const root = path.resolve(process.env.QA_SITE_DIRECTORY || 'public');
const basePath = (process.env.QA_BASE_PATH || '').replace(/\/+$/, '');
const artifactDirectory = process.env.QA_ARTIFACT_DIRECTORY || 'artifacts';
const media = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.xml': 'text/xml', '.pdf': 'application/pdf' };
const server = createServer(async (req, response) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (basePath && pathname !== basePath && !pathname.startsWith(basePath + '/')) throw new Error('Outside site root');
    const relative = pathname.slice(basePath.length) || '/';
    let file = path.resolve(root, '.' + relative);
    if (!(file === root || file.startsWith(root + path.sep))) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    response.writeHead(200, { 'content-type': media[path.extname(file)] ?? 'application/octet-stream' });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port + basePath;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const routes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1].replaceAll('&amp;', '&')).pathname.slice(1));
assert.ok(routes.length >= 45, 'Audit must cover the full marketing site');
await mkdir(artifactDirectory, { recursive: true });
const errors = [];
const samples = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 960 : 844 });
    for (const route of routes) {
      await page.goto(origin + '/' + route, { waitUntil: 'domcontentloaded' });
      const result = await page.evaluate(() => {
        const main = document.querySelector('main');
        const heading = main?.querySelector('h1');
        const nav = document.querySelector('header.site-header');
        const firstTexts = [...(main?.querySelectorAll('h1,h2,h3,p,.eyebrow,.label,.announcement,.resource-note > b') ?? [])].filter(element => {
          const style = getComputedStyle(element);
          const box = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0 && box.bottom > 0;
        }).map(element => ({ text: element.textContent.trim().slice(0, 45), top: element.getBoundingClientRect().top }));
        const headerBottom = nav ? nav.getBoundingClientRect().bottom : 0;
        const headline = heading?.getBoundingClientRect();
        return {
          viewport: innerWidth,
          scroll: document.documentElement.scrollWidth,
          headerBottom,
          headingTop: headline?.top ?? null,
          firstMainText: firstTexts.sort((a, b) => a.top - b.top)[0] ?? null,
          brokenImages: [...document.querySelectorAll('main img')].filter(img => img.complete && img.naturalWidth === 0).length,
          missingHeading: !heading,
        };
      });
      const label = width + 'px /' + route;
      if (result.scroll > result.viewport + 2) errors.push(label + ': horizontal overflow ' + (result.scroll - result.viewport) + 'px');
      if (result.missingHeading) errors.push(label + ': missing main heading');
      if (result.headingTop !== null && result.headingTop < result.headerBottom - 5) errors.push(label + ': heading hidden behind navigation (' + result.headingTop.toFixed(0) + ' < ' + result.headerBottom.toFixed(0) + ')');
      if (result.firstMainText && result.firstMainText.top < result.headerBottom - 7) errors.push(label + ': text hidden behind navigation: ' + result.firstMainText.text + ' (' + result.firstMainText.top.toFixed(0) + ' < ' + result.headerBottom.toFixed(0) + ')');
      if (result.brokenImages) errors.push(label + ': ' + result.brokenImages + ' broken images');
      if (['', 'features/', 'pricing/', 'brochure/', 'help/', 'coming-soon/', 'contact/'].includes(route)) {
        samples.push({ route, width, ...result });
      }
    }
  }
  await writeFile(path.join(artifactDirectory, 'responsive-layout-report.json'), JSON.stringify({
    routeCount: routes.length,
    viewports: [320, 390, 768, 1440],
    testedPages: routes.length * 4,
    errors,
    samples,
  }, null, 2));
  console.log('Checked ' + routes.length + ' pages at 320, 390, 768 and 1440px (' + routes.length * 4 + ' layout checks).');
  if (errors.length) console.error(errors.slice(0, 40).join('\n'));
  assert.deepEqual(errors, [], 'All public pages must fit their viewport without hidden content or broken images');
} finally {
  await page.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
