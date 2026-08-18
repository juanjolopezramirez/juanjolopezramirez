/* =============================================================
   i18n — four languages, never two on the same surface.
   "Pick the reader, then write for them."
   ============================================================= */
(function (w) {
  'use strict';

  var STORAGE_KEY = 'jjlr-lang';

  /* The order they appear in the picker. */
  var LANGS = ['es', 'en', 'pt', 'fr', 'it'];

  var META = {
    es: { name: 'Español',    flag: 'assets/icons/flag-co.svg', code: 'ES' },
    en: { name: 'English',    flag: 'assets/icons/flag-us.svg', code: 'EN' },
    pt: { name: 'Português',  flag: 'assets/icons/flag-br.svg', code: 'PT' },
    fr: { name: 'Français',   flag: 'assets/icons/flag-fr.svg', code: 'FR' },
    it: { name: 'Italiano',   flag: 'assets/icons/flag-it.svg', code: 'IT' }
  };

  var DICT = {
    en: {
      'doc.title':      'Juanjo López Ramírez — Creator & Brand Consultant',
      'a11y.skip':      'Skip to content',
      'a11y.menu':      'Open menu',
      'a11y.menuClose': 'Close menu',
      'a11y.more':      'See all my platforms',
      'a11y.closePanel':'Close',
      'a11y.dismiss':   'Dismiss',
      'a11y.lang':      'Language: English. Change language',
      'a11y.langList':  'Choose a language',

      'desktop.title':  'The desktop version is on its way.',
      'desktop.body':   'This experience was designed for phone and tablet first. The wide layout is still being built — for now, here is the mobile one.',

      'nav.start':      'Start',
      'nav.links':      'Find me',
      'nav.about':      'About the journey',
      'nav.write':      'Write to me',

      'hero.role':      'Creator & Brand Consultant',
      'hero.tagline1':  'learning to walk',
      'hero.lightly':   'lightly',
      'hero.comma':     ',',
      'hero.tagline2':  'along just one path',
      'hero.ahava':     '(ahavah)',

      'links.title':    'Find me here:',
      'social.title':   'All my platforms',
      'term.source':    'Source',
      'term.meaning':   'Meaning',
      'a11y.termClose': 'Close',

      'scroll.label':   'About the journey',

      'about.p1': 'I create in pursuit of what is right and follow the source itself. Through design, film, and technology, I seek to strengthen character, broaden perspective, and reveal what truly remains.',
      'about.p2': 'Rooted in the mountains of Cundinamarca, I walk a single path: Ahavah. Inspired by the spirit of Timothy, I create with courage, discipline, and, above all, love — though I am still learning to love in this way (agape).',
      'about.p3': 'Attention is not the goal. Teaching and making the truth known is. This same pursuit of essential truth (Emet) is what defines my approach to brand strategy.',
      'about.p4': "I don't separate who I am from what I build. My work is simply the architecture of my convictions, reinforced along a path I am still learning from."
    },

    es: {
      'doc.title':      'Juanjo López Ramírez — Creador y Consultor de Marca',
      'a11y.skip':      'Saltar al contenido',
      'a11y.menu':      'Abrir menú',
      'a11y.menuClose': 'Cerrar menú',
      'a11y.more':      'Ver todas mis plataformas',
      'a11y.closePanel':'Cerrar',
      'a11y.dismiss':   'Cerrar',
      'a11y.lang':      'Idioma: Español. Cambiar de idioma',
      'a11y.langList':  'Elige un idioma',

      'desktop.title':  'La versión de escritorio está en camino.',
      'desktop.body':   'Esta experiencia se diseñó primero para móvil y tablet. La versión ancha todavía se está construyendo — por ahora, esta es la móvil.',

      'nav.start':      'Inicio',
      'nav.links':      'Encuéntrame',
      'nav.about':      'Sobre el camino',
      'nav.write':      'Escríbeme',

      'hero.role':      'Creador y Consultor de Marca',
      'hero.tagline1':  'aprendiendo a caminar',
      'hero.lightly':   'ligero',
      'hero.comma':     ',',
      'hero.tagline2':  'a lo largo de un solo camino',
      'hero.ahava':     '(ahavá)',

      'links.title':    'Encuéntrame aquí:',
      'social.title':   'Todas mis plataformas',
      'term.source':    'Fuente',
      'term.meaning':   'Significado',
      'a11y.termClose': 'Cerrar',

      'scroll.label':   'Sobre el camino',

      'about.p1': 'Creo en busca de lo que está bien y sigo el origen mismo. A través del diseño, el cine y la tecnología, busco fortalecer el carácter, ampliar la perspectiva y revelar lo que realmente permanece.',
      'about.p2': 'Originario de las montañas de Cundinamarca, camino por un solo sendero: Ahavá. Inspirado por el espíritu de Timoteo, creo con valentía, disciplina y, sobre todo, amor — aunque todavía estoy aprendiendo a amar así (ágape).',
      'about.p3': 'La atención no es el objetivo. Enseñar y dar a conocer la verdad, sí. Esta misma búsqueda de la verdad esencial (Emet) es lo que define mi enfoque en la estrategia de marca.',
      'about.p4': 'No separo quién soy de lo que construyo: mi trabajo es, simplemente, la arquitectura de mis convicciones, reforzadas en este camino del que sigo aprendiendo.'
    },

    pt: {
      'doc.title':      'Juanjo López Ramírez — Criador e Consultor de Marca',
      'a11y.skip':      'Ir para o conteúdo',
      'a11y.menu':      'Abrir menu',
      'a11y.menuClose': 'Fechar menu',
      'a11y.more':      'Ver todas as minhas plataformas',
      'a11y.closePanel':'Fechar',
      'a11y.dismiss':   'Fechar',
      'a11y.lang':      'Idioma: Português. Mudar de idioma',
      'a11y.langList':  'Escolha um idioma',

      'desktop.title':  'A versão para desktop está a caminho.',
      'desktop.body':   'Esta experiência foi pensada primeiro para celular e tablet. A versão ampla ainda está sendo construída — por enquanto, esta é a móvel.',

      'nav.start':      'Início',
      'nav.links':      'Onde me encontrar',
      'nav.about':      'Sobre o caminho',
      'nav.write':      'Escreva para mim',

      'hero.role':      'Criador e Consultor de Marca',
      'hero.tagline1':  'aprendendo a caminhar',
      'hero.lightly':   'leve',
      'hero.comma':     ',',
      'hero.tagline2':  'por um só caminho',
      'hero.ahava':     '(ahavá)',

      'links.title':    'Me encontre aqui:',
      'social.title':   'Todas as minhas plataformas',
      'term.source':    'Fonte',
      'term.meaning':   'Significado',
      'a11y.termClose': 'Fechar',

      'scroll.label':   'Sobre o caminho',

      'about.p1': 'Crio em busca do que é certo e sigo a própria origem. Através do design, do cinema e da tecnologia, busco fortalecer o caráter, ampliar a perspectiva e revelar o que realmente permanece.',
      'about.p2': 'Vindo das montanhas de Cundinamarca, caminho por um só caminho: Ahavá. Inspirado pelo espírito de Timóteo, crio com coragem, disciplina e, acima de tudo, amor — embora ainda esteja aprendendo a amar assim (ágape).',
      'about.p3': 'A atenção não é o objetivo. Ensinar e dar a conhecer a verdade, sim. Essa mesma busca pela verdade essencial (Emet) é o que define minha abordagem à estratégia de marca.',
      'about.p4': 'Não separo quem sou daquilo que construo: meu trabalho é, simplesmente, a arquitetura das minhas convicções, reforçadas neste caminho do qual sigo aprendendo.'
    },

    fr: {
      'doc.title':      'Juanjo López Ramírez — Créateur & Consultant en Marque',
      'a11y.skip':      'Aller au contenu',
      'a11y.menu':      'Ouvrir le menu',
      'a11y.menuClose': 'Fermer le menu',
      'a11y.more':      'Voir toutes mes plateformes',
      'a11y.closePanel':'Fermer',
      'a11y.dismiss':   'Fermer',
      'a11y.lang':      'Langue : Français. Changer de langue',
      'a11y.langList':  'Choisissez une langue',

      'desktop.title':  'La version bureau arrive bientôt.',
      'desktop.body':   "Cette expérience a d'abord été conçue pour mobile et tablette. La version large est encore en construction — pour l'instant, voici la version mobile.",

      'nav.start':      'Accueil',
      'nav.links':      'Me trouver',
      'nav.about':      'À propos du chemin',
      'nav.write':      'Écrivez-moi',

      'hero.role':      'Créateur & Consultant en Marque',
      'hero.tagline1':  'apprendre à marcher',
      'hero.lightly':   'léger',
      'hero.comma':     ',',
      'hero.tagline2':  'sur un seul chemin',
      'hero.ahava':     '(ahava)',

      'links.title':    'Retrouvez-moi ici :',
      'social.title':   'Toutes mes plateformes',
      'term.source':    'Source',
      'term.meaning':   'Signification',
      'a11y.termClose': 'Fermer',

      'scroll.label':   'À propos du chemin',

      'about.p1': "Je crée en quête de ce qui est juste et je suis l'origine elle-même. À travers le design, le cinéma et la technologie, je cherche à fortifier le caractère, élargir la perspective et révéler ce qui demeure vraiment.",
      'about.p2': "Né dans les montagnes de Cundinamarca, je marche sur un seul chemin : Ahava. Inspiré par l'esprit de Timothée, je crée avec courage, discipline et, par-dessus tout, amour — même si j'apprends encore à aimer ainsi (agapè).",
      'about.p3': "L'attention n'est pas le but. Enseigner et faire connaître la vérité, si. Cette même quête de la vérité essentielle (Emet) définit mon approche de la stratégie de marque.",
      'about.p4': "Je ne sépare pas qui je suis de ce que je construis : mon travail est, simplement, l'architecture de mes convictions, renforcées sur un chemin dont je continue d'apprendre."
    },
    it: {
      'doc.title':      'Juanjo López Ramírez — Creatore e Consulente di Marca',
      'a11y.skip':      'Vai al contenuto',
      'a11y.menu':      'Apri il menu',
      'a11y.menuClose': 'Chiudi il menu',
      'a11y.more':      'Vedi tutte le mie piattaforme',
      'a11y.closePanel':'Chiudi',
      'a11y.dismiss':   'Chiudi',
      'a11y.lang':      'Lingua: Italiano. Cambia lingua',
      'a11y.langList':  'Scegli una lingua',

      'desktop.title':  'La versione desktop è in arrivo.',
      'desktop.body':   'Questa esperienza è stata pensata prima per cellulare e tablet. La versione ampia è ancora in costruzione — per ora, ecco quella mobile.',

      'nav.start':      'Inizio',
      'nav.links':      'Dove trovarmi',
      'nav.about':      'Sul cammino',
      'nav.write':      'Scrivimi',

      'hero.role':      'Creatore e Consulente di Marca',
      'hero.tagline1':  'imparare a camminare',
      'hero.lightly':   'leggero',
      'hero.comma':     ',',
      'hero.tagline2':  'lungo un solo cammino',
      'hero.ahava':     '(ahavà)',

      'links.title':    'Trovami qui:',
      'social.title':   'Tutte le mie piattaforme',
      'term.source':    'Fonte',
      'term.meaning':   'Significato',
      'a11y.termClose': 'Chiudi',

      'scroll.label':   'Sul cammino',

      'about.p1': 'Creo alla ricerca di ciò che è giusto e seguo l’origine stessa. Attraverso il design, il cinema e la tecnologia, cerco di rafforzare il carattere, ampliare la prospettiva e rivelare ciò che davvero permane.',
      'about.p2': 'Cresciuto tra le montagne di Cundinamarca, cammino lungo un solo sentiero: Ahavà. Ispirato dallo spirito di Timoteo, creo con coraggio, disciplina e, soprattutto, amore — anche se sto ancora imparando ad amare così (agape).',
      'about.p3': 'L’attenzione non è l’obiettivo. Insegnare e far conoscere la verità, sì. Questa stessa ricerca della verità essenziale (Emet) è ciò che definisce il mio approccio alla strategia di marca.',
      'about.p4': 'Non separo chi sono da ciò che costruisco: il mio lavoro è, semplicemente, l’architettura delle mie convinzioni, rafforzate lungo un cammino da cui continuo a imparare.'
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
    if (LANGS.indexOf(saved) !== -1) return saved;
    var nav = (w.navigator.language || 'en').toLowerCase().slice(0, 2);
    return LANGS.indexOf(nav) !== -1 ? nav : 'en';
  }

  var current = 'en';

  function t(key) {
    var pack = DICT[current] || DICT.en;
    return pack[key] != null ? pack[key] : (DICT.en[key] != null ? DICT.en[key] : key);
  }

  function apply(lang) {
    current = LANGS.indexOf(lang) !== -1 ? lang : 'en';

    document.documentElement.setAttribute('lang', current);
    document.title = t('doc.title');

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }

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
    langs: LANGS,
    meta: META,
    get current() { return current; },
    others: function () {
      return LANGS.filter(function (l) { return l !== current; });
    }
  };
})(window);
