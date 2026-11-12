/* LA MESA: las hojas del libro en una tira, con las miniaturas a la izquierda y el panel que aparece al
   elegir algo. Reune los capitulos vivos y todo lo que no es de uno solo: el orden de las paginas, el
   zoom, la zona segura y mover paginas de un lado a otro.

   EL ZOOM ES UNA ESCALA, no `zoom` de CSS: la prueba de la Etapa 1 mostro que el otro mueve los cortes
   de pagina. Con la escala, lo que se ve en cualquier zoom es lo que sale en el PDF. */
import { Selection } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import { META_PAGINA, alternar, antesDelNumero, destinoDelBloque, libresDe, lugaresDe, nodosEnLugares, posicionesDe, rango, resumenDe, todasDelCapitulo, trBorrar, trDuplicar, trMover, trPapel } from './Varias.js';
import { Capitulo } from '../../../../contenido/taller/Obra.js';
import { ConfigPagina } from '../../../../contenido/taller/ConfigPagina.js';
import { cssLibro } from '../../../../contenido/taller/hoja.js';
import { variablesDe } from '../../../../contenido/taller/colores.js';
import { fueraDeMargen } from '../../../../contenido/taller/tipos/paginaLibre.js';
import { CapituloVivo } from './CapituloVivo.js';
import { cortar, unir, tieneTitulo } from './Partir.js';
import { limpiarContenido, cabeEnElCapitulo, tituloLimpio } from '../../../../contenido/taller/TextoLibro.js';
import { tituloDe } from '../../../../contenido/taller/Migrar.js';
import { Miniaturas } from './Miniaturas.js';
import { Propiedades } from './Propiedades.js';
import { MenuPagina } from './MenuPagina.js';

