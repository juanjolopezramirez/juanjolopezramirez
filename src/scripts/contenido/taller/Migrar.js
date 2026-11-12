/* DE LA PRIMERA VERSION DEL TALLER A LA DE AHORA. Corre al abrir un capitulo y al restaurar una copia
   vieja. Sin esto, la limpieza convertiria el bloque viejo en texto y el PDF se perderia.

     · cada `paginasPdf` se vuelve una pagina libre por cada pagina del PDF, y sus zonas, objetos; si
       su pieza ya no existe el bloque se queda y se avisa: no se borra lo unico que la nombra;
     · el titulo del capitulo pasa a ser el primer titulo del texto, como en Word. */
import { objeto } from '../comun.js';

export const VERSION_CONTENIDO = 2;
const TITULO_MAX = 300;                       // el mismo tope de supabase/012_taller.sql
const nuevoObjeto = () => 'o-' + [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('');

function hojasDe(nodo, piezas) {
  const p = (piezas || []).find((x) => x.id === objeto(nodo.attrs).pieza);
  if (!p) return [nodo];
  return p.paginas.map((g) => ({
    type: 'paginaLibre',
    attrs: {
      nombre: p.nombre, fondo: g.ruta, pdf: p.pdf, anchoMm: p.anchoMm, altoMm: p.altoMm, ajuste: p.ajuste, texto: g.texto, alt: g.alt, caja: g.caja, sangre: g.sangre,
      objetos: g.zonas.map((z) => ({ ...z, tipo: 'zona', id: nuevoObjeto() }))
    }
  }));
}

const textoDe = (n) => (n.content || []).map((t) => t.text || '').join('').trim();

export function necesitaMigrar(contenido) { return objeto(contenido).version !== VERSION_CONTENIDO; }

export function aVersion2(capitulo, piezas) {
  const o = objeto(capitulo.contenido), doc = objeto(o.doc);
  const lista = (Array.isArray(doc.content) ? doc.content : []).flatMap((n) => (objeto(n).type === 'paginasPdf' ? hojasDe(n, piezas) : [n]));
  const primero = objeto(lista[0]);
  const tieneTitulo = primero.type === 'heading' && objeto(primero.attrs).level === 1 && textoDe(primero) === String(capitulo.titulo).trim();
  if (capitulo.titulo && !tieneTitulo) lista.unshift({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: capitulo.titulo }] });
  return { version: VERSION_CONTENIDO, doc: { type: 'doc', content: lista } };
}

/* El titulo de un capitulo es su primer titulo */
export function tituloDe(doc) {
  const h = (objeto(doc).content || []).find((n) => objeto(n).type === 'heading');
  return h ? textoDe(h).slice(0, TITULO_MAX).replace(/[\uD800-\uDBFF]$/, '') : '';     // sin medio emoji al final
}
