/* Pruebas del contenido que se edita en Developer-Mode (src/scripts/contenido/). Sin
   dependencias:

     node tools/test-contenido.mjs

   Las piezas (Libro, Trabajo, Proyecto, Etapa, los bloques del editor, las medidas
   de lomos y portadas, el aviso de IA) son puras: sin DOM, sin red. Las usa el panel
   al guardar y las usara la compilacion al leer lo publicado, asi que lo que una
   deja pasar la otra tambien. Se prueban con datos buenos y con datos HOSTILES: un
   enlace `javascript:`, un `__proto__`, un JSON enorme, columnas dentro de columnas.
   Se para con codigo 1 si algo falla. */
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);
const leer = (ruta) => fs.readFileSync(path.join(raiz, ruta), 'utf8');

const C = await cargar('src/scripts/contenido/comun.js');
const M = await cargar('src/scripts/contenido/medidas.js');
const IA = await cargar('src/scripts/contenido/ia.js');
const { Libro } = await cargar('src/scripts/contenido/Libro.js');
const { Casa, Trabajo, Proyecto } = await cargar('src/scripts/contenido/Casa.js');
const { Etapa } = await cargar('src/scripts/contenido/Etapa.js');
const B = await cargar('src/scripts/contenido/bloques.js');
const { Documento } = await cargar('src/scripts/contenido/Documento.js');
const { TipoDeContenido } = await cargar('src/scripts/contenido/Tipo.js');
const R = await cargar('src/scripts/contenido/Repositorio.js');

let n = 0;
let mal = 0;
const ok = async (nombre, fn) => {
  try { await fn(); n++; console.log('  ok  ' + nombre); } catch (e) { mal++; console.log(' MAL  ' + nombre + '\n      ' + String(e.message).split('\n')[0]); }
};
/* Las claves de error de un resultado, para comparar sin depender del orden */
const claves = (r) => r.errores.map((e) => `${e.campo}:${e.clave}`);
const tieneError = (r, campo, clave) => r.errores.some((e) => e.campo === campo && (!clave || e.clave === clave));

console.log('comun.js · lo que llega de fuera');
await ok('texto(): limpia, recorta y lo que no es texto da ""', () => {
  assert.equal(C.texto('  hola\u0000 mundo  ', 80), 'hola mundo');
  assert.equal(C.texto('abcdef', 3), 'abc');
  for (const raro of [null, undefined, 5, {}, [], { toString: () => 'x' }]) assert.equal(C.texto(raro, 10), '');
  assert.equal(C.texto('a‮b​c', 10), 'abc');                // ni lo invisible ni lo que da la vuelta al texto
});
await ok('los idiomas del panel son los mismos que acepta tools/books.py para un libro', () => {
  const py = leer('tools/books.py').match(/^BOOK_LANGS = \{([^}]+)\}/m);
  assert.ok(py, 'no encontre BOOK_LANGS');
  const deBooks = [...py[1].matchAll(/'([a-z]{2})'/g)].map((m) => m[1]).sort();
  assert.deepEqual(deBooks, C.IDIOMAS.map((i) => i.id).sort());
});
await ok('idiomaValido: un codigo de dos letras de la lista; idiomaNombre lo dice en español', () => {
  for (const l of ['es', 'en', 'pt', 'fr', 'it', 'de', 'he']) assert.ok(C.idiomaValido(l), l);
  for (const raro of ['ES', 'esp', 'e', '', null, '__proto__', 'constructor', 'zz', '../']) assert.ok(!C.idiomaValido(raro), String(raro));
  assert.equal(C.idiomaNombre('pt'), 'Portugués');
  assert.ok(C.IDIOMAS.length >= 10);
});
await ok('i18n(): solo idiomas validos y texto limpio; el resto se cae', () => {
  const o = C.i18n({ es: ' Hola ', en: 'Hi', zz: 'x', __proto__: { malo: 1 }, constructor: 'y', pt: 7 }, 50);
  assert.deepEqual(o, { es: 'Hola', en: 'Hi' });
  assert.deepEqual(C.i18n(null, 10), {});
  assert.deepEqual(C.i18n('hola', 10), {});
  assert.equal(Object.getPrototypeOf(C.i18n({ es: 'a' }, 5)), Object.prototype);
});
await ok('etiquetas(): sin repetir, cortas, como mucho 12', () => {
  assert.deepEqual(C.etiquetas([' Fe ', 'fe', 'Diseño', '', 5, 'x'.repeat(50)]), ['Fe', 'Diseño', 'x'.repeat(30)]);
  assert.equal(C.etiquetas(Array.from({ length: 40 }, (_, i) => 'e' + i)).length, 12);
  assert.deepEqual(C.etiquetas('no es lista'), []);
});
await ok('enlaceSeguro: https, mailto y rutas propias; nada de javascript:, data:, // ni http', () => {
  for (const b of ['https://fraterni.co', 'mailto:hola@juanjolopezramirez.com', '/es/projects/', '/es/writing/#ahava']) assert.ok(C.enlaceSeguro(b), b);
  for (const m of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'data:text/html,x', '//evil.com', 'http://x.com',
    'vbscript:x', '/\\evil.com', 'https://', '', null, 'https://x.com/a b', 'mailto:', '/es/<script>']) {
    assert.ok(!C.enlaceSeguro(m), String(m));
  }
});
await ok('ruta del almacen: solo carpetas conocidas, nombre sencillo y extension permitida', () => {
  assert.ok(C.rutaAlmacen('libros/libertad/es.pdf', ['pdf']));
  assert.ok(C.rutaAlmacen('lomos/libertad.es.png', ['png', 'webp']));
  for (const m of ['../libros/x.pdf', 'libros/../../x.pdf', '/libros/x.pdf', 'libros/x.PDF', 'libros/x.pdf.exe', 'libros//x.pdf', 'otra/x.pdf', 'libros/x y.pdf', null]) {
    assert.ok(!C.rutaAlmacen(m, ['pdf']), String(m));
  }
  assert.ok(!C.rutaAlmacen('lomos/x.svg', ['png', 'webp']), 'un SVG subido no entra (puede llevar codigo)');
});

