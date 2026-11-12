/* UNA PAGINA LIBRE EN LA MESA: mover, agrandar, girar y recortar. Es el mismo trato que en Canva: se
   elige algo, salen sus puntos, y se arrastra.

   Vive dentro del editor como un bloque que ProseMirror no toca (`stopEvent`). Mientras se arrastra se
   trabaja sobre una copia; al soltar, una sola transaccion guarda el resultado: asi cada movimiento
   es un solo Ctrl+Z y el guardado automatico lo ve como cualquier cambio.

   Todo se mide en % de la hoja, y el zoom no importa: `getBoundingClientRect` ya viene escalado. */
import { closeHistory } from '@tiptap/pm/history';
import { fueraDeMargen } from '../../../../contenido/taller/tipos/paginaLibre.js';
import { limpiarObjetos, OBJETOS_MAX, TEXTO_CUADRO_MAX } from '../../../../contenido/taller/tipos/objetos.js';
import { botonIncompleto, claseDeIcono, estiloDeBoton, hijosDeBoton } from '../../../../contenido/taller/tipos/boton.js';
import { armar } from '../../../../contenido/taller/armar.js';
import { TINTA_SOBRE_PDF, variablesDe } from '../../../../contenido/taller/colores.js';

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const tope = (v, a, b) => Math.min(b, Math.max(a, v));
const CSS_ALINEAR = { izquierda: 'left', centro: 'center', derecha: 'right', justificado: 'justify' };
const MINIMO_PX = 16, UMBRAL_IMAN = .9, GIRO_IMAN = 3, LIMITE_RECORTE = .98;
const nuevoId = () => 'o-' + [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('');
const ASAS = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];

export class HojaLibre {
  constructor({ node, getPos, editor, mesa }) {
    Object.assign(this, { node, getPos, editor, mesa });
    this.objetos = limpiarObjetos(node.attrs.objetos);
    this.turnoFondo = 0;
    this.elegido = '';
    this.recortando = false;
    this.editando = null;
    this.dom = crear('div', 'pag-libre-ed');
    this.dom.contentEditable = 'false';
    this.hoja = crear('section', 'hoja');
    this.hoja.tabIndex = 0;
    this.hoja.setAttribute('aria-label', mesa.tx.paginaLibre);
    this.dom.append(this.hoja);
    this.hoja.addEventListener('pointerdown', (e) => this.alPresionar(e));
    this.hoja.addEventListener('dblclick', (e) => this.alDobleClic(e));
    this.hoja.addEventListener('contextmenu', (e) => this.alMenu(e));
    this.hoja.addEventListener('keydown', (e) => this.alTeclear(e));
    this.hoja.addEventListener('focus', () => mesa.alEnfocarHoja(this));
    this.pintar();
    mesa.registrar(this);
  }

  copiar(l) { return JSON.parse(JSON.stringify(l)); }
  get attrs() { return this.node.attrs; }
  /* En el telefono y durante un conflicto el capitulo solo se mira. `dispatch` no lo revisa: va aqui. */
  get bloqueada() { return !this.editor.isEditable; }
  objeto(id = this.elegido) { return this.objetos.find((o) => o.id === id) || null; }

  /* ---- Lo que ProseMirror pregunta ---- */
  stopEvent() { return true; }
  ignoreMutation() { return true; }
  update(n) {
    if (n.type.name !== 'paginaLibre') return false;
    this.node = n;
    if (!this.ocupado) {
      this.objetos = limpiarObjetos(n.attrs.objetos);
      if (!this.objeto()) this.elegido = '';
      this.pintar();
      if (this.mesa.hojaActiva === this) this.mesa.alElegir(this);
    }
    return true;
  }
  destroy() { this.mesa.soltar(this); }

  /* Una sola transaccion por cambio: un solo Ctrl+Z */
  guardar(extra = {}) {
    const pos = this.getPos();
    if (typeof pos !== 'number') return;
    if (this.bloqueada) { this.objetos = limpiarObjetos(this.attrs.objetos); this.pintar(); return; }
    this.dejarDeEditar();
    this.ocupado = true;
    const objetos = limpiarObjetos(this.objetos);
    /* closeHistory: aunque dos movimientos vayan seguidos, cada uno es su propio Ctrl+Z */
    this.editor.view.dispatch(closeHistory(this.editor.state.tr.setNodeMarkup(pos, null, { ...this.attrs, ...extra, objetos })));
    this.ocupado = false;
    this.objetos = this.copiar(objetos);
    this.pintar();
    this.mesa.alCambiarHoja(this);
  }

