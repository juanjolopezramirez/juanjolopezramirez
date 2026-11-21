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

import { esEnlaceCopia } from '../../lector/copiaEnPdf.js';
import { esEnlaceNota, pareceEnlaceNota } from '../../lector/notaEnPdf.js';
import { FOLIO_MAX } from '../../lector/pliegos.js';

export const ENLACES_MAX = 200;
export const AREA_MAX = 0.25;
export const TEXTO_MAX = 30000;               // letras por pagina
export const HOJAS_MAX_BYTES = 3500000;       // la base deja 4 MB (supabase/013_publicar.sql): aqui queda margen
export const PAGINAS_MAX = 300;
const HREF_MAX = 2000;
const HREF_BUENO = /^(https:\/\/|mailto:)/i;
// eslint-disable-next-line no-control-regex
const HREF_MALO = /[\u0000-\u0020\u007f-\u009f<>"\\`]/;
/* ¿Puede quedarse este enlace? Un boton de copiar (copiaEnPdf.js) y una nota (notaEnPdf.js: una definicion o una cita, hasta
   8000 letras) llevan su contenido en la direccion y pueden ser mas largos que un enlace normal. Lo que DICE ser una nota y no
   se deja leer como una (falsa, rota, demasiado larga) se tira: no queda como un enlace cualquiera a /nota/. */
const hrefBueno = (href) => {
  if (pareceEnlaceNota(href)) return esEnlaceNota(href);
  return esEnlaceCopia(href) || (href.length <= HREF_MAX && HREF_BUENO.test(href) && !HREF_MALO.test(href));
};
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
    if (!hrefBueno(a.href)) return null;
    spot.href = a.href;
  } else if (Number.isInteger(a.pagina) && a.pagina >= 0 && a.pagina < paginas) {
    spot.page = a.pagina;
  } else return null;
  return spot;
}

/* EL NUMERO IMPRESO DE UNA PAGINA (su folio), como lo lee tools/books.py folio(): un numero SOLO, de 1 a 4 cifras, en el
   ultimo 12 % de la altura (el pie); si el pie no tiene uno, en el primer 12 % (la cabeza). Si en esa franja hay dos
   numeros distintos (una nota al pie y el folio), hay duda: no se elige ninguno; salvo que uno sea un año (1900–2100),
   que se aparta. Un año SOLO en el pie si cuenta aqui, y la votacion de foliosDeEdicion lo deja fuera si el libro dice otra cosa.
   `items`: [{ str, y0, y1 }], la caja de cada texto en coordenadas de la pagina (origen arriba, mismas unidades que `alto`). */
export const FRANJA_FOLIO = 0.12;
const FOLIO_TEXTO = /^\d{1,4}$/;
const folioBueno = (f) => Number.isInteger(f) && f >= 1 && f <= FOLIO_MAX;
export function folioDeTextos(items, alto) {
  if (!Array.isArray(items) || !(num(alto) > 0)) return null;
  const pie = new Set(), cabeza = new Set();
  for (const it of items) {
    if (!it || typeof it !== 'object' || typeof it.str !== 'string') continue;
    const s = it.str.trim();
    if (!FOLIO_TEXTO.test(s)) continue;
    const f = Number(s);
    const y0 = num(it.y0), y1 = Number.isNaN(num(it.y1)) ? y0 : num(it.y1);
    if (!folioBueno(f) || Number.isNaN(y0)) continue;
    if (y0 >= alto * (1 - FRANJA_FOLIO)) pie.add(f);
    else if (y1 <= alto * FRANJA_FOLIO) cabeza.add(f);
  }
  /* Un año suelto («2026» junto al folio en el pie) no es un numero de pagina: con otro numero en la franja, se aparta */
  const uno = (franja) => {
    if (franja.size > 1) for (const f of franja) if (f >= 1900 && f <= 2100) franja.delete(f);
    return franja.size === 1 ? [...franja][0] : null;
  };
  if (pie.size) return uno(pie);
  return cabeza.size ? uno(cabeza) : null;
}

