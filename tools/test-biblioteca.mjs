/* Pruebas de las piezas puras de la biblioteca. Sin dependencias:

     node tools/test-biblioteca.mjs

   Prueban src/scripts/biblioteca.js (la ancla, lo guardado, que idioma abre
   cada libro, el grosor del lomo y la comprobacion de la compilacion) con los
   datos de verdad y con datos de mentira. Se paran con codigo 1 si algo falla. */
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

const { idDeHash, leerUltimo, guardarUltimo, CLAVE, variante, grosorDe, comprobar, ORDEN, colorLomo, contraste, ola, GIRO_MAX } = await cargar('src/scripts/biblioteca.js');
const { SECCIONES, TIPOS, LIBROS } = await cargar('src/data/biblioteca.js');
const { BOOKS } = await cargar('src/data/books.js');
const { TERMS } = await cargar('src/i18n/terms.js');
const { GLOSS, CARDS } = await cargar('src/i18n/term-cards.js');
const { DEEP } = await cargar('src/i18n/term-book.js');

let n = 0;
let mal = 0;
const ok = (nombre, fn) => {
  try { fn(); n++; console.log('  ok  ' + nombre); } catch (e) { mal++; console.log(' MAL  ' + nombre + '\n      ' + String(e.message).split('\n')[0]); }
};
const real = { SECCIONES, TIPOS, LIBROS, BOOKS, TERMS, GLOSS, CARDS, DEEP };
const con = (cambios) => ({ ...real, ...cambios });
const generico = (extra) => ({ id: 'prueba', seccion: 'teologia', tipo: 'tapa-dura', idiomas: ['es'], titulo: { es: 'Prueba', en: 'Test' }, ...extra });
const hechos = (id, idiomas, pages = 12, ratio = 0.7143) => ({ [id]: Object.fromEntries(idiomas.map((l) => [l, { pages, ratio, v: 'abc', board: ['#000', '#000'] }])) });

console.log('datos de verdad');
ok('la comprobacion pasa con los libros de hoy', () => comprobar(real));
ok('hay 7 temas y los 4 libros de palabra son revistas', () => {
  assert.equal(SECCIONES.length, 7);
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
ok('un titulo muy largo AVISA, no para', () => {
  const largo = 'x'.repeat(60);
  const avisos = bien({ LIBROS: [...LIBROS, generico({ titulo: { es: largo, en: 'T' } })], BOOKS: { ...BOOKS, ...hechos('prueba', ['es']) } });
  assert.ok(avisos.some((a) => /60 letras/.test(a)));
});
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

console.log(`\n${n} bien${mal ? `, ${mal} MAL` : ''}`);
process.exit(mal ? 1 : 0);
