/* ============================================================
   «Вкус» — авторская кухня и рецепты
   Визуализация КБЖУ · конструктор блюда · валидация · анимации
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Утилиты ---------- */
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('is-visible'); }, 3200);
  }

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     ДАННЫЕ
     ============================================================ */

  var DISHES = {
    breakfast: [
      { id: 'b1', name: 'Сырники с вишней', desc: 'Творог 9%, томлёная вишня, мёд и хрустящая корочка. Классика, которую мы научили быть воздушной.', kcal: 340, protein: 24, fat: 14, carb: 32, time: 25, weight: 250, seed: 'vkus-syrniki' },
      { id: 'b2', name: 'Омлет с грибами', desc: 'Три яйца, шампиньоны, шпинат и козий сыр. Пышный омлет на топлёном масле.', kcal: 310, protein: 26, fat: 20, carb: 6, time: 20, weight: 280, seed: 'vkus-omlet' },
      { id: 'b3', name: 'Каша из киноа', desc: 'Киноа с печёной тыквой, грецким орехом и корицей. Долгая энергия без резких скачков сахара.', kcal: 380, protein: 12, fat: 9, carb: 62, time: 30, weight: 320, seed: 'vkus-kinoa' }
    ],
    main: [
      { id: 'm1', name: 'Говядина в красном вине', desc: 'Томлёная 90 минут говядина с корнеплодами, розмарин и каберне. Мясо тает, соус — бархат.', kcal: 520, protein: 38, fat: 32, carb: 18, time: 90, weight: 380, seed: 'vkus-govyadina' },
      { id: 'm2', name: 'Трюфельная паста', desc: 'Тальятелле с трюфельным кремом, пармезаном 24 месяца и жареной грушей.', kcal: 560, protein: 18, fat: 24, carb: 66, time: 40, weight: 350, seed: 'vkus-pasta' },
      { id: 'm3', name: 'Судак с пюре', desc: 'Филе судака sous-vide, пюре из цветной капусты и масло с петрушкой. Лёгкий ужин с характером.', kcal: 410, protein: 42, fat: 16, carb: 26, time: 45, weight: 340, seed: 'vkus-sudak' }
    ],
    soup: [
      { id: 's1', name: 'Тыквенный крем-суп', desc: 'Печёная тыква, кокосовое молоко, кешью и мускатный орех. Шёлковая текстура.', kcal: 290, protein: 9, fat: 14, carb: 30, time: 35, weight: 300, seed: 'vkus-soup1' },
      { id: 's2', name: 'Солянка по-купечески', desc: 'Три вида копчёностей, маслины, каперсы и долька лимона. Наваристая, как из русской печи.', kcal: 420, protein: 30, fat: 26, carb: 18, time: 70, weight: 400, seed: 'vkus-solyanka' },
      { id: 's3', name: 'Суп из белых грибов', desc: 'Лесной суп со сливками и гренками на закваске. Грибной вкус — честный и глубокий.', kcal: 260, protein: 14, fat: 12, carb: 20, time: 50, weight: 330, seed: 'vkus-soup2' }
    ],
    dessert: [
      { id: 'd1', name: 'Морковный торт', desc: 'Морковный бисквит, апельсиновые цукаты, крем из маскарпоне. Не слишком сладко.', kcal: 480, protein: 7, fat: 28, carb: 52, time: 140, weight: 180, seed: 'vkus-carrot' },
      { id: 'd2', name: 'Шоколадный фондан', desc: 'Тёплое сердце из расплавленного 70% шоколада, шарик мороженого и малина.', kcal: 430, protein: 8, fat: 22, carb: 50, time: 30, weight: 120, seed: 'vkus-fondan' },
      { id: 'd3', name: 'Панакота с манго', desc: 'Кремовая панакота на ванили и кули из спелого манго. Лёгкий финал обеда.', kcal: 350, protein: 6, fat: 20, carb: 36, time: 120, weight: 160, seed: 'vkus-panakota' }
    ],
    drink: [
      { id: 'dr1', name: 'Смузи «Осень»', desc: 'Облепиха, яблоко, морковь и имбирь. Яркая порция витаминов с трогательной кислинкой.', kcal: 210, protein: 4, fat: 3, carb: 40, time: 10, weight: 300, seed: 'vkus-smoothy' },
      { id: 'dr2', name: 'Имбирный эль', desc: 'Авторский эль с имбирём, лимоном и ванилью, сваренный на кухне. Освежает без грамма алкоголя.', kcal: 120, protein: 0, fat: 0, carb: 28, time: 20, weight: 330, seed: 'vkus-ale' },
      { id: 'dr3', name: 'Какао на кокосе', desc: 'Какао-бобы, кокосовое молоко и щепотка морской соли. Тёплое начало выходных.', kcal: 280, protein: 8, fat: 14, carb: 30, time: 15, weight: 250, seed: 'vkus-cacao' }
    ]
  };

  var CATS = [
    { key: 'breakfast', label: 'Завтраки' },
    { key: 'main', label: 'Основные' },
    { key: 'soup', label: 'Супы' },
    { key: 'dessert', label: 'Десерты' },
    { key: 'drink', label: 'Напитки' }
  ];

  var INGREDIENTS = [
    { id: 'i1', name: 'Киноа', kcal: 105, protein: 4, fat: 2, carb: 18, weight: 60,  on: true  },
    { id: 'i2', name: 'Грудка гриль', kcal: 120, protein: 24, fat: 2, carb: 0,  weight: 80,  on: true  },
    { id: 'i3', name: 'Авокадо', kcal: 85, protein: 1, fat: 8, carb: 4,  weight: 50,  on: true  },
    { id: 'i4', name: 'Огурец', kcal: 10, protein: 1, fat: 0, carb: 2,  weight: 60,  on: true  },
    { id: 'i5', name: 'Черри', kcal: 9, protein: 0, fat: 0, carb: 2,  weight: 50,  on: true  },
    { id: 'i6', name: 'Кукуруза', kcal: 40, protein: 2, fat: 0, carb: 8,  weight: 40,  on: false },
    { id: 'i7', name: 'Кешью', kcal: 110, protein: 4, fat: 9, carb: 6,  weight: 20,  on: false },
    { id: 'i8', name: 'Хумус', kcal: 70, protein: 3, fat: 4, carb: 5,  weight: 30,  on: false },
    { id: 'i9', name: 'Соус тахини', kcal: 120, protein: 3, fat: 10, carb: 4,  weight: 20, on: true  }
  ];

  var REVIEWS = [
    { name: 'Анна Ковалёва', date: '14 сентября 2026', stars: 5, seed: 'review-anna', text: 'Сырники с вишней — лучший завтрак в городе, в этом нет сомнений. А когда в меню видишь живую диаграмму КБЖУ, понимаешь: здесь еду разбирают на молекулы, чтобы она стала вкуснее.' },
    { name: 'Дмитрий Соколов', date: '30 августа 2026', stars: 5, seed: 'review-dmitry', text: 'Собирал боул в конструкторе и до последнего грамма знал, что ем. Шеф подсказал баланс белков, всё сошлось с заявленными калориями. Так прозрачно мы ещё не ели.' },
    { name: 'Елена Морозова', date: '11 августа 2026', stars: 4, seed: 'review-elena', text: 'Томлёная говядина в вине — вне конкуренции. Бронь подтвердили через пять минут, столик ждал с открыткой от шефа. Вернёмся всей семьёй.' },
    { name: 'Игорь Смирнов', date: '27 июля 2026', stars: 5, seed: 'review-igor', text: 'Редкая честность: состав, граммовки и питательная ценность — на открытой странице. Еда при этом комфортно-сложная. Новый стандарт гостеприимства.' }
  ];

  /* ============================================================
     DONUT-ДИАГРАММА (canvas, 2D)
     ============================================================ */
  function Donut(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lineWidth = opts.lineWidth || 26;
    this.holeRatio = opts.holeRatio || 0.62;
    this.holeColor = opts.holeColor || cssVar('--cream') || '#fbf7ef';
    this.onKcal = opts.onKcal || function () {};
    this.cur = { protein: 0, fat: 0, carb: 0, kcal: 0 };
    this.target = { protein: 0, fat: 0, carb: 0, kcal: 0 };
    this.anim = null;
    this._setup();
    this.draw(0);
  }

  Donut.prototype._setup = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.baseW = this.canvas.width;
    this.baseH = this.canvas.height;
    this.canvas.width = this.baseW * dpr;
    this.canvas.height = this.baseH * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  Donut.prototype.set = function (data) {
    this.target = {
      protein: data.protein || 0,
      fat: data.fat || 0,
      carb: data.carb || 0,
      kcal: data.kcal || 0
    };
    if (this.anim) cancelAnimationFrame(this.anim);
    var self = this;
    var start = {
      protein: this.cur.protein, fat: this.cur.fat, carb: this.cur.carb, kcal: this.cur.kcal
    };
    var dur = prefersReduced.matches ? 1 : 720;
    var t0 = performance.now();

    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function step(now) {
      var p = Math.min((now - t0) / dur, 1);
      var e = ease(p);
      self.cur.protein = start.protein + (self.target.protein - start.protein) * e;
      self.cur.fat = start.fat + (self.target.fat - start.fat) * e;
      self.cur.carb = start.carb + (self.target.carb - start.carb) * e;
      self.cur.kcal = Math.round(start.kcal + (self.target.kcal - start.kcal) * e);
      self.draw(self.cur.protein + self.cur.fat + self.cur.carb);
      self.onKcal(self.cur.kcal);
      if (p < 1) self.anim = requestAnimationFrame(step);
      else self.anim = null;
    }
    this.anim = requestAnimationFrame(step);
  };

  Donut.prototype.draw = function (sum) {
    var ctx = this.ctx;
    var w = this.baseW, h = this.baseH;
    var cx = w / 2, cy = h / 2;
    var r = Math.min(w, h) / 2 - this.lineWidth / 2;

    ctx.clearRect(0, 0, w, h);

    /* фон-трек */
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = cssVar('--line') || 'rgba(36,26,18,0.16)';
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'butt';
    ctx.stroke();

    /* сегменты Б/Ж/У */
    var segs = [
      { v: this.cur.protein, color: cssVar('--protein') },
      { v: this.cur.fat, color: cssVar('--fat') },
      { v: this.cur.carb, color: cssVar('--carb') }
    ];

    if (sum > 0) {
      var gap = 0.05;
      var start = -Math.PI / 2;
      var i;
      for (i = 0; i < segs.length; i++) {
        var s = segs[i];
        if (s.v <= 0) { continue; }
        var frac = s.v / sum;
        var ang = Math.max(frac * Math.PI * 2 - gap, 0.02);
        ctx.beginPath();
        ctx.arc(cx, cy, r, start + gap / 2, start + gap / 2 + ang);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = this.lineWidth;
        ctx.lineCap = 'butt';
        ctx.stroke();
        start += Math.PI * 2 * frac;
      }
    }

    /* центральное отверстие */
    ctx.beginPath();
    ctx.arc(cx, cy, r * this.holeRatio, 0, Math.PI * 2);
    ctx.fillStyle = this.holeColor;
    ctx.fill();
  };

  /* ============================================================
     МЕНЮ: табы + карточки
     ============================================================ */
  var dishesWrap = $('#dishes');
  var activeCat = 'breakfast';
  var selectedDish = null;

  function macroHTML(d) {
    return '<span style="--c:var(--protein)"><b>' + d.protein + '</b> Б</span>' +
           '<span style="--c:var(--fat)"><b>' + d.fat + '</b> Ж</span>' +
           '<span style="--c:var(--carb)"><b>' + d.carb + '</b> У</span>';
  }

  function renderDishes() {
    var list = DISHES[activeCat];
    var html = '';
    list.forEach(function (d, i) {
      html +=
        '<article class="dish' + (selectedDish && selectedDish.id === d.id ? ' is-selected' : '') + '" ' +
        'role="button" tabindex="0" data-id="' + d.id + '" aria-label="' + d.name + '. Калорийность ' + d.kcal + ' килокалорий. Нажмите, чтобы увидеть КБЖУ" ' +
        'style="animation-delay:' + (i * 70) + 'ms">' +
          '<div class="dish__media">' +
            '<span class="dish__kcal-badge">' + d.kcal + ' ккал</span>' +
            '<img class="dish__img" src="assets/img/dish-' + d.id + '.jpg" alt="' + d.name + '" loading="lazy" width="600" height="450">' +
          '</div>' +
          '<div class="dish__body">' +
            '<h3 class="dish__name">' + d.name + '</h3>' +
            '<p class="dish__desc">' + d.desc + '</p>' +
            '<div class="dish__meta">' +
              '<span>⏱ <b>' + d.time + '</b> мин</span>' +
              '<span>🍽 <b>' + d.weight + '</b> г</span>' +
            '</div>' +
            '<div class="dish__macros">' + macroHTML(d) + '</div>' +
          '</div>' +
        '</article>';
    });
    dishesWrap.innerHTML = html;
    dishesWrap.dispatchEvent(new CustomEvent('dishes:rendered'));

    if (!selectedDish) {
      selectDish(list[0], false);
    } else {
      /* если выбранное блюдо было из другой категории — не переключаем,
         но подсветка останется прежней; наоборот — подсветим */
      var stillHere = list.some(function (d) { return d.id === selectedDish.id; });
      if (!stillHere) selectDish(list[0], false);
    }
  }

  function bindTabs() {
    var tabs = $$('.tab');
    function activate(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      activeCat = tab.getAttribute('data-cat');
      var panel = $('#dishes');
      if (panel && tab.id) panel.setAttribute('aria-labelledby', tab.id);
      renderDishes();
      tab.focus();
    }
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { activate(tab); });
      tab.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(tab);
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); activate(next); }
      });
    });
  }

  function selectDish(d, scrollTo) {
    if (!d) return;
    selectedDish = d;

    /* визуализация */
    nutritionCurrent = { protein: d.protein, fat: d.fat, carb: d.carb, kcal: d.kcal };

    $('#donutDishName').textContent = d.name;
    $('#donutDishDesc').textContent = d.desc;

    var sum = d.protein + d.fat + d.carb;
    var pct = function (v) { return sum ? Math.round(v / sum * 100) : 0; };
    setNutritionBars({ protein: pct(d.protein), fat: pct(d.fat), carb: pct(d.carb) });

    if (nutritionSeen) {
      donut.set(nutritionCurrent);
      $('#valProtein').textContent = d.protein;
      $('#valFat').textContent = d.fat;
      $('#valCarb').textContent = d.carb;
    }

    $('#donutMeta').innerHTML =
      'Порция <span>' + d.weight + ' г</span>' +
      'Готовим <span>' + d.time + ' мин</span>' +
      'Белки <span>' + pct(d.protein) + '%</span>' +
      'Жиры <span>' + pct(d.fat) + '%</span>' +
      'Углеводы <span>' + pct(d.carb) + '%</span>';

    /* подсветка карточек */
    $$('.dish').forEach(function (el) {
      el.classList.toggle('is-selected', el.getAttribute('data-id') === d.id);
    });

    if (scrollTo && window.innerWidth < 940) {
      $('#nutrition').scrollIntoView({ behavior: prefersReduced.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function bindDishes() {
    dishesWrap.addEventListener('click', function (e) {
      var card = e.target.closest('.dish');
      if (!card) return;
      var d = findByDishId(card.getAttribute('data-id'));
      if (d) selectDish(d, true);
    });
    dishesWrap.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.dish');
      if (!card) return;
      e.preventDefault();
      var d = findByDishId(card.getAttribute('data-id'));
      if (d) selectDish(d, true);
    });
  }

  function findByDishId(id) {
    var found = null;
    CATS.forEach(function (c) {
      DISHES[c.key].forEach(function (d) {
        if (d.id === id) found = d;
      });
    });
    return found;
  }

  /* ============================================================
     КОНСТРУКТОР БЛЮДА
     ============================================================ */
  var builderList = $('#builderList');
  var state = {};

  function initBuilderState() {
    INGREDIENTS.forEach(function (ing) {
      state[ing.id] = { checked: ing.on, mult: 1 };
    });
  }

  function renderBuilder() {
    var html = '';
    INGREDIENTS.forEach(function (ing) {
      html +=
        '<article class="ingr">' +
          '<input type="checkbox" id="ingr-' + ing.id + '"' + (state[ing.id].checked ? ' checked' : '') + '>' +
          '<label class="ingr__check" for="ingr-' + ing.id + '" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>' +
          '</label>' +
          '<div class="ingr__info">' +
            '<span class="ingr__name">' + ing.name + '</span>' +
            '<span class="ingr__kcal">' + ing.kcal + ' ккал / порция</span>' +
          '</div>' +
          '<div class="ingr__input">' +
            '<label for="ingr-' + ing.id + '-p"' + (state[ing.id].checked ? '' : ' style="opacity:.4"') + '>Порции</label>' +
            '<input type="range" min="0.5" max="3" step="0.5" value="' + state[ing.id].mult + '"' +
              ' id="ingr-' + ing.id + '-p"' + (state[ing.id].checked ? '' : ' disabled') + '>' +
            '<span class="ingr__weight" id="ingr-' + ing.id + '-w">' + Math.round(ing.weight * state[ing.id].mult) + ' г</span>' +
          '</div>' +
        '</article>';
    });
    builderList.innerHTML = html;

    $$('.ingr input[type="checkbox"]', builderList).forEach(function (chk) {
      chk.addEventListener('change', onIngredientChange);
    });
    $$('.ingr input[type="range"]', builderList).forEach(function (rng) {
      rng.addEventListener('input', onIngredientChange);
    });
    recomputeBuilder();
  }

  function onIngredientChange() {
    var id = /^ingr-([a-z0-9]+)(?:-p)?$/.exec(this.id);
    if (!id) return;
    var ingKey = id[1];

    if (this.type === 'checkbox') {
      state[ingKey].checked = this.checked;
      var row = this.closest('.ingr');
      var rng = $('#ingr-' + ingKey + '-p', row);
      var lbl = $('.ingr__input label', row);
      var wgt = $('#ingr-' + ingKey + '-w', row);
      rng.disabled = !this.checked;
      lbl.style.opacity = this.checked ? '' : '.4';
      if (this.checked) rng.value = state[ingKey].mult;
      wgt.textContent = Math.round(INGREDIENTS.find(function (i) { return i.id === ingKey; }).weight * parseFloat(rng.value)) + ' г';
    } else {
      state[ingKey].mult = parseFloat(this.value);
      var weightEl = $('#ingr-' + ingKey + '-w');
      var ing = INGREDIENTS.find(function (i) { return i.id === ingKey; });
      if (weightEl) weightEl.textContent = Math.round(ing.weight * state[ingKey].mult) + ' г';
    }
    recomputeBuilder();
  }

  function recomputeBuilder() {
    var kcal = 0, p = 0, f = 0, c = 0, w = 0;
    INGREDIENTS.forEach(function (ing) {
      var st = state[ing.id];
      if (!st.checked) return;
      var m = st.mult;
      kcal += ing.kcal * m;
      p += ing.protein * m;
      f += ing.fat * m;
      c += ing.carb * m;
      w += ing.weight * m;
    });
    kcal = Math.round(kcal);
    p = Math.round(p * 10) / 10;
    f = Math.round(f * 10) / 10;
    c = Math.round(c * 10) / 10;

    builderDonut.set({ protein: p, fat: f, carb: c, kcal: kcal });
    $('#builderKcal').textContent = kcal;
    $('#bProtein').textContent = p;
    $('#bFat').textContent = f;
    $('#bCarb').textContent = c;
    $('#bWeight').textContent = Math.round(w);
    return { kcal: kcal, weight: Math.round(w) };
  }

  function bindBuilder() {
    $('#addToDay').addEventListener('click', function () {
      var res = recomputeBuilder();
      if (res.kcal <= 0) {
        $('#builderNote').textContent = 'Добавьте хотя бы один ингредиент.';
        return;
      }
      $('#builderNote').textContent = 'Блюдо добавлено в меню дня.';
      addDayChip(res);
      toast('Готово! Блюдо добавлено в меню дня.');
    });
  }

  function addDayChip(res) {
    var dayList = $('#dayList');
    var chip = document.createElement('span');
    chip.className = 'day-chip';
    chip.setAttribute('role', 'listitem');
    chip.innerHTML = 'Боул дня <b>' + res.kcal + ' ккал</b>' +
      '<button type="button" aria-label="Убрать из меню дня">×</button>';
    chip.querySelector('button').addEventListener('click', function () {
      chip.remove();
    });
    dayList.appendChild(chip);
  }

  /* ============================================================
     ОТЗЫВЫ (слайдер)
     ============================================================ */
  var revIndex = 0;
  var revTimer = null;

  function renderReviews() {
    var track = $('#revTrack');
    var dots = $('#revDots');
    var html = '';
    REVIEWS.forEach(function (r, i) {
      var stars = '';
      for (var j = 0; j < 5; j++) { stars += (j < r.stars) ? '★' : '☆'; }
      html +=
        '<figure class="review">' +
          '<div class="review__stars" role="img" aria-label="Оценка ' + r.stars + ' из 5">' + stars + '</div>' +
          '<blockquote class="review__text">«' + r.text + '»</blockquote>' +
          '<figcaption class="review__author">' +
            '<img class="review__avatar" src="assets/img/review' + (i + 1) + '.jpg" alt="" width="128" height="128" loading="lazy">' +
            '<span><span class="review__name">' + r.name + '</span><span class="review__date">' + r.date + '</span></span>' +
          '</figcaption>' +
        '</figure>';
    });
    track.innerHTML = html;

    var dotHtml = '';
    REVIEWS.forEach(function (r, i) {
      dotHtml += '<button type="button" class="reviews__dot' + (i === 0 ? ' is-active' : '') + '" data-i="' + i + '" aria-label="Отзыв ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>';
    });
    dots.innerHTML = dotHtml;
    $$('.reviews__dot', dots).forEach(function (dot, i) {
      dot.addEventListener('click', function () { moveToReview(i); restartAutoplay(); });
    });
    moveToReview(0);
  }

  function moveToReview(i) {
    revIndex = (i + REVIEWS.length) % REVIEWS.length;
    $('#revTrack').style.transform = 'translateX(' + (-revIndex * 100) + '%)';
    var dots = $$('.reviews__dot');
    dots.forEach(function (d, j) {
      var on = j === revIndex;
      d.classList.toggle('is-active', on);
      if (on) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
  }

  function startAutoplay() {
    if (prefersReduced.matches) return;
    stopAutoplay();
    revTimer = setInterval(function () { moveToReview(revIndex + 1); }, 6000);
  }
  function stopAutoplay() {
    if (revTimer) { clearInterval(revTimer); revTimer = null; }
  }
  function restartAutoplay() { startAutoplay(); }

  function bindReviewSwipe() {
    var viewport = $('.reviews__viewport');
    var startX = 0, startY = 0, swiping = false;

    viewport.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      startX = t.clientX; startY = t.clientY; swiping = true;
      stopAutoplay();
    }, { passive: true });

    viewport.addEventListener('touchend', function (e) {
      if (!swiping) return;
      swiping = false;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        moveToReview(revIndex + (dx < 0 ? 1 : -1));
        restartAutoplay();
      }
    }, { passive: true });

    var lastWheel = 0;
    viewport.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) < 40 || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      var now = Date.now();
      if (now - lastWheel < 200) return;
      lastWheel = now;
      e.preventDefault();
      moveToReview(revIndex + (e.deltaX > 0 ? 1 : -1));
      restartAutoplay();
    }, { passive: false });
  }

  function bindReviewVisibility() {
    var section = $('#reviews');
    if (!section || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) restartAutoplay(); else stopAutoplay();
      });
    }, { threshold: 0.2 });
    io.observe(section);
  }

  /* ============================================================
     БРОНИРОВАНИЕ: валидация
     ============================================================ */
  function formatPhone(v) {
    var d = v.replace(/\D/g, '').replace(/^7/, '');
    var out = '+7';
    if (d.length) out += ' (' + d.slice(0, Math.min(3, d.length));
    if (d.length > 3) out += ')';
    if (d.length > 3) out += ' ' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 8);
    if (d.length > 8) out += '-' + d.slice(8, 10);
    return out;
  }

  function setFieldState(input, ok, msg) {
    var wrap = input.closest('.field');
    var err = wrap.querySelector('.field__error');
    wrap.classList.toggle('field--invalid', !ok);
    wrap.classList.toggle('field--valid', ok);
    if (err) err.textContent = ok ? '' : msg;
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }

  function bindBooking() {
    var form = $('#bookingForm');
    var phone = $('#bkPhone');

    phone.addEventListener('input', function () {
      phone.value = formatPhone(phone.value);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;

      var name = $('#bkName');
      ok = setFieldState(name, name.value.trim().length >= 2, 'Укажите имя (от 2 символов)') && ok;

      var phRaw = phone.value.replace(/\D/g, '');
      var phOk = phRaw.length >= 11 && phRaw.indexOf('7') === 0;
      ok = setFieldState(phone, phOk, 'Введите номер в формате +7 (999) 123-45-67') && ok;

      var date = $('#bkDate');
      var today = new Date();
      var todayStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
      ok = setFieldState(date, date.value && date.value >= todayStr, 'Выберите сегодняшнюю или будущую дату') && ok;

      var time = $('#bkTime');
      var tOk = false;
      if (time.value) {
        var hm = time.value.split(':');
        var mins = parseInt(hm[0], 10) * 60 + parseInt(hm[1], 10);
        tOk = mins >= 9 * 60 && mins <= 23 * 60;
      }
      ok = setFieldState(time, tOk, 'Мы работаем с 09:00 до 23:00') && ok;

      var guests = $('#bkGuests');
      ok = setFieldState(guests, guests.value !== '', 'Выберите число гостей') && ok;

      if (!ok) {
        toast('Проверьте выделенные поля в форме.');
        return;
      }

      showBookingSuccess({
        name: name.value.trim(),
        date: date.value,
        time: time.value,
        guests: guests.value
      });
    });

    /* снятие ошибки при вводе */
    $$('input, select', form).forEach(function (el) {
      el.addEventListener('input', function () {
        var wrap = el.closest('.field');
        wrap.classList.remove('field--invalid');
        var err = wrap.querySelector('.field__error');
        if (err) err.textContent = '';
      });
    });
  }

  function showBookingSuccess(data) {
    var form = $('#bookingForm');
    var russianDate;
    try {
      russianDate = new Date(data.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    } catch (err) { russianDate = data.date; }
    var n = parseInt(data.guests, 10);
    var guestWord = data.guests === '1' ? 'гость' : (n >= 2 && n <= 4 ? 'гостя' : 'гостей');
    form.innerHTML =
      '<div class="booking__success" role="status">' +
        '<div class="booking__success-icon" aria-hidden="true">✓</div>' +
        '<h3>Столик забронирован!</h3>' +
        '<p>Спасибо, <b>' + data.name + '</b>! Ждём вас <b>' + russianDate + '</b> в <b>' + data.time + '</b> на <b>' + data.guests + ' ' + guestWord + '</b>.</p>' +
        '<p class="booking__success-note">Мы отправим SMS-подтверждение на ваш номер.</p>' +
        '<button type="button" class="btn btn--ghost" id="bkAgain">Забронировать ещё</button>' +
      '</div>';
    $('#bkAgain').addEventListener('click', function () { location.reload(); });
  }

  /* ============================================================
     ПОДПИСКА
     ============================================================ */
  function bindSubscribe() {
    var form = $('#subscribeForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#subEmail');
      var msg = $('#subMsg');
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      if (!ok) {
        msg.textContent = 'Проверьте адрес электронной почты.';
        email.focus();
        return;
      }
      msg.textContent = 'Готово! Первый рецепт придёт в ближайшую пятницу.';
      email.value = '';
    });
  }

  /* ============================================================
     ШАПКА, БУРГЕР, СКРОЛЛСПАЙ
     ============================================================ */
  function bindHeader() {
    var header = $('#header');
    var burger = $('#burger');
    var nav = $('#nav');

    function onScroll() {
      header.classList.toggle('is-scrolled', window.scrollY > 30);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function toggleMenu(force) {
      var open = force !== undefined ? force : !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      document.body.style.overflow = open ? 'hidden' : '';
    }

    burger.addEventListener('click', function () { toggleMenu(); });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) toggleMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') toggleMenu(false);
    });
  }

  function bindScrollSpy() {
    var links = $$('.nav__link');
    var map = {};
    links.forEach(function (l) {
      var id = l.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = { link: l, sec: sec };
    });

    var onScroll = function () {
      var pos = window.scrollY + window.innerHeight * 0.35;
      var current = null;
      var ids = Object.keys(map);
      ids.forEach(function (id) {
        var r = map[id].sec.getBoundingClientRect();
        var secTop = r.top + window.scrollY;
        if (pos >= secTop) current = id;
      });
      if (!current) current = 'hero';
      links.forEach(function (l) {
        var href = l.getAttribute('href').slice(1);
        l.classList.toggle('is-active', href === current);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     REVEAL + СЧЁТЧИКИ
     ============================================================ */
  function bindReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  }

  function bindCounters() {
    var els = $$('[data-counter]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.textContent = el.getAttribute('data-counter'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        animateNumber(el, parseInt(el.getAttribute('data-counter'), 10));
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  function animateNumber(el, target) {
    var dur = prefersReduced.matches ? 1 : 1400;
    var t0 = performance.now();
    function step(now) {
      var p = Math.min((now - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ============================================================
     HERO: частицы + параллакс
     ============================================================ */
  function initHeroParticles() {
    var canvas = $('#heroParticles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var running = !prefersReduced.matches;

    function resize() {
      var w = canvas.parentElement.clientWidth;
      var h = canvas.parentElement.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles(w, h);
    }

    function seedParticles(w, h) {
      var colors = [cssVar('--ink'), cssVar('--terracotta'), cssVar('--olive'), cssVar('--mustard')];
      var count = Math.round(clamp((w * h) / 32000, 18, 42));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.9 + Math.random() * 1.7,
          c: colors[i % colors.length],
          vx: (Math.random() - 0.5) * 0.1,
          vy: -(0.04 + Math.random() * 0.14),
          a: 0.05 + Math.random() * 0.1,
          ph: Math.random() * Math.PI * 2
        });
      }
    }

    function tick() {
      var w = canvas.width / dpr, h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx + Math.sin(p.ph) * 0.14;
        p.y += p.vy;
        p.ph += 0.01;
        if (p.y < -10 || p.x > w + 10 || p.x < -10) {
          p.x = Math.random() * w;
          p.y = h + 10;
        }
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize);
    resize();
    if (running) tick();
  }

  function initHeroParallax() {
    var visual = $('.hero__visual');
    var content = $('.hero__content');
    if (!visual || prefersReduced.matches) return;

    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      var rate = parseFloat(visual.getAttribute('data-parallax') || '0.06');
      visual.style.transform = 'translateY(' + (y * rate) + 'px)';
      content.style.transform = 'translateY(' + (y * rate * 0.4) + 'px)';
    }, { passive: true });
  }

  /* ============================================================
     ИНИЦИАЛИЗАЦИЯ
     ============================================================ */
  var donut;
  var builderDonut;
  var nutritionSeen = false;
  var nutritionCurrent = null;

  function setNutritionBars(pcts) {
    $$('#donutLegend .legend__item').forEach(function (item) {
      var key = item.getAttribute('data-key');
      var bar = item.querySelector('.legend__bar i');
      if (bar && pcts[key] != null) bar.style.setProperty('--p', pcts[key]);
    });
  }

  function bindNutritionReveal() {
    var section = $('#nutrition');
    if (!section || !donut) return;

    function play() {
      if (nutritionSeen) return;
      nutritionSeen = true;
      section.classList.add('is-inview');
      if (nutritionCurrent) {
        donut.set(nutritionCurrent);
        animateNumber($('#valProtein'), nutritionCurrent.protein);
        animateNumber($('#valFat'), nutritionCurrent.fat);
        animateNumber($('#valCarb'), nutritionCurrent.carb);
      }
    }

    if (!('IntersectionObserver' in window)) { play(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { play(); io.disconnect(); }
      });
    }, { threshold: 0.3 });
    io.observe(section);
  }

  function init() {
    initBuilderState();

    donut = new Donut($('#donut'), {
      lineWidth: 30,
      holeRatio: 0.68,
      holeColor: cssVar('--cream') || '#fbf7ef',
      onKcal: function (v) { $('#donutKcal').textContent = v; }
    });

    builderDonut = new Donut($('#builderDonut'), {
      lineWidth: 26,
      holeRatio: 0.66,
      holeColor: cssVar('--cream') || '#fbf7ef',
      onKcal: function (v) { $('#builderKcal').textContent = v; }
    });

    bindTabs();
    bindDishes();
    renderDishes();

    renderBuilder();
    bindBuilder();

    renderReviews();
    startAutoplay();
    var reviews = $('.reviews');
    reviews.addEventListener('mouseenter', stopAutoplay);
    reviews.addEventListener('mouseleave', restartAutoplay);
    $('#revPrev').addEventListener('click', function () { moveToReview(revIndex - 1); restartAutoplay(); });
    $('#revNext').addEventListener('click', function () { moveToReview(revIndex + 1); restartAutoplay(); });
    bindReviewSwipe();
    bindReviewVisibility();

    bindBooking();
    bindSubscribe();
    bindHeader();
    bindScrollSpy();
    bindReveal();
    bindCounters();
    bindNutritionReveal();
    initHeroParticles();
    initHeroParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();