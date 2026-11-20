/* LOS PLIEGOS DE UN LIBRO QUE SE HOJEA. Pura: sin pagina, sin libreria, sin nada del portal. Es la cuenta que comparten el
   lector de la web (site.js: enlace privado /vista/, libros de Recursos, cualquier pagina que abra un libro) y el
   «Ver como libro» del Taller (que la trae de aqui y la re-exporta desde taller/pliegos.js).

   Un libro con tapa se lee asi: la portada sola a la derecha; luego pares [1,2] [3,4]…; y, si el numero de
   paginas es par, la contratapa sola al final. Un pliego se nombra por su primera pagina, como lo hace la
   libreria (page-flip). */

/* Las paginas que se ven juntas en el pliego que empieza en `i` */
export function paginasDe(i, n) {
  if (!(n > 0)) return [];
  if (i <= 0) return [0];
  if (i >= n - 1 && n % 2 === 0) return [n - 1];
  return [i, i + 1].filter((x) => x < n);
}

/* El pliego (por su primera pagina) donde esta la pagina `p`; fuera de rango, el mas cercano */
export function pliegoDe(p, n) {
  if (!(n > 0) || !(p > 0)) return 0;
  if (p >= n - 1) return Math.max(0, n % 2 === 0 ? n - 1 : n - 2);
  return p % 2 ? p : p - 1;
}

/* El pliego siguiente (d > 0) o anterior (d < 0), por su primera pagina; null si no hay */
export function pliegoVecino(i, n, d) {
  const v = paginasDe(i, n);
  if (!v.length) return null;
  if (d > 0) return v[v.length - 1] >= n - 1 ? null : pliegoDe(v[v.length - 1] + 1, n);
  return v[0] <= 0 ? null : pliegoDe(v[0] - 1, n);
}

/* EL VIAJE A UNA PAGINA: de donde se esta (`desde`, un pliego por su primera pagina) a donde se quiere ir (`hacia`:
   cualquier pagina). Devuelve los pliegos que se van pasando, de uno en uno, y hacia donde:
     { dir: 1 | -1 | 0, distancia, salto, pasos }
   - `pasos`: el pliego en que cae cada hoja que gira, en orden (el ultimo es el de la pagina pedida).
   - `salto`: si hay mas pliegos que `tope`, el libro SALTA primero (sin girar) a este pliego, el que queda `tope` antes
     del destino, y solo se giran los ultimos `tope`. null si todo se gira.
   Sin paginas, o ya ahi: `dir` 0 y nada que pasar. */
export function planDeViaje(desde, hacia, n, { tope = 10 } = {}) {
  const nada = { dir: 0, distancia: 0, salto: null, pasos: [] };
  if (!(n > 0)) return nada;
  const d = pliegoDe(desde, n), h = pliegoDe(hacia, n);
  if (d === h) return nada;
  const dir = h > d ? 1 : -1, camino = [];
  /* Tope de seguridad: ningun libro tiene mas pliegos que paginas */
  for (let k = pliegoVecino(d, n, dir); k != null && camino.length <= n; k = pliegoVecino(k, n, dir)) {
    camino.push(k);
    if (k === h) break;
  }
  const maximo = Number.isFinite(tope) ? Math.max(1, Math.floor(tope)) : 10;
  if (camino.length <= maximo) return { dir, distancia: camino.length, salto: null, pasos: camino };
  const saltados = camino.length - maximo;
  return { dir, distancia: camino.length, salto: camino[saltados - 1], pasos: camino.slice(saltados) };
}

/* VOLVER: la pila de los lugares de donde se SALTO (cada uno, un pliego por su primera pagina). Es una lista que vive en la
   memoria del visor; aqui solo estan las cuentas, sin tocar la lista que llega (devuelven una nueva). */
export const PILA_MAX = 20;

/* Apila el pliego de donde se salta. Dos iguales seguidos no se repiten, y si pasa del tope se olvida el mas viejo. */
export function apilarVuelta(pila, pliego, tope = PILA_MAX) {
  const lista = Array.isArray(pila) ? pila.filter((x) => Number.isInteger(x) && x >= 0) : [];
  if (!Number.isInteger(pliego) || pliego < 0) return lista;
  if (lista.length && lista[lista.length - 1] === pliego) return lista;
  lista.push(pliego);
  const maximo = Number.isFinite(tope) ? Math.max(1, Math.floor(tope)) : PILA_MAX;
  return lista.length > maximo ? lista.slice(lista.length - maximo) : lista;
}

