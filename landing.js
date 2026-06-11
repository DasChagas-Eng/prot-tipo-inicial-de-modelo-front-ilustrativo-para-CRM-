'use strict';
/* ════════════════════════════════════════════════════════
   VB COSMÉTICOS — landing.js
   Fluidez e movimento da landing: scroll com inércia (Lenis),
   reveals por interseção, contadores, parallax do mockup e
   botões magnéticos. Tudo desliga com prefers-reduced-motion.
════════════════════════════════════════════════════════ */

(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── scroll suave com inércia ── */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* âncoras internas passam pelo Lenis (offset compensa o nav fixo) */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const alvo = document.querySelector(a.getAttribute('href'));
      if (!alvo) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(alvo, { offset: -72 });
      else alvo.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ── reveal do hero no load ── */
  const carregou = () => document.body.classList.add('loaded');
  if (document.readyState === 'complete') carregou();
  else {
    window.addEventListener('load', carregou);
    setTimeout(carregou, 900); // fallback se fontes/CDN demorarem
  }

  /* ── reveals por scroll ── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal, .ai-chat').forEach(el => io.observe(el));

  /* ── contadores ── */
  const cio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      cio.unobserve(en.target);
      const el  = en.target;
      const fim = +el.dataset.count;
      if (reduced || fim === 0) { el.textContent = fim; return; }
      const dur = 1300, t0 = performance.now();
      (function tick(t) {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(fim * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  /* ── parallax do mockup (atraso suave em relação ao scroll) ── */
  const visual = document.getElementById('heroVisual');
  if (visual && !reduced) {
    let alvoY = 0, y = 0, ativo = false;
    const medir = () => {
      const limite = visual.offsetTop + visual.offsetHeight;
      alvoY = window.scrollY < limite ? window.scrollY * 0.07 : alvoY;
    };
    const loop = () => {
      y += (alvoY - y) * 0.075;
      visual.style.transform = `translateY(${y.toFixed(2)}px)`;
      if (Math.abs(alvoY - y) > 0.05 || ativo) requestAnimationFrame(loop);
      else ativo = false;
    };
    window.addEventListener('scroll', () => {
      medir();
      if (!ativo) { ativo = true; requestAnimationFrame(() => { ativo = false; loop(); }); }
    }, { passive: true });
  }

  /* ── botões magnéticos (atração sutil ao cursor) ── */
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.magnet').forEach(btn => {
      btn.style.transition = 'transform .25s cubic-bezier(.16,1,.3,1), background .25s';
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * 0.16;
        const dy = (e.clientY - r.top - r.height / 2) * 0.28;
        btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }
})();
