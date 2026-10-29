/* =========================================================
   GameLand v6 — Slot Machine (🎰 ماشین اسلات)
   ========================================================= */

GameLand.register('slot', {
  name: 'ماشین اسلات',
  emoji: '🎰',
  desc: 'شانست رو امتحان کن و سکه ببر!',
  tags: ['شانسی', 'آرکید', 'جدید'],
  color: '#f59e0b',

  init(root) {
    const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
    const BET_OPTIONS = [10, 25, 50, 100];
    const PAYOUTS = {
      '🍒': { 3: 5,  2: 2 },
      '🍋': { 3: 8,  2: 2 },
      '🍊': { 3: 12, 2: 3 },
      '🍇': { 3: 20, 2: 5 },
      '⭐': { 3: 50, 2: 10 },
      '💎': { 3: 100, 2: 20 },
      '7️⃣': { 3: 500, 2: 50 }
    };

    let bet = 25;
    let spinning = false;
    let reels = ['🍒', '🍒', '🍒'];

    // =====================================================
    // HTML
    // =====================================================
    root.innerHTML = `
      <div class="hud">
        <div class="hud-box"><span>موجودی</span><b id="slBalance">${Coins.balance()}</b></div>
        <div class="hud-box"><span>شرط</span><b id="slBet">${bet}</b></div>
        <div class="hud-box"><span>آخرین برد</span><b id="slWin">—</b></div>
      </div>

      <div class="slot-machine">
        <div class="slot-reels" id="slReels">
          <div class="slot-reel">
            <div class="slot-symbol" data-reel="0">🍒</div>
          </div>
          <div class="slot-reel">
            <div class="slot-symbol" data-reel="1">🍒</div>
          </div>
          <div class="slot-reel">
            <div class="slot-symbol" data-reel="2">🍒</div>
          </div>
        </div>

        <div class="slot-payline"></div>
      </div>

      <div class="slot-bets" id="slBets">
        ${BET_OPTIONS.map(b => `
          <button class="slot-bet-btn ${b === bet ? 'active' : ''}" data-bet="${b}">${b}</button>
        `).join('')}
      </div>

      <button class="btn primary slot-spin-btn" id="slSpin">
        🎰 بچرخون!
      </button>

      <div class="slot-paytable" id="slPaytable">
        <h4>🏆 جدول جوایز (۳ تایی)</h4>
        <div class="paytable-grid">
          ${Object.entries(PAYOUTS).map(([sym, p]) => `
            <div class="paytable-row">
              <span class="pt-symbols">${sym}${sym}${sym}</span>
              <span class="pt-payout">×${p[3]}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // =====================================================
    // Elements
    // =====================================================
    const balanceEl = $('#slBalance', root);
    const betEl = $('#slBet', root);
    const winEl = $('#slWin', root);
    const reelsEl = $('#slReels', root);
    const spinBtn = $('#slSpin', root);
    const betsContainer = $('#slBets', root);
    const symbols = $$('.slot-symbol', root);

    // =====================================================
    // Update balance display
    // =====================================================
    function updateBalance() {
      const bal = Coins.balance();
      balanceEl.textContent = bal;
      if (bal < bet) {
        spinBtn.disabled = true;
        spinBtn.classList.add('disabled');
        spinBtn.textContent = '🪙 سکه کافی نداری';
      } else {
        spinBtn.disabled = false;
        spinBtn.classList.remove('disabled');
        spinBtn.textContent = '🎰 بچرخون!';
      }
    }

    // =====================================================
    // Random symbol
    // =====================================================
    function rndSymbol() {
      return choice(SYMBOLS);
    }

    // =====================================================
    // Check win
    // =====================================================
    function checkWin(results) {
      const [a, b, c] = results;

      // ۳ تایی
      if (a === b && b === c) {
        const mult = PAYOUTS[a]?.[3] || 1;
        return { win: bet * mult, mult, type: 3, symbol: a };
      }

      // ۲ تایی (اول و دوم یا اول و سوم یا دوم و سوم)
      const pairs = [
        [a, b], [a, c], [b, c]
      ];
      for (const [x, y] of pairs) {
        if (x === y && PAYOUTS[x]?.[2]) {
          return { win: bet * PAYOUTS[x][2], mult: PAYOUTS[x][2], type: 2, symbol: x };
        }
      }

      return { win: 0, type: 0 };
    }

    // =====================================================
    // Animate reel spin
    // =====================================================
    function spinReel(index, finalSymbol, duration) {
      return new Promise(resolve => {
        const symbolEl = symbols[index];
        const startTime = performance.now();
        let lastChange = 0;
        let changeInterval = 50;

        function frame(now) {
          const elapsed = now - startTime;

          // سرعت تغییر نماد کم‌کم زیاد می‌شه
          if (elapsed > duration * 0.7) {
            changeInterval = 50 + (elapsed - duration * 0.7) * 0.5;
          }

          if (elapsed - lastChange > changeInterval) {
            symbolEl.textContent = rndSymbol();
            lastChange = elapsed;
          }

          if (elapsed < duration) {
            requestAnimationFrame(frame);
          } else {
            symbolEl.textContent = finalSymbol;
            symbolEl.classList.add('settled');
            setTimeout(() => symbolEl.classList.remove('settled'), 500);
            resolve();
          }
        }

        requestAnimationFrame(frame);
      });
    }

    // =====================================================
    // Main spin
    // =====================================================
    async function spin() {
      if (spinning) return;
      if (!Coins.has(bet)) {
        Toast.warn('🪙 سکه کافی نداری!');
        if (typeof AnimPro !== 'undefined') {
          AnimPro.shake(spinBtn, 5, 400);
        }
        return;
      }

      spinning = true;
      spinBtn.disabled = true;
      spinBtn.textContent = '⏳ در حال چرخش...';

      // کسر شرط
      Coins.spend(bet, 'اسلات');
      updateBalance();

      // تولید نتیجه
      const results = [rndSymbol(), rndSymbol(), rndSymbol()];

      // شروع انیمیشن
      Sound.click();

      // هر چرخ با تاخیر شروع می‌شه
      const promises = [
        spinReel(0, results[0], 1200),
        new Promise(r => setTimeout(() => r(spinReel(1, results[1], 1400)), 200)),
        new Promise(r => setTimeout(() => r(spinReel(2, results[2], 1600)), 400))
      ];

      await Promise.all(promises);

      // ============================================
      // نتیجه
      // ============================================
      const result = checkWin(results);

      if (result.win > 0) {
        // 🎉 برد
        Coins.add(result.win, `اسلات (${result.type} تایی)`);

        winEl.textContent = `+${result.win}`;
        winEl.style.color = '#22c55e';

        Sound.win();
        Toast.success(`🎉 بردی! +${result.win} 🪙 (${result.type} تایی)`);

        // 🆕 انیمیشن‌ها
        if (typeof AnimPro !== 'undefined') {
          AnimPro.particleBurst(spinBtn, {
            count: result.type === 3 ? 40 : 20,
            colors: result.type === 3
              ? ['#eab308', '#f59e0b', '#fbbf24']
              : ['#22c55e', '#16a34a']
          });

          if (result.type === 3) {
            AnimPro.flash('#eab308', 300);
            AnimPro.screenShake(5, 400);
            setTimeout(() => {
              AnimPro.confettiPro('coins', {
                count: 20,
                origin: { x: innerWidth / 2, y: innerHeight / 3 }
              });
            }, 300);
          }
        }

        if (typeof Confetti !== 'undefined' && result.type === 3) {
          Confetti.burst(80);
        }

        // 🆕 highlight روی چرخ‌ها
        reelsEl.classList.add('win');
        setTimeout(() => reelsEl.classList.remove('win'), 1500);

      } else {
        // 😢 باخت
        winEl.textContent = '0';
        winEl.style.color = '#8b8ba3';

        if (typeof AnimPro !== 'undefined') {
          AnimPro.shake(reelsEl, 4, 400);
        }
        Sound.lose();
      }

      // ثبت رکورد
      Leaderboard.submit('slot', Coins.balance());

      // پاک کردن نمایش برد بعد از ۳ ثانیه
      setTimeout(() => {
        winEl.textContent = '—';
        winEl.style.color = '';
      }, 3000);

      spinning = false;
      spinBtn.disabled = false;
      spinBtn.textContent = '🎰 بچرخون!';
      updateBalance();
    }

    // =====================================================
    // Event Listeners
    // =====================================================
    spinBtn.addEventListener('click', spin);

    // انتخاب شرط
    betsContainer.addEventListener('click', e => {
      const btn = e.target.closest('.slot-bet-btn');
      if (!btn || spinning) return;

      bet = +btn.dataset.bet;
      betEl.textContent = bet;

      betsContainer.querySelectorAll('.slot-bet-btn').forEach(b => {
        b.classList.toggle('active', +b.dataset.bet === bet);
      });

      Sound.click();
      updateBalance();
    });

    // Space = Spin
    const onKey = e => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener('keydown', onKey);

    // =====================================================
    // Init
    // =====================================================
    updateBalance();

    // نمایش اولیه
    symbols.forEach(s => s.textContent = rndSymbol());

    // =====================================================
    // Cleanup
    // =====================================================
    return () => {
      window.removeEventListener('keydown', onKey);
      spinning = true;
    };
  }
});

Log.info('Slot Machine loaded');