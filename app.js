'use strict';
/* Language switcher + calculator. Only same-origin static scripts run
   (see CSP). All user input is treated as hostile: strict allow-lists,
   finite-number parsing with bounds, and textContent-only rendering. */
(function () {
  var LOCALES = ["en", "ru", "zh", "es"];
  var FORM_LOCALES = { en: "en-US", ru: "ru-RU", zh: "zh-CN", es: "es-ES" };
  var CURRENCY = "USD";
  var WEIGHT_MIN = 0.1, WEIGHT_MAX = 30000;
  var DIST_MIN = 1, DIST_MAX = 20000;
  var STORE_KEY = "hexlock-lang";
  var TYPES = ["standard", "express", "fragile"];

  function dict() {
    return (window.I18N && window.I18N.STRINGS) || {};
  }

  function isLocale(value) {
    return LOCALES.indexOf(value) !== -1;
  }

  function detectLang() {
    try {
      var fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (isLocale(fromUrl)) return fromUrl;
    } catch (e) { /* URL API unavailable: ignore */ }
    try {
      var stored = window.localStorage.getItem(STORE_KEY);
      if (isLocale(stored)) return stored;
    } catch (e) { /* storage blocked: ignore */ }
    var nav = String(navigator.language || "en").toLowerCase();
    if (nav.indexOf("zh") === 0) return "zh";
    if (nav.indexOf("ru") === 0) return "ru";
    if (nav.indexOf("es") === 0) return "es";
    return "en";
  }

  var current = detectLang();

  function t(key) {
    var d = dict();
    if (d[current] && typeof d[current][key] === "string") return d[current][key];
    if (d.en && typeof d.en[key] === "string") return d.en[key];
    return "";
  }

  var resultEl, weightEl, distEl, typeEl;

  function showIdle() {
    resultEl.classList.remove("is-error");
    resultEl.textContent = t("result_idle");
  }

  function showError(message) {
    resultEl.classList.add("is-error");
    resultEl.textContent = message;
  }

  function applyLang(lang) {
    if (!isLocale(lang)) return;
    current = lang;
    var strings = dict()[lang] || {};
    document.documentElement.setAttribute("lang", lang);
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      if (typeof strings[key] === "string") nodes[i].textContent = strings[key];
    }
    if (typeof strings.meta_title === "string") document.title = strings.meta_title;
    var buttons = document.querySelectorAll("[data-lang-btn]");
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].setAttribute(
        "aria-pressed",
        buttons[j].getAttribute("data-lang-btn") === lang ? "true" : "false"
      );
    }
    try {
      window.localStorage.setItem(STORE_KEY, lang);
    } catch (e) { /* storage blocked: language just won't persist */ }
    if (resultEl) showIdle();
  }

  // Strict number parsing: finite values only, comma decimal supported
  // ("0,5" -> 0.5). Anything else (NaN, Infinity, hex tricks) is rejected.
  function toNumber(raw) {
    var s = String(raw == null ? "" : raw).trim();
    if (s === "") return null;
    if (/^\d+,\d+$/.test(s)) s = s.replace(",", ".");
    if (!/^[+-]?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/.test(s)) return null;
    var value = Number(s);
    return Number.isFinite(value) ? value : null;
  }

  function estimate(weight, distance, type) {
    var coeff = type === "express" ? 1.6 : type === "fragile" ? 1.25 : 1;
    return (50 + weight * 1.2 + distance * 0.35) * coeff;
  }

  function formatPrice(value) {
    try {
      return new Intl.NumberFormat(FORM_LOCALES[current], {
        style: "currency",
        currency: CURRENCY
      }).format(value);
    } catch (e) {
      return value.toFixed(2) + " " + CURRENCY;
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    var weight = toNumber(weightEl.value);
    var distance = toNumber(distEl.value);
    var type = TYPES.indexOf(typeEl.value) !== -1 ? typeEl.value : "standard";
    if (weight === null || weight < WEIGHT_MIN || weight > WEIGHT_MAX) {
      showError(t("error_weight"));
      return;
    }
    if (distance === null || distance < DIST_MIN || distance > DIST_MAX) {
      showError(t("error_distance"));
      return;
    }
    // {price} is replaced with a server-independent formatted number we
    // generated ourselves; never with raw user input.
    var text = t("result_text").split("{price}").join(formatPrice(estimate(weight, distance, type)));
    resultEl.classList.remove("is-error");
    resultEl.textContent = text;
  }

  function init() {
    resultEl = document.getElementById("result");
    weightEl = document.getElementById("weight");
    distEl = document.getElementById("distance");
    typeEl = document.getElementById("ctype");
    var form = document.getElementById("calc-form");
    if (!resultEl || !weightEl || !distEl || !typeEl || !form) return;
    var buttons = document.querySelectorAll("[data-lang-btn]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (event) {
        applyLang(event.currentTarget.getAttribute("data-lang-btn"));
      });
    }
    form.addEventListener("submit", onSubmit);
    applyLang(current);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
