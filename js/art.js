/* =====================================================================
   art.js — environment art drawn in code (pastel, pixel-inspired)
   The characters are Ada's drawings (characters.js); everything around
   them — tiles, props, collectibles — is drawn here so it never
   competes with the hand-drawn lines.
   ===================================================================== */
(function (G) {
  'use strict';
  const TS = 40;                       // tile size
  const PAL = {
    wall: '#c9eedb', wallHi: '#e2f7ec', wallLo: '#a7dcc2', grout: '#93cdb2',
    floor: '#8fc7ab', floorHi: '#b4e0c8', floorLo: '#74b093',
    deep: '#6aa88b', cream: '#fff4cc', creamLo: '#ead9a4', coral: '#f39b8a', coralLo: '#d97a6a',
    lav: '#c9b8f0', lavLo: '#a995dc', sky: '#a9d8f5', skyLo: '#7fbfe6', water: '#86c9ea', ink: '#16231e', line: '#fbfffb',
  };
  const IM = {};
  function loadImg(name, src) {
    return new Promise((res) => { const i = new Image(); i.onload = () => { IM[name] = i; res(); }; i.onerror = () => { console.warn('missing', src); res(); }; i.src = src; });
  }
  async function load() {
    await Promise.all([
      loadImg('poster', 'assets/ui/poster_cult.png'),
      loadImg('cheer', 'assets/ui/cheer_duck.png'),
      loadImg('wordmark', 'assets/ui/wordmark.png'),
    ]);
    buildTiles();
  }

  /* ---------- pre-rendered tiles ---------- */
  const TILES = {};
  function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
  function buildTiles() {
    TILES.top = mk(TS, TS, (x) => {
      x.fillStyle = PAL.floor; x.fillRect(0, 0, TS, TS);
      x.fillStyle = PAL.floorHi; x.fillRect(0, 0, TS, 8);
      x.fillStyle = PAL.line; x.fillRect(0, 0, TS, 3);
      x.fillStyle = PAL.floorLo; x.fillRect(0, TS - 3, TS, 3); x.fillRect(TS - 3, 8, 3, TS - 8);
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(6, 12, 4, 4); x.fillRect(22, 24, 4, 4);
    });
    TILES.inner = mk(TS, TS, (x) => {
      x.fillStyle = PAL.floorLo; x.fillRect(0, 0, TS, TS);
      x.fillStyle = PAL.deep; x.fillRect(0, TS - 3, TS, 3); x.fillRect(TS - 3, 0, 3, TS);
      x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(4, 4, TS - 10, 3);
    });
    TILES.wallTile = mk(TS, TS, (x) => {
      x.fillStyle = PAL.wall; x.fillRect(0, 0, TS, TS);
      x.fillStyle = PAL.wallHi; x.fillRect(2, 2, TS - 4, 5);
      x.fillStyle = PAL.grout; x.fillRect(0, TS - 2, TS, 2); x.fillRect(TS - 2, 0, 2, TS);
    });
    TILES.soap = mk(TS, TS, (x) => {
      x.fillStyle = PAL.lav; G.U.roundRect(x, 1, 2, TS - 2, TS - 4, 9); x.fill();
      x.fillStyle = 'rgba(255,255,255,.55)'; G.U.roundRect(x, 5, 6, TS - 12, 6, 3); x.fill();
      x.strokeStyle = PAL.line; x.lineWidth = 2.5; G.U.roundRect(x, 1.5, 2.5, TS - 3, TS - 5, 9); x.stroke();
      x.fillStyle = PAL.lavLo; x.fillRect(6, TS - 9, TS - 12, 3);
    });
  }

  /* ---------- background (parallax bathroom) ---------- */
  function background(ctx, camX, camY, t, levelW, theme) {
    const W = G.W, H = G.H;
    // far wall: big pale tiles
    ctx.fillStyle = '#ddf4e8'; ctx.fillRect(0, 0, W, H);
    const s = 72, ox = -((camX * 0.25) % s), oy = -((camY * 0.25) % s);
    ctx.fillStyle = '#cdebdb';
    for (let x = ox - s; x < W + s; x += s) ctx.fillRect(Math.round(x), 0, 3, H);
    for (let y = oy - s; y < H + s; y += s) ctx.fillRect(0, Math.round(y), W, 3);
    // wainscot band
    const by = 470 - camY * 0.25;
    ctx.fillStyle = '#d2eedf'; ctx.fillRect(0, by, W, H - by);
    ctx.fillStyle = 'rgba(251,255,251,.6)'; ctx.fillRect(0, by, W, 4);
    ctx.fillStyle = '#b3dcc6'; for (let x = ox * 1.0 - s; x < W + s; x += s / 2) ctx.fillRect(Math.round(x), by + 5, 2, H);
    // mid layer props (0.5 parallax)
    const px = camX * 0.5, py = camY * 0.5;
    ctx.save(); ctx.globalAlpha = 0.5;
    for (let i = 0; i < Math.ceil(levelW / 520) + 2; i++) {
      const x = i * 520 - px + 120, y = 150 - py;
      if (x < -320 || x > W + 320) continue;
      const k = i % 4;
      if (k === 0) mirror(ctx, x, y, t);
      else if (k === 1) windowSun(ctx, x, y - 20, t);
      else if (k === 2) towelHook(ctx, x, y + 40);
      else pipes(ctx, x, y - 40);
    }
    ctx.restore();
    // drifting bubbles
    for (let i = 0; i < 14; i++) {
      const bx = ((i * 211 - camX * 0.35) % (W + 100) + W + 100) % (W + 100) - 50;
      const by2 = H - ((t * (12 + (i % 5) * 5) + i * 97) % (H + 80));
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx, by2, 5 + (i % 4) * 4, 0, 6.3); ctx.stroke();
    }
  }
  function mirror(ctx, x, y, t) {
    ctx.fillStyle = '#fbfffb'; G.U.roundRect(ctx, x - 10, y - 10, 200, 150, 22); ctx.fill();
    const g = ctx.createLinearGradient(x, y, x + 180, y + 130); g.addColorStop(0, '#dff3fb'); g.addColorStop(1, '#bfe2f2');
    ctx.fillStyle = g; G.U.roundRect(ctx, x, y, 180, 130, 16); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + 30, y + 95); ctx.lineTo(x + 80, y + 30); ctx.moveTo(x + 55, y + 105); ctx.lineTo(x + 100, y + 48); ctx.stroke();
    // sink below
    ctx.fillStyle = '#fbfffb'; G.U.roundRect(ctx, x + 20, y + 175, 140, 40, 18); ctx.fill();
    ctx.fillStyle = '#e2efe8'; ctx.fillRect(x + 75, y + 210, 30, 90);
    ctx.fillStyle = '#d7e5de'; ctx.fillRect(x + 84, y + 150, 12, 28);
  }
  function windowSun(ctx, x, y, t) {
    ctx.fillStyle = '#fbfffb'; ctx.fillRect(x - 8, y - 8, 176, 156);
    const g = ctx.createLinearGradient(x, y, x, y + 140); g.addColorStop(0, '#fff6d6'); g.addColorStop(1, '#d9f1fb');
    ctx.fillStyle = g; ctx.fillRect(x, y, 160, 140);
    ctx.fillStyle = '#fbfffb'; ctx.fillRect(x + 77, y, 6, 140); ctx.fillRect(x, y + 67, 160, 6);
    ctx.fillStyle = 'rgba(255,244,204,.35)';
    ctx.beginPath(); ctx.moveTo(x, y + 140); ctx.lineTo(x + 160, y + 140); ctx.lineTo(x + 260, y + 420); ctx.lineTo(x + 40, y + 420); ctx.fill();
  }
  function towelHook(ctx, x, y) {
    ctx.fillStyle = '#e8f3ee'; ctx.fillRect(x, y, 160, 8);
    ctx.fillStyle = '#c9b8f0'; G.U.roundRect(ctx, x + 14, y + 6, 60, 120, 8); ctx.fill();
    ctx.fillStyle = '#b4a3e2'; ctx.fillRect(x + 14, y + 100, 60, 8);
    ctx.fillStyle = '#a9d8f5'; G.U.roundRect(ctx, x + 88, y + 6, 56, 96, 8); ctx.fill();
    ctx.fillStyle = '#93c8eb'; ctx.fillRect(x + 88, y + 80, 56, 7);
  }
  function pipes(ctx, x, y) {
    ctx.fillStyle = '#e7f1ec'; ctx.fillRect(x, y, 14, 380); ctx.fillRect(x, y + 60, 150, 14); ctx.fillRect(x + 136, y + 60, 14, 120);
    ctx.fillStyle = '#d3e3db'; ctx.fillRect(x + 10, y, 4, 380);
    ctx.fillStyle = '#f39b8a'; ctx.beginPath(); ctx.arc(x + 143, y + 186, 13, 0, 6.3); ctx.fill();
  }

  /* ---------- outline helper: white doodle line with soft dark edge ---------- */
  function outline(ctx, fn, w) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(20,38,33,.45)'; ctx.lineWidth = (w || 3) + 3; fn(); ctx.stroke();
    ctx.strokeStyle = PAL.line; ctx.lineWidth = w || 3; fn(); ctx.stroke();
    ctx.restore();
  }

  /* ---------- props ---------- */
  function slipper(ctx, x, y, t, scale) {     // centred at x,y
    const s = scale || 1, bob = Math.sin(t * 3) * 4;
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(s, s); ctx.rotate(Math.sin(t * 2) * 0.08);
    // glow
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 34); g.addColorStop(0, 'rgba(255,244,204,.75)'); g.addColorStop(1, 'rgba(255,244,204,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 6.3); ctx.fill();
    const sole = () => { ctx.beginPath(); ctx.ellipse(0, 6, 22, 9, 0, 0, 6.3); };
    ctx.fillStyle = PAL.cream; sole(); ctx.fill(); outline(ctx, sole, 2.5);
    const strap = () => { ctx.beginPath(); ctx.moveTo(-14, 4); ctx.quadraticCurveTo(-4, -16, 10, 3); ctx.closePath(); };
    ctx.fillStyle = PAL.coral; strap(); ctx.fill(); outline(ctx, strap, 2.5);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-6, -4, 6, 3);
    ctx.restore();
  }
  function slipperIconSVG(on) {
    return '<svg viewBox="0 0 30 22" aria-hidden="true"><ellipse cx="15" cy="15" rx="13" ry="5.5" fill="' + (on ? '#fff4cc' : 'none') + '" stroke="#fbfffb" stroke-width="2"/><path d="M6 13 Q12 1 20 13 Z" fill="' + (on ? '#f39b8a' : 'none') + '" stroke="#fbfffb" stroke-width="2" stroke-linejoin="round"/></svg>';
  }
  function corn(ctx, x, y, t, i) {
    const bob = Math.sin(t * 4 + i) * 2.5;
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(Math.sin(t * 2 + i) * 0.2);
    const k = () => { ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(8, -6, 6, 4); ctx.quadraticCurveTo(0, 9, -6, 4); ctx.quadraticCurveTo(-8, -6, 0, -9); };
    ctx.fillStyle = '#ffe07a'; k(); ctx.fill(); outline(ctx, k, 2);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(-3, -5, 3, 3);
    ctx.restore();
  }
  function bubble(ctx, b, t) {
    const r = b.r * (b.popT != null ? 1 + b.popT * 3 : 1) * (1 + Math.sin(t * 5 + b.seed) * 0.04);
    ctx.save(); ctx.globalAlpha = b.popT != null ? Math.max(0, 1 - b.popT * 4) : 1;
    ctx.translate(b.x, b.y);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(0.6, 'rgba(201,184,240,.35)'); g.addColorStop(1, 'rgba(169,216,245,.55)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.3); ctx.fill();
    outline(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.3); }, 2.5);
    if (b.popT == null) {
      const d = b.vx < 0 ? -1 : 1;
      ctx.fillStyle = PAL.ink;
      ctx.beginPath(); ctx.arc(-6 + d * 3, -2, 3, 0, 6.3); ctx.arc(6 + d * 3, -2, 3, 0, 6.3); ctx.fill();
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-10 + d * 3, -9); ctx.lineTo(-3 + d * 3, -6); ctx.moveTo(10 + d * 3, -9); ctx.lineTo(3 + d * 3, -6); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.45, r * 0.18, r * 0.1, -0.7, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }
  function curtain(ctx, c, t) {
    const { x, y, w, h } = c;
    ctx.save();
    // rod
    ctx.fillStyle = '#e9f2ee'; ctx.fillRect(x - 10, y - 8, w + 20, 7);
    ctx.fillStyle = '#c7d8d0'; ctx.fillRect(x - 10, y - 3, w + 20, 2);
    const k = c.cutT != null ? Math.min(1, c.cutT * 1.6) : 0;
    const halves = c.cutT != null ? [[-1, k], [1, k]] : [[0, 0]];
    for (const [side, kk] of halves) {
      ctx.save();
      ctx.globalAlpha = 1 - kk;
      const hx = side === 0 ? x : (side < 0 ? x : x + w / 2), hw = side === 0 ? w : w / 2;
      ctx.translate(hx + hw / 2 + side * kk * 30, kk * kk * 140);
      ctx.rotate(side * kk * 0.5);
      ctx.translate(-hw / 2, 0);
      const wave = (yy) => Math.sin(yy * 0.05 + t * 2) * 3;
      const body = () => {
        ctx.beginPath(); ctx.moveTo(0, y);
        for (let yy = 0; yy <= h; yy += 10) ctx.lineTo(wave(yy), y + yy);
        for (let xx = 0; xx <= hw; xx += hw / 6) ctx.lineTo(xx, y + h + (Math.round(xx / (hw / 6)) % 2 ? 6 : 0));
        for (let yy = h; yy >= 0; yy -= 10) ctx.lineTo(hw + wave(yy + 7), y + yy);
        ctx.closePath();
      };
      ctx.fillStyle = c.secret ? '#d7c9f5' : PAL.lav; body(); ctx.fill();
      ctx.save(); body(); ctx.clip();
      ctx.fillStyle = c.secret ? '#c4b2ee' : PAL.lavLo;
      for (let xx = 6; xx < hw; xx += 18) ctx.fillRect(xx, y, 7, h + 10);
      if (c.secret) { ctx.fillStyle = 'rgba(255,244,204,.5)'; for (let i = 0; i < 4; i++) ctx.fillRect(10 + i * 7, y + 30 + i * 22, 3, 12); }
      ctx.restore();
      outline(ctx, body, 2.5);
      ctx.restore();
    }
    // rings
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 2.5;
    for (let xx = x + 4; xx < x + w; xx += 12) { ctx.beginPath(); ctx.arc(xx, y - 4, 4, 0, 6.3); ctx.stroke(); }
    ctx.restore();
  }
  function door(ctx, d, t, count, need) {
    const { x, y, w, h } = d, o = d.openT || 0;
    ctx.save();
    // shower stall frame
    ctx.fillStyle = '#e7f1ec'; ctx.fillRect(x - 14, y - 26, w + 28, h + 26);
    ctx.fillStyle = '#c7dad2'; ctx.fillRect(x - 14, y - 26, w + 28, 8);
    // interior (visible when open): steam + tiles + soap shelf with speaker
    ctx.fillStyle = '#d6efe3'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#c3e3d3'; for (let yy = y; yy < y + h; yy += 20) ctx.fillRect(x, yy, w, 2);
    ctx.fillStyle = '#fbfffb'; ctx.fillRect(x + 12, y + 48, w - 24, 6);
    ctx.fillStyle = '#4a5d56'; G.U.roundRect(ctx, x + w / 2 - 12, y + 24, 24, 24, 5); ctx.fill();
    ctx.fillStyle = '#9fe3c3'; ctx.beginPath(); ctx.arc(x + w / 2, y + 36, 6, 0, 6.3); ctx.fill();
    // glass door sliding to the right
    const gx = x + o * (w - 10);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const g = ctx.createLinearGradient(gx, y, gx + w, y + h); g.addColorStop(0, 'rgba(214,238,250,.95)'); g.addColorStop(1, 'rgba(185,222,242,.95)');
    ctx.fillStyle = g; ctx.fillRect(gx, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 6; i++) { const sx = gx + 10 + (i * 37) % (w - 20), sy = y + 20 + ((i * 53 + t * 18) % (h - 40)); ctx.beginPath(); ctx.arc(sx, sy, 10 + (i % 3) * 5, 0, 6.3); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(gx + 16, y + h - 30); ctx.lineTo(gx + 50, y + 20); ctx.stroke();
    ctx.fillStyle = '#9ab0a7'; ctx.fillRect(gx + 8, y + h / 2 - 22, 6, 44);
    ctx.restore();
    outline(ctx, () => { ctx.beginPath(); ctx.rect(x, y, w, h); }, 3);
    // steam puffs drifting out
    for (let i = 0; i < 5; i++) {
      const p = ((t * 0.25 + i / 5) % 1);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - p)) + ')';
      ctx.beginPath(); ctx.arc(x + w * 0.2 + i * 18 + Math.sin(t + i) * 6, y - 20 - p * 70, 14 + p * 14, 0, 6.3); ctx.fill();
    }
    // slipper counter sign
    if (o < 0.05) {
      const done = count >= need;
      ctx.fillStyle = done ? PAL.coral : '#1b2823'; G.U.roundRect(ctx, x + w / 2 - 74, y - 70, 148, 36, 18); ctx.fill();
      outline(ctx, () => G.U.roundRect(ctx, x + w / 2 - 74, y - 70, 148, 36, 18), 2.5);
      ctx.fillStyle = '#fbfffb'; ctx.font = '900 18px "Trebuchet MS", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(done ? 'OPEN ME' : count + ' / ' + need + ' SLIPPERS', x + w / 2, y - 52);
    }
    ctx.restore();
  }
  function towelRack(ctx, k, t) {
    const { x, y } = k, a = k.active;
    ctx.save();
    ctx.fillStyle = '#e7f1ec'; ctx.fillRect(x + 8, y, 6, 120); ctx.fillRect(x - 30, y + 2, 84, 7);
    const sw = a ? Math.sin(t * 3) * 4 : 0;
    const towel = () => { ctx.beginPath(); ctx.moveTo(x - 26, y + 9); ctx.lineTo(x + 44, y + 9); ctx.lineTo(x + 40 + sw, y + (a ? 86 : 48)); ctx.lineTo(x - 22 + sw, y + (a ? 86 : 48)); ctx.closePath(); };
    ctx.fillStyle = a ? PAL.coral : '#cfe3d9'; towel(); ctx.fill();
    ctx.fillStyle = a ? PAL.coralLo : '#b6cfc3'; ctx.fillRect(x - 24 + sw * 0.6, y + (a ? 70 : 36), 66, 6);
    outline(ctx, towel, 2.5);
    if (a) for (let i = 0; i < 2; i++) Chars.FX.star(ctx, x + 10 + Math.cos(t * 2 + i * 3) * 46, y + 30 + Math.sin(t * 2 + i * 3) * 30, 6 + 3 * Math.sin(t * 5 + i), t);
    ctx.restore();
  }
  function bottle(ctx, s, t) {          // shampoo spring
    const x = s.ax != null ? s.ax : s.x, y = s.y, sq = s.squash || 0;
    ctx.save(); ctx.translate(x + 20, y + 40); ctx.scale(1 + sq * 0.25, 1 - sq * 0.35);
    const body = () => { ctx.beginPath(); G.U.roundRect(ctx, -18, -36, 36, 36, 9); };
    ctx.fillStyle = PAL.coral; body(); ctx.fill();
    ctx.fillStyle = PAL.cream; ctx.fillRect(-12, -26, 24, 13);
    ctx.fillStyle = PAL.coralLo; ctx.font = '900 7px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BOING', 0, -17);
    outline(ctx, body, 2.5);
    ctx.fillStyle = '#fbfffb'; ctx.fillRect(-5, -46, 10, 10); ctx.fillRect(-5, -50, 18, 5);
    ctx.restore();
  }
  function puddle(ctx, p, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(169,216,245,.75)'; ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y - 2, p.w / 2, 7, 0, 0, 6.3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
    const r = (t * 0.8) % 1;
    ctx.globalAlpha = 1 - r; ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.35, p.y - 2, 8 + r * 26, 2 + r * 4, 0, 0, 6.3); ctx.stroke();
    ctx.restore();
  }
  function water(ctx, x, y, w, h, t) {
    ctx.save();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(134,201,234,.92)'); g.addColorStop(1, 'rgba(94,170,214,.95)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x, y + h);
    for (let xx = x; xx <= x + w; xx += 10) ctx.lineTo(xx, y + 6 + Math.sin(xx * 0.05 + t * 2.5) * 4);
    ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); for (let xx = x; xx <= x + w; xx += 10) { const yy = y + 6 + Math.sin(xx * 0.05 + t * 2.5) * 4; xx === x ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); } ctx.stroke();
    // foam bubbles
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let xx = x + 15; xx < x + w; xx += 46) { ctx.beginPath(); ctx.arc(xx + Math.sin(t + xx) * 5, y + 4 + Math.sin(xx * 0.05 + t * 2.5) * 4, 6, 0, 6.3); ctx.fill(); }
    ctx.restore();
  }
  function dish(ctx, m, t) {            // moving soap dish platform
    ctx.save();
    const f = () => G.U.roundRect(ctx, m.x, m.y, m.w, 18, 9);
    ctx.fillStyle = PAL.cream; f(); ctx.fill();
    ctx.fillStyle = PAL.creamLo; ctx.fillRect(m.x + 8, m.y + 12, m.w - 16, 4);
    outline(ctx, f, 2.5);
    ctx.fillStyle = PAL.lav; G.U.roundRect(ctx, m.x + m.w / 2 - 20, m.y - 12, 40, 14, 6); ctx.fill();
    ctx.restore();
  }
  function shelf(ctx, x, y, w) {
    ctx.fillStyle = PAL.cream; ctx.fillRect(x, y, w, 10);
    ctx.fillStyle = PAL.creamLo; ctx.fillRect(x, y + 10, w, 4);
    ctx.fillStyle = '#fbfffb'; ctx.fillRect(x, y, w, 2);
  }
  function note(ctx, n, t) {
    const { x, y } = n;
    ctx.save(); ctx.translate(x + 20, y + 20); ctx.rotate(-0.08 + Math.sin(t * 1.5 + x) * 0.03);
    ctx.fillStyle = n.read ? '#f3eab9' : '#ffec8a'; ctx.fillRect(-20, -20, 40, 40);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(-20, 16, 40, 4);
    // tiny sunglasses doodle = it's from Turtletimee
    ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(-7, -2, 6, 4, 0, 0, 6.3); ctx.ellipse(7, -2, 6, 4, 0, 0, 6.3); ctx.fill();
    ctx.fillRect(-2, -3, 4, 2);
    ctx.fillStyle = PAL.ink; ctx.fillRect(-12, 9, 24, 2); ctx.fillRect(-12, 13, 16, 2);
    ctx.restore();
    if (!n.read) { Chars.FX.text(ctx, '!', x + 20, y - 18 + Math.sin(t * 5) * 3, 22, { fill: '#fff4cc' }); }
  }
  function sign(ctx, x, y, text, post) {
    ctx.save();
    ctx.font = '800 17px "Trebuchet MS", system-ui, sans-serif';
    const w = Math.ceil(ctx.measureText(text).width) + 30;
    if (post) { ctx.fillStyle = '#e7f1ec'; ctx.fillRect(x + w / 2 - 3, y + 34, 6, post); ctx.fillStyle = '#c7dad2'; ctx.fillRect(x + w / 2 + 1, y + 34, 2, post); }
    ctx.fillStyle = '#1b2823'; G.U.roundRect(ctx, x, y, w, 36, 12); ctx.fill();
    outline(ctx, () => G.U.roundRect(ctx, x, y, w, 36, 12), 2.5);
    ctx.fillStyle = '#fbfffb'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 15, y + 19);
    ctx.restore();
  }
  function poster(ctx, x, y, w) {
    const im = IM.poster; if (!im) return;
    const h = w * im.height / im.width;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.04);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(6, 8, w, h);
    ctx.drawImage(im, 0, 0, w, h);
    ctx.fillStyle = '#f39b8a'; ctx.beginPath(); ctx.arc(w / 2, 8, 6, 0, 6.3); ctx.fill();
    ctx.restore();
  }
  function cheerDuck(ctx, x, y, w, t) {
    const im = IM.cheer; if (!im) return;
    const h = w * im.height / im.width;
    ctx.save(); ctx.translate(x, y + Math.abs(Math.sin(t * 6)) * -4);
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = 'rgba(20,38,33,.6)'; ctx.shadowBlur = 3;
    ctx.drawImage(im, 0, 0, w, h); ctx.restore();
  }
  function quoteCard(ctx, q, t) {
    const bob = Math.sin(t * 2.5) * 5;
    ctx.save(); ctx.translate(q.x + 20, q.y + 20 + bob); ctx.rotate(Math.sin(t * 1.5) * 0.08);
    const g = ctx.createRadialGradient(0, 0, 6, 0, 0, 46); g.addColorStop(0, 'rgba(255,244,204,.9)'); g.addColorStop(1, 'rgba(255,244,204,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 46, 0, 6.3); ctx.fill();
    const c = () => G.U.roundRect(ctx, -18, -24, 36, 48, 6);
    ctx.fillStyle = PAL.cream; c(); ctx.fill(); outline(ctx, c, 2.5);
    ctx.fillStyle = PAL.coral; ctx.font = '900 30px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('“', 0, 4);
    ctx.restore();
  }
  function knifeStuck(ctx, k) {
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, k.life));
    Chars.drawKnife(ctx, k.x, k.y, k.ang, 46, true);
    ctx.restore();
  }

  G.Art = { TS, PAL, TILES, IM, load, background, outline, slipper, slipperIconSVG, corn, bubble, curtain, door, towelRack,
    bottle, puddle, water, dish, shelf, note, sign, poster, cheerDuck, quoteCard, knifeStuck };
})(window.TT);