  /* No llego ni tras reintentar: se dice, y se puede pedir otra vez sin salir del libro */
  ponerFalla() {
    if (this.hoja.querySelector('.hoja__falla')) return;
    const b = crear('button', 'hoja__falla', this.mesa.tx.imagenNoLlego);
    b.type = 'button';
    b.addEventListener('click', () => this.mesa.reintentarImagenes());
    this.hoja.append(b);
    this.mesa.alImagenLista(this);
  }

  /* ---- Pintar ---- */
  pintar() {
    const { hoja, attrs } = this, turno = ++this.turnoFondo;
    hoja.replaceChildren();
    hoja.classList.remove('hoja--cargando');
    /* Una hoja sin color propio hereda el de su capitulo. El dibujo de un PDF va encima: lo que no cubre es papel. */
    const propio = attrs.fondo ? '' : attrs.papel, tonos = propio ? variablesDe(propio) : { '--hoja-papel': '', '--hoja-tinta': '', '--hoja-enlace': '' };
    for (const [k, v] of Object.entries(tonos)) hoja.style.setProperty(k, v);
    if (attrs.fondo) hoja.style.setProperty('--hoja-tinta', TINTA_SOBRE_PDF);
    if (attrs.fondo) {
      const f = crear('img', `fondo fondo--${attrs.ajuste}`);
      f.decoding = 'sync';
      f.alt = attrs.alt || attrs.texto.slice(0, 300) || this.mesa.tx.paginaPdf;
      f.draggable = false;
      hoja.classList.add('hoja--cargando');
      this.mesa.imagen(attrs.fondo).then((d) => {
        if (turno !== this.turnoFondo) return;
        hoja.classList.remove('hoja--cargando');
        if (d) { f.src = d; this.mesa.alImagenLista(this); } else this.ponerFalla();
      });
      hoja.append(f);
    }
    for (const o of this.objetos) hoja.append(this.pintarObjeto(o));
    const m = this.mesa.margenes();
    if (this.mesa.segura) {
      const s = crear('div', 'seg');
      Object.assign(s.style, { top: `${m.sup}%`, bottom: `${m.inf}%`, left: `${m.izq}%`, right: `${m.der}%` });
      s.append(crear('span', '', this.mesa.tx.zonaSegura));
      hoja.append(s);
      const r = fueraDeMargen({ caja: attrs.caja, objetos: this.objetos }, m);
      if (r.fondo || r.objetos.length) hoja.append(crear('span', 'sale', attrs.sangre && r.fondo ? this.mesa.tx.llegaAlBorde : this.mesa.tx.pasaMargen));
    }
    this.pintarMarco();
  }

  ponerCaja(e, o) {
    Object.assign(e.style, { left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, height: `${o.h}%`, transform: o.rot ? `rotate(${o.rot}deg)` : '' });
  }

  ponerImagen(o, img) {
    const c = o.crop, vw = 1 - c.l - c.r, vh = 1 - c.t - c.b;
    Object.assign(img.style, { width: `${100 / vw}%`, height: `${100 / vh}%`, left: `${(-c.l / vw) * 100}%`, top: `${(-c.t / vh) * 100}%` });
  }

  pintarObjeto(o) {
    const e = crear('div', `obj obj--${o.tipo}`);
    e.dataset.o = o.id;
    this.ponerCaja(e, o);
    if (o.tipo === 'imagen') {
      const img = crear('img');
      img.alt = o.decorativa ? '' : o.alt;
      img.draggable = false;
      this.mesa.imagen(o.ruta).then((d) => { if (d) { img.src = d; this.mesa.alImagenLista(this); } else if (e.isConnected) this.ponerFalla(); });
      this.ponerImagen(o, img);
      e.append(img);
    } else if (o.tipo === 'texto') {
      e.textContent = o.texto;
      Object.assign(e.style, { fontSize: o.tam, color: o.color, fontFamily: o.fuente ? `"${o.fuente}", Georgia, serif` : '', textAlign: CSS_ALINEAR[o.alinear] || '' });
    } else if (o.tipo === 'boton') {
      e.className += ` boton${claseDeIcono(o)}`;
      e.classList.toggle('boton--falta', botonIncompleto(o));
      e.replaceChildren(...hijosDeBoton(o).map((h) => armar(h)).filter(Boolean));
      e.style.fontSize = o.tam;
      for (const [k, v] of Object.entries(estiloDeBoton(o))) e.style.setProperty(k, v);
    } else e.textContent = o.nombre;
    if (this.mesa.segura && o.tipo !== 'zona' && fueraDeMargen({ caja: null, objetos: [o] }, this.mesa.margenes()).objetos.length) e.classList.add('fuera');
    return e;
  }

