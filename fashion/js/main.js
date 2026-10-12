/* =============================================================
   АТЕЛЬЕ — общий скрипт для всех страниц
   vanilla JS · без зависимостей · работает по file:// и на GitHub Pages
   ============================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------
     1. Плавное появление страницы
     ----------------------------------------------------------- */
  function revealBody() {
    // Запускаем после загрузки, но с защитным таймаутом
    var done = false;
    function go() {
      if (done) return;
      done = true;
      document.body.classList.add('loaded');
    }
    if (document.readyState === 'complete') {
      go();
    } else {
      window.addEventListener('load', go, { once: true });
      setTimeout(go, 900);
    }
  }
  revealBody();

  /* Плавный уход со страницы при клике по внутренним ссылкам */
  function initPageLeave() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      if (href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.host !== window.location.host) return; // внешние ссылки

      // только внутренние .html страницы
      if (!/\.html($|#|\?)/.test(href)) return;
      if (reduceMotion) return;

      e.preventDefault();
      document.documentElement.classList.add('page-leaving');
      setTimeout(function () { window.location.href = href; }, 320);
    });
  }
  initPageLeave();

  /* -----------------------------------------------------------
     2. Шапка: тень при скролле + мобильное меню + активная страница
     ----------------------------------------------------------- */
  function initHeader() {
    var header = document.getElementById('header');
    if (header) {
      var onScroll = function () {
        if (window.scrollY > 12) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('nav');
    if (toggle && nav) {
      var close = function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Открыть меню');
        document.body.classList.remove('menu-open');
      };
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
        document.body.classList.toggle('menu-open', open);
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) close();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
      });
    }
  }
  initHeader();

  /* Подсветка активной страницы в навигации (по имени файла) */
  function initActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    if (path === '') path = 'index.html';
    var links = document.querySelectorAll('.nav__link');
    links.forEach(function (link) {
      var href = (link.getAttribute('href') || '').split('/').pop().split('#')[0];
      if (href && href === path) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }
  initActiveNav();

  /* -----------------------------------------------------------
     3. Reveal-анимации через IntersectionObserver
     ----------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }
  initReveal();

  /* -----------------------------------------------------------
     3.5. Редакционные приёмы: буквенный реверс и перелист номера
     ----------------------------------------------------------- */
  function initEditorial() {
    // Буквенный реверс бренда и заголовков
    var splits = document.querySelectorAll('[data-split]');
    splits.forEach(function (el) {
      var text = el.textContent;
      el.textContent = '';
      Array.prototype.forEach.call(text, function (ch, i) {
        var span = document.createElement('span');
        span.className = 'split-char';
        span.style.setProperty('--i', i);
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        el.appendChild(span);
      });
    });

    // Дверца номера: убираем после «перелиста»
    var gate = document.querySelector('[data-gate]');
    if (gate) {
      var dropGate = function () { gate.classList.add('is-gone'); };
      if (reduceMotion) dropGate();
      else setTimeout(dropGate, 1700);
    }
  }
  initEditorial();

  /* -----------------------------------------------------------
     4. Счётчики (страница «О бренде»)
     ----------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var animate = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1600;
      if (reduceMotion) {
        el.textContent = target.toLocaleString('ru-RU') + suffix;
        return;
      }
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = Math.round(target * eased);
        el.textContent = val.toLocaleString('ru-RU') + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animate);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io.observe(el); });
  }
  initCounters();

  /* -----------------------------------------------------------
     5. Фильтры каталога (сезон + категория) и lightbox
     ----------------------------------------------------------- */
  function initCollection() {
    var grid = document.querySelector('.collection-grid');
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.look-card'));
    var filterBtns = document.querySelectorAll('[data-filter]');
    var status = document.querySelector('.filter-status');
    var empty = document.querySelector('.empty-state');

    var state = { season: 'all', category: 'all' };

    function apply() {
      var visible = 0;
      cards.forEach(function (card) {
        var s = card.getAttribute('data-season') || '';
        var c = card.getAttribute('data-category') || '';
        var ok = (state.season === 'all' || s === state.season) &&
                 (state.category === 'all' || c === state.category);
        card.classList.toggle('card-hidden', !ok);
        if (ok) visible++;
      });
      if (status) {
        status.textContent = 'Показано работ: ' + visible + ' из ' + cards.length;
      }
      if (empty) empty.classList.toggle('is-shown', visible === 0);
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.getAttribute('data-group');
        var value = btn.getAttribute('data-value');
        state[group] = value;
        document.querySelectorAll('[data-group="' + group + '"]').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        apply();
      });
    });

    apply();
    initLightbox(cards, apply);
  }

  function initLightbox(cards) {
    var triggers = cards.filter(function (c) { return !c.classList.contains('card-hidden'); });

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Просмотр работы');
    box.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="Закрыть просмотр">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>' +
      '<button class="lightbox__btn lightbox__btn--prev" type="button" aria-label="Предыдущая работа">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>' +
      '</button>' +
      '<figure class="lightbox__figure">' +
        '<img class="lightbox__img" src="" alt="">' +
        '<figcaption class="lightbox__cap"><strong></strong><span></span></figcaption>' +
      '</figure>' +
      '<button class="lightbox__btn lightbox__btn--next" type="button" aria-label="Следующая работа">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>' +
      '</button>';
    document.body.appendChild(box);

    var imgEl = box.querySelector('.lightbox__img');
    var capName = box.querySelector('.lightbox__cap strong');
    var capMeta = box.querySelector('.lightbox__cap span');
    var current = 0;
    var lastFocus = null;

    function list() {
      return cards.filter(function (c) { return !c.classList.contains('card-hidden'); });
    }

    function show(i) {
      var arr = list();
      if (!arr.length) return;
      current = (i + arr.length) % arr.length;
      var card = arr[current];
      var img = card.querySelector('img');
      var title = card.getAttribute('data-title') || '';
      var cat = card.getAttribute('data-cat-label') || '';
      var price = card.getAttribute('data-price') || '';
      var full = card.getAttribute('data-full') || (img ? img.src : '');

      imgEl.style.opacity = '0';
      var pre = new Image();
      pre.onload = function () {
        imgEl.src = full;
        imgEl.alt = img ? img.alt : title;
        imgEl.style.opacity = '1';
      };
      pre.onerror = function () {
        imgEl.src = img ? img.src : full;
        imgEl.alt = img ? img.alt : title;
        imgEl.style.opacity = '1';
      };
      pre.src = full;

      capName.textContent = title;
      capMeta.textContent = [cat, price].filter(Boolean).join(' · ');
    }

    function open(card) {
      var arr = list();
      current = arr.indexOf(card);
      if (current < 0) current = 0;
      lastFocus = document.activeElement;
      show(current);
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      box.querySelector('.lightbox__close').focus();
    }

    function close() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    cards.forEach(function (card) {
      var btn = card.querySelector('.look-card__btn') || card;
      btn.addEventListener('click', function () { open(card); });
    });

    box.querySelector('.lightbox__close').addEventListener('click', close);
    box.querySelector('.lightbox__btn--prev').addEventListener('click', function (e) { e.stopPropagation(); show(current - 1); });
    box.querySelector('.lightbox__btn--next').addEventListener('click', function (e) { e.stopPropagation(); show(current + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
    });

    // свайпы для мобильных
    var startX = null;
    box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(dx > 0 ? current - 1 : current + 1);
      startX = null;
    });
  }
  initCollection();

  /* -----------------------------------------------------------
     6. Валидация формы контактов
     ----------------------------------------------------------- */
  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    var success = document.getElementById('formSuccess');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setError(field, msg) {
      var wrap = field.closest('.form-field');
      var err = wrap ? wrap.querySelector('.field-error') : null;
      if (wrap) wrap.classList.toggle('has-error', !!msg);
      if (err) err.textContent = msg || '';
      return !msg;
    }

    function validate() {
      var ok = true;
      var name = form.elements['name'];
      var email = form.elements['email'];
      var subject = form.elements['subject'];
      var message = form.elements['message'];

      ok = setError(name, name.value.trim().length < 2 ? 'Пожалуйста, укажите имя (минимум 2 символа).' : '') && ok;
      ok = setError(email, !emailRe.test(email.value.trim()) ? 'Введите корректный адрес электронной почты.' : '') && ok;
      ok = setError(subject, !subject.value ? 'Выберите тему обращения.' : '') && ok;
      ok = setError(message, message.value.trim().length < 12 ? 'Сообщение слишком короткое (минимум 12 символов).' : '') && ok;
      return ok;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstErr = form.querySelector('.has-error input, .has-error select, .has-error textarea');
        if (firstErr) firstErr.focus();
        return;
      }
      var name = form.elements['name'].value.trim();
      if (success) {
        success.querySelector('.form-success__text').textContent =
          name + ', спасибо! Ваше обращение отправлено. Мы ответим в течение одного рабочего дня.';
        success.classList.add('is-shown');
        success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
      form.reset();
      form.querySelectorAll('.has-error').forEach(function (el) { el.classList.remove('has-error'); });
      form.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
    });

    // снимаем ошибку при вводе
    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        var wrap = field.closest('.form-field');
        if (wrap && wrap.classList.contains('has-error')) setError(field, '');
      });
    });
  }
  initContactForm();

  /* -----------------------------------------------------------
     7. Подписка на рассылку
     ----------------------------------------------------------- */
  function initNewsletter() {
    var form = document.getElementById('newsletterForm');
    if (!form) return;
    var msg = form.parentNode.querySelector('.form-msg');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var val = input.value.trim();
      if (!emailRe.test(val)) {
        if (msg) { msg.textContent = 'Введите корректный e-mail.'; msg.className = 'form-msg err'; }
        input.focus();
        return;
      }
      if (msg) {
        msg.textContent = 'Готово! Подтверждение отправлено на ' + val + '.';
        msg.className = 'form-msg ok';
      }
      form.reset();
    });
  }
  initNewsletter();

  /* -----------------------------------------------------------
     8. Изображения: обработка ошибок (градиентный фолбэк)
     ----------------------------------------------------------- */
  function initImages() {
    document.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.classList.add('is-broken');
        img.setAttribute('aria-hidden', 'true');
      });
      if (img.complete && img.naturalWidth === 0) {
        img.classList.add('is-broken');
      }
    });
  }
  initImages();

  /* -----------------------------------------------------------
     9. Кнопка «наверх»
     ----------------------------------------------------------- */
  function initToTop() {
    var btn = document.querySelector('.to-top');
    if (!btn) return;
    var onScroll = function () {
      btn.classList.toggle('is-shown', window.scrollY > 600);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }
  initToTop();

  /* -----------------------------------------------------------
     10. Текущий год в футере
     ----------------------------------------------------------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }
  initYear();

})();
