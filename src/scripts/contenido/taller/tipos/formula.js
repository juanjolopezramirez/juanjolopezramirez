/* UNA FORMULA dentro del texto: fracciones, exponentes, raices. Se guarda como texto de formula (LaTeX), y
   KaTeX la dibuja igual en la hoja, en el PDF y en la web. Se dibuja sin confiar en nada: `trust` va
   apagado, asi que un \href o \includegraphics escrito a mano no hace nada. */
import { el, txt } from './ayuda.js';

export const tipo = 'formula';
export const nodos = ['formula'];
export const contextos = ['texto'];
export const contiene = 'nada';
export const editor = 'formula';
export const enLinea = true;
export const TEX_MAX = 2000;
export const OPCIONES_KATEX = { throwOnError: false, trust: false, strict: 'ignore', output: 'htmlAndMathml', maxExpand: 200, maxSize: 20 };

const QUITAR = /[\u0000-\u0008\u000B-\u001F\u007F‪-‮⁦-⁩]/g;
export const datos = (_, a) => ({ tex: (typeof a.tex === 'string' ? a.tex.replace(QUITAR, '') : '').slice(0, TEX_MAX) });
export const web = (n) => el('span', 'formula', [txt(n.attrs.tex)], { 'data-tex': n.attrs.tex });
export const pdf = web;
