/* =========================================================
   GameLand v5 — Animations
   Reveal Scroll, Count-Up, Card Tilt, Page Transitions
   ========================================================= */

'use strict';

const Anim = {

  /* =====================================================
     Reveal on Scroll (IntersectionObserver)
     ===================================================== */
  _revealObserver: null,

  initReveal(options = {}) {
    if (this._revealObserver) this._revealObserver.disconnect();

    const opts = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
      ...options
    };

    this._revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.revealDelay || 0;
          setTimeout(() => {
            el.classList.add('revealed');
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, +delay);
          this._revealObserver.unobserve(el);
        }
      });
    }, opts);

    return this._revealObserver;
  },

  reveal(selector = '[data-reveal]', options = {}) {
    const els = $$(selector);
    if (!els.length) return;

    // init observer
    if (!this._revealObserver) this.initReveal(options);

    els.forEach(el => {
      // تنظیم اولیه
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s cubic-bezier(0.2, 0.9, 0.3, 1), transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1)';
      if (el.dataset.revealDelay) {
        el.style.transitionDelay = (el.dataset.revealDelay / 1000) + 's';
      }
      this._revealObserver.observe(el);
    });
  },

  /* =====================================================
     Count-Up Number
     ===================================================== */
  countUp(el, target, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (!el) return;

    const opts = {
      duration: 1200,
      start: 0,
      formatter: (v) => formatNumber(Math.round(v)),
      easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic
      ...options
    };

    const start = performance.now();
    const startVal = opts.start;
    const diff = target - startVal;

    const update = (now) => {
      const progress = Math.min(1, (now - start) / opts.duration);
      const value = startVal + diff * opts.easing(progress);
      el.textContent = opts.formatter(value);
      if (progress < 1) requestAnimationFrame(update);
      else {
        el.textContent = opts.formatter(target);
        el.classList.add('count-up-bounce');
        setTimeout(() => el.classList.remove('count-up-bounce'), 300);
      }
    };

    requestAnimationFrame(update);
  },

  countUpAll(root = document) {
    $$('[data-count]', root).forEach(el => {
      const target = +(el.dataset.count || 0);
      const duration = +(el.dataset.countDuration || 1200);
      const formatter = el.dataset.countFormat === 'plain'
        ? (v) => String(Math.round(v))
        : (v) => formatNumber(Math.round(v));
      this.countUp(el, target, { duration, formatter });
    });
  },

  /* =====================================================
     Card 3D Tilt (Mouse)
     ===================================================== */
  cardTilt(el, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (!el || Env.isTouch()) return;

    const opts = {
      maxTilt: 8,
      scale: 1.02,
      perspective: 1000,
      ...options
    };

    const wrap = el.closest('.card-tilt-wrap') || el;
    wrap.style.perspective = opts.perspective + 'px';

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const tiltX = (0.5 - y) * opts.maxTilt * 2;
      const tiltY = (x - 0.5) * opts.maxTilt * 2;

      el.style.transform = `
        perspective(${opts.perspective}px)
        rotateX(${tiltX}deg)
        rotateY(${tiltY}deg)
        scale(${opts.scale})
      `;
    };

    const onLeave = () => {
      el.style.transform = '';
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  },

  initAllCardTilts(root = document) {
    $$('[data-tilt]', root).forEach(el => this.cardTilt(el));
  },

  /* =====================================================
     Magnetic Hover
     ===================================================== */
  magnetic(el, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (!el || Env.isTouch()) return;

    const opts = {
      strength: 0.3,
      maxMove: 20,
      ...options
    };

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let dx = (e.clientX - cx) * opts.strength;
      let dy = (e.clientY - cy) * opts.strength;

      dx = clamp(dx, -opts.maxMove, opts.maxMove);
      dy = clamp(dy, -opts.maxMove, opts.maxMove);

      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    const onLeave = () => {
      el.style.transform = '';
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  },

  initMagnetic(root = document) {
    $$('.magnetic', root).forEach(el => this.magnetic(el));
  },

  /* =====================================================
     Page Transition
     ===================================================== */
  pageEnter(el) {
    if (!el) return;
    el.classList.remove('anim-page-enter');
    void el.offsetWidth; // force reflow
    el.classList.add('anim-page-enter');
  },

  /* =====================================================
     Stagger Children
     ===================================================== */
  stagger(container, selector = ':scope > *', options = {}) {
    if (typeof container === 'string') container = $(container);
    if (!container) return;

    const opts = {
      delay: 50,
      initialDelay: 0,
      animation: 'cardEntry',
      ...options
    };

    const children = $$(selector, container);
    children.forEach((child, i) => {
      child.style.animation = 'none';
      void child.offsetWidth;
      child.style.animation = `${opts.animation} 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) both`;
      child.style.animationDelay = (opts.initialDelay + i * opts.delay) + 'ms';
    });
  },

  /* =====================================================
     Flip Animation (عدد تغییر کرد)
     ===================================================== */
  flip(el) {
    if (!el) return;
    el.classList.remove('anim-pop');
    void el.offsetWidth;
    el.classList.add('anim-pop');
  },

  /* =====================================================
     Shake
     ===================================================== */
  shake(el, duration = 400) {
    if (!el) return;
    el.classList.remove('anim-shake');
    void el.offsetWidth;
    el.classList.add('anim-shake');
    setTimeout(() => el.classList.remove('anim-shake'), duration);
  },

  /* =====================================================
     Pulse
     ===================================================== */
  pulse(el, duration = 1000) {
    if (!el) return;
    el.classList.add('anim-pulse');
    setTimeout(() => el.classList.remove('anim-pulse'), duration);
  },

  /* =====================================================
     Toast/Fly elements
     ===================================================== */
  flyTo(fromEl, toEl, options = {}) {
    if (!fromEl || !toEl) return;

    const from = fromEl.getBoundingClientRect();
    const to = toEl.getBoundingClientRect();

    const clone = fromEl.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.left = from.left + 'px';
    clone.style.top = from.top + 'px';
    clone.style.width = from.width + 'px';
    clone.style.height = from.height + 'px';
    clone.style.zIndex = '99999';
    clone.style.pointerEvents = 'none';
    clone.style.transition = 'all 0.8s cubic-bezier(0.2, 0.9, 0.3, 1.1)';

    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      clone.style.left = to.left + 'px';
      clone.style.top = to.top + 'px';
      clone.style.width = to.width + 'px';
      clone.style.height = to.height + 'px';
      clone.style.opacity = '0.3';
      clone.style.transform = 'scale(0.5)';
    });

    setTimeout(() => clone.remove(), 900);
  },

  /* =====================================================
     Confetti Enhanced
     ===================================================== */
  burstConfetti(el, count = 30) {
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position: fixed;
        left: ${cx}px;
        top: ${cy}px;
        width: 8px;
        height: 8px;
        background: ${rndColor()};
        border-radius: ${Math.random() < 0.5 ? '50%' : '2px'};
        z-index: 99999;
        pointer-events: none;
        transition: all ${800 + Math.random() * 400}ms cubic-bezier(0.2, 0.9, 0.3, 1);
      `;

      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 200;

      document.body.appendChild(p);

      requestAnimationFrame(() => {
        p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + 100}px) rotate(${Math.random() * 720}deg)`;
        p.style.opacity = '0';
      });

      setTimeout(() => p.remove(), 1400);
    }
  },

  /* =====================================================
     Init All
     ===================================================== */
  init() {
    this.reveal();
    this.countUpAll();
    this.initAllCardTilts();
    this.initMagnetic();
    Log.info('Animations initialized');
  }
};

Log.info('Animations module loaded');