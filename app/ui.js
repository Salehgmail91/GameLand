/* =========================================================
   GameLand v4 — UI
   Toast + Modal + Confetti + BottomSheet + Loader + Tooltip
   ========================================================= */

'use strict';

/* =========================================================
   Toast
   ========================================================= */
const Toast = {
  container: null,
  queue: [],
  MAX: 5,

  ensure() {
    if (this.container) return;
    this.container = el('div', { class: 'toast-container' });
    document.body.appendChild(this.container);
  },

  show(msg, type = 'info', duration = 2500, icon = '') {
    this.ensure();

    // محدودیت تعداد
    while (this.container.children.length >= this.MAX) {
      this.container.firstChild.remove();
    }

    const t = el('div', { class: `toast toast-${type}` }, [
      icon ? el('span', { class: 'toast-icon', text: icon }) : null,
      el('span', { class: 'toast-msg', html: msg })
    ]);

    this.container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));

    const timeout = setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 350);
    }, duration);

    // قابلیت بستن با کلیک
    t.addEventListener('click', () => {
      clearTimeout(timeout);
      t.classList.remove('show');
      setTimeout(() => t.remove(), 350);
    });

    return t;
  },

  info(m, d)    { return this.show(m, 'info', d, 'ℹ️'); },
  success(m, d) { return this.show(m, 'success', d, '✅'); },
  warn(m, d)    { return this.show(m, 'warn', d, '⚠️'); },
  error(m, d)   { return this.show(m, 'error', d, '❌'); },
  coin(m, d)    { return this.show(m, 'coin', d, '🪙'); },
  achievement(m, d) { return this.show(m, 'ach', d || 4000, '🏆'); }
};

/* =========================================================
   Modal
   ========================================================= */
const Modal = {
  el: null,
  stack: [],

  open({ title = '', body = '', actions = [], closable = true, size = 'md', onClose = null }) {
    // اگه بازی دیگه‌ای باز بود، پشته کن
    if (this.el) {
      this.stack.push({ title, body, actions, closable, size, onClose });
      // آپدیت محتوا
      this._render({ title, body, actions, closable, size });
      return;
    }

    const wrap = el('div', { class: 'modal-backdrop' });
    const box = el('div', { class: `modal-box modal-${size}` });

    box.innerHTML = `
      ${title ? `<h3 class="modal-title">${title}</h3>` : ''}
      <div class="modal-body">${body}</div>
      ${actions.length ? `<div class="modal-actions">${actions.map((a, i) =>
        `<button class="btn ${a.primary ? 'primary' : ''}" data-i="${i}">${a.label}</button>`
      ).join('')}</div>` : ''}
    `;

    wrap.appendChild(box);
    document.body.appendChild(wrap);

    this.el = wrap;
    requestAnimationFrame(() => wrap.classList.add('show'));

    // Close on backdrop
    wrap.addEventListener('click', e => {
      if (e.target === wrap && closable) this.close();
    });

    // Actions
    box.querySelectorAll('.modal-actions .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = actions[+btn.dataset.i];
        if (action && action.onClick) action.onClick();
        if (!action || action.close !== false) this.close();
      });
    });

    // Escape key
    const escHandler = e => {
      if (e.key === 'Escape' && closable) this.close();
    };
    document.addEventListener('keydown', escHandler);
    wrap._escHandler = escHandler;
    wrap._onClose = onClose;

    Sound.click();
    return wrap;
  },

  _render(opts) {
    if (!this.el) return;
    const box = this.el.querySelector('.modal-box');
    box.innerHTML = `
      ${opts.title ? `<h3 class="modal-title">${opts.title}</h3>` : ''}
      <div class="modal-body">${opts.body}</div>
      ${opts.actions.length ? `<div class="modal-actions">${opts.actions.map((a, i) =>
        `<button class="btn ${a.primary ? 'primary' : ''}" data-i="${i}">${a.label}</button>`
      ).join('')}</div>` : ''}
    `;
    box.querySelectorAll('.modal-actions .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = opts.actions[+btn.dataset.i];
        if (action && action.onClick) action.onClick();
        if (!action || action.close !== false) this.close();
      });
    });
  },

  close() {
    if (!this.el) return;
    const el = this.el;
    this.el = null;

    if (el._escHandler) document.removeEventListener('keydown', el._escHandler);
    if (el._onClose) try { el._onClose(); } catch {}

    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);

    // اگه پشته خالی نبود، بعدی رو نشون بده
    if (this.stack.length) {
      const next = this.stack.shift();
      setTimeout(() => this.open(next), 320);
    }
  },

  confirm(message, onOk, opts = {}) {
    return this.open({
      title: opts.title || 'تایید',
      body: `<p style="text-align:center">${message}</p>`,
      actions: [
        { label: opts.cancel || 'بی‌خیال' },
        { label: opts.ok || 'بله', primary: true, onClick: onOk }
      ]
    });
  },

  alert(message, title = '') {
    return this.open({
      title,
      body: `<p style="text-align:center">${message}</p>`,
      actions: [{ label: 'باشه', primary: true }]
    });
  }
};

