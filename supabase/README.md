# DayRidge business tester intake

The marketing website remains on GitHub Pages. `/` is the 2027 landing page,
`/early-access/` is the separate registration page, and `/platform/` retains the
interactive product showcase.

The dedicated `dayridge-tester-signup` Edge Function saves registrations to
`public.dayridge_tester_signups` in the existing project. It does not create
customer accounts, send email or charge a subscription. The browser receives
only `{ "ok": true }`, including when an email is already registered.

Both intake tables have RLS enabled and no direct anonymous or authenticated
access. The database RPC is callable only by the server service role. The
function retains platform JWT verification and uses a public legacy anon JWT
for anonymous website intake. Only this public key is in the website source.
Credentials for the server come from the Edge Function runtime environment.

Review registrations in the Supabase dashboard table editor. Each registration
records the 10% offer version and contact permission. `testing_completed_at`,
`feedback_completed_at` and `discount_approved_at` start empty. Confirm agreed
testing and feedback are complete before setting approval. A database check
prevents approval when either completion field is empty. No subscription
discount is applied automatically by this signup form.

Anti-spam controls include field limits, a bot trap, a minimum form completion
time, unique email addresses and five submissions per hourly client bucket.
Only a salted, rotating network hash is stored in the short-lived limit table.
Expired buckets are removed during subsequent submissions.

When connecting a custom domain, add its exact origin to `allowedOrigins` in
the function, redeploy that function, and update canonical/site URLs. Do not
disable JWT verification or grant public table access to resolve CORS issues.

Run `npm run test:signup` for offline handler checks. Existing GitHub Actions
also exercise the separate page, required fields, failed and successful states,
keyboard focus and responsive widths, with network transport stubbed so CI
never creates real registrations.
