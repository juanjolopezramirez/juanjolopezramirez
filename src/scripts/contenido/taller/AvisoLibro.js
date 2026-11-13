/* EL AVISO DE «VER COMO LIBRO», sin pantalla. Cuando un boton del libro se toca (copiar un texto, abrir un enlace)
   el visor lo dice en una franja chica. Hay UNA para todo el libro: lo que dice en cada caso, su color, donde sale y
   cuantos segundos. Todo son datos limpios (textos cortos por textoIndice, colores por colorValido, un numero con
   tope). Un libro viejo, sin nada de esto, usa los textos de siempre. */
import { objeto } from '../comun.js';
import { colorValido } from './marcas.js';
import { tintaPara } from './colores.js';
import { textoIndice } from './IndiceLibro.js';

export const AVISO_TEXTO_MAX = 60;
export const AVISO_SEGUNDOS = { min: 1.5, max: 6, siNo: 3 };
export const AVISO_LUGARES = ['arriba', 'abajo'];
/* Los casos de un aviso: copiado, enlace abierto, y cuando no se pudo */
export const AVISO_CASOS = ['copiado', 'enlace', 'falla'];

export function limpiarAviso(v) {
  const o = objeto(v), s = o.segundos;
  return {
    copiado: textoIndice(o.copiado, AVISO_TEXTO_MAX),
    enlace: textoIndice(o.enlace, AVISO_TEXTO_MAX),
    falla: textoIndice(o.falla, AVISO_TEXTO_MAX),
    fondo: colorValido(o.fondo),
    tinta: colorValido(o.tinta),
    lugar: AVISO_LUGARES.includes(o.lugar) ? o.lugar : 'abajo',
    segundos: typeof s === 'number' && Number.isFinite(s) ? Math.round(Math.min(AVISO_SEGUNDOS.max, Math.max(AVISO_SEGUNDOS.min, s)) * 10) / 10 : AVISO_SEGUNDOS.siNo
  };
}

/* El texto de un caso: el del autor, o el de siempre (`porDefecto`: { copiado, enlace, falla }) */
export const textoDeAviso = (aviso, caso, porDefecto) => (AVISO_CASOS.includes(caso) && limpiarAviso(aviso)[caso]) || (AVISO_CASOS.includes(caso) ? (porDefecto || {})[caso] || '' : '');

/* Los colores que se pintan: '' es el de siempre (lo pone la hoja de estilo). La letra, sin elegir, se escoge sola
   para que se lea sobre el fondo. */
export function colorDeAviso(aviso) {
  const a = limpiarAviso(aviso);
  return { fondo: a.fondo, tinta: a.tinta || (a.fondo ? tintaPara(a.fondo) : '') };
}
