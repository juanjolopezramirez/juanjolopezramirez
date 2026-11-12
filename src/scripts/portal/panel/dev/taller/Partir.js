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
