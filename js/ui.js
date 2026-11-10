/* =====================================================================
   ui.js — DOM interface on top of the canvas
   Menus, settings, confirmation boxes, HUD, toasts and the dialogue box.
   The #ui layer is a fixed 1280×720 box scaled with the canvas, so the
   layout is identical at every screen size.
   ===================================================================== */
(function (G) {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const layer = $('#layer');

  const UI = { busy: false, stack: [] };

  /* ---------------- panels / menus ---------------- */
  function sound(n) { G.Audio && G.Audio.sfx(n); }
  function wireButton(b, fn) {
    b.addEventListener('click', (e) => { e.preventDefault(); sound('confirm'); fn(); });
    b.addEventListener('mouseenter', () => { b.focus({ preventScroll: true }); });
    b.addEventListener('focus', () => sound('hover'));
  }
  /* open a panel; returns { el, close() }. opts.onBack runs on Esc. */
  UI.open = function (panel, opts) {
    opts = opts || {};
    const wrap = el('div', 'overlay' + (opts.dim === false ? ' clear' : ''));
    wrap.appendChild(panel); layer.appendChild(wrap);
    const entry = { el: wrap, panel, onBack: opts.onBack, prevFocus: document.activeElement };
    UI.stack.push(entry);
    requestAnimationFrame(() => { wrap.classList.add('in'); const f = panel.querySelector('[autofocus], button:not([disabled]), input'); if (f) f.focus({ preventScroll: true }); });
    entry.close = () => {
      const i = UI.stack.indexOf(entry); if (i >= 0) UI.stack.splice(i, 1);
      wrap.remove();
      const top = UI.stack[UI.stack.length - 1];
      if (top) { const f = top.panel.querySelector('button:not([disabled])'); if (f) f.focus({ preventScroll: true }); }
    };
    return entry;
  };
  UI.closeAll = function () { while (UI.stack.length) UI.stack[UI.stack.length - 1].close(); };
  UI.isOpen = () => UI.stack.length > 0;

  /* menu: { title, sub, items:[{label, action, disabled, hint}], onBack, cls } */
  UI.menu = function (o) {
    const p = el('div', 'panel menu ' + (o.cls || ''));
    if (o.title) p.appendChild(el('h2', 'panel-title', esc(o.title)));
    if (o.sub) p.appendChild(el('p', 'panel-sub', o.sub));
    const list = el('div', 'menu-list');
    let entry;
    o.items.forEach((it) => {
      const b = el('button', 'btn' + (it.primary ? ' primary' : '') + (it.danger ? ' danger' : ''), esc(it.label));
      if (it.disabled) b.disabled = true;
      if (it.hint) b.title = it.hint;
      wireButton(b, () => it.action(entry));
      list.appendChild(b);
    });
    p.appendChild(list);
    entry = UI.open(p, { onBack: o.onBack, dim: o.dim });
    return entry;
  };

  UI.confirm = function (title, text, yes, no) {
    return new Promise((res) => {
      const p = el('div', 'panel confirm');
      p.appendChild(el('h2', 'panel-title', esc(title)));
      p.appendChild(el('p', 'panel-sub', esc(text)));
      const row = el('div', 'row');
      const bNo = el('button', 'btn', esc(no || 'Cancel')), bYes = el('button', 'btn danger', esc(yes || 'Yes'));
      row.append(bNo, bYes); p.appendChild(row);
      let entry;
      const done = (v) => { entry.close(); res(v); };
      wireButton(bNo, () => done(false)); wireButton(bYes, () => done(true));
      entry = UI.open(p, { onBack: () => done(false) });
      setTimeout(() => bNo.focus({ preventScroll: true }), 30);
    });
  };

  UI.settings = function (onClose) {
    const s = G.Save.data.settings;
    const p = el('div', 'panel settings');
    p.appendChild(el('h2', 'panel-title', 'Settings'));
    const mk = (id, label, key) => {
      const r = el('label', 'slider');
      r.innerHTML = '<span>' + label + '</span><input type="range" id="' + id + '" min="0" max="100" step="1"><b></b>';
      const inp = r.querySelector('input'), out = r.querySelector('b');
      inp.value = Math.round(s[key] * 100); out.textContent = inp.value;
      inp.addEventListener('input', () => { s[key] = inp.value / 100; out.textContent = inp.value; G.Audio.applyVolumes(); });
      inp.addEventListener('change', () => { G.Save.write(); sound('click'); });
      return r;
    };
    p.append(mk('vol-master', 'Master volume', 'master'), mk('vol-music', 'Music', 'music'), mk('vol-sfx', 'Sound effects', 'sfx'));
    const mute = el('button', 'btn toggle', '');
    const paintMute = () => { mute.textContent = s.muted ? 'Sound: OFF (muted)' : 'Sound: ON'; mute.setAttribute('aria-pressed', s.muted); };
    paintMute();
    wireButton(mute, () => { s.muted = !s.muted; paintMute(); G.Audio.applyVolumes(); G.Save.write(); UI.syncMute(); });
    p.appendChild(mute);
    if (!G.Save.available) p.appendChild(el('p', 'warn', 'Your browser is blocking storage, so progress will not be saved after you close this tab.'));
    const row = el('div', 'row');
    const reset = el('button', 'btn danger', 'Reset progress');
    const back = el('button', 'btn primary', 'Back');
    row.append(reset, back); p.appendChild(row);
    let entry;
    wireButton(back, () => { entry.close(); onClose && onClose(); });
    wireButton(reset, async () => {
      const ok = await UI.confirm('Reset all progress?', 'This erases completed worlds, collectibles, achievements and quotes. Volume settings are kept. This cannot be undone.', 'Erase progress', 'Keep my progress');
      if (ok) { G.Save.resetProgress(); UI.toast('Progress reset', 'Starting fresh.'); entry.close(); if (G.Scenes.name !== 'title') G.Scenes.go('title'); else G.Scenes.go('title'); }
    });
    entry = UI.open(p, { onBack: () => { entry.close(); onClose && onClose(); } });
    return entry;
  };

  UI.howto = function (onClose) {
    const C = G.Content;
    const p = el('div', 'panel howto');
    p.appendChild(el('h2', 'panel-title', 'How to play'));
    const tbl = el('div', 'keys');
    C.HOWTO.forEach(([a, k]) => { tbl.appendChild(el('span', 'k-act', esc(a))); tbl.appendChild(el('span', 'k-key', esc(k))); });
    p.appendChild(tbl);
    if (C.HOWTO_INK) {
      p.appendChild(el('h3', 'howto-sub', 'World 3 — ink'));
      const t3 = el('div', 'keys');
      C.HOWTO_INK.forEach(([a, k]) => { t3.appendChild(el('span', 'k-act', esc(a))); t3.appendChild(el('span', 'k-key', esc(k))); });
      p.appendChild(t3);
    }
    if (C.HOWTO_SWIM) {
      p.appendChild(el('h3', 'howto-sub', 'World 2 — swimming'));
      const t2 = el('div', 'keys');
      C.HOWTO_SWIM.forEach(([a, k]) => { t2.appendChild(el('span', 'k-act', esc(a))); t2.appendChild(el('span', 'k-key', esc(k))); });
      p.appendChild(t2);
    }
    p.appendChild(el('p', 'panel-sub', esc(C.HOWTO_NOTE)));
    const back = el('button', 'btn primary', 'Got it');
    p.appendChild(back);
    let entry;
    wireButton(back, () => { entry.close(); onClose && onClose(); });
    entry = UI.open(p, { onBack: () => { entry.close(); onClose && onClose(); } });
    return entry;
  };

  /* Esc closes the top panel; arrow keys move between its buttons */
  window.addEventListener('keydown', (e) => {
    const top = UI.stack[UI.stack.length - 1];
    if (!top || UI.busy) return;
    if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); if (top.onBack) { sound('back'); top.onBack(); } return; }
    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
      const bs = [...top.panel.querySelectorAll('button:not([disabled]), input')];
      const i = bs.indexOf(document.activeElement);
      const n = bs[(i + (e.code === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length];
      if (n) { e.preventDefault(); n.focus({ preventScroll: true }); }
    }
  }, true);

  /* ---------------- toasts ---------------- */
  UI.toast = function (title, body, kind) {
    const t = el('div', 'toast ' + (kind || ''), '<b>' + esc(title) + '</b>' + (body ? '<span>' + esc(body) + '</span>' : ''));
    $('#toasts').appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, 3200);
  };

  /* ---------------- mute button (always visible in a corner) ---------------- */
  UI.syncMute = function () {
    const b = $('#muteBtn'); if (!b) return;
    const m = G.Save.data.settings.muted;
    b.textContent = m ? '🔇' : '🔊'; b.setAttribute('aria-label', m ? 'Unmute' : 'Mute'); b.title = m ? 'Unmute (M)' : 'Mute (M)';
  };
  function toggleMute() { const s = G.Save.data.settings; s.muted = !s.muted; G.Audio.applyVolumes(); G.Save.write(); UI.syncMute(); }
  $('#muteBtn').addEventListener('click', (e) => { e.preventDefault(); toggleMute(); e.currentTarget.blur(); });
  window.addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !(e.target && e.target.tagName === 'INPUT')) toggleMute(); });

  /* ---------------- HUD ---------------- */
  const hud = $('#hud');
  UI.hud = {
    show(cfg) {
      if (cfg.kind === 'swim') return this.showSwim(cfg);
      if (cfg.kind === 'ink') return this.showInk(cfg);
      this.kind = 'plat';
      hud.hidden = false;
      hud.innerHTML = '';
      const card = el('div', 'hud-card');
      card.innerHTML = '<div class="hud-name">DUCKQUACKQUACK <i>Lv 07</i></div><div class="hud-hp"><em>HP</em><div class="bar"></div></div>';
      const bar = card.querySelector('.bar');
      for (let i = 0; i < cfg.maxHp; i++) bar.appendChild(el('span', 'pip'));
      const stage = el('div', 'hud-stage', '<small>' + esc(cfg.number) + '</small>' + esc(cfg.title));
      const right = el('div', 'hud-right');
      right.innerHTML = '<div class="hud-item" id="hudItem"></div><div class="hud-item" id="hudCorn"></div><div class="hud-item hud-time" id="hudTime"></div>';
      const knife = el('div', 'hud-knife', '<span>KNIFE</span><div class="kbar"><i></i></div>');
      hud.append(card, stage, right, knife);
      this.pips = [...bar.children];
      this.item = $('#hudItem'); this.corn = $('#hudCorn'); this.time = $('#hudTime'); this.kbar = knife.querySelector('i');
      this.cache = {};
    },
    /* World 2 HUD: timer, boost charges, race progress, tokens */
    showSwim(cfg) {
      this.kind = 'swim';
      hud.hidden = false; hud.innerHTML = '';
      const card = el('div', 'hud-card');
      card.innerHTML = '<div class="hud-name">DUCKQUACKQUACK <i>Lv 07</i></div><div class="hud-hp"><em>BOOST</em><div class="bar boost"></div></div>';
      const bar = card.querySelector('.bar');
      for (let i = 0; i < cfg.maxBoost; i++) bar.appendChild(el('span', 'pip bubble'));
      const stage = el('div', 'hud-stage', '<small>' + esc(cfg.number) + '</small>' + esc(cfg.title));
      const timer = el('div', 'hud-timer', '<small>TIME</small><b id="hudTimer">0.0</b>');
      const race = el('div', 'hud-race', '<span class="lane"></span><i class="tt" title="Turtletimee"></i><i class="duck" title="Duckquackquack"></i><em class="flag">FINISH</em>');
      const right = el('div', 'hud-right');
      right.innerHTML = '<div class="hud-item" id="hudItem"></div>';
      hud.append(card, stage, timer, race, right);
      this.pips = [...bar.children]; this.item = $('#hudItem'); this.timer = $('#hudTimer'); this.timerBox = timer;
      this.raceDuck = race.querySelector('.duck'); this.raceTT = race.querySelector('.tt');
      this.cache = {};
    },
    /* World 3 HUD: ink tank, KNIVES special meter, timer, coverage vs. target */
    showInk(cfg) {
      this.kind = 'ink';
      hud.hidden = false; hud.innerHTML = '';
      const card = el('div', 'hud-card');
      card.innerHTML = '<div class="hud-name">DUCKQUACKQUACK <i>Lv 07</i></div>' +
        '<div class="hud-meter"><em>INK</em><div class="mbar ink"><i></i></div></div>' +
        '<div class="hud-meter"><em>KNIVES</em><div class="mbar knives"><i></i></div><b class="ready">SPACE!</b></div>';
      const cov = el('div', 'hud-cover', '<div class="cv-time"><span>' + esc(cfg.number) + ' · ' + esc(cfg.title) + '</span><b id="hudTimer">0</b></div><div class="cv-head"><span>YOUR INK</span><b id="cvPct">0%</b></div><div class="cv-bar"><i class="me"></i><i class="them"></i><span class="goal" style="left:' + cfg.goal + '%"><em>' + cfg.goal + '%</em></span></div><div class="cv-them">SMUDGES <b id="cvThem">0%</b></div>');
      hud.append(card, cov);
      this.inkBar = card.querySelector('.mbar.ink i'); this.knBar = card.querySelector('.mbar.knives i'); this.knBox = card.querySelector('.mbar.knives').parentNode;
      this.timer = $('#hudTimer'); this.timerBox = cov; this.cvMe = cov.querySelector('.me'); this.cvThem = cov.querySelector('.them');
      this.cvPct = $('#cvPct'); this.cvThemPct = $('#cvThem'); this.cvBox = cov;
      this.cache = {};
    },
    hide() { hud.hidden = true; },
    set(k, v) {
      if (this.cache[k] === v) return; this.cache[k] = v;
      if (this.kind === 'ink') {
        if (k === 'ink') this.inkBar.style.transform = 'scaleX(' + v + ')';
        else if (k === 'knives') { this.knBar.style.transform = 'scaleX(' + Math.min(1, v) + ')'; this.knBox.classList.toggle('full', v >= 1); }
        else if (k === 'timer') this.timer.textContent = v;
        else if (k === 'warn') this.timerBox.classList.toggle('warn', !!v);
        else if (k === 'cover') { const [me, them] = v.split(','); this.cvMe.style.width = me + '%'; this.cvThem.style.width = them + '%'; this.cvPct.textContent = Math.floor(+me) + '%'; this.cvThemPct.textContent = Math.floor(+them) + '%'; }
        else if (k === 'goalMet') this.cvBox.classList.toggle('met', !!v);
        return;
      }
      if (this.kind === 'swim') {
        if (k === 'boost') this.pips.forEach((p, i) => p.classList.toggle('on', i < v));
        else if (k === 'timer') this.timer.textContent = v;
        else if (k === 'warn') this.timerBox.classList.toggle('warn', !!v);
        else if (k === 'item') this.item.innerHTML = v;
        else if (k === 'race') { const [d, t] = v.split(','); this.raceDuck.style.left = d + '%'; this.raceTT.style.left = t + '%'; }
        return;
      }
      if (k === 'hp') this.pips.forEach((p, i) => p.classList.toggle('on', i < v));
      else if (k === 'item') this.item.innerHTML = v;
      else if (k === 'corn') this.corn.innerHTML = v;
      else if (k === 'time') this.time.textContent = v;
      else if (k === 'knife') this.kbar.style.transform = 'scaleX(' + v + ')';
    },
    flash(k) { const n = k === 'hp' ? hud.querySelector('.hud-card') : k === 'timer' ? this.timerBox : this.item; if (!n) return; n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash'); },
  };

  /* ---------------- dialogue ----------------
     UI.say(lines) → Promise that resolves when the player has read every
     line. Advance with Enter / Space / E or a click on the box. A line
     that is still typing finishes first; nothing auto-skips. */
  const dlg = $('#dialogue');
  const dPort = $('#dPortrait'), dName = $('#dName'), dTag = $('#dTag'), dText = $('#dText'), dMore = $('#dMore');
  const pctx = dPort.getContext('2d');
  let D = null;
  function portraitLoop() {
    if (!D) return;
    const t = (performance.now() - D.t0) / 1000;
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.clearRect(0, 0, dPort.width, dPort.height);
    const L = D.lines[D.i];
    if (L && L.who !== 'narr' && window.Chars) {
      const typing = D.shown < L.text.length;
      const mood = L.mood || (L.who === 'duck' ? 'talk' : 'idle');
      const m = typing && mood === 'idle' ? 'talk' : (typing ? mood : (mood === 'talk' || mood === 'shout' ? 'idle' : mood));
      if (L.who === 'duck') Chars.portrait(pctx, 'duck', m === 'idle' ? 'talk-idle' : m, typing ? t : 0.3, 120, 236, m === 'hero' ? 330 : 340);
      else Chars.portrait(pctx, 'tt', mood === 'cool' ? 'cool' : (typing ? 'talk' : 'idle'), t, 120, 232, 330);
    }
    D.raf = requestAnimationFrame(portraitLoop);
  }
  function showLine() {
    const L = D.lines[D.i];
    dlg.className = 'dialogue in who-' + L.who;
    dName.textContent = G.Content.NAMES[L.who] || '';
    dTag.textContent = L.tag || '';
    dText.textContent = '';
    D.shown = 0; D.acc = 0; D.lineStart = performance.now();
    dMore.hidden = true;
    if (L.who === 'duck' && /shout|hero/.test(L.mood || '') && Math.random() < 0.6) G.Audio.sfx('quack');
  }
  function typeTick(now) {
    if (!D) return;
    const L = D.lines[D.i];
    const dt = Math.min(0.05, (now - (D.lastTick || now)) / 1000); D.lastTick = now;
    if (D.shown < L.text.length) {
      D.acc += dt * (L.who === 'tt' ? 42 : L.who === 'narr' ? 48 : 58);
      let changed = false;
      while (D.acc >= 1 && D.shown < L.text.length) {
        D.acc -= 1; D.shown++; changed = true;
        const ch = L.text[D.shown - 1];
        if (ch === '.' || ch === '?' || ch === '!') D.acc -= 4;            // small pause at punctuation
        if (ch !== ' ' && D.shown % 2 === 0 && L.who !== 'narr') G.Audio.sfx(L.who === 'tt' ? 'textTT' : 'text');
      }
      if (changed) dText.textContent = L.text.slice(0, D.shown);
      if (D.shown >= L.text.length) dMore.hidden = false;
    }
    D.tick = requestAnimationFrame(typeTick);
  }
  function advance() {
    if (!D) return;
    const L = D.lines[D.i];
    if (performance.now() - D.lineStart < 160) return;      // guard against double presses
    if (D.shown < L.text.length) { D.shown = L.text.length; dText.textContent = L.text; dMore.hidden = false; return; }
    sound('click');
    D.i++;
    if (D.i >= D.lines.length) { finish(); return; }
    showLine();
  }
  function finish() {
    const d = D; D = null; UI.busy = false;
    cancelAnimationFrame(d.raf); cancelAnimationFrame(d.tick);
    dlg.className = 'dialogue';
    G.Input.clear();
    d.resolve();
  }
  UI.say = function (lines) {
    if (!lines || !lines.length) return Promise.resolve();
    return new Promise((resolve) => {
      if (D) finish();
      UI.busy = true; G.Input.clear();
      D = { lines, i: 0, resolve, t0: performance.now(), shown: 0, acc: 0, lineStart: 0 };
      showLine();
      D.raf = requestAnimationFrame(portraitLoop);
      D.tick = requestAnimationFrame(typeTick);
    });
  };
  UI.inDialogue = () => !!D;
  UI.cancelSay = () => { if (D) finish(); };
  window.addEventListener('keydown', (e) => {
    if (!D || UI.stack.length) return;
    if (['Enter', 'NumpadEnter', 'Space', 'KeyE'].includes(e.code)) { e.preventDefault(); if (!e.repeat) advance(); }
  });
  dlg.addEventListener('click', (e) => { e.preventDefault(); if (!UI.stack.length) advance(); });

  /* ---------------- big title cards ---------------- */
  UI.card = function (small, big, sub, ms) {
    return new Promise((res) => {
      const c = el('div', 'titlecard', '<small>' + esc(small) + '</small><h1>' + esc(big) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : ''));
      layer.appendChild(c);
      requestAnimationFrame(() => c.classList.add('in'));
      setTimeout(() => { c.classList.remove('in'); c.classList.add('out'); setTimeout(() => { c.remove(); res(); }, 600); }, ms || 2600);
    });
  };

  /* full-screen fade (black) */
  UI.fade = function (to, ms) {
    const f = $('#fade');
    f.style.transitionDuration = (ms || 500) + 'ms';
    f.classList.toggle('on', !!to);
    return new Promise(r => setTimeout(r, ms || 500));
  };

  /* hidden quote card (used by World 2 onwards; World 1 keeps its own approved copy) */
  UI.quotePanel = function (text, count) {
    return new Promise((res) => {
      const p = el('div', 'panel');
      p.innerHTML = '<small style="font:800 14px var(--f-mono);letter-spacing:.3em;color:var(--mint)">HIDDEN QUOTE ' + count + ' OF 4</small><div class="quote-card"></div><p class="panel-sub">Saved to the archive.</p>';
      p.querySelector('.quote-card').textContent = text;     // exact wording, as plain text
      const b = el('button', 'btn primary', 'Continue'); p.appendChild(b);
      let e; wireButton(b, () => { e.close(); res(); });
      e = UI.open(p, { onBack: () => { e.close(); res(); } });
    });
  };

  UI.el = el; UI.esc = esc; UI.$ = $; UI.wire = wireButton;
  G.UI = UI;
})(window.TT);
