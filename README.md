# DayRidge showcase

A responsive marketing website built with plain HTML, CSS and JavaScript. No framework, runtime dependencies, database or bundler is needed.

## Pages

Home, Features, Pricing, Add-ons, Contact, Website Privacy and a custom 404 page. The site includes animated product illustrations, a role explorer, searchable feature catalogue, annual plan and monthly add-on calculator, and an interactive stock example.

## Hosting

All source files are in `public/`. GitHub Pages is deployed by `.github/workflows/deploy-pages.yml` on each push to `main`. Enable it once in the repository under **Settings → Pages → Build and deployment → Source: GitHub Actions**. Repository settings are managed by the owner; the workflow does not change repository visibility.

The workflow gets the publishing URL and project path from GitHub, builds `dist/`, verifies links and publishes only those static files. Its deployment job reports the live URL. The custom website domain is `https://dayridge.co.uk/`; GitHub Pages takes its domain and root path from repository Pages settings. Namecheap manages the DNS records. The earlier GitHub Pages project URL was `https://lukefaulkner180.github.io/clocklio-website/`.

The build supports `SITE_BASE_PATH` and `SITE_URL`, so navigation, images, dynamic calculator links, canonical metadata and the sitemap work under a project path. For example: `SITE_BASE_PATH=/clocklio-website SITE_URL=https://lukefaulkner180.github.io/clocklio-website/ npm run build`. Without those variables, `npm run build` makes a root-hosted version for the review preview. Cloudflare Pages can still serve `public/` directly.

Run `npm run check` for source validation. GitHub Actions checks real Chromium and WebKit interactions at both the root and the GitHub Pages project path, and uploads desktop/mobile screenshots. Playwright is used only in CI, not shipped to visitors.

## Content

Annual plans: Starter (5 employees) £299.99, Team (15) £649.99, Business (30) £1,149.99, Scale (50) £1,899.99; larger teams get a custom quote. Managers are included; a Manager with an employee profile uses an employee slot.

Tasks is £4.99 per business per month plus £2.35 per agreed chargeable user. Stock Management v0.1 is presented at the agreed £9.99 monthly launch price. The calculator is an estimate, not a checkout. Activation and subscriptions are arranged directly; this website does not change application billing.

Contact prepares a local enquiry draft that visitors can review and copy. No contact recipient is configured while the business confirms its name and email details. The website does not send or store enquiries. Sign-in currently links to `https://clocklio.pages.dev/`. The current marketing branding and canonical domain remain in place pending confirmation; DNS configuration is separate.

Product illustrations use labelled example data. Gross pay estimates support payroll handover; statutory calculations and payslips remain external. Stock comparisons use matching-period, manually entered figures.

## Files

- `public/styles.css`: responsive styling, animation and reduced-motion support.
- `public/main.js`: accessible navigation, tabs, filters, calculators and enquiry preparation.
- `public/assets/`: approved DayRidge brand assets.
- `scripts/`: optional static build and source checks.
- `tests/showcase-smoke.mjs`: meaningful browser checks run by GitHub Actions.

The existing legacy `clocklio-website/public/main.js` path is retained for repository compatibility and is not used by these pages.


## Resources and product brochure

The public site now includes Resources, nine Help Centre guides, Security & data, Switching, Product updates, Subscriptions and Referrals. All pages remain static HTML/CSS/JavaScript and publish through GitHub Pages.

- Brand, location, reviewed date and public URLs: `content/site.json`.
- Guide and release content: `scripts/resource-content.mjs`.
- Regenerate the resource HTML with `npm run resources:generate`, then review and commit the resulting public pages.
- Generate the two-page brochure with `python3 scripts/generate-brochure.py` in an environment with ReportLab and DejaVu Sans. The PDF uses the calculator's pricing functions and writes the website download under `public/downloads/`. Render and visually review both pages before publishing an updated PDF.
- The security page's primary database location was checked as London / eu-west-2 on 17 October 2026. It makes no certification or backup-retention guarantee. Review that copy when hosting or access rules change.
- Contact addresses and a referral reward are deliberately unconfigured. The referral tool produces a local shareable introduction URL and passes the reference into an enquiry draft; it does not register a referral, send an invitation or create a credit. Agree programme terms before announcing a financial reward.
- Subscription guidance describes confirmed package and approval behaviour. Business-specific service terms set renewal, cancellation and payment arrangements.


## Website stats

The shared social-profiles module imports the lightweight website page-view counter on every public page. It sends a random per-load token to the validated DayRidge endpoint, with cookies and referrer excluded, and waits for background pages to become visible. The dedicated Website stats menu shows daily totals, trends, comparisons, popular pages, broad device/referral buckets and brochure link clicks. The overview does not display website statistics. Only known public paths and fixed source/device categories are sent; full referrers and query strings are discarded. Download clicks are separate from page views. Local previews, the signed-in app, known crawler agents and 404 pages are excluded. Run `node --test tests/website-stats.test.mjs` to check those rules.

## Search metadata and product pages

The public clocking-in, staff rota and annual-leave product pages describe current workflows and direct businesses to early access, while retaining the 2027 launch message. The homepage and feature catalogue link to those pages.

`content/seo.json` holds page-specific titles, descriptions and breadcrumb labels. `scripts/seo.mjs` applies matching canonical and social metadata, Organization/WebSite/WebPage/BreadcrumbList structured data, and a sitemap containing the public indexable pages. Canonical and sharing URLs always use `content/site.json`'s production website address, including project-path QA builds. The 404 document is marked noindex and excluded from the sitemap. No review scores, launch availability or structured purchase offers are invented.

After editing SEO content or regenerating resources, run `npm run seo:refresh` to refresh the checked-in pages. The production build also reapplies this automatically. Add a metadata entry when adding a page; the checks reject missing or duplicate metadata and invalid sitemap coverage. `npm run check` includes SEO tests, and `npm run build` checks the generated output. Google Search Console ownership verification, sitemap submission and search performance reporting are separate owner setup steps.

## Knowledge base

The public training library is at `/knowledge-base/`. Edit `content/knowledge-base.json`, then run `npm run knowledge-base:generate` to regenerate articles and SEO metadata. `npm run resources:generate` also refreshes the training library after the legacy resources. Keep the reviewed owner handbook at `public/downloads/dayridge-business-owner-guide.pdf`. Role/topic filters are local to the browser. Print styles produce a readable guide without website navigation. Training traffic uses the existing anonymous Help analytics bucket; search text is not sent.
