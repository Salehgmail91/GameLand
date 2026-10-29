/* =========================================================
   GameLand v4 — Audio
   Sound + Music + Sound Packs + Haptic
   ========================================================= */

'use strict';

/* =========================================================
   Sound Engine — Web Audio
   ========================================================= */
const Sound = {
  ctx: null,
  master: null,
  musicGain: null,
  sfxGain: null,

  enabled: true,
  volume: 0.6,
  musicVolume: 0.3,
  unlocked: false,

  currentPack: 'classic',
  currentMusic: null,
  musicBuffer: null,
  musicSource: null,

  /* ========== Init ========== */
  init() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;

      this.ctx = new AC();

      // Master gain
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);

      // SFX gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 1;
      this.sfxGain.connect(this.master);

      // Music gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.master);

      Log.debug('AudioContext created');
      return true;
    } catch (e) {
      Log.warn('AudioContext failed:', e);
      return false;
    }
  },

  /* ========== Unlock (iOS/Safari) ========== */
  unlock() {
    if (this.unlocked) return;
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.unlocked = true;
        Log.debug('Audio unlocked');
      }).catch(() => {});
    } else {
      this.unlocked = true;
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  },

  /* ========== Play a note ========== */
  play(freq = 440, duration = 0.1, type = 'sine', volume = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.resume();

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // silent fail
    }
  },

  /* ========== Play multiple notes (chord) ========== */
  chord(freqs, duration = 0.2, type = 'sine', volume = 0.08, gap = 40) {
    freqs.forEach((f, i) => {
      setTimeout(() => this.play(f, duration, type, volume), i * gap);
    });
  },

  /* ========== Play sequence ========== */
  sequence(notes, interval = 100, duration = 0.15, type = 'sine', volume = 0.1) {
    notes.forEach((f, i) => {
      setTimeout(() => this.play(f, duration, type, volume), i * interval);
    });
  },

  /* ========== SFX (بسته به Pack) ========== */
  get pack() {
    return PACKS[this.currentPack] || PACKS.classic;
  },

  click()  { this.pack.click(this); },
  pop()    { this.pack.pop(this); },
  bounce() { this.pack.bounce(this); },
  win()    { this.pack.win(this); },
  lose()   { this.pack.lose(this); },
  levelUp(){ this.pack.levelUp(this); },
  coin()   { this.pack.coin(this); },
  unlock() { this.pack.unlock(this); },
  error()  { this.pack.error(this); },
  tick()   { this.play(1200, 0.02, 'square', 0.03); },

  /* ========== Volume ========== */
  setVolume(v) {
    this.volume = clamp(v, 0, 1);
    if (this.master) this.master.gain.value = this.volume;
    Settings.set('volume', this.volume);
  },

  setMusicVolume(v) {
    this.musicVolume = clamp(v, 0, 1);
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
    Settings.set('musicVolume', this.musicVolume);
  },

  setEnabled(on) {
    this.enabled = !!on;
    Settings.set('sound', this.enabled);
    if (this.master) {
      this.master.gain.value = this.enabled ? this.volume : 0;
    }
  },

  setPack(name) {
    if (PACKS[name]) {
      this.currentPack = name;
      Settings.set('soundPack', name);
    }
  },

  /* ========== Music ========== */
  async playMusic(url, loop = true) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      if (this.musicSource) {
        try { this.musicSource.stop(); } catch {}
        this.musicSource = null;
      }

      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const audioBuf = await this.ctx.decodeAudioData(buf);

      const src = this.ctx.createBufferSource();
      src.buffer = audioBuf;
      src.loop = loop;
      src.connect(this.musicGain);
      src.start();

      this.musicSource = src;
      this.currentMusic = url;
      Log.debug('Music playing:', url);
    } catch (e) {
      Log.warn('Music load failed:', e);
    }
  },

  stopMusic() {
    if (this.musicSource) {
      try { this.musicSource.stop(); } catch {}
      this.musicSource = null;
      this.currentMusic = null;
    }
  },

  pauseMusic() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  },

  resumeMusic() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  /* ========== Haptic ========== */
  vibrate(pattern = 10) {
    if (!Settings.get('haptic', true)) return;
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch {}
    }
  }
};

/* =========================================================
   Sound Packs
   ========================================================= */
