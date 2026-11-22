/* PRUEBAS DE LAS NOTAS DEL TALLER (paso 7) Y DEL ASPECTO DE LOS BOTONES (paso 5b, lado del Taller). Sin dependencias:

     node tools/test-marcas-notas.mjs

   Prueban: las marcas `definicion` y `citaBiblica` al guardar (marcas.js, con la regla del lector: limpiarNota), su salida en
   el PDF (TextoLibro → enlace /nota/#n=… que vuelve a ser la misma nota), lo que arma la hoja (armar.js rechaza enlaces
   falsos), «Marcar 2 citas» (notasLibro.js), el aviso de notas que faltan (RevisarPdf.js), el aspecto de los botones y la
   pagina /ir/ (lector/botonEnPdf.js), y que los enlaces viejos de copiar sigan valiendo. Se para con codigo 1 si algo falla. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

const N = await cargar('src/scripts/lector/notaEnPdf.js');
const NL = await cargar('src/scripts/contenido/taller/notasLibro.js');
const { limpiarMarcas } = await cargar('src/scripts/contenido/taller/marcas.js');
const { limpiarContenido, aNodos } = await cargar('src/scripts/contenido/taller/TextoLibro.js');
const { valorSeguro, hrefDeHoja } = await cargar('src/scripts/contenido/taller/armar.js');
const { aHoja } = await cargar('src/scripts/contenido/taller/hoja.js');
const { revisarPdf, notasDelPdf } = await cargar('src/scripts/contenido/taller/RevisarPdf.js');
const PE = await cargar('src/scripts/contenido/taller/PaginasEdicion.js');
const B = await cargar('src/scripts/lector/botonEnPdf.js');
const C = await cargar('src/scripts/lector/copiaEnPdf.js');
const BT = await cargar('src/scripts/contenido/taller/tipos/boton.js');
const A = await cargar('src/scripts/contenido/taller/aspectoBoton.js');
const { POR_NODO } = await cargar('src/scripts/contenido/taller/tipos/indice.js');
const { RUTAS_RESERVADAS } = await cargar('src/scripts/biblioteca.js');

let n = 0, mal = 0;
const ok = async (nombre, fn) => {
  try { await fn(); n++; console.log('  ok  ' + nombre); } catch (e) { mal++; console.log(' MAL  ' + nombre + '\n      ' + String(e && e.message).split('\n')[0]); }
};

const DEF = { t: 'Ahavá', d: 'Amor que decide.\nNo un sentimiento.', r: { a: 'Brown, F.', y: '1906', ti: 'A Hebrew and English lexicon', f: 'Clarendon Press', u: 'https://example.com/lexico' }, ft: 'estonia', fd: 'lora' };
const marcaDef = (attrs = DEF) => ({ type: 'definicion', attrs });
const marcaCita = (attrs = { r: 'JER.1.4-5', x: 'Jeremías 1:4-5', rv: 'NVI' }) => ({ type: 'citaBiblica', attrs });
const texto = (t, marks) => ({ type: 'text', text: t, ...(marks ? { marks } : {}) });
const parrafo = (...hijos) => ({ type: 'paragraph', attrs: { capital: false, alinear: '' }, content: hijos });
const doc = (...bloques) => ({ doc: { type: 'doc', content: bloques } });
const buscar = (nodos, f) => {
  const pila = [...nodos];
  while (pila.length) { const x = pila.shift(); if (!x) continue; if (f(x)) return x; pila.push(...(x.hijos || [])); }
  return null;
};
const todos = (nodos, f) => {
  const salida = [], pila = [...nodos];
  while (pila.length) { const x = pila.shift(); if (!x) continue; if (f(x)) salida.push(x); pila.push(...(x.hijos || [])); }
  return salida;
};

console.log('las marcas al guardar');
await ok('una definicion buena se guarda tal cual (objeto comun, sin `v`, `k` ni `l`)', () => {
  const [m] = limpiarMarcas([marcaDef()]);
  assert.deepEqual(m, { type: 'definicion', attrs: { ...DEF, r: { ...DEF.r } } });
  assert.equal(Object.getPrototypeOf(m.attrs), Object.prototype);
  assert.equal(JSON.stringify(m).includes('"v"'), false);
  const [c] = limpiarMarcas([marcaCita()]);
  assert.deepEqual(c, { type: 'citaBiblica', attrs: { r: 'JER.1.4-5', x: 'Jeremías 1:4-5', rv: 'NVI' } });
});
await ok('lo hostil: sin palabra, cita inventada, version rara, letra fuera de la lista, enlace no https, campos extra', () => {
  assert.deepEqual(limpiarMarcas([marcaDef({ t: '   ', d: 'x' })]), []);
  assert.deepEqual(limpiarMarcas([marcaCita({ r: 'JHN.99.1' })]), []);
  assert.deepEqual(limpiarMarcas([marcaCita({ r: 'Juan 3:16' })]), [], 'solo la forma canonica');
  const [c] = limpiarMarcas([marcaCita({ r: 'JHN.3.16', rv: 'NVI"><script>' })]);
  assert.deepEqual(c.attrs, { r: 'JHN.3.16' });
  const [d] = limpiarMarcas([marcaDef({ t: 'x', ft: 'Comic Sans', fd: 'lora; color:red', r: { u: 'javascript:alert(1)', a: 'Yo' }, malo: 1, __proto__: { t: 'y' } })]);
  assert.deepEqual(d.attrs, { t: 'x', r: { a: 'Yo' } });
  assert.deepEqual(limpiarMarcas([marcaDef({ t: 'x', r: { u: 'https://u:p@a.co' } })])[0].attrs, { t: 'x' });
  assert.deepEqual(limpiarMarcas([{ type: 'definicion', attrs: 'texto' }, { type: 'definicion' }, null, 5]), []);
  const p = JSON.parse('{"type":"definicion","attrs":{"t":"a","__proto__":{"d":"contaminado"}}}');
  assert.deepEqual(limpiarMarcas([p])[0].attrs, { t: 'a' });
});
await ok('los topes: palabra 80, descripcion 1200, partes 200, referencia escrita 400 (contados en letras)', () => {
  const [d] = limpiarMarcas([marcaDef({ t: 'a'.repeat(300), d: '😀'.repeat(2000), r: { a: 'b'.repeat(500) } })]);
  assert.equal(Array.from(d.attrs.t).length, 80);
  assert.equal(Array.from(d.attrs.d).length, 1200);
  assert.equal(d.attrs.r.a.length, 200);
  const [e] = limpiarMarcas([marcaDef({ t: 'x', rf: 'c'.repeat(900) })]);
  assert.equal(e.attrs.rf.length, 400);
});
await ok('una nota por trozo y nunca junto a un enlace (el PDF no lleva un enlace dentro de otro)', () => {
  const l = { type: 'link', attrs: { href: 'https://a.co' } };
  assert.deepEqual(limpiarMarcas([marcaDef(), l]).map((m) => m.type), ['definicion']);
  assert.deepEqual(limpiarMarcas([l, marcaCita()]).map((m) => m.type), ['link']);
  assert.deepEqual(limpiarMarcas([marcaCita(), marcaDef()]).map((m) => m.type), ['citaBiblica']);
  assert.deepEqual(limpiarMarcas([{ type: 'bold' }, marcaDef()]).map((m) => m.type), ['bold', 'definicion']);
});
await ok('una nota mala no se guarda pero la palabra si, y se cuenta para avisar', () => {
  const r = limpiarContenido(doc(parrafo(texto('Ahavá', [marcaCita({ r: 'XXX.1' })]))));
  assert.equal(r.descartados, 1);
  assert.deepEqual(r.contenido.doc.content[0].content, [{ type: 'text', text: 'Ahavá' }]);
  const b = limpiarContenido(doc(parrafo(texto('Ahavá', [marcaDef()]))));
  assert.equal(b.descartados, 0);
});
await ok('lo pegado: los datos de un <span data-nota> pasan por la misma regla (marcaLimpia)', () => {
  /* nodos/notas.js lee `data-nota` con JSON.parse y lo pasa por marcaLimpia; esto es lo mismo sin navegador */
  const pegado = JSON.parse('{"type":"definicion","attrs":{"t":"<img src=x onerror=alert(1)>","d":"ok","ft":"x\\");}","r":{"u":"javascript:x"}}}');
  const m = NL.marcaLimpia(pegado);
  assert.deepEqual(m, { type: 'definicion', attrs: { t: '<img src=x onerror=alert(1)>', d: 'ok' } }, 'el texto queda como TEXTO (se pinta con textContent)');
  assert.equal(NL.marcaLimpia({ type: 'citaBiblica', attrs: { r: 'JHN.3.16', x: 'a'.repeat(500) } }).attrs.x.length, 120);
  assert.equal(NL.marcaLimpia({ type: 'otra', attrs: {} }), null);
});

