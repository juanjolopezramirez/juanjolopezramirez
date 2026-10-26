/* Las piezas pequeñas del portal «The Alef Code», sin DOM ni `window` ni Supabase, para
   poder probarlas en Node (tools/test-portal.mjs). Las usan entrar.js, panel.js
   y guardia.js.

   REGLA DE TODO LO QUE RECIBE ALGO DE FUERA —un parametro de la direccion, un
   error de la red, lo que escribe quien entra—: nunca se usa tal cual. Se
   compara con listas que ya existen (`includes` sobre un array, `Set.has`), nunca
   con un objeto cualquiera: en un objeto, «constructor» o «__proto__» parecen
   claves validas. */

export const IDIOMAS = ['es', 'en', 'pt', 'fr', 'it'];
export const CLAVE_MIN = 10;
export const CLAVE_MAX = 72;       // bcrypt corta en 72 bytes: una mas larga no suma
export const CORREO_MAX = 254;

const tiene = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

/* ---- Que pantalla enseñar ----------------------------------------------------

   Segun el modo del portal y quien sea la persona. Las pantallas son las de
   components/portal/Tarjeta.astro (`data-pantalla`).

     modo     'real' | 'demo' | 'apagado' (config.js)
     sesion   null (no ha entrado) | { id, correo }
     perfil   undefined (aun no se sabe) | null (no hay perfil) | { estado }
     conexion false si no se pudo hablar con el servidor

   Quien no ha entrado ve «entrar» (o la que haya elegido: pedir, recuperar…;
   eso lo lleva entrar.js). Quien ha entrado y aun no sabe en que estado esta,
   «cargando». Un perfil que no es uno de los tres estados no abre nada. */
export function pantallaPara({ modo, sesion, perfil, conexion = true }) {
  if (modo !== 'real' && modo !== 'demo') return 'apagado';
  if (!conexion) return 'problema';
  if (!sesion) return 'entrar';
  if (perfil === undefined) return 'cargando';
  const estado = perfil && perfil.estado;
  if (estado === 'aprobado') return 'aprobado';
  if (estado === 'pendiente') return 'pendiente';
  if (estado === 'rechazado') return 'rechazado';
  return 'pendiente';              // sin perfil o con un estado raro: no se abre nada
}

/* ---- Validar lo que se escribe (el servidor vuelve a comprobarlo todo) ------ */
export function limpiar(texto, max) {
  if (typeof texto !== 'string') return '';
  /* Fuera los controles y tambien lo que no se ve o da la vuelta al texto (U+200B–200F,
     202A–202E, 2066–2069, FEFF): sirve para que un nombre parezca otro cuando lo lee el admin. */
  return texto
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '')
    .trim().slice(0, max);
}

export function correoValido(texto) {
  if (typeof texto !== 'string') return false;
  const c = texto.trim();
  if (c.length < 5 || c.length > CORREO_MAX) return false;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c);
}

/* null si la contraseña vale; si no, la clave del texto de error */
export function errorDeClave(clave) {
  if (typeof clave !== 'string' || clave.length < CLAVE_MIN) return 'claveCorta';
  if (clave.length > CLAVE_MAX) return 'claveLarga';
  return null;
}

/* ---- La configuracion -------------------------------------------------------

   modoDe(): 'real' si hay una URL de Supabase y una clave que NO es secreta;
   'demo' solo en desarrollo (`npm run dev`) y sin esas variables, o con
   `?demo=` en desarrollo; 'apagado' en cualquier otro caso (la publicacion sin
   variables enseña «Pronto» y nada se rompe). */
/* Lo que se pega en una variable suele traer un espacio o una «/» de mas: se quitan. */
export function limpiarUrl(url) {
  return typeof url === 'string' ? url.trim().replace(/\/+$/, '') : url;
}

export function urlSupabaseValida(url) {
  if (typeof url !== 'string' || url.length > 120) return false;
  return /^https:\/\/[a-z0-9]{8,40}\.supabase\.(co|in)$/.test(url);
}

/* La clave que se pone en la web es la PUBLICA (anon o publishable). La secreta
   (`sb_secret_…`, o un JWT cuyo rol es service_role) se salta todas las reglas:
   si alguien la pusiera por error en las variables, se rechaza y no se usa. */
export function esClaveSecreta(clave) {
  if (typeof clave !== 'string') return false;
  if (clave.startsWith('sb_secret_')) return true;
  const partes = clave.split('.');
  if (partes.length === 3) {
    try {
      const b64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8');
      const carga = JSON.parse(json);
      return !!carga && carga.role === 'service_role';
    } catch (e) {
      return false;
    }
  }
  return false;
}

export function claveVale(clave) {
  return typeof clave === 'string' && clave.length >= 20 && clave.length <= 400 && !/\s/.test(clave) && !esClaveSecreta(clave);
}

