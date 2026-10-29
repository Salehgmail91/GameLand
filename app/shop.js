/* =========================================================
   GameLand v4 — Shop
   فروشگاه سکه: تم‌ها، پک‌های صدا، آواتارها
   ========================================================= */

'use strict';

const Shop = {
  KEY: 'shop',
  KEY_OWNED: 'shop_owned',

  /* =====================================================
     لیست آیتم‌های فروشگاه
     ===================================================== */
  ITEMS: [
    /* ========== تم‌ها ========== */
    { id: 'theme_dark',    type: 'theme',  name: 'تم شب',       icon: '🌙', price: 0,    value: 'dark',  default: true,  desc: 'تم پیش‌فرض تیره' },
    { id: 'theme_light',   type: 'theme',  name: 'تم روز',      icon: '☀️', price: 200,  value: 'light',                 desc: 'تم روشن و ملایم' },
    { id: 'theme_amber',   type: 'theme',  name: 'تم کهربا',    icon: '🟠', price: 300,  value: 'amber',                 desc: 'رنگ‌های گرم و طلایی' },
    { id: 'theme_neon',    type: 'theme',  name: 'تم نئون',     icon: '💜', price: 500,  value: 'neon',                  desc: 'رنگ‌های نئونی جذاب' },

    /* ========== پک‌های صدا ========== */
    { id: 'pack_classic',  type: 'sound',  name: 'پک کلاسیک',   icon: '🎵', price: 0,    value: 'classic', default: true,  desc: 'صداهای ملایم و استاندارد' },
    { id: 'pack_8bit',     type: 'sound',  name: 'پک ۸ بیتی',   icon: '🎮', price: 250,  value: '8bit',                  desc: 'صداهای رترو و آرکید' },
    { id: 'pack_modern',   type: 'sound',  name: 'پک مدرن',     icon: '🎧', price: 350,  value: 'modern',                desc: 'صداهای الکترونیک مدرن' },

    /* ========== آواتارها ========== */
    { id: 'ava_default',   type: 'avatar', name: 'پیش‌فرض',     icon: '👤', price: 0,    value: 'default', default: true,  desc: 'آواتار ساده' },
    { id: 'ava_cat',       type: 'avatar', name: 'گربه',        icon: '🐱', price: 100,  value: 'cat',                   desc: 'گربه بامزه' },
    { id: 'ava_dog',       type: 'avatar', name: 'سگ',          icon: '🐶', price: 100,  value: 'dog',                   desc: 'سگ وفادار' },
    { id: 'ava_fox',       type: 'avatar', name: 'روباه',       icon: '🦊', price: 150,  value: 'fox',                   desc: 'روباه زرنگ' },
    { id: 'ava_panda',     type: 'avatar', name: 'پاندا',       icon: '🐼', price: 150,  value: 'panda',                 desc: 'پاندای آرام' },
    { id: 'ava_dragon',    type: 'avatar', name: 'اژدها',       icon: '🐉', price: 400,  value: 'dragon',                desc: 'اژدهای آتشین' },
    { id: 'ava_unicorn',   type: 'avatar', name: 'اسب تک‌شاخ',  icon: '🦄', price: 400,  value: 'unicorn',               desc: 'افسانه‌ای' },
    { id: 'ava_alien',     type: 'avatar', name: 'فضایی',       icon: '👽', price: 300,  value: 'alien',                 desc: 'از سیاره‌ای دیگر' },
    { id: 'ava_robot',     type: 'avatar', name: 'ربات',        icon: '🤖', price: 300,  value: 'robot',                 desc: 'هوش مصنوعی' },
    { id: 'ava_ghost',     type: 'avatar', name: 'روح',         icon: '👻', price: 250,  value: 'ghost',                 desc: 'ترسناک و باحال' },

    /* ========== آیتم‌های ویژه (بدون قیمت - قفل) ========== */
    { id: 'ava_krypton',   type: 'avatar', name: 'Krypton',     icon: '💠', price: 9999, value: 'krypton', locked: true,    desc: 'ویژه اعضای قدیمی (به‌زودی)' },
    { id: 'theme_cyber',   type: 'theme',  name: 'تم سایبری',   icon: '🌐', price: 9999, value: 'cyber',   locked: true,    desc: 'به‌زودی...' }
  ],

  /* =====================================================
     Owned items
     ===================================================== */
  getOwned() {
    let owned = Storage.get(this.KEY_OWNED, null);

    if (owned === null) {
      // اولین بار: آیتم‌های پیش‌فرض
      owned = this.ITEMS.filter(i => i.default).map(i => i.id);
      Storage.set(this.KEY_OWNED, owned);
      return owned;
    }

    // 🆕 اطمینان از اینکه آیتم‌های default همیشه توی لیست هستن
    const defaultIds = this.ITEMS.filter(i => i.default).map(i => i.id);
    let changed = false;
    defaultIds.forEach(id => {
      if (!owned.includes(id)) {
        owned.push(id);
        changed = true;
      }
    });
    if (changed) {
      Storage.set(this.KEY_OWNED, owned);
    }

    return owned;
},

  setOwned(list) {
    Storage.set(this.KEY_OWNED, list);
  },

  isOwned(id) {
    return this.getOwned().includes(id);
  },

  /* =====================================================
     Active items
     ===================================================== */
  getActive(type) {
    return Storage.get(`active_${type}`, null);
  },

  setActive(type, value) {
    Storage.set(`active_${type}`, value);
    document.dispatchEvent(new CustomEvent('shop:active', {
      detail: { type, value }
    }));
  },

  getActiveItem(type) {
    const val = this.getActive(type);
    if (!val) {
      return this.ITEMS.find(i => i.type === type && i.default) || null;
    }
    return this.ITEMS.find(i => i.type === type && i.value === val) || null;
  },

  /* =====================================================
     Buy
     ===================================================== */
  buy(id) {
    const item = this.ITEMS.find(i => i.id === id);
    if (!item) {
      Toast.error('آیتم پیدا نشد');
      return false;
    }
    
    if (item.locked) {
      Toast.warn('این آیتم هنوز در دسترس نیست');
      return false;
    }

    if (this.isOwned(id)) {
      Toast.info('قبلاً خریداری شده');
      return false;
    }

    if (!Coins.has(item.price)) {
  const needed = item.price - Coins.balance();
  Toast.warn(`🪙 ${needed} سکه دیگه لازم داری! (موجودی: ${Coins.balance()})`);
  Sound.error();
  if (typeof AnimPro !== 'undefined') {
    AnimPro.shake(document.querySelector('.shop-balance'), 5, 500);
  }
  return false;
}

    // خرید
    Coins.spend(item.price, `خرید: ${item.name}`);
    const owned = this.getOwned();
    owned.push(id);
    this.setOwned(owned);

    // فیدبک
    Toast.success(`✅ ${item.icon} ${item.name} خریداری شد!`);
    Confetti.burst(60);
    Sound.unlock?.();
    Sound.win();

    document.dispatchEvent(new CustomEvent('shop:buy', {
      detail: { item }
    }));

    Log.info('Shop purchase:', id, item.price);
    return true;
  },

  /* =====================================================
     Use (فعال‌سازی)
     ===================================================== */
  use(id) {
    const item = this.ITEMS.find(i => i.id === id);
    if (!item) return false;
    if (!this.isOwned(id)) {
      Toast.warn('اول باید بخری');
      return false;
    }

    this.setActive(item.type, item.value);

    // اعمال فوری
    if (item.type === 'theme' && typeof ThemeManager !== 'undefined') {
      ThemeManager.apply(item.value);
    }
    if (item.type === 'sound' && typeof Sound !== 'undefined') {
      Sound.setPack(item.value);
    }
    if (item.type === 'avatar') {
      document.dispatchEvent(new CustomEvent('avatar:change', { detail: item.value }));
    }

    Toast.success(`${item.icon} ${item.name} فعال شد`);
    Sound.click();

    return true;
  },

  /* =====================================================
     Query
     ===================================================== */
  byType(type) {
    return this.ITEMS.filter(i => i.type === type);
  },

  owned() {
    return this.ITEMS.filter(i => this.isOwned(i.id));
  },

  available(type = null) {
    const owned = this.getOwned();
    return this.ITEMS.filter(i =>
      (!type || i.type === type) && !owned.includes(i.id) && !i.locked
    );
  },

  /* =====================================================
     Stats
     ===================================================== */
  stats() {
    const owned = this.getOwned();
    const byType = {};
    this.ITEMS.forEach(i => {
      if (!byType[i.type]) byType[i.type] = { owned: 0, total: 0 };
      byType[i.type].total++;
      if (owned.includes(i.id)) byType[i.type].owned++;
    });
    return {
      totalOwned: owned.length,
      totalItems: this.ITEMS.length,
      byType
    };
  },

  /* =====================================================
     Render
     ===================================================== */
  render(container, filter = null) {
    if (!container) return;
    container.innerHTML = '';

    const items = filter ? this.byType(filter) : this.ITEMS;

    // هدر موجودی
    const header = el('div', { class: 'shop-header' }, [
      el('span', { class: 'shop-balance', html: `🪙 <b>${Coins.balance()}</b>` })
    ]);
    container.appendChild(header);

    // گروه‌بندی
    const groups = {};
    items.forEach(i => {
      if (!groups[i.type]) groups[i.type] = [];
      groups[i.type].push(i);
    });

    const labels = {
      theme: '🎨 تم‌ها',
      sound: '🎵 پک صدا',
      avatar: '👤 آواتار'
    };

    for (const [type, list] of Object.entries(groups)) {
      container.appendChild(el('h3', { class: 'shop-cat', text: labels[type] || type }));

      const grid = el('div', { class: 'shop-grid' });
      list.forEach(item => {
        grid.appendChild(this._renderItem(item));
      });
      container.appendChild(grid);
    }
  },

  _renderItem(item) {
    const owned = this.isOwned(item.id);
    const active = this.getActive(item.type) === item.value;
    const canBuy = Coins.has(item.price) && !item.locked;

    const card = el('div', {
      class: `shop-item ${owned ? 'owned' : ''} ${active ? 'active' : ''} ${item.locked ? 'locked' : ''}`
    });

    card.innerHTML = `
      <div class="shop-item-icon">${item.icon}</div>
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-desc">${item.desc}</div>
      ${item.locked
        ? `<div class="shop-item-price locked">به‌زودی</div>`
        : active
          ? `<div class="shop-item-price active-tag">✓ فعال</div>`
          : owned
            ? `<button class="btn shop-btn use-btn">استفاده</button>`
            : `<button class="btn primary shop-btn buy-btn ${canBuy ? '' : 'disabled'}" ${canBuy ? '' : 'disabled'}>
                🪙 ${item.price}
              </button>`
      }
    `;

    const btn = card.querySelector('button');
    if (btn) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (btn.classList.contains('buy-btn')) this.buy(item.id);
        else if (btn.classList.contains('use-btn')) this.use(item.id);
        // رندر مجدد
        const container = card.parentElement?.parentElement;
        if (container) this.render(container);
      });
    }

    return card;
  },

  /* =====================================================
     Reset
     ===================================================== */
  reset() {
    Storage.remove(this.KEY_OWNED);
    Storage.remove('active_theme');
    Storage.remove('active_sound');
    Storage.remove('active_avatar');
    Log.info('Shop reset');
  }
};

Log.info('Shop loaded:', Shop.ITEMS.length, 'items');