  refrescarObjeto(o) {
    const e = this.hoja.querySelector(`[data-o="${o.id}"]`);
    if (!e) return;
    this.ponerCaja(e, o);
    if (o.tipo === 'imagen') this.ponerImagen(o, e.querySelector('img'));
  }

  pintarMarco() {
    this.hoja.querySelectorAll('.marco, .fantasma').forEach((n) => n.remove());
    const o = this.objeto();
    if (!o) return;
    if (this.recortando) {
      const f = crear('img', 'fantasma'), c = o.crop, W = o.w / (1 - c.l - c.r), H = o.h / (1 - c.t - c.b);
      f.alt = '';
      this.mesa.imagen(o.ruta).then((d) => { if (d) f.src = d; });
      Object.assign(f.style, { width: `${W}%`, height: `${H}%`, left: `${o.x - c.l * W}%`, top: `${o.y - c.t * H}%` });
      this.hoja.append(f);
    }
    const m = crear('div', `marco${this.recortando ? ' marco--recorte' : ''}`);
    this.ponerCaja(m, o);
    for (const [sx, sy] of ASAS) {
      const a = crear('span', 'asa');
      a.dataset.sx = sx; a.dataset.sy = sy;
      a.style.left = `${(sx + 1) * 50}%`; a.style.top = `${(sy + 1) * 50}%`;
      m.append(a);
    }
    if (!this.recortando && o.tipo !== 'zona') {
      const g = crear('span', 'asa asa--giro');
      g.dataset.giro = '1';
      m.append(g);
    }
    this.hoja.append(m);
  }

  /* ---- Elegir ---- */
  elegir(id) {
    if (this.recortando) this.terminarRecorte();
    this.elegido = id;
    this.pintarMarco();
    this.mesa.alElegir(this);
    const o = this.objeto();
    if (o) this.mesa.decir({ imagen: this.mesa.tx.objImagen, texto: this.mesa.tx.objCuadro, zona: this.mesa.tx.objZona, boton: this.mesa.tx.objBoton }[o.tipo]);
  }

  /* ---- El puntero ---- */
  arrastrar(e, alMover, alSoltar) {
    e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY;
    let movio = false;
    const mover = (v) => {
      const dx = v.clientX - x0, dy = v.clientY - y0;
      if (!movio && Math.hypot(dx, dy) < 2) return;
      movio = true;
      alMover(dx, dy, v);
      this.refrescarObjeto(this.objeto());
      this.pintarMarco();
      this.mesa.alMoverObjeto(this);
    };
    const soltar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
      this.ponerGuias([]);
      if (alSoltar) alSoltar();
      if (movio) this.guardar();
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
  }

  ponerGuias(lista) {
    this.hoja.querySelectorAll('.guia').forEach((g) => g.remove());
    for (const [t, v] of lista) {
      const g = crear('div', `guia guia--${t}`);
      g.style[t === 'v' ? 'left' : 'top'] = `${v}%`;
      this.hoja.append(g);
    }
  }

  /* Al acercarse al centro, a un margen o a otro objeto, se pega y sale una guia */
  imantar(o) {
    const m = this.mesa.margenes();
    const puntos = { v: [50, m.izq, 100 - m.der], h: [50, m.sup, 100 - m.inf] };
    for (const x of this.objetos) { if (x === o) continue; puntos.v.push(x.x, x.x + x.w / 2, x.x + x.w); puntos.h.push(x.y, x.y + x.h / 2, x.y + x.h); }
    const lista = [];
    for (const [eje, pos, tam] of [['v', 'x', 'w'], ['h', 'y', 'h']]) {
      const mias = [o[pos], o[pos] + o[tam] / 2, o[pos] + o[tam]];
      let mejor = null;
      for (const p of puntos[eje]) for (const c of mias) { const d = p - c; if (Math.abs(d) < UMBRAL_IMAN && (!mejor || Math.abs(d) < Math.abs(mejor.d))) mejor = { d, p }; }
      if (mejor) { o[pos] += mejor.d; lista.push([eje, mejor.p]); }
    }
    this.ponerGuias(lista);
  }

