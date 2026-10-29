/* =========================================================
   GameLand v3 — هسته مرکزی
   توابع کمکی + Sound + Storage + Toast + Confetti +
   Modal + Leaderboard + Achievements + Daily + Settings
   ========================================================= */

'use strict';

/* =========================================================
   Selectors
   ========================================================= */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* =========================================================
   Math Utils
   ========================================================= */
const rnd      = n => Math.floor(Math.random() * n);
const rndRange = (a, b) => a + Math.random() * (b - a);
const clamp    = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp     = (a, b, t) => a + (b - a) * t;
const rndColor = () => `hsl(${rnd(360)},70%,60%)`;

const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const choice = arr => arr[rnd(arr.length)];

const unique = arr => [...new Set(arr)];

/* =========================================================
   Canvas Utils
   ========================================================= */
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGlow(ctx, color, blur, fn) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  fn();
  ctx.restore();
}

/* =========================================================
   Swipe
   ========================================================= */
function addSwipe(el, cb, threshold = 26) {
  let sx = 0, sy = 0, on = false;
  const start = e => {
    const t = e.touches ? e.touches[0] : e;
    sx = t.clientX; sy = t.clientY; on = true;
  };
  const end = e => {
    if (!on) return;
    on = false;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.hypot(dx, dy) < threshold) return;
    if (Math.abs(dx) > Math.abs(dy)) cb(dx > 0 ? 'right' : 'left');
    else cb(dy > 0 ? 'down' : 'up');
  };
  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchend', end);
  el.addEventListener('mousedown', start);
  el.addEventListener('mouseup', end);
  return () => {
    el.removeEventListener('touchstart', start);
    el.removeEventListener('touchend', end);
    el.removeEventListener('mousedown', start);
    el.removeEventListener('mouseup', end);
  };
}

/* =========================================================
   Storage — با namespace و JSON
   ========================================================= */
const Storage = {
  prefix: 'gl_',

  get(key, def = null) {
    try {
      const v = localStorage.getItem(this.prefix + key);
      if (v === null) return def;
      try { return JSON.parse(v); }
      catch { return v; }
    } catch { return def; }
  },

  set(key, val) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(val));
      return true;
    } catch { return false; }
  },

  remove(key) {
    try { localStorage.removeItem(this.prefix + key); } catch {}
  },

  keys() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) out.push(k.slice(this.prefix.length));
      }
    } catch {}
    return out;
  },

  clearAll() {
    this.keys().forEach(k => this.remove(k));
  }
};

/* سازگاری با نسخه قدیم */
function store(key, val) {
  if (val === undefined) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  try { localStorage.setItem(key, val); } catch {}
}

/* =========================================================
   Sound — Web Audio (نسخه اصلاح‌شده Safari)
   ========================================================= */
const Sound = {
  ctx: null,
  master: null,
  enabled: true,
  volume: 0.6,
  unlocked: false,

  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    } catch {}
  },

  /* در Safari و iOS فقط بعد از user gesture کار می‌کنه */
  unlock() {
    if (this.unlocked) return;
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.unlocked = true;
      }).catch(() => {});
    } else {
      this.unlocked = true;
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  },

  play(freq = 440, duration = 0.1, type = 'sine', volume = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.resume();

    try {
      const now  = this.ctx.currentTime;
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  },

  chord(freqs, duration = 0.2, type = 'sine', volume = 0.08) {
    freqs.forEach((f, i) => {
      setTimeout(() => this.play(f, duration, type, volume), i * 40);
    });
  },

  click()  { this.play(600, 0.05, 'sine', 0.06); },
  pop()    { this.play(880, 0.08, 'triangle', 0.08); },
  bounce() { this.play(400, 0.04, 'square', 0.05); },

  win() {
    this.chord([523, 659, 784, 1046], 0.18, 'sine', 0.1);
  },

  lose() {
    this.play(300, 0.2, 'sawtooth', 0.08);
    setTimeout(() => this.play(200, 0.3, 'sawtooth', 0.08), 150);
  },

  levelUp() {
    this.chord([440, 554, 659, 880], 0.15, 'triangle', 0.09);
  },

  setVolume(v) {
    this.volume = clamp(v, 0, 1);
    if (this.master) this.master.gain.value = this.volume;
  }
};

/* Unlock خودکار Sound روی اولین تعامل کاربر */
['click', 'touchstart', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => Sound.unlock(), { once: true, passive: true });
});
/* =========================================================
   Toast — اعلان‌های شناور
   ========================================================= */
