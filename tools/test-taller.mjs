/* LAS PRUEBAS DEL TALLER (Developer-Mode → Taller): lo que no necesita navegador.
     node tools/test-taller.mjs
   Las pruebas de `pruebas-taller.mjs` y la puerta de los cinco requisitos corren aqui tambien. */
import assert from 'node:assert/strict';
import { ConfigPagina } from '../src/scripts/contenido/taller/ConfigPagina.js';
import { Zona } from '../src/scripts/contenido/taller/Zona.js';
import { Pieza } from '../src/scripts/contenido/taller/Pieza.js';
import { Obra } from '../src/scripts/contenido/taller/Obra.js';
import { nombreDeFuente, urlGoogle, listaDeFuentes, FUENTES_MARCA } from '../src/scripts/contenido/taller/fuentes.js';
import { colorValido, tamanoValido, limpiarMarcas } from '../src/scripts/contenido/taller/marcas.js';
import { limpiarContenido, cabeEnElCapitulo, llavesDe, aNodos, textoLibro, TOPE_NODOS } from '../src/scripts/contenido/taller/TextoLibro.js';
import { aHoja, ETIQUETAS_HOJA, ATRIBUTOS_HOJA, ESTILOS_HOJA } from '../src/scripts/contenido/taller/hoja.js';
import { RepositorioTallerMemoria, RepositorioTallerSupabase, decidir } from '../src/scripts/contenido/taller/Repositorio.js';
import { Autoguardado } from '../src/scripts/portal/panel/dev/taller/Autoguardado.js';
import { CASOS } from './pruebas-taller.mjs';
import { revisarTiposTaller } from './revisar-tipos-taller.mjs';

let bien = 0, mal = 0;
async function ok(nombre, fn) {
  try { await fn(); bien++; } catch (e) { mal++; console.log(`  FALLA  ${nombre}\n         ${e.message}`); }
}
const parrafo = (t, marks) => ({ type: 'paragraph', content: [{ type: 'text', text: t, ...(marks ? { marks } : {}) }] });
const doc = (...c) => ({ doc: { type: 'doc', content: c } });

console.log('el texto del libro');
await ok('un parrafo de 5000 letras no se corta', () => {
  const t = 'a'.repeat(5000);
  assert.equal(limpiarContenido(doc(parrafo(t))).contenido.doc.content[0].content[0].text, t);
});
await ok('el hebreo conserva RLM y ZWJ; se va lo que da la vuelta al texto', () => {
  assert.equal(textoLibro('אהבה‏ a‍b'), 'אהבה‏ a‍b');
  assert.equal(textoLibro('a‮b\u0007'), 'ab');
});
await ok('lo desconocido pierde su forma pero no sus palabras, y se cuenta', () => {
  const r = limpiarContenido(doc({ type: 'iframe', content: [{ type: 'text', text: 'palabra' }] }));
  assert.equal(r.descartados, 1);
  assert.equal(r.contenido.doc.content[0].content[0].text, 'palabra');
});
await ok('__proto__, enlaces javascript y estilos colados no pasan', () => {
  const r = limpiarContenido(JSON.parse('{"doc":{"type":"doc","content":[{"type":"paragraph","__proto__":{"x":1},"content":[{"type":"text","text":"a","marks":[{"type":"link","attrs":{"href":"javascript:x"}},{"type":"textStyle","attrs":{"color":"red;background:url(x)","fontFamily":"x\\");}"}}]}]}]}}'));
  assert.equal(r.contenido.doc.content[0].content[0].marks, undefined);
});
await ok('columnas dentro de columnas se aplanan sin perder texto', () => {
  const col = (c) => ({ type: 'columna', content: c });
  const r = limpiarContenido(doc({ type: 'columnas', attrs: { anchos: [1, 1] }, content: [col([{ type: 'columnas', attrs: { anchos: [1, 1] }, content: [col([parrafo('dentro')]), col([])] }]), col([])] }));
  assert.ok(JSON.stringify(r.contenido).includes('dentro'));
  assert.equal(JSON.stringify(r.contenido).match(/"columnas"/g).length, 1);
});
await ok('limpiar dos veces da lo mismo, con un libro de 218 mil letras', () => {
  const c = Array.from({ length: 1400 }, (_, i) => parrafo(`Parrafo ${i} `.repeat(13)));
  const uno = limpiarContenido(doc(...c)), dos = limpiarContenido(uno.contenido);
  assert.deepEqual(uno.contenido, dos.contenido);
  assert.ok(uno.letras > 200000);
  assert.ok(cabeEnElCapitulo(uno));
});
await ok('lo que pasa de los topes no cabe: nunca se corta', () => {
  assert.equal(cabeEnElCapitulo({ nodos: TOPE_NODOS + 1, contenido: {} }), false);
  assert.equal(cabeEnElCapitulo({ nodos: 1, contenido: { t: 'a'.repeat(3100000) } }), false);
});
await ok('las llaves se leen del texto, sin repetir', () => {
  assert.deepEqual(llavesDe(limpiarContenido(doc(parrafo('Hola {nombre}, {nombre} y {mascota}. {sin cerrar'))).contenido), ['nombre', 'mascota']);
});

