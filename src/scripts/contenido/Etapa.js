/* Una etapa de «¿Por dónde he caminado?» (Sobre el camino), como las de data/camino.js:

     id      minusculas, cifras y guiones
     cuando  el año, cuatro cifras
     titulo  { <idioma>: '…' } dice que paso, no donde
     texto   { <idioma>: '…' } una o dos frases, para un niño que acaba de aprender a leer

   Las de camino.js se quedan en el codigo (las confirmo el fundador una a una); desde el
   panel llegan las nuevas y se ponen en su año, ANTES de «Hoy»: la etapa donde termina
   la linea es una sola y vive en camino.js (por eso aqui no hay `hoy`). */
import { TipoDeContenido } from './Tipo.js';
import { i18n } from './comun.js';

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const TEXTO_CORTO = 240;

export class Etapa extends TipoDeContenido {
  static tabla = 'etapas';

  static campos(d) {
    return {
      cuando: typeof d.cuando === 'string' ? d.cuando.trim() : '',
      titulo: i18n(d.titulo, 80),
      texto: i18n(d.texto, 600)
    };
  }

  revisar(r) {
    const e = (campo, clave) => r.errores.push({ campo, clave });
    if (!ID.test(this.id) || this.id.length > 40) e('id', 'formato');
    if (!/^\d{4}$/.test(this.cuando)) e('cuando', 'formato');
    const original = this.idiomaOriginal;
    if (original && !this.titulo[original]) e('titulo', 'falta');
    if (original && !this.texto[original]) e('texto', 'falta');
    if (Object.values(this.texto).some((t) => t.length > TEXTO_CORTO)) r.avisos.push({ campo: 'texto', clave: 'textoLargo' });
  }

  datosPropios() {
    return { cuando: this.cuando, titulo: { ...this.titulo }, texto: { ...this.texto } };
  }
}
