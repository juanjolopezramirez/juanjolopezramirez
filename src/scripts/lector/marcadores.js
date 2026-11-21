/* LOS MARCADORES DE UN LIBRO: las paginas que el lector marco para volver a ellas. Viven SOLO en este navegador; no van a
   ningun servidor. Pura: el almacen llega de fuera (site.js le da el del navegador; las pruebas de Node, un Map), asi esto
   se prueba sin pagina.

   Cada libro, una entrada:
     jlr:marcas:v1:<clave>  →  {"n":<imagenes del libro>,"m":[{"p":<imagen, desde 0>,"f":<numero impreso o null>,"t":<segundos>}]}
   y una lista de los libros con marcas, el ultimo tocado al final (para olvidar el mas viejo):
     jlr:marcas:v1          →  ["<clave>", …]

   La <clave> de un libro:
     r:<id>:<idioma>   un libro de Recursos (su id y la edicion que se lee)
     v:<32 hex>        un libro privado (/vista/): los primeros 32 hex del SHA-256 de 'jlr-marcas-v1|' + el secreto del enlace.
                       El secreto NUNCA se guarda ni sale de vista.js; con la huella no se puede volver a el.
   No se guarda nada del texto de las paginas. Topes: 100 marcas por libro, 60 libros. Lo que llega del almacen es dato
   ajeno (otro programa pudo escribirlo): se revisa entero al leer, y lo que no vale se tira. Toda llamada al almacen va en
   try/catch: sin almacen (modo privado, bloqueado, lleno) no se rompe nada, solo no se guarda. */

