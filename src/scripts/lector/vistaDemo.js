/* SOLO CON `npm run dev` Y EL MODO DEMO (vista.js lo carga con un `import()` que la compilacion de verdad quita).
   Hace de funcion de borde `vista` con lo que haya en memoria: la demo del Taller (portal/demo.js) guarda ediciones y
   enlaces en la memoria de SU pestaña, y esta pagina es otra pestaña, asi que para probarla la prueba le pasa una
   copia: `window.__vistaDemo = await window.__vistaDemoCopia()` desde la pestaña del Taller, puesta aqui antes de cargar.

   Las mismas reglas de la funcion de verdad: sin la copia, o sin un enlace con esa huella, o apagado, o vencido,
   da lo mismo: null.

   EL LIBRO DE MUESTRA (etapa 5a del lector): sin copia del Taller y con el token de muestra (43 «A»), contesta un libro
   pequeño dibujado aqui mismo, con una palabra definida («Ahavá», con su fuente APA y dos letras), dos citas («Jeremías
   1:4-5» con su version recomendada, «Salmo 139» sin ella), un boton de copiar y una nota falsa (que el lector no pinta).
   Abrir: /es/vista/?demo#k=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA (o /en/vista/… : el mismo libro en ingles). */
import { estadoDe, huella, leerToken } from '../contenido/taller/Enlaces.js';
import { enlaceDeNota } from './notaEnPdf.js';
import { enlaceDeCopia } from './copiaEnPdf.js';

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
  return { ok: true, datos: { titulo: ed.titulo, idioma: ed.idioma, paginas: ed.paginas, ratio: ed.ratio, blando: ed.blando, hojas: ed.hojas, urls: { w900: de(900), w1600: de(1600) } } };
}

/* ---- El libro de muestra ---- */
const W = 900, H = 1260, M = 96;
const TEXTOS = {
  es: {
    titulo: 'Muestra: notas del lector',
    paginas: [
      [['t', 'Muestra'], ['p', 'Notas del lector']],
      [['h', 'Una palabra'], ['p', 'La palabra '], ['d', 'Ahavá'], ['p', ' se suele traducir como amor. Tócala para leer qué significa y de dónde viene.'], ['p', 'Debajo de la palabra hay un punteado de oro: así se sabe que se puede tocar.']],
      [['h', 'Dos citas'], ['p', 'Antes de nacer ya eras conocido, dice '], ['c1', 'Jeremías 1:4-5'], ['p', ', y lo mismo canta el '], ['c2', 'Salmo 139'], ['p', '. Toca cada cita para leer el texto.']],
      [['h', 'Otra vez'], ['p', 'Una palabra puede salir en varias páginas: '], ['d', 'Ahavá'], ['p', ' sale aquí y en la página 1. En el índice sale una sola vez, con sus dos páginas.'], ['k', 'Copiar']],
      [['h', 'Para buscar'], ['p', 'El índice también busca en el texto del libro, sin mirar tildes: prueba con «corazon» o con «AMOR».'], ['f', 'Una nota falsa']],
      [['t', 'Fin'], ['p', 'Contratapa']],
    ],
    def: { v: 1, k: 'd', t: 'Ahavá', d: 'Amor. No nombra un sentimiento que ocurre, sino una decisión que se toma: querer el bien del otro antes de sentirlo.', r: { a: 'Brown, F., Driver, S. R., & Briggs, C. A.', y: '1906', ti: 'A Hebrew and English lexicon of the Old Testament', f: 'Clarendon Press', u: 'https://archive.org/details/hebrewenglishlex00browuoft' }, ft: 'estonia', fd: 'lora', l: 'es' },
    c1: { v: 1, k: 'c', r: 'JER.1.4-5', x: 'Jeremías 1:4-5', rv: 'NVI', l: 'es' },
    c2: { v: 1, k: 'c', r: 'PSA.139', x: 'Salmo 139', l: 'es' },
    copia: 'Antes de nacer ya eras conocido.',
  },
  en: {
    titulo: 'Sample: reader notes',
    paginas: [
      [['t', 'Sample'], ['p', 'Reader notes']],
      [['h', 'A word'], ['p', 'The word '], ['d', 'Ahavah'], ['p', ' is usually translated as love. Tap it to read what it means and where it comes from.'], ['p', 'A dotted gold line under the word says you can tap it.']],
      [['h', 'Two verses'], ['p', 'You were known before you were born, says '], ['c1', 'Jeremiah 1:4-5'], ['p', ', and '], ['c2', 'Psalm 139'], ['p', ' sings the same. Tap each verse to read it.']],
      [['h', 'Again'], ['p', 'A word can show up on several pages: '], ['d', 'Ahavah'], ['p', ' is here and on page 1. The index lists it once, with both pages.'], ['k', 'Copy']],
      [['h', 'To search'], ['p', 'The index also searches the text of the book: try “heart” or “LOVE”.'], ['f', 'A fake note']],
      [['t', 'The end'], ['p', 'Back cover']],
    ],
    def: { v: 1, k: 'd', t: 'Ahavah', d: 'Love. It names not a feeling that happens but a decision that is made: willing the good of the other before feeling it.', r: { a: 'Brown, F., Driver, S. R., & Briggs, C. A.', y: '1906', ti: 'A Hebrew and English lexicon of the Old Testament', f: 'Clarendon Press', u: 'https://archive.org/details/hebrewenglishlex00browuoft' }, ft: 'estonia', fd: 'lora', l: 'en' },
    c1: { v: 1, k: 'c', r: 'JER.1.4-5', x: 'Jeremiah 1:4-5', rv: 'NIV', l: 'en' },
    c2: { v: 1, k: 'c', r: 'PSA.139', x: 'Psalm 139', l: 'en' },
    copia: 'You were known before you were born.',
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
    const nota = k === 'd' ? X.def : k === 'c1' ? X.c1 : k === 'c2' ? X.c2 : null;
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

function libroDeMuestra(idioma) {
  const X = TEXTOS[idioma];
  const n = X.paginas.length;
  const hechas = X.paginas.map((p, i) => pagina(p, i, n, X));
  const hojas = hechas.map((p, i) => {
    const h = { text: p.text };
    if (p.links.length) h.links = p.links;
    if (i > 0 && i < n - 1) h.folio = i;
    return h;
  });
  const urls = hechas.map((p) => p.url);
  return { titulo: X.titulo, idioma, paginas: n, ratio: W / H, blando: false, hojas, urls: { w900: urls, w1600: urls } };
}
