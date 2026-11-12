/* LAS PRUEBAS DEL TALLER (Developer-Mode → Taller): lo que no necesita navegador.
     node tools/test-taller.mjs
   Las pruebas de `pruebas-taller.mjs` y la puerta de los cinco requisitos corren aqui tambien. */
import assert from 'node:assert/strict';
import { ConfigPagina, mmAPx, pxAMm, TAMANOS } from '../src/scripts/contenido/taller/ConfigPagina.js';
import { contraste, textosPocoVisibles, tintaPara } from '../src/scripts/contenido/taller/colores.js';
import { Imagenes } from '../src/scripts/portal/panel/dev/taller/Imagenes.js';
import { POR_NODO } from '../src/scripts/contenido/taller/tipos/indice.js';
import { Zona } from '../src/scripts/contenido/taller/Zona.js';
import { Pieza } from '../src/scripts/contenido/taller/Pieza.js';
import { Obra } from '../src/scripts/contenido/taller/Obra.js';
import { nombreDeFuente, urlGoogle, listaDeFuentes, FUENTES_MARCA } from '../src/scripts/contenido/taller/fuentes.js';
import { colorValido, tamanoValido, limpiarMarcas } from '../src/scripts/contenido/taller/marcas.js';
import { limpiarContenido, cabeEnElCapitulo, llavesDe, aNodos, textoLibro, TOPE_NODOS } from '../src/scripts/contenido/taller/TextoLibro.js';
import { limpiarObjetos } from '../src/scripts/contenido/taller/tipos/objetos.js';
import { aHoja, cssLibro, ETIQUETAS_HOJA, ATRIBUTOS_HOJA, ESTILOS_HOJA } from '../src/scripts/contenido/taller/hoja.js';
import { aVersion2, necesitaMigrar, tituloDe } from '../src/scripts/contenido/taller/Migrar.js';
import { fueraDeMargen } from '../src/scripts/contenido/taller/tipos/paginaLibre.js';
import { OPCIONES_KATEX } from '../src/scripts/contenido/taller/tipos/formula.js';
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
await ok('el indice sale con sus numeros, cada capitulo con su ancla, y la caja del texto en pixeles enteros', () => {
  const obra = new Obra({ titulo: 'T', pagina: { indice: true } }).aDatos();
  const h = aHoja(obra, [{ titulo: 'Uno', contenido: doc(parrafo('a')) }], { indice: [{ titulo: 'Uno', pagina: 2, capitulo: 1 }] });
  assert.match(h.css, /size: 420pt 595pt/);
  assert.ok(!/target-counter/.test(h.css));
  h.nodos.forEach(permitido);
  assert.ok(JSON.stringify(h.nodos).includes('#cap-1'));
  assert.equal(h.titulo, 'T');
  const p = new ConfigPagina({}).enPixeles();
  assert.deepEqual([p.W, p.H, p.ancho, p.alto], [559, 794, 423, 635]);
  assert.ok(Math.abs(p.mrImpresion - 69) < .02 && Math.abs(p.mbImpresion - 82.33) < .02, `${p.mrImpresion} ${p.mbImpresion}`);
});
await ok('una pagina libre: fondo, recorte que no toca la imagen, y lo raro no pasa', () => {
  const nodo = (o) => ({ type: 'paginaLibre', attrs: { fondo: 'taller/o/p/1.webp', objetos: o } });
  const img = { id: 'o-abcd1234', tipo: 'imagen', ruta: 'taller/o/i.webp', x: 10, y: 10, w: 40, h: 30, rot: 12, crop: { l: .25, t: 0, r: .25, b: 0 } };
  const imagenes = { 'taller/o/p/1.webp': 'data:image/webp;base64,AA', 'taller/o/i.webp': 'data:image/webp;base64,BB' };
  const [{ hijos: [h] }] = aNodos(doc(nodo([img])), 'pdf', { imagenes });
  h.hijos.forEach(permitido);
  assert.equal(h.hijos.length, 2);
  assert.equal(h.hijos[1].estilo.transform, 'rotate(12deg)');
  assert.equal(h.hijos[1].hijos[0].estilo.width, '200%');
  assert.equal(h.hijos[1].hijos[0].estilo.left, '-50%');
  const r = limpiarContenido(doc(nodo([{ tipo: 'imagen', ruta: 'https://x.com/a.png', crop: { l: 9, r: 9 } }, { tipo: 'malo' }, { tipo: 'zona', x: 95, w: 50 }])));
  const o = r.contenido.doc.content[0].attrs.objetos;
  assert.equal(o.length, 2);
  assert.equal(o[0].ruta, '');
  assert.ok(o[0].crop.l + o[0].crop.r < 1);
  assert.equal(o[1].x + o[1].w, 100);
  assert.equal(aNodos(doc(nodo([{ tipo: 'zona', id: 'o-abcd1236', x: 1, y: 1, w: 9, h: 9 }])), 'pdf', {})[0].hijos[0].hijos.length, 0);
});
await ok('avisa lo que pasa los margenes, sin leer pixeles', () => {
  const m = new ConfigPagina({}).aPorcentajes();
  const r = fueraDeMargen({ caja: { x: 2, y: 20, w: 50, h: 50 }, objetos: [{ id: 'a', tipo: 'imagen', x: 80, y: 20, w: 40, h: 10 }, { id: 'b', tipo: 'imagen', x: 20, y: 20, w: 20, h: 10 }, { id: 'c', tipo: 'zona', x: 0, y: 0, w: 100, h: 100 }] }, m);
  assert.equal(r.fondo, true);
  assert.deepEqual(r.objetos, ['a']);
});
await ok('lo de la version anterior: cada pagina del PDF sale suelta con sus zonas, y el titulo entra al texto', () => {
  const pieza = { id: 'p1', nombre: 'ahava', pdf: 'taller/o/p/o.pdf', anchoMm: 578, altoMm: 818, ajuste: 'contener', paginas: [
    { n: 1, ruta: 'taller/o/p/1.webp', texto: 'a', alt: '', caja: null, sangre: false, zonas: [{ id: 'z-abcd1234', nombre: 'Z', x: 1, y: 2, w: 30, h: 40, bloques: [] }] },
    { n: 2, ruta: 'taller/o/p/2.webp', texto: 'b', alt: '', caja: null, sangre: false, zonas: [] }
  ] };
  const v1 = { titulo: 'Uno', contenido: { version: 1, doc: { type: 'doc', content: [parrafo('Hola'), { type: 'paginasPdf', attrs: { pieza: 'p1' } }] } } };
  assert.equal(necesitaMigrar(v1.contenido), true);
  const v2 = aVersion2(v1, [pieza]);
  assert.deepEqual(v2.doc.content.map((n) => n.type), ['heading', 'paragraph', 'paginaLibre', 'paginaLibre']);
  const limpio = limpiarContenido(v2).contenido;
  assert.equal(limpio.doc.content[2].attrs.objetos[0].tipo, 'zona');
  assert.equal(limpio.doc.content[2].attrs.objetos[0].w, 30);
  assert.equal(necesitaMigrar(limpio), false);
  assert.equal(tituloDe(limpio.doc), 'Uno');
});

