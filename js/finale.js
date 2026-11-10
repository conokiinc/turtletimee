/* =====================================================================
   finale.js — the end of the adventure
     'final'    THE FINAL ENCOUNTER: Turtletimee's front door
     'birthday' the surprise party, the slideshow, the level-up, the
                credits ... and the plot twist: Ada's letter
     'letter'   re-read the letter (from the archive)
     'archive'  CHARACTER ARCHIVE: profiles, memories, quotes, achievements
   All the words are in content.js (C.FINAL, C.BDAY, C.BIRTHDAY_MESSAGE,
   C.MEMORIES, C.ARCHIVE). All the art here is drawn in code or uses
   Ada's original drawings.
   ===================================================================== */
(function (G) {
  'use strict';
  const { UI, Save, Audio, Scenes, Input, U, Content: C } = G;
  const W = G.W, H = G.H;
  const GROUND = 612, SIZE = 204;                      // shared character scale for this chapter

  /* ---------- small helpers ---------- */
  const IMG = {};
  function img(name, src) { const i = new Image(); i.onload = () => { IMG[name] = i; }; i.src = src; }
  img('labDuck', 'assets/ui/label_duck_card.png'); img('labTT', 'assets/ui/label_tt_card.png');
  img('aliasDuck', 'assets/ui/label_duck_alias.png'); img('aliasTT', 'assets/ui/label_tt_alias.png');

  const PAL = { mint: '#9fe3c3', green: '#5fb38d', cream: '#fff4cc', coral: '#f39b8a', lav: '#c9b8f0', lavLo: '#a995dc', sky: '#a9d8f5', line: '#fbfffb', ink: '#16231e' };
  const outline = (ctx, fn, w) => G.Art.outline(ctx, fn, w);
  const rr = (ctx, x, y, w, h, r) => U.roundRect(ctx, x, y, w, h, r);
  const ease = (k) => k < 0 ? 0 : k > 1 ? 1 : 1 - Math.pow(1 - k, 3);

  /* scene-time timers: they stop while the game is paused */
  function timers(sc) {
    sc._timers = [];
    sc.wait = (ms) => new Promise((res) => sc._timers.push({ left: ms / 1000, res }));
    sc.tickTimers = (dt) => { for (const tm of sc._timers) { tm.left -= dt; if (tm.left <= 0) { tm.done = true; tm.res(); } } sc._timers = sc._timers.filter(tm => !tm.done); };
  }
  /* wait for a deliberate press (Enter / Space / E / click), never a held key */
  function pressOnce(sc, minMs, test) {
    return new Promise((res) => {
      const t0 = performance.now();
      const ok = () => !sc.aborted && !sc.paused && !UI.isOpen() && !UI.inDialogue() && performance.now() - t0 > (minMs || 0);
      const key = (e) => {
        if (!['Enter', 'NumpadEnter', 'Space', 'KeyE'].includes(e.code)) return;
        e.preventDefault(); if (e.repeat || !ok()) return; done();
      };
      const click = (e) => { if (!ok()) return; if (test && !test(e)) return; done(); };
      const done = () => { window.removeEventListener('keydown', key, true); G.canvas.removeEventListener('pointerdown', click); sc._press = null; Audio.sfx('click'); res(); };
      window.addEventListener('keydown', key, true); G.canvas.addEventListener('pointerdown', click);
      sc._press = () => { window.removeEventListener('keydown', key, true); G.canvas.removeEventListener('pointerdown', click); };
    });
  }
  /* pointer position in game coordinates */
  function gamePos(e) {
    const r = G.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }
  function pauseMenu(sc) {
    sc.paused = true; Audio.sfx('pause');
    UI.menu({ title: 'Paused', items: [
      { label: 'Resume', primary: true, action: (m) => { m.close(); sc.paused = false; } },
      { label: 'Settings', action: () => UI.settings() },
      { label: 'Quit to title', action: (m) => { m.close(); Scenes.go('title'); } },
    ], onBack: () => { UI.stack[UI.stack.length - 1].close(); sc.paused = false; } });
  }

  /* ---------- confetti ---------- */
  const CONF_COLS = ['#9fe3c3', '#fff4cc', '#f39b8a', '#c9b8f0', '#a9d8f5', '#fbfffb'];
  function confettiBurst(list, x, y, n, spread) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * (spread || 2.2), s = 300 + Math.random() * 420;
      list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, w: 7 + Math.random() * 6, h: 4 + Math.random() * 4, col: CONF_COLS[i % CONF_COLS.length], life: 3 + Math.random() * 1.5 });
    }
  }
  function confettiRain(list, n) { for (let i = 0; i < n; i++) list.push({ x: Math.random() * W, y: -20 - Math.random() * 300, vx: (Math.random() - 0.5) * 60, vy: 60 + Math.random() * 90, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, w: 7 + Math.random() * 6, h: 4 + Math.random() * 4, col: CONF_COLS[i % CONF_COLS.length], life: 7 }); }
  function updConfetti(list, dt) {
    for (const p of list) { p.vy += 520 * dt; p.vx *= 0.985; p.vy = Math.min(p.vy, 170); p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= dt; }
    return list.filter(p => p.life > 0 && p.y < H + 30);
  }
  function drawConfetti(ctx, list) {
    for (const p of list) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.r * 1.7)); ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }
  }
  /* a little "E  look" pill above something */
  function prompt(ctx, x, y, text) {
    ctx.save(); ctx.font = '800 16px "Trebuchet MS", system-ui, sans-serif';
    const w = ctx.measureText(text).width + 26;
    ctx.fillStyle = 'rgba(15,23,20,.86)'; rr(ctx, x - w / 2, y - 16, w, 32, 16); ctx.fill();
    ctx.strokeStyle = PAL.line; ctx.lineWidth = 2.5; rr(ctx, x - w / 2, y - 16, w, 32, 16); ctx.stroke();
    ctx.fillStyle = PAL.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1);
    ctx.restore();
  }
  function starfield(ctx, t, top, bot) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top || '#121c2e'); g.addColorStop(1, bot || '#1f3d35');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      const x = (i * 197.3) % W, y = (i * 131.7) % (H * 0.8), tw = 0.45 + 0.55 * Math.abs(Math.sin(t * (0.6 + (i % 5) * 0.2) + i));
      ctx.fillStyle = 'rgba(251,255,251,' + (0.25 + 0.6 * tw) * (i % 3 ? 0.7 : 1) + ')';
      ctx.fillRect(x, y, i % 7 ? 2 : 3, i % 7 ? 2 : 3);
    }
  }
  function moon(ctx, x, y, r) {
    ctx.save(); ctx.shadowColor = 'rgba(255,244,204,.55)'; ctx.shadowBlur = 40;
    ctx.fillStyle = '#fff4cc'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(233,222,190,.7)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.18, 0, 6.3); ctx.arc(x + r * 0.25, y + r * 0.3, r * 0.12, 0, 6.3); ctx.fill();
  }

  /* =====================================================================
     MEMORY PICTURES — used by the birthday slideshow and the archive.
     Each draws into a w × h box at the origin.
     ===================================================================== */
  function contain(ctx, im, w, h, pad) {
    if (!im) return;
    const s = Math.min((w - pad * 2) / im.width, (h - pad * 2) / im.height);
    ctx.drawImage(im, (w - im.width * s) / 2, (h - im.height * s) / 2, im.width * s, im.height * s);
  }
  const MEM_DRAW = {
    slippers(ctx, w, h, t) {
      ctx.fillStyle = '#d3f0e1'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#c3e8d5'; for (let x = 0; x < w; x += 34) for (let y = (x / 34) % 2 ? 17 : 0; y < h; y += 34) ctx.fillRect(x, y, 17, 17);
      const s = h / 150;
      for (let i = 0; i < 5; i++) G.Art.slipper(ctx, w * (0.18 + i * 0.16), h * (0.42 + (i % 2) * 0.22), t + i, s);
    },
    bus(ctx, w, h) { ctx.fillStyle = '#bfe4f5'; ctx.fillRect(0, 0, w, h); contain(ctx, G.Art2.IM.mural, w, h, 8); },
    cult(ctx, w, h) { ctx.fillStyle = '#e9e3f8'; ctx.fillRect(0, 0, w, h); contain(ctx, G.Art.IM.poster, w, h, 8); },
    driving(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#bfe4f5'); g.addColorStop(1, '#e8f6ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#9fd3b9'; ctx.fillRect(0, h * 0.62, w, h * 0.38);
      ctx.fillStyle = '#8a9a94'; ctx.beginPath(); ctx.moveTo(w * 0.36, h * 0.62); ctx.lineTo(w * 0.64, h * 0.62); ctx.lineTo(w * 0.95, h); ctx.lineTo(w * 0.05, h); ctx.fill();
      ctx.fillStyle = '#fbfffb'; for (let i = 0; i < 4; i++) { const k = i / 4; ctx.fillRect(w * 0.5 - 2 - k * 3, h * (0.66 + k * 0.32), 4 + k * 6, h * 0.05); }
      // L plate
      const pw = h * 0.42, px = w * 0.16, py = h * 0.12;
      ctx.fillStyle = '#fbfffb'; rr(ctx, px, py, pw, pw, 6); ctx.fill(); outline(ctx, () => rr(ctx, px, py, pw, pw, 6), 2.5);
      ctx.fillStyle = '#e8584a'; ctx.fillRect(px + pw * 0.3, py + pw * 0.18, pw * 0.14, pw * 0.62); ctx.fillRect(px + pw * 0.3, py + pw * 0.66, pw * 0.42, pw * 0.14);
      // PASSED stamp
      ctx.save(); ctx.translate(w * 0.72, h * 0.3); ctx.rotate(-0.18);
      ctx.strokeStyle = PAL.green; ctx.lineWidth = 4; rr(ctx, -h * 0.3, -h * 0.1, h * 0.6, h * 0.2, 8); ctx.stroke();
      ctx.fillStyle = PAL.green; ctx.font = '900 ' + Math.round(h * 0.12) + 'px "Trebuchet MS", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PASSED', 0, 2);
      ctx.restore();
    },
    vending(ctx, w, h, t) {
      ctx.fillStyle = '#d6f1fb'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#bfe4f5'; ctx.fillRect(0, h * 0.82, w, h * 0.18);
      const s = h * 0.82 / 185; ctx.save(); ctx.translate(w / 2 - 50 * s, h * 0.9); ctx.scale(s, s); G.Art2.vending(ctx, 0, 0, t, true); ctx.restore();
      ctx.fillStyle = PAL.ink; ctx.font = '800 ' + Math.round(h * 0.09) + 'px "Trebuchet MS", system-ui'; ctx.textAlign = 'left';
      ctx.fillText('v2.0', w * 0.07, h * 0.16);
    },
    merch(ctx, w, h) {
      ctx.fillStyle = '#c8f0dc'; ctx.fillRect(0, 0, w, h);
      // a parcel
      const bx = w * 0.62, by = h * 0.5, bw = w * 0.3, bh = h * 0.38;
      ctx.fillStyle = '#f3dfae'; ctx.fillRect(bx, by, bw, bh); outline(ctx, () => ctx.rect(bx, by, bw, bh), 2.5);
      ctx.fillStyle = '#e2c78c'; ctx.fillRect(bx + bw * 0.42, by, bw * 0.16, bh);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w * 0.62, h); ctx.clip(); contain(ctx, G.Art.IM.wordmark, w * 0.66, h, 10); ctx.restore();
    },
    shirt(ctx, w, h) {
      ctx.fillStyle = '#16211d'; ctx.fillRect(0, 0, w, h);
      const a = IMG.labDuck, b = IMG.labTT;
      if (a) { const s = (w * 0.86) / a.width; ctx.drawImage(a, w * 0.07, h * 0.12, a.width * s, a.height * s); }
      if (b) { const s = (w * 0.7) / b.width; ctx.drawImage(b, w * 0.23, h * 0.56, b.width * s, b.height * s); }
    },
  };
  function drawMemory(ctx, id, w, h, t) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); (MEM_DRAW[id] || (() => {}))(ctx, w, h, t || 0); ctx.restore(); }
  /* a polaroid: picture + caption, centred at (x, y) */
  function polaroid(ctx, m, x, y, s, rot, t, alpha) {
    const pw = 400, ph = 260, fw = pw + 36, fh = ph + 118;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= alpha == null ? 1 : alpha;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; rr(ctx, -fw / 2 + 8, -fh / 2 + 12, fw, fh, 8); ctx.fill();
    ctx.fillStyle = '#fffaf0'; rr(ctx, -fw / 2, -fh / 2, fw, fh, 8); ctx.fill();
    ctx.save(); ctx.translate(-pw / 2, -fh / 2 + 18); drawMemory(ctx, m.id, pw, ph, t); ctx.restore();
    ctx.fillStyle = '#26332d'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = '900 25px "Trebuchet MS", system-ui, sans-serif'; ctx.fillText(m.title, 0, fh / 2 - 60);
    ctx.font = 'italic 600 18px "Trebuchet MS", system-ui, sans-serif'; ctx.fillStyle = '#4f5f58';
    wrapText(ctx, m.text, 0, fh / 2 - 32, pw - 10, 22);
    ctx.restore();
  }
  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '', lines = [];
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh - (lines.length - 1) * lh / 2));
  }

  /* =====================================================================
     THE FINAL ENCOUNTER
     ===================================================================== */
  const DOOR_X = 1000;                             // centre of the front door
  const SPOTS = [
    { id: 'poster', x: 330, label: 'E  look' },
    { id: 'mailbox', x: 560, label: 'E  look' },
    { id: 'window', x: 800, label: 'E  look' },
    { id: 'door', x: DOOR_X - 70, label: 'E  knock' },
  ];
  const F = { };
  timers(F);
  F.enter = function (data) {
    data = data || {};
    UI.closeAll(); UI.hud.hide(); G.canvas.classList.remove('aim');
    this.aborted = false; this.paused = false; this.busy = true; this.t = 0; this._timers = [];
    this.duck = { x: -120, face: 1, anim: 'walk', at: 0, target: null };
    this.tt = { x: DOOR_X, face: -1, anim: 'idle', at: 0, visible: false, target: null };
    this.mode = 'cut'; this.doorK = 0; this.slippers = false; this.conf = []; this.near = null; this.banner = null;
    this.w = Save.data.worlds.fin;
    if (!this.w.done) { Save.data.progress.stage = 'final'; Save.data.progress.checkpoint = null; Save.write(); }
    Audio.music('door');
    this.run();
  };
  F.walk = function (who, x, speed) {
    const c = this[who];
    return new Promise((res) => { c.target = x; c.speed = speed || 240; c.face = x > c.x ? 1 : -1; c.anim = speed > 400 ? 'run' : 'walk'; c.onArrive = res; });
  };
  F.run = async function () {
    const L = C.FINAL, dead = () => this.aborted;
    await UI.fade(false, 500); if (dead()) return;
    await UI.card(L.number, L.title, L.goal, 2400); if (dead()) return;
    await this.walk('duck', 170, 250); if (dead()) return;
    this.duck.anim = 'idle';
    await UI.say(L.arrive); if (dead()) return;
    // free roam until the door is knocked
    this.mode = 'walk'; this.busy = false;
    this.hint = UI.el('div', 'fin-hint', UI.esc(L.hint)); UI.$('#layer').appendChild(this.hint);
    await new Promise((res) => { this.onKnock = res; }); if (dead()) return;
    this.hint && this.hint.remove(); this.hint = null;
    this.mode = 'cut'; this.busy = true;
    // KNOCK KNOCK KNOCK
    const d = this.duck; d.face = 1; d.anim = 'idle'; d.knock = 0.6; Audio.sfx('knock'); this.shake = 0.12;
    await this.wait(1100); if (dead()) return;
    await UI.say(L.door1.slice(0, 2)); if (dead()) return;
    d.anim = 'damage'; d.at = 0; Audio.sfx('faint');                // "No." — dramatic collapse
    await this.wait(1900); if (dead()) return;
    d.anim = 'idle';
    await UI.say(L.door1.slice(2)); if (dead()) return;
    this.slippers = true; Audio.sfx('slipper');
    await UI.say(L.door2); if (dead()) return;
    // the door opens
    Audio.stop(0.4); Audio.sfx('unlock');
    await this.wait(700); if (dead()) return;
    Audio.sfx('door'); this.opening = true;
    await this.wait(500); if (dead()) return;
    d.anim = 'run'; d.face = 1; this.slippers = false;
    await this.walk('duck', DOOR_X - 250, 520); d.face = 1; d.anim = 'idle'; if (dead()) return;
    await this.wait(500); if (dead()) return;
    this.tt.visible = true; this.tt.x = DOOR_X; this.tt.face = -1;
    await this.walk('tt', DOOR_X - 92, 70); if (dead()) return;
    this.tt.face = -1; this.tt.anim = 'idle';
    await this.wait(900); if (dead()) return;
    // QUEST COMPLETE! TURTLETIMEE HAS BEEN FOUND.
    this.showBanner();
    Audio.sfx('quest'); Audio.sfx('popper');
    confettiBurst(this.conf, 300, GROUND, 70); confettiBurst(this.conf, W - 300, GROUND, 70); confettiRain(this.conf, 60);
    d.anim = 'victory'; d.at = 0; this.tt.anim = 'victory'; this.tt.at = 0;
    const firstTime = !this.w.done;
    this.w.done = true;
    if (['final', 'world3', 'new'].includes(Save.data.progress.stage) || firstTime) Save.data.progress.stage = 'birthday';
    Save.write();
    await this.wait(1600); Save.unlock('found');
    await this.wait(2600); if (dead()) return;
    this.hideBanner();
    d.anim = 'idle'; this.tt.anim = 'idle';
    Audio.music('title');
    await UI.say(L.reunion); if (dead()) return;
    await UI.say(Save.data.worlds.w2.beatTT ? L.poolWon : L.poolLost); if (dead()) return;
    await UI.say(L.driving); if (dead()) return;
    await UI.say(L.leave.slice(0, 4)); if (dead()) return;
    d.anim = 'run';
    await UI.say(L.leave.slice(4)); if (dead()) return;
    // Duck sprints off
    Audio.sfx('quack');
    await this.walk('duck', -220, 620); if (dead()) return;
    await this.wait(700); if (dead()) return;
    await UI.fade(true, 700); if (dead()) return;
    Scenes.go('birthday', {});
  };
  F.showBanner = function () {
    const L = C.FINAL;
    const b = UI.el('div', 'quest');
    b.innerHTML = '<div class="q-big"></div> <div class="q-sub"></div>';
    b.querySelector('.q-big').textContent = L.found; b.querySelector('.q-sub').textContent = L.foundSub;
    b.setAttribute('role', 'status');
    UI.$('#layer').appendChild(b); requestAnimationFrame(() => b.classList.add('in'));
    this.banner = b;
  };
  F.hideBanner = function () { const b = this.banner; if (!b) return; b.classList.remove('in'); setTimeout(() => b.remove(), 500); this.banner = null; };
  F.look = async function (id) {
    const L = C.FINAL; this.busy = true;
    const looked = this.w.looked || (this.w.looked = []);
    if (id === 'mailbox') {
      if (!this.w.quote) {
        await UI.say(L.mailbox); if (this.aborted) return;
        await UI.say(L.mailboxQuote); if (this.aborted) return;
        Audio.sfx('quote');
        const q = C.QUOTES.find(x => x.id === 'q4');
        Save.data.quotes.q4 = true; this.w.quote = true; Save.write();
        await UI.quotePanel(q.text, Object.keys(Save.data.quotes).length); if (this.aborted) return;
        Save.unlock('quote4');
      } else await UI.say(looked.includes('mailbox') ? L.mailboxAgain : L.mailbox);
    } else await UI.say(L[id]);
    if (this.aborted) return;
    if (!looked.includes(id)) { looked.push(id); Save.write(); }
    if (['poster', 'mailbox', 'window', 'doormat'].every(k => looked.includes(k))) Save.unlock('nosy');
    this.busy = false;
  };
  F.exit = function () {
    this.aborted = true; this._timers = [];
    if (this.hint) { this.hint.remove(); this.hint = null; }
    if (this.banner) { this.banner.remove(); this.banner = null; }
    if (this._press) this._press();
  };
  F.onBlur = function () { if (!this.paused && !UI.isOpen() && !UI.inDialogue()) pauseMenu(this); };
  F.update = function (dt) {
    if (Input.hit('pause') && !UI.isOpen() && !UI.inDialogue() && !this.paused) { pauseMenu(this); return; }
    if (this.paused) return;
    this.t += dt; this.tickTimers(dt);
    this.shake = Math.max(0, (this.shake || 0) - dt);
    for (const c of [this.duck, this.tt]) {
      c.at += dt;
      if (c.target != null) {
        const dir = Math.sign(c.target - c.x); c.x += dir * c.speed * dt;
        if ((dir > 0 && c.x >= c.target) || (dir < 0 && c.x <= c.target) || dir === 0) { c.x = c.target; c.target = null; c.anim = 'idle'; const r = c.onArrive; c.onArrive = null; r && r(); }
      }
    }
    if (this.duck.knock) this.duck.knock = Math.max(0, this.duck.knock - dt);
    if (this.opening) this.doorK = Math.min(1, this.doorK + dt * 1.6);
    this.conf = updConfetti(this.conf, dt);
    // free roam
    this.near = null;
    if (this.mode === 'walk' && !this.busy && !UI.isOpen() && !UI.inDialogue()) {
      const d = this.duck;
      const ix = (Input.isDown('right') ? 1 : 0) - (Input.isDown('left') ? 1 : 0);
      if (ix) { d.x = U.clamp(d.x + ix * 240 * dt, 60, DOOR_X - 70); d.face = ix; if (d.anim !== 'walk') { d.anim = 'walk'; } }
      else if (d.anim !== 'idle') d.anim = 'idle';
      let best = null, bd = 80;
      for (const s of SPOTS) { const dd = Math.abs(s.x - d.x); if (dd < bd) { bd = dd; best = s; } }
      if (!best && Math.abs(d.x - (DOOR_X - 70)) < 40) best = SPOTS[3];
      // the doormat is right in front of the door: look at it with "down"
      this.near = best;
      if (best && (Input.hit('confirm') || Input.hit('up'))) {
        d.anim = 'idle';
        if (best.id === 'door') { const r = this.onKnock; this.onKnock = null; r && r(); }
        else this.look(best.id);
      } else if (best && best.id === 'door' && Input.hit('down')) this.look('doormat');
    }
  };
  F.draw = function (ctx) {
    const t = this.t;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 4);
    drawStreet(ctx, t, this.doorK);
    // characters
    const d = this.duck, tt = this.tt;
    if (tt.visible) Chars.draw(ctx, 'tt', tt.anim, tt.anim === 'idle' || tt.anim === 'walk' ? t : tt.at, tt.x, GROUND, SIZE, { face: tt.face });
    const dy = d.knock ? -Math.abs(Math.sin(d.knock * 16)) * 6 : 0;
    Chars.draw(ctx, 'duck', d.anim, ['idle', 'walk', 'run'].includes(d.anim) ? t : d.at, d.x + (d.knock ? Math.sin(d.knock * 32) * 3 : 0), GROUND + dy, SIZE, { face: d.face });
    if (this.slippers) {                       // holding the slippers up high
      G.Art.slipper(ctx, d.x - 34, GROUND - SIZE * 1.12, t, 0.85);
      G.Art.slipper(ctx, d.x + 34, GROUND - SIZE * 1.16, t + 1, 0.85);
    }
    if (this.near && this.mode === 'walk' && !this.busy && !UI.inDialogue()) {
      const s = this.near;
      prompt(ctx, s.id === 'door' ? DOOR_X : s.x, s.id === 'door' ? 290 : s.id === 'window' ? 300 : s.id === 'poster' ? 270 : 400, s.id === 'door' ? 'E  knock   ·   S  doormat' : s.label);
    }
    drawConfetti(ctx, this.conf);
    ctx.restore();
  };

  /* the street outside Turtletimee's house, at sunset */
  function drawStreet(ctx, t, doorK) {
    const g = ctx.createLinearGradient(0, 0, 0, 470);
    g.addColorStop(0, '#b9a6ea'); g.addColorStop(0.55, '#f4b9ac'); g.addColorStop(1, '#ffe9bf');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 520);
    // sun + clouds
    ctx.fillStyle = 'rgba(255,244,204,.95)'; ctx.beginPath(); ctx.arc(200, 400, 92, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 4; i++) { const cx = ((i * 330 + t * 8) % (W + 300)) - 150, cy = 90 + (i % 2) * 70; ctx.beginPath(); ctx.ellipse(cx, cy, 70, 18, 0, 0, 6.3); ctx.ellipse(cx + 40, cy - 10, 44, 16, 0, 0, 6.3); ctx.fill(); }
    // hills
    ctx.fillStyle = '#9fd3b9'; ctx.beginPath(); ctx.moveTo(0, 470); ctx.quadraticCurveTo(240, 360, 520, 450); ctx.quadraticCurveTo(760, 380, 980, 470); ctx.lineTo(980, 520); ctx.lineTo(0, 520); ctx.fill();
    ctx.fillStyle = '#86c6a6'; ctx.beginPath(); ctx.moveTo(0, 500); ctx.quadraticCurveTo(300, 430, 620, 500); ctx.lineTo(620, 530); ctx.lineTo(0, 530); ctx.fill();
    // lawn
    ctx.fillStyle = '#8fcfa8'; ctx.fillRect(0, 500, W, 100);
    // picket fence
    for (let x = 10; x < 690; x += 34) {
      if (x > 520 && x < 610) continue;   // gap for the mailbox
      const f = () => { ctx.beginPath(); ctx.moveTo(x, 584); ctx.lineTo(x, 520); ctx.lineTo(x + 10, 508); ctx.lineTo(x + 20, 520); ctx.lineTo(x + 20, 584); ctx.closePath(); };
      ctx.fillStyle = '#fbfffb'; f(); ctx.fill();
    }
    ctx.fillStyle = '#e7f1ec'; ctx.fillRect(0, 534, 520, 8); ctx.fillRect(610, 534, 80, 8);
    // HOUSE
    const hx = 680;
    ctx.fillStyle = '#d9f2e4'; ctx.fillRect(hx + 20, 262, W - hx, 350);
    ctx.fillStyle = '#c3e8d5'; for (let y = 280; y < 612; y += 26) ctx.fillRect(hx + 20, y, W - hx, 3);
    // roof
    const roof = () => { ctx.beginPath(); ctx.moveTo(hx - 10, 272); ctx.lineTo(hx + 300, 120); ctx.lineTo(W + 40, 272); ctx.closePath(); };
    ctx.fillStyle = PAL.lavLo; roof(); ctx.fill(); outline(ctx, roof, 3);
    ctx.fillStyle = '#b4a3e2'; ctx.fillRect(1120, 120, 50, 90); outline(ctx, () => ctx.rect(1120, 120, 50, 90), 2.5);
    // chimney puffs
    for (let i = 0; i < 3; i++) { const k = (t * 0.25 + i / 3) % 1; ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - k)) + ')'; ctx.beginPath(); ctx.arc(1145 + k * 30, 110 - k * 90, 10 + k * 16, 0, 6.3); ctx.fill(); }
    // house sign
    ctx.fillStyle = 'rgba(15,23,20,.82)'; rr(ctx, hx + 190, 210, 220, 38, 12); ctx.fill(); outline(ctx, () => rr(ctx, hx + 190, 210, 220, 38, 12), 2.5);
    ctx.fillStyle = PAL.line; ctx.font = '800 17px "Trebuchet MS", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TURTLETIMEE HQ', hx + 300, 230);
    // window with the TV glow (somebody is eating crackers)
    const wx = 740, wy = 330, ww = 130, wh = 120;
    const glow = ctx.createLinearGradient(0, wy, 0, wy + wh); glow.addColorStop(0, '#fff2c4'); glow.addColorStop(1, '#ffd99a');
    ctx.fillStyle = glow; ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = 'rgba(169,216,245,' + (0.25 + 0.2 * Math.abs(Math.sin(t * 3.1) * Math.sin(t * 1.7))) + ')'; ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#b4a3e2'; ctx.fillRect(wx + 10, wy + 78, ww - 20, 42);                 // the couch back
    ctx.fillStyle = PAL.lav; ctx.fillRect(wx - 6, wy - 6, 26, wh + 12); ctx.fillRect(wx + ww - 20, wy - 6, 26, wh + 12);
    ctx.fillStyle = PAL.line; ctx.fillRect(wx + ww / 2 - 3, wy, 6, wh); ctx.fillRect(wx, wy + wh / 2 - 3, ww, 6);
    outline(ctx, () => ctx.rect(wx, wy, ww, wh), 3);
    // DOOR
    const dx = DOOR_X - 70, dy = 318, dw = 140, dh = 294;
    ctx.fillStyle = '#efe6cf'; ctx.fillRect(dx - 14, dy - 14, dw + 28, dh + 14);
    ctx.fillStyle = '#ffe2a0'; ctx.fillRect(dx, dy, dw, dh);                                // warm light inside
    if (doorK > 0) { ctx.fillStyle = 'rgba(255,233,170,' + 0.35 * doorK + ')'; ctx.beginPath(); ctx.moveTo(dx, GROUND); ctx.lineTo(dx + dw, GROUND); ctx.lineTo(dx + dw + 90 * doorK, GROUND + 60); ctx.lineTo(dx - 120 * doorK, GROUND + 60); ctx.fill(); }
    const vis = 1 - ease(doorK) * 0.82, pw = dw * vis;                 // the door swings in
    ctx.fillStyle = doorK > 0 ? '#b4a3e2' : PAL.lav; ctx.fillRect(dx, dy, pw, dh);
    ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(dx + pw * 0.14, dy + 22, pw * 0.72, 112); ctx.fillRect(dx + pw * 0.14, dy + 160, pw * 0.72, 112);
    ctx.fillStyle = PAL.cream; ctx.beginPath(); ctx.arc(dx + pw * 0.84, dy + 160, 8 * vis + 2, 0, 6.3); ctx.fill();
    outline(ctx, () => ctx.rect(dx, dy, dw, dh), 3);
    // little wreath of slippers? no — a tiny "do not disturb"
    if (doorK < 0.3) {
      ctx.fillStyle = PAL.cream; rr(ctx, dx + 30, dy + 34, 80, 30, 6); ctx.fill();
      ctx.fillStyle = '#7a5a52'; ctx.font = '800 11px "Trebuchet MS", system-ui'; ctx.fillText('DO NOT', dx + 70, dy + 44); ctx.fillText('DISTURB', dx + 70, dy + 56);
    }
    // porch step + doormat
    ctx.fillStyle = '#efe6cf'; ctx.fillRect(dx - 40, GROUND - 6, dw + 80, 12);
    // pavement
    ctx.fillStyle = '#efe6cf'; ctx.fillRect(0, 596, W, 124);
    ctx.fillStyle = '#e2d7bb'; for (let x = 0; x < W; x += 120) ctx.fillRect(x, 596, 3, 124);
    ctx.fillStyle = '#fbfffb'; ctx.fillRect(0, 594, W, 4);
    ctx.fillStyle = '#d5c9ef'; rr(ctx, DOOR_X - 66, 604, 132, 20, 6); ctx.fill();
    ctx.fillStyle = '#5d4f88'; ctx.font = '700 12px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('it\'s turtletimee.', DOOR_X, 615);
    // lamp post with Duck's MISSING poster
    ctx.fillStyle = '#5d6f68'; ctx.fillRect(326, 240, 10, 360); ctx.fillRect(316, 236, 30, 10);
    ctx.fillStyle = '#fff4cc'; ctx.beginPath(); ctx.arc(331, 226, 16, 0, 6.3); ctx.fill();
    ctx.save(); ctx.translate(331, 362); ctx.rotate(-0.05);
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(-52, -62, 104, 132); outline(ctx, () => ctx.rect(-52, -62, 104, 132), 2);
    ctx.fillStyle = '#e8584a'; ctx.font = '900 18px "Trebuchet MS", system-ui'; ctx.fillText('MISSING', 0, -42);
    // a very questionable turtle drawing
    ctx.strokeStyle = '#26332d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(-4, 2, 26, 17, 0, Math.PI, 0); ctx.lineTo(22, 6); ctx.lineTo(-30, 6); ctx.stroke();
    ctx.beginPath(); ctx.arc(30, -2, 8, 0, 6.3); ctx.stroke(); ctx.fillStyle = '#26332d'; ctx.fillRect(31, -5, 3, 3);
    ctx.beginPath(); ctx.moveTo(-20, 6); ctx.lineTo(-22, 16); ctx.moveTo(12, 6); ctx.lineTo(14, 16); ctx.stroke();
    ctx.font = '800 10px "Trebuchet MS", system-ui'; ctx.fillStyle = '#26332d'; ctx.fillText('ONE (1) TURTLE', 0, 34); ctx.fillText('REWARD: 1kg CORN', 0, 50);
    ctx.restore();
    // mailbox
    ctx.fillStyle = '#7a8f86'; ctx.fillRect(555, 470, 10, 128);
    const mb = () => { ctx.beginPath(); ctx.moveTo(522, 476); ctx.lineTo(522, 440); ctx.arc(560, 440, 38, Math.PI, 0); ctx.lineTo(598, 476); ctx.closePath(); };
    ctx.fillStyle = '#9fe3c3'; mb(); ctx.fill(); outline(ctx, mb, 2.5);
    ctx.fillStyle = '#f39b8a'; ctx.fillRect(598, 420, 6, 34); ctx.fillRect(598, 420, 20, 12);         // flag up
    ctx.fillStyle = '#f3dfae'; ctx.fillRect(506, 430, 34, 26); outline(ctx, () => ctx.rect(506, 430, 34, 26), 2);   // parcel sticking out
    ctx.fillStyle = '#fbfffb'; ctx.save(); ctx.translate(522, 422); ctx.rotate(-0.4); ctx.fillRect(0, 0, 24, 16); ctx.restore();
    ctx.fillStyle = PAL.ink; ctx.font = '900 14px "Trebuchet MS", system-ui'; ctx.fillText('TT', 560, 462);
    // bushes
    ctx.fillStyle = '#6fbf95';
    for (const [x, r] of [[700, 34], [736, 26], [1210, 38], [1250, 30]]) { ctx.beginPath(); ctx.arc(x, 590, r, Math.PI, 0); ctx.fill(); }
  }
  Scenes.add('final', F);

  /* =====================================================================
     THE BIRTHDAY
     ===================================================================== */
  const B = {};
  timers(B);
  B.enter = function (data) {
    data = data || {};
    UI.closeAll(); UI.hud.hide(); G.canvas.classList.remove('aim');
    this.aborted = false; this.paused = false; this.t = 0; this._timers = [];
    this.phase = 'room'; this.dark = 0.92; this.lit = false; this.candles = true; this.smoke = []; this.conf = [];
    this.duck = { x: 420, face: 1, anim: 'idle', at: 0, show: false };
    this.tt = { x: 860, face: -1, anim: 'idle', at: 0 };
    this.mem = -1; this.memT = 0; this.pile = []; this.credY = 0; this.endT = -1; this.peek = 0; this.env = null;
    this.lockPause = false;
    if (!Save.data.worlds.bday.seen && Save.data.progress.stage !== 'done') { Save.data.progress.stage = 'birthday'; Save.write(); }
    Audio.stop(0.6);
    this.run();
  };
  B.run = async function () {
    const L = C.BDAY, dead = () => this.aborted;
    await UI.fade(false, 900); if (dead()) return;
    await this.wait(700); if (dead()) return;
    await UI.say(L.dark); if (dead()) return;
    // LIGHTS
    Audio.sfx('lights'); await this.wait(250); if (dead()) return;
    this.dark = 0; this.lit = true; this.duck.show = true; this.duck.anim = 'victory'; this.duck.at = 0;
    Audio.sfx('popper'); Audio.music('party');
    confettiBurst(this.conf, this.duck.x + 60, 470, 90, 1.6); confettiRain(this.conf, 80);
    await this.wait(1400); if (dead()) return;
    await UI.say(L.surprise.slice(0, 1)); if (dead()) return;
    this.duck.anim = 'idle';
    await UI.say(L.surprise.slice(1)); if (dead()) return;
    // MAKE A WISH
    this.wishing = true;
    const wp = UI.el('div', 'wish', '<b></b><span></span>');
    wp.querySelector('b').textContent = L.wishPrompt; wp.querySelector('span').textContent = L.wishKeys;
    UI.$('#layer').appendChild(wp); this.wishEl = wp; requestAnimationFrame(() => wp.classList.add('in'));
    await pressOnce(this, 1200); if (dead()) return;
    wp.remove(); this.wishEl = null; this.wishing = false;
    Audio.sfx('blow'); this.candles = false;
    for (let i = 0; i < 22; i++) this.smoke.push({ x: 600 + (i % 11) * 8, y: 404 - (i % 3) * 6, vy: -30 - Math.random() * 30, vx: (Math.random() - 0.5) * 20, life: 1.6 + Math.random() });
    Save.data.worlds.bday.wish = true; Save.write();
    await this.wait(1500); if (dead()) return;
    Save.unlock('wish');
    await UI.say(L.afterWish); if (dead()) return;
    // THE SLIDESHOW
    this.phase = 'memories'; Audio.music('memories'); this.memHint = true;
    for (let i = 0; i < C.MEMORIES.length; i++) {
      if (this.mem >= 0) this.pile.push({ i: this.mem, x: 150 + Math.random() * 120 + (this.pile.length % 2) * 860, y: 220 + Math.random() * 280, rot: (Math.random() - 0.5) * 0.5 });
      this.mem = i; this.memT = 0; Audio.sfx('page');
      await pressOnce(this, 900); if (dead()) return;
    }
    this.pile.push({ i: this.mem, x: 640, y: 330, rot: 0.06 }); this.mem = -1; this.memHint = false;
    await this.wait(400); if (dead()) return;
    this.phase = 'room';
    await UI.say(L.afterMemories); if (dead()) return;
    // LEVEL UP
    Audio.stop(0.2); Audio.sfx('whoosh'); this.flash = 1;
    this.phase = 'rpg'; this.tt.anim = 'idle';
    await this.wait(500); if (dead()) return;
    Audio.music('levelup');
    await this.levelUp(); if (dead()) return;
    // THE END (or is it)
    this.phase = 'credits'; this.credY = 0;
    await new Promise((res) => { this.onCredits = res; }); if (dead()) return;
    this.endT = 0; Audio.stop(2.5);
    await this.wait(4200); if (dead()) return;
    // ...wait.
    this.peekTarget = 1; Audio.sfx('quack');
    await this.wait(900); if (dead()) return;
    await UI.say(L.twist); if (dead()) return;
    this.peekTarget = 0;
    // an envelope
    this.env = { y: -200, vy: 0, open: 0, landed: false };
    Audio.sfx('envelope'); Audio.music('letter');
    await new Promise((res) => { this.onLanded = res; }); if (dead()) return;
    const eh = UI.el('div', 'env-hint'); eh.textContent = L.envelopeHint; UI.$('#layer').appendChild(eh); this.envHint = eh;
    await pressOnce(this, 1500, (e) => { const p = gamePos(e); return Math.abs(p.x - 640) < 190 && Math.abs(p.y - this.env.y) < 140; }); if (dead()) return;
    eh.remove(); this.envHint = null;
    Audio.sfx('page'); this.env.opening = true;
    await this.wait(1300); if (dead()) return;
    // THE LETTER
    this.phase = 'letter'; this.lockPause = true;
    await showLetter(this, { progressive: true }); if (dead()) return;
    this.lockPause = false;
    Save.data.worlds.bday.letter = true; Save.write();
    // ...so?
    this.phase = 'night';
    await this.wait(900); if (dead()) return;
    Save.unlock('letter');
    await UI.say(L.after); if (dead()) return;
    this.tt.anim = 'interact'; this.tt.at = 0; Audio.sfx('shing');
    await this.wait(4800); Audio.sfx('sparkle'); await this.wait(1400); if (dead()) return;
    Audio.sfx('stamp'); this.shake = 0.3;
    await this.wait(1900); if (dead()) return;
    this.tt.anim = 'cool';
    await UI.say(L.after2); if (dead()) return;
    // done: the archive opens
    Save.data.worlds.bday.seen = true; Save.data.progress.stage = 'done'; Save.write();
    await this.wait(600); if (dead()) return;
    await UI.fade(true, 900); if (dead()) return;
    this.phase = 'black';
    await UI.fade(false, 10);
    await UI.card(L.archiveCard[0], L.archiveCard[1], L.archiveCard[2], 3000); if (dead()) return;
    Scenes.go('archive', { first: true });
  };
  /* the RPG level-up screen */
  B.levelUp = function () {
    const L = C.BDAY.levelUp;
    return new Promise(async (res) => {
      const p = UI.el('div', 'lvlup');
      p.innerHTML = '<div class="lv-head"><b></b><i></i></div>' +
        '<div class="lv-level"><span class="lv-from"></span><span class="lv-arrow">→</span><span class="lv-to"></span></div>' +
        '<div class="lv-exp"><em>EXP</em><div class="lv-bar"><i></i></div></div>' +
        '<div class="lv-banner">LEVEL UP!</div><dl class="lv-stats"></dl><div class="lv-skill"></div><div class="lv-go"></div>';
      p.querySelector('.lv-head b').textContent = L.name; p.querySelector('.lv-head i').textContent = '"' + L.alias + '"';
      p.querySelector('.lv-from').textContent = 'Lv ' + L.from; p.querySelector('.lv-to').textContent = 'Lv ' + L.to;
      UI.$('#layer').appendChild(p); this.lvEl = p;
      requestAnimationFrame(() => p.classList.add('in'));
      await this.wait(900); if (this.aborted) return;
      const bar = p.querySelector('.lv-bar i');
      for (let k = 0; k <= 20; k++) { bar.style.width = (k * 5) + '%'; Audio.sfx('tally'); await this.wait(70); if (this.aborted) return; }
      await this.wait(250); if (this.aborted) return;
      p.classList.add('up'); Audio.sfx('levelup'); this.flash = 0.8;
      confettiRain(this.conf, 70);
      this.tt.anim = 'victory'; this.tt.at = 0;
      await this.wait(1100); if (this.aborted) return;
      const dl = p.querySelector('.lv-stats');
      for (const [k, v] of L.stats) {
        const dt = UI.el('dt'); dt.textContent = k; const dd = UI.el('dd'); dd.textContent = v;
        dl.appendChild(dt); dl.appendChild(dd); Audio.sfx('corn');
        await this.wait(650); if (this.aborted) return;
      }
      await this.wait(300); if (this.aborted) return;
      p.querySelector('.lv-skill').textContent = L.skill; Audio.sfx('checkpoint');
      await this.wait(900); if (this.aborted) return;
      const go = p.querySelector('.lv-go'); go.textContent = '▸ Enter / Space / click';
      await pressOnce(this, 300); if (this.aborted) return;
      p.classList.remove('in'); setTimeout(() => p.remove(), 400); this.lvEl = null;
      res();
    });
  };
  B.exit = function () {
    this.aborted = true; this._timers = [];
    for (const k of ['wishEl', 'lvEl', 'envHint']) if (this[k]) { this[k].remove(); this[k] = null; }
    if (this._press) this._press();
    closeLetter();
  };
  B.onBlur = function () { if (!this.paused && !this.lockPause && !UI.isOpen() && !UI.inDialogue()) pauseMenu(this); };
  B.update = function (dt) {
    if (Input.hit('pause') && !this.lockPause && !UI.isOpen() && !UI.inDialogue() && !this.paused) { pauseMenu(this); return; }
    if (this.paused) return;
    this.t += dt; this.tickTimers(dt);
    this.duck.at += dt; this.tt.at += dt; this.memT += dt;
    this.flash = Math.max(0, (this.flash || 0) - dt * 1.5);
    this.shake = Math.max(0, (this.shake || 0) - dt);
    this.conf = updConfetti(this.conf, dt);
    for (const s of this.smoke) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; }
    this.smoke = this.smoke.filter(s => s.life > 0);
    if (this.phase === 'credits' && this.endT < 0) {
      const fast = Input.isDown('confirm') || Input.mouse.down;
      this.credY += dt * (fast ? 300 : 78);
      if (this.credY > creditsHeight() + H + 80) { const r = this.onCredits; this.onCredits = null; r && r(); }
    }
    if (this.endT >= 0) this.endT += dt;
    this.peek += ((this.peekTarget || 0) - this.peek) * Math.min(1, dt * 5);
    const e = this.env;
    if (e) {
      if (!e.landed) { e.vy += 1400 * dt; e.y += e.vy * dt; if (e.y >= 330) { e.y = 330; if (e.vy > 200) { e.vy *= -0.35; Audio.sfx('land'); } else { e.vy = 0; e.landed = true; const r = this.onLanded; this.onLanded = null; r && r(); } } }
      if (e.opening) e.open = Math.min(1, e.open + dt * 1.1);
    }
  };

  /* --- birthday drawing --- */
  function drawRoom(ctx, t) {
    ctx.fillStyle = '#d3f0e1'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c3e8d5'; for (let x = 0; x < W; x += 64) ctx.fillRect(x, 0, 28, 470);
    ctx.fillStyle = '#9fd3b9'; ctx.fillRect(0, 470, W, 250);
    ctx.fillStyle = '#fbfffb'; ctx.fillRect(0, 466, W, 6);
    // window (night now)
    ctx.fillStyle = '#fbfffb'; ctx.fillRect(140, 70, 250, 200);
    const g = ctx.createLinearGradient(0, 80, 0, 260); g.addColorStop(0, '#2b3a5e'); g.addColorStop(1, '#5a5f8f'); ctx.fillStyle = g; ctx.fillRect(152, 82, 226, 176);
    ctx.fillStyle = '#fff4cc'; ctx.beginPath(); ctx.arc(330, 120, 16, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#fbfffb'; ctx.fillRect(262, 82, 6, 176); ctx.fillRect(152, 166, 226, 6);
    // her couch (the dent is back)
    ctx.fillStyle = '#c9b8f0'; rr(ctx, 860, 330, 380, 110, 30); ctx.fill();
    ctx.fillStyle = '#b4a3e2'; rr(ctx, 840, 380, 420, 96, 28); ctx.fill();
  }
  function drawBunting(ctx, t, text) {
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 3;
    const n = text.length, x0 = 150, x1 = W - 150;
    ctx.beginPath(); ctx.moveTo(x0, 40); ctx.quadraticCurveTo(W / 2, 110, x1, 40); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n, x = x0 + (x1 - x0) * k, y = 40 + 4 * 70 * k * (1 - k) * 0.5 * 2 / 2 + 0, sw = Math.sin(t * 2 + i) * 0.06;
      const yy = 40 + (110 - 40) * 2 * k * (1 - k) * 2 / 2;
      if (text[i] === ' ') continue;
      ctx.save(); ctx.translate(x, yy); ctx.rotate(sw);
      ctx.fillStyle = CONF_COLS[i % 5]; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(22, 0); ctx.lineTo(0, 52); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#16231e'; ctx.font = '900 20px "Trebuchet MS", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text[i], 0, 17);
      ctx.restore();
    }
  }
  function drawCake(ctx, x, y, t, lit) {
    // table
    ctx.fillStyle = '#efe6cf'; rr(ctx, x - 150, y, 300, 22, 8); ctx.fill(); outline(ctx, () => rr(ctx, x - 150, y, 300, 22, 8), 2.5);
    ctx.fillStyle = '#e2d7bb'; ctx.fillRect(x - 130, y + 22, 14, 120); ctx.fillRect(x + 116, y + 22, 14, 120);
    // cake
    const t1 = () => rr(ctx, x - 100, y - 70, 200, 70, 10), t2 = () => rr(ctx, x - 66, y - 128, 132, 60, 10);
    ctx.fillStyle = '#fff4cc'; t1(); ctx.fill(); outline(ctx, t1, 2.5);
    ctx.fillStyle = '#9fe3c3'; t2(); ctx.fill(); outline(ctx, t2, 2.5);
    ctx.fillStyle = '#f39b8a';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(x - 88 + i * 22, y - 68, 9, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = '#fbfffb'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x - 55 + i * 22, y - 126, 8, 0, Math.PI); ctx.fill(); }
    // two candles, shaped like a twenty
    const flames = [];
    const big = (cx, ch) => {
      ctx.fillStyle = '#c9b8f0'; ctx.font = '900 46px "Trebuchet MS", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.lineWidth = 5; ctx.strokeStyle = '#fbfffb'; ctx.strokeText(ch, cx, y - 130); ctx.fillText(ch, cx, y - 130);
      flames.push([cx, y - 176]);
    };
    big(x - 22, '2'); big(x + 22, '0');
    if (lit) for (const [fx, fy] of flames) {
      const f = 1 + Math.sin(t * 18 + fx) * 0.15;
      ctx.fillStyle = 'rgba(255,233,150,.35)'; ctx.beginPath(); ctx.arc(fx, fy, 12, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.ellipse(fx, fy, 4, 8 * f, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#fff8dd'; ctx.beginPath(); ctx.ellipse(fx, fy + 2, 2, 4 * f, 0, 0, 6.3); ctx.fill();
    }
    // the knife in the cake (for cutting)
    Chars.drawKnife(ctx, x + 50, y - 150, -1.2, 70, true);
  }
  function drawLevelBg(ctx, t) {
    const g = ctx.createRadialGradient(330, 420, 40, 330, 420, 900); g.addColorStop(0, '#2f6e57'); g.addColorStop(1, '#0f1714');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(330, 420); ctx.rotate(t * 0.08);
    for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.fillStyle = i % 2 ? 'rgba(159,227,195,.06)' : 'rgba(255,244,204,.05)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(900, -90); ctx.lineTo(900, 90); ctx.fill(); }
    ctx.restore();
  }
  let CRED_H = 0;
  function creditsLayout() {
    let y = 0; const out = [];
    for (const it of C.BDAY.credits) {
      const k = it[0];
      const h = k === 'big' ? 70 : k === 'sub' ? 50 : k === 'gap' ? 40 : k === 'head' ? 54 : k === 'mono' ? 40 : 38;
      out.push({ it, y }); y += h;
    }
    CRED_H = y; return out;
  }
  function creditsHeight() { if (!CRED_H) creditsLayout(); return CRED_H; }
  function drawCredits(ctx, t, scroll) {
    const lay = creditsLayout();
    ctx.textBaseline = 'middle';
    for (const { it, y } of lay) {
      const yy = H + 40 + y - scroll; if (yy < -60 || yy > H + 60) continue;
      const a = Math.min(1, Math.min(yy, H - yy) / 120);
      ctx.globalAlpha = Math.max(0, a);
      ctx.textAlign = 'center';
      if (it[0] === 'big') { ctx.fillStyle = '#fbfffb'; ctx.font = '900 54px "Trebuchet MS", system-ui'; ctx.fillText(it[1], W / 2, yy); }
      else if (it[0] === 'sub') { ctx.fillStyle = '#9fe3c3'; ctx.font = '900 26px "Trebuchet MS", system-ui'; ctx.fillText(it[1].split('').join(String.fromCharCode(8202)), W / 2, yy); }
      else if (it[0] === 'mono') { ctx.fillStyle = '#9fe3c3'; ctx.font = '800 17px ui-monospace, Menlo, Consolas, monospace'; ctx.fillText(it[1], W / 2, yy); }
      else if (it[0] === 'head') { ctx.fillStyle = '#fff4cc'; ctx.font = '800 16px ui-monospace, Menlo, Consolas, monospace'; ctx.fillText(it[1], W / 2, yy); }
      else if (it[0] === 'row') {
        ctx.font = '700 22px "Trebuchet MS", system-ui'; ctx.textAlign = 'right'; ctx.fillStyle = '#fbfffb'; ctx.fillText(it[1], W / 2 - 24, yy);
        ctx.textAlign = 'left'; ctx.fillStyle = '#a9c2b6'; ctx.font = 'italic 600 21px "Trebuchet MS", system-ui'; ctx.fillText(it[2], W / 2 + 24, yy);
      } else if (it[0] === 'small') { ctx.fillStyle = '#a9c2b6'; ctx.font = 'italic 600 19px "Trebuchet MS", system-ui'; ctx.fillText(it[1], W / 2, yy); }
    }
    ctx.globalAlpha = 1;
  }
  function drawEnvelope(ctx, x, y, open, t) {
    const w = 300, h = 190;
    ctx.save(); ctx.translate(x, y);
    // the letter peeking out
    if (open > 0.35) { const k = ease((open - 0.35) / 0.65); ctx.fillStyle = '#fffaf0'; rr(ctx, -w / 2 + 22, -h / 2 + 10 - k * 120, w - 44, h - 20, 6); ctx.fill(); ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 50, -h / 2 + 40 + i * 20 - k * 120); ctx.lineTo(w / 2 - 50, -h / 2 + 40 + i * 20 - k * 120); ctx.stroke(); } }
    ctx.fillStyle = '#fff4cc'; rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.fill(); outline(ctx, () => rr(ctx, -w / 2, -h / 2, w, h, 10), 3);
    ctx.strokeStyle = '#e6d6a8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-w / 2 + 6, h / 2 - 6); ctx.lineTo(0, 6); ctx.lineTo(w / 2 - 6, h / 2 - 6); ctx.stroke();
    // flap
    const fk = Math.min(1, open / 0.35), fy = 1 - 2 * fk;
    ctx.save(); ctx.translate(0, -h / 2); ctx.scale(1, fy);
    const flap = () => { ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(0, h * 0.58); ctx.lineTo(w / 2, 0); ctx.closePath(); };
    ctx.fillStyle = fy > 0 ? '#ffeec0' : '#f6e3ad'; flap(); ctx.fill(); outline(ctx, flap, 2.5);
    ctx.restore();
    // the seal
    if (open < 0.2) {
      ctx.fillStyle = '#f39b8a'; ctx.beginPath(); ctx.arc(0, -h / 2 + h * 0.58, 22, 0, 6.3); ctx.fill(); outline(ctx, () => { ctx.beginPath(); ctx.arc(0, -h / 2 + h * 0.58, 22, 0, 6.3); }, 2);
      ctx.fillStyle = '#fbfffb'; ctx.font = '900 16px "Trebuchet MS", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('tt', 0, -h / 2 + h * 0.58 + 1);
    }
    ctx.fillStyle = '#5d4f88'; ctx.font = 'italic 700 22px Georgia, "Times New Roman", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(C.BDAY.envelopeTo, 0, h / 2 - 34);
    ctx.restore();
  }
  function drawPair(ctx, t, tt, duckX, ttX, y, size) {
    Chars.draw(ctx, 'duck', 'idle', t, duckX, y, size, { face: 1 });
    if (tt.anim === 'interact') Chars.draw(ctx, 'tt', 'interact', Math.min(tt.at, 7.9), ttX, y, size, { face: -1 });
    else if (tt.anim === 'cool') Chars.drawPose(ctx, 'tt_cool', { x: ttX, y, height: size, face: -1, sy: 1 + Math.sin(t * 1.1) * 0.006 });
    else Chars.draw(ctx, 'tt', 'idle', t, ttX, y, size, { face: -1 });
  }
  B.draw = function (ctx) {
    const t = this.t, ph = this.phase;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6);
    if (ph === 'room' || ph === 'memories') {
      drawRoom(ctx, t);
      if (this.lit) drawBunting(ctx, t, C.BDAY.banner);
      drawCake(ctx, 640, 470, t, this.candles);
      for (const s of this.smoke) { ctx.fillStyle = 'rgba(240,240,240,' + Math.min(0.5, s.life * 0.3) + ')'; ctx.beginPath(); ctx.arc(s.x, s.y, 6 + (2 - s.life) * 6, 0, 6.3); ctx.fill(); }
      Chars.draw(ctx, 'tt', this.tt.anim, this.tt.anim === 'idle' ? t : this.tt.at, this.tt.x, 596, SIZE, { face: -1 });
      if (this.duck.show) Chars.draw(ctx, 'duck', this.duck.anim, this.duck.anim === 'idle' ? t : this.duck.at, this.duck.x, 596, SIZE, { face: 1 });
      if (this.dark > 0) { ctx.fillStyle = 'rgba(8,12,20,' + this.dark + ')'; ctx.fillRect(0, 0, W, H); }
      if (this.wishing) { ctx.fillStyle = 'rgba(8,12,20,.35)'; ctx.fillRect(0, 0, W, H); drawCake(ctx, 640, 470, t, true); }
      if (ph === 'memories') {
        ctx.fillStyle = 'rgba(15,23,20,.72)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff4cc'; ctx.font = '800 16px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(C.BDAY.memoriesTitle + (this.mem >= 0 ? '  ·  ' + (this.mem + 1) + ' / ' + C.MEMORIES.length : ''), W / 2, 34);
        for (const p of this.pile) polaroid(ctx, C.MEMORIES[p.i], p.x, p.y, 0.52, p.rot, t, 0.9);
        if (this.mem >= 0) {
          const k = ease(this.memT / 0.5);
          polaroid(ctx, C.MEMORIES[this.mem], W / 2, 372 + (1 - k) * 60, 0.92 + k * 0.12 - 0.04, (1 - k) * 0.2 - 0.02, t, k);
        }
        if (this.memHint && this.memT > 0.9) { ctx.fillStyle = 'rgba(244,248,242,' + (0.55 + 0.35 * Math.sin(t * 4)) + ')'; ctx.font = '700 15px ui-monospace, Menlo, Consolas, monospace'; ctx.fillText(C.BDAY.memoriesHint, W / 2, H - 22); }
      }
    } else if (ph === 'rpg') {
      drawLevelBg(ctx, t);
      Chars.draw(ctx, 'tt', this.tt.anim, this.tt.anim === 'idle' ? t : this.tt.at, 310, 600, 470, { face: 1 });
    } else if (ph === 'credits') {
      starfield(ctx, t, '#0d1411', '#16231e');
      drawCredits(ctx, t, this.credY);
      if (this.endT >= 0) {
        ctx.globalAlpha = Math.min(1, this.endT / 1.5) * (this.env ? Math.max(0, 1 - (this.env.y + 200) / 400) : 1); ctx.fillStyle = '#fbfffb'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '900 84px "Trebuchet MS", system-ui'; ctx.fillText(C.BDAY.theEnd, W / 2, H / 2 - 20);
        ctx.font = '800 15px ui-monospace, Menlo, Consolas, monospace'; ctx.fillStyle = '#9fe3c3'; ctx.fillText(C.CREDIT, W / 2, H / 2 + 46);
        ctx.globalAlpha = 1;
      }
      if (this.peek > 0.01) Chars.draw(ctx, 'duck', 'idle', t, 1010, H + 200 - this.peek * 150, 260, { face: -1 });
      if (this.env) drawEnvelope(ctx, W / 2, this.env.y, this.env.open, t);
      if (this.env && this.env.open > 0.6) { ctx.fillStyle = 'rgba(255,250,240,' + (this.env.open - 0.6) * 2.4 + ')'; ctx.fillRect(0, 0, W, H); }
    } else if (ph === 'letter') {
      starfield(ctx, t); moon(ctx, 1120, 110, 44);
      Chars.draw(ctx, 'duck', 'idle', t, 92, 708, 150, { face: 1 });
      Chars.draw(ctx, 'tt', 'idle', t, 1196, 708, 150, { face: -1 });
    } else if (ph === 'night') {
      starfield(ctx, t); moon(ctx, 1040, 130, 50);
      ctx.fillStyle = '#183129'; ctx.beginPath(); ctx.moveTo(0, 590); ctx.quadraticCurveTo(640, 530, W, 590); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      drawPair(ctx, t, this.tt, 500, 790, 568, 250);
    } else { ctx.fillStyle = '#0a100e'; ctx.fillRect(0, 0, W, H); }
    drawConfetti(ctx, this.conf);
    if (this.flash > 0) { ctx.fillStyle = 'rgba(255,250,235,' + this.flash + ')'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  };
  Scenes.add('birthday', B);

  /* =====================================================================
     THE LETTER — Ada's message, verbatim.
     progressive: paragraphs appear one at a time; each needs its own
     deliberate press, and the first press only counts once the paragraph
     has had time to be read. Nothing skips the whole letter.
     ===================================================================== */
  let LET = null;
  function closeLetter() { if (LET) { LET.cleanup(); LET = null; } }
  function showLetter(scene, opts) {
    opts = opts || {};
    closeLetter();
    const L = C.BDAY, paras = C.BIRTHDAY_MESSAGE;
    return new Promise((resolve) => {
      const wrap = UI.el('div', 'letter-wrap');
      wrap.innerHTML = '<div class="letter" tabindex="0" aria-label="Letter"><div class="letter-inner"></div></div><div class="letter-nav"><span class="letter-tip"></span><button class="btn primary letter-btn" type="button"></button></div>';
      const box = wrap.querySelector('.letter'), inner = wrap.querySelector('.letter-inner'), btn = wrap.querySelector('.letter-btn'), tip = wrap.querySelector('.letter-tip');
      UI.$('#layer').appendChild(wrap);
      requestAnimationFrame(() => wrap.classList.add('in'));
      let shown = 0, readyAt = Infinity, closing = false;
      const setBtn = (label, enabled) => { btn.textContent = label; btn.disabled = !enabled; btn.classList.toggle('wait', !enabled); };
      const reveal = () => {
        const text = paras[shown];
        const p = document.createElement('p'); p.className = 'lp' + (shown === paras.length - 1 ? ' sig' : '');
        p.textContent = text;
        inner.appendChild(p); shown++;
        requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('in')));
        Audio.sfx('page');
        // read time: ~1.2 s fade + a little per word (never more than 3.5 s)
        const words = text.split(/\s+/).length, dwell = Math.min(3500, 1300 + words * 28);
        readyAt = performance.now() + dwell;
        setBtn(shown < paras.length ? L.letterNext : L.letterClose, false);
        setTimeout(() => box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }), 60);
        clearTimeout(LET && LET.timer);
        const tm = setTimeout(() => {
          if (shown < paras.length) setBtn('▾ ' + L.letterNext, true);
          else { setBtn(L.letterClose, true); tip.textContent = L.letterEnd; }
        }, shown < paras.length ? dwell : dwell + 2500);
        if (LET) LET.timer = tm;
        if (shown >= paras.length) readyAt += 2500;
      };
      const next = () => {
        if (closing || performance.now() < readyAt + 150 || btn.disabled) return;
        if (shown < paras.length) reveal();
        else { closing = true; wrap.classList.remove('in'); setTimeout(() => { closeLetter(); resolve(); }, 450); }
      };
      const key = (e) => {
        if (['Enter', 'NumpadEnter', 'Space', 'ArrowDown', 'PageDown'].includes(e.code)) {
          // arrows / page keys scroll the letter once it is all there
          if ((e.code === 'ArrowDown' || e.code === 'PageDown') && shown >= paras.length) return;
          e.preventDefault(); e.stopPropagation(); if (e.repeat) return;
          if (document.activeElement === btn && (e.code === 'Enter' || e.code === 'Space')) { next(); return; }
          next();
        } else if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); e.stopPropagation(); }
      };
      window.addEventListener('keydown', key, true);
      btn.addEventListener('click', (e) => { e.preventDefault(); next(); });
      LET = { wrap, timer: null, cleanup: () => { window.removeEventListener('keydown', key, true); clearTimeout(LET && LET.timer); wrap.remove(); } };
      if (opts.progressive) { setTimeout(() => { if (LET && LET.wrap === wrap) reveal(); }, 900); setBtn(L.letterNext, false); }
      else {
        // re-reading: the whole letter at once
        for (let i = 0; i < paras.length; i++) { const p = document.createElement('p'); p.className = 'lp in' + (i === paras.length - 1 ? ' sig' : ''); p.textContent = paras[i]; inner.appendChild(p); }
        shown = paras.length; readyAt = performance.now() + 600; setBtn(opts.closeLabel || 'Back', true); tip.textContent = '';
        setTimeout(() => box.focus({ preventScroll: true }), 50);
      }
    });
  }

  /* re-read the letter (from the archive or the title) */
  Scenes.add('letter', {
    enter(data) {
      UI.closeAll(); UI.hud.hide(); this.t = 0; this.aborted = false; Audio.music('letter');
      showLetter(this, { progressive: false, closeLabel: 'Back to the archive' }).then(() => { if (!this.aborted) Scenes.go('archive', {}); });
    },
    exit() { this.aborted = true; closeLetter(); },
    update(dt) { this.t += dt; },
    draw(ctx) {
      const t = this.t; starfield(ctx, t); moon(ctx, 1120, 110, 44);
      Chars.draw(ctx, 'duck', 'idle', t, 92, 708, 150, { face: 1 });
      Chars.draw(ctx, 'tt', 'idle', t, 1196, 708, 150, { face: -1 });
    },
  });

  /* =====================================================================
     CHARACTER ARCHIVE
     ===================================================================== */
  const AR = {};
  AR.enter = function (data) {
    data = data || {};
    UI.closeAll(); UI.hud.hide(); G.canvas.classList.remove('aim');
    Audio.music('memories');
    this.t = 0; this.tab = 'duck'; this.anim = 'idle'; this.at = 0;
    const L = C.ARCHIVE;
    const root = UI.el('div', 'archive');
    root.innerHTML = '<header class="ar-head"><h2></h2><img class="ar-rec" src="assets/ui/label_rec.png" alt=""></header>' +
      '<nav class="ar-tabs" role="tablist"></nav><section class="ar-body"></section>' +
      '<footer class="ar-foot"></footer>';
    root.querySelector('h2').textContent = L.title;
    const tabs = root.querySelector('.ar-tabs');
    for (const [id, label] of [['duck', 'Duckquackquack'], ['tt', 'Turtletimee'], ['memories', 'Memories'], ['quotes', 'Hidden quotes'], ['achv', 'Achievements']]) {
      const b = UI.el('button', 'btn ar-tab'); b.textContent = label; b.dataset.tab = id; b.setAttribute('role', 'tab');
      UI.wire(b, () => this.show(id)); tabs.appendChild(b);
    }
    const foot = root.querySelector('.ar-foot');
    const lb = UI.el('button', 'btn'); lb.textContent = 'Read the letter again'; UI.wire(lb, () => Scenes.go('letter')); foot.appendChild(lb);
    const tb = UI.el('button', 'btn'); tb.textContent = 'Back to title'; UI.wire(tb, () => Scenes.go('title')); foot.appendChild(tb);
    UI.$('#layer').appendChild(root); this.node = root;
    this.show('duck');
    setTimeout(() => { if (Scenes.current === AR) Save.unlock('archive'); }, data.first ? 1200 : 300);
    tabs.onkeydown = (e) => {
      if (e.code !== 'ArrowRight' && e.code !== 'ArrowLeft') return;
      const bs = [...tabs.querySelectorAll('button')], i = bs.indexOf(document.activeElement); if (i < 0) return;
      const n = bs[(i + (e.code === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length]; n.focus(); n.click(); e.preventDefault();
    };
  };
  AR.show = function (id) {
    this.tab = id; this.anim = 'idle'; this.at = 0;
    const root = this.node, body = root.querySelector('.ar-body');
    root.querySelectorAll('.ar-tab').forEach(b => { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    root.classList.toggle('wide', id !== 'duck' && id !== 'tt');
    body.innerHTML = ''; body.scrollTop = 0;
    if (id === 'duck' || id === 'tt') body.appendChild(this.profile(id));
    else if (id === 'memories') body.appendChild(this.memories());
    else if (id === 'quotes') body.appendChild(this.quotes());
    else body.appendChild(this.achievements());
  };
  AR.profile = function (who) {
    const P = C.ARCHIVE[who], el = UI.el('div', 'ar-profile');
    const lab = who === 'duck' ? 'label_duck_card.png' : 'label_tt_card.png', ali = who === 'duck' ? 'label_duck_alias.png' : 'label_tt_alias.png';
    el.innerHTML = '<div class="ar-labels"><img src="assets/ui/' + lab + '" alt=""><img class="ali" src="assets/ui/' + ali + '" alt=""></div><dl class="ar-dl"></dl><div class="ar-facts"></div><div class="ar-anims"><small>ANIMATIONS</small><div></div></div>';
    const dl = el.querySelector('.ar-dl');
    const rows = [['Name', P.name], ['Level', who === 'tt' ? P.levelWas + ' → ' + P.level + '  (happy birthday)' : P.level], ['Alias', P.alias], ['Also', P.also], ['Who', P.owner], ['Traits', P.traits], ['Gear', P.gear], ['Special', P.special]];
    for (const [k, v] of rows) { const dt = UI.el('dt'); dt.textContent = k; const dd = UI.el('dd'); dd.textContent = v; dl.appendChild(dt); dl.appendChild(dd); }
    const facts = el.querySelector('.ar-facts');
    for (const f of P.facts) { const s = UI.el('span'); s.textContent = f; facts.appendChild(s); }
    const an = el.querySelector('.ar-anims div');
    for (const [a, label] of P.anims) {
      const b = UI.el('button', 'chip-btn' + (a === 'idle' ? ' on' : '')); b.textContent = label;
      UI.wire(b, () => { this.anim = a; this.at = 0; an.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); if (a === 'interact') Audio.sfx(who === 'duck' ? 'shing' : 'sparkle'); });
      an.appendChild(b);
    }
    return el;
  };
  AR.memories = function () {
    const el = UI.el('div', 'ar-mem');
    for (const m of C.MEMORIES) {
      const card = UI.el('figure', 'ar-mcard');
      const cv = document.createElement('canvas'); cv.width = 400; cv.height = 260;
      drawMemory(cv.getContext('2d'), m.id, 400, 260, 0);
      const fc = UI.el('figcaption'); const b = UI.el('b'); b.textContent = m.title; const s = UI.el('span'); s.textContent = m.text; fc.appendChild(b); fc.appendChild(s);
      card.appendChild(cv); card.appendChild(fc); el.appendChild(card);
    }
    return el;
  };
  AR.quotes = function () {
    const el = UI.el('div', 'ar-quotes');
    for (const q of C.QUOTES) {
      const got = !!Save.data.quotes[q.id];
      const card = UI.el('div', 'ar-qcard' + (got ? '' : ' locked'));
      const n = UI.el('small'); n.textContent = 'QUOTE ' + q.id.slice(1) + ' OF 4';
      const tx = UI.el('p'); tx.textContent = got ? q.text : '? ? ?';
      const wh = UI.el('em'); wh.textContent = got ? '' : C.ARCHIVE.quoteWhere[q.world];
      card.appendChild(n); card.appendChild(tx); if (!got) card.appendChild(wh);
      el.appendChild(card);
    }
    return el;
  };
  AR.achievements = function () {
    const el = UI.el('div', 'ar-achv');
    const got = C.ACHIEVEMENTS.filter(a => Save.data.achievements[a.id]).length;
    const head = UI.el('p', 'ar-count'); head.textContent = got + ' / ' + C.ACHIEVEMENTS.length + ' unlocked'; el.appendChild(head);
    const list = UI.el('div', 'ar-alist');
    for (const a of C.ACHIEVEMENTS) {
      const on = !!Save.data.achievements[a.id];
      const r = UI.el('div', 'ar-arow' + (on ? ' on' : ''));
      const b = UI.el('b'); b.textContent = (on ? '★ ' : '☆ ') + a.name; const s = UI.el('span'); s.textContent = a.desc;
      r.appendChild(b); r.appendChild(s); list.appendChild(r);
    }
    el.appendChild(list);
    return el;
  };
  AR.exit = function () { if (this.node) { this.node.remove(); this.node = null; } };
  AR.update = function (dt) {
    this.t += dt; this.at += dt;
    if (Input.hit('pause') && !UI.isOpen()) Scenes.go('title');
  };
  AR.draw = function (ctx) {
    const t = this.t;
    G.greenBackdrop(ctx, t);
    if (this.tab === 'duck' || this.tab === 'tt') {
      const who = this.tab, x = 270, y = 610;
      const g = ctx.createRadialGradient(x, y - 150, 20, x, y - 150, 300); g.addColorStop(0, 'rgba(159,227,195,.28)'); g.addColorStop(1, 'rgba(159,227,195,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 560, H);
      ctx.fillStyle = 'rgba(15,23,20,.35)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 150, 18, 0, 0, 6.3); ctx.fill();
      const a = this.anim, one = Chars.ANIM_DUR[who][a];
      let at = a === 'idle' || a === 'walk' || a === 'run' || a === 'swim' ? t : this.at;
      if (one) at = this.at % (one + 1.2);
      Chars.draw(ctx, who, a, at, x, y, who === 'duck' ? 300 : 300, { face: 1 });
    }
  };
  Scenes.add('archive', AR);

  G.Finale = { showLetter, drawMemory, MEM_DRAW };
})(window.TT);
