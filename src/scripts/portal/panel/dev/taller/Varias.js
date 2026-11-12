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

/* Las copias van juntas, justo despues de la ultima elegida, en el mismo orden. Se devuelven para elegirlas. */
export function trDuplicar(state, nodos) {
  const lista = posicionesDe(state.doc, nodos);
  if (!lista.length) return null;
  const ultima = lista[lista.length - 1];
  const copias = lista.map(({ nodo }) => nodo.type.create(JSON.parse(JSON.stringify(nodo.attrs)), nodo.content, nodo.marks));
  const tr = state.tr.insert(ultima.pos + ultima.nodo.nodeSize, copias);
  return { tr: closeHistory(tr), copias };
}
