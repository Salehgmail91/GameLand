/* =========================================================
   GameLand v4 — Achievements
   ۳۰+ دستاورد در ۶ دسته
   ========================================================= */

'use strict';

const Achievements = {
  KEY: 'achievements',

  /* =====================================================
     لیست دستاوردها
     ===================================================== */
  LIST: [
    /* ========== شروع (Getting Started) ========== */
    { id: 'first_game',    name: 'شروع ماجرا',    icon: '🎮', desc: 'اولین بازی رو انجام بده',           category: 'start',  coins: 10 },
    { id: 'first_win',     name: 'اولین برد',     icon: '🥇', desc: 'اولین بار برنده شو',                category: 'start',  coins: 20 },
    { id: 'first_fav',     name: 'ستاره‌دار',     icon: '⭐', desc: 'اولین بازی رو لایک کن',              category: 'start',  coins: 5 },

    /* ========== کاوش (Exploration) ========== */
    { id: 'play_5',        name: 'کاوشگر',        icon: '🗺️', desc: '۵ بازی مختلف انجام بده',             category: 'explore', coins: 30 },
    { id: 'play_10',       name: 'ماجراجو',       icon: '🧭', desc: '۱۰ بازی مختلف انجام بده',            category: 'explore', coins: 50 },
    { id: 'play_all',      name: 'همه‌چیزدان',    icon: '👑', desc: 'همه بازی‌ها رو امتحان کن',           category: 'explore', coins: 100 },
    { id: 'fav_3',         name: 'ستاره‌چین',     icon: '✨', desc: '۳ بازی رو لایک کن',                  category: 'explore', coins: 20 },
    { id: 'fav_10',        name: 'کلکسیونر',      icon: '💫', desc: '۱۰ بازی رو لایک کن',                 category: 'explore', coins: 60 },

    /* ========== برد و مهارت (Skill) ========== */
    { id: 'win_10',        name: 'برنده',         icon: '🏆', desc: '۱۰ بار برنده شو',                    category: 'skill',   coins: 50 },
    { id: 'win_50',        name: 'قهرمان',        icon: '🏅', desc: '۵۰ بار برنده شو',                    category: 'skill',   coins: 150 },
    { id: 'win_100',       name: 'افسانه',        icon: '👑', desc: '۱۰۰ بار برنده شو',                   category: 'skill',   coins: 500 },
    { id: 'win_streak_3',  name: 'سه‌گانه',       icon: '🔥', desc: '۳ برد پشت سر هم',                    category: 'skill',   coins: 30 },
    { id: 'win_streak_5',  name: 'آتشین',         icon: '💥', desc: '۵ برد پشت سر هم',                    category: 'skill',   coins: 80 },

    /* ========== سرعت و زمان (Speed) ========== */
    { id: 'speedster',     name: 'سریع',          icon: '⚡', desc: 'تست سرعت زیر ۲۰۰ms',                 category: 'speed',   coins: 40 },
    { id: 'lightning',     name: 'صاعقه',         icon: '🌩️', desc: 'تست سرعت زیر ۱۵۰ms',                 category: 'speed',   coins: 100 },
    { id: 'night_owl',     name: 'جغد شب',        icon: '🌙', desc: 'بعد از نیمه‌شب بازی کن',             category: 'time',    coins: 20 },
    { id: 'early_bird',    name: 'سحرخیز',        icon: '🌅', desc: 'قبل از ۷ صبح بازی کن',                category: 'time',    coins: 20 },
    { id: 'marathon',      name: 'ماراتن',        icon: '⏱️', desc: '۳۰ دقیقه در یک روز بازی کن',          category: 'time',    coins: 50 },

    /* ========== پایداری (Persistent) ========== */
    { id: 'streak_3',      name: 'وفادار',        icon: '📅', desc: '۳ روز متوالی بازی کن',                category: 'persist', coins: 40 },
    { id: 'streak_7',      name: 'همراه',         icon: '🔗', desc: '۷ روز متوالی بازی کن',                category: 'persist', coins: 100 },
    { id: 'streak_30',     name: 'پایدار',        icon: '💎', desc: '۳۰ روز متوالی بازی کن',               category: 'persist', coins: 500 },

    /* ========== چالش (Challenge) ========== */
    { id: 'daily_1',       name: 'چالش‌گر',       icon: '📆', desc: 'اولین چالش روزانه رو کامل کن',        category: 'challenge', coins: 30 },
    { id: 'daily_7',       name: 'منظم',          icon: '📊', desc: '۷ چالش روزانه رو کامل کن',            category: 'challenge', coins: 100 },
    { id: 'daily_30',      name: 'بی‌نقص',        icon: '🎯', desc: '۳۰ چالش روزانه رو کامل کن',           category: 'challenge', coins: 500 },
    { id: 'weekly_1',      name: 'هفتگی',         icon: '📈', desc: 'اولین چالش هفتگی رو بزن',             category: 'challenge', coins: 50 },

    /* ========== کاوش بازی‌ها (Per-Game) ========== */
    { id: 'snake_100',     name: 'مار ماهر',      icon: '🐍', desc: 'امتیاز ۱۰۰ در مار',                   category: 'game',    coins: 30 },
    { id: 'snake_500',     name: 'مار افسانه',    icon: '🐍', desc: 'امتیاز ۵۰۰ در مار',                   category: 'game',    coins: 100 },
    { id: 'g2048_win',     name: '۲۰۴۸',          icon: '🎯', desc: 'به ۲۰۴۸ برس',                        category: 'game',    coins: 100 },
    { id: 'tetris_1000',   name: 'تتریس‌باز',     icon: '🧩', desc: 'امتیاز ۱۰۰۰ در تتریس',                category: 'game',    coins: 50 },
    { id: 'ttt_win',       name: 'استاد دوز',     icon: '⭕', desc: 'AI رو در دوز شکست بده',               category: 'game',    coins: 30 },
    { id: 'memory_perfect', name: 'حافظه‌فولادی', icon: '🧠', desc: 'بازی حافظه رو زیر ۳۰ حرکت تموم کن',   category: 'game',    coins: 50 },
    { id: 'minesweeper_win', name: 'خنثی‌کننده',  icon: '💣', desc: 'مین‌یاب رو ببر',                       category: 'game',    coins: 60 },
    { id: 'connect4_win',  name: 'چهارساز',       icon: '🔷', desc: 'AI رو در چهارتایی شکست بده',          category: 'game',    coins: 40 },
    { id: 'flappy_30',     name: 'پرنده بال‌دار', icon: '🐦', desc: 'امتیاز ۳۰ در پرنده',                  category: 'game',    coins: 60 },

    /* ========== مخفی (Hidden) ========== */
    { id: 'konami',        name: 'کونامی',        icon: '🎮', desc: 'کد کونامی رو بزن',                    category: 'hidden',  coins: 50, hidden: true },
    { id: 'dark_mode',     name: 'شب‌گرد',        icon: '🌑', desc: 'حالت شب رو فعال کن',                  category: 'hidden',  coins: 10, hidden: true },
    { id: 'perfectionist', name: 'کامل‌گرا',      icon: '✨', desc: 'همه دستاوردها رو باز کن',             category: 'hidden',  coins: 1000, hidden: true }
  ],

  /* =====================================================
     Core Methods
     ===================================================== */
  get() {
    return Storage.get(this.KEY, {});
  },

  set(data) {
    Storage.set(this.KEY, data);
  },

  has(id) {
    return !!this.get()[id];
  },

  count() {
    return Object.keys(this.get()).length;
  },

  total() {
    return this.LIST.length;
  },

  percent() {
    return Math.round((this.count() / this.total()) * 100);
  },

  unlockedList() {
    const data = this.get();
    return this.LIST.filter(a => data[a.id]);
  },

  lockedList() {
    const data = this.get();
    return this.LIST.filter(a => !data[a.id]);
  },

  byCategory() {
    const out = {};
    this.LIST.forEach(a => {
      if (!out[a.category]) out[a.category] = [];
      out[a.category].push(a);
    });
    return out;
  },

  /* =====================================================
     Unlock
     ===================================================== */
  unlock(id) {
    const meta = this.LIST.find(a => a.id === id);
    if (!meta) {
      Log.warn('Achievement not found:', id);
      return false;
    }

    const data = this.get();
    if (data[id]) return false;

    data[id] = Date.now();
    this.set(data);

    // فیدبک
    this.notify(meta);

    // سکه جایزه
    if (meta.coins && typeof Coins !== 'undefined') {
      Coins.add(meta.coins, `دستاورد: ${meta.name}`);
    }

    // چک دستاورد "کامل‌گرا"
    if (id !== 'perfectionist' && this.count() === this.total() - 1) {
      setTimeout(() => this.unlock('perfectionist'), 1000);
    }

    document.dispatchEvent(new CustomEvent('achievement:unlock', {
      detail: meta
    }));

    Log.info('Achievement unlocked:', id, meta.name);
    return true;
  },

  /* =====================================================
     Notify
     ===================================================== */
  notify(meta) {
    if (typeof Toast !== 'undefined') {
      Toast.achievement(
        `<b>${meta.name}</b><br><small>${meta.desc}</small>`,
        5000
      );
    }
    if (typeof Sound !== 'undefined') Sound.unlock?.();
    if (typeof Confetti !== 'undefined') Confetti.burst(60);
    if (typeof Sound !== 'undefined') Sound.levelUp();
    if (typeof Sound !== 'undefined') Sound.vibrate?.([30, 50, 30]);
  },

  /* =====================================================
     Check (اجرای خودکار دستاوردها)
     ===================================================== */
  check() {
    const stats = PlayerStats.get();
    const played = Storage.get('played', []);
    const favs = Storage.get('favorites', []);

    // شروع
    if (stats.gamesPlayed >= 1) this.unlock('first_game');
    if (stats.wins >= 1) this.unlock('first_win');
    if (favs.length >= 1) this.unlock('first_fav');

    // کاوش
    if (played.length >= 5) this.unlock('play_5');
    if (played.length >= 10) this.unlock('play_10');
    if (played.length >= GameLand.count()) this.unlock('play_all');
    if (favs.length >= 3) this.unlock('fav_3');
    if (favs.length >= 10) this.unlock('fav_10');

    // مهارت
    if (stats.wins >= 10) this.unlock('win_10');
    if (stats.wins >= 50) this.unlock('win_50');
    if (stats.wins >= 100) this.unlock('win_100');

    // پایداری
    if (stats.streak >= 3) this.unlock('streak_3');
    if (stats.streak >= 7) this.unlock('streak_7');
    if (stats.streak >= 30) this.unlock('streak_30');

    // سرعت - از reaction میاد
    const rBest = +(store('gl_reaction_best') || 0);
    if (rBest && rBest < 200) this.unlock('speedster');
    if (rBest && rBest < 150) this.unlock('lightning');

    // زمان
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) this.unlock('night_owl');
    if (hour >= 5 && hour < 7) this.unlock('early_bird');

    // دستاوردهای بازی‌ها
    if (+(store('gl_snake_best') || 0) >= 100) this.unlock('snake_100');
    if (+(store('gl_snake_best') || 0) >= 500) this.unlock('snake_500');
    if (+(store('gl_tetris_best') || 0) >= 1000) this.unlock('tetris_1000');
    if (+(store('gl_flappy_best') || 0) >= 30) this.unlock('flappy_30');
  },

  /* =====================================================
     Reset
     ===================================================== */
  reset() {
    this.set({});
    Log.info('Achievements reset');
  }
};

/* =====================================================
   Konami Code
   ===================================================== */
(function konamiListener() {
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let idx = 0;
  window.addEventListener('keydown', e => {
    if (e.key === code[idx]) {
      idx++;
      if (idx === code.length) {
        Achievements.unlock('konami');
        if (typeof Confetti !== 'undefined') Confetti.fireworks(5000);
        idx = 0;
      }
    } else {
      idx = 0;
    }
  });
})();

Log.info('Achievements loaded:', Achievements.total(), 'available');