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
  for (const [k, hueco] of [['lector.volver', '{n}'], ['lector.de', '{t}'], ['lector.paginaDe', '{n}'], ['lector.paginaDe', '{t}'], ['lector.llega', '{n}'], ['lector.empieza', '{n}'], ['lector.numero', '{a}'], ['lector.numero', '{n}']]) {
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
  assert.match(a, /data-lector-copiar hidden/);
  assert.ok(!/\son[a-z]+=["{]/.test(a.slice(a.indexOf('id="book-panel"'), a.indexOf('id="book-mark"'))), 'sin manejadores en linea (la politica de contenido no los deja)');
  /* «Marcar» e «Índice» son de etapas que vienen: aun no estan */
  assert.ok(!/data-lector-(marcar|indice)/.test(a));
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
  assert.match(salir, /\[banda, ruta, hojaMas, \.\.\.lados\]\.forEach\(\(x\) => x\.removeAttribute\('lang'\)\)/, 'el idioma del libro no se queda en el libro escrito');
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

console.log(`\n${bien} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
