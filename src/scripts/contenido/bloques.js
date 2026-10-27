/* Los bloques del editor estilo Notion (Trabajos y Proyectos): cada uno es una clase con
   sus reglas. Un Documento (Documento.js) es una lista de bloques.

   LA REGLA DE ORO: aqui NUNCA se guarda HTML. El texto va en trozos con marcas
   ({ t: 'Hola', b: true }), las imagenes son rutas del almacen, los videos un id de
   YouTube o una pieza de la web, los enlaces solo https / mailto / rutas propias, y los
   «componentes» son una lista cerrada de piezas del sitio. Al pintar (en el panel y en la
   pagina publica) todo entra como texto: lo que alguien escriba nunca se ejecuta.

   Tipos: parrafo, titulo, lista, cita, imagen, video, columnas, boton, separador, componente. */
import { enlaceSeguro, objeto, rutaAlmacen, texto, textoCrudo } from './comun.js';

export const TIPOS_DE_BLOQUE = ['parrafo', 'titulo', 'lista', 'cita', 'imagen', 'video', 'columnas', 'boton', 'separador', 'componente'];

/* Los componentes del sitio que se pueden meter en un documento. Solo estos: el nombre
   elige una pieza ya hecha, no trae codigo. */
export const COMPONENTES = [
  { nombre: 'piezas', titulo: 'Los videos de esta casa' }
];

const TROZO_MAX = 2000;          // letras de un trozo de texto
const TEXTO_BLOQUE_MAX = 20000;  // letras de todo un bloque de texto
const TROZOS_MAX = 200;
const ITEMS_MAX = 100;
const ID = /^b-[a-z0-9]{4,16}$/;
export const nuevoId = () => 'b-' + Math.random().toString(36).slice(2, 10).padEnd(8, '0');

/* Trozos de texto con marcas: { t, b?, i?, href? }. Lo demas se cae. Un enlace peligroso
   se quita y el texto se queda. */
export function trozos(lista) {
  if (!Array.isArray(lista)) return [];
  const salida = [];
  let total = 0;
  for (const x of lista.slice(0, TROZOS_MAX)) {
    const o = objeto(x);
    const t = textoCrudo(o.t, Math.min(TROZO_MAX, TEXTO_BLOQUE_MAX - total));
    if (!t) continue;
    total += t.length;
    const trozo = { t };
    if (o.b) trozo.b = true;
    if (o.i) trozo.i = true;
    if (enlaceSeguro(o.href)) trozo.href = o.href;
    salida.push(trozo);
    if (total >= TEXTO_BLOQUE_MAX) break;
  }
  return salida;
}
const hayTexto = (ts) => ts.some((x) => x.t.trim());

export class Bloque {
  static tipo = '';
  constructor(d) {
    this.tipo = this.constructor.tipo;
    this.id = typeof d.id === 'string' && ID.test(d.id) ? d.id : nuevoId();
  }
  /* Sus reglas: { campo, clave } en r.errores. */
  revisar() {}
  validar() {
    const r = { ok: true, errores: [], avisos: [] };
    this.revisar(r);
    r.ok = r.errores.length === 0;
    return r;
  }
  propios() { return {}; }
  aJSON() { return { tipo: this.tipo, id: this.id, ...this.propios() }; }
}

export class Parrafo extends Bloque {
  static tipo = 'parrafo';
  constructor(d) { super(d); this.texto = trozos(d.texto); }
  propios() { return { texto: this.texto.map((x) => ({ ...x })) }; }
}

export class Titulo extends Bloque {
  static tipo = 'titulo';
  constructor(d) { super(d); this.nivel = d.nivel === 3 ? 3 : 2; this.texto = trozos(d.texto); }
  revisar(r) { if (!hayTexto(this.texto)) r.errores.push({ campo: 'texto', clave: 'falta' }); }
  propios() { return { nivel: this.nivel, texto: this.texto.map((x) => ({ ...x })) }; }
}

export class Lista extends Bloque {
  static tipo = 'lista';
  constructor(d) {
    super(d);
    this.ordenada = d.ordenada === true;
    this.items = (Array.isArray(d.items) ? d.items.slice(0, ITEMS_MAX) : []).map(trozos).filter(hayTexto);
  }
  revisar(r) { if (!this.items.length) r.errores.push({ campo: 'items', clave: 'falta' }); }
  propios() { return { ordenada: this.ordenada, items: this.items.map((it) => it.map((x) => ({ ...x }))) }; }
}

export class Cita extends Bloque {
  static tipo = 'cita';
  constructor(d) { super(d); this.texto = trozos(d.texto); this.autor = texto(d.autor, 120); }
  revisar(r) { if (!hayTexto(this.texto)) r.errores.push({ campo: 'texto', clave: 'falta' }); }
  propios() { return { texto: this.texto.map((x) => ({ ...x })), autor: this.autor }; }
}

const EXT_IMAGEN = ['jpg', 'png', 'webp'];
/* LO QUE NO SIRVE NO SE GUARDA: un enlace, una ruta, un id de video o un componente que
   no pasa su regla se queda VACIO desde el constructor (y validar() lo dice). Asi nada
   peligroso viaja en aJSON(), aunque alguien se saltara validar(). */
