/* =========================================================
   GameLand v4 — Settings
   تم + صدا + موسیقی + زبان + بکاپ
   ========================================================= */

'use strict';

/* =========================================================
   Settings (پایه)
   ========================================================= */
const Settings = {
  KEY: 'settings',

  _cache: null,

  _load() {
    if (this._cache) return this._cache;
    this._cache = Storage.get(this.KEY, this._defaults());
    return this._cache;
  },

  _defaults() {
    return {
      theme: 'dark',
      sound: true,
      music: false,
      volume: 0.6,
      musicVolume: 0.3,
      language: 'fa',
      haptic: true,
      soundPack: 'classic'
    };
  },

  get(key, def = null) {
    const s = this._load();
    return key in s ? s[key] : def;
  },

  set(key, val) {
    const s = this._load();
    s[key] = val;
    this._cache = s;
    Storage.set(this.KEY, s);
    document.dispatchEvent(new CustomEvent('settings:change', {
      detail: { key, val }
    }));
    return true;
  },

  all() {
    return { ...this._load() };
  },

  reset() {
    this._cache = this._defaults();
    Storage.set(this.KEY, this._cache);
    Log.info('Settings reset');
  }
};

/* =========================================================
   Theme Manager
   ========================================================= */
const ThemeManager = {
  THEMES: ['dark', 'light', 'amber', 'neon'],
  ICONS: { dark: '🌙', light: '☀️', amber: '🟠', neon: '💜' },
  NAMES: { dark: 'شب', light: 'روز', amber: 'کهربا', neon: 'نئون' },

  current() {
    return Settings.get('theme', 'dark');
  },

  apply(theme) {
    if (!this.THEMES.includes(theme)) theme = 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    Settings.set('theme', theme);

    const btn = document.querySelector('.theme-btn');
    if (btn) btn.textContent = this.ICONS[theme] || '🌙';

    Log.debug('Theme applied:', theme);
  },

  next() {
    const cur = this.current();
    const idx = this.THEMES.indexOf(cur);

    // 🆕 فقط تم‌های خریداری‌شده رو بچرخون
    const ownedThemes = this.THEMES.filter(theme => {
      const item = Shop.ITEMS.find(i => i.type === 'theme' && i.value === theme);
      return !item || Shop.isOwned(item.id);
    });

    if (ownedThemes.length === 0) return cur;

    const currentIdx = ownedThemes.indexOf(cur);
    const nextTheme = ownedThemes[(currentIdx + 1) % ownedThemes.length];

    // 🆕 اگه فقط یه تم داری
    if (ownedThemes.length === 1) {
      Toast.info('برای تم‌های بیشتر، از فروشگاه بخر 🛍️');
      return cur;
    }

    this.apply(nextTheme);
    return nextTheme;
},

  init() {
    this.apply(this.current());
  }
};

/* =========================================================
   Settings UI
   ========================================================= */
