/* EL SVG QUE SUBE EL FUNDADOR, convertido en formas. Se lee como datos (DOMParser no ejecuta nada) y de el solo
   se sacan formas simples con sus numeros: trazos, circulos, rectangulos, lineas, poligonos. Lo demas se va:
   scripts, estilos, imagenes, enlaces, textos, animaciones. El color se pierde a proposito: el icono toma el
   del texto del boton. Al final pasa por la misma revision que cada lectura (iconosBoton.iconoPropio). */
import { D_MAX, FORMAS, FORMAS_MAX, NUMEROS, iconoPropio } from '../../../../contenido/taller/iconosBoton.js';

export const SVG_MAX_BYTES = 20 * 1024;

/* Solo numeros sin unidad (o en px): «1em» o «100%» no son medidas que se puedan dibujar igual */
const numero = (v) => { const s = String(v ?? '').trim(); return /^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?(px)?$/i.test(s) ? parseFloat(s) : undefined; };
/* Lo que el SVG no escribe vale cero */
const CERO = new Set(['cx', 'cy', 'x', 'y', 'x1', 'y1', 'x2', 'y2']);
const invisible = (p) => p.display === 'none' || p.visibility === 'hidden' || p.opacity === '0' || p.fill === 'transparent' && (!p.stroke || p.stroke === 'none');

/* Lo que se hereda de los padres: fill, stroke y su grosor, tambien escritos en style="" */
function pintura(e, her) {
  const style = Object.fromEntries((e.getAttribute('style') || '').split(';').map((x) => x.split(':').map((s) => s.trim())).filter(([k, v]) => k && v));
  const leer = (k) => style[k] ?? e.getAttribute(k) ?? undefined;
  const o = { ...her };
  for (const k of ['fill', 'stroke', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'display', 'visibility']) { const v = leer(k); if (v !== undefined && v !== null) o[k] = v; }
  const g = numero(leer('stroke-width'));
  if (g !== undefined) o['stroke-width'] = g;
  /* Transparente por opacidad: no se dibuja (sin color no hay medio tono que guardar) */
  for (const k of ['opacity', 'fill-opacity', 'stroke-opacity']) {
    const v = leer(k);
    if (v !== undefined && v !== null && parseFloat(v) === 0) { if (k === 'opacity') o.opacity = '0'; else o[k === 'fill-opacity' ? 'fill' : 'stroke'] = 'none'; }
  }
  return o;
}

function cajaDe(raiz) {
  const v = (raiz.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (v.length === 4 && v.every(Number.isFinite)) return v;
  const w = numero(raiz.getAttribute('width')), h = numero(raiz.getAttribute('height'));
  return w && h ? [0, 0, w, h] : null;
}

/* Se cuentan hasta un poco mas del tope: asi se sabe si el SVG es demasiado complejo, en vez de cortarlo callado */
const CONTAR_HASTA = FORMAS_MAX + 1;
function recorrer(nodo, her, transform, formas) {
  for (const e of nodo.children) {
    if (formas.length >= CONTAR_HASTA) return;
    const nombre = e.localName, propio = (e.getAttribute('transform') || '').trim(), t = `${transform} ${propio}`.trim();
    if (nombre === 'g') { const p = pintura(e, her); if (!invisible(p)) recorrer(e, p, t, formas); continue; }
    if (!FORMAS.includes(nombre)) continue;           // defs, style, script, use, image, text…: fuera
    const p = pintura(e, her), f = { t: nombre };
    if (invisible(p)) continue;
    for (const k of NUMEROS[nombre]) { const v = numero(e.getAttribute(k)); if (v !== undefined) f[k] = v; else if (CERO.has(k) && !e.hasAttribute(k)) f[k] = 0; }
    if (nombre === 'path') f.d = e.getAttribute('d') || '';
    if (nombre === 'polyline' || nombre === 'polygon') f.points = e.getAttribute('points') || '';
    f.relleno = p.fill !== 'none' && p.fill !== 'transparent';
    if (p['fill-rule'] === 'evenodd') f.regla = 'evenodd';
    f.trazo = p.stroke && p.stroke !== 'none' ? (p['stroke-width'] ?? 1) : 0;
    f.punta = p['stroke-linecap'];
    f.union = p['stroke-linejoin'];
    if (t) f.transform = t;
    formas.push(f);
  }
}

/* { icono } listo para guardar, o { error } con la clave del aviso */
export function deTexto(texto) {
  if (typeof texto !== 'string' || !texto.trim()) return { error: 'svgNoSirve' };
  if (/<!DOCTYPE|<!ENTITY/i.test(texto)) return { error: 'svgNoSirve' };
  const doc = new DOMParser().parseFromString(texto, 'image/svg+xml'), raiz = doc.documentElement;
  if (doc.getElementsByTagName('parsererror').length || !raiz || raiz.localName !== 'svg') return { error: 'svgNoSirve' };
  const caja = cajaDe(raiz);
  if (!caja) return { error: 'svgNoSirve' };
  /* Los colores puestos por clases (<style> de Illustrator) no se pueden leer: se pide exportarlo de otra forma */
  if (raiz.getElementsByTagName('style').length && raiz.querySelector('[class]')) return { error: 'svgClases' };
  /* Sin decir nada, un SVG rellena de negro y no traza */
  const formas = [];
  recorrer(raiz, pintura(raiz, { fill: 'black', stroke: 'none', 'stroke-width': 1 }), '', formas);
  const letras = formas.reduce((s, f) => s + (f.d || f.points || '').length, 0);
  if (formas.length > FORMAS_MAX || letras > D_MAX) return { error: 'svgComplejo' };
  const icono = iconoPropio({ caja, formas });
  return icono ? { icono } : { error: 'svgVacio' };
}

export async function leerSvg(archivo) {
  if (!archivo) return { error: 'svgNoSirve' };
  if (archivo.size > SVG_MAX_BYTES) return { error: 'svgGrande' };
  try { return deTexto(await archivo.text()); } catch (e) { return { error: 'svgNoSirve' }; }
}
