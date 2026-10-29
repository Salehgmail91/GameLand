/* =========================================================
   GameLand v3 — Hub + Router + Views
   ========================================================= */

'use strict';

/* =========================================================
   لیست بازی‌ها
   ========================================================= */
const GAMES_LIST = [
  // کلاسیک
  { id:'snake',       name:'مار',           emoji:'🐍', color:'#22c55e', desc:'مار رو هدایت کن، غذا بخور و بزرگ‌تر شو!', tags:['کلاسیک','آرکید'] },
  { id:'g2048',       name:'۲۰۴۸',          emoji:'🔢', color:'#f59e0b', desc:'عددها رو ادغام کن و به ۲۰۴۸ برس!', tags:['فکری'] },
  { id:'ttt',         name:'دوز',           emoji:'⭕', color:'#00e5ff', desc:'با هوش مصنوعی بازی کن — می‌تونی شکستش بدی؟', tags:['فکری','کلاسیک'] },
  { id:'breakout',    name:'آجرشکن',        emoji:'🧱', color:'#ef4444', desc:'توپ رو با راکت بزن و آجرها رو خرد کن!', tags:['کلاسیک','آرکید'] },
  { id:'pong',        name:'پینگ پونگ',     emoji:'🏓', color:'#22d3ee', desc:'با کامپیوتر پینگ پونگ بازی کن!', tags:['کلاسیک','ورزشی'] },
  { id:'tetris',      name:'تتریس',         emoji:'🧩', color:'#8b5cf6', desc:'قطعه‌ها رو بچین و ردیف‌ها رو پر کن!', tags:['کلاسیک','فکری'] },
  { id:'minesweeper', name:'مین‌یاب',       emoji:'💣', color:'#94a3b8', desc:'بدون انفجار همه خونه‌ها رو باز کن!', tags:['فکری','کلاسیک'] },

  // فکری
  { id:'memory',      name:'بازی حافظه',    emoji:'🧠', color:'#ec4899', desc:'جفت کارت‌های یکسان رو پیدا کن!', tags:['فکری'] },
  { id:'bubble',      name:'حباب‌شکن',      emoji:'🫧', color:'#06b6d4', desc:'حباب‌های هم‌رنگ رو بترکون!', tags:['آرکید','فکری'] },
  { id:'puzzle',      name:'پازل کشویی',    emoji:'🎯', color:'#f472b6', desc:'اعداد رو به ترتیب بچین!', tags:['فکری'] },
  { id:'simon',       name:'سایمون',        emoji:'🎨', color:'#10b981', desc:'رنگ‌ها رو به خاطر بسپار و تکرار کن!', tags:['فکری','سرعتی'] },
  { id:'lightsout',   name:'خاموش‌کن',      emoji:'💡', color:'#fbbf24', desc:'همه چراغ‌ها رو خاموش کن!', tags:['فکری','جدید'] },
  { id:'sequence',    name:'دنباله',        emoji:'🎵', color:'#8b5cf6', desc:'الگوها رو دنبال کن و تکرار کن!', tags:['فکری','جدید'] },

  // سرعتی
  { id:'reaction',    name:'تست سرعت',      emoji:'⚡', color:'#eab308', desc:'وقتی سبز شد، سریع‌ترین کلیک زندگیت رو بزن!', tags:['سرعتی'] },
  { id:'whack',       name:'مول‌زنی',       emoji:'🔨', color:'#f97316', desc:'۳۰ ثانیه وقت داری — تا می‌تونی مول بزن!', tags:['سرعتی','آرکید'] },
  { id:'flappy',      name:'پرنده',         emoji:'🐦', color:'#eab308', desc:'از بین لوله‌ها رد شو، نذار بیفتی!', tags:['آرکید','سرعتی'] },

  // استراتژی
  { id:'connect4',    name:'چهارتایی',      emoji:'🔷', color:'#3b82f6', desc:'چهار مهره هم‌رنگ رو کنار هم بچین!', tags:['فکری','استراتژی','جدید'] },
  { id:'hangman',     name:'حدس کلمه',      emoji:'🔤', color:'#10b981', desc:'کلمه مخفی رو با حدس حروف پیدا کن!', tags:['فکری','جدید'] },

  // شانسی
  { id:'rps',         name:'سنگ کاغذ قیچی', emoji:'✊', color:'#a855f7', desc:'بختت رو با کامپیوتر امتحان کن!', tags:['شانسی'] },
  { id:'dice',        name:'تاس',           emoji:'🎲', color:'#ef4444', desc:'تاس بریز و امتیاز جمع کن!', tags:['شانسی','جدید'] }
];

