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

// LA FICHA DEL LIBRO (supabase/016_ficha.sql): resumen, tema, claves («Lo que encontrarás») y para_quien. La base ya
// la revisa (ficha_valida), pero aquí se limpia otra vez antes de entregarla, con las MISMAS reglas que el lector
// (src/scripts/lector/ficha.js → limpiarFicha; tools/test-ficha.mjs comprueba que las dos dicen lo mismo). Va copiada
// y no importada: la función se publica sola, sin el resto del sitio. Solo las cuatro claves, solo lo que tiene algo.
const FICHA_TOPES = { resumen: 500, tema: 60, para_quien: 80, clave: 70, claves: 5 };
// Los rangos van armados con fromCharCode (sin escapes de cuatro cifras en el texto: el despliegue los convertia en letras)
const fichaCh = (n) => String.fromCharCode(n);
const fichaDe = (a, b) => fichaCh(a) + (b === undefined ? "" : "-" + fichaCh(b));
const FICHA_RAROS = new RegExp("[" + [[0x0, 0x8], [0xB], [0xC], [0xE, 0x1F], [0x7F, 0x9F], [0x200B, 0x200F], [0x202A, 0x202E], [0x2066, 0x2069], [0xFEFF]].map(([a, b]) => fichaDe(a, b)).join("") + "]", "g");
const FICHA_SALTOS = new RegExp(fichaCh(13) + fichaCh(10) + "?|" + fichaCh(13) + "|[" + fichaCh(0x2028) + fichaCh(0x2029) + "]", "g");
/* Medio emoji suelto (una mitad sin la otra): la base no lo acepta en un jsonb */
const FICHA_ALTA = "[" + fichaDe(0xD800, 0xDBFF) + "]";
const FICHA_SUELTOS = new RegExp(FICHA_ALTA + "[" + fichaDe(0xDC00, 0xDFFF) + "]|[" + fichaDe(0xD800, 0xDFFF) + "]", "g"); // un par entero se queda; una mitad sola, no (sin lookbehind: Safari viejo)
const FICHA_ALTA_AL_FINAL = new RegExp(FICHA_ALTA + "$");
const fichaPropia = (o, k) => !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
function fichaCortar(t, max) {
  if (t.length <= max) return t;
  let s = t.slice(0, max);
  if (FICHA_ALTA_AL_FINAL.test(s)) s = s.slice(0, -1);
  return s;
}
function fichaLinea(v, max) {
  if (typeof v !== 'string') return '';
  const t = v.replace(FICHA_SALTOS, ' ').replace(/\t/g, ' ').replace(FICHA_RAROS, '').replace(FICHA_SUELTOS, (m) => (m.length === 2 ? m : '')).replace(/\s+/g, ' ').trim();
  return fichaCortar(t, max).trim();
}
function fichaParrafos(v, max) {
  if (typeof v !== 'string') return '';
  const t = v.replace(FICHA_SALTOS, '\n').replace(/\t/g, ' ').replace(FICHA_RAROS, '').replace(FICHA_SUELTOS, (m) => (m.length === 2 ? m : ''))
    .replace(/[^\S\n]+\n/g, '\n').replace(/\n[^\S\n]+/g, '\n').replace(/[^\S\n]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
  return fichaCortar(t, max).trim();
}
export function fichaLimpia(j) {
  const f = {};
  if (!j || typeof j !== 'object' || Array.isArray(j)) return f;
  const resumen = fichaPropia(j, 'resumen') ? fichaParrafos(j.resumen, FICHA_TOPES.resumen) : '';
  const tema = fichaPropia(j, 'tema') ? fichaLinea(j.tema, FICHA_TOPES.tema) : '';
  const lista = fichaPropia(j, 'claves') && Array.isArray(j.claves) ? j.claves : [];
  const claves = [];
  for (const c of lista.slice(0, 50)) {
    const t = fichaLinea(c, FICHA_TOPES.clave);
    if (t) claves.push(t);
    if (claves.length === FICHA_TOPES.claves) break;
  }
  const paraQuien = fichaPropia(j, 'para_quien') ? fichaLinea(j.para_quien, FICHA_TOPES.para_quien) : '';
  if (resumen) f.resumen = resumen;
  if (tema) f.tema = tema;
  if (claves.length) f.claves = claves;
  if (paraQuien) f.para_quien = paraQuien;
  return f;
}

// Lo que se entrega de una edición. `urls` = { 900: [...], 1600: [...] }. La ficha va solo si dice algo (un libro sin
// ficha contesta lo mismo que antes de 016).
export function cuerpoBueno(edicion, urls) {
  const ficha = fichaLimpia(edicion.ficha);
  return JSON.stringify({
    titulo: edicion.titulo,
    idioma: edicion.idioma,
    paginas: edicion.paginas,
    ratio: Number(edicion.ratio),
    blando: edicion.blando === true,
    hojas: edicion.hojas,
    urls: { w900: urls[900], w1600: urls[1600] },
    segundos: SEGUNDOS_URL,
    ...(Object.keys(ficha).length ? { ficha } : {})
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
