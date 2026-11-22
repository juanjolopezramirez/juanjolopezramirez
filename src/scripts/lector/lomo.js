/* EL LOMO EN EL LECTOR DE LA WEB («Ver el lomo»). Pura: sin pagina, sin red. La comparten el enlace privado (vista.js, que
   lo trae dentro de la primera hoja de la edicion), el lector (site.js, que lo pinta) y el Taller (Publicar.js, que lo escribe).

   Lo que viaja en hojas[0].lomo (PaginasEdicion.js: solo en la fila 0 y solo si el libro es de tapa dura):
     c    el color del lomo ('#rrggbb'), o nada: el lomo toma el color de la tapa
     t    el color de su letra, o nada: la crema de siempre
     x    lo que dice el lomo (40 letras como mucho), o nada: el titulo del libro
     g    el grueso, como parte del ancho de una pagina (0,01 a 0,35), o nada: el grueso automatico (lomoDe, segun las hojas)
     img  la imagen del lomo, pequeña (unos 64 a 96 px de ancho y 1200 de alto): una direccion «data:image/webp» o «png» en
          base64, de hasta LOMO_IMG_MAX letras, cuya cabecera dice que mide LOMO_IMG_LADOS como mucho. Nunca una direccion de
          fuera: la politica del sitio deja `img-src data:`
   Todo es dato ajeno (lo escribio quien tenga el enlace a la base): cada cosa se revisa y lo que no vale se tira. Un libro
   de Recursos no trae imagen (eso pide la base: SQL 017); su lomo es su color y su titulo.

   ESTE ARCHIVO LO CARGA site.js EN TODAS LAS PAGINAS: no importa nada del Taller (marcas.js, IndiceLibro.js traerian las
   tablas de la Biblia y las notas). Por eso el color y el texto se limpian aqui, con la MISMA cuenta que colorValido
   (contenido/taller/marcas.js) y textoIndice (contenido/taller/IndiceLibro.js); tools/test-lomo.mjs comprueba que dan lo
   mismo y que site.js no llega a esos archivos. */
import { lomoDe } from './pliegos.js';

export const LOMO_TEXTO_MAX = 40;
export const LOMO_IMG_MAX = 160000;
export const LOMO_IMG_LADOS = { ancho: 128, alto: 4096 };
export const LOMO_G = { min: 0.01, max: 0.35 };
export const RE_LOMO_IMG = /^data:image\/(webp|png);base64,[A-Za-z0-9+/]+=*$/;

/* Un color «#rrggbb» (o «rgb(r, g, b)»), en minusculas; si no, ''. La misma cuenta que colorValido. */
export function colorDeLomo(v) {
  if (typeof v !== 'string') return '';
  const t = v.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(t)) return t;
  const m = t.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (!m) return '';
  const c = m.slice(1).map(Number);
  return c.every((n) => n <= 255) ? '#' + c.map((n) => n.toString(16).padStart(2, '0')).join('') : '';
}

/* Un texto de una linea, sin controles ni marcas invisibles de direccion, de `max` letras y sin medio emoji al final. La misma
   cuenta que textoIndice. Los rangos se arman con fromCharCode: el archivo no lleva escapes de cuatro cifras. */
const CHR = String.fromCharCode;
const RARAS = new RegExp(`[${CHR(0)}-${CHR(0x1f)}${CHR(0x7f)}${CHR(0x202a)}-${CHR(0x202e)}${CHR(0x2066)}-${CHR(0x2069)}]`, 'gu');
const MEDIO_EMOJI = new RegExp(`[${CHR(0xd800)}-${CHR(0xdbff)}]$`);
export const textoLomo = (v, max) => (typeof v === 'string'
  ? v.replace(RARAS, '').replace(/\s+/g, ' ').trim().slice(0, max).replace(MEDIO_EMOJI, '')
  : '');

/* LAS MEDIDAS DE LA IMAGEN, leidas de su cabecera (los primeros bytes del base64), sin dibujarla: { w, h } o null.
   PNG: la caja IHDR. WebP: VP8 (con perdida), VP8L (sin perdida) o VP8X (extendido). */
export function medidasDeLomo(dir) {
  if (typeof dir !== 'string') return null;
  const coma = dir.indexOf(',');
  if (coma < 0) return null;
  let b;
  try {
    const s = dir.slice(coma + 1, coma + 1 + 48);
    const bin = atob(s.slice(0, s.length - (s.length % 4)));
    b = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  } catch (e) { return null; }
  const es = (i, texto) => [...texto].every((ch, k) => b[i + k] === ch.charCodeAt(0));
  const u32 = (i) => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
  const bueno = (w, h) => (w > 0 && h > 0 ? { w, h } : null);
  if (dir.startsWith('data:image/png;') && b.length >= 24 && b[0] === 0x89 && es(1, 'PNG') && es(12, 'IHDR')) return bueno(u32(16), u32(20));
  if (!dir.startsWith('data:image/webp;') || b.length < 30 || !es(0, 'RIFF') || !es(8, 'WEBP')) return null;
  if (es(12, 'VP8 ') && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) return bueno((b[26] | (b[27] << 8)) & 0x3fff, (b[28] | (b[29] << 8)) & 0x3fff);
  if (es(12, 'VP8L') && b[20] === 0x2f) {
    const n = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return bueno((n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1);
  }
  if (es(12, 'VP8X')) return bueno(1 + (b[24] | (b[25] << 8) | (b[26] << 16)), 1 + (b[27] | (b[28] << 8) | (b[29] << 16)));
  return null;
}

/* ¿Vale esta imagen para el lomo? Su forma de direccion, su largo y lo que dice medir su cabecera. */
export function imagenDeLomoValida(v) {
  if (typeof v !== 'string' || v.length > LOMO_IMG_MAX || !RE_LOMO_IMG.test(v)) return false;
  const m = medidasDeLomo(v);
  return !!m && m.w <= LOMO_IMG_LADOS.ancho && m.h <= LOMO_IMG_LADOS.alto;
}

/* El lomo de una edicion → { c?, t?, x?, g?, img? } con solo lo que vale, o null si no queda nada */
export function limpiarLomoEdicion(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const salida = {};
  const c = colorDeLomo(v.c), t = colorDeLomo(v.t), x = textoLomo(v.x, LOMO_TEXTO_MAX);
  if (c) salida.c = c;
  if (t) salida.t = t;
  if (x) salida.x = x;
  if (typeof v.g === 'number' && Number.isFinite(v.g) && v.g >= LOMO_G.min && v.g <= LOMO_G.max) salida.g = Math.round(v.g * 10000) / 10000;
  if (imagenDeLomoValida(v.img)) salida.img = v.img;
  return Object.keys(salida).length ? salida : null;
}

/* Lo que el lector pinta: el ancho del lomo en px, su texto y sus colores (vacios: los de la hoja de estilo, hojeo.css).
   `lomo` ya limpio (o null); `n` paginas; `pw` el ancho de una pagina en px; `color`/`tinta`: los de repuesto (los de Recursos,
   que salen del tono del libro o del carton de su PDF). */
export function estiloLomoLector(lomo, { titulo = '', n = 0, pw = 0, color = '', tinta = '' } = {}) {
  const l = lomo || {};
  const auto = lomoDe(n, pw);
  const px = l.g ? Math.round(Math.min(pw * LOMO_G.max, Math.max(6, l.g * pw))) : auto;
  return {
    px: px > 0 ? px : 0,
    texto: l.x || textoLomo(titulo, 120),
    color: l.c || colorDeLomo(color),
    tinta: l.t || (l.c ? '' : colorDeLomo(tinta)),
    img: l.img || ''
  };
}
