/* Un libro de Recursos subido desde Developer-Mode.

   Los libros de una palabra (ahava, emet, agape, rhema) y los que ya estan en
   data/biblioteca.js se quedan en el codigo (lo decidio el fundador): desde el panel solo
   llegan los NUEVOS. Por eso un libro del panel no puede llamarse como uno de esos.

     id         una palabra en minusculas sin guiones (es su ancla: /es/writing/#libertad)
     seccion    un tema de data/biblioteca.js → SECCIONES
     tipo       'tapa-dura' | 'revista' | 'comic'  (data/biblioteca.js → TIPOS)
     grosor     'fino' | 'medio' | 'grueso' (opcional: si no, sale de las paginas)
     tono       el color del lomo dibujado (scripts/biblioteca.js → TONOS; opcional)
     titulo     { <idioma>: '…' }, obligatorio en su idioma original
     subtitulo  { <idioma>: '…' } (opcional)
     pdf        { <idioma>: 'libros/<id>/<idioma>.pdf' }, obligatorio en el original
     lomo       { <idioma> | 'todos': 'lomos/<id>[.<idioma>]-<azar>.png' } (opcional; PNG
                porque la estanteria, data/lomos.js, sabe medir PNG y no WebP)
     etiquetas  las que el quiera (comun.js → etiquetas) */
import { TipoDeContenido } from './Tipo.js';
import { etiquetas, i18n, idiomaValido, objeto, rutaAlmacen, tiene } from './comun.js';
import { GROSORES } from './medidas.js';
import { SECCIONES, TIPOS, LIBROS_DEL_CODIGO } from '../../data/biblioteca.js';
import { TONOS, RESERVADOS } from '../biblioteca.js';

const ID = /^[a-z][a-z0-9]{0,39}$/;
/* Los del codigo y los otros nombres con que tools/books.py los reconoce (ALIAS): un libro
   del panel llamado «ahavah» ocuparia el sitio del PDF en español de Ahava */
export const ALIAS_DE_BOOKS = ['ahavah', 'agapi'];
const DEL_CODIGO = new Set([...LIBROS_DEL_CODIGO.map((l) => l.id), ...ALIAS_DE_BOOKS]);
const TEMAS = new Set(SECCIONES.map((s) => s.id));
export const TITULO_MAX = 120;
/* Mas letras que estas no caben, en dos columnas, en el lomo automatico mas fino
   (el mismo numero que comprobar() en scripts/biblioteca.js). */
export const TITULO_LARGO = 44;
const EXT_LOMO = ['png'];
const SUFIJO = /^[a-z0-9]{6,16}$/;

export class Libro extends TipoDeContenido {
  /* «biblioteca» y no «libros»: la tabla «libros» de 002 era un esqueleto con otra forma
     (vacia, sin uso); 007 crea esta con la forma del panel sin borrar nada. */
  static tabla = 'biblioteca';

  static campos(d) {
    const lomo = {};
    for (const [k, v] of Object.entries(objeto(d.lomo))) {
      if ((k === 'todos' || idiomaValido(k)) && typeof v === 'string') lomo[k] = v;
    }
    const pdf = {};
    for (const [k, v] of Object.entries(objeto(d.pdf))) if (idiomaValido(k) && typeof v === 'string') pdf[k] = v;
    return {
      seccion: typeof d.seccion === 'string' ? d.seccion : '',
      tipo: typeof d.tipo === 'string' ? d.tipo : '',
      grosor: GROSORES.includes(d.grosor) ? d.grosor : (d.grosor ? String(d.grosor) : ''),
      tono: typeof d.tono === 'string' ? d.tono : '',
      titulo: i18n(d.titulo, TITULO_MAX),
      subtitulo: i18n(d.subtitulo, 160),
      pdf,
      lomo,
      etiquetas: etiquetas(d.etiquetas)
    };
  }

  static idValido(id) { return typeof id === 'string' && ID.test(id) && !RESERVADOS.has(id) && !DEL_CODIGO.has(id); }

