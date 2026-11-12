/* LAS PAGINAS DE LA IZQUIERDA. Una pagina libre se arrastra sola; una pagina de texto no, porque sale de
   como corre el texto: lo que se arrastra es el capitulo, por su nombre. Soltar sobre un texto pone la
   pagina al terminar un parrafo: nunca parte una frase.

   Pintar cada miniatura copia su capitulo, asi que solo se pintan las que estan a la vista. */
const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const ESCALA = .2;
const ANCHO_MAX = 112;            // lo que cabe en la columna, para hojas grandes como carta u oficio
const DESARMAR_MS = 3000;         // lo mismo que el boton rojo del panel
const PROPIOS = new Set(['pagina', 'paginas', 'capitulo']);   // lo que esta columna pone al arrastrar

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
    clearTimeout(this.relojSupr);
    this.relojSupr = 0;
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
        grupo.setAttribute('role', 'none');
        if (cap) {
          const c = cap;
          const t = crear('div', 'cap-mini', `▤ ${c.cap.titulo || `${m.tx.capitulo} ${m.vivos.indexOf(c) + 1}`}`);
          t.setAttribute('role', 'treeitem');
          t.setAttribute('aria-level', '1');
          t.setAttribute('aria-selected', 'false');
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
      /* Un arbol que deja elegir varias: el capitulo arriba y sus paginas debajo */
      b.setAttribute('role', 'treeitem');
      b.setAttribute('aria-level', p.vivo ? '2' : '1');
      b.setAttribute('aria-selected', String(m.estaElegida(p)));
      b.setAttribute('aria-label', `${m.tx.pagina2} ${n}`);
      b.dataset.n = String(n);
      b.append(crear('span', 'mini__n', String(n)), crear('span', 'mini__hoja'));
      b.lastChild.style.cssText = `width:${m.px.W * this.escala}px;height:${m.px.H * this.escala}px`;
      if (p.vista) {
        b.draggable = true;
        b.title = m.tx.arrastrarPagina;
        const v = p.vista;
        /* Si es de las elegidas, se lleva el bloque; si no, se elige sola y va sola, como en las presentaciones */
        b.addEventListener('dragstart', (e) => {
          const k = Number(b.dataset.n) - 1, bloque = m.cuantasElegidas() > 1 && m.estaElegida(m.paginas[k]);
          if (!bloque) m.elegirMini(k, 'uno');
          this.arrastrado = bloque ? { varias: true } : { vista: v };
          e.dataTransfer.setData('text/plain', bloque ? 'paginas' : 'pagina');
          e.dataTransfer.effectAllowed = 'move';
        });
        if (m.segura && m.seSale(v)) { b.append(crear('span', 'punto')); b.setAttribute('aria-label', `${m.tx.pagina2} ${n}. ${m.tx.fueraDeZona}`); }
      }
      /* Como en las presentaciones: clic elige una, Mayus+clic las de en medio, Ctrl+clic suma o quita una */
      b.addEventListener('mousedown', (e) => { if (e.shiftKey) e.preventDefault(); });
      b.addEventListener('click', (e) => {
        const k = Number(b.dataset.n), modo = e.shiftKey ? 'rango' : e.ctrlKey || e.metaKey ? 'alternar' : 'uno';
        m.elegirMini(k - 1, modo);
        if (modo === 'uno') m.irA(k);
        else this.enfocar(k);   // Mayus+clic no mueve el foco solo: Supr y las flechas siguen desde aqui
      });
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

  marcarEleccion() {
    for (const [b, p] of this.pedidas) b.setAttribute('aria-selected', String(this.mesa.estaElegida(p)));
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
    if (this.eligiendo(e, t, lista, i)) return;
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
    /* Una de varias elegidas: se mueve todo el bloque, y el foco va con el */
    if (this.mesa.cuantasElegidas() > 1 && this.mesa.estaElegida(p)) { this.mesa.moverVariasPaso(d); return; }
    await this.mesa.moverPaso(p.vista, d);
    this.enfocar(n + d);
  }

  /* Las teclas de elegir. Devuelve true si la tecla era suya. Supr pide dos pulsaciones, como el boton rojo. */
  eligiendo(e, t, lista, i) {
    const m = this.mesa, tx = m.tx, n = Number(t.dataset.n), ctrl = e.ctrlKey || e.metaKey, tecla = e.key.toLowerCase();
    const borrar = e.key === 'Delete' || e.key === 'Backspace';
    if (!borrar) { clearTimeout(this.relojSupr); this.relojSupr = 0; }
    if (ctrl && (tecla === 'z' || tecla === 'y')) { e.preventDefault(); m.historia(tecla === 'y' || e.shiftKey ? 'redo' : 'undo'); return true; }
    if (e.key === 'Escape' && m.cuantasElegidas()) { e.preventDefault(); m.soltarEleccion(true); return true; }
    if (!n) return false;
    if (ctrl && tecla === 'a') { e.preventDefault(); m.elegirMini(n - 1, 'todas'); return true; }
    if (ctrl && e.key === ' ') { e.preventDefault(); m.elegirMini(n - 1, 'alternar'); return true; }
    if (e.shiftKey && !e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const o = lista[i + (e.key === 'ArrowUp' ? -1 : 1)];
      if (!o || !o.dataset.n) return true;
      if (!m.eleccion.ancla) m.elegirMini(n - 1, 'uno');
      lista.forEach((x) => { x.tabIndex = x === o ? 0 : -1; });
      o.focus();
      m.elegirMini(Number(o.dataset.n) - 1, 'rango');
      return true;
    }
    if (borrar) {
      const p = m.paginas[n - 1];
      if (!p || !m.estaElegida(p)) return false;
      e.preventDefault();
      /* La tecla sostenida no confirma, y si lo elegido cambio desde la primera pulsacion se pregunta de nuevo */
      if (e.repeat) return true;
      if (this.relojSupr && this.armadaCon === m.eleccion) { clearTimeout(this.relojSupr); this.relojSupr = 0; m.borrarVarias(); return true; }
      clearTimeout(this.relojSupr);
      this.armadaCon = m.eleccion;
      const k = m.cuantasElegidas();
      m.decir(k > 1 ? tx.suprVarias.replace('{n}', String(k)) : tx.suprUna);
      this.relojSupr = setTimeout(() => { this.relojSupr = 0; }, DESARMAR_MS);
      return true;
    }
    return false;
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
    /* Solo lo que salio de esta columna: si un arrastre se corto a medias, algo traido de fuera no lo hereda */
    if (!PROPIOS.has(e.dataTransfer.getData('text/plain'))) return;
    const n = m ? Number(m.dataset.n) : 0;
    if (lo.varias) this.mesa.soltarVariasAntes(n);
    else if (lo.vista) this.mesa.moverPagina(lo.vista, n);
    else this.mesa.moverCapitulo(lo.capitulo, n);
  }
}
