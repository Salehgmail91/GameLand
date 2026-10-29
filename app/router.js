/* =========================================================
   GameLand v4 — Router
   Hash-based routing + View Manager
   ========================================================= */

'use strict';

const Router = {
  routes: {},
  current: null,
  history: [],
  _cleanup: null,

  /* =====================================================
     Register route
     ===================================================== */
  register(name, config) {
    this.routes[name] = {
      name,
      title: config.title || name,
      icon: config.icon || '📄',
      render: config.render,       // (root) => void
      onEnter: config.onEnter,     // (params) => void
      onLeave: config.onLeave,     // () => void
      requiresGame: config.requiresGame || false
    };
  },

  registerMany(routes) {
    Object.entries(routes).forEach(([name, cfg]) => this.register(name, cfg));
  },

  /* =====================================================
     Go to route
     ===================================================== */
  go(name, params = null) {
    const hash = params
      ? `#${name}?${new URLSearchParams(params)}`
      : `#${name}`;
    if (location.hash === hash) {
      this._handle();
    } else {
      location.hash = hash;
    }
  },

  back() {
    history.back();
  },

  /* =====================================================
     Parse hash
     ===================================================== */
  parse() {
    const raw = location.hash.replace(/^#/, '') || 'home';
    const [path, queryStr] = raw.split('?');
    const params = {};
    if (queryStr) {
      new URLSearchParams(queryStr).forEach((v, k) => { params[k] = v; });
    }
    return { path, params };
  },

  /* =====================================================
     Handle route change
     ===================================================== */
  _handle() {
    const { path, params } = this.parse();

    // چک بازی؟
    if (GameLand.exists(path)) {
      this._loadGame(path);
      return;
    }

    // Route معمولی
    const route = this.routes[path] || this.routes.home;
    if (!route) {
      Log.warn('Route not found:', path);
      this.go('home');
      return;
    }

    this._loadView(route, params);
  },

  /* =====================================================
     Load normal view
     ===================================================== */
  _loadView(route, params) {
    // Cleanup قبلی
    this._cleanupPrevious();

    // Unmount بازی اگر باز بود
    if (GameLand._currentGame) GameLand.unmount();

    // onLeave قبلی
    const prev = this.current && this.routes[this.current];
    if (prev && prev.onLeave) try { prev.onLeave(); } catch {}

    this.current = route.name;

    // onEnter
    if (route.onEnter) try { route.onEnter(params); } catch {}

    // Clear view container
    const viewRoot = $('#viewRoot');
    if (!viewRoot) return;
    viewRoot.innerHTML = '';
    viewRoot.setAttribute('data-view', route.name);

    // Hide game view
    hide($('#gameView'));
    show($('#appView'));

    // Render
    try {
      route.render(viewRoot, params);
      this._cleanup = route.onLeave || null;
    } catch (e) {
      Log.error('Render error:', route.name, e);
      viewRoot.innerHTML = '<p class="hint">مشکلی پیش اومد 😅</p>';
    }

    // Update bottom nav
    this._updateNav(route.name);

    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* =====================================================
     Load game
     ===================================================== */
  _loadGame(gameId) {
    const game = GameLand.get(gameId);
    if (!game) {
      Toast.error('بازی پیدا نشد');
      this.go('home');
      return;
    }

    // Cleanup قبلی
    this._cleanupPrevious();

    // Hide app views
    hide($('#appView'));
    show($('#gameView'));

    // Update title
    const titleEl = $('#gameTitle');
    if (titleEl) titleEl.innerHTML = `${game.emoji} ${game.name}`;

    // Update fav button
    this._updateFavBtn(gameId);

    // Update pause button visibility
    const pauseBtn = $('#gamePauseBtn');
    if (pauseBtn) {
      pauseBtn.style.display = game.supports?.autosave ? 'inline-flex' : 'none';
    }

    // Mount
    const root = $('#gameArea');
    if (!root) return;
    root.innerHTML = '';

    GameLand.mount(gameId, root);

    // Track
    if (typeof PlayerStats !== 'undefined') PlayerStats.markGame(gameId);
    if (typeof SessionStats !== 'undefined') SessionStats.trackGame();
    if (typeof TimeTracker !== 'undefined') TimeTracker.start();

    // Mark current
    this.current = gameId;

    // Update URL
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* =====================================================
     Close game
     ===================================================== */
  closeGame() {
    if (GameLand._currentGame) {
      // ذخیره AutoSave
      if (typeof TimeTracker !== 'undefined') TimeTracker.stop();

      GameLand.unmount();
    }
    this.go('home');
  },

  /* =====================================================
     Helpers
     ===================================================== */
  _cleanupPrevious() {
    if (this._cleanup) {
      try { this._cleanup(); } catch (e) { Log.warn('Cleanup:', e); }
      this._cleanup = null;
    }
  },

  _updateNav(routeName) {
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === routeName);
    });
  },

  _updateFavBtn(gameId) {
    const btn = $('#gameFavBtn');
    if (!btn) return;
    const isFav = Favorites.has(gameId);
    btn.classList.toggle('active', isFav);
    btn.textContent = isFav ? '⭐' : '☆';
    btn.dataset.game = gameId;
  },

  /* =====================================================
     Init
     ===================================================== */
  init() {
    window.addEventListener('hashchange', () => this._handle());
    this._handle();
    Log.info('Router initialized');
  }
};

/* =========================================================
   Favorites (سیستم مستقل - برای Router)
   ========================================================= */
const Favorites = {
  KEY: 'favorites',

  get() {
    return Storage.get(this.KEY, []);
  },

  set(list) {
    Storage.set(this.KEY, list);
    document.dispatchEvent(new CustomEvent('favorites:change', { detail: list }));
  },

  has(id) {
    return this.get().includes(id);
  },

  toggle(id) {
    const list = this.get();
    const idx = list.indexOf(id);
    if (idx === -1) {
      list.push(id);
      Toast.success('⭐ به علاقه‌مندی‌ها اضافه شد');
      Sound.pop();
    } else {
      list.splice(idx, 1);
      Toast.info('از علاقه‌مندی‌ها حذف شد');
      Sound.click();
    }
    this.set(list);
    if (list.length >= 1) Achievements.unlock('first_fav');
    if (list.length >= 3) Achievements.unlock('fav_3');
    if (list.length >= 10) Achievements.unlock('fav_10');
    return idx === -1;
  },

  list() {
    return this.get().map(id => GameLand.get(id)).filter(Boolean);
  },

  count() {
    return this.get().length;
  },

  reset() {
    Storage.remove(this.KEY);
  }
};

Log.info('Router + Favorites loaded');