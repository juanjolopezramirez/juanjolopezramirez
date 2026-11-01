/* LA PUERTA DE LOS BLOQUES DEL LIBRO. Cada tipo trae cinco partes (datos, web, PDF, editor y
   pruebas) o la compilacion se para. Asi las «mil cosas» que vienen no quedan a medias: un bloque
   que se ve en el editor pero no sale en el PDF no llega a publicarse.

   Corre desde astro.config.mjs (dev y build) y desde tools/test-taller.mjs. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUXILIARES = new Set(['indice.js', 'ayuda.js', 'objetos.js']);

export async function revisarTiposTaller(dir = raiz, casosDe = null, tiposDe = null) {
  const { TIPOS } = tiposDe || await import(new URL('../src/scripts/contenido/taller/tipos/indice.js', import.meta.url));
  const { CASOS } = casosDe || await import(new URL('./pruebas-taller.mjs', import.meta.url));
  const { limpiarContenido, aNodos } = await import(new URL('../src/scripts/contenido/taller/TextoLibro.js', import.meta.url));
  const carpeta = join(dir, 'src/scripts/contenido/taller/tipos');
  const archivos = readdirSync(carpeta).filter((f) => f.endsWith('.js') && !AUXILIARES.has(f)).map((f) => f.replace('.js', ''));
  const nombres = TIPOS.map((t) => t.tipo);
  const fallos = [];
  for (const f of archivos) if (!nombres.includes(f)) fallos.push(`tipos/${f}.js no esta en tipos/indice.js`);
  for (const t of TIPOS) {
    for (const k of ['tipo', 'nodos', 'contextos', 'contiene', 'editor', 'datos', 'web', 'pdf']) {
      if (t[k] === undefined) fallos.push(`${t.tipo}: le falta «${k}»`);
    }
    if (t.editor !== 'starter-kit') {
      const f = join(dir, 'src/scripts/portal/panel/dev/taller/nodos', `${t.editor}.js`);
      if (!existsSync(f)) fallos.push(`${t.tipo}: falta su parte de editor (nodos/${t.editor}.js)`);
      else if (!t.nodos.every((n) => readFileSync(f, 'utf8').includes(`name: '${n}'`))) fallos.push(`${t.tipo}: nodos/${t.editor}.js no declara ${t.nodos.join(', ')}`);
    }
    const casos = CASOS[t.tipo];
    if (!casos || !casos.bueno?.length || !casos.hostil?.length) { fallos.push(`${t.tipo}: faltan sus pruebas (bueno y hostil)`); continue; }
    for (const c of [...casos.bueno, ...casos.hostil]) {
      try {
        const limpio = limpiarContenido({ doc: { type: 'doc', content: [c] } });
        aNodos(limpio.contenido, 'web');
        aNodos(limpio.contenido, 'pdf');
      } catch (e) { fallos.push(`${t.tipo}: un caso rompe la salida (${e.message})`); }
    }
  }
  /* Cada clase de objeto de una pagina libre tambien trae sus partes y sale en sus pruebas */
  const { OBJETOS } = await import(new URL('../src/scripts/contenido/taller/tipos/objetos.js', import.meta.url));
  const probados = JSON.stringify(CASOS.paginaLibre || {});
  for (const [k, o] of Object.entries(OBJETOS)) {
    if (!o.limpiar || !o.pdf) fallos.push(`objeto ${k}: le falta limpiar o pdf`);
    if (!probados.includes(`"tipo":"${k}"`)) fallos.push(`objeto ${k}: faltan sus pruebas`);
  }
  if (fallos.length) throw new Error('\n\n  TALLER: bloques incompletos.\n  · ' + fallos.join('\n  · ') + '\n');
  return true;
}