  /* Donde va cada archivo en el almacen. null si el id o el idioma no sirven. Con `sufijo`
     (un trozo al azar), el PDF de un borrador no pisa el del libro publicado (008). */
  static rutaPdf(id, lang, sufijo) {
    if (typeof id !== 'string' || !ID.test(id) || !idiomaValido(lang)) return null;
    if (sufijo === undefined) return `libros/${id}/${lang}.pdf`;
    return SUFIJO.test(sufijo) ? `libros/${id}/${lang}-${sufijo}.pdf` : null;
  }
  /* ¿Es `ruta` un PDF de este libro en ese idioma? (con o sin su trozo al azar) */
  static esPdfDe(ruta, id, lang) {
    const m = typeof ruta === 'string' && ruta.match(/^libros\/([a-z][a-z0-9]*)\/([a-z]{2})(?:-([a-z0-9]{6,16}))?\.pdf$/);
    return !!m && m[1] === id && m[2] === lang;
  }
  /* El lomo lleva al final un trozo al azar (`sufijo`): el cajon de las imagenes es
     publico, y el lomo de un BORRADOR no debe poder adivinarse («lomos/libertad.png»).
     Al publicar, la compilacion lo copia con su nombre de siempre (public/assets/lomos/
     <id>.<idioma>.png), que es el que busca la estanteria. */
  static rutaLomo(id, lang, ext, sufijo) {
    if (typeof id !== 'string' || !ID.test(id) || !EXT_LOMO.includes(ext) || !SUFIJO.test(sufijo || '')) return null;
    if (lang == null || lang === 'todos') return `lomos/${id}-${sufijo}.${ext}`;
    return idiomaValido(lang) ? `lomos/${id}.${lang}-${sufijo}.${ext}` : null;
  }
  /* ¿Es `ruta` un lomo de este libro en ese idioma? */
  static esLomoDe(ruta, id, lang) {
    const m = typeof ruta === 'string' && ruta.match(/^lomos\/([a-z][a-z0-9]*)(?:\.([a-z]{2}))?-([a-z0-9]{6,16})\.png$/);
    return !!m && m[1] === id && (lang === 'todos' ? m[2] === undefined : m[2] === lang);
  }

  revisar(r) {
    const e = (campo, clave) => r.errores.push({ campo, clave });
    if (!ID.test(this.id)) e('id', 'formato');
    else if (RESERVADOS.has(this.id) || DEL_CODIGO.has(this.id)) e('id', 'reservado');
    if (!TEMAS.has(this.seccion)) e('seccion', 'noExiste');
    if (!tiene(TIPOS, this.tipo)) e('tipo', 'noExiste');
    if (this.grosor && !GROSORES.includes(this.grosor)) e('grosor', 'noExiste');
    if (this.tono && !tiene(TONOS, this.tono)) e('tono', 'noExiste');

    const original = this.idiomaOriginal;
    if (original && !this.titulo[original]) e('titulo', 'falta');
    if (original && !this.pdf[original]) e('pdf', 'falta');

    for (const [l, ruta] of Object.entries(this.pdf)) {
      if (!rutaAlmacen(ruta, ['pdf'])) e('pdf', 'ruta');
      else if (!Libro.esPdfDe(ruta, this.id, l)) e('pdf', 'ajeno');
    }
    for (const [l, ruta] of Object.entries(this.lomo)) {
      if (!rutaAlmacen(ruta, EXT_LOMO)) e('lomo', 'ruta');
      else if (!Libro.esLomoDe(ruta, this.id, l)) e('lomo', 'ajeno');
    }
    for (const t of Object.values(this.titulo)) {
      if (t.length > TITULO_LARGO) { r.avisos.push({ campo: 'titulo', clave: 'tituloLargo' }); break; }
    }
  }

  datosPropios() {
    return {
      seccion: this.seccion, tipo: this.tipo, grosor: this.grosor, tono: this.tono,
      titulo: { ...this.titulo }, subtitulo: { ...this.subtitulo },
      pdf: { ...this.pdf }, lomo: { ...this.lomo }, etiquetas: [...this.etiquetas]
    };
  }
}
