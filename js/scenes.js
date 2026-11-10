/* =====================================================================
   scenes.js — gate (click to start), title, opening story, chapters and
   the links between worlds. World scenes live in world1.js etc.; the
   final encounter, birthday and archive live in finale.js.
   ===================================================================== */
(function (G) {
  'use strict';
  const { UI, Save, Audio, Scenes, Input, U, Content: C } = G;

  /* ---------- shared: a calm pastel backdrop with drifting bubbles ---------- */
  function greenBackdrop(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, '#2f6e57'); g.addColorStop(1, '#173a30');
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
    ctx.fillStyle = 'rgba(159,227,195,.08)';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc((i * 263 + t * 8) % (G.W + 300) - 150, 120 + (i * 97) % 500, 90 + (i % 3) * 50, 0, 6.3); ctx.fill(); }
    for (let i = 0; i < 18; i++) {
      const x = (i * 173) % G.W, y = G.H - ((t * (14 + (i % 4) * 6) + i * 61) % (G.H + 60));
      ctx.strokeStyle = 'rgba(200,240,220,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + Math.sin(t + i) * 8, y, 4 + (i % 4) * 3, 0, 6.3); ctx.stroke();
    }
  }

  /* ================= GATE ================= */
  Scenes.add('gate', {
    enter() {
      const g = UI.el('div', 'gate', '<small>' + UI.esc(C.CREDIT) + '</small><div class="press">Click anywhere or press any key to start</div><p class="fine">Best played on a laptop or desktop with sound on. Your progress saves automatically in this browser.</p>');
      G.UI.$('#layer').appendChild(g);
      this.node = g;
      const go = (e) => {
        if (e && e.type === 'keydown' && ['Tab', 'MetaLeft', 'MetaRight', 'AltLeft', 'AltRight', 'ControlLeft', 'ControlRight'].includes(e.code)) return;
        window.removeEventListener('keydown', go, true); g.removeEventListener('pointerdown', go);
        Audio.unlock(); Audio.sfx('confirm');
        Scenes.go('title');
      };
      window.addEventListener('keydown', go, true); g.addEventListener('pointerdown', go);
      this.off = () => { window.removeEventListener('keydown', go, true); g.removeEventListener('pointerdown', go); };
    },
    exit() { if (this.off) this.off(); if (this.node) this.node.remove(); },
    draw(ctx) { greenBackdrop(ctx, Scenes.time); },
  });

  /* ================= TITLE ================= */
  Scenes.add('title', {
    enter() {
      UI.closeAll(); UI.hud.hide();
      Audio.music('title');
      const s = UI.el('div', 'title-screen');
      s.innerHTML = '<div class="logo"><span class="credit">' + UI.esc(C.CREDIT) + '</span><h1>' + UI.esc(C.TITLE) + '</h1><h2>' + UI.esc(C.SUBTITLE) + '</h2></div><div class="menu-wrap"></div><div class="foot">A birthday adventure for Qiqi · it\'s turtletimee.</div>';
      UI.$('#layer').appendChild(s);
      this.node = s;
      this.buildMenu();
      this.t = 0;
    },
    buildMenu() {
      const wrap = this.node.querySelector('.menu-wrap'); wrap.innerHTML = '';
      const has = Save.hasProgress();
      const items = [];
      if (has) items.push({ label: 'Continue', primary: true, action: () => continueGame() });
      items.push({ label: has ? 'New game' : 'Start game', primary: !has, action: () => newGame() });
      items.push({ label: 'Chapters', action: () => chapters() });
      if (Save.data.worlds.bday.seen) items.push({ label: 'Character archive', action: () => Scenes.go('archive') });
      items.push({ label: 'How to play', action: () => UI.howto() });
      items.push({ label: 'Settings', action: () => UI.settings(() => this.buildMenu()) });
      items.forEach((it) => { const b = UI.el('button', 'btn' + (it.primary ? ' primary' : ''), UI.esc(it.label)); UI.wire(b, it.action); wrap.appendChild(b); });
      setTimeout(() => { const f = wrap.querySelector('button'); f && f.focus({ preventScroll: true }); }, 50);
      // arrow-key navigation for the title list
      wrap.onkeydown = (e) => {
        if (e.code !== 'ArrowDown' && e.code !== 'ArrowUp') return;
        const bs = [...wrap.querySelectorAll('button')], i = bs.indexOf(document.activeElement);
        bs[(i + (e.code === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus(); e.preventDefault();
      };
    },
    exit() { if (this.node) this.node.remove(); },
    update(dt) { this.t += dt; },
    draw(ctx) {
      const t = this.t || 0;
      greenBackdrop(ctx, t);
      // floor
      ctx.fillStyle = 'rgba(159,227,195,.18)'; ctx.fillRect(0, 610, G.W, 110);
      ctx.fillStyle = 'rgba(244,248,242,.5)'; ctx.fillRect(0, 610, G.W, 3);
      // Duck looking around for her…
      Chars.draw(ctx, 'duck', 'idle', t, 860, 612, 330, { face: 1 });
      // …and the sunglasses she left behind
      const gl = Chars.IMG.tt_cool_glasses;
      if (gl) {
        ctx.save(); ctx.translate(1110, 596); ctx.rotate(-0.25); const sc = 0.5;
        ctx.scale(sc, sc); ctx.drawImage(gl.halo, -150, -150); ctx.restore();
        const p = (t % 2.6) / 2.6;
        if (p < 0.3) Chars.FX.star(ctx, 1090, 560, 14 * Math.sin(p / 0.3 * Math.PI), t);
        Chars.FX.text(ctx, '?', 1112, 520 + Math.sin(t * 2) * 6, 46, { fill: '#fff4cc' });
      }
      // the wordmark, top right
      const wm = G.Art.IM.wordmark;
      if (wm) { ctx.save(); ctx.globalAlpha = 0.85; ctx.drawImage(wm, G.W - 330, 40, 280, 280 * wm.height / wm.width); ctx.restore(); }
    },
  });

  /* ---------- game flow helpers ---------- */
  function continueGame() {
    const p = Save.data.progress;
    if (p.stage === 'new' || !p.storySeen) return Scenes.go('story');
    if (p.stage === 'world1') return Scenes.go('world1', { resume: true });
    if (p.stage === 'world2') return Scenes.go('world2', { resume: true });
    if (p.stage === 'world3') return Scenes.go('world3', {});
    if (p.stage === 'final') return Scenes.go('final', {});
    if (p.stage === 'birthday') return Scenes.go('birthday', {});
    return Scenes.go('archive');
  }
  async function newGame() {
    if (Save.hasProgress()) {
      const ok = await UI.confirm('Start a new game?', 'Your story progress and world collectibles restart. Achievements, found quotes and the character archive are kept.', 'Start over', 'Cancel');
      if (!ok) return;
      const keep = { achievements: Save.data.achievements, quotes: Save.data.quotes, stats: Save.data.stats, settings: Save.data.settings };
      const bday = Save.data.worlds.bday;      // the archive stays unlocked once reached
      Save.resetProgress(); Object.assign(Save.data, keep); Save.data.worlds.bday = bday; Save.write();
    }
    Scenes.go('story');
  }
  function chapters() {
    const p = Save.data.progress, w = Save.data.worlds;
    // chapters unlock in story order, as each one is reached
    const lock = (open, label) => open ? label : label + '  (locked)';
    UI.menu({
      title: 'Chapters', sub: 'Replay anything you have reached. Replaying a world starts it fresh. New chapters unlock as the story goes on.',
      items: [
        { label: 'Opening story', action: (m) => { m.close(); Scenes.go('story', { replay: true }); } },
        { label: lock(p.storySeen, 'World 1 — The Slipper Heist'), disabled: !p.storySeen, action: (m) => { m.close(); Scenes.go('world1', { fresh: true }); } },
        { label: lock(w.w1.done, 'World 2 — The Great Swim'), disabled: !w.w1.done, action: (m) => { m.close(); Scenes.go('world2', { fresh: true }); } },
        { label: lock(w.w2.done, 'World 3 — Ink or Sink'), disabled: !w.w2.done, action: (m) => { m.close(); Scenes.go('world3', {}); } },
        { label: lock(w.w3.done, 'Finale — The Final Encounter'), disabled: !w.w3.done, action: (m) => { m.close(); Scenes.go('final', { replay: true }); } },
        { label: lock(w.fin.done, 'The Birthday'), disabled: !w.fin.done, action: (m) => { m.close(); Scenes.go('birthday', { replay: true }); } },
        { label: 'Back', action: (m) => m.close() },
      ],
      onBack: () => UI.stack[UI.stack.length - 1].close(),
    });
  }
  G.Flow = { continueGame, newGame, chapters };

  /* ================= OPENING STORY ================= */
  Scenes.add('story', {
    async enter(data) {
      UI.closeAll(); UI.hud.hide();
      Audio.music('story');
      this.t = 0; this.duck = { x: -120, anim: 'walk', face: 1, at: 0 }; this.paused = false; this.done = false;
      this.run(data);
    },
    async run(data) {
      const L = C.OPENING, d = this.duck;
      await UI.fade(false, 600);
      await this.walkTo(520);
      d.anim = 'idle';
      if (this.aborted) return;
      await UI.say(L.slice(0, 3)); if (this.aborted) return;
      d.anim = 'run'; d.face = -1;                    // panicked looking about
      await UI.say(L.slice(3, 5)); if (this.aborted) return;
      d.anim = 'idle'; d.face = 1;
      await UI.say(L.slice(5, 6)); if (this.aborted) return;
      d.anim = 'interact'; d.at = 0; Audio.sfx('shing');
      await UI.say(L.slice(6, 8)); if (this.aborted) return;
      d.anim = 'walk';
      await UI.say(L.slice(8)); if (this.aborted) return;
      Save.data.progress.storySeen = true;
      if (Save.data.progress.stage === 'new') Save.data.progress.stage = 'world1';
      Save.write();
      await this.walkTo(1500);
      await UI.fade(true, 500);
      if (!this.aborted) Scenes.go('world1', { fresh: true });
    },
    walkTo(x) {
      return new Promise((res) => { this.duck.target = x; this.duck.anim = 'walk'; this.duck.face = x > this.duck.x ? 1 : -1; this.onArrive = res; });
    },
    exit() { this.aborted = true; },
    onBlur() { if (!this.paused && !UI.isOpen()) this.pause(); },
    pause() {
      this.paused = true; Audio.sfx('pause');
      UI.menu({ title: 'Paused', items: [
        { label: 'Resume', primary: true, action: (m) => { m.close(); this.paused = false; } },
        { label: 'Skip the story', action: (m) => { m.close(); this.skip(); } },
        { label: 'Settings', action: () => UI.settings() },
        { label: 'Quit to title', action: (m) => { m.close(); Scenes.go('title'); } },
      ], onBack: () => { UI.stack[UI.stack.length - 1].close(); this.paused = false; } });
    },
    skip() {
      this.aborted = true;
      Save.data.progress.storySeen = true; if (Save.data.progress.stage === 'new') Save.data.progress.stage = 'world1'; Save.write();
      Scenes.go('world1', { fresh: true });
    },
    update(dt) {
      if (Input.hit('pause') && !UI.isOpen()) { this.pause(); return; }
      if (this.paused) return;
      this.t += dt; const d = this.duck; d.at += dt;
      if (d.target != null) {
        const dir = Math.sign(d.target - d.x); d.x += dir * 260 * dt;
        if ((dir > 0 && d.x >= d.target) || (dir < 0 && d.x <= d.target) || dir === 0) { d.x = d.target; d.target = null; const r = this.onArrive; this.onArrive = null; r && r(); }
      }
    },
    draw(ctx) {
      const t = this.t;
      // a cosy, pastel living room
      ctx.fillStyle = '#d3f0e1'; ctx.fillRect(0, 0, G.W, G.H);
      ctx.fillStyle = '#c3e8d5'; for (let x = 0; x < G.W; x += 64) ctx.fillRect(x, 0, 28, 470);
      ctx.fillStyle = '#9fd3b9'; ctx.fillRect(0, 470, G.W, 250);
      ctx.fillStyle = '#fbfffb'; ctx.fillRect(0, 466, G.W, 6);
      // window
      ctx.fillStyle = '#fbfffb'; ctx.fillRect(140, 70, 250, 200);
      const g = ctx.createLinearGradient(0, 80, 0, 260); g.addColorStop(0, '#fff2cf'); g.addColorStop(1, '#bfe4f5'); ctx.fillStyle = g; ctx.fillRect(152, 82, 226, 176);
      ctx.fillStyle = '#fbfffb'; ctx.fillRect(262, 82, 6, 176); ctx.fillRect(152, 166, 226, 6);
      // couch (Turtletimee's empty spot)
      ctx.fillStyle = '#c9b8f0'; U.roundRect(ctx, 760, 310, 400, 120, 30); ctx.fill();
      ctx.fillStyle = '#b4a3e2'; U.roundRect(ctx, 740, 360, 440, 110, 28); ctx.fill();
      ctx.fillStyle = '#a995dc'; ctx.fillRect(780, 466, 20, 26); ctx.fillRect(1120, 466, 20, 26);
      ctx.fillStyle = '#d8ccf6'; ctx.beginPath(); ctx.ellipse(960, 366, 80, 18, 0, 0, 6.3); ctx.fill();   // the dent where she sits
      Chars.FX.text(ctx, '?', 960, 300 + Math.sin(t * 2) * 6, 54, { fill: '#fff4cc' });
      // a mug
      ctx.fillStyle = '#fbfffb'; ctx.fillRect(600, 420, 34, 40); ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(636, 438, 10, -1.4, 1.4); ctx.stroke();
      ctx.fillStyle = '#9fe3c3'; ctx.fillRect(608, 432, 18, 4);
      const d = this.duck;
      Chars.draw(ctx, 'duck', d.anim, d.anim === 'walk' || d.anim === 'run' || d.anim === 'idle' ? t : d.at, d.x, 480, 270, { face: d.face });
    },
  });

  /* ================= World 1 → World 2 =================
     World 1's approved ending calls Scenes.go('milestone'); it now leads
     straight into World 2, so the adventure is continuous. */
  Scenes.add('milestone', {
    enter() { Scenes.go('world2', { fresh: true }); },
  });

  /* ================= World 2 → World 3 =================
     World 2's approved ending calls Scenes.go('w2end'); it now leads
     straight into World 3. */
  Scenes.add('w2end', {
    enter() { Scenes.go('world3', {}); },
  });

  /* ================= World 3 → the final encounter =================
     World 3's approved ending calls Scenes.go('w3end'); it now leads
     straight to Turtletimee's front door. */
  Scenes.add('w3end', {
    enter() { Scenes.go('final', {}); },
  });

  G.greenBackdrop = greenBackdrop;
})(window.TT);
