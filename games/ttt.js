/* =========================================================
   GameLand — بازی دوز (با Leaderboard + Confetti)
   ========================================================= */

GameLand.register('ttt', {
  name:'دوز', emoji:'⭕',
  init(root){
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>تو</span><b id="tYou">0</b></div>
        <div class="hud-box"><span>مساوی</span><b id="tDraw">0</b></div>
        <div class="hud-box"><span>هوش مصنوعی</span><b id="tAI">0</b></div>
      </div>
      <div class="ttt" id="tBoard"></div>
      <div class="rps-result" id="tMsg">نوبت توئه — علامت ❌</div>
      <button class="btn" id="tReset" style="display:block;margin:14px auto 0">شروع دوباره</button>
    `;
    const boardEl = $('#tBoard', root), msg = $('#tMsg', root);
    const youEl = $('#tYou', root), aiEl = $('#tAI', root), drawEl = $('#tDraw', root);
    let b, over, scores = { you: 0, ai: 0, draw: 0 };
    const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const timers = [];

    function winner(bd){
      for (const [a, c, d] of LINES)
        if (bd[a] && bd[a] === bd[c] && bd[a] === bd[d]) return bd[a];
      return bd.includes('') ? null : 'draw';
    }

    function minimax(bd, player){
      const w = winner(bd);
      if (w === 'O') return { score: 10 };
      if (w === 'X') return { score: -10 };
      if (w === 'draw') return { score: 0 };
      const moves = [];
      bd.forEach((v, i) => {
        if (v !== '') return;
        bd[i] = player;
        const r = minimax(bd, player === 'O' ? 'X' : 'O');
        moves.push({ i, score: r.score });
        bd[i] = '';
      });
      return player === 'O'
        ? moves.reduce((a, c) => c.score > a.score ? c : a)
        : moves.reduce((a, c) => c.score < a.score ? c : a);
    }

    function render(winLine){
      boardEl.innerHTML = '';
      b.forEach((v, i) => {
        const btn = document.createElement('button');
        btn.textContent = v === 'X' ? '❌' : v === 'O' ? '⭕' : '';
        if (v === 'X') btn.classList.add('x');
        if (v === 'O') btn.classList.add('o');
        if (winLine && winLine.includes(i)) btn.classList.add('win');
        btn.disabled = !!v || over;
        btn.addEventListener('click', () => play(i));
        boardEl.appendChild(btn);
      });
      youEl.textContent = scores.you;
      aiEl.textContent = scores.ai;
      drawEl.textContent = scores.draw;
    }

    function findWin(bd, p){
      for (const L of LINES){
        if (L.every(i => bd[i] === p)) return L;
      }
      return null;
    }

    function finish(){
      const w = winner(b);
      if (!w) return false;
      over = true;
      if (w === 'X'){
        scores.you++;
        msg.textContent = '🎉 بردی! ایول';
        render(findWin(b, 'X'));
        Sound.win();
        Confetti.start(60);
        PlayerStats.win();
        const rank = Leaderboard.submit('ttt', scores.you * 100);
        if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
        Achievements.unlock('first_game');
      } else if (w === 'O'){
        scores.ai++;
        msg.textContent = '🤖 هوش مصنوعی برد!';
        render(findWin(b, 'O'));
        Sound.lose();
        PlayerStats.lose();
      } else {
        scores.draw++;
        msg.textContent = '🤝 مساوی شد';
        render();
      }
      return true;
    }

    function aiMove(){
      if (over) return;
      const m = minimax(b.slice(), 'O');
      if (m && m.i !== undefined){
        b[m.i] = 'O';
        if (!finish()){
          msg.textContent = 'نوبت توئه — علامت ❌';
          render();
        }
      }
    }

    function play(i){
      if (over || b[i]) return;
      b[i] = 'X';
      Sound.click();
      if (finish()) return;
      render();
      msg.textContent = 'هوش مصنوعی داره فکر می‌کنه...';
      const id = setTimeout(() => { if (!over) aiMove(); }, 320);
      timers.push(id);
    }

    function reset(){
      b = new Array(9).fill('');
      over = false;
      msg.textContent = 'نوبت توئه — علامت ❌';
      render();
    }

    $('#tReset', root).addEventListener('click', reset);
    reset();
    return () => timers.forEach(clearTimeout);
  }
});