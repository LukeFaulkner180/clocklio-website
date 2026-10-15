# ClockNexa showcase

A responsive marketing website built with plain HTML, CSS and JavaScript. No framework, runtime dependencies, database or bundler is needed.

## Pages

Home, Features, Pricing, Add-ons, Contact, Website Privacy and a custom 404 page. The site includes animated product illustrations, a role explorer, searchable feature catalogue, annual plan and monthly add-on calculator, and an interactive stock example.

## Hosting

All production files are in `public/`. For Cloudflare Pages, use root `/`, no build command, and output directory `public`. The optional `npm run build` copies the files to `dist/` for the hosted review preview.

Run `npm run check` for source validation. GitHub Actions checks real Chromium and WebKit interactions and uploads desktop/mobile screenshots. Playwright is used only in CI, not shipped to visitors.

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