console.log('medidas.js · lomos, portadas y cabeceras');
await ok('las tres medidas de lomo, a 1200 de alto, y lomos.js usa ESTAS mismas', () => {
  assert.deepEqual(M.LOMOS.fino.ejemplo, { w: 240, h: 1200 });
  assert.deepEqual(M.LOMOS.medio.ejemplo, { w: 300, h: 1200 });
  assert.deepEqual(M.LOMOS.grueso.ejemplo, { w: 375, h: 1200 });
  assert.equal(M.TOLERANCIA, 0.04);
  assert.match(leer('src/data/lomos.js'), /from '\.\.\/scripts\/contenido\/medidas\.js'/);
});
await ok('revisar(): el tamaño justo, el doble y un 3% de mas pasan; un 5% o al reves no', () => {
  const r = M.LOMOS.medio;
  assert.ok(r.revisar({ w: 300, h: 1200 }).ok);
  assert.ok(r.revisar({ w: 600, h: 2400 }).ok);
  assert.ok(r.revisar({ w: 309, h: 1200 }).ok);
  const malo = r.revisar({ w: 316, h: 1200 });
  assert.equal(malo.ok, false);
  assert.equal(malo.clave, 'proporcion');
  assert.deepEqual(malo.esperado, { w: 300, h: 1200 });
  assert.equal(r.revisar({ w: 1200, h: 300 }).ok, false);
  for (const raro of [null, {}, { w: 0, h: 10 }, { w: -1, h: 5 }, { w: NaN, h: 3 }, { w: 'x', h: 2 }]) assert.equal(r.revisar(raro).clave, 'sinMedidas');
});
await ok('revisar(): muy pequeño tambien avisa (se veria borroso)', () => {
  assert.equal(M.LOMOS.fino.revisar({ w: 24, h: 120 }).clave, 'pequeno');
  assert.ok(M.LOMOS.fino.revisar({ w: 120, h: 600 }).ok);
});
await ok('grosorSugerido: las mismas reglas que la estanteria (biblioteca.js → grosorDe)', () => {
  assert.equal(M.grosorSugerido(12, 'tapa-dura'), 'fino');
  assert.equal(M.grosorSugerido(13, 'tapa-dura'), 'medio');
  assert.equal(M.grosorSugerido(41, 'tapa-dura'), 'grueso');
  assert.equal(M.grosorSugerido(40, 'revista'), 'fino');
  assert.equal(M.grosorSugerido(41, 'revista'), 'medio');
  assert.equal(M.grosorSugerido(undefined, 'tapa-dura'), 'fino');
});
await ok('portadas por tipo de libro, y las medidas de las casas (cabecera y avatar)', () => {
  assert.ok(M.PORTADAS['tapa-dura'].revisar({ w: 1600, h: 2240 }).ok);
  assert.ok(M.PORTADAS.revista.revisar({ w: 1600, h: 2263 }).ok);
  assert.ok(M.PORTADAS.comic.revisar({ w: 1600, h: 2462 }).ok);
  assert.ok(!M.PORTADAS.comic.revisar({ w: 1600, h: 2240 }).ok);
  assert.ok(M.CABECERA.revisar({ w: 1600, h: 420 }).ok);
  assert.ok(M.AVATAR.revisar({ w: 512, h: 300 }).ok, 'el avatar no tiene proporcion fija, solo tamaño');
  assert.equal(M.AVATAR.revisar({ w: 100, h: 60 }).clave, 'pequeno');
  /* Cada regla sabe contarse: lo que el panel enseña para recordar la medida */
  for (const regla of [...Object.values(M.LOMOS), ...Object.values(M.PORTADAS), M.CABECERA, M.AVATAR]) {
    assert.ok(regla.nombre && regla.ejemplo.w > 0 && regla.ejemplo.h > 0 && regla.formatos.length, regla.nombre);
    assert.ok(!regla.formatos.includes('svg'), 'nada de SVG subido');
  }
});
await ok('los tipos de libro de medidas.js son los de biblioteca.js', async () => {
  const BIB = await cargar('src/data/biblioteca.js');
  assert.deepEqual(Object.keys(M.PORTADAS).sort(), Object.keys(BIB.TIPOS).sort());
  for (const [t, v] of Object.entries(BIB.TIPOS)) assert.equal(M.PORTADAS[t].ratio, v.ratio, t);
});

console.log('ia.js · avisar lo que hizo la IA');
await ok('UsoDeIA: partes de una lista, traducciones por idioma y una nota corta', () => {
  const u = new IA.UsoDeIA({ partes: ['portada', 'texto', 'magia', 'portada'], traducciones: ['en', 'zz', 'en'], nota: '  La portada la hice con IA.  ' });
  assert.deepEqual(u.partes, ['portada', 'texto']);
  assert.deepEqual(u.traducciones, ['en']);
  assert.equal(u.nota, 'La portada la hice con IA.');
  assert.ok(u.hay);
  assert.ok(!new IA.UsoDeIA().hay);
  assert.ok(!new IA.UsoDeIA(null).hay);
  assert.ok(new IA.UsoDeIA({ nota: 'x'.repeat(900) }).nota.length <= IA.NOTA_MAX);
});
await ok('UsoDeIA: una traduccion con IA no puede ser la del idioma original', () => {
  const u = new IA.UsoDeIA({ traducciones: ['es', 'en'] });
  const r = u.validar('es');
  assert.ok(!r.ok && tieneError(r, 'ia.traducciones', 'original'));
  assert.ok(new IA.UsoDeIA({ traducciones: ['en'] }).validar('es').ok);
});
await ok('UsoDeIA: ida y vuelta a la fila sin perder nada', () => {
  const u = new IA.UsoDeIA({ partes: ['imagenes'], traducciones: ['pt'], nota: 'Hola' });
  assert.deepEqual(new IA.UsoDeIA(u.aFila()).aFila(), u.aFila());
});

console.log('Tipo.js · la base de todo contenido');
await ok('TipoDeContenido: no se usa sola, y todo hijo dice su tabla', () => {
  assert.throws(() => new TipoDeContenido({}), /hija/);
  for (const T of [Libro, Trabajo, Proyecto, Etapa]) assert.match(T.tabla, /^[a-z_]+$/, T.name);
});
await ok('textoEn(campo, idioma): el idioma pedido, si no el original, si no el español', () => {
  const e = new Etapa({ id: 'x', cuando: '2020', idiomaOriginal: 'pt', titulo: { pt: 'Olá', es: 'Hola' }, texto: { pt: 'Um' } });
  assert.equal(e.textoEn('titulo', 'pt'), 'Olá');
  assert.equal(e.textoEn('titulo', 'fr'), 'Olá');
  assert.equal(e.textoEn('texto', 'es'), 'Um');
  assert.equal(e.textoEn('nada', 'es'), '');
  assert.equal(e.textoEn('titulo', '__proto__'), 'Olá');
  /* y dice en que idioma salio, para la marca «Escrito en portugués» */
  assert.equal(e.idiomaDe('titulo', 'fr'), 'pt');
  assert.equal(e.idiomaDe('titulo', 'es'), 'es');
});
await ok('lo publicado y lo borrador: publicado solo si es true de verdad', () => {
  assert.equal(new Etapa({ publicado: 'true' }).publicado, false);
  assert.equal(new Etapa({ publicado: 1 }).publicado, false);
  assert.equal(new Etapa({ publicado: true }).publicado, true);
});

