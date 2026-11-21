/* LEER CITAS BIBLICAS en texto (puro: sin DOM, sin red). Espanol e ingles, con o sin tildes.

     leerReferencias('Jeremías 1:4-5 y el Salmo 139', { idioma: 'es' })
       → [{ libro:'JER', cap:1, v1:4, v2:5, desde:0, hasta:14, texto:'Jeremías 1:4-5' },
          { libro:'PSA', cap:139, v1:null, v2:null, desde:20, hasta:29, texto:'Salmo 139' }]

   Forma de una referencia: { libro (USFM), cap, v1, v2, cap2? }
     - solo capitulo («Salmo 139»):            v1 = v2 = null
     - un versiculo («Juan 13:3»):             v1 = v2 = 3
     - rango («Lucas 15:11-32»):               v1 = 11, v2 = 32
     - entre capitulos («Juan 3:16–4:2»):      cap 3, v1 16, cap2 4, v2 2
     - capitulos («Mateo 5–7»):                cap 5, cap2 7, v1 = v2 = null
     - libros de un capitulo (Abdias, Filemon, 2-3 Juan, Judas): «Judas 3» es el versiculo 3 (cap 1)
   desde/hasta son posiciones en el texto de ENTRADA tal cual llego (aunque venga en NFD, con tildes sueltas):
   texto === entrada.slice(desde, hasta).

   Separador capitulo/versiculo: «:» (con o sin espacios), «.» pegado, o «,» pegado entre cifras («Jn 3,16», «Mt 5,3-12»)
   cuando ese versiculo existe; si no existe, la coma es lista («Salmos 23,24» = 23 y 24). Con espacio, la coma siempre es
   lista: «Juan 3:16, 18» = versiculos 16 y 18; «Salmos 53, 54» = capitulos 53 y 54. «;» separa capitulos del mismo libro
   («Sal 23; 24:1-3»). Sufijos de versiculo «16a», «16b» se aceptan y se ignoran. Guion, raya, menos (−) valen como rango.
   Ordinales: 1, I, 1ra, 1a, 1.ª, Primera/Primero, 1st, First, «1 de Juan», «Primera Epístola de Juan», «Primera carta a los
   Corintios», «First Epistle of John». Si el ordinal no cuadra («Capítulo 3 de Juan 3:16»), se lee sin el.
   Se rechaza lo que no existe («Juan 99:1», «Juan 3:99»), «1 de mayo» y los numeros sueltos.

   auto:true (buscar citas en texto corrido) es conservador:
     - el nombre del libro va con mayuscula (asi «job», «acts», «numbers» en minuscula no cuentan), y el romano tambien;
     - las abreviaturas que son palabras comunes (COMUNES en libros.js: «Sal», «Is», «Job» en ingles...) solo cuentan con
       capitulo:versiculo, o si llevan punto («Sal. 23») o van entre parentesis («(Sal 23)»);
     - una lista con «y»/«and» solo sigue si lo que viene es capitulo:versiculo.
   Falsos positivos que quedan a proposito (no se distinguen sin entender la frase): un nombre de persona o de lugar que
   tambien es libro, con mayuscula y seguido de un numero («Juan 3 llego tarde», «Lucas 15 años», «Daniel 2 veces»,
   «Santiago 2» la ciudad); «Hechos 2» o «Números 6» al empezar una frase. Solo las fechas («Juan 1 de mayo») se
   descartan. El lector debe mostrar lo hallado como sugerencia, nunca reescribir el texto. */
