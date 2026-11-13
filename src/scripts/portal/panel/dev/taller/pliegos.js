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
