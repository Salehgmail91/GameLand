/* =========================================================
   GameLand v4 — Challenges
   Daily / Weekly / Monthly Challenge
   ========================================================= */

'use strict';

const Challenges = {
  KEY: 'challenges',

  /* =====================================================
     State Management
     ===================================================== */
  get() {
    return Storage.get(this.KEY, {
      daily: {},
      weekly: {},
      monthly: {},
      history: { daily: 0, weekly: 0, monthly: 0 }
    });
  },

  set(data) {
    Storage.set(this.KEY, data);
  },

  /* =====================================================
     Time Keys
     ===================================================== */
  todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  weekKey() {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  },

  monthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },

  /* =====================================================
     Pick games (deterministic based on period)
     ===================================================== */
  pickDaily() {
    const games = this._gameIds();
    if (!games.length) return null;
    const day = Math.floor(Date.now() / 86400000);
    return games[day % games.length];
  },

  pickWeekly() {
    const games = this._gameIds();
    if (!games.length) return null;
    const week = Math.floor(Date.now() / (86400000 * 7));
    return games[week % games.length];
  },

  pickMonthly() {
    const games = this._gameIds();
    if (!games.length) return null;
    const d = new Date();
    const month = d.getFullYear() * 12 + d.getMonth();
    return games[month % games.length];
  },

  _gameIds() {
    // بازی‌های دارای Leaderboard (یعنی امتیازپذیر)
    return GameLand.all()
      .filter(g => g.supports.leaderboard)
      .map(g => g.id);
  },

  /* =====================================================
     Check & Refresh
     ===================================================== */
  check() {
    const data = this.get();
    const today = this.todayKey();
    const week = this.weekKey();
    const month = this.monthKey();

    // Daily
    if (data.daily.date !== today) {
      data.daily = {
        date: today,
        game: this.pickDaily(),
        done: false,
        score: 0,
        target: 50
      };
    }

    // Weekly
    if (data.weekly.date !== week) {
      data.weekly = {
        date: week,
        game: this.pickWeekly(),
        done: false,
        score: 0,
        target: 300,
        progress: 0
      };
    }

    // Monthly
    if (data.monthly.date !== month) {
      data.monthly = {
        date: month,
        game: this.pickMonthly(),
        done: false,
        score: 0,
        target: 1500,
        progress: 0
      };
    }

    this.set(data);
    return data;
  },

  /* =====================================================
     Get current
     ===================================================== */
  daily() {
    return this.check().daily;
  },

  weekly() {
    return this.check().weekly;
  },

  monthly() {
    return this.check().monthly;
  },

  /* =====================================================
     Mark done
     ===================================================== */
  markDone(type, score = 0) {
    const data = this.check();
    const period = data[type];
    if (!period || period.done) return false;

    period.done = true;
    period.score = score;
    period.completedAt = Date.now();
    data.history[type] = (data.history[type] || 0) + 1;

    this.set(data);

    // پاداش
    const rewards = {
      daily: { coins: 50, achievement: 'daily_1' },
      weekly: { coins: 200, achievement: 'weekly_1' },
      monthly: { coins: 500 }
    };

    const rw = rewards[type];
    if (rw) {
      if (rw.coins && typeof Coins !== 'undefined') {
        Coins.add(rw.coins, `جایزه چالش ${type}`);
      }
      if (rw.achievement) {
        Achievements.unlock(rw.achievement);
      }
    }

    // چک دستاوردهای سری
    const hist = data.history;
    if (type === 'daily') {
      if (hist.daily >= 7) Achievements.unlock('daily_7');
      if (hist.daily >= 30) Achievements.unlock('daily_30');
    }

    // فیدبک
    if (typeof Toast !== 'undefined') {
      Toast.success(`🎉 چالش ${type === 'daily' ? 'روزانه' : type === 'weekly' ? 'هفتگی' : 'ماهانه'} انجام شد! +${rw.coins} 🪙`);
    }
    if (typeof Confetti !== 'undefined') Confetti.burst(100);
    if (typeof Sound !== 'undefined') Sound.unlock?.();

    Log.info('Challenge completed:', type, score);
    return true;
  },

  /* =====================================================
     Auto-check on score report
     ===================================================== */
  reportScore(gameId, score) {
    const data = this.check();

    ['daily', 'weekly', 'monthly'].forEach(type => {
      const period = data[type];
      if (!period || period.done) return;
      if (period.game !== gameId) return;

      // آپدیت progress
      period.score = Math.max(period.score || 0, score);
      period.progress = Math.min(100, ((period.score / period.target) * 100));

      if (period.score >= period.target) {
        this.markDone(type, period.score);
      }
    });

    this.set(data);
  },

  /* =====================================================
     Query
     ===================================================== */
  isDoneToday() {
    return this.daily().done;
  },

  getStats() {
    const data = this.check();
    return {
      daily: data.daily,
      weekly: data.weekly,
      monthly: data.monthly,
      history: data.history
    };
  },

  reset() {
    Storage.remove(this.KEY);
    Log.info('Challenges reset');
  }
};

Log.info('Challenges loaded');