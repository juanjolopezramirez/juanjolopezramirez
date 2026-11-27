/* SOLO CON `npm run dev` Y EL MODO DEMO (vista.js lo carga con un `import()` que la compilacion de verdad quita).
   Hace de funcion de borde `vista` con lo que haya en memoria: la demo del Taller (portal/demo.js) guarda ediciones y
   enlaces en la memoria de SU pestaña, y esta pagina es otra pestaña, asi que para probarla la prueba le pasa una
   copia: `window.__vistaDemo = await window.__vistaDemoCopia()` desde la pestaña del Taller, puesta aqui antes de cargar.

   Las mismas reglas de la funcion de verdad: sin la copia, o sin un enlace con esa huella, o apagado, o vencido,
   da lo mismo: null.

   EL LIBRO DE MUESTRA (etapa 5a del lector): sin copia del Taller y con el token de muestra (43 «A»), contesta un libro
   pequeño dibujado aqui mismo, con una palabra definida («Ahavá», con su fuente APA y dos letras), cuatro referencias
   («Jeremías 1:4-5» con su version recomendada, «Salmo 139» sin ella, y «Mateo 3:17 y 4:3», partida en dos), un boton de
   copiar y una nota falsa (que el lector no pinta).
   Etapa 5b: dos botones «Duolingo» con su aspecto (el escalon de abajo): uno copia (y dice «Copiado») y otro abre una
   direccion por /ir/. Sus enlaces se escriben con los mismos codificadores del Taller (botonEnPdf.js).
   Las tapas: el color del carton viaja en la primera y la ultima hoja (`tapa`, PaginasEdicion.js); las dos citas piden su
   letra de versiculos (`fv`): Bricolage Grotesque y Estonia, para ver las dos.
   La ficha del «ⓘ» (016): un resumen de dos lineas, tema, tres claves y «Para quién».
   Ronda 3: una referencia partida («Mateo 3:17 y 4:3»: la segunda nota trae x «4:3», como las de antes, y el lector debe
   llamarla «Mateo 4:3»), colores por tema (uno oscuro sobre el papel oscuro, que el lector debe tirar) y un efecto distinto
   en cada nota (en un libro de verdad es uno para todas), para verlos todos.
   El lomo de «Ver el lomo» (lector/lomo.js) viaja en la primera hoja, con una imagen pequeña dibujada aqui.
   Abrir: /es/vista/?demo#k=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA (o /en/vista/… : el mismo libro en ingles). */
import { estadoDe, huella, leerToken } from '../contenido/taller/Enlaces.js';
import { enlaceDeNota } from './notaEnPdf.js';
import { enlaceDeCopia } from './copiaEnPdf.js';
import { enlaceDeCopiaConAspecto, enlaceDeIr } from './botonEnPdf.js';

export const TOKEN_MUESTRA = 'A'.repeat(43);

export async function pedirDemo(token, renovar) {
  const copia = window.__vistaDemo;
  if (!copia && token === TOKEN_MUESTRA) return { ok: true, datos: libroDeMuestra(location.pathname.startsWith('/en/') ? 'en' : 'es') };
  if (!copia || !leerToken(token)) return null;
  const h = await huella(token);
  const enlace = (copia.enlaces || []).find((e) => e.hash === h.bytea);
  if (!enlace || estadoDe(enlace, Date.now()) !== 'activo') return null;
  const ed = (copia.ediciones || []).find((e) => e.id === enlace.edicionId);
  if (!ed) return null;
  const archivos = copia.archivos || {};
  const de = (w) => Array.from({ length: ed.paginas }, (_, i) => archivos[`${ed.carpeta}p${String(i + 1).padStart(3, '0')}-${w}.webp`] || '');
  if (!renovar) enlace.vistas = (enlace.vistas || 0) + 1;
  return { ok: true, datos: { titulo: ed.titulo, idioma: ed.idioma, paginas: ed.paginas, ratio: ed.ratio, blando: ed.blando, hojas: ed.hojas, ficha: ed.ficha, urls: { w900: de(900), w1600: de(1600) } } };
}

