/* UNA SUBETAPA: una franja pequeña con un nombre («Actividades», «Quiz», «Proyecto»…) que SIEMPRE empieza una hoja
   nueva. Lo que sigue, hasta la proxima subetapa o el fin del capitulo, pertenece a ella: el encabezado de arriba
   de la hoja puede decirlo. Va solo en el texto de arriba, nunca dentro de unas columnas. */
import { el, txt } from './ayuda.js';
import { textoIndice } from '../IndiceLibro.js';

export const tipo = 'subetapa';
export const nodos = ['subetapa'];
export const contextos = ['texto'];
export const contiene = 'nada';
export const editor = 'subetapa';
/* La limpieza no la deja dentro de unas columnas (TextoLibro.limpiarNodo): alli seria una franja que no parte la hoja */
export const soloArriba = true;
export const SUBETAPA_MAX = 40;

export const datos = (_, a) => ({ texto: textoIndice(a.texto, SUBETAPA_MAX) });

/* El mismo arbol en la mesa, la web y el PDF */
export const franjaDeSubetapa = (crudo) => el('div', 'subetapa', datos(null, crudo || {}).texto ? [txt(datos(null, crudo).texto)] : []);
export const web = (n) => franjaDeSubetapa(n.attrs);
export const pdf = web;
