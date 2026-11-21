/* COMO SE VE UN BOTON DEL PDF, para que el lector pueda dibujar encima su gemelo de verdad (que se hunde al pulsarlo y
   dice «Copiado»). El aspecto viaja en el mismo enlace del boton, tras el «#» (nunca llega a ningun servidor):

     copiar   https://juanjolopezramirez.com/copiar/#t=<texto>&b=<aspecto>      (el de siempre, `#t=<texto>`, sigue valiendo)
     enlace   https://juanjolopezramirez.com/ir/#u=<direccion https>&b=<aspecto>

   <aspecto> es base64url del JSON en UTF-8:
     { e, f, c, s, lh, rr, n, x, i, l, fu, fs, pf, k, bw, bc, bl, o }
       e   estilo: 'relleno' | 'contorno' | 'texto' | 'pildora' | 'duolingo' | 'base' (el boton de siempre, sin aspecto)
       f   relleno · c letra · s escalon de abajo (el borde «Duolingo») · bc borde · pf el papel detras (todos #rrggbb)
       lh  alto del escalon · rr radio de las esquinas (1 = pildora) · fs tamaño de la letra · bw ancho del borde:
           TODO en fraccion del ALTO de la hoja (asi vale a cualquier tamaño de pantalla)
       n   negrita (1) · x lo que dice (120) · i el icono de la lista (su nombre) · l el lado del icono: izq | der | solo
       fu  la letra (su nombre, como en Google Fonts) · k lo que dice al copiar («Copiado», 40) · bl linea del borde
       o   opacidad, de 20 a 100
   Lo que no se conoce se tira; lo que no cumple su regla, tambien. Puro: sin pagina, sin red. Todo lo que llega es hostil. */
import { BASE_COPIA, esEnlaceCopia, enlaceDeCopia, textoDeCopia } from './copiaEnPdf.js';

export const ORIGEN_BOTON = 'https://juanjolopezramirez.com';
export const BASE_IR = ORIGEN_BOTON + '/ir/#u=';
export const ASPECTO_MAX = 700;            // letras del aspecto ya codificado
export const IR_URL_MAX = 2000;            // la direccion de destino
export const HREF_IR_MAX = 8000;
export const ESTILOS_BOTON = Object.freeze(['base', 'relleno', 'contorno', 'texto', 'pildora', 'duolingo']);
export const LADOS_BOTON = Object.freeze(['izq', 'der', 'solo']);
export const LINEAS_BOTON = Object.freeze(['solido', 'punteado', 'rayado']);
const TOPES = Object.freeze({ x: 120, k: 40, fu: 60, i: 24 });

