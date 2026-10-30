/* La base de todo lo que se edita en Developer-Mode: Libro, Trabajo, Proyecto, Etapa.

   Lo comun a todos:
     id              su nombre en la direccion; cada hija dice como es uno bueno
     idiomaOriginal  en que idioma se escribio (cualquiera de comun.js → IDIOMAS)
     ia              lo que hizo la IA (ia.js), para avisarlo a quien lo lea
     publicado       true solo si el fundador lo publico; todo nace borrador
     orden           su sitio en la lista (menor, antes)

   Cada hija dice:
     static tabla             la tabla de la base donde vive (supabase/007_*.sql)
     static campos(d)         sus campos propios, ya limpios, a partir de lo que llega
     revisar(r)               sus reglas: añade a r.errores / r.avisos { campo, clave }
   y hereda el resto: validar(), textoEn(), idiomaDe(), aFila() y deFila(). */
import { deFila, aFila, entero, idiomaValido, objeto, resultado, cerrar, tiene, WEB } from './comun.js';
import { UsoDeIA } from './ia.js';

export class TipoDeContenido {
  static tabla = '';

  constructor(datos) {
    if (new.target === TipoDeContenido) throw new Error('TipoDeContenido no se usa sola: usa una clase hija (Libro, Trabajo, Proyecto, Etapa).');
    /* Lo mismo vale una fila de la base (snake_case) que un formulario (camelCase). */
    const d = deFila(objeto(datos));
    this.id = typeof d.id === 'string' ? d.id.trim() : '';
    this.idiomaOriginal = idiomaValido(d.idiomaOriginal) ? d.idiomaOriginal : '';
    this.ia = new UsoDeIA(d.ia);
    this.publicado = d.publicado === true;
    this.orden = entero(d.orden, 0, 100000, 0);
    Object.assign(this, this.constructor.campos(d));
  }

  /* Los campos propios de cada hija. */
  static campos() { return {}; }

  /* En que orden se buscan los idiomas al pintar: el pedido, el original, el español y,
     si no, cualquiera que haya. */
  ordenIdiomas(lang) {
    return [...new Set([idiomaValido(lang) ? lang : null, this.idiomaOriginal || null, 'es', ...WEB].filter(Boolean))];
  }

  /* El texto de un campo en varios idiomas, en `lang` o en el mas cercano que haya.
     (No se llama «texto»: una Etapa tiene un campo con ese nombre y lo taparia.) */
  textoEn(campo, lang) {
    const l = this.idiomaDe(campo, lang);
    return l ? this[campo][l] : '';
  }

  /* El idioma en que sale ese texto (para la marca «Escrito en portugués»), o null. */
  idiomaDe(campo, lang) {
    const v = tiene(this, campo) ? this[campo] : null;
    if (!v || typeof v !== 'object') return null;
    for (const l of this.ordenIdiomas(lang)) if (tiene(v, l) && v[l]) return l;
    const otro = Object.keys(v).find((l) => idiomaValido(l) && v[l]);
    return otro || null;
  }

  /* Las reglas de cada hija. */
  revisar() {}

  /* `borrador`: lo que se guarda A MEDIAS (008, la tabla borradores). Lo que falta se perdona
     (se pide al publicar); lo que esta, tiene que estar BIEN: un enlace peligroso, una ruta
     ajena o un id que no vale no se guardan ni en un borrador. */
  validar({ borrador = false } = {}) {
    const r = resultado();
    if (!idiomaValido(this.idiomaOriginal)) r.errores.push({ campo: 'idiomaOriginal', clave: 'falta' });
    r.errores.push(...this.ia.validar(this.idiomaOriginal).errores);
    this.revisar(r);
    if (borrador) {
      r.faltan = r.errores.filter((x) => x.clave === 'falta');
      r.errores = r.errores.filter((x) => x.clave !== 'falta' || x.campo === 'id');
    }
    return cerrar(r);
  }

  /* Lo que se guarda en la base: los campos en snake_case. */
  datos() {
    return {
      id: this.id,
      idiomaOriginal: this.idiomaOriginal,
      ia: this.ia.aFila(),
      publicado: this.publicado,
      orden: this.orden,
      ...this.datosPropios()
    };
  }
  datosPropios() { return {}; }
  aFila() { return aFila(this.datos()); }

  static deFila(fila) { return new this(fila); }
}
