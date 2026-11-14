/* SOLO CON `npm run dev` Y EL MODO DEMO (vista.js lo carga con un `import()` que la compilacion de verdad quita).
   Hace de funcion de borde `vista` con lo que haya en memoria: la demo del Taller (portal/demo.js) guarda ediciones y
   enlaces en la memoria de SU pestaña, y esta pagina es otra pestaña, asi que para probarla la prueba le pasa una
   copia: `window.__vistaDemo = await window.__vistaDemoCopia()` desde la pestaña del Taller, puesta aqui antes de cargar.

   Las mismas reglas de la funcion de verdad: sin la copia, o sin un enlace con esa huella, o apagado, o vencido,
   da lo mismo: null. */
import { estadoDe, huella, leerToken } from '../contenido/taller/Enlaces.js';

export async function pedirDemo(token, renovar) {
  const copia = window.__vistaDemo;
  if (!copia || !leerToken(token)) return null;
  const h = await huella(token);
  const enlace = (copia.enlaces || []).find((e) => e.hash === h.bytea);
  if (!enlace || estadoDe(enlace, Date.now()) !== 'activo') return null;
  const ed = (copia.ediciones || []).find((e) => e.id === enlace.edicionId);
  if (!ed) return null;
  const archivos = copia.archivos || {};
  const de = (w) => Array.from({ length: ed.paginas }, (_, i) => archivos[`${ed.carpeta}p${String(i + 1).padStart(3, '0')}-${w}.webp`] || '');
  if (!renovar) enlace.vistas = (enlace.vistas || 0) + 1;
  return { ok: true, datos: { titulo: ed.titulo, idioma: ed.idioma, paginas: ed.paginas, ratio: ed.ratio, blando: ed.blando, hojas: ed.hojas, urls: { w900: de(900), w1600: de(1600) } } };
}
