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
    header.classList.toggle('is-scrolled', scrollY > 24);

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
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
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
    el('term-panel-source').textContent = term.source;
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
initNav();
initSocial();
initLang();
initSoon();
initGlossary();
initReveal();
d.documentElement.classList.add('js-ready');
