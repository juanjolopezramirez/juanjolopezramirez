/* LOS ENLACES CORTOS DE LOS LIBROS: https://juanjolopezramirez.com/<id>

   Solo se usa al compilar (lee el disco): lo piden las dos paginas de pages/[book]/ —la del libro
   (index.astro) y la portada liviana (portada.jpg.js)— y nadie mas. Las cuentas puras (la lista de
   nombres reservados, la direccion, la vista previa) viven en scripts/biblioteca.js, con su prueba en Node.

   DE DONDE SALEN LOS LIBROS. De la misma lista que pinta la estanteria (data/biblioteca.js → LIBROS: los del
   codigo y los que el fundador publico desde el panel, ya traidos por tools/traer-contenido.mjs antes de
   `astro build`). Un libro que no se puede abrir en ningun idioma no sale en la estanteria y tampoco tiene
   pagina corta.

   COLISIONES. Un libro nunca le quita una direccion al sitio. Ademas de la lista RESERVADA (scripts/biblioteca.js),
   aqui se mira lo que HAY de verdad en la raiz —public/ y src/pages/—, y si un id choca la compilacion se para
   con una frase clara (comprobarRutas).

   LA PORTADA DE LA VISTA PREVIA. La primera pagina del PDF a 900 px. WhatsApp no pinta miniaturas de mas de
   ~300 KB: si la portada pesa mas que OG_MAX_BYTES se arma una mas liviana al compilar (pages/[book]/portada.jpg.js,
   con `sharp`, que ya trae Astro) y es la que se ofrece. Un libro sin PDF usa la foto de siempre (OG_RESPALDO). */
import fs from 'node:fs';
import path from 'node:path';
import { LIBROS, TIPOS } from './biblioteca.js';
import { BOOKS } from './books.js';
import { TERMS } from '../i18n/terms.js';
import { GLOSS, CARDS } from '../i18n/term-cards.js';
import { fichaLibro, comprobarRutas, portadaDeLibro, ogDeLibro, OG_MAX_BYTES, OG_RESPALDO } from '../scripts/biblioteca.js';

/* Ancho de la portada liviana: de sobra para una miniatura y por encima de los 600 px que piden las redes */
export const ANCHO_LIVIANA = 700;

/* Los nombres que ya viven en la raiz: lo de public/ y las paginas de src/pages, sin extension y sin las
   rutas dinamicas ([lang]). «sitemap.xml.js» da «sitemap»; «CNAME» da «cname». */
export function nombresDeLaRaiz(raiz = process.cwd()) {
  const salida = new Set();
  for (const carpeta of ['public', path.join('src', 'pages')]) {
    let entradas = [];
    try { entradas = fs.readdirSync(path.join(raiz, carpeta)); } catch (e) { /* sin esa carpeta */ }
    /* Sin los archivos ocultos (.gitkeep…) ni las rutas dinamicas ([lang], [book]) */
    for (const e of entradas) if (!e.startsWith('[') && !e.startsWith('.')) salida.add(e.split('.')[0].toLowerCase());
  }
  return [...salida];
}

let guardado = null;

/* [{ id, og, destino, liviana }] de todos los libros con enlace corto. `origen` es el dominio del sitio
   (Astro.site). `liviana` es el archivo de la portada pesada que hay que aligerar, o null. */
export function enlacesDeLibros(origen, raiz = process.cwd()) {
  const clave = `${origen}|${raiz}`;
  if (guardado && guardado.clave === clave) return guardado.lista;

  /* Una sola ficha por libro; el que no se puede abrir en ningun idioma (null) no tiene pagina */
  const abribles = LIBROS.map((libro) => ({ libro, f: fichaLibro(libro, 'es', { BOOKS, TIPOS, TERMS, GLOSS }, '/') })).filter((x) => x.f);
  comprobarRutas(abribles.map((x) => x.libro.id), nombresDeLaRaiz(raiz));

  const lista = abribles.map(({ libro, f }) => {
    let imagen = OG_RESPALDO;
    let liviana = null;
    const portada = portadaDeLibro(libro, BOOKS, 'es');
    if (portada) {
      const archivo = path.join(raiz, 'public', portada.ruta);
      let peso = -1;
      try { peso = fs.statSync(archivo).size; } catch (e) { /* la imagen no esta: se usa la de siempre */ }
      if (peso < 0) console.warn(`[enlaces] «${libro.id}»: no encuentro ${portada.ruta}; su vista previa usa la foto de siempre.`);
      else if (peso <= OG_MAX_BYTES) imagen = portada;
      else {
        imagen = { ruta: `${libro.id}/portada.jpg`, ancho: ANCHO_LIVIANA, alto: Math.round(ANCHO_LIVIANA * portada.alto / portada.ancho), v: portada.v };
        liviana = archivo;
      }
    }
    const resumen = libro.glosario && CARDS[libro.id] && CARDS[libro.id].now ? CARDS[libro.id].now.es || '' : '';
    const og = ogDeLibro({ id: libro.id, titulo: f.titulo, glosa: f.glosa, resumen, idioma: f.idioma, origen, imagen });
    if (!og) throw new Error(`No pude armar la vista previa del libro «${libro.id}» (¿el dominio del sitio, \`site\` en astro.config.mjs?).`);
    return { id: libro.id, og, destino: `/es/writing/#${libro.id}`, liviana };
  });
  guardado = { clave, lista };
  return lista;
}

/* Aligerar una portada pesada: ANCHO_LIVIANA px de ancho y la calidad baja hasta que quepa en `max` bytes.
   `sharp` no esta en package.json (Astro lo trae como dependencia opcional): si no carga, NO falla; avisa en el
   registro de la compilacion y se queda con la imagen original. `cargarSharp` solo existe para probar esa rama. */
export async function aligerar(original, { ancho = ANCHO_LIVIANA, max = OG_MAX_BYTES, cargarSharp = () => import('sharp') } = {}) {
  let sharp;
  try {
    sharp = (await cargarSharp()).default;
    if (typeof sharp !== 'function') throw new Error('sin funcion');
  } catch (e) {
    console.warn('[enlaces] `sharp` no carga: la portada de la vista previa se sirve sin aligerar (puede pesar mas de 300 KB y WhatsApp no la pintaria). Instala `sharp` o usa una portada mas liviana.');
    return { buffer: original, aligerada: false };
  }
  let salida = original;
  for (const calidad of [78, 68, 58, 48, 38]) {
    salida = await sharp(original).resize({ width: ancho, withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: calidad, mozjpeg: true }).toBuffer();
    if (salida.length <= max) break;
  }
  return { buffer: salida, aligerada: true };
}
