/* =========================================================
   GameLand v4 — Core
   Helper ها، ابزارهای پایه، Logger
   ========================================================= */

'use strict';

/* =========================================================
   Meta
   ========================================================= */
const GL = {
  VERSION: '4.0.0',
  NAME: 'GameLand',
  STUDIO: 'Krypton Studio',
  BUILD: '2026.02'
};

console.log(
  `%c🎮 ${GL.NAME} v${GL.VERSION} %c${GL.STUDIO}`,
  'background:linear-gradient(135deg,#7c5cff,#00e5ff);color:#08080f;padding:4px 10px;border-radius:6px;font-weight:800',
  'color:#8b8ba3;padding:4px 6px'
);

/* =========================================================
   Selectors
   ========================================================= */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const $id = id => document.getElementById(id);

/* =========================================================
   Math & Random
   ========================================================= */
const rnd      = n => Math.floor(Math.random() * n);
const rndRange = (a, b) => a + Math.random() * (b - a);
const rndInt   = (a, b) => Math.floor(rndRange(a, b + 1));
const clamp    = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp     = (a, b, t) => a + (b - a) * t;
const rndColor = () => `hsl(${rnd(360)},70%,60%)`;
const chance   = p => Math.random() < p;

const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const choice = arr => arr[rnd(arr.length)];
const unique = arr => [...new Set(arr)];

const sum  = arr => arr.reduce((a, b) => a + b, 0);
const avg  = arr => arr.length ? sum(arr) / arr.length : 0;
const max  = arr => arr.length ? Math.max(...arr) : 0;
const min  = arr => arr.length ? Math.min(...arr) : 0;

/* =========================================================
   Easing Functions
   ========================================================= */
const Ease = {
  linear:     t => t,
  quadIn:     t => t * t,
  quadOut:    t => 1 - (1 - t) * (1 - t),
  quadInOut:  t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  cubicIn:    t => t * t * t,
  cubicOut:   t => 1 - Math.pow(1 - t, 3),
  cubicInOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  elastic:    t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  back:       t => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
};

/* =========================================================
   Time & Format
   ========================================================= */
const now = () => performance.now();

function formatTime(ms) {
  if (ms < 1000) return Math.round(ms) + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatNumber(n) {
  if (n < 1000) return String(n);
  if (n < 1000000) return (n / 1000).toFixed(1) + 'K';
  return (n / 1000000).toFixed(1) + 'M';
}

function formatDate(ts, locale = 'fa-IR') {
  try { return new Date(ts).toLocaleDateString(locale); }
  catch { return ''; }
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr  = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return 'همین الان';
  if (min < 60) return `${min} دقیقه پیش`;
  if (hr < 24) return `${hr} ساعت پیش`;
  if (day < 30) return `${day} روز پیش`;
  return formatDate(ts);
}

/* =========================================================
   DOM Helpers
   ========================================================= */
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class')      e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      e.addEventListener(k.slice(2).toLowerCase(), v);
    }
    else if (k === 'html')  e.innerHTML = v;
    else if (k === 'text')  e.textContent = v;
    else                    e.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}

function clearEl(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function show(node)  { if (node) node.classList.remove('hidden'); }
function hide(node)  { if (node) node.classList.add('hidden'); }
function toggle(node, force) {
  if (!node) return;
  if (force === undefined) node.classList.toggle('hidden');
  else node.classList.toggle('hidden', !force);
}

function isVisible(node) {
  return node && !node.classList.contains('hidden');
}

/* =========================================================
   Canvas
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

function fitCanvas(cv, dpr = true) {
  if (!dpr) return;
  const ratio = window.devicePixelRatio || 1;
  const rect = cv.getBoundingClientRect();
  cv.width = rect.width * ratio;
  cv.height = rect.height * ratio;
  const ctx = cv.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function canvasPoint(cv, e) {
  const rect = cv.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * (cv.width / rect.width) / (window.devicePixelRatio || 1),
    y: (clientY - rect.top)  * (cv.height / rect.height) / (window.devicePixelRatio || 1)
  };
}

/* =========================================================
   Touch / Swipe / Long Press
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

function addLongPress(el, cb, duration = 500) {
  let timer = null;
  let triggered = false;
  const start = () => {
    triggered = false;
    timer = setTimeout(() => {
      triggered = true;
      cb();
    }, duration);
  };
  const cancel = () => {
    if (timer) { clearTimeout(timer); timer = null; }
  };
  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchend', cancel);
  el.addEventListener('touchmove', cancel);
  el.addEventListener('mousedown', start);
  el.addEventListener('mouseup', cancel);
  el.addEventListener('mouseleave', cancel);
  return () => {
    cancel();
    el.removeEventListener('touchstart', start);
    el.removeEventListener('touchend', cancel);
    el.removeEventListener('touchmove', cancel);
    el.removeEventListener('mousedown', start);
    el.removeEventListener('mouseup', cancel);
    el.removeEventListener('mouseleave', cancel);
    return triggered;
  };
}

/* =========================================================
   Timing Utils
   ========================================================= */
function debounce(fn, wait = 200) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function throttle(fn, wait = 100) {
  let last = 0;
  return (...args) => {
    const t = Date.now();
    if (t - last >= wait) {
      last = t;
      fn(...args);
    }
  };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const nextFrame = () => new Promise(r => requestAnimationFrame(r));

/* =========================================================
   ID Generator
   ========================================================= */
function uid(prefix = 'id') {
  return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/* =========================================================
   Logger
   ========================================================= */
const Log = {
  enabled: true,
  level: 'debug', // debug | info | warn | error

  _log(level, style, ...args) {
    if (!this.enabled) return;
    const order = ['debug', 'info', 'warn', 'error'];
    if (order.indexOf(level) < order.indexOf(this.level)) return;
    console[level === 'debug' ? 'log' : level](
      `%c[GL:${level}]`, style, ...args
    );
  },

  debug(...args) { this._log('debug', 'color:#8b8ba3', ...args); },
  info(...args)  { this._log('info',  'color:#00e5ff', ...args); },
  warn(...args)  { this._log('warn',  'color:#f59e0b', ...args); },
  error(...args) { this._log('error', 'color:#ef4444;font-weight:700', ...args); }
};

/* =========================================================
   Deep Helpers
   ========================================================= */
function deepClone(obj) {
  if (obj == null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  const out = {};
  for (const k in obj) out[k] = deepClone(obj[k]);
  return out;
}

function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const src = sources.shift();
  if (isObject(target) && isObject(src)) {
    for (const k in src) {
      if (isObject(src[k])) {
        if (!target[k]) target[k] = {};
        deepMerge(target[k], src[k]);
      } else target[k] = src[k];
    }
  }
  return deepMerge(target, ...sources);
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/* =========================================================
   Env
   ========================================================= */
const Env = {
  isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  },
  isTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  isOnline() {
    return navigator.onLine;
  },
  isDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  reduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};

Log.info('Core loaded', GL.VERSION);