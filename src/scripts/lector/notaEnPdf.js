/* UNA NOTA DENTRO DE UN PDF: una palabra con su definicion, o una cita biblica. Como el boton de copiar (copiaEnPdf.js), la
   nota viaja ENTERA en un enlace: `https://juanjolopezramirez.com/nota/#n=<base64url del JSON en UTF-8>`. Lo que va tras
   el «#» no llega a ningun servidor. El lector de Recursos y del enlace privado reconoce el enlace y abre la nota encima del
   libro; un visor de PDF cualquiera lo abre en /nota/, que muestra lo mismo.

     definicion  { v:1, k:'d', t, d, r:{ a, y, ti, f, u } | rf, ft, fd, l? }
     cita        { v:1, k:'c', r:'JER.1.4-5', x:'Jeremías 1:4-5', rv:'NVI', ft?, fv?, l? }
     las dos     ... cl?, cd?, ee?, el?

   t titulo (80) · d descripcion (1200) · r referencia APA por partes (200 cada una; u solo https, 300) · rf referencia
   escrita a mano (400) · ft/fd la letra del titulo y de la descripcion (solo las de FUENTES_NOTA; otra cualquiera = la del
   libro) · r de la cita en forma canonica (biblia/referencias.js) · x como se lee (120; el titulo NO sale de aqui: puede ser
   solo «4:3» en «Mateo 3:17 y 4:3») · rv la version que recomienda el
   autor en Bible Gateway · fv la letra del texto de los versiculos (una para todo el libro; solo las de FUENTES_NOTA; sin
   ella, la de siempre: Young Serif) · l el idioma del libro ('es' | 'en'), opcional: la pagina /nota/ lo usa para elegir la version.
   cl / cd los colores del libro para el tema CLARO / OSCURO del lector: [titulo, texto] ('#rrggbb' o '' = el de siempre) ·
   ee / el el efecto de entrada y el de movimiento suave (solo los de ENTRADAS_NOTA / BUCLES_NOTA). Una nota sin ellos se
   ve como siempre. En una cita, ft es la letra de su titulo (la del libro para todas sus referencias; sin ella, Young Serif).

   Puro: sin pagina, sin red. Lo usaran el lector, la pagina /nota/ y el Taller. Todo lo que llega se trata como hostil. */
import { deCanonica, rotulo, VERSION_GATEWAY } from '../biblia/referencias.js';

export const ORIGEN_NOTA = 'https://juanjolopezramirez.com';
export const RUTA_NOTA = '/nota/';
export const BASE_NOTA = ORIGEN_NOTA + RUTA_NOTA + '#n=';
export const HREF_NOTA_MAX = 8000;
export const TOPES = Object.freeze({ t: 80, d: 1200, parte: 200, u: 300, rf: 400, x: 120 });

/* Las letras que puede pedir una nota. Las tres primeras ya las trae el sitio (layouts/Base.astro); las otras se piden a
   Google al usarse, una hoja por familia, con una direccion FIJA de aqui (nunca un nombre que venga en la nota). */
export const FUENTES_NOTA = Object.freeze({
  'young-serif': Object.freeze({ familia: 'Young Serif', css: '"Young Serif", Georgia, serif', google: 'Young+Serif', sitio: true }),
  'bricolage-grotesque': Object.freeze({ familia: 'Bricolage Grotesque', css: '"Bricolage Grotesque", system-ui, sans-serif', google: 'Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600', sitio: true }),
  petemoss: Object.freeze({ familia: 'Petemoss', css: '"Petemoss", cursive', google: 'Petemoss', sitio: true }),
  estonia: Object.freeze({ familia: 'Estonia', css: '"Estonia", Georgia, serif', google: 'Estonia', sitio: false }),
  'frank-ruhl-libre': Object.freeze({ familia: 'Frank Ruhl Libre', css: '"Frank Ruhl Libre", Georgia, serif', google: 'Frank+Ruhl+Libre:wght@400;500;700', sitio: false }),
  lora: Object.freeze({ familia: 'Lora', css: '"Lora", Georgia, serif', google: 'Lora:ital,wght@0,400;0,600;1,400', sitio: false }),
});
export const FUENTE_LIBRO = 'libro';

/* Los efectos que puede pedir una nota, de una lista FIJA (lector/efectosNota.js los anima). '' o uno que no esta = ninguno. */
export const ENTRADAS_NOTA = Object.freeze(['aparece', 'sube', 'letra', 'tinta']);
export const BUCLES_NOTA = Object.freeze(['brillo', 'respira', 'subraya']);
export const entradaValida = (id) => typeof id === 'string' && ENTRADAS_NOTA.includes(id);
export const bucleValido = (id) => typeof id === 'string' && BUCLES_NOTA.includes(id);

