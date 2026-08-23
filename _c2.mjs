import fs from 'fs';
const toCRLF = x => x.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
const must = (h, n, w) => { if (!h.includes(n)) { console.error('MISSING: ' + w); process.exit(1); } };

/* ---------- 1. el componente recibe el idioma ---------- */
let J = fs.readFileSync('src/pages/[lang]/projects.astro', 'utf8');
must(J, '<Covers slot="aside" t={t} />', 'covers usage');
J = J.replace('<Covers slot="aside" t={t} />', '<Covers slot="aside" lang={lang} t={t} />');
fs.writeFileSync('src/pages/[lang]/projects.astro', J, 'utf8');

/* ---------- 2. las palabras ---------- */
let u = fs.readFileSync('src/i18n/ui.js', 'utf8');
const nl = u.includes('\r\n') ? '\r\n' : '\n';
const q = x => "'" + x.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

/* "Videos" no le hacia justicia: la palabra de la casa para esto ya existe
   —"comparto historias a traves del espiritu de Timoteo"— y es esa. */
const T = {
  en: { title: 'Stories',   lead: 'Pieces that start from a text and try to reveal something, not to fill a feed.',
        a11y: 'See the titles in your language' },
  es: { title: 'Historias', lead: 'Piezas que nacen de un texto y buscan revelar algo, no llenar un feed.',
        a11y: 'Ver los títulos en tu idioma' },
  pt: { title: 'Histórias', lead: 'Peças que nascem de um texto e buscam revelar algo, não preencher um feed.',
        a11y: 'Ver os títulos no seu idioma' },
  fr: { title: 'Histoires', lead: 'Des pièces qui naissent d’un texte et cherchent à révéler quelque chose, pas à remplir un fil.',
        a11y: 'Voir les titres dans votre langue' },
  it: { title: 'Storie',    lead: 'Pezzi che nascono da un testo e cercano di rivelare qualcosa, non di riempire un feed.',
        a11y: 'Vedere i titoli nella tua lingua' }
};
const ORDER = ['en', 'es', 'pt', 'fr', 'it'];

/* videos.title se reescribe en su sitio */
let cursor = 0;
for (const lang of ORDER) {
  const needle = "      'videos.title':";
  const i = u.indexOf(needle, cursor);
  if (i < 0) { console.error('videos.title not found for ' + lang); process.exit(1); }
  const end = u.indexOf('\n', i);
  const line = "      'videos.title':   " + q(T[lang].title) + ',' + nl +
               "      'videos.lead':    " + q(T[lang].lead) + ',' + nl +
               "      'a11y.videosNote':" + q(T[lang].a11y) + ',';
  u = u.slice(0, i) + line + u.slice(end);
  cursor = i + line.length;
}
fs.writeFileSync('src/i18n/ui.js', u, 'utf8');

/* ---------- 3. los estilos ---------- */
let b = fs.readFileSync('src/styles/base.css', 'utf8');
const start = b.indexOf(toCRLF('/* =============================================================\r\n   LAS PORTADAS, EN ABANICO'));
const end = b.indexOf(toCRLF('/* =============================================================\r\n   Footer'));
if (start < 0 || end < 0) { console.error('covers block bounds'); process.exit(1); }

