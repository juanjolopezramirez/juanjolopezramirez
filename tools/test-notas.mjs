/* LAS NOTAS DEL LECTOR (etapa 5a): el enlace /nota/#n=… (lector/notaEnPdf.js), como se lee (lector/notaTexto.js), el texto
   de una cita (lector/pasajeNota.js, con los archivos de verdad de public/biblia), el indice (lector/indiceLector.js) y el
   filtro de las ediciones (PaginasEdicion.js). Lo que no necesita navegador.
     node tools/test-notas.mjs     (tambien lo corre tools/test-lector.mjs) */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import * as N from '../src/scripts/lector/notaEnPdf.js';
import * as X from '../src/scripts/lector/notaTexto.js';
import * as I from '../src/scripts/lector/indiceLector.js';
import { pasajeDeNota } from '../src/scripts/lector/pasajeNota.js';
import * as PE from '../src/scripts/contenido/taller/PaginasEdicion.js';
import { enlaceDeCopia } from '../src/scripts/lector/copiaEnPdf.js';
import { UI } from '../src/i18n/ui.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => readFileSync(path.join(raiz, r), 'utf8');
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64url');
const llanoDe = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const BASE = 'https://juanjolopezramirez.com/nota/#n=';

export const DEF = { v: 1, k: 'd', t: 'Ahavá', d: 'Amor.\nUna decisión.', r: { a: 'Brown, F.', y: '1906', ti: 'A Hebrew and English lexicon', f: 'Clarendon Press', u: 'https://example.com/lexico' }, ft: 'estonia', fd: 'lora' };
export const CITA = { v: 1, k: 'c', r: 'JER.1.4-5', x: 'Jeremías 1:4-5', rv: 'NVI' };

/* Un fetch de mentira que lee public/ (el mismo archivo que pediria el navegador) */
const fetchLocal = async (url) => {
  try { const t = readFileSync(path.join(raiz, 'public', url.replace(/^\//, ''))); return { ok: true, headers: { get: () => String(t.length) }, text: async () => t.toString('utf8') }; }
  catch { return { ok: false }; }
};

export async function probarNotas(ok) {
  console.log('las notas: el enlace');
  await ok('ida y vuelta: definicion y cita; la misma nota da el mismo enlace', () => {
    const a = N.enlaceDeNota(DEF);
    assert.ok(a.startsWith(BASE));
    assert.ok(/^[A-Za-z0-9_-]+$/.test(a.slice(BASE.length)));
    assert.equal(a, N.enlaceDeNota({ ...DEF }));
    const n = N.notaDeEnlace(a);
    assert.equal(Object.getPrototypeOf(n), null);
    assert.deepEqual({ ...n, r: { ...n.r } }, DEF);
    const c = N.notaDeEnlace(N.enlaceDeNota(CITA));
    assert.deepEqual({ ...c }, CITA);
    assert.ok(N.esEnlaceNota(a) && N.esEnlaceNota(N.enlaceDeNota(CITA)));
    /* referencia escrita a mano y solo capitulo */
    const libre = N.notaDeEnlace(N.enlaceDeNota({ v: 1, k: 'd', t: 'Rhema', rf: 'Notas de clase, 2024.' }));
    assert.equal(libre.rf, 'Notas de clase, 2024.');
    assert.equal(N.notaDeEnlace(N.enlaceDeNota({ v: 1, k: 'c', r: 'PSA.139' })).r, 'PSA.139');
  });
  await ok('otro sitio, http, o la ruta de prueba sin pedirla: no es una nota', () => {
    const cuerpo = N.enlaceDeNota(DEF).slice(BASE.length);
    for (const malo of ['https://evil.example/nota/#n=', 'http://juanjolopezramirez.com/nota/#n=', 'https://juanjolopezramirez.com.evil.example/nota/#n=',
      'https://juanjolopezramirez.com/notas/#n=', 'https://juanjolopezramirez.com/nota/?#n=', 'http://localhost:4321/nota/#n=']) {
      assert.equal(N.notaDeEnlace(malo + cuerpo), null, malo);
    }
    /* la copia de prueba vale solo si se pide (el lector pasa su propio origen) */
    assert.ok(N.notaDeEnlace('http://localhost:4321/nota/#n=' + cuerpo, { origenes: ['http://localhost:4321/'] }));
    const dev = N.enlaceDeNota(DEF, { origen: 'http://localhost:4321/' });
    assert.ok(dev.startsWith('http://localhost:4321/nota/#n='));
    assert.equal(N.enlaceDeNota(DEF, { origen: 'javascript:alert(1)//' }), null);
    assert.equal(N.enlaceDeNota(DEF, { origen: 'https://a.b/"><x' }), null);
  });
  await ok('base64 mal escrito, JSON roto, bytes que no son UTF-8, o demasiado largo: null', () => {
    for (const malo of ['', 'a', 'ab+c', 'ab/c', 'abc=', 'ab%41', 'ab c', b64('{"v":1'), b64('[1,2]'), b64('null'), b64('"x"')]) {
      assert.equal(N.notaDeEnlace(BASE + malo), null, malo);
    }
    assert.equal(N.notaDeEnlace(BASE + Buffer.from([0xff, 0xfe, 0x7b]).toString('base64url')), null);
    const largo = BASE + b64(JSON.stringify({ v: 1, k: 'd', t: 'x', d: 'y', relleno: 'z'.repeat(9000) }));
    assert.ok(largo.length > N.HREF_NOTA_MAX);
    assert.equal(N.notaDeEnlace(largo), null);
    assert.equal(N.notaDeEnlace(42), null);
  });
  await ok('limpiarNota: solo lo conocido, sin prototipo; __proto__ y campos de mas no pasan', () => {
    const crudo = JSON.parse('{"v":1,"k":"d","t":"Hola","__proto__":{"admin":true},"constructor":"x","otro":1,"r":{"a":"A","__proto__":{"x":1},"z":2}}');
    const n = N.limpiarNota(crudo);
    assert.deepEqual(Object.keys(n).sort(), ['k', 'r', 't', 'v']);
    assert.deepEqual(Object.keys(n.r), ['a']);
    assert.equal(Object.getPrototypeOf(n), null);
    assert.equal(Object.getPrototypeOf(n.r), null);
    assert.equal({}.admin, undefined);
    const desdeEnlace = N.notaDeEnlace(BASE + b64('{"v":1,"k":"d","t":"Hola","__proto__":{"admin":true}}'));
    assert.equal(desdeEnlace.admin, undefined);
    assert.deepEqual(Object.keys(desdeEnlace).sort(), ['k', 't', 'v']);
    for (const malo of [null, [], 'x', { v: 2, k: 'd', t: 'x' }, { v: 1, k: 'z', t: 'x' }, { v: 1, k: 'd' }, { v: 1, k: 'd', t: '   ' }, { v: '1', k: 'd', t: 'x' }]) {
      assert.equal(N.limpiarNota(malo), null, JSON.stringify(malo));
    }
  });
  await ok('topes: titulo 80, descripcion 1200, partes 200, rf 400, x 120 (contados en letras, sin partir un emoji)', () => {
    const n = N.limpiarNota({ v: 1, k: 'd', t: '😀'.repeat(100), d: 'd'.repeat(1300), r: { a: 'a'.repeat(250), ti: 't'.repeat(201) } });
    assert.equal(Array.from(n.t).length, 80);
    assert.ok(!/[\uD800-\uDBFF]$/.test(n.t), 'sin medio emoji');
    assert.equal(n.d.length, 1200);
    assert.equal(n.r.a.length, 200);
    assert.equal(n.r.ti.length, 200);
    assert.equal(N.limpiarNota({ v: 1, k: 'd', t: 'x', rf: 'r'.repeat(500) }).rf.length, 400);
    assert.equal(N.limpiarNota({ v: 1, k: 'c', r: 'JHN.3.16', x: 'x'.repeat(200) }).x.length, 120);
  });
  await ok('letras invisibles, controles y marcas de direccion se quitan; los saltos de linea solo en la descripcion', () => {
    const n = N.limpiarNota({ v: 1, k: 'd', t: 'A​ha‮v­á\u0007', d: 'uno\n\n\n\ndos⁦', r: { a: 'Au‏tor\nX' } });
    assert.equal(n.t, 'Ahavá');
    assert.equal(n.d, 'uno\n\ndos');
    assert.equal(n.r.a, 'Autor X');
  });
  await ok('la direccion de la fuente: solo https, sin usuario, sin comillas, hasta 300', () => {
    const u = (url) => { const n = N.limpiarNota({ v: 1, k: 'd', t: 'x', r: { a: 'A', u: url } }); return n.r.u; };
    assert.equal(u('https://example.com/a?b=1'), 'https://example.com/a?b=1');
    for (const malo of ['http://example.com/', 'javascript:alert(1)', 'data:text/html,x', 'https://user:pw@example.com/', 'https://example.com/"x', 'https://example.com/ x', '//example.com/', 'https://' + 'a'.repeat(300) + '.com']) {
      assert.equal(u(malo), undefined, malo);
    }
    /* sin partes validas no queda referencia por partes */
    assert.equal(N.limpiarNota({ v: 1, k: 'd', t: 'x', r: { u: 'http://x.com' } }).r, undefined);
  });
  await ok('letras: solo las de la lista; otra cualquiera es «la del libro» (no se guarda)', () => {
    assert.deepEqual(Object.keys(N.FUENTES_NOTA).sort(), ['bricolage-grotesque', 'estonia', 'frank-ruhl-libre', 'lora', 'petemoss', 'young-serif']);
    const n = N.limpiarNota({ v: 1, k: 'd', t: 'x', ft: 'Comic Sans', fd: 'lora;}body{color:red' });
    assert.equal(n.ft, undefined);
    assert.equal(n.fd, undefined);
    assert.equal(N.limpiarNota({ v: 1, k: 'd', t: 'x', ft: 'toString' }).ft, undefined, 'nada heredado del prototipo');
    assert.equal(N.limpiarNota({ v: 1, k: 'd', t: 'x', ft: 'libro' }).ft, undefined);
    for (const id of Object.keys(N.FUENTES_NOTA)) {
      const h = N.hojaDeFuente(id);
      assert.ok(h.startsWith('https://fonts.googleapis.com/css2?family=') && h.endsWith('&display=swap'), id);
      assert.match(N.FUENTES_NOTA[id].css, /^"[A-Za-z ]+", [A-Za-z -]+(, [A-Za-z-]+)*$/);
    }
    assert.equal(N.hojaDeFuente('x'), null);
  });
  await ok('la cita: referencia canonica de verdad, version como la de Bible Gateway', () => {
    for (const malo of ['JER.99.1', 'jer.1.4', 'XXX.1', 'JHN.3.99', 'JER.1.4-', ' JER.1.4', 'JER 1:4', 5, null]) {
      assert.equal(N.limpiarNota({ v: 1, k: 'c', r: malo }), null, String(malo));
    }
    assert.equal(N.limpiarNota({ v: 1, k: 'c', r: 'JHN.3.16', rv: ' nvi ' }).rv, 'NVI');
    for (const malo of ['nvi<script>', 'N', 'X'.repeat(13), 'NV I', 7]) assert.equal(N.limpiarNota({ v: 1, k: 'c', r: 'JHN.3.16', rv: malo }).rv, undefined, String(malo));
    assert.equal(N.limpiarNota({ v: 1, k: 'c', r: 'JHN.3.16', l: 'fr' }).l, undefined);
    assert.equal(N.limpiarNota({ v: 1, k: 'c', r: 'JHN.3.16', l: 'en' }).l, 'en');
  });
  await ok('parece nota pero no lo es: pareceEnlaceNota la delata para tirarla', () => {
    assert.ok(N.pareceEnlaceNota(BASE + 'basura'));
    assert.ok(N.pareceEnlaceNota('https://juanjolopezramirez.com/nota/'));
    assert.ok(!N.pareceEnlaceNota('https://example.com/nota/#n=x'));
    assert.ok(N.pareceEnlaceNota('http://localhost:4321/nota/#n=x', { origenes: ['http://localhost:4321/'] }));
  });

  console.log('las notas: como se leen');
  await ok('la referencia APA: autor, (año), titulo en cursiva, fuente, direccion; sin año «s. f.» / «n.d.»', () => {
    const t = X.referenciaAPA(N.limpiarNota(DEF), 'es');
    assert.equal(t.map((x) => x.t).join(''), 'Brown, F. (1906). A Hebrew and English lexicon. Clarendon Press. https://example.com/lexico');
    assert.deepEqual(t.filter((x) => x.cursiva).map((x) => x.t), ['A Hebrew and English lexicon.']);
    assert.equal(t.at(-1).url, 'https://example.com/lexico');
    const sinAnio = X.referenciaAPA({ r: { a: 'Ana', ti: '¿Quién?' } }, 'en').map((x) => x.t).join('');
    assert.equal(sinAnio, 'Ana. (n.d.). ¿Quién?');
    assert.equal(X.referenciaAPA({ r: { ti: 'Obra', y: '2020' } }, 'es').map((x) => x.t).join(''), 'Obra. (2020).');
    assert.deepEqual(X.referenciaAPA({ rf: 'A mano' }), [{ t: 'A mano' }]);
    assert.deepEqual(X.referenciaAPA({}), []);
  });
  await ok('la version del libro, su nombre, la recomendada con su enlace, y el idioma de una nota suelta', () => {
    assert.equal(X.versionDeIdioma('es'), 'rv1909');
    assert.equal(X.versionDeIdioma('en'), 'web');
    assert.equal(X.NOMBRE_VERSION.rv1909, 'Reina-Valera 1909');
    const rec = X.recomendada(N.limpiarNota(CITA), 'es');
    assert.equal(rec.nombre, 'NVI');
    assert.ok(rec.href.startsWith('https://www.biblegateway.com/passage/?search=') && rec.href.endsWith('&version=NVI'));
    assert.equal(X.recomendada(N.limpiarNota({ v: 1, k: 'c', r: 'PSA.139' }), 'es'), null);
    assert.equal(X.rotuloDeCita(N.limpiarNota({ v: 1, k: 'c', r: 'PSA.139' }), 'es'), 'Salmo 139');
    assert.equal(X.idiomaDeNota({ k: 'c', r: 'JER.1.4-5', x: 'Jeremiah 1:4-5' }, 'es'), 'en');
    assert.equal(X.idiomaDeNota({ k: 'c', r: 'JER.1.4-5', x: 'Jeremías 1:4-5' }, 'en'), 'es');
    assert.equal(X.idiomaDeNota({ k: 'c', r: 'JOB.1.1', x: 'Job 1:1' }, 'en'), 'en', 'el mismo nombre en los dos: manda el preferido');
    assert.equal(X.idiomaDeNota({ k: 'd', t: 'x', l: 'en' }, 'es'), 'en');
  });
  await ok('el texto de una cita, con los archivos de verdad: limpio para leer (sin corchetes, sin versalitas)', async () => {
    const gen = await pasajeDeNota({ k: 'c', r: 'GEN.1.1' }, 'es', { base: '/', fetch: fetchLocal });
    assert.equal(gen.estado, 'ok');
    assert.equal(gen.nombre, 'Reina-Valera 1909');
    assert.ok(gen.versos[0].t.startsWith('En el principio'), gen.versos[0].t);
    const sal = await pasajeDeNota({ k: 'c', r: 'PSA.139.1-4' }, 'es', { base: '/', fetch: fetchLocal });
    assert.equal(sal.versos.length, 4);
    assert.ok(sal.versos.every((v) => !/[[\]]/.test(v.t)), 'sin corchetes del traductor');
    assert.ok(sal.versos[3].t.includes('y he aquí'), sal.versos[3].t);
    assert.ok(!/\bOH\b/.test(sal.versos[0].t), sal.versos[0].t);
    const jer = await pasajeDeNota(N.limpiarNota(CITA), 'en', { base: '/', fetch: fetchLocal });
    assert.equal(jer.nombre, 'World English Bible');
    assert.deepEqual(jer.versos.map((v) => v.v), [4, 5]);
  });
  await ok('un versiculo que la version deja fuera dice eso; un pasaje largo se corta; sin red, error', async () => {
    const lc = await pasajeDeNota({ k: 'c', r: 'LUK.17.35-37' }, 'en', { base: '/', fetch: fetchLocal });
    assert.equal(lc.estado, 'ok');
    assert.deepEqual(lc.versos.map((v) => v.omitido), [false, true, false]);
    const largo = await pasajeDeNota({ k: 'c', r: 'PSA.119' }, 'es', { base: '/', fetch: fetchLocal });
    assert.ok(largo.recortado && largo.versos.length === 40);
    assert.ok(!largo.versos[0].t.startsWith('ALEPH'), 'sin el rotulo hebreo');
    const roto = await pasajeDeNota({ k: 'c', r: 'OBA.1.1' }, 'es', { base: '/', fetch: async () => ({ ok: false }) });   // un libro que nadie trajo antes
    assert.equal(roto.estado, 'error');
    assert.equal((await pasajeDeNota({ k: 'd', t: 'x' }, 'es', { fetch: fetchLocal })).estado, 'error');
  });

  await ok('una red que no contesta: a la espera se corta y la cita dice que no llego (se puede reintentar)', async () => {
    const { cargarPasaje, ESPERA_MS } = await import('../src/scripts/biblia/cargar.js');
    assert.equal(ESPERA_MS, 12000);
    let senal = null;
    const colgado = (url, op) => { senal = op.signal; return new Promise(() => {}); };
    const t0 = Date.now();
    assert.equal(await cargarPasaje({ libro: 'NAM', cap: 1, v1: 1, v2: 1 }, 'web', { base: '/', fetch: colgado, espera: 60 }), null);
    assert.ok(Date.now() - t0 < 1000);
    assert.ok(senal && senal.aborted, 'la peticion se aborta');
    /* y despues, con red, si llega (el fallo no se quedo guardado) */
    assert.ok(await cargarPasaje({ libro: 'NAM', cap: 1, v1: 1, v2: 1 }, 'web', { base: '/', fetch: fetchLocal }));
  });

  console.log('las notas: el indice del libro');
  const nota = (n) => ({ x: 0.1, y: 0.1, w: 0.1, h: 0.02, href: N.enlaceDeNota(n) });
  const hojas = [
    { text: 'Portada' },
    { text: 'El corazón de Ahavá es querer el bien.', links: [nota(DEF), nota(CITA)] },
    { text: 'Nada aqui', links: [{ x: 0.1, y: 0.1, w: 0.1, h: 0.1, href: BASE + 'falsa' }] },
    { text: 'Otra vez AHAVA y el Salmo.', links: [nota({ ...DEF, t: 'AHAVA', d: 'otra' }), nota({ v: 1, k: 'c', r: 'PSA.139', x: 'Salmo 139' }), nota(CITA)] },
  ];
  await ok('palabrasDe: una por palabra sin mirar tildes ni mayusculas, con sus paginas; la falsa no cuenta', () => {
    const p = I.palabrasDe(hojas);
    assert.equal(p.length, 1);
    assert.equal(p[0].nota.t, 'Ahavá', 'manda la primera');
    assert.deepEqual(p[0].paginas, [1, 3]);
    const dos = I.palabrasDe([{ links: [nota({ v: 1, k: 'd', t: 'Rhema' }), nota({ v: 1, k: 'd', t: 'Emet' }), nota({ v: 1, k: 'd', t: 'ágape' })] }]);
    assert.deepEqual(dos.map((x) => x.nota.t), ['ágape', 'Emet', 'Rhema'], 'por orden alfabetico');
    assert.deepEqual(I.palabrasDe(null), []);
  });
  await ok('citasDe: en el orden de la Biblia, una por pasaje, con sus paginas', () => {
    const c = I.citasDe(hojas);
    assert.deepEqual(c.map((x) => x.nota.r), ['PSA.139', 'JER.1.4-5']);
    assert.deepEqual(c[1].paginas, [1, 3]);
    const orden = I.citasDe([{ links: ['JHN.3.16', 'GEN.1.1', 'JHN.1.1', 'JHN.3.1-5', 'REV.22.21'].map((r) => nota({ v: 1, k: 'c', r })) }]);
    assert.deepEqual(orden.map((x) => x.nota.r), ['GEN.1.1', 'JHN.1.1', 'JHN.3.1-5', 'JHN.3.16', 'REV.22.21']);
  });
  await ok('buscar: sin tildes ni mayusculas, el trozo de alrededor con lo hallado tal como esta escrito', () => {
    const r = I.buscar(hojas, 'CORAZON');
    assert.equal(r.filas.length, 1);
    assert.equal(r.filas[0].p, 1);
    assert.equal(r.filas[0].hallado, 'corazón');
    assert.equal(r.filas[0].antes, 'El ');
    assert.ok(r.filas[0].despues.startsWith(' de Ahavá'));
    assert.deepEqual(I.buscar(hojas, 'ahava').filas.map((f) => f.p), [1, 3]);
    assert.equal(I.buscar(hojas, 'a').corto, true);
    assert.equal(I.buscar(hojas, '  ').filas.length, 0);
    assert.equal(I.buscar(hojas, 'no esta').filas.length, 0);
    const muchas = Array.from({ length: 150 }, (_, i) => ({ text: `pagina ${i} con amor` }));
    const tope = I.buscar(muchas, 'amor');
    assert.equal(tope.filas.length, 100);
    assert.equal(tope.tope, true);
    assert.equal(I.buscar(muchas, 'amor', { max: 5 }).filas.length, 5);
    /* el trozo no parte una palabra y lleva «…» si corta */
    const largo = I.buscar([{ text: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciseis amor y mas palabras que siguen y siguen hasta muy lejos de aqui para que se corte' }], 'amor').filas[0];
    assert.ok(largo.antes.startsWith('…') && largo.despues.endsWith('…'));
    assert.ok(I.hayTexto(hojas) && !I.hayTexto([{ text: '  ' }, {}]));
  });

  await ok('buscar en un libro grande: el texto llano se arma una vez; una busqueda sin hallazgos es rapida', () => {
    const palabra = () => ['camino', 'verdad', 'vida', 'corazón', 'mañana', 'Señor', 'amor', 'tierra'][Math.floor(Math.random() * 8)];
    const grande = Array.from({ length: 300 }, () => {
      let t = '';
      while (t.length < 3500) t += palabra() + (Math.random() < .1 ? '.\n' : ' ');
      return { text: t };
    });
    const t0 = performance.now();
    I.buscar(grande, 'zzzz');                 // la primera arma el texto llano del libro
    const t1 = performance.now();
    I.buscar(grande, 'qqqq');
    const t2 = performance.now();
    assert.ok(t1 - t0 < 3000, `primera: ${Math.round(t1 - t0)} ms`);
    assert.ok(t2 - t1 < 50, `sin hallazgos: ${Math.round(t2 - t1)} ms`);
    const hallado = I.buscar(grande, 'CORAZON');
    assert.equal(hallado.filas.length, 100);
    assert.ok(hallado.tope);
    assert.ok(hallado.filas.every((f) => llanoDe(f.hallado) === 'corazon'), 'el trozo lleva la palabra tal como esta escrita');
  });
  await ok('buscar: letras con la tilde aparte (NFD), saltos de linea, dos espacios y el espacio que no se parte', () => {
    const nfd = 'El corazón late.'.normalize('NFD');
    const r = I.buscar([{ text: nfd }], 'corazón');
    assert.equal(r.filas.length, 1);
    assert.equal(r.filas[0].hallado.normalize('NFC'), 'corazón');
    for (const t of ['dar el\nbien', 'dar el  bien', 'dar el bien', 'dar el \n\t bien']) {
      const f = I.buscar([{ text: t }], 'el bien').filas;
      assert.equal(f.length, 1, JSON.stringify(t));
      assert.equal(f[0].hallado, 'el bien', JSON.stringify(t));
      assert.equal(f[0].antes, 'dar ');
    }
    assert.equal(I.buscar([{ text: 'uno\n\ndos' }], 'uno  dos').filas.length, 1, 'tambien en lo que se escribe');
    assert.ok(!('veces' in I.buscar([{ text: 'amor amor' }], 'amor').filas[0]));
  });

  console.log('las notas: las ediciones del Taller dejan pasar las de verdad y tiran las falsas');
  await ok('enlaceDePagina y hojasSeguras: una nota larga (mas de 2000) pasa; una falsa no queda ni como enlace', () => {
    const larga = N.enlaceDeNota({ v: 1, k: 'd', t: 'Larga', d: 'é'.repeat(1200), r: { a: 'a'.repeat(200), ti: 't'.repeat(200), f: 'f'.repeat(200) } });
    assert.ok(larga.length > 2000 && larga.length <= 8000, String(larga.length));
    const a = (href) => ({ rect: [10, 10, 100, 30], href });
    assert.equal(PE.enlaceDePagina(a(larga), 600, 800, 10).href, larga);
    for (const falsa of [BASE + 'falsa', BASE + b64('{"v":1,"k":"c","r":"XXX.1"}'), 'https://juanjolopezramirez.com/nota/']) {
      assert.equal(PE.enlaceDePagina(a(falsa), 600, 800, 10), null, falsa);
    }
    assert.equal(PE.enlaceDePagina(a('https://example.com/'), 600, 800, 10).href, 'https://example.com/', 'un enlace normal sigue igual');
    assert.ok(PE.enlaceDePagina(a(enlaceDeCopia('hola')), 600, 800, 10).href, 'y el de copiar tambien');
    const caja = { x: 0.1, y: 0.1, w: 0.2, h: 0.03 };
    const s = PE.hojasSeguras([{ text: 't', links: [{ ...caja, href: larga }, { ...caja, href: BASE + 'falsa' }, { ...caja, href: 'https://example.com/' }] }], 1);
    assert.deepEqual(s[0].links.map((l) => l.href), [larga, 'https://example.com/']);
  });

  console.log('las notas: las reglas de los archivos');
  await ok('los modulos nuevos no escriben HTML a mano; los puros no tocan la pagina ni la red', () => {
    for (const f of ['lector/notaEnPdf.js', 'lector/notaTexto.js', 'lector/indiceLector.js', 'lector/pasajeNota.js', 'lector/hojaNota.js', 'nota.js']) {
      const s = leer('src/scripts/' + f).replace(/\/\*[\s\S]*?\*\//g, '');
      assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/.test(s), f);
    }
    for (const f of ['lector/notaEnPdf.js', 'lector/notaTexto.js', 'lector/indiceLector.js', 'lector/pasajeNota.js']) {
      const s = leer('src/scripts/' + f).replace(/\/\*[\s\S]*?\*\//g, '');
      assert.ok(!/document\.|window\.|localStorage|fetch\(|import\.meta/.test(s), f + ' es puro');
    }
  });
  await ok('la hoja de la nota: enlaces de fuera en otra pestaña sin decir de donde se viene; letras solo de la lista', () => {
    const s = leer('src/scripts/lector/hojaNota.js');
    assert.match(s, /a\.target = '_blank';\s*a\.rel = 'noopener noreferrer';\s*a\.referrerPolicy = 'no-referrer';/);
    assert.match(s, /el\.style\.fontFamily = FUENTES_NOTA\[id\]\.css;/);
    /* Lo unico mas: los dos colores del libro como variables, y solo despues de pasar por coloresSobre (#rrggbb que se lee) */
    const usos = s.match(/\.style\.[^\n;]*/g) || [];
    assert.equal(usos.length, 5, 'ningun otro estilo sale de la nota');
    assert.ok(usos.filter((u) => !u.startsWith('.style.fontFamily')).every((u) => /^\.style\.(setProperty|removeProperty)\('--nota-[tx]'/.test(u)), usos.join(' | '));
    assert.match(s, /const \{ titulo, texto \} = coloresSobre\(nota, fondo\);/);
    assert.match(s, /l\.href = hojaDeFuente\(id\);/);
  });
  await ok('site.js: las notas y el indice llegan con import(), no van en el paquete de todas las paginas', () => {
    const site = leer('src/scripts/site.js');
    assert.ok(!/^import [^\n]*(notaEnPdf|indiceLector|hojaNota|pasajeNota|biblia\/)/m.test(site));
    assert.match(site, /import\('\.\/lector\/notaEnPdf\.js'\)/);
    assert.match(site, /import\('\.\/lector\/indiceLector\.js'\)/);
    assert.match(site, /import\('\.\/lector\/hojaNota\.js'\)/);
    /* una nota falsa no se pinta, ni como enlace */
    assert.match(site, /if \(pareceNota && !nota\) return;/);
    /* «Volver» sabe de donde se vino: el indice salta por goTo */
    assert.match(site, /function irAPagina\(p\) \{[^}]*goTo\(p\);/);
    assert.match(site, /function irANota\(nota, p\) \{[^}]*goTo\(p\);/);
    /* Escape, por orden: la nota antes que el indice, y el campo de buscar se vacia antes de cerrar */
    const esc = site.slice(site.indexOf('/* ESCAPE, POR ORDEN'), site.indexOf('/* LA FIRMA DE LA MARCA'));
    assert.ok(esc.indexOf('notaAbierta()') < esc.indexOf('indiceAbierto()'));
    assert.match(esc, /d\.activeElement === campoBusca && campoBusca\.value/);
  });
  await ok('la pagina /nota/: sin indexar, sin decir de donde vino, y con su guion', () => {
    const p = leer('src/pages/nota.astro');
    assert.match(p, /<meta name="robots" content="noindex, nofollow" \/>/);
    assert.match(p, /<meta name="referrer" content="no-referrer" \/>/);
    assert.match(p, /import '\.\.\/scripts\/nota\.js';/);
    assert.ok(!/\son[a-z]+=/.test(p), 'sin manejadores en linea');
  });
  await ok('la pagina /nota/ no se hace pasar por el sitio: dice de donde viene, muestra el dominio, y sin `l` no enlaza la fuente', () => {
    const s = leer('src/scripts/nota.js');
    assert.match(leer('src/pages/nota.astro'), /<p class="origen" data-origen hidden><\/p>/);
    assert.match(s, /origen\.textContent = tl\('notaOrigen'\);/);
    assert.match(s, /pintarReferencia\(pie, nota, idioma, \{ anfitrion: true, conEnlace: !!nota\.l \}\);/);
    assert.match(s, /addEventListener\('hashchange', pintar\);/);
    assert.match(s, /llenarCita\(/, 'las mismas piezas que el lector: pasaje completo y reintentar');
    assert.equal(UI.es['lector.notaOrigen'], 'Esta nota viene del enlace que abriste.');
    assert.equal(UI.en['lector.notaOrigen'], 'This note comes from the link you opened.');
    assert.ok(UI.es['lector.indiceNo'] && UI.en['lector.indiceNo']);
  });
  await ok('los huecos del texto ({t}, {q}, {v}) se llenan con una funcion: un «$&» del autor no se lee como patron', async () => {
    const { poner } = await import('../src/scripts/lector/hojaNota.js');
    assert.equal(poner('Cita: {t}', '{t}', 'a $& b $1'), 'Cita: a $& b $1');
    /* la hoja de la nota y la pagina /nota/ no llenan huecos a mano: todo pasa por poner() */
    for (const f of ['src/scripts/lector/hojaNota.js', 'src/scripts/nota.js']) assert.ok(!/\.replace\('\{/.test(leer(f)), f);
    const site = leer('src/scripts/site.js');
    assert.match(site, /replace\('\{t\}', \(\) => leerNota\.tituloDeNota\(nota, lectorLang\)\)/);
    assert.match(site, /tl\('sinNada'\)\.replace\('\{q\}', \(\) => q\)/);
  });
  await ok('site.js: el enlace de fuera se mira al pintarlo; lo que llega tarde mira si sigue siendo su libro', () => {
    const site = leer('src/scripts/site.js');
    assert.match(site, /if \(L\.href && !nota && !copia && !enlaceDeFueraBueno\(L\.href\)\) return;/);
    assert.match(site, /const enlaceDeFueraBueno = \(href\) => [^\n]*\/\^\(https:\\\/\\\/\|mailto:\)\/i/);
    assert.match(site, /const mio = libroN;[\s\S]{0,700}if \(libroN !== mio\) return;\s*decir\(tl\('citaNo'\), 4200\);\s*volverFoco\(desde\);/);
    assert.match(site, /if \(!fb \|\| libroN !== mio\) return;/);
    assert.match(site, /if \(indiceAbierto\(\) && libroN === mio\) \{ cajaBusca\.hidden = true; vacioDeIndice\(tl\('indiceNo'\)\); \}/);
    assert.match(site, /if \(e\.altKey \|\| e\.ctrlKey \|\| e\.metaKey\) return;\s*const vis = pestanasVisibles\(\);/);
    assert.match(site, /&& e\.detail > 0\) campoBusca\.focus/);
    assert.ok(!/is-cargando/.test(leer('src/scripts/lector/hojaNota.js')));
    assert.match(leer('src/scripts/lector/hojaNota.js'), /l\.referrerPolicy = 'no-referrer';/);
  });
  await ok('la demo de /vista/ arma sus notas con el mismo modulo (y solo en desarrollo)', () => {
    const v = leer('src/scripts/lector/vistaDemo.js');
    assert.match(v, /href: enlaceDeNota\(nota\)/);
    assert.match(leer('src/scripts/lector/vista.js'), /if \(import\.meta\.env\.DEV && cfg\.modo === 'demo'\) \{\s*const \{ pedirDemo \} = await import\('\.\/vistaDemo\.js'\);/);
  });
  await ok('los textos de las notas y del indice, en español e ingles', () => {
    for (const k of ['indice', 'palabras', 'citas', 'buscar', 'buscarCampo', 'buscaYa', 'sinNada', 'sinTexto', 'sinPalabras', 'sinCitas', 'definicion', 'cita',
      'fuente', 'recomendada', 'enGateway', 'cargandoCita', 'citaNo', 'reintentar', 'omitido', 'numeracion', 'parcial', 'completo', 'primerosVersos', 'verPalabras', 'verCitas', 'pagCorta', 'pagsCorta', 'hallados', 'hallado1', 'primeras']) {
      for (const l of ['es', 'en']) assert.ok(typeof UI[l]['lector.' + k] === 'string' && UI[l]['lector.' + k].trim(), `${l} lector.${k}`);
    }
    for (const [k, h] of [['sinNada', '{q}'], ['definicion', '{t}'], ['cita', '{t}'], ['enGateway', '{v}'], ['pagCorta', '{n}'], ['pagsCorta', '{n}'], ['hallados', '{n}'], ['primeras', '{n}'], ['primerosVersos', '{n}']]) {
      for (const l of ['es', 'en']) assert.ok(UI[l]['lector.' + k].includes(h), `${l} lector.${k} lleva ${h}`);
    }
    assert.equal(UI.es['lector.numeracion'], 'En esta versión se numera distinto.');
    assert.equal(UI.en['lector.numeracion'], 'This version numbers it differently.');
  });
}

/* Suelto: node tools/test-notas.mjs */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let bien = 0, mal = 0;
  await probarNotas(async (nombre, fn) => { try { await fn(); bien++; } catch (e) { mal++; console.log(`  FALLA  ${nombre}\n         ${e.message}`); } });
  console.log(`\n${bien} bien, ${mal} mal`);
  process.exit(mal ? 1 : 0);
}