console.log('Libro.js');
const libroBueno = () => ({
  id: 'libertad', seccion: 'contrabando', tipo: 'tapa-dura', idiomaOriginal: 'es',
  titulo: { es: 'Libertad', en: 'Freedom' }, subtitulo: { es: 'Un libro' },
  pdf: { es: 'libros/libertad/es.pdf', en: 'libros/libertad/en.pdf' },
  lomo: { es: 'lomos/libertad.es-a1b2c3.png' }, etiquetas: ['fe', 'libertad'],
  ia: { traducciones: ['en'], partes: ['portada'] }
});
await ok('un libro bueno pasa', () => {
  const r = new Libro(libroBueno()).validar();
  assert.deepEqual(claves(r), []);
  assert.ok(r.ok);
});
await ok('id: una palabra en minusculas, sin las anclas de la pagina ni los libros de una palabra', () => {
  for (const id of ['', 'Libertad', 'libre-mente', 'libro 2', '2libros', 'book', 'ahava', 'emet', '__proto__', 'x'.repeat(41)]) {
    assert.ok(tieneError(new Libro({ ...libroBueno(), id }).validar(), 'id'), id);
  }
});
await ok('los otros nombres de books.py (ALIAS) tampoco valen: taparian el PDF de un libro de una palabra', async () => {
  const py = leer('tools/books.py').match(/^ALIAS = \{([^}]+)\}/m);
  const alias = [...py[1].matchAll(/'([a-z]+)':/g)].map((m) => m[1]);
  const { ALIAS_DE_BOOKS } = await cargar('src/scripts/contenido/Libro.js');
  assert.deepEqual([...alias].sort(), [...ALIAS_DE_BOOKS].sort());
  for (const id of alias) assert.ok(tieneError(new Libro({ ...libroBueno(), id }).validar(), 'id', 'reservado'), id);
});
await ok('RepositorioMemoria: algo NUEVO con un id que ya existe no lo pisa', async () => {
  const repo = new R.RepositorioMemoria(Libro);
  assert.ok((await repo.guardarBorrador(new Libro(libroBueno()), { nuevo: true })).ok);
  const otro = new Libro({ ...libroBueno(), titulo: { es: 'Otro libro' } });
  assert.equal((await repo.guardarBorrador(otro, { nuevo: true })).error, 'repetido');
  const [e] = (await repo.listar()).entradas;
  assert.equal(e.actual.titulo.es, 'Libertad', 'el de antes sigue igual');
  assert.ok((await repo.guardarBorrador(otro)).ok, 'editarlo (no nuevo) si lo cambia');
  /* Y uno publicado tambien ocupa su nombre */
  const pub = new R.RepositorioMemoria(Libro);
  assert.ok((await pub.publicar(new Libro(libroBueno()))).ok);
  assert.equal((await pub.guardarBorrador(otro, { nuevo: true })).error, 'repetido');
});
await ok('seccion, tipo, grosor y tono: solo de sus listas', () => {
  assert.ok(tieneError(new Libro({ ...libroBueno(), seccion: 'nada' }).validar(), 'seccion'));
  assert.ok(tieneError(new Libro({ ...libroBueno(), tipo: 'pergamino' }).validar(), 'tipo'));
  assert.ok(tieneError(new Libro({ ...libroBueno(), grosor: 'enorme' }).validar(), 'grosor'));
  assert.ok(tieneError(new Libro({ ...libroBueno(), tono: 'fucsia' }).validar(), 'tono'));
  assert.ok(new Libro({ ...libroBueno(), grosor: 'grueso', tono: 'salvia' }).validar().ok);
});
await ok('el idioma original es obligatorio, valido, y tiene titulo y PDF', () => {
  assert.ok(tieneError(new Libro({ ...libroBueno(), idiomaOriginal: 'zz' }).validar(), 'idiomaOriginal'));
  assert.ok(tieneError(new Libro({ ...libroBueno(), titulo: { en: 'Freedom' } }).validar(), 'titulo', 'falta'));
  assert.ok(tieneError(new Libro({ ...libroBueno(), pdf: { en: 'libros/libertad/en.pdf' } }).validar(), 'pdf', 'falta'));
  /* Un libro escrito en portugues, solo en portugues: vale */
  assert.ok(new Libro({ ...libroBueno(), idiomaOriginal: 'pt', titulo: { pt: 'Liberdade' }, pdf: { pt: 'libros/libertad/pt.pdf' }, lomo: {}, ia: {} }).validar().ok);
});
await ok('un PDF o un lomo fuera de su carpeta, o de otro libro, no entra', () => {
  assert.ok(tieneError(new Libro({ ...libroBueno(), pdf: { es: '../secreto.pdf' } }).validar(), 'pdf'));
  assert.ok(tieneError(new Libro({ ...libroBueno(), pdf: { es: 'libros/otro/es.pdf' } }).validar(), 'pdf', 'ajeno'));
  assert.ok(tieneError(new Libro({ ...libroBueno(), lomo: { es: 'lomos/libertad.es-a1b2c3.svg' } }).validar(), 'lomo'));
  assert.ok(tieneError(new Libro({ ...libroBueno(), lomo: { es: 'lomos/otro.es-a1b2c3.png' } }).validar(), 'lomo', 'ajeno'));
});
await ok('los textos largos se cortan y el titulo largo AVISA (en el lomo automatico no cabe)', () => {
  const l = new Libro({ ...libroBueno(), titulo: { es: 'x'.repeat(500) } });
  assert.ok(l.titulo.es.length <= 120);
  const r = l.validar();
  assert.ok(r.avisos.some((a) => a.clave === 'tituloLargo'));
});
await ok('rutas: Libro sabe donde va su PDF y su lomo', () => {
  assert.equal(Libro.rutaPdf('libertad', 'es'), 'libros/libertad/es.pdf');
  assert.equal(Libro.rutaLomo('libertad', 'en', 'png', 'a1b2c3'), 'lomos/libertad.en-a1b2c3.png');
  assert.equal(Libro.rutaLomo('libertad', 'en', 'webp', 'a1b2c3'), null, 'la estanteria mide PNG (data/lomos.js), no WebP');
  assert.equal(Libro.rutaLomo('libertad', null, 'png', 'a1b2c3'), 'lomos/libertad-a1b2c3.png');
  assert.equal(Libro.rutaLomo('libertad', 'es', 'png'), null, 'sin su trozo al azar no hay ruta: el lomo de un borrador no se adivina');
  assert.ok(Libro.esLomoDe('lomos/libertad.es-a1b2c3.png', 'libertad', 'es') && !Libro.esLomoDe('lomos/libertad.es.png', 'libertad', 'es'));
  assert.ok(Libro.esLomoDe('lomos/libertad-a1b2c3.png', 'libertad', 'todos') && !Libro.esLomoDe('lomos/libertad.en-a1b2c3.png', 'libertad', 'es'));
  assert.equal(Libro.rutaPdf('../x', 'es'), null);
  /* El PDF con su trozo al azar (008): el de un borrador no pisa el del libro publicado */
  assert.equal(Libro.rutaPdf('libertad', 'es', 'a1b2c3'), 'libros/libertad/es-a1b2c3.pdf');
  assert.equal(Libro.rutaPdf('libertad', 'es', 'MAL'), null);
  assert.ok(Libro.esPdfDe('libros/libertad/es-a1b2c3.pdf', 'libertad', 'es') && Libro.esPdfDe('libros/libertad/es.pdf', 'libertad', 'es'));
  assert.ok(!Libro.esPdfDe('libros/libertad/en-a1b2c3.pdf', 'libertad', 'es') && !Libro.esPdfDe('libros/otro/es-a1b2c3.pdf', 'libertad', 'es'));
  assert.ok(new Libro({ ...libroBueno(), pdf: { es: 'libros/libertad/es-a1b2c3.pdf' } }).validar().ok);
});
await ok('a medias: un BORRADOR perdona lo que falta, pero no lo que esta mal', () => {
  const medio = new Libro({ id: 'libertad', idiomaOriginal: 'es', seccion: libroBueno().seccion, tipo: libroBueno().tipo, titulo: { es: 'Libertad' } });
  assert.ok(!medio.validar().ok, 'para publicar le falta el PDF');
  const b = medio.validar({ borrador: true });
  assert.ok(b.ok, JSON.stringify(b.errores));
  assert.ok(b.faltan.some((x) => x.campo === 'pdf'), 'y dice lo que falta');
  assert.ok(!new Libro({ ...libroBueno(), pdf: { es: '../secreto.pdf' } }).validar({ borrador: true }).ok, 'una ruta ajena, ni en borrador');
  assert.ok(!new Libro({ ...libroBueno(), id: '' }).validar({ borrador: true }).ok, 'sin nombre corto no hay donde guardarlo');
});
await ok('ida y vuelta: deFila(aFila()) es el mismo libro; los campos de la base van en snake_case', () => {
  const l = new Libro(libroBueno());
  const fila = l.aFila();
  assert.equal(fila.idioma_original, 'es');
  assert.ok(Array.isArray(fila.etiquetas));
  assert.deepEqual(Libro.deFila(fila).aFila(), fila);
  assert.ok(!('publicado' in fila) || typeof fila.publicado === 'boolean');
});
await ok('una fila hostil no cuela nada', () => {
  const fila = JSON.parse('{"id":"libertad","__proto__":{"admin":true},"titulo":{"es":"<img src=x onerror=alert(1)>"},"etiquetas":"no"}');
  const l = Libro.deFila(fila);
  assert.equal(({}).admin, undefined);
  assert.equal(l.titulo.es, '<img src=x onerror=alert(1)>', 'el texto se guarda tal cual: se ESCAPA al pintarlo, nunca se interpreta');
  assert.deepEqual(l.etiquetas, []);
});

