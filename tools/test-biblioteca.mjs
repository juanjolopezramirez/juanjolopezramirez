/* Pruebas de las piezas puras de la biblioteca. Sin dependencias:

     node tools/test-biblioteca.mjs

   Prueban src/scripts/biblioteca.js (la ancla, lo guardado, que idioma abre
   cada libro, el grosor del lomo y la comprobacion de la compilacion) con los
   datos de verdad y con datos de mentira. Se paran con codigo 1 si algo falla. */
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

const { idDeHash, leerUltimo, guardarUltimo, CLAVE, variante, grosorDe, comprobar, ORDEN, colorLomo, contraste, ola, GIRO_MAX, TONOS, fichaLibro, normalizar, indexar, coincide, BUSCAR_MAX, rutaPortadaValida,
  RESERVADOS, ANCLAS_RESERVADAS, RUTAS_RESERVADAS, enlaceCorto, enlaceVisible, enlaceLargo, idiomaDeEnlace, comprobarRutas, urlAbsoluta, recortarTexto, portadaDeLibro, ogDeLibro, OG_MAX_BYTES, OG_RESPALDO, OG_LOCALES } = await cargar('src/scripts/biblioteca.js');
const { SECCIONES, TIPOS, LIBROS, PORTADAS, CARTELERA } = await cargar('src/data/biblioteca.js');
const { BOOKS } = await cargar('src/data/books.js');
const { PIEZAS_PUBLICAS, ABANICO_TRABAJOS } = await cargar('src/data/piezas.js');
const { PARTNERS } = await cargar('src/data/partners.js');
const { TERMS } = await cargar('src/i18n/terms.js');
const { GLOSS, CARDS } = await cargar('src/i18n/term-cards.js');
const { DEEP } = await cargar('src/i18n/term-book.js');

let n = 0;
let mal = 0;
const ok = (nombre, fn) => {
  try { fn(); n++; console.log('  ok  ' + nombre); } catch (e) { mal++; console.log(' MAL  ' + nombre + '\n      ' + String(e.message).split('\n')[0]); }
};
const real = { SECCIONES, TIPOS, LIBROS, BOOKS, TERMS, GLOSS, CARDS, DEEP, PORTADAS, CARTELERA };
const con = (cambios) => ({ ...real, ...cambios });
const generico = (extra) => ({ id: 'prueba', seccion: 'teologia', tipo: 'tapa-dura', idiomas: ['es'], titulo: { es: 'Prueba', en: 'Test' }, ...extra });
const hechos = (id, idiomas, pages = 12, ratio = 0.7143) => ({ [id]: Object.fromEntries(idiomas.map((l) => [l, { pages, ratio, v: 'abc', board: ['#000', '#000'] }])) });

console.log('datos de verdad');
ok('la comprobacion pasa con los libros de hoy', () => comprobar(real));
ok('hay 8 temas (con «Contrabando teologico») y los 4 libros de palabra son revistas', () => {
  assert.equal(SECCIONES.length, 8);
  assert.deepEqual(SECCIONES.map((x) => x.id).slice(0, 3), ['tecnologia', 'teologia', 'contrabando']);
  assert.deepEqual(LIBROS.filter((l) => l.glosario).map((l) => [l.id, l.tipo]), [['ahava', 'revista'], ['emet', 'revista'], ['agape', 'revista'], ['rhema', 'revista']]);
});

const validos = new Set(LIBROS.map((b) => b.id));
console.log('idDeHash');
ok('#ahava', () => assert.equal(idDeHash('#ahava', validos), 'ahava'));
ok('#AHAVA se acepta en minusculas', () => assert.equal(idDeHash('#AHAVA', validos), 'ahava'));
ok('#foo, #constructor, #__proto__, #toString no son libros', () => {
  for (const h of ['#foo', '#constructor', '#__proto__', '#toString']) assert.equal(idDeHash(h, validos), null);
});
ok('%E0 mal codificada no lanza', () => assert.equal(idDeHash('#%E0', validos), null));
ok('vacio, "#", sin # y no-texto', () => {
  for (const h of ['', '#', 'ahava', undefined, null, 5]) assert.equal(idDeHash(h, validos), null);
});
ok('un id muy largo no revienta', () => assert.equal(idDeHash('#' + 'a'.repeat(100000), validos), null));

console.log('guardar / leer');
const memoria = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };
const roto = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('lleno'); } };
ok('guarda y lee', () => { const a = memoria(); assert.equal(guardarUltimo(a, 'emet', validos), true); assert.equal(a.m.get(CLAVE), 'emet'); assert.equal(leerUltimo(a, validos), 'emet'); });
ok('no guarda un id que no es libro', () => { const a = memoria(); assert.equal(guardarUltimo(a, 'constructor', validos), false); assert.equal(a.m.size, 0); });
ok('lo guardado que ya no es libro, o es basura, se ignora', () => {
  const a = memoria();
  for (const v of ['borrado', '{"id":"emet"}', '<img src=x onerror=1>', '["emet"]', '', 'constructor']) { a.m.set(CLAVE, v); assert.equal(leerUltimo(a, validos), null); }
});
ok('almacen bloqueado o ausente: no lanza', () => {
  assert.equal(leerUltimo(roto, validos), null); assert.equal(guardarUltimo(roto, 'emet', validos), false);
  assert.equal(leerUltimo(undefined, validos), null); assert.equal(guardarUltimo(undefined, 'emet', validos), false);
});

console.log('variante: los libros de una palabra');
const ahava = LIBROS.find((l) => l.id === 'ahava');
ok('ahava en /es/ abre su PDF español, sin marca', () => {
  const v = variante(ahava, 'es', BOOKS);
  assert.equal(v.lang, 'es'); assert.equal(v.cual, 'es'); assert.ok(v.pdf && v.pdf.pages > 0); assert.equal(v.marca, null); assert.equal(v.texto, true);
});
ok('ahava en /en/, /fr/ abre el texto en el idioma de la pagina, sin marca', () => {
  for (const p of ['en', 'pt', 'fr', 'it']) { const v = variante(ahava, p, BOOKS); assert.equal(v.pdf, null); assert.equal(v.lang, p); assert.equal(v.marca, null); assert.equal(v.texto, true); }
});
ok('un PDF «all» sirve a todos los idiomas', () => {
  const v = variante(ahava, 'fr', hechos('ahava', ['all']));
  assert.equal(v.cual, 'all'); assert.ok(v.pdf);
});

