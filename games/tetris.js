/* =========================================================
   GameLand — تتریس (با Pause + Leaderboard)
   ========================================================= */

GameLand.register('tetris', {
  name:'تتریس', emoji:'🧩',
  init(root){
    const COLS = 10, ROWS = 20, CELL = 22;
    const CW = COLS * CELL, CH = ROWS * CELL;

    root.innerHTML = `
      <div class="hud">
  <div class="hud-box"><span>امتیاز</span><b id="ttScore">0</b></div>
  <div class="hud-box"><span>خطوط</span><b id="ttLines">0</b></div>
  <div class="hud-box"><span>رکورد</span><b id="ttBest">0</b></div>
</div>
<div style="text-align:center;margin-bottom:10px">
  <button class="btn" id="ttPauseBox" style="font-size:12px;padding:6px 14px">⏸ توقف (P)</button>
</div>
      <div class="tetris-wrap">
        <div class="canvas-wrap">
          <canvas id="ttCanvas" width="${CW}" height="${CH}"></canvas>
          <div class="overlay hidden" id="ttOver">
            <h3 id="ttTitle">💀 باختی!</h3>
            <p id="ttText"></p>
            <button class="btn primary" id="ttRestart">دوباره</button>
          </div>
        </div>
        <div class="tetris-next">
          <h4>بعدی</h4>
          <canvas id="ttNext" width="90" height="90"></canvas>
        </div>
      </div>
      <p class="hint">← → حرکت | ↑ چرخش | ↓ پایین | Space پرش سریع | P توقف</p>
    `;

    const cv = document.getElementById('ttCanvas');
    const ctx = cv.getContext('2d');
    const nextCv = document.getElementById('ttNext');
    const nextCtx = nextCv.getContext('2d');
    const scoreEl = document.getElementById('ttScore');
    const linesEl = document.getElementById('ttLines');
    const over = document.getElementById('ttOver');
    const titleEl = document.getElementById('ttTitle');
    const textEl = document.getElementById('ttText');
        const bestEl = document.getElementById('ttBest');
    let best = +(store('gl_tetris_best') || 0);
    if (bestEl) bestEl.textContent = best;
    const SHAPES = {
      I: { cells: [[1,1,1,1]], color: '#00e5ff' },
      O: { cells: [[1,1],[1,1]], color: '#eab308' },
      T: { cells: [[0,1,0],[1,1,1]], color: '#a855f7' },
      S: { cells: [[0,1,1],[1,1,0]], color: '#22c55e' },
      Z: { cells: [[1,1,0],[0,1,1]], color: '#ef4444' },
      J: { cells: [[1,0,0],[1,1,1]], color: '#3b82f6' },
      L: { cells: [[0,0,1],[1,1,1]], color: '#f97316' }
    };
    const KEYS = Object.keys(SHAPES);

    let grid, current, next, score, lines, dead, raf, last, dropInterval, dropAcc;
    let paused = false;
    let pauseOverlay = null;

    function makeGrid(){
      return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    }

    function randomPiece(){
      const key = KEYS[Math.floor(Math.random() * KEYS.length)];
      const shape = SHAPES[key];
      return {
        cells: shape.cells.map(r => [...r]),
        color: shape.color,
        x: Math.floor((COLS - shape.cells[0].length) / 2),
        y: 0
      };
    }

    function reset(){
      grid = makeGrid();
      current = randomPiece();
      next = randomPiece();
      score = 0;
      lines = 0;
      dead = false;
      paused = false;
      dropInterval = 800;
      dropAcc = 0;
      last = 0;
      scoreEl.textContent = '0';
      linesEl.textContent = '0';
      over.classList.add('hidden');
      if (pauseOverlay){ pauseOverlay.remove(); pauseOverlay = null; }
      const p = document.getElementById('ttPause');
      if (p) p.textContent = '▶';
      drawNext();
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function collides(piece, offX = 0, offY = 0, cells = null){
      const c = cells || piece.cells;
      for (let r = 0; r < c.length; r++){
        for (let cc = 0; cc < c[r].length; cc++){
          if (!c[r][cc]) continue;
          const x = piece.x + cc + offX;
          const y = piece.y + r + offY;
          if (x < 0 || x >= COLS || y >= ROWS) return true;
          if (y >= 0 && grid[y][x]) return true;
        }
      }
      return false;
    }

    function rotate(){
      const c = current.cells;
      const rotated = c[0].map((_, i) => c.map(row => row[i]).reverse());
      if (!collides(current, 0, 0, rotated)){
        current.cells = rotated;
        Sound.click();
      }
    }

    function move(dx){
      if (!collides(current, dx, 0)){
        current.x += dx;
        Sound.click();
      }
    }

    function drop(){
      if (!collides(current, 0, 1)){
        current.y++;
      } else {
        lockPiece();
      }
    }

    function hardDrop(){
      while (!collides(current, 0, 1)) current.y++;
      lockPiece();
    }

    function lockPiece(){
      current.cells.forEach((row, r) => {
        row.forEach((v, c) => {
          if (v){
            const y = current.y + r;
            const x = current.x + c;
            if (y < 0){ dead = true; return; }
            grid[y][x] = current.color;
          }
        });
      });

      clearLines();
      current = next;
      next = randomPiece();
      drawNext();

      if (collides(current)){
        dead = true;
        // if (score > best){
        //   best = score;
        //   store('gl_tetris_best', best);
        //   bestEl.textContent = best;
        // }
        titleEl.textContent = '💀 باختی!';
        textEl.textContent = `امتیاز: ${score}  •  خطوط: ${lines}`;
        over.classList.remove('hidden');
        Sound.lose();
        PlayerStats.lose();
        const rank = Leaderboard.submit('tetris', score);
        if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
      }
    }

    function clearLines(){
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--){
        if (grid[r].every(c => c)){
          grid.splice(r, 1);
          grid.unshift(Array(COLS).fill(null));
          cleared++;
          r++;
        }
      }
      if (cleared){
        lines += cleared;
        score += [0, 100, 300, 500, 800][cleared] || 800;
        linesEl.textContent = lines;
        scoreEl.textContent = score;
        Sound.win();
        dropInterval = Math.max(100, 800 - lines * 20);

        if (cleared >= 4){
          Confetti.start(60);
          Toast.success('🎉 تتریس!');
        }
      }
    }

    function drawCell(context, x, y, color, size){
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 8;
      context.fillRect(x + 1, y + 1, size - 2, size - 2);
      context.shadowBlur = 0;
      context.strokeStyle = 'rgba(255,255,255,.2)';
      context.strokeRect(x + 1, y + 1, size - 2, size - 2);
    }

    function draw(){
      ctx.fillStyle = '#0b0b18';
      ctx.fillRect(0, 0, CW, CH);

      ctx.strokeStyle = 'rgba(255,255,255,.03)';
      for (let i = 1; i < COLS; i++){
        ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, CH); ctx.stroke();
      }
      for (let i = 1; i < ROWS; i++){
        ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(CW, i * CELL); ctx.stroke();
      }

      grid.forEach((row, r) => {
        row.forEach((color, c) => {
          if (color) drawCell(ctx, c * CELL, r * CELL, color, CELL);
        });
      });

      if (current){
        current.cells.forEach((row, r) => {
          row.forEach((v, c) => {
            if (v){
              drawCell(ctx, (current.x + c) * CELL, (current.y + r) * CELL, current.color, CELL);
            }
          });
        });
      }

      if (current && !dead){
        let ghostY = current.y;
        while (!collides({ ...current, y: ghostY }, 0, 1)) ghostY++;
        if (ghostY !== current.y){
          ctx.globalAlpha = 0.15;
          current.cells.forEach((row, r) => {
            row.forEach((v, c) => {
              if (v){
                ctx.fillStyle = current.color;
                ctx.fillRect((current.x + c) * CELL + 1, (ghostY + r) * CELL + 1, CELL - 2, CELL - 2);
              }
            });
          });
          ctx.globalAlpha = 1;
        }
      }
    }

    function drawNext(){
      nextCtx.fillStyle = '#0b0b18';
      nextCtx.fillRect(0, 0, 90, 90);
      if (!next) return;
      const cells = next.cells;
      const size = 20;
      const w = cells[0].length * size;
      const h = cells.length * size;
      const ox = (90 - w) / 2;
      const oy = (90 - h) / 2;
      cells.forEach((row, r) => {
        row.forEach((v, c) => {
          if (v) drawCell(nextCtx, ox + c * size, oy + r * size, next.color, size);
        });
      });
    }

    function loop(t){
      raf = requestAnimationFrame(loop);
      if (!last) last = t;
      const dt = t - last;
      last = t;
      if (!dead && !paused){
        dropAcc += dt;
        if (dropAcc >= dropInterval){
          dropAcc = 0;
          drop();
        }
      }
      draw();
    }

    function togglePause(){
      if (dead) return;
      paused = !paused;
      const p = document.getElementById('ttPause');
      if (p) p.textContent = paused ? '⏸' : '▶';

      if (paused && !pauseOverlay){
        pauseOverlay = document.createElement('div');
        pauseOverlay.className = 'overlay';
        pauseOverlay.innerHTML = `<h3>⏸ متوقف</h3><p>برای ادامه کلیک کن</p>`;
        pauseOverlay.addEventListener('click', togglePause);
        cv.parentElement.appendChild(pauseOverlay);
      } else if (!paused && pauseOverlay){
        pauseOverlay.remove();
        pauseOverlay = null;
      }
      Sound.click();
    }

    function onKey(e){
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape'){
        e.preventDefault();
        togglePause();
        return;
      }
      if (dead || paused) return;
      switch (e.key){
        case 'ArrowLeft': e.preventDefault(); move(-1); break;
        case 'ArrowRight': e.preventDefault(); move(1); break;
        case 'ArrowDown': e.preventDefault(); drop(); break;
        case 'ArrowUp': e.preventDefault(); rotate(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
      }
    }
    window.addEventListener('keydown', onKey, { passive: false });

    // متغیر best اینجا تعریف شده چون در lockPiece استفاده می‌شه
    // let best;
    best = +(store('gl_tetris_best') || 0);
    // چک می‌کنیم که bestEl وجود داره
    const bestElLocal = document.getElementById('ttBest');

    const pauseBox = document.getElementById('ttPauseBox');
    if (pauseBox) pauseBox.addEventListener('click', togglePause);

    document.getElementById('ttRestart').addEventListener('click', reset);
    reset();

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      if (pauseOverlay) pauseOverlay.remove();
    };
  }
});