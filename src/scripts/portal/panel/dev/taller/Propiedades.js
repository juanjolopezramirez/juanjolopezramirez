/* EL PANEL DE LA DERECHA: solo aparece cuando se elige algo, y flota sobre la mesa para que la hoja no
   salte. Lo que se ve al elegir depende de lo elegido: una imagen, un cuadro, una zona, una pagina
   libre o una imagen dentro del texto. Las medidas van en milimetros; por dentro son % de la hoja. */
import { SelectorColor } from './SelectorColor.js';
import { enlaceDeBoton, COPIA_MAX, TEXTO_MAX } from '../../../../contenido/taller/tipos/boton.js';

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const mm = (pct, base) => Math.round(pct * base) / 100;

export class Propiedades {
  constructor(caja, { tx, mesa }) {
    Object.assign(this, { caja, tx, mesa });
    caja.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); this.mesa.aLaHoja(); } });
    /* Con el boton del raton abajo el panel no se rehace: el boton pulsado desapareceria y el clic se perderia */
    caja.addEventListener('pointerdown', () => { this.apretado = true; }, true);
    const soltar = () => setTimeout(() => {
      this.apretado = false;
      const f = this.pendiente;
      this.pendiente = null;
      if (f) f();
    }, 0);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
  }

  accion(texto, fn, clase = '') {
    const b = crear('button', `tal-btn ${clase}`, texto);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }

  armado(texto, confirmar, fn) {
    const b = this.accion(texto, () => {
      if (b.dataset.armado === '1') { fn(); return; }
      b.dataset.armado = '1';
      b.textContent = confirmar;
      this.mesa.decir(confirmar);
    }, 'tal-btn--aviso');
    b.addEventListener('blur', () => { b.dataset.armado = ''; b.textContent = texto; });
    return b;
  }

  par(texto, valor, alCambiar, tipo = 'number', max = 0) {
    const l = crear('label', 'tal-par'), i = crear('input');
    i.type = tipo;
    if (tipo === 'checkbox') i.checked = valor; else i.value = valor;
    if (tipo === 'text' && max) i.maxLength = max;
    i.addEventListener('change', () => alCambiar(tipo === 'number' ? Number(i.value) : tipo === 'checkbox' ? i.checked : i.value));
    l.append(crear('span', '', texto), i);
    return l;
  }

  /* Primero sale del campo: lo escrito se guarda, y lo que eso pida rehacer se cancela despues */
  ocultar() {
    const a = document.activeElement;
    if (this.caja.contains(a)) a.blur();
    this.pendiente = null;
    this.caja.hidden = true;
    this.caja.replaceChildren();
  }

  rehacer(pintar) {
    if (this.apretado) this.pendiente = () => this.conservarFoco(pintar);
    else this.conservarFoco(pintar);
  }

  entrar() { const c = this.caja.querySelector('input, select, textarea, summary, button'); if (c) c.focus(); }

  /* Un color con su nombre. Va dentro del panel, que recorta lo que flota. */
  color(etiqueta, valor, alCambiar) {
    const l = crear('div', 'tal-par');
    const s = new SelectorColor({ tx: this.tx, etiqueta, valor, enLinea: true, recientes: () => this.mesa.coloresUsados(), alCambiar: (c) => { this.mesa.recordarColor(c); alCambiar(c); } });
    l.append(crear('span', '', etiqueta), s.nodo);
    return l;
  }

  /* El panel se rehace con cada cambio: el foco vuelve al mismo campo, o el teclado caeria al vacio */
  conservarFoco(pintar) {
    const a = document.activeElement, dentro = this.caja.contains(a);
    const nombre = (n) => n.dataset.clave || (n.closest('label') || n).textContent;
    const clave = dentro ? nombre(a) : '';
    pintar();
    if (!dentro) return;
    const igual = [...this.caja.querySelectorAll('input, select, textarea, summary, button')].find((n) => nombre(n) === clave);
    if (igual) igual.focus(); else this.mesa.aLaHoja();
  }

  /* `v` es la hoja libre. Sin objeto elegido, se habla de la pagina. */
  deHoja(v) {
    if (v.editando || v.bloqueada) { this.ocultar(); return; }
    this.rehacer(() => {
      this.caja.replaceChildren();
      this.caja.hidden = false;
      const o = v.objeto();
      if (o) this.deObjeto(v, o); else this.dePagina(v);
    });
  }

  deObjeto(v, o) {
    const tx = this.tx, p = this.mesa.config();
    this.caja.append(crear('h2', '', { imagen: tx.objImagen, texto: tx.objCuadro, zona: tx.objZona, boton: tx.objBoton }[o.tipo]));
    if (v.recortando) {
      const lados = crear('div', 'tal-pares');
      for (const k of ['l', 't', 'r', 'b']) lados.append(this.par(tx.recorteLados[k], Math.round(o.crop[k] * 1000) / 10, (n) => v.cambiarRecorte(k, n / 100)));
      this.caja.append(crear('p', '', tx.recorteAyuda), lados, this.accion(tx.listo, () => v.terminarRecorte(), 'tal-btn--fuerte'), this.accion(tx.quitarRecorte, () => v.quitarRecorte()));
      return;
    }
    const g = crear('div', 'tal-pares');
    const medida = (k, base) => (n) => v.cambiar({ [k]: (n / base) * 100 });
    g.append(
      this.par(tx.ancho, mm(o.w, p.anchoMm), medida('w', p.anchoMm)), this.par(tx.alto, mm(o.h, p.altoMm), medida('h', p.altoMm)),
      this.par('X (mm)', mm(o.x, p.anchoMm), medida('x', p.anchoMm)), this.par('Y (mm)', mm(o.y, p.altoMm), medida('y', p.altoMm))
    );
    if (o.tipo !== 'zona') g.append(this.par(tx.giro, o.rot || 0, (n) => v.cambiar({ rot: n })));
    if (o.tipo === 'texto' || o.tipo === 'boton') g.append(this.par(tx.letraPt, parseFloat(o.tam), (n) => v.cambiar({ tam: `${n}pt` })));
    if (o.tipo === 'zona') g.append(this.par(tx.nombreZona, o.nombre, (t) => v.cambiar({ nombre: t }), 'text'));
    this.caja.append(g);
    if (o.tipo === 'texto') this.caja.append(this.color(tx.colorLetra, o.color, (c) => v.cambiar({ color: c })));
    if (o.tipo === 'boton') this.camposDeBoton(o, (x) => v.cambiar(x));
    if (o.tipo === 'imagen') {
      this.caja.append(this.par(tx.alt, o.alt, (t) => v.cambiar({ alt: t }), 'text'), this.par(tx.adorno, o.decorativa, (s) => v.cambiar({ decorativa: s }), 'checkbox'));
    }
    const ac = crear('div', 'tal-acciones');
    if (o.tipo === 'imagen') {
      ac.append(this.accion(tx.recortar, () => v.abrirRecorte()));
      if (Object.values(o.crop).some(Boolean)) ac.append(this.accion(tx.quitarRecorte, () => v.quitarRecorte()));
    }
    ac.append(this.accion(tx.adelante, () => v.capa(1)), this.accion(tx.atras, () => v.capa(-1)), this.accion(tx.duplicar, () => v.duplicar()), this.accion(tx.eliminar, () => v.eliminar(), 'tal-btn--aviso'));
    this.caja.append(ac);
  }

  dePagina(v) {
    const tx = this.tx, a = v.attrs;
    this.caja.append(crear('h2', '', a.fondo ? tx.paginaPdf : tx.paginaLibre));
    if (!a.fondo) this.caja.append(this.color(tx.colorHoja, a.papel, (c) => v.cambiarHoja({ papel: c })));
    if (a.fondo) {
      this.caja.append(crear('p', '', tx.pdfSinColor));
      this.caja.append(this.par(tx.altPagina, a.alt, (t) => v.cambiarHoja({ alt: t }), 'text'));
      const l = crear('label', 'tal-par'), s = crear('select');
      for (const [k, t] of [['contener', tx.ajusteContener], ['cubrir', tx.ajusteCubrir]]) { const o = crear('option', '', t); o.value = k; s.append(o); }
      s.value = a.ajuste;
      s.addEventListener('change', () => v.cambiarHoja({ ajuste: s.value }));
      l.append(crear('span', '', tx.ajuste), s);
      this.caja.append(l);
    }
    const ac = crear('div', 'tal-acciones');
    ac.append(
      this.accion(tx.agregarImagen, () => this.mesa.pedirImagen()), this.accion(tx.agregarCuadro, () => this.mesa.insertar('cuadro')), this.accion(tx.agregarZona, () => this.mesa.insertar('zona')),
      this.accion(tx.subirPagina, () => this.mesa.moverPaso(v, -1)), this.accion(tx.bajarPagina, () => this.mesa.moverPaso(v, 1)),
      this.accion(tx.duplicarPagina, () => this.mesa.duplicarPagina(v)), this.armado(tx.eliminarPagina, tx.eliminarPaginaSeguro, () => this.mesa.borrarPagina(v))
    );
    this.caja.append(ac);
  }

  /* Lo que hace un boton, en la linea o en una pagina libre */
  camposDeBoton(o, cambiar) {
    const tx = this.tx;
    this.caja.append(this.par(tx.botonTexto, o.texto, (t) => cambiar({ texto: t }), 'text', TEXTO_MAX));
    const modos = crear('div', 'tal-pares');
    for (const [k, t] of [['enlace', tx.botonEnlace], ['copiar', tx.botonCopiar]]) {
      const b = this.accion(t, () => cambiar({ accion: k }));
      b.setAttribute('aria-pressed', String(o.accion === k));
      modos.append(b);
    }
    this.caja.append(modos);
    if (o.accion === 'enlace') {
      const l = this.par(tx.botonLink, o.enlace, (t) => { if (enlaceDeBoton(t) || !t) cambiar({ enlace: t }); else { i.setAttribute('aria-invalid', 'true'); this.mesa.decir(tx.botonLinkMal); } }, 'text');
      const i = l.querySelector('input');
      i.placeholder = 'https://';
      this.caja.append(l);
    } else {
      const l = crear('label', 'tal-par'), t = crear('textarea');
      t.value = o.copia;
      t.rows = 5;
      t.maxLength = COPIA_MAX;
      t.addEventListener('change', () => cambiar({ copia: t.value }));
      l.append(crear('span', '', tx.botonPrompt), t);
      const probar = this.accion(tx.botonProbar, async () => {
        try { await navigator.clipboard.writeText(t.value); this.mesa.decir(tx.botonCopiado); } catch (e) { this.mesa.decir(tx.botonNoCopio); }
      });
      this.caja.append(l, probar, crear('p', '', tx.botonPdfCopiar));
    }
    this.caja.append(this.color(tx.colorFondoBoton, o.fondo, (c) => cambiar({ fondo: c })), this.color(tx.colorLetra, o.color, (c) => cambiar({ color: c })));
  }

  /* Un boton en su propia linea */
  deBoton(v) { this.rehacer(() => this.pintarBoton(v)); }

  pintarBoton(v) {
    const tx = this.tx, a = v.node.attrs, cambiar = (x) => { v.updateAttributes(x); this.deBoton(v); };
    this.caja.replaceChildren();
    this.caja.hidden = false;
    this.caja.append(crear('h2', '', tx.objBoton));
    this.camposDeBoton(a, cambiar);
    const l = crear('div', 'tal-pares');
    for (const [k, t] of [['', tx.aIzquierda], ['centro', tx.alinear.centro], ['derecha', tx.aDerecha]]) {
      const b = this.accion(t, () => cambiar({ alinear: k }));
      b.setAttribute('aria-pressed', String(a.alinear === k));
      l.append(b);
    }
    const ac = crear('div', 'tal-acciones');
    ac.append(this.accion(tx.eliminar, () => this.mesa.borrarImagen(v), 'tal-btn--aviso'));
    this.caja.append(l, ac);
  }

  /* Una imagen dentro del texto */
  deImagen(v) { this.rehacer(() => this.pintarImagen(v)); }

  pintarImagen(v) {
    const tx = this.tx, a = v.node.attrs;
    this.caja.replaceChildren();
    this.caja.hidden = false;
    this.caja.append(crear('h2', '', tx.objImagenTexto), crear('p', '', tx.imagenTextoAyuda));
    const modos = crear('div', 'tal-pares');
    for (const [k, t] of [['linea', tx.enLinea], ['izq', tx.aIzquierda], ['der', tx.aDerecha]]) {
      const b = this.accion(t, () => { v.updateAttributes({ modo: k }); this.deImagen(v); });
      b.setAttribute('aria-pressed', String(a.modo === k));
      modos.append(b);
    }
    this.caja.append(modos, this.par(tx.anchoPct, a.anchoPct, (n) => v.updateAttributes({ anchoPct: n })), this.par(tx.alt, a.alt, (t) => v.updateAttributes({ alt: t }), 'text'), this.par(tx.pie, a.pie, (t) => v.updateAttributes({ pie: t }), 'text'), this.par(tx.adorno, a.decorativa, (s) => v.updateAttributes({ decorativa: s }), 'checkbox'));
    const ac = crear('div', 'tal-acciones');
    ac.append(this.accion(tx.pasarLibre, () => this.mesa.pasarALibre(v)), this.accion(tx.eliminar, () => this.mesa.borrarImagen(v), 'tal-btn--aviso'));
    this.caja.append(ac);
  }
}
