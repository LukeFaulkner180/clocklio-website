# ClockNexa showcase

A responsive marketing website built with plain HTML, CSS and JavaScript. No framework, runtime dependencies, database or bundler is needed.

## Pages

Home, Features, Pricing, Add-ons, Contact, Website Privacy and a custom 404 page. The site includes animated product illustrations, a role explorer, searchable feature catalogue, annual plan and monthly add-on calculator, and an interactive stock example.

## Hosting

All source files are in `public/`. GitHub Pages is deployed by `.github/workflows/deploy-pages.yml` on each push to `main`. Enable it once in the repository under **Settings → Pages → Build and deployment → Source: GitHub Actions**. Repository settings are managed by the owner; the workflow does not change repository visibility.

The workflow gets the publishing URL and project path from GitHub, builds `dist/`, verifies links and publishes only those static files. Its deployment job reports the live URL. With the default GitHub domain, the project URL is `https://lukefaulkner180.github.io/clocklio-website/` once Pages is enabled and deployment succeeds.

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
- `public/assets/`: approved ClockNexa brand assets.
- `scripts/`: optional static build and source checks.
- `tests/showcase-smoke.mjs`: meaningful browser checks run by GitHub Actions.

The existing legacy `clocklio-website/public/main.js` path is retained for repository compatibility and is not used by these pages.
