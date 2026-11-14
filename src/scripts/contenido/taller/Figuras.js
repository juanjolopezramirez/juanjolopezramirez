/* LAS FIGURAS DE UNA PAGINA LIBRE: cuadrado, circulo, triangulo, flecha y plano cartesiano. Aqui vive TODA su
   geometria, en un solo lugar: la mesa y el PDF dibujan el mismo arbol, asi que salen iguales.

   Nada escrito por nadie llega al dibujo: la forma y la variante salen de listas, los colores pasan por
   colorValido y todo lo demas son numeros con tope. El arbol usa solo lo que armar.js deja pasar (svg, path,
   ellipse, rect, line, polygon con numeros revisados; fill y stroke solo `none` o `currentColor`).

   Se dibuja en MILIMETROS REALES (el viewBox mide lo que mide la caja en la hoja): asi el grosor es de verdad
   en milimetros, ningun trazo se deforma, y agrandar la figura no engorda su borde. El borde se mete la mitad
   de su grosor hacia dentro: la figura nunca se sale de su caja.

   Es PURO (sin navegador): se prueba en Node. */
import { colorValido } from './marcas.js';
import { el } from './tipos/ayuda.js';
import { texto } from '../comun.js';

export const FORMAS = ['rect', 'elipse', 'triangulo', 'flecha', 'plano'];
export const VARIANTES = { rect: [], elipse: [], triangulo: ['isosceles', 'rectangulo'], flecha: ['una', 'doble'], plano: ['completo', 'superior', 'derecha', 'cuadrante'] };
export const GROSOR_MAX = 10, RADIO_MAX = 20, OPACIDAD_MIN = 20, CELDAS_MAX = 20;
/* Cuantas rayas de la cuadricula se dibujan, a cada lado del origen: un tope, por si la caja es muy estrecha */
const RAYAS_MAX = 40;
const OPACIDAD_CUADRICULA = '0.35';
const HOLGURA = .12;
export const ALT_MAX = 300;

export const num = (v, min, max, siNo, fino = 100) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v * fino) / fino)) : siNo);
/* Numero corto y sin notacion cientifica: lo que armar.js acepta en un atributo */
const t = (n) => String(Math.round(n * 1000) / 1000);
const medida = (v, siNo) => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 30000 ? v : siNo);

/* Los datos propios de una figura, ya revisados. Se puede llamar con lo que sea: siempre devuelve algo dibujable. */
export function limpiarFigura(o) {
  const x = o && typeof o === 'object' ? o : {};
  const forma = FORMAS.includes(x.forma) ? x.forma : 'rect';
  return {
    forma,
    variante: VARIANTES[forma].includes(x.variante) ? x.variante : (VARIANTES[forma][0] || ''),
    relleno: colorValido(x.relleno), borde: colorValido(x.borde),
    grosor: num(x.grosor, 0, GROSOR_MAX, .5, 10), radio: num(x.radio, 0, RADIO_MAX, 0, 10),
    opacidad: Math.round(num(x.opacidad, OPACIDAD_MIN, 100, 100, 1)),
    celdas: Math.round(num(x.celdas, 1, CELDAS_MAX, 4, 1)), cuadricula: x.cuadricula !== false,
    /* Lo que muestra, para quien no lo ve: una linea, sin controles ni signos que den la vuelta al texto */
    alt: texto(x.alt, ALT_MAX).replace(/\s+/g, ' ').trim()
  };
}

/* Como nace cada figura: su medida en milimetros (ancho, alto) y sus datos. Lo demas lo pone la mesa (lugar y giro). */
const TINTA = '#111111', GRIS = '#d9d9d9';
const VIDA = { opacidad: 100, radio: 0, celdas: 8, cuadricula: true, alt: '' };
export const FIGURA_NUEVA = {
  rect: { mm: [50, 35], datos: { variante: '', relleno: GRIS, borde: TINTA, grosor: .8, ...VIDA } },
  elipse: { mm: [40, 40], datos: { variante: '', relleno: GRIS, borde: TINTA, grosor: .8, ...VIDA } },
  triangulo: { mm: [45, 40], datos: { variante: 'isosceles', relleno: GRIS, borde: TINTA, grosor: .8, ...VIDA } },
  flecha: { mm: [60, 25], datos: { variante: 'una', relleno: TINTA, borde: '', grosor: .8, ...VIDA } },
  plano: { mm: [60, 60], datos: { variante: 'completo', relleno: '', borde: TINTA, grosor: .6, ...VIDA } }
};

/* El valor de `opacity` que armar.js acepta: de 0.2 a 1, con dos decimales como mucho */
export const opacidadCss = (porciento) => t(Math.min(100, Math.max(OPACIDAD_MIN, Math.round(porciento))) / 100);

