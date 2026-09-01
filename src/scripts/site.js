/* =============================================================
   site.js — todo el comportamiento del cliente, en un solo sitio.

   Ojo: el TEXTO ya no se cambia aqui. Astro lo escribe en el
   servidor, un idioma por URL. Este archivo solo se ocupa de:
     · abrir y cerrar menu, hoja de plataformas y glosario
     · el selector de idioma (que ahora navega, no traduce)
     · las animaciones de entrada
   ============================================================= */
import { TERMS } from '../i18n/terms.js';
import { VIDEOS } from '../data/videos.js';
import { UI } from '../i18n/ui.js';

const d = document;
const lang = d.documentElement.lang || 'es';
const t = (k) => (UI[lang] && UI[lang][k]) || UI.en[k] || k;

/* Bloquear el scroll deja un style="" vacio; se retira al soltar.

   Se cuenta en vez de encenderse y apagarse porque las hojas se apilan:
   la de las cuentas se abre desde la de las plataformas, y al cerrar la
   de encima el scroll tiene que seguir bloqueado por la de debajo. */
let locks = 0;
function lockScroll(on) {
  locks = Math.max(0, locks + (on ? 1 : -1));
  if (locks > 0) { d.body.style.overflow = 'hidden'; return; }
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

/* ---------- Hoja generica ----------------------------------
   Las hojas se pueden apilar —la de las cuentas se abre desde la de las
   plataformas—, asi que hay una pila. Sirve para dos cosas: que Escape
   cierre solo la de encima, y que el scroll no se suelte antes de
   tiempo. */
const openSheets = [];

function sheet(panelId, closeAttr) {
  const panel = d.getElementById(panelId);
  if (!panel) return null;
  const closeBtn = panel.querySelector('button[' + closeAttr + ']');
  let lastFocus = null;

  const open = () => {
    if (openSheets.includes(panel)) return;
    lastFocus = d.activeElement;
    panel.hidden = false;
    void panel.offsetHeight;              // punto de partida para la transicion
    panel.classList.add('is-open');
    openSheets.push(panel);
    lockScroll(true);
    if (closeBtn) closeBtn.focus();
  };
  const close = () => {
    const i = openSheets.indexOf(panel);
    if (i === -1) return;                 // ya estaba cerrada: no contar de menos
    openSheets.splice(i, 1);
    panel.classList.remove('is-open');
    lockScroll(false);
    setTimeout(() => { if (!panel.classList.contains('is-open')) panel.hidden = true; }, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  panel.querySelectorAll('[' + closeAttr + ']').forEach((el) => el.addEventListener('click', close));
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openSheets[openSheets.length - 1] === panel) close();
  });
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

/* ---------- Dos cuentas, una por idioma ----------------------
   Instagram y TikTok tienen casa en español y casa en ingles. La ficha
   sigue siendo un enlace de verdad: sin JavaScript lleva a la de casa,
   que es la de español. Aqui se le pone la hoja delante.

   Solo se intercepta el clic limpio. Con Ctrl, con Cmd, con Mayus o con
   el boton de en medio se abre el enlace tal cual: quien pide una
   pestana nueva esta pidiendo el destino, no una pregunta. */
function initAccounts() {
  const s = sheet('account-panel', 'data-close-account');
  if (!s) return;
  const title = d.getElementById('account-panel-title');
  const groups = d.querySelectorAll('[data-account-group]');

  d.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const chip = e.target.closest('[data-accounts]');
    if (!chip) return;
    e.preventDefault();
    const id = chip.getAttribute('data-accounts');
    groups.forEach((g) => { g.hidden = g.getAttribute('data-account-group') !== id; });
    title.textContent = chip.getAttribute('data-account-name') || '';
    s.open();
  });
}

