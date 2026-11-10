/* =====================================================================
   world2.js — WORLD 2: THE GREAT SWIM (side-scrolling swimming race)
   Race Turtletimee to the far wall before the timer runs out.

   How it differs from World 1: no gravity or jumping. Duck swims freely
   in every direction with momentum and water drag, boosts with limited
   bubble charges, is carried by currents and jets, and bonking costs
   TIME instead of HP. Buoy lines add time and act as checkpoints.

   The level is built in buildLevel() in tile coordinates (1 tile = 40px).
   ===================================================================== */
(function (G) {
  'use strict';
  const { U, UI, Save, Audio, Scenes, Input, Art, Art2, Content: C } = G;
  const TS = 40, COLS = 420, TOP = 6, ROWS = 26 + TOP;   // TOP = extra rows of sky above the water
  const SURF = (4 + TOP) * TS;         // water surface (y)
  const FLOOR = (24 + TOP) * TS;       // pool floor (y)
  const LEVEL_W = COLS * TS, LEVEL_H = ROWS * TS;
  const FINISH_X = 412 * TS;           // the touch pad on the far wall
  const DUCK_SCALE = 136;              // same character scale as World 1
  const PHYS = {
    accel: 1300, max: 265, drag: 1.6, idleDrag: 2.6, buoyancy: 28,
    boostV: 640, boostT: 0.42, boostDrag: 0.6, charges: 3, regen: 5.0,
    bonkTime: 2, stun: 0.45, inv: 1.1, knock: 420,
    startTime: 32, minRetryTime: 30,
  };

  /* ------------------------------------------------------------------
     LEVEL
     ------------------------------------------------------------------ */
  function buildLevel() {
    const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(' '));
    // rows below are written as if row 4 were the surface; TOP shifts them down
    const fill = (x0, x1, y0, y1, ch) => { y0 += TOP; y1 += TOP; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (grid[y] && x >= 0 && x < COLS) grid[y][x] = ch; };
    const px = (t) => t * TS, c = (t) => t * TS + 20, py = (t) => (t + TOP) * TS, cy = (t) => (t + TOP) * TS + 20;
    const O = { hoops: [], ropes: [], noodles: [], kicks: [], donuts: [], cleaners: [], jets: [], drains: [], currents: [], air: [], watches: [], tokens: [], buoys: [], signs: [], quotes: [], markers: [] };
    let seed = 1;
    const rope = (x0, x1, row) => O.ropes.push({ x0: px(x0), x1: px(x1 + 1), y: py(row) + 12, h: 16 });
    const noodle = (tx, ty, len, amp, opts) => O.noodles.push(Object.assign({ x0: c(tx), y0: cy(ty), x: c(tx), y: cy(ty), len, amp, ang: 0, axis: 'y', speed: 1.4, seed: seed++, col: ['#f39b8a', '#c9b8f0', '#fff4cc'][seed % 3] }, opts || {}));
    const kick = (tx, ty, range) => O.kicks.push({ x0: c(tx), y0: cy(ty), x: c(tx), y: cy(ty), range: px(range || 3), seed: seed++, ang: 0, col: ['#9fe3c3', '#a9d8f5', '#fff4cc'][seed % 3] });
    const donut = (tx, ty, r, orbit) => O.donuts.push({ x0: c(tx), y0: cy(ty), x: c(tx), y: cy(ty), r: r || 46, orbit: orbit == null ? 50 : orbit, seed: seed++, squish: 0, col: ['#f39b8a', '#c9b8f0', '#9fe3c3'][seed % 3] });
    const cleaner = (x0, x1, floorRow) => O.cleaners.push({ x0: c(x0), x1: c(x1), x: c(x0), y: py(floorRow) - 10, vx: 90 });
    const jet = (tx, row, len, offset, always) => O.jets.push({ x: c(tx), y: py(row + 1) - 8, dir: [0, -1], len: px(len), period: 3.0, onFor: always ? 3.1 : 1.4, offset, on: 0, warn: false, soft: !!always });
    const hoop = (tx, ty) => O.hoops.push({ x: c(tx), y: cy(ty), done: false });
    const drain = (tx) => O.drains.push({ x: c(tx), y: FLOOR - 8, r: 230 });
    const current = (x0, x1, y0, y1, fx, fy) => O.currents.push({ x: px(x0), y: py(y0), w: px(x1 - x0 + 1), h: px(y1 - y0 + 1), fx, fy: fy || 0 });
    const air = (tx, ty) => O.air.push({ x: c(tx), y: cy(ty), gone: false, back: 0 });
    const watch = (tx, ty, add) => O.watches.push({ id: 'w' + O.watches.length, x: c(tx), y: cy(ty), add: add || 4 });
    const token = (tx, ty) => O.tokens.push({ id: 't' + O.tokens.length, x: c(tx), y: cy(ty) });
    const buoy = (tx, add) => O.buoys.push({ idx: O.buoys.length, x: px(tx), add, passed: false });
    const sign = (tx, ty, idx) => O.signs.push({ x: px(tx), y: py(ty), idx });

    // ---- pool shell: floor, start wall + deck, finish wall + deck
    fill(0, COLS - 1, 24, 25, '#');
    fill(0, 5, 4, 25, '#');
    fill(412, COLS - 1, 4, 25, '#');

    // ---- S0. learn to swim (cols 6–30)
    sign(8, 9, 0); sign(15, 6, 1); sign(22, 14, 2);
    air(18, 15); air(26, 10);

    // ---- S1. lanes: fast lane vs. kickboard lane, then a zig-zag of walls (cols 30–112)
    sign(29, 6, 3);
    rope(32, 74, 12);
    current(32, 74, 5, 11, 120);                     // the fast lane (top)
    noodle(44, 8, 110, 95, { speed: 1.3 }); noodle(56, 8, 110, 95, { speed: 1.6 }); noodle(66, 8, 110, 95, { speed: 1.2 });
    sign(38, 15, 4);
    kick(48, 18, 3); kick(62, 20, 4); kick(70, 16, 2);
    air(52, 16); token(64, 22);                     // TOKEN 1 (slow lane reward)
    fill(80, 81, 4, 15, '#'); fill(90, 91, 12, 23, '#'); fill(100, 101, 4, 15, '#');
    cleaner(82, 89, 24); air(86, 8);
    sign(92, 5, 6); watch(95, 7, 4);
    noodle(96, 19, 90, 50, { speed: 1.8 });
    sign(103, 6, 7);
    buoy(108, 32);

    // ---- S2. jets under a low ceiling, drains, inflatable donuts (cols 110–196)
    sign(111, 15, 5);
    fill(118, 142, 4, 12, '#');                     // low ceiling → channel underneath
    for (const x of [124, 132, 140]) noodle(x - 2, 13, 150, 0, { speed: 0 });   // noodles stuck under the ceiling
    jet(122, 23, 9, 0); jet(130, 23, 9, 1.0); jet(138, 23, 9, 2.0);
    air(134, 21); watch(143, 21, 4);
    drain(152); drain(168);
    donut(150, 9, 46, 40); donut(160, 15, 46, 60); donut(176, 8, 50, 50); donut(187, 17, 46, 40);
    token(168, 20);                                   // TOKEN 2 (next to a drain: risky)
    current(178, 196, 4, 10, -210);                   // against you: go underneath
    air(182, 18); air(160, 6);

    // ---- S3. the tunnel (cols 196–262) + the secret chamber underneath
    fill(200, 258, 4, 11, '#'); fill(200, 258, 17, 23, '#');
    current(200, 258, 12, 16, 160);
    cleaner(210, 222, 17); cleaner(236, 250, 17);
    noodle(232, 14, 110, 26, { ang: Math.PI / 2, axis: 'y', speed: 2.2 });
    token(244, 13);                                   // TOKEN 3
    fill(226, 227, 17, 18, ' '); fill(219, 235, 19, 22, ' ');   // hole in the tunnel floor → chamber
    O.chamber = { x: px(219), y: py(19), w: px(17), h: px(4) };
    O.hole = { x: px(226), y: py(16) + 30 };
    O.mural = { x: px(220) + 6, y: py(19) + 8, w: 200, seen: false };
    O.quotes.push({ id: 'q2', x: c(232), y: cy(20) });
    air(229, 21);
    O.tunnel = { x: px(200), y: py(12), w: px(59), h: px(5) };
    buoy(266, 12);

    // ---- S4. the deep end (cols 262–322)
    O.markers.push({ x: c(272), y: FLOOR - 16, text: 'DEEP END  3.0 m' }, { x: c(20), y: FLOOR - 16, text: 'SHALLOW  1.2 m' }, { x: c(150), y: FLOOR - 16, text: '2.0 m' });
    current(272, 322, 19, 22, 140);                   // the deep current (helps)
    current(280, 300, 9, 15, -180);                   // against you
    donut(276, 8, 60, 50); donut(292, 10, 60, 60); donut(308, 7, 56, 40);
    noodle(286, 20, 120, 55, { speed: 1.5 }); noodle(304, 20, 120, 55, { speed: 1.9 });
    kick(298, 6, 3); kick(316, 14, 3);
    token(290, 22);                                   // TOKEN 4 (deep current lane)
    token(311, 5);                                    // TOKEN 5 (up by the surface, behind a donut)
    air(284, 17); air(300, 13); air(320, 18); watch(306, 17, 4);

    // ---- S4b. diving-ring run through bubble curtains (cols 322–382)
    buoy(324, 17);
    sign(325, 6, 8);
    for (const [x, y] of [[331, 15], [339, 19], [347, 12], [355, 18], [363, 11], [371, 16]]) hoop(x, y);
    jet(335, 23, 19, 0, true); jet(351, 23, 19, 0, true); jet(367, 23, 19, 0, true);   // bubble curtains (always on)
    kick(343, 7, 2); kick(359, 21, 3); kick(375, 8, 2);
    noodle(351, 20, 100, 40, { speed: 1.6 });
    air(343, 15); air(360, 13); watch(372, 21, 4);

    // ---- S5. final sprint to the wall (cols 382–412)
    current(386, 410, 8, 16, 100);
    air(386, 12); air(400, 20);

    // Turtletimee's racing line (tile coords)
    const path = [[5, 2.3], [9, 6], [14, 8], [30, 8], [74, 8], [78, 19], [83, 19], [87, 8], [93, 8], [98, 19], [103, 19], [110, 15],
      [118, 19], [142, 19], [150, 13], [176, 14], [196, 14], [200, 14], [258, 14], [266, 12], [272, 20], [322, 20], [331, 15], [339, 19], [347, 12], [355, 18], [363, 11], [371, 16], [382, 12], [411.4, 12]];
    O.ttPath = path.map(([x, y]) => [x * TS + 20, (y + TOP) * TS + 20]);
    return { grid, O };
  }

  /* polyline helper for Turtletimee */
  function makePath(pts) {
    const segs = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const l = Math.hypot(x1 - x0, y1 - y0); segs.push({ x0, y0, x1, y1, l, s: L }); L += l; }
    return { segs, len: L, at(s) {
      s = U.clamp(s, 0, L);
      let g = segs[segs.length - 1]; for (const q of segs) if (s <= q.s + q.l) { g = q; break; }
      const k = g.l ? (s - g.s) / g.l : 0; return { x: g.x0 + (g.x1 - g.x0) * k, y: g.y0 + (g.y1 - g.y0) * k, dx: g.x1 - g.x0, dy: g.y1 - g.y0 };
    }, sForX(x) { for (const q of segs) if ((q.x1 >= x && q.x0 <= x) && q.x1 !== q.x0) return q.s + q.l * (x - q.x0) / (q.x1 - q.x0); return x > segs[segs.length - 1].x1 ? L : 0; } };
  }

  /* ------------------------------------------------------------------
     SCENE
     ------------------------------------------------------------------ */
  const S = {};
  S.enter = async function (data) {
    data = data || {};
    UI.closeAll();
    const lvl = buildLevel();
    this.grid = lvl.grid; this.O = lvl.O; this.path = makePath(this.O.ttPath);
    this.t = 0; this.paused = false; this.busy = true; this.ended = false;
    this.parts = []; this.floaters = []; this.barks = []; this.shake = 0; this.lastUW = -1;
    const w = Save.data.worlds.w2;
    const resume = data.resume && w.buoy != null;
    if (!resume) {
      Object.assign(w, { tokens: [], watches: [], quote: false, mural: false, buoy: null, buoyTime: null, bonks: 0, retries: 0, beatTT: false });
      if (!w.done) Save.data.progress.stage = 'world2';
      Save.write();
    }
    this.w = w;
    // restore what has been collected
    this.O.tokens.forEach(k => k.got = w.tokens.includes(k.id));
    this.O.watches.forEach(k => k.got = w.watches.includes(k.id));
    this.O.quotes.forEach(q => q.got = !!w.quote);
    this.O.mural.seen = !!w.mural;
    this.O.buoys.forEach(b => b.passed = w.buoy != null && b.idx <= w.buoy);
    this.time = resume ? Math.max(PHYS.minRetryTime, w.buoyTime || 0) : PHYS.startTime;
    this.p = { x: 0, y: 0, w: 64, h: 34, vx: 0, vy: 0, face: 1, boostT: 0, charges: PHYS.charges, regenT: 0, stunT: 0, inv: 0, animT: 0, pitch: 0, state: 'deck', diveT: 0 };
    this.tt = { s: 0, x: 0, y: 0, face: 1, pitch: 0, speed: 0, done: false, gone: false, barkT: 4, animT: 0 };
    this.countT = -1;
    UI.hud.show({ kind: 'swim', maxBoost: PHYS.charges, number: C.W2.number, title: C.W2.title });
    G.canvas.classList.remove('aim');
    if (resume) this.placeAtBuoy(w.buoy); else this.placeOnDeck();
    this.syncHud();
    this.updateCamera(1);
    Audio.music('world2'); Audio.underwater(0);
    await UI.fade(false, 400);
    await UI.card(C.W2.number, C.W2.title, C.W2.goal, 2400);
    if (Scenes.current !== S) return;
    if (resume) UI.toast('Welcome back', 'Resuming from the last buoy.');
    else await UI.say(C.W2.intro);
    if (Scenes.current !== S) return;
    this.startCountdown(resume ? 'water' : 'deck');
  };

  S.placeOnDeck = function () {
    const p = this.p; p.state = 'deck'; p.x = 110; p.y = SURF - 22; p.vx = p.vy = 0; p.face = 1;
    const tt = this.tt; tt.s = 0; const q = this.path.at(0); tt.x = q.x; tt.y = q.y; tt.done = false; tt.gone = false; tt.onBlock = true;
  };
  S.placeAtBuoy = function (idx) {
    const p = this.p, b = this.O.buoys[idx];
    const x = b ? b.x + 70 : 300;
    p.state = 'wait'; p.x = x; p.y = this.openY(x); p.vx = p.vy = 0; p.face = 1; p.charges = PHYS.charges; p.stunT = 0; p.inv = 0; p.boostT = 0;
    const tt = this.tt; tt.onBlock = false; tt.done = false; tt.gone = false;
    tt.s = Math.min(this.path.len - 1, this.path.sForX(x) + 260); const q = this.path.at(tt.s); tt.x = q.x; tt.y = q.y;
  };
  /* a free spot in the water column at x (for respawns) */
  S.openY = function (x) {
    const tx = Math.floor(x / TS);
    for (const r of [10, 14, 8, 18, 6, 20]) { const row = r + TOP; if (!this.solid(tx, row) && !this.solid(tx, row - 1) && !this.solid(tx, row + 1)) return row * TS + 20; }
    return SURF + 120;
  };
  S.startCountdown = function (mode) {
    this.busy = false; this.countMode = mode; this.countT = 0; this.lastBeep = -1;
  };

  S.exit = function () { UI.hud.hide(); Audio.underwater(0); this.paused = false; };
  S.onBlur = function () { if (!this.paused && !this.ended && !UI.isOpen() && this.p.state === 'race') this.pause(); };

  /* ---------------- tiles ---------------- */
  S.tile = function (tx, ty) { if (tx < 0 || tx >= COLS || ty >= ROWS) return '#'; if (ty < 0) return ' '; return this.grid[ty][tx]; };
  S.solid = function (tx, ty) { return this.tile(tx, ty) === '#'; };
  S.boxHitsSolid = function (x, y, w, h) {
    const x0 = Math.floor(x / TS), x1 = Math.floor((x + w - 1) / TS), y0 = Math.floor(y / TS), y1 = Math.floor((y + h - 1) / TS);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solid(tx, ty)) return true;
    for (const r of this.O.ropes) if (x < r.x1 && x + w > r.x0 && y < r.y + r.h && y + h > r.y) return true;
    return false;
  };

  /* ---------------- update ---------------- */
  S.update = function (dt) {
    if (this.ended) { this.t += dt; this.updateFX(dt); return; }
    if (Input.hit('pause') && !this.busy && !UI.isOpen() && !UI.inDialogue() && (this.countT < 0 || this.p.state === 'race')) { this.countT = -1; this.pause(); return; }
    if (this.paused || UI.isOpen() || UI.inDialogue()) return;
    this.t += dt;
    const p = this.p;
    this.updateWorld(dt);
    if (this.countT >= 0) this.updateCountdown(dt);
    if (p.state === 'dive') this.updateDive(dt);
    else if (p.state === 'race') {
      this.time -= dt;
      this.updateSwim(dt);
      this.checkPickups();
      if (this.time <= 0 && p.state === 'race') this.timeUp();
      if (p.x + p.w >= FINISH_X - 8 && p.state === 'race') this.finish();
    } else if (p.state === 'timeup') { p.timeT += dt; p.vx *= 0.95; p.vy *= 0.95; if (p.timeT > 1.8) this.retry(); }
    if (p.state === 'race' || p.state === 'dive' || (p.state === 'finished')) this.updateTT(dt);
    p.animT += dt * (0.6 + Math.hypot(p.vx, p.vy) / PHYS.max);
    this.updateFX(dt);
    this.updateCamera(dt);
    this.updateAudio();
    this.syncHud();
  };

  S.updateCountdown = function (dt) {
    this.countT += dt;
    const n = Math.floor(this.countT / 0.8);
    if (n !== this.lastBeep) {
      this.lastBeep = n;
      if (n < 3) Audio.sfx('beep'); else if (n === 3) { Audio.sfx('go'); this.go(); }
    }
    if (this.countT > 3.2 + 0.6) this.countT = -1;
  };
  S.go = function () {
    const p = this.p;
    if (this.countMode === 'deck') { p.state = 'dive'; p.diveT = 0; this.tt.onBlock = false; }
    else { p.state = 'race'; p.vx = 200; }
    this.ttWait = 0;
  };
  S.updateDive = function (dt) {
    const p = this.p; p.diveT += dt;
    const k = Math.min(1, p.diveT / 0.6);
    p.x = 110 + 230 * k; p.y = SURF - 22 + (-60 * Math.sin(k * Math.PI)) + 170 * k * k;
    p.pitch = -0.6 + k * 1.2;
    if (k >= 1) {
      p.state = 'race'; p.vx = 330; p.vy = 80;
      Audio.sfx('dive'); this.splash(p.x, SURF, 14);
    }
  };

  S.updateWorld = function (dt) {
    const O = this.O, t = this.t;
    for (const n of O.noodles) {
      if (!n.amp) continue;
      const off = Math.sin(t * n.speed + n.seed * 1.7) * n.amp;
      if (n.axis === 'y') n.y = n.y0 + off; else n.x = n.x0 + off;
    }
    for (const k of O.kicks) { k.x = k.x0 + Math.sin(t * 0.7 + k.seed) * k.range; k.y = k.y0 + Math.sin(t * 1.3 + k.seed) * 14; k.ang = Math.sin(t * 1.1 + k.seed) * 0.25; }
    for (const d of O.donuts) { d.x = d.x0 + Math.cos(t * 0.5 + d.seed) * d.orbit; d.y = d.y0 + Math.sin(t * 0.7 + d.seed) * d.orbit * 0.5; d.squish = Math.max(0, d.squish - dt * 4); }
    for (const cl of O.cleaners) { cl.x += cl.vx * dt; if (cl.x > cl.x1) { cl.x = cl.x1; cl.vx = -Math.abs(cl.vx); } if (cl.x < cl.x0) { cl.x = cl.x0; cl.vx = Math.abs(cl.vx); } }
    for (const j of O.jets) {
      const ph = ((t + j.offset) % j.period + j.period) % j.period;
      const on = ph < j.onFor;
      j.on = on ? Math.min(1, j.on + dt * 6) : Math.max(0, j.on - dt * 6);
      j.warn = !on && ph > j.period - 0.5;
    }
    for (const a of O.air) if (a.gone) { a.back -= dt; if (a.back <= 0) a.gone = false; }
  };

  S.updateSwim = function (dt) {
    const p = this.p;
    p.inv = Math.max(0, p.inv - dt); p.stunT = Math.max(0, p.stunT - dt); p.boostT = Math.max(0, p.boostT - dt);
    // boost charges slowly come back
    if (p.charges < PHYS.charges) { p.regenT += dt; if (p.regenT >= PHYS.regen) { p.regenT = 0; p.charges++; } } else p.regenT = 0;
    let ix = 0, iy = 0;
    if (p.stunT <= 0) { ix = (Input.isDown('right') ? 1 : 0) - (Input.isDown('left') ? 1 : 0); iy = (Input.isDown('down') ? 1 : 0) - (Input.isDown('up') ? 1 : 0); }
    const il = Math.hypot(ix, iy); if (il) { ix /= il; iy /= il; }
    // boost
    if (p.stunT <= 0 && Input.hit('special') && p.charges > 0 && p.boostT < 0.1) {
      const dx = il ? ix : p.face, dy = il ? iy : 0;
      p.vx = dx * PHYS.boostV; p.vy = dy * PHYS.boostV; p.boostT = PHYS.boostT; p.charges--;
      Audio.sfx('boost'); this.shake = 0.08;
      if (Math.random() < 0.3) this.bark('duck', C.W2.barkBoost);
    }
    const max = p.boostT > 0 ? PHYS.boostV : PHYS.max;
    p.vx += ix * PHYS.accel * dt; p.vy += iy * PHYS.accel * dt;
    const drag = p.boostT > 0 ? PHYS.boostDrag : (il ? PHYS.drag : PHYS.idleDrag);
    p.vx -= p.vx * drag * dt; p.vy -= p.vy * drag * dt;
    if (!il && p.boostT <= 0) p.vy -= PHYS.buoyancy * dt;
    const sp = Math.hypot(p.vx, p.vy);
    // a firm top speed; after a boost, speed eases back down quickly
    if (sp > max) { const k = Math.max(max / sp, 1 - dt * 6); p.vx *= k; p.vy *= k; }
    if (Math.abs(p.vx) > 25) p.face = Math.sign(p.vx);
    // currents & jets carry Duck along
    let cx = 0, cy = 0;
    const px = p.x + p.w / 2, py = p.y + p.h / 2;
    for (const z of this.O.currents) if (px > z.x && px < z.x + z.w && py > z.y && py < z.y + z.h) { cx += z.fx; cy += z.fy; }
    for (const j of this.O.jets) if (j.on > 0.3 && Math.abs(px - j.x) < 46 && py < j.y && py > j.y - j.len) { cy -= (j.soft ? 300 : 430) * j.on; }
    for (const d of this.O.drains) {
      const dx = d.x - px, dy = d.y - py, dist = Math.hypot(dx, dy);
      if (dist < d.r) { const f = (1 - dist / d.r) * 300; cx += dx / dist * f; cy += dy / dist * f; }
      if (dist < 50 && p.inv <= 0) this.bonk(px, d.y + 40, 'drain');
    }
    this.inCurrent = Math.abs(cx) + Math.abs(cy) > 60;
    // move with wall sliding
    const mx = (p.vx + cx) * dt, my = (p.vy + cy) * dt;
    p.x += mx; if (this.boxHitsSolid(p.x, p.y, p.w, p.h)) { p.x -= mx; p.vx *= -0.15; }
    p.y += my; if (this.boxHitsSolid(p.x, p.y, p.w, p.h)) { p.y -= my; p.vy *= -0.15; }
    // stay under the surface (a little bob at the top)
    if (p.y < SURF + 4) { p.y = SURF + 4; if (p.vy < 0) p.vy *= 0.2; }
    if (p.y + p.h > FLOOR) p.y = FLOOR - p.h;
    const sv = Math.hypot(p.vx, p.vy);
    p.pitch = sv > 40 ? U.lerp(p.pitch, Math.atan2(p.vy, Math.abs(p.vx) + 1), Math.min(1, dt * 8)) : U.lerp(p.pitch, 0, dt * 3);
    // a few bubbles while swimming
    if (Math.random() < dt * (3 + sv / 80)) this.parts.push({ x: p.x + p.w / 2 - p.face * 30, y: p.y + 6, vx: U.rnd(-20, 20), vy: U.rnd(-90, -40), life: 0.9, kind: 'bub', r: U.rnd(2, 5) });
    // hazards
    this.checkHazards();
  };

  S.checkHazards = function () {
    const p = this.p, O = this.O;
    const px = p.x + p.w / 2, py = p.y + p.h / 2, pr = 18;
    if (p.inv <= 0) {
      for (const n of O.noodles) {
        const ca = Math.cos(n.ang), sa = Math.sin(n.ang), hl = n.len / 2 - 12;
        const dx = px - n.x, dy = py - n.y, along = U.clamp(dx * ca + dy * sa, -hl, hl);
        const qx = n.x + ca * along, qy = n.y + sa * along;
        if (Math.hypot(px - qx, py - qy) < 13 + pr + 6) { this.bonk(qx, qy, 'noodle'); return; }
      }
      for (const k of O.kicks) if (Math.abs(px - k.x) < 38 + pr && Math.abs(py - k.y) < 14 + pr * 0.6) { this.bonk(k.x, k.y, 'kickboard'); return; }
      for (const cl of O.cleaners) if (Math.abs(px - cl.x) < 34 + pr && Math.abs(py - (cl.y - 9)) < 18 + pr * 0.6) { this.bonk(cl.x, cl.y, 'cleaner'); return; }
    }
    // donuts are bouncy, not harmful
    for (const d of O.donuts) {
      const dx = px - d.x, dy = py - d.y, dist = Math.hypot(dx, dy), min = d.r + pr;
      if (dist < min && dist > 0.01) {
        const nx = dx / dist, ny = dy / dist;
        p.x += nx * (min - dist); p.y += ny * (min - dist);
        if (this.boxHitsSolid(p.x, p.y, p.w, p.h)) { p.x -= nx * (min - dist); p.y -= ny * (min - dist); }
        const vn = p.vx * nx + p.vy * ny;
        if (vn < 0) { p.vx -= 1.8 * vn * nx; p.vy -= 1.8 * vn * ny; }
        p.vx += nx * 120; p.vy += ny * 120;
        if (d.squish < 0.3) { Audio.sfx('spring'); d.squish = 1; }
      }
    }
  };
  S.bonk = function (hx, hy, what) {
    const p = this.p;
    if (p.inv > 0 || p.state !== 'race') return;
    const px = p.x + p.w / 2, py = p.y + p.h / 2;
    let nx = px - hx, ny = py - hy; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    p.vx = nx * PHYS.knock; p.vy = ny * PHYS.knock; p.stunT = PHYS.stun; p.inv = PHYS.inv; p.boostT = 0;
    this.time -= PHYS.bonkTime; this.w.bonks = (this.w.bonks || 0) + 1;
    this.shake = 0.25; Audio.sfx('bonk'); UI.hud.flash('timer');
    this.floaters.push({ x: px, y: py - 50, text: '-' + PHYS.bonkTime + 's', life: 1.2, col: '#f39b8a' });
    if (Math.random() < 0.6) this.bark('duck', C.W2.barkBonk);
    for (let i = 0; i < 6; i++) this.parts.push({ x: px, y: py, vx: U.rnd(-160, 160), vy: U.rnd(-160, 160), life: 0.5, kind: 'star' });
  };

  S.checkPickups = function () {
    const p = this.p, O = this.O, w = this.w;
    const px = p.x + p.w / 2, py = p.y + p.h / 2;
    const near = (o, r) => Math.hypot(px - o.x, py - o.y) < r;
    for (const a of O.air) if (!a.gone && near(a, 46)) {
      a.gone = true; a.back = 7; Audio.sfx('air');
      if (p.charges < PHYS.charges) p.charges++; else this.time += 0.5;
      this.floaters.push({ x: a.x, y: a.y - 30, text: p.charges >= PHYS.charges ? 'BOOST FULL' : '+1 BOOST', life: 0.9, col: '#d6f0fc' });
    }
    for (const k of O.watches) if (!k.got && near(k, 40)) {
      k.got = true; w.watches.push(k.id); this.time += k.add; Audio.sfx('watch'); UI.hud.flash('timer');
      this.floaters.push({ x: k.x, y: k.y - 30, text: '+' + k.add + 's', life: 1.2, col: '#fff4cc', big: true });
    }
    for (const k of O.tokens) if (!k.got && near(k, 40)) {
      k.got = true; w.tokens.push(k.id); Save.write(); Audio.sfx('token'); UI.hud.flash('item');
      this.floaters.push({ x: k.x, y: k.y - 30, text: 'TOKEN ' + w.tokens.length + '/5', life: 1.4, col: '#ffd76a', big: true });
    }
    for (const h of O.hoops) if (!h.done && Math.abs(px - h.x) < 20 && Math.abs(py - h.y) < 52) {
      h.done = true; this.time += 1; Audio.sfx('air'); this.ringsHit = (this.ringsHit || 0) + 1;
      this.floaters.push({ x: h.x, y: h.y - 80, text: '+1s', life: 1, col: '#fff4cc' });
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; this.parts.push({ x: h.x, y: h.y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, life: 0.5, kind: 'star' }); }
    }
    for (const b of O.buoys) if (!b.passed && px > b.x) {
      b.passed = true; this.time += b.add; Audio.sfx('buoy'); UI.hud.flash('timer');
      w.buoy = b.idx; w.buoyTime = this.time; Save.data.progress.stage = Save.data.worlds.w2.done ? Save.data.progress.stage : 'world2';
      Save.data.progress.checkpoint = { world: 'w2', id: b.idx }; Save.write();
      UI.toast('Buoy ' + (b.idx + 1) + ' reached', '+' + b.add + ' seconds. Progress saved.');
      this.floaters.push({ x: px, y: py - 60, text: '+' + b.add + 's', life: 1.6, col: '#9fe3c3', big: true });
    }
    if (this.inRect(px, py, O.tunnel) && !this.saidTunnel) { this.saidTunnel = true; this.bark('duck', ['Shortcut or terrible mistake?']); }
    if (this.inRect(px, py, O.chamber) && !O.mural.seen) {
      O.mural.seen = true; w.mural = true; Save.write(); Audio.sfx('sparkle');
      this.talk(C.W2.mural).then(() => Save.unlock('w2_bus'));
      return;
    }
    for (const q of O.quotes) if (!q.got && near(q, 46)) { q.got = true; w.quote = true; this.foundQuote(q.id); return; }
  };
  S.inRect = (x, y, r) => r && x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;

  S.talk = async function (lines) {
    this.busy = true;
    await UI.say(lines);
    if (Scenes.current === S && !this.ended) this.busy = false;
  };
  S.foundQuote = async function (id) {
    this.busy = true;
    const q = C.QUOTES.find(x => x.id === id);
    Save.data.quotes[id] = true; Save.write();
    Audio.sfx('quote');
    await UI.quotePanel(q.text, Object.keys(Save.data.quotes).length);
    Save.unlock('quote2');
    if (Scenes.current === S) this.busy = false;
  };

  /* ---------------- Turtletimee ---------------- */
  S.updateTT = function (dt) {
    const tt = this.tt, p = this.p;
    tt.animT += dt;
    if (tt.gone || tt.onBlock) return;
    if (tt.done) { tt.x = FINISH_X - 50; tt.face = -1; tt.pitch = 0; return; }
    const lead = tt.x - (p.x + p.w / 2);
    const finalStretch = tt.x > 382 * TS;
    let target;
    if (p.state === 'dive') target = 220;
    else if (finalStretch) target = 270;                 // no more waiting: a real race to the wall
    else if (lead > 700) target = 50;                    // she waits (unimpressed)
    else if (lead > 380) target = 200;
    else if (lead > 0) target = 285;
    else target = Math.min(620, Math.max(330, Math.hypot(p.vx, p.vy) + 120));   // surprisingly fast: she always catches up
    tt.speed = U.approach(tt.speed, target, 500 * dt);
    // currents carry her too (along her heading)
    const hd = this.path.at(tt.s); const hl = Math.hypot(hd.dx, hd.dy) || 1;
    let flow = 0; for (const z of this.O.currents) if (this.inRect(tt.x, tt.y, z)) flow += (z.fx * hd.dx + z.fy * hd.dy) / hl;
    tt.s = Math.min(this.path.len, tt.s + Math.max(40, tt.speed + flow) * dt);
    const q = this.path.at(tt.s);
    tt.x = q.x; tt.y = q.y;
    if (Math.abs(q.dx) > 4) tt.face = Math.sign(q.dx);
    tt.pitch = U.lerp(tt.pitch, Math.atan2(q.dy, Math.abs(q.dx) + 1) * 0.8, Math.min(1, dt * 4));
    if (tt.s >= this.path.len - 1 || tt.x >= FINISH_X - 42) { tt.done = true; tt.doneT = this.t; if (p.state === 'race') this.bark('tt', ['Took you long enough.']); }
    // the occasional deadpan remark
    tt.barkT -= dt;
    if (tt.barkT <= 0 && p.state === 'race') {
      tt.barkT = U.rnd(8, 12);
      const onScreen = Math.abs(tt.x - (p.x + p.w / 2)) < 640;
      if (onScreen) this.bark('tt', lead > 700 ? C.W2.barksTTWait : C.W2.barksTT);
      else if (Math.random() < 0.5) this.bark('duck', C.W2.barksDuck);
    }
  };
  S.bark = function (who, list) {
    const text = list[Math.floor(Math.random() * list.length)];
    this.barks = this.barks.filter(b => b.who !== who);
    this.barks.push({ who, text, life: 2.6 });
  };

  /* ---------------- time up / retry ---------------- */
  S.timeUp = function () {
    const p = this.p; p.state = 'timeup'; p.timeT = 0; this.time = 0;
    Audio.sfx('timeup'); this.w.retries = (this.w.retries || 0) + 1;
    this.bark('tt', ['...', 'Too slow.']);
  };
  S.retry = function () {
    const w = this.w;
    this.time = w.buoy != null ? Math.max(PHYS.minRetryTime, w.buoyTime || 0) : PHYS.startTime;
    if (w.buoy != null) { this.placeAtBuoy(w.buoy); this.startCountdown('water'); }
    else { this.placeOnDeck(); this.startCountdown('deck'); }
    UI.toast('Try again', w.buoy != null ? 'Back at the last buoy with ' + Math.round(this.time) + ' seconds.' : 'Back on the starting block.');
  };

  /* ---------------- finish ---------------- */
  S.finish = async function () {
    const p = this.p, tt = this.tt, w = this.w;
    p.state = 'finished'; p.vx = 0; p.vy = 0; p.x = FINISH_X - p.w - 6;
    const duckFirst = !tt.done;
    w.beatTT = w.beatTT || duckFirst;
    this.busy = true; this.ended = true;
    Audio.stop(0.3); Audio.sfx('win'); Audio.underwater(0);
    this.floaters.push({ x: p.x, y: p.y - 70, text: duckFirst ? 'FIRST!' : 'FINISH!', life: 2.2, col: '#fff4cc', big: true });
    this.splash(FINISH_X - 30, SURF, 10);
    const left = Math.max(0, this.time);
    await U.wait(1300); if (Scenes.current !== S) return;
    if (duckFirst) { tt.done = true; tt.x = FINISH_X - 50; }
    await UI.say(duckFirst ? C.W2.finishDuckFirst : C.W2.finishTTFirst); if (Scenes.current !== S) return;
    tt.gone = true; Audio.sfx('whoosh');
    // the vending machine (shared vending-machine dreams)
    const n = w.tokens.length;
    if (n >= 5) {
      Audio.sfx('clunk');
      await UI.say(C.W2.vendingYes); if (Scenes.current !== S) return;
      Save.data.cosmetics.goggles = true; Save.write();
      Save.unlock('w2_tokens');
      UI.toast('Cosmetic unlocked', 'Swim goggles for Duckquackquack. Toggle them in the World 2 pause menu.');
    } else {
      await UI.say(C.W2.vendingNo.map(l => ({ ...l, text: l.text.replace('{n}', n) }))); if (Scenes.current !== S) return;
    }
    // the floatie under the hot sun (from the storyboard)
    await UI.fade(true, 500); if (Scenes.current !== S) return;
    this.mode = 'floatie'; this.floatT = 0; Audio.music('floatie');
    UI.hud.hide();
    await UI.fade(false, 600);
    await UI.say(C.W2.floatie); if (Scenes.current !== S) return;
    await this.results(left, duckFirst); if (Scenes.current !== S) return;
    await UI.fade(true, 600);
    Scenes.go('w2end');
    UI.fade(false, 600);
  };
  S.results = function (left, duckFirst) {
    const w = this.w, O = this.O;
    const tokens = w.tokens.length, bonks = w.bonks || 0;
    const score = 1000 + Math.round(left * 20) + tokens * 100 + (w.quote ? 200 : 0) + (w.mural ? 100 : 0) + (duckFirst ? 500 : 0) + (bonks === 0 ? 300 : 0) - bonks * 25;
    const best = w.best || {};
    const newBest = !best.score || score > best.score;
    w.done = true; w.best = { score: Math.max(score, best.score || 0), left: Math.max(left, best.left || 0) };
    Save.data.progress.stage = 'world3'; Save.data.progress.checkpoint = null; w.buoy = null; w.buoyTime = null;
    Save.write();
    Save.unlock('w2_clear');
    if (duckFirst) Save.unlock('w2_beat');
    if (bonks === 0) Save.unlock('w2_clean');
    Audio.music('results');
    return new Promise((res) => {
      const pnl = UI.el('div', 'panel results');
      const row = (a, b, cls) => '<span class="' + (cls || '') + '">' + a + '</span><span class="' + (cls || '') + '">' + b + '</span>';
      pnl.innerHTML = '<h2 class="panel-title">World 2 complete!</h2><div class="stats">' +
        row('Time left', left.toFixed(1) + ' s') + row('Race', duckFirst ? 'Beat Turtletimee!' : 'Turtletimee won') +
        row('Tokens', tokens + ' / 5') + row('Bonks', bonks) + row('Secrets', (w.mural ? 1 : 0) + (w.quote ? 1 : 0) + ' / 2') +
        row('Score' + (newBest ? ' (new best!)' : ''), score, 'total') + '</div>';
      const got = C.ACHIEVEMENTS.filter(a => Save.data.achievements[a.id] && (a.id.startsWith('w2') || a.id === 'quote2'));
      if (got.length) { const ch = UI.el('div', 'chips'); got.forEach(a => ch.appendChild(UI.el('span', 'chip', UI.esc(a.name)))); pnl.appendChild(ch); }
      const b = UI.el('button', 'btn primary', 'Continue'); pnl.appendChild(b);
      let e; UI.wire(b, () => { e.close(); res(); });
      e = UI.open(pnl, { onBack: () => {} });
    });
  };

  /* ---------------- pause ---------------- */
  S.pause = function () {
    this.paused = true; Audio.sfx('pause');
    const resume = (m) => { m.close(); this.paused = false; G.Input.clear(); };
    const items = [
      { label: 'Resume', primary: true, action: resume },
      { label: 'Restart from last buoy', action: (m) => { m.close(); this.paused = false; this.retry(); } },
      { label: 'Restart World 2', action: async (m) => {
        if (await UI.confirm('Restart World 2?', 'The race, tokens and buoys in this world reset.', 'Restart', 'Cancel')) { m.close(); Scenes.go('world2', { fresh: true }); }
      } },
    ];
    if (Save.data.cosmetics.goggles) {
      const on = Save.data.cosmetics.gogglesOn !== false;
      items.push({ label: 'Swim goggles: ' + (on ? 'ON' : 'OFF'), action: (m) => { Save.data.cosmetics.gogglesOn = !on; Save.write(); m.close(); this.pause(); } });
    }
    items.push({ label: 'How to play', action: () => UI.howto() }, { label: 'Settings', action: () => UI.settings() },
      { label: 'Quit to title', action: (m) => { m.close(); Save.write(); Scenes.go('title'); } });
    UI.menu({ title: 'Paused', sub: C.W2.number + ' · ' + C.W2.title + ' — ' + Math.max(0, this.time).toFixed(1) + ' s left', items, onBack: () => resume(UI.stack[UI.stack.length - 1]) });
  };

  /* ---------------- FX, camera, audio, HUD ---------------- */
  S.splash = function (x, y, n) { for (let i = 0; i < n; i++) this.parts.push({ x: x + U.rnd(-30, 30), y, vx: U.rnd(-180, 180), vy: U.rnd(-420, -160), life: 0.8, kind: 'drop' }); };
  S.updateFX = function (dt) {
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; if (q.kind === 'drop') q.vy += 900 * dt; q.life -= dt; if (q.kind === 'bub' && q.y < SURF + 4) q.life = 0; }
    this.parts = this.parts.filter(q => q.life > 0);
    for (const f of this.floaters) { f.y -= 30 * dt; f.life -= dt; }
    this.floaters = this.floaters.filter(f => f.life > 0);
    for (const b of this.barks) b.life -= dt;
    this.barks = this.barks.filter(b => b.life > 0);
    this.shake = Math.max(0, this.shake - dt);
    if (this.mode === 'floatie') this.floatT += dt;
  };
  S.updateCamera = function (dt) {
    const p = this.p, c = this.cam || (this.cam = { x: 0, y: 0 });
    const lookX = U.clamp(p.vx * 0.35, -160, 220), lookY = U.clamp(p.vy * 0.25, -100, 100);
    const tx = U.clamp(p.x + p.w / 2 - G.W * 0.42 + lookX, 0, LEVEL_W - G.W);
    const ty = U.clamp(p.y + p.h / 2 - G.H * 0.5 + lookY, 0, LEVEL_H - G.H);
    const k = Math.min(1, dt * 4);
    c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
  };
  S.updateAudio = function () {
    const p = this.p;
    const depth = p.state === 'race' ? U.clamp((p.y - SURF) / 650, 0, 0.75) : 0;
    if (Math.abs(depth - this.lastUW) > 0.05) { this.lastUW = depth; Audio.underwater(depth); }
  };
  S.syncHud = function () {
    const h = UI.hud, p = this.p, w = this.w;
    h.set('boost', p.charges);
    h.set('timer', Math.max(0, this.time).toFixed(1));
    h.set('warn', this.time < 10 && p.state === 'race');
    let s = '<svg viewBox="0 0 22 22"><circle cx="11" cy="11" r="9" fill="#ffd76a" stroke="#fbfffb" stroke-width="2"/><ellipse cx="7.5" cy="10.5" rx="3" ry="2" fill="#16231e"/><ellipse cx="14.5" cy="10.5" rx="3" ry="2" fill="#16231e"/></svg>';
    h.set('item', s + '<span>' + w.tokens.length + '/5</span>');
    const d = U.clamp((p.x + p.w / 2 - 240) / (FINISH_X - 240) * 100, 0, 100), t = U.clamp((this.tt.x - 240) / (FINISH_X - 240) * 100, 0, 100);
    h.set('race', d.toFixed(1) + ',' + t.toFixed(1));
  };

  /* ---------------- draw ---------------- */
  S.draw = function (ctx) {
    if (this.mode === 'floatie') return this.drawFloatie(ctx);
    const t = this.t, c = this.cam, O = this.O;
    let sx = 0, sy = 0;
    if (this.shake > 0) { sx = (Math.random() - 0.5) * 12 * this.shake / 0.25; sy = (Math.random() - 0.5) * 12 * this.shake / 0.25; }
    const cx = Math.round(c.x + sx), cy = Math.round(c.y + sy);
    const deep = U.clamp((cx + G.W / 2 - 262 * TS) / (12 * TS), 0, 1);
    const surfScreen = SURF - cy;
    Art2.water(ctx, cx, cy, surfScreen, t, deep);
    if (surfScreen > 0) Art2.sky(ctx, cx, surfScreen, t);
    ctx.save(); ctx.translate(-cx, -cy);
    const vis = (x, w) => x + (w || 0) > cx - 260 && x < cx + G.W + 260;
    // poolside: start deck & finish deck
    if (vis(0, 260)) {
      Art2.deck(ctx, 0, 6 * TS, SURF);
      Art2.sign(ctx, 14, SURF - 250, 'NO RUNNING  (panic-sprinting allowed?)');
      Art2.startBlock(ctx, 110, SURF, 4); Art2.startBlock(ctx, 218, SURF, 5);
    }
    if (vis(412 * TS, 320)) {
      Art2.deck(ctx, 412 * TS, 8 * TS, SURF);
      Art2.lifeguard(ctx, 417 * TS, SURF - 22);
      Art2.vending(ctx, 413 * TS + 10, SURF - 22, t, this.w.tokens.length >= 5);
    }
    if (vis(FINISH_X - 30, 60)) Art2.finishPad(ctx, FINISH_X, SURF + 20, FLOOR - 10, t);
    // far wall details
    for (const m of O.markers) if (vis(m.x - 150, 300)) Art2.depthMarker(ctx, m.x, m.y, m.text);
    if (vis(O.mural.x, 260)) Art2.mural(ctx, O.mural.x, O.mural.y, O.mural.w);
    if (vis(O.hole.x, 60) && !O.mural.seen) Art2.crackedTile(ctx, O.hole.x - 24, O.hole.y, t);
    for (const s of O.signs) if (vis(s.x, 460)) Art.sign(ctx, s.x, s.y, C.W2.signs[s.idx], 0);
    for (const b of O.buoys) if (vis(b.x - 60, 120)) Art2.buoy(ctx, b, SURF, FLOOR, t);
    // currents (under everything solid)
    for (const z of O.currents) if (vis(z.x, z.w)) Art2.current(ctx, z, t);
    for (const d of O.drains) if (vis(d.x - 240, 480)) Art2.drain(ctx, d, t);
    // tiles
    const x0 = Math.max(0, Math.floor(cx / TS) - 1), x1 = Math.min(COLS - 1, Math.ceil((cx + G.W) / TS) + 1);
    const y0 = Math.max(0, Math.floor(cy / TS)), y1 = Math.min(ROWS - 1, Math.ceil((cy + G.H) / TS));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (this.grid[y][x] !== '#') continue;
      const im = x >= 262 && x < 412 ? Art2.TILES.dark : (this.solid(x, y - 1) || y <= SURF / TS ? Art2.TILES.inner : Art2.TILES.top);
      ctx.drawImage(im, x * TS, y * TS);
    }
    // the tunnel's mouth
    if (vis(O.tunnel.x - 40, 80)) { ctx.fillStyle = 'rgba(22,35,30,.25)'; ctx.fillRect(O.tunnel.x - 6, O.tunnel.y, 6, O.tunnel.h); }
    Art2.caustics(ctx, cx, cx + G.W, SURF + 26, 70, t, 0.22);
    Art2.caustics(ctx, cx, cx + G.W, FLOOR - 70, 50, t * 0.8, 0.14);
    for (const j of O.jets) if (vis(j.x - 60, 120)) Art2.jet(ctx, j, t);
    for (const r of O.ropes) if (vis(r.x0, r.x1 - r.x0)) Art2.rope(ctx, r);
    for (const h of O.hoops) if (vis(h.x - 60, 120)) Art2.hoop(ctx, h, t);
    for (const n of O.noodles) if (vis(n.x - 100, 200)) Art2.noodle(ctx, n);
    for (const k of O.kicks) if (vis(k.x - 60, 120)) Art2.kickboard(ctx, k, t);
    for (const cl of O.cleaners) if (vis(cl.x - 60, 120)) Art2.cleaner(ctx, cl, t);
    for (const d of O.donuts) if (vis(d.x - 80, 160)) Art2.donut(ctx, d, t);
    // pickups
    for (const a of O.air) if (vis(a.x - 40, 80)) Art2.airBubble(ctx, a, t);
    for (const k of O.watches) if (!k.got && vis(k.x - 40, 80)) Art2.stopwatch(ctx, k, t);
    for (const k of O.tokens) if (!k.got && vis(k.x - 40, 80)) Art2.token(ctx, k, t);
    for (const q of O.quotes) if (!q.got && vis(q.x - 40, 80)) G.Art.quoteCard(ctx, { x: q.x - 20, y: q.y - 20 }, t);
    // Turtletimee
    const tt = this.tt;
    if (!tt.gone) {
      if (tt.onBlock) Chars.draw(ctx, 'tt', 'idle', tt.animT, 218, SURF - 86, DUCK_SCALE, { face: 1 });
      else Chars.draw(ctx, 'tt', 'swimDir', tt.animT, tt.x, tt.y, DUCK_SCALE, { face: tt.face, pitch: tt.pitch, speed: U.clamp(tt.speed / 400, 0, 1) });
    }
    // Duckquackquack
    const p = this.p, px = p.x + p.w / 2, py = p.y + p.h / 2;
    const after = Save.data.cosmetics.goggles && Save.data.cosmetics.gogglesOn !== false ? Chars.COSMETICS.goggles : null;
    if (p.state === 'deck') Chars.draw(ctx, 'duck', 'idle', this.t, p.x, SURF - 86, DUCK_SCALE, { face: 1, after });
    else if (!(p.inv > 0 && p.state === 'race' && Math.floor(t * 14) % 2 === 0)) {
      Chars.draw(ctx, 'duck', 'swimDir', p.animT, px, py, DUCK_SCALE, { face: p.face, pitch: p.pitch, speed: U.clamp(Math.hypot(p.vx, p.vy) / PHYS.max, 0, 1), boost: p.boostT > 0, stun: p.stunT > 0, after });
    }
    // particles
    for (const q of this.parts) {
      const a = Math.max(0, Math.min(1, q.life * 2));
      if (q.kind === 'bub') Chars.FX.bubble(ctx, q.x, q.y, q.r || 4, a);
      else if (q.kind === 'star') Chars.FX.star(ctx, q.x, q.y, 7 * a, q.life * 6, '#fff4cc');
      else if (q.kind === 'drop') { ctx.fillStyle = 'rgba(214,240,252,' + a + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, 6.3); ctx.fill(); }
    }
    Art2.surface(ctx, cx - 20, cx + G.W + 20, SURF, t);
    // speech bubbles (don't stop the race)
    for (const b of this.barks) {
      const bx = b.who === 'tt' ? tt.x : px, by = (b.who === 'tt' ? tt.y : py) - 52;
      if (b.who === 'tt' && tt.gone) continue;
      Art2.bark(ctx, bx, by, b.text, b.life * 2, b.who === 'tt' ? '#a995dc' : '#16231e');
    }
    for (const f of this.floaters) {
      ctx.save(); ctx.globalAlpha = Math.min(1, f.life * 2);
      Chars.FX.text(ctx, f.text, f.x, f.y, f.big ? 26 : 20, { fill: f.col || '#fbfffb' }); ctx.restore();
    }
    ctx.restore();
    // countdown & time-up (screen space)
    if (this.countT >= 0) {
      const n = Math.floor(this.countT / 0.8), k = (this.countT % 0.8) / 0.8;
      const label = n < 3 ? String(3 - n) : 'GO!';
      ctx.save(); ctx.globalAlpha = n >= 3 ? Math.max(0, 1 - k * 1.5) : 1;
      Chars.FX.text(ctx, label, G.W / 2, G.H * 0.42, 110, { scale: 1.4 - Math.min(1, k * 3) * 0.4, fill: n >= 3 ? '#9fe3c3' : '#fff4cc', shadow: '#f39b8a' });
      if (n < 3 && this.countMode === 'deck') Chars.FX.text(ctx, 'ON YOUR MARKS', G.W / 2, G.H * 0.42 - 100, 26, { fill: '#fbfffb' });
      ctx.restore();
    }
    if (p.state === 'timeup') {
      ctx.fillStyle = 'rgba(15,23,20,' + Math.min(0.45, p.timeT) + ')'; ctx.fillRect(0, 0, G.W, G.H);
      Chars.FX.text(ctx, C.W2.timeUp, G.W / 2, G.H * 0.44, 72, { fill: '#f39b8a', scale: 1 + Math.max(0, 0.3 - p.timeT) });
    }
    if (this.paused) { ctx.fillStyle = 'rgba(10,16,14,.25)'; ctx.fillRect(0, 0, G.W, G.H); }
  };

  /* the after-race scene: Duck lazing on a floatie, mountains, hot sun */
  S.drawFloatie = function (ctx) {
    const t = this.floatT || 0, W = G.W;
    Art2.sky(ctx, t * 20, 470, t);
    const g = ctx.createLinearGradient(0, 470, 0, G.H); g.addColorStop(0, '#9fdcef'); g.addColorStop(1, '#5fb1d6');
    ctx.fillStyle = g; ctx.fillRect(0, 470, W, G.H - 470);
    Art2.caustics(ctx, 0, W, 520, 160, t, 0.25);
    const fx = W / 2 + Math.sin(t * 0.4) * 40, fy = 486 + Math.sin(t * 1.4) * 6;
    Art2.floatie(ctx, fx, fy, t, 1.7);
    const after = Save.data.cosmetics.goggles && Save.data.cosmetics.gogglesOn !== false ? Chars.COSMETICS.goggles : null;
    // lying back on the floatie, legs dangling lazily, eyes mostly closed
    Chars.drawPose(ctx, 'duck_walk', { x: fx + 10, y: fy - 84, height: 300, face: 1, center: true, rot: -1.5 + Math.sin(t * 1.4) * 0.03,
      parts: { legL: Math.sin(t * 1.2) * 0.25, legR: Math.sin(t * 1.2 + 1) * 0.25 }, blink: (t % 3.5) < 2.2 ? 1 : 0, after });
    Art2.surface(ctx, -20, W + 20, 470, t);
    for (let i = 0; i < 3; i++) { const k = ((t * 0.5 + i / 3) % 1); ctx.save(); ctx.globalAlpha = 1 - k; Chars.FX.text(ctx, 'z', fx - 150 - k * 30, fy - 120 - k * 90, 20 + k * 16, { fill: '#fbfffb' }); ctx.restore(); }
  };

  S.debug = { TS, COLS, ROWS, SURF, FLOOR, FINISH_X, PHYS, buildLevel };
  Scenes.add('world2', S);
  G.World2 = S;
})(window.TT);