/* Saca el ultimo lugar al que volver. Los que son donde ya se esta se tiran: volver «a donde ya estoy» no hace nada y
   gastaria un toque. { pliego: el lugar (o null si no queda ninguno), pila: lo que sobra } */
export function sacarVuelta(pila, actual) {
  const lista = Array.isArray(pila) ? pila.filter((x) => Number.isInteger(x) && x >= 0) : [];
  while (lista.length && lista[lista.length - 1] === actual) lista.pop();
  if (!lista.length) return { pliego: null, pila: [] };
  const pliego = lista.pop();
  return { pliego, pila: lista };
}

/* LA BARRA: va de 1 a n (el numero de pagina que se ve primero). De un valor de la barra al pliego donde cae, y al reves. */
export function pliegoDeBarra(valor, n) {
  const v = Math.round(Number(valor));
  return Number.isFinite(v) ? pliegoDe(v - 1, n) : 0;
}
export function barraDePliego(pliego, n) {
  return n > 0 ? pliegoDe(pliego, n) + 1 : 1;
}

/* Diez pliegos adelante (d > 0) o atras (d < 0), o los que queden hasta el borde del libro. */
export function pliegoALaVuelta(i, n, d, k = 10) {
  let p = pliegoDe(i, n);
  for (let paso = 0; paso < k; paso++) {
    const s = pliegoVecino(p, n, d);
    if (s == null) break;
    p = s;
  }
  return p;
}

/* Cuantos pliegos tiene el libro */
export function totalPliegos(n) {
  let t = 0;
  for (let i = n > 0 ? 0 : null; i != null; i = pliegoVecino(i, n, 1)) t++;
  return t;
}

/* Hacia donde se mira al llegar a la pagina `p` cuando el libro se ve de a una hoja (el telefono): 'l' si es la
   izquierda del pliego, 'r' si es la derecha, null si el pliego es de una sola pagina (la tapa o la contratapa). */
export function miradaDe(p, n) {
  const i = pliegoDe(p, n);
  if (paginasDe(i, n).length !== 2) return null;
  return p === i ? 'l' : 'r';
}

/* DONDE ESTA EL CONTENIDO. No hay un dato guardado: se lee de los enlaces del propio libro. `hojas` es lo que ya usa el lector
   (el pages.json de tools/books.py y las ediciones del enlace privado): una lista con una entrada por pagina,
   cada una `{ text?, links?: [{ x, y, w, h, href | page }] }`, donde `page` es la hoja a la que lleva (desde 0).

   El contenido de un libro del Taller sale como enlaces internos: una fila, un salto. Asi que la hoja del contenido es la
   PRIMERA cuya lista de saltos internos lleve a por lo menos `minimo` hojas DISTINTAS (sin contar la propia hoja ni lo que
   queda fuera del libro), y de ellas la mayoria posteriores a la propia (un contenido apunta hacia delante). Con menos de eso hay duda, y la respuesta es -1: es mejor no ofrecer el boton que llevar a
   donde no es. Los enlaces de fuera (`href`) no cuentan. Devuelve el numero de la hoja (desde 0), o -1. */
export const MIN_SALTOS_CONTENIDO = 3;
export function hojaDelContenido(hojas, n = Array.isArray(hojas) ? hojas.length : 0, minimo = MIN_SALTOS_CONTENIDO) {
  if (!Array.isArray(hojas) || !(n > 0)) return -1;
  const piso = Math.max(1, Math.floor(Number(minimo)) || MIN_SALTOS_CONTENIDO);
  for (let i = 0; i < hojas.length && i < n; i++) {
    const h = hojas[i];
    const links = h && Array.isArray(h.links) ? h.links : null;
    if (!links) continue;
    const destinos = new Set();
    for (const l of links) {
      if (!l || typeof l !== 'object' || l.href) continue;
      const p = l.page;
      if (Number.isInteger(p) && p >= 0 && p < n && p !== i) destinos.add(p);
    }
    /* Un contenido apunta hacia delante: la MAYORIA de sus destinos son hojas posteriores a la suya. Unas «notas» que enlazan de
       vuelta al texto no lo son. */
    const adelante = [...destinos].filter((p) => p > i).length;
    if (destinos.size >= piso && adelante * 2 > destinos.size) return i;
  }
  return -1;
}

