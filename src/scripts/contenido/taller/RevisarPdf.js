/* REVISAR EL PDF antes de hacerlo edicion. Es el PDF que el autor saco con «Hacer el PDF» y trae de vuelta: lo que se
   comparte es EXACTAMENTE lo que imprimio. Aqui solo hay cuentas (sin pdf.js ni red):

     paginas      entre 1 y 300
     proporcion   la de la hoja del PDF contra la del libro (1 % de margen, como la importacion de PDF)
     titulo       el PDF lleva el titulo del libro (el navegador se lo pone al sacarlo): si dice otro, es de otro libro
     encabezado   ninguna pagina trae «taller-hoja»: es la direccion que el navegador imprime en el pie cuando se deja
                  marcada «Encabezados y pies de pagina»
     contenido    cada salto del contenido cae en la hoja que el Taller dice (las mismas cuentas de la mesa)
     largo        si el libro tiene otro numero de hojas que la mesa: se avisa, no se frena

   Devuelve { errores: [{ clave, ...datos }], avisos: [...] }; no hay `ok`: sin errores, se puede subir. */
import { PAGINAS_MAX } from './PaginasEdicion.js';

export const DIFERENCIA_PROPORCION = 0.01;
/* «PDF para imprenta»: la hoja crece 9 pt (3,175 mm) por lado, es decir 6,35 mm en cada medida (hoja.js: SANGRE_PT) */
export const SANGRE_TOTAL_MM = 6.35;

/* La proporcion de la hoja IMPRESA de un libro: la del papel, y con sangre si se saca para imprenta */
export function ratioDeHoja(pagina) {
  const s = pagina && pagina.imprenta ? SANGRE_TOTAL_MM : 0;
  return (Number(pagina.anchoMm) + s) / (Number(pagina.altoMm) + s);
}
const normal = (t) => String(t == null ? '' : t).normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();

/* entrada: { paginas, ratioPdf, ratioLibro, titulo, tituloPdf, textos: [string], saltos: [{ ancla, pagina }],
              numeros: { ancla: pagina }, paginasMesa } */
export function revisarPdf(e) {
  const errores = [], avisos = [];
  const n = Number(e.paginas);
  if (!Number.isInteger(n) || n < 1) errores.push({ clave: 'edVacio' });
  else if (n > PAGINAS_MAX) errores.push({ clave: 'edLargo', max: PAGINAS_MAX });

  const rp = Number(e.ratioPdf), rl = Number(e.ratioLibro);
  if (Number.isInteger(n) && n >= 1 && n <= PAGINAS_MAX) {
    if (!(rp > 0) || !Number.isFinite(rp)) errores.push({ clave: 'edVacio' });
    else if (rl > 0 && Math.abs(rp / rl - 1) > DIFERENCIA_PROPORCION) errores.push({ clave: 'edProporcion' });
  }

  const tPdf = normal(e.tituloPdf), tLibro = normal(e.titulo);
  /* Solo un AVISO: el navegador suele escribir en el PDF el titulo de la pagina del portal y no el del libro, asi que
     un titulo distinto no prueba que sea de otro libro. Se dice y se deja subir. */
  /* Sin caracteres de control ni de direccion (un titulo con ellos podria dar vuelta el aviso al pintarlo) */
  const limpio = (t) => String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, '').slice(0, 80);
  const avisoTitulo = tPdf && tLibro && tPdf !== tLibro ? { clave: 'edTitulo', pdf: limpio(e.tituloPdf), libro: limpio(e.titulo) } : null;

  const textos = Array.isArray(e.textos) ? e.textos : [];
  const conEncabezado = textos.filter((t) => /taller-hoja/i.test(String(t || ''))).length;
  if (conEncabezado) errores.push({ clave: 'edEncabezado', n: conEncabezado });

  const numeros = e.numeros && typeof e.numeros === 'object' ? e.numeros : {};
  let mal = 0;
  for (const s of Array.isArray(e.saltos) ? e.saltos : []) {
    if (!s || typeof s.ancla !== 'string' || !Object.prototype.hasOwnProperty.call(numeros, s.ancla)) continue;
    if (s.pagina !== numeros[s.ancla]) mal++;
  }
  if (mal) errores.push({ clave: 'edContenido', n: mal });

  if (Number.isInteger(e.paginasMesa) && e.paginasMesa > 0 && n >= 1 && n !== e.paginasMesa) avisos.push({ clave: 'edDistintas', pdf: n, mesa: e.paginasMesa });
  if (avisoTitulo) avisos.push(avisoTitulo);
  if (!tPdf) avisos.push({ clave: 'edSinTitulo' });
  return { errores, avisos };
}
