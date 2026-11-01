/* LA MESA: las hojas del libro en una tira, con las miniaturas a la izquierda y el panel que aparece al
   elegir algo. Reune los capitulos vivos y todo lo que no es de uno solo: el orden de las paginas, el
   zoom, la zona segura y mover paginas de un lado a otro.

   EL ZOOM ES UNA ESCALA, no `zoom` de CSS: la prueba de la Etapa 1 mostro que el otro mueve los cortes
   de pagina. Con la escala, lo que se ve en cualquier zoom es lo que sale en el PDF. */
import { Selection } from '@tiptap/pm/state';
import { Capitulo } from '../../../../contenido/taller/Obra.js';
import { ConfigPagina } from '../../../../contenido/taller/ConfigPagina.js';
import { cssLibro } from '../../../../contenido/taller/hoja.js';
import { variablesDe } from '../../../../contenido/taller/colores.js';
import { fueraDeMargen } from '../../../../contenido/taller/tipos/paginaLibre.js';
import { CapituloVivo } from './CapituloVivo.js';
import { Miniaturas } from './Miniaturas.js';
import { Propiedades } from './Propiedades.js';
import { MenuPagina } from './MenuPagina.js';

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const tope = (v, a, b) => Math.min(b, Math.max(a, v));
const PINTAR_MS = 400;
const ZOOM_MIN = .25, ZOOM_MAX = 3;

