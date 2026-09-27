'use strict';
// Regression tests: 4-locale parity, plain-text dictionaries, and a ban on
// dangerous sinks plus third-party references in the shipped static shell.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const payload = require(path.join(root, 'i18n.js'));

assert.deepEqual(payload.LOCALES, ['ru', 'en', 'zh', 'es'], 'exactly 4 locales in order');

const keySets = payload.LOCALES.map((code) => {
  assert.ok(payload.STRINGS[code], `missing dictionary: ${code}`);
  return Object.keys(payload.STRINGS[code]).sort();
});
for (const code of payload.LOCALES) {
  assert.deepEqual(Object.keys(payload.STRINGS[code]).sort(), keySets[0], `key mismatch: ${code}`);
}
assert.ok(keySets[0].length >= 90, `dictionary looks too small: ${keySets[0].length}`);

const hostile = [/<[^>]*>/, /javascript:/i, /on\w+\s*=/i];
for (const code of payload.LOCALES) {
  for (const [key, value] of Object.entries(payload.STRINGS[code])) {
    assert.equal(typeof value, 'string', `${code}.${key} must be a string`);
    assert.ok(value.length > 0, `${code}.${key} must not be empty`);
    for (const rx of hostile) assert.ok(!rx.test(value), `${code}.${key} looks like markup/code`);
  }
  for (let i = 0; i < 6; i++) assert.ok(payload.STRINGS[code][`fact_${i}`], `${code}.fact_${i} missing`);
  assert.ok(payload.STRINGS[code].mail_subject, `${code}.mail_subject missing`);
}

for (const file of ['app.js', 'i18n.js']) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  for (const banned of ['innerHTML', 'outerHTML', 'document.write', 'eval(', 'new Function']) {
    assert.ok(!src.includes(banned), `${file} must not contain ${banned}`);
  }
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(html.includes('http-equiv="Content-Security-Policy"'), 'CSP fallback meta tag missing');
assert.ok(!/<script(?![^>]*\bsrc=)/.test(html), 'index.html must not contain inline scripts');
assert.ok(!/<style[\s>]/.test(html), 'index.html must not contain inline styles');
assert.ok(!html.includes('fonts.googleapis.com'), 'third-party fonts must be removed');
assert.ok(!html.includes('fonts.gstatic.com'), 'third-party font hosts must be removed');
for (const code of payload.LOCALES) {
  assert.ok(html.includes(`data-lang-btn="${code}"`), `switcher button missing: ${code}`);
}
for (const need of ['data-i18n-ph=', 'data-i18n-aria=', 'data-i18n-content=']) {
  assert.ok(html.includes(need), `index.html must use ${need}`);
}
assert.ok(html.includes('id="factText"'), 'factText node missing');
assert.ok(html.includes('id="calcSubmit"'), 'calcSubmit node missing');

const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
assert.ok(!css.includes('@import'), 'styles.css must not @import remote CSS');
assert.ok(!/url\(\s*['"]?https?:/i.test(css), 'styles.css must not reference remote URLs');

console.log(`OK: ${payload.LOCALES.length} locales, ${keySets[0].length} keys each, hardened static shell.`);

assert.ok(html.includes('name="viewport"'), 'responsive viewport meta tag missing');
assert.ok(html.includes('width=device-width'), 'viewport must cover device width');
assert.ok(css.includes('-webkit-text-size-adjust'), 'mobile text-size guard missing');
assert.ok(css.includes('touch-action: manipulation'), 'tap-delay guard missing');
for (const need of ['max-width: 960px', 'max-width: 400px', 'pointer: coarse']) {
  assert.ok(css.includes(need), `styles.css must cover ${need}`);
}
for (const need of ['80dvh', 'overflow-x: clip', 'scroll-padding-top: calc(4.5rem']) {
  assert.ok(css.includes(need), `styles.css must include ${need}`);
}
assert.ok(fs.readFileSync(path.join(root, 'app.js'), 'utf8').includes('classList.contains'), 'app.js must close the menu after a language pick');
