/* Los titulos dentro de un capitulo. El titulo del capitulo va aparte (h1): aqui son h2 a h4. */
import { alineacion, el, estiloAlinear } from './ayuda.js';

export const tipo = 'titulo';
export const nodos = ['heading'];
export const contextos = ['texto'];
export const contiene = 'enlinea';
export const editor = 'starter-kit';

export const datos = (_, a) => ({ level: [1, 2, 3].includes(a.level) ? a.level : 1, alinear: alineacion(a.alinear) });
export const web = (n, hijos) => el(`h${n.attrs.level + 1}`, '', hijos, {}, estiloAlinear(n.attrs));
export const pdf = web;
