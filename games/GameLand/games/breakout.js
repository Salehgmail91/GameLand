/* =========================================================
   GameLand — آجرشکن (با Leaderboard + Confetti)
   ========================================================= */

GameLand.register('breakout', {
  name:'آجرشکن', emoji:'🧱',
  init(root){
    const CW = 480, CH = 380;
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>امتیاز</span><b id="boScore">0</b></div>
        <div class="hud-box"><span>جان</span><b id="boLives">❤❤❤</b></div>
      </div>
      <div class="canvas-wrap">
        <canvas id="boCanvas" width="${CW}" height="${CH}"></canvas>
        <div class="overlay hidden" id="boOver">
          <h3 id="boTitle"></h3>
          <p id="boText"></p>
          <button class="btn primary" id="boRestart">دوباره</button>
        </div>
      </div>
      <p class="hint">با موس / انگشت یا کلیدهای ← → راکت رو حرکت بده</p>
    `;
    const cv = $('#boCanvas', root), ctx = cv.getContext('2d');
    const scoreEl = $('#boScore', root), livesEl = $('#boLives', root);
    const over = $('#boOver', root), oTitle = $('#boTitle', root), oText = $('#boText', root);
    const COLS = 8, ROWS = 4, BW = 52, BH = 18, PAD = 6;
    const OFFLEFT = (CW - (COLS * (BW + PAD) - PAD)) / 2;
    const OFFTOP = 44;
    const ROW_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];
    const paddle = { w: 92, h: 12, x: CW / 2 - 46, y: CH - 28 };
    const ball = { x: CW / 2, y: CH - 46, r: 7, vx: 3.4, vy: -4 };
    let bricks = [], score = 0, lives = 3, dead = false, raf = null, last = 0;
    let left = false, right = false;

    function makeBricks(){
      bricks = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
        bricks.push({
          x: OFFLEFT + c * (BW + PAD), y: OFFTOP + r * (BH + PAD),
          w: BW, h: BH, color: ROW_COLORS[r], dead: false
        });
      }
    }

    function resetBall(){
      ball.x = CW / 2;
      ball.y = CH - 46;
      ball.vx = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random());
      ball.vy = -4.2;
      paddle.x = CW / 2 - paddle.w / 2;
    }

    function reset(){
      makeBricks();
      score = 0;
      lives = 3;
      dead = false;
      scoreEl.textContent = '0';
      livesEl.textContent = '❤❤❤';
      over.classList.add('hidden');
      resetBall();
      last = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function loseLife(){
      lives--;
      livesEl.textContent = '❤'.repeat(Math.max(0, lives)) || '—';
      if (lives <= 0){
        dead = true;
        oTitle.textContent = '💀 باختی!';
        oText.textContent = `امتیاز: ${score}`;
        over.classList.remove('hidden');
        Sound.lose();
        PlayerStats.lose();
        const rank = Leaderboard.submit('breakout', score);
        if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
      } else resetBall();
    }

    function update(s){
      if (left) paddle.x -= 7 * s;
      if (right) paddle.x += 7 * s;
      paddle.x = Math.max(0, Math.min(CW - paddle.w, paddle.x));
      ball.x += ball.vx * s;
      ball.y += ball.vy * s;
      if (ball.x - ball.r < 0){ ball.x = ball.r; ball.vx *= -1; }
      if (ball.x + ball.r > CW){ ball.x = CW - ball.r; ball.vx *= -1; }
      if (ball.y - ball.r < 0){ ball.y = ball.r; ball.vy *= -1; }
      if (ball.y - ball.r > CH){ loseLife(); return; }
      if (ball.vy > 0 && ball.y + ball.r > paddle.y && ball.y - ball.r < paddle.y + paddle.h &&
          ball.x > paddle.x - ball.r && ball.x < paddle.x + paddle.w + ball.r){
        const rel = Math.max(-1, Math.min(1, (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2)));
        const sp = 6.4;
        ball.vx = rel * sp * 0.85;
        ball.vy = -Math.sqrt(Math.max(2, sp * sp - ball.vx * ball.vx));
        ball.y = paddle.y - ball.r - 0.5;
        Sound.bounce();
      }
      for (const b of bricks){
        if (b.dead) continue;
        const ox = (ball.r + b.w / 2) - Math.abs(ball.x - (b.x + b.w / 2));
        const oy = (ball.r + b.h / 2) - Math.abs(ball.y - (b.y + b.h / 2));
        if (ox > 0 && oy > 0){
          if (ox < oy) ball.vx *= -1; else ball.vy *= -1;
          b.dead = true;
          score += 10;
          scoreEl.textContent = score;
          Sound.bounce();
          break;
        }
      }
      if (bricks.every(b => b.dead)){
        dead = true;
        oTitle.textContent = '🏆 بردی!';
        oText.textContent = `همه آجرها خرد شدن! امتیاز: ${score}`;
        over.classList.remove('hidden');
        Sound.win();
        Confetti.start(80);
        PlayerStats.win();
        Leaderboard.submit('breakout', score);
        Achievements.unlock('first_game');
      }
    }

    function draw(){
      ctx.fillStyle = '#0b0b18';
      ctx.fillRect(0, 0, CW, CH);
      for (const b of bricks){
        if (b.dead) continue;
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        roundRect(ctx, b.x, b.y, b.w, b.h, 5);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      const g = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.w, 0);
      g.addColorStop(0, '#7c5cff');
      g.addColorStop(1, '#00e5ff');
      ctx.fillStyle = g;
      ctx.shadowColor = '#7c5cff';
      ctx.shadowBlur = 16;
      roundRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function loop(t){
      raf = requestAnimationFrame(loop);
      if (!last) last = t;
      const dt = Math.min(t - last, 50);
      last = t;
      const s = Math.min(dt / 16.67, 2);
      if (!dead) update(s);
      draw();
    }

    function movePaddle(clientX){
      const rect = cv.getBoundingClientRect();
      const x = (clientX - rect.left) * (CW / rect.width);
      paddle.x = Math.max(0, Math.min(CW - paddle.w, x - paddle.w / 2));
    }
    const onMouse = e => movePaddle(e.clientX);
    const onTouch = e => { if (e.touches[0]) movePaddle(e.touches[0].clientX); };
    cv.addEventListener('mousemove', onMouse);
    cv.addEventListener('touchstart', onTouch, { passive: true });
    cv.addEventListener('touchmove', onTouch, { passive: true });

    const onKeyDown = e => {
      if (e.key === 'ArrowLeft'){ left = true; e.preventDefault(); }
      if (e.key === 'ArrowRight'){ right = true; e.preventDefault(); }
    };
    const onKeyUp = e => {
      if (e.key === 'ArrowLeft') left = false;
      if (e.key === 'ArrowRight') right = false;
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    $('#boRestart', root).addEventListener('click', reset);
    reset();

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      cv.removeEventListener('mousemove', onMouse);
      cv.removeEventListener('touchstart', onTouch);
      cv.removeEventListener('touchmove', onTouch);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }
});