/* «VOLVER», SIN GASTARLO: el lugar al que llevaria el proximo «Volver» (lo mismo que sacaria `sacarVuelta`), o null si no hay
   ninguno. Solo mira: la lista queda como estaba. Sirve para decirlo en el boton: «Volver a la pág. 7». */
export function proximaVuelta(pila, actual) {
  if (!Array.isArray(pila)) return null;
  for (let i = pila.length - 1; i >= 0; i--) {
    const x = pila[i];
    if (!Number.isInteger(x) || x < 0) continue;
    if (x !== actual) return x;
  }
  return null;
}

/* LA NUMERACION QUE SE VE. La barra cuenta imagenes (de 0 a n - 1); la gente lee el numero impreso al pie de la hoja.
   - sin `offset`: cada imagen es una pagina, de la 1 a la n (la tapa es la 1).
   - con `offset` (tools/books.py lo lee del pie de las paginas): la tapa y la contratapa no llevan numero, y la imagen `x`
     lleva el `x + 1 - offset` (si da 1 o mas).
   - con `folios`: la lista ya hecha, un numero (o null) por imagen; manda sobre `offset`.
   Devuelve { folioDe(indice) → numero | null, indiceDe(folio) → indice | -1, anterior(folio) → el numero que existe igual
   o justo por debajo (o null), total (el ultimo numero), primero, ultimo }.

   Puede llegar de fuera (un libro privado trae sus datos de la funcion de borde): nada aqui crece con lo que diga un numero.
   Cada folio vale de 1 a FOLIO_MAX (lo demas no tiene numero), el libro tiene a lo sumo PAGINAS_LECTOR_MAX imagenes, y todo
   se cuenta UNA vez: un mapa folio → imagen y la lista ordenada de los folios (para buscar el de debajo, a saltos). */
export const FOLIO_MAX = 100000;
export const PAGINAS_LECTOR_MAX = 100000;
export function numeracion(n, { offset = null, folios = null } = {}) {
  const cuantas = Number.isInteger(n) && n > 0 ? Math.min(n, PAGINAS_LECTOR_MAX) : 0;
  const off = Number.isInteger(offset) && offset >= 0 && offset <= cuantas ? offset : null;
  const bueno = (f) => Number.isInteger(f) && f >= 1 && f <= FOLIO_MAX;
  const lista = new Array(cuantas);
  const donde = new Map();             // folio → la PRIMERA imagen que lo lleva
  let primero = null, ultimo = null;
  for (let x = 0; x < cuantas; x++) {
    let f;
    if (Array.isArray(folios)) f = bueno(folios[x]) ? folios[x] : null;
    else if (off == null) f = x + 1;
    else f = x > 0 && x < cuantas - 1 && x + 1 - off >= 1 ? x + 1 - off : null;
    if (f != null && !bueno(f)) f = null;
    lista[x] = f;
    if (f == null) continue;
    if (!donde.has(f)) donde.set(f, x);
    if (primero == null || f < primero) primero = f;
    if (ultimo == null || f > ultimo) ultimo = f;
  }
  const orden = [...donde.keys()].sort((a, b) => a - b);
  /* El folio que existe igual o justo por debajo de `f`: busqueda binaria, no una cuenta atras */
  const anterior = (f) => {
    if (!Number.isFinite(f) || !orden.length || f < orden[0]) return null;
    let a = 0, b = orden.length - 1;
    while (a < b) { const m = (a + b + 1) >> 1; if (orden[m] <= f) a = m; else b = m - 1; }
    return orden[a];
  };
  return {
    folioDe: (i) => (Number.isInteger(i) && i >= 0 && i < cuantas ? lista[i] : null),
    indiceDe: (f) => (bueno(f) && donde.has(f) ? donde.get(f) : -1),
    anterior,
    total: ultimo == null ? 0 : ultimo,
    primero, ultimo,
  };
}

