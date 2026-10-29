/* =========================================================
   GameLand — پرنده (با Pause + Leaderboard)
   ========================================================= */

GameLand.register('flappy', {
  name:'پرنده', emoji:'🐦',
  init(root){
    const CW = 360, CH = 520;
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>امتیاز</span><b id="flScore">0</b></div>
        <div class="hud-box"><span>رکورد</span><b id="flBest">0</b></div>
      </div>
      <div class="canvas-wrap">
        <canvas id="flCanvas" width="${CW}" height="${CH}"></canvas>
        <div class="overlay hidden" id="flOver">
          <h3 id="flTitle">💀 باختی!</h3>
          <p id="flText"></p>
          <button class="btn primary" id="flRestart">دوباره بازی کن</button>
        </div>
      </div>
      <p class="hint">کلیک / لمس / Space — پرنده رو بالا نگه دار | P = توقف</p>
    `;
    const cv = document.getElementById('flCanvas');
    const ctx = cv.getContext('2d');
    const scoreEl = document.getElementById('flScore');
    const bestEl = document.getElementById('flBest');
    const over = document.getElementById('flOver');
    const titleEl = document.getElementById('flTitle');
    const textEl = document.getElementById('flText');

    const GRAVITY = 0.5;
    const JUMP = -8;
    const PIPE_W = 60;
    const PIPE_GAP = 140;
    const PIPE_SPEED = 2.5;
    const PIPE_INTERVAL = 90;

    let bird, pipes, score, best, dead, raf, frame;
    let paused = false;

    best = +(store('gl_flappy_best') || 0);
    bestEl.textContent = best;

    function reset(){
      bird = { x: 80, y: CH / 2, vy: 0, r: 14, angle: 0 };
      pipes = [];
      score = 0;
      dead = false;
      paused = false;
      frame = 0;
      scoreEl.textContent = 0;
      over.classList.add('hidden');
      const ov = document.getElementById('flPauseOver');
      if (ov) ov.remove();
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function die(){
      dead = true;
      if (score > best){
        best = score;
        store('gl_flappy_best', best);
        bestEl.textContent = best;
      }
      titleEl.textContent = '💀 باختی!';
      textEl.textContent = `امتیاز: ${score}  •  رکورد: ${best}`;
      over.classList.remove('hidden');
      Sound.lose();
      PlayerStats.lose();
      const rank = Leaderboard.submit('flappy', score);
      if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
    }

    function jump(){
      if (dead || paused) return;
      bird.vy = JUMP;
      Sound.play(660, 0.06, 'square', 0.05);
    }

    function togglePause(){
      if (dead) return;
      paused = !paused;
      if (paused){
        const ov = document.createElement('div');
        ov.className = 'overlay';
        ov.id = 'flPauseOver';
        ov.innerHTML = `<h3>⏸ متوقف</h3><p>برای ادامه کلیک کن</p>`;
        ov.addEventListener('click', togglePause);
        cv.parentElement.appendChild(ov);
      } else {
        const ov = document.getElementById('flPauseOver');
        if (ov) ov.remove();
      }
      Sound.click();
    }

    function spawnPipe(){
      const minTop = 60;
      const maxTop = CH - PIPE_GAP - 60;
      const topH = minTop + Math.random() * (maxTop - minTop);
      pipes.push({
        x: CW,
        topH: topH,
        bottomY: topH + PIPE_GAP,
        scored: false
      });
    }

    function update(){
      if (dead || paused) return;
      bird.vy += GRAVITY;
      bird.y += bird.vy;
      bird.angle = Math.max(-0.5, Math.min(Math.PI / 2, bird.vy * 0.05));

      if (bird.y - bird.r < 0){ bird.y = bird.r; bird.vy = 0; }
      if (bird.y + bird.r > CH){ die(); return; }

      frame++;
      if (frame % PIPE_INTERVAL === 0) spawnPipe();

      pipes.forEach(p => {
        p.x -= PIPE_SPEED;

        if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_W){
          if (bird.y - bird.r < p.topH || bird.y + bird.r > p.bottomY){
            die(); return;
          }
        }

        if (!p.scored && p.x + PIPE_W < bird.x){
          p.scored = true;
          score++;
          scoreEl.textContent = score;
          Sound.pop();
          if (score > 0 && score % 10 === 0){
            Toast.info(`🎯 ${score} امتیاز!`);
          }
        }
      });

      pipes = pipes.filter(p => p.x + PIPE_W > -10);
    }

    function draw(){
      const grad = ctx.createLinearGradient(0, 0, 0, CH);
      grad.addColorStop(0, '#0b0b18');
      grad.addColorStop(1, '#1a1a30');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CW, CH);

      ctx.fillStyle = 'rgba(255,255,255,.04)';
      for (let i = 0; i < 3; i++){
        const x = ((frame * 0.3 + i * 150) % (CW + 100)) - 50;
        ctx.beginPath();
        ctx.arc(x, 80 + i * 30, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      pipes.forEach(p => {
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 12;
        ctx.fillRect(p.x, 0, PIPE_W, p.topH);
        ctx.fillRect(p.x, p.bottomY, PIPE_W, CH - p.bottomY);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(p.x - 4, p.topH - 20, PIPE_W + 8, 20);
        ctx.fillRect(p.x - 4, p.bottomY, PIPE_W + 8, 20);
      });

      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.angle);
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(5, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(7, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(10, 2);
      ctx.lineTo(20, 5);
      ctx.lineTo(10, 8);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(-4, 4, 8, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function loop(){
      raf = requestAnimationFrame(loop);
      update();
      draw();
    }

    function onInput(e){
      if (e.type === 'keydown'){
        if (e.code === 'KeyP' || e.code === 'Escape'){
          e.preventDefault();
          togglePause();
          return;
        }
        if (e.code !== 'Space') return;
        e.preventDefault();
      }
      if (paused){
        togglePause();
        return;
      }
      jump();
    }

    window.addEventListener('keydown', onInput, { passive: false });
    cv.addEventListener('click', onInput);
    cv.addEventListener('touchstart', e => { e.preventDefault(); onInput(e); }, { passive: false });

    document.getElementById('flRestart').addEventListener('click', reset);

    reset();

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onInput);
      const ov = document.getElementById('flPauseOver');
      if (ov) ov.remove();
    };
  }
});