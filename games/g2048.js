/* =========================================================
   GameLand — بازی ۲۰۴۸ (با Leaderboard + Confetti)
   ========================================================= */

GameLand.register('g2048', {
  name:'۲۰۴۸', emoji:'🔢',
  init(root){
    const COLORS = {
      2:'#2c2c48', 4:'#3b3b6b', 8:'#4f46e5', 16:'#7c3aed',
      32:'#a21caf', 64:'#db2777', 128:'#e11d48', 256:'#f59e0b',
      512:'#f97316', 1024:'#eab308', 2048:'#22c55e'
    };

    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>امتیاز</span><b id="gScore">0</b></div>
        <div class="hud-box"><span>رکورد</span><b id="gBest">0</b></div>
      </div>
      <div class="board-wrap">
        <div class="g2048" id="gBoard"></div>
        <div class="overlay hidden" id="gOver">
          <h3 id="gOverTitle"></h3>
          <p id="gOverText"></p>
          <button class="btn primary" id="gRestart">دوباره</button>
        </div>
      </div>
      <p class="hint">با کلیدهای جهت‌دار یا کشیدن انگشت حرکت کن</p>
    `;

    const boardEl = $('#gBoard', root);
    const scoreEl = $('#gScore', root), bestEl = $('#gBest', root);
    const over = $('#gOver', root), oTitle = $('#gOverTitle', root), oText = $('#gOverText', root);

    let cells = [], score = 0, best = +(store('gl_2048_best') || 0);
    let won = false, dead = false;
    bestEl.textContent = best;

    function addRandom(){
      const empty = [];
      cells.forEach((v, i) => { if (!v) empty.push(i); });
      if (!empty.length) return;
      cells[empty[rnd(empty.length)]] = Math.random() < 0.9 ? 2 : 4;
    }

    function render(){
      boardEl.innerHTML = '';
      cells.forEach(v => {
        const d = document.createElement('div');
        d.className = 'cell';
        d.textContent = v || '';
        if (v){
          d.style.background = COLORS[v] || '#16a34a';
          if (v >= 128) d.style.boxShadow = `0 0 20px ${COLORS[v] || '#22c55e'}66`;
        }
        boardEl.appendChild(d);
      });
      scoreEl.textContent = score;
      if (score > best){
        best = score;
        store('gl_2048_best', best);
        bestEl.textContent = best;
      }
    }

    function lineIdx(dir, i){
      const a = [];
      for (let k = 0; k < 4; k++){
        if (dir === 'left') a.push(i * 4 + k);
        if (dir === 'right') a.push(i * 4 + (3 - k));
        if (dir === 'up') a.push(k * 4 + i);
        if (dir === 'down') a.push((3 - k) * 4 + i);
      }
      return a;
    }

    function canMove(){
      if (cells.includes(0)) return true;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++){
        const v = cells[r * 4 + c];
        if (c < 3 && cells[r * 4 + c + 1] === v) return true;
        if (r < 3 && cells[(r + 1) * 4 + c] === v) return true;
      }
      return false;
    }

    function move(dir){
      if (dead) return;
      let moved = false;
      for (let i = 0; i < 4; i++){
        const idx = lineIdx(dir, i);
        const vals = idx.map(j => cells[j]).filter(v => v);
        const out = [];
        for (let k = 0; k < vals.length; k++){
          if (vals[k] === vals[k + 1]){
            const m = vals[k] * 2;
            out.push(m);
            score += m;
            Sound.pop();
            if (m === 2048) won = true;
            k++;
          } else out.push(vals[k]);
        }
        while (out.length < 4) out.push(0);
        idx.forEach((j, k) => {
          if (cells[j] !== out[k]) moved = true;
          cells[j] = out[k];
        });
      }
      if (!moved) return;
      addRandom();
      render();

      if (won){
        won = false;
        oTitle.textContent = '🏆 بردی!';
        oText.textContent = `به ۲۰۴۸ رسیدی! امتیاز: ${score}`;
        over.classList.remove('hidden');
        Sound.win();
        Confetti.start(120);
        PlayerStats.win();
        Leaderboard.submit('g2048', score);
        Achievements.unlock('first_game');
        return;
      }
      if (!canMove()){
        dead = true;
        oTitle.textContent = '💀 دیگه حرکتی نمونده!';
        oText.textContent = `امتیاز نهایی: ${score}`;
        over.classList.remove('hidden');
        Sound.lose();
        PlayerStats.lose();
        const rank = Leaderboard.submit('g2048', score);
        if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
      }
    }

    function reset(){
      cells = new Array(16).fill(0);
      score = 0;
      won = false;
      dead = false;
      addRandom();
      addRandom();
      over.classList.add('hidden');
      render();
    }

    const onKey = e => {
      const m = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
      const d = m[e.key];
      if (!d) return;
      e.preventDefault();
      move(d);
    };
    window.addEventListener('keydown', onKey, { passive: false });

    const removeSwipe = addSwipe(boardEl, d => move(d));
    $('#gRestart', root).addEventListener('click', reset);
    reset();

    return () => {
      window.removeEventListener('keydown', onKey);
      removeSwipe();
    };
  }
});