/* =========================================================
   عناصر DOM
   ========================================================= */
const hubView    = $('#hubView');
const gameView   = $('#gameView');
const favView    = $('#favView');
const achView    = $('#achView');
const statsView  = $('#statsView');

const hubEl        = $('#hub');
const gameArea     = $('#gameArea');
const gameTitle    = $('#gameTitle');
const gameCountEl  = $('#gameCount');
const searchIn     = $('#searchInput');
const filterBtns   = $('#filterBtns');
const emptyMsg     = $('#emptyMsg');
const favGrid      = $('#favGrid');
const favEmpty     = $('#favEmpty');
const favCountEl   = $('#favCount');
const favBtnGame   = $('#favBtnGame');
const dailyBanner  = $('#dailyBanner');
const gameLbSection = $('#gameLbSection');
const gameLbList   = $('#gameLbList');

/* =========================================================
   State
   ========================================================= */
let activeTag = 'همه';
let searchTerm = '';
let currentGameId = null;
let cleanupFn = null;

/* =========================================================
   Update Stats (بالای صفحه اصلی)
   ========================================================= */
function updateHeaderStats() {
  const played = Storage.get('played', []);
  const favs   = getFavorites();

  let bestCount = 0;
  GAMES_LIST.forEach(g => {
    const rec = store('gl_' + g.id + '_best');
    if (rec) bestCount++;
  });

  $('#statTotal').textContent  = GAMES_LIST.length;
  $('#statPlayed').textContent = played.length;
  $('#statFav').textContent    = favs.length;
  $('#statAch').textContent    = Achievements.count();

  gameCountEl.textContent = GAMES_LIST.length + ' مینی‌گیم';

  if (favs.length > 0) {
    favCountEl.textContent = favs.length;
    favCountEl.classList.add('show');
  } else {
    favCountEl.classList.remove('show');
  }
}

/* =========================================================
   Favorites
   ========================================================= */
function getFavorites() {
  return Storage.get('favorites', []);
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id) {
  let favs = getFavorites();
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
    Sound.click();
    Toast.info('از علاقه‌مندی‌ها حذف شد');
  } else {
    favs.push(id);
    Sound.pop();
    Toast.success('⭐ به علاقه‌مندی‌ها اضافه شد');
    if (favs.length >= 3) Achievements.unlock('fav_3');
  }
  Storage.set('favorites', favs);
  updateHeaderStats();
  renderHub();
  renderFavs();
  if (!gameView.classList.contains('hidden')) updateGameFavBtn();
}

/* =========================================================
   Played Tracking
   ========================================================= */
function markPlayed(id) {
  let played = Storage.get('played', []);
  if (!played.includes(id)) {
    played.push(id);
    Storage.set('played', played);
  }
  PlayerStats.markGame(id);
  updateHeaderStats();
}

/* =========================================================
   Filters
   ========================================================= */
const ALL_TAGS = ['همه', ...new Set(GAMES_LIST.flatMap(g => g.tags))];

filterBtns.innerHTML = ALL_TAGS.map((t, i) =>
  `<button data-tag="${t}" class="${i === 0 ? 'active' : ''}">${t}</button>`
).join('');

filterBtns.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  activeTag = btn.dataset.tag;
  filterBtns.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', b === btn)
  );
  renderHub();
  Sound.click();
});

if (searchIn) {
  searchIn.addEventListener('input', () => {
    searchTerm = searchIn.value.trim().toLowerCase();
    renderHub();
  });
}

/* =========================================================
   Render Hub
   ========================================================= */
function renderHub() {
  hubEl.innerHTML = '';
  const filtered = GAMES_LIST.filter(g => {
    const matchTag = activeTag === 'همه' || g.tags.includes(activeTag);
    const matchSearch = !searchTerm ||
      g.name.toLowerCase().includes(searchTerm) ||
      g.desc.toLowerCase().includes(searchTerm) ||
      g.tags.some(t => t.toLowerCase().includes(searchTerm));
    return matchTag && matchSearch;
  });

  if (filtered.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }
  emptyMsg.classList.add('hidden');

  filtered.forEach((g, i) => {
    const card = createGameCard(g, i);
    hubEl.appendChild(card);
  });
}

/* =========================================================
   Create Game Card (کامپوننت مشترک)
   ========================================================= */