console.log('Casa.js · Trabajos y Proyectos');
const casaBuena = () => ({
  id: 'nueva-casa', name: 'Nueva Casa', idiomaOriginal: 'es',
  role: { es: 'Una casa nueva' }, blurb: { es: 'Lo que hace.' }, tags: ['comunidad'],
  logo: { src: 'casas/nueva-casa/logo.png', w: 400, h: 200, scale: 1 },
  works: [{ title: { es: 'Identidad' }, year: '2025', href: 'https://ejemplo.com' }]
});
await ok('a medias: una casa con una imagen AUN sin subir se guarda de borrador, pero no se publica', () => {
  const conImagen = (src) => new Trabajo({ ...casaBuena(), cuerpo: { es: { bloques: [{ tipo: 'imagen', alt: 'Un logo', ...(src ? { src } : {}) }] } } });
  assert.ok(conImagen().validar({ borrador: true }).ok, 'el borrador perdona la imagen que falta');
  assert.ok(!conImagen().validar().ok, 'para publicar, hace falta');
  assert.ok(!conImagen('https://evil.com/x.png').validar().ok, 'una ruta ajena se vacia y tampoco se publica');
});
await ok('Trabajo y Proyecto son Casas, cada una con su clase', () => {
  const t = new Trabajo(casaBuena());
  const p = new Proyecto(casaBuena());
  assert.ok(t instanceof Casa && p instanceof Casa);
  assert.equal(t.clase, 'trabajo');
  assert.equal(p.clase, 'proyecto');
  assert.ok(t.validar().ok, claves(t.validar()).join(','));
});
await ok('el slug: minusculas con guiones, y nunca el de una seccion de la web', () => {
  for (const id of ['work', 'projects', 'writing', 'about', 'contact', 'direct', 'meet', 'portal', 'status', 'Casa', 'casa_x', '-casa', 'casa-', 'ca--sa', '']) {
    assert.ok(tieneError(new Trabajo({ ...casaBuena(), id }).validar(), 'id'), id);
  }
  assert.ok(new Trabajo({ ...casaBuena(), id: 'casa-san-pedro2', logo: { src: 'casas/casa-san-pedro2/logo.png', w: 2, h: 1 } }).validar().ok);
  assert.ok(tieneError(new Trabajo({ ...casaBuena(), logo: null }).validar(), 'logo', 'falta'), 'sin logo la casa no tiene cara en la cinta');
  assert.ok(tieneError(new Trabajo({ ...casaBuena(), logo: { src: 'casas/nueva-casa/sub/logo.png', w: 2, h: 1 } }).validar(), 'logo'), 'un solo nivel de carpeta, como en 007');
});
await ok('las secciones reservadas son las del menu de la web (social.js), mas las paginas sueltas', async () => {
  const SOC = await cargar('src/data/social.js');
  for (const s of SOC.NAV.map((x) => x.slug)) assert.ok(Casa.RESERVADOS.includes(s), s);
});
await ok('nombre obligatorio; works con año de 4 cifras y enlace seguro', () => {
  assert.ok(tieneError(new Trabajo({ ...casaBuena(), name: '  ' }).validar(), 'name', 'falta'));
  const w = new Trabajo({ ...casaBuena(), works: [{ title: { es: 'x' }, year: '25', href: 'javascript:alert(1)' }] });
  const r = w.validar();
  assert.ok(tieneError(r, 'works.0.year') && tieneError(r, 'works.0.href'));
  assert.ok(new Trabajo({ ...casaBuena(), works: Array.from({ length: 80 }, () => ({ title: { es: 'x' }, year: '2025' })) }).works.length <= 40);
});
await ok('logo, avatar y cabecera: rutas de su casa y medidas sensatas', () => {
  assert.ok(tieneError(new Trabajo({ ...casaBuena(), logo: { src: 'casas/otra/logo.png', w: 4, h: 2 } }).validar(), 'logo', 'ajeno'));
  assert.ok(tieneError(new Trabajo({ ...casaBuena(), banner: 'casas/nueva-casa/banner.gif' }).validar(), 'banner'));
  assert.ok(new Trabajo({ ...casaBuena(), banner: 'casas/nueva-casa/banner.jpg', avatar: 'casas/nueva-casa/avatar.png' }).validar().ok);
  const c = new Trabajo({ ...casaBuena(), logo: { src: 'casas/nueva-casa/logo.png', w: 400, h: 200, scale: 99 } });
  assert.ok(c.logo.scale <= 1.3 && c.logo.scale >= 0.62, 'la escala optica se queda entre 0.62 y 1.30');
});
await ok('el cuerpo (el blog de la casa) es un Documento por idioma', () => {
  const c = new Proyecto({ ...casaBuena(), cuerpo: { es: { bloques: [{ tipo: 'parrafo', texto: [{ t: 'Hola' }] }] }, zz: { bloques: [] } } });
  assert.ok(c.cuerpo.es instanceof Documento);
  assert.ok(!('zz' in c.cuerpo));
  assert.ok(c.validar().ok, claves(c.validar()).join(','));
});

