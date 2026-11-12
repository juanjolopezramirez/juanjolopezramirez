/* LOS SELECTORES DEL TALLER. Reemplazan a la lista de Windows por una propia, con el aire de la terminal.

   `Selector` envuelve un <select> que se queda escondido y sigue mandando: su valor, sus opciones y su
   evento `change` son los de siempre, asi el resto del Taller no cambia. `Campo` le pone a un campo de
   numero una lista de valores listos sin quitarle lo que se escribe. Los dos usan la misma `Lista`: flota
   sobre todo, se recorre con flechas, salta con la primera letra, Enter elige y Escape cierra. El foco
   nunca entra a la lista: con el raton, el texto elegido en el editor no se pierde. */
const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const BORDE = 8, SEPARA = 4;
const REABRIR_MS = 150;               // el clic que la cerro (al soltar fuera de ella) no la vuelve a abrir
const SOLO_MODIFICADOR = ['Control', 'Alt', 'Meta', 'Shift', 'AltGraph'];
let cuenta = 0;

class Lista {
  /* `dueno`: el elemento con el foco (boton o campo). `opciones()`: [{ valor, texto, fuente }].
     `escribe`: el dueno es un campo donde se escribe; las letras y Inicio/Fin son del campo, no de la lista. */
  constructor(dueno, ancla, { opciones, actual, elegir, etiqueta, escribe = false }) {
    Object.assign(this, { dueno, ancla, opciones, actual, elegir, escribe });
    this.id = `tal-sel-${++cuenta}`;
    this.caja = crear('div', 'tal-sel__lista');
    this.caja.id = this.id;
    this.caja.popover = 'auto';
    this.caja.setAttribute('role', 'listbox');
    this.caja.setAttribute('aria-label', etiqueta);
    this.activa = -1;
    this.buscado = '';
    this.cerradaEn = -Infinity;
    dueno.setAttribute('aria-controls', this.id);
    /* Un campo de numero no puede decir «abierto»: solo el boton lo anuncia */
    if (!escribe) dueno.setAttribute('aria-expanded', 'false');
    /* Si se mueve lo que la sostiene o cambia la ventana, la lista quedaria flotando lejos: se cierra */
    const alMover = (e) => { const t = e.target; if (t === document || (t.contains && t.contains(this.ancla))) this.cerrar(); };
    const alCambiar = () => this.cerrar();
    /* «beforetoggle» llega en el acto; «toggle» llega despues del clic que la cerro y no serviria para medirlo */
    this.caja.addEventListener('beforetoggle', (e) => {
      const abierta = e.newState === 'open';
      if (!escribe) dueno.setAttribute('aria-expanded', String(abierta));
      if (abierta) {
        addEventListener('scroll', alMover, true);
        addEventListener('resize', alCambiar);
      } else {
        /* Solo cuenta el cierre por un clic fuera: tras Escape, un clic enseguida si la abre */
        if (!this.cerrandoYo) this.cerradaEn = performance.now();
        dueno.removeAttribute('aria-activedescendant');
        removeEventListener('scroll', alMover, true);
        removeEventListener('resize', alCambiar);
      }
    });
    dueno.addEventListener('focusout', (e) => {
      const va = e.relatedTarget;
      if (!va || !(this.ancla.contains(va) || this.caja.contains(va))) this.cerrar();
    });
    this.caja.addEventListener('mousedown', (e) => e.preventDefault());
    this.caja.addEventListener('click', (e) => {
      const o = e.target.closest('[role="option"]');
      if (o) this.tomar(Number(o.dataset.i));
    });
  }

  get abierta() { return this.caja.matches(':popover-open'); }

  alternar() {
    if (this.abierta) this.cerrar();
    else if (performance.now() - this.cerradaEn > REABRIR_MS) this.abrir();
  }

