/* UN CAPITULO ABIERTO EN LA MESA: su editor, su guardado y sus hojas.

   LAS HOJAS LAS CORTA EL NAVEGADOR. El texto vive en columnas de la altura exacta de la caja de texto
   (`column-wrap`), una debajo de otra, y el papel blanco se dibuja detras. Una pagina libre es un
   bloque que llena su columna, con la hoja entera por encima. Asi cada corte de pantalla es el mismo
   del PDF, porque el motor es el mismo (la prueba de la Etapa 1 lo comprobo pagina por pagina). */
import { variablesDe } from '../../../../contenido/taller/colores.js';
import { Autoguardado } from './Autoguardado.js';
import { crearEditor } from './Editor.js';
import { limpiarContenido, cabeEnElCapitulo, propiosDe } from '../../../../contenido/taller/TextoLibro.js';
import { tituloDe } from '../../../../contenido/taller/Migrar.js';
import { conAnclas } from '../../../../contenido/taller/IndiceLibro.js';
import { ladoDelNumero } from '../../../../contenido/taller/ConfigPagina.js';

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };

/* El numero de la hoja donde lo pone el PDF: entre los margenes, a media altura del margen de abajo, del lado
   que dice la tabla del libro. Tambien lo usan las hojas del contenido. */
export function piePagina(n, top, p, lugar) {
  const e = crear('div', `pie pie--${ladoDelNumero(lugar, n)}`, String(n));
  Object.assign(e.style, { left: `${p.ml}px`, right: `${p.mr}px`, top: `${top + p.H - p.mb / 2}px` });
  return e;
}

export class CapituloVivo {
  constructor(cap, mesa) {
    this.cap = cap;
    this.mesa = mesa;
    this.filas = [];                  // { fila, vista } vista = la hoja libre de esa fila, o null
    this.caja = crear('section', 'corrida');
    this.caja.dataset.c = cap.id;
    const c = crear('div', 'corrida__texto');
    this.caja.append(c);
    /* Un capitulo de antes de las anclas recibe las suyas al abrirse, siempre las mismas (salen del id del
       capitulo): asi la mesa y el PDF las nombran igual, y se guardan con el primer cambio */
    const leido = limpiarContenido(cap.contenido).contenido;
    leido.doc = conAnclas(leido.doc, cap.id);
    cap.contenido = leido;
    this.papel = leido.papel || '';
    /* El nombre puesto a mano ('' = el primer titulo del texto), si sale en el contenido y si lleva numero */
    this.ponerPropios(propiosDe(leido));
    this.pintarPapel();
    this.guardado = new Autoguardado({ guardar: () => this.guardar(), alEstado: (e) => mesa.alEstado(this, e) });
    this.editor = crearEditor(c, {
      contenido: leido.doc, tx: mesa.tx, etiqueta: `${mesa.tx.etiquetaEditor}: ${cap.titulo || mesa.tx.capitulo}`, idioma: mesa.idioma(), mesa, editable: mesa.editable,
      alCambiar: () => { this.guardado.marcar(); mesa.alEscribir(this); },
      alMover: () => mesa.alMoverCursor(this),
      alEnfocar: () => mesa.alEnfocarEditor(this),
      alBarra: () => mesa.entrarACinta(),
      alProtegerPagina: () => mesa.decir(mesa.tx.paginaProtegida),
      alDeshacerPagina: () => mesa.decir(mesa.tx.deshacerPagina)
    });
  }

  get doc() { return this.editor.getJSON(); }

  /* Lo propio del capitulo (TextoLibro.propiosDe): todas las copias pasan por aqui */
  propios() { return { titulo: this.tituloPropio, enIndice: this.enIndice, numerar: this.numerar }; }
  ponerPropios(p) { this.tituloPropio = p.titulo || ''; this.enIndice = p.enIndice !== false; this.numerar = p.numerar !== false; }

  /* El color de este capitulo. Sin el suyo, cada hoja hereda el del libro. */
  pintarPapel() {
    const v = this.papel ? variablesDe(this.papel) : { '--hoja-papel': '', '--hoja-tinta': '', '--hoja-enlace': '' };
    for (const [k, x] of Object.entries(v)) this.caja.style.setProperty(k, x);
  }

  /* Cambiar el texto sin dejar rastro en «deshacer»: un Ctrl+Z de mas no debe traer otro texto */
  ponerTexto(doc) { this.editor.chain().setMeta('addToHistory', false).setContent(doc, { emitUpdate: false }).run(); }

  async guardar() {
    const c = this.cap, limpio = limpiarContenido({ doc: this.doc, papel: this.papel, ...this.propios() });
    if (!cabeEnElCapitulo(limpio)) return { error: 'lleno' };
    c.contenido = limpio.contenido;
    c.letras = limpio.letras;
    c.titulo = limpio.contenido.titulo || tituloDe(limpio.contenido.doc);
    let r = await this.mesa.be.taller.guardarCapitulo(c.aDatos(), this.mesa.pestana);
    if (r.reintentar) { c.rev = r.rev; r = await this.mesa.be.taller.guardarCapitulo(c.aDatos(), this.mesa.pestana); }
    if (r.ok) { c.rev = r.rev; return { ok: true }; }
    return r;
  }

  /* Cuantas hojas ocupa, cuales son libres, y sus numeros */
  /* `pie`: { lugar, ver } como el libro; `portada`: sus hojas de texto no llevan numero (en el PDF tampoco) */
  medir(numeroInicial, p, z, segura, pie = {}) {
    const f = this.editor.view.dom, paso = p.H + p.gap;
    const n = Math.max(1, Math.round((f.offsetHeight + (paso - p.alto)) / paso));
    this.caja.style.height = `${n * p.H + (n - 1) * p.gap}px`;
    const arriba = f.getBoundingClientRect().top;
    const libres = new Map();
    for (const v of this.mesa.vistas) {
      if (v.editor !== this.editor) continue;
      const fila = Math.round((v.dom.getBoundingClientRect().top - arriba) / z / paso);
      libres.set(fila, v);
    }
    this.caja.querySelectorAll('.pie, .seg--texto').forEach((x) => x.remove());
    this.filas = [];
    for (let i = 0; i < n; i++) {
      const vista = libres.get(i) || null;
      this.filas.push({ fila: i, vista });
      if (vista) continue;
      const top = i * paso;
      if (pie.ver && !pie.portada) this.caja.append(piePagina(numeroInicial + i, top, p, pie.lugar));
      if (segura) {
        const s = crear('div', 'seg seg--texto');
        Object.assign(s.style, { left: `${p.ml}px`, right: `${p.mr}px`, top: `${top + p.mt}px`, height: `${p.alto}px` });
        s.append(crear('span', '', this.mesa.tx.zonaSegura));
        this.caja.append(s);
      }
    }
    return n;
  }

  /* El primer bloque que cae en una fila: ahi se suelta una pagina libre. Nunca parte un parrafo. */
  posicionDeFila(fila, p, z) {
    const v = this.editor.view, arriba = v.dom.getBoundingClientRect().top, paso = p.H + p.gap;
    let pos = 0, hallada = null;
    v.state.doc.forEach((n, inicio) => {
      if (hallada !== null) return;
      const c = v.coordsAtPos(Math.min(inicio + 1, v.state.doc.content.size));
      const f = Math.round((c.top - arriba) / z / paso - .3);
      if (f >= fila) hallada = inicio;
      pos = inicio + n.nodeSize;
    });
    return hallada === null ? pos : hallada;
  }

  soltar() { this.guardado.soltar(); this.editor.destroy(); }
}