console.log('Etapa.js · Sobre el camino');
await ok('una etapa: año de 4 cifras, titulo y texto en su idioma original', () => {
  const e = new Etapa({ id: 'nueva', cuando: '2026', idiomaOriginal: 'es', titulo: { es: 'Algo' }, texto: { es: 'Pasó algo.' } });
  assert.ok(e.validar().ok, claves(e.validar()).join(','));
  assert.ok(tieneError(new Etapa({ ...e.aFila(), cuando: 'ayer' }).validar(), 'cuando'));
  assert.ok(tieneError(new Etapa({ id: 'nueva', cuando: '2026', idiomaOriginal: 'es', titulo: { es: 'A' }, texto: {} }).validar(), 'texto', 'falta'));
  assert.ok(tieneError(new Etapa({ id: 'Nueva Etapa', cuando: '2026', idiomaOriginal: 'es', titulo: { es: 'A' }, texto: { es: 'B' } }).validar(), 'id'));
});
await ok('el texto de una etapa es corto (una o dos frases, como las de camino.js)', () => {
  const e = new Etapa({ id: 'x', cuando: '2026', idiomaOriginal: 'es', titulo: { es: 'A' }, texto: { es: 'x'.repeat(400) } });
  assert.ok(e.validar().avisos.some((a) => a.clave === 'textoLargo'));
});

console.log('bloques.js y Documento.js · el editor estilo Notion');
await ok('los tipos de bloque que hay, y uno desconocido no entra', () => {
  for (const t of ['parrafo', 'titulo', 'lista', 'cita', 'imagen', 'video', 'columnas', 'boton', 'separador', 'componente']) assert.ok(B.TIPOS_DE_BLOQUE.includes(t), t);
  const d = new Documento({ bloques: [{ tipo: 'html', html: '<script>alert(1)</script>' }, { tipo: 'parrafo', texto: [{ t: 'ok' }] }] });
  assert.equal(d.bloques.length, 1);
  assert.equal(d.descartados, 1);
});
await ok('el texto va en trozos con marcas (negrita, cursiva, enlace): nunca HTML', () => {
  const p = B.crearBloque({ tipo: 'parrafo', texto: [{ t: 'Hola ', b: true }, { t: 'mundo', i: 1, href: 'https://x.com' }, { t: '<b>no</b>', html: '<b>' }] });
  assert.deepEqual(p.texto, [{ t: 'Hola ', b: true }, { t: 'mundo', i: true, href: 'https://x.com' }, { t: '<b>no</b>' }]);
  const malo = B.crearBloque({ tipo: 'parrafo', texto: [{ t: 'clic', href: 'javascript:alert(1)' }] });
  assert.equal(malo.texto[0].href, undefined, 'un enlace peligroso se quita, el texto se queda');
});
await ok('imagen: ruta del almacen, texto alternativo OBLIGATORIO y su marca de IA', () => {
  const sinAlt = B.crearBloque({ tipo: 'imagen', src: 'bloques/nueva-casa/a1.webp', alt: '' });
  assert.ok(tieneError(sinAlt.validar(), 'alt', 'falta'));
  const buena = B.crearBloque({ tipo: 'imagen', src: 'bloques/nueva-casa/a1.webp', alt: 'Un logo', ia: true });
  assert.ok(buena.validar().ok && buena.ia === true);
  assert.ok(tieneError(B.crearBloque({ tipo: 'imagen', src: 'https://evil.com/x.png', alt: 'x' }).validar(), 'src'));
  /* una imagen DECORATIVA dice que lo es: entonces el alt vacio es lo correcto */
  assert.ok(B.crearBloque({ tipo: 'imagen', src: 'bloques/nueva-casa/a1.webp', alt: '', decorativa: true }).validar().ok);
});
await ok('video: YouTube con un id de 11 letras, o una pieza de la web', () => {
  assert.ok(B.crearBloque({ tipo: 'video', fuente: 'youtube', ref: 'dQw4w9WgXcQ', titulo: 'x' }).validar().ok);
  for (const ref of ['dQw4w9WgXc', 'dQw4w9WgXcQQ', '"><script>', 'https://youtube.com/watch?v=dQw4w9WgXcQ']) {
    assert.ok(!B.crearBloque({ tipo: 'video', fuente: 'youtube', ref, titulo: 'x' }).validar().ok, ref);
  }
  assert.ok(!B.crearBloque({ tipo: 'video', fuente: 'vimeo', ref: '123', titulo: 'x' }).validar().ok);
  assert.ok(B.crearBloque({ tipo: 'video', fuente: 'pieza', ref: 'la-carta', titulo: 'x' }).validar().ok);
});
await ok('columnas: de 2 a 3, y nunca columnas dentro de columnas', () => {
  const col = (n) => Array.from({ length: n }, () => [{ tipo: 'parrafo', texto: [{ t: 'x' }] }]);
  assert.ok(B.crearBloque({ tipo: 'columnas', columnas: col(2) }).validar().ok);
  assert.ok(!B.crearBloque({ tipo: 'columnas', columnas: col(1) }).validar().ok);
  assert.ok(B.crearBloque({ tipo: 'columnas', columnas: col(5) }).columnas.length <= 3);
  const dentro = B.crearBloque({ tipo: 'columnas', columnas: [[{ tipo: 'columnas', columnas: col(2) }], [{ tipo: 'parrafo', texto: [{ t: 'x' }] }]] });
  assert.equal(dentro.columnas[0].length, 0, 'las columnas de dentro se caen');
});
await ok('boton: texto y enlace seguro; componente: solo los de la lista, con sus datos', () => {
  assert.ok(B.crearBloque({ tipo: 'boton', texto: 'Escríbeme', href: 'mailto:hola@juanjolopezramirez.com' }).validar().ok);
  assert.ok(!B.crearBloque({ tipo: 'boton', texto: 'x', href: 'javascript:alert(1)' }).validar().ok);
  assert.ok(!B.crearBloque({ tipo: 'boton', texto: '', href: '/es/' }).validar().ok);
  assert.ok(!B.crearBloque({ tipo: 'componente', nombre: 'Script', datos: {} }).validar().ok);
  assert.ok(B.COMPONENTES.length >= 1);
});
await ok('lo peligroso NO viaja en aJSON(), aunque nadie llame a validar() (security-reviewer H1)', () => {
  const d = new Documento({ bloques: [
    { tipo: 'boton', texto: 'x', href: 'javascript:alert(1)' },
    { tipo: 'video', fuente: 'youtube', ref: '"><script>alert(1)</script>', titulo: 'x' },
    { tipo: 'imagen', src: 'javascript:alert(1)', alt: 'x' },
    { tipo: 'componente', nombre: '../../etc/passwd' },
    { tipo: 'parrafo', texto: [{ t: 'x', href: 'data:text/html,<script>alert(1)</script>' }] }
  ] });
  const json = JSON.stringify(d.aJSON());
  for (const malo of ['javascript:', '<script', 'data:', '../']) assert.ok(!json.includes(malo), malo);
  assert.ok(!d.validar().ok, 'y validar() sigue diciendo que esta mal');
});
await ok('una casa: los enlaces y rutas malos tampoco viajan, y las imagenes de su pagina son SUYAS', () => {
  const c = new Trabajo({ ...casaBuena(), works: [{ title: { es: 'x' }, year: '2025', href: 'javascript:alert(1)' }], banner: '../../x.jpg' });
  assert.ok(!JSON.stringify(c.aFila()).includes('javascript:') && !JSON.stringify(c.aFila()).includes('../'));
  assert.ok(tieneError(c.validar(), 'works.0.href') && tieneError(c.validar(), 'banner'));
  const ajena = new Trabajo({ ...casaBuena(), cuerpo: { es: { bloques: [{ tipo: 'imagen', src: 'bloques/otra-casa/a.png', alt: 'x' }] } } });
  assert.ok(tieneError(ajena.validar(), 'cuerpo.es.bloques.0.src', 'ajeno'));
  const suya = new Trabajo({ ...casaBuena(), cuerpo: { es: { bloques: [{ tipo: 'imagen', src: 'bloques/nueva-casa/a.png', alt: 'x' }] } } });
  assert.ok(suya.validar().ok, claves(suya.validar()).join(','));
});
await ok('enlaceSeguro: nada invisible ni que de la vuelta al texto dentro de un enlace', () => {
  for (const m of ['mailto:a@b.co‮', 'https://evil.com/‮exe.pdf', 'https://x.co/​', '/es/⁦x']) assert.ok(!C.enlaceSeguro(m), JSON.stringify(m));
});
await ok('Documento: tope de bloques y de tamaño; ida y vuelta igual', () => {
  const muchos = { bloques: Array.from({ length: 900 }, () => ({ tipo: 'separador' })) };
  assert.ok(new Documento(muchos).bloques.length <= Documento.MAX_BLOQUES);
  const d = new Documento({ bloques: [{ tipo: 'titulo', nivel: 2, texto: [{ t: 'Hola' }] }, { tipo: 'lista', ordenada: false, items: [[{ t: 'a' }], [{ t: 'b' }]] }] });
  assert.deepEqual(new Documento(d.aJSON()).aJSON(), d.aJSON());
  const enorme = new Documento({ bloques: [{ tipo: 'parrafo', texto: Array.from({ length: 200 }, () => ({ t: 'x'.repeat(4000) })) }] });
  assert.ok(JSON.stringify(enorme.aJSON()).length <= Documento.MAX_BYTES);
});
await ok('cada bloque tiene id propio y estable (para mover y editar sin perder el sitio)', () => {
  const d = new Documento({ bloques: [{ tipo: 'separador' }, { tipo: 'separador', id: 'b-abc123' }, { tipo: 'separador', id: '"><x' }] });
  const ids = d.bloques.map((b) => b.id);
  assert.equal(new Set(ids).size, 3);
  assert.equal(ids[1], 'b-abc123');
  assert.ok(ids.every((i) => /^b-[a-z0-9]{4,16}$/.test(i)), ids.join(','));
});

