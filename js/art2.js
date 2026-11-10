/* =====================================================================
   art2.js — World 2 (the pool) environment art, drawn in code.
   A separate module so World 1's bathroom art is untouched.
   Pastel, pixel-inspired, with the same white doodle outline as World 1.
   ===================================================================== */
(function (G) {
  'use strict';
  const TS = 40;
  const P = {
    sky1: '#fff1d6', sky2: '#bfe8f7', sun: '#fff4cc', mtn1: '#c9b8f0', mtn2: '#a9c9e8', mtn3: '#9fd3b9',
    w1: '#aee3f2', w2: '#6fc0de', w3: '#3f8fb8', deep: '#2f6f99',
    tile: '#e8f7fb', tileHi: '#ffffff', grout: '#b6dce9', tileLo: '#cdebf3',
    coral: '#f39b8a', coralLo: '#d97a6a', cream: '#fff4cc', creamLo: '#ead9a4', lav: '#c9b8f0', lavLo: '#a995dc',
    mint: '#9fe3c3', mintLo: '#74c4a0', sky: '#a9d8f5', ink: '#16231e', line: '#fbfffb', gold: '#ffd76a',
  };
  const IM = {};
  const TILES = {};
  const out = (ctx, fn, w) => G.Art.outline(ctx, fn, w);
  const rr = (ctx, x, y, w, h, r) => G.U.roundRect(ctx, x, y, w, h, r);

  function load() {
    return new Promise((res) => {
      const i = new Image(); i.onload = () => { IM.mural = i; res(); }; i.onerror = () => res(); i.src = 'assets/ui/mural_bus.png';
    }).then(build);
  }
  function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
  function build() {
    // pool wall tiles (white-aqua with grout, like real pool tiles)
    TILES.top = mk(TS, TS, (x) => {
      x.fillStyle = P.tile; x.fillRect(0, 0, TS, TS);
      x.fillStyle = P.grout; x.fillRect(0, 19, TS, 2); x.fillRect(19, 0, 2, TS);
      x.fillStyle = P.tileHi; x.fillRect(0, 0, TS, 4);
      x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(3, 6, 6, 3); x.fillRect(23, 26, 6, 3);
    });
    TILES.inner = mk(TS, TS, (x) => {
      x.fillStyle = P.tileLo; x.fillRect(0, 0, TS, TS);
      x.fillStyle = P.grout; x.fillRect(0, 19, TS, 2); x.fillRect(19, 0, 2, TS); x.fillRect(0, 38, TS, 2); x.fillRect(38, 0, 2, TS);
    });
    TILES.dark = mk(TS, TS, (x) => {   // the deep end's darker tiles
      x.fillStyle = '#a9d3e3'; x.fillRect(0, 0, TS, TS);
      x.fillStyle = '#8fbfd2'; x.fillRect(0, 19, TS, 2); x.fillRect(19, 0, 2, TS);
    });
  }

  /* ---------------- backgrounds ---------------- */
  function sky(ctx, camX, surfY, t) {
    const W = G.W;
    if (surfY <= 0) return;
    const g = ctx.createLinearGradient(0, 0, 0, Math.max(1, surfY)); g.addColorStop(0, P.sky2); g.addColorStop(1, P.sky1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, surfY);
    // hot sun (from the storyboard: "mountain BG w/ hot sun")
    const sx = 980 - camX * 0.04, sy = surfY - 230;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.15);
    ctx.strokeStyle = 'rgba(255,214,120,.9)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 62, Math.sin(a) * 62); ctx.lineTo(Math.cos(a) * (78 + (i % 2) * 10), Math.sin(a) * (78 + (i % 2) * 10)); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = P.sun; ctx.beginPath(); ctx.arc(sx, sy, 52, 0, 6.3); ctx.fill();
    out(ctx, () => { ctx.beginPath(); ctx.arc(sx, sy, 52, 0, 6.3); }, 3);
    // three layers of pastel mountains
    const layer = (par, base, amp, col, seed) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, surfY);
      for (let x = 0; x <= W + 40; x += 40) {
        const wx = x + camX * par;
        const y = base - Math.abs(Math.sin(wx * 0.0021 + seed)) * amp - Math.sin(wx * 0.007 + seed * 2) * amp * 0.25;
        ctx.lineTo(x, surfY - y);
      }
      ctx.lineTo(W, surfY); ctx.closePath(); ctx.fill();
    };
    layer(0.08, 150, 120, P.mtn1, 1); layer(0.15, 100, 90, P.mtn2, 2.3); layer(0.25, 46, 40, P.mtn3, 4.1);
    // backstroke flags strung across the pool
    const fy = surfY - 120;
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(W, fy); ctx.stroke();
    const cols = [P.coral, P.cream, P.sky, P.lav, P.mint];
    for (let x = -((camX * 0.9) % 36); x < W; x += 36) {
      const i = Math.floor((x + camX * 0.9) / 36);
      ctx.fillStyle = cols[((i % 5) + 5) % 5];
      ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x + 24, fy); ctx.lineTo(x + 12, fy + 22 + Math.sin(t * 3 + i) * 2); ctx.closePath(); ctx.fill();
    }
  }
  /* underwater backdrop. deep: 0 (shallow) … 1 (deep end) */
  function water(ctx, camX, camY, surfScreenY, t, deep) {
    const W = G.W, H = G.H, top = Math.max(0, surfScreenY);
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, mix(P.w1, '#8fd0e6', deep)); g.addColorStop(0.55, mix(P.w2, P.w3, deep)); g.addColorStop(1, mix(P.w3, P.deep, deep));
    ctx.fillStyle = g; ctx.fillRect(0, top, W, H - top);
    // far wall tiles (parallax)
    const s = 64, ox = -((camX * 0.5) % s), oy = -((camY * 0.5) % s);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.1 - deep * 0.05) + ')';
    for (let x = ox; x < W; x += s) ctx.fillRect(Math.round(x), top, 2, H - top);
    for (let y = oy + top; y < H; y += s) ctx.fillRect(0, Math.round(y), W, 2);
    // lane "T" markings on the far wall
    ctx.fillStyle = 'rgba(30,70,110,' + (0.25 + deep * 0.15) + ')';
    for (let x = -((camX * 0.5) % 520) - 520; x < W + 520; x += 520) { ctx.fillRect(x + 240, top + 60, 28, H); ctx.fillRect(x + 200, H - 80 - camY * 0.0, 108, 20); }
    // light rays from the surface
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const x = ((i * 260 - camX * 0.3 + Math.sin(t * 0.4 + i) * 40) % (W + 400) + W + 400) % (W + 400) - 200;
      const gr = ctx.createLinearGradient(0, top, 0, top + 520);
      gr.addColorStop(0, 'rgba(255,250,220,' + (0.16 - deep * 0.08) + ')'); gr.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 70, top); ctx.lineTo(x + 190, top + 520); ctx.lineTo(x + 90, top + 520); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  /* animated caustic light net (drawn in world space near the surface and on the pool floor) */
  function caustics(ctx, x0, x1, y, depth, t, a) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.lineWidth = 2;
    for (let row = 0; row < 3; row++) {
      ctx.beginPath();
      for (let x = Math.floor(x0 / 30) * 30; x <= x1; x += 30) {
        const yy = y + row * depth / 3 + Math.sin(x * 0.04 + t * 1.6 + row) * 9 + Math.sin(x * 0.013 - t + row * 2) * 6;
        x === Math.floor(x0 / 30) * 30 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  function mix(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(((pa >> 16) & 255) * (1 - k) + ((pb >> 16) & 255) * k);
    const g = Math.round(((pa >> 8) & 255) * (1 - k) + ((pb >> 8) & 255) * k);
    const bl = Math.round((pa & 255) * (1 - k) + (pb & 255) * k);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }
  function surface(ctx, x0, x1, y, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.moveTo(x0, y - 4);
    for (let x = x0; x <= x1; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.03 + t * 2.4) * 4);
    ctx.lineTo(x1, y + 14); ctx.lineTo(x0, y + 14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 3;
    ctx.beginPath(); for (let x = x0; x <= x1; x += 16) { const yy = y + Math.sin(x * 0.03 + t * 2.4) * 4; x === x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke();
    ctx.restore();
  }

  /* ---------------- deck & poolside props ---------------- */
  function deck(ctx, x, w, surfY) {
    ctx.fillStyle = '#f2ead8'; ctx.fillRect(x, surfY - 22, w, 22);
    ctx.fillStyle = '#e2d6bb'; for (let i = x; i < x + w; i += 40) ctx.fillRect(i, surfY - 22, 2, 22);
    ctx.fillStyle = '#fbfffb'; ctx.fillRect(x, surfY - 24, w, 3);
  }
  function startBlock(ctx, x, surfY, num) {
    ctx.fillStyle = '#e7f1ec'; ctx.fillRect(x - 4, surfY - 70, 8, 48);
    const top = () => rr(ctx, x - 34, surfY - 86, 68, 20, 6);
    ctx.fillStyle = P.mint; top(); ctx.fill(); out(ctx, top, 2.5);
    ctx.fillStyle = P.ink; ctx.font = '900 14px "Trebuchet MS", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(num, x, surfY - 76);
  }
  function lifeguard(ctx, x, surfY) {
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 30, surfY - 22); ctx.lineTo(x - 10, surfY - 190); ctx.moveTo(x + 30, surfY - 22); ctx.lineTo(x + 10, surfY - 190);
    for (let i = 1; i < 5; i++) { const y = surfY - 22 - i * 34; ctx.moveTo(x - 30 + i * 4.5, y); ctx.lineTo(x + 30 - i * 4.5, y); } ctx.stroke();
    ctx.fillStyle = P.coral; rr(ctx, x - 26, surfY - 210, 52, 20, 6); ctx.fill();
    ctx.fillStyle = P.coral; ctx.beginPath(); ctx.moveTo(x - 40, surfY - 250); ctx.quadraticCurveTo(x, surfY - 290, x + 40, surfY - 250); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, surfY - 270); ctx.lineTo(x, surfY - 210); ctx.stroke();
    sign(ctx, x - 92, surfY - 330, 'LIFEGUARD ON DUTY: nobody');
  }
  function sign(ctx, x, y, text, col) {
    ctx.save(); ctx.font = '800 15px "Trebuchet MS", system-ui, sans-serif';
    const w = Math.ceil(ctx.measureText(text).width) + 24;
    ctx.fillStyle = col || '#1b2823'; rr(ctx, x, y, w, 30, 10); ctx.fill(); out(ctx, () => rr(ctx, x, y, w, 30, 10), 2.5);
    ctx.fillStyle = '#fbfffb'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 12, y + 16);
    ctx.restore();
  }
  function vending(ctx, x, y, t, lit) {    // y = base
    const body = () => rr(ctx, x, y - 170, 100, 170, 8);
    ctx.fillStyle = P.lav; body(); ctx.fill(); out(ctx, body, 3);
    ctx.fillStyle = lit ? '#fff4cc' : '#e9e3f8'; rr(ctx, x + 10, y - 158, 58, 92, 4); ctx.fill();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { ctx.fillStyle = [P.coral, P.mint, P.sky][(r + c) % 3]; ctx.fillRect(x + 16 + c * 18, y - 150 + r * 28, 12, 18); }
    ctx.fillStyle = '#1b2823'; ctx.fillRect(x + 74, y - 150, 18, 40);
    ctx.fillStyle = lit && Math.floor(t * 4) % 2 ? P.gold : '#fbfffb'; ctx.fillRect(x + 78, y - 144, 10, 6);
    ctx.fillStyle = '#1b2823'; rr(ctx, x + 14, y - 52, 72, 26, 4); ctx.fill();
    ctx.fillStyle = '#fbfffb'; ctx.font = '900 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText('5 TOKENS', x + 50, y - 36);
  }
  function floatie(ctx, x, y, t, sc) {
    sc = sc || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    const f = () => { ctx.beginPath(); ctx.ellipse(0, 0, 120, 26, 0, 0, 6.3); };
    ctx.fillStyle = P.lav; f(); ctx.fill();
    ctx.fillStyle = P.lavLo; ctx.beginPath(); ctx.ellipse(0, 6, 100, 12, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#fbfffb'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(i * 44, -2, 8, 18, 0, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-50, -12, 30, 5, -0.1, 0, 6.3); ctx.fill();
    out(ctx, f, 3);
    ctx.restore();
  }

  /* ---------------- underwater obstacles & pickups ---------------- */
  function rope(ctx, r) {
    ctx.save();
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r.x0, r.y + 8); ctx.lineTo(r.x1, r.y + 8); ctx.stroke();
    const cols = [P.coral, P.cream, P.sky, P.cream];
    for (let x = r.x0 + 8, i = 0; x < r.x1; x += 22, i++) {
      ctx.fillStyle = cols[i % 4]; rr(ctx, x - 9, r.y, 18, 16, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x - 9, r.y + 11, 18, 5);
    }
    out(ctx, () => rr(ctx, r.x0, r.y, r.x1 - r.x0, 16, 8), 2);
    ctx.restore();
  }
  function noodle(ctx, n) {
    ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(n.ang || 0);
    const body = () => rr(ctx, -n.len / 2, -13, n.len, 26, 13);
    ctx.fillStyle = n.col || P.coral; body(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.1)'; for (let x = -n.len / 2 + 14; x < n.len / 2 - 6; x += 18) ctx.fillRect(x, -13, 3, 26);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(ctx, -n.len / 2 + 8, -9, n.len - 16, 5, 3); ctx.fill();
    out(ctx, body, 2.5);
    ctx.restore();
  }
  function donut(ctx, d, t) {
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(Math.sin(t * 0.8 + d.seed) * 0.3);
    const r = d.r * (1 + (d.squish || 0) * 0.12);
    ctx.fillStyle = d.col || P.coral; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.3); ctx.arc(0, 0, r * 0.45, 0, 6.3, true); ctx.fill('evenodd');
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = r * 0.16;
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.3; ctx.beginPath(); ctx.arc(0, 0, r * 0.73, a, a + 0.35); ctx.stroke(); }
    out(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.3); }, 2.5);
    out(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, 6.3); }, 2);
    ctx.restore();
  }
  function kickboard(ctx, k, t) {
    ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.ang || 0);
    const b = () => { ctx.beginPath(); ctx.moveTo(-40, -16); ctx.lineTo(28, -16); ctx.quadraticCurveTo(46, 0, 28, 16); ctx.lineTo(-40, 16); ctx.closePath(); };
    ctx.fillStyle = k.col || P.mint; b(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.14)'; rr(ctx, 6, -9, 14, 6, 3); ctx.fill(); rr(ctx, 6, 3, 14, 6, 3); ctx.fill();
    out(ctx, b, 2.5);
    ctx.restore();
  }
  function cleaner(ctx, c, t) {      // pool-cleaning robot that patrols the floor
    ctx.save(); ctx.translate(c.x, c.y);
    const d = c.vx < 0 ? -1 : 1; ctx.scale(d, 1);
    const b = () => rr(ctx, -34, -26, 68, 34, 10);
    ctx.fillStyle = P.lav; b(); ctx.fill();
    ctx.fillStyle = P.cream; rr(ctx, -22, -20, 44, 12, 5); ctx.fill();
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(-8, -14, 3, 0, 6.3); ctx.arc(10, -14, 3, 0, 6.3); ctx.fill();
    out(ctx, b, 2.5);
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 2;
    for (const wx of [-20, 20]) { ctx.save(); ctx.translate(wx, 10); ctx.rotate(t * 10); for (let i = 0; i < 6; i++) { ctx.rotate(1.05); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, 0); ctx.stroke(); } ctx.restore(); }
    ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-36 - i * 8, 6 - ((t * 40 + i * 10) % 30), 3, 0, 6.3); ctx.fill(); }
    ctx.restore();
  }
  function jet(ctx, j, t) {          // wall nozzle + pulsing stream
    ctx.save();
    const dir = j.dir;     // [dx, dy]
    if (j.on > 0) {
      ctx.globalAlpha = Math.min(1, j.on * 3);
      for (let i = 0; i < 14; i++) {
        const p = ((t * 2.4 + i / 14) % 1);
        const x = j.x + dir[0] * p * j.len + (dir[1] ? Math.sin(i * 3.1 + t * 8) * 12 : 0);
        const y = j.y + dir[1] * p * j.len + (dir[0] ? Math.sin(i * 3.1 + t * 8) * 12 : 0);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.8 - p * 0.6) + ')';
        ctx.beginPath(); ctx.arc(x, y, 6 + p * 10, 0, 6.3); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (j.warn) {     // about to fire: a few bubbles fizz
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(j.x + dir[0] * (10 + i * 10) + Math.sin(t * 20 + i) * 4, j.y + dir[1] * (10 + i * 10), 3, 0, 6.3); ctx.fill(); }
    }
    ctx.translate(j.x, j.y); ctx.rotate(Math.atan2(dir[1], dir[0]));
    const n = () => rr(ctx, -16, -16, 22, 32, 6);
    ctx.fillStyle = '#d7e5de'; n(); ctx.fill(); out(ctx, n, 2.5);
    ctx.fillStyle = '#5f7d73'; ctx.fillRect(2, -8, 6, 16);
    ctx.restore();
  }
  function drain(ctx, d, t) {
    ctx.save(); ctx.translate(d.x, d.y);
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -10, 40 + ((t * 40 + i * 40) % 120), Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
    const g = () => rr(ctx, -46, -14, 92, 22, 6);
    ctx.fillStyle = '#5f7d73'; g(); ctx.fill();
    ctx.fillStyle = '#c7dad2'; for (let x = -40; x < 40; x += 12) ctx.fillRect(x, -10, 6, 14);
    out(ctx, g, 2.5);
    ctx.restore();
  }
  function current(ctx, z, t) {
    ctx.save(); ctx.beginPath(); ctx.rect(z.x, z.y, z.w, z.h); ctx.clip();
    const sp = Math.hypot(z.fx, z.fy), ux = z.fx / sp, uy = z.fy / sp;
    ctx.strokeStyle = z.fx >= 0 ? 'rgba(255,255,255,.55)' : 'rgba(255,214,200,.6)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const n = Math.max(6, Math.floor(z.w * z.h / 9000));
    for (let i = 0; i < n; i++) {
      const hx = G.U.hash(i + z.x), hy = G.U.hash(i * 3.7 + z.y);
      const along = ((t * sp * 0.9 + hx * 2000) % 2000);
      const x = z.x + (ux >= 0 ? along % z.w : z.w - along % z.w) * Math.abs(ux || 1) + (uy ? hx * z.w : 0);
      const y = z.y + hy * z.h + (uy ? ((uy > 0 ? along : -along) % z.h + z.h) % z.h : 0);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - ux * 26, y - uy * 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - ux * 8 - uy * 6, y - uy * 8 + ux * 6); ctx.stroke();
    }
    ctx.restore();
  }
  function airBubble(ctx, b, t) {
    if (b.gone) return;
    ctx.save(); ctx.translate(b.x, b.y + Math.sin(t * 2.5 + b.x) * 5);
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 34); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 6.3); ctx.fill();
    for (const [dx, dy, r] of [[0, 0, 15], [-14, 10, 7], [12, 12, 6], [10, -14, 5]]) {
      ctx.fillStyle = 'rgba(214,240,252,.5)'; ctx.beginPath(); ctx.arc(dx, dy, r, 0, 6.3); ctx.fill();
      out(ctx, () => { ctx.beginPath(); ctx.arc(dx, dy, r, 0, 6.3); }, 2);
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-5, -5, 4, 2.5, -0.7, 0, 6.3); ctx.fill();
    ctx.restore();
  }
  function stopwatch(ctx, w, t) {
    ctx.save(); ctx.translate(w.x, w.y + Math.sin(t * 3 + w.x) * 4); ctx.rotate(Math.sin(t * 2) * 0.12);
    const c = () => { ctx.beginPath(); ctx.arc(0, 0, 18, 0, 6.3); };
    ctx.fillStyle = P.cream; c(); ctx.fill(); ctx.fillStyle = '#fbfffb'; ctx.fillRect(-4, -26, 8, 8);
    out(ctx, c, 2.5);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t * 4) * 11, Math.sin(t * 4) * 11); ctx.stroke();
    ctx.restore();
    Chars.FX.text(ctx, '+' + w.add + 's', w.x, w.y - 34, 15, { fill: '#fff4cc' });
  }
  function token(ctx, k, t) {
    ctx.save(); ctx.translate(k.x, k.y + Math.sin(t * 3 + k.x) * 4); ctx.scale(Math.cos(t * 2.4 + k.x), 1);
    const c = () => { ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.3); };
    ctx.fillStyle = P.gold; c(); ctx.fill(); out(ctx, c, 2.5);
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(-5, -1, 4.5, 3, 0, 0, 6.3); ctx.ellipse(5, -1, 4.5, 3, 0, 0, 6.3); ctx.fill(); ctx.fillRect(-1, -2, 2, 2);
    ctx.restore();
  }
  function buoy(ctx, b, surfY, levelBottom, t) {
    ctx.save();
    ctx.setLineDash([12, 12]); ctx.strokeStyle = b.passed ? 'rgba(159,227,195,.8)' : 'rgba(255,244,204,.8)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(b.x, surfY + 10); ctx.lineTo(b.x, levelBottom); ctx.stroke(); ctx.setLineDash([]);
    const y = surfY - 6 + Math.sin(t * 2 + b.x) * 4;
    const f = () => { ctx.beginPath(); ctx.arc(b.x, y, 22, 0, 6.3); };
    ctx.fillStyle = b.passed ? P.mint : P.coral; f(); ctx.fill();
    ctx.fillStyle = '#fbfffb'; ctx.fillRect(b.x - 22, y - 4, 44, 8); out(ctx, f, 2.5);
    ctx.fillStyle = '#e7f1ec'; ctx.fillRect(b.x - 2, y - 70, 4, 50);
    ctx.fillStyle = b.passed ? P.mint : P.cream; ctx.beginPath(); ctx.moveTo(b.x + 2, y - 70); ctx.lineTo(b.x + 40, y - 60 + Math.sin(t * 4) * 3); ctx.lineTo(b.x + 2, y - 48); ctx.closePath(); ctx.fill();
    ctx.restore();
    if (!b.passed) Chars.FX.text(ctx, '+' + b.add + 's', b.x, surfY + 40, 18, { fill: '#fff4cc' });
  }
  function hoop(ctx, h, t) {          // a weighted diving ring standing on its edge
    ctx.save(); ctx.translate(h.x, h.y + Math.sin(t * 2 + h.x) * 3);
    const col = h.done ? P.mint : P.coral;
    ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(20,38,33,.4)'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 62, 0, 0, 6.3); ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 24, 62, 0, 0, 6.3); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fbfffb'; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.ellipse(0, 0, 24, 62, 0, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
    if (!h.done) { const k = (t * 1.5) % 1; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff4cc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 24 + k * 14, 62 + k * 20, 0, 0, 6.3); ctx.stroke(); }
    ctx.restore();
  }
  function finishPad(ctx, x, y0, y1, t) {
    ctx.save();
    const p = () => rr(ctx, x - 18, y0, 18, y1 - y0, 6);
    ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ffe07a' : '#ffd24f'; p(); ctx.fill(); out(ctx, p, 2.5);
    ctx.translate(x - 9, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = P.ink; ctx.font = '900 13px "Trebuchet MS", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('T O U C H   P A D   ·   F I N I S H', 0, 0);
    ctx.restore();
  }
  function depthMarker(ctx, x, y, text) {
    ctx.save(); ctx.font = '900 30px "Trebuchet MS", system-ui'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(30,70,110,.55)'; ctx.fillText(text, x, y); ctx.restore();
  }
  function mural(ctx, x, y, w) {
    const im = IM.mural; if (!im) return;
    const h = w * im.height / im.width;
    ctx.save();
    ctx.fillStyle = '#16211d'; rr(ctx, x - 14, y - 14, w + 28, h + 28, 10); ctx.fill();
    out(ctx, () => rr(ctx, x - 14, y - 14, w + 28, h + 28, 10), 3);
    ctx.drawImage(im, x, y, w, h);
    ctx.restore();
  }
  function crackedTile(ctx, x, y, t) {     // hint for the secret
    ctx.strokeStyle = 'rgba(30,70,110,.6)'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(x + 6, y + 4); ctx.lineTo(x + 18, y + 16); ctx.lineTo(x + 14, y + 28); ctx.moveTo(x + 18, y + 16); ctx.lineTo(x + 32, y + 14); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 3; i++) { const p = (t * 0.7 + i / 3) % 1; ctx.beginPath(); ctx.arc(x + 20 + Math.sin(t * 3 + i) * 6, y - p * 60, 3 + i, 0, 6.3); ctx.fill(); }
  }
  /* speech bubble that doesn't stop the race */
  function bark(ctx, x, y, text, a, tint) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= Math.min(1, a);
    ctx.font = '800 17px "Trebuchet MS", system-ui, sans-serif';
    const w = Math.ceil(ctx.measureText(text).width) + 26, h = 34;
    const bx = x - w / 2, by = y - h;
    const shape = () => { rr(ctx, bx, by, w, h, 14); ctx.moveTo(x - 8, by + h - 1); ctx.lineTo(x, by + h + 12); ctx.lineTo(x + 8, by + h - 1); };
    ctx.fillStyle = '#fbfffb'; shape(); ctx.fill();
    ctx.strokeStyle = tint || '#16231e'; ctx.lineWidth = 2.5; rr(ctx, bx, by, w, h, 14); ctx.stroke();
    ctx.fillStyle = '#16231e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, by + h / 2 + 1);
    ctx.restore();
  }

  G.Art2 = { TS, P, IM, TILES, load, sky, water, caustics, surface, deck, startBlock, lifeguard, sign, vending, floatie,
    rope, hoop, noodle, donut, kickboard, cleaner, jet, drain, current, airBubble, stopwatch, token, buoy, finishPad, depthMarker,
    mural, crackedTile, bark, mix };
})(window.TT);