console.log('marcas y fuentes');
await ok('color y tamaño', () => {
  assert.equal(colorValido('rgb(255, 0, 16)'), '#ff0010');
  assert.equal(colorValido('red'), '');
  assert.equal(tamanoValido('13.5pt'), '13.5pt');
  assert.equal(tamanoValido('1000pt'), '');
  assert.equal(tamanoValido('12px;x'), '');
  assert.equal(limpiarMarcas([{ type: 'bold' }, { type: 'mala' }]).length, 1);
});
await ok('el nombre de una fuente no puede colar nada', () => {
  for (const n of ['Inter&family=x', 'x");}', '../a', '', 'a'.repeat(61)]) assert.equal(nombreDeFuente(n), false, n);
  assert.equal(urlGoogle('Noto Serif Hebrew'), 'https://fonts.googleapis.com/css2?family=Noto+Serif+Hebrew&display=swap');
  assert.equal(urlGoogle('x&y'), '');
});
await ok('las de la marca estan siempre y Estonia entre ellas', () => {
  assert.ok(FUENTES_MARCA.includes('Estonia'));
  assert.deepEqual(listaDeFuentes(['Lora', 'x&y', 'Lora']).slice(-1), ['Lora']);
});

console.log('la pagina');
await ok('148 mm a 300 ppp son 1748 px; los margenes dan porcentajes', () => {
  const c = new ConfigPagina({});
  assert.deepEqual(c.pxPara(), { ancho: 1748, alto: 2480 });
  assert.equal(c.aPorcentajes().izq, 12.16);
});
await ok('los valores raros caen a los de siempre, y sin caja de texto hay error', () => {
  assert.equal(new ConfigPagina({ anchoMm: 1, altoMm: 'x' }).anchoMm, 148);
  assert.deepEqual(new ConfigPagina({ margenes: { izq: 70, der: 70 } }).errores(), ['margenes']);
});

console.log('los diseños de Figma');
const ahava = new Pieza({ anchoMm: 578.6, altoMm: 818.4, paginas: [
  { n: 1, caja: { x: 0, y: 0, w: 100, h: 100 }, sangre: true, texto: 'corto' },
  { n: 2, caja: { x: 20, y: 20, w: 60, h: 60 }, texto: 'a'.repeat(30) }
] });
await ok('Ahava: la proporcion encaja en A5 aunque el tamaño no', () => {
  const r = ahava.revisarContraLibro(new ConfigPagina({}));
  assert.equal(r.proporcion, true);
  assert.equal(r.tamano, false);
});
await ok('avisa lo que se sale y lo que no tiene texto; al cambiar margenes, cambia sin leer pixeles', () => {
  const r = ahava.revisarContraLibro(new ConfigPagina({}));
  assert.deepEqual(r.fuera.map((f) => f.n), [1]);
  assert.equal(r.fuera[0].sangre, true);
  assert.deepEqual(r.sinTexto, [1]);
  assert.deepEqual(ahava.revisarContraLibro(new ConfigPagina({ margenes: { izq: 50, der: 18, sup: 20, inf: 22 } })).fuera.map((f) => f.n), [1, 2]);
});
await ok('una ruta ajena en una pagina no entra', () => {
  assert.equal(new Pieza({ paginas: [{ ruta: 'https://x.com/a.webp' }] }).paginas[0].ruta, '');
});
await ok('una zona no sale de la pagina, y conserva sus bloques', () => {
  const z = new Zona({ id: 'z-abcd1234', x: 90, y: 90, w: 50, h: 1, bloques: [{ tipo: 'quiz', id: 'q', datos: { a: 1 } }, { tipo: '<x>' }] });
  assert.equal(z.x + z.w, 100);
  assert.equal(z.h, 5);
  assert.equal(z.bloques.length, 1);
  assert.equal(new Zona({ x: 0, y: 0, w: 10, h: 10 }).seCruzaCon(new Zona({ x: 50, y: 50, w: 10, h: 10 })), false);
});

