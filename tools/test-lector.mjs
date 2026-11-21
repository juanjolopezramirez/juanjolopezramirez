/* LAS AYUDAS PARA RECORRER UN LIBRO EN EL LECTOR PUBLICO (Volver, la barra, Contenido, RePag/AvPag, los toques seguidos).
   Lo que no necesita navegador: las cuentas puras (src/scripts/lector/pliegos.js), el recorrido con un motor de mentira
   (src/scripts/lector/recorrido.js), que los textos esten en todos los idiomas y las reglas del archivo.
     node tools/test-lector.mjs     (tambien lo corre tools/test-taller.mjs) */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as P from '../src/scripts/lector/pliegos.js';
import * as T from '../src/scripts/portal/panel/dev/taller/pliegos.js';
import { crearRecorrido, SEGUIDO_MS } from '../src/scripts/lector/recorrido.js';
import { UI, LANGS } from '../src/i18n/ui.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => readFileSync(path.join(raiz, r), 'utf8');

let bien = 0, mal = 0;
async function ok(nombre, fn) {
  try { await fn(); bien++; } catch (e) { mal++; console.log(`  FALLA  ${nombre}\n         ${e.message}`); }
}

console.log('una sola cuenta de los pliegos');
await ok('el Taller re-exporta las mismas funciones del lector (no hay dos copias)', () => {
  for (const k of ['paginasDe', 'pliegoDe', 'pliegoVecino', 'planDeViaje', 'apilarVuelta', 'sacarVuelta', 'pliegoDeBarra', 'barraDePliego', 'pliegoALaVuelta', 'totalPliegos', 'PILA_MAX']) {
    assert.equal(T[k], P[k], k);
  }
});
await ok('el lector publico no importa nada del portal, y su pila no guarda nada en el navegador', () => {
  for (const f of ['src/scripts/lector/pliegos.js', 'src/scripts/lector/recorrido.js']) {
    const s = leer(f);
    assert.ok(!/portal\/panel|panel\/dev|taller\//.test(s.replace(/\/\*[\s\S]*?\*\//g, '')), `${f} no debe importar del portal`);
    assert.ok(!/localStorage|sessionStorage|indexedDB|innerHTML|insertAdjacentHTML|eval\(|document\.write/.test(s), `${f}: nada de almacenamiento ni HTML a mano`);
  }
  const site = leer('src/scripts/site.js');
  assert.ok(!/portal\/panel\/dev/.test(site), 'site.js no importa de portal/panel/dev');
  assert.match(site, /from '\.\/lector\/pliegos\.js'/);
  assert.match(site, /from '\.\/lector\/recorrido\.js'/);
});

console.log('donde esta el contenido');
const salto = (page, y = 0.1) => ({ x: 0.1, y, w: 0.6, h: 0.04, page });
const ext = (href = 'https://example.com/') => ({ x: 0.1, y: 0.9, w: 0.3, h: 0.04, href });
await ok('la primera hoja con tres saltos internos a hojas distintas es el contenido', () => {
  const hojas = Array.from({ length: 30 }, () => ({ text: 'x' }));
  hojas[2] = { text: 'contenido', links: [salto(4), salto(9), salto(15), salto(21)] };
  hojas[3] = { text: 'sigue', links: [salto(22), salto(23), salto(24)] };
  assert.equal(P.hojaDelContenido(hojas), 2);
  assert.equal(P.hojaDelContenido(hojas, 30), 2);
});
await ok('con menos de tres hay duda: no hay contenido', () => {
  const hojas = Array.from({ length: 10 }, () => ({ text: '' }));
  hojas[1] = { links: [salto(3), salto(5)] };
  assert.equal(P.hojaDelContenido(hojas), -1);
  hojas[1] = { links: [salto(3), salto(3), salto(3), salto(3)] };       // cuatro filas, una sola hoja: no
  assert.equal(P.hojaDelContenido(hojas), -1);
  hojas[1] = { links: [salto(3), salto(5), ext(), ext('https://example.org/')] };   // los de fuera no cuentan
  assert.equal(P.hojaDelContenido(hojas), -1);
  hojas[1] = { links: [salto(1), salto(1), salto(5), salto(6)] };      // a si misma no cuenta
  assert.equal(P.hojaDelContenido(hojas), -1);
});
await ok('lo que viene mal formado no rompe nada', () => {
  assert.equal(P.hojaDelContenido(null), -1);
  assert.equal(P.hojaDelContenido([]), -1);
  assert.equal(P.hojaDelContenido('x'), -1);
  assert.equal(P.hojaDelContenido([null, undefined, 3, { links: 'no' }, { links: [null, 5, { page: '4' }, { page: -1 }, { page: 1.5 }, { page: 99 }] }], 5), -1);
  assert.equal(P.hojaDelContenido([{ links: [salto(1), salto(2), salto(3)] }, {}, {}, {}], 0), -1);
  /* los destinos fuera del libro no cuentan */
  assert.equal(P.hojaDelContenido([{ links: [salto(1), salto(2), salto(40)] }, {}, {}], 3), -1);
});
await ok('el libro del enlace privado (hojasSeguras) y el de Recursos (pages.json) se leen igual', async () => {
  const { hojasSeguras } = await import('../src/scripts/contenido/taller/PaginasEdicion.js');
  const crudo = Array.from({ length: 12 }, (_, i) => ({ text: `hoja ${i}`, ...(i === 1 ? { links: [salto(3), salto(5), salto(7), ext('https://example.com/a')] } : {}) }));
  assert.equal(P.hojaDelContenido(crudo), 1);
  assert.equal(P.hojaDelContenido(hojasSeguras(crudo, 12), 12), 1);
  /* sin enlaces internos (el libro de pruebas de Recursos): no hay boton */
  assert.equal(P.hojaDelContenido(Array.from({ length: 12 }, (_, i) => ({ text: `hoja ${i}`, links: i === 4 ? [ext()] : undefined }))), -1);
});

await ok('un contenido apunta hacia delante; unas «notas» que enlazan de vuelta no son contenido', () => {
  const hojas = Array.from({ length: 40 }, () => ({ text: '' }));
  /* un indice normal: todo hacia delante */
  hojas[3] = { links: [salto(5), salto(10), salto(20), salto(30)] };
  assert.equal(P.hojaDelContenido(hojas), 3);
  /* notas al final: cuatro enlaces que vuelven al texto → no */
  const notas = Array.from({ length: 40 }, () => ({ text: '' }));
  notas[35] = { links: [salto(4), salto(9), salto(14), salto(19)] };
  assert.equal(P.hojaDelContenido(notas), -1);
  /* un prologo con tres referencias cruzadas mezcladas (una adelante, dos atras) → no; la mayoria manda */
  const prologo = Array.from({ length: 40 }, () => ({ text: '' }));
  prologo[10] = { links: [salto(2), salto(5), salto(25)] };
  assert.equal(P.hojaDelContenido(prologo), -1);
  /* dos adelante y una atras: la mayoria es hacia delante */
  prologo[10] = { links: [salto(2), salto(25), salto(30)] };
  assert.equal(P.hojaDelContenido(prologo), 10);
  /* si las notas vienen despues de un indice de verdad, gana el indice (la primera hoja que cumple) */
  notas[2] = { links: [salto(6), salto(12), salto(24)] };
  assert.equal(P.hojaDelContenido(notas), 2);
  /* la mitad justa no basta */
  prologo[10] = { links: [salto(2), salto(5), salto(25), salto(30)] };
  assert.equal(P.hojaDelContenido(prologo), -1);
});

console.log('hacia donde se mira al llegar');
await ok('miradaDe: izquierda o derecha del pliego, o nada si va de una hoja', () => {
  assert.equal(P.miradaDe(3, 20), 'l');
  assert.equal(P.miradaDe(4, 20), 'r');
  assert.equal(P.miradaDe(0, 20), null);
  assert.equal(P.miradaDe(19, 20), null);          // la contratapa sola (par)
  assert.equal(P.miradaDe(18, 21), 'r');
  assert.equal(P.miradaDe(5, 0), null);
});

/* ---- el recorrido, con un libro de mentira ---- */
function libro(n, { tope = 10, t0 = 0 } = {}) {
  const e = { pos: 0, estado: 'read', vuelo: null, saltos: [], girados: [], rapidas: [], tareas: [], llegos: [], acabas: [], cambios: 0, empieza: 0, t: t0 };
  const motor = {
    n: () => n,
    estado: () => e.estado,
    aqui: () => e.pos,
    saltar(i) { e.saltos.push(i); e.pos = i; },
    girar(d, rapida) {
      const v = P.pliegoVecino(e.pos, n, d);
      if (v == null) return;
      e.estado = 'flipping'; e.vuelo = v; e.girados.push(v); e.rapidas.push(!!rapida);
    },
    paso(d) { motor.girar(d, false); },
    llego(i, m) { e.llegos.push([i, m]); },
    empieza() { e.empieza++; },
    acaba(i, m, forzar) { e.acabas.push([i, m, forzar]); },
    cambio() { e.cambios++; },
    tope: () => tope,
    programar: (f) => e.tareas.push(f),
    ahora: () => e.t,
  };
  const rec = crearRecorrido(motor);
  const correr = () => { while (e.tareas.length) e.tareas.shift()(); };
  /* La hoja que gira cae: la libreria vuelve a «read» y avisa */
  const cae = () => { assert.equal(e.estado, 'flipping'); e.pos = e.vuelo; e.vuelo = null; e.estado = 'read'; rec.alCaer(); correr(); };
  /* Deja caer todo lo que gira hasta que el libro queda quieto */
  const todo = () => { let guarda = 0; while (e.estado === 'flipping' && guarda++ < 500) cae(); correr(); return e.pos; };
  return { e, rec, motor, cae, todo, correr };
}

console.log('el viaje y «Volver»');
await ok('ir lejos salta y gira solo los ultimos diez, rapido, y llega al pliego pedido', () => {
  const L = libro(200);
  L.rec.irA(150);
  assert.equal(L.e.saltos.length, 1, 'un salto sin girar');
  assert.equal(P.totalPliegos(200) > 10, true);
  assert.equal(L.todo(), P.pliegoDe(150, 200));
  assert.equal(L.e.girados.length, 10, 'giran diez');
  assert.ok(L.e.rapidas.every(Boolean), 'rapidas');
  assert.equal(L.e.empieza, 1);
  assert.deepEqual(L.e.acabas.map((a) => a[2]), [false]);
  L.rec.reiniciar();
});
await ok('una hoja cerca gira normal (no rapida) y sin salto', () => {
  const L = libro(40);
  L.rec.irA(1);
  assert.equal(L.e.saltos.length, 0);
  assert.deepEqual(L.e.rapidas, [false]);
  L.rec.reiniciar();
});
await ok('«Volver» repetido deshace los saltos de uno en uno, sin apilar, hasta vaciar la pila', () => {
  const L = libro(200);
  const sitios = [60, 120, 180];
  const salidas = [];
  for (const s of sitios) { salidas.push(L.e.pos); L.rec.irA(s); L.todo(); }
  assert.deepEqual(L.rec.pila(), salidas, 'de donde se salto cada vez');
  assert.equal(L.rec.hayVuelta(), true);
  for (let i = sitios.length - 1; i >= 0; i--) {
    L.rec.volver(); L.todo();
    assert.equal(L.e.pos, salidas[i], `volvio a ${salidas[i]}`);
  }
  assert.equal(L.rec.hayVuelta(), false);
  assert.deepEqual(L.rec.pila(), []);
  const antes = L.e.pos; L.rec.volver(); L.todo();
  assert.equal(L.e.pos, antes, 'vacia: no hace nada');
  L.rec.reiniciar();
});
await ok('la pila guarda veinte: el mas viejo se olvida', () => {
  const L = libro(400);
  for (let i = 0; i < 30; i++) { L.rec.irA(i % 2 ? 11 : 301 + 2 * i); L.todo(); }
  assert.ok(L.rec.pila().length <= P.PILA_MAX, `${L.rec.pila().length}`);
  assert.equal(L.rec.pila().length, P.PILA_MAX);
  L.rec.reiniciar();
});
await ok('dos saltos desde el mismo lugar seguidos no se repiten en la pila', () => {
  const L = libro(100);
  L.rec.irA(60); L.todo();
  L.rec.volver(); L.todo();
  L.rec.irA(60); L.todo();
  assert.deepEqual(L.rec.pila(), [0]);
  L.rec.reiniciar();
});
await ok('pasar una hoja suelta no apila', () => {
  const L = libro(40);
  L.rec.paso(1, true); L.todo();
  L.rec.paso(1, true); L.todo();
  L.rec.paso(-1, true); L.todo();
  assert.deepEqual(L.rec.pila(), []);
  assert.equal(L.rec.hayVuelta(), false);
});
await ok('un lugar que es donde ya se esta no cuenta como a donde volver', () => {
  const L = libro(100);
  L.rec.irA(40); L.todo();            // pila: [0]
  assert.equal(L.rec.hayVuelta(40), true);
  assert.equal(L.rec.hayVuelta(0), false, 'estando en 0 no hay a donde volver');
  L.rec.reiniciar();
});
await ok('lo que se pide con un viaje en marcha: el ultimo manda, y de donde salio el primero ya esta guardado', () => {
  const L = libro(300);
  L.rec.irA(200);                      // pila [0]
  L.cae(); L.cae();                    // dos hojas
  L.rec.irA(40);                       // se pide otra cosa
  L.todo();
  assert.equal(L.e.pos, P.pliegoDe(40, 300));
  assert.deepEqual(L.rec.pila(), [0], 'solo el lugar de donde salio el primero');
  L.rec.reiniciar();
});
await ok('«Volver» en pleno viaje frena y regresa al lugar de salida', () => {
  const L = libro(300);
  L.rec.irA(250);
  L.cae();
  L.rec.volver();
  L.todo();
  assert.equal(L.e.pos, 0);
  assert.equal(L.rec.hayVuelta(), false);
});
await ok('con movimiento reducido (tope 1) salta y gira una sola hoja', () => {
  const L = libro(100, { tope: 1 });
  L.rec.irA(80);
  assert.equal(L.e.saltos.length, 1);
  assert.equal(L.todo(), P.pliegoDe(80, 100));
  assert.equal(L.e.girados.length, 1);
  assert.deepEqual(L.e.rapidas, [false]);
  L.rec.reiniciar();
});
await ok('si la libreria no gira la hoja, el viaje no se queda esperando', () => {
  const L = libro(40);
  L.motor.girar = () => {};            // no gira nada: el estado sigue en «read»
  L.rec.irA(20);
  assert.equal(L.rec.enViaje(), false);
  assert.equal(L.e.acabas.length, 1);
});
await ok('cerrar el libro (reiniciar) olvida la pila y lo que giraba', () => {
  const L = libro(100);
  L.rec.irA(80);
  L.cae();
  L.rec.reiniciar();
  assert.equal(L.rec.enViaje(), false);
  assert.deepEqual(L.rec.pila(), []);
  L.e.estado = 'read';
  L.correr();
  assert.equal(L.e.pos < P.pliegoDe(80, 100), true, 'nada sigue girando solo');
});
await ok('cortar (cambio de tamaño) conserva la pila', () => {
  const L = libro(100);
  L.rec.irA(80); L.todo();
  L.rec.cortar();
  assert.deepEqual(L.rec.pila(), [0]);
  L.rec.recortar(50);
  assert.deepEqual(L.rec.pila(), [0]);
  L.rec.recortar(0);
  assert.deepEqual(L.rec.pila(), []);
});

console.log('toques seguidos, barra y RePag/AvPag');
await ok('toques seguidos en «siguiente» mientras gira una hoja se cuentan y giran juntos (no apilan)', () => {
  const L = libro(60);
  L.rec.paso(1, true);                 // empieza a girar
  L.rec.paso(1, true); L.rec.paso(1, true); L.rec.paso(1, true);      // tres mas, con una girando
  assert.equal(L.e.girados.length, 1);
  L.todo();
  assert.equal(L.e.pos, P.pliegoDe(1 + 2 + 2 + 2 + 1 - 1, 60) , 'cuatro pliegos adelante');
  assert.equal(L.e.pos, 7);
  assert.deepEqual(L.rec.pila(), [], 'no cuenta para «Volver»');
});
await ok('toques seguidos hacia atras, y se detienen en el borde del libro', () => {
  const L = libro(20);
  L.rec.irA(8); L.todo();              // pliego 7
  L.rec.paso(-1, true);
  for (let i = 0; i < 30; i++) L.rec.paso(-1, true);
  L.todo();
  assert.equal(L.e.pos, 0);
});
await ok('un toque suelto con una hoja girando, sin `junta` (un clic en la hoja), no se cuenta', () => {
  const L = libro(30);
  L.rec.paso(1, true);
  L.rec.paso(1, false);
  L.todo();
  assert.equal(L.e.pos, 1);
});
await ok('la barra: se suelta, viaja; mover varias veces seguidas con el teclado es UN salto', () => {
  const L = libro(120);
  assert.equal(L.rec.desdeBarra(1), false, 'ya esta ahi');
  assert.deepEqual(L.e.llegos.pop(), [0, null], 'la tapa va sola: no hay lado al que mirar');
  L.rec.irA(51); L.todo();
  L.e.llegos.length = 0;
  assert.equal(L.rec.desdeBarra(53), false, 'misma hoja doble (52 y 53): no viaja, solo mira al lado que toca');
  assert.deepEqual(L.e.llegos.pop(), [51, 'r']);
  assert.equal(L.rec.desdeBarra(52), false);
  assert.deepEqual(L.e.llegos.pop(), [51, 'l']);
  L.rec.reiniciar();
  L.e.pos = 0;
  assert.equal(L.rec.desdeBarra(50), true);
  L.todo();
  assert.equal(L.e.pos, P.pliegoDeBarra(50, 120));
  L.e.t += 100;
  assert.equal(L.rec.desdeBarra(52), true);          // teclado: otro paso a los 100 ms
  L.todo();
  L.e.t += 100;
  assert.equal(L.rec.desdeBarra(54), true);
  L.todo();
  assert.deepEqual(L.rec.pila(), [0], 'un solo salto desde el inicio');
  L.e.t += SEGUIDO_MS + 10;
  assert.equal(L.rec.desdeBarra(100), true);         // pasado el segundo y medio: otro salto
  L.todo();
  assert.equal(L.rec.pila().length, 2);
  L.rec.reiniciar();
});
await ok('RePag y AvPag: diez pliegos desde donde va el libro', () => {
  const L = libro(200);
  L.rec.irA(P.pliegoALaVuelta(L.e.pos, 200, 1)); L.todo();
  assert.equal(L.e.pos, 19, 'diez pliegos son veinte paginas');
  L.rec.irA(P.pliegoALaVuelta(L.rec.lugar(), 200, 1)); L.todo();
  assert.equal(L.e.pos, 39);
  L.rec.irA(P.pliegoALaVuelta(L.e.pos, 200, -1)); L.todo();
  assert.equal(L.e.pos, 19);
  /* y despues de cada salto, anterior y siguiente siguen sirviendo */
  L.rec.paso(-1, true); L.todo();
  assert.equal(L.e.pos, 17);
  L.rec.paso(1, true); L.todo();
  assert.equal(L.e.pos, 19);
  L.rec.irA(0); L.todo();
  assert.equal(L.e.pos, 0);
  L.rec.reiniciar();
});
await ok('Inicio y Fin viajan y dejan volver', () => {
  const L = libro(100);
  L.rec.irA(99); L.todo();
  assert.equal(L.e.pos, 99);
  L.rec.irA(0); L.todo();
  assert.equal(L.e.pos, 0);
  L.rec.volver(); L.todo();
  assert.equal(L.e.pos, 99);
  L.rec.volver(); L.todo();
  assert.equal(L.e.pos, 0);
  L.rec.reiniciar();
});
await ok('el sonido en un viaje: una hoja de cada tres, las de carton siempre', () => {
  const L = libro(100);
  assert.equal(L.rec.suena(false), true, 'fuera de un viaje siempre');
  L.rec.irA(40);
  const dicho = [];
  for (let i = 0; i < 6 && L.e.estado === 'flipping'; i++) { dicho.push(L.rec.suena(false)); L.cae(); }
  assert.deepEqual(dicho.slice(0, 4), [true, false, false, true]);
  assert.equal(L.rec.suena(true), true);
  L.todo();
  L.rec.reiniciar();
});

console.log('la numeracion que se ve y el campo «Pág.»');
await ok('numeracion sin offset: cada imagen es una pagina, de la 1 a la n', () => {
  const N = P.numeracion(11);
  assert.equal(N.total, 11); assert.equal(N.primero, 1); assert.equal(N.ultimo, 11);
  assert.equal(N.folioDe(0), 1); assert.equal(N.folioDe(10), 11);
  assert.equal(N.folioDe(11), null); assert.equal(N.folioDe(-1), null); assert.equal(N.folioDe(1.5), null);
  assert.equal(N.indiceDe(7), 6); assert.equal(N.indiceDe(12), -1); assert.equal(N.indiceDe(0), -1);
});
await ok('numeracion con offset: tapa y contratapa sin numero, y lo de antes del 1 tampoco', () => {
  const N = P.numeracion(12, { offset: 2 });          // tapa, guarda, 1 … 9, contratapa
  assert.equal(N.folioDe(0), null); assert.equal(N.folioDe(1), null);
  assert.equal(N.folioDe(2), 1); assert.equal(N.folioDe(10), 9); assert.equal(N.folioDe(11), null);
  assert.equal(N.total, 9); assert.equal(N.indiceDe(1), 2); assert.equal(N.indiceDe(9), 10); assert.equal(N.indiceDe(10), -1);
  /* la misma cuenta que hacia el lector: x + 1 - off, y el total n - 1 - off */
  for (const [n, off] of [[10, 1], [11, 1], [40, 3], [41, 3]]) {
    const M = P.numeracion(n, { offset: off });
    assert.equal(M.total, n - 1 - off, `${n}/${off}`);
    assert.equal(M.folioDe(off), 1); assert.equal(M.folioDe(n - 1), null); assert.equal(M.folioDe(0), null);
  }
});
await ok('numeracion con una lista de folios: manda sobre el offset; sin paginas no hay nada', () => {
  const N = P.numeracion(5, { offset: 1, folios: [null, 1, 2, 'x', 4] });
  assert.deepEqual([0, 1, 2, 3, 4].map(N.folioDe), [null, 1, 2, null, 4]);
  assert.equal(N.total, 4); assert.equal(N.indiceDe(4), 4); assert.equal(N.indiceDe(3), -1);
  const V = P.numeracion(0);
  assert.equal(V.total, 0); assert.equal(V.primero, null); assert.equal(V.folioDe(0), null);
  assert.deepEqual(P.leerPagina('3', V), { error: 'no-numero' });
});
await ok('leerPagina: solo cifras, «p. 12» vale, de «4–5» se lee el 4', () => {
  const N = P.numeracion(11);
  assert.deepEqual(P.leerPagina('7', N), { indice: 6, ajustado: null });
  assert.deepEqual(P.leerPagina(' p. 10 ', N), { indice: 9, ajustado: null });
  assert.deepEqual(P.leerPagina('4–5', N), { indice: 3, ajustado: null });
  assert.deepEqual(P.leerPagina('4-5', N), { indice: 3, ajustado: null });
  assert.deepEqual(P.leerPagina('6—7', N), { indice: 5, ajustado: null });
  assert.deepEqual(P.leerPagina(7, N), { indice: 6, ajustado: null });
});
await ok('leerPagina: fuera del libro se ajusta a la primera o a la ultima; «0» es bajo', () => {
  const N = P.numeracion(11);
  assert.deepEqual(P.leerPagina('99', N), { indice: 10, ajustado: 'alto' });
  assert.deepEqual(P.leerPagina('0', N), { indice: 0, ajustado: 'bajo' });
  assert.deepEqual(P.leerPagina('000', N), { indice: 0, ajustado: 'bajo' });
  assert.deepEqual(P.leerPagina('99999999999999', N), { indice: 10, ajustado: 'alto' });
  const O = P.numeracion(12, { offset: 2 });
  assert.deepEqual(P.leerPagina('1', O), { indice: 2, ajustado: null });
  assert.deepEqual(P.leerPagina('9', O), { indice: 10, ajustado: null });
  assert.deepEqual(P.leerPagina('10', O), { indice: 10, ajustado: 'alto' }, 'la contratapa no tiene numero: se queda en la ultima con numero');
  assert.deepEqual(P.leerPagina('0', O), { indice: 2, ajustado: 'bajo' });
  /* un hueco en la lista: el anterior que exista */
  assert.deepEqual(P.leerPagina('3', P.numeracion(5, { folios: [null, 1, 2, null, 4] })), { indice: 2, ajustado: null });
});
await ok('leerPagina: vacio y letras son errores distintos', () => {
  const N = P.numeracion(11);
  assert.deepEqual(P.leerPagina('', N), { error: 'vacio' });
  assert.deepEqual(P.leerPagina('   ', N), { error: 'vacio' });
  assert.deepEqual(P.leerPagina(null, N), { error: 'vacio' });
  assert.deepEqual(P.leerPagina('abc', N), { error: 'no-numero' });
  assert.deepEqual(P.leerPagina('-3', N), { error: 'no-numero' });
  assert.deepEqual(P.leerPagina('—', N), { error: 'no-numero' });
});
await ok('el campo cae en el pliego correcto con numero par e impar de paginas', () => {
  for (const n of [10, 11]) {
    const N = P.numeracion(n);
    for (let f = 1; f <= n; f++) {
      const r = P.leerPagina(String(f), N);
      assert.ok(P.paginasDe(P.pliegoDe(r.indice, n), n).includes(f - 1), `${n}: pag ${f}`);
    }
    assert.equal(P.pliegoDe(P.leerPagina('999', N).indice, n), P.pliegoDe(n - 1, n));
  }
});
await ok('folios hostiles: enormes, negativos, no enteros, repetidos y listas largas responden rapido y con sentido', () => {
  const t0 = performance.now();
  /* numeros enormes: no tienen numero (no se cuenta hasta ellos) */
  const A = P.numeracion(6, { folios: [1, 2, 1e15, Number.MAX_SAFE_INTEGER, 5, 6] });
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(A.folioDe), [1, 2, null, null, 5, 6]);
  assert.equal(A.total, 6);
  assert.deepEqual(P.leerPagina('4', A), { indice: 1, ajustado: null }, 'el 4 no esta: el de debajo que si (el 2)');
  assert.deepEqual(P.leerPagina('999999999', A), { indice: 5, ajustado: 'alto' });
  /* un solo folio en el tope y un pedido en el tope: nada de cuenta atras */
  const B = P.numeracion(3, { folios: [1, null, P.FOLIO_MAX] });
  assert.deepEqual(P.leerPagina(String(P.FOLIO_MAX - 1), B), { indice: 0, ajustado: null });
  assert.equal(P.numeracion(2, { folios: [P.FOLIO_MAX + 1, 2] }).folioDe(0), null);
  /* negativos, cero, fracciones, texto, NaN, Infinity: sin numero */
  const C = P.numeracion(8, { folios: [-1, 0, 1.5, '3', NaN, Infinity, null, 4] });
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map(C.folioDe), [null, null, null, null, null, null, null, 4]);
  assert.equal(C.primero, 4); assert.equal(C.ultimo, 4);
  /* repetidos: el numero lleva a la PRIMERA imagen que lo tiene */
  const D = P.numeracion(4, { folios: [2, 2, 3, 3] });
  assert.equal(D.indiceDe(2), 0); assert.equal(D.indiceDe(3), 2);
  /* una lista de un millon (mas larga que el libro, y un libro de un millon de hojas) */
  const largo = Array.from({ length: 1e6 }, (_, i) => (i % 7 === 0 ? null : i + 1));
  const E = P.numeracion(11, { folios: largo });
  assert.equal(E.total, 11);
  const F = P.numeracion(1e6, { folios: largo });
  assert.ok(F.total <= P.FOLIO_MAX && F.ultimo === P.FOLIO_MAX, 'los folios por encima del tope no cuentan');
  assert.deepEqual(P.leerPagina('99999', F), { indice: 99998, ajustado: null });
  assert.equal(F.folioDe(P.PAGINAS_LECTOR_MAX), null, 'mas imagenes que el tope: no se cuentan');
  /* un offset fuera de sitio no rompe nada */
  assert.equal(P.numeracion(5, { offset: -3 }).total, 5);
  assert.equal(P.numeracion(5, { offset: 1e9 }).total, 5);
  assert.ok(performance.now() - t0 < 3000, `rapido (${Math.round(performance.now() - t0)} ms)`);
});
await ok('el rotulo de «Volver»: numero impreso, tapa, contratapa o solo «Volver» para las guardas', () => {
  const N = P.numeracion(12, { offset: 2 });          // tapa, guarda, 1 … 9, contratapa
  assert.deepEqual(P.rotuloDeVuelta(0, 12, N.folioDe), { clave: 'volverTapa' });
  assert.deepEqual(P.rotuloDeVuelta(1, 12, N.folioDe), { folios: '1' }, 'guarda + pag 1: dice la 1');
  assert.deepEqual(P.rotuloDeVuelta(1, 12, N.folioDe, { cam: true }), { folios: '1' }, 'en el telefono, si la de la izquierda no lleva numero, la otra');
  assert.deepEqual(P.rotuloDeVuelta(5, 12, N.folioDe), { folios: '4–5' });
  assert.deepEqual(P.rotuloDeVuelta(5, 12, N.folioDe, { cam: true }), { folios: '4' });
  assert.deepEqual(P.rotuloDeVuelta(11, 12, N.folioDe), { clave: 'volverContra' });
  /* unas guardas sin numero en medio del libro: ni tapa ni contratapa */
  const G = P.numeracion(10, { folios: [null, 1, 2, null, null, 3, 4, 5, 6, null] });
  assert.deepEqual(P.rotuloDeVuelta(3, 10, G.folioDe), { clave: 'volverSolo' });
  /* libro impar: el ultimo pliego lleva la contratapa junto a una hoja sin numero */
  const H = P.numeracion(11, { folios: [null, 1, 2, 3, 4, 5, 6, 7, 8, null, null] });
  assert.deepEqual(P.rotuloDeVuelta(9, 11, H.folioDe), { clave: 'volverContra' });
  assert.equal(P.rotuloDeVuelta(null, 11, H.folioDe), null);
  assert.equal(P.rotuloDeVuelta(20, 11, H.folioDe), null);
  /* sin offset (Ahavá): la tapa es la 1 */
  const S = P.numeracion(11);
  assert.deepEqual(P.rotuloDeVuelta(0, 11, S.folioDe), { folios: '1' });
  assert.deepEqual(P.rotuloDeVuelta(1, 11, S.folioDe), { folios: '2–3' });
  for (const k of ['volverTapa', 'volverContra', 'volverSolo']) for (const l of ['es', 'en']) assert.ok(UI[l]['lector.' + k], `${l} lector.${k}`);
});
await ok('proximaVuelta mira sin sacar, y dice lo mismo que sacarVuelta', () => {
  const pila = [1, 5, 9, 9];
  assert.equal(P.proximaVuelta(pila, 9), 5);
  assert.equal(P.proximaVuelta(pila, 3), 9);
  assert.equal(P.proximaVuelta([7, 7], 7), null);
  assert.equal(P.proximaVuelta([], 0), null);
  assert.equal(P.proximaVuelta(null, 0), null);
  assert.deepEqual(pila, [1, 5, 9, 9], 'no toca la lista');
  for (const [l, a] of [[[1, 5, 9, 9], 9], [[1, 5], 3], [[4, 4], 4], [[], 1], [[0, 3, 0], 0]]) {
    assert.equal(P.proximaVuelta(l, a), P.sacarVuelta(l, a).pliego, JSON.stringify([l, a]));
  }
});
await ok('recorrido.proxima(): dice a donde iria «Volver» y no gasta la pila', () => {
  let aqui = 0, estado = 'read';
  const rec = crearRecorrido({
    n: () => 20, estado: () => estado, aqui: () => aqui, saltar: (i) => { aqui = i; },
    girar() { estado = 'flipping'; }, paso() {}, llego() {}, empieza() {}, acaba() {}, cambio() {}, tope: () => 10,
    programar: (f) => f(), ahora: () => 0,
  });
  assert.equal(rec.proxima(), null);
  rec.irA(7);                                  // sale del pliego 0
  assert.equal(rec.proxima(7), 0);
  assert.equal(rec.proxima(7), 0, 'mirar dos veces da lo mismo');
  assert.deepEqual(rec.pila(), [0]);
  assert.equal(rec.proxima(0), null, 'donde ya se esta no cuenta');
  assert.equal(rec.hayVuelta(7), true);
});
await ok('el idioma del lector es el del libro; si no lo dice, el de la pagina o el mas cercano', () => {
  assert.equal(P.idiomaDelLector('en', 'es'), 'en');
  assert.equal(P.idiomaDelLector('es', 'fr'), 'es');
  assert.equal(P.idiomaDelLector(undefined, 'en'), 'en');
  assert.equal(P.idiomaDelLector('all', 'es'), 'es');
  assert.equal(P.idiomaDelLector(null, 'pt'), 'es');
  assert.equal(P.idiomaDelLector('de', 'fr'), 'en');
  assert.equal(P.idiomaDelLector('pt', 'it'), 'en');
  assert.equal(P.idiomaDelLector(), 'en');
});
await ok('la otra edicion: solo si el libro tiene su PDF en el otro idioma', () => {
  assert.equal(P.otraEdicion('es', { es: { pages: 11 } }), null);
  assert.equal(P.otraEdicion('es', { es: {}, en: { pages: 11 } }), 'en');
  assert.equal(P.otraEdicion('en', { es: { pages: 3 }, en: { pages: 3 } }, ['es', 'en']), 'es');
  assert.equal(P.otraEdicion('en', { es: { pages: 3 }, en: { pages: 3 } }, ['en']), null);
  assert.equal(P.otraEdicion('pt', { es: {}, en: {} }), null);
  assert.equal(P.otraEdicion('es', null), null);
  assert.equal(P.otraEdicion('es', Object.create({ en: { pages: 1 } })), null, 'solo claves propias');
});

