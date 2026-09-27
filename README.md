# Hexlock Trade Group

Single-file design shipped as a hardened static site: `index.html` + `styles.css` + `i18n.js` + `app.js`. No application server, database, or third-party code.

## Languages

Russian (default), English, Chinese (Simplified) and Spanish. The switcher in the header persists the choice (`localStorage`), honors `?lang=`, and falls back to the browser language. All strings live in `i18n.js` and are rendered via `textContent` / `placeholder` / `aria-label` only.

## Security

- Static hosting only: strict CSP (`default-src 'self'`, no inline scripts/styles, no third-party origins) via `_headers` (Cloudflare Pages / Netlify) plus a `<meta>` fallback; `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, HSTS, minimal `Permissions-Policy`.
- No `innerHTML` / `eval` / inline handlers anywhere; calculator input is length-capped and sent only through an `encodeURIComponent` `mailto:` link.
- Google Fonts removed in favor of system stacks so the self-only CSP holds.

## Develop

Run locally with `npm run dev` (Python 3 required). Run `npm test` for locale parity and hardening regression tests. Serve over HTTPS in production for HSTS to take effect.
