/* =====================================================================
   world1.js — WORLD 1: THE SLIPPER HEIST (side-scrolling platformer)
   Collect five slippers, reach the shower door.
   Level layout is built in buildLevel() with tile coordinates
   (1 tile = 40 px). Edit positions there to tweak the level.
   ===================================================================== */
(function (G) {
  'use strict';
  const { U, UI, Save, Audio, Scenes, Input, Art, Content: C } = G;
  const TS = 40, COLS = 192, ROWS = 22, GR = 19;          // GR = ground row (top of floor)
  const FLOOR_Y = GR * TS, LEVEL_W = COLS * TS, LEVEL_H = ROWS * TS;
  const DUCK_SCALE = 136;                                   // on-screen size of Duckquackquack
  const PHYS = {
    accel: 2600, airAccel: 1800, friction: 2800, soapFriction: 650, airDrag: 900,
    walk: 300, sprint: 440, puddle: 0.55,
    gravity: 2350, jumpV: 940, cutGravity: 2.3, maxFall: 1150, spring: 1400,
    coyote: 0.11, buffer: 0.13, knifeCD: 0.32, knifeSpeed: 980, invuln: 1.4,
  };
  const MAX_HP = 3, NEED = 5;

  /* ------------------------------------------------------------------
     LEVEL
     ------------------------------------------------------------------ */
  function buildLevel() {
    const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(' '));
    const fill = (x0, x1, y0, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (grid[y] && x >= 0 && x < COLS) grid[y][x] = ch; };
    const O = { slippers: [], corn: [], bubbles: [], curtains: [], springs: [], dishes: [], checkpoints: [], notes: [], signs: [], puddles: [], quotes: [], decor: [] };
    let id = 0;
    const px = (t) => t * TS;
    const slipper = (tx, ty) => O.slippers.push({ id: 's' + O.slippers.length, x: px(tx) + 20, y: px(ty) + 20 });
    const corn = (tx, ty) => O.corn.push({ id: 'c' + O.corn.length, x: px(tx) + 20, y: px(ty) + 20 });
    const cornRow = (x0, x1, ty, step) => { for (let x = x0; x <= x1; x += (step || 1)) corn(x, ty); };
    const patrol = (x0, x1, ty) => O.bubbles.push({ id: 'b' + O.bubbles.length, kind: 'patrol', x0: px(x0), x1: px(x1), x: px(x0), y: px(ty) + 20, y0: px(ty) + 20, vx: 75, r: 22, seed: id++ });
    const bob = (tx, ty, amp) => O.bubbles.push({ id: 'b' + O.bubbles.length, kind: 'bob', x: px(tx) + 20, y0: px(ty) + 20, y: px(ty) + 20, amp: amp || 34, vx: -1, r: 22, seed: id++ });
    const curtain = (tx, ty, w, h, secret) => O.curtains.push({ id: 'k' + O.curtains.length, x: px(tx), y: px(ty), w: px(w), h: px(h), secret: !!secret });
    const spring = (tx, ty) => O.springs.push({ x: px(tx) - 10, y: px(ty), w: TS + 20, h: TS, squash: 0, ax: px(tx) });   // bounce zone a little wider than the bottle
    const dish = (x0, x1, ty, w) => O.dishes.push({ x0: px(x0), x1: px(x1), x: px(x0), y: px(ty), w: px(w), h: 18, dir: 1, speed: 90, dx: 0 });
    const checkpoint = (tx) => O.checkpoints.push({ id: 'cp' + O.checkpoints.length, x: px(tx), y: FLOOR_Y - 120, active: false });
    const note = (tx, ty) => O.notes.push({ idx: O.notes.length, x: px(tx), y: px(ty), read: false });
    const sign = (tx, ty, idx, post) => O.signs.push({ idx, x: px(tx), y: px(ty), post: post ? FLOOR_Y - px(ty) - 34 : 0 });
    const puddle = (x0, x1) => O.puddles.push({ x: px(x0), y: FLOOR_Y, w: px(x1 - x0 + 1) });

    // ---- base floor & outer walls
    fill(0, COLS - 1, GR, ROWS - 1, '#');
    fill(0, 1, 0, ROWS - 1, '#'); fill(COLS - 2, COLS - 1, 0, ROWS - 1, '#');
    O.start = { x: px(4), y: FLOOR_Y };

    // ---- A. learn to move, jump, throw (x 2–34)
    sign(2, 14, 0, true);
    sign(9, 12, 1, true);
    cornRow(6, 11, 17);
    fill(13, 15, 17, 18, '#');                // first step up
    corn(14, 15); corn(15, 15);
    note(24, 16);
    sign(18, 11, 2);
    fill(28, 29, 0, 12, '#'); curtain(28, 13, 2, 6);       // must knife this curtain
    sign(18, 13, 3);
    cornRow(30, 33, 17);
    patrol(31, 34, 17);                        // first bubble, after the knife lesson
    O.decor.push({ kind: 'cheer', x: px(5), y: px(9) });

    // ---- B. gaps, puddles, shelves (x 35–62)
    fill(35, 37, GR, ROWS - 1, ' ');           // pit
    sign(38, 14, 4, true);
    puddle(40, 43); patrol(39, 44, 17);
    sign(39, 9, 5);
    note(44, 12);
    fill(46, 49, GR, ROWS - 1, ' ');           // wider pit with a helper shelf
    fill(47, 48, 16, 16, '=');
    corn(47, 15); corn(48, 15);
    sign(51, 11, 8);
    patrol(51, 58, 17);
    fill(53, 56, 15, 15, '='); cornRow(53, 56, 14, 1);
    fill(57, 60, 12, 12, '=');
    slipper(58, 10);                           // SLIPPER 1
    corn(60, 11);
    checkpoint(63);
    sign(61, 9, 7);

    // ---- C. the bathtub: slippery soap & a bouncy bottle (x 64–91)
    note(65, 15);
    fill(66, 67, 18, 18, '#'); fill(68, 89, GR, ROWS - 1, 'w'); fill(90, 91, 18, 18, '#');
    fill(70, 72, 16, 16, 'o'); fill(75, 77, 15, 15, 'o'); fill(80, 82, 16, 16, 'o'); fill(85, 87, 15, 15, 'o');
    spring(77, 14);
    sign(69, 10, 6);
    fill(73, 80, 7, 7, '=');
    slipper(77, 5);                            // SLIPPER 2 (straight up from the bottle)
    corn(74, 6); corn(79, 6); corn(70, 15); corn(71, 15); corn(80, 15); corn(81, 15); corn(85, 14); corn(86, 14);
    bob(79, 12, 30); bob(84, 11, 34);

    // ---- D. soap-dish ferry + the secret cabinet (x 92–133)
    cornRow(93, 99, 17, 2);
    fill(102, 111, GR, ROWS - 1, 'w');
    dish(102, 108, 16, 4);
    bob(104, 10, 26);
    slipper(107, 12);                          // SLIPPER 3 (jump from the moving dish)
    // secret cabinet high on the wall: enter by cutting its curtain from the ledge
    fill(112, 127, 3, 3, '#'); fill(112, 112, 3, 9, '#'); fill(112, 127, 9, 9, '#'); fill(127, 127, 3, 5, '#');
    curtain(127, 6, 1, 3, true);
    fill(128, 132, 9, 9, '=');
    spring(130, GR - 1);
    O.poster = { x: px(114) + 10, y: px(4) + 6, w: 80, seen: false };
    O.quotes.push({ id: 'q1', x: px(122), y: px(7) });
    cornRow(117, 120, 8);
    patrol(116, 125, 17);

    // ---- E. checkpoint 2 + the tall climb (x 134–160)
    checkpoint(136);
    note(139, 15);
    fill(147, 149, 8, 18, '#');
    fill(141, 143, 16, 16, '='); fill(144, 146, 13, 13, '='); fill(141, 143, 10, 10, '='); fill(144, 146, 7, 7, '=');
    corn(142, 15); corn(145, 12); corn(142, 9);
    bob(143, 12, 22);
    slipper(148, 6);                           // SLIPPER 4 (top of the pillar)
    patrol(152, 160, 17);
    cornRow(152, 160, 15, 2);

    // ---- F. last curtain, last jumps, the shower door (x 161–189)
    fill(164, 165, 0, 12, '#'); curtain(164, 13, 2, 6);
    fill(169, 171, GR, ROWS - 1, ' '); fill(176, 178, GR, ROWS - 1, ' ');
    fill(173, 174, 16, 18, '#');
    slipper(173.5, 12);                        // SLIPPER 5
    bob(170, 14, 26); bob(177, 14, 26);
    corn(170, 12); corn(177, 12);
    note(181, 15);
    O.door = { x: px(184), y: px(16), w: px(3), h: px(3), openT: 0 };
    return { grid, O };
  }

  /* ------------------------------------------------------------------
     SCENE
     ------------------------------------------------------------------ */
  const S = {};
  S.enter = async function (data) {
    data = data || {};
    UI.closeAll();
    const lvl = buildLevel();
    this.grid = lvl.grid; this.O = lvl.O;
    this.water = findWater(this.grid);
    this.t = 0; this.paused = false; this.busy = false; this.ended = false;
    this.knives = []; this.parts = []; this.floaters = []; this.shake = 0;
    const w = Save.data.worlds.w1;
    if (data.fresh || !data.resume) {
      Object.assign(w, { slippers: [], corn: [], curtains: [], bubbles: [], notes: [], secret: false, poster: false, time: 0, damage: 0, cp: null, quote: false, popped: 0 });
      Save.data.progress.stage = Save.data.worlds.w1.done && data.fresh && Save.data.progress.stage !== 'world1' ? Save.data.progress.stage : 'world1';
      Save.data.progress.checkpoint = null;
      Save.write();
    }
    this.w = w;
    this.applySave();
    const cp = this.O.checkpoints.find(c => c.id === w.cp);
    const sp = cp ? { x: cp.x + 20, y: FLOOR_Y } : this.O.start;
    this.p = { x: sp.x - 19, y: sp.y - 96, w: 38, h: 96, vx: 0, vy: 0, face: 1, ground: null, coyote: 0, buffer: 0, hp: MAX_HP,
      inv: 0, knifeCD: 0, throwT: 0, hurtT: 0, animT: 0, stepT: 0, auto: null, state: 'play', faintT: 0 };
    this.lastSafe = { x: this.p.x, y: this.p.y };
    this.cam = { x: U.clamp(this.p.x - 400, 0, LEVEL_W - G.W), y: U.clamp(this.p.y - 400, 0, LEVEL_H - G.H) };
    this.time = w.time || 0;
    UI.hud.show({ maxHp: MAX_HP, number: C.W1.number, title: C.W1.title });
    this.syncHud(true);
    Audio.music('world1');
    G.canvas.classList.remove('aim');
    await UI.fade(false, 400);
    this.busy = true;
    await UI.card(C.W1.number, C.W1.title, C.W1.goal, 2400);
    if (Scenes.current !== S) return;
    if (cp) { UI.toast('Welcome back', 'Resumed from the last checkpoint.'); }
    else await UI.say(C.W1.intro);
    if (Scenes.current !== S) return;
    this.busy = false;
  };

  function findWater(grid) {
    const runs = [];
    for (let x = 0; x < COLS; x++) {
      if (grid[GR][x] === 'w' && (x === 0 || grid[GR][x - 1] !== 'w')) {
        let e = x; while (e + 1 < COLS && grid[GR][e + 1] === 'w') e++;
        runs.push({ x: x * TS, w: (e - x + 1) * TS });
      }
    }
    return runs;
  }

  S.applySave = function () {
    const w = this.w, O = this.O;
    O.slippers.forEach(s => s.got = w.slippers.includes(s.id));
    O.corn.forEach(c => c.got = w.corn.includes(c.id));
    O.curtains.forEach(c => { if (w.curtains.includes(c.id)) c.gone = true; });
    O.bubbles.forEach(b => { if (w.bubbles.includes(b.id)) b.gone = true; });
    O.notes.forEach(n => n.read = (w.notes || []).includes(n.idx));
    O.poster.seen = !!w.poster;
    O.quotes.forEach(q => q.got = !!Save.data.quotes[q.id] && w.quote);
    const cpIdx = O.checkpoints.findIndex(c => c.id === w.cp);
    O.checkpoints.forEach((c, i) => c.active = i <= cpIdx && cpIdx >= 0);
  };

  S.exit = function () { UI.hud.hide(); this.paused = false; };
  S.onBlur = function () { if (!this.paused && !this.ended && !UI.isOpen()) this.pause(); };

  /* ---------------- tile queries ---------------- */
  S.tile = function (tx, ty) { if (tx < 0 || tx >= COLS) return '#'; if (ty < 0) return ' '; if (ty >= ROWS) return ' '; return this.grid[ty][tx]; };
  S.solid = function (tx, ty) { const c = this.tile(tx, ty); return c === '#' || c === 'o'; };
  S.rects = function () {   // dynamic solids: uncut curtains and springs
    const r = [];
    for (const c of this.O.curtains) if (!c.gone && c.cutT == null) r.push(c);
    for (const s of this.O.springs) r.push(s);
    return r;
  };

  /* ---------------- update ---------------- */
  S.update = function (dt) {
    if (this.ended) { this.t += dt; this.p.animT += dt; this.updateFX(dt); return; }
    if (Input.hit('pause') && !this.busy && !UI.isOpen() && !UI.inDialogue()) { this.pause(); return; }
    if (this.paused || UI.isOpen()) return;
    if (UI.inDialogue()) return;
    this.t += dt;
    const p = this.p;
    this.updateWorld(dt);
    if (p.state === 'faint') { p.faintT += dt; if (p.faintT > 1.9) this.respawnCheckpoint(); this.updateFX(dt); this.updateCamera(dt); return; }
    if (!this.busy) this.time += dt;
    this.updatePlayer(dt);
    this.updateKnives(dt);
    this.checkPickups();
    this.updateFX(dt);
    this.updateCamera(dt);
    this.syncHud();
  };

  S.updateWorld = function (dt) {
    const O = this.O, t = this.t;
    for (const d of O.dishes) {
      const ox = d.x;
      d.x += d.dir * d.speed * dt;
      if (d.x > d.x1) { d.x = d.x1; d.dir = -1; } if (d.x < d.x0) { d.x = d.x0; d.dir = 1; }
      d.dx = d.x - ox;
    }
    for (const b of O.bubbles) {
      if (b.gone) continue;
      if (b.popT != null) { b.popT += dt; if (b.popT > 0.3) b.gone = true; continue; }
      if (b.kind === 'patrol') {
        b.x += b.vx * dt; if (b.x > b.x1) { b.x = b.x1; b.vx = -Math.abs(b.vx); } if (b.x < b.x0) { b.x = b.x0; b.vx = Math.abs(b.vx); }
        b.y = b.y0 + Math.sin(t * 3 + b.seed) * 8;
      } else { b.y = b.y0 + Math.sin(t * 2.2 + b.seed) * b.amp; b.x += Math.sin(t * 1.3 + b.seed) * 0.3; }
    }
    for (const c of O.curtains) if (c.cutT != null && !c.gone) { c.cutT += dt; if (c.cutT > 0.7) c.gone = true; }
    for (const s of O.springs) s.squash = Math.max(0, s.squash - dt * 4);
    if (O.door.opening) O.door.openT = Math.min(1, O.door.openT + dt * 0.8);
  };

  S.updatePlayer = function (dt) {
    const p = this.p;
    p.inv = Math.max(0, p.inv - dt); p.knifeCD = Math.max(0, p.knifeCD - dt);
    p.throwT = Math.max(0, p.throwT - dt); p.hurtT = Math.max(0, p.hurtT - dt);
    const ctl = !this.busy && p.state === 'play';
    let move = 0;
    if (p.auto != null) { move = Math.sign(p.auto - (p.x + p.w / 2)); if (Math.abs(p.auto - (p.x + p.w / 2)) < 6) { move = 0; p.vx = 0; const r = this.onArrive; this.onArrive = null; p.auto = null; r && r(); } }
    else if (ctl && p.hurtT < 0.25) move = (Input.isDown('right') ? 1 : 0) - (Input.isDown('left') ? 1 : 0);
    const sprint = ctl && Input.isDown('sprint');
    const inPuddle = this.O.puddles.some(q => p.x + p.w > q.x && p.x < q.x + q.w && p.ground && Math.abs(p.y + p.h - q.y) < 4);
    let max = (sprint ? PHYS.sprint : PHYS.walk) * (inPuddle ? PHYS.puddle : 1);
    if (p.auto != null) max = 200;
    const onSoap = p.ground === 'soap';
    if (move !== 0) {
      p.face = move;
      const a = p.ground ? (onSoap ? PHYS.accel * 0.5 : PHYS.accel) : PHYS.airAccel;
      if (Math.sign(p.vx) !== move && p.ground && !onSoap) p.vx = U.approach(p.vx, 0, PHYS.friction * dt);
      p.vx = U.approach(p.vx, move * max, a * dt);
      if (Math.abs(p.vx) > max) p.vx = U.approach(p.vx, move * max, PHYS.friction * dt);
    } else {
      const f = p.ground ? (onSoap ? PHYS.soapFriction : PHYS.friction) : PHYS.airDrag;
      p.vx = U.approach(p.vx, 0, f * dt);
    }
    // jump (buffered + coyote time)
    if (ctl && Input.hit('jump')) p.buffer = PHYS.buffer; else p.buffer = Math.max(0, p.buffer - dt);
    p.coyote = p.ground ? PHYS.coyote : Math.max(0, p.coyote - dt);
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -PHYS.jumpV; p.buffer = 0; p.coyote = 0; p.ground = null; p.groundRef = null;
      Audio.sfx('jump'); this.puff(p.x + p.w / 2, p.y + p.h, 3);
    }
    const holding = ctl && Input.isDown('jump');
    if (p.vy >= 0) p.springy = false;
    const g = PHYS.gravity * (p.vy < 0 && !holding && !p.springy ? PHYS.cutGravity : 1);
    p.vy = Math.min(PHYS.maxFall, p.vy + g * dt);
    // throw a knife
    if (ctl && Input.hit('attack') && p.knifeCD <= 0) this.throwKnife();

    // ride the soap dish
    if (p.groundRef && p.groundRef.dx) p.x += p.groundRef.dx;
    // move & collide
    const wasGround = !!p.ground;
    const prevBottom = p.y + p.h;
    p.x += p.vx * dt; this.collideX(p);
    p.y += p.vy * dt; this.collideY(p, prevBottom);
    p.x = U.clamp(p.x, TS * 2, LEVEL_W - TS * 2 - p.w);
    if (!wasGround && p.ground && p.landVy > 500) { Audio.sfx('land'); this.puff(p.x + p.w / 2, p.y + p.h, 4); }

    // footsteps
    if (p.ground && Math.abs(p.vx) > 80) { p.stepT -= dt * Math.abs(p.vx) / 300; if (p.stepT <= 0) { p.stepT = 0.3; Audio.sfx('step'); } }
    p.animT += dt * (p.ground && Math.abs(p.vx) > 20 ? Math.max(0.6, Math.abs(p.vx) / PHYS.walk) : 1);
    p.anim = p.state === 'win' ? 'victory' : p.hurtT > 0 ? 'hurt' : !p.ground ? 'air' : p.throwT > 0 ? 'throw' :
      Math.abs(p.vx) < 18 ? 'idle' : (Math.abs(p.vx) > PHYS.walk + 30 ? 'run' : 'walk');

    // safe spot for respawns after falls (only on solid, non-moving ground with floor under both feet)
    if (p.ground && p.ground !== 'dish' && p.ground !== 'spring') {
      const by = Math.floor((p.y + p.h + 2) / TS);
      if (this.solid(Math.floor((p.x - 4) / TS), by) && this.solid(Math.floor((p.x + p.w + 4) / TS), by)) this.lastSafe = { x: p.x, y: p.y };
    }
    // hazards: water and pits
    if (p.y > LEVEL_H + 40) this.hazard('fall');
    else if (this.inWater(p)) this.hazard('water');
    // bubbles
    for (const b of this.O.bubbles) {
      if (b.gone || b.popT != null) continue;
      const cx = U.clamp(b.x, p.x, p.x + p.w), cy = U.clamp(b.y, p.y, p.y + p.h);
      if ((cx - b.x) ** 2 + (cy - b.y) ** 2 < (b.r - 4) ** 2) {
        if (p.inv <= 0) { this.popBubble(b, false); this.hurt(Math.sign(p.x + p.w / 2 - b.x) || -p.face); }
      }
    }
  };

  S.collideX = function (p) {
    const ty0 = Math.floor((p.y + 2) / TS), ty1 = Math.floor((p.y + p.h - 2) / TS);
    if (p.vx > 0) {
      const tx = Math.floor((p.x + p.w) / TS);
      for (let ty = ty0; ty <= ty1; ty++) if (this.solid(tx, ty)) { p.x = tx * TS - p.w; p.vx = 0; break; }
    } else if (p.vx < 0) {
      const tx = Math.floor(p.x / TS);
      for (let ty = ty0; ty <= ty1; ty++) if (this.solid(tx, ty)) { p.x = (tx + 1) * TS; p.vx = 0; break; }
    }
    for (const r of this.rects()) {
      if (p.x < r.x + r.w && p.x + p.w > r.x && p.y + 2 < r.y + r.h && p.y + p.h - 2 > r.y) {
        if (r.squash != null && p.y + p.h <= r.y + 8) continue;     // standing on a spring
        if (p.x + p.w / 2 < r.x + r.w / 2) p.x = r.x - p.w; else p.x = r.x + r.w;
        p.vx = 0;
      }
    }
  };
  S.collideY = function (p, prevBottom) {
    p.ground = null; p.groundRef = null;
    const tx0 = Math.floor((p.x + 3) / TS), tx1 = Math.floor((p.x + p.w - 3) / TS);
    if (p.vy >= 0) {
      const ty = Math.floor((p.y + p.h) / TS);
      for (let tx = tx0; tx <= tx1; tx++) {
        const c = this.tile(tx, ty);
        if (c === '#' || c === 'o' || (c === '=' && prevBottom <= ty * TS + 1)) {
          p.landVy = p.vy; p.y = ty * TS - p.h; p.vy = 0; p.ground = c === 'o' ? 'soap' : 'tile'; break;
        }
      }
      // moving soap dishes (one-way)
      for (const d of this.O.dishes) {
        if (p.x + p.w > d.x + 2 && p.x < d.x + d.w - 2 && prevBottom <= d.y + 2 && p.y + p.h >= d.y) {
          p.landVy = p.vy; p.y = d.y - p.h; p.vy = 0; p.ground = 'dish'; p.groundRef = d;
        }
      }
    } else {
      const ty = Math.floor(p.y / TS);
      for (let tx = tx0; tx <= tx1; tx++) if (this.solid(tx, ty)) { p.y = (ty + 1) * TS; p.vy = 0; break; }
    }
    for (const r of this.rects()) {
      if (p.x + 3 < r.x + r.w && p.x + p.w - 3 > r.x && p.y < r.y + r.h && p.y + p.h > r.y) {
        if (p.vy >= 0 && prevBottom <= r.y + 6) {
          p.y = r.y - p.h;
          if (r.squash != null) {   // shampoo bottle spring
            p.vy = -PHYS.spring; p.springy = true; r.squash = 1; p.ground = null; Audio.sfx('spring'); this.puff(r.x + 20, r.y, 5);
          } else { p.vy = 0; p.ground = 'tile'; }
        } else if (p.vy < 0 && p.y > r.y + r.h - 20) { p.y = r.y + r.h; p.vy = 0; }
      }
    }
  };
  S.inWater = function (p) {
    const ty = Math.floor((p.y + p.h - 6) / TS);
    const tx0 = Math.floor((p.x + 6) / TS), tx1 = Math.floor((p.x + p.w - 6) / TS);
    for (let tx = tx0; tx <= tx1; tx++) if (this.tile(tx, ty) === 'w' && p.y + p.h > FLOOR_Y + 8) return true;
    return false;
  };

  /* ---------------- damage, respawn ---------------- */
  S.hurt = function (dir) {
    const p = this.p;
    if (p.inv > 0 || p.state !== 'play') return;
    p.hp -= 1; this.w.damage = (this.w.damage || 0) + 1;
    p.inv = PHYS.invuln; p.hurtT = 0.45;
    p.vx = dir * 330; p.vy = -520; p.ground = null;
    this.shake = 0.3;
    Audio.sfx('hurt'); UI.hud.flash('hp');
    if (p.hp <= 0) this.faint();
  };
  S.hazard = function (kind) {
    const p = this.p;
    if (kind === 'water') { Audio.sfx('splash'); for (let i = 0; i < 12; i++) this.parts.push({ x: p.x + p.w / 2, y: FLOOR_Y + 4, vx: U.rnd(-200, 200), vy: U.rnd(-500, -200), life: 0.8, kind: 'drop' }); }
    if (p.inv <= 0) { p.hp -= 1; this.w.damage = (this.w.damage || 0) + 1; Audio.sfx('hurt'); UI.hud.flash('hp'); }
    if (p.hp <= 0) { this.faint(); return; }
    p.x = this.lastSafe.x; p.y = this.lastSafe.y; p.vx = 0; p.vy = 0; p.inv = PHYS.invuln;
    this.floaters.push({ x: p.x + p.w / 2, y: p.y - 30, text: kind === 'water' ? 'SPLOOSH' : 'WHOOPS', life: 1 });
  };
  S.faint = function () {
    const p = this.p; p.state = 'faint'; p.faintT = 0; p.vx = 0;
    if (p.y > LEVEL_H || this.inWater(p)) { p.x = this.lastSafe.x; p.y = this.lastSafe.y; }
    Save.data.stats.deaths++; Audio.sfx('faint');
    this.floaters.push({ x: p.x + p.w / 2, y: p.y - 40, text: 'fainted dramatically', life: 1.8 });
  };
  S.respawnCheckpoint = function () {
    const p = this.p, cp = this.O.checkpoints.find(c => c.id === this.w.cp);
    const sp = cp ? { x: cp.x + 20, y: FLOOR_Y } : this.O.start;
    Object.assign(p, { x: sp.x - 19, y: sp.y - p.h, vx: 0, vy: 0, hp: MAX_HP, inv: PHYS.invuln, state: 'play', faintT: 0, hurtT: 0 });
    this.lastSafe = { x: p.x, y: p.y };
    UI.toast('Back on your feet', cp ? 'Returned to the last checkpoint with full HP.' : 'Back to the start with full HP. Collected items are kept.');
  };

  /* ---------------- knives ---------------- */
  S.throwKnife = function () {
    const p = this.p;
    p.knifeCD = PHYS.knifeCD; p.throwT = Chars.ANIM_DUR.duck.throw;
    const k = { x: p.x + p.w / 2 + p.face * 26, y: p.y + 34, vx: p.face * PHYS.knifeSpeed + p.vx * 0.3, ang: 0, life: 0.6, stuck: false, dir: p.face };
    this.knives.push(k);
    Audio.sfx('knife');
    Save.data.stats.knives = (Save.data.stats.knives || 0) + 1;
    if (Save.data.stats.knives >= 50) Save.unlock('knives');
  };
  S.updateKnives = function (dt) {
    for (const k of this.knives) {
      if (k.stuck) { k.life -= dt; continue; }
      k.x += k.vx * dt; k.ang += k.dir * 22 * dt; k.life -= dt;
      const tx = Math.floor((k.x + k.dir * 16) / TS), ty = Math.floor(k.y / TS);
      if (this.solid(tx, ty)) { k.stuck = true; k.life = 0.7; k.ang = k.dir > 0 ? 0 : Math.PI; k.x = (k.dir > 0 ? tx * TS : (tx + 1) * TS) - k.dir * 18; Audio.sfx('thunk'); continue; }
      for (const c of this.O.curtains) {
        if (c.gone || c.cutT != null) continue;
        if (k.x > c.x - 10 && k.x < c.x + c.w + 10 && k.y > c.y - 10 && k.y < c.y + c.h + 10) { this.cutCurtain(c); k.life = 0; break; }
      }
      for (const b of this.O.bubbles) {
        if (b.gone || b.popT != null) continue;
        if ((k.x - b.x) ** 2 + (k.y - b.y) ** 2 < (b.r + 14) ** 2) { this.popBubble(b, true); k.life = 0; break; }
      }
      // spring bottles block knives
      for (const s of this.O.springs) if (k.x > s.x && k.x < s.x + s.w && k.y > s.y && k.y < s.y + s.h) { k.life = 0; Audio.sfx('thunk'); }
    }
    this.knives = this.knives.filter(k => k.life > 0 && k.x > -50 && k.x < LEVEL_W + 50);
  };
  S.cutCurtain = function (c) {
    c.cutT = 0; Audio.sfx('rip'); this.shake = 0.12;
    this.w.curtains.push(c.id); Save.write();
    for (let i = 0; i < 10; i++) this.parts.push({ x: c.x + c.w / 2, y: c.y + U.rnd(0, c.h), vx: U.rnd(-180, 180), vy: U.rnd(-260, 40), life: 0.7, kind: 'scrap' });
    if (!this.saidCurtain && !c.secret) { this.saidCurtain = true; this.talk(C.W1.curtainFirst); }
    if (c.secret) { this.floaters.push({ x: c.x, y: c.y - 20, text: 'a secret!', life: 1.6 }); Audio.sfx('sparkle'); }
  };
  S.popBubble = function (b, byKnife) {
    b.popT = 0; Audio.sfx('pop');
    this.w.bubbles.push(b.id);
    if (byKnife) { this.w.popped = (this.w.popped || 0) + 1; Save.data.stats.bubbles++; if (this.w.popped >= 10) Save.unlock('w1_pop'); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; this.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, life: 0.4, kind: 'bub' }); }
    Save.write();
  };

  /* ---------------- pickups & triggers ---------------- */
  S.checkPickups = function () {
    const p = this.p, O = this.O, w = this.w;
    const pr = { x: p.x - 6, y: p.y - 6, w: p.w + 12, h: p.h + 12 };
    for (const s of O.slippers) {
      if (s.got) continue;
      if (U.overlap(pr, { x: s.x - 22, y: s.y - 18, w: 44, h: 36 })) {
        s.got = true; w.slippers.push(s.id); Save.write();
        Audio.sfx('slipper'); UI.hud.flash('item');
        const n = w.slippers.length;
        this.floaters.push({ x: s.x, y: s.y - 30, text: C.W1.slipperLines[n - 1] || 'SLIPPER!', life: 2.2, big: true });
        for (let i = 0; i < 10; i++) this.parts.push({ x: s.x, y: s.y, vx: U.rnd(-220, 220), vy: U.rnd(-320, -60), life: 0.8, kind: 'star' });
        if (n === NEED) UI.toast('All five slippers!', 'The shower door is waiting at the far end.');
      }
    }
    for (const c of O.corn) {
      if (c.got) continue;
      if (U.overlap(pr, { x: c.x - 12, y: c.y - 12, w: 24, h: 24 })) { c.got = true; w.corn.push(c.id); Audio.sfx('corn'); this.cornDirty = true; }
    }
    if (this.cornDirty && this.t - (this.lastCornSave || 0) > 1) { Save.write(); this.lastCornSave = this.t; this.cornDirty = false; }
    for (const cp of O.checkpoints) {
      if (cp.active) continue;
      if (p.x + p.w > cp.x - 20 && p.x < cp.x + 60) this.activateCheckpoint(cp);
    }
    if (this.busy) return;
    for (const n of O.notes) {
      if (n.read) continue;
      if (p.x + p.w > n.x - 10 && p.x < n.x + 50 && p.y < n.y + 200) {
        n.read = true; (w.notes = w.notes || []).push(n.idx); Save.write();
        this.talk(C.W1.notes[n.idx]); return;
      }
    }
    const po = O.poster;
    if (!po.seen && p.x + p.w > po.x && p.x < po.x + po.w + 30 && p.y < po.y + 220) {
      po.seen = true; w.poster = true; Save.write(); this.talk(C.W1.poster).then(() => Save.unlock('w1_cult')); return;
    }
    for (const q of O.quotes) {
      if (q.got) continue;
      if (U.overlap(pr, { x: q.x, y: q.y - 10, w: 40, h: 60 })) { q.got = true; w.quote = true; this.foundQuote(q.id); return; }
    }
    const d = O.door;
    if (!d.opening && p.x + p.w > d.x - 10 && p.ground) {
      if (w.slippers.length >= NEED) this.finale();
      else if (!this.doorNagT || this.t - this.doorNagT > 3) {
        this.doorNagT = this.t; Audio.sfx('locked');
        p.vx = -200; p.x = d.x - 12 - p.w;
        if (!this.saidDoor) { this.saidDoor = true; this.talk(C.W1.lockedDoor.concat([{ who: 'duck', mood: 'talk', text: (NEED - w.slippers.length) + ' to go. Where did I PUT them?' }])); }
        else this.floaters.push({ x: d.x, y: d.y - 90, text: (NEED - w.slippers.length) + ' more slippers', life: 1.5 });
      } else { p.x = Math.min(p.x, d.x - 12 - p.w); }
    }
  };
  S.activateCheckpoint = function (cp) {
    cp.active = true;
    this.O.checkpoints.forEach(c => { if (c.x <= cp.x) c.active = true; });
    this.w.cp = cp.id; this.w.time = this.time;
    Save.data.progress.stage = 'world1'; Save.data.progress.checkpoint = { world: 'w1', id: cp.id };
    Save.write();
    this.p.hp = MAX_HP;
    Audio.sfx('checkpoint');
    UI.toast('Checkpoint', 'Progress saved. HP restored.');
    if (!this.saidCP) { this.saidCP = true; this.talk(C.W1.checkpointFirst); }
  };
  S.talk = async function (lines) {
    this.busy = true; this.p.vx *= 0.3;
    await UI.say(lines);
    if (Scenes.current === S && !this.ended) this.busy = false;
  };
  S.foundQuote = async function (id) {
    this.busy = true;
    const q = C.QUOTES.find(x => x.id === id);
    Save.data.quotes[id] = true; Save.write();
    Audio.sfx('quote');
    const total = Object.keys(Save.data.quotes).length;
    await new Promise((res) => {
      const p = UI.el('div', 'panel');
      p.innerHTML = '<small style="font:800 14px var(--f-mono);letter-spacing:.3em;color:var(--mint)">HIDDEN QUOTE ' + total + ' OF 4</small><div class="quote-card"></div><p class="panel-sub">Saved to the archive.</p>';
      p.querySelector('.quote-card').textContent = q.text;   // exact wording, as text
      const b = UI.el('button', 'btn primary', 'Continue'); p.appendChild(b);
      let e; UI.wire(b, () => { e.close(); res(); });
      e = UI.open(p, { onBack: () => { e.close(); res(); } });
    });
    Save.unlock('quote1');
    if (Scenes.current === S) this.busy = false;
  };

  /* ---------------- the shower door finale ---------------- */
  S.finale = async function () {
    if (this.ended || this.inFinale) return;
    this.inFinale = true; this.busy = true;
    const p = this.p, d = this.O.door;
    p.vx = 0;
    await new Promise((res) => { this.onArrive = res; p.auto = d.x - 70; });
    p.face = 1;
    await UI.say(C.W1.door); if (Scenes.current !== S) return;
    d.opening = true; Audio.sfx('door'); this.shake = 0.2;
    await U.wait(1300); if (Scenes.current !== S) return;
    await UI.say(C.W1.doorOpen); if (Scenes.current !== S) return;
    // victory!
    p.state = 'win'; p.animT = 0; Audio.stop(0.3); Audio.sfx('win');
    this.ended = true;
    await U.wait(2200); if (Scenes.current !== S) return;
    await this.results(); if (Scenes.current !== S) return;
    await UI.say(C.W1.toWorld2); if (Scenes.current !== S) return;
    await UI.fade(true, 600);
    Scenes.go('milestone');
    UI.fade(false, 600);
  };
  S.results = function () {
    const w = this.w, O = this.O, secs = this.time;
    const corn = w.corn.length, cornN = O.corn.length;
    const nodmg = (w.damage || 0) === 0;
    const score = w.slippers.length * 100 + corn * 10 + (w.popped || 0) * 25 + (w.poster ? 100 : 0) + (w.quote ? 200 : 0) + Math.max(0, Math.round((300 - secs) * 2)) + (nodmg ? 500 : 0);
    const best = w.best || {};
    const newBest = !best.score || score > best.score;
    w.done = true; w.best = { score: Math.max(score, best.score || 0), time: best.time ? Math.min(best.time, secs) : secs };
    Save.data.progress.stage = 'world2'; Save.data.progress.checkpoint = null; w.cp = null;
    Save.write();
    Save.unlock('w1_clear');
    if (nodmg) Save.unlock('w1_nodmg');
    if (corn >= cornN) Save.unlock('w1_corn');
    if (secs < 210) Save.unlock('w1_fast');
    Audio.music('results');
    return new Promise((res) => {
      const pnl = UI.el('div', 'panel results');
      const row = (a, b, cls) => '<span class="' + (cls || '') + '">' + a + '</span><span class="' + (cls || '') + '">' + b + '</span>';
      pnl.innerHTML = '<h2 class="panel-title">World 1 complete!</h2><div class="stats">' +
        row('Time', U.fmtTime(secs)) + row('Slippers', w.slippers.length + ' / ' + NEED) + row('Corn', corn + ' / ' + cornN) +
        row('Bubbles popped', w.popped || 0) + row('Secrets', (w.poster ? 1 : 0) + (w.quote ? 1 : 0) + ' / 2') +
        row('Damage taken', w.damage || 0) + row('Score' + (newBest ? ' (new best!)' : ''), score, 'total') + '</div>';
      const got = C.ACHIEVEMENTS.filter(a => Save.data.achievements[a.id] && a.id.startsWith('w1'));
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
    UI.menu({
      title: 'Paused', sub: C.W1.number + ' · ' + C.W1.title + ' — ' + this.w.slippers.length + ' / ' + NEED + ' slippers',
      items: [
        { label: 'Resume', primary: true, action: resume },
        { label: 'Restart from checkpoint', action: (m) => { m.close(); this.paused = false; this.respawnCheckpoint(); } },
        { label: 'Restart World 1', action: async (m) => {
          if (await UI.confirm('Restart World 1?', 'Collected slippers, corn and checkpoints in this world reset.', 'Restart', 'Cancel')) { m.close(); Scenes.go('world1', { fresh: true }); }
        } },
        { label: 'How to play', action: () => UI.howto() },
        { label: 'Settings', action: () => UI.settings() },
        { label: 'Quit to title', action: (m) => { m.close(); this.w.time = this.time; Save.write(); Scenes.go('title'); } },
      ],
      onBack: () => resume(UI.stack[UI.stack.length - 1]),
    });
  };

  /* ---------------- FX & camera ---------------- */
  S.puff = function (x, y, n) { for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: U.rnd(-90, 90), vy: U.rnd(-90, -20), life: 0.45, kind: 'puff', r: U.rnd(5, 10) }); };
  S.updateFX = function (dt) {
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; if (q.kind !== 'puff' && q.kind !== 'bub') q.vy += 900 * dt; q.life -= dt; }
    this.parts = this.parts.filter(q => q.life > 0);
    for (const f of this.floaters) { f.y -= 30 * dt; f.life -= dt; }
    this.floaters = this.floaters.filter(f => f.life > 0);
    this.shake = Math.max(0, this.shake - dt);
  };
  S.updateCamera = function (dt) {
    const p = this.p, c = this.cam;
    const tx = U.clamp(p.x + p.w / 2 - G.W / 2 + p.face * 140, 0, LEVEL_W - G.W);
    const ty = U.clamp(p.y + p.h / 2 - G.H * 0.55, 0, LEVEL_H - G.H);
    c.x += (tx - c.x) * Math.min(1, dt * 5); c.y += (ty - c.y) * Math.min(1, dt * 4);
  };

  /* ---------------- HUD ---------------- */
  S.syncHud = function (force) {
    const h = UI.hud, w = this.w;
    h.set('hp', this.p.hp);
    const n = w.slippers.length;
    let s = ''; for (let i = 0; i < NEED; i++) s += Art.slipperIconSVG(i < n);
    h.set('item', s + '<span>' + n + '/' + NEED + '</span>');
    h.set('corn', '<svg viewBox="0 0 20 22"><path d="M10 2 Q18 5 16 13 Q10 21 4 13 Q2 5 10 2Z" fill="#ffe07a" stroke="#fbfffb" stroke-width="2"/></svg><span>' + w.corn.length + '/' + this.O.corn.length + '</span>');
    h.set('time', U.fmtTime(this.time));
    h.set('knife', (1 - this.p.knifeCD / PHYS.knifeCD).toFixed(2));
  };

  /* ---------------- draw ---------------- */
  S.draw = function (ctx) {
    const t = this.t, c = this.cam, O = this.O;
    let sx = 0, sy = 0;
    if (this.shake > 0) { sx = (Math.random() - 0.5) * 10 * this.shake / 0.3; sy = (Math.random() - 0.5) * 10 * this.shake / 0.3; }
    const cx = Math.round(c.x + sx), cy = Math.round(c.y + sy);
    Art.background(ctx, cx, cy, t, LEVEL_W);
    ctx.save(); ctx.translate(-cx, -cy);
    const x0 = Math.max(0, Math.floor(cx / TS) - 1), x1 = Math.min(COLS - 1, Math.ceil((cx + G.W) / TS) + 1);
    const vis = (x, w) => x + (w || 0) > cx - 200 && x < cx + G.W + 200;
    // wall decor
    for (const d of O.decor) if (d.kind === 'cheer' && vis(d.x, 200)) Art.cheerDuck(ctx, d.x, d.y, 150, t);
    // the secret cabinet's back wall, then the poster on it
    ctx.fillStyle = '#e9d9b8'; ctx.fillRect(113 * TS, 4 * TS, 14 * TS, 5 * TS);
    ctx.fillStyle = '#dcc9a3'; for (let x = 113 * TS; x < 127 * TS; x += 40) ctx.fillRect(x, 4 * TS, 3, 5 * TS);
    if (vis(O.poster.x, 120)) Art.poster(ctx, O.poster.x, O.poster.y, O.poster.w);
    for (const s of O.signs) if (vis(s.x, 400)) Art.sign(ctx, s.x, s.y, C.W1.signs[s.idx], s.post);
    for (const n of O.notes) if (vis(n.x, 60)) Art.note(ctx, n, t);
    for (const k of O.checkpoints) if (vis(k.x, 100)) Art.towelRack(ctx, k, t);
    // door (behind tiles so the frame sits on the floor)
    if (vis(O.door.x, 200)) Art.door(ctx, O.door, t, this.w.slippers.length, NEED);
    // water
    for (const r of this.water) if (vis(r.x, r.w)) Art.water(ctx, r.x, FLOOR_Y - 6, r.w, LEVEL_H - FLOOR_Y + 6, t);
    // tiles
    const y0 = Math.max(0, Math.floor(cy / TS)), y1 = Math.min(ROWS - 1, Math.ceil((cy + G.H) / TS));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const ch = this.grid[y][x];
      if (ch === '#') ctx.drawImage(this.solid(x, y - 1) ? Art.TILES.inner : Art.TILES.top, x * TS, y * TS);
      else if (ch === 'o') ctx.drawImage(Art.TILES.soap, x * TS, y * TS);
      else if (ch === '=' && this.grid[y][x - 1] !== '=') { let e = x; while (this.grid[y][e + 1] === '=') e++; Art.shelf(ctx, x * TS, y * TS, (e - x + 1) * TS); }
    }
    for (const q of O.puddles) if (vis(q.x, q.w)) Art.puddle(ctx, q, t);
    for (const s of O.springs) if (vis(s.x, 40)) Art.bottle(ctx, s, t);
    for (const d of O.dishes) if (vis(d.x, d.w)) Art.dish(ctx, d, t);
    for (const k of O.curtains) if (!k.gone && vis(k.x, k.w)) Art.curtain(ctx, k, t);
    // collectibles
    O.corn.forEach((k, i) => { if (!k.got && vis(k.x, 20)) Art.corn(ctx, k.x, k.y, t, i); });
    for (const s of O.slippers) if (!s.got && vis(s.x, 40)) Art.slipper(ctx, s.x, s.y, t);
    for (const q of O.quotes) if (!q.got && vis(q.x, 40)) Art.quoteCard(ctx, q, t);
    for (const b of O.bubbles) if (!b.gone && vis(b.x - 30, 60)) Art.bubble(ctx, b, t);
    // Duckquackquack
    const p = this.p;
    if (!(p.inv > 0 && p.state === 'play' && Math.floor(t * 14) % 2 === 0)) {
      const anim = p.state === 'faint' ? 'damage' : p.anim || 'idle';
      const at = p.state === 'faint' ? p.faintT : (anim === 'hurt' ? 0.45 - p.hurtT : anim === 'throw' ? Chars.ANIM_DUR.duck.throw - p.throwT : p.animT);
      Chars.draw(ctx, 'duck', anim, at, p.x + p.w / 2, p.y + p.h + 2, DUCK_SCALE, { face: p.face, vy: p.vy });
    }
    // knives in flight
    for (const k of this.knives) Chars.drawKnife(ctx, k.x, k.y, k.ang, 44, true, k.stuck ? Math.min(1, k.life * 2) : 1);
    // particles
    for (const q of this.parts) {
      const a = Math.max(0, Math.min(1, q.life * 2));
      if (q.kind === 'puff') Chars.FX.puff(ctx, q.x, q.y, q.r * (1.4 - q.life), a);
      else if (q.kind === 'bub') Chars.FX.bubble(ctx, q.x, q.y, 4, a);
      else if (q.kind === 'star') Chars.FX.star(ctx, q.x, q.y, 7 * a, q.life * 6, '#fff4cc');
      else if (q.kind === 'drop') { ctx.fillStyle = 'rgba(169,216,245,' + a + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, 6.3); ctx.fill(); }
      else if (q.kind === 'scrap') { ctx.fillStyle = 'rgba(201,184,240,' + a + ')'; ctx.fillRect(q.x, q.y, 8, 14); }
    }
    for (const f of this.floaters) {
      ctx.save(); ctx.globalAlpha = Math.min(1, f.life * 2);
      Chars.FX.text(ctx, f.text, f.x, f.y, f.big ? 26 : 20, { fill: f.big ? '#fff4cc' : '#fbfffb' }); ctx.restore();
    }
    ctx.restore();
    if (this.paused) { ctx.fillStyle = 'rgba(10,16,14,.25)'; ctx.fillRect(0, 0, G.W, G.H); }
  };

  /* debug/test hook: lets the automated test jump around the level */
  S.debug = { TS, COLS, ROWS, GR, buildLevel, PHYS };
  Scenes.add('world1', S);
  G.World1 = S;
})(window.TT);