/* =========================================================
   Confetti
   ========================================================= */
const Confetti = {
  canvas: null,
  ctx: null,
  particles: [],
  raf: null,

  ensure() {
    if (this.canvas) return;
    this.canvas = el('canvas', { class: 'confetti-canvas' });
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width  = innerWidth  * dpr;
    this.canvas.height = innerHeight * dpr;
    this.canvas.style.width  = innerWidth + 'px';
    this.canvas.style.height = innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  /* Burst از یک نقطه */
  burst(count = 80, origin = null) {
    this.ensure();
    this.canvas.classList.add('active');

    const ox = origin ? origin.x : innerWidth / 2;
    const oy = origin ? origin.y : innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        g: 0.3 + Math.random() * 0.2,
        size: 6 + Math.random() * 8,
        color: rndColor(),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: 100 + Math.random() * 50,
        shape: Math.random() < 0.3 ? 'circle' : 'rect'
      });
    }
    if (!this.raf) this.loop();
  },

  /* Rain از بالا */
  rain(count = 100, duration = 3000) {
    this.ensure();
    this.canvas.classList.add('active');
    const start = performance.now();

    const spawnInterval = setInterval(() => {
      if (performance.now() - start > duration) {
        clearInterval(spawnInterval);
        return;
      }
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: Math.random() * innerWidth,
          y: -20,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 3,
          g: 0.05,
          size: 5 + Math.random() * 6,
          color: rndColor(),
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.2,
          life: 0,
          maxLife: 200,
          shape: Math.random() < 0.5 ? 'circle' : 'rect'
        });
      }
    }, 100);

    if (!this.raf) this.loop();
  },

  /* Fireworks */
  fireworks(duration = 4000) {
    this.ensure();
    this.canvas.classList.add('active');
    const start = performance.now();

    const timer = setInterval(() => {
      if (performance.now() - start > duration) {
        clearInterval(timer);
        return;
      }
      const x = 100 + Math.random() * (innerWidth - 200);
      const y = 100 + Math.random() * (innerHeight * 0.5);
      this.burst(40, { x, y });
    }, 400);

    if (!this.raf) this.loop();
  },

  loop() {
    this.raf = requestAnimationFrame(() => this.loop());
    const { ctx } = this;
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    this.particles = this.particles.filter(p => {
      p.life++;
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.rot += p.vr;

      const alpha = Math.max(0, 1 - p.life / p.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx.restore();

      return p.life < p.maxLife && p.y < innerHeight + 50;
    });

    if (this.particles.length === 0) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
      if (this.canvas) this.canvas.classList.remove('active');
    }
  },

  stop() {
    this.particles = [];
  }
};

/* =========================================================
   Bottom Sheet
   ========================================================= */
const BottomSheet = {
  el: null,

  open({ title = '', content = '', actions = [] }) {
    this.close();

    const wrap = el('div', { class: 'sheet-backdrop' });
    const sheet = el('div', { class: 'bottom-sheet' });

    sheet.innerHTML = `
      <div class="sheet-handle"></div>
      ${title ? `<h3 class="sheet-title">${title}</h3>` : ''}
      <div class="sheet-content">${content}</div>
      ${actions.length ? `<div class="sheet-actions">${actions.map((a, i) =>
        `<button class="btn ${a.primary ? 'primary' : ''}" data-i="${i}">${a.label}</button>`
      ).join('')}</div>` : ''}
    `;

    wrap.appendChild(sheet);
    document.body.appendChild(wrap);
    this.el = wrap;

    requestAnimationFrame(() => wrap.classList.add('show'));

    wrap.addEventListener('click', e => {
      if (e.target === wrap) this.close();
    });

    sheet.querySelectorAll('.sheet-actions .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = actions[+btn.dataset.i];
        if (action && action.onClick) action.onClick();
        if (!action || action.close !== false) this.close();
      });
    });

    // Swipe down to close
    let startY = 0, currentY = 0, dragging = false;
    sheet.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
      dragging = true;
    }, { passive: true });
    sheet.addEventListener('touchmove', e => {
      if (!dragging) return;
      currentY = e.touches[0].clientY;
      const delta = currentY - startY;
      if (delta > 0) sheet.style.transform = `translateY(${delta}px)`;
    }, { passive: true });
    sheet.addEventListener('touchend', () => {
      dragging = false;
      const delta = currentY - startY;
      if (delta > 100) this.close();
      else sheet.style.transform = '';
      startY = 0; currentY = 0;
    });

    Sound.click();
    return wrap;
  },

  close() {
    if (!this.el) return;
    const el = this.el;
    this.el = null;
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }
};

