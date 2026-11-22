/* LA BURBUJA DE LO ELEGIDO: al elegir letras en el texto de un capitulo aparece, junto a ellas (nunca encima), una tira con
   «Definición», «Referencia bíblica» y el rodillo de «Copiar estilo». Si lo elegido parece una referencia, «Referencia bíblica» va primero y
   resaltada (estiloCopiado.js → ordenDeNotas). Las notas las abre NotaEditor.js; la cinta no se toca.

   - Teclado: Alt+B lleva el foco a la burbuja; flechas para moverse; Escape la esconde y vuelve al texto.
   - Raton y dedo: aparece al soltar (no mientras se arrastra) y se queda dentro de la mesa.
   - El rodillo, como en Word: un clic copia el estilo de lo elegido (o de donde esta el cursor) y lo pega en lo PROXIMO que se
     elija; doble clic (o Mayús+Enter) lo deja puesto hasta Escape o un clic mas. Cada pegada es un solo paso de Ctrl+Z.
     Que se copia: estiloCopiado.js. Sin dependencias nuevas: la burbuja se pone sola con el rectangulo de la seleccion. */
import { closeHistory } from '@tiptap/pm/history';
import { MARCAS_DE_ESTILO, bloqueEntero, bloquePintado, capturarEstilo, ordenDeNotas } from '../../../../contenido/taller/estiloCopiado.js';

const AIRE = 8;
const ESPERA_TACTIL_MS = 550;
/* El rodillo, en la caja de 16 y el trazo de los demas iconos del Taller (iconos.js) */
export const TRAZO_RODILLO = 'M3.5 2.5h8a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1ZM12.5 4.5h1.25v3.75H8v2.25M7 10.5h2v3.5H7Z';
const SVG = 'http://www.w3.org/2000/svg';

function icono(d) {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('class', 'tal-svg');
  s.setAttribute('viewBox', '0 0 16 16');
  s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(SVG, 'path');
  p.setAttribute('d', d);
  s.append(p);
  return s;
}
const boton = (clase, texto) => { const b = document.createElement('button'); b.type = 'button'; b.className = clase; if (texto) b.textContent = texto; return b; };

export class Burbuja {
  /* `mesa`: el nodo de la mesa (data-tal-mesa). `editor()`: el del capitulo activo. `notas`: la ventana de las notas. */
  constructor(mesa, { tx, editor, notas, idioma, alDecir }) {
    Object.assign(this, { mesa, tx, editor, notas, idioma, alDecir });
    this.pincel = null;
    this.abajo = false;
    this.armar();
    const revisar = () => { cancelAnimationFrame(this.cuadro); this.cuadro = requestAnimationFrame(() => this.revisar()); };
    document.addEventListener('selectionchange', () => { revisar(); this.esperarTactil(); });
    document.addEventListener('pointerdown', (e) => {
      if (this.caja.contains(e.target)) return;
      this.tactil = e.pointerType === 'touch';
      this.abajo = true;
      this.esconder();
    }, true);
    const soltar = () => { if (!this.abajo) return; this.abajo = false; setTimeout(() => { this.revisar(); this.intentarPintar(); }, 0); };
    document.addEventListener('pointerup', soltar, true);
    document.addEventListener('pointercancel', () => { this.abajo = false; revisar(); }, true);
    document.addEventListener('keyup', (e) => { if (e.key === 'Shift') this.intentarPintar(); revisar(); }, true);
    document.addEventListener('keydown', (e) => this.tecla(e), true);
    /* Al moverse la mesa (rueda, zoom) la burbuja sigue a lo elegido */
    document.addEventListener('scroll', () => { if (!this.caja.hidden) revisar(); }, true);
    addEventListener('resize', revisar);
    /* Al cerrar la mesa (o cambiar de libro) el rodillo se suelta y la burbuja se va */
    if (this.mesa) new MutationObserver(() => { if (this.mesa.hidden || !this.mesa.isConnected) this.soltarTodo(); }).observe(this.mesa, { attributes: true, attributeFilter: ['hidden'] });
  }

  /* Sin rodillo ni burbuja: la mesa se cerro, o el editor del que se copio ya no existe */
  soltarTodo() {
    this.esconder();
    if (this.pincel) { this.pincel = null; this.pintarEstado(); }
  }

