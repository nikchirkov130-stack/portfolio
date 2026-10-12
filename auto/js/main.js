/* ============================================================
   МОТОР — общий скрипт + логика конфигуратора
   Vanilla JS, без зависимостей. Работает по file:// и на GH Pages.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Утилиты ---------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const rub = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });

  const num = new Intl.NumberFormat("ru-RU");
  const fmtPrice = (v) => rub.format(v);
  const fmtNum = (v) => num.format(v);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     ДАННЫЕ МОДЕЛЕЙ (единый источник)
     ============================================================ */
  const MODELS = [
    {
      id: "aero-s", name: "Aero S", type: "electro", typeLabel: "Электро",
      cls: "sedan", clsLabel: "Седан", svg: "sedan", badge: "Новинка",
      price: 4290000, power: 544, accel: 3.9, range: 620, consumption: 15.8, unit: "кВт·ч/100",
      desc: "Флагманский электроседан с аэродинамикой 0,21 и запасом хода до 620 км.",
      img: "assets/img/models/aero-s.webp",
    },
    {
      id: "terra-x", name: "Terra X", type: "electro", typeLabel: "Электро",
      cls: "crossover", clsLabel: "Кроссовер", svg: "crossover",
      price: 5150000, power: 612, accel: 4.4, range: 560, consumption: 18.2, unit: "кВт·ч/100",
      desc: "Полноприводный кроссовер с адаптивной пневмоподвеской и панорамной крышей.",
      img: "assets/img/models/terra-x.webp",
    },
    {
      id: "volta-gt", name: "Volta GT", type: "electro", typeLabel: "Электро",
      cls: "sport", clsLabel: "Спорт", svg: "sport", badge: "Топ",
      price: 7850000, power: 918, accel: 2.6, range: 540, consumption: 21.5, unit: "кВт·ч/100",
      desc: "Спорткар-электро с тремя моторами, векторизацией тяги и разгоном 0–100 за 2,6 с.",
      img: "assets/img/models/volta-gt.webp",
    },
    {
      id: "hybrid-one", name: "Hybrid One", type: "hybrid", typeLabel: "Гибрид",
      cls: "sedan", clsLabel: "Седан", svg: "sedan",
      price: 3490000, power: 386, accel: 5.4, range: 980, consumption: 5.6, unit: "л/100",
      desc: "Гибридный седан: 62 км на электротяге и общий пробег почти 1000 км без дозаправки.",
      img: "assets/img/models/hybrid-one.webp",
    },
    {
      id: "ranger-v6", name: "Ranger V6", type: "ice", typeLabel: "ДВС",
      cls: "crossover", clsLabel: "Кроссовер", svg: "crossover",
      price: 4050000, power: 462, accel: 5.1, range: 760, consumption: 9.8, unit: "л/100",
      desc: "Кроссовер с битурбо V6, полным приводом и внедорожным пакетом Terrain.",
      img: "assets/img/models/ranger-v6.webp",
    },
    {
      id: "nova-ev", name: "Nova EV", type: "electro", typeLabel: "Электро",
      cls: "sedan", clsLabel: "Седан", svg: "sedan", badge: "Хит",
      price: 3990000, power: 420, accel: 4.8, range: 585, consumption: 14.9, unit: "кВт·ч/100",
      desc: "Доступный электромобиль для города: компактный, тихий и экономичный.",
      img: "assets/img/models/nova-ev.webp",
    },
  ];
  const byId = (id) => MODELS.filter((m) => m.id === id)[0];

  /* ============================================================
     ОБЩИЕ КОМПОНЕНТЫ
     ============================================================ */

  /* Шапка при скролле */
  function initHeader() {
    const header = $(".site-header");
    if (!header) return;
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Мобильное меню */
  function initNav() {
    const burger = $(".burger");
    const links = $(".nav__links");
    if (!burger || !links) return;
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      links.classList.toggle("open", !open);
    });
    $$("a", links).forEach((a) =>
      a.addEventListener("click", () => {
        burger.setAttribute("aria-expanded", "false");
        links.classList.remove("open");
      })
    );
  }

  /* Reveal-анимации */
  function initReveal() {
    const items = $$("[data-reveal]");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    items.forEach((el) => io.observe(el));
  }

  /* Счётчики */
  function initCounters() {
    const els = $$("[data-count]");
    if (!els.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || "0", 10);
      const suffixEl = el.querySelector(".suffix");
      const suffixText = suffixEl ? suffixEl.textContent : "";
      const setVal = (v) => {
        const s = v.toLocaleString("ru-RU", {
          minimumFractionDigits: dec,
          maximumFractionDigits: dec,
        });
        el.innerHTML = s + (suffixText ? '<span class="suffix">' + suffixText + "</span>" : "");
      };
      if (reduceMotion) { setVal(target); return; }
      const dur = 1600;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(run);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* Простые табы */
  function initTabs() {
    $$("[data-tabs]").forEach((group) => {
      const tabs = $$("[role=tab]", group);
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          tabs.forEach((t) => {
            t.setAttribute("aria-selected", "false");
            t.tabIndex = -1;
          });
          tab.setAttribute("aria-selected", "true");
          tab.tabIndex = 0;
          const panel = $("#" + tab.getAttribute("aria-controls"));
          if (!panel) return;
          $$("[role=tabpanel]", panel.parentNode).forEach((p) => (p.hidden = true));
          panel.hidden = false;
        });
      });
    });
  }

  /* Формы (тест-драйв, обратная связь) */
  function initForms() {
    $$("form[data-form]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        const ok = $(".form-success", form);
        if (ok) ok.classList.add("show");
        form.reset();
        if (ok)
          setTimeout(() => ok.classList.remove("show"), 6000);
      });
    });
  }

  /* ============================================================
     СТРАНИЦА: МОДЕЛЬНЫЙ РЯД
     ============================================================ */
  function initModels() {
    const grid = $("#modelsGrid");
    if (!grid) return;

    // карточки
    grid.innerHTML = MODELS.map(function (m, i) {
      return (
        '<article class="card" data-reveal data-delay="' + ((i % 3) + 1) + '" data-type="' + m.type + '" data-class="' + m.cls + '">' +
        '<div class="card__media">' +
        (m.badge ? '<span class="card__tag' + (m.badge === "Топ" ? " card__tag--red" : "") + '">' + m.badge + "</span>" : "") +
        '<img class="card__img" src="' + m.img + '" alt="МОТОР ' + m.name + ' — ' + m.clsLabel + '" loading="lazy" decoding="async">' +
        "</div>" +
        '<div class="card__body">' +
        '<div class="card__title"><h3>' + m.name + '</h3><span class="card__price">от ' + fmtPrice(m.price) + "</span></div>" +
        '<p class="card__desc">' + m.desc + "</p>" +
        '<div class="spec-list">' +
        '<div><span class="spec-ico">⚡</span> <b>' + m.power + "</b> л.с.</div>" +
        '<div><span class="spec-ico">⏱</span> <b>' + m.accel + "</b> с · 0–100</div>" +
        '<div><span class="spec-ico">🔋</span> <b>' + fmtNum(m.range) + "</b> км</div>" +
        '<div><span class="spec-ico">📊</span> <b>' + m.consumption + "</b> " + m.unit + "</div>" +
        "</div>" +
        '<div class="card__actions">' +
        '<a class="btn" href="configurator.html?model=' + m.id + '">Настроить</a>' +
        '<a class="btn btn--ghost" href="index.html#testdrive">Тест-драйв</a>' +
        "</div></div></article>"
      );
    }).join("");

    // фильтры
    const state = { type: "all", cls: "all" };
    const countEl = $("#filterCount");
    function apply() {
      let visible = 0;
      $$(".card", grid).forEach((card) => {
        const ok =
          (state.type === "all" || card.dataset.type === state.type) &&
          (state.cls === "all" || card.dataset.class === state.cls);
        card.style.display = ok ? "" : "none";
        if (ok) visible++;
      });
      if (countEl) countEl.innerHTML = "Найдено: <b>" + visible + "</b> из " + MODELS.length;
      const empty = $("#modelsEmpty");
      if (empty) empty.hidden = visible !== 0;
    }
    $$(".chip[data-filter]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const field = chip.dataset.field;
        state[field] = chip.dataset.filter;
        $$('.chip[data-field="' + field + '"]').forEach((c) =>
          c.setAttribute("aria-pressed", String(c === chip))
        );
        apply();
      });
    });
    const resetFilters = $("[data-reset-filters]");
    if (resetFilters)
      resetFilters.addEventListener("click", () => {
        state.type = "all";
        state.cls = "all";
        $$(".chip[data-filter]").forEach((c) =>
          c.setAttribute("aria-pressed", String(c.dataset.filter === "all"))
        );
        apply();
      });
    apply();

    // сравнение
    const selA = $("#cmpA"), selB = $("#cmpB"), body = $("#cmpBody");
    if (selA && selB && body) {
      const opts = MODELS.map((m) => '<option value="' + m.id + '">МОТОР ' + m.name + "</option>").join("");
      selA.innerHTML = opts;
      selB.innerHTML = opts;
      selA.value = "aero-s";
      selB.value = "volta-gt";
      const rows = [
        ["Тип силовой установки", (m) => m.typeLabel],
        ["Класс кузова", (m) => m.clsLabel],
        ["Мощность, л.с.", (m) => m.power],
        ["Разгон 0–100, с", (m) => m.accel],
        ["Запас хода, км", (m) => fmtNum(m.range)],
        ["Расход", (m) => m.consumption + " " + m.unit],
        ["Цена от", (m) => fmtPrice(m.price)],
      ];
      function render() {
        const a = byId(selA.value), b = byId(selB.value);
        body.innerHTML = rows
          .map(function (r, idx) {
            const va = r[1](a), vb = r[1](b);
            let ca = "", cb = "";
            if (idx === 2) { ca = a.power >= b.power ? "compare__win" : ""; cb = b.power >= a.power ? "compare__win" : ""; }
            if (idx === 3) { ca = a.accel <= b.accel ? "compare__win" : ""; cb = b.accel <= a.accel ? "compare__win" : ""; }
            if (idx === 4) { ca = a.range >= b.range ? "compare__win" : ""; cb = b.range >= a.range ? "compare__win" : ""; }
            if (idx === 5) { ca = a.consumption <= b.consumption ? "compare__win" : ""; cb = b.consumption <= a.consumption ? "compare__win" : ""; }
            if (idx === 6) { ca = a.price <= b.price ? "compare__win" : ""; cb = b.price <= a.price ? "compare__win" : ""; }
            return (
              "<tr><th scope=\"row\">" + r[0] + "</th>" +
              '<td data-model="' + a.name + '" class="' + ca + '">' + va + "</td>" +
              '<td data-model="' + b.name + '" class="' + cb + '">' + vb + "</td></tr>"
            );
          })
          .join("");
      }
      selA.addEventListener("change", render);
      selB.addEventListener("change", render);
      render();
    }
  }

  function initScroll() {
    $$("[data-scroll]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const el = $(btn.dataset.scroll);
        if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
  }

  /* ============================================================
     СТРАНИЦА: КОНФИГУРАТОР
     ============================================================ */
  const COLORS = [
    { id: "graphite", name: "Графит Металлик", hex: "#2b303a", add: 0 },
    { id: "snow", name: "Снежный Перламутр", hex: "#e8ebee", add: 0 },
    { id: "cyan", name: "Циан Электро", hex: "#35c4e8", add: 90000 },
    { id: "red", name: "Красный Импульс", hex: "#ff3b30", add: 120000 },
    { id: "silver", name: "Серебро Люкс", hex: "#b9c0c9", add: 60000 },
    { id: "night", name: "Полночный Оникс", hex: "#0f1115", add: 0 },
  ];
  const WHEELS = [
    { id: "w19", name: "19\" Аэро", add: 0 },
    { id: "w20", name: '20" Спорт', add: 140000 },
    { id: "w21", name: '21" Перформанс', add: 260000 },
  ];
  const INTERIORS = [
    { id: "tech", name: "Ткань Техно", add: 0 },
    { id: "nappa", name: "Кожа Nappa", add: 250000 },
    { id: "alcantara", name: "Алькантара Спорт", add: 320000 },
  ];
  const PACKAGES = [
    { id: "autopilot", name: "Пакет «Автопилот Pro»", note: "Ассистент 3 уровня, 12 камер, лидар", price: 350000, power: 0, accel: 0, range: 0, consumption: 0 },
    { id: "roof", name: "Панорамная крыша", note: "Электрохромное затемнение, вид на небо", price: 180000, range: -12, consumption: 0.3 },
    { id: "audio", name: "Премиум-аудио 22 динамика", note: "Система объёмного звучания, 1450 Вт", price: 210000 },
    { id: "winter", name: "Зимний пакет", note: "Подогрев всех сидений, руля, стекла, тепловой насос", price: 95000, range: -8 },
    { id: "sport-susp", name: "Спортивная подвеска", note: "Адаптивные амортизаторы, клиренс −15 мм", price: 240000, power: 22, accel: -0.2 },
    { id: "acoustic", name: "Тонировка и шумоизоляция", note: "Атермальные стёкла, двойные уплотнители", price: 120000 },
    { id: "charger", name: "Зарядный комплекс 22 кВт", note: "Домашняя станция + кабель Mode 3", price: 150000, range: 20 },
  ];

  function initConfigurator() {
    const app = $("#configurator");
    if (!app) return;

    const STORAGE_KEY = "motor.config";
    const hasId = (list, id) => list.some((x) => x.id === id);
    const defaults = () => ({
      model: "aero-s",
      color: "graphite",
      wheel: "w20",
      interior: "nappa",
      packages: { autopilot: true },
    });

    // привести произвольный набор значений к валидному состоянию
    function applyConfig(src) {
      const next = defaults();
      if (!src) return next;
      if (src.model && byId(src.model)) next.model = src.model;
      if (src.color && hasId(COLORS, src.color)) next.color = src.color;
      if (src.wheel && hasId(WHEELS, src.wheel)) next.wheel = src.wheel;
      if (src.interior && hasId(INTERIORS, src.interior)) next.interior = src.interior;
      if (src.packages != null) {
        const ids = Array.isArray(src.packages) ? src.packages : String(src.packages).split(",");
        next.packages = {};
        ids.forEach((id) => {
          if (hasId(PACKAGES, id)) next.packages[id] = true;
        });
      }
      return next;
    }

    // приоритет: URL → localStorage → значения по умолчанию
    function loadConfig() {
      const params = new URLSearchParams(location.search);
      if (Array.from(params.keys()).length) {
        return applyConfig({
          model: params.get("model"),
          color: params.get("color"),
          wheel: params.get("wheel"),
          interior: params.get("interior"),
          packages: params.get("packages"),
        });
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return applyConfig(JSON.parse(raw));
      } catch (e) {}
      return defaults();
    }

    const state = loadConfig();

    // синхронизация состояния с localStorage и адресной строкой (без перезагрузки)
    function persistConfig() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {}
      const params = new URLSearchParams();
      params.set("model", state.model);
      params.set("color", state.color);
      params.set("wheel", state.wheel);
      params.set("interior", state.interior);
      const pkgs = Object.keys(state.packages).filter((k) => state.packages[k]);
      if (pkgs.length) params.set("packages", pkgs.join(","));
      try {
        history.replaceState(null, "", location.pathname + "?" + params.toString());
      } catch (e) {}
    }

    /* Табы моделей */
    const tabsWrap = $("#configTabs");
    tabsWrap.innerHTML = MODELS.map((m) =>
      '<button class="tab" role="tab" type="button" data-model="' + m.id + '" aria-selected="false">' + m.name + "</button>"
    ).join("");

    /* Цвета */
    $("#colorSwatches").innerHTML = COLORS.map((c) =>
      '<button class="swatch" type="button" role="radio" data-color="' + c.id + '" aria-checked="false" aria-label="' + c.name + '" title="' + c.name + '">' +
      '<i style="background:' + c.hex + '"></i></button>'
    ).join("");

    /* Диски */
    $("#wheelPicker").innerHTML = WHEELS.map((w) =>
      '<button class="chip" type="button" data-wheel="' + w.id + '" aria-pressed="false">' + w.name + (w.add ? " · +" + fmtPrice(w.add) : "") + "</button>"
    ).join("");

    /* Интерьер */
    $("#interiorPicker").innerHTML = INTERIORS.map((it) =>
      '<button class="chip" type="button" data-interior="' + it.id + '" aria-pressed="false">' + it.name + (it.add ? " · +" + fmtPrice(it.add) : "") + "</button>"
    ).join("");

    /* Пакеты опций */
    $("#optionPackages").innerHTML = PACKAGES.map((p) =>
      '<label class="option"><input type="checkbox" data-package="' + p.id + '">' +
      '<span class="option__text"><b>' + p.name + "</b><small>" + p.note + "</small></span>" +
      '<span class="option__price">+' + fmtPrice(p.price) + "</span></label>"
    ).join("");

    /* --- Пересчёт --- */
    function computeSpecs(base) {
      let power = base.power, accel = base.accel, range = base.range, cons = base.consumption;
      PACKAGES.forEach((p) => {
        if (!state.packages[p.id]) return;
        power += p.power || 0;
        accel += p.accel || 0;
        range += p.range || 0;
        cons += p.consumption || 0;
      });
      cons = Math.max(2, cons);
      return { power: Math.round(power), accel: Math.round(accel * 10) / 10, range: Math.round(range), cons: Math.round(cons * 10) / 10 };
    }

    function computeTotal(base) {
      const color = COLORS.filter((c) => c.id === state.color)[0];
      const wheel = WHEELS.filter((w) => w.id === state.wheel)[0];
      const interior = INTERIORS.filter((i) => i.id === state.interior)[0];
      let total = base.price + color.add + wheel.add + interior.add;
      const chosen = [];
      PACKAGES.forEach((p) => {
        if (state.packages[p.id]) {
          total += p.price;
          chosen.push(p);
        }
      });
      return { total: total, color: color, wheel: wheel, interior: interior, chosen: chosen };
    }

    /* --- Отрисовка --- */
    const previewEl = $("#carPreview");
    const badgeEl = $("#configBadge");
    let previewImg = null;
    let lastTotal = 0;
    const barVals = {};

    function render(full) {
      const base = byId(state.model);
      const r = computeTotal(base);
      const color = r.color;

      // превью авто: вырезанный WebP — меняется только цвет машины, фон не трогаем
      const cut = base.img;
      if (!previewImg) {
        previewImg = document.createElement("img");
        previewImg.decoding = "async";
        previewEl.innerHTML = "";
        previewEl.appendChild(previewImg);
      }
      if (previewImg.getAttribute("src") !== cut) previewImg.src = cut;
      previewImg.alt = "МОТОР " + base.name + " — " + base.clsLabel;
      previewImg.className = "car-preview-img car-color-" + color.id;
      if (badgeEl) badgeEl.textContent = "МОТОР " + base.name;
      const nameEl = $("#summaryModelName");
      if (nameEl) nameEl.textContent = "МОТОР " + base.name;
      const classEl = $("#summaryClass");
      if (classEl) classEl.textContent = base.typeLabel + " · " + base.clsLabel;

      // активные контролы
      $$("#configTabs .tab").forEach((t) => {
        const on = t.dataset.model === state.model;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      $$("#colorSwatches .swatch").forEach((s) =>
        s.setAttribute("aria-checked", String(s.dataset.color === state.color))
      );
      $$("#wheelPicker .chip").forEach((c) =>
        c.setAttribute("aria-pressed", String(c.dataset.wheel === state.wheel))
      );
      $$("#interiorPicker .chip").forEach((c) =>
        c.setAttribute("aria-pressed", String(c.dataset.interior === state.interior))
      );
      $$("#optionPackages input").forEach((i) =>
        (i.checked = !!state.packages[i.dataset.package])
      );

      // имя выбранного цвета
      $("#colorName").innerHTML =
        "<b>" + color.name + "</b>" + (color.add ? '<span class="adds">+' + fmtPrice(color.add) + "</span>" : "");

      // сводка
      const rows = [
        ["Базовая цена", fmtPrice(base.price)],
        ["Цвет · " + color.name, color.add ? "+" + fmtPrice(color.add) : "включено"],
        ["Диски · " + r.wheel.name, r.wheel.add ? "+" + fmtPrice(r.wheel.add) : "включено"],
        ["Интерьер · " + r.interior.name, r.interior.add ? "+" + fmtPrice(r.interior.add) : "включено"],
      ].concat(r.chosen.map((p) => [p.name, "+" + fmtPrice(p.price)]));

      $("#summaryRows").innerHTML = rows
        .map((row, i) =>
          '<div class="summary__row' + (i > 0 ? " summary__row--option" : "") + '"><span>' + row[0] + "</span><b>" + row[1] + "</b></div>"
        )
        .join("");

      const totalEl = $("#summaryTotal");
      totalEl.textContent = fmtPrice(r.total);
      if (full && r.total !== lastTotal) {
        totalEl.classList.remove("bump");
        void totalEl.offsetWidth;
        totalEl.classList.add("bump");
      }
      lastTotal = r.total;

      $("#summaryMonthly").textContent =
        "Предзаказ от " + fmtPrice(Math.round(r.total / 60)) + " в месяц (60 месяцев, 0%)";

      // чипы выбранных опций
      const chips = [$("#summaryRows")];
      $("#chipsSelected").innerHTML = r.chosen
        .map((p) => "<span>" + p.name + "</span>")
        .join("") + "<span>" + color.name + "</span>";

      // графики
      const specs = computeSpecs(base);
      updateBars(specs);
      drawRadar(specs);

      // сохранить конфигурацию (URL + localStorage)
      persistConfig();
    }

    function updateBars(s) {
      const maxes = { power: 1000, accel: 6, range: 800, cons: 25 };
      setBar("#barPower", s.power, maxes.power, (v) => v + " л.с.");
      setBar("#barAccel", s.accel, maxes.accel, (v) => v.toFixed(1) + " с", true);
      setBar("#barRange", s.range, maxes.range, (v) => fmtNum(v) + " км");
      setBar("#barCons", s.cons, maxes.cons, (v) => v.toFixed(1) + (byId(state.model).unit.indexOf("кВт") === 0 ? " кВт·ч" : " л"));
    }

    function setBar(sel, value, max, formatter, lowerBetter) {
      const root = $(sel);
      if (!root) return;
      const fill = $(".bar__fill", root);
      const valEl = $("b", root);
      const pct = Math.max(3, Math.min(100, (value / max) * 100));
      fill.style.width = pct + "%";

      const dec = sel === "#barAccel" || sel === "#barCons" ? 1 : 0;
      const pow = Math.pow(10, dec);
      const to = Math.round(value * pow) / pow;
      const from = barVals[sel] != null ? barVals[sel] : 0;
      barVals[sel] = to;

      if (reduceMotion) {
        valEl.textContent = formatter(to);
        return;
      }
      const dur = 540;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = Math.round((from + (to - from) * eased) * pow) / pow;
        valEl.textContent = formatter(v);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    /* Радар на canvas */
    const radar = $("#radarChart");
    const rctx = radar ? radar.getContext("2d") : null;
    function drawRadar(s) {
      if (!rctx) return;
      const dpr = window.devicePixelRatio || 1;
      const size = 320;
      radar.width = size * dpr;
      radar.height = size * dpr;
      rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rctx.clearRect(0, 0, size, size);

      const cx = size / 2, cy = size / 2 + 4, R = size / 2 - 46;
      const axes = [
        { label: "Мощность", v: Math.min(1, s.power / 1000) },
        { label: "Запас хода", v: Math.min(1, s.range / 800) },
        { label: "Динамика", v: Math.min(1, 1 - (s.accel - 2) / 4) },
        { label: "Экономичность", v: Math.min(1, 1 - (s.cons - 2) / 23) },
      ];
      const n = axes.length;

      // сетка
      rctx.strokeStyle = "rgba(255,255,255,0.09)";
      rctx.lineWidth = 1;
      for (let ring = 1; ring <= 4; ring++) {
        rctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2;
          const rr = (R * ring) / 4;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          i ? rctx.lineTo(x, y) : rctx.moveTo(x, y);
        }
        rctx.stroke();
      }
      // оси + подписи
      rctx.fillStyle = "rgba(159,180,196,0.9)";
      rctx.font = "500 10px 'JetBrains Mono', monospace";
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R;
        rctx.strokeStyle = "rgba(255,255,255,0.12)";
        rctx.beginPath();
        rctx.moveTo(cx, cy);
        rctx.lineTo(x, y);
        rctx.stroke();
        const lx = cx + Math.cos(a) * (R + 20);
        const ly = cy + Math.sin(a) * (R + 20);
        rctx.textAlign = Math.abs(Math.cos(a)) < 0.2 ? "center" : Math.cos(a) > 0 ? "left" : "right";
        rctx.textBaseline = "middle";
        rctx.fillText(axes[i].label, lx, ly);
      }
      // данные
      const grad = rctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      grad.addColorStop(0, "rgba(53,196,232,0.5)");
      grad.addColorStop(1, "rgba(53,196,232,0.14)");
      rctx.beginPath();
      axes.forEach((ax, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const rr = R * ax.v;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        i ? rctx.lineTo(x, y) : rctx.moveTo(x, y);
      });
      rctx.closePath();
      rctx.fillStyle = grad;
      rctx.fill();
      rctx.strokeStyle = "#35c4e8";
      rctx.lineWidth = 2;
      rctx.stroke();
      axes.forEach((ax, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const rr = R * ax.v;
        rctx.beginPath();
        rctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3.5, 0, Math.PI * 2);
        rctx.fillStyle = "#35c4e8";
        rctx.fill();
      });

      const legend = $("#radarLegend");
      if (legend)
        legend.innerHTML = axes
          .map((ax) => '<div><i class="dot-cyan"></i>' + ax.label + "<b>" + Math.round(ax.v * 100) + "%</b></div>")
          .join("");
    }

    /* --- Слушатели --- */
    function select(sel, attr, val, full) {
      state[sel] = val;
      render(full !== false);
    }
    $$("#configTabs .tab").forEach((t) =>
      t.addEventListener("click", () => select("model", null, t.dataset.model, true))
    );
    $$("#colorSwatches .swatch").forEach((s) =>
      s.addEventListener("click", () => select("color", null, s.dataset.color, true))
    );
    $$("#wheelPicker .chip").forEach((c) =>
      c.addEventListener("click", () => select("wheel", null, c.dataset.wheel, true))
    );
    $$("#interiorPicker .chip").forEach((c) =>
      c.addEventListener("click", () => select("interior", null, c.dataset.interior, true))
    );
    $$("#optionPackages input").forEach((i) =>
      i.addEventListener("change", () => {
        state.packages[i.dataset.package] = i.checked;
        render(true);
      })
    );

    // сброс
    const reset = $("#resetConfig");
    if (reset)
      reset.addEventListener("click", () => {
        Object.assign(state, defaults());
        render(true);
      });

    // «Скопировать ссылку» на текущую конфигурацию
    const copy = $("#copyConfig");
    if (copy)
      copy.addEventListener("click", async () => {
        const url = location.href;
        let ok = true;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
          } else {
            throw new Error("no clipboard");
          }
        } catch (e) {
          try {
            const ta = document.createElement("textarea");
            ta.value = url;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            ok = document.execCommand("copy");
            document.body.removeChild(ta);
          } catch (e2) {
            ok = false;
          }
        }
        const prev = copy.textContent;
        copy.textContent = ok ? "Ссылка скопирована" : "Не удалось";
        setTimeout(() => {
          copy.textContent = prev;
        }, 1800);
      });

    // предзаказ → модальное окно
    const modal = $("#preorderModal");
    const openBtn = $("#preorderBtn");
    function openModal() {
      const base = byId(state.model);
      const r = computeTotal(base);
      $("#modalSummary").innerHTML =
        '<div><span>Модель</span><b>МОТОР ' + base.name + "</b></div>" +
        '<div><span>Цвет</span><b>' + r.color.name + "</b></div>" +
        '<div><span>Диски</span><b>' + r.wheel.name + "</b></div>" +
        '<div><span>Интерьер</span><b>' + r.interior.name + "</b></div>" +
        '<div><span>Опции</span><b>' + (r.chosen.length ? r.chosen.length + " шт." : "—") + "</b></div>" +
        '<div class="total"><span>Итого</span><b>' + fmtPrice(r.total) + "</b></div>";
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      const focusable = $("input, button", modal);
      if (focusable) focusable.focus();
    }
    function closeModal() {
      modal.classList.remove("open");
      document.body.style.overflow = "";
      if (openBtn) openBtn.focus();
    }
    if (openBtn) openBtn.addEventListener("click", openModal);
    if (modal) {
      $$("[data-close]", modal).forEach((b) => b.addEventListener("click", closeModal));
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
      });
      const mform = $("form[data-form]", modal);
      if (mform)
        mform.addEventListener("submit", (e) => {
          e.preventDefault();
          if (!mform.checkValidity()) return mform.reportValidity();
          modal.classList.remove("open");
          document.body.style.overflow = "";
          alert("Предзаказ оформлен! Менеджер МОТОР свяжется с вами в течение 15 минут.");
          mform.reset();
        });
    }

    render(false);
    if (reduceMotion) {
      // мгновенно заполнить бары при отключённой анимации
      requestAnimationFrame(() => render(false));
    }
  }

  /* ============================================================
     СТРАНИЦА: О КОМПАНИИ
     ============================================================ */
  function initDealers() {
    const list = $("#dealerList");
    if (!list) return;
    const dealers = [
      { city: "Москва", addr: "Ленинградский проспект, 39, стр. 80", phone: "+7 495 120-45-45", pin: "moscow", hours: "Пн–Вс 9:00–21:00" },
      { city: "Санкт-Петербург", addr: "Приморский проспект, 14", phone: "+7 812 380-12-12", pin: "spb", hours: "Пн–Вс 9:00–21:00" },
      { city: "Екатеринбург", addr: "ул. Металлургов, 87", phone: "+7 343 210-88-00", pin: "ekb", hours: "Пн–Сб 9:00–20:00" },
      { city: "Казань", addr: "Проспект Победы, 226", phone: "+7 843 590-77-01", pin: "kazan", hours: "Пн–Вс 10:00–20:00" },
      { city: "Новосибирск", addr: "ул. Станционная, 60", phone: "+7 383 345-66-10", pin: "nsk", hours: "Пн–Сб 9:00–20:00" },
      { city: "Сочи", addr: "Курортный проспект, 105", phone: "+7 862 240-33-90", pin: "sochi", hours: "Пн–Вс 10:00–21:00" },
    ];
    list.innerHTML = dealers
      .map(
        (d) =>
          '<article class="dealer" data-pin="' + d.pin + '" tabindex="0" role="button" aria-label="Дилер в городе ' + d.city + '">' +
          '<span class="dealer__city">' + d.city + "</span>" +
          '<span class="dealer__addr">' + d.addr + "</span>" +
          '<span class="dealer__meta"><span>' + d.hours + "</span><a href=\"tel:" + d.phone.replace(/[^+\d]/g, "") + '">' + d.phone + "</a></span>" +
          "</article>"
      )
      .join("");

    function activate(pin) {
      $$(".dealer", list).forEach((el) => el.classList.toggle("active", el.dataset.pin === pin));
      $$(".map__pin").forEach((el) => el.classList.toggle("active", el.dataset.pin === pin));
    }
    $$(".dealer", list).forEach((el) => {
      const go = () => activate(el.dataset.pin);
      el.addEventListener("click", go);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
    });
    $$(".map__pin").forEach((el) => {
      const pin = el.dataset.pin;
      const d = dealers.filter((x) => x.pin === pin)[0];
      if (d) el.setAttribute("aria-label", "Дилер МОТОР — " + d.city);
      el.addEventListener("click", () => activate(pin));
    });
  }

  /* HUD-прицел: ретикл следует за курсором над «моделью» */
  function initReticle() {
    if (reduceMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const TARGETS = ".card__media, #carPreview, .map, .hero__visual";
    const reticle = document.createElement("div");
    reticle.className = "reticle";
    reticle.setAttribute("aria-hidden", "true");
    reticle.innerHTML =
      '<span class="reticle__ring"></span><span class="reticle__readout"></span>';
    document.body.appendChild(reticle);
    const readout = reticle.querySelector(".reticle__readout");
    let active = null;

    document.addEventListener(
      "pointermove",
      (e) => {
        const t = e.target && e.target.closest ? e.target.closest(TARGETS) : null;
        if (t !== active) {
          if (active) active.classList.remove("scan-on");
          active = t;
          if (active) active.classList.add("scan-on");
          reticle.classList.toggle("on", !!t);
        }
        if (!t) return;
        const r = t.getBoundingClientRect();
        reticle.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
        readout.textContent =
          "X" + String(Math.round(e.clientX - r.left)).padStart(3, "0") +
          " · Y" + String(Math.round(e.clientY - r.top)).padStart(3, "0") +
          " · SPEC";
      },
      { passive: true }
    );
    document.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) {
        reticle.classList.remove("on");
        if (active) active.classList.remove("scan-on");
        active = null;
      }
    });
  }

  /* ============================================================
     ИНИЦИАЛИЗАЦИЯ
     ============================================================ */
  function boot() {
    initHeader();
    initNav();
    initReticle();
    initTabs();
    initModels();
    initConfigurator();
    initDealers();
    initForms();
    initScroll();
    initReveal();
    initCounters();

    // отложенный reveal для динамически отрисованных карточек моделей
    if (location.pathname.indexOf("models") !== -1 || $("#modelsGrid")) {
      requestAnimationFrame(() => {
        initReveal();
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
