import { ORDEN, PASOS } from './pasos.js';
import { cartasDe } from './cartas.js';
import { servicioDe } from './servicios.js';
import { NIVEL, cuadranteDe, LISTA_MAX, LISTA_MIN } from './juegos.js';

/* EL CALCULO. Ahora hay tres cuentas y ninguna se pisa con las otras:

     1. EN QUE PASO ESTA   — lo dicen las cartas DERECHAS de lo que le
        aprieta. Es donde esta parado, lo diga o no.
     2. EMET O MET         — lo dice la DISTANCIA entre la carta izquierda
        y la derecha. Es si sabe donde esta parado.
     3. EL DESORDEN        — lo dice la LISTA: que puso arriba y que dejo
        abajo. Es la misma pregunta que la 2, pero contestada con la mano
        en vez de con una eleccion, y por eso vale como prueba aparte.

   LA TERCERA ES LA QUE NO SE PUEDE DISCUTIR. Que una carta este adelantada
   lo decide la baraja, que la escribi yo. Que alguien ponga «que la gente
   vuelva» en PRIMERO y «saber que me hace distinto» en ALGUN DIA lo decide
   el, con el dedo, y queda en pantalla. Eso es Met dicho por su propia
   mano; lo unico que hace la pagina es leerselo de vuelta.

   ------------------------------------------------------------------
   PSEUDOCODIGO

     ORDEN = { alef: 0, mem: 1, tav: 2 }

     funcion diagnosticar(rama, urgentes, niveles):

         # QUE CARTAS MANDAN. Lo que aprieta es lo que define donde estas.
         # Si no marco nada urgente, mandan las que puso arriba en la
         # lista; y si tampoco, todas las que ordeno.
         consideradas = urgentes                     si son 3 o mas
                        si no, las de la lista con nivel importante
                        si no, todas las de la lista

         # 1 — EN QUE PASO ESTA
         cuenta = contar(c.depende) para c en consideradas
         mayor  = el valor mas alto de cuenta
         # Empate: manda el paso mas temprano. Lo que falta primero es lo
         # que falta.
         paso = el primero de [alef, mem, tav] cuyo cuenta == mayor

         # 2 — EMET O MET, por las cartas
         coinciden   = cuantas c tienen  c.quiere == c.depende
         adelantados = cuantas c tienen  ORDEN[c.quiere] > ORDEN[c.depende]
         tocados     = conjunto de c.depende

         si coinciden == total y tamaño(tocados) == 3:
             lectura = EQUILIBRIO       # bien en los tres: no se vende nada
         si no si adelantados > coinciden:
             lectura = MET
         si no:
             lectura = EMET

         # 3 — EL DESORDEN, por la lista
         arriba = cartas en PRIMERO o DESPUES
         abajo  = cartas en ALGUN DIA o NO VA
         inversiones = pares (a de arriba, b de abajo) donde
                       ORDEN[b.depende] < ORDEN[a.depende]
         # Es decir: pusiste arriba algo que depende de mas adelante y
         # dejaste abajo algo que el camino pide antes.

         # La lista puede volcar la lectura, pero solo en una direccion:
         # puede acusar de Met, nunca puede absolver. Una lista ordenada no
         # borra unas cartas adelantadas, pero una lista invertida si
         # delata a quien eligio bien por casualidad.
         si lectura == EMET y inversiones >= 2:
             lectura = MET

     LA MATRIZ sale de cruzar los dos ejes, carta a carta:
         urgente + importante  -> ahora
         importante, no urgente -> ponle fecha
         urgente, no importante -> te roba el dia
         ninguno                -> sueltalo
   ------------------------------------------------------------------ */

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

/* De ids a cartas, en el orden en que llegan. Las que no existan se caen:
   un id viejo guardado en el navegador no puede romper la pagina. */
export function cartasElegidas(rama, ids) {
  const baraja = cartasDe(RAMA[rama]?.baraja);
  return (ids ?? []).map((id) => baraja.find((c) => c.id === id)).filter(Boolean);
}

/* QUE CARTAS PASAN A LA LISTA. Las que urgen, con tope; y si urgieron muy
   pocas, se completa con las siguientes de la baraja — una lista de dos
   no tiene nada que ordenar. */
export function paraLaLista(rama, urgentes) {
  const baraja = cartasDe(RAMA[rama]?.baraja);
  const elegidas = baraja.filter((c) => urgentes.includes(c.id));
  if (elegidas.length >= LISTA_MIN) return elegidas.slice(0, LISTA_MAX);
  const resto = baraja.filter((c) => !urgentes.includes(c.id));
  return [...elegidas, ...resto.slice(0, LISTA_MIN - elegidas.length)];
}

