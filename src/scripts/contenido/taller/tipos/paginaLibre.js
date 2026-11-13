/* UNA PAGINA LIBRE: como Canva. Una hoja entera con su fondo (la pagina de un PDF, o nada) y sus objetos
   encima. Vive dentro del capitulo, asi deshacer, guardar y las copias valen para todo. Al imprimir es
   una hoja sin margenes y sin numero. */
import { objeto, rutaAlmacen, texto } from '../../comun.js';
import { el } from './ayuda.js';
import { limpiarObjetos, OBJETOS } from './objetos.js';
import { colorValido } from '../marcas.js';
import { PAPEL_BASE } from '../colores.js';
import { esAncla, RE_ANCLA_PAGINA, textoIndice, TITULO_INDICE_MAX } from '../IndiceLibro.js';
import { PAGINAS_MAX } from '../Pieza.js';

export const tipo = 'paginaLibre';
export const nodos = ['paginaLibre'];
export const contextos = ['texto'];
export const contiene = 'nada';
export const editor = 'paginaLibre';

const pct = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v * 100) / 100)) : 0);
const positivo = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 30000 ? v : 0);

export function datos(_, a) {
  const c = objeto(a.caja);
  return {
    nombre: texto(a.nombre, 120),
    fondo: rutaAlmacen(a.fondo, ['webp', 'jpg', 'png']) && a.fondo.startsWith('taller/') ? a.fondo : '',
    pdf: rutaAlmacen(a.pdf, ['pdf']) && a.pdf.startsWith('taller/') ? a.pdf : '',
    /* Que pagina era en su PDF (0 = no se sabe: OrigenPdf la saca del nombre del fondo) y si quedo de un PDF anterior.
       Solo la mesa los muestra: el PDF del libro no los dibuja. */
    pdfPagina: Number.isInteger(a.pdfPagina) && a.pdfPagina >= 1 && a.pdfPagina <= PAGINAS_MAX ? a.pdfPagina : 0,
    /* Cuantas paginas tenia ese PDF al subirlo (0 = no se sabe): el cambio de PDF no trae de vuelta lo que se borro del final */
    pdfTotal: Number.isInteger(a.pdfTotal) && a.pdfTotal >= 1 && a.pdfTotal <= PAGINAS_MAX ? a.pdfTotal : 0,
    sobra: a.sobra === true,
    anchoMm: positivo(a.anchoMm), altoMm: positivo(a.altoMm),
    ajuste: a.ajuste === 'cubrir' ? 'cubrir' : 'contener',
    texto: texto(a.texto, 20000), alt: texto(a.alt, 600),
    caja: a.caja ? { x: pct(c.x), y: pct(c.y), w: pct(c.w), h: pct(c.h) } : null,
    sangre: a.sangre === true,
    papel: colorValido(a.papel),
    objetos: limpiarObjetos(a.objetos),
    /* Su nombre en el contenido del libro ('' = no sale) y su ancla fija (p-xxxxxxxx) */
    titulo: textoIndice(a.titulo, TITULO_INDICE_MAX),
    ancla: esAncla(RE_ANCLA_PAGINA, a.ancla) ? a.ancla : ''
  };
}

export function pdf(n, _, o = {}) {
  const a = n.attrs, hijos = [];
  const src = (o.imagenes || {})[a.fondo];
  if (src) hijos.push(el('img', `pag-libre__fondo pag-libre__fondo--${a.ajuste}`, [], { src, alt: a.alt || a.texto.slice(0, 1000) }));
  for (const obj of a.objetos) { const e = OBJETOS[obj.tipo].pdf(obj, o); if (e) hijos.push(e); }
  /* Un PDF traido conserva su dibujo, que va encima: lo que no cubre es el papel de su capitulo o del libro */
  const papel = (!a.fondo && a.papel) || o.papelCapitulo || PAPEL_BASE;
  if (o.papelesLibres) o.papelesLibres.add(papel);
  return el('div', `pag-libre papel-${papel.slice(1)}${a.fondo ? ' pag-libre--pdf' : ''}`, [el('div', 'pag-libre__caja', hijos)], a.titulo && a.ancla ? { id: a.ancla } : {});
}
export const web = (n, h, o = {}) => pdf(n, h, { ...o, web: true });

/* Lo que se pasa de los margenes del libro, sin leer ningun pixel */
const HOLGURA = .3;
export function fueraDeMargen(attrs, m) {
  const fuera = (c) => c.y < m.sup - HOLGURA || c.y + c.h > 100 - m.inf + HOLGURA || c.x < m.izq - HOLGURA || c.x + c.w > 100 - m.der + HOLGURA;
  return { fondo: !!attrs.caja && fuera(attrs.caja), objetos: attrs.objetos.filter((o) => o.tipo !== 'zona' && fuera(o)).map((o) => o.id) };
}