/* ---------- La altura, quieta --------------------------------
   `--vh0` se escribe en la cabecera, antes de pintar. Aqui solo se
   vigila si hace falta volver a medirla.

   La condicion es el ANCHO, no el alto. Esconder la barra del navegador
   cambia el alto y nada mas; girar el telefono cambia los dos. Mirando
   solo el ancho se distingue una cosa de la otra sin tener que adivinar:
   si el ancho no se mueve, no ha pasado nada que justifique recolocar la
   pagina. Eso deja fuera tambien al teclado, que sube y baja el alto. */
function initViewportLock() {
  let w = innerWidth;
  addEventListener('resize', () => {
    if (Math.abs(innerWidth - w) < 40) return;
    w = innerWidth;
    d.documentElement.style.setProperty('--vh0', innerHeight + 'px');
  }, { passive: true });
}

/* ---------- Lo que sale de la foto --------------------------
   Con raton los objetos salen al pasar por encima y se recogen al
   salir; de eso se encarga `:hover` y aqui no hace falta nada.

   En una pantalla tactil no hay `hover`: el primer toque los saca y el
   segundo los recoge. Es la copia entera la que escucha, no un boton
   —no hay nada que pulsar, solo una foto que se abre. */
function initOrbit() {
  const fig = d.querySelector('[data-orbit]');
  if (!fig) return;

  /* La salida no puede existir antes del primer contacto: hasta que no
     han salido una vez, no hay nada de lo que despedirse. */
  const played = () => fig.classList.add('has-played');
  fig.addEventListener('pointerenter', played, { once: true });

  if (matchMedia('(hover: hover)').matches) return;   // con raton manda el CSS
  fig.addEventListener('click', () => { played(); fig.classList.toggle('is-open'); });
}

/* ---------- Selector de idioma ------------------------------
   Ya no traduce: cada bandera es un enlace a la misma pagina en
   otro idioma. Solo abre y cierra.                              */
