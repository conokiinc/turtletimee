/* =====================================================================
   audio.js — original synthesised music & sound effects (Web Audio)
   Everything is generated in code: no audio files, no licensing issues.
   Audio starts only after the player's first click (browser rule).
   Volumes: master, music, sfx (+ mute), saved with the game.
   ===================================================================== */
(function (G) {
  'use strict';
  let ac = null, master, musicBus, sfxBus, noiseBuf, musicFilter;
  const A = { ready: false, song: null, songName: '' };

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    try {
      ac = new Ctx();
      master = ac.createGain(); musicBus = ac.createGain(); sfxBus = ac.createGain();
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
      // music goes through an optional low-pass (fully open unless a world asks for the 'underwater' sound)
      musicFilter = ac.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 20000; musicFilter.Q.value = 0.5;
      musicBus.connect(musicFilter); musicFilter.connect(master); sfxBus.connect(master); master.connect(comp); comp.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      A.ready = true; applyVolumes();
      return true;
    } catch (e) { console.warn('Audio unavailable', e); return false; }
  }
  function applyVolumes() {
    if (!ac) return;
    const s = G.Save.data.settings, t = ac.currentTime;
    master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.02);
    musicBus.gain.setTargetAtTime(s.music * 1.4, t, 0.02);
    sfxBus.gain.setTargetAtTime(s.sfx * 2.0, t, 0.02);
  }

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  /* one synth voice with an ADSR-ish envelope */
  function tone(bus, freq, t, dur, o) {
    o = o || {};
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + (o.slideT || dur));
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib; lg.gain.value = freq * 0.02; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.1); }
    const v = o.vol == null ? 0.2 : o.vol, a = o.a || 0.005, r = o.r || 0.08;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.setTargetAtTime(v * (o.sus == null ? 0.6 : o.sus), t + a, (o.d || 0.08));
    g.gain.setTargetAtTime(0.0001, t + dur, r / 3);
    let node = osc;
    if (o.filter) { const f = ac.createBiquadFilter(); f.type = o.filterType || 'lowpass'; f.frequency.value = o.filter; f.Q.value = o.q || 0.7; osc.connect(f); node = f; }
    node.connect(g); g.connect(bus);
    osc.start(t); osc.stop(t + dur + r + 0.05);
  }
  function noise(bus, t, dur, o) {
    o = o || {};
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1200, t); f.Q.value = o.q || 1;
    if (o.fTo) f.frequency.exponentialRampToValueAtTime(o.fTo, t + dur);
    const g = ac.createGain(); const v = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (o.a || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }

  /* ---------------- sound effects ---------------- */
  const SFX = {
    click(t) { tone(sfxBus, 880, t, 0.03, { type: 'triangle', vol: 0.12 }); },
    hover(t) { tone(sfxBus, 1320, t, 0.02, { type: 'sine', vol: 0.05 }); },
    confirm(t) { tone(sfxBus, 660, t, 0.06, { type: 'triangle', vol: 0.15 }); tone(sfxBus, 990, t + 0.06, 0.09, { type: 'triangle', vol: 0.15 }); },
    back(t) { tone(sfxBus, 520, t, 0.06, { type: 'triangle', vol: 0.12, slide: 330 }); },
    text(t) { tone(sfxBus, 500 + Math.random() * 120, t, 0.018, { type: 'square', vol: 0.035, filter: 2200 }); },
    textTT(t) { tone(sfxBus, 260 + Math.random() * 40, t, 0.03, { type: 'triangle', vol: 0.06 }); },
    quack(t) {   // cartoon quack: nasal saw through a formant filter, two syllables
      for (const [dt, f0, f1, d] of [[0, 620, 420, 0.09], [0.1, 560, 300, 0.13]]) {
        tone(sfxBus, f0, t + dt, d, { type: 'sawtooth', vol: 0.55, slide: f1, filter: 1300, filterType: 'bandpass', q: 3, r: 0.04 });
        tone(sfxBus, f0 * 2, t + dt, d, { type: 'square', vol: 0.12, slide: f1 * 2, filter: 2600, filterType: 'bandpass', q: 4, r: 0.04 });
      }
    },
    jump(t) { tone(sfxBus, 330, t, 0.12, { type: 'square', vol: 0.12, slide: 700, filter: 2400 }); },
    land(t) { noise(sfxBus, t, 0.08, { f: 300, q: 0.8, vol: 0.18, type: 'lowpass' }); },
    step(t) { noise(sfxBus, t, 0.04, { f: 900, q: 2, vol: 0.05 }); },
    knife(t) { noise(sfxBus, t, 0.14, { f: 2500, fTo: 6000, q: 2, vol: 0.18, type: 'highpass' }); tone(sfxBus, 2400, t + 0.02, 0.12, { type: 'sine', vol: 0.06, sus: 0.3 }); },
    shing(t) { tone(sfxBus, 1800, t, 0.18, { type: 'triangle', vol: 0.1, slide: 2600, sus: 0.3 }); noise(sfxBus, t, 0.1, { f: 5000, q: 3, vol: 0.06 }); },
    thunk(t) { tone(sfxBus, 180, t, 0.06, { type: 'triangle', vol: 0.2, slide: 90 }); },
    pop(t) { tone(sfxBus, 500, t, 0.07, { type: 'sine', vol: 0.25, slide: 1400, slideT: 0.05 }); noise(sfxBus, t, 0.05, { f: 3000, vol: 0.08 }); },
    rip(t) { noise(sfxBus, t, 0.35, { f: 1800, fTo: 600, q: 0.6, vol: 0.25 }); },
    slipper(t) { [72, 76, 79, 84].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.06, 0.12, { type: 'triangle', vol: 0.16 })); },
    corn(t) { tone(sfxBus, midi(88), t, 0.05, { type: 'square', vol: 0.06, filter: 4000 }); tone(sfxBus, midi(93), t + 0.04, 0.06, { type: 'square', vol: 0.05, filter: 4000 }); },
    hurt(t) { tone(sfxBus, 420, t, 0.25, { type: 'square', vol: 0.16, slide: 120, filter: 1600 }); SFX.quack(t + 0.05); },
    faint(t) { [67, 63, 60, 55].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.16, 0.2, { type: 'triangle', vol: 0.15, vib: 6 })); },
    checkpoint(t) { [67, 71, 74, 79].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.05, 0.3, { type: 'triangle', vol: 0.12, sus: 0.4 })); },
    spring(t) { tone(sfxBus, 180, t, 0.3, { type: 'sine', vol: 0.3, slide: 720, slideT: 0.18, vib: 18 }); },
    splash(t) { noise(sfxBus, t, 0.45, { f: 900, fTo: 300, q: 0.5, vol: 0.3, type: 'lowpass' }); },
    door(t) { tone(sfxBus, 110, t, 0.25, { type: 'triangle', vol: 0.25 }); noise(sfxBus, t, 0.6, { f: 700, fTo: 2400, q: 0.5, vol: 0.12 }); },
    locked(t) { tone(sfxBus, 200, t, 0.08, { type: 'square', vol: 0.1, filter: 900 }); tone(sfxBus, 160, t + 0.1, 0.1, { type: 'square', vol: 0.1, filter: 900 }); },
    quote(t) { [79, 83, 86, 91, 95].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.07, 0.35, { type: 'sine', vol: 0.1, sus: 0.5 })); },
    achv(t) { [72, 79, 84].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.08, 0.25, { type: 'square', vol: 0.07, filter: 3000 })); },
    sparkle(t) { [96, 100, 103, 108].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.09, 0.25, { type: 'sine', vol: 0.07, sus: 0.3 })); },
    stamp(t) { noise(sfxBus, t, 0.3, { f: 120, q: 0.7, vol: 0.4, type: 'lowpass' }); tone(sfxBus, 70, t, 0.4, { type: 'sine', vol: 0.4, slide: 40 }); },
    whoosh(t) { noise(sfxBus, t, 0.5, { f: 400, fTo: 3000, q: 1.2, vol: 0.14 }); },
    pause(t) { tone(sfxBus, 784, t, 0.06, { type: 'triangle', vol: 0.1 }); tone(sfxBus, 523, t + 0.07, 0.08, { type: 'triangle', vol: 0.1 }); },
    // ---- World 2
    beep(t) { tone(sfxBus, 660, t, 0.16, { type: 'square', vol: 0.12, filter: 3000, sus: 0.8 }); },
    go(t) { tone(sfxBus, 1320, t, 0.4, { type: 'square', vol: 0.14, filter: 4000, sus: 0.8 }); tone(sfxBus, 660, t, 0.4, { type: 'triangle', vol: 0.12 }); },
    dive(t) { noise(sfxBus, t, 0.6, { f: 1400, fTo: 250, q: 0.6, vol: 0.32, type: 'lowpass' }); tone(sfxBus, 300, t, 0.3, { type: 'sine', vol: 0.15, slide: 90 }); },
    boost(t) { noise(sfxBus, t, 0.35, { f: 500, fTo: 2600, q: 1.5, vol: 0.2 }); for (let i = 0; i < 4; i++) tone(sfxBus, 500 + i * 160, t + i * 0.04, 0.05, { type: 'sine', vol: 0.08, slide: 1200 + i * 200, slideT: 0.04 }); },
    bonk(t) { tone(sfxBus, 320, t, 0.18, { type: 'sine', vol: 0.3, slide: 120, vib: 30 }); noise(sfxBus, t, 0.08, { f: 400, vol: 0.12, type: 'lowpass' }); },
    air(t) { tone(sfxBus, 700, t, 0.08, { type: 'sine', vol: 0.18, slide: 1600, slideT: 0.06 }); tone(sfxBus, 1000, t + 0.06, 0.08, { type: 'sine', vol: 0.14, slide: 2000, slideT: 0.06 }); },
    watch(t) { [88, 0, 88, 0, 95].forEach((n, i) => n && tone(sfxBus, midi(n), t + i * 0.05, 0.08, { type: 'square', vol: 0.14, filter: 5000 })); },
    buoy(t) { [79, 86, 91].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.02, 0.9, { type: 'sine', vol: 0.12, sus: 0.3, r: 0.6 })); },
    token(t) { tone(sfxBus, midi(88), t, 0.07, { type: 'square', vol: 0.07, filter: 5000 }); tone(sfxBus, midi(95), t + 0.07, 0.2, { type: 'square', vol: 0.07, filter: 5000, sus: 0.5 }); },
    timeup(t) { [67, 66, 65, 64].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.22, i === 3 ? 0.7 : 0.2, { type: 'sawtooth', vol: 0.09, filter: 1400, vib: i === 3 ? 6 : 0 })); },
    clunk(t) { tone(sfxBus, 90, t, 0.2, { type: 'square', vol: 0.15, filter: 600 }); noise(sfxBus, t + 0.05, 0.15, { f: 300, vol: 0.15, type: 'lowpass' }); },
    current(t) { noise(sfxBus, t, 0.5, { f: 300, fTo: 900, q: 0.8, vol: 0.06 }); },
    // ---- World 3
    shoot(t) { tone(sfxBus, 420 + Math.random() * 60, t, 0.06, { type: 'square', vol: 0.06, slide: 180, filter: 1800 }); noise(sfxBus, t, 0.06, { f: 1600, q: 1, vol: 0.06 }); },
    splat(t) { noise(sfxBus, t, 0.14, { f: 700, fTo: 260, q: 0.9, vol: 0.26, type: 'lowpass' }); },
    smudgePop(t) { tone(sfxBus, 700, t, 0.1, { type: 'sine', vol: 0.22, slide: 1500, slideT: 0.06 }); noise(sfxBus, t, 0.22, { f: 900, fTo: 300, q: 0.7, vol: 0.2, type: 'lowpass' }); },
    bump(t) { tone(sfxBus, 200, t, 0.15, { type: 'triangle', vol: 0.25, slide: 90 }); noise(sfxBus, t, 0.12, { f: 500, vol: 0.15, type: 'lowpass' }); },
    bombWarn(t) { [0, 0.25, 0.5, 0.7, 0.85, 0.95].forEach((d, i) => tone(sfxBus, 700 + i * 120, t + d, 0.07, { type: 'square', vol: 0.07, filter: 3000 })); },
    bombHit(t) { noise(sfxBus, t, 0.5, { f: 500, fTo: 120, q: 0.6, vol: 0.28, type: 'lowpass' }); tone(sfxBus, 90, t, 0.45, { type: 'sine', vol: 0.26, slide: 35 }); },
    ready(t) { [76, 81, 88].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.07, 0.25, { type: 'triangle', vol: 0.13, sus: 0.5 })); },
    special(t) { noise(sfxBus, t, 0.7, { f: 300, fTo: 4000, q: 1.2, vol: 0.22 }); [60, 67, 72, 79].forEach((n, i) => tone(sfxBus, midi(n), t + 0.05 * i, 0.4, { type: 'square', vol: 0.07, filter: 3200 })); },
    tally(t) { tone(sfxBus, 900 + Math.random() * 300, t, 0.03, { type: 'square', vol: 0.05, filter: 4000 }); },
    screenHit(t) { tone(sfxBus, 1200, t, 0.05, { type: 'square', vol: 0.06, filter: 3000 }); noise(sfxBus, t, 0.05, { f: 6000, q: 2, vol: 0.06 }); },
    lose(t) { [64, 60, 57, 52].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.25, i === 3 ? 0.8 : 0.22, { type: 'sawtooth', vol: 0.08, filter: 1200, vib: i === 3 ? 6 : 0 })); },
    win(t) { [60, 64, 67, 72, 67, 72, 76, 79].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.09, 0.2, { type: 'square', vol: 0.08, filter: 3500 })); },
    // ---- finale & birthday
    knock(t) { for (let i = 0; i < 3; i++) { tone(sfxBus, 150, t + i * 0.2, 0.07, { type: 'sine', vol: 0.26, slide: 90 }); noise(sfxBus, t + i * 0.2, 0.06, { f: 500, q: 1.2, vol: 0.14 }); } },
    unlock(t) { tone(sfxBus, 900, t, 0.04, { type: 'square', vol: 0.08, filter: 2500 }); tone(sfxBus, 600, t + 0.12, 0.05, { type: 'square', vol: 0.1, filter: 2000 }); noise(sfxBus, t + 0.12, 0.05, { f: 2500, vol: 0.08 }); },
    quest(t) { [60, 64, 67, 72, 0, 72, 76, 79, 84].forEach((n, i) => n && tone(sfxBus, midi(n), t + i * 0.11, i === 8 ? 0.9 : 0.16, { type: 'square', vol: 0.065, filter: 3600, sus: 0.7 })); [48, 55, 60].forEach(n => tone(sfxBus, midi(n), t + 0.88, 1.0, { type: 'triangle', vol: 0.09, sus: 0.8 })); },
    popper(t) { noise(sfxBus, t, 0.12, { f: 2000, q: 0.5, vol: 0.17 }); tone(sfxBus, 300, t, 0.08, { type: 'sine', vol: 0.14, slide: 1200, slideT: 0.06 }); for (let i = 0; i < 6; i++) tone(sfxBus, 1800 + Math.random() * 1600, t + 0.08 + i * 0.04, 0.05, { type: 'sine', vol: 0.04 }); },
    lights(t) { noise(sfxBus, t, 0.05, { f: 3000, q: 2, vol: 0.12 }); tone(sfxBus, 120, t, 0.06, { type: 'square', vol: 0.06, filter: 800 }); },
    blow(t) { noise(sfxBus, t, 0.9, { f: 900, fTo: 300, q: 0.4, vol: 0.22, type: 'lowpass', a: 0.08 }); },
    page(t) { noise(sfxBus, t, 0.25, { f: 3500, fTo: 1500, q: 0.8, vol: 0.06, type: 'bandpass', a: 0.04 }); },
    levelup(t) { [67, 72, 76, 79, 84, 88, 91].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.07, 0.3, { type: 'square', vol: 0.07, filter: 4200, sus: 0.6 })); tone(sfxBus, midi(96), t + 0.55, 0.9, { type: 'sine', vol: 0.1, sus: 0.6 }); },
    envelope(t) { [84, 88, 91].forEach((n, i) => tone(sfxBus, midi(n), t + i * 0.12, 0.5, { type: 'sine', vol: 0.08, sus: 0.4 })); },
  };
  A.sfx = function (name) {
    if (!A.ready || !SFX[name]) return;
    try { SFX[name](ac.currentTime + 0.005); } catch (e) { /* never let a sound break the game */ }
  };

  /* ---------------- music ----------------
     A tiny step sequencer. Each song: bpm, steps per bar (16ths), and
     tracks of patterns. Notes are MIDI numbers; 0 = rest. */
  const SONGS = {
    // title: bright, bouncy, mint
    title: { bpm: 118, swing: 0.08, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]],
      lead: [76, 0, 79, 0, 81, 79, 76, 0, 74, 0, 76, 0, 72, 0, 0, 0, 72, 0, 74, 0, 76, 74, 72, 0, 69, 0, 72, 0, 74, 0, 0, 0,
        69, 0, 72, 0, 77, 76, 74, 0, 72, 0, 74, 0, 76, 0, 0, 0, 74, 0, 76, 0, 79, 0, 77, 76, 74, 0, 71, 0, 74, 0, 0, 0],
      leadType: 'square', drums: 'pop' },
    // opening story: gentle, curious, a little mysterious
    story: { bpm: 92, swing: 0, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]],
      lead: [0, 0, 76, 0, 0, 0, 74, 0, 72, 0, 0, 0, 71, 0, 0, 0, 0, 0, 72, 0, 0, 0, 74, 0, 76, 0, 0, 0, 79, 0, 0, 0,
        0, 0, 77, 0, 0, 0, 76, 0, 74, 0, 0, 0, 72, 0, 0, 0, 0, 0, 71, 0, 72, 0, 74, 0, 71, 0, 0, 0, 0, 0, 0, 0],
      leadType: 'triangle', drums: 'soft', arp: true },
    // World 1: bubbly bathroom bounce — plucky, splashy, a bit sneaky (slipper heist)
    world1: { bpm: 128, swing: 0.12, chords: [[62, 65, 69, 72], [67, 71, 74, 77], [60, 64, 67, 71], [57, 60, 64, 67]],
      lead: [74, 0, 0, 77, 0, 0, 74, 0, 72, 0, 74, 0, 69, 0, 0, 0, 71, 0, 0, 74, 0, 0, 71, 0, 67, 0, 69, 0, 71, 0, 74, 0,
        72, 0, 0, 76, 0, 0, 72, 0, 71, 0, 72, 0, 67, 0, 64, 0, 69, 0, 72, 0, 76, 0, 74, 0, 72, 0, 69, 0, 0, 0, 0, 0],
      leadType: 'square', drums: 'bounce', bubbles: true, bass: 'walk' },
    // short victory jingle loop for results
    // World 2: a bright, driving pool race — rippling arpeggios, syncopated bass, splashy hats
    world2: { bpm: 142, swing: 0, chords: [[65, 69, 72, 76], [62, 65, 69, 72], [70, 74, 77, 81], [72, 76, 79, 84]],
      lead: [77, 0, 0, 76, 0, 0, 72, 0, 74, 0, 76, 0, 0, 0, 0, 0, 74, 0, 0, 72, 0, 0, 69, 0, 72, 0, 74, 0, 0, 0, 0, 0,
        77, 0, 0, 79, 0, 0, 81, 0, 0, 0, 79, 0, 77, 0, 74, 0, 79, 0, 0, 77, 0, 0, 76, 0, 72, 0, 0, 0, 0, 0, 0, 0],
      leadType: 'triangle', drums: 'race', bass: 'sync', ripple: true },
    // after the race: lazy floatie bossa under a hot sun
    floatie: { bpm: 96, swing: 0.15, chords: [[65, 69, 72, 76], [64, 67, 71, 74], [62, 65, 69, 72], [67, 71, 74, 77]],
      lead: [81, 0, 0, 79, 0, 0, 77, 0, 0, 0, 76, 0, 0, 0, 0, 0, 74, 0, 0, 76, 0, 0, 77, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        79, 0, 0, 77, 0, 0, 76, 0, 0, 0, 74, 0, 0, 0, 72, 0, 74, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      leadType: 'sine', drums: 'soft', arp: true },
    // World 3: the finale — punchy four-on-the-floor, octave bass, bright square hooks
    world3: { bpm: 150, swing: 0, chords: [[57, 60, 64, 67], [53, 57, 60, 64], [60, 64, 67, 71], [55, 59, 62, 67]],
      lead: [69, 0, 72, 0, 76, 0, 72, 76, 0, 79, 0, 76, 74, 0, 72, 0, 69, 0, 72, 0, 77, 0, 76, 74, 0, 72, 0, 69, 72, 0, 0, 0,
        72, 0, 76, 0, 79, 0, 76, 79, 0, 83, 0, 79, 76, 0, 74, 0, 74, 0, 72, 0, 71, 0, 72, 74, 0, 76, 0, 79, 0, 0, 0, 0],
      leadType: 'square', drums: 'finale', bass: 'octave' },
    // last stretch: same tune, more drive (16th arps on top)
    world3hype: { bpm: 158, swing: 0, chords: [[57, 60, 64, 67], [53, 57, 60, 64], [60, 64, 67, 71], [55, 59, 62, 67]],
      lead: [69, 0, 72, 0, 76, 0, 72, 76, 0, 79, 0, 76, 74, 0, 72, 0, 69, 0, 72, 0, 77, 0, 76, 74, 0, 72, 0, 69, 72, 0, 0, 0,
        72, 0, 76, 0, 79, 0, 76, 79, 0, 83, 0, 79, 76, 0, 74, 0, 74, 0, 72, 0, 71, 0, 72, 74, 0, 76, 0, 79, 0, 0, 0, 0],
      leadType: 'square', drums: 'finale', bass: 'octave', ripple: true },
    // the final encounter: tiptoeing up to the front door (pizzicato, a little suspicious)
    door: { bpm: 104, swing: 0.1, chords: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]],
      lead: [69, 0, 0, 0, 72, 0, 0, 0, 71, 0, 69, 0, 68, 0, 0, 0, 64, 0, 0, 0, 65, 0, 0, 0, 68, 0, 71, 0, 0, 0, 0, 0,
        69, 0, 0, 0, 72, 0, 0, 0, 76, 0, 74, 0, 72, 0, 0, 0, 71, 0, 72, 0, 71, 0, 68, 0, 64, 0, 0, 0, 0, 0, 0, 0],
      leadType: 'triangle', pluck: true, drums: 'tiptoe', bass: 'walk' },
    // surprise party: bouncy, silly, major
    party: { bpm: 132, swing: 0.14, chords: [[65, 69, 72], [70, 74, 77], [67, 70, 74, 77], [72, 76, 79]],
      lead: [77, 0, 77, 0, 81, 0, 77, 0, 84, 0, 0, 0, 81, 0, 0, 0, 82, 0, 81, 0, 79, 0, 77, 0, 74, 0, 0, 0, 0, 0, 0, 0,
        79, 0, 79, 0, 82, 0, 79, 0, 86, 0, 0, 0, 84, 0, 82, 0, 81, 0, 79, 0, 77, 0, 76, 0, 77, 0, 0, 0, 0, 0, 0, 0],
      leadType: 'square', drums: 'pop', bass: 'walk', sparkle: true },
    // memories and the archive: slow, warm, lo-fi
    memories: { bpm: 78, swing: 0.18, chords: [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 60, 64, 67]],
      lead: [0, 0, 74, 0, 0, 0, 72, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0, 71, 0, 0, 0, 74, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 76, 0, 0, 0, 74, 0, 0, 0, 71, 0, 72, 0, 0, 0, 0, 0, 69, 0, 0, 0, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      leadType: 'sine', drums: 'lofi', arp: true, pad: true },
    // RPG level-up and the credits: a proud little march
    levelup: { bpm: 112, swing: 0, chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67], [57, 60, 64], [65, 69, 72], [62, 65, 69], [67, 71, 74]],
      lead: [72, 0, 0, 72, 76, 0, 79, 0, 84, 0, 0, 0, 79, 0, 0, 0, 81, 0, 0, 79, 77, 0, 76, 0, 74, 0, 0, 0, 0, 0, 0, 0,
        76, 0, 0, 76, 79, 0, 84, 0, 88, 0, 0, 0, 84, 0, 0, 0, 81, 0, 79, 0, 77, 0, 74, 0, 72, 0, 0, 0, 0, 0, 0, 0],
      leadType: 'square', drums: 'march', pad: true },
    // the letter: a slow music box over a soft pad. No drums. Nothing like the worlds.
    letter: { bpm: 66, swing: 0, chords: [[53, 57, 60, 64], [57, 60, 64, 67], [58, 62, 65, 69], [60, 64, 67, 70], [50, 53, 57, 60], [58, 62, 65, 69], [53, 57, 60, 64], [55, 60, 64, 67]],
      lead: [0, 0, 0, 0, 81, 0, 0, 0, 79, 0, 0, 0, 77, 0, 0, 0, 0, 0, 0, 0, 76, 0, 0, 0, 77, 0, 0, 0, 79, 0, 0, 0,
        0, 0, 0, 0, 82, 0, 0, 0, 81, 0, 0, 0, 77, 0, 0, 0, 0, 0, 0, 0, 79, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 77, 0, 0, 0, 76, 0, 0, 0, 74, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 0, 74, 0, 0, 0, 77, 0, 0, 0,
        0, 0, 0, 0, 76, 0, 0, 0, 74, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      leadType: 'bell', drums: 'none', bass: 'none', pad: true, box: true },
    results: { bpm: 140, swing: 0.1, chords: [[60, 64, 67, 72], [65, 69, 72, 77], [67, 71, 74, 79], [60, 64, 67, 72]],
      lead: [72, 0, 76, 0, 79, 0, 84, 0, 0, 0, 79, 0, 84, 0, 0, 0, 77, 0, 81, 0, 84, 0, 89, 0, 0, 0, 84, 0, 81, 0, 0, 0,
        79, 0, 83, 0, 86, 0, 91, 0, 0, 0, 86, 0, 83, 0, 79, 0, 84, 0, 0, 0, 79, 0, 76, 0, 72, 0, 0, 0, 0, 0, 0, 0],
      leadType: 'square', drums: 'pop' },
  };
  A.SONGS = SONGS;

  function playSong(name) {
    if (A.songName === name) return;
    stopSong();
    A.songName = name;
    if (!A.ready || !SONGS[name]) return;
    const S = SONGS[name], spb = 60 / S.bpm / 4; // seconds per 16th
    const song = { S, step: 0, next: ac.currentTime + 0.1, gain: ac.createGain(), timer: null };
    song.gain.gain.setValueAtTime(0.0001, ac.currentTime);
    song.gain.gain.linearRampToValueAtTime(1, ac.currentTime + 0.8);
    song.gain.connect(musicBus);
    const bus = song.gain;
    song.timer = setInterval(() => {
      while (song.next < ac.currentTime + 0.15) {
        const st = song.step, t = song.next + ((st % 2) ? S.swing * spb : 0);
        const bar = Math.floor(st / 16) % S.chords.length, ch = S.chords[bar], s16 = st % 16;
        // lead
        const ln = S.lead[st % S.lead.length];
        if (ln && S.leadType === 'bell') { tone(bus, midi(ln), t, spb * 6, { type: 'sine', vol: 0.15, sus: 0.25, d: 0.35, r: 0.9 }); tone(bus, midi(ln + 12), t, spb * 3, { type: 'sine', vol: 0.03, sus: 0.1, d: 0.2, r: 0.5 }); }
        else if (ln && S.pluck) tone(bus, midi(ln), t, spb * 0.9, { type: S.leadType, vol: 0.13, sus: 0.15, d: 0.05 });
        else if (ln) tone(bus, midi(ln), t, spb * 1.6, { type: S.leadType, vol: S.leadType === 'square' ? 0.07 : 0.12, filter: S.leadType === 'square' ? 2800 : 0, sus: 0.5 });
        // bass
        if (S.bass === 'octave') { if (s16 % 2 === 0) tone(bus, midi(ch[0] - 24 + (s16 % 4 === 2 ? 12 : 0)), t, spb * 1.6, { type: 'sawtooth', vol: 0.09, filter: 900 }); }
        else if (S.bass === 'sync') { if ([0, 3, 6, 10, 12].includes(s16)) tone(bus, midi(ch[0] - 24 + (s16 === 10 ? 7 : 0)), t, spb * 1.5, { type: 'triangle', vol: 0.22 }); }
        else if (S.bass === 'walk') { if (s16 % 4 === 0) tone(bus, midi(ch[[0, 2, 1, 2][s16 / 4] ] - 24), t, spb * 1.8, { type: 'triangle', vol: 0.2 }); }
        else if (S.bass === 'none') { if (s16 === 0) tone(bus, midi(ch[0] - 12), t, spb * 14, { type: 'sine', vol: 0.07, a: 0.4, sus: 0.8, r: 1.2 }); }
        else if (s16 === 0 || s16 === 8) tone(bus, midi(ch[0] - 24), t, spb * 6, { type: 'triangle', vol: 0.18 });
        // chords / arps
        if (S.ripple) { tone(bus, midi(ch[s16 % ch.length] + (s16 % 8 < 4 ? 12 : 0)), t, spb * 1.4, { type: 'sine', vol: 0.045 }); }
        if (S.pad && s16 === 0) ch.forEach(n => tone(bus, midi(n), t, spb * 15, { type: 'triangle', vol: S.box ? 0.036 : 0.022, a: 0.5, sus: 0.85, d: 0.6, r: 1.0 }));
        if (S.box) { if (s16 % 4 === 2) tone(bus, midi(ch[(s16 / 2) % ch.length] + 12), t, spb * 3, { type: 'sine', vol: 0.028, sus: 0.15, d: 0.25, r: 0.6 }); }
        else if (S.sparkle && st % 32 === 28) [0, 4, 7].forEach((k, i) => tone(bus, midi(ch[0] + 24 + k), t + i * spb * 0.5, spb, { type: 'sine', vol: 0.04 }));
        if (S.box) {}
        else if (S.arp) { tone(bus, midi(ch[s16 % ch.length]), t, spb * 2, { type: 'sine', vol: 0.05 }); }
        else if (s16 === 4 || s16 === 12) ch.forEach(n => tone(bus, midi(n), t, spb * 1.2, { type: 'triangle', vol: 0.035 }));
        // drums
        if (S.drums === 'bounce' || S.drums === 'pop') {
          if (s16 === 0 || s16 === 10) tone(bus, 120, t, 0.12, { type: 'sine', vol: 0.32, slide: 45, slideT: 0.1 });
          if (s16 === 4 || s16 === 12) noise(bus, t, 0.1, { f: 1800, q: 0.8, vol: 0.12 });
          if (s16 % 2 === 0) noise(bus, t, 0.03, { f: 8000, q: 1, vol: 0.03, type: 'highpass' });
        } else if (S.drums === 'soft') {
          if (s16 === 0) tone(bus, 90, t, 0.2, { type: 'sine', vol: 0.15, slide: 50 });
          if (s16 === 8) noise(bus, t, 0.06, { f: 6000, vol: 0.025, type: 'highpass' });
        }
        if (S.drums === 'tiptoe') {
          if (s16 === 0 || s16 === 8) tone(bus, 110, t, 0.1, { type: 'sine', vol: 0.2, slide: 55 });
          if (s16 % 4 === 2) noise(bus, t, 0.03, { f: 7000, q: 1.5, vol: 0.035, type: 'highpass' });
          if (s16 === 12) noise(bus, t, 0.05, { f: 1200, q: 2, vol: 0.05 });
        }
        if (S.drums === 'lofi') {
          if (s16 === 0 || s16 === 7 || s16 === 10) tone(bus, 95, t, 0.16, { type: 'sine', vol: 0.18, slide: 50 });
          if (s16 === 4 || s16 === 12) noise(bus, t, 0.12, { f: 1400, q: 0.5, vol: 0.06 });
          if (s16 % 2 === 0) noise(bus, t, 0.02, { f: 7500, q: 1, vol: 0.015, type: 'highpass' });
        }
        if (S.drums === 'march') {
          if (s16 === 0 || s16 === 8) tone(bus, 120, t, 0.14, { type: 'sine', vol: 0.3, slide: 50 });
          if (s16 === 4 || s16 === 12 || s16 === 14) noise(bus, t, 0.09, { f: 2000, q: 0.7, vol: s16 === 14 ? 0.06 : 0.11 });
        }
        if (S.drums === 'finale') {
          if (s16 % 4 === 0) tone(bus, 130, t, 0.13, { type: 'sine', vol: 0.36, slide: 45, slideT: 0.1 });
          if (s16 === 4 || s16 === 12) { noise(bus, t, 0.14, { f: 1600, q: 0.6, vol: 0.14 }); noise(bus, t + 0.012, 0.1, { f: 2400, q: 0.8, vol: 0.08 }); }
          noise(bus, t, 0.03, { f: 9500, q: 1, vol: s16 % 4 === 2 ? 0.06 : 0.025, type: 'highpass' });
        }
        if (S.drums === 'race') {
          if (s16 === 0 || s16 === 6 || s16 === 10) tone(bus, 120, t, 0.12, { type: 'sine', vol: 0.32, slide: 45, slideT: 0.1 });
          if (s16 === 4 || s16 === 12) noise(bus, t, 0.12, { f: 2200, q: 0.7, vol: 0.12 });
          if (s16 % 2 === 0) noise(bus, t, 0.035, { f: 9000, q: 1, vol: s16 % 4 === 2 ? 0.05 : 0.025, type: 'highpass' });
        }
        // bathroom bubbles
        if (S.bubbles && (st % 32 === 14 || st % 32 === 30)) tone(bus, midi(84 + (st % 3) * 3), t, 0.06, { type: 'sine', vol: 0.06, slide: midi(96), slideT: 0.05 });
        song.step++; song.next += spb;
      }
    }, 30);
    A.song = song;
  }
  function stopSong(fade) {
    const s = A.song; A.song = null; A.songName = '';
    if (!s) return;
    clearInterval(s.timer);
    try { s.gain.gain.setTargetAtTime(0.0001, ac.currentTime, fade || 0.15); setTimeout(() => s.gain.disconnect(), 1500); } catch (e) {}
  }
  A.init = init;
  A._master = () => master;
  /* 0 = dry (default), 1 = fully submerged. Only World 2 calls this. */
  A.underwater = function (amount) {
    if (!ac || !musicFilter) return;
    const f = 20000 * Math.pow(1800 / 20000, Math.max(0, Math.min(1, amount)));
    musicFilter.frequency.setTargetAtTime(f, ac.currentTime, 0.15);
  };   // used by the automated audio level check
  A.music = function (name) { if (!A.ready) { A.songName = ''; A.pending = name; return; } playSong(name); };
  A.stop = stopSong;
  A.applyVolumes = applyVolumes;
  A.unlock = function () { const ok = init(); if (ok && A.pending) { const p = A.pending; A.pending = null; playSong(p); } return ok; };
  G.Audio = A;
})(window.TT);