console.log('la hoja');
const permitido = (n) => {
  if ('texto' in n) return;
  assert.ok(ETIQUETAS_HOJA.has(n.tag), n.tag);
  Object.keys(n.attrs || {}).forEach((k) => assert.ok(ATRIBUTOS_HOJA.has(k), k));
  Object.keys(n.estilo || {}).forEach((k) => assert.ok(ESTILOS_HOJA.has(k), k));
  (n.hijos || []).forEach(permitido);
};
await ok('todos los casos salen solo con etiquetas, atributos y estilos permitidos', () => {
  for (const c of Object.values(CASOS).flatMap((x) => [...x.bueno, ...x.hostil])) aNodos(doc(c), 'pdf').forEach(permitido);
});
await ok('el indice, los capitulos, y el arreglo de la letra capital partida', () => {
  const obra = new Obra({ titulo: 'T', pagina: { indice: true } }).aDatos();
  const h = aHoja(obra, [{ titulo: 'Uno', contenido: doc(parrafo('a')) }]);
  assert.match(h.css, /target-counter/);
  assert.match(h.css, /\.capital\[data-split-from\]::first-letter/);
  assert.match(h.css, /size: 148mm 210mm/);
  h.nodos.forEach(permitido);
  assert.ok(JSON.stringify(h.nodos).includes('#cap-1'));
});
await ok('una pagina de diseño sale con su imagen; sin imagen, no sale rota', () => {
  const pieza = { ajuste: 'contener', paginas: [{ ruta: 'taller/o/p/1.webp', alt: 'Dibujo', texto: '' }] };
  const con = aNodos(doc({ type: 'paginasPdf', attrs: { pieza: 'p1' } }), 'pdf', { piezas: { p1: pieza }, imagenes: { 'taller/o/p/1.webp': 'data:image/webp;base64,AA' } });
  assert.equal(con[0].hijos[0].hijos[0].attrs.alt, 'Dibujo');
  assert.equal(aNodos(doc({ type: 'paginasPdf', attrs: { pieza: 'p1' } }), 'pdf', { piezas: { p1: pieza } })[0].hijos.length, 0);
});

console.log('dos pestañas');
await ok('guardar normal, mi guardado tardio y el conflicto', async () => {
  const r = new RepositorioTallerMemoria();
  const { id } = await r.crearObra({ titulo: 'T' });
  const { capitulos: [c] } = await r.abrir(id);
  const uno = await r.guardarCapitulo({ ...c, titulo: 'a' }, 'yo');
  assert.equal(uno.rev, 2);
  assert.deepEqual(await r.guardarCapitulo({ ...c, titulo: 'b' }, 'yo'), { reintentar: true, rev: 2 });
  await r.guardarCapitulo({ ...c, rev: 2, titulo: 'c' }, 'otra');
  assert.deepEqual(await r.guardarCapitulo({ ...c, titulo: 'd' }, 'yo'), { error: 'conflicto', rev: 3 });
});
await ok('sin fila a la vista (la sesion se fue) es permiso, no conflicto', () => {
  assert.deepEqual(decidir(null, 'yo'), { error: 'permiso' });
});
await ok('una copia automatica sin cambios no se repite, y restaurar devuelve lo de antes', async () => {
  const r = new RepositorioTallerMemoria();
  const { id } = await r.crearObra({ titulo: 'T' });
  await r.copia(id, 'auto');
  assert.equal((await r.copia(id, 'auto')).omitida, true);
  const { capitulos: [c] } = await r.abrir(id);
  await r.guardarCapitulo({ ...c, titulo: 'nuevo' }, 'yo');
  const [v] = (await r.versiones(id)).filas;
  await r.restaurar(v.id);
  assert.equal((await r.abrir(id)).capitulos[0].titulo, 'Capítulo 1');
});

console.log('el guardado automatico');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const guardador = (respuestas) => {
  const estados = [], llamadas = [];
  const g = new Autoguardado({ inactivoMs: 5, maximoMs: 30, reintentoMs: 5, alEstado: (e) => estados.push(e),
    guardar: async () => { llamadas.push(1); await dormir(2); return respuestas.length > 1 ? respuestas.shift() : respuestas[0]; } });
  return { g, estados, llamadas };
};
await ok('guarda al dejar de escribir, y nunca dos a la vez', async () => {
  const { g, estados, llamadas } = guardador([{ ok: true }]);
  g.marcar(); g.marcar();
  await dormir(30);
  assert.equal(llamadas.length, 1);
  assert.equal(estados.at(-1), 'guardado');
});
await ok('lo escrito mientras guardaba no se pierde', async () => {
  const { g, llamadas } = guardador([{ ok: true }]);
  g.marcar();
  await dormir(6);
  g.marcar();
  await dormir(30);
  assert.equal(llamadas.length, 2);
  assert.equal(g.sucio, false);
});
await ok('sin red reintenta solo', async () => {
  const { g, estados } = guardador([{ error: 'red' }, { ok: true }]);
  g.marcar();
  await dormir(150);
  assert.ok(estados.includes('red'));
  assert.equal(estados.at(-1), 'guardado');
});
await ok('un conflicto detiene el guardado y lo escrito sigue marcado', async () => {
  const { g, estados, llamadas } = guardador([{ error: 'conflicto' }]);
  g.marcar();
  await dormir(20);
  assert.equal(estados.at(-1), 'conflicto');
  g.marcar();
  await dormir(20);
  assert.equal(llamadas.length, 1);
  assert.equal(await g.vaciar(), false);
});
await ok('vaciar guarda ya y espera', async () => {
  const { g } = guardador([{ ok: true }]);
  g.marcar();
  assert.equal(await g.vaciar(), true);
});

