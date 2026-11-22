/* EL LOMO de punta a punta, sin red ni navegador:
     1. lomoDe vive en lector/pliegos.js y el Taller lo re-exporta (el mismo numero en los dos visores);
     2. lector/lomo.js limpia lo que viaja en hojas[0].lomo (tambien datos hostiles) y dice como se pinta;
     3. PaginasEdicion: el lomo solo en la fila 0 (hojasSeguras), ponerLomo lo escribe y, con el peor caso, la columna `hojas`
        sigue cabiendo en los 4 MB de la base (013, medido como jsonb::text en un Postgres de prueba, PGlite);
     4. LomoLibro: la imagen del lomo (misma cuenta de ruta que la del contenido), el plan de la imagen (escalar si se parece
        en menos de un 4 %; si no, rellenar o recortar, nunca estirar) y lo que va a un enlace privado;
     5. RutasLibro: la copia del libro guarda la imagen del lomo; el PDF no la pide;
     6. el marcado, los textos y los estilos: el boton «Ver el lomo», sus rotulos es/en, el ladeo en hojeo.css (no en
        taller.css), la politica deja `img-src data:`, y los archivos nuevos no usan almacenamiento del navegador ni HTML a mano.
     node tools/test-lomo.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (r) => import(pathToFileURL(path.join(raiz, r)).href);
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');

const PL = await cargar('src/scripts/lector/pliegos.js');
const PT = await cargar('src/scripts/portal/panel/dev/taller/pliegos.js');
const LL = await cargar('src/scripts/lector/lomo.js');
const PE = await cargar('src/scripts/contenido/taller/PaginasEdicion.js');
const LB = await cargar('src/scripts/contenido/taller/LomoLibro.js');
const { ConfigPagina } = await cargar('src/scripts/contenido/taller/ConfigPagina.js');
const { rutasDelLibro } = await cargar('src/scripts/contenido/taller/RutasLibro.js');
const { esRutaImagenLibro } = await cargar('src/scripts/contenido/comun.js');
const { colorValido } = await cargar('src/scripts/contenido/taller/marcas.js');
const { textoIndice } = await cargar('src/scripts/contenido/taller/IndiceLibro.js');
const { medidasDeImagen } = await cargar('src/scripts/contenido/Almacen.js');

let bien = 0, mal = 0;
async function ok(nombre, fn) {
  try { await fn(); bien++; console.log('  ok  ' + nombre); } catch (e) { mal++; console.log(' MAL  ' + nombre + '\n      ' + String(e.message).split('\n')[0]); }
}
const CHR = String.fromCharCode;
const EMOJI = CHR(0xD83D, 0xDE00);
const OBRA = '0a1b2c3d-1111-2222-3333-444455556666';
const RUTA = `taller/${OBRA}/img/lomo-0123456789abcdef.png`;
/* Cabeceras de verdad (las que lee lector/lomo.js → medidasDeLomo), rellenas hasta un largo dado */
const asc = (t) => [...t].map((ch) => ch.charCodeAt(0));
const le = (v, n) => Array.from({ length: n }, (_, k) => (v >> (8 * k)) & 0xff);
const be32 = (v) => [(v >>> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
const CAB = {
  png: (w, h) => [0x89, ...asc('PNG'), 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, ...asc('IHDR'), ...be32(w), ...be32(h), 8, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  vp8x: (w, h) => [...asc('RIFF'), ...le(1000, 4), ...asc('WEBPVP8X'), ...le(10, 4), 0, 0, 0, 0, ...le(w - 1, 3), ...le(h - 1, 3)],
  vp8l: (w, h) => [...asc('RIFF'), ...le(1000, 4), ...asc('WEBPVP8L'), ...le(10, 4), 0x2f, ...le(((w - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14), 4), 0, 0],
  vp8: (w, h) => [...asc('RIFF'), ...le(1000, 4), ...asc('WEBPVP8 '), ...le(10, 4), 0, 0, 0, 0x9d, 0x01, 0x2a, ...le(w, 2), ...le(h, 2)]
};
const dataUrl = (tipo, bytes, n = 0) => {
  const pre = `data:image/${tipo === 'png' ? 'png' : 'webp'};base64,` + Buffer.from(bytes).toString('base64');
  return n > pre.length ? pre + 'A'.repeat(n - pre.length) : pre;
};
const img = (n, w = 80, h = 1200) => dataUrl('vp8x', CAB.vp8x(w, h), n);

console.log('el lomo');

/* ---- 1. lomoDe ---- */
await ok('lomoDe: uno solo, en lector/pliegos.js, y el Taller da el mismo', () => {
  assert.equal(PT.lomoDe, PL.lomoDe);
  for (const [n, w] of [[1, 400], [12, 400], [300, 400], [40, 120], [500, 720]]) {
    const v = PL.lomoDe(n, w);
    assert.ok(Number.isInteger(v) && v >= 8 && v <= Math.max(8, w * 0.16) + 1, `${n} ${w} → ${v}`);
  }
  for (const raro of [[0, 400], [NaN, 400], [10, 0], [10, -5], [undefined, undefined]]) assert.equal(PL.lomoDe(...raro), 0);
  assert.ok(!/export function lomoDe/.test(leer('src/scripts/portal/panel/dev/taller/pliegos.js')), 'el Taller ya no tiene su copia');
});

/* ---- 2. lector/lomo.js ---- */
await ok('limpiarLomoEdicion: solo lo que vale; lo raro es null', () => {
  for (const raro of [null, undefined, 7, 'x', [], [1], {}, { c: 'red', t: 5, x: '', g: 0, img: '' }, JSON.parse('{"__proto__": {"c": "#ff0000"}}')]) {
    assert.equal(LL.limpiarLomoEdicion(raro), null, JSON.stringify(raro));
  }
  const l = LL.limpiarLomoEdicion({ c: '#1F3B2C', t: 'rgb(1, 2, 3)', x: '  Mi' + CHR(7) + ' libro ', g: 0.05, img: img(200), otra: 'x' });
  assert.deepEqual(l, { c: '#1f3b2c', t: '#010203', x: 'Mi libro', g: 0.05, img: img(200) });
});
await ok('limpiarLomoEdicion: el texto es corto, sin controles, sin marcas de direccion ni medio emoji', () => {
  const x = LL.limpiarLomoEdicion({ x: 'a'.repeat(39) + EMOJI }).x;
  assert.equal(x, 'a'.repeat(39));
  const y = LL.limpiarLomoEdicion({ x: 'Hola' + CHR(0x202E) + ' mundo' + CHR(0) + '\n\n' + 'z'.repeat(80) }).x;
  assert.ok(y.startsWith('Hola mundo') && Array.from(y).length <= LL.LOMO_TEXTO_MAX && !y.includes(CHR(0x202E)) && !y.includes('\n'));
});
await ok('limpiarLomoEdicion: el grueso es una parte del ancho entre 0,01 y 0,35; si no, nada', () => {
  const g = (v) => (LL.limpiarLomoEdicion({ c: '#000000', g: v }) || {}).g;
  assert.equal(g(0.01), 0.01);
  assert.equal(g(0.35), 0.35);
  assert.equal(g(0.123456), 0.1235);
  for (const raro of [0, 0.009, 0.36, 1, -0.1, NaN, Infinity, '0.1', null]) assert.equal(g(raro), undefined, String(raro));
});
await ok('limpiarLomoEdicion: la imagen es SOLO data:image/webp o png en base64, y de LOMO_IMG_MAX letras como mucho', () => {
  const i = (v) => (LL.limpiarLomoEdicion({ c: '#000000', img: v }) || {}).img;
  assert.equal(i(img(LL.LOMO_IMG_MAX)), img(LL.LOMO_IMG_MAX));
  const png = dataUrl('png', CAB.png(96, 1006));
  assert.equal(i(png), png);
  assert.equal(i('data:image/png;base64,iVBORw0KGgo='), undefined, 'sin cabecera IHDR completa no entra');
  for (const raro of [img(LL.LOMO_IMG_MAX + 1), 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,AAAA', 'data:text/html;base64,AAAA',
    'javascript:alert(1)', 'https://ejemplo.com/a.webp', 'data:image/webp;base64,AA AA', 'data:image/webp;base64,AA"><b', 'data:image/webp,AAAA',
    ' data:image/webp;base64,AAAA', 'data:image/webp;base64,AAAA\n', 'DATA:image/webp;base64,AAAA', 7, null]) assert.equal(i(raro), undefined, String(raro).slice(0, 40));
});
await ok('estiloLomoLector: el ancho (elegido o segun las hojas), el texto y los colores de repuesto', () => {
  const a = LL.estiloLomoLector(null, { titulo: 'Ahavá', n: 20, pw: 400, color: '#a27005', tinta: '#f1efe9' });
  assert.deepEqual(a, { px: PL.lomoDe(20, 400), texto: 'Ahavá', color: '#a27005', tinta: '#f1efe9', img: '' });
  const b = LL.estiloLomoLector({ c: '#123456', x: 'Lomo', g: 0.1, img: img(100) }, { titulo: 'Otro', n: 20, pw: 400, color: '#a27005', tinta: '#000000' });
  assert.deepEqual(b, { px: 40, texto: 'Lomo', color: '#123456', tinta: '', img: img(100) });
  assert.equal(LL.estiloLomoLector({ g: 0.01 }, { n: 5, pw: 100 }).px, 6, 'nunca menos de 6 px');
  assert.equal(LL.estiloLomoLector({ g: 0.35 }, { n: 5, pw: 1000 }).px, 350, 'ni mas de un 35 % de la pagina');
  assert.equal(LL.estiloLomoLector(null, { color: 'url(x)', tinta: 'red' }).color, '');
});

await ok('el color y el texto de lector/lomo.js dan LO MISMO que colorValido y textoIndice (sin traerlos)', () => {
  const colores = ['#1F3B2C', ' #abcdef ', '#abc', 'red', 'rgb(1, 2, 3)', 'RGB( 255 ,0,10 )', 'rgb(256, 0, 0)', 'rgb(1,2)', 'url(x)', '', null, 7, '#12345g', '#1234567'];
  for (const c of colores) assert.equal(LL.colorDeLomo(c), colorValido(c), String(c));
  const textos = ['  Mi' + CHR(7) + ' libro ', 'a'.repeat(39) + EMOJI, 'Hola' + CHR(0x202E) + ' mundo' + CHR(0) + '\n\n' + 'z'.repeat(80), CHR(0x2066) + 'x' + CHR(0x2069),
    'tab\tlinea\r\nnueva', 'Ahavá אהבה', EMOJI.repeat(30), '', null, 5, CHR(0x7f) + 'y', 'b'.repeat(200)];
  for (const t of textos) for (const max of [40, 120]) assert.equal(LL.textoLomo(t, max), textoIndice(t, max), JSON.stringify(t));
});
await ok('medidasDeLomo lee la cabecera como Almacen.medidasDeImagen (PNG, WebP VP8, VP8L y VP8X)', () => {
  for (const [tipo, w, h] of [['png', 96, 1006], ['png', 1, 1], ['vp8x', 80, 1200], ['vp8x', 128, 4096], ['vp8l', 64, 900], ['vp8l', 16, 4000], ['vp8', 96, 1200], ['vp8', 48, 640]]) {
    const dir = dataUrl(tipo, CAB[tipo](w, h), 2000);
    assert.deepEqual(LL.medidasDeLomo(dir), { w, h }, `${tipo} ${w}x${h}`);
    const bytes = new Uint8Array(Buffer.from(CAB[tipo](w, h)));
    assert.deepEqual(medidasDeImagen(bytes, tipo === 'png' ? 'png' : 'webp'), { w, h }, `Almacen ${tipo}`);
  }
  for (const raro of ['data:image/webp;base64,' + 'A'.repeat(100), 'data:image/png;base64,' + Buffer.from(CAB.vp8x(10, 10)).toString('base64'),
    'data:image/webp;base64,' + Buffer.from(CAB.png(10, 10)).toString('base64'), 'data:image/webp;base64,UklGRg', '', null]) assert.equal(LL.medidasDeLomo(raro), null, String(raro).slice(0, 40));
});
await ok('la imagen del lomo: 128 px de ancho y 4096 de alto como mucho, segun su cabecera; si no, se tira', () => {
  const i = (v) => (LL.limpiarLomoEdicion({ c: '#000000', img: v }) || {}).img;
  assert.ok(i(img(500, 128, 4096)));
  assert.equal(i(img(500, 129, 1200)), undefined);
  assert.equal(i(img(500, 96, 4097)), undefined);
  assert.equal(i(dataUrl('png', CAB.png(400, 400), 500)), undefined);
  assert.equal(i(dataUrl('vp8l', CAB.vp8l(200, 900), 500)), undefined);
  assert.ok(i(dataUrl('vp8', CAB.vp8(96, 1200), 500)));
});
await ok('site.js no llega (por sus import estaticos) a la Biblia, las notas, el Taller ni el portal', () => {
  const visto = new Set(), pila = [path.join(raiz, 'src/scripts/site.js')];
  const re = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
  while (pila.length) {
    const f = pila.pop();
    if (visto.has(f)) continue;
    visto.add(f);
    const t = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of t.matchAll(re)) { const s = m[1] || m[2]; if (s.startsWith('.')) pila.push(path.resolve(path.dirname(f), s)); }
  }
  const rutas = [...visto].map((f) => path.relative(path.join(raiz, 'src'), f).split(path.sep).join('/'));
  assert.ok(rutas.includes('scripts/lector/lomo.js'), 'el lomo si esta');
  /* portal/salto.js ya estaba antes del lomo (el salto al portal desde la cabecera) y es lo unico del portal que se deja */
  const malas = rutas.filter((r) => /(^|\/)biblia\/|notaEnPdf|notasLibro|contenido\/taller\/|(^|\/)portal\//.test(r) && r !== 'scripts/portal/salto.js');
  assert.deepEqual(malas, []);
});

/* ---- 3. PaginasEdicion ---- */
await ok('hojasSeguras: el lomo solo en la fila 0, limpio; en otra fila se tira', () => {
  const hs = PE.hojasSeguras([
    { text: 'a', lomo: { c: '#123456', x: 'Hola', g: 0.1, img: img(300), raro: 1 } },
    { text: 'b', lomo: { c: '#111111' } },
    { text: 'c', lomo: { c: '#222222' } }
  ], 3);
  assert.deepEqual(hs[0].lomo, { c: '#123456', x: 'Hola', g: 0.1, img: img(300) });
  assert.ok(!('lomo' in hs[1]) && !('lomo' in hs[2]));
  assert.deepEqual(PE.lomoDeHojas(hs), hs[0].lomo);
  assert.equal(PE.lomoDeHojas(PE.hojasSeguras([{ text: 'a', lomo: { c: 'nada' } }], 1)), null);
  assert.equal(PE.lomoDeHojas([]), null);
  assert.equal(PE.lomoDeHojas(null), null);
});
await ok('ponerLomo: una copia; quita el lomo viejo, pone el limpio; lo que no vale no entra', () => {
  const hojas = [{ text: 'a', lomo: { c: '#000000' }, tapa: '#111111' }, { text: 'b' }];
  const r = PE.ponerLomo(hojas, { c: '#ABCDEF', img: 'javascript:x', x: 'Hola' });
  assert.deepEqual(r, [{ text: 'a', tapa: '#111111', lomo: { c: '#abcdef', x: 'Hola' } }, { text: 'b' }]);
  assert.deepEqual(hojas[0].lomo, { c: '#000000' }, 'la de entrada no cambia');
  assert.deepEqual(PE.ponerLomo(hojas, null), [{ text: 'a', tapa: '#111111' }, { text: 'b' }]);
  assert.deepEqual(PE.ponerLomo([], { c: '#000000' }), []);
});
await ok('ponerLomo: si con la imagen se pasara del tope, va sin ella (y sin nada si solo traia la imagen)', () => {
  const grande = [{ text: 'x'.repeat(PE.HOJAS_MAX_BYTES + PE.LOMO_HOLGURA - 150000) }];
  const r = PE.ponerLomo(grande, { c: '#123456', img: img(LL.LOMO_IMG_MAX) });
  assert.deepEqual(r[0].lomo, { c: '#123456' });
  assert.ok(!('lomo' in PE.ponerLomo(grande, { img: img(LL.LOMO_IMG_MAX) })[0]));
  const chico = PE.ponerLomo([{ text: 'x' }], { img: img(LL.LOMO_IMG_MAX) });
  assert.equal(chico[0].lomo.img.length, LL.LOMO_IMG_MAX);
});
await ok('el peor caso (hojas al tope de 3,5 MB, con muchos enlaces, y el lomo mas grande) cabe en los 4 MB de la base', async () => {
  /* Paginas llenas de enlaces (lo que mas crece al pasar a jsonb::text: ": " y ", " por cada clave) hasta HOJAS_MAX_BYTES */
  const enlace = { x: 0.1234, y: 0.5678, w: 0.0123, h: 0.0123, href: 'https://ejemplo.com/' + 'a'.repeat(30) };
  const hojas = [];
  const peso = () => new TextEncoder().encode(JSON.stringify(hojas)).length;
  while (hojas.length < PE.PAGINAS_MAX) {
    hojas.push({ text: '', links: Array.from({ length: PE.ENLACES_MAX }, () => ({ ...enlace })) });
    if (peso() > PE.HOJAS_MAX_BYTES) { hojas.pop(); break; }
  }
  while (peso() < PE.HOJAS_MAX_BYTES - 200) hojas[hojas.length - 1].text += 'x'.repeat(Math.min(5000, PE.HOJAS_MAX_BYTES - 200 - peso()));
  const con = PE.ponerLomo(hojas, { c: '#123456', t: '#ffffff', x: 'a'.repeat(40), g: 0.35, img: img(LL.LOMO_IMG_MAX) });
  assert.equal(con[0].lomo.img.length, LL.LOMO_IMG_MAX, 'la imagen entro');
  const db = new PGlite();
  const r = await db.query('select octet_length($1::jsonb::text) as n', [JSON.stringify(con)]);
  const n = Number(r.rows[0].n);
  await db.close();
  assert.ok(n <= 4000000, `jsonb::text mide ${n} bytes`);
});

/* ---- 4. LomoLibro ---- */
await ok('limpiarLomo: la imagen del lomo con la misma cuenta de ruta que la del contenido; sin imagen, la forma de siempre', () => {
  assert.deepEqual(LB.limpiarLomo({ imagen: { ruta: RUTA } }).imagen, { ruta: RUTA });
  assert.ok(!('imagen' in LB.limpiarLomo({})), 'un libro viejo se guarda igual que antes');
  for (const ruta of [`taller/${OBRA}/img/lomo.svg`, `taller/${OBRA}/pdf/lomo.png`, `taller/${OBRA}/img/../x.png`, `taller/${OBRA}/img/Lomo.png`, `lomos/${OBRA}/img/a.png`,
    `taller/${OBRA}/img/a b.png`, `taller/${OBRA}/img/a.png?x`, 'https://ejemplo.com/a.png', `taller/${OBRA}/img/${'a'.repeat(200)}.png`, 7, null]) {
    assert.ok(!('imagen' in LB.limpiarLomo({ imagen: { ruta } })), String(ruta).slice(0, 60));
    assert.equal(esRutaImagenLibro(ruta), false);
  }
  /* La misma cuenta para la imagen del contenido */
  assert.equal(new ConfigPagina({ indice: { imagen: { ruta: RUTA } } }).indice.imagen.ruta, RUTA);
  assert.equal(new ConfigPagina({ indice: { imagen: { ruta: `taller/${OBRA}/img/a.svg` } } }).indice.imagen.ruta, '');
});
await ok('ConfigPagina: la imagen del lomo se guarda, vuelve igual, y aDatos entrega una copia', () => {
  const c = new ConfigPagina({ lomo: { color: '#7a1f2b', imagen: { ruta: RUTA } } });
  assert.deepEqual(c.lomo.imagen, { ruta: RUTA });
  const d = c.aDatos();
  d.lomo.imagen.ruta = 'otra';
  assert.equal(c.lomo.imagen.ruta, RUTA);
  assert.deepEqual(new ConfigPagina(JSON.parse(JSON.stringify(c.aDatos()))).lomo, c.lomo);
  assert.ok(!('imagen' in LB.estiloDeLomo(c.lomo, 'T')), 'estiloDeLomo sigue con su forma de siempre');
});
await ok('planDeLomo: se escala si la forma se parece en menos de un 4 %; si no, se pregunta', () => {
  const lomo = { grosorMm: 20, altoMm: 229 };
  const objetivo = 20 / 229;
  const forma = (f) => LB.planDeLomo({ w: Math.round(10000 * objetivo * f), h: 10000 }, lomo);
  assert.equal(forma(1).cabe, true);
  assert.equal(forma(1.035).cabe, true);
  assert.equal(forma(0.965).cabe, true);
  assert.equal(forma(1.05).cabe, false);
  assert.equal(forma(0.95).cabe, false);
  assert.equal(forma(1.05).sobra, 'ancho');
  assert.equal(forma(0.5).sobra, 'alto');
  const p = forma(1);
  assert.equal(p.girar, false);
  assert.equal(p.alto, LB.LOMO_ALTO_MAX);
  assert.equal(p.ancho, Math.round(LB.LOMO_ALTO_MAX * objetivo));
  /* Un libro chico: el alto a 300 ppp */
  assert.equal(LB.planDeLomo({ w: 10, h: 100 }, { grosorMm: 10, altoMm: 100 }).alto, Math.round(100 / 25.4 * 300));
  for (const raro of [[{ w: 0, h: 10 }, lomo], [{ w: 10, h: NaN }, lomo], [null, lomo], [{ w: 10, h: 10 }, { grosorMm: 0, altoMm: 10 }], [{ w: Infinity, h: 10 }, lomo]]) assert.equal(LB.planDeLomo(...raro), null);
});
await ok('planDeLomo: una imagen acostada se pone de pie', () => {
  const p = LB.planDeLomo({ w: 2290, h: 200 }, { grosorMm: 20, altoMm: 229 });
  assert.equal(p.girar, true);
  assert.equal(p.cabe, true);
});
await ok('encajeDeLomo: nunca estira (rellenar y recortar guardan la forma; escalar solo si cabe)', () => {
  const lomo = { grosorMm: 20, altoMm: 229 };
  const casos = [{ w: 500, h: 1000 }, { w: 40, h: 2000 }, { w: 175, h: 2000 }, { w: 3, h: 4000 }];
  for (const im of casos) {
    const p = LB.planDeLomo(im, lomo);
    const r = LB.encajeDeLomo(p, 'rellenar', im), c = LB.encajeDeLomo(p, 'recortar', im);
    const forma = (q) => q.w / q.h;
    assert.ok(Math.abs(forma(r.d) / forma(r.s) - 1) < 1e-9, 'rellenar guarda la forma');
    assert.ok(r.d.x >= -1e-9 && r.d.y >= -1e-9 && r.d.x + r.d.w <= p.ancho + 1e-9 && r.d.y + r.d.h <= p.alto + 1e-9, 'rellenar cabe en el lomo');
    assert.ok(Math.abs(forma(c.s) / forma(c.d) - 1) < 1e-9, 'recortar guarda la forma');
    assert.ok(c.s.x >= -1e-9 && c.s.y >= -1e-9 && c.s.x + c.s.w <= im.w + 1e-9 && c.s.y + c.s.h <= im.h + 1e-9, 'recortar toma de dentro de la imagen');
    assert.deepEqual(c.d, { x: 0, y: 0, w: p.ancho, h: p.alto });
    /* Centrado: lo que sobra, por igual a cada lado */
    assert.ok(Math.abs(r.d.x - (p.ancho - r.d.x - r.d.w)) < 1e-6 && Math.abs(r.d.y - (p.alto - r.d.y - r.d.h)) < 1e-6);
    assert.ok(Math.abs(c.s.x - (im.w - c.s.x - c.s.w)) < 1e-6 && Math.abs(c.s.y - (im.h - c.s.y - c.s.h)) < 1e-6);
    const e = LB.encajeDeLomo(p, 'escalar', im);
    if (p.cabe) assert.equal(e.modo, 'escalar'); else assert.equal(e.modo, 'rellenar', 'un escalar que no cabe no estira');
  }
  assert.equal(LB.encajeDeLomo(null, 'recortar', { w: 1, h: 1 }), null);
});
await ok('grosorDelLomoMm: el elegido, o el automatico segun las hojas', () => {
  assert.equal(LB.grosorDelLomoMm({ grosor: 12.5 }, 100, 148), 12.5);
  const auto = LB.grosorDelLomoMm({}, 100, 148);
  assert.equal(auto, Math.round(PL.lomoDe(100, 1000) / 1000 * 148 * 10) / 10);
  assert.ok(LB.grosorDelLomoMm({}, 300, 148) > LB.grosorDelLomoMm({}, 20, 148));
  assert.equal(LB.grosorDelLomoMm({}, 10, 0), LB.LOMO_GROSOR.min);
});
await ok('la imagen del lomo solo se pide de la carpeta de ESTE libro', () => {
  assert.equal(LB.esRutaDelLomo(RUTA, OBRA), true);
  for (const otro of ['', null, undefined, '0a1b2c3d-1111-2222-3333-444455556667', '0a1b2c3d']) assert.equal(LB.esRutaDelLomo(RUTA, otro), false, String(otro));
  assert.equal(LB.esRutaDelLomo(`taller/${OBRA}/img/../x.png`, OBRA), false);
  assert.equal(LB.lomoParaEdicion({ imagen: { ruta: RUTA } }, 148, 'otro-libro').ruta, '');
  assert.equal(LB.lomoParaEdicion({ imagen: { ruta: RUTA } }, 148).ruta, '', 'sin saber el libro, no hay imagen');
  const src = leer('src/scripts/portal/panel/dev/taller/LomoSubido.js') + leer('src/scripts/portal/panel/dev/taller/VistaLibro.js');
  assert.ok((src.match(/esRutaDelLomo\(/g) || []).length >= 3, 'LomoSubido (muestra y edicion) y VistaLibro miran la carpeta');
});
await ok('una imagen enorme no se abre: 12 000 px de lado y 100 millones de pixeles como mucho (de su cabecera)', () => {
  assert.equal(LB.medidaDeLomoAceptable({ w: 12000, h: 8000 }), true);
  assert.equal(LB.medidaDeLomoAceptable({ w: 12001, h: 10 }), false);
  assert.equal(LB.medidaDeLomoAceptable({ w: 10, h: 12001 }), false);
  assert.equal(LB.medidaDeLomoAceptable({ w: 11000, h: 10000 }), false, '110 MP');
  for (const raro of [null, {}, { w: 0, h: 5 }, { w: NaN, h: 5 }, { w: Infinity, h: 1 }, { w: '10', h: '10' }]) assert.equal(LB.medidaDeLomoAceptable(raro), !!(raro && raro.w === '10'), JSON.stringify(raro));
  const src = leer('src/scripts/portal/panel/dev/taller/LomoSubido.js');
  assert.ok(/await medidasDe\(archivo, ext\)/.test(src) && /medidaDeLomoAceptable\(m\)/.test(src), 'se mira la cabecera antes de abrirla');
  assert.ok(/DE_PIE_MAX/.test(src), 'el lienzo girado tiene tope');
});
await ok('si la imagen no entra en el enlace, Compartir lo dice; el panel avisa que puede recortarse', () => {
  const t = leer('src/data/portal/textos.js');
  assert.ok(t.includes("cpLomoSinImagen: 'El lomo va sin imagen: es muy grande para el enlace.'"));
  assert.ok(t.includes('lomoImagenRecorte:'));
  assert.ok(/this\.falla\('cpLomoSinImagen'\)/.test(leer('src/scripts/portal/panel/dev/taller/Publicar.js')));
});
await ok('lomoParaEdicion: lo que va a un enlace privado (color con su letra, texto, grueso como parte del ancho, ruta)', () => {
  assert.deepEqual(LB.lomoParaEdicion({}, 148), { datos: {}, ruta: '' });
  const r = LB.lomoParaEdicion({ color: '#123456', texto: 'Hola', grosor: 14.8, imagen: { ruta: RUTA } }, 148, OBRA);
  assert.deepEqual(r, { datos: { c: '#123456', t: '#ffffff', x: 'Hola', g: 0.1 }, ruta: RUTA });
  assert.deepEqual(LB.lomoParaEdicion({ tinta: '#000000' }, 148).datos, { t: '#000000' });
  /* Y el lector lo acepta tal cual */
  assert.deepEqual(LL.limpiarLomoEdicion(r.datos), r.datos);
});
await ok('PAGINA_BYTES_MAX: la imagen del lomo (ruta de 200 letras) no lo pasa con lo demas al tope', async () => {
  const largo = (k) => CHR(0xD800, 0xDF48).repeat(k);
  const ruta = `taller/${'a'.repeat(40)}/img/lomo-${'b'.repeat(200 - 7 - 40 - 5 - 4 - 5)}.png`;
  assert.equal(ruta.length, 200);
  const c = new ConfigPagina({ lomo: { texto: largo(40), color: '#123456', tinta: '#123456', grosor: 12.5, tapas: { delante: '#123456', detras: '#123456' }, imagen: { ruta } } });
  assert.deepEqual(c.lomo.imagen, { ruta });
  const sin = new ConfigPagina({ lomo: { texto: largo(40), color: '#123456', tinta: '#123456', grosor: 12.5, tapas: { delante: '#123456', detras: '#123456' } } });
  const extra = new TextEncoder().encode(JSON.stringify(c.aDatos())).length - new TextEncoder().encode(JSON.stringify(sin.aDatos())).length;
  assert.ok(extra <= 230, `la imagen suma ${extra} bytes`);
});

/* ---- 5. RutasLibro ---- */
await ok('rutasDelLibro: la copia del libro guarda la imagen del lomo; el PDF no la pide', () => {
  const obra = { pagina: new ConfigPagina({ lomo: { imagen: { ruta: RUTA } } }).aDatos() };
  assert.ok(rutasDelLibro(obra, []).has(RUTA));
  assert.ok(!rutasDelLibro(obra, [], { impreso: true }).has(RUTA));
  assert.equal(rutasDelLibro({ pagina: {} }, []).size, 0);
});

/* ---- 6. Marcado, textos, estilos y reglas del portal ---- */
await ok('el boton «Ver el lomo» esta en el muelle, nace escondido y con aria-pressed; sus rotulos en es y en', async () => {
  const panels = leer('src/components/Panels.astro');
  assert.match(panels, /<button[^>]*data-lector-lomo[^>]*aria-pressed="false"[^>]*hidden/);
  const { UI } = await cargar('src/i18n/ui.js');
  assert.equal(UI.es['lector.lomo'], 'Ver el lomo');
  assert.equal(UI.en['lector.lomo'], 'See the spine');
  const site = leer('src/scripts/site.js');
  assert.ok(site.includes("lz('[data-lector-lomo]')") && site.includes("tl('lomo')"), 'site.js lo usa');
  assert.ok(/limpiarLomoEdicion\(x\.lomo\)/.test(site), 'el libro privado limpia su lomo otra vez');
});
await ok('el ladeo del lector vive en hojeo.css (no en taller.css), con su respaldo para «menos movimiento»', () => {
  const css = leer('src/styles/hojeo.css'), taller = leer('src/styles/taller.css');
  for (const at of ['front', 'back', 'open']) assert.ok(css.includes(`.book-panel[data-lomo="si"] .flip[data-at="${at}"]`), at);
  assert.ok(/\.book-panel\[data-lomo="si"\] \.flip \{[^}]*pointer-events: none/.test(css), 'ladeado no se toca');
  assert.ok(/prefers-reduced-motion: reduce\)[^{]*\{\s*\.book-panel \.flip \{ transition: translate/.test(css), 'sin giro con menos movimiento');
  assert.ok(!taller.includes('.book-panel'), 'taller.css no se toco para esto');
  assert.ok(css.includes('.flip__lomo-img'));
});
await ok('la politica del sitio ya deja imagenes «data:» (la del lomo de un enlace privado)', () => {
  assert.match(leer('tools/politica-contenido.mjs'), /img-src \$\{\["'self'", 'data:'/);
});
await ok('los archivos nuevos: sin almacenamiento del navegador, sin HTML a mano, sin escapes \\u de cuatro cifras', () => {
  const nuevos = ['src/scripts/lector/lomo.js', 'src/scripts/portal/panel/dev/taller/LomoSubido.js', 'src/scripts/contenido/taller/LomoLibro.js', 'src/styles/taller-lomo.css'];
  const prohibidas = ['local' + 'Storage', 'session' + 'Storage', 'inner' + 'HTML'];
  const escape = new RegExp('\\\\u[0-9a-fA-F]{4}');
  for (const f of nuevos) {
    const t = leer(f);
    for (const p of prohibidas) assert.ok(!t.includes(p), `${f}: ${p}`);
    assert.ok(!escape.test(t), `${f}: escape \\u`);
  }
});

console.log(`\n${bien} bien, ${mal} mal`);
if (mal) process.exit(1);