await ok('si la pieza vieja ya no esta, su bloque se queda: no se borra lo unico que la nombra', () => {
  const v1 = { titulo: 'Uno', contenido: { version: 1, doc: { type: 'doc', content: [{ type: 'paginasPdf', attrs: { pieza: 'nada' } }] } } };
  assert.deepEqual(aVersion2(v1, []).doc.content.map((n) => n.type), ['heading', 'paginasPdf']);
});
await ok('el titulo viejo solo se omite si el texto ya empieza con ese mismo titulo', () => {
  const con = (t) => ({ titulo: 'Uno', contenido: { version: 1, doc: { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: t }] }] } } });
  assert.equal(aVersion2(con('Uno'), []).doc.content.length, 1);
  assert.equal(aVersion2(con('Otro'), []).doc.content.length, 2);
});
await ok('un titulo larguisimo no pasa de lo que admite la base', () => {
  assert.equal(tituloDe({ type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'a'.repeat(900) }] }] }).length, 300);
});
console.log('las imagenes');
globalThis.FileReader = class { readAsDataURL(b) { this.result = `data:${b}`; setTimeout(() => this.onload()); } };
await ok('un libro de PDF pide de a pocas, y dos hojas iguales una sola vez', async () => {
  let a = 0, tope = 0, n = 0;
  const im = new Imagenes(async () => { a++; n++; tope = Math.max(tope, a); await new Promise((ok) => { setTimeout(ok, 2); }); a--; return { ok: true, blob: 'x' }; }, 1);
  const r = await Promise.all(['a', 'a', ...Array.from({ length: 20 }, (_, i) => `r${i}`)].map((x) => im.dame(x)));
  assert.ok(r.every(Boolean));
  assert.equal(n, 21);
  assert.ok(tope <= 4, String(tope));
});
await ok('una falla de red se reintenta; un error de otra clase no', async () => {
  let n = 0;
  const im = new Imagenes(async () => (++n < 3 ? { error: 'red' } : { ok: true, blob: 'x' }), 1);
  assert.ok(await im.dame('a'));
  assert.equal(n, 3);
  n = 0;
  const mal = new Imagenes(async () => { n++; return { error: 'archivoRuta' }; }, 1);
  assert.equal(await mal.dame('a'), '');
  assert.equal(n, 1);
});
await ok('tres fallas seguidas dicen que no llego, y una cola atascada no bloquea a las demas', async () => {
  const im = new Imagenes(async (r) => (r.startsWith('mal') ? { error: 'red' } : { ok: true, blob: 'x' }), 1);
  const r = await Promise.all([...Array.from({ length: 8 }, (_, i) => `mal${i}`), 'bien'].map((x) => im.dame(x)));
  assert.equal(r.filter(Boolean).length, 1);
});
await ok('una descarga colgada no tapa la fila, y una imagen dañada no deja nada esperando', async () => {
  const colgada = new Imagenes((r) => (r.startsWith('c') ? new Promise(() => {}) : Promise.resolve({ ok: true, blob: 'x' })), 1, 5);
  const r = await Promise.all(['c1', 'c2', 'c3', 'c4', 'bien'].map((x) => colgada.dame(x)));
  assert.deepEqual(r.map(Boolean), [false, false, false, false, true]);
  assert.equal(colgada.activas, 0);
  const lector = globalThis.FileReader;
  globalThis.FileReader = class { readAsDataURL() { setTimeout(() => this.onerror()); } };
  const danada = new Imagenes(async () => ({ ok: true, blob: 'x' }), 1);
  assert.equal(await danada.dame('a'), '');
  assert.equal(danada.activas, 0);
  globalThis.FileReader = lector;
});
await ok('olvidar corta lo que iba en camino: al cerrar sesion no vuelve a la memoria', async () => {
  let suelta;
  const im = new Imagenes(() => new Promise((ok) => { suelta = () => ok({ ok: true, blob: 'x' }); }), 1);
  const p = im.dame('a');
  await new Promise((ok) => { setTimeout(ok, 1); });
  im.olvidar();
  suelta();
  assert.equal(await p, '');
  assert.equal(im.mapa.size, 0);
  assert.equal(im.activas, 0);
});
await ok('los px de Figma ida y vuelta: todo ancho entero vuelve igual tras pasar por milimetros', () => {
  for (let px = 591; px <= 4960; px++) assert.equal(mmAPx(new ConfigPagina({ anchoMm: pxAMm(px) }).anchoMm), px, String(px));
});
await ok('cada formato dice sus px de imprenta, sin topes', () => {
  const px = (a, b) => ({ ancho: mmAPx(a), alto: mmAPx(b) });
  const de = (id) => { const t = TAMANOS.find((x) => x.id === id); return px(t.anchoMm, t.altoMm); };
  assert.deepEqual(de('a5'), { ancho: 1748, alto: 2480 });
  assert.deepEqual(de('a4'), { ancho: 2480, alto: 3508 });
  assert.deepEqual(de('carta'), { ancho: 2550, alto: 3300 });
  assert.deepEqual(de('oficio'), { ancho: 2551, alto: 3898 });
  assert.deepEqual(px(pxAMm(1600), pxAMm(2240)), { ancho: 1600, alto: 2240 });
});
await ok('la letra automatica siempre se lee: claro, oscuro y gris medio', () => {
  for (const p of ['#ffffff', '#111111', '#777777', '#808080', '#2f7bff', '#fbf6e9']) assert.ok(contraste(tintaPara(p), p) >= 4.5, p);
});
await ok('el color del libro, de sus titulos y de sus letras vuelve igual; lo raro no entra', () => {
  const c = new ConfigPagina({ papel: '#1F2A44', letras: { Lora: '#ff0000', 'x"}': '#000000', Otra: 'url(x)' }, titulos: { t1: '#00ff00', t2: 'red' }, colores: ['#123456', 'x'], imprenta: true });
  const d = new ConfigPagina(c.aDatos());
  assert.equal(d.papel, '#1f2a44');
  assert.deepEqual(d.letras, { Lora: '#ff0000' });
  assert.deepEqual(d.titulos, { t1: '#00ff00', t2: '', t3: '' });
  assert.deepEqual(d.colores, ['#123456']);
  assert.equal(d.imprenta, true);
  assert.ok(new TextEncoder().encode(JSON.stringify(new ConfigPagina({ colores: Array(40).fill('#123456'), letras: Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`Fuente${i}`, '#123456'])) }).aDatos())).length < 8000);
});
await ok('el papel llega a la hoja: libro, capitulo y pagina libre, y el PDF traido no cambia', () => {
  const obra = { titulo: 'T', pagina: new ConfigPagina({ papel: '#112233' }).aDatos() };
  const libre = (a) => ({ type: 'paginaLibre', attrs: a });
  const limpio = limpiarContenido({ papel: '#445566', doc: { type: 'doc', content: [parrafo('a'), libre({ papel: '#778899' }), libre({ fondo: 'taller/o/p/1.webp', papel: '#778899' }), libre({})] } }).contenido;
  assert.equal(limpio.papel, '#445566');
  const h = aHoja(obra, [{ contenido: limpio }]), texto = JSON.stringify(h.nodos);
  assert.ok(/size: [^;]+; margin: [^;]+; background: #112233/.test(h.css));
  assert.ok(h.css.includes('@page cap-445566 { background: #445566'));
  assert.ok(texto.includes('capitulo papel-445566'));
  /* La pagina con PDF toma el papel de su capitulo: su dibujo va encima y lo que no cubre es papel */
  for (const c of ['778899', '445566']) { assert.ok(texto.includes(`pag-libre papel-${c}`), c); assert.ok(h.css.includes(`@page libre-${c}`), c); }
  assert.ok(!texto.includes('pag-libre papel-ffffff'));
  /* Sobre un dibujo la letra automatica es oscura, aunque el papel de atras sea oscuro */
  assert.ok(texto.includes('pag-libre--pdf') && h.css.includes('.pag-libre.pag-libre--pdf { --hoja-tinta: #111111; }'));
  assert.ok(!h.css.includes('background: #fff;'));
  assert.equal(limpiarContenido({ papel: 'url(x)', doc: { type: 'doc', content: [] } }).contenido.papel, undefined);
});
await ok('para imprenta el papel crece y la caja del texto no se mueve', () => {
  const con = (imprenta) => aHoja({ titulo: 'T', pagina: new ConfigPagina({ imprenta }).aDatos() }, [{ contenido: doc(parrafo('a')) }]).css;
  const medida = (css) => css.match(/size: (\d+)pt (\d+)pt/).slice(1).map(Number);
  assert.deepEqual(medida(con(true)), medida(con(false)).map((v) => v + 18));
  assert.ok(con(true).includes('inset: 9pt'));
});
await ok('un boton: solo enlaces https, y en el PDF copiar no finge ser enlace', () => {
  const b = (attrs) => limpiarContenido({ doc: { type: 'doc', content: [{ type: 'boton', attrs }] } }).contenido.doc.content[0];
  const malos = ['http://a.co', 'javascript:alert(1)', '/ruta', 'mailto:a@b.co', 'https://a.co/"x'];
  for (const m of malos) assert.equal(b({ enlace: m }).attrs.enlace, '', m);
  assert.equal(b({ enlace: 'https://a.co/x' }).attrs.enlace, 'https://a.co/x');
  const pdfDe = (attrs) => POR_NODO.get('boton').pdf(b(attrs));
  assert.equal(pdfDe({ accion: 'enlace', enlace: 'https://a.co/x', texto: 'Ir' }).tag, 'a');
  assert.equal(pdfDe({ accion: 'copiar', copia: 'Hola', texto: 'Copiar' }).tag, 'div');
  assert.equal(pdfDe({ accion: 'enlace', enlace: 'http://a.co', texto: 'Ir' }).tag, 'div');
  const w = POR_NODO.get('boton').web(b({ accion: 'copiar', copia: 'Hola', texto: 'Copiar' }));
  assert.equal(w.attrs['data-copiar'], 'Hola');
  assert.equal(b({ copia: 'x'.repeat(9000), accion: 'copiar' }).attrs.copia.length, 5000);
  assert.deepEqual(Object.keys(pdfDe({ fondo: '#123456' }).estilo).sort(), ['background-color', 'color']);
  for (const k of Object.keys(pdfDe({ fondo: '#123456' }).estilo)) assert.ok(ESTILOS_HOJA.has(k), k);
});
await ok('lo que copia un boton no lleva caracteres invisibles; el hebreo y los emojis si quedan', () => {
  const b = (copia) => limpiarContenido({ doc: { type: 'doc', content: [{ type: 'boton', attrs: { accion: 'copiar', copia } }] } }).contenido.doc.content[0].attrs.copia;
  const ocultos = ['\u202E', '\u2066', '\u200B', '\uFEFF', '\u0007', '\r', String.fromCodePoint(0xE0041), String.fromCodePoint(0xE0100)];
  assert.equal(b(`a${ocultos.join('')}b`), 'ab');
  const bueno = 'uno\ndos\ttres \u05D0\u200F \u{1F469}\u200D\u{1F4BB}\uFE0F';
  assert.equal(b(bueno), bueno);
  const obj = limpiarObjetos([{ id: 'o-abcd1234', tipo: 'boton', accion: 'copiar', copia: 'a\u202Eb' }]);
  assert.equal(obj[0].copia, 'ab');
});
await ok('una fuente llamada constructor no escribe nada raro en el estilo', () => {
  const c = new ConfigPagina({ cuerpo: { fuente: 'constructor' } }).aDatos();
  assert.ok(!cssLibro(c).includes('native code'));
  assert.ok(!aHoja({ titulo: 'T', pagina: c }, [{ contenido: doc(parrafo('a')) }]).css.includes('native code'));
});
await ok('avisa de lo pintado a mano que casi no se ve sobre su hoja', () => {
  const c = { papel: '#111111', doc: { type: 'doc', content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'a', marks: [{ type: 'textStyle', attrs: { color: '#222222' } }] }] },
    { type: 'paginaLibre', attrs: { papel: '#ffffff', objetos: [{ tipo: 'texto', color: '#fefefe' }, { tipo: 'texto', color: '#111111' }, { tipo: 'texto', color: '' }] } }
  ] } };
  assert.equal(textosPocoVisibles(c, ''), 2);
});
await ok('un salto de linea al final tambien ocupa su renglon', () => {
  const obra = { titulo: 'T', pagina: new ConfigPagina({ indice: false }).aDatos() };
  const h = aHoja(obra, [{ contenido: doc({ type: 'paragraph', content: [{ type: 'text', text: 'a' }, { type: 'hardBreak' }] }) }]);
  assert.equal(JSON.stringify(h.nodos).match(/"tag":"br"/g).length, 2);
});
await ok('un renglon vacio ocupa su lugar en la hoja, y una pagina libre empieza en el borde', () => {
  const obra = { titulo: 'T', pagina: new ConfigPagina({ indice: false }).aDatos() };
  const h = aHoja(obra, [{ contenido: doc({ type: 'paragraph' }, { type: 'heading', attrs: { level: 2 } }) }]);
  const texto = JSON.stringify(h.nodos);
  assert.equal(texto.match(/"tag":"br"/g).length, 2);
  assert.ok(!/\.pag-libre \{[^}]*margin-left/.test(h.css));
});

