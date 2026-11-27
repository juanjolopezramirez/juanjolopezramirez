/* PRUEBAS DE LA RONDA 3 DE LAS NOTAS. Sin dependencias:

     node tools/test-estilo-notas.mjs

   Prueban: los colores por tema (cl, cd) y los efectos (ee, el) en el enlace de una nota (ida y vuelta, lo malo se tira,
   los enlaces de antes no cambian), el titulo con la referencia ENTERA en una cita partida («Mateo 3:17 y 4:3»), el estilo
   del libro (ConfigPagina.notas) escrito en cada nota al sacar el PDF, el contraste (colorNota.js), los nombres nuevos
   («Definiciones», «Referencias bíblicas», «Marcar 2 referencias») y las reglas de los archivos nuevos. Codigo 1 si algo falla. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);
const leer = (r) => readFileSync(path.join(raiz, r), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const N = await cargar('src/scripts/lector/notaEnPdf.js');
const C = await cargar('src/scripts/lector/colorNota.js');
const T = await cargar('src/scripts/lector/notaTexto.js');
const I = await cargar('src/scripts/lector/indiceLector.js');
const NL = await cargar('src/scripts/contenido/taller/notasLibro.js');
const { ConfigPagina } = await cargar('src/scripts/contenido/taller/ConfigPagina.js');
const { aHoja } = await cargar('src/scripts/contenido/taller/hoja.js');
const { UI } = await cargar('src/i18n/ui.js');
const { PORTAL_TEXTOS } = await cargar('src/data/portal/textos.js');

let n = 0, mal = 0;
const ok = async (nombre, fn) => {
  try { await fn(); n++; console.log('  ok  ' + nombre); } catch (e) { mal++; console.log(' MAL  ' + nombre + '\n      ' + String(e && e.message).split('\n')[0]); }
};
const plano = (href) => JSON.parse(Buffer.from(href.split('#n=')[1], 'base64url').toString('utf8'));
const parrafo = (...hijos) => ({ type: 'paragraph', attrs: { capital: false, alinear: '' }, content: hijos });
const doc = (...bloques) => ({ doc: { type: 'doc', content: bloques } });
const texto = (t, marks) => ({ type: 'text', text: t, ...(marks ? { marks } : {}) });
const todos = (nodos, f) => {
  const salida = [], pila = [...nodos];
  while (pila.length) { const x = pila.shift(); if (!x) continue; if (f(x)) salida.push(x); pila.push(...(x.hijos || [])); }
  return salida;
};

console.log('los colores y los efectos en el enlace');
await ok('ida y vuelta: cl, cd, ee y el en una cita y en una definicion, en su orden fijo', () => {
  const cita = { v: 1, k: 'c', r: 'JHN.3.16', rv: 'NVI', fv: 'lora', cl: ['#2F5D50', ''], cd: ['#9fd3c0', '#e4e0d4'], ee: 'letra', el: 'brillo', l: 'es' };
  const h = N.enlaceDeNota(cita);
  const vuelta = N.notaDeEnlace(h);
  assert.deepEqual([...vuelta.cl], ['#2f5d50', ''], 'en minusculas, el vacio se queda');
  assert.deepEqual([...vuelta.cd], ['#9fd3c0', '#e4e0d4']);
  assert.equal(vuelta.ee, 'letra');
  assert.equal(vuelta.el, 'brillo');
  assert.deepEqual(Object.keys(plano(h)), ['v', 'k', 'r', 'rv', 'fv', 'cl', 'cd', 'ee', 'el', 'l']);
  const def = { v: 1, k: 'd', t: 'Ahavá', d: 'Amor', ft: 'estonia', cl: ['#7a3b1f', '#3b2f26'], ee: 'tinta', el: 'subraya', l: 'es' };
  const hd = N.enlaceDeNota(def);
  assert.deepEqual(Object.keys(plano(hd)), ['v', 'k', 't', 'd', 'ft', 'cl', 'ee', 'el', 'l']);
  assert.equal(N.enlaceDeNota(N.notaDeEnlace(hd)), hd, 'la misma nota da el mismo enlace');
  for (const ee of N.ENTRADAS_NOTA) assert.equal(N.limpiarNota({ v: 1, k: 'd', t: 'x', ee }).ee, ee);
  for (const el of N.BUCLES_NOTA) assert.equal(N.limpiarNota({ v: 1, k: 'd', t: 'x', el }).el, el);
});
await ok('lo malo se tira: colores que no son #rrggbb, pares mal formados, efectos que no estan en la lista', () => {
  const base = { v: 1, k: 'c', r: 'JHN.3.16' };
  for (const cl of ['#123456', ['#123456'], ['#123456', '#123456', '#123456'], ['red', 'blue'], ['', ''], ['#12345', '#1234567'], [null, 3], { 0: '#123456', 1: '#123456', length: 2 },
    ['url(x)', '#123456;color:red'], ['rgb(1,2,3)', 'var(--x)']]) {
    const x = N.limpiarNota({ ...base, cl });
    assert.equal(x.cl, undefined, JSON.stringify(cl));
  }
  assert.deepEqual([...N.limpiarNota({ ...base, cd: ['x', '#ABCDEF'] }).cd], ['', '#abcdef'], 'uno malo y uno bueno: queda el bueno');
  for (const v of ['ninguna', 'fade', 'LETRA', '', ' letra', '__proto__', 'constructor', 7, null, ['letra']]) {
    assert.equal(N.limpiarNota({ ...base, ee: v, el: v }).ee, undefined, String(v));
    assert.equal(N.limpiarNota({ ...base, ee: v, el: v }).el, undefined, String(v));
  }
  assert.equal(N.limpiarNota({ ...base, ee: 'brillo', el: 'letra' }).ee, undefined, 'una entrada no es un bucle ni al reves');
  assert.equal(N.limpiarNota({ ...base, ee: 'brillo', el: 'letra' }).el, undefined);
  /* una nota hostil con __proto__ no cuela nada */
  const hostil = JSON.parse('{"v":1,"k":"c","r":"JHN.3.16","__proto__":{"cl":["#123456","#123456"]},"cl":{"0":"#123456"}}');
  assert.equal(N.limpiarNota(hostil).cl, undefined);
});
await ok('los enlaces de antes (sin cl/cd/ee/el) no cambian ni un byte', () => {
  const viejas = [
    { v: 1, k: 'c', r: 'JER.1.4-5', x: 'Jeremías 1:4-5', rv: 'NVI', fv: 'bricolage-grotesque', l: 'es' },
    { v: 1, k: 'c', r: 'PSA.139', x: 'Salmo 139', l: 'es' },
    { v: 1, k: 'd', t: 'Ahavá', d: 'Amor', r: { a: 'Brown, F.', y: '1906', ti: 'Lexicon', u: 'https://example.com/x' }, ft: 'estonia', fd: 'lora', l: 'es' }
  ];
  for (const v of viejas) {
    const esperado = 'https://juanjolopezramirez.com/nota/#n=' + Buffer.from(JSON.stringify(v)).toString('base64url');
    assert.equal(N.enlaceDeNota(v), esperado);
    const leida = N.notaDeEnlace(esperado);
    for (const k of ['cl', 'cd', 'ee', 'el']) assert.equal(leida[k], undefined);
  }
});

