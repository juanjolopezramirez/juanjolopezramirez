/* LAS PAGINAS DE LA IZQUIERDA. Una pagina libre se arrastra sola; una pagina de texto no, porque sale de
   como corre el texto: lo que se arrastra es el capitulo, por su nombre. Soltar sobre un texto pone la
   pagina al terminar un parrafo: nunca parte una frase.

   Pintar cada miniatura copia su capitulo, asi que solo se pintan las que estan a la vista. */
const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const ESCALA = .2;
const ANCHO_MAX = 112;            // lo que cabe en la columna, para hojas grandes como carta u oficio

export class Miniaturas {
  constructor(caja, mesa) {
    Object.assign(this, { caja, mesa });
    this.linea = crear('div', 'marca-soltar');
    this.arrastrado = null;
    this.pedidas = new Map();
    caja.addEventListener('keydown', (e) => this.alTeclear(e));
    caja.addEventListener('contextmenu', (e) => {
      const b = e.target.closest('.mini');
      if (b) mesa.abrirMenu(Number(b.dataset.n) - 1, e, b);
    });
    this.visor = new IntersectionObserver((lista) => lista.forEach((e) => { if (e.isIntersecting) this.llenar(e.target); }), { root: caja, rootMargin: '300px' });
    caja.addEventListener('dragend', () => { this.arrastrado = null; this.linea.remove(); });
    caja.addEventListener('dragover', (e) => this.alPasar(e));
    caja.addEventListener('dragleave', (e) => { if (!caja.contains(e.relatedTarget)) this.linea.remove(); });
    caja.addEventListener('drop', (e) => this.alSoltar(e));
  }

  /* Las copias de las paginas llevan el texto del libro: no se quedan al cerrarlo */
  vaciar() {
    this.arrastrado = null;
    this.visor.disconnect();
    this.pedidas = new Map();
    this.caja.replaceChildren();
  }

  pintar() {
    const m = this.mesa, ant = this.caja.scrollTop, pedidas = new Map(), conFoco = this.caja.contains(document.activeElement) ? document.activeElement.dataset.n : '';
    this.visor.disconnect();
    this.caja.replaceChildren();
    this.escala = Math.min(ESCALA, ANCHO_MAX / m.px.W);
    let grupo = null, cap, n = 0;
    for (const p of m.paginas) {
      n++;
      if (p.vivo !== cap) {
        cap = p.vivo;
        grupo = crear('div', 'bloque-mini');
        if (cap) {
          const c = cap;
          const t = crear('div', 'cap-mini', `▤ ${c.cap.titulo || m.tx.capitulo}`);
          t.draggable = true;
          t.tabIndex = -1;
          t.title = m.tx.arrastrarCapitulo;
          t.capitulo = c;
          t.addEventListener('dragstart', (e) => { this.arrastrado = { capitulo: c }; e.dataTransfer.setData('text/plain', 'capitulo'); e.dataTransfer.effectAllowed = 'move'; });
          grupo.append(t);
        }
        this.caja.append(grupo);
      }
      const b = crear('div', 'mini');
      b.tabIndex = -1;
      b.setAttribute('role', 'button');
      b.setAttribute('aria-label', `${m.tx.pagina2} ${n}`);
      b.dataset.n = String(n);
      b.append(crear('span', 'mini__n', String(n)), crear('span', 'mini__hoja'));
      b.lastChild.style.cssText = `width:${m.px.W * this.escala}px;height:${m.px.H * this.escala}px`;
      if (p.vista) {
        b.draggable = true;
        b.title = m.tx.arrastrarPagina;
        const v = p.vista;
        b.addEventListener('dragstart', (e) => { this.arrastrado = { vista: v }; e.dataTransfer.setData('text/plain', 'pagina'); e.dataTransfer.effectAllowed = 'move'; });
        if (m.segura && m.seSale(v)) { b.append(crear('span', 'punto')); b.setAttribute('aria-label', `${m.tx.pagina2} ${n}. ${m.tx.fueraDeZona}`); }
      }
      b.addEventListener('click', () => m.irA(Number(b.dataset.n)));
      grupo.append(b);
      pedidas.set(b, p);
    }
    this.pedidas = pedidas;
    this.caja.scrollTop = ant;
    for (const b of pedidas.keys()) this.visor.observe(b);
    this.marcar();
    if (conFoco) this.enfocar(conFoco);
  }