function initLang() {
  const root = d.querySelector('[data-lang]');
  if (!root) return;
  const btn  = root.querySelector('[data-lang-toggle]');
  const list = root.querySelector('.lang__list');
  const info = root.querySelector('[data-lang-info]');
  let hideTimer = null;

  const setNote = (open) => {
    root.classList.toggle('is-note-open', open);
    if (info) info.setAttribute('aria-expanded', String(open));
  };

  const setOpen = (open) => {
    clearTimeout(hideTimer);
    btn.setAttribute('aria-expanded', String(open));

    if (open) {
      list.hidden = false;
      void list.offsetHeight;              // punto de partida para la entrada
      root.classList.add('is-open', 'has-used');
    } else {
      root.classList.remove('is-open');
      setNote(false);                      // la nota no sobrevive al cierre
      // Se esconde al terminar la salida, no antes: si no, no hay salida.
      hideTimer = setTimeout(() => {
        if (!root.classList.contains('is-open')) list.hidden = true;
      }, 440);
    }
  };

  btn.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));

  if (info) {
    info.addEventListener('click', () =>
      setNote(!root.classList.contains('is-note-open')));
  }

  root.querySelectorAll('[data-lang-close]').forEach((el) =>
    el.addEventListener('click', () => setOpen(false)));

  d.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !root.classList.contains('is-open')) return;
    // Escape cierra primero la nota; el segundo cierra la hoja.
    if (root.classList.contains('is-note-open')) { setNote(false); return; }
    setOpen(false); btn.focus();
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
        /* Un <button> es una caja atomica para el navegador, y eso abre un
           punto de corte a su lado donde las reglas normales no lo
           permitirian: "la Verdad (Emet)" partia justo detras del
           parentesis y lo dejaba solo al final del renglon. No se arregla
           desde CSS —un boton ignora `display: inline`—, asi que la
           puntuacion que abre antes y la que cierra despues se meten con el
           termino en una misma caja que no se puede partir. */
        let pre = text.slice(last, start);
        const open = (pre.match(/[([«¿¡"'\u2018\u201C]+$/) || [''])[0];
        if (open) pre = pre.slice(0, -open.length);
        const close = (text.slice(end).match(/^[)\]»"'.,;:!?\u2019\u201D]+/) || [''])[0];

        if (pre) frag.appendChild(d.createTextNode(pre));

        const b = d.createElement('button');
        b.type = 'button';
        b.className = 'term';
        b.setAttribute('data-term', lookup[m[0].toLowerCase()]);
        b.textContent = m[0];

        const wrap = d.createElement('span');
        wrap.className = 'term-wrap';
        if (open) wrap.appendChild(d.createTextNode(open));
        wrap.appendChild(b);
        if (close) wrap.appendChild(d.createTextNode(close));
        frag.appendChild(wrap);

        last = end + close.length;
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

/* La ficha de las piezas: el icono la despliega y la pliega. Misma idea
   que la nota del selector de idioma — la aclaracion esta ahi para quien
   la busca y no estorba a quien no. */
/* Dos pasos: el abanico abre la galeria, y de la galeria se entra en la
   ficha de una pieza. La hoja es una sola y cambia de cara — volver es
   ensenar otra vez la galeria, no cerrar y reabrir nada. */
function initCovers() {
  const fan = d.querySelector('[data-covers-open]');
  if (!fan) return;
  const sheetV = sheet('video-panel', 'data-close-video');
  if (!sheetV) return;
  const el = (id) => d.getElementById(id);
  const gallery = el('video-gallery');
  const detail = el('video-detail');

  const showGallery = () => { detail.hidden = true; gallery.hidden = false; };

  fan.addEventListener('click', () => { showGallery(); sheetV.open(); });

  d.addEventListener('click', (e) => {
    if (e.target.closest('[data-video-back]')) { showGallery(); return; }

    const pickBtn = e.target.closest('[data-video]');
    if (!pickBtn) return;
    const v = VIDEOS.find((x) => x.id === pickBtn.getAttribute('data-video'));
    if (!v) return;

    const pick = (o) => (o ? (o[lang] || o.es) : '');
    el('video-detail-webp').srcset = v.webp || '';
    el('video-detail-img').src = v.src;
    el('video-detail-img').alt = v.title.es;
    el('video-detail-title').textContent = pick(v.title);

    /* El titulo original solo cuando se esta leyendo en otro idioma: es lo
       que se ve escrito en la portada, y en español no hay nada que aclarar. */
    const orig = el('video-detail-orig');
    orig.textContent = v.title.es;
    orig.hidden = lang === 'es';

    el('video-detail-blurb').textContent = pick(v.blurb);

    /* Para quien se hizo. Las fichas de todas las marcas ya estan escritas:
       aqui solo se ensena la de esta pieza y se esconden las demas. Si la
       pieza no declara marca, el apartado entero se va — un rotulo que
       dice "Realizado para" y debajo nada es peor que no decir nada. */
    let conMarca = false;
    d.querySelectorAll('[data-brand]').forEach((p) => {
      const mia = p.getAttribute('data-brand') === v.for;
      p.hidden = !mia;
      if (mia) conMarca = true;
    });
    el('video-detail-for').hidden = !conMarca;

    const link = el('video-detail-link');
    link.href = v.href || '';
    link.hidden = !v.href;

    gallery.hidden = true;
    detail.hidden = false;
    detail.scrollTop = 0;
  });
}

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
/* ---------- El telon ------------------------------------------
   Al entrar: el telon esta puesto desde el primer pixel y se levanta.
   Al salir: baja, la firma se escribe, y solo entonces se navega.

   No hay enrutador: cada pagina se carga entera, como siempre. Es a
   proposito — todo lo que arranca aqui abajo (el glosario, las hojas,
   la luz del campo, las entradas) se inicializa una vez al cargar, y
   con un enrutador habria que rehacerlo en cada salto.               */
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
/* ---------- Filtrar las casas -------------------------------
   Cuatro ejes: por lo que hice, por el sector, por el ano y por como
   esta. Los botones los pinta Astro con las etiquetas que de verdad
   llevan las casas de esta pagina; aqui solo se decide quien pasa.

   DENTRO de un eje las etiquetas suman, ENTRE ejes se cruzan. Un eje sin
   nada marcado no filtra: por eso no hace falta un boton de "todas" en
   cada uno, que es lo que convertiria cuatro filas en un muro.

   Se esconde el <li> y no la tarjeta: lo que ocupa el hueco en la rejilla
   es la fila, asi que apagando la tarjeta quedaba el agujero.

   `aria-pressed` y no una clase a secas: quien escucha tiene que saber
   cuales estan puestos, y eso no lo dice un color. */
function initFilter() {
  const bar = d.querySelector('[data-filter-bar]');
  const grid = d.querySelector('.cards__grid');
  if (!bar || !grid) return;
  const clear = bar.querySelector('[data-filter-clear]');
  const none = d.querySelector('[data-filter-none]');
  const rows = [...grid.querySelectorAll(':scope > li')];

  /* Lo puesto, por eje. Un Set por eje y no una lista suelta: asi
     preguntar "hay algo marcado en este eje" es mirar su tamano. */
  const on = new Map();
  bar.querySelectorAll('[data-axis]').forEach((ax) => on.set(ax.getAttribute('data-axis'), new Set()));

  const apply = () => {
    let vistas = 0;
    rows.forEach((li) => {
      const tags = (li.getAttribute('data-tags') || '').split(' ').filter(Boolean);
      /* Pasa si, para CADA eje con algo marcado, lleva al menos una suya. */
      let pasa = true;
      for (const [, marcadas] of on) {
        if (!marcadas.size) continue;
        if (!tags.some((t) => marcadas.has(t))) { pasa = false; break; }
      }
      li.hidden = !pasa;
      if (pasa) vistas++;
    });

    let algo = false;
    for (const [, marcadas] of on) if (marcadas.size) { algo = true; break; }
    if (clear) clear.hidden = !algo;
    if (none) none.hidden = vistas > 0;

    /* Al filtrar, la fila deslizante de movil se queda donde estaba y
       parece vacia: se vuelve al principio, que es donde estan las que
       acaban de quedar. */
    grid.scrollTo({ left: 0, behavior: 'smooth' });
  };

  bar.addEventListener('click', (e) => {
    if (e.target.closest('[data-filter-clear]')) {
      for (const [, marcadas] of on) marcadas.clear();
      bar.querySelectorAll('[data-filter]').forEach((b) => {
        b.classList.remove('is-on');
        b.setAttribute('aria-pressed', 'false');
      });
      apply();
      return;
    }

    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    const axis = btn.closest('[data-axis]').getAttribute('data-axis');
    const tag = btn.getAttribute('data-filter');
    const marcadas = on.get(axis);

    const ahora = !marcadas.has(tag);
    ahora ? marcadas.add(tag) : marcadas.delete(tag);
    btn.classList.toggle('is-on', ahora);
    btn.setAttribute('aria-pressed', String(ahora));
    apply();
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

  /* A partir de aqui el CSS esconde lo que va a entrar. Se pone aqui y no
     antes: si no hay observador que las descubra, no puede esconderlas.  */
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
initViewportLock();
initSocial();
initContact();
initAccounts();
initOrbit();
initLang();
initSoon();
initGlossary();
initCovers();
initCurrent();
initCurtain();
initFilter();
initReveal();
/* Safari en iOS no aplica `:active` a nada si la pagina no escucha el
   tacto en ningun sitio: sin esto, la ficha se enciende al pulsarla en
   Android y no hace nada en un iPhone. Un oyente vacio y pasivo basta
   para que el sistema lo de por bueno; no corre codigo ni estorba al
   desplazamiento. */
d.addEventListener('touchstart', function () {}, { passive: true });

d.documentElement.classList.add('js-ready');
