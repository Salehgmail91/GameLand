/* =========================================================
   GameLand — سایمون (با Leaderboard + Confetti)
   ========================================================= */

GameLand.register('simon', {
  name:'سایمون', emoji:'🎨',
  init(root){
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>مرحله</span><b id="smLevel">0</b></div>
        <div class="hud-box"><span>رکورد</span><b id="smBest">0</b></div>
      </div>
      <div class="simon-grid" id="smGrid">
        <div class="simon-btn green" data-i="0"></div>
        <div class="simon-btn red" data-i="1"></div>
        <div class="simon-btn yellow" data-i="2"></div>
        <div class="simon-btn blue" data-i="3"></div>
      </div>
      <p class="hint" id="smMsg">برای شروع دکمه زیر رو بزن</p>
      <button class="btn primary" id="smStart" style="display:block;margin:14px auto 0">شروع بازی</button>
    `;

    const gridEl = document.getElementById('smGrid');
    const levelEl = document.getElementById('smLevel');
    const bestEl = document.getElementById('smBest');
    const msg = document.getElementById('smMsg');
    const startBtn = document.getElementById('smStart');
    const btns = [...gridEl.querySelectorAll('.simon-btn')];

    const FREQS = [261.63, 329.63, 392.00, 523.25];

    let sequence = [];
    let userIdx = 0;
    let level = 0;
    let best = +(store('gl_simon_best') || 0);
    let playing = false;
    let dead = false;
    let timers = [];

    bestEl.textContent = best;

    function flash(i, duration = 400){
      btns[i].classList.add('active');
      Sound.play(FREQS[i], 0.2, 'sine', 0.1);
      const id = setTimeout(() => btns[i].classList.remove('active'), duration);
      timers.push(id);
    }

    function playSequence(){
      playing = true;
      msg.textContent = 'ببین و یاد بگیر...';
      let i = 0;
      const showNext = () => {
        if (i >= sequence.length){
          playing = false;
          userIdx = 0;
          msg.textContent = 'حالا نوبت توئه!';
          return;
        }
        flash(sequence[i]);
        i++;
        const id = setTimeout(showNext, 650);
        timers.push(id);
      };
      showNext();
    }

    function nextLevel(){
      level++;
      levelEl.textContent = level;
      sequence.push(Math.floor(Math.random() * 4));
      const id = setTimeout(playSequence, 800);
      timers.push(id);
    }

    function startGame(){
      timers.forEach(clearTimeout);
      timers = [];
      sequence = [];
      level = 0;
      dead = false;
      userIdx = 0;
      levelEl.textContent = '0';
      startBtn.textContent = 'شروع مجدد';
      nextLevel();
    }

    function clickBtn(i){
      if (playing || dead) return;
      if (sequence.length === 0) return;

      flash(i, 250);

      if (sequence[userIdx] === i){
        userIdx++;
        if (userIdx === sequence.length){
          if (level > best){
            best = level;
            store('gl_simon_best', best);
            bestEl.textContent = best;
          }
          if (level > 0 && level % 5 === 0){
            Toast.success(`🎉 مرحله ${level}!`);
            Confetti.start(40);
            Achievements.unlock('first_game');
          }
          playing = true;
          msg.textContent = '🎉 عالی! مرحله بعد...';
          const id = setTimeout(() => {
            playing = false;
            nextLevel();
          }, 900);
          timers.push(id);
        }
      } else {
        dead = true;
        msg.textContent = `💀 باختی! به مرحله ${level} رسیدی`;
        Sound.lose();
        PlayerStats.lose();
        const score = level * 100;
        const rank = Leaderboard.submit('simon', score);
        if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
      }
    }

    btns.forEach(b => {
      b.addEventListener('click', () => clickBtn(+b.dataset.i));
    });

    startBtn.addEventListener('click', startGame);

    return () => timers.forEach(clearTimeout);
  }
});