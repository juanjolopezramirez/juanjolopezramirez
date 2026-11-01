/* Los titulos. El primero de un capitulo es su nombre, el que sale en las miniaturas y en el indice. */
import { alineacion, el, estiloAlinear, renglones } from './ayuda.js';

export const tipo = 'titulo';
export const nodos = ['heading'];
export const contextos = ['texto'];
export const contiene = 'enlinea';
export const editor = 'starter-kit';

export const datos = (_, a) => ({ level: [1, 2, 3].includes(a.level) ? a.level : 1, alinear: alineacion(a.alinear) });
export const web = (n, hijos) => el(`h${n.attrs.level}`, '', renglones(hijos), {}, estiloAlinear(n.attrs));
export const pdf = web;
