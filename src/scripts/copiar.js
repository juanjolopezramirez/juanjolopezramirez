/* La pagina /copiar/ (src/pages/copiar.astro): lee el texto de `#t=…`, lo muestra como TEXTO (nunca como HTML) y lo copia.
   El texto sale del mismo lugar que usa el lector (lector/copiaEnPdf.js), con los mismos topes. */
import { BASE_COPIA, textoDeCopia } from './lector/copiaEnPdf.js';

const d = document;
const pre = d.querySelector('[data-texto]'), boton = d.querySelector('[data-copiar]'), vacio = d.querySelector('[data-vacio]'), estado = d.querySelector('[data-estado]');
const texto = textoDeCopia(BASE_COPIA.replace(/#t=$/, '') + location.hash) || null;

if (!texto) {
  vacio.hidden = false;
} else {
  pre.textContent = texto;
  pre.hidden = false;
  boton.hidden = false;
  boton.addEventListener('click', async () => {
    let bien = false;
    try { await navigator.clipboard.writeText(texto); bien = true; } catch (err) { /* sin permiso: se selecciona para copiar a mano */ }
    if (!bien) {
      const rango = d.createRange();
      rango.selectNodeContents(pre);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(rango);
      try { bien = d.execCommand('copy'); } catch (err) { bien = false; }
    }
    estado.textContent = bien ? 'Mensaje copiado · Message copied' : 'No se pudo copiar: selecciona el texto y cópialo · Couldn’t copy: select the text and copy it';
  });
}
