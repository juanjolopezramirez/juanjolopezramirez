import { ORDEN, PASOS } from './pasos.js';
import { cartasDe } from './cartas.js';
import { servicioDe } from './servicios.js';

/* EL CALCULO. Dos cuentas distintas, y no se pisan:

     1. EN QUE PASO ESTA  —  lo dicen las cartas DERECHAS. Es donde la
        persona esta parada, la diga o no.
     2. EMET O MET        —  lo dice la DISTANCIA entre la carta izquierda
        y la derecha. Es si sabe donde esta parada.

   Se puede estar en el inicio y en Emet: pides lo del inicio y lo del
   inicio es lo que te falta. Y se puede estar en el inicio y en Met: pides
   lo del final y lo que te falta es lo primero.

   ------------------------------------------------------------------
   PSEUDOCODIGO

     ORDEN = { alef: 0, mem: 1, tav: 2 }

     funcion diagnosticar(elegidas):
         total = cuantas cartas se eligieron
         si total == 0: no hay diagnostico

         # 1 — EN QUE PASO ESTA
         cuenta = contar(c.depende) para c en elegidas
         mayor  = el valor mas alto de cuenta
         # Empate: manda el paso mas temprano. Si el inicio empata con
         # cualquier otro, manda el inicio: nadie esta en el medio y en el
         # inicio a la vez, y lo que falta primero es lo que falta.
         paso = el primero de [alef, mem, tav] cuyo cuenta == mayor

         # 2 — EMET O MET
         coinciden   = cuantas c tienen  c.quiere == c.depende
         adelantados = cuantas c tienen  ORDEN[c.quiere] > ORDEN[c.depende]
         tocados     = conjunto de c.depende

         si coinciden == total y tamaño(tocados) == 3:
             devolver EQUILIBRIO      # bien en los tres: no se vende nada

         si adelantados > coinciden:
             devolver MET             # el tejado antes que el piso
         si no:
             devolver EMET            # pide lo que le sirve

         # Nota: `quiere` POR DEBAJO de `depende` —pedir algo cuyo requisito
         # esta mas adelante— no cuenta como ir adelantado. No es Met.
         # Ni acusa ni confirma: solo no suma.
   ------------------------------------------------------------------

   NO SE ACUSA POR DEFECTO. Met solo sale si las cartas adelantadas son
   MAS que las que coinciden. En un empate se lee Emet: decirle a alguien
   que esta construyendo sobre nada es una frase seria, y solo se dice
   cuando sus propias cartas lo sostienen. */

/* A que baraja va cada rama, y en que voz se le habla.

   La marca personal usa la baraja de empresa —un deseo se dice igual lo
   firme una empresa o una persona con nombre— pero se le habla en
   reflexivo, porque detras hay una persona. */
export const RAMA = {
  mi:      { baraja: 'persona', voz: 'reflexivo' },
  negocio: { baraja: 'empresa', voz: 'tu' },
  marca:   { baraja: 'empresa', voz: 'reflexivo' }
};

export const esRama = (r) => Object.prototype.hasOwnProperty.call(RAMA, r);

/* De ids a cartas, en el orden en que se eligieron. Las que no existan se
   caen: un id viejo guardado en el navegador no puede romper la pagina. */
export function cartasElegidas(rama, ids) {
  const baraja = cartasDe(RAMA[rama]?.baraja);
  return (ids ?? []).map((id) => baraja.find((c) => c.id === id)).filter(Boolean);
}

/* 1 — EN QUE PASO ESTA. */
export function pasoDe(elegidas) {
  if (!elegidas.length) return null;
  const cuenta = { alef: 0, mem: 0, tav: 0 };
  elegidas.forEach((c) => { cuenta[c.depende] += 1; });
  const mayor = Math.max(...PASOS.map((p) => cuenta[p]));
  return PASOS.find((p) => cuenta[p] === mayor);
}

/* 2 — EMET, MET O EQUILIBRIO. */
export function lecturaDe(elegidas) {
  const total = elegidas.length;
  if (!total) return null;
  const coinciden = elegidas.filter((c) => c.quiere === c.depende).length;
  const adelantados = elegidas.filter((c) => ORDEN[c.quiere] > ORDEN[c.depende]).length;
  const tocados = new Set(elegidas.map((c) => c.depende));
  if (coinciden === total && tocados.size === 3) return 'equilibrio';
  return adelantados > coinciden ? 'met' : 'emet';
}

/* LAS CARTAS QUE SIRVEN DE PRUEBA. Como mucho dos, y las que de verdad
   sostienen lo que se acaba de decir: si el diagnostico es Met, las que
   van adelantadas —y primero la que mas se aleja—; si es Emet, las que
   coinciden. Citar una carta que no prueba nada es peor que no citar. */
export function pruebasDe(elegidas, lectura) {
  const utiles = lectura === 'met'
    ? elegidas
        .filter((c) => ORDEN[c.quiere] > ORDEN[c.depende])
        .sort((a, b) => (ORDEN[b.quiere] - ORDEN[b.depende]) - (ORDEN[a.quiere] - ORDEN[a.depende]))
    : elegidas.filter((c) => c.quiere === c.depende);
  return (utiles.length ? utiles : elegidas).slice(0, 2);
}

/* Todo junto, que es lo que pinta la pantalla del resultado. */
export function diagnosticar(rama, ids) {
  const elegidas = cartasElegidas(rama, ids);
  if (!elegidas.length) return null;
  const lectura = lecturaDe(elegidas);
  const paso = pasoDe(elegidas);
  return {
    rama,
    voz: RAMA[rama].voz,
    paso,
    lectura,
    elegidas,
    pruebas: pruebasDe(elegidas, lectura),
    servicio: lectura === 'equilibrio' ? null : servicioDe(RAMA[rama].baraja, paso)
  };
}
