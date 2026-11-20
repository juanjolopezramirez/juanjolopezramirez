/* EL RECORRIDO DEL LECTOR: las ayudas para ir lejos en un libro largo, las mismas en el enlace privado (/vista/), en los libros
   de Recursos y en cualquier pagina que abra un libro (site.js).

   «VOLVER»: cada salto grande (una fila del contenido, un enlace de pagina, la barra, Inicio y Fin, RePag y AvPag) deja
   el lugar de donde se salio en una pila de hasta 20 (pliegos.js → apilarVuelta). «Volver» (o la tecla B) saca el ultimo y
   viaja hasta alli, sin apilar; se repite hasta vaciarla. Pasar una hoja suelta NO apila. La pila vive solo en la
   memoria (nada se guarda en el navegador) y se vacia al cerrar el libro.

   EL VIAJE: ir a otra pagina no es una sola hoja que gira; las hojas giran una tras otra, rapido (pliegos.js → planDeViaje),
   y si hay mas de diez pliegos el libro SALTA sin girar hasta diez antes del destino. El motor gira una hoja a la vez: la
   siguiente sale cuando la anterior cae. Lo que se pide con algo girando se guarda y se hace al caer (el ultimo pedido manda);
   los toques seguidos en «anterior» o «siguiente» se cuentan y giran todos juntos.

   Aqui NO hay nada de la pagina ni de la libreria: el que lo usa (site.js) pone en `motor` lo que sabe del libro. Asi se
   prueba con un motor de mentira (tools/test-taller.mjs).

   motor = {
     n()           cuantas paginas tiene el libro (0 si no hay libro)
     estado()      el estado de la libreria: 'read' | 'fold_corner' | 'flipping' | 'user_fold'… o null si no hay libro
     aqui()        el pliego donde esta el libro (por su primera pagina)
     saltar(i)     el libro pasa de golpe al pliego `i`, sin girar
     girar(d, r)   empieza a girar UNA hoja hacia d (+1 / -1); `r` es «rapido» (si hay varias seguidas)
     paso(d)       una hoja suelta, como siempre (la que ya hacia el lector)
     llego(i, m)   el viaje acabo (o ya se estaba ahi): se posa en el pliego `i`; `m`: hacia donde mirar ('l' | 'r' | null)
     empieza()     un viaje empieza  ·  acaba(i, m, forzar)  un viaje acabo (o se corto)
     cambio()      cambio la pila: hay que volver a pintar los botones
     tope()        cuantos pliegos giran de verdad en un viaje (diez; uno con movimiento reducido)
     programar(f)  hacer `f` en el cuadro que viene (por omision, requestAnimationFrame)
     ahora()       el reloj en ms (por omision, performance.now)
   } */
import { apilarVuelta, miradaDe, pliegoDe, pliegoDeBarra, pliegoVecino, planDeViaje, proximaVuelta, sacarVuelta } from './pliegos.js';

export const SEGUIDO_MS = 1500;      // lo que se mueve la barra en menos de esto es UN salto para «Volver»

