/* =============================================================
   site.js — todo el comportamiento del cliente, en un solo sitio.

   Ojo: el TEXTO ya no se cambia aqui. Astro lo escribe en el
   servidor, un idioma por URL. Este archivo solo se ocupa de:
     · abrir y cerrar menu, hoja de plataformas y glosario
     · el selector de idioma (que ahora navega, no traduce)
     · las animaciones de entrada
   ============================================================= */
import { TERMS } from '../i18n/terms.js';
import { UI } from '../i18n/ui.js';

const d = document;
const lang = d.documentElement.lang || 'es';
const t = (k) => (UI[lang] && UI[lang][k]) || UI.en[k] || k;

/* Bloquear el scroll deja un style="" vacio; se retira al soltar. */
function lockScroll(on) {
  if (on) { d.body.style.overflow = 'hidden'; return; }
  d.body.style.removeProperty('overflow');
  if (!d.body.getAttribute('style')) d.body.removeAttribute('style');
}

/* ---------- Cabecera ----------------------------------------
   En escritorio la cabecera flota transparente sobre el hero. En
   cuanto la pagina se mueve, vuelve a ponerse el pinar detras para
   que la pastilla no quede suelta sobre la seccion de hueso.      */
function initHeader() {
  const header = d.querySelector('.site-header');
  if (!header) return;
  const hero = d.querySelector('.hero');
  let ticking = false;

  const sync = () => {
    const moved = scrollY > 24;
    header.classList.toggle('is-scrolled', moved);
    /* Tambien en la raiz: hay cosas fuera de la cabecera —el boton de
       movil— que quieren saber si la pagina ya se movio. */
    d.documentElement.classList.toggle('is-scrolled', moved);

    /* La firma espera a que el nombre grande salga de pantalla. Sin hero
       —las paginas interiores— no hay nada que esperar. */
    header.classList.toggle('is-past-hero', !hero || scrollY > hero.offsetHeight * 0.6);

    ticking = false;
  };
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sync);
  }, { passive: true });
  sync();
}

/* ---------- El campo verde ----------------------------------
   La UNICA logica que mueve el fondo. No anima elementos: mueve el
   degradado, escribiendo tres variables que el CSS usa para colocar y
   dimensionar la masa de luz.

   Va con senos y no con fotogramas a proposito. Un seno frena solo al
   llegar a los extremos y cambia de sentido sin canto — es el easing,
   no algo aplicado encima. Y como los tres van a periodos que no encajan
   entre si, el conjunto no vuelve nunca a repetirse igual.

   Los margenes de movimiento no estan aqui: los declara el CSS, que es
   quien sabe si estamos en movil o en escritorio. Este bucle solo los
   lee y se mueve dentro de ellos.                                     */
function initFieldGlow() {
  const field = d.querySelector('.hero__field, .phero__field');
  if (!field) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const TAU = Math.PI * 2;
  let cfg, raf = 0, last = 0, onScreen = true;
  let mx = 0, my = 0, tmx = 0, tmy = 0;

  /* El CSS manda: aqui solo se leen los limites que haya puesto para
     este ancho de pantalla. Se relee al cambiar de tamano. */
  const readCfg = () => {
    const cs = getComputedStyle(field);
    const n = (k, f) => { const v = parseFloat(cs.getPropertyValue(k)); return isNaN(v) ? f : v; };
    cfg = {
      cycle: n('--iris-cycle', 11) * 1000,
      xMid:  n('--iris-x-mid', 69), xAmp: n('--iris-x-amp', 9),
      yMid:  n('--iris-y-mid', 61), yAmp: n('--iris-y-amp', 8),
      breath: n('--iris-breath-amp', .17),
      pull:  n('--iris-pull', 2)
    };
  };

  const tick = (now) => {
    /* A ~30 por segundo basta: lo que se mueve tarda once segundos en dar
       la vuelta, y repintar la mitad de veces cuesta la mitad. */
    if (now - last > 32) {
      last = now;
      const t = (now / cfg.cycle) * TAU;
      mx += (tmx - mx) * 0.03;            // el raton llega tarde, a proposito
      my += (tmy - my) * 0.03;
      const x = cfg.xMid + cfg.xAmp * Math.sin(t)              + mx * cfg.pull;
      const y = cfg.yMid + cfg.yAmp * Math.sin(t * 0.73 + 1.1) + my * cfg.pull;
      const b = 1 + cfg.breath * Math.sin(t * 0.61 + 2.3);
      field.style.setProperty('--iris-x', x.toFixed(2) + '%');
      field.style.setProperty('--iris-y', y.toFixed(2) + '%');
      field.style.setProperty('--iris-breath', b.toFixed(4));
    }
    raf = requestAnimationFrame(tick);
  };

  const start = () => { if (!raf && onScreen && !d.hidden) raf = requestAnimationFrame(tick); };
  const stop  = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  readCfg();
  addEventListener('resize', readCfg, { passive: true });

  /* Nada se pinta si el hero no esta a la vista, ni si la pestana lo esta. */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen ? start() : stop(); })
      .observe(field);
  }
  d.addEventListener('visibilitychange', () => (d.hidden ? stop() : start()));

  if (!matchMedia('(hover: none)').matches) {
    addEventListener('pointermove', (e) => {
      tmx = (e.clientX / innerWidth  - 0.5) * 2;
      tmy = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  start();
}

/* ---------- Menu ------------------------------------------- */
function initNav() {
  const btn = d.querySelector('.nav-toggle');
  const nav = d.getElementById('site-nav');
  if (!btn || !nav) return;

  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-label', t(open ? 'a11y.menuClose' : 'a11y.menu'));
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  /* Elegir una fila cierra el menu, sea la que sea. Escribirme es un
     boton y no un enlace, asi que sin nombrarlo se quedaba abierto por
     detras de la hoja — y el menu seguia diciendo que estaba desplegado. */
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a, [data-open-contact]')) setOpen(false);
  });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); }
  });
}

