// A dedicated intake endpoint: no accounts, invitations, messages or payments.
const allowedOrigins = new Set(['https://lukefaulkner180.github.io', 'https://dayridge.co.uk', 'https://www.dayridge.co.uk']);
const industries = new Set(['hospitality', 'retail', 'care', 'services', 'other']);
const teamSizes = new Set(['1-5', '6-10', '11-20', '21-50', '51+']);
const interests = new Set(['rotas', 'time', 'people', 'tasks', 'stock']);

export async function handleSignup(req: Request): Promise<Response> {
  const origin = req.headers.get('origin') || '';
  const headers = {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin',
  };
  const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
  if (!allowedOrigins.has(origin)) return reply(403, { ok: false });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply(405, { ok: false });
  if (!req.headers.get('content-type')?.startsWith('application/json')) return reply(415, { ok: false });
  try {
    if (Number(req.headers.get('content-length')) > 12000) return reply(413, { ok: false });
    const raw = await req.text();
    if (raw.length > 12000) return reply(413, { ok: false });
    let body;
    try { body = JSON.parse(raw); } catch { return reply(400, { ok: false }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(400, { ok: false });
    // A filled bot trap receives a generic response but is never stored.
    if (body.website) return reply(200, { ok: true });
    const bounded = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
    if (!bounded(body.name, 100) || !bounded(body.business, 150) || !bounded(body.email, 254)
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
      || !industries.has(body.industry) || !teamSizes.has(body.teamSize)
      || !Array.isArray(body.interests) || body.interests.length > 5 || body.interests.some((value: string) => !interests.has(value))
      || typeof body.goals !== 'string' || body.goals.length > 1500
      || body.consent !== true || typeof body.elapsedMs !== 'number' || body.elapsedMs < 2500) return reply(400, { ok: false });
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return reply(503, { ok: false });
    // Do not store a raw address. Rotate the rate-limit bucket each hour and
    // salt it with a server-only value so stored hashes cannot be reversed.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const bucket = Math.floor(Date.now() / 3600000);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${serviceKey}:${bucket}:${ip}`));
    const hash = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
    const payload = {
      name: body.name.trim(), email: body.email.trim().toLowerCase(), business: body.business.trim(),
      industry: body.industry, teamSize: body.teamSize, interests: [...new Set(body.interests)],
      goals: body.goals.trim(), consent: true,
    };
    const response = await fetch(`${url}/rest/v1/rpc/register_dayridge_tester`, {
      method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_payload: payload, p_client_hash: hash }), signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) { console.error('Tester signup database request failed:', response.status); return reply(503, { ok: false }); }
    const accepted = await response.json();
    if (accepted === false) return new Response(JSON.stringify({ ok: false }), { status: 429, headers: { ...headers, 'Retry-After': '3600' } });
    return accepted === true ? reply(200, { ok: true }) : reply(503, { ok: false });
  } catch {
    // Never log form content, contact details or credentials.
    return reply(503, { ok: false });
  }
}

Deno.serve(handleSignup);
