/* LEER EL PDF DE UNA EDICION con pdf.js: es la parte que toca el navegador (las cuentas estan en
   contenido/taller/RevisarPdf.js y PaginasEdicion.js, que se prueban en Node).

   Dos tiempos:
     mirar(archivo)      abre el PDF y saca, SIN pintar nada: cuantas paginas, la proporcion, el titulo, el texto de cada
                         pagina, sus enlaces (con su sitio en la pagina) y a que hoja salta cada uno del contenido.
     pintar(doc, n, w)   una pagina vuelta imagen WebP de `w` px de ancho (se llama dos veces: 900 y 1600).

   Todo lo que trae el PDF es dato ajeno: lo que sale de aqui pasa luego por revisarPdf / hojasDeEdicion. */
import { abrirPdf, aArchivo, escalaDePagina } from './Pdf.js';
import { PAGINAS_MAX } from '../../../../contenido/taller/PaginasEdicion.js';

const TEXTO_POR_PAGINA = 30000;

/* El rectangulo de un enlace (coordenadas del PDF, origen abajo) → coordenadas de la pagina vista (origen arriba), con la
   matriz del `viewport`. Se pasan las cuatro esquinas: asi vale tambien con la pagina girada. pdf.js ya no trae
   `convertToViewportRectangle`. */
export function rectEnPagina(v, rect) {
  const [a, b, c, d, e, f] = v.transform;
  const xs = [], ys = [];
  for (const [x, y] of [[rect[0], rect[1]], [rect[0], rect[3]], [rect[2], rect[1]], [rect[2], rect[3]]]) { xs.push(a * x + c * y + e); ys.push(b * x + d * y + f); }
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/* El destino de un salto interno → numero de pagina (desde 0) o null. Nombrado ('cap-2') o directo ([ref, …]). */
async function paginaDeDestino(doc, dest, cache) {
  try {
    if (typeof dest === 'string') {
      if (cache.has(dest)) return cache.get(dest);
      const d = await doc.getDestination(dest);
      const p = Array.isArray(d) ? await paginaDeRef(doc, d[0]) : null;
      cache.set(dest, p);
      return p;
    }
    return Array.isArray(dest) ? await paginaDeRef(doc, dest[0]) : null;
  } catch (e) { return null; }
}
async function paginaDeRef(doc, ref) {
  if (Number.isInteger(ref)) return ref;
  if (ref && typeof ref === 'object') return doc.getPageIndex(ref);
  return null;
}

/* → { doc, paginas, ratio, anchos[], altos[], titulo, textos[], datos[] (para hojasDeEdicion), saltos[] } */
export async function mirar(archivo, { sigue = () => true, alPagina = () => {} } = {}) {
  const doc = await abrirPdf(archivo);
  try {
    const paginas = doc.numPages;
    if (!Number.isInteger(paginas) || paginas < 1 || paginas > PAGINAS_MAX) return { doc, paginas };
    let titulo = '';
    try { const m = await doc.getMetadata(); titulo = String((m.info && m.info.Title) || ''); } catch (e) { /* sin titulo */ }
    const anchos = [], altos = [], textos = [], datos = [], saltos = [];
    const cache = new Map();
    for (let n = 1; n <= paginas; n++) {
      if (!sigue()) return { doc, paginas: 0, parado: true };
      alPagina(n, paginas);
      const p = await doc.getPage(n);
      const v = p.getViewport({ scale: 1 });
      anchos.push(v.width); altos.push(v.height);
      const texto = (await p.getTextContent()).items.map((x) => x.str || '').join(' ').replace(/\s+/g, ' ').trim().slice(0, TEXTO_POR_PAGINA);
      textos.push(texto);
      const enlaces = [];
      for (const a of await p.getAnnotations()) {
        if (!a || a.subtype !== 'Link' || !Array.isArray(a.rect) || a.rect.length !== 4) continue;
        const rect = rectEnPagina(v, a.rect);
        if (typeof a.url === 'string' && a.url) { enlaces.push({ rect, href: a.url }); continue; }
        if (a.dest) {
          const pagina = await paginaDeDestino(doc, a.dest, cache);
          enlaces.push({ rect, pagina: Number.isInteger(pagina) ? pagina : null });
          if (typeof a.dest === 'string' && Number.isInteger(pagina)) saltos.push({ ancla: a.dest, pagina: pagina + 1 });
        }
      }
      datos.push({ texto, enlaces });
      p.cleanup();
    }
    return { doc, paginas, ratio: anchos[0] / altos[0], anchos, altos, titulo, textos, datos, saltos };
  } catch (e) {
    doc.loadingTask.destroy();
    throw e;
  }
}

/* La pagina `n` como DOS imagenes WebP: se pinta UNA vez a `ancho` (1600) y la otra (900) sale de reducir esa.
   { grande, chica } (blobs) o { error: 'edSinWebp' | 'edFalla' } */
export async function pintar(doc, n, ancho = 1600, chico = 900) {
  const p = await doc.getPage(n);
  try {
    const v1 = p.getViewport({ scale: 1 });
    const escala = escalaDePagina(v1.width, v1.height, { ancho, alto: ancho * (v1.height / v1.width) });
    if (!escala) return { error: 'edFalla' };
    const v = p.getViewport({ scale: escala });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(v.width);
    canvas.height = Math.ceil(v.height);
    await p.render({ canvas, viewport: v }).promise;
    const grande = await aArchivo(canvas);
    /* La de 900: la misma pagina, mas chica, con el mismo alto proporcional */
    const c2 = document.createElement('canvas');
    c2.width = Math.min(chico, canvas.width);
    c2.height = Math.max(1, Math.round(canvas.height * (c2.width / canvas.width)));
    const x = c2.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(canvas, 0, 0, c2.width, c2.height);
    canvas.width = 0; canvas.height = 0;
    const chica = await aArchivo(c2);
    c2.width = 0; c2.height = 0;
    if (!grande.blob || !chica.blob || grande.ext !== 'webp' || chica.ext !== 'webp') return { error: 'edSinWebp' };
    return { grande: grande.blob, chica: chica.blob };
  } finally { p.cleanup(); }
}