/* ---------- Hoja generica ---------------------------------- */
function sheet(panelId, closeAttr) {
  const panel = d.getElementById(panelId);
  if (!panel) return null;
  const closeBtn = panel.querySelector('button[' + closeAttr + ']');
  let lastFocus = null;

  const open = () => {
    lastFocus = d.activeElement;
    panel.hidden = false;
    void panel.offsetHeight;              // punto de partida para la transicion
    panel.classList.add('is-open');
    lockScroll(true);
    if (closeBtn) closeBtn.focus();
  };
  const close = () => {
    panel.classList.remove('is-open');
    lockScroll(false);
    setTimeout(() => { if (!panel.classList.contains('is-open')) panel.hidden = true; }, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  panel.querySelectorAll('[' + closeAttr + ']').forEach((el) => el.addEventListener('click', close));
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
  return { panel, open, close };
}

function initSocial() {
  const s = sheet('social-panel', 'data-close-social');
  const opener = d.querySelector('[data-open-social]');
  if (s && opener) opener.addEventListener('click', s.open);
}
/* Escribirme abre la misma clase de hoja que las plataformas. Hay dos
   botones que la abren —el de la barra ancha y el del menu desplegable—
   asi que se cablean todos, no solo el primero. */
function initContact() {
  const s = sheet('contact-panel', 'data-close-contact');
  if (!s) return;
  d.querySelectorAll('[data-open-contact]').forEach((b) => b.addEventListener('click', s.open));
}

/* ---------- Selector de idioma ------------------------------
   Ya no traduce: cada bandera es un enlace a la misma pagina en
   otro idioma. Solo abre y cierra.                              */
function initLang() {
  const root = d.querySelector('[data-lang]');
  if (!root) return;
  const btn = root.querySelector('[data-lang-toggle]');
  const list = root.querySelector('.lang__list');

  const setOpen = (open) => {
    root.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    list.hidden = !open;
    if (open) { void list.offsetHeight; root.classList.add('has-used'); }
  };
  btn.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('is-open')) { setOpen(false); btn.focus(); }
  });
  d.addEventListener('click', (e) => {
    if (!root.contains(e.target) && root.classList.contains('is-open')) setOpen(false);
  });
}

/* ---------- Lo que aun no esta -------------------------------
   Un boton marcado con data-soon dice por que no lleva a ningun sitio.
   El aviso se anuncia solo (role=status) y se retira a los seis segundos. */
function initSoon() {
  const box = d.getElementById('toast');
  const text = d.getElementById('toast-text');
  if (!box || !text) return;
  let timer;

  const hide = () => {
    clearTimeout(timer);
    box.classList.remove('is-open');
    setTimeout(() => { if (!box.classList.contains('is-open')) box.hidden = true; }, 320);
  };
  const show = (key) => {
    text.textContent = t(key);
    box.hidden = false;
    void box.offsetHeight;                 // punto de partida para la transicion
    box.classList.add('is-open');
    clearTimeout(timer);
    timer = setTimeout(hide, 6000);
  };

  d.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-soon]');
    if (btn) { show(btn.getAttribute('data-soon')); return; }
    if (e.target.closest('[data-close-toast]')) hide();
  });
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) hide(); });
}

/* ---------- Glosario ---------------------------------------- */
const LETTER = /[0-9A-Za-zÀ-ÖØ-öø-ÿ]/;

