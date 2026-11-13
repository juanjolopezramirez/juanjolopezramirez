/* LEER UN PDF DE DISEÑO. Es el unico archivo que trae pdf.js, y solo cuando se adjunta uno: quien
   no adjunta nada no lo baja.

   Las paginas se pintan a la medida del LIBRO, nunca a la del PDF: el Ahava de Figma mide 578 mm
   y a 300 ppp cada pagina saldria de 6800 px. Sus trabajadores y archivos de apoyo vienen de
   public/vendor (tools/copiar-pdfjs.mjs), que lleva la misma version escrita en la ruta.

   De cada pagina salen: su imagen, su texto (para lectores de pantalla) y la caja de lo que tiene
   dibujado, que se calcula una vez sobre una copia pequeña. */
let cargada = null;

async function libreria() {
  if (!cargada) {
    cargada = import('pdfjs-dist').then((pdfjs) => {
      const base = `/vendor/pdfjs-${pdfjs.version}/`;
      pdfjs.GlobalWorkerOptions.workerSrc = `${base}pdf.worker.min.js`;
      return { pdfjs, base };
    }).catch((e) => { cargada = null; throw e; });
  }
  return cargada;
}

const MM_POR_PUNTO = 25.4 / 72;
const LADO_MUESTRA = 600;
const DIFERENCIA = 60;              // lo que debe alejarse del fondo para contar como dibujo
const SANGRE_PCT = 0.5;

export async function abrirPdf(archivo) {
  const { pdfjs, base } = await libreria();
  return pdfjs.getDocument({
    data: await archivo.arrayBuffer(), wasmUrl: `${base}wasm/`, cMapUrl: `${base}cmaps/`,
    cMapPacked: true, standardFontDataUrl: `${base}standard_fonts/`, iccUrl: `${base}iccs/`
  }).promise;
}

export async function medidasDelPdf(doc) {
  const v = (await doc.getPage(1)).getViewport({ scale: 1 });
  return { anchoMm: Math.round(v.width * MM_POR_PUNTO * 10) / 10, altoMm: Math.round(v.height * MM_POR_PUNTO * 10) / 10, paginas: doc.numPages };
}

/* La caja de lo dibujado, en % de la pagina. Se ignoran pepitas: una fila o columna cuenta si
   tiene algo mas que ruido. Si las esquinas no se parecen, el fondo es un dibujo a sangre. */
function cajaDe(canvas) {
  const esc = Math.min(1, LADO_MUESTRA / Math.max(canvas.width, canvas.height));
  const w = Math.max(1, Math.round(canvas.width * esc)), h = Math.max(1, Math.round(canvas.height * esc));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const px = (x, y) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
  const esquinas = [px(1, 1), px(w - 2, 1), px(1, h - 2), px(w - 2, h - 2)];
  const dif = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  if (esquinas.some((e) => dif(e, esquinas[0]) > DIFERENCIA)) return { caja: { x: 0, y: 0, w: 100, h: 100 }, sangre: true };
  const filas = new Array(h).fill(0), cols = new Array(w).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (dif(px(x, y), esquinas[0]) > DIFERENCIA) { filas[y]++; cols[x]++; }
  const hay = (lista, tope) => {
    const min = Math.max(1, tope * 0.002);
    const a = lista.findIndex((n) => n >= min);
    if (a < 0) return null;
    let b = lista.length - 1;
    while (lista[b] < min) b--;
    return [a, b + 1];
  };
  const fy = hay(filas, w), fx = hay(cols, h);
  if (!fy || !fx) return { caja: null, sangre: false };
  const caja = { x: (fx[0] / w) * 100, y: (fy[0] / h) * 100, w: ((fx[1] - fx[0]) / w) * 100, h: ((fy[1] - fy[0]) / h) * 100 };
  const sangre = caja.x <= SANGRE_PCT || caja.y <= SANGRE_PCT || caja.x + caja.w >= 100 - SANGRE_PCT || caja.y + caja.h >= 100 - SANGRE_PCT;
  return { caja, sangre };
}

/* Safari devuelve PNG aunque se le pida WebP: se mira lo que de verdad salio */
async function aArchivo(canvas) {
  const pedir = (tipo, q) => new Promise((ok) => canvas.toBlob(ok, tipo, q));
  const webp = await pedir('image/webp', 0.85);
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' };
  return { blob: await pedir('image/jpeg', 0.9), ext: 'jpg' };
}

/* La escala para pintar una pagina de `ancho` x `alto` puntos a la medida del libro `px`. Solo la pagina 1 se midio al abrir:
   las otras pueden traer cualquier medida (una de 1 x 14400 puntos haria un dibujo de miles de millones de pixeles y
   colgaria la pestaña). Si no cabe en los topes, se baja la escala; si habria que bajarla a menos de la mitad, la pagina no
   se pinta (devuelve 0). El tope de area deja pasar el libro mas grande (420 x 420 mm a 300 ppp, 24,6 millones de pixeles). */
export const LADO_PX_MAX = 8192;
export const AREA_PX_MAX = 25e6;
export function escalaDePagina(ancho, alto, px) {
  if (!(ancho > 0) || !(alto > 0) || !px || !(px.ancho > 0) || !(px.alto > 0)) return 0;
  const quiere = Math.max(px.ancho / ancho, px.alto / alto);
  const tope = Math.min(LADO_PX_MAX / ancho, LADO_PX_MAX / alto, Math.sqrt(AREA_PX_MAX / (ancho * alto)));
  const e = Math.min(quiere, tope);
  return Number.isFinite(e) && e > 0 && e >= quiere / 2 ? e : 0;
}

export async function leerPagina(doc, n, px) {
  const p = await doc.getPage(n);
  const v1 = p.getViewport({ scale: 1 });
  const escala = escalaDePagina(v1.width, v1.height, px);
  if (!escala) { p.cleanup(); throw new Error('pagina fuera de medida'); }
  const v = p.getViewport({ scale: escala });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(v.width);
  canvas.height = Math.ceil(v.height);
  await p.render({ canvas, viewport: v }).promise;
  const { caja, sangre } = cajaDe(canvas);
  const { blob, ext } = await aArchivo(canvas);
  const texto = (await p.getTextContent()).items.map((x) => x.str || '').join(' ').replace(/\s+/g, ' ').trim();
  const w = canvas.width, h = canvas.height;
  canvas.width = 0; canvas.height = 0;
  p.cleanup();
  return { n, blob, ext, w, h, texto, caja, sangre };
}