console.log('\nen el PDF');
await ok('la palabra con nota sale como <a class="nota nota--def"> y su enlace vuelve a ser la misma nota (con el idioma)', () => {
  const nodos = aNodos(doc(parrafo(texto('El '), texto('Ahavá', [{ type: 'bold' }, marcaDef()]), texto(' y '), texto('Jeremías 1:4-5', [marcaCita()]))), 'pdf', { idioma: 'es' });
  const a = buscar(nodos, (x) => x.tag === 'a' && /nota--def/.test(x.clase));
  assert.equal(a.clase, 'nota nota--def');
  const nota = N.notaDeEnlace(a.attrs.href);
  assert.deepEqual({ ...nota, r: { ...nota.r } }, { v: 1, k: 'd', ...DEF, r: { ...DEF.r }, l: 'es' });
  const c = buscar(nodos, (x) => x.tag === 'a' && /nota--cita/.test(x.clase));
  assert.deepEqual({ ...N.notaDeEnlace(c.attrs.href) }, { v: 1, k: 'c', r: 'JER.1.4-5', x: 'Jeremías 1:4-5', rv: 'NVI', l: 'es' });
  /* la negrita va por fuera o por dentro, pero la palabra sigue ahi */
  assert.ok(buscar([a], (x) => x.texto === 'Ahavá'));
  const en = buscar(aNodos(doc(parrafo(texto('Love', [marcaDef({ t: 'Love' })]))), 'pdf', { idioma: 'en' }), (x) => x.tag === 'a');
  assert.equal(N.notaDeEnlace(en.attrs.href).l, 'en');
});
await ok('en titulos, listas y citas tambien (son parrafos o titulos por dentro)', () => {
  const t = { type: 'heading', attrs: { level: 2, alinear: '', id: '' }, content: [texto('Juan 3:16', [marcaCita({ r: 'JHN.3.16' })])] };
  const lista = { type: 'bulletList', content: [{ type: 'listItem', content: [parrafo(texto('x', [marcaDef({ t: 'x' })]))] }] };
  const cita = { type: 'blockquote', content: [parrafo(texto('y', [marcaDef({ t: 'y' })]))] };
  const nodos = aNodos(doc(t, lista, cita), 'pdf', { idioma: 'es' });
  assert.equal(todos(nodos, (x) => x.tag === 'a' && /^nota/.test(x.clase)).length, 3);
});
await ok('una nota que no cabe en 8000 letras deja la palabra sola (sin enlace roto)', () => {
  const grande = marcaDef({ t: 'x', d: '😀'.repeat(1200), r: { a: '😀'.repeat(200), ti: '😀'.repeat(200), f: '😀'.repeat(200) } });
  assert.equal(NL.enlaceDeMarca(grande, 'es'), null);
  const nodos = aNodos(doc(parrafo(texto('x', [grande]))), 'pdf', { idioma: 'es' });
  assert.equal(buscar(nodos, (x) => x.tag === 'a'), null);
  assert.ok(buscar(nodos, (x) => x.texto === 'x'));
  /* y no se pierde en silencio: al limpiar se quita y se cuenta para avisar */
  const r = limpiarContenido(doc(parrafo(texto('x', [grande]))));
  assert.equal(r.descartados, 1);
  assert.deepEqual(r.contenido.doc.content[0].content, [{ type: 'text', text: 'x' }]);
});
await ok('armar.js: acepta la nota de verdad y rechaza la falsa, la rota y la larga', () => {
  const bueno = N.enlaceDeNota({ v: 1, k: 'c', r: 'PSA.139' });
  assert.ok(valorSeguro('a', 'href', bueno));
  for (const falso of ['https://juanjolopezramirez.com/nota/#n=basura!', 'https://juanjolopezramirez.com/nota/#n=' + Buffer.from('{"v":1,"k":"c","r":"XXX.1"}').toString('base64url'),
    'https://juanjolopezramirez.com/nota/#n=' + 'A'.repeat(9000), 'https://juanjolopezramirez.com/nota/']) assert.equal(valorSeguro('a', 'href', falso), false, falso.slice(0, 60));
  assert.ok(valorSeguro('a', 'href', 'https://fraterni.co/x'), 'un enlace normal sigue');
  assert.equal(valorSeguro('span', 'href', bueno), false, 'solo en <a>');
});
await ok('la hoja entera (aHoja): las notas llevan el idioma del libro y el boton «Duolingo» va por /ir/ con su aspecto', () => {
  const capitulo = { contenido: doc(
    parrafo(texto('Ahavá', [marcaDef()]), texto(' — '), texto('Salmo 139', [marcaCita({ r: 'PSA.139', x: 'Salmo 139' })])),
    { type: 'boton', attrs: { texto: 'Ver', accion: 'enlace', enlace: 'https://fraterni.co/x', fondo: '#58cc02', aspecto: A.conEstilo(null, 'duolingo') } },
    { type: 'boton', attrs: { texto: 'Copiar', accion: 'copiar', copia: 'Hola mundo' } },
    { type: 'boton', attrs: { texto: 'Abrir', accion: 'enlace', enlace: 'https://fraterni.co/y' } }
  ) };
  const h = aHoja({ titulo: 'Libro', idioma: 'en', pagina: {}, fuentes: [] }, [capitulo]);
  const notas = todos(h.nodos, (x) => x.tag === 'a' && /^nota/.test(x.clase));
  assert.equal(notas.length, 2);
  assert.ok(notas.every((a) => N.notaDeEnlace(a.attrs.href).l === 'en'));
  const enlaces = todos(h.nodos, (x) => x.tag === 'a' && /boton/.test(x.clase)).map((x) => x.attrs.href);
  const ir = B.irDeEnlace(enlaces[0]);
  assert.ok(ir, enlaces[0]);
  assert.equal(ir.url, 'https://fraterni.co/x');
  assert.equal(ir.aspecto.e, 'duolingo');
  assert.equal(ir.aspecto.f, '#58cc02');
  assert.ok(ir.aspecto.s && ir.aspecto.lh > 0 && ir.aspecto.fs > 0 && ir.aspecto.fs < 0.05, JSON.stringify(ir.aspecto));
  const copia = B.copiaDeEnlace(enlaces[1]);
  assert.equal(copia.texto, 'Hola mundo');
  assert.equal(copia.aspecto.k, 'Copied', 'el «Copiado» en el idioma del libro');
  assert.equal(copia.aspecto.x, 'Copiar');
  assert.equal(enlaces[2], 'https://fraterni.co/y', 'un boton que no es «Duolingo» va directo, como siempre');
  for (const href of enlaces) assert.ok(hrefDeHoja(href), href);
  assert.ok(h.css.includes('.libro .nota { color: inherit; text-decoration: underline dotted 1px;'));
});
await ok('fuera de la hoja (la mesa, las pruebas viejas) el boton sale como siempre', () => {
  const b = POR_NODO.get('boton').pdf({ attrs: BT.datos('boton', { accion: 'copiar', copia: 'Hola', texto: 'Copiar' }) });
  assert.equal(b.attrs.href, 'https://juanjolopezramirez.com/copiar/#t=Hola');
});

