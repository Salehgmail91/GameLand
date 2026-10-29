/* =========================================================
   GameLand — بازی حافظه (با Leaderboard + Confetti)
   ========================================================= */

GameLand.register('memory', {
  name:'بازی حافظه', emoji:'🧠',
  init(root){
    const ICONS = ['🚀','🎮','👾','🍕','⚡','🔥','💎','🎯'];
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>حرکت</span><b id="meMoves">0</b></div>
        <div class="hud-box"><span>جفت‌ها</span><b id="meMatch">0/8</b></div>
      </div>
      <div class="board-wrap">
        <div class="mem-grid" id="meGrid"></div>
        <div class="overlay hidden" id="meOver">
          <h3>🎉 آفرین!</h3>
          <p id="meText"></p>
          <button class="btn primary" id="meRestart">دوباره</button>
        </div>
      </div>
      <p class="hint">روی کارت‌ها بزن — دو تا کارت هم‌شکل پیدا کن</p>
    `;
    const grid = $('#meGrid', root);
    const movesEl = $('#meMoves', root), matchEl = $('#meMatch', root);
    const over = $('#meOver', root), textEl = $('#meText', root);
    const timers = [];
    let deck, flipped, lock, moves, matched;

    function build(){
      deck = shuffle([...ICONS, ...ICONS]);
      flipped = [];
      lock = false;
      moves = 0;
      matched = 0;
      movesEl.textContent = '0';
      matchEl.textContent = '0/8';
      over.classList.add('hidden');
      grid.innerHTML = '';
      deck.forEach(ic => {
        const c = document.createElement('div');
        c.className = 'mem-card';
        c.innerHTML = `<div class="mem-inner">
          <div class="mem-face mem-front">؟</div>
          <div class="mem-face mem-back">${ic}</div>
        </div>`;
        c.addEventListener('click', () => flip(c, ic));
        grid.appendChild(c);
      });
    }

    function flip(card, ic){
      if (lock || card.classList.contains('flipped') || card.classList.contains('done')) return;
      card.classList.add('flipped');
      Sound.click();
      flipped.push({ card, ic });
      if (flipped.length === 2){
        moves++;
        movesEl.textContent = moves;
        lock = true;
        const [a, b] = flipped;
        if (a.ic === b.ic){
          a.card.classList.add('done');
          b.card.classList.add('done');
          matched++;
          matchEl.textContent = `${matched}/8`;
          flipped = [];
          lock = false;
          Sound.pop();
          if (matched === 8){
            const id = setTimeout(() => {
              textEl.textContent = `با ${moves} حرکت تمومش کردی! 🏆`;
              over.classList.remove('hidden');
              Sound.win();
              Confetti.start(80);
              PlayerStats.win();
              const score = Math.max(0, 2000 - moves * 20);
              const rank = Leaderboard.submit('memory', score);
              if (rank && rank <= 5) Toast.success(`🏆 رتبه ${rank}!`);
              Achievements.unlock('first_game');
            }, 420);
            timers.push(id);
          }
        } else {
          const id = setTimeout(() => {
            a.card.classList.remove('flipped');
            b.card.classList.remove('flipped');
            flipped = [];
            lock = false;
          }, 760);
          timers.push(id);
        }
      }
    }

    $('#meRestart', root).addEventListener('click', build);
    build();
    return () => timers.forEach(clearTimeout);
  }
});