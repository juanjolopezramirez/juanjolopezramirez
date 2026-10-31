/* Las paginas de un PDF de diseño, en medio del libro. El texto solo guarda `pieza`; las
   paginas viven en la pieza (Pieza.js). En el PDF cada una ocupa una hoja entera, sin margen.
   En la web saldran sus zonas con sus bloques (Fase 4). */
import { el } from './ayuda.js';

export const tipo = 'paginasPdf';
export const nodos = ['paginasPdf'];
export const contextos = ['texto'];
export const contiene = 'nada';
export const editor = 'paginasPdf';

export const datos = (_, a) => ({ pieza: typeof a.pieza === 'string' && /^[a-z0-9-]{1,40}$/.test(a.pieza) ? a.pieza : '' });

const hojas = (n, o = {}) => {
  const pieza = (o.piezas || {})[n.attrs.pieza];
  if (!pieza) return [];
  return pieza.paginas.map((p) => {
    const src = (o.imagenes || {})[p.ruta];
    if (!src) return null;
    return el('div', `pag-disenada pag-disenada--${pieza.ajuste === 'cubrir' ? 'cubrir' : 'contener'}`, [
      el('img', '', [], { src, alt: p.alt || p.texto.slice(0, 1000) })
    ]);
  }).filter(Boolean);
};

export const pdf = (n, _, o) => el('div', 'pieza', hojas(n, o));
export const web = pdf;