await ok('una formula se guarda como texto y sale marcada para dibujarse; nada de scripts', () => {
  const r = limpiarContenido(doc({ type: 'paragraph', content: [{ type: 'text', text: 'a ' }, { type: 'formula', attrs: { tex: '\\frac{1}{2}\u0007', x: 1 } }] }));
  const f = r.contenido.doc.content[0].content[1];
  assert.deepEqual(f, { type: 'formula', attrs: { tex: '\\frac{1}{2}' } });
  const [p] = aNodos(r.contenido, 'pdf');
  p.hijos.forEach(permitido);
  assert.equal(p.hijos[1].attrs['data-tex'], '\\frac{1}{2}');
  assert.equal(OPCIONES_KATEX.trust, false);
  assert.equal(limpiarContenido(r.contenido).contenido.doc.content[0].content[1].attrs.tex.length, 11);
});
await ok('exponente y subindice salen como tales', () => {
  const [p] = aNodos(doc(parrafo('2', [{ type: 'superscript' }])), 'pdf');
  assert.equal(p.hijos[0].tag, 'sup');
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
  assert.equal((await r.abrir(id)).capitulos[0].titulo, '');        // nace sin nombre, y restaurar lo devuelve asi, no «nuevo»
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

console.log('capital, citas y pasaje');
await ok('capital y citas: sin datos quedan como siempre; lo de mas se queda en el borde; una letra rara no pasa', () => {
  const base = new ConfigPagina({});
  assert.deepEqual(base.capital, { fuente: '', lineas: 3, separaMm: 1.2 });
  assert.deepEqual(base.cita, { fuente: '', tamanoPct: 100, sangriaMm: 4.7, cursiva: true });
  const c = new ConfigPagina({ capital: { fuente: 'Estonia', lineas: 9, separaMm: 50 }, cita: { fuente: 'x");}', tamanoPct: 300, sangriaMm: -4, cursiva: false } });
  assert.deepEqual(c.capital, { fuente: 'Estonia', lineas: 3, separaMm: 6 });
  assert.deepEqual(c.cita, { fuente: '', tamanoPct: 160, sangriaMm: 0, cursiva: false });
  assert.deepEqual(new ConfigPagina(c.aDatos()).capital, c.capital);
  const css = cssLibro(c.aDatos());
  assert.ok(css.includes('initial-letter: 3; font-weight: 400; margin-right: 6mm; font-family: "Estonia"'));
  assert.ok(css.includes('.libro blockquote { margin: 1em 0mm; font-style: normal; font-size: 1.6em; }'));
  assert.ok(cssLibro({}).includes('initial-letter: 3; font-weight: 700; margin-right: 1.2mm; }'));
  assert.ok(cssLibro({}).includes('.libro blockquote { margin: 1em 4.7mm; font-style: italic; }'));
});
await ok('el pasaje: texto con renglones, referencia en una linea, hebreo de derecha a izquierda y con su letra en el PDF', async () => {
  const pasaje = await import('../src/scripts/contenido/taller/tipos/pasaje.js');
  const d = pasaje.datos('pasaje', { texto: 'Uno\r\nDos‮', referencia: ' Juan\n3:16 ' });
  assert.deepEqual(d, { texto: 'Uno\nDos', referencia: 'Juan 3:16' });
  assert.equal(pasaje.datos('pasaje', { texto: 'x'.repeat(5000) }).texto.length, pasaje.TEXTO_MAX);
  const es = pasaje.piezaDePasaje(d);
  assert.equal(es.clase, 'pasaje');
  assert.deepEqual(es.hijos.map((h) => h.tag), ['blockquote', 'figcaption']);
  const he = pasaje.piezaDePasaje({ texto: 'שְׁמַע', referencia: '' });
  assert.equal(he.clase, 'pasaje pasaje--hebreo');
  assert.deepEqual(he.hijos[0].attrs, { dir: 'rtl', lang: 'he' });
  assert.equal(he.hijos.length, 1);
  assert.equal(pasaje.piezaDePasaje({ texto: 'El Nombre (יהוה) es santo y bueno', referencia: '' }).clase, 'pasaje');
  assert.equal(pasaje.datos('pasaje', { texto: 'שמע‏' }).texto, 'שמע‏');
  assert.equal(pasaje.piezaDePasaje({ texto: '\n\nUno\n\n\n', referencia: '' }).hijos[0].hijos[0].texto, 'Uno');
  assert.ok(ATRIBUTOS_HOJA.has('dir') && ATRIBUTOS_HOJA.has('lang'));
  const cap = (texto) => ({ contenido: { version: 2, doc: { type: 'doc', content: [{ type: 'pasaje', attrs: { texto, referencia: 'R' } }] } } });
  const obra = { pagina: {}, fuentes: ['Young Serif', 'Estonia'] };
  assert.ok(aHoja(obra, [cap('שְׁמַע')]).fuentes.includes(pasaje.FUENTE_HEBREO));
  assert.ok(!aHoja(obra, [cap('Oye, Israel')]).fuentes.includes(pasaje.FUENTE_HEBREO));
  assert.ok(JSON.stringify(aHoja(obra, [cap('Oye')]).nodos).includes('"figcaption"'));
});

console.log('borrar un libro');
await ok('borrar se lleva capitulos, piezas y copias; un libro que ya no esta dice noExiste; restaurar no pierde su copia', async () => {
  const r = new RepositorioTallerMemoria();
  const { id } = await r.crearObra({ titulo: 'Uno' });
  const otro = (await r.crearObra({ titulo: 'Dos' })).id;
  await r.crearPieza({ obraId: id, nombre: 'p' });
  await r.copia(id, 'manual');
  await r.copia(otro, 'manual');
  assert.ok((await r.borrarObra(id)).ok);
  assert.equal((await r.abrir(id)).error, 'noExiste');
  assert.equal([...r.piezasM.values()].filter((p) => p.obraId === id).length, 0);
  assert.equal((await r.versiones(id)).filas.length, 0);
  assert.equal((await r.versiones(otro)).filas.length, 1);
  assert.equal((await r.borrarObra(id)).error, 'noExiste');
  const [v] = (await r.versiones(otro)).filas;
  assert.ok((await r.restaurar(v.id)).ok);
  assert.equal((await r.versiones(otro)).filas.length, 2);
});
await ok('en la base, borrar sin filas borradas (reglas que no dejan) no es «listo»', async () => {
  const con = (data) => new RepositorioTallerSupabase({ from: () => ({ delete: () => ({ eq: () => ({ select: () => Promise.resolve({ data, error: null }) }) }) }) });
  assert.ok((await con([{ id: 'a' }]).borrarObra('a')).ok);
  assert.equal((await con([]).borrarObra('a')).error, 'noExiste');
});
await ok('los archivos de un libro: todas las carpetas, de a paginas, y nunca fuera de su carpeta', async () => {
  const { listarObra, nombresDeObra, enTandas, pesoLegible, POR_PAGINA } = await import('../src/scripts/contenido/taller/ArchivosObra.js');
  const id = '0f8fad5b-d9cb-469f-a165-70867728950e';
  const muchos = Array.from({ length: POR_PAGINA + 5 }, (_, i) => ({ name: `p${i}.webp`, id: `x${i}`, metadata: { size: 10 } }));
  const arbol = { [id]: [{ name: 'img', id: null }, { name: 'pdf', id: null }], [`${id}/img`]: [{ name: 'a.webp', id: '1', metadata: { size: 1000 } }], [`${id}/pdf`]: muchos };
  const pedidas = [];
  const listar = async (carpeta, desde) => { pedidas.push(`${carpeta}@${desde}`); return { data: (arbol[carpeta] || []).slice(desde, desde + POR_PAGINA), error: null }; };
  const r = await listarObra(listar, id);
  assert.equal(r.archivos.length, POR_PAGINA + 6);
  assert.equal(r.archivos[0].ruta, `taller/${id}/img/a.webp`);
  assert.ok(pedidas.includes(`${id}/pdf@${POR_PAGINA}`));
  assert.equal((await listarObra(listar, '../otro')).error, 'invalido');
  assert.equal((await listarObra(async () => ({ data: null, error: { message: 'x' } }), id)).error, 'red');
  assert.deepEqual(nombresDeObra([`taller/${id}/img/a.webp`, `taller/${id}/img/a.webp`, 'taller/otro/x.webp', `taller/${id}/../x`, `taller/${id}/`, 5], id), [`${id}/img/a.webp`]);
  assert.deepEqual(nombresDeObra([`taller/${id}/a`], 'malo'), []);
  assert.deepEqual(enTandas([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.equal(pesoLegible(15.1 * 1024 * 1024), '15,1 MB');
  assert.equal(pesoLegible(0), '0 KB');
});

console.log('varias paginas a la vez');
{
  const { Schema } = await import('@tiptap/pm/model');
  const { EditorState } = await import('@tiptap/pm/state');
  const { history, undo, redo } = await import('@tiptap/pm/history');
  const V = await import('../src/scripts/portal/panel/dev/taller/Varias.js');
  const s = new Schema({ nodes: { doc: { content: 'block+' }, text: { group: 'inline' }, paragraph: { group: 'block', content: 'inline*' },
    paginaLibre: { group: 'block', atom: true, attrs: { nombre: { default: '' }, objetos: { default: [] }, fondo: { default: '' }, papel: { default: '' }, ajuste: { default: 'contener' } } },
    columnas: { group: 'block', content: 'columna+' }, columna: { content: 'block+' } } });
  const P = (n) => s.nodes.paginaLibre.create({ nombre: n, objetos: [{ id: `o${n}` }] }), T = (t) => s.nodes.paragraph.create(null, s.text(t));
  const original = s.nodes.doc.create(null, [T('a'), P('1'), P('2'), T('b'), P('3'), s.nodes.columnas.create(null, [s.nodes.columna.create(null, [P('4')])])]);
  const libres = [];
  original.descendants((x) => { if (x.type.name === 'paginaLibre') libres.push(x); });
  const nombres = (d) => { const o = []; d.descendants((x) => { if (x.type.name === 'paginaLibre') o.push(x.attrs.nombre); }); return o.join(''); };
  const nuevo = () => ({ st: EditorState.create({ doc: original, plugins: [history()] }) });
  const hacer = (c, tr) => { c.st = c.st.apply(tr); };
  const atras = (c) => undo(c.st, (tr) => hacer(c, tr)), adelante = (c) => redo(c.st, (tr) => hacer(c, tr));

  await ok('elegir de la 2 a la 5: solo libres, solo de un capitulo, y avisa si se salia', () => {
    const a = {}, b = {}, lista = [{ vivo: a, nodo: null }, { vivo: a, nodo: 'p1' }, { vivo: a, nodo: null }, { vivo: a, nodo: 'p2' }, { vivo: b, nodo: 'q1' }];
    assert.deepEqual(V.rango(lista, 1, 3), { nodos: ['p1', 'p2'], fuera: false });
    assert.deepEqual(V.rango(lista, 3, 1), { nodos: ['p1', 'p2'], fuera: false });
    assert.deepEqual(V.rango(lista, 1, 4), { nodos: ['p1', 'p2'], fuera: true });
    assert.deepEqual(V.alternar(['p1', 'p2'], 'p1'), ['p2']);
    assert.deepEqual(V.alternar(['p2'], 'p1'), ['p2', 'p1']);
    assert.deepEqual(V.todasDelCapitulo(lista, a), ['p1', 'p2']);
  });
  await ok('borrar tres paginas: un solo Ctrl+Z las devuelve en su orden, y Ctrl+Y las vuelve a quitar', () => {
    const c = nuevo(), tr = V.trBorrar(c.st, [libres[0], libres[2], libres[3]]);
    assert.equal(tr.getMeta(V.META_PAGINA), true);
    hacer(c, tr);
    assert.equal(nombres(c.st.doc), '2');
    assert.ok(atras(c));
    assert.ok(c.st.doc.eq(original));
    adelante(c);
    assert.equal(nombres(c.st.doc), '2');
  });
  await ok('borrar la unica pagina de una columna deja la columna con un parrafo', () => {
    const c = nuevo();
    hacer(c, V.trBorrar(c.st, [libres[3]]));
    c.st.doc.check();
    assert.equal(nombres(c.st.doc), '123');
  });
  await ok('dos borrados seguidos son dos Ctrl+Z', () => {
    const c = nuevo();
    hacer(c, V.trBorrar(c.st, [libres[0]]));
    hacer(c, V.trBorrar(c.st, [libres[1]]));
    assert.equal(nombres(c.st.doc), '34');
    atras(c);
    assert.equal(nombres(c.st.doc), '234');
  });
  await ok('duplicar dos: las copias van juntas tras la ultima, son otras, y un Ctrl+Z las quita', () => {
    const c = nuevo(), r = V.trDuplicar(c.st, [libres[2], libres[0]]);
    hacer(c, r.tr);
    assert.equal(nombres(c.st.doc), '123134');
    assert.equal(V.posicionesDe(c.st.doc, r.copias).length, 2);
    assert.notEqual(r.copias[0].attrs.objetos, libres[0].attrs.objetos);
    atras(c);
    assert.ok(c.st.doc.eq(original));
  });
  await ok('donde cae el bloque: dentro de su capitulo, sobre si mismo es «aqui», y nunca en otro', () => {
    const a = {}, b = {}, L = [{ vivo: a, nodo: null }, { vivo: a, nodo: 'x' }, { vivo: a, nodo: 'y' }, { vivo: a, nodo: 'z' }, { vivo: b, nodo: 'q' }];
    assert.deepEqual(V.destinoDelBloque(L, ['y'], 1), { antes: 1 });
    assert.deepEqual(V.destinoDelBloque(L, ['x', 'y'], 1), { antes: 3 });
    assert.deepEqual(V.destinoDelBloque(L, ['x'], 4), { fin: true });
    assert.equal(V.destinoDelBloque(L, ['x'], 5), null);
    assert.equal(V.destinoDelBloque([{ vivo: b, nodo: 'q' }, ...L], ['x'], 0), null);
    assert.equal(V.destinoDelBloque(L, ['nada'], 1), null);
    /* «que la primera quede en la pagina d» */
    assert.equal(V.antesDelNumero(L, ['z'], 2), 1);
    assert.equal(V.antesDelNumero(L, ['x'], 3), 3);
    assert.equal(V.antesDelNumero(L, ['x'], 99), 5);
  });
  await ok('mover tres al inicio: juntas, en su orden, las mismas, y un Ctrl+Z las regresa', () => {
    const c = nuevo(), tr = V.trMover(c.st, [libres[3], libres[1], libres[2]], 0);
    hacer(c, tr);
    c.st.doc.check();
    assert.equal(nombres(c.st.doc), '2341');
    assert.equal(V.posicionesDe(c.st.doc, [libres[1], libres[2], libres[3]]).length, 3);
    atras(c);
    assert.ok(c.st.doc.eq(original));
  });
  await ok('mover al medio, dentro de una columna y con elegidas sueltas', () => {
    const casos = [
      { elegidas: [0, 2], pos: (d) => V.posicionesDe(d, [libres[3]])[0].pos, da: '2134' },   // dentro de la columna
      { elegidas: [3], pos: (d) => V.posicionesDe(d, [libres[1]])[0].pos, da: '1423' },      // de la columna al medio
      { elegidas: [0, 3], pos: (d) => d.content.size, da: '2314' },                          // sueltas, al final
      { elegidas: [1], pos: (d) => V.posicionesDe(d, [libres[1]])[0].pos, da: '1234' }        // sobre si misma
    ];
    for (const k of casos) {
      const c = nuevo(), tr = V.trMover(c.st, k.elegidas.map((i) => libres[i]), k.pos(c.st.doc));
      hacer(c, tr);
      c.st.doc.check();
      assert.equal(nombres(c.st.doc), k.da);
    }
  });
  await ok('tras deshacer el papel, las mismas paginas siguen elegidas por su lugar', () => {
    const c = nuevo(), elegidas = [libres[1], libres[3]], lugares = V.lugaresDe(c.st.doc, elegidas), cuantas = V.libresDe(c.st.doc).length;
    assert.deepEqual(lugares, [1, 3]);
    const r = V.trPapel(c.st, elegidas, { papel: '#000000' });
    hacer(c, r.tr);
    atras(c);
    assert.equal(V.posicionesDe(c.st.doc, r.nodos).length, 0);
    const otra = V.nodosEnLugares(c.st.doc, lugares, cuantas);
    assert.deepEqual(otra.map((n) => n.attrs.nombre), ['2', '4']);
    assert.equal(V.nodosEnLugares(c.st.doc, lugares, cuantas + 1), null);
  });
  await ok('el papel de todas, menos las de PDF; el ajuste solo a las de PDF; un Ctrl+Z', () => {
    const pdf = s.nodes.paginaLibre.create({ nombre: 'P', fondo: 'taller/a/pdf/1.webp' });
    const d = s.nodes.doc.create(null, [P('1'), pdf, P('2')]);
    const c = { st: EditorState.create({ doc: d, plugins: [history()] }) }, todas = [d.child(0), d.child(1), d.child(2)];
    assert.deepEqual(V.resumenDe(todas), { n: 3, pdf: 1, hojas: 2, papel: '', ajuste: 'contener' });
    const r = V.trPapel(c.st, todas, { papel: '#F4EBDD' });
    hacer(c, r.tr);
    assert.equal(r.saltadas, 1);
    assert.deepEqual(r.nodos.map((n) => n.attrs.papel), ['#F4EBDD', '', '#F4EBDD']);
    assert.equal(V.resumenDe(r.nodos).papel, '#F4EBDD');
    const r2 = V.trPapel(c.st, r.nodos, { ajuste: 'cubrir' });
    hacer(c, r2.tr);
    assert.deepEqual(r2.nodos.map((n) => n.attrs.ajuste), ['contener', 'cubrir', 'contener']);
    atras(c); atras(c);
    assert.ok(c.st.doc.eq(d));
  });
  await ok('nada elegido que siga en el capitulo: no se hace nada', () => {
    const c = nuevo();
    assert.equal(V.trBorrar(c.st, [P('x')]), null);
    assert.equal(V.trDuplicar(c.st, []), null);
  });
}

console.log('la puerta de los bloques');
await ok('un tipo sin pruebas para la compilacion', async () => {
  const { TIPOS } = await import('../src/scripts/contenido/taller/tipos/indice.js');
  await assert.rejects(revisarTiposTaller(undefined, { CASOS: { ...CASOS, cita: undefined } }, { TIPOS }), /faltan sus pruebas/);
});

console.log(`\n${bien} bien, ${mal} mal`);
if (mal) process.exit(1);
