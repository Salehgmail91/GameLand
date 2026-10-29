/* =========================================================
   GameLand — پینگ پونگ (با Leaderboard + Confetti)
   ========================================================= */

GameLand.register('pong', {
  name:'پینگ پونگ', emoji:'🏓',
  init(root){
    const CW = 480, CH = 320;
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>تو</span><b id="poYou">0</b></div>
        <div class="hud-box"><span>کامپیوتر</span><b id="poCpu">0</b></div>
      </div>
      <div class="canvas-wrap">
        <canvas id="poCanvas" width="${CW}" height="${CH}"></canvas>
        <div class="overlay hidden" id="poOver">
          <h3 id="poTitle"></h3>
          <p id="poText"></p>
          <button class="btn primary" id="poRestart">دوباره</button>
        </div>
      </div>
      <p class="hint">با موس / انگشت یا کلیدهای ↑ ↓ راکت رو حرکت بده — تا ۷ گل</p>
    `;

    const cv = document.getElementById('poCanvas');
    const ctx = cv.getContext('2d');
    const youEl = document.getElementById('poYou');
    const cpuEl = document.getElementById('poCpu');
    const over = document.getElementById('poOver');
    const titleEl = document.getElementById('poTitle');
    const textEl = document.getElementById('poText');

    const PADDLE_W = 12, PADDLE_H = 70;
    const BALL_R = 7;
    const WIN_SCORE = 7;

    let you, cpu, ball, youScore, cpuScore, dead, raf, last;
    let upKey = false, downKey = false;

    function reset(){
      you = { x: 20, y: CH / 2 - PADDLE_H / 2, score: 0 };
      cpu = { x: CW - 32, y: CH / 2 - PADDLE_H / 2, score: 0 };
      youScore = 0;
      cpuScore = 0;
      youEl.textContent = '0';
      cpuEl.textContent = '0';
      dead = false;
      resetBall(1);
      over.classList.add('hidden');
      last = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function resetBall(dir){
      ball = {
        x: CW / 2,
        y: CH / 2,
        vx: 5 * dir,
        vy: (Math.random() - 0.5) * 6
      };
    }

    function update(s){
      if (upKey) you.y -= 8 * s;
      if (downKey) you.y += 8 * s;
      you.y = Math.max(0, Math.min(CH - PADDLE_H, you.y));

      const target = ball.y - PADDLE_H / 2;
      const diff = target - cpu.y;
      cpu.y += Math.sign(diff) * Math.min(Math.abs(diff), 5 * s);
      cpu.y = Math.max(0, Math.min(CH - PADDLE_H, cpu.y));

      ball.x += ball.vx * s;
      ball.y += ball.vy * s;

      if (ball.y - BALL_R < 0){ ball.y = BALL_R; ball.vy *= -1; Sound.bounce(); }
      if (ball.y + BALL_R > CH){ ball.y = CH - BALL_R; ball.vy *= -1; Sound.bounce(); }

      if (ball.x - BALL_R < you.x + PADDLE_W && ball.x > you.x &&
          ball.y > you.y && ball.y < you.y + PADDLE_H && ball.vx < 0){
        const rel = (ball.y - (you.y + PADDLE_H / 2)) / (PADDLE_H / 2);
        ball.vx = Math.abs(ball.vx) * 1.05;
        ball.vy = rel * 5;
        ball.x = you.x + PADDLE_W + BALL_R;
        Sound.bounce();
      }

      if (ball.x + BALL_R > cpu.x && ball.x < cpu.x + PADDLE_W &&
          ball.y > cpu.y && ball.y < cpu.y + PADDLE_H && ball.vx > 0){
        const rel = (ball.y - (cpu.y + PADDLE_H / 2)) / (PADDLE_H / 2);
        ball.vx = -Math.abs(ball.vx) * 1.05;
        ball.vy = rel * 5;
        ball.x = cpu.x - BALL_R;
        Sound.bounce();
      }

      if (ball.x < -20){
        cpuScore++;
        cpuEl.textContent = cpuScore;
        Sound.lose();
        checkWin();
        if (!dead) resetBall(1);
      } else if (ball.x > CW + 20){
        youScore++;
        youEl.textContent = youScore;
        Sound.win();
        checkWin();
        if (!dead) resetBall(-1);
      }
    }

    function checkWin(){
      if (youScore >= WIN_SCORE){
        dead = true;
        titleEl.textContent = '🏆 بردی!';
        textEl.textContent = `${youScore} - ${cpuScore}`;
        over.classList.remove('hidden');
        Sound.win();
        Confetti.start(80);
        PlayerStats.win();
        const score = youScore * 100 + (cpuScore === 0 ? 500 : 0);
        Leaderboard.submit('pong', score);
        Achievements.unlock('first_game');
      } else if (cpuScore >= WIN_SCORE){
        dead = true;
        titleEl.textContent = '😢 باختی!';
        textEl.textContent = `${youScore} - ${cpuScore}`;
        over.classList.remove('hidden');
        Sound.lose();
        PlayerStats.lose();
      }
    }

    function draw(){
      ctx.fillStyle = '#0b0b18';
      ctx.fillRect(0, 0, CW, CH);

      ctx.strokeStyle = 'rgba(255,255,255,.1)';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(CW / 2, 0);
      ctx.lineTo(CW / 2, CH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = 'rgba(255,255,255,.06)';
      ctx.beginPath();
      ctx.arc(CW / 2, CH / 2, 50, 0, Math.PI * 2);
      ctx.stroke();

      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(you.x, you.y, PADDLE_W, PADDLE_H);

      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cpu.x, cpu.y, PADDLE_W, PADDLE_H);

      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
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

    function movePaddle(clientY){
      const rect = cv.getBoundingClientRect();
      const y = (clientY - rect.top) * (CH / rect.height);
      you.y = Math.max(0, Math.min(CH - PADDLE_H, y - PADDLE_H / 2));
    }

    const onMouse = e => movePaddle(e.clientY);
    const onTouch = e => { if (e.touches[0]) movePaddle(e.touches[0].clientY); };

    cv.addEventListener('mousemove', onMouse);
    cv.addEventListener('touchstart', onTouch, { passive: true });
    cv.addEventListener('touchmove', onTouch, { passive: true });

    const onKeyDown = e => {
      if (e.key === 'ArrowUp'){ upKey = true; e.preventDefault(); }
      if (e.key === 'ArrowDown'){ downKey = true; e.preventDefault(); }
    };
    const onKeyUp = e => {
      if (e.key === 'ArrowUp') upKey = false;
      if (e.key === 'ArrowDown') downKey = false;
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);

    document.getElementById('poRestart').addEventListener('click', reset);

    reset();

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cv.removeEventListener('mousemove', onMouse);
      cv.removeEventListener('touchstart', onTouch);
      cv.removeEventListener('touchmove', onTouch);
    };
  }
});