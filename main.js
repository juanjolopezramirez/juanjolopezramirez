/* =============================================================
   main — the entry point. It does nothing itself; it starts
   the three things that do, in the only order that works:
   language first, so every label is right before anything moves.
   ============================================================= */
(function (w) {
  'use strict';

  function boot() {
    if (!w.JJ || !w.JJ.i18n || !w.JJ.ui || !w.JJ.reveal) {
      // A module did not load. Say so, and leave the page readable.
      if (w.console) w.console.warn('[JJ] a module is missing — the page still reads, it just will not move.');
      document.documentElement.setAttribute('lang', 'en');
      var stuck = document.querySelectorAll('.reveal');
      for (var i = 0; i < stuck.length; i++) stuck[i].classList.add('is-visible');
      return;
    }

    w.JJ.i18n.init();   // labels
    w.JJ.ui.init();     // controls
    w.JJ.reveal.init(); // motion

    document.documentElement.classList.add('js-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
