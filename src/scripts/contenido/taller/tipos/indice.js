/* LOS TIPOS DE BLOQUE DEL LIBRO. Agregar uno es agregar sus cinco partes:
     1. datos  tipos/<tipo>.js → datos()
     2. web    tipos/<tipo>.js → web()
     3. PDF    tipos/<tipo>.js → pdf()
     4. editor panel/dev/taller/nodos/<tipo>.js (o `editor: 'starter-kit'` si ya viene hecho)
     5. pruebas tools/pruebas-taller.mjs
   Si falta una, `tools/revisar-tipos-taller.mjs` para la compilacion. */
import * as parrafo from './parrafo.js';
import * as titulo from './titulo.js';
import * as lista from './lista.js';
import * as cita from './cita.js';
import * as separador from './separador.js';
import * as imagen from './imagen.js';
import * as columnas from './columnas.js';
import * as paginasPdf from './paginasPdf.js';
import * as paginaLibre from './paginaLibre.js';
import * as formula from './formula.js';
import * as boton from './boton.js';
import * as pasaje from './pasaje.js';
import * as subetapa from './subetapa.js';

export const TIPOS = [parrafo, titulo, lista, cita, separador, imagen, columnas, paginasPdf, paginaLibre, formula, boton, pasaje, subetapa];
export const POR_NODO = new Map(TIPOS.flatMap((t) => t.nodos.map((n) => [n, t])));
