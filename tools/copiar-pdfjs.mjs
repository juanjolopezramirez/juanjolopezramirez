/* LAS PIEZAS DE pdf.js QUE EL TALLER PIDE POR SU DIRECCION.

   El Taller lee los PDF que traes de Figma con pdf.js. La libreria va en su propio trozo, pero
   su «trabajador» y sus archivos de apoyo se piden por URL: tienen que estar en la web. Se copian
   de node_modules a public/vendor/pdfjs-<version>/ (no se suben al repositorio: .gitignore), asi
   la version del trabajador y la de la libreria no pueden separarse nunca.

   El trabajador se copia con final .js y no .mjs: asi GitHub Pages lo entrega siempre como
   JavaScript. quickjs-eval NO se copia: es un interprete y el Taller no lo usa.

   Corre solo antes de `npm run dev` y `npm run build`, y como paso propio en la publicacion. */
import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, 'node_modules/pdfjs-dist');
const { version } = JSON.parse(readFileSync(join(origen, 'package.json'), 'utf8'));
const destino = join(raiz, 'public/vendor', `pdfjs-${version}`);

if (!existsSync(join(destino, 'pdf.worker.min.js'))) {
  rmSync(join(raiz, 'public/vendor'), { recursive: true, force: true });
  mkdirSync(destino, { recursive: true });
  copyFileSync(join(origen, 'build/pdf.worker.min.mjs'), join(destino, 'pdf.worker.min.js'));
  for (const carpeta of ['wasm', 'cmaps', 'standard_fonts', 'iccs']) {
    cpSync(join(origen, carpeta), join(destino, carpeta), { recursive: true, filter: (f) => !/quickjs/.test(f) });
  }
}
console.log(`pdf.js ${version} listo en public/vendor/`);