import { LIBROS, TRONCOS, COMUNES, ORDINALES, libroDe, versosDe, nombreLibro, buscarLibro } from './libros.js';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NOMBRES = TRONCOS.map((t) => esc(t).replace(/ /g, '\\s+')).join('|');
const GUION = '[-‐‑‒–—−]';
const SEP = '(?:\\s*:\\s*|[.,])';
const NUMS = `(?<a>\\d{1,3})(?:(?<s1>${SEP})(?<v>\\d{1,3})(?:[a-c](?![\\p{L}\\d]))?)?(?:\\s*${GUION}\\s*(?<b>\\d{1,3})(?:${SEP}(?<c>\\d{1,3}))?)?(?!\\d)`;
const ORD = `(?:(?<od>[123])(?:\\.?\\s?[ªº]|ra|da|ro|do|era|er|st|nd|rd|a|o)?\\.?\\s*|(?<op>primera|primero|primer|segunda|segundo|tercera|tercero|tercer|first|second|third|iii|ii|i)\\s+)` +
  `(?:(?:epistola|carta|epistle|letter)\\s+(?:(?:de|del|a|to|of)\\s+)?(?:(?:los|las|the|san|st\\.?)\\s+)?|de\\s+)?`;
const FUENTE = `(?<![\\p{L}\\p{N}])(?:${ORD})?(?<nom>${NOMBRES})(?<punto>\\.)?(?!\\p{L})\\s*${NUMS}`;
const REF = new RegExp(FUENTE, 'dgu');
const REF_AQUI = new RegExp(FUENTE, 'dyu');
const SOLO_NOMBRE = new RegExp(`(?<nom>${NOMBRES})(?<punto>\\.)?(?!\\p{L})\\s*${NUMS}`, 'dyu');
const SIGUE = new RegExp(`(?:\\s*(?<sep>[;,&])\\s*|\\s+(?<y>y|and)\\s+)${NUMS}`, 'dyu');
const MESES = /^\s+(?:de\s+|of\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)(?!\p{L})/u;
export const MAX_TEXTO = 5000000;        // mas que esto no se lee (un libro entero cabe de sobra)
const TROZO = 100000;                    // se lee por trozos de ~100 KB cortados en un espacio
const SOLAPE = 2000;

const num = (x) => (x == null ? null : Number(x));
const esMayuscula = (c) => !!c && c !== c.toLowerCase() && c === c.toUpperCase();

/* Texto aplanado (minusculas, sin tildes, sin marcas combinadas sueltas) + mapa de cada letra aplanada a su posicion en
   el original. mapa[p.length] = original.length, asi un «hasta» incluye las tildes sueltas de la ultima letra. */
const cache = new Map();
function letraPlana(c) {
  let r = cache.get(c);
  if (r !== undefined) return r;
  const sin = c.normalize('NFD').replace(/\p{M}+/gu, '');
  const baja = (sin || c).toLowerCase();
  r = baja.length === 1 ? baja : (c.toLowerCase().length === 1 ? c.toLowerCase() : c);
  if (cache.size < 4096) cache.set(c, r);
  return r;
}
const MARCA = /\p{M}/u;
function aplanar(s) {
  let p = '';
  const mapa = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (MARCA.test(c)) continue;
    p += letraPlana(c);
    mapa.push(i);
  }
  mapa.push(s.length);
  return { p, mapa };
}

/* ¿Existe de verdad? Capitulos y versiculos contra libros.js / versos.js (el mayor de las dos versiones). */
export function esValida(ref) {
  if (!ref || typeof ref !== 'object') return false;
  const l = libroDe(ref.libro);
  if (!l) return false;
  const ent = (x) => Number.isInteger(x) && x >= 1;
  if (!ent(ref.cap) || ref.cap > l.caps) return false;
  const c2 = ref.cap2;
  if (c2 != null && (!ent(c2) || c2 <= ref.cap || c2 > l.caps)) return false;
  if (ref.v1 == null) return ref.v2 == null;
  if (!ent(ref.v1) || !ent(ref.v2)) return false;
  if (ref.v1 > versosDe(l.usfm, ref.cap)) return false;
  if (c2 != null) return ref.v2 <= versosDe(l.usfm, c2);
  return ref.v2 >= ref.v1 && ref.v2 <= versosDe(l.usfm, ref.cap);
}

