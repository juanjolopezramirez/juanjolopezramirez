/* LOS PLIEGOS DE «VER COMO LIBRO». Pura: sin pagina, sin libreria. Las cuentas de los pliegos (pliegos, viaje, «Volver», barra,
   RePag/AvPag) son las mismas que hace el lector de la web y viven en UN solo sitio, scripts/lector/pliegos.js: aqui se
   re-exportan, para que el libro del Taller se abra, se cierre y gire igual que el de la web. Lo que sigue abajo es solo
   del Taller (las hojas de la mesa, las copias vivas, el grueso del canto y del lomo). */
import { paginasDe, pliegoVecino } from '../../../../lector/pliegos.js';

export {
  PILA_MAX, apilarVuelta, barraDePliego, lomoDe, paginasDe, pliegoALaVuelta, pliegoDe, pliegoDeBarra, pliegoVecino, planDeViaje, sacarVuelta, totalPliegos,
} from '../../../../lector/pliegos.js';

/* La primera hoja del contenido del libro (por su numero desde 0), o -1 si no tiene. `paginas` son las de la mesa. */
export function paginaDelContenido(paginas) {
  if (!Array.isArray(paginas)) return -1;
  return paginas.findIndex((p) => p && p.indice === true);
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

/* El grueso del libro: cuanto asoma el canto de las hojas apiladas encima de cada carton. `c` hojas de las `n`; `ancho`
   es el de una pagina en px. Siempre un numero finito y pequeño. (El del lomo, lomoDe, vive en lector/pliegos.js.) */
export function cantoDe(c, n, ancho) {
  if (!(c > 0) || !(n > 0) || !(ancho > 0)) return 0;
  return +(2 + ancho * 0.016 * Math.min(1, c / n)).toFixed(1);
}

/* Donde mira el libro cerrado: la tapa a la derecha, la contratapa a la izquierda; abierto, al centro */
export function ladoDe(i, n) {
  const v = paginasDe(i, n);
  if (v.length === 1) return i <= 0 ? 'r' : 'l';
  return 'c';
}