console.log('\nla referencia entera');
await ok('una cita partida se llama con su referencia entera, en el lector, en el indice y en /nota/', () => {
  const cuatroTres = { v: 1, k: 'c', r: 'MAT.4.3', x: '4:3', l: 'es' };
  assert.equal(N.tituloDeNota(cuatroTres, 'es'), 'Mateo 4:3');
  assert.equal(N.tituloDeNota(cuatroTres, 'en'), 'Matthew 4:3');
  assert.equal(T.rotuloDeCita(cuatroTres, 'es'), 'Mateo 4:3');
  assert.equal(N.tituloDeNota({ v: 1, k: 'c', r: 'PSA.24.1-3', x: '24:1-3' }, 'es'), 'Salmo 24:1-3');
  assert.equal(N.tituloDeNota({ v: 1, k: 'c', r: 'PSA.24.1-3', x: 'Sal 24:1-3' }, 'es'), 'Salmo 24:1-3', 'tampoco la abreviatura');
  /* el indice: la fila de la segunda tambien dice «Mateo 4:3» */
  const hojas = [{ text: 'x', links: [{ href: N.enlaceDeNota({ v: 1, k: 'c', r: 'MAT.3.17', x: 'Mateo 3:17' }) }, { href: N.enlaceDeNota(cuatroTres) }] }];
  assert.deepEqual(I.citasDe(hojas).map((c) => I.tituloDeNota(c.nota, 'es')), ['Mateo 3:17', 'Mateo 4:3']);
  /* el idioma de /nota/ sigue saliendo de `x` cuando lo trae completo */
  assert.equal(T.idiomaDeNota({ v: 1, k: 'c', r: 'MAT.4.3', x: 'Matthew 4:3' }, 'es'), 'en');
});
await ok('el Taller guarda `x` entero al marcar varias: «Mateo 3:17 y 4:3» → «Mateo 3:17» y «Mateo 4:3»', () => {
  for (const [frase, idioma, esperadas] of [
    ['Mateo 3:17 y 4:3', 'es', ['Mateo 3:17', 'Mateo 4:3']],
    ['Sal 23; 24:1-3', 'es', ['Sal 23', 'Salmo 24:1-3']],
    ['Matthew 3:17 and 4:3', 'en', ['Matthew 3:17', 'Matthew 4:3']]
  ]) {
    const mapa = Array.from(frase, (_, i) => 10 + i);
    const halladas = NL.citasDeSeleccion(frase, mapa, idioma);
    assert.deepEqual(halladas.map((c) => c.x), esperadas, frase);
    /* el tramo marcado sigue siendo solo lo escrito («4:3»), no la frase */
    const ultima = halladas[halladas.length - 1];
    assert.equal(frase.slice(ultima.desde - 10, ultima.hasta - 10), ultima.texto);
  }
  const ed = leer('src/scripts/portal/panel/dev/taller/nodos/notas.js');
  assert.match(ed, /const titulo = n \? tituloDeNota\(n, idiomaDelEditor\(this\.editor\)\) : '';/, 'la pista de la mesa dice la referencia entera, en el idioma del libro');
  assert.match(ed, /a\.lang === 'en' \? 'en' : 'es'/);
});

