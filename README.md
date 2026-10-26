# Hexlock Trade Group

Static multilingual site with one standalone page per language: `index.html` (RU) + `en/` + `zh/` + `es/`, shared `styles.css` + `app.js`. No application server, database, or third-party code.

## Languages

Russian at `/` (default), English at `/en/`, Chinese (Simplified) at `/zh/`, Spanish at `/es/`. Each page carries its own static copy (no client-side dictionary, no `localStorage`, no `?lang=`). The header switcher is plain links (`/` `/en/` `/zh/` `/es/`) with `aria-current="page"` on the active language. SEO: per-page canonical + `og:*`, shared `hreflang` block (ru/en/zh/es/x-default), `sitemap.xml`, `robots.txt`.

## Security

- Static hosting only: strict CSP (`default-src 'self'`, no inline scripts/styles, no third-party origins) via `_headers` (Cloudflare Pages / Netlify) plus a `<meta>` fallback; `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, HSTS, minimal `Permissions-Policy`.
- No `innerHTML` / `eval` / inline handlers anywhere; calculator input is length-capped and sent only through an `encodeURIComponent` `mailto:` link.
- Google Fonts removed in favor of system stacks so the self-only CSP holds.

## Develop

Run locally with `npm run dev` (Python 3 required), then open `/`, `/en/`, `/zh/`, `/es/`. Run `npm test` for static-page parity (lang/title/copy/switcher/SEO), sitemap/robots, and hardening regression tests. Serve over HTTPS in production for HSTS to take effect.

## Yandex verification

`yandex_7b7486b213ccdaca.html` confirms site ownership in Yandex Webmaster and must stay in the site root of every deploy. It is not linked from pages, `sitemap.xml` or `robots.txt`, and `_headers` serves it with `X-Robots-Tag: noindex`. `npm test` fails if it goes missing.
