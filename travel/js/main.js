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

  ready(function () {
    initHeader();
    initMobileMenu();
    initActiveLink();
    initReveal();
    initCounters();
    initStars();
    initParallax();
    initSlider();
    initMap();
    initMapRoutes();
    initSearchForm();
    initNewsletter();
  });

  var toastTimer = null;

  function showToast(message) {
    var toast = document.getElementById("toast");
    var text = document.getElementById("toast-text");
    if (!toast || !text) return;
    text.textContent = message;
    toast.hidden = false;
    requestAnimationFrame(function () {
      toast.classList.add("show");
    });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 6000);
  }

  function hideToast() {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.classList.remove("show");
    setTimeout(function () {
      toast.hidden = true;
    }, 350);
  }

  function initHeader() {
    var header = document.getElementById("header");
    if (!header) return;

    var onScroll = function () {
      if (window.scrollY > 24) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileMenu() {
    var header = document.getElementById("header");
    var toggle = document.getElementById("menu-toggle");
    var nav = document.getElementById("main-nav");
    if (!header || !toggle || !nav) return;

    var close = function () {
      header.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Открыть меню");
    };

    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) close();
    });
  }

  function initActiveLink() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      byId[id] = link;
    });

    var sections = Object.keys(byId)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
          });
          var active = byId[entry.target.id];
          if (active) {
            active.classList.add("active");
            active.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    items.forEach(function (el) {
      var parent = el.parentElement;
      var group = parent ? Array.prototype.filter.call(parent.children, function (child) {
        return child.classList.contains("reveal");
      }) : [];
      var index = group.indexOf(el);
      if (index > 0) {
        el.style.transitionDelay = Math.min(index, 5) * 80 + "ms";
      }
      observer.observe(el);
    });
  }

  function formatNumber(value, decimals) {
    return value.toLocaleString("ru-RU", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function initCounters() {
    var counters = Array.prototype.slice.call(document.querySelectorAll(".stat-number"));
    if (!counters.length) return;

    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-target")) || 0;
      var decimals = parseInt(el.getAttribute("data-decimals"), 10) || 0;

      if (reduceMotion) {
        el.textContent = formatNumber(target, decimals);
        return;
      }

      var duration = 1700;
      var start = null;

      var step = function (timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = target * eased;
        el.textContent = formatNumber(decimals ? value : Math.round(value), decimals);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = formatNumber(target, decimals);
        }
      };

      requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initStars() {
    var field = document.getElementById("hero-stars");
    if (!field) return;

    var count = window.innerWidth < 700 ? 40 : 80;
    var fragment = document.createDocumentFragment();

    for (var i = 0; i < count; i++) {
      var star = document.createElement("span");
      star.className = "star";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 68 + "%";
      var size = (Math.random() * 2 + 1).toFixed(1);
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.setProperty("--dur", (Math.random() * 4 + 2.5).toFixed(1) + "s");
      star.style.setProperty("--delay", (Math.random() * 5).toFixed(1) + "s");
      fragment.appendChild(star);
    }

    field.appendChild(fragment);
  }

  function initParallax() {
    var hero = document.getElementById("hero");
    if (!hero) return;

    var bg = hero.querySelector(".hero-bg");
    var overlay = hero.querySelector(".hero-overlay");
    if (!bg || reduceMotion) return;

    var pointerX = 0;
    var pointerY = 0;
    var ticking = false;

    var apply = function () {
      var rect = hero.getBoundingClientRect();
      var progress = Math.min(Math.max(-rect.top / (rect.height || 1), 0), 1);
      var mouseX = pointerX || 0;
      var mouseY = pointerY || 0;

      bg.style.transform =
        "translate3d(" + (mouseX * -12).toFixed(2) + "px," +
        (progress * 90 + mouseY * -9).toFixed(2) + "px,0) scale(1.08)";

      if (overlay) {
        overlay.style.transform = "translate3d(0," + (progress * 42).toFixed(2) + "px,0)";
      }

      ticking = false;
    };

    var request = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", request, { passive: true });

    hero.addEventListener("mousemove", function (event) {
      var rect = hero.getBoundingClientRect();
      pointerX = (event.clientX / rect.width - 0.5) * 2;
      pointerY = (event.clientY / rect.height - 0.5) * 2;
      request();
    });

    hero.addEventListener("mouseleave", function () {
      pointerX = 0;
      pointerY = 0;
      request();
    });

    apply();
  }

  function initSlider() {
    var root = document.getElementById("reviews-slider");
    var track = document.getElementById("slider-track");
    var dotsWrap = document.getElementById("slider-dots");
    var prev = document.getElementById("slider-prev");
    var next = document.getElementById("slider-next");
    if (!root || !track || !dotsWrap) return;

    var slides = Array.prototype.slice.call(track.children);
    if (slides.length < 2) return;

    var index = 0;
    var timer = null;

    var dots = slides.map(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slider-dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Отзыв " + (i + 1));
      dot.addEventListener("click", function () {
        goTo(i);
        restart();
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function render() {
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (dot, i) {
        var active = i === index;
        dot.classList.toggle("active", active);
        dot.setAttribute("aria-selected", String(active));
      });
      slides.forEach(function (slide, i) {
        slide.setAttribute("aria-hidden", String(i !== index));
      });
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      render();
    }

    function start() {
      if (reduceMotion) return;
      stop();
      timer = setInterval(function () {
        goTo(index + 1);
      }, 6500);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function restart() {
      stop();
      start();
    }

    if (prev) {
      prev.addEventListener("click", function () {
        goTo(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        goTo(index + 1);
        restart();
      });
    }

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    root.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        goTo(index - 1);
        restart();
      } else if (event.key === "ArrowRight") {
        goTo(index + 1);
        restart();
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    render();
    start();
  }

  function initMap() {
    var pins = Array.prototype.slice.call(document.querySelectorAll(".map-pin"));
    var tip = document.getElementById("map-tip");
    var wrap = document.getElementById("map-wrap");
    if (!pins.length || !tip || !wrap) return;

    var els = {
      region: document.getElementById("map-tip-region"),
      title: document.getElementById("map-tip-title"),
      desc: document.getElementById("map-tip-desc"),
      duration: document.getElementById("map-tip-duration"),
      season: document.getElementById("map-tip-season"),
      price: document.getElementById("map-tip-price"),
      close: document.getElementById("map-tip-close")
    };

    var activePin = null;

    function closeTip() {
      tip.hidden = true;
      if (activePin) {
        activePin.classList.remove("active");
        activePin.setAttribute("aria-expanded", "false");
        activePin = null;
      }
    }

    function openTip(pin) {
      els.region.textContent = pin.getAttribute("data-region") || "";
      els.title.textContent = pin.getAttribute("data-name") || "";
      els.desc.textContent = pin.getAttribute("data-desc") || "";
      els.duration.textContent = pin.getAttribute("data-duration") || "";
      els.season.textContent = pin.getAttribute("data-season") || "";
      els.price.textContent = pin.getAttribute("data-price") || "";

      pins.forEach(function (item) {
        item.classList.remove("active");
        item.setAttribute("aria-expanded", "false");
      });
      pin.classList.add("active");
      pin.setAttribute("aria-expanded", "true");
      activePin = pin;

      tip.hidden = false;

      tip.classList.remove("stamp-in");
      pin.classList.remove("is-stamping");
      void tip.offsetWidth;
      tip.classList.add("stamp-in");
      pin.classList.add("is-stamping");

      if (pin._stampTimer) clearTimeout(pin._stampTimer);
      pin._stampTimer = setTimeout(function () {
        pin.classList.remove("is-stamping");
      }, 620);
    }

    pins.forEach(function (pin) {
      pin.setAttribute("aria-expanded", "false");
      pin.setAttribute("aria-haspopup", "true");
      pin.addEventListener("click", function (event) {
        event.stopPropagation();
        if (activePin === pin) {
          closeTip();
        } else {
          openTip(pin);
        }
      });
    });

    if (els.close) els.close.addEventListener("click", closeTip);

    wrap.addEventListener("click", function (event) {
      if (!event.target.closest(".map-pin") && !event.target.closest(".map-tip")) {
        closeTip();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeTip();
    });
  }

  function initMapRoutes() {
    var wrap = document.getElementById("map-wrap");
    if (!wrap || !wrap.querySelector(".map-routes .route")) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      wrap.classList.add("routes-drawn");
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          wrap.classList.add("routes-drawn");
          obs.disconnect();
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(wrap);
  }

  function initSearchForm() {
    var form = document.getElementById("search-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var direction = (document.getElementById("search-direction").value || "").trim();
      var from = document.getElementById("search-from").value;
      var to = document.getElementById("search-to").value;
      var guestsSelect = document.getElementById("search-guests");
      var guests = guestsSelect.options[guestsSelect.selectedIndex].text;

      if (from && to && new Date(to) < new Date(from)) {
        showToast("Дата возврата не может быть раньше даты выезда. Проверьте, пожалуйста.");
        return;
      }

      var dates = "даты уточним вместе с менеджером";
      if (from && to) {
        var fmt = { day: "numeric", month: "long" };
        dates = "с " + new Date(from).toLocaleDateString("ru-RU", fmt) + " по " + new Date(to).toLocaleDateString("ru-RU", fmt);
      } else if (from) {
        dates = "с " + new Date(from).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
      }

      var place = direction ? "«" + direction + "»" : "по вашему запросу";

      showToast(
        "Готово! Подбираем туры " + place + ": " + dates + ", " + guests +
        ". Менеджер «Компас» свяжется с вами в течение рабочего дня."
      );
      form.reset();

      setTimeout(function () {
        var target = document.getElementById("destinations");
        if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      }, 900);
    });
  }

  function initNewsletter() {
    var form = document.getElementById("newsletter-form");
    if (!form) return;

    var input = document.getElementById("newsletter-email");
    var note = document.getElementById("newsletter-note");
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var setNote = function (message, isError) {
      note.textContent = message;
      note.classList.toggle("error", Boolean(isError));
      input.classList.toggle("is-invalid", Boolean(isError));
    };

    input.addEventListener("input", function () {
      if (input.classList.contains("is-invalid")) {
        setNote("", false);
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = (input.value || "").trim();

      if (!value) {
        setNote("Укажите электронную почту, чтобы мы отправили подборку.", true);
        input.focus();
        return;
      }

      if (!pattern.test(value)) {
        setNote("Похоже, в адресе опечатка. Пример: you@example.com", true);
        input.focus();
        return;
      }

      setNote("Спасибо! Подписка оформлена — первое письмо придёт в течение дня.", false);
      showToast("Вы подписаны на рассылку «Компас». Добро пожаловать в путешествие!");
      form.reset();
    });
  }
})();
