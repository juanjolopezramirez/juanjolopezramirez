/* LAS NOTAS DE UN LIBRO DEL TALLER: una palabra con su definicion o una cita biblica, marcadas sobre cualquier trozo de
   texto (marcas `definicion` y `citaBiblica` del editor, nodos/notas.js). En el PDF salen como el enlace /nota/#n=… que el
   lector ya entiende (lector/notaEnPdf.js). UNA sola regla para el Taller y el lector: `limpiarNota`.

     marca   { type: 'definicion',  attrs: { t, d?, r?: { a, y, ti, f, u } , rf?, ft?, fd? } }
             { type: 'citaBiblica', attrs: { r: 'JER.1.4-5', x?, rv? } }

   El idioma (`l`) no se guarda en la marca: es el del libro y se pone al sacar el PDF. La letra de los versiculos (`fv`)
   tampoco: es UNA para todo el libro (ConfigPagina.notas.letraVersos) y va en cada cita al sacar el PDF. Puro: sin pagina, sin red. */
import { enlaceDeNota, fuenteValida, limpiarNota } from '../../lector/notaEnPdf.js';
import { canonica, leerReferencias, rotulo } from '../../biblia/referencias.js';

export const TIPO_DE_MARCA = Object.freeze({ definicion: 'd', citaBiblica: 'c' });
export const MARCA_DE_TIPO = Object.freeze({ d: 'definicion', c: 'citaBiblica' });
export const esMarcaNota = (type) => type === 'definicion' || type === 'citaBiblica';
const objeto = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const idiomaLibro = (l) => (l === 'en' ? 'en' : 'es');

/* LA LETRA DE LOS VERSICULOS de un libro nuevo, si el autor no eligio otra. Se ESCRIBE en cada cita al sacar el PDF: un PDF
   de antes, sin `fv`, se sigue viendo con la de siempre (Young Serif), y uno nuevo no depende de lo que el lector suponga. */
export const LETRA_VERSOS = 'bricolage-grotesque';
export const letraDeVersos = (v) => (fuenteValida(v) ? v : LETRA_VERSOS);

/* La nota (limpia) que dice una marca, o null. `idioma`: el del libro (va como `l`). `fv`: la letra de los versiculos del
   libro (solo en una cita; una que no es de la lista se tira). */
export function notaDeMarca(m, idioma, { fv } = {}) {
  const o = objeto(m), k = typeof o.type === 'string' && Object.hasOwn(TIPO_DE_MARCA, o.type) ? TIPO_DE_MARCA[o.type] : null;
  if (!k) return null;
  const a = objeto(o.attrs);
  const n = limpiarNota({ ...(k === 'd' ? { t: a.t, d: a.d, r: a.r, rf: a.rf, ft: a.ft, fd: a.fd } : { r: a.r, x: a.x, rv: a.rv, fv }), v: 1, k, ...(idioma ? { l: idiomaLibro(idioma) } : {}) });
  return n;
}

/* De una nota limpia, la marca que se guarda (solo lo que hay, un objeto comun) */
export function marcaDeNota(nota) {
  const n = limpiarNota(nota);
  if (!n) return null;
  const attrs = {};
  const llaves = n.k === 'd' ? ['t', 'd', 'r', 'rf', 'ft', 'fd'] : ['r', 'x', 'rv'];
  for (const k of llaves) if (n[k] !== undefined) attrs[k] = n.k === 'd' && k === 'r' ? { ...n.r } : n[k];
  return { type: MARCA_DE_TIPO[n.k], attrs };
}

/* La marca limpia, o null si no es una nota (marcas.js la usa al guardar: una nota mala no se guarda) */
export const marcaLimpia = (m) => { const n = notaDeMarca(m); return n ? marcaDeNota(n) : null; };

/* El enlace de la nota de una marca, o null (si no es nota, o no cabe en 8000 letras). `opciones`: { fv } (notaDeMarca) */
export const enlaceDeMarca = (m, idioma, opciones) => { const n = notaDeMarca(m, idioma, opciones); return n ? enlaceDeNota(n) : null; };

/* Recorre el texto de los capitulos (el JSON del editor, o `{ doc }`) y da cada marca de nota que encuentra, EN EL ORDEN DEL
   LIBRO (capitulo por capitulo, de arriba abajo): la pila se llena al reves para sacar primero lo primero */
