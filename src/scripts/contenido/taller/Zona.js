/* UNA ZONA: el espacio que el fundador marca sobre una pagina de diseño. Los quizzes y las
   dinamicas vivirán ahi y no se salen de ahi.

   Se guarda en PORCENTAJES de la pagina, asi cae en el mismo sitio a cualquier tamaño. `bloques`
   queda vacio hasta la Fase 4; ya es generico para que un bloque nuevo no cambie estos datos. */
import { objeto, texto } from '../comun.js';

export const ZONA_MIN = 5;           // en % de la pagina
const dos = (n) => Math.round(n * 100) / 100;
const numero = (v, siNo) => (typeof v === 'number' && Number.isFinite(v) ? v : siNo);

export class Zona {
  constructor(d = {}) {
    const o = objeto(d);
    this.id = typeof o.id === 'string' && /^z-[a-z0-9]{8}$/.test(o.id) ? o.id : '';
    this.nombre = texto(o.nombre, 60);
    this.w = dos(Math.min(100, Math.max(ZONA_MIN, numero(o.w, 40))));
    this.h = dos(Math.min(100, Math.max(ZONA_MIN, numero(o.h, 30))));
    this.x = dos(Math.min(100 - this.w, Math.max(0, numero(o.x, 0))));
    this.y = dos(Math.min(100 - this.h, Math.max(0, numero(o.y, 0))));
    this.bloques = (Array.isArray(o.bloques) ? o.bloques : []).map(objeto)
      .filter((b) => typeof b.tipo === 'string' && /^[a-zA-Z]{1,30}$/.test(b.tipo))
      .map((b) => ({ tipo: b.tipo, id: texto(b.id, 40), datos: objeto(b.datos) }));
  }

  /* ¿Toca a otra? Se avisa, no se impide */
  seCruzaCon(z) {
    return this.x < z.x + z.w && z.x < this.x + this.w && this.y < z.y + z.h && z.y < this.y + this.h;
  }

  aDatos() { return { id: this.id, nombre: this.nombre, x: this.x, y: this.y, w: this.w, h: this.h, bloques: this.bloques }; }
}