const SettingsUI = {
  render(container) {
    if (!container) return;
    container.innerHTML = '';

    // تم
    container.appendChild(this._section('🎨 تم', this._themeSelector()));

    // زبان
    container.appendChild(this._section('🌐 زبان', this._languageSelector()));

    // صدا
    container.appendChild(this._section('🔊 صدا', this._soundControls()));

    // پک صدا
    container.appendChild(this._section('🎵 پک صدا', this._soundPackSelector()));

    // Haptic
    container.appendChild(this._section('📳 لرزش', this._hapticToggle()));

    // بکاپ
    container.appendChild(this._section('💾 پشتیبان‌گیری', this._backupControls()));

    // ریست
    container.appendChild(this._section('⚠️ منطقه خطر', this._resetControls()));
  },

  _section(title, content) {
    const sec = el('div', { class: 'settings-section' });
    sec.appendChild(el('h3', { class: 'settings-title', text: title }));
    sec.appendChild(content);
    return sec;
  },

  _themeSelector() {
    const wrap = el('div', { class: 'theme-grid' });
    const cur = ThemeManager.current();

    ThemeManager.THEMES.forEach(theme => {
      // چک کن آیا خریداری شده
      const item = Shop.ITEMS.find(i => i.type === 'theme' && i.value === theme);
      const owned = !item || Shop.isOwned(item.id);

      const btn = el('button', {
        class: `theme-option ${theme === cur ? 'active' : ''} ${!owned ? 'locked' : ''}`,
        'data-theme': theme
      }, [
        el('span', { class: 'theme-icon', text: ThemeManager.ICONS[theme] }),
        el('span', { class: 'theme-name', text: ThemeManager.NAMES[theme] }),
        !owned ? el('span', { class: 'theme-lock', text: '🔒' }) : null
      ]);

      btn.addEventListener('click', () => {
        if (!owned) {
          Toast.warn(`از فروشگاه بخر: 🪙 ${item.price}`);
          return;
        }
        ThemeManager.apply(theme);
        // رندر مجدد
        const parent = btn.parentElement?.parentElement;
        if (parent) this.render(parent);
        Sound.click();
      });

      wrap.appendChild(btn);
    });

    return wrap;
  },

  _languageSelector() {
    const wrap = el('div', { class: 'lang-grid' });
    const cur = I18N.current;

    const langs = [
      { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
      { code: 'en', name: 'English', flag: '🇬🇧' }
    ];

    langs.forEach(lang => {
      const btn = el('button', {
        class: `lang-option ${lang.code === cur ? 'active' : ''}`
      }, [
        el('span', { text: lang.flag }),
        el('span', { text: lang.name })
      ]);

      btn.addEventListener('click', async () => {
        await I18N.setLanguage(lang.code);
        I18N.apply();
        const parent = btn.parentElement?.parentElement;
        if (parent) this.render(parent);
        Toast.success(`زبان: ${lang.name}`);
      });

      wrap.appendChild(btn);
    });

    return wrap;
  },

  _soundControls() {
    const wrap = el('div', { class: 'control-list' });

    // Sound toggle
    const soundRow = el('div', { class: 'control-row' });
    soundRow.innerHTML = `
      <span>🔊 افکت‌های صوتی</span>
      <label class="toggle">
        <input type="checkbox" id="s_sound" ${Settings.get('sound', true) ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    `;
    wrap.appendChild(soundRow);

    // Volume slider
    const volRow = el('div', { class: 'control-row column' });
    volRow.innerHTML = `
      <div class="control-label">
        <span>🔉 صدای افکت</span>
        <b id="s_vol_val">${Math.round(Settings.get('volume', 0.6) * 100)}%</b>
      </div>
      <input type="range" class="slider" id="s_vol" min="0" max="100" value="${Settings.get('volume', 0.6) * 100}">
    `;
    wrap.appendChild(volRow);

    // Music toggle
    const musicRow = el('div', { class: 'control-row' });
    musicRow.innerHTML = `
      <span>🎵 موسیقی</span>
      <label class="toggle">
        <input type="checkbox" id="s_music" ${Settings.get('music', false) ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    `;
    wrap.appendChild(musicRow);

    // Music volume
    const mvolRow = el('div', { class: 'control-row column' });
    mvolRow.innerHTML = `
      <div class="control-label">
        <span>🎚️ صدای موسیقی</span>
        <b id="s_mvol_val">${Math.round(Settings.get('musicVolume', 0.3) * 100)}%</b>
      </div>
      <input type="range" class="slider" id="s_mvol" min="0" max="100" value="${Settings.get('musicVolume', 0.3) * 100}">
    `;
    wrap.appendChild(mvolRow);

    // Events (بعد از mount)
    setTimeout(() => {
      const sSound = document.getElementById('s_sound');
      const sVol = document.getElementById('s_vol');
      const sVolVal = document.getElementById('s_vol_val');
      const sMusic = document.getElementById('s_music');
      const sMvol = document.getElementById('s_mvol');
      const sMvolVal = document.getElementById('s_mvol_val');

      sSound?.addEventListener('change', () => {
        Sound.setEnabled(sSound.checked);
        Toast.info(sSound.checked ? 'صدا روشن' : 'صدا خاموش');
      });

      sVol?.addEventListener('input', () => {
        const v = sVol.value / 100;
        Sound.setVolume(v);
        sVolVal.textContent = Math.round(v * 100) + '%';
      });

      sMusic?.addEventListener('change', () => {
        Settings.set('music', sMusic.checked);
        if (sMusic.checked) Music.play('hub');
        else Music.stop();
      });

      sMvol?.addEventListener('input', () => {
        const v = sMvol.value / 100;
        Sound.setMusicVolume(v);
        sMvolVal.textContent = Math.round(v * 100) + '%';
      });
    }, 50);

    return wrap;
  },

  _soundPackSelector() {
    const wrap = el('div', { class: 'pack-grid' });
    const cur = Sound.currentPack;

    ['classic', '8bit', 'modern'].forEach(pack => {
      const item = Shop.ITEMS.find(i => i.type === 'sound' && i.value === pack);
      const owned = !item || Shop.isOwned(item.id);

      const btn = el('button', {
        class: `pack-option ${pack === cur ? 'active' : ''} ${!owned ? 'locked' : ''}`
      }, [
        el('span', { class: 'pack-name', text: item?.name || pack }),
        !owned ? el('span', { class: 'pack-lock', text: '🔒' }) : null
      ]);

      btn.addEventListener('click', () => {
        if (!owned) {
          Toast.warn(`از فروشگاه بخر: 🪙 ${item.price}`);
          return;
        }
        Sound.setPack(pack);
        Sound.click();
        const parent = btn.parentElement?.parentElement;
        if (parent) this.render(parent);
      });

      wrap.appendChild(btn);
    });

    return wrap;
  },

  _hapticToggle() {
    const wrap = el('div', { class: 'control-list' });
    const row = el('div', { class: 'control-row' });
    row.innerHTML = `
      <span>📳 لرزش (فقط موبایل)</span>
      <label class="toggle">
        <input type="checkbox" id="s_haptic" ${Settings.get('haptic', true) ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    `;
    wrap.appendChild(row);

    setTimeout(() => {
      const sHaptic = document.getElementById('s_haptic');
      sHaptic?.addEventListener('change', () => {
        Settings.set('haptic', sHaptic.checked);
        if (sHaptic.checked) Sound.vibrate(20);
      });
    }, 50);

    return wrap;
  },

  _backupControls() {
    const wrap = el('div', { class: 'control-list' });

    const exportBtn = el('button', { class: 'btn', text: '📤 دانلود پشتیبان' });
    exportBtn.addEventListener('click', () => {
      Backup.export();
      Toast.success('فایل پشتیبان دانلود شد');
    });
    wrap.appendChild(exportBtn);

    const importBtn = el('button', { class: 'btn', text: '📥 بازیابی از فایل' });
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          await Backup.import(file);
          Toast.success('بازیابی موفق بود');
          setTimeout(() => location.reload(), 1000);
        } catch (err) {
          Toast.error('خطا در بازیابی');
        }
      };
      input.click();
    });
    wrap.appendChild(importBtn);

    return wrap;
  },

  _resetControls() {
    const wrap = el('div', { class: 'control-list' });

    const resetBtn = el('button', {
      class: 'btn danger',
      text: '🗑️ پاک کردن همه داده‌ها'
    });
    resetBtn.addEventListener('click', () => {
      Modal.confirm(
        'همه داده‌ها پاک می‌شن (رکوردها، دستاوردها، سکه‌ها). مطمئنی؟',
        () => {
          Backup.reset();
          Toast.success('همه داده‌ها پاک شد');
          setTimeout(() => location.reload(), 1000);
        },
        { title: '⚠️ هشدار', ok: 'بله پاک کن' }
      );
    });
    wrap.appendChild(resetBtn);

    return wrap;
  }
};

Log.info('Settings loaded');