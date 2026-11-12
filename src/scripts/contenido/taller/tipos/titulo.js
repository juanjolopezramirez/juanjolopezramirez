/* Los titulos. El primero de un capitulo es su nombre, el que sale en las miniaturas y en el indice. */
import { alineacion, el, estiloAlinear, renglones } from './ayuda.js';
import { esAncla, RE_ANCLA_TITULO } from '../IndiceLibro.js';

export const tipo = 'titulo';
export const nodos = ['heading'];
export const contextos = ['texto'];
export const contiene = 'enlinea';
export const editor = 'starter-kit';

/* `id`: su ancla fija (t-xxxxxxxx), la que usa el contenido del libro para llevar hasta aqui */
export const datos = (_, a) => ({ level: [1, 2, 3].includes(a.level) ? a.level : 1, alinear: alineacion(a.alinear), id: esAncla(RE_ANCLA_TITULO, a.id) ? a.id : '' });
export const web = (n, hijos) => el(`h${n.attrs.level}`, '', renglones(hijos), n.attrs.id ? { id: n.attrs.id } : {}, estiloAlinear(n.attrs));
export const pdf = web;
