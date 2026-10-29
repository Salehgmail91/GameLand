/* =========================================================
   GameLand v4 — Games List
   لیست کامل ۳۰ بازی با متادیتا
   ========================================================= */

'use strict';

/* =========================================================
   Metadata (اضافی به اطلاعات موجود در فایل هر بازی)
   ========================================================= */
const GAMES_META = {
  yahtzee: { order: 35, isNew: true, featured: true, difficulty: 'متوسط', popularity: 80 },
  'word-search': { order: 34, isNew: true, featured: false, difficulty: 'آسان', popularity: 78 },
  'reaction-grid': { order: 33, isNew: true, featured: false, difficulty: 'متوسط', popularity: 82 },
  'color-match': { order: 32, isNew: true, featured: false, difficulty: 'آسان', popularity: 85 },
  /* ========== کلاسیک ========== */
  slot: { order: 31, isNew: true, featured: true, difficulty: 'آسان', popularity: 88 },
  snake:       { order: 1,  isNew: false, featured: true,  difficulty: 'متوسط', popularity: 95 },
  g2048:       { order: 2,  isNew: false, featured: true,  difficulty: 'سخت',    popularity: 90 },
  ttt:         { order: 3,  isNew: false, featured: false, difficulty: 'آسان',   popularity: 85 },
  breakout:    { order: 4,  isNew: false, featured: false, difficulty: 'متوسط', popularity: 88 },
  pong:        { order: 5,  isNew: false, featured: false, difficulty: 'آسان',   popularity: 75 },
  tetris:      { order: 6,  isNew: false, featured: true,  difficulty: 'سخت',    popularity: 93 },
  minesweeper: { order: 7,  isNew: false, featured: false, difficulty: 'سخت',    popularity: 82 },

  /* ========== فکری ========== */
  memory:      { order: 8,  isNew: false, featured: false, difficulty: 'آسان',   popularity: 78 },
  bubble:      { order: 9,  isNew: false, featured: false, difficulty: 'متوسط', popularity: 80 },
  puzzle:      { order: 10, isNew: false, featured: false, difficulty: 'متوسط', popularity: 70 },
  simon:       { order: 11, isNew: false, featured: false, difficulty: 'آسان',   popularity: 75 },
  lightsout:   { order: 12, isNew: true,  featured: false, difficulty: 'متوسط', popularity: 68 },
  sequence:    { order: 13, isNew: true,  featured: false, difficulty: 'متوسط', popularity: 72 },

  /* ========== سرعتی ========== */
  reaction:    { order: 14, isNew: false, featured: false, difficulty: 'آسان',   popularity: 88 },
  whack:       { order: 15, isNew: false, featured: false, difficulty: 'آسان',   popularity: 85 },
  flappy:      { order: 16, isNew: false, featured: true,  difficulty: 'سخت',    popularity: 87 },

  /* ========== استراتژی ========== */
  connect4:    { order: 17, isNew: true,  featured: true,  difficulty: 'متوسط', popularity: 82 },
  hangman:     { order: 18, isNew: true,  featured: false, difficulty: 'آسان',   popularity: 74 },

  /* ========== شانسی ========== */
  rps:         { order: 19, isNew: false, featured: false, difficulty: 'آسان',   popularity: 80 },
  dice:        { order: 20, isNew: true,  featured: false, difficulty: 'آسان',   popularity: 76 },

  /* ========== جدید v4 ========== */
  sudoku:      { order: 21, isNew: true,  featured: true,  difficulty: 'سخت',    popularity: 85 },
  mahjong:     { order: 22, isNew: true,  featured: true,  difficulty: 'متوسط', popularity: 78 },
  uno:         { order: 23, isNew: true,  featured: false, difficulty: 'متوسط', popularity: 82 },
  'chess-puzzle': { order: 24, isNew: true, featured: false, difficulty: 'سخت',  popularity: 70 },
  'pixel-art': { order: 25, isNew: true,  featured: true,  difficulty: 'آسان',   popularity: 88 },
  'piano-tiles': { order: 26, isNew: true, featured: true, difficulty: 'متوسط', popularity: 90 },
  racing:      { order: 27, isNew: true,  featured: false, difficulty: 'متوسط', popularity: 85 },
  puzzle15:    { order: 28, isNew: true,  featured: false, difficulty: 'متوسط', popularity: 72 },
  'math-blitz': { order: 29, isNew: true, featured: false, difficulty: 'متوسط', popularity: 80 },
  jigsaw:      { order: 30, isNew: true,  featured: true,  difficulty: 'آسان',   popularity: 82 }
};

/* =========================================================
   GamesList
   ========================================================= */
