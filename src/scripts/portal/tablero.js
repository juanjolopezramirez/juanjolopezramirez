/* LO PURO DEL TABLERO (panel/Tablero.js lo usa; todo es texto y numeros, sin pagina ni red: por eso
   se prueba entero en tools/test-portal.mjs).

     · las SEMANAS: el tablero se revisa una vez por semana; cada semana es su LUNES (con la fecha local de
       quien la usa, no la de Londres: si no, de noche el domingo cambiaria de semana);
     · la RUEDA: la forma de cada uno de los 60 dominios (un sector de anillo), calculada aqui y no
       dibujada a mano;
     · lo que se manda a la base (`validarLectura`, `validarPiedra`): el servidor lo vuelve a comprobar
       todo (supabase/009_tablero.sql); esto es cortesia, no seguridad. */
import { limpiar } from './estado.js';
import { EJES, IDS_DOMINIOS, INICIO_EJE, RUEDA } from '../../data/portal/tablero.js';

/* Los limites de la base (supabase/009_tablero.sql): una semana fuera de ellos jamas se podria guardar */
export const FECHA_MIN = '2020-01-06';
export const FECHA_MAX = '2100-01-01';
export const NOTA_MAX = 500;
export const PIEDRA_MAX = 80;
export const SEMANAS_HISTORIA = 12;

/* ---- Semanas ------------------------------------------------------------------- */
const dos = (n) => String(n).padStart(2, '0');
/* «2026-10-30» de una fecha (local) */
export const fechaLocal = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
/* De «2026-10-30» a una fecha al mediodia (el mediodia esquiva los cambios de hora) */
export const deIso = (iso) => { const [a, m, d] = String(iso).split('-').map(Number); return new Date(a, m - 1, d, 12); };
export const esIso = (iso) => typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) && fechaLocal(deIso(iso)) === iso;
/* El lunes de la semana de `iso` (la semana va de lunes a domingo) */
export function lunesDe(iso) {
  const d = deIso(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return fechaLocal(d);
}
export const semanaDe = (ahora = new Date()) => lunesDe(fechaLocal(ahora));
export function sumarSemanas(iso, n) {
  const d = deIso(iso);
  d.setDate(d.getDate() + 7 * n);
  return fechaLocal(d);
}
export const esLunes = (iso) => esIso(iso) && deIso(iso).getDay() === 1;

/* ---- La rueda ------------------------------------------------------------------ */
const rad = (g) => ((g - 90) * Math.PI) / 180;      // 0° = arriba, en el sentido del reloj
const punto = (r, g) => [RUEDA.centro + r * Math.cos(rad(g)), RUEDA.centro + r * Math.sin(rad(g))];
const n1 = (v) => String(Math.round(v * 10) / 10);

/* Un sector de anillo entre dos radios y dos angulos (en grados) */
export function sector(r0, r1, g0, g1) {
  const [x0, y0] = punto(r1, g0), [x1, y1] = punto(r1, g1), [x2, y2] = punto(r0, g1), [x3, y3] = punto(r0, g0);
  const grande = g1 - g0 > 180 ? 1 : 0;
  return `M${n1(x0)} ${n1(y0)}A${r1} ${r1} 0 ${grande} 1 ${n1(x1)} ${n1(y1)}L${n1(x2)} ${n1(y2)}A${r0} ${r0} 0 ${grande} 0 ${n1(x3)} ${n1(y3)}Z`;
}

/* Los 60 sectores, en el orden del catalogo: { id, d, eje, area, color, anillo (0..4), mx, my (su centro, para leer) } */
export function sectoresDeLaRueda() {
  const { hueco, borde, separacion, anillos } = RUEDA;
  const ancho = (borde - hueco) / anillos;
  const salida = [];
  for (const eje of EJES) {
    eje.areas.forEach((area, i) => {
      const g0 = INICIO_EJE[eje.id] + i * 30 + 0.8, g1 = INICIO_EJE[eje.id] + (i + 1) * 30 - 0.8;
      area.dominios.forEach((dom, k) => {
        const r0 = hueco + k * ancho + (k === 0 ? 0 : separacion / 2), r1 = hueco + (k + 1) * ancho - (k === anillos - 1 ? 0 : separacion / 2);
        const [mx, my] = punto((r0 + r1) / 2, (g0 + g1) / 2);
        salida.push({ id: dom.id, d: sector(r0, r1, g0, g1), eje: eje.id, area: area.id, color: eje.color, anillo: k, mx, my });
      });
    });
  }
  return salida;
}

/* ---- Lo que se manda ----------------------------------------------------------- */
/** @returns {{ok: true, valor: {semana, clave, cargue, nota}} | {error: string}} */
export function validarLectura({ semana, clave, cargue, nota }) {
  if (!esLunes(semana) || semana < FECHA_MIN || semana > FECHA_MAX) return { error: 'tableroSemana' };
  if (!IDS_DOMINIOS.includes(clave)) return { error: 'generico' };
  if (typeof cargue !== 'boolean') return { error: 'generico' };
  return { ok: true, valor: { semana, clave, cargue, nota: limpiar(nota == null ? '' : nota, NOTA_MAX) } };
}
export function validarPiedra({ eje, piedra, desde }) {
  if (!EJES.some((e) => e.id === eje)) return { error: 'generico' };
  const texto = limpiar(typeof piedra === 'string' ? piedra : '', PIEDRA_MAX);
  if (!texto) return { error: 'tableroPiedraVacia' };
  if (!esIso(desde) || desde < FECHA_MIN || desde > FECHA_MAX) return { error: 'tableroSemana' };
  return { ok: true, valor: { eje, piedra: texto, desde } };
}

/* ---- Lo que se cuenta ---------------------------------------------------------- */
/* De las lecturas de una semana ({clave, cargue}), por eje: cuantos cargaron, cuantos no, cuantos sin revisar */
export function resumen(lecturas) {
  const por = new Map((lecturas || []).map((l) => [l.clave, l.cargue]));
  const salida = {};
  for (const eje of EJES) {
    const doms = eje.areas.flatMap((a) => a.dominios);
    const cargue = doms.filter((d) => por.get(d.id) === true).length;
    const noCargue = doms.filter((d) => por.get(d.id) === false).length;
    salida[eje.id] = { cargue, noCargue, sinRevisar: doms.length - cargue - noCargue, total: doms.length };
  }
  const todos = Object.values(salida);
  salida.todo = todos.reduce((s, x) => ({ cargue: s.cargue + x.cargue, noCargue: s.noCargue + x.noCargue, sinRevisar: s.sinRevisar + x.sinRevisar, total: s.total + x.total }), { cargue: 0, noCargue: 0, sinRevisar: 0, total: 0 });
  return salida;
}
/* La piedra angular vigente de cada eje (la de `desde` mas reciente, sin pasarse de hoy), y las anteriores */
export function piedrasDe(filas, hoy) {
  const salida = {};
  for (const eje of EJES) {
    const suyas = (filas || []).filter((f) => f.eje === eje.id && f.desde <= hoy).sort((a, b) => (a.desde < b.desde ? 1 : a.desde > b.desde ? -1 : 0));
    salida[eje.id] = { actual: suyas[0] || null, anteriores: suyas.slice(1) };
  }
  return salida;
}