/* =========================================================
   Loader
   ========================================================= */
const Loader = {
  el: null,

  show(msg = '') {
    if (this.el) return;
    this.el = el('div', { class: 'loader-overlay' }, [
      el('div', { class: 'loader-spinner' }),
      msg ? el('div', { class: 'loader-msg', text: msg }) : null
    ]);
    document.body.appendChild(this.el);
    requestAnimationFrame(() => this.el.classList.add('show'));
  },

  hide() {
    if (!this.el) return;
    const el = this.el;
    this.el = null;
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  },

  async wrap(promise, msg = '') {
    this.show(msg);
    try {
      return await promise;
    } finally {
      this.hide();
    }
  }
};

/* =========================================================
   Tooltip (ساده)
   ========================================================= */
const Tooltip = {
  el: null,

  show(target, text, position = 'top') {
    this.hide();
    const rect = target.getBoundingClientRect();
    this.el = el('div', { class: `tooltip tooltip-${position}`, text });
    document.body.appendChild(this.el);

    const tr = this.el.getBoundingClientRect();
    let x, y;
    if (position === 'top') {
      x = rect.left + rect.width / 2 - tr.width / 2;
      y = rect.top - tr.height - 8;
    } else if (position === 'bottom') {
      x = rect.left + rect.width / 2 - tr.width / 2;
      y = rect.bottom + 8;
    } else if (position === 'left') {
      x = rect.left - tr.width - 8;
      y = rect.top + rect.height / 2 - tr.height / 2;
    } else {
      x = rect.right + 8;
      y = rect.top + rect.height / 2 - tr.height / 2;
    }

    this.el.style.left = Math.max(8, x) + 'px';
    this.el.style.top = y + 'px';
    requestAnimationFrame(() => this.el.classList.add('show'));
  },

  hide() {
    if (!this.el) return;
    this.el.remove();
    this.el = null;
  }
};

/* =========================================================
   Command Palette (Ctrl+K)
   ========================================================= */
const CommandPalette = {
  el: null,
  commands: [],
  filtered: [],
  selectedIdx: 0,

  register(cmd) {
    this.commands.push(cmd);
  },

  registerMany(cmds) {
    this.commands.push(...cmds);
  },

  open() {
    if (this.el) return;

    this.filtered = [...this.commands];
    this.selectedIdx = 0;

    const wrap = el('div', { class: 'cmd-backdrop' });
    const box = el('div', { class: 'cmd-box' });
    box.innerHTML = `
      <input type="text" class="cmd-input" placeholder="🔍 جستجو... (Ctrl+K)" autofocus>
      <div class="cmd-list"></div>
    `;
    wrap.appendChild(box);
    document.body.appendChild(wrap);
    this.el = wrap;

    requestAnimationFrame(() => wrap.classList.add('show'));

    const input = box.querySelector('.cmd-input');
    input.focus();

    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      this.filtered = this.commands.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.tags || []).some(t => t.toLowerCase().includes(q))
      );
      this.selectedIdx = 0;
      this.renderList(box.querySelector('.cmd-list'));
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIdx = Math.min(this.filtered.length - 1, this.selectedIdx + 1);
        this.renderList(box.querySelector('.cmd-list'));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIdx = Math.max(0, this.selectedIdx - 1);
        this.renderList(box.querySelector('.cmd-list'));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = this.filtered[this.selectedIdx];
        if (cmd) { this.close(); cmd.action(); }
      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    wrap.addEventListener('click', e => {
      if (e.target === wrap) this.close();
    });

    this.renderList(box.querySelector('.cmd-list'));
  },

  renderList(listEl) {
    listEl.innerHTML = '';
    if (this.filtered.length === 0) {
      listEl.innerHTML = '<div class="cmd-empty">چیزی پیدا نشد</div>';
      return;
    }
    this.filtered.forEach((cmd, i) => {
      const item = el('div', { class: `cmd-item ${i === this.selectedIdx ? 'active' : ''}` }, [
        el('span', { class: 'cmd-icon', text: cmd.icon || '•' }),
        el('span', { class: 'cmd-title', text: cmd.title }),
        cmd.shortcut ? el('span', { class: 'cmd-shortcut', text: cmd.shortcut }) : null
      ]);
      item.addEventListener('click', () => {
        this.close();
        cmd.action();
      });
      listEl.appendChild(item);
    });
  },

  close() {
    if (!this.el) return;
    const el = this.el;
    this.el = null;
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  },

  toggle() {
    if (this.el) this.close();
    else this.open();
  }
};

// بازکردن با Ctrl+K یا Cmd+K
window.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    CommandPalette.toggle();
  }
});

Log.info('UI loaded');