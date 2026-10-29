/* =========================================================
   GameLand v4 — i18n
   سیستم چندزبانه (فارسی / انگلیسی)
   ========================================================= */

'use strict';

const I18N = {
  current: 'fa',
  strings: {},
  fallback: 'fa',
  loaded: false,

  /* ========== Load ========== */
  async load(lang) {
    if (this.strings[lang]) {
      this.current = lang;
      return true;
    }

    try {
      const res = await fetch(`/gameland/locales/${lang}.json?v=${GL.VERSION}`);
      if (!res.ok) throw new Error('Lang file not found');
      const data = await res.json();
      this.strings[lang] = data;
      this.current = lang;
      return true;
    } catch (e) {
      Log.warn('i18n load failed:', lang, e);
      // فالبک: اگر فارسی نیست و فارسی هست، فوری بارگذاری کن
      if (lang !== 'fa' && !this.strings.fa) {
        return this.load('fa');
      }
      return false;
    }
  },

  async init() {
    const savedLang = Settings.get('language', 'fa');
    await this.load(savedLang);
    this.loaded = true;
    Log.info('i18n loaded:', this.current);
  },

  /* ========== Translate ========== */
  t(key, vars = null) {
    const lang = this.current;
    const dict = this.strings[lang] || this.strings[this.fallback] || {};
    const fallbackDict = this.strings[this.fallback] || {};

    let str = dict[key] || fallbackDict[key] || key;

    if (vars && typeof vars === 'object') {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`{${k}}`, 'g'), v);
      });
    }

    return str;
  },

  /* ========== Change language ========== */
  async setLanguage(lang) {
    const ok = await this.load(lang);
    if (!ok) return false;

    Settings.set('language', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');

    // اعلام تغییر
    document.dispatchEvent(new CustomEvent('i18n:change', {
      detail: { lang }
    }));

    Log.info('Language changed:', lang);
    return true;
  },

  /* ========== Apply to DOM ========== */
  apply(root = document) {
    // data-i18n="key"
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // data-i18n-html="key"
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = this.t(key);
    });

    // data-i18n-placeholder="key"
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', this.t(key));
    });

    // data-i18n-title="key"
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.setAttribute('title', this.t(key));
    });
  },

  /* ========== Helpers ========== */
  isRTL() {
    return this.current === 'fa';
  },

  dir() {
    return this.isRTL() ? 'rtl' : 'ltr';
  },

  /* ========== Plural ========== */
  plural(key, count) {
    // فارسی و انگلیسی هر دو جمع ساده دارن
    const str = this.t(key);
    return str.replace('{n}', formatNumber(count));
  }
};

// Alias کوتاه
function t(key, vars) {
  return I18N.t(key, vars);
}

Log.info('i18n module loaded');