  armar() {
    const tx = this.tx;
    const c = this.caja = document.createElement('div');
    c.className = 'tal-burbuja';
    c.setAttribute('role', 'toolbar');
    c.setAttribute('aria-label', tx.bbEtiqueta);
    c.setAttribute('aria-keyshortcuts', 'Alt+B');
    c.hidden = true;
    this.bDef = boton('tal-burbuja__b', tx.notaDef);
    this.bCita = boton('tal-burbuja__b', tx.notaCita);
    this.bDef.dataset.tipo = 'definicion';
    this.bCita.dataset.tipo = 'citaBiblica';
    this.sep = document.createElement('span');
    this.sep.className = 'tal-burbuja__sep';
    this.sep.setAttribute('aria-hidden', 'true');
    this.rodillo = boton('tal-burbuja__b tal-burbuja__rodillo');
    this.rodillo.append(icono(TRAZO_RODILLO));
    this.rodillo.setAttribute('aria-label', tx.bbRodillo);
    this.rodillo.setAttribute('aria-pressed', 'false');
    this.rodillo.title = tx.bbRodilloAyuda;
    c.append(this.bDef, this.bCita, this.sep, this.rodillo);
    (this.mesa || document.body).append(c);
    /* Como la cinta: un clic aqui no le quita al texto lo elegido */
    c.addEventListener('mousedown', (e) => e.preventDefault());
    for (const b of [this.bDef, this.bCita]) b.addEventListener('click', () => { const t = b.dataset.tipo; this.esconder(); this.notas.desdeBoton(t); });
    this.rodillo.addEventListener('click', (e) => {
      if (e.detail > 1) return;                                     // el segundo clic de un doble clic lo atiende `dblclick`
      if (this.pincel) { this.apagar(); return; }
      this.encender(e.shiftKey);
    });
    this.rodillo.addEventListener('dblclick', () => { if (!this.pincel) this.encender(true); else this.fijar(); });
    c.addEventListener('keydown', (e) => {
      const bs = this.botones(), i = bs.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (this.pincel) this.apagar(); this.volverAlTexto(); return; }
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d && i >= 0) { e.preventDefault(); bs[(i + d + bs.length) % bs.length].focus(); }
    });
  }

  botones() { return [...this.caja.querySelectorAll('button')]; }

  /* ---- Ver y esconder ---- */
  seleccion() {
    const ed = this.editor();
    if (!ed || ed.isDestroyed || !ed.isEditable) return null;
    const s = ed.state.selection;
    if (s.empty || s.node || !s.$from.parent.inlineContent || !s.$to.parent.inlineContent) return null;
    return { ed, desde: s.from, hasta: s.to };
  }

  revisar() {
    if (this.pincel && (!this.editor() || (this.mesa && this.mesa.hidden))) this.soltarTodo();
    const enLaCaja = this.caja.contains(document.activeElement);
    const s = this.seleccion();
    if (!s || this.abajo || (!s.ed.view.hasFocus() && !enLaCaja)) { if (!enLaCaja) this.esconder(); return; }
    /* Para ordenar los botones basta el comienzo de lo elegido: nunca se lee un capitulo entero */
    const texto = s.ed.state.doc.textBetween(s.desde, Math.min(s.hasta, s.desde + 400), ' ', ' ');
    const orden = ordenDeNotas(texto, this.idioma());
    const [primero, segundo] = orden.map((t) => (t === 'definicion' ? this.bDef : this.bCita));
    if (this.caja.firstChild !== primero) this.caja.insertBefore(primero, this.caja.firstChild);
    if (primero.nextSibling !== segundo) this.caja.insertBefore(segundo, primero.nextSibling);
    this.bCita.classList.toggle('tal-burbuja__b--sugerida', orden[0] === 'citaBiblica');
    this.mostrar(s);
  }

  /* Junto a lo elegido: arriba si cabe, si no abajo; nunca tapa las letras y nunca sale de la mesa */
  mostrar(s) {
    const r = this.rectDe(s);
    if (!r) { this.esconder(); return; }
    const fondo = (this.mesa && this.mesa.querySelector('.tal-fondo')) || null;
    const lim = fondo ? fondo.getBoundingClientRect() : { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    /* Lo elegido salio de la vista de la mesa: la burbuja no se queda flotando en el borde */
    if (r.bottom < lim.top || r.top > lim.bottom) { this.esconder(); return; }
    this.caja.hidden = false;
    const w = this.caja.offsetWidth, h = this.caja.offsetHeight;
    let y = r.top - h - AIRE;
    if (y < lim.top + AIRE) y = r.bottom + AIRE;
    if (y + h > lim.bottom - AIRE) y = Math.max(lim.top + AIRE, r.top - h - AIRE);
    const x = Math.min(Math.max(r.left + r.width / 2 - w / 2, lim.left + AIRE), lim.right - w - AIRE);
    this.caja.style.left = `${Math.round(x)}px`;
    this.caja.style.top = `${Math.round(y)}px`;
    requestAnimationFrame(() => this.caja.classList.add('tal-burbuja--ver'));
  }

  rectDe(s) {
    const sel = getSelection();
    if (sel && sel.rangeCount && s.ed.view.dom.contains(sel.anchorNode)) {
      const r = sel.getRangeAt(0).getBoundingClientRect();
      if (r.width || r.height) return r;
    }
    try {
      const a = s.ed.view.coordsAtPos(s.desde), b = s.ed.view.coordsAtPos(s.hasta);
      const left = Math.min(a.left, b.left), right = Math.max(a.right, b.right), top = Math.min(a.top, b.top), bottom = Math.max(a.bottom, b.bottom);
      return { left, right, top, bottom, width: right - left, height: bottom - top };
    } catch { return null; }
  }

  esconder() {
    if (this.caja.hidden) return;
    this.caja.classList.remove('tal-burbuja--ver');
    this.caja.hidden = true;
  }

  volverAlTexto() {
    this.esconder();
    const ed = this.editor();
    if (ed && !ed.isDestroyed) ed.commands.focus();
  }

  tecla(e) {
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyB' && this.seleccion()) {
      e.preventDefault();
      this.revisar();
      const b = this.botones()[0];
      if (b && !this.caja.hidden) b.focus();
      return;
    }
    if (e.key !== 'Escape' || this.caja.contains(e.target) || document.querySelector('dialog[open]')) return;
    if (this.pincel) { e.preventDefault(); this.apagar(); return; }
    const ed = this.editor();
    if (!this.caja.hidden && ed && ed.view.dom.contains(e.target)) { e.preventDefault(); this.esconder(); }
  }

  /* ---- El rodillo ---- */
  encender(fijo) {
    const ed = this.editor();
    if (!ed || ed.isDestroyed) return;
    const st = ed.state, { from, to, empty, $from } = st.selection;
    /* El estilo de la primera letra elegida (o el de donde esta el cursor) y el de su parrafo */
    let marcas = empty ? (st.storedMarks || $from.marks()) : null;
    if (!marcas) st.doc.nodesBetween(from, to, (n) => { if (!marcas && n.isText) marcas = n.marks; return !marcas; });
    const estilo = capturarEstilo((marcas || []).map((m) => m.toJSON()), $from.parent.toJSON());
    this.pincel = { estilo, fijo: !!fijo, ed, desde: from, hasta: to, ultimo: '' };
    this.pintarEstado();
    this.alDecir(fijo ? this.tx.bbPintandoFijo : this.tx.bbPintando);
  }

  fijar() {
    if (!this.pincel) return;
    this.pincel.fijo = true;
    this.pintarEstado();
    this.alDecir(this.tx.bbPintandoFijo);
  }

  apagar() {
    if (!this.pincel) return;
    this.pincel = null;
    this.pintarEstado();
    this.alDecir(this.tx.bbApagado);
  }

  pintarEstado() {
    const p = this.pincel;
    this.rodillo.setAttribute('aria-pressed', String(!!p));
    if (p && p.fijo) this.rodillo.dataset.fijo = '1'; else delete this.rodillo.dataset.fijo;
    if (this.mesa) this.mesa.classList.toggle('tal-pintando', !!p);
  }

  /* Con el dedo no hay «soltar» despues de elegir: se espera a que la seleccion se quede quieta */
  esperarTactil() {
    if (!this.pincel || !this.tactil) return;
    clearTimeout(this.relojTactil);
    this.relojTactil = setTimeout(() => { if (!this.abajo) this.intentarPintar(); }, ESPERA_TACTIL_MS);
  }

  intentarPintar() {
    const p = this.pincel, s = this.seleccion();
    if (!p || !s) return;
    const llave = `${s.desde}-${s.hasta}`;
    /* Lo mismo de donde se copio, o lo que se acaba de pintar, no cuenta como «lo proximo» */
    if ((s.ed === p.ed && s.desde === p.desde && s.hasta === p.hasta) || llave === p.ultimo) return;
    this.pintar(s.ed, s.desde, s.hasta, p.estilo);
    p.ultimo = llave;
    p.ed = s.ed; p.desde = s.desde; p.hasta = s.hasta;
    if (!p.fijo) { this.pincel = null; this.pintarEstado(); }
    this.alDecir(this.tx.bbPintado);
  }

  /* Un solo paso de Ctrl+Z: se van las marcas de estilo, llegan las copiadas; los bloques tomados enteros cambian de tipo y
     alineacion. Enlaces, definiciones y citas no se tocan. */
  pintar(ed, desde, hasta, estilo) {
    const st = ed.state, tr = st.tr;
    for (const nombre of MARCAS_DE_ESTILO) { const t = st.schema.marks[nombre]; if (t) tr.removeMark(desde, hasta, t); }
    for (const m of estilo.marcas) { const t = st.schema.marks[m.type]; if (t) tr.addMark(desde, hasta, t.create(m.attrs || null)); }
    if (estilo.bloque) {
      st.doc.nodesBetween(desde, hasta, (n, pos) => {
        if (!n.isTextblock) return true;
        const ini = pos + 1, fin = pos + 1 + n.content.size;
        if (bloqueEntero(ini, fin, desde, hasta)) {
          const b = bloquePintado(n.toJSON(), estilo), tipo = b && st.schema.nodes[b.type];
          if (tipo) tr.setNodeMarkup(pos, tipo, b.attrs);
        }
        return false;
      });
    }
    if (!tr.docChanged) return;
    ed.view.dispatch(closeHistory(tr));
  }
}