const ruta = (v) => (typeof v === 'string' && rutaAlmacen(v, EXT_IMAGEN) && /^(bloques|casas)\//.test(v) ? v : '');

export class Imagen extends Bloque {
  static tipo = 'imagen';
  constructor(d) {
    super(d);
    this.src = ruta(d.src);
    this.alt = texto(d.alt, 300);
    this.pie = texto(d.pie, 300);
    this.decorativa = d.decorativa === true;
    this.ia = d.ia === true;
  }
  revisar(r) {
    if (!this.src) r.errores.push({ campo: 'src', clave: 'ruta' });
    /* Quien no ve la imagen la oye: sin texto alternativo, solo si es de adorno */
    if (!this.alt && !this.decorativa) r.errores.push({ campo: 'alt', clave: 'falta' });
  }
  propios() { return { src: this.src, alt: this.alt, pie: this.pie, decorativa: this.decorativa, ia: this.ia }; }
}

const FUENTES = {
  youtube: /^[A-Za-z0-9_-]{11}$/,
  pieza: /^[a-z0-9]+(-[a-z0-9]+)*$/
};
export class Video extends Bloque {
  static tipo = 'video';
  constructor(d) {
    super(d);
    const patron = typeof d.fuente === 'string' && Object.prototype.hasOwnProperty.call(FUENTES, d.fuente) ? FUENTES[d.fuente] : null;
    this.fuente = patron ? d.fuente : '';
    this.ref = patron && typeof d.ref === 'string' && patron.test(d.ref) ? d.ref : '';
    this.titulo = texto(d.titulo, 160);
    this.ia = d.ia === true;
  }
  revisar(r) {
    if (!this.fuente) r.errores.push({ campo: 'fuente', clave: 'noExiste' });
    else if (!this.ref) r.errores.push({ campo: 'ref', clave: 'formato' });
    /* El reproductor necesita un nombre (lo oye quien no ve) */
    if (!this.titulo) r.errores.push({ campo: 'titulo', clave: 'falta' });
  }
  propios() { return { fuente: this.fuente, ref: this.ref, titulo: this.titulo, ia: this.ia }; }
}

export class Boton extends Bloque {
  static tipo = 'boton';
  constructor(d) {
    super(d);
    this.texto = texto(d.texto, 60);
    const href = typeof d.href === 'string' ? d.href.trim() : '';
    this.href = enlaceSeguro(href) ? href : '';
    this.estilo = d.estilo === 'suave' ? 'suave' : 'lleno';
  }
  revisar(r) {
    if (!this.texto) r.errores.push({ campo: 'texto', clave: 'falta' });
    if (!this.href) r.errores.push({ campo: 'href', clave: 'enlace' });
  }
  propios() { return { texto: this.texto, href: this.href, estilo: this.estilo }; }
}

export class Separador extends Bloque {
  static tipo = 'separador';
}

export class Componente extends Bloque {
  static tipo = 'componente';
  constructor(d) { super(d); this.nombre = COMPONENTES.some((c) => c.nombre === d.nombre) ? d.nombre : ''; }
  revisar(r) { if (!this.nombre) r.errores.push({ campo: 'nombre', clave: 'noExiste' }); }
  propios() { return { nombre: this.nombre }; }
}

/* Columnas: de 2 a 3, cada una con sus bloques. Nunca columnas dentro de columnas
   (en un telefono serian tiras ilegibles): las de dentro se caen. */
export const COLUMNAS_MAX = 3;
export const BLOQUES_POR_COLUMNA = 30;
export class Columnas extends Bloque {
  static tipo = 'columnas';
  constructor(d) {
    super(d);
    const cols = Array.isArray(d.columnas) ? d.columnas.slice(0, COLUMNAS_MAX) : [];
    this.columnas = cols.map((c) => (Array.isArray(c) ? c.slice(0, BLOQUES_POR_COLUMNA) : [])
      .map((b) => crearBloque(b, 1)).filter(Boolean));
  }
  revisar(r) {
    if (this.columnas.length < 2) r.errores.push({ campo: 'columnas', clave: 'pocas' });
    this.columnas.forEach((col, i) => col.forEach((b, j) => {
      for (const e of b.validar().errores) r.errores.push({ campo: `columnas.${i}.${j}.${e.campo}`, clave: e.clave });
    }));
  }
  propios() { return { columnas: this.columnas.map((col) => col.map((b) => b.aJSON())) }; }
}

const CLASES = { parrafo: Parrafo, titulo: Titulo, lista: Lista, cita: Cita, imagen: Imagen, video: Video, columnas: Columnas, boton: Boton, separador: Separador, componente: Componente };

/* Un bloque a partir de lo que llega, o null si su tipo no existe. `profundidad` 1 es
   dentro de unas columnas: ahi no caben otras columnas. */
export function crearBloque(datos, profundidad = 0) {
  const d = objeto(datos);
  if (typeof d.tipo !== 'string' || !TIPOS_DE_BLOQUE.includes(d.tipo)) return null;
  if (d.tipo === 'columnas' && profundidad > 0) return null;
  return new CLASES[d.tipo](d);
}
