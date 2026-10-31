// A repeatable mobile loading smoke check against the built site.
// These timings measure a local, throttled browser, NOT production TTFB or
// official Google PageSpeed/Core Web Vitals scores.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';

const root = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.pdf': 'application/pdf', '.ico': 'image/x-icon' };
const extension = file => file.slice(file.lastIndexOf('.')).toLowerCase();
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Outside site');
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    const type = types[extension(file)] || 'application/octet-stream';
    const compress = /^(text\/|image\/svg)/.test(type);
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store',
      ...(compress ? { 'Content-Encoding': 'gzip' } : {}) });
    res.end(compress ? gzipSync(body) : body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady));
const origin = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ headless: true });
try {
  for (const path of ['/', '/features/', '/pricing/']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__speedMetrics = { lcp: 0, cls: 0 };
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) window.__speedMetrics.lcp = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__speedMetrics.cls += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 120, downloadThroughput: 1_600_000 / 8,
      uploadThroughput: 750_000 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const response = await page.goto(origin + path, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1500);
    const measurements = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const fcp = performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint');
      const resources = performance.getEntriesByType('resource');
      return { loadMs: Math.round(nav?.loadEventEnd || 0),
        fcpMs: Math.round(fcp?.startTime || 0),
        lcpMs: Math.round(window.__speedMetrics.lcp || 0),
        cls: Number((window.__speedMetrics.cls || 0).toFixed(3)),
        resourceRequests: resources.length,
        stylesheetRequests: resources.filter(e => e.initiatorType === 'link' && e.name.includes('.css')).length };
    });
    console.log('[Mobile simulation] ' + path + ': ' + JSON.stringify({ status: response.status(), ...measurements }));
    if (response.status() !== 200) throw new Error('Page failed to load: ' + path);
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
