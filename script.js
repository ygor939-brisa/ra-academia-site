/* RA Academia, Unidade Novo Horizonte
   Rolagem suave (Lenis), textos animados, matriz de pontos, letreiro e revelação em camadas (GSAP + ScrollTrigger).
   Sem tela de carregamento. */
(function () {
  "use strict";

  const WHATSAPP = "5511939200474";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compactMotion = window.matchMedia("(max-width: 600px)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- WhatsApp: cada botão abre a conversa com uma mensagem pronta ---------- */
  document.querySelectorAll("[data-wa]").forEach((a) => {
    a.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(a.dataset.wa);
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* ---------- Menu ---------- */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const setMenu = (open) => {
    nav.classList.toggle("open", open);
    document.documentElement.classList.toggle("menu-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  };
  navToggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  document.querySelectorAll("#navLinks a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  const onScrollNav = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Hoje: aberto/fechado e destaque na grade ---------- */
  (function today() {
    const d = new Date();
    const day = d.getDay();
    const m = d.getHours() * 60 + d.getMinutes();
    const weekday = day >= 1 && day <= 5;
    const open = weekday ? m >= 300 && m < 1380 : m >= 540 && m < 840;

    let next;
    if (open) next = "Aberto agora · fecha às " + (weekday ? "23:00" : "14:00");
    else {
      const before = weekday ? m < 300 : m < 540;
      if (before) next = "Fechado agora · abre hoje às " + (weekday ? "05:00" : "09:00");
      else next = "Fechado agora · abre amanhã às " + (day >= 1 && day <= 4 ? "05:00" : day === 0 ? "05:00" : "09:00");
    }
    const el = document.getElementById("openNow");
    el.classList.toggle("on", open);
    el.querySelector("span").textContent = next;

    document.querySelectorAll(".day").forEach((col) => {
      if (col.dataset.day.split(",").map(Number).includes(day)) col.classList.add("today");
    });
  })();

  /* ---------- Matriz de pontos (canvas) ---------- */
  function dotMatrix(wrapper, { color = "#ff4200", dotSize = 2, spacing = 15, soft = false } = {}) {
    const canvas = document.createElement("canvas");
    wrapper.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, sp = spacing, cols = 0, rows = 0, visible = true;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const t0 = performance.now();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrapper.clientWidth; h = wrapper.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sp = w < 700 ? spacing * 0.9 : spacing;
      cols = Math.ceil(w / sp) + 1; rows = Math.ceil(h / sp) + 1;
    }
    resize();
    window.addEventListener("resize", resize);

    const host = wrapper.parentElement;
    host.addEventListener("pointermove", (e) => { const r = wrapper.getBoundingClientRect(); mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top; });
    host.addEventListener("pointerleave", () => { mouse.tx = -9999; mouse.ty = -9999; });
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(wrapper);

    const strength = soft ? 0.45 : 0.6;
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) return;
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.1;
      mouse.y += (mouse.ty - mouse.y) * 0.1;
      const reveal = reduce ? 1e9 : t * Math.max(w, h) * 0.8;
      const ox = w * 0.78, oy = h * 0.45;
      ctx.fillStyle = color;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * sp, y = j * sp;
          const dx = x - ox, dy = y - oy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > reveal) continue;
          const wave = Math.sin(x * 0.011 + y * 0.007 - t * 1.1) * 0.5 + 0.5;
          const wave2 = Math.sin(y * 0.017 - x * 0.005 + t * 0.7) * 0.5 + 0.5;
          let a = 0.05 + Math.pow(wave * wave2, 2) * strength;
          a *= 0.25 + 0.75 * Math.min(1, x / w + 0.1);
          let s = dotSize;
          const mx = x - mouse.x, my = y - mouse.y;
          const md = Math.sqrt(mx * mx + my * my);
          if (md < 150) { const k = 1 - md / 150; a = Math.min(1, a + k * 0.7); s = dotSize * (1 + k); }
          const edge = reveal - dist;
          if (edge < 50) a = Math.min(1, a + (1 - edge / 50) * 0.5);
          ctx.globalAlpha = a;
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  document.querySelectorAll("[data-dots]").forEach((el) => dotMatrix(el, { soft: el.hasAttribute("data-soft") }));

  /* ---------- Contadores ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const end = +e.target.dataset.count, s = performance.now();
      const step = (n) => { const p = Math.min(1, (n - s) / 1400); e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll("[data-count]").forEach((c) => countIO.observe(c));

  if (reduce) return;

  /* ---------- Entrada dos blocos (CSS + IntersectionObserver, sem conflito com hover) ---------- */
  document.documentElement.classList.add("js-anim");
  document.querySelectorAll(".classes, .plans-grid, .week, .hours, .about-stats").forEach((g) => {
    Array.from(g.children).forEach((c, i) => c.style.setProperty("--d", i * 0.08 + "s"));
  });
  const revIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revIO.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => revIO.observe(el));

  if (!hasGsap) {
    // Sem internet para o GSAP: mostra os textos normalmente
    return;
  }

  /* ---------- GSAP ---------- */
  const { gsap, ScrollTrigger } = window;
  document.documentElement.classList.add("gsap-on");
  gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        const target = id === "#topo" ? 0 : document.querySelector(id);
        if (target === null) return;
        e.preventDefault();
        const isHeaderNavigation = Boolean(a.closest("#nav"));
        lenis.scrollTo(target, {
          offset: id === "#topo" ? 0 : -70,
          immediate: isHeaderNavigation,
        });
      });
    });
  }

  function splitWords(el) {
    const words = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w";
            const wi = document.createElement("span"); wi.className = "wi"; wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w); words.push(wi);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== "BR") walk(child);
      });
    };
    walk(el);
    return words;
  }

  function splitChars(el) {
    const chars = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const ch of child.textContent) {
            if (/\s/.test(ch)) { frag.appendChild(document.createTextNode(ch)); continue; }
            const s = document.createElement("span"); s.textContent = ch; s.style.display = "inline-block";
            frag.appendChild(s); chars.push(s);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains("pulse")) walk(child);
      });
    };
    walk(el);
    return chars;
  }

  document.fonts.ready.then(() => {
    if (compactMotion) {
      ScrollTrigger.refresh();
      return;
    }
    document.querySelectorAll("[data-copy]").forEach((el) => {
      const words = splitWords(el);
      gsap.set(words, { yPercent: 110 });
      const onLoad = el.hasAttribute("data-copy-load");
      const anim = gsap.to(words, { yPercent: 0, duration: 1.1, stagger: 0.04, ease: "power4.out", delay: Number(el.dataset.copyDelay || 0), paused: !onLoad });
      if (!onLoad) ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => anim.play() });
    });
    document.querySelectorAll("[data-flicker]").forEach((el) => {
      const chars = splitChars(el);
      gsap.set(chars, { opacity: 0 });
      const inHero = !!el.closest(".hero");
      const anim = gsap.to(chars, { opacity: 1, duration: 0.05, ease: "power2.inOut", stagger: { amount: 0.5, from: "random" }, paused: !inHero });
      if (!inHero) ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => anim.play() });
    });
    ScrollTrigger.refresh();
  });

  /* Hero */
  gsap.from(".hero-mark", { y: 120, opacity: 0, scale: 0.92, duration: 1.3, ease: "power3.out", delay: 0.25 });
  gsap.to(".hero-copy", { y: 110, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-mark .logo", { y: -70, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* Marca d'água do bloco laranja */
  gsap.fromTo(".about-mark", { rotate: -8, y: 60 }, { rotate: 4, y: -40, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true } });

  /* Letreiro */
  const r1 = document.querySelector(".marquee-row.r1");
  const r2 = document.querySelector(".marquee-row.r2");
  ScrollTrigger.create({
    trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(r1, { x: -p * (r1.scrollWidth - window.innerWidth) * 0.6 });
      gsap.set(r2, { x: -(1 - p) * (r2.scrollWidth - window.innerWidth) * 0.6 });
    },
  });

  /* Barras de horário */
  gsap.utils.toArray(".hours-bar i").forEach((bar) => {
    gsap.from(bar, { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: "power3.inOut", scrollTrigger: { trigger: bar, start: "top 92%", once: true } });
  });

  /* Revelação em camadas: uma única cena, sem prender a rolagem */
  (function peel() {
    const section = document.querySelector(".peel");
    const stage = section.querySelector(".peel-stage");
    const layers = Array.from(section.querySelectorAll(".mask"));
    const intro = Array.from(section.querySelectorAll(".peel-intro h2"));
    const header = section.querySelector(".peel-header h2");
    const logo = section.querySelector(".l4 .logo");
    const words = splitWords(header);
    header.querySelectorAll(".w").forEach((w) => (w.style.overflow = "visible"));
    gsap.set(words, { opacity: 0 });
    layers.forEach((l, i) => gsap.set(l, { scale: 0.85 - i * 0.18 }));

    const state = { progress: 0 };
    const render = () => {
        const p = state.progress;
        gsap.set(stage, { scale: p, borderRadius: p < 0.25 ? "3rem" : p > 0.9 ? "0rem" : 3 * (1 - (p - 0.25) / 0.65) + "rem" });
        const lp = Math.min(p / 0.9, 1);
        layers.forEach((l, i) => { const s0 = 0.85 - i * 0.18; gsap.set(l, { scale: s0 + lp * (1 - s0) }); });
        if (window.innerWidth < 860) {
          gsap.set(intro[0], { y: -lp * window.innerHeight * 0.55, x: 0 });
          gsap.set(intro[1], { y: lp * window.innerHeight * 0.55, x: 0 });
        } else {
          gsap.set(intro[0], { x: -lp * window.innerWidth * 0.55, y: 0 });
          gsap.set(intro[1], { x: lp * window.innerWidth * 0.55, y: 0 });
        }
        gsap.set(logo, { opacity: p < 0.55 ? 1 : Math.max(0, 1 - (p - 0.55) / 0.1), scale: 1 + p * 0.3 });
        const hp = p < 0.6 ? 0 : p > 0.9 ? 1 : (p - 0.6) / 0.3;
        const n = words.length;
        words.forEach((w, i) => { const a = i / n, b = (i + 1) / n; gsap.set(w, { opacity: hp >= b ? 1 : hp >= a ? (hp - a) / (b - a) : 0 }); });
    };
    render();

    ScrollTrigger.create({
      trigger: section,
      start: "top 78%",
      once: true,
      onEnter: () => gsap.to(state, {
        progress: 1,
        duration: 1.6,
        ease: "power3.inOut",
        onUpdate: render,
        onComplete: () => section.classList.add("is-complete"),
      }),
    });
  })();

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