export function crearRecorrido(motor) {
  const m = motor;
  const programar = m.programar || ((f) => requestAnimationFrame(f));
  const ahora = m.ahora || (() => performance.now());
  let pila = [];
  let viaje = null;        // { plan, k, parar, actual, mirar, reloj }
  let pendiente = null;    // lo que se pidio mientras algo giraba: se hace al caer la hoja
  let cola = 0;            // las hojas que se pidieron con una girando (con signo)
  let ultimaBarra = null;
  let gen = 0;             // cada vez que se cierra o se corta: lo que llega tarde se descarta

  const quieto = () => { const e = m.estado(); return e === 'read' || e === 'fold_corner'; };

  /* Donde esta el libro, o hacia donde va si hay un viaje */
  function lugar() {
    return viaje && viaje.plan.pasos.length ? viaje.plan.pasos[viaje.plan.pasos.length - 1] : m.aqui();
  }

  /* Ir a la pagina `p` (desde 0). `apilar`: guardar de donde se sale (todo salto lo hace; el propio «Volver» y lo que se suma a
     un viaje en marcha, no). `mirar`: para el telefono, a que lado del pliego se llega. */
  function irA(p, { apilar = true, mirar } = {}) {
    const n = m.n();
    if (!(n > 0) || !m.estado()) return;
    /* Pedido con algo girando: el ultimo pedido manda. La hoja de ahora termina de caer; las demas no giran.
       Un salto pedido a mitad de otro es parte de aquel: el lugar de donde salio el primero ya esta guardado. */
    if (viaje || !quieto()) {
      const opciones = { apilar: viaje ? false : apilar, mirar };
      pendiente = () => irA(p, opciones);
      if (viaje) viaje.parar = true;
      return;
    }
    const destino = pliegoDe(p, n);
    const mira = mirar === undefined ? miradaDe(p, n) : mirar;
    const plan = planDeViaje(m.aqui(), destino, n, { tope: m.tope() });
    if (!plan.pasos.length) { m.llego(destino, mira); return; }
    if (apilar) { pila = apilarVuelta(pila, m.aqui()); m.cambio(); }
    const g = gen;
    viaje = { plan, k: 0, parar: false, actual: null, mirar: mira, reloj: setTimeout(() => { if (g === gen) terminar(true); }, plan.pasos.length * 1500 + 2500) };
    m.empieza();
    /* Lo que queda lejos se salta sin girar: las hojas que giran son las ultimas */
    if (plan.salto != null) m.saltar(plan.salto);
    siguienteHoja();
  }

  /* Gira la hoja que sigue del viaje. Si ya no hay (o se pidio otra cosa), el viaje termina. */
  function siguienteHoja() {
    const v = viaje;
    if (!v) return;
    if (v.parar || v.k >= v.plan.pasos.length) { terminar(false); return; }
    v.actual = v.plan.pasos[v.k++];
    m.girar(v.plan.dir, v.plan.pasos.length > 1);
    /* Si la libreria no la giro (no habia a donde), el viaje no se queda esperando */
    if (m.estado() !== 'flipping') terminar(false);
  }

  /* El viaje acabo (o se corto). Con `forzar`, algo no llego: el libro se pone en el destino de una vez. */
  function terminar(forzar) {
    const v = viaje;
    if (!v) return;
    clearTimeout(v.reloj);
    viaje = null;
    m.acaba(v.plan.pasos[v.plan.pasos.length - 1], v.mirar, !!forzar);
    alReposo();
  }

  /* El libro esta quieto: lo que se pidio mientras giraba se hace ahora */
  function alReposo() {
    const f = pendiente;
    if (f) { pendiente = null; f(); }
    cola = 0;
  }

  /* La hoja cayo (la libreria volvio a «read»): en un viaje sale la siguiente, en el cuadro que viene (la libreria aun cierra esta) */
  function alCaer() {
    const g = gen;
    if (viaje) { const v = viaje; programar(() => { if (g === gen && viaje === v) siguienteHoja(); }); }
    else programar(() => { if (g === gen) alReposo(); });
  }

  /* Una hoja hacia d. `junta`: lo pide un boton o una tecla; si una hoja ya esta cayendo, las que se pidieron mientras tanto se
     cuentan, y al caer giran todas seguidas y rapido: apretar «anterior» varias veces no pierde toques. */
  function paso(d, junta = false) {
    if (!m.estado() || !(m.n() > 0)) return;
    if (viaje) { pendiente = () => paso(d); viaje.parar = true; return; }
    if (!quieto()) {
      if (junta && m.estado() === 'flipping') { cola += d; pendiente = pasosJuntos; }
      return;
    }
    m.paso(d);
  }

  /* Las hojas que se pidieron mientras caia una: una sola, como siempre; varias, un viaje corto (no cuenta para «Volver») */
  function pasosJuntos() {
    const k = cola;
    cola = 0;
    if (!k) return;
    const n = m.n(), desde = m.aqui();
    let destino = desde;
    for (let i = 0; i < Math.abs(k); i++) { const s = pliegoVecino(destino, n, k > 0 ? 1 : -1); if (s == null) break; destino = s; }
    if (destino === desde) return;
    if (Math.abs(k) === 1) paso(k > 0 ? 1 : -1);
    else irA(destino, { apilar: false });
  }

  /* Regresa al ultimo lugar de donde se salto, con las hojas girando rapido (y sin apilar: asi se puede repetir hasta vaciar la pila) */
  function volver() {
    if (!m.estado() || !(m.n() > 0)) return;
    if (viaje || !quieto()) {
      pendiente = volver;
      if (viaje) viaje.parar = true;
      return;
    }
    const r = sacarVuelta(pila, m.aqui());
    pila = r.pila;
    m.cambio();
    if (r.pliego == null) return;
    irA(r.pliego, { apilar: false });
  }

  /* La barra: el valor va de 1 a n. Un teclado que la mueve paso a paso es UN salto para «Volver»: lo que se mueve en menos de
     segundo y medio se suma al anterior. true si hay a donde ir. */
  function desdeBarra(valor) {
    const n = m.n();
    if (!(n > 0) || !m.estado()) return false;
    const destino = pliegoDeBarra(valor, n);
    if (destino === lugar()) {
      /* Misma hoja doble: no hay a donde viajar, pero en el telefono (una pagina a la vez) la camara se asoma al lado que toca */
      if (!viaje && quieto()) m.llego(destino, miradaDe(Math.round(Number(valor)) - 1, n));
      return false;
    }
    const t = ahora();
    const seguido = ultimaBarra != null && t - ultimaBarra < SEGUIDO_MS;
    ultimaBarra = t;
    irA(Math.round(Number(valor)) - 1, { apilar: !seguido });
    return true;
  }

  function cortar() {
    gen++;
    if (viaje) { clearTimeout(viaje.reloj); viaje = null; }
    pendiente = null;
    cola = 0;
  }

  return {
    irA, paso, volver, desdeBarra, alCaer, lugar,
    /* ¿Hay a donde volver? Un lugar que es donde ya se esta no cuenta */
    hayVuelta: (donde = m.aqui()) => pila.some((x) => x !== donde),
    /* A donde llevaria «Volver» ahora (solo mira, no saca nada), o null: para decirlo en el boton */
    proxima: (donde = m.aqui()) => proximaVuelta(pila, donde),
    pila: () => pila.slice(),
    enViaje: () => !!viaje,
    destino: () => (viaje && viaje.plan.pasos.length ? viaje.plan.pasos[viaje.plan.pasos.length - 1] : null),
    /* El sonido de la hoja: en un viaje, una de cada tres (o siempre si es de carton): un frufru, no una rafaga */
    suena: (pesada) => !viaje || !!pesada || (viaje.k - 1) % 3 === 0,
    /* El libro se vuelve a armar (cambio de tamaño): lo que giraba se corta, pero de donde se salto sigue valiendo */
    cortar,
    /* Se cierra o se abre otro libro: todo se olvida */
    reiniciar() {
      cortar();
      pila = [];
      ultimaBarra = null;
    },
    /* Si el libro se acorto, los lugares que ya no existen se tiran */
    recortar(n) { pila = pila.filter((x) => x < n); },
  };
}