/* Una forma con su relleno y su borde. Con los dos y el mismo color, una sola; si no, dos (cada una con su `color`). */
function pintar(tag, attrs, f, trazoMm, union = 'round') {
  const conRelleno = !!f.relleno, conBorde = !!f.borde && trazoMm > 0;
  const linea = { 'stroke-width': t(trazoMm), 'stroke-linejoin': union };
  if (conRelleno && conBorde && f.relleno === f.borde) return [el(tag, '', [], { ...attrs, fill: 'currentColor', stroke: 'currentColor', ...linea }, { color: f.relleno })];
  const salida = [];
  if (conRelleno) salida.push(el(tag, '', [], { ...attrs, fill: 'currentColor', stroke: 'none' }, { color: f.relleno }));
  if (conBorde) salida.push(el(tag, '', [], { ...attrs, fill: 'none', stroke: 'currentColor', ...linea }, { color: f.borde }));
  return salida;
}

const puntos = (lista) => lista.map(([x, y]) => `${t(x)},${t(y)}`).join(' ');
const distancia = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;

/* Un triangulo con las esquinas redondeadas: en cada vertice, una curva que entra y sale a `r` de distancia */
function trazadoRedondeado(v, r) {
  const n = v.length, d = [];
  for (let i = 0; i < n; i++) {
    const ant = v[(i + n - 1) % n], cur = v[i], sig = v[(i + 1) % n];
    const la = distancia(cur, ant), ls = distancia(cur, sig), k = Math.min(r, la / 2, ls / 2);
    const a = [cur[0] + ((ant[0] - cur[0]) / la) * k, cur[1] + ((ant[1] - cur[1]) / la) * k];
    const b = [cur[0] + ((sig[0] - cur[0]) / ls) * k, cur[1] + ((sig[1] - cur[1]) / ls) * k];
    d.push(`${i ? 'L' : 'M'}${t(a[0])} ${t(a[1])}Q${t(cur[0])} ${t(cur[1])} ${t(b[0])} ${t(b[1])}`);
  }
  return `${d.join('')}Z`;
}

/* La flecha de bloque, apuntando a la derecha (para otra direccion se gira la caja). Cabeza y cuerpo guardan proporcion. */
function puntosDeFlecha(x0, y0, x1, y1, doble) {
  const w = x1 - x0, h = y1 - y0, cy = y0 + h / 2;
  const cabeza = Math.min(h * .6, w / (doble ? 2.2 : 1.6), w * .5), grueso = h * .4;
  const a = cy - grueso / 2, b = cy + grueso / 2;
  return doble
    ? [[x0, cy], [x0 + cabeza, y0], [x0 + cabeza, a], [x1 - cabeza, a], [x1 - cabeza, y0], [x1, cy], [x1 - cabeza, y1], [x1 - cabeza, b], [x0 + cabeza, b], [x0 + cabeza, y1]]
    : [[x0, a], [x1 - cabeza, a], [x1 - cabeza, y0], [x1, cy], [x1 - cabeza, y1], [x1 - cabeza, b], [x0, b]];
}