/* Numeros leidos → referencia (o null). a = capitulo (o versiculo en libros de un capitulo), v = versiculo tras «:»,
   b = lo que va tras el guion, c = versiculo tras el guion. */
function armar(l, a, v, b, c) {
  const ref = { libro: l.usfm, cap: a, v1: null, v2: null };
  if (l.caps === 1 && v == null) {
    if (c != null) return null;
    ref.cap = 1; ref.v1 = a; ref.v2 = b ?? a;
  } else if (v != null) {
    ref.v1 = v;
    if (b != null && c != null) { ref.cap2 = b; ref.v2 = c; } else ref.v2 = b ?? v;
  } else if (b != null && c != null) {
    ref.v1 = 1; ref.cap2 = b; ref.v2 = c;
  } else if (b != null) ref.cap2 = b;
  if (ref.cap2 != null && ref.cap2 === ref.cap) delete ref.cap2;
  return esValida(ref) ? ref : null;
}

/* Lee los numeros de un match (NUMS) para el libro l. Si la coma pegada no da un versiculo que exista, la coma es
   lista: queda solo el capitulo y el fin retrocede hasta el. Devuelve { ref, fin } o null. */
function leerNumeros(l, g, I, fin, ctx) {
  const a = num(g.a), v = num(g.v), b = num(g.b), c = num(g.c);
  let ref = ctx ? ctx(a, v, b, c) : armar(l, a, v, b, c);
  if (!ref && g.s1 === ',') {
    ref = ctx ? ctx(a, null, null, null) : armar(l, a, null, null, null);
    fin = I.a[1];
  }
  return ref ? { ref, fin } : null;
}

/* Despues de los numeros: ni «3:16:20», ni «3.16.5», ni letras pegadas (salvo «16a»/«16b»/«16c»). Devuelve el nuevo fin o -1. */
function finLimpio(p, i) {
  if (/^\s*:\s*\d|^[.,]\d/.test(p.slice(i, i + 6))) return -1;
  const sig = p[i];
  if (sig && /\p{L}/u.test(sig)) {
    if (/[abc]/.test(sig) && !/\p{L}/u.test(p[i + 1] || '')) return i + 1;
    return -1;
  }
  return i;
}

function entreParentesis(original, i) {
  let k = i - 1;
  while (k >= 0 && /\s/.test(original[k])) k--;
  return original[k] === '(' || original[k] === '[';
}

