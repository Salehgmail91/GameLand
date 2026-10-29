/* =========================================================
   GameLand — مول‌زنی (با Leaderboard + Confetti)
   ========================================================= */

GameLand.register('whack', {
  name:'مول‌زنی', emoji:'🔨',
  init(root){
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>امتیاز</span><b id="wScore">0</b></div>
        <div class="hud-box"><span>زمان</span><b id="wTime">30</b></div>
        <div class="hud-box"><span>رکورد</span><b id="wBest">0</b></div>
      </div>
      <div class="board-wrap">
        <div class="wack-grid" id="wGrid"></div>
        <div class="overlay hidden" id="wOver">
          <h3>⏰ زمان تموم شد!</h3>
          <p id="wText"></p>
          <button class="btn primary" id="wRestart">دوباره</button>
        </div>
      </div>
      <p class="hint">سریع روی مول‌ها بزن قبل از اینکه قایم بشن!</p>
    `;
    const grid = $('#wGrid', root);
    const scoreEl = $('#wScore', root), timeEl = $('#wTime', root), bestEl = $('#wBest', root);
    const over = $('#wOver', root), textEl = $('#wText', root);
    let best = +(store('gl_whack_best') || 0);
    bestEl.textContent = best;
    let holes = [], score = 0, time = 30, running = false;
    let popTimer = null, countTimer = null;
    const timers = [];

    function build(){
      grid.innerHTML = '';
      holes = [];
      for (let i = 0; i < 9; i++){
        const h = document.createElement('div');
        h.className = 'hole';
        h.addEventListener('click', () => {
          if (!running || !h.classList.contains('active')) return;
          h.classList.remove('active');
          h.textContent = '';
          score++;
          scoreEl.textContent = score;
          Sound.pop();
        });
        grid.appendChild(h);
        holes.push(h);
      }
    }

    function pop(){
      if (!running) return;
      const h = holes[rnd(9)];
      if (h.classList.contains('active')) return;
      h.classList.add('active');
      h.textContent = '🐹';
      const id = setTimeout(() => {
        h.classList.remove('active');
        h.textContent = '';
      }, 520 + Math.random() * 380);
      timers.push(id);
    }

    function start(){
      build();
      score = 0;
      time = 30;
      running = true;
      scoreEl.textContent = '0';
      timeEl.textContent = '30';
      over.classList.add('hidden');
      popTimer = setInterval(pop, 700);
      countTimer = setInterval(() => {
        time--;
        timeEl.textContent = time;
        if (time <= 0) end();
      }, 1000);
    }

    function end(){
      running = false;
      clearInterval(popTimer);
      clearInterval(countTimer);
      holes.forEach(h => { h.classList.remove('active'); h.textContent = ''; });
      if (score > best){
        best = score;
        store('gl_whack_best', best);
        bestEl.textContent = best;
      }
      textEl.textContent = `امتیاز: ${score}  •  رکورد: ${best}`;
      over.classList.remove('hidden');
      Sound.win();
      Confetti.start(80);
      PlayerStats.win();
      const rank = Leaderboard.submit('whack', score);
      if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
      Achievements.unlock('first_game');
    }

    $('#wRestart', root).addEventListener('click', start);
    start();
    return () => {
      running = false;
      clearInterval(popTimer);
      clearInterval(countTimer);
      timers.forEach(clearTimeout);
    };
  }
});