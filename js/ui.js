/* =============================================================
   ui — menu, the quiet "more" button, the language toggle,
   and the honest desktop notice.
   ============================================================= */
(function (w) {
  'use strict';

  var d = document;

  /* ---------- Header menu ---------------------------------- */
  function initNav() {
    var btn = d.querySelector('.nav-toggle');
    var nav = d.getElementById('site-nav');
    if (!btn || !nav) return;

    function setOpen(open) {
      btn.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-label', w.JJ.i18n.t(open ? 'a11y.menuClose' : 'a11y.menu'));
    }

    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });

    // Any destination closes the panel behind you
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        btn.focus();
      }
    });
  }

  /* ---------- The "more platforms" button ------------------ */
  function initMore() {
    var btn = d.querySelector('[data-more-toggle]');
    var list = d.getElementById('links-secondary');
    if (!btn || !list) return;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', w.JJ.i18n.t(open ? 'a11y.less' : 'a11y.more'));

      if (open) {
        list.hidden = false;
        // Force a reflow so the transition has a starting point to leave from.
        // (rAF would be throttled to nothing in a backgrounded tab.)
        void list.offsetHeight;
        list.classList.add('is-open');
      } else {
        list.classList.remove('is-open');
        w.setTimeout(function () {
          if (btn.getAttribute('aria-expanded') !== 'true') list.hidden = true;
        }, 450);
      }
    });
  }

  /* ---------- Language toggle ------------------------------ */
  var FLAGS = {
    // showing the flag of the language you would switch TO
    en: 'assets/icons/flag-co.svg',   // reading English → offer Spanish
    es: 'assets/icons/flag-uk.svg'    // reading Spanish → offer English
  };

  function paintToggle() {
    var btn = d.querySelector('[data-lang-toggle]');
    if (!btn) return;
    var flag = btn.querySelector('.lang-toggle__flag');
    var label = w.JJ.i18n.t('a11y.lang');

    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    if (flag) flag.src = FLAGS[w.JJ.i18n.current] || FLAGS.en;
  }

  function initLang() {
    var btn = d.querySelector('[data-lang-toggle]');
    if (!btn) return;

    btn.addEventListener('click', function () {
      btn.classList.add('is-swapping');
      w.setTimeout(function () {
        w.JJ.i18n.apply(w.JJ.i18n.other());
        btn.classList.remove('is-swapping');
      }, 180);
    });

    w.addEventListener('jj:langchange', paintToggle);
    paintToggle();
  }

  /* ---------- Desktop notice ------------------------------- */
  function initBanner() {
    var banner = d.getElementById('desktop-banner');
    if (!banner) return;

    var KEY = 'jjlr-banner-dismissed';
    var dismissed = false;
    try { dismissed = w.sessionStorage.getItem(KEY) === '1'; } catch (e) { /* noop */ }

    var mq = w.matchMedia('(min-width: 1024px)');

    function measure() {
      if (banner.hidden) return;
      d.documentElement.style.setProperty('--banner-h', banner.offsetHeight + 'px');
    }

    function sync() {
      var show = mq.matches && !dismissed;
      banner.hidden = !show;
      d.body.classList.toggle('banner-dismissed', !show);
      if (show) measure();
    }

    var close = banner.querySelector('[data-close-banner]');
    if (close) {
      close.addEventListener('click', function () {
        dismissed = true;
        try { w.sessionStorage.setItem(KEY, '1'); } catch (e) { /* noop */ }
        sync();
      });
    }

    if (mq.addEventListener) mq.addEventListener('change', sync);
    else if (mq.addListener) mq.addListener(sync);

    w.addEventListener('resize', measure);
    w.addEventListener('jj:langchange', measure);
    sync();
  }

  /* ---------- Small things --------------------------------- */
  function initYear() {
    var y = d.getElementById('year');
    if (!y) return;
    var year = String(new Date().getFullYear());
    y.textContent = year;
    // <time> must not say one year and mean another
    if (y.hasAttribute('datetime')) y.setAttribute('datetime', year);
  }

  w.JJ = w.JJ || {};
  w.JJ.ui = {
    init: function () {
      initNav();
      initMore();
      initLang();
      initBanner();
      initYear();
    }
  };
})(window);
