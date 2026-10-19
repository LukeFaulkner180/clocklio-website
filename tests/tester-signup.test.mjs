import assert from 'node:assert/strict';
import { test } from 'node:test';

// Test the deployed handler without making network requests or creating leads.
globalThis.Deno = {
  env: { get: name => ({ SUPABASE_URL: 'https://database.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key' })[name] },
  serve: () => {},
};
const { handleSignup } = await import('../supabase/functions/dayridge-tester-signup/index.ts');
const valid = { name: 'Alex Taylor', email: 'alex@example.invalid', business: 'Example Shop', industry: 'retail', teamSize: '6-10', interests: ['rotas'], goals: '', consent: true, elapsedMs: 4000, website: '' };
const request = (body = valid, options = {}) => new Request('https://function.example.invalid', {
  method: 'POST', headers: { origin: 'https://lukefaulkner180.github.io', 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.1', ...options.headers },
  body: JSON.stringify(body), ...options,
});
let saved;
globalThis.fetch = async (url, options) => {
  saved = { url, options, body: JSON.parse(options.body) };
  return Response.json(true);
};

test('valid signup sends only intake fields, rotates a hashed rate-limit key, and returns no personal details', async () => {
  const response = await handleSignup(request({ ...valid, email: ' ALEX@example.invalid ', discount_percent: 100, discount_approved_at: '2026-01-01' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(saved.body.p_payload.email, 'alex@example.invalid');
  assert.equal(saved.body.p_payload.discount_percent, undefined);
  assert.equal(saved.body.p_payload.discount_approved_at, undefined);
  assert.match(saved.body.p_client_hash, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(saved.body).includes('192.0.2.1'));
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://lukefaulkner180.github.io');
});

test('missing permission, invalid business fields and oversized inputs cannot reach storage', async () => {
  const cases = [{ consent: false }, { name: ' ' }, { email: 'not-an-email' }, { business: 'x'.repeat(151) }, { industry: 'invalid' }, { teamSize: '0' }, { interests: ['invalid'] }, { goals: 'x'.repeat(1501) }, { elapsedMs: 0 }];
  for (const change of cases) {
    saved = undefined;
    assert.equal((await handleSignup(request({ ...valid, ...change }))).status, 400, JSON.stringify(change).slice(0, 100));
    assert.equal(saved, undefined);
  }
});

test('bot trap, invalid JSON and oversized requests never create records', async () => {
  saved = undefined;
  assert.equal((await handleSignup(request({ ...valid, website: 'spam.invalid' }))).status, 200);
  assert.equal((await handleSignup(request(null))).status, 400);
  assert.equal((await handleSignup(request({}, { body: '{broken' }))).status, 400);
  assert.equal((await handleSignup(request({ goals: 'x'.repeat(12001) }))).status, 413);
  assert.equal(saved, undefined);
});

test('other origins and methods are rejected; browser preflight works without a write', async () => {
  saved = undefined;
  assert.equal((await handleSignup(request(valid, { headers: { origin: 'https://other.example.invalid' } }))).status, 403);
  const options = await handleSignup(new Request('https://function.example.invalid', { method: 'OPTIONS', headers: { origin: 'https://lukefaulkner180.github.io' } }));
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
  assert.equal((await handleSignup(new Request('https://function.example.invalid', { headers: { origin: 'https://lukefaulkner180.github.io' } }))).status, 405);
  assert.equal(saved, undefined);
});

test('rate limits, database errors and timeouts cannot produce false success', async () => {
  globalThis.fetch = async () => Response.json(false);
  const limited = await handleSignup(request());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '3600');
  globalThis.fetch = async () => Response.json({ error: 'private database details' }, { status: 500 });
  const failed = await handleSignup(request());
  assert.equal(failed.status, 503);
  assert.equal((await failed.text()).includes('private'), false);
  globalThis.fetch = async () => { throw new Error('network error'); };
  assert.equal((await handleSignup(request())).status, 503);
});
