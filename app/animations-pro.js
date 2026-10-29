/* =========================================================
   GameLand v6 — Animations PRO
   انیمیشن‌های فوق‌العاده (بهینه‌شده)
   ========================================================= */

'use strict';

const AnimPro = {

  /* =====================================================
     1. Magnetic Buttons — کشیده شدن به سمت موس
     ===================================================== */
  magnetic(el, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (!el || Env.isTouch()) return () => {};

    const opts = {
      strength: 0.4,
      maxMove: 15,
      scale: 1.05,
      rotate: 3,
      ...options
    };

    let raf = null;
    let currentX = 0, currentY = 0;
    let targetX = 0, targetY = 0;

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.15);
      currentY = lerp(currentY, targetY, 0.15);

      const dist = Math.hypot(currentX, currentY);
      const rotation = (currentX / opts.maxMove) * opts.rotate;

      el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${1 + dist / 500}) rotate(${rotation}deg)`;

      if (Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    };

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let dx = (e.clientX - cx) * opts.strength;
      let dy = (e.clientY - cy) * opts.strength;

      targetX = clamp(dx, -opts.maxMove, opts.maxMove);
      targetY = clamp(dy, -opts.maxMove, opts.maxMove);

      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  },

  initMagnetic(root = document) {
    $$('.magnetic, [data-magnetic]', root).forEach(el => this.magnetic(el));
  },

  /* =====================================================
     2. 3D Card Tilt — چرخش 3D واقعی
     ===================================================== */
  cardTilt3D(el, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (!el || Env.isTouch()) return () => {};

    const opts = {
      maxTilt: 12,
      scale: 1.04,
      perspective: 1000,
      glare: true,
      ...options
    };

    el.style.transformStyle = 'preserve-3d';
    el.style.transition = 'transform 0.15s ease-out';

    let glare = null;

    if (opts.glare) {
      glare = document.createElement('div');
      glare.style.cssText = `
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
        background: radial-gradient(
          circle at 50% 50%,
          rgba(255, 255, 255, 0.3),
          transparent 60%
        );
        z-index: 10;
        mix-blend-mode: overlay;
      `;
      el.style.position = 'relative';
      el.appendChild(glare);
    }

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

      if (glare) {
        glare.style.opacity = '1';
        glare.style.background = `radial-gradient(
          circle at ${x * 100}% ${y * 100}%,
          rgba(255, 255, 255, 0.35),
          transparent 60%
        )`;
      }
    };

    const onLeave = () => {
      el.style.transform = '';
      if (glare) glare.style.opacity = '0';
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (glare) glare.remove();
    };
  },

  initCardTilt3D(root = document) {
    $$('[data-tilt-3d]', root).forEach(el => this.cardTilt3D(el));
  },

  /* =====================================================
     3. Cursor Trail — رد نور پشت موس
     ===================================================== */
  _trailCanvas: null,
  _trailCtx: null,
  _trailPoints: [],
  _trailRaf: null,

  initTrail(options = {}) {
    if (Env.isTouch()) return;
    if (this._trailCanvas) return;

    const opts = {
      maxPoints: 20,
      color: 'rgba(124, 92, 255, 0.8)',
      size: 6,
      fadeSpeed: 0.05,
      ...options
    };

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99998;
    `;
    document.body.appendChild(canvas);
    this._trailCanvas = canvas;
    this._trailCtx = canvas.getContext('2d');

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      this._trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let mouseX = -100, mouseY = -100;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      this._trailPoints.push({
        x: mouseX, y: mouseY, life: 1
      });
      if (this._trailPoints.length > opts.maxPoints) {
        this._trailPoints.shift();
      }
    });

    const render = () => {
      this._trailRaf = requestAnimationFrame(render);
      const ctx = this._trailCtx;
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      for (let i = 0; i < this._trailPoints.length; i++) {
        const p = this._trailPoints[i];
        p.life -= opts.fadeSpeed;

        if (p.life <= 0) {
          this._trailPoints.splice(i, 1);
          i--;
          continue;
        }

        const alpha = p.life * 0.8;
        const size = opts.size * p.life;

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 92, 255, ${alpha})`;
        ctx.fill();

        // لایه دوم درخشان
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha * 0.3})`;
        ctx.fill();
      }
    };
    render();

    return () => {
      cancelAnimationFrame(this._trailRaf);
      window.removeEventListener('resize', resize);
      canvas.remove();
      this._trailCanvas = null;
    };
  },

  /* =====================================================
     4. Click Ripple Pro — موج از نقطه کلیک
     ===================================================== */
  ripplePro(el, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (!el) return;

    const opts = {
      color: 'rgba(255, 255, 255, 0.5)',
      layers: 3,
      duration: 800,
      ...options
    };

    el.style.position = 'relative';
    el.style.overflow = 'hidden';

    el.addEventListener('click', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxDist = Math.max(
        Math.hypot(x, y),
        Math.hypot(rect.width - x, y),
        Math.hypot(x, rect.height - y),
        Math.hypot(rect.width - x, rect.height - y)
      );

      for (let i = 0; i < opts.layers; i++) {
        setTimeout(() => {
          const ripple = document.createElement('span');
          ripple.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: ${opts.color};
            pointer-events: none;
            transform: translate(-50%, -50%) scale(0);
            transition: transform ${opts.duration}ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity ${opts.duration}ms ease;
            opacity: 0.6;
            z-index: 1;
          `;
          el.appendChild(ripple);

          requestAnimationFrame(() => {
            ripple.style.transform = `translate(-50%, -50%) scale(${maxDist / 4})`;
            ripple.style.opacity = '0';
          });

          setTimeout(() => ripple.remove(), opts.duration + 100);
        }, i * 100);
      }
    });
  },

  /* =====================================================
     5. Confetti Pro Max — ۸ نوع
     ===================================================== */
  confettiPro(type = 'burst', options = {}) {
    if (typeof Confetti === 'undefined') return;
    Confetti.burst(options.count || 100);
    // 👆 اینجا فقط سرنخ می‌زنیم، پیاده‌سازی اصلی توی Effects.confettiPro هست
  },

  /* =====================================================
     6. Screen Shake — لرزش صفحه
     ===================================================== */
  screenShake(intensity = 5, duration = 500) {
    if (Env.reduceMotion()) return;

    const body = document.body;
    const start = performance.now();

    const shake = (time) => {
      const elapsed = time - start;
      if (elapsed > duration) {
        body.style.transform = '';
        return;
      }

      const progress = 1 - (elapsed / duration);
      const power = intensity * progress;

      const x = (Math.random() - 0.5) * power * 2;
      const y = (Math.random() - 0.5) * power * 2;
      const rot = (Math.random() - 0.5) * power * 0.5;

      body.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;

      requestAnimationFrame(shake);
    };

    requestAnimationFrame(shake);
  },

  /* =====================================================
     7. Flash Effect — فلاش نور
     ===================================================== */
  flash(color = '#fff', duration = 400) {
    if (Env.reduceMotion()) return;

    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      inset: 0;
      background: ${color};
      pointer-events: none;
      z-index: 99999;
      opacity: 0;
      transition: opacity ${duration / 2}ms ease-out;
    `;
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.opacity = '0.6';
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), duration / 2);
      }, duration / 2);
    });
  },

  /* =====================================================
     8. Vignette Pulse — کدر شدن لبه‌ها
     ===================================================== */
  vignettePulse(color = 'rgba(0, 0, 0, 0.5)', duration = 800) {
    if (Env.reduceMotion()) return;

    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99998;
      background: radial-gradient(
        ellipse at center,
        transparent 40%,
        ${color} 100%
      );
      opacity: 0;
      transition: opacity ${duration / 2}ms ease-out;
    `;
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.opacity = '1';
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), duration / 2);
      }, duration / 2);
    });
  },

  /* =====================================================
     9. Zoom Punch — زوم سریع
     ===================================================== */
  zoomPunch(scale = 1.1, duration = 400) {
    if (Env.reduceMotion()) return;

    const wrap = document.querySelector('.app-wrap') || document.body;
    const original = wrap.style.transform;

    wrap.style.transition = `transform ${duration / 2}ms cubic-bezier(0.2, 0.9, 0.3, 1.2)`;
    wrap.style.transform = `scale(${scale})`;

    setTimeout(() => {
      wrap.style.transform = original || '';
      setTimeout(() => {
        wrap.style.transition = '';
      }, duration / 2);
    }, duration / 2);
  },

  /* =====================================================
     10. Number Roller — چرخش اعداد
     ===================================================== */
  numberRoll(el, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (!el) return;

    const opts = {
      duration: 800,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      ...options
    };

    const finalValue = +(el.dataset.count || el.textContent.replace(/[^\d.-]/g, '') || 0);
    const startValue = opts.from || 0;
    const startTime = performance.now();

    const update = (now) => {
      const t = Math.min(1, (now - startTime) / opts.duration);
      const eased = opts.easing(t);
      const current = startValue + (finalValue - startValue) * eased;
      el.textContent = formatNumber(Math.round(current));
      el.style.transform = `translateY(${(1 - eased) * 20}px)`;
      el.style.opacity = String(eased);

      if (t < 1) requestAnimationFrame(update);
      else {
        el.textContent = formatNumber(finalValue);
        el.style.transform = '';
        el.style.opacity = '1';
      }
    };

    requestAnimationFrame(update);
  },

  numberRollAll(root = document) {
    $$('[data-count]', root).forEach(el => this.numberRoll(el));
  },

  /* =====================================================
     11. Typewriter — متن حرف به حرف
     ===================================================== */
  typewriter(el, text, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (!el) return;

    const opts = {
      speed: 50,
      cursor: true,
      cursorChar: '|',
      delay: 0,
      ...options
    };

    el.textContent = '';
    if (opts.cursor) el.style.borderRight = `2px solid var(--a1)`;

    let i = 0;
    const start = () => {
      const timer = setInterval(() => {
        if (i >= text.length) {
          clearInterval(timer);
          if (opts.cursor) {
            setInterval(() => {
              el.style.borderRightColor = el.style.borderRightColor === 'transparent' ? 'var(--a1)' : 'transparent';
            }, 500);
          }
          return;
        }
        el.textContent += text[i];
        i++;
      }, opts.speed);
    };

    if (opts.delay) setTimeout(start, opts.delay);
    else start();
  },

  /* =====================================================
     12. Particle Burst — انفجار ذرات از یک عنصر
     ===================================================== */
  particleBurst(el, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (!el) return;

    const opts = {
      count: 20,
      colors: ['#7c5cff', '#00e5ff', '#ff3b7b', '#22c55e', '#eab308'],
      minSize: 4,
      maxSize: 10,
      distance: 120,
      duration: 900,
      ...options
    };

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99999;
      overflow: hidden;
    `;
    document.body.appendChild(container);

    for (let i = 0; i < opts.count; i++) {
      const p = document.createElement('div');
      const size = rndRange(opts.minSize, opts.maxSize);
      const color = choice(opts.colors);
      const angle = (Math.PI * 2 * i) / opts.count + Math.random() * 0.5;
      const dist = opts.distance + Math.random() * 60;

      p.style.cssText = `
        position: absolute;
        left: ${cx}px;
        top: ${cy}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        transition: transform ${opts.duration}ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity ${opts.duration}ms ease;
        box-shadow: 0 0 ${size * 2}px ${color};
      `;

      container.appendChild(p);

      requestAnimationFrame(() => {
        p.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(1)`;
        p.style.opacity = '0';
      });
    }

    setTimeout(() => container.remove(), opts.duration + 200);
  },

  /* =====================================================
     13. Letter Cascade — حروف آبشاری
     ===================================================== */
  letterCascade(el, text, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (!el) return;

    const opts = {
      delay: 50,
      duration: 500,
      from: 'top',
      ...options
    };

    el.innerHTML = '';
    const chars = text.split('');

    chars.forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.cssText = `
        display: inline-block;
        opacity: 0;
        transition: opacity ${opts.duration}ms ease, transform ${opts.duration}ms cubic-bezier(0.2, 0.9, 0.3, 1.4);
        transform: translateY(${opts.from === 'top' ? '-20px' : '20px'});
      `;
      el.appendChild(span);

      setTimeout(() => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
      }, i * opts.delay);
    });
  },

  /* =====================================================
     14. Stagger Children — ورود پله‌ای
     ===================================================== */
  staggerPro(container, options = {}) {
    if (typeof container === 'string') container = $(container);
    if (!container) return;

    const opts = {
      selector: ':scope > *',
      delay: 60,
      duration: 500,
      animation: 'cardEntry',
      ...options
    };

    const children = $$(opts.selector, container);
    children.forEach((child, i) => {
      child.style.animation = 'none';
      void child.offsetWidth;
      child.style.animation = `${opts.animation} ${opts.duration}ms cubic-bezier(0.2, 0.9, 0.3, 1) both`;
      child.style.animationDelay = (i * opts.delay) + 'ms';
    });
  },

  /* =====================================================
     15. Path Animation — حرکت در مسیر SVG
     ===================================================== */
  pathAnimate(el, pathEl, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (typeof pathEl === 'string') pathEl = $(pathEl);
    if (!el || !pathEl) return;

    const opts = {
      duration: 2000,
      delay: 0,
      ...options
    };

    const path = pathEl;
    const length = path.getTotalLength();

    const startTime = performance.now() + opts.delay;

    const animate = (now) => {
      const elapsed = now - startTime;
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }
      const t = Math.min(1, elapsed / opts.duration);
      const point = path.getPointAtLength(length * t);

      el.style.position = 'absolute';
      el.style.left = point.x + 'px';
      el.style.top = point.y + 'px';
      el.style.transform = 'translate(-50%, -50%)';

      if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  },

  /* =====================================================
     16. Morph Text — تغییر متن با morph
     ===================================================== */
  morphText(el, newText, options = {}) {
    if (typeof el === 'string') el = $(el);
    if (!el) return;

    const opts = {
      duration: 300,
      ...options
    };

    el.style.transition = `opacity ${opts.duration / 2}ms ease, transform ${opts.duration / 2}ms ease`;
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px)';

    setTimeout(() => {
      el.textContent = newText;
      el.style.transform = 'translateY(10px)';
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    }, opts.duration / 2);
  },

  /* =====================================================
     17. Shake Element — لرزش عنصر
     ===================================================== */
  shake(el, intensity = 5, duration = 500) {
    if (typeof el === 'string') el = $(el);
    if (!el) return;

    const start = performance.now();
    const originalTransform = el.style.transform;

    const shake = (now) => {
      const elapsed = now - start;
      if (elapsed > duration) {
        el.style.transform = originalTransform;
        return;
      }

      const progress = 1 - (elapsed / duration);
      const power = intensity * progress;
      const x = (Math.random() - 0.5) * power * 2;
      const y = (Math.random() - 0.5) * power * 2;
      const rot = (Math.random() - 0.5) * power * 0.5;

      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;

      requestAnimationFrame(shake);
    };

    requestAnimationFrame(shake);
  },

  /* =====================================================
     18. Bounce Element
     ===================================================== */
  bounce(el, intensity = 20) {
    if (typeof el === 'string') el = $(el);
    if (!el) return;

    el.style.transition = 'transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1.4)';
    el.style.transform = `translateY(-${intensity}px) scale(1.1)`;

    setTimeout(() => {
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 200);
    }, 150);
  },

  /* =====================================================
     19. Highlight Element
     ===================================================== */
  highlight(el, color = 'rgba(124, 92, 255, 0.3)', duration = 800) {
    if (typeof el === 'string') el = $(el);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: ${color};
      border-radius: inherit;
      pointer-events: none;
      z-index: 99999;
      opacity: 0.8;
      transition: opacity ${duration}ms ease;
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), duration);
    });
  },

  /* =====================================================
     20. Init All
     ===================================================== */
  init() {
    this.initMagnetic();
    this.initCardTilt3D();
    Log.info('AnimPro initialized ✨');
  }
};

Log.info('Animations PRO loaded');