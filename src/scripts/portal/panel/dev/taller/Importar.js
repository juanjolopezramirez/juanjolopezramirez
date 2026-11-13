/* TRAER UN PDF DE FIGMA: cada pagina del PDF entra como una pagina libre del libro, y se ve apenas llega.
   Cada una se mueve, se borra y lleva sus objetos por su cuenta. Si una falla, las anteriores se quedan:
   ya son paginas normales. El original se guarda en la caja privada, por si el libro cambia de tamaño. */
import { PAGINAS_MAX } from '../../../../contenido/taller/Pieza.js';
import { ConfigPagina } from '../../../../contenido/taller/ConfigPagina.js';
import { revisarArchivo } from '../../../archivos.js';
import { abrirPdf, leerPagina, medidasDelPdf } from './Pdf.js';

const azar = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
const CADA_CUANTAS = 10;

/* Figma escribe 1 px como 1 punto, asi que los milimetros de su PDF no dicen nada: solo cuenta la proporcion */
const DIFERENCIA_PROPORCION = .01;
const proporcionDistinta = (m, c) => Math.abs((m.anchoMm / m.altoMm) / (c.anchoMm / c.altoMm) - 1) > DIFERENCIA_PROPORCION;

/* LEER Y SUBIR TODO, sin tocar el libro: abre el PDF, pregunta si la proporcion es otra, sube el original y cada pagina
   como imagen, y le entrega cada una a `alPagina` apenas esta lista. `importarPdf` las pone en el libro una por una;
   el cambio de PDF las junta y recien al final las pone (si algo falla, ninguna pagina del libro se tocó).
   Devuelve null si no se pudo o se cancelo; si salio bien, { paginas, preguntado, ajuste, ruta, pagina } (`ajuste` solo
   cuenta si se pregunto: es lo que el autor eligio; `pagina` es el tamaño nuevo del libro si eligio ajustarlo, y si no, null). */
export async function subirPdf(archivo, { be, obra, tx, imagenes, sigue, alProporcion, alPagina, alAviso, alDecir, alError }) {
  let doc, salida = null;
  /* Antes de leerlo entero y abrirlo: que no pase el tope y que empiece como un PDF (la subida lo vuelve a mirar) */
  const ruta = `taller/${obra.id}/pdf/original-${azar()}.pdf`;
  const mira = await revisarArchivo(ruta, archivo);
  if (mira.error) { alError(mira.error); return null; }
  try { doc = await abrirPdf(archivo); } catch (e) { alError('pdfNoAbre'); return null; }
  try {
    const m = await medidasDelPdf(doc);
    if (m.paginas > PAGINAS_MAX) { alError('pdfLargo'); return null; }
    let pagina = obra.pagina, ajuste = 'contener', preguntado = false, nuevoTamano = null;
    if (proporcionDistinta(m, new ConfigPagina(pagina))) {
      const r = await alProporcion(m);
      if (!r) return null;
      preguntado = true;
      ajuste = r.ajuste;
      pagina = r.pagina || pagina;
      nuevoTamano = r.pagina || null;
    }
    const s = await be.taller.subir(ruta, archivo);
    if (s.error) { alError(s.error); return null; }
    const px = new ConfigPagina(pagina).pxPara(300);
    alDecir(tx.leyendo.replace('{n}', '1').replace('{total}', String(m.paginas)));
    for (let n = 1; n <= m.paginas; n++) {
      if (!sigue()) return null;
      const dice = tx.leyendo.replace('{n}', String(n)).replace('{total}', String(m.paginas));
      alAviso(dice);
      if (n % CADA_CUANTAS === 0) alDecir(dice);
      const g = await leerPagina(doc, n, px);
      const fondo = `taller/${obra.id}/pdf/p${String(n).padStart(4, '0')}-${azar()}.${g.ext}`;
      const r = await be.taller.subir(fondo, new File([g.blob], `p${n}.${g.ext}`, { type: g.blob.type }));
      if (r.error) { alError(r.error); return null; }
      if (!sigue()) return null;
      await imagenes.poner(fondo, g.blob);
      if (!sigue()) return null;
      /* Se espera: la primera pagina de una portada crea su capitulo, y la segunda tiene que llegar despues.
         `false` es «para»: lo que falta no se lee ni se sube. */
      const sigo = await alPagina({ nombre: archivo.name.replace(/\.pdf$/i, ''), fondo, pdf: ruta, pdfPagina: n, pdfTotal: m.paginas, anchoMm: m.anchoMm, altoMm: m.altoMm, ajuste, texto: g.texto, alt: '', caja: g.caja, sangre: g.sangre, objetos: [] });
      if (sigo === false) return null;
    }
    salida = { paginas: m.paginas, preguntado, ajuste, ruta, pagina: nuevoTamano };
    return salida;
  } catch (e) {
    if (sigue()) alError('pdfNoAbre');
    return null;
  } finally {
    alAviso('');
    doc.loadingTask.destroy();
  }
}

export async function importarPdf(archivo, deps) {
  if (await subirPdf(archivo, deps)) deps.alDecir(deps.tx.pdfListo);
}
