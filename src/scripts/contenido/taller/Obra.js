/* UNA OBRA: un libro o un escrito en el Taller. Un CAPITULO es una fila aparte: el guardado
   automatico solo envia el que esta abierto, y un libro de 200 capitulos no pesa al escribir. */
import { objeto } from '../comun.js';
import { textoLibro } from './TextoLibro.js';
import { ConfigPagina } from './ConfigPagina.js';
import { listaDeFuentes } from './fuentes.js';

export const CAPITULOS_MAX = 200;

export class Obra {
  constructor(d = {}) {
    const o = objeto(d);
    this.id = typeof o.id === 'string' ? o.id.slice(0, 40) : '';
    this.titulo = textoLibro(o.titulo).trim().slice(0, 200);
    this.idioma = typeof o.idioma === 'string' && /^[a-z]{2}$/.test(o.idioma) ? o.idioma : 'es';
    this.pagina = new ConfigPagina(o.pagina);
    this.fuentes = listaDeFuentes(o.fuentes);
    this.rev = Number.isInteger(o.rev) ? o.rev : 1;
    /* El libro de Recursos de este libro (supabase/014), o ''. Solo se lee: el guardado (aDatos) nunca lo manda, asi
       el autoguardado no lo pisa; se pone con `vincularLibro`. */
    const libro = o.libroId !== undefined ? o.libroId : o.libro_id;
    this.libroId = typeof libro === 'string' && /^[a-z][a-z0-9]{0,39}$/.test(libro) ? libro : '';
  }

  errores() { return [...(this.titulo ? [] : ['titulo']), ...this.pagina.errores()]; }
  aDatos() { return { id: this.id, titulo: this.titulo, idioma: this.idioma, pagina: this.pagina.aDatos(), fuentes: this.fuentes, rev: this.rev }; }
}

export class Capitulo {
  constructor(d = {}) {
    const o = objeto(d);
    this.id = typeof o.id === 'string' ? o.id.slice(0, 40) : '';
    this.obraId = typeof o.obraId === 'string' ? o.obraId.slice(0, 40) : '';
    this.orden = Number.isInteger(o.orden) && o.orden >= 0 ? o.orden : 0;
    this.titulo = textoLibro(o.titulo).trim().slice(0, 300);
    this.contenido = objeto(o.contenido);
    this.letras = Number.isInteger(o.letras) && o.letras >= 0 ? o.letras : 0;
    this.rev = Number.isInteger(o.rev) ? o.rev : 1;
  }

  aDatos() { return { id: this.id, obraId: this.obraId, orden: this.orden, titulo: this.titulo, contenido: this.contenido, letras: this.letras, rev: this.rev }; }
}