  abrir() {
    const l = this.opciones(), hoy = this.actual();
    this.caja.replaceChildren(...l.map((o, i) => {
      const e = crear('div', 'tal-sel__op', o.texto);
      e.id = `${this.id}-${i}`;
      e.dataset.i = String(i);
      e.setAttribute('role', 'option');
      e.setAttribute('aria-selected', String(o.valor === hoy));
      if (o.fuente) e.style.fontFamily = o.fuente;
      return e;
    }));
    this.lista = l;
    if (!this.abierta) this.caja.showPopover();
    const r = this.ancla.getBoundingClientRect();
    this.caja.style.minWidth = `${r.width}px`;
    const h = this.caja.offsetHeight, w = this.caja.offsetWidth, abajo = r.bottom + SEPARA;
    this.caja.style.top = `${abajo + h + BORDE <= innerHeight ? abajo : Math.max(BORDE, r.top - h - SEPARA)}px`;
    this.caja.style.left = `${Math.max(BORDE, Math.min(innerWidth - w - BORDE, r.left))}px`;
    this.marcar(Math.max(0, l.findIndex((o) => o.valor === hoy)));
  }

  cerrar() {
    if (!this.abierta) return;
    this.cerrandoYo = true;
    try { this.caja.hidePopover(); } finally { this.cerrandoYo = false; }
  }

  marcar(i) {
    if (!this.lista || !this.lista.length) return;
    this.activa = Math.max(0, Math.min(this.lista.length - 1, i));
    this.caja.querySelectorAll('.tal-sel__op').forEach((o, k) => o.classList.toggle('tal-sel__op--activa', k === this.activa));
    const o = this.caja.children[this.activa];
    this.dueno.setAttribute('aria-activedescendant', o.id);
    /* Solo se mueve la lista: «scrollIntoView» podria mover la pagina, y eso la cerraria */
    const c = this.caja;
    if (o.offsetTop < c.scrollTop) c.scrollTop = o.offsetTop;
    else if (o.offsetTop + o.offsetHeight > c.scrollTop + c.clientHeight) c.scrollTop = o.offsetTop + o.offsetHeight - c.clientHeight;
  }

  tomar(i) {
    const o = this.lista && this.lista[i];
    this.cerrar();
    if (o) this.elegir(o.valor);
  }

  /* Devuelve true si la tecla era suya */
  tecla(e) {
    if (!this.abierta || SOLO_MODIFICADOR.includes(e.key)) return false;
    if (e.altKey && e.key === 'ArrowUp') { this.cerrar(); return true; }
    if (e.altKey && e.key === 'ArrowDown') return true;      // ya esta abierta: no se cierra y reabre
    /* Un atajo (Ctrl+algo) puede cambiar la pantalla: la lista no se queda colgando */
    if (e.ctrlKey || e.metaKey || e.altKey) { this.cerrar(); return false; }
    const pasos = { ArrowDown: 1, ArrowUp: -1, PageDown: 8, PageUp: -8 };
    if (pasos[e.key]) { this.marcar(this.activa + pasos[e.key]); return true; }
    if (e.key === 'Enter') { this.tomar(this.activa); return true; }
    if (e.key === 'Escape') { this.cerrar(); return true; }
    if (e.key === 'Tab') { this.cerrar(); return false; }
    if (this.escribe) {
      /* Quien escribe su propio numero ya no esta eligiendo de la lista: Enter le da lo escrito */
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') this.cerrar();
      return false;
    }
    if (e.key === 'Home') { this.marcar(0); return true; }
    if (e.key === 'End') { this.marcar(this.lista.length - 1); return true; }
    if (e.key.length === 1) {
      clearTimeout(this.reloj);
      this.buscado += e.key.toLowerCase();
      this.reloj = setTimeout(() => { this.buscado = ''; }, 700);
      const i = this.lista.findIndex((o) => o.texto.toLowerCase().startsWith(this.buscado));
      if (i >= 0) this.marcar(i);
      return true;
    }
    return false;
  }
}

