import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const root = path.resolve(process.env.QA_SITE_DIRECTORY || 'public');
const basePath = (process.env.QA_BASE_PATH || '').replace(/\/+$/, '');
const artifactDirectory = process.env.QA_ARTIFACT_DIRECTORY || 'artifacts';
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer(async (request, response) => {
  try {
    const requestedPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (basePath && requestedPath !== basePath && !requestedPath.startsWith(basePath + '/')) throw new Error('Outside project site');
    const pathname = requestedPath.slice(basePath.length) || '/';
    let file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const hostOrigin = 'http://127.0.0.1:' + server.address().port;
const origin = hostOrigin + basePath;
await mkdir(artifactDirectory, { recursive: true });
const findings = [];
async function text(page, selector, expected) {
  const actual = (await page.locator(selector).textContent()).trim();
  if (expected instanceof RegExp) assert.match(actual, expected); else assert.equal(actual, expected);
}
async function noOverflow(page, label, errors) {
  const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
  if (width.content > width.viewport + 1) errors.push(label + ': overflow ' + JSON.stringify(width));
}
async function readableAddons(page) {
  const readings = await page.locator('.addons-home h2, .addons-home .eyebrow, .addons-home .heading-split > p, .addon-teaser h3, .addon-teaser > .label, .addon-teaser > p, .teaser-price > b, .teaser-price small, .teaser-price > span, .addon-teaser > .card-link').evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    let parent = element, background;
    while (parent) {
      background = getComputedStyle(parent).backgroundColor;
      if (background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') break;
      parent = parent.parentElement;
    }
    return { text: element.textContent.trim(), color: style.color, background, size: parseFloat(style.fontSize), weight: parseFloat(style.fontWeight) };
  }));
  const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }).reduce((value, channel, index) => value + channel * [0.2126, 0.7152, 0.0722][index], 0);
  for (const reading of readings) {
    const a = luminance(reading.color), b = luminance(reading.background);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const minimum = reading.size >= 24 || (reading.size >= 18.66 && reading.weight >= 700) ? 3 : 4.5;
    assert.ok(ratio >= minimum, reading.text + ': insufficient contrast ' + ratio.toFixed(2));
  }
}
try {
  for (const [name, engine] of Object.entries({ chromium, webkit })) {
    const browser = await engine.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(hostOrigin) && response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
    try {
      await page.goto(origin);
      assert.equal(await page.locator('[data-motion-toggle]').count(), 0, 'There are no website animation controls');
      assert.equal(await page.locator('.hero-atmosphere i').first().evaluate(el => getComputedStyle(el).animationName), 'none', 'Device reduced-motion preference is respected automatically');
      assert.equal(await page.locator('.role-spark, .tiny-spark').count(), 0, 'No decorative emoji symbols');
      await readableAddons(page);
      assert.equal(await page.locator('.site-footer .footer-wordmark').count(), 0);
      assert.equal(await page.locator('.site-footer nav').count(), 3);
      await page.locator('[data-preview="stock"]').click();
      assert.equal(await page.locator('#preview-stock').isVisible(), true);
      await text(page, '[data-preview-description]', /expected takings/);
      await text(page, '[data-preview-notice-title]', 'Stock, explained');
      await page.locator('[data-preview="stock"]').press('Home');
      assert.equal(await page.locator('#preview-rota').isVisible(), true);
      await text(page, '[data-preview-notice-title]', 'Rota published');
      await text(page, '.core-plan-price', /£299.99/);
      await text(page, '.core-plan-price', /up to 5 employees/);
      await page.locator('.home-faq summary').first().click();
      assert.equal(await page.locator('.home-faq details').first().locator('p').isVisible(), true);
      await page.locator('[data-role="employee"]').click();
      await text(page, '[data-role-label]', 'THE EMPLOYEE VIEW');
      await page.locator('[data-role="employee"]').press('End');
      await text(page, '[data-role-label]', 'THE TEAM LEADER VIEW');
      await page.locator('[data-platform-toggle]').click();
      assert.equal(await page.locator('#platform-menu').isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#platform-menu').isVisible(), false);

      await page.locator('#site-navigation').getByRole('link', { name: 'About us', exact: true }).click();
      await page.waitForURL('**/about/');
      await text(page, '.about-intro', /based in Suffolk/);
      await text(page, '#our-vision h2', /One connected workspace/);
      assert.equal(await page.locator('#site-navigation a[aria-current="page"]').textContent(), 'About us');
      assert.equal(await page.locator('.site-footer a[href$="/about/"]').count(), 1);

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
      await page.locator('[data-category-filter="planning"]').click();
      assert.ok(await page.locator('[data-feature]:visible').count() > 0, 'Business Owners also have Manager planning features');

      await page.goto(origin + '/pricing/');
      for (const [size, plan, amount] of [[5, 'Starter', '£299.99'], [6, 'Starter', '£344.99'], [9, 'Starter', '£479.99'], [10, 'Team', '£649.99'], [15, 'Team', '£649.99'], [16, 'Business', '£1,149.99'], [30, 'Business', '£1,149.99'], [31, 'Scale', '£1,899.99'], [50, 'Scale', '£1,899.99'], [51, 'Custom', 'Let’s talk']]) {
        await page.locator('[data-team-number]').fill(String(size));
        await text(page, '[data-quote-plan]', plan);
        assert.ok((await page.locator('[data-quote-annual]').textContent()).startsWith(amount));
      }
      await text(page, '.package-price-card:first-child .package-annual-price strong', '£99');
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
      await page.goto(new URL(contactPath, hostOrigin).href);
      assert.equal(await page.locator('[name="employees"]').inputValue(), '16–30');
      assert.match(await page.locator('[name="message"]').inputValue(), /Tasks add-on: 5/);
      await page.locator('[name="name"]').fill('Test Visitor');
      await page.locator('[name="email"]').fill('visitor@example.com');
      await page.locator('[name="business"]').fill('Example Café');
      await page.locator('[name="message"]').fill('Please show me the platform. <script>alert(1)</script>');
      await page.locator('#contact-form button[type="submit"]').click();
      assert.equal(await page.locator('[data-email-draft-panel]').isVisible(), true);
      await text(page, '[data-draft-status]', /has not been sent/);
      assert.equal(await page.locator('a[href^="mailto:"]').count(), 0, 'No recipient is configured while contact details are pending');
      await text(page, '.contact-email', /Coming soon/);
      await text(page, '[data-email-preview]', /Example Café/);
      assert.equal(await page.locator('[data-email-preview] script').count(), 0);
      await page.locator('[data-copy-enquiry]').click();
      await page.waitForFunction(() => /Enquiry copied|Select and copy/.test(document.querySelector('[data-draft-status]').textContent));
      await page.locator('[name="message"]').fill('A revised message');
      assert.equal(await page.locator('[data-email-draft-panel]').isVisible(), false);

      await page.goto(origin + '/contact/?topic=plan&package=clocking&employees=5');
      assert.equal(await page.locator('[name="package"]').inputValue(), 'clocking');
      assert.equal(await page.locator('[name="employees"]').inputValue(), '1–5');
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
      await page.locator('[data-open-preview]').click();
      await page.waitForURL(url => url.hash === '#workspace-preview');
      await page.locator('[data-preview="time"]').click();
      assert.equal(await page.locator('#preview-time').isVisible(), true);
      await text(page, '[data-preview-description]', /recorded hours/);
      await text(page, '[data-preview-notice-title]', 'Time, recorded');
      await page.locator('[data-menu-toggle]').click();
      assert.equal(await page.locator('#site-navigation').isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#site-navigation').isVisible(), false);
      assert.equal(await page.locator('[data-menu-toggle]').evaluate(el => el === document.activeElement), true);
      await page.locator('[data-menu-toggle]').click();
      await page.locator('#site-navigation').getByRole('link', { name: 'Pricing', exact: true }).click();
      await page.waitForURL('**/pricing/');
      assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'), 'false');
      await page.locator('[data-menu-toggle]').click();
      await page.locator('#site-navigation').getByRole('link', { name: 'About us', exact: true }).click();
      await page.waitForURL('**/about/');
      assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'), 'false');
      await text(page, '.about-location', 'Based in Suffolk, United Kingdom');

      const routes = ['', 'features/', 'pricing/', 'add-ons/', 'about/', 'contact/', 'privacy/', '404.html'];
      for (const width of name === 'chromium' ? [1440, 1024, 768, 390, 320] : [390]) {
        await page.setViewportSize({ width, height: width >= 1024 ? 1000 : 844 });
        for (const route of routes) {
          await page.goto(origin + '/' + route);
          await page.evaluate(() => document.fonts.ready);
          await noOverflow(page, name + ' ' + width + ' ' + route, errors);
          assert.equal(await page.locator('[data-motion-toggle]').count(), 0);
          if (!route) await readableAddons(page);
          if (name === 'chromium' && [1440, 390].includes(width)) {
            const slug = route.replaceAll('/', '') || 'home';
            await page.screenshot({ path: artifactDirectory + '/' + slug + '-' + width + '.png', fullPage: true });
            if (!route) {
              await page.screenshot({ path: artifactDirectory + '/home-viewport-' + width + '.png' });
              await page.locator('.site-footer').screenshot({ path: artifactDirectory + '/footer-' + width + '.png' });
              await page.locator('[data-role="leader"]').click();
              await page.locator('#role-preview').screenshot({ path: artifactDirectory + '/team-leader-' + width + '.png' });
              await page.locator('.addons-home').screenshot({ path: artifactDirectory + '/addons-' + width + '.png' });
            }
          }
        }
      }
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(origin);
      await page.waitForFunction(() => document.querySelector('.hero-copy').classList.contains('is-visible'));
      await page.locator('.roles-section').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('.roles-section [data-reveal]')].every(el => el.classList.contains('is-visible')));
      await page.locator('[data-map-node]').first().focus();
      await text(page, '[data-map-detail]', /Plan shifts/);
      assert.equal(await page.locator('[data-motion-toggle]').count(), 0);
      assert.equal(await page.locator('.hero-atmosphere i').first().evaluate(el => getComputedStyle(el).animationName), 'atmosphere-drift', 'Decorative motion remains enabled by default');
      await page.locator('[data-back-top]').click();
      await page.waitForFunction(() => scrollY < 2);
      await page.waitForFunction(() => document.getAnimations().filter(animation => animation.effect?.target?.closest('.hero-line') && animation.playState === 'running').length === 0);
      if (name === 'chromium') await page.screenshot({ path: artifactDirectory + '/home-motion.png' });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('.hero-atmosphere i').first().evaluate(el => getComputedStyle(el).animationName), 'none', 'Changed device preferences take effect without a website toggle');
      assert.deepEqual(errors, [], 'No JavaScript errors, missing local resources or responsive overflow');
      findings.push({ browser: name, status: 'passed', featureCount: total, checks: ['navigation and keyboard tabs', 'feature filtering', 'plan boundaries and add-on calculations', 'email draft and input safety', 'stock reconciliation', 'responsive overflow'] });
      console.log(name + ': all interactions and responsive checks passed.');
    } catch (error) {
      await page.screenshot({ path: artifactDirectory + '/failure-' + name + '.png', fullPage: true }).catch(() => {});
      await writeFile(artifactDirectory + '/failure-' + name + '.txt', String(error.stack));
      throw error;
    } finally { await context.close(); await browser.close(); }
  }
  await writeFile(artifactDirectory + '/results.json', JSON.stringify(findings, null, 2));
} finally { await new Promise(resolve => server.close(resolve)); }
