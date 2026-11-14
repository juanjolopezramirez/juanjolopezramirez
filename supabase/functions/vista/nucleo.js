// LA CUENTA DE LA FUNCIÓN `vista`, sin red ni base: así se prueba en Node (tools/test-taller.mjs) y corre igual
// en Deno (index.ts la importa). Nada de aquí lee llaves ni habla con Supabase.

export const MENSAJE = 'Este enlace ya no abre';
export const LARGO_TOKEN = 43;          // 32 bytes en base64url, sin relleno
export const CUERPO_MAX = 512;          // bytes: un token mide 43 letras; con esto sobra
export const SEGUNDOS_URL = 600;        // lo que valen las direcciones firmadas de las imágenes
export const ANCHOS = [900, 1600];

// Los sitios desde donde se puede preguntar (CORS). Solo es cortesía del navegador: lo que protege el libro es el
// secreto del enlace, no el origen.
export const ORIGENES_POR_DEFECTO = [
  'https://juanjolopezramirez.com',
  'https://www.juanjolopezramirez.com',
  'http://localhost:4321',
  'http://127.0.0.1:4321'
];

const LETRAS = /^[A-Za-z0-9_-]{43}$/;
const CARPETA = /^taller\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/ediciones\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/$/;

const aBase64Url = (bytes) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Los 32 bytes del token, o null si no es EXACTAMENTE uno: 43 letras escritas como las escribe el Taller.
export function leerToken(k) {
  if (typeof k !== 'string' || !LETRAS.test(k)) return null;
  let s;
  try { s = atob(k.replace(/-/g, '+').replace(/_/g, '/') + '='); } catch (e) { return null; }
  const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0));
  return bytes.length === 32 && aBase64Url(bytes) === k ? bytes : null;
}

// SHA-256 de los bytes, escrito como lo pide PostgREST para una columna bytea: \x<hex>
export async function huellaBytea(bytes) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return '\\x' + [...h].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ¿Abre todavía? Falta, apagado o vencido dan lo mismo: no.
export function vigente(enlace, ahora = Date.now()) {
  if (!enlace || enlace.revocado === true) return false;
  const t = Date.parse(enlace.vence);
  return Number.isFinite(t) && t > ahora;
}

// Las rutas de las imágenes de una edición, por ancho. Si la carpeta no es de la forma que pone la base
// (taller/<obra>/ediciones/<id>/) no se firma nada.
export function rutasDe(carpeta, paginas) {
  if (typeof carpeta !== 'string' || !CARPETA.test(carpeta)) return null;
  if (!Number.isInteger(paginas) || paginas < 1 || paginas > 300) return null;
  const dentro = carpeta.slice('taller/'.length);   // el cajón se llama «taller»: su nombre no va delante
  const salida = {};
  for (const w of ANCHOS) {
    salida[w] = Array.from({ length: paginas }, (_, i) => `${dentro}p${String(i + 1).padStart(3, '0')}-${w}.webp`);
  }
  return salida;
}

export function origenPermitido(origen, lista = ORIGENES_POR_DEFECTO) {
  return typeof origen === 'string' && lista.includes(origen) ? origen : null;
}

// Las cabeceras de toda respuesta (la buena y la mala llevan las mismas)
export function cabeceras(origen, lista = ORIGENES_POR_DEFECTO) {
  const h = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin'
  };
  const ok = origenPermitido(origen, lista);
  if (ok) {
    h['Access-Control-Allow-Origin'] = ok;
    h['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'content-type, apikey';
    h['Access-Control-Max-Age'] = '600';
  }
  return h;
}

// UNA SOLA respuesta mala para todo: mal escrito, desconocido, vencido, apagado, edición que ya no está.
export const CUERPO_MALO = JSON.stringify({ error: MENSAJE });

// Lo que se entrega de una edición. `urls` = { 900: [...], 1600: [...] }
export function cuerpoBueno(edicion, urls) {
  return JSON.stringify({
    titulo: edicion.titulo,
    idioma: edicion.idioma,
    paginas: edicion.paginas,
    ratio: Number(edicion.ratio),
    blando: edicion.blando === true,
    hojas: edicion.hojas,
    urls: { w900: urls[900], w1600: urls[1600] },
    segundos: SEGUNDOS_URL
  });
}

// LIMITE POR IP, EN LA MEMORIA DEL AISLADO. Es un freno de cortesia, no una muralla: cada aislado de la funcion tiene
// su propia cuenta y se reinicia al apagarse; el limite de verdad se pone ademas en el panel de Supabase (README).
// Al pasarse se contesta lo mismo que a cualquier fallo: el mismo 404.
export const LIMITE_POR_MINUTO = 30;
const MAX_CLAVES = 5000;

export function crearLimitador(max = LIMITE_POR_MINUTO, ventanaMs = 60000) {
  const cuentas = new Map();
  return function permitir(clave, ahora = Date.now()) {
    if (cuentas.size > MAX_CLAVES) {
      for (const [k, v] of cuentas) if (ahora - v.t >= ventanaMs) cuentas.delete(k);
      if (cuentas.size > MAX_CLAVES) cuentas.clear();
    }
    const c = cuentas.get(clave);
    if (!c || ahora - c.t >= ventanaMs) { cuentas.set(clave, { t: ahora, n: 1 }); return true; }
    c.n += 1;
    return c.n <= max;
  };
}

// La IP de quien pregunta, de las cabeceras que pone Supabase. Si no hay, todos comparten una sola cuenta.
export function ipDe(cabeceras) {
  const x = String((cabeceras && cabeceras.get && (cabeceras.get('cf-connecting-ip') || cabeceras.get('x-forwarded-for'))) || '');
  return x.split(',')[0].trim().slice(0, 64) || 'sin-ip';
}