/* El plano cartesiano: ejes con punta, y una cuadricula de cuadros iguales. Sin numeros: el dibujo no lleva texto. */
function planoEn(W, H, f, grosor) {
  const salida = [];
  /* Los ejes nunca pasan de un octavo de la caja: asi ni el trazo ni las puntas se salen de ella */
  const g = Math.min(grosor, Math.min(W, H) / 8);
  if (f.relleno) salida.push(el('rect', '', [], { x: '0', y: '0', width: t(W), height: t(H), fill: 'currentColor', stroke: 'none' }, { color: f.relleno }));
  if (!f.borde || g <= 0) return salida;
  const color = { color: f.borde };
  const tope = Math.min(W, H);
  const punta = Math.min(Math.max(g * 4, 2.5), tope / 6), ala = punta * .45;
  const borde = Math.max(ala, g / 2);
  const v = f.variante;
  /* El origen y de que lados hay punta (izquierda, arriba, abajo; la derecha y arriba siempre) */
  const completo = v === 'completo', sup = v === 'superior', der = v === 'derecha';
  const ox = completo || sup ? W / 2 : borde, oy = completo || der ? H / 2 : H - borde;
  const puntaIzq = completo || sup, puntaAbajo = completo || der;
  const xa = puntaIzq ? punta * .8 : ox - g / 2, xb = W - punta * .8, ya = punta * .8, yb = puntaAbajo ? H - punta * .8 : oy + g / 2;
  /* La cuadricula: cuadros de lado `u`, tantos como pide `celdas` en el lado mas corto de lo que sale del origen */
  if (f.cuadricula) {
    const u = Math.min(W - ox - punta, oy - punta) / f.celdas;
    if (u > 0.05) {
      const izq = puntaIzq ? punta : ox, abajo = puntaAbajo ? H - punta : oy;
      const d = [];
      for (let k = -RAYAS_MAX; k <= RAYAS_MAX; k++) {
        if (!k) continue;
        const x = ox + k * u, y = oy + k * u;
        if (x > izq && x < W - punta) d.push(`M${t(x)} ${t(punta)}L${t(x)} ${t(abajo)}`);
        if (y > punta && y < abajo) d.push(`M${t(izq)} ${t(y)}L${t(W - punta)} ${t(y)}`);
      }
      if (d.length) salida.push(el('path', '', [], { d: d.join(''), fill: 'none', stroke: 'currentColor', 'stroke-width': t(Math.max(g * .5, .1)) }, { ...color, opacity: OPACIDAD_CUADRICULA }));
    }
  }
  salida.push(el('line', '', [], { x1: t(xa), y1: t(oy), x2: t(xb), y2: t(oy), fill: 'none', stroke: 'currentColor', 'stroke-width': t(g) }, color));
  salida.push(el('line', '', [], { x1: t(ox), y1: t(ya), x2: t(ox), y2: t(yb), fill: 'none', stroke: 'currentColor', 'stroke-width': t(g) }, color));
  const cabezas = [[[W, oy], [W - punta, oy - ala], [W - punta, oy + ala]], [[ox, 0], [ox - ala, punta], [ox + ala, punta]]];
  if (puntaIzq) cabezas.push([[0, oy], [punta, oy - ala], [punta, oy + ala]]);
  if (puntaAbajo) cabezas.push([[ox, H], [ox - ala, H - punta], [ox + ala, H - punta]]);
  salida.push(el('path', '', [], { d: cabezas.map((c) => `M${t(c[0][0])} ${t(c[0][1])}L${t(c[1][0])} ${t(c[1][1])}L${t(c[2][0])} ${t(c[2][1])}Z`).join(''), fill: 'currentColor', stroke: 'none' }, color));
  return salida;
}

/* El arbol neutro de la figura `o` (los datos de un objeto de pagina libre) sobre una hoja de `mm` = { anchoMm, altoMm }.
   Sin medida de hoja, la de siempre: 148 × 210. */
export function arbolFigura(o, mm) {
  const x = o && typeof o === 'object' ? o : {}, f = limpiarFigura(x), p = mm && typeof mm === 'object' ? mm : {};
  const W = Math.max(.1, num(x.w, .5, 300, 40) * medida(p.anchoMm, 148) / 100), H = Math.max(.1, num(x.h, .5, 300, 30) * medida(p.altoMm, 210) / 100);
  const svg = (hijos) => ({ tag: 'svg', clase: '', hijos, attrs: { viewBox: `0 0 ${t(W)} ${t(H)}`, 'aria-hidden': 'true', focusable: 'false' }, estilo: {} });
  const conBorde = !!f.borde && f.grosor > 0;
  /* El borde se mete la mitad de su grosor: nunca pasa de la caja, ni en una figura diminuta */
  /* Y una holgura de 0,12 mm: un borde pegado justo al canto de su caja se recorta un pelo al imprimir */
  const medio = conBorde ? Math.max(0, Math.min(f.grosor / 2, Math.min(W, H) / 2 - .01)) : 0, trazo = medio * 2;
  const s = conBorde ? Math.min(medio + HOLGURA, Math.min(W, H) / 2 - .005) : 0;
  const x0 = s, y0 = s, x1 = W - s, y1 = H - s, ancho = x1 - x0, alto = y1 - y0;
  let hijos;
  if (f.forma === 'plano') hijos = planoEn(W, H, f, f.grosor);
  else if (f.forma === 'elipse') hijos = pintar('ellipse', { cx: t(W / 2), cy: t(H / 2), rx: t(ancho / 2), ry: t(alto / 2) }, f, trazo);
  else if (f.forma === 'triangulo') {
    const v = f.variante === 'rectangulo' ? [[x0, y0], [x0, y1], [x1, y1]] : [[W / 2, y0], [x1, y1], [x0, y1]];
    hijos = f.radio > 0 ? pintar('path', { d: trazadoRedondeado(v, f.radio) }, f, trazo) : pintar('polygon', { points: puntos(v) }, f, trazo);
  } else if (f.forma === 'flecha') hijos = pintar('polygon', { points: puntos(puntosDeFlecha(x0, y0, x1, y1, f.variante === 'doble')) }, f, trazo);
  else {
    const r = Math.min(f.radio, ancho / 2, alto / 2);
    hijos = pintar('rect', { x: t(x0), y: t(y0), width: t(ancho), height: t(alto), ...(r > 0 ? { rx: t(r), ry: t(r) } : {}) }, f, trazo, r > 0 ? 'round' : 'miter');
  }
  return svg(hijos);
}
