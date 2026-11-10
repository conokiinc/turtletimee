/* =====================================================================
   core.js — canvas, main loop, input, scene manager, small utilities
   The game draws at a fixed logical size of 1280×720 and scales to fit
   the browser window (letterboxed), sharp on high-DPI screens.
   ===================================================================== */
(function (G) {
  'use strict';
  const W = 1280, H = 720;

  /* ---------------- utilities ---------------- */
  const U = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    approach: (v, target, d) => v < target ? Math.min(v + d, target) : Math.max(v - d, target),
    ease: (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
    easeOut: (p) => 1 - Math.pow(1 - p, 3),
    seg: (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a))),
    hash: (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); },
    rnd: (a, b) => a + Math.random() * (b - a),
    overlap: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
    fmtTime: (s) => { s = Math.max(0, s); const m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + String(r).padStart(2, '0'); },
    wait: (ms) => new Promise(r => setTimeout(r, ms)),
    roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    },
  };

  /* ---------------- canvas & scaling ---------------- */
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const frame = document.getElementById('frame');
  const view = { scale: 1, dpr: 1, left: 0, top: 0, cssW: W, cssH: H };

  function resize() {
    const ww = window.innerWidth, wh = window.innerHeight;
    const s = Math.min(ww / W, wh / H);
    view.scale = s; view.cssW = Math.floor(W * s); view.cssH = Math.floor(H * s);
    view.dpr = Math.min(2, window.devicePixelRatio || 1);
    view.left = Math.floor((ww - view.cssW) / 2); view.top = Math.floor((wh - view.cssH) / 2);
    frame.style.width = view.cssW + 'px'; frame.style.height = view.cssH + 'px';
    frame.style.left = view.left + 'px'; frame.style.top = view.top + 'px';
    canvas.width = Math.round(view.cssW * view.dpr); canvas.height = Math.round(view.cssH * view.dpr);
    document.documentElement.style.setProperty('--ui-scale', s);
  }
  window.addEventListener('resize', resize);
  resize();
  /* reset the canvas transform to logical 1280×720 coordinates */
  function baseTransform() { const k = view.scale * view.dpr; ctx.setTransform(k, 0, 0, k, 0, 0); }

  /* ---------------- input ---------------- */
  const BIND = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    jump: ['Space', 'ArrowUp', 'KeyW'], attack: ['KeyJ', 'KeyK'], sprint: ['ShiftLeft', 'ShiftRight'],
    special: ['Space'], pause: ['Escape', 'KeyP'], confirm: ['Enter', 'NumpadEnter', 'Space', 'KeyE'],
  };
  const GAME_KEYS = new Set(['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Backspace', 'Slash', 'Quote']);
  const Input = {
    down: new Set(), pressed: new Set(), released: new Set(),
    mouse: { x: W / 2, y: H / 2, down: false, clicked: false, inside: false },
    enabled: true,
    isDown(a) { return BIND[a].some(k => this.down.has(k)) || (a === 'attack' && this.mouse.down); },
    hit(a) { return BIND[a].some(k => this.pressed.has(k)) || (a === 'attack' && this.mouse.clicked); },
    endFrame() { this.pressed.clear(); this.released.clear(); this.mouse.clicked = false; },
    clear() { this.down.clear(); this.pressed.clear(); this.released.clear(); this.mouse.down = false; this.mouse.clicked = false; },
  };
  function typingTarget(e) {
    const t = e.target; if (!t || !t.tagName) return false;
    return t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA';
  }
  window.addEventListener('keydown', (e) => {
    if (typingTarget(e)) return;
    // stop the page from scrolling or navigating with game keys
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    // buttons: let Enter/Space activate a focused UI button, but not also the game
    const onButton = e.target && e.target.tagName === 'BUTTON';
    if (onButton && (e.code === 'Space' || e.code === 'Enter')) return;
    if (!Input.down.has(e.code)) Input.pressed.add(e.code);
    Input.down.add(e.code);
  }, { passive: false });
  window.addEventListener('keyup', (e) => { Input.down.delete(e.code); Input.released.add(e.code); });
  window.addEventListener('blur', () => { Input.clear(); if (G.Scenes && G.Scenes.onBlur) G.Scenes.onBlur(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { Input.clear(); if (G.Scenes && G.Scenes.onBlur) G.Scenes.onBlur(); } });
  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
  }
  canvas.addEventListener('mousemove', (e) => { const p = toLogical(e); Input.mouse.x = p[0]; Input.mouse.y = p[1]; Input.mouse.inside = true; });
  canvas.addEventListener('mouseleave', () => { Input.mouse.inside = false; Input.mouse.down = false; });
  canvas.addEventListener('mousedown', (e) => { if (e.button === 0) { const p = toLogical(e); Input.mouse.x = p[0]; Input.mouse.y = p[1]; Input.mouse.down = true; Input.mouse.clicked = true; } });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) Input.mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ---------------- scenes & loop ----------------
     A scene is an object with optional enter(data), exit(), update(dt),
     draw(ctx), onPause(). Only one is active at a time. */
  const Scenes = {
    current: null, name: '', paused: false, time: 0,
    registry: {},
    add(name, sc) { this.registry[name] = sc; },
    async go(name, data) {
      if (this.current && this.current.exit) this.current.exit();
      if (G.UI && G.UI.cancelSay) G.UI.cancelSay();
      this.paused = false;
      this.name = name; this.current = this.registry[name];
      if (!this.current) throw new Error('Unknown scene ' + name);
      Input.clear();
      if (this.current.enter) await this.current.enter(data || {});
    },
    onBlur() { if (this.current && this.current.onBlur) this.current.onBlur(); },
  };

  const STEP = 1 / 60;
  let acc = 0, last = performance.now();
  function frameLoop(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.25) dt = 0.25;           // tab was hidden: don't spiral
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      Scenes.time += STEP;
      if (Scenes.current && Scenes.current.update) {
        try { Scenes.current.update(STEP); } catch (err) { reportError(err); }
      }
      Input.endFrame();
      acc -= STEP; steps++;
    }
    if (steps >= 5) acc = 0;
    baseTransform();
    ctx.clearRect(0, 0, W, H);
    if (Scenes.current && Scenes.current.draw) {
      try { Scenes.current.draw(ctx); } catch (err) { reportError(err); }
    }
    requestAnimationFrame(frameLoop);
  }
  let errShown = false;
  function reportError(err) {
    console.error(err);
    if (!errShown && G.UI && G.UI.toast) { errShown = true; G.UI.toast('Something went wrong', String(err.message || err)); }
  }
  function start() { last = performance.now(); requestAnimationFrame(frameLoop); }

  G.W = W; G.H = H;
  Object.assign(G, { U, canvas, ctx, view, Input, Scenes, baseTransform, start, BIND });
})(window.TT = window.TT || {});
