/* LA FICHA DEL LIBRO (supabase/016_ficha.sql) de punta a punta, sin red:
     1. lector/ficha.js limpia (limpiarFicha, limpiarFichas, fichaPorIdioma) y la funcion `vista` dice LO MISMO (nucleo.js);
     2. lo que sale de la limpieza SIEMPRE pasa ficha_valida y fichas_validas de verdad (016 en un Postgres de prueba, PGlite),
        tambien con datos hostiles (controles, emojis partidos, saltos raros, claves de mas, __proto__);
     3. las consultas nuevas de 990_comprobar_rls.sql dan lo que dicen;
     4. el Taller (Obra, el repositorio en memoria), Recursos (Libro, juntar, paraBiblioteca, publicarLibro) y la hoja del lector
        (elegirFicha) la llevan sin perderla ni inventarla;
     5. los archivos nuevos no usan almacenamiento del navegador ni HTML a mano.
     node tools/test-ficha.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (r) => import(pathToFileURL(path.join(raiz, r)).href);
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');

const F = await cargar('src/scripts/lector/ficha.js');
const N = await cargar('supabase/functions/vista/nucleo.js');
const { Obra } = await cargar('src/scripts/contenido/taller/Obra.js');
const { RepositorioTallerMemoria } = await cargar('src/scripts/contenido/taller/Repositorio.js');
const { Libro } = await cargar('src/scripts/contenido/Libro.js');
const { RepositorioMemoria } = await cargar('src/scripts/contenido/Repositorio.js');
const P = await cargar('src/scripts/contenido/publicar.js');
const RC = await cargar('src/scripts/contenido/taller/Recursos.js');
const HF = await cargar('src/scripts/lector/hojaFicha.js');

let bien = 0, mal = 0;
async function ok(nombre, fn) {
  try { await fn(); bien++; console.log('  ok  ' + nombre); } catch (e) { mal++; console.log(' MAL  ' + nombre + '\n      ' + String(e.message).split('\n')[0]); }
}
const plano = (o) => JSON.parse(JSON.stringify(o));
const CHR = String.fromCharCode;
const EMOJI = CHR(0xD83D, 0xDE00);

console.log('la ficha del libro');

/* ---- 1. La limpieza ---- */
await ok('limpiarFicha: sin prototipo, solo las cuatro claves y solo lo que tiene algo', () => {
  const f = F.limpiarFicha({ resumen: ' Hola ', tema: '', claves: [], para_quien: '  ', otra: 'x', constructor: 'y' });
  assert.equal(Object.getPrototypeOf(f), null);
  assert.deepEqual(plano(f), { resumen: 'Hola' });
  for (const raro of [null, undefined, 3, 'x', [], [1], true]) assert.deepEqual(Object.keys(F.limpiarFicha(raro)), [], String(raro));
  const veneno = JSON.parse('{"__proto__": {"tema": "x"}, "tema": "Amor"}');
  const g = F.limpiarFicha(veneno);
  assert.deepEqual(plano(g), { tema: 'Amor' });
  assert.equal(({}).tema, undefined, 'nada se colo en Object.prototype');
  assert.deepEqual(plano(F.limpiarFicha({ resumen: 5, tema: ['a'], claves: 'a,b', para_quien: { x: 1 } })), {});
});
await ok('el resumen guarda sus saltos (CRLF, CR y U+2028 pasan a \\n; como mucho una linea en blanco); lo demas es de una linea', () => {
  const f = F.limpiarFicha({ resumen: `  Uno.\r\nDos.\rTres.${CHR(0x2028)}Cuatro.\n\n\n\nCinco.  \n  Seis\tsiete   ocho `, tema: `A\nB\tC${CHR(0x2029)}D`, para_quien: 'Quien\r\nquiera' });
  assert.equal(f.resumen, 'Uno.\nDos.\nTres.\nCuatro.\n\nCinco.\nSeis siete ocho');
  assert.equal(f.tema, 'A B C D');
  assert.equal(f.para_quien, 'Quien quiera');
});
await ok('fuera los controles (C0 y C1), lo invisible y lo que da la vuelta al texto', () => {
  const raros = [0, 1, 7, 8, 11, 12, 14, 27, 31, 127, 128, 133, 159, 0x200B, 0x200E, 0x202E, 0x2066, 0xFEFF].map((c) => CHR(c)).join('');
  const f = F.limpiarFicha({ resumen: `a${raros}b`, tema: `c${raros}d`, claves: [`e${raros}f`], para_quien: `g${raros}h` });
  assert.deepEqual(plano(f), { resumen: 'ab', tema: 'cd', claves: ['ef'], para_quien: 'gh' });
  /* medio emoji suelto: la base no lo acepta en un jsonb (el entero se queda) */
  assert.equal(F.limpiarFicha({ tema: `a${CHR(0xD83D)}b${CHR(0xDE00)}c${EMOJI}` }).tema, `abc${EMOJI}`);
  assert.equal(N.fichaLimpia({ tema: `${CHR(0xDE00)}${CHR(0xD83D)}x` }).tema, 'x');
});
await ok('los topes: 500 · 60 · 5 × 70 · 80, sin partir un emoji', () => {
  const f = F.limpiarFicha({ resumen: 'r'.repeat(900), tema: 't'.repeat(200), claves: Array(12).fill('c'.repeat(100)), para_quien: 'p'.repeat(300) });
  assert.deepEqual([f.resumen.length, f.tema.length, f.claves.length, f.claves[0].length, f.para_quien.length], [500, 60, 5, 70, 80]);
  const e = F.limpiarFicha({ tema: 'a' + EMOJI.repeat(40) });
  assert.equal(e.tema.length, 59, 'el emoji que no cabe entero se va entero');
  assert.ok(!/[\uD800-\uDBFF]$/.test(e.tema));
  assert.deepEqual(F.limpiarFicha({ claves: ['', '  ', 'Uno', null, 7, 'Dos'] }).claves, ['Uno', 'Dos']);
  assert.deepEqual(F.TOPES, { resumen: 500, tema: 60, para_quien: 80, clave: 70, claves: 5 });
});
await ok('fichaVacia, limpiarFichas y fichaPorIdioma (el orden pedido; si no, cualquiera)', () => {
  assert.equal(F.fichaVacia({}), true);
  assert.equal(F.fichaVacia({ tema: '  ', claves: [''] }), true);
  assert.equal(F.fichaVacia({ tema: 'x' }), false);
  const m = { es: { tema: 'Amor' }, en: { tema: 'Love' }, xx1: { tema: 'no' }, EN: { tema: 'no' }, pt: {}, fr: 'no' };
  assert.deepEqual(plano(F.limpiarFichas(m)), { es: { tema: 'Amor' }, en: { tema: 'Love' } });
  assert.deepEqual(plano(F.limpiarFichas(m, ['en'])), { en: { tema: 'Love' } });
  const muchos = Object.fromEntries('abcdefghijkl'.split('').map((l) => [`${l}a`, { tema: l }]));
  assert.equal(Object.keys(F.limpiarFichas(muchos)).length, 10);
  assert.equal(F.fichaPorIdioma(m, ['en', 'es']).idioma, 'en');
  assert.equal(F.fichaPorIdioma(m, ['pt', 'es']).ficha.tema, 'Amor');
  assert.equal(F.fichaPorIdioma({ en: { tema: 'Love' } }, ['es']).idioma, 'en', 'si no hay ninguno de los pedidos, el que haya');
  assert.equal(F.fichaPorIdioma({}, ['es']), null);
  assert.equal(F.fichaPorIdioma(JSON.parse('{"__proto__": {"tema": "x"}}'), ['__proto__']), null);
});

