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
/* Las plantillas de la hoja del contenido. Todas son estilo del libro (hoja.cssLibro): la mesa y el PDF igual. */
export const PLANTILLAS = ['clasico', 'minimalista', 'tarjetas', 'columnas', 'tabla', 'linea'];
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
export const tipoDe = (n) => (n && typeof n === 'object' ? (typeof n.type === 'string' ? n.type : (n.type && n.type.name) || '') : '');
export const hijosDe = (n) => {
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

/* LOS ROTULOS: «Capítulo 1», «Episodio IV»... La palabra y las cifras son del libro (`pagina.rotulo`); el nombre de
   cada capitulo queda corto. Cuenta cada capitulo menos la portada, los que no salen en el contenido y los marcados
   «Sin número» (un prologo). La mesa, las miniaturas y el PDF numeran con esta misma funcion. */
export const PALABRA_MAX = 30;
const ROMANOS = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
export function romano(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return String(n);
  let r = '';
  for (const [v, l] of ROMANOS) while (n >= v) { r += l; n -= v; }
  return r;
}
/* Una palabra corta no necesita marcas invisibles (ni de direccion): se quitan, asi no reordena la fila */
export const palabraLimpia = (v) => textoIndice(typeof v === 'string' ? v.replace(/[​-‏⁠﻿]/g, '') : '', PALABRA_MAX);
export const palabraDeRotulo = (rotulo, idioma) => textoIndice(rotulo && rotulo.palabra, PALABRA_MAX) || (idioma === 'en' ? 'Chapter' : 'Capítulo');

/* EL PAPEL DE UN CAPITULO (`rol`): un prefacio, una introduccion, una conclusion... No cuenta en la numeracion: el
   «Capítulo 1» es el primero de verdad. Con «Otro» el autor escribe el nombre (`rolTexto`). Es un nombre del
   libro, asi que sale en el idioma del libro. */
export const ROLES = ['prefacio', 'introduccion', 'conclusion', 'agradecimientos', 'citas', 'referencias', 'apendice'];
const NOMBRES_ROL = {
  es: { prefacio: 'Prefacio', introduccion: 'Introducción', conclusion: 'Conclusión', agradecimientos: 'Agradecimientos', citas: 'Citas', referencias: 'Referencias', apendice: 'Apéndice' },
  en: { prefacio: 'Preface', introduccion: 'Introduction', conclusion: 'Conclusion', agradecimientos: 'Acknowledgments', citas: 'Quotes', referencias: 'References', apendice: 'Appendix' }
};
/* Solo un papel de la lista, o `custom` con su texto: lo demas no es papel. Devuelve { rol, rolTexto } limpios. */
export function rolLimpio(rol, rolTexto) {
  if (typeof rol !== 'string') return { rol: '', rolTexto: '' };
  if (ROLES.includes(rol)) return { rol, rolTexto: '' };
  const texto = palabraLimpia(rolTexto);
  return rol === 'custom' && texto ? { rol: 'custom', rolTexto: texto } : { rol: '', rolTexto: '' };
}
export const nombreDeRol = (rol, rolTexto, idioma) => {
  const r = rolLimpio(rol, rolTexto);
  return r.rol === 'custom' ? r.rolTexto : r.rol ? (NOMBRES_ROL[idioma === 'en' ? 'en' : 'es'][r.rol]) : '';
};

/* Por capitulo, en el orden del libro: { numero (0 = no cuenta), orden ('3' o 'III'), rotulo ('Capítulo 3' o ''),
   rol ('Introducción' o '') }.
   - Un capitulo con papel no cuenta: su rotulo es el nombre del papel (con `verRol`, aunque los rotulos esten apagados:
     es lo que pide el contenido).
   - Un capitulo con palabra propia (`palabra`: «Etapa», «Episodio») se rotula con ella y cuenta aparte de los
     demas; los que no la tienen usan la del libro. */
export function rotulosDe(capitulos, { rotulo = {}, idioma = 'es', portada = false, verRol = false } = {}) {
  const r = rotulo && typeof rotulo === 'object' ? rotulo : {}, palabraLibro = palabraDeRotulo(r, idioma);
  const cuentas = new Map();      // palabra en minusculas → { n, nombre (como la escribio el primero) }
  return capitulos.map((c, k) => {
    const rol = nombreDeRol(c.rol, c.rolTexto, idioma);
    if (portada && k === 0) return { numero: 0, orden: '', rotulo: '', rol: '' };
    if (c.enIndice === false) return { numero: 0, orden: '', rotulo: '', rol };
    if (rol) return { numero: 0, orden: '', rotulo: r.ver === true || verRol === true ? rol : '', rol };
    if (c.numerar === false) return { numero: 0, orden: '', rotulo: '', rol: '' };
    const propia = palabraLimpia(c.palabra) || palabraLibro, llave = propia.toLowerCase();
    if (!cuentas.has(llave)) cuentas.set(llave, { n: 0, nombre: propia });
    const cuenta = cuentas.get(llave), palabra = cuenta.nombre, n = ++cuenta.n;
    const orden = r.cifras === 'romano' ? romano(n) : String(n);
    return { numero: n, orden, rotulo: r.ver === true ? `${palabra} ${orden}` : '', rol: '' };
  });
}

/* Delante de que capitulo va el contenido: el elegido (`indice.antesDe`, su id; o AL_FINAL), o el primero. Nunca antes de la
   portada. Puede ser `capitulos.length`: al final, si la portada es todo el libro. */
export const AL_FINAL = 'fin';
export function lugarDelIndice(capitulos, indice, conPortada) {
  const minimo = conPortada ? 1 : 0;
  /* «Al final del libro»: despues de la ultima hoja (el contenido va tras una hoja que es la ultima de todas) */
  if (indice && indice.antesDe === AL_FINAL) return Math.max(capitulos.length, minimo);
  const k = capitulos.findIndex((c) => c.id && indice && c.id === indice.antesDe);
  return Math.min(Math.max(k, minimo), Math.max(capitulos.length, minimo));
}

/* La portada de un capitulo en pequeño (plantilla Tarjetas): el fondo de su primera pagina, si es de diseño o PDF */
const RE_FONDO = /^taller(?:\/[a-z0-9]+(?:[.-][a-z0-9]+)*)+\.(?:webp|png|jpg)$/;
function miniDe(c) {
  const primero = hijosDe(c.doc || {}).find((n) => !(tipoDe(n) === 'paragraph' && !textoDe(n)));
  const f = primero && tipoDe(primero) === 'paginaLibre' ? (primero.attrs || {}).fondo : '';
  return typeof f === 'string' && f.length <= 200 && RE_FONDO.test(f) ? f : '';
}

/* `capitulos`: [{ id, ancla: 'cap-N', titulo, enIndice, numerar, tituloPropio, doc }] en el orden del libro.
   Entra cada capitulo con nombre que no se oculto (nivel 1) y, si se piden, sus subtemas (nivel 2): los Título 1 y
   Título 2 del texto y las paginas libres a las que se les puso nombre. El titulo que da nombre al capitulo no se
   repite como subtema. Los Título 3 nunca. Un ancla repetida en el libro solo cuenta la primera vez.
   La portada (`portada: true`, el primer capitulo) nunca sale.
   Con `rotulo` (el del libro), cada capitulo que cuenta lleva el suyo: uno sin nombre sale como «Capítulo 3».
   Con `verRol`, uno con papel (Introducción…) lo lleva delante aunque los rotulos esten apagados.
   `orden` ('3' o 'III') va siempre en los que cuentan: lo usan las plantillas con el numero delante. */
export function entradasDe(capitulos, { subtemas = true, portada = false, rotulo = null, idioma = 'es', minis = false, verRol = false } = {}) {
  const vistas = new Set(), lista = [], rotulos = rotulosDe(capitulos, { rotulo: rotulo || {}, idioma, portada, verRol });
  for (const [k, c] of capitulos.entries()) {
    if (lista.length >= ENTRADAS_MAX) break;
    if (portada && k === 0) continue;
    const nombreCap = textoIndice(c.titulo, TEXTO_FILA_MAX), r = rotulos[k];
    if (c.enIndice === false || (!nombreCap && !r.rotulo)) continue;
    const mini = minis ? miniDe(c) : '';
    lista.push({ nivel: 1, titulo: nombreCap, ancla: c.ancla, ...(r.rotulo ? { rotulo: r.rotulo } : {}), ...(r.orden ? { orden: r.orden } : {}), ...(mini ? { mini } : {}) });
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

/* Las opciones de las hojas del contenido (las de ConfigPagina.indice), iguales en la mesa y en el PDF.
   `imagenes`: { ruta: src } de las que ya estan; la que falta deja su caja vacia. */
export const conMinis = (ind) => !!ind && ind.plantilla === 'tarjetas' && ind.portadas === true;
/* La negrita de las filas, por nivel: capitulos (n1) y subtemas (n2). Sin nada, las filas salen como siempre. */
export const negritaDe = (v) => {
  const o = v && typeof v === 'object' ? v : {};
  return { n1: o.n1 === true, n2: o.n2 === true };
};
export function opcionesDeIndice(ind, idioma, imagenes = {}) {
  const i = ind || {}, ruta = i.imagen && i.imagen.ruta;
  const src = (r) => (imagenes && Object.prototype.hasOwnProperty.call(imagenes, r) ? imagenes[r] : '');
  return { titulo: tituloDeIndice(i, idioma), puntos: i.puntos, plantilla: i.plantilla, orden: i.orden === true, minis: conMinis(i), imagenes, imagen: ruta ? src(ruta) : null, negrita: negritaDe(i.negrita) };
}

/* La pagina de un ancla: solo un numero entero propio (nunca algo heredado, como «__proto__») */
const numeroDe = (numeros, ancla) => {
  const n = numeros && Object.prototype.hasOwnProperty.call(numeros, ancla) ? numeros[ancla] : 0;
  return Number.isInteger(n) && n > 0 ? n : 0;
};

/* El texto de la fila. Con rotulo: «Capítulo 1» y el nombre en dos trozos (el « · » lo pone el estilo del libro).
   Sin rotulo, el texto solo, como siempre: un libro sin rotulos se arma igual que antes.
   Con el numero delante, la fila no repite «Capítulo 1»: dice «1  El desierto» (si no tiene nombre, si). */
const textoDeFila = (f, conOrden) => {
  const rotulo = f.rotulo && !(conOrden && f.orden && f.titulo) ? f.rotulo : '';
  return rotulo
    ? [el('span', 'indice__rotulo', [txt(rotulo)]), ...(f.titulo ? [el('span', 'indice__nombre', [txt(f.titulo)])] : [])]
    : [txt(f.titulo)];
};

/* Una imagen del contenido: la suya si ya llego; si no, la misma caja vacia (la hoja no cambia al llegar) */
const SRC_IMAGEN = /^data:image\/(?:webp|png|jpeg);base64,/;
const imagenDe = (clase, src) => (typeof src === 'string' && SRC_IMAGEN.test(src) ? el('img', clase, [], { src, alt: '' }) : el('span', clase));

/* La fila de una entrada: el texto y su numero. Con puntos, una linea de puntitos los une.
   `o.orden`: el numero del capitulo delante (filas de nivel 1; una sin numero lleva la caja vacia, para que la
   columna no se corra). `o.minis`: la portada del capitulo en pequeño, sacada de `o.imagenes`. */
export const filaDeIndice = (f, numero, puntos, o = {}) => {
  const uno = f.nivel !== 2, conOrden = !!o.orden && uno;
  return el('a', `indice__fila indice__fila--${uno ? 1 : 2}`, [
    ...(o.minis && uno ? [imagenDe('indice__mini', f.mini && o.imagenes ? o.imagenes[f.mini] : '')] : []),
    ...(conOrden ? [el('span', 'indice__orden', f.orden ? [txt(f.orden)] : [])] : []),
    el('span', 'indice__texto', textoDeFila(f, conOrden)),
    ...(puntos ? [el('span', 'indice__puntos')] : []),
    el('span', 'indice__num', [txt(Number.isInteger(numero) && numero > 0 ? String(numero) : '')])
  ], { href: `#${f.ancla}` });
};

/* Las hojas del contenido: `reparto` dice cuantas filas lleva cada una (lo mide la mesa); `numeros`, la pagina de
   cada ancla. El nombre de la hoja (y la imagen de arriba) va solo en la primera; `o.primera === false` es una hoja
   de mas adelante (asi mide la mesa cada hoja tal como sale). Sin reparto, todo en una.
   `o`: { titulo, puntos, plantilla, orden, imagen (src de la de arriba; '' = su caja vacia; null = sin imagen),
   minis, imagenes: { ruta: src } } */
export function hojasDeIndice(entradas, numeros, reparto, o = {}) {
  const partes = Array.isArray(reparto) && reparto.length ? reparto : [entradas.length];
  const opciones = { orden: o.orden === true, minis: o.minis === true, imagenes: o.imagenes };
  const fila = (f) => filaDeIndice(f, numeroDe(numeros, f.ancla), o.puntos !== false, opciones);
  const plantilla = PLANTILLAS.includes(o.plantilla) ? o.plantilla : 'clasico';
  /* Clasico sin numero delante: el mismo nav de siempre */
  const neg = negritaDe(o.negrita), negrita = `${neg.n1 ? ' indice--cap-negrita' : ''}${neg.n2 ? ' indice--sub-negrita' : ''}`;
  const clase = (plantilla === 'clasico' && !opciones.orden ? 'indice' : `indice indice--${plantilla}${opciones.orden ? ' indice--orden' : ''}`) + negrita;
  const arriba = () => [
    ...(typeof o.imagen === 'string' ? [el('figure', 'indice__imagen', [imagenDe('indice__foto', o.imagen)])] : []),
    el('h1', 'indice__titulo', [txt(o.titulo || 'Contenido')])
  ];
  const hojas = [];
  let desde = 0;
  partes.forEach((n, i) => {
    const cuantas = Number.isInteger(n) && n > 0 ? n : 0;
    hojas.push(el('nav', clase, [...(i === 0 && o.primera !== false ? arriba() : []), ...entradas.slice(desde, desde + cuantas).map(fila)]));
    desde += cuantas;
  });
  /* Lo que el reparto no alcanzo a contar va en la ultima: nunca se pierde una fila */
  if (desde < entradas.length && hojas.length) hojas[hojas.length - 1].hijos.push(...entradas.slice(desde).map(fila));
  return hojas;
}