/* Un trozo de texto. Devuelve [{ ref, desde, hasta, cadena }] con desde/hasta en el trozo original. */
function leerTrozo(original, idioma, auto) {
  const { p, mapa } = aplanar(original);
  const comunes = COMUNES[idioma];
  const salida = [];
  const sacar = (ref, d, h, cadena) => salida.push({ ref, desde: mapa[d], hasta: mapa[h], cadena });
  let cadena = 0;
  REF.lastIndex = 0;
  let m;
  while ((m = REF.exec(p))) {
    const finMatch = m.index + m[0].length;
    const g = m.groups;
    const I = m.indices.groups;
    const iNombre = I.nom[0];
    const intentos = [];
    let n = g.od ? Number(g.od) : g.op ? ORDINALES[g.op] : null;
    let desde = m.index;
    if (g.op && /^i+$/.test(g.op) && original.slice(mapa[I.op[0]], mapa[I.op[1]]) !== g.op.toUpperCase() && auto) { n = null; desde = iNombre; }
    intentos.push({ n, desde, m });
    if (n != null) {                                         // «Capítulo 3 de Juan 3:16»: sin el ordinal
      SOLO_NOMBRE.lastIndex = iNombre;
      const m2 = SOLO_NOMBRE.exec(p);
      if (m2) intentos.push({ n: null, desde: iNombre, m: m2 });
    }
    let hecho = null;
    for (const t of intentos) {
      const tg = t.m.groups, tI = t.m.indices.groups;
      const l = buscarLibro(t.n, tg.nom, idioma);
      if (!l) continue;
      if (auto && !esMayuscula(original[mapa[iNombre]])) break;
      const conVerso = tg.v != null;
      if (auto && !conVerso && comunes.has(tg.nom.replace(/\s+/g, ' ')) && !tg.punto && !entreParentesis(original, mapa[t.desde])) break;
      let fin = finLimpio(p, t.m.index + t.m[0].length);
      if (fin < 0) continue;
      const r = leerNumeros(l, tg, tI, fin);
      if (!r) continue;
      if (r.ref.v1 == null && MESES.test(p.slice(r.fin, r.fin + 20))) continue;
      hecho = { l, desde: t.desde, ...r };
      break;
    }
    if (!hecho) { REF.lastIndex = finMatch; continue; }
    cadena++;
    sacar(hecho.ref, hecho.desde, hecho.fin, cadena);

    /* la lista sigue con el mismo libro */
    const l = hecho.l;
    let ultimo = hecho.ref;
    let pos = hecho.fin;
    for (;;) {
      SIGUE.lastIndex = pos;
      const s = SIGUE.exec(p);
      if (!s) break;
      const sg = s.groups, sI = s.indices.groups;
      const sep = sg.sep || sg.y;
      const ini = sI.a[0];
      REF_AQUI.lastIndex = ini;
      if (REF_AQUI.test(p)) break;                         // «; 1 Juan 4:8» es otro libro
      const fin2 = finLimpio(p, s.index + s[0].length);
      if (fin2 < 0) break;
      let r;
      if (sg.v != null || l.caps === 1) r = leerNumeros(l, sg, sI, fin2);
      else {
        if (auto && sg.y) break;
        const capU = ultimo.cap2 ?? ultimo.cap;
        const comoVerso = ultimo.v1 != null && sep !== ';';
        r = leerNumeros(l, sg, sI, fin2, comoVerso ? (a, v, b, c) => armar(l, capU, a, b, c) : (a, v, b, c) => armar(l, a, null, b, c));
      }
      if (!r) break;
      if (r.ref.v1 == null && MESES.test(p.slice(r.fin, r.fin + 20))) break;
      sacar(r.ref, ini, r.fin, cadena);
      ultimo = r.ref;
      pos = r.fin;
    }
    REF.lastIndex = pos;
  }
  return salida;
}

export function leerReferencias(texto, opciones = {}) {
  const idioma = opciones.idioma === 'en' ? 'en' : 'es';
  const auto = !!opciones.auto;
  const original = String(texto ?? '');
  if (!original || original.length > MAX_TEXTO) return [];
  const forma = (x, base, fuente) => ({ ...x.ref, desde: base + x.desde, hasta: base + x.hasta, texto: fuente.slice(x.desde, x.hasta) });
  if (original.length <= TROZO) return leerTrozo(original, idioma, auto).map((x) => forma(x, 0, original));

  /* Texto largo: trozos cortados en un espacio, con un solape para que una cita (o su lista) no quede partida. Una lista
     se queda en el trozo donde empieza. */
  const salida = [];
  let ini = 0;
  while (ini < original.length) {
    let fin = Math.min(original.length, ini + TROZO);
    if (fin < original.length) {
      let k = fin;
      while (k > ini + TROZO / 2 && !/\s/.test(original[k])) k--;
      if (k > ini + TROZO / 2) fin = k;
    }
    const ventana = original.slice(ini, Math.min(original.length, fin + SOLAPE));
    const todas = leerTrozo(ventana, idioma, auto);
    const validas = new Set(todas.filter((x) => x.desde < fin - ini || fin === original.length).map((x) => x.cadena));
    let siguiente = fin;
    for (const x of todas) {
      if (!validas.has(x.cadena)) continue;
      salida.push(forma(x, ini, ventana));
      siguiente = Math.max(siguiente, ini + x.hasta);
    }
    ini = siguiente;
  }
  return salida;
}

