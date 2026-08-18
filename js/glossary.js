/* =============================================================
   glossary — the words that are not ours.

   Terms in Hebrew or Greek get a dotted underline. Tapping one opens
   a panel with the word in its own alphabet, what it means, and where
   that meaning comes from.

   ► TO EDIT A DEFINITION: change the text inside TERMS below. Nothing
     else needs touching. The page finds the words on its own.
   ============================================================= */
(function (w) {
  'use strict';

  var d = document;

  var TERMS = {

    /* ---------------------------------------------------------- */
    ahava: {
      script:   'אַהֲבָה',          // written right to left
      dir:      'rtl',
      language: { es: 'Hebreo bíblico', en: 'Biblical Hebrew', pt: 'Hebraico bíblico', fr: 'Hébreu biblique' },
      title:    { es: 'Ahavá', en: 'Ahavah', pt: 'Ahavá', fr: 'Ahava' },
      forms:    ['ahavá', 'ahavah', 'ahava'],
      def: {
        es: 'Amor. No nombra un sentimiento que ocurre, sino una decisión que se toma: querer el bien del otro antes de sentirlo. Su valor numérico es 13, el mismo de ejad, «uno».',
        en: 'Love. It names not a feeling that happens but a decision that is made: willing the good of the other before feeling it. Its numerical value is 13, the same as echad, “one”.',
        pt: 'Amor. Não nomeia um sentimento que acontece, mas uma decisão que se toma: querer o bem do outro antes de senti-lo. Seu valor numérico é 13, o mesmo de ejad, «um».',
        fr: 'Amour. Il ne nomme pas un sentiment qui arrive, mais une décision que l’on prend : vouloir le bien de l’autre avant de le ressentir. Sa valeur numérique est 13, la même qu’ejad, « un ».'
      },
      source: 'Brown, F., Driver, S. R., & Briggs, C. A. (1906). A Hebrew and English lexicon of the Old Testament. Clarendon Press. (Strong H160)'
    },

    /* ---------------------------------------------------------- */
    emet: {
      script:   'אֱמֶת',
      dir:      'rtl',
      language: { es: 'Hebreo bíblico', en: 'Biblical Hebrew', pt: 'Hebraico bíblico', fr: 'Hébreu biblique' },
      title:    { es: 'Emet', en: 'Emet', pt: 'Emet', fr: 'Emet' },
      forms:    ['emet'],
      def: {
        es: 'Verdad. Se escribe con la primera, la del medio y la última letra del alfabeto hebreo: principio, proceso y final. Si se le quita la primera (א, álef) queda met: muerto.',
        en: 'Truth. Written with the first, middle and last letters of the Hebrew alphabet: beginning, process and end. Remove the first (א, alef) and met remains: dead.',
        pt: 'Verdade. Escreve-se com a primeira, a do meio e a última letra do alfabeto hebraico: princípio, processo e fim. Se tirar a primeira (א, álef), resta met: morto.',
        fr: 'Vérité. Elle s’écrit avec la première, la médiane et la dernière lettre de l’alphabet hébreu : début, processus et fin. Ôtez la première (א, alef) et il reste met : mort.'
      },
      source: 'Brown, F., Driver, S. R., & Briggs, C. A. (1906). A Hebrew and English lexicon of the Old Testament. Clarendon Press. (Strong H571)'
    },

    /* ---------------------------------------------------------- */
    agape: {
      script:   'ἀγάπη',
      dir:      'ltr',
      language: { es: 'Griego del Nuevo Testamento', en: 'New Testament Greek', pt: 'Grego do Novo Testamento', fr: 'Grec du Nouveau Testament' },
      title:    { es: 'Ágape', en: 'Agape', pt: 'Ágape', fr: 'Agapè' },
      forms:    ['ágape', 'agapè', 'agape'],
      def: {
        es: 'Amor que decide y da sin esperar retorno. Aparece más de 300 veces en el Nuevo Testamento; eros, ninguna.',
        en: 'Love that decides and gives without expecting return. It appears more than 300 times in the New Testament; eros, not once.',
        pt: 'Amor que decide e dá sem esperar retorno. Aparece mais de 300 vezes no Novo Testamento; eros, nenhuma.',
        fr: 'Amour qui décide et donne sans attendre de retour. Il apparaît plus de 300 fois dans le Nouveau Testament ; eros, pas une seule.'
      },
      source: 'Bauer, W., Danker, F. W., Arndt, W. F., & Gingrich, F. W. (2000). A Greek-English lexicon of the New Testament and other early Christian literature (3rd ed.). University of Chicago Press. (Strong G26)'
    }
  };

  /* Locking the page leaves an empty style="" behind; take it off. */
  function lockScroll(on) {
    if (on) { d.body.style.overflow = 'hidden'; return; }
    d.body.style.removeProperty('overflow');
    if (!d.body.getAttribute('style')) d.body.removeAttribute('style');
  }

  /* ---- matching ------------------------------------------------ */
  var LETTER = /[0-9A-Za-zÀ-ÖØ-öø-ÿ]/;      // what counts as "inside a word"

  function pattern() {
    var forms = [];
    Object.keys(TERMS).forEach(function (id) {
      TERMS[id].forms.forEach(function (f) { forms.push({ id: id, f: f }); });
    });
    forms.sort(function (a, b) { return b.f.length - a.f.length; });   // longest first
    return {
      re: new RegExp('(' + forms.map(function (x) { return x.f; }).join('|') + ')', 'gi'),
      lookup: forms.reduce(function (acc, x) { acc[x.f.toLowerCase()] = x.id; return acc; }, {})
    };
  }

  function linkScope(scope, pat) {
    var nodes = [];
    var walker = d.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (n.parentElement && n.parentElement.closest('.term')) continue;
      if (pat.re.test(n.nodeValue)) nodes.push(n);
      pat.re.lastIndex = 0;
    }

    nodes.forEach(function (node) {
      var text = node.nodeValue;
      var frag = d.createDocumentFragment();
      var last = 0, m;
      pat.re.lastIndex = 0;

      while ((m = pat.re.exec(text)) !== null) {
        var start = m.index, end = start + m[0].length;
        var before = start > 0 ? text.charAt(start - 1) : '';
        var after  = end < text.length ? text.charAt(end) : '';
        if (LETTER.test(before) || LETTER.test(after)) continue;   // inside a longer word

        if (start > last) frag.appendChild(d.createTextNode(text.slice(last, start)));

        var b = d.createElement('button');
        b.type = 'button';
        b.className = 'term';
        b.setAttribute('data-term', pat.lookup[m[0].toLowerCase()]);
        b.textContent = m[0];
        frag.appendChild(b);
        last = end;
      }
      if (last === 0) return;
      if (last < text.length) frag.appendChild(d.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function linkAll() {
    var pat = pattern();
    var scopes = d.querySelectorAll('[data-glossary]');
    for (var i = 0; i < scopes.length; i++) linkScope(scopes[i], pat);
  }

  /* ---- the panel ----------------------------------------------- */
  function initPanel() {
    var panel = d.getElementById('term-panel');
    if (!panel) return null;

    var els = {
      script:  d.getElementById('term-panel-script'),
      title:   d.getElementById('term-panel-title'),
      meta:    d.getElementById('term-panel-meta'),
      def:     d.getElementById('term-panel-def'),
      srcLbl:  d.getElementById('term-panel-source-label'),
      source:  d.getElementById('term-panel-source')
    };
    var closeBtn = panel.querySelector('.term-panel__close');
    var lastFocus = null;

    function open(id) {
      var term = TERMS[id];
      if (!term) return;
      var lang = w.JJ.i18n.current;

      els.script.textContent = term.script;
      els.script.setAttribute('dir', term.dir);
      els.script.setAttribute('lang', term.dir === 'rtl' ? 'he' : 'el');
      els.title.textContent  = term.title[lang] || term.title.en;
      els.meta.textContent   = term.language[lang] || term.language.en;
      els.def.textContent    = term.def[lang] || term.def.en;
      els.srcLbl.textContent = w.JJ.i18n.t('term.source');
      els.source.textContent = term.source;

      lastFocus = d.activeElement;
      panel.hidden = false;
      void panel.offsetHeight;
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

    var closers = panel.querySelectorAll('[data-close-term]');
    for (var i = 0; i < closers.length; i++) closers[i].addEventListener('click', close);
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) close();
    });

    return { open: open, close: close };
  }

  function init() {
    var panel = initPanel();
    linkAll();

    d.addEventListener('click', function (e) {
      var btn = e.target.closest('.term');
      if (!btn || !panel) return;
      panel.open(btn.getAttribute('data-term'));
    });

    // The copy is rewritten on every language change, so re-link after it.
    w.addEventListener('jj:langchange', function () { linkAll(); });
  }

  w.JJ = w.JJ || {};
  w.JJ.glossary = { init: init, terms: TERMS };
})(window);
