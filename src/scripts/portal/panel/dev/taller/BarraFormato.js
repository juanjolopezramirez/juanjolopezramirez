/* LA BARRA DEL EDITOR: fuente, tamaño por numero, color, alineacion, letra capital, titulos, listas
   y lo que se inserta (imagen, columnas, PDF de diseño, simbolos). Su HTML esta en Taller.astro.

   Es una barra de verdad para el teclado: una sola parada de Tab, flechas para moverse dentro,
   Inicio y Fin. Alt+F10 llega desde el texto y Escape vuelve a el. Con el raton, el cursor del texto
   no se mueve; con el teclado el foco se queda en la barra, para poder seguir eligiendo. */
import { SIMBOLOS } from '../../../../../data/portal/taller.js';
import { nombreDeFuente } from '../../../../contenido/taller/fuentes.js';
import { tamanoValido, colorValido } from '../../../../contenido/taller/marcas.js';
import { enlaceSeguro } from '../../../../contenido/comun.js';
import { cargarFuente } from './Fuentes.js';

const DIFERENCIAS = { bold: 'toggleBold', italic: 'toggleItalic', underline: 'toggleUnderline', strike: 'toggleStrike', bulletList: 'toggleBulletList', orderedList: 'toggleOrderedList', blockquote: 'toggleBlockquote' };
const PARADAS = ':scope > button, :scope > select, :scope > label > input, :scope > details > summary';

export class BarraFormato {
  constructor(barra, { tx, editor, alError, alImagen, alPdf, alNuevaFuente, fuentes }) {
    Object.assign(this, { barra, tx, editor, alError, alImagen, alPdf, alNuevaFuente });
    this.q = (s) => barra.querySelector(s);
    this.fuente = this.q('[data-b-fuente]');
    this.tamano = this.q('[data-b-tamano]');
    this.color = this.q('[data-b-color]');
    this.nivel = this.q('[data-b-nivel]');
    this.ponerFuentes(fuentes);
    /* Sin robar el cursor del texto al pulsar */
    barra.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
    barra.querySelectorAll('[data-b-marca]').forEach((b) => b.addEventListener('click', (e) => {
      this.cadena(e)[DIFERENCIAS[b.dataset.bMarca]]().run();
    }));
    barra.querySelectorAll('[data-b-alinear]').forEach((b) => b.addEventListener('click', (e) => this.atributo(e, 'alinear', b.dataset.bAlinear)));
    this.q('[data-b-capital]').addEventListener('click', (e) => {
      this.cadena(e).updateAttributes('paragraph', { capital: !this.ed().getAttributes('paragraph').capital }).run();
    });
    this.q('[data-b-separador]').addEventListener('click', (e) => this.cadena(e).setHorizontalRule().run());
    this.nivel.addEventListener('change', () => {
      const v = this.nivel.value, c = this.ed().chain();
      (v === 'p' ? c.setParagraph() : c.setHeading({ level: Number(v) })).run();
    });
    this.fuente.addEventListener('change', () => {
      if (this.fuente.value === '') this.ed().chain().unsetFontFamily().run();
      else this.ed().chain().setFontFamily(this.fuente.value).run();
    });
    this.tamano.addEventListener('change', () => {
      const t = tamanoValido(`${this.tamano.value}pt`);
      if (t) { this.ed().chain().setFontSize(t).run(); this.errorEn(this.tamano, ''); } else if (!this.tamano.value) { this.ed().chain().unsetFontSize().run(); this.errorEn(this.tamano, ''); } else this.errorEn(this.tamano, 'tamanoMalo');
    });
    this.color.addEventListener('input', () => {
      const c = colorValido(this.color.value);
      if (c) this.ed().chain().setColor(c).run();
    });
    this.q('[data-b-otra]').addEventListener('submit', (e) => { e.preventDefault(); this.otraFuente(e.currentTarget); });
    this.q('[data-b-enlace]').addEventListener('submit', (e) => { e.preventDefault(); this.enlace(e.currentTarget); });
    const img = this.q('[data-b-imagen-archivo]');
    this.q('[data-b-imagen]').addEventListener('click', () => img.click());
    img.addEventListener('change', () => { if (img.files[0]) alImagen(img.files[0]); img.value = ''; });
    const pdf = this.q('[data-b-pdf-archivo]');
    this.q('[data-b-pdf]').addEventListener('click', () => pdf.click());
    pdf.addEventListener('change', () => { if (pdf.files[0]) alPdf(pdf.files[0]); pdf.value = ''; });
    this.q('[data-b-columnas]').addEventListener('submit', (e) => { e.preventDefault(); this.columnas(e.currentTarget); });
    this.pintarSimbolos();
    this.prepararTeclado();
    this.prepararPlegables();
  }

  ed() { return this.editor(); }

  /* Con el raton (detail > 0) se vuelve al texto; con el teclado, el foco se queda aqui */
  cadena(e) {
    const c = this.ed().chain();
    return e && e.detail > 0 ? c.focus() : c;
  }

  /* El error junto a lo que lo causo: su campo marcado, y el aviso comun que se queda a la vista */
  errorEn(campo, clave) {
    campo.setAttribute('aria-invalid', clave ? 'true' : 'false');
    if (clave) this.alError(clave);
  }