console.log('variante: los demas libros (solo es / en)');
const B = (...ls) => hechos('prueba', ls);
ok('solo español: se ve en todas las paginas, con marca ES salvo en /es/', () => {
  const lib = generico({ idiomas: ['es'] });
  for (const p of ['es', 'en', 'pt', 'fr', 'it']) {
    const v = variante(lib, p, B('es'));
    assert.equal(v.lang, 'es'); assert.equal(v.texto, false); assert.equal(v.marca, p === 'es' ? null : 'ES');
  }
});
ok('solo ingles: se ve en todas, con marca EN salvo en /en/', () => {
  const lib = generico({ idiomas: ['en'] });
  for (const p of ['es', 'en', 'pt', 'fr', 'it']) { const v = variante(lib, p, B('en')); assert.equal(v.lang, 'en'); assert.equal(v.marca, p === 'en' ? null : 'EN'); }
});
ok('los dos idiomas: cada pagina abre el suyo o el mas cercano', () => {
  const lib = generico({ idiomas: ['es', 'en'] });
  const esperado = { es: ['es', null], en: ['en', null], pt: ['es', 'ES'], fr: ['en', 'EN'], it: ['en', 'EN'] };
  for (const [p, [l, m]] of Object.entries(esperado)) { const v = variante(lib, p, B('es', 'en')); assert.equal(v.lang, l, p); assert.equal(v.marca, m, p); }
});
ok('si el idioma esta declarado pero no convertido, no se abre (null)', () => assert.equal(variante(generico({ idiomas: ['es'] }), 'es', B('en')), null));
ok('un libro sin nada convertido no se abre (null)', () => assert.equal(variante(generico(), 'es', {}), null));
ok('un id hostil no busca en el prototipo', () => {
  for (const id of ['constructor', '__proto__', 'toString']) assert.equal(variante(generico({ id }), 'es', {}), null);
});
ok('la regla cubre las 5 paginas', () => assert.deepEqual(Object.keys(ORDEN).sort(), ['en', 'es', 'fr', 'it', 'pt']));

console.log('grosorDe');
ok('tapa dura: 12 fino, 13 medio, 40 medio, 41 grueso', () => {
  const lib = generico();
  assert.equal(grosorDe(lib, hechos('prueba', ['es'], 12), TIPOS), 'fino');
  assert.equal(grosorDe(lib, hechos('prueba', ['es'], 13), TIPOS), 'medio');
  assert.equal(grosorDe(lib, hechos('prueba', ['es'], 40), TIPOS), 'medio');
  assert.equal(grosorDe(lib, hechos('prueba', ['es'], 41), TIPOS), 'grueso');
});
ok('revista / comic: fino hasta 40, medio de ahi', () => {
  for (const tipo of ['revista', 'comic']) {
    assert.equal(grosorDe(generico({ tipo }), hechos('prueba', ['es'], 40), TIPOS), 'fino');
    assert.equal(grosorDe(generico({ tipo }), hechos('prueba', ['es'], 41), TIPOS), 'medio');
  }
});
ok('sin PDF es un libro escrito de doce paginas; se puede fijar a mano', () => {
  assert.equal(grosorDe(generico(), {}, TIPOS), 'fino');
  assert.equal(grosorDe(generico({ grosor: 'grueso' }), hechos('prueba', ['es'], 5), TIPOS), 'grueso');
});
ok('no cambia con el idioma de la pagina: mira el primer PDF que hay (es, luego en)', () => {
  const b = { prueba: { en: { pages: 80 }, es: { pages: 10 } } };
  assert.equal(grosorDe(generico({ idiomas: ['es', 'en'] }), b, TIPOS), 'fino');
});

console.log('colorLomo');
ok('el ambar de Ahava (#a27005) se oscurece hasta leerse (4.5:1)', () => {
  const c = colorLomo('#a27005');
  assert.ok(contraste(c.fondo, c.tinta) >= 4.5, 'contraste ' + contraste(c.fondo, c.tinta));
  assert.notEqual(c.fondo, '#a27005');
});
ok('el pino y los colores que ya se leen no se tocan', () => {
  assert.deepEqual(colorLomo('#263b28'), { fondo: '#263b28', tinta: '#F1EFE9' });
  assert.equal(colorLomo('#ffffff').tinta, '#263B28');
});
ok('cualquier color de carton, el peor caso incluido, da 4.5:1 o mas', () => {
  for (const base of ['#808080', '#777777', '#00a0a0', '#a0a000', '#ff0000', '#0000ff', '#ffffff', '#000000']) {
    const c = colorLomo(base); assert.ok(contraste(c.fondo, c.tinta) >= 4.5, base + ' -> ' + contraste(c.fondo, c.tinta));
  }
});
ok('un valor que no es un color cae al pino (sin lanzar)', () => {
  for (const base of [undefined, null, '', 'rojo', '#12', 'url(x)', '#GGGGGG', 5]) assert.equal(colorLomo(base).fondo, '#263b28');
});