function linkTerms() {
  const forms = [];
  Object.keys(TERMS).forEach((id) => TERMS[id].forms.forEach((f) => forms.push({ id, f })));
  forms.sort((a, b) => b.f.length - a.f.length);
  const re = new RegExp('(' + forms.map((x) => x.f).join('|') + ')', 'gi');
  const lookup = forms.reduce((a, x) => (a[x.f.toLowerCase()] = x.id, a), {});

  d.querySelectorAll('[data-glossary]').forEach((scope) => {
    const walker = d.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.parentElement && n.parentElement.closest('.term')) continue;
      re.lastIndex = 0;
      if (re.test(n.nodeValue)) nodes.push(n);
    }
    nodes.forEach((node) => {
      const text = node.nodeValue;
      const frag = d.createDocumentFragment();
      let last = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        const start = m.index, end = start + m[0].length;
        if (LETTER.test(text.charAt(start - 1) || '') || LETTER.test(text.charAt(end) || '')) continue;
        if (start > last) frag.appendChild(d.createTextNode(text.slice(last, start)));
        const b = d.createElement('button');
        b.type = 'button';
        b.className = 'term';
        b.setAttribute('data-term', lookup[m[0].toLowerCase()]);
        b.textContent = m[0];
        frag.appendChild(b);
        last = end;
      }
      if (!last) return;
      if (last < text.length) frag.appendChild(d.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  });
}

function initGlossary() {
  const s = sheet('term-panel', 'data-close-term');
  if (!s) return;
  const el = (id) => d.getElementById(id);
  linkTerms();

  d.addEventListener('click', (e) => {
    const btn = e.target.closest('.term');
    if (!btn) return;
    const term = TERMS[btn.getAttribute('data-term')];
    if (!term) return;
    el('term-panel-script').textContent = term.script;
    el('term-panel-script').setAttribute('dir', term.dir);
    el('term-panel-script').setAttribute('lang', term.dir === 'rtl' ? 'he' : 'el');
    el('term-panel-title').textContent = term.title[lang] || term.title.en;
    el('term-panel-meta').textContent = term.language[lang] || term.language.en;
    el('term-panel-def').textContent = term.def[lang] || term.def.en;

    /* Lo que solo tiene Timoteo. Cada hueco se vacia primero: la hoja es
       una sola y la reutilizan las cinco palabras, asi que lo que dejo la
       anterior tiene que irse antes de pintar la siguiente. */
    const pick = (o) => (o ? (o[lang] || o.en || o.es) : '');

    const dt = el('term-panel-deftitle');
    dt.textContent = pick(term.defTitle);
    dt.hidden = !term.defTitle;

    const secs = el('term-panel-sections');
    secs.textContent = '';
    secs.hidden = !term.sections;
    (term.sections || []).forEach((sec) => {
      const h = d.createElement('h3');
      h.className = 'term-panel__deftitle';
      h.textContent = pick(sec.title);
      const b = d.createElement('p');
      b.className = 'term-panel__def';
      b.textContent = pick(sec.body);
      secs.append(h, b);
    });

    const pil = el('term-panel-pillars');
    pil.textContent = '';
    pil.hidden = !term.pillars;
    if (term.pillars) {
      const h = d.createElement('h3');
      h.className = 'term-panel__deftitle';
      h.textContent = pick(term.pillars.title);
      pil.appendChild(h);
      term.pillars.items.forEach((it) => {
        const det = d.createElement('details');
        det.className = 'pillar';
        const sum = d.createElement('summary');
        sum.className = 'pillar__head';
        sum.innerHTML = '<span class="pillar__n" aria-hidden="true"></span>' +
                        '<span class="pillar__name"></span>' +
                        '<span class="pillar__mark" aria-hidden="true"></span>';
        sum.querySelector('.pillar__n').textContent = it.n;
        sum.querySelector('.pillar__name').textContent = pick(it.label);
        const body = d.createElement('p');
        body.className = 'pillar__text';
        body.textContent = pick(it.body);
        det.append(sum, body);
        pil.appendChild(det);
      });
    }

    /* No todas las palabras llevan fuente. La de Timoteo se explica sola
       y la ficha se queda mas limpia sin el aparato bibliografico. */
    const cite = d.querySelector('.term-panel__cite');
    el('term-panel-source').textContent = term.source || '';
    if (cite) cite.hidden = !term.source;
    s.open();
  });
}

/* ---------- Entradas ----------------------------------------
   Dos comportamientos, no uno:

   .reveal     — las imagenes. Entran una vez y ahi se quedan.
   [data-lift] — los textos. Se levantan cada vez que vuelven a pasar
                 por la ventana, escalonados dentro de su propio bloque,
                 asi que cada scroll los vuelve a escribir.            */
