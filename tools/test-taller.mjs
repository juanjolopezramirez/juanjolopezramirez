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
import { estiloSeguro, ponerEstilo } from '../src/scripts/contenido/taller/armar.js';
import * as A from '../src/scripts/contenido/taller/aspectoBoton.js';
import * as I from '../src/scripts/contenido/taller/IndiceLibro.js';
import { revisarTiposTaller } from './revisar-tipos-taller.mjs';
import { grupoDe, gruposDe, paginaDe, planCambio, totalDe } from '../src/scripts/contenido/taller/OrigenPdf.js';
import { partirEnTres, planRango } from '../src/scripts/portal/panel/dev/taller/Partir.js';

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
  /* Lo que fabrican los tipos pasa la puerta tal cual: ni un valor se pierde ni hace falta limpiar de nuevo */
  Object.entries(n.estilo || {}).forEach(([k, v]) => assert.ok(estiloSeguro(k, v), `${k}: ${v}`));
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
  await ok('portada: se reconoce sola, se elige a mano, no sale en el contenido y el contenido va despues de ella', async () => {
    const { capitulosParaIndice } = await import('../src/scripts/contenido/taller/hoja.js');
    const pdf = { id: 'c0', titulo: '', contenido: { doc: { type: 'doc', content: [libre('', ''), libre('', '')] } } };
    const conTitulo = { id: 'c0', titulo: 'Intro', contenido: { doc: { type: 'doc', content: [libre('', ''), h('Intro', 1, 't-0000000f')] } } };
    const libro = [pdf, ...caps().slice(1)];
    assert.equal(I.hayPortada(capitulosParaIndice(libro), 'auto'), true);
    assert.equal(I.hayPortada(capitulosParaIndice([pdf]), 'auto'), false, 'un libro de un solo capitulo no es todo portada');
    assert.equal(I.hayPortada(capitulosParaIndice([conTitulo, ...caps().slice(1)]), 'auto'), false);
    assert.equal(I.hayPortada(capitulosParaIndice(caps().slice(1)), 'auto'), false, 'un libro que empieza con texto');
    assert.equal(I.hayPortada(capitulosParaIndice(libro), 'no'), false);
    assert.equal(I.hayPortada(capitulosParaIndice(caps().slice(1)), 'si'), true);
    assert.equal(I.hayPortada([], 'si'), false);
    /* Un capitulo nuevo empieza con un renglon vacio antes de la pagina del PDF: sigue siendo portada */
    const conVacio = { ...pdf, contenido: { doc: { type: 'doc', content: [{ type: 'paragraph' }, libre('', '')] } } };
    assert.equal(I.hayPortada(capitulosParaIndice([conVacio, ...caps().slice(1)]), 'auto'), true);
    const conTexto = { ...pdf, contenido: { doc: { type: 'doc', content: [parrafo('Hola'), libre('', '')] } } };
    assert.equal(I.hayPortada(capitulosParaIndice([conTexto, ...caps().slice(1)]), 'auto'), false);
    /* Un PDF traido con la forma vieja (paginasPdf) tambien es portada */
    const vieja = { ...pdf, contenido: { doc: { type: 'doc', content: [{ type: 'paginasPdf', attrs: {} }] } } };
    assert.equal(I.hayPortada(capitulosParaIndice([vieja, ...caps().slice(1)]), 'auto'), true);
    /* Se fija la primera vez que se reconoce sola; nunca si ya la eligio el autor, ni sin portada */
    assert.equal(I.debeFijarPortada(capitulosParaIndice(libro), 'auto'), true);
    assert.equal(I.debeFijarPortada(capitulosParaIndice(libro), 'si'), false);
    assert.equal(I.debeFijarPortada(capitulosParaIndice(libro), 'no'), false);
    assert.equal(I.debeFijarPortada(capitulosParaIndice(caps().slice(1)), 'auto'), false);
    /* Una pagina arriba y texto debajo: se reconoce como portada, pero no se fija (puede estar escribiendo) */
    const escribiendo = { ...pdf, contenido: { doc: { type: 'doc', content: [libre('', ''), parrafo('Aquí empiezo a escribir')] } } };
    assert.equal(I.hayPortada(capitulosParaIndice([escribiendo, ...caps().slice(1)]), 'auto'), true);
    assert.equal(I.debeFijarPortada(capitulosParaIndice([escribiendo, ...caps().slice(1)]), 'auto'), false);
    assert.equal(I.debeFijarPortada(capitulosParaIndice([conVacio, ...caps().slice(1)]), 'auto'), true, 'renglones vacios no cuentan');
    /* Un hueco (null) en un libro guardado no rompe nada */
    const roto = { id: 'r', titulo: '', contenido: { doc: { type: 'doc', content: [null, { type: 'columnas', content: [null] }, libre('', '')] } } };
    assert.doesNotThrow(() => I.hayPortada(capitulosParaIndice([roto, ...caps().slice(1)]), 'auto'));
    assert.doesNotThrow(() => I.entradasDe(capitulosParaIndice([roto, ...caps().slice(1)])));
    const cs = capitulosParaIndice(libro);
    assert.equal(I.lugarDelIndice(cs, { antesDe: '' }, true), 1);
    assert.equal(I.lugarDelIndice(cs, { antesDe: 'c0' }, true), 1, 'nunca antes de la portada');
    assert.equal(I.lugarDelIndice(cs, { antesDe: 'c3' }, true), 2);
    assert.equal(I.lugarDelIndice(cs, { antesDe: 'nada' }, false), 0);
    assert.equal(I.lugarDelIndice(cs.slice(0, 1), { antesDe: '' }, true), 1, 'la portada es todo el libro: al final');
    /* Con «Mostrar en el contenido» y todo, la portada no sale */
    const nombrada = [{ ...pdf, titulo: 'Tapa' }, ...caps().slice(1)];
    assert.ok(!I.entradasDe(capitulosParaIndice(nombrada), { portada: true }).some((f) => f.ancla === 'cap-1'));
    assert.ok(I.entradasDe(capitulosParaIndice(nombrada), { portada: false }).some((f) => f.ancla === 'cap-1'));
    const hj = aHoja(new Obra({ pagina: { indice: { ver: true }, portada: 'auto' } }).aDatos(), libro, { indice: { numeros: {}, reparto: [9] } });
    assert.deepEqual(hj.nodos[0].hijos.map((n) => n.tag), ['section', 'nav', 'section', 'section']);
    const sola = aHoja(new Obra({ pagina: { indice: { ver: true }, portada: 'si' } }).aDatos(), [{ ...pdf, titulo: 'Tapa' }], { indice: { numeros: {}, reparto: [9] } });
    assert.ok(!sola.nodos[0].hijos.some((n) => n.tag === 'nav'), 'sin capitulos fuera de la portada no hay contenido');
    assert.deepEqual([true, false, 'si', 'no', 'x', undefined].map((v) => new ConfigPagina({ portada: v }).portada), ['si', 'no', 'si', 'no', 'auto', 'auto']);
    assert.equal(new ConfigPagina(new ConfigPagina({ portada: 'no' }).aDatos()).portada, 'no');
  });
  await ok('numeros: cinco lugares, la misma tabla en la mesa y el PDF, y la portada sin numero', async () => {
    const { ladoDelNumero } = await import('../src/scripts/contenido/taller/ConfigPagina.js');
    const tabla = (l) => [1, 2, 3, 4].map((n) => ladoDelNumero(l, n)).join(' ');
    assert.equal(tabla('pie-centro'), 'centro centro centro centro');
    assert.equal(tabla('pie-izquierda'), 'izq izq izq izq');
    assert.equal(tabla('pie-derecha'), 'der der der der');
    assert.equal(tabla('pie-exterior'), 'der izq der izq', 'la pagina 1 es de la derecha');
    assert.equal(tabla('pie-interior'), 'izq der izq der');
    assert.equal(ladoDelNumero('raro', 3), 'centro');
    assert.equal(new ConfigPagina({ numeros: { lugar: 'pie-derecha' } }).numeros.lugar, 'pie-derecha');
    assert.equal(new ConfigPagina({ numeros: { lugar: 'arriba' } }).numeros.lugar, 'pie-centro');
    const css = (lugar, portada = 'no', libro = caps()) => aHoja(new Obra({ pagina: { numeros: { lugar }, portada } }).aDatos(), libro).css;
    assert.match(css('pie-centro'), /@page \{ @bottom-center \{ content: counter\(page\)/);
    assert.match(css('pie-izquierda'), /@page \{ @bottom-left \{ content: counter\(page\)/);
    assert.match(css('pie-derecha'), /@page \{ @bottom-right \{ content: counter\(page\)/);
    assert.match(css('pie-exterior'), /@page :left \{ @bottom-left \{ content: counter\(page\)[^}]*\} \} @page :right \{ @bottom-right \{/);
    assert.match(css('pie-interior'), /@page :left \{ @bottom-right \{ content: counter\(page\)[^}]*\} \} @page :right \{ @bottom-left \{/);
    /* Sin portada, nada de portada en el estilo; con ella, su pagina con nombre y sin numero */
    assert.ok(!css('pie-centro').includes('portada'));
    const pdf = { id: 'c0', titulo: '', contenido: { doc: { type: 'doc', content: [libre('', ''), parrafo('Texto de la portada')] } } };
    const conPortada = css('pie-centro', 'si', [pdf, ...caps().slice(1)]);
    assert.match(conPortada, /@page portada \{ @bottom-center \{ content: none; \}/);
    assert.match(conPortada, /\.capitulo\.capitulo--portada \{ page: portada; \}/);
    const hj = aHoja(new Obra({ pagina: { portada: 'si' } }).aDatos(), [pdf, ...caps().slice(1)]);
    assert.deepEqual(hj.nodos[0].hijos.map((n) => n.clase), ['capitulo capitulo--portada', 'capitulo', 'capitulo']);
    /* Una portada con su propio papel: la pagina con nombre lleva ese papel */
    const conPapel = { ...pdf, contenido: { ...pdf.contenido, papel: '#1E3A5F' } };
    const c2 = css('pie-centro', 'si', [conPapel, ...caps().slice(1)]);
    assert.match(c2, /@page portada-1e3a5f \{ background: #1e3a5f; @bottom-center \{ content: none; \}/);
    assert.match(c2, /\.capitulo\.capitulo--portada\.papel-1e3a5f \{ page: portada-1e3a5f; \}/);
  });
  await ok('rotulos: «Episodio IV», sin portada ni ocultos ni «Sin número», y la fila en dos trozos', async () => {
    const { capitulosParaIndice } = await import('../src/scripts/contenido/taller/hoja.js');
    const { propiosDe, propiosAGuardar } = await import('../src/scripts/contenido/taller/TextoLibro.js');
    assert.deepEqual([1, 4, 9, 14, 40, 90, 400, 1994, 3999].map(I.romano), ['I', 'IV', 'IX', 'XIV', 'XL', 'XC', 'CD', 'MCMXCIV', 'MMMCMXCIX']);
    assert.equal(I.romano(0), '0');
    const pdf = { id: 'c0', titulo: '', contenido: { doc: { type: 'doc', content: [libre('', '')] } } };
    const prologo = { id: 'cp', titulo: 'Prólogo', contenido: { titulo: 'Prólogo', numerar: false, doc: { type: 'doc', content: [parrafo('x')] } } };
    const sinNombre = { id: 'cs', titulo: '', contenido: { doc: { type: 'doc', content: [parrafo('y')] } } };
    const libro = [pdf, prologo, ...caps().slice(1), sinNombre];
    const cs = capitulosParaIndice(libro);
    assert.equal(cs[1].numerar, false);
    const r = I.rotulosDe(cs, { rotulo: { ver: true, palabra: 'Episodio', cifras: 'romano' }, portada: true });
    assert.deepEqual(r.map((x) => x.rotulo), ['', '', 'Episodio I', 'Episodio II', 'Episodio III']);
    assert.deepEqual(r.map((x) => x.numero), [0, 0, 1, 2, 3]);
    /* Un capitulo oculto no cuenta: los demas se corren */
    const oculto = capitulosParaIndice([pdf, prologo, ...caps().slice(1), sinNombre]);
    oculto[2].enIndice = false;
    assert.deepEqual(I.rotulosDe(oculto, { rotulo: { ver: true }, idioma: 'en', portada: true }).map((x) => x.rotulo), ['', '', '', 'Chapter 1', 'Chapter 2']);
    /* Sin «ver»: no hay rotulo, pero si el orden (para las plantillas con numero delante) */
    assert.deepEqual(I.rotulosDe(cs, { portada: true }).map((x) => `${x.rotulo}|${x.orden}`), ['|', '|', '|1', '|2', '|3']);
    /* El contenido: el sin nombre que cuenta sale como «Capítulo 3»; el prologo con su nombre y sin rotulo */
    const e = I.entradasDe(cs, { subtemas: false, portada: true, rotulo: { ver: true } });
    assert.deepEqual(e.map((f) => `${f.rotulo || ''}|${f.titulo}|${f.orden || ''}`), ['|Prólogo|', 'Capítulo 1|Uno|1', 'Capítulo 2|Dos a mano|2', 'Capítulo 3||3']);
    /* Sin rotulo, el sin nombre no sale (como siempre) */
    assert.ok(!I.entradasDe(cs, { subtemas: false, portada: true }).some((f) => f.ancla === 'cap-5'));
    const [nav] = I.hojasDeIndice(e, { 'cap-3': 4 }, [4], { titulo: 'Contenido' });
    nav.hijos.forEach(permitido);
    const fila = nav.hijos[2].hijos[0];
    assert.deepEqual(fila.hijos.map((x) => x.clase), ['indice__rotulo', 'indice__nombre']);
    assert.deepEqual(nav.hijos[4].hijos[0].hijos.map((x) => x.clase), ['indice__rotulo'], 'sin nombre: solo el rotulo');
    assert.deepEqual(nav.hijos[1].hijos[0].hijos, [{ texto: 'Prólogo' }], 'sin rotulo: el texto solo, como antes');
    assert.match(cssLibro({}), /\.indice__rotulo:not\(:last-child\)::after \{ content: " · "; \}/);
    /* La palabra se limpia y se corta; las cifras raras son arabigas */
    const raro = new ConfigPagina({ rotulo: { ver: 'si', palabra: `  Epi‮sodio\u0007 ${'x'.repeat(50)}`, cifras: 'griego' } }).rotulo;
    assert.equal(raro.ver, false);
    assert.ok(raro.palabra.startsWith('Episodio') && raro.palabra.length <= I.PALABRA_MAX);
    assert.equal(raro.cifras, 'arabe');
    assert.deepEqual(new ConfigPagina({}).rotulo, { ver: false, palabra: '', cifras: 'arabe' });
    /* Lo propio del capitulo: solo se guarda lo que no es de siempre, y limpiarContenido lo conserva */
    assert.deepEqual(propiosAGuardar({ titulo: '', enIndice: true, numerar: true }), {});
    assert.deepEqual(propiosAGuardar({ titulo: 'Pró', enIndice: false, numerar: false }), { titulo: 'Pró', enIndice: false, numerar: false });
    assert.deepEqual(propiosDe({ numerar: 'no' }), { titulo: '', enIndice: true, numerar: true, rol: '', rolTexto: '', palabra: '' });
    const limpio = limpiarContenido({ numerar: false, enIndice: true, doc: { type: 'doc', content: [parrafo('a')] } }).contenido;
    assert.equal(limpio.numerar, false);
    assert.ok(!('enIndice' in limpio));
    assert.ok(!('numerar' in limpiarContenido({ numerar: true, doc: { type: 'doc', content: [] } }).contenido));
  });
  await ok('plantillas: seis, la clasica como siempre, numero delante sin repetir «Capítulo», imagenes con su caja', async () => {
    const { capitulosParaIndice } = await import('../src/scripts/contenido/taller/hoja.js');
    const { rutasDelLibro } = await import('../src/scripts/contenido/taller/RutasLibro.js');
    const e = I.entradasDe(capitulosParaIndice(caps()), { rotulo: { ver: true } });
    /* Clasica sin numero: el nav de siempre, sin clase nueva */
    assert.equal(I.hojasDeIndice(e, {}, [e.length], { plantilla: 'clasico' })[0].clase, 'indice');
    assert.equal(I.hojasDeIndice(e, {}, [e.length], { plantilla: 'raro' })[0].clase, 'indice');
    for (const v of I.PLANTILLAS.slice(1)) assert.equal(I.hojasDeIndice(e, {}, [e.length], { plantilla: v })[0].clase, `indice indice--${v}`);
    const [nav] = I.hojasDeIndice(e, {}, [e.length], { plantilla: 'tabla', orden: true });
    assert.equal(nav.clase, 'indice indice--tabla indice--orden');
    nav.hijos.forEach(permitido);
    const uno = nav.hijos.find((h) => h.clase === 'indice__fila indice__fila--1');
    assert.equal(uno.hijos[0].clase, 'indice__orden');
    assert.equal(uno.hijos[0].hijos[0].texto, '1');
    assert.ok(!JSON.stringify(uno).includes('indice__rotulo'), 'con numero delante no se repite «Capítulo 1»');
    assert.ok(!nav.hijos.some((h) => h.clase === 'indice__fila indice__fila--2' && JSON.stringify(h).includes('indice__orden')), 'los subtemas sin numero');
    /* La imagen de arriba solo en la primera hoja; si aun no llego, su caja vacia; sin imagen, nada */
    const dos = I.hojasDeIndice(e, {}, [2, e.length - 2], { imagen: '' });
    assert.equal(dos[0].hijos[0].clase, 'indice__imagen');
    assert.equal(dos[0].hijos[0].hijos[0].tag, 'span');
    assert.ok(!dos[1].hijos.some((h) => h.clase === 'indice__imagen'));
    const src = 'data:image/webp;base64,AAAA';
    assert.equal(I.hojasDeIndice(e, {}, [e.length], { imagen: src })[0].hijos[0].hijos[0].attrs.src, src);
    assert.equal(I.hojasDeIndice(e, {}, [e.length], { imagen: 'javascript:alert(1)' })[0].hijos[0].hijos[0].tag, 'span');
    assert.ok(!I.hojasDeIndice(e, {}, [e.length], { imagen: null })[0].hijos.some((h) => h.clase === 'indice__imagen'));
    /* Una hoja de mas adelante (asi mide la mesa) no lleva ni nombre ni imagen */
    assert.ok(!I.hojasDeIndice(e, {}, [e.length], { imagen: '', primera: false })[0].hijos.some((h) => h.tag === 'h1' || h.clase === 'indice__imagen'));
    /* Tarjetas con portadas: la del capitulo que empieza con una pagina de PDF */
    const conPdf = [caps()[0], { id: 'c9', titulo: 'Con PDF', contenido: { titulo: 'Con PDF', doc: { type: 'doc', content: [{ type: 'paginaLibre', attrs: { fondo: 'taller/o1/pdf/p1.webp', objetos: [] } }] } } }];
    const em = I.entradasDe(capitulosParaIndice(conPdf), { minis: true });
    assert.equal(em.find((f) => f.titulo === 'Con PDF').mini, 'taller/o1/pdf/p1.webp');
    const malo = [{ id: 'c9', titulo: 'X', contenido: { titulo: 'X', doc: { type: 'doc', content: [{ type: 'paginaLibre', attrs: { fondo: 'taller/../x.webp' } }] } } }];
    assert.ok(!I.entradasDe(capitulosParaIndice(malo), { minis: true })[0].mini);
    const [t] = I.hojasDeIndice(em, {}, [em.length], { plantilla: 'tarjetas', minis: true, imagenes: { 'taller/o1/pdf/p1.webp': src } });
    t.hijos.forEach(permitido);
    assert.equal(t.hijos.find((h) => JSON.stringify(h).includes('Con PDF')).hijos[0].tag, 'img');
    /* La configuracion: lo raro no pasa */
    const ind = new ConfigPagina({ indice: { plantilla: 'linea', orden: 'si', imagen: { ruta: 'taller/o1/img/a1.webp', altoPct: 99, ajuste: 'x' }, portadas: true } }).indice;
    assert.deepEqual([ind.plantilla, ind.orden, ind.imagen.altoPct, ind.imagen.ajuste, ind.portadas], ['linea', false, 60, 'cubrir', true]);
    assert.equal(new ConfigPagina({ indice: { imagen: { ruta: 'libros/a.webp' } } }).indice.imagen.ruta, '', 'solo una imagen del libro');
    assert.equal(new ConfigPagina({ indice: { imagen: { ruta: 'taller/o1/img/a.svg' } } }).indice.imagen.ruta, '');
    assert.equal(new ConfigPagina({ indice: { imagen: { ruta: 'taller/o1/img/../a.webp' } } }).indice.imagen.ruta, '');
    /* El estilo: cada plantilla tiene sus reglas, ninguna con url( ni @import; la clasica conserva las suyas */
    const css = cssLibro({ indice: { imagen: { altoPct: 40, ajuste: 'contener' } } });
    for (const v of I.PLANTILLAS.slice(1)) assert.ok(css.includes(`.indice--${v}`), v);
    assert.ok(!/url\(|@import/i.test(css));
    assert.match(css, /\.libro \.indice__fila \{ display: flex; align-items: baseline; gap: \.4em; color: inherit; text-decoration: none; margin: 0 0 \.3em; break-inside: avoid; \}/);
    assert.match(css, /\.indice__foto \{ display: block; width: 100%; height: 100%; object-fit: contain; \}/);
    /* La imagen de arriba va al PDF y a la copia del libro */
    const obra = { pagina: { indice: { imagen: { ruta: 'taller/o1/img/a1.webp' } } } };
    const rutas = rutasDelLibro(obra, conPdf);
    assert.ok(rutas.has('taller/o1/img/a1.webp') && rutas.has('taller/o1/pdf/p1.webp'));
    /* En la hoja de impresion, con la imagen que trajo la vista */
    const hj = aHoja(new Obra({ pagina: { indice: { ver: true, plantilla: 'linea', imagen: { ruta: 'taller/o1/img/a1.webp' } } } }).aDatos(), caps(), { imagenes: { 'taller/o1/img/a1.webp': src }, indice: { numeros: {}, reparto: [9] } });
    const navs = hj.nodos[0].hijos.filter((n) => n.tag === 'nav');
    assert.equal(navs[0].clase, 'indice indice--linea');
    assert.equal(navs[0].hijos[0].hijos[0].attrs.src, src);
    /* Lo mas grande que puede guardar un libro sigue cabiendo */
    const grande = new ConfigPagina({ colores: Array(40).fill('#123456'), letras: Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`Fuente${i}`, '#123456'])), rotulo: { ver: true, palabra: 'x'.repeat(30) }, indice: { ver: true, titulo: 'y'.repeat(120), plantilla: 'columnas', orden: true, imagen: { ruta: `taller/${'a'.repeat(40)}/img/${'b'.repeat(40)}.webp` }, portadas: true } });
    assert.ok(new TextEncoder().encode(JSON.stringify(grande.aDatos())).length < 8000);
  });
  await ok('lo propio de un capitulo pasa siempre por un solo lugar (nadie lo copia a mano)', async () => {
    const { readFile } = await import('node:fs/promises');
    const leer = (r) => readFile(new URL(`../src/scripts/${r}`, import.meta.url), 'utf8');
    const archivos = ['portal/panel/dev/Taller.js', 'portal/panel/dev/taller/Mesa.js', 'portal/panel/dev/taller/CapituloVivo.js', 'contenido/taller/hoja.js'];
    for (const a of archivos) {
      const t = await leer(a);
      assert.ok(!/enIndice: (?:v|a|this|x)\.enIndice !== false|\.enIndice === false \? \{ enIndice/.test(t), `${a} copia enIndice a mano`);
      assert.ok(!/limpiarContenido\(\{[^)]*tituloPropio/.test(t), `${a} arma los propios a mano`);
    }
  });
  await ok('ConfigPagina: el indice de antes (true) sigue, y lo raro no pasa', () => {
    assert.deepEqual(new ConfigPagina({ indice: true }).indice, { ver: true, titulo: '', subtemas: true, puntos: true, antesDe: '', plantilla: 'clasico', orden: false, imagen: { ruta: '', altoPct: 30, ajuste: 'cubrir' }, portadas: false, verRol: false, negrita: { n1: false, n2: false } });
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
  const nombres = ['tamano', 'anchoMm', 'altoMm', 'anchoPx', 'altoPx', 'fuente', 'tamanoPt', 'interlinea', 'idioma', 'numerosVer', 'lugar', 'portada', 'indice', 'indiceTitulo', 'indiceAntes', 'indiceSubtemas', 'indicePuntos', 'imprenta',
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

console.log('el aspecto y el lugar suelto del boton');
{
  const B = await import('../src/scripts/contenido/taller/tipos/boton.js');
  const { OBJETOS } = await import('../src/scripts/contenido/taller/tipos/objetos.js');
  const { readFileSync } = await import('node:fs');
  const nodoBoton = (attrs) => limpiarContenido({ doc: { type: 'doc', content: [{ type: 'boton', attrs }] } }).contenido.doc.content[0];
  await ok('el aspecto sale con topes: numeros, colores y palabras de una lista', () => {
    const a = A.limpiarAspecto({ estilo: 'url(x)', borde: 99999, bordeColor: 'red;x:url(y)', linea: '"><x', radio: 1e9, negrita: 'si', opacidad: -5, sombra: { tipo: 'url(x)', auto: 'x', color: 'expression(1)' }, onclick: 'x' });
    assert.deepEqual(a, { estilo: 'relleno', borde: 8, bordeColor: '', linea: 'solido', radio: 40, negrita: false, opacidad: 20, sombra: { tipo: 'ninguna', auto: true, color: '' } });
    assert.equal(A.limpiarAspecto('url(x)'), null);
    assert.equal(A.limpiarAspecto([1]), null);
    assert.equal(A.limpiarAspecto({ radio: 'pildora' }).radio, 'pildora');
    assert.equal(A.limpiarAspecto({ radio: '12' }).radio, null);
    assert.equal(A.limpiarAspecto({ bordeColor: 'rgb(1, 2, 3)' }).bordeColor, '#010203');
    const hostil = A.limpiarAspecto(JSON.parse('{"__proto__":{"estilo":"duolingo"},"sombra":{"__proto__":{"tipo":"dura"},"color":"#zzzzzz"}}'));
    assert.equal(hostil.estilo, 'relleno');
    assert.deepEqual(hostil.sombra, { tipo: 'ninguna', auto: true, color: '' });
    assert.equal(Object.keys(A.limpiarAspecto({})).length, 8);
  });
  await ok('el borde de abajo de «Duolingo» sale del relleno: mas oscuro, mismo tono; o el color que se elija', () => {
    const luz = (h) => { const n = parseInt(h.slice(1), 16), [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => c / 255); return (Math.max(r, g, b) + Math.min(r, g, b)) / 2; };
    const claro = '#58cc02', oscuro = A.bordeInferiorDe(claro);
    assert.match(oscuro, /^#[0-9a-f]{6}$/);
    assert.ok(luz(oscuro) < luz(claro) * 0.9, `${oscuro} no es mas oscuro`);
    assert.equal(A.bordeInferiorDe('#58cc02'), A.bordeInferiorDe('rgb(88, 204, 2)'));
    /* Un relleno casi negro no puede oscurecerse: el escalon sale un poco mas claro */
    assert.ok(luz(A.bordeInferiorDe('#111111')) > luz('#111111'));
    assert.ok(luz(A.bordeInferiorDe('#ffffff')) < 1);
    assert.equal(A.bordeInferiorDe('url(x)'), '');
    assert.equal(A.bordeInferiorDe(''), '');
    const duo = A.conEstilo(null, 'duolingo');
    assert.deepEqual([duo.estilo, duo.borde, duo.radio, duo.negrita, duo.sombra.tipo, duo.sombra.auto], ['duolingo', 0, 8, true, 'dura', true]);
    const base = { fondo: '#58cc02', color: '#ffffff', aspecto: duo };
    assert.deepEqual(A.sombraDe(base), { x: 0, y: 5, blur: 0, color: oscuro });
    assert.equal(A.estiloAspecto(base)['box-shadow'], `0px 5px 0px ${oscuro}`);
    /* A mano: el color elegido gana, y si se vuelve a «calcular» el calculado vuelve */
    const manual = { ...base, aspecto: { ...duo, sombra: { tipo: 'dura', auto: false, color: '#7a1f2b' } } };
    assert.equal(A.estiloAspecto(manual)['box-shadow'], '0px 5px 0px #7a1f2b');
    assert.equal(A.estiloAspecto({ ...manual, aspecto: { ...manual.aspecto, sombra: { ...manual.aspecto.sombra, auto: true } } })['box-shadow'], `0px 5px 0px ${oscuro}`);
    /* A mano pero sin color elegido: no se queda sin escalon */
    assert.equal(A.estiloAspecto({ ...base, aspecto: { ...duo, sombra: { tipo: 'dura', auto: false, color: '' } } })['box-shadow'], `0px 5px 0px ${oscuro}`);
    /* Cambiar el relleno cambia el escalon: va con el */
    assert.notEqual(A.estiloAspecto({ ...base, fondo: '#2f7bff' })['box-shadow'], A.estiloAspecto(base)['box-shadow']);
    const e = A.estiloAspecto(base);
    assert.equal(e['font-weight'], '700');
    assert.equal(e['border-radius'], '8px');
    assert.ok(!('border-width' in e));
    assert.equal(A.claseDeAspecto(base), ' boton--duo');
  });
  await ok('un boton sin aspecto ni suelto sale exactamente como siempre', () => {
    const d = B.datosDeBoton({ texto: 'Abrir', enlace: 'https://fraterni.co', fondo: '#123456' });
    assert.equal(d.aspecto, null);
    const p = B.piezaDeBoton(d, 'boton', {}, false);
    assert.equal(p.clase, 'boton');
    assert.deepEqual(p.estilo, { 'background-color': '#123456', color: '#ffffff' });
    assert.deepEqual(B.estiloDeBoton({ fondo: '', color: '#222222' }), { color: '#222222' });
    const n = nodoBoton({ texto: 'Abrir', enlace: 'https://fraterni.co', alinear: 'centro' });
    assert.equal(n.attrs.suelto, null);
    const t = POR_NODO.get('boton').pdf(n);
    assert.deepEqual([t.tag, t.clase], ['a', 'boton boton--centro']);
  });
  await ok('contorno y solo texto no llevan relleno; la pildora es del todo redonda', () => {
    const c = { fondo: '#58cc02', color: '#ffffff', aspecto: A.conEstilo(null, 'contorno') };
    assert.equal(A.claseDeAspecto(c), ' boton--hueco boton--contorno');
    const e = B.estiloDeBoton(c);
    assert.ok(!('background-color' in e));
    assert.equal(e.color, '#58cc02');
    assert.deepEqual([e['border-width'], e['border-style'], e['border-color']], ['2px', 'solid', 'currentcolor']);
    assert.equal(A.claseDeAspecto({ aspecto: A.conEstilo(null, 'texto') }), ' boton--hueco');
    assert.equal(A.estiloAspecto({ aspecto: A.conEstilo(null, 'pildora') })['border-radius'], '999px');
    const punteado = A.estiloAspecto({ aspecto: { ...A.conEstilo(null, 'relleno'), borde: 3, linea: 'punteado', bordeColor: '#112233' } });
    assert.deepEqual([punteado['border-width'], punteado['border-style'], punteado['border-color']], ['3px', 'dotted', '#112233']);
    assert.equal(A.estiloAspecto({ aspecto: { ...A.conEstilo(null, 'relleno'), linea: 'rayado', borde: 1 } })['border-style'], 'dashed');
    assert.equal(A.estiloAspecto({ aspecto: A.limpiarAspecto({ opacidad: 50 }) }).opacity, '0.5');
    assert.equal(A.estiloAspecto({ aspecto: A.limpiarAspecto({ sombra: { tipo: 'suave' } }) })['box-shadow'], '0px 3px 10px #00000040');
  });
  await ok('suelto: sus tres numeros con tope, y el giro cuenta para que no se salga', () => {
    assert.deepEqual(A.limpiarSuelto({ dx: 1e9, dy: '</style>', rot: Infinity }), { dx: 400, dy: 0, rot: 0 });
    assert.deepEqual(A.limpiarSuelto({ dx: -12.34, dy: 5.55, rot: 725 }), { dx: -12.3, dy: 5.6, rot: 360 });
    assert.equal(A.limpiarSuelto(null), null);
    assert.equal(A.limpiarSuelto('x'), null);
    assert.equal(A.limpiarSuelto([1]), null);
    const lim = { x0: 0, x1: 100, y0: 0, y1: 50 }, caja = { w: 40, h: 10 };
    assert.deepEqual(A.acotarSuelto({ dx: 10, dy: 5, rot: 0 }, caja, lim), { dx: 10, dy: 5, rot: 0 });
    assert.deepEqual(A.acotarSuelto({ dx: 999, dy: 999, rot: 0 }, caja, lim), { dx: 60, dy: 40, rot: 0 });
    assert.deepEqual(A.acotarSuelto({ dx: -999, dy: -999, rot: 0 }, caja, lim), { dx: 0, dy: 0, rot: 0 });
    /* Girado 90 grados un boton de 40 por 10 ocupa 10 por 40: su centro queda a 5 del borde izquierdo y a 20 del de arriba */
    const g = A.acotarSuelto({ dx: -999, dy: -999, rot: 90 }, caja, lim);
    assert.ok(Math.abs(g.dx + 15) < .2 && Math.abs(g.dy - 15) < .2, JSON.stringify(g));
    /* Una hoja mas chica que el boton no rompe nada */
    const t = A.acotarSuelto({ dx: 5, dy: 5, rot: 0 }, { w: 200, h: 200 }, lim);
    assert.ok(Number.isFinite(t.dx) && Number.isFinite(t.dy));
    /* Y si es mas chica, manda arriba/izquierda: el borde izquierdo y el de arriba quedan dentro de la hoja */
    const ch = A.acotarSuelto({ dx: 5, dy: 5, rot: 0 }, { w: 200, h: 10 }, { x0: 0, x1: 100, y0: 0, y1: 50 });
    assert.ok(ch.dx >= -1e-9 && ch.dy >= -1e-9, JSON.stringify(ch));
    const bajo = A.acotarSuelto({ dx: 5, dy: 0, rot: 0 }, { w: 10, h: 200 }, { x0: 0, x1: 100, y0: 0, y1: 50 });
    assert.ok(bajo.dy >= -1e-9, JSON.stringify(bajo));
    /* 60x10 girado 45 grados en una caja de 30 mm de alto: ocupa ~49 mm de alto, no pasa de arriba */
    const gi = A.acotarSuelto({ dx: 20, dy: -50, rot: 45 }, { w: 60, h: 10 }, { x0: 0, x1: 100, y0: 0, y1: 30 });
    const hyG = (60 * Math.sin(Math.PI / 4) + 10 * Math.cos(Math.PI / 4)) / 2;
    assert.ok(gi.dy + 5 - hyG >= -.2, JSON.stringify(gi));
    assert.deepEqual(A.estiloSuelto({ dx: 12.3, dy: -4, rot: 15 }), { transform: 'translate(12.3mm, -4mm) rotate(15deg)' });
    assert.deepEqual(A.estiloSuelto({ dx: 0, dy: 0, rot: 0 }), { transform: 'translate(0mm, 0mm)' });
  });
  await ok('un boton suelto sale en un marco sin alto, y su lugar es solo un transform', () => {
    const n = nodoBoton({ texto: 'Ir', enlace: 'https://fraterni.co/x', fondo: '#58cc02', aspecto: A.conEstilo(null, 'duolingo'), suelto: { dx: 12.3, dy: -4, rot: 15 } });
    assert.deepEqual(n.attrs.suelto, { dx: 12.3, dy: -4, rot: 15 });
    const t = POR_NODO.get('boton').pdf(n);
    assert.deepEqual([t.tag, t.clase, t.hijos.length], ['div', 'boton-suelto', 1]);
    const b = t.hijos[0];
    assert.deepEqual([b.tag, b.clase, b.attrs.href], ['a', 'boton boton--suelta boton--duo', 'https://fraterni.co/x']);
    assert.equal(b.estilo.transform, 'translate(12.3mm, -4mm) rotate(15deg)');
    assert.ok(!('left' in b.estilo) && !('top' in b.estilo));
    const css = cssLibro({});
    assert.ok(css.includes('.libro .boton-suelto { position: relative; height: 0; margin: 0;'));
    assert.ok(css.includes('.libro .boton-suelto > .boton--suelta { position: absolute; left: 0; top: 0; margin: 0;'));
    assert.ok(!/url\s*\(|@import/i.test(css));
    /* Y en el PDF entero: el marco, el boton y nada mas */
    const h = aHoja({ titulo: 'T' }, [{ contenido: doc(parrafo('a'), { type: 'boton', attrs: n.attrs }).doc }]);
    assert.ok(JSON.stringify(h.nodos).includes('boton-suelto'));
    assert.ok(!/url\s*\(|@import/i.test(h.css));
  });
  await ok('la puerta de estilos: solo lo que fabrica aspectoBoton.js; nunca texto libre', () => {
    const buenos = [['border-width', '8px'], ['border-style', 'dashed'], ['border-color', 'currentcolor'], ['border-color', '#aabbcc'], ['border-radius', '40px'], ['border-radius', '999px'],
      ['box-shadow', '0px 5px 0px #46a302'], ['box-shadow', '0px 3px 10px #00000040'], ['opacity', '0.5'], ['opacity', '1'], ['font-weight', '700'], ['background-color', 'transparent'],
      ['transform', 'translate(1mm, -2.5mm) rotate(20deg)'], ['transform', 'rotate(-12deg)'], ['transform', 'translate(500mm, -500px) rotate(360deg)'], ['left', '12.5%'], ['width', '40%'], ['font-size', '12pt']];
    for (const [k, v] of buenos) assert.ok(estiloSeguro(k, v), `${k}: ${v}`);
    const malos = [['border-width', '9px'], ['border-width', '1e9px'], ['border-width', '2px;x:y'], ['border-style', 'url(x)'], ['border-color', 'red'], ['border-color', 'url(x)'], ['border-radius', '41px'], ['border-radius', '1e9px'],
      ['box-shadow', '0px 5px 0px red'], ['box-shadow', '0px 5px 0px #46a302, 0 0 0 99px red'], ['box-shadow', '99px 5px 0px #46a302'], ['box-shadow', '0px 5px 999px #46a302'], ['box-shadow', 'inset 0px 5px 0px #46a302'], ['opacity', '0'], ['opacity', '0.05'], ['opacity', '2'], ['opacity', 'var(--x)'],
      ['font-weight', 'bold'], ['font-weight', '700;x:y'], ['background-color', 'url(x)'], ['background-color', 'expression(alert(1))'], ['background-color', '</style><script>'], ['color', 'red;x:url(y)'],
      ['transform', 'translate(1mm, 2mm) url(x)'], ['transform', 'rotate(1deg); x'], ['transform', 'translate(1e999mm, 0mm)'], ['transform', 'rotate(1e999deg)'], ['transform', 'translate(1000mm, 0mm)'], ['transform', 'translate(0mm, 501px)'], ['transform', 'rotate(361deg)'], ['transform', 'translate(1mm, 2mm) rotate(1e999deg)'], ['transform', 'translate(99999999999999999999999999999999999999999999999999999999999999999999999999999mm,0mm)x'], ['left', 'calc(1px + 2px)'], ['left', '1e999999px'], ['width', 'url(x)'],
      ['font-family', '"x", url(y)'], ['grid-template-columns', '1fr; x:y'], ['position', 'fixed'], ['__proto__', '1px'], ['background-image', 'none'], ['border', '1px solid red'], ['box-shadow', 5], ['opacity', null]];
    for (const [k, v] of malos) assert.ok(!estiloSeguro(k, v), `${k}: ${v}`);
    /* Lo que se pone en un elemento pasa por la misma puerta, y las propiedades fuera de lista no entran */
    const puesto = {};
    ponerEstilo({ style: { setProperty: (k, v) => { puesto[k] = v; } } }, { 'box-shadow': '0px 5px 0px #46a302', 'border-color': 'url(x)', position: 'fixed', 'font-weight': '700', background: 'red' });
    assert.deepEqual(puesto, { 'box-shadow': '0px 5px 0px #46a302', 'font-weight': '700' });
    ponerEstilo({}, null);
  });
  await ok('el aspecto y el lugar suelto sobreviven a guardar, copiar y pegar, duplicar y a una pagina libre', () => {
    const attrs = { texto: 'Ir', enlace: 'https://fraterni.co/x', fondo: '#58cc02', color: '#ffffff', aspecto: { ...A.conEstilo(null, 'duolingo'), borde: 2, bordeColor: '#112233', linea: 'rayado', opacidad: 80, sombra: { tipo: 'dura', auto: false, color: '#7a1f2b' } }, suelto: { dx: 3, dy: 4, rot: 5 } };
    const n = nodoBoton(attrs);
    /* Pegar: los atributos viajan como JSON dentro del HTML (nodos/boton.js) y se vuelven a limpiar */
    const pegado = nodoBoton(JSON.parse(JSON.stringify(n.attrs)));
    assert.deepEqual(pegado.attrs, n.attrs);
    assert.deepEqual(nodoBoton(pegado.attrs).attrs, n.attrs);
    assert.deepEqual([n.attrs.aspecto.sombra.color, n.attrs.aspecto.linea, n.attrs.suelto.rot], ['#7a1f2b', 'rayado', 5]);
    /* «Pasar a pagina libre»: lleva todo lo del boton, y ahi ya no hay marco */
    const [o] = limpiarObjetos([{ id: 'o-abcd1234', ...B.datosDeBoton(n.attrs), tipo: 'boton', x: 30, y: 45, w: 40, h: 7, rot: 5, tam: '12pt' }]);
    assert.deepEqual(o.aspecto, n.attrs.aspecto);
    assert.equal(o.suelto, undefined);
    const e = OBJETOS.boton.pdf(o);
    assert.ok(e.clase.includes('boton--duo') && e.estilo['box-shadow'] === '0px 5px 0px #7a1f2b' && e.estilo['font-size'] === '12pt');
    assert.equal(e.estilo.transform, 'rotate(5deg)');
    /* Cada campo del boton esta en la lista de atributos del editor: si faltara uno, se perderia en silencio al guardar */
    const fuente = readFileSync(new URL('../src/scripts/portal/panel/dev/taller/nodos/boton.js', import.meta.url), 'utf8');
    for (const k of Object.keys(POR_NODO.get('boton').datos('boton', {}))) assert.ok(new RegExp(`\\b${k}: `).test(fuente), `nodos/boton.js no lista «${k}»`);
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

console.log('los pliegos de ver como libro');
{
  const P = await import('../src/scripts/portal/panel/dev/taller/pliegos.js');
  const lista = (n) => { const l = []; for (let i = n > 0 ? 0 : null; i != null; i = P.pliegoVecino(i, n, 1)) l.push(P.paginasDe(i, n)); return l; };
  await ok('la portada va sola; luego de dos en dos', () => {
    assert.deepEqual(lista(5), [[0], [1, 2], [3, 4]]);
    assert.deepEqual(lista(1), [[0]]);
  });
  await ok('con paginas pares la contratapa va sola al final', () => {
    assert.deepEqual(lista(4), [[0], [1, 2], [3]]);
    assert.deepEqual(lista(2), [[0], [1]]);
  });
  await ok('sin paginas no hay pliegos', () => {
    assert.deepEqual(lista(0), []);
    assert.equal(P.totalPliegos(0), 0);
    assert.deepEqual([...P.ventana(0, 0)], []);
  });
  await ok('cada pagina cae en el pliego que la trae, par o impar', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 40, 41]) {
      for (let p = 0; p < n; p++) assert.ok(P.paginasDe(P.pliegoDe(p, n), n).includes(p), `n=${n} p=${p}`);
    }
  });
  await ok('adelante y atras son inversos; en los extremos no hay vecino', () => {
    for (const n of [1, 2, 3, 4, 5, 8, 9]) {
      const l = lista(n);
      assert.equal(P.totalPliegos(n), l.length);
      for (let i = 0; i < l.length; i++) {
        const a = P.pliegoDe(l[i][0], n), s = P.pliegoVecino(a, n, 1);
        if (i < l.length - 1) assert.equal(P.pliegoVecino(s, n, -1), a);
        else assert.equal(s, null);
      }
      assert.equal(P.pliegoVecino(0, n, -1), null);
    }
  });
  await ok('la ventana de un libro de 300 paginas dibuja pocas', () => {
    assert.ok(P.ventana(P.pliegoDe(150, 300), 300).size <= 6);
    assert.ok(P.ventana([P.pliegoDe(150, 300), P.pliegoDe(152, 300)], 300).size <= 8);
    assert.deepEqual([...P.ventana(0, 300)].sort((a, b) => a - b), [0, 1, 2]);
  });
  await ok('la ventana no se sale del libro', () => {
    for (const n of [1, 2, 3, 7]) for (const x of P.ventana(0, n, 4)) assert.ok(x >= 0 && x < n);
    assert.deepEqual([...P.ventana(P.pliegoDe(6, 7), 7)].sort((a, b) => a - b), [3, 4, 5, 6]);
  });
  await ok('el lomo y el canto son numeros pequenos y finitos', () => {
    for (const n of [0, 1, 40, 5000]) {
      const l = P.lomoDe(n, 400), c = P.cantoDe(n, Math.max(n, 1), 400);
      assert.ok(Number.isFinite(l) && l >= 0 && l <= 64, `lomo ${l}`);
      assert.ok(Number.isFinite(c) && c >= 0 && c <= 9, `canto ${c}`);
    }
    assert.equal(P.lomoDe(NaN, 400), 0);
    assert.equal(P.cantoDe(3, 10, -5), 0);
  });
  await ok('un libro de una sola pagina nunca da un pliego negativo', () => {
    assert.equal(P.pliegoDe(5, 1), 0);
    assert.equal(P.pliegoDe(1, 1), 0);
    assert.equal(P.pliegoDe(2, 3), 1);
  });
  await ok('cerrado mira a un lado; abierto, al centro', () => {
    assert.equal(P.ladoDe(0, 5), 'r');
    assert.equal(P.ladoDe(1, 5), 'c');
    assert.equal(P.ladoDe(3, 4), 'l');
  });
}

console.log('el contenido despues de cualquier hoja');
{
  const caps = [{ id: 'a1', doc: { type: 'doc', content: [] } }, { id: 'b2', doc: { type: 'doc', content: [] } }, { id: 'c3', doc: { type: 'doc', content: [] } }];
  await ok('«al final» pone el contenido despues del ultimo capitulo', () => {
    assert.equal(I.lugarDelIndice(caps, { antesDe: I.AL_FINAL }, false), 3);
    assert.equal(I.lugarDelIndice(caps, { antesDe: 'b2' }, false), 1);
    assert.equal(I.lugarDelIndice(caps, { antesDe: 'no-existe' }, false), 0);
  });
  await ok('con portada de un solo capitulo, «al final» tambien cae despues de ella', () => {
    assert.equal(I.lugarDelIndice(caps.slice(0, 1), { antesDe: I.AL_FINAL }, true), 1);
    assert.equal(I.lugarDelIndice(caps, { antesDe: I.AL_FINAL }, true), 3);
    assert.equal(I.lugarDelIndice([], { antesDe: I.AL_FINAL }, false), 0);
  });
  await ok('el libro guarda y relee «al final»', () => {
    const c = new ConfigPagina({ indice: { ver: true, antesDe: I.AL_FINAL } });
    assert.equal(c.indice.antesDe, 'fin');
    assert.equal(new ConfigPagina(c.aDatos()).indice.antesDe, 'fin');
  });
}

console.log('papeles, palabra propia, subetapa y encabezado');
{
  const { capitulosParaIndice } = await import('../src/scripts/contenido/taller/hoja.js');
  const { propiosDe, propiosAGuardar } = await import('../src/scripts/contenido/taller/TextoLibro.js');
  const C = await import('../src/scripts/contenido/taller/CabezaLibro.js');
  const sub = (texto) => ({ type: 'subetapa', attrs: { texto } });
  const cap = (titulo, extra = {}, ...bloques) => ({ id: `c-${titulo}`, titulo, contenido: { ...extra, doc: { type: 'doc', content: bloques.length ? bloques : [parrafo(titulo)] } } });
  await ok('papeles: no cuentan, el Capítulo 1 es el primero de verdad, y el rotulo es el nombre del papel', () => {
    const cs = capitulosParaIndice([cap('Intro', { rol: 'introduccion' }), cap('Uno'), cap('Dos'), cap('Fin', { rol: 'custom', rolTexto: ' Mi  cierre ' })]);
    const r = I.rotulosDe(cs, { rotulo: { ver: true } });
    assert.deepEqual(r.map((x) => x.rotulo), ['Introducción', 'Capítulo 1', 'Capítulo 2', 'Mi cierre']);
    assert.deepEqual(r.map((x) => x.numero), [0, 1, 2, 0]);
    assert.deepEqual(r.map((x) => x.rol), ['Introducción', '', '', 'Mi cierre']);
    /* Sin rotulos: ninguno, pero el papel se sabe (miniaturas y encabezado) */
    assert.deepEqual(I.rotulosDe(cs, {}).map((x) => `${x.rotulo}|${x.rol}`), ['|Introducción', '|', '|', '|Mi cierre']);
    /* En ingles, los nombres de siempre en ingles; un papel inventado no es papel */
    assert.equal(I.rotulosDe(cs, { rotulo: { ver: true }, idioma: 'en' })[0].rotulo, 'Introduction');
    assert.equal(I.nombreDeRol('hackeo', ''), '');
    assert.equal(I.nombreDeRol('custom', '  '), '');
    assert.equal(I.nombreDeRol('__proto__', 'x'), '');
    /* La portada y un capitulo oculto no llevan papel en su rotulo */
    assert.equal(I.rotulosDe(cs, { rotulo: { ver: true }, portada: true })[0].rotulo, '');
  });
  await ok('palabra propia: cuenta aparte por palabra; sin ella, la del libro; los papeles no entran', () => {
    const cs = capitulosParaIndice([cap('A'), cap('B', { palabra: 'Etapa' }), cap('C'), cap('D', { palabra: 'etapa' }), cap('E', { palabra: 'Capítulo' }), cap('F', { rol: 'prefacio', palabra: 'Etapa' })]);
    const r = I.rotulosDe(cs, { rotulo: { ver: true } });
    assert.deepEqual(r.map((x) => x.rotulo), ['Capítulo 1', 'Etapa 1', 'Capítulo 2', 'Etapa 2', 'Capítulo 3', 'Prefacio']);
    assert.deepEqual(I.rotulosDe(cs, { rotulo: { ver: true, cifras: 'romano', palabra: 'Parte' } }).map((x) => x.rotulo), ['Parte I', 'Etapa I', 'Parte II', 'Etapa II', 'Capítulo I', 'Prefacio']);
    /* Con los rotulos apagados no hay palabra que mostrar */
    assert.deepEqual(I.rotulosDe(cs, {}).map((x) => x.rotulo), ['', '', '', '', '', '']);
    assert.equal(propiosDe({ palabra: `  Et​apa ${'x'.repeat(50)}` }).palabra.length, I.PALABRA_MAX);
  });
  await ok('lo propio del capitulo: papel y palabra se guardan, se releen y lo raro no pasa', () => {
    assert.deepEqual(propiosAGuardar({ rol: 'introduccion', palabra: 'Etapa' }), { rol: 'introduccion', palabra: 'Etapa' });
    assert.deepEqual(propiosAGuardar({ rol: 'custom', rolTexto: 'Mi papel' }), { rol: 'custom', rolTexto: 'Mi papel' });
    assert.deepEqual(propiosAGuardar({ rol: 'custom', rolTexto: '' }), {}, 'otro sin texto no es papel');
    assert.deepEqual(propiosAGuardar({ rol: 'introduccion', rolTexto: 'sobra' }), { rol: 'introduccion' });
    assert.deepEqual(propiosAGuardar({ rol: 'x"><script>', palabra: 5 }), {});
    assert.deepEqual(propiosAGuardar({ titulo: '', enIndice: true, numerar: true, rol: '', rolTexto: '', palabra: '' }), {}, 'lo de siempre no se guarda');
    const limpio = limpiarContenido({ rol: 'conclusion', palabra: 'Etapa', doc: { type: 'doc', content: [parrafo('a')] } }).contenido;
    assert.equal(limpio.rol, 'conclusion');
    assert.equal(limpio.palabra, 'Etapa');
    assert.ok(!('rolTexto' in limpio));
    assert.deepEqual(propiosDe(limpio), { titulo: '', enIndice: true, numerar: true, rol: 'conclusion', rolTexto: '', palabra: 'Etapa' });
    assert.ok(!('rol' in limpiarContenido({ rol: 'malo', doc: { type: 'doc', content: [] } }).contenido));
    /* Los capitulos para el contenido los traen */
    const [c] = capitulosParaIndice([cap('X', { rol: 'apendice', palabra: 'Etapa' })]);
    assert.deepEqual([c.rol, c.palabra, c.titulo, c.tituloPropio], ['apendice', 'Etapa', 'X', '']);
  });
  await ok('el contenido: con «verRol» el papel va delante, aunque los rotulos esten apagados; las seis plantillas se arman', () => {
    const cs = capitulosParaIndice([cap('Hola', { rol: 'introduccion' }), cap('Uno'), cap('Sin nombre', { rol: 'referencias', titulo: '' })]);
    const sin = I.entradasDe(cs, { subtemas: false });
    assert.ok(sin.every((f) => !f.rotulo), 'apagado por omision: el contenido de siempre');
    const con = I.entradasDe(cs, { subtemas: false, verRol: true });
    assert.deepEqual(con.map((f) => `${f.rotulo || ''}|${f.titulo}`), ['Introducción|Hola', '|Uno', 'Referencias|Sin nombre']);
    assert.ok(!('orden' in con[0]), 'un papel no lleva numero');
    for (const v of I.PLANTILLAS) {
      const [nav] = I.hojasDeIndice(con, {}, [con.length], { plantilla: v, orden: v === 'tabla' || v === 'linea' });
      nav.hijos.forEach(permitido);
      const fila = nav.hijos.find((x) => JSON.stringify(x).includes('Hola'));
      assert.ok(JSON.stringify(fila).includes('indice__rotulo'), `${v}: el papel va en su trozo`);
      assert.ok(JSON.stringify(fila).includes('indice__nombre'), `${v}: y el nombre en el suyo`);
    }
    assert.equal(new ConfigPagina({ indice: { verRol: 'si' } }).indice.verRol, false);
    assert.equal(new ConfigPagina({ indice: { verRol: true } }).indice.verRol, true);
    assert.equal(new ConfigPagina(new ConfigPagina({ indice: { verRol: true } }).aDatos()).indice.verRol, true);
  });
  await ok('encabezado: el texto junta solo las partes encendidas, sin repetir ni pasarse', () => {
    const cs = capitulosParaIndice([cap('Intro', { rol: 'introduccion', titulo: 'Intro' }), cap('El desierto'), cap('', { enIndice: false, titulo: '' }, sub('Quiz'), parrafo('x'))]);
    const ctx = C.contextosDeCabeza(cs, { rotulo: { ver: true } });
    const todo = { rotulo: true, nombre: true, rol: true, subetapa: true };
    assert.equal(C.textoDeCabeza(ctx[1], '', { rotulo: true, nombre: true }), 'Capítulo 1 · El desierto');
    assert.equal(C.textoDeCabeza(ctx[1], 'Actividades', todo), 'Capítulo 1 · El desierto · Actividades');
    /* El rotulo de un papel es su nombre: no se dice dos veces. Y el nombre igual al papel tampoco. */
    assert.equal(C.textoDeCabeza(ctx[0], '', todo), 'Introducción · Intro');
    assert.equal(C.textoDeCabeza({ rotulo: '', nombre: 'Introducción', rol: 'Introducción' }, '', todo), 'Introducción');
    assert.equal(C.textoDeCabeza(ctx[1], 'Actividades', { rotulo: false, nombre: false, rol: false, subetapa: false }), '');
    assert.equal(C.textoDeCabeza(ctx[1], '', { nombre: true, subetapa: true }), 'El desierto');
    /* Sin rotulos en el libro: la parte del rotulo simplemente no esta */
    assert.equal(C.textoDeCabeza(C.contextosDeCabeza(cs, {})[1], '', todo), 'El desierto');
    /* El capitulo oculto y sin nombre hereda nombre, rotulo y papel del de antes (y su ultima subetapa) */
    assert.deepEqual([ctx[2].rotulo, ctx[2].nombre, ctx[2].rol, ctx[2].inicial, ctx[2].final], ['Capítulo 1', 'El desierto', '', '', 'Quiz']);
    assert.equal(C.textoDeCabeza(ctx[2], ctx[2].inicial, todo), 'Capítulo 1 · El desierto');
    /* Pero si tiene nombre, es suyo; y tras la portada no hereda nada */
    const nombrado = C.contextosDeCabeza(capitulosParaIndice([cap('A'), cap('Oculto', { enIndice: false, titulo: 'Oculto' })]), { rotulo: { ver: true } });
    assert.equal(nombrado[1].nombre, 'Oculto');
    /* Un titulo dentro de la cola oculta no le da nombre: sigue siendo el capitulo de antes */
    const conTitulo = C.contextosDeCabeza(capitulosParaIndice([cap('Uno'), cap('Seccion 2', { enIndice: false })]), { rotulo: { ver: true } });
    assert.equal(conTitulo[1].nombre, 'Uno');
    const trasPortada = C.contextosDeCabeza(capitulosParaIndice([cap('Portada'), cap('', { enIndice: false, titulo: '' })]), { rotulo: { ver: true }, portada: true });
    assert.equal(trasPortada[1].nombre, '');
    /* Largo: se corta con puntos suspensivos, sin medio emoji */
    const largo = C.textoDeCabeza({ nombre: 'a'.repeat(200) }, '', { nombre: true });
    assert.equal(largo.length, C.CABEZA_MAX);
    assert.ok(largo.endsWith('…'));
    assert.ok(!/[\uD800-\uDBFF]…$/.test(C.textoDeCabeza({ nombre: `${'a'.repeat(C.CABEZA_MAX - 2)}😀😀` }, '', { nombre: true })));
    /* Las subetapas de un capitulo se leen del JSON y del nodo vivo */
    assert.deepEqual(C.subetapasDe({ type: 'doc', content: [parrafo('a'), sub('Quiz'), sub(' Proyecto  ')] }), ['Quiz', 'Proyecto']);
    assert.deepEqual(C.subetapasDe({ type: 'doc', content: [{ type: 'columnas', content: [sub('Dentro')] }] }), [], 'solo las de arriba');
  });
  await ok('encabezado: el texto va a CSS escapado, sin url( ni @import ni comillas sueltas', () => {
    const feo = 'He said "hi" \\ url(http://x) @import \n y</style>';
    const css = C.cadenaCss(feo);
    assert.ok(css.startsWith('"') && css.endsWith('"'));
    assert.ok(!/url\s*\(|@import/i.test(css), css);
    assert.ok(!css.slice(1, -1).includes('"') || /\\22 /.test(css));
    assert.ok(!/\n/.test(css), 'sin saltos de linea');
    assert.ok(css.includes('\\22 hi\\22 '), css);
    assert.ok(css.includes('\\5c '), 'la barra se escapa');
    assert.equal(C.cadenaCss('Capítulo 2 · Él'), '"Capítulo 2 · Él"');
  });
  await ok('ConfigPagina.cabeza: apagado por omision, topes en sus bordes, y viaja con el libro', () => {
    const c = new ConfigPagina({});
    assert.deepEqual(c.cabeza, { ver: false, partes: { rotulo: true, nombre: true, rol: false, subetapa: false }, distanciaMm: 10, tamanoPt: 9 });
    const raro = new ConfigPagina({ cabeza: { ver: 'si', partes: { rol: 1, nombre: 0 }, distanciaMm: 999, tamanoPt: -3 } }).cabeza;
    assert.deepEqual([raro.ver, raro.partes.rol, raro.partes.nombre, raro.distanciaMm, raro.tamanoPt], [false, false, true, 30, 6]);
    assert.deepEqual([new ConfigPagina({ cabeza: { distanciaMm: 0, tamanoPt: 99 } }).cabeza.distanciaMm, new ConfigPagina({ cabeza: { distanciaMm: 0, tamanoPt: 99 } }).cabeza.tamanoPt], [4, 14]);
    assert.deepEqual([new ConfigPagina({ cabeza: { distanciaMm: 'x', tamanoPt: NaN } }).cabeza.distanciaMm, new ConfigPagina({ cabeza: { distanciaMm: undefined } }).cabeza.tamanoPt], [10, 9]);
    const guardado = new ConfigPagina({ cabeza: { ver: true, partes: { rol: true, subetapa: true, rotulo: false }, distanciaMm: 8.5, tamanoPt: 11 } });
    assert.deepEqual(new ConfigPagina(guardado.aDatos()).cabeza, guardado.cabeza);
    /* El margen de arriba que no alcanza solo se avisa: 10 mm + un renglon de 9 pt no caben en 12 mm */
    assert.equal(new ConfigPagina({ cabeza: { ver: true }, margenes: { sup: 12 } }).cabezaApretada(), true);
    assert.equal(new ConfigPagina({ cabeza: { ver: true }, margenes: { sup: 20 } }).cabezaApretada(), false);
    assert.equal(new ConfigPagina({ cabeza: { ver: false }, margenes: { sup: 1 } }).cabezaApretada(), false);
    assert.equal(new ConfigPagina({ cabeza: { ver: true }, margenes: { sup: 12 } }).margenes.sup, 12, 'los margenes no se tocan solos');
  });
  await ok('subetapa: nombre limpio, nunca dentro de columnas, y sale como franja', () => {
    const t = POR_NODO.get('subetapa');
    assert.equal(t.datos('subetapa', { texto: `  Acti‮vidades ${'x'.repeat(80)}` }).texto.length, 40);
    assert.deepEqual(t.datos('subetapa', { texto: { x: 1 }, onclick: 'x' }), { texto: '' });
    const lim = limpiarContenido(doc(sub('Quiz'), { type: 'columnas', attrs: { anchos: [1, 1] }, content: [{ type: 'columna', content: [sub('Dentro')] }, { type: 'columna', content: [parrafo('b')] }] }));
    assert.equal(lim.contenido.doc.content[0].type, 'subetapa');
    assert.ok(!JSON.stringify(lim.contenido.doc.content[1]).includes('subetapa'), 'dentro de columnas es texto');
    assert.ok(JSON.stringify(lim.contenido.doc.content[1]).includes('Dentro'), 'y no pierde su palabra');
    const [franja] = aNodos(doc(sub('Quiz')), 'pdf');
    assert.deepEqual([franja.tag, franja.clase, franja.hijos], ['div', 'subetapa', [{ texto: 'Quiz' }]]);
    permitido(franja);
    assert.match(cssLibro({}), /\.libro \.subetapa \{/);
    assert.ok(!/url\(|@import/i.test(cssLibro({})));
  });
  await ok('hoja de impresion con encabezado: una pagina con nombre por texto, la subetapa abre hoja, la portada y los libros viejos no cambian', () => {
    const libro = (pagina, ...caps) => aHoja(new Obra({ titulo: 'L', pagina }).aDatos(), caps);
    const caps = [cap('Intro', { rol: 'introduccion' }, parrafo('a'), sub('Actividades'), parrafo('b')), cap('Dos'), cap('', { enIndice: false, titulo: '' })];
    /* Apagado: ni una linea del encabezado en el estilo, ni una parte envuelta; la subetapa solo abre hoja */
    const viejo = libro({ rotulo: { ver: true } }, ...caps);
    assert.ok(!/@top-|cab-|cabeza/.test(viejo.css), 'sin encabezado, el estilo no cambia');
    assert.ok(!JSON.stringify(viejo.nodos).includes('cabeza-parte'));
    assert.match(viejo.css, /\.subetapa \{ break-before: page; \}/);
    /* Encendido */
    const nuevo = libro({ rotulo: { ver: true }, cabeza: { ver: true, partes: { rol: true, subetapa: true } } }, ...caps);
    assert.match(nuevo.css, /@page cab-1 \{ @top-center \{ content: "Introducción · Intro"; font: 9pt\/1\.2 /);
    assert.match(nuevo.css, /content: "Introducción · Intro · Actividades"/);
    assert.match(nuevo.css, /content: "Capítulo 1 · Dos"/);
    assert.match(nuevo.css, /padding-top: 37\.8px/, '10 mm = 37,8 px desde el borde de arriba');
    assert.match(nuevo.css, /\.capitulo\.cabeza-envuelta \{ page: auto; \}/);
    const [lib] = nuevo.nodos;
    assert.deepEqual(lib.hijos.map((s) => s.clase), ['capitulo cabeza-envuelta', 'capitulo cab-3', 'capitulo cab-3']);
    assert.deepEqual(lib.hijos[0].hijos.map((d) => d.clase), ['cabeza-parte cab-1', 'cabeza-parte cab-2']);
    assert.equal(lib.hijos[0].hijos[1].hijos[0].clase, 'subetapa', 'la franja abre su parte');
    lib.hijos.forEach(permitido);
    /* El capitulo oculto y sin nombre dice lo mismo que el de antes: misma pagina con nombre */
    assert.equal(lib.hijos[1].clase, lib.hijos[2].clase);
    /* La portada no lleva encabezado; el papel propio va dentro de la pagina con nombre */
    const pdf = cap('P', {}, { type: 'paginaLibre', attrs: { objetos: [] } });
    const conPortada = libro({ portada: 'si', cabeza: { ver: true } }, pdf, cap('Uno', { papel: '#1E3A5F' }));
    assert.equal(conPortada.nodos[0].hijos[0].clase, 'capitulo capitulo--portada');
    assert.match(conPortada.css, /@page cab-1 \{ background: #1e3a5f; @bottom-left \{ color: #ffffff; \}/);
    assert.match(conPortada.css, /@top-center \{ content: "Uno"; font: 9pt\/1\.2 [^;]+; color: #ffffff;/);
    /* Un nombre con comillas, parentesis y arroba no rompe la hoja ni cuela url( */
    const hostil = libro({ cabeza: { ver: true } }, cap('Ho"la url(x) @import</style>'));
    assert.ok(!/url\s*\(|@import/i.test(hostil.css));
    assert.match(hostil.css, /content: "Ho\\22 la url\\28 x\\29  \\40 import<\/style>"/);
    /* Con imprenta, la sangre empuja el encabezado hacia adentro */
    assert.match(libro({ imprenta: true, cabeza: { ver: true, distanciaMm: 5 } }, cap('X')).css, /padding-top: 30\.9px/);
  });
}

console.log('de que PDF viene una hoja, cambiar el PDF y marcar un tramo');
await ok('paginaDe: el numero guardado, o el del nombre del fondo en los libros viejos', () => {
  const O = 'taller/o1/pdf/';
  assert.equal(paginaDe({ fondo: `${O}p0003-1a2b3c4d5e6f7a8b.webp`, pdf: `${O}original-aa.pdf`, pdfPagina: 7 }), 7, 'manda el numero guardado');
  assert.equal(paginaDe({ fondo: `${O}p0003-1a2b3c4d5e6f7a8b.webp`, pdf: `${O}original-aa.pdf` }), 3, 'viejo: sale del nombre');
  assert.equal(paginaDe({ fondo: `${O}p0012-ff.jpg`, pdf: `${O}original-aa.pdf`, pdfPagina: 0 }), 12);
  assert.equal(paginaDe({ fondo: 'taller/o1/img/abc.webp', pdf: `${O}original-aa.pdf` }), 0, 'una imagen cualquiera no dice pagina');
  assert.equal(paginaDe({ fondo: `${O}p0003-aa.webp`, pdf: '' }), 0, 'sin PDF no es de un PDF');
  assert.equal(paginaDe({ fondo: '', pdf: `${O}original-aa.pdf`, pdfPagina: 4 }), 0, 'sin dibujo tampoco');
  for (const malo of [-1, 0, 1.5, 201, 1e9, '3', null, {}, [3]]) assert.equal(paginaDe({ fondo: `${O}p0005-aa.webp`, pdf: `${O}x.pdf`, pdfPagina: malo }), 5, `pdfPagina ${JSON.stringify(malo)} se ignora`);
  assert.equal(paginaDe(null), 0);
  assert.equal(paginaDe('x'), 0);
  assert.equal(grupoDe({ fondo: `${O}p0001-aa.webp`, pdf: `${O}original-aa.pdf` }), `${O}original-aa.pdf`);
  assert.equal(grupoDe({ fondo: `${O}p0001-aa.webp` }), '');
});
await ok('paginaLibre.datos guarda pdfPagina y sobra limpios', () => {
  const d = (a) => POR_NODO.get('paginaLibre').datos('paginaLibre', a);
  assert.equal(d({ pdfPagina: 4, sobra: true }).pdfPagina, 4);
  assert.equal(d({ pdfPagina: 4, sobra: true }).sobra, true);
  assert.equal(d({ pdfPagina: 4 }).sobra, false);
  assert.equal(d({ pdfPagina: '4', sobra: 'si' }).pdfPagina, 0);
  assert.equal(d({ pdfPagina: '4', sobra: 'si' }).sobra, false);
  assert.equal(d({ pdfPagina: 1e9 }).pdfPagina, 0);
});
await ok('gruposDe junta por PDF, en orden, y deja aparte las que sobran', () => {
  const A = { fondo: 'taller/o/pdf/p0001-aa.webp', pdf: 'taller/o/pdf/original-1.pdf' }, B = { fondo: 'taller/o/pdf/p0001-bb.webp', pdf: 'taller/o/pdf/original-2.pdf' };
  const g = gruposDe([{ clave: 'c1', attrs: A }, { clave: 'c1', attrs: null }, { clave: 'c2', attrs: { ...B, pdfPagina: 9 } }, { clave: 'c2', attrs: { ...A, pdfPagina: 2 } }, { clave: 'c2', attrs: { ...A, sobra: true } }]);
  assert.deepEqual(g.map((x) => [x.pdf.endsWith('1.pdf') ? 1 : 2, x.sobra, x.paginas.length, x.claves.size]), [[1, false, 2, 2], [2, false, 1, 1], [1, true, 1, 1]]);
  assert.deepEqual(g[0].paginas.map((q) => [q.i, q.pagina]), [[0, 1], [3, 2]]);
  assert.deepEqual(gruposDe([]), []);
  assert.deepEqual(gruposDe(null), []);
});
await ok('planCambio: igual, con mas y con menos paginas', () => {
  const viejas = (...n) => n.map((pagina) => ({ pagina }));
  assert.deepEqual(planCambio(viejas(1, 2, 3), 3), { modo: 'numero', asignar: [{ i: 0, n: 1 }, { i: 1, n: 2 }, { i: 2, n: 3 }], sobran: [], nuevas: [] });
  const mas = planCambio(viejas(1, 2, 3), 5);
  assert.deepEqual(mas.asignar.length, 3);
  assert.deepEqual(mas.nuevas, [4, 5]);
  assert.deepEqual(mas.sobran, []);
  const menos = planCambio(viejas(1, 2, 3, 4), 2);
  assert.deepEqual(menos.asignar, [{ i: 0, n: 1 }, { i: 1, n: 2 }]);
  assert.deepEqual(menos.sobran, [2, 3]);
  assert.deepEqual(menos.nuevas, []);
});
await ok('planCambio: una hoja movida sigue siendo su pagina; una borrada se queda borrada', () => {
  /* En el libro van 3, 1, 2: la que esta primera recibe la pagina 3 del PDF nuevo */
  assert.deepEqual(planCambio([{ pagina: 3 }, { pagina: 1 }, { pagina: 2 }], 3).asignar, [{ i: 0, n: 3 }, { i: 1, n: 1 }, { i: 2, n: 2 }]);
  /* Se borro la 2: no vuelve; solo se agregan las que pasan de la ultima que habia */
  const p = planCambio([{ pagina: 1 }, { pagina: 3 }], 4);
  assert.deepEqual(p.asignar, [{ i: 0, n: 1 }, { i: 1, n: 3 }]);
  assert.deepEqual(p.nuevas, [4]);
  /* Con el numero de pagina 5 de un PDF que ahora tiene 3: sobra solo esa */
  const q = planCambio([{ pagina: 1 }, { pagina: 5 }, { pagina: 2 }], 3);
  assert.deepEqual(q.sobran, [1]);
  assert.deepEqual(q.nuevas, []);
});
await ok('planCambio: sin numeros (o repetidos) va por orden; nunca revienta', () => {
  const o = planCambio([{ pagina: 0 }, { pagina: 0 }, { pagina: 0 }], 2);
  assert.equal(o.modo, 'orden');
  assert.deepEqual(o.asignar, [{ i: 0, n: 1 }, { i: 1, n: 2 }]);
  assert.deepEqual(o.sobran, [2]);
  /* Un numero repetido (hoja duplicada) ya no manda al modo por orden: va por numero, las dos con la misma pagina nueva */
  assert.equal(planCambio([{ pagina: 2 }, { pagina: 2 }], 3).modo, 'numero');
  assert.equal(planCambio([{ pagina: 1 }, { pagina: 0 }, { pagina: 3 }], 3).modo, 'orden', 'un numero que falta si manda al modo por orden');
  assert.deepEqual(planCambio([{ pagina: 1 }, { pagina: 2 }], 0), { modo: 'numero', asignar: [], sobran: [0, 1], nuevas: [] });
  assert.deepEqual(planCambio(null, 3).asignar, []);
  assert.deepEqual(planCambio([{ pagina: 1 }], NaN).asignar, []);
});
await ok('planCambio: una hoja duplicada recibe la misma pagina nueva y las demas no se corren', () => {
  /* Libro: p1, p2, p3 y una copia de p2 detras de p2 */
  const d = planCambio([{ pagina: 1 }, { pagina: 2 }, { pagina: 2 }, { pagina: 3 }], 3);
  assert.equal(d.modo, 'numero');
  assert.deepEqual(d.asignar, [{ i: 0, n: 1 }, { i: 1, n: 2 }, { i: 2, n: 2 }, { i: 3, n: 3 }]);
  assert.deepEqual(d.sobran, []);
  assert.deepEqual(d.nuevas, []);
  /* Ademas se borro la p1 */
  const b = planCambio([{ pagina: 2 }, { pagina: 2 }, { pagina: 3 }], 4);
  assert.deepEqual(b.asignar, [{ i: 0, n: 2 }, { i: 1, n: 2 }, { i: 2, n: 3 }]);
  assert.deepEqual(b.nuevas, [4]);
  /* Una copia de la p3 en un PDF que se acorta a 2: las dos copias sobran */
  assert.deepEqual(planCambio([{ pagina: 3 }, { pagina: 3 }, { pagina: 1 }], 2).sobran, [0, 1]);
});
await ok('planCambio: lo que se borro del final del PDF viejo no vuelve (total del PDF viejo)', () => {
  /* El PDF viejo tenia 4; se borro la 4. Un PDF nuevo de 4 paginas no la trae de vuelta */
  const a = planCambio([{ pagina: 1, total: 4 }, { pagina: 2, total: 4 }, { pagina: 3, total: 4 }], 4);
  assert.deepEqual(a.nuevas, []);
  assert.equal(a.asignar.length, 3);
  /* Si el nuevo pasa del total viejo, solo entran las que pasan */
  assert.deepEqual(planCambio([{ pagina: 1, total: 4 }, { pagina: 2, total: 4 }, { pagina: 3, total: 4 }], 6).nuevas, [5, 6]);
  /* Sin total guardado (libros de antes) se sigue por la ultima que se ve */
  assert.deepEqual(planCambio([{ pagina: 1 }, { pagina: 2 }, { pagina: 3 }], 4).nuevas, [4]);
  /* Un total raro se ignora */
  assert.deepEqual(planCambio([{ pagina: 1, total: -3 }, { pagina: 2, total: 'x' }], 3).nuevas, [3]);
});
await ok('pdfTotal: se guarda limpio y gruposDe lo lleva', () => {
  const d = (a) => POR_NODO.get('paginaLibre').datos('paginaLibre', a);
  assert.equal(d({ pdfTotal: 12 }).pdfTotal, 12);
  for (const malo of [0, -1, 1.5, 201, '3', null, {}]) assert.equal(d({ pdfTotal: malo }).pdfTotal, 0);
  const A = { fondo: 'taller/o/pdf/p0001-aa.webp', pdf: 'taller/o/pdf/original-1.pdf', pdfTotal: 7 };
  assert.equal(totalDe(A), 7);
  assert.equal(totalDe({ ...A, pdf: '' }), 0);
  assert.equal(gruposDe([{ clave: 1, attrs: A }])[0].paginas[0].total, 7);
});
await ok('escalaDePagina: una pagina de medida absurda no cuelga la pestaña', async () => {
  const { escalaDePagina, LADO_PX_MAX, AREA_PX_MAX } = await import('../src/scripts/portal/panel/dev/taller/Pdf.js');
  const px = { ancho: 1748, alto: 2480 };                       // A5 a 300 ppp
  /* Una pagina como la del libro: a su escala de siempre */
  assert.ok(Math.abs(escalaDePagina(419.5, 595.3, px) - 4.1667) < 0.01);
  /* 1 x 14400 puntos: el dibujo seria de miles de millones de pixeles */
  assert.equal(escalaDePagina(1, 14400, px), 0);
  assert.equal(escalaDePagina(14400, 1, px), 0);
  /* Un poco mas alta que la primera: se baja la escala, nunca se pasa de los topes */
  const e = escalaDePagina(300, 1400, px);
  assert.ok(e > 0 && 300 * e <= LADO_PX_MAX + 1 && 1400 * e <= LADO_PX_MAX + 1 && 300 * 1400 * e * e <= AREA_PX_MAX * 1.001);
  /* El libro mas grande (420 x 420 mm a 300 ppp) pasa entero */
  const gr = { ancho: 4961, alto: 4961 };
  assert.ok(escalaDePagina(595, 595, gr) > 0);
  for (const malo of [[0, 10], [10, 0], [NaN, 5], [-5, 5], [Infinity, 5]]) assert.equal(escalaDePagina(malo[0], malo[1], px), 0, JSON.stringify(malo));
  assert.equal(escalaDePagina(100, 100, null), 0);
});
const bl = (t) => ({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: t }] });
const pg = (k) => ({ type: 'paginaLibre', attrs: { nombre: `p${k}` } });
await ok('planRango: el tramo, con los renglones vacios pegados', () => {
  const vacio = { type: 'paragraph' };
  assert.deepEqual(planRango([pg(1), pg(2), pg(3)], 0, 2), { desde: 0, hasta: 2, antes: false, despues: false, todo: true });
  assert.deepEqual(planRango([pg(1), pg(2), pg(3)], 1, 1), { desde: 1, hasta: 1, antes: true, despues: true, todo: false });
  /* Un renglon vacio al final o al comienzo cuenta como parte del tramo: no queda una hoja en blanco sola */
  assert.equal(planRango([pg(1), pg(2), vacio], 0, 1).todo, true);
  assert.equal(planRango([vacio, pg(1), pg(2)], 1, 2).todo, true);
  assert.equal(planRango([pg(1), vacio, vacio, pg(2)], 0, 0).hasta, 2, 'toma los vacios pegados, no los que ya van con otra hoja');
  for (const [d, h] of [[-1, 1], [0, 3], [2, 1], [0.5, 1], [NaN, 0]]) assert.equal(planRango([pg(1), pg(2), pg(3)], d, h), null);
  assert.equal(planRango(null, 0, 0), null);
});
await ok('partirEnTres: antes, tramo y despues, y juntos arman el original', () => {
  const doc = { type: 'doc', content: [bl('A'), pg(1), pg(2), pg(3), bl('B'), pg(4)] };
  const t = partirEnTres(doc, 2, 3);
  assert.deepEqual(t.antes.content.map((b) => b.type), ['heading', 'paginaLibre']);
  assert.deepEqual(t.medio.content.map((b) => b.attrs && b.attrs.nombre), ['p2', 'p3']);
  assert.deepEqual(t.despues.content.map((b) => b.type), ['heading', 'paginaLibre']);
  assert.deepEqual([...t.antes.content, ...t.medio.content, ...t.despues.content], doc.content);
  /* Al comienzo: sin parte de antes. Al final: sin parte de despues. */
  const ini = partirEnTres(doc, 0, 1);
  assert.equal(ini.antes, null);
  assert.equal(ini.medio.content.length, 2);
  assert.equal(ini.despues.content.length, 4);
  const fin = partirEnTres(doc, 4, 5);
  assert.equal(fin.despues, null);
  assert.equal(fin.antes.content.length, 4);
  /* Todo el capitulo: nada que partir */
  const todo = partirEnTres(doc, 0, 5);
  assert.equal(todo.plan.todo, true);
  assert.equal(todo.antes, null);
  assert.equal(todo.despues, null);
  assert.equal(partirEnTres({ type: 'doc', content: [] }, 0, 0), null);
  assert.equal(partirEnTres(null, 0, 0), null);
  /* Lo devuelto es una copia: tocarlo no cambia el original */
  t.medio.content[0].attrs.nombre = 'x';
  assert.equal(doc.content[2].attrs.nombre, 'p2');
});

console.log('el lomo, el aviso y la negrita del contenido (ronda 2)');
const { limpiarLomo, estiloDeLomo, LOMO_GROSOR, LOMO_TEXTO_MAX } = await import('../src/scripts/contenido/taller/LomoLibro.js');
const { limpiarAviso, textoDeAviso, colorDeAviso, AVISO_SEGUNDOS, AVISO_TEXTO_MAX } = await import('../src/scripts/contenido/taller/AvisoLibro.js');
const LOMO_VACIO = { texto: '', color: '', tinta: '', grosor: 'auto', tapas: { delante: '', detras: '' } };
await ok('lomo: un libro viejo (sin lomo) queda con lo de siempre, y lo raro tambien', () => {
  assert.deepEqual(new ConfigPagina({}).lomo, LOMO_VACIO);
  for (const raro of [null, 7, 'x', [], [1, 2], { tapas: 5 }, { tapas: [] }, JSON.parse('{"__proto__": {"color": "#ff0000"}}')]) assert.deepEqual(limpiarLomo(raro), LOMO_VACIO, JSON.stringify(raro));
});
await ok('lomo: el texto es corto y limpio; los colores son de colorValido', () => {
  const l = limpiarLomo({ texto: `  Mi\u0007 libro‮ ${'x'.repeat(100)}`, color: '#1F3B2C', tinta: 'rgb(1, 2, 3)', tapas: { delante: 'red', detras: 'url(x)' } });
  assert.ok(l.texto.startsWith('Mi libro') && l.texto.length <= LOMO_TEXTO_MAX && !/[\u0007‮]/.test(l.texto));
  assert.equal(l.color, '#1f3b2c');
  assert.equal(l.tinta, '#010203');
  assert.deepEqual(l.tapas, { delante: '', detras: '' });
  assert.equal(limpiarLomo({ texto: 'a'.repeat(39) + '😀' }).texto, 'a'.repeat(39));      // medio emoji no queda
});
await ok('lomo: el grueso es «auto» o milimetros entre 4 y 40; lo que se pasa se queda en el tope', () => {
  const g = (v) => limpiarLomo({ grosor: v }).grosor;
  assert.equal(g(undefined), 'auto');
  assert.equal(g('12'), 'auto');
  assert.equal(g(NaN), 'auto');
  assert.equal(g(Infinity), 'auto');
  assert.equal(g(null), 'auto');
  assert.equal(g(3), LOMO_GROSOR.min);
  assert.equal(g(-50), LOMO_GROSOR.min);
  assert.equal(g(100), LOMO_GROSOR.max);
  assert.equal(g(12.34), 12.3);
  assert.equal(g(4), 4);
  assert.equal(g(40), 40);
});
await ok('lomo: guarda y vuelve igual, y aDatos entrega copias', () => {
  const dato = { texto: 'Ahavá', color: '#7a1f2b', tinta: '#fbf6e9', grosor: 18.5, tapas: { delante: '#111111', detras: '#222222' } };
  const c = new ConfigPagina({ lomo: dato });
  assert.deepEqual(c.lomo, dato);
  const otra = new ConfigPagina(JSON.parse(JSON.stringify(c.aDatos())));
  assert.deepEqual(otra.lomo, dato);
  c.aDatos().lomo.tapas.delante = '#ffffff';
  c.aDatos().lomo.texto = 'otro';
  assert.equal(c.lomo.tapas.delante, '#111111');
  assert.equal(c.lomo.texto, 'Ahavá');
});
await ok('lomo: sin nada elegido se pinta como siempre; con color, la letra se escoge sola y las tapas lo siguen', () => {
  const e0 = estiloDeLomo(undefined, 'Mi libro', { autoPx: 14 });
  assert.deepEqual(e0, { texto: 'Mi libro', color: '', tinta: '', grosorPx: 14, delante: '', detras: '' });
  const claro = estiloDeLomo({ color: '#fbf6e9' }, '');
  assert.equal(claro.tinta, '#111111');
  assert.equal(claro.delante, '#fbf6e9');
  assert.equal(claro.detras, '#fbf6e9');
  assert.equal(estiloDeLomo({ color: '#1e3a34' }, '').tinta, '#ffffff');
  assert.ok(contraste(claro.tinta, claro.color) >= 4.5);
  /* La letra elegida manda; una tapa elegida manda sobre el lomo */
  const propio = estiloDeLomo({ color: '#fbf6e9', tinta: '#7a1f2b', tapas: { delante: '#000000' } }, '');
  assert.equal(propio.tinta, '#7a1f2b');
  assert.equal(propio.delante, '#000000');
  assert.equal(propio.detras, '#fbf6e9');
});
await ok('lomo: el texto sin escribir es el titulo del libro; el grueso en mm cuenta con el ancho de la pagina', () => {
  assert.equal(estiloDeLomo({}, 'T'.repeat(300)).texto.length, 120);
  assert.equal(estiloDeLomo({ texto: 'Mio' }, 'Otro').texto, 'Mio');
  /* 20 mm a 2 px por mm = 40 px; nunca menos de 6, ni mas de 35 % de la pagina */
  assert.equal(estiloDeLomo({ grosor: 20 }, '', { pxPorMm: 2, ancho: 600 }).grosorPx, 40);
  assert.equal(estiloDeLomo({ grosor: 4 }, '', { pxPorMm: 0.1, ancho: 600 }).grosorPx, 6);
  assert.equal(estiloDeLomo({ grosor: 40 }, '', { pxPorMm: 20, ancho: 300 }).grosorPx, 105);
  assert.equal(estiloDeLomo({}, '', { autoPx: 17, pxPorMm: 20 }).grosorPx, 17);
});
await ok('aviso: sin nada, los textos de siempre; lo raro no pasa', () => {
  const v = limpiarAviso(undefined);
  assert.deepEqual(v, { copiado: '', enlace: '', falla: '', fondo: '', tinta: '', lugar: 'abajo', segundos: AVISO_SEGUNDOS.siNo });
  assert.deepEqual(new ConfigPagina({}).aviso, v);
  for (const raro of [null, 3, 'x', [], { lugar: 'izquierda', segundos: '4', fondo: 'blue', tinta: 5, copiado: 9, enlace: [], falla: {} }]) assert.deepEqual(limpiarAviso(raro), v, JSON.stringify(raro));
  const d = { copiado: 'Copiado' };
  assert.equal(textoDeAviso({}, 'copiado', { copiado: 'Copiado.' }), 'Copiado.');
  assert.equal(textoDeAviso({ copiado: ' Listo ' }, 'copiado', { copiado: 'Copiado.' }), 'Listo');
  assert.equal(textoDeAviso({ copiado: 'x' }, 'otro', d), '');
  assert.equal(textoDeAviso({ enlace: 'x' }, 'constructor', d), '');
});
await ok('aviso: los segundos van de 1,5 a 6; el lugar es arriba o abajo; los textos son cortos y limpios', () => {
  const s = (v) => limpiarAviso({ segundos: v }).segundos;
  assert.equal(s(0.2), AVISO_SEGUNDOS.min);
  assert.equal(s(-3), AVISO_SEGUNDOS.min);
  assert.equal(s(99), AVISO_SEGUNDOS.max);
  assert.equal(s(2.26), 2.3);
  assert.equal(s(NaN), AVISO_SEGUNDOS.siNo);
  assert.equal(s(Infinity), AVISO_SEGUNDOS.siNo);
  assert.equal(s(null), AVISO_SEGUNDOS.siNo);
  assert.equal(limpiarAviso({ lugar: 'arriba' }).lugar, 'arriba');
  assert.equal(limpiarAviso({ lugar: 'abajo' }).lugar, 'abajo');
  assert.equal(limpiarAviso({ lugar: 'ARRIBA' }).lugar, 'abajo');
  const a = limpiarAviso({ copiado: `\u0000Hecho‮ ${'y'.repeat(200)}`, falla: 'a'.repeat(59) + '😀' });
  assert.ok(a.copiado.startsWith('Hecho') && a.copiado.length <= AVISO_TEXTO_MAX && !/[\u0000‮]/.test(a.copiado));
  assert.equal(a.falla, 'a'.repeat(59));
});
await ok('aviso: los colores son de colorValido, la letra se escoge sola sobre el fondo, y vuelve igual', () => {
  assert.deepEqual(colorDeAviso({}), { fondo: '', tinta: '' });
  assert.deepEqual(colorDeAviso({ fondo: '#111111' }), { fondo: '#111111', tinta: '#ffffff' });
  assert.deepEqual(colorDeAviso({ fondo: '#fbf6e9' }), { fondo: '#fbf6e9', tinta: '#111111' });
  assert.deepEqual(colorDeAviso({ fondo: '#fbf6e9', tinta: '#7a1f2b' }), { fondo: '#fbf6e9', tinta: '#7a1f2b' });
  assert.deepEqual(colorDeAviso({ fondo: 'url(x)', tinta: 'red' }), { fondo: '', tinta: '' });
  const dato = { copiado: 'Listo', enlace: 'Abri el enlace', falla: 'No pude', fondo: '#1f3b2c', tinta: '#ffffff', lugar: 'arriba', segundos: 4.5 };
  assert.deepEqual(new ConfigPagina(JSON.parse(JSON.stringify(new ConfigPagina({ aviso: dato }).aDatos()))).aviso, dato);
  const c = new ConfigPagina({ aviso: dato });
  c.aDatos().aviso.copiado = 'otro';
  assert.equal(c.aviso.copiado, 'Listo');
});
await ok('la pagina con lo nuevo cabe en los 8000 bytes de la base, aun con todo al maximo', () => {
  /* jsonb::text escribe «": »y «, »: un espacio de mas por cada dos puntos y cada coma */
  const pg = (v) => {
    if (Array.isArray(v)) return `[${v.map(pg).join(', ')}]`;
    if (v && typeof v === 'object') return `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${pg(x)}`).join(', ')}}`;
    return JSON.stringify(v);
  };
  const letras = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`Fuente numero ${String(i).padStart(2, '0')} con nombre largo`, '#aabbcc']));
  const max = new ConfigPagina({
    letras, colores: Array(12).fill('#aabbcc'), titulos: { t1: '#aabbcc', t2: '#aabbcc', t3: '#aabbcc' }, papel: '#aabbcc',
    lomo: { texto: '漢'.repeat(60), color: '#aabbcc', tinta: '#aabbcc', grosor: 40, tapas: { delante: '#aabbcc', detras: '#aabbcc' } },
    aviso: { copiado: '漢'.repeat(80), enlace: '漢'.repeat(80), falla: '漢'.repeat(80), fondo: '#aabbcc', tinta: '#aabbcc', lugar: 'arriba', segundos: 6 },
    indice: { ver: true, titulo: '漢'.repeat(200), antesDe: 'x'.repeat(40), negrita: { n1: true, n2: true }, imagen: { ruta: '', altoPct: 60 } },
    rotulo: { ver: true, palabra: '漢'.repeat(60) }
  }).aDatos();
  const bytes = Buffer.byteLength(pg(max), 'utf8');
  assert.ok(bytes <= 8000, `la pagina pesa ${bytes} bytes`);
});
await ok('contenido: la negrita de cada nivel vale «apagada» y lo raro tampoco la enciende', () => {
  assert.deepEqual(new ConfigPagina({}).indice.negrita, { n1: false, n2: false });
  assert.deepEqual(new ConfigPagina({ indice: true }).indice.negrita, { n1: false, n2: false });
  for (const raro of [1, 'si', [], {}, null, { n1: 'true', n2: 1 }, { n1: [true] }]) assert.deepEqual(new ConfigPagina({ indice: { ver: true, negrita: raro } }).indice.negrita, { n1: false, n2: false }, JSON.stringify(raro));
  const c = new ConfigPagina({ indice: { ver: true, negrita: { n1: true, n2: false } } });
  assert.deepEqual(c.indice.negrita, { n1: true, n2: false });
  assert.deepEqual(new ConfigPagina(JSON.parse(JSON.stringify(c.aDatos()))).indice.negrita, { n1: true, n2: false });
  c.aDatos().indice.negrita.n2 = true;
  assert.equal(c.indice.negrita.n2, false);
});
await ok('contenido: sin negrita las hojas salen EXACTAMENTE como antes; con ella solo se agregan las dos clases', () => {
  const e = [{ nivel: 1, titulo: 'Uno', ancla: 'cap-1' }, { nivel: 2, titulo: 'Sub', ancla: 'cap-2' }];
  const clases = (o) => I.hojasDeIndice(e, { 'cap-1': 1, 'cap-2': 2 }, [2], o).map((n) => n.clase);
  assert.deepEqual(clases({}), ['indice']);
  assert.deepEqual(clases({ negrita: undefined }), ['indice']);
  assert.deepEqual(clases({ negrita: { n1: false, n2: false } }), ['indice']);
  assert.deepEqual(clases({ plantilla: 'tarjetas' }), ['indice indice--tarjetas']);
  assert.deepEqual(clases({ plantilla: 'tabla', orden: true }), ['indice indice--tabla indice--orden']);
  assert.deepEqual(clases({ negrita: { n1: true } }), ['indice indice--cap-negrita']);
  assert.deepEqual(clases({ negrita: { n2: true } }), ['indice indice--sub-negrita']);
  assert.deepEqual(clases({ plantilla: 'linea', negrita: { n1: true, n2: true } }), ['indice indice--linea indice--cap-negrita indice--sub-negrita']);
  /* Lo raro no enciende nada */
  assert.deepEqual(clases({ negrita: { n1: 'si', n2: 1 } }), ['indice']);
  assert.deepEqual(I.negritaDe('x'), { n1: false, n2: false });
  assert.deepEqual(I.opcionesDeIndice({ plantilla: 'clasico', negrita: { n1: true } }, 'es').negrita, { n1: true, n2: false });
});
await ok('contenido: la negrita se dibuja con CSS del libro (mesa y PDF por igual), solo por nivel, y las filas de antes no pesan', async () => {
  const css = cssLibro(new ConfigPagina({}));
  assert.ok(/\.libro \.indice--cap-negrita \.indice__fila--1, \.libro \.indice--sub-negrita \.indice__fila--2 \{ font-weight: 700; \}/.test(css));
  /* Lo que hoy pesa es solo el numero de la tabla: ninguna otra regla de filas pone peso */
  const filas = css.split('\n').filter((l) => /\.indice__fila/.test(l) && /font-weight/.test(l));
  assert.equal(filas.length, 1);
  assert.ok(!/url\(/.test(css));
});
await ok('la hoja de impresion con negrita lleva la clase en el nav del contenido, y sin ella no', () => {
  const caps = [{ id: 'c1', titulo: 'Uno', contenido: { doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }] } } }, { id: 'c2', titulo: 'Dos', contenido: { doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }] } } }];
  const html = (negrita) => JSON.stringify(aHoja({ id: 'o', titulo: 'T', idioma: 'es', pagina: { indice: { ver: true, negrita } } }, caps, { indice: { numeros: { 'cap-1': 1, 'cap-2': 2 }, reparto: [2] } }).nodos);
  assert.ok(!html({ n1: false, n2: false }).includes('negrita'));
  assert.ok(html({ n1: true, n2: false }).includes('indice--cap-negrita'));
  assert.ok(!html({ n1: true, n2: false }).includes('indice--sub-negrita'));
});

console.log('el viaje de «Ver como libro»');
await ok('viaje: sin paginas, con una, o ya ahi, no hay nada que pasar', async () => {
  const { planDeViaje } = await import('../src/scripts/portal/panel/dev/taller/pliegos.js');
  const nada = { dir: 0, distancia: 0, salto: null, pasos: [] };
  assert.deepEqual(planDeViaje(0, 5, 0), nada);
  assert.deepEqual(planDeViaje(0, 0, 1), nada);
  assert.deepEqual(planDeViaje(0, 9, 1), nada);
  assert.deepEqual(planDeViaje(3, 3, 40), nada);
  assert.deepEqual(planDeViaje(2, 1, 40), nada);          // la 2 es del pliego de la 1 (1 y 2)
  assert.deepEqual(planDeViaje(NaN, NaN, 5), nada);
  assert.deepEqual(planDeViaje(1, 2, -4), nada);
});
await ok('viaje: libros de 2 y de 3 paginas', async () => {
  const { planDeViaje } = await import('../src/scripts/portal/panel/dev/taller/pliegos.js');
  /* 2 paginas: [0] y [1] */
  assert.deepEqual(planDeViaje(0, 1, 2), { dir: 1, distancia: 1, salto: null, pasos: [1] });
  assert.deepEqual(planDeViaje(1, 0, 2), { dir: -1, distancia: 1, salto: null, pasos: [0] });
  /* 3 paginas: [0] y [1,2] */
  assert.deepEqual(planDeViaje(0, 2, 3), { dir: 1, distancia: 1, salto: null, pasos: [1] });
  assert.deepEqual(planDeViaje(1, 0, 3), { dir: -1, distancia: 1, salto: null, pasos: [0] });
  assert.deepEqual(planDeViaje(2, 0, 3), { dir: -1, distancia: 1, salto: null, pasos: [0] });
});
await ok('viaje: cerca, todas las hojas giran; lejos, se salta hasta diez antes y giran las ultimas diez', async () => {
  const { planDeViaje, pliegoDe, paginasDe } = await import('../src/scripts/portal/panel/dev/taller/pliegos.js');
  /* 40 paginas: [0] [1,2] [3,4] … [37,38] [39] */
  const cerca = planDeViaje(0, 7, 40);
  assert.deepEqual(cerca, { dir: 1, distancia: 4, salto: null, pasos: [1, 3, 5, 7] });
  const lejos = planDeViaje(0, 39, 40);
  assert.equal(lejos.distancia, 20);
  assert.equal(lejos.dir, 1);
  assert.equal(lejos.pasos.length, 10);
  assert.equal(lejos.pasos[9], 39);
  assert.equal(lejos.salto, 19);
  assert.deepEqual(lejos.pasos, [21, 23, 25, 27, 29, 31, 33, 35, 37, 39]);
  /* Hacia atras */
  const atras = planDeViaje(39, 0, 40);
  assert.equal(atras.dir, -1);
  assert.deepEqual(atras.pasos, [17, 15, 13, 11, 9, 7, 5, 3, 1, 0]);
  assert.equal(atras.salto, 19);
  /* Exactamente el tope: gira todo; uno mas: salta uno */
  assert.equal(planDeViaje(0, 19, 40).salto, null);
  assert.equal(planDeViaje(0, 19, 40).pasos.length, 10);
  assert.equal(planDeViaje(0, 21, 40).salto, 1);
  assert.equal(planDeViaje(0, 21, 40).pasos.length, 10);
  /* Cada paso es el pliego vecino del anterior, y el salto el vecino de lo que no se gira */
  for (const [d, h, n] of [[0, 300, 301], [250, 3, 301], [1, 100, 101], [5, 6, 7]]) {
    const p = planDeViaje(d, h, n);
    let k = p.salto != null ? p.salto : pliegoDe(d, n);
    for (const x of p.pasos) { assert.ok(Math.abs(x - k) >= 1 && Math.abs(x - k) <= 2, `${d}→${h}: ${k}→${x}`); k = x; }
    assert.equal(k, pliegoDe(h, n));
    assert.ok(paginasDe(k, n).includes(Math.min(h, n - 1)) || h >= n);
  }
});
await ok('viaje: un destino fuera del libro cae en el borde, y el tope siempre es al menos uno', async () => {
  const { planDeViaje } = await import('../src/scripts/portal/panel/dev/taller/pliegos.js');
  assert.deepEqual(planDeViaje(0, 999, 6).pasos, [1, 3, 5]);
  assert.equal(planDeViaje(5, -40, 6).pasos.at(-1), 0);
  /* movimiento reducido: una sola hoja, despues de saltar a su vecino */
  const uno = planDeViaje(0, 39, 40, { tope: 1 });
  assert.deepEqual(uno.pasos, [39]);
  assert.equal(uno.salto, 37);
  assert.deepEqual(planDeViaje(0, 1, 40, { tope: 1 }), { dir: 1, distancia: 1, salto: null, pasos: [1] });
  for (const tope of [0, -3, NaN, 0.4, undefined]) assert.ok(planDeViaje(0, 39, 40, { tope }).pasos.length >= 1, String(tope));
  assert.equal(planDeViaje(0, 39, 40, { tope: 0 }).pasos.length, 1);
  assert.equal(planDeViaje(0, 39, 40, { tope: 3 }).pasos.length, 3);
  assert.equal(planDeViaje(0, 39, 40, { tope: Infinity }).pasos.length, 10);
});

console.log('la puerta de los bloques');
await ok('un tipo sin pruebas para la compilacion', async () => {
  const { TIPOS } = await import('../src/scripts/contenido/taller/tipos/indice.js');
  await assert.rejects(revisarTiposTaller(undefined, { CASOS: { ...CASOS, cita: undefined } }, { TIPOS }), /faltan sus pruebas/);
});

console.log(`\n${bien} bien, ${mal} mal`);
if (mal) process.exit(1);