console.log('\nlas citas elegidas');
await ok('«Jeremías 1:4-5 y el Salmo 139» → dos tramos exactos («Marcar 2 citas»)', () => {
  const frase = 'Lee Jeremías 1:4-5 y el Salmo 139 hoy.';
  const { texto: t, mapa } = NL.textoConMapa([{ texto: frase, pos: 10 }]);
  const c = NL.citasDeSeleccion(t, mapa, 'es');
  assert.deepEqual(c.map((x) => [x.r, x.x, x.desde, x.hasta]), [['JER.1.4-5', 'Jeremías 1:4-5', 14, 28], ['PSA.139', 'Salmo 139', 34, 43]]);
  assert.equal(frase.slice(c[0].desde - 10, c[0].hasta - 10), 'Jeremías 1:4-5');
  assert.equal(frase.slice(c[1].desde - 10, c[1].hasta - 10), 'Salmo 139');
});
await ok('trozos con negrita en medio, y un corte de bloque: una cita partida en dos bloques se salta', () => {
  /* «(Juan 13:3)» con «Juan» en negrita: dos trozos de texto seguidos en el documento */
  const a = NL.textoConMapa([{ texto: '(Juan', pos: 5 }, { texto: ' 13:3)', pos: 10 }]);
  assert.deepEqual(NL.citasDeSeleccion(a.texto, a.mapa, 'es').map((x) => [x.r, x.desde, x.hasta]), [['JHN.13.3', 6, 15]]);
  const b = NL.textoConMapa([{ texto: 'Lucas', pos: 1 }, { corte: true }, { texto: '15:11-32', pos: 9 }]);
  assert.deepEqual(NL.citasDeSeleccion(b.texto, b.mapa, 'es'), []);
  /* trozos que no van seguidos (algo que no es texto en medio) */
  const c = NL.textoConMapa([{ texto: 'Juan ', pos: 1 }, { texto: '3:16', pos: 20 }]);
  assert.deepEqual(NL.citasDeSeleccion(c.texto, c.mapa, 'es'), []);
});
await ok('una referencia escrita a mano: una sola, en el idioma del libro', () => {
  assert.deepEqual(NL.citaEscrita('Jer 1:4-5', 'es'), { r: 'JER.1.4-5', nombre: 'Jeremías 1:4-5' });
  assert.deepEqual(NL.citaEscrita('John 3:16', 'en'), { r: 'JHN.3.16', nombre: 'John 3:16' });
  assert.equal(NL.citaEscrita('Juan 3:16 y 1 Juan 4:8', 'es'), null);
  assert.equal(NL.citaEscrita('nada', 'es'), null);
});
await ok('el libro recuerda su version (la mas usada) y cuenta sus notas distintas', () => {
  const caps = [doc(parrafo(texto('a', [marcaCita({ r: 'JHN.3.16', rv: 'NVI' })]), texto('b', [marcaCita({ r: 'JHN.3.17', rv: 'NTV' })]))),
    doc(parrafo(texto('c', [marcaCita({ r: 'JHN.3.18', rv: 'NVI' })]), texto('d', [marcaDef({ t: 'd' })]), texto('e', [marcaDef({ t: 'd' })])))];
  assert.equal(NL.versionDelLibro(caps), 'NVI');
  assert.equal(NL.versionDelLibro([]), '');
  assert.equal(NL.hrefsDeNotas(caps, 'es').size, 4, 'la misma definicion dos veces es un solo enlace');
  /* empate: gana la de la cita que va mas adelante en el libro (capitulo 2 despues del 1; dentro, de arriba abajo) */
  const cita = (r, rv) => texto('x', [marcaCita({ r, rv })]);
  assert.equal(NL.versionDelLibro([doc(parrafo(cita('JHN.3.16', 'NVI'))), doc(parrafo(cita('JHN.3.17', 'NTV')))]), 'NTV');
  assert.equal(NL.versionDelLibro([doc(parrafo(cita('JHN.3.17', 'NTV'))), doc(parrafo(cita('JHN.3.16', 'NVI')))]), 'NVI');
  assert.equal(NL.versionDelLibro([doc(parrafo(cita('JHN.3.16', 'NVI'), cita('JHN.3.17', 'NTV')), parrafo(cita('JHN.3.18', 'LBLA')))]), 'LBLA');
  assert.equal(NL.versionDelLibro([doc(parrafo(cita('JHN.3.16', 'NVI'), cita('JHN.3.17', 'NTV'), cita('JHN.3.18', 'NVI')))]), 'NVI', 'mas usada antes que ultima');
});
await ok('nombres de tipo raros no son notas (hasOwn) y una seleccion enorme no se lee', () => {
  for (const t of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) assert.equal(NL.notaDeMarca({ type: t, attrs: { r: 'JHN.3.16', t: 'x' } }), null, t);
  const grande = 'Juan 3:16 '.repeat(6000);
  const { texto: t, mapa } = NL.textoConMapa([{ texto: grande, pos: 1 }]);
  assert.ok(t.length > NL.SELECCION_MAX);
  assert.deepEqual(NL.citasDeSeleccion(t, mapa, 'es'), []);
  assert.equal(NL.citasDeSeleccion('Juan 3:16', 'no', 'es').length, 0);
});

