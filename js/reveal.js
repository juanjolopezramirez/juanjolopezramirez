/* =============================================================
   reveal — things arrive as though pulled from somewhere,
   not as though swelling into existence. Then they stop.

   Rule of the house: content is visible by default. It is only
   hidden once this file has confirmed it can show it again.
   A decoration must never be able to swallow the content.
   ============================================================= */
(function (w) {
  'use strict';

  var REDUCED = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FAILSAFE_MS = 3000;

  function showAll(targets) {
    for (var i = 0; i < targets.length; i++) targets[i].classList.add('is-visible');
  }

  function init() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    // No observer, or the reader asked for stillness: leave everything as it is,
    // which — because the CSS shows it by default — means visible.
    if (REDUCED || !('IntersectionObserver' in w)) return;

    // From here on we own the visibility, so it is safe to hide.
    document.documentElement.classList.add('js-reveal');

    var io = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal-delay'), 10);
        if (!isNaN(delay) && delay > 0) el.style.setProperty('--delay', delay + 'ms');
        el.classList.add('is-visible');
        observer.unobserve(el);        // it settles; it does not keep talking
      });
    }, {
      root: null,
      rootMargin: '0px 0px 10% 0px',   // a little early, never late
      threshold: 0.01
    });

    for (var j = 0; j < targets.length; j++) io.observe(targets[j]);

    // If anything is still hidden after three seconds — a stalled observer,
    // a short page, a tab that never composited — show it anyway.
    w.setTimeout(function () {
      var stuck = document.querySelectorAll('.reveal:not(.is-visible)');
      for (var k = 0; k < stuck.length; k++) {
        if (stuck[k].getBoundingClientRect().top < w.innerHeight * 1.5) {
          stuck[k].classList.add('is-visible');
        }
      }
    }, FAILSAFE_MS);
  }

  w.JJ = w.JJ || {};
  w.JJ.reveal = { init: init, showAll: showAll };
})(window);