console.log('los textos, en todos los idiomas');
const CLAVES = ['a11y.bookPrevHelp', 'a11y.bookNextHelp', 'a11y.bookBack', 'a11y.bookContents', 'a11y.bookSlider', 'book.back', 'book.toContents', 'book.sliderCover', 'book.sliderBack', 'book.pageOf'];
await ok('las claves nuevas estan en todos los idiomas, con texto y sin dejar un idioma a medias', () => {
  assert.ok(LANGS.length >= 5);
  for (const l of LANGS) {
    for (const k of CLAVES) assert.ok(typeof UI[l][k] === 'string' && UI[l][k].trim().length > 1, `${l} · ${k}`);
    assert.match(UI[l]['book.pageOf'], /\{n\}.*\{t\}/, `${l}: Pagina {n} de {t}`);
  }
  assert.equal(UI.es['book.back'], 'Volver');
  assert.equal(UI.es['book.toContents'], 'Contenido');
  assert.equal(UI.es['a11y.bookSlider'], 'Recorrer el libro');
});
await ok('todos los idiomas tienen las mismas claves de libro que el español', () => {
  const claves = (l) => Object.keys(UI[l]).filter((k) => /^(book|a11y\.book)/.test(k));
  const es = new Set(claves('es'));
  for (const l of LANGS) {
    const otra = new Set(claves(l));
    for (const k of es) assert.ok(otra.has(k), `${l} no tiene ${k}`);
  }
});

