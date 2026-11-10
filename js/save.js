/* =====================================================================
   save.js — versioned progress saving in localStorage
   If storage is blocked (private mode, disabled cookies) the game keeps
   working with an in-memory save and tells the player once.
   ===================================================================== */
(function (G) {
  'use strict';
  const KEY = 'wheres-turtletimee.save';
  const VERSION = 1;

  function fresh() {
    return {
      version: VERSION,
      settings: { master: 0.8, music: 0.6, sfx: 0.8, muted: false },
      // where the story is: 'new' | 'world1' | 'world2' | 'world3' | 'final' | 'birthday' | 'done'
      progress: { stage: 'new', storySeen: false, checkpoint: null },
      worlds: {
        w1: { done: false, slippers: [], corn: [], curtains: [], secret: false, poster: false, bubbles: [], best: null },
        w3: { done: false, quote: false, screen: false, best: null, tries: 0 },
        w2: { done: false, tokens: [], watches: [], quote: false, mural: false, buoy: null, buoyTime: null, bonks: 0, beatTT: false, best: null },
        fin: { done: false, quote: false, looked: [] },
        bday: { seen: false, wish: false, letter: false },
      },
      achievements: {},           // id -> timestamp
      quotes: {},                 // id -> true
      stats: { knives: 0, bubbles: 0, deaths: 0 },
      cosmetics: {},
    };
  }

  // merge saved data onto a fresh template so new fields always exist
  function merge(base, saved) {
    if (!saved || typeof saved !== 'object') return base;
    for (const k of Object.keys(saved)) {
      if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && saved[k] && typeof saved[k] === 'object' && !Array.isArray(saved[k])) merge(base[k], saved[k]);
      else base[k] = saved[k];
    }
    return base;
  }

  // older save versions get upgraded here
  function migrate(d) {
    if (!d.version) d.version = 1;
    return d;
  }

  const Save = {
    data: fresh(), available: true,
    load() {
      try {
        const raw = window.localStorage.getItem(KEY);
        if (raw) this.data = merge(fresh(), migrate(JSON.parse(raw)));
        // probe write access
        window.localStorage.setItem(KEY + '.probe', '1'); window.localStorage.removeItem(KEY + '.probe');
        this.available = true;
      } catch (e) {
        console.warn('Saving unavailable:', e);
        this.available = false;
      }
      return this.data;
    },
    write() {
      if (!this.available) return false;
      try { window.localStorage.setItem(KEY, JSON.stringify(this.data)); return true; }
      catch (e) { console.warn('Save failed:', e); this.available = false; return false; }
    },
    /* wipe everything except volume settings */
    resetProgress() {
      const settings = this.data.settings;
      this.data = fresh(); this.data.settings = settings; this.write();
    },
    hasProgress() { const p = this.data.progress; return p.stage !== 'new' || p.storySeen; },
    unlock(id) {
      if (this.data.achievements[id]) return false;
      this.data.achievements[id] = Date.now(); this.write();
      const a = G.Content.ACHIEVEMENTS.find(x => x.id === id);
      if (a && G.UI) { G.UI.toast('Achievement unlocked', a.name + ' — ' + a.desc, 'achv'); G.Audio && G.Audio.sfx('achv'); }
      return true;
    },
  };
  G.Save = Save;
})(window.TT);
