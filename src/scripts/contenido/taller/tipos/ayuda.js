/* Lo que comparten los tipos de bloque del libro. El arbol que producen es el mismo de
   contenido/render.js: { tag, clase, attrs, estilo, hijos } o { texto }. */
export const ALINEAR = ['izquierda', 'centro', 'derecha', 'justificado'];
const CSS_ALINEAR = { izquierda: 'left', centro: 'center', derecha: 'right', justificado: 'justify' };

export const alineacion = (v) => (ALINEAR.includes(v) ? v : '');
export const estiloAlinear = (a) => (a.alinear ? { 'text-align': CSS_ALINEAR[a.alinear] } : {});
export const el = (tag, clase = '', hijos = [], attrs = {}, estilo = {}) => ({ tag, clase, hijos, attrs, estilo });
export const txt = (texto) => ({ texto });
/* El ultimo <br> de un bloque no ocupa renglon: el vacio y el salto final llevan uno de mas, como el editor */
export const renglones = (hijos) => (!hijos.length || hijos[hijos.length - 1].tag === 'br' ? [...hijos, el('br')] : hijos);
