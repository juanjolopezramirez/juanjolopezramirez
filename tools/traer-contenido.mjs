/* Trae lo PUBLICADO desde el panel (Developer-Mode) antes de armar la web:

     node tools/traer-contenido.mjs

   Lo corre GitHub al publicar (.github/workflows/astro.yml), ANTES de tools/books.py:
     1. lee de la base solo las filas con «publicado = true» (biblioteca, casas, etapas),
        con la clave PUBLICABLE (la misma que ya viaja dentro de la web);
     2. las pasa por las reglas de src/scripts/contenido/ (publicar.js): lo que no pasa,
        o se llama como algo que ya esta en el codigo, se queda fuera con un aviso;
     3. baja sus archivos: los PDF a books/<id>.<idioma>.pdf (books.py los convierte en
        paginas), los lomos a public/assets/lomos/ y las imagenes de las casas a
        public/assets/remoto/. Cada archivo tiene que SER lo que dice ser (sus primeros
        bytes) y no pasar de su tope; un destino nunca sale de books/ o public/, nunca
        pisa un archivo que ya existe y se arma solo con ids ya validados;
     4. escribe src/data/remoto/{biblioteca,casas,etapas}.js, que data/biblioteca.js,
        partners.js, projects.js y camino.js juntan con lo del codigo.

   SIN LAS VARIABLES de Supabase no hace nada: la web sale igual que siempre. FUERA DE
   GITHUB tampoco hace nada salvo con `--aqui` (para probarlo en local sin dejar datos
   de la base en la copia de trabajo por descuido).

   SI LA BASE NO CONTESTA, PARA (codigo 1): la web publicada sigue como estaba, sin
   perder lo que ya habia salido del panel. Un archivo que no baja deja fuera SOLO su
   libro o su casa. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

const TOPE_FILAS = 500;
const TOPE_BYTES = { pdf: 50 * 1024 * 1024, png: 8 * 1024 * 1024, jpg: 8 * 1024 * 1024, webp: 8 * 1024 * 1024 };
const ESPERA_MS = 30000;
const TOPE_TOTAL = 500 * 1024 * 1024;   // lo que puede bajar una publicacion entera

const enGithub = process.env.GITHUB_ACTIONS === 'true';
const aqui = process.argv.includes('--aqui');
if (!enGithub && !aqui) {
  console.log('[traer-contenido] fuera de GitHub no hago nada (usa --aqui para probarlo). La web sale con lo del codigo.');
  process.exit(0);
}

const E = await cargar('src/scripts/portal/estado.js');
const url = E.limpiarUrl(process.env.PUBLIC_SUPABASE_URL || '');
const clave = (process.env.PUBLIC_SUPABASE_ANON_KEY || '').trim();
const revision = E.revisarVariables(url, clave);
if (!revision.ok) { console.error('[traer-contenido] ' + revision.motivo); process.exit(1); }
if (revision.vacio) {
  console.log('[traer-contenido] sin Supabase: nada que traer. La web sale con lo del codigo.');
  process.exit(0);
}

const { createClient } = await import('@supabase/supabase-js');
const P = await cargar('src/scripts/contenido/publicar.js');
const AL = await cargar('src/scripts/contenido/Almacen.js');
const BIB = await cargar('src/data/biblioteca.js');
const PAR = await cargar('src/data/partners.js');
const PRO = await cargar('src/data/projects.js');
const CAM = await cargar('src/data/camino.js');

const sb = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
/* Una espera colgada no deja la publicacion parada para siempre; y el reloj se apaga al
   terminar (si no, el proceso esperaria a que sonara). */
function conTope(promesa) {
  let reloj;
  const tope = new Promise((_, no) => { reloj = setTimeout(() => no(new Error('tardo demasiado')), ESPERA_MS); });
  return Promise.race([promesa, tope]).finally(() => clearTimeout(reloj));
}

async function filas(tabla) {
  const { data, error } = await conTope(sb.from(tabla).select('*').eq('publicado', true).order('orden', { ascending: true }).limit(TOPE_FILAS));
  if (error) throw new Error(`${tabla}: ${error.message || error.code}`);
  return data || [];
}

let datos;
try {
  datos = { biblioteca: await filas('biblioteca'), casas: await filas('casas'), etapas: await filas('etapas') };
} catch (e) {
  console.error(`[traer-contenido] la base no contesto (${e.message}). Paro: la web publicada se queda como estaba.`);
  console.error('  Si el proyecto de Supabase esta en pausa, reanudalo en supabase.com y vuelve a publicar.');
  process.exitCode = 1;
}
if (datos) await publicar(datos);

