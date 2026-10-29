/* =========================================================
   GameLand — پازل کشویی (با Leaderboard + Confetti)
   ========================================================= */

GameLand.register('puzzle', {
  name:'پازل کشویی', emoji:'🎯',
  init(root){
    const SIZE = 3;
    const TOTAL = SIZE * SIZE;

    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>حرکت</span><b id="pzMoves">0</b></div>
        <div class="hud-box"><span>رکورد</span><b id="pzBest">—</b></div>
      </div>
      <div class="board-wrap">
        <div class="puzzle-grid" id="pzGrid"></div>
        <div class="overlay hidden" id="pzOver">
          <h3>🏆 بردی!</h3>
          <p id="pzText"></p>
          <button class="btn primary" id="pzRestart">دوباره</button>
        </div>
      </div>
      <p class="hint">روی خونه‌های کنار جای خالی بزن تا جابه‌جا شن</p>
    `;

    const gridEl = document.getElementById('pzGrid');
    const movesEl = document.getElementById('pzMoves');
    const bestEl = document.getElementById('pzBest');
    const over = document.getElementById('pzOver');
    const textEl = document.getElementById('pzText');
    const timers = [];

    let board, emptyIdx, moves, best, solved;

    best = +(store('gl_puzzle_best') || 0);
    if (best) bestEl.textContent = best;

    function isSolved(){
      for (let i = 0; i < TOTAL - 1; i++){
        if (board[i] !== i + 1) return false;
      }
      return board[TOTAL - 1] === 0;
    }

    function getNeighbors(idx){
      const r = Math.floor(idx / SIZE), c = idx % SIZE;
      const n = [];
      if (r > 0) n.push(idx - SIZE);
      if (r < SIZE - 1) n.push(idx + SIZE);
      if (c > 0) n.push(idx - 1);
      if (c < SIZE - 1) n.push(idx + 1);
      return n;
    }

    function shuffleBoard(){
      board = Array.from({ length: TOTAL }, (_, i) => (i + 1) % TOTAL);
      emptyIdx = TOTAL - 1;
      for (let i = 0; i < 200; i++){
        const neighbors = getNeighbors(emptyIdx);
        const n = neighbors[Math.floor(Math.random() * neighbors.length)];
        board[emptyIdx] = board[n];
        board[n] = 0;
        emptyIdx = n;
      }
      if (isSolved()) shuffleBoard();
    }

    function render(){
      gridEl.innerHTML = '';
      board.forEach((v, i) => {
        const btn = document.createElement('button');
        btn.textContent = v === 0 ? '' : v;
        btn.disabled = v === 0 || solved;
        if (v === 0) btn.style.opacity = '0';
        btn.addEventListener('click', () => tryMove(i));
        gridEl.appendChild(btn);
      });
      movesEl.textContent = moves;
    }

    function tryMove(idx){
      if (solved) return;
      const neighbors = getNeighbors(emptyIdx);
      if (!neighbors.includes(idx)) return;

      board[emptyIdx] = board[idx];
      board[idx] = 0;
      emptyIdx = idx;
      moves++;
      Sound.click();
      render();

      if (isSolved()){
        solved = true;
        if (!best || moves < best){
          best = moves;
          store('gl_puzzle_best', best);
          bestEl.textContent = best;
        }
        textEl.textContent = `با ${moves} حرکت حلش کردی! 🏆`;
        const id = setTimeout(() => {
          over.classList.remove('hidden');
          Sound.win();
          Confetti.start(70);
          PlayerStats.win();
          const score = Math.max(0, 3000 - moves * 30);
          const rank = Leaderboard.submit('puzzle', score);
          if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
          Achievements.unlock('first_game');
        }, 300);
        timers.push(id);
      }
    }

    function reset(){
      solved = false;
      moves = 0;
      shuffleBoard();
      over.classList.add('hidden');
      render();
    }

    document.getElementById('pzRestart').addEventListener('click', reset);
    reset();

    return () => timers.forEach(clearTimeout);
  }
});