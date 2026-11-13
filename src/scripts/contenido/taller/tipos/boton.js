/* Un boton: abre un enlace o copia un texto que deja el fundador. Va en su propia linea del texto, o suelto
   en una pagina libre (tipos/objetos.js). Un PDF no puede tocar el portapapeles: ahi el boton de copiar
   solo se dibuja, y funciona en el libro web. Sin su enlace o su texto se avisa en la mesa, y sale sin accion. */
import { enlaceSeguro, texto } from '../../comun.js';
import { colorValido } from '../marcas.js';
import { tintaPara } from '../colores.js';
import { alineacion, el, txt } from './ayuda.js';
import { LADOS, arbolIcono, limpiarIcono } from '../iconosBoton.js';
import { claseDeAspecto, esHueco, estiloAspecto, estiloSuelto, limpiarAspecto, limpiarSuelto } from '../aspectoBoton.js';

export const tipo = 'boton';
export const nodos = ['boton'];
export const contextos = ['texto'];
export const contiene = 'nada';
export const editor = 'boton';
export const TEXTO_MAX = 120;
export const COPIA_MAX = 5000;

/* Lo que se copia va a parar a otra herramienta, como una IA, que puede leer lo que aqui no se ve: se va todo
   caracter invisible. Quedan el salto de linea, el tabulador y lo que necesitan el hebreo y los emojis. */
const OCULTOS = new RegExp('[\\u0000-\\u0008\\u000B-\\u001F\\u007F-\\u009F\\u200B\\u2028-\\u202E\\u2060-\\u206F\\uFEFF\\u{E0000}-\\u{E007F}\\u{E0100}-\\u{E01EF}]', 'gu');

export const enlaceDeBoton = (v) => (enlaceSeguro(v) && v.startsWith('https://') ? v : '');

export const datosDeBoton = (a) => ({
  texto: texto(a.texto, TEXTO_MAX), accion: a.accion === 'copiar' ? 'copiar' : 'enlace', enlace: enlaceDeBoton(a.enlace),
  copia: typeof a.copia === 'string' ? a.copia.replace(OCULTOS, '').slice(0, COPIA_MAX) : '', fondo: colorValido(a.fondo), color: colorValido(a.color),
  icono: limpiarIcono(a.icono), lado: LADOS.includes(a.lado) ? a.lado : 'izq', aspecto: limpiarAspecto(a.aspecto)
});

/* El icono va a un lado del texto, o solo: entonces el texto no se ve pero sigue siendo el nombre del boton
   (lo lee el lector de pantalla y lo copia quien selecciona en el PDF) */
export function hijosDeBoton(o) {
  const icono = arbolIcono(o.icono), t = txt(o.texto);
  if (!icono) return [t];
  if (!o.texto) return [icono];            // sin texto, el icono va centrado y sin hueco a su lado
  const nombre = el('span', 'boton__texto', [t]);
  return o.lado === 'der' ? [nombre, icono] : [icono, nombre];
}
export const claseDeIcono = (o) => (limpiarIcono(o.icono) ? ` boton--icono${o.lado === 'solo' ? ' boton--solo' : ''}` : '');
/* Lo que dice la clase: el icono y el aspecto (sin relleno, «Duolingo»). Sin ninguno de los dos, '' como siempre. */
export const claseDeBoton = (o) => claseDeIcono(o) + claseDeAspecto(o);

/* `suelto`: null, o { dx, dy, rot }: el boton no ocupa renglon y se mueve desde el lugar de su parrafo */
export const datos = (_, a) => ({ ...datosDeBoton(a), alinear: alineacion(a.alinear), suelto: limpiarSuelto(a.suelto) });
export const botonIncompleto = (o) => (o.accion === 'copiar' ? !o.copia : !o.enlace);

/* Sin relleno (contorno y texto), el color del boton pinta la letra y la linea (y, si no hay, el color de la letra); con relleno, el fondo y su letra legible */
export const estiloDeBoton = (o) => ({
  ...(esHueco(o)
    ? (o.fondo || o.color ? { color: o.fondo || o.color } : {})
    : { ...(o.fondo ? { 'background-color': o.fondo, color: o.color || tintaPara(o.fondo) } : {}), ...(o.color ? { color: o.color } : {}) }),
  ...estiloAspecto(o)
});

export function piezaDeBoton(o, claseBase, estilo, web) {
  const e = { ...estiloDeBoton(o), ...estilo }, hijos = hijosDeBoton(o), clase = claseBase + claseDeBoton(o);
  if (o.accion === 'enlace' && o.enlace) return el('a', clase, hijos, { href: o.enlace }, e);
  if (web && o.accion === 'copiar' && o.copia) return el('button', clase, hijos, { type: 'button', 'data-copiar': o.copia }, e);
  return el('div', clase, hijos, {}, e);
}

const clase = (a) => `boton${a.alinear ? ` boton--${a.alinear}` : ''}`;
/* Un boton suelto va dentro de un marco sin alto, que ocupa su lugar en el texto pero ningun renglon. El boton se
   pone con `left`/`top` en mm desde ese punto, y se gira sobre su centro: lo mismo en la mesa y en el PDF. */
export const claseSuelto = 'boton-suelto';
const armarBoton = (n, web) => {
  const a = n.attrs;
  if (!a.suelto) return piezaDeBoton(a, clase(a), {}, web);
  return el('div', claseSuelto, [piezaDeBoton(a, 'boton boton--suelta', estiloSuelto(a.suelto), web)]);
};
export const pdf = (n) => armarBoton(n, false);
export const web = (n) => armarBoton(n, true);
