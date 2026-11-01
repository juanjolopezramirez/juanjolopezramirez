/* EL PANEL DE LA DERECHA: solo aparece cuando se elige algo, y flota sobre la mesa para que la hoja no
   salte. Lo que se ve al elegir depende de lo elegido: una imagen, un cuadro, un boton, una zona, una
   pagina libre o una pieza del texto. Las medidas van en milimetros; por dentro son % de la hoja.

   Cada cambio pinta el panel aparte y lo compara con el que se ve: si la forma es la misma solo se ponen
   los valores nuevos, asi nada parpadea ni pierde el foco. Se reemplaza cuando cambia lo elegido. */
import { SelectorColor } from './SelectorColor.js';
import { icono } from './iconos.js';
import { enlaceDeBoton, COPIA_MAX, TEXTO_MAX } from '../../../../contenido/taller/tipos/boton.js';

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const mm = (pct, base) => Math.round(pct * base) / 100;
const CIERRE_MS = 130;
const DESARMAR_MS = 3000;
const CONTROLES = 'input, select, textarea, button';
const ATRIBUTOS = ['style', 'class', 'title', 'aria-pressed', 'aria-label', 'aria-invalid', 'placeholder'];

const fuera = (n) => n.closest('.tal-color__panel');
const firma = (e) => [...e.querySelectorAll('*')].filter((n) => !fuera(n)).map((n) => n.tagName + (n.dataset.clave || '')).join();

function igualar(a, b) {
  if (a.selector) { a.selector.poner(b.selector.valor); return; }
  for (const k of ATRIBUTOS) { if (b.hasAttribute(k)) a.setAttribute(k, b.getAttribute(k)); else a.removeAttribute(k); }
  if (a.matches('input, textarea, select')) {
    if (a.dataset.escribiendo) return;
    if (a.type === 'checkbox') a.checked = b.checked; else a.value = b.value;
    return;
  }
  if (!a.children.length) { if (a.textContent !== b.textContent) a.textContent = b.textContent; return; }
  [...a.children].forEach((h, i) => igualar(h, b.children[i]));
}

