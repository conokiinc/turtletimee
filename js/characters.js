/* =====================================================================
   characters.js — Duckquackquack & Turtletimee cut-out puppets
   ---------------------------------------------------------------------
   All character art is Ada's original white line drawings (see
   ASSET_NOTES.md). Nothing here redraws a character: every pose is one
   of the original drawings, optionally split into a few parts (legs,
   flippers, knife arm, sunglasses) that are moved with rotation,
   bobbing and squash-and-stretch.

   Usage:
     await Chars.load('assets/characters/');
     Chars.draw(ctx, 'duck', 'walk', t, x, y, 128, { face: 1 });
   (x, y) = point between the feet. 128 = the "character scale": the
   height of Duckquackquack's standing drawing. Every pose of BOTH
   characters is sized from this one number, so their relative sizes and
   proportions never change between animations or scenes.
   face: 1 = facing right, -1 = facing left.
   ===================================================================== */
(function (G) {
  'use strict';

  const HALO_R = 5;                         // subtle dark backing, sprite px
  const HALO_COL = 'rgba(20,38,33,0.5)';
  const FX_HALO = 'rgba(20,38,33,0.55)';
  const TAU = Math.PI * 2;

  const FILES = [
    'duck_face', 'duck_hero_base', 'duck_hero_arm', 'knife',
    'duck_walk_body', 'duck_walk_legL', 'duck_walk_legR', 'duck_run', 'duck_qm',
    'tt_hold_base', 'tt_hold_sparkle', 'tt_cool_base', 'tt_cool_glasses',
    'tt_side_body', 'tt_side_flipF', 'tt_side_flipB',
  ];
  const IMG = {};   // name -> { raw, halo, w, h }

  /* ---------- poses -------------------------------------------------
     f = scale factor relative to the standing duck drawing (duck_walk).
     Values were set from measured head widths so that each character's
     face stays the same size in every pose, and Turtletimee's head is
     ~0.85x Duck's, matching how Ada drew them side by side on the
     T-shirt. facing: direction the original drawing faces. */
  const POSES = {
    duck_walk: { w: 353, h: 439, anchor: [222, 432], facing: -1, f: 1.0,
      layers: [
        { img: 'duck_walk_legL', pivot: [192, 318], key: 'legL' },
        { img: 'duck_walk_legR', pivot: [270, 330], key: 'legR' },
        { img: 'duck_walk_body', eyes: [[188, 74, 196, 84], [221, 78, 232, 90]] },
      ] },
    duck_run: { w: 331, h: 406, anchor: [190, 398], facing: -1, f: 0.879,
      layers: [{ img: 'duck_run' }] },
    duck_hero: { w: 496, h: 417, anchor: [250, 414], facing: 0, f: 0.611,
      layers: [
        { img: 'duck_hero_base', eyes: [[175, 77, 194, 102], [263, 84, 279, 101]] },
        { img: 'duck_hero_arm', pivot: [334, 222], key: 'arm' },
      ] },
    duck_face: { w: 389, h: 420, anchor: [195, 420], facing: 0, f: 0.49,
      layers: [{ img: 'duck_face' }] },
    tt_hold: { w: 414, h: 409, anchor: [250, 405], facing: 0, f: 0.600,
      layers: [
        { img: 'tt_hold_sparkle', key: 'sparkle', pivot: [45, 65] },
        { img: 'tt_hold_base', eyes: [[220, 76, 235, 100], [278, 81, 291, 103]] },
      ] },
    tt_cool: { w: 416, h: 442, anchor: [215, 440], facing: 0, f: 0.52,
      layers: [
        { img: 'tt_cool_base' },
        { img: 'tt_cool_glasses', key: 'glasses', pivot: [140, 140] },
      ] },
    tt_side: { w: 558, h: 298, anchor: [300, 292], facing: -1, f: 0.636,
      layers: [
        { img: 'tt_side_flipB', pivot: [455, 172], key: 'flipB' },
        { img: 'tt_side_flipF', pivot: [200, 168], key: 'flipF' },
        { img: 'tt_side_body', eyes: [[46, 94, 60, 115], [115, 95, 128, 108]] },
      ] },
  };
  // where knives come out of Duck's sleeves (duck_hero sprite px)
  const SLEEVE_HI = [420, 150];   // raised wing (knife hand)
  const SLEEVE_LO = [175, 350];   // lower wing (knife held at the hip)

  /* ---------- loading & halo baking --------------------------------- */
  function loadImage(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('Could not load ' + src));
      im.src = src;
    });
  }
  function bakeHalo(im) {
    const r = HALO_R, c = document.createElement('canvas');
    c.width = im.width + r * 2; c.height = im.height + r * 2;
    const x = c.getContext('2d');
    for (let ring = 1; ring <= 2; ring++) {
      const rr = r * ring / 2, n = ring === 1 ? 10 : 18;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU;
        x.drawImage(im, r + Math.cos(a) * rr, r + Math.sin(a) * rr);
      }
    }
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = HALO_COL; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-over';
    x.drawImage(im, r, r);
    return c;
  }
  async function load(base) {
    base = base || 'assets/characters/';
    await Promise.all(FILES.map(async (n) => {
      const raw = await loadImage(base + n + '.png');
      IMG[n] = { raw, halo: bakeHalo(raw), w: raw.width, h: raw.height };
    }));
    return true;
  }

  /* ---------- helpers ------------------------------------------------ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);
  const easeOutBack = (p) => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
  const scaleOf = (poseName, height) => (height / 439) * POSES[poseName].f;
  const U_clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* Draw one pose. o = { x, y, height, face, rot, sx, sy, dx, dy, alpha,
     parts:{key:angle}, offs:{key:[dx,dy]}, partAlpha:{key:a}, pscale:{key:s},
     blink:0|1, halo:true, center:false } */
  function drawPose(ctx, poseName, o) {
    const P = POSES[poseName];
    const s = scaleOf(poseName, o.height);
    const face = o.face == null ? 1 : o.face;
    const flip = P.facing === 0 ? 1 : (P.facing === -1 ? -face : face);
    const ax = o.center ? P.w / 2 : P.anchor[0];
    const ay = o.center ? P.h / 2 : P.anchor[1];
    const useHalo = o.halo !== false;
    ctx.save();
    ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
    ctx.translate(o.x + (o.dx || 0), o.y + (o.dy || 0));
    if (o.rot) ctx.rotate(o.rot * (P.facing === 0 ? 1 : face));
    ctx.scale(s * flip * (o.sx || 1), s * (o.sy || 1));
    ctx.translate(-ax, -ay);
    for (const L of P.layers) {
      const im = IMG[L.img]; if (!im) continue;
      const pa = o.partAlpha && L.key != null ? o.partAlpha[L.key] : undefined;
      if (pa === 0) continue;
      ctx.save();
      if (pa != null) ctx.globalAlpha *= pa;
      if (L.key && o.offs && o.offs[L.key]) ctx.translate(o.offs[L.key][0], o.offs[L.key][1]);
      if (L.key && L.pivot && ((o.parts && o.parts[L.key]) || (o.pscale && o.pscale[L.key]))) {
        ctx.translate(L.pivot[0], L.pivot[1]);
        if (o.parts && o.parts[L.key]) ctx.rotate(o.parts[L.key]);
        if (o.pscale && o.pscale[L.key]) ctx.scale(o.pscale[L.key], o.pscale[L.key]);
        ctx.translate(-L.pivot[0], -L.pivot[1]);
      }
      const src = useHalo ? im.halo : im.raw, off = useHalo ? -HALO_R : 0;
      if (o.blink && L.eyes) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(-HALO_R, -HALO_R, im.w + HALO_R * 2, im.h + HALO_R * 2);
        for (const e of L.eyes) ctx.rect(e[2] + 3, e[1] - 3, -(e[2] - e[0] + 6), e[3] - e[1] + 6);
        ctx.clip('evenodd');
        ctx.drawImage(src, off, off);
        ctx.restore();
        ctx.lineCap = 'round';
        for (const e of L.eyes) {
          const cy = (e[1] + e[3]) / 2 + 2, x0 = e[0] - 2, x1 = e[2] + 2;
          const path = () => { ctx.beginPath(); ctx.moveTo(x0, cy); ctx.quadraticCurveTo((x0 + x1) / 2, cy + 3, x1, cy); };
          if (useHalo) { ctx.strokeStyle = HALO_COL; ctx.lineWidth = 6 + HALO_R * 1.6; path(); ctx.stroke(); }
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; path(); ctx.stroke();
        }
      } else {
        ctx.drawImage(src, off, off);
      }
      ctx.restore();
    }
    if (o.after) o.after(ctx, poseName);     // optional cosmetic overlay, in sprite space
    ctx.restore();
  }

  /* Optional cosmetics (unlockables). Drawn on top of the original art in
     its own sprite space, never replacing any of Ada's lines. */
  const COSMETICS = {
    goggles(ctx, poseName) {
      if (poseName !== 'duck_walk') return;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(243,155,138,.95)'; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(240, 84); ctx.quadraticCurveTo(268, 78, 290, 96); ctx.stroke();          // strap
      for (const [x, y] of [[191, 80], [227, 85]]) {
        ctx.fillStyle = 'rgba(169,216,245,.55)'; ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(20,38,33,.5)'; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); ctx.stroke();
      }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(206, 82); ctx.lineTo(212, 83); ctx.stroke();  // bridge
      ctx.restore();
    },
  };

  /* Map a point in a pose's sprite space to the canvas (for knives etc.) */
  function posePoint(poseName, o, px, py) {
    const P = POSES[poseName], s = scaleOf(poseName, o.height) * (o.sy || 1);
    const sx = scaleOf(poseName, o.height) * (o.sx || 1);
    const face = o.face == null ? 1 : o.face;
    const flip = P.facing === 0 ? 1 : (P.facing === -1 ? -face : face);
    return [o.x + (o.dx || 0) + (px - P.anchor[0]) * sx * flip, o.y + (o.dy || 0) + (py - P.anchor[1]) * s];
  }

  function blinkAt(t, seed, period, dur) { return ((t + seed) % period) < dur ? 1 : 0; }

  function drawKnife(ctx, x, y, ang, size, halo, alpha) {
    const kn = IMG.knife; if (!kn) return;
    const sc = size / kn.w;
    ctx.save(); ctx.globalAlpha *= (alpha == null ? 1 : alpha);
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, sc);
    ctx.drawImage(halo === false ? kn.raw : kn.halo, -kn.w / 2 - (halo === false ? 0 : HALO_R), -kn.h / 2 - (halo === false ? 0 : HALO_R));
    ctx.restore();
  }

  /* ---------- doodle FX (white strokes, matching the drawings) ------- */
  const FX = {
    stroke(ctx, w, fn, col) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = FX_HALO; ctx.lineWidth = w + 3; ctx.beginPath(); fn(); ctx.stroke();
      ctx.strokeStyle = col || '#fff'; ctx.lineWidth = w; ctx.beginPath(); fn(); ctx.stroke();
      ctx.restore();
    },
    star(ctx, x, y, r, rot, col) {          // 4-point sparkle like the T-shirt's
      if (r <= 0.5) return;
      FX.stroke(ctx, Math.max(1.5, r * 0.16), () => {
        for (let i = 0; i < 4; i++) {
          const a = rot + i * Math.PI / 2, b = a + Math.PI / 4;
          const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          ctx.lineTo(x + Math.cos(b) * r * 0.28, y + Math.sin(b) * r * 0.28);
        }
        ctx.closePath();
      }, col);
    },
    puff(ctx, x, y, r, a) {
      if (a <= 0 || r <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      FX.stroke(ctx, Math.max(1.5, r * 0.18), () => { ctx.arc(x, y, r, 0, TAU); });
      ctx.restore();
    },
    bubble(ctx, x, y, r, a) {
      if (a <= 0 || r <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      FX.stroke(ctx, Math.max(1.2, r * 0.22), () => { ctx.arc(x, y, r, 0, TAU); });
      ctx.restore();
    },
    lines(ctx, x, y, len, n, a, dir) {
      ctx.save(); ctx.globalAlpha *= a;
      for (let i = 0; i < n; i++) {
        const yy = y + (i - (n - 1) / 2) * len * 0.22;
        const l = len * (0.6 + 0.4 * ((i * 37) % 5) / 5);
        FX.stroke(ctx, 2.5, () => { ctx.moveTo(x, yy); ctx.lineTo(x - dir * l, yy); });
      }
      ctx.restore();
    },
    text(ctx, str, x, y, size, opts) {
      opts = opts || {};
      ctx.save();
      ctx.translate(x, y); if (opts.rot) ctx.rotate(opts.rot);
      if (opts.scale) ctx.scale(opts.scale, opts.scale);
      ctx.font = (opts.weight || 900) + ' ' + size + 'px ' + (opts.font || '"Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif');
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      if (opts.shadow) { ctx.fillStyle = opts.shadow; ctx.fillText(str, size * 0.06, size * 0.08); }
      ctx.strokeStyle = opts.stroke || 'rgba(22,40,35,0.95)'; ctx.lineWidth = size * 0.22; ctx.strokeText(str, 0, 0);
      ctx.fillStyle = opts.fill || '#fff'; ctx.fillText(str, 0, 0);
      ctx.restore();
    },
    spotlight(ctx, x, y, r0, r1, a) {       // full-screen vignette in screen space
      if (a <= 0) return;
      const m = ctx.getTransform();
      const cx = m.a * x + m.c * y + m.e, cy = m.b * x + m.d * y + m.f, sc = Math.hypot(m.a, m.b);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const g = ctx.createRadialGradient(cx, cy, r0 * sc, cx, cy, r1 * sc);
      g.addColorStop(0, 'rgba(10,20,18,0)'); g.addColorStop(1, 'rgba(10,20,18,' + (0.55 * a) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
    },
  };

  /* ---------- animations ---------------------------------------------
     (ctx, t, o) with o = {x, y, height, face, halo, ...}.
     One-shot animations loop for previews; ANIM_DUR gives their length
     so the game can play them once. */
  const ANIM_DUR = {
    duck: { jump: 1.2, damage: 2.0, interact: 3.2, hurt: 0.5, throw: 0.28 },
    tt: { jump: 1.4, damage: 2.2, interact: 8.0 },
  };

  const DUCK = {
    /* Frantic and expressive: fidgets, whips his head around, taps feet. */
    idle(ctx, t, o) {
      const c = t % 3.6;
      const face = (c > 1.1 && c < 1.5) || (c > 1.8 && c < 2.1) ? -o.face : o.face;   // double-take
      const tap = c > 2.6 && c < 3.2 ? Math.sin((c - 2.6) * 32) : 0;                     // foot tap
      drawPose(ctx, 'duck_walk', { ...o, face,
        sy: 1 + Math.sin(t * 3.4) * 0.022, sx: 1 - Math.sin(t * 3.4) * 0.012,
        rot: Math.sin(t * 2.1) * 0.035 + (c > 1.1 && c < 2.1 ? Math.sin(t * 25) * 0.02 : 0),
        parts: { legL: tap > 0 ? -tap * 0.18 : 0 },
        blink: blinkAt(t, 0.3, 2.3, 0.11) });
    },
    walk(ctx, t, o) {
      const w = t * 10, sw = Math.sin(w);
      drawPose(ctx, 'duck_walk', { ...o,
        dy: -Math.abs(Math.cos(w)) * o.height * 0.04,
        rot: sw * 0.085,
        parts: { legL: sw * 0.42, legR: -sw * 0.42 },
        blink: blinkAt(t, 1.1, 2.6, 0.1) });
    },
    run(ctx, t, o) {
      const w = t * 18, s = Math.sin(w), h = o.height;
      for (let i = 0; i < 3; i++) {
        const p = ((t * 2.4 + i / 3) % 1);
        FX.puff(ctx, o.x - o.face * (h * 0.22 + p * h * 0.4), o.y - p * h * 0.1 - 4, h * (0.035 + p * 0.05), 1 - p);
      }
      FX.lines(ctx, o.x - o.face * h * 0.36, o.y - h * 0.5, h * 0.3, 3, 0.6 + 0.3 * Math.sin(t * 20), o.face);
      drawPose(ctx, 'duck_run', { ...o, dy: -Math.abs(s) * h * 0.06, rot: 0.1 + s * 0.07, sx: 1 + s * 0.04, sy: 1 - s * 0.04 });
      DUCK._qm(ctx, t, o, o.y - h * 0.98 - Math.abs(Math.sin(t * 9)) * h * 0.05);
    },
    _qm(ctx, t, o, qy) {             // the "?!" from the original doodle
      const qm = IMG.duck_qm; if (!qm) return;
      const sc = scaleOf('duck_run', o.height);
      ctx.save(); ctx.translate(o.x + o.face * o.height * 0.06, qy); ctx.rotate(Math.sin(t * 7) * 0.15); ctx.scale(sc, sc);
      ctx.drawImage(o.halo === false ? qm.raw : qm.halo, -qm.w / 2 - HALO_R, -qm.h / 2 - HALO_R); ctx.restore();
    },
    /* In-game airborne pose; o.vy (px/s) shapes the stretch. */
    air(ctx, t, o) {
      const vy = o.vy || 0, k = clamp(-vy / 900, -1, 1);
      drawPose(ctx, 'duck_run', { ...o, rot: Math.sin(t * 26) * 0.2 - k * 0.08,
        sy: 1 + k * 0.08, sx: 1 - k * 0.05 });
    },
    jump(ctx, t, o) {                 // preview version with its own arc
      const D = ANIM_DUR.duck.jump, p = (t % D) / D, h = o.height;
      if (p < 0.12) { const k = Math.sin(p / 0.12 * Math.PI); drawPose(ctx, 'duck_walk', { ...o, sy: 1 - 0.18 * k, sx: 1 + 0.12 * k }); return; }
      if (p < 0.82) {
        const k = (p - 0.12) / 0.7;
        DUCK.air(ctx, t, { ...o, y: o.y - Math.sin(k * Math.PI) * h * 0.7, vy: Math.cos(k * Math.PI) * -900 });
        return;
      }
      const k = (p - 0.82) / 0.18;
      if (k < 0.5) for (let i = -1; i <= 1; i += 2) FX.puff(ctx, o.x + i * h * (0.2 + k * 0.4), o.y - 6, h * 0.06, 1 - k * 2);
      drawPose(ctx, 'duck_walk', { ...o, sy: 1 - 0.2 * Math.sin(k * Math.PI), sx: 1 + 0.14 * Math.sin(k * Math.PI) });
    },
    swim(ctx, t, o) {
      const h = o.height, w = t * 14;
      for (let i = 0; i < 4; i++) {
        const p = ((t * 0.9 + i / 4) % 1);
        FX.bubble(ctx, o.x - o.face * h * (0.5 + hash(i) * 0.2) + Math.sin(t * 3 + i) * 6, o.y - h * 0.5 - p * h * 0.7, h * (0.025 + hash(i + 9) * 0.03), 1 - p);
      }
      drawPose(ctx, 'duck_walk', { ...o, center: true, y: o.y - h * 0.45,
        rot: 1.22 + Math.sin(t * 3.4) * 0.08, dy: Math.sin(t * 3.4) * h * 0.035,
        parts: { legL: Math.sin(w) * 0.65, legR: -Math.sin(w) * 0.65 },
        sx: 1 + Math.sin(w * 0.5) * 0.035, blink: blinkAt(t, 0.5, 2.4, 0.1) });
    },
    /* World 2: free swimming. o.pitch = angle of travel (rad), o.speed 0..1,
       o.boost = boosting, o.after = cosmetic overlay. Centred on (x, y). */
    swimDir(ctx, t, o) {
      const h = o.height, sp = o.speed == null ? 0.5 : o.speed, w = t * (6 + sp * 14) * (o.boost ? 1.8 : 1);
      if (o.boost) for (let i = 0; i < 5; i++) {
        const p = ((t * 3 + i / 5) % 1);
        FX.bubble(ctx, o.x - o.face * h * (0.35 + p * 0.6) * Math.cos(o.pitch || 0), o.y - Math.sin(o.pitch || 0) * h * (0.35 + p * 0.6) * o.face + Math.sin(i * 7 + t * 9) * 8, h * (0.02 + hash(i) * 0.025), 1 - p);
      }
      const pitch = U_clamp(o.pitch || 0, -1.0, 1.0);
      drawPose(ctx, 'duck_walk', { ...o, center: true, y: o.y,
        rot: 1.25 + pitch + Math.sin(t * 3.4) * 0.05,
        parts: { legL: Math.sin(w) * (0.4 + sp * 0.4), legR: -Math.sin(w) * (0.4 + sp * 0.4) },
        sx: 1 + Math.sin(w * 0.5) * 0.03, blink: o.stun ? 1 : blinkAt(t, 0.5, 2.4, 0.1) });
    },
    /* Short in-game hit reaction */
    hurt(ctx, t, o) {
      const k = clamp(t / ANIM_DUR.duck.hurt, 0, 1);
      drawPose(ctx, 'duck_walk', { ...o, rot: -Math.sin(k * Math.PI) * 0.45, dx: Math.sin(t * 60) * o.height * 0.02 * (1 - k),
        sy: 1 - Math.sin(k * Math.PI) * 0.1, blink: 1 });
    },
    /* Quick in-game throw: lean into it, wing snaps forward */
    throw(ctx, t, o) {
      const k = clamp(t / ANIM_DUR.duck.throw, 0, 1), s = Math.sin(k * Math.PI);
      drawPose(ctx, 'duck_walk', { ...o, rot: s * 0.22, sx: 1 + s * 0.06, sy: 1 - s * 0.05 });
    },
    damage(ctx, t, o) {               // dramatic collapse
      const D = ANIM_DUR.duck.damage, p = (t % D) / D, h = o.height;
      let rot = 0, dx = 0, dy = 0, sy = 1;
      if (p < 0.12) { dx = Math.sin(p * 200) * h * 0.04; }
      else if (p < 0.32) { const k = ease((p - 0.12) / 0.2); rot = -k * 1.5; dx = -o.face * k * h * 0.25; dy = -Math.sin(k * Math.PI) * h * 0.2; }
      else if (p < 0.82) { rot = -1.5; dx = -o.face * h * 0.25; sy = 1 - 0.05 * Math.sin((p - 0.32) * 40) * Math.max(0, 1 - (p - 0.32) * 6); }
      else { const k = ease((p - 0.82) / 0.18); rot = -1.5 * (1 - k); dx = -o.face * h * 0.25 * (1 - k); dy = -Math.sin(k * Math.PI) * h * 0.25; }
      drawPose(ctx, 'duck_walk', { ...o, rot, dx, dy, sy, blink: p > 0.3 && p < 0.82 ? 1 : 0 });
      if (p > 0.3 && p < 0.84) {
        const cx = o.x - o.face * h * 1.0, cy = o.y - h * 0.28;
        for (let i = 0; i < 3; i++) {
          const a = t * 5 + i * TAU / 3;
          FX.star(ctx, cx + Math.cos(a) * h * 0.16, cy + Math.sin(a) * h * 0.06, h * 0.045, t * 3 + i);
        }
      }
    },
    /* Over-the-top: hops, kicks, waves the spinning knife (standing drawing
       so his size and proportions match gameplay). */
    victory(ctx, t, o) {
      const h = o.height, hop = Math.abs(Math.sin(t * 6));
      const cols = ['#9fe3c3', '#f6c7b6', '#c9b8f0', '#fff1b8', '#a9d8f5'];
      for (let i = 0; i < 16; i++) {
        const p = ((t * 0.55 + hash(i)) % 1);
        const x = o.x + (hash(i + 3) - 0.5) * h * 2.2 + Math.sin(t * 2 + i) * 10;
        const y = o.y - h * 1.5 + p * h * 1.4;
        ctx.save(); ctx.globalAlpha *= 1 - p * 0.8; ctx.translate(x, y); ctx.rotate(t * 4 + i);
        ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-4, -2.5, 8, 5); ctx.restore();
      }
      const spin = (t % 3.0) > 2.4 ? Math.cos(((t % 3.0) - 2.4) / 0.6 * TAU) : 1;
      const kick = Math.sin(t * 12);
      drawPose(ctx, 'duck_walk', { ...o, dy: -hop * h * 0.18, sx: spin, sy: 1 + (hop - 0.5) * 0.06,
        rot: Math.sin(t * 6) * 0.1, parts: { legL: kick * 0.5 * hop, legR: -kick * 0.5 * hop },
        blink: blinkAt(t, 0.2, 2.9, 0.12) });
    },
    /* KNIVES UP MY SLEEVE: reaches in, pulls knife after knife out of BOTH
       sleeves (they fan out around him), shows them off, then flings them. */
    interact(ctx, t, o) {
      const D = ANIM_DUR.duck.interact, tt = t % D, h = o.height;
      const N = 6, pullStart = 0.35, pullGap = 0.2, showT = pullStart + N * pullGap + 0.1, throwT = showT + 0.35;
      let arm = 0, sx = 1, sy = 1, dy = 0, rot = 0;
      if (tt < pullStart) { const k = ease(tt / pullStart); arm = -0.5 * k; sy = 1 - 0.07 * k; rot = -0.05 * k; }
      else if (tt < showT) {
        // each pull: a little yank of the body and the arm
        const i = Math.floor((tt - pullStart) / pullGap), k = ((tt - pullStart) % pullGap) / pullGap;
        const yank = Math.sin(k * Math.PI) * (i % 2 ? 1 : -1);
        arm = -0.5 + (i % 2 ? 0.35 : -0.1) * Math.sin(k * Math.PI); rot = yank * 0.06; sy = 0.95 + Math.sin(k * Math.PI) * 0.06;
      } else if (tt < throwT) { const k = ease(seg(tt, showT, throwT)); arm = -0.5 + 1.1 * k; sy = 1 + 0.06 * k; dy = -h * 0.04 * k; }
      else { const k = seg(tt, throwT, throwT + 0.3); arm = 0.6 * (1 - ease(k)); sy = 1.06 - 0.06 * k; dy = -h * 0.04 * (1 - k); }
      const po = { ...o, sx, sy, dy, rot, parts: { arm } };
      drawPose(ctx, 'duck_hero', po);
      const ksize = h * 0.24;   // matches the knife's size in the drawing
      for (let i = 0; i < N; i++) {
        const born = pullStart + i * pullGap;
        if (tt < born) continue;
        const hi = i % 2 === 1;                       // alternate sleeves
        const sp = posePoint('duck_hero', po, hi ? SLEEVE_HI[0] : SLEEVE_LO[0], hi ? SLEEVE_HI[1] : SLEEVE_LO[1]);
        const fanIdx = Math.floor(i / 2);
        const ang = hi ? (-1.45 + fanIdx * 0.55) : (Math.PI + 0.75 - fanIdx * 0.6);
        const out = easeOutBack(seg(tt, born, born + 0.22));
        let x = sp[0] + Math.cos(ang) * out * h * 0.3, y = sp[1] + Math.sin(ang) * out * h * 0.3;
        let a = ang, alpha = 1;
        if (tt < throwT) { y += Math.sin(t * 6 + i) * h * 0.01; }
        else {
          const k = seg(tt, throwT, D - 0.15);
          const fly = easeOut(k) * h * 1.3;
          x += Math.cos(ang) * fly; y += Math.sin(ang) * fly; a = ang + k * 14 * (hi ? 1 : -1); alpha = 1 - k;
        }
        // knives slide out handle-first from the sleeve: draw along the fan angle
        drawKnife(ctx, x, y, a, ksize, o.halo, alpha);
        if (tt - born < 0.18) FX.star(ctx, x, y, h * 0.06 * Math.sin(seg(tt, born, born + 0.18) * Math.PI), 0.4, '#fff1b8');
      }
      if (tt > pullStart && tt < showT) {
        const n = Math.min(N, Math.floor((tt - pullStart) / pullGap) + 1);
        FX.text(ctx, 'x' + n, o.x + h * 0.42, o.y - h * 0.72, h * 0.11, { fill: '#fff1b8' });
      }
      if (tt > throwT && tt < D - 0.3) FX.text(ctx, 'QUACK!', o.x - h * 0.36, o.y - h * 0.82, h * 0.15,
        { rot: -0.15, scale: easeOutBack(seg(tt, throwT, throwT + 0.15)), fill: '#fff1b8' });
    },
  };

  const TT = {
    /* Composed: barely moves. Slow breath, slow blink, glasses glint. */
    idle(ctx, t, o) {
      drawPose(ctx, 'tt_hold', { ...o,
        sy: 1 + Math.sin(t * 1.1) * 0.01, rot: Math.sin(t * 0.5) * 0.01,
        parts: { sparkle: Math.sin(t * 1.2) * 0.05 }, pscale: { sparkle: 0.9 + 0.1 * Math.sin(t * 1.6) },
        partAlpha: { sparkle: 0.55 + 0.45 * Math.abs(Math.sin(t * 1.2)) },
        blink: blinkAt(t, 1.7, 5.0, 0.42) });
    },
    walk(ctx, t, o) {
      const w = t * 3.0, s = Math.sin(w);
      drawPose(ctx, 'tt_side', { ...o, dy: -Math.abs(Math.cos(w)) * o.height * 0.01,
        rot: s * 0.012, parts: { flipF: s * 0.22, flipB: -s * 0.22 }, blink: blinkAt(t, 0.8, 5.2, 0.38) });
    },
    run(ctx, t, o) {                   // surprisingly fast, still unbothered
      const w = t * 19, s = Math.sin(w), h = o.height;
      FX.lines(ctx, o.x - o.face * h * 0.45, o.y - h * 0.18, h * 0.5, 4, 0.75, o.face);
      for (let i = 0; i < 3; i++) {
        const p = ((t * 3 + i / 3) % 1);
        FX.puff(ctx, o.x - o.face * (h * 0.3 + p * h * 0.5), o.y - p * h * 0.06 - 3, h * (0.025 + p * 0.04), 1 - p);
      }
      drawPose(ctx, 'tt_side', { ...o, dy: -Math.abs(s) * h * 0.02, rot: 0.04,
        parts: { flipF: s * 0.55, flipB: -s * 0.55 } });
    },
    jump(ctx, t, o) {                  // shell-assisted spin
      const D = ANIM_DUR.tt.jump, p = (t % D) / D, h = o.height;
      if (p < 0.14 || p >= 0.84) {
        const k = p < 0.14 ? Math.sin(p / 0.14 * Math.PI) : Math.sin((p - 0.84) / 0.16 * Math.PI);
        drawPose(ctx, 'tt_side', { ...o, sy: 1 - 0.12 * k, sx: 1 + 0.08 * k }); return;
      }
      const k = (p - 0.14) / 0.7;
      drawPose(ctx, 'tt_side', { ...o, center: true, y: o.y - h * 0.14 - Math.sin(k * Math.PI) * h * 0.8,
        rot: ease(k) * TAU, parts: { flipF: -0.6, flipB: 0.6 } });
    },
    swim(ctx, t, o) {
      const h = o.height, w = t * 3.6;
      for (let i = 0; i < 3; i++) {
        const p = ((t * 0.5 + i / 3) % 1);
        FX.bubble(ctx, o.x - o.face * h * (0.6 + hash(i) * 0.2), o.y - h * 0.3 - p * h * 0.6, h * (0.022 + hash(i + 5) * 0.02), 1 - p);
      }
      drawPose(ctx, 'tt_side', { ...o, y: o.y - h * 0.1, dy: Math.sin(t * 1.7) * h * 0.035, rot: Math.cos(t * 1.7) * 0.04,
        parts: { flipF: Math.sin(w) * 0.48, flipB: Math.sin(w + 0.6) * 0.38 }, blink: blinkAt(t, 2, 5, 0.38) });
    },
    /* World 2: smooth, effortless swimming that follows her direction */
    swimDir(ctx, t, o) {
      const h = o.height, sp = o.speed == null ? 0.5 : o.speed, w = t * (3 + sp * 5);
      const pitch = U_clamp(o.pitch || 0, -0.8, 0.8);
      drawPose(ctx, 'tt_side', { ...o, center: true, y: o.y + Math.sin(t * 1.7) * h * 0.02,
        rot: pitch, parts: { flipF: Math.sin(w) * 0.5, flipB: Math.sin(w + 0.6) * 0.4 }, blink: blinkAt(t, 2, 5, 0.38) });
    },
    damage(ctx, t, o) {               // unimpressed
      const D = ANIM_DUR.tt.damage, p = (t % D) / D, h = o.height;
      const k = p < 0.15 ? Math.sin(p / 0.15 * Math.PI) : 0;
      drawPose(ctx, 'tt_hold', { ...o, dx: -o.face * k * h * 0.04, sx: 1 + k * 0.03, sy: 1 - k * 0.04,
        partAlpha: { sparkle: 0 }, blink: p > 0.2 && p < 0.75 ? 1 : 0 });
      if (p > 0.25) {
        const n = Math.min(3, Math.floor((p - 0.25) / 0.14) + 1);
        FX.text(ctx, '.'.repeat(n), o.x + h * 0.3, o.y - h * 0.62, h * 0.12, { weight: 900 });
      }
    },
    victory(ctx, t, o) {               // tiny satisfied bob
      const h = o.height;
      drawPose(ctx, 'tt_cool', { ...o, dy: -Math.abs(Math.sin(t * 1.8)) * h * 0.02, rot: Math.sin(t * 0.9) * 0.02 });
      const g = (t % 3) / 3;
      if (g < 0.2) { const pt = posePoint('tt_cool', o, 95, 70); FX.star(ctx, pt[0], pt[1], h * 0.06 * Math.sin(g / 0.2 * Math.PI), g * 4); }
    },
    interact(ctx, t, o) { TT.signature(ctx, t % ANIM_DUR.tt.interact, o); },
    /* The sunglasses moment, slow and deliberate:
       0.0–1.6  holds them; sparkles slowly build
       1.6–2.0  cross-fade to the wearing drawing, glasses still low
       2.0–4.9  raises them into place (slowly)
       4.9–5.5  lens sparkle
       5.5–6.2  a beat of silence (the pause)
       6.2      EMOTIONAL DAMAGE */
    signature(ctx, t, o) {
      const h = o.height;
      const vig = seg(t, 1.4, 2.4) * (t > 7.3 ? 1 - seg(t, 7.3, 7.9) : 1);
      FX.spotlight(ctx, o.x, o.y - h * 0.32, h * 0.3, h * 1.25, vig);
      const xf = seg(t, 1.6, 2.0);
      if (xf < 1) {
        const k = seg(t, 0, 1.6);
        drawPose(ctx, 'tt_hold', { ...o, alpha: 1 - xf, pscale: { sparkle: 1 + k * 0.45 }, parts: { sparkle: k * 0.3 },
          partAlpha: { sparkle: 0.6 + 0.4 * Math.abs(Math.sin(t * (2 + k * 5))) }, sy: 1 + k * 0.015 });
      }
      if (xf > 0) {
        const raise = ease(seg(t, 2.0, 4.9));
        const push = t > 4.95 && t < 5.45 ? Math.sin(seg(t, 4.95, 5.45) * Math.PI) : 0;   // gentle adjust
        drawPose(ctx, 'tt_cool', { ...o, alpha: xf,
          offs: { glasses: [(1 - raise) * 70, (1 - raise) * 175 - push * 7] },
          parts: { glasses: (1 - raise) * 0.55 } });
      }
      if (t > 4.9 && t < 5.6) {
        const pt = posePoint('tt_cool', o, 95, 70);
        FX.star(ctx, pt[0], pt[1], h * 0.11 * Math.sin(seg(t, 4.9, 5.6) * Math.PI), seg(t, 4.9, 5.6) * 2);
      }
      if (t > 6.2) {
        const k = seg(t, 6.2, 6.5);
        const fade = t > 7.3 ? 1 - seg(t, 7.3, 7.8) : 1;
        const shake = t < 6.6 ? Math.sin(t * 90) * h * 0.008 : 0;
        ctx.save(); ctx.globalAlpha *= fade * clamp(k * 3, 0, 1);
        FX.text(ctx, 'EMOTIONAL DAMAGE', o.x + shake, o.y - h * 0.82, h * 0.13,
          { rot: -0.06, scale: 2.2 - 1.2 * easeOutBack(k), shadow: '#f19a8a' });
        ctx.restore();
      }
    },
  };

  function draw(ctx, who, anim, t, x, y, height, opts) {
    const o = Object.assign({ x, y, height, face: 1 }, opts || {});
    const set = who === 'duck' ? DUCK : TT;
    (set[anim] || set.idle)(ctx, t, o);
  }

  /* Portraits for dialogue boxes / profile cards. size = character scale. */
  function portrait(ctx, who, mood, t, cx, by, size, opts) {
    const o = Object.assign({ x: cx, y: by, height: size, face: 1 }, opts || {});
    const talk = mood === 'talk' || mood === 'shout' ? Math.abs(Math.sin(t * 16)) : 0;
    if (who === 'duck') {
      const hero = mood === 'hero';
      drawPose(ctx, hero ? 'duck_hero' : 'duck_face', { ...o,
        sy: 1 + talk * 0.05 + Math.sin(t * 2.6) * 0.012, sx: 1 - talk * 0.02,
        rot: mood === 'shout' ? Math.sin(t * 34) * 0.035 : Math.sin(t * 1.9) * 0.02,
        parts: { arm: Math.sin(t * 3) * 0.12 }, blink: blinkAt(t, 0.4, 2.6, 0.1) });
    } else {
      const cool = mood === 'cool';
      drawPose(ctx, cool ? 'tt_cool' : 'tt_hold', { ...o,
        sy: 1 + talk * 0.015 + Math.sin(t * 1.1) * 0.006,
        partAlpha: { sparkle: 0.6 + 0.4 * Math.abs(Math.sin(t * 1.2)) },
        blink: cool ? 0 : blinkAt(t, 1.2, 5, 0.42) });
    }
  }

  G.Chars = { load, draw, drawPose, posePoint, portrait, drawKnife, FX, POSES, IMG, ANIM_DUR, scaleOf, COSMETICS,
    ANIMS: ['idle', 'walk', 'run', 'jump', 'swim', 'damage', 'victory', 'interact'] };
})(window);
