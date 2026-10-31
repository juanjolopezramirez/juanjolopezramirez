/* Una cita. */
import { el } from './ayuda.js';

export const tipo = 'cita';
export const nodos = ['blockquote'];
export const contextos = ['texto'];
export const contiene = 'bloques';
export const editor = 'starter-kit';
export const minimo = () => true;

export const datos = () => ({});
export const web = (n, hijos) => el('blockquote', '', hijos);
export const pdf = web;
