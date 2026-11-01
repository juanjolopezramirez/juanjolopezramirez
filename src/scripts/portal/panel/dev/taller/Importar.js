/* TRAER UN PDF DE FIGMA: cada pagina del PDF entra como una pagina libre del libro, y se ve apenas llega.
   Cada una se mueve, se borra y lleva sus objetos por su cuenta. Si una falla, las anteriores se quedan:
   ya son paginas normales. El original se guarda en la caja privada, por si el libro cambia de tamaño. */
import { PAGINAS_MAX } from '../../../../contenido/taller/Pieza.js';
import { ConfigPagina } from '../../../../contenido/taller/ConfigPagina.js';
import { abrirPdf, leerPagina, medidasDelPdf } from './Pdf.js';

const azar = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
const CADA_CUANTAS = 10;

/* Figma escribe 1 px como 1 punto, asi que los milimetros de su PDF no dicen nada: solo cuenta la proporcion */
const DIFERENCIA_PROPORCION = .01;
const proporcionDistinta = (m, c) => Math.abs((m.anchoMm / m.altoMm) / (c.anchoMm / c.altoMm) - 1) > DIFERENCIA_PROPORCION;

export async function importarPdf(archivo, { be, obra, tx, imagenes, sigue, alProporcion, alPagina, alAviso, alDecir, alError }) {
  let doc;
  try { doc = await abrirPdf(archivo); } catch (e) { alError('pdfNoAbre'); return; }
  try {
    const m = await medidasDelPdf(doc);
    if (m.paginas > PAGINAS_MAX) { alError('pdfLargo'); return; }
    let pagina = obra.pagina, ajuste = 'contener';
    if (proporcionDistinta(m, new ConfigPagina(pagina))) {
      const r = await alProporcion(m);
      if (!r) return;
      ajuste = r.ajuste;
      pagina = r.pagina || pagina;
    }
    const ruta = `taller/${obra.id}/pdf/original-${azar()}.pdf`;
    const s = await be.taller.subir(ruta, archivo);
    if (s.error) { alError(s.error); return; }
    const px = new ConfigPagina(pagina).pxPara(300);
    alDecir(tx.leyendo.replace('{n}', '1').replace('{total}', String(m.paginas)));
    for (let n = 1; n <= m.paginas; n++) {
      if (!sigue()) return;
      const dice = tx.leyendo.replace('{n}', String(n)).replace('{total}', String(m.paginas));
      alAviso(dice);
      if (n % CADA_CUANTAS === 0) alDecir(dice);
      const g = await leerPagina(doc, n, px);
      const fondo = `taller/${obra.id}/pdf/p${String(n).padStart(4, '0')}-${azar()}.${g.ext}`;
      const r = await be.taller.subir(fondo, new File([g.blob], `p${n}.${g.ext}`, { type: g.blob.type }));
      if (r.error) { alError(r.error); return; }
      if (!sigue()) return;
      await imagenes.poner(fondo, g.blob);
      alPagina({ nombre: archivo.name.replace(/\.pdf$/i, ''), fondo, pdf: ruta, anchoMm: m.anchoMm, altoMm: m.altoMm, ajuste, texto: g.texto, alt: '', caja: g.caja, sangre: g.sangre, objetos: [] });
    }
    alDecir(tx.pdfListo);
  } catch (e) {
    if (sigue()) alError('pdfNoAbre');
  } finally {
    alAviso('');
    doc.loadingTask.destroy();
  }
}
