/* =====================================================
   TIME ECHO PLATFORMER v4 — sounds.js
   Upgraded: richer SFX, BGM untouched (it's goated)
   ===================================================== */
window.TEP = window.TEP || {};

TEP.Sound = (() => {
  let actx = null;
  let masterGain = null;
  let bgmGain = null;
  let sfxGain = null;

  let bgmNodes = [];
  let bgmRunning = false;
  let bgmInterval = null;

  let enabled = true;
  let sfxEnabled = true;
  let bgmEnabled = true;

  let currentTheme = 'cave';

  let bgmAudio = null;
  let useCustomBGM = false;

  let masterVol = 0.5;
  let bgmVol = 0.35;
  let sfxVol = 0.7;

  function tryResume() {
    if (actx && actx.state === 'suspended') actx.resume();
    if (bgmAudio && bgmAudio.paused) {
      bgmAudio.play().catch(err => console.log('BGM play error:', err));
    }
  }

  function init() {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();

      masterGain = actx.createGain();
      masterGain.gain.value = masterVol;
      masterGain.connect(actx.destination);

      bgmGain = actx.createGain();
      bgmGain.gain.value = bgmVol;
      bgmGain.connect(masterGain);

      sfxGain = actx.createGain();
      sfxGain.gain.value = sfxVol;
      sfxGain.connect(masterGain);

      document.addEventListener('keydown', tryResume, { once: true });
      document.addEventListener('click', tryResume, { once: true });
    } catch (e) {
      console.warn('[Sound] Web Audio not available:', e.message);
    }
  }

  // ── Custom BGM ──────────────────────────────────────
  function loadCustomBGM(src) {
    if (bgmAudio) { bgmAudio.pause(); bgmAudio = null; }
    bgmAudio = new Audio(src);
    bgmAudio.loop = true;
    bgmAudio.volume = bgmVol * masterVol;
  }

  function playCustomBGM() {
    if (!bgmAudio || !bgmEnabled) return;
    bgmAudio.currentTime = 0;
    bgmAudio.play().catch(() => {});
  }

  function stopCustomBGM() {
    if (bgmAudio) { bgmAudio.pause(); bgmAudio.currentTime = 0; }
  }

  // ── Core synthesis helpers ──────────────────────────
  function tone(freq, type, start, dur, vol = 0.3, rampEnd = 0.001, dest = null) {
    if (!actx || !enabled) return null;
    tryResume();
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, actx.currentTime + start);
    g.gain.setValueAtTime(vol, actx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(rampEnd, actx.currentTime + start + dur);
    osc.connect(g);
    g.connect(dest || sfxGain);
    osc.start(actx.currentTime + start);
    osc.stop(actx.currentTime + start + dur);
    return osc;
  }

  function toneSlide(freqStart, freqEnd, type, start, dur, vol = 0.3, dest = null) {
    if (!actx || !enabled) return null;
    tryResume();
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freqStart, actx.currentTime + start);
    osc.frequency.linearRampToValueAtTime(freqEnd, actx.currentTime + start + dur);
    g.gain.setValueAtTime(vol, actx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + start + dur);
    osc.connect(g);
    g.connect(dest || sfxGain);
    osc.start(actx.currentTime + start);
    osc.stop(actx.currentTime + start + dur);
    return osc;
  }

  function noiseNode(dur, vol = 0.2, filterFreq = 800, filterType = 'bandpass', dest = null) {
    if (!actx || !enabled) return;
    tryResume();
    const bufSize = actx.sampleRate * dur;
    const buf = actx.createBuffer(1, bufSize, actx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = actx.createBufferSource();
    src.buffer = buf;
    const g = actx.createGain();
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    const filter = actx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    src.connect(filter);
    filter.connect(g);
    g.connect(dest || sfxGain);
    src.start();
    src.stop(actx.currentTime + dur);
  }

  function chord(freqs, type, start, dur, vol = 0.15, dest = null) {
    freqs.forEach(f => tone(f, type, start, dur, vol, 0.001, dest));
  }

  // ── SFX Library ─────────────────────────────────────
  const SFX = {

    // ── Movement ──────────────────────────────────────
    jump() {
      if (!sfxEnabled) return;
      // Springy 3-stage jump tone
      toneSlide(180, 420, 'square', 0,    0.05, 0.28);
      toneSlide(420, 600, 'sine',   0.04, 0.08, 0.18);
      tone(800, 'sine', 0.10, 0.07, 0.10);
    },

    doubleJump() {
      if (!sfxEnabled) return;
      // Higher, twinklier than normal jump
      toneSlide(300, 700, 'sine', 0,    0.04, 0.22);
      toneSlide(700, 950, 'sine', 0.03, 0.07, 0.18);
      chord([1100, 1320, 1760], 'sine', 0.08, 0.12, 0.08);
    },

    land() {
      if (!sfxEnabled) return;
      // Thud with low body + surface crunch
      tone(55, 'sine', 0, 0.12, 0.40);
      tone(90, 'square', 0, 0.06, 0.25);
      noiseNode(0.08, 0.20, 400, 'lowpass');
    },

    landHard() {
      if (!sfxEnabled) return;
      tone(40, 'sine', 0, 0.18, 0.50);
      noiseNode(0.14, 0.35, 300, 'lowpass');
      noiseNode(0.06, 0.20, 1200, 'highpass');
    },

    step() {
      if (!sfxEnabled) return;
      noiseNode(0.03, 0.06, 600, 'bandpass');
    },

    // ── Collectibles ──────────────────────────────────
    coinCollect() {
      if (!sfxEnabled) return;
      // Classic coin ding with shimmer
      tone(880,  'sine', 0,    0.06, 0.30);
      tone(1320, 'sine', 0.04, 0.10, 0.25);
      tone(1760, 'sine', 0.08, 0.10, 0.15);
    },

    shardCollect() {
      if (!sfxEnabled) return;
      // Crystal-like - higher and more complex
      chord([660, 990, 1320], 'sine', 0,    0.06, 0.16);
      chord([880, 1320, 1760], 'sine', 0.05, 0.12, 0.12);
      tone(2200, 'sine', 0.10, 0.18, 0.08);
    },

    // ── Echo system ───────────────────────────────────
    echoStart() {
      if (!sfxEnabled) return;
      // Recording begins - rising beep + hum
      toneSlide(300, 550, 'sine', 0,    0.08, 0.22);
      tone(440, 'square', 0.06, 0.04, 0.10);
      tone(880, 'sine',   0.08, 0.06, 0.08);
    },

    echoStop() {
      if (!sfxEnabled) return;
      // Recording ends - descend + click
      toneSlide(550, 220, 'sine', 0,    0.10, 0.22);
      tone(110, 'square', 0.08, 0.05, 0.15);
      noiseNode(0.04, 0.10, 900, 'bandpass');
    },

    echoPlay() {
      if (!sfxEnabled) return;
      // Echo becomes active - ghostly shimmer
      chord([330, 495, 660], 'sine', 0,    0.05, 0.10);
      chord([440, 660, 880], 'sine', 0.04, 0.10, 0.08);
      toneSlide(660, 990, 'sine', 0.08, 0.15, 0.06);
    },

    echoExpire() {
      if (!sfxEnabled) return;
      // Echo runs out - dissolve sound
      toneSlide(440, 180, 'sine',   0,    0.18, 0.15);
      toneSlide(330, 110, 'square', 0.04, 0.16, 0.10);
      noiseNode(0.20, 0.08, 600, 'bandpass');
    },

    // ── Hazards & Damage ──────────────────────────────
    death() {
      if (!sfxEnabled) return;
      // Multi-stage dramatic death chord descent
      [440, 370, 311, 261, 220, 165, 110].forEach((f, i) =>
        tone(f, 'square', i * 0.055, 0.10, 0.28)
      );
      noiseNode(0.50, 0.35, 500, 'lowpass');
      tone(40, 'sine', 0, 0.6, 0.45);
      // Cymbal crash
      noiseNode(0.08, 0.25, 4000, 'highpass');
    },

    hit() {
      if (!sfxEnabled) return;
      // Sharp hit - metallic clang
      toneSlide(800, 200, 'square', 0,    0.06, 0.30);
      noiseNode(0.06, 0.20, 1500, 'bandpass');
      tone(120, 'sine', 0.02, 0.10, 0.20);
    },

    lavaTouch() {
      if (!sfxEnabled) return;
      // Sizzle + roar
      noiseNode(0.12, 0.40, 300, 'lowpass');
      noiseNode(0.08, 0.25, 3000, 'highpass');
      toneSlide(200, 60, 'sawtooth', 0, 0.20, 0.25);
    },

    spikeHit() {
      if (!sfxEnabled) return;
      // Sharp metallic pierce
      tone(1200, 'sawtooth', 0,    0.02, 0.30);
      toneSlide(800, 100, 'square', 0.01, 0.08, 0.25);
      noiseNode(0.05, 0.15, 2000, 'bandpass');
    },

    laserHit() {
      if (!sfxEnabled) return;
      toneSlide(1800, 400, 'sawtooth', 0,    0.06, 0.25);
      toneSlide(900,  200, 'sine',     0.03, 0.10, 0.18);
      noiseNode(0.04, 0.15, 2500, 'highpass');
    },

    // ── Puzzle / Interaction ──────────────────────────
    switchActivate() {
      if (!sfxEnabled) return;
      // Satisfying clunk + confirmation chord
      tone(180, 'square', 0,    0.05, 0.30);
      tone(240, 'square', 0.04, 0.05, 0.22);
      chord([440, 550, 660], 'sine', 0.07, 0.15, 0.10);
    },

    switchDeactivate() {
      if (!sfxEnabled) return;
      tone(240, 'square', 0,    0.05, 0.25);
      tone(180, 'square', 0.04, 0.05, 0.20);
      toneSlide(330, 220, 'sine', 0.07, 0.12, 0.08);
    },

    doorOpen() {
      if (!sfxEnabled) return;
      // Mechanical grind + open chord
      noiseNode(0.30, 0.20, 200, 'lowpass');
      toneSlide(100, 160, 'sawtooth', 0,    0.25, 0.18);
      chord([220, 330, 440, 660], 'sine', 0.25, 0.20, 0.10);
    },

    pressurePlate() {
      if (!sfxEnabled) return;
      tone(150, 'square', 0,    0.04, 0.25);
      tone(200, 'square', 0.03, 0.04, 0.18);
      noiseNode(0.06, 0.12, 500, 'bandpass');
    },

    // ── Level events ──────────────────────────────────
    levelComplete() {
      if (!sfxEnabled) return;
      // Fanfare - ascending arpeggiated chords
      const notes = [261, 330, 392, 523, 659, 784, 1047];
      notes.forEach((f, i) => tone(f, 'sine', i * 0.07, 0.18, 0.22));
      // Final chord
      chord([523, 659, 784, 1047], 'sine', notes.length * 0.07 + 0.05, 0.50, 0.14);
    },

    checkpoint() {
      if (!sfxEnabled) return;
      chord([440, 550, 660], 'sine', 0,    0.08, 0.15);
      chord([660, 880, 990], 'sine', 0.08, 0.15, 0.12);
    },

    // ── Enemy events ──────────────────────────────────
    enemyAlert() {
      if (!sfxEnabled) return;
      // Alarm blip
      tone(880, 'square', 0,    0.05, 0.20);
      tone(880, 'square', 0.07, 0.05, 0.20);
      tone(1100,'square', 0.14, 0.10, 0.15);
    },

    enemyHit() {
      if (!sfxEnabled) return;
      noiseNode(0.08, 0.25, 800, 'bandpass');
      toneSlide(600, 150, 'square', 0, 0.10, 0.20);
    },

    enemyDie() {
      if (!sfxEnabled) return;
      // Descend + crunch
      toneSlide(660, 110, 'sawtooth', 0,    0.20, 0.30);
      noiseNode(0.15, 0.25, 600, 'bandpass');
      chord([220, 165, 110], 'square', 0.12, 0.15, 0.15);
    },

    wispCorrupt() {
      if (!sfxEnabled) return;
      // Eerie glitching
      toneSlide(440, 880, 'sawtooth', 0,    0.04, 0.18);
      toneSlide(880, 220, 'sine',     0.03, 0.06, 0.14);
      toneSlide(220, 660, 'square',   0.08, 0.08, 0.12);
      noiseNode(0.12, 0.10, 1200, 'bandpass');
    },

    sentinelRewind() {
      if (!sfxEnabled) return;
      // Reverse tape whoosh
      toneSlide(800, 1600, 'sawtooth', 0,    0.06, 0.20);
      toneSlide(600, 1200, 'sine',     0.04, 0.10, 0.15);
      noiseNode(0.16, 0.15, 1000, 'bandpass');
    },

    paradoxCopy() {
      if (!sfxEnabled) return;
      // Distortion - evil clone
      chord([220, 233, 247], 'sawtooth', 0,    0.10, 0.20);
      chord([330, 349, 370], 'sawtooth', 0.08, 0.10, 0.15);
      noiseNode(0.15, 0.18, 800, 'bandpass');
    },

    slimeSplit() {
      if (!sfxEnabled) return;
      noiseNode(0.08, 0.20, 400, 'lowpass');
      toneSlide(200, 350, 'sine', 0,    0.06, 0.18);
      toneSlide(200, 150, 'sine', 0.02, 0.06, 0.14);
    },

    // ── UI ────────────────────────────────────────────
    uiClick() {
      if (!sfxEnabled) return;
      tone(440, 'square', 0, 0.04, 0.18);
      tone(550, 'sine',   0.02, 0.04, 0.10);
    },

    uiBack() {
      if (!sfxEnabled) return;
      tone(330, 'square', 0,    0.03, 0.15);
      tone(264, 'square', 0.03, 0.04, 0.12);
    },

    uiSuccess() {
      if (!sfxEnabled) return;
      chord([523, 659, 784], 'sine', 0,    0.08, 0.14);
      chord([659, 784, 988], 'sine', 0.08, 0.15, 0.10);
    },

    uiError() {
      if (!sfxEnabled) return;
      tone(220, 'square', 0,    0.06, 0.20);
      tone(196, 'square', 0.06, 0.10, 0.18);
    },

    uiPurchase() {
      if (!sfxEnabled) return;
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => tone(f, 'sine', i * 0.06, 0.12, 0.16));
    },

    // ── Ambient ───────────────────────────────────────
    lavaBubble() {
      if (!sfxEnabled) return;
      noiseNode(0.10, 0.12, 200, 'lowpass');
      toneSlide(120, 80, 'sine', 0, 0.12, 0.10);
    },

    iceSlide() {
      if (!sfxEnabled) return;
      noiseNode(0.15, 0.08, 2000, 'highpass');
      toneSlide(400, 200, 'sine', 0, 0.15, 0.06);
    },
  };

  // ── BGM ─────────────────────────────────────────────
  function startBGM(theme) {
    if (useCustomBGM) {
      stopBGM();
      if (!bgmAudio) loadCustomBGM('time-capsule.mp3');
      playCustomBGM();
      return;
    }
  }

  function stopBGM() {
    bgmRunning = false;
    if (bgmInterval) { clearTimeout(bgmInterval); bgmInterval = null; }
    bgmNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    bgmNodes = [];
    stopCustomBGM();
  }

  // ── Public API ──────────────────────────────────────
  return {
    init,
    sfx: SFX,

    startBGM,
    stopBGM,

    startMenuMusic() {
      useCustomBGM = false;
      stopCustomBGM();
    },

    setEnabled(v) {
      enabled = v;
      if (!v) stopBGM();
    },

    setBGMEnabled(v) {
      bgmEnabled = v;
      if (!v) stopBGM();
      else startBGM(currentTheme);
    },

    setSFXEnabled(v) { sfxEnabled = v; },

    setMasterVol(v) {
      masterVol = v;
      if (masterGain) masterGain.gain.value = v;
      if (bgmAudio) bgmAudio.volume = bgmVol * masterVol;
    },

    setBGMVol(v) {
      bgmVol = v;
      if (bgmGain) bgmGain.gain.value = v;
      if (bgmAudio) bgmAudio.volume = bgmVol * masterVol;
    },

    setSFXVol(v) {
      sfxVol = v;
      if (sfxGain) sfxGain.gain.value = v;
    },

    isEnabled() { return enabled; },
    tryResume,
  };
})();
