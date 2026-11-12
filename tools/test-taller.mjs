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
import * as I from '../src/scripts/contenido/taller/IndiceLibro.js';
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
  const h = aHoja(obra, [{ titulo: 'Uno', contenido: doc(parrafo('a')) }], { indice: { numeros: { 'cap-1': 2 }, reparto: [1] } });
  assert.match(h.css, /size: 420pt 595pt/);
  assert.ok(!/target-counter/.test(h.css));
  h.nodos.forEach(permitido);
  assert.ok(JSON.stringify(h.nodos).includes('#cap-1'));
  assert.ok(JSON.stringify(h.nodos).includes('"texto":"2"'));
  assert.equal(h.titulo, 'T');
  const p = new ConfigPagina({}).enPixeles();
  assert.deepEqual([p.W, p.H, p.ancho, p.alto], [559, 794, 423, 635]);
  assert.ok(Math.abs(p.mrImpresion - 69) < .02 && Math.abs(p.mbImpresion - 82.33) < .02, `${p.mrImpresion} ${p.mbImpresion}`);
});
console.log('el contenido del libro');
{
  const h = (texto, level, id) => ({ type: 'heading', attrs: { level, ...(id ? { id } : {}) }, content: [{ type: 'text', text: texto }] });
  const libre = (titulo, ancla) => ({ type: 'paginaLibre', attrs: { titulo, ancla, objetos: [] } });
  const caps = () => [
    { id: 'c1', titulo: 'Portada', contenido: { titulo: 'Portada', enIndice: false, doc: { type: 'doc', content: [libre('', '')] } } },
    { id: 'c2', titulo: 'Uno', contenido: { doc: { type: 'doc', content: [h('Uno', 1, 't-00000001'), parrafo('a'), h('Sub A', 2, 't-00000002'), h('Menor', 3, 't-00000003'), libre('Mapa', 'p-00000004'),
      { type: 'columnas', attrs: { anchos: [1, 1] }, content: [{ type: 'columna', content: [h('En columna', 2, 't-00000005')] }, { type: 'columna', content: [parrafo('b')] }] }] } } },
    { id: 'c3', titulo: 'Dos a mano', contenido: { titulo: 'Dos a mano', doc: { type: 'doc', content: [h('Primero', 1, 't-00000006'), h('Repetido', 2, 't-00000002')] } } }
  ];
  await ok('entradas: capitulos visibles, Título 1 y 2 y paginas con nombre; nunca Título 3 ni el titulo que nombra al capitulo', async () => {
    const { capitulosParaIndice } = await import('../src/scripts/contenido/taller/hoja.js');
    const e = I.entradasDe(capitulosParaIndice(caps()));
    assert.deepEqual(e.map((f) => `${f.nivel}:${f.titulo}:${f.ancla}`), [
      '1:Uno:cap-2', '2:Sub A:t-00000002', '2:Mapa:p-00000004', '2:En columna:t-00000005',
      '1:Dos a mano:cap-3', '2:Primero:t-00000006'
    ]);
    assert.deepEqual(I.entradasDe(capitulosParaIndice(caps()), { subtemas: false }).map((f) => f.titulo), ['Uno', 'Dos a mano']);
  });
  await ok('anclas: un libro viejo recibe siempre las mismas, y las repetidas cambian', () => {
    const viejo = { type: 'doc', content: [h('A', 1), h('B', 2), h('C', 2, 't-0000000a'), h('D', 2, 't-0000000a'), libre('X', ''), libre('', '')] };
    const a = I.conAnclas(viejo, 'cap-uuid'), b = I.conAnclas(viejo, 'cap-uuid');
    assert.deepEqual(a, b);
    const ids = a.content.filter((n) => n.type === 'heading').map((n) => n.attrs.id);
    ids.forEach((x) => assert.match(x, I.RE_ANCLA_TITULO));
    assert.equal(new Set(ids).size, 4);
    assert.equal(ids[2], 't-0000000a');
    assert.match(a.content[4].attrs.ancla, I.RE_ANCLA_PAGINA);
    assert.equal(a.content[5].attrs.ancla, '');
    assert.notDeepEqual(I.conAnclas(viejo, 'otro').content[0].attrs.id, ids[0]);
    assert.equal(viejo.content[0].attrs.id, undefined, 'no toca el original');
  });
  await ok('hojas: el reparto de la mesa manda, el nombre solo en la primera, y ninguna fila se pierde', () => {
    const e = [{ nivel: 1, titulo: 'A', ancla: 'cap-1' }, { nivel: 2, titulo: 'a', ancla: 't-00000001' }, { nivel: 1, titulo: 'B', ancla: 'cap-2' }];
    const hs = I.hojasDeIndice(e, { 'cap-1': 3, 't-00000001': 4, 'cap-2': 9 }, [2], { titulo: 'Índice', puntos: false });
    assert.equal(hs.length, 1);
    assert.equal(hs[0].hijos.length, 4, 'la que no cupo va en la ultima');
    assert.equal(hs[0].hijos[0].hijos[0].texto, 'Índice');
    assert.ok(!JSON.stringify(hs).includes('indice__puntos'));
    const dos = I.hojasDeIndice(e, {}, [2, 1], {});
    assert.equal(dos.length, 2);
    assert.equal(dos[1].hijos[0].clase, 'indice__fila indice__fila--1');
    assert.equal(dos[0].hijos[0].hijos[0].texto, 'Contenido');
    dos.forEach(permitido);
  });
  await ok('la hoja: el contenido va antes del capitulo elegido, y titulos y paginas llevan su ancla como id', () => {
    const obra = new Obra({ titulo: 'T', idioma: 'en', pagina: { indice: { ver: true, antesDe: 'c2', puntos: true } } }).aDatos();
    const hj = aHoja(obra, caps(), { indice: { numeros: { 'cap-2': 3, 't-00000002': 4 }, reparto: [6] } });
    const hijos = hj.nodos[0].hijos;
    assert.deepEqual(hijos.map((n) => n.tag), ['section', 'nav', 'section', 'section']);
    assert.equal(hijos[1].hijos[0].hijos[0].texto, 'Contents');
    assert.ok(JSON.stringify(hijos[1]).includes('indice__puntos'));
    const s = JSON.stringify(hijos[2]);
    assert.ok(s.includes('"id":"t-00000002"') && s.includes('"id":"p-00000004"'));
    hj.nodos.forEach(permitido);
    assert.match(hj.css, /\.libro > \.indice:first-child \{ break-before: auto; \}/);
    assert.match(cssLibro({}), /\.libro \.indice__fila \{/);
    /* El capitulo elegido ya no esta: al comienzo */
    const otra = aHoja(new Obra({ pagina: { indice: { ver: true, antesDe: 'nada' } } }).aDatos(), caps(), { indice: { numeros: {}, reparto: [6] } });
    assert.equal(otra.nodos[0].hijos[0].tag, 'nav');
    /* Sin «ver», sin hoja */
    assert.ok(!aHoja(new Obra({ pagina: {} }).aDatos(), caps(), { indice: { numeros: {}, reparto: [6] } }).nodos[0].hijos.some((n) => n.tag === 'nav'));
  });
  await ok('ConfigPagina: el indice de antes (true) sigue, y lo raro no pasa', () => {
    assert.deepEqual(new ConfigPagina({ indice: true }).indice, { ver: true, titulo: '', subtemas: true, puntos: true, antesDe: '' });
    assert.equal(new ConfigPagina({}).indice.ver, false);
    const raro = new ConfigPagina({ indice: { ver: 'si', titulo: `  Mi\u0007  índice ${'x'.repeat(300)}`, subtemas: false, puntos: 0, antesDe: '../x;y' } }).indice;
    assert.equal(raro.ver, false);
    assert.ok(raro.titulo.startsWith('Mi índice') && raro.titulo.length <= I.TITULO_INDICE_MAX);
    assert.equal(raro.subtemas, false);
    assert.equal(raro.puntos, true);
    assert.equal(raro.antesDe, '');
    assert.deepEqual(new ConfigPagina(new ConfigPagina({ indice: { ver: true, antesDe: 'abc-1' } }).aDatos()).indice.antesDe, 'abc-1');
  });
  await ok('lo raro en anclas y nombres: arreglos, «__proto__», marcas de direccion y libros enormes', () => {
    assert.equal(POR_NODO.get('heading').datos('heading', { level: 2, id: ['t-12345678'] }).id, '');
    assert.equal(POR_NODO.get('paginaLibre').datos('paginaLibre', { titulo: 'a‮b⁦c', ancla: ['p-12345678'] }).ancla, '');
    assert.equal(POR_NODO.get('paginaLibre').datos('paginaLibre', { titulo: 'a‮b⁦c' }).titulo, 'abc');
    assert.equal(new ConfigPagina({ indice: { ver: true, titulo: 'x‮y' } }).indice.titulo, 'xy');
    const [nav] = I.hojasDeIndice([{ nivel: 2, titulo: 'X', ancla: '__proto__' }, { nivel: 9, titulo: 'Y', ancla: 'cap-1' }], { 'cap-1': 2.5 }, [2], {});
    assert.deepEqual(nav.hijos.slice(1).map((f) => f.hijos[f.hijos.length - 1].hijos[0].texto), ['', '']);
    assert.equal(nav.hijos[2].clase, 'indice__fila indice__fila--1');
    const muchos = [{ ancla: 'cap-1', titulo: 'A', doc: { type: 'doc', content: Array.from({ length: 900 }, (_, k) => h(`T${k}`, 2, `t-${String(k).padStart(8, '0')}`)) } }];
    assert.equal(I.entradasDe(muchos).length, I.ENTRADAS_MAX);
  });
  await ok('limpiarContenido conserva las anclas buenas y quita las malas', () => {
    const l = limpiarContenido(doc(h('A', 2, 't-00000001'), h('B', 2, 'x'), libre('Mapa', 'p-00000002'), libre('Otra', 'malo'))).contenido.doc.content;
    assert.deepEqual(l.map((n) => n.attrs.id ?? n.attrs.ancla), ['t-00000001', '', 'p-00000002', '']);
    assert.equal(l[2].attrs.titulo, 'Mapa');
  });
}

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
  assert.deepEqual(base.capital, { estilo: 'hundida', fuente: '', lineas: 3, separaMm: 'auto' });
  assert.deepEqual(base.cita, { fuente: '', tamanoPct: 100, sangriaMm: 4.7, cursiva: true });
  const c = new ConfigPagina({ capital: { fuente: 'Estonia', lineas: 9, separaMm: 50 }, cita: { fuente: 'x");}', tamanoPct: 300, sangriaMm: -4, cursiva: false } });
  assert.deepEqual(c.capital, { estilo: 'hundida', fuente: 'Estonia', lineas: 3, separaMm: 6 });
  assert.deepEqual(c.cita, { fuente: '', tamanoPct: 160, sangriaMm: 0, cursiva: false });
  assert.deepEqual(new ConfigPagina(c.aDatos()).capital, c.capital);
  const css = cssLibro(c.aDatos());
  assert.ok(css.includes('initial-letter: 3; font-weight: 400; font-family: "Estonia", Georgia, serif; margin: 0 6mm .6mm 0;'));
  assert.ok(css.includes('.libro blockquote { margin: 1em 0mm; font-style: normal; font-size: 1.6em; }'));
  assert.ok(cssLibro({}).includes('initial-letter: 3; font-weight: 700; margin: 0 7.15pt .6mm 0;'));
  assert.ok(cssLibro({}).includes('.libro blockquote { margin: 1em 4.7mm; font-style: italic; }'));
});
await ok('la capital: libros de antes, sus tres estilos y nada fuera de la caja del texto', () => {
  /* Un libro de antes: sin estilo es hundida, y su 1,2 mm de siempre pasa a automatico; 5 renglones se conservan */
  assert.deepEqual(new ConfigPagina({ capital: { lineas: 5, separaMm: 1.2 } }).capital, { estilo: 'hundida', fuente: '', lineas: 5, separaMm: 'auto' });
  assert.equal(new ConfigPagina({ capital: { estilo: '<x>', separaMm: 'mucho' } }).capital.estilo, 'hundida');
  assert.equal(new ConfigPagina({ capital: { separaMm: 'mucho' } }).capital.separaMm, 'auto');
  assert.equal(new ConfigPagina({ capital: { separaMm: 2.5 } }).capital.separaMm, 2.5);
  /* Quien hoy escribe 1,2 mm lo conserva, y vuelve igual al guardarse */
  const doce = new ConfigPagina({ capital: { estilo: 'hundida', separaMm: 1.2 } });
  assert.equal(doce.capital.separaMm, 1.2);
  assert.equal(new ConfigPagina(doce.aDatos()).capital.separaMm, 1.2);
  /* La caja se mide igual en la mesa (border-box) y en la hoja de impresion */
  assert.ok(cssLibro({ capital: { fuente: 'Petemoss' } }).includes('.libro .capital { box-sizing: content-box; min-height: 3lh;'));
  const css = (capital, tamanoPt = 11) => cssLibro({ capital, cuerpo: { tamanoPt } });
  /* El espacio automatico crece con la letra y con el cuerpo */
  assert.ok(css({ lineas: 2 }).includes('margin: 0 5.5pt .6mm 0;'));
  assert.ok(css({ lineas: 4 }).includes('margin: 0 8.8pt .6mm 0;'));
  assert.ok(css({ lineas: 3 }, 12).includes('margin: 0 7.8pt .6mm 0;'));
  assert.ok(css({ lineas: 3 }).includes('.libro .capital { box-sizing: content-box; min-height: 3lh; orphans: 3; }'));
  /* Con una letra propia (suele traer adornos) la hundida deja aire arriba */
  assert.ok(css({ lineas: 3, fuente: 'Petemoss' }).includes('.libro .capital { box-sizing: content-box; min-height: 3lh; orphans: 3; padding-top: .4lh; }'));
  /* La elevada ya no existe: un libro que la tenia vuelve a la hundida */
  assert.equal(new ConfigPagina({ capital: { estilo: 'elevada' } }).capital.estilo, 'hundida');
  const e = css({ estilo: 'elevada', lineas: 3 });
  assert.ok(e.includes('initial-letter: 3;') && !e.includes('initial-letter: 3 1;'));
  /* La sencilla tiene un solo alto en renglones, igual con cualquier letra */
  const s = css({ estilo: 'sencilla', lineas: 4, fuente: 'Estonia' });
  assert.ok(s.includes('initial-letter: 1.7 1;') && s.includes('.libro .capital { box-sizing: content-box; padding-top: 0.7lh; }'));
  assert.ok(!s.includes('initial-letter: 4'));
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

console.log('partir y unir capitulos');
{
  const P = await import('../src/scripts/portal/panel/dev/taller/Partir.js');
  const par = (t) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] }), tit = (t) => ({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: t }] });
  const pdf = { type: 'paginaLibre', attrs: { fondo: 'taller/o/p/1.webp', objetos: [] } };
  const libro = { type: 'doc', content: [tit('Uno'), par('a'), par('b'), pdf, par('c'), { type: 'columnas', content: [] }] };
  await ok('partir nunca pierde nada: cabeza y cola son el capitulo de antes, bloque por bloque', () => {
    for (let i = 1; i < libro.content.length; i++) {
      const r = P.cortar(libro, i);
      assert.equal(r.cabeza.content.length + r.cola.content.length, libro.content.length);
      assert.deepEqual([...r.cabeza.content, ...r.cola.content], libro.content);
      assert.deepEqual(P.unir(r.cabeza, r.cola), libro);
    }
    /* Ni al principio ni al final ni fuera: ahi ya empieza o no queda nada */
    for (const i of [0, libro.content.length, -1, 1.5, '2']) assert.equal(P.cortar(libro, i), null);
  });
  await ok('una portada en PDF no trae titulo: hay que ponerle nombre; con un titulo de texto, no', () => {
    assert.equal(P.tieneTitulo(P.cortar(libro, 3).cola), false);
    assert.equal(P.tieneTitulo(P.cortar(libro, 0 + 1).cabeza), true);
  });
  await ok('unir un capitulo vacio no deja un renglon de mas', () => {
    assert.deepEqual(P.unir({ type: 'doc', content: [{ type: 'paragraph' }] }, libro), libro);
    assert.deepEqual(P.unir({ type: 'doc', content: [{ type: 'paragraph' }] }, { type: 'doc', content: [{ type: 'paragraph' }] }), { type: 'doc', content: [{ type: 'paragraph' }] });
  });
  await ok('el nombre puesto a mano y «fuera del contenido» se guardan; sin datos, como siempre', () => {
    const c = limpiarContenido({ doc: libro, titulo: '  Portada <b>\n del  libro ', enIndice: false }).contenido;
    assert.equal(c.titulo, 'Portada <b> del libro');
    assert.equal(c.enIndice, false);
    const s = limpiarContenido({ doc: libro }).contenido;
    assert.ok(!('titulo' in s) && !('enIndice' in s));
    assert.equal(limpiarContenido({ doc: libro, titulo: 'x'.repeat(900), enIndice: 'no' }).contenido.titulo.length, 300);
    assert.ok(!('enIndice' in limpiarContenido({ doc: libro, enIndice: 'no' }).contenido));
  });
}