/* ---- El libro de muestra ---- */
const W = 900, H = 1260, M = 96;
const TAPAS = ['#6b2d3a', '#4a2a4f'];      // vino delante, ciruela detras: nada que ver con el verde de la hoja de estilo
const LEDGE = 8;                 // el escalon de los botones «Duolingo», en px de la hoja
const DUO = {
  copia: { f: '#58cc02', s: '#46a302', fu: 'Lora' },
  ir: { f: '#1cb0f6', s: '#1899d6', fu: 'Bricolage Grotesque' },
  base: { f: '#263b28', fu: 'Estonia' },
};
/* Los colores de muestra (ronda 3): por tema, [titulo, texto]. Tinta sepia y oro de dia; oro claro y salvia de noche. */
const ESTILO_DEF = { cl: ['#7a3b1f', '#3b2f26'], cd: ['#e8c58a', '#d9d4c7'], ee: 'letra', el: 'brillo' };
/* A1, el grosor: el titulo de las referencias en Frank Ruhl Libre 800; versiculos en Bricolage 300 (Jeremías) y 700 (Mateo 3:17);
   la descripcion de «Ahavá» en Lora 700. Su titulo pide 700 en Estonia, que tiene un solo grosor: el enlace lo tira. */
const ESTILO_CITA = { cl: ['#2f5d50', ''], cd: ['#9fd3c0', '#e4e0d4'], ft: 'frank-ruhl-libre', wt: 800 };   // ronda 4: la letra del titulo de las referencias
const TEXTOS = {
  es: {
    titulo: 'Muestra: notas del lector',
    paginas: [
      [['t', 'Muestra'], ['p', 'Notas del lector']],
      [['h', 'Una palabra'], ['p', 'La palabra '], ['d', 'Ahavá'], ['p', ' se suele traducir como amor. Tócala para leer qué significa y de dónde viene.'], ['p', 'Debajo de la palabra hay un punteado de oro: así se sabe que se puede tocar.']],
      [['h', 'Cuatro referencias'], ['p', 'Antes de nacer ya eras conocido, dice '], ['c1', 'Jeremías 1:4-5'], ['p', ', y lo mismo canta el '], ['c2', 'Salmo 139'], ['p', '. Toca cada referencia para leer el texto.'], ['p', 'Una partida en dos: '], ['c3', 'Mateo 3:17'], ['p', ' y '], ['c4', '4:3'], ['p', '.']],
      [['h', 'Otra vez'], ['p', 'Una palabra puede salir en varias páginas: '], ['d', 'Ahavá'], ['p', ' sale aquí y en la página 1. En el índice sale una sola vez, con sus dos páginas.'], ['k', 'Copiar'], ['kd', 'Copiar la frase'], ['id', 'Ver el ejemplo']],
      [['h', 'Para buscar'], ['p', 'El índice también busca en el texto del libro, sin mirar tildes: prueba con «corazon» o con «AMOR».'], ['f', 'Una nota falsa'], ['kb', 'Copiar (sin escalón)'], ['kl', 'Junto al lomo']],
      [['t', 'Fin'], ['p', 'Contratapa']],
    ],
    def: { v: 1, k: 'd', t: 'Ahavá', d: 'Amor. No nombra un sentimiento que ocurre, sino una decisión que se toma: querer el bien del otro antes de sentirlo.', r: { a: 'Brown, F., Driver, S. R., & Briggs, C. A.', y: '1906', ti: 'A Hebrew and English lexicon of the Old Testament', f: 'Clarendon Press', u: 'https://archive.org/details/hebrewenglishlex00browuoft' }, ft: 'estonia', fd: 'lora', wt: 700, wd: 700, ...ESTILO_DEF, l: 'es' },
    c1: { v: 1, k: 'c', r: 'JER.1.4-5', x: 'Jeremías 1:4-5', rv: 'NVI', fv: 'bricolage-grotesque', ...ESTILO_CITA, wd: 300, ee: 'tinta', el: 'subraya', l: 'es' },
    c2: { v: 1, k: 'c', r: 'PSA.139', x: 'Salmo 139', fv: 'estonia', cd: ['#2a3a2c', ''], el: 'respira', l: 'es' },
    c3: { v: 1, k: 'c', r: 'MAT.3.17', x: 'Mateo 3:17', fv: 'bricolage-grotesque', ...ESTILO_CITA, wd: 700, ee: 'sube', el: 'respira', l: 'es' },
    c4: { v: 1, k: 'c', r: 'MAT.4.3', x: '4:3', fv: 'bricolage-grotesque', ...ESTILO_CITA, ee: 'aparece', l: 'es' },
    copia: 'Antes de nacer ya eras conocido.',
    copiado: 'Copiado',
    ficha: {
      resumen: 'Un libro pequeño para probar el lector.\nTrae una palabra con su definición, dos citas de la Biblia y botones que se pueden tocar.',
      tema: 'Pruebas del lector',
      claves: ['Una palabra que se toca para leer qué significa', 'Dos citas con su texto', 'Botones para copiar una frase'],
      para_quien: 'Para quien prueba el lector antes de publicar'
    },
  },
  en: {
    titulo: 'Sample: reader notes',
    paginas: [
      [['t', 'Sample'], ['p', 'Reader notes']],
      [['h', 'A word'], ['p', 'The word '], ['d', 'Ahavah'], ['p', ' is usually translated as love. Tap it to read what it means and where it comes from.'], ['p', 'A dotted gold line under the word says you can tap it.']],
      [['h', 'Four references'], ['p', 'You were known before you were born, says '], ['c1', 'Jeremiah 1:4-5'], ['p', ', and '], ['c2', 'Psalm 139'], ['p', ' sings the same. Tap each reference to read it.'], ['p', 'One split in two: '], ['c3', 'Matthew 3:17'], ['p', ' and '], ['c4', '4:3'], ['p', '.']],
      [['h', 'Again'], ['p', 'A word can show up on several pages: '], ['d', 'Ahavah'], ['p', ' is here and on page 1. The index lists it once, with both pages.'], ['k', 'Copy'], ['kd', 'Copy the line'], ['id', 'See the example']],
      [['h', 'To search'], ['p', 'The index also searches the text of the book: try “heart” or “LOVE”.'], ['f', 'A fake note'], ['kb', 'Copy (no ledge)'], ['kl', 'By the spine']],
      [['t', 'The end'], ['p', 'Back cover']],
    ],
    def: { v: 1, k: 'd', t: 'Ahavah', d: 'Love. It names not a feeling that happens but a decision that is made: willing the good of the other before feeling it.', r: { a: 'Brown, F., Driver, S. R., & Briggs, C. A.', y: '1906', ti: 'A Hebrew and English lexicon of the Old Testament', f: 'Clarendon Press', u: 'https://archive.org/details/hebrewenglishlex00browuoft' }, ft: 'estonia', fd: 'lora', wt: 700, wd: 700, ...ESTILO_DEF, l: 'en' },
    c1: { v: 1, k: 'c', r: 'JER.1.4-5', x: 'Jeremiah 1:4-5', rv: 'NIV', fv: 'bricolage-grotesque', ...ESTILO_CITA, wd: 300, ee: 'tinta', el: 'subraya', l: 'en' },
    c2: { v: 1, k: 'c', r: 'PSA.139', x: 'Psalm 139', fv: 'estonia', cd: ['#2a3a2c', ''], el: 'respira', l: 'en' },
    c3: { v: 1, k: 'c', r: 'MAT.3.17', x: 'Matthew 3:17', fv: 'bricolage-grotesque', ...ESTILO_CITA, wd: 700, ee: 'sube', el: 'respira', l: 'en' },
    c4: { v: 1, k: 'c', r: 'MAT.4.3', x: '4:3', fv: 'bricolage-grotesque', ...ESTILO_CITA, ee: 'aparece', l: 'en' },
    copia: 'You were known before you were born.',
    copiado: 'Copied',
    ficha: {
      resumen: 'A small book to test the reader.\nIt has a word with its definition, two Bible verses and buttons you can tap.',
      tema: 'Reader tests',
      claves: ['A word you tap to read what it means', 'Two verses with their text', 'Buttons to copy a line'],
      para_quien: 'For whoever tests the reader before publishing'
    },
  },
};

