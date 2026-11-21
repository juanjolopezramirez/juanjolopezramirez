/* La pagina /ir/ (src/pages/ir.astro): lee la direccion de `#u=…` con la misma regla que el resto (lector/botonEnPdf.js: solo
   https, sin usuario ni clave, con tope), la MUESTRA como texto y deja un enlace para ir. Nunca salta sola. */
import { BASE_IR, irDeEnlace } from './lector/botonEnPdf.js';

const d = document;
const vacio = d.querySelector('[data-vacio]'), lleno = d.querySelector('[data-lleno]');
/* La forma de verdad es la del sitio; el hash es lo unico que se lee de esta direccion */
const leido = irDeEnlace(BASE_IR.replace(/#u=$/, '') + location.hash);

if (!leido) {
  vacio.hidden = false;
} else {
  const u = new URL(leido.url);
  d.querySelector('[data-host]').textContent = u.hostname;
  d.querySelector('[data-url]').textContent = leido.url;
  const a = d.querySelector('[data-ir]');
  a.href = leido.url;
  a.textContent = `Seguir a ${u.hostname} · Continue to ${u.hostname}`;
  /* Un nombre con letras de otros alfabetos (xn--…) puede imitar a otro sitio: se avisa */
  if (u.hostname.split('.').some((p) => p.startsWith('xn--'))) d.querySelector('[data-raro]').hidden = false;
  lleno.hidden = false;
}
