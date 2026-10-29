/* =========================================================
   GameLand — مار (با Pause + Leaderboard)
   ========================================================= */

GameLand.register('snake', {
  name:'مار', emoji:'🐍',
  init(root){
    const COLS = 20, ROWS = 20, CELL = 22, CW = COLS * CELL, CH = ROWS * CELL;

    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>امتیاز</span><b id="snScore">0</b></div>
        <div class="hud-box"><span>رکورد</span><b id="snBest">0</b></div>
        <div class="hud-box" style="cursor:pointer" id="snPauseBox">
          <span>وضعیت</span><b id="snPause">▶</b>
        </div>
      </div>
      <div class="canvas-wrap">
        <canvas id="snCanvas" width="${CW}" height="${CH}"></canvas>
        <div class="overlay hidden" id="snOver">
          <h3 id="snTitle">💀 باختی!</h3>
          <p id="snText"></p>
          <button class="btn primary" id="snRestart">دوباره بازی کن</button>
        </div>
        <div class="overlay hidden" id="snPauseOver">
          <h3>⏸ متوقف</h3>
          <p>برای ادامه کلیک کن</p>
        </div>
      </div>
      <div class="dpad">
        <button data-d="up">▲</button>
        <button data-d="left">◀</button>
        <button data-d="down">▼</button>
        <button data-d="right">▶</button>
      </div>
      <p class="hint">کلیدهای جهت‌دار / WASD — P یا Escape برای Pause</p>
    `;

    const cv = $('#snCanvas', root), ctx = cv.getContext('2d');
    const scoreEl = $('#snScore', root), bestEl = $('#snBest', root);
    const over = $('#snOver', root), titleEl = $('#snTitle', root), textEl = $('#snText', root);
    const pauseOver = $('#snPauseOver', root), pauseBtn = $('#snPause', root);

    let snake, dir, queue, food, score, best, step, acc, last, raf, dead, paused;
    best = +(store('gl_snake_best') || 0);
    bestEl.textContent = best;

    function spawn(){
      const free = [];
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
          if (!snake.some(s => s.x === x && s.y === y)) free.push({ x, y });
      return free.length ? free[rnd(free.length)] : { x: 0, y: 0 };
    }

    function reset(){
      snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
      dir = { x: 0, y: -1 };
      queue = [];
      score = 0; step = 130; acc = 0; last = 0;
      dead = false; paused = false;
      food = spawn();
      scoreEl.textContent = 0;
      over.classList.add('hidden');
      pauseOver.classList.add('hidden');
      pauseBtn.textContent = '▶';
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function die(){
      dead = true;
      if (score > best){
        best = score;
        store('gl_snake_best', best);
        bestEl.textContent = best;
      }
      titleEl.textContent = '💀 باختی!';
      textEl.textContent = `امتیاز: ${score}  •  رکورد: ${best}`;
      over.classList.remove('hidden');
      Sound.lose();
      PlayerStats.lose();
      const rank = Leaderboard.submit('snake', score);
      if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
    }

    function togglePause(){
      if (dead) return;
      paused = !paused;
      pauseOver.classList.toggle('hidden', !paused);
      pauseBtn.textContent = paused ? '⏸' : '▶';
      Sound.click();
    }

    function push(d){
      const l = queue.length ? queue[queue.length - 1] : dir;
      if (d.x === -l.x && d.y === -l.y) return;
      if (d.x === l.x && d.y === l.y) return;
      if (queue.length < 3) queue.push(d);
    }

    function update(){
      if (queue.length) dir = queue.shift();
      const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (h.x < 0 || h.y < 0 || h.x >= COLS || h.y >= ROWS){ die(); return; }
      const eat = (h.x === food.x && h.y === food.y);
      const body = eat ? snake : snake.slice(0, -1);
      if (body.some(s => s.x === h.x && s.y === h.y)){ die(); return; }
      snake.unshift(h);
      if (eat){
        score += 10;
        scoreEl.textContent = score;
        step = Math.max(62, 130 - Math.floor(score / 50) * 7);
        food = spawn();
        Sound.pop();
      } else {
        snake.pop();
      }
    }

    function draw(){
      ctx.fillStyle = '#0b0b18';
      ctx.fillRect(0, 0, CW, CH);

      ctx.strokeStyle = 'rgba(255,255,255,.035)';
      for (let i = 1; i < COLS; i++){
        ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, CH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(CW, i * CELL); ctx.stroke();
      }

      const fx = food.x * CELL + CELL / 2, fy = food.y * CELL + CELL / 2;
      const p = 1 + Math.sin(performance.now() / 180) * 0.12;
      ctx.shadowColor = '#ff3b7b'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#ff3b7b';
      ctx.beginPath(); ctx.arc(fx, fy, CELL * 0.31 * p, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      for (let i = snake.length - 1; i >= 0; i--){
        const s = snake[i], t = i / Math.max(1, snake.length - 1);
        if (i === 0){
          ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 16;
          ctx.fillStyle = '#8dffb8';
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(34,197,94,${0.92 - t * 0.55})`;
        }
        roundRect(ctx, s.x * CELL + 1.5, s.y * CELL + 1.5, CELL - 3, CELL - 3, 6);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    function loop(t){
      raf = requestAnimationFrame(loop);
      if (!last) last = t;
      const dt = Math.min(t - last, 100);
      last = t;
      if (!dead && !paused){
        acc += dt;
        while (acc >= step){ acc -= step; update(); if (dead) break; }
      }
      draw();
    }

    const keyMap = {
      arrowup:[0,-1], arrowdown:[0,1], arrowleft:[-1,0], arrowright:[1,0],
      w:[0,-1], s:[0,1], a:[-1,0], d:[1,0]
    };
    const onKey = e => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape'){
        e.preventDefault();
        togglePause();
        return;
      }
      const k = keyMap[e.key.toLowerCase()];
      if (!k) return;
      e.preventDefault();
      push({ x: k[0], y: k[1] });
    };
    window.addEventListener('keydown', onKey, { passive: false });

    $$('.dpad button', root).forEach(b => {
      b.addEventListener('click', () => {
        const m = { up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} };
        push(m[b.dataset.d]);
      });
    });

    const removeSwipe = addSwipe(cv, d => {
      const m = { up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} };
      push(m[d]);
    });

    cv.addEventListener('click', () => { if (paused) togglePause(); });
    $('#snPauseBox', root).addEventListener('click', togglePause);
    $('#snRestart', root).addEventListener('click', reset);

    reset();

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      removeSwipe();
    };
  }
});