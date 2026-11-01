/* El parrafo. `capital` es la letra grande del comienzo. */
import { alineacion, el, estiloAlinear, renglones } from './ayuda.js';

export const tipo = 'parrafo';
export const nodos = ['paragraph'];
export const contextos = ['texto'];
export const contiene = 'enlinea';
export const editor = 'starter-kit';

export const datos = (_, a) => ({ capital: a.capital === true, alinear: alineacion(a.alinear) });
export const web = (n, hijos) => el('p', n.attrs.capital ? 'capital' : '', renglones(hijos), {}, estiloAlinear(n.attrs));
export const pdf = web;
