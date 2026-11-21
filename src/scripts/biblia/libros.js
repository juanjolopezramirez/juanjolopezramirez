/* LOS 66 LIBROS (canon protestante), puro y sin dependencias del navegador.
   Cada libro: codigo USFM, numero canonico (1-66, el del archivo NN-USFM.json), capitulos, nombre en espanol y en ingles
   y sus abreviaturas. Los libros numerados (1 Samuel, 2 Corintios, 3 Juan...) guardan el TRONCO («samuel», «co», «juan»)
   y su numero: el ordinal se lee aparte (1, I, 1ra, 1a, 1.ª, Primera, Primero, 1st, First... y «1 de Juan»).
   Las abreviaturas se escriben SIN tildes y en minuscula: el lector compara contra el texto ya «aplanado» (plano()).
   Choques conocidos, resueltos aqui a proposito:
     Jn = Juan · 1 Jn = 1 Juan          Fil = Filipenses · Flm = Filemon      Jue = Jueces · Jud = Judas
     Ez = Ezequiel · Esd = Esdras       Job (palabra inglesa: ver COMUNES)     Sal / Salmo / Salmos
     Cantares / Cantar de los Cantares / Song of Songs / Song of Solomon       Apocalipsis / Revelation(s)
   Cuantos versiculos tiene cada capitulo sale de los datos: ./versos.js (generado por tools/biblia.mjs). */
import { VERSOS, MENOS } from './versos.js';

