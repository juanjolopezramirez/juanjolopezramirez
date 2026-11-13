/* LA CINTA, como la de Word: Inicio, Insertar y Pagina. Su HTML esta en Taller.astro.

   Una sola parada de Tab para la fila que se ve, flechas para moverse dentro, Inicio y Fin. Alt+F10
   llega desde el texto y Escape vuelve a el. Con el raton el cursor del texto no se mueve; con el
   teclado el foco se queda en la cinta, para poder seguir eligiendo. */
import { Campo, Selector } from './Selector.js';
import { SelectorColor } from './SelectorColor.js';
import { SIMBOLOS } from '../../../../../data/portal/taller.js';
import { familiaCss, nombreDeFuente } from '../../../../contenido/taller/fuentes.js';
import { tamanoValido, colorValido } from '../../../../contenido/taller/marcas.js';
import { enlaceSeguro } from '../../../../contenido/comun.js';
import { cargarFuente } from './Fuentes.js';

const MARCAS = { bold: 'toggleBold', italic: 'toggleItalic', underline: 'toggleUnderline', strike: 'toggleStrike', superscript: 'toggleSuperscript', subscript: 'toggleSubscript', bulletList: 'toggleBulletList', orderedList: 'toggleOrderedList', blockquote: 'toggleBlockquote' };
/* Los campos de numero no son paradas de la fila: en ellos las flechas son del campo, y se llega con Tab */
const PARADAS = 'button, select:not(.tal-sel__nativo), summary';
/* Los tamaños listos, como en Word. Lo escrito a mano sigue valiendo. */
const TAMANOS_LETRA = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

/* Lo que se abre (paneles, listas, la hoja de ajustes) tiene su propio Tab: alli las flechas son del campo.
   La fila de Diseño si es parte de la cinta. */
const FUERA_DE_LA_FILA = '.tal-b-panel, .tal-color__panel, .tal-colores, .tal-sel__lista, .tal-sel__abrir, .tal-ajustes';

export class Cinta {
  constructor(raiz, { tx, editor, alError, alImagen, alPdf, alNuevaFuente, alInsertar, alFormula, alVolver, alColor, recientes, fuentes }) {
    Object.assign(this, { raiz, tx, editor, alError, alImagen, alPdf, alNuevaFuente, alInsertar, alFormula, alVolver, alColor });
    this.q = (s) => raiz.querySelector(s);
    this.fuente = this.q('[data-b-fuente]');
    this.tamano = this.q('[data-b-tamano]');
    this.color = new SelectorColor({ tx, etiqueta: tx.color, recientes, alCambiar: (c) => this.pintarLetra(c) });
    this.q('[data-b-color]').append(this.color.nodo);
    this.nivel = this.q('[data-b-nivel]');
    this.ponerFuentes(fuentes);
    this.selNivel = new Selector(this.nivel);
    this.selFuente = new Selector(this.fuente, { fuenteDe: (v) => (v ? familiaCss(v) : '') });
    this.campoTamano = new Campo(this.tamano, TAMANOS_LETRA);
    raiz.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
    raiz.querySelectorAll('[data-pestana]').forEach((p) => p.addEventListener('click', () => this.abrir(p.dataset.pestana)));
    raiz.querySelectorAll('[data-b-marca]').forEach((b) => b.addEventListener('click', (e) => { const c = this.cadena(e); if (c) c[MARCAS[b.dataset.bMarca]]().run(); }));
    raiz.querySelectorAll('[data-b-alinear]').forEach((b) => b.addEventListener('click', (e) => this.alinear(e, b.dataset.bAlinear)));
    this.q('[data-b-capital]').addEventListener('click', (e) => {
      const c = this.cadena(e);
      if (c) c.updateAttributes('paragraph', { capital: !this.ed().getAttributes('paragraph').capital }).run();
    });
    this.q('[data-b-separador]').addEventListener('click', (e) => { const c = this.cadena(e); if (c) c.setHorizontalRule().run(); });
    this.q('[data-b-formula]').addEventListener('click', () => this.alFormula());
    this.q('[data-b-llave]').addEventListener('click', (e) => { const c = this.cadena(e); if (c) c.insertContent('{nombre}').run(); });
    this.nivel.addEventListener('change', () => {
      const e = this.ed(), v = this.nivel.value;
      if (!e) return;
      (v === 'p' ? e.chain().setParagraph() : e.chain().setHeading({ level: Number(v) })).run();
    });
    this.fuente.addEventListener('change', () => {
      const e = this.ed();
      if (!e) return;
      if (this.fuente.value === '') e.chain().unsetFontFamily().run(); else e.chain().setFontFamily(this.fuente.value).run();
    });
    this.tamano.addEventListener('change', () => {
      const e = this.ed(), t = tamanoValido(`${this.tamano.value}pt`);
      if (!e) return;
      if (t) { e.chain().setFontSize(t).run(); this.errorEn(this.tamano, ''); } else if (!this.tamano.value) { e.chain().unsetFontSize().run(); this.errorEn(this.tamano, ''); } else this.errorEn(this.tamano, 'tamanoMalo');
    });
    this.q('[data-b-otra]').addEventListener('submit', (e) => { e.preventDefault(); this.otraFuente(e.currentTarget); });
    this.q('[data-b-enlace]').addEventListener('submit', (e) => { e.preventDefault(); this.enlace(e.currentTarget); });
    this.q('[data-b-columnas]').addEventListener('submit', (e) => { e.preventDefault(); this.columnas(e.currentTarget); });
    const img = this.q('[data-b-imagen-archivo]');
    raiz.querySelectorAll('[data-b-imagen]').forEach((b) => b.addEventListener('click', () => img.click()));
    img.addEventListener('change', () => { if (img.files[0]) alImagen(img.files[0]); img.value = ''; });
    const pdf = this.q('[data-b-pdf-archivo]');
    /* El mismo archivo sirve para paginas sueltas, para la portada (que siempre va al comienzo del libro) o para cambiar
       el PDF de unas paginas que ya estan en el libro ('cambiar') */
    this.pedirPdf = (modo = '') => { this.modoPdf = modo; pdf.click(); };
    raiz.querySelectorAll('[data-b-pdf]').forEach((b) => b.addEventListener('click', () => this.pedirPdf('')));
    raiz.querySelectorAll('[data-b-portada]').forEach((b) => b.addEventListener('click', () => this.pedirPdf('portada')));
    pdf.addEventListener('change', () => { if (pdf.files[0]) alPdf(pdf.files[0], { portada: this.modoPdf === 'portada', cambiar: this.modoPdf === 'cambiar' }); pdf.value = ''; this.modoPdf = ''; });
    raiz.querySelectorAll('[data-insertar]').forEach((b) => b.addEventListener('click', () => alInsertar(b.dataset.insertar)));
    this.pintarSimbolos();
    this.prepararTeclado();
    this.prepararPlegables();
  }

