/* =========================================================
   GameLand v4 — Stats
   آمار بازیکن + آمار هر بازی
   ========================================================= */

'use strict';

const PlayerStats = {
  KEY: 'stats',

  /* =====================================================
     Base data
     ===================================================== */
  get() {
  const data = Storage.get(this.KEY, {
    gamesPlayed: 0,
    gamesList: [],
    wins: 0,
    losses: 0,
    draws: 0,
    streak: 0,
    bestStreak: 0,
    totalTime: 0,
    lastPlayed: null,
    firstSeen: null,
    perGame: {}
  });

  // 🆕 اطمینان از وجود perGame
  if (!data.perGame || typeof data.perGame !== 'object') {
    data.perGame = {};
  }
  // 🆕 اطمینان از وجود همه کلیدها
  if (!Array.isArray(data.gamesList)) data.gamesList = [];

  return data;
},

  set(data) {
    Storage.set(this.KEY, data);
  },

  /* =====================================================
     Mark game started
     ===================================================== */
  markGame(gameId) {
    const s = this.get();

    if (!s.firstSeen) s.firstSeen = Date.now();

    s.gamesPlayed++;
    if (!s.gamesList.includes(gameId)) s.gamesList.push(gameId);

    // per-game stats
    if (!s.perGame[gameId]) {
      s.perGame[gameId] = {
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        bestScore: 0,
        totalScore: 0,
        lastPlayed: null
      };
    }
    s.perGame[gameId].played++;
    s.perGame[gameId].lastPlayed = Date.now();

    // streak
    const today = new Date().toDateString();
    const last = s.lastPlayed;

    if (last) {
      const diff = (new Date(today) - new Date(last)) / 86400000;
      if (Math.floor(diff) === 1) {
        s.streak++;
      } else if (Math.floor(diff) > 1) {
        s.streak = 1;
      }
    } else {
      s.streak = 1;
    }
    s.lastPlayed = today;
    s.bestStreak = Math.max(s.bestStreak || 0, s.streak);

    this.set(s);

    // trigger achievements check
    if (typeof Achievements !== 'undefined') {
      Achievements.check();
    }

    Log.debug('Game marked:', gameId);
  },

  /* =====================================================
     Win
     ===================================================== */
  win(gameId = null) {
    const s = this.get();
    s.wins++;

    if (gameId && s.perGame[gameId]) {
      s.perGame[gameId].wins++;
    }

    this.set(s);

    if (typeof Achievements !== 'undefined') {
      Achievements.check();
    }
  },

  /* =====================================================
     Loss
     ===================================================== */
  lose(gameId = null) {
    const s = this.get();
    s.losses++;

    if (gameId && s.perGame[gameId]) {
      s.perGame[gameId].losses++;
    }

    this.set(s);
  },

  /* =====================================================
     Draw
     ===================================================== */
  draw(gameId = null) {
    const s = this.get();
    s.draws++;

    if (gameId && s.perGame[gameId]) {
      s.perGame[gameId].draws++;
    }

    this.set(s);
  },

  /* =====================================================
     Score
     ===================================================== */
  reportScore(gameId, score) {
    const s = this.get();
    if (!s.perGame[gameId]) return;

    const pg = s.perGame[gameId];
    pg.totalScore += score;
    if (score > pg.bestScore) pg.bestScore = score;

    this.set(s);
  },

  /* =====================================================
     Time tracking
     ===================================================== */
  addTime(ms) {
    const s = this.get();
    s.totalTime = (s.totalTime || 0) + ms;
    this.set(s);
  },

  /* =====================================================
     Get stats summary
     ===================================================== */
  summary() {
    const s = this.get();
    const total = s.wins + s.losses + s.draws;
    const winRate = total > 0 ? Math.round((s.wins / total) * 100) : 0;

    return {
      ...s,
      totalDecisions: total,
      winRate,
      uniqueGames: s.gamesList.length,
      avgGamesPerDay: this._avgGamesPerDay(s)
    };
  },

  _avgGamesPerDay(s) {
    if (!s.firstSeen) return 0;
    const days = Math.max(1, (Date.now() - s.firstSeen) / 86400000);
    return Math.round((s.gamesPlayed / days) * 10) / 10;
  },

  /* =====================================================
     Per-game stats
     ===================================================== */
  forGame(gameId) {
    const s = this.get();
    return s.perGame[gameId] || {
      played: 0, wins: 0, losses: 0, draws: 0, bestScore: 0, totalScore: 0
    };
  },

  topGames(n = 5) {
  const s = this.get();
  const perGame = s.perGame || {};  // 🆕 محافظت
  const list = Object.entries(perGame)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.played - a.played)
    .slice(0, n);
  return list;
},

  /* =====================================================
     Reset
     ===================================================== */
  reset() {
    Storage.remove(this.KEY);
    Log.info('Stats reset');
  }
};

/* =========================================================
   TimeTracker — ردیابی زمان بازی
   ========================================================= */
const TimeTracker = {
  startTime: null,
  _tickInterval: null,

  start() {
    this.startTime = Date.now();
  },

  stop() {
    if (!this.startTime) return 0;
    const elapsed = Date.now() - this.startTime;
    this.startTime = null;
    if (elapsed > 0) {
      PlayerStats.addTime(elapsed);
    }
    return elapsed;
  },

  reset() {
    this.startTime = null;
  }
};

/* =========================================================
   Session Stats — آمار جلسه جاری
   ========================================================= */
const SessionStats = {
  startTime: Date.now(),
  gamesPlayed: 0,
  wins: 0,
  losses: 0,

  trackGame() { this.gamesPlayed++; },
  trackWin() { this.wins++; },
  trackLoss() { this.losses++; },

  report() {
    const duration = Date.now() - this.startTime;
    return {
      duration,
      durationFormatted: formatTime(duration),
      gamesPlayed: this.gamesPlayed,
      wins: this.wins,
      losses: this.losses
    };
  },

  reset() {
    this.startTime = Date.now();
    this.gamesPlayed = 0;
    this.wins = 0;
    this.losses = 0;
  }
};

Log.info('Stats loaded');