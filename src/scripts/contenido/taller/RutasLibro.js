/* LAS IMAGENES QUE USA UN LIBRO: las de cada capitulo (imagenes, fondos y objetos de las paginas libres) y la de
   arriba de la hoja del contenido, que vive en el libro y no en un capitulo. El PDF las necesita todas, y la copia
   completa del libro tambien: si una faltara aqui, saldria una caja vacia o una copia sin ella. */
import { objeto } from '../comun.js';
import { ConfigPagina } from './ConfigPagina.js';

function recorrer(n, fn) {
  if (!n || typeof n !== 'object') return;
  fn(n);
  (Array.isArray(n.content) ? n.content : []).forEach((h) => recorrer(h, fn));
}

/* Las de un capitulo (su `doc`) */
export function rutasDe(doc, salida = new Set()) {
  recorrer(doc, (n) => {
    const a = objeto(n.attrs);
    if (n.type === 'imagen' && a.ruta) salida.add(a.ruta);
    if (n.type === 'paginaLibre') {
      if (a.fondo) salida.add(a.fondo);
      (Array.isArray(a.objetos) ? a.objetos : []).forEach((o) => { if (o && o.ruta) salida.add(o.ruta); });
    }
  });
  return salida;
}

/* Las de todo el libro. `capitulos`: los guardados ({ contenido: { doc } }). `impreso`: solo lo que sale en el PDF
   (sin hoja de contenido, su imagen no hace falta; la copia del libro la guarda igual). */
export function rutasDelLibro(obra, capitulos, { impreso = false } = {}) {
  const salida = new Set();
  (Array.isArray(capitulos) ? capitulos : []).forEach((c) => rutasDe(objeto(objeto(c).contenido).doc || {}, salida));
  const ind = new ConfigPagina(objeto(obra).pagina).indice;
  if (ind.imagen.ruta && (ind.ver || !impreso)) salida.add(ind.imagen.ruta);
  return salida;
}
