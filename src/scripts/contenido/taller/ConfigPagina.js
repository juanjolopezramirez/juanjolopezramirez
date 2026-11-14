/* LA PAGINA DEL LIBRO: tamaño y margenes en milimetros, numeros, indice y letra del cuerpo.

   Todo sale de aqui: la vista previa, el PDF, la zona segura sobre un diseño traido de Figma y
   la resolucion con la que se guardan sus paginas. */
import { objeto, rutaAlmacen, tiene } from '../comun.js';
import { nombreDeFuente, FUENTES_MAX } from './fuentes.js';
import { colorValido } from './marcas.js';
import { RECIENTES_MAX } from './colores.js';
import { textoIndice, TITULO_INDICE_MAX, PALABRA_MAX, PLANTILLAS } from './IndiceLibro.js';
import { limpiarLomo } from './LomoLibro.js';
import { limpiarAviso } from './AvisoLibro.js';
import { AUTOR_MAX, limpiarLados, textoCabezaPropio } from './CabezaLibro.js';

export const LADO_MIN = 50;
export const LADO_MAX = 420;
const CAJA_MIN = 20;              // lo que debe quedar para el texto entre margenes, en mm
const ANCHO_PX_MAX = 2480;        // A4 a 300 ppp: mas que esto pesa sin verse mejor
const ALTO_PX_MAX = 3508;
const MM_POR_PULGADA = 25.4;
export const PPP = 300;           // la resolucion de imprenta: a la que se piden los px de un diseño en Figma
export const mmAPx = (v) => Math.round((v / MM_POR_PULGADA) * PPP);
export const pxAMm = (v) => Math.round((v / PPP) * MM_POR_PULGADA * 100) / 100;

export const TAMANOS = [
  { id: 'a5', nombre: 'A5 (148 × 210 mm)', anchoMm: 148, altoMm: 210 },
  { id: 'a4', nombre: 'A4 (210 × 297 mm)', anchoMm: 210, altoMm: 297 },
  { id: 'carta', nombre: 'Carta (216 × 279 mm)', anchoMm: 215.9, altoMm: 279.4 },
  { id: 'oficio', nombre: 'Oficio o folio (216 × 330 mm)', anchoMm: 216, altoMm: 330 },
  { id: '6x9', nombre: '6 × 9 pulgadas (152 × 229 mm)', anchoMm: 152.4, altoMm: 228.6 },
  { id: '5x8', nombre: '5 × 8 pulgadas (127 × 203 mm)', anchoMm: 127, altoMm: 203.2 }
];
export const LUGARES_NUMERO = ['pie-centro', 'pie-exterior', 'pie-interior', 'pie-izquierda', 'pie-derecha'];
/* De que lado del pie cae el numero de la pagina `n`. La pagina 1 es de la derecha (como al abrir un libro):
   «hacia afuera» va a la derecha en las impares y a la izquierda en las pares; «hacia adentro», al reves.
   La mesa y la hoja de impresion leen esta misma tabla. */
export function ladoDelNumero(lugar, n) {
  if (lugar === 'pie-izquierda') return 'izq';
  if (lugar === 'pie-derecha') return 'der';
  if (lugar !== 'pie-exterior' && lugar !== 'pie-interior') return 'centro';
  const impar = Math.abs(Math.trunc(n)) % 2 === 1;
  return (lugar === 'pie-exterior') === impar ? 'der' : 'izq';
}
/* El panel ofrece 2 a 4 renglones; 5 solo se conserva en los libros que ya lo tenian */
export const CAPITAL_LINEAS = [2, 3, 4, 5];
/* Hundida: baja junto a sus renglones. Sencilla: una letra algo mayor. (La elevada se quito: un libro que la
   tenia vuelve a la hundida.) */
export const CAPITAL_ESTILOS = ['hundida', 'sencilla'];

/* El color de cada letra del libro: { fuente: color }. Se lee con `colorDeLetra`: una fuente puede llamarse «constructor» */
export const colorDeLetra = (c, fuente) => (tiene(c.letras, fuente) ? c.letras[fuente] : '');

function letrasValidas(v) {
  return Object.fromEntries(Object.entries(objeto(v)).filter(([f, c]) => nombreDeFuente(f) && colorValido(c)).slice(0, FUENTES_MAX).map(([f, c]) => [f, colorValido(c)]));
}