/* Controles, invisibles y marcas de direccion, en numeros (como copiaEnPdf.js y notaEnPdf.js) */
const RANGOS = [[0, 8], [0xb, 0xc], [0xe, 0x1f], [0x7f, 0x9f], [0xad, 0xad], [0x200b, 0x200f], [0x202a, 0x202e], [0x2060, 0x2064], [0x2066, 0x2069], [0xfeff, 0xfeff]];
const OCULTOS = new RegExp('[' + RANGOS.map(([a, b]) => String.fromCharCode(a) + (b > a ? '-' + String.fromCharCode(b) : '')).join('') + ']', 'g');
const OCULTO = new RegExp(OCULTOS.source);
const HEX = /^#[0-9a-f]{6}$/;
const B64 = /^[A-Za-z0-9_-]+$/;
const ICONO = /^[a-z0-9-]{1,24}$/;
const FUENTE = /^[A-Za-z0-9][A-Za-z0-9 ]{0,59}$/;
/* La direccion de destino escrita ya codificada: solo lo que deja encodeURIComponent */
const CODIFICADO = /^[A-Za-z0-9\-._~!*'()%]+$/;
// eslint-disable-next-line no-control-regex
const URL_MALA = /[\u0000-\u0020\u007f-\u009f<>"\\`]/;

const propia = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const objeto = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const texto = (v, tope) => {
  if (typeof v !== 'string') return '';
  const s = v.replace(OCULTOS, '').replace(/\s+/g, ' ').trim();
  const letras = Array.from(s);
  return letras.length > tope ? letras.slice(0, tope).join('').trim() : s;
};
const color = (v) => (typeof v === 'string' && HEX.test(v.trim().toLowerCase()) ? v.trim().toLowerCase() : '');
/* Un numero finito dentro de su tope, con 5 decimales */
const fraccion = (v, min, max) => (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? Math.round(v * 100000) / 100000 : null);

/* El aspecto limpio (objeto sin prototipo) o null si no hay nada que dibujar */
export function limpiarAspectoBoton(x) {
  if (!objeto(x)) return null;
  const a = Object.create(null);
  a.e = ESTILOS_BOTON.includes(x.e) ? x.e : 'base';
  for (const k of ['f', 'c', 's', 'pf', 'bc']) { const v = propia(x, k) ? color(x[k]) : ''; if (v) a[k] = v; }
  for (const [k, min, max] of [['lh', 0, 0.05], ['rr', 0, 1], ['fs', 0.002, 0.2], ['bw', 0, 0.02]]) {
    const v = propia(x, k) ? fraccion(x[k], min, max) : null;
    if (v !== null) a[k] = v;
  }
  if (x.n === 1 || x.n === true) a.n = 1;
  for (const k of ['x', 'k']) { const v = propia(x, k) ? texto(x[k], TOPES[k]) : ''; if (v) a[k] = v; }
  if (typeof x.i === 'string' && ICONO.test(x.i)) a.i = x.i;
  if (LADOS_BOTON.includes(x.l)) a.l = x.l;
  if (typeof x.fu === 'string' && FUENTE.test(x.fu) && x.fu.length <= TOPES.fu) a.fu = x.fu;
  if (LINEAS_BOTON.includes(x.bl)) a.bl = x.bl;
  if (Number.isInteger(x.o) && x.o >= 20 && x.o < 100) a.o = x.o;
  return a;
}

/* base64url de bytes y de vuelta (btoa/atob: navegador y Node), sin relleno */
function aBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function deBase64Url(s) {
  if (typeof s !== 'string' || !B64.test(s) || s.length % 4 === 1) return null;
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch { return null; }
}

/* El aspecto escrito para el enlace (siempre en el mismo orden: el mismo boton da el mismo enlace), o null */
const ORDEN = ['e', 'f', 'c', 's', 'lh', 'rr', 'n', 'x', 'i', 'l', 'fu', 'fs', 'pf', 'k', 'bw', 'bc', 'bl', 'o'];
export function codigoDeAspecto(aspecto) {
  const a = limpiarAspectoBoton(aspecto);
  if (!a) return null;
  const plano = {};
  for (const k of ORDEN) if (a[k] !== undefined) plano[k] = a[k];
  const s = aBase64Url(new TextEncoder().encode(JSON.stringify(plano)));
  return s.length <= ASPECTO_MAX ? s : null;
}

/* El aspecto que trae un codigo, limpio, o null */
export function aspectoDeCodigo(codigo) {
  if (typeof codigo !== 'string' || codigo.length > ASPECTO_MAX) return null;
  const bytes = deBase64Url(codigo);
  if (!bytes) return null;
  let datos;
  try { datos = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { return null; }
  return limpiarAspectoBoton(datos);
}

/* Parte «a&b=c» en { antes, b } (b = null si no viene). Solo UNA «&b=» y al final. */
function partir(resto) {
  const i = resto.indexOf('&b=');
  if (i < 0) return { antes: resto, b: null };
  const b = resto.slice(i + 3);
  if (!b || b.includes('&')) return null;
  return { antes: resto.slice(0, i), b };
}

/* ---- COPIAR ---- */
export const pareceEnlaceCopia = (href) => typeof href === 'string' && href.startsWith(BASE_COPIA);

/* { texto, aspecto | null } de un enlace de copiar (con aspecto o sin el), o null */
export function copiaDeEnlace(href) {
  if (!pareceEnlaceCopia(href)) return null;
  const p = partir(href.slice(BASE_COPIA.length));
  if (!p) return null;
  let aspecto = null;
  if (p.b !== null) { aspecto = aspectoDeCodigo(p.b); if (!aspecto) return null; }
  const t = textoDeCopia(BASE_COPIA + p.antes);
  return t ? { texto: t, aspecto } : null;
}
export const esEnlaceCopiaBoton = (href) => copiaDeEnlace(href) !== null;

/* El enlace de copiar con su aspecto; sin aspecto (o si no cabe), el de siempre */
export function enlaceDeCopiaConAspecto(t, aspecto) {
  const base = enlaceDeCopia(t);
  if (!base) return null;
  const b = aspecto ? codigoDeAspecto(aspecto) : null;
  if (!b) return base;
  const href = `${base}&b=${b}`;
  return esEnlaceCopia(base) && esEnlaceCopiaBoton(href) ? href : base;
}

/* ---- IR: la pagina que muestra a donde lleva un boton antes de ir ---- */
/* Una direccion de destino buena: solo https, sin usuario ni clave, sin espacios ni comillas, con tope. La de vuelta o null. */
export function destinoSeguro(v) {
  if (typeof v !== 'string' || !v || v.length > IR_URL_MAX || URL_MALA.test(v) || OCULTO.test(v)) return null;
  let u;
  try { u = new URL(v); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || !u.hostname || !u.hostname.includes('.')) return null;
  return u.href.length <= IR_URL_MAX ? u.href : null;
}

const ORIGEN = /^https?:\/\/[A-Za-z0-9.-]+(:\d{1,5})?(\/[A-Za-z0-9._~-]+)*\/?$/;
const baseIrDe = (origen) => (typeof origen === 'string' && ORIGEN.test(origen) ? origen.replace(/\/+$/, '') + '/ir/#u=' : null);
const basesIr = (origenes) => [BASE_IR, ...(Array.isArray(origenes) ? origenes : [origenes]).map(baseIrDe).filter(Boolean)];

export const pareceEnlaceIr = (href, { origenes = [] } = {}) => typeof href === 'string' && basesIr(origenes).some((b) => href.startsWith(b));

/* El enlace a /ir/ de una direccion, con o sin aspecto. null si la direccion no sirve o no cabe. */
export function enlaceDeIr(url, aspecto = null, { origen = ORIGEN_BOTON } = {}) {
  const destino = destinoSeguro(url), base = baseIrDe(origen);
  if (!destino || !base) return null;
  const b = aspecto ? codigoDeAspecto(aspecto) : null;
  const href = base + encodeURIComponent(destino).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()) + (b ? `&b=${b}` : '');
  return href.length <= HREF_IR_MAX ? href : null;
}

/* { url, aspecto | null } de un enlace a /ir/, o null si no es uno o viene mal escrito */
export function irDeEnlace(href, { origenes = [] } = {}) {
  if (typeof href !== 'string' || href.length > HREF_IR_MAX) return null;
  const base = basesIr(origenes).find((b) => href.startsWith(b));
  if (!base) return null;
  const p = partir(href.slice(base.length));
  if (!p || !p.antes || !CODIFICADO.test(p.antes)) return null;
  let aspecto = null;
  if (p.b !== null) { aspecto = aspectoDeCodigo(p.b); if (!aspecto) return null; }
  let crudo;
  try { crudo = decodeURIComponent(p.antes); } catch { return null; }
  const url = destinoSeguro(crudo);
  /* Solo la forma exacta que escribe enlaceDeIr: nada de direcciones que el navegador «arregla» por el camino */
  return url && url === crudo ? { url, aspecto } : null;
}
export const esEnlaceIr = (href, opciones) => irDeEnlace(href, opciones) !== null;

/* El aspecto de cualquier boton del PDF (copiar o ir), o null */
export function aspectoDeBoton(href, opciones) {
  const c = copiaDeEnlace(href);
  if (c) return c.aspecto;
  const i = irDeEnlace(href, opciones);
  return i ? i.aspecto : null;
}

/* ¿Es un enlace de boton bueno? (copiar con o sin aspecto, o /ir/) */
export const esEnlaceBoton = (href, opciones) => esEnlaceCopiaBoton(href) || esEnlaceIr(href, opciones);
/* ¿DICE ser un boton? (empieza como uno): lo que dice serlo y no lo es, se tira, no queda como enlace cualquiera */
export const pareceEnlaceBoton = (href, opciones) => pareceEnlaceCopia(href) || pareceEnlaceIr(href, opciones);
