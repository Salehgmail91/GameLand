/* =========================================================
   GameLand — چهارتایی (Connect 4)
   ========================================================= */

GameLand.register('connect4', {
  name:'چهارتایی', emoji:'🔷',
  init(root){
    const COLS = 7, ROWS = 6, CELL = 54;
    const CW = COLS * CELL, CH = ROWS * CELL + 30;

    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>تو 🔴</span><b id="c4You">0</b></div>
        <div class="hud-box"><span>مساوی</span><b id="c4Draw">0</b></div>
        <div class="hud-box"><span>AI 🟡</span><b id="c4AI">0</b></div>
      </div>
      <div class="canvas-wrap">
        <canvas id="c4Canvas" width="${CW}" height="${CH}"></canvas>
        <div class="overlay hidden" id="c4Over">
          <h3 id="c4Title"></h3>
          <p id="c4Text"></p>
          <button class="btn primary" id="c4Restart">دوباره</button>
        </div>
      </div>
      <p class="hint">روی ستون بزن یا موس رو ببر تا مهره بندازی — AI رقیبته!</p>
    `;

    const cv = document.getElementById('c4Canvas');
    const ctx = cv.getContext('2d');
    const youEl = document.getElementById('c4You');
    const aiEl = document.getElementById('c4AI');
    const drawEl = document.getElementById('c4Draw');
    const over = document.getElementById('c4Over');
    const titleEl = document.getElementById('c4Title');
    const textEl = document.getElementById('c4Text');

    const scores = { you: 0, ai: 0, draw: 0 };
    let grid, turn, dead, raf, hoverCol = -1, winningCells = [], animPiece = null;

    function reset(){
      grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      turn = 1;
      dead = false;
      hoverCol = -1;
      winningCells = [];
      animPiece = null;
      over.classList.add('hidden');
      updateHud();
      draw();
    }

    function updateHud(){
      youEl.textContent = scores.you;
      aiEl.textContent = scores.ai;
      drawEl.textContent = scores.draw;
    }

    function getDropRow(col){
      for (let r = ROWS - 1; r >= 0; r--){
        if (grid[r][col] === 0) return r;
      }
      return -1;
    }

    function checkWin(r, c, p){
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      for (const [dr, dc] of dirs){
        const cells = [[r,c]];
        for (const sign of [1,-1]){
          let rr = r + dr*sign, cc = c + dc*sign;
          while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && grid[rr][cc] === p){
            cells.push([rr, cc]);
            rr += dr*sign; cc += dc*sign;
          }
        }
        if (cells.length >= 4) return cells;
      }
      return null;
    }

    function isFull(){
      return grid[0].every(v => v !== 0);
    }

    function finish(who, cells){
      dead = true;
      winningCells = cells || [];

      if (who === 'you'){
        scores.you++;
        PlayerStats.win();
        titleEl.textContent = '🏆 بردی!';
        textEl.textContent = 'چهارتا رو چیدی!';
        Confetti.start(100);
        Sound.win();
        const rank = Leaderboard.submit('connect4', scores.you * 100);
        if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank} در رکوردها!`);
      } else if (who === 'ai'){
        scores.ai++;
        PlayerStats.lose();
        titleEl.textContent = '😢 باختی!';
        textEl.textContent = 'AI برنده شد';
        Sound.lose();
      } else {
        scores.draw++;
        titleEl.textContent = '🤝 مساوی!';
        textEl.textContent = 'هیچ‌کس نبرد';
      }

      updateHud();
      over.classList.remove('hidden');
      draw();
    }

    /* ========== AI ========== */
    function aiPick(){
      // 1. برد فوری
      for (let c = 0; c < COLS; c++){
        const r = getDropRow(c);
        if (r < 0) continue;
        grid[r][c] = 2;
        const win = checkWin(r, c, 2);
        grid[r][c] = 0;
        if (win) return c;
      }
      // 2. جلوگیری از برد کاربر
      for (let c = 0; c < COLS; c++){
        const r = getDropRow(c);
        if (r < 0) continue;
        grid[r][c] = 1;
        const win = checkWin(r, c, 1);
        grid[r][c] = 0;
        if (win) return c;
      }
      // 3. ترجیح مرکز
      const order = [3, 2, 4, 1, 5, 0, 6];
      for (const c of order){
        if (getDropRow(c) >= 0) return c;
      }
      return -1;
    }

    function aiMove(){
      if (dead || turn !== 2) return;
      const c = aiPick();
      if (c < 0) return;
      const r = getDropRow(c);
      animateDrop(r, c, 2, () => {
        const win = checkWin(r, c, 2);
        if (win) return finish('ai', win);
        if (isFull()) return finish('draw');
        turn = 1;
        draw();
      });
    }

    /* ========== انیمیشن افتادن ========== */
    function animateDrop(r, c, player, onDone){
      animPiece = {
        col: c, fromY: -CELL, toY: r * CELL,
        y: -CELL, player, onDone
      };
      const start = performance.now();
      const dur = 280;
      function frame(t){
        const p = Math.min(1, (t - start) / dur);
        const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
        animPiece.y = animPiece.fromY + (animPiece.toY - animPiece.fromY) * ease;
        draw();
        if (p < 1){
          raf = requestAnimationFrame(frame);
        } else {
          grid[r][c] = player;
          animPiece = null;
          Sound.bounce();
          draw();
          onDone && onDone();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    /* ========== رسم ========== */
    function draw(){
      ctx.fillStyle = '#0b0b18';
      ctx.fillRect(0, 0, CW, CH);

      // نام‌های بالا
      ctx.font = 'bold 13px Vazirmatn';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(239,68,68,.75)';
      ctx.fillText('تو 🔴', CW / 4, 20);
      ctx.fillStyle = 'rgba(234,179,8,.75)';
      ctx.fillText('AI 🟡', CW * 3 / 4, 20);

      const offsetY = 30;

      // hover ستون
      if (!dead && turn === 1 && hoverCol >= 0 && !animPiece){
        const r = getDropRow(hoverCol);
        if (r >= 0){
          ctx.fillStyle = 'rgba(124,92,255,.1)';
          ctx.fillRect(hoverCol * CELL, offsetY, CELL, CH - offsetY);
        }
      }

      // مهره‌ها
      for (let r = 0; r < ROWS; r++){
        for (let c = 0; c < COLS; c++){
          const x = c * CELL + CELL / 2;
          const y = offsetY + r * CELL + CELL / 2;
          const rad = CELL / 2 - 4;

          // پشت مهره (سوراخ)
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,.04)';
          ctx.fill();

          // مهره
          const v = grid[r][c];
          if (v !== 0) drawPiece(x, y, rad, v);

          // highlight اگر جزو win هست
          const isWin = winningCells.some(([rr, cc]) => rr === r && cc === c);
          if (isWin){
            ctx.beginPath();
            ctx.arc(x, y, rad + 3, 0, Math.PI * 2);
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }

      // مهره در حال افتادن
      if (animPiece){
        const x = animPiece.col * CELL + CELL / 2;
        const y = offsetY + animPiece.y + CELL / 2;
        drawPiece(x, y, CELL / 2 - 4, animPiece.player);
      }
    }

    function drawPiece(x, y, rad, v){
      ctx.save();
      const color = v === 1 ? '#ef4444' : '#eab308';
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // درخشش داخلی
      const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, 0, x, y, rad);
      g.addColorStop(0, 'rgba(255,255,255,.4)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* ========== ورودی ========== */
    function colFromEvent(e){
      const rect = cv.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = (clientX - rect.left) * (CW / rect.width);
      return Math.floor(x / CELL);
    }

    function onClick(e){
      if (dead || turn !== 1 || animPiece) return;
      const col = colFromEvent(e);
      if (col < 0 || col >= COLS) return;
      const r = getDropRow(col);
      if (r < 0) return;

      Sound.click();
      animateDrop(r, col, 1, () => {
        const win = checkWin(r, col, 1);
        if (win) return finish('you', win);
        if (isFull()) return finish('draw');
        turn = 2;
        draw();
        setTimeout(aiMove, 380);
      });
    }

    function onMove(e){
      if (dead || turn !== 1) return;
      hoverCol = colFromEvent(e);
      draw();
    }

    function onLeave(){
      hoverCol = -1;
      draw();
    }

    cv.addEventListener('click', onClick);
    cv.addEventListener('mousemove', onMove);
    cv.addEventListener('mouseleave', onLeave);
    cv.addEventListener('touchstart', e => { e.preventDefault(); onClick(e); }, { passive: false });

    document.getElementById('c4Restart').addEventListener('click', reset);

    reset();

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      cv.removeEventListener('click', onClick);
      cv.removeEventListener('mousemove', onMove);
      cv.removeEventListener('mouseleave', onLeave);
    };
  }
});