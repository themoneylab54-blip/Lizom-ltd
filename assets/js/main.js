/* ==========================================================================
   Lizom — main.js
   Vanilla JS, no dependencies. Every effect is progressive: the page reads
   fully without it, and everything respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var html = document.documentElement;
  html.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var supportsIO = "IntersectionObserver" in window;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  /* ------------------------------------------------------------------
     1. Header: hairline on scroll + mobile menu
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = $(".site-header");
    if (!header) return;
    var last = -1;
    function onScroll() {
      var scrolled = window.scrollY > 8;
      if (scrolled !== last) { header.classList.toggle("is-scrolled", scrolled); last = scrolled; }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var toggle = $(".menu-toggle");
    var menu = $("#nav-mobile");
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (open) {
        var first = menu.querySelector("a, button");
        if (first) first.focus();
      } else {
        toggle.focus();
      }
    }
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) setOpen(false);
    });
    window.matchMedia("(min-width: 900px)").addEventListener("change", function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------
     2. Scheme switch: html[data-theme] follows the section crossing the
        middle of the viewport. Sections keep data-scheme as the source.
     ------------------------------------------------------------------ */
  function initThemeSwitch() {
    var sections = $$("[data-scheme]");
    if (!sections.length) return;
    var current = html.getAttribute("data-theme") || sections[0].getAttribute("data-scheme");
    html.setAttribute("data-theme", current);

    if (!supportsIO) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var scheme = entry.target.getAttribute("data-scheme");
        if (scheme && scheme !== current) {
          current = scheme;
          html.setAttribute("data-theme", scheme);
        }
      });
    }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------------
     3. Reveal on scroll
     ------------------------------------------------------------------ */
  function initReveal() {
    var targets = $$(".reveal, .reveal-group, .wordmark-wrap");
    if (!targets.length) return;
    if (!supportsIO || reduceMotion) { targets.forEach(function (t) { t.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ------------------------------------------------------------------
     4. Hero title: word-by-word blur reveal (keeps <em> intact)
     ------------------------------------------------------------------ */
  function initHeroWords() {
    var title = $(".hero-title");
    if (!title || reduceMotion) return;
    var index = 0;
    function wrapWords(node) {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var span = document.createElement("span");
            span.className = "w";
            span.textContent = part;
            span.style.setProperty("--i", index++);
            frag.appendChild(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          child.classList.add("is-split");
          wrapWords(child);
        }
      });
    }
    wrapWords(title);
  }

  /* ------------------------------------------------------------------
     5. Hero stage: pointer parallax on the 3D card stage
     ------------------------------------------------------------------ */
  function initHeroStage() {
    var stage = $(".hero-stage");
    var inner = stage && $(".stage-inner", stage);
    if (!stage || !inner || reduceMotion || !finePointer) return;
    var target = { rx: 0, ry: 0, px: 0, py: 0 };
    var state = { rx: 0, ry: 0, px: 0, py: 0 };
    var raf = null;
    function tick() {
      var k = 0.08;
      state.rx += (target.rx - state.rx) * k;
      state.ry += (target.ry - state.ry) * k;
      state.px += (target.px - state.px) * k;
      state.py += (target.py - state.py) * k;
      inner.style.setProperty("--rx", state.rx.toFixed(2) + "deg");
      inner.style.setProperty("--ry", state.ry.toFixed(2) + "deg");
      inner.style.setProperty("--px", state.px.toFixed(1) + "px");
      inner.style.setProperty("--py", state.py.toFixed(1) + "px");
      var settled = Math.abs(target.rx - state.rx) < 0.01 && Math.abs(target.px - state.px) < 0.05;
      raf = settled ? null : requestAnimationFrame(tick);
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
    var hero = stage.closest(".hero") || stage;
    hero.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      var x = clamp((e.clientX - r.left) / r.width - 0.5, -0.8, 0.8);
      var y = clamp((e.clientY - r.top) / r.height - 0.5, -0.8, 0.8);
      target.ry = x * 8;
      target.rx = -y * 8;
      target.px = x * -14;
      target.py = y * -14;
      schedule();
    });
    hero.addEventListener("pointerleave", function () {
      target.rx = target.ry = target.px = target.py = 0;
      schedule();
    });
  }

  /* ------------------------------------------------------------------
     6. Order journey: draw the route, light the nodes, run the parcel
     ------------------------------------------------------------------ */
  function initJourney() {
    var journey = $(".journey");
    if (!journey) return;
    var motion = $(".route-dot animateMotion", journey);
    var dot = $(".route-dot", journey);
    function activate() {
      journey.classList.add("is-active");
      if (motion && dot && !reduceMotion && typeof motion.beginElement === "function") {
        setTimeout(function () {
          dot.classList.add("is-running");
          try { motion.beginElement(); } catch (err) { /* SMIL unsupported: static route */ }
        }, 600);
      }
    }
    if (!supportsIO || reduceMotion) { activate(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { activate(); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(journey);
  }

  /* ------------------------------------------------------------------
     7. Bento spotlight: gradient border follows the pointer
     ------------------------------------------------------------------ */
  function initSpotlight() {
    if (!finePointer) return;
    $$(".bento-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    });
  }

  /* ------------------------------------------------------------------
     8. Counters (final value lives in the HTML; JS only animates to it)
     ------------------------------------------------------------------ */
  function initCounters() {
    var counters = $$("[data-count]");
    if (!counters.length || reduceMotion || !supportsIO) return;
    function run(el) {
      var end = parseFloat(el.getAttribute("data-count"));
      var duration = 1400;
      var start = null;
      function frame(ts) {
        if (!start) start = ts;
        var p = clamp((ts - start) / duration, 0, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased);
        if (p < 1) requestAnimationFrame(frame); else el.textContent = end;
      }
      el.textContent = "0";
      requestAnimationFrame(frame);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { io.observe(c); });
  }

  /* ------------------------------------------------------------------
     9. Operations: sticky panel follows the active step
     ------------------------------------------------------------------ */
  function initOps() {
    var steps = $$(".ops-step");
    var visuals = $$(".ops-visual");
    if (!steps.length || !visuals.length) return;
    // Prepare every stroke so it can draw itself: pathLength normalises dash units.
    visuals.forEach(function (v) {
      $$("path, rect, circle, line", v).forEach(function (shape, k) {
        shape.setAttribute("pathLength", "1");
        shape.classList.add("draw");
        shape.style.setProperty("--i", k);
      });
    });
    var current = -1;
    function setActive(i) {
      if (i === current) return;
      current = i;
      steps.forEach(function (s, j) { s.classList.toggle("is-active", i === j); });
      visuals.forEach(function (v, j) {
        var on = i === j;
        v.classList.toggle("is-active", on);
        v.setAttribute("aria-hidden", on ? "false" : "true");
        if (on) { var label = $(".ops-label", v); if (label) scramble(label, true); }
      });
    }
    if (!supportsIO) { setActive(0); return; }
    var panel = $(".ops-panel");
    var seen = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { if (current < 0) setActive(0); seen.disconnect(); }
    }, { threshold: 0.2 });
    seen.observe(panel || steps[0]);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(steps.indexOf(entry.target));
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------------
     10. Magnetic buttons (fine pointer only)
     ------------------------------------------------------------------ */
  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$(".btn-magnetic").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.setProperty("--mx", (x * 5).toFixed(1) + "px");
        btn.style.setProperty("--my", (y * 5).toFixed(1) + "px");
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.setProperty("--mx", "0px");
        btn.style.setProperty("--my", "0px");
      });
    });
  }

  /* ------------------------------------------------------------------
     11. Cursor halo on dark sections
     ------------------------------------------------------------------ */
  function initHalo() {
    if (!finePointer || reduceMotion) return;
    var halo = document.createElement("div");
    halo.className = "halo";
    halo.setAttribute("aria-hidden", "true");
    document.body.appendChild(halo);
    var target = { x: window.innerWidth / 2, y: window.innerHeight * 0.3 };
    var state = { x: target.x, y: target.y };
    var raf = null;
    function tick() {
      state.x += (target.x - state.x) * 0.12;
      state.y += (target.y - state.y) * 0.12;
      halo.style.setProperty("--hx", state.x.toFixed(0) + "px");
      halo.style.setProperty("--hy", state.y.toFixed(0) + "px");
      var settled = Math.abs(target.x - state.x) < 0.5 && Math.abs(target.y - state.y) < 0.5;
      raf = settled ? null : requestAnimationFrame(tick);
    }
    window.addEventListener("pointermove", function (e) {
      target.x = e.clientX; target.y = e.clientY;
      halo.classList.add("is-on");
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener("pointerleave", function () { halo.classList.remove("is-on"); });
  }

  /* ------------------------------------------------------------------
     13. Optional legal fields: show only once the placeholder is filled
     ------------------------------------------------------------------ */
  function initOptionalFields() {
    $$("[data-optional]").forEach(function (row) {
      var value = row.querySelector("[data-value]");
      var text = value ? value.textContent.trim() : "";
      var filled = text && text.indexOf("{{") === -1;
      row.hidden = !filled;
    });
  }

  /* ------------------------------------------------------------------
     14. Table of contents scroll-spy (legal pages)
     ------------------------------------------------------------------ */
  function initToc() {
    var toc = $(".toc");
    if (!toc || !supportsIO) return;
    var links = $$("a[href^='#']", toc);
    var headings = links.map(function (l) { return document.getElementById(l.getAttribute("href").slice(1)); }).filter(Boolean);
    if (!headings.length) return;
    var active = null;
    function setActive(id) {
      if (id === active) return;
      active = id;
      links.forEach(function (l) {
        if (l.getAttribute("href") === "#" + id) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
      });
    }
    var io = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });
    headings.forEach(function (h) { io.observe(h); });
    setActive(headings[0].id);
  }

  /* ------------------------------------------------------------------
     15. Contact page: preselect topic from ?topic=
     ------------------------------------------------------------------ */
  function initTopicParam() {
    var select = $("#subject");
    if (!select) return;
    var topic = new URLSearchParams(window.location.search).get("topic");
    if (!topic) return;
    var map = { order: "Order or delivery", returns: "Returns and refunds", partnership: "Partnership or wholesale", compliance: "Compliance or verification", press: "Press" };
    var label = map[topic];
    if (!label) return;
    Array.prototype.forEach.call(select.options, function (o) { if (o.value === label) select.value = label; });
  }

  /* ------------------------------------------------------------------
     16. Reading progress bar
     ------------------------------------------------------------------ */
  function initProgress() {
    var bar = document.createElement("div");
    bar.className = "progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    var raf = null;
    function update() {
      raf = null;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      bar.style.setProperty("--p", p.toFixed(4));
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", function () { if (!raf) raf = requestAnimationFrame(update); });
    update();
  }

  /* ------------------------------------------------------------------
     17. Text scramble: mono labels "decode" into place.
         The real text stays in a visually-hidden span for assistive tech.
     ------------------------------------------------------------------ */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>-_=+*";
  function scramble(el, again) {
    if (reduceMotion) return;
    var vis = el.querySelector("[data-scramble-vis]");
    var text;
    if (!vis) {
      if (el.children.length) return;
      text = el.textContent;
      var real = document.createElement("span");
      real.className = "visually-hidden";
      real.textContent = text;
      vis = document.createElement("span");
      vis.setAttribute("aria-hidden", "true");
      vis.setAttribute("data-scramble-vis", "");
      vis.textContent = text;
      el.textContent = "";
      el.appendChild(real);
      el.appendChild(vis);
      el.setAttribute("data-text", text);
    } else {
      if (!again && el.getAttribute("data-scrambled")) return;
      text = el.getAttribute("data-text") || vis.textContent;
    }
    el.setAttribute("data-scrambled", "1");
    var start = null, duration = 620, token = (el._scrambleToken = (el._scrambleToken || 0) + 1);
    function frame(ts) {
      if (token !== el._scrambleToken) return;
      if (!start) start = ts;
      var p = clamp((ts - start) / duration, 0, 1);
      var settled = Math.floor(p * text.length);
      var out = "";
      for (var i = 0; i < text.length; i++) {
        var c = text.charAt(i);
        out += (i < settled || c === " " || c === "\u00B7" || c === "-") ? c : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      vis.textContent = out;
      if (p < 1) requestAnimationFrame(frame); else vis.textContent = text;
    }
    requestAnimationFrame(frame);
  }
  function initScramble() {
    if (reduceMotion) return;
    var targets = $$(".eyebrow, .hero-trust li");
    if (!targets.length) return;
    if (!supportsIO) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { scramble(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ------------------------------------------------------------------
     18. Pointer tilt on cards (fine pointer only)
     ------------------------------------------------------------------ */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    $$(".product-media, .bento-card").forEach(function (card) {
      card.classList.add("tilt");
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ty", (x * 6).toFixed(2) + "deg");
        card.style.setProperty("--tx", (-y * 6).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--tx", "0deg");
        card.style.setProperty("--ty", "0deg");
      });
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    initHeader();
    initThemeSwitch();
    initHeroWords();
    initReveal();
    initHeroStage();
    initJourney();
    initSpotlight();
    initCounters();
    initOps();
    initMagnetic();
    initHalo();
    initOptionalFields();
    initToc();
    initTopicParam();
    initProgress();
    initScramble();
    initTilt();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
