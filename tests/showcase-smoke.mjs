import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const root = path.resolve('public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
await mkdir('artifacts', { recursive: true });
const findings = [];
async function text(page, selector, expected) {
  const actual = (await page.locator(selector).textContent()).trim();
  if (expected instanceof RegExp) assert.match(actual, expected); else assert.equal(actual, expected);
}
async function noOverflow(page, label, errors) {
  const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
  if (width.content > width.viewport + 1) errors.push(label + ': overflow ' + JSON.stringify(width));
}
try {
  for (const [name, engine] of Object.entries({ chromium, webkit })) {
    const browser = await engine.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
    try {
      await page.goto(origin);
      await page.locator('[data-preview="stock"]').click();
      assert.equal(await page.locator('#preview-stock').isVisible(), true);
      await page.locator('[data-preview="stock"]').press('Home');
      assert.equal(await page.locator('#preview-rota').isVisible(), true);
      await page.locator('[data-role="employee"]').click();
      await text(page, '[data-role-label]', 'THE EMPLOYEE VIEW');
      await page.locator('[data-role="employee"]').press('End');
      await text(page, '[data-role-label]', 'THE TEAM LEADER VIEW');
      await page.locator('[data-platform-toggle]').click();
      assert.equal(await page.locator('#platform-menu').isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#platform-menu').isVisible(), false);

      await page.goto(origin + '/features/');
      const total = await page.locator('[data-feature]').count();
      assert.ok(total >= 40);
      await page.locator('[data-feature-search]').fill('contracts');
      assert.ok(await page.locator('[data-feature]:visible').count() < total);
      assert.ok(await page.locator('[data-feature]:visible').count() > 0);
      await page.locator('[data-feature-search]').fill('zzyyxw-no-such-feature');
      assert.equal(await page.locator('[data-feature-empty]').isVisible(), true);
      await page.locator('.empty-results [data-clear-filters]').click();
      assert.equal(await page.locator('[data-feature]:visible').count(), total);
      await page.locator('[data-category-filter="time"]').click();
      assert.ok(await page.locator('[data-feature]:visible').count() > 0);
      assert.equal(await page.locator('[data-feature]:visible:not([data-category="time"])').count(), 0);
      await page.goto(origin + '/features/?role=owner&category=addons');
      assert.equal(await page.locator('[data-feature-role]').inputValue(), 'owner');
      assert.equal(await page.locator('[data-feature]:visible:not([data-category="addons"])').count(), 0);

      await page.goto(origin + '/pricing/');
      for (const [size, plan, amount] of [[5, 'Starter', '£299.99'], [6, 'Team', '£649.99'], [15, 'Team', '£649.99'], [16, 'Business', '£1,149.99'], [30, 'Business', '£1,149.99'], [31, 'Scale', '£1,899.99'], [50, 'Scale', '£1,899.99'], [51, 'Custom', 'Let’s talk']]) {
        await page.locator('[data-team-number]').fill(String(size));
        await text(page, '[data-quote-plan]', plan);
        assert.ok((await page.locator('[data-quote-annual]').textContent()).startsWith(amount));
      }
      await page.locator('[data-team-number]').fill('10');
      await page.locator('[data-quote-tasks]').check();
      await page.locator('[data-tasks-users]').fill('5');
      await text(page, '[data-quote-monthly]', '£16.74');
      await page.locator('[data-quote-stock]').check();
      await text(page, '[data-quote-monthly]', '£26.73');
      await page.locator('[data-tasks-users]').fill('');
      await text(page, '[data-quote-monthly]', '—');
      await page.locator('[data-tasks-users]').fill('5');
      await page.locator('[data-team-number]').fill('0');
      await text(page, '[data-quote-status]', /Enter a whole employee count/);
      await page.locator('[data-team-number]').fill('16');
      const contactPath = await page.locator('[data-quote-contact]').getAttribute('href');
      await page.goto(origin + contactPath);
      assert.equal(await page.locator('[name="employees"]').inputValue(), '16–30');
      assert.match(await page.locator('[name="message"]').inputValue(), /Tasks add-on: 5/);
      await page.locator('[name="name"]').fill('Test Visitor');
      await page.locator('[name="email"]').fill('visitor@example.com');
      await page.locator('[name="business"]').fill('Example Café');
      await page.locator('[name="message"]').fill('Please show me the platform. <script>alert(1)</script>');
      await page.locator('#contact-form button[type="submit"]').click();
      assert.equal(await page.locator('[data-email-draft-panel]').isVisible(), true);
      await text(page, '[data-draft-status]', /has not been sent/);
      const mailto = new URL(await page.locator('[data-email-draft]').getAttribute('href'));
      assert.equal(mailto.protocol, 'mailto:');
      assert.equal(mailto.pathname, 'ambitionit.business@gmail.com');
      assert.match(mailto.searchParams.get('body'), /Example Café/);
      assert.equal(await page.locator('[data-email-preview] script').count(), 0);
      await page.locator('[name="message"]').fill('A revised message');
      assert.equal(await page.locator('[data-email-draft-panel]').isVisible(), false);

      await page.goto(origin + '/add-ons/');
      await text(page, '[data-stock-expected]', '£112.50');
      await text(page, '[data-stock-variance]', '-£2.50');
      await page.locator('[data-stock-value="till"]').fill('112.50');
      await text(page, '[data-stock-message]', /figures match/);
      await page.locator('[data-stock-value="closing"]').fill('100');
      await text(page, '[data-stock-expected]', '—');
      await text(page, '[data-stock-message]', /cannot exceed/);
      await page.locator('[data-stock-value="closing"]').fill('26');
      await page.locator('[data-stock-value="delivered"]').fill('10');
      await text(page, '[data-stock-expected]', '£157.50');
      await page.locator('[data-demo-task]').nth(1).check();
      await text(page, '[data-task-count]', '2 of 3 complete');

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(origin);
      await page.locator('[data-menu-toggle]').click();
      assert.equal(await page.locator('#site-navigation').isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#site-navigation').isVisible(), false);
      assert.equal(await page.locator('[data-menu-toggle]').evaluate(el => el === document.activeElement), true);
      await page.locator('[data-menu-toggle]').click();
      await page.locator('#site-navigation a[href="/pricing/"]').click();
      await page.waitForURL('**/pricing/');
      assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'), 'false');

      const routes = ['', 'features/', 'pricing/', 'add-ons/', 'contact/', 'privacy/', '404.html'];
      for (const width of name === 'chromium' ? [1440, 1024, 768, 390, 320] : [390]) {
        await page.setViewportSize({ width, height: width >= 1024 ? 1000 : 844 });
        for (const route of routes) {
          await page.goto(origin + '/' + route);
          await page.evaluate(() => document.fonts.ready);
          await noOverflow(page, name + ' ' + width + ' ' + route, errors);
          if (name === 'chromium' && [1440, 390].includes(width)) {
            const slug = route.replaceAll('/', '') || 'home';
            await page.screenshot({ path: 'artifacts/' + slug + '-' + width + '.png', fullPage: true });
            if (!route) await page.screenshot({ path: 'artifacts/home-viewport-' + width + '.png' });
          }
        }
      }
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(origin);
      await page.waitForFunction(() => document.querySelector('.hero-copy').classList.contains('is-visible'));
      await page.locator('.roles-section').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('.roles-section [data-reveal]')].every(el => el.classList.contains('is-visible')));
      assert.deepEqual(errors, [], 'No JavaScript errors, missing local resources or responsive overflow');
      findings.push({ browser: name, status: 'passed', featureCount: total, checks: ['navigation and keyboard tabs', 'feature filtering', 'plan boundaries and add-on calculations', 'email draft and input safety', 'stock reconciliation', 'responsive overflow'] });
      console.log(name + ': all interactions and responsive checks passed.');
    } catch (error) {
      await page.screenshot({ path: 'artifacts/failure-' + name + '.png', fullPage: true }).catch(() => {});
      await writeFile('artifacts/failure-' + name + '.txt', String(error.stack));
      throw error;
    } finally { await context.close(); await browser.close(); }
  }
  await writeFile('artifacts/results.json', JSON.stringify(findings, null, 2));
} finally { await new Promise(resolve => server.close(resolve)); }
