'use strict';
// Regression tests: locale parity, plain-text dictionaries, and a ban on
// dangerous DOM sinks in the shipped scripts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const payload = require(path.join(root, 'i18n.js'));

assert.deepEqual(payload.LOCALES, ['en', 'ru', 'zh', 'es'], 'exactly 4 locales');

const keySets = payload.LOCALES.map((code) => {
  assert.ok(payload.STRINGS[code], `missing dictionary: ${code}`);
  return Object.keys(payload.STRINGS[code]).sort();
});
for (const code of payload.LOCALES) {
  assert.deepEqual(Object.keys(payload.STRINGS[code]).sort(), keySets[0], `key mismatch: ${code}`);
}
assert.ok(keySets[0].length > 20, 'dictionary looks too small');

for (const code of payload.LOCALES) {
  for (const [key, value] of Object.entries(payload.STRINGS[code])) {
    assert.equal(typeof value, 'string', `${code}.${key} must be a string`);
    assert.ok(value.length > 0, `${code}.${key} must not be empty`);
    assert.ok(!/[<>]/.test(value), `${code}.${key} must be plain text (no markup)`);
    assert.ok(!/javascript:/i.test(value), `${code}.${key} must not contain a URL scheme`);
  }
  assert.ok(
    payload.STRINGS[code].result_text.includes('{price}'),
    `${code}.result_text must contain the {price} placeholder`
  );
}

for (const file of ['index.html', 'app.js', 'i18n.js']) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  for (const banned of ['innerHTML', 'outerHTML', 'document.write', 'eval(', 'Function(']) {
    assert.ok(!src.includes(banned), `${file} must not contain ${banned}`);
  }
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(html.includes('http-equiv="Content-Security-Policy"'), 'CSP fallback meta tag missing');
for (const code of payload.LOCALES) {
  assert.ok(html.includes(`data-lang-btn="${code}"`), `switcher button missing: ${code}`);
}

console.log(`OK: ${payload.LOCALES.length} locales, ${keySets[0].length} keys each, no dangerous sinks.`);
