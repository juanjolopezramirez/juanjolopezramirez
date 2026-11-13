/* PARTIR Y UNIR CAPITULOS, sin pantalla: solo el documento de un capitulo ({ type:'doc', content:[…] }).
   Se parte siempre entre dos bloques de arriba (nunca en medio de un parrafo, ni dentro de unas columnas), y lo
   que sale tiene que volver a armar el original: si no, no se parte. */

const copia = (x) => JSON.parse(JSON.stringify(x));
const vacio = () => ({ type: 'paragraph' });

/* Antes del bloque `indice`: la cabeza se queda, la cola empieza el capitulo nuevo */
export function cortar(doc, indice) {
  const bloques = Array.isArray(doc && doc.content) ? doc.content : [];
  if (!Number.isInteger(indice) || indice < 1 || indice >= bloques.length) return null;
  const cabeza = { type: 'doc', content: copia(bloques.slice(0, indice)) }, cola = { type: 'doc', content: copia(bloques.slice(indice)) };
  /* La guarda: cabeza y cola juntas son el capitulo de antes, bloque por bloque */
  if (JSON.stringify([...cabeza.content, ...cola.content]) !== JSON.stringify(bloques)) return null;
  return { cabeza, cola };
}

/* El segundo va detras del primero. Un capitulo vacio (un solo parrafo sin nada) no deja un renglon de mas. */
export function unir(a, b) {
  const sinVacio = (d) => {
    const c = Array.isArray(d && d.content) ? d.content : [];
    return c.length === 1 && c[0].type === 'paragraph' && !(c[0].content || []).length ? [] : c;
  };
  const junto = [...sinVacio(a), ...sinVacio(b)];
  return { type: 'doc', content: copia(junto.length ? junto : [vacio()]) };
}

/* ¿Trae un titulo de texto? Si empieza con una pagina de PDF, el capitulo necesita que le pongan nombre. */
export const tieneTitulo = (doc) => (Array.isArray(doc && doc.content) ? doc.content : []).some((n) => n.type === 'heading');

/* MARCAR UN TRAMO. De los bloques de arriba `desde` a `hasta` (los de las hojas elegidas), que tramo se vuelve capitulo
   aparte: los renglones vacios pegados a el entran con el, para que no quede una hoja en blanco sola. Devuelve
   { desde, hasta, antes, despues, todo }: `todo` es que el tramo ya era el capitulo entero. null si no cabe. */
export function planRango(bloques, desde, hasta) {
  const lista = Array.isArray(bloques) ? bloques : [], n = lista.length;
  if (!Number.isInteger(desde) || !Number.isInteger(hasta) || desde < 0 || hasta >= n || desde > hasta) return null;
  const vacioEs = (b) => !!b && b.type === 'paragraph' && !(b.content || []).length;
  let d = desde, h = hasta;
  while (d > 0 && vacioEs(lista[d - 1])) d--;
  while (h < n - 1 && vacioEs(lista[h + 1])) h++;
  return { desde: d, hasta: h, antes: d > 0, despues: h < n - 1, todo: d === 0 && h === n - 1 };
}

/* Hasta tres partes: lo de antes, el tramo y lo de despues (las que sobran son null). Juntas arman el original, bloque por
   bloque; si no, no se parte. */
export function partirEnTres(doc, desde, hasta) {
  const bloques = Array.isArray(doc && doc.content) ? doc.content : [], plan = planRango(bloques, desde, hasta);
  if (!plan) return null;
  let resto = { type: 'doc', content: copia(bloques) }, antes = null, despues = null;
  if (plan.despues) {
    const r = cortar(resto, plan.hasta + 1);
    if (!r) return null;
    resto = r.cabeza;
    despues = r.cola;
  }
  if (plan.antes) {
    const r = cortar(resto, plan.desde);
    if (!r) return null;
    antes = r.cabeza;
    resto = r.cola;
  }
  const junto = [...(antes ? antes.content : []), ...resto.content, ...(despues ? despues.content : [])];
  if (JSON.stringify(junto) !== JSON.stringify(bloques)) return null;
  return { plan, antes, medio: resto, despues };
}
