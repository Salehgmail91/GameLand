/* =========================================================
   GameLand v4 — Registry
   ثبت و مدیریت بازی‌ها
   ========================================================= */

'use strict';

const GameLand = {
  registry: {},
  _loaded: {},
  _cleanupFn: null,
  _currentGame: null,
  _currentRoot: null,

  /* ========== Register ========== */
  register(id, config) {
    if (!id || typeof id !== 'string') {
      Log.error('GameLand.register: id لازمه');
      return false;
    }
    if (!config || typeof config.init !== 'function') {
      Log.error(`GameLand.register("${id}"): init function لازمه`);
      return false;
    }

    // اعتبارسنجی
    const schema = {
      id,
      name: config.name || id,
      emoji: config.emoji || '🎮',
      desc: config.desc || '',
      tags: config.tags || [],
      color: config.color || '#7c5cff',
      author: config.author || GL.STUDIO,
      version: config.version || '1.0.0',
      supports: {
        autosave: config.supports?.autosave || false,
        multiplayer: config.supports?.multiplayer || false,
        leaderboard: config.supports?.leaderboard !== false,
        achievements: config.supports?.achievements !== false
      },
      init: config.init,
      meta: config.meta || {}
    };

    this.registry[id] = schema;
    Log.debug(`Registered: ${id}`);
    return true;
  },

  /* ========== Get ========== */
  get(id) {
    return this.registry[id] || null;
  },

  /* ========== All ========== */
  all() {
    return Object.values(this.registry);
  },

  /* ========== Exists ========== */
  exists(id) {
    return !!this.registry[id];
  },

  /* ========== Count ========== */
  count() {
    return Object.keys(this.registry).length;
  },

  /* ========== Mount a game ========== */
  mount(id, root) {
    const game = this.get(id);
    if (!game) {
      Log.error('Game not found:', id);
      Toast.error('بازی پیدا نشد');
      return false;
    }

    // Cleanup بازی قبلی
    this.unmount();

    try {
      this._currentGame = id;
      this._currentRoot = root;

      // اجرای init
      const cleanup = game.init(root);
      if (typeof cleanup === 'function') {
        this._cleanupFn = cleanup;
      }

      Log.info('Mounted:', id);
      return true;
    } catch (e) {
      Log.error('Mount failed:', id, e);
      root.innerHTML = '<p class="hint">مشکلی پیش اومد 😅</p>';
      return false;
    }
  },

  /* ========== Unmount ========== */
  unmount() {
    if (this._cleanupFn) {
      try { this._cleanupFn(); }
      catch (e) { Log.warn('Cleanup error:', e); }
      this._cleanupFn = null;
    }
    this._currentGame = null;
    this._currentRoot = null;
  },

  /* ========== Get current game info ========== */
  current() {
    return this._currentGame ? this.get(this._currentGame) : null;
  },

  /* ========== Trigger achievement ========== */
  triggerAchievement(gameId, achievementId) {
    const game = this.get(gameId);
    if (!game || !game.supports.achievements) return false;
    if (typeof Achievements !== 'undefined' && Achievements.unlock) {
      return Achievements.unlock(`${gameId}_${achievementId}`);
    }
    return false;
  },

  /* ========== Report score ========== */
  reportScore(gameId, score, meta = {}) {
    const game = this.get(gameId);
    if (!game) return null;

    const result = {};

    if (game.supports.leaderboard && typeof Leaderboard !== 'undefined') {
      result.rank = Leaderboard.submit(gameId, score, meta);
    }

    if (typeof PlayerStats !== 'undefined') {
      PlayerStats.markGame(gameId);
    }

    return result;
  },

  /* ========== Report win ========== */
  reportWin(gameId, meta = {}) {
    if (typeof PlayerStats !== 'undefined') {
      PlayerStats.win(gameId);
    }
  },

  /* ========== Report loss ========== */
  reportLoss(gameId, meta = {}) {
    if (typeof PlayerStats !== 'undefined') {
      PlayerStats.lose(gameId);
    }
  },

  /* ========== Autosave helpers ========== */
  saveState(state) {
    if (!this._currentGame) return false;
    const game = this.get(this._currentGame);
    if (!game || !game.supports.autosave) return false;
    return AutoSave.save(this._currentGame, state);
  },

  loadState() {
    if (!this._currentGame) return null;
    const game = this.get(this._currentGame);
    if (!game || !game.supports.autosave) return null;
    return AutoSave.load(this._currentGame);
  },

  clearState() {
    if (!this._currentGame) return;
    AutoSave.remove(this._currentGame);
  },

  /* ========== Debug ========== */
  debug() {
    const list = this.all().map(g => ({
      id: g.id,
      name: g.name,
      emoji: g.emoji,
      autosave: g.supports.autosave
    }));
    console.table(list);
    return list;
  }
};

Log.info('Registry loaded');