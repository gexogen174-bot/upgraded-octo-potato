'use strict';
/* Hexlock Trade Group — language switcher + page interactions.
   Only same-origin static scripts run (see CSP). All user input is
   treated as hostile: length caps, encodeURIComponent mailto links,
   validated fact indexes, and textContent-only rendering. */
(function () {
  var LOCALES = ['ru', 'en', 'zh', 'es'];
  var FALLBACK = 'ru';
  var STORE_KEY = 'hexlock-lang';
  var FACT_COUNT = 6;
  var MAX_SHORT = 200;
  var MAX_COMMENT = 1000;

  function dicts() {
    return (window.I18N && window.I18N.STRINGS) || {};
  }

  function isLocale(value) {
    return LOCALES.indexOf(value) !== -1;
  }

  function detectLang() {
    try {
      var fromUrl = new URLSearchParams(window.location.search).get('lang');
      if (isLocale(fromUrl)) return fromUrl;
    } catch (e) { /* URL API unavailable: ignore */ }
    try {
      var stored = window.localStorage.getItem(STORE_KEY);
      if (isLocale(stored)) return stored;
    } catch (e) { /* storage blocked: ignore */ }
    var nav = String((typeof navigator !== 'undefined' && navigator.language) || FALLBACK).toLowerCase();
    if (nav.indexOf('zh') === 0) return 'zh';
    if (nav.indexOf('en') === 0) return 'en';
    if (nav.indexOf('es') === 0) return 'es';
    return 'ru';
  }

  var current = detectLang();

  function t(key) {
    var d = dicts();
    if (d[current] && typeof d[current][key] === 'string') return d[current][key];
    if (d[FALLBACK] && typeof d[FALLBACK][key] === 'string') return d[FALLBACK][key];
    return '';
  }

  function cap(value, max) {
    var s = String(value == null ? '' : value);
    return s.length > max ? s.slice(0, max) : s;
  }

  var factText = null;

  function applyLang(lang) {
    if (!isLocale(lang)) return;
    current = lang;
    var strings = dicts()[lang] || {};
    document.documentElement.setAttribute('lang', lang);
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      if (typeof strings[key] === 'string') nodes[i].textContent = strings[key];
    }
    var phs = document.querySelectorAll('[data-i18n-ph]');
    for (var p = 0; p < phs.length; p++) {
      var pk = phs[p].getAttribute('data-i18n-ph');
      if (typeof strings[pk] === 'string') phs[p].setAttribute('placeholder', strings[pk]);
    }
    var arias = document.querySelectorAll('[data-i18n-aria]');
    for (var a = 0; a < arias.length; a++) {
      var ak = arias[a].getAttribute('data-i18n-aria');
      if (typeof strings[ak] === 'string') arias[a].setAttribute('aria-label', strings[ak]);
    }
    var metas = document.querySelectorAll('[data-i18n-content]');
    for (var m = 0; m < metas.length; m++) {
      var mk = metas[m].getAttribute('data-i18n-content');
      if (typeof strings[mk] === 'string') metas[m].setAttribute('content', strings[mk]);
    }
    if (typeof strings.meta_title === 'string') document.title = strings.meta_title;
    var buttons = document.querySelectorAll('[data-lang-btn]');
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].setAttribute(
        'aria-pressed',
        buttons[b].getAttribute('data-lang-btn') === lang ? 'true' : 'false'
      );
    }
    try {
      window.localStorage.setItem(STORE_KEY, lang);
    } catch (e) { /* storage blocked: language just won't persist */ }
    if (factText) factText.textContent = t('fact_0');
  }

  function setActive(i) {
    if (!factText) return;
    if (i < 0 || i >= FACT_COUNT) return;
    var text = t('fact_' + i);
    factText.style.opacity = 0;
    setTimeout(function () {
      factText.textContent = text;
      factText.style.opacity = 1;
    }, 150);
  }

  function init() {
    var buttons = document.querySelectorAll('[data-lang-btn]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (event) {
        applyLang(event.currentTarget.getAttribute('data-lang-btn'));
        var navEl = document.getElementById('siteNav');
        var toggleEl = document.getElementById('navToggle');
        if (navEl && toggleEl && navEl.classList.contains('is-open')) {
          navEl.classList.remove('is-open');
          toggleEl.setAttribute('aria-expanded', 'false');
        }
      });
    }

    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('siteNav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      var links = nav.querySelectorAll('a');
      for (var l = 0; l < links.length; l++) {
        links[l].addEventListener('click', function () {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      }
    }

    var hero = document.getElementById('heroSection');
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    if (hero && !reduceMotion && canHover) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
          hero.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        }
      });
    }

    factText = document.getElementById('factText');
    var dots = document.querySelectorAll('.fact-node');
    for (var n = 0; n < dots.length; n++) {
      (function (v) {
        var idx = parseInt(v.getAttribute('data-fact-index'), 10);
        if (!isFinite(idx) || idx < 0 || idx >= FACT_COUNT) return;
        v.addEventListener('mouseenter', function () { setActive(idx); });
        v.addEventListener('click', function () { setActive(idx); });
        v.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(idx); }
        });
      })(dots[n]);
    }

    var faqs = document.querySelectorAll('.faq-question');
    for (var f = 0; f < faqs.length; f++) {
      faqs[f].addEventListener('click', function (event) {
        var btn = event.currentTarget;
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        var answer = btn.nextElementSibling;
        btn.setAttribute('aria-expanded', String(!expanded));
        if (answer) answer.style.maxHeight = expanded ? '' : (answer.scrollHeight + 'px');
      });
    }

    var calcSubmit = document.getElementById('calcSubmit');
    if (calcSubmit) {
      calcSubmit.addEventListener('click', function () {
        var category = cap(document.getElementById('calcCategory').value, MAX_SHORT);
        var volume = cap(document.getElementById('calcVolume').value, MAX_SHORT).trim();
        var origin = cap(document.getElementById('calcOrigin').value, MAX_SHORT).trim();
        var destination = cap(document.getElementById('calcDestination').value, MAX_SHORT).trim();
        var comment = cap(document.getElementById('calcComment').value, MAX_COMMENT).trim();
        var lines = [t('mail_line'), ''];
        if (category) lines.push(t('mail_cat') + ': ' + category);
        if (volume) lines.push(t('mail_vol') + ': ' + volume);
        if (origin) lines.push(t('mail_origin') + ': ' + origin);
        if (destination) lines.push(t('mail_dest') + ': ' + destination);
        if (comment) lines.push(t('mail_comment') + ': ' + comment);
        var body = lines.join('\n');
        window.location.href = 'mailto:info@hexlock.pro?subject=' +
          encodeURIComponent(t('mail_subject')) + '&body=' + encodeURIComponent(body);
      });
    }

    applyLang(current);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