const PACKS = {
  classic: {
    click(s)  { s.play(600, 0.05, 'sine', 0.06); },
    pop(s)    { s.play(880, 0.08, 'triangle', 0.08); },
    bounce(s) { s.play(400, 0.04, 'square', 0.05); },
    win(s)    { s.chord([523, 659, 784, 1046], 0.18, 'sine', 0.1); },
    lose(s)   {
      s.play(300, 0.2, 'sawtooth', 0.08);
      setTimeout(() => s.play(200, 0.3, 'sawtooth', 0.08), 150);
    },
    levelUp(s) { s.chord([440, 554, 659, 880], 0.15, 'triangle', 0.09); },
    coin(s)    { s.chord([988, 1319], 0.1, 'sine', 0.08, 80); },
    unlock(s)  { s.chord([659, 784, 1046, 1319], 0.2, 'sine', 0.1, 60); },
    error(s)   { s.play(200, 0.15, 'square', 0.06); }
  },

  '8bit': {
    click(s)  { s.play(600, 0.03, 'square', 0.08); },
    pop(s)    { s.play(900, 0.06, 'square', 0.1); },
    bounce(s) { s.play(400, 0.03, 'square', 0.08); },
    win(s)    { s.chord([523, 659, 784, 1046], 0.15, 'square', 0.1, 60); },
    lose(s)   {
      s.play(400, 0.15, 'square', 0.1);
      setTimeout(() => s.play(200, 0.25, 'square', 0.1), 100);
    },
    levelUp(s) { s.chord([440, 554, 659, 880], 0.12, 'square', 0.1, 50); },
    coin(s)    { s.chord([988, 1319], 0.08, 'square', 0.1, 60); },
    unlock(s)  { s.chord([659, 784, 1046, 1319], 0.15, 'square', 0.1, 50); },
    error(s)   { s.play(150, 0.12, 'square', 0.08); }
  },

  modern: {
    click(s)  { s.play(800, 0.04, 'sine', 0.05); },
    pop(s)    { s.chord([880, 1320], 0.08, 'sine', 0.06, 30); },
    bounce(s) { s.play(500, 0.03, 'triangle', 0.04); },
    win(s)    { s.chord([523, 659, 784, 1046, 1318], 0.2, 'sine', 0.08, 50); },
    lose(s)   {
      s.play(400, 0.2, 'sine', 0.06);
      setTimeout(() => s.play(300, 0.3, 'sine', 0.06), 150);
    },
    levelUp(s) { s.chord([659, 880, 1046, 1318], 0.15, 'sine', 0.08, 40); },
    coin(s)    { s.chord([1318, 1975], 0.1, 'sine', 0.07, 60); },
    unlock(s)  { s.chord([880, 1174, 1568, 2093], 0.25, 'sine', 0.08, 50); },
    error(s)   { s.play(250, 0.15, 'sine', 0.05); }
  }
};

/* =========================================================
   Ambient Music Manager
   ========================================================= */
const Music = {
  current: null,
  tracks: {
    hub:    '/gameland/assets/sounds/music/ambient.mp3',
    game:   '/gameland/assets/sounds/music/upbeat.mp3'
  },

  play(track) {
    if (!Settings.get('music', false)) return;
    const url = this.tracks[track] || track;
    if (!url) return;
    Sound.playMusic(url, true);
    this.current = track;
  },

  stop() {
    Sound.stopMusic();
    this.current = null;
  },

  toggle() {
    const on = !Settings.get('music', false);
    Settings.set('music', on);
    if (on && this.current) this.play(this.current);
    else this.stop();
    return on;
  }
};

/* =========================================================
   Unlock خودکار روی اولین تعامل کاربر
   ========================================================= */
['click', 'touchstart', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => Sound.unlock(), { once: true, passive: true });
});

/* تنظیمات اولیه */
(function initAudio() {
  const soundOn = Settings.get('sound', true);
  const musicVol = Settings.get('musicVolume', 0.3);
  const vol = Settings.get('volume', 0.6);
  const pack = Settings.get('soundPack', 'classic');

  Sound.enabled = soundOn;
  Sound.volume = vol;
  Sound.musicVolume = musicVol;
  Sound.currentPack = pack;
})();

Log.info('Audio loaded');