  alPresionar(e) {
    if (e.button !== 0 || this.bloqueada || e.target.closest('.hoja__falla')) return;
    const asa = e.target.closest('.asa');
    if (asa) { this.empezarAsa(e, asa); return; }
    const oe = e.target.closest('.obj');
    if (oe && oe.isContentEditable) return;
    if (this.editando) this.dejarDeEditar();
    this.hoja.focus({ preventScroll: true });
    if (!oe) {
      if (this.recortando) { this.terminarRecorte(); return; }
      this.elegir('');
      return;
    }
    const o = this.objeto(oe.dataset.o);
    if (!o) return;
    if (this.recortando && this.elegido === o.id) { this.correrImagen(e, o); return; }
    if (this.elegido !== o.id) this.elegir(o.id);
    const r = this.hoja.getBoundingClientRect(), x = o.x, y = o.y;
    this.arrastrar(e, (dx, dy) => {
      o.x = x + (dx / r.width) * 100;
      o.y = y + (dy / r.height) * 100;
      this.imantar(o);
    });
  }

  empezarAsa(e, asa) {
    const o = this.objeto(), r = this.hoja.getBoundingClientRect();
    if (asa.dataset.giro) {
      const cx = r.left + ((o.x + o.w / 2) / 100) * r.width, cy = r.top + ((o.y + o.h / 2) / 100) * r.height;
      this.arrastrar(e, (dx, dy, v) => {
        let g = (Math.atan2(v.clientY - cy, v.clientX - cx) * 180) / Math.PI + 90;
        const resto = ((g % 90) + 90) % 90;
        if (resto < GIRO_IMAN || resto > 90 - GIRO_IMAN) g = Math.round(g / 90) * 90;
        o.rot = Math.round(((g + 360) % 360) * 10) / 10;
      });
      return;
    }
    const sx = Number(asa.dataset.sx), sy = Number(asa.dataset.sy);
    const k = { x: o.x, y: o.y, w: o.w, h: o.h, rot: o.rot || 0 };
    if (this.recortando) { this.empezarRecorte(e, sx, sy, o, r, k); return; }
    const ang = (k.rot * Math.PI) / 180, cos = Math.cos(ang), sin = Math.sin(ang);
    const prop = (k.w * r.width) / (k.h * r.height), esquina = sx !== 0 && sy !== 0;
    const w0 = (k.w / 100) * r.width, h0 = (k.h / 100) * r.height;
    this.arrastrar(e, (dx, dy, v) => {
      const lx = dx * cos + dy * sin, ly = -dx * sin + dy * cos;
      let nw = Math.max(MINIMO_PX, w0 + sx * lx), nh = Math.max(MINIMO_PX, h0 + sy * ly);
      if (esquina && o.tipo === 'imagen' && !v.shiftKey) { if (nw / prop > nh) nh = nw / prop; else nw = nh * prop; }
      if (!sx) nw = w0;
      if (!sy) nh = h0;
      const dw = nw - w0, dh = nh - h0;
      const cx = ((k.x + k.w / 2) / 100) * r.width + ((sx * dw) / 2) * cos - ((sy * dh) / 2) * sin;
      const cy = ((k.y + k.h / 2) / 100) * r.height + ((sx * dw) / 2) * sin + ((sy * dh) / 2) * cos;
      o.w = (nw / r.width) * 100; o.h = (nh / r.height) * 100;
      o.x = ((cx - nw / 2) / r.width) * 100; o.y = ((cy - nh / 2) / r.height) * 100;
    });
  }

  /* Clic derecho. Mientras se escribe en un cuadro, el menu sigue siendo el del navegador. */
  alMenu(e) {
    const oe = e.target.closest('.obj');
    if (oe && oe.isContentEditable) return;
    const o = oe ? this.objeto(oe.dataset.o) : (this.porTeclado ? this.objeto() : null);
    this.porTeclado = false;
    this.hoja.focus({ preventScroll: true });
    if (o && !this.bloqueada && this.elegido !== o.id) this.elegir(o.id);
    this.mesa.menuDeHoja(this, o, e);
  }