function createGameCard(g, i) {
  const card = document.createElement('a');
  card.className = 'card';
  card.href = '#' + g.id;
  card.style.setProperty('--c', g.color);
  card.style.animationDelay = (i * 0.03) + 's';

  const isFav = isFavorite(g.id);
  const isNew = g.tags.includes('جدید');
  const isDaily = Daily.check().game === g.id && !Daily.isDoneToday();

  card.innerHTML = `
    ${isNew ? '<span class="card-badge new">جدید</span>' : ''}
    ${isDaily ? '<span class="card-badge">📅 چالش امروز</span>' : ''}
    <button class="fav-star ${isFav ? 'active' : ''}" data-id="${g.id}" title="علاقه‌مندی">
      ${isFav ? '⭐' : '☆'}
    </button>
    <span class="ico">${g.emoji}</span>
    <h3>${g.name}</h3>
    <p>${g.desc}</p>
    <div class="tag-line">
      ${g.tags.filter(t => t !== 'جدید').map(t => `<span class="mini-tag">${t}</span>`).join('')}
    </div>
    <div class="play">بازی کن ←</div>
  `;

  card.addEventListener('click', e => {
    if (e.target.closest('.fav-star')) return;
    Sound.click();
  });

  const favBtn = card.querySelector('.fav-star');
  favBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(g.id);
  });

  return card;
}

/* =========================================================
   Render Favorites
   ========================================================= */
function renderFavs() {
  if (!favGrid) return;
  favGrid.innerHTML = '';
  const favs = getFavorites();
  const items = GAMES_LIST.filter(g => favs.includes(g.id));

  if (items.length === 0) {
    favEmpty.classList.remove('hidden');
    return;
  }
  favEmpty.classList.add('hidden');

  items.forEach((g, i) => {
    favGrid.appendChild(createGameCard(g, i));
  });
}

/* =========================================================
   Achievements View
   ========================================================= */