/* [usfm, capitulos, espanol, ingles, troncos es, troncos en, numero (si es libro numerado)] */
const TABLA = [
  ['GEN', 50, 'Génesis', 'Genesis', ['genesis', 'gen', 'gn', 'ge'], ['genesis', 'gen', 'gn', 'ge']],
  ['EXO', 40, 'Éxodo', 'Exodus', ['exodo', 'ex', 'exo', 'exod'], ['exodus', 'exod', 'exo', 'ex']],
  ['LEV', 27, 'Levítico', 'Leviticus', ['levitico', 'lev', 'lv'], ['leviticus', 'lev', 'lv']],
  ['NUM', 36, 'Números', 'Numbers', ['numeros', 'num', 'nm'], ['numbers', 'num', 'nm', 'nu', 'nb']],
  ['DEU', 34, 'Deuteronomio', 'Deuteronomy', ['deuteronomio', 'deut', 'deu', 'dt'], ['deuteronomy', 'deut', 'deu', 'dt']],
  ['JOS', 24, 'Josué', 'Joshua', ['josue', 'jos'], ['joshua', 'josh', 'jos', 'jsh']],
  ['JDG', 21, 'Jueces', 'Judges', ['jueces', 'jue', 'jc'], ['judges', 'judg', 'jdg', 'jg']],
  ['RUT', 4, 'Rut', 'Ruth', ['rut', 'rt'], ['ruth', 'rth', 'ru']],
  ['1SA', 31, '1 Samuel', '1 Samuel', ['samuel', 'sam', 's', 'sa'], ['samuel', 'sam', 'sa', 'sm'], 1],
  ['2SA', 24, '2 Samuel', '2 Samuel', ['samuel', 'sam', 's', 'sa'], ['samuel', 'sam', 'sa', 'sm'], 2],
  ['1KI', 22, '1 Reyes', '1 Kings', ['reyes', 'rey', 're', 'r'], ['kings', 'kgs', 'ki', 'kin'], 1],
  ['2KI', 25, '2 Reyes', '2 Kings', ['reyes', 'rey', 're', 'r'], ['kings', 'kgs', 'ki', 'kin'], 2],
  ['1CH', 29, '1 Crónicas', '1 Chronicles', ['cronicas', 'cron', 'cro', 'cr'], ['chronicles', 'chron', 'chr', 'ch'], 1],
  ['2CH', 36, '2 Crónicas', '2 Chronicles', ['cronicas', 'cron', 'cro', 'cr'], ['chronicles', 'chron', 'chr', 'ch'], 2],
  ['EZR', 10, 'Esdras', 'Ezra', ['esdras', 'esd'], ['ezra', 'ezr']],
  ['NEH', 13, 'Nehemías', 'Nehemiah', ['nehemias', 'neh', 'ne'], ['nehemiah', 'neh', 'ne']],
  ['EST', 10, 'Ester', 'Esther', ['ester', 'est'], ['esther', 'esth', 'est']],
  ['JOB', 42, 'Job', 'Job', ['job', 'jb'], ['job', 'jb']],
  ['PSA', 150, 'Salmos', 'Psalms', ['salmos', 'salmo', 'sal', 'sl'], ['psalms', 'psalm', 'psa', 'pss', 'psm', 'ps']],
  ['PRO', 31, 'Proverbios', 'Proverbs', ['proverbios', 'prov', 'pro', 'pr'], ['proverbs', 'prov', 'pro', 'prv', 'pr']],
  ['ECC', 12, 'Eclesiastés', 'Ecclesiastes', ['eclesiastes', 'ecles', 'ecl', 'ec'], ['ecclesiastes', 'eccles', 'eccl', 'ecc', 'qoh']],
  ['SNG', 8, 'Cantares', 'Song of Songs', ['cantar de los cantares', 'cantares', 'cantar', 'cant', 'cnt', 'ct'], ['song of songs', 'song of solomon', 'canticles', 'song', 'sng', 'sos', 'cant']],
  ['ISA', 66, 'Isaías', 'Isaiah', ['isaias', 'isa', 'is'], ['isaiah', 'isa', 'is']],
  ['JER', 52, 'Jeremías', 'Jeremiah', ['jeremias', 'jer', 'jr'], ['jeremiah', 'jer', 'jr']],
  ['LAM', 5, 'Lamentaciones', 'Lamentations', ['lamentaciones', 'lam', 'lm'], ['lamentations', 'lam']],
  ['EZK', 48, 'Ezequiel', 'Ezekiel', ['ezequiel', 'ezeq', 'eze', 'ez'], ['ezekiel', 'ezek', 'eze', 'ezk']],
  ['DAN', 12, 'Daniel', 'Daniel', ['daniel', 'dan', 'dn'], ['daniel', 'dan', 'dn']],
  ['HOS', 14, 'Oseas', 'Hosea', ['oseas', 'os'], ['hosea', 'hos']],
  ['JOL', 3, 'Joel', 'Joel', ['joel', 'jl'], ['joel', 'jl']],
  ['AMO', 9, 'Amós', 'Amos', ['amos', 'am'], ['amos', 'am']],
  ['OBA', 1, 'Abdías', 'Obadiah', ['abdias', 'abd'], ['obadiah', 'obad', 'oba', 'ob']],
  ['JON', 4, 'Jonás', 'Jonah', ['jonas', 'jon'], ['jonah', 'jon', 'jnh']],
  ['MIC', 7, 'Miqueas', 'Micah', ['miqueas', 'miq', 'mi'], ['micah', 'mic']],
  ['NAM', 3, 'Nahúm', 'Nahum', ['nahum', 'nah'], ['nahum', 'nah']],
  ['HAB', 3, 'Habacuc', 'Habakkuk', ['habacuc', 'hab'], ['habakkuk', 'hab']],
  ['ZEP', 3, 'Sofonías', 'Zephaniah', ['sofonias', 'sof'], ['zephaniah', 'zeph', 'zep']],
  ['HAG', 2, 'Hageo', 'Haggai', ['hageo', 'hag', 'ag'], ['haggai', 'hag']],
  ['ZEC', 14, 'Zacarías', 'Zechariah', ['zacarias', 'zac'], ['zechariah', 'zech', 'zec']],
  ['MAL', 4, 'Malaquías', 'Malachi', ['malaquias', 'mal'], ['malachi', 'mal']],
  ['MAT', 28, 'Mateo', 'Matthew', ['mateo', 'mat', 'mt'], ['matthew', 'matt', 'mat', 'mt']],
  ['MRK', 16, 'Marcos', 'Mark', ['marcos', 'mar', 'mc', 'mr'], ['mark', 'mrk', 'mk', 'mr']],
  ['LUK', 24, 'Lucas', 'Luke', ['lucas', 'luc', 'lc'], ['luke', 'luk', 'lk']],
  ['JHN', 21, 'Juan', 'John', ['juan', 'jn'], ['john', 'jhn', 'jn']],
  ['ACT', 28, 'Hechos', 'Acts', ['hechos de los apostoles', 'hechos', 'hech', 'hch'], ['acts of the apostles', 'acts', 'act']],
  ['ROM', 16, 'Romanos', 'Romans', ['romanos', 'rom', 'ro'], ['romans', 'rom', 'ro', 'rm']],
  ['1CO', 16, '1 Corintios', '1 Corinthians', ['corintios', 'cor', 'co'], ['corinthians', 'cor', 'co'], 1],
  ['2CO', 13, '2 Corintios', '2 Corinthians', ['corintios', 'cor', 'co'], ['corinthians', 'cor', 'co'], 2],
  ['GAL', 6, 'Gálatas', 'Galatians', ['galatas', 'gal', 'ga'], ['galatians', 'gal', 'ga']],
  ['EPH', 6, 'Efesios', 'Ephesians', ['efesios', 'efe', 'ef'], ['ephesians', 'eph']],
  ['PHP', 4, 'Filipenses', 'Philippians', ['filipenses', 'fil', 'flp'], ['philippians', 'phil', 'php']],
  ['COL', 4, 'Colosenses', 'Colossians', ['colosenses', 'col'], ['colossians', 'col']],
  ['1TH', 5, '1 Tesalonicenses', '1 Thessalonians', ['tesalonicenses', 'tes', 'ts'], ['thessalonians', 'thess', 'thes', 'th'], 1],
  ['2TH', 3, '2 Tesalonicenses', '2 Thessalonians', ['tesalonicenses', 'tes', 'ts'], ['thessalonians', 'thess', 'thes', 'th'], 2],
  ['1TI', 6, '1 Timoteo', '1 Timothy', ['timoteo', 'tim', 'ti'], ['timothy', 'tim', 'ti', 'tm'], 1],
  ['2TI', 4, '2 Timoteo', '2 Timothy', ['timoteo', 'tim', 'ti'], ['timothy', 'tim', 'ti', 'tm'], 2],
  ['TIT', 3, 'Tito', 'Titus', ['tito', 'tit'], ['titus', 'tit']],
  ['PHM', 1, 'Filemón', 'Philemon', ['filemon', 'filem', 'flm'], ['philemon', 'philem', 'phlm', 'phm']],
  ['HEB', 13, 'Hebreos', 'Hebrews', ['hebreos', 'heb', 'he'], ['hebrews', 'heb']],
  ['JAS', 5, 'Santiago', 'James', ['santiago', 'sant', 'stg'], ['james', 'jas', 'jam', 'jm']],
  ['1PE', 5, '1 Pedro', '1 Peter', ['pedro', 'ped', 'pe', 'p'], ['peter', 'pet', 'pe', 'pt'], 1],
  ['2PE', 3, '2 Pedro', '2 Peter', ['pedro', 'ped', 'pe', 'p'], ['peter', 'pet', 'pe', 'pt'], 2],
  ['1JN', 5, '1 Juan', '1 John', ['juan', 'jn'], ['john', 'jhn', 'jn'], 1],
  ['2JN', 1, '2 Juan', '2 John', ['juan', 'jn'], ['john', 'jhn', 'jn'], 2],
  ['3JN', 1, '3 Juan', '3 John', ['juan', 'jn'], ['john', 'jhn', 'jn'], 3],
  ['JUD', 1, 'Judas', 'Jude', ['judas', 'jud', 'jds'], ['jude', 'jud', 'jd']],
  ['REV', 22, 'Apocalipsis', 'Revelation', ['apocalipsis', 'apoc', 'ap'], ['revelation', 'revelations', 'apocalypse', 'rev']]
];

