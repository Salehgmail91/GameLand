/* =========================================================
   GameLand — مین‌یاب (اصلاح‌شده)
   ========================================================= */

GameLand.register('minesweeper', {
  name:'مین‌یاب', emoji:'💣',
  init(root){
    const SIZE = 8;
    const MINES = 10;

    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>مین‌ها</span><b id="msMines">10</b></div>
        <div class="hud-box"><span>پرچم‌ها</span><b id="msFlags">0</b></div>
        <div class="hud-box"><span>رکورد</span><b id="msBest">—</b></div>
      </div>
      <div class="board-wrap">
        <div class="mine-grid" id="msGrid" style="grid-template-columns:repeat(${SIZE}, auto)"></div>
        <div class="overlay hidden" id="msOver">
          <h3 id="msTitle"></h3>
          <p id="msText"></p>
          <button class="btn primary" id="msRestart">دوباره</button>
        </div>
      </div>
      <p class="hint">کلیک چپ = باز کردن | راست‌کلیک یا لمس طولانی = پرچم</p>
    `;

    const gridEl = document.getElementById('msGrid');
    const minesEl = document.getElementById('msMines');
    const flagsEl = document.getElementById('msFlags');
    const bestEl = document.getElementById('msBest');
    const over = document.getElementById('msOver');
    const titleEl = document.getElementById('msTitle');
    const textEl = document.getElementById('msText');

    let grid, revealed, flagged, started, dead, won, startTime, best;
    let touchTimer = null;
    let longPressTriggered = false;

    best = +(store('gl_minesweeper_best') || 0);
    if (best) bestEl.textContent = best + ' ثانیه';

    function reset(){
      grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
      revealed = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
      flagged = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
      started = false;
      dead = false;
      won = false;
      startTime = 0;
      minesEl.textContent = MINES;
      flagsEl.textContent = '0';
      over.classList.add('hidden');
      render();
    }

    function placeMines(safeR, safeC){
      let placed = 0;
      while (placed < MINES){
        const r = rnd(SIZE);
        const c = rnd(SIZE);
        if (grid[r][c] === -1) continue;
        if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
        grid[r][c] = -1;
        placed++;
      }
      for (let r = 0; r < SIZE; r++){
        for (let c = 0; c < SIZE; c++){
          if (grid[r][c] === -1) continue;
          let count = 0;
          for (let dr = -1; dr <= 1; dr++){
            for (let dc = -1; dc <= 1; dc++){
              const nr = r + dr, nc = c + dc;
              if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
              if (grid[nr][nc] === -1) count++;
            }
          }
          grid[r][c] = count;
        }
      }
    }

    function reveal(r, c){
      if (revealed[r][c] || flagged[r][c] || dead || won) return;
      revealed[r][c] = true;

      if (grid[r][c] === 0){
        for (let dr = -1; dr <= 1; dr++){
          for (let dc = -1; dc <= 1; dc++){
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
            reveal(nr, nc);
          }
        }
      }
    }

    function click(r, c){
      if (dead || won) return;
      if (!started){
        placeMines(r, c);
        started = true;
        startTime = Date.now();
      }
      if (flagged[r][c]) return;

      if (grid[r][c] === -1){
        revealed[r][c] = true;
        dead = true;
        // همه مین‌ها رو نشون بده
        for (let rr = 0; rr < SIZE; rr++)
          for (let cc = 0; cc < SIZE; cc++)
            if (grid[rr][cc] === -1) revealed[rr][cc] = true;

        titleEl.textContent = '💥 بوم! باختی';
        textEl.textContent = 'روی مین کلیک کردی!';
        over.classList.remove('hidden');
        Sound.lose();
        PlayerStats.lose();
        render();
        return;
      }
      reveal(r, c);
      Sound.click();
      render();
      checkWin();
    }

    function toggleFlag(r, c){
      if (dead || won || revealed[r][c]) return;
      flagged[r][c] = !flagged[r][c];
      const count = flagged.flat().filter(Boolean).length;
      flagsEl.textContent = count;
      Sound.click();
      render();
    }

    function checkWin(){
      let allRevealed = true;
      for (let r = 0; r < SIZE; r++){
        for (let c = 0; c < SIZE; c++){
          if (grid[r][c] !== -1 && !revealed[r][c]){ allRevealed = false; break; }
        }
        if (!allRevealed) break;
      }
      if (allRevealed){
        won = true;
        const time = Math.round((Date.now() - startTime) / 1000);
        if (!best || time < best){
          best = time;
          store('gl_minesweeper_best', best);
          bestEl.textContent = best + ' ثانیه';
        }
        titleEl.textContent = '🏆 بردی!';
        textEl.textContent = `زمان: ${time} ثانیه`;
        over.classList.remove('hidden');
        Sound.win();
        Confetti.start(80);
        PlayerStats.win();
        // امتیاز بر اساس سرعت
        const score = Math.max(0, 2000 - time * 10);
        const rank = Leaderboard.submit('minesweeper', score);
        if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
      }
    }

    function render(){
      gridEl.innerHTML = '';
      for (let r = 0; r < SIZE; r++){
        for (let c = 0; c < SIZE; c++){
          const btn = document.createElement('button');
          btn.className = 'mine-cell';
          if (revealed[r][c]){
            btn.classList.add('revealed');
            if (grid[r][c] === -1){
              btn.classList.add('mine');
              btn.textContent = '💣';
            } else if (grid[r][c] > 0){
              btn.textContent = grid[r][c];
              const colors = ['', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#94a3b8'];
              btn.style.color = colors[grid[r][c]] || '#fff';
            }
          } else if (flagged[r][c]){
            btn.classList.add('flagged');
            btn.textContent = '🚩';
          }

          // کلیک چپ
          btn.addEventListener('click', () => {
            if (longPressTriggered){
              longPressTriggered = false;
              return;
            }
            click(r, c);
          });

          // راست‌کلیک
          btn.addEventListener('contextmenu', e => {
            e.preventDefault();
            toggleFlag(r, c);
          });

          // لمس طولانی برای flag
          btn.addEventListener('touchstart', (e) => {
            longPressTriggered = false;
            touchTimer = setTimeout(() => {
              longPressTriggered = true;
              toggleFlag(r, c);
            }, 450);
          }, { passive: true });

          btn.addEventListener('touchend', () => {
            if (touchTimer){ clearTimeout(touchTimer); touchTimer = null; }
          });

          btn.addEventListener('touchmove', () => {
            if (touchTimer){ clearTimeout(touchTimer); touchTimer = null; }
          });

          gridEl.appendChild(btn);
        }
      }
    }

    document.getElementById('msRestart').addEventListener('click', reset);
    reset();

    return () => {
      if (touchTimer) clearTimeout(touchTimer);
    };
  }
});