/* Un <select> con cara propia. `fuenteDe(valor)` dibuja cada opcion en su propia letra. */
export class Selector {
  constructor(select, { fuenteDe = null } = {}) {
    this.select = select;
    this.etiqueta = select.getAttribute('aria-label') || (select.closest('label') ? select.closest('label').querySelector('span').textContent : '');
    this.boton = crear('button', 'tal-sel');
    this.boton.type = 'button';
    this.boton.setAttribute('role', 'combobox');
    this.boton.setAttribute('aria-haspopup', 'listbox');
    this.texto = crear('span', 'tal-sel__texto');
    this.boton.append(this.texto, crear('span', 'tal-sel__flecha'));
    this.lista = new Lista(this.boton, this.boton, {
      etiqueta: this.etiqueta,
      opciones: () => [...select.options].map((o) => ({ valor: o.value, texto: o.textContent, fuente: fuenteDe ? fuenteDe(o.value) : '' })),
      actual: () => select.value,
      elegir: (v) => {
        if (v !== select.value) { select.value = v; select.dispatchEvent(new Event('change', { bubbles: true })); }
        this.pintar();
      }
    });
    select.classList.add('tal-sel__nativo');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    select.after(this.boton, this.lista.caja);
    /* Un clic en la etiqueta enfocaria el escondido */
    select.addEventListener('focus', () => this.boton.focus());
    select.addEventListener('change', () => this.pintar());
    this.boton.addEventListener('click', () => this.lista.alternar());
    this.boton.addEventListener('keydown', (e) => {
      if (this.lista.tecla(e)) { e.preventDefault(); e.stopPropagation(); return; }
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key) && !e.ctrlKey && !e.metaKey) { e.preventDefault(); e.stopPropagation(); this.lista.abrir(); }
    });
    /* Firefox hace el clic del espacio al soltar la tecla: la cerraria recien abierta */
    this.boton.addEventListener('keyup', (e) => { if (e.key === ' ') e.preventDefault(); });
    /* Quien ponga el valor o cambie las opciones por codigo, cambia tambien lo que se ve */
    const propio = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    const yo = this;
    Object.defineProperty(select, 'value', { configurable: true, get() { return propio.get.call(this); }, set(v) { propio.set.call(this, v); yo.pintar(); } });
    new MutationObserver(() => this.pintar()).observe(select, { childList: true, subtree: true, characterData: true });
    this.pintar();
  }

  get abierto() { return this.lista.abierta; }

  /* El nombre dice tambien lo elegido («Letra: Estonia»): la etiqueta sola tapa el valor al lector de pantalla */
  pintar() {
    const o = this.select.selectedOptions[0];
    const texto = o ? o.textContent : '';
    this.texto.textContent = texto;
    this.boton.setAttribute('aria-label', texto ? `${this.etiqueta}: ${texto}` : this.etiqueta);
  }
}

/* Un campo de numero con valores listos. Lo escrito sigue valiendo: la lista solo ayuda. Con teclado se
   abre con Alt+Flecha abajo; la flechita es solo para el raton. */
export class Campo {
  constructor(input, valores, { etiqueta = input.getAttribute('aria-label') || '' } = {}) {
    this.input = input;
    const caja = crear('span', 'tal-campo');
    input.before(caja);
    this.abrirBoton = crear('button', 'tal-sel__abrir');
    this.abrirBoton.type = 'button';
    this.abrirBoton.tabIndex = -1;
    this.abrirBoton.setAttribute('aria-hidden', 'true');
    this.abrirBoton.append(crear('span', 'tal-sel__flecha'));
    this.lista = new Lista(input, caja, {
      etiqueta,
      escribe: true,
      opciones: () => valores.map((v) => ({ valor: String(v), texto: String(v) })),
      actual: () => {
        const n = Number(input.value);
        if (!Number.isFinite(n) || input.value === '') return '';
        return String(valores.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a)));
      },
      elegir: (v) => { input.value = v; input.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    caja.append(input, this.abrirBoton, this.lista.caja);
    /* Sin tomar el foco: lo elegido en el editor se queda elegido */
    this.abrirBoton.addEventListener('mousedown', (e) => e.preventDefault());
    this.abrirBoton.addEventListener('click', () => this.lista.alternar());
    input.addEventListener('keydown', (e) => {
      if (this.lista.tecla(e)) { e.preventDefault(); e.stopPropagation(); return; }
      if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); e.stopPropagation(); this.lista.abrir(); }
    });
  }

  get abierto() { return this.lista.abierta; }
}