export class Mesa {
  constructor(raiz, o) {
    Object.assign(this, { raiz, ...o });      // tx, ctx, pestana, imagenes, editable, obra(), alEstadoGlobal, alFalla, alDecir, alImagen
    this.vivos = [];
    this.vistas = new Set();
    this.paginas = [];
    this.z = 1;
    this.segura = false;
    this.activo = null;                       // el ultimo capitulo con el cursor
    this.hojaActiva = null;
    this.imagenElegida = null;
    const q = (s) => raiz.querySelector(s);
    this.q = q;
    this.fondo = q('[data-tal-fondo]');
    this.caja = q('[data-tal-lienzo-caja]');
    this.lienzo = q('[data-tal-lienzo]');
    this.estilo = raiz.querySelector('style') || raiz.appendChild(crear('style'));
    this.prop = new Propiedades(q('[data-tal-panel]'), { tx: this.tx, mesa: this });
    this.minis = new Miniaturas(q('[data-tal-miniaturas]'), this);
    this.menu = new MenuPagina(raiz, { tx: this.tx });
    this.fondo.addEventListener('scroll', () => requestAnimationFrame(() => this.alDesplazar()));
    this.fondo.addEventListener('pointerdown', (e) => { if (e.target === this.fondo || e.target === this.caja || e.target === this.lienzo) this.soltarTodo(); });
    this.fondo.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); this.zoom(this.z - Math.sign(e.deltaY) * .1); } }, { passive: false });
    q('[data-z-menos]').addEventListener('click', () => this.zoom(this.z - .1));
    q('[data-z-mas]').addEventListener('click', () => this.zoom(this.z + .1));
    q('[data-z-ajustar]').addEventListener('click', () => this.zoom((this.fondo.clientHeight - 56) / this.px.H));
    q('[data-t-segura]').addEventListener('change', (e) => { this.segura = e.target.checked; this.repintarHojas(); });
    new ResizeObserver(() => this.ajustarCaja()).observe(this.lienzo);
  }

  get be() { return this.ctx.be; }
  get px() { return new ConfigPagina(this.obra().pagina).enPixeles(); }
  config() { return this.obra().pagina; }
  idioma() { return this.obra().idioma; }
  margenes() { return new ConfigPagina(this.obra().pagina).aPorcentajes(); }
  verNumeros() { return this.obra().pagina.numeros.ver; }
  decir(t) { this.alDecir(t); }
  imagen(ruta) { return this.imagenes.dame(ruta); }

  /* ---- Abrir ---- */
  abrir(capitulos) {
    this.raiz.toggleAttribute('data-solo-ver', !this.editable);
    this.aplicarPagina();
    this.vivos = capitulos.map((c) => new CapituloVivo(c, this));
    this.lienzo.replaceChildren(...this.vivos.map((v) => v.caja));
    this.activo = this.vivos[0] || null;
    this.medir();
    this.zoom(Math.min(1, (this.fondo.clientWidth - 40) / this.px.W));
  }

  cerrar() {
    this.menu.cerrar(false);
    this.vivos.forEach((v) => v.soltar());
    this.vivos = [];
    this.vistas.clear();
    this.paginas = [];
    this.lienzo.replaceChildren();
    this.minis.vaciar();
    this.prop.ocultar();
    this.activo = null; this.hojaActiva = null; this.imagenElegida = null; this.ultimaVista = null;
    this.raiz.removeAttribute('style');
    clearTimeout(this.reloj);
    this.q('[data-t-segura]').checked = false;
    this.segura = false;
  }

  /* El tamaño de la hoja vive en variables de estilo: de ahi salen el papel, las columnas y el corte */
  aplicarPagina() {
    const p = this.px, s = this.raiz.style;
    for (const [k, v] of Object.entries({ W: p.W, H: p.H, mt: p.mt, mb: p.mb, ml: p.ml, mr: p.mr, gap: p.gap, ancho: p.ancho, alto: p.alto })) s.setProperty(`--${k}`, `${v}px`);
    s.setProperty('--salto', `${p.mt + p.mb + p.gap}px`);
    for (const [k, v] of Object.entries(variablesDe(this.obra().pagina.papel))) s.setProperty(k, v);
    this.estilo.textContent = cssLibro(this.obra().pagina);
  }

  coloresUsados() { return this.obra().pagina.colores; }

  repintarHojas() { this.aplicarPagina(); this.vistas.forEach((v) => v.pintar()); this.medir(); }

  /* ---- Medir ---- */
  /* Cuantas filas lleva cada hoja del indice. Se miden: un titulo largo ocupa dos renglones y la letra
     cambia, y si aqui saliera una hoja menos que al imprimir, todos los numeros del indice mentirian. */
  repartoDeIndice() {
    const titulos = this.vivos.map((v) => v.cap.titulo).filter(Boolean);
    if (!this.obra().pagina.indice || !titulos.length) return [];
    const h = crear('section', 'hoja hoja--indice libro'), dentro = crear('div', 'indice');
    h.style.cssText = 'position:absolute;visibility:hidden';
    dentro.append(crear('h1', '', this.tx.indiceTitulo));
    for (const t of titulos) { const f = crear('button', 'indice__fila'); f.append(crear('span', '', t), crear('span', '', '000')); dentro.append(f); }
    h.append(dentro);
    this.lienzo.append(h);
    const filas = [...dentro.querySelectorAll('.indice__fila')], reparto = [0];
    let corte = dentro.firstChild.offsetTop;
    for (const f of filas) {
      if (f.offsetTop + f.offsetHeight - corte > this.px.alto) { reparto.push(0); corte = f.offsetTop; }
      reparto[reparto.length - 1]++;
    }
    h.remove();
    return reparto;
  }

  medir() {
    const p = this.px, reparto = this.repartoDeIndice(), ind = reparto.length;
    this.paginas = [];
    for (let i = 0; i < ind; i++) this.paginas.push({ vivo: null, fila: i, vista: null, indice: true });
    let n = ind;
    for (const v of this.vivos) {
      v.primera = n + 1;
      n += v.medir(n + 1, p, this.z, this.segura);
      for (const f of v.filas) this.paginas.push({ vivo: v, ...f });
    }
    this.pintarIndice(reparto);
    this.minis.pintar();
    this.contar();
  }

  entradasDeIndice() { return this.vivos.map((v, i) => ({ titulo: v.cap.titulo, pagina: v.primera, capitulo: i + 1 })).filter((f) => f.titulo); }

  pintarIndice(reparto) {
    this.lienzo.querySelectorAll('.hoja--indice').forEach((h) => h.remove());
    const lista = this.entradasDeIndice(), cajas = [];
    let desde = 0;
    for (let i = 0; i < reparto.length; i++) {
      const h = crear('section', 'hoja hoja--indice libro');
      const dentro = crear('div', 'indice');
      if (i === 0) dentro.append(crear('h1', '', this.tx.indiceTitulo));
      for (const f of lista.slice(desde, desde + reparto[i])) {
        const a = crear('button', 'indice__fila');
        a.type = 'button';
        a.append(crear('span', '', f.titulo), crear('span', '', String(f.pagina)));
        a.addEventListener('click', () => this.irA(f.pagina));
        dentro.append(a);
      }
      desde += reparto[i];
      h.append(dentro);
      cajas.push(h);
    }
    this.lienzo.prepend(...cajas);
  }

  /* F6 pasa entre las partes de la mesa, como en Word */
  saltar(d) {
    const partes = [
      [this.q('[data-tal-cinta]'), () => this.cinta.entrar()],
      [this.q('[data-tal-miniaturas]'), () => this.minis.entrar()],
      [this.fondo, () => this.aLaHoja()],
      [this.prop.caja, () => this.prop.entrar()],
      [this.q('.tal-pie'), () => this.q('.tal-pie input, .tal-pie button').focus()]
    ].filter(([n]) => !n.hidden);
    const hoy = partes.findIndex(([n]) => n.contains(document.activeElement));
    partes[(hoy + d + partes.length) % partes.length][1]();
  }

  aLaHoja() {
    if (this.hojaActiva) this.hojaActiva.hoja.focus({ preventScroll: true });
    else if (this.activo) this.activo.editor.commands.focus();
  }

  /* Una pagina arriba o abajo, sin arrastrar: la misma puerta que soltarla */
  moverPaso(h, d) {
    const i = this.paginas.findIndex((p) => p.vista === h);
    if (i < 0 || (d < 0 && i === 0)) return;
    const n = d < 0 ? i : i + 3;
    return this.moverPagina(h, n > this.paginas.length ? 0 : n);
  }

  /* Dejar la pagina en el numero `d`. `moverPagina` pone antes de una pagina: hacia abajo es la siguiente.
     El texto puede correrse, asi que se dice donde quedo de verdad. */
  async moverHasta(h, d) {
    const a = this.paginas.findIndex((p) => p.vista === h) + 1, total = this.paginas.length;
    if (!a || d === a) return;
    const n = d < a ? d : d + 1;
    const puesto = await this.moverPagina(h, n > total ? 0 : n);
    if (!puesto) return;
    /* Por su nodo y no por `h`: al mover lejos, ProseMirror reutiliza las vistas y `h` ya muestra otra pagina */
    const i = this.paginas.findIndex((p) => p.vista && p.vista.node === puesto);
    if (i < 0) return;
    this.irA(i + 1);
    this.paginas[i].vista.hoja.focus({ preventScroll: true });
    this.decir(this.tx.paginaQuedo.replace('{n}', String(i + 1)));
  }

  /* ---- El menu de clic derecho ---- */
  /* Las imagenes puestas se miden en % de la hoja: otra proporcion las estira */
  imagenesPuestas() {
    let n = 0;
    for (const v of this.vivos) {
      v.editor.state.doc.descendants((x) => { if (x.type.name === 'paginaLibre') n += x.attrs.objetos.filter((o) => o.tipo === 'imagen').length; });
    }
    return n;
  }

  primeraDeTexto() { return this.paginas.findIndex((p) => !p.indice) + 1 || 1; }

  accionesDePagina(i) {
    const tx = this.tx, p = this.paginas[i], n = i + 1, ir = { texto: tx.irAPagina, icono: 'ir', fn: () => this.irA(n) };
    if (!p || p.indice) return [ir];
    if (!p.vista) {
      return [ir, { texto: tx.libreAqui, icono: 'hoja', fn: () => this.ponerLibreAqui(p), apagado: !p.vivo.editor.isEditable }, { raya: true },
        { texto: tx.moverA, icono: 'mover', apagado: true, ayuda: tx.paginaDeTexto }, { texto: tx.eliminarPagina, icono: 'eliminar', apagado: true, ayuda: tx.paginaDeTexto }];
    }
    const h = p.vista, quieta = h.bloqueada;
    return [ir,
      { texto: tx.duplicarPagina, icono: 'duplicar', apagado: quieta, fn: () => { this.activoDe(h); this.duplicarPagina(h); this.decir(tx.paginaDuplicada); } },
      { texto: tx.moverA, icono: 'mover', apagado: quieta, queda: true, fn: () => this.menu.mover({ actual: n, total: this.paginas.length, primera: this.primeraDeTexto(), alMover: (d) => this.moverHasta(h, d) }) },
      { raya: true },
      { texto: tx.eliminarPagina, icono: 'eliminar', aviso: true, apagado: quieta, fn: () => { this.activoDe(h); this.borrarPagina(h); } }];
  }

  abrirMenu(i, e, origen, antes = []) {
    e.preventDefault();
    const con = e.clientX || e.clientY, r = origen.getBoundingClientRect();
    this.menu.abrir(con ? e.clientX : r.left + 16, con ? e.clientY : r.top + 16, [...antes, ...this.accionesDePagina(i)], origen, () => this.minis.enfocar(i + 1));
  }

  /* Sobre una hoja: si hay un objeto bajo el puntero, sus acciones van primero */
  menuDeHoja(h, o, e) {
    const tx = this.tx, antes = !o || h.bloqueada ? [] : [
      { texto: tx.duplicar, icono: 'duplicar', fn: () => h.duplicar() }, { texto: tx.adelante, icono: 'adelante', fn: () => h.capa(1) }, { texto: tx.atras, icono: 'atras', fn: () => h.capa(-1) },
      { texto: tx.eliminar, icono: 'eliminar', aviso: true, fn: () => h.eliminar() }, { raya: true }
    ];
    this.abrirMenu(this.paginas.findIndex((p) => p.vista === h), e, h.hoja, antes);
  }

  ponerLibreAqui(p) {
    const e = p.vivo.editor, pos = p.vivo.posicionDeFila(p.fila, this.px, this.z);
    if (!e.isEditable) return;
    e.view.dispatch(e.state.tr.insert(pos, e.schema.nodes.paginaLibre.create({ nombre: this.tx.paginaLibre, objetos: [] })));
    const h = this.ultimaVista;
    this.medir();
    this.irAHoja(h);
    h.hoja.focus({ preventScroll: true });
  }

  /* Lo escrito en el panel y en un cuadro entra al capitulo antes de guardar o de bloquearlo */
  confirmarEdicion() {
    const a = document.activeElement;
    if (this.prop.caja.contains(a)) a.blur();
    this.vistas.forEach((h) => h.dejarDeEditar());
  }
  hayEdicion() { return this.prop.escribiendo() || [...this.vistas].some((h) => h.editando); }

  programar() { clearTimeout(this.reloj); this.reloj = setTimeout(() => this.medir(), PINTAR_MS); }

  contar() {
    const t = this.vivos.reduce((s, v) => s + ((v.editor.state.doc.textContent.match(/\S+/g) || []).length), 0);
    this.q('[data-s-palabras]').textContent = `${t.toLocaleString('es')} ${this.tx.palabras}`;
    this.alDesplazar();
  }

  /* ---- Moverse ---- */
  elementoDe(p) {
    if (p.indice) return this.lienzo.querySelectorAll('.hoja--indice')[p.fila];
    return p.vivo.caja;
  }

  irA(n) {
    const p = this.paginas[n - 1];
    if (!p) return;
    const r = this.elementoDe(p).getBoundingClientRect(), m = this.fondo.getBoundingClientRect();
    const extra = p.vivo ? p.fila * (this.px.H + this.px.gap) * this.z : 0;
    this.fondo.scrollTop += r.top - m.top - 20 + extra;
  }

  paginaActual() {
    const m = this.fondo.getBoundingClientRect(), centro = m.top + m.height / 2, paso = (this.px.H + this.px.gap) * this.z;
    let k = 0;
    for (const p of this.paginas) {
      k++;
      const r = this.elementoDe(p).getBoundingClientRect();
      const fondo = r.top + (p.vivo ? (p.fila + 1) * paso : r.height + this.px.gap * this.z);
      if (centro <= fondo) return k;
    }
    return this.paginas.length || 1;
  }

  alDesplazar() {
    this.q('[data-s-pagina]').textContent = this.tx.pagDe.replace('{n}', String(this.paginaActual())).replace('{total}', String(this.paginas.length));
    this.minis.marcar();
  }

  zoom(v) {
    this.z = tope(Math.round(v * 100) / 100, ZOOM_MIN, ZOOM_MAX);
    this.lienzo.style.transform = `scale(${this.z})`;
    this.q('[data-z-valor]').textContent = `${Math.round(this.z * 100)} %`;
    this.ajustarCaja();
    this.alDesplazar();
  }

  ajustarCaja() {
    if (!this.vivos.length) return;
    this.caja.style.height = `${this.lienzo.offsetHeight * this.z}px`;
    this.caja.style.width = `${this.px.W * this.z}px`;
  }

  /* ---- Lo que avisan los capitulos y las hojas ---- */
  alEstado(v, e) { this.alEstadoGlobal(v, e); }
  alEscribir(v) { this.programar(); this.alMoverCursor(v); }
  alMoverCursor(v) { if (this.activo === v && this.cinta) this.cinta.actualizar(); }
  entrarACinta() { if (this.cinta) this.cinta.entrar(); }
  alEnfocarEditor(v) { this.activo = v; this.soltarElegidos(); if (this.cinta) this.cinta.actualizar(); this.alActivo(v); }
  alEnfocarHoja(h) { this.hojaActiva = h; this.vistas.forEach((o) => { if (o !== h && o.elegido) o.elegir(''); }); this.activoDe(h); this.alElegir(h); this.alActivo(this.activo); }
  activoDe(h) { const v = this.vivos.find((x) => x.editor === h.editor); if (v) this.activo = v; }
  alElegir(h) { this.hojaActiva = h; this.vistas.forEach((o) => o.hoja.classList.toggle('hoja--activa', o === h)); this.prop.deHoja(h); }
  alMoverObjeto(h) { /* el panel se pone al dia al soltar */ if (!h) this.prop.ocultar(); }
  alCambiarHoja(h) { this.prop.deHoja(h); this.programar(); }
  registrar(h) { this.vistas.add(h); this.ultimaVista = h; }
  soltar(h) { this.vistas.delete(h); if (this.hojaActiva === h) { this.hojaActiva = null; this.prop.ocultar(); } }

  soltarElegidos() {
    /* Un campo del panel guarda al salir de el: si se suelta primero, ya no hay a quien guardarle */
    const a = document.activeElement;
    if (this.prop.caja.contains(a)) a.blur();
    if (this.hojaActiva) { this.hojaActiva.elegir(''); this.hojaActiva.hoja.classList.remove('hoja--activa'); this.hojaActiva = null; }
    this.imagenElegida = null;
    this.prop.ocultar();
  }
  soltarTodo() { this.soltarElegidos(); }

  /* El capitulo de este nodo solo se mira: telefono o conflicto */
  soloMirar(dom) {
    const v = this.vivos.find((x) => x.editor.view.dom.contains(dom));
    return !v || !v.editor.isEditable;
  }

  elegirBoton(v) {
    if (this.imagenElegida === v || this.soloMirar(v.dom)) return;
    this.soltarElegidos();
    this.imagenElegida = v;
    this.prop.deBoton(v);
  }

  elegirImagen(v) {
    if (this.imagenElegida === v || this.soloMirar(v.dom)) return;
    this.soltarElegidos();
    this.imagenElegida = v;
    this.prop.deImagen(v);
  }

  seSale(h) {
    const r = fueraDeMargen({ caja: h.attrs.caja, objetos: h.objetos }, this.margenes());
    return r.fondo || r.objetos.length > 0;
  }

  /* ---- Insertar ---- */
  /* Donde cae lo nuevo: despues de la hoja elegida, o al terminar el parrafo del cursor. Nunca lo parte. */
  puntoDeInsercion() {
    if (this.hojaActiva) { const v = this.vivoDe(this.hojaActiva); return { vivo: v, pos: this.hojaActiva.getPos() + 1 }; }
    const v = this.activo || this.vivos[this.vivos.length - 1], { $from } = v.editor.state.selection;
    return { vivo: v, pos: $from.depth ? $from.after(1) : v.editor.state.doc.content.size };
  }
  vivoDe(h) { return this.vivos.find((x) => x.editor === h.editor); }

  ponerLibre(attrs) {
    const { vivo, pos } = this.puntoDeInsercion(), e = vivo.editor;
    e.view.dispatch(e.state.tr.insert(pos, e.schema.nodes.paginaLibre.create(attrs)));
    const h = this.ultimaVista;
    this.medir();
    this.irAHoja(h);
    return h;
  }

  irAHoja(h) { const n = this.paginas.findIndex((p) => p.vista === h); if (n >= 0) this.irA(n + 1); }

  /* Las paginas de un PDF van una tras otra, aunque se siga escribiendo mientras llegan */
  ponerPaginaDePdf(attrs, anterior) {
    if (anterior && this.vistas.has(anterior)) {
      const e = anterior.editor, pos = anterior.getPos() + 1;
      e.view.dispatch(e.state.tr.insert(pos, e.schema.nodes.paginaLibre.create(attrs)));
      this.programar();
      return this.ultimaVista;
    }
    return this.ponerLibre(attrs);
  }

  hojaParaObjeto() { return this.hojaActiva || this.ponerLibre({ nombre: this.tx.paginaLibre, objetos: [] }); }

  insertar(que) {
    if (que === 'libre') { const h = this.ponerLibre({ nombre: this.tx.paginaLibre, objetos: [] }); h.hoja.focus({ preventScroll: true }); return; }
    if (que === 'cuadro') { this.hojaParaObjeto().agregar({ tipo: 'texto', texto: this.tx.escribeAqui, x: 20, y: 40, w: 60, h: 10, rot: 0, tam: '14pt', color: '', fuente: '', alinear: '' }); return; }
    if (que === 'zona') { this.hojaParaObjeto().agregar({ tipo: 'zona', nombre: this.tx.zonaNueva, x: 16, y: 50, w: 68, h: 22, rot: 0, bloques: [] }); return; }
    if (que === 'boton') { this.ponerBoton(); return; }
    if (que === 'capitulo') this.nuevoCapitulo();
  }

  /* En la pagina libre elegida, suelto; si no, en su propia linea del texto, y el panel se abre para llenarlo */
  ponerBoton() {
    const base = { texto: this.tx.botonNuevo, accion: 'enlace', enlace: '', copia: '', fondo: '', color: '' };
    if (this.hojaActiva) { this.hojaActiva.agregar({ tipo: 'boton', ...base, x: 30, y: 45, w: 40, h: 7, rot: 0, tam: '12pt' }); return; }
    const { vivo, pos } = this.puntoDeInsercion(), e = vivo.editor;
    e.view.dispatch(e.state.tr.insert(pos, e.schema.nodes.boton.create(base)));
    e.view.nodeDOM(pos).click();
    this.programar();
  }

  pedirImagen() { this.alImagen(); }

  /* Una imagen nueva: en la pagina libre elegida, o en el texto con su parrafo */
  ponerImagen(ruta, prop) {
    if (this.hojaActiva) {
      const W = 60, H = (W * (this.px.W / this.px.H)) / prop;
      this.hojaActiva.agregar({ tipo: 'imagen', ruta, x: 20, y: 22, w: W, h: H, rot: 0, crop: { l: 0, t: 0, r: 0, b: 0 }, alt: '', decorativa: false });
      return;
    }
    const v = this.activo || this.vivos[0];
    v.editor.chain().focus().insertContent({ type: 'imagen', attrs: { ruta, anchoPct: 40, modo: 'der' } }).run();
  }

  async nuevoCapitulo() {
    const r = await this.be.taller.crearCapitulo(this.obra().id, `${this.tx.capitulo} ${this.vivos.length + 1}`);
    if (r.error) { this.alFalla(r.error); return; }
    const v = new CapituloVivo(new Capitulo(r.fila), this);
    const i = this.activo ? this.vivos.indexOf(this.activo) + 1 : this.vivos.length;
    this.vivos.splice(i, 0, v);
    this.lienzo.insertBefore(v.caja, this.vivos[i + 1] ? this.vivos[i + 1].caja : null);
    this.ordenar();
    this.medir();
    this.irA(v.primera);
    v.editor.commands.focus('end');
  }

  async ordenar() {
    const r = await this.be.taller.ordenar(this.obra().id, this.vivos.map((v) => v.cap.id));
    if (r.error) this.alFalla(r.error);
  }

  /* ---- Borrar y mover ---- */
  async borrarPagina(h) {
    if (h.bloqueada) return;
    const e = h.editor, pos = h.getPos(), i = this.paginas.findIndex((p) => p.vista === h), tr = e.state.tr.delete(pos, pos + 1);
    /* El cursor queda junto a lo borrado: si no, la vista saltaria a donde estaba antes */
    e.view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(tr.mapping.map(pos)))));
    this.prop.ocultar();
    this.hojaActiva = null;
    this.medir();
    this.decir(this.tx.paginaBorrada);
    /* Si lo que sigue es otra hoja, el foco va ahi: en un libro de PDF el texto mas cercano puede estar muy lejos */
    const sigue = this.paginas[Math.min(i, this.paginas.length - 1)];
    if (sigue && sigue.vista) sigue.vista.hoja.focus({ preventScroll: true });
    else e.commands.focus();
  }

  duplicarPagina(h) {
    if (h.bloqueada) return;
    const e = h.editor, pos = h.getPos();
    e.view.dispatch(e.state.tr.insert(pos + 1, e.schema.nodes.paginaLibre.create(JSON.parse(JSON.stringify(h.attrs)))));
    this.medir();
  }

  /* Soltar la pagina antes de la pagina `n` (0 = al final). Entre capitulos son dos guardados: primero
     se escribe el destino y luego se borra el origen. Lo peor que puede pasar es un duplicado. Cada
     capitulo tiene su propio esquema: la pagina se rehace en el de destino, y si no entro no se borra. */
  async moverPagina(h, n) {
    if (this.moviendo) { this.decir(this.tx.moverEspera); return null; }
    this.moviendo = true;
    try { return await this.moverYa(h, n); } finally { this.moviendo = false; }
  }

  async moverYa(h, n) {
    const d = this.destinoDe(n, h);
    if (!d || h.bloqueada || !d.vivo.editor.isEditable) return null;
    const eo = h.editor, ed = d.vivo.editor, pos = h.getPos();
    let nodo = h.node;
    if (eo === ed) {
      const tr = eo.state.tr.delete(pos, pos + 1);
      eo.view.dispatch(tr.insert(tr.mapping.map(d.pos), nodo));
    } else {
      nodo = ed.schema.nodeFromJSON(nodo.toJSON());
      const tr = ed.state.tr.insert(d.pos, nodo);
      if (!tr.docChanged) { this.alFalla('noGuardado'); return null; }
      ed.view.dispatch(tr);
      const quedo = await d.vivo.guardado.vaciar(), ahora = h.getPos();
      if (!quedo) { this.alFalla('noGuardado'); this.medir(); return null; }
      if (typeof ahora === 'number') eo.view.dispatch(eo.state.tr.delete(ahora, ahora + 1));
    }
    this.medir();
    this.decir(this.tx.paginaMovida);
    return nodo;
  }

  destinoDe(n, h) {
    if (!n) { const v = this.vivos[this.vivos.length - 1]; return { vivo: v, pos: v.editor.state.doc.content.size }; }
    const p = this.paginas[n - 1];
    if (!p || p.vista === h) return null;
    if (p.indice) return { vivo: this.vivos[0], pos: 0 };
    if (p.vista) return { vivo: p.vivo, pos: p.vista.getPos() };
    return { vivo: p.vivo, pos: p.vivo.posicionDeFila(p.fila, this.px, this.z) };
  }

  /* Con el teclado: `n` es la primera pagina del capitulo delante del cual cae */
  moverCapituloPaso(v, d) {
    const i = this.vivos.indexOf(v), o = this.vivos[i + (d < 0 ? -1 : 2)];
    if (d < 0 && i === 0) return;
    if (d > 0 && i === this.vivos.length - 1) return;
    this.moverCapitulo(v, o ? o.primera : 0);
  }

  entrarEnPagina(n) {
    const p = this.paginas[n - 1];
    if (!p) return;
    if (p.vista) p.vista.hoja.focus({ preventScroll: true });
    else if (p.vivo) {
      const ed = p.vivo.editor, pos = p.vivo.posicionDeFila(p.fila, this.px, this.z);
      ed.view.dispatch(ed.state.tr.setSelection(Selection.near(ed.state.doc.resolve(pos))));
      ed.commands.focus();
    }
  }

  moverCapitulo(v, n) {
    const p = n ? this.paginas[n - 1] : null;
    const antes = p ? (p.vivo || this.vivos[0]) : null;
    if (antes === v) return;
    this.vivos = this.vivos.filter((x) => x !== v);
    const i = antes ? this.vivos.indexOf(antes) : this.vivos.length;
    this.vivos.splice(i, 0, v);
    this.lienzo.insertBefore(v.caja, antes ? antes.caja : null);
    this.ordenar();
    this.medir();
    this.decir(this.tx.capituloMovido);
  }

  /* Una imagen del texto pasa a su propia pagina libre, exacta */
  pasarALibre(v) {
    const a = v.node.attrs, e = this.vivos.find((x) => x.editor.view.dom.contains(v.dom)).editor, pos = v.getPos();
    const n = e.schema.nodes.paginaLibre.create({ nombre: this.tx.paginaLibre, objetos: [{
      id: `o-${crypto.getRandomValues(new Uint32Array(1))[0].toString(16).padStart(8, '0')}`, tipo: 'imagen', ruta: a.ruta, x: 18, y: 16, w: 64, h: 40, rot: 0,
      crop: { l: 0, t: 0, r: 0, b: 0 }, alt: a.alt, decorativa: a.decorativa
    }] });
    e.view.dispatch(e.state.tr.replaceWith(pos, pos + 1, n));
    this.imagenElegida = null;
    this.prop.ocultar();
    this.medir();
  }

  borrarImagen(v) {
    const e = this.vivos.find((x) => x.editor.view.dom.contains(v.dom)).editor, pos = v.getPos();
    e.view.dispatch(e.state.tr.delete(pos, pos + 1));
    this.imagenElegida = null;
    this.prop.ocultar();
  }

  /* ---- Formulas ---- */
  editarFormula(v) { if (!this.soloMirar(v.dom)) this.formulas.abrir(v.tex, v.dom, (tex) => v.updateAttributes({ tex })); }

  nuevaFormula() {
    const e = (this.activo || this.vivos[0]).editor;
    const sobre = e.view.dom;
    this.formulas.abrir('', sobre, (tex) => { if (tex) e.chain().focus().insertContent({ type: 'formula', attrs: { tex } }).run(); });
  }

  /* ---- Copias para la vista de libro y las miniaturas ---- */
  clon(p, esc) {
    const c = crear('span', 'clon libro');
    c.style.cssText = `width:${this.px.W * esc}px;height:${this.px.H * esc}px`;
    let d;
    if (p.indice) d = this.elementoDe(p).cloneNode(true);
    else if (p.vista) {
      /* Fuera de su capitulo la copia no hereda su papel: se lo lleva puesto */
      d = p.vista.hoja.cloneNode(true);
      const puesto = getComputedStyle(p.vista.hoja);
      for (const k of ['--hoja-papel', '--hoja-tinta', '--hoja-enlace']) d.style.setProperty(k, puesto.getPropertyValue(k));
    }
    else {
      d = p.vivo.caja.cloneNode(true);
      const f = d.querySelector('.flujo');
      if (f) f.removeAttribute('contenteditable');
    }
    d.querySelectorAll('.marco, .fantasma, .guia, .seg, .sale, .asa').forEach((n) => n.remove());
    const baja = p.vista || p.indice ? 0 : p.fila * (this.px.H + this.px.gap);
    d.classList.add('clon__dentro');
    d.style.transform = `scale(${esc}) translateY(${-baja}px)`;
    d.removeAttribute('tabindex');
    c.inert = true;
    c.append(d);
    return c;
  }
}