/* Forma corta y estable para guardar o enlazar: 'JER.1.4-5', 'PSA.139', 'JHN.3.16-4.2', 'MAT.5-7'. */
export function canonica(ref) {
  if (!esValida(ref)) return null;
  let s = `${ref.libro}.${ref.cap}`;
  if (ref.v1 != null) s += `.${ref.v1}`;
  if (ref.cap2 != null) s += ref.v1 != null ? `-${ref.cap2}.${ref.v2}` : `-${ref.cap2}`;
  else if (ref.v1 != null && ref.v2 !== ref.v1) s += `-${ref.v2}`;
  return s;
}

/* Estricta: solo la forma que da canonica(); cualquier otra cosa → null. */
const CANONICA = /^([A-Z0-9]{3})\.([1-9]\d{0,2})(?:\.([1-9]\d{0,2}))?(?:-([1-9]\d{0,2})(?:\.([1-9]\d{0,2}))?)?$/;
export function deCanonica(s) {
  if (typeof s !== 'string' || s.length > 24) return null;
  const m = CANONICA.exec(s);
  if (!m) return null;
  const l = libroDe(m[1]);
  if (!l) return null;
  const [cap, v, b, c] = [num(m[2]), num(m[3]), num(m[4]), num(m[5])];
  const ref = { libro: l.usfm, cap, v1: null, v2: null };
  if (v == null) {
    if (c != null) return null;
    if (b != null) ref.cap2 = b;
  } else {
    ref.v1 = v;
    if (b != null && c != null) { ref.cap2 = b; ref.v2 = c; } else ref.v2 = b ?? v;
  }
  return canonica(ref) === s ? ref : null;
}

/* Para leer: «Jeremías 1:4-5», «Salmo 139», «Salmos 23-24», «Jeremiah 1:4-5». */
export function rotulo(ref, idioma = 'es') {
  if (!esValida(ref)) return null;
  const nombre = nombreLibro(ref.libro, idioma, ref.cap2 == null);
  let s = `${nombre} ${ref.cap}`;
  if (ref.v1 != null) s += `:${ref.v1}`;
  if (ref.cap2 != null) s += ref.v1 != null ? `-${ref.cap2}:${ref.v2}` : `-${ref.cap2}`;
  else if (ref.v1 != null && ref.v2 !== ref.v1) s += `-${ref.v2}`;
  return s;
}

/* Enlace a Bible Gateway con la version que el autor recomienda (NVI, RVR1960, NIV, ESV...). null si algo no cuadra.
   El nombre del libro va en el idioma de LA VERSION (una NVI se busca «Juan 3:16»; una NIV, «John 3:16»), no en el de
   la pagina. `idioma` se queda en la firma por compatibilidad y no se usa. */
export const VERSION_GATEWAY = /^[A-Z0-9-]{2,12}$/;
export const VERSIONES_GATEWAY_ES = Object.freeze(new Set(['RVR1960', 'RVR1909', 'NVI', 'LBLA', 'NBLA', 'NTV', 'DHH', 'RVC', 'RVA', 'TLA', 'PDT', 'BLP', 'NBV', 'RVA-2015', 'JBS', 'CST', 'BLPH']));
export function idiomaDeVersion(version) {
  return VERSIONES_GATEWAY_ES.has(String(version || '').trim().toUpperCase()) ? 'es' : 'en';
}
// eslint-disable-next-line no-unused-vars
export function enlaceGateway(ref, version, idioma) {
  const r = typeof ref === 'string' ? deCanonica(ref) : ref;
  if (typeof version !== 'string') return null;
  const v = version.trim().toUpperCase();
  if (!VERSION_GATEWAY.test(v)) return null;
  const etiqueta = rotulo(r, idiomaDeVersion(v));
  if (!etiqueta) return null;
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(etiqueta)}&version=${encodeURIComponent(v)}`;
}

export { LIBROS };
