/* EL ASPECTO DE UN BOTON y su lugar suelto. PURO: la mesa, la hoja de impresion y las pruebas usan lo mismo.

   Nunca se guarda CSS escrito: solo numeros con tope, colores de colorValido y palabras de listas fijas. De aqui
   sale el estilo (un mapa propiedad → valor) que armar.js vuelve a revisar valor por valor antes de ponerlo.
   Un boton sin `aspecto` ni `suelto` sale EXACTAMENTE como siempre: lo viejo no cambia.

   - aspecto: { estilo, borde 0–8 px, bordeColor, linea, radio (0–40 px | 'pildora' | null), negrita, opacidad 20–100,
     sombra { tipo ninguna|suave|dura, auto, color } }. En «dura» (el borde inferior de Duolingo) el color se calcula
     del relleno (`auto`) o es el que elige el fundador.
   - suelto: { dx, dy, rot } en mm desde el lugar de su parrafo (donde estaria el boton en su renglon), y grados. */
import { objeto } from '../comun.js';
import { colorValido } from './marcas.js';

export const ESTILOS = ['relleno', 'contorno', 'texto', 'pildora', 'duolingo'];
export const LINEAS = ['solido', 'punteado', 'rayado'];
export const SOMBRAS = ['ninguna', 'suave', 'dura'];
const CSS_LINEA = { solido: 'solid', punteado: 'dotted', rayado: 'dashed' };
export const BORDE_MAX = 8;
export const RADIO_MAX = 40;
export const OPACIDAD_MIN = 20;
export const PILDORA = 'pildora';
export const BORDE_DURO_PX = 5;                 // el escalon de abajo, como el de Duolingo
export const SUELTO_MAX_MM = 400;               // tope de los datos; el real lo pone la hoja (acotarSuelto)
export const VERDE_DUOLINGO = '#58cc02';

/* Lo que fija cada estilo al elegirlo: el panel lo escribe en los campos, y de ahi en adelante cada campo manda */
export const PRESETS = {
  relleno: { borde: 0, radio: null, negrita: false, sombra: 'ninguna' },
  contorno: { borde: 2, radio: null, negrita: false, sombra: 'ninguna' },
  texto: { borde: 0, radio: null, negrita: false, sombra: 'ninguna' },
  pildora: { borde: 0, radio: PILDORA, negrita: false, sombra: 'ninguna' },
  duolingo: { borde: 0, radio: 8, negrita: true, sombra: 'dura' }
};

const num = (v, min, max, siNo) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : siNo);
const dec = (v, min, max, siNo) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v * 10) / 10)) : siNo);

/* ---- Colores: un escalon mas oscuro, con el mismo tono ---- */
const rgbDe = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
function aHsl(hex) {
  const [r, g, b] = rgbDe(hex).map((c) => c / 255), max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function deHsl(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return `#${[r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')}`;
}
/* El color del borde de abajo, calculado del relleno: el mismo tono y un 20 % menos de luz. Un relleno casi negro no
   puede oscurecerse mas: ahi el escalon sale un poco mas claro, y se sigue viendo. */
export function bordeInferiorDe(relleno) {
  const c = colorValido(relleno);
  if (!c) return '';
  const [h, s, l] = aHsl(c);
  return deHsl(h, s, l >= .22 ? l * .8 : Math.min(1, l + .14));
}

/* ---- Limpiar ---- */
export const sombraLimpia = (s) => {
  const o = objeto(s);
  return { tipo: SOMBRAS.includes(o.tipo) ? o.tipo : 'ninguna', auto: o.auto !== false, color: colorValido(o.color) };
};

/* null = el boton de siempre. Cualquier objeto da un aspecto completo. */
export function limpiarAspecto(a) {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return null;
  const estilo = ESTILOS.includes(a.estilo) ? a.estilo : 'relleno', p = PRESETS[estilo];
  return {
    estilo,
    borde: num(a.borde, 0, BORDE_MAX, p.borde),
    bordeColor: colorValido(a.bordeColor),
    linea: LINEAS.includes(a.linea) ? a.linea : 'solido',
    radio: a.radio === PILDORA ? PILDORA : num(a.radio, 0, RADIO_MAX, null),
    negrita: a.negrita === true,
    opacidad: num(a.opacidad, OPACIDAD_MIN, 100, 100),
    sombra: sombraLimpia(a.sombra)
  };
}

/* Un estilo recien elegido: sus valores de partida, sin perder lo que ya se eligio de color ni de linea */
export function conEstilo(aspecto, estilo) {
  const base = limpiarAspecto(aspecto) || limpiarAspecto({}), p = PRESETS[ESTILOS.includes(estilo) ? estilo : 'relleno'];
  return { ...base, estilo: ESTILOS.includes(estilo) ? estilo : 'relleno', borde: p.borde, radio: p.radio, negrita: p.negrita, sombra: { ...base.sombra, tipo: p.sombra } };
}

export function limpiarSuelto(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
  return { dx: dec(s.dx, -SUELTO_MAX_MM, SUELTO_MAX_MM, 0), dy: dec(s.dy, -SUELTO_MAX_MM, SUELTO_MAX_MM, 0), rot: dec(s.rot, -360, 360, 0) };
}

/* Que no se salga de su hoja. `caja`: el tamaño del boton { w, h } y `lim`: lo que se le permite, medido desde el
   punto de su parrafo { x0, x1, y0, y1 } (todo en mm). El giro se cuenta: se mira el rectangulo que ocupa ya girado. */
export function acotarSuelto(s, caja, lim) {
  const t = limpiarSuelto(s) || { dx: 0, dy: 0, rot: 0 }, rad = (t.rot * Math.PI) / 180;
  const w = Math.max(0, Number(caja.w) || 0), h = Math.max(0, Number(caja.h) || 0);
  const hx = (Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))) / 2, hy = (Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))) / 2;
  /* El centro del boton queda en (dx + w/2, dy + h/2) */
  const cx = Math.max(lim.x0 + hx, Math.min(lim.x1 - hx, t.dx + w / 2)), cy = Math.max(lim.y0 + hy, Math.min(lim.y1 - hy, t.dy + h / 2));
  /* Si la hoja es mas chica que el boton, manda el lado de arriba/izquierdo */
  return limpiarSuelto({ dx: cx - w / 2, dy: cy - h / 2, rot: t.rot });
}