function renderAchievements() {
  const grid = $('#achGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const unlocked = Achievements.get();
  const list = Achievements.LIST;

  const total = list.length;
  const done = Object.keys(unlocked).length;
  const percent = Math.round((done / total) * 100);

  $('#achUnlocked').textContent = done;
  $('#achTotal').textContent = total;
  $('#achPercent').textContent = percent + '%';

  list.forEach(a => {
    const isDone = !!unlocked[a.id];
    const el = document.createElement('div');
    el.className = 'ach-card ' + (isDone ? 'unlocked' : 'locked');
    el.innerHTML = `
      <span class="ach-icon">${a.icon}</span>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
    `;
    grid.appendChild(el);
  });
}

/* =========================================================
   Stats View
   ========================================================= */
function renderStats() {
  const s = PlayerStats.get();

  $('#stPlayed').textContent = s.gamesPlayed || 0;
  $('#stWins').textContent   = s.wins || 0;
  $('#stLosses').textContent = s.losses || 0;
  $('#stStreak').textContent = s.streak || 0;

  // Win rate
  const total = (s.wins || 0) + (s.losses || 0);
  const rate = total ? Math.round(((s.wins || 0) / total) * 100) : 0;
  $('#stWinRate').textContent = rate + '%';
  $('#stWinRateBar').style.width = rate + '%';

  // Favorite games (top 3 by best score)
  const favListEl = $('#stFavList');
  favListEl.innerHTML = '';

  const rows = GAMES_LIST
    .map(g => ({
      ...g,
      best: +(store('gl_' + g.id + '_best') || 0)
    }))
    .filter(g => g.best > 0)
    .sort((a, b) => b.best - a.best)
    .slice(0, 3);

  if (rows.length === 0) {
    $('#stFavGame').textContent = '—';
    favListEl.innerHTML = '<p class="hint" style="margin:8px 0">هنوز رکوردی ثبت نکردی</p>';
    return;
  }

  $('#stFavGame').textContent = rows[0].emoji + ' ' + rows[0].name;

  rows.forEach(r => {
    const row = document.createElement('div');
    row.className = 'lb-row';
    row.innerHTML = `
      <span class="lb-rank">${r.emoji}</span>
      <span>${r.name}</span>
      <span class="lb-score">${r.best}</span>
    `;
    favListEl.appendChild(row);
  });
}

/* =========================================================
   Daily Challenge
   ========================================================= */
function renderDailyBanner() {
  if (!dailyBanner) return;
  const state = Daily.check();
  const game = GAMES_LIST.find(g => g.id === state.game);

  if (!game) {
    dailyBanner.classList.add('hidden');
    return;
  }

  const sub = $('#dailySub');
  const badge = $('#dailyBadge');

  if (state.done) {
    dailyBanner.classList.add('done');
    sub.innerHTML = `امروز انجام شد ✅ — <b>${game.emoji} ${game.name}</b>`;
    badge.textContent = 'انجام شد';
  } else {
    dailyBanner.classList.remove('done');
    sub.innerHTML = `بازی کن: <b>${game.emoji} ${game.name}</b>`;
    badge.textContent = 'امروز';
  }

  // فقط یک بار listener
  if (!dailyBanner.dataset.wired) {
    dailyBanner.dataset.wired = '1';
    dailyBanner.addEventListener('click', () => {
      const s = Daily.check();
      if (s.done) return;
      if (s.game && GameLand.exists(s.game)) {
        location.hash = s.game;
      }
    });
  }
}

/* =========================================================
   Game View
   ========================================================= */
function hideAllViews() {
  [hubView, gameView, favView, achView, statsView].forEach(v => v && v.classList.add('hidden'));
}

function openGame(id) {
  const game = GameLand.get(id);
  if (!game) {
    console.warn('بازی پیدا نشد:', id);
    Toast.error('بازی پیدا نشد');
    location.hash = 'home';
    return;
  }

  if (cleanupFn) { try { cleanupFn(); } catch {} cleanupFn = null; }
  gameArea.innerHTML = '';

  hideAllViews();
  gameView.classList.remove('hidden');
  gameTitle.textContent = game.emoji + '  ' + game.name;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  currentGameId = id;
  updateGameFavBtn();
  markPlayed(id);

  // لیست رکوردهای این بازی
  renderGameLeaderboard(id);

  try {
    cleanupFn = game.init(gameArea) || null;
  } catch (err) {
    console.error('خطا در اجرای بازی:', err);
    gameArea.innerHTML = '<p class="hint">مشکلی پیش اومد 😅</p>';
  }
}

function renderGameLeaderboard(id) {
  if (!gameLbSection || !gameLbList) return;
  const list = Leaderboard.get(id);
  if (!list.length) {
    gameLbSection.classList.add('hidden');
    return;
  }
  gameLbSection.classList.remove('hidden');
  gameLbList.innerHTML = list.map((r, i) => `
    <div class="lb-row rank-${i + 1}">
      <span class="lb-rank">${i + 1}</span>
      <span>امتیاز</span>
      <span class="lb-score">${r.score}</span>
    </div>
  `).join('');
}

function closeGame() {
  if (cleanupFn) { try { cleanupFn(); } catch {} cleanupFn = null; }
  gameArea.innerHTML = '';
  hideAllViews();
  hubView.classList.remove('hidden');
  currentGameId = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =========================================================
   Open other views
   ========================================================= */
function openFavs() {
  if (cleanupFn) { try { cleanupFn(); } catch {} cleanupFn = null; }
  gameArea.innerHTML = '';
  hideAllViews();
  favView.classList.remove('hidden');
  renderFavs();
  setBottomNav('fav');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openAchievements() {
  if (cleanupFn) { try { cleanupFn(); } catch {} cleanupFn = null; }
  gameArea.innerHTML = '';
  hideAllViews();
  achView.classList.remove('hidden');
  renderAchievements();
  setBottomNav('ach');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openStats() {
  if (cleanupFn) { try { cleanupFn(); } catch {} cleanupFn = null; }
  gameArea.innerHTML = '';
  hideAllViews();
  statsView.classList.remove('hidden');
  renderStats();
  setBottomNav('stats');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goHome() {
  closeGame();
  setBottomNav('home');
}

/* =========================================================
   Favorite button در صفحه بازی
   ========================================================= */
function updateGameFavBtn() {
  if (!favBtnGame || !currentGameId) return;
  if (isFavorite(currentGameId)) {
    favBtnGame.classList.add('active');
    favBtnGame.textContent = '⭐';
  } else {
    favBtnGame.classList.remove('active');
    favBtnGame.textContent = '☆';
  }
}

if (favBtnGame) {
  favBtnGame.addEventListener('click', () => {
    if (currentGameId) toggleFavorite(currentGameId);
  });
}

/* =========================================================
   Bottom Navigation
   ========================================================= */
function setBottomNav(view) {
  document.querySelectorAll('.bottom-nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
}

document.querySelectorAll('.bottom-nav button').forEach(b => {
  b.addEventListener('click', () => {
    const v = b.dataset.view;
    Sound.click();
    if (v === 'home')  goHome();
    if (v === 'fav')   openFavs();
    if (v === 'ach')   openAchievements();
    if (v === 'stats') openStats();
  });
});

/* =========================================================
   Router
   ========================================================= */
function route() {
  const hash = (location.hash || '').replace('#', '').trim();
  if (!hash || hash === 'home') {
    goHome();
  } else if (hash === 'fav') {
    openFavs();
  } else if (hash === 'ach' || hash === 'achievements') {
    openAchievements();
  } else if (hash === 'stats') {
    openStats();
  } else {
    openGame(hash);
  }
}

window.addEventListener('hashchange', route);

/* =========================================================
   Buttons
   ========================================================= */
$('#backBtn').addEventListener('click', e => {
  e.preventDefault();
  location.hash = 'home';
});

$('#favBackBtn').addEventListener('click', e => {
  e.preventDefault();
  location.hash = 'home';
});

$('#achBackBtn').addEventListener('click', e => {
  e.preventDefault();
  location.hash = 'home';
});

$('#statsBackBtn').addEventListener('click', e => {
  e.preventDefault();
  location.hash = 'home';
});

$('#logoLink').addEventListener('click', e => {
  e.preventDefault();
  location.hash = 'home';
});

const favBtnHeader = $('#favBtnHeader');
if (favBtnHeader) {
  favBtnHeader.addEventListener('click', () => {
    location.hash = 'fav';
    Sound.click();
  });
}

/* Reset Stats */
const resetBtn = $('#resetStatsBtn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    Modal.open({
      title: '⚠️ پاک کردن همه داده‌ها',
      body: 'همه رکوردها، علاقه‌مندی‌ها، دستاوردها و آمار پاک می‌شن. مطمئنی؟',
      actions: [
        { label: 'بی‌خیال', primary: false },
        {
          label: 'بله، پاک کن',
          primary: true,
          onClick: () => {
            Storage.clearAll();
            Toast.success('همه داده‌ها پاک شد');
            updateHeaderStats();
            renderHub();
            renderStats();
            renderAchievements();
          }
        }
      ]
    });
  });
}

/* =========================================================
   Escape key
   ========================================================= */
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!gameView.classList.contains('hidden') ||
        !favView.classList.contains('hidden') ||
        !achView.classList.contains('hidden') ||
        !statsView.classList.contains('hidden')) {
      location.hash = 'home';
    }
  }
});

