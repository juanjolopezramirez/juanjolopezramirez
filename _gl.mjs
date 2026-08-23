import fs from 'fs';
const toCRLF = x => x.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
const must = (h, n, w) => { if (!h.includes(n)) { console.error('MISSING: ' + w); process.exit(1); } };

/* ---------- 1. la hoja: galeria primero, ficha despues ---------- */
let P = fs.readFileSync('src/components/Panels.astro', 'utf8');
const crlfP = P.includes('\r\n');
const fixP = x => crlfP ? x.replace(/\n/g, '\r\n') : x;

const start = P.indexOf(fixP('<!-- La ficha de una pieza:'));
const endMark = fixP('</div>\r\n\r\n<!-- Ya estas aqui.');
const end = P.indexOf(endMark, start);
if (start < 0 || end < 0) { console.error('video panel bounds ' + start + ' ' + end); process.exit(1); }

const block = fixP([
'<!-- Las piezas: dos pasos en la misma hoja.',
'',
'     Primero la galeria — las tres portadas enteras, de frente y sin nada',
'     encima, en fila en pantalla ancha y deslizables en movil. Cada una',
'     lleva su boton de informacion debajo, fuera de la imagen, que es la',
'     unica manera de que se vea igual de bien sobre una portada oscura que',
'     sobre una clara.',
'',
'     Despues la ficha de la pieza elegida. Es la misma hoja cambiando de',
'     cara, no una segunda encima: apilar dos ventanas para leer un parrafo',
'     obliga a cerrar dos veces. -->',
'<div class="video-panel" id="video-panel" hidden>',
'  <div class="video-panel__scrim" data-close-video></div>',
'  <div class="video-panel__sheet" role="dialog" aria-modal="true" aria-labelledby="video-panel-heading">',
'    <button class="video-panel__close" type="button" data-close-video',
'            aria-label={t(\'a11y.closePanel\')}>&times;</button>',
'',
    '    <!-- Paso uno: todas -->',
'    <div class="video-gallery" id="video-gallery">',
'      <h2 class="video-panel__heading" id="video-panel-heading">{t(\'videos.title\')}</h2>',
'      <ul class="video-gallery__row">',
'        {VIDEOS.map((v) => (',
'          <li class="video-gallery__item">',
'            <picture>',
'              <source srcset={v.webp} type="image/webp" />',
'              <img src={v.src} alt={v.title.es} width="700" height="1244" decoding="async" />',
'            </picture>',
'            <button class="video-gallery__info" type="button" data-video={v.id}>',
'              <Icon id="info" /><span>{t(\'videos.about\')}</span>',
'            </button>',
'          </li>',
'        ))}',
'      </ul>',
'      <p class="video-panel__note">{t(\'videos.note\')}</p>',
'    </div>',
'',
'    <!-- Paso dos: una -->',
'    <article class="video-detail" id="video-detail" hidden>',
'      <button class="video-detail__back" type="button" data-video-back>',
'        <Icon id="arrow" /><span>{t(\'videos.back\')}</span>',
'      </button>',
'      <picture class="video-detail__cover">',
'        <source id="video-detail-webp" type="image/webp" />',
'        <img id="video-detail-img" alt="" width="700" height="1244" decoding="async" />',
'      </picture>',
'      <h3 class="video-detail__title" id="video-detail-title"></h3>',
'      <p class="video-detail__orig" id="video-detail-orig" lang="es" hidden></p>',
'      <p class="video-detail__blurb" id="video-detail-blurb"></p>',
'      <a class="video-detail__link" id="video-detail-link" target="_blank" rel="noopener noreferrer">',
'        <span>{t(\'videos.watch\')}</span><Icon id="corner" />',
'      </a>',
'    </article>',
'  </div>',
'</div>'
].join('\n'));

P = P.slice(0, start) + block + fixP('\n\n') + P.slice(end + fixP('</div>\r\n\r\n').length);

if (!P.includes("import { VIDEOS }")) {
  must(P, "import { SOCIAL, CONTACT } from '../data/social.js';", 'panels import');
  P = P.replace("import { SOCIAL, CONTACT } from '../data/social.js';",
    fixP("import { SOCIAL, CONTACT } from '../data/social.js';\nimport { VIDEOS } from '../data/videos.js';"));
}
fs.writeFileSync('src/components/Panels.astro', P, 'utf8');