function* marcasDe(contenidos) {
  const pila = [];
  const lista = Array.isArray(contenidos) ? contenidos : [];
  for (let i = lista.length - 1; i >= 0; i--) { const x = objeto(lista[i]); pila.push(objeto(x.doc || x)); }
  let vistos = 0;
  while (pila.length && vistos < 200000) {
    const n = pila.pop();
    vistos++;
    if (n.type === 'text') { for (const m of Array.isArray(n.marks) ? n.marks : []) if (esMarcaNota(objeto(m).type)) yield m; continue; }
    if (Array.isArray(n.content)) for (let i = n.content.length - 1; i >= 0; i--) pila.push(objeto(n.content[i]));
  }
}

/* Los enlaces de nota distintos que deberia llevar el PDF de estos capitulos. `opciones`: { fv }, la misma letra de versiculos
   que lleva el PDF (asi la cuenta de «Compartir» sale igual que la del PDF) */
export function hrefsDeNotas(contenidos, idioma, opciones) {
  const salida = new Set();
  for (const m of marcasDe(contenidos)) { const h = enlaceDeMarca(m, idioma, opciones); if (h) salida.add(h); }
  return salida;
}

/* La version recomendada que propone el editor para una cita nueva: la que MAS usan las citas del libro; si dos empatan, la
   de la cita que va mas adelante en el libro (la ultima nota en el orden del libro). '' si ninguna cita tiene version. */
export function versionDelLibro(contenidos) {
  const cuenta = new Map(), ultimaVez = new Map();
  let i = 0;
  for (const m of marcasDe(contenidos)) {
    const n = notaDeMarca(m);
    i++;
    if (n && n.k === 'c' && n.rv) { cuenta.set(n.rv, (cuenta.get(n.rv) || 0) + 1); ultimaVez.set(n.rv, i); }
  }
  let mejor = '';
  for (const [v, c] of cuenta) {
    const b = cuenta.get(mejor) || 0;
    if (c > b || (c === b && ultimaVez.get(v) > (ultimaVez.get(mejor) || 0))) mejor = v;
  }
  return mejor;
}

/* EL TEXTO ELEGIDO Y DONDE ESTA CADA LETRA. `trozos`: [{ texto, pos }] en orden (pos = donde empieza ese texto en el
   documento) o { corte: true } entre dos bloques. Devuelve { texto, mapa } con mapa[i] = posicion de la letra i (-1 en un corte). */
export function textoConMapa(trozos) {
  let texto = '';
  const mapa = [];
  for (const t of Array.isArray(trozos) ? trozos : []) {
    if (!t) continue;
    if (t.corte) { texto += '\n'; mapa.push(-1); continue; }
    if (typeof t.texto !== 'string' || !Number.isInteger(t.pos)) continue;
    for (let i = 0; i < t.texto.length; i++) { texto += t.texto[i]; mapa.push(t.pos + i); }
  }
  return { texto, mapa };
}

/* Las citas del texto elegido (`leerReferencias`, no el modo «auto»: el autor ya eligio). Cada una con su tramo en el
   documento: [{ desde, hasta, r, x, texto }]. Una que cruza de un bloque a otro, o cuyas letras no van seguidas, se salta. */
export const SELECCION_MAX = 50000;
export function citasDeSeleccion(texto, mapa, idioma) {
  const salida = [];
  /* Mas de SELECCION_MAX letras no se leen: nadie marca un capitulo entero como cita */
  if (typeof texto !== 'string' || texto.length > SELECCION_MAX || !Array.isArray(mapa)) return salida;
  for (const ref of leerReferencias(texto, { idioma: idiomaLibro(idioma) })) {
    const r = canonica(ref);
    if (!r || ref.hasta <= ref.desde) continue;
    const tramo = mapa.slice(ref.desde, ref.hasta);
    if (tramo.some((p, i) => p < 0 || (i > 0 && p !== tramo[i - 1] + 1))) continue;
    salida.push({ desde: tramo[0], hasta: tramo[tramo.length - 1] + 1, r, x: ref.texto.replace(/\s+/g, ' ').trim(), texto: ref.texto });
  }
  return salida;
}

/* Como se lee una referencia escrita a mano («Jer 1:4-5» → la canonica y su nombre); null si no se entiende o trae mas de una */
export function citaEscrita(texto, idioma) {
  const refs = leerReferencias(String(texto || '').slice(0, 200), { idioma: idiomaLibro(idioma) });
  if (refs.length !== 1) return null;
  const r = canonica(refs[0]);
  return r ? { r, nombre: rotulo(refs[0], idiomaLibro(idioma)) } : null;
}
