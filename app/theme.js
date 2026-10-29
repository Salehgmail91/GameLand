/* =========================================================
   GameLand v5 — Theme Manager (Enhanced)
   Transition بین تم‌ها + Theme Picker
   ========================================================= */

'use strict';

const ThemeEngine = {
  THEMES: ['dark', 'light', 'amber', 'neon'],
  ICONS: { dark: '🌙', light: '☀️', amber: '🟠', neon: '💜' },
  NAMES: { dark: 'شب', light: 'روز', amber: 'کهربا', neon: 'نئون' },
  COLORS: { dark: '#07070f', light: '#f6f6fb', amber: '#1a0f00', neon: '#0a0014' },

  _transitioning: false,

  /* =====================================================
     Get current
     ===================================================== */
  current() {
    return Settings.get('theme', 'dark');
  },

  /* =====================================================
     Apply theme with smooth transition
     ===================================================== */
  apply(theme, options = {}) {
    if (!this.THEMES.includes(theme)) theme = 'dark';

    const opts = {
      transition: true,
      duration: 500,
      ...options
    };

    if (this._transitioning) return;
    const oldTheme = this.current();

    // Apply data-theme
    document.documentElement.setAttribute('data-theme', theme);
    Settings.set('theme', theme);

    // Update theme btn icon
    const btn = document.querySelector('.theme-btn');
    if (btn) btn.textContent = this.ICONS[theme] || '🌙';
    // 🆕 نشون دادن اینکه تم‌های بیشتری هستن
const themeBtn = document.querySelector('.theme-btn');
if (themeBtn) {
  // چک کن چند تا تم خریداری‌شده داره
  const ownedThemes = this.THEMES.filter(t => {
    const item = Shop.ITEMS.find(i => i.type === 'theme' && i.value === t);
    return !item || Shop.isOwned(item.id);
  });

  const totalThemes = this.THEMES.length;

  // اگه کاربر فقط ۱ تم داره، یه نشانگر کوچیک نشون بده
  if (ownedThemes.length < totalThemes) {
    themeBtn.classList.add('has-locked-themes');
    themeBtn.title = `${ownedThemes.length} / ${totalThemes} تم خریداری شده`;
  } else {
    themeBtn.classList.remove('has-locked-themes');
    themeBtn.title = 'تغییر تم';
  }
}

    // Meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', this.COLORS[theme]);

    // Transition effect
    if (opts.transition && oldTheme !== theme) {
      this._showTransition(theme, opts.duration);
    }

    // Dispatch event
    document.dispatchEvent(new CustomEvent('theme:change', {
      detail: { theme, oldTheme }
    }));

    Log.debug('Theme applied:', theme);
  },

  /* =====================================================
     Transition animation
     ===================================================== */
  _showTransition(theme, duration = 500) {
    this._transitioning = true;

    // Circular reveal از دکمه تم
    const btn = document.querySelector('.theme-btn');
    const rect = btn ? btn.getBoundingClientRect() : { left: innerWidth / 2, top: 30, width: 42, height: 42 };
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // محاسبه شعاع برای پوشش کامل
    const maxDist = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(innerWidth - cx, cy),
      Math.hypot(cx, innerHeight - cy),
      Math.hypot(innerWidth - cx, innerHeight - cy)
    );

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      left: ${cx}px;
      top: ${cy}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: var(--bg);
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 99998;
      transition: all ${duration}ms cubic-bezier(0.2, 0.9, 0.3, 1);
      opacity: 0.95;
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.width = (maxDist * 2) + 'px';
      overlay.style.height = (maxDist * 2) + 'px';
      overlay.style.opacity = '0';
    });

    setTimeout(() => {
      overlay.remove();
      this._transitioning = false;
    }, duration + 100);
  },

  /* =====================================================
     Next theme
     ===================================================== */
  next() {
    const cur = this.current();

    // 🆕 فقط تم‌های خریداری‌شده
    const ownedThemes = this.THEMES.filter(theme => {
      const item = Shop.ITEMS.find(i => i.type === 'theme' && i.value === theme);
      return !item || Shop.isOwned(item.id);
    });

    if (ownedThemes.length === 0) return cur;

    // 🆕 اگه فقط یه تم داری (پیش‌فرض)
    if (ownedThemes.length === 1) {
      Toast.warn('🔒 تم‌های دیگه رو باید از فروشگاه بخری');
      Sound.error();
      // 🆕 یه shake کوچیک روی دکمه
      const btn = document.querySelector('.theme-btn');
      if (btn && typeof AnimPro !== 'undefined') {
        AnimPro.shake(btn, 4, 400);
      }
      return cur;
    }

    const currentIdx = ownedThemes.indexOf(cur);
    const nextTheme = ownedThemes[(currentIdx + 1) % ownedThemes.length];

    this.apply(nextTheme);
    return nextTheme;
},

  /* =====================================================
     Init
     ===================================================== */
  init() {
    this.apply(this.current(), { transition: false });
    Log.info('Theme Engine initialized');
  }
};

Log.info('Theme Engine loaded');