/* ---------- 2. el script: abrir, elegir, volver ---------- */
let s = fs.readFileSync('src/scripts/site.js', 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const fixJ = x => x.replace(/\n/g, nl);

const oldStart = s.indexOf(fixJ('/* Cada portada abre su propia ficha.'));
const oldEnd = s.indexOf(fixJ('function initCurrent()'));
if (oldStart < 0 || oldEnd < 0) { console.error('initCovers bounds'); process.exit(1); }

const fn = fixJ([
'/* Dos pasos: el abanico abre la galeria, y de la galeria se entra en la',
'   ficha de una pieza. La hoja es una sola y cambia de cara — volver es',
'   ensenar otra vez la galeria, no cerrar y reabrir nada.               */',
'function initCovers() {',
"  const fan = d.querySelector('[data-covers-open]');",
'  if (!fan) return;',
"  const s = sheet('video-panel', 'data-close-video');",
'  if (!s) return;',
'  const el = (id) => d.getElementById(id);',
"  const gallery = el('video-gallery');",
"  const detail = el('video-detail');",
'',
'  const showGallery = () => { detail.hidden = true; gallery.hidden = false; };',
'',
"  fan.addEventListener('click', () => { showGallery(); s.open(); });",
'',
"  d.addEventListener('click', (e) => {",
"    const back = e.target.closest('[data-video-back]');",
'    if (back) { showGallery(); return; }',
'',
"    const pickBtn = e.target.closest('[data-video]');",
'    if (!pickBtn) return;',
"    const v = VIDEOS.find((x) => x.id === pickBtn.getAttribute('data-video'));",
'    if (!v) return;',
'',
"    const pick = (o) => (o ? (o[lang] || o.es) : '');",
"    el('video-detail-webp').srcset = v.webp || '';",
"    el('video-detail-img').src = v.src;",
"    el('video-detail-img').alt = v.title.es;",
"    el('video-detail-title').textContent = pick(v.title);",
'',
'    /* El titulo original solo cuando se lee en otro idioma: es lo que hay',
'       escrito en la portada, y en español no hay nada que aclarar. */',
"    const orig = el('video-detail-orig');",
'    orig.textContent = v.title.es;',
"    orig.hidden = lang === 'es';",
'',
"    el('video-detail-blurb').textContent = pick(v.blurb);",
'',
"    const link = el('video-detail-link');",
"    link.href = v.href || '';",
'    link.hidden = !v.href;',
'',
'    gallery.hidden = true;',
'    detail.hidden = false;',
"    detail.scrollTop = 0;",
'  });',
'}',
'',
''
].join('\n'));

s = s.slice(0, oldStart) + fn + s.slice(oldEnd);
fs.writeFileSync('src/scripts/site.js', s, 'utf8');

/* ---------- 3. las palabras ---------- */
let u = fs.readFileSync('src/i18n/ui.js', 'utf8');
const q = x => "'" + x.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const W = {
  en: { open: 'See the three pieces', about: 'What it is about', back: 'All three' },
  es: { open: 'Ver las tres piezas',  about: 'De qué va',        back: 'Ver las tres' },
  pt: { open: 'Ver as três peças',    about: 'Do que se trata',  back: 'Ver as três' },
  fr: { open: 'Voir les trois pièces', about: 'De quoi ça parle', back: 'Voir les trois' },
  it: { open: 'Vedere i tre pezzi',   about: 'Di cosa parla',    back: 'Vedere i tre' }
};
const ORDER = ['en', 'es', 'pt', 'fr', 'it'];
let cursor = 0;
for (const lang of ORDER) {
  const needle = "      'videos.watch':";
  const i = u.indexOf(needle, cursor);
  if (i < 0) { console.error('videos.watch not found for ' + lang); process.exit(1); }
  const end2 = u.indexOf('\n', i);
  const line = u.slice(i, end2);
  const add = line + nl +
    "      'videos.about':   " + q(W[lang].about) + ',' + nl +
    "      'videos.back':    " + q(W[lang].back) + ',' + nl +
    "      'a11y.videosOpen':" + q(W[lang].open) + ',';
  u = u.slice(0, i) + add + u.slice(end2);
  cursor = i + add.length;
}
/* a11y.videoCard ya no lo usa nadie: la tarjeta dejo de ser boton individual */
u = u.split(/\r?\n/).filter(l => !l.trimStart().startsWith("'a11y.videoCard'")).join(nl);
fs.writeFileSync('src/i18n/ui.js', u, 'utf8');

console.log('gallery + detail wired');
