'use strict';
/* Hexlock Trade Group — page interactions (static multilingual build).
   Only same-origin static scripts run (see CSP). All user input is
   treated as hostile: length caps, encodeURIComponent mailto links,
   validated fact indexes, and textContent-only rendering. */
(function () {
  var FACTS = {"ru": ["Проверяем репутацию и возможности каждого завода перед сделкой", "Ведём сделку от первого запроса до получения товара на складе", "Работаем с заводами и покупателями в разных странах", "Прозрачные расчёты — без скрытых комиссий", "Личный контакт с командой на каждом этапе, а не колл-центр", "Берём на себя таможенное оформление и маршрут доставки"], "en": ["We check the reputation and capabilities of every factory before the deal", "We manage the deal from the first request to goods arriving at your warehouse", "We work with factories and buyers in different countries", "Transparent pricing — no hidden fees", "A direct line to the team at every step, not a call centre", "We take care of customs clearance and the delivery route"], "zh": ["在交易前核查每家工厂的信誉与实力", "从首次询盘到货物入库，全程跟进交易", "与不同国家的工厂和买家合作", "价格透明——无隐藏费用", "每个环节直接对接团队，而非呼叫中心", "负责清关与运输路线安排"], "es": ["Verificamos la reputación y la capacidad de cada fábrica antes del acuerdo", "Gestionamos el acuerdo desde la primera solicitud hasta la recepción en el almacén", "Trabajamos con fábricas y compradores de distintos países", "Cálculos transparentes, sin comisiones ocultas", "Contacto directo con el equipo en cada etapa, no un centro de llamadas", "Asumimos el despacho aduanero y la ruta de entrega"]};
  var MAIL = {"ru": {"mail_subject": "Запрос на расчёт логистики — Hexlock", "mail_line": "Запрос на расчёт стоимости логистики:", "mail_cat": "Категория товара", "mail_vol": "Объём партии", "mail_origin": "Страна отправления", "mail_dest": "Страна назначения", "mail_comment": "Комментарий"}, "en": {"mail_subject": "Logistics quote request — Hexlock", "mail_line": "Logistics cost estimate request:", "mail_cat": "Goods category", "mail_vol": "Batch volume", "mail_origin": "Country of origin", "mail_dest": "Destination country", "mail_comment": "Comment"}, "zh": {"mail_subject": "物流报价请求 — Hexlock", "mail_line": "物流费用估算请求：", "mail_cat": "产品类别", "mail_vol": "批量", "mail_origin": "发货国家", "mail_dest": "目的国家", "mail_comment": "备注"}, "es": {"mail_subject": "Solicitud de cálculo logístico — Hexlock", "mail_line": "Solicitud de cálculo del costo logístico:", "mail_cat": "Categoría de la mercancía", "mail_vol": "Volumen del lote", "mail_origin": "País de origen", "mail_dest": "País de destino", "mail_comment": "Comentario"}};
  var FACT_COUNT = 6;
  var MAX_SHORT = 200;
  var MAX_COMMENT = 1000;

  /* Page language comes from <html lang>; set statically per page. */
  var lang = document.documentElement.getAttribute('lang') || 'ru';
  if (!FACTS[lang]) lang = 'ru';
  var mail = MAIL[lang] || MAIL.ru;

  function cap(value, max) {
    var s = String(value == null ? '' : value);
    return s.length > max ? s.slice(0, max) : s;
  }

  var factText = null;

  function setActive(i) {
    if (!factText) return;
    if (i < 0 || i >= FACT_COUNT) return;
    var text = (FACTS[lang] || FACTS.ru)[i];
    if (typeof text !== 'string') return;
    factText.style.opacity = 0;
    setTimeout(function () {
      factText.textContent = text;
      factText.style.opacity = 1;
    }, 150);
  }

  function init() {
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
        var lines = [mail.mail_line, ''];
        if (category) lines.push(mail.mail_cat + ': ' + category);
        if (volume) lines.push(mail.mail_vol + ': ' + volume);
        if (origin) lines.push(mail.mail_origin + ': ' + origin);
        if (destination) lines.push(mail.mail_dest + ': ' + destination);
        if (comment) lines.push(mail.mail_comment + ': ' + comment);
        var body = lines.join('\n');
        window.location.href = 'mailto:info@hexlock.pro?subject=' +
          encodeURIComponent(mail.mail_subject) + '&body=' + encodeURIComponent(body);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
