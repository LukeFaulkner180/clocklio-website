# ClockNexa Website

This repository contains the standalone public marketing website for ClockNexa.
The signed-in workforce app is maintained separately in
[`LukeFaulkner180/clocklio`](https://github.com/LukeFaulkner180/clocklio).

## Preview locally

Serve the `public` directory with any static file server, for example:

```sh
python3 -m http.server 4173 --directory public
```

Then open `http://localhost:4173`.

## Cloudflare Pages

Connect this repository to a separate Cloudflare Pages project and use:

- Production branch: `main`
- Framework preset: `None`
- Build command: leave blank
- Build output directory: `public`

The sign-in links use the app URL in the `clocknexa-app-url` meta tag in
`public/index.html`. Update it if the app moves to a custom domain.

The public plan amounts in `public/main.js` mirror the platform admin's plan
list in the app repository at `src/lib/pricing.ts`. Keep both copies aligned
when changing plan names, employee limits or annual prices.
