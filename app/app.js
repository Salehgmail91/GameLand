/* =========================================================
   GameLand v5 — App (Enhanced)
   شروع‌کننده با انیمیشن‌ها
   ========================================================= */

'use strict';

const App = {
  initialized: false,

  async init() {
    if (this.initialized) return;
    Log.info('Initializing GameLand v5...');

    // ۱. i18n
    await I18N.init();
    I18N.apply();

    // ۲. Theme (v5)
    if (typeof ThemeEngine !== 'undefined') {
      ThemeEngine.init();
    } else {
      ThemeManager.init();
    }

    // ۳. Sound
    const savedPack = Settings.get('soundPack', 'classic');
    Sound.currentPack = savedPack;
    Sound.enabled = Settings.get('sound', true);
    Sound.setVolume(Settings.get('volume', 0.6));
    Sound.setMusicVolume(Settings.get('musicVolume', 0.3));

    // ۴. Migration
    Migration.check();

    // ۵. Routes
    this._registerRoutes();

    // ۶. GamesList
    initGamesList();

    // ۷. Hub
    Hub.init();

    // ۸. 🆕 Effects + Animations
    if (typeof Effects !== 'undefined') Effects.init();
    if (typeof Anim !== 'undefined') Anim.init();
// ۸.۵. AnimPro Extra
if (typeof AnimPro !== 'undefined' && !Env.isTouch()) {
  // Trail
  AnimPro.initTrail({
    maxPoints: 20,
    size: 6,
    fadeSpeed: 0.05
  });

  // Magnetic روی همه دکمه‌های .magnetic (خودش)
  AnimPro.initMagnetic();
}
    // ۹. Router
    Router.init();

    // ۱۰. Header bindings
    this._bindHeader();

    // ۱۱. Bottom Nav
    this._bindBottomNav();

    // ۱۲. Keyboard
    this._bindKeyboard();

    // ۱۳. Network
    this._bindNetwork();

    // ۱۴. Visibility
    this._bindVisibility();

    // ۱۵. Auto-check achievements
    setInterval(() => Achievements.check(), 60000);

    // ۱۶. AutoSave cleanup
    AutoSave.clearOld();

    // ۱۷. Preloader
    this._hidePreloader();

    // ۱۸. Welcome
    this._showWelcomeIfFirst();

    this.initialized = true;
    Log.info('GameLand v5 initialized ✨');
  },

  /* =====================================================
     Routes
     ===================================================== */
  _registerRoutes() {
    const cleanupWrapper = (name, fn) => (root, params) => {
      Views.cleanup(root);
      return fn(root, params);
    };

    Router.registerMany({
      home:         { title: 'خانه',         icon: '🏠', render: cleanupWrapper('home', (r) => Hub.render(r)) },
      favorites:    { title: 'علاقه‌مندی‌ها', icon: '⭐', render: cleanupWrapper('fav', (r) => Views.favorites(r)) },
      achievements: { title: 'دستاوردها',    icon: '🏆', render: cleanupWrapper('ach', (r) => Views.achievements(r)) },
      stats:        { title: 'آمار',         icon: '📊', render: cleanupWrapper('stats', (r) => Views.stats(r)) },
      shop:         { title: 'فروشگاه',      icon: '🛍️', render: cleanupWrapper('shop', (r) => Views.shop(r)) },
      settings:     { title: 'تنظیمات',      icon: '⚙️', render: cleanupWrapper('settings', (r) => Views.settings(r)) },
      profile:      { title: 'پروفایل',      icon: '👤', render: cleanupWrapper('profile', (r) => Views.profile(r)) },
      rewards:      { title: 'جایزه روزانه', icon: '🎁', render: cleanupWrapper('rewards', (r) => Views.rewards(r)) }
    });

    Router.register('fav', Router.routes.favorites);
    Router.register('ach', Router.routes.achievements);
  },

  /* =====================================================
     Header
     ===================================================== */
  _bindHeader() {
    // Theme toggle (v5 با ThemeEngine)
    const themeBtn = $('#themeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const t = (typeof ThemeEngine !== 'undefined')
          ? ThemeEngine.next()
          : ThemeManager.next();
        const names = (typeof ThemeEngine !== 'undefined')
          ? ThemeEngine.NAMES
          : ThemeManager.NAMES;
        Toast.info(`تم: ${names[t] || t}`);
        Sound.click();
      });
    }

    // Logo
    const logo = $('#logoLink');
    if (logo) {
      logo.addEventListener('click', e => {
        e.preventDefault();
        Router.go('home');
      });
    }

    // Sound
    const soundBtn = $('#soundToggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const on = !Sound.enabled;
        Sound.setEnabled(on);
        soundBtn.textContent = on ? '🔊' : '🔇';
        soundBtn.classList.toggle('off', !on);
        if (on) Sound.click();
        Toast.info(on ? 'صدا روشن' : 'صدا خاموش');
      });
      soundBtn.textContent = Sound.enabled ? '🔊' : '🔇';
      soundBtn.classList.toggle('off', !Sound.enabled);
    }

    // Coins (با bump animation)
    const coinsEl = $('#headerCoins');
    if (coinsEl) {
      const update = () => {
        coinsEl.querySelector('b').textContent = formatNumber(Coins.balance());
        coinsEl.classList.add('bump');
        setTimeout(() => coinsEl.classList.remove('bump'), 500);
      };
      coinsEl.querySelector('b').textContent = formatNumber(Coins.balance());
      document.addEventListener('coins:change', update);
      coinsEl.addEventListener('click', () => Router.go('shop'));
    }

    // Avatar
    const avatarEl = $('#headerAvatar');
    if (avatarEl) {
      const update = () => {
        avatarEl.textContent = Profile.getAvatar();
      };
      update();
      document.addEventListener('avatar:change', update);
      document.addEventListener('profile:update', update);
      avatarEl.addEventListener('click', () => Router.go('profile'));
    }

    // Back
    const backBtn = $('#gameBackBtn');
    if (backBtn) backBtn.addEventListener('click', () => Router.closeGame());

    // Fav
    const gameFavBtn = $('#gameFavBtn');
    if (gameFavBtn) {
      gameFavBtn.addEventListener('click', () => {
        const id = gameFavBtn.dataset.game;
        if (!id) return;
        const active = Favorites.toggle(id);
        gameFavBtn.classList.toggle('active', active);
        gameFavBtn.textContent = active ? '⭐' : '☆';
        if (active) Anim.burstConfetti(gameFavBtn, 15);
      });
    }

    // Menu
    const gameMenuBtn = $('#gameMenuBtn');
    if (gameMenuBtn) {
      gameMenuBtn.addEventListener('click', () => this._openGameMenu());
    }
  },

  /* =====================================================
     Game Menu
     ===================================================== */
  _openGameMenu() {
    const gameId = GameLand._currentGame;
    if (!gameId) return;
    const game = GameLand.get(gameId);
    if (!game) return;

    const best = Leaderboard.best(gameId);
    const stats = PlayerStats.forGame(gameId);
    const hasSave = AutoSave.has(gameId);

    BottomSheet.open({
      title: `${game.emoji} ${game.name}`,
      content: `
        <div class="game-menu">
          <div class="gm-stats">
            <div class="gm-stat">
              <div class="gm-stat-value">${formatNumber(best)}</div>
              <div class="gm-stat-label">رکورد</div>
            </div>
            <div class="gm-stat">
              <div class="gm-stat-value">${stats.played}</div>
              <div class="gm-stat-label">بازی</div>
            </div>
            <div class="gm-stat">
              <div class="gm-stat-value">${stats.wins}</div>
              <div class="gm-stat-label">برد</div>
            </div>
          </div>
          <button class="btn gm-btn ripple" id="gm-restart">🔄 شروع مجدد</button>
          <button class="btn gm-btn ripple" id="gm-leaderboard">🏆 رکوردها</button>
          <button class="btn gm-btn ripple" id="gm-fav">${Favorites.has(gameId) ? '⭐ حذف از علاقه‌مندی' : '☆ افزودن به علاقه‌مندی'}</button>
          <button class="btn danger gm-btn ripple" id="gm-exit">🚪 خروج</button>
        </div>
      `,
      actions: []
    });

    setTimeout(() => {
      $('#gm-restart')?.addEventListener('click', () => {
        BottomSheet.close();
        Router.go('home');
        setTimeout(() => { location.hash = gameId; }, 100);
      });
      $('#gm-leaderboard')?.addEventListener('click', () => {
        BottomSheet.close();
        this._showLeaderboardModal(gameId);
      });
      $('#gm-fav')?.addEventListener('click', () => {
        BottomSheet.close();
        const active = Favorites.toggle(gameId);
        const btn = $('#gameFavBtn');
        if (btn) {
          btn.classList.toggle('active', active);
          btn.textContent = active ? '⭐' : '☆';
        }
      });
      $('#gm-exit')?.addEventListener('click', () => {
        BottomSheet.close();
        Router.closeGame();
      });
    }, 100);
  },

  _showLeaderboardModal(gameId) {
    const list = Leaderboard.get(gameId);
    const game = GameLand.get(gameId);

    Modal.open({
      title: `🏆 رکوردهای ${game ? game.name : gameId}`,
      body: list.length
        ? Leaderboard.renderHTML(gameId)
        : '<p class="hint" style="text-align:center">هنوز رکوردی ثبت نشده</p>',
      actions: [{ label: 'بستن', primary: true }]
    });
  },

  /* =====================================================
     Bottom Nav
     ===================================================== */
  _bindBottomNav() {
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.nav;
        if (view) {
          Sound.click();
          Router.go(view);
        }
      });
    });
  },

  /* =====================================================
     Keyboard
     ===================================================== */
  _bindKeyboard() {
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!isVisible($('#gameView'))) return;
        if (typeof Modal !== 'undefined' && Modal.el) return;
        if (typeof BottomSheet !== 'undefined' && BottomSheet.el) return;
        Router.closeGame();
      }
    });
  },

  _bindNetwork() {
    window.addEventListener('online', () => Toast.success('اینترنت وصل شد'));
    window.addEventListener('offline', () => Toast.warn('اینترنت قطع شد'));
  },

  _bindVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Music.pauseMusic();
      } else {
        Music.resumeMusic();
      }
    });
  },

  /* =====================================================
     Preloader
     ===================================================== */
  _hidePreloader() {
    const pre = $('#preloader');
    if (!pre) return;
    setTimeout(() => {
      pre.classList.add('hidden');
      setTimeout(() => pre.remove(), 600);
    }, 600);
  },

  /* =====================================================
     Welcome
     ===================================================== */
  _showWelcomeIfFirst() {
    const firstRun = !Storage.get('_welcomed', false);
    if (!firstRun) return;
    Storage.set('_welcomed', true);

    setTimeout(() => {
      // 🆕 Effect
      if (typeof Effects !== 'undefined') {
        Effects.confettiPro('stars', { count: 30 });
      }

      Modal.open({
        title: '🎮 خوش آمدی به GameLand v5!',
        body: `
          <div class="welcome-modal">
            <p>اینجا <b>${GamesList.count()} بازی</b> باحال داری!</p>
            <ul class="welcome-list">
              <li>⭐ بازی‌ها رو لایک کن</li>
              <li>🪙 با بازی کردن سکه بگیر</li>
              <li>🎁 هر روز جایزه بگیر</li>
              <li>🏆 دستاوردها رو باز کن</li>
              <li>🛍️ آیتم‌های جدید بخر</li>
              <li>✨ ۴ تم زیبا داری</li>
            </ul>
            <p class="welcome-hint">💡 با Ctrl+K هرجا می‌تونی جستجو کنی</p>
          </div>
        `,
        actions: [{ label: 'بزن بریم! 🚀', primary: true }]
      });
    }, 1000);
  }
};

/* =========================================================
   Start
   ========================================================= */
window.addEventListener('DOMContentLoaded', () => {
  App.init().catch(e => {
    Log.error('Init failed:', e);
    Toast.error('خطا در راه‌اندازی');
  });
});

Log.info('App v5 loaded');