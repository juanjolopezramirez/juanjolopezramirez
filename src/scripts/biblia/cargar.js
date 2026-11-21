/* TRAER EL TEXTO DE UNA CITA desde los archivos quietos del sitio (public/biblia/<version>/NN-USFM.json, los escribe
   tools/biblia.mjs). Mismo origen: la politica de contenido ya lo permite (connect-src 'self').

     const versos = await cargarPasaje(ref, 'rv1909', { base: import.meta.env.BASE_URL });
       → [{ cap: 3, v: 16, t: 'Porque de tal manera amó Dios al mundo...' }]  o null

   - Solo dos versiones: 'rv1909' (Reina-Valera 1909) y 'web' (World English Bible).
   - Un libro que pese mas de 600 KB, que no tenga la forma esperada o que no sea el pedido se rechaza (null).
   - Guarda en memoria los ultimos 6 libros (los mas usados se quedan).
   - TEXTO PLANO: quien lo muestre usa textContent, nunca innerHTML (y antes, mostrar.js → textoParaLeer).
   - Versiculos que la version omite (WEB: Lc 17:36, Hch 8:37...) llegan con t = '' para que el lector decida que decir.
   - La numeracion no es igual en las dos versiones (RV1909 Jonas 1 tiene 16 versiculos; WEB Romanos 16 tiene 24):
       motivoSinTexto(ref, version) → 'numeracion' si la cita existe en la otra version pero no en esta
       cobertura(ref, version)      → 'completa' | 'parcial' (el rango se corta antes) | 'numeracion' | 'invalida'
     cargarPasaje devuelve lo que exista (un rango cortado trae solo su parte) o null si no hay nada. */
import { libroDe, versosEn } from './libros.js';
import { esValida } from './referencias.js';

export const VERSIONES = Object.freeze(['rv1909', 'web']);
export const MAX_BYTES = 600 * 1024;
export const MAX_LIBROS = 6;
export const MAX_VERSOS_MOSTRAR = 40;

const memoria = new Map();      // 'version/USFM' → { caps } | Promise
export function vaciarMemoria() { memoria.clear(); }
export function enMemoria() { return [...memoria.keys()]; }

/* La base de Astro (BASE_URL): solo una ruta del mismo sitio («/», «/repo/»); cualquier otra cosa vale «/». */
export function baseSegura(base) {
  const b = typeof base === 'string' ? base : '/';
  if (!/^\/(?!\/)[\w/.-]*$/.test(b) || b.split('/').includes('..')) return '/';
  return b.endsWith('/') ? b : b + '/';
}

export function rutaLibro(usfm, version, base = '/') {
  const l = libroDe(usfm);
  if (!l || !VERSIONES.includes(version)) return null;
  return `${baseSegura(base)}biblia/${version}/${String(l.n).padStart(2, '0')}-${l.usfm}.json`;
}

/* ¿Es un libro bien formado? {c:'USFM', caps:[[texto, ...], ...]} con tantos capitulos como dice libros.js. */
export function libroValido(datos, usfm) {
  const l = libroDe(usfm);
  if (!l || !datos || typeof datos !== 'object' || Array.isArray(datos)) return false;
  if (datos.c !== usfm || !Array.isArray(datos.caps) || datos.caps.length !== l.caps) return false;
  return datos.caps.every((c) => Array.isArray(c) && c.length > 0 && c.length <= 200 && c.every((t) => typeof t === 'string' && t.length <= 4000));
}

/* ---- la numeracion de cada version, sin bajar nada ---- */
const versosDeCap = (ref, cap, version) => versosEn(ref.libro, cap, version);

/* ¿La cita entera existe en ESTA version? */
export function existeEn(ref, version) {
  if (!VERSIONES.includes(version) || !esValida(ref)) return false;
  if (ref.v1 == null) return true;                        // capitulos: son los mismos en las dos
  if (ref.v1 > versosDeCap(ref, ref.cap, version)) return false;
  return ref.v2 <= versosDeCap(ref, ref.cap2 ?? ref.cap, version);
}

export function cobertura(ref, version) {
  if (!VERSIONES.includes(version) || !esValida(ref)) return 'invalida';
  if (existeEn(ref, version)) return 'completa';
  return ref.v1 <= versosDeCap(ref, ref.cap, version) ? 'parcial' : 'numeracion';
}
export const esParcial = (ref, version) => cobertura(ref, version) === 'parcial';