console.log('Almacen.js · donde vive cada archivo');
const AL = await cargar('src/scripts/contenido/Almacen.js');
await ok('el PDF va al cajon «libros» SIN «libros/» delante (si no, la regla de 007 no lo deja bajar)', () => {
  assert.deepEqual(AL.ubicacion('libros/libertad/es.pdf'), { cajon: 'libros', nombre: 'libertad/es.pdf', mime: 'application/pdf' });
  assert.deepEqual(AL.ubicacion('lomos/libertad.es.png'), { cajon: 'portadas', nombre: 'lomos/libertad.es.png', mime: 'image/png' });
  assert.equal(AL.ubicacion('casas/nueva/logo.webp').cajon, 'portadas');
  for (const m of ['libros/x/es.png', 'lomos/x.webp', 'otra/x.png', '../libros/x/es.pdf', null, 'libros']) assert.equal(AL.ubicacion(m), null, String(m));
  /* La regla de 007 compara con 'libros/' || name: lo que se guarda en la fila */
  const sql = leer('supabase/007_desarrollo.sql');
  assert.match(sql, /= 'libros\/' \|\| objects\.name/);
});
await ok('cada archivo tiene que ser lo que dice ser (los primeros bytes)', () => {
  const de = (...xs) => new Uint8Array([...xs, ...new Array(16).fill(0)]);
  assert.ok(AL.esDelFormato(de(0x25, 0x50, 0x44, 0x46, 0x2d), 'pdf'));
  assert.ok(AL.esDelFormato(de(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), 'png'));
  assert.ok(AL.esDelFormato(de(0xff, 0xd8, 0xff), 'jpg'));
  assert.ok(!AL.esDelFormato(new TextEncoder().encode('<html><script>alert(1)</script>'), 'pdf'));
  assert.ok(!AL.esDelFormato(de(0x25, 0x50, 0x44, 0x46, 0x2d), 'png'));
  assert.ok(!AL.esDelFormato(null, 'pdf'));
  assert.ok(!AL.esDelFormato(de(0x3c, 0x73, 0x76, 0x67), 'svg'));
});

await ok('medidasDeImagen: lee el tamaño de las imagenes de verdad del sitio (PNG, JPEG y WebP)', () => {
  const dir = path.join(raiz, 'public/assets');
  const buscar = (ext) => {
    const pila = [dir];
    while (pila.length) {
      const d = pila.pop();
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) pila.push(p); else if (e.name.endsWith('.' + ext)) return p;
      }
    }
    return null;
  };
  for (const ext of ['png', 'jpg', 'webp']) {
    const f = buscar(ext);
    if (!f) continue;
    const m = AL.medidasDeImagen(new Uint8Array(fs.readFileSync(f)), ext);
    assert.ok(m && m.w > 0 && m.h > 0, `${ext}: ${path.basename(f)}`);
  }
  assert.equal(AL.medidasDeImagen(new TextEncoder().encode('<svg width="9" height="9">'), 'png'), null);
});

