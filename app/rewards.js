/* =========================================================
   GameLand v4 — Rewards
   جایزه روزانه + streak پاداش
   ========================================================= */

'use strict';

const Rewards = {
  KEY: 'rewards',
  STREAK_KEY: 'reward_streak',

  /* =====================================================
     پاداش‌های روزانه (۷ روز چرخه)
     ===================================================== */
  DAILY_REWARDS: [
    { day: 1, coins: 20,  icon: '🪙', label: '۲۰ سکه' },
    { day: 2, coins: 30,  icon: '🪙', label: '۳۰ سکه' },
    { day: 3, coins: 50,  icon: '🪙', label: '۵۰ سکه' },
    { day: 4, coins: 75,  icon: '🪙', label: '۷۵ سکه' },
    { day: 5, coins: 100, icon: '💎', label: '۱۰۰ سکه' },
    { day: 6, coins: 150, icon: '💎', label: '۱۵۰ سکه' },
    { day: 7, coins: 300, icon: '👑', label: '۳۰۰ سکه + جایزه ویژه' }
  ],

  /* =====================================================
     State
     ===================================================== */
  get() {
    return Storage.get(this.KEY, {
      lastClaim: null,
      streak: 0,
      totalClaims: 0
    });
  },

  set(data) {
    Storage.set(this.KEY, data);
  },

  /* =====================================================
     Can claim?
     ===================================================== */
  canClaim() {
    const data = this.get();
    if (!data.lastClaim) return true;

    const last = new Date(data.lastClaim).toDateString();
    const today = new Date().toDateString();

    return last !== today;
  },

  hoursUntilNext() {
    const data = this.get();
    if (!data.lastClaim) return 0;

    const last = new Date(data.lastClaim);
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);

    return Math.max(0, next - Date.now());
  },

  /* =====================================================
     Get current streak day
     ===================================================== */
  currentDay() {
    const data = this.get();
    if (!data.lastClaim) return 1;

    const last = new Date(data.lastClaim).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (last === today) return data.streak;
    if (last === yesterday.toDateString()) {
      return ((data.streak) % 7) + 1;
    }
    return 1;
  },

  currentReward() {
    const day = this.currentDay();
    return this.DAILY_REWARDS[day - 1] || this.DAILY_REWARDS[0];
  },

  /* =====================================================
     Claim
     ===================================================== */
  claim() {
    if (!this.canClaim()) {
      const wait = this.hoursUntilNext();
      const hrs = Math.ceil(wait / 3600000);
      Toast.warn(`⏰ بعدی در ${hrs} ساعت`);
      return false;
    }

    const data = this.get();
    const today = new Date().toDateString();

    // محاسبه streak
    let streak = data.streak;
    if (data.lastClaim) {
      const lastDate = new Date(data.lastClaim);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate.toDateString() === yesterday.toDateString()) {
        streak = ((streak) % 7) + 1;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    const reward = this.DAILY_REWARDS[streak - 1];

    // اعمال جایزه
    data.lastClaim = Date.now();
    data.streak = streak;
    data.totalClaims = (data.totalClaims || 0) + 1;
    this.set(data);

    // سکه
    Coins.add(reward.coins, 'جایزه روزانه');

    // روز هفتم: جایزه ویژه
    if (streak === 7) {
      const bonus = 100;
      setTimeout(() => Coins.add(bonus, '🎁 جایزه ویژه هفتگی'), 800);
      setTimeout(() => Confetti.fireworks(4000), 400);
    } else {
      Confetti.burst(60);
    }

    Sound.unlock?.();
    Sound.win();

    Toast.success(`${reward.icon} روز ${streak}: ${reward.label}!`);

    document.dispatchEvent(new CustomEvent('reward:claim', {
      detail: { streak, reward }
    }));

    Log.info('Reward claimed:', streak, reward.coins);
    return true;
  },

  /* =====================================================
     Render Widget
     ===================================================== */
  renderWidget(container) {
    if (!container) return;
    container.innerHTML = '';

    const can = this.canClaim();
    const day = this.currentDay();
    const today = new Date().toDateString();
    const data = this.get();
    const claimedToday = data.lastClaim && new Date(data.lastClaim).toDateString() === today;

    const wrap = el('div', { class: 'rewards-widget' });

    wrap.innerHTML = `
      <div class="rewards-header">
        <span class="rewards-title">🎁 جایزه روزانه</span>
        <span class="rewards-streak">🔥 ${data.streak} روز</span>
      </div>
      <div class="rewards-days">
        ${this.DAILY_REWARDS.map(r => {
          const isToday = r.day === day;
          const isPast = r.day < day && claimedToday;
          const cls = `reward-day ${isToday ? 'today' : ''} ${isPast ? 'done' : ''}`;
          return `
            <div class="${cls}">
              <span class="rd-icon">${r.icon}</span>
              <span class="rd-day">روز ${r.day}</span>
              <span class="rd-coins">${r.coins}</span>
            </div>
          `;
        }).join('')}
      </div>
      <button class="btn primary rewards-btn ${can ? '' : 'disabled'}" ${can ? '' : 'disabled'}>
        ${can ? 'دریافت جایزه' : '⏰ بعداً'}
      </button>
    `;

    const btn = wrap.querySelector('.rewards-btn');
    if (btn && can) {
      btn.addEventListener('click', () => {
        this.claim();
        this.renderWidget(container);
      });
    }

    container.appendChild(wrap);
  },

  /* =====================================================
     Reset
     ===================================================== */
  reset() {
    Storage.remove(this.KEY);
    Log.info('Rewards reset');
  }
};

Log.info('Rewards loaded');