console.log('\nrevisar el PDF que vuelve');
await ok('si el PDF trae menos notas que el libro, se avisa (no se frena)', () => {
  const h1 = N.enlaceDeNota({ v: 1, k: 'c', r: 'PSA.139', l: 'es' }), h2 = N.enlaceDeNota({ v: 1, k: 'd', t: 'x', l: 'es' });
  const datos = [{ enlaces: [{ href: h1 }, { href: h1 }] }, { enlaces: [{ href: h2 }, { href: 'https://a.co' }, { href: 'https://juanjolopezramirez.com/nota/#n=xx' }, { pagina: 2 }] }, null];
  assert.equal(notasDelPdf(datos), 2);
  const base = { paginas: 3, ratioPdf: 1, ratioLibro: 1, titulo: 'a', tituloPdf: 'a' };
  assert.deepEqual(revisarPdf({ ...base, notasLibro: 3, notasPdf: 2 }).avisos, [{ clave: 'edNotas', pdf: 2, libro: 3 }]);
  assert.deepEqual(revisarPdf({ ...base, notasLibro: 2, notasPdf: 2 }).avisos, []);
  assert.deepEqual(revisarPdf(base).avisos, [], 'sin cuentas no dice nada');
  assert.deepEqual(revisarPdf({ ...base, notasLibro: 3, notasPdf: 0 }).errores, []);
});

