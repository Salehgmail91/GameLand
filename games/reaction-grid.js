/* =========================================================
   GameLand v6 — Reaction Grid (⚡ شبکه واکنش)
   ========================================================= */

GameLand.register('reaction-grid', {
  name: 'شبکه واکنش',
  emoji: '⚡',
  desc: 'سریع‌ترین انگشت رو داری؟ ثابت کن!',
  tags: ['سرعتی', 'جدید'],
  color: '#eab308',

  init(root) {
    const GRID_SIZE = 4; // 4x4 = 16 خانه
    const CELLS = GRID_SIZE * GRID_SIZE;
    const ROUND_TIME = 30;

    let score = 0;
    let combo = 0;
    let bestCombo = 0;
    let timeLeft = ROUND_TIME;
    let running = false;
    let activeCell = -1;
    let roundTimer = null;
    let globalTimer = null;
    let currentTimeout = null;
    let hits = 0;
    let misses = 0;
    let activeSince = 0;
    let reactionTimes = [];

    let best = +(store('gl_reaction-grid_best') || 0);

    // =====================================================
    // HTML
    // =====================================================
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>امتیاز</span><b id="rgScore">0</b></div>
        <div class="hud-box"><span>کمبو</span><b id="rgCombo">×1</b></div>
        <div class="hud-box"><span>زمان</span><b id="rgTime">${ROUND_TIME}</b></div>
        <div class="hud-box"><span>رکورد</span><b id="rgBest">${best}</b></div>
      </div>

      <div class="reaction-grid-wrap">
        <div class="rg-grid" id="rgGrid"></div>
      </div>

      <div class="rg-accuracy">
        <div class="rg-acc-item">
          <span class="rg-acc-icon">✅</span>
          <span class="rg-acc-label">موفق</span>
          <b id="rgHits">0</b>
        </div>
        <div class="rg-acc-item">
          <span class="rg-acc-icon">❌</span>
          <span class="rg-acc-label">خطا</span>
          <b id="rgMisses">0</b>
        </div>
        <div class="rg-acc-item">
          <span class="rg-acc-icon">⚡</span>
          <span class="rg-acc-label">میانگین</span>
          <b id="rgAvg">—</b>
        </div>
      </div>

      <div class="overlay hidden" id="rgOver">
        <h3 id="rgTitle">⏰ زمان تموم شد!</h3>
        <div class="rg-final-stats" id="rgFinalStats"></div>
        <button class="btn primary" id="rgRestart">دوباره بازی کن</button>
      </div>
    `;

    const scoreEl = $('#rgScore', root);
    const comboEl = $('#rgCombo', root);
    const timeEl = $('#rgTime', root);
    const bestEl = $('#rgBest', root);
    const gridEl = $('#rgGrid', root);
    const hitsEl = $('#rgHits', root);
    const missesEl = $('#rgMisses', root);
    const avgEl = $('#rgAvg', root);
    const over = $('#rgOver', root);
    const titleEl = $('#rgTitle', root);
    const finalStatsEl = $('#rgFinalStats', root);

    // =====================================================
    // Build grid cells
    // =====================================================
    function buildGrid() {
      gridEl.innerHTML = '';
      for (let i = 0; i < CELLS; i++) {
        const cell = document.createElement('button');
        cell.className = 'rg-cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        gridEl.appendChild(cell);
      }
    }

    // =====================================================
    // Show next active cell
    // =====================================================
    function showNext() {
      if (!running) return;

      // حذف قبلی
      if (activeCell >= 0) {
        const prev = gridEl.querySelector(`[data-index="${activeCell}"]`);
        if (prev) {
          prev.classList.remove('active');
          if (!prev.classList.contains('hit') && !prev.classList.contains('miss')) {
            // این miss هست (کاربر پاسخ نداد)
            registerMiss(prev);
          }
        }
      }

      // انتخاب خانه جدید (غیر تکراری)
      let newCell;
      do {
        newCell = rnd(CELLS);
      } while (newCell === activeCell);

      activeCell = newCell;
      activeSince = performance.now();

      const cell = gridEl.querySelector(`[data-index="${activeCell}"]`);
      if (!cell) return;

      cell.classList.remove('hit', 'miss');
      cell.classList.add('active');

      // 🆕 انیمیشن
      if (typeof AnimPro !== 'undefined') {
        AnimPro.bounce(cell, 6);
      }

      // زمان باقی‌مونده برای پاسخ (کم‌کم کم می‌شه)
      const responseTime = Math.max(500, 1400 - Math.floor(score / 15) * 50);

      currentTimeout = setTimeout(() => {
        // کاربر پاسخ نداد
        if (running && cell.classList.contains('active')) {
          cell.classList.remove('active');
          registerMiss(cell);
          showNext();
        }
      }, responseTime);
    }

    // =====================================================
    // Handle click
    // =====================================================
    function handleCellClick(index) {
      if (!running) return;

      const cell = gridEl.querySelector(`[data-index="${index}"]`);
      if (!cell) return;

      // اگه روی خانه فعال کلیک شد
      if (index === activeCell && cell.classList.contains('active')) {
        clearTimeout(currentTimeout);

        const elapsed = performance.now() - activeSince;
        reactionTimes.push(elapsed);

        cell.classList.remove('active');
        cell.classList.add('hit');

        hits++;
        hitsEl.textContent = hits;

        // محاسبه امتیاز
        combo++;
        bestCombo = Math.max(bestCombo, combo);

        // بونوس سرعت: هرچی سریع‌تر، بیشتر
        const speedBonus = Math.max(1, Math.floor((1200 - elapsed) / 100));
        const comboBonus = Math.min(combo - 1, 15);
        const points = 5 + speedBonus + comboBonus;

        score += points;
        scoreEl.textContent = score;
        scoreEl.classList.add('bump');
        setTimeout(() => scoreEl.classList.remove('bump'), 400);

        comboEl.textContent = `×${combo}`;

        // 🆕 انیمیشن
        Sound.pop();
        if (typeof AnimPro !== 'undefined') {
          AnimPro.particleBurst(cell, {
            count: 8 + Math.min(combo, 15),
            colors: combo >= 10
              ? ['#eab308', '#f59e0b', '#fbbf24']
              : ['#00e5ff', '#7c5cff']
          });
          if (combo >= 15) {
            AnimPro.flash('#eab308', 150);
          }
        }

        // Toast در کمبوهای بالا
        if (combo === 10) Toast.info('🔥 کمبو ۱۰!');
        if (combo === 20) Toast.success('⚡ کمبو ۲۰!');
        if (combo === 30) {
          Toast.success('👑 کمبو ۳۰!');
          if (typeof AnimPro !== 'undefined') {
            AnimPro.flash('#eab308', 250);
            AnimPro.confettiPro('stars', { count: 20 });
          }
        }

        // به روز رسانی میانگین
        updateAverage();

        // سوال بعدی
        setTimeout(showNext, 150);

      } else {
        // کلیک اشتباه
        cell.classList.add('miss');
        setTimeout(() => cell.classList.remove('miss'), 300);
        registerMiss(cell, true);
      }
    }

    // =====================================================
    // Register miss
    // =====================================================
    function registerMiss(cell, isWrongClick = false) {
      misses++;
      missesEl.textContent = misses;

      combo = 0;
      comboEl.textContent = '×1';

      if (score > 0) {
        score = Math.max(0, score - 2);
        scoreEl.textContent = score;
      }

      // 🆕 انیمیشن
      if (typeof AnimPro !== 'undefined') {
        AnimPro.shake(cell, 5, 300);
        if (isWrongClick) {
          AnimPro.screenShake(2, 200);
        }
      }
      Sound.error();
    }

    // =====================================================
    // Update average
    // =====================================================
    function updateAverage() {
      if (reactionTimes.length === 0) {
        avgEl.textContent = '—';
        return;
      }
      const avg = Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
      avgEl.textContent = avg + 'ms';
    }

    // =====================================================
    // Global timer
    // =====================================================
    function startGlobalTimer() {
      clearInterval(globalTimer);
      globalTimer = setInterval(() => {
        timeLeft--;
        timeEl.textContent = timeLeft;

        if (timeLeft === 10) {
          timeEl.style.color = '#f59e0b';
          Sound.tick();
        }
        if (timeLeft === 5) {
          timeEl.style.color = '#ef4444';
          Sound.tick();
        }

        if (timeLeft <= 0) {
          endGame();
        }
      }, 1000);
    }

    // =====================================================
    // Start
    // =====================================================
    function start() {
      score = 0;
      combo = 0;
      bestCombo = 0;
      timeLeft = ROUND_TIME;
      running = true;
      activeCell = -1;
      hits = 0;
      misses = 0;
      reactionTimes = [];

      scoreEl.textContent = '0';
      comboEl.textContent = '×1';
      timeEl.textContent = ROUND_TIME;
      timeEl.style.color = '';
      hitsEl.textContent = '0';
      missesEl.textContent = '0';
      avgEl.textContent = '—';
      over.classList.add('hidden');

      // پاک کردن همه cell ها
      gridEl.querySelectorAll('.rg-cell').forEach(c => {
        c.classList.remove('active', 'hit', 'miss');
      });

      startGlobalTimer();
      setTimeout(showNext, 500);
    }

    // =====================================================
    // End
    // =====================================================
    function endGame() {
      running = false;
      clearInterval(globalTimer);
      clearTimeout(currentTimeout);

      // پاک کردن خانه فعال
      gridEl.querySelectorAll('.rg-cell').forEach(c => {
        c.classList.remove('active', 'hit', 'miss');
      });

      const newRecord = score > best;
      if (newRecord) {
        best = score;
        store('gl_reaction-grid_best', best);
        bestEl.textContent = best;
      }

      const total = hits + misses;
      const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0;
      const avgTime = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;

      titleEl.textContent = newRecord ? '🏆 رکورد جدید!' : '⏰ زمان تموم شد!';

      finalStatsEl.innerHTML = `
        <div class="rg-final-stats">
          <div class="rg-stat-row">
            <span>🎯 امتیاز نهایی</span>
            <b>${score}</b>
          </div>
          <div class="rg-stat-row">
            <span>✅ موفق</span>
            <b style="color:#22c55e">${hits}</b>
          </div>
          <div class="rg-stat-row">
            <span>❌ خطا</span>
            <b style="color:#ef4444">${misses}</b>
          </div>
          <div class="rg-stat-row">
            <span>📊 دقت</span>
            <b>${accuracy}%</b>
          </div>
          <div class="rg-stat-row">
            <span>⚡ میانگین واکنش</span>
            <b>${avgTime}ms</b>
          </div>
          <div class="rg-stat-row">
            <span>🔥 بهترین کمبو</span>
            <b style="color:#f59e0b">×${bestCombo}</b>
          </div>
        </div>
      `;

      over.classList.remove('hidden');

      // 🆕 انیمیشن
      if (newRecord) {
        Sound.win();
        if (typeof AnimPro !== 'undefined') {
          AnimPro.flash('#eab308', 400);
          AnimPro.confettiPro('stars', { count: 40 });
          AnimPro.confettiPro('coins', { count: 20 });
        }
        if (typeof Confetti !== 'undefined') Confetti.burst(100);
      } else {
        Sound.lose();
        if (typeof AnimPro !== 'undefined') {
          AnimPro.vignettePulse('rgba(0, 0, 0, 0.5)', 800);
        }
      }

      // ثبت
      PlayerStats.markGame('reaction-grid');
      PlayerStats.reportScore('reaction-grid', score);
      if (score > 0) Leaderboard.submit('reaction-grid', score);
      if (newRecord && score > 100) PlayerStats.win();
      Achievements.check();
    }

    // =====================================================
    // Init
    // =====================================================
    buildGrid();
    $('#rgRestart', root).addEventListener('click', start);
    start();

    // =====================================================
    // Cleanup
    // =====================================================
    return () => {
      running = false;
      clearInterval(globalTimer);
      clearTimeout(currentTimeout);
    };
  }
});

Log.info('Reaction Grid loaded');