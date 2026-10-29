/* =========================================================
   GameLand v4 — Leaderboard
   Top scores per game + global
   ========================================================= */

'use strict';

const Leaderboard = {
  KEY: 'leaderboard',
  MAX_PER_GAME: 5,
  MAX_GLOBAL: 20,

  /* =====================================================
     Submit score
     ===================================================== */
  submit(gameId, score, extra = {}) {
    if (!gameId || typeof score !== 'number') return null;

    const all = Storage.get(this.KEY, {});
    const list = all[gameId] || [];

    const entry = {
      score,
      date: Date.now(),
      gameId,
      ...extra
    };

    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    all[gameId] = list.slice(0, this.MAX_PER_GAME);
    Storage.set(this.KEY, all);

    const idx = all[gameId].indexOf(entry);
    const rank = idx === -1 ? null : idx + 1;

    // اگه در top 5 بود، پیام موفقیت
    if (rank && rank <= 5 && score > 0) {
      if (typeof Toast !== 'undefined') {
        Toast.success(`🏆 رتبه ${rank} در رکوردها!`);
      }
      if (typeof Sound !== 'undefined') Sound.unlock?.();
    }

    // اگه رتبه ۱ شد
    if (rank === 1 && list.length > 1) {
      if (typeof Confetti !== 'undefined') Confetti.burst(60);
      if (typeof Sound !== 'undefined') Sound.win();
    }

    Log.info('Score submitted:', gameId, score, 'rank:', rank);
    return rank;
  },

  /* =====================================================
     Get for game
     ===================================================== */
  get(gameId) {
    const all = Storage.get(this.KEY, {});
    return all[gameId] || [];
  },

  /* =====================================================
     Best score for game
     ===================================================== */
  best(gameId) {
    const list = this.get(gameId);
    return list.length ? list[0].score : 0;
  },

  /* =====================================================
     Global leaderboard (all games)
     ===================================================== */
  global() {
    const all = Storage.get(this.KEY, {});
    const flat = [];
    for (const [gameId, list] of Object.entries(all)) {
      list.forEach(entry => flat.push({ ...entry, gameId }));
    }
    flat.sort((a, b) => b.score - a.score);
    return flat.slice(0, this.MAX_GLOBAL);
  },

  /* =====================================================
     Rankings for a game (medals)
     ===================================================== */
  rankMedal(rank) {
    return ['🥇', '🥈', '🥉'][rank - 1] || `#${rank}`;
  },

  /* =====================================================
     Stats
     ===================================================== */
  stats() {
    const all = Storage.get(this.KEY, {});
    let totalSubmissions = 0;
    let gamesWithScores = 0;

    for (const list of Object.values(all)) {
      totalSubmissions += list.length;
      if (list.length > 0) gamesWithScores++;
    }

    return {
      totalSubmissions,
      gamesWithScores,
      bestOverall: this.global()[0] || null
    };
  },

  /* =====================================================
     Clear
     ===================================================== */
  clear(gameId = null) {
    if (!gameId) {
      Storage.remove(this.KEY);
      Log.info('Leaderboard cleared');
      return;
    }
    const all = Storage.get(this.KEY, {});
    delete all[gameId];
    Storage.set(this.KEY, all);
    Log.info('Leaderboard cleared for:', gameId);
  },

  /* =====================================================
     Formatting helpers
     ===================================================== */
  formatDate(ts) {
    try {
      return new Date(ts).toLocaleDateString('fa-IR');
    } catch { return ''; }
  },

  /* =====================================================
     Render HTML for a game
     ===================================================== */
  renderHTML(gameId) {
    const list = this.get(gameId);
    if (!list.length) return '';

    return `
      <div class="lb-list">
        ${list.map((entry, i) => `
          <div class="lb-row rank-${i + 1}">
            <span class="lb-rank">${this.rankMedal(i + 1)}</span>
            <span class="lb-score">${formatNumber(entry.score)}</span>
            <span class="lb-date">${timeAgo(entry.date)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
};

/* =========================================================
   Coins — سیستم سکه
   ========================================================= */
const Coins = {
  KEY: 'coins',

  get() {
    return Storage.get(this.KEY, { balance: 0, total: 0, spent: 0 });
  },

  set(data) {
    Storage.set(this.KEY, data);
    document.dispatchEvent(new CustomEvent('coins:change', { detail: data }));
  },

  balance() {
    return this.get().balance;
  },

  /* اضافه کردن */
  add(amount, reason = '') {
    if (!amount || amount <= 0) return false;
    const data = this.get();
    data.balance += amount;
    data.total += amount;
    this.set(data);

    if (typeof Toast !== 'undefined' && amount >= 10) {
      Toast.coin(`+${amount} 🪙 ${reason}`);
    }
    if (typeof Sound !== 'undefined') Sound.coin();

    Log.debug('Coins +', amount, reason);
    return true;
  },

  /* خرج کردن */
  spend(amount, reason = '') {
    const data = this.get();
    if (data.balance < amount) return false;
    data.balance -= amount;
    data.spent += amount;
    this.set(data);

    if (typeof Sound !== 'undefined') Sound.click();
    Log.debug('Coins -', amount, reason);
    return true;
  },

  has(amount) {
    return this.balance() >= amount;
  },

  reset() {
    this.set({ balance: 0, total: 0, spent: 0 });
  }
};

Log.info('Leaderboard + Coins loaded');