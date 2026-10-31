/* LA PAGINA DEL LIBRO: tamaño y margenes en milimetros, numeros, indice y letra del cuerpo.

   Todo sale de aqui: la vista previa, el PDF, la zona segura sobre un diseño traido de Figma y
   la resolucion con la que se guardan sus paginas. */
import { objeto } from '../comun.js';
import { nombreDeFuente } from './fuentes.js';

export const LADO_MIN = 50;
export const LADO_MAX = 420;
const CAJA_MIN = 20;              // lo que debe quedar para el texto entre margenes, en mm
const ANCHO_PX_MAX = 2480;        // A4 a 300 ppp: mas que esto pesa sin verse mejor
const ALTO_PX_MAX = 3508;
const MM_POR_PULGADA = 25.4;

export const TAMANOS = [
  { id: 'a5', nombre: 'A5 (148 × 210 mm)', anchoMm: 148, altoMm: 210 },
  { id: 'a4', nombre: 'A4 (210 × 297 mm)', anchoMm: 210, altoMm: 297 },
  { id: '6x9', nombre: '6 × 9 pulgadas (152 × 229 mm)', anchoMm: 152.4, altoMm: 228.6 },
  { id: '5x8', nombre: '5 × 8 pulgadas (127 × 203 mm)', anchoMm: 127, altoMm: 203.2 }
];
export const LUGARES_NUMERO = ['pie-centro', 'pie-exterior', 'pie-interior'];

const mm = (v, min, max, siNo, pasos = 10) => (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? Math.round(v * pasos) / pasos : siNo);

export class ConfigPagina {
  constructor(d = {}) {
    const o = objeto(d), m = objeto(o.margenes), n = objeto(o.numeros), c = objeto(o.cuerpo);
    this.anchoMm = mm(o.anchoMm, LADO_MIN, LADO_MAX, 148);
    this.altoMm = mm(o.altoMm, LADO_MIN, LADO_MAX, 210);
    this.margenes = { sup: mm(m.sup, 0, 150, 20), inf: mm(m.inf, 0, 150, 22), izq: mm(m.izq, 0, 150, 18), der: mm(m.der, 0, 150, 18) };
    this.numeros = { ver: n.ver !== false, lugar: LUGARES_NUMERO.includes(n.lugar) ? n.lugar : 'pie-centro' };
    this.indice = o.indice === true;
    this.cuerpo = {
      fuente: nombreDeFuente(c.fuente) ? c.fuente : 'Young Serif',
      tamanoPt: mm(c.tamanoPt, 4, 72, 11),
      interlinea: mm(c.interlinea, 1, 3, 1.5, 100)
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

  /* Los margenes como porcentaje de la pagina: asi se dibuja la zona segura a cualquier tamaño */
  aPorcentajes() {
    const { sup, inf, izq, der } = this.margenes;
    const p = (v, t) => Math.round((v / t) * 10000) / 100;
    return { sup: p(sup, this.altoMm), inf: p(inf, this.altoMm), izq: p(izq, this.anchoMm), der: p(der, this.anchoMm) };
  }

  /* Los pixeles que necesita una pagina de este libro: salen del LIBRO, nunca del PDF */
  pxPara(dpi = 300) {
    return {
      ancho: Math.min(Math.round((this.anchoMm / MM_POR_PULGADA) * dpi), ANCHO_PX_MAX),
      alto: Math.min(Math.round((this.altoMm / MM_POR_PULGADA) * dpi), ALTO_PX_MAX)
    };
  }

  aDatos() {
    return { anchoMm: this.anchoMm, altoMm: this.altoMm, margenes: { ...this.margenes }, numeros: { ...this.numeros }, indice: this.indice, cuerpo: { ...this.cuerpo } };
  }
}