export class Propiedades {
  constructor(caja, { tx, mesa }) {
    Object.assign(this, { caja, tx, mesa });
    caja.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); this.mesa.aLaHoja(); } });
    /* Mientras alguien escribe en un campo, nada le cambia el valor; al guardarlo vuelve a mandar lo guardado */
    caja.addEventListener('input', (e) => { e.target.dataset.escribiendo = '1'; }, true);
    caja.addEventListener('change', (e) => { delete e.target.dataset.escribiendo; }, true);
    /* Con el boton del raton abajo el panel no se reemplaza: el boton pulsado desapareceria y el clic se perderia */
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

  /* ---- Las piezas del panel ---- */
  accion(texto, fn, clase = '') {
    const b = crear('button', `tal-btn ${clase}`, texto);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }

  /* Un boton de icono: dice lo que hace al pasar por encima y al lector de pantalla */
  conIcono(nombre, texto, fn, clase = '') {
    const b = crear('button', `tal-accion ${clase}`);
    b.type = 'button';
    b.title = texto;
    b.setAttribute('aria-label', texto);
    b.append(icono(nombre));
    b.addEventListener('click', fn);
    return b;
  }

  /* Dos pasos: el primero se pone en rojo, y solo el segundo borra */
  armado(nombre, texto, confirmar, fn) {
    let reloj = 0;
    const desarmar = () => {
      clearTimeout(reloj);
      b.dataset.armado = '';
      b.classList.remove('tal-accion--armada');
      b.title = texto;
      b.setAttribute('aria-label', texto);
    };
    const b = this.conIcono(nombre, texto, () => {
      if (b.dataset.armado === '1') { desarmar(); fn(); return; }
      b.dataset.armado = '1';
      b.classList.add('tal-accion--armada');
      b.title = confirmar;
      b.setAttribute('aria-label', confirmar);
      this.mesa.decir(confirmar);
      reloj = setTimeout(desarmar, DESARMAR_MS);
    }, 'tal-accion--aviso');
    b.addEventListener('blur', desarmar);
    return b;
  }

  par(texto, valor, alCambiar, tipo = 'number', max = 0) {
    const l = crear('label', tipo === 'checkbox' ? 'tal-par tal-par--marca' : 'tal-par'), i = crear('input');
    i.type = tipo;
    if (tipo === 'checkbox') i.checked = valor; else i.value = valor;
    if (tipo === 'text' && max) i.maxLength = max;
    i.addEventListener('change', () => alCambiar(tipo === 'number' ? Number(i.value) : tipo === 'checkbox' ? i.checked : i.value));
    l.append(crear('span', '', texto), i);
    return l;
  }

  /* Un numero con su nombre corto adentro: seis caben en dos filas */
  medida(corto, texto, valor, alCambiar) {
    const l = crear('label', 'tal-medida'), i = crear('input');
    i.type = 'number';
    i.value = valor;
    i.title = texto;
    i.setAttribute('aria-label', texto);
    i.addEventListener('change', () => alCambiar(Number(i.value)));
    l.append(crear('span', '', corto), i);
    return l;
  }

  /* Opciones que se excluyen: `op` es [valor, texto, icono?] */
  segmento(opciones, actual, fn) {
    const g = crear('div', 'tal-seg');
    for (const [k, t, ic] of opciones) {
      const b = crear('button', 'tal-seg__op', ic ? undefined : t);
      b.type = 'button';
      if (ic) { b.title = t; b.setAttribute('aria-label', t); b.append(icono(ic)); }
      b.setAttribute('aria-pressed', String(actual === k));
      b.addEventListener('click', () => fn(k));
      g.append(b);
    }
    return g;
  }

  /* Lo que rara vez se toca se pliega. Recuerda si estaba abierto mientras dure el libro. */
  pliegue(titulo, hijos) {
    const d = crear('details', 'tal-pliegue'), s = crear('summary', '', titulo);
    s.dataset.clave = `pliegue:${titulo}`;
    d.open = !!this.pliegueAbierto;
    d.addEventListener('toggle', () => { this.pliegueAbierto = d.open; });
    d.append(s, ...hijos);
    return d;
  }

  /* Un color con su nombre. Su lista flota: el panel no crece. */
  color(etiqueta, valor, alCambiar) {
    const l = crear('div', 'tal-par');
    const s = new SelectorColor({ tx: this.tx, etiqueta, valor, recientes: () => this.mesa.coloresUsados(), alCambiar: (c) => { this.mesa.recordarColor(c); alCambiar(c); } });
    l.append(crear('span', '', etiqueta), s.nodo);
    return l;
  }

  /* ---- Abrir, cerrar y cambiar ---- */
  /* Primero sale del campo: lo escrito se guarda, y lo que eso pida rehacer se cancela despues. El contenido
     se queda un momento, para que se vea irse. */
  ocultar() {
    const a = document.activeElement;
    if (this.caja.contains(a)) a.blur();
    this.pendiente = null;
    this.dueno = null;
    this.caja.hidden = true;
    clearTimeout(this.relojVaciar);
    this.relojVaciar = setTimeout(() => { this.caja.replaceChildren(); this.lienzo = null; }, CIERRE_MS);
  }

  escribiendo() { return !!this.caja.querySelector('[data-escribiendo]'); }

  rehacer(hacer) {
    if (this.apretado) this.pendiente = hacer;
    else hacer();
  }

  entrar() { const c = this.caja.querySelector(CONTROLES); if (c) c.focus(); }

  /* `dueno` y `clave` dicen de que se esta hablando: si son otros, el panel se reemplaza */
  poner(pintar, dueno, clave) {
    clearTimeout(this.relojVaciar);
    const nuevo = crear('div', 'tal-panel__dentro');
    this.lienzo = nuevo;
    pintar();
    const hoy = this.caja.firstElementChild, igual = hoy && dueno === this.dueno && clave === this.clave && firma(hoy) === firma(nuevo);
    this.caja.hidden = false;
    if (igual) { igualar(hoy, nuevo); return; }
    this.dueno = dueno;
    this.clave = clave;
    this.conservarFoco(() => this.caja.replaceChildren(nuevo));
  }

  /* Al reemplazarlo el foco vuelve al mismo campo, o el teclado caeria al vacio */
  conservarFoco(pintar) {
    const a = document.activeElement, dentro = this.caja.contains(a);
    const nombre = (n) => n.dataset.clave || n.getAttribute('aria-label') || (n.closest('label') || n).textContent;
    const clave = dentro ? nombre(a) : '';
    pintar();
    if (!dentro) return;
    const igual = [...this.caja.querySelectorAll(CONTROLES)].find((n) => !fuera(n) && nombre(n) === clave);
    if (igual) igual.focus(); else this.mesa.aLaHoja();
  }

  /* ---- Lo elegido ---- */
  /* `v` es la hoja libre. Sin objeto elegido, se habla de la pagina. */
  deHoja(v) {
    if (v.editando || v.bloqueada) { this.ocultar(); return; }
    this.rehacer(() => {
      const o = v.objeto();
      this.poner(() => { if (o) this.deObjeto(v, o); else this.dePagina(v); }, v, `${o ? o.id : 'hoja'}:${v.recortando}`);
    });
  }

  deObjeto(v, o) {
    const tx = this.tx, p = this.mesa.config(), l = this.lienzo;
    l.append(crear('h2', '', { imagen: tx.objImagen, texto: tx.objCuadro, zona: tx.objZona, boton: tx.objBoton }[o.tipo]));
    if (v.recortando) {
      const lados = crear('div', 'tal-pares');
      for (const k of ['l', 't', 'r', 'b']) lados.append(this.par(tx.recorteLados[k], Math.round(o.crop[k] * 1000) / 10, (n) => v.cambiarRecorte(k, n / 100)));
      l.append(crear('p', '', tx.recorteAyuda), lados, this.accion(tx.listo, () => v.terminarRecorte(), 'tal-btn--fuerte'), this.accion(tx.quitarRecorte, () => v.quitarRecorte()));
      return;
    }
    if (o.tipo === 'texto') l.append(this.color(tx.colorLetra, o.color, (c) => v.cambiar({ color: c })));
    if (o.tipo === 'boton') this.camposDeBoton(o, (x) => v.cambiar(x));
    if (o.tipo === 'zona') l.append(this.par(tx.nombreZona, o.nombre, (t) => v.cambiar({ nombre: t }), 'text'));
    if (o.tipo === 'imagen') l.append(this.par(tx.alt, o.alt, (t) => v.cambiar({ alt: t }), 'text'), this.par(tx.adorno, o.decorativa, (s) => v.cambiar({ decorativa: s }), 'checkbox'));
    const g = crear('div', 'tal-medidas');
    const en = (k, eje) => (n) => v.cambiar({ [k]: (n / this.mesa.config()[eje]) * 100 });
    g.append(
      this.medida('An', tx.ancho, mm(o.w, p.anchoMm), en('w', 'anchoMm')), this.medida('Al', tx.alto, mm(o.h, p.altoMm), en('h', 'altoMm')),
      this.medida('X', 'X (mm)', mm(o.x, p.anchoMm), en('x', 'anchoMm')), this.medida('Y', 'Y (mm)', mm(o.y, p.altoMm), en('y', 'altoMm'))
    );
    if (o.tipo !== 'zona') g.append(this.medida('°', tx.giro, o.rot || 0, (n) => v.cambiar({ rot: n })));
    if (o.tipo === 'texto' || o.tipo === 'boton') g.append(this.medida('pt', tx.letraPt, parseFloat(o.tam), (n) => v.cambiar({ tam: `${n}pt` })));
    l.append(this.pliegue(tx.posicion, [g]));
    const ac = crear('div', 'tal-acciones');
    if (o.tipo === 'imagen') {
      ac.append(this.conIcono('recortar', tx.recortar, () => v.abrirRecorte()));
      if (Object.values(o.crop).some(Boolean)) ac.append(this.conIcono('sinRecorte', tx.quitarRecorte, () => v.quitarRecorte()));
    }
    ac.append(
      this.conIcono('adelante', tx.adelante, () => v.capa(1)), this.conIcono('atras', tx.atras, () => v.capa(-1)), this.conIcono('duplicar', tx.duplicar, () => v.duplicar()),
      this.conIcono('eliminar', tx.eliminar, () => v.eliminar(), 'tal-accion--aviso')
    );
    l.append(ac);
  }

  dePagina(v) {
    const tx = this.tx, a = v.attrs, l = this.lienzo;
    l.append(crear('h2', '', a.fondo ? tx.paginaPdf : tx.paginaLibre));
    if (a.fondo) {
      l.append(crear('p', '', tx.pdfSinColor), this.par(tx.altPagina, a.alt, (t) => v.cambiarHoja({ alt: t }), 'text'));
      l.append(this.segmento([['contener', tx.ajusteContener], ['cubrir', tx.ajusteCubrir]], a.ajuste, (k) => v.cambiarHoja({ ajuste: k })));
    } else l.append(this.color(tx.colorHoja, a.papel, (c) => v.cambiarHoja({ papel: c })));
    const agregar = crear('div', 'tal-acciones'), pagina = crear('div', 'tal-acciones');
    agregar.append(this.conIcono('imagen', tx.agregarImagen, () => this.mesa.pedirImagen()), this.conIcono('cuadro', tx.agregarCuadro, () => this.mesa.insertar('cuadro')), this.conIcono('boton', tx.agregarBoton, () => this.mesa.insertar('boton')), this.conIcono('zona', tx.agregarZona, () => this.mesa.insertar('zona')));
    pagina.append(
      this.conIcono('subir', tx.subirPagina, () => this.mesa.moverPaso(v, -1)), this.conIcono('bajar', tx.bajarPagina, () => this.mesa.moverPaso(v, 1)),
      this.conIcono('duplicar', tx.duplicarPagina, () => this.mesa.duplicarPagina(v)), this.armado('eliminar', tx.eliminarPagina, tx.eliminarPaginaSeguro, () => this.mesa.borrarPagina(v))
    );
    l.append(crear('p', 'tal-rotulo', tx.agregar), agregar, crear('p', 'tal-rotulo', tx.estaPagina), pagina);
  }

  /* Lo que hace un boton, en la linea o en una pagina libre */
  camposDeBoton(o, cambiar) {
    const tx = this.tx, l = this.lienzo;
    l.append(this.par(tx.botonTexto, o.texto, (t) => cambiar({ texto: t }), 'text', TEXTO_MAX));
    l.append(this.segmento([['enlace', tx.botonEnlace], ['copiar', tx.botonCopiar]], o.accion, (k) => cambiar({ accion: k })));
    if (o.accion === 'enlace') {
      const c = this.par(tx.botonLink, o.enlace, (t) => { if (enlaceDeBoton(t) || !t) cambiar({ enlace: t }); else { i.setAttribute('aria-invalid', 'true'); this.mesa.decir(tx.botonLinkMal); } }, 'text');
      const i = c.querySelector('input');
      i.placeholder = 'https://';
      l.append(c);
    } else {
      const c = crear('label', 'tal-par'), t = crear('textarea');
      t.value = o.copia;
      t.rows = 3;
      t.maxLength = COPIA_MAX;
      t.addEventListener('change', () => cambiar({ copia: t.value }));
      c.append(crear('span', '', tx.botonPrompt), t);
      const pie = crear('div', 'tal-junto');
      pie.append(crear('p', '', tx.botonPdfCopiar), this.accion(tx.botonProbar, async () => {
        try { await navigator.clipboard.writeText(t.value); this.mesa.decir(tx.botonCopiado); } catch (e) { this.mesa.decir(tx.botonNoCopio); }
      }));
      l.append(c, pie);
    }
    const dos = crear('div', 'tal-pares');
    dos.append(this.color(tx.colorFondoBoton, o.fondo, (c) => cambiar({ fondo: c })), this.color(tx.colorLetra, o.color, (c) => cambiar({ color: c })));
    l.append(dos);
  }

  /* Un boton en su propia linea */
  deBoton(v) { this.rehacer(() => this.poner(() => this.pintarBoton(v), v, 'boton')); }

  pintarBoton(v) {
    const tx = this.tx, a = v.node.attrs, l = this.lienzo, cambiar = (x) => { v.updateAttributes(x); this.deBoton(v); };
    l.append(crear('h2', '', tx.objBoton));
    this.camposDeBoton(a, cambiar);
    const ac = crear('div', 'tal-junto');
    ac.append(
      this.segmento([['', tx.alinear.izquierda, 'izquierda'], ['centro', tx.alinear.centro, 'centro'], ['derecha', tx.alinear.derecha, 'derecha']], a.alinear, (k) => cambiar({ alinear: k })),
      this.conIcono('eliminar', tx.eliminar, () => this.mesa.borrarImagen(v), 'tal-accion--aviso')
    );
    l.append(ac);
  }

  /* Una imagen dentro del texto */
  deImagen(v) { this.rehacer(() => this.poner(() => this.pintarImagen(v), v, 'imagen')); }

  pintarImagen(v) {
    const tx = this.tx, a = v.node.attrs, l = this.lienzo;
    l.append(crear('h2', '', tx.objImagenTexto), crear('p', '', tx.imagenTextoAyuda));
    l.append(
      this.segmento([['linea', tx.enLinea], ['izq', tx.aIzquierda], ['der', tx.aDerecha]], a.modo, (k) => { v.updateAttributes({ modo: k }); this.deImagen(v); }),
      this.par(tx.anchoPct, a.anchoPct, (n) => v.updateAttributes({ anchoPct: n })), this.par(tx.alt, a.alt, (t) => v.updateAttributes({ alt: t }), 'text'), this.par(tx.pie, a.pie, (t) => v.updateAttributes({ pie: t }), 'text'), this.par(tx.adorno, a.decorativa, (s) => v.updateAttributes({ decorativa: s }), 'checkbox')
    );
    const ac = crear('div', 'tal-junto');
    ac.append(this.accion(tx.pasarLibre, () => this.mesa.pasarALibre(v)), this.conIcono('eliminar', tx.eliminar, () => this.mesa.borrarImagen(v), 'tal-accion--aviso'));
    l.append(ac);
  }
}