export const LIBROS = Object.freeze(TABLA.map(([usfm, caps, es, en, aliasEs, aliasEn, num], i) => Object.freeze({
  n: i + 1, usfm, caps, es, en, num: num || null, alias: Object.freeze({ es: Object.freeze(aliasEs), en: Object.freeze(aliasEn) })
})));
const POR_USFM = new Map(LIBROS.map((l) => [l.usfm, l]));

export const libroDe = (usfm) => POR_USFM.get(usfm) || null;

/* Nombre para mostrar. Un solo salmo es «Salmo 23» / «Psalm 23»; varios, «Salmos 23-24». */
export function nombreLibro(usfm, idioma = 'es', singular = false) {
  const l = libroDe(usfm);
  if (!l) return null;
  const en = idioma === 'en';
  if (usfm === 'PSA' && singular) return en ? 'Psalm' : 'Salmo';
  return en ? l.en : l.es;
}

/* Versiculos del capitulo `cap` (el mayor entre las dos versiones del sitio), o 0 si no existe. */
export function versosDe(usfm, cap) {
  const l = libroDe(usfm);
  if (!l || !Number.isInteger(cap) || cap < 1 || cap > l.caps) return 0;
  return (VERSOS[usfm] && VERSOS[usfm][cap - 1]) || 0;
}

