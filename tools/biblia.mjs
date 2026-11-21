/* LAS DOS BIBLIAS DEL LECTOR, como datos quietos del sitio. Se corre UNA vez y lo que escribe se guarda en el repo:

     node tools/biblia.mjs <carpeta-de-descargas> [--bajar]

   Baja de eBible.org (fuente verificada) el formato «VPL» (un versiculo por linea, SOLO el texto: eBible ya quito notas,
   referencias cruzadas, titulos y formato) de:
     - Reina-Valera 1909 (spaRV1909)            dominio publico
     - World English Bible (eng-web)            dominio publico; «World English Bible» es marca de eBible.org:
                                                 el nombre solo vale si el texto NO se cambia (aqui no se cambia)
   Las descargas son datos NO confiables: van a su propia carpeta, se leen en memoria con un lector de zip propio (nunca
   se descomprime a disco ni se ejecuta nada de ahi) y cada linea se revisa antes de aceptarla.

   Escribe:
     public/biblia/<version>/indice.json      {nombre, licencia, fuente, sha256, libros:[{n, usfm, caps:[versos por capitulo]}]}
     public/biblia/<version>/NN-USFM.json     {c:"USFM", caps:[["versiculo 1", ...], ...]}
     src/scripts/biblia/versos.js             el mayor numero de versiculos de cada capitulo entre las dos versiones
                                               (lo usa el lector de referencias para validar «Juan 3:99»)
   Solo el canon protestante de 66 libros (se saltan los deuterocanonicos de la WEB).
   Versiculos vacios: los del FINAL de un capitulo son relleno del formato VPL (la RV1909 numera Job 38-41, Jonas 1-2, etc.
   a su manera) y se quitan; los de en medio son versiculos que la traduccion omite (WEB: Lc 17:36, Hch 8:37, 15:34,
   24:7) y se dejan como "" para no mover la numeracion. */
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const VERSIONES = [
  {
    id: 'rv1909',
    ebible: 'spaRV1909',
    nombre: 'Santa Biblia — Reina-Valera 1909',
    idioma: 'es',
    licencia: 'Dominio público (Public Domain), según eBible.org: «Santa Biblia — Reina Valera 1909. The Holy Bible in Spanish, Reina Valera translation of 1909. Public Domain.»',
    detalles: 'https://ebible.org/find/details.php?id=spaRV1909',
    sha256: 'f0b20b2473b3ed30dcee584b2311b6a1db27b32e714f1a2b0e97d01ba179f284'      // spaRV1909_vpl.zip, revisado 2026-11-20
  },
  {
    id: 'web',
    ebible: 'eng-web',
    nombre: 'World English Bible',
    idioma: 'en',
    licencia: 'The World English Bible is in the Public Domain. That means that it is not copyrighted. However, "World English Bible" is a Trademark of eBible.org. [...] All we ask is that if you CHANGE the actual text of the World English Bible in any way, you not call the result the World English Bible any more. (eBible.org) — Texto sin cambios: solo se separo por versiculo tal como lo entrega eBible.org en su formato VPL.',
    detalles: 'https://ebible.org/find/details.php?id=eng-web',
    sha256: '95e3998c29cdb4106c0bddf483af13c0bc8fe12a9fed474b5941dc167a912f61'      // eng-web_vpl.zip, revisado 2026-11-20
  }
];

