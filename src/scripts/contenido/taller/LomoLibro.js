/* EL LOMO DEL LIBRO, sin pantalla. Lo que el autor elige para el lomo y las tapas de «Ver como libro»: el texto, el
   color, la letra, el grueso, el color de cada tapa y, si quiere, una IMAGEN para el lomo entero. Todo son datos limpios
   (texto corto, colores de colorValido, un numero con tope, una ruta del cajon del libro): nunca CSS escrito. Un libro
   viejo, sin nada de esto, se ve como siempre.

   `estiloDeLomo` da lo que el visor pinta; el grueso automatico (segun las hojas) lo pone quien llama.

   LA IMAGEN DEL LOMO (`imagen: { ruta }`, solo si hay una): un PNG en `taller/<libro>/img/…`, la misma carpeta y la misma
   cuenta que la imagen de arriba del contenido (comun.js → esRutaImagenLibro). Se sube ya hecha a la medida del lomo
   (taller/LomoSubido.js): `planDeLomo` dice si la imagen que llega cabe (se escala) o si el autor debe elegir entre
   rellenar con el color del lomo o recortar al centro; `encajeDeLomo` da donde se dibuja. Nunca se estira. */
import { esRutaImagenLibro, objeto } from '../comun.js';
import { colorValido } from './marcas.js';
import { tintaPara } from './colores.js';
import { textoIndice } from './IndiceLibro.js';
import { lomoDe } from '../../lector/pliegos.js';

export const LOMO_TEXTO_MAX = 40;
export const LOMO_GROSOR = { min: 4, max: 40 };       // mm
export const LOMO_COLOR = '#1f3b2c';                  // el verde de siempre
const TITULO_MAX = 120;

/* `grosor` es 'auto' o milimetros con tope: lo que se pasa se queda en el tope. Un texto que no es numero es 'auto'.
   `imagen` solo esta si trae una ruta que vale (asi un libro sin imagen se guarda igual que antes). */
export function limpiarLomo(v) {
  const o = objeto(v), t = objeto(o.tapas), g = o.grosor, ruta = objeto(o.imagen).ruta;
  const l = {
    texto: textoIndice(o.texto, LOMO_TEXTO_MAX),
    color: colorValido(o.color),
    tinta: colorValido(o.tinta),
    grosor: typeof g === 'number' && Number.isFinite(g) ? Math.round(Math.min(LOMO_GROSOR.max, Math.max(LOMO_GROSOR.min, g)) * 10) / 10 : 'auto',
    tapas: { delante: colorValido(t.delante), detras: colorValido(t.detras) }
  };
  if (esRutaImagenLibro(ruta)) l.imagen = { ruta };
  return l;
}

/* Lo que se pinta. `color` vacio es el verde de siempre (lo pone la hoja de estilo); la letra, sin elegir, se escoge
   sola para que se lea sobre el color (y sin color, la crema de siempre: '' ). Una tapa sin color propio sigue al lomo.
   `ancho`: lo que mide una pagina del libro en px; `pxPorMm`: cuantos px vale un mm de la hoja; `autoPx`: el grueso
   automatico (segun las hojas). (La imagen del lomo no va aqui: es `limpiarLomo(lomo).imagen`.) */
export function estiloDeLomo(lomo, titulo, { autoPx = 12, pxPorMm = 1, ancho = 600 } = {}) {
  const l = limpiarLomo(lomo);
  const grosorPx = l.grosor === 'auto' ? autoPx : Math.round(Math.min(ancho * 0.35, Math.max(6, l.grosor * pxPorMm)));
  return {
    texto: l.texto || textoIndice(titulo, TITULO_MAX),
    color: l.color,
    tinta: l.tinta || (l.color ? tintaPara(l.color) : ''),
    grosorPx,
    delante: l.tapas.delante || l.color,
    detras: l.tapas.detras || l.color
  };
}

