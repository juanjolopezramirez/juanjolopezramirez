/* Un documento del editor estilo Notion: la pagina de una casa (Trabajos y Proyectos),
   en un idioma. Es una lista de bloques (bloques.js) con dos topes, para que un pegado
   enorme no llene la base ni cuelgue la pagina:
     MAX_BLOQUES  bloques de primer nivel
     MAX_BYTES    lo que pesa todo el documento en JSON
   Lo que no cabe o no se entiende se cae (y se cuenta en `descartados`, para avisar). */
import { crearBloque, nuevoId } from './bloques.js';
import { objeto } from './comun.js';

export class Documento {
  static MAX_BLOQUES = 300;
  static MAX_BYTES = 200000;

  constructor(datos) {
    const d = objeto(datos);
    const lista = Array.isArray(d.bloques) ? d.bloques : [];
    this.bloques = [];
    this.descartados = 0;
    const ids = new Set();
    let peso = 2;
    for (const b of lista) {
      if (this.bloques.length >= Documento.MAX_BLOQUES) { this.descartados += 1; continue; }
      const bloque = crearBloque(b);
      if (!bloque) { this.descartados += 1; continue; }
      /* Cada bloque, su id: dos con el mismo (un copiar y pegar) se separan */
      while (ids.has(bloque.id)) bloque.id = nuevoId();
      const tam = JSON.stringify(bloque.aJSON()).length + 1;
      if (peso + tam > Documento.MAX_BYTES) { this.descartados += 1; continue; }
      peso += tam;
      ids.add(bloque.id);
      this.bloques.push(bloque);
    }
  }

  get vacio() { return this.bloques.length === 0; }

  validar() {
    const r = { ok: true, errores: [], avisos: [] };
    this.bloques.forEach((b, i) => {
      for (const e of b.validar().errores) r.errores.push({ campo: `bloques.${i}.${e.campo}`, clave: e.clave });
    });
    if (this.descartados) r.avisos.push({ campo: 'bloques', clave: 'descartados' });
    r.ok = r.errores.length === 0;
    return r;
  }

  aJSON() { return { version: 1, bloques: this.bloques.map((b) => b.aJSON()) }; }
}
