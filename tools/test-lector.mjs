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
  /* y el boton del lector en PDF usa su propia clave */
  assert.match(leer('src/components/Panels.astro'), /t\('book\.toContents'\)/);
  assert.ok(!/t\('book\.contents'\)/.test(leer('src/components/Panels.astro')));
});

console.log('el marcado');
await ok('Panels.astro lleva Volver, Contenido (oculto de entrada) y la barra con su etiqueta y sus teclas', () => {
  const a = leer('src/components/Panels.astro');
  assert.match(a, /data-book-volver[^>]*aria-keyshortcuts="B"[^>]*disabled/);
  assert.match(a, /data-book-contenido[^>]*hidden/);
  assert.match(a, /type="range"[^>]*data-book-barra/);
  assert.match(a, /<span class="sr-only">\{t\('a11y\.bookSlider'\)\}<\/span>/);
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

console.log(`\n${bien} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
