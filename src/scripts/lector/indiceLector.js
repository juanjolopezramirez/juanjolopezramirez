/* EL INDICE DEL LIBRO (puro: sin pagina, sin red). Lee las hojas del libro (las filas de pages.json, o las del enlace
   privado: { text, links: [{ href | page, x, y, w, h }] }) y arma lo que muestran las pestañas del «Índice»:

     palabrasDe(hojas)            las definiciones, una por palabra (sin mirar tildes ni mayusculas), con sus paginas
     citasDe(hojas)               las citas biblicas, en el orden de la Biblia, una por pasaje, con sus paginas
     buscar(hojas, q, { max })    las paginas donde sale lo buscado (sin tildes ni mayusculas), con el trozo de alrededor

   Las paginas van desde 0 (la primera imagen del libro). Las notas se leen con notaDeEnlace: una falsa no cuenta. */
import { notaDeEnlace } from './notaEnPdf.js';
export { tituloDeNota } from './notaEnPdf.js';
import { deCanonica } from '../biblia/referencias.js';
import { libroDe } from '../biblia/libros.js';

export const BUSCA_MIN = 2;
export const BUSCA_MAX = 100;
const ANTES = 40, DESPUES = 70;

/* Sin tildes, sin mayusculas: «Ahavá» y «AHAVA» son la misma palabra */
export const llano = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function notasDe(hojas, k, opciones) {
  const salida = [];
  (Array.isArray(hojas) ? hojas : []).forEach((h, p) => {
    for (const l of h && Array.isArray(h.links) ? h.links : []) {
      if (!l || typeof l.href !== 'string') continue;
      const nota = notaDeEnlace(l.href, opciones);
      if (nota && nota.k === k) salida.push({ nota, p });
    }
  });
  return salida;
}
const agregar = (mapa, clave, nota, p) => {
  const ya = mapa.get(clave);
  if (!ya) mapa.set(clave, { nota, paginas: [p] });
  else if (!ya.paginas.includes(p)) ya.paginas.push(p);
};

/* [{ nota, paginas }] por orden alfabetico; la primera vez que sale una palabra manda (su definicion es la que se ve) */
export function palabrasDe(hojas, opciones = {}) {
  const mapa = new Map();
  for (const { nota, p } of notasDe(hojas, 'd', opciones)) agregar(mapa, llano(nota.t).replace(/\s+/g, ' ').trim(), nota, p);
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([, v]) => v);
}

/* [{ nota, paginas }] en el orden de la Biblia (libro, capitulo, versiculo); el mismo pasaje dos veces es una fila */
export function citasDe(hojas, opciones = {}) {
  const mapa = new Map();
  for (const { nota, p } of notasDe(hojas, 'c', opciones)) agregar(mapa, nota.r, nota, p);
  const lugar = (r) => {
    const ref = deCanonica(r);
    const l = ref && libroDe(ref.libro);
    return [l ? l.n : 999, ref ? ref.cap : 0, ref && ref.v1 != null ? ref.v1 : 0, ref ? ref.cap2 ?? ref.cap : 0, ref && ref.v2 != null ? ref.v2 : 999];
  };
  return [...mapa.entries()]
    .sort(([a], [b]) => {
      const x = lugar(a), y = lugar(b);
      for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
      return 0;
    })
    .map(([, v]) => v);
}

/* Para buscar: sin tildes, sin mayusculas, y todo espacio (salto de linea, doble, el que no se parte) como uno solo */
const ESPACIOS = /\s+/g;
const paraBuscar = (s) => llano(s).replace(ESPACIOS, ' ');

/* El texto llano de cada pagina se arma UNA vez por libro (las hojas son siempre el mismo arreglo mientras el libro esta
   abierto): buscar otra palabra es solo un indexOf por pagina. */
const planos = new WeakMap();
function planosDe(hojas) {
  let p = planos.get(hojas);
  if (!p) {
    p = hojas.map((h) => (h && typeof h.text === 'string' && h.text ? paraBuscar(h.text) : ''));
    planos.set(hojas, p);
  }
  return p;
}

/* El texto llano con, por cada letra llana, de que posicion del texto original viene (asi el trozo se corta en el original).
   Letra a letra: es lento, asi que solo se hace con las paginas donde algo se hallo (100 como mucho). */
function llanoConMapa(texto) {
  let plano = '';
  const de = [];
  let espacio = false;
  for (let i = 0; i < texto.length;) {
    const ch = String.fromCodePoint(texto.codePointAt(i));
    if (/\s/.test(ch)) {
      if (!espacio) { plano += ' '; de.push(i); }
      espacio = true;
    } else {
      espacio = false;
      const l = llano(ch);
      for (let j = 0; j < l.length; j++) de.push(i);
      plano += l;
    }
    i += ch.length;
  }
  de.push(texto.length);
  return { plano, de };
}

/* Corta en un espacio cercano para no partir una palabra (si lo hay a menos de 12 letras) */
function cortarAntes(texto, desde) {
  if (desde <= 0) return 0;
  const sp = texto.indexOf(' ', desde);
  return sp >= 0 && sp - desde < 12 ? sp + 1 : desde;
}
function cortarDespues(texto, hasta) {
  if (hasta >= texto.length) return texto.length;
  const sp = texto.lastIndexOf(' ', hasta);
  return sp > 0 && hasta - sp < 12 ? sp : hasta;
}

/* { q, filas: [{ p, antes, hallado, despues }], tope } — una fila por pagina (lo primero que sale en ella).
   `q` corto (menos de BUSCA_MIN letras sin espacios) → filas vacias y `corto: true`. */
export function buscar(hojas, q, { max = BUSCA_MAX } = {}) {
  const pedido = paraBuscar(String(q ?? '')).trim().slice(0, 80);
  if (pedido.replace(/\s/g, '').length < BUSCA_MIN) return { q: pedido, filas: [], corto: true, tope: false };
  const filas = [];
  let tope = false;
  const lista = Array.isArray(hojas) ? hojas : [];
  const cache = planosDe(lista);
  for (let p = 0; p < lista.length; p++) {
    if (!cache[p] || cache[p].indexOf(pedido) < 0) continue;
    if (filas.length >= max) { tope = true; break; }
    const texto = lista[p].text;
    /* Ahora si, letra a letra, para cortar el trozo en el texto original */
    const { plano, de } = llanoConMapa(texto);
    const k = plano.indexOf(pedido);
    if (k < 0) continue;              // (una letra que cambia segun lo que la rodea: rarisimo, y no se inventa un trozo)
    const ini = de[k], fin = de[k + pedido.length];
    const a = cortarAntes(texto, Math.max(0, ini - ANTES));
    const b = cortarDespues(texto, Math.min(texto.length, fin + DESPUES));
    filas.push({
      p,
      antes: (a > 0 ? '…' : '') + texto.slice(a, ini).replace(/^\s+/, '').replace(ESPACIOS, ' '),
      hallado: texto.slice(ini, fin).replace(ESPACIOS, ' '),
      despues: (b < texto.length ? texto.slice(fin, b).replace(/[\s.,;:]+$/, '') + '…' : texto.slice(fin, b).trimEnd()).replace(ESPACIOS, ' '),
    });
  }
  return { q: pedido, filas, corto: false, tope };
}

/* ¿Tiene el libro texto en el que buscar? (un PDF escaneado no trae) */
export const hayTexto = (hojas) => Array.isArray(hojas) && hojas.some((h) => h && typeof h.text === 'string' && h.text.trim());
