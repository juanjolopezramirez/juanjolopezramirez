/* ARRASTRAR Y SOLTAR (A3), sin navegador: las partes puras de portal/panel/soltar.js y que cada lugar este conectado.
     1. Solo actua con archivos (`Files`): texto, miniaturas y enlaces sueltos (`text/uri-list`) no se tocan.
     2. Un archivo por vez; extension + MIME + tope + primeros bytes (los de Almacen.esDelFormato).
     3. Lo que se dice (textos.js) y el menu del PDF soltado en la mesa.
     4. Los 11 lugares de subir estan conectados, la guardia de la ventana esta puesta y el arrastre de miniaturas sigue igual.
     node tools/test-soltar.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (r) => import(pathToFileURL(path.join(raiz, r)).href);
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');

const S = await cargar('src/scripts/portal/panel/soltar.js');
const { tp } = await cargar('src/data/portal/textos.js');
const es = tp('es');
const TX = es.panel.soltar;

let bien = 0, mal = 0;
async function ok(nombre, fn) {
  try { await fn(); bien++; console.log('  ok  ' + nombre); } catch (e) { mal++; console.log(' MAL  ' + nombre + '\n      ' + String(e.message).split('\n')[0]); }
}
const FIRMA = {
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpg: [0xff, 0xd8, 0xff, 0xe0],
  webp: [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]
};
const archivo = (nombre, tipo, bytes, relleno = 64) => new File([new Uint8Array([...bytes, ...new Array(relleno).fill(0)])], nombre, { type: tipo });
const svg = (nombre = 'a.svg', tipo = 'image/svg+xml', texto = '<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>') => new File([texto], nombre, { type: tipo });

/* ---- 1. Solo archivos ---- */
await ok('llevaArchivos: solo si trae `Files` (lista o DOMStringList); texto, miniaturas y enlaces no', () => {
  assert.equal(S.llevaArchivos({ types: ['Files'] }), true);
  assert.equal(S.llevaArchivos({ types: ['text/uri-list', 'text/html', 'Files'] }), true, 'una imagen arrastrada de otra pagina trae su archivo');
  assert.equal(S.llevaArchivos({ types: { contains: (t) => t === 'Files' } }), true);
  for (const t of [['text/plain'], ['text/uri-list'], ['text/uri-list', 'text/plain'], []]) assert.equal(S.llevaArchivos({ types: t }), false, t.join());
  for (const raro of [null, undefined, {}, { types: null }]) assert.equal(S.llevaArchivos(raro), false);
  /* Lo que arrastran las miniaturas y los capitulos */
  assert.match(leer('src/scripts/portal/panel/dev/taller/Miniaturas.js'), /setData\('text\/plain', 'capitulo'\)/);
});
await ok('cada escucha de soltar.js mira primero `llevaArchivos` (sin archivo, nada cambia)', () => {
  const src = leer('src/scripts/portal/panel/soltar.js');
  const cuerpo = (nombre) => src.slice(src.indexOf(nombre), src.indexOf('\n  };', src.indexOf(nombre)));
  assert.match(cuerpo('const alPasar = (e) =>'), /^const alPasar = \(e\) => \{\s*if \(!llevaArchivos\(e\.dataTransfer\)/);
  assert.match(cuerpo('const alSoltar = async (e) =>'), /if \(!llevaArchivos\(e\.dataTransfer\) \|\| reclamado\(e\)\)/);
  const guardia = src.slice(src.indexOf('export function guardiaDeVentana'), src.indexOf('export function soltarEn('));
  assert.equal((guardia.match(/if \(!llevaArchivos\(e\.dataTransfer\)\) return;/g) || []).length, 2, 'dragover y drop');
  assert.ok(!/getData\('text\/uri-list'\)|fetch\(/.test(src), 'nunca se trae una direccion soltada');
});

/* ---- 2. Que archivo vale ---- */
await ok('extDeNombre y extsDeAccept (los accept de verdad del panel y del Taller)', () => {
  assert.equal(S.extDeNombre('Lomo.JPEG'), 'jpg');
  assert.equal(S.extDeNombre('a.pdf.exe'), '');
  assert.equal(S.extDeNombre('sin-punto'), '');
  assert.deepEqual(S.extsDeAccept('application/pdf,.pdf'), ['pdf']);
  assert.deepEqual(S.extsDeAccept('image/png,.png'), ['png']);
  assert.deepEqual(S.extsDeAccept('image/png,image/webp,.png,.webp').sort(), ['png', 'webp']);
  assert.deepEqual(S.extsDeAccept('image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp').sort(), ['jpg', 'png', 'webp']);
  assert.deepEqual(S.extsDeAccept('.svg,image/svg+xml'), ['svg']);
  assert.deepEqual(S.extsDeAccept('image/*,text/html'), [], 'lo que no conoce, no');
  /* Cada accept de un «Elegir…» del panel da algo */
  for (const f of ['src/components/portal/dev/EditorLibro.astro', 'src/components/portal/dev/EditorCasa.astro', 'src/scripts/portal/panel/dev/EditorBloques.js']) {
    const t = leer(f);
    const accepts = [...t.matchAll(/accept[=:]\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    assert.ok(accepts.length, f);
    for (const a of accepts) assert.ok(S.extsDeAccept(a).length, `${f}: ${a}`);
  }
});
await ok('revisarNombre: extension pedida, MIME que diga lo mismo (o ninguno), no vacio, con su tope', () => {
  const pdf = archivo('libro.pdf', 'application/pdf', FIRMA.pdf);
  assert.deepEqual(S.revisarNombre(pdf, ['pdf']), { ok: true, ext: 'pdf' });
  assert.equal(S.revisarNombre(pdf, ['png']).clave, 'tipo');
  assert.equal(S.revisarNombre(archivo('libro.pdf', 'image/png', FIRMA.pdf), ['pdf']).clave, 'falso', 'el MIME dice otra cosa');
  assert.deepEqual(S.revisarNombre(archivo('libro.pdf', '', FIRMA.pdf), ['pdf']), { ok: true, ext: 'pdf' }, 'sin MIME deciden los bytes');
  assert.equal(S.revisarNombre(new File([], 'v.pdf', { type: 'application/pdf' }), ['pdf']).clave, 'vacio');
  const grande = { name: 'g.png', type: 'image/png', size: S.TOPE_DE.png + 1 };
  assert.equal(S.revisarNombre(grande, ['png']).clave, 'grande');
  assert.equal(S.revisarNombre({ name: 'g.pdf', type: 'application/pdf', size: 49 * 1024 * 1024 }, ['pdf']).ok, true, 'un PDF puede pesar hasta 50 MB');
  assert.equal(S.revisarNombre({ name: 'g.svg', type: 'image/svg+xml', size: S.SVG_TOPE + 1 }, ['svg']).clave, 'grande');
  assert.equal(S.revisarNombre(null, ['pdf']).clave, 'sinArchivo');
});
await ok('unArchivo: uno por vez', () => {
  const a = archivo('a.png', 'image/png', FIRMA.png);
  assert.equal(S.unArchivo({ files: [a] }).archivo, a);
  assert.equal(S.unArchivo({ files: [a, a] }).clave, 'uno');
  assert.equal(S.unArchivo({ files: [] }).clave, 'sinArchivo');
  assert.equal(S.unArchivo(null).clave, 'sinArchivo');
});
await ok('quizasSirve: mientras se arrastra solo hay MIME; sin MIME, quizas', () => {
  const dt = (...tipos) => ({ items: tipos.map((type) => ({ kind: 'file', type })) });
  assert.equal(S.quizasSirve(dt('application/pdf'), ['pdf']), true);
  assert.equal(S.quizasSirve(dt('image/png'), ['pdf']), false);
  assert.equal(S.quizasSirve(dt(''), ['pdf']), true);
  assert.equal(S.quizasSirve(dt('image/png', 'image/png'), ['png']), false, 'dos a la vez no');
  assert.equal(S.quizasSirve({ items: [{ kind: 'string', type: 'text/plain' }] }, ['pdf']), true);
});
await ok('revisarSoltado: los primeros bytes mandan (un .png que es un PDF no pasa); SVG = texto con <svg', async () => {
  for (const ext of ['pdf', 'png', 'jpg', 'webp']) {
    const tipo = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }[ext];
    assert.deepEqual(await S.revisarSoltado(archivo(`x.${ext}`, tipo, FIRMA[ext]), [ext]), { ok: true, ext }, ext);
  }
  assert.equal((await S.revisarSoltado(archivo('x.png', 'image/png', FIRMA.pdf), ['png'])).clave, 'falso');
  assert.equal((await S.revisarSoltado(archivo('x.pdf', '', FIRMA.png), ['pdf'])).clave, 'falso');
  assert.equal((await S.revisarSoltado(svg(), ['svg'])).ok, true);
  assert.equal((await S.revisarSoltado(svg('x.svg', 'image/svg+xml', '<html><body>no</body></html>'), ['svg'])).clave, 'falso');
  /* La misma firma que el almacen (archivos.js → revisarArchivo) */
  assert.match(leer('src/scripts/portal/panel/soltar.js'), /import \{ esDelFormato \} from '\.\.\/\.\.\/contenido\/Almacen\.js'/);
  assert.match(leer('src/scripts/portal/archivos.js'), /esDelFormato\(await primeros\(archivo, 32\), ext\)/);
});

/* ---- 3. Lo que se dice ---- */
await ok('los textos: «Ese archivo no sirve aquí: …», el tipo que va, el tope y uno por vez', () => {
  assert.equal(S.textoDeFalla('tipo', ['pdf'], TX), 'Ese archivo no sirve aquí: aquí va un PDF.');
  assert.equal(S.textoDeFalla('tipo', ['png', 'jpg', 'webp'], TX), 'Ese archivo no sirve aquí: aquí va una imagen (PNG, JPG o WebP).');
  assert.equal(S.textoDeFalla('tipo', ['pdf', 'png', 'jpg', 'webp', 'svg'], TX), 'Ese archivo no sirve aquí: aquí va un PDF o una imagen (PNG, JPG, WebP o SVG).');
  assert.equal(S.textoDeFalla('tipo', ['svg'], TX), 'Ese archivo no sirve aquí: aquí va un SVG.');
  assert.equal(S.textoDeFalla('grande', ['pdf'], TX, 'pdf'), 'Ese archivo no sirve aquí: pesa más de 50 MB.');
  assert.equal(S.textoDeFalla('grande', ['png'], TX, 'png'), 'Ese archivo no sirve aquí: pesa más de 5 MB.');
  assert.equal(S.textoDeFalla('falso', ['png'], TX), 'Ese archivo no sirve aquí: no es lo que dice su nombre.');
  assert.equal(S.textoDeFalla('uno', ['png'], TX), TX.uno);
  assert.equal(S.textoDeEncima(['pdf'], TX), 'Suelta el PDF aquí');
  assert.equal(S.textoDeEncima(['png', 'jpg', 'webp'], TX), 'Suelta la imagen aquí');
  assert.equal(S.textoDeEncima(['svg'], TX), 'Suelta el SVG aquí');
  assert.equal(S.textoDeEncima(['pdf', 'png'], TX), 'Suelta el archivo aquí');
  /* Cada t.x de soltar.js y SoltarMesa existe; cada t.x de RecorteImagen existe en panel.recorte */
  for (const [f, de] of [['src/scripts/portal/panel/soltar.js', TX], ['src/scripts/portal/panel/dev/RecorteImagen.js', es.panel.recorte]]) {
    for (const m of leer(f).matchAll(/\bt\.([a-zA-Z]+)\b/g)) if (!['w', 'h'].includes(m[1])) assert.ok(m[1] in de, `${f}: t.${m[1]}`);
  }
  for (const m of leer('src/scripts/portal/panel/dev/taller/SoltarMesa.js').matchAll(/(?<!\.)\btx\.([a-zA-Z]+)\b/g)) assert.ok(m[1] in TX, `SoltarMesa: tx.${m[1]}`);
  assert.ok(typeof es.panel.taller.cambioSinGrupo === 'string', 'el aviso del Taller que usa «Cambiar el PDF»');
  for (const k of ['pdfSueltas', 'pdfPortada', 'pdfCambiar']) assert.ok(leer('src/scripts/portal/panel/dev/taller/SoltarMesa.js').includes(`'${k}'`), k);
});
await ok('el PDF soltado en la mesa: añadir o portada; «cambiar» solo sobre paginas de un PDF; nada si no se puede editar', () => {
  assert.deepEqual(S.opcionesDePdf({ editable: true }), ['sueltas', 'portada']);
  assert.deepEqual(S.opcionesDePdf({ editable: true, sobrePdf: true }), ['sueltas', 'portada', 'cambiar']);
  assert.deepEqual(S.opcionesDePdf({ editable: false, sobrePdf: true }), []);
  assert.deepEqual(S.opcionesDePdf(), []);
  const m = leer('src/scripts/portal/panel/dev/taller/SoltarMesa.js');
  /* Las acciones de siempre: traerPdf y el pedido de cambio del menu de la pagina (sus guardias), sin copiarlas */
  assert.match(m, /t\.traerPdf\(archivo, \{\}\)/);
  assert.match(m, /t\.traerPdf\(archivo, \{ portada: true \}\)/);
  assert.match(m, /mesa\.alPedirCambioPdf = \(\) => t\.traerPdf\(archivo, \{ cambiar: true \}\);\s*try \{ mesa\.pedirCambioPdf\(g\); \} finally \{ mesa\.alPedirCambioPdf = antes; \}/);
});

/* ---- 3b. Lo que pidieron las revisiones (2026-11-27) ---- */
await ok('conTipo: sin MIME (Windows), el archivo sale con el tipo de sus bytes ya revisados; con MIME, igual', async () => {
  const sin = archivo('lomo.png', '', FIRMA.png);
  const r = await S.revisarSoltado(sin, ['png']);
  assert.deepEqual(r, { ok: true, ext: 'png' });
  const con = S.conTipo(sin, r.ext);
  assert.equal(con.type, 'image/png');
  assert.equal(con.name, 'lomo.png');
  assert.equal(con.size, sin.size);
  const ya = archivo('a.pdf', 'application/pdf', FIRMA.pdf);
  assert.equal(S.conTipo(ya, 'pdf'), ya, 'con MIME no se toca');
  assert.equal(S.conTipo(sin, 'raro'), sin);
  assert.match(leer('src/scripts/portal/panel/soltar.js'), /await l\.alSoltar\(conTipo\(uno\.archivo, r\.ext\), e, r\.ext\)/);
});
await ok('la marca no parpadea: salir espera 60 ms y el dragover siguiente lo cancela (sin relatedTarget); listo dura 600 ms; un fallo al usar el archivo se dice', () => {
  const s = leer('src/scripts/portal/panel/soltar.js');
  const salirFn = s.slice(s.indexOf('const alSalir'), s.indexOf('const alSoltar'));
  assert.ok(!salirFn.includes('relatedTarget'), 'WebKit da null con archivos de fuera');
  assert.match(salirFn, /salir = setTimeout\(\(\) => marcar\(null\), 60\);/);
  assert.match(s, /const alPasar = \(e\) => \{\s*if \(!llevaArchivos\(e\.dataTransfer\) \|\| reclamados\.has\(e\)\) return;\s*clearTimeout\(salir\);/);
  assert.match(s, /setTimeout\(\(\) => listo\(false\), 600\)/);
  assert.match(s, /try \{ await l\.alSoltar\([^)]*\)[^}]*\} catch \(x\) \{ avisar\(tx\(\)\.fallo\); \}/);
  assert.ok(typeof TX.fallo === 'string' && TX.fallo.length);
});
await ok('la ventana de recorte: Ctrl/Cmd/Alt quedan para el navegador; la rueda acerca segun cuanto gira', () => {
  const r = leer('src/scripts/portal/panel/dev/RecorteImagen.js');
  assert.match(r, /teclas\(e\) \{[\s\S]{0,160}if \(e\.ctrlKey \|\| e\.metaKey \|\| e\.altKey\) return;/);
  assert.match(r, /Math\.pow\(PASO_ZOOM, giro\)/);
  assert.match(r, /Math\.max\(-1, Math\.min\(1, /);
});
await ok('Recursos (EditorLibro): una sola ventana de recorte a la vez, y una imagen enorme no se abre', () => {
  const src = leer('src/scripts/portal/panel/dev/EditorLibro.js');
  const rec = src.slice(src.indexOf('async recortarLomo()'), src.indexOf('get lx()'));
  assert.ok(rec.indexOf('this.recortando = true;') < rec.indexOf('await '), 'ocupado antes de la primera espera');
  assert.match(rec, /finally \{[\s\S]*?this\.recortando = false;/);
  assert.ok(rec.indexOf('medidaDeLomoAceptable(m)') < rec.indexOf('createImageBitmap'));
  const rev = src.slice(src.indexOf('async revisarLomo('), src.indexOf('async pintarLomo('));
  assert.ok(rev.indexOf('!medidaDeLomoAceptable(m)') < rev.indexOf('this.pintarLomo('), 'antes de dibujarla');
  assert.ok(typeof es.panel.dev.libros.lomoGrande === 'string');
});
await ok('LomoSubido: la imagen de antes se suelta al cerrar el «Lomo ▾» o al salir del libro', () => {
  const src = leer('src/scripts/portal/panel/dev/taller/LomoSubido.js');
  assert.match(src, /if \(plegable\.open\) this\.pintarIdeal\(\); else this\.soltarOriginal\(\);/);
  assert.match(src, /if \(mesa\.hidden\) this\.soltarOriginal\(\);/);
  assert.match(src, /soltarOriginal\(\) \{\s*if \(!this\.original \|\| this\.ocupado\) return;\s*this\.original = null;/);
});

/* ---- 4. Los 11 lugares, la guardia y lo que no se toca ---- */
await ok('la guardia de la ventana y los formularios se ponen en el panel; el Taller suma lo suyo al crearse', () => {
  const p = leer('src/scripts/portal/panel.js');
  assert.match(p, /guardiaDeVentana\(window\);\s*soltarEnFormularios\(raiz\);/);
  assert.match(p, /import\('\.\/panel\/dev\/taller\/SoltarMesa\.js'\)\.then\(\(s\) => s\.soltarEnMesa\(new m\.Taller\(raiz, ctx\)\)\)/);
  const s = leer('src/scripts/portal/panel/soltar.js');
  const guardia = s.slice(s.indexOf('export function guardiaDeVentana'), s.indexOf('export function soltarEn('));
  assert.match(guardia, /'dragover'[\s\S]*?e\.preventDefault\(\);\s*e\.dataTransfer\.dropEffect = 'none';/);
  assert.match(guardia, /'drop'[\s\S]*?if \(reclamado\(e\)\) return;\s*e\.preventDefault\(\);/);
});
await ok('los 11 lugares de subir reciben archivos soltados', () => {
  /* Formularios (1-5): todo «Elegir…» es .dev__elegir con su input.dev__archivo */
  const libro = leer('src/components/portal/dev/EditorLibro.astro');
  for (const n of ['lb-pdf', 'lb-lomo', 'v-pdf']) assert.match(libro, new RegExp(`<span class="dev__elegir"><input class="dev__archivo"[^>]*(id|data-id)="${n}"`), n);
  assert.match(leer('src/components/portal/dev/EditorCasa.astro'), /<span class="dev__elegir">\s*<input class="dev__archivo"/);
  assert.match(leer('src/scripts/portal/panel/dev/EditorBloques.js'), /el\('input', \{ clase: 'dev__archivo', type: 'file'[\s\S]{0,400}el\('span', \{ clase: 'dev__elegir' \}, \[input/);
  assert.match(leer('src/scripts/portal/panel/soltar.js'), /closest\('\.dev__elegir'\)/);
  /* El Taller (6-11) */
  const m = leer('src/scripts/portal/panel/dev/taller/SoltarMesa.js');
  for (const sel of ['[data-b-imagen]', '[data-b-pdf]', '[data-b-portada]', '[data-tal-indice-imagen]', '[data-cp-subir]', '[data-tal-panel]', '[data-tal-fondo]']) assert.ok(m.includes(`'${sel}'`), sel);
  assert.ok(m.includes('input[type="file"][accept=".svg,image/svg+xml"]'));
  assert.match(leer('src/scripts/portal/panel/dev/taller/Propiedades.js'), /archivo\.accept = '\.svg,image\/svg\+xml';/, 'el input del icono sigue igual');
  const ast = leer('src/components/portal/dev/Taller.astro');
  for (const a of ['data-b-imagen', 'data-b-pdf', 'data-b-portada', 'data-tal-indice-imagen', 'data-cp-subir', 'data-tal-panel', 'data-tal-fondo', 'data-tal-lomo-imagen']) assert.ok(ast.includes(a), a);
  assert.match(leer('src/scripts/portal/panel/dev/taller/LomoSubido.js'), /zonaDeSoltar\(this\.caja, \{/);
  /* Una imagen sobre el texto: handleDrop de Tiptap, el cursor donde cayo, y el camino del boton «Imagen» */
  const ed = leer('src/scripts/portal/panel/dev/taller/Editor.js');
  assert.match(ed, /handleDrop: \(vista, e, trozo, movido\) => soltarImagen\(vista, e, movido\)/);
  assert.match(ed, /if \(movido \|\| !vista\.editable/, 'mover dentro del libro sigue igual');
  assert.match(ed, /posAtCoords\(\{ left: e\.clientX, top: e\.clientY \}\)/);
  assert.match(m, /addEventListener\('tal-soltar-imagen'[\s\S]*?t\.subirImagen\(conTipo\(archivo, r\.ext\)\)/);
});
await ok('lo que no se toca: las miniaturas siguen solo con lo suyo; el texto del editor de bloques, igual', () => {
  const mi = leer('src/scripts/portal/panel/dev/taller/Miniaturas.js');
  assert.match(mi, /alPasar\(e\) \{\s*if \(!this\.arrastrado\) return;/);
  assert.match(mi, /alSoltar\(e\) \{\s*if \(!this\.arrastrado\) return;/);
  assert.match(leer('src/scripts/portal/panel/dev/EditorBloques.js'), /ed\.addEventListener\('drop', \(e\) => \{\s*e\.preventDefault\(\);\s*const texto = \(e\.dataTransfer && e\.dataTransfer\.getData\('text\/plain'\)\)/);
});
await ok('los archivos nuevos: sin almacenamiento del navegador, sin HTML a mano, sin escapes \\u de cuatro cifras', () => {
  const nuevos = ['src/scripts/portal/panel/soltar.js', 'src/scripts/portal/panel/dev/taller/SoltarMesa.js', 'src/scripts/portal/panel/dev/RecorteImagen.js',
    'src/scripts/contenido/taller/Recorte.js', 'src/styles/soltar.css', 'src/styles/recorte.css'];
  const prohibidas = ['local' + 'Storage', 'session' + 'Storage', 'inner' + 'HTML', 'insertAdjacent' + 'HTML'];
  const escape = new RegExp('\\\\u[0-9a-fA-F]{4}');
  for (const f of nuevos) {
    const t = leer(f);
    for (const p of prohibidas) assert.ok(!t.includes(p), `${f}: ${p}`);
    assert.ok(!escape.test(t), `${f}: escape \\u`);
  }
  const panel = leer('src/components/portal/Panel.astro');
  assert.ok(panel.includes("import '../../styles/soltar.css';") && panel.includes("import '../../styles/recorte.css';"));
});

console.log(`\n${bien} bien, ${mal} mal`);
if (mal) process.exit(1);