/* ---- La imagen del lomo ---- */
export const LOMO_TOLERANCIA = 0.04;      // si la forma de la imagen se aleja menos de un 4 % de la del lomo, se escala
export const LOMO_PPP = 300;              // el PNG del lomo se hace a 300 puntos por pulgada…
export const LOMO_ALTO_MAX = 2400;        // …con un alto de 2400 px como mucho
export const LOMO_ANCHO_MIN = 8;
const r4 = (x) => Math.round(x * 10000) / 10000;

/* El grueso del lomo en mm: el elegido, o el automatico (lomoDe, el mismo que pinta el visor) para `n` hojas de `anchoMm` */
export function grosorDelLomoMm(lomo, n, anchoMm) {
  const l = limpiarLomo(lomo);
  if (typeof l.grosor === 'number') return l.grosor;
  if (!(anchoMm > 0)) return LOMO_GROSOR.min;
  const px = lomoDe(Math.max(1, n || 0), 1000);
  return Math.round((px / 1000) * anchoMm * 10) / 10;
}

/* PLAN para una imagen de `w` x `h` px y un lomo de `grosorMm` x `altoMm`:
     { girar, ancho, alto, forma, objetivo, diferencia, cabe, sobra }  o null si algo no es una medida.
   - `girar`: la imagen vino acostada (mas ancha que alta): se pone de pie (90° a la derecha, el titulo de arriba abajo).
   - `ancho` x `alto`: el PNG que se sube, a la medida del lomo (LOMO_PPP, con LOMO_ALTO_MAX de tope).
   - `cabe`: su forma (ya de pie) se parece a la del lomo en menos de LOMO_TOLERANCIA: se escala sin preguntar. Si no, el
     autor elige: 'rellenar' (entera, con el color del lomo en lo que falta) o 'recortar' (llena el lomo, cortando al centro).
   - `sobra`: 'ancho' si la imagen es mas ancha que el lomo, 'alto' si es mas alta. */
export function planDeLomo(img, { grosorMm, altoMm } = {}) {
  const w0 = Number(img && img.w), h0 = Number(img && img.h);
  if (!(w0 > 0) || !(h0 > 0) || !Number.isFinite(w0) || !Number.isFinite(h0) || !(grosorMm > 0) || !(altoMm > 0)) return null;
  const girar = w0 > h0;
  const w = girar ? h0 : w0, h = girar ? w0 : h0;
  const objetivo = grosorMm / altoMm, forma = w / h;
  const diferencia = Math.abs(forma / objetivo - 1);
  const { ancho, alto } = medidaDelPng(grosorMm, altoMm);
  return { girar, ancho, alto, forma: r4(forma), objetivo: r4(objetivo), diferencia: r4(diferencia), cabe: diferencia <= LOMO_TOLERANCIA, sobra: forma > objetivo ? 'ancho' : 'alto' };
}

/* El PNG del lomo: el alto a LOMO_PPP (con LOMO_ALTO_MAX de tope) y el ancho con la forma del lomo */
function medidaDelPng(grosorMm, altoMm) {
  const alto = Math.max(200, Math.min(LOMO_ALTO_MAX, Math.round((altoMm / 25.4) * LOMO_PPP)));
  return { alto, ancho: Math.max(LOMO_ANCHO_MIN, Math.round(alto * (grosorMm / altoMm))) };
}

/* LA MEDIDA IDEAL de la imagen del lomo, para decirla antes de subirla («Tamaño ideal: 154 × 2400 px (13,5 × 210 mm,
   290 ppp)»): la misma que hace planDeLomo, asi una imagen de esa medida se escala sin preguntar. Cambia con el grueso
   (el elegido, o el automatico segun las `n` hojas). → { ancho, alto, grosorMm, altoMm, ppp } o null.
   `ppp`: los puntos por pulgada de verdad (con el tope de alto, un libro alto queda por debajo de LOMO_PPP). */
export function medidaIdealDeLomo(lomo, n, { anchoMm, altoMm } = {}) {
  if (!(altoMm > 0) || !Number.isFinite(altoMm)) return null;
  const grosorMm = grosorDelLomoMm(lomo, n, anchoMm);
  if (!(grosorMm > 0)) return null;
  const { ancho, alto } = medidaDelPng(grosorMm, altoMm);
  return { ancho, alto, grosorMm, altoMm: Math.round(altoMm * 10) / 10, ppp: Math.round(alto / (altoMm / 25.4)) };
}