/* Versiculos del capitulo en UNA version ('rv1909' | 'web'); 0 si no existe o la version no es del sitio. */
export function versosEn(usfm, cap, version) {
  const max = versosDe(usfm, cap);
  if (!max || !Object.prototype.hasOwnProperty.call(MENOS, version)) return 0;
  const menos = MENOS[version][usfm];
  return (menos && menos[cap]) || max;
}

/* Minusculas y sin tildes, CARACTER A CARACTER: el resultado mide lo mismo que la entrada, asi los desplazamientos
   (desde/hasta) que se encuentran en el texto aplanado valen tal cual en el original. */
const cache = new Map();
function letraPlana(c) {
  let r = cache.get(c);
  if (r !== undefined) return r;
  const sin = c.normalize('NFD').replace(/\p{M}+/gu, '');
  const baja = (sin || c).toLowerCase();
  r = baja.length === 1 ? baja : c.length === 1 ? (c.toLowerCase().length === 1 ? c.toLowerCase() : c) : c;
  if (cache.size < 4096) cache.set(c, r);
  return r;
}
export function plano(texto) {
  const s = String(texto);
  let o = '';
  for (let i = 0; i < s.length; i++) o += letraPlana(s[i]);
  return o;
}

/* Tronco → libros, por idioma. buscarLibro(numero|null, tronco, idioma) prefiere el idioma pedido y, si alli no
   existe, prueba el otro (un texto en espanol puede citar «John 3:16»). */
const INDICE = { es: new Map(), en: new Map() };
for (const l of LIBROS) {
  for (const idioma of ['es', 'en']) {
    for (const a of l.alias[idioma]) {
      if (!INDICE[idioma].has(a)) INDICE[idioma].set(a, []);
      INDICE[idioma].get(a).push(l);
    }
  }
}
export function buscarLibro(num, tronco, idioma = 'es') {
  const t = plano(tronco).replace(/\s+/g, ' ').replace(/\.$/, '').trim();
  const orden = idioma === 'en' ? ['en', 'es'] : ['es', 'en'];
  for (const i of orden) {
    const hit = (INDICE[i].get(t) || []).find((l) => l.num === (num || null));
    if (hit) return hit;
  }
  return null;
}

/* Todos los troncos (ambos idiomas), del mas largo al mas corto: el lector arma con ellos su expresion. */
export const TRONCOS = Object.freeze([...new Set([...INDICE.es.keys(), ...INDICE.en.keys()])].sort((a, b) => b.length - a.length || (a < b ? -1 : 1)));

/* Abreviaturas que tambien son palabras comunes. Leyendo texto corrido (auto:true) solo cuentan con «capitulo:versiculo»
   («Sal 23:1» si; «sal 2 cucharadas» o «Job 3» en ingles no). Las minusculas ya se descartan aparte en ese modo. */
export const COMUNES = Object.freeze({
  es: Object.freeze(new Set(['sal', 'os', 'mal', 'hab', 'mi', 'he', 'col', 'mar', 'ex', 'am', 'est', 'ap', 'ag', 'is', 'cant'])),
  en: Object.freeze(new Set(['is', 'am', 'job', 'ex', 'song', 'act', 'mal', 'col', 'pro', 'hab', 'gen', 'jam', 'dan', 'mark']))
});

/* Ordinales en palabra (el resto, 1/1ra/1a/1.ª/1st/I/II/III, lo lee la expresion de referencias.js). */
export const ORDINALES = Object.freeze({
  primera: 1, primero: 1, primer: 1, first: 1,
  segunda: 2, segundo: 2, second: 2,
  tercera: 3, tercero: 3, tercer: 3, third: 3,
  i: 1, ii: 2, iii: 3
});
