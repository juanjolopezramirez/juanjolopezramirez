/* EL LOMO DEL LIBRO, sin pantalla. Lo que el autor elige para el lomo y las tapas de «Ver como libro»: el texto, el
   color, la letra, el grueso y el color de cada tapa. Todo son datos limpios (texto corto, colores de colorValido,
   un numero con tope): nunca CSS escrito. Un libro viejo, sin nada de esto, se ve como siempre.

   `estiloDeLomo` da lo que el visor pinta; el grueso automatico (segun las hojas) lo pone quien llama. */
import { objeto } from '../comun.js';
import { colorValido } from './marcas.js';
import { tintaPara } from './colores.js';
import { textoIndice } from './IndiceLibro.js';

export const LOMO_TEXTO_MAX = 40;
export const LOMO_GROSOR = { min: 4, max: 40 };       // mm
export const LOMO_COLOR = '#1f3b2c';                  // el verde de siempre
const TITULO_MAX = 120;

/* `grosor` es 'auto' o milimetros con tope: lo que se pasa se queda en el tope. Un texto que no es numero es 'auto'. */
export function limpiarLomo(v) {
  const o = objeto(v), t = objeto(o.tapas), g = o.grosor;
  return {
    texto: textoIndice(o.texto, LOMO_TEXTO_MAX),
    color: colorValido(o.color),
    tinta: colorValido(o.tinta),
    grosor: typeof g === 'number' && Number.isFinite(g) ? Math.round(Math.min(LOMO_GROSOR.max, Math.max(LOMO_GROSOR.min, g)) * 10) / 10 : 'auto',
    tapas: { delante: colorValido(t.delante), detras: colorValido(t.detras) }
  };
}

/* Lo que se pinta. `color` vacio es el verde de siempre (lo pone la hoja de estilo); la letra, sin elegir, se escoge
   sola para que se lea sobre el color (y sin color, la crema de siempre: '' ). Una tapa sin color propio sigue al lomo.
   `ancho`: lo que mide una pagina del libro en px; `pxPorMm`: cuantos px vale un mm de la hoja; `autoPx`: el grueso
   automatico (segun las hojas). */
export function estiloDeLomo(lomo, titulo, { autoPx = 12, pxPorMm = 1, ancho = 600 } = {}) {
  const l = limpiarLomo(lomo);
  const grosorPx = l.grosor === 'auto' ? autoPx : Math.round(Math.min(ancho * 0.35, Math.max(6, l.grosor * pxPorMm)));
  return {
    texto: l.texto || textoIndice(titulo, TITULO_MAX),
    color: l.color,
    tinta: l.tinta || (l.color ? tintaPara(l.color) : ''),
    grosorPx,
    delante: l.tapas.delante || l.color,
    detras: l.tapas.detras || l.color
  };
}
