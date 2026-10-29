/* =========================================================
   GameLand v5 — Hub (Enhanced)
   صفحه اصلی با انیمیشن‌های پیشرفته
   ========================================================= */

'use strict';

const Hub = {
  state: {
    tag: 'همه',
    query: '',
    sort: 'order'
  },

  _cleanups: [],

  /* =====================================================
     Render
     ===================================================== */
  render(root) {
    // پاکسازی قبلی
    this._cleanups.forEach(fn => { try { fn(); } catch {} });
    this._cleanups = [];

    root.innerHTML = '';

    root.appendChild(this._hero());
    root.appendChild(this._dailyBanner());
    root.appendChild(this._rewardsQuick());
    root.appendChild(this._statsBar());
    root.appendChild(this._featuredSection());
    root.appendChild(this._tools());
    root.appendChild(this._grid());
    root.appendChild(this._newSection());

    // 🆕 انیمیشن‌های بعد از render
    setTimeout(() => {
      // Count-up اعداد
      Anim.countUpAll(root);

      // Reveal بخش‌ها
      Anim.reveal('[data-reveal]');

      // Tilt کارت‌ها
      Anim.initAllCardTilts(root);

      // Magnetic دکمه‌ها
      Anim.initMagnetic(root);

      // Stagger کارت‌های گرید
      const grid = root.querySelector('.hub-grid');
      if (grid) Anim.stagger(grid, ':scope > *', { delay: 40, animation: 'cardEntry' });

      // Stagger کارت‌های ویژه
      const featuredGrid = root.querySelector('.featured-grid');
      if (featuredGrid) Anim.stagger(featuredGrid, ':scope > *', { delay: 60, animation: 'cardEntry' });

      // Stagger mini cards
      const newScroll = root.querySelector('.hub-new-scroll');
      if (newScroll) Anim.stagger(newScroll, ':scope > *', { delay: 50, animation: 'cardEntry' });

    }, 50);
  },

  /* =====================================================
     Hero
     ===================================================== */
  _hero() {
    const total = GamesList.count();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'صبح بخیر' :
                     hour < 18 ? 'وقت بخیر' :
                     hour < 22 ? 'عصر بخیر' : 'شب بخیر';

    const hero = el('div', { class: 'hub-hero', 'data-reveal': '' });
    hero.innerHTML = `
      <div class="hero-badge">
        <span class="hero-dot"></span>
        <span>${total} بازی آماده</span>
      </div>
      <h1 class="hub-title">
        <span class="grad">${greeting}</span>، خوش آمدی! 🎮
      </h1>
      <p class="hub-sub">
        یه عالمه مینی‌گیم باحال، بدون نصب و معطلی.
        ${Profile.getName() !== 'بازیکن' ? `بیا ${Profile.getName()}!` : 'بزن بریم!'}
      </p>
      <div class="hero-actions">
        <button class="btn primary magnetic ripple" id="heroPlayRandom">
          🎲 بازی تصادفی
        </button>
        <button class="btn magnetic ripple" id="heroDaily">
          📅 چالش امروز
        </button>
      </div>
    `;

    setTimeout(() => {
      hero.querySelector('#heroPlayRandom')?.addEventListener('click', () => {
        const g = GamesList.random();
        if (g) {
          Sound.click();
          Anim.burstConfetti(hero.querySelector('#heroPlayRandom'), 20);
          location.hash = g.id;
        }
      });
      hero.querySelector('#heroDaily')?.addEventListener('click', () => {
        const daily = Challenges.daily();
        if (daily?.game) {
          Sound.click();
          location.hash = daily.game;
        }
      });
    }, 0);

    return hero;
  },

  /* =====================================================
     Daily Challenge Banner
     ===================================================== */
  _dailyBanner() {
    const daily = Challenges.daily();
    const game = GameLand.get(daily.game);
    if (!game) return el('div');

    const done = daily.done;

    const banner = el('div', {
      class: `daily-banner-hub ${done ? 'done' : ''}`,
      'data-reveal': '',
      'data-reveal-delay': '100'
    });
    banner.innerHTML = `
      <div class="db-left">
        <div class="db-icon">${done ? '✅' : '📅'}</div>
        <div>
          <div class="db-title">${done ? 'چالش امروز انجام شد!' : 'چالش امروز'}</div>
          <div class="db-game">
            ${game.emoji} <b>${game.name}</b>
            ${done ? `— ${daily.score} امتیاز` : `— هدف: ${daily.target}`}
          </div>
        </div>
      </div>
      <div class="db-right">
        ${done
          ? '<span class="db-badge success">+۵۰ 🪙</span>'
          : '<button class="btn primary db-play-btn ripple">بازی کن</button>'
        }
      </div>
    `;

    const btn = banner.querySelector('.db-play-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        Sound.click();
        Anim.burstConfetti(btn, 15);
        location.hash = game.id;
      });
    }

    return banner;
  },

  /* =====================================================
     Rewards Quick
     ===================================================== */
  _rewardsQuick() {
    const can = Rewards.canClaim();
    const streak = Rewards.get().streak || 0;

    const box = el('div', {
      class: `reward-quick ${can ? 'claimable' : ''}`,
      'data-reveal': '',
      'data-reveal-delay': '150'
    });
    box.innerHTML = `
      <div class="rq-icon">🎁</div>
      <div class="rq-body">
        <div class="rq-title">جایزه روزانه</div>
        <div class="rq-sub">
          ${can ? 'آماده دریافت!' : `🔥 ${streak} روز پیوسته`}
        </div>
      </div>
      ${can ? '<span class="rq-badge">دریافت</span>' : ''}
    `;

    box.addEventListener('click', () => {
      Router.go('rewards');
    });

    return box;
  },

  /* =====================================================
     Stats Bar (با Count-Up)
     ===================================================== */
  _statsBar() {
    const stats = PlayerStats.summary();
    const coins = Coins.balance();
    const ach = Achievements.percent();

    const bar = el('div', {
      class: 'hub-stats-bar',
      'data-reveal': '',
      'data-reveal-delay': '200'
    });
    bar.innerHTML = `
      <div class="hs-item">
        <div class="hs-value" data-count="${stats.gamesPlayed}">0</div>
        <div class="hs-label">بازی</div>
      </div>
      <div class="hs-item">
        <div class="hs-value" data-count="${stats.wins}">0</div>
        <div class="hs-label">برد</div>
      </div>
      <div class="hs-item">
        <div class="hs-value" data-count="${coins}">0</div>
        <div class="hs-label">🪙 سکه</div>
      </div>
      <div class="hs-item">
        <div class="hs-value" data-count="${ach}" data-count-format="plain">0</div>
        <div class="hs-label">دستاورد</div>
      </div>
    `;
    return bar;
  },

  /* =====================================================
     Featured Section
     ===================================================== */
  _featuredSection() {
    const featured = GamesList.featured().slice(0, 4);
    if (!featured.length) return el('div');

    const sec = el('section', {
      class: 'hub-featured',
      'data-reveal': '',
      'data-reveal-delay': '250'
    });
    sec.innerHTML = `
      <div class="hub-section-head">
        <h2>⭐ بازی‌های ویژه</h2>
        <span class="sec-sub">پیشنهاد ما</span>
      </div>
      <div class="featured-grid"></div>
    `;

    const grid = sec.querySelector('.featured-grid');
    featured.forEach(g => {
      grid.appendChild(this._featuredCard(g));
    });

    return sec;
  },

  _featuredCard(g) {
    const card = el('a', {
      class: 'featured-card ripple',
      href: '#' + g.id,
      style: { '--c': g.color },
      'data-tilt': ''
    });

    const best = Leaderboard.best(g.id);
    const played = PlayerStats.forGame(g.id).played;

    card.innerHTML = `
      <div class="fc-bg" style="background:linear-gradient(135deg, ${g.color}33, ${g.color}11)"></div>
      <div class="fc-icon">${g.emoji}</div>
      <div class="fc-body">
        <h3>${g.name}</h3>
        <p>${g.desc}</p>
        <div class="fc-meta">
          ${best > 0 ? `<span class="fc-best">🏆 ${formatNumber(best)}</span>` : ''}
          ${played > 0 ? `<span class="fc-played">${played} بازی</span>` : ''}
          ${g.isNew ? '<span class="fc-new">جدید</span>' : ''}
        </div>
      </div>
      <div class="fc-play">▶</div>
    `;

    card.addEventListener('click', () => Sound.click());
    return card;
  },

  /* =====================================================
     Tools (Search + Filter)
     ===================================================== */
  _tools() {
    const tools = el('div', {
      class: 'hub-tools',
      'data-reveal': '',
      'data-reveal-delay': '300'
    });

    // Search
    const search = el('div', { class: 'hub-search' });
    search.innerHTML = `
      <input type="text" id="hubSearch" placeholder="🔍 جستجوی بازی..." value="${this.state.query}">
    `;
    const input = search.querySelector('input');
    input.addEventListener('input', debounce(() => {
      this.state.query = input.value;
      this._refreshGrid();
    }, 150));

    // Filters
    const filters = el('div', { class: 'hub-filters' });
    GamesList.categories().forEach(cat => {
      const btn = el('button', {
        class: `hub-filter-chip ripple ${cat.id === this.state.tag ? 'active' : ''}`,
        'data-tag': cat.id
      }, [
        el('span', { text: cat.icon }),
        el('span', { text: cat.name }),
        el('span', { class: 'chip-count', text: cat.count })
      ]);

      btn.addEventListener('click', () => {
        this.state.tag = cat.id;
        filters.querySelectorAll('.hub-filter-chip').forEach(b =>
          b.classList.toggle('active', b.dataset.tag === cat.id)
        );
        this._refreshGrid();
        Sound.click();
      });

      filters.appendChild(btn);
    });

    tools.appendChild(search);
    tools.appendChild(filters);
    return tools;
  },

  /* =====================================================
     Grid
     ===================================================== */
  _grid() {
    const sec = el('section', {
      class: 'hub-grid-sec',
      'data-reveal': '',
      'data-reveal-delay': '350'
    });
    sec.innerHTML = `
      <div class="hub-section-head">
        <h2>🎮 همه بازی‌ها</h2>
        <span class="sec-sub" id="hubCount">${GamesList.count()} بازی</span>
      </div>
      <div class="hub-grid" id="hubGrid"></div>
    `;
    return sec;
  },

  _refreshGrid() {
    const grid = $('#hubGrid');
    if (!grid) return;

    const list = GamesList.filter({
      tag: this.state.tag,
      query: this.state.query,
      sort: this.state.sort
    });

    grid.innerHTML = '';

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>بازی‌ای پیدا نشد</p>
        </div>
      `;
      return;
    }

    list.forEach(g => grid.appendChild(this._card(g)));

    // 🆕 انیمیشن ورود
    Anim.stagger(grid, ':scope > *', { delay: 30, animation: 'cardEntry' });
    Anim.initAllCardTilts(grid);

    const count = $('#hubCount');
    if (count) count.textContent = `${list.length} بازی`;
  },

  _card(g) {
    const card = el('a', {
      class: 'game-card ripple',
      href: '#' + g.id,
      style: { '--c': g.color },
      'data-tilt': ''
    });

    const isFav = Favorites.has(g.id);
    const best = Leaderboard.best(g.id);

    card.innerHTML = `
      <button class="card-fav ${isFav ? 'active' : ''}" data-id="${g.id}">
        ${isFav ? '⭐' : '☆'}
      </button>
      ${g.isNew ? '<span class="card-badge new">جدید</span>' : ''}
      <div class="card-icon">${g.emoji}</div>
      <div class="card-body">
        <h3>${g.name}</h3>
        <p>${g.desc}</p>
        <div class="card-tags">
          ${g.tags.slice(0, 2).map(t => `<span class="mini-tag">${t}</span>`).join('')}
        </div>
        ${best > 0 ? `<div class="card-best">🏆 ${formatNumber(best)}</div>` : ''}
      </div>
    `;

    // Click on card
    card.addEventListener('click', e => {
      if (e.target.closest('.card-fav')) return;
      Sound.click();
    });

    // Fav button
    const favBtn = card.querySelector('.card-fav');
    favBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const active = Favorites.toggle(g.id);
      favBtn.classList.toggle('active', active);
      favBtn.textContent = active ? '⭐' : '☆';
      if (active) {
        Anim.burstConfetti(favBtn, 12);
      }
    });

    return card;
  },

  /* =====================================================
     New Section
     ===================================================== */
  _newSection() {
    const newGames = GamesList.new().slice(0, 6);
    if (!newGames.length) return el('div');

    const sec = el('section', {
      class: 'hub-new-sec',
      'data-reveal': '',
      'data-reveal-delay': '400'
    });
    sec.innerHTML = `
      <div class="hub-section-head">
        <h2>✨ تازه رسیده‌ها</h2>
        <span class="sec-sub">${newGames.length} بازی جدید</span>
      </div>
      <div class="hub-new-scroll"></div>
    `;

    const scroll = sec.querySelector('.hub-new-scroll');
    newGames.forEach(g => {
      const mini = el('a', {
        class: 'new-mini-card ripple',
        href: '#' + g.id,
        style: { '--c': g.color }
      });
      mini.innerHTML = `
        <div class="nmc-icon">${g.emoji}</div>
        <div class="nmc-name">${g.name}</div>
      `;
      mini.addEventListener('click', () => Sound.click());
      scroll.appendChild(mini);
    });

    return sec;
  },

  /* =====================================================
     Init
     ===================================================== */
  init() {
    Challenges.check();
    Log.info('Hub initialized');
  }
};

Log.info('Hub v5 loaded');