/* Un numero de mm como se escribe en español: 13,5 (sin ceros de mas) */
export const mmTexto = (x) => String(Math.round(Number(x) * 10) / 10).replace('.', ',');

/* DONDE SE DIBUJA: de la imagen (ya de pie, `w` x `h`) se toma s{x,y,w,h} y se pone en d{x,y,w,h} del PNG del lomo.
   `modo`: 'escalar' (la imagen entera en el lomo entero: solo cuando `cabe`), 'rellenar' (entera y centrada; lo que falta,
   del color del lomo) o 'recortar' (el lomo lleno, cortando lo que sobra por igual a cada lado). Nunca se estira mas que
   LOMO_TOLERANCIA: un 'escalar' que no cabe se hace 'rellenar'. */
export function encajeDeLomo(plan, modo, { w, h } = {}) {
  if (!plan || !(w > 0) || !(h > 0)) return null;
  const A = plan.ancho, H = plan.alto, todo = { x: 0, y: 0, w, h }, lleno = { x: 0, y: 0, w: A, h: H };
  const m = modo === 'recortar' ? 'recortar' : modo === 'escalar' && plan.cabe ? 'escalar' : 'rellenar';
  if (m === 'escalar') return { modo: m, s: todo, d: lleno };
  if (m === 'recortar') {
    const k = Math.max(A / w, H / h), sw = A / k, sh = H / k;
    return { modo: m, s: { x: (w - sw) / 2, y: (h - sh) / 2, w: sw, h: sh }, d: lleno };
  }
  const k = Math.min(A / w, H / h), dw = w * k, dh = h * k;
  return { modo: m, s: todo, d: { x: (A - dw) / 2, y: (H - dh) / 2, w: dw, h: dh } };
}

/* ¿Es la imagen del lomo de ESTE libro? Una ruta buena (esRutaImagenLibro) y dentro de `taller/<obraId>/img/`. Donde se sabe
   el libro (el Taller, Publicar, «Ver como libro»), solo se pide al cajon una imagen de su propia carpeta. */
export const esRutaDelLomo = (ruta, obraId) => esRutaImagenLibro(ruta) && typeof obraId === 'string' && obraId.length > 0 && ruta.startsWith(`taller/${obraId}/img/`);

/* Una imagen que se puede dibujar sin colgar la pestaña: hasta LOMO_LADO_MAX px de lado y LOMO_AREA_MAX pixeles. Se mira en la
   cabecera del archivo, antes de abrirlo (archivos.js → medidasDe), y otra vez despues. */
export const LOMO_LADO_MAX = 12000;
export const LOMO_AREA_MAX = 100e6;
export function medidaDeLomoAceptable(m) {
  const w = Number(m && m.w), h = Number(m && m.h);
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 && w <= LOMO_LADO_MAX && h <= LOMO_LADO_MAX && w * h <= LOMO_AREA_MAX;
}

/* EL LOMO DE UN ENLACE PRIVADO: lo que viaja en hojas[0].lomo (lector/lomo.js), sin la imagen (Publicar.js la hace aparte).
   → { datos: { c?, t?, x?, g? }, ruta } — `g`: el grueso elegido como parte del ancho de la pagina (sin elegir: el lector lo
   calcula segun las hojas); `ruta`: la de la imagen del lomo si es de la carpeta del libro `obraId`, o ''. */
export function lomoParaEdicion(lomo, anchoMm, obraId) {
  const l = limpiarLomo(lomo), datos = {};
  if (l.color) { datos.c = l.color; datos.t = l.tinta || tintaPara(l.color); } else if (l.tinta) datos.t = l.tinta;
  if (l.texto) datos.x = l.texto;
  if (typeof l.grosor === 'number' && anchoMm > 0) datos.g = r4(Math.min(0.35, Math.max(0.01, l.grosor / anchoMm)));
  return { datos, ruta: l.imagen && esRutaDelLomo(l.imagen.ruta, obraId) ? l.imagen.ruta : '' };
}
