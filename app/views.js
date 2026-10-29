/* =========================================================
   GameLand v5 — Views (Enhanced)
   صفحات ویژه با انیمیشن
   ========================================================= */

'use strict';

const Views = {

  /* =====================================================
     Favorites
     ===================================================== */
  favorites(root) {
    const list = Favorites.list();

    root.innerHTML = `
      <div class="view-head" data-reveal>
        <h1>⭐ علاقه‌مندی‌ها</h1>
        <span class="view-count">${list.length} بازی</span>
      </div>
      <div class="hub-grid" id="favGrid"></div>
    `;

    const grid = root.querySelector('#favGrid');

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state full">
          <div class="empty-icon">⭐</div>
          <h3>هنوز بازی‌ای رو ستاره نکردی</h3>
          <p>روی ستاره بازی‌ها بزن تا اینجا ظاهر بشن</p>
          <button class="btn primary ripple" onclick="Router.go('home')">مشاهده بازی‌ها</button>
        </div>
      `;
      return;
    }

    list.forEach(g => {
      grid.appendChild(Hub._card(g));
    });

    // 🆕 انیمیشن
    setTimeout(() => {
      Anim.reveal('[data-reveal]', root);
      Anim.stagger(grid, ':scope > *', { delay: 40 });
      Anim.initAllCardTilts(root);
    }, 30);
  },

  /* =====================================================
     Achievements
     ===================================================== */
  achievements(root) {
    const unlocked = Achievements.get();
    const total = Achievements.total();
    const count = Achievements.count();
    const percent = Achievements.percent();

    const categories = Achievements.byCategory();
    const catNames = {
      start: '🚀 شروع',
      explore: '🗺️ کاوش',
      skill: '⚔️ مهارت',
      speed: '⚡ سرعت',
      time: '⏰ زمان',
      persist: '📅 پایداری',
      challenge: '🎯 چالش',
      game: '🎮 بازی‌ها',
      hidden: '🔮 مخفی'
    };

    root.innerHTML = `
      <div class="view-head" data-reveal>
        <h1>🏆 دستاوردها</h1>
        <span class="view-count">${count} از ${total}</span>
      </div>

      <div class="ach-progress-card" data-reveal data-reveal-delay="100">
        <div class="ach-progress-bar">
          <div class="ach-progress-fill" style="width:${percent}%"></div>
        </div>
        <div class="ach-progress-label">
          <span>${percent}%</span>
          <span>${count} / ${total}</span>
        </div>
      </div>

      <div class="ach-cats" id="achCats"></div>
    `;

    const cats = root.querySelector('#achCats');

    for (const [cat, list] of Object.entries(categories)) {
      const unlockedCount = list.filter(a => unlocked[a.id]).length;

      const sec = el('div', { class: 'ach-cat', 'data-reveal': '' });
      sec.innerHTML = `
        <h3 class="ach-cat-title">
          ${catNames[cat] || cat}
          <span class="ach-cat-count">${unlockedCount}/${list.length}</span>
        </h3>
        <div class="ach-grid"></div>
      `;

      const grid = sec.querySelector('.ach-grid');
      list.forEach(a => {
        grid.appendChild(this._achCard(a, unlocked[a.id]));
      });

      cats.appendChild(sec);
    }

    // 🆕 انیمیشن
    setTimeout(() => {
      Anim.reveal('[data-reveal]', root);
      const grids = root.querySelectorAll('.ach-grid');
      grids.forEach(grid => {
        Anim.stagger(grid, ':scope > *', { delay: 25, animation: 'scaleIn' });
      });
    }, 30);
  },

  _achCard(meta, unlockedAt) {
    const unlocked = !!unlockedAt;
    const hidden = meta.hidden && !unlocked;

    const card = el('div', {
      class: `ach-card ${unlocked ? 'unlocked' : 'locked'}`
    });

    if (hidden) {
      card.innerHTML = `
        <div class="ach-icon">❓</div>
        <div class="ach-name">???</div>
        <div class="ach-desc">دستاورد مخفی</div>
      `;
      return card;
    }

    card.innerHTML = `
      <div class="ach-icon">${meta.icon}</div>
      <div class="ach-name">${meta.name}</div>
      <div class="ach-desc">${meta.desc}</div>
      ${unlocked ? `<div class="ach-date">${timeAgo(unlockedAt)}</div>` : ''}
      ${meta.coins ? `<div class="ach-coins">+${meta.coins} 🪙</div>` : ''}
    `;

    return card;
  },

  /* =====================================================
     Stats
     ===================================================== */
  stats(root) {
    const s = PlayerStats.summary();
    const top = PlayerStats.topGames(5);

    root.innerHTML = `
      <div class="view-head" data-reveal>
        <h1>📊 آمار من</h1>
      </div>

      <div class="stats-grid" data-reveal data-reveal-delay="100">
        <div class="stats-tile">
          <div class="st-icon">🎮</div>
          <div class="st-value" data-count="${s.gamesPlayed}">0</div>
          <div class="st-label">بازی انجام‌شده</div>
        </div>
        <div class="stats-tile win">
          <div class="st-icon">🏆</div>
          <div class="st-value" data-count="${s.wins}">0</div>
          <div class="st-label">برد</div>
        </div>
        <div class="stats-tile lose">
          <div class="st-icon">💔</div>
          <div class="st-value" data-count="${s.losses}">0</div>
          <div class="st-label">باخت</div>
        </div>
        <div class="stats-tile">
          <div class="st-icon">🤝</div>
          <div class="st-value" data-count="${s.draws}">0</div>
          <div class="st-label">مساوی</div>
        </div>
        <div class="stats-tile">
          <div class="st-icon">🔥</div>
          <div class="st-value" data-count="${s.streak}">0</div>
          <div class="st-label">روز پیوسته</div>
        </div>
        <div class="stats-tile">
          <div class="st-icon">⏱️</div>
          <div class="st-value">${formatTime(s.totalTime || 0)}</div>
          <div class="st-label">زمان کل</div>
        </div>
      </div>

      <div class="stats-card" data-reveal data-reveal-delay="200">
        <h3>🎯 نرخ برد</h3>
        <div class="progress-bar big">
          <div class="progress-fill" style="width:${s.winRate}%"></div>
        </div>
        <div class="progress-label">${s.winRate}%</div>
      </div>

      <div class="stats-card" data-reveal data-reveal-delay="250">
        <h3>🎮 محبوب‌ترین بازی‌ها</h3>
        <div class="stats-top-games" id="statsTopGames"></div>
      </div>

      <div class="stats-card" data-reveal data-reveal-delay="300">
        <h3>🏆 رکوردهای کلی</h3>
        <div class="lb-list">
          ${Leaderboard.global().slice(0, 10).map((e, i) => {
            const g = GameLand.get(e.gameId);
            return `
              <div class="lb-row rank-${i + 1}">
                <span class="lb-rank">${Leaderboard.rankMedal(i + 1)}</span>
                <span class="lb-game">${g ? g.emoji + ' ' + g.name : e.gameId}</span>
                <span class="lb-score">${formatNumber(e.score)}</span>
              </div>
            `;
          }).join('') || '<p class="hint">هنوز رکوردی ثبت نشده</p>'}
        </div>
      </div>

      <div class="stats-actions" data-reveal data-reveal-delay="350">
        <button class="btn danger ripple" id="statsReset">🗑️ پاک کردن همه آمار</button>
      </div>
    `;

    // Top games
    const topGamesEl = root.querySelector('#statsTopGames');
    if (top.length === 0) {
      topGamesEl.innerHTML = '<p class="hint">هنوز بازی‌ای نکردی</p>';
    } else {
      top.forEach(t => {
        const g = GameLand.get(t.id);
        if (!g) return;
        const row = el('div', { class: 'top-game-row' });
        row.innerHTML = `
          <span class="tg-icon">${g.emoji}</span>
          <span class="tg-name">${g.name}</span>
          <div class="tg-bar">
            <div class="tg-bar-fill" style="width:${(t.played / top[0].played) * 100}%"></div>
          </div>
          <span class="tg-count">${t.played}</span>
        `;
        topGamesEl.appendChild(row);
      });
    }

    // Reset
    root.querySelector('#statsReset').addEventListener('click', () => {
      Modal.confirm(
        'همه آمار پاک می‌شه. مطمئنی؟',
        () => {
          PlayerStats.reset();
          Leaderboard.clear();
          Toast.success('آمار پاک شد');
          Router.go('stats');
        },
        { ok: 'بله، پاک کن' }
      );
    });

    // 🆕 انیمیشن
    setTimeout(() => {
      Anim.reveal('[data-reveal]', root);
      Anim.countUpAll(root);
    }, 30);
  },

  /* =====================================================
     Shop
     ===================================================== */
  shop(root) {
    root.innerHTML = `
      <div class="view-head" data-reveal>
        <h1>🛍️ فروشگاه</h1>
        <div class="view-balance" id="shopBalance">🪙 <b>${formatNumber(Coins.balance())}</b></div>
      </div>

      <div class="shop-tabs" data-reveal data-reveal-delay="100">
        <button class="shop-tab active ripple" data-type="theme">🎨 تم‌ها</button>
        <button class="shop-tab ripple" data-type="sound">🎵 پک صدا</button>
        <button class="shop-tab ripple" data-type="avatar">👤 آواتار</button>
      </div>

      <div class="shop-content" id="shopContent"></div>
    `;

    const tabs = root.querySelectorAll('.shop-tab');
    const content = root.querySelector('#shopContent');

    const renderType = (type) => {
      content.innerHTML = '';
      const items = Shop.byType(type);
      const grid = el('div', { class: 'shop-grid' });
      items.forEach(item => {
        grid.appendChild(this._shopItem(item));
      });
      content.appendChild(grid);

      // 🆕 Stagger
      Anim.stagger(grid, ':scope > *', { delay: 40 });
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        renderType(tab.dataset.type);
        Sound.click();
      });
    });

    renderType('theme');

    // Coins listener
    const coinsHandler = () => {
      const bal = root.querySelector('#shopBalance b');
      if (bal) {
        bal.textContent = formatNumber(Coins.balance());
        root.querySelector('#shopBalance').classList.add('bump');
        setTimeout(() => root.querySelector('#shopBalance')?.classList.remove('bump'), 500);
      }
    };
    document.addEventListener('coins:change', coinsHandler);
    // Store cleanup on DOM element
    root._shopCoinsCleanup = () => document.removeEventListener('coins:change', coinsHandler);

    // 🆕 انیمیشن
    setTimeout(() => Anim.reveal('[data-reveal]', root), 30);
  },

  _shopItem(item) {
    const owned = Shop.isOwned(item.id);
    const active = Shop.getActive(item.type) === item.value;
    const canBuy = Coins.has(item.price) && !item.locked;

    const card = el('div', {
      class: `shop-item ${owned ? 'owned' : ''} ${active ? 'active' : ''} ${item.locked ? 'locked' : ''}`
    });

    card.innerHTML = `
      <div class="si-icon">${item.icon}</div>
      <div class="si-name">${item.name}</div>
      <div class="si-desc">${item.desc}</div>
      <div class="si-foot">
        ${item.locked
          ? '<span class="si-locked">به‌زودی</span>'
          : active
            ? '<span class="si-active">✓ فعال</span>'
            : owned
              ? '<button class="btn si-btn use ripple">استفاده</button>'
              : `<button class="btn primary si-btn buy ripple ${canBuy ? '' : 'disabled'}" ${canBuy ? '' : 'disabled'}>🪙 ${item.price}</button>`
        }
      </div>
    `;

    const btn = card.querySelector('.si-btn');
    if (btn) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (btn.classList.contains('buy')) {
          if (Shop.buy(item.id)) {
            Anim.burstConfetti(card, 30);
            setTimeout(() => Router.go('shop'), 300);
          }
        } else if (btn.classList.contains('use')) {
          if (Shop.use(item.id)) {
            Anim.burstConfetti(card, 20);
            setTimeout(() => Router.go('shop'), 300);
          }
        }
      });
    }

    return card;
  },

  /* =====================================================
     Settings
     ===================================================== */
  settings(root) {
    root.innerHTML = `
      <div class="view-head" data-reveal>
        <h1>⚙️ تنظیمات</h1>
      </div>
      <div id="settingsContent" data-reveal data-reveal-delay="100"></div>
    `;

    SettingsUI.render(root.querySelector('#settingsContent'));

    // 🆕 انیمیشن
    setTimeout(() => Anim.reveal('[data-reveal]', root), 30);
  },

  /* =====================================================
     Profile
     ===================================================== */
  profile(root) {
    Profile.render(root);

    // 🆕 انیمیشن
    setTimeout(() => {
      Anim.reveal('[data-reveal]', root);
      Anim.countUpAll(root);
    }, 30);
  },

  /* =====================================================
     Rewards
     ===================================================== */
  rewards(root) {
    root.innerHTML = `
      <div class="view-head" data-reveal>
        <h1>🎁 جایزه روزانه</h1>
      </div>
      <div id="rewardsWidget" data-reveal data-reveal-delay="100"></div>
      <div class="rewards-info" data-reveal data-reveal-delay="200">
        <h3>💡 چطور کار می‌کنه؟</h3>
        <p>
          هر روز که وارد GameLand می‌شی، می‌تونی یه جایزه بگیری.
          هر روز متوالی که بیای، جایزه بزرگ‌تر می‌شه!
        </p>
        <p>
          روز هفتم جایزه ویژه داره (۳۰۰ سکه + بونوس).
          اگه یه روز نیای، زنجیره از اول شروع می‌شه.
        </p>
      </div>
    `;

    Rewards.renderWidget(root.querySelector('#rewardsWidget'));

    // 🆕 انیمیشن
    setTimeout(() => Anim.reveal('[data-reveal]', root), 30);
  },

  /* =====================================================
     Cleanup
     ===================================================== */
  cleanup(root) {
    if (root && root._shopCoinsCleanup) {
      root._shopCoinsCleanup();
      root._shopCoinsCleanup = null;
    }
  }
};

Log.info('Views v5 loaded');