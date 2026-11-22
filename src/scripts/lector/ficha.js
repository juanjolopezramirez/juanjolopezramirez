/* LA FICHA DEL LIBRO: lo que dice el «ⓘ» del lector (resumen, tema, «Lo que encontrarás», «Para quién»).

   La escribe el autor en el Taller (taller/Ficha.js) y viaja por tres caminos: la obra (taller_obras.ficha), cada edicion
   de un enlace privado (taller_ediciones.ficha, que entrega la funcion `vista`) y Recursos (biblioteca.ficha, un mapa
   { idioma: ficha }). La base la revisa con supabase/016_ficha.sql (ficha_valida, fichas_validas); aqui se limpia con
   topes que NUNCA pasan los de alla, asi lo que sale de aqui siempre cabe.

   PURO: sin DOM, sin red, sin importar nada. Lo usan el lector (su paquete no lleva nada del portal), el Taller y la
   compilacion. Lo que llega de fuera nunca se usa tal cual: objeto sin prototipo, solo las cuatro claves, textos
   limpios y cortados. El resumen admite saltos de linea; lo demas es de una linea. */

/* Los topes de 016 cuentan letras (char_length); aqui se cuentan unidades UTF-16, que nunca son menos: cabe siempre */
export const TOPES = Object.freeze({ resumen: 500, tema: 60, para_quien: 80, clave: 70, claves: 5 });
export const CLAVES_FICHA = Object.freeze(['resumen', 'tema', 'claves', 'para_quien']);
const IDIOMAS_MAX = 10;

const propia = (o, k) => !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

/* Fuera: los controles (C0, C1), lo que no se ve o da la vuelta al texto. El salto de linea se trata aparte. */
const RAROS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const SALTOS = /\r\n?|[\u2028\u2029]/g;
/* Medio emoji suelto (una mitad sin la otra): la base no lo acepta en un jsonb */
const SUELTOS = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g; // un par entero se queda; una mitad sola, no (sin lookbehind: Safari viejo)

/* Corta en `max` unidades sin partir un emoji por la mitad */
function cortar(t, max) {
  if (t.length <= max) return t;
  let s = t.slice(0, max);
  if (/[\uD800-\uDBFF]$/.test(s)) s = s.slice(0, -1);
  return s;
}

/* Un texto de una linea: todo blanco (saltos y tabuladores incluidos) es un espacio */
function linea(v, max) {
  if (typeof v !== 'string') return '';
  const t = v.replace(SALTOS, ' ').replace(/\t/g, ' ').replace(RAROS, '').replace(SUELTOS, (m) => (m.length === 2 ? m : '')).replace(/\s+/g, ' ').trim();
  return cortar(t, max).trim();
}

/* El resumen: los saltos se quedan (como mucho una linea en blanco seguida), sin espacios al final de cada renglon */
function parrafos(v, max) {
  if (typeof v !== 'string') return '';
  const t = v.replace(SALTOS, '\n').replace(/\t/g, ' ').replace(RAROS, '').replace(SUELTOS, (m) => (m.length === 2 ? m : ''))
    .replace(/[^\S\n]+\n/g, '\n').replace(/\n[^\S\n]+/g, '\n').replace(/[^\S\n]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
  return cortar(t, max).trim();
}

/* → un objeto sin prototipo con SOLO lo que tiene algo: { resumen?, tema?, claves?, para_quien? } ({} si nada) */
export function limpiarFicha(x) {
  const f = Object.create(null);
  if (!x || typeof x !== 'object' || Array.isArray(x)) return f;
  const resumen = propia(x, 'resumen') ? parrafos(x.resumen, TOPES.resumen) : '';
  const tema = propia(x, 'tema') ? linea(x.tema, TOPES.tema) : '';
  const lista = propia(x, 'claves') && Array.isArray(x.claves) ? x.claves : [];
  const claves = [];
  for (const c of lista.slice(0, 50)) {
    const t = linea(c, TOPES.clave);
    if (t) claves.push(t);
    if (claves.length === TOPES.claves) break;
  }
  const paraQuien = propia(x, 'para_quien') ? linea(x.para_quien, TOPES.para_quien) : '';
  if (resumen) f.resumen = resumen;
  if (tema) f.tema = tema;
  if (claves.length) f.claves = claves;
  if (paraQuien) f.para_quien = paraQuien;
  return f;
}

/* ¿No dice nada? (lo que no es una ficha, tampoco dice nada) */
export const fichaVacia = (f) => Object.keys(limpiarFicha(f)).length === 0;

/* { idioma: ficha } limpio: solo idiomas de dos letras (y, si se pasa, solo los de `idiomas`), sin fichas vacias */
export function limpiarFichas(mapa, idiomas = null) {
  const salida = Object.create(null);
  if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa)) return salida;
  for (const l of Object.keys(mapa)) {
    if (!/^[a-z]{2}$/.test(l) || (idiomas && !idiomas.includes(l))) continue;
    const f = limpiarFicha(mapa[l]);
    if (Object.keys(f).length) salida[l] = f;
    if (Object.keys(salida).length === IDIOMAS_MAX) break;
  }
  return salida;
}

/* La ficha que toca de un mapa { idioma: ficha }: el primer idioma de `orden` que tenga una; si ninguno, cualquiera.
   → { idioma, ficha } o null */
export function fichaPorIdioma(mapa, orden = []) {
  const limpio = limpiarFichas(mapa);
  const hay = Object.keys(limpio);
  if (!hay.length) return null;
  const l = (Array.isArray(orden) ? orden : []).find((x) => typeof x === 'string' && propia(limpio, x)) || hay[0];
  return { idioma: l, ficha: limpio[l] };
}