function initReveal() {
  const settle = d.querySelectorAll('.reveal');
  const lift = d.querySelectorAll('[data-lift]');
  if (!settle.length && !lift.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;   // el CSS ya los muestra

  
/* ---------- El telon ------------------------------------------
   Al entrar: el telon esta puesto desde el primer pixel y se levanta.
   Al salir: baja, la firma se escribe, y solo entonces se navega.

   No hay enrutador: cada pagina se carga entera, como siempre. Es a
   proposito — todo lo que arranca aqui abajo (el glosario, las hojas,
   la luz del campo, las entradas) se inicializa una vez al cargar, y
   con un enrutador habria que rehacerlo en cada salto.               */
/* ---------- Donde estas -------------------------------------
   Pulsar la pagina en la que ya estas recargaba la misma pantalla: se
   ve como si el sitio no respondiera. Ahora no navega — solo cierra el
   menu. Vale para la barra ancha igual que para el desplegable, porque
   el enlace muerto estaba en las dos.                                */
function initCurrent() {
  const here = sheet('here-panel', 'data-close-here');
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[aria-current="page"]');
    if (!a) return;
    e.preventDefault();
    if (here) here.open();
  });
}

function initCurtain() {
  const el = d.getElementById('curtain');
  if (!el) return;

  const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Levantarlo. Si se ha pedido quietud se va sin ceremonia. */
  const lift = () => {
    el.classList.add('is-written');
    requestAnimationFrame(() => el.classList.add('is-lifted'));
  };
  if (quiet) { el.classList.add('is-lifted', 'is-written'); }
  else if (d.readyState === 'complete') lift();
  else addEventListener('load', lift, { once: true });

  /* Volver con el boton de atras devuelve la pagina tal cual estaba, con
     el telon a medio bajar. Hay que quitarlo a mano. */
  addEventListener('pageshow', (e) => {
    if (e.persisted) { el.classList.remove('is-falling'); el.classList.add('is-written', 'is-lifted'); }
  });

  if (quiet) return;

  const SAME = (a) => a.origin === location.origin;
  let leaving = false;

  d.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // abrir en otra pestana
    const a = e.target.closest('a');
    if (!a || !a.href) return;
    if (a.target && a.target !== '_self') return;                   // _blank y compania
    if (a.hasAttribute('download')) return;

    let url;
    try { url = new URL(a.href); } catch (_) { return; }
    if (!SAME(url)) return;                                         // fuera de casa
    if (url.pathname === location.pathname && url.hash) return;     // un ancla de la misma pagina
    if (url.href === location.href) return;

    e.preventDefault();
    if (leaving) return;
    leaving = true;

    el.classList.remove('is-lifted', 'is-written');
    void el.offsetHeight;                    // punto de partida para la transicion
    el.classList.add('is-falling');

    /* Sin firma que escribir, el telon solo tiene que cerrarse: 180ms de
       fundido y la marca asentandose. 420ms y a la siguiente. */
    setTimeout(() => { location.href = url.href; }, 420);
  });
}

initCurrent();
initCurtain();
d.documentElement.classList.add('js-reveal');

  /* El escalonado se calcula una vez, por bloque padre: lo que va junto
     entra junto, en orden, y no de golpe. */
  const groups = new Map();
  lift.forEach((el) => {
    const key = el.closest('.hero__identity, .hero__panel, .about, .page') || d.body;
    const i = groups.get(key) || 0;
    groups.set(key, i + 1);
    el.style.setProperty('--d', i * 90 + 'ms');
  });

  const once = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      obs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px 10% 0px', threshold: 0.01 });
  settle.forEach((el) => once.observe(el));

  /* Sin unobserve: al salir se rearman, y al volver se escriben otra vez. */
  const again = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-in', e.isIntersecting));
  }, { rootMargin: '0px 0px -2% 0px', threshold: 0.05 });
  lift.forEach((el) => again.observe(el));

  // Red de seguridad: nada puede quedarse invisible, pase lo que pase.
  setTimeout(() => {
    d.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight * 1.5) el.classList.add('is-visible');
    });
    d.querySelectorAll('[data-lift]:not(.is-in)').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.top < innerHeight && b.bottom > 0) el.classList.add('is-in');
    });
  }, 3000);
}

initHeader();
initFieldGlow();
initNav();
initSocial();
initContact();
initLang();
initSoon();
initGlossary();
initReveal();
/* Safari en iOS no aplica `:active` a nada si la pagina no escucha el
   tacto en ningun sitio: sin esto, la ficha se enciende al pulsarla en
   Android y no hace nada en un iPhone. Un oyente vacio y pasivo basta
   para que el sistema lo de por bueno; no corre codigo ni estorba al
   desplazamiento. */
d.addEventListener('touchstart', function () {}, { passive: true });

d.documentElement.classList.add('js-ready');