console.log('la cinta');
await ok('cada ajuste del libro es del formulario, este donde este en la cinta', async () => {
  const { readFile } = await import('node:fs/promises');
  const astro = await readFile(new URL('../src/components/portal/dev/Taller.astro', import.meta.url), 'utf8');
  const ini = astro.indexOf('<form class="tal-pagina" id="tal-pagina-f"'), fin = astro.indexOf('</form>', astro.indexOf('</dialog>', ini));
  assert.ok(ini > 0 && fin > ini);
  const dentro = astro.slice(ini, fin);
  /* Lo que leerPagina lee del formulario: dentro de el, o fuera con form="tal-pagina-f" */
  const nombres = ['tamano', 'anchoMm', 'altoMm', 'anchoPx', 'altoPx', 'fuente', 'tamanoPt', 'interlinea', 'idioma', 'numerosVer', 'lugar', 'indice', 'indiceTitulo', 'indiceAntes', 'indiceSubtemas', 'indicePuntos', 'imprenta',
    'capitalEstilo', 'capitalFuente', 'capitalLineas', 'capitalSepara', 'citaFuente', 'citaTamano', 'citaSangria', 'citaCursiva'];
  for (const n of nombres) {
    /* «Agregar letra» tiene su propio formulario con un campo «fuente»: ese no es del libro */
    const otra = astro.indexOf('data-b-otra'), otraFin = astro.indexOf('</form>', otra);
    const etiquetas = [...astro.matchAll(new RegExp(`<[^>]*name="${n}"[^>]*>`, 'g'))].map((m) => ({ tag: m[0], i: m.index })).filter((e) => !(e.i > otra && e.i < otraFin));
    assert.ok(etiquetas.length, `falta ${n}`);
    for (const e of etiquetas) assert.ok((e.i > ini && e.i < fin) || e.tag.includes('form="tal-pagina-f"'), `${n} quedo fuera del formulario`);
  }
  assert.ok(dentro.includes('name={m}'), 'los cuatro margenes van dentro');
  /* «Normal» es el margen de un libro nuevo */
  assert.deepEqual(new ConfigPagina({}).margenes, { sup: 20, inf: 22, izq: 18, der: 18 });
});