/* ---- El estilo: mapa propiedad → valor, ya medido ---- */
const px = (n) => `${n}px`;
export const cssSombra = ({ x, y, blur, color }) => `${x}px ${y}px ${blur}px ${color}`;

/* Los numeros de la sombra de un boton, con tope: {x, y, blur, color}. `o`: el boton (fondo, color y aspecto). */
export function sombraDe(o) {
  const a = o && o.aspecto, s = a && a.sombra;
  if (!s || s.tipo === 'ninguna') return null;
  if (s.tipo === 'suave') return { x: 0, y: 3, blur: 10, color: '#00000040' };
  const base = o.fondo || o.color || '', auto = bordeInferiorDe(base);
  const color = s.auto ? auto : s.color || auto;
  return { x: 0, y: BORDE_DURO_PX, blur: 0, color: color || '#00000073' };
}

export function estiloAspecto(o) {
  const a = o && o.aspecto, e = {};
  if (!a) return e;
  if (a.borde > 0) {
    e['border-width'] = px(a.borde);
    e['border-style'] = CSS_LINEA[a.linea];
    e['border-color'] = a.bordeColor || 'currentcolor';
  }
  if (a.radio === PILDORA) e['border-radius'] = '999px';
  else if (typeof a.radio === 'number') e['border-radius'] = px(a.radio);
  const s = sombraDe(o);
  if (s) e['box-shadow'] = cssSombra(s);
  if (a.negrita) e['font-weight'] = '700';
  if (a.opacidad < 100) e.opacity = String(a.opacidad / 100);
  return e;
}

/* La clase que dice como se pinta: sin relleno (contorno y texto) o el boton «Duolingo» (en la mesa baja al pulsarlo) */
export const claseDeAspecto = (o) => {
  const a = o && o.aspecto;
  if (!a) return '';
  return a.estilo === 'contorno' ? ' boton--hueco boton--contorno' : a.estilo === 'texto' ? ' boton--hueco' : a.estilo === 'duolingo' ? ' boton--duo' : '';
};
export const esHueco = (o) => !!o && !!o.aspecto && (o.aspecto.estilo === 'contorno' || o.aspecto.estilo === 'texto');

/* Un boton suelto: su lugar desde el punto del parrafo. Es solo `transform` (se corre y se gira), nunca `left`/`top`: un
   desplazamiento no cambia el flujo de la pagina, y asi no puede partirse ni saltar a la hoja siguiente por llegar al fondo. */
export const estiloSuelto = (s) => ({ transform: `translate(${s.dx}mm, ${s.dy}mm)${s.rot ? ` rotate(${s.rot}deg)` : ''}` });
