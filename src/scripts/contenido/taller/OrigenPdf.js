/* DE QUE PDF VIENE UNA PAGINA, sin pantalla. Una pagina libre traida de un PDF guarda `pdf` (la ruta del original,
   igual para todas las de una misma subida) y `pdfPagina` (que pagina era dentro de ese PDF). Los libros de antes no
   guardaban el numero: se saca del nombre del fondo (`taller/<obra>/pdf/p0003-xxxx.webp`).
   Todo aqui lee igual el JSON guardado y los atributos vivos del editor. */
import { PAGINAS_MAX } from './Pieza.js';

/* `p0003-1a2b3c4d5e6f7a8b.webp` → 3 */
const RE_FONDO_PDF = /\/pdf\/p(\d{1,5})-[0-9a-f]+\.(?:webp|jpg|png)$/;

const entero = (v) => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= PAGINAS_MAX;

/* ¿Es una pagina de un PDF? Lleva dibujo y la ruta del original. */
export const grupoDe = (a) => {
  const x = a && typeof a === 'object' ? a : {};
  return typeof x.fondo === 'string' && x.fondo && typeof x.pdf === 'string' ? x.pdf : '';
};

/* La pagina que era en su PDF (0 si no se sabe) */
export function paginaDe(a) {
  const x = a && typeof a === 'object' ? a : {};
  if (!grupoDe(x)) return 0;
  if (entero(x.pdfPagina)) return x.pdfPagina;
  const m = RE_FONDO_PDF.exec(typeof x.fondo === 'string' ? x.fondo : '');
  const n = m ? Number(m[1]) : 0;
  return entero(n) ? n : 0;
}

/* Cuantas paginas tenia su PDF al subirlo (0 si no se guardo) */
export function totalDe(a) {
  const x = a && typeof a === 'object' ? a : {};
  return grupoDe(x) && entero(x.pdfTotal) ? x.pdfTotal : 0;
}

/* Agrupa por PDF, en el orden en que aparece cada uno. `lista`: [{ clave, attrs }] en el orden del libro, con `clave` lo que
   identifica el capitulo de cada una (un objeto cualquiera). Una pagina marcada `sobra` va en su propio grupo aunque su
   PDF sea el mismo: son lo que quedo del PDF anterior. */
export function gruposDe(lista) {
  const grupos = [], porClave = new Map();
  (Array.isArray(lista) ? lista : []).forEach((q, i) => {
    const a = q && q.attrs, pdf = grupoDe(a);
    if (!pdf) return;
    const sobra = a.sobra === true, llave = `${sobra ? 's' : 'n'}:${pdf}`;
    let g = porClave.get(llave);
    if (!g) { g = { pdf, sobra, paginas: [], claves: new Set() }; porClave.set(llave, g); grupos.push(g); }
    g.paginas.push({ i, pagina: paginaDe(a), total: totalDe(a), clave: q.clave });
    g.claves.add(q.clave);
  });
  return grupos;
}

/* EL CAMBIO DE PDF: de las paginas viejas del grupo (en el orden del libro, cada una con la pagina que era en su PDF) y de
   cuantas trae el PDF nuevo, que pagina nueva va en cada vieja.
   - Si todas las viejas saben su numero, cada una recibe la pagina con ese numero (una hoja duplicada repite el numero y
     recibe la misma pagina nueva): asi una pagina que se movio de lugar en el libro sigue siendo su misma pagina del PDF.
     Una que el autor borro se queda borrada.
   - Si no, van por orden: la primera vieja recibe la primera nueva.
   Las viejas que no tienen pagina nueva `sobran` (se quedan marcadas, no se borran). Las nuevas que no tenian vieja
   `nuevas` van detras de la ultima del grupo: solo las que pasan del total del PDF viejo (o de la ultima que se ve). */
export function planCambio(viejas, cuantasNuevas) {
  const lista = Array.isArray(viejas) ? viejas : [], N = Math.max(0, Math.floor(cuantasNuevas) || 0);
  const numeros = lista.map((v) => (v && entero(v.pagina) ? v.pagina : 0));
  /* Un numero repetido (una hoja duplicada) no impide ir por numero: las dos reciben la misma pagina nueva. */
  const porNumero = lista.length > 0 && numeros.every((n) => n > 0);
  /* Cuantas paginas tenia el PDF viejo (`total`, lo que se guardo al subirlo; si no se sabe, la mas alta que se ve): lo que el
     autor borro del final del PDF viejo no vuelve aunque el nuevo tenga ese largo. */
  const total = lista.reduce((m, v) => Math.max(m, v && entero(v.total) ? v.total : 0), 0);
  const asignar = [], sobran = [];
  let ultima = total;
  lista.forEach((_, i) => {
    const n = porNumero ? numeros[i] : i + 1;
    if (n <= N) asignar.push({ i, n }); else sobran.push(i);
    ultima = Math.max(ultima, n);
  });
  const nuevas = [];
  for (let n = ultima + 1; n <= N; n++) nuevas.push(n);
  return { modo: porNumero ? 'numero' : 'orden', asignar, sobran, nuevas };
}