async function publicar(datos) {

/* Lo que ya usa el codigo: un id repetido del panel se deja fuera */
const slugs = (lista) => lista.flatMap((e) => [e.id, e.slug].filter(Boolean));
const delCodigo = {
  libros: BIB.LIBROS_DEL_CODIGO.map((l) => l.id),
  casas: [...slugs(PAR.PARTNERS_DEL_CODIGO), ...slugs(PRO.PROJECTS_DEL_CODIGO)],
  etapas: CAM.ETAPAS_DEL_CODIGO.map((e) => e.id)
};
const pub = P.prepararPublicacion(datos, delCodigo);
for (const a of pub.avisos) console.warn('  ?  ' + a);

/* ---- Bajar los archivos ---------------------------------------------------------- */
const DENTRO = [path.join(raiz, 'books') + path.sep, path.join(raiz, 'public') + path.sep];
const medidas = {};
let gastado = 0;                     // bytes bajados en esta publicacion (tope: TOPE_TOTAL)
async function bajar(archivo, escritos) {
  const donde = AL.ubicacion(archivo.ruta);
  if (!donde) throw new Error(`ruta rara: ${archivo.ruta}`);
  const destino = path.resolve(raiz, archivo.destino);
  if (!DENTRO.some((d) => destino.startsWith(d))) throw new Error(`destino fuera de books/ o public/: ${archivo.destino}`);
  if (fs.existsSync(destino)) throw new Error(`ya existe ${archivo.destino} (no se pisa lo del codigo)`);
  const { data, error } = await conTope(sb.storage.from(donde.cajon).download(donde.nombre));
  if (error || !data) throw new Error(`no bajo ${archivo.ruta}: ${error ? error.message : 'vacio'}`);
  if (data.size > TOPE_BYTES[archivo.ext]) throw new Error(`${archivo.ruta} pesa ${data.size} bytes (tope ${TOPE_BYTES[archivo.ext]})`);
  if (gastado + data.size > TOPE_TOTAL) throw new Error(`con ${archivo.ruta} se pasaria del tope de ${TOPE_TOTAL} bytes por publicacion`);
  const bytes = new Uint8Array(await data.arrayBuffer());
  if (!AL.esDelFormato(bytes, archivo.ext)) throw new Error(`${archivo.ruta} no es un ${archivo.ext} de verdad`);
  if (archivo.ext !== 'pdf') medidas[archivo.ruta] = AL.medidasDeImagen(bytes, archivo.ext);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, bytes, { flag: 'wx' });
  gastado += data.size;
  escritos.push(destino);
}

/* Un libro o una casa sale solo si TODOS sus archivos bajaron; si uno falla, los que ya
   bajaron se borran (si no, books.py convertiria el PDF de un libro que se quedo fuera) */
async function conArchivos(lista, deQue, nombre) {
  const salen = [];
  for (const obj of lista) {
    const escritos = [];
    try {
      for (const a of deQue(obj)) await bajar(a, escritos);
      salen.push(obj);
    } catch (e) {
      for (const f of escritos) { try { fs.unlinkSync(f); } catch (x) { /* ya no esta */ } }
      console.warn(`  ?  ${nombre} «${obj.id}» se queda fuera: ${e.message}`);
    }
  }
  return salen;
}
const libros = await conArchivos(pub.libros, P.archivosDeLibro, 'el libro');
const casas = await conArchivos(pub.casas, P.archivosDeCasa, 'la casa');

/* ---- Escribir lo que lee la web ------------------------------------------------------ */
const escribir = (nombre, lista) => {
  const cuerpo = `/* LO PUBLICADO DESDE EL PANEL. Lo escribio tools/traer-contenido.mjs al publicar: NO SE EDITA A MANO. */\nexport default ${JSON.stringify(lista, null, 2)};\n`;
  fs.writeFileSync(path.join(raiz, 'src/data/remoto', nombre + '.js'), cuerpo);
};
escribir('biblioteca', libros.map(P.paraBiblioteca));
escribir('casas', casas.map((c) => P.paraCasa(c, medidas)));
escribir('etapas', pub.etapas.map(P.paraEtapa));
console.log(`[traer-contenido] listo: ${libros.length} libro(s), ${casas.length} casa(s), ${pub.etapas.length} etapa(s) del panel.`);
}