await ok('ui.js: ninguna clave repetida dentro de un idioma (la segunda taparia a la primera)', () => {
  const src = leer('src/i18n/ui.js');
  const cortes = [...src.matchAll(/^ {4}([a-z]{2}): \{$/gm)];
  assert.equal(cortes.length, LANGS.length, 'un bloque por idioma');
  for (let i = 0; i < cortes.length; i++) {
    const bloque = src.slice(cortes[i].index, i + 1 < cortes.length ? cortes[i + 1].index : src.length);
    const vistas = new Set();
    for (const m of bloque.matchAll(/^ {6}'([^']+)':/gm)) {
      assert.ok(!vistas.has(m[1]), `${cortes[i][1]}: la clave '${m[1]}' esta repetida`);
      vistas.add(m[1]);
    }
    assert.ok(vistas.size > 100, `${cortes[i][1]}: se leyeron las claves`);
  }
});
await ok('book.contents (el titulo del indice del libro de TEXTO) conserva su texto de siempre', () => {
  const antes = { en: 'In this book', es: 'En este libro', pt: 'Neste livro', fr: 'Dans ce livre', it: 'In questo libro' };
  for (const l of LANGS) assert.equal(UI[l]['book.contents'], antes[l], l);
  /* y el boton del lector en PDF usa su propia clave, en el idioma del libro (site.js la pone con tl) */
  assert.match(leer('src/scripts/site.js'), /tl\('contenido'\)/);
  assert.equal(UI.es['lector.contenido'], 'Contenido');
  assert.ok(!/t\('book\.contents'\)/.test(leer('src/components/Panels.astro')));
});
await ok('las palabras del lector (lector.*) estan en español e ingles, enteras, y SOLO ahi', () => {
  const claves = (l) => Object.keys(UI[l]).filter((k) => k.startsWith('lector.'));
  const es = claves('es'), en = claves('en');
  assert.ok(es.length >= 30, 'hay palabras del lector');
  assert.deepEqual([...es].sort(), [...en].sort(), 'las mismas claves en es y en');
  for (const l of ['es', 'en']) for (const k of claves(l)) assert.ok(typeof UI[l][k] === 'string' && UI[l][k].trim().length > 0, `${l} · ${k}`);
  for (const l of LANGS.filter((x) => x !== 'es' && x !== 'en')) assert.deepEqual(claves(l), [], `${l} no lleva lector.*: el lector habla el idioma del libro`);
  /* las que llevan un hueco, lo llevan en los dos idiomas */
  for (const [k, hueco] of [['lector.volver', '{n}'], ['lector.de', '{t}'], ['lector.paginaDe', '{n}'], ['lector.paginaDe', '{t}'], ['lector.llega', '{n}'], ['lector.empieza', '{n}'], ['lector.numero', '{a}'], ['lector.numero', '{n}'],
    ['lector.marcada', '{n}'], ['lector.quitarMarca', '{n}'], ['lector.pagN', '{n}'], ['lector.hojaN', '{n}'],
    ['lector.marcarLa', '{n}'], ['lector.quitarLa', '{n}'], ['lector.laPag', '{n}'], ['lector.laHoja', '{n}']]) {
    for (const l of ['es', 'en']) assert.ok(UI[l][k].includes(hueco), `${l} · ${k} · ${hueco}`);
  }
  assert.equal(UI.es['lector.volver'], 'Volver a la pág. {n}');
  assert.equal(UI.en['lector.volver'], 'Back to p. {n}');
  assert.equal(UI.es['lector.copiado'], 'Copiado');
  /* toda clave que site.js pide con tl() existe */
  const site = leer('src/scripts/site.js');
  const pedidas = new Set([...site.matchAll(/\btl\('([A-Za-z]+)'\)/g)].map((m) => m[1]));
  assert.ok(pedidas.size >= 20);
  for (const k of pedidas) assert.ok(UI.es['lector.' + k] && UI.en['lector.' + k], `falta lector.${k}`);
  /* las que se piden con un «? :» (no las ve la busqueda de arriba) */
  for (const k of ['marcarPagina', 'desmarcar', 'marcaNo', 'marcaQuitada', 'marcarCual', 'marcarCualAyuda', 'marcarAyuda', 'compartir', 'enlaceCopiado', 'marcarLa', 'quitarLa']) assert.ok(UI.es['lector.' + k] && UI.en['lector.' + k], `falta lector.${k}`);
  /* «Compartir», no «Copiar enlace» (sonaba raro); al copiar, «Enlace copiado». La clave vieja y el «se quitaron las dos» se fueron */
  assert.equal(UI.es['lector.compartir'], 'Compartir');
  assert.equal(UI.en['lector.compartir'], 'Share');
  assert.equal(UI.es['lector.enlaceCopiado'], 'Enlace copiado');
  assert.equal(UI.en['lector.enlaceCopiado'], 'Link copied');
  for (const k of ['lector.enlace', 'lector.marcaQueda']) assert.ok(!(k in UI.es) && !(k in UI.en), `${k} ya no se usa`);
});