/* Dibuja una pagina y devuelve { url, text, links }: el texto corre en lineas y cada trozo marcado deja su caja (en 0..1) */
function pagina(partes, i, n, X) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const tapa = i === 0 || i === n - 1;
  g.fillStyle = tapa ? '#263B28' : '#F6F3EA';
  g.fillRect(0, 0, W, H);
  g.fillStyle = tapa ? '#F1EFE9' : '#23302A';
  g.textBaseline = 'alphabetic';
  const links = [];
  const texto = [];
  let x = M, y = tapa ? 520 : 200;
  const linea = 52;
  const caja = (x0, y0, w, h) => ({ x: +(x0 / W).toFixed(4), y: +(y0 / H).toFixed(4), w: +(w / W).toFixed(4), h: +(h / H).toFixed(4) });
  for (const [k, s] of partes) {
    if (k === 't') { g.font = '400 92px Georgia, serif'; g.fillText(s, M, y); y += 120; x = M; texto.push(s); continue; }
    if (k === 'h') { g.font = '400 54px Georgia, serif'; g.fillText(s, M, y); y += 90; x = M; texto.push(s); continue; }
    if (k === 'kd' || k === 'id' || k === 'kb' || k === 'kl') {
      /* un boton «Duolingo»: la cara y su escalon de abajo, mas oscuro. El enlace cubre solo la cara (como el de Chrome).
         `kb`: un boton de copiar de siempre con su aspecto (`e: 'base'`, sin escalon). `kl`: uno «Duolingo» pegado al lomo
         (para ver que la sombra del lomo le pasa por encima). */
      const D = k === 'id' ? DUO.ir : k === 'kb' ? DUO.base : DUO.copia;
      const x0 = k === 'kl' ? 6 : M, escalon = k === 'kb' ? 0 : LEDGE;
      y += 56; x = M;
      g.font = '700 32px Georgia, serif';
      const w = g.measureText(s).width + 72, alto = 68, r = k === 'kb' ? 34 : 18;
      if (escalon) { g.fillStyle = D.s; g.beginPath(); g.roundRect(x0, y - 46 + escalon, w, alto, r); g.fill(); }
      g.fillStyle = D.f;
      g.beginPath(); g.roundRect(x0, y - 46, w, alto, r); g.fill();
      g.fillStyle = '#FFFFFF';
      g.fillText(s, x0 + 36, y);
      const aspecto = k === 'kb'
        ? { e: 'base', f: D.f, c: '#f1efe9', rr: r / H, x: s, fu: D.fu, fs: 32 / H, pf: '#f6f3ea', k: X.copiado }
        : { e: 'duolingo', f: D.f, c: '#ffffff', s: D.s, lh: LEDGE / H, rr: r / H, n: 1, x: s, fu: D.fu, fs: 32 / H, pf: '#f6f3ea', ...(k !== 'id' ? { k: X.copiado } : {}) };
      const href = k === 'id' ? enlaceDeIr('https://example.com/', aspecto) : enlaceDeCopiaConAspecto(X.copia, aspecto);
      links.push({ ...caja(x0, y - 46, w, alto), href });
      g.fillStyle = '#23302A';
      y += linea; texto.push(s);
      continue;
    }
    if (k === 'k' || k === 'f') {
      /* un boton (copiar) o la nota falsa: una pastilla en su propia linea */
      y += 40; x = M;
      g.font = '600 32px system-ui, sans-serif';
      const w = g.measureText(s).width + 64;
      g.fillStyle = k === 'k' ? '#263B28' : '#C9C3B4';
      g.beginPath(); g.roundRect(M, y - 44, w, 64, 32); g.fill();
      g.fillStyle = k === 'k' ? '#F1EFE9' : '#23302A';
      g.fillText(s, M + 32, y);
      const href = k === 'k' ? enlaceDeCopia(X.copia) : 'https://juanjolopezramirez.com/nota/#n=bm9lc3VuYW5vdGE';
      links.push({ ...caja(M, y - 44, w, 64), href });
      g.fillStyle = '#23302A';
      y += linea; texto.push(s);
      continue;
    }
    g.font = '400 34px Georgia, serif';
    const nota = k === 'd' ? X.def : /^c\d$/.test(k) ? X[k] : null;
    const palabras = nota ? [s] : s.split(/(\s+)/);
    for (const w of palabras) {
      const ancho = g.measureText(w).width;
      if (x + ancho > W - M && w.trim()) { x = M; y += linea; }
      if (!w.trim() && x === M) continue;
      g.fillText(w, x, y);
      if (nota) links.push({ ...caja(x - 2, y - 34, ancho + 4, 44), href: enlaceDeNota(nota) });
      x += ancho;
    }
    texto.push(s);
    if (k === 'p' && /[.!?]$/.test(s)) { y += linea * 1.4; x = M; }
  }
  if (!tapa) { g.font = '400 26px Georgia, serif'; g.fillStyle = '#55625A'; g.fillText(String(i), W / 2 - 8, H - 70); }
  return { url: c.toDataURL('image/jpeg', 0.86), text: texto.join(' ').replace(/\s+/g, ' ').trim(), links };
}

