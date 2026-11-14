/* LOS PLIEGOS DE «VER COMO LIBRO». Pura: sin pagina, sin libreria. Las mismas cuentas que hace el lector de
   la web (site.js: pagesOf / spreadOf), para que el libro del Taller se abra, se cierre y gire igual.

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

/* La primera hoja del contenido del libro (por su numero desde 0), o -1 si no tiene. `paginas` son las de la mesa. */
export function paginaDelContenido(paginas) {
  if (!Array.isArray(paginas)) return -1;
  return paginas.findIndex((p) => p && p.indice === true);
}

/* Cuantos pliegos tiene el libro */
export function totalPliegos(n) {
  let t = 0;
  for (let i = n > 0 ? 0 : null; i != null; i = pliegoVecino(i, n, 1)) t++;
  return t;
}

/* Las paginas que deben estar DIBUJADAS ahora: las del pliego que se ve y las de sus vecinos (lo que se ve
   al doblar una esquina). El resto del libro son hojas vacias del mismo tamaño: un libro de 300 paginas no
   puede tener 300 copias vivas. `centros` son pliegos (por su primera pagina): uno en reposo; dos mientras
   una hoja esta girando (el de donde sale y el de donde cae). */
export function ventana(centros, n, alrededor = 1) {
  const vivas = new Set();
  for (const c of [].concat(centros)) {
    for (const p of paginasDe(c, n)) vivas.add(p);
    for (const d of [-1, 1]) {
      let k = c;
      for (let paso = 0; paso < alrededor; paso++) {
        k = pliegoVecino(k, n, d);
        if (k == null) break;
        for (const p of paginasDe(k, n)) vivas.add(p);
      }
    }
  }
  return vivas;
}

/* El grueso del libro: cuanto asoma el canto de las hojas apiladas encima de cada carton y cuanto mide el
   lomo. `c` hojas de las `n`; `ancho` es el de una pagina en px. Siempre un numero finito y pequeño. */
export function cantoDe(c, n, ancho) {
  if (!(c > 0) || !(n > 0) || !(ancho > 0)) return 0;
  return +(2 + ancho * 0.016 * Math.min(1, c / n)).toFixed(1);
}
export function lomoDe(n, ancho) {
  if (!(n > 0) || !(ancho > 0)) return 0;
  return Math.round(Math.min(ancho * 0.16, Math.max(8, 4 + n * ancho * 0.0045)));
}

/* Donde mira el libro cerrado: la tapa a la derecha, la contratapa a la izquierda; abierto, al centro */
export function ladoDe(i, n) {
  const v = paginasDe(i, n);
  if (v.length === 1) return i <= 0 ? 'r' : 'l';
  return 'c';
}