console.log('el marcado');
await ok('Panels.astro lleva Volver, Contenido (oculto de entrada) y la barra con su etiqueta y sus teclas', () => {
  const a = leer('src/components/Panels.astro');
  /* «Volver» nace ESCONDIDO (no apagado): solo sale si hay a donde volver */
  assert.match(a, /data-book-volver[^>]*aria-keyshortcuts="B"[^>]*hidden/);
  assert.ok(!/data-book-volver[^>]*disabled/.test(a));
  assert.match(a, /data-book-contenido[^>]*hidden/);
  assert.match(a, /type="range"[^>]*data-book-barra/);
  assert.match(a, /<span class="sr-only" data-lector-barra-rotulo><\/span>/);
  assert.match(a, /data-book-prev[^>]*aria-keyshortcuts="ArrowLeft"/);
  assert.match(a, /data-book-next[^>]*aria-keyshortcuts="ArrowRight"/);
});
await ok('los estilos de la fila: toque de 44 px, foco visible y movimiento reducido', () => {
  const css = leer('src/styles/base.css');
  assert.match(css, /\.book__ruta-btn \{[^}]*min-height: 2\.75rem/);
  assert.match(css, /\.book__ruta-rango \{[^}]*height: 2\.75rem/);
  assert.match(css, /\.book__ruta-rango:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s*\.book-panel\.is-open \.book__ruta \{ animation: none/);
  assert.match(leer('src/styles/carga.css'), /\.book-panel\[data-carga\] \.book__ruta/);
});

await ok('el lector: la banda, el campo de pagina, el asa y «Más» estan en el marcado, y el titulo nombra el dialogo', () => {
  const a = leer('src/components/Panels.astro');
  assert.match(a, /id="book-panel" role="dialog" aria-modal="true" aria-labelledby="book-title"/);
  assert.match(a, /<h2 class="lector__titulo" id="book-title">/);
  assert.match(a, /<input type="text" inputmode="numeric" pattern="\[0-9\]\*" enterkeyhint="go" maxlength="5" autocomplete="off" data-lector-pagina \/>/);
  /* el asa dice lo que hara con su nombre; sin aria-pressed (las dos cosas se anunciaban dos veces) */
  assert.match(a, /<button class="lector__asa" type="button" data-lector-asa>/);
  assert.ok(!/data-lector-asa[^>]*aria-pressed/.test(a));
  /* la firma no se escribe otra vez en cada pagina: la copia site.js de la cabecera (sin ids repetidos) */
  assert.match(a, /<span class="lector__marca-firma" data-lector-firma><\/span>/);
  assert.ok(!/lector__marca-firma[^\n]*Icon id="lockup"/.test(a));
  assert.match(a, /data-lector-mas aria-haspopup="dialog" aria-expanded="false"/);
  assert.match(a, /data-lector-tema aria-pressed="false"/);
  assert.match(a, /data-lector-idioma-btn aria-expanded="false"/);
  assert.match(a, /lector__compartir" type="button" data-lector-compartir hidden>/);
  assert.ok(!/data-lector-copiar\b/.test(a), 'el boton viejo «Copiar enlace» del muelle se fue');
  /* «¿Cuál marcar?» nace escondido, con el id al que apunta «Marcar» (aria-controls) */
  assert.match(a, /<div class="lector__elige" id="lector-elige" role="group" data-lector-elige hidden><\/div>/);
  assert.ok(!/\son[a-z]+=["{]/.test(a.slice(a.indexOf('id="book-panel"'), a.indexOf('id="book-mark"'))), 'sin manejadores en linea (la politica de contenido no los deja)');
  /* «Marcar» nace escondido (solo sale si el navegador deja guardar), con su tecla; «Índice» ocupa el sitio de «Marcadores»
     (que ahora es una de sus pestañas) */
  assert.match(a, /data-lector-marcar aria-pressed="false" aria-keyshortcuts="M" hidden/);
  assert.match(a, /data-lector-indice aria-haspopup="dialog" aria-expanded="false" aria-controls="lector-indice" hidden/);
  assert.match(a, /id="lector-indice" role="dialog" aria-modal="true" aria-labelledby="lector-indice-t"/);
  assert.ok(!/data-lector-marcas\b/.test(a), 'la hoja vieja de marcadores se fue');
  assert.match(a, /role="tablist" data-lector-pestanas/);
  for (const p of ['palabras', 'citas', 'marcadores', 'buscar']) assert.match(a, new RegExp(`role="tab" id="lector-tab-${p}" aria-controls="lector-tabpanel"[^>]*data-pestana="${p}"`));
  assert.match(a, /id="lector-tabpanel" role="tabpanel"/);
  assert.match(a, /<input type="search"[^>]*data-lector-busca \/>/);
});
await ok('el lector: sus estilos piden toque de 44 px, foco visible, tema claro por el mecanismo del sitio y menos movimiento', () => {
  const css = leer('src/styles/base.css');
  assert.match(css, /--l-toque: 2\.75rem/);
  assert.match(css, /\.lector__redondo \{[^}]*width: var\(--l-toque\); height: var\(--l-toque\)/);
  assert.match(css, /\.lector__idioma-actual \{[^}]*width: var\(--l-toque\); height: var\(--l-toque\)/);
  assert.match(css, /\.lector__tema \{[^}]*width: var\(--l-toque\); height: var\(--l-toque\)/);
  assert.match(css, /\.lector__asa \{[^}]*height: var\(--l-toque\)/);
  assert.match(css, /\.lector__campo \{[^}]*min-height: var\(--l-toque\)/);
  assert.match(css, /\.book-panel\[data-lector\] :focus-visible/);
  assert.match(css, /html\[data-tema="claro"\] \.book-panel\[data-lector\] \{/);
  assert.match(css, /prefers-color-scheme: light\) \{\s*html:not\(\[data-tema="oscuro"\]\) \.book-panel\[data-lector\]/);
  assert.match(css, /--p-borde: 1\.5px solid var\(--ring\)/);
  const aviso = css.slice(css.indexOf('.book__toast {'), css.indexOf('.book__toast[data-visible]'));
  assert.ok(aviso.length > 50 && !/#1c1c1c|system-ui/.test(aviso), 'el aviso usa la paleta de la casa');
  /* el aviso se posa encima del muelle y de la fila de «Volver» y el asa, nunca sobre ellos */
  assert.match(aviso, /bottom: calc\(var\(--l-suelo[^)]*\) \+ var\(--l-hueco[^)]*\) \+ [.0-9]+rem\)/);
  /* el «ese numero no» del campo es un oficio, con su tono hondo sobre el papel */
  assert.match(css, /\.lector__campo\.is-mal \{[^}]*var\(--l-mal\)/);
  assert.equal((css.match(/--l-mal: #A8401A/g) || []).length, 2, 'los dos bloques del tema claro');
  /* «Volver» en el telefono no llega hasta el asa */
  assert.match(css, /\.lector__volver \{[^}]*max-width: calc\(100% - 2 \* \(var\(--l-gut-r\) \+ var\(--l-toque\)/);
});
await ok('la carga sobre el papel: sus botones pasan por encima con oficios, no con blanco ni hueso fijos', () => {
  const carga = leer('src/styles/carga.css');
  assert.match(carga, /\.carga__btn:hover \{ background: var\(--carga-velo, rgb\(241 239 233 \/ \.1\)\); \}/);
  assert.match(carga, /\.carga__btn--si:hover \{ background: var\(--carga-lleno-sobre, #fff\); \}/);
  assert.match(leer('src/styles/base.css'), /--carga-velo: var\(--l-velo\); --carga-lleno-sobre: var\(--l-lleno-sobre\)/);
});
await ok('el lector se va sin dejar rastro, y empieza cada libro igual', () => {
  const site = leer('src/scripts/site.js');
  const salir = site.slice(site.indexOf('function salirDelLector()'), site.indexOf('/* Abre el libro en PDF con su carga'));
  assert.match(salir, /\[banda, ruta, hojaMas, hojaIndice, \.\.\.lados\]\.forEach\(\(x\) => x\.removeAttribute\('lang'\)\)/, 'el idioma del libro no se queda en el libro escrito');
  assert.match(salir, /cerrarIndice\(true\);/, 'el indice no se queda abierto');
  assert.match(salir, /if \(hojaNota\) hojaNota\.cerrar\(true\);/, 'ni la nota');
  const entrar = site.slice(site.indexOf('function entrarAlLector('), site.indexOf('function salirDelLector()'));
  assert.match(entrar, /solo = false;/, 'el asa no se arrastra al libro siguiente');
  assert.match(entrar, /sitioLink\.rel = 'noopener noreferrer'/);
});
await ok('defensas del lector: otra edicion, tema, «Más», reencuadernar y el foco', () => {
  const site = leer('src/scripts/site.js');
  /* un libro privado no busca otra edicion, ni desde la bandera ni desde ficha() */
  assert.match(site, /if \(!id \|\| !otro \|\| privado\.has\(id\)\) return;/);
  assert.match(site, /if \(privado\.has\(id\)\) return edicion \? null : privado\.get\(id\);/);
  /* el tema de /vista/ escribe solo un valor que el sitio acepta, con la misma clave y la misma regla */
  assert.match(site, /const TEMA_MODOS = \['claro', 'oscuro', 'sol'\];/);
  assert.match(site, /const MODOS = TEMA_MODOS;/);
  assert.match(site, /const valido = temaValido;/);
  assert.match(site, /const modo = temaValido\(/);
  assert.match(site, /localStorage\.setItem\(TEMA_CLAVE, modo\)/);
  /* detras de «Más» tambien quedan inertes el velo y el «Copiar enlace» viejo */
  assert.match(site, /const detras = \(\) => \[banda, marco, ruta, \.\.\.lados, lz\('\.book-panel__scrim'\), copiarBtn\]/);
  /* no se desarma el libro con hojas girando: se espera */
  assert.match(site, /if \(rec\.enViaje\(\) \|\| fb\.getState\(\) !== 'read'\) \{ reajustar\(150\); return; \}/);
  /* al volver a pintar las filas de «Más», el foco se queda en la suya */
  assert.match(site, /const enFila = filasAntes\.indexOf\(d\.activeElement\);/);
  /* la copia de la firma lleva sus ids renombrados */
  assert.match(site, /x\.id \+ '-lector'/);
});
await ok('el lector en site.js: mide la banda y el muelle, no reencuaderna con el campo en la mano y no escribe HTML a mano', () => {
  const site = leer('src/scripts/site.js');
  const medir = site.slice(site.indexOf('function flipSize('), site.indexOf('const count = () => fb.getPageCount()'));
  assert.match(medir, /banda\.getBoundingClientRect\(\)/);
  assert.match(medir, /ruta\.getBoundingClientRect\(\)/);
  assert.ok(!/11\.2|9\.4/.test(medir), 'ya no hay alturas fijas en rem');
  assert.match(site, /if \(d\.activeElement === campo\) \{ medidaPendiente = true; return; \}/);
  const lector = site.slice(site.indexOf('/* ---- EL LECTOR: la banda, el muelle, el asa y «Más»'), site.indexOf('/* Abre el libro en PDF con su carga'));
  assert.ok(lector.length > 2000);
  assert.ok(!/innerHTML|insertAdjacentHTML|sessionStorage|document\.write/.test(lector));
  assert.match(lector, /sitioLink\.target = '_blank'; sitioLink\.rel = 'noopener noreferrer'/);
  assert.match(site, /import \{[^}]*idiomaDelLector[^}]*leerPagina[^}]*numeracion[^}]*\} from '\.\/lector\/pliegos\.js'/);
});

console.log('los folios del enlace privado (el numero impreso de cada pagina)');
const PE = await import('../src/scripts/contenido/taller/PaginasEdicion.js');
const ALTO = 800;
/* Un texto de la pagina: `donde` = 'pie' | 'cabeza' | 'medio' */
const txt = (str, donde = 'pie') => ({ str, y0: donde === 'pie' ? 760 : donde === 'cabeza' ? 30 : 400, y1: donde === 'pie' ? 772 : donde === 'cabeza' ? 42 : 412 });
/* Un libro de `n` paginas: `num(i)` dice que lleva impreso la pagina i (o null) */
const leerLibro = (n, num, donde = 'pie') => Array.from({ length: n }, (_, i) => {
  const items = [txt('Un parrafo de la pagina', 'medio')];
  const f = num(i);
  if (f != null) items.push(txt(String(f), donde));
  return PE.folioDeTextos(items, ALTO);
});
await ok('folioDeTextos: un numero solo en el pie; si no, en la cabeza; con duda, ninguno', () => {
  assert.equal(PE.folioDeTextos([txt('12')], ALTO), 12);
  assert.equal(PE.folioDeTextos([txt(' 7 ')], ALTO), 7);
  assert.equal(PE.folioDeTextos([txt('12', 'cabeza')], ALTO), 12);
  assert.equal(PE.folioDeTextos([txt('3', 'cabeza'), txt('12')], ALTO), 12, 'el pie manda');
  assert.equal(PE.folioDeTextos([txt('12', 'medio')], ALTO), null, 'en medio de la pagina no es un folio');
  assert.equal(PE.folioDeTextos([txt('12'), txt('13')], ALTO), null, 'dos numeros distintos en el pie: duda');
  assert.equal(PE.folioDeTextos([txt('12'), txt('12')], ALTO), 12, 'el mismo dos veces es uno');
  for (const malo of ['12345', '0', '1a', '-3', '2.5', 'xii', '']) assert.equal(PE.folioDeTextos([txt(malo)], ALTO), null, malo);
  for (const roto of [null, 'x', 5, {}, { str: 5, y0: 760 }, { str: '4', y0: 'abajo' }]) assert.equal(PE.folioDeTextos([roto], ALTO), null);
  assert.equal(PE.folioDeTextos('no', ALTO), null);
  assert.equal(PE.folioDeTextos([txt('4')], 0), null);
});
await ok('un año en el pie junto al folio no lo tapa; un año solo pierde la votacion', () => {
  assert.equal(PE.folioDeTextos([txt('2026'), txt('12')], ALTO), 12);
  assert.equal(PE.folioDeTextos([txt('12'), txt('1999')], ALTO), 12);
  assert.equal(PE.folioDeTextos([txt('2026'), txt('1999')], ALTO), null, 'dos años: duda');
  assert.equal(PE.folioDeTextos([txt('2026'), txt('12'), txt('13')], ALTO), null, 'dos numeros de verdad: duda');
  assert.equal(PE.folioDeTextos([txt('2026', 'cabeza'), txt('7', 'cabeza')], ALTO), 7);
  assert.equal(PE.folioDeTextos([txt('2026')], ALTO), 2026, 'solo, cuenta aqui…');
  /* …pero el libro vota otra cosa: la pagina 5 (con el año solo en el pie) lleva su numero de verdad */
  const n = 10;
  const f = PE.foliosDeEdicion(leerLibro(n, (i) => (i === 5 ? 2026 : i >= 1 && i <= 8 ? i : null)), n);
  assert.equal(f[5], 5);
  assert.deepEqual(f.slice(1, 9), [1, 2, 3, 4, 5, 6, 7, 8]);
});
await ok('numeroDeTexto (LeerEdicion): la caja de una cifra en la pagina vista, derecha y girada', async () => {
  const { numeroDeTexto } = await import('../src/scripts/portal/panel/dev/taller/LeerEdicion.js');
  /* pdf.js, escala 1: una pagina de 600 x 800 puntos sin girar → origen arriba */
  const recta = { transform: [1, 0, 0, -1, 0, 800] };
  const it = (str, x = 294, y = 30) => ({ str, transform: [10, 0, 0, 10, x, y], width: 12, height: 10 });
  assert.deepEqual(numeroDeTexto(recta, it('12')), { str: '12', y0: 760, y1: 770 });
  assert.equal(PE.folioDeTextos([numeroDeTexto(recta, it('12'))], 800), 12, 'cae en el pie');
  assert.equal(PE.folioDeTextos([numeroDeTexto(recta, it('3', 294, 780))], 800), 3, 'y arriba, en la cabeza');
  /* girada 90°: la matriz de pdf.js es [0, 1, 1, 0, 0, 0] (la pagina vista mide 800 x 600) */
  const girada = { transform: [0, 1, 1, 0, 0, 0] };
  const g = numeroDeTexto(girada, it('12', 294, 30));
  assert.deepEqual(g, { str: '12', y0: 294, y1: 306 });
  /* lo que no es una cifra suelta, o viene roto, no es candidato */
  for (const malo of [it('12a'), it('12345'), it(''), { str: '4' }, { str: '4', transform: [1, 0, 0, 1, 'x', 5] }, null, { str: 4, transform: [1, 0, 0, 1, 0, 0] }]) {
    assert.equal(numeroDeTexto(recta, malo), null);
  }
  const fuente = leer('src/scripts/portal/panel/dev/taller/LeerEdicion.js');
  assert.ok(!/localStorage|innerHTML/.test(fuente));
});
await ok('foliosDeEdicion: tapa sin numero y 4 hojas de principio, luego 1, 2, 3…', () => {
  /* tapa (0), 4 hojas sin numero (1-4), el texto numerado desde la 5 (folio 1), un comienzo de capitulo sin numero (la 9), contratapa */
  const n = 20;
  const cand = leerLibro(n, (i) => (i >= 5 && i <= 18 && i !== 9 ? i - 4 : null));
  const f = PE.foliosDeEdicion(cand, n);
  assert.equal(f.length, n);
  assert.deepEqual(f.slice(0, 5), [null, null, null, null, null], 'la tapa y el principio no llevan numero');
  assert.equal(f[5], 1);
  assert.equal(f[9], 5, 'el comienzo del capitulo lleva su numero aunque no lo tenga impreso');
  assert.equal(f[18], 14);
  assert.equal(f[19], null, 'la contratapa no');
  /* y el lector lo usa tal cual: la pagina 1 es la imagen 5 */
  const num = P.numeracion(n, { folios: f });
  assert.equal(num.primero, 1);
  assert.equal(num.indiceDe(1), 5);
  assert.equal(P.leerPagina('5', num).indice, 9);
});
await ok('foliosDeEdicion: un «139» suelto al pie de 2 paginas no inventa numeros', () => {
  const n = 12;
  const f = PE.foliosDeEdicion(leerLibro(n, (i) => (i === 3 || i === 8 ? 139 : null)), n);
  assert.deepEqual(f, new Array(n).fill(null));
  /* y en un libro numerado, el 139 suelto pierde la votacion y su pagina lleva el numero de verdad */
  const g = PE.foliosDeEdicion(leerLibro(n, (i) => (i === 4 ? 139 : i >= 1 && i <= 10 ? i : null)), n);
  assert.equal(g[4], 4);
  assert.equal(g[1], 1);
  assert.equal(g[10], 10);
  assert.equal(g[0], null);
});
await ok('foliosDeEdicion: sin numeros, todo null; foliosDeHojas da null y el lector cuenta las imagenes', () => {
  const n = 8;
  const f = PE.foliosDeEdicion(leerLibro(n, () => null), n);
  assert.deepEqual(f, new Array(n).fill(null));
  const r = PE.hojasDeEdicion(Array.from({ length: n }, () => ({ texto: 'x' })), 100, 200, f);
  assert.ok(r.hojas.every((h) => !('folio' in h)));
  assert.equal(PE.foliosDeHojas(PE.hojasSeguras(r.hojas, n)), null);
  const num = P.numeracion(n, { folios: PE.foliosDeHojas(r.hojas) });
  assert.equal(num.folioDe(0), 1, 'como antes: la tapa es la 1');
  assert.equal(num.total, n);
});
await ok('foliosDeEdicion: numeros en la cabeza, y un voto flojo (menos de la mitad) no vale', () => {
  const n = 10;
  const f = PE.foliosDeEdicion(leerLibro(n, (i) => (i >= 2 && i <= 8 ? i + 10 : null), 'cabeza'), n);
  assert.deepEqual(f, [null, null, 12, 13, 14, 15, 16, 17, 18, null]);
  /* dos de acuerdo y tres sueltos: no son mas de la mitad */
  const g = PE.foliosDeEdicion([null, 50, 2, 3, 70, 90, null], 7);
  assert.deepEqual(g, new Array(7).fill(null));
  assert.deepEqual(PE.foliosDeEdicion(null, 3), [null, null, null]);
  assert.deepEqual(PE.foliosDeEdicion([1, 2, 3], 0), []);
});
await ok('los folios viajan en las hojas y lo hostil se tira: «3», -1, 2.5, 1e9', () => {
  const r = PE.hojasDeEdicion([{ texto: 'a' }, { texto: 'b' }, { texto: 'c' }], 100, 200, [null, 1, 2]);
  assert.deepEqual(r.hojas, [{ text: 'a' }, { text: 'b', folio: 1 }, { text: 'c', folio: 2 }]);
  assert.deepEqual(PE.foliosDeHojas(r.hojas), [null, 1, 2]);
  assert.deepEqual(PE.hojaDe({ texto: 'x' }, 100, 200, 1, '3'), { text: 'x' });
  const sucias = [{ text: 'a', folio: '3' }, { text: 'b', folio: -1 }, { text: 'c', folio: 2.5 }, { text: 'd', folio: 1e9 }, { text: 'e', folio: 0 }, { text: 'f', folio: true }, { text: 'g', folio: 7 }];
  const s = PE.hojasSeguras(sucias, 7);
  assert.deepEqual(s.map((h) => h.folio), [undefined, undefined, undefined, undefined, undefined, undefined, 7]);
  assert.deepEqual(PE.foliosDeHojas(s), [null, null, null, null, null, null, 7]);
  /* y numeracion() tampoco se fia */
  const num = P.numeracion(3, { folios: ['3', -1, 1e9] });
  assert.equal(num.primero, null);
});

console.log('los marcadores (solo en este navegador)');
const M = await import('../src/scripts/lector/marcadores.js');
const almacenDe = () => {
  const m = new Map();
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } };
};
const TOKEN = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8';
await ok('la clave de un enlace privado: siempre la misma, 32 hex, y nunca lleva el secreto', async () => {
  const a = await M.claveDeEnlace(TOKEN), b = await M.claveDeEnlace(TOKEN);
  assert.equal(a, b);
  assert.match(a, /^v:[0-9a-f]{32}$/);
  assert.ok(!a.includes(TOKEN) && !a.includes(TOKEN.slice(0, 8)));
  assert.notEqual(await M.claveDeEnlace(TOKEN.slice(0, 42) + 'B'), a);
  /* es SHA-256 de 'jlr-marcas-v1|' + secreto, cortado a 16 bytes */
  const { createHash } = await import('node:crypto');
  assert.equal(a, 'v:' + createHash('sha256').update('jlr-marcas-v1|' + TOKEN).digest('hex').slice(0, 32));
  assert.equal(await M.claveDeEnlace(''), null);
  assert.equal(await M.claveDeEnlace(TOKEN, null), null);
  /* lo guardado tampoco lo lleva */
  const al = almacenDe();
  M.crearMarcadores(al, a, 10).poner(3, 4);
  assert.ok(![...al.m].join('|').includes(TOKEN));
});
await ok('la clave de Recursos: id e idioma con su forma, o nada', () => {
  assert.equal(M.claveRecursos('ahava', 'es'), 'r:ahava:es');
  assert.equal(M.claveRecursos('libro-2', 'all'), 'r:libro-2:all');
  for (const [id, l] of [['', 'es'], ['../x', 'es'], ['Ahava', 'es'], ['a b', 'es'], ['ahava', 'ES'], ['ahava', 'e'], ['x'.repeat(65), 'es'], [5, 'es'], ['ahava', null], ['-a', 'es']]) assert.equal(M.claveRecursos(id, l), null, `${id}/${l}`);
  assert.ok(M.claveValida('r:ahava:es') && M.claveValida('v:' + '0'.repeat(32)));
  assert.ok(!M.claveValida('v:' + TOKEN) && !M.claveValida('r:ahava') && !M.claveValida(null));
});
await ok('marcar y desmarcar: se guarda en su sitio, por orden, sin texto de la pagina', () => {
  const al = almacenDe();
  const mk = M.crearMarcadores(al, 'r:ahava:es', 12, { ahora: () => 1700000000 });
  assert.equal(mk.poner(7, 6), 'ok');
  assert.equal(mk.poner(2, 1), 'ok');
  assert.equal(mk.poner(7, 6), 'ya');
  assert.equal(mk.tiene(7), true);
  assert.deepEqual(JSON.parse(al.m.get('jlr:marcas:v1:r:ahava:es')), { n: 12, m: [{ p: 2, f: 1, t: 1700000000 }, { p: 7, f: 6, t: 1700000000 }] });
  assert.deepEqual(JSON.parse(al.m.get('jlr:marcas:v1')), ['r:ahava:es']);
  /* vuelve a leerse igual al abrir otra vez (una recarga) */
  assert.deepEqual(M.crearMarcadores(al, 'r:ahava:es', 12).lista().map((x) => x.p), [2, 7]);
  assert.equal(mk.quitar(2), 'ok');
  assert.equal(mk.quitar(2), 'no');
  assert.equal(mk.quitar(7), 'ok');
  assert.equal(al.m.has('jlr:marcas:v1:r:ahava:es'), false, 'sin marcas no queda nada');
  assert.equal(al.m.has('jlr:marcas:v1'), false);
  /* fuera del libro, no */
  for (const p of [-1, 12, 1.5, '3', null]) assert.equal(mk.poner(p, 1), 'fuera');
  assert.equal(mk.poner(4, '9'), 'ok');
  assert.equal(mk.lista()[0].f, null, 'un folio que no es numero no se guarda');
});
await ok('topes: 100 marcas por libro y 60 libros; se olvida el libro tocado hace mas tiempo', () => {
  const al = almacenDe();
  const mk = M.crearMarcadores(al, 'r:ahava:es', 500);
  for (let p = 0; p < M.MARCAS_MAX; p++) assert.equal(mk.poner(p, p + 1), 'ok');
  assert.equal(mk.poner(300, 301), 'lleno');
  assert.equal(mk.lista().length, 100);
  for (let i = 0; i < M.LIBROS_MAX; i++) M.crearMarcadores(al, `r:libro-${i}:es`, 10).poner(1, 1);
  assert.equal(al.m.has('jlr:marcas:v1:r:ahava:es'), false, 'el mas viejo (ahava) se olvido');
  assert.ok(al.m.has('jlr:marcas:v1:r:libro-0:es'));
  const indice = JSON.parse(al.m.get('jlr:marcas:v1'));
  assert.equal(indice.length, 60);
  /* tocar uno lo hace el mas nuevo: el siguiente en irse es otro */
  M.crearMarcadores(al, 'r:libro-0:es', 10).poner(2, 2);
  M.crearMarcadores(al, 'r:nuevo:es', 10).poner(1, 1);
  assert.ok(al.m.has('jlr:marcas:v1:r:libro-0:es'));
  assert.equal(al.m.has('jlr:marcas:v1:r:libro-1:es'), false);
});
await ok('lo guardado se revisa: paginas fuera, repetidas, un libro con otro numero de paginas, JSON roto', () => {
  const al = almacenDe();
  al.setItem('jlr:marcas:v1:r:ahava:es', JSON.stringify({ n: 20, m: [{ p: 3, f: 2, t: 5 }, { p: 3, f: 2, t: 5 }, { p: 15, f: 14, t: 5 }, { p: -1 }, { p: 2.5 }, { p: '4' }, null, 7, { p: 5, f: 'x', t: -3 }] }));
  const mk = M.crearMarcadores(al, 'r:ahava:es', 10);
  assert.deepEqual(mk.lista(), [{ p: 3, f: 2, t: 5 }, { p: 5, f: null, t: 0 }], 'el libro ahora tiene 10 paginas: la 15 se cae');
  mk.poner(9, 8);
  assert.equal(JSON.parse(al.getItem('jlr:marcas:v1:r:ahava:es')).n, 10);
  for (const roto of ['{', 'null', '[]', '"x"', '{"m":"no"}', '{"m":[{"p":1e400}]}', 'x'.repeat(300000)]) {
    al.setItem('jlr:marcas:v1:r:emet:es', roto);
    assert.deepEqual(M.crearMarcadores(al, 'r:emet:es', 10).lista(), [], roto.slice(0, 20));
  }
  al.setItem('jlr:marcas:v1', '{roto');
  assert.equal(M.crearMarcadores(al, 'r:emet:es', 10).poner(1, 1), 'ok');
  assert.deepEqual(JSON.parse(al.getItem('jlr:marcas:v1')), ['r:emet:es']);
  assert.equal(M.crearMarcadores(al, 'no-vale', 10), null);
  assert.equal(M.crearMarcadores(null, 'r:emet:es', 10), null);
});
await ok('un almacen que falla no rompe nada: se dice, y no se marca', () => {
  const tira = { getItem() { throw new Error('x'); }, setItem() { throw new Error('lleno'); }, removeItem() { throw new Error('x'); } };
  assert.equal(M.almacenDisponible(tira), false);
  assert.equal(M.almacenDisponible(null), false);
  assert.equal(M.almacenDisponible({}), false);
  assert.equal(M.almacenDisponible(almacenDe()), true);
  const mk = M.crearMarcadores(tira, 'r:ahava:es', 10);
  assert.deepEqual(mk.lista(), []);
  assert.equal(mk.poner(1, 1), 'falla');
  assert.equal(mk.tiene(1), false, 'lo que no se guardo no se muestra como marcado');
  /* lleno a medias: guarda la marca pero no el indice */
  const al = almacenDe();
  const medio = { getItem: al.getItem, removeItem: al.removeItem, setItem: (k, v) => { if (k === 'jlr:marcas:v1') throw new Error('lleno'); al.setItem(k, v); } };
  const m2 = M.crearMarcadores(medio, 'r:ahava:es', 10);
  assert.equal(m2.poner(1, 1), 'ok');
  assert.equal(m2.tiene(1), true);
});
await ok('dos pestañas con el mismo libro: una no pisa las marcas de la otra (ni el indice)', () => {
  const al = almacenDe();
  const a = M.crearMarcadores(al, 'r:ahava:es', 12);
  const b = M.crearMarcadores(al, 'r:ahava:es', 12);
  assert.equal(a.poner(2, 2), 'ok');
  assert.equal(b.poner(5, 5), 'ok');
  assert.deepEqual(JSON.parse(al.getItem('jlr:marcas:v1:r:ahava:es')).m.map((x) => x.p), [2, 5], 'la segunda vio la marca de la primera');
  assert.deepEqual(b.lista().map((x) => x.p), [2, 5]);
  assert.equal(a.quitar(5), 'ok', 'la primera puede quitar la que puso la otra');
  assert.deepEqual(JSON.parse(al.getItem('jlr:marcas:v1:r:ahava:es')).m.map((x) => x.p), [2]);
  assert.equal(b.quitar(5), 'no', 'ya no estaba');
  assert.deepEqual(b.lista().map((x) => x.p), [2], 'y la otra se pone al dia');
  assert.equal(b.poner(2, 2), 'ya');
  /* el indice tambien se vuelve a leer: otro libro en otra pestaña no se pierde */
  M.crearMarcadores(al, 'r:emet:es', 12).poner(1, 1);
  a.poner(7, 7);
  assert.deepEqual(JSON.parse(al.getItem('jlr:marcas:v1')).sort(), ['r:ahava:es', 'r:emet:es']);
  /* un almacen que no deja LEER no hace que se pisen las marcas guardadas */
  const datos = al.getItem('jlr:marcas:v1:r:ahava:es');
  const ciego = { getItem: () => { throw new Error('x'); }, setItem: al.setItem, removeItem: al.removeItem };
  const c = M.crearMarcadores(ciego, 'r:ahava:es', 12);
  assert.equal(c.poner(9, 9), 'falla');
  assert.equal(c.quitar(2), 'falla');
  assert.equal(al.getItem('jlr:marcas:v1:r:ahava:es'), datos, 'lo guardado sigue igual');
});
await ok('un libro privado se olvida a los 90 dias de su ultima marca; uno de Recursos no', () => {
  const al = almacenDe();
  const DIA = 86400, HOY = 1800000000;
  const v1 = 'v:' + 'a'.repeat(32), v2 = 'v:' + 'b'.repeat(32);
  M.crearMarcadores(al, v1, 10, { ahora: () => HOY - 91 * DIA }).poner(1, 1);
  M.crearMarcadores(al, v2, 10, { ahora: () => HOY - 10 * DIA }).poner(1, 1);
  M.crearMarcadores(al, 'r:ahava:es', 10, { ahora: () => HOY - 400 * DIA }).poner(1, 1);
  /* al abrir el viejo, ya no tiene nada */
  const viejo = M.crearMarcadores(al, v1, 10, { ahora: () => HOY });
  assert.deepEqual(viejo.lista(), []);
  assert.equal(al.m.has('jlr:marcas:v1:' + v1), false);
  assert.ok(!JSON.parse(al.getItem('jlr:marcas:v1')).includes(v1));
  /* al tocar el indice (marcar otro libro), los privados vencidos se van; el reciente y el de Recursos se quedan */
  M.crearMarcadores(al, v1, 10, { ahora: () => HOY - 100 * DIA }).poner(2, 2);
  M.crearMarcadores(al, 'r:emet:es', 10, { ahora: () => HOY }).poner(3, 3);
  const indice = JSON.parse(al.getItem('jlr:marcas:v1'));
  assert.ok(!indice.includes(v1) && !al.m.has('jlr:marcas:v1:' + v1), 'el privado vencido se olvido');
  assert.ok(indice.includes(v2) && al.m.has('jlr:marcas:v1:' + v2));
  assert.ok(indice.includes('r:ahava:es') && al.m.has('jlr:marcas:v1:r:ahava:es'));
  /* una marca reciente en el viejo lo mantiene vivo */
  const reabierto = M.crearMarcadores(al, v2, 10, { ahora: () => HOY + 70 * DIA });
  assert.equal(reabierto.lista().length, 1);
  assert.equal(reabierto.poner(4, 4), 'ok');
  assert.equal(M.crearMarcadores(al, v2, 10, { ahora: () => HOY + 150 * DIA }).lista().length, 2, 'la marca mas nueva manda');
  assert.equal(M.crearMarcadores(al, v2, 10, { ahora: () => HOY + 161 * DIA }).lista().length, 0);
});
await ok('un indice enorme y ajeno: se recorta a 60 y el trabajo tiene tope', () => {
  const al = almacenDe();
  const ajenos = Array.from({ length: 2000 }, (_, i) => `r:x${i}:es`);
  al.setItem('jlr:marcas:v1', JSON.stringify(ajenos));
  let borrados = 0;
  const cuenta = { getItem: al.getItem, setItem: al.setItem, removeItem: (k) => { borrados++; al.removeItem(k); } };
  M.crearMarcadores(cuenta, 'r:ahava:es', 10).poner(1, 1);
  const indice = JSON.parse(al.getItem('jlr:marcas:v1'));
  assert.equal(indice.length, 60);
  assert.equal(indice.at(-1), 'r:ahava:es');
  assert.ok(borrados <= 60, `borro ${borrados}`);
});
await ok('el lector y sus marcas: el secreto no sale de vista.js, solo la huella llega a site.js; pliegos y recorrido sin almacen', () => {
  const vista = leer('src/scripts/lector/vista.js');
  assert.match(vista, /const marcas = await claveDeEnlace\(token\);/);
  assert.match(vista, /folios: libro\.folios, marcas, src/);
  assert.ok(!/token[^\n]*localStorage|localStorage/.test(vista), 'vista.js no guarda nada');
  const site = leer('src/scripts/site.js');
  assert.match(site, /claveValida\(x\.marcas\) && x\.marcas\.startsWith\('v:'\) \? x\.marcas : null/);
  assert.match(site, /almacenDisponible\(window\.localStorage\)/);
  const mod = leer('src/scripts/lector/marcadores.js');
  const codigo = mod.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/localStorage|sessionStorage|indexedDB|innerHTML|document\./.test(codigo), 'marcadores.js recibe su almacen; no toca la pagina');
  for (const f of ['src/scripts/lector/pliegos.js', 'src/scripts/lector/recorrido.js']) assert.ok(!/localStorage|sessionStorage|marcadores/.test(leer(f)), f);
  /* la tecla M no choca con otra del lector, y dejarla apretada no marca y desmarca sin parar */
  assert.equal((site.match(/e\.key === 'm' \|\| e\.key === 'M'/g) || []).length, 1);
  assert.match(site, /if \(e\.repeat\) return;\s*alternarMarca\(\);/);
});

console.log('cada pagina se marca sola (el pliego de pantalla ancha)');
const tiene = (...ps) => (p) => ps.includes(p);
const folios = (p) => (p >= 2 && p <= 17 ? p - 1 : null);     // tapa, guarda, 1…16, guarda, contratapa (20 imagenes)
const palabras = (l) => (k) => UI[l]['lector.' + k];
await ok('opcionesDeMarca: una pagina a la vista es un toque; dos, elegir; la de la izquierda primero', () => {
  /* el telefono (una pagina), la tapa y la contratapa: un toque */
  assert.deepEqual(M.opcionesDeMarca([6], { n: 20, folioDe: folios }), { modo: 'una', ops: [{ p: 6, lado: 'sola', nombre: { k: 'pag', n: 5 }, marcada: false }] });
  assert.equal(M.opcionesDeMarca([0], { n: 20, folioDe: folios }).ops[0].nombre.k, 'portada');
  assert.equal(M.opcionesDeMarca([19], { n: 20, folioDe: folios }).ops[0].nombre.k, 'contratapa');
  /* un pliego: las dos, por orden, cada una con su estado (no «el pliego»: marcar la derecha no marca la izquierda) */
  const o = M.opcionesDeMarca([7, 6], { n: 20, folioDe: folios, tiene: tiene(7) });
  assert.equal(o.modo, 'elegir');
  assert.deepEqual(o.ops.map((x) => [x.p, x.lado, x.marcada]), [[6, 'izq', false], [7, 'der', true]]);
  assert.deepEqual(o.ops.map((x) => x.nombre), [{ k: 'pag', n: 5 }, { k: 'pag', n: 6 }]);
  /* una guarda sin numero se llama «Hoja N» (contada desde 1) */
  assert.deepEqual(M.opcionesDeMarca([1, 2], { n: 20, folioDe: folios }).ops.map((x) => x.nombre), [{ k: 'hoja', n: 2 }, { k: 'pag', n: 1 }]);
  /* lo que no es una pagina del libro no cuenta, ni se repite, ni pasa de dos */
  assert.deepEqual(M.opcionesDeMarca([], { n: 20 }), { modo: 'nada', ops: [] });
  assert.deepEqual(M.opcionesDeMarca(null, { n: 20 }), { modo: 'nada', ops: [] });
  assert.equal(M.opcionesDeMarca([4, 4], { n: 20 }).modo, 'una');
  assert.deepEqual(M.opcionesDeMarca([-1, 2.5, '3', 20, 5], { n: 20 }).ops.map((x) => x.p), [5]);
  assert.equal(M.opcionesDeMarca([3, 4, 5], { n: 20 }).ops.length, 2);
  assert.equal(M.opcionesDeMarca([3, 4], { n: 0 }).modo, 'nada');
  assert.equal(M.opcionesDeMarca([3, 4]).modo, 'nada');
});
await ok('las palabras de una hoja: «Pág. 12» en el selector, y la cinta dice lo que hara', () => {
  const es = palabras('es'), en = palabras('en');
  assert.equal(M.decirHoja({ k: 'pag', n: 12 }, es), 'Pág. 12');
  assert.equal(M.decirHoja({ k: 'hoja', n: 3 }, es), 'Hoja 3');
  assert.equal(M.decirHoja({ k: 'portada', n: null }, en), 'Front cover');
  assert.equal(M.rotuloDeCinta({ marcada: false, nombre: { k: 'pag', n: 12 } }, es), 'Marcar la pág. 12');
  assert.equal(M.rotuloDeCinta({ marcada: true, nombre: { k: 'pag', n: 12 } }, es), 'Quitar la marca de la pág. 12');
  assert.equal(M.rotuloDeCinta({ marcada: false, nombre: { k: 'hoja', n: 2 } }, es), 'Marcar la hoja 2');
  assert.equal(M.rotuloDeCinta({ marcada: true, nombre: { k: 'contratapa', n: null } }, es), 'Quitar la marca de la contratapa');
  assert.equal(M.rotuloDeCinta({ marcada: false, nombre: { k: 'pag', n: 12 } }, en), 'Bookmark page 12');
  assert.equal(M.rotuloDeCinta({ marcada: true, nombre: { k: 'portada', n: null } }, en), 'Remove the bookmark from the front cover');
  /* un «$&» en lo que llega no se vuelve otra cosa al reemplazar */
  assert.equal(M.decirHoja({ k: 'pag', n: '$&' }, es), 'Pág. $&');
  for (const k of M.CLAVES_HOJA) assert.ok(UI.es['lector.' + k] && UI.en['lector.' + k], `falta lector.${k}`);
});
await ok('marcar una pagina del pliego no toca la otra; quitar una deja la otra', () => {
  const mk = M.crearMarcadores(almacenDe(), 'r:ahava:es', 20, { ahora: () => 1700000000 });
  /* solo la derecha */
  assert.equal(mk.poner(7, 6), 'ok');
  let o = M.opcionesDeMarca([6, 7], { n: 20, folioDe: folios, tiene: mk.tiene });
  assert.deepEqual(o.ops.map((x) => x.marcada), [false, true]);
  /* y la izquierda: las dos */
  assert.equal(mk.poner(6, 5), 'ok');
  o = M.opcionesDeMarca([6, 7], { n: 20, folioDe: folios, tiene: mk.tiene });
  assert.deepEqual(o.ops.map((x) => x.marcada), [true, true]);
  /* quitar una (la derecha) deja la izquierda */
  assert.equal(mk.quitar(7), 'ok');
  o = M.opcionesDeMarca([6, 7], { n: 20, folioDe: folios, tiene: mk.tiene });
  assert.deepEqual(o.ops.map((x) => x.marcada), [true, false]);
  assert.deepEqual(mk.lista().map((x) => x.p), [6]);
});
await ok('site.js: «Marcar» y M eligen con dos paginas, alternan con una; la cinta de cada pagina es un boton', () => {
  const site = leer('src/scripts/site.js');
  const alternar = site.slice(site.indexOf('function alternarMarca()'), site.indexOf('/* «¿CUÁL MARCAR?»'));
  assert.ok(alternar.length > 100);
  assert.match(alternar, /if \(eligeAbierto\(\)\) \{ cerrarElige\(true\); return; \}/);
  assert.match(alternar, /if \(o\.modo === 'una'\) alternarPagina\(o\.ops\[0\]\.p\);\s*else if \(o\.modo === 'elegir'\) \{/);
  /* M con los botones escondidos (el asa): vuelven y el selector se abre (antes no pasaba nada) */
  assert.match(alternar, /if \(solo\) ponerSolo\(false\);\s*abrirElige\(\);/);
  /* un dedo a ciegas sobre una cinta sin marca no marca; el teclado (detail 0) y el raton si */
  assert.match(site, /if \(cm && !toqueACiegas\(e, cm\)\) alternarPagina\(/);
  assert.match(site, /const toqueACiegas = \(e, cinta\) => e\.detail > 0 && \(e\.pointerType \|\| tipoDeToque\) === 'touch' && !cinta\.parentElement\.hasAttribute\('data-marca'\);/);
  /* el «una pulsada quita las dos» se fue */
  const bloque = site.slice(site.indexOf('/* ---- LOS MARCADORES ----'), site.indexOf('/* ---- EL ÍNDICE ----'));
  assert.ok(bloque.length > 2000 && !/puestas|quedan|marcaQueda/.test(bloque), 'ya no se quitan dos marcas de una vez');
  assert.ok(!/marcaQueda/.test(site));
  /* una pagina: se quita o se pone, y si el almacen falla se dice (y no se dice «quitada») */
  const una = site.slice(site.indexOf('function alternarPagina(p)'), site.indexOf('function alternarMarca()'));
  assert.match(una, /if \(r === 'falla'\) decir\(tl\('marcaNoQuita'\), 4200\);\s*else decir\(tl\('marcaQuitada'\)\);/);
  assert.match(una, /else if \(r === 'lleno'\) decir\(tl\('marcasLlenas'\), 4200\);\s*else decir\(tl\('marcaNo'\), 4200\);/);
  /* «Marcar» es interruptor con una pagina y abre el selector con dos (nunca las dos cosas a la vez) */
  const pintar = site.slice(site.indexOf('function pintarMarcar()'), site.indexOf('function alternarPagina(p)'));
  assert.match(pintar, /marcarBtn\.removeAttribute\('aria-pressed'\);\s*marcarBtn\.setAttribute\('aria-expanded'/);
  assert.match(pintar, /marcarBtn\.setAttribute\('aria-pressed'[^;]*;\s*marcarBtn\.removeAttribute\('aria-expanded'\);/);
  /* el selector: flechas sin pasar hojas, Escape (por orden) y M lo cierran; cada opcion es un interruptor */
  assert.match(site, /elige\.addEventListener\('keydown'[\s\S]{0,400}e\.stopPropagation\(\);/);
  assert.match(site, /else if \(eligeAbierto\(\)\) cerrarElige\(true\);/);
  assert.match(site, /b\.setAttribute\('aria-pressed', String\(op\.marcada\)\);/);
  /* la cinta: un boton sin hijos (la libreria solo deja pasar el toque que cae en el boton mismo), que el libro escucha */
  const cinta = site.slice(site.indexOf("const cinta = h('button', 'flip__cinta');"), site.indexOf("const txt = texts[i] && texts[i].text;"));
  assert.match(cinta, /cinta\.type = 'button';\s*cinta\.dataset\.flipMarca = String\(i\);\s*cinta\.hidden = true;\s*pg\.appendChild\(cinta\);/);
  assert.ok(!/cinta\.append|cinta\.textContent|cinta\.innerHTML/.test(site));
  assert.match(site, /const cm = e\.target\.closest\('\[data-flip-marca\]'\);\s*if \(cm && !toqueACiegas\(e, cm\)\) alternarPagina\(Number\(cm\.dataset\.flipMarca\)\);/);
  /* y el dedo del telefono y el raton no empiezan a pasar la hoja sobre un boton */
  assert.match(site, /if \(!fb \|\| e\.button > 0 \|\| e\.target\.closest\('a, button'\)\) return;/);
  /* se cierra con todo lo que mueve el muelle: el asa, salir del lector, cambiar de tamaño */
  assert.ok((site.match(/cerrarElige\(/g) || []).length >= 8);
});
await ok('la cinta en la pagina: junto al lomo (las esquinas de fuera doblan la hoja), con sitio para el dedo y foco visible', () => {
  const css = leer('src/styles/base.css');
  const c = css.slice(css.indexOf('.flip__cinta {'), css.indexOf('/* Mientras el libro llega'));
  assert.match(c, /\.flip__cinta \{[^}]*left: 6%/);
  assert.match(c, /\.flip__page\.--left > \.flip__cinta \{ left: auto; right: 6%; \}/);
  assert.match(c, /\.flip__cinta::after \{[^}]*width: max\(100%, 2\.75rem\); height: max\(100%, 2\.75rem\)/);
  assert.match(c, /\.flip__cinta:focus-visible \{ outline: 2px solid #16231A/);
  assert.match(c, /@media \(hover: none\) \{ \.flip__page:not\(\[data-marca\]\) > \.flip__cinta \{ pointer-events: none; \} \}/);
  assert.ok(!/pointer-events/.test(c.slice(0, c.indexOf('}'))), 'la cinta recibe toques');
  assert.match(css, /\.lector__elige-op \{[^}]*min-height: var\(--l-toque\)/);
  assert.match(css, /\.lector__elige-op\[aria-pressed="true"\] svg \{ color: var\(--l-oro\); fill: currentColor; \}/);
});

console.log('«Compartir»');
const C = await import('../src/scripts/lector/compartir.js');
await ok('compartir.js: solo { title, url } del enlace corto, y las tres direcciones bien codificadas', () => {
  const url = 'https://juanjolopezramirez.com/ahava';
  assert.deepEqual(C.datosParaCompartir('Ahavá', url), { title: 'Ahavá', url });
  assert.deepEqual(C.datosParaCompartir('', url), { url });
  assert.deepEqual(C.datosParaCompartir('  Uno\n\tdos  ', url), { title: 'Uno dos', url });
  /* nunca un archivo, y solo un enlace https limpio */
  assert.ok(!('files' in C.datosParaCompartir('x', url)));
  for (const malo of ['http://a.co/x', 'javascript:alert(1)', 'https://a.co/ x', 'https://a.co/"x', '', null, 'https://a.co/' + 'x'.repeat(400)]) {
    assert.equal(C.datosParaCompartir('x', malo), null, String(malo));
    assert.equal(C.enlacesParaCompartir('x', malo), null, String(malo));
  }
  /* tildes, «&», «#» y «?» del titulo no rompen la direccion */
  const t = 'Fe & Ágape #1? Sí';
  const e = C.enlacesParaCompartir(t, url);
  assert.equal(e.whatsapp, 'https://wa.me/?text=' + encodeURIComponent(t + '\n' + url));
  assert.equal(e.whatsapp, 'https://wa.me/?text=Fe%20%26%20%C3%81gape%20%231%3F%20S%C3%AD%0Ahttps%3A%2F%2Fjuanjolopezramirez.com%2Fahava');
  assert.equal(e.correo, 'mailto:?subject=Fe%20%26%20%C3%81gape%20%231%3F%20S%C3%AD&body=https%3A%2F%2Fjuanjolopezramirez.com%2Fahava');
  assert.equal(e.telegram, 'https://t.me/share/url?url=https%3A%2F%2Fjuanjolopezramirez.com%2Fahava&text=Fe%20%26%20%C3%81gape%20%231%3F%20S%C3%AD');
  /* cada valor, leido de vuelta, es exactamente lo que se queria mandar */
  assert.equal(new URL(e.whatsapp).searchParams.get('text'), t + '\n' + url);
  assert.equal(new URL(e.telegram).searchParams.get('text'), t);
  assert.equal(new URL(e.telegram).searchParams.get('url'), url);
  for (const v of Object.values(e)) assert.ok(!/\.pdf/i.test(v) && !/#/.test(v), v);
  /* sin titulo: solo el enlace */
  const s0 = C.enlacesParaCompartir('', url);
  assert.equal(s0.correo, 'mailto:?body=https%3A%2F%2Fjuanjolopezramirez.com%2Fahava');
  assert.equal(s0.telegram, 'https://t.me/share/url?url=https%3A%2F%2Fjuanjolopezramirez.com%2Fahava');
  assert.equal(s0.whatsapp, 'https://wa.me/?text=https%3A%2F%2Fjuanjolopezramirez.com%2Fahava');
  /* un emoji justo en el tope (200 caracteres) no queda partido, y una mitad suelta no rompe nada */
  const largo = 'a'.repeat(199) + '\u{1F54A}' + 'b';
  const cortado = C.datosParaCompartir(largo, url).title;
  assert.equal(Array.from(cortado).length, 200);
  assert.ok(cortado.endsWith('\u{1F54A}'), 'el emoji entero');
  assert.ok(cortado.isWellFormed ? cortado.isWellFormed() : true);
  assert.equal(C.datosParaCompartir('a'.repeat(200) + '\u{1F54A}', url).title, 'a'.repeat(200));
  const suelta = C.datosParaCompartir('Fe \uD83D y \uDC4D', url).title;
  assert.equal(suelta, 'Fe � y �');
  assert.doesNotThrow(() => C.enlacesParaCompartir('x\uD800', url));
  assert.equal(new URL(C.enlacesParaCompartir('x\uD800', url).telegram).searchParams.get('text'), 'x�');
  assert.equal(C.enlacesParaCompartir('\u{1F54A} Paz', url).correo, 'mailto:?subject=' + encodeURIComponent('\u{1F54A} Paz') + '&body=' + encodeURIComponent(url));
  /* el modulo no toca la pagina, ni archivos */
  const mod = leer('src/scripts/lector/compartir.js').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/document\.|window\.|navigator\.|files|Blob|File\(|\.pdf|fetch\(/.test(mod));
});
await ok('compartir en site.js: la hoja del aparato (tambien en el ordenador) con { title, url } y nada mas; sin ella, el menu', () => {
  const site = leer('src/scripts/site.js');
  const c = site.slice(site.indexOf('const puedeCompartir = '), site.indexOf('/* EL MENU DE REPUESTO'));
  assert.ok(c.length > 200);
  assert.match(c, /typeof navigator\.share !== 'function'\) return false;/);
  assert.match(c, /navigator\.canShare\(datos\) !== false/);
  /* el libro privado no se comparte */
  assert.match(c, /if \(!id \|\| privado\.has\(id\) \|\| !LIBRO\.has\(id\) \|\| compartiendo\) return;/);
  assert.match(site, /if \(!id \|\| privado\.has\(id\) \|\| !LIBRO\.has\(id\)\) return;\s*const largo = enlaceCorto/, 'copiarEnlace: solo libros de la biblioteca');
  assert.match(c, /const datos = datosParaCompartir\(f && f\.titulo, enlaceCorto\(import\.meta\.env\.SITE, id\)\);/);
  /* un enlace que no es https no deja el boton mudo: se copia */
  assert.match(c, /if \(!datos\) \{ copiarEnlace\(desde, enLector\); return; \}/);
  /* una hoja que nunca contesto no deja «Compartir» muerto: al volver a la pagina o al abrir otro libro */
  assert.match(site, /if \(d\.visibilityState === 'visible'\) compartiendo = false;/);
  assert.match(site, /cerrarMenuCompartir\(\);\s*compartiendo = false;/);
  /* desde «Más», el foco vuelve a quien abrio «Más» (nunca al body) */
  assert.match(site, /vuelve = hojaVuelve && hojaVuelve !== d\.body \? hojaVuelve : masBtn;/);
  /* un titulo raro no rompe el menu: si las direcciones no se arman, se copia */
  assert.match(site, /try \{ ligas = enlacesParaCompartir\(datos\.title, datos\.url\); \} catch \(err\) \{ ligas = null; \}/);
  /* lo unico que se le da a la hoja es ese { title, url }: nunca files, un Blob ni el PDF; y en todo site.js no hay otra llamada */
  assert.equal((site.match(/navigator\.share\(/g) || []).length, 1);
  assert.match(c, /pedido = navigator\.share\(datos\);/);
  assert.equal((site.match(/navigator\.canShare\(/g) || []).length, 1);
  const todo = c + site.slice(site.indexOf('/* EL MENU DE REPUESTO'), site.indexOf("if (copiarMuelle) copiarMuelle.addEventListener('click'"));
  assert.ok(!/files\s*:|new Blob|new File|\.pdf|pageSrc/.test(todo), 'ni archivos ni el PDF');
  /* se pide en el mismo toque: nada se espera antes de navigator.share */
  const antes = c.slice(c.indexOf('const compartir = '), c.indexOf('navigator.share(datos)'));
  assert.ok(!/await|\.then\(/.test(antes), 'navigator.share va antes de cualquier espera');
  /* sin hoja, o si falla (no AbortError) con el mismo libro abierto: el menu de repuesto */
  assert.match(c, /if \(!puedeCompartir\(datos\)\) \{ repuesto\(\); return; \}/);
  assert.match(c, /if \(\(!err \|\| err\.name !== 'AbortError'\) && abiertoId === id\) repuesto\(\);/);
  /* la decision vive en un solo sitio; el ordenador tambien abre la hoja del sistema (decidido: sin la pista de «pointer: coarse») */
  assert.equal((site.match(/puedeCompartir\(/g) || []).length, 1);
  assert.ok(!/bastaria con añadir/.test(site) && !/casi todo ordenador/.test(site));
  /* los tres que comparten: el muelle, la fila de «Más» (lector) y el boton de arriba del libro escrito */
  assert.match(site, /copiarMuelle\.addEventListener\('click', \(\) => compartir\(copiarMuelle, true\)\)/);
  assert.match(site, /tl\(copiado \? 'enlaceCopiado' : 'compartir'\), \(e\) => compartir\(e\.currentTarget, true\)/);
  assert.match(site, /copiarBtn\.addEventListener\('click', \(\) => compartir\(copiarBtn, false\)\)/);
  assert.match(site, /copiarBtn\.setAttribute\('aria-label', t\('book\.share'\)\);/);
  assert.match(site, /lz\('\[data-lector-compartir-hecho\]'\)\.textContent = tl\('enlaceCopiado'\);/);
  /* sigue escondido en el libro privado */
  assert.match(site, /copiarMuelle\.hidden = copiarBtn\.hidden;/);
  /* no hace falta ningun origen nuevo en la politica de contenido: compartir no llama a nadie */
  assert.ok(!/share|wa\.me|t\.me/i.test(leer('tools/politica-contenido.mjs')));
});
await ok('el menu de repuesto: WhatsApp, Correo, Telegram y «Copiar enlace»; los de fuera en otra pestaña sin referer, el correo en la misma', () => {
  const a = leer('src/components/Panels.astro');
  const m = a.slice(a.indexOf('<section class="compartir"'), a.indexOf('</section>', a.indexOf('<section class="compartir"')));
  assert.ok(m.length > 200);
  assert.match(a, /<section class="compartir" id="compartir-menu" role="dialog" aria-labelledby="compartir-t" data-compartir hidden>/);
  assert.match(a, /<div class="compartir__fondo" data-compartir-fondo hidden><\/div>/);
  const ops = [...m.matchAll(/data-compartir-op="([a-z]+)"/g)].map((x) => x[1]);
  assert.deepEqual(ops, ['whatsapp', 'correo', 'telegram', 'copiar']);
  for (const k of ['whatsapp', 'telegram']) assert.match(m, new RegExp('<a class="compartir__op" data-compartir-op="' + k + '" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">'));
  assert.match(m, /<a class="compartir__op" data-compartir-op="correo">/);
  assert.match(m, /<button class="compartir__op" type="button" data-compartir-op="copiar">/);
  assert.ok(!/drive/i.test(m), 'Drive no tiene direccion para compartir: no se finge');
  assert.ok(!/href=/.test(m), 'las direcciones las pone site.js con lector/compartir.js');
  /* el boton de arriba del libro escrito: «Compartir» */
  assert.match(a, /<span data-book-copiar-texto>\{t\('book\.share'\)\}<\/span>/);
  const site = leer('src/scripts/site.js');
  const menu = site.slice(site.indexOf('/* EL MENU DE REPUESTO'), site.indexOf("if (copiarMuelle) copiarMuelle.addEventListener('click'"));
  assert.match(menu, /ligas = enlacesParaCompartir\(datos\.title, datos\.url\);/);
  assert.match(menu, /op\.href = ligas\[k\];/);
  /* Escape cierra solo el menu (captura de la ventana) y el foco vuelve; el velo y Tab hacia fuera tambien cierran */
  assert.match(menu, /if \(e\.key !== 'Escape' \|\| !menuAbierto\(\)\) return;\s*e\.preventDefault\(\);\s*e\.stopImmediatePropagation\(\);\s*cerrarMenuCompartir\(true\);/);
  assert.match(menu, /menuFondo\.addEventListener\('click', \(\) => cerrarMenuCompartir\(true\)\);/);
  /* focusout: hacia fuera, o a ninguna parte, cierra (salvo con el dedo apretando dentro: Safari no da el foco al tocar) */
  assert.match(menu, /if \(!menuAbierto\(\) \|\| \(a && menuCompartir\.contains\(a\)\)\) return;\s*if \(!a && pulsandoMenu\) return;\s*cerrarMenuCompartir\(false\);/);
  /* los rotulos: el lector en es/en (lector.*); el libro escrito en los cinco idiomas (book.*) */
  assert.match(menu, /titulo: tl\('compartir'\), correo: tl\('correo'\), copiar: tl\('copiarEnlace'\), nueva: tl\('otraPestana'\)/);
  assert.match(menu, /titulo: t\('book\.share'\), correo: t\('book\.shareMail'\), copiar: t\('book\.copy'\), nueva: t\('book\.shareNewTab'\)/);
  for (const l of LANGS) for (const k of ['book.share', 'book.shareHelp', 'book.shareMail', 'book.shareNewTab', 'book.copy', 'book.copied']) assert.ok(typeof UI[l][k] === 'string' && UI[l][k].trim(), l + ' ' + k);
  const esperado = { es: 'Compartir', en: 'Share', pt: 'Compartilhar', fr: 'Partager', it: 'Condividi' };
  for (const l of LANGS) assert.equal(UI[l]['book.share'], esperado[l], l);
  for (const l of LANGS) assert.ok(UI[l]['book.shareNewTab'].includes('{n}'), l);
  for (const l of ['es', 'en']) for (const k of ['correo', 'copiarEnlace', 'otraPestana']) assert.ok(UI[l]['lector.' + k], l + ' ' + k);
  /* el telefono: hoja de abajo; de 820 px, junto al boton; un dedo de alto */
  const css = leer('src/styles/base.css');
  assert.match(css, /\.compartir__op \{[^}]*min-height: 3\.25rem/);
  assert.match(css, /@media \(min-width: 820px\) \{\s*\.compartir__fondo \{ background: transparent; animation: none; \}/);
});

/* ---- Etapa 5b: los botones del PDF de verdad (lector/gemeloBoton.js) ---- */
console.log('los botones «Duolingo» del PDF: el gemelo que se hunde y dice «Copiado»');
{
  const G = await import('../src/scripts/lector/gemeloBoton.js');
  const B = await import('../src/scripts/lector/botonEnPdf.js');
  const { enlaceDeCopia } = await import('../src/scripts/lector/copiaEnPdf.js');
  const { FUENTES_NOTA } = await import('../src/scripts/lector/notaEnPdf.js');
  const DUO = { e: 'duolingo', f: '#58cc02', c: '#ffffff', s: '#46a302', lh: 0.008, rr: 0.014, n: 1, x: 'Copiar', fu: 'Lora', fs: 0.025, pf: '#f6f3ea', k: 'Copiado' };
  const L = { x: 0.1, y: 0.5, w: 0.3, h: 0.05 };

  /* Un document de mentira: guarda lo que se escribe; innerHTML no existe (si alguien lo usa, revienta) */
  class Nodo {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {}; this._t = ''; this.className = '';
      const props = {}; this.style = { props, setProperty: (k, v) => { props[k] = String(v); } };
    }
    set innerHTML(_) { throw new Error('innerHTML'); }
    set textContent(v) { this._t = String(v); this.children = []; }
    get textContent() { return this._t + this.children.map((c) => c.textContent).join(''); }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    hasAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) || (k.startsWith('data-') && k.slice(5) in this.dataset); }
    removeAttribute(k) { delete this.attrs[k]; if (k.startsWith('data-')) delete this.dataset[k.slice(5)]; }
    click() { this.clics = (this.clics || 0) + 1; }
    append(...xs) { this.children.push(...xs); }
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      for (const c of this.children) { if (c.className.split(' ').includes(cls)) return c; const r = c.querySelector(sel); if (r) return r; }
      return null;
    }
  }
  const doc = { createElement: (t) => new Nodo(t) };

  await ok('copiar: el de siempre (#t=) sigue copiando, sin gemelo', () => {
    const r = G.botonDeEnlace(enlaceDeCopia('hola'));
    assert.deepEqual({ ...r }, { tipo: 'copia', texto: 'hola', aspecto: null });
  });
  await ok('copiar con aspecto: el texto y el aspecto limpio', () => {
    const r = G.botonDeEnlace(B.enlaceDeCopiaConAspecto('hola mundo', DUO));
    assert.equal(r.tipo, 'copia');
    assert.equal(r.texto, 'hola mundo');
    assert.equal(r.aspecto.e, 'duolingo');
    assert.equal(r.aspecto.k, 'Copiado');
  });
  await ok('un `&b=` falso no rompe el boton: copia como el de siempre, sin gemelo', () => {
    for (const b of ['zz', '!!!', 'eyJlIjoiZHVvbGluZ28ifQ&x=1', '']) {
      const r = G.botonDeEnlace(enlaceDeCopia('hola') + '&b=' + b);
      assert.ok(r && r.tipo === 'copia' && r.texto === 'hola' && r.aspecto === null, b);
    }
    /* y un copiar sin texto bueno no es nada */
    assert.equal(G.botonDeEnlace(B.BASE_COPIA + '&b=zz'), null);
    assert.equal(G.botonDeEnlace(B.BASE_COPIA + '%E0%A4%A'), null);
  });
  await ok('/ir/: solo https y en la forma exacta del Taller; lo demas no es nada (la zona queda quieta)', () => {
    const bueno = B.enlaceDeIr('https://example.com/a?b=1', DUO);
    const r = G.botonDeEnlace(bueno);
    assert.equal(r.tipo, 'ir');
    assert.equal(r.url, 'https://example.com/a?b=1');
    for (const u of ['http://example.com/', 'javascript:alert(1)', 'https://user:pw@example.com/', 'data:text/html,hi']) {
      assert.equal(G.botonDeEnlace(B.BASE_IR + encodeURIComponent(u)), null, u);
    }
    assert.equal(G.botonDeEnlace(B.BASE_IR + 'https://example.com/'), null, 'sin codificar');
    assert.equal(G.botonDeEnlace(bueno.replace('&b=', '&b=x')), null, 'aspecto falso en /ir/');
    assert.ok(G.pareceBoton(B.BASE_IR + 'loquesea'));
    assert.ok(!G.pareceBoton('https://example.com/'));
    /* la copia local (npm run dev) vale solo si se pide */
    const local = B.enlaceDeIr('https://example.com/', DUO, { origen: 'http://localhost:4321' });
    assert.equal(G.botonDeEnlace(local), null);
    assert.equal(G.botonDeEnlace(local, { origenes: ['http://localhost:4321/'] }).tipo, 'ir');
  });
  await ok('la caja del gemelo: la cara y su escalon; baja lo que mide el escalon', () => {
    const g = G.geometriaGemelo(L, DUO);
    assert.deepEqual(g.caja, { x: 0.1, y: 0.5, w: 0.3, h: 0.058 });
    assert.ok(Math.abs(g.cara - 0.05 / 0.058) < 1e-4);
    assert.ok(Math.abs(g.lh - 0.008 / 0.058) < 1e-4);
    assert.ok(Math.abs(g.cara + g.lh - 1) < 1e-4, 'la cara mas el escalon llenan el gemelo');
    assert.equal(g.hunde, true);
    assert.ok(Math.abs(g.radio - 0.014 / 0.058) < 1e-4);
    assert.ok(Math.abs(g.fs - 0.025 / 0.058) < 1e-4);
    /* la imagen de la pagina dentro de la cara: de la misma escala que la pagina */
    assert.ok(Math.abs(g.recorte.w - 1 / 0.3) < 1e-4 && Math.abs(g.recorte.h - 1 / 0.05) < 1e-4);
    assert.ok(Math.abs(g.recorte.x + 0.1 / 0.3) < 1e-4 && Math.abs(g.recorte.y + 0.5 / 0.05) < 1e-4);
    assert.equal(G.geometriaGemelo(L, { ...DUO, rr: 1 }).radio, 'pildora');
  });
  await ok('el escalon no se sale de la hoja; sin escalon, sin su color o sin papel, no baja', () => {
    const g = G.geometriaGemelo({ x: 0.1, y: 0.95, w: 0.3, h: 0.048 }, DUO);
    assert.ok(g.caja.y + g.caja.h <= 1 + 1e-9);
    for (const quita of ['lh', 's', 'pf']) { const a = { ...DUO }; delete a[quita]; assert.equal(G.geometriaGemelo(L, a).hunde, false, quita); }
    assert.equal(G.geometriaGemelo({ x: 0.1, y: 0.1, w: 0, h: 0.05 }, DUO), null);
    /* ni una mota (menos de LADO_MIN) ni una trampa que tapa la hoja (mas de AREA_MAX) */
    assert.equal(G.geometriaGemelo({ x: 0.1, y: 0.1, w: 0.008, h: 0.05 }, DUO), null);
    assert.equal(G.geometriaGemelo({ x: 0, y: 0, w: 0.9, h: 0.9 }, DUO), null);
    assert.ok(G.geometriaGemelo({ x: 0, y: 0, w: 0.7, h: 0.8 }, DUO), '0.56 de la hoja aun vale');
    assert.ok(G.LADO_MIN >= 0.01 && G.AREA_MAX <= 0.6 && G.GEMELOS_MAX > 0 && G.GEMELOS_MAX <= 40);
    assert.equal(G.geometriaGemelo({ x: 'a', y: 0, w: 1, h: 1 }, DUO), null);
    assert.equal(G.geometriaGemelo(null, DUO), null);
  });
  await ok('«Copiado»: el del Taller, o el del idioma del libro; dura un momento', () => {
    assert.equal(G.rotuloCopiado(DUO, 'en'), 'Copiado');
    assert.equal(G.rotuloCopiado({ ...DUO, k: undefined }, 'en'), 'Copied');
    assert.equal(G.rotuloCopiado(null, 'es'), 'Copiado');
    assert.equal(G.rotuloCopiado(null, 'pt'), 'Copiado');
    assert.ok(G.COPIADO_MS >= 1200 && G.COPIADO_MS <= 1800);
    /* sin sitio para la palabra (solo un icono) o sin nada que tape lo impreso, la pastilla de siempre */
    assert.equal(G.caraDibujable(DUO), true);
    assert.equal(G.caraDibujable({ ...DUO, l: 'solo' }), false);
    assert.equal(G.caraDibujable({ e: 'contorno', c: '#000000' }), false);
    assert.equal(G.caraDibujable({ e: 'relleno', f: '#000000', o: 50 }), false, 'medio transparente sin papel');
    assert.equal(G.caraDibujable({ e: 'relleno', f: '#000000' }), true);
  });
  await ok('la letra solo sale de la lista fija de las notas; otra cualquiera = la del sitio', () => {
    assert.equal(G.fuenteDeBoton('Lora', FUENTES_NOTA), 'lora');
    assert.equal(G.fuenteDeBoton('bricolage grotesque', FUENTES_NOTA), 'bricolage-grotesque');
    for (const f of ['Comic Sans', 'Lora;}body{display:none', '', null, 'constructor', '__proto__']) assert.equal(G.fuenteDeBoton(f, FUENTES_NOTA), null, String(f));
  });
  await ok('el gemelo se arma con textContent y setProperty: un «<img onerror>» en `x` o `k` es solo texto', () => {
    const malo = '<img src=x onerror=alert(1)>';
    const aspecto = B.aspectoDeCodigo(B.codigoDeAspecto({ ...DUO, x: malo, k: malo + '!' }));
    assert.equal(aspecto.x, malo, 'el aspecto lo deja como texto');
    const el = G.armarGemelo(doc, { tipo: 'copia', aspecto, L, etiqueta: aspecto.x });
    assert.equal(el.tagName, 'BUTTON');
    assert.equal(el.attrs['aria-label'], malo);
    const rotulo = el.querySelector('.flip__boton-rotulo');
    assert.equal(rotulo.textContent, malo);
    assert.equal(rotulo.children.length, 0, 'no se volvio un elemento');
    assert.ok(G.ponerCopiado(el, G.rotuloCopiado(aspecto, 'es')));
    assert.equal(rotulo.textContent, malo + '!');
    assert.equal(el.dataset.copiado, '');
    G.quitarCopiado(el, aspecto.x);
    assert.equal(rotulo.textContent, malo);
    assert.ok(!('copiado' in el.dataset));
    /* solo numeros y colores #rrggbb en las variables */
    for (const [k, v] of Object.entries(el.style.props)) assert.match(v, /^(-?\d+(\.\d+)?(e-?\d+)?|#[0-9a-f]{6})$/, k);
    assert.equal(el.style.props['--gb-f'], '#58cc02');
    assert.equal(el.dataset.hunde, '');
  });
  await ok('un color o un numero que no es del aspecto no llega al estilo', () => {
    const v = G.variablesGemelo(G.geometriaGemelo(L, DUO), { ...DUO, f: 'red;background:url(x)', c: '#FFF', bl: 'x' });
    assert.ok(!('--gb-f' in v) && !('--gb-c' in v) && !('--gb-bl' in v));
    assert.equal(G.variablesGemelo(G.geometriaGemelo(L, DUO), { ...DUO, bl: 'punteado' })['--gb-bl'], 'dotted');
    for (const bl of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) assert.ok(!('--gb-bl' in G.variablesGemelo(G.geometriaGemelo(L, DUO), { ...DUO, bl })), bl);
  });
  await ok('el gemelo de /ir/ es un enlace a la direccion, en otra pestaña, sin decir de donde viene', () => {
    const el = G.armarGemelo(doc, { tipo: 'ir', url: 'https://example.com/', aspecto: DUO, L, etiqueta: 'x' });
    assert.equal(el.tagName, 'A');
    assert.equal(el.href, 'https://example.com/');
    assert.equal(el.target, '_blank');
    assert.equal(el.rel, 'noopener noreferrer');
    assert.equal(el.referrerPolicy, 'no-referrer');
    assert.equal(G.armarGemelo(doc, { tipo: 'otro', aspecto: DUO, L }), null);
  });
  await ok('reglas del archivo: sin HTML a mano, sin las notas en el paquete, letras solo por la lista', () => {
    const s = leer('src/scripts/lector/gemeloBoton.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML|eval\(|document\.write|fonts\.googleapis/.test(s));
    assert.ok(!/notaEnPdf/.test(s), 'no importa las notas (llegan con import() en site.js)');
    const site = leer('src/scripts/site.js');
    const g = site.slice(site.indexOf('/* LOS GEMELOS DE LOS BOTONES'), site.indexOf('let fb = null;'));
    /* la letra: solo por la lista fija, y la pide la MISMA pieza que la de las notas (hojaNota.ponerFuente), despues de que el
       gemelo salio (sin caja buena no se pide nada) */
    assert.match(g, /if \(!g\) return null;[\s\S]*fuenteDeBoton\(boton\.aspecto\.fu, leerNota\.FUENTES_NOTA\)/);
    assert.match(site, /import\('\.\/lector\/hojaNota\.js'\)\.then\(\(m\) => \{ if \(gen === fbGen\) letras\.forEach\(\(\[r, id\]\) => m\.ponerFuente\(r, id\)\); \}\)/);
    assert.ok(!/createElement\('link'\)/.test(g), 'ninguna hoja de letras escrita aqui');
    assert.ok(!/aspecto\.fu[^,)]*\+|`[^`]*\$\{[^}]*\.fu/.test(g), 'el nombre de la letra nunca se escribe en una direccion ni en un CSS');
    /* la imagen de la pagina se escucha una sola vez */
    assert.match(g, /img\.addEventListener\('load', igualar, \{ once: true \}\)/);
    /* el nombre del /ir/: primero el dominio, con funciones */
    assert.match(g, /\.replace\('\{u\}', \(\) => host\);\s*return x \? plantilla\.replace\('\{t\}', \(\) => x\) : plantilla;/);
    /* las notas llegan solo si hay un boton de verdad con aspecto, no cualquier enlace con «&b=» */
    assert.match(site, /L\.href\.includes\('&b='\) && pareceBoton\(L\.href, \{ origenes: ORIGENES_NOTA \}\)/);
    /* tope de gemelos por pagina */
    assert.match(site, /gemelosAqui < GEMELOS_MAX \? gemeloDe\(/);
    assert.ok(!/innerHTML/.test(g));
    /* el /ir/ sin aspecto tambien va directo, sin decir de donde viene */
    assert.match(site, /a\.href = boton\.url; a\.target = '_blank'; a\.rel = 'noopener noreferrer'; a\.referrerPolicy = 'no-referrer';/);
    /* lo que dice ser un boton y no lo es no se pinta */
    assert.match(site, /if \(dice && !boton\) return;/);
    /* el pulsador sabe si se pidio menos movimiento; un pulsado no se queda abajo; al salir del lector todo vuelve */
    assert.match(site, /crearPulsador\(\{ quieto: \(\) => quiet\.matches \}\)/);
    assert.match(site, /addEventListener\('blur', pulsador\.soltar\);/);
    assert.match(site, /flipBox\.addEventListener\('lostpointercapture'/);
    const salir = site.slice(site.indexOf('function salirDelLector() {'), site.indexOf('function salirDelLector() {') + 1500);
    assert.match(salir, /pulsador\.limpiar\(\);\s*clearTimeout\(copiadoTimer\);/);
    const css = leer('src/styles/base.css');
    assert.match(css, /\.flip__boton > span, \.flip__boton-cara > \* \{ position: absolute; pointer-events: none; \}/, 'los hijos no reciben toques');
    assert.match(css, /\.flip__boton:focus-visible::after \{ outline: 2px solid/);
    assert.match(css, /prefers-reduced-motion: reduce\)[\s\S]*\.flip__boton-cara, \.flip__boton-papel, \.flip__boton-foto \{ transition: none; \}/);
    /* solo el que se hunde deja el tinte de los enlaces; la sombra del lomo pasa por encima */
    assert.match(css, /\.flip__link\.flip__boton\[data-hunde\]:hover, \.flip__link\.flip__boton\[data-hunde\]:focus-visible, \.flip__link\.flip__boton\[data-hunde\]:active \{ background: none; box-shadow: none; \}/);
    assert.ok(!/\.flip__link\.flip__boton:hover/.test(css));
    assert.match(css, /\.flip__page:has\(> \.flip__boton\)::after \{ z-index: 1; \}/);
  });
  /* EL PULSADOR, con un reloj de mentira */
  const reloj = () => {
    let n = 0; const pend = new Map();
    return { poner: (f, ms) => { n++; pend.set(n, { f, ms }); return n; }, quitar: (id) => pend.delete(id), correr: () => { const xs = [...pend.values()]; pend.clear(); xs.forEach((x) => x.f()); }, pend };
  };
  const gemelo = (tipo, aspecto = DUO) => G.armarGemelo(doc, { tipo, url: 'https://example.com/', aspecto, L, etiqueta: 'e' });
  await ok('pulsador: baja con escalon y vuelve; sin escalon o con «menos movimiento», no baja', () => {
    const r = reloj();
    let quieto = false;
    const P = G.crearPulsador({ quieto: () => quieto, poner: r.poner, quitar: r.quitar });
    const a = gemelo('copia'), b = gemelo('copia');
    assert.equal(P.hundir(a), true);
    assert.ok(a.hasAttribute('data-pulsado'));
    assert.equal(P.hundir(b), true);
    assert.ok(!a.hasAttribute('data-pulsado') && b.hasAttribute('data-pulsado'), 'solo uno abajo');
    P.soltar();
    assert.ok(!b.hasAttribute('data-pulsado'));
    assert.equal(P.abajo(), null);
    const plano = gemelo('copia', { ...DUO, lh: undefined });
    assert.equal(P.hundir(plano), false);
    quieto = true;
    assert.equal(P.hundir(a), false);
    assert.ok(!a.hasAttribute('data-pulsado'));
  });
  await ok('pulsador: Espacio en un enlace abre al soltar, solo si empezo en el mismo; Enter no lo abre dos veces', () => {
    const P = G.crearPulsador();
    const ir = gemelo('ir'), otro = gemelo('ir');
    const ev = (key, extra = {}) => ({ key, ...extra });
    assert.equal(P.teclaAbajo(ir, ev(' ')), true, 'Espacio en un enlace: se impide bajar la pagina');
    assert.ok(ir.hasAttribute('data-pulsado'));
    P.teclaArriba(ir, ev(' '));
    assert.equal(ir.clics, 1);
    assert.ok(!ir.hasAttribute('data-pulsado'));
    /* empezo en otro: no abre */
    P.teclaAbajo(otro, ev(' '));
    P.teclaArriba(ir, ev(' '));
    assert.equal(ir.clics, 1);
    assert.equal(otro.clics || 0, 0);
    /* soltar sin haber bajado aqui: nada */
    P.teclaArriba(ir, ev(' '));
    assert.equal(ir.clics, 1);
    /* Enter: el navegador ya hace clic al bajar; al soltar no se repite */
    assert.equal(P.teclaAbajo(ir, ev('Enter')), false);
    P.teclaArriba(ir, ev('Enter'));
    assert.equal(ir.clics, 1);
    /* con Ctrl, o la tecla repetida, no baja otra vez */
    assert.equal(P.teclaAbajo(ir, ev(' ', { ctrlKey: true })), false);
    P.soltar();
    P.teclaAbajo(ir, ev(' ', { repeat: true }));
    assert.ok(!ir.hasAttribute('data-pulsado'));
    /* un boton de copiar: Espacio no se impide (el navegador hace el clic) */
    assert.equal(P.teclaAbajo(gemelo('copia'), ev(' ')), false);
    assert.equal(P.teclaAbajo(null, ev(' ')), false);
  });
  await ok('pulsador: «Copiado» dura COPIADO_MS y vuelve; otro lo cambia; limpiar lo quita todo', () => {
    const r = reloj();
    const P = G.crearPulsador({ poner: r.poner, quitar: r.quitar });
    const a = gemelo('copia'), b = gemelo('copia');
    let fin = 0;
    assert.ok(P.copiado(a, 'Copiado', 'Copiar', () => fin++));
    assert.equal(a.querySelector('.flip__boton-rotulo').textContent, 'Copiado');
    assert.equal([...r.pend.values()][0].ms, G.COPIADO_MS);
    P.copiado(b, 'Copied', 'Copy');
    assert.equal(a.querySelector('.flip__boton-rotulo').textContent, 'Copiar', 'el primero vuelve al copiar otro');
    assert.ok(!('copiado' in a.dataset));
    assert.equal(r.pend.size, 1, 'un solo reloj');
    r.correr();
    assert.equal(b.querySelector('.flip__boton-rotulo').textContent, 'Copy');
    assert.equal(P.diciendo(), null);
    assert.equal(fin, 0, 'el aviso del primero no corre: lo corto el segundo');
    P.copiado(a, 'Copiado', 'Copiar', () => fin++);
    r.correr();
    assert.equal(fin, 1);
    P.copiado(a, 'Copiado', 'Copiar');
    P.hundir(a);
    P.limpiar();
    assert.equal(r.pend.size, 0);
    assert.ok(!a.hasAttribute('data-pulsado') && !('copiado' in a.dataset));
    assert.equal(a.querySelector('.flip__boton-rotulo').textContent, 'Copiar');
    assert.equal(P.copiado({}, 'x', 'y'), false, 'sin rotulo no hay «Copiado»');
  });
  await ok('los textos nuevos, en es y en', () => {
    for (const k of ['irBoton', 'irBotonSolo']) for (const l of ['es', 'en']) assert.ok(UI[l]['lector.' + k].includes('{u}'), `${l} ${k}`);
    assert.equal(UI.es['lector.irA'], 'Ir a la página', 'la clave vieja sigue igual');
  });
}

/* Las notas y el indice (etapa 5a): tools/test-notas.mjs, con el mismo contador */
const { probarNotas } = await import('./test-notas.mjs');
await probarNotas(ok);

console.log(`\n${bien} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