/* Un color de nota: '#rrggbb' en minusculas, o '' si no es uno */
export const colorNota = (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim().toLowerCase() : '');
/* Un par [titulo, texto] de un tema; null si no trae ningun color valido */
export function parDeColores(v) {
  if (!Array.isArray(v) || v.length !== 2) return null;
  const par = [colorNota(v[0]), colorNota(v[1])];
  return par[0] || par[1] ? par : null;
}
export const fuenteValida = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(FUENTES_NOTA, id);
export const hojaDeFuente = (id) => (fuenteValida(id) ? `https://fonts.googleapis.com/css2?family=${FUENTES_NOTA[id].google}&display=swap` : null);

/* Controles, invisibles y marcas de direccion (los mismos rangos que copiaEnPdf.js, escritos en numeros) */
const RANGOS = [[0, 8], [0xb, 0xc], [0xe, 0x1f], [0x7f, 0x9f], [0xad, 0xad], [0x200b, 0x200f], [0x202a, 0x202e], [0x2060, 0x2064], [0x2066, 0x2069], [0xfeff, 0xfeff]];
const OCULTOS = new RegExp('[' + RANGOS.map(([a, b]) => String.fromCharCode(a) + (b > a ? '-' + String.fromCharCode(b) : '')).join('') + ']', 'g');
const B64 = /^[A-Za-z0-9_-]+$/;
// eslint-disable-next-line no-control-regex
const URL_MALA = /[\u0000-\u0020\u007f-\u009f<>"\\`]/;

const propia = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const objeto = (x) => !!x && typeof x === 'object' && !Array.isArray(x);

/* Un texto limpio y con tope, contado en letras (un emoji no se parte por la mitad). '' si no hay nada. `lineas`: deja los
   saltos de linea (la descripcion); si no, todo espacio cuenta como uno. */
function texto(v, tope, lineas = false) {
  if (typeof v !== 'string') return '';
  let s = v.replace(/\r\n?/g, '\n').replace(OCULTOS, '');
  s = lineas ? s.replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ');
  s = s.trim();
  const letras = Array.from(s);
  return letras.length > tope ? letras.slice(0, tope).join('').trim() : s;
}

/* Solo https, sin usuario ni clave, sin espacios ni comillas, con tope */
function urlSegura(v) {
  if (typeof v !== 'string' || !v || v.length > TOPES.u || URL_MALA.test(v)) return null;
  let u;
  try { u = new URL(v); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || !u.hostname) return null;
  return u.href.length <= TOPES.u ? u.href : null;
}

function version(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim().toUpperCase();
  return VERSION_GATEWAY.test(s) ? s : null;
}

/* La nota limpia (un objeto sin prototipo, solo con lo que se conoce, cada tope cumplido), o null si no es una nota. */
export function limpiarNota(x) {
  if (!objeto(x) || x.v !== 1 || (x.k !== 'd' && x.k !== 'c')) return null;
  const n = Object.create(null);
  n.v = 1;
  n.k = x.k;
  if (x.k === 'd') {
    const t = texto(x.t, TOPES.t);
    if (!t) return null;
    n.t = t;
    const d = texto(x.d, TOPES.d, true);
    if (d) n.d = d;
    if (propia(x, 'r') && objeto(x.r)) {
      const r = Object.create(null);
      for (const k of ['a', 'y', 'ti', 'f']) {
        const s = propia(x.r, k) ? texto(x.r[k], TOPES.parte) : '';
        if (s) r[k] = s;
      }
      const u = propia(x.r, 'u') ? urlSegura(x.r.u) : null;
      if (u) r.u = u;
      if (Object.keys(r).length) n.r = r;
    }
    if (!n.r) {
      const rf = texto(x.rf, TOPES.rf, true);
      if (rf) n.rf = rf;
    }
    for (const k of ['ft', 'fd']) if (fuenteValida(x[k])) n[k] = x[k];
  } else {
    if (typeof x.r !== 'string' || !deCanonica(x.r)) return null;
    n.r = x.r;
    const etiqueta = texto(x.x, TOPES.x);
    if (etiqueta) n.x = etiqueta;
    const rv = version(x.rv);
    if (rv) n.rv = rv;
    if (fuenteValida(x.ft)) n.ft = x.ft;
    if (fuenteValida(x.fv)) n.fv = x.fv;
  }
  for (const k of ['cl', 'cd']) { const par = propia(x, k) ? parDeColores(x[k]) : null; if (par) n[k] = par; }
  if (entradaValida(x.ee)) n.ee = x.ee;
  if (bucleValido(x.el)) n.el = x.el;
  if (x.l === 'es' || x.l === 'en') n.l = x.l;
  return n;
}

/* base64url de bytes y de vuelta, con lo que traen el navegador y Node (btoa/atob), sin relleno */
function aBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function deBase64Url(s) {
  if (!B64.test(s) || s.length % 4 === 1) return null;
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch { return null; }
}

/* Donde empieza un enlace de nota en un sitio: 'https://juanjolopezramirez.com' → '…/nota/'. Tambien la copia de prueba
   (`npm run dev`, o el sitio en una subcarpeta): su origen MAS su BASE_URL. null si no tiene forma de origen. */
const ORIGEN = /^https?:\/\/[A-Za-z0-9.-]+(:\d{1,5})?(\/[A-Za-z0-9._~-]+)*\/?$/;
export function rutaDeNota(origen = ORIGEN_NOTA) {
  if (typeof origen !== 'string' || !ORIGEN.test(origen)) return null;
  return origen.replace(/\/+$/, '') + RUTA_NOTA;
}
const prefijos = (origenes) => [BASE_NOTA, ...(Array.isArray(origenes) ? origenes : [origenes])
  .map((o) => (o ? rutaDeNota(o) : null)).filter(Boolean).map((r) => r + '#n=')];

/* ¿Dice ser una nota? (empieza por /nota/ de un origen aceptado). Sirve para tirar una falsa en vez de dejarla como enlace. */
export function pareceEnlaceNota(href, { origenes = [] } = {}) {
  if (typeof href !== 'string') return false;
  return [ORIGEN_NOTA, ...(Array.isArray(origenes) ? origenes : [origenes])].some((o) => {
    const r = o ? rutaDeNota(o) : null;
    return !!r && href.startsWith(r);
  });
}

/* La nota de un enlace (limpia), o null si no es una o viene mal escrita. `origenes`: otros sitios aceptados ademas del de
   verdad (el de `npm run dev`). */
export function notaDeEnlace(href, { origenes = [] } = {}) {
  if (typeof href !== 'string' || href.length > HREF_NOTA_MAX) return null;
  const base = prefijos(origenes).find((p) => href.startsWith(p));
  if (!base) return null;
  const bytes = deBase64Url(href.slice(base.length));
  if (!bytes) return null;
  let datos;
  try { datos = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { return null; }
  return limpiarNota(datos);
}

export const esEnlaceNota = (href, opciones) => notaDeEnlace(href, opciones) !== null;

/* Como se nombra una nota: la palabra, o la referencia COMPLETA en el idioma del libro, sacada de su forma canonica
   («Mateo 4:3», «Salmo 24:1-3»). Nunca `x`: en una cita partida («Mateo 3:17 y 4:3») la segunda solo dice «4:3». */
export function tituloDeNota(nota, idioma = 'es') {
  if (!nota) return '';
  if (nota.k === 'd') return nota.t;
  return rotulo(deCanonica(nota.r), idioma === 'en' ? 'en' : 'es') || nota.x || nota.r;
}

/* El enlace de una nota (ya limpia aqui), o null si no es una nota o no cabe. `origen`: el sitio (por omision, el de verdad). */
export function enlaceDeNota(nota, { origen = ORIGEN_NOTA } = {}) {
  const n = limpiarNota(nota);
  const ruta = rutaDeNota(origen);
  if (!n || !ruta) return null;
  /* Siempre en el mismo orden: la misma nota da el mismo enlace */
  const orden = n.k === 'd' ? ['v', 'k', 't', 'd', 'r', 'rf', 'ft', 'fd', 'cl', 'cd', 'ee', 'el', 'l'] : ['v', 'k', 'r', 'x', 'rv', 'ft', 'fv', 'cl', 'cd', 'ee', 'el', 'l'];
  const plano = {};
  for (const k of orden) if (n[k] !== undefined) plano[k] = n.k === 'd' && k === 'r' ? { ...n.r } : Array.isArray(n[k]) ? [...n[k]] : n[k];
  const href = ruta + '#n=' + aBase64Url(new TextEncoder().encode(JSON.stringify(plano)));
  return href.length <= HREF_NOTA_MAX ? href : null;
}
