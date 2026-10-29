/* =========================================================
   GameLand v6 — Yahtzee (🎲 تاس امتیازی)
   ========================================================= */

GameLand.register('yahtzee', {
  name: 'تاس امتیازی',
  emoji: '🎲',
  desc: 'تاس بریز و امتیاز جمع کن!',
  tags: ['شانسی', 'فکری', 'جدید'],
  color: '#ef4444',

  init(root) {
    const DICE_COUNT = 5;
    const MAX_ROLLS = 3;

    // دسته‌های امتیازدهی
    const SCORE_CATEGORIES = [
      { id: 'ones',      name: 'یک‌ها',     icon: '1️⃣', desc: 'جمع تاس‌های ۱',   calc: (dice) => sumOf(dice, 1) },
      { id: 'twos',      name: 'دوها',      icon: '2️⃣', desc: 'جمع تاس‌های ۲',   calc: (dice) => sumOf(dice, 2) },
      { id: 'threes',    name: 'سه‌ها',     icon: '3️⃣', desc: 'جمع تاس‌های ۳',   calc: (dice) => sumOf(dice, 3) },
      { id: 'fours',     name: 'چهارها',    icon: '4️⃣', desc: 'جمع تاس‌های ۴',   calc: (dice) => sumOf(dice, 4) },
      { id: 'fives',     name: 'پنج‌ها',    icon: '5️⃣', desc: 'جمع تاس‌های ۵',   calc: (dice) => sumOf(dice, 5) },
      { id: 'sixes',     name: 'شش‌ها',     icon: '6️⃣', desc: 'جمع تاس‌های ۶',   calc: (dice) => sumOf(dice, 6) },
      { id: 'threeKind', name: 'سه‌تایی',   icon: '🎯', desc: 'جمع همه تاس‌ها',   calc: (dice) => hasNOfAKind(dice, 3) ? dice.reduce((a, b) => a + b, 0) : 0 },
      { id: 'fourKind',  name: 'چهارتایی',  icon: '🔥', desc: 'جمع همه تاس‌ها',   calc: (dice) => hasNOfAKind(dice, 4) ? dice.reduce((a, b) => a + b, 0) : 0 },
      { id: 'fullHouse', name: 'فول‌هاوس',  icon: '🏠', desc: '۳ + ۲ = ۲۵',       calc: (dice) => hasFullHouse(dice) ? 25 : 0 },
      { id: 'smallStr',  name: 'کوچک',      icon: '📏', desc: '۴ تایی = ۳۰',      calc: (dice) => hasStraight(dice, 4) ? 30 : 0 },
      { id: 'largeStr',  name: 'بزرگ',      icon: '📐', desc: '۵ تایی = ۴۰',      calc: (dice) => hasStraight(dice, 5) ? 40 : 0 },
      { id: 'yahtzee',   name: 'یاhtzee!',  icon: '💎', desc: '۵ تایی = ۵۰',      calc: (dice) => hasNOfAKind(dice, 5) ? 50 : 0 },
      { id: 'chance',    name: 'شانس',      icon: '🎰', desc: 'جمع همه',          calc: (dice) => dice.reduce((a, b) => a + b, 0) }
    ];

    let dice = [1, 1, 1, 1, 1];
    let locked = [false, false, false, false, false];
    let rollsLeft = MAX_ROLLS;
    let scores = {}; // id → score
    let rolling = false;
    let gameOver = false;
    let yahtzeeBonus = 0;
    let startTime = Date.now();

    // رکورد
    let best = +(store('gl_yahtzee_best') || 0);

    // =====================================================
    // Helpers
    // =====================================================
    function sumOf(dice, num) {
      return dice.filter(d => d === num).reduce((a, b) => a + b, 0);
    }

    function hasNOfAKind(dice, n) {
      const counts = {};
      dice.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
      return Object.values(counts).some(c => c >= n);
    }

    function hasFullHouse(dice) {
      const counts = {};
      dice.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
      const values = Object.values(counts).sort();
      return values.length === 2 && values[0] === 2 && values[1] === 3;
    }

    function hasStraight(dice, len) {
      const unique = [...new Set(dice)].sort((a, b) => a - b);
      let streak = 1;
      let maxStreak = 1;
      for (let i = 1; i < unique.length; i++) {
        if (unique[i] === unique[i - 1] + 1) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 1;
        }
      }
      return maxStreak >= len;
    }

    // =====================================================
    // HTML
    // =====================================================
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>امتیاز</span><b id="yzTotal">0</b></div>
        <div class="hud-box"><span>پرتاب</span><b id="yzRolls">3</b></div>
        <div class="hud-box"><span>رکورد</span><b id="yzBest">${best}</b></div>
      </div>

      <div class="yz-dice-area">
        <div class="yz-dice" id="yzDice">
          ${Array.from({ length: DICE_COUNT }, (_, i) => `
            <div class="yz-die" data-index="${i}">
              <div class="yz-die-face" data-face="1">⚀</div>
            </div>
          `).join('')}
        </div>

        <button class="btn primary yz-roll-btn" id="yzRoll">
          🎲 پرتاب تاس (۳)
        </button>
      </div>

      <div class="yz-scores" id="yzScores">
        ${SCORE_CATEGORIES.map(cat => `
          <button class="yz-score-btn" data-id="${cat.id}" disabled>
            <div class="yz-score-head">
              <span class="yz-score-icon">${cat.icon}</span>
              <span class="yz-score-name">${cat.name}</span>
            </div>
            <div class="yz-score-desc">${cat.desc}</div>
            <div class="yz-score-value" data-value="${cat.id}">—</div>
          </button>
        `).join('')}
      </div>

      <div class="overlay hidden" id="yzOver">
        <h3 id="yzTitle">🎉 بازی تموم شد!</h3>
        <div class="rg-final-stats" id="yzFinalStats"></div>
        <button class="btn primary" id="yzRestart">دوباره بازی کن</button>
      </div>
    `;

    const totalEl = $('#yzTotal', root);
    const rollsEl = $('#yzRolls', root);
    const bestEl = $('#yzBest', root);
    const diceEl = $('#yzDice', root);
    const rollBtn = $('#yzRoll', root);
    const scoresEl = $('#yzScores', root);
    const over = $('#yzOver', root);
    const titleEl = $('#yzTitle', root);
    const finalStatsEl = $('#yzFinalStats', root);

    // فیس‌های تاس
    const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    // =====================================================
    // Render dice
    // =====================================================
    function renderDice() {
      dice.forEach((value, i) => {
        const el = diceEl.querySelector(`[data-index="${i}"]`);
        if (!el) return;
        const face = el.querySelector('.yz-die-face');
        face.textContent = DICE_FACES[value];
        el.classList.toggle('locked', locked[i]);
      });
    }

    // =====================================================
    // Render scores
    // =====================================================
    function renderScores() {
      let total = 0;

      SCORE_CATEGORIES.forEach(cat => {
        const btn = scoresEl.querySelector(`[data-id="${cat.id}"]`);
        if (!btn) return;

        const valEl = btn.querySelector('[data-value]');
        const value = scores[cat.id];

        if (value !== undefined && value !== null) {
          // قبلاً بازی شده
          btn.classList.add('used');
          btn.disabled = true;
          valEl.textContent = value;
          total += value;
        } else {
          // بازی نشده
          btn.classList.remove('used');
          // اگه پرتاب شده باشه، می‌تونه انتخاب کنه
          btn.disabled = rollsLeft === MAX_ROLLS || rolling || gameOver;
          // پیش‌نمایش امتیاز
          const preview = cat.calc(dice);
          valEl.textContent = preview > 0 ? preview : '—';
          valEl.classList.toggle('preview', preview > 0);
        }
      });

      totalEl.textContent = total;
      return total;
    }

    // =====================================================
    // Roll dice
    // =====================================================
    function rollDice() {
      if (rolling || gameOver || rollsLeft <= 0) return;

      rolling = true;
      rollBtn.disabled = true;

      Sound.click();

      // انیمیشن چرخش
      const duration = 800;
      const start = performance.now();

      function frame(now) {
        const elapsed = now - start;
        const progress = elapsed / duration;

        // تغییر تصادفی
        if (progress < 0.85) {
          dice.forEach((_, i) => {
            if (!locked[i]) {
              const el = diceEl.querySelector(`[data-index="${i}"]`);
              if (el) {
                const face = el.querySelector('.yz-die-face');
                face.textContent = DICE_FACES[rnd(6) + 1];
              }
            }
          });
          requestAnimationFrame(frame);
        } else {
          // نتیجه نهایی
          dice.forEach((_, i) => {
            if (!locked[i]) {
              dice[i] = rnd(6) + 1;
            }
          });
          renderDice();
          finishRoll();
        }
      }

      requestAnimationFrame(frame);
    }

    function finishRoll() {
      rolling = false;
      rollsLeft--;
      rollsEl.textContent = rollsLeft;

      // چک Yahtzee
      if (hasNOfAKind(dice, 5) && scores.yahtzee !== undefined) {
        yahtzeeBonus++;
        Coins.add(20, '🎉 Yahtzee Bonus');
        Toast.success('💎 Yahtzee دیگه! +۲۰ 🪙');
        if (typeof AnimPro !== 'undefined') {
          AnimPro.flash('#eab308', 300);
          AnimPro.confettiPro('stars', { count: 30 });
        }
      }

      // آپدیت دکمه‌ها
      updateScoreButtons();

      // چک پایان
      if (rollsLeft === 0) {
        rollBtn.disabled = true;
        rollBtn.textContent = 'دسته رو انتخاب کن 👇';
      } else {
        rollBtn.disabled = false;
        rollBtn.textContent = `🎲 پرتاب تاس (${rollsLeft})`;
      }
    }

    function updateScoreButtons() {
      SCORE_CATEGORIES.forEach(cat => {
        const btn = scoresEl.querySelector(`[data-id="${cat.id}"]`);
        if (!btn || btn.classList.contains('used')) return;

        const preview = cat.calc(dice);
        const valEl = btn.querySelector('[data-value]');

        btn.disabled = rolling || rollsLeft === MAX_ROLLS || gameOver;

        if (preview > 0) {
          valEl.textContent = preview;
          valEl.classList.add('preview');
          btn.classList.add('available');
        } else {
          valEl.textContent = '—';
          valEl.classList.remove('preview');
          btn.classList.remove('available');
        }
      });
    }

    // =====================================================
    // Pick category
    // =====================================================
    function pickCategory(id) {
      if (rolling || gameOver) return;
      if (rollsLeft === MAX_ROLLS) return; // باید حداقل ۱ بار بندازه
      if (scores[id] !== undefined) return;

      const cat = SCORE_CATEGORIES.find(c => c.id === id);
      if (!cat) return;

      const value = cat.calc(dice);
      scores[id] = value;

      Sound.pop();
      if (value > 0) {
        if (typeof AnimPro !== 'undefined') {
          const btn = scoresEl.querySelector(`[data-id="${id}"]`);
          if (btn) {
            AnimPro.particleBurst(btn, {
              count: 15,
              colors: ['#22c55e', '#00e5ff']
            });
          }
        }
      }

      // ریست برای دور بعد
      locked = [false, false, false, false, false];
      rollsLeft = MAX_ROLLS;
      rollsEl.textContent = rollsLeft;

      renderDice();
      renderScores();
      updateRollButton();

      // چک پایان بازی
      const played = Object.keys(scores).length;
      if (played === SCORE_CATEGORIES.length) {
        endGame();
      }
    }

    function updateRollButton() {
      if (gameOver) {
        rollBtn.disabled = true;
        return;
      }
      rollBtn.disabled = false;
      rollBtn.textContent = `🎲 پرتاب تاس (${rollsLeft})`;
    }

    // =====================================================
    // End game
    // =====================================================
    function endGame() {
      gameOver = true;

      const total = SCORE_CATEGORIES.reduce((sum, cat) => sum + (scores[cat.id] || 0), 0);

      const newRecord = total > best;
      if (newRecord) {
        best = total;
        store('gl_yahtzee_best', best);
        bestEl.textContent = best;
      }

      titleEl.textContent = newRecord ? '🏆 رکورد جدید!' : '🎉 بازی تموم شد!';

      finalStatsEl.innerHTML = `
        <div class="rg-final-stats">
          <div class="rg-stat-row">
            <span>🎯 امتیاز نهایی</span>
            <b>${total}</b>
          </div>
          <div class="rg-stat-row">
            <span>🎲 تعداد دسته‌ها</span>
            <b>${SCORE_CATEGORIES.length}</b>
          </div>
          <div class="rg-stat-row">
            <span>💎 Yahtzee Bonus</span>
            <b>${yahtzeeBonus}</b>
          </div>
        </div>
      `;

      over.classList.remove('hidden');

      if (newRecord) {
        Sound.win();
        if (typeof AnimPro !== 'undefined') {
          AnimPro.flash('#eab308', 400);
          AnimPro.confettiPro('stars', { count: 50 });
          AnimPro.confettiPro('coins', { count: 20 });
        }
        if (typeof Confetti !== 'undefined') Confetti.burst(100);
      } else {
        Sound.click();
      }

      // ثبت
      PlayerStats.markGame('yahtzee');
      PlayerStats.reportScore('yahtzee', total);
      Leaderboard.submit('yahtzee', total);
      if (newRecord && total > 200) PlayerStats.win();
      Achievements.check();
    }

    // =====================================================
    // Reset
    // =====================================================
    function reset() {
      dice = [1, 1, 1, 1, 1];
      locked = [false, false, false, false, false];
      rollsLeft = MAX_ROLLS;
      scores = {};
      rolling = false;
      gameOver = false;
      yahtzeeBonus = 0;

      rollsEl.textContent = rollsLeft;
      over.classList.add('hidden');
      renderDice();
      renderScores();
      updateRollButton();
    }

    // =====================================================
    // Event Listeners
    // =====================================================
    // Roll
    rollBtn.addEventListener('click', rollDice);

    // Lock/unlock dice
    diceEl.addEventListener('click', e => {
      const die = e.target.closest('.yz-die');
      if (!die || rolling || gameOver) return;

      const i = +die.dataset.index;
      locked[i] = !locked[i];
      die.classList.toggle('locked', locked[i]);

      Sound.tick();
      if (typeof AnimPro !== 'undefined') {
        AnimPro.bounce(die, 5);
      }
    });

    // Pick category
    scoresEl.addEventListener('click', e => {
      const btn = e.target.closest('.yz-score-btn');
      if (!btn || btn.disabled) return;
      pickCategory(btn.dataset.id);
    });

    // Restart
    $('#yzRestart', root).addEventListener('click', reset);

    // Space = Roll
    const onKey = e => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (!rollBtn.disabled) rollDice();
      }
    };
    window.addEventListener('keydown', onKey);

    // =====================================================
    // Init
    // =====================================================
    reset();

    // =====================================================
    // Cleanup
    // =====================================================
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }
});

Log.info('Yahtzee loaded');