const css = toCRLF([
'/* =============================================================',
'   LAS PIEZAS, EN ABANICO',
'',
'   Tres portadas solapadas: la de en medio delante y algo mas grande, las',
'   de los lados inclinadas hacia fuera. Se montan con margenes negativos',
'   —no con posiciones absolutas— para que la fila siga midiendo lo que',
'   ocupa y no haya que darle un alto a mano.',
'',
'   Dos cajas por tarjeta, y no por gusto: la de fuera inclina, la de dentro',
'   se levanta. Las dos cosas se hacen con `translate` y `rotate`, que son',
'   propiedades sueltas y no se pisan entre si — pero dos animaciones sobre',
'   la MISMA propiedad y el mismo elemento si se pisarian, y el turno de',
'   levantarse mataria al abrir el abanico.',
'   ============================================================= */',
'.covers { display: grid; justify-items: center; }',
'',
'.covers__head { display: flex; align-items: center; gap: .5rem; }',
'.covers__title {',
'  margin: 0;',
'  font-size: .68rem; font-weight: 700;',
'  letter-spacing: .14em; text-transform: uppercase;',
'  color: #5A6B74;',
'}',
'.covers__info {',
'  display: grid; place-items: center;',
'  width: 1.1rem; height: 1.1rem;',
'  border-radius: 50%;',
'  color: #5A6B74;',
'  transition: color .2s var(--ease), background-color .2s var(--ease);',
'}',
'.covers__info .icon { width: .85rem; height: .85rem; }',
'.covers__info:hover { color: var(--iris-700); }',
'',
'.covers__lead {',
'  max-width: 22rem;',
'  margin: .55rem 0 1.4rem;',
'  font-size: .8rem; font-weight: 300;',
'  line-height: 1.55;',
'  color: #5A6B74;',
'  text-align: center;',
'  text-wrap: balance;',
'}',
'',
'.covers__fan {',
'  display: flex; align-items: center; justify-content: center;',
'  margin: 0; padding: 0; list-style: none;',
'}',
'',
'/* La de fuera: inclina y ordena la profundidad. */',
'.covers__item {',
'  flex: 0 0 auto;',
'  width: clamp(5.5rem, 26vw, 8.5rem);',
'  transition: rotate .45s var(--ease-smooth);',
'}',
'.covers__item:first-child  { rotate: -7deg; margin-right: -6%; z-index: 1; }',
'.covers__item:last-child   { rotate:  7deg; margin-left:  -6%; z-index: 1; }',
'.covers__item:nth-child(2) { scale: 1.16; z-index: 2; }',
'',
'/* La de dentro: es la tarjeta, y la que se levanta por turnos. */',
'.covers__card {',
'  display: block;',
'  border-radius: 14px;',
'  overflow: hidden;',
'  background: var(--pine-900);',
'  box-shadow: 0 18px 34px -20px rgba(11, 20, 13, .85);',
'  animation: coverLift 15s var(--ease-smooth) infinite;',
'}',
'.covers__card img { width: 100%; height: auto; display: block; }',
'',
'/* Quince segundos de vuelta y tres turnos: cada tarjeta sube una vez,',
'   cinco segundos despues de la anterior. El resto del ciclo esta quieta,',
'   asi que nunca hay dos moviendose a la vez. */',
'.covers__item:nth-child(1) .covers__card { animation-delay: 0s; }',
'.covers__item:nth-child(2) .covers__card { animation-delay: 5s; }',
'.covers__item:nth-child(3) .covers__card { animation-delay: 10s; }',
'@keyframes coverLift {',
'  0%, 20%, 100% { translate: 0 0;     box-shadow: 0 18px 34px -20px rgba(11, 20, 13, .85); }',
'  8%            { translate: 0 -11px; box-shadow: 0 28px 42px -20px rgba(11, 20, 13, .95); }',
'}',
'',
'/* Al pasar por encima el abanico se abre: solo cambia el angulo, que el',
'   desplazamiento lo tiene pedido el turno de levantarse. */',
'.covers__fan:hover .covers__item:first-child { rotate: -13deg; }',
'.covers__fan:hover .covers__item:last-child  { rotate:  13deg; }',
'',
'/* --- La ficha: plegada de entrada, la abre el icono --- */',
'.covers__wrap {',
'  display: grid;',
'  grid-template-rows: 0fr;',
'  width: min(22rem, 100%);',
'  transition: grid-template-rows .42s var(--ease-smooth);',
'}',
'.covers.is-open .covers__wrap { grid-template-rows: 1fr; }',
'.covers__inner { overflow: hidden; }',
'',
'.covers__note {',
'  margin: 1.35rem 0 .8rem;',
'  font-size: .7rem; font-weight: 300;',
'  color: #5A6B74;',
'  text-align: center;',
'  text-wrap: pretty;',
'}',
'.covers__titles {',
'  display: grid; gap: .7rem;',
'  margin: 0; padding: 0 0 .25rem;',
'  list-style: none;',
'}',
'.covers__titles li { display: grid; gap: .1rem; }',
'.covers__titles b {',
'  font-size: .82rem; font-weight: 600; letter-spacing: -.01em;',
'  color: var(--slate);',
'}',
'/* El titulo original, debajo y mas callado: es lo que se ve en la portada. */',
'.covers__titles small { font-size: .7rem; font-weight: 300; color: #5A6B74; }',
'.covers__blurb { font-size: .74rem; font-weight: 300; line-height: 1.5; color: #5A6B74; }',
'',
'.covers__link {',
'  display: inline-flex; align-items: center; gap: .35rem;',
'  color: inherit;',
'  transition: color .2s var(--ease);',
'}',
'.covers__link .icon { width: .7rem; height: .7rem; }',
'.covers__link:hover { color: var(--iris-700); }',
'',
'/* Si se ha pedido quietud, las tarjetas ni se levantan ni se abren. */',
'@media (prefers-reduced-motion: reduce) {',
'  .covers__card { animation: none; }',
'  .covers__item { transition: none; }',
'  .covers__fan:hover .covers__item:first-child { rotate: -7deg; }',
'  .covers__fan:hover .covers__item:last-child  { rotate:  7deg; }',
'}',
'',
''
].join('\n'));

b = b.slice(0, start) + css + b.slice(end);
fs.writeFileSync(p2 = 'src/styles/base.css', b, 'utf8');

/* En la costura, el aside va sobre el pinar: los tonos suben. */
let d = fs.readFileSync('src/styles/desktop.css', 'utf8');
const dOld = toCRLF([
'  .covers__title { color: var(--pine-200); }',
'  .covers__note { color: var(--pine-200); }',
'  .covers__item { width: clamp(7rem, 11vw, 9.5rem); }'
].join('\n'));
must(d, dOld, 'desktop covers rules');
d = d.replace(dOld, toCRLF([
'  .covers__title,',
'  .covers__lead,',
'  .covers__note,',
'  .covers__info,',
'  .covers__titles small,',
'  .covers__blurb { color: var(--pine-200); }',
'  .covers__titles b { color: var(--bone); }',
'  .covers__info:hover, .covers__link:hover { color: var(--iris-300); }',
'  .covers__item { width: clamp(7rem, 11vw, 9.5rem); }'
].join('\n')));
fs.writeFileSync('src/styles/desktop.css', d, 'utf8');

console.log('covers reworked');
