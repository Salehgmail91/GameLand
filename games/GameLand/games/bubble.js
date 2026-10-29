/* =========================================================
   GameLand — حباب‌شکن
   ========================================================= */

GameLand.register('bubble', {
  name:'حباب‌شکن', emoji:'🫧',
  init(root){
    const COLS = 10, ROWS = 12, RADIUS = 18, SPACING = 2;
    const CW = COLS * (RADIUS * 2 + SPACING);
    const CH = ROWS * (RADIUS * 2 + SPACING) + 40;

    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>امتیاز</span><b id="bbScore">0</b></div>
        <div class="hud-box"><span>رکورد</span><b id="bbBest">0</b></div>
      </div>
      <div class="canvas-wrap">
        <canvas id="bbCanvas" width="${CW}" height="${CH}"></canvas>
        <div class="overlay hidden" id="bbOver">
          <h3 id="bbTitle">💀 باختی!</h3>
          <p id="bbText"></p>
          <button class="btn primary" id="bbRestart">دوباره بازی کن</button>
        </div>
      </div>
      <p class="hint">با موس یا انگشت نشونه بگیر و کلیک کن تا حباب بزنی</p>
    `;

    const cv = document.getElementById('bbCanvas');
    const ctx = cv.getContext('2d');
    const scoreEl = document.getElementById('bbScore');
    const bestEl = document.getElementById('bbBest');
    const over = document.getElementById('bbOver');
    const titleEl = document.getElementById('bbTitle');
    const textEl = document.getElementById('bbText');

    const COLORS = ['#ff3b7b', '#00e5ff', '#a855f7', '#22c55e', '#f59e0b'];
    const GAME_OVER_Y = CH - 50;

    let bubbles = [];
    let score = 0;
    let best = +(store('gl_bubble_best') || 0);
    bestEl.textContent = best;
    let shooting = null;
    let raf = null;
    let mouseX = CW / 2, mouseY = CH - 20;

    function cellX(c){ return c * (RADIUS * 2 + SPACING) + RADIUS; }
    function cellY(r){ return r * (RADIUS * 2 + SPACING) + RADIUS; }

    function makeRow(row, maxCols){
      const rowBubbles = [];
      for(let c = 0; c < maxCols; c++){
        rowBubbles.push({
          row, col: c,
          x: cellX(c),
          y: cellY(row),
          color: COLORS[rnd(COLORS.length)],
          alive: true
        });
      }
      return rowBubbles;
    }

    function reset(){
      bubbles = [];
      for(let r = 0; r < 5; r++){
        bubbles.push(...makeRow(r, COLS));
      }
      score = 0;
      scoreEl.textContent = 0;
      over.classList.add('hidden');
      shooting = {
        x: CW/2,
        y: CH - 20,
        vx: 0,
        vy: 0,
        color: COLORS[rnd(COLORS.length)],
        active: false
      };
      if(!raf) raf = requestAnimationFrame(loop);
    }

    function neighbors(b){
      const dirs = b.row % 2 === 0
        ? [[0,-1],[0,1],[-1,0],[-1,1],[1,0],[1,1]]
        : [[0,-1],[0,1],[-1,-1],[-1,0],[1,-1],[1,0]];
      const result = [];
      dirs.forEach(([dr, dc]) => {
        const r = b.row + dr;
        const c = b.col + dc;
        if(r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
        const n = bubbles.find(x => x.alive && x.row === r && x.col === c);
        if(n) result.push(n);
      });
      return result;
    }

    function findCluster(start){
      const cluster = [start];
      const visited = new Set([start]);
      const queue = [start];
      while(queue.length){
        const b = queue.shift();
        neighbors(b).forEach(n => {
          if(visited.has(n)) return;
          if(n.color === start.color){
            visited.add(n);
            cluster.push(n);
            queue.push(n);
          }
        });
      }
      return cluster;
    }

    function removeCluster(cluster){
      cluster.forEach(b => { b.alive = false; });
      score += cluster.length * 5;
      scoreEl.textContent = score;
      if(score > best){
        best = score;
        store('gl_bubble_best', best);
        bestEl.textContent = best;
      }
    }

    function dropFloating(){
      const connected = new Set();
      const topRow = bubbles.filter(b => b.alive && b.row === 0);
      const queue = [...topRow];
      topRow.forEach(b => connected.add(b));
      while(queue.length){
        const b = queue.shift();
        neighbors(b).forEach(n => {
          if(connected.has(n)) return;
          connected.add(n);
          queue.push(n);
        });
      }
      let dropped = 0;
      bubbles.forEach(b => {
        if(b.alive && !connected.has(b)){
          b.alive = false;
          dropped++;
        }
      });
      if(dropped > 0){
        score += dropped * 10;
        scoreEl.textContent = score;
        if(score > best){
          best = score;
          store('gl_bubble_best', best);
          bestEl.textContent = best;
        }
      }
    }

    function snapToGrid(x, y){
      let bestDist = Infinity;
      let target = null;
      for(let r = 0; r < ROWS; r++){
        for(let c = 0; c < COLS; c++){
          const cx = cellX(c), cy = cellY(r);
          const d = Math.hypot(x - cx, y - cy);
          if(d < bestDist && !bubbles.find(b => b.alive && b.row === r && b.col === c)){
            bestDist = d;
            target = { row: r, col: c, x: cx, y: cy };
          }
        }
      }
      return target;
    }

    function shoot(){
      if(shooting.active) return;
      const angle = Math.atan2(mouseY - (CH - 20), mouseX - (CW / 2));
      const a = Math.max(-Math.PI + 0.3, Math.min(-0.3, angle));
      shooting.x = CW / 2;
      shooting.y = CH - 20;
      shooting.vx = Math.cos(a) * 9;
      shooting.vy = Math.sin(a) * 9;
      shooting.active = true;
    }

        // 🆕 تابع کمکی: بعد از برخورد، رنگ توپ جدید رو عوض کن
    function nextBall(){
      shooting.active = false;
      shooting.color = COLORS[rnd(COLORS.length)];
      // 🆕 حذف حباب‌های مرده برای جلوگیری از memory leak
      if (bubbles.length > 300){
        bubbles = bubbles.filter(b => b.alive);
      }
    }

    function update(){
      if(!shooting.active) return;
      shooting.x += shooting.vx;
      shooting.y += shooting.vy;

      // برخورد با دیواره
      if(shooting.x - RADIUS < 0 || shooting.x + RADIUS > CW){
        shooting.vx *= -1;
        shooting.x = Math.max(RADIUS, Math.min(CW - RADIUS, shooting.x));
      }

      // برخورد با سقف
      if(shooting.y - RADIUS < 0){
        const target = snapToGrid(shooting.x, cellY(0));
        if(target){
          bubbles.push({ ...target, color: shooting.color, alive: true });
          const cluster = findCluster(bubbles[bubbles.length - 1]);
          if(cluster.length >= 3){
            removeCluster(cluster);
            dropFloating();
          }
        }
        nextBall();
        checkGameOver();
        return;
      }

      // برخورد با حباب دیگه
      for(const b of bubbles){
        if(!b.alive) continue;
        const d = Math.hypot(shooting.x - b.x, shooting.y - b.y);
        if(d < RADIUS * 2 - 2){
          const target = snapToGrid(shooting.x, shooting.y);
          if(target){
            bubbles.push({ ...target, color: shooting.color, alive: true });
            const cluster = findCluster(bubbles[bubbles.length - 1]);
            if(cluster.length >= 3){
              removeCluster(cluster);
              dropFloating();
            }
          }
          nextBall();
          checkGameOver();
          return;
        }
      }
    }

    function checkGameOver(){
      const alive = bubbles.filter(b => b.alive);
      if(alive.some(b => b.y > GAME_OVER_Y)){
        titleEl.textContent = '💀 باختی!';
        textEl.textContent = `امتیاز: ${score}  •  رکورد: ${best}`;
        over.classList.remove('hidden');
      } else if(alive.length === 0){
        titleEl.textContent = '🏆 بردی!';
        textEl.textContent = `همه حباب‌ها ترکیدن! امتیاز: ${score}`;
        over.classList.remove('hidden');
      }
    }

    function draw(){
      ctx.fillStyle = '#0b0b18';
      ctx.fillRect(0, 0, CW, CH);

      // خط خطر
      ctx.strokeStyle = 'rgba(255,59,123,.5)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, GAME_OVER_Y);
      ctx.lineTo(CW, GAME_OVER_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      // حباب‌ها
      bubbles.forEach(b => {
        if(!b.alive) return;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, RADIUS - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        ctx.beginPath();
        ctx.arc(b.x - 5, b.y - 5, RADIUS * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });

      // خط نشونه
      if(!shooting.active){
        const angle = Math.atan2(mouseY - (CH - 20), mouseX - (CW / 2));
        const a = Math.max(-Math.PI + 0.3, Math.min(-0.3, angle));
        ctx.strokeStyle = 'rgba(255,255,255,.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CW / 2, CH - 20);
        ctx.lineTo(CW / 2 + Math.cos(a) * 80, CH - 20 + Math.sin(a) * 80);
        ctx.stroke();
      }

      // توپ در حال پرتاب
      if(shooting.active){
        ctx.shadowColor = shooting.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = shooting.color;
        ctx.beginPath();
        ctx.arc(shooting.x, shooting.y, RADIUS - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // توپ بعدی
      ctx.shadowColor = shooting.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = shooting.color;
      ctx.beginPath();
      ctx.arc(CW / 2, CH - 20, RADIUS - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function loop(){
      raf = requestAnimationFrame(loop);
      update();
      draw();
    }

    // Controls
    cv.addEventListener('mousemove', e => {
      const rect = cv.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) * (CW / rect.width);
      mouseY = (e.clientY - rect.top) * (CH / rect.height);
    });

    cv.addEventListener('click', shoot);

    cv.addEventListener('touchstart', e => {
      const rect = cv.getBoundingClientRect();
      const t = e.touches[0];
      mouseX = (t.clientX - rect.left) * (CW / rect.width);
      mouseY = (t.clientY - rect.top) * (CH / rect.height);
      e.preventDefault();
    }, { passive: false });

    cv.addEventListener('touchend', e => {
      shoot();
      e.preventDefault();
    }, { passive: false });

    cv.addEventListener('touchmove', e => {
      const rect = cv.getBoundingClientRect();
      const t = e.touches[0];
      mouseX = (t.clientX - rect.left) * (CW / rect.width);
      mouseY = (t.clientY - rect.top) * (CH / rect.height);
      e.preventDefault();
    }, { passive: false });

    document.getElementById('bbRestart').addEventListener('click', reset);

    reset();

    return function(){
      if(raf) cancelAnimationFrame(raf);
    };
  }
});