console.log('\nel estilo del libro');
await ok('ConfigPagina guarda colores (#rrggbb) y efectos (de la lista); lo demas se tira', () => {
  const c = new ConfigPagina({ notas: { letraVersos: 'lora', colores: { cita: { claro: ['#ABCDEF', 'rojo'], oscuro: ['#123456'] }, definicion: { oscuro: ['#111111', '#222222', '#333333'] }, otra: { claro: ['#111111', '#111111'] } }, entrada: 'sube', bucle: 'brillo' } });
  assert.deepEqual(c.notas.colores, { cita: { claro: ['#abcdef', ''], oscuro: ['#123456', ''] }, definicion: { claro: ['', ''], oscuro: ['#111111', '#222222'] } });
  assert.equal(c.notas.entrada, 'sube');
  assert.equal(c.notas.bucle, 'brillo');
  assert.equal(new ConfigPagina({ notas: { entrada: 'brillo', bucle: 'letra' } }).notas.entrada, '');
  assert.equal(new ConfigPagina({ notas: { entrada: 'brillo', bucle: 'letra' } }).notas.bucle, '');
  /* aDatos devuelve copias: tocar lo devuelto no cambia el libro */
  const d = c.aDatos();
  d.notas.colores.cita.claro[0] = '#000000';
  assert.equal(c.notas.colores.cita.claro[0], '#abcdef');
  assert.deepEqual(new ConfigPagina(d).notas.colores.cita.claro, ['#000000', '']);
});
await ok('estiloDeNotas: solo lo elegido, por clase de nota', () => {
  assert.deepEqual(NL.estiloDeNotas(new ConfigPagina({}).notas), { c: {}, d: {} });
  const e = NL.estiloDeNotas(new ConfigPagina({ notas: { colores: { cita: { oscuro: ['#9fd3c0', ''] }, definicion: { claro: ['', '#3b2f26'] } }, entrada: 'letra', bucle: 'respira' } }).notas);
  assert.deepEqual(e, { c: { cd: ['#9fd3c0', ''] }, d: { cl: ['', '#3b2f26'] }, ee: 'letra', el: 'respira' });
  assert.deepEqual(NL.estiloDeNotas(null), { c: {}, d: {} });
});
await ok('al sacar el PDF cada nota lleva el estilo de su clase; un libro sin estilo da los enlaces de siempre', () => {
  const cap = { contenido: doc(parrafo(texto('Juan 3:16', [{ type: 'citaBiblica', attrs: { r: 'JHN.3.16', x: 'Juan 3:16' } }]), texto(' y '), texto('Ahavá', [{ type: 'definicion', attrs: { t: 'Ahavá', d: 'Amor' } }]))) };
  const notasDe = (pagina) => todos(aHoja({ titulo: 'L', idioma: 'es', pagina, fuentes: [] }, [cap]).nodos, (x) => x.tag === 'a' && /^nota/.test(x.clase)).map((a) => a.attrs.href);
  const sin = notasDe({});
  const con = notasDe({ notas: { colores: { cita: { claro: ['#2f5d50', ''] }, definicion: { oscuro: ['#e8c58a', '#d9d4c7'] } }, entrada: 'tinta', bucle: 'subraya' } });
  const [c, d] = con.map((h) => N.notaDeEnlace(h));
  assert.deepEqual([...c.cl], ['#2f5d50', '']);
  assert.equal(c.cd, undefined);
  assert.deepEqual([...d.cd], ['#e8c58a', '#d9d4c7']);
  assert.equal(d.cl, undefined);
  for (const x of [c, d]) { assert.equal(x.ee, 'tinta'); assert.equal(x.el, 'subraya'); }
  /* sin estilo: los mismos de antes de esta ronda (solo la letra de los versiculos en la cita) */
  const [c0, d0] = sin.map(plano);
  assert.deepEqual(Object.keys(c0), ['v', 'k', 'r', 'x', 'fv', 'l']);
  assert.deepEqual(Object.keys(d0), ['v', 'k', 't', 'd', 'l']);
  /* la cuenta de «Compartir» con el mismo estilo cuadra con el PDF */
  const estilo = NL.estiloDeNotas(new ConfigPagina({ notas: { colores: { cita: { claro: ['#2f5d50', ''] }, definicion: { oscuro: ['#e8c58a', '#d9d4c7'] } }, entrada: 'tinta', bucle: 'subraya' } }).notas);
  assert.deepEqual([...NL.hrefsDeNotas([cap.contenido], 'es', { fv: NL.LETRA_VERSOS, estilo })].sort(), [...con].sort());
});
await ok('una nota justo en el tope de 8000 sale sin estilo antes que perder su enlace', () => {
  const largo = (k) => '𐍈'.repeat(k);
  const marca = (d) => ({ type: 'definicion', attrs: { t: largo(80), d, r: { a: largo(200), y: largo(200), ti: largo(200), f: largo(200) } } });
  const estilo = { d: { cl: ['#111111', '#222222'], cd: ['#333333', '#444444'] }, ee: 'aparece', el: 'respira' };
  /* la descripcion mas larga que cabe sin estilo */
  let d = '';
  for (const ch of ['𐍈', 'a']) while (NL.enlaceDeMarca(marca(d + ch), 'es') && Array.from(d + ch).length <= N.TOPES.d) d += ch;
  assert.ok(NL.enlaceDeMarca(marca(d), 'es'), 'cabe sin estilo');
  const h = NL.enlaceDeMarca(marca(d), 'es', { estilo });
  assert.ok(h, 'sigue teniendo enlace');
  assert.equal(N.enlaceDeNota(NL.notaDeMarca(marca(d), 'es', { estilo })), null, 'con estilo no cabria');
  assert.equal(N.notaDeEnlace(h).ee, undefined, 'sale sin estilo');
  assert.equal(N.notaDeEnlace(h).t, largo(80));
});