  ed() { return this.editor(); }

  pintarLetra(c) {
    const e = this.ed();
    if (!e) return;
    if (c) { this.alColor(c); e.chain().focus().setColor(c).run(); } else e.chain().focus().unsetColor().run();
  }
  cadena(e) { const ed = this.ed(); if (!ed) return null; const c = ed.chain(); return e && e.detail > 0 ? c.focus() : c; }

  abrir(id) {
    this.raiz.querySelectorAll('[data-pestana]').forEach((p) => p.setAttribute('aria-selected', String(p.dataset.pestana === id)));
    this.raiz.querySelectorAll('[data-grupo]').forEach((g) => { g.hidden = g.dataset.grupo !== id; });
    this.ordenarParadas();
  }

  errorEn(campo, clave) {
    campo.setAttribute('aria-invalid', clave ? 'true' : 'false');
    if (clave) this.alError(clave);
  }

  alinear(e, valor) {
    const ed = this.ed();
    if (!ed) return;
    const tipo = ed.isActive('heading') ? 'heading' : 'paragraph';
    this.cadena(e).updateAttributes(tipo, { alinear: ed.getAttributes(tipo).alinear === valor ? '' : valor }).run();
  }

  /* ---- El teclado ---- */
  paradas() {
    const g = this.raiz.querySelector('[data-grupo]:not([hidden])');
    return [...this.raiz.querySelectorAll('[data-pestana]'), ...g.querySelectorAll(PARADAS)].filter((n) => !n.closest(FUERA_DE_LA_FILA));
  }

  ordenarParadas() {
    this.raiz.querySelectorAll(PARADAS).forEach((n) => { if (!n.closest(FUERA_DE_LA_FILA)) n.tabIndex = -1; });
    const l = this.paradas();
    if (l[0]) l[0].tabIndex = 0;
  }

