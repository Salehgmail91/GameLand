/* =========================================================
   GameLand v4 — Storage
   مدیریت localStorage + AutoSave + Migration
   ========================================================= */

'use strict';

/* =========================================================
   Storage اصلی
   ========================================================= */
const Storage = {
  prefix: 'gl_',
  cache: new Map(),
  useCache: true,

  _key(k) { return this.prefix + k; },

  get(key, def = null) {
    try {
      if (this.useCache && this.cache.has(key)) return this.cache.get(key);

      const raw = localStorage.getItem(this._key(key));
      if (raw === null) return def;

      let val;
      try { val = JSON.parse(raw); }
      catch { val = raw; }

      if (this.useCache) this.cache.set(key, val);
      return val;
    } catch (e) {
      Log.warn('Storage.get error:', key, e);
      return def;
    }
  },

  set(key, val) {
    try {
      const raw = JSON.stringify(val);
      localStorage.setItem(this._key(key), raw);
      if (this.useCache) this.cache.set(key, val);
      return true;
    } catch (e) {
      Log.error('Storage.set error:', key, e);
      return false;
    }
  },

  has(key) {
    try {
      return localStorage.getItem(this._key(key)) !== null;
    } catch { return false; }
  },

  remove(key) {
    try {
      localStorage.removeItem(this._key(key));
      this.cache.delete(key);
    } catch {}
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
    this.cache.clear();
  },

  /* Export / Import برای backup */
  export() {
    const data = {};
    this.keys().forEach(k => { data[k] = this.get(k); });
    return {
      version: GL.VERSION,
      date: new Date().toISOString(),
      data
    };
  },

  import(backup) {
    if (!backup || !backup.data) return false;
    try {
      Object.entries(backup.data).forEach(([k, v]) => this.set(k, v));
      return true;
    } catch { return false; }
  }
};

/* سازگاری با نسخه قبل */
function store(key, val) {
  if (val === undefined) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  try { localStorage.setItem(key, val); } catch {}
}

/* =========================================================
   Session (فقط tab جاری)
   ========================================================= */
const Session = {
  _mem: new Map(),

  get(key, def = null) {
    if (this._mem.has(key)) return this._mem.get(key);
    try {
      const raw = sessionStorage.getItem('gl_' + key);
      if (raw === null) return def;
      return JSON.parse(raw);
    } catch { return def; }
  },

  set(key, val) {
    this._mem.set(key, val);
    try { sessionStorage.setItem('gl_' + key, JSON.stringify(val)); } catch {}
  },

  remove(key) {
    this._mem.delete(key);
    try { sessionStorage.removeItem('gl_' + key); } catch {}
  }
};

/* =========================================================
   AutoSave — ذخیره خودکار وضعیت بازی
   ========================================================= */
const AutoSave = {
  PREFIX: 'save_',
  MAX_AGE: 7 * 24 * 60 * 60 * 1000, // ۷ روز

  _key(gameId) { return this.PREFIX + gameId; },

  save(gameId, state) {
    if (!gameId) return false;
    try {
      const payload = {
        gameId,
        state: deepClone(state),
        date: Date.now(),
        version: GL.VERSION
      };
      Storage.set(this._key(gameId), payload);
      Log.debug('AutoSave saved:', gameId);
      return true;
    } catch (e) {
      Log.warn('AutoSave failed:', gameId, e);
      return false;
    }
  },

  load(gameId) {
    if (!gameId) return null;
    const payload = Storage.get(this._key(gameId));
    if (!payload) return null;

    // چک انقضا
    if (Date.now() - payload.date > this.MAX_AGE) {
      this.remove(gameId);
      return null;
    }

    // چک نسخه
    if (payload.version !== GL.VERSION) {
      Log.info('AutoSave version mismatch, discarding:', payload.version, '→', GL.VERSION);
      this.remove(gameId);
      return null;
    }

    return payload.state;
  },

  has(gameId) {
    return this.load(gameId) !== null;
  },

  remove(gameId) {
    Storage.remove(this._key(gameId));
  },

  list() {
    return Storage.keys()
      .filter(k => k.startsWith(this.PREFIX))
      .map(k => ({
        gameId: k.slice(this.PREFIX.length),
        ...Storage.get(k)
      }));
  },

  clearOld() {
    const list = this.list();
    const now = Date.now();
    list.forEach(s => {
      if (now - s.date > this.MAX_AGE) {
        Storage.remove(this.PREFIX + s.gameId);
      }
    });
  },

  clearAll() {
    this.list().forEach(s => Storage.remove(this.PREFIX + s.gameId));
  }
};

/* =========================================================
   Migration — مهاجرت از v3 به v4
   ========================================================= */
const Migration = {
  FROM_VERSION_KEY: 'gl_v3_migrated',
  TO_VERSION: '4.0.0',

  check() {
    // اگه قبلاً migrate شده، رد کن
    if (Storage.get('_migrated_v4', false)) return;

    Log.info('Running v3 → v4 migration...');

    // پرچم migrate
    Storage.set('_migrated_v4', true);
    Storage.set('_first_install', Date.now());

    // چک کن قبلاً کاربر داشته یا نه
    const hadData = Storage.keys().length > 0;
    if (!hadData) {
      Log.info('First install detected, no migration needed');
      this.initDefaults();
      return;
    }

    // Migrate favorites از آرایه ساده
    const favs = Storage.get('favorites', []);
    if (Array.isArray(favs)) {
      Storage.set('favorites', favs);
    }

    // Migrate played
    const played = Storage.get('played', []);
    if (Array.isArray(played)) {
      Storage.set('played', played);
    }

    // Achievements: از آرایه به آبجکت
    const ach = Storage.get('achievements', null);
    if (Array.isArray(ach)) {
      const obj = {};
      ach.forEach(id => { obj[id] = Date.now(); });
      Storage.set('achievements', obj);
    }

    // Stats
    if (!Storage.has('stats')) {
      Storage.set('stats', {
        gamesPlayed: 0,
        gamesList: played,
        wins: 0,
        losses: 0,
        streak: 0,
        lastPlayed: null
      });
    }

    // Coins
    if (!Storage.has('coins')) {
      Storage.set('coins', { balance: 0, total: 0, spent: 0 });
    }

    Log.info('Migration complete ✓');
  },

  initDefaults() {
    Storage.set('stats', {
      gamesPlayed: 0,
      gamesList: [],
      wins: 0,
      losses: 0,
      streak: 0,
      lastPlayed: null
    });
    Storage.set('achievements', {});
    Storage.set('favorites', []);
    Storage.set('played', []);
    Storage.set('coins', { balance: 0, total: 0, spent: 0 });
    Storage.set('settings', {
      theme: 'dark',
      sound: true,
      music: false,
      volume: 0.6,
      musicVolume: 0.3,
      language: 'fa',
      haptic: true,
      soundPack: 'classic'
    });
  }
};

/* =========================================================
   Backup
   ========================================================= */
const Backup = {
  export() {
    const backup = Storage.export();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gameland-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },

  async import(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const backup = JSON.parse(e.target.result);
          const ok = Storage.import(backup);
          resolve(ok);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  reset() {
    Storage.clearAll();
    Migration.initDefaults();
  }
};

/* اجرای Migration خودکار */
Migration.check();

Log.info('Storage loaded');