/* 1 — EN QUE PASO ESTA. */
export function pasoDe(elegidas) {
  if (!elegidas.length) return null;
  const cuenta = { alef: 0, mem: 0, tav: 0 };
  elegidas.forEach((c) => { cuenta[c.depende] += 1; });
  const mayor = Math.max(...PASOS.map((p) => cuenta[p]));
  return PASOS.find((p) => cuenta[p] === mayor);
}

/* 2 — EMET, MET O EQUILIBRIO, por las cartas. */
export function lecturaDe(elegidas) {
  const total = elegidas.length;
  if (!total) return null;
  const coinciden = elegidas.filter((c) => c.quiere === c.depende).length;
  const adelantados = elegidas.filter((c) => ORDEN[c.quiere] > ORDEN[c.depende]).length;
  const tocados = new Set(elegidas.map((c) => c.depende));
  if (coinciden === total && tocados.size === 3) return 'equilibrio';
  return adelantados > coinciden ? 'met' : 'emet';
}

/* 3 — EL DESORDEN DE LA LISTA. Devuelve los pares que lo demuestran, el
   mas separado primero: arriba algo que depende del final, abajo algo que
   el camino pide antes. */
export function inversionesDe(lista) {
  const arriba = lista.filter((x) => NIVEL[x.nivel]?.importa);
  const abajo = lista.filter((x) => x.nivel && !NIVEL[x.nivel]?.importa);
  const pares = [];
  arriba.forEach((a) => {
    abajo.forEach((b) => {
      const salto = ORDEN[a.carta.depende] - ORDEN[b.carta.depende];
      if (salto > 0) pares.push({ arriba: a.carta, abajo: b.carta, salto });
    });
  });
  return pares.sort((x, y) => y.salto - x.salto);
}

/* LAS CARTAS QUE SIRVEN DE PRUEBA. Como mucho dos, y las que de verdad
   sostienen lo que se acaba de decir. Citar una carta que no prueba nada
   es peor que no citar. */
export function pruebasDe(elegidas, lectura) {
  const utiles = lectura === 'met'
    ? elegidas
        .filter((c) => ORDEN[c.quiere] > ORDEN[c.depende])
        .sort((a, b) => (ORDEN[b.quiere] - ORDEN[b.depende]) - (ORDEN[a.quiere] - ORDEN[a.depende]))
    : elegidas.filter((c) => c.quiere === c.depende);
  return (utiles.length ? utiles : elegidas).slice(0, 2);
}

/* Todo junto, que es lo que pinta la pantalla del resultado.

   `urgentes` son los ids que se mandaron a la derecha en el juego 1.
   `niveles` es { idDeCarta: idDeNivel } del juego 2. */
export function diagnosticar(rama, urgentes = [], niveles = {}) {
  if (!esRama(rama)) return null;
  const baraja = cartasDe(RAMA[rama].baraja);

  /* La lista, con el nivel donde quedo cada carta. */
  const lista = Object.keys(niveles)
    .map((id) => ({ carta: baraja.find((c) => c.id === id), nivel: niveles[id] }))
    .filter((x) => x.carta && NIVEL[x.nivel]);

  const urgentesCartas = baraja.filter((c) => urgentes.includes(c.id));
  const importantes = lista.filter((x) => NIVEL[x.nivel].importa).map((x) => x.carta);

  const consideradas = urgentesCartas.length >= 3
    ? urgentesCartas
    : (importantes.length ? importantes : lista.map((x) => x.carta));

  if (!consideradas.length) return null;

  const paso = pasoDe(consideradas);
  let lectura = lecturaDe(consideradas);
  const inversiones = inversionesDe(lista);

  /* La lista puede acusar, nunca absolver: dos inversiones vuelcan un Emet
     a Met, pero una lista bien ordenada no borra unas cartas adelantadas.
     El equilibrio no se toca — ahi no se esta vendiendo nada. */
  if (lectura === 'emet' && inversiones.length >= 2) lectura = 'met';

  /* La matriz, carta a carta. Solo de las que pasaron por los dos juegos:
     una carta sin nivel no tiene el segundo eje. */
  const matriz = { ahora: [], fecha: [], roba: [], suelta: [] };
  lista.forEach((x) => {
    matriz[cuadranteDe(urgentes.includes(x.carta.id), x.nivel)].push(x.carta);
  });

  return {
    rama,
    voz: RAMA[rama].voz,
    paso,
    lectura,
    consideradas,
    lista,
    matriz,
    inversiones,
    pruebas: pruebasDe(consideradas, lectura),
    servicio: lectura === 'equilibrio' ? null : servicioDe(RAMA[rama].baraja, paso)
  };
}
