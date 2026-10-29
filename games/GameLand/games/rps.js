/* =========================================================
   GameLand — سنگ کاغذ قیچی (با Leaderboard)
   ========================================================= */

GameLand.register('rps', {
  name:'سنگ کاغذ قیچی', emoji:'✊',
  init(root){
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>تو</span><b id="pYou">0</b></div>
        <div class="hud-box"><span>مساوی</span><b id="pDraw">0</b></div>
        <div class="hud-box"><span>کامپیوتر</span><b id="pCpu">0</b></div>
      </div>
      <div class="rps-result" id="pResult">یکی رو انتخاب کن! 👇</div>
      <div class="rps-choices">
        <button data-c="rock">✊</button>
        <button data-c="paper">✋</button>
        <button data-c="scissors">✌️</button>
      </div>
      <button class="btn" id="pReset" style="display:block;margin:0 auto">ریست امتیازها</button>
    `;
    const res = $('#pResult', root);
    const youEl = $('#pYou', root), cpuEl = $('#pCpu', root), drawEl = $('#pDraw', root);
    const NAMES = { rock:'✊ سنگ', paper:'✋ کاغذ', scissors:'✌️ قیچی' };
    const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };
    let s = { you: 0, cpu: 0, draw: 0 }, lock = false;
    const timers = [];

    function update(){
      youEl.textContent = s.you;
      cpuEl.textContent = s.cpu;
      drawEl.textContent = s.draw;
    }

    function play(pick){
      if (lock) return;
      lock = true;
      const cpu = ['rock', 'paper', 'scissors'][rnd(3)];
      res.innerHTML = `<span style="opacity:.6">...</span>`;
      const id = setTimeout(() => {
        let out;
        if (pick === cpu){
          s.draw++;
          out = '🤝 مساوی شد!';
          Sound.click();
        } else if (BEATS[pick] === cpu){
          s.you++;
          out = '🎉 بردی!';
          Sound.win();
          if (s.you >= 5) Confetti.start(50);
        } else {
          s.cpu++;
          out = '😢 باختی!';
          Sound.lose();
        }
        res.innerHTML = `تو: <b>${NAMES[pick]}</b> | کامپیوتر: <b>${NAMES[cpu]}</b><br><span style="font-size:19px">${out}</span>`;
        update();
        lock = false;

        if (s.you >= 5){
          Leaderboard.submit('rps', s.you * 100 - s.cpu * 20);
          PlayerStats.win();
          if (s.you === 5) Achievements.unlock('first_game');
        }
      }, 420);
      timers.push(id);
    }

    $$('.rps-choices button', root).forEach(b => b.addEventListener('click', () => play(b.dataset.c)));
    $('#pReset', root).addEventListener('click', () => {
      s = { you: 0, cpu: 0, draw: 0 };
      update();
      res.textContent = 'یکی رو انتخاب کن! 👇';
    });
    update();
    return () => timers.forEach(clearTimeout);
  }
});