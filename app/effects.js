/* =========================================================
   GameLand v5.1 — Effects (Enhanced)
   Ripple, Particles, Aurora, Confetti+ Pro, Skeleton
   ========================================================= */

'use strict';

const Effects = {

  /* =====================================================
     Ripple Effect روی کلیک
     ===================================================== */
  initRipples(root = document) {
    root.addEventListener('click', (e) => {
      const target = e.target.closest('.btn, .icon-btn, [data-ripple], .ripple');
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.5;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
      `;

      target.style.position = 'relative';
      target.style.overflow = 'hidden';
      target.appendChild(ripple);

      setTimeout(() => ripple.remove(), 700);
    });
  },

  /* =====================================================
     Floating Particles — تقویت شده
     ===================================================== */
  particles: null,

  initParticles(options = {}) {
    if (this.particles) this.particles.remove();

    const isMobile = Env.isMobile();

    const opts = {
      count: isMobile ? 12 : 25,  // 🎯 روی موبایل کمتر
      colors: ['#7c5cff', '#00e5ff', '#ff3b7b', '#22c55e', '#eab308', '#a855f7'],
      minSize: 4,
      maxSize: 8,
      ...options
    };

    const container = document.createElement('div');
    container.className = 'floating-particles';
    document.body.appendChild(container);
    this.particles = container;

    for (let i = 0; i < opts.count; i++) {
      const p = document.createElement('div');
      p.className = 'floating-particle';

      const size = rndRange(opts.minSize, opts.maxSize);
      const color = choice(opts.colors);
      const px = rnd(100);            // موقعیت افقی (vw)
      const pdx = rndRange(-100, 100); // انحراف افقی حین حرکت
      const delay = rndRange(0, 12);
      const duration = rndRange(10, 22);

      // 🎯 نکته: همه چیز با CSS var و transform
      p.style.setProperty('--px', px + 'vw');
      p.style.setProperty('--pdx', pdx + 'px');
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.background = color;
      p.style.borderRadius = '50%';
      p.style.animationDuration = duration + 's';
      p.style.animationDelay = '-' + delay + 's';
      // 🎯 حذف box-shadow (سنگین) → به جاش یک glow ساده با filter drop-shadow؟
      // نه! حتی drop-shadow هم سنگینه. صرفاً رنگ روشن.
      p.style.opacity = '0.55';

      container.appendChild(p);
    }

    return container;
  },

  stopParticles() {
    if (this.particles) {
      this.particles.remove();
      this.particles = null;
    }
  },

  /* =====================================================
     Aurora — تقویت شده
     ===================================================== */
  aurora: null,

  initAurora() {
    if (this.aurora) return;

    const aurora = document.createElement('div');
    aurora.className = 'aurora-bg';
    aurora.innerHTML = `
      <div class="aurora-blob aurora-blob-1"></div>
      <div class="aurora-blob aurora-blob-2"></div>
      <div class="aurora-blob aurora-blob-3"></div>
    `;
    document.body.appendChild(aurora);
    this.aurora = aurora;
  },

  stopAurora() {
    if (this.aurora) {
      this.aurora.remove();
      this.aurora = null;
    }
  },

  /* =====================================================
     Confetti Pro
     ===================================================== */
  confettiPro(type = 'burst', options = {}) {
    if (typeof Confetti === 'undefined') return;

    switch (type) {
      case 'burst':     Confetti.burst(options.count || 100); break;
      case 'rain':      Confetti.rain(options.count || 150, options.duration || 4000); break;
      case 'fireworks': Confetti.fireworks(options.duration || 5000); break;
      case 'stars':     this._confettiStars(options); break;
      case 'rings':     this._confettiRings(options); break;
      case 'coins':     this._confettiCoins(options); break;
      case 'emoji':     this._confettiEmoji(options); break;
      default:          Confetti.burst(100);
    }
  },

  _confettiStars(options = {}) {
    const count = options.count || 50;
    const origin = options.origin || { x: innerWidth / 2, y: innerHeight / 2 };

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.textContent = choice(['⭐', '🌟', '✨', '💫']);
      star.style.cssText = `
        position: fixed;
        left: ${origin.x}px;
        top: ${origin.y}px;
        font-size: ${16 + Math.random() * 24}px;
        pointer-events: none;
        z-index: 99999;
        transition: all ${1000 + Math.random() * 800}ms cubic-bezier(0.2, 0.9, 0.3, 1);
        filter: drop-shadow(0 0 12px rgba(234, 179, 8, 0.9));
      `;

      const angle = Math.random() * Math.PI * 2;
      const dist = 180 + Math.random() * 300;
      const rot = (Math.random() - 0.5) * 1080;

      document.body.appendChild(star);

      requestAnimationFrame(() => {
        star.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + 200}px) rotate(${rot}deg) scale(0.3)`;
        star.style.opacity = '0';
      });

      setTimeout(() => star.remove(), 1800);
    }
  },

  _confettiEmoji(options = {}) {
    const emojis = options.emojis || ['🎉', '🎊', '✨', '⭐', '🌟', '💫', '🎈'];
    const count = options.count || 30;
    const origin = options.origin || { x: innerWidth / 2, y: innerHeight / 2 };

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.textContent = choice(emojis);
      el.style.cssText = `
        position: fixed;
        left: ${origin.x}px;
        top: ${origin.y}px;
        font-size: ${20 + Math.random() * 24}px;
        pointer-events: none;
        z-index: 99999;
        transition: all ${1000 + Math.random() * 1000}ms cubic-bezier(0.2, 0.9, 0.3, 1);
      `;

      const angle = Math.random() * Math.PI * 2;
      const dist = 150 + Math.random() * 300;

      document.body.appendChild(el);

      requestAnimationFrame(() => {
        el.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + 250}px) rotate(${Math.random() * 720}deg) scale(0.5)`;
        el.style.opacity = '0';
      });

      setTimeout(() => el.remove(), 2000);
    }
  },

  _confettiRings(options = {}) {
    const origin = options.origin || { x: innerWidth / 2, y: innerHeight / 2 };
    const count = options.count || 3;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const ring = document.createElement('div');
        ring.style.cssText = `
          position: fixed;
          left: ${origin.x}px;
          top: ${origin.y}px;
          width: 40px;
          height: 40px;
          border: 4px solid ${rndColor()};
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          pointer-events: none;
          z-index: 99999;
          opacity: 0.9;
          transition: all 1.2s cubic-bezier(0.2, 0.9, 0.3, 1);
        `;

        document.body.appendChild(ring);

        requestAnimationFrame(() => {
          ring.style.transform = 'translate(-50%, -50%) scale(20)';
          ring.style.opacity = '0';
          ring.style.borderWidth = '1px';
        });

        setTimeout(() => ring.remove(), 1400);
      }, i * 200);
    }
  },

  _confettiCoins(options = {}) {
    const origin = options.origin || { x: innerWidth / 2, y: innerHeight / 2 };
    const count = options.count || 25;

    for (let i = 0; i < count; i++) {
      const coin = document.createElement('div');
      coin.textContent = '🪙';
      coin.style.cssText = `
        position: fixed;
        left: ${origin.x}px;
        top: ${origin.y}px;
        font-size: ${18 + Math.random() * 16}px;
        pointer-events: none;
        z-index: 99999;
        transition: all ${1200 + Math.random() * 800}ms cubic-bezier(0.2, 0.9, 0.3, 1);
        filter: drop-shadow(0 0 8px #eab308);
      `;

      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 250;

      document.body.appendChild(coin);

      requestAnimationFrame(() => {
        coin.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + 250}px) rotate(${Math.random() * 1080}deg)`;
        coin.style.opacity = '0';
      });

      setTimeout(() => coin.remove(), 2000);
    }
  },

  /* =====================================================
     Coin Burst
     ===================================================== */
  coinBurst(el, count = 15) {
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
      const coin = document.createElement('div');
      coin.textContent = '🪙';
      coin.style.cssText = `
        position: fixed;
        left: ${cx}px;
        top: ${cy}px;
        font-size: 20px;
        pointer-events: none;
        z-index: 99999;
        transition: all 1.2s cubic-bezier(0.2, 0.9, 0.3, 1);
        filter: drop-shadow(0 0 10px #eab308);
      `;

      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 150;

      document.body.appendChild(coin);

      requestAnimationFrame(() => {
        coin.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 100}px) scale(0.5)`;
        coin.style.opacity = '0';
      });

      setTimeout(() => coin.remove(), 1300);
    }
  },

  /* =====================================================
     Skeleton
     ===================================================== */
  skeleton(container, count = 4) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const sk = document.createElement('div');
      sk.className = 'skeleton skeleton-card';
      container.appendChild(sk);
    }
  },

  /* =====================================================
     Level Up
     ===================================================== */
  levelUpEffect() {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      inset: 0;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.35), transparent 70%);
      pointer-events: none;
      z-index: 99999;
      opacity: 0;
      transition: opacity 0.6s ease;
    `;
    document.body.appendChild(flash);

    requestAnimationFrame(() => {
      flash.style.opacity = '1';
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 700);
      }, 250);
    });

    this.confettiPro('stars', { count: 40 });
    this.confettiPro('rings');
  },

  /* =====================================================
     Achievement Popup
     ===================================================== */
  achievementEffect(icon, name) {
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.3);
      background: linear-gradient(160deg, rgba(124, 92, 255, 0.98), rgba(0, 229, 255, 0.92));
      padding: 30px 40px;
      border-radius: 26px;
      color: #fff;
      text-align: center;
      font-family: inherit;
      z-index: 99999;
      pointer-events: none;
      box-shadow:
        0 25px 80px rgba(124, 92, 255, 0.6),
        0 0 100px rgba(0, 229, 255, 0.5);
      opacity: 0;
      transition: all 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.3);
    `;

    popup.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 12px; filter: drop-shadow(0 0 20px rgba(255,255,255,0.8));">${icon}</div>
      <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px; opacity: 0.9;">🏆 دستاورد جدید!</div>
      <div style="font-size: 22px; font-weight: 900;">${name}</div>
    `;

    document.body.appendChild(popup);

    requestAnimationFrame(() => {
      popup.style.transform = 'translate(-50%, -50%) scale(1)';
      popup.style.opacity = '1';
    });

    // ذرات
    this.confettiPro('stars', { count: 30, origin: { x: innerWidth / 2, y: innerHeight / 2 } });

    setTimeout(() => {
      popup.style.transform = 'translate(-50%, -50%) scale(0.8)';
      popup.style.opacity = '0';
      setTimeout(() => popup.remove(), 700);
    }, 2200);
  },

  /* =====================================================
     Init
     ===================================================== */
  init() {
    this.initRipples();
    this.initAurora();
    this.initParticles({
      count: Env.isMobile() ? 12 : 25,
      minSize: 4,
      maxSize: 8
    });

    // 🆕 AnimPro
    if (typeof AnimPro !== 'undefined') {
      AnimPro.init();
    }

    Log.info('Effects v6 initialized ✨');
  }
};

Log.info('Effects v5.1 loaded');