console.log('\nel aspecto de un boton');
const LOOK = { e: 'duolingo', f: '#58cc02', c: '#ffffff', s: '#46a302', lh: 0.0045, rr: 0.0095, n: 1, x: 'Copiar prompt', i: 'copiar', l: 'izq', fu: 'Young Serif', fs: 0.0135, pf: '#fbf8f1', k: 'Copiado' };
await ok('ida y vuelta: el mismo aspecto, siempre el mismo codigo', () => {
  const cod = B.codigoDeAspecto(LOOK);
  assert.ok(/^[A-Za-z0-9_-]+$/.test(cod));
  assert.equal(cod, B.codigoDeAspecto({ ...LOOK }));
  assert.deepEqual({ ...B.aspectoDeCodigo(cod) }, LOOK);
});
await ok('lo hostil se tira: colores raros, numeros fuera de tope, letras con CSS, textos invisibles, campos extra', () => {
  const a = B.limpiarAspectoBoton({ e: 'otro', f: 'red', c: '#12345', s: '#ABCDEF', lh: 9, rr: -1, fs: Infinity, n: 'si', x: 'a‮b​c', i: '../x', l: 'arriba', fu: 'Arial"; }', pf: 'url(x)', k: 'k'.repeat(99), o: 5, malo: 1 });
  assert.deepEqual({ ...a }, { e: 'base', s: '#abcdef', x: 'abc', k: 'k'.repeat(40) });
  assert.equal(B.limpiarAspectoBoton('x'), null);
  assert.equal(B.aspectoDeCodigo('no es base64!'), null);
  assert.equal(B.aspectoDeCodigo(Buffer.from('[1,2]').toString('base64url')), null);
  assert.equal(B.aspectoDeCodigo('A'.repeat(B.ASPECTO_MAX + 4)), null);
});
await ok('copiar con aspecto: el texto y el aspecto vuelven; el enlace viejo sigue valiendo en todas partes', () => {
  const href = B.enlaceDeCopiaConAspecto('Hola & chao #1', LOOK);
  assert.ok(href.startsWith('https://juanjolopezramirez.com/copiar/#t=') && href.includes('&b='));
  const c = B.copiaDeEnlace(href);
  assert.equal(c.texto, 'Hola & chao #1');
  assert.equal(c.aspecto.e, 'duolingo');
  const viejo = C.enlaceDeCopia('Hola');
  assert.deepEqual(B.copiaDeEnlace(viejo), { texto: 'Hola', aspecto: null });
  for (const h of [href, viejo]) {
    assert.ok(hrefDeHoja(h), h);
    assert.ok(PE.enlaceDePagina({ rect: [1, 1, 20, 10], href: h }, 100, 200, 1), h);
  }
  assert.equal(B.enlaceDeCopiaConAspecto('Hola', null), viejo);
  assert.equal(B.enlaceDeCopiaConAspecto('   ', LOOK), null);
});
await ok('copiar falso: dos «&b=», un aspecto roto o texto sin codificar se rechazan', () => {
  const href = B.enlaceDeCopiaConAspecto('Hola', LOOK);
  for (const malo of [href + '&b=x', href.replace(/&b=.*/, '&b=@@@'), 'https://juanjolopezramirez.com/copiar/#t=a b&b=' + B.codigoDeAspecto(LOOK), 'https://juanjolopezramirez.com/copiar/#t=&b=' + B.codigoDeAspecto(LOOK)]) {
    assert.equal(B.copiaDeEnlace(malo), null, malo.slice(0, 80));
    assert.equal(hrefDeHoja(malo), false, malo.slice(0, 80));
    assert.equal(PE.enlaceDePagina({ rect: [1, 1, 20, 10], href: malo }, 100, 200, 1), null);
  }
});
await ok('/ir/: solo https, sin usuario ni clave, con tope; ida y vuelta con aspecto', () => {
  const href = B.enlaceDeIr('https://fraterni.co/a?b=1&c=ñ#x', LOOK);
  const r = B.irDeEnlace(href);
  assert.equal(r.url, 'https://fraterni.co/a?b=1&c=%C3%B1#x');
  assert.equal(r.aspecto.e, 'duolingo');
  assert.deepEqual(B.irDeEnlace(B.enlaceDeIr('https://a.co')), { url: 'https://a.co/', aspecto: null });
  for (const u of ['http://a.co', 'javascript:alert(1)', 'https://u:p@a.co', 'https://user@a.co', 'data:text/html,x', '//a.co', 'https://a.co/ x', 'https://a.co/"x', 'https://localhost', 'https://a.co/' + 'x'.repeat(2100), 'ftp://a.co', '']) {
    assert.equal(B.enlaceDeIr(u), null, u.slice(0, 40));
  }
  assert.ok(hrefDeHoja(href) && PE.enlaceDePagina({ rect: [1, 1, 20, 10], href }, 100, 200, 1));
});
await ok('/ir/ falso: sin codificar, destino malo escondido, dos «&b=», demasiado largo, otro origen', () => {
  const base = 'https://juanjolopezramirez.com/ir/#u=';
  for (const malo of [base + 'https://a.co', base + encodeURIComponent('javascript:alert(1)'), base + encodeURIComponent('https://u:p@a.co/'), base + encodeURIComponent('http://a.co/'),
    base + encodeURIComponent('https://a.co/') + '&b=x&b=y', base + 'A'.repeat(9000), base, base + '%E0%A4%A']) {
    assert.equal(B.irDeEnlace(malo), null, malo.slice(0, 70));
    assert.equal(hrefDeHoja(malo), false, malo.slice(0, 70));
  }
  /* /ir/ de otro sitio no es nuestro boton: es un enlace comun (y como tal se mira) */
  assert.equal(B.irDeEnlace('https://otro.com/ir/#u=' + encodeURIComponent('https://a.co/')), null);
  /* la copia de prueba (npm run dev) se acepta solo si se nombra */
  const local = B.enlaceDeIr('https://a.co/', null, { origen: 'http://localhost:4321' });
  assert.equal(B.irDeEnlace(local), null);
  assert.equal(B.irDeEnlace(local, { origenes: ['http://localhost:4321'] }).url, 'https://a.co/');
});
await ok('el aspecto de cualquier boton y la ruta /ir/ reservada para los libros', () => {
  assert.equal(B.aspectoDeBoton(B.enlaceDeIr('https://a.co/', LOOK)).f, '#58cc02');
  assert.equal(B.aspectoDeBoton(B.enlaceDeCopiaConAspecto('x', LOOK)).k, 'Copiado');
  assert.equal(B.aspectoDeBoton(C.enlaceDeCopia('x')), null);
  assert.equal(B.aspectoDeBoton('https://a.co'), null);
  assert.ok(RUTAS_RESERVADAS.includes('ir'));
});
await ok('el aspecto que arma el Taller: medidas en fraccion del alto de la hoja, pildora, contorno y opacidad', () => {
  const o = BT.datos('boton', { texto: 'Ir', accion: 'enlace', enlace: 'https://a.co', fondo: '#123456', aspecto: { estilo: 'contorno', borde: 3, radio: 'pildora', opacidad: 60, bordeColor: '#abcdef' } });
  const ctx = { paginaMm: { anchoMm: 148, altoMm: 210 }, cuerpo: { tamanoPt: 12, fuente: 'Lora' }, papel: '#fbf8f1', idioma: 'es' };
  const x = BT.conContextoBoton(ctx, () => BT.aspectoParaEnlace(o));
  const alto = 210 * 72 / 25.4;
  assert.equal(x.e, 'contorno');
  assert.equal(x.rr, 1);
  assert.ok(Math.abs(x.fs - (12 * 0.95) / alto) < 1e-9);
  assert.ok(Math.abs(x.bw - (3 * 0.75) / alto) < 1e-9);
  assert.deepEqual([x.c, x.f, x.bc, x.bl, x.o, x.pf, x.fu], ['#123456', undefined, '#abcdef', 'solido', 60, '#fbf8f1', 'Lora']);
  assert.ok(B.codigoDeAspecto(x), 'cabe');
  assert.equal(BT.aspectoParaEnlace(o), null, 'sin hoja no hay aspecto');
});

