/* VARIAS PAGINAS A LA VEZ. Lo que se elige en las miniaturas y lo que se hace con todas juntas. Aqui no hay
   pantalla: solo listas y transacciones, y por eso se prueba sin navegador.

   Las paginas libres no tienen nombre propio: se reconocen por su nodo. Se eligen solo de un capitulo,
   porque cada capitulo tiene su propio Ctrl+Z: asi un solo Ctrl+Z las devuelve todas, en su orden. */
import { Selection } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';

/* Solo quien dice que borra una pagina puede bajar la cuenta de paginas (la guarda de Editor.js) */
export const META_PAGINA = 'tallerPagina';

/* Las paginas libres viven arriba o dentro de columnas: solo ahi se entra */
const ENTRAR = new Set(['columnas', 'columna']);

/* Donde esta cada nodo elegido, en el orden del capitulo */
export function posicionesDe(doc, nodos) {
  const quiero = new Set(nodos), lista = [];
  doc.descendants((x, pos) => {
    if (quiero.has(x)) lista.push({ pos, nodo: x });
    return ENTRAR.has(x.type.name);
  });
  return lista;
}

/* Todas las paginas libres del capitulo, en orden */
export function libresDe(doc) {
  const lista = [];
  doc.descendants((x) => {
    if (x.type.name === 'paginaLibre') lista.push(x);
    return ENTRAR.has(x.type.name);
  });
  return lista;
}

/* Cambiar el papel crea nodos nuevos, y deshacerlo otros mas: la eleccion se pierde. Se recuerda por su lugar
   entre las paginas libres y, si la cuenta no cambio, se vuelve a encontrar ahi. */
export const lugaresDe = (doc, nodos) => {
  const elegida = new Set(nodos);
  return libresDe(doc).map((n, i) => (elegida.has(n) ? i : -1)).filter((i) => i >= 0);
};
export function nodosEnLugares(doc, lugares, cuantasAntes) {
  const libres = libresDe(doc);
  return libres.length === cuantasAntes ? lugares.map((i) => libres[i]).filter(Boolean) : null;
}

/* `lista`: las paginas en orden, cada una { vivo, nodo } (nodo es null si no es pagina libre).
   De la pagina `a` a la `b`: solo libres y solo del capitulo de `a`. `fuera` dice si el tramo entraba en otro. */
export function rango(lista, a, b) {
  const vivo = lista[a] && lista[a].vivo, nodos = [];
  let fuera = false;
  for (let k = Math.min(a, b); k <= Math.max(a, b); k++) {
    const p = lista[k];
    if (!p) continue;
    if (p.vivo !== vivo) { fuera = true; continue; }
    if (p.nodo) nodos.push(p.nodo);
  }
  return { nodos, fuera };
}

export const alternar = (nodos, nodo) => (nodos.includes(nodo) ? nodos.filter((n) => n !== nodo) : [...nodos, nodo]);

export const todasDelCapitulo = (lista, vivo) => lista.filter((p) => p.vivo === vivo && p.nodo).map((p) => p.nodo);

/* Se borran de la ultima a la primera, para que las posiciones no se corran. Una sola transaccion: un Ctrl+Z.
   `closeHistory`: no se junta con lo que se hizo justo antes. */
export function trBorrar(state, nodos) {
  const lista = posicionesDe(state.doc, nodos);
  if (!lista.length) return null;
  const tr = state.tr;
  for (const { pos, nodo } of [...lista].reverse()) tr.delete(pos, pos + nodo.nodeSize);
  tr.setSelection(Selection.near(tr.doc.resolve(Math.min(tr.mapping.map(lista[0].pos), tr.doc.content.size))));
  return closeHistory(tr.setMeta(META_PAGINA, true));
}

/* ---- Mover el bloque ---- */
/* Donde cae el bloque si se suelta antes de la pagina `i` de la lista (lista.length = al final). Soltarlo
   sobre si mismo es dejarlo antes de la siguiente que no este elegida. Solo dentro de su capitulo: entre
   capitulos serian dos guardados y dos Ctrl+Z. Devuelve { antes: indice } o { fin: true }, o null. */