await ok('un error desconocido se reintenta, y lleno o permiso vuelven a probar al siguiente cambio', async () => {
  const uno = guardador([{ error: 'generico' }, { ok: true }]);
  uno.g.marcar();
  await dormir(150);
  assert.equal(uno.estados.at(-1), 'guardado');
  const dos = guardador([{ error: 'lleno' }, { ok: true }]);
  dos.g.marcar();
  await dormir(40);
  assert.equal(dos.estados.at(-1), 'lleno');
  assert.equal(dos.llamadas.length, 1);
  dos.g.marcar();
  await dormir(40);
  assert.equal(dos.estados.at(-1), 'guardado');
});
await ok('escribir no repite «sin guardar» a cada tecla', () => {
  const { g, estados } = guardador([{ ok: true }]);
  g.marcar(); g.marcar(); g.marcar();
  g.soltar();
  assert.equal(estados.filter((e) => e === 'sucio').length, 1);
});

console.log('el repositorio de la base');
await ok('sin red, el cliente devuelve un error sin codigo: eso es «red», no «generico»', async () => {
  const repo = new RepositorioTallerSupabase({});
  assert.deepEqual(await repo.pedir(Promise.resolve({ data: null, error: { code: '', message: 'Failed to fetch' } })), { error: 'red' });
  assert.deepEqual(await repo.pedir(Promise.resolve({ data: null, error: { code: '42501' } })), { error: 'permiso' });
  assert.deepEqual(await repo.pedir(Promise.resolve({ data: null, error: { code: 'TA001' } })), { error: 'lleno' });
  assert.deepEqual(await repo.pedir(Promise.resolve({ data: null, error: { code: 'XX000' } })), { error: 'generico' });
  assert.deepEqual(await repo.pedir(Promise.reject(new Error('x'))), { error: 'red' });
});
await ok('restaurar deja a la otra pestaña en conflicto, y guardar no cambia el orden', async () => {
  const r = new RepositorioTallerMemoria();
  const { id } = await r.crearObra({ titulo: 'T' });
  await r.crearCapitulo(id, 'Dos');
  const { capitulos: [a, b] } = await r.abrir(id);
  await r.ordenar(id, [b.id, a.id]);
  await r.guardarCapitulo(a, 'b');
  assert.equal((await r.abrir(id)).capitulos[0].id, b.id);
  await r.copia(id, 'manual');
  const [v] = (await r.versiones(id)).filas;
  const { capitulos } = await r.abrir(id);
  const mio = capitulos.find((c) => c.id === a.id);
  await r.restaurar(v.id);
  assert.equal((await r.guardarCapitulo(mio, 'b')).error, 'conflicto');
});
await ok('lo que el editor deja: numero de inicio de una lista, titulos en hebreo, enlaces malos contados', () => {
  const l = limpiarContenido(doc({ type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [parrafo('a')] }] }));
  assert.equal(l.contenido.doc.content[0].attrs.start, 3);
  assert.equal(aNodos(l.contenido, 'pdf')[0].attrs.start, '3');
  assert.equal(new Obra({ titulo: 'אהבה\u200F' }).titulo, 'אהבה\u200F');
  assert.equal(limpiarContenido(doc(parrafo('a', [{ type: 'link', attrs: { href: 'http://x.com' } }]))).descartados, 1);
  let hondo = parrafo('palabra');
  for (let i = 0; i < 60; i++) hondo = { type: 'blockquote', content: [hondo] };
  assert.ok(JSON.stringify(limpiarContenido(doc(hondo)).contenido).includes('palabra'));
  assert.equal(new ConfigPagina({ cuerpo: { interlinea: 1.45 } }).cuerpo.interlinea, 1.45);
});

console.log('la puerta de los bloques');
await ok('un tipo sin pruebas para la compilacion', async () => {
  const { TIPOS } = await import('../src/scripts/contenido/taller/tipos/indice.js');
  await assert.rejects(revisarTiposTaller(undefined, { CASOS: { ...CASOS, cita: undefined } }, { TIPOS }), /faltan sus pruebas/);
});

console.log(`\n${bien} bien, ${mal} mal`);
if (mal) process.exit(1);