console.log('\ncopiar estilo y la burbuja');
const E = await cargar('src/scripts/contenido/taller/estiloCopiado.js');
await ok('se copia el aspecto, nunca un enlace, una definicion ni una cita; lo raro se limpia', () => {
  const marcas = [{ type: 'bold' }, { type: 'italic' }, { type: 'link', attrs: { href: 'https://a.co' } }, marcaDef(), marcaCita(),
    { type: 'textStyle', attrs: { color: '#C08A2E', fontSize: '14pt', fontFamily: 'Lora' } }, { type: 'textStyle', attrs: { color: 'red;x' } }, { type: 'otra' }];
  const e = E.capturarEstilo(marcas, { type: 'heading', attrs: { level: 2, alinear: 'centro', id: 't-abc' } });
  assert.deepEqual(e.marcas, [{ type: 'bold' }, { type: 'italic' }, { type: 'textStyle', attrs: { color: '#c08a2e', fontSize: '14pt', fontFamily: 'Lora' } }]);
  assert.deepEqual(e.bloque, { tipo: 'heading', nivel: 2, alinear: 'centro' });
  assert.equal(E.capturarEstilo([], { type: 'blockquote' }).bloque, null);
  assert.deepEqual(E.capturarEstilo(null, { type: 'paragraph', attrs: { alinear: 'url(x)', capital: true } }).bloque, { tipo: 'paragraph', alinear: '' });
});
await ok('al pegar: se van las marcas de estilo, llegan las copiadas, y el enlace o la nota del destino se quedan', () => {
  const estilo = E.capturarEstilo([{ type: 'italic' }, { type: 'textStyle', attrs: { color: '#123456' } }], { type: 'paragraph', attrs: {} });
  const destino = [{ type: 'bold' }, { type: 'underline' }, marcaCita(), { type: 'textStyle', attrs: { fontSize: '30pt' } }];
  assert.deepEqual(E.marcasPintadas(destino, estilo), [marcaCita(), { type: 'italic' }, { type: 'textStyle', attrs: { color: '#123456' } }]);
  assert.deepEqual(E.marcasPintadas([{ type: 'link', attrs: { href: 'https://a.co' } }], { marcas: [] }), [{ type: 'link', attrs: { href: 'https://a.co' } }]);
});
await ok('el parrafo solo cambia si se toma entero; titulo ↔ parrafo sin capital pegada', () => {
  assert.ok(E.bloqueEntero(5, 20, 5, 20) && E.bloqueEntero(5, 20, 3, 25));
  assert.ok(!E.bloqueEntero(5, 20, 6, 20) && !E.bloqueEntero(5, 20, 5, 19) && !E.bloqueEntero(5, 5, 5, 5));
  const deTitulo = E.capturarEstilo([], { type: 'heading', attrs: { level: 3, alinear: 'derecha' } });
  assert.deepEqual(E.bloquePintado({ type: 'paragraph', attrs: { capital: true, alinear: '' } }, deTitulo), { type: 'heading', attrs: { level: 3, alinear: 'derecha' } });
  assert.deepEqual(E.bloquePintado({ type: 'heading', attrs: { level: 1, id: 't-12345678' } }, deTitulo), { type: 'heading', attrs: { level: 3, alinear: 'derecha', id: 't-12345678' } });
  const deParrafo = E.capturarEstilo([], { type: 'paragraph', attrs: { alinear: 'justificado', capital: true } });
  assert.deepEqual(E.bloquePintado({ type: 'heading', attrs: { level: 1 } }, deParrafo), { type: 'paragraph', attrs: { alinear: 'justificado', capital: false } });
  assert.deepEqual(E.bloquePintado({ type: 'paragraph', attrs: { capital: true } }, deParrafo), { type: 'paragraph', attrs: { alinear: 'justificado', capital: true } }, 'la capital del destino se queda');
  assert.equal(E.bloquePintado({ type: 'blockquote' }, deParrafo), null);
  assert.equal(E.bloquePintado({ type: 'paragraph' }, { marcas: [], bloque: null }), null);
});
await ok('la burbuja pone «Cita bíblica» primero cuando lo elegido parece una cita', () => {
  assert.deepEqual(E.ordenDeNotas('Jeremías 1:4-5 y el Salmo 139', 'es'), ['citaBiblica', 'definicion']);
  assert.deepEqual(E.ordenDeNotas('(Juan 13:3)', 'es'), ['citaBiblica', 'definicion']);
  assert.deepEqual(E.ordenDeNotas('John 3:16', 'en'), ['citaBiblica', 'definicion']);
  assert.deepEqual(E.ordenDeNotas('Ahavá', 'es'), ['definicion', 'citaBiblica']);
  assert.deepEqual(E.ordenDeNotas('', 'es'), ['definicion', 'citaBiblica']);
  assert.deepEqual(E.ordenDeNotas('el 1 de mayo', 'es'), ['definicion', 'citaBiblica']);
});