console.log('\nla letra del titulo (ronda 4)');
await ok('una cita lleva `ft` (ida y vuelta, en su lugar); una letra que no es de la lista se tira; sin ella, el enlace de siempre', () => {
  for (const ft of Object.keys(N.FUENTES_NOTA)) {
    const h = N.enlaceDeNota({ v: 1, k: 'c', r: 'JHN.3.16', ft, fv: 'lora', l: 'es' });
    assert.equal(N.notaDeEnlace(h).ft, ft, ft);
    assert.deepEqual(Object.keys(plano(h)), ['v', 'k', 'r', 'ft', 'fv', 'l']);
  }
  for (const ft of ['Comic Sans', 'libro', '', '__proto__', 'lora;color:red', 3, null, ['lora']]) assert.equal(N.limpiarNota({ v: 1, k: 'c', r: 'JHN.3.16', ft }).ft, undefined, String(ft));
  const vieja = { v: 1, k: 'c', r: 'JER.1.4-5', x: 'Jeremías 1:4-5', rv: 'NVI', fv: 'bricolage-grotesque', l: 'es' };
  assert.equal(N.enlaceDeNota(vieja), 'https://juanjolopezramirez.com/nota/#n=' + Buffer.from(JSON.stringify(vieja)).toString('base64url'));
});
await ok('ConfigPagina guarda tituloRef y tituloDef (solo de la lista)', () => {
  const c = new ConfigPagina({ notas: { tituloRef: 'estonia', tituloDef: 'lora' } });
  assert.equal(c.notas.tituloRef, 'estonia');
  assert.equal(c.notas.tituloDef, 'lora');
  for (const v of ['Lora', 'libro', 'x', '__proto__', 3, null]) {
    const m = new ConfigPagina({ notas: { tituloRef: v, tituloDef: v } }).notas;
    assert.equal(m.tituloRef, '', String(v));
    assert.equal(m.tituloDef, '', String(v));
  }
  assert.equal(new ConfigPagina(c.aDatos()).notas.tituloRef, 'estonia');
});
await ok('al sacar el PDF: la cita lleva la letra del libro; la definicion, la suya si la eligio y si no la del libro', () => {
  const cap = { contenido: doc(parrafo(
    texto('Juan 3:16', [{ type: 'citaBiblica', attrs: { r: 'JHN.3.16', x: 'Juan 3:16' } }]), texto(' y '),
    texto('Ahavá', [{ type: 'definicion', attrs: { t: 'Ahavá', d: 'Amor', ft: 'petemoss', fd: 'lora' } }]), texto(' y '),
    texto('Emet', [{ type: 'definicion', attrs: { t: 'Emet', d: 'Verdad' } }]))) };
  const notasDe = (pagina) => todos(aHoja({ titulo: 'L', idioma: 'es', pagina, fuentes: [] }, [cap]).nodos, (x) => x.tag === 'a' && /^nota/.test(x.clase)).map((a) => N.notaDeEnlace(a.attrs.href));
  const [c, propia, sinPropia] = notasDe({ notas: { tituloRef: 'estonia', tituloDef: 'frank-ruhl-libre' } });
  assert.equal(c.ft, 'estonia');
  assert.equal(propia.ft, 'petemoss', 'la de la nota gana');
  assert.equal(propia.fd, 'lora');
  assert.equal(sinPropia.ft, 'frank-ruhl-libre', 'sin la suya, la del libro');
  assert.equal(sinPropia.fd, undefined, 'la descripcion no cambia');
  /* sin elegir en el libro: como antes de esta ronda */
  const [c0, p0, s0] = notasDe({});
  assert.equal(c0.ft, undefined);
  assert.equal(p0.ft, 'petemoss');
  assert.equal(s0.ft, undefined);
  /* estiloDeNotas: la letra va en su clase */
  assert.deepEqual(NL.estiloDeNotas({ tituloRef: 'lora', tituloDef: 'x' }), { c: { ft: 'lora' }, d: {} });
});
await ok('la hoja, /nota/ y el indice ponen la letra del titulo con ponerFuente; la letra a mano sale mas grande', () => {
  const hoja = leer('src/scripts/lector/hojaNota.js'), pag = leer('src/scripts/nota.js'), site = leer('src/scripts/site.js'), css = leer('src/styles/base.css');
  assert.match(hoja, /t\.id = 'lector-nota-t';\s*ponerFuente\(t, nota\.ft, nota\.wt\);/);
  assert.match(pag, /ponerFuente\(titulo, nota\.ft, nota\.wt\);/);
  assert.match(site, /import\('\.\/lector\/hojaNota\.js'\)\.then\(\(m\) => conLetra\.forEach/);
  assert.match(css, /\.lector__fila strong\[data-fuente="estonia"\], \.lector__fila strong\[data-fuente="petemoss"\] \{ font-size: 1\.55rem;/);
  assert.match(css, /\.lector__nota-t\[data-fuente="petemoss"\], \.lector__nota-t\[data-fuente="estonia"\]/);
  const tx = PORTAL_TEXTOS.es.panel.taller;
  assert.equal(tx.enLetraTitulo, 'Letra del título');
  assert.match(tx.ndLetraLibroAyuda, /Estilo de las notas/);
});

console.log('\nel grosor (A1)');
await ok('los grosores de verdad de cada letra (Google Fonts, 2026-11-23) y pesoMasCercano', () => {
  const rango = (id) => N.pesosDeFuente(id);
  assert.deepEqual(rango('young-serif'), [400]);
  assert.deepEqual(rango('petemoss'), [400]);
  assert.deepEqual(rango('estonia'), [400]);
  assert.deepEqual(rango('bricolage-grotesque'), [200, 300, 400, 500, 600, 700, 800]);
  assert.deepEqual(rango('frank-ruhl-libre'), [300, 400, 500, 600, 700, 800, 900]);
  assert.deepEqual(rango('lora'), [400, 500, 600, 700]);
  assert.deepEqual(rango('x'), []);
  assert.equal(N.pesoMasCercano('lora', 900), 700);
  assert.equal(N.pesoMasCercano('lora', 300), 400);
  assert.equal(N.pesoMasCercano('frank-ruhl-libre', 200), 300);
  assert.equal(N.pesoMasCercano('bricolage-grotesque', 900), 800);
  assert.equal(N.pesoMasCercano('bricolage-grotesque', 500), 500);
  for (const id of ['young-serif', 'petemoss', 'estonia', 'x', undefined]) assert.equal(N.pesoMasCercano(id, 700), null, String(id));
  for (const w of [0, '', null, undefined, NaN, -100, '700']) assert.equal(N.pesoMasCercano('lora', w), null, String(w));
  /* las hojas de Google piden el rango entero */
  assert.match(N.hojaDeFuente('bricolage-grotesque'), /family=Bricolage\+Grotesque:opsz,wght@12\.\.96,200\.\.800&/);
  assert.match(N.hojaDeFuente('frank-ruhl-libre'), /family=Frank\+Ruhl\+Libre:wght@300\.\.900&/);
  assert.match(N.hojaDeFuente('lora'), /family=Lora:ital,wght@0,400\.\.700;1,400\.\.700&/);
  for (const f of ['src/layouts/Base.astro', 'src/pages/nota.astro']) assert.match(leer(f), /Bricolage\+Grotesque:opsz,wght@12\.\.96,200\.\.800&/, f);
});
await ok('wt / wd: ida y vuelta en su lugar; lo malo y lo que la letra no tiene se tira', () => {
  const cita = { v: 1, k: 'c', r: 'JHN.3.16', rv: 'NVI', ft: 'frank-ruhl-libre', fv: 'bricolage-grotesque', wt: 800, wd: 300, l: 'es' };
  const h = N.enlaceDeNota(cita);
  assert.deepEqual(Object.keys(plano(h)), ['v', 'k', 'r', 'rv', 'ft', 'fv', 'wt', 'wd', 'l']);
  const vuelta = N.notaDeEnlace(h);
  assert.equal(vuelta.wt, 800);
  assert.equal(vuelta.wd, 300);
  assert.equal(N.enlaceDeNota(vuelta), h, 'la misma nota da el mismo enlace');
  const def = { v: 1, k: 'd', t: 'Ahavá', d: 'Amor', ft: 'lora', fd: 'frank-ruhl-libre', wt: 700, wd: 900, cl: ['#7a3b1f', ''], l: 'es' };
  const hd = N.enlaceDeNota(def);
  assert.deepEqual(Object.keys(plano(hd)), ['v', 'k', 't', 'd', 'ft', 'fd', 'wt', 'wd', 'cl', 'l']);
  assert.equal(N.notaDeEnlace(hd).wd, 900);
  /* malos: fuera de 100-900, no de cien en cien, texto, decimales, objetos */
  for (const w of [0, 50, 1000, 750, 450, '700', 700.5, -700, NaN, Infinity, null, [700], { 0: 700 }, true]) {
    const x = N.limpiarNota({ ...cita, wt: w, wd: w });
    assert.equal(x.wt, undefined, 'wt ' + String(w));
    assert.equal(x.wd, undefined, 'wd ' + String(w));
  }
  /* la letra no lo tiene: Lora 300 o 800, Frank Ruhl 200, Bricolage 900 */
  assert.equal(N.limpiarNota({ ...def, wt: 300 }).wt, undefined);
  assert.equal(N.limpiarNota({ ...def, wt: 800 }).wt, undefined);
  assert.equal(N.limpiarNota({ ...def, wd: 200 }).wd, undefined);
  assert.equal(N.limpiarNota({ ...cita, wd: 900 }).wd, undefined);
  /* una letra de un solo grosor no lleva ninguno, ni siquiera 400 */
  for (const id of ['young-serif', 'petemoss', 'estonia']) {
    assert.equal(N.limpiarNota({ ...cita, ft: id, wt: 400 }).wt, undefined, id);
    assert.equal(N.limpiarNota({ ...cita, fv: id, wd: 400 }).wd, undefined, id);
    assert.equal(N.limpiarNota({ ...def, fd: id, wd: 400 }).wd, undefined, id);
  }
  /* sin letra no hay grosor; y el de una parte no se cruza a la otra */
  assert.equal(N.limpiarNota({ v: 1, k: 'c', r: 'JHN.3.16', wt: 700, wd: 700 }).wt, undefined);
  assert.equal(N.limpiarNota({ v: 1, k: 'c', r: 'JHN.3.16', wt: 700, wd: 700 }).wd, undefined);
  assert.equal(N.limpiarNota({ v: 1, k: 'd', t: 'x', ft: 'lora', wd: 700 }).wd, undefined, 'wd va con fd, no con ft');
  /* una nota hostil con __proto__ no cuela nada */
  assert.equal(N.limpiarNota(JSON.parse('{"v":1,"k":"d","t":"x","ft":"lora","__proto__":{"wt":700}}')).wt, undefined);
});
await ok('los enlaces de antes (sin wt / wd) no cambian ni un byte', () => {
  const viejas = [
    { v: 1, k: 'c', r: 'JER.1.4-5', x: 'Jeremías 1:4-5', rv: 'NVI', ft: 'frank-ruhl-libre', fv: 'bricolage-grotesque', cl: ['#2f5d50', ''], ee: 'tinta', l: 'es' },
    { v: 1, k: 'd', t: 'Ahavá', d: 'Amor', ft: 'estonia', fd: 'lora', cd: ['#e8c58a', '#d9d4c7'], el: 'brillo', l: 'es' }
  ];
  for (const v of viejas) {
    assert.equal(N.enlaceDeNota(v), 'https://juanjolopezramirez.com/nota/#n=' + Buffer.from(JSON.stringify(v)).toString('base64url'));
    const leida = N.notaDeEnlace(N.enlaceDeNota(v));
    assert.equal(leida.wt, undefined);
    assert.equal(leida.wd, undefined);
  }
});
await ok('ConfigPagina.notas.pesos: cuatro cifras; lo demas (o todo en cero) queda en blanco', () => {
  assert.equal(new ConfigPagina({ notas: { pesos: '7030' } }).notas.pesos, '7030');
  assert.equal(new ConfigPagina(new ConfigPagina({ notas: { pesos: '0907' } }).aDatos()).notas.pesos, '0907');
  for (const v of ['0000', '703', '70300', '7a30', ' 7030', 7030, null, ['7030'], '７０３０']) assert.equal(new ConfigPagina({ notas: { pesos: v } }).notas.pesos, '', String(v));
  assert.deepEqual(NL.pesosDeLibro('7030'), [700, 0, 300, 0]);
  assert.deepEqual(NL.pesosDeLibro(''), [0, 0, 0, 0]);
  assert.deepEqual(NL.pesosDeLibro('x'), [0, 0, 0, 0]);
  assert.equal(NL.cadenaDePesos([700, 0, 300, 0]), '7030');
  assert.equal(NL.cadenaDePesos([0, 0, 0, 0]), '');
  assert.equal(NL.cadenaDePesos([750, 1000, -100, '700']), '', 'lo que no es un grosor cuenta como el de siempre');
  assert.deepEqual(NL.ORDEN_PESOS, ['tituloRef', 'versos', 'tituloDef', 'textoDef']);
});
await ok('al sacar el PDF: cada nota lleva el grosor del libro, el mas cercano que tenga SU letra', () => {
  const cap = { contenido: doc(parrafo(
    texto('Juan 3:16', [{ type: 'citaBiblica', attrs: { r: 'JHN.3.16', x: 'Juan 3:16' } }]), texto(' y '),
    texto('Ahavá', [{ type: 'definicion', attrs: { t: 'Ahavá', d: 'Amor', ft: 'lora', fd: 'frank-ruhl-libre' } }]), texto(' y '),
    texto('Emet', [{ type: 'definicion', attrs: { t: 'Emet', d: 'Verdad', fd: 'estonia' } }]))) };
  const notasDe = (pagina) => todos(aHoja({ titulo: 'L', idioma: 'es', pagina, fuentes: [] }, [cap]).nodos, (x) => x.tag === 'a' && /^nota/.test(x.clase)).map((a) => N.notaDeEnlace(a.attrs.href));
  /* referencias: titulo Frank Ruhl 900, versiculos Bricolage (de los libros nuevos) 900 -> 800; definiciones: titulo 200, texto 900 */
  const [c, propia, sinPropia] = notasDe({ notas: { tituloRef: 'frank-ruhl-libre', tituloDef: 'bricolage-grotesque', pesos: '9929' } });
  assert.equal(c.wt, 900);
  assert.equal(c.wd, 800, 'Bricolage llega a 800');
  assert.equal(propia.ft, 'lora');
  assert.equal(propia.wt, 400, 'la letra propia (Lora) manda: 200 -> 400');
  assert.equal(propia.wd, 900, 'Frank Ruhl tiene 900');
  assert.equal(sinPropia.ft, 'bricolage-grotesque');
  assert.equal(sinPropia.wt, 200, 'sin la suya, la del libro, que tiene 200');
  assert.equal(sinPropia.wd, undefined, 'Estonia tiene un solo grosor');
  /* titulo de las referencias sin letra elegida = Young Serif: sin grosor */
  const [c2] = notasDe({ notas: { pesos: '7700' } });
  assert.equal(c2.wt, undefined);
  assert.equal(c2.wd, 700);
  /* sin grosor elegido: el enlace de siempre */
  const sin = notasDe({ notas: { tituloRef: 'frank-ruhl-libre' } });
  for (const x of sin) { assert.equal(x.wt, undefined); assert.equal(x.wd, undefined); }
  /* estiloDeNotas lleva lo PEDIDO (cada nota lo ajusta); sin grosor, nada nuevo */
  assert.deepEqual(NL.estiloDeNotas({ tituloRef: 'lora', pesos: '9000' }), { c: { ft: 'lora', wt: 900 }, d: {} });
  assert.deepEqual(NL.estiloDeNotas({ tituloRef: 'lora' }), { c: { ft: 'lora' }, d: {} });
  /* la marca guardada no lleva grosor: es del libro */
  assert.ok(!('wt' in NL.marcaDeNota({ v: 1, k: 'd', t: 'x', ft: 'lora', wt: 700 }).attrs));
  /* la cuenta de «Compartir» cuadra con el PDF */
  const estilo = NL.estiloDeNotas(new ConfigPagina({ notas: { tituloRef: 'frank-ruhl-libre', tituloDef: 'bricolage-grotesque', pesos: '9929' } }).notas);
  const delPdf = todos(aHoja({ titulo: 'L', idioma: 'es', pagina: { notas: { tituloRef: 'frank-ruhl-libre', tituloDef: 'bricolage-grotesque', pesos: '9929' } }, fuentes: [] }, [cap]).nodos, (x) => x.tag === 'a' && /^nota/.test(x.clase)).map((a) => a.attrs.href);
  assert.deepEqual([...NL.hrefsDeNotas([cap.contenido], 'es', { fv: NL.LETRA_VERSOS, estilo })].sort(), [...new Set(delPdf)].sort());
});
await ok('el lector, /nota/, el indice y el Taller usan el grosor; nunca negrita falsa', () => {
  const hoja = leer('src/scripts/lector/hojaNota.js'), pag = leer('src/scripts/nota.js'), site = leer('src/scripts/site.js'), css = leer('src/styles/base.css'), astro = leer('src/pages/nota.astro');
  assert.match(hoja, /ponerFuente\(d, nota\.fd, nota\.wd\)/);
  assert.match(pag, /ponerFuente\(d, nota\.fd, nota\.wd\)/);
  assert.match(site, /m\.ponerFuente\(s, f, w\)/, 'las filas del indice');
  assert.match(css, /\.lector__nota-t, \.lector__nota-texto, \.lector__nota-pasaje, \.lector__fila strong \{ font-synthesis-weight: none; \}/);
  assert.match(astro, /\.lector__nota-t, \.lector__nota-texto, \.lector__nota-pasaje \{ font-synthesis-weight: none; \}/);
  const est = leer('src/scripts/portal/panel/dev/taller/EstiloNotas.js');
  assert.match(est, /pesos: cadenaDePesos\(\[0, 1, 2, 3\]\.map\(\(i\) => this\.pesoEfectivo\(i\)\)\)/);
  assert.match(est, /verPeso\(i\) \{ this\.campoPw\[i\]\.hidden = TIPO_DE_PESO\[i\] !== this\.tipo \|\| this\.pesosOfrecidos\(i\)\.length < 2; \}/, 'solo con mas de un grosor');
  assert.match(est, /this\.pesos\[i\] = \(letra \? pesoMasCercano\(letra, pedido\) : cercano\(lista, pedido\)\) \|\| 0;/, 'al cambiar de letra, el mas cercano al ULTIMO elegido');
  assert.match(est, /this\.pesos\[i\] = this\.pedidos\[i\] = Number\(s\.value\) \|\| 0;/, 'lo elegido se recuerda mientras la ventana esta abierta');
  assert.match(est, /this\.pedidos = \[\.\.\.this\.pesos\];/, 'al abrir, lo recordado es lo guardado');
  const tx = PORTAL_TEXTOS.es.panel.taller;
  for (const k of ['enGrosorTitulo', 'enGrosorVersos', 'enGrosorDesc', 'enGrosorSiempre', 'enGrosorDescAyuda']) assert.ok(tx[k], k);
  for (const w of [200, 300, 400, 500, 600, 700, 800, 900]) assert.ok(tx.enPesos[w], 'enPesos ' + w);
  /* el CSP sigue dejando las hojas de Google (mismos origenes) */
  const csp = leer('tools/politica-contenido.mjs');
  assert.match(csp, /style-src 'self' 'unsafe-inline' https:\/\/fonts\.googleapis\.com/);
  assert.match(csp, /font-src 'self' https:\/\/fonts\.gstatic\.com/);
});

console.log('\nel contraste');
await ok('colorNota: contraste WCAG, papeles medidos y el par del tema que toca', () => {
  assert.equal(Math.round(C.contraste('#000000', '#ffffff')), 21);
  assert.equal(C.contraste('#123456', '#123456'), 1);
  assert.equal(C.contraste('rojo', '#ffffff'), 0);
  assert.deepEqual(C.leerColor('rgb(29, 46, 31)'), [29, 46, 31]);
  assert.deepEqual(C.leerColor('rgba(29, 46, 31, 1)'), [29, 46, 31]);
  assert.equal(C.leerColor('rgba(29, 46, 31, 0.5)'), null, 'un fondo transparente no se mide');
  assert.ok(C.esOscuro(C.PAPEL_NOTA.oscuro) && !C.esOscuro(C.PAPEL_NOTA.claro));
  /* las tintas de siempre se leen bien en su papel */
  for (const t of ['claro', 'oscuro']) assert.ok(C.contraste(C.TINTA_NOTA[t], C.PAPEL_NOTA[t]) >= 7, t);
  const nota = { cl: ['#7a3b1f', '#eeeeee'], cd: ['#e8c58a', '#2a3a2c'] };
  assert.deepEqual(C.coloresSobre(nota, 'rgb(246, 243, 234)'), { titulo: '#7a3b1f', texto: '' }, 'claro: el gris claro no se lee y se tira');
  assert.deepEqual(C.coloresSobre(nota, 'rgb(29, 46, 31)'), { titulo: '#e8c58a', texto: '' }, 'oscuro: el verde oscuro no se lee y se tira');
  assert.deepEqual(C.coloresSobre({}, '#ffffff'), { titulo: '', texto: '' }, 'una nota de antes: lo de siempre');
  assert.deepEqual(C.coloresSobre(nota, 'transparent'), { titulo: '', texto: '' });
});
await ok('los papeles de colorNota.js son los de base.css y de /nota/', () => {
  const css = leer('src/styles/base.css'), pag = leer('src/pages/nota.astro');
  assert.match(css, /--l-papel: #1D2E1F; --l-papel-tinta: #F1EFE9;/i);
  assert.match(css, /html\[data-tema="claro"\] \.book-panel\[data-lector\] \{\s*--l-papel: #F6F3EA; --l-papel-tinta: #23302A;/i);
  assert.match(css, /\.lector__nota-t \{[^}]*color: var\(--nota-t, inherit\)/);
  assert.match(css, /\.lector__nota-pasaje \{[^}]*color: var\(--nota-x, inherit\)/);
  assert.match(css, /\.lector__nota-texto \{[^}]*color: var\(--nota-x, inherit\)/);
  assert.match(pag, /prefers-color-scheme: dark\)[\s\S]*--papel: #1D2E1F; --tinta: #F1EFE9;/);
  assert.equal(C.PAPEL_NOTA.oscuro, '#1d2e1f');
  assert.equal(C.PAPEL_NOTA.claro, '#f6f3ea');
});

console.log('\nlos nombres');
await ok('el indice y la hoja dicen «Definiciones» y «Referencias bíblicas» (es y en)', () => {
  assert.equal(UI.es['lector.palabras'], 'Definiciones');
  assert.equal(UI.es['lector.citas'], 'Referencias bíblicas');
  assert.equal(UI.es['lector.marcadores'], 'Marcadores');
  assert.equal(UI.es['lector.buscar'], 'Buscar');
  assert.equal(UI.en['lector.palabras'], 'Definitions');
  assert.equal(UI.en['lector.citas'], 'Bible references');
  assert.equal(UI.en['lector.marcadores'], 'Bookmarks');
  assert.equal(UI.en['lector.buscar'], 'Search');
  assert.equal(UI.es['lector.cita'], 'Referencia bíblica: {t}');
  assert.equal(UI.en['lector.cita'], 'Bible reference: {t}');
  for (const l of ['es', 'en']) for (const k of ['sinCitas', 'verCitas', 'indiceAyuda']) assert.ok(!/\bcitas?\b|verses?\b/i.test(UI[l]['lector.' + k]), `${l} ${k}: ${UI[l]['lector.' + k]}`);
});
await ok('el Taller dice «Referencia bíblica» y «Marcar 2 referencias»', () => {
  const tx = PORTAL_TEXTOS.es.panel.taller;
  assert.equal(tx.notaCita, 'Referencia bíblica');
  assert.equal(tx.ncMarcarVarias.replace('{n}', 2), 'Marcar 2 referencias');
  assert.equal(tx.notaCitasPuestas.replace('{n}', 2), '2 referencias marcadas.');
  for (const k of ['notaCitaAyuda', 'ncCita', 'ncNoEntiendo', 'ncVarias', 'ncSinTexto']) assert.ok(!/\bcitas?\b/i.test(tx[k]), `${k}: ${tx[k]}`);
  assert.equal(tx.enSobre, 'Es para todo el libro. Se ve en el lector al sacar el PDF otra vez.');
  for (const k of ['', ...N.ENTRADAS_NOTA]) assert.ok(tx.enEfectos[k], 'entrada ' + k);
  for (const k of ['', ...N.BUCLES_NOTA]) assert.ok(tx.enBucles[k], 'bucle ' + k);
});

console.log('\nlas reglas de los archivos');
await ok('sin HTML a mano ni almacenamiento; colorNota puro; los efectos solo de la lista; el lector sigue sin cargar esto de entrada', () => {
  for (const f of ['src/scripts/lector/colorNota.js', 'src/scripts/lector/efectosNota.js', 'src/scripts/portal/panel/dev/taller/EstiloNotas.js', 'src/scripts/portal/panel/dev/taller/NotaEditor.js']) {
    assert.ok(!/localStorage|sessionStorage|innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/.test(leer(f)), f);
  }
  assert.ok(!/document\.|window\.|fetch\(|import\.meta/.test(sinComentarios(leer('src/scripts/lector/colorNota.js'))), 'colorNota es puro');
  const fx = sinComentarios(leer('src/scripts/lector/efectosNota.js'));
  assert.match(fx, /if \(!el \|\| typeof el\.animate !== 'function' \|\| !entradaValida\(id\)\) return null;/);
  assert.match(fx, /if \(parado \|\| quieto \|\| !bucleValido\(bucle\) \|\| !titulo\.isConnected\) return;/, 'con menos movimiento no hay bucle');
  assert.match(fx, /document\.addEventListener\('visibilitychange', alVer\)/, 'el bucle se para con la pestaña escondida');
  assert.ok(!/\b(width|height|top|left|margin|padding|fontSize|letterSpacing)\s*:\s*\[/.test(fx), 'nada que mueva la hoja se anima');
  /* site.js no importa nada de esto: llega con la hoja de la nota (import()) */
  const site = leer('src/scripts/site.js');
  assert.ok(!/from\s+['"][^'"]*(colorNota|efectosNota)/.test(site));
  const hoja = leer('src/scripts/lector/hojaNota.js');
  assert.match(hoja, /pararEfectos\(\);\s*notaActual = null;\s*if \(dejarDeMirar\) dejarDeMirar\(\);/, 'al cerrar se paran y se deja de mirar el tema');
});
await ok('revision: tema que cambia con la nota abierta, letras que vuelven a ser texto, brillo solo si se puede, guardar de verdad', () => {
  const hoja = sinComentarios(leer('src/scripts/lector/hojaNota.js'));
  assert.match(hoja, /mo\.observe\(html, \{ attributes: true, attributeFilter: \['data-tema'\] \}\)/);
  assert.match(hoja, /matchMedia\('\(prefers-color-scheme: dark\)'\)/);
  assert.match(hoja, /ponerColores\(hoja, notaActual\); if \(efectos\) efectos\.recolorear\(\);/);
  assert.match(hoja, /if \(!dejarDeMirar\) dejarDeMirar = mirarTema\(otroTema\);/);
  const pag = sinComentarios(leer('src/scripts/nota.js'));
  assert.ok(/mirarTema\(/.test(pag) && !/pintar\(\); else/.test(pag), '/nota/ no vuelve a pedir el pasaje al cambiar de tema');
  const fx = sinComentarios(leer('src/scripts/lector/efectosNota.js'));
  assert.match(fx, /CSS\.supports\('background-clip', 'text'\) \|\| CSS\.supports\('-webkit-background-clip', 'text'\)/);
  assert.match(fx, /bucle === 'brillo' && recortaALetra\(\)/);
  assert.match(fx, /const unir = \(\) => \{ if \(partido !== null && titulo\.isConnected\) titulo\.textContent = partido; partido = null; \};/);
  assert.match(fx, /quitarBucle\(\);\s*unir\(\);/, 'parar() deja el titulo entero');
  assert.match(fx, /unir\(\);\s*const g = oro\(\)/, 'el bucle empieza con el titulo entero');
  const est = leer('src/scripts/portal/panel/dev/taller/EstiloNotas.js');
  assert.match(est, /bien = \(await this\.alGuardar\(parche\)\) === true;/);
});

console.log(`\n${n} bien${mal ? `, ${mal} MAL` : ''}`);
process.exit(mal ? 1 : 0);