  prepararTeclado() {
    this.ordenarParadas();
    this.raiz.addEventListener('focusin', (e) => {
      const l = this.paradas();
      if (!l.includes(e.target)) return;
      l.forEach((n) => { n.tabIndex = n === e.target ? 0 : -1; });
    });
    this.raiz.addEventListener('keydown', (e) => {
      /* La hoja de ajustes es un dialogo: Escape la cierra el navegador, y el foco vuelve solo */
      if (e.target.closest('dialog[open]')) return;
      if (e.key === 'Escape') {
        const abierto = e.target.closest('details[open]');
        e.preventDefault();
        if (abierto) { abierto.open = false; abierto.querySelector('summary').focus(); return; }
        this.alVolver();
        return;
      }
      const l = this.paradas(), i = l.indexOf(e.target);
      /* En un campo de numero las flechas mueven el cursor y el valor */
      if (i < 0 || e.target.matches('input')) return;
      const destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: l.length - 1 }[e.key];
      if (destino === undefined) return;
      e.preventDefault();
      l[(destino + l.length) % l.length].focus();
    });
  }

  entrar() { const a = this.paradas().find((n) => n.tabIndex === 0); if (a) a.focus(); }

  prepararPlegables() {
    /* Un menu de opciones (Página ▾) se cierra al elegir una */
    this.raiz.querySelectorAll('.tal-b-panel--menu').forEach((p) => p.addEventListener('click', (e) => {
      if (e.target.closest('button')) p.closest('details').open = false;
    }));
    this.raiz.querySelectorAll('details').forEach((d) => d.addEventListener('toggle', () => {
      if (!d.open) return;
      /* La opcion que ya esta elegida, o el primer control: la letra antes que el tamaño */
      const c = d.querySelector('input:checked') || d.querySelector('.tal-sel, input:not([type="radio"]), [data-b-simbolos] button');
      if (c) c.focus();
    }));
    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest && e.target.closest('.tal-b-mas')) return;
      this.raiz.querySelectorAll('details[open]').forEach((d) => { d.open = false; });
    });
  }

  cerrarPlegable(f) {
    const d = f.closest('details');
    d.open = false;
    d.querySelector('summary').focus();
  }

  ponerFuentes(lista) {
    const actual = this.fuente.value, base = this.fuente.querySelector('option[value=""]');
    const opciones = lista.map((n) => { const o = document.createElement('option'); o.value = n; o.textContent = n; return o; });
    this.fuente.replaceChildren(base, ...opciones);
    this.fuente.value = actual;
  }

  async otraFuente(f) {
    const campo = f.elements.fuente, nombre = campo.value.trim();
    if (!nombreDeFuente(nombre)) { this.errorEn(campo, 'fuenteMala'); return; }
    if (!(await cargarFuente(nombre))) { this.errorEn(campo, 'fuenteNoEsta'); return; }
    this.errorEn(campo, '');
    f.reset();
    this.alNuevaFuente(nombre);
    this.fuente.value = nombre;
    const e = this.ed();
    if (e) e.chain().setFontFamily(nombre).run();
    this.cerrarPlegable(f);
  }

  enlace(f) {
    const campo = f.elements.enlace, href = campo.value.trim(), e = this.ed();
    if (!e) return;
    if (!href) { e.chain().unsetLink().run(); this.cerrarPlegable(f); return; }
    if (!enlaceSeguro(href)) { this.errorEn(campo, 'enlaceMalo'); return; }
    this.errorEn(campo, '');
    e.chain().setLink({ href }).run();
    f.reset();
    this.cerrarPlegable(f);
  }

  columnas(f) {
    const campo = f.elements.anchos, anchos = campo.value.trim().split(/\s+/).map(Number), e = this.ed();
    if (!e) return;
    if (anchos.length < 2 || anchos.length > 6 || anchos.some((a) => !Number.isFinite(a) || a < 1 || a > 12)) { this.errorEn(campo, 'columnasMalas'); return; }
    if (e.isActive('columna')) { this.errorEn(campo, 'columnasDentro'); return; }
    this.errorEn(campo, '');
    e.chain().ponerColumnas(anchos).run();
    this.cerrarPlegable(f);
  }

  pintarSimbolos() {
    const caja = this.q('[data-b-simbolos]');
    for (const g of SIMBOLOS) {
      const p = document.createElement('p');
      p.className = 'tal-simbolos__grupo';
      p.textContent = g.grupo;
      const fila = document.createElement('div');
      fila.className = 'tal-simbolos__fila';
      for (const s of g.lista) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = s;
        b.setAttribute('aria-label', `${this.tx.insertar} ${s}`);
        b.addEventListener('click', () => { const e = this.ed(); if (e) e.chain().insertContent(s).run(); });
        fila.append(b);
      }
      caja.append(p, fila);
    }
  }

  /* Lo que la cinta muestra segun donde este el cursor */
  actualizar() {
    const e = this.ed();
    if (!e) return;
    this.raiz.querySelectorAll('[data-b-marca]').forEach((b) => b.setAttribute('aria-pressed', String(e.isActive(b.dataset.bMarca))));
    const a = e.getAttributes('textStyle');
    if (!this.color.caja.matches(':popover-open')) this.color.poner(colorValido(a.color));
    if (document.activeElement !== this.tamano && !this.campoTamano.abierto) this.tamano.value = a.fontSize ? parseFloat(a.fontSize) : '';
    if (!this.selFuente.abierto) this.fuente.value = a.fontFamily || '';
    if (!this.selNivel.abierto) this.nivel.value = e.isActive('heading') ? String(e.getAttributes('heading').level) : 'p';
    const tipo = e.isActive('heading') ? 'heading' : 'paragraph', al = e.getAttributes(tipo).alinear;
    this.raiz.querySelectorAll('[data-b-alinear]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.bAlinear === al)));
    this.q('[data-b-capital]').setAttribute('aria-pressed', String(!!e.getAttributes('paragraph').capital));
  }
}
