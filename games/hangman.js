/* =========================================================
   GameLand — حدس کلمه (Hangman فارسی)
   ========================================================= */

GameLand.register('hangman', {
  name:'حدس کلمه', emoji:'🔤',
  init(root){
    const WORDS = [
      { word:'برنامه', hint:'چیزی که با کد می‌سازیم' },
      { word:'کامپیوتر', hint:'وسیله‌ای برای کار و بازی' },
      { word:'کتاب', hint:'منبع دانش' },
      { word:'ماه', hint:'قمر زمین' },
      { word:'خورشید', hint:'ستاره‌ی روز' },
      { word:'دریا', hint:'جای آب زیاد' },
      { word:'کوه', hint:'بلندی طبیعی' },
      { word:'پرنده', hint:'جانوری با بال' },
      { word:'مدرسه', hint:'جای درس خوندن' },
      { word:'شکلات', hint:'خوشمزه و شیرین' },
      { word:'سیب', hint:'میوه‌ی سرخ' },
      { word:'پنجره', hint:'راه ورود نور' },
      { word:'زمین', hint:'سیاره‌ی ما' },
      { word:'آسمان', hint:'بالای سر ما' },
      { word:'باران', hint:'آب از آسمون' },
      { word:'گل', hint:'زیبا و خوشبو' },
      { word:'استاد', hint:'معلم بزرگ' },
      { word:'دوست', hint:'رفیق' },
      { word:'شهر', hint:'جای زندگی مردم' },
      { word:'رودخانه', hint:'آب جاری' }
    ];

    const MAX_WRONG = 6;
    const PERSIAN = 'آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی'.split('');

    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>اشتباه</span><b id="hmWrong">0/${MAX_WRONG}</b></div>
        <div class="hud-box"><span>برد</span><b id="hmWins">0</b></div>
        <div class="hud-box"><span>باخت</span><b id="hmLosses">0</b></div>
      </div>
      <div class="hm-wrap">
        <canvas id="hmCanvas" width="200" height="200"></canvas>
        <div class="hm-info">
          <div class="hm-hint" id="hmHint">راهنما: —</div>
          <div class="hm-word" id="hmWord"></div>
          <div class="hm-letters" id="hmLetters"></div>
        </div>
      </div>
      <div class="overlay hidden" id="hmOver" style="position:relative;margin-top:20px">
        <h3 id="hmTitle"></h3>
        <p id="hmText"></p>
        <button class="btn primary" id="hmRestart">بازی جدید</button>
      </div>
      <p class="hint">حروف رو حدس بزن — ۶ اشتباه = باخت</p>
    `;

    const cv = document.getElementById('hmCanvas');
    const ctx = cv.getContext('2d');
    const wrongEl = document.getElementById('hmWrong');
    const winsEl = document.getElementById('hmWins');
    const lossesEl = document.getElementById('hmLosses');
    const hintEl = document.getElementById('hmHint');
    const wordEl = document.getElementById('hmWord');
    const lettersEl = document.getElementById('hmLetters');
    const over = document.getElementById('hmOver');
    const titleEl = document.getElementById('hmTitle');
    const textEl = document.getElementById('hmText');

    let currentWord, hint, guessed, wrong, wins, losses, dead;

    wins = +(store('gl_hangman_wins') || 0);
    losses = +(store('gl_hangman_losses') || 0);
    winsEl.textContent = wins;
    lossesEl.textContent = losses;

    function reset(){
      const pick = WORDS[rnd(WORDS.length)];
      currentWord = pick.word;
      hint = pick.hint;
      guessed = new Set();
      wrong = 0;
      dead = false;
      over.classList.add('hidden');
      hintEl.textContent = 'راهنما: ' + hint;
      buildLetters();
      updateWord();
      updateHud();
      drawHangman();
    }

    function updateHud(){
      wrongEl.textContent = `${wrong}/${MAX_WRONG}`;
    }

    function buildLetters(){
      lettersEl.innerHTML = '';
      PERSIAN.forEach(l => {
        const b = document.createElement('button');
        b.className = 'hm-letter';
        b.textContent = l;
        b.addEventListener('click', () => guess(l, b));
        lettersEl.appendChild(b);
      });
    }

    function guess(letter, btn){
      if (dead || guessed.has(letter)) return;
      guessed.add(letter);

      if (currentWord.includes(letter)){
        btn.classList.add('correct');
        Sound.pop();
      } else {
        btn.classList.add('wrong');
        wrong++;
        Sound.lose();
        updateHud();
        drawHangman();
      }
      btn.disabled = true;

      updateWord();
      checkEnd();
    }

    function updateWord(){
      wordEl.innerHTML = currentWord.split('').map(ch => {
        if (guessed.has(ch)) return `<span class="hm-shown">${ch}</span>`;
        return `<span class="hm-blank">_</span>`;
      }).join('');
    }

    function checkEnd(){
      const allRevealed = currentWord.split('').every(ch => guessed.has(ch));

      if (allRevealed){
        dead = true;
        wins++;
        store('gl_hangman_wins', wins);
        winsEl.textContent = wins;
        titleEl.textContent = '🎉 بردی!';
        textEl.textContent = `کلمه: ${currentWord}`;
        over.classList.remove('hidden');
        Confetti.start(60);
        Sound.win();
        PlayerStats.win();
        Achievements.unlock('first_game');
      } else if (wrong >= MAX_WRONG){
        dead = true;
        losses++;
        store('gl_hangman_losses', losses);
        lossesEl.textContent = losses;
        titleEl.textContent = '💀 باختی!';
        textEl.textContent = `کلمه درست: ${currentWord}`;
        over.classList.remove('hidden');
        Sound.lose();
        PlayerStats.lose();
      }
    }

    /* ========== رسم آدمک ========== */
    function drawHangman(){
      ctx.fillStyle = '#0b0b18';
      ctx.fillRect(0, 0, 200, 200);

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      // چوبه دار
      ctx.beginPath();
      ctx.moveTo(20, 180); ctx.lineTo(120, 180); // کف
      ctx.moveTo(60, 180); ctx.lineTo(60, 30);   // ستون
      ctx.moveTo(60, 30);  ctx.lineTo(140, 30);  // بالا
      ctx.moveTo(140, 30); ctx.lineTo(140, 50);  // آویزون
      ctx.stroke();

      ctx.strokeStyle = '#f8fafc';

      // 0: سر
      if (wrong >= 1){
        ctx.beginPath();
        ctx.arc(140, 70, 20, 0, Math.PI * 2);
        ctx.stroke();
        // چشم‌ها
        ctx.beginPath();
        ctx.arc(134, 66, 2.5, 0, Math.PI * 2);
        ctx.arc(146, 66, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        // دهن
        if (wrong >= 6){
          // دهن ناراحت
          ctx.beginPath();
          ctx.arc(140, 80, 7, 0, Math.PI, true);
          ctx.stroke();
        }
      }
      // 2: بدن
      if (wrong >= 2){
        ctx.beginPath();
        ctx.moveTo(140, 90); ctx.lineTo(140, 130);
        ctx.stroke();
      }
      // 3: دست چپ
      if (wrong >= 3){
        ctx.beginPath();
        ctx.moveTo(140, 100); ctx.lineTo(115, 115);
        ctx.stroke();
      }
      // 4: دست راست
      if (wrong >= 4){
        ctx.beginPath();
        ctx.moveTo(140, 100); ctx.lineTo(165, 115);
        ctx.stroke();
      }
      // 5: پای چپ
      if (wrong >= 5){
        ctx.beginPath();
        ctx.moveTo(140, 130); ctx.lineTo(120, 160);
        ctx.stroke();
      }
      // 6: پای راست
      if (wrong >= 6){
        ctx.beginPath();
        ctx.moveTo(140, 130); ctx.lineTo(160, 160);
        ctx.stroke();
      }
    }

    document.getElementById('hmRestart').addEventListener('click', reset);
    reset();

    return () => {
      dead = true;
    };
  }
});