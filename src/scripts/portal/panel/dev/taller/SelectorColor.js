/* EL SELECTOR DE COLOR DEL TALLER. Reemplaza al de Windows: muestras, los ultimos usados en este libro y un
   campo para escribir el codigo. Se usa solo con teclado: flechas por las muestras, Enter elige, Escape
   cierra. `valor` vacio es «Automatico»: la letra o el papel que salgan del libro. */
import { MUESTRAS } from '../../../../contenido/taller/colores.js';
import { colorValido } from '../../../../contenido/taller/marcas.js';

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const POR_FILA = 8;

export class SelectorColor {
  constructor({ tx, etiqueta, valor = '', recientes = () => [], alCambiar, enLinea = false, automatico = true }) {
    Object.assign(this, { tx, etiqueta, valor, recientes, alCambiar, automatico });
    this.nodo = crear('details', `tal-b-mas tal-color${enLinea ? ' tal-color--enlinea' : ''}`);
    this.nodo.setAttribute('name', 'tal-color');
    this.boton = crear('summary', 'tal-color__boton');
    this.boton.dataset.clave = `color:${etiqueta}`;
    this.muestra = crear('span', 'tal-color__muestra');
    this.dice = crear('span', 'tal-color__dice');
    this.boton.append(this.muestra, this.dice);
    this.caja = crear('div', 'tal-b-panel tal-color__panel');
    this.caja.setAttribute('role', 'group');
    this.caja.setAttribute('aria-label', etiqueta);
    this.nodo.append(this.boton, this.caja);
    this.nodo.addEventListener('toggle', () => { if (this.nodo.open) this.abrir(); });
    this.nodo.addEventListener('keydown', (e) => this.alTeclear(e));
    this.poner(valor);
  }

  poner(c) {
    this.valor = c;
    this.muestra.style.background = c || '';
    this.muestra.classList.toggle('tal-color__muestra--auto', !c);
    this.dice.textContent = c ? c.toUpperCase() : this.tx.colorAuto;
    this.boton.setAttribute('aria-label', `${this.etiqueta}: ${this.dice.textContent}`);
  }

  elegir(c) {
    this.poner(c);
    this.nodo.open = false;
    this.boton.focus();
    this.alCambiar(c);
  }

  rejilla(lista) {
    const g = crear('div', 'tal-color__rejilla');
    for (const c of lista) {
      const b = crear('button', 'tal-color__m');
      b.type = 'button';
      b.dataset.clave = `muestra:${c}`;
      b.style.background = c;
      b.title = c.toUpperCase();
      b.setAttribute('aria-label', c.toUpperCase());
      b.setAttribute('aria-pressed', String(c === this.valor));
      b.addEventListener('click', () => this.elegir(c));
      g.append(b);
    }
    return g;
  }

  abrir() {
    const { tx } = this, hijos = [];
    if (this.automatico) {
      const a = crear('button', 'tal-btn', tx.colorAuto);
      a.type = 'button';
      a.setAttribute('aria-pressed', String(!this.valor));
      a.addEventListener('click', () => this.elegir(''));
      hijos.push(a);
    }
    hijos.push(this.rejilla(MUESTRAS));
    const usados = this.recientes();
    if (usados.length) hijos.push(crear('p', 'tal-color__nota', tx.colorRecientes), this.rejilla(usados));
    const l = crear('label', '', ''), i = crear('input');
    i.value = this.valor;
    i.placeholder = '#000000';
    i.maxLength = 7;
    i.autocomplete = 'off';
    i.spellcheck = false;
    i.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      e.stopPropagation();
      this.escrito(i);
    });
    const usar = crear('button', 'tal-btn', tx.colorUsar);
    usar.type = 'button';
    usar.addEventListener('click', () => this.escrito(i));
    l.append(crear('span', '', tx.colorCodigo), i);
    hijos.push(l, usar);
    this.caja.replaceChildren(...hijos);
    const hoy = this.caja.querySelector('.tal-color__m[aria-pressed="true"]') || this.caja.querySelector('.tal-color__m');
    if (hoy) hoy.focus();
  }

  escrito(i) {
    const t = i.value.trim(), c = colorValido(t.startsWith('#') ? t : `#${t}`);
    i.setAttribute('aria-invalid', c ? 'false' : 'true');
    if (c) this.elegir(c);
  }

  alTeclear(e) {
    if (e.key === 'Escape' && this.nodo.open) { e.preventDefault(); e.stopPropagation(); this.nodo.open = false; this.boton.focus(); return; }
    const b = e.target.closest('.tal-color__m');
    if (!b) return;
    const l = [...b.parentNode.children], i = l.indexOf(b);
    const d = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + POR_FILA, ArrowUp: i - POR_FILA, Home: 0, End: l.length - 1 }[e.key];
    if (d === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    if (l[d]) l[d].focus();
  }
}