/* LA LETRA DE LOS VERSICULOS (ronda 2): una para todo el libro (ConfigPagina.notas.letraVersos), escrita en cada cita (`fv`) */
console.log('\nla letra de los versiculos');
const { ConfigPagina, PAGINA_BYTES_MAX } = await cargar('src/scripts/contenido/taller/ConfigPagina.js');
await ok('fv: ida y vuelta en el enlace de una cita; una letra que no es de la lista se tira', () => {
  for (const fv of Object.keys(N.FUENTES_NOTA)) {
    const h = N.enlaceDeNota({ v: 1, k: 'c', r: 'JHN.3.16', rv: 'NVI', fv, l: 'es' });
    assert.equal(N.notaDeEnlace(h).fv, fv, fv);
  }
  for (const fv of ['Comic Sans', 'libro', '__proto__', 'estonia;color:red', 7, null]) {
    assert.equal(N.limpiarNota({ v: 1, k: 'c', r: 'JHN.3.16', fv }).fv, undefined, String(fv));
  }
  /* solo en una cita: una definicion no lleva `fv` */
  assert.equal(N.limpiarNota({ v: 1, k: 'd', t: 'x', fv: 'lora' }).fv, undefined);
  /* el orden fijo: la misma nota da el mismo enlace, con `fv` entre `rv` y `l` */
  const plano = JSON.parse(Buffer.from(N.enlaceDeNota({ l: 'es', fv: 'lora', rv: 'NVI', r: 'JHN.3.16', k: 'c', v: 1 }).split('#n=')[1], 'base64url').toString('utf8'));
  assert.deepEqual(Object.keys(plano), ['v', 'k', 'r', 'rv', 'fv', 'l']);
  /* un enlace viejo, sin `fv`, sigue valiendo y sigue sin letra (el lector usa la de siempre) */
  assert.equal(N.notaDeEnlace(N.enlaceDeNota({ v: 1, k: 'c', r: 'PSA.139', l: 'es' })).fv, undefined);
});
await ok('notaDeMarca y enlaceDeMarca llevan la letra del libro solo a las citas; la marca guardada no la lleva', () => {
  assert.equal(NL.notaDeMarca(marcaCita(), 'es', { fv: 'estonia' }).fv, 'estonia');
  assert.equal(NL.notaDeMarca(marcaDef(), 'es', { fv: 'estonia' }).fv, undefined);
  assert.equal(N.notaDeEnlace(NL.enlaceDeMarca(marcaCita(), 'es', { fv: 'lora' })).fv, 'lora');
  assert.equal(NL.notaDeMarca(marcaCita(), 'es', { fv: 'otra' }).fv, undefined);
  assert.ok(!('fv' in NL.marcaDeNota({ v: 1, k: 'c', r: 'JHN.3.16', fv: 'lora' }).attrs), 'la letra es del libro, no de la marca');
  assert.ok(!('fv' in NL.marcaLimpia({ type: 'citaBiblica', attrs: { r: 'JHN.3.16', fv: 'lora' } }).attrs));
});
await ok('hrefsDeNotas cuenta lo mismo con la letra (el aviso de «Compartir» sigue cuadrando con el PDF)', () => {
  const caps = [doc(parrafo(texto('a', [marcaCita({ r: 'JHN.3.16', rv: 'NVI' })]), texto('b', [marcaCita({ r: 'JHN.3.17' })]), texto('c', [marcaDef({ t: 'c' })]))),
    doc(parrafo(texto('d', [marcaCita({ r: 'JHN.3.16', rv: 'NVI' })]), texto('e', [marcaDef({ t: 'c' })])))];
  const sin = NL.hrefsDeNotas(caps, 'es'), con = NL.hrefsDeNotas(caps, 'es', { fv: 'estonia' });
  assert.equal(sin.size, 3);
  assert.equal(con.size, sin.size);
  const citas = [...con].map((h) => N.notaDeEnlace(h)).filter((x) => x.k === 'c');
  assert.ok(citas.length === 2 && citas.every((x) => x.fv === 'estonia'));
  /* la cuenta del PDF que vuelve: los mismos enlaces que saca aHoja */
  const h = aHoja({ titulo: 'L', idioma: 'es', pagina: { notas: { letraVersos: 'estonia' } }, fuentes: [] }, [{ contenido: caps[0] }, { contenido: caps[1] }]);
  const delPdf = new Set(todos(h.nodos, (x) => x.tag === 'a' && /^nota/.test(x.clase)).map((a) => a.attrs.href));
  assert.deepEqual([...delPdf].sort(), [...con].sort());
});
await ok('al sacar el PDF, la letra se ESCRIBE: la elegida, o Bricolage Grotesque si no se eligio', () => {
  const cap = { contenido: doc(parrafo(texto('Juan 3:16', [marcaCita({ r: 'JHN.3.16' })]), texto(' y '), texto('Ahavá', [marcaDef()]))) };
  const citaDe = (pagina) => {
    const h = aHoja({ titulo: 'L', idioma: 'es', pagina, fuentes: [] }, [cap]);
    return todos(h.nodos, (x) => x.tag === 'a' && /^nota/.test(x.clase)).map((a) => N.notaDeEnlace(a.attrs.href));
  };
  const [c1, d1] = citaDe({});
  assert.equal(NL.LETRA_VERSOS, 'bricolage-grotesque');
  assert.equal(c1.fv, 'bricolage-grotesque', 'sin elegir: la de los libros nuevos, escrita');
  assert.equal(d1.fv, undefined, 'una definicion no la lleva');
  assert.equal(citaDe({ notas: { letraVersos: 'estonia' } })[0].fv, 'estonia');
  assert.equal(citaDe({ notas: { letraVersos: 'Comic Sans' } })[0].fv, 'bricolage-grotesque', 'una que no es de la lista no pasa');
  /* quien arma nodos sin un libro (sin `notas`) no inventa letra */
  const sueltos = aNodos(cap.contenido, 'pdf', { idioma: 'es' });
  assert.equal(N.notaDeEnlace(buscar(sueltos, (x) => x.tag === 'a' && /nota--cita/.test(x.clase)).attrs.href).fv, undefined);
});
await ok('ConfigPagina guarda la letra del libro (solo de la lista) y la devuelve en aDatos', () => {
  const vacias = { letraVersos: '', colores: { cita: { claro: ['', ''], oscuro: ['', ''] }, definicion: { claro: ['', ''], oscuro: ['', ''] } }, entrada: '', bucle: '' };
  assert.deepEqual(new ConfigPagina({}).notas, vacias);
  assert.deepEqual(new ConfigPagina({}).aDatos().notas, vacias);
  assert.equal(new ConfigPagina({ notas: { letraVersos: 'lora' } }).aDatos().notas.letraVersos, 'lora');
  for (const v of ['Lora', 'x', '__proto__', 3, null]) assert.equal(new ConfigPagina({ notas: { letraVersos: v } }).notas.letraVersos, '', String(v));
  assert.equal(new ConfigPagina({ notas: 'estonia' }).notas.letraVersos, '');
  /* lo de mas no entra */
  assert.deepEqual(Object.keys(new ConfigPagina({ notas: { letraVersos: 'lora', otra: 1 } }).aDatos().notas), ['letraVersos', 'colores', 'entrada', 'bucle']);
});
await ok('`pagina` sigue cabiendo en los 8000 bytes de la base en el peor caso (como lo cuenta jsonb::text)', () => {
  /* Postgres escribe jsonb con «, » y «: »: se mide igual */
  const pg = (x) => Array.isArray(x) ? '[' + x.map(pg).join(', ') + ']' : x && typeof x === 'object'
    ? '{' + Object.entries(x).map(([k, v]) => JSON.stringify(k) + ': ' + pg(v)).join(', ') + '}' : JSON.stringify(x);
  const bytes = (x) => new TextEncoder().encode(pg(x)).length;
  const largo = (k) => '𐍈'.repeat(k);
  const fuente = (i) => ('Fuente ' + String(i).padStart(2, '0') + ' ' + 'Abcdefgh '.repeat(6)).trim().slice(0, 60).trim();
  const lugar = { que: 'texto', negrita: true, texto: largo(60) };
  const peor = new ConfigPagina({
    anchoMm: 148.55, altoMm: 210.55, margenes: { sup: 20.5, inf: 22.5, izq: 18.5, der: 18.5 }, numeros: { ver: true, lugar: 'pie-exterior' },
    indice: { ver: true, titulo: largo(120), subtemas: true, puntos: true, antesDe: 'a'.repeat(40), plantilla: 'clasico', orden: true, imagen: { ruta: `taller/${'a'.repeat(40)}/img/${'b'.repeat(60)}.webp`, altoPct: 30, ajuste: 'contener' }, portadas: true, verRol: true, negrita: { n1: true, n2: true } },
    cabeza: { ver: true, partes: { rotulo: true, nombre: true, rol: true, subetapa: true }, distanciaMm: 10.5, tamanoPt: 9.5, lados: { izquierda: { izq: lugar, centro: lugar, der: lugar }, derecha: { izq: lugar, centro: lugar, der: lugar } } },
    autor: largo(80), rotulo: { ver: true, palabra: largo(30), cifras: 'romano' }, portada: 'si', imprenta: true,
    lomo: { texto: largo(40), color: '#123456', tinta: '#123456', grosor: 12.5, tapas: { delante: '#123456', detras: '#123456' }, imagen: { ruta: `taller/${'a'.repeat(40)}/img/lomo-${'b'.repeat(139)}.png` } },
    aviso: { copiado: largo(60), enlace: largo(60), falla: largo(60), fondo: '#123456', tinta: '#123456', lugar: 'arriba', segundos: 2.5 },
    papel: '#123456', letras: Object.fromEntries(Array.from({ length: 50 }, (_, i) => [fuente(i), '#123456'])), titulos: { t1: '#123456', t2: '#123456', t3: '#123456' },
    colores: Array.from({ length: 20 }, (_, i) => '#1234' + String(i % 100).padStart(2, '0')),
    cuerpo: { fuente: fuente(1), tamanoPt: 11.5, interlinea: 1.55 }, capital: { estilo: 'sencilla', fuente: fuente(2), lineas: 3, separaMm: 1.5 }, cita: { fuente: fuente(3), tamanoPt: 100, sangriaMm: 4.7, cursiva: false },
    notas: { letraVersos: 'bricolage-grotesque', colores: { cita: { claro: ['#123456', '#123456'], oscuro: ['#123456', '#123456'] }, definicion: { claro: ['#123456', '#123456'], oscuro: ['#123456', '#123456'] } }, entrada: 'aparece', bucle: 'respira' }
  }).aDatos();
  assert.equal(Object.keys(peor.letras).length, 40, 'el tope de letras se cumplio');
  assert.equal(peor.lomo.imagen.ruta.length, 200, 'la imagen del lomo (ruta de 200 letras) entra en el peor caso');
  assert.equal(PAGINA_BYTES_MAX, 8000);
  const { notas, ...sin } = peor;
  assert.equal(notas.letraVersos, 'bricolage-grotesque');
  assert.equal(notas.colores.definicion.oscuro[1], '#123456');
  const total = bytes(peor), sinNotas = bytes(sin);
  assert.ok(total <= PAGINA_BYTES_MAX, `peor caso: ${total} bytes`);
  assert.ok(total - sinNotas <= 300, `las notas pesan ${total - sinNotas} bytes`);
  assert.match(readFileSync(path.join(raiz, 'supabase/012_taller.sql'), 'utf8'), /octet_length\(pagina::text\) <= 8000/, 'el tope de la base sigue siendo 8000');
});

