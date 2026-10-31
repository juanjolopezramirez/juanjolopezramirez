/* Una linea que separa. */
import { el } from './ayuda.js';

export const tipo = 'separador';
export const nodos = ['horizontalRule'];
export const contextos = ['texto'];
export const contiene = 'nada';
export const editor = 'starter-kit';

export const datos = () => ({});
export const web = () => el('hr');
export const pdf = web;