/* =========================================================
   Theme Toggle (با Neon)
   ========================================================= */
const THEMES = ['dark', 'light', 'amber', 'neon'];
const THEME_ICONS = { dark: '🌙', light: '☀️', amber: '🟠', neon: '💜' };

function getTheme() {
  return Storage.get('theme', 'dark');
}

function setTheme(t) {
  Storage.set('theme', t);
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const btn = $('#themeBtn');
  if (btn) btn.textContent = THEME_ICONS[t] || '🌙';
}

applyTheme(getTheme());

const themeBtn = $('#themeBtn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const cur = getTheme();
    const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    applyTheme(next);
    setTheme(next);
    Sound.click();
    Toast.info('تم: ' + (THEME_ICONS[next] || ''));
  });
}

/* =========================================================
   Sound Toggle
   ========================================================= */
const soundBtn = $('#soundToggle');
if (soundBtn) {
  const soundEnabled = Storage.get('sound', true);
  Sound.enabled = soundEnabled;
  soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
  soundBtn.classList.toggle('off', !soundEnabled);

  soundBtn.addEventListener('click', () => {
    Sound.enabled = !Sound.enabled;
    Storage.set('sound', Sound.enabled);
    soundBtn.textContent = Sound.enabled ? '🔊' : '🔇';
    soundBtn.classList.toggle('off', !Sound.enabled);
    if (Sound.enabled) Sound.click();
  });
}

/* =========================================================
   Preloader
   ========================================================= */
const preloader = $('#preloader');
if (preloader) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
      setTimeout(() => preloader.remove(), 600);
    }, 900);
  });
}

/* =========================================================
   Achievement Event → Toast (خودکار انجام می‌شه ولی اینجا hook)
   ========================================================= */
document.addEventListener('achievement:unlock', e => {
  // می‌تونی اینجا هرکاری کردی
  updateHeaderStats();
});

/* =========================================================
   Init
   ========================================================= */
updateHeaderStats();
renderHub();
renderDailyBanner();
route();