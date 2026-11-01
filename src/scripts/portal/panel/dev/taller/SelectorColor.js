/* EL SELECTOR DE COLOR DEL TALLER. Reemplaza al de Windows: muestras, los ultimos usados en este libro y un
   campo para escribir el codigo. Flota sobre todo (popover), asi no empuja el panel ni lo recorta nada. Se
   usa solo con teclado: flechas por las muestras, Enter elige, Escape cierra. `valor` vacio es «Automatico»:
   la letra o el papel que salgan del libro. */
import { MUESTRAS } from '../../../../contenido/taller/colores.js';
import { colorValido } from '../../../../contenido/taller/marcas.js';

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const POR_FILA = 8;
const BORDE = 8, SEPARA = 6;

export class SelectorColor {
  constructor({ tx, etiqueta, valor = '', recientes = () => [], alCambiar, automatico = true }) {
    Object.assign(this, { tx, etiqueta, valor, recientes, alCambiar, automatico });
    this.nodo = crear('div', 'tal-color');
    this.nodo.selector = this;
    this.boton = crear('button', 'tal-color__boton');
    this.boton.type = 'button';
    this.boton.dataset.clave = `color:${etiqueta}`;
    this.boton.setAttribute('aria-haspopup', 'true');
    this.boton.setAttribute('aria-expanded', 'false');
    this.muestra = crear('span', 'tal-color__muestra');
    this.dice = crear('span', 'tal-color__dice');
    this.boton.append(this.muestra, this.dice);
    this.caja = crear('div', 'tal-color__panel');
    this.caja.popover = 'auto';
    this.caja.setAttribute('role', 'group');
    this.caja.setAttribute('aria-label', etiqueta);
    this.boton.popoverTargetElement = this.caja;
    this.nodo.append(this.boton, this.caja);
    this.caja.addEventListener('beforetoggle', (e) => { if (e.newState === 'open') this.llenar(); });
    this.caja.addEventListener('toggle', (e) => {
      const abierto = e.newState === 'open';
      this.boton.setAttribute('aria-expanded', String(abierto));
      if (abierto) this.abierto();
      else this.dejarDeSeguir();
    });
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

  cerrar() {
    if (this.caja.matches(':popover-open')) this.caja.hidePopover();
    this.boton.focus();
  }

  elegir(c) {
    this.poner(c);
    this.cerrar();
    this.alCambiar(c);
  }

  rejilla(lista) {
    const g = crear('div', 'tal-color__rejilla');
    for (const c of lista) {
      const b = crear('button', 'tal-color__m');
      b.type = 'button';
      b.style.background = c;
      b.title = c.toUpperCase();
      b.setAttribute('aria-label', c.toUpperCase());
      b.setAttribute('aria-pressed', String(c === this.valor));
      b.addEventListener('click', () => this.elegir(c));
      g.append(b);
    }
    return g;
  }

  llenar() {
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
    const fila = crear('div', 'tal-color__codigo'), l = crear('label', ''), i = crear('input');
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
    fila.append(l, usar);
    hijos.push(fila);
    this.caja.replaceChildren(...hijos);
  }

  /* Si la ventana cambia o su boton se mueve, se cierra: flotaria lejos de lo que colorea */
  seguir() {
    this.alMoverse = (e) => { if (e.type === 'resize' || (e.target.contains && e.target.contains(this.boton))) this.caja.hidePopover(); };
    window.addEventListener('resize', this.alMoverse);
    window.addEventListener('scroll', this.alMoverse, true);
  }

  dejarDeSeguir() {
    if (!this.alMoverse) return;
    window.removeEventListener('resize', this.alMoverse);
    window.removeEventListener('scroll', this.alMoverse, true);
    this.alMoverse = null;
  }

  /* Junto a su boton, sin salirse de la ventana: hacia arriba si abajo no cabe */
  abierto() {
    this.seguir();
    const r = this.boton.getBoundingClientRect(), w = this.caja.offsetWidth, h = this.caja.offsetHeight;
    const abajo = r.bottom + SEPARA, arriba = r.top - h - SEPARA;
    const top = abajo + h + BORDE <= innerHeight ? abajo : Math.max(BORDE, arriba);
    this.caja.style.left = `${Math.max(BORDE, Math.min(innerWidth - w - BORDE, r.right - w))}px`;
    this.caja.style.top = `${top}px`;
    const hoy = this.caja.querySelector('.tal-color__m[aria-pressed="true"]') || this.caja.querySelector('.tal-color__m');
    if (hoy) hoy.focus();
  }

  escrito(i) {
    const t = i.value.trim(), c = colorValido(t.startsWith('#') ? t : `#${t}`);
    i.setAttribute('aria-invalid', c ? 'false' : 'true');
    if (c) this.elegir(c);
  }

  alTeclear(e) {
    if (e.key === 'Escape' && this.caja.matches(':popover-open')) { e.preventDefault(); e.stopPropagation(); this.cerrar(); return; }
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
