/* =============================================================
   ui — menu, the platforms sheet, the language picker,
   and the honest desktop notice.
   ============================================================= */
(function (w) {
  'use strict';

  var d = document;

  /* Locking the page leaves an empty style="" behind; take it off. */
  function lockScroll(on) {
    if (on) { d.body.style.overflow = 'hidden'; return; }
    d.body.style.removeProperty('overflow');
    if (!d.body.getAttribute('style')) d.body.removeAttribute('style');
  }

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
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setOpen(false); btn.focus();
      }
    });
  }

  /* ---------- The platforms sheet --------------------------
     It sits over the page. Nothing underneath ever moves, so the
     portrait does not jump when the extra networks appear.        */
  function initSocialPanel() {
    var panel = d.getElementById('social-panel');
    var opener = d.querySelector('[data-open-social]');
    if (!panel || !opener) return;

    var sheet = panel.querySelector('.social-panel__sheet');
    var closeBtn = panel.querySelector('.social-panel__close');
    var lastFocus = null;

    function open() {
      lastFocus = d.activeElement;
      panel.hidden = false;
      void panel.offsetHeight;            // give the transition a start point
      panel.classList.add('is-open');
      lockScroll(true);
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      panel.classList.remove('is-open');
      lockScroll(false);
      w.setTimeout(function () {
        if (!panel.classList.contains('is-open')) panel.hidden = true;
      }, 420);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    opener.addEventListener('click', open);

    var closers = panel.querySelectorAll('[data-close-social]');
    for (var j = 0; j < closers.length; j++) closers[j].addEventListener('click', close);

    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) close();
    });

    // Keep focus inside the sheet while it is open
    d.addEventListener('focusin', function (e) {
      if (!panel.hidden && sheet && !sheet.contains(e.target)) {
        if (closeBtn) closeBtn.focus();
      }
    });
  }

  /* ---------- Language picker ------------------------------
     The flag shows the language you are reading, not the one you
     would switch to. Tapping it opens the others.                 */
  function initLang() {
    var root = d.querySelector('[data-lang]');
    if (!root) return;

    var btn  = root.querySelector('[data-lang-toggle]');
    var list = root.querySelector('.lang__list');
    var flag = root.querySelector('.lang__flag');
    var i18n = w.JJ.i18n;

    function setOpen(open) {
      root.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      list.hidden = !open;
      if (open) {
        void list.offsetHeight;
        root.classList.add('has-used');
      }
    }

    function build() {
      var others = i18n.others();
      list.innerHTML = '';
      others.forEach(function (code) {
        var meta = i18n.meta[code];
        var li = d.createElement('li');

        var b = d.createElement('button');
        b.type = 'button';
        b.className = 'lang__option';
        b.setAttribute('data-lang-choose', code);
        b.setAttribute('lang', code);
        b.setAttribute('aria-label', meta.name);
        b.title = meta.name;

        var img = d.createElement('img');
        img.src = meta.flag;
        img.alt = '';
        img.width = 40; img.height = 40;

        b.appendChild(img);
        li.appendChild(b);
        list.appendChild(li);
      });
      list.hidden = !root.classList.contains('is-open');
    }

    function paintCurrent() {
      var meta = i18n.meta[i18n.current];
      if (flag && meta) flag.src = meta.flag;
      btn.setAttribute('title', i18n.t('a11y.lang'));
    }

    btn.addEventListener('click', function () {
      setOpen(!root.classList.contains('is-open'));
    });

    list.addEventListener('click', function (e) {
      var choice = e.target.closest('[data-lang-choose]');
      if (!choice) return;
      i18n.apply(choice.getAttribute('data-lang-choose'));
      setOpen(false);
      btn.focus();
    });

    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('is-open')) {
        setOpen(false); btn.focus();
      }
    });
    d.addEventListener('click', function (e) {
      if (!root.contains(e.target) && root.classList.contains('is-open')) setOpen(false);
    });

    w.addEventListener('jj:langchange', function () { paintCurrent(); build(); });
    paintCurrent();
    build();
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

  function initYear() {
    var y = d.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  w.JJ = w.JJ || {};
  w.JJ.ui = {
    init: function () {
      initNav();
      initSocialPanel();
      initLang();
      initBanner();
      initYear();
    }
  };
})(window);