/* Por que no hay texto: 'numeracion' (existe en la otra version, no en esta), 'invalida' (no existe en ninguna o la
   version no es del sitio) o null (si hay texto; puede ser parcial: ver cobertura). */
export function motivoSinTexto(ref, version) {
  const c = cobertura(ref, version);
  return c === 'numeracion' || c === 'invalida' ? c : null;
}

/* Para no llenar la pantalla con «Salmo 119» o «Mateo 5–7»: los primeros `max` y si se corto. */
export function limitarVersos(versos, max = MAX_VERSOS_MOSTRAR) {
  const lista = Array.isArray(versos) ? versos : [];
  const tope = Number.isInteger(max) && max > 0 ? max : MAX_VERSOS_MOSTRAR;
  return { versos: lista.slice(0, tope), recortado: lista.length > tope, total: lista.length };
}

/* Una red que no contesta no deja la cita «buscando» para siempre: a los ESPERA_MS se corta (AbortController, y por si el
   fetch no lo atiende, una carrera con el reloj) y se devuelve null, como cualquier otro fallo: quien la pidio puede reintentar. */
export const ESPERA_MS = 12000;
async function bajarLibro(usfm, version, base, traer, espera = ESPERA_MS) {
  const url = rutaLibro(usfm, version, base);
  if (!url) return null;
  const corte = typeof AbortController === 'function' ? new AbortController() : null;
  let reloj = 0;
  const tarde = new Promise((r) => { reloj = setTimeout(() => { if (corte) corte.abort(); r(null); }, espera); });
  const bajar = async () => {
    const r = await traer(url, { credentials: 'same-origin', redirect: 'error', ...(corte ? { signal: corte.signal } : {}) });
    if (!r || !r.ok) return null;
    const largo = Number(r.headers && typeof r.headers.get === 'function' ? r.headers.get('content-length') : 0);
    if (largo > MAX_BYTES) return null;
    const texto = await r.text();
    if (typeof texto !== 'string' || texto.length > MAX_BYTES || new TextEncoder().encode(texto).length > MAX_BYTES) return null;
    let datos;
    try { datos = JSON.parse(texto); } catch { return null; }
    return libroValido(datos, usfm) ? { caps: datos.caps } : null;
  };
  try { return await Promise.race([bajar(), tarde]); } finally { clearTimeout(reloj); }
}

async function libro(usfm, version, base, traer, espera) {
  const clave = `${version}/${usfm}`;
  if (memoria.has(clave)) {
    const v = memoria.get(clave);
    memoria.delete(clave); memoria.set(clave, v);          // el usado sube al final (LRU)
    return v;
  }
  const promesa = bajarLibro(usfm, version, base, traer, espera).catch(() => null);
  memoria.set(clave, promesa);
  const datos = await promesa;
  if (!datos) { if (memoria.get(clave) === promesa) memoria.delete(clave); return null; }
  if (memoria.has(clave)) { memoria.delete(clave); memoria.set(clave, datos); }
  while (memoria.size > MAX_LIBROS) memoria.delete(memoria.keys().next().value);
  return datos;
}

export async function cargarPasaje(ref, version, opciones = {}) {
  if (!VERSIONES.includes(version) || !esValida(ref)) return null;
  const traer = opciones.fetch || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  if (!traer) return null;
  let datos;
  const espera = Number.isFinite(opciones.espera) && opciones.espera > 0 ? opciones.espera : ESPERA_MS;
  try { datos = await libro(ref.libro, version, opciones.base ?? '/', traer, espera); } catch { return null; }
  if (!datos) return null;
  const ultimo = ref.cap2 ?? ref.cap;
  const salida = [];
  for (let cap = ref.cap; cap <= ultimo; cap++) {
    const versos = datos.caps[cap - 1];
    if (!versos) break;
    const desde = cap === ref.cap && ref.v1 != null ? ref.v1 : 1;
    const hasta = cap === ultimo && ref.v2 != null ? ref.v2 : versos.length;
    for (let v = desde; v <= Math.min(hasta, versos.length); v++) salida.push({ cap, v, t: versos[v - 1] });
  }
  return salida.length ? salida : null;
}