console.log('los iconos de los botones');
{
  const I = await import('../src/scripts/contenido/taller/iconosBoton.js');
  const { valorSeguro } = await import('../src/scripts/contenido/taller/armar.js');
  const B = await import('../src/scripts/contenido/taller/tipos/boton.js');
  const propio = (formas, caja = [0, 0, 24, 24]) => I.limpiarIcono({ propio: { caja, formas } });
  await ok('la coleccion: cada icono pasa su propia revision y dibuja solo formas permitidas', () => {
    for (const n of I.NOMBRES_ICONO) {
      assert.deepEqual(I.limpiarIcono({ nombre: n }), { nombre: n });
      const a = I.arbolIcono({ nombre: n });
      assert.equal(a.tag, 'svg');
      assert.equal(a.attrs['aria-hidden'], 'true');
      for (const h of a.hijos) {
        assert.ok(ETIQUETAS_HOJA.has(h.tag), h.tag);
        for (const [k, v] of Object.entries(h.attrs)) { assert.ok(ATRIBUTOS_HOJA.has(k), k); assert.ok(valorSeguro(h.tag, k, v), `${n} ${k}=${v}`); }
      }
    }
    assert.equal(I.limpiarIcono({ nombre: 'constructor' }), null);
    assert.equal(I.limpiarIcono({ nombre: '__proto__' }), null);
    assert.equal(I.limpiarIcono('copiar'), null);
  });
  await ok('un icono propio: se queda lo que es forma y numero, el color siempre es el del boton', () => {
    const i = propio([{ t: 'circle', cx: 12, cy: 12, r: 8, relleno: true }, { t: 'path', d: 'M1 1L9 9', trazo: 2.5, punta: 'x' }]);
    assert.deepEqual(i.propio.formas, [{ t: 'circle', cx: 12, cy: 12, r: 8, relleno: true, trazo: 0 }, { t: 'path', d: 'M1 1L9 9', relleno: false, trazo: 2.5, punta: 'butt', union: 'miter' }]);
    const a = I.arbolIcono(i);
    assert.equal(a.attrs.viewBox, '0 0 24 24');
    assert.deepEqual(a.hijos.map((h) => [h.attrs.fill, h.attrs.stroke]), [['currentColor', 'none'], ['none', 'currentColor']]);
  });
  await ok('un icono hostil: fuera scripts, enlaces, url(), numeros raros y lo invisible', () => {
    assert.equal(propio([{ t: 'script', d: 'x' }, { t: 'image', href: 'javascript:x' }, { t: 'use', href: '#a' }]), null);
    assert.equal(propio([{ t: 'path', d: 'M0 0 url(javascript:x)', relleno: true }]), null);
    assert.equal(propio([{ t: 'rect', x: Infinity, y: 0, width: 1, height: 1, relleno: true }]), null);
    assert.equal(propio([{ t: 'polygon', points: '0,0 1,1"><script>', relleno: true }]), null);
    assert.equal(propio([{ t: 'path', d: 'M0 0L1 1' }]), null);                     // ni relleno ni trazo: no se ve
    assert.equal(propio([{ t: 'circle', r: 1, relleno: true }], [0, 0, 0, 24]), null);
    const raro = propio([{ t: 'path', d: 'M0 0L9 9', relleno: true, onload: 'x', fill: 'url(#a)' }]);
    assert.deepEqual(raro.propio.formas[0], { t: 'path', d: 'M0 0L9 9', relleno: true, trazo: 0 });
    /* Un giro que no se puede leer dejaria la forma en otro lugar: la forma no va */
    assert.equal(propio([{ t: 'path', d: 'M0 0L9 9', relleno: true, transform: 'translate(0) url(x)' }]), null);
    assert.equal(propio([{ t: 'path', d: 'M0 0L9 9', relleno: true, transform: 'skewX(10)' }]), null);
    /* Los huecos se respetan */
    assert.equal(propio([{ t: 'path', d: 'M0 0L9 9z', relleno: true, regla: 'evenodd' }]).propio.formas[0].regla, 'evenodd');
    assert.equal(I.arbolIcono(propio([{ t: 'path', d: 'M0 0L9 9z', relleno: true, regla: 'evenodd' }])).hijos[0].attrs['fill-rule'], 'evenodd');
    assert.equal(propio([{ t: 'path', d: `M0 0${' L1 1'.repeat(3000)}`, relleno: true }]), null);   // demasiado trazado
    assert.equal(propio(Array.from({ length: 200 }, () => ({ t: 'circle', cx: 1, cy: 1, r: 1, relleno: true }))).propio.formas.length, I.FORMAS_MAX);
  });
  await ok('la puerta del dibujo: atributos de icono solo en el icono, y solo valores de forma', () => {
    assert.ok(valorSeguro('path', 'd', 'M0 0L1 1z'));
    assert.ok(!valorSeguro('path', 'd', 'M0 0 url(x)'));
    assert.ok(!valorSeguro('div', 'd', 'M0 0'));
    assert.ok(!valorSeguro('img', 'width', '10'));
    assert.ok(valorSeguro('circle', 'r', '1.5e2'));
    assert.ok(!valorSeguro('circle', 'r', '1;x'));
    assert.ok(valorSeguro('path', 'fill', 'currentColor') && !valorSeguro('path', 'fill', 'url(#a)') && !valorSeguro('path', 'stroke', 'red'));
    assert.ok(valorSeguro('svg', 'viewBox', '0 0 24 24') && !valorSeguro('svg', 'viewBox', '0 0 24'));
    assert.ok(!valorSeguro('path', 'transform', 'translate(1) url(x)'));
    assert.ok(!valorSeguro('svg', 'aria-hidden', 'false'));
    assert.ok(valorSeguro('a', 'href', 'https://fraterni.co/x') && !valorSeguro('a', 'href', 'javascript:x'));
    assert.ok(!valorSeguro('path', 'href', '#a') && !valorSeguro('div', 'href', 'https://fraterni.co'));
    assert.ok(!valorSeguro('circle', 'r', '1'.repeat(40)));
    assert.ok(valorSeguro('path', 'fill-rule', 'evenodd') && !valorSeguro('path', 'fill-rule', 'x'));
  });
  await ok('un giro armado para trabar la pestaña se rechaza al instante', () => {
    const inicio = performance.now();
    for (const t of ['rotate(1)   '.repeat(24) + '!', 'scale(1)    '.repeat(24) + 'x', ' translate( 1 2 )  '.repeat(15) + 'y']) {
      assert.equal(I.RE_TRANSFORM.test(t), false);
      assert.equal(valorSeguro('path', 'transform', t), false);
    }
    assert.ok(I.RE_TRANSFORM.test('translate(1 2) rotate(45)') && I.RE_TRANSFORM.test('matrix(1,0,0,1,1e3,-2.5)') && I.RE_TRANSFORM.test(' scale( 2 ) '));
    assert.ok(performance.now() - inicio < 200, `tardo ${Math.round(performance.now() - inicio)} ms`);
  });
  await ok('el boton con icono: a un lado o solo, y su texto sigue siendo su nombre', () => {
    const d = B.datosDeBoton({ texto: 'Copiar', accion: 'copiar', copia: 'x', icono: { nombre: 'copiar' }, lado: 'solo' });
    assert.deepEqual([d.icono, d.lado], [{ nombre: 'copiar' }, 'solo']);
    const p = B.piezaDeBoton(d, 'boton', {}, false);
    assert.equal(p.clase, 'boton boton--icono boton--solo');
    assert.deepEqual(p.hijos.map((h) => h.tag), ['svg', 'span']);
    assert.equal(p.hijos[1].hijos[0].texto, 'Copiar');
    const der = B.piezaDeBoton({ ...d, lado: 'der' }, 'boton', {}, false);
    assert.deepEqual([der.clase, der.hijos.map((h) => h.tag)], ['boton boton--icono', ['span', 'svg']]);
    /* Sin icono queda como siempre: un texto suelto, sin clases nuevas, y mide lo mismo */
    const sin = B.piezaDeBoton(B.datosDeBoton({ texto: 'Abrir', enlace: 'https://fraterni.co' }), 'boton', {}, false);
    assert.deepEqual([sin.clase, sin.hijos], ['boton', [{ texto: 'Abrir' }]]);
    assert.equal(B.datosDeBoton({ lado: 'url(x)' }).lado, 'izq');
    /* Sin texto, solo el icono: sin hueco a su lado */
    assert.deepEqual(B.piezaDeBoton({ ...d, texto: '' }, 'boton', {}, false).hijos.map((h) => h.tag), ['svg']);
    /* Un boton solo icono en una pagina libre sigue en su lugar: no se vuelve relativo */
    assert.ok(cssLibro({}).includes('.libro .boton--solo:not(.obj) { position: relative; }'));
    assert.ok(cssLibro({}).includes('.libro .boton--solo .boton__texto { position: absolute;'));
  });
}

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
