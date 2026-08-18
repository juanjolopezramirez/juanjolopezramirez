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

/* ---------- Entradas ---------------------------------------- */
function initReveal() {
  const targets = d.querySelectorAll('.reveal');
  if (!targets.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;   // el CSS ya los muestra

  d.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      obs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px 10% 0px', threshold: 0.01 });
  targets.forEach((el) => io.observe(el));

  // Red de seguridad: nada puede quedarse invisible.
  setTimeout(() => {
    d.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight * 1.5) el.classList.add('is-visible');
    });
  }, 3000);
}

initNav();
initSocial();
initLang();
initGlossary();
initReveal();
d.documentElement.classList.add('js-ready');
