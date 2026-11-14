/* LOS ENLACES PRIVADOS de un libro del Taller (stage A3a). Lo que se puede probar sin navegador ni base:

     crearToken()          32 bytes al azar (crypto.getRandomValues), en base64url: 43 letras. Es el secreto.
     leerToken(texto)      los 32 bytes de un token, o null si no es EXACTAMENTE uno (43 letras, escrito como lo
                           escribe crearToken: nada de otra forma de decir los mismos bytes)
     huella(token)         SHA-256 de esos 32 bytes → { bytes, hex, bytea }. En la base solo se guarda esto.
     direccion(origen, lang, token)   https://<sitio>/<lang>/vista/#k=<token>: el secreto va detras de «#», que el
                           navegador no manda a ningun servidor ni queda en sus registros.
     diasValidos(x)        7, 30 o 90; cualquier otra cosa vale 30. NUNCA «para siempre».
     vencimiento(dias, ahora)  la fecha en que deja de abrir
     estadoDe(fila, ahora) 'activo' | 'vencido' | 'apagado'
     nombreLimpio(x)       el nombre que se le pone al enlace: 80 letras como mucho, sin saltos ni signos de control

   La misma cuenta (leer el token y su huella) la hace la funcion de borde en supabase/functions/vista/nucleo.js;
   tools/test-taller.mjs comprueba que las dos dan lo mismo con unos vectores fijos. */

export const BYTES_TOKEN = 32;
export const LARGO_TOKEN = 43;                 // 32 bytes en base64url, sin relleno
export const DIAS = [7, 30, 90];
export const DIAS_POR_DEFECTO = 30;
export const DIAS_MAX = 90;
export const NOMBRE_MAX = 80;
export const EDICIONES_MAX = 5;                // de cada libro quedan las 5 ultimas
const DIA_MS = 24 * 60 * 60 * 1000;
const LETRAS = /^[A-Za-z0-9_-]{43}$/;

export function aBase64Url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* null si no es base64url o si decodificado y vuelto a escribir no sale igual (los dos ultimos bits sobran) */
export function deBase64Url(texto) {
  if (typeof texto !== 'string' || !LETRAS.test(texto)) return null;
  let s;
  try { s = atob(texto.replace(/-/g, '+').replace(/_/g, '/') + '='); } catch (e) { return null; }
  const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0));
  return bytes.length === BYTES_TOKEN && aBase64Url(bytes) === texto ? bytes : null;
}

/* `azar` solo se cambia en las pruebas */
export function crearToken(azar = (b) => crypto.getRandomValues(b)) {
  return aBase64Url(azar(new Uint8Array(BYTES_TOKEN)));
}

export const leerToken = deBase64Url;

const aHex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function huella(token) {
  const bytes = deBase64Url(token);
  if (!bytes) return null;
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const hex = aHex(h);
  return { bytes: h, hex, bytea: `\\x${hex}` };
}

export function direccion(origen, lang, token) {
  const base = String(origen || '').replace(/\/+$/, '');
  return `${base}/${/^[a-z]{2}$/.test(lang) ? lang : 'es'}/vista/#k=${token}`;
}

export function diasValidos(x) {
  const n = Number(x);
  return DIAS.includes(n) ? n : DIAS_POR_DEFECTO;
}

export function vencimiento(dias, ahora = Date.now()) {
  return new Date(Number(ahora) + diasValidos(dias) * DIA_MS).toISOString();
}

const CONTROL = new RegExp('[\u0000-\u001f\u007f' + String.fromCharCode(0x2028, 0x2029) + ']+', 'g');

export function nombreLimpio(x) {
  return String(x == null ? '' : x).replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, NOMBRE_MAX);
}

export function estadoDe(fila, ahora = Date.now()) {
  if (!fila) return 'vencido';
  if (fila.revocado) return 'apagado';
  const t = Date.parse(fila.vence);
  return Number.isFinite(t) && t > Number(ahora) ? 'activo' : 'vencido';
}
