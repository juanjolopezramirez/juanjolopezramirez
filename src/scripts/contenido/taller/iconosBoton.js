/* LOS ICONOS DE LOS BOTONES DEL LIBRO. Una coleccion propia, dibujada en una rejilla de 24 × 24 con trazo de 2,
   y el icono que suba el fundador (SvgSubido.js lo convierte). Nunca se guarda SVG escrito: solo formas con sus
   numeros, y cada lectura las vuelve a revisar aqui. El color es siempre el del texto del boton (currentColor).

   Se dibuja a 1,15 veces la letra del boton: crece y se achica con el. */

/* Cada forma: { t, ...sus numeros, relleno, trazo, punta, union, transform } */
export const FORMAS = ['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'];
export const NUMEROS = { path: [], circle: ['cx', 'cy', 'r'], ellipse: ['cx', 'cy', 'rx', 'ry'], rect: ['x', 'y', 'width', 'height', 'rx', 'ry'], line: ['x1', 'y1', 'x2', 'y2'], polyline: [], polygon: [] };
const OPCIONALES = new Set(['rx', 'ry']);
export const FORMAS_MAX = 64;
export const D_MAX = 10000;          // letras de trazado en todo el icono
export const PUNTOS_MAX = 4000;
export const LADOS = ['izq', 'der', 'solo'];

export const RE_D = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s+-]+$/;
export const RE_PUNTOS = /^[0-9eE.,\s+-]+$/;
/* Sin espacios que puedan caer en dos lugares a la vez: la otra forma tardaba minutos con un texto armado */
export const RE_TRANSFORM = /^\s*(?:(?:matrix|translate|scale|rotate)\([0-9eE.,\s+-]+\)\s*)+$/;
export const REGLAS = ['nonzero', 'evenodd'];
const PUNTAS = ['round', 'butt', 'square'], UNIONES = ['round', 'miter', 'bevel'];
const numero = (v) => (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 100000 ? Math.round(v * 1000) / 1000 : null);

/* La coleccion: lineas redondeadas, como la letra del portal */
const linea = (...d) => d.map((x) => ({ t: 'path', d: x, relleno: false, trazo: 2, punta: 'round', union: 'round' }));
const forma = (t, n) => ({ t, ...n, relleno: false, trazo: 2, punta: 'round', union: 'round' });
const caja = [0, 0, 24, 24];
export const ICONOS = {
  copiar: { caja, formas: [forma('rect', { x: 8, y: 8, width: 12, height: 12, rx: 2 }), ...linea('M4 16V6a2 2 0 0 1 2-2h10')] },
  enlace: { caja, formas: linea('M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5', 'M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.5-1.5') },
  descargar: { caja, formas: linea('M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14') },
  escuchar: { caja, formas: linea('M4 9h4l5-4v14l-5-4H4z', 'M16.5 9a4 4 0 0 1 0 6', 'M19.5 6a8 8 0 0 1 0 12') },
  video: { caja, formas: [forma('rect', { x: 3, y: 6, width: 13, height: 12, rx: 2 }), ...linea('M16 10l5-3v10l-5-3z')] },
  pagina: { caja, formas: linea('M6 3h8l4 4v14H6z', 'M14 3v4h4', 'M9 14h6', 'M12.5 11l3 3-3 3') },
  libro: { caja, formas: linea('M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z', 'M12 6v14') },
  volver: { caja, formas: linea('M9 14L4 9l5-5', 'M4 9h10a6 6 0 0 1 0 12h-3') },
  flecha: { caja, formas: linea('M5 12h14', 'M13 6l6 6-6 6') },
  quiz: { caja, formas: [forma('circle', { cx: 12, cy: 12, r: 9 }), ...linea('M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14', 'M12 17.5v.01')] }
};
export const NOMBRES_ICONO = Object.keys(ICONOS);