console.log('TONOS y fichaLibro');
const datos = { BOOKS, TIPOS, TERMS, GLOSS };
const FICHA_ES = (l, pagina = 'es', b = BOOKS) => fichaLibro(l, pagina, { ...datos, BOOKS: b }, '/');
ok('cada tono es un #rrggbb y su tinta se lee (4.5:1)', () => {
  for (const [k, hex] of Object.entries(TONOS)) {
    assert.match(hex, /^#[0-9a-f]{6}$/, k);
    const c = colorLomo(hex); assert.ok(contraste(c.fondo, c.tinta) >= 4.5, k + ' -> ' + contraste(c.fondo, c.tinta));
  }
});
ok('el tono de cada libro, si lo tiene, existe; los de hoy (4) son distintos entre si', () => {
  const tonos = LIBROS.map((l) => l.tono).filter((t) => t !== undefined);
  assert.ok(tonos.every((t) => Object.prototype.hasOwnProperty.call(TONOS, t)), tonos.join());
  assert.equal(tonos.length, 4); assert.equal(new Set(tonos).size, 4);
});
ok('los tonos que son un color de la casa repiten el hex de base.css (ocre es la mezcla de ring y ring 300)', () => {
  const css = fs.readFileSync(path.join(raiz, 'src/styles/base.css'), 'utf8').toLowerCase();
  for (const [tono, token] of [['salvia', '--celtic-400'], ['pizarra', '--slate'], ['tierra', '--ring-700'], ['niebla', '--slate-100'], ['arena', '--ring-300']]) {
    assert.ok(css.includes(`${token}:`) && new RegExp(`${token}:\\s*${TONOS[tono]};`).test(css), `${tono} ≠ ${token}`);
  }
  const m = (a, b) => '#' + [1, 3, 5].map((i) => Math.round((parseInt(a.slice(i, i + 2), 16) + parseInt(b.slice(i, i + 2), 16)) / 2).toString(16).padStart(2, '0')).join('');
  assert.equal(TONOS.ocre, m('#c08a2e', '#e0b778'));
});
ok('la ficha de un libro de una palabra: titulo, glosa, alfabeto y portada', () => {
  const f = FICHA_ES(LIBROS.find((l) => l.id === 'ahava'));
  assert.equal(f.id, 'ahava'); assert.equal(f.titulo, TERMS.ahava.title.es); assert.equal(f.glosa, GLOSS.ahava.es);
  assert.equal(f.guion, TERMS.ahava.script); assert.equal(f.lengua, 'he'); assert.equal(f.dir, 'rtl');
  assert.equal(f.blando, true); assert.equal(f.grosor, 'fino'); assert.equal(f.marca, null);
  assert.equal(f.portada, `/books/ahava/es/01-900.jpg?v=${BOOKS.ahava.es.v}`);
});
ok('sin PDF en ese idioma no hay portada, pero hay ficha (se dibuja)', () => {
  const f = FICHA_ES(LIBROS.find((l) => l.id === 'emet'));
  assert.equal(f.portada, null); assert.equal(f.titulo, TERMS.emet.title.es);
});
ok('el tono manda sobre el carton del PDF (el de Ahava era el ambar #a27005)', () => {
  const sin = FICHA_ES({ ...LIBROS.find((l) => l.id === 'ahava'), tono: undefined });
  const con = FICHA_ES(LIBROS.find((l) => l.id === 'ahava'));
  assert.notEqual(sin.color.fondo, con.color.fondo);
  assert.equal(con.color.fondo, TONOS.ocre);
});
ok('sin tono ni PDF cae al pino; un tono que no existe tambien (no lanza)', () => {
  assert.equal(FICHA_ES({ ...LIBROS.find((l) => l.id === 'emet'), tono: undefined }).color.fondo, '#263b28');
  assert.equal(FICHA_ES({ ...LIBROS.find((l) => l.id === 'emet'), tono: 'constructor' }).color.fondo, '#263b28');
});
ok('un libro de otro idioma: titulo del idioma que se abre y marca', () => {
  const l = generico({ idiomas: ['en'], titulo: { es: 'Prueba', en: 'Test' }, subtitulo: { en: 'A sub' } });
  const f = FICHA_ES(l, 'es', hechos('prueba', ['en']));
  assert.equal(f.titulo, 'Test'); assert.equal(f.glosa, 'A sub'); assert.equal(f.marca, 'EN'); assert.equal(f.idioma, 'en'); assert.equal(f.glosario, undefined);
  assert.equal(f.guion, null); assert.equal(f.dir, null);
});
ok('un libro que no se puede abrir no tiene ficha (null)', () => assert.equal(FICHA_ES(generico({ idiomas: ['es'] }), 'es', {}), null));
ok('es la misma ficha en las cinco paginas para los libros de hoy (mismo id, grosor y color)', () => {
  for (const l of LIBROS) {
    const fs = ['es', 'en', 'pt', 'fr', 'it'].map((p) => FICHA_ES(l, p));
    assert.ok(fs.every(Boolean), l.id);
    assert.equal(new Set(fs.map((f) => f.grosor)).size, 1, l.id + ' grosor'); assert.equal(new Set(fs.map((f) => f.color.fondo)).size, 1, l.id + ' color');
  }
});
console.log('buscar: normalizar, indexar, coincide');
const indiceDe = (id) => { const l = LIBROS.find((x) => x.id === id); const f = FICHA_ES(l); return indexar([f.titulo, f.glosa, f.guion, id, f.seccion]); };
ok('normalizar quita acentos, mayusculas y espacios de mas', () => {
  assert.equal(normalizar('  ÁGAPE   Amor '), 'agape amor');
  assert.equal(normalizar('Ahavá'), 'ahava');
});
ok('normalizar quita los puntos del hebreo y los tonos del griego', () => {
  assert.equal(normalizar('אֱמֶת'), 'אמת');
  assert.equal(normalizar('ἀγάπη'), 'αγαπη');
});
ok('normalizar corta lo largo y lo que no es texto da vacio', () => {
  assert.equal(normalizar('x'.repeat(10000)).length, BUSCAR_MAX);
  for (const v of [null, undefined, 5, {}, [], () => 1, Symbol.iterator]) assert.equal(normalizar(v), '');
});
ok('indexar junta las partes, ignora lo que no es texto y no se corta a 60', () => {
  assert.equal(indexar(['Ahavá', null, 'אַהֲבָה', '', 5]), 'ahava אהבה');
  assert.ok(indexar(['a'.repeat(300)]).length === 300);
  assert.equal(indexar('no es lista'), '');
});
ok('coincide: sin acentos ni mayusculas, y todas las palabras', () => {
  assert.equal(coincide('agape', indiceDe('agape')), true);
  assert.equal(coincide('ÁGAPE', indiceDe('agape')), true);
  assert.equal(coincide('אהבה', indiceDe('ahava')), true);
  assert.equal(coincide('αγαπη', indiceDe('agape')), true);
  assert.equal(coincide('teologia', indiceDe('rhema')), true);
  assert.equal(coincide('agape rhema', indiceDe('agape')), false);
  assert.equal(coincide('xyz', indiceDe('agape')), false);
});
ok('coincide: vacio o solo espacios encaja con todo', () => {
  for (const q of ['', '   ', '\n\t', null, undefined, 5]) assert.equal(coincide(q, indiceDe('emet')), true, JSON.stringify(q));
});
ok('coincide: nada de lo escrito se toma por una expresion, un selector o un objeto', () => {
  for (const q of ['.*', '(', '[', '\\', '^$', '<img src=x onerror=1>', 'constructor', '__proto__', 'toString']) {
    assert.doesNotThrow(() => coincide(q, indiceDe('emet')), q);
  }
  assert.equal(coincide('.*', indiceDe('emet')), false);
  assert.equal(coincide('constructor', indiceDe('emet')), false);
  assert.equal(coincide('x', null), false);
  assert.equal(coincide('x', {}), false);
});
ok('normalizar quita los invisibles de un copiar y pegar (ancho cero, guion blando, direccion)', () => {
  assert.equal(normalizar('a​ga­pe‏'), 'agape');
  assert.equal(normalizar('‮agape⁠﻿'), 'agape');
  assert.equal(coincide('a​gape', indiceDe('agape')), true);
});
ok('coincide con diez mil letras no se cuelga ni encaja con todo', () => {
  const t0 = Date.now(); assert.equal(coincide('zq '.repeat(5000), indiceDe('emet')), false); assert.ok(Date.now() - t0 < 200);
});

console.log('abanico de la cabecera de Trabajos');
ok('ABANICO_TRABAJOS: tres piezas publicas y verticales, sin repetir, con su portada en disco', () => {
  assert.equal(ABANICO_TRABAJOS.length, 3); assert.equal(new Set(ABANICO_TRABAJOS).size, 3);
  for (const id of ABANICO_TRABAJOS) {
    const p = PIEZAS_PUBLICAS.find((x) => x.id === id);
    assert.ok(p, id + ' no esta en PIEZAS_PUBLICAS'); assert.equal(p.orientacion, 'vertical', id);
    assert.ok(PARTNERS.some((x) => x.id === p.casa), `${id}: su casa «${p.casa}» no esta en PARTNERS, asi que no hay tarjeta que abrir`);
    for (const ext of ['jpg', 'webp']) assert.ok(fs.existsSync(path.join(raiz, 'public/assets/videos/piezas', `${p.archivo}.${ext}`)), `${p.archivo}.${ext}`);
  }
});

console.log('rutas de portada');
ok('rutaPortadaValida: solo assets/portadas/nombre.jpg|png|webp', () => {
  for (const r of ['assets/portadas/nada-que-demostrar.jpg', 'assets/portadas/a1.png', 'assets/portadas/x.webp']) assert.equal(rutaPortadaValida(r), true, r);
  for (const r of ['../secreto.jpg', 'assets/portadas/../x.jpg', 'assets/portadas/a/b.jpg', '/assets/portadas/a.jpg', 'assets/portadas/A.jpg', 'assets/portadas/a.svg', 'assets/portadas/a.jpg\n', '', null, undefined, 5, {}]) assert.equal(rutaPortadaValida(r), false, String(r));
});

console.log('ola');
ok('justo debajo del puntero sube del todo y no se inclina', () => { const o = ola(100, 100, 170); assert.equal(o.ola, 1); assert.equal(o.giro, 0); });
ok('a distancia R o mas, ni sube ni se inclina', () => {
  for (const x of [270, 400, -500, 1e6]) { const o = ola(x, 100, 170); assert.ok(Math.abs(o.ola) < 1e-12, 'ola ' + o.ola); assert.ok(Math.abs(o.giro) < 1e-9, 'giro ' + o.giro); }
});
ok('baja sin saltos y de forma simetrica al alejarse', () => {
  let antes = 1.0001;
  for (let d = 0; d <= 170; d += 5) {
    const a = ola(100 + d, 100, 170), b = ola(100 - d, 100, 170);
    assert.ok(a.ola <= antes + 1e-12, 'no monotona en ' + d); antes = a.ola;
    assert.ok(Math.abs(a.ola - b.ola) < 1e-12); assert.ok(Math.abs(a.giro + b.giro) < 1e-9);
    assert.ok(a.ola >= 0 && a.ola <= 1);
  }
});
ok('los de la izquierda se inclinan a la izquierda, los de la derecha a la derecha, hasta GIRO_MAX', () => {
  assert.ok(ola(200, 100, 170).giro < 0); assert.ok(ola(0, 100, 170).giro > 0);
  const max = Math.max(...Array.from({ length: 200 }, (_, i) => Math.abs(ola(100 + i * 0.85, 100, 170).giro)));
  assert.ok(max <= GIRO_MAX + 1e-9 && max > GIRO_MAX - 0.05, 'max ' + max);
});
ok('datos que no son numeros no dan NaN: dan 0', () => {
  for (const args of [[NaN, 1, 100], [1, NaN, 100], [1, 1, 0], [1, 1, -5], [1, 1, NaN], [Infinity, 1, 100], [1, 1, undefined]]) { const o = ola(...args); assert.deepEqual(o, { ola: 0, giro: 0 }); }
});

console.log('comprobar: lo que para la compilacion');
const para = (nombre, cambios, texto) => ok('para: ' + nombre, () => assert.throws(() => comprobar(con(cambios)), (e) => (texto ? texto.test(e.message) : true), nombre));
const bien = (cambios) => comprobar(con(cambios));
ok('un libro de otro idioma bien puesto pasa', () => bien({ LIBROS: [...LIBROS, generico({ idiomas: ['es', 'en'] })], BOOKS: { ...BOOKS, ...hechos('prueba', ['es', 'en']) } }));
para('id repetido', { LIBROS: [LIBROS[0], LIBROS[0]] }, /repetido/);
para('seccion que no existe', { LIBROS: [{ ...LIBROS[0], seccion: 'cocina' }] }, /no existe/);
para('palabra que no existe', { LIBROS: [{ ...LIBROS[0], id: 'nada' }] }, /palabra completa/);
para('id con guion', { LIBROS: [generico({ id: 'a-b' })] }, /minusculas sin guiones/);
para('id con mayusculas', { LIBROS: [generico({ id: 'Libertad' })] }, /minusculas sin guiones/);
para('id como ancla', { LIBROS: [generico({ id: 'main' })], BOOKS: hechos('main', ['es']) }, /ancla/);
para('id como la ancla de Destacados', { LIBROS: [generico({ id: 'destacados' })], BOOKS: hechos('destacados', ['es']) }, /ancla/);
para('tipo que no existe', { LIBROS: [generico({ tipo: 'enciclopedia' })], BOOKS: B('es') }, /tipo/);
para('grosor que no existe', { LIBROS: [generico({ grosor: 'gordo' })], BOOKS: B('es') }, /grosor/);
para('un libro que no es de palabra sin idiomas', { LIBROS: [generico({ idiomas: undefined })], BOOKS: B('es') }, /idiomas/);
para('un idioma que no es es/en (pt)', { LIBROS: [generico({ idiomas: ['pt'] })], BOOKS: B('pt') }, /idiomas/);
para('idioma repetido', { LIBROS: [generico({ idiomas: ['es', 'es'] })], BOOKS: B('es') }, /repite/);
para('sin titulo en un idioma declarado', { LIBROS: [generico({ idiomas: ['es', 'en'], titulo: { es: 'x' } })], BOOKS: B('es', 'en') }, /titulo en «en»/);
para('PDF sin convertir', { LIBROS: [generico({ idiomas: ['es', 'en'] })], BOOKS: B('es') }, /books\/prueba\.en\.pdf/);
para('un subtitulo en un idioma que el libro no tiene', { LIBROS: [generico({ subtitulo: { en: 'x' } })], BOOKS: B('es') }, /subtitulo/);
para('palabra sin titulo en TERMS', { TERMS: { ...TERMS, ahava: { ...TERMS.ahava, title: undefined } } }, /titulo, escritura/);
para('palabra sin glosa', { GLOSS: { ...GLOSS, ahava: undefined } }, /glosa/);
para('tema repetido', { SECCIONES: [...SECCIONES, SECCIONES[0]] }, /repetida/);
ok('la cartelera de hoy es un libro de LIBROS', () => assert.ok(LIBROS.some((l) => l.id === CARTELERA), String(CARTELERA)));
para('cartelera: un libro que no esta en LIBROS', { CARTELERA: 'nada' }, /cartelera/);
para('cartelera: algo que no es un id (null, numero, objeto)', { CARTELERA: null }, /cartelera/);
para('cartelera: un id hostil (constructor)', { CARTELERA: 'constructor' }, /cartelera/);
ok('sin cartelera (undefined) la comprobacion pasa: sale el primero que se abra', () => bien({ CARTELERA: undefined }));
para('un tono que no existe', { LIBROS: [{ ...LIBROS[0], tono: 'fucsia' }] }, /tono «fucsia»/);
para('un tono hostil (constructor)', { LIBROS: [{ ...LIBROS[0], tono: 'constructor' }] }, /tono/);
ok('un titulo muy largo AVISA, no para', () => {
  const largo = 'x'.repeat(60);
  const avisos = bien({ LIBROS: [...LIBROS, generico({ titulo: { es: largo, en: 'T' } })], BOOKS: { ...BOOKS, ...hechos('prueba', ['es']) } });
  assert.ok(avisos.some((a) => /60 letras/.test(a)));
});
ok('portadas: una lista vacia o con mas de tres pasa (la fila «Pronto» no tiene limite)', () => {
  bien({ PORTADAS: [] });
  bien({ PORTADAS: Array.from({ length: 5 }, (_, i) => ({ imagen: `assets/portadas/a${i}.jpg`, ancho: 840, alto: 1189, titulo: 'x' })) });
});
para('portadas: algo que no es una lista', { PORTADAS: 'nada' }, /tiene que ser una lista/);
para('un tema con un id raro (mayusculas, guion, espacio)', { SECCIONES: [{ id: 'Mi-tema', nombre: SECCIONES[0].nombre }] }, /id que no es una palabra/);
para('un tema que se llama «pronto» (es la fila de Destacados)', { SECCIONES: [{ id: 'pronto', nombre: SECCIONES[0].nombre }] }, /pronto/);
para('portadas: un libro que no esta en LIBROS', { PORTADAS: [{ id: 'nada' }] }, /no esta en LIBROS/);
para('portadas: una imagen fuera de assets/portadas', { PORTADAS: [{ imagen: '../secreto.jpg', ancho: 1, alto: 1, titulo: 'x' }] }, /assets\/portadas/);
para('portadas: una imagen con una ruta rara', { PORTADAS: [{ imagen: 'assets/portadas/a/b.jpg', ancho: 1, alto: 1, titulo: 'x' }] }, /assets\/portadas/);
para('portadas: sin medidas', { PORTADAS: [{ imagen: 'assets/portadas/a.jpg', titulo: 'x' }] }, /ancho y el alto/);
para('portadas: sin titulo', { PORTADAS: [{ imagen: 'assets/portadas/a.jpg', ancho: 1, alto: 1 }] }, /titulo/);
ok('portadas: una suelta y un libro, bien', () => bien({ PORTADAS: [{ id: 'emet' }, { imagen: 'assets/portadas/a.jpg', ancho: 840, alto: 1189, titulo: 'x' }] }));
para('lectura que falta en CARDS', { CARDS: { ...CARDS, ahava: { ...CARDS.ahava, now: undefined } } }, /lectura «now»/);
para('nivel que falta en DEEP', { DEEP: { ...DEEP, ahava: { ...DEEP.ahava, sod: undefined } } }, /«sod»/);
para('«sources» que no es una lista', { DEEP: { ...DEEP, ahava: { ...DEEP.ahava, sources: 'x' } } }, /no es una lista/);
para('tema sin nombre en un idioma', { SECCIONES: [{ id: 'a', nombre: { es: 'a' } }] }, /nombre en/);
ok('un PDF que se aleja de su tipo AVISA, no para', () => {
  const avisos = bien({ LIBROS: [...LIBROS, generico({ tipo: 'comic' })], BOOKS: { ...BOOKS, ...hechos('prueba', ['es'], 12, 0.8) } });
  assert.ok(avisos.some((a) => /proporcion/.test(a)));
});
ok('un PDF convertido que no esta en LIBROS AVISA', () => {
  assert.ok(bien({ BOOKS: { ...BOOKS, ...hechos('huerfano', ['es']) } }).some((a) => /huerfano/.test(a)));
});

console.log('libros del panel (Developer-Mode): en el idioma en que se escribieron');
const delPanel = (extra) => generico({ id: 'liberdade', panel: true, idiomas: ['pt'], idiomaOriginal: 'pt', titulo: { pt: 'Liberdade' }, ...extra });
ok('un libro del panel en portugues pasa la comprobacion; uno del codigo en portugues no', () => {
  const B2 = { ...BOOKS, ...hechos('liberdade', ['pt']) };
  comprobar(con({ LIBROS: [...LIBROS, delPanel()], BOOKS: B2 }));
  assert.throws(() => comprobar(con({ LIBROS: [...LIBROS, delPanel({ panel: undefined })], BOOKS: B2 })), /idiomas/);
  assert.throws(() => comprobar(con({ LIBROS: [...LIBROS, delPanel({ idiomas: ['../'] })], BOOKS: B2 })), /idiomas/);
});
ok('variante: el libro en portugues se abre en portugues en TODAS las paginas, con su marca fuera de /pt/', () => {
  const B2 = hechos('liberdade', ['pt']);
  const l = delPanel();
  assert.deepEqual([variante(l, 'pt', B2).lang, variante(l, 'pt', B2).marca], ['pt', null]);
  for (const p of ['es', 'en', 'fr', 'it']) assert.deepEqual([variante(l, p, B2).lang, variante(l, p, B2).marca], ['pt', 'PT'], p);
});
ok('variante: un libro en portugues Y español se abre en portugues en /pt/ y en español en /es/', () => {
  const B2 = hechos('liberdade', ['pt', 'es']);
  const l = delPanel({ idiomas: ['pt', 'es'], titulo: { pt: 'Liberdade', es: 'Libertad' } });
  assert.equal(variante(l, 'pt', B2).lang, 'pt');
  assert.equal(variante(l, 'es', B2).lang, 'es');
  assert.equal(variante(l, 'en', B2).lang, 'es', 'en /en/ sigue el orden de siempre: ingles, luego español');
});
ok('un libro del panel que pierde un idioma (su PDF no se convirtio) no tumba la compilacion', () => {
  const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
  /* La misma cuenta que data/biblioteca.js → convertido(), con un libro es+en del que solo quedo el es */
  const l = delPanel({ id: 'dos', idiomas: ['es', 'en'], titulo: { es: 'Dos', en: 'Two' }, subtitulo: { es: 'a', en: 'b' } });
  const B2 = { ...BOOKS, ...hechos('dos', ['es']) };
  const solo = (o) => Object.fromEntries(Object.entries(o).filter(([x]) => ['es'].includes(x)));
  const queda = { ...l, idiomas: ['es'], titulo: solo(l.titulo), subtitulo: solo(l.subtitulo) };
  comprobar(con({ LIBROS: [...LIBROS, queda], BOOKS: B2 }));
  assert.match(leer('src/data/biblioteca.js'), /titulo: solo\(l\.titulo\)/);
});
ok('variante: los libros de hoy (español/ingles) se abren igual que antes', () => {
  const B2 = hechos('prueba', ['es', 'en']);
  const l = generico({ idiomas: ['es', 'en'] });
  for (const [p, esperado] of [['es', 'es'], ['en', 'en'], ['pt', 'es'], ['fr', 'en'], ['it', 'en']]) assert.equal(variante(l, p, B2).lang, esperado, p);
});

/* =====================================================================
   EL ENLACE CORTO: juanjolopezramirez.com/<id>
   ===================================================================== */
const leerFuente = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const SITIO = 'https://juanjolopezramirez.com';
const { enlacesDeLibros, nombresDeLaRaiz, ANCHO_LIVIANA, aligerar } = await cargar('src/data/enlaces-libros.js');
const { UI, LANGS } = await cargar('src/i18n/ui.js');

console.log('enlace corto: nombres reservados');
ok('la lista incluye la de la raiz del sitio y los cinco idiomas', () => {
  /* copiar y nota: las paginas a las que llevan el boton de copiar y las notas de un PDF
     (pages/copiar.astro, pages/nota.astro) */
  for (const id of ['es', 'en', 'pt', 'fr', 'it', 'portal', 'vista', 'actividad', 'taller-hoja', 'api', 'robots', 'sitemap', 'favicon', 'assets', 'books', 'sounds', '_astro', 'admin', 'login', 'www', 'index', '404', 'ads', 'humans', 'security', 'manifest', 'feed', 'rss', 'sw', 'static', 'public', 'copiar', 'nota']) {
    assert.ok(RUTAS_RESERVADAS.includes(id), id);
    assert.ok(RESERVADOS.has(id), id);
  }
  for (const a of ANCLAS_RESERVADAS) assert.ok(RESERVADOS.has(a), a);
});
ok('todo lo que HAY en la raiz (public/ y src/pages) esta en la lista reservada', () => {
  const hay = nombresDeLaRaiz(raiz);
  assert.ok(hay.length >= 8, 'se leyo la raiz');
  for (const nombre of hay) assert.ok(RESERVADOS.has(nombre) || nombre === 'robots', `${nombre}: una pagina o carpeta de la raiz que un libro podria quitar`);
  /* y lo que compila Astro en dist/ si esta */
  const dist = path.join(raiz, 'dist');
  if (fs.existsSync(dist)) {
    for (const e of fs.readdirSync(dist)) {
      if (e.startsWith('.')) continue;   // .nojekyll
      const nombre = e.split('.')[0].toLowerCase();
      if (LIBROS.some((l) => l.id === nombre)) continue;   // las paginas de los libros
      assert.ok(RESERVADOS.has(nombre), `dist/${e}`);
    }
  }
});
ok('ningun libro de hoy (ni alias) se llama como una direccion reservada', () => {
  for (const l of LIBROS) assert.equal(RESERVADOS.has(l.id), false, l.id);
  for (const alias of ['ahavah', 'agapi']) assert.equal(RESERVADOS.has(alias), false, alias);
});
ok('comprobar() para la compilacion si un libro se llama como una direccion, y lo dice en claro', () => {
  for (const id of ['portal', 'vista', 'actividad', 'api', 'robots', 'sitemap', 'favicon', 'assets', 'books', 'sounds', 'admin', 'login', 'www', 'index', 'es', 'en', 'pt', 'fr', 'it']) {
    assert.throws(() => comprobar(con({ LIBROS: [...LIBROS, generico({ id })], BOOKS: { ...BOOKS, ...hechos(id, ['es']) } })), /direccion de la web/, id);
  }
  assert.throws(() => comprobar(con({ LIBROS: [...LIBROS, generico({ id: 'portal' })], BOOKS: { ...BOOKS, ...hechos('portal', ['es']) } })), /«portal»/);
  /* y uno normal sigue pasando */
  comprobar(con({ LIBROS: [...LIBROS, generico({ id: 'libertad' })], BOOKS: { ...BOOKS, ...hechos('libertad', ['es']) } }));
});

console.log('enlace corto: la direccion');
ok('enlaceCorto: https://dominio/<id>, sin barra doble y sin ids reservados', () => {
  assert.equal(enlaceCorto(SITIO, 'ahava'), 'https://juanjolopezramirez.com/ahava');
  assert.equal(enlaceCorto(SITIO + '/', 'ahava'), 'https://juanjolopezramirez.com/ahava');
  assert.equal(enlaceCorto('http://localhost:4325', 'ahava'), 'http://localhost:4325/ahava');
  for (const malo of ['portal', 'es', 'Ahava', 'a-b', '', 'ahava/x', '../x', '__proto__', null, undefined, 5]) assert.equal(enlaceCorto(SITIO, malo), null, String(malo));
  for (const malo of ['', null, undefined, 'juanjolopezramirez.com', 'javascript:alert(1)', 'https://', 'https://a.com/x']) assert.equal(enlaceCorto(malo, 'ahava'), null, String(malo));
});
ok('enlaceVisible: sin https:// («juanjolopezramirez.com/ahava»)', () => {
  assert.equal(enlaceVisible(SITIO, 'ahava'), 'juanjolopezramirez.com/ahava');
  assert.equal(enlaceVisible(SITIO, 'portal'), null);
});
ok('enlaceLargo: /<idioma>/writing/#<id>, el que el lector ya abre', () => {
  assert.equal(enlaceLargo(SITIO, 'es', 'ahava'), 'https://juanjolopezramirez.com/es/writing/#ahava');
  assert.equal(enlaceLargo(SITIO, 'xx1', 'ahava'), null);
  assert.equal(enlaceLargo(SITIO, 'es', 'A b'), null);
});
ok('idiomaDeEnlace: el del navegador si la web lo tiene; si no, español', () => {
  const L = ['es', 'en', 'pt', 'fr', 'it'];
  assert.equal(idiomaDeEnlace(['en-US', 'es'], L, 'es'), 'en');
  assert.equal(idiomaDeEnlace(['pt-BR'], L, 'es'), 'pt');
  assert.equal(idiomaDeEnlace(['de-DE', 'FR-ca', 'en'], L, 'es'), 'fr');
  assert.equal(idiomaDeEnlace(['de', 'ja'], L, 'es'), 'es');
  assert.equal(idiomaDeEnlace([], L, 'es'), 'es');
  assert.equal(idiomaDeEnlace('it-IT', L, 'es'), 'it');
  assert.equal(idiomaDeEnlace(undefined, L, 'es'), 'es');
  assert.equal(idiomaDeEnlace(['constructor', '__proto__'], L, 'es'), 'es');
});

console.log('enlace corto: comprobarRutas (las paginas)');
ok('los libros de hoy pasan, aun con lo que hay de verdad en la raiz', () => {
  assert.deepEqual(comprobarRutas(LIBROS.map((l) => l.id), nombresDeLaRaiz(raiz)), LIBROS.map((l) => l.id));
});
ok('se para, en español claro, si un id choca con la lista, con un archivo de la raiz o con otro libro', () => {
  assert.throws(() => comprobarRutas(['ahava', 'portal']), /«portal».*direccion que ya es de la web/s);
  assert.throws(() => comprobarRutas(['ahava', 'misitio'], ['MiSitio']), /«misitio».*raiz de la web/s);
  assert.throws(() => comprobarRutas(['ahava', 'ahava']), /repetido/);
  assert.throws(() => comprobarRutas(['con-guion']), /sin guiones/);
  assert.throws(() => comprobarRutas([5]), /enlace corto/);
});

console.log('enlace corto: una pagina por libro y su vista previa');
ok('urlAbsoluta: con dominio, sin // ni .. ni esquemas', () => {
  assert.equal(urlAbsoluta(SITIO, 'books/ahava/es/01-900.jpg'), 'https://juanjolopezramirez.com/books/ahava/es/01-900.jpg');
  assert.equal(urlAbsoluta(SITIO, '/assets/img/me-quote.jpg'), 'https://juanjolopezramirez.com/assets/img/me-quote.jpg');
  for (const mala of ['//otro.sitio/x.jpg', 'https://otro.sitio/x.jpg', 'javascript:alert(1)', '../x', 'a b', '', null]) assert.equal(urlAbsoluta(SITIO, mala), null, String(mala));
  assert.equal(urlAbsoluta('', 'x.jpg'), null);
});
ok('recortarTexto: una frase entera si cabe; si no, una palabra entera con «…»', () => {
  const t = 'Ahavá es amor que se decide más que se siente: como quien defiende a un desconocido del linchamiento aunque le cueste seguidores. No espera «tener ganas»; quiere el bien del otro y actúa por él.';
  assert.equal(recortarTexto(t), 'Ahavá es amor que se decide más que se siente: como quien defiende a un desconocido del linchamiento aunque le cueste seguidores.');
  const largo = 'palabra '.repeat(60);
  const r = recortarTexto(largo, 50);
  assert.ok(r.endsWith('…') && r.length <= 50 && !/palabr…$/.test(r), r);
  assert.equal(recortarTexto('  corto   y\nlimpio '), 'corto y limpio');
  assert.equal(recortarTexto(null), '');
});
ok('portadaDeLibro: la primera pagina del PDF a 900 px, con sus medidas; sin PDF, null', () => {
  const ahava = LIBROS.find((l) => l.id === 'ahava');
  const p = portadaDeLibro(ahava, BOOKS);
  assert.deepEqual([p.ruta, p.ancho, p.alto], ['books/ahava/es/01-900.jpg', 900, Math.round(900 / BOOKS.ahava.es.ratio)]);
  assert.equal(portadaDeLibro(LIBROS.find((l) => l.id === 'emet'), BOOKS), null);
});
ok('ogDeLibro: titulo, descripcion, imagen ABSOLUTA, url corta, tipo, locale y medidas', () => {
  const og = ogDeLibro({ id: 'ahava', titulo: 'Ahavá', glosa: 'Amor', resumen: '', idioma: 'es', origen: SITIO, imagen: { ruta: 'books/ahava/es/01-900.jpg', ancho: 900, alto: 1273, v: 'abc' } });
  assert.equal(og.title, 'Ahavá · Amor');
  assert.equal(og.description, 'Amor. Un libro de Juan José López Ramírez.');
  assert.equal(og.image, 'https://juanjolopezramirez.com/books/ahava/es/01-900.jpg?v=abc');
  assert.equal(og.url, 'https://juanjolopezramirez.com/ahava/');
  assert.deepEqual([og.type, og.locale, og.imageWidth, og.imageHeight], ['book', 'es_LA', 900, 1273]);
  assert.equal(og.imageAlt, 'Portada de «Ahavá»');
  /* sin glosa ni resumen: una frase corta */
  assert.match(ogDeLibro({ id: 'x', titulo: 'X', glosa: '', idioma: 'zz', origen: SITIO, imagen: OG_RESPALDO }).description, /^Un libro de Juan José López Ramírez, en su biblioteca de Recursos\.$/);
  assert.equal(ogDeLibro({ id: 'x', titulo: 'X', idioma: 'zz', origen: SITIO, imagen: OG_RESPALDO }).locale, null);
  /* un id reservado, o un dominio roto, no dan etiquetas */
  assert.equal(ogDeLibro({ id: 'portal', titulo: 'X', origen: SITIO, imagen: OG_RESPALDO }), null);
  assert.equal(ogDeLibro({ id: 'x', titulo: 'X', origen: '', imagen: OG_RESPALDO }), null);
  assert.ok(Object.keys(OG_LOCALES).every((l) => ['es', 'en', 'pt', 'fr', 'it'].includes(l)));
});
ok('una pagina por libro: ahava, emet, agape, rhema; cada una con su vista previa completa', () => {
  const lista = enlacesDeLibros(SITIO, raiz);
  /* los que se pueden abrir en algun idioma (un libro del panel sin PDF convertido no sale ni en la estanteria) */
  assert.deepEqual(lista.map((l) => l.id), LIBROS.filter((l) => fichaLibro(l, 'es', { BOOKS, TIPOS, TERMS, GLOSS }, '/')).map((l) => l.id));
  for (const id of ['ahava', 'emet', 'agape', 'rhema']) assert.ok(lista.some((l) => l.id === id), id);
  for (const l of lista) {
    const og = l.og;
    assert.ok(og.title && og.description, l.id);
    assert.equal(og.url, `${SITIO}/${l.id}/`);
    assert.match(og.image, /^https:\/\/juanjolopezramirez\.com\/[a-z0-9/._-]+\.jpg(\?v=[a-z0-9]+)?$/, l.id);
    assert.ok(og.imageWidth >= 600 && og.imageHeight > 0, l.id);
    assert.ok(og.description.length <= 160, l.id);
    assert.ok(og.imageAlt.includes(og.title.split(' · ')[0]), l.id);
  }
  const ahava = lista.find((l) => l.id === 'ahava').og;
  assert.equal(ahava.image, `${SITIO}/books/ahava/es/01-900.jpg?v=${BOOKS.ahava.es.v}`);
  assert.equal(lista.find((l) => l.id === 'emet').og.image, `${SITIO}/${OG_RESPALDO.ruta}`);
});
ok('las imagenes de la vista previa existen en el disco, miden ≥ 600 px y pesan menos de 300 KB', () => {
  for (const l of enlacesDeLibros(SITIO, raiz)) {
    if (l.liviana) continue;   // se arma al compilar (otra prueba)
    const ruta = new URL(l.og.image).pathname.replace(/^\//, '');
    const archivo = path.join(raiz, 'public', ruta);
    assert.ok(fs.existsSync(archivo), ruta);
    assert.ok(fs.statSync(archivo).size < 300 * 1024, `${ruta}: ${fs.statSync(archivo).size}`);
  }
});
ok('si la portada pesa mas que OG_MAX_BYTES, se ofrece /<id>/portada.jpg (liviana, 700 px) y se marca para aligerar', () => {
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TEMP || process.env.TMP || '/tmp'), 'og-'));
  try {
    const carpeta = path.join(tmp, 'public', 'books', 'ahava', 'es');
    fs.mkdirSync(carpeta, { recursive: true });
    fs.writeFileSync(path.join(carpeta, '01-900.jpg'), Buffer.alloc(OG_MAX_BYTES + 1024, 7));
    const a = enlacesDeLibros(SITIO, tmp).find((l) => l.id === 'ahava');
    assert.equal(a.liviana, path.join(carpeta, '01-900.jpg'));
    assert.equal(a.og.image, `${SITIO}/ahava/portada.jpg?v=${BOOKS.ahava.es.v}`);
    assert.equal(a.og.imageWidth, ANCHO_LIVIANA);
    assert.ok(ANCHO_LIVIANA >= 600);
    /* si la portada no esta, se usa la foto de siempre y no se rompe nada */
    const sin = enlacesDeLibros(SITIO, path.join(tmp, 'vacio')).find((l) => l.id === 'ahava');
    assert.equal(sin.liviana, null);
    assert.equal(sin.og.image, `${SITIO}/${OG_RESPALDO.ruta}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

console.log('enlace corto: las paginas y el boton «Copiar enlace»');
ok('la pagina del libro: noindex, canonical a la larga, vista previa, enlace de respaldo y refresco solo sin JavaScript', () => {
  const p = leerFuente('src/pages/[book]/index.astro');
  assert.match(p, /<meta name="robots" content="noindex, follow"/);
  assert.match(p, /<link rel="canonical" href=\{larga\}/);
  assert.match(p, /<OpenGraph og=\{og\}/);
  assert.match(p, /<noscript><meta http-equiv="refresh"/);
  assert.match(p, /class="enlace__abrir" href=/);
  assert.match(p, /enlacesDeLibros\(/);
  assert.ok(!/<script[^>]*\bsrc=/.test(p), 'sin guiones de fuera: la politica de contenido solo pone huella a los de adentro');
});
ok('no esta en el mapa del sitio', () => {
  const s = leerFuente('src/pages/sitemap.xml.js');
  assert.ok(!/enlaces-libros|LIBROS|biblioteca/.test(s));
});
ok('Base.astro: la vista previa es opcional (`og`) y solo se emite si se pasa', () => {
  const b = leerFuente('src/layouts/Base.astro');
  assert.match(b, /og = null/);
  assert.match(b, /\{og && <OpenGraph og=\{og\} \/>\}/);
  assert.ok(!/og:title|og:image/.test(b), 'las etiquetas viven en OpenGraph.astro');
  const o = leerFuente('src/components/OpenGraph.astro');
  for (const k of ['og:title', 'og:description', 'og:image"', 'og:image:width', 'og:image:height', 'og:image:alt', 'og:url', 'og:type', 'og:locale', 'twitter:card']) assert.ok(o.includes(k), k);
  assert.match(o, /summary_large_image/);
});
ok('«Copiar enlace»: el boton nace escondido, no sale en el libro privado y usa el dominio de `site`', () => {
  const p = leerFuente('src/components/Panels.astro');
  assert.match(p, /<button class="book-panel__enlace"[^>]*data-book-copiar[^>]*\shidden>/);
  const s = leerFuente('src/scripts/site.js');
  assert.match(s, /copiarBtn\.hidden = privado\.has\(id\) \|\| !LIBRO\.has\(id\)/);
  assert.match(s, /enlaceCorto\(import\.meta\.env\.SITE, id\)/);
  assert.ok(!/location\.origin/.test(s.slice(s.indexOf('copiarBtn'), s.indexOf('copiarBtn') + 4000)), 'copia el dominio del sitio, no el de donde se abrio');
});
ok('«Copiar enlace» y «Enlace copiado» estan en los cinco idiomas, sin repetirse', () => {
  for (const l of LANGS) {
    for (const k of ['book.copy', 'book.copied', 'book.copyFail', 'a11y.bookCopy', 'enlace.rotulo', 'enlace.abriendo', 'enlace.abrir']) assert.ok(typeof UI[l][k] === 'string' && UI[l][k].length > 2, `${l} ${k}`);
  }
  assert.equal(UI.es['book.copy'], 'Copiar enlace');
  assert.equal(UI.es['book.copied'], 'Enlace copiado');
  /* una clave de UI repetida dentro de un idioma la pisa en silencio */
  const fuente = leerFuente('src/i18n/ui.js');
  for (const k of ['book.copy', 'book.copied', 'book.copyFail', 'a11y.bookCopy', 'enlace.rotulo', 'enlace.abriendo', 'enlace.abrir']) assert.equal(fuente.split(`'${k}':`).length - 1, LANGS.length, k);
});

console.log('enlace corto: revision (titulos hostiles, portada pesada, guion de la pagina)');
const oka = async (nombre, fn) => { try { await fn(); n++; console.log('  ok  ' + nombre); } catch (e) { mal++; console.log(' MAL  ' + nombre + ' | ' + String(e.message).split('\n')[0]); } };
ok('ogDeLibro: un titulo o glosa con saltos de linea, U+2028 o U+2029 sale en UNA linea en title, alt y descripcion', () => {
  const og = ogDeLibro({ id: 'x', titulo: 'Linea uno\nlinea dos\u2028tres\u2029cuatro\r\n  cinco', glosa: 'sub\ntitulo\u2028raro.', idioma: 'es', origen: SITIO, imagen: OG_RESPALDO });
  for (const campo of [og.title, og.imageAlt, og.description]) assert.ok(!/[\n\r\u2028\u2029]/.test(campo), JSON.stringify(campo));
  assert.equal(og.title, 'Linea uno linea dos tres cuatro cinco · sub titulo raro');
  assert.equal(og.imageAlt, 'Portada de «Linea uno linea dos tres cuatro cinco»');
  /* un titulo que es solo espacios y saltos cae al id */
  assert.equal(ogDeLibro({ id: 'x', titulo: ' \n\u2028\u2029 ', origen: SITIO, imagen: OG_RESPALDO }).title, 'x');
});
await oka('aligerar: una portada de ruido de mas de 250 KB baja a OG_MAX_BYTES (si `sharp` carga) y, si no carga, se sirve la original sin fallar', async () => {
  let sharp = null;
  try { sharp = (await import('sharp')).default; } catch (e) { /* sin sharp en este equipo */ }
  /* la rama SIN sharp, siempre */
  const aviso = []; const avisar = console.warn; console.warn = (m) => aviso.push(m);
  const orig = Buffer.alloc(OG_MAX_BYTES + 5000, 3);
  try {
    const r = await aligerar(orig, { cargarSharp: () => Promise.reject(new Error('no carga')) });
    assert.equal(r.aligerada, false);
    assert.equal(r.buffer, orig);
    assert.ok(aviso.length === 1 && /sharp/.test(aviso[0]), 'avisa en el registro');
  } finally { console.warn = avisar; }
  if (sharp) {
    const ruido = await sharp({ create: { width: 1800, height: 2400, channels: 3, noise: { type: 'gaussian', mean: 128, sigma: 70 } } }).jpeg({ quality: 95 }).toBuffer();
    assert.ok(ruido.length > OG_MAX_BYTES, `el ruido pesa ${ruido.length}`);
    const r = await aligerar(ruido);
    assert.equal(r.aligerada, true);
    assert.ok(r.buffer.length <= OG_MAX_BYTES, `pesa ${r.buffer.length}`);
    const m = await sharp(r.buffer).metadata();
    assert.ok(m.width >= 600 && m.format === 'jpeg', `${m.width} ${m.format}`);
  }
});
await oka('el guion en linea de dist/ahava/index.html (con un navigator simulado): es-CO → es, pt-BR → pt, zh → es', async () => {
  const html = path.join(raiz, 'dist', 'ahava', 'index.html');
  if (!fs.existsSync(html)) { console.log('      (sin dist/: se salta; corre despues de `astro build`)'); return; }
  const vm = await import('node:vm');
  const guion = [...fs.readFileSync(html, 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('location.replace'));
  assert.ok(guion, 'hay un guion con la redireccion');
  const destino = (nav) => { let ir = null; vm.runInNewContext(guion, { navigator: nav, location: { replace: (u) => { ir = u; } } }); return ir; };
  assert.equal(destino({ languages: ['es-CO', 'es'], language: 'es-CO' }), '/es/writing/#ahava');
  assert.equal(destino({ languages: ['pt-BR'], language: 'pt-BR' }), '/pt/writing/#ahava');
  assert.equal(destino({ languages: ['zh'], language: 'zh' }), '/es/writing/#ahava');
  assert.equal(destino({ languages: [], language: 'fr-FR' }), '/fr/writing/#ahava');
  assert.equal(destino({ languages: ['zh-CN', 'en-GB'], language: 'zh-CN' }), '/en/writing/#ahava');
});

console.log(`\n${n} bien${mal ? `, ${mal} MAL` : ''}`);
process.exit(mal ? 1 : 0);
