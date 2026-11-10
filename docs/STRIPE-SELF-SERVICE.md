# DayRidge checkout-preview launch

## Business Owner setup request (safe live preview)

The public checkout preview now includes a Business Owner's name, business
name and email **enquiry** form. It sends a validated and rate-limited request
to the existing DayRidge contact function, which is already stored in the
Owner's contact-request dashboard. The plan, employee count and preferred
billing frequency are included in the message.

**This is not automatic account provisioning or Stripe checkout.** The
customer is told explicitly that the request does not create an account,
trigger an invitation or charge a card. The existing DayRidge administrator
can manually review the lead and arrange an invitation with the current
business creation and manual payment tools. No new database tables or
chargeable hosted infrastructure are required. The form never places names,
emails or business details in a URL. Production Stripe remains disabled.

---


**Public website only — payment processing is intentionally disabled.**
The `/pricing/#checkout` form quotes the selected package and annual/monthly
billing cycle, then navigates to `/checkout/` with only plan, count and cycle
in the URL. The checkout page displays an unavailable-payments notice and
a contact link. It does not send requests to Stripe or Supabase, collect any
personal or card details, or activate customer accounts. The checkout page
is **noindex** and excluded from the sitemap while direct navigation remains
available. The public website can deploy safely without Stripe API keys,
billing database migrations, or additional hosting.

**Important:** Never turn the preview button into a live payment action without
a tested and authorised server-side checkout, signed payment webhooks,
reconciliation, business onboarding/invitations and an explicit go-live review.
The separate app Stripe checkout PR remains draft and is not included
in this website-only deployment.

---

# DayRidge self-service checkout — development notes

**Status:** frontend draft only. Not deployed and **not enabled**. No payment is collected by the code in this branch.

## Recommendation

Build the real DayRidge purchase path with Stripe Checkout, testing against the already connected Stripe sandbox account. Do not create live customer accounts from sandbox payments. Before end-to-end testing, use a separate Supabase staging environment or explicitly isolated test businesses that cannot access production data.

## Pricing contract (GBP, annual or monthly)

- Clockx: 1–5 employees £149.99; 6–10 £219.99; 11–20 £369.99.
- Full Workspace: 1–5 £299.99; 6–9 add £45/year per extra employee; 10–15 £649.99; 16–30 £1,149.99; 31–50 £1,899.99.
- **Proposed monthly recurring subscriptions:** one monthly Stripe price per applicable annual tier, approximately 20% more over twelve months. Existing annual prices are unchanged. For a plan priced at `annualPence`, the recommended monthly price is `Math.round(annualPence / 10) - 1` pence (e.g. Clockx 5: £14.99/month, Full 5: £29.99/month). This is a genuinely month-to-month subscription, not twelve instalments of an annual liability.\n- Annual subscriptions renew every 12 months; monthly subscriptions renew each month. Show both the actual charge and full-year cost comparison before checkout. Cancellation terms, access at period end, VAT presentation and add-on charging must be displayed clearly.\n- Higher counts: manual quote. Optional add-ons billed separately.
- Backend must calculate price from fixed server-side values. **Never trust a browser-provided price or Stripe plan identifier.**

## Implementation milestones

1. Create checkout selection UI (package, employee count, annual/monthly choice) on the pricing page. The accompanying `public/checkout.js` and `public/checkout.css` are an initial draft; they are not linked or activated yet. Preserve existing functionality and SEO.
2. Add an Edge Function to create a subscription-mode Stripe-hosted Checkout Session. Validate packages/counts, business name/email, application origin, rate limits and abuse controls. Store a short-lived pending intent. Accept payment details **only** on Stripe.
3. Build a signed Stripe webhook with raw-body signature validation, event deduplication and retry-safe fulfilment. Only a confirmed paid session may trigger business setup.
4. Provision the business account via privileged server code, create its plan, membership, owner identity, and subscription state. Invite the owner to set their password and complete onboarding (pay schedules, location, kiosk PIN). Support duplicate email and partial-failure recovery.
5. Add a customer billing portal route with verified owner authorisation, cancellation/renewal state handling and failed-payment recovery.
6. Run security and end-to-end tests in a sandbox and staging database; reconcile every test invoice with business entitlements; review UK tax and subscription renewal disclosures.
7. Only then turn on a live Stripe account, write production Stripe secrets to **Supabase secret storage** (never GitHub or the public website), register webhooks and deploy the purchase buttons.

## Safety requirements

- ChatGPT's Stripe plugin connection is not the same as the DayRidge backend having access to a Stripe API secret or webhook signing secret.
- Keep production billing off until server credentials, verified webhook destination and test success are confirmed.
- Do not change or overwrite existing manually managed subscriptions when introducing Stripe billing.
- Do not put service-role keys, Stripe API keys, webhook signing secrets, or customer payment data in public files.
- Stripe test-mode events must never activate production workspace access.
- Check idempotency for repeated and out-of-order events.