await ok('la hoja de la nota, /nota/ y el Taller usan la letra (solo la de la lista) y Estonia/Petemoss salen mas grandes', () => {
  const leer = (r) => readFileSync(path.join(raiz, r), 'utf8');
  const hoja = leer('src/scripts/lector/hojaNota.js');
  assert.match(hoja, /export function pintarVersos\(caja, pasaje, tl, fv\)/);
  assert.match(hoja, /ponerFuente\(p, fv\)/, 'por ponerFuente: solo FUENTES_NOTA, nunca un estilo de la nota');
  assert.match(hoja, /pintarVersos\(caja, pasaje, tl, nota\.fv\)/, 'llenarCita (lector y /nota/) pasa la letra');
  for (const [f, css] of [['src/styles/base.css', leer('src/styles/base.css')], ['src/pages/nota.astro', leer('src/pages/nota.astro')]]) {
    assert.match(css, /\.lector__nota-pasaje\[data-fuente="estonia"\], \.lector__nota-pasaje\[data-fuente="petemoss"\] \{ font-size: 1\.\d+rem; line-height: 1\.4; \}/, f);
    assert.match(css, /\.lector__nota-pasaje\[data-fuente="estonia"\] \.lector__nota-v/, `${f}: el numero no crece`);
  }
  const ed = leer('src/scripts/portal/panel/dev/taller/NotaEditor.js');
  assert.match(ed, /campo\(tx\.ncLetraVersos, this\.fv\)/);
  assert.match(ed, /new Selector\(this\.fv, \{ fuenteDe: \(v\) => this\.cssDe\(v\) \}\)/, 'cada opcion en su letra');
  assert.ok(ed.includes("this.idioma(), { fv: this.letraDelLibro(), estilo: this.notasLibro ? estiloDeNotas(this.notasLibro()) : undefined }).size"), 'la cuenta de «Compartir» con la misma letra y el mismo estilo');
  const tx = leer('src/data/portal/textos.js');
  assert.match(tx, /ncLetraVersos: 'Letra de los versículos \(todo el libro\)'/);
  assert.match(tx, /ncLetraCambiada: '[^']*\{f\}[^']*'/);
  for (const f of ['src/scripts/portal/panel/dev/taller/NotaEditor.js', 'src/scripts/portal/panel/dev/taller/LeerEdicion.js', 'src/scripts/portal/panel/dev/taller/Publicar.js',
    'src/scripts/contenido/taller/CantoTapa.js', 'src/scripts/contenido/taller/PaginasEdicion.js', 'src/scripts/contenido/taller/ConfigPagina.js', 'src/scripts/contenido/taller/notasLibro.js']) {
    assert.ok(!/localStorage|sessionStorage|innerHTML/.test(leer(f)), f);
  }
});

console.log(`\n${n} bien${mal ? `, ${mal} MAL` : ''}`);
process.exit(mal ? 1 : 0);