/* Codigos de BibleWorks (los del VPL de eBible) → USFM. Orden canonico protestante: el numero del archivo sale de aqui. */
const CANON = [
  ['GEN', 'GEN'], ['EXO', 'EXO'], ['LEV', 'LEV'], ['NUM', 'NUM'], ['DEU', 'DEU'], ['JOS', 'JOS'], ['JDG', 'JDG'], ['RUT', 'RUT'],
  ['1SA', '1SA'], ['2SA', '2SA'], ['1KI', '1KI'], ['2KI', '2KI'], ['1CH', '1CH'], ['2CH', '2CH'], ['EZR', 'EZR'], ['NEH', 'NEH'],
  ['EST', 'EST'], ['JOB', 'JOB'], ['PSA', 'PSA'], ['PRO', 'PRO'], ['ECC', 'ECC'], ['SOL', 'SNG'], ['ISA', 'ISA'], ['JER', 'JER'],
  ['LAM', 'LAM'], ['EZE', 'EZK'], ['DAN', 'DAN'], ['HOS', 'HOS'], ['JOE', 'JOL'], ['AMO', 'AMO'], ['OBA', 'OBA'], ['JON', 'JON'],
  ['MIC', 'MIC'], ['NAH', 'NAM'], ['HAB', 'HAB'], ['ZEP', 'ZEP'], ['HAG', 'HAG'], ['ZEC', 'ZEC'], ['MAL', 'MAL'],
  ['MAT', 'MAT'], ['MAR', 'MRK'], ['LUK', 'LUK'], ['JOH', 'JHN'], ['ACT', 'ACT'], ['ROM', 'ROM'], ['1CO', '1CO'], ['2CO', '2CO'],
  ['GAL', 'GAL'], ['EPH', 'EPH'], ['PHI', 'PHP'], ['COL', 'COL'], ['1TH', '1TH'], ['2TH', '2TH'], ['1TI', '1TI'], ['2TI', '2TI'],
  ['TIT', 'TIT'], ['PHM', 'PHM'], ['HEB', 'HEB'], ['JAM', 'JAS'], ['1PE', '1PE'], ['2PE', '2PE'], ['1JO', '1JN'], ['2JO', '2JN'],
  ['3JO', '3JN'], ['JUD', 'JUD'], ['REV', 'REV']
];
const DE_BW = new Map(CANON.map(([bw, usfm], i) => [bw, { usfm, n: i + 1 }]));

const ZIP_MAX = 30 * 1024 * 1024;       // el zip
const TXT_MAX = 20 * 1024 * 1024;       // el .txt de dentro
const LIBRO_MAX = 600 * 1024;           // lo mismo que acepta src/scripts/biblia/cargar.js
const VERSO_MAX = 4000;                 // idem (libroValido)
const VERSOS_CAP_MAX = 200;             // idem
const INVISIBLES = String.fromCharCode(0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0x2028, 0x2029, 0xfeff);
const PROHIBIDO = new RegExp('[<>\\{}|*~^`]|[\x00-\x1f\x7f' + INVISIBLES + ']');

function fallar(msj) { console.error('\n  BIBLIA: ' + msj + '\n'); process.exit(1); }

/* ---- un lector de zip pequeno: directorio central, «stored» o «deflate», nada mas ---- */
function leerZip(buf, quiero) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('zip sin directorio central');
  const total = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let k = 0; k < total; k++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new Error('entrada de zip rota');
    const metodo = buf.readUInt16LE(p + 10);
    const comp = buf.readUInt32LE(p + 20);
    const tam = buf.readUInt32LE(p + 24);
    const ln = buf.readUInt16LE(p + 28), le = buf.readUInt16LE(p + 30), lc = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const nombre = buf.subarray(p + 46, p + 46 + ln).toString('utf8');
    p += 46 + ln + le + lc;
    if (nombre !== quiero) continue;
    if (tam > TXT_MAX) throw new Error(`${nombre} es demasiado grande (${tam})`);
    if (buf.readUInt32LE(local) !== 0x04034b50) throw new Error('cabecera local rota');
    const ini = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const datos = buf.subarray(ini, ini + comp);
    const salida = metodo === 0 ? Buffer.from(datos) : metodo === 8 ? inflateRawSync(datos, { maxOutputLength: TXT_MAX }) : null;
    if (!salida) throw new Error(`metodo de compresion ${metodo} no soportado`);
    if (salida.length !== tam) throw new Error(`${nombre}: tamano distinto al declarado`);
    return salida;
  }
  throw new Error(`${quiero} no esta en el zip`);
}

const huellaDe = (buf) => createHash('sha256').update(buf).digest('hex');

/* Lo ya bajado se reusa si su huella es la fijada; si no (o con --bajar) se baja otra vez y se vuelve a comprobar. */
async function bajar(url, destino, esperada, forzar) {
  if (!forzar && fs.existsSync(destino)) {
    const guardado = fs.readFileSync(destino);
    if (huellaDe(guardado) === esperada) return guardado;
  }
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  const final = new URL(r.url || url);
  if (final.protocol !== 'https:' || final.hostname !== 'ebible.org') throw new Error(`${url} termino en ${final.host}, no en ebible.org`);
  const largo = Number(r.headers.get('content-length') || 0);
  if (largo > ZIP_MAX) throw new Error(`${url} es demasiado grande`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > ZIP_MAX) throw new Error(`${url} es demasiado grande`);
  const h = huellaDe(buf);
  if (h !== esperada) throw new Error(`${url}: la huella cambio (${h}). eBible publico otra edicion: revisala y fija la nueva en VERSIONES.sha256.`);
  fs.writeFileSync(destino, buf);
  return buf;
}

