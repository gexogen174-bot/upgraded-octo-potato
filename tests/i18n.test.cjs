'use strict';
// Regression tests for the static multilingual build: 4 standalone pages
// (ru at /, en/zh/es in subfolders), link switcher, SEO tags, sitemap,
// robots, and a ban on dangerous sinks plus third-party references.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const PAGES = { ru: 'index.html', en: 'en/index.html', zh: 'zh/index.html', es: 'es/index.html' };
const html = {};
for (const [code, rel] of Object.entries(PAGES)) {
  html[code] = fs.readFileSync(path.join(root, rel), 'utf8');
}

const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

// No client-side i18n runtime remains.
assert.ok(!fs.existsSync(path.join(root, 'i18n.js')), 'i18n.js must be removed');
for (const [code, src] of Object.entries(html)) {
  assert.ok(!src.includes('i18n.js'), `${code}: must not reference i18n.js`);
  assert.ok(!src.includes('data-i18n'), `${code}: data-i18n attributes must be gone`);
  assert.ok(!src.includes('data-i18n-content'), `${code}: data-i18n-content must be gone`);
  assert.ok(!src.includes('data-i18n-aria'), `${code}: data-i18n-aria must be gone`);
  assert.ok(!src.includes('data-i18n-ph'), `${code}: data-i18n-ph must be gone`);
  assert.ok(!src.includes('data-lang-btn'), `${code}: data-lang-btn buttons must be gone`);
}
for (const banned of ['localStorage', 'hexlock-lang', 'data-lang-btn']) {
  assert.ok(!app.includes(banned), `app.js must not contain ${banned}`);
}

// Per-page language, titles, switcher links, asset paths.
const wantLang = { ru: '<html lang="ru">', en: '<html lang="en">', zh: '<html lang="zh">', es: '<html lang="es">' };
const wantTitle = {
  ru: 'Hexlock Trade Group — посредник между заводами и покупателями',
  en: 'Hexlock Trade Group — the link between factories and buyers',
  zh: 'Hexlock Trade Group — 工厂与买家之间的桥梁',
  es: 'Hexlock Trade Group — el enlace entre fábricas y compradores',
};
for (const code of Object.keys(PAGES)) {
  assert.ok(html[code].includes(wantLang[code]), `${code}: wrong <html lang>`);
  assert.ok(html[code].includes(`<title>${wantTitle[code]}</title>`), `${code}: wrong <title>`);
  assert.ok(html[code].includes('http-equiv="Content-Security-Policy"'), `${code}: CSP fallback missing`);
  assert.ok(!/<script(?![^>]*\bsrc=)/.test(html[code]), `${code}: no inline scripts`);
  assert.ok(!/<style[\s>]/.test(html[code]), `${code}: no inline styles`);
  assert.ok(!html[code].includes('fonts.googleapis.com'), `${code}: no third-party fonts`);
  assert.ok(html[code].includes('id="factText"'), `${code}: factText missing`);
  assert.ok(html[code].includes('id="calcSubmit"'), `${code}: calcSubmit missing`);
  // Switcher: 3 outbound links + current page marked active, never self-linked.
  const links = [...html[code].matchAll(/<a class="lang-btn" href="([^"]+)">/g)].map((m) => m[1]);
  assert.equal(links.length, 3, `${code}: switcher must link to the 3 other locales`);
  assert.ok(html[code].includes('aria-current="page"'), `${code}: active language must use aria-current`);
  const selfHref = { ru: '"href="/"', en: '"href="/en/"', zh: '"href="/zh/"', es: '"href="/es/"' }[code];
  assert.ok(!links.includes(selfHref.replace(/"/g, '')), `${code}: switcher must not self-link`);
}
// Asset paths: root page local, subfolders one level up.
assert.ok(html.ru.includes('href="styles.css"') && html.ru.includes('src="app.js"'), 'ru: local asset paths');
for (const code of ['en', 'zh', 'es']) {
  assert.ok(html[code].includes('href="../styles.css"'), `${code}: css path`);
  assert.ok(html[code].includes('src="../app.js"'), `${code}: js path`);
}

// SEO: canonical, og, hreflang identical on all pages.
const wantCanonical = { ru: '/', en: '/en/', zh: '/zh/', es: '/es/' };
for (const code of Object.keys(PAGES)) {
  assert.ok(html[code].includes(`<link rel="canonical" href="https://hexlock.pro${wantCanonical[code]}">`), `${code}: canonical`);
  assert.ok(html[code].includes(`<meta property="og:url" content="https://hexlock.pro${wantCanonical[code]}">`), `${code}: og:url`);
  assert.ok(!html[code].includes('data-i18n-content="meta_desc"'), `${code}: static meta description`);
  for (const [h, href] of [['ru', '/'], ['en', '/en/'], ['zh', '/zh/'], ['es', '/es/'], ['x-default', '/']]) {
    assert.ok(html[code].includes(`<link rel="alternate" hreflang="${h}" href="https://hexlock.pro${href}">`), `${code}: hreflang ${h}`);
  }
}
// Each locale's visible copy must be present (spot checks across sections).
const spots = {
  ru: ['О компании', 'Получить расчёт', 'Частые вопросы'],
  en: ['About', 'Get an estimate', 'FAQ'],
  zh: ['关于我们', '获取估算', '常见问题'],
  es: ['Nosotros', 'Solicitar el cálculo', 'Preguntas frecuentes'],
};
for (const code of Object.keys(PAGES)) {
  for (const s of spots[code]) assert.ok(html[code].includes(s), `${code}: missing copy ${s}`);
}

// app.js: no lang switching, keeps widgets, no dangerous sinks.
for (const banned of ['innerHTML', 'outerHTML', 'document.write', 'eval(', 'new Function']) {
  assert.ok(!app.includes(banned), `app.js must not contain ${banned}`);
}
for (const keep of ['navToggle', 'fact-node', 'faq-question', 'calcSubmit', 'encodeURIComponent']) {
  assert.ok(app.includes(keep), `app.js must keep ${keep}`);
}

// style/headers/seocompanions.
assert.ok(!css.includes('@import'), 'no remote CSS @import');
assert.ok(!/url\(\s*['"]?https?:/i.test(css), 'no remote URLs in CSS');
assert.ok(css.includes('.lang-btn.is-active'), 'active switcher style');
const headers = fs.readFileSync(path.join(root, '_headers'), 'utf8');
assert.ok(!headers.includes('i18n.js'), '_headers must not mention i18n.js');
assert.ok(headers.includes('\n/*\n'), '_headers must keep the /* all-paths scope');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const loc of ['/', '/en/', '/zh/', '/es/']) {
  assert.ok(sitemap.includes(`<loc>https://hexlock.pro${loc}</loc>`), `sitemap missing ${loc}`);
}
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
assert.ok(robots.includes('Sitemap: https://hexlock.pro/sitemap.xml'), 'robots sitemap');
for (const a of ['Allow: /', 'Allow: /en/', 'Allow: /zh/', 'Allow: /es/']) {
  assert.ok(robots.includes(a), `robots missing ${a}`);
}

// Responsive guards preserved.
assert.ok(html.ru.includes('width=device-width'), 'viewport');
assert.ok(css.includes('-webkit-text-size-adjust'), 'text-size guard');
assert.ok(css.includes('touch-action: manipulation'), 'tap guard');
for (const need of ['max-width: 960px', 'max-width: 400px', 'pointer: coarse']) {
  assert.ok(css.includes(need), `css must cover ${need}`);
}

console.log('OK: 4 static locale pages, link switcher, SEO companions, hardened shell.');
