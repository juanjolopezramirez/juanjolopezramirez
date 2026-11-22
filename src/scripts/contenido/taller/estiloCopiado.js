/* COPIAR ESTILO (el rodillo de Word), la parte pura: que se copia y como se pega. Sin pagina ni editor: trabaja con marcas y
   bloques en su forma JSON ({ type, attrs }), y la ventana de lo elegido (panel/dev/taller/Burbuja.js) lo lleva al editor.

   Lo que se copia del texto: negrita, cursiva, subrayado, tachado, exponente, subindice y el estilo de la letra (color, tamaño
   y fuente). Pasa por la misma regla que lo que se guarda (marcas.js → limpiarMarcas). NUNCA se copian un enlace, una
   definicion ni una cita: son datos de esa palabra, no su aspecto.
   Lo que se copia del parrafo: si es parrafo o titulo (y su nivel) y la alineacion. Solo se pega en los bloques que la nueva
   seleccion toma ENTEROS (como en Word: pintar unas palabras no cambia su parrafo). La letra capital no se copia: es el adorno
   de UN comienzo. */
import { limpiarMarcas } from './marcas.js';
import { leerReferencias } from '../../biblia/referencias.js';

export const MARCAS_DE_ESTILO = Object.freeze(['bold', 'italic', 'underline', 'strike', 'superscript', 'subscript', 'textStyle']);
const ALINEAR = ['', 'izquierda', 'centro', 'derecha', 'justificado'];
const objeto = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});

/* Las marcas de estilo de un trozo, limpias (las demas se quedan fuera) */
export function marcasDeEstilo(marcas) {
  return limpiarMarcas((Array.isArray(marcas) ? marcas : []).filter((m) => MARCAS_DE_ESTILO.includes(objeto(m).type)));
}

/* El estilo de un bloque: { tipo: 'paragraph' | 'heading', nivel?, alinear } o null si no es uno de esos */
export function estiloDeBloque(b) {
  const o = objeto(b), a = objeto(o.attrs);
  const alinear = ALINEAR.includes(a.alinear) ? a.alinear : '';
  if (o.type === 'paragraph') return { tipo: 'paragraph', alinear };
  if (o.type === 'heading' && [1, 2, 3].includes(a.level)) return { tipo: 'heading', nivel: a.level, alinear };
  return null;
}

/* Lo que copia el rodillo: { marcas: [...], bloque: {...} | null } */
export const capturarEstilo = (marcas, bloque) => ({ marcas: marcasDeEstilo(marcas), bloque: estiloDeBloque(bloque) });

/* Las marcas que quedan en un trozo al pintarlo: se van las de estilo que tenia, llegan las copiadas; enlaces, definiciones y
   citas se quedan como estaban. */
export function marcasPintadas(actuales, estilo) {
  const quedan = (Array.isArray(actuales) ? actuales : []).filter((m) => !MARCAS_DE_ESTILO.includes(objeto(m).type));
  return [...quedan, ...marcasDeEstilo(objeto(estilo).marcas)];
}

/* Los atributos nuevos de un bloque tomado entero: { type, attrs } o null si no cambia nada (o no es parrafo ni titulo) */
export function bloquePintado(bloque, estilo) {
  const actual = estiloDeBloque(bloque), nuevo = estiloDeBloque(objeto(estilo).bloque ? { type: estilo.bloque.tipo, attrs: { level: estilo.bloque.nivel, alinear: estilo.bloque.alinear } } : null);
  if (!actual || !nuevo) return null;
  const a = objeto(objeto(bloque).attrs);
  if (nuevo.tipo === 'heading') return { type: 'heading', attrs: { level: nuevo.nivel, alinear: nuevo.alinear, ...(actual.tipo === 'heading' && a.id ? { id: a.id } : {}) } };
  return { type: 'paragraph', attrs: { alinear: nuevo.alinear, capital: actual.tipo === 'paragraph' ? a.capital === true : false } };
}

/* ¿Toma la seleccion el bloque entero? (desde su primera letra hasta la ultima) */
export const bloqueEntero = (inicioBloque, finBloque, desde, hasta) => desde <= inicioBloque && hasta >= finBloque && finBloque > inicioBloque;

/* EL ORDEN DE LA BURBUJA: si lo elegido parece una referencia biblica, «Referencia bíblica» va primero (y se resalta) */
export function pareceCita(texto, idioma) {
  const t = String(texto || '').slice(0, 400);
  return !!t.trim() && leerReferencias(t, { idioma: idioma === 'en' ? 'en' : 'es' }).length > 0;
}
export const ordenDeNotas = (texto, idioma) => (pareceCita(texto, idioma) ? ['citaBiblica', 'definicion'] : ['definicion', 'citaBiblica']);
