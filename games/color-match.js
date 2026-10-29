/* =========================================================
   GameLand v6 — Color Match (🎨 تطبیق رنگ)
   ========================================================= */

GameLand.register('color-match', {
  name: 'تطبیق رنگ',
  emoji: '🎨',
  desc: 'رنگ درست رو سریع پیدا کن!',
  tags: ['سرعتی', 'فکری', 'جدید'],
  color: '#a855f7',

  init(root) {
    const COLORS = [
      { name: 'قرمز',    hex: '#ef4444', rgb: [239, 68, 68] },
      { name: 'آبی',     hex: '#3b82f6', rgb: [59, 130, 246] },
      { name: 'سبز',     hex: '#22c55e', rgb: [34, 197, 94] },
      { name: 'زرد',     hex: '#eab308', rgb: [234, 179, 8] },
      { name: 'بنفش',    hex: '#a855f7', rgb: [168, 85, 247] },
      { name: 'نارنجی',  hex: '#f97316', rgb: [249, 115, 22] },
      { name: 'صورتی',   hex: '#ec4899', rgb: [236, 72, 153] },
      { name: 'فیروزه',  hex: '#06b6d4', rgb: [6, 182, 212] }
    ];

    const TOTAL_TIME = 30;

    let score = 0;
    let combo = 0;
    let bestCombo = 0;
    let timeLeft = TOTAL_TIME;
    let running = false;
    let currentColor = null;
    let currentWordColor = null;
    let timerId = null;
    let questionStart = 0;
    let correctCount = 0;
    let wrongCount = 0;

    let best = +(store('gl_color-match_best') || 0);

    // =====================================================
    // HTML
    // =====================================================
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>امتیاز</span><b id="cmScore">0</b></div>
        <div class="hud-box"><span>کمبو</span><b id="cmCombo">×1</b></div>
        <div class="hud-box"><span>زمان</span><b id="cmTime">${TOTAL_TIME}</b></div>
        <div class="hud-box"><span>رکورد</span><b id="cmBest">${best}</b></div>
      </div>

      <div class="color-match-wrap">
        <div class="cm-question">
          <p class="cm-hint-text">رنگِ این کلمه چیه؟ 👇</p>
          <div class="cm-word" id="cmWord">رنگ</div>
        </div>

        <div class="cm-answers" id="cmAnswers"></div>

        <div class="cm-combo-bar" id="cmComboBar">
          <div class="cm-combo-fill" id="cmComboFill"></div>
        </div>
      </div>

      <div class="overlay hidden" id="cmOver">
        <h3 id="cmTitle">⏰ زمان تموم شد!</h3>
        <div class="cm-stats-final" id="cmStatsFinal"></div>
        <button class="btn primary" id="cmRestart">دوباره بازی کن</button>
      </div>
    `;

    const scoreEl = $('#cmScore', root);
    const comboEl = $('#cmCombo', root);
    const timeEl = $('#cmTime', root);
    const bestEl = $('#cmBest', root);
    const wordEl = $('#cmWord', root);
    const answersEl = $('#cmAnswers', root);
    const over = $('#cmOver', root);
    const titleEl = $('#cmTitle', root);
    const statsFinalEl = $('#cmStatsFinal', root);
    const comboFill = $('#cmComboFill', root);

    // =====================================================
    // Generate question
    // =====================================================
    function generateQuestion() {
      // انتخاب کلمه (اسم رنگ)
      currentColor = choice(COLORS);

      // انتخاب رنگِ نمایشی (که ممکنه فرق داشته باشه - این تله‌ست)
      // با احتمال ۵۰٪ رنگ نمایش = رنگ کلمه (آسون)
      // با احتمال ۵۰٪ رنگ نمایش ≠ رنگ کلمه (سخت)
      if (Math.random() < 0.5) {
        currentWordColor = currentColor;
      } else {
        // انتخاب یه رنگ دیگه
        const others = COLORS.filter(c => c.name !== currentColor.name);
        currentWordColor = choice(others);
      }

      // نمایش کلمه
      wordEl.textContent = currentColor.name;
      wordEl.style.color = currentWordColor.hex;
      wordEl.style.textShadow = `0 0 30px ${currentWordColor.hex}80`;

      // انیمیشن pop
      if (typeof AnimPro !== 'undefined') {
        AnimPro.bounce(wordEl, 10);
      }

      // تولید ۴ گزینه (شامل جواب درست)
      // جواب درست: رنگِ کلمه (اسم) یعنی currentColor
      const answers = [currentColor];
      const usedNames = new Set([currentColor.name]);

      while (answers.length < 4) {
        const c = choice(COLORS);
        if (!usedNames.has(c.name)) {
          usedNames.add(c.name);
          answers.push(c);
        }
      }

      // شافل
      for (let i = answers.length - 1; i > 0; i--) {
        const j = rnd(i + 1);
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }

      // رندر
      answersEl.innerHTML = '';
      answers.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'cm-answer';
        btn.style.background = color.hex;
        btn.dataset.name = color.name;
        btn.style.setProperty('--c', color.hex);

        // برای دسترسی‌پذیری
        btn.setAttribute('aria-label', color.name);

        btn.addEventListener('click', () => handleAnswer(color));
        answersEl.appendChild(btn);
      });

      // ثبت زمان شروع سوال
      questionStart = performance.now();

      // 🆕 Stagger انیمیشن
      if (typeof AnimPro !== 'undefined') {
        AnimPro.staggerPro(answersEl, { delay: 40, duration: 400 });
      }
    }

    // =====================================================
    // Handle answer
    // =====================================================
    function handleAnswer(color) {
      if (!running) return;

      const elapsed = performance.now() - questionStart;
      const isCorrect = color.name === currentColor.name;

      if (isCorrect) {
        // ✅ درست
        correctCount++;
        combo++;
        bestCombo = Math.max(bestCombo, combo);

        // امتیاز: پایه ۱۰ + بونوس سرعت + بونوس کمبو
        const speedBonus = Math.max(0, Math.floor((1500 - elapsed) / 100));
        const comboBonus = Math.min(combo - 1, 10) * 2;
        const points = 10 + speedBonus + comboBonus;

        score += points;
        scoreEl.textContent = score;
        scoreEl.classList.add('bump');
        setTimeout(() => scoreEl.classList.remove('bump'), 400);

        comboEl.textContent = `×${combo}`;

        // 🆕 انیمیشن
        Sound.pop();
        if (typeof AnimPro !== 'undefined') {
          const activeBtn = answersEl.querySelector(`[data-name="${color.name}"]`);
          if (activeBtn) {
            AnimPro.bounce(activeBtn, 15);
            if (combo >= 5) {
              AnimPro.particleBurst(activeBtn, {
                count: 15,
                colors: [color.hex, '#22c55e']
              });
            }
          }
        }

        // Toast در کمبوهای بالا
        if (combo === 5) Toast.info('🔥 کمبو ۵!');
        if (combo === 10) Toast.success('⚡ کمبو ۱۰!');
        if (combo === 15) Toast.success('💎 کمبو ۱۵!');
        if (combo === 20) {
          Toast.success('👑 کمبو ۲۰!');
          if (typeof AnimPro !== 'undefined') {
            AnimPro.flash('#eab308', 200);
          }
        }

      } else {
        // ❌ غلط
        wrongCount++;
        combo = 0;
        comboEl.textContent = '×1';
        score = Math.max(0, score - 5);
        scoreEl.textContent = score;

        // 🆕 انیمیشن
        Sound.error();
        if (typeof AnimPro !== 'undefined') {
          const activeBtn = answersEl.querySelector(`[data-name="${color.name}"]`);
          if (activeBtn) AnimPro.shake(activeBtn, 8, 400);
          AnimPro.screenShake(3, 250);
          AnimPro.flash('#ef4444', 150);
        }
      }

      // آپدیت combo bar
      updateComboBar();

      // سوال بعدی
      generateQuestion();
    }

    // =====================================================
    // Combo bar
    // =====================================================
    function updateComboBar() {
      const percent = Math.min(100, (combo / 20) * 100);
      comboFill.style.width = percent + '%';

      if (combo >= 15) {
        comboFill.style.background = 'linear-gradient(90deg, #f59e0b, #eab308, #fbbf24)';
      } else if (combo >= 10) {
        comboFill.style.background = 'linear-gradient(90deg, #a855f7, #ec4899)';
      } else if (combo >= 5) {
        comboFill.style.background = 'linear-gradient(90deg, #22c55e, #06b6d4)';
      } else {
        comboFill.style.background = 'linear-gradient(90deg, var(--a1), var(--a2))';
      }
    }

    // =====================================================
    // Timer
    // =====================================================
    function startTimer() {
      clearInterval(timerId);
      timerId = setInterval(() => {
        timeLeft--;
        timeEl.textContent = timeLeft;

        // هشدار زمان
        if (timeLeft === 10) {
          Sound.tick();
          timeEl.style.color = '#f59e0b';
        }
        if (timeLeft === 5) {
          Sound.tick();
          timeEl.style.color = '#ef4444';
          if (typeof AnimPro !== 'undefined') {
            AnimPro.shake(timeEl, 3, 200);
          }
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
      timeLeft = TOTAL_TIME;
      running = true;
      correctCount = 0;
      wrongCount = 0;

      scoreEl.textContent = '0';
      comboEl.textContent = '×1';
      timeEl.textContent = TOTAL_TIME;
      timeEl.style.color = '';
      over.classList.add('hidden');

      updateComboBar();
      generateQuestion();
      startTimer();
    }

    // =====================================================
    // End
    // =====================================================
    function endGame() {
      running = false;
      clearInterval(timerId);

      // ذخیره رکورد
      const newRecord = score > best;
      if (newRecord) {
        best = score;
        store('gl_color-match_best', best);
        bestEl.textContent = best;
      }

      // آمار نهایی
      const total = correctCount + wrongCount;
      const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

      titleEl.textContent = newRecord ? '🏆 رکورد جدید!' : '⏰ زمان تموم شد!';

      statsFinalEl.innerHTML = `
        <div class="cm-final-stats">
          <div class="cm-stat-row">
            <span>🎯 امتیاز نهایی</span>
            <b>${score}</b>
          </div>
          <div class="cm-stat-row">
            <span>✅ پاسخ درست</span>
            <b style="color:#22c55e">${correctCount}</b>
          </div>
          <div class="cm-stat-row">
            <span>❌ پاسخ غلط</span>
            <b style="color:#ef4444">${wrongCount}</b>
          </div>
          <div class="cm-stat-row">
            <span>📊 دقت</span>
            <b>${accuracy}%</b>
          </div>
          <div class="cm-stat-row">
            <span>🔥 بهترین کمبو</span>
            <b style="color:#f59e0b">×${bestCombo}</b>
          </div>
        </div>
      `;

      over.classList.remove('hidden');

      // 🆕 انیمیشن پایان
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

      // ثبت رکورد
      PlayerStats.markGame('color-match');
      PlayerStats.reportScore('color-match', score);
      if (score > 0) {
        Leaderboard.submit('color-match', score);
      }
      if (newRecord && score > 100) {
        PlayerStats.win();
      }
      Achievements.check();
    }

    // =====================================================
    // Cleanup & Init
    // =====================================================
    $('#cmRestart', root).addEventListener('click', start);

    // شروع
    start();

    // =====================================================
    // Cleanup function
    // =====================================================
    return () => {
      running = false;
      clearInterval(timerId);
    };
  }
});

Log.info('Color Match loaded');