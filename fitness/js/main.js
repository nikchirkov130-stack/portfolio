/* ============================================================
   Импульс — фитнес-платформа
   Vanilla JS · без библиотек
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  /* ----------------------------------------------------------
     1. Мобильное меню-гамбургер
     ---------------------------------------------------------- */
  function initMenu() {
    var burger = document.getElementById("burger");
    var nav = document.getElementById("nav");
    if (!burger || !nav) return;

    function close() {
      burger.classList.remove("is-open");
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Открыть меню");
    }
    function toggle() {
      var open = burger.classList.toggle("is-open");
      nav.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    }

    burger.addEventListener("click", toggle);
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900) close();
    });
  }

  /* ----------------------------------------------------------
     2. Sticky-шапка
     ---------------------------------------------------------- */
  function initHeader() {
    var header = document.getElementById("header");
    if (!header) return;
    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----------------------------------------------------------
     3. Reveal-анимации (IntersectionObserver)
     ---------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
      io.observe(el);
    });
  }

  /* ----------------------------------------------------------
     4. Анимированные счётчики
     ---------------------------------------------------------- */
  function animateCounter(el) {
    if (el.dataset.done === "1") return;
    el.dataset.done = "1";

    var target = parseFloat(el.dataset.target) || 0;
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var suffix = el.dataset.suffix || "";

    function format(value) {
      var fixed = value.toFixed(decimals);
      if (decimals === 0) {
        fixed = Math.round(value).toString();
      }
      var parts = fixed.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      return parts.join(",") + suffix;
    }

    if (reduceMotion) {
      el.textContent = format(target);
      return;
    }

    var duration = 1600;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = format(target);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll(".counter");
    if (!counters.length) return;

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------
     5. SVG прогресс-кольца
     ---------------------------------------------------------- */
  function initRings() {
    var CIRC = 2 * Math.PI * 66; // r = 66
    var cards = document.querySelectorAll(".ring-card");
    if (!cards.length) return;

    cards.forEach(function (card) {
      var pct = parseFloat(card.dataset.progress) || 0;
      var value = card.querySelector(".ring__value");
      if (value) {
        value.style.strokeDasharray = CIRC.toFixed(2);
        value.style.setProperty("--offset", (CIRC * (1 - pct / 100)).toFixed(2));
      }
    });

    if (!("IntersectionObserver" in window) || reduceMotion) {
      cards.forEach(function (c) { c.classList.add("is-visible"); });
      cards.forEach(function (c) {
        c.querySelectorAll(".counter").forEach(animateCounter);
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          entry.target.querySelectorAll(".counter").forEach(animateCounter);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    cards.forEach(function (c) { io.observe(c); });
  }

  /* ----------------------------------------------------------
     6. График активности (canvas)
     ---------------------------------------------------------- */
  function initChart() {
    var canvas = document.getElementById("activityChart");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    var minutes = [45, 30, 62, 20, 55, 78, 40];
    var calories = [320, 240, 480, 160, 420, 610, 300];
    var maxMin = Math.max.apply(null, minutes);
    var maxCal = Math.max.apply(null, calories);

    var W = 900;
    var H = 340;
    var pad = { top: 28, right: 22, bottom: 44, left: 46 };
    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      var cssW = rect.width || W;
      var cssH = cssW * (H / W);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.scale(cssW / W, cssW / W);
    }

    function draw(progress) {
      ctx.clearRect(0, 0, W, H);

      // сетка + подписи оси Y (минуты)
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.fillStyle = "#6d6f74";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.lineWidth = 1;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      var steps = 4;
      for (var s = 0; s <= steps; s++) {
        var y = pad.top + (plotH / steps) * s;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
        var label = Math.round(maxMin * (1 - s / steps));
        ctx.fillText(String(label), pad.left - 10, y);
      }

      var slot = plotW / days.length;
      var barW = Math.min(38, slot * 0.5);

      // вспомогательные точки линии калорий
      var linePts = [];

      for (var i = 0; i < days.length; i++) {
        var cx = pad.left + slot * i + slot / 2;

        // столбец минут
        var barH = (minutes[i] / maxMin) * plotH * progress;
        var bx = cx - barW / 2;
        var by = pad.top + plotH - barH;

        var grad = ctx.createLinearGradient(0, by, 0, pad.top + plotH);
        grad.addColorStop(0, "#c8ff2e");
        grad.addColorStop(1, "rgba(200,255,46,0.12)");
        ctx.fillStyle = grad;
        roundRect(ctx, bx, by, barW, barH, 6);
        ctx.fill();

        // подпись дня
        ctx.fillStyle = "#ababab";
        ctx.font = "12px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(days[i], cx, pad.top + plotH + 14);

        // точка линии калорий
        var ly = pad.top + plotH - (calories[i] / maxCal) * (plotH * 0.82) * progress;
        linePts.push({ x: cx, y: ly });
      }

      // линия калорий
      if (linePts.length) {
        ctx.strokeStyle = "#ff6a00";
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(linePts[0].x, linePts[0].y);
        for (var k = 1; k < linePts.length; k++) {
          ctx.lineTo(linePts[k].x, linePts[k].y);
        }
        ctx.stroke();

        // точки
        linePts.forEach(function (pt) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = "#0b0b0b";
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#ff6a00";
          ctx.stroke();
        });
      }
    }

    function roundRect(c, x, y, w, h, r) {
      if (h < r * 2) r = h / 2;
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    resize();

    if (reduceMotion) {
      draw(1);
      window.addEventListener("resize", function () { resize(); draw(1); });
      return;
    }

    var started = false;
    function start() {
      if (started) return;
      started = true;
      var duration = 1400;
      var startTs = null;
      function frame(ts) {
        if (startTs === null) startTs = ts;
        var p = Math.min((ts - startTs) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        draw(eased);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            start();
            io.disconnect();
          }
        });
      }, { threshold: 0.3 });
      io.observe(canvas);
    } else {
      start();
    }

    var rTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(rTimer);
      rTimer = setTimeout(function () {
        resize();
        draw(started ? 1 : 0);
      }, 150);
    });

    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        resize();
        draw(started ? 1 : 0);
      }).observe(canvas.parentElement || canvas);
    }
  }

  /* ----------------------------------------------------------
     7. Калькулятор ИМТ + калорий
     ---------------------------------------------------------- */
  function initCalculator() {
    var form = document.getElementById("calcForm");
    if (!form) return;

    var bmiValue = document.getElementById("bmiValue");
    var bmiCategory = document.getElementById("bmiCategory");
    var bmiMarker = document.getElementById("bmiMarker");
    var bmrValue = document.getElementById("bmrValue");
    var tdeeValue = document.getElementById("tdeeValue");
    var advice = document.getElementById("advice");

    function categoryFor(bmi) {
      if (bmi < 18.5) {
        return { key: "under", name: "Недостаток веса", color: "#6ea8ff" };
      }
      if (bmi < 25) {
        return { key: "normal", name: "Норма", color: "#00e676" };
      }
      if (bmi < 30) {
        return { key: "over", name: "Избыточный вес", color: "#ffd24a" };
      }
      return { key: "obese", name: "Ожирение", color: "#ff7a7a" };
    }

    function adviceFor(key) {
      switch (key) {
        case "under":
          return "Вес ниже нормы. Рекомендуем сбалансированное питание с профицитом калорий и силовые тренировки.";
        case "normal":
          return "Отличный показатель! Поддерживайте режим тренировок и текущий рацион.";
        case "over":
          return "Небольшой избыток веса. Помогут кардиотренировки и умеренный дефицит калорий.";
        default:
          return "Вес значительно выше нормы. Рекомендуем начать с кардио и проконсультироваться с врачом.";
      }
    }

    // зафиксировать число в стиле ru-RU (через запятую)
    function fmt(num, decimals) {
      return num.toFixed(decimals).replace(".", ",");
    }

    function calculate() {
      var sex = form.querySelector('input[name="sex"]:checked').value;
      var age = parseFloat(document.getElementById("age").value);
      var height = parseFloat(document.getElementById("height").value);
      var weight = parseFloat(document.getElementById("weight").value);
      var activity = parseFloat(document.getElementById("activity").value);

      if (!age || !height || !weight || age < 14 || height < 120 || weight < 35) {
        bmiValue.textContent = "—";
        bmiCategory.className = "result-bmi__category";
        bmiCategory.textContent = "Проверьте введённые данные";
        bmrValue.textContent = "—";
        tdeeValue.textContent = "—";
        advice.textContent = "Введите корректные значения возраста, роста и веса (в пределах допустимых диапазонов).";
        bmiMarker.style.left = "0%";
        return;
      }

      var m = height / 100;
      var bmi = weight / (m * m);
      var cat = categoryFor(bmi);

      // BMR — формула Mifflin–St Jeor
      var bmr = 10 * weight + 6.25 * height - 5 * age + (sex === "male" ? 5 : -161);
      var tdee = bmr * activity;

      bmiValue.textContent = fmt(bmi, 1);
      bmiValue.style.color = cat.color;
      bmiCategory.className = "result-bmi__category cat-" + cat.key;
      bmiCategory.textContent = cat.name;

      bmrValue.textContent = Math.round(bmr).toLocaleString("ru-RU") + " ккал";
      tdeeValue.textContent = Math.round(tdee).toLocaleString("ru-RU") + " ккал";
      advice.textContent = adviceFor(cat.key);

      // позиция маркера на шкале ИМТ (16..40 -> 0..100%)
      var pct = ((bmi - 16) / (40 - 16)) * 100;
      pct = Math.max(2, Math.min(98, pct));
      bmiMarker.style.left = pct + "%";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      calculate();
    });
    form.addEventListener("input", function () {
      calculate();
    });

    calculate();
  }

  /* ----------------------------------------------------------
     8. FAQ-аккордеон
     ---------------------------------------------------------- */
  function initFaq() {
    var list = document.getElementById("faqList");
    if (!list) return;
    var buttons = list.querySelectorAll(".faq__question");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".faq__item");
        var answer = document.getElementById(btn.getAttribute("aria-controls"));
        var isOpen = btn.getAttribute("aria-expanded") === "true";

        // закрыть остальные
        buttons.forEach(function (other) {
          if (other === btn) return;
          var otherItem = other.closest(".faq__item");
          var otherAnswer = document.getElementById(other.getAttribute("aria-controls"));
          other.setAttribute("aria-expanded", "false");
          if (otherItem) otherItem.classList.remove("is-open");
          if (otherAnswer) collapse(otherAnswer);
        });

        btn.setAttribute("aria-expanded", String(!isOpen));
        item.classList.toggle("is-open", !isOpen);
        if (isOpen) {
          collapse(answer);
        } else {
          expand(answer);
        }
      });
    });

    function expand(el) {
      if (!el) return;
      el.hidden = false;
      var h = el.scrollHeight;
      if (reduceMotion) {
        el.style.height = "auto";
        return;
      }
      el.style.height = "0px";
      el.style.transition = "height 0.35s cubic-bezier(0.22,1,0.36,1)";
      requestAnimationFrame(function () {
        el.style.height = h + "px";
      });
      el.addEventListener("transitionend", function onEnd(e) {
        if (e.propertyName !== "height") return;
        el.style.height = "auto";
        el.removeEventListener("transitionend", onEnd);
      });
    }

    function collapse(el) {
      if (!el || el.hidden) return;
      if (reduceMotion) {
        el.hidden = true;
        return;
      }
      el.style.height = el.scrollHeight + "px";
      el.style.transition = "height 0.3s cubic-bezier(0.22,1,0.36,1)";
      requestAnimationFrame(function () {
        el.style.height = "0px";
      });
      el.addEventListener("transitionend", function onEnd(e) {
        if (e.propertyName !== "height") return;
        el.hidden = true;
        el.style.height = "";
        el.removeEventListener("transitionend", onEnd);
      });
    }
  }

  /* ----------------------------------------------------------
     9. Активная ссылка навигации при скролле
     ---------------------------------------------------------- */
  function initActiveNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) {
        map[id] = link;
        sections.push(sec);
      }
    });

    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var best = null;
      var bestRatio = -1;
      sections.forEach(function (sec) {
        var ratio = visible[sec.id] || 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = sec.id;
        }
      });
      if (best && map[best]) {
        links.forEach(function (l) { l.classList.remove("is-active"); });
        map[best].classList.add("is-active");
      }
    }, { threshold: [0.15, 0.35, 0.6] });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------------------------------------------------------- */
  ready(function () {
    initMenu();
    initHeader();
    initReveal();
    initCounters();
    initRings();
    initChart();
    initCalculator();
    initFaq();
    initActiveNav();
  });
})();