/* LOS FOLIOS DE TODO EL LIBRO, de los numeros que se leyeron pagina por pagina (`candidatos`: un numero o null por pagina).
   Como tools/books.py offset(): cada numero vota por un desfase (pagina + 1 - numero) y gana el que mas votos tiene. Entre la
   primera y la ultima pagina que votaron por el ganador, cada pagina lleva su numero (tambien las que no lo tienen impreso,
   como el comienzo de un capitulo); fuera de ahi (tapa, portadilla, contratapa), ninguno. Si el voto es flojo (menos de dos
   paginas de acuerdo, o no son mas de la mitad de las que tienen un numero) no se inventa nada: todo null. */
export const VOTOS_MIN = 2;
export function foliosDeEdicion(candidatos, n) {
  const total = Number.isInteger(n) && n > 0 ? Math.min(n, PAGINAS_MAX) : 0;
  const salida = new Array(total).fill(null);
  if (!Array.isArray(candidatos)) return salida;
  const votos = new Map();
  let numerados = 0;
  for (let i = 0; i < total; i++) {
    const c = candidatos[i];
    if (!folioBueno(c)) continue;
    numerados++;
    const d = i + 1 - c;
    votos.set(d, (votos.get(d) || 0) + 1);
  }
  let off = null, mas = 0;
  for (const [d, v] of votos) if (v > mas) { off = d; mas = v; }
  if (off == null || mas < VOTOS_MIN || mas * 2 <= numerados) return salida;
  let a = -1, b = -1;
  for (let i = 0; i < total; i++) {
    if (folioBueno(candidatos[i]) && i + 1 - candidatos[i] === off) { if (a < 0) a = i; b = i; }
  }
  for (let i = a; i <= b; i++) {
    const f = i + 1 - off;
    salida[i] = folioBueno(f) ? f : null;
  }
  return salida;
}

/* Los folios que trae una edicion ya guardada (las filas de hojasSeguras): la lista, o null si no hay ninguno (un enlace
   de antes de los folios, o un libro sin numeros) y el lector cuenta las imagenes, de la 1 a la n. */
export function foliosDeHojas(hojas) {
  if (!Array.isArray(hojas) || !hojas.length) return null;
  const lista = hojas.map((h) => (h && folioBueno(h.folio) ? h.folio : null));
  return lista.some((f) => f != null) ? lista : null;
}

/* { text, links?, folio? }, como una fila de pages.json (mas su numero impreso, si lo tiene) */
export function hojaDe(pagina, ancho, alto, paginas, folio = null) {
  const texto = String((pagina && pagina.texto) || '').replace(/\s+/g, ' ').trim().slice(0, TEXTO_MAX);
  const links = [];
  for (const a of Array.isArray(pagina && pagina.enlaces) ? pagina.enlaces : []) {
    if (links.length >= ENLACES_MAX) break;
    const e = enlaceDePagina(a, ancho, alto, paginas);
    if (e) links.push(e);
  }
  const hoja = links.length ? { text: texto, links } : { text: texto };
  if (folioBueno(folio)) hoja.folio = folio;
  return hoja;
}

/* Todas las paginas: { hojas } o { error: 'paginas' | 'grande' }. Si no cabe en 4 MB se recorta el texto de cada
   pagina (lo que ayuda a quien no ve la imagen, no lo que se ve) y, si ni asi, no se guarda. `folios`: los de
   foliosDeEdicion (o nada: el lector contara las imagenes). */
export function hojasDeEdicion(paginas, ancho, alto, folios = null) {
  const n = Array.isArray(paginas) ? paginas.length : 0;
  if (n < 1 || n > PAGINAS_MAX) return { error: 'paginas' };
  const medidas = (i) => (Array.isArray(ancho) ? ancho[i] : ancho);
  const altos = (i) => (Array.isArray(alto) ? alto[i] : alto);
  const folioDe = (i) => (Array.isArray(folios) ? folios[i] : null);
  let hojas = paginas.map((p, i) => hojaDe(p, medidas(i), altos(i), n, folioDe(i)));
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
        if (!hrefBueno(l.href)) continue;
        spot.href = l.href;
      } else if (Number.isInteger(l.page) && l.page >= 0 && l.page < n) spot.page = l.page;
      else continue;
      links.push(spot);
    }
    const hoja = links.length ? { text, links } : { text };
    /* El numero impreso: solo un entero de 1 a FOLIO_MAX ('3', -1, 2.5, 1e9 no son un folio) */
    if (h && folioBueno(h.folio)) hoja.folio = h.folio;
    salida.push(hoja);
  }
  return salida;
}