/* «VOLVER», CON SU NOMBRE. A donde lleva el proximo «Volver» (un pliego por su primera pagina) dicho como se lee:
     { folios: '6–7' }          las paginas con numero de ese pliego (en el telefono, la que se mira primero)
     { clave: 'volverTapa' }    la tapa · { clave: 'volverContra' } la contratapa
     { clave: 'volverSolo' }    unas hojas sin numero en medio del libro (las guardas): solo «Volver»
   o null si no hay a donde. `folioDe` es el de numeracion(). */
export function rotuloDeVuelta(destino, n, folioDe, { cam = false } = {}) {
  if (!Number.isInteger(destino) || destino < 0 || !(n > 0) || destino > n - 1 || typeof folioDe !== 'function') return null;
  const pags = paginasDe(destino, n);
  const de = (lista) => lista.map(folioDe).filter((x) => x != null);
  let nums = de(cam ? pags.slice(0, 1) : pags);
  if (!nums.length && cam) nums = de(pags);
  if (nums.length) return { folios: nums.join('–') };
  if (destino === 0) return { clave: 'volverTapa' };
  /* El ultimo pliego lleva la contratapa (sola, o junto a una hoja sin numero) */
  if (pags[pags.length - 1] >= n - 1) return { clave: 'volverContra' };
  return { clave: 'volverSolo' };
}

/* LO QUE SE ESCRIBE EN «PÁG.». Solo cuentan las cifras: «p. 12» es 12, y de «4–5» se lee el 4. Devuelve
     { indice, ajustado }   la imagen a la que ir; `ajustado` es 'bajo' o 'alto' si el numero se salia del libro (se va a la
                            primera o a la ultima pagina con numero), y null si estaba dentro
     { error }              'vacio' si no se escribio nada, 'no-numero' si no hay ninguna cifra (o el libro no tiene numeros) */
export function leerPagina(texto, num) {
  const crudo = String(texto == null ? '' : texto).trim();
  if (!crudo) return { error: 'vacio' };
  const cifras = crudo.replace(/[‐-―−-].*$/, '').replace(/\D+/g, '').slice(0, 9);
  if (!cifras || !num || num.primero == null) return { error: 'no-numero' };
  const pedido = Number(cifras);
  if (pedido < num.primero) return { indice: num.indiceDe(num.primero), ajustado: 'bajo' };
  if (pedido > num.ultimo) return { indice: num.indiceDe(num.ultimo), ajustado: 'alto' };
  /* Un numero que el libro se salta (una lista de folios con huecos): el anterior que si exista */
  const f = typeof num.anterior === 'function' ? num.anterior(pedido) : null;
  const i = f == null ? -1 : num.indiceDe(f);
  if (i >= 0) return { indice: i, ajustado: null };
  return { indice: num.indiceDe(num.primero), ajustado: 'bajo' };
}

/* EN QUE IDIOMA HABLAN LOS BOTONES DEL LECTOR: el del LIBRO, no el de la pagina. Solo hay español e ingles. Si el libro no
   dice el suyo (o esta en otro), el de la pagina; y si la pagina tampoco es uno de los dos, el mas cercano: el portugues
   lee español, los demas ingles. */
export function idiomaDelLector(libro, pagina) {
  const uno = (l) => (l === 'es' || l === 'en' ? l : null);
  return uno(libro) || uno(pagina) || (pagina === 'pt' ? 'es' : 'en');
}

/* LA OTRA EDICION del mismo libro: 'es' o 'en' si el libro tiene tambien su PDF en el otro idioma, o null. `hechos` es lo que
   dice de el el indice de tools/books.py ({ es: {...}, en: {...} }); `idiomas`, los que declara su ficha (null: no se mira). */
export function otraEdicion(actual, hechos, idiomas = null) {
  const otro = actual === 'es' ? 'en' : actual === 'en' ? 'es' : null;
  if (!otro || !hechos || typeof hechos !== 'object') return null;
  if (!Object.prototype.hasOwnProperty.call(hechos, otro) || !hechos[otro]) return null;
  if (Array.isArray(idiomas) && !idiomas.includes(otro)) return null;
  return otro;
}
