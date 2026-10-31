/* UNA PIEZA: un PDF de diseño (el que viene de Figma) metido en el libro.

   El texto del libro solo guarda «aqui va la pieza X». Las paginas, su texto y sus zonas viven
   aqui: por eso «Reemplazar» deja el diseño nuevo en el mismo lugar, sin tocar lo escrito.

   `revisarContraLibro` es pura: cada pagina guarda una vez la caja de lo que tiene dibujado, y al
   cambiar los margenes los avisos se recalculan sin volver a leer ningun pixel. */
import { objeto, texto, rutaAlmacen } from '../comun.js';
import { Zona } from './Zona.js';

export const PAGINAS_MAX = 200;
const RUTAS_PAGINA = ['webp', 'jpg', 'png'];
const TOLERANCIA_PROPORCION = 0.02;
const TOLERANCIA_MM = 1;
const HOLGURA_PCT = 0.3;              // lo que se perdona al pasarse de un margen
const MINIMO_TEXTO = 20;

const pct = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v * 100) / 100)) : 0);
const positivo = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 30000 ? v : 0);

export class PaginaDisenada {
  constructor(d = {}) {
    const o = objeto(d);
    this.n = Number.isInteger(o.n) && o.n > 0 ? o.n : 1;
    this.ruta = rutaAlmacen(o.ruta, RUTAS_PAGINA) && o.ruta.startsWith('taller/') ? o.ruta : '';
    this.w = positivo(o.w);
    this.h = positivo(o.h);
    this.texto = texto(o.texto, 20000);
    this.alt = texto(o.alt, 600);
    const c = objeto(o.caja);
    this.caja = o.caja ? { x: pct(c.x), y: pct(c.y), w: pct(c.w), h: pct(c.h) } : null;
    this.sangre = o.sangre === true;
    this.zonas = (Array.isArray(o.zonas) ? o.zonas : []).map((z) => new Zona(z).aDatos());
  }

  aDatos() { return { n: this.n, ruta: this.ruta, w: this.w, h: this.h, texto: this.texto, alt: this.alt, caja: this.caja, sangre: this.sangre, zonas: this.zonas }; }
}

export class Pieza {
  constructor(d = {}) {
    const o = objeto(d);
    this.id = typeof o.id === 'string' ? o.id.slice(0, 40) : '';
    this.obraId = typeof o.obraId === 'string' ? o.obraId.slice(0, 40) : '';
    this.nombre = texto(o.nombre, 160);
    this.estado = o.estado === 'lista' ? 'lista' : 'procesando';
    this.pdf = rutaAlmacen(o.pdf, ['pdf']) && o.pdf.startsWith('taller/') ? o.pdf : '';
    this.anchoMm = positivo(o.anchoMm);
    this.altoMm = positivo(o.altoMm);
    this.dpi = Number.isInteger(o.dpi) && o.dpi > 0 && o.dpi <= 600 ? o.dpi : 300;
    this.ajuste = o.ajuste === 'cubrir' ? 'cubrir' : 'contener';
    this.rev = Number.isInteger(o.rev) ? o.rev : 1;
    this.paginas = (Array.isArray(o.paginas) ? o.paginas : []).slice(0, PAGINAS_MAX).map((p) => new PaginaDisenada(p).aDatos());
  }

  /* Lo que le dice al fundador si este diseño encaja en este libro */
  revisarContraLibro(config) {
    const ratio = this.altoMm ? this.anchoMm / this.altoMm : 0, ratioLibro = config.anchoMm / config.altoMm;
    const proporcion = ratio > 0 && Math.abs(ratio - ratioLibro) / ratioLibro <= TOLERANCIA_PROPORCION;
    const tamano = Math.abs(this.anchoMm - config.anchoMm) <= TOLERANCIA_MM && Math.abs(this.altoMm - config.altoMm) <= TOLERANCIA_MM;
    const m = config.aPorcentajes();
    const fuera = [], sinTexto = [];
    for (const p of this.paginas) {
      if (p.texto.length < MINIMO_TEXTO && !p.alt) sinTexto.push(p.n);
      if (!p.caja) continue;
      const lados = [];
      if (p.caja.y < m.sup - HOLGURA_PCT) lados.push('sup');
      if (p.caja.y + p.caja.h > 100 - m.inf + HOLGURA_PCT) lados.push('inf');
      if (p.caja.x < m.izq - HOLGURA_PCT) lados.push('izq');
      if (p.caja.x + p.caja.w > 100 - m.der + HOLGURA_PCT) lados.push('der');
      if (lados.length) fuera.push({ n: p.n, lados, sangre: p.sangre });
    }
    const px = config.pxPara(this.dpi);
    const resolucionBaja = this.paginas.some((p) => p.w > 0 && p.w < px.ancho * 0.9);
    return { proporcion, tamano, fuera, sinTexto, resolucionBaja };
  }

  aDatos() {
    return {
      id: this.id, obraId: this.obraId, nombre: this.nombre, estado: this.estado, pdf: this.pdf, anchoMm: this.anchoMm,
      altoMm: this.altoMm, dpi: this.dpi, ajuste: this.ajuste, rev: this.rev, paginas: this.paginas
    };
  }
}
