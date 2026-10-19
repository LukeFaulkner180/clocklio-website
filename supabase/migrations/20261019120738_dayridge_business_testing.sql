-- Website business testing registrations are separate from customer accounts.
-- No anonymous or signed-in app user can read or write these tables directly.
create table public.dayridge_tester_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_name text not null check (char_length(btrim(contact_name)) between 1 and 100),
  email text not null unique check (email = lower(btrim(email)) and char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  business_name text not null check (char_length(btrim(business_name)) between 1 and 150),
  industry text not null check (industry in ('hospitality','retail','care','services','other')),
  team_size text not null check (team_size in ('1-5','6-10','11-20','21-50','51+')),
  interests text[] not null default '{}' check (interests <@ array['rotas','time','people','tasks','stock']::text[] and cardinality(interests) <= 5),
  goals text not null default '' check (char_length(goals) <= 1500),
  contact_permission_at timestamptz not null default now(),
  offer_version text not null default 'tester-10-percent-v1',
  discount_percent smallint not null default 10 check (discount_percent = 10),
  testing_completed_at timestamptz,
  feedback_completed_at timestamptz,
  discount_approved_at timestamptz,
  check (discount_approved_at is null or (testing_completed_at is not null and feedback_completed_at is not null))
);
alter table public.dayridge_tester_signups enable row level security;
revoke all on public.dayridge_tester_signups from public, anon, authenticated;
grant select, insert, update, delete on public.dayridge_tester_signups to service_role;
comment on table public.dayridge_tester_signups is 'Private Dayridge business tester registrations; registration does not award a discount or create an app account.';

-- Rotating one-way client hashes are used only for short-lived abuse limits.
create table public.dayridge_signup_limits (
  client_hash text primary key check (client_hash ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null default now(),
  attempts smallint not null default 1 check (attempts between 1 and 6)
);
alter table public.dayridge_signup_limits enable row level security;
revoke all on public.dayridge_signup_limits from public, anon, authenticated;
grant select, insert, update, delete on public.dayridge_signup_limits to service_role;

create function public.register_dayridge_tester(p_payload jsonb, p_client_hash text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_count smallint;
begin
  if p_payload->>'consent' is distinct from 'true' then
    raise exception 'Contact permission is required' using errcode = '22023';
  end if;
  delete from public.dayridge_signup_limits where window_start < now() - interval '24 hours';
  insert into public.dayridge_signup_limits as limits (client_hash)
    values (p_client_hash)
    on conflict (client_hash) do update set attempts = least(limits.attempts + 1, 6)
    returning attempts into request_count;
  if request_count > 5 then return false; end if;
  insert into public.dayridge_tester_signups
    (contact_name, email, business_name, industry, team_size, interests, goals)
  values (
    btrim(p_payload->>'name'), lower(btrim(p_payload->>'email')),
    btrim(p_payload->>'business'), p_payload->>'industry', p_payload->>'teamSize',
    array(select distinct jsonb_array_elements_text(p_payload->'interests')),
    coalesce(btrim(p_payload->>'goals'), '')
  ) on conflict (email) do nothing;
  -- The response deliberately does not reveal whether an email already exists.
  return true;
end;
$$;
revoke all on function public.register_dayridge_tester(jsonb,text) from public, anon, authenticated;
grant execute on function public.register_dayridge_tester(jsonb,text) to service_role;
