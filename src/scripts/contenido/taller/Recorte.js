/* EL RECORTE DE UNA IMAGEN, sin pantalla (la ventana es portal/panel/dev/RecorteImagen.js). Un marco con la forma del
   lomo (`aspecto` = ancho / alto, fija) sobre una imagen de `w` x `h` px, ya de pie. El marco se guarda NORMALIZADO:
   { x, y, w, h } son partes de la imagen (0 a 1), asi no depende del tamaño con que se pinta en la ventana.

   Con la forma fija: w * img.w / (h * img.h) = aspecto. El marco mas grande es el que llena la imagen por un lado
   (como «recortar al centro»); el mas chico, ZOOM_MAX veces menor. Nunca se sale de la imagen.

   Lo que sale (`encajeDeRecorte`) tiene la misma forma que `encajeDeLomo` (LomoLibro.js): { modo, s, d } en px, para
   dibujarlo igual. `seVeBorrosa` avisa si el PNG final necesita mas pixeles de los que tiene la parte elegida. */

export const ZOOM_MAX = 8;
export const BORROSA = 1.1;           // se agranda mas de un 10 %: se nota
export const ENCAJA = 0.04;           // la misma tolerancia del lomo: menos de un 4 % de diferencia, no hace falta recortar
const LADO_MIN_PX = 4;

const num = (x) => typeof x === 'number' && Number.isFinite(x);
const medida = (img) => !!img && num(img.w) && num(img.h) && img.w > 0 && img.h > 0;
const entre = (x, a, b) => Math.min(b, Math.max(a, x));

/* La parte de la imagen que llena el marco mas grande: { w, h } normalizados (uno de los dos es 1) */
export function mayorRecorte(img, aspecto) {
  if (!medida(img) || !(aspecto > 0) || !num(aspecto)) return null;
  const forma = img.w / img.h;
  return forma > aspecto ? { w: aspecto / forma, h: 1 } : { w: 1, h: forma / aspecto };
}

/* El mas chico: ZOOM_MAX veces menor que el mas grande, y nunca menos de LADO_MIN_PX px de lado */
function menorRecorte(img, aspecto) {
  const g = mayorRecorte(img, aspecto);
  let w = g.w / ZOOM_MAX;
  const minW = LADO_MIN_PX / img.w, minH = LADO_MIN_PX / img.h;
  w = Math.max(w, minW, minH * (aspecto * img.h) / img.w);
  return Math.min(g.w, w);
}

/* ¿La imagen ya tiene la forma (menos de un 4 % de diferencia)? Entonces no hace falta recortar */
export function yaEncaja(img, aspecto) {
  if (!medida(img) || !(aspecto > 0)) return false;
  return Math.abs((img.w / img.h) / aspecto - 1) <= ENCAJA;
}

/* El marco mas grande, centrado */
export function recorteInicial(img, aspecto) {
  const g = mayorRecorte(img, aspecto);
  if (!g) return null;
  return { x: (1 - g.w) / 2, y: (1 - g.h) / 2, w: g.w, h: g.h };
}

/* Lo deja dentro: el tamaño entre el menor y el mayor (con su forma) y la posicion dentro de la imagen */
export function limitarRecorte(r, img, aspecto) {
  const g = mayorRecorte(img, aspecto);
  if (!g || !r) return null;
  const w = entre(num(r.w) ? r.w : g.w, menorRecorte(img, aspecto), g.w);
  const h = (w * img.w) / (aspecto * img.h);
  const x = entre(num(r.x) ? r.x : 0, 0, Math.max(0, 1 - w));
  const y = entre(num(r.y) ? r.y : 0, 0, Math.max(0, 1 - h));
  return { x, y, w, h };
}

/* Moverlo `dx`, `dy` (partes de la imagen) */
export function moverRecorte(r, dx, dy, img, aspecto) {
  if (!r) return null;
  return limitarRecorte({ ...r, x: r.x + (num(dx) ? dx : 0), y: r.y + (num(dy) ? dy : 0) }, img, aspecto);
}

/* Acercar (`factor` > 1: el marco se achica) o alejar (< 1), dejando quieto el punto `centro` ({ x, y } normalizados;
   sin el, el centro del marco). Asi, con la rueda o con dos dedos, lo que esta bajo el puntero no se corre. */
export function escalarRecorte(r, factor, img, aspecto, centro) {
  if (!r || !(factor > 0) || !num(factor)) return r ? limitarRecorte(r, img, aspecto) : null;
  const c = centro && num(centro.x) && num(centro.y) ? centro : { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  const nuevo = limitarRecorte({ x: 0, y: 0, w: r.w / factor }, img, aspecto);
  if (!nuevo) return null;
  const kx = r.w > 0 ? (c.x - r.x) / r.w : 0.5, ky = r.h > 0 ? (c.y - r.y) / r.h : 0.5;
  return limitarRecorte({ x: c.x - kx * nuevo.w, y: c.y - ky * nuevo.h, w: nuevo.w }, img, aspecto);
}

/* Cuanto esta acercado: 1 = el marco mas grande */
export function zoomDe(r, img, aspecto) {
  const g = mayorRecorte(img, aspecto);
  return g && r && r.w > 0 ? g.w / r.w : 1;
}

/* Para dibujarlo: la parte de la imagen `s` (px) en todo el PNG `d` de `salida.ancho` x `salida.alto` */
export function encajeDeRecorte(r, img, salida) {
  if (!r || !medida(img) || !salida || !(salida.ancho > 0) || !(salida.alto > 0)) return null;
  return {
    modo: 'recortar',
    s: { x: r.x * img.w, y: r.y * img.h, w: r.w * img.w, h: r.h * img.h },
    d: { x: 0, y: 0, w: salida.ancho, h: salida.alto }
  };
}

/* Cuantas veces se agranda la parte elegida para llenar el PNG (> 1: se estira en pixeles; mas de BORROSA, se nota) */
export function ampliacionDe(r, img, salida) {
  const e = encajeDeRecorte(r, img, salida);
  return e && e.s.h > 0 ? e.d.h / e.s.h : 0;
}
export const seVeBorrosa = (r, img, salida) => ampliacionDe(r, img, salida) > BORROSA;
