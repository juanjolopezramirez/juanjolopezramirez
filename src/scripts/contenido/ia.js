/* Avisar lo que hizo la IA. Lo pidio el fundador (2026-10-27): poder decir que una
   traduccion se hizo con IA, y que partes de un libro, una casa o una etapa se hicieron
   con IA, para que quien lo lea lo sepa. Es la misma honestidad que el resto del sitio
   (marcar lo que es seguro y lo que no; capitulo 9 del marco).

     partes        que se hizo con IA, de la lista PARTES_IA
     traducciones  en que idiomas la traduccion la hizo una IA (nunca el original)
     nota          una frase suya, si quiere explicarlo («La portada la hice con IA.») */
import { idiomaValido, objeto, texto } from './comun.js';

export const PARTES_IA = ['texto', 'portada', 'lomo', 'imagenes', 'video', 'voz', 'musica', 'codigo'];
export const NOTA_MAX = 280;

const unicos = (lista, vale) => (Array.isArray(lista) ? [...new Set(lista.filter(vale))] : []);

export class UsoDeIA {
  constructor(datos) {
    const d = objeto(datos);
    this.partes = unicos(d.partes, (p) => PARTES_IA.includes(p));
    this.traducciones = unicos(d.traducciones, idiomaValido);
    this.nota = texto(d.nota, NOTA_MAX);
  }

  /* ¿Hay algo que avisar? */
  get hay() { return this.partes.length > 0 || this.traducciones.length > 0 || !!this.nota; }

  traducidoConIA(lang) { return this.traducciones.includes(lang); }

  validar(idiomaOriginal) {
    const errores = [];
    if (idiomaOriginal && this.traducciones.includes(idiomaOriginal)) errores.push({ campo: 'ia.traducciones', clave: 'original' });
    return { ok: errores.length === 0, errores, avisos: [] };
  }

  aFila() { return { partes: [...this.partes], traducciones: [...this.traducciones], nota: this.nota }; }
}
