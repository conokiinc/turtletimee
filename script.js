/* =====================================================================
   script.js — boots the game
   Load order: core → save → content → audio → ui → characters → art →
   scenes → worlds → this file.
   ===================================================================== */
(async function () {
  'use strict';
  const G = window.TT;
  G.Save.load();
  G.UI.syncMute();
  G.start();                         // start the render loop (draws the loading screen)
  G.Scenes.add('loading', {
    draw(ctx) {
      G.greenBackdrop(ctx, G.Scenes.time);
      ctx.fillStyle = '#f4f8f2'; ctx.font = '800 26px "Trebuchet MS", system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Loading…', G.W / 2, G.H / 2);
    },
  });
  await G.Scenes.go('loading');
  try {
    await Promise.all([Chars.load('assets/characters/'), G.Art.load(), G.Art2.load()]);
  } catch (err) {
    console.error(err);
    const p = G.UI.el('div', 'panel');
    p.innerHTML = '<h2 class="panel-title">Could not load the game files</h2><p class="panel-sub">' + G.UI.esc(err.message) +
      '. If you opened index.html straight from a folder, run it through a local web server instead (see README).</p>';
    G.UI.open(p);
    return;
  }
  if (!G.Save.available) G.UI.toast('Saving is turned off', 'This browser is blocking storage, so progress won\'t be kept after closing the tab.');
  G.Scenes.go('gate');
  // tiny test/debug handle (harmless for players)
  window.__game = G;
})();
