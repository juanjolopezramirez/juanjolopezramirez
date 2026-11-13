/* EL CONTENIDO DEL LIBRO (el indice), sin pantalla. Lo arman igual la mesa y la hoja de impresion: asi cada hoja
   del contenido lleva las mismas filas en los dos lados, y cada numero apunta a donde dice.

   Las anclas son nombres fijos, nunca numeros de pagina: `cap-N` para un capitulo, `t-xxxxxxxx` para un titulo y
   `p-xxxxxxxx` para una pagina libre con nombre. Si se escribe mas arriba, el numero cambia; el ancla no.
   Todo aqui lee igual el JSON guardado y los nodos vivos del editor. */
import { el, txt } from './tipos/ayuda.js';

export const RE_ANCLA = /^[tp]-[0-9a-f]{8}$/;
export const RE_ANCLA_TITULO = /^t-[0-9a-f]{8}$/;
export const RE_ANCLA_PAGINA = /^p-[0-9a-f]{8}$/;
export const TITULO_INDICE_MAX = 120;
const TEXTO_FILA_MAX = 300;
/* Un libro de verdad no pasa de unos cientos de filas: mas, y medirlas colgaria la mesa y la impresion */
export const ENTRADAS_MAX = 500;

/* Solo un texto pasa la prueba: un arreglo con un ancla adentro tambien la pasaria con RegExp.test */
export const esAncla = (re, v) => typeof v === 'string' && re.test(v);
/* El texto de una fila o un nombre: sin controles ni marcas invisibles de direccion, una linea, sin medio emoji */
const RARAS = /[\u0000-\u001F\u007F‪-‮⁦-⁩]/g;
export const textoIndice = (v, max) => (typeof v === 'string'
  ? v.replace(RARAS, '').replace(/\s+/g, ' ').trim().slice(0, max).replace(/[\uD800-\uDBFF]$/, '')
  : '');

