/* VER COMO LIBRO: doble pagina, con la portada sola a la derecha, como un libro abierto. Solo mira: lo
   que se ve son copias de las hojas de la mesa. */
const crear = (tag, clase) => { const e = document.createElement(tag); if (clase) e.className = clase; return e; };

export class VistaLibro {
  constructor(caja, { mesa, tx }) {
    Object.assign(this, { caja, mesa, tx });
    this.pliego = 0;
    this.escena = caja.querySelector('[data-vl-escena]');
    caja.querySelector('[data-vl-cerrar]').addEventListener('click', () => this.cerrar());
    caja.querySelector('[data-vl-ant]').addEventListener('click', () => this.mover(-1));
    caja.querySelector('[data-vl-sig]').addEventListener('click', () => this.mover(1));
    this.escena.addEventListener('click', (e) => {
      if (this.irDesdeIndice(e)) return;
      const r = this.escena.getBoundingClientRect();
      this.mover(e.clientX > r.left + r.width / 2 ? 1 : -1);
    });
    caja.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.cerrar(); }
      if (e.key === 'ArrowRight') this.mover(1);
      if (e.key === 'ArrowLeft') this.mover(-1);
    });
  }

  pliegos() {
    const n = this.mesa.paginas.length, l = n ? [[0]] : [];
    for (let i = 1; i < n; i += 2) l.push(i + 1 < n ? [i, i + 1] : [i]);
    return l;
  }

  abrir(desde) {
    this.origen = desde;
    this.mesa.soltarTodo();
    this.mesa.medir();
    this.caja.hidden = false;
    this.pliego = 0;
    this.caja.querySelector('[data-vl-cerrar]').focus();
    requestAnimationFrame(() => this.pintar());
  }

  cerrar() { this.caja.hidden = true; this.escena.replaceChildren(); if (this.origen) this.origen.focus(); }
  mover(d) { this.pliego += d; this.pintar(); }

  /* Una fila del contenido lleva a su pagina. Las copias son inertes: la fila se busca por donde cayo el clic. */
  irDesdeIndice(e) {
    const numeros = (this.mesa.datosDeIndice || {}).numeros || {};
    const fila = [...this.escena.querySelectorAll('.indice__fila')].find((a) => {
      const r = a.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    const n = fila && numeros[(fila.getAttribute('href') || '').slice(1)];
    if (!n) return false;
    const i = n - 1;
    this.pliego = i === 0 ? 0 : Math.ceil(i / 2);
    this.pintar();
    return true;
  }
  refrescar() { if (!this.caja.hidden) this.pintar(); }

  pintar() {
    const l = this.pliegos(), p = this.mesa.px;
    this.pliego = Math.min(l.length - 1, Math.max(0, this.pliego));
    const esc = Math.min((this.escena.clientHeight - 16) / p.H, (this.escena.clientWidth - 40) / (p.W * 2), 1.2);
    const caja = crear('div', 'pliego');
    for (const i of l[this.pliego] || []) caja.append(this.mesa.clon(this.mesa.paginas[i], esc));
    this.escena.replaceChildren(caja);
    const n = (l[this.pliego] || []).map((i) => i + 1), total = String(this.mesa.paginas.length);
    this.caja.querySelector('[data-vl-dice]').textContent = n.length > 1
      ? this.tx.pliegoDos.replace('{a}', String(n[0])).replace('{b}', String(n[1])).replace('{total}', total)
      : this.tx.pagDe.replace('{n}', String(n[0] || 0)).replace('{total}', total);
  }
}