  /* ---- Recortar: la imagen se queda quieta y se mueve la ventana ---- */
  abrirRecorte() {
    const o = this.objeto();
    if (!o || o.tipo !== 'imagen') return;
    if (o.rot) { o.rot = 0; this.guardar(); }
    this.recortando = true;
    this.refrescarObjeto(this.objeto());
    this.pintarMarco();
    this.mesa.alElegir(this);
  }

  terminarRecorte() {
    this.recortando = false;
    this.pintarMarco();
    this.mesa.alElegir(this);
    this.mesa.alCambiarHoja(this);
  }

  /* Un lado del recorte con su numero: la imagen no se mueve, cambia la ventana */
  cambiarRecorte(lado, valor) {
    if (!this.objeto()) return;
    const o = this.objeto(), c = o.crop, W = o.w / (1 - c.l - c.r), H = o.h / (1 - c.t - c.b);
    const x0 = o.x - c.l * W, y0 = o.y - c.t * H, n = { ...c, [lado]: Math.max(0, valor) };
    if (n.l + n.r >= LIMITE_RECORTE || n.t + n.b >= LIMITE_RECORTE) { this.mesa.alElegir(this); return; }
    o.crop = n;
    o.x = x0 + n.l * W; o.y = y0 + n.t * H; o.w = W * (1 - n.l - n.r); o.h = H * (1 - n.t - n.b);
    this.guardar();
    this.mesa.alElegir(this);
  }

  quitarRecorte() {
    if (!this.objeto()) return;
    const o = this.objeto(), c = o.crop, W = o.w / (1 - c.l - c.r), H = o.h / (1 - c.t - c.b);
    o.x -= c.l * W; o.y -= c.t * H; o.w = W; o.h = H;
    o.crop = { l: 0, t: 0, r: 0, b: 0 };
    this.recortando = false;
    this.guardar();
    this.mesa.alElegir(this);
  }

  empezarRecorte(e, sx, sy, o, r, k) {
    const c0 = { ...o.crop }, W = k.w / (1 - c0.l - c0.r), H = k.h / (1 - c0.t - c0.b);
    this.arrastrar(e, (dx, dy) => {
      const px = (dx / r.width) * 100, py = (dy / r.height) * 100;
      if (sx < 0) { const d = tope(px, -c0.l * W, k.w - 5); o.x = k.x + d; o.w = k.w - d; o.crop.l = c0.l + d / W; }
      if (sx > 0) { const d = tope(-px, -c0.r * W, k.w - 5); o.w = k.w - d; o.crop.r = c0.r + d / W; }
      if (sy < 0) { const d = tope(py, -c0.t * H, k.h - 5); o.y = k.y + d; o.h = k.h - d; o.crop.t = c0.t + d / H; }
      if (sy > 0) { const d = tope(-py, -c0.b * H, k.h - 5); o.h = k.h - d; o.crop.b = c0.b + d / H; }
    });
  }

  /* Con el recorte abierto, arrastrar por dentro acomoda la imagen detras de la ventana */
  correrImagen(e, o) {
    const r = this.hoja.getBoundingClientRect(), c0 = { ...o.crop }, W = o.w / (1 - c0.l - c0.r), H = o.h / (1 - c0.t - c0.b);
    this.arrastrar(e, (dx, dy) => {
      const dl = tope(-((dx / r.width) * 100) / W, -c0.l, c0.r), dt = tope(-((dy / r.height) * 100) / H, -c0.t, c0.b);
      o.crop.l = c0.l + dl; o.crop.r = c0.r - dl; o.crop.t = c0.t + dt; o.crop.b = c0.b - dt;
    });
  }

  /* ---- Cuadros de texto ---- */
  alDobleClic(e) {
    const oe = e.target.closest('.obj');
    if (!oe || this.bloqueada) return;
    const o = this.objeto(oe.dataset.o);
    if (!o) return;
    if (o.tipo === 'imagen') { this.elegir(o.id); this.abrirRecorte(); }
    if (o.tipo === 'texto') this.escribir(oe, o);
  }

