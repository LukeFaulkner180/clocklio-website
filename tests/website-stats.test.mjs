import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const script = (await readFile(new URL('../public/website-stats.js', import.meta.url), 'utf8')).replace(/^import .*;\n/, '');
function page({ hostname = 'dayridge.co.uk', pathname = '/', referrer = '', query = '', visible = true, agent = 'Mozilla/5.0', pageType = 'home', fail = false } = {}) {
  const listeners = new Map(), requests = [], retry = [];
  const document = { visibilityState: visible ? 'visible' : 'hidden', referrer, body: { dataset: { page: pageType } },
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  const context = { URL, location: { hostname, pathname, href: `https://${hostname}${pathname}${query}`, origin: `https://${hostname}` }, navigator: { userAgent: agent }, document,
    crypto: { randomUUID: () => '93000000-0000-4000-8000-000000000001' }, publicAnonKey: 'public-browser-key',
    window: { setTimeout: fn => retry.push(fn) },
    fetch: async (url, options) => { requests.push({ url, ...options }); return { status: fail ? 503 : 204 }; } };
  vm.runInNewContext(script, context);
  return { listeners, requests, retry, document };
}

test('page views send only anonymous dimensions, without raw URLs, cookies or referrers', () => {
  const p = page();
  assert.equal(p.requests.length, 1);
  const req = p.requests[0];
  assert.deepEqual(JSON.parse(req.body), { eventId: '93000000-0000-4000-8000-000000000001', pagePath:'/', device:'desktop', source:'direct', eventType:'view' });
  assert.equal(req.credentials, 'omit');
  assert.equal(req.referrerPolicy, 'no-referrer');
  assert.deepEqual([...p.listeners.keys()], ['click']);
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


test('source and device buckets discard private URLs and campaign values', () => {
  const payload = opts => JSON.parse(page(opts).requests[0].body);
  assert.equal(payload({referrer:'https://l.facebook.com/?token=private',agent:'iPhone Mobile'}).source,'facebook');
  assert.equal(payload({agent:'iPhone Mobile'}).device,'mobile');
  assert.equal(payload({agent:'iPad'}).device,'tablet');
  assert.equal(payload({referrer:'https://dayridge.co.uk/pricing/'}).source,'internal');
  assert.equal(payload({referrer:'https://private.example/person',query:'?utm_source=instagram&email=secret'}).source,'instagram');
  assert.equal(payload({query:'?utm_source=person@example.com'}).source,'direct');
  assert.equal(JSON.stringify(payload({referrer:'https://private.example/person',query:'?email=secret'})).includes('secret'),false);
});

test('brochure links count clicks separately without intercepting navigation', () => {
  const p=page();
  const click=p.listeners.get('click');
  click({target:{closest:()=>({href:'https://dayridge.co.uk/downloads/dayridge-product-brochure.pdf?v=5'})}});
  assert.equal(p.requests.length,2);
  assert.equal(JSON.parse(p.requests[1].body).eventType,'brochure_download');
  click({target:{closest:()=>({href:'https://other.example/downloads/dayridge-product-brochure.pdf'})}});
  click({target:{closest:()=>({href:'https://dayridge.co.uk/pricing/'})}});
  assert.equal(p.requests.length,2);
});
