import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const script = (await readFile(new URL('../public/website-stats.js', import.meta.url), 'utf8')).replace(/^import .*;\n/, '');
function page({ hostname = 'dayridge.co.uk', pathname = '/', visible = true, agent = 'Mozilla/5.0', pageType = 'home', fail = false } = {}) {
  const listeners = new Map(), requests = [], retry = [];
  const document = { visibilityState: visible ? 'visible' : 'hidden', body: { dataset: { page: pageType } },
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  const context = { location: { hostname, pathname }, navigator: { userAgent: agent }, document,
    crypto: { randomUUID: () => '93000000-0000-4000-8000-000000000001' }, publicAnonKey: 'public-browser-key',
    window: { setTimeout: fn => retry.push(fn) },
    fetch: async (url, options) => { requests.push({ url, ...options }); return { status: fail ? 503 : 204 }; } };
  vm.runInNewContext(script, context);
  return { listeners, requests, retry, document };
}

test('every page load sends just a random token with no cookies or referrer', () => {
  const p = page();
  assert.equal(p.requests.length, 1);
  const req = p.requests[0];
  assert.deepEqual(JSON.parse(req.body), { eventId: '93000000-0000-4000-8000-000000000001' });
  assert.equal(req.credentials, 'omit');
  assert.equal(req.referrerPolicy, 'no-referrer');
  assert.equal(p.listeners.size, 0);
  assert.equal(page({ hostname: 'lukefaulkner180.github.io', pathname: '/clocklio-website/pricing/' }).requests.length, 1);
});

test('background tabs wait until visible, and app/local/bot/404 pages are excluded', () => {
  const hidden = page({ visible: false });
  assert.equal(hidden.requests.length, 0);
  const visible = hidden.listeners.get('visibilitychange');
  hidden.document.visibilityState = 'visible';
  visible(); visible();
  assert.equal(hidden.requests.length, 1);
  for (const config of [
    { hostname: 'app.dayridge.co.uk' }, { hostname: 'clocklio.pages.dev' }, { hostname: 'localhost' },
    { hostname: 'lukefaulkner180.github.io', pathname: '/another-project/' },
    { agent: 'Googlebot' }, { pageType: '404' },
  ]) assert.equal(page(config).requests.length, 0, JSON.stringify(config));
});

test('one transient retry uses the same token, then stops', async () => {
  const p = page({ fail: true });
  await new Promise(setImmediate);
  assert.equal(p.retry.length, 1);
  p.retry.shift()();
  await new Promise(setImmediate);
  assert.equal(p.requests.length, 2);
  assert.equal(p.requests[0].body, p.requests[1].body);
  assert.equal(p.retry.length, 0);
});
