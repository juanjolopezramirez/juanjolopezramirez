/* =============================================================
   i18n — two languages, never both on the same surface.
   "Pick the reader, then write for them."
   ============================================================= */
(function (w) {
  'use strict';

  var STORAGE_KEY = 'jjlr-lang';

  var DICT = {
    en: {
      'doc.title':     'Juanjo López Ramírez — Creator & Brand Consultant',
      'a11y.skip':     'Skip to content',
      'a11y.menu':     'Open menu',
      'a11y.menuClose':'Close menu',
      'a11y.more':     'Show more platforms',
      'a11y.less':     'Hide extra platforms',
      'a11y.dismiss':  'Dismiss',
      'a11y.lang':     'Cambiar a español',

      'desktop.title': 'The desktop version is on its way.',
      'desktop.body':  'This experience was designed for phone and tablet first. The wide layout is still being built — for now, here is the mobile one.',

      'nav.start':     'Start',
      'nav.links':     'Find me',
      'nav.about':     'About the journey',
      'nav.write':     'Write to me',

      'hero.role':     'Brand Consultant & Creator',
      'hero.tagline1': 'learning to walk',
      'hero.lightly':  'lightly',
      'hero.comma':    ',',
      'hero.tagline2': 'along just one path',

      'links.title':   'Find me here:',
      'links.website': 'Website',

      'scroll.label':  'About the journey',

      'about.p1': 'I create in pursuit of what is right and follow the source itself. Through design, film, and technology, I seek to strengthen character, broaden perspective, and reveal what truly remains.',
      'about.p2': 'Rooted in the mountains of Cundinamarca, I walk a single path: Ahavá. Inspired by the spirit of Timothy, I create with courage, discipline, and, above all, love — though I am still learning to love in this way (agape).',
      'about.p3': 'Attention is not the goal. Teaching and making the truth known is. This same pursuit of essential truth (Emet) is what defines my approach to brand strategy.',
      'about.p4': "I don't separate who I am from what I build. My work is simply the architecture of my convictions, reinforced along a path I am still learning from.",

      'footer.motto': 'Todo por amar.'
    },

    es: {
      'doc.title':     'Juanjo López Ramírez — Creador & Consultor de Marca',
      'a11y.skip':     'Saltar al contenido',
      'a11y.menu':     'Abrir menú',
      'a11y.menuClose':'Cerrar menú',
      'a11y.more':     'Ver más plataformas',
      'a11y.less':     'Ocultar plataformas',
      'a11y.dismiss':  'Cerrar',
      'a11y.lang':     'Switch to English',

      'desktop.title': 'La versión de escritorio está en camino.',
      'desktop.body':  'Esta experiencia se diseñó primero para móvil y tablet. La versión ancha todavía se está construyendo — por ahora, esta es la móvil.',

      'nav.start':     'Inicio',
      'nav.links':     'Encuéntrame',
      'nav.about':     'Sobre el camino',
      'nav.write':     'Escríbeme',

      'hero.role':     'Consultor de Marca y Creador',
      'hero.tagline1': 'aprendiendo a caminar',
      'hero.lightly':  'ligero',
      'hero.comma':    ',',
      'hero.tagline2': 'a lo largo de un solo camino',

      'links.title':   'Encuéntrame en las siguientes plataformas:',
      'links.website': 'Sitio web',

      'scroll.label':  'Sobre el camino',

      'about.p1': 'Creo en busca de lo que está bien y sigo el origen mismo. A través del diseño, el cine y la tecnología, busco fortalecer el carácter, ampliar la perspectiva y revelar lo que realmente permanece.',
      'about.p2': 'Originario de las montañas de Cundinamarca, camino por un solo sendero: Ahavá. Inspirado por el espíritu de Timoteo, creo con valentía, disciplina y, sobre todo, amor — aunque todavía estoy aprendiendo a amar así (ágape).',
      'about.p3': 'La atención no es el objetivo. Enseñar y dar a conocer la verdad, sí. Esta misma búsqueda de la verdad esencial (Emet) es lo que define mi enfoque en la estrategia de marca.',
      'about.p4': 'No separo quién soy de lo que construyo: mi trabajo es, simplemente, la arquitectura de mis convicciones, reforzadas en este camino del que sigo aprendiendo.',

      'footer.motto': 'Todo por amar.'
    }
  };

  function stored() {
    try { return w.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function remember(lang) {
    try { w.localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
  }

  function initial() {
    var saved = stored();
    if (saved === 'en' || saved === 'es') return saved;
    var nav = (w.navigator.language || 'en').toLowerCase();
    return nav.indexOf('es') === 0 ? 'es' : 'en';
  }

  var current = 'en';

  function t(key) {
    var pack = DICT[current] || DICT.en;
    return pack[key] != null ? pack[key] : (DICT.en[key] != null ? DICT.en[key] : key);
  }

  function apply(lang) {
    current = (lang === 'es') ? 'es' : 'en';

    document.documentElement.setAttribute('lang', current);
    document.title = t('doc.title');

    // Text nodes
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }

    // Accessible names
    var labelled = document.querySelectorAll('[data-i18n-aria]');
    for (var j = 0; j < labelled.length; j++) {
      labelled[j].setAttribute('aria-label', t(labelled[j].getAttribute('data-i18n-aria')));
    }

    remember(current);
    w.dispatchEvent(new CustomEvent('jj:langchange', { detail: { lang: current } }));
  }

  w.JJ = w.JJ || {};
  w.JJ.i18n = {
    init: function () { apply(initial()); },
    apply: apply,
    t: t,
    get current() { return current; },
    other: function () { return current === 'en' ? 'es' : 'en'; }
  };
})(window);
