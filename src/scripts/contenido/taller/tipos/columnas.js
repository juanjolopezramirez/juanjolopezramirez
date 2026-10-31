/* Columnas a medida: de 2 a 6, cada una del ancho que se quiera (`anchos`, en partes). */
import { el } from './ayuda.js';

export const tipo = 'columnas';
export const nodos = ['columnas', 'columna'];
export const contextos = ['texto'];
export const contiene = 'bloques';
export const editor = 'columnas';
export const minimo = (nombre) => nombre === 'columna';
export const COLUMNAS_MIN = 2;
export const COLUMNAS_MAX = 6;

const anchoValido = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 12;

export function datos(nombre, a) {
  if (nombre === 'columna') return {};
  const lista = Array.isArray(a.anchos) ? a.anchos.filter(anchoValido).slice(0, COLUMNAS_MAX) : [];
  return { anchos: lista.length >= COLUMNAS_MIN ? lista : [1, 1] };
}

export function web(n, hijos) {
  if (n.type === 'columna') return el('div', 'columna', hijos);
  return el('div', 'columnas', hijos, {}, { 'grid-template-columns': n.attrs.anchos.map((x) => `${x}fr`).join(' ') });
}
export const pdf = web;