  escribir(oe, o) {
    this.elegido = '';
    this.pintarMarco();
    this.editando = { oe, o };
    oe.contentEditable = 'plaintext-only';
    oe.setAttribute('role', 'textbox');
    oe.setAttribute('aria-multiline', 'true');
    oe.setAttribute('aria-label', this.mesa.tx.objCuadro);
    oe.addEventListener('blur', () => this.dejarDeEditar(), { once: true });
    oe.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.hoja.focus({ preventScroll: true }); }
      /* Por defecto el navegador seleccionaria el capitulo entero, y la tecla siguiente lo reemplazaria */
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); e.stopPropagation(); getSelection().selectAllChildren(oe); }
    });
    oe.focus();
    this.mesa.alElegir(this);
  }

  dejarDeEditar() {
    if (!this.editando) return;
    const { oe, o } = this.editando;
    this.editando = null;
    o.texto = oe.innerText.replace(/\n$/, '');
    if (o.texto.length > TEXTO_CUADRO_MAX) this.mesa.alFalla('cuadroLargo');
    oe.contentEditable = 'false';
    this.guardar();
  }

  /* ---- Acciones ---- */
  agregar(o) {
    if (this.bloqueada) return;
    this.dejarDeEditar();
    if (this.objetos.length >= OBJETOS_MAX) { this.mesa.alFalla('objetosMax'); return; }
    const n = { ...o, id: nuevoId() };
    this.objetos.push(n);
    this.guardar();
    this.elegir(n.id);
    this.hoja.focus({ preventScroll: true });
  }

  cambiar(cambios) { const o = this.objeto(); if (!o) return; Object.assign(o, cambios); this.guardar(); }
  cambiarHoja(extra) { this.guardar(extra); }

  duplicar() {
    const o = this.objeto();
    if (o) this.agregar({ ...this.copiar(o), x: o.x + 3, y: o.y + 3 });
  }

  eliminar() {
    if (!this.objeto()) return;
    this.objetos = this.objetos.filter((x) => x.id !== this.elegido);
    this.elegido = '';
    this.recortando = false;
    this.guardar();
    this.mesa.alElegir(this);
    this.hoja.focus({ preventScroll: true });
  }

  capa(d) {
    if (!this.objeto()) return;
    const o = this.objeto(), i = this.objetos.indexOf(o), j = tope(i + d, 0, this.objetos.length - 1);
    if (i === j) return;
    this.objetos.splice(i, 1);
    this.objetos.splice(j, 0, o);
    this.guardar();
  }

  /* El teclado: flechas 1 mm, Mayus 5 mm, Alt cambia el tamaño, Tab pasa al siguiente objeto */
  alTeclear(e) {
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) this.porTeclado = true;
    if (e.target !== this.hoja || this.bloqueada) return;
    const ctrl = e.ctrlKey || e.metaKey, tecla = e.key.toLowerCase();
    if (ctrl && (tecla === 'z' || tecla === 'y')) {
      e.preventDefault();
      if (tecla === 'y' || e.shiftKey) this.editor.commands.redo(); else this.editor.commands.undo();
      return;
    }
    if (ctrl && tecla === 'a') { e.preventDefault(); return; }
    if (ctrl && tecla === 'd') { e.preventDefault(); this.duplicar(); return; }
    if (e.altKey && e.key === 'F10') { e.preventDefault(); this.mesa.cinta.entrar(); return; }
    if (e.key === 'Escape') { e.preventDefault(); if (this.recortando) this.terminarRecorte(); else this.elegir(''); return; }
    if (e.key === 'Tab' && this.objetos.length && (this.elegido || !e.shiftKey)) {
      const i = this.objetos.findIndex((o) => o.id === this.elegido) + (e.shiftKey ? -1 : 1);
      if (i >= 0 && i < this.objetos.length) { e.preventDefault(); this.elegir(this.objetos[i].id); return; }
      this.elegir('');
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (e.repeat) return;
      if (this.elegido) this.eliminar(); else if (e.key === 'Delete') this.mesa.borrarPagina(this);
      return;
    }
    const o = this.objeto();
    if (!o) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (o.tipo === 'imagen') { if (this.recortando) this.terminarRecorte(); else this.abrirRecorte(); }
      if (o.tipo === 'texto') this.escribir(this.hoja.querySelector(`[data-o="${o.id}"]`), o);
      return;
    }
    const paso = e.shiftKey ? 5 : 1, p = this.mesa.config();
    const f = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!f) return;
    e.preventDefault();
    if (this.recortando) return;
    const dx = (f[0] * paso * 100) / p.anchoMm, dy = (f[1] * paso * 100) / p.altoMm;
    if (e.altKey) { o.w = Math.max(1, o.w + dx); o.h = Math.max(1, o.h + dy); } else { o.x += dx; o.y += dy; }
    this.guardar();
    this.mesa.alElegir(this);
  }
}