export function destinoDelBloque(lista, nodos, i) {
  const elegida = new Set(nodos), es = (p) => !!p && !!p.nodo && elegida.has(p.nodo);
  const primera = lista.find(es);
  if (!primera) return null;
  let j = Math.max(0, Math.min(i, lista.length));
  while (j < lista.length && es(lista[j])) j++;
  if (lista[j] && lista[j].vivo === primera.vivo) return { antes: j };
  let k = j - 1;
  while (k >= 0 && es(lista[k])) k--;
  return k >= 0 && lista[k].vivo === primera.vivo ? { fin: true } : null;
}

/* «Que la primera del bloque quede en la pagina `d`»: antes de la que hoy es la d-esima sin contar las elegidas */
export function antesDelNumero(lista, nodos, d) {
  const elegida = new Set(nodos), resto = [];
  lista.forEach((p, i) => { if (!(p.nodo && elegida.has(p.nodo))) resto.push(i); });
  const n = Math.max(1, Math.min(Math.round(d), resto.length + 1));
  return n <= resto.length ? resto[n - 1] : lista.length;
}

/* Se quitan todas y se ponen juntas, en su orden, donde iba `pos` (posicion del documento de antes).
   Los nodos son los mismos: la eleccion sigue valiendo despues. Un solo Ctrl+Z. */
export function trMover(state, nodos, pos) {
  const lista = posicionesDe(state.doc, nodos);
  if (!lista.length) return null;
  const tr = state.tr;
  for (const { pos: p, nodo } of [...lista].reverse()) tr.delete(p, p + nodo.nodeSize);
  tr.insert(tr.mapping.map(pos), lista.map((x) => x.nodo));
  return closeHistory(tr.setMeta(META_PAGINA, true));
}

/* El papel de todas, o como cubre su fondo cada pagina de PDF. Una pagina de PDF no lleva papel propio:
   lo que no cubre toma el del libro. Devuelve las paginas nuevas (cambian de nodo) y cuantas no aplicaban. */
export function trPapel(state, nodos, cambio) {
  const lista = posicionesDe(state.doc, nodos);
  if (!lista.length) return null;
  const tr = state.tr;
  let saltadas = 0;
  for (const { pos, nodo } of lista) {
    const pdf = !!nodo.attrs.fondo;
    if ('papel' in cambio && !pdf) tr.setNodeMarkup(pos, null, { ...nodo.attrs, papel: cambio.papel });
    else if ('ajuste' in cambio && pdf) tr.setNodeMarkup(pos, null, { ...nodo.attrs, ajuste: cambio.ajuste });
    else saltadas++;
  }
  return { tr: closeHistory(tr), nodos: lista.map(({ pos }) => tr.doc.nodeAt(pos)), saltadas };
}

/* Lo que tienen en comun, para el panel: '' si difieren */
export function resumenDe(nodos) {
  const pdf = nodos.filter((n) => n.attrs.fondo), hojas = nodos.filter((n) => !n.attrs.fondo);
  const comun = (l, k) => (l.length && l.every((n) => n.attrs[k] === l[0].attrs[k]) ? l[0].attrs[k] : '');
  return { n: nodos.length, pdf: pdf.length, hojas: hojas.length, papel: comun(hojas, 'papel'), ajuste: comun(pdf, 'ajuste') };
}

/* Las copias van juntas, justo despues de la ultima elegida, en el mismo orden. Se devuelven para elegirlas. */
export function trDuplicar(state, nodos) {
  const lista = posicionesDe(state.doc, nodos);
  if (!lista.length) return null;
  const ultima = lista[lista.length - 1];
  const copias = lista.map(({ nodo }) => nodo.type.create(JSON.parse(JSON.stringify(nodo.attrs)), nodo.content, nodo.marks));
  const tr = state.tr.insert(ultima.pos + ultima.nodo.nodeSize, copias);
  return { tr: closeHistory(tr), copias };
}
