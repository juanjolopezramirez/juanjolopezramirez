/* LOS OBJETOS DE UNA PAGINA LIBRE: imagen, cuadro de texto y zona. Todo va en % de la pagina: asi cae
   en el mismo lugar a cualquier tamaño, en pantalla y al imprimir.

   Cada clase de objeto trae sus partes: limpiar (datos), web y pdf. Una zona no sale en el PDF: es el
   espacio donde viviran los quizzes del libro web. El recorte nunca toca la imagen: guarda cuanto se
   esconde de cada lado (`crop`, de 0 a 1), y «Quitar recorte» la devuelve entera. */
import { datosDeBoton, piezaDeBoton } from './boton.js';
import { objeto, rutaAlmacen, texto } from '../../comun.js';
import { colorValido, tamanoValido } from '../marcas.js';
import { nombreDeFuente } from '../fuentes.js';
import { alineacion, el, txt } from './ayuda.js';
import { Zona } from '../Zona.js';

export const OBJETOS_MAX = 200;
export const TEXTO_CUADRO_MAX = 5000;
const num = (v, min, max, siNo, fino = 100) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v * fino) / fino)) : siNo);
const FINO_RECORTE = 10000;
const CSS_ALINEAR = { izquierda: 'left', centro: 'center', derecha: 'right', justificado: 'justify' };

function caja(o) {
  return { x: num(o.x, -100, 200, 10), y: num(o.y, -100, 200, 10), w: num(o.w, .5, 300, 40), h: num(o.h, .5, 300, 30), rot: num(o.rot, -360, 360, 0) };
}
const estiloCaja = (o) => ({ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, height: `${o.h}%`, ...(o.rot ? { transform: `rotate(${o.rot}deg)` } : {}) });
const idValido = (v) => (typeof v === 'string' && /^o-[a-z0-9]{8}$/.test(v) ? v : '');

function recorte(c) {
  const o = objeto(c), l = num(o.l, 0, .98, 0, FINO_RECORTE), t = num(o.t, 0, .98, 0, FINO_RECORTE);
  return { l, t, r: num(o.r, 0, .98 - l, 0, FINO_RECORTE), b: num(o.b, 0, .98 - t, 0, FINO_RECORTE) };
}

export const OBJETOS = {
  imagen: {
    limpiar: (o) => ({
      id: idValido(o.id), tipo: 'imagen', ...caja(o), crop: recorte(o.crop),
      ruta: rutaAlmacen(o.ruta, ['webp', 'jpg', 'png']) && o.ruta.startsWith('taller/') ? o.ruta : '', alt: texto(o.alt, 300), decorativa: o.decorativa === true
    }),
    pdf(o, s) {
      const src = (s.imagenes || {})[o.ruta];
      if (!src) return null;
      const vw = 1 - o.crop.l - o.crop.r, vh = 1 - o.crop.t - o.crop.b;
      const dim = { width: `${100 / vw}%`, height: `${100 / vh}%`, left: `${(-o.crop.l / vw) * 100}%`, top: `${(-o.crop.t / vh) * 100}%` };
      return el('div', 'obj obj--imagen', [el('img', '', [], { src, alt: o.decorativa ? '' : o.alt }, dim)], {}, estiloCaja(o));
    }
  },
  texto: {
    limpiar: (o) => ({
      id: idValido(o.id), tipo: 'texto', ...caja(o), texto: typeof o.texto === 'string' ? o.texto.slice(0, TEXTO_CUADRO_MAX) : '',
      fuente: nombreDeFuente(o.fuente) ? o.fuente : '', tam: tamanoValido(o.tam) || '14pt', color: colorValido(o.color), alinear: alineacion(o.alinear)
    }),
    pdf: (o) => el('div', 'obj obj--texto', [txt(o.texto)], {}, {
      ...estiloCaja(o), 'font-size': o.tam, ...(o.color ? { color: o.color } : {}),
      ...(o.fuente ? { 'font-family': `"${o.fuente}", Georgia, serif` } : {}),
      ...(o.alinear ? { 'text-align': CSS_ALINEAR[o.alinear] } : {})
    })
  },
  boton: {
    limpiar: (o) => ({ id: idValido(o.id), tipo: 'boton', ...caja(o), ...datosDeBoton(o), tam: tamanoValido(o.tam) || '12pt' }),
    pdf: (o, salida = {}) => piezaDeBoton(o, 'obj obj--boton boton', { ...estiloCaja(o), 'font-size': o.tam }, salida.web === true)
  },
  zona: {
    limpiar: (o) => ({ ...new Zona(o).aDatos(), id: idValido(o.id), tipo: 'zona', rot: 0 }),
    pdf: () => null
  }
};

export const limpiarObjetos = (lista) => (Array.isArray(lista) ? lista : []).slice(0, OBJETOS_MAX).map(objeto)
  .filter((o) => Object.prototype.hasOwnProperty.call(OBJETOS, o.tipo)).map((o) => OBJETOS[o.tipo].limpiar(o));