console.log('publicar.js · de la base a la pagina');
const P = await cargar('src/scripts/contenido/publicar.js');
await ok('un libro publicado sale con la forma de LIBROS, y sus archivos van a books/ y a lomos/ con nombres de su id', () => {
  const r = P.prepararPublicacion({ biblioteca: [{ ...new Libro(libroBueno()).aFila(), publicado: true }] }, { libros: ['ahava'] });
  assert.deepEqual(r.avisos, []);
  const [e] = r.libros.map(P.paraBiblioteca);
  assert.equal(e.panel, true);
  assert.deepEqual(e.idiomas.sort(), ['en', 'es']);
  assert.equal(e.idiomaOriginal, 'es');
  assert.deepEqual(r.archivos.map((a) => a.destino).sort(), ['books/libertad.en.pdf', 'books/libertad.es.pdf', 'public/assets/lomos/libertad.es.png']);
});
await ok('lo que no esta publicado, lo que no pasa sus reglas y lo que choca con el codigo se queda FUERA (con aviso)', () => {
  const r = P.prepararPublicacion({
    biblioteca: [
      { ...new Libro(libroBueno()).aFila(), publicado: false },
      { ...new Libro({ ...libroBueno(), id: 'otro', pdf: { es: 'libros/otro/es.pdf' }, lomo: {} }).aFila(), publicado: true, titulo: {} },
      { ...new Libro({ ...libroBueno(), id: 'libro2', pdf: { es: 'libros/libro2/es.pdf' }, lomo: {} }).aFila(), publicado: true }
    ],
    casas: [{ ...new Trabajo({ ...casaBuena(), id: 'bodega', logo: { src: 'casas/bodega/logo.png', w: 2, h: 1 } }).aFila(), publicado: true }],
    etapas: 'no es lista'
  }, { libros: ['libro2'], casas: ['bodega'] });
  assert.equal(r.libros.length, 0);
  assert.equal(r.casas.length, 0);
  assert.equal(r.etapas.length, 0);
  assert.ok(r.avisos.length >= 3, r.avisos.join(' | '));
});
await ok('una casa publicada sale con la forma de PARTNERS/PROJECTS y sus imagenes en /assets/remoto/', () => {
  const fila = { ...new Proyecto({ ...casaBuena(), avatar: 'casas/nueva-casa/avatar.png', cuerpo: { es: { bloques: [{ tipo: 'imagen', src: 'bloques/nueva-casa/a.webp', alt: 'x' }] } } }).aFila(), publicado: true };
  const r = P.prepararPublicacion({ casas: [fila] });
  const e = P.paraCasa(r.casas[0], { 'casas/nueva-casa/avatar.png': { w: 512, h: 300 } });
  assert.equal(e.clase, 'proyecto');
  assert.equal(e.src, '/assets/remoto/casas/nueva-casa/logo.png');
  assert.deepEqual([e.avatarW, e.avatarH], [512, 300]);
  assert.deepEqual(r.archivos.map((a) => a.destino).sort(), ['public/assets/remoto/bloques/nueva-casa/a.webp', 'public/assets/remoto/casas/nueva-casa/avatar.png', 'public/assets/remoto/casas/nueva-casa/logo.png']);
});

