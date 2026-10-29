/* =========================================================
   GameLand — تست سرعت (با Achievement speedster)
   ========================================================= */

GameLand.register('reaction', {
  name:'تست سرعت', emoji:'⚡',
  init(root){
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>آخرین</span><b id="rLast">—</b></div>
        <div class="hud-box"><span>بهترین</span><b id="rBest">—</b></div>
      </div>
      <div class="reaction" id="rBox"><span id="rText">برای شروع کلیک کن</span></div>
      <p class="hint">هرچی سریع‌تر، بهتر! ولی زود نزن 😉</p>
    `;
    const box = $('#rBox', root), txt = $('#rText', root);
    const lastEl = $('#rLast', root), bestEl = $('#rBest', root);
    let state = 'idle', t0 = 0, timerId = null;
    let best = +(store('gl_reaction_best') || 0);
    if (best) bestEl.textContent = best + ' ms';

    function setState(s, cls, text){
      state = s;
      box.className = 'reaction' + (cls ? ' ' + cls : '');
      txt.textContent = text;
    }

    function onClick(){
      if (state === 'idle'){
        setState('wait', 'wait', 'صبر کن...');
        const d = 1200 + Math.random() * 2800;
        timerId = setTimeout(() => {
          setState('go', 'go', 'کلیک کن! 🔥');
          t0 = performance.now();
          Sound.pop();
        }, d);
        return;
      }
      if (state === 'wait'){
        clearTimeout(timerId);
        setState('idle', '', '⛔ زود زدی! دوباره کلیک کن');
        Sound.lose();
        return;
      }
      if (state === 'go'){
        const ms = Math.round(performance.now() - t0);
        lastEl.textContent = ms + ' ms';
        if (!best || ms < best){
          best = ms;
          store('gl_reaction_best', best);
          bestEl.textContent = best + ' ms';
        }
        const rank = ms < 180 ? '🚀 فوق‌العاده!' :
                     ms < 260 ? '🔥 عالی!' :
                     ms < 350 ? '👍 خوب بود' : '🐢 یه کم کند...';
        setState('idle', '', `${ms} میلی‌ثانیه — ${rank}\nبرای تلاش دوباره کلیک کن`);

        if (ms < 200) Achievements.unlock('speedster');

        const score = Math.max(0, 1000 - ms);
        const lrank = Leaderboard.submit('reaction', score);
        if (lrank && lrank <= 5) Toast.success(`🏆 رتبه ${lrank}!`);

        if (ms < 250) Confetti.start(40);
        if (ms > 400) Sound.lose();
        else Sound.win();
      }
    }

    box.addEventListener('click', onClick);
    return () => {
      clearTimeout(timerId);
      box.removeEventListener('click', onClick);
    };
  }
});