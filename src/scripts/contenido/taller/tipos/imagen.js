/* Una imagen del libro. Vive en el cajon privado: la vista y el PDF reciben sus bytes como
   direccion «data:» (`o.imagenes`), porque la politica del sitio no deja imagenes de fuera. */
import { rutaAlmacen, texto } from '../../comun.js';
import { alineacion, el, estiloAlinear, txt } from './ayuda.js';

export const tipo = 'imagen';
export const nodos = ['imagen'];
export const contextos = ['texto'];
export const contiene = 'nada';
export const editor = 'imagen';

export function datos(_, a) {
  const ancho = typeof a.anchoPct === 'number' && a.anchoPct >= 5 && a.anchoPct <= 100 ? Math.round(a.anchoPct) : 100;
  return {
    ruta: rutaAlmacen(a.ruta, ['webp', 'jpg', 'png']) && a.ruta.startsWith('taller/') ? a.ruta : '',
    alt: texto(a.alt, 300), decorativa: a.decorativa === true, pie: texto(a.pie, 300), anchoPct: ancho, alinear: alineacion(a.alinear)
  };
}

export function web(n, _, o = {}) {
  const a = n.attrs, src = (o.imagenes || {})[a.ruta];
  if (!src) return null;
  return el('figure', 'imagen', [
    el('img', '', [], { src, alt: a.decorativa ? '' : a.alt }, { width: `${a.anchoPct}%` }),
    ...(a.pie ? [el('figcaption', '', [txt(a.pie)])] : [])
  ], {}, estiloAlinear(a));
}
export const pdf = web;
