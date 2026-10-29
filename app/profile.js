/* =========================================================
   GameLand v4 — Profile
   پروفایل کاربر + آواتار + آمار
   ========================================================= */

'use strict';

const Profile = {
  KEY: 'profile',

  /* =====================================================
     Data
     ===================================================== */
  get() {
    return Storage.get(this.KEY, {
      name: 'بازیکن',
      avatar: 'default',
      joinedAt: Date.now(),
      bio: ''
    });
  },

  set(data) {
    Storage.set(this.KEY, data);
  },

  /* =====================================================
     Avatar
     ===================================================== */
  getAvatar() {
    const av = Shop.getActive('avatar') || 'default';
    const item = Shop.ITEMS.find(i => i.type === 'avatar' && i.value === av);
    return item ? item.icon : '👤';
  },

  setAvatar(value) {
    Shop.setActive('avatar', value);
    document.dispatchEvent(new CustomEvent('avatar:change', { detail: value }));
  },

  /* =====================================================
     Name
     ===================================================== */
  setName(name) {
    const data = this.get();
    data.name = (name || '').trim().slice(0, 20) || 'بازیکن';
    this.set(data);
    return data.name;
  },

  getName() {
    return this.get().name;
  },

  /* =====================================================
     Full profile
     ===================================================== */
  full() {
    const p = this.get();
    const stats = PlayerStats.summary();
    const ach = {
      unlocked: Achievements.count(),
      total: Achievements.total(),
      percent: Achievements.percent()
    };
    const lb = Leaderboard.stats();
    const coins = Coins.get();

    return {
      ...p,
      avatarIcon: this.getAvatar(),
      stats,
      achievements: ach,
      leaderboard: lb,
      coins,
      shop: Shop.stats(),
      challenges: Challenges.getStats()
    };
  },

  /* =====================================================
     Render
     ===================================================== */
  render(container) {
    if (!container) return;
    container.innerHTML = '';

    const p = this.full();

    // Header
    const header = el('div', { class: 'profile-header' });
    header.innerHTML = `
      <div class="profile-avatar-big">${p.avatarIcon}</div>
      <div class="profile-info">
        <h2 class="profile-name">${p.name}</h2>
        <div class="profile-joined">📅 عضو از: ${formatDate(p.joinedAt)}</div>
      </div>
      <button class="btn edit-profile-btn">✏️ ویرایش</button>
    `;
    header.querySelector('.edit-profile-btn').addEventListener('click', () => {
      this.openEditModal();
    });
    container.appendChild(header);

    // Quick stats
    const stats = el('div', { class: 'profile-stats' });
    stats.innerHTML = `
      <div class="pstat">
        <div class="pstat-icon">🎮</div>
        <div class="pstat-value">${p.stats.gamesPlayed}</div>
        <div class="pstat-label">بازی</div>
      </div>
      <div class="pstat">
        <div class="pstat-icon">🏆</div>
        <div class="pstat-value">${p.stats.wins}</div>
        <div class="pstat-label">برد</div>
      </div>
      <div class="pstat">
        <div class="pstat-icon">📊</div>
        <div class="pstat-value">${p.stats.winRate}%</div>
        <div class="pstat-label">نرخ برد</div>
      </div>
      <div class="pstat">
        <div class="pstat-icon">🪙</div>
        <div class="pstat-value">${formatNumber(p.coins.balance)}</div>
        <div class="pstat-label">سکه</div>
      </div>
      <div class="pstat">
        <div class="pstat-icon">🔥</div>
        <div class="pstat-value">${p.stats.streak}</div>
        <div class="pstat-label">روز پیوسته</div>
      </div>
      <div class="pstat">
        <div class="pstat-icon">👑</div>
        <div class="pstat-value">${p.stats.bestStreak || 0}</div>
        <div class="pstat-label">رکورد پیوستگی</div>
      </div>
    `;
    container.appendChild(stats);

    // Achievements progress
    const achSec = el('div', { class: 'profile-section' });
    achSec.innerHTML = `
      <h3>🏆 دستاوردها (${p.achievements.unlocked}/${p.achievements.total})</h3>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${p.achievements.percent}%"></div>
      </div>
      <div class="progress-label">${p.achievements.percent}%</div>
    `;
    container.appendChild(achSec);

    // Top games
    const topGames = PlayerStats.topGames(5);
    if (topGames.length) {
      const topSec = el('div', { class: 'profile-section' });
      topSec.appendChild(el('h3', { text: '🎯 محبوب‌ترین بازی‌ها' }));

      const list = el('div', { class: 'top-games-list' });
      topGames.forEach(t => {
        const game = GameLand.get(t.id);
        if (!game) return;

        const row = el('div', { class: 'top-game-row' });
        row.innerHTML = `
          <span class="tg-icon">${game.emoji}</span>
          <span class="tg-name">${game.name}</span>
          <span class="tg-count">${t.played} بازی</span>
          <span class="tg-best">🏆 ${formatNumber(t.bestScore || 0)}</span>
        `;
        list.appendChild(row);
      });
      topSec.appendChild(list);
      container.appendChild(topSec);
    }

    // Backup & Settings shortcut
    const actions = el('div', { class: 'profile-actions' });
    actions.innerHTML = `
      <button class="btn" id="prof-settings">⚙️ تنظیمات</button>
      <button class="btn" id="prof-backup">💾 پشتیبان</button>
      <button class="btn danger" id="prof-reset">🗑️ ریست</button>
    `;
    actions.querySelector('#prof-settings').addEventListener('click', () => {
      Router.go('settings');
    });
    actions.querySelector('#prof-backup').addEventListener('click', () => {
      Backup.export();
      Toast.success('پشتیبان دانلود شد');
    });
    actions.querySelector('#prof-reset').addEventListener('click', () => {
      Modal.confirm(
        'مطمئنی؟ همه آمار و پیشرفت پاک می‌شه.',
        () => {
          Backup.reset();
          location.reload();
        },
        { ok: 'بله، پاک کن' }
      );
    });
    container.appendChild(actions);
  },

  /* =====================================================
     Edit Modal
     ===================================================== */
  openEditModal() {
    const p = this.get();

    const avatars = Shop.ITEMS
      .filter(i => i.type === 'avatar' && !i.locked)
      .map(i => {
        const owned = Shop.isOwned(i.id);
        return {
          ...i,
          owned
        };
      });

    const body = `
      <div class="edit-profile-form">
        <label>
          نام
          <input type="text" id="edit_name" value="${p.name}" maxlength="20">
        </label>
        <label>آواتار</label>
        <div class="avatar-picker">
          ${avatars.map(a => `
            <button class="avatar-option ${a.value === p.avatar ? 'active' : ''} ${!a.owned ? 'locked' : ''}"
                    data-value="${a.value}"
                    title="${a.owned ? a.name : `🔒 ${a.price} سکه`}">
              ${a.icon}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    Modal.open({
      title: '✏️ ویرایش پروفایل',
      body,
      actions: [
        { label: 'بی‌خیال' },
        {
          label: 'ذخیره',
          primary: true,
          onClick: () => {
            const name = document.getElementById('edit_name').value;
            this.setName(name);

            const activeAva = document.querySelector('.avatar-option.active');
            if (activeAva && !activeAva.classList.contains('locked')) {
              this.setAvatar(activeAva.dataset.value);
            }

            Toast.success('پروفایل ذخیره شد');
            document.dispatchEvent(new CustomEvent('profile:update'));
          }
        }
      ]
    });

    // Avatar events
    setTimeout(() => {
      document.querySelectorAll('.avatar-option').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.classList.contains('locked')) {
            Toast.warn('از فروشگاه بخر');
            return;
          }
          document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          Sound.click();
        });
      });
    }, 50);
  },

  /* =====================================================
     Reset
     ===================================================== */
  reset() {
    Storage.remove(this.KEY);
    Log.info('Profile reset');
  }
};

Log.info('Profile loaded');