function procesar(texto, v) {
  const libros = new Map();      // usfm → {n, caps: [[...]]}
  const lineas = texto.replace(new RegExp('^' + String.fromCharCode(0xfeff)), '').split(/\r?\n/);
  let vistas = 0;
  for (const linea of lineas) {
    if (!linea.trim()) continue;
    const m = /^([1-4A-Z]{3}) (\d{1,3}):(\d{1,3})(?: (.*))?$/.exec(linea);
    if (!m) throw new Error(`${v.id}: linea rara: ${JSON.stringify(linea.slice(0, 60))}`);
    const info = DE_BW.get(m[1]);
    if (!info) continue;                          // deuterocanonicos y otros: fuera
    const cap = Number(m[2]), ver = Number(m[3]);
    const t = (m[4] || '').replace(/[\s\xa0]+/g, ' ').trim();
    if (PROHIBIDO.test(t)) throw new Error(`${v.id} ${info.usfm} ${cap}:${ver}: caracter no permitido`);
    if (t.length > VERSO_MAX) throw new Error(`${v.id} ${info.usfm} ${cap}:${ver}: versiculo de mas de ${VERSO_MAX} letras`);
    if (ver > VERSOS_CAP_MAX) throw new Error(`${v.id} ${info.usfm} ${cap}: mas de ${VERSOS_CAP_MAX} versiculos`);
    if (!libros.has(info.usfm)) libros.set(info.usfm, { n: info.n, caps: [] });
    const lib = libros.get(info.usfm);
    if (cap !== lib.caps.length && cap !== lib.caps.length + 1) throw new Error(`${v.id} ${info.usfm}: capitulo ${cap} fuera de orden`);
    if (cap === lib.caps.length + 1) lib.caps.push([]);
    const c = lib.caps[cap - 1];
    if (ver !== c.length + 1) throw new Error(`${v.id} ${info.usfm} ${cap}: versiculo ${ver} fuera de orden`);
    c.push(t);
    vistas++;
  }
  if (libros.size !== 66) throw new Error(`${v.id}: ${libros.size} libros (se esperaban 66)`);
  const omitidos = [];
  for (const [usfm, lib] of libros) {
    lib.caps.forEach((c, i) => {
      while (c.length && c[c.length - 1] === '') c.pop();      // relleno del VPL al final del capitulo
      if (!c.length) throw new Error(`${v.id} ${usfm} ${i + 1}: capitulo vacio`);
      c.forEach((t, j) => { if (t === '') omitidos.push(`${usfm}.${i + 1}.${j + 1}`); });
    });
  }
  return { libros, omitidos, vistas };
}

const args = process.argv.slice(2);
const carpeta = args.find((a) => !a.startsWith('--'));
const forzar = args.includes('--bajar');
if (!carpeta) fallar('falta la carpeta de descargas: node tools/biblia.mjs <carpeta> [--bajar]');
const fuentes = path.resolve(carpeta);
if (fuentes.startsWith(raiz + path.sep) || fuentes === raiz) fallar('la carpeta de descargas no puede estar dentro del proyecto');

