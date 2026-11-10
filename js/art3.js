/* =====================================================================
   art3.js — World 3 (the ink arena) art, drawn in code.
   Original designs only: no assets, names or shapes from any existing
   paint-shooter game. Pastel arena, mint ink for Duck, coral for the
   Smudges (Turtletimee's tiny sunglasses-wearing minions).
   ===================================================================== */
(function (G) {
  'use strict';
  const P = {
    floor1: '#efeafb', floor2: '#e6e0f7', grid: '#d9d1f1', line: '#fbfffb', ink: '#16231e',
    me: '#5fcf9f', meHi: '#9df0c8', meLo: '#3fae80', them: '#f2897a', themHi: '#ffc0b4', themLo: '#d4685a',
    crate: '#f3e2b8', crateLo: '#d9c28c', crateTop: '#fbefcf', mint: '#bfe9d4', mintLo: '#8fcbb0', sage: '#9fd3b9', sageLo: '#74b093',
    lav: '#c9b8f0', lavLo: '#a995dc', coral: '#f39b8a', cream: '#fff4cc',
  };
  const rr = (ctx, x, y, w, h, r) => G.U.roundRect(ctx, x, y, w, h, r);
  const out = (ctx, fn, w) => G.Art.outline(ctx, fn, w);

  /* ---------------- floor ---------------- */
  function buildFloor(W, H, cell, secret) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const T = cell * 2;
    for (let ty = 0; ty < H; ty += T) for (let tx = 0; tx < W; tx += T) {
      x.fillStyle = ((tx + ty) / T) % 2 ? P.floor1 : P.floor2; x.fillRect(tx, ty, T, T);
    }
    x.fillStyle = P.grid; for (let tx = 0; tx < W; tx += T) x.fillRect(tx, 0, 1, H); for (let ty = 0; ty < H; ty += T) x.fillRect(0, ty, W, 1);
    // arena markings: centre ring, halfway line, start circle
    x.strokeStyle = 'rgba(169,149,220,.55)'; x.lineWidth = 6;
    x.beginPath(); x.arc(W / 2, H / 2 + 40, 170, 0, 6.3); x.stroke();
    x.setLineDash([22, 18]); x.beginPath(); x.moveTo(60, H / 2 + 40); x.lineTo(W - 60, H / 2 + 40); x.stroke(); x.setLineDash([]);
    x.beginPath(); x.arc(W / 2, H - 120, 90, 0, 6.3); x.stroke();
    // the wordmark, faintly painted on the floor
    const wm = G.Art.IM.wordmark;
    if (wm) { x.save(); x.globalAlpha = 0.18; x.globalCompositeOperation = 'multiply'; x.filter = 'none'; const w = 360, h = w * wm.height / wm.width; x.translate(W / 2, H / 2 + 40); x.rotate(-0.06);
      x.drawImage(tint(wm, '#7d68b8'), -w / 2, -h / 2, w, h); x.restore(); }
    // the suspicious blank square (secret)
    if (secret) {
      x.fillStyle = '#f8f5ff'; x.fillRect(secret.x, secret.y, secret.w, secret.h);
      x.strokeStyle = 'rgba(169,149,220,.5)'; x.lineWidth = 2; x.setLineDash([6, 6]); x.strokeRect(secret.x + 3, secret.y + 3, secret.w - 6, secret.h - 6); x.setLineDash([]);
      x.fillStyle = 'rgba(169,149,220,.45)'; x.font = '900 34px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', secret.x + secret.w / 2, secret.y + secret.h / 2 + 2);
    }
    return c;
  }
  function tint(img, col) {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  /* ---------------- obstacles (pseudo-3D blocks) ---------------- */
  const DEPTH = 14;
  function block(ctx, o, t) {
    const { x, y, w, h } = o;
    const cols = { crate: [P.crateTop, P.crateLo], pillar: [P.mint, P.mintLo], planter: [P.sage, P.sageLo], wall: [P.lav, P.lavLo], pot: [P.coral, '#d4685a'], pad: ['#e9e3f8', '#cfc6ea'] }[o.kind] || [P.lav, P.lavLo];
    ctx.fillStyle = 'rgba(40,30,70,.12)'; ctx.fillRect(x + 6, y + 8, w, h);
    ctx.fillStyle = cols[1]; rr(ctx, x, y + DEPTH * 0.3, w, h, 6); ctx.fill();
    ctx.fillStyle = cols[0]; rr(ctx, x, y - DEPTH * 0.7, w, h - DEPTH * 0.3, 6); ctx.fill();
    out(ctx, () => rr(ctx, x, y - DEPTH * 0.7, w, h + DEPTH, 6), 2.5);
    if (o.kind === 'crate') {
      ctx.strokeStyle = P.crateLo; ctx.lineWidth = 3;
      for (let i = 1; i < Math.floor(w / 48); i++) { ctx.beginPath(); ctx.moveTo(x + i * w / Math.floor(w / 48), y - DEPTH * 0.7 + 6); ctx.lineTo(x + i * w / Math.floor(w / 48), y + h - DEPTH - 2); ctx.stroke(); }
      if (o.label) {
        ctx.save(); ctx.beginPath(); ctx.rect(x + 4, y - DEPTH * 0.7, w - 8, h - DEPTH * 0.3); ctx.clip();
        ctx.fillStyle = 'rgba(80,60,30,.55)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '900 15px "Trebuchet MS", system-ui'; ctx.fillText('TURTLETIMEE MERCH', x + w / 2, y + h / 2 - 16);
        ctx.font = 'italic 700 11px "Trebuchet MS", system-ui'; ctx.fillText('Thank you for shipping on Turtletimee!', x + w / 2, y + h / 2 + 2);
        ctx.font = '900 11px "Trebuchet MS", system-ui'; ctx.fillText('THIS WAY UP ↑   FRAGILE', x + w / 2, y + h / 2 + 18);
        ctx.restore();
      }
    } else if (o.kind === 'planter') {
      for (let i = 0; i < Math.floor(h / 30); i++) {
        const cx = x + w / 2 + Math.sin(i * 2.1) * 6, cy = y + 10 + i * 30;
        ctx.fillStyle = '#5fae8a'; ctx.beginPath(); ctx.ellipse(cx, cy, 14 + Math.sin(t + i) * 1.5, 10, 0.4, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#ffd3c9'; ctx.beginPath(); ctx.arc(cx + 5, cy - 3, 3.5, 0, 6.3); ctx.fill();
      }
    } else if (o.kind === 'pillar') {
      ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(ctx, x + 8, y - DEPTH * 0.7 + 6, w - 16, 6, 3); ctx.fill();
    } else if (o.kind === 'pot') {
      // the Smudge spawner: a big coral paint pot
      ctx.fillStyle = P.themLo; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 - 6, w / 2 - 8, h / 2 - 12, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = P.them; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 - 6 + Math.sin(t * 3) * 1.5, w / 2 - 14, h / 2 - 18, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(x + w / 2 - 10, y + h / 2 - 12, 5, 0, 6.3); ctx.fill();
    }
  }

  /* ---------------- the big screen (Turtletimee streaming) ---------------- */
  function jumbotron(ctx, s, t, opts) {
    const { x, y, w, h } = s;
    opts = opts || {};
    // frame + legs
    ctx.fillStyle = '#5b4f7d'; ctx.fillRect(x + 40, y + h, 16, 30); ctx.fillRect(x + w - 56, y + h, 16, 30);
    ctx.fillStyle = '#2a2440'; rr(ctx, x - 12, y - 12, w + 24, h + 24, 16); ctx.fill();
    out(ctx, () => rr(ctx, x - 12, y - 12, w + 24, h + 24, 16), 3);
    // screen
    const sw = w * 0.66;
    ctx.save(); ctx.beginPath(); rr(ctx, x, y, sw, h, 8); ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, opts.off ? '#111' : '#2f6e57'); g.addColorStop(1, opts.off ? '#0a0a0a' : '#173a30');
    ctx.fillStyle = g; ctx.fillRect(x, y, sw, h);
    if (!opts.off) {
      // Turtletimee, wearing her sunglasses (Ada's drawing, ref 21)
      const k = opts.anger || 0;
      Chars.drawPose(ctx, 'tt_cool', { x: x + sw / 2 + Math.sin(t * 40) * k * 4, y: y + h + 60, height: h * 1.9, face: 1,
        rot: Math.sin(t * 0.8) * 0.02, offs: { glasses: [0, opts.push ? -8 * opts.push : 0] } });
      if (opts.glint) Chars.FX.star(ctx, x + sw * 0.4, y + h * 0.38, 16 * opts.glint, t * 3);
      // scanlines
      ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let yy = y; yy < y + h; yy += 4) ctx.fillRect(x, yy, sw, 2);
      // LIVE badge + viewers
      ctx.fillStyle = '#f2897a'; rr(ctx, x + 10, y + 10, 52, 22, 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '900 13px "Trebuchet MS", system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('● LIVE', x + 15, y + 22);
      ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, x + 68, y + 10, 118, 22, 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 12px "Trebuchet MS", system-ui'; ctx.fillText((opts.viewers || 1).toLocaleString('en') + ' watching', x + 76, y + 22);
      ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, x + 10, y + h - 32, 168, 22, 6); ctx.fill();
      ctx.fillStyle = '#fff4cc'; ctx.font = '900 12px "Trebuchet MS", system-ui'; ctx.fillText('SHADERMAXPOWER', x + 18, y + h - 21);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 40; i++) ctx.fillRect(x + G.U.hash(i + Math.floor(t * 20)) * sw, y + G.U.hash(i * 3 + Math.floor(t * 20)) * h, 3, 2);
    }
    if (opts.flash) { ctx.fillStyle = 'rgba(255,255,255,' + opts.flash + ')'; ctx.fillRect(x, y, sw, h); }
    ctx.restore();
    // chat panel
    const cx = x + sw + 8, cw = w - sw - 8;
    ctx.fillStyle = '#1b1730'; rr(ctx, cx, y, cw, h, 8); ctx.fill();
    ctx.fillStyle = '#c9b8f0'; ctx.font = '900 11px ui-monospace, Menlo, monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('STREAM CHAT', cx + 10, y + 8);
    const lines = opts.chat || [];
    ctx.save(); ctx.beginPath(); ctx.rect(cx, y + 24, cw, h - 28); ctx.clip();
    ctx.font = '700 12px "Trebuchet MS", system-ui';
    for (let i = 0; i < lines.length; i++) {
      const ly = y + h - 18 - (lines.length - 1 - i) * 17 - (opts.chatScroll || 0);
      const [name, msg] = lines[i].includes(':') ? [lines[i].split(':')[0] + ':', lines[i].slice(lines[i].indexOf(':') + 1)] : ['', lines[i]];
      ctx.fillStyle = ['#9df0c8', '#ffc0b4', '#fff4cc', '#c9b8f0', '#a9d8f5'][i % 5]; ctx.fillText(name, cx + 10, ly);
      ctx.fillStyle = '#e9e3f8'; ctx.fillText(msg, cx + 12 + ctx.measureText(name).width, ly);
    }
    ctx.restore();
  }

  /* ---------------- characters & effects ---------------- */
  function shadow(ctx, x, y, r) { ctx.fillStyle = 'rgba(40,30,70,.18)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.38, 0, 0, 6.3); ctx.fill(); }
  /* a Smudge: a little coral ink blob with tiny sunglasses (Turtletimee's minion) */
  function smudge(ctx, s, t) {
    const bob = Math.abs(Math.sin(t * 9 + s.seed)) * 4, sq = s.popT != null ? 1 + s.popT * 4 : 1;
    shadow(ctx, s.x, s.y + 4, 18);
    ctx.save(); ctx.translate(s.x, s.y - 14 - bob); ctx.scale(sq * (1 + Math.sin(t * 9 + s.seed) * 0.05), sq * (1 - Math.sin(t * 9 + s.seed) * 0.05));
    if (s.popT != null) ctx.globalAlpha = Math.max(0, 1 - s.popT * 5);
    const body = () => { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const a = i / 12 * 6.283, r = 17 + Math.sin(a * 3 + t * 6 + s.seed) * 2; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.9) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.9); } ctx.closePath(); };
    ctx.fillStyle = s.stun > 0 ? P.themHi : P.them; body(); ctx.fill(); out(ctx, body, 2.5);
    // feet
    ctx.fillStyle = P.themLo; ctx.beginPath(); ctx.ellipse(-8, 15 + Math.sin(t * 18 + s.seed) * 2, 6, 4, 0, 0, 6.3); ctx.ellipse(8, 15 - Math.sin(t * 18 + s.seed) * 2, 6, 4, 0, 0, 6.3); ctx.fill();
    // tiny sunglasses
    const d = s.vx < 0 ? -3 : 3;
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(-6 + d, -4, 6, 4, -0.1, 0, 6.3); ctx.ellipse(6 + d, -4, 6, 4, 0.1, 0, 6.3); ctx.fill(); ctx.fillRect(-1 + d, -6, 2, 2);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-8 + d, -6, 3, 1.5); ctx.fillRect(4 + d, -6, 3, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-8, -12, 4, 2.5, -0.6, 0, 6.3); ctx.fill();
    ctx.restore();
  }
  function shot(ctx, b, team) {
    const c = team === 1 ? P.me : P.them, hi = team === 1 ? P.meHi : P.themHi;
    ctx.save();
    for (let i = 1; i <= 3; i++) { ctx.globalAlpha = 0.25 * (4 - i) / 3; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(b.x - b.vx * 0.012 * i, b.y - b.vy * 0.012 * i, 8 - i, 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, 6.3); ctx.fill();
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = hi; ctx.beginPath(); ctx.arc(b.x - 2.5, b.y - 2.5, 3, 0, 6.3); ctx.fill();
    ctx.restore();
  }
  function bombWarn(ctx, b, t) {
    const k = Math.min(1, b.t / b.delay), r = b.r;
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.fillStyle = 'rgba(242,137,122,' + (0.12 + 0.12 * Math.sin(t * 18)) + ')'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.3); ctx.fill();
    ctx.strokeStyle = '#f2897a'; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 40;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, r * (1 - k), 0, 6.3); ctx.stroke();
    // sunglasses mark: it's from Turtletimee
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(-14, 0, 12, 8, -0.1, 0, 6.3); ctx.ellipse(14, 0, 12, 8, 0.1, 0, 6.3); ctx.fill(); ctx.fillRect(-3, -3, 6, 3);
    ctx.restore();
    // the falling ink drop
    const fy = b.y - (1 - k) * 600;
    ctx.fillStyle = P.them; ctx.beginPath(); ctx.ellipse(b.x, fy, 16 + k * 6, 22 + k * 8, 0, 0, 6.3); ctx.fill();
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 3; ctx.stroke();
  }
  function reticle(ctx, x, y, t, full) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.5);
    ctx.strokeStyle = 'rgba(20,38,33,.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.3); ctx.stroke();
    ctx.strokeStyle = full ? '#fff4cc' : '#9df0c8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.3); ctx.stroke();
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(26, 0); ctx.stroke(); }
    ctx.restore();
  }
  function minimap(ctx, m, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,20,.86)'; rr(ctx, x - 8, y - 8, w + 16, h + 16, 12); ctx.fill();
    ctx.strokeStyle = '#fbfffb'; ctx.lineWidth = 2.5; rr(ctx, x - 8, y - 8, w + 16, h + 16, 12); ctx.stroke();
    ctx.imageSmoothingEnabled = true; ctx.drawImage(m.floor, x, y, w, h); ctx.drawImage(m.paint, x, y, w, h);
    const sx = w / m.W, sy = h / m.H;
    ctx.fillStyle = '#5b4f7d'; for (const o of m.obstacles) ctx.fillRect(x + o.x * sx, y + o.y * sy, Math.max(1, o.w * sx), Math.max(1, o.h * sy));
    ctx.fillStyle = '#f2897a'; for (const s of m.smudges) if (!s.dead) { ctx.beginPath(); ctx.arc(x + s.x * sx, y + s.y * sy, 3, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = '#fff4cc'; ctx.strokeStyle = '#16231e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + m.px * sx, y + m.py * sy, 5, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(x + m.cx * sx, y + m.cy * sy, G.W * sx, G.H * sy);
    ctx.restore();
  }
  function banner(ctx, text, sub, a, col) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, a);
    Chars.FX.text(ctx, text, G.W / 2, G.H * 0.36, 62, { fill: col || '#fff4cc', shadow: '#f2897a', scale: 1 + Math.max(0, 1 - a) * 0.2 });
    if (sub) Chars.FX.text(ctx, sub, G.W / 2, G.H * 0.36 + 56, 24, { fill: '#fbfffb' });
    ctx.restore();
  }

  G.Art3 = { P, buildFloor, block, jumbotron, smudge, shot, bombWarn, reticle, minimap, banner, shadow, DEPTH };
})(window.TT);
