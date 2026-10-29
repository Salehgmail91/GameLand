/* =========================================================
   GameLand v6 — Word Search (🔤 کلمه‌یابی فارسی)
   ========================================================= */

GameLand.register('word-search', {
  name: 'کلمه‌یابی',
  emoji: '🔤',
  desc: 'کلمات مخفی رو پیدا کن!',
  tags: ['فکری', 'جدید'],
  color: '#10b981',

  init(root) {
    // کلمات فارسی — گروه‌بندی شده
    const WORD_POOLS = {
      animals: ['گربه', 'سگ', 'شیر', 'پلنگ', 'خرس', 'روباه', 'آهو', 'گرگ', 'فیل', 'زرافه'],
      fruits: ['سیب', 'موز', 'انار', 'هلو', 'انگور', 'توت', 'خرما', 'گیلاس', 'طالبی', 'هندوانه'],
      colors: ['آبی', 'قرمز', 'سبز', 'زرد', 'بنفش', 'نارنجی', 'صورتی', 'سفید', 'سیاه', 'فیروزه'],
      objects: ['کتاب', 'قلم', 'میز', 'صندلی', 'در', 'پنجره', 'چراغ', 'کلید', 'ساعت', 'کیف']
    };

    const CATEGORIES = [
      { id: 'animals', name: 'حیوانات', emoji: '🐾', words: WORD_POOLS.animals },
      { id: 'fruits',  name: 'میوه‌ها',  emoji: '🍎', words: WORD_POOLS.fruits },
      { id: 'colors',  name: 'رنگ‌ها',   emoji: '🎨', words: WORD_POOLS.colors },
      { id: 'objects', name: 'اشیا',     emoji: '📚', words: WORD_POOLS.objects }
    ];

    const GRID_SIZE = 10;
    const WORDS_PER_GAME = 5;
    const LETTERS = 'ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی'.split('');

    let grid = [];         // 2D array
    let placedWords = [];  // { word, cells: [{r, c}], found: false }
    let foundCount = 0;
    let selectedCells = []; // cells کاربر انتخاب کرده
    let startCell = null;
    let isDragging = false;
    let currentCategory = 'animals';
    let startTime = 0;
    let timerId = null;
    let elapsedTime = 0;

    let best = +(store('gl_word-search_best') || 0);

    // =====================================================
    // HTML
    // =====================================================
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>پیدا شده</span><b id="wsFound">0/${WORDS_PER_GAME}</b></div>
        <div class="hud-box"><span>زمان</span><b id="wsTime">0:00</b></div>
        <div class="hud-box"><span>رکورد</span><b id="wsBest">${best || '—'}</b></div>
      </div>

      <div class="ws-categories" id="wsCats">
        ${CATEGORIES.map(c => `
          <button class="ws-cat-btn ${c.id === currentCategory ? 'active' : ''}" data-cat="${c.id}">
            <span>${c.emoji}</span>
            <span>${c.name}</span>
          </button>
        `).join('')}
      </div>

      <div class="ws-words" id="wsWords"></div>

      <div class="ws-grid-wrap">
        <div class="ws-grid" id="wsGrid"></div>
      </div>

      <div class="overlay hidden" id="wsOver">
        <h3 id="wsTitle">🏆 آفرین!</h3>
        <p id="wsText"></p>
        <div class="ws-final-stats" id="wsFinalStats"></div>
        <button class="btn primary" id="wsRestart">بازی جدید</button>
      </div>
    `;

    const foundEl = $('#wsFound', root);
    const timeEl = $('#wsTime', root);
    const bestEl = $('#wsBest', root);
    const catsEl = $('#wsCats', root);
    const wordsEl = $('#wsWords', root);
    const gridEl = $('#wsGrid', root);
    const over = $('#wsOver', root);
    const titleEl = $('#wsTitle', root);
    const textEl = $('#wsText', root);
    const finalStatsEl = $('#wsFinalStats', root);

    // =====================================================
    // Grid helpers
    // =====================================================
    function createEmptyGrid() {
      const g = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        g[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          g[r][c] = '';
        }
      }
      return g;
    }

    // جهت‌های ممکن: افقی، عمودی، مورب
    const DIRECTIONS = [
      [0, 1],   // راست
      [0, -1],  // چپ
      [1, 0],   // پایین
      [-1, 0],  // بالا
      [1, 1],   // مورب پایین-راست
      [-1, -1], // مورب بالا-چپ
      [1, -1],  // مورب پایین-چپ
      [-1, 1]   // مورب بالا-راست
    ];

    function tryPlaceWord(word) {
      const shuffledDirs = shuffle([...DIRECTIONS]);

      for (const [dr, dc] of shuffledDirs) {
        // ۲۰ بار تلاش تصادفی
        for (let attempt = 0; attempt < 20; attempt++) {
          const startR = rnd(GRID_SIZE);
          const startC = rnd(GRID_SIZE);

          // چک کن جا می‌شه
          const endR = startR + dr * (word.length - 1);
          const endC = startC + dc * (word.length - 1);

          if (endR < 0 || endR >= GRID_SIZE || endC < 0 || endC >= GRID_SIZE) continue;

          // چک کن حروف تداخل ندارن
          let canPlace = true;
          const cells = [];

          for (let i = 0; i < word.length; i++) {
            const r = startR + dr * i;
            const c = startC + dc * i;
            if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
              canPlace = false;
              break;
            }
            cells.push({ r, c });
          }

          if (!canPlace) continue;

          // بذار
          for (let i = 0; i < word.length; i++) {
            const r = startR + dr * i;
            const c = startC + dc * i;
            grid[r][c] = word[i];
          }

          return cells;
        }
      }

      return null; // نتونست بذاره
    }

    // =====================================================
    // Generate puzzle
    // =====================================================
    function generatePuzzle() {
      grid = createEmptyGrid();
      placedWords = [];
      foundCount = 0;
      selectedCells = [];
      startCell = null;

      // انتخاب ۵ کلمه از دسته فعال
      const category = CATEGORIES.find(c => c.id === currentCategory);
      const pool = shuffle([...category.words]);
      const chosenWords = pool.slice(0, WORDS_PER_GAME);

      // بذار هر کلمه
      for (const word of chosenWords) {
        const cells = tryPlaceWord(word);
        if (cells) {
          placedWords.push({
            word,
            cells,
            found: false,
            horizontal: cells[0].r === cells[1]?.r,
            color: rndColor()
          });
        }
      }

      // پر کردن خونه‌های خالی با حروف تصادفی
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] === '') {
            grid[r][c] = choice(LETTERS);
          }
        }
      }
    }

    // =====================================================
    // Render
    // =====================================================
    function renderGrid() {
      gridEl.innerHTML = '';
      gridEl.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const cell = document.createElement('div');
          cell.className = 'ws-cell';
          cell.dataset.r = r;
          cell.dataset.c = c;
          cell.textContent = grid[r][c];

          // چک کن این خونه بخشی از کلمه پیدا شده هست؟
          const foundWord = placedWords.find(w => w.found && w.cells.some(cc => cc.r === r && cc.c === c));
          if (foundWord) {
            cell.classList.add('found');
            cell.style.setProperty('--found-color', foundWord.color);
          }

          gridEl.appendChild(cell);
        }
      }
    }

    function renderWords() {
      wordsEl.innerHTML = '';
      placedWords.forEach(pw => {
        const el = document.createElement('div');
        el.className = `ws-word ${pw.found ? 'found' : ''}`;
        el.textContent = pw.word;
        if (pw.found) {
          el.style.color = pw.color;
          el.style.borderColor = pw.color + '80';
        }
        wordsEl.appendChild(el);
      });
    }

    // =====================================================
    // Interaction
    // =====================================================
    function getCellFromEvent(e) {
      const target = document.elementFromPoint(
        e.clientX ?? e.touches?.[0]?.clientX,
        e.clientY ?? e.touches?.[0]?.clientY
      );
      const cell = target?.closest('.ws-cell');
      if (!cell) return null;
      return {
        r: +cell.dataset.r,
        c: +cell.dataset.c,
        el: cell
      };
    }

    function highlightSelection(from, to) {
      // پاک کردن قبلی
      gridEl.querySelectorAll('.ws-cell.selecting').forEach(c => c.classList.remove('selecting'));

      // محاسبه مسیر
      const dr = to.r - from.r;
      const dc = to.c - from.c;
      const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;

      // چک کن مستقیم هست
      const isStraight = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
      if (!isStraight) return [];

      const stepR = dr === 0 ? 0 : Math.sign(dr);
      const stepC = dc === 0 ? 0 : Math.sign(dc);

      const cells = [];
      for (let i = 0; i < len; i++) {
        const r = from.r + stepR * i;
        const c = from.c + stepC * i;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) break;
        const cell = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
        if (cell && !cell.classList.contains('found')) {
          cell.classList.add('selecting');
        }
        cells.push({ r, c });
      }

      return cells;
    }

    function checkSelection(cells) {
      if (cells.length < 2) return;

      // ساخت کلمه از سلول‌ها
      const word = cells.map(({ r, c }) => grid[r][c]).join('');
      const reversed = [...word].reverse().join('');

      // چک کن یکی از کلمات پیدا نشده هست؟
      for (const pw of placedWords) {
        if (pw.found) continue;
        if (pw.word === word || pw.word === reversed) {
          // پیدا شد!
          pw.found = true;
          foundCount++;

          // انیمیشن سلول‌ها
          cells.forEach(({ r, c }) => {
            const cell = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
            if (cell) {
              cell.classList.remove('selecting');
              cell.classList.add('found');
              cell.style.setProperty('--found-color', pw.color);
            }
          });

          // آپدیت
          foundEl.textContent = `${foundCount}/${WORDS_PER_GAME}`;
          renderWords();

          Sound.pop();
          if (typeof AnimPro !== 'undefined') {
            // انیمیشن روی کلمه در لیست
            const wordEl = [...wordsEl.children].find(el => el.textContent === pw.word);
            if (wordEl) {
              AnimPro.particleBurst(wordEl, {
                count: 12,
                colors: [pw.color, '#22c55e']
              });
            }
          }
          Toast.success(`✅ ${pw.word}`);

          // چک برد
          if (foundCount === placedWords.length) {
            win();
          }
          return;
        }
      }

      // اشتباه
      Sound.error();
      if (typeof AnimPro !== 'undefined') {
        // لرزش
        cells.forEach(({ r, c }) => {
          const cell = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
          if (cell) {
            cell.classList.add('wrong');
            setTimeout(() => cell.classList.remove('wrong'), 300);
          }
        });
      }
    }

    // =====================================================
    // Mouse / Touch events
    // =====================================================
    function handleStart(e) {
      if (over.classList.contains('hidden') === false) return;
      const cell = getCellFromEvent(e);
      if (!cell) return;
      e.preventDefault();

      isDragging = true;
      startCell = cell;
      selectedCells = [{ r: cell.r, c: cell.c }];

      gridEl.querySelectorAll('.selecting').forEach(c => c.classList.remove('selecting'));
      if (!cell.el.classList.contains('found')) {
        cell.el.classList.add('selecting');
      }
    }

    function handleMove(e) {
      if (!isDragging || !startCell) return;
      const cell = getCellFromEvent(e);
      if (!cell) return;
      e.preventDefault();

      if (cell.r === startCell.r && cell.c === startCell.c) return;

      const cells = highlightSelection(startCell, cell);
      selectedCells = cells;
    }

    function handleEnd(e) {
      if (!isDragging) return;
      isDragging = false;

      if (selectedCells.length >= 2) {
        checkSelection(selectedCells);
      }

      gridEl.querySelectorAll('.selecting').forEach(c => c.classList.remove('selecting'));
      startCell = null;
      selectedCells = [];
    }

    // =====================================================
    // Timer
    // =====================================================
    function startTimer() {
      startTime = Date.now();
      elapsedTime = 0;
      clearInterval(timerId);
      timerId = setInterval(() => {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        const m = Math.floor(elapsedTime / 60);
        const s = elapsedTime % 60;
        timeEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
      }, 1000);
    }

    // =====================================================
    // Win
    // =====================================================
    function win() {
      clearInterval(timerId);
      const finalTime = elapsedTime;

      const newRecord = !best || finalTime < best;
      if (newRecord) {
        best = finalTime;
        store('gl_word-search_best', best);
        bestEl.textContent = best;
      }

      titleEl.textContent = newRecord ? '🏆 رکورد جدید!' : '🎉 آفرین!';
      textEl.textContent = `همه کلمات رو پیدا کردی!`;

      finalStatsEl.innerHTML = `
        <div class="rg-final-stats">
          <div class="rg-stat-row">
            <span>⏱️ زمان نهایی</span>
            <b>${finalTime} ثانیه</b>
          </div>
          <div class="rg-stat-row">
            <span>🔤 کلمات پیدا شده</span>
            <b>${placedWords.length}</b>
          </div>
          <div class="rg-stat-row">
            <span>📂 دسته</span>
            <b>${CATEGORIES.find(c => c.id === currentCategory).name}</b>
          </div>
        </div>
      `;

      over.classList.remove('hidden');

      Sound.win();
      if (typeof AnimPro !== 'undefined') {
        AnimPro.flash('#22c55e', 400);
        AnimPro.confettiPro('stars', { count: 40 });
        AnimPro.confettiPro('rings');
      }
      if (typeof Confetti !== 'undefined') Confetti.burst(80);

      // ثبت
      PlayerStats.markGame('word-search');
      Leaderboard.submit('word-search', Math.max(0, 1000 - finalTime * 5));
      PlayerStats.win();
      Achievements.check();
    }

    // =====================================================
    // Reset / Start
    // =====================================================
    function reset() {
      generatePuzzle();
      renderGrid();
      renderWords();
      foundEl.textContent = `0/${placedWords.length}`;
      over.classList.add('hidden');
      startTimer();
    }

    // =====================================================
    // Event Listeners
    // =====================================================
    // Mouse
    gridEl.addEventListener('mousedown', handleStart);
    gridEl.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Touch
    gridEl.addEventListener('touchstart', handleStart, { passive: false });
    gridEl.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    // Category buttons
    catsEl.addEventListener('click', e => {
      const btn = e.target.closest('.ws-cat-btn');
      if (!btn) return;
      currentCategory = btn.dataset.cat;
      catsEl.querySelectorAll('.ws-cat-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
      Sound.click();
      reset();
    });

    // Restart
    $('#wsRestart', root).addEventListener('click', reset);

    // =====================================================
    // Init
    // =====================================================
    reset();

    // =====================================================
    // Cleanup
    // =====================================================
    return () => {
      clearInterval(timerId);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
  }
});

Log.info('Word Search loaded');