const GamesList = {
  /* =====================================================
     Get enriched list
     ===================================================== */
  all() {
    return GameLand.all()
      .map(g => ({
        ...g,
        ...(GAMES_META[g.id] || { order: 999, isNew: false, featured: false, popularity: 50 })
      }))
      .sort((a, b) => a.order - b.order);
  },

  /* =====================================================
     Featured (برای هیرو)
     ===================================================== */
  featured() {
    return this.all().filter(g => g.featured);
  },

  /* =====================================================
     New (برای بخش "جدید")
     ===================================================== */
  new() {
    return this.all().filter(g => g.isNew);
  },

  /* =====================================================
     Popular
     ===================================================== */
  popular(n = 8) {
    return [...this.all()]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, n);
  },

  /* =====================================================
     By tag
     ===================================================== */
  byTag(tag) {
    if (tag === 'همه') return this.all();
    return this.all().filter(g => g.tags.includes(tag));
  },

  /* =====================================================
     All tags
     ===================================================== */
  tags() {
    const set = new Set();
    this.all().forEach(g => g.tags.forEach(t => set.add(t)));
    return ['همه', ...set];
  },

  /* =====================================================
     Search
     ===================================================== */
  search(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return this.all();
    return this.all().filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.desc.toLowerCase().includes(q) ||
      g.tags.some(t => t.toLowerCase().includes(q))
    );
  },

  /* =====================================================
     Filter (combo)
     ===================================================== */
  filter({ tag = 'همه', query = '', sort = 'order' } = {}) {
    let list = this.all();

    if (tag !== 'همه') {
      list = list.filter(g => g.tags.includes(tag));
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.desc.toLowerCase().includes(q)
      );
    }

    if (sort === 'popularity') {
      list.sort((a, b) => b.popularity - a.popularity);
    } else if (sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    } else if (sort === 'newest') {
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else {
      list.sort((a, b) => a.order - b.order);
    }

    return list;
  },

  /* =====================================================
     Random
     ===================================================== */
  random() {
    const list = this.all();
    return list[Math.floor(Math.random() * list.length)];
  },

  /* =====================================================
     Count
     ===================================================== */
  count() {
    return this.all().length;
  },

  /* =====================================================
     Categories
     ===================================================== */
  categories() {
    return [
      { id: 'همه',     name: 'همه',          icon: '🎮', count: this.count() },
      { id: 'کلاسیک',  name: 'کلاسیک',       icon: '👾', count: this.byTag('کلاسیک').length },
      { id: 'فکری',    name: 'فکری',         icon: '🧠', count: this.byTag('فکری').length },
      { id: 'سرعتی',   name: 'سرعتی',        icon: '⚡', count: this.byTag('سرعتی').length },
      { id: 'آرکید',   name: 'آرکید',        icon: '🕹️', count: this.byTag('آرکید').length },
      { id: 'استراتژی', name: 'استراتژی',    icon: '♟️', count: this.byTag('استراتژی').length },
      { id: 'شانسی',   name: 'شانسی',        icon: '🎲', count: this.byTag('شانسی').length },
      { id: 'ورزشی',   name: 'ورزشی',        icon: '⚽', count: this.byTag('ورزشی').length },
      { id: 'جدید',    name: 'جدید',         icon: '✨', count: this.byTag('جدید').length }
    ].filter(c => c.count > 0);
  }
};

/* =========================================================
   Command Palette commands (با بازی‌ها)
   ========================================================= */
function registerGameCommands() {
  if (typeof CommandPalette === 'undefined') return;

  GamesList.all().forEach(game => {
    CommandPalette.register({
      title: game.name,
      icon: game.emoji,
      tags: ['بازی', ...game.tags, game.id],
      action: () => {
        location.hash = game.id;
      }
    });
  });
}

/* =========================================================
   Init
   ========================================================= */
function initGamesList() {
  // دستورات Command Palette
  registerGameCommands();

  // دستورات اضافی
  if (typeof CommandPalette !== 'undefined') {
    CommandPalette.registerMany([
      { title: 'خانه', icon: '🏠', tags: ['home'], action: () => Router.go('home') },
      { title: 'علاقه‌مندی‌ها', icon: '⭐', tags: ['fav'], action: () => Router.go('favorites') },
      { title: 'دستاوردها', icon: '🏆', tags: ['ach'], action: () => Router.go('achievements') },
      { title: 'آمار', icon: '📊', tags: ['stats'], action: () => Router.go('stats') },
      { title: 'فروشگاه', icon: '🛍️', tags: ['shop'], action: () => Router.go('shop') },
      { title: 'پروفایل', icon: '👤', tags: ['profile'], action: () => Router.go('profile') },
      { title: 'تنظیمات', icon: '⚙️', tags: ['settings'], action: () => Router.go('settings') },
      { title: 'جایزه روزانه', icon: '🎁', tags: ['reward'], action: () => Router.go('rewards') },
      { title: 'پشتیبان‌گیری', icon: '💾', tags: ['backup'], action: () => Backup.export() },
      { title: 'بازی تصادفی', icon: '🎲', tags: ['random'], action: () => {
        const g = GamesList.random();
        if (g) location.hash = g.id;
      }}
    ]);
  }
}

Log.info('GamesList loaded:', GamesList.count(), 'games');