const mm = (v, min, max, siNo, pasos = 10) => (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? Math.round(v * pasos) / pasos : siNo);
/* Para la capital y las citas: lo que se pasa del borde se queda en el borde, no vuelve al valor de siempre */
const entre = (v, min, max, siNo, pasos = 10) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.min(max, Math.max(min, v)) * pasos) / pasos : siNo);

/* El encabezado corrido: distancia al borde de arriba (mm) y tamaño de letra (pt) */
export const CABEZA_DISTANCIA = { min: 4, max: 30, siNo: 10 };
export const CABEZA_TAMANO = { min: 6, max: 14, siNo: 9 };
/* El renglon del encabezado mide 1,2 veces su letra (cabeza.css y la hoja de impresion lo usan igual) */
export const CABEZA_INTERLINEA = 1.2;

/* La imagen de arriba del contenido. El alto es un porcentaje de la caja del texto. */
export const IMAGEN_INDICE_ALTOS = [20, 30, 40, 50];
const RE_IMAGEN_LIBRO = /^taller\/[a-z0-9]+(?:[.-][a-z0-9]+)*\/img\/[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
function imagenDeIndice(v) {
  const o = objeto(v), ruta = typeof o.ruta === 'string' && rutaAlmacen(o.ruta, ['webp', 'png', 'jpg']) && RE_IMAGEN_LIBRO.test(o.ruta) ? o.ruta : '';
  return { ruta, altoPct: entre(o.altoPct, 15, 60, 30, 1), ajuste: o.ajuste === 'contener' ? 'contener' : 'cubrir' };
}

const copiaLados = (p) => Object.fromEntries(Object.entries(p).map(([l, s]) => [l, { ...s }]));

export class ConfigPagina {
  constructor(d = {}) {
    const o = objeto(d), m = objeto(o.margenes), n = objeto(o.numeros), c = objeto(o.cuerpo);
    this.anchoMm = mm(o.anchoMm, LADO_MIN, LADO_MAX, 148, 100);
    this.altoMm = mm(o.altoMm, LADO_MIN, LADO_MAX, 210, 100);
    this.margenes = { sup: mm(m.sup, 0, 150, 20), inf: mm(m.inf, 0, 150, 22), izq: mm(m.izq, 0, 150, 18), der: mm(m.der, 0, 150, 18) };
    this.numeros = { ver: n.ver !== false, lugar: LUGARES_NUMERO.includes(n.lugar) ? n.lugar : 'pie-centro' };
    /* El contenido del libro. Antes era solo «si o no» (true): ese libro lo sigue teniendo, con lo de siempre. */
    const ind = o.indice === true ? { ver: true } : objeto(o.indice);
    this.indice = {
      ver: ind.ver === true,
      titulo: textoIndice(ind.titulo, TITULO_INDICE_MAX),
      subtemas: ind.subtemas !== false,
      puntos: ind.puntos !== false,
      /* El capitulo delante del cual va ('' = al comienzo del libro). Si ya no existe, va al comienzo. */
      antesDe: typeof ind.antesDe === 'string' && /^[A-Za-z0-9-]{1,40}$/.test(ind.antesDe) ? ind.antesDe : '',
      /* Como se ve: una plantilla (sin ella, la clasica de siempre), el numero del capitulo delante, una imagen
         arriba (solo una del libro: taller/<libro>/img/…) y, en Tarjetas, la portada de cada capitulo */
      plantilla: PLANTILLAS.includes(ind.plantilla) ? ind.plantilla : 'clasico',
      orden: ind.orden === true,
      imagen: imagenDeIndice(ind.imagen),
      portadas: ind.portadas === true,
      /* El papel del capitulo (Introducción…) delante de su nombre, aunque los rotulos esten apagados */
      verRol: ind.verRol === true,
      /* Negrita en las filas de cada nivel: capitulos (n1) y subtemas (n2). Apagadas, las filas salen como siempre. */
      negrita: { n1: objeto(ind.negrita).n1 === true, n2: objeto(ind.negrita).n2 === true }
    };
    /* EL ENCABEZADO: una linea arriba de cada hoja de texto («Capítulo 2 · Nombre · Introducción · Actividades»).
       Apagado hasta que el autor lo pida. Cada parte se enciende aparte; la distancia es desde el borde de arriba
       de la hoja hasta la primera linea, y la letra es la del libro. Lo que se pasa de los topes se queda en el tope. */
    const cb = objeto(o.cabeza), pa = objeto(cb.partes);
    this.cabeza = {
      ver: cb.ver === true,
      partes: { rotulo: pa.rotulo !== false, nombre: pa.nombre !== false, rol: pa.rol === true, subetapa: pa.subetapa === true },
      distanciaMm: entre(cb.distanciaMm, CABEZA_DISTANCIA.min, CABEZA_DISTANCIA.max, CABEZA_DISTANCIA.siNo),
      tamanoPt: entre(cb.tamanoPt, CABEZA_TAMANO.min, CABEZA_TAMANO.max, CABEZA_TAMANO.siNo),
      /* Que va en cada lugar de cada pagina (CabezaLibro.limpiarLados). Un libro guardado antes de esto no los trae:
         queda en «Solo capitulo», el nombre del capitulo al centro de las dos, que es como se veia. */
      lados: limpiarLados(cb.lados)
    };
    /* Quien escribio el libro: lo usa el encabezado. Vacio = sin autor. */
    this.autor = textoCabezaPropio(o.autor, AUTOR_MAX);
    /* El rotulo de los capitulos («Capítulo 1», «Episodio IV»): apagado hasta que el autor lo pida.
       Sin palabra, la del idioma del libro. */
    const ro = objeto(o.rotulo);
    /* Una palabra corta no necesita marcas invisibles (ni de direccion): se quitan, asi no reordena la fila */
    this.rotulo = { ver: ro.ver === true, palabra: textoIndice(typeof ro.palabra === 'string' ? ro.palabra.replace(/[\u{200B}-\u{200F}\u{2060}\u{FEFF}]/gu, '') : '', PALABRA_MAX), cifras: ro.cifras === 'romano' ? 'romano' : 'arabe' };
    /* La primera hoja como portada: 'auto' la reconoce sola (IndiceLibro.hayPortada); 'si' y 'no' los elige el autor */
    this.portada = o.portada === true || o.portada === 'si' ? 'si' : o.portada === false || o.portada === 'no' ? 'no' : 'auto';
    this.imprenta = o.imprenta === true;
    /* El lomo y las tapas de «Ver como libro», y el aviso de sus botones: datos limpios (LomoLibro.js, AvisoLibro.js) */
    this.lomo = limpiarLomo(o.lomo);
    this.aviso = limpiarAviso(o.aviso);
    this.papel = colorValido(o.papel);
    this.letras = letrasValidas(o.letras);
    this.titulos = Object.fromEntries(['t1', 't2', 't3'].map((k) => [k, colorValido(objeto(o.titulos)[k])]));
    this.colores = (Array.isArray(o.colores) ? o.colores : []).map(colorValido).filter(Boolean).slice(0, RECIENTES_MAX);
    this.cuerpo = {
      fuente: nombreDeFuente(c.fuente) ? c.fuente : 'Young Serif',
      tamanoPt: mm(c.tamanoPt, 4, 72, 11),
      interlinea: mm(c.interlinea, 1, 3, 1.5, 100)
    };
    /* La letra grande del comienzo y las citas, para todo el libro. Sin datos quedan como siempre estuvieron.
       Una letra vacia es la del libro. */
    const cap = objeto(o.capital), ci = objeto(o.cita);
    this.capital = {
      estilo: CAPITAL_ESTILOS.includes(cap.estilo) ? cap.estilo : 'hundida',
      fuente: nombreDeFuente(cap.fuente) ? cap.fuente : '',
      lineas: CAPITAL_LINEAS.includes(cap.lineas) ? cap.lineas : 3,
      /* 'auto' crece con la letra. 1,2 mm era el de antes, que el panel escribia siempre: en un libro guardado
         antes de los estilos (sin `estilo`) pasa a automatico. Quien hoy escribe 1,2 lo conserva. */
      separaMm: cap.estilo === undefined && cap.separaMm === 1.2 ? 'auto' : entre(cap.separaMm, 0, 6, 'auto')
    };
    this.cita = {
      fuente: nombreDeFuente(ci.fuente) ? ci.fuente : '',
      tamanoPct: entre(ci.tamanoPct, 70, 160, 100, 1),
      sangriaMm: entre(ci.sangriaMm, 0, 40, 4.7),
      cursiva: ci.cursiva !== false
    };
  }

  /* La caja donde va el texto, en mm. Sin espacio para escribir, la pagina no sirve. */
  cajaDeTexto() {
    const { sup, inf, izq, der } = this.margenes;
    return { ancho: this.anchoMm - izq - der, alto: this.altoMm - sup - inf };
  }

  errores() {
    const c = this.cajaDeTexto();
    return c.ancho < CAJA_MIN || c.alto < CAJA_MIN ? ['margenes'] : [];
  }

  /* El encabezado no cabe en el margen de arriba: su distancia y su renglon pasan del margen. Solo se avisa; los
     margenes no se tocan solos. */
  cabezaApretada() {
    const { ver, distanciaMm, tamanoPt } = this.cabeza;
    return ver && this.margenes.sup < distanciaMm + (tamanoPt * CABEZA_INTERLINEA * MM_POR_PULGADA) / 72;
  }

  /* Los margenes como porcentaje de la pagina: asi se dibuja la zona segura a cualquier tamaño */
  aPorcentajes() {
    const { sup, inf, izq, der } = this.margenes;
    const p = (v, t) => Math.round((v / t) * 10000) / 100;
    return { sup: p(sup, this.altoMm), inf: p(inf, this.altoMm), izq: p(izq, this.anchoMm), der: p(der, this.anchoMm) };
  }

  /* La hoja en pixeles enteros: asi la pantalla y el PDF cortan cada pagina en la misma palabra. En
     pantalla un pixel de mas o de menos no se ve; al imprimir, el margen absorbe la fraccion y la hoja
     sale exacta en milimetros. */
  enPixeles() {
    const px = (v) => (v / MM_POR_PULGADA) * 96, r = (v) => Math.round(px(v));
    const { sup, inf, izq, der } = this.margenes;
    const W = r(this.anchoMm), H = r(this.altoMm), mt = r(sup), mb = r(inf), ml = r(izq), mr = r(der);
    const ancho = W - ml - mr, alto = H - mt - mb;
    const dos = (v) => Math.round(v * 100) / 100;
    /* El navegador redondea la hoja del PDF a puntos enteros: el margen se calcula sobre esa hoja real */
    const pts = (v) => Math.round((v / MM_POR_PULGADA) * 72), anchoPt = pts(this.anchoMm), altoPt = pts(this.altoMm);
    return { W, H, mt, mb, ml, mr, ancho, alto, gap: 28, anchoPt, altoPt, mrImpresion: dos((anchoPt * 96) / 72 - ml - ancho), mbImpresion: dos((altoPt * 96) / 72 - mt - alto) };
  }

  /* Los pixeles que necesita una pagina de este libro: salen del LIBRO, nunca del PDF */
  pxPara(dpi = 300) {
    return {
      ancho: Math.min(Math.round((this.anchoMm / MM_POR_PULGADA) * dpi), ANCHO_PX_MAX),
      alto: Math.min(Math.round((this.altoMm / MM_POR_PULGADA) * dpi), ALTO_PX_MAX)
    };
  }

  aDatos() {
    return {
      anchoMm: this.anchoMm, altoMm: this.altoMm, margenes: { ...this.margenes }, numeros: { ...this.numeros }, indice: { ...this.indice, imagen: { ...this.indice.imagen }, negrita: { ...this.indice.negrita } }, cuerpo: { ...this.cuerpo },
      rotulo: { ...this.rotulo }, cabeza: { ...this.cabeza, partes: { ...this.cabeza.partes }, lados: { izquierda: copiaLados(this.cabeza.lados.izquierda), derecha: copiaLados(this.cabeza.lados.derecha) } }, autor: this.autor, portada: this.portada, imprenta: this.imprenta, lomo: { ...this.lomo, tapas: { ...this.lomo.tapas } }, aviso: { ...this.aviso }, papel: this.papel, letras: { ...this.letras }, titulos: { ...this.titulos }, colores: [...this.colores],
      capital: { ...this.capital }, cita: { ...this.cita }
    };
  }
}
