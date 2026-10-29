/* =========================================================
   GameLand — دنباله (Sequence)
   نسخه پیشرفته سایمون: تعداد بیشتر، سرعت متغیر، ریتم
   ========================================================= */

GameLand.register('sequence', {
  name:'دنباله', emoji:'🎵',
  init(root){
    const COLORS = [
      { name:'سبز',   bg:'#22c55e', glow:'rgba(34,197,94,.9)',  freq:261.63 },
      { name:'قرمز',  bg:'#ef4444', glow:'rgba(239,68,68,.9)',  freq:329.63 },
      { name:'زرد',   bg:'#eab308', glow:'rgba(234,179,8,.9)',  freq:392.00 },
      { name:'آبی',   bg:'#3b82f6', glow:'rgba(59,130,246,.9)', freq:523.25 },
      { name:'بنفش',  bg:'#a855f7', glow:'rgba(168,85,247,.9)', freq:659.25 },
      { name:'صورتی', bg:'#ec4899', glow:'rgba(236,72,153,.9)', freq:783.99 }
    ];

    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>مرحله</span><b id="sqLevel">0</b></div>
        <div class="hud-box"><span>رکورد</span><b id="sqBest">0</b></div>
        <div class="hud-box"><span>وضعیت</span><b id="sqStatus">آماده</b></div>
      </div>
      <div class="seq-grid" id="sqGrid"></div>
      <p class="hint" id="sqMsg">دکمه «شروع» رو بزن — الگو رو نگاه کن و تکرار کن</p>
      <button class="btn primary" id="sqStart" style="display:block;margin:14px auto 0">شروع بازی</button>
    `;

    const gridEl = document.getElementById('sqGrid');
    const levelEl = document.getElementById('sqLevel');
    const bestEl = document.getElementById('sqBest');
    const statusEl = document.getElementById('sqStatus');
    const msg = document.getElementById('sqMsg');
    const startBtn = document.getElementById('sqStart');

    let sequence = [];
    let userIdx = 0;
    let level = 0;
    let best = +(store('gl_sequence_best') || 0);
    let playing = false;
    let dead = false;
    let timers = [];
    let btns = [];

    bestEl.textContent = best;

    /* ساخت دکمه‌ها بر اساس grid 3x2 */
    function buildGrid(){
      gridEl.innerHTML = '';
      btns = [];
      COLORS.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'seq-btn';
        b.style.background = c.bg;
        b.dataset.i = i;
        b.addEventListener('click', () => clickBtn(i));
        gridEl.appendChild(b);
        btns.push(b);
      });
    }

    function flash(i, duration = 350){
      const b = btns[i];
      if (!b) return;
      b.classList.add('active');
      b.style.boxShadow = `0 0 40px ${COLORS[i].glow}`;
      Sound.play(COLORS[i].freq, duration / 1000, 'sine', 0.1);
      const id = setTimeout(() => {
        b.classList.remove('active');
        b.style.boxShadow = '';
      }, duration);
      timers.push(id);
    }

    function playSequence(){
      playing = true;
      statusEl.textContent = 'تماشا';
      msg.textContent = 'الگو رو نگاه کن...';

      // سرعت بر اساس مرحله (سریع‌تر می‌شه)
      const speed = Math.max(280, 620 - level * 25);
      let i = 0;

      const next = () => {
        if (i >= sequence.length){
          playing = false;
          userIdx = 0;
          statusEl.textContent = 'نوبت تو';
          msg.textContent = 'حالا تکرار کن!';
          return;
        }
        flash(sequence[i], speed - 80);
        i++;
        const id = setTimeout(next, speed);
        timers.push(id);
      };
      next();
    }

    function nextLevel(){
      level++;
      levelEl.textContent = level;
      sequence.push(rnd(COLORS.length));
      const id = setTimeout(playSequence, 700);
      timers.push(id);
    }

    function startGame(){
      timers.forEach(clearTimeout); timers = [];
      sequence = [];
      level = 0;
      dead = false;
      playing = false;
      userIdx = 0;
      levelEl.textContent = '0';
      statusEl.textContent = 'شروع';
      startBtn.textContent = 'شروع مجدد';
      nextLevel();
    }

    function clickBtn(i){
      if (playing || dead) return;
      if (sequence.length === 0) return;

      flash(i, 220);

      if (sequence[userIdx] === i){
        userIdx++;
        if (userIdx === sequence.length){
          // مرحله کامل شد
          if (level > best){
            best = level;
            store('gl_sequence_best', best);
            bestEl.textContent = best;
          }
          playing = true;
          statusEl.textContent = '✅';
          msg.textContent = `🎉 مرحله ${level} رد شد!`;
          Sound.pop();
          const id = setTimeout(() => {
            playing = false;
            nextLevel();
          }, 900);
          timers.push(id);
        }
      } else {
        // اشتباه
        dead = true;
        statusEl.textContent = '❌';
        msg.textContent = `💀 اشتباه! به مرحله ${level} رسیدی`;
        Sound.lose();
        PlayerStats.lose();

        // افکت لرزش
        btns.forEach(b => b.classList.add('shake'));
        const id = setTimeout(() => {
          btns.forEach(b => b.classList.remove('shake'));
          Leaderboard.submit('sequence', level * 100);
        }, 500);
        timers.push(id);
      }
    }

    startBtn.addEventListener('click', startGame);
    buildGrid();

    return () => {
      timers.forEach(clearTimeout);
    };
  }
});