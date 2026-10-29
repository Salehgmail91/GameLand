/* =========================================================
   GameLand — خاموش‌کن (Lights Out)
   ========================================================= */

GameLand.register('lightsout', {
  name:'خاموش‌کن', emoji:'💡',
  init(root){
    const SIZE = 5;
    const CELL = 60;
    const GAP = 6;
    const CW = SIZE * (CELL + GAP) + GAP;

    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>حرکت</span><b id="loMoves">0</b></div>
        <div class="hud-box"><span>روشن</span><b id="loLit">0</b></div>
        <div class="hud-box"><span>رکورد</span><b id="loBest">—</b></div>
      </div>
      <div class="canvas-wrap">
        <canvas id="loCanvas" width="${CW}" height="${CW}"></canvas>
        <div class="overlay hidden" id="loOver">
          <h3>🏆 آفرین!</h3>
          <p id="loText"></p>
          <button class="btn primary" id="loRestart">بازی جدید</button>
        </div>
      </div>
      <p class="hint">روی هر خونه بزن — خودش و همسایه‌هاش برمی‌گردن. همه رو خاموش کن!</p>
    `;

    const cv = document.getElementById('loCanvas');
    const ctx = cv.getContext('2d');
    const movesEl = document.getElementById('loMoves');
    const litEl = document.getElementById('loLit');
    const bestEl = document.getElementById('loBest');
    const over = document.getElementById('loOver');
    const textEl = document.getElementById('loText');

    let grid, moves, dead, best;
    best = +(store('gl_lightsout_best') || 0);
    if (best) bestEl.textContent = best;

    function cellPos(r, c){
      return {
        x: GAP + c * (CELL + GAP),
        y: GAP + r * (CELL + GAP)
      };
    }

    function reset(){
      // تولید پازل با راه‌حل تضمینی: چند بار کلیک تصادفی روی صفحه خالی
      grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
      const clicks = 3 + rnd(4);
      const used = new Set();
      for (let i = 0; i < clicks; i++){
        let r, c, key;
        do {
          r = rnd(SIZE); c = rnd(SIZE);
          key = r * SIZE + c;
        } while (used.has(key));
        used.add(key);
        toggle(r, c);
      }
      moves = 0;
      dead = false;
      over.classList.add('hidden');
      updateHud();
      draw();
    }

    function toggle(r, c){
      const dirs = [[0,0],[0,1],[0,-1],[1,0],[-1,0]];
      dirs.forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE){
          grid[nr][nc] = !grid[nr][nc];
        }
      });
    }

    function countLit(){
      let n = 0;
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
          if (grid[r][c]) n++;
      return n;
    }

    function updateHud(){
      movesEl.textContent = moves;
      litEl.textContent = countLit();
    }

    function click(r, c){
      if (dead) return;
      toggle(r, c);
      moves++;
      Sound.click();
      updateHud();
      draw();
      if (countLit() === 0){
        dead = true;
        if (!best || moves < best){
          best = moves;
          store('gl_lightsout_best', best);
          bestEl.textContent = best;
        }
        textEl.textContent = `با ${moves} حرکت همه رو خاموش کردی! 🏆`;
        over.classList.remove('hidden');
        Confetti.start(70);
        Sound.win();
        PlayerStats.win();
        Leaderboard.submit('lightsout', Math.max(0, 1000 - moves * 10));
      }
    }

    function draw(){
      ctx.fillStyle = '#0b0b18';
      ctx.fillRect(0, 0, CW, CW);

      for (let r = 0; r < SIZE; r++){
        for (let c = 0; c < SIZE; c++){
          const { x, y } = cellPos(r, c);
          const lit = grid[r][c];

          if (lit){
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#fbbf24';
          } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,.05)';
          }

          roundRect(ctx, x, y, CELL, CELL, 12);
          ctx.fill();
          ctx.shadowBlur = 0;

          // border
          ctx.strokeStyle = lit ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.08)';
          ctx.lineWidth = 2;
          roundRect(ctx, x, y, CELL, CELL, 12);
          ctx.stroke();
        }
      }
    }

    function onClick(e){
      if (dead) return;
      const rect = cv.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = (clientX - rect.left) * (CW / rect.width);
      const y = (clientY - rect.top) * (CW / rect.height);

      for (let r = 0; r < SIZE; r++){
        for (let c = 0; c < SIZE; c++){
          const { x: cx, y: cy } = cellPos(r, c);
          if (x >= cx && x <= cx + CELL && y >= cy && y <= cy + CELL){
            click(r, c);
            return;
          }
        }
      }
    }

    cv.addEventListener('click', onClick);
    cv.addEventListener('touchstart', e => { e.preventDefault(); onClick(e); }, { passive: false });

    document.getElementById('loRestart').addEventListener('click', reset);

    reset();

    return () => {
      dead = true;
      cv.removeEventListener('click', onClick);
    };
  }
});