console.log('render.js · de los bloques a la pagina');
const RE = await cargar('src/scripts/contenido/render.js');
const todos = (nodos) => nodos.flatMap((n) => ('texto' in n ? [n] : [n, ...todos(n.hijos)]));
await ok('cada bloque sale con su etiqueta, el texto como TEXTO y las marcas como strong/em/a', () => {
  const n = RE.aNodos({ bloques: [
    { tipo: 'titulo', nivel: 3, texto: [{ t: 'Hola' }] },
    { tipo: 'parrafo', texto: [{ t: 'uno ', b: true }, { t: 'dos', i: true, href: 'https://x.co' }, { t: '\ntres' }] },
    { tipo: 'lista', ordenada: true, items: [[{ t: 'a' }], [{ t: 'b' }]] },
    { tipo: 'separador' },
    { tipo: 'boton', texto: 'Escríbeme', href: '/es/contact/' },
    { tipo: 'columnas', columnas: [[{ tipo: 'parrafo', texto: [{ t: 'x' }] }], [{ tipo: 'parrafo', texto: [{ t: 'y' }] }]] }
  ] });
  assert.deepEqual(n.map((x) => x.tag), ['h3', 'p', 'ol', 'hr', 'p', 'div']);
  const p = n[1];
  assert.equal(p.hijos[0].tag, 'strong');
  assert.equal(p.hijos[1].tag, 'a');
  assert.deepEqual(p.hijos[1].attrs, { href: 'https://x.co', target: '_blank', rel: 'noopener noreferrer' });
  assert.ok(p.hijos.some((h) => h.tag === 'br'), 'el salto de linea es <br>');
  assert.equal(n[4].hijos[0].attrs.href, '/es/contact/');
  assert.ok(!('target' in n[4].hijos[0].attrs), 'una pagina de la web se abre en la misma pestaña');
  assert.equal(n[5].attrs['data-n'], '2');
});
await ok('imagenes a /assets/remoto/, video solo en youtube-nocookie, y el aviso de IA en su pie', () => {
  const n = RE.aNodos({ bloques: [
    { tipo: 'imagen', src: 'bloques/casa/a.webp', alt: 'Un logo', pie: 'La casa', ia: true },
    { tipo: 'video', fuente: 'youtube', ref: 'dQw4w9WgXcQ', titulo: 'Un video' }
  ] }, { imagenIA: 'Imagen hecha con IA.', videoIA: 'Video hecho con IA.' });
  assert.equal(n[0].hijos[0].attrs.src, '/assets/remoto/bloques/casa/a.webp');
  assert.equal(n[0].hijos[1].hijos[0].texto, 'La casa Imagen hecha con IA.');
  const iframe = todos(n).find((x) => x.tag === 'iframe');
  assert.equal(iframe.attrs.src, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  assert.equal(iframe.attrs.title, 'Un video');
});
await ok('nada hostil sale: ni javascript:, ni HTML, ni etiquetas fuera de la lista, ni atributos on*', () => {
  const n = RE.aNodos({ bloques: [
    { tipo: 'parrafo', texto: [{ t: '<img src=x onerror=alert(1)>', href: 'javascript:alert(1)' }] },
    { tipo: 'boton', texto: 'x', href: 'javascript:alert(1)' },
    { tipo: 'video', fuente: 'youtube', ref: '"><script>alert(1)</script>', titulo: 'x' },
    { tipo: 'imagen', src: 'https://evil.com/x.png', alt: 'x' },
    { tipo: 'script', texto: 'alert(1)' },
    { tipo: 'componente', nombre: 'piezas' }
  ] });
  const nodos = todos(n);
  for (const x of nodos) {
    if ('texto' in x) continue;
    assert.ok(RE.ETIQUETAS.has(x.tag), x.tag);
    for (const [k, v] of Object.entries(x.attrs)) {
      assert.ok(!/^on/i.test(k), k);
      assert.ok(!/javascript:|data:/i.test(String(v)), `${k}=${v}`);
    }
  }
  assert.equal(nodos.filter((x) => 'texto' in x)[0].texto, '<img src=x onerror=alert(1)>', 'el texto viaja como texto: Astro lo escapa');
  assert.equal(n.length, 1, 'solo el parrafo (sin su enlace): lo demas no sale');
});

console.log('Repositorio.js · guardar y leer');
await ok('RepositorioMemoria: un borrador valida primero; lo invalido no se guarda', async () => {
  const repo = new R.RepositorioMemoria(Libro);
  const malo = await repo.guardarBorrador(new Libro({ ...libroBueno(), id: 'MAL' }));
  assert.equal(malo.error, 'invalido');
  assert.ok(malo.errores.length);
  assert.ok((await repo.guardarBorrador(new Libro(libroBueno()))).ok);
  const { entradas } = await repo.listar();
  assert.equal(entradas.length, 1);
  assert.ok(entradas[0] instanceof R.Entrada && entradas[0].actual instanceof Libro);
  assert.equal(entradas[0].estado, 'borrador');
  assert.equal(repo.filas.size, 0, 'un borrador NO entra en la tabla que lee la web');
});
await ok('RepositorioMemoria: un Trabajo no pisa a un Proyecto con el mismo id (ni su borrador)', async () => {
  const compartido = { filas: new Map(), borradores: new Map() };
  const proyectos = new R.RepositorioMemoria(Proyecto, compartido);
  const trabajos = new R.RepositorioMemoria(Trabajo, compartido);
  assert.ok((await proyectos.guardarBorrador(new Proyecto(casaBuena()))).ok);
  assert.equal((await trabajos.guardarBorrador(new Trabajo(casaBuena()))).error, 'repetido');
  assert.ok((await proyectos.publicar(new Proyecto(casaBuena()))).ok);
  assert.equal((await trabajos.publicar(new Trabajo(casaBuena()))).error, 'repetido');
  assert.equal((await trabajos.listar()).entradas.length, 0, 'cada uno ve solo los suyos');
});
await ok('RepositorioMemoria: publicar, cambiar sin tocar la web, quitar, descartar y borrar', async () => {
  const repo = new R.RepositorioMemoria(Etapa);
  const etapa = (titulo) => new Etapa({ id: 'a', cuando: '2026', idiomaOriginal: 'es', titulo: { es: titulo }, texto: { es: 'B' } });
  const estado = async () => (await repo.listar()).entradas[0];
  assert.equal((await repo.publicar(new Etapa({ id: 'a', idiomaOriginal: 'es' }))).error, 'invalido', 'a medias no se publica');
  await repo.guardarBorrador(etapa('A'));
  assert.equal((await estado()).estado, 'borrador');
  assert.ok((await repo.publicar(etapa('A'))).ok);
  assert.equal((await estado()).estado, 'publicado');
  assert.equal(repo.borradores.size, 0, 'al publicar, su borrador se va');
  /* Cambiarlo: la web sigue con lo publicado hasta volver a publicar */
  await repo.guardarBorrador(etapa('A cambiada'));
  let e = await estado();
  assert.equal(e.estado, 'cambios');
  assert.equal(e.enBase.titulo.es, 'A');
  assert.equal(e.actual.titulo.es, 'A cambiada');
  assert.ok((await repo.descartar('a')).ok);
  assert.equal((await estado()).actual.titulo.es, 'A', 'descartar vuelve a lo publicado');
  assert.ok((await repo.quitarDeLaWeb('a')).ok);
  assert.equal((await estado()).estado, 'fuera');
  assert.ok((await repo.borrar('a')).ok);
  assert.equal((await repo.listar()).entradas.length, 0);
  assert.equal((await repo.quitarDeLaWeb('nada')).error, 'noExiste');
  assert.equal((await repo.descartar('nada')).error, 'noExiste');
});
await ok('RepositorioSupabase: la tabla sale de la clase, y un error de la base es una clave, no una excepcion', async () => {
  const llamadas = [];
  const falsa = {
    from(t) {
      llamadas.push(t);
      const q = {
        select() { return q; }, order() { return q; }, eq() { return q; }, limit() { return q; },
        maybeSingle: async () => ({ data: null, error: { code: '42501', message: 'permission denied' } }),
        upsert: async () => ({ error: { code: '42501' } }),
        then: (r) => r({ data: null, error: { code: 'PGRST301' } })
      };
      return q;
    }
  };
  const repo = new R.RepositorioSupabase(falsa, Libro);
  const r = await repo.listar();
  assert.equal(llamadas[0], 'biblioteca');
  assert.ok(llamadas.includes('borradores'), 'la lista junta lo publicado y los borradores');
  assert.ok(r.error && typeof r.error === 'string');
  const g = await repo.guardarBorrador(new Libro(libroBueno()));
  assert.equal(g.error, 'permiso');
  const p = await repo.publicar(new Libro(libroBueno()));
  assert.equal(p.error, 'permiso');
});
await ok('RepositorioSupabase: un borrador va a «borradores» y publicar a su tabla (y borra el borrador)', async () => {
  const hechas = [];
  const falsa = {
    from(t) {
      const q = {
        select() { return q; }, order() { return q; }, eq() { return q; },
        maybeSingle: async () => ({ data: null, error: null }),
        insert: async (fila) => { hechas.push(['insert', t, fila]); return { error: null }; },
        upsert: async (fila) => { hechas.push(['upsert', t, fila]); return { error: null }; },
        delete() { hechas.push(['delete', t]); return q; },
        then: (r) => r({ data: [], error: null })
      };
      return q;
    }
  };
  const repo = new R.RepositorioSupabase(falsa, Libro);
  assert.ok((await repo.guardarBorrador(new Libro({ ...libroBueno(), pdf: {} }), { nuevo: true })).ok);
  assert.deepEqual(hechas.map((h) => h.slice(0, 2)), [['insert', 'borradores']]);
  assert.equal(hechas[0][2].tabla, 'biblioteca');
  assert.equal(hechas[0][2].fila.publicado, false);
  hechas.length = 0;
  assert.ok((await repo.publicar(new Libro(libroBueno()))).ok);
  assert.deepEqual(hechas.map((h) => h.slice(0, 2)), [['upsert', 'biblioteca'], ['delete', 'borradores']]);
  assert.equal(hechas[0][2].publicado, true);
});

console.log('lo publicado no se sube al repositorio');
await ok('src/data/remoto/*.js estan VACIOS aqui (los llena GitHub al publicar; con datos, no se suben)', async () => {
  if (process.env.GITHUB_ACTIONS === 'true') return;          // en GitHub si tienen datos: los acaba de traer
  for (const n of ['biblioteca', 'casas', 'etapas']) {
    const m = await cargar(`src/data/remoto/${n}.js`);
    assert.deepEqual(m.default, [], n);
  }
  assert.match(leer('.gitignore'), /^public\/assets\/remoto\/$/m);
});

console.log('guiones del contenido');
await ok('nada de innerHTML, eval, document.write ni almacenamiento del navegador', () => {
  const dir = path.join(raiz, 'src/scripts/contenido');
  const prohibido = /\b(innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\s*\(|new Function|localStorage|sessionStorage)\b/;
  const archivos = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  assert.ok(archivos.length >= 8, archivos.join(','));
  for (const f of archivos) {
    const sinComentarios = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!prohibido.test(sinComentarios), f);
  }
});
await ok('el contenido no toca el DOM ni la red por su cuenta (es puro)', () => {
  const dir = path.join(raiz, 'src/scripts/contenido');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const t = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/\b(document|window|fetch)\b/.test(t), f);
  }
});

console.log(`\n${n} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