const hex = () => [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('');
export const anclaNueva = (prefijo) => `${prefijo}-${hex()}`;
/* La misma semilla da siempre la misma ancla: un libro viejo, abierto dos veces sin tocarlo, se nombra igual */
const anclaDe = (prefijo, semilla) => {
  let h = 5381;
  for (let i = 0; i < semilla.length; i++) h = ((h * 33) ^ semilla.charCodeAt(i)) >>> 0;
  return `${prefijo}-${h.toString(16).padStart(8, '0')}`;
};

/* JSON ({ type: 'heading', content: [] }) o nodo vivo ({ type: { name }, content: Fragment }) */
/* Un hueco (null) en un JSON guardado no rompe nada: no es de ningun tipo y no tiene hijos */
const tipoDe = (n) => (n && typeof n === 'object' ? (typeof n.type === 'string' ? n.type : (n.type && n.type.name) || '') : '');
const hijosDe = (n) => {
  if (!n || typeof n !== 'object') return [];
  const l = Array.isArray(n.content) ? n.content : (n.content && Array.isArray(n.content.content) ? n.content.content : []);
  return l.filter((x) => x && typeof x === 'object');
};
const ENTRAR = new Set(['columnas', 'columna']);
const textoDe = (n) => {
  let t = '';
  const andar = (x) => { if (typeof x.text === 'string') t += x.text; hijosDe(x).forEach(andar); };
  andar(n);
  return textoIndice(t, TEXTO_FILA_MAX);
};

/* Recorre lo que puede ser subtema: los bloques de arriba y lo de adentro de las columnas */
function recorrer(doc, fn) {
  const andar = (n) => { const t = tipoDe(n); if (t === 'heading' || t === 'paginaLibre') fn(n, t); else if (ENTRAR.has(t)) hijosDe(n).forEach(andar); };
  hijosDe(doc).forEach(andar);
}

/* El primer titulo de arriba nombra al capitulo cuando no se le puso nombre a mano (como Migrar.tituloDe) */
const nombreDelCapitulo = (c) => (c.tituloPropio ? null : hijosDe(c.doc || {}).find((n) => tipoDe(n) === 'heading') || null);

/* LA PORTADA: el primer capitulo, cuando el libro la tiene. `portada` es la de ConfigPagina:
   'si' y 'no' los eligio el autor; 'auto' la reconoce sola: un libro de varios capitulos cuyo primero empieza con
   una pagina de diseño o de PDF, sin nombre puesto a mano y sin ningun titulo en su texto. */
export function hayPortada(capitulos, portada) {
  const c = capitulos[0];
  if (!c || portada === 'no') return false;
  if (portada === 'si') return true;
  if (capitulos.length < 2 || c.tituloPropio) return false;
  /* Un renglon vacio antes de la primera pagina no cuenta: un capitulo nuevo empieza con uno */
  const hijos = hijosDe(c.doc || {}), primero = hijos.find((n) => !(tipoDe(n) === 'paragraph' && !textoDe(n)));
  /* `paginasPdf` es la forma vieja de un PDF traido (antes de pasar a paginas libres): tambien es portada */
  if (!primero || !['paginaLibre', 'paginasPdf'].includes(tipoDe(primero))) return false;
  let titulo = false;
  recorrer(c.doc, (_, t) => { if (t === 'heading') titulo = true; });
  return !titulo;
}

/* Una portada que el Taller reconocio solo queda fija ('si') la primera vez: despues, escribirle un titulo encima o
   borrarle una pagina no la vuelve capitulo. Solo «No es la portada» la quita.
   Se fija solo si no hay duda: el primer capitulo es nada mas que paginas de diseño o de PDF (y renglones vacios).
   Uno donde se esta escribiendo (una pagina arriba y texto debajo) sigue en 'auto'. */
const SOLO_PAGINAS = new Set(['paginaLibre', 'paginasPdf']);
export const debeFijarPortada = (capitulos, portada) => portada === 'auto' && hayPortada(capitulos, 'auto')
  && hijosDe(capitulos[0].doc || {}).every((n) => SOLO_PAGINAS.has(tipoDe(n)) || (tipoDe(n) === 'paragraph' && !textoDe(n)));

/* Delante de que capitulo va el contenido: el elegido (`indice.antesDe`, su id), o el primero. Nunca antes de la
   portada. Puede ser `capitulos.length`: al final, si la portada es todo el libro. */
export function lugarDelIndice(capitulos, indice, conPortada) {
  const minimo = conPortada ? 1 : 0;
  const k = capitulos.findIndex((c) => c.id && indice && c.id === indice.antesDe);
  return Math.min(Math.max(k, minimo), Math.max(capitulos.length, minimo));
}

/* `capitulos`: [{ id, ancla: 'cap-N', titulo, enIndice, tituloPropio, doc }] en el orden del libro.
   Entra cada capitulo con nombre que no se oculto (nivel 1) y, si se piden, sus subtemas (nivel 2): los Título 1 y
   Título 2 del texto y las paginas libres a las que se les puso nombre. El titulo que da nombre al capitulo no se
   repite como subtema. Los Título 3 nunca. Un ancla repetida en el libro solo cuenta la primera vez.
   La portada (`portada: true`, el primer capitulo) nunca sale. */
export function entradasDe(capitulos, { subtemas = true, portada = false } = {}) {
  const vistas = new Set(), lista = [];
  for (const [k, c] of capitulos.entries()) {
    if (lista.length >= ENTRADAS_MAX) break;
    if (portada && k === 0) continue;
    const nombreCap = textoIndice(c.titulo, TEXTO_FILA_MAX);
    if (c.enIndice === false || !nombreCap) continue;
    lista.push({ nivel: 1, titulo: nombreCap, ancla: c.ancla });
    if (!subtemas) continue;
    const nombre = nombreDelCapitulo(c);
    recorrer(c.doc || {}, (n, t) => {
      const a = n.attrs || {};
      if (n === nombre || lista.length >= ENTRADAS_MAX) return;
      if (t === 'heading') {
        if (a.level === 3 || !esAncla(RE_ANCLA_TITULO, a.id) || vistas.has(a.id)) return;
        const titulo = textoDe(n);
        if (!titulo) return;
        vistas.add(a.id);
        lista.push({ nivel: 2, titulo, ancla: a.id });
      } else {
        const titulo = textoIndice(a.titulo, TEXTO_FILA_MAX);
        if (!titulo || !esAncla(RE_ANCLA_PAGINA, a.ancla) || vistas.has(a.ancla)) return;
        vistas.add(a.ancla);
        lista.push({ nivel: 2, titulo, ancla: a.ancla });
      }
    });
  }
  return lista;
}

/* Un capitulo guardado antes de las anclas: sus titulos (y paginas con nombre) reciben una fija, sacada de `semilla`
   (el id del capitulo) y de su lugar. Asi la mesa y el PDF las nombran igual aunque nadie lo haya guardado aun.
   Las repetidas (una pagina copiada en otro libro, por ejemplo) se vuelven a nombrar. Devuelve un doc nuevo. */
export function conAnclas(doc, semilla) {
  const vistas = new Set();
  let k = 0;
  const unica = (prefijo) => { let a; do a = anclaDe(prefijo, `${semilla}:${prefijo}:${k++}`); while (vistas.has(a)); return a; };
  const arreglar = (n) => {
    const t = tipoDe(n);
    if (t === 'heading') {
      const id = esAncla(RE_ANCLA_TITULO, n.attrs && n.attrs.id) && !vistas.has(n.attrs.id) ? n.attrs.id : unica('t');
      vistas.add(id);
      return id === (n.attrs || {}).id ? n : { ...n, attrs: { ...n.attrs, id } };
    }
    if (t === 'paginaLibre') {
      const a = n.attrs || {};
      if (!a.titulo) return n;
      const ancla = esAncla(RE_ANCLA_PAGINA, a.ancla) && !vistas.has(a.ancla) ? a.ancla : unica('p');
      vistas.add(ancla);
      return ancla === a.ancla ? n : { ...n, attrs: { ...a, ancla } };
    }
    if (ENTRAR.has(t) && Array.isArray(n.content)) return { ...n, content: n.content.map(arreglar) };
    return n;
  };
  const d = doc && typeof doc === 'object' ? doc : { type: 'doc', content: [] };
  return Array.isArray(d.content) ? { ...d, content: d.content.map(arreglar) } : d;
}

/* El nombre de la hoja: el que se escribio, o el de siempre en el idioma del libro */
export const tituloDeIndice = (indice, idioma) => (indice && indice.titulo) || (idioma === 'en' ? 'Contents' : 'Contenido');

/* La pagina de un ancla: solo un numero entero propio (nunca algo heredado, como «__proto__») */
const numeroDe = (numeros, ancla) => {
  const n = numeros && Object.prototype.hasOwnProperty.call(numeros, ancla) ? numeros[ancla] : 0;
  return Number.isInteger(n) && n > 0 ? n : 0;
};

/* La fila de una entrada: el texto y su numero. Con puntos, una linea de puntitos los une. */
export const filaDeIndice = (f, numero, puntos) => el('a', `indice__fila indice__fila--${f.nivel === 2 ? 2 : 1}`, [
  el('span', 'indice__texto', [txt(f.titulo)]),
  ...(puntos ? [el('span', 'indice__puntos')] : []),
  el('span', 'indice__num', [txt(Number.isInteger(numero) && numero > 0 ? String(numero) : '')])
], { href: `#${f.ancla}` });

/* Las hojas del contenido: `reparto` dice cuantas filas lleva cada una (lo mide la mesa); `numeros`, la pagina de
   cada ancla. El nombre de la hoja va solo en la primera. Sin reparto, todo en una. */
export function hojasDeIndice(entradas, numeros, reparto, o = {}) {
  const partes = Array.isArray(reparto) && reparto.length ? reparto : [entradas.length];
  const fila = (f) => filaDeIndice(f, numeroDe(numeros, f.ancla), o.puntos !== false);
  const hojas = [];
  let desde = 0;
  partes.forEach((n, i) => {
    const cuantas = Number.isInteger(n) && n > 0 ? n : 0;
    hojas.push(el('nav', 'indice', [...(i === 0 ? [el('h1', 'indice__titulo', [txt(o.titulo || 'Contenido')])] : []), ...entradas.slice(desde, desde + cuantas).map(fila)]));
    desde += cuantas;
  });
  /* Lo que el reparto no alcanzo a contar va en la ultima: nunca se pierde una fila */
  if (desde < entradas.length && hojas.length) hojas[hojas.length - 1].hijos.push(...entradas.slice(desde).map(fila));
  return hojas;
}
