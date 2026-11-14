/* LO QUE SE GUARDA DE CADA PAGINA de una edicion del libro (el que se comparte con un enlace privado): su texto
   (para quien no ve la imagen) y sus enlaces, para que se puedan tocar en el lector igual que en el PDF.

   Es la MISMA cuenta que hace tools/books.py con los PDF de Recursos, con los mismos topes, para que el lector
   (site.js) lea lo mismo de un libro y del otro:

     solo https:// y mailto: (un enlace «javascript:» de un PDF ajeno llegaria al href de la pagina; http va sin cifrar)
     un enlace que tapa mas de un cuarto de la pagina no es un enlace, es una trampa
     200 enlaces por pagina como mucho
     un salto interno cae SIEMPRE en una pagina del libro (un entero entre 0 y paginas - 1)
     todo recortado a la pagina y redondeado a 4 decimales

   Aqui no hay pdf.js ni red: `rect` ya viene en coordenadas de la pagina (origen arriba a la izquierda, mismas
   unidades que `ancho` y `alto`), y el destino de un salto interno ya viene resuelto a un numero de pagina.
   El PDF puede ser de cualquiera, asi que cada dato se trata como hostil. */

export const ENLACES_MAX = 200;
export const AREA_MAX = 0.25;
export const TEXTO_MAX = 30000;               // letras por pagina
export const HOJAS_MAX_BYTES = 3500000;       // la base deja 4 MB (supabase/013_publicar.sql): aqui queda margen
export const PAGINAS_MAX = 300;
const HREF_MAX = 2000;
const HREF_BUENO = /^(https:\/\/|mailto:)/i;
// eslint-disable-next-line no-control-regex
const HREF_MALO = /[\u0000-\u0020\u007f-\u009f<>"\\`]/;
const r4 = (x) => Math.round(x * 10000) / 10000;
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : NaN);

/* Un enlace de la pagina → { x, y, w, h, href | page } o null (no vale). `paginas` es cuantas tiene el libro. */
export function enlaceDePagina(a, ancho, alto, paginas) {
  if (!a || typeof a !== 'object' || !Array.isArray(a.rect) || a.rect.length !== 4) return null;
  if (!(num(ancho) > 0) || !(num(alto) > 0)) return null;
  const [p, q, r, s] = a.rect.map(num);
  if ([p, q, r, s].some(Number.isNaN)) return null;
  /* Dentro de la pagina siempre: lo que se sale se recorta al borde */
  const x0 = Math.max(0, Math.min(p, r)), x1 = Math.min(ancho, Math.max(p, r));
  const y0 = Math.max(0, Math.min(q, s)), y1 = Math.min(alto, Math.max(q, s));
  if (!(x1 > x0) || !(y1 > y0)) return null;
  const spot = { x: r4(x0 / ancho), y: r4(y0 / alto), w: r4((x1 - x0) / ancho), h: r4((y1 - y0) / alto) };
  if (spot.w * spot.h > AREA_MAX) return null;
  if (typeof a.href === 'string' && a.href) {
    if (a.href.length > HREF_MAX || !HREF_BUENO.test(a.href) || HREF_MALO.test(a.href)) return null;
    spot.href = a.href;
  } else if (Number.isInteger(a.pagina) && a.pagina >= 0 && a.pagina < paginas) {
    spot.page = a.pagina;
  } else return null;
  return spot;
}

/* { text, links? }, como una fila de pages.json */
export function hojaDe(pagina, ancho, alto, paginas) {
  const texto = String((pagina && pagina.texto) || '').replace(/\s+/g, ' ').trim().slice(0, TEXTO_MAX);
  const links = [];
  for (const a of Array.isArray(pagina && pagina.enlaces) ? pagina.enlaces : []) {
    if (links.length >= ENLACES_MAX) break;
    const e = enlaceDePagina(a, ancho, alto, paginas);
    if (e) links.push(e);
  }
  return links.length ? { text: texto, links } : { text: texto };
}

/* Todas las paginas: { hojas } o { error: 'paginas' | 'grande' }. Si no cabe en 4 MB se recorta el texto de cada
   pagina (lo que ayuda a quien no ve la imagen, no lo que se ve) y, si ni asi, no se guarda. */
export function hojasDeEdicion(paginas, ancho, alto) {
  const n = Array.isArray(paginas) ? paginas.length : 0;
  if (n < 1 || n > PAGINAS_MAX) return { error: 'paginas' };
  const medidas = (i) => (Array.isArray(ancho) ? ancho[i] : ancho);
  const altos = (i) => (Array.isArray(alto) ? alto[i] : alto);
  let hojas = paginas.map((p, i) => hojaDe(p, medidas(i), altos(i), n));
  const peso = () => new TextEncoder().encode(JSON.stringify(hojas)).length;
  if (peso() > HOJAS_MAX_BYTES) {
    hojas = hojas.map((h) => ({ ...h, text: h.text.slice(0, 1500) }));
    if (peso() > HOJAS_MAX_BYTES) return { error: 'grande' };
  }
  return { hojas };
}

/* Lo que llega de la base o de un enlace es dato ajeno: antes de dar una hoja al lector se vuelve a limpiar.
   Devuelve siempre `n` filas con la forma de pages.json. */
export function hojasSeguras(hojas, n) {
  const salida = [];
  for (let i = 0; i < n; i++) {
    const h = Array.isArray(hojas) ? hojas[i] : null;
    const text = h && typeof h.text === 'string' ? h.text.slice(0, TEXTO_MAX) : '';
    const links = [];
    for (const l of h && Array.isArray(h.links) ? h.links : []) {
      if (links.length >= ENLACES_MAX) break;
      if (!l || typeof l !== 'object') continue;
      const caja = [l.x, l.y, l.w, l.h].map(num);
      if (caja.some((v) => Number.isNaN(v) || v < 0 || v > 1) || caja[0] + caja[2] > 1.0001 || caja[1] + caja[3] > 1.0001 || caja[2] * caja[3] > AREA_MAX) continue;
      const spot = { x: caja[0], y: caja[1], w: caja[2], h: caja[3] };
      if (typeof l.href === 'string') {
        if (l.href.length > HREF_MAX || !HREF_BUENO.test(l.href) || HREF_MALO.test(l.href)) continue;
        spot.href = l.href;
      } else if (Number.isInteger(l.page) && l.page >= 0 && l.page < n) spot.page = l.page;
      else continue;
      links.push(spot);
    }
    salida.push(links.length ? { text, links } : { text });
  }
  return salida;
}