const Toast = {
  container: null,

  ensure() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(msg, type = 'info', duration = 2500) {
    this.ensure();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = msg;
    this.container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 350);
    }, duration);
  },

  info(m, d)    { this.show(m, 'info', d); },
  success(m, d) { this.show(m, 'success', d); },
  warn(m, d)    { this.show(m, 'warn', d); },
  error(m, d)   { this.show(m, 'error', d); }
};

/* =========================================================
   Confetti — جشن
   ========================================================= */
const Confetti = {
  canvas: null,
  ctx: null,
  particles: [],
  raf: null,

  ensure() {
    if (this.canvas) return;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'confetti-canvas';
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

  start(count = 90) {
    this.ensure();
    this.canvas.classList.add('active');

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: innerHeight / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 4,
        g: 0.35 + Math.random() * 0.2,
        size: 6 + Math.random() * 8,
        color: rndColor(),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: 110 + Math.random() * 60
      });
    }

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
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();

      return p.life < p.maxLife && p.y < innerHeight + 50;
    });

    if (this.particles.length === 0) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
      if (this.canvas) this.canvas.classList.remove('active');
    }
  }
};

/* =========================================================
   Modal — پنجره عمومی
   ========================================================= */
const Modal = {
  el: null,

  open({ title = '', body = '', actions = [], closable = true }) {
    this.close();

    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal-box">
        ${title ? `<h3 class="modal-title">${title}</h3>` : ''}
        <div class="modal-body">${body}</div>
        ${actions.length ? `<div class="modal-actions">${actions.map((a, i) =>
          `<button class="btn ${a.primary ? 'primary' : ''}" data-i="${i}">${a.label}</button>`
        ).join('')}</div>` : ''}
      </div>
    `;

    document.body.appendChild(wrap);
    this.el = wrap;
    requestAnimationFrame(() => wrap.classList.add('show'));

    wrap.addEventListener('click', e => {
      if (e.target === wrap && closable) this.close();
    });

    wrap.querySelectorAll('.modal-actions .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = actions[+btn.dataset.i];
        if (action && action.onClick) action.onClick();
        if (!action || action.close !== false) this.close();
      });
    });

    return wrap;
  },

  close() {
    if (!this.el) return;
    const el = this.el;
    this.el = null;
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }
};

/* =========================================================
   Leaderboard — top 5
   ========================================================= */
const Leaderboard = {
  KEY: 'leaderboard',
  MAX: 5,

  submit(gameId, score, extra = {}) {
    const all  = Storage.get(this.KEY, {});
    const list = all[gameId] || [];
    const entry = { score, date: Date.now(), ...extra };
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    all[gameId] = list.slice(0, this.MAX);
    Storage.set(this.KEY, all);
    const rank = all[gameId].indexOf(entry);
    return rank === -1 ? null : rank + 1;
  },

  get(gameId) {
    const all = Storage.get(this.KEY, {});
    return all[gameId] || [];
  },

  clear(gameId) {
    if (!gameId) return Storage.remove(this.KEY);
    const all = Storage.get(this.KEY, {});
    delete all[gameId];
    Storage.set(this.KEY, all);
  },

  formatDate(ts) {
    try {
      return new Date(ts).toLocaleDateString('fa-IR');
    } catch { return ''; }
  }
};

/* =========================================================
   Achievements
   ========================================================= */
const Achievements = {
  LIST: [
    { id: 'first_game',  name: 'شروع ماجرا',    icon: '🎮', desc: 'اولین بازی رو انجام بده' },
    { id: 'play_5',      name: 'کاوشگر',        icon: '🗺️', desc: '۵ بازی مختلف انجام بده' },
    { id: 'play_all',    name: 'همه‌چیزدان',    icon: '👑', desc: 'همه بازی‌ها رو امتحان کن' },
    { id: 'fav_3',       name: 'ستاره‌چین',     icon: '⭐', desc: '۳ بازی رو لایک کن' },
    { id: 'win_10',      name: 'برنده',         icon: '🏆', desc: '۱۰ بار برنده شو' },
    { id: 'night_owl',   name: 'جغد شب',        icon: '🌙', desc: 'بعد از نیمه‌شب بازی کن' },
    { id: 'speedster',   name: 'سریع',          icon: '⚡', desc: 'تست سرعت زیر ۲۰۰ms' },
    { id: 'streak_3',    name: 'وفادار',        icon: '🔥', desc: '۳ روز متوالی بازی کن' },
    { id: 'daily_done',  name: 'چالش‌گر',       icon: '📅', desc: 'چالش روزانه رو کامل کن' },
    { id: 'perfectionist', name: 'کامل‌گرا',    icon: '💎', desc: 'یک بازی رو ۱۰ بار ببر' }
  ],

  get() { return Storage.get('achievements', {}); },
  has(id) { return !!this.get()[id]; },

  unlock(id) {
    const a = this.get();
    if (a[id]) return false;
    a[id] = Date.now();
    Storage.set('achievements', a);
    const meta = this.LIST.find(x => x.id === id);
    if (meta) {
      Toast.success(`${meta.icon} دستاورد جدید: <b>${meta.name}</b>`);
      Sound.levelUp();
      Confetti.start(40);
      document.dispatchEvent(new CustomEvent('achievement:unlock', { detail: meta }));
    }
    return true;
  },

  count() { return Object.keys(this.get()).length; }
};

/* =========================================================
   Daily Challenge — چالش روزانه
   ========================================================= */
const Daily = {
  today() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  },

  getState() {
    return Storage.get('daily', {});
  },

  pick() {
    // انتخاب بازی از روی تاریخ (تکرارشونده)
    const GAME_IDS = (typeof GAMES_LIST !== 'undefined')
      ? GAMES_LIST.map(g => g.id)
      : GameLand.all().map(g => g.id);
    if (!GAME_IDS.length) return null;
    const day = Math.floor(Date.now() / 86400000);
    return GAME_IDS[day % GAME_IDS.length];
  },

  check() {
    const s = this.getState();
    const today = this.today();
    if (s.date !== today) {
      Storage.set('daily', {
        date: today,
        game: this.pick(),
        done: false,
        score: 0
      });
    }
    return this.getState();
  },

  markDone(score = 0) {
    const s = this.check();
    s.done = true;
    s.score = score;
    Storage.set('daily', s);
    Achievements.unlock('daily_done');
  },

  isDoneToday() {
    return this.check().done;
  }
};

/* =========================================================
   Stats — آمار بازیکن
   ========================================================= */
const PlayerStats = {
  KEY: 'stats',
  get() {
    return Storage.get(this.KEY, {
      gamesPlayed: 0,
      gamesList: [],
      wins: 0,
      losses: 0,
      streak: 0,
      lastPlayed: null
    });
  },
  set(s) { Storage.set(this.KEY, s); },

  markGame(id) {
    const s = this.get();
    s.gamesPlayed++;
    if (!s.gamesList.includes(id)) s.gamesList.push(id);

    // streak
    const today = new Date().toDateString();
    const last  = s.lastPlayed;
    if (last) {
      const diff = (new Date(today) - new Date(last)) / 86400000;
      if (diff === 1) s.streak++;
      else if (diff > 1) s.streak = 1;
    } else s.streak = 1;
    s.lastPlayed = today;

    this.set(s);

    // Achievements
    Achievements.unlock('first_game');
    if (s.gamesList.length >= 5) Achievements.unlock('play_5');
    const total = (typeof GAMES_LIST !== 'undefined') ? GAMES_LIST.length : 15;
    if (s.gamesList.length >= total) Achievements.unlock('play_all');
    if (s.streak >= 3) Achievements.unlock('streak_3');

    // شب‌بیدار
    const h = new Date().getHours();
    if (h >= 0 && h < 5) Achievements.unlock('night_owl');
  },

  win() {
    const s = this.get();
    s.wins++;
    this.set(s);
    if (s.wins >= 10) Achievements.unlock('win_10');
  },

  lose() {
    const s = this.get();
    s.losses++;
    this.set(s);
  }
};

/* =========================================================
   Settings
   ========================================================= */
const Settings = {
  get(key, def = null) { return Storage.get('settings_' + key, def); },
  set(key, val) { Storage.set('settings_' + key, val); }
};

/* =========================================================
   Registry — ثبت بازی‌ها
   ========================================================= */
const GameLand = {
  registry: {},

  register(id, config) {
    this.registry[id] = config;
  },

  get(id) {
    return this.registry[id];
  },

  all() {
    return Object.values(this.registry);
  },

  exists(id) {
    return !!this.registry[id];
  }
};