/* Datos hostiles al azar (con semilla: siempre los mismos) */
let semilla = 20261122;
const azar = (n) => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla % n; };
const PIEZAS = ['a', 'Ñ', ' ', '\n', '\r', '\t', '"', '\\', EMOJI, CHR(0xD83D), CHR(0xDE00), CHR(0), CHR(7), CHR(0x85), CHR(0x9F), CHR(0x2028), CHR(0x2029), CHR(0x200B), CHR(0xA0), 'ü', '中', '<', '­', 'x'.repeat(30)];
const texto = (max) => Array.from({ length: azar(max) }, () => PIEZAS[azar(PIEZAS.length)]).join('');
const hostil = () => ({ resumen: texto(400), tema: texto(40), claves: Array.from({ length: azar(9) }, () => (azar(5) ? texto(30) : azar(3))), para_quien: texto(50), ...(azar(4) ? {} : { otra: 'x' }) });
const corpus = Array.from({ length: 300 }, hostil);

await ok('la funcion `vista` limpia EXACTAMENTE igual que el lector (nucleo.js → fichaLimpia)', () => {
  for (const x of corpus) assert.deepEqual(N.fichaLimpia(x), plano(F.limpiarFicha(x)));
});

/* ---- 2 y 3. Contra 016 de verdad ---- */
const db = new PGlite();
const sql007 = leer('supabase/007_desarrollo.sql');
const claves = sql007.slice(sql007.indexOf('create or replace function public.claves_de_idioma'), sql007.indexOf('$$;', sql007.indexOf('create or replace function public.claves_de_idioma')) + 3);
await db.exec(`create role anon nologin; create role authenticated nologin;
  create table public.taller_obras (id int primary key); create table public.taller_ediciones (id int primary key); create table public.biblioteca (id int primary key);
  ${claves}`);
const sql016 = leer('supabase/016_ficha.sql');
await db.exec(sql016);
await db.exec(sql016);
const valida = async (f, fn = 'ficha_valida') => (await db.query(`select public.${fn}($1::jsonb) as v`, [JSON.stringify(f)])).rows[0].v;

await ok('016: lo que sale de limpiarFicha SIEMPRE pasa ficha_valida (300 fichas hostiles) y lo crudo casi nunca', async () => {
  let crudasMalas = 0;
  for (const x of corpus) {
    assert.equal(await valida(plano(F.limpiarFicha(x))), true, JSON.stringify(x).slice(0, 80));
    if (!(await valida(x).catch(() => false))) crudasMalas++;
  }
  assert.ok(crudasMalas > 250, `la prueba tiene dientes: ${crudasMalas} crudas no pasan`);
});
await ok('016: fichas_validas acepta lo de limpiarFichas; la columna guarda la limpia y rechaza la cruda', async () => {
  const mapa = { es: corpus[0], en: corpus[1], pt: corpus[2] };
  assert.equal(await valida(plano(F.limpiarFichas(mapa)), 'fichas_validas'), true);
  await db.query(`insert into public.biblioteca (id, ficha) values (1, $1::jsonb)`, [JSON.stringify(plano(F.limpiarFichas(mapa)))]);
  await db.query(`insert into public.taller_ediciones (id, ficha) values (1, $1::jsonb)`, [JSON.stringify(plano(F.limpiarFicha(corpus[3])))]);
  await assert.rejects(db.query(`insert into public.taller_obras (id, ficha) values (2, $1::jsonb)`, [JSON.stringify({ tema: 'x'.repeat(61) })]));
  await assert.rejects(db.query(`insert into public.biblioteca (id, ficha) values (2, $1::jsonb)`, [JSON.stringify({ espanol: { tema: 'x' } })]));
  const r = await db.query('select ficha from public.taller_obras where id = 1');
  assert.equal(r.rows.length, 0);
  await db.query('insert into public.taller_obras (id) values (1)');
  assert.deepEqual((await db.query('select ficha from public.taller_obras where id = 1')).rows[0].ficha, {});
});
await ok('990: las consultas 35 dicen lo que prometen', async () => {
  const t = leer('supabase/990_comprobar_rls.sql');
  const de = t.indexOf('-- 35.');
  const consultas = t.slice(de).split('\n').filter((l) => !l.startsWith('--')).join('\n').split(';').map((s) => s.trim()).filter(Boolean);
  assert.equal(consultas.length, 2);
  assert.deepEqual(Object.values((await db.query(consultas[0])).rows[0]), [true, true, false, false, false, false, false]);
  assert.deepEqual(Object.values((await db.query(consultas[1])).rows[0]), [true, false]);
  assert.match(t, /taller_ediciones · ficha/);
  assert.match(t, /anon_cambia_ficha/);
});

/* ---- 4. Por donde viaja ---- */
await ok('Obra: la lee limpia y la manda en aDatos (tambien vacia: {})', () => {
  const o = new Obra({ titulo: 'T', ficha: { tema: ' Amor ', otra: 1 } });
  assert.deepEqual(plano(o.aDatos().ficha), { tema: 'Amor' });
  assert.deepEqual(new Obra({ titulo: 'T' }).aDatos().ficha, {});
  assert.deepEqual(plano(new Obra(plano(o.aDatos())).ficha), { tema: 'Amor' });
});
await ok('Taller en memoria: la edicion se lleva una copia; solo su ficha se puede cambiar despues; restaurar no la devuelve', async () => {
  const t = new RepositorioTallerMemoria();
  const o = (await t.crearObra(new Obra({ titulo: 'L', ficha: { tema: 'Uno' } }).aDatos())).id;
  const e = await t.crearEdicion({ obraId: o, titulo: 'L', idioma: 'es', paginas: 1, ratio: 0.7, hojas: [{ text: '' }], ficha: { tema: 'Uno', mala: 1 } });
  assert.deepEqual((await t.ediciones(o)).filas[0].ficha, { tema: 'Uno' });
  assert.ok((await t.actualizarFichaEdicion(e.id, { tema: 'Dos', resumen: `a${CHR(7)}b` })).ok);
  assert.deepEqual((await t.ediciones(o)).filas[0].ficha, { tema: 'Dos', resumen: 'ab' });
  assert.equal((await t.actualizarFichaEdicion('no-esta', {})).error, 'noExiste');
  await t.copia(o, 'manual', 'antes');
  const a = await t.abrir(o);
  assert.ok((await t.guardarObra({ ...a.obra, ficha: { tema: 'Nueva' } }, 'p')).ok);
  const v = (await t.versiones(o)).filas[0];
  assert.ok((await t.restaurar(v.id)).ok);
  assert.deepEqual((await t.abrir(o)).obra.ficha, { tema: 'Nueva' }, 'como 012: restaurar no toca la ficha');
});
await ok('Libro de Recursos: ficha por idioma, limpia; un idioma raro o una ficha vacia se caen sin tumbar el libro', () => {
  const l = new Libro({ id: 'milibro', idiomaOriginal: 'es', seccion: 'teologia', tipo: 'revista', titulo: { es: 'M' }, pdf: { es: 'libros/milibro/es.pdf' },
    ficha: { es: { tema: 'Amor', x: 1 }, en: {}, zz: { tema: 'no' }, ES: { tema: 'no' } } });
  assert.ok(l.validar().ok, JSON.stringify(l.validar().errores));
  assert.deepEqual(l.ficha, { es: { tema: 'Amor' } });
  assert.deepEqual(l.aFila().ficha, { es: { tema: 'Amor' } });
  assert.deepEqual(Libro.deFila(l.aFila()).ficha, { es: { tema: 'Amor' } });
  assert.deepEqual(new Libro({ id: 'x' }).ficha, {});
});
await ok('paraBiblioteca: la ficha sale solo en los idiomas que salen (y no sale si no hay)', () => {
  const l = new Libro({ id: 'milibro', idiomaOriginal: 'es', publicado: true, seccion: 'teologia', tipo: 'revista', titulo: { es: 'M', en: 'M' }, pdf: { es: 'libros/milibro/es.pdf' },
    ficha: { es: { tema: 'Amor' }, en: { tema: 'Love' } } });
  assert.deepEqual(P.paraBiblioteca(l).ficha, { es: { tema: 'Amor' } });
  assert.equal('ficha' in P.paraBiblioteca(new Libro({ ...l.datos(), ficha: {} })), false);
});
await ok('juntar: un borrador de antes de 016 (sin ficha) se queda con la de lo publicado; uno con ficha manda el suyo', async () => {
  const r = new RepositorioMemoria(Libro);
  const base = { id: 'milibro', idioma_original: 'es', seccion: 'teologia', tipo: 'revista', titulo: { es: 'M' }, pdf: { es: 'libros/milibro/es.pdf' } };
  r.filas.set('milibro', { ...base, publicado: true, ficha: { es: { tema: 'Amor' } } });
  r.borradores.set('milibro', { id: 'milibro', clase: null, fila: { ...base, titulo: { es: 'M2' } } });
  let e = (await r.listar()).entradas[0];
  assert.deepEqual(e.borrador.ficha, { es: { tema: 'Amor' } });
  assert.equal(e.borrador.titulo.es, 'M2');
  r.borradores.set('milibro', { id: 'milibro', clase: null, fila: { ...base, ficha: { es: { tema: 'Otra' } } } });
  e = (await r.listar()).entradas[0];
  assert.deepEqual(e.borrador.ficha, { es: { tema: 'Otra' } });
  r.borradores.set('milibro', { id: 'milibro', clase: null, fila: { ...base, ficha: {} } });
  assert.deepEqual((await r.listar()).entradas[0].borrador.ficha, {}, 'borrarla a proposito tambien vale');
});
await ok('publicarLibro: la ficha de la edicion pasa a Recursos en su idioma; sin ficha, se queda la que habia', async () => {
  const taller = new RepositorioTallerMemoria();
  const libros = new RepositorioMemoria(Libro);
  const archivos = new Map();
  taller.libroOcupado = async (id) => libros.filas.has(id) || libros.borradores.has(id);
  taller.copiarArchivo = async (o, d) => { archivos.set(d, archivos.get(o)); return { ok: true }; };
  taller.quitarArchivoRecursos = async (x) => { archivos.delete(x); return { ok: true }; };
  const be = { taller, contenido: { repositorio: () => libros } };
  const o = (await taller.crearObra({ titulo: 'L', idioma: 'es', pagina: {}, fuentes: [] })).id;
  const edicion = async (ficha) => {
    const e = await taller.crearEdicion({ obraId: o, titulo: 'L', idioma: 'es', paginas: 1, ratio: 0.7, hojas: [{ text: '' }], ficha });
    archivos.set(`taller/${o}/ediciones/${e.id}/original.pdf`, 'PDF');
    taller.reloj = ((n) => () => Date.now() + n)(taller.edicionesM.size * 1000);
    return e.id;
  };
  const e1 = await edicion({ tema: 'Amor', claves: ['Uno'] });
  const r1 = await RC.publicarLibro({ be, obraId: o, edicionId: e1, libroId: 'milibro', lang: 'es', tema: 'teologia', titulo: 'L', blando: true });
  assert.ok(r1.ok, JSON.stringify(r1));
  assert.deepEqual(libros.filas.get('milibro').ficha, { es: { tema: 'Amor', claves: ['Uno'] } });
  const e2 = await edicion({});
  const r2 = await RC.publicarLibro({ be, obraId: o, edicionId: e2, libroId: 'milibro', lang: 'es', tema: 'teologia', titulo: 'L', blando: true });
  assert.ok(r2.ok, JSON.stringify(r2));
  assert.deepEqual(libros.filas.get('milibro').ficha, { es: { tema: 'Amor', claves: ['Uno'] } }, 'una edicion sin ficha no borra la de Recursos');
});
await ok('Developer-Mode → Libros: guardar o publicar desde el editor NO borra la ficha (EditorLibro.leer la conserva)', async () => {
  const { EditorLibro } = await cargar('src/scripts/portal/panel/dev/EditorLibro.js');
  const actual = new Libro({ id: 'milibro', idiomaOriginal: 'es', publicado: true, seccion: 'teologia', tipo: 'revista', titulo: { es: 'M' }, pdf: { es: 'libros/milibro/es.pdf' },
    ficha: { es: { tema: 'Amor', claves: ['Uno'] } } });
  /* El formulario, como lo deja poner(): solo lo que leer() mira */
  const campo = (value) => ({ value });
  const form = {
    elements: { idiomaOriginal: campo('es'), titulo: campo('M2'), subtitulo: campo(''), id: campo('milibro'), seccion: campo('teologia'), tono: campo(''), etiquetas: campo('') },
    querySelector: (s) => (s.includes('tipo') ? { value: 'revista' } : null)
  };
  const editor = { actual, versiones: () => [] };
  const datos = EditorLibro.prototype.leer.call(editor, form);
  const otra = new Libro(datos);
  assert.ok(otra.validar().ok, JSON.stringify(otra.validar().errores));
  assert.deepEqual(otra.aFila().ficha, { es: { tema: 'Amor', claves: ['Uno'] } });
  assert.equal(otra.titulo.es, 'M2');
  datos.ficha.es.tema = 'cambiada';
  assert.equal(actual.ficha.es.tema, 'Amor', 'es una copia, no la misma');
  assert.deepEqual(EditorLibro.prototype.leer.call({ actual: null, versiones: () => [] }, form).ficha, {}, 'un libro nuevo nace sin ficha');
  /* El otro que escribe filas de biblioteca: publicarLibro parte de lo publicado (datos()), con su ficha */
  assert.deepEqual(actual.datos().ficha, { es: { tema: 'Amor', claves: ['Uno'] } });
});
await ok('la hoja del lector elige: la del enlace privado, o de Recursos la del primer idioma pedido', () => {
  assert.deepEqual(plano(HF.elegirFicha({ ficha: { tema: 'P', x: 1 } }).ficha), { tema: 'P' });
  assert.equal(HF.elegirFicha({ fichas: { es: { tema: 'A' }, en: { tema: 'B' } }, orden: ['en', 'es'] }).ficha.tema, 'B');
  assert.equal(HF.elegirFicha({ fichas: { en: { tema: 'B' } }, orden: ['es'] }).idioma, 'en');
  assert.deepEqual(Object.keys(HF.elegirFicha({}).ficha), []);
  assert.deepEqual(Object.keys(HF.elegirFicha({ fichas: {}, ficha: null }).ficha), []);
});

