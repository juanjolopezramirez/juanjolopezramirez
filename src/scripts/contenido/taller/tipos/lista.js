/* Listas con puntos o con numeros. */
import { el } from './ayuda.js';

export const tipo = 'lista';
export const nodos = ['bulletList', 'orderedList', 'listItem'];
export const contextos = ['texto'];
export const contiene = 'bloques';
export const editor = 'starter-kit';
export const minimo = (nombre) => nombre === 'listItem';

export const datos = (nombre, a) => (nombre === 'orderedList' && Number.isInteger(a.start) && a.start > 0 && a.start < 100000 ? { start: a.start } : {});
const ETIQUETA = { bulletList: 'ul', orderedList: 'ol', listItem: 'li' };
export const web = (n, hijos) => el(ETIQUETA[n.type], '', hijos, n.attrs.start > 1 ? { start: String(n.attrs.start) } : {});
export const pdf = web;