export const PREFIJO = 'jlr:marcas:v1:';
export const INDICE = 'jlr:marcas:v1';
export const MARCAS_MAX = 100;
export const LIBROS_MAX = 60;
export const PAGINAS_MAX = 100000;
const FOLIO_MAX = 100000;
const ID_RECURSOS = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const IDIOMA = /^[a-z]{2,3}$/;
const CLAVE = /^(?:r:[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?:[a-z]{2,3}|v:[0-9a-f]{32})$/;

export const claveValida = (c) => typeof c === 'string' && CLAVE.test(c);

/* La clave de un libro de Recursos, o null si el id o el idioma no tienen la forma de siempre */
export function claveRecursos(id, idioma) {
  if (typeof id !== 'string' || typeof idioma !== 'string' || !ID_RECURSOS.test(id) || !IDIOMA.test(idioma)) return null;
  return `r:${id}:${idioma}`;
}

/* La clave de un libro privado a partir del secreto de su enlace. Promesa de la clave, o null si no hay con que hacer la
   cuenta. Solo la huella sale de aqui. */
export async function claveDeEnlace(token, subtle = globalThis.crypto && globalThis.crypto.subtle) {
  if (typeof token !== 'string' || !token || !subtle) return null;
  try {
    const h = new Uint8Array(await subtle.digest('SHA-256', new TextEncoder().encode('jlr-marcas-v1|' + token)));
    let hex = '';
    for (let i = 0; i < 16; i++) hex += h[i].toString(16).padStart(2, '0');
    return 'v:' + hex;
  } catch (e) { return null; }
}

/* ¿Se puede guardar? Escribe y borra una prueba. Un almacen que tira al tocarlo (o que no guarda) no sirve. */
export function almacenDisponible(almacen) {
  if (!almacen || typeof almacen.getItem !== 'function' || typeof almacen.setItem !== 'function' || typeof almacen.removeItem !== 'function') return false;
  const k = PREFIJO + '__prueba';
  try {
    almacen.setItem(k, '1');
    const bien = almacen.getItem(k) === '1';
    almacen.removeItem(k);
    return bien;
  } catch (e) { return false; }
}

const leer = (almacen, k) => { try { return almacen.getItem(k); } catch (e) { return null; } };
const escribir = (almacen, k, v) => { try { almacen.setItem(k, v); return true; } catch (e) { return false; } };
const borrar = (almacen, k) => { try { almacen.removeItem(k); return true; } catch (e) { return false; } };
const json = (s) => { if (typeof s !== 'string' || s.length > 200000) return null; try { return JSON.parse(s); } catch (e) { return null; } };

/* Lo guardado de un libro, limpio: marcas de imagenes dentro del libro (0 … n-1), una por imagen, ordenadas, a lo sumo
   MARCAS_MAX. Si el libro cambio de tamaño (otra edicion con el mismo nombre), las que se salen se tiran. */
export function limpiar(dato, n) {
  const total = Number.isInteger(n) && n > 0 && n <= PAGINAS_MAX ? n : 0;
  const lista = dato && typeof dato === 'object' && Array.isArray(dato.m) ? dato.m : [];
  const vistas = new Set();
  const m = [];
  for (const x of lista) {
    if (m.length >= MARCAS_MAX) break;
    if (!x || typeof x !== 'object') continue;
    const p = x.p;
    if (!Number.isInteger(p) || p < 0 || p >= total || vistas.has(p)) continue;
    vistas.add(p);
    const f = Number.isInteger(x.f) && x.f >= 1 && x.f <= FOLIO_MAX ? x.f : null;
    const t = Number.isInteger(x.t) && x.t >= 0 && x.t <= 1e11 ? x.t : 0;
    m.push({ p, f, t });
  }
  m.sort((a, b) => a.p - b.p);
  return { n: total, m };
}

function leerIndice(almacen) {
  const d = json(leer(almacen, INDICE));
  return Array.isArray(d) ? [...new Set(d.filter(claveValida))] : [];
}

/* UN LIBRO PRIVADO SE OLVIDA SOLO. Un enlace privado vive a lo sumo 90 dias (Taller: 7/30/90): pasado eso, sus marcas ya no
   llevan a ningun libro y solo dirian que este aparato leyo uno. Se borra la entrada `v:` cuya marca mas nueva es mas vieja. */
export const VISTA_DIAS = 90;
const viejo = (dato, ahora) => {
  const ts = dato && Array.isArray(dato.m) ? dato.m.map((x) => (x && Number.isInteger(x.t) ? x.t : 0)) : [];
  return !ts.length || Math.max(...ts) < ahora - VISTA_DIAS * 86400;
};

/* El indice, vuelto a leer (otra pestaña pudo cambiarlo): este libro pasa al final (el mas reciente), los privados vencidos se
   olvidan, y si quedan mas de LIBROS_MAX se olvidan los mas viejos (y sus marcas). El trabajo tiene tope: se borran a lo
   sumo LIBROS_MAX entradas de las que sobran (un indice enorme y ajeno no cuelga la pagina; lo demas sale del indice igual). */
function tocar(almacen, clave, quitar, ahora) {
  let lista = leerIndice(almacen).filter((c) => c !== clave);
  if (!quitar) lista.push(clave);
  const sobra = lista.length - LIBROS_MAX;
  if (sobra > 0) {
    lista.slice(0, sobra).slice(-LIBROS_MAX).forEach((c) => borrar(almacen, PREFIJO + c));
    lista = lista.slice(-LIBROS_MAX);
  }
  lista = lista.filter((c) => {
    if (c === clave || !c.startsWith('v:')) return true;
    if (!viejo(json(leer(almacen, PREFIJO + c)), ahora)) return true;
    borrar(almacen, PREFIJO + c);
    return false;
  });
  if (lista.length) escribir(almacen, INDICE, JSON.stringify(lista));
  else borrar(almacen, INDICE);
}

/* Los marcadores de UN libro abierto. `n`: cuantas imagenes tiene. Devuelve null si la clave no vale.
     lista()          las marcas, por orden de pagina: [{ p, f, t }]
     tiene(p)         ¿esta marcada la imagen p?
     poner(p, f)      'ok' | 'ya' (ya estaba) | 'lleno' (MARCAS_MAX) | 'fuera' (no es una pagina del libro) | 'falla' (no se guardo)
     quitar(p)        'ok' | 'no' (no estaba) | 'falla'
   Antes de cada cambio se vuelve a leer lo guardado: si el mismo libro esta abierto en otra pestaña, una no pisa las marcas de
   la otra. Si el almacen falla al escribir, se avisa y queda como estaba. */
export function crearMarcadores(almacen, clave, n, { ahora = () => Math.floor(Date.now() / 1000) } = {}) {
  if (!claveValida(clave) || !almacen) return null;
  const k = PREFIJO + clave;
  const segundos = () => { const t = ahora(); return Number.isInteger(t) && t >= 0 ? t : 0; };
  /* Lo guardado ahora mismo, o null si el almacen no deja leer: entonces no se escribe (se pisaria lo que no se pudo ver). */
  const fresco = () => {
    let s;
    try { s = almacen.getItem(k); } catch (e) { return null; }
    return limpiar(json(s), n);
  };
  let datos = fresco() || limpiar(null, n);
  /* Un libro privado cuyo enlace ya no puede estar vivo: se olvida al abrirlo */
  if (clave.startsWith('v:') && datos.m.length && viejo(datos, segundos())) {
    if (borrar(almacen, k)) { datos = limpiar(null, n); tocar(almacen, clave, true, segundos()); }
  }
  const guardar = (nuevo) => {
    const ok = nuevo.m.length ? escribir(almacen, k, JSON.stringify(nuevo)) : borrar(almacen, k);
    if (!ok) return false;
    datos = nuevo;
    tocar(almacen, clave, !nuevo.m.length, segundos());
    return true;
  };
  return {
    clave,
    lista: () => datos.m.map((x) => ({ ...x })),
    tiene: (p) => datos.m.some((x) => x.p === p),
    poner(p, f) {
      if (!Number.isInteger(p) || p < 0 || p >= datos.n) return 'fuera';
      const base = fresco();
      if (!base) return 'falla';
      if (base.m.some((x) => x.p === p)) { datos = base; return 'ya'; }
      if (base.m.length >= MARCAS_MAX) { datos = base; return 'lleno'; }
      const marca = { p, f: Number.isInteger(f) && f >= 1 && f <= FOLIO_MAX ? f : null, t: segundos() };
      return guardar({ n: base.n, m: [...base.m, marca].sort((a, b) => a.p - b.p) }) ? 'ok' : 'falla';
    },
    quitar(p) {
      const base = fresco();
      if (!base) return 'falla';
      if (!base.m.some((x) => x.p === p)) { datos = base; return 'no'; }
      return guardar({ n: base.n, m: base.m.filter((x) => x.p !== p) }) ? 'ok' : 'falla';
    }
  };
}