/* LA REVISION DE LAS DOS VARIABLES, para el momento de COMPILAR (astro.config.mjs).

   Vite mete en el JS que se publica todo lo que empieza por PUBLIC_. Si por error alguien
   pone la clave SECRETA ahi, en el navegador se ignora (modoDe), pero ya viajo dentro del
   archivo y cualquiera la puede leer. Por eso la compilacion se PARA antes. Tampoco se
   publica en silencio con una URL mal escrita (que dejaria el portal «apagado» sin avisar).

   Devuelve { ok: true, vacio: true } si no hay ninguna (el portal sale «apagado», que es
   lo normal antes de conectar Supabase), { ok: true } si las dos valen, o
   { ok: false, motivo } con una frase para ti. NUNCA repite el valor de la clave. */
export function revisarVariables(url, clave) {
  const hayUrl = typeof url === 'string' && url.trim() !== '';
  const hayClave = typeof clave === 'string' && clave.trim() !== '';
  if (!hayUrl && !hayClave) return { ok: true, vacio: true };
  if (hayUrl !== hayClave) {
    return { ok: false, motivo: 'Solo esta puesta una de las dos variables (PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY). Faltan las dos juntas o ninguna.' };
  }
  if (!urlSupabaseValida(limpiarUrl(url))) {
    return { ok: false, motivo: 'PUBLIC_SUPABASE_URL no tiene la forma https://<tu-proyecto>.supabase.co (sin nada despues).' };
  }
  const k = clave.trim();
  if (esClaveSecreta(k)) {
    return { ok: false, motivo: 'PUBLIC_SUPABASE_ANON_KEY tiene una clave SECRETA (service_role / sb_secret_). Esa clave NUNCA va en el sitio: abre toda la base. Pon la clave PUBLICA (anon / publishable) y, como la secreta ya se vio, generala de nuevo en Supabase.' };
  }
  if (!claveVale(k)) {
    return { ok: false, motivo: 'PUBLIC_SUPABASE_ANON_KEY no parece una clave publica de Supabase (vacia por dentro, con espacios, o de largo raro).' };
  }
  return { ok: true };
}

export function modoDe({ url, clave, dev = false, demo = false }) {
  if (dev && demo) return 'demo';         // `?demo=` en desarrollo: nunca toca la base real
  if (urlSupabaseValida(url) && claveVale(clave)) return 'real';
  if (dev) return 'demo';
  return 'apagado';
}

/* ---- Los errores: un mensaje por familia, nunca el del servidor --------------

   Branchamos por `error.code` (lo recomienda la documentacion de Supabase, que
   no promete el texto ni el numero HTTP). Lo desconocido es «generico». Sobre
   todo: NADA aqui deja adivinar si un correo existe. «Correo o contraseña no
   coinciden» sirve igual para un correo que no existe y para uno con otra clave. */
const CODIGOS = {
  invalid_credentials: 'credenciales',
  user_not_found: 'credenciales',
  email_not_confirmed: 'sinConfirmar',
  weak_password: 'claveDebil',
  same_password: 'claveIgual',
  over_request_rate_limit: 'demasiados',
  over_email_send_rate_limit: 'demasiados',
  request_timeout: 'red',
  provider_disabled: 'google',
  oauth_provider_not_supported: 'google',
  bad_oauth_callback: 'google',
  bad_oauth_state: 'google',
  provider_email_needs_verification: 'google'
};
export function claveDeError(error) {
  if (!error || typeof error !== 'object') return 'generico';
  const codigo = typeof error.code === 'string' ? error.code : '';
  if (tiene(CODIGOS, codigo)) return CODIGOS[codigo];
  if (error.status === 429) return 'demasiados';
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return 'red';
  return 'generico';
}

/* ---- Direcciones propias ----------------------------------------------------

   A donde vuelve Google, el enlace del correo y «Salir»: SIEMPRE una direccion
   del propio sitio construida aqui con un idioma de la lista; jamas lo que
   venga en la URL. (Supabase ademas tiene su lista de direcciones permitidas.) */
export const idiomaDe = (lang) => (IDIOMAS.includes(lang) ? lang : 'es');
export const rutaPortal = (lang) => `/${idiomaDe(lang)}/portal/`;
export const rutaPanel = (lang) => `/${idiomaDe(lang)}/portal/panel/`;
export const urlPortal = (origen, lang) => `${String(origen).replace(/\/$/, '')}${rutaPortal(lang)}`;

/* «#escribir» → «escribir», si es una de las secciones; si no, null. */
export function anclaValida(hash, ids) {
  if (typeof hash !== 'string' || hash.length < 2 || hash.charAt(0) !== '#') return null;
  let id;
  try { id = decodeURIComponent(hash.slice(1)); } catch (e) { return null; }
  id = id.toLowerCase();
  return Array.isArray(ids) && ids.includes(id) ? id : null;
}
