/* EL MENU DE CLIC DERECHO. Sale con el raton, con la tecla de menu y con Mayus+F10, se recorre con flechas y
   Escape lo cierra devolviendo el foco. «Mover a…» cambia el menu por un numero de pagina: de la 30 a la 2
   sin arrastrar. Los datos de cada opcion los pone la mesa; aqui solo se muestran. */
import { icono } from './iconos.js';

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const BORDE = 8;

export class MenuPagina {
  constructor(raiz, { tx, decir }) {
    this.tx = tx;
    this.decir = decir;
    this.caja = crear('div', 'tal-menu');
    this.caja.popover = 'auto';
    this.caja.setAttribute('role', 'menu');
    this.caja.setAttribute('aria-label', tx.menuPagina);
    raiz.append(this.caja);
    this.caja.addEventListener('keydown', (e) => this.alTeclear(e));
  }

  /* `items`: { texto, icono, fn, aviso, apagado, ayuda, queda } o { raya: true }. `queda` no cierra el menu. */
  abrir(x, y, items, origen, alPerderlo) {
    this.origen = origen;
    this.alPerderlo = alPerderlo;
    this.x = x;
    this.y = y;
    this.caja.setAttribute('role', 'menu');
    this.caja.replaceChildren(...items.map((i) => (i.raya ? crear('div', 'tal-menu__raya') : this.opcion(i))));
    if (!this.caja.matches(':popover-open')) this.caja.showPopover();
    this.colocar();
    this.primera();
  }

  opcion(i) {
    const b = crear('button', `tal-menu__op${i.aviso ? ' tal-menu__op--aviso' : ''}`);
    b.type = 'button';
    b.setAttribute('role', 'menuitem');
    if (i.icono) b.append(icono(i.icono));
    b.append(crear('span', '', i.texto));
    if (i.apagado) { b.setAttribute('aria-disabled', 'true'); if (i.ayuda) b.title = i.ayuda; return b; }
    b.addEventListener('click', () => {
      /* Borrar pide un segundo clic: el primero solo lo pone en rojo y cambia lo que dice */
      if (i.confirmar && !b.dataset.armado) { this.armar(b, i.texto, i.confirmar); return; }
      if (!i.queda) this.cerrar(false);
      i.fn();
    });
    return b;
  }

  armar(b, texto, confirmar) {
    const nombre = b.lastChild;
    b.dataset.armado = '1';
    b.classList.add('tal-menu__op--armada');
    nombre.textContent = confirmar;
    if (this.decir) this.decir(confirmar);
    b.addEventListener('blur', () => { delete b.dataset.armado; b.classList.remove('tal-menu__op--armada'); nombre.textContent = texto; }, { once: true });
  }

  colocar() {
    const r = this.caja.getBoundingClientRect();
    this.caja.style.left = `${Math.max(BORDE, Math.min(innerWidth - r.width - BORDE, this.x))}px`;
    this.caja.style.top = `${Math.max(BORDE, Math.min(innerHeight - r.height - BORDE, this.y))}px`;
  }

  primera() {
    const o = this.opciones()[0];
    if (o) o.focus();
  }

  opciones() { return [...this.caja.querySelectorAll('.tal-menu__op:not([aria-disabled="true"])')]; }

  /* Mover a una pagina: `{ actual, total, primera, alMover(n) }` */
  /* `ultima`: adonde lleva «Al final» (si no, la ultima pagina del libro) */
  mover({ actual, total, primera, alMover, etiqueta, ultima = total }) {
    const { tx } = this, f = crear('form', 'tal-menu__mover'), l = crear('label'), i = crear('input');
    f.noValidate = true;
    this.caja.setAttribute('role', 'dialog');
    i.type = 'number';
    i.min = '1';
    i.max = String(total);
    i.value = String(actual);
    i.addEventListener('focus', () => i.select());
    l.append(crear('span', '', (etiqueta || tx.moverAPagina).replace('{total}', String(total))), i);
    const ir = crear('button', 'tal-btn tal-btn--fuerte', tx.mover);
    ir.type = 'submit';
    const atajo = (texto, n) => {
      const b = crear('button', 'tal-btn', texto);
      b.type = 'button';
      b.addEventListener('click', () => { this.cerrar(false); alMover(n); });
      return b;
    };
    const fila = crear('div', 'tal-menu__fila');
    fila.append(atajo(tx.alInicio, primera), atajo(tx.alFinal, ultima));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = Number(i.value);
      if (!Number.isInteger(n) || n < 1 || n > total) { i.setAttribute('aria-invalid', 'true'); return; }
      this.cerrar(false);
      alMover(n);
    });
    f.append(l, ir, fila);
    this.caja.replaceChildren(f);
    this.colocar();
    i.focus();
  }

  cerrar(devolver = true) {
    if (this.caja.matches(':popover-open')) this.caja.hidePopover();
    if (!devolver || !this.origen) return;
    if (this.origen.isConnected) this.origen.focus();
    else if (this.alPerderlo) this.alPerderlo();
  }

  alTeclear(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.cerrar(); return; }
    if (e.target.matches('input')) return;
    const l = this.opciones(), i = l.indexOf(e.target);
    if (i < 0) return;
    const d = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: l.length - 1 }[e.key];
    if (d === undefined) return;
    e.preventDefault();
    l[(d + l.length) % l.length].focus();
  }
}