/* El lomo de muestra (lector/lomo.js): su color, su letra y una imagen pequeña dibujada aqui (una WebP de 80 x 1200, como
   la que escribe Publicar.js): una franja de oro arriba y abajo, el titulo de arriba abajo y un pez al pie. */
function lomoDeMuestra(titulo) {
  const w = 80, h = 1200, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const fondo = g.createLinearGradient(0, 0, 0, h);
  fondo.addColorStop(0, '#5a2431'); fondo.addColorStop(1, '#6b2d3a');
  g.fillStyle = fondo; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c08a2e';
  for (const y of [70, 82, h - 92, h - 80]) g.fillRect(8, y, w - 16, 4);
  g.save();
  g.translate(w / 2, h / 2);
  g.rotate(Math.PI / 2);
  g.fillStyle = '#f1efe9';
  g.font = '600 34px Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(titulo, 0, 0, h - 260);
  g.restore();
  g.strokeStyle = '#c08a2e'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(22, h - 150); g.quadraticCurveTo(40, h - 168, 58, h - 150); g.quadraticCurveTo(40, h - 132, 22, h - 150); g.stroke();
  const webp = c.toDataURL('image/webp', 0.8);
  /* `g`: un lomo de libro grueso (9 % del ancho de la pagina), para que la imagen se vea en un libro de 6 paginas */
  return { c: '#5a2431', t: '#f1efe9', x: titulo.slice(0, 40), g: 0.09, img: webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/png') };
}

function libroDeMuestra(idioma) {
  const X = TEXTOS[idioma];
  const n = X.paginas.length;
  const hechas = X.paginas.map((p, i) => pagina(p, i, n, X));
  const hojas = hechas.map((p, i) => {
    const h = { text: p.text };
    if (p.links.length) h.links = p.links;
    if (i > 0 && i < n - 1) h.folio = i;
    if (i === 0) h.tapa = TAPAS[0];
    if (i === n - 1) h.tapa = TAPAS[1];
    if (i === 0) h.lomo = lomoDeMuestra(X.titulo);
    return h;
  });
  const urls = hechas.map((p) => p.url);
  return { titulo: X.titulo, idioma, paginas: n, ratio: W / H, blando: false, hojas, ficha: X.ficha, urls: { w900: urls, w1600: urls } };
}