/* Donde empieza el bloque de arriba numero `i` */
const posicionDeBloque = (doc, i) => { let pos = 0; for (let k = 0; k < i; k++) pos += doc.child(k).nodeSize; return pos; };

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const tope = (v, a, b) => Math.min(b, Math.max(a, v));
const PINTAR_MS = 400;
const ZOOM_MIN = .25, ZOOM_MAX = 3;
const SIN_ELEGIR = Object.freeze({ vivo: null, nodos: [], ancla: null });

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
    this.eleccion = SIN_ELEGIR;               // las paginas elegidas en las miniaturas: { vivo, nodos, ancla }
    const q = (s) => raiz.querySelector(s);
    this.q = q;
    this.fondo = q('[data-tal-fondo]');
    this.caja = q('[data-tal-lienzo-caja]');
    this.lienzo = q('[data-tal-lienzo]');
    this.estilo = raiz.querySelector('style') || raiz.appendChild(crear('style'));
    this.prop = new Propiedades(q('[data-tal-panel]'), { tx: this.tx, mesa: this });
    this.minis = new Miniaturas(q('[data-tal-miniaturas]'), this);
    this.menu = new MenuPagina(raiz, { tx: this.tx, decir: (t) => this.decir(t) });
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
  imagen(ruta) { return this.imagenes.vista(ruta); }
  alImagenLista(h) { this.minis.refrescar(h); if (this.vistaLibro) this.vistaLibro.refrescar(); }
  alImagenDeTexto(dom) {
    const v = this.vivos.find((x) => x.editor.view.dom.contains(dom));
    if (v) this.minis.refrescarTexto(v);
    if (this.vistaLibro) this.vistaLibro.refrescar();
  }
  reintentarImagenes() { this.vistas.forEach((h) => { if (h.hoja.querySelector('.hoja__falla')) h.pintar(); }); }

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
    this.activo = null; this.hojaActiva = null; this.imagenElegida = null;
    this.eleccion = SIN_ELEGIR;
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
    const titulos = this.entradasDeIndice().map((f) => f.titulo);
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
    this.podarEleccion();
    this.minis.pintar();
    this.pintarEleccion();
    this.contar();
  }

  /* Deshacer y rehacer van al capitulo de lo ultimo tocado: la hoja elegida, o el capitulo activo */
  historia(cmd) {
    const h = this.hojaActiva, e = h ? h.editor : (this.activo && this.activo.editor);
    if (!e) return;
    /* Deshacer un cambio de papel rehace los nodos: las elegidas se vuelven a buscar por su lugar */
    const { vivo, nodos, ancla } = this.eleccion, mia = vivo && vivo.editor === e && nodos.length;
    const lugares = mia ? lugaresDe(e.state.doc, nodos) : null, cuantas = mia ? libresDe(e.state.doc).length : 0;
    e.commands[cmd]();
    if (!mia || posicionesDe(e.state.doc, nodos).length === nodos.length) return;
    const otra = nodosEnLugares(e.state.doc, lugares, cuantas);
    if (!otra || !otra.length) return;
    this.eleccion = { vivo, nodos: otra, ancla: nodos.includes(ancla) ? otra[nodos.indexOf(ancla)] || otra[0] : otra[0] };
    this.panelDeEleccion();
    this.pintarEleccion();
  }

  /* ---- Varias paginas elegidas ---- */
  /* Despues de escribir, guardar o deshacer, se queda lo que sigue en su capitulo */
  podarEleccion() {
    const { vivo, nodos, ancla } = this.eleccion;
    if (!nodos.length && !ancla) return;
    const hay = new Set(this.paginas.filter((p) => p.vivo === vivo && p.vista).map((p) => p.vista.node));
    const quedan = nodos.filter((n) => hay.has(n));
    if (quedan.length === nodos.length && (!ancla || hay.has(ancla))) return;
    this.eleccion = quedan.length || hay.has(ancla) ? { vivo, nodos: quedan, ancla: hay.has(ancla) ? ancla : quedan[0] } : SIN_ELEGIR;
    this.panelDeEleccion();
  }

  cuantasElegidas() { return this.eleccion.nodos.length; }
  /* Las paginas como las ve Varias.js: su capitulo y su nodo (null si no es libre) */
  listaDePaginas() { return this.paginas.map((q) => ({ vivo: q.vivo, nodo: q.vista ? q.vista.node : null })); }
  primeraElegida() { return this.paginas.findIndex((p) => this.estaElegida(p)); }

  /* La marca en las miniaturas y en la mesa: un borde que no mueve nada */
  pintarEleccion() {
    this.minis.marcarEleccion();
    const elegidas = new Set(this.eleccion.nodos);
    this.vistas.forEach((h) => h.hoja.classList.toggle('hoja--elegida', elegidas.size > 1 && elegidas.has(h.node)));
  }
  estaElegida(p) { return !!p.vista && p.vivo === this.eleccion.vivo && this.eleccion.nodos.includes(p.vista.node); }

  /* `modo`: 'uno' (clic), 'rango' (Mayus+clic) o 'alternar' (Ctrl+clic). Solo paginas libres de un capitulo. */
  elegirMini(i, modo) {
    const tx = this.tx, p = this.paginas[i], e = this.eleccion;
    if (!p) return;
    const nodo = p.vista ? p.vista.node : null;
    let nueva = null, aviso = '';
    if (modo === 'alternar') {
      if (!nodo) { this.decir(tx.soloLibres); return; }
      if (e.nodos.length && e.vivo !== p.vivo) { this.decir(tx.soloUnCapitulo); return; }
      nueva = { vivo: p.vivo, nodos: alternar(e.nodos, nodo), ancla: nodo };
    } else if (modo === 'rango' && e.ancla) {
      const lista = this.paginas.map((q) => ({ vivo: q.vivo, nodo: q.vista ? q.vista.node : null }));
      const a = lista.findIndex((q) => q.nodo === e.ancla);
      if (a >= 0) {
        const r = rango(lista, a, i);
        if (r.fuera) aviso = tx.soloUnCapitulo;
        nueva = { vivo: lista[a].vivo, nodos: r.nodos, ancla: e.ancla };
      }
    } else if (modo === 'todas') {
      if (!p.vivo) return;
      nueva = { vivo: p.vivo, nodos: todasDelCapitulo(this.paginas.map((q) => ({ vivo: q.vivo, nodo: q.vista ? q.vista.node : null })), p.vivo), ancla: nodo };
    }
    if (!nueva) {
      nueva = nodo ? { vivo: p.vivo, nodos: [nodo], ancla: nodo } : SIN_ELEGIR;
      /* El panel no puede hablar de una pagina mientras la elegida es otra */
      if (this.hojaActiva || this.imagenElegida) this.soltarElegidos();
    }
    this.eleccion = nueva;
    this.panelDeEleccion();
    this.pintarEleccion();
    if (modo !== 'uno') this.decirEleccion(aviso);
  }

  /* La cuenta, y si hace falta por que no entraron todas: en un solo aviso, para que uno no tape al otro */
  decirEleccion(aviso = '') {
    const n = this.cuantasElegidas(), tx = this.tx;
    const cuenta = n === 0 ? tx.eleccionVacia : n === 1 ? tx.elegidaUna : `${tx.elegidas.replace('{n}', String(n))}.`;
    this.decir(aviso ? `${cuenta} ${aviso}` : cuenta);
  }

  /* Con dos o mas, el panel habla de ellas; con una sola, la mesa sigue como siempre */
  panelDeEleccion() {
    const n = this.cuantasElegidas();
    if (n > 1) {
      if (this.hojaActiva || this.imagenElegida) this.soltarElegidos();
      this.prop.deVarias(resumenDe(this.eleccion.nodos));
    } else if (this.prop.dueno === 'varias') this.prop.ocultar();
  }

  soltarEleccion(avisar = false) {
    if (!this.eleccion.nodos.length && !this.eleccion.ancla) return;
    this.eleccion = SIN_ELEGIR;
    this.panelDeEleccion();
    this.pintarEleccion();
    if (avisar) this.decirEleccion();
  }

  /* Lo elegido que sigue en su capitulo, si se puede tocar. Si no, se dice por que no. */
  eleccionParaCambiar() {
    const { vivo, nodos } = this.eleccion;
    if (!vivo || !nodos.length) return null;
    if (!vivo.editor.isEditable) { this.decir(this.tx.variasQuietas); return null; }
    /* Una pagina que va a otro capitulo espera su guardado: mientras, nada cambia de lugar */
    if (this.moviendo) { this.decir(this.tx.moverEspera); return null; }
    this.confirmarEdicion();
    const vivos = posicionesDe(vivo.editor.state.doc, nodos).map((x) => x.nodo);
    return vivos.length ? { vivo, nodos: vivos } : null;
  }

  /* Todas en una sola transaccion: un Ctrl+Z (o el boton Deshacer) las devuelve en su orden */
  borrarVarias() {
    const el = this.eleccionParaCambiar();
    if (!el) return;
    const e = el.vivo.editor, n = el.nodos.length;
    e.view.dispatch(trBorrar(e.state, el.nodos));
    this.activo = el.vivo;
    this.hojaActiva = null;
    this.eleccion = SIN_ELEGIR;
    this.prop.ocultar();
    this.medir();
    this.decir(n > 1 ? this.tx.variasBorradas.replace('{n}', String(n)) : this.tx.paginaBorrada);
  }

  /* «Que la primera del bloque quede en la pagina `d`», como «Mover a…» de una sola */
  moverVarias(d) {
    const el = this.eleccionParaCambiar();
    if (el) this.moverBloque(el, antesDelNumero(this.listaDePaginas(), el.nodos, d));
  }

  /* Una pagina arriba o abajo, todo el bloque. Si estaban sueltas, primero se juntan. */
  moverVariasPaso(dir) {
    const i = this.primeraElegida();
    if (i >= 0) this.moverVarias(i + 1 + dir);
  }

  /* Soltar el bloque antes de la pagina `n` (0 = al final), como al arrastrar una sola */
  soltarVariasAntes(n) {
    const el = this.eleccionParaCambiar();
    if (el) this.moverBloque(el, n ? n - 1 : this.paginas.length);
  }

  moverBloque(el, i) {
    const tx = this.tx, d = destinoDelBloque(this.listaDePaginas(), el.nodos, i);
    if (!d) { this.decir(tx.bloqueSoloCapitulo); return; }
    const e = el.vivo.editor, lugar = (q) => (q.vista ? q.vista.getPos() : q.vivo.posicionDeFila(q.fila, this.px, this.z));
    let fila = d.antes, tr = trMover(e.state, el.nodos, d.fin ? e.state.doc.content.size : lugar(this.paginas[fila]));
    /* Una pagina de texto se parte en el parrafo, nunca en medio: si su lugar da el mismo libro, el parrafo
       empieza mas arriba, y se busca su primer renglon */
    while (tr && !d.fin && tr.doc.eq(e.state.doc)) {
      const q = this.paginas[fila - 1];
      if (!q || q.vista || q.vivo !== el.vivo) break;
      fila--;
      tr = trMover(e.state, el.nodos, lugar(q));
    }
    if (!tr || tr.doc.eq(e.state.doc)) { this.decir(tx.bloqueYaAhi); return; }
    e.view.dispatch(tr);
    this.activo = el.vivo;
    this.hojaActiva = null;
    this.medir();
    /* El texto puede correrse: se dice donde quedo de verdad */
    const k = this.primeraElegida();
    if (k < 0) return;
    this.irA(k + 1);
    /* El foco sigue al bloque solo si estaba en las miniaturas: desde el panel, se queda en su boton */
    if (this.minis.caja.contains(document.activeElement)) this.minis.enfocar(k + 1);
    this.decir(tx.bloqueQuedo.replace('{n}', String(el.nodos.length)).replace('{p}', String(k + 1)));
  }

  /* El papel de todas (o como cubre su fondo cada pagina de PDF). Las paginas cambian de nodo: la eleccion se
     queda con las nuevas. */
  papelVarias(cambio) {
    const el = this.eleccionParaCambiar();
    if (!el) return;
    const e = el.vivo.editor, r = trPapel(e.state, el.nodos, cambio);
    e.view.dispatch(r.tr);
    this.eleccion = { vivo: el.vivo, nodos: r.nodos, ancla: r.nodos[0] };
    this.activo = el.vivo;
    this.medir();
    this.panelDeEleccion();
    if (r.saltadas && 'papel' in cambio) this.decir(r.saltadas === 1 ? this.tx.pdfNoCambiaUna : this.tx.pdfNoCambian.replace('{n}', String(r.saltadas)));
  }

  /* Las copias quedan elegidas: asi se pueden mover o borrar enseguida */
  duplicarVarias() {
    const el = this.eleccionParaCambiar();
    if (!el) return;
    const e = el.vivo.editor, r = trDuplicar(e.state, el.nodos);
    e.view.dispatch(r.tr);
    this.activo = el.vivo;
    this.hojaActiva = null;
    this.eleccion = { vivo: el.vivo, nodos: r.copias, ancla: r.copias[0] };
    this.medir();
    this.panelDeEleccion();
    this.decir(r.copias.length > 1 ? this.tx.variasDuplicadas.replace('{n}', String(r.copias.length)) : this.tx.paginaDuplicada);
  }

  /* Lo que va en el contenido: los capitulos con nombre que no se ocultaron (una portada, por ejemplo). El numero
     de capitulo sigue siendo su lugar en el libro: asi lo nombra la hoja de impresion (#cap-N). */
  entradasDeIndice() { return this.vivos.map((v, i) => ({ titulo: v.cap.titulo, pagina: v.primera, capitulo: i + 1, ver: v.enIndice })).filter((f) => f.titulo && f.ver).map(({ ver, ...f }) => f); }

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
    /* Con varias paginas elegidas, ir a la hoja las soltaria: de las miniaturas se pasa directo al panel */
    ].filter(([n]) => !n.hidden && !(n === this.fondo && this.cuantasElegidas() > 1));
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
      return [ir, { texto: tx.libreAqui, icono: 'hoja', fn: () => this.ponerLibreAqui(p), apagado: !p.vivo.editor.isEditable }, ...this.accionesDeCapitulo(i), { raya: true },
        { texto: tx.moverA, icono: 'mover', apagado: true, ayuda: tx.paginaDeTexto }, { texto: tx.eliminarPagina, icono: 'eliminar', apagado: true, ayuda: tx.paginaDeTexto }];
    }
    const h = p.vista, quieta = h.bloqueada, k = this.cuantasElegidas();
    if (k > 1 && this.estaElegida(p)) {
      const cuenta = (t) => t.replace('{n}', String(k));
      return [ir,
        { texto: cuenta(tx.duplicarVarias), icono: 'duplicar', apagado: quieta, fn: () => this.duplicarVarias() },
        /* «Al inicio» y «Al final» son los de su capitulo: el bloque no sale de el */
        { texto: cuenta(tx.moverVarias), icono: 'mover', apagado: quieta, queda: true, fn: () => this.menu.mover({
          actual: this.primeraElegida() + 1, total: this.paginas.length, etiqueta: cuenta(tx.moverVariasA), alMover: (d) => this.moverVarias(d),
          primera: p.vivo.primera, ultima: this.paginas.findLastIndex((q) => q.vivo === p.vivo) + 2 - k
        }) },
        { raya: true },
        /* Solo si siguen siendo las que dice el boton */
        { texto: cuenta(tx.eliminarVarias), icono: 'eliminar', aviso: true, apagado: quieta, confirmar: cuenta(tx.eliminarVariasSeguro), fn: () => { if (this.cuantasElegidas() === k) this.borrarVarias(); } }];
    }
    return [ir,
      { texto: tx.duplicarPagina, icono: 'duplicar', apagado: quieta, fn: () => { this.activoDe(h); this.duplicarPagina(h); this.decir(tx.paginaDuplicada); } },
      { texto: tx.moverA, icono: 'mover', apagado: quieta, queda: true, fn: () => this.menu.mover({ actual: n, total: this.paginas.length, primera: this.primeraDeTexto(), alMover: (d) => this.moverHasta(h, d) }) },
      ...this.accionesDeCapitulo(i),
      { raya: true },
      { texto: tx.eliminarPagina, icono: 'eliminar', aviso: true, apagado: quieta, confirmar: tx.eliminarPaginaSeguro, fn: () => { this.activoDe(h); this.borrarPagina(h); } }];
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
    const h = this.meterPagina(e, pos, { nombre: this.tx.paginaLibre, objetos: [] });
    this.medir();
    this.irAHoja(h);
    h.hoja.focus({ preventScroll: true });
  }

  /* Lo escrito en el panel y en un cuadro entra al capitulo antes de guardar o de bloquearlo */
  confirmarEdicion() {
    /* Solo un campo guarda al salir de el; un boton del panel conserva el foco, para pulsarlo otra vez */
    const a = document.activeElement;
    if (this.prop.caja.contains(a) && a.matches('input, textarea, select, [contenteditable]')) a.blur();
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
  alMoverCursor(v) {
    if (this.activo !== v) return;
    if (this.cinta) this.cinta.actualizar();
    this.panelDeCapital(v);
  }

  /* En un parrafo con capital, el panel muestra como se ven las capitales del libro (lo mismo que su flechita
     en la cinta). Solo si no hay otra cosa elegida: una hoja, una imagen o varias paginas mandan. */
  panelDeCapital(v) {
    const e = v && v.editor, enCapital = !!e && e.isEditable && !e.isActive('heading') && !!e.getAttributes('paragraph').capital;
    if (enCapital && this.capitalDelLibro && !this.hojaActiva && !this.imagenElegida && this.cuantasElegidas() < 2) this.prop.deCapital(this.capitalDelLibro());
    else if (this.prop.dueno === 'capital') this.prop.ocultar();
  }
  refrescarCapital() { if (this.prop.dueno === 'capital' && this.capitalDelLibro) this.prop.deCapital(this.capitalDelLibro()); }
  quitarCapital() {
    const v = this.activo;
    if (v && v.editor.isEditable) v.editor.chain().focus().updateAttributes('paragraph', { capital: false }).run();
  }
  entrarACinta() { if (this.cinta) this.cinta.entrar(); }
  /* Al volver al texto se suelta lo elegido, y si el cursor sigue en una capital su panel vuelve en el mismo
     momento: sin parpadeo, y aunque el cursor no se haya movido */
  alEnfocarEditor(v) { this.activo = v; this.soltarEleccion(); this.soltarElegidos(); this.panelDeCapital(v); if (this.cinta) this.cinta.actualizar(); this.alActivo(v); }
  alEnfocarHoja(h) { this.soltarEleccion(); this.hojaActiva = h; this.vistas.forEach((o) => { if (o !== h && o.elegido) o.elegir(''); }); this.activoDe(h); this.alElegir(h); this.alActivo(this.activo); }
  activoDe(h) { const v = this.vivos.find((x) => x.editor === h.editor); if (v) this.activo = v; }
  alElegir(h) { this.hojaActiva = h; this.vistas.forEach((o) => o.hoja.classList.toggle('hoja--activa', o === h)); this.prop.deHoja(h); }
  alMoverObjeto(h) { /* el panel se pone al dia al soltar */ if (!h) this.prop.ocultar(); }
  alCambiarHoja(h) { this.prop.deHoja(h); this.programar(); }
  registrar(h) { this.vistas.add(h); }
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

  elegirPasaje(v) {
    if (this.imagenElegida === v || this.soloMirar(v.dom)) return;
    this.soltarElegidos();
    this.imagenElegida = v;
    this.prop.dePasaje(v);
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
    if (this.hojaActiva && this.aLaVista(this.hojaActiva.hoja.getBoundingClientRect())) { const v = this.vivoDe(this.hojaActiva); return { vivo: v, pos: this.hojaActiva.getPos() + 1 }; }
    const v = this.activo || this.vivos[this.vivos.length - 1], { $from } = v.editor.state.selection;
    if (this.cursorALaVista(v)) return { vivo: v, pos: $from.depth ? $from.after(1) : v.editor.state.doc.content.size };
    return this.despuesDePagina(this.paginaActual());
  }

  /* El cursor puede haber quedado muy lejos de lo que se esta mirando: entonces no manda el */
  cursorALaVista(v) {
    return this.aLaVista(v.editor.view.coordsAtPos(v.editor.state.selection.from));
  }

  aLaVista(r) { const m = this.fondo.getBoundingClientRect(); return r.bottom > m.top && r.top < m.bottom; }

  despuesDePagina(n) {
    const p = this.paginas[n - 1], sig = this.paginas[n];
    if (!p || p.indice) return { vivo: this.vivos[0], pos: 0 };
    if (p.vista) return { vivo: p.vivo, pos: p.vista.getPos() + 1 };
    if (!sig || sig.vivo !== p.vivo) return { vivo: p.vivo, pos: p.vivo.editor.state.doc.content.size };
    return { vivo: p.vivo, pos: sig.vista ? sig.vista.getPos() : p.vivo.posicionDeFila(sig.fila, this.px, this.z) };
  }

  /* La vista de lo que se acaba de poner. Por posicion: ProseMirror puede reutilizar la de la pagina vecina, y
     la ultima creada seria otra hoja. */
  vistaEn(e, pos) { return [...this.vistas].find((h) => h.editor === e && h.getPos() === pos) || null; }

  meterPagina(e, pos, attrs) {
    e.view.dispatch(closeHistory(e.state.tr.insert(pos, e.schema.nodes.paginaLibre.create(attrs))));
    return this.vistaEn(e, pos);
  }
  vivoDe(h) { return this.vivos.find((x) => x.editor === h.editor); }

  ponerLibre(attrs) {
    const { vivo, pos } = this.puntoDeInsercion(), h = this.meterPagina(vivo.editor, pos, attrs);
    this.medir();
    this.irAHoja(h);
    return h;
  }

  irAHoja(h) { const n = this.paginas.findIndex((p) => p.vista === h); if (n >= 0) this.irA(n + 1); }

  /* Las paginas de un PDF van una tras otra, aunque se siga escribiendo mientras llegan */
  ponerPaginaDePdf(attrs, anterior) {
    if (anterior && this.vistas.has(anterior)) {
      const h = this.meterPagina(anterior.editor, anterior.getPos() + 1, attrs);
      this.programar();
      return h;
    }
    return this.ponerLibre(attrs);
  }

  hojaParaObjeto() { return this.hojaActiva || this.ponerLibre({ nombre: this.tx.paginaLibre, objetos: [] }); }

  insertar(que) {
    if (que === 'libre') { const h = this.ponerLibre({ nombre: this.tx.paginaLibre, objetos: [] }); h.hoja.focus({ preventScroll: true }); return; }
    if (que === 'cuadro') { this.hojaParaObjeto().agregar({ tipo: 'texto', texto: this.tx.escribeAqui, x: 20, y: 40, w: 60, h: 10, rot: 0, tam: '14pt', color: '', fuente: '', alinear: '' }); return; }
    if (que === 'zona') { this.hojaParaObjeto().agregar({ tipo: 'zona', nombre: this.tx.zonaNueva, x: 16, y: 50, w: 68, h: 22, rot: 0, bloques: [] }); return; }
    if (que === 'boton') { this.ponerBoton(); return; }
    if (que === 'pasaje') { this.ponerPasaje(); return; }
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

  /* Un pasaje va siempre en el texto, en su propia linea; con una pagina libre elegida, justo despues de ella */
  ponerPasaje() {
    const { vivo, pos } = this.puntoDeInsercion(), e = vivo.editor;
    e.view.dispatch(e.state.tr.insert(pos, e.schema.nodes.pasaje.create({ texto: '', referencia: '' })));
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
    const r = await this.be.taller.crearCapitulo(this.obra().id);
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

  /* Devuelve si quedo guardado el orden: sin el, partir no recorta (mejor repetido que fuera de lugar) */
  async ordenar() {
    const r = await this.be.taller.ordenar(this.obra().id, this.vivos.map((v) => v.cap.id));
    if (r.error) { this.alFalla(r.error); return false; }
    return true;
  }

  /* Un capitulo que sale de la mesa: su editor, su caja, y lo que la barra de estado sabia de el */
  quitarVivo(x) {
    const k = this.vivos.indexOf(x);
    if (k >= 0) this.vivos.splice(k, 1);
    x.soltar();
    x.caja.remove();
    if (this.alQuitarVivo) this.alQuitarVivo(x);
  }

  /* ---- Partir y unir capitulos ---- */
  /* Donde partir, tomado cuando se abre el menu: el capitulo y su bloque de arriba. Si las paginas se vuelven a
     medir mientras se escribe el nombre, el corte cae igual donde se pidio. */
  puntoDeCorte(i) {
    const p = this.paginas[i];
    if (!p || !p.vivo) return null;
    const indice = this.bloqueDePagina(p);
    return indice === null ? null : { vivo: p.vivo, indice };
  }

  /* Desde ese bloque empieza un capitulo nuevo (una portada en PDF pasa a ser su primera pagina). Nunca pierde
     nada: guardar → copia de seguridad → crear el capitulo nuevo con la cola y guardarlo → ordenar → recien ahi
     quitar la cola del de antes, y solo si el capitulo sigue identico a la foto del principio. Bloquearlo frena lo
     que se escribe, no lo que llega solo (una pagina de PDF, un deshacer): si algo entro, se deja repetido. */
  async empezarCapituloAqui(punto, escrito = '') {
    const tx = this.tx, titulo = tituloLimpio(escrito);
    if (!punto || !this.vivos.includes(punto.vivo)) return;
    if (this.moviendo) { this.decir(tx.moverEspera); return; }
    const v = punto.vivo, e = v.editor;
    if (!e.isEditable) { this.decir(tx.variasQuietas); return; }
    this.moviendo = true;
    e.setEditable(false, false);
    const sigue = () => this.vivos.includes(v) && !e.isDestroyed;
    try {
      this.confirmarEdicion();
      const foto = e.getJSON(), firma = JSON.stringify(foto), partes = cortar(foto, punto.indice);
      if (!partes) { this.decir(tx.yaEmpiezaAqui); return; }
      v.guardado.marcar();
      if (!(await v.guardado.vaciar())) { if (sigue()) this.alFalla('noGuardado'); return; }
      if (!sigue() || (this.alCopiaSegura && !(await this.alCopiaSegura())) || !sigue()) return;
      const r = await this.be.taller.crearCapitulo(this.obra().id, titulo);
      if (!sigue()) return;
      if (r.error) { this.alFalla(r.error); return; }
      const cap = new Capitulo(r.fila);
      cap.contenido = limpiarContenido({ doc: partes.cola, papel: v.papel, titulo }).contenido;
      const nuevo = new CapituloVivo(cap, this);
      nuevo.guardado.marcar();
      if (!(await nuevo.guardado.vaciar()) || !sigue()) {
        this.quitarVivo(nuevo);
        await this.be.taller.borrarCapitulo(cap.id);
        if (sigue()) this.alFalla('noGuardado');
        return;
      }
      this.vivos.splice(this.vivos.indexOf(v) + 1, 0, nuevo);
      this.lienzo.insertBefore(nuevo.caja, v.caja.nextSibling);
      const ordenado = await this.ordenar();
      if (!sigue()) return;
      if (!ordenado || JSON.stringify(e.getJSON()) !== firma) { this.medir(); this.decir(tx.capituloRepetido); return; }
      /* La cola ya esta a salvo en el capitulo nuevo: se quita de este, sin rastro en «deshacer» (un Ctrl+Z la
         traeria repetida) */
      e.view.dispatch(e.state.tr.delete(posicionDeBloque(e.state.doc, punto.indice), e.state.doc.content.size).setMeta(META_PAGINA, true).setMeta('addToHistory', false));
      this.soltarElegidos();
      this.soltarEleccion();
      v.guardado.marcar();
      const cabeza = await v.guardado.vaciar();
      if (!sigue()) return;
      this.activo = nuevo;
      this.medir();
      this.irA(nuevo.primera);
      this.minis.entrarAlCapitulo(nuevo);
      this.decir(cabeza ? tx.capituloEmpieza : tx.capituloEmpiezaPendiente);
    } finally {
      /* Un capitulo que un conflicto dejo quieto sigue quieto */
      if (sigue()) e.setEditable(this.editable && !v.guardado.parado, false);
      this.moviendo = false;
    }
  }

  /* El capitulo `v` se pega al final del anterior. Se guardan los dos y se hace una copia; el de antes queda con
     todo, y solo cuando eso esta guardado, y si `v` no cambio mientras tanto, se borra `v`. */
  async unirConAnterior(v) {
    const tx = this.tx, k = this.vivos.indexOf(v), a = this.vivos[k - 1];
    if (k < 1) return;
    if (this.moviendo) { this.decir(tx.moverEspera); return; }
    if (!a.editor.isEditable || !v.editor.isEditable) { this.decir(tx.variasQuietas); return; }
    this.moviendo = true;
    a.editor.setEditable(false, false);
    v.editor.setEditable(false, false);
    const juntos = () => this.vivos.indexOf(a) >= 0 && this.vivos.indexOf(v) === this.vivos.indexOf(a) + 1;
    try {
      this.confirmarEdicion();
      for (const x of [a, v]) {
        x.guardado.marcar();
        if (!(await x.guardado.vaciar())) { if (juntos()) this.alFalla('noGuardado'); return; }
        if (!juntos()) return;
      }
      if ((this.alCopiaSegura && !(await this.alCopiaSegura())) || !juntos()) return;
      const fv = JSON.stringify(v.editor.getJSON());
      const limpio = limpiarContenido({ doc: unir(a.editor.getJSON(), JSON.parse(fv)), papel: a.papel, titulo: a.tituloPropio, enIndice: a.enIndice });
      if (!cabeEnElCapitulo(limpio)) { this.decir(tx.noCabeUnir); return; }
      a.ponerTexto(limpio.contenido.doc);
      a.guardado.marcar();
      if (!(await a.guardado.vaciar())) { if (juntos()) { this.alFalla('noGuardado'); this.medir(); } return; }
      if (!juntos()) return;
      /* Si al segundo le llego algo mientras tanto, no se borra: queda repetido, nunca perdido */
      if (JSON.stringify(v.editor.getJSON()) !== fv) { this.medir(); this.decir(tx.capituloRepetido); return; }
      const r = await this.be.taller.borrarCapitulo(v.cap.id);
      if (!juntos()) return;
      if (r.error) { this.alFalla(r.error); this.medir(); return; }
      const otroPapel = a.papel !== v.papel;
      this.soltarElegidos();
      this.soltarEleccion();
      this.quitarVivo(v);
      if (this.activo === v) this.activo = a;
      await this.ordenar();
      this.medir();
      this.irA(a.primera);
      this.minis.entrarAlCapitulo(a);
      this.decir(otroPapel ? tx.capitulosUnidosPapel : tx.capitulosUnidos);
    } finally {
      for (const x of [a, v]) if (this.vivos.includes(x) && !x.editor.isDestroyed) x.editor.setEditable(this.editable && !x.guardado.parado, false);
      this.moviendo = false;
    }
  }

  /* El bloque de arriba donde empieza la pagina `p`: una pagina libre es el suyo; una de texto, el primero que
     cae en ella (un parrafo que viene de la pagina de antes se queda atras). Una pagina dentro de columnas no
     se ofrece: el corte caeria antes de todas las columnas. null si no se puede partir ahi. */
  bloqueDePagina(p) {
    const e = p.vivo.editor, pos = p.vista ? p.vista.getPos() : p.vivo.posicionDeFila(p.fila, this.px, this.z);
    if (typeof pos !== 'number') return null;
    const doc = e.state.doc, r = doc.resolve(Math.min(pos, doc.content.size));
    if (r.depth > 0) return null;
    const i = r.index(0);
    return i >= 1 && i < doc.childCount ? i : null;
  }

  renombrarCapitulo(v, titulo) {
    v.tituloPropio = tituloLimpio(titulo);
    v.cap.titulo = v.tituloPropio || tituloDe(v.editor.getJSON());
    v.guardado.marcar();
    this.medir();
    this.decir(this.tx.capituloRenombrado);
  }

  alternarEnIndice(v) {
    v.enIndice = !v.enIndice;
    v.guardado.marcar();
    this.medir();
    this.decir(v.enIndice ? this.tx.vuelveAlContenido : this.tx.fueraDelContenidoDicho);
  }

  /* Clic derecho sobre el nombre de un capitulo en las miniaturas */
  abrirMenuCapitulo(v, e, origen) {
    e.preventDefault();
    const tx = this.tx, k = this.vivos.indexOf(v), quieto = !v.editor.isEditable, con = e.clientX || e.clientY, r = origen.getBoundingClientRect();
    const items = [
      { texto: tx.cambiarNombre, queda: true, apagado: quieto, fn: () => this.menu.pedirTexto({ etiqueta: tx.nombreCapitulo, valor: v.tituloPropio, ayuda: tx.nombreCapituloAyuda, alListo: (t) => this.renombrarCapitulo(v, t) }) },
      { texto: v.enIndice ? tx.ocultarDelContenido : tx.mostrarEnContenido, apagado: quieto, fn: () => this.alternarEnIndice(v) },
      ...(k > 0 ? [{ raya: true }, { texto: tx.unirConAnterior, apagado: quieto, confirmar: tx.unirSeguro, fn: () => this.unirConAnterior(v) }] : [])
    ];
    this.menu.abrir(con ? e.clientX : r.left + 16, con ? e.clientY : r.top + 16, items, origen, () => this.minis.entrarAlCapitulo(v));
  }

  /* Lo de capitulos en el menu de una pagina: aqui empieza uno, o unir con el de antes si ya es la primera. Se
     mira solo el bloque y si lo que sigue trae un titulo: abrir un menu no copia el capitulo entero. */
  accionesDeCapitulo(i) {
    const tx = this.tx, p = this.paginas[i], v = p.vivo, quieto = !v.editor.isEditable;
    if (this.paginas.findIndex((q) => q.vivo === v) === i) {
      return this.vivos.indexOf(v) > 0 ? [{ texto: tx.unirConAnterior, icono: 'subir', apagado: quieto, confirmar: tx.unirSeguro, fn: () => this.unirConAnterior(v) }] : [];
    }
    const punto = this.puntoDeCorte(i);
    if (!punto) return [];
    let conTitulo = false;
    v.editor.state.doc.forEach((n, _, k) => { if (k >= punto.indice && n.type.name === 'heading') conTitulo = true; });
    /* Una cola sin titulo (una portada en PDF) necesita nombre: se pregunta antes de partir */
    return [{ texto: tx.empiezaAqui, icono: 'hoja', apagado: quieto, queda: !conTitulo, fn: () => (conTitulo
      ? this.empezarCapituloAqui(punto)
      : this.menu.pedirTexto({ etiqueta: tx.comoSeLlama, valor: '', ayuda: tx.nombreCapituloAyuda, alListo: (t) => this.empezarCapituloAqui(punto, t) })) }];
  }

  /* ---- Borrar y mover ---- */
  async borrarPagina(h) {
    if (h.bloqueada) return;
    const e = h.editor, pos = h.getPos(), i = this.paginas.findIndex((p) => p.vista === h), tr = e.state.tr.delete(pos, pos + 1).setMeta(META_PAGINA, true);
    /* El cursor queda junto a lo borrado: si no, la vista saltaria a donde estaba antes. `closeHistory`: dos
       paginas borradas seguidas son dos Ctrl+Z, no uno que traiga las dos. */
    e.view.dispatch(closeHistory(tr.setSelection(Selection.near(tr.doc.resolve(tr.mapping.map(pos))))));
    this.prop.ocultar();
    this.hojaActiva = null;
    this.medir();
    this.decir(this.tx.paginaBorrada);
    /* Si lo que sigue es otra hoja, el foco va ahi: en un libro de PDF el texto mas cercano puede estar muy lejos */
    const sigue = this.paginas[Math.min(i, this.paginas.length - 1)];
    if (sigue && sigue.vista && sigue.vista.editor === e) sigue.vista.hoja.focus({ preventScroll: true });
    else e.commands.focus();
  }

  duplicarPagina(h) {
    if (h.bloqueada) return;
    const e = h.editor, pos = h.getPos();
    this.meterPagina(e, pos + 1, JSON.parse(JSON.stringify(h.attrs)));
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
      const tr = eo.state.tr.delete(pos, pos + 1).setMeta(META_PAGINA, true);
      eo.view.dispatch(closeHistory(tr.insert(tr.mapping.map(d.pos), nodo)));
    } else {
      nodo = ed.schema.nodeFromJSON(nodo.toJSON());
      const tr = ed.state.tr.insert(d.pos, nodo);
      if (!tr.docChanged) { this.alFalla('noGuardado'); return null; }
      ed.view.dispatch(tr);
      const quedo = await d.vivo.guardado.vaciar(), ahora = h.getPos();
      if (!quedo) { this.alFalla('noGuardado'); this.medir(); return null; }
      if (typeof ahora === 'number') eo.view.dispatch(eo.state.tr.delete(ahora, ahora + 1).setMeta(META_PAGINA, true));
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
    const c = crear('span', 'clon libro'), fuente = p.vista ? p.vista.hoja : p.vivo ? p.vivo.caja : this.raiz;
    c.style.cssText = `width:${this.px.W * esc}px;height:${this.px.H * esc}px`;
    /* Lo que la copia no cubre es papel: blanco solo si el libro es blanco */
    c.style.setProperty('--hoja-papel', getComputedStyle(fuente).getPropertyValue('--hoja-papel'));
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
    d.querySelectorAll('.marco, .fantasma, .guia, .seg, .sale, .asa, .hoja__falla').forEach((n) => n.remove());
    [d, ...d.querySelectorAll('.hoja--cargando')].forEach((n) => n.classList.remove('hoja--cargando'));
    /* La marca de elegida es de la mesa: ni la copia de una hoja ni la de un capitulo entero la llevan */
    [d, ...d.querySelectorAll('.hoja--elegida')].forEach((n) => n.classList.remove('hoja--elegida'));
    const baja = p.vista || p.indice ? 0 : p.fila * (this.px.H + this.px.gap);
    d.classList.add('clon__dentro');
    d.style.transform = `scale(${esc}) translateY(${-baja}px)`;
    d.removeAttribute('tabindex');
    c.inert = true;
    c.append(d);
    return c;
  }
}
