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