  llenar(b) {
    const p = this.pedidas.get(b);
    if (!p) return;
    this.visor.unobserve(b);
    const h = b.querySelector('.mini__hoja');
    h.replaceChildren(this.mesa.clon(p, this.escala));
  }

  /* La copia de una hoja se saca una vez: si su imagen llega despues, se saca de nuevo */
  refrescar(vista) {
    for (const [b, p] of this.pedidas) if (p.vista === vista && b.querySelector('.clon')) this.llenar(b);
  }

  refrescarTexto(vivo) {
    for (const [b, p] of this.pedidas) if (p.vivo === vivo && !p.vista && b.querySelector('.clon')) this.llenar(b);
  }

  marcar() {
    const a = this.mesa.paginaActual();
    const dentro = this.caja.contains(document.activeElement);
    this.caja.querySelectorAll('.mini').forEach((m) => {
      const es = Number(m.dataset.n) === a;
      m.setAttribute('aria-current', String(es));
      if (!dentro) m.tabIndex = es ? 0 : -1;
    });
  }

  /* ---- El teclado: una sola parada, flechas para recorrer y Alt+flecha para mover ---- */
  entrar() { (this.caja.querySelector('.mini[tabindex="0"]') || this.caja.querySelector('.mini')).focus(); }

  enfocar(n) {
    const b = this.caja.querySelector(`.mini[data-n="${n}"]`);
    if (!b) return;
    this.caja.querySelectorAll('.mini').forEach((m) => { m.tabIndex = m === b ? 0 : -1; });
    b.focus();
  }

  async alTeclear(e) {
    const t = e.target, lista = [...this.caja.querySelectorAll('.cap-mini, .mini')], i = lista.indexOf(t);
    if (i < 0) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (t.dataset.n) { this.mesa.irA(Number(t.dataset.n)); this.mesa.entrarEnPagina(Number(t.dataset.n)); }
      return;
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    if (e.altKey && e.repeat) return;
    const d = e.key === 'ArrowUp' ? -1 : 1;
    if (!e.altKey) { const o = lista[i + d]; if (o) { lista.forEach((x) => { x.tabIndex = x === o ? 0 : -1; }); o.focus(); } return; }
    if (t.capitulo) { this.mesa.moverCapituloPaso(t.capitulo, d); this.entrarAlCapitulo(t.capitulo); return; }
    const n = Number(t.dataset.n), p = this.mesa.paginas[n - 1];
    if (!p || !p.vista) { this.mesa.decir(this.mesa.tx.paginaDeTexto); return; }
    await this.mesa.moverPaso(p.vista, d);
    this.enfocar(n + d);
  }

  entrarAlCapitulo(c) {
    const t = [...this.caja.querySelectorAll('.cap-mini')].find((x) => x.capitulo === c);
    if (t) { t.tabIndex = 0; t.focus(); }
  }

  /* ---- Arrastrar ---- */
  destino(e) {
    for (const m of this.caja.querySelectorAll('.mini')) {
      const r = m.getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) return m;
    }
    return null;
  }

  alPasar(e) {
    if (!this.arrastrado) return;
    e.preventDefault();
    const m = this.destino(e);
    if (m) m.parentNode.insertBefore(this.linea, m); else this.caja.append(this.linea);
  }

  alSoltar(e) {
    if (!this.arrastrado) return;
    e.preventDefault();
    const m = this.destino(e), lo = this.arrastrado;
    this.arrastrado = null;
    this.linea.remove();
    const n = m ? Number(m.dataset.n) : 0;
    if (lo.vista) this.mesa.moverPagina(lo.vista, n);
    else this.mesa.moverCapitulo(lo.capitulo, n);
  }
}
