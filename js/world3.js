/* =====================================================================
   world3.js — WORLD 3: INK OR SINK (top-down territory control)
   Cover 60% of the arena in Duck's mint ink before time runs out.

   How it differs from Worlds 1 and 2: a top-down arena. Duck walks in
   8 directions, AIMS WITH THE MOUSE and paints the floor. An ink tank
   empties as he paints and refills (fastest on his own ink). Painting
   charges KNIVES UP MY SLEEVE (Space). Turtletimee's Smudges paint the
   floor coral, slow Duck down and bump him; Turtletimee herself streams
   the match from a big screen and drops EMOTIONAL DAMAGE ink bombs.

   The arena layout is in buildArena() in cell coordinates (1 cell = 24 px).
   ===================================================================== */
(function (G) {
  'use strict';
  const { U, UI, Save, Audio, Scenes, Input, Art, Art2, Art3, Content: C } = G;
  const CELL = 24, GW = 80, GH = 50, AW = GW * CELL, AH = GH * CELL;
  const GOAL = 60;                       // % of the paintable floor to win
  const DUCK_SCALE = 104;                // a little smaller than side-on worlds: it's a wider view
  const T = {
    time: 165, speed: 250, slowSpeed: 160,
    fireCD: 0.13, shotSpeed: 720, shotRange: 360, shotCost: 0.035, shotPaint: 18, shotSplat: 48,
    refillOwn: 0.5, refillNeutral: 0.18, refillThem: 0.06,
    specialCells: 110, knives: 12, knifeRange: 520, knifeSpeed: 640,
    smudgeSpeed: [0, 95, 105, 112], smudgeCount: [0, 3, 4, 4], respawn: [0, 6, 6, 5], smudgePaint: 16,
    bombEvery: [0, 0, 13, 11], bombR: 88, bombDelay: 1.6,
    phase2: 30, phase3: 48,
  };

  /* ------------------------------------------------------------------
     ARENA
     ------------------------------------------------------------------ */
  function buildArena() {
    const O = [];
    const add = (x, y, w, h, kind, extra) => O.push(Object.assign({ cx: x, cy: y, cw: w, ch: h, x: x * CELL, y: y * CELL, w: w * CELL, h: h * CELL, kind }, extra || {}));
    add(28, 1, 24, 9, 'pad', { stage: true });             // the big screen's stage
    add(4, 4, 5, 4, 'pot'); add(71, 4, 5, 4, 'pot');        // Smudge paint pots (spawners)
    add(14, 14, 3, 3, 'pillar'); add(63, 14, 3, 3, 'pillar'); add(14, 33, 3, 3, 'pillar'); add(63, 33, 3, 3, 'pillar');
    add(36, 22, 8, 5, 'crate', { label: true });            // merch crates in the middle
    add(22, 24, 7, 2, 'wall'); add(51, 24, 7, 2, 'wall');
    add(39, 11, 2, 5, 'wall'); add(39, 33, 2, 4, 'wall');
    add(6, 20, 2, 9, 'planter'); add(72, 20, 2, 9, 'planter');
    add(10, 40, 5, 3, 'crate', { label: true });
    add(64, 39, 7, 2, 'crate'); add(62, 41, 2, 6, 'crate'); // the nook hiding the secret square
    return {
      obstacles: O,
      pots: [{ x: 6.5 * CELL, y: 9 * CELL }, { x: 73.5 * CELL, y: 9 * CELL }],
      start: { x: 40 * CELL, y: 45 * CELL },
      secret: { cx: 66, cy: 43, cw: 4, ch: 4 },
      screen: { x: 28 * CELL + 14, y: 14, w: 24 * CELL - 28, h: 9 * CELL - 34 },
      signs: [[34, 38.5, 0], [44, 38.5, 1], [24, 44, 2], [44.5, 41.5, 3], [33, 30, 4]],
    };
  }

  /* ------------------------------------------------------------------
     SCENE
     ------------------------------------------------------------------ */
  const S = {};
  S.enter = async function (data) {
    data = data || {};
    UI.closeAll();
    this.A = buildArena();
    this.w = Save.data.worlds.w3;
    if (!this.w.done) Save.data.progress.stage = 'world3';
    Save.data.progress.checkpoint = null; Save.write();
    this.reset();
    UI.hud.show({ kind: 'ink', number: C.W3.number, title: C.W3.title, goal: GOAL });
    G.canvas.classList.add('aim');
    this.syncHud();
    Audio.music('world3');
    await UI.fade(false, 400);
    this.busy = true;
    await UI.card(C.W3.number, C.W3.title, C.W3.goal, 2400);
    if (Scenes.current !== S) return;
    if (!data.quick) await UI.say(C.W3.intro);
    if (Scenes.current !== S) return;
    this.busy = false; this.countT = 0;
  };

  /* (re)start a match: clean floor, fresh timer */
  S.reset = function () {
    const A = this.A;
    this.blocked = new Uint8Array(GW * GH); this.owner = new Uint8Array(GW * GH);
    for (let x = 0; x < GW; x++) for (let y = 0; y < GH; y++) if (x === 0 || y === 0 || x === GW - 1 || y === GH - 1) this.blocked[y * GW + x] = 1;
    for (const o of A.obstacles) for (let y = o.cy; y < o.cy + o.ch; y++) for (let x = o.cx; x < o.cx + o.cw; x++) this.blocked[y * GW + x] = 1;
    this.paintable = 0; for (let i = 0; i < this.blocked.length; i++) if (!this.blocked[i]) this.paintable++;
    this.count = [0, 0, 0];
    this.floor = this.floor || Art3.buildFloor(AW, AH, CELL, { x: A.secret.cx * CELL, y: A.secret.cy * CELL, w: A.secret.cw * CELL, h: A.secret.ch * CELL });
    this.paintC = this.paintC || document.createElement('canvas'); this.paintC.width = AW; this.paintC.height = AH;
    this.pctx = this.paintC.getContext('2d');
    this.t = 0; this.time = T.time; this.paused = false; this.busy = false; this.ended = false; this.countT = -1; this.state = 'play';
    this.phase = 1; this.bombT = 0; this.bombs = []; this.shots = []; this.knives = []; this.parts = []; this.floaters = [];
    this.banners = []; this.barks = []; this.shake = 0; this.slowmo = 0; this.chat = C.W3.chat.slice(0, 6); this.chatT = 0; this.chatScroll = 0;
    this.stats = { popped: 0, specials: 0, bombHits: 0, screenHits: 0 }; this.secretFound = !!this.w.quote; this.ttBarkT = 8; this.screenFx = 0; this.glint = 0; this.push = 0;
    const st = A.start;
    this.p = { x: st.x, y: st.y, vx: 0, vy: 0, face: 1, ink: 1, special: 0, stun: 0, animT: 0, fireCD: 0, sinceFire: 9, specialT: -1, noInkT: 0 };
    this.smudges = [];
    for (let i = 0; i < T.smudgeCount[1]; i++) this.spawnSmudge(i);
    this.paint(st.x, st.y, 70, 1, true);                   // a little starting puddle of Duck ink
    this.p.special = 0;
    this.cam = { x: U.clamp(st.x - G.W / 2, 0, AW - G.W), y: U.clamp(st.y - G.H / 2, 0, AH - G.H) };
  };

  S.exit = function () { UI.hud.hide(); G.canvas.classList.remove('aim'); this.paused = false; };
  S.onBlur = function () { if (!this.paused && !this.ended && !UI.isOpen() && this.state === 'play' && this.countT < 0) this.pause(); };

  /* ---------------- grid & painting ---------------- */
  S.cellAt = (x, y) => [Math.floor(x / CELL), Math.floor(y / CELL)];
  S.isBlocked = function (cx, cy) { return cx < 0 || cy < 0 || cx >= GW || cy >= GH || this.blocked[cy * GW + cx] === 1; };
  S.blockedAt = function (x, y) { return this.isBlocked(Math.floor(x / CELL), Math.floor(y / CELL)); };
  S.ownerAt = function (x, y) { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return this.isBlocked(cx, cy) ? 0 : this.owner[cy * GW + cx]; };
  /* paint every free cell within r px of (x, y). Returns how many cells changed. */
  S.paint = function (x, y, r, team, quiet, soft) {
    const c0x = Math.max(1, Math.floor((x - r) / CELL)), c1x = Math.min(GW - 2, Math.floor((x + r) / CELL));
    const c0y = Math.max(1, Math.floor((y - r) / CELL)), c1y = Math.min(GH - 2, Math.floor((y + r) / CELL));
    const col = team === 1 ? Art3.P.me : Art3.P.them, pc = this.pctx;
    let changed = 0;
    pc.fillStyle = col;
    for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) {
      const i = cy * GW + cx;
      if (this.blocked[i]) continue;
      const mx = (cx + 0.5) * CELL, my = (cy + 0.5) * CELL;
      if ((mx - x) ** 2 + (my - y) ** 2 > r * r) continue;
      const o = this.owner[i];
      if (o === team) continue;
      if (soft && o === 1 && (mx - x) ** 2 + (my - y) ** 2 > soft * soft) continue;   // Smudges only take Duck's ink in a narrow strip
      if (o === 2 && team === 1) this.retaken = (this.retaken || 0) + 1;
      if (o) this.count[o]--;
      this.owner[i] = team; this.count[team]++; changed++;
      const h = U.hash(i * 1.7 + team);
      pc.beginPath(); pc.arc(mx + (h - 0.5) * 6, my + (U.hash(i * 3.1) - 0.5) * 6, CELL * (0.72 + h * 0.14), 0, 6.283); pc.fill();
    }
    if (changed && team === 1 && !this.noCharge) { const bonus = this.retaken || 0; this.p.special = Math.min(1, this.p.special + (changed + bonus) / T.specialCells); }
    this.retaken = 0;
    return changed;
  };
  /* decorative ink droplets (do not change ownership) */
  S.splatFx = function (x, y, r, team) {
    const pc = this.pctx, col = team === 1 ? Art3.P.me : Art3.P.them, hi = team === 1 ? Art3.P.meHi : Art3.P.themHi;
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * 6.283, d = r * (0.85 + Math.random() * 0.4);
      const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      if (this.ownerAt(px, py) !== team) continue;          // droplets only land on matching ink
      pc.fillStyle = col; pc.beginPath(); pc.arc(px, py, 3 + Math.random() * 5, 0, 6.283); pc.fill();
    }
    pc.fillStyle = hi; pc.globalAlpha = 0.6; pc.beginPath(); pc.ellipse(x - r * 0.25, y - r * 0.25, r * 0.18, r * 0.09, -0.6, 0, 6.283); pc.fill(); pc.globalAlpha = 1;
    for (let i = 0; i < 8; i++) { const a = Math.random() * 6.283, s = 120 + Math.random() * 200; this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.35, team, r: 3 + Math.random() * 3 }); }
  };
  S.coverage = function () { return [this.count[1] / this.paintable * 100, this.count[2] / this.paintable * 100]; };

  /* ---------------- update ---------------- */
  S.update = function (dt) {
    if (this.ended) { this.t += dt; this.updateFX(dt); return; }
    if (Input.hit('pause') && !this.busy && !UI.isOpen() && !UI.inDialogue() && this.state === 'play') { this.countT = -1; this.pause(); return; }
    if (this.paused || UI.isOpen() || UI.inDialogue() || this.busy) return;
    // slow motion during Duck's special
    const sdt = dt * (this.slowmo > 0 ? 0.35 : 1);
    this.slowmo = Math.max(0, this.slowmo - dt);
    this.t += sdt;
    if (this.countT >= 0) {
      this.countT += dt;
      const n = Math.floor(this.countT / 0.7);
      if (n !== this.lastBeep) { this.lastBeep = n; if (n < 3) Audio.sfx('beep'); else if (n === 3) Audio.sfx('go'); }
      if (this.countT > 2.1 + 0.7) this.countT = -1;
      this.updateCamera(dt); this.updateFX(dt);
      if (this.countT >= 0 && this.countT < 2.1) return;
    }
    if (this.state !== 'play') { this.updateFX(dt); return; }
    this.time -= sdt;
    this.updatePlayer(sdt, dt);
    this.updateShots(sdt);
    this.updateSmudges(sdt);
    this.updateBombs(sdt);
    this.updateTT(sdt);
    this.updateFX(sdt);
    this.updateCamera(dt);
    this.checkProgress();
    this.syncHud();
  };

  S.updatePlayer = function (dt, realDt) {
    const p = this.p;
    p.stun = Math.max(0, p.stun - dt); p.fireCD -= dt; p.sinceFire += dt; p.noInkT = Math.max(0, p.noInkT - dt);
    const aim = this.aim();
    if (Math.abs(aim.x - p.x) > 8) p.face = Math.sign(aim.x - p.x);
    // special in progress
    if (p.specialT >= 0) {
      p.specialT += realDt;
      if (!p.thrown && p.specialT > 0.77) this.releaseKnives();
      if (p.specialT > 1.25) p.specialT = -1;
      p.vx *= 0.8; p.vy *= 0.8;
      return;
    }
    let ix = 0, iy = 0;
    if (p.stun <= 0) { ix = (Input.isDown('right') ? 1 : 0) - (Input.isDown('left') ? 1 : 0); iy = (Input.isDown('down') ? 1 : 0) - (Input.isDown('up') ? 1 : 0); }
    const l = Math.hypot(ix, iy); if (l) { ix /= l; iy /= l; }
    const under = this.ownerAt(p.x, p.y);
    const sp = under === 2 ? T.slowSpeed : T.speed;
    p.vx = U.lerp(p.vx, ix * sp, Math.min(1, dt * 14)); p.vy = U.lerp(p.vy, iy * sp, Math.min(1, dt * 14));
    this.moveCircle(p, 15, dt);
    p.animT += dt * (Math.hypot(p.vx, p.vy) > 30 ? Math.max(0.7, Math.hypot(p.vx, p.vy) / T.speed) : 1);
    // painting
    const firing = p.stun <= 0 && (Input.mouse.down || Input.isDown('attack'));
    if (firing && p.fireCD <= 0) {
      if (p.ink >= T.shotCost) this.fire(aim); else if (p.noInkT <= 0) { p.noInkT = 0.7; Audio.sfx('locked'); this.floaters.push({ x: p.x, y: p.y - 110, text: 'OUT OF INK', life: 0.9, col: '#ffc0b4' }); }
      p.fireCD = T.fireCD;
    }
    if (!firing) p.sinceFire = Math.max(p.sinceFire, 0);
    if (p.sinceFire > 0.35) p.ink = Math.min(1, p.ink + dt * (under === 1 ? T.refillOwn : under === 2 ? T.refillThem : T.refillNeutral));
    // special
    if (Input.hit('special') && p.special >= 1 && p.stun <= 0) this.startSpecial();
  };
  S.aim = function () { return { x: Input.mouse.x + this.cam.x, y: Input.mouse.y + this.cam.y }; };
  /* circle-ish movement with wall sliding (works for Duck and Smudges) */
  S.moveCircle = function (e, r, dt) {
    const nx = e.x + e.vx * dt;
    if (!this.blockedAt(nx + Math.sign(e.vx) * r, e.y - r * 0.6) && !this.blockedAt(nx + Math.sign(e.vx) * r, e.y + r * 0.6)) e.x = nx; else { e.vx = 0; e.hitWall = true; }
    const ny = e.y + e.vy * dt;
    if (!this.blockedAt(e.x - r * 0.6, ny + Math.sign(e.vy) * r) && !this.blockedAt(e.x + r * 0.6, ny + Math.sign(e.vy) * r)) e.y = ny; else { e.vy = 0; e.hitWall = true; }
  };

  S.fire = function (aim) {
    const p = this.p;
    const ox = p.x + p.face * 14, oy = p.y - 34;
    let a = Math.atan2(aim.y - oy, aim.x - ox) + (Math.random() - 0.5) * 0.08;
    this.shots.push({ x: ox, y: oy, vx: Math.cos(a) * T.shotSpeed, vy: Math.sin(a) * T.shotSpeed, dist: 0, range: T.shotRange * (0.9 + Math.random() * 0.15), lastPaint: 0, team: 1 });
    p.ink -= T.shotCost; p.sinceFire = 0;
    Audio.sfx('shoot');
  };
  S.updateShots = function (dt) {
    const step = (b, paintR, splatR, isKnife) => {
      const sx = b.vx * dt, sy = b.vy * dt, d = Math.hypot(sx, sy);
      b.x += sx; b.y += sy; b.dist += d; b.lastPaint += d;
      if (isKnife) b.ang += dt * 16;
      const fx = b.x, fy = b.y + (isKnife ? 0 : 30);            // ink lands on the floor below the blob
      this.noCharge = isKnife;                                  // the special's own ink does not recharge it
      if (b.lastPaint > 14) { b.lastPaint = 0; this.paint(fx, fy, paintR, 1); }
      // the big screen
      const sc = this.A.screen;
      if (b.x > sc.x && b.x < sc.x + sc.w && b.y > sc.y && b.y < sc.y + sc.h + 40) { this.hitScreen(); b.dead = true; return; }
      if (this.blockedAt(fx, fy)) { this.paint(b.x - b.vx * 0.02, fy - b.vy * 0.02, splatR * 0.8, 1); this.splatFx(b.x - b.vx * 0.02, fy - b.vy * 0.02, splatR * 0.6, 1); Audio.sfx('splat'); b.dead = true; return; }
      for (const s of this.smudges) if (!s.dead && s.popT == null && Math.hypot(s.x - b.x, s.y - 14 - (b.y + (isKnife ? 0 : 20))) < 26) { this.popSmudge(s); if (!isKnife) { b.dead = true; return; } }
      if (b.dist >= b.range) { this.paint(fx, fy, splatR, 1); this.splatFx(fx, fy, splatR, 1); if (!isKnife || Math.random() < 0.5) Audio.sfx('splat'); b.dead = true; }
    };
    for (const b of this.shots) step(b, T.shotPaint, T.shotSplat, false);
    for (const k of this.knives) step(k, 24, 48, true);
    this.noCharge = false;
    this.shots = this.shots.filter(b => !b.dead); this.knives = this.knives.filter(k => !k.dead);
  };

  /* ---------------- KNIVES UP MY SLEEVE ---------------- */
  S.startSpecial = function () {
    const p = this.p;
    p.special = 0; p.specialT = 0; p.thrown = false; this.slowmo = 1.0; this.stats.specials++;
    Audio.sfx('shing'); Audio.sfx('quack');
    this.banners.push({ text: C.W3.special, life: 1.6 });
    this.pushChat('chat: KNIVES KNIVES KNIVES');
    if (this.stats.specials >= 3) Save.unlock('w3_knives');
  };
  S.releaseKnives = function () {
    const p = this.p; p.thrown = true;
    const aim = this.aim(), base = Math.atan2(aim.y - p.y, aim.x - p.x);
    for (let i = 0; i < T.knives; i++) {
      const a = base + i / T.knives * Math.PI * 2;
      this.knives.push({ x: p.x, y: p.y, vx: Math.cos(a) * T.knifeSpeed, vy: Math.sin(a) * T.knifeSpeed, dist: 0, range: T.knifeRange, lastPaint: 0, ang: a, team: 1 });
    }
    this.noCharge = true; this.paint(p.x, p.y, 78, 1); this.noCharge = false; this.splatFx(p.x, p.y, 70, 1);
    for (const s of this.smudges) if (!s.dead && s.popT == null && Math.hypot(s.x - p.x, s.y - p.y) < 130) this.popSmudge(s);
    Audio.sfx('special'); this.shake = 0.35;
  };

  /* ---------------- Smudges ---------------- */
  S.spawnSmudge = function (i) {
    const pot = this.A.pots[i % 2];
    this.smudges.push({ x: pot.x + (Math.random() - 0.5) * 30, y: pot.y + 10, vx: 0, vy: 0, seed: Math.random() * 10, target: null, retarget: 0, stun: 0, dead: false, respawnT: 0, popT: null, lastPaint: 0 });
  };
  S.pickTarget = function (s) {
    let best = null, bestScore = -1e9;
    for (let k = 0; k < 10; k++) {
      const cx = 1 + Math.floor(Math.random() * (GW - 2)), cy = 1 + Math.floor(Math.random() * (GH - 2));
      if (this.blocked[cy * GW + cx]) continue;
      const x = (cx + 0.5) * CELL, y = (cy + 0.5) * CELL, o = this.owner[cy * GW + cx];
      const score = (o === 1 ? 3 : o === 0 ? 2 : 0) - Math.hypot(x - s.x, y - s.y) / 700;
      if (score > bestScore) { bestScore = score; best = { x, y }; }
    }
    s.target = best; s.retarget = 3.5 + Math.random() * 2;
  };
  S.updateSmudges = function (dt) {
    const want = T.smudgeCount[this.phase];
    while (this.smudges.length < want) this.spawnSmudge(this.smudges.length);
    // the further ahead the Smudges are, the lazier they get (keeps the match from snowballing)
    const them = this.coverage()[1], p = this.p;
    const sp = T.smudgeSpeed[this.phase] * U.clamp(1.35 - them / 40, 0.45, 1);
    for (const s of this.smudges) {
      if (s.popT != null) { s.popT += dt; if (s.popT > 0.25) { s.popT = null; s.dead = true; s.respawnT = T.respawn[this.phase]; } continue; }
      if (s.dead) { s.respawnT -= dt; if (s.respawnT <= 0) { const pot = this.A.pots[Math.random() < 0.5 ? 0 : 1]; Object.assign(s, { dead: false, x: pot.x, y: pot.y + 10, target: null, stun: 0 }); } continue; }
      s.stun = Math.max(0, s.stun - dt);
      s.retarget -= dt;
      if (!s.target || s.retarget <= 0 || s.hitWall || Math.hypot(s.target.x - s.x, s.target.y - s.y) < 20) { s.hitWall = false; this.pickTarget(s); }
      if (s.stun > 0 || !s.target) { s.vx *= 0.8; s.vy *= 0.8; continue; }
      const dx = s.target.x - s.x, dy = s.target.y - s.y, d = Math.hypot(dx, dy) || 1;
      s.vx = U.lerp(s.vx, dx / d * sp, Math.min(1, dt * 6)); s.vy = U.lerp(s.vy, dy / d * sp, Math.min(1, dt * 6));
      const ox = s.x, oy = s.y;
      this.moveCircle(s, 14, dt);
      s.lastPaint += Math.hypot(s.x - ox, s.y - oy);
      if (s.lastPaint > 10) { s.lastPaint = 0; this.paint(s.x, s.y, T.smudgePaint, 2, false, 9); }
      // bumping into Duck
      if (p.stun <= 0 && p.specialT < 0 && Math.hypot(s.x - p.x, s.y - p.y) < 30) {
        const ax = (p.x - s.x) / (Math.hypot(p.x - s.x, p.y - s.y) || 1), ay = (p.y - s.y) / (Math.hypot(p.x - s.x, p.y - s.y) || 1);
        p.vx = ax * 340; p.vy = ay * 340; p.stun = 0.5; s.stun = 0.6;
        this.moveCircle(p, 15, 0.08);
        this.paint(p.x, p.y, 30, 2); this.splatFx(p.x, p.y, 26, 2);
        Audio.sfx('bump'); this.shake = 0.15;
      }
    }
  };
  S.popSmudge = function (s) {
    s.popT = 0; this.stats.popped++;
    this.paint(s.x, s.y, 46, 1); this.splatFx(s.x, s.y, 40, 1);
    Audio.sfx('smudgePop');
    if (Math.random() < 0.35) this.ttBark(C.W3.barksTTPop); else if (Math.random() < 0.25) this.duckBark(C.W3.barksDuck);
  };

  /* ---------------- Turtletimee: the big screen ---------------- */
  S.updateTT = function (dt) {
    this.screenFx = Math.max(0, this.screenFx - dt * 3); this.glint = Math.max(0, this.glint - dt * 2); this.push = Math.max(0, this.push - dt * 2);
    this.chatT -= dt; this.chatScroll = Math.max(0, this.chatScroll - dt * 60);
    if (this.chatT <= 0) { this.chatT = 1.8 + Math.random() * 1.6; this.pushChat(C.W3.chat[Math.floor(Math.random() * C.W3.chat.length)]); }
    this.ttBarkT -= dt;
    if (this.ttBarkT <= 0) { this.ttBarkT = 10 + Math.random() * 5; this.ttBark(C.W3.barksTT); }
    // EMOTIONAL DAMAGE bombs from phase 2
    const every = T.bombEvery[this.phase];
    if (every) { this.bombT += dt; if (this.bombT >= every) { this.bombT = 0; this.dropBomb(); } }
  };
  S.pushChat = function (line) { this.chat.push(line); if (this.chat.length > 8) this.chat.shift(); this.chatScroll = 17; };
  S.ttBark = function (list) { this.barks = this.barks.filter(b => b.who !== 'tt'); this.barks.push({ who: 'tt', text: list[Math.floor(Math.random() * list.length)], life: 3 }); };
  S.duckBark = function (list) { this.barks = this.barks.filter(b => b.who !== 'duck'); this.barks.push({ who: 'duck', text: list[Math.floor(Math.random() * list.length)], life: 2.2 }); };
  S.dropBomb = function () {
    const p = this.p;
    let x = p.x + p.vx * 0.6, y = p.y + p.vy * 0.6;
    x = U.clamp(x, 60, AW - 60); y = U.clamp(y, 220, AH - 60);
    this.bombs.push({ x, y, r: T.bombR, t: 0, delay: T.bombDelay });
    this.glint = 1; this.push = 1;
    Audio.sfx('bombWarn'); this.pushChat('emotional_damage_bot: incoming');
  };
  S.updateBombs = function (dt) {
    const p = this.p;
    for (const b of this.bombs) {
      b.t += dt;
      if (b.t >= b.delay) {
        b.dead = true;
        this.paint(b.x, b.y, b.r, 2); this.splatFx(b.x, b.y, b.r * 0.9, 2);
        Audio.sfx('bombHit'); Audio.sfx('stamp'); this.shake = 0.3;
        if (Math.hypot(p.x - b.x, p.y - b.y) < b.r && p.specialT < 0) {
          const d = Math.hypot(p.x - b.x, p.y - b.y) || 1;
          p.vx = (p.x - b.x) / d * 420; p.vy = (p.y - b.y) / d * 420; p.stun = 0.9;
          this.stats.bombHits++;
          this.banners.push({ text: 'EMOTIONAL DAMAGE', life: 1.4, col: '#fbfffb' });
        } else this.floaters.push({ x: b.x, y: b.y - 40, text: 'EMOTIONAL DAMAGE', life: 1.2, col: '#ffc0b4' });
      }
    }
    this.bombs = this.bombs.filter(b => !b.dead);
  };
  S.hitScreen = function () {
    this.stats.screenHits++; this.screenFx = 1; Audio.sfx('screenHit');
    if (this.stats.screenHits === 10) {
      this.ttBark([C.W3.screenHit]); this.w.screen = true; Save.write(); Save.unlock('w3_screen');
      this.dropBomb();                                    // she retaliates
    }
  };

  /* ---------------- progress: phases, secret, win/lose ---------------- */
  S.checkProgress = function () {
    const [me] = this.coverage();
    if (this.phase === 1 && me >= T.phase2) {
      this.phase = 2; this.bombT = T.bombEvery[2] - 3;
      this.banners.push({ text: C.W3.phase2, sub: C.W3.phase2b, life: 2.4, col: '#ffc0b4' });
      this.ttBark([C.W3.phase2]);
    } else if (this.phase === 2 && me >= T.phase3) {
      this.phase = 3;
      this.banners.push({ text: C.W3.phase3, life: 2.4, col: '#ffc0b4' });
      this.ttBark([C.W3.phase3]); Audio.music('world3hype');
    }
    // the suspicious blank square in the corner
    if (!this.secretFound) {
      const sq = this.A.secret; let n = 0;
      for (let y = sq.cy; y < sq.cy + sq.ch; y++) for (let x = sq.cx; x < sq.cx + sq.cw; x++) if (this.owner[y * GW + x] === 1) n++;
      if (n >= sq.cw * sq.ch - 2) { this.secretFound = true; this.foundQuote(); return; }
    }
    if (me >= GOAL) this.win();
    else if (this.time <= 0) this.lose();
  };
  S.foundQuote = async function () {
    this.busy = true;
    Audio.sfx('quote');
    await UI.say(C.W3.secret);
    const q = C.QUOTES.find(x => x.id === 'q3');
    Save.data.quotes.q3 = true; this.w.quote = true; Save.write();
    await UI.quotePanel(q.text, Object.keys(Save.data.quotes).length);
    Save.unlock('quote3');
    if (Scenes.current === S) this.busy = false;
  };

  S.lose = function () {
    this.state = 'lose'; this.time = 0; this.w.tries = (this.w.tries || 0) + 1; Save.write();
    Audio.stop(0.2); Audio.sfx('lose');
    this.banners.push({ text: C.W3.lose, sub: 'Out of time', life: 9, col: '#ffc0b4' });
    this.ttBark(['Sink.']);
    const me = this.coverage()[0];
    setTimeout(() => {
      if (Scenes.current !== S || this.state !== 'lose') return;
      UI.menu({
        title: 'Out of time', sub: 'You covered ' + me.toFixed(1) + '% — you need ' + GOAL + '%. Tip: stand on your own ink to refill faster, pop Smudges, and save KNIVES for big empty areas.',
        items: [
          { label: 'Try again', primary: true, action: (m) => { m.close(); this.restart(); } },
          { label: 'Quit to title', action: (m) => { m.close(); Scenes.go('title'); } },
        ],
      });
    }, 1400);
  };
  S.restart = function () {
    this.reset(); this.syncHud(); Audio.music('world3'); this.countT = 0; this.lastBeep = -1;
  };
  S.win = async function () {
    this.state = 'win'; this.ended = true; this.busy = true;
    const [me, them] = this.coverage(), left = Math.max(0, this.time);
    Audio.stop(0.3); Audio.sfx('win');
    this.banners.push({ text: Math.floor(me) + '% COVERED!', sub: 'The floor is yours.', life: 3, col: '#9df0c8' });
    this.syncHud();
    await U.wait(2600); if (Scenes.current !== S) return;
    this.screenOff = false;
    await UI.say(C.W3.win.slice(0, 5)); if (Scenes.current !== S) return;
    this.screenOff = true; Audio.sfx('clunk');
    await UI.say(C.W3.win.slice(5)); if (Scenes.current !== S) return;
    await this.results(me, them, left); if (Scenes.current !== S) return;
    await UI.fade(true, 600);
    Scenes.go('w3end');
    UI.fade(false, 600);
  };
  S.results = function (me, them, left) {
    const w = this.w, st = this.stats;
    const score = Math.round(me * 30) + Math.round(left * 15) + st.popped * 40 + st.specials * 60 + (w.quote ? 200 : 0) + (w.screen ? 100 : 0) + (st.bombHits === 0 ? 300 : 0);
    const best = w.best || {};
    const newBest = !best.score || score > best.score;
    w.done = true; w.best = { score: Math.max(score, best.score || 0), cover: Math.max(me, best.cover || 0) };
    Save.data.progress.stage = 'final'; Save.data.progress.checkpoint = null; Save.write();
    Save.unlock('w3_clear');
    if (left > 60) Save.unlock('w3_fast');
    if (st.bombHits === 0) Save.unlock('w3_stable');
    Audio.music('results');
    return new Promise((res) => {
      const pnl = UI.el('div', 'panel results');
      const row = (a, b, cls) => '<span class="' + (cls || '') + '">' + a + '</span><span class="' + (cls || '') + '">' + b + '</span>';
      pnl.innerHTML = '<h2 class="panel-title">World 3 complete!</h2><div class="stats">' +
        row('Your ink', me.toFixed(1) + '%') + row('Smudge ink', them.toFixed(1) + '%') + row('Time left', Math.round(left) + ' s') +
        row('Smudges popped', st.popped) + row('Knives Up My Sleeve', st.specials + '×') + row('Emotional damage taken', st.bombHits) +
        row('Secrets', (w.quote ? 1 : 0) + (w.screen ? 1 : 0) + ' / 2') +
        row('Score' + (newBest ? ' (new best!)' : ''), score, 'total') + '</div>';
      const got = C.ACHIEVEMENTS.filter(a => Save.data.achievements[a.id] && (a.id.startsWith('w3') || a.id === 'quote3'));
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
      { label: 'Restart match', action: async (m) => { if (await UI.confirm('Restart the match?', 'The floor is wiped and the timer resets.', 'Restart', 'Cancel')) { m.close(); this.paused = false; this.restart(); } } },
    ];
    if (Save.data.cosmetics.goggles) {
      const on = Save.data.cosmetics.gogglesOn !== false;
      items.push({ label: 'Swim goggles: ' + (on ? 'ON' : 'OFF'), action: (m) => { Save.data.cosmetics.gogglesOn = !on; Save.write(); m.close(); this.pause(); } });
    }
    items.push({ label: 'How to play', action: () => UI.howto() }, { label: 'Settings', action: () => UI.settings() },
      { label: 'Quit to title', action: (m) => { m.close(); Scenes.go('title'); } });
    UI.menu({ title: 'Paused', sub: C.W3.number + ' · ' + C.W3.title + ' — ' + this.coverage()[0].toFixed(1) + '% covered, ' + Math.ceil(this.time) + ' s left', items, onBack: () => resume(UI.stack[UI.stack.length - 1]) });
  };

  /* ---------------- FX, camera, HUD ---------------- */
  S.updateFX = function (dt) {
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.9; q.vy *= 0.9; q.life -= dt; }
    this.parts = this.parts.filter(q => q.life > 0);
    for (const f of this.floaters) { f.y -= 30 * dt; f.life -= dt; }
    this.floaters = this.floaters.filter(f => f.life > 0);
    for (const b of this.banners) b.life -= dt;
    this.banners = this.banners.filter(b => b.life > 0);
    for (const b of this.barks) b.life -= dt;
    this.barks = this.barks.filter(b => b.life > 0);
    this.shake = Math.max(0, this.shake - dt);
  };
  S.updateCamera = function (dt) {
    const p = this.p, c = this.cam, a = this.aim();
    const tx = U.clamp(p.x - G.W / 2 + (a.x - p.x) * 0.18, 0, AW - G.W), ty = U.clamp(p.y - G.H / 2 + (a.y - p.y) * 0.18, 0, AH - G.H);
    const k = Math.min(1, dt * 6); c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
  };
  S.syncHud = function () {
    const h = UI.hud, p = this.p, [me, them] = this.coverage();
    h.set('ink', Math.max(0, p.ink).toFixed(2));
    h.set('knives', p.special >= 1 ? 1 : +p.special.toFixed(2));
    h.set('timer', String(Math.max(0, Math.ceil(this.time))));
    h.set('warn', this.time < 15 && this.state === 'play');
    h.set('cover', me.toFixed(1) + ',' + them.toFixed(1));
    h.set('goalMet', me >= GOAL);
    if (p.special >= 1 && !this.readyShown) { this.readyShown = true; Audio.sfx('ready'); this.floaters.push({ x: p.x, y: p.y - 120, text: 'KNIVES READY — SPACE', life: 1.6, col: '#fff4cc' }); }
    if (p.special < 1) this.readyShown = false;
  };

  /* ---------------- draw ---------------- */
  S.draw = function (ctx) {
    const t = this.t, c = this.cam, A = this.A, p = this.p;
    let sx = 0, sy = 0;
    if (this.shake > 0) { sx = (Math.random() - 0.5) * 14 * this.shake / 0.3; sy = (Math.random() - 0.5) * 14 * this.shake / 0.3; }
    const cx = Math.round(c.x + sx), cy = Math.round(c.y + sy);
    ctx.fillStyle = '#2a2440'; ctx.fillRect(0, 0, G.W, G.H);
    ctx.save(); ctx.translate(-cx, -cy);
    // floor + ink
    const vx0 = Math.max(0, cx), vy0 = Math.max(0, cy), vw = Math.min(AW, cx + G.W) - vx0, vh = Math.min(AH, cy + G.H) - vy0;
    ctx.drawImage(this.floor, vx0, vy0, vw, vh, vx0, vy0, vw, vh);
    ctx.drawImage(this.paintC, vx0, vy0, vw, vh, vx0, vy0, vw, vh);
    // arena fence
    ctx.strokeStyle = '#5b4f7d'; ctx.lineWidth = CELL * 2; ctx.strokeRect(0, 0, AW, AH);
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 3; ctx.strokeRect(CELL, CELL, AW - CELL * 2, AH - CELL * 2);
    // floor signs (the tutorial)
    // floor signs (the tutorial) fade once the match is under way
    const signA = U.clamp(1 - (this.coverage()[0] - 12) / 8, 0, 1);
    if (signA > 0) { ctx.save(); ctx.globalAlpha = signA; for (const [x, y, i] of A.signs) Art.sign(ctx, x * CELL, y * CELL, C.W3.signs[i], 0); ctx.restore(); }
    // bomb warnings (on the floor)
    for (const b of this.bombs) Art3.bombWarn(ctx, b, t);
    // depth-sorted: obstacles, smudges, Duck, the screen
    const list = [];
    for (const o of A.obstacles) if (!o.stage) list.push({ y: o.y + o.h, f: () => Art3.block(ctx, o, t) });
    list.push({ y: 9 * CELL + 1, f: () => {
      Art3.block(ctx, A.obstacles[0], t);
      Art3.jumbotron(ctx, A.screen, t, { off: this.screenOff, chat: this.chat, chatScroll: this.chatScroll, flash: this.screenFx * 0.5, glint: this.glint, push: this.push, anger: this.screenFx, viewers: 1200 + Math.round(this.count[1] * 3) });
    } });
    for (const s of this.smudges) if (!s.dead) list.push({ y: s.y, f: () => Art3.smudge(ctx, s, t) });
    list.push({ y: p.y, f: () => this.drawDuck(ctx, t) });
    list.sort((a, b) => a.y - b.y).forEach(d => d.f());
    // ink in flight
    for (const b of this.shots) Art3.shot(ctx, b, 1);
    for (const k of this.knives) Chars.drawKnife(ctx, k.x, k.y - 20, k.ang, 46, true);
    for (const q of this.parts) { ctx.fillStyle = q.team === 1 ? Art3.P.me : Art3.P.them; ctx.globalAlpha = Math.min(1, q.life * 3); ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
    // speech bubbles
    for (const b of this.barks) {
      if (b.who === 'tt') Art2.bark(ctx, A.screen.x + A.screen.w * 0.33, A.screen.y + A.screen.h + 54, b.text, b.life * 2, '#a995dc');
      else Art2.bark(ctx, p.x, p.y - 112, b.text, b.life * 2, '#16231e');
    }
    for (const f of this.floaters) { ctx.save(); ctx.globalAlpha = Math.min(1, f.life * 2); Chars.FX.text(ctx, f.text, f.x, f.y, 20, { fill: f.col || '#fbfffb' }); ctx.restore(); }
    ctx.restore();
    // screen space: minimap, reticle, banners, countdown
    Art3.minimap(ctx, { floor: this.floor, paint: this.paintC, W: AW, H: AH, obstacles: A.obstacles, smudges: this.smudges, px: p.x, py: p.y, cx: c.x, cy: c.y }, G.W - 212, G.H - 136, 192, 120);
    if (Input.mouse.inside !== false && this.state === 'play') Art3.reticle(ctx, Input.mouse.x, Input.mouse.y, t, p.special >= 1);
    for (const b of this.banners) Art3.banner(ctx, b.text, b.sub, b.life * 1.5, b.col);
    if (this.countT >= 0) {
      const n = Math.floor(this.countT / 0.7), k = (this.countT % 0.7) / 0.7;
      ctx.save(); ctx.globalAlpha = n >= 3 ? Math.max(0, 1 - k * 1.5) : 1;
      Chars.FX.text(ctx, n < 3 ? String(3 - n) : 'PAINT!', G.W / 2, G.H * 0.42, 110, { scale: 1.4 - Math.min(1, k * 3) * 0.4, fill: n >= 3 ? '#9df0c8' : '#fff4cc', shadow: '#f2897a' });
      ctx.restore();
    }
    if (this.paused) { ctx.fillStyle = 'rgba(10,16,14,.25)'; ctx.fillRect(0, 0, G.W, G.H); }
  };
  S.drawDuck = function (ctx, t) {
    const p = this.p;
    Art3.shadow(ctx, p.x, p.y + 2, 26);
    const after = Save.data.cosmetics.goggles && Save.data.cosmetics.gogglesOn !== false ? Chars.COSMETICS.goggles : null;
    const moving = Math.hypot(p.vx, p.vy) > 30;
    if (p.specialT >= 0) Chars.draw(ctx, 'duck', 'interact', Math.min(3.1, p.specialT * 2.6), p.x, p.y, DUCK_SCALE * 1.2, { face: p.face });
    else if (this.state === 'win') Chars.draw(ctx, 'duck', 'victory', this.t, p.x, p.y, DUCK_SCALE, { face: p.face, after });
    else if (p.stun > 0) Chars.draw(ctx, 'duck', 'hurt', 0.5 - Math.min(0.5, p.stun), p.x, p.y, DUCK_SCALE, { face: p.face, after });
    else Chars.draw(ctx, 'duck', moving ? 'walk' : 'idle', p.animT, p.x, p.y, DUCK_SCALE, { face: p.face, after });
    // ink tank on his back (small, readable)
    if (p.ink < 0.25 && this.state === 'play') Chars.FX.text(ctx, 'low ink', p.x, p.y - 128, 14, { fill: '#ffc0b4' });
  };

  S.debug = { CELL, GW, GH, AW, AH, GOAL, T, buildArena };
  Scenes.add('world3', S);
  G.World3 = S;
})(window.TT);