/* 1) Bajar (o reusar) y revisar LAS DOS versiones en memoria. Nada se borra ni se escribe si una falla. */
const listas = [];
for (const v of VERSIONES) {
  const url = `https://ebible.org/Scriptures/${v.ebible}_vpl.zip`;
  const dir = path.join(fuentes, v.ebible);
  fs.mkdirSync(dir, { recursive: true });
  let zip, res;
  try { zip = await bajar(url, path.join(dir, `${v.ebible}_vpl.zip`), v.sha256, forzar); } catch (e) { fallar(e.message); }
  try { res = procesar(leerZip(zip, `${v.ebible}_vpl.txt`).toString('utf8'), v); } catch (e) { fallar(e.message); }
  const archivos = [];
  const cuenta = {};
  for (const [usfm, lib] of [...res.libros].sort((a, b) => a[1].n - b[1].n)) {
    const archivo = `${String(lib.n).padStart(2, '0')}-${usfm}.json`;
    const json = JSON.stringify({ c: usfm, caps: lib.caps });
    if (Buffer.byteLength(json) > LIBRO_MAX) fallar(`${v.id}/${archivo} pasa de ${LIBRO_MAX} bytes`);
    archivos.push({ archivo, json, n: lib.n, usfm, caps: lib.caps.map((c) => c.length) });
    cuenta[usfm] = lib.caps.map((c) => c.length);
  }
  listas.push({ v, url, sha256: v.sha256, res, archivos, cuenta });
}
const [a, b] = listas;
for (const [, usfm] of CANON) {
  if (a.cuenta[usfm].length !== b.cuenta[usfm].length) fallar(`${usfm}: las versiones no tienen los mismos capitulos (${a.cuenta[usfm].length} / ${b.cuenta[usfm].length})`);
}

/* 2) Todo bien: ahora si se reemplaza public/biblia/<version>/ y versos.js. */
const resumen = [];
for (const { v, url, sha256, res, archivos } of listas) {
  const salida = path.join(raiz, 'public', 'biblia', v.id);
  fs.rmSync(salida, { recursive: true, force: true });
  fs.mkdirSync(salida, { recursive: true });
  let bytes = 0, mayor = { archivo: '', bytes: 0 }, versos = 0;
  for (const f of archivos) {
    fs.writeFileSync(path.join(salida, f.archivo), f.json);
    const n = Buffer.byteLength(f.json);
    bytes += n; versos += f.caps.reduce((s, x) => s + x, 0);
    if (n > mayor.bytes) mayor = { archivo: f.archivo, bytes: n };
  }
  const indice = {
    nombre: v.nombre,
    idioma: v.idioma,
    licencia: v.licencia,
    fuente: { url, detalles: v.detalles, formato: 'eBible.org VPL (texto biblico solamente)', revisado: '2026-11-20' },
    sha256,
    omitidos: res.omitidos,
    libros: archivos.map((f) => ({ n: f.n, usfm: f.usfm, caps: f.caps }))
  };
  fs.writeFileSync(path.join(salida, 'indice.json'), JSON.stringify(indice, null, 1));
  resumen.push(`${v.id}: ${versos} versiculos, ${res.omitidos.length} omitidos (${res.omitidos.join(', ') || '-'}), ${(bytes / 1024).toFixed(0)} KB, el mayor ${mayor.archivo} ${(mayor.bytes / 1024).toFixed(0)} KB, sha256 ${sha256}`);
}

/* versos.js: el mayor de las dos (VERSOS) y, por version, solo los capitulos donde esa version tiene MENOS. */
const maximos = Object.fromEntries(CANON.map(([, usfm]) => [usfm, a.cuenta[usfm].map((x, i) => Math.max(x, b.cuenta[usfm][i]))]));
const menos = (l) => {
  const filas = [];
  for (const [, usfm] of CANON) {
    const d = l.cuenta[usfm].map((x, i) => (x < maximos[usfm][i] ? `${i + 1}: ${x}` : null)).filter(Boolean);
    if (d.length) filas.push(`    '${usfm}': { ${d.join(', ')} }`);
  }
  return `  ${l.v.id}: {\n${filas.join(',\n')}\n  }`;
};
const js = `/* GENERADO por tools/biblia.mjs — no se edita a mano. Para cada libro (USFM), cuantos versiculos tiene cada capitulo:
   VERSOS es el MAYOR entre la Reina-Valera 1909 y la World English Bible (la numeracion cambia en algunos capitulos,
   p. ej. Jonas 1-2 o Job 38-41): sirve para rechazar «Juan 3:99» sin bajar ningun libro.
   MENOS dice, por version, los capitulos donde ESA version tiene menos versiculos que VERSOS (capitulo: versiculos). */
export const VERSOS = {
${CANON.map(([, usfm]) => `  '${usfm}': [${maximos[usfm].join(',')}]`).join(',\n')}
};

export const MENOS = {
${listas.map(menos).join(',\n')}
};
`;
fs.mkdirSync(path.join(raiz, 'src', 'scripts', 'biblia'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'src', 'scripts', 'biblia', 'versos.js'), js);
console.log(resumen.join('\n'));