  atributo(e, nombre, valor) {
    const ed = this.ed();
    const tipo = ed.isActive('heading') ? 'heading' : 'paragraph';
    const actual = ed.getAttributes(tipo)[nombre];
    this.cadena(e).updateAttributes(tipo, { [nombre]: actual === valor ? '' : valor }).run();
  }

  /* ---- El teclado ---- */
  paradas() { return [...this.barra.querySelectorAll(PARADAS)].filter((n) => !n.hidden); }

  prepararTeclado() {
    const lista = this.paradas();
    lista.forEach((n, i) => { n.tabIndex = i === 0 ? 0 : -1; });
    this.barra.addEventListener('focusin', (e) => {
      if (!lista.includes(e.target)) return;
      lista.forEach((n) => { n.tabIndex = n === e.target ? 0 : -1; });
    });
    this.barra.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const abierto = e.target.closest('details[open]');
        if (abierto) { e.preventDefault(); abierto.open = false; abierto.querySelector('summary').focus(); return; }
        e.preventDefault();
        this.ed().commands.focus();
        return;
      }
      const i = lista.indexOf(e.target);
      if (i < 0) return;
      /* Las flechas de arriba y abajo son de las listas y los numeros. Izquierda y derecha, de la barra. */
      const destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: lista.length - 1 }[e.key];
      if (destino === undefined) return;
      e.preventDefault();
      lista[(destino + lista.length) % lista.length].focus();
    });
  }

  /* Alt+F10 desde el texto */
  entrar() {
    const a = this.paradas().find((n) => n.tabIndex === 0);
    if (a) a.focus();
  }

  prepararPlegables() {
    this.barra.querySelectorAll('details').forEach((d) => d.addEventListener('toggle', () => {
      if (!d.open) return;
      const c = d.querySelector('input, [data-b-simbolos] button');
      if (c) c.focus();
    }));
    /* Al hacer clic fuera, se cierran */
    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest && e.target.closest('.tal-b-mas')) return;
      this.barra.querySelectorAll('details[open]').forEach((d) => { d.open = false; });
    });
  }

  cerrarPlegable(f) {
    const d = f.closest('details');
    d.open = false;
    d.querySelector('summary').focus();
  }

  ponerFuentes(lista) {
    const actual = this.fuente.value;
    const base = this.fuente.querySelector('option[value=""]');
    this.fuente.replaceChildren(base, ...lista.map((n) => {
      const o = document.createElement('option');
      o.value = n; o.textContent = n;
      return o;
    }));
    this.fuente.value = actual;
  }

  async otraFuente(f) {
    const campo = f.elements.fuente;
    const nombre = campo.value.trim();
    if (!nombreDeFuente(nombre)) { this.errorEn(campo, 'fuenteMala'); return; }
    if (!(await cargarFuente(nombre))) { this.errorEn(campo, 'fuenteNoEsta'); return; }
    this.errorEn(campo, '');
    f.reset();
    this.alNuevaFuente(nombre);
    this.fuente.value = nombre;
    this.ed().chain().setFontFamily(nombre).run();
    this.cerrarPlegable(f);
  }

  enlace(f) {
    const campo = f.elements.enlace;
    const href = campo.value.trim();
    if (!href) { this.ed().chain().unsetLink().run(); this.cerrarPlegable(f); return; }
    if (!enlaceSeguro(href)) { this.errorEn(campo, 'enlaceMalo'); return; }
    this.errorEn(campo, '');
    this.ed().chain().setLink({ href }).run();
    f.reset();
    this.cerrarPlegable(f);
  }

  columnas(f) {
    const campo = f.elements.anchos;
    const anchos = campo.value.trim().split(/\s+/).map(Number);
    if (anchos.length < 2 || anchos.length > 6 || anchos.some((a) => !Number.isFinite(a) || a < 1 || a > 12)) { this.errorEn(campo, 'columnasMalas'); return; }
    /* Unas columnas dentro de otras no se guardan bien: mejor no dejarlas entrar */
    if (this.ed().isActive('columna')) { this.errorEn(campo, 'columnasDentro'); return; }
    this.errorEn(campo, '');
    this.ed().chain().ponerColumnas(anchos).run();
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
        b.addEventListener('click', () => this.ed().chain().insertContent(s).run());
        fila.append(b);
      }
      caja.append(p, fila);
    }
  }

  /* Lo que la barra muestra segun donde este el cursor */
  actualizar() {
    const e = this.ed();
    if (!e) return;
    this.barra.querySelectorAll('[data-b-marca]').forEach((b) => b.setAttribute('aria-pressed', String(e.isActive(b.dataset.bMarca))));
    const a = e.getAttributes('textStyle');
    if (document.activeElement !== this.tamano) this.tamano.value = a.fontSize ? parseFloat(a.fontSize) : '';
    if (document.activeElement !== this.fuente) this.fuente.value = a.fontFamily || '';
    const nivel = e.isActive('heading') ? String(e.getAttributes('heading').level) : 'p';
    if (document.activeElement !== this.nivel) this.nivel.value = nivel;
    const tipo = e.isActive('heading') ? 'heading' : 'paragraph';
    const al = e.getAttributes(tipo).alinear;
    this.barra.querySelectorAll('[data-b-alinear]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.bAlinear === al)));
    this.q('[data-b-capital]').setAttribute('aria-pressed', String(!!e.getAttributes('paragraph').capital));
  }
}