/* ---- 5. Las reglas de la casa ---- */
await ok('vista.js la vuelve a limpiar; la funcion la pide; la banda lleva el «ⓘ» DESPUES del titulo, fuera de el', () => {
  assert.match(leer('src/scripts/lector/vista.js'), /ficha: limpiarFicha\(d\.ficha\)/);
  assert.match(leer('supabase/functions/vista/index.ts'), /taller_ediciones\(titulo, idioma, paginas, ratio, blando, carpeta, hojas, ficha\)/);
  const p = leer('src/components/Panels.astro');
  assert.match(p, /<h2 class="lector__titulo" id="book-title"><\/h2>\s*<!--[\s\S]*?-->\s*<button class="lector__info"/);
  for (const k of ['info', 'infoClaves', 'infoPara', 'infoDatos', 'infoPaginas', 'infoTambien', 'infoNo']) {
    const u = leer('src/i18n/ui.js');
    assert.equal((u.match(new RegExp(`'lector\\.${k}':`, 'g')) || []).length, 2, `lector.${k} en es y en`);
  }
});
await ok('nada de almacenamiento del navegador ni HTML a mano en lo nuevo', () => {
  const PROHIBIDO = new RegExp(['local', 'Storage|', 'session', 'Storage|', 'inner', 'HTML|', 'outer', 'HTML|insertAdjacentHTML'].join(''));
  for (const f of ['src/scripts/lector/ficha.js', 'src/scripts/lector/hojaFicha.js', 'src/scripts/portal/panel/dev/taller/Ficha.js', 'src/styles/taller-ficha.css', 'supabase/functions/vista/nucleo.js']) {
    assert.ok(!PROHIBIDO.test(leer(f)), f);
  }
  /* el lector no carga nada del portal */
  for (const f of ['src/scripts/lector/ficha.js', 'src/scripts/lector/hojaFicha.js']) assert.ok(!/from '\.\.\/(portal|contenido)\//.test(leer(f)), f);
});

console.log(`\n${bien} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
