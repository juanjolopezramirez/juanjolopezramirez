/* Pruebas de la Biblia del lector. Sin dependencias:

     node tools/test-biblia.mjs

   Prueban src/scripts/biblia/ (libros.js, referencias.js, cargar.js) y los datos de public/biblia/ que escribe
   tools/biblia.mjs: el lector de citas en espanol y en ingles (rangos, listas, choques de abreviaturas, tildes,
   ordinales, rechazos y el modo «auto»), la ida y vuelta de la forma canonica, el enlace a Bible Gateway, el cargador
   con un fetch de mentira (tamano, forma, version, memoria LRU) y versiculos de verdad en las dos versiones.
   Se para con codigo 1 si algo falla. */
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import fs from 'node:fs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

const { LIBROS, libroDe, versosDe, buscarLibro, plano, TRONCOS } = await cargar('src/scripts/biblia/libros.js');
const { VERSOS } = await cargar('src/scripts/biblia/versos.js');
const { leerReferencias, canonica, deCanonica, rotulo, enlaceGateway, idiomaDeVersion } = await cargar('src/scripts/biblia/referencias.js');
const { cargarPasaje, rutaLibro, libroValido, vaciarMemoria, enMemoria, MAX_BYTES, VERSIONES, baseSegura, existeEn, cobertura, esParcial, motivoSinTexto, limitarVersos, MAX_VERSOS_MOSTRAR } = await cargar('src/scripts/biblia/cargar.js');
const { textoParaLeer } = await cargar('src/scripts/biblia/mostrar.js');
const { versosEn, COMUNES } = await cargar('src/scripts/biblia/libros.js');

let n = 0;
let mal = 0;
const pendientes = [];
const ok = (nombre, fn) => {
  const fallo = (e) => { mal++; console.log(' MAL  ' + nombre + '\n      ' + String(e && e.message).split('\n')[0]); };
  try {
    const r = fn();
    if (r && typeof r.then === 'function') { pendientes.push(r.then(() => { n++; console.log('  ok  ' + nombre); }, fallo)); return; }
    n++; console.log('  ok  ' + nombre);
  } catch (e) { fallo(e); }
};
const enOrden = async (nombre, fn) => { try { await fn(); n++; console.log('  ok  ' + nombre); } catch (e) { mal++; console.log(' MAL  ' + nombre + '\n      ' + String(e && e.message).split('\n')[0]); } };

const C = (texto, op = {}) => leerReferencias(texto, op).map(canonica);
const igual = (texto, esperado, op) => assert.deepEqual(C(texto, op), esperado, texto);

/* ------------------------------------------------------------------ */
console.log('los libros');
ok('66 libros, numerados 1-66, codigos USFM unicos, 1189 capitulos', () => {
  assert.equal(LIBROS.length, 66);
  assert.deepEqual(LIBROS.map((l) => l.n), Array.from({ length: 66 }, (_, i) => i + 1));
  assert.equal(new Set(LIBROS.map((l) => l.usfm)).size, 66);
  assert.equal(LIBROS.reduce((s, l) => s + l.caps, 0), 1189);
});
ok('versos.js tiene un capitulo por capitulo de libros.js y nada vacio', () => {
  assert.equal(Object.keys(VERSOS).length, 66);
  for (const l of LIBROS) {
    assert.equal(VERSOS[l.usfm].length, l.caps, l.usfm);
    assert.ok(VERSOS[l.usfm].every((x) => Number.isInteger(x) && x > 0 && x <= 176), l.usfm);
  }
  assert.equal(versosDe('PSA', 119), 176);
  assert.equal(versosDe('JHN', 3), 36);
  assert.equal(versosDe('JHN', 22), 0);
  assert.equal(versosDe('XXX', 1), 0);
});
ok('ningun tronco lleva tildes ni mayusculas (se compara contra el texto aplanado)', () => {
  for (const t of TRONCOS) assert.equal(plano(t), t, t);
});
ok('plano() mide lo mismo que la entrada (los desplazamientos valen en el original)', () => {
  for (const s of ['Éxodo 3:14', 'Génesis', 'ÑANDÚ ü ß İ', 'emoji 😀 Juan', '1.ª Corintios']) assert.equal(plano(s).length, s.length, s);
  assert.equal(plano('Éxodo JEREMÍAS'), 'exodo jeremias');
});
ok('buscarLibro: el idioma pedido primero, el otro despues', () => {
  assert.equal(buscarLibro(null, 'jn', 'es').usfm, 'JHN');
  assert.equal(buscarLibro(1, 'jn', 'es').usfm, '1JN');
  assert.equal(buscarLibro(null, 'John', 'es').usfm, 'JHN');
  assert.equal(buscarLibro(null, 'Jeremías', 'en').usfm, 'JER');
  assert.equal(buscarLibro(4, 'juan', 'es'), null);
  assert.equal(buscarLibro(null, 'corintios', 'es'), null);
});