function formaLimpia(f) {
  if (!f || typeof f !== 'object' || !FORMAS.includes(f.t)) return null;
  const o = { t: f.t };
  for (const k of NUMEROS[f.t]) {
    const v = numero(f[k]);
    if (v === null) { if (OPCIONALES.has(k) && f[k] === undefined) continue; return null; }
    o[k] = v;
  }
  if (f.t === 'path') { if (typeof f.d !== 'string' || f.d.length > D_MAX || !f.d.trim() || !RE_D.test(f.d)) return null; o.d = f.d.trim(); }
  if (f.t === 'polyline' || f.t === 'polygon') { if (typeof f.points !== 'string' || f.points.length > PUNTOS_MAX || !RE_PUNTOS.test(f.points)) return null; o.points = f.points.trim(); }
  o.relleno = f.relleno === true;
  const trazo = numero(f.trazo);
  o.trazo = trazo !== null && trazo > 0 && trazo <= 50 ? trazo : 0;
  if (!o.relleno && !o.trazo) return null;           // invisible: no se guarda
  if (o.trazo) { o.punta = PUNTAS.includes(f.punta) ? f.punta : 'butt'; o.union = UNIONES.includes(f.union) ? f.union : 'miter'; }
  if (o.relleno && f.regla === 'evenodd') o.regla = 'evenodd';
  /* Una forma con un giro o un corrimiento que no se puede leer quedaria en otro lugar: mejor no va */
  if (f.transform !== undefined) {
    if (typeof f.transform !== 'string' || f.transform.length > 300 || !RE_TRANSFORM.test(f.transform)) return null;
    o.transform = f.transform.trim();
  }
  return o;
}

/* Un icono propio: su caja y sus formas, todo revisado. null si no queda nada que dibujar. */
export function iconoPropio(v) {
  if (!v || typeof v !== 'object' || !Array.isArray(v.caja) || v.caja.length !== 4 || !Array.isArray(v.formas)) return null;
  const c = v.caja.map(numero);
  if (c.some((x) => x === null) || c[2] <= 0 || c[3] <= 0) return null;
  const formas = [];
  let letras = 0;
  for (const f of v.formas.slice(0, FORMAS_MAX)) {
    const o = formaLimpia(f);
    if (!o) continue;
    letras += (o.d || o.points || '').length;
    if (letras > D_MAX) return null;
    formas.push(o);
  }
  return formas.length ? { caja: c, formas } : null;
}

/* Lo que guarda un boton: { nombre } de la coleccion o { propio } subido. Cualquier otra cosa, sin icono. */
export function limpiarIcono(v) {
  if (!v || typeof v !== 'object') return null;
  if (typeof v.nombre === 'string') return Object.hasOwn(ICONOS, v.nombre) ? { nombre: v.nombre } : null;
  const p = iconoPropio(v.propio);
  return p ? { propio: p } : null;
}

const texto = (n) => String(n);
function formaAArbol(f) {
  const attrs = {};
  for (const k of NUMEROS[f.t]) if (f[k] !== undefined) attrs[k] = texto(f[k]);
  if (f.d) attrs.d = f.d;
  if (f.points) attrs.points = f.points;
  attrs.fill = f.relleno ? 'currentColor' : 'none';
  if (f.regla) attrs['fill-rule'] = f.regla;
  attrs.stroke = f.trazo ? 'currentColor' : 'none';
  if (f.trazo) { attrs['stroke-width'] = texto(f.trazo); attrs['stroke-linecap'] = f.punta; attrs['stroke-linejoin'] = f.union; }
  if (f.transform) attrs.transform = f.transform;
  return { tag: f.t, clase: '', hijos: [], attrs, estilo: {} };
}

/* El arbol neutro { tag, clase, attrs, hijos } del icono: lo dibujan igual la mesa y el PDF. El lector de
   pantalla lo salta: el nombre del boton es su texto. */
export function arbolIcono(icono) {
  const i = limpiarIcono(icono);
  const dibujo = i && (i.nombre ? ICONOS[i.nombre] : i.propio);
  if (!dibujo) return null;
  return { tag: 'svg', clase: 'boton__icono', hijos: dibujo.formas.map(formaAArbol), attrs: { viewBox: dibujo.caja.join(' '), 'aria-hidden': 'true', focusable: 'false' }, estilo: {} };
}
