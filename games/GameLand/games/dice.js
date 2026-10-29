/* =========================================================
   GameLand — تاس (Dice Roller)
   ========================================================= */

GameLand.register('dice', {
  name:'تاس', emoji:'🎲',
  init(root){
    const CW = 320, CH = 320;
    const ROLLS_MAX = 10;

    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>امتیاز</span><b id="dcScore">0</b></div>
        <div class="hud-box"><span>پرتاب</span><b id="dcRolls">0/${ROLLS_MAX}</b></div>
        <div class="hud-box"><span>رکورد</span><b id="dcBest">0</b></div>
      </div>
      <div class="canvas-wrap">
        <canvas id="dcCanvas" width="${CW}" height="${CH}"></canvas>
        <div class="overlay hidden" id="dcOver">
          <h3>🎲 تموم شد!</h3>
          <p id="dcText"></p>
          <button class="btn primary" id="dcRestart">دوباره</button>
        </div>
      </div>
      <button class="btn primary" id="dcRoll" style="display:block;margin:14px auto 0">🎲 پرتاب تاس</button>
      <p class="hint">هر پرتاب یه امتیاز می‌ده — جمع کن تا ۱۰ پرتاب!</p>
    `;

    const cv = document.getElementById('dcCanvas');
    const ctx = cv.getContext('2d');
    const scoreEl = document.getElementById('dcScore');
    const rollsEl = document.getElementById('dcRolls');
    const bestEl = document.getElementById('dcBest');
    const over = document.getElementById('dcOver');
    const textEl = document.getElementById('dcText');
    const rollBtn = document.getElementById('dcRoll');

    let value = 1;
    let score = 0;
    let rolls = 0;
    let dead = false;
    let best = +(store('gl_dice_best') || 0);
    let rolling = false;
    let history = [];
    let raf = null;

    bestEl.textContent = best;

    function reset(){
      value = 1;
      score = 0;
      rolls = 0;
      dead = false;
      rolling = false;
      history = [];
      scoreEl.textContent = '0';
      rollsEl.textContent = `0/${ROLLS_MAX}`;
      over.classList.add('hidden');
      rollBtn.disabled = false;
      rollBtn.textContent = '🎲 پرتاب تاس';
      draw();
    }

    function roll(){
      if (dead || rolling) return;
      rolling = true;
      rollBtn.disabled = true;

      const duration = 900 + rnd(300);
      const start = performance.now();
      const startVal = value;

      function frame(t){
        const p = Math.min(1, (t - start) / duration);
        // تغییر تصادفی سریع اول
        if (p < 0.85){
          value = 1 + rnd(6);
        }
        draw();
        if (p < 1){
          raf = requestAnimationFrame(frame);
        } else {
          finishRoll();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    function finishRoll(){
      value = 1 + rnd(6);
      history.push(value);

      // قانون امتیازدهی: جفت/سه‌تایی/شش
      let gain = value;
      // چک کن اگر ۲ تای آخر مساوی: جایزه
      const last2 = history.slice(-2);
      if (last2.length === 2 && last2[0] === last2[1]) gain += value * 2;

      const last3 = history.slice(-3);
      if (last3.length === 3 && last3[0] === last3[1] && last3[1] === last3[2]) gain += value * 3;

      if (value === 6) gain += 5;

      score += gain;
      scoreEl.textContent = score;
      rolls++;
      rollsEl.textContent = `${rolls}/${ROLLS_MAX}`;

      Sound.bounce();
      if (gain > value) Sound.pop();

      draw();

      rolling = false;

      if (rolls >= ROLLS_MAX){
        endGame();
      } else {
        rollBtn.disabled = false;
      }
    }

    function endGame(){
      dead = true;
      rollBtn.disabled = true;
      if (score > best){
        best = score;
        store('gl_dice_best', best);
        bestEl.textContent = best;
      }
      textEl.textContent = `امتیاز نهایی: ${score} — پرتاب‌ها: [${history.join(', ')}]`;
      over.classList.remove('hidden');
      Sound.win();
      PlayerStats.win();
      const rank = Leaderboard.submit('dice', score);
      if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
    }

    /* ========== رسم تاس ========== */
    function draw(){
      ctx.fillStyle = '#0b0b18';
      ctx.fillRect(0, 0, CW, CH);

      // تاس در مرکز
      const size = 200;
      const x = (CW - size) / 2;
      const y = (CH - size) / 2;

      // سایه/درخشش
      ctx.save();
      ctx.shadowColor = rolling ? 'rgba(124,92,255,.7)' : 'rgba(124,92,255,.3)';
      ctx.shadowBlur = rolling ? 40 : 20;
      const g = ctx.createLinearGradient(x, y, x + size, y + size);
      g.addColorStop(0, '#f8fafc');
      g.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = g;
      roundRect(ctx, x, y, size, size, 28);
      ctx.fill();
      ctx.restore();

      // دایره‌های تاس
      const dotR = 20;
      const positions = getDotPositions(value, x, y, size);
      positions.forEach(([px, py]) => {
        ctx.fillStyle = '#0b0b18';
        ctx.beginPath();
        ctx.arc(px, py, dotR, 0, Math.PI * 2);
        ctx.fill();
      });

      // نمایش عدد در گوشه (خیلی کوچک)
      ctx.fillStyle = 'rgba(255,255,255,.15)';
      ctx.font = 'bold 14px Vazirmatn';
      ctx.textAlign = 'center';
      ctx.fillText(`تاس: ${value}`, CW / 2, CH - 14);
    }

    function getDotPositions(v, x, y, size){
      const q = size / 4;
      const cx = x + size / 2;
      const cy = y + size / 2;
      const L = x + q, R = x + size - q, T = y + q, B = y + size - q;

      const map = {
        1: [[cx, cy]],
        2: [[L, T], [R, B]],
        3: [[L, T], [cx, cy], [R, B]],
        4: [[L, T], [R, T], [L, B], [R, B]],
        5: [[L, T], [R, T], [cx, cy], [L, B], [R, B]],
        6: [[L, T], [R, T], [L, cy], [R, cy], [L, B], [R, B]]
      };
      return map[v] || map[1];
    }

    rollBtn.addEventListener('click', roll);
    document.getElementById('dcRestart').addEventListener('click', reset);

    reset();

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }
});