/* ------------------------------------------------------------------ */
console.log('\ncitas en espanol');
ok('solo capitulo, versiculo, entre parentesis', () => {
  igual('Salmo 139', ['PSA.139']);
  igual('Juan 13:3', ['JHN.13.3']);
  igual('(Juan 13:3)', ['JHN.13.3']);
});
ok('desde/hasta/texto apuntan al original', () => {
  const [r] = leerReferencias('Lee (Juan 13:3) hoy.');
  assert.equal(r.desde, 5); assert.equal(r.hasta, 14); assert.equal(r.texto, 'Juan 13:3');
  const t = 'Jeremías 1:4-5 y el Salmo 139';
  const [a, b] = leerReferencias(t);
  assert.deepEqual([a.desde, a.hasta, a.texto], [0, 14, 'Jeremías 1:4-5']);
  assert.deepEqual([b.desde, b.hasta, b.texto], [20, 29, 'Salmo 139']);
  assert.equal(t.slice(b.desde, b.hasta), b.texto);
});
ok('rangos: guion, raya, entre capitulos, de capitulos', () => {
  igual('Lucas 15:11-32', ['LUK.15.11-32']);
  igual('Lucas 15:11–32', ['LUK.15.11-32']);
  igual('Lucas 15:11 — 32', ['LUK.15.11-32']);
  igual('Juan 3:16–4:2', ['JHN.3.16-4.2']);
  igual('Mateo 5–7', ['MAT.5-7']);
  igual('Mateo 5-7', ['MAT.5-7']);
  const [r] = leerReferencias('Juan 3:16–4:2');
  assert.deepEqual({ ...r, desde: 0, hasta: 0, texto: '' }, { libro: 'JHN', cap: 3, v1: 16, cap2: 4, v2: 2, desde: 0, hasta: 0, texto: '' });
  const [s] = leerReferencias('Salmo 139');
  assert.equal(s.v1, null); assert.equal(s.v2, null); assert.equal('cap2' in s, false);
  const [j] = leerReferencias('Jeremías 1:4-5');
  assert.deepEqual([j.libro, j.cap, j.v1, j.v2], ['JER', 1, 4, 5]);
});
ok('listas: «y», «;» sigue el mismo libro, «,» tras versiculo es versiculo', () => {
  igual('Jeremías 1:4-5 y el Salmo 139', ['JER.1.4-5', 'PSA.139']);
  igual('Sal 23; 24:1-3', ['PSA.23', 'PSA.24.1-3']);
  igual('Mateo 3:17 y 4:3', ['MAT.3.17', 'MAT.4.3']);
  igual('Juan 3:16, 18', ['JHN.3.16', 'JHN.3.18']);
  igual('Juan 3:16, 18-20', ['JHN.3.16', 'JHN.3.18-20']);
  igual('Juan 3:16; 5', ['JHN.3.16', 'JHN.5']);
  igual('Salmos 23, 24', ['PSA.23', 'PSA.24']);
  igual('Juan 3:16; 1 Juan 4:8', ['JHN.3.16', '1JN.4.8']);
  igual('Romanos 8:28, 1 Corintios 13:4', ['ROM.8.28', '1CO.13.4']);
  igual('Juan 3:16 y Romanos 5:8', ['JHN.3.16', 'ROM.5.8']);
});
ok('separador «:» (con espacios), «.» pegado y «,» pegado si el versiculo existe', () => {
  igual('Juan 3.16', ['JHN.3.16']);
  igual('Juan 3:16', ['JHN.3.16']);
  igual('Juan 3: 16', ['JHN.3.16']);
  igual('Juan 3 : 16', ['JHN.3.16']);
  igual('Jn 3,16', ['JHN.3.16']);
  igual('Juan 3,16', ['JHN.3.16']);
  igual('Mt 5,3-12', ['MAT.5.3-12']);
  igual('Salmos 23,24', ['PSA.23', 'PSA.24']);          // Salmo 23 no tiene versiculo 24: la coma es lista
  igual('Salmos 53, 54', ['PSA.53', 'PSA.54']);         // con espacio, siempre lista
  igual('Juan 3, 16', ['JHN.3', 'JHN.16']);
  igual('Lee Juan 3. Luego reza.', ['JHN.3']);
  const [r] = leerReferencias('Lee Jn 3,16.');
  assert.deepEqual([r.desde, r.hasta, r.texto], [4, 11, 'Jn 3,16']);
});
ok('sufijos de versiculo y signo menos (−) como rango', () => {
  igual('Juan 3:16b-18', ['JHN.3.16-18']);
  igual('Juan 3:16a', ['JHN.3.16']);
  igual('Efesios 2:8−9', ['EPH.2.8-9']);
});
ok('NFC/NFD: «Jeremías» con la tilde suelta se lee y las posiciones son las del original', () => {
  const nfd = 'Ver Jeremías 1:5 hoy'.normalize('NFD');
  assert.notEqual(nfd, nfd.normalize('NFC'));
  const [r] = leerReferencias(nfd);
  assert.equal(canonica(r), 'JER.1.5');
  assert.equal(nfd.slice(r.desde, r.hasta), r.texto);
  assert.equal(r.texto.normalize('NFC'), 'Jeremías 1:5');
  const [s] = leerReferencias(nfd + ' y Éxodo 3:14'.normalize('NFD'));
  assert.equal(canonica(s), 'JER.1.5');
  const t = leerReferencias(('Éxodo 3:14 y Jeremías 1:5').normalize('NFD'));
  assert.deepEqual(t.map((x) => x.texto.normalize('NFC')), ['Éxodo 3:14', 'Jeremías 1:5']);
});
ok('el ordinal que no cuadra se descarta: «Capítulo 3 de Juan 3:16», «Versículo 2 Juan 3:16»', () => {
  igual('Capítulo 3 de Juan 3:16', ['JHN.3.16']);
  igual('Versículo 2 Juan 3:16', ['JHN.3.16']);
  const [r] = leerReferencias('Capítulo 3 de Juan 3:16');
  assert.equal(r.texto, 'Juan 3:16');
  igual('2 Juan 6', ['2JN.1.6']);                      // el que si cuadra se queda
});
ok('«Primera Epístola de Juan», «Primera carta a los Corintios», «First Epistle of John»', () => {
  igual('Primera Epístola de Juan 4:8', ['1JN.4.8']);
  igual('Primera epistola de San Juan 4:8', ['1JN.4.8']);
  igual('Primera carta de Juan 1:9', ['1JN.1.9']);
  igual('Primera carta a los Corintios 13:4', ['1CO.13.4']);
  igual('Segunda carta a Timoteo 3:16', ['2TI.3.16']);
  igual('First Epistle of John 4:8', ['1JN.4.8'], { idioma: 'en' });
  igual('Second Letter to the Corinthians 5:17', ['2CO.5.17'], { idioma: 'en' });
});
ok('tildes opcionales y mayusculas indiferentes (fuera de auto)', () => {
  igual('Jeremias 1:5', ['JER.1.5']);
  igual('JEREMÍAS 1:5', ['JER.1.5']);
  igual('Exodo 3:14', ['EXO.3.14']);
  igual('Éxodo 3:14', ['EXO.3.14']);
  igual('genesis 1:1', ['GEN.1.1']);
  igual('Gálatas 2:20 y Galatas 5:22', ['GAL.2.20', 'GAL.5.22']);
  igual('Nahum 1:7', ['NAM.1.7']);
});
ok('ordinales: 1, I, 1ra, 1a, 1.ª, Primera, Primero, 1 de, II, Segunda, 2do, 3ra, Tercera', () => {
  for (const t of ['1 Juan 4:8', 'I Juan 4:8', '1ra Juan 4:8', '1ra. Juan 4:8', '1a Juan 4:8', '1.ª Juan 4:8', '1ª Juan 4:8', 'Primera Juan 4:8', 'Primera de Juan 4:8', '1 de Juan 4:8', '1Jn 4:8', '1 Jn 4:8']) igual(t, ['1JN.4.8']);
  igual('Primero de Samuel 3:10', ['1SA.3.10']);
  igual('1 S 3:10', ['1SA.3.10']);
  igual('II Reyes 5:14', ['2KI.5.14']);
  igual('2do Reyes 5', ['2KI.5']);
  igual('Segunda de Pedro 3:9', ['2PE.3.9']);
  igual('2 Ti 3:16', ['2TI.3.16']);
  igual('3ra Juan 2', ['3JN.1.2']);
  igual('Tercera de Juan 1:4', ['3JN.1.4']);
  igual('1 Co 13:4', ['1CO.13.4']);
  igual('1Co13:4', ['1CO.13.4']);
  igual('1 Cr 16:34', ['1CH.16.34']);
  igual('1 Tes 5:17', ['1TH.5.17']);
});
ok('choques: Jn / 1 Jn, Fil / Flm, Jue / Jud, Ez / Esd', () => {
  igual('Jn 3:16', ['JHN.3.16']);
  igual('1 Jn 3:16', ['1JN.3.16']);
  igual('Fil 4:13', ['PHP.4.13']);
  igual('Flm 6', ['PHM.1.6']);
  igual('Filemón 1:6', ['PHM.1.6']);
  igual('Jue 6:12', ['JDG.6.12']);
  igual('Jud 3', ['JUD.1.3']);
  igual('Judas 24-25', ['JUD.1.24-25']);
  igual('Ez 37:1', ['EZK.37.1']);
  igual('Esd 7:10', ['EZR.7.10']);
  igual('Ezequiel 36:26', ['EZK.36.26']);
});
ok('Salmo / Salmos / Sal, Cantares / Cantar de los Cantares, Apocalipsis', () => {
  igual('Salmo 23', ['PSA.23']);
  igual('Salmos 23:1', ['PSA.23.1']);
  igual('Sal 23:1', ['PSA.23.1']);
  igual('Cantares 2:4', ['SNG.2.4']);
  igual('Cantar de los Cantares 2:4', ['SNG.2.4']);
  igual('Cant 8:6', ['SNG.8.6']);
  igual('Apocalipsis 21:4', ['REV.21.4']);
  igual('Ap 3:20', ['REV.3.20']);
  igual('Hechos 2:38', ['ACT.2.38']);
  igual('Hch 2:38', ['ACT.2.38']);
});
ok('libros de un capitulo: el numero solo es versiculo', () => {
  igual('Abdías 15', ['OBA.1.15']);
  igual('2 Juan 6', ['2JN.1.6']);
  igual('Judas 1:3', ['JUD.1.3']);
  igual('Judas 3, 5', ['JUD.1.3', 'JUD.1.5']);
});
ok('rechazos: fuera de rango, «1 de mayo», numeros sueltos, rangos al reves', () => {
  igual('Juan 99:1', []);
  igual('Juan 3:99', []);
  igual('Juan 22', []);
  igual('1 de mayo', []);
  igual('El 1 de mayo de 2024', []);
  igual('Juan 1 de mayo', []);
  igual('3:16', []);
  igual('En 1990 vinieron 3 personas, 16:30 h', []);
  igual('Juan 3:16-10', []);
  igual('Mateo 7–5', []);
  igual('Abdías 22', []);
  igual('3 Juan 3:16', ['JHN.3.16']);       // 3 Juan no tiene capitulo 3: se lee sin el ordinal (como «Capítulo 3 de Juan 3:16»)
  igual('3 Juan 22:1', []);                 // ni 3 Juan ni Juan tienen capitulo 22
  igual('Juan 3:16:20', []);
  igual('Juanito 3:16', []);
  igual('Juan3', ['JHN.3']);                 // pegado vale fuera de auto
  igual('Juan 0:1', []);
  igual('Juan 3:0', []);
  igual('', []);
  assert.deepEqual(leerReferencias(null), []);
});
ok('texto largo (300 KB): se lee por trozos sin perder ni repetir citas, con posiciones exactas', () => {
  const largo = 'Juan 3:16 '.repeat(30000);
  const r = leerReferencias(largo);
  assert.equal(r.length, 30000);
  assert.ok(r.every((x, i) => x.desde === 10 * i && x.hasta === 10 * i + 9 && x.texto === 'Juan 3:16'));
  /* una lista que cruza el corte de un trozo sigue con su libro */
  const relleno = 'palabra '.repeat(12499);                       // 99.992 letras
  const t = relleno + 'Sal 23; 24:1-3; 25 y fin';
  assert.deepEqual(leerReferencias(t).map((x) => [canonica(x), t.slice(x.desde, x.hasta)]), [['PSA.23', 'Sal 23'], ['PSA.24.1-3', '24:1-3'], ['PSA.25', '25']]);
  /* sin espacios donde cortar */
  const pegado = 'x'.repeat(150000) + ' Juan 3:16';
  assert.deepEqual(C(pegado), ['JHN.3.16']);
  assert.deepEqual(leerReferencias('a'.repeat(5000001)), []);    // por encima del tope: nada
});
ok('una lista se corta en lo invalido sin perder lo bueno', () => {
  igual('Juan 3:16, 99', ['JHN.3.16']);
  igual('Sal 23; 151', ['PSA.23']);
});

/* ------------------------------------------------------------------ */
console.log('\ncitas en ingles');
ok('nombres, rangos y listas en ingles', () => {
  const en = { idioma: 'en' };
  igual('John 3:16', ['JHN.3.16'], en);
  igual('Jeremiah 1:4-5 and Psalm 139', ['JER.1.4-5', 'PSA.139'], en);
  igual('Psalms 23; 24:1-3', ['PSA.23', 'PSA.24.1-3'], en);
  igual('Matthew 5–7', ['MAT.5-7'], en);
  igual('Luke 15:11-32', ['LUK.15.11-32'], en);
  igual('Matthew 3:17 and 4:3', ['MAT.3.17', 'MAT.4.3'], en);
  igual('Song of Songs 2:4', ['SNG.2.4'], en);
  igual('Song of Solomon 2:4', ['SNG.2.4'], en);
  igual('Revelation 21:4', ['REV.21.4'], en);
  igual('Revelations 21:4', ['REV.21.4'], en);
  igual('Phil 4:13', ['PHP.4.13'], en);
  igual('Phlm 6', ['PHM.1.6'], en);
  igual('Jude 3', ['JUD.1.3'], en);
  igual('Judg 6:12', ['JDG.6.12'], en);
  igual('Ezek 37:1', ['EZK.37.1'], en);
  igual('Ezra 7:10', ['EZR.7.10'], en);
  igual('Job 38:4', ['JOB.38.4'], en);
  igual('Acts 2:38', ['ACT.2.38'], en);
  igual('Numbers 6:24-26', ['NUM.6.24-26'], en);
});
ok('ordinales en ingles: 1, I, 1st, First, II, 2nd, Second, III, 3rd, Third', () => {
  const en = { idioma: 'en' };
  for (const t of ['1 John 1:9', 'I John 1:9', '1st John 1:9', 'First John 1:9', '1 Jn 1:9', '1Jn 1:9']) igual(t, ['1JN.1.9'], en);
  igual('II Corinthians 5:17', ['2CO.5.17'], en);
  igual('2nd Corinthians 5:17', ['2CO.5.17'], en);
  igual('Second Corinthians 5:17', ['2CO.5.17'], en);
  igual('III John 4', ['3JN.1.4'], en);
  igual('3rd John 4', ['3JN.1.4'], en);
  igual('Third John 4', ['3JN.1.4'], en);
  igual('1 Kings 19:12', ['1KI.19.12'], en);
  igual('2 Chronicles 7:14', ['2CH.7.14'], en);
});
ok('un texto en espanol puede citar en ingles y al reves', () => {
  igual('John 3:16', ['JHN.3.16'], { idioma: 'es' });
  igual('Juan 3:16', ['JHN.3.16'], { idioma: 'en' });
});

/* ------------------------------------------------------------------ */
console.log('\nmodo auto (texto corrido)');
ok('minusculas no cuentan: job, acts, numbers, juan', () => {
  const en = { idioma: 'en', auto: true };
  igual('I got a job 3 days ago', [], en);
  igual('the acts 2 and 3 were long', [], en);
  igual('numbers 3 and 4 are odd', [], en);
  igual('read john 3:16', [], en);
  igual('juan 3:16 dice', [], { idioma: 'es', auto: true });
  igual('read John 3:16', ['JHN.3.16'], en);
  igual('Acts 2:38 says', ['ACT.2.38'], en);
});
ok('abreviaturas que son palabras: solo con capitulo:versiculo', () => {
  const es = { idioma: 'es', auto: true };
  const en = { idioma: 'en', auto: true };
  igual('Sal 2 cucharadas', [], es);
  igual('Sal 23:1', ['PSA.23.1'], es);
  igual('Is 5 enough?', [], en);
  igual('Is 53:5', ['ISA.53.5'], en);
  igual('Job 38', [], en);
  igual('Job 38', ['JOB.38'], es);
  igual('Job 38:4', ['JOB.38.4'], en);
  igual('Mi 6:8', ['MIC.6.8'], es);
  igual('Mi 6 hermanos', [], es);
});
ok('auto exige numero tras el libro y no confunde nombres ni fechas', () => {
  const es = { idioma: 'es', auto: true };
  igual('Juan y Lucas vinieron', [], es);
  igual('Juan 1 de mayo', [], es);
  igual('Lucas tiene 15 años', [], es);
  igual('Como dice Jeremías 1:4-5 y el Salmo 139, Dios nos conoce.', ['JER.1.4-5', 'PSA.139'], es);
  igual('Mateo 3:17 y 4:3', ['MAT.3.17', 'MAT.4.3'], es);
});
ok('auto: «y» + numero suelto no sigue la lista; «,» y «;» si', () => {
  const es = { idioma: 'es', auto: true };
  igual('Juan 3:16 y 18 personas', ['JHN.3.16'], es);
  igual('Juan 3:16 y 18 personas', ['JHN.3.16', 'JHN.3.18']);
  igual('Juan 3:16, 18', ['JHN.3.16', 'JHN.3.18'], es);
});
ok('auto: abreviatura comun sin versiculo vale con punto o entre parentesis', () => {
  const es = { idioma: 'es', auto: true };
  const en = { idioma: 'en', auto: true };
  igual('Lee (Sal 23) hoy', ['PSA.23'], es);
  igual('Sal. 23', ['PSA.23'], es);
  igual('Is. 53', ['ISA.53'], en);
  igual('(Ap 21)', ['REV.21'], es);
  igual('Ap 21', [], es);
  igual('Ex. 20', ['EXO.20'], es);
  igual('Ex 20', [], es);
  igual('( Ex 20 )', ['EXO.20'], es);
  igual('(Sal 23; 24:1-3)', ['PSA.23', 'PSA.24.1-3'], es);
  igual('sal. 2 cucharadas', [], es);                   // minuscula: sigue sin contar
  igual('Is 5 enough?', [], en);
  igual('(Job 38)', ['JOB.38'], en);
});
ok('auto: el romano en minuscula no es ordinal', () => {
  igual('I John 1:9', ['1JN.1.9'], { idioma: 'en', auto: true });
  igual('i John 1:9', ['JHN.1.9'], { idioma: 'en', auto: true });
});

/* ------------------------------------------------------------------ */
console.log('\nforma canonica, rotulo, Bible Gateway');
ok('canonica: JER.1.4-5, PSA.139, JHN.3.16-4.2, MAT.5-7, JHN.3.16', () => {
  assert.equal(canonica({ libro: 'JER', cap: 1, v1: 4, v2: 5 }), 'JER.1.4-5');
  assert.equal(canonica({ libro: 'PSA', cap: 139, v1: null, v2: null }), 'PSA.139');
  assert.equal(canonica({ libro: 'JHN', cap: 3, v1: 16, cap2: 4, v2: 2 }), 'JHN.3.16-4.2');
  assert.equal(canonica({ libro: 'MAT', cap: 5, cap2: 7, v1: null, v2: null }), 'MAT.5-7');
  assert.equal(canonica({ libro: 'JHN', cap: 3, v1: 16, v2: 16 }), 'JHN.3.16');
  assert.equal(canonica({ libro: 'JHN', cap: 30, v1: null, v2: null }), null);
  assert.equal(canonica(null), null);
});
ok('ida y vuelta: todo lo leido vuelve igual desde su forma canonica', () => {
  const textos = ['Jeremías 1:4-5 y el Salmo 139', 'Juan 3:16–4:2', 'Mateo 5–7', 'Sal 23; 24:1-3', 'Judas 3-5', '1 Juan 4:8', 'Lucas 15:11-32', 'Mateo 5:1-7:29', 'Mateo 5–7:3', 'Apocalipsis 22'];
  for (const t of textos) {
    for (const r of leerReferencias(t)) {
      const { desde, hasta, texto, ...pura } = r;
      assert.deepEqual(deCanonica(canonica(r)), pura, t);
    }
  }
  for (const l of LIBROS) {
    const ultimo = { libro: l.usfm, cap: l.caps, v1: 1, v2: versosDe(l.usfm, l.caps) };
    assert.deepEqual(deCanonica(canonica(ultimo)), ultimo, l.usfm);
  }
});
ok('deCanonica es estricta: basura → null', () => {
  for (const s of ['JHN.3.16-16', 'JHN.03.16', 'XXX.1', 'JHN.22', 'JHN.3.16-2', 'JHN.3-4.2', 'jhn.3.16', '', 'JHN.3.16 ', ' JHN.3.16', '<script>', 'JHN.3.16-4.99', 'JHN.3.16.1', 'JHN..3', 'PSA.139-139', 'JUD.3', 'JHN.3.0', 'JHN.3.16-3.18', 'A'.repeat(40)]) {
    assert.equal(deCanonica(s), null, s);
  }
  for (const x of [null, undefined, 42, {}, ['JHN.3.16']]) assert.equal(deCanonica(x), null);
  assert.deepEqual(deCanonica('JUD.1.3'), { libro: 'JUD', cap: 1, v1: 3, v2: 3 });
});
ok('rotulo en espanol y en ingles', () => {
  const r = (s, i) => rotulo(deCanonica(s), i);
  assert.equal(r('JER.1.4-5', 'es'), 'Jeremías 1:4-5');
  assert.equal(r('JER.1.4-5', 'en'), 'Jeremiah 1:4-5');
  assert.equal(r('PSA.139', 'es'), 'Salmo 139');
  assert.equal(r('PSA.139', 'en'), 'Psalm 139');
  assert.equal(r('PSA.23-24', 'es'), 'Salmos 23-24');
  assert.equal(r('PSA.23-24', 'en'), 'Psalms 23-24');
  assert.equal(r('JHN.3.16-4.2', 'es'), 'Juan 3:16-4:2');
  assert.equal(r('1JN.4.8', 'en'), '1 John 4:8');
  assert.equal(r('SNG.2.4', 'en'), 'Song of Songs 2:4');
  assert.equal(r('REV.21.4', 'es'), 'Apocalipsis 21:4');
  assert.equal(r('MAT.5-7', 'pt'), 'Mateo 5-7');      // cualquier otro idioma: espanol
  assert.equal(rotulo({ libro: 'JHN', cap: 99, v1: null, v2: null }), null);
});
ok('enlaceGateway arma la direccion y valida la version', () => {
  const jer = deCanonica('JER.1.4-5');
  assert.equal(enlaceGateway(jer, 'NVI', 'es'), 'https://www.biblegateway.com/passage/?search=Jerem%C3%ADas%201%3A4-5&version=NVI');
  assert.equal(enlaceGateway('JHN.3.16', 'NIV', 'en'), 'https://www.biblegateway.com/passage/?search=John%203%3A16&version=NIV');
  for (const v of ['NVI', 'RVR1960', 'NIV', 'ESV', 'RVR1909', 'WEB', 'NBLA', 'NTV']) assert.ok(enlaceGateway(jer, v, 'es').endsWith('&version=' + v), v);
  assert.ok(enlaceGateway(jer, 'rvr1960', 'es').endsWith('&version=RVR1960'));
  for (const v of ['N', 'NVI;x', 'NVI&a=1', 'A'.repeat(13), '', 'NV I', '<b>', null, undefined, 7]) assert.equal(enlaceGateway(jer, v, 'es'), null, String(v));
  assert.equal(enlaceGateway({ libro: 'JHN', cap: 99, v1: null, v2: null }, 'NVI', 'es'), null);
  assert.equal(enlaceGateway('basura', 'NVI', 'es'), null);
});
ok('enlaceGateway: el nombre del libro va en el idioma de la version, no de la pagina', () => {
  const s = (u) => decodeURIComponent(/search=([^&]*)/.exec(u)[1]);
  assert.equal(s(enlaceGateway('JHN.3.16', 'NVI', 'en')), 'Juan 3:16');
  assert.equal(s(enlaceGateway('JHN.3.16', 'NIV', 'es')), 'John 3:16');
  assert.equal(s(enlaceGateway('PSA.23', 'RVA-2015', 'en')), 'Salmo 23');
  assert.equal(s(enlaceGateway('PSA.23', 'ESV')), 'Psalm 23');
  for (const v of ['RVR1960', 'RVR1909', 'NVI', 'LBLA', 'NBLA', 'NTV', 'DHH', 'RVC', 'RVA', 'TLA', 'PDT', 'BLP', 'NBV', 'RVA-2015', 'JBS', 'CST', 'BLPH']) {
    assert.equal(idiomaDeVersion(v), 'es', v);
  }
  for (const v of ['NIV', 'ESV', 'KJV', 'WEB', 'NKJV', 'XYZ']) assert.equal(idiomaDeVersion(v), 'en', v);
});

/* ------------------------------------------------------------------ */
console.log('\nel cargador (fetch de mentira)');
const dirBiblia = path.join(raiz, 'public', 'biblia');
const desdeDisco = () => {
  const llamadas = [];
  const traer = async (url, op) => {
    llamadas.push(url);
    llamadas.opciones = op;
    const m = /\/biblia\/(rv1909|web)\/(\d\d-[0-9A-Z]{3}\.json)$/.exec(url);
    if (!m) return { ok: false, status: 404, headers: new Map(), text: async () => '' };
    const cuerpo = fs.readFileSync(path.join(dirBiblia, m[1], m[2]), 'utf8');
    return { ok: true, status: 200, headers: new Map([['content-length', String(Buffer.byteLength(cuerpo))]]), text: async () => cuerpo };
  };
  return { traer, llamadas };
};
const responder = (cuerpo, cabeceras = {}) => async () => ({ ok: true, status: 200, headers: new Map(Object.entries(cabeceras)), text: async () => cuerpo });
const JHN = deCanonica('JHN.3.16');

await enOrden('rutaLibro: base con y sin barra, solo versiones permitidas', async () => {
  assert.equal(rutaLibro('JHN', 'rv1909', '/'), '/biblia/rv1909/43-JHN.json');
  assert.equal(rutaLibro('GEN', 'web', '/sitio'), '/sitio/biblia/web/01-GEN.json');
  assert.equal(rutaLibro('REV', 'web', '/sitio/'), '/sitio/biblia/web/66-REV.json');
  assert.equal(rutaLibro('JHN', 'kjv', '/'), null);
  assert.equal(rutaLibro('XXX', 'web', '/'), null);
  assert.deepEqual(VERSIONES, ['rv1909', 'web']);
});
await enOrden('base insegura → «/»; se pide sin seguir redirecciones', async () => {
  for (const b of ['//evil.com/', 'https://evil.com/', '/a/../', '..', '', null, 42, '/a b/', '/a?x=1', '\\\\evil', 'javascript:alert(1)']) {
    assert.equal(baseSegura(b), '/', String(b));
  }
  assert.equal(baseSegura('/repo'), '/repo/');
  assert.equal(baseSegura('/repo/sub/'), '/repo/sub/');
  assert.equal(rutaLibro('JHN', 'web', '//evil.com/'), '/biblia/web/43-JHN.json');
  vaciarMemoria();
  const { traer, llamadas } = desdeDisco();
  await cargarPasaje(JHN, 'web', { base: 'https://evil.com/', fetch: traer });
  assert.equal(llamadas[0], '/biblia/web/43-JHN.json');
  assert.equal(llamadas.opciones.redirect, 'error');
  assert.equal(llamadas.opciones.credentials, 'same-origin');
});
await enOrden('numeracion distinta: RV1909 Jonás 1:17 y WEB Romanos 16:25-27 → «numeracion»; rangos cortados → «parcial»', async () => {
  const jon = leerReferencias('Jonás 1:17')[0];
  assert.equal(canonica(jon), 'JON.1.17');
  assert.equal(existeEn(jon, 'rv1909'), false);
  assert.equal(existeEn(jon, 'web'), true);
  assert.equal(motivoSinTexto(jon, 'rv1909'), 'numeracion');
  assert.equal(motivoSinTexto(jon, 'web'), null);
  const rom = leerReferencias('Romanos 16:25-27')[0];
  assert.equal(motivoSinTexto(rom, 'web'), 'numeracion');
  assert.equal(motivoSinTexto(rom, 'rv1909'), null);
  assert.equal(cobertura(rom, 'rv1909'), 'completa');
  const corto = deCanonica('JON.1.15-17');
  assert.equal(cobertura(corto, 'rv1909'), 'parcial');
  assert.equal(esParcial(corto, 'rv1909'), true);
  assert.equal(esParcial(corto, 'web'), false);
  assert.equal(cobertura(deCanonica('PSA.23'), 'web'), 'completa');
  assert.equal(motivoSinTexto(deCanonica('PSA.23'), 'kjv'), 'invalida');
  assert.equal(motivoSinTexto({ libro: 'JHN', cap: 99, v1: null, v2: null }, 'web'), 'invalida');
  assert.equal(versosEn('JON', 1, 'rv1909'), 16);
  assert.equal(versosEn('JON', 1, 'web'), 17);
  assert.equal(versosEn('JON', 1, 'kjv'), 0);
  vaciarMemoria();
  const { traer } = desdeDisco();
  assert.equal(await cargarPasaje(jon, 'rv1909', { fetch: traer }), null);
  assert.match((await cargarPasaje(jon, 'web', { fetch: traer }))[0].t, /huge fish/);
  assert.equal(await cargarPasaje(rom, 'web', { fetch: traer }), null);
  const parte = await cargarPasaje(corto, 'rv1909', { fetch: traer });
  assert.deepEqual(parte.map((x) => x.v), [15, 16]);
});
ok('limitarVersos: tope de lectura en pantalla', () => {
  assert.equal(MAX_VERSOS_MOSTRAR, 40);
  const muchos = Array.from({ length: 176 }, (_, i) => ({ cap: 119, v: i + 1, t: 'x' }));
  const r = limitarVersos(muchos);
  assert.deepEqual([r.versos.length, r.recortado, r.total], [40, true, 176]);
  assert.deepEqual(limitarVersos(muchos.slice(0, 6)).recortado, false);
  assert.equal(limitarVersos(muchos, 10).versos.length, 10);
  assert.deepEqual(limitarVersos(null), { versos: [], recortado: false, total: 0 });
  assert.equal(limitarVersos(muchos, -3).versos.length, 40);
});
await enOrden('version desconocida o cita invalida: null y sin pedir nada', async () => {
  vaciarMemoria();
  const { traer, llamadas } = desdeDisco();
  assert.equal(await cargarPasaje(JHN, 'kjv', { fetch: traer }), null);
  assert.equal(await cargarPasaje(JHN, '../web', { fetch: traer }), null);
  assert.equal(await cargarPasaje({ libro: 'JHN', cap: 99, v1: null, v2: null }, 'web', { fetch: traer }), null);
  assert.equal(await cargarPasaje(null, 'web', { fetch: traer }), null);
  assert.equal(llamadas.length, 0);
});
await enOrden('trae el versiculo, el rango entre capitulos y el capitulo entero', async () => {
  vaciarMemoria();
  const { traer, llamadas } = desdeDisco();
  const uno = await cargarPasaje(JHN, 'rv1909', { base: '/', fetch: traer });
  assert.equal(uno.length, 1);
  assert.deepEqual([uno[0].cap, uno[0].v], [3, 16]);
  assert.match(uno[0].t, /unigénito/);
  const cruzado = await cargarPasaje(deCanonica('JHN.3.16-4.2'), 'rv1909', { fetch: traer });
  assert.equal(cruzado.length, 36 - 16 + 1 + 2);
  assert.deepEqual([cruzado.at(-1).cap, cruzado.at(-1).v], [4, 2]);
  const sal = await cargarPasaje(deCanonica('PSA.23'), 'web', { fetch: traer });
  assert.equal(sal.length, 6);
  assert.equal(llamadas.length, 2, 'Juan se pidio una vez; Salmos otra');
  assert.ok(llamadas.every((u) => u.startsWith('/biblia/')));
});
await enOrden('mas de 600 KB (por cabecera o por cuerpo): null', async () => {
  vaciarMemoria();
  const bueno = fs.readFileSync(path.join(dirBiblia, 'web', '43-JHN.json'), 'utf8');
  assert.equal(await cargarPasaje(JHN, 'web', { fetch: responder(bueno, { 'content-length': String(MAX_BYTES + 1) }) }), null);
  const gordo = JSON.stringify({ c: 'JHN', caps: JSON.parse(bueno).caps.map((c, i) => (i === 0 ? c.concat(['x'.repeat(MAX_BYTES)]) : c)) });
  assert.equal(await cargarPasaje(JHN, 'web', { fetch: responder(gordo) }), null);
  const tildes = JSON.stringify({ c: 'JHN', caps: JSON.parse(bueno).caps.map((c, i) => (i === 0 ? c.concat(['é'.repeat(Math.ceil(MAX_BYTES / 2) - 1000)]) : c)) });
  assert.ok(tildes.length < MAX_BYTES && Buffer.byteLength(tildes) > MAX_BYTES);
  assert.equal(await cargarPasaje(JHN, 'web', { fetch: responder(tildes) }), null, 'se mide en bytes, no en letras');
  assert.equal(enMemoria().length, 0, 'lo rechazado no se guarda');
});
await enOrden('forma mala, libro equivocado, JSON roto, error de red: null', async () => {
  vaciarMemoria();
  const caps21 = Array.from({ length: 21 }, () => ['a']);
  for (const cuerpo of [
    '{', 'null', '[]', '"texto"',
    JSON.stringify({ c: 'JHN', caps: [] }),
    JSON.stringify({ c: 'MAT', caps: caps21 }),
    JSON.stringify({ c: 'JHN', caps: caps21.map((c, i) => (i === 3 ? [1] : c)) }),
    JSON.stringify({ c: 'JHN', caps: caps21.map((c, i) => (i === 3 ? [] : c)) }),
    JSON.stringify({ c: 'JHN', caps: caps21.map((c, i) => (i === 3 ? 'abc' : c)) }),
    JSON.stringify({ c: 'JHN', caps: caps21.slice(1) })
  ]) {
    assert.equal(await cargarPasaje(JHN, 'web', { fetch: responder(cuerpo) }), null, cuerpo.slice(0, 40));
  }
  assert.equal(await cargarPasaje(JHN, 'web', { fetch: async () => ({ ok: false, status: 404, headers: new Map(), text: async () => '' }) }), null);
  assert.equal(await cargarPasaje(JHN, 'web', { fetch: async () => { throw new Error('sin red'); } }), null);
  assert.ok(libroValido({ c: 'JHN', caps: caps21 }, 'JHN'));
  assert.equal(libroValido({ c: 'JHN', caps: caps21 }, 'MAT'), false);
});
await enOrden('memoria LRU de 6 libros: el menos usado sale, el usado sube', async () => {
  vaciarMemoria();
  const { traer, llamadas } = desdeDisco();
  const libros = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS'];
  for (const u of libros) assert.ok(await cargarPasaje({ libro: u, cap: 1, v1: 1, v2: 1 }, 'web', { fetch: traer }));
  assert.equal(llamadas.length, 6);
  await cargarPasaje({ libro: 'GEN', cap: 1, v1: 2, v2: 2 }, 'web', { fetch: traer });   // GEN sube
  assert.equal(llamadas.length, 6, 'GEN salio de la memoria');
  await cargarPasaje({ libro: 'JDG', cap: 1, v1: 1, v2: 1 }, 'web', { fetch: traer });   // sale EXO
  assert.equal(enMemoria().length, 6);
  assert.ok(!enMemoria().includes('web/EXO'));
  assert.ok(enMemoria().includes('web/GEN'));
  await cargarPasaje({ libro: 'EXO', cap: 1, v1: 1, v2: 1 }, 'web', { fetch: traer });
  assert.equal(llamadas.length, 8);
  await cargarPasaje({ libro: 'GEN', cap: 1, v1: 1, v2: 1 }, 'rv1909', { fetch: traer });
  assert.equal(llamadas.length, 9, 'cada version tiene su propio libro');
});
await enOrden('dos pedidos a la vez del mismo libro: una sola descarga', async () => {
  vaciarMemoria();
  const { traer, llamadas } = desdeDisco();
  const [a, b] = await Promise.all([cargarPasaje(JHN, 'web', { fetch: traer }), cargarPasaje(deCanonica('JHN.1.1'), 'web', { fetch: traer })]);
  assert.ok(a && b);
  assert.equal(llamadas.length, 1);
});

/* ------------------------------------------------------------------ */
console.log('\nlos datos (public/biblia)');
const indices = {};
for (const v of VERSIONES) indices[v] = JSON.parse(fs.readFileSync(path.join(dirBiblia, v, 'indice.json'), 'utf8'));
const leerLibro = (v, l) => JSON.parse(fs.readFileSync(path.join(dirBiblia, v, `${String(l.n).padStart(2, '0')}-${l.usfm}.json`), 'utf8'));
const OMITIDOS_WEB = ['LUK.17.36', 'ACT.8.37', 'ACT.15.34', 'ACT.24.7'];
let crudo = 0, comprimido = 0, mayor = { archivo: '', bytes: 0 };
for (const v of VERSIONES) {
  ok(`${v}: indice con nombre, licencia, fuente de eBible.org y sha256`, () => {
    const i = indices[v];
    assert.match(i.sha256, /^[0-9a-f]{64}$/);
    assert.match(i.fuente.url, /^https:\/\/ebible\.org\/Scriptures\/(spaRV1909|eng-web)_vpl\.zip$/);
    assert.match(i.licencia, /Public Domain|Dominio/);
    assert.equal(i.nombre, v === 'web' ? 'World English Bible' : 'Santa Biblia — Reina-Valera 1909');
    assert.equal(i.libros.length, 66);
  });
  ok(`${v}: 66 libros en orden, capitulos iguales a libros.js, versiculos dentro de versos.js`, () => {
    const archivos = fs.readdirSync(path.join(dirBiblia, v)).filter((f) => f !== 'indice.json').sort();
    assert.equal(archivos.length, 66);
    LIBROS.forEach((l, k) => {
      const e = indices[v].libros[k];
      assert.deepEqual([e.n, e.usfm, e.caps.length], [l.n, l.usfm, l.caps], l.usfm);
      assert.equal(archivos[k], `${String(l.n).padStart(2, '0')}-${l.usfm}.json`);
      e.caps.forEach((x, c) => assert.ok(x >= 1 && x <= VERSOS[l.usfm][c], `${l.usfm} ${c + 1}`));
    });
  });
  ok(`${v}: ~31.100 versiculos, sin vacios (salvo los que la version omite), sin marcas, archivos <= 600 KB`, () => {
    let total = 0;
    const vacios = [];
    for (const l of LIBROS) {
      const ruta = path.join(dirBiblia, v, `${String(l.n).padStart(2, '0')}-${l.usfm}.json`);
      const bytes = fs.statSync(ruta).size;
      assert.ok(bytes <= MAX_BYTES, `${l.usfm} pesa ${bytes}`);
      const cuerpo = fs.readFileSync(ruta);
      crudo += bytes; comprimido += gzipSync(cuerpo).length;
      if (bytes > mayor.bytes) mayor = { archivo: `${v}/${path.basename(ruta)}`, bytes };
      const d = JSON.parse(cuerpo);
      assert.ok(libroValido(d, l.usfm), l.usfm);
      assert.deepEqual(d.caps.map((c) => c.length), indices[v].libros[l.n - 1].caps, l.usfm);
      d.caps.forEach((c, i) => c.forEach((t, j) => {
        total++;
        if (t === '') vacios.push(`${l.usfm}.${i + 1}.${j + 1}`);
        assert.ok(!/[<>\\{}|*~^`]|&[a-z#0-9]+;|\\[a-z]/i.test(t), `${l.usfm} ${i + 1}:${j + 1} trae marcas`);
        assert.equal(t, t.trim(), `${l.usfm} ${i + 1}:${j + 1} con espacios sobrantes`);
      }));
      d.caps.forEach((c, i) => assert.notEqual(c.at(-1), '', `${l.usfm} ${i + 1} termina vacio`));
    }
    assert.ok(Math.abs(total - 31100) <= 150, `${total} versiculos`);
    assert.deepEqual(vacios, v === 'web' ? OMITIDOS_WEB : []);
    assert.deepEqual(indices[v].omitidos, vacios);
  });
}
ok('versos.js es el mayor de las dos versiones, capitulo a capitulo', () => {
  for (const l of LIBROS) {
    const a = indices.rv1909.libros[l.n - 1].caps, b = indices.web.libros[l.n - 1].caps;
    assert.deepEqual(VERSOS[l.usfm], a.map((x, i) => Math.max(x, b[i])), l.usfm);
  }
});
ok('la numeracion propia de la RV1909 se respeta (el gran pez: RV1909 Jonas 2:1 = WEB Jonas 1:17; Malaquias 4)', () => {
  assert.equal(indices.rv1909.libros[31].caps[0], 16);
  assert.equal(indices.web.libros[31].caps[0], 17);
  const jonas = (v) => leerLibro(v, libroDe('JON')).caps;
  assert.match(jonas('rv1909')[1][0], /gran pez/);
  assert.match(jonas('web')[0][16], /huge fish/);
  assert.equal(indices.rv1909.libros[38].caps.length, 4);
  assert.equal(indices.web.libros[38].caps.length, 4);
});

console.log('\nversiculos de verdad (por el cargador, desde el disco)');
const ESPERA = {
  'JHN.3.16': ['unigénito', 'only born Son'],
  'JER.1.5': ['vientre', 'womb'],
  'PSA.139.1': ['examinado', 'searched me'],
  'LUK.15.11': ['dos hijos', 'two sons'],
  'MAT.3.17': ['Hijo amado', 'beloved Son'],
  'JHN.13.3': ['salido de Dios', 'came from God']
};
for (const [cita, [es, en]] of Object.entries(ESPERA)) {
  await enOrden(`${cita}: RV1909 «${es}», WEB «${en}»`, async () => {
    const { traer } = desdeDisco();
    const ref = deCanonica(cita);
    const a = await cargarPasaje(ref, 'rv1909', { fetch: traer });
    const b = await cargarPasaje(ref, 'web', { fetch: traer });
    assert.equal(a.length, 1); assert.equal(b.length, 1);
    assert.ok(a[0].t.includes(es), a[0].t);
    assert.ok(b[0].t.includes(en), b[0].t);
  });
}
await enOrden('de la cita escrita al texto: «Lee Juan 3:16 hoy»', async () => {
  const { traer } = desdeDisco();
  const [r] = leerReferencias('Lee Juan 3:16 hoy', { auto: true });
  const [v] = await cargarPasaje(r, 'rv1909', { fetch: traer });
  assert.match(v.t, /^Porque de tal manera amó Dios al mundo/);
});

console.log('\nel texto para leer (mostrar.js)');
const RV = (cita) => { const r = deCanonica(cita); return leerLibro('rv1909', libroDe(r.libro)).caps[r.cap - 1][r.v1 - 1]; };
const WEB = (cita) => { const r = deCanonica(cita); return leerLibro('web', libroDe(r.libro)).caps[r.cap - 1][r.v1 - 1]; };
const leer = (cita, version = 'rv1909') => { const r = deCanonica(cita); return textoParaLeer(version === 'rv1909' ? RV(cita) : WEB(cita), { version, libro: r.libro, cap: r.cap, v: r.v1 }); };
ok('RV1909: versalitas al empezar → minusculas, sin tocar nombres propios', () => {
  assert.match(leer('GEN.1.1'), /^En el principio crió Dios/);
  assert.match(leer('PSA.23.1'), /Salmo de David\. Jehová es mi pastor/);
  assert.match(leer('GEN.4.1'), /^Y conoció Adam á su mujer/);
  assert.match(leer('2CH.24.1'), /^De siete años era Joas/);
  assert.match(leer('PSA.3.1'), /¡Oh Jehová, cuánto/);
  assert.match(leer('PSA.39.1'), /Salmo de David\. Yo dije: Atenderé/);
  assert.match(leer('REV.5.1'), /^Y vi en la mano/);
  assert.equal(textoParaLeer('Y DIJO JEHOVÁ á Moisés', { version: 'rv1909' }), 'Y dijo Jehová á Moisés');
});
ok('RV1909: las inscripciones se quedan en mayusculas', () => {
  assert.match(leer('MAT.27.37'), /ESTE ES JESUS EL REY DE LOS JUDIOS/);
  assert.match(leer('EXO.3.14'), /YO SOY EL QUE SOY/);
  assert.match(leer('REV.19.16'), /REY DE REYES Y SEÑOR DE SEÑORES/);
  assert.match(leer('JER.23.6'), /JEHOVÁ, JUSTICIA NUESTRA/);
  assert.match(leer('DAN.5.27'), /^TEKEL:/);
  assert.match(leer('PSA.150.1'), /Alabad á Dios/);
});
ok('RV1909: corchetes de los traductores fuera, la palabra se queda', () => {
  assert.ok(RV('3JN.1.14').includes('[sea]'));
  assert.ok(leer('3JN.1.14').includes('Paz sea contigo'));
  assert.equal(textoParaLeer('a [b] [c d] e]', { version: 'rv1909' }), 'a b c d e');
});
ok('RV1909: rotulos del Salmo 119 fuera (ALEPH., BETH, HE., PE., TAU.)', () => {
  assert.match(leer('PSA.119.1'), /^Bienaventurados los perfectos/);
  assert.match(leer('PSA.119.9'), /^¿Con qué limpiará/);
  assert.match(leer('PSA.119.33'), /^Enséñame, oh Jehová/);
  assert.match(leer('PSA.119.129'), /^Maravillosos son/);
  assert.match(leer('PSA.119.169'), /^Acérquese/);
  assert.equal(textoParaLeer('HE. Enséñame', { version: 'rv1909', libro: 'PSA', cap: 119, v: 2 }), 'He. Enséñame');   // solo en 1, 9, 17...
});
ok('RV1909 entera: sin corchetes y ningun versiculo empieza en versalitas', () => {
  for (const l of LIBROS) {
    leerLibro('rv1909', l).caps.forEach((c, i) => c.forEach((t, k) => {
      const o = textoParaLeer(t, { version: 'rv1909', libro: l.usfm, cap: i + 1, v: k + 1 });
      assert.ok(!/[[\]]/.test(o), `${l.usfm} ${i + 1}:${k + 1}`);
      assert.ok(o.length > 0, `${l.usfm} ${i + 1}:${k + 1} vacio`);
      if (!(l.usfm === 'DAN' && i === 4)) assert.ok(!/^[¡¿“«(]*(?:\p{Lu}\s+)?\p{Lu}{2,}\P{Lu}/u.test(o) || /^\p{Lu}{2,}[,:]?\s*$/u.test(o), `${l.usfm} ${i + 1}:${k + 1}: ${o.slice(0, 40)}`);
    }));
  }
});
ok('WEB intacta; vacio → «»', () => {
  assert.equal(leer('PSA.119.1', 'web'), WEB('PSA.119.1'));
  assert.equal(leer('MAT.27.37', 'web'), WEB('MAT.27.37'));
  assert.equal(textoParaLeer('[x] EN el', { version: 'web' }), '[x] EN el');
  assert.equal(textoParaLeer('', { version: 'rv1909' }), '');
  assert.equal(textoParaLeer(null, { version: 'web' }), '');
  assert.equal(textoParaLeer(undefined), '');
});

console.log('\nla herramienta (tools/biblia.mjs) y versos.js');
ok('las huellas de las fuentes estan fijadas y coinciden con los indices', () => {
  const herramienta = fs.readFileSync(path.join(raiz, 'tools', 'biblia.mjs'), 'utf8');
  for (const v of VERSIONES) assert.ok(herramienta.includes(`sha256: '${indices[v].sha256}'`), v);
  assert.match(herramienta, /hostname !== 'ebible\.org'/);
  assert.match(herramienta, /VERSO_MAX = 4000/);
  assert.match(herramienta, /VERSOS_CAP_MAX = 200/);
});
ok('versos.js: versosEn da los versiculos de cada version, capitulo a capitulo', () => {
  for (const v of VERSIONES) {
    for (const l of LIBROS) indices[v].libros[l.n - 1].caps.forEach((x, i) => assert.equal(versosEn(l.usfm, i + 1, v), x, `${v} ${l.usfm} ${i + 1}`));
  }
});
ok('COMUNES ya no lleva «san» (no es tronco de ningun libro)', () => {
  assert.equal(COMUNES.es.has('san'), false);
  for (const i of ['es', 'en']) for (const t of COMUNES[i]) assert.ok(TRONCOS.includes(t), `${i}: ${t}`);
});

console.log('\nel sitio');
ok('la politica de contenido deja pedir /biblia/ al mismo origen (connect-src \'self\')', () => {
  const csp = fs.readFileSync(path.join(raiz, 'tools', 'politica-contenido.mjs'), 'utf8');
  assert.match(csp, /const conexiones = \["'self'"\]/);
  assert.match(csp, /connect-src \$\{conexiones\.join/);
});
ok('la compilacion copia public/biblia a dist/ (si hay dist/)', () => {
  const d = path.join(raiz, 'dist', 'biblia');
  if (!fs.existsSync(path.join(raiz, 'dist'))) { console.log('      (sin dist/: se salta; corre despues de `astro build`)'); return; }
  for (const v of VERSIONES) {
    assert.ok(fs.existsSync(path.join(d, v, 'indice.json')), v);
    assert.equal(fs.readdirSync(path.join(d, v)).length, 67, v);
  }
});

await Promise.all(pendientes);
console.log(`\n  tamano: ${(crudo / 1048576).toFixed(2)} MB crudo, ${(comprimido / 1048576).toFixed(2)} MB con gzip; el mayor ${mayor.archivo} ${(mayor.bytes / 1024).toFixed(0)} KB`);
console.log(`\n${n} bien${mal ? `, ${mal} MAL` : ''}`);
process.exit(mal ? 1 : 0);
