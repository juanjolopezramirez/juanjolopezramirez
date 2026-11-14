/* LA MESA: las hojas del libro en una tira, con las miniaturas a la izquierda y el panel que aparece al
   elegir algo. Reune los capitulos vivos y todo lo que no es de uno solo: el orden de las paginas, el
   zoom, la zona segura y mover paginas de un lado a otro.

   EL ZOOM ES UNA ESCALA, no `zoom` de CSS: la prueba de la Etapa 1 mostro que el otro mueve los cortes
   de pagina. Con la escala, lo que se ve en cualquier zoom es lo que sale en el PDF. */
import { Selection } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import { META_PAGINA, alternar, antesDelNumero, destinoDelBloque, libresDe, lugaresDe, nodosEnLugares, posicionesDe, rango, resumenDe, todasDelCapitulo, trBorrar, trDuplicar, trMover, trPapel } from './Varias.js';
import { Capitulo } from '../../../../contenido/taller/Obra.js';
import { ConfigPagina, colorDeLetra } from '../../../../contenido/taller/ConfigPagina.js';
import { familiaCss } from '../../../../contenido/taller/fuentes.js';
import { cssLibro } from '../../../../contenido/taller/hoja.js';
import { armar } from '../../../../contenido/taller/armar.js';
import { AL_FINAL, debeFijarPortada, entradasDe, hayPortada, hojasDeIndice, lugarDelIndice as lugarDelIndiceDe, conMinis, opcionesDeIndice as opcionesDe, palabraLimpia, PALABRA_MAX, ROLES, rolLimpio, rotulosDe, tituloDeIndice } from '../../../../contenido/taller/IndiceLibro.js';
import { grupoDe, gruposDe, planCambio } from '../../../../contenido/taller/OrigenPdf.js';
import { contextosDeCabeza, textoDeCabeza } from '../../../../contenido/taller/CabezaLibro.js';
import { variablesDe } from '../../../../contenido/taller/colores.js';
import { fueraDeMargen } from '../../../../contenido/taller/tipos/paginaLibre.js';
import { datosDeBoton } from '../../../../contenido/taller/tipos/boton.js';
import { CapituloVivo, piePagina } from './CapituloVivo.js';
import { cortar, unir, tieneTitulo, partirEnTres } from './Partir.js';
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
/* Ninguna hoja del contenido lleva mas filas: medir de a pedazos no recorre el libro entero en cada hoja */
const FILAS_POR_HOJA_MAX = 120;
const ZOOM_MIN = .25, ZOOM_MAX = 3;
const SIN_ELEGIR = Object.freeze({ vivo: null, nodos: [], ancla: null });

export class Mesa {
  constructor(raiz, o) {
    Object.assign(this, { raiz, ...o });      // tx, ctx, pestana, imagenes, editable, obra(), alEstadoGlobal, alFalla, alDecir, alImagen
    this.vivos = [];
    this.vistas = new Set();
    /* Las imagenes del contenido ya listas (la de arriba y las portadas en Tarjetas). `turnoIndice` cambia al cerrar. */
    this.listasIndice = new Map();
    this.pedidasIndice = new Set();
    this.fallidasIndice = new Set();
    this.turnoIndice = 0;
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
    /* Cuando llega una letra, el texto se re-acomoda solo en las columnas, pero los numeros de hoja, el contenido y las
       miniaturas se midieron con la letra de reserva: se miden de nuevo */
    document.fonts.addEventListener('loadingdone', () => { if (this.vivos.length) this.programar(); });
  }

  get be() { return this.ctx.be; }
  get px() { return new ConfigPagina(this.obra().pagina).enPixeles(); }
  config() { return this.obra().pagina; }
  idioma() { return this.obra().idioma; }
  margenes() { return new ConfigPagina(this.obra().pagina).aPorcentajes(); }
  /* Como va el numero de pagina en este libro: { ver, lugar } */
  pie() { return { ...new ConfigPagina(this.obra().pagina).numeros }; }
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
    this.turnoIndice++;
    this.listasIndice.clear();
    this.pedidasIndice.clear();
    this.fallidasIndice.clear();
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
    /* El numero de pagina con la letra y la tinta del PDF (sin tinta propia, la del papel de cada hoja) */
    const c = new ConfigPagina(this.obra().pagina);
    s.setProperty('--pie-letra', familiaCss(c.cuerpo.fuente));
    s.setProperty('--cabeza-pt', `${c.cabeza.tamanoPt}pt`);
    const tinta = colorDeLetra(c, c.cuerpo.fuente);
    if (tinta) s.setProperty('--pie-tinta', tinta); else s.removeProperty('--pie-tinta');
    this.estilo.textContent = cssLibro(this.obra().pagina);
  }

  coloresUsados() { return this.obra().pagina.colores; }

  repintarHojas() { this.aplicarPagina(); this.vistas.forEach((v) => v.pintar()); this.medir(); }

  /* ---- Medir ---- */
  /* Cuantas filas lleva cada hoja del indice. Se miden: un titulo largo ocupa dos renglones y la letra
     cambia, y si aqui saliera una hoja menos que al imprimir, todos los numeros del indice mentirian. */
  /* Cada hoja se arma como sale (la primera con su nombre e imagen, las demas sin) y cuenta las filas que caben
     enteras en la caja del texto: hacia abajo, y en Dos columnas tambien hacia el lado. */
  repartoDeIndice(entradas) {
    if (!entradas.length) return [];
    const p = this.px, h = crear('section', 'hoja hoja--indice libro');
    h.style.cssText = 'position:absolute;visibility:hidden;left:0;top:0';
    this.lienzo.append(h);
    /* Con numeros de tres cifras: el mas ancho que puede tener una fila */
    const numeros = Object.fromEntries(entradas.map((f) => [f.ancla, 888]));
    const o = this.opcionesDeIndice(entradas), reparto = [];
    try {
    for (let desde = 0; desde < entradas.length;) {
      /* Cuantas se arman: un poco mas de las que cupieron en la hoja anterior (nunca el libro entero cada vez) */
      const resto = entradas.slice(desde, desde + (reparto.length ? Math.min(FILAS_POR_HOJA_MAX, reparto[reparto.length - 1] * 2 + 4) : FILAS_POR_HOJA_MAX));
      h.replaceChildren(armar(hojasDeIndice(resto, numeros, [resto.length], { ...o, primera: !reparto.length })[0]));
      let caben = 0;
      for (const f of h.querySelectorAll('.indice__fila')) {
        if (f.offsetTop + f.offsetHeight > p.mt + p.alto + .5 || f.offsetLeft + f.offsetWidth > p.ml + p.ancho + .5) break;
        caben++;
      }
      /* Una fila mas alta que la hoja va sola en la suya: nunca se queda sin lugar */
      caben = Math.max(1, caben);
      reparto.push(caben);
      desde += caben;
    }
    } finally { h.remove(); }
    return reparto;
  }

  /* El capitulo delante del cual va el contenido (0 = al comienzo, o si el elegido ya no esta) */
  lugarDelIndice() {
    const c = new ConfigPagina(this.obra().pagina), caps = this.capitulosParaIndice();
    return lugarDelIndiceDe(caps, c.indice, hayPortada(caps, c.portada));
  }

  /* El encabezado corrido (CabezaLibro): null si el libro no lo lleva; si no, `cabeza(k)` da lo que necesita el capitulo k
     para dibujarlo en cada hoja de texto. Lo que dice sale del mismo calculo que usa la hoja de impresion. */
  cabezas() {
    const c = new ConfigPagina(this.obra().pagina);
    if (!c.cabeza.ver) return null;
    const caps = this.capitulosParaIndice(), contextos = contextosDeCabeza(caps, { rotulo: c.rotulo, idioma: this.idioma(), portada: hayPortada(caps, c.portada) });
    const distancia = (c.cabeza.distanciaMm / 25.4) * 96;
    return (k) => ({ distancia, inicial: contextos[k].inicial, texto: (sub) => textoDeCabeza(contextos[k], sub, c.cabeza.partes) });
  }

  /* El primer capitulo es la portada del libro (la regla es la misma de la hoja de impresion) */
  conPortada() { return hayPortada(this.capitulosParaIndice(), new ConfigPagina(this.obra().pagina).portada); }
  esPortada(v) { return this.vivos[0] === v && this.conPortada(); }

  medir() {
    const p = this.px, entradas = this.entradasDeIndice(), reparto = this.repartoDeIndice(entradas), ind = reparto.length, antes = this.lugarDelIndice();
    this.paginas = [];
    this.gruposCache = null;
    let n = 0;
    const meterIndice = () => { for (let i = 0; i < ind; i++) this.paginas.push({ vivo: null, fila: i, vista: null, indice: true }); n += ind; };
    const pie = this.pie(), portada = this.conPortada(), cabeza = this.cabezas();
    this.vivos.forEach((v, k) => {
      if (k === antes) meterIndice();
      v.primera = n + 1;
      /* El encabezado va en las hojas de texto de todos los capitulos menos la portada */
      n += v.medir(n + 1, p, this.z, this.segura, { ...pie, portada: portada && k === 0 }, cabeza && !(portada && k === 0) ? cabeza(k) : null);
      for (const f of v.filas) this.paginas.push({ vivo: v, ...f });
    });
    if (antes >= this.vivos.length) meterIndice();
    this.pintarIndice(entradas, reparto, antes);
    /* Una portada reconocida sola queda fija la primera vez (solo quien puede editar la guarda) */
    if (this.editable && this.alPortada && debeFijarPortada(this.capitulosParaIndice(), new ConfigPagina(this.obra().pagina).portada)) this.alPortada('si', true);
    this.podarEleccion();
    this.minis.pintar();
    this.pintarEleccion();
    this.contar();
    this.revisarSueltos();
  }

  /* Un boton suelto que ya no cabe en su hoja (su parrafo bajo) se marca: en el PDF se cortaria en el margen */
  revisarSueltos() { this.lienzo.querySelectorAll('.boton-suelto').forEach((e) => { if (e.vistaBoton) e.vistaBoton.revisar(); }); }

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

  /* `modo`: 'uno' (clic), 'rango' (Mayus+clic) o 'alternar' (Ctrl+clic). Solo paginas libres de un capitulo.
     `visibles`: los indices de las hojas que se ven en la columna; un rango no toma las que no se ven (en «PDF» faltan las
     hojas de en medio que no son de un PDF). */
  elegirMini(i, modo, visibles = null) {
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
        const r = rango(visibles ? lista.map((q, k) => (k === a || visibles.has(k) ? q : { vivo: q.vivo, nodo: null })) : lista, a, i);
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
  /* Los capitulos como los lee IndiceLibro (igual que hoja.capitulosParaIndice), con el texto vivo del editor */
  capitulosParaIndice() {
    return this.vivos.map((v, i) => {
      const { titulo, ...propios } = v.propios();
      return { id: v.cap.id, ancla: `cap-${i + 1}`, ...propios, titulo: v.cap.titulo, tituloPropio: titulo, doc: v.editor.state.doc };
    });
  }

  entradasDeIndice() {
    const c = new ConfigPagina(this.obra().pagina), ind = c.indice;
    if (!ind.ver) return [];
    const caps = this.capitulosParaIndice();
    return entradasDe(caps, { subtemas: ind.subtemas, portada: hayPortada(caps, c.portada), rotulo: c.rotulo, idioma: this.idioma(), minis: conMinis(ind), verRol: ind.verRol });
  }

  /* Como se llama cada capitulo en las miniaturas y en «Va antes de»: «Portada», «Capítulo 1 · El desierto»,
     el nombre solo, o «Capítulo N» contando como cuenta el contenido */
  nombresDeCapitulos() {
    const c = new ConfigPagina(this.obra().pagina), caps = this.capitulosParaIndice(), portada = hayPortada(caps, c.portada);
    const rs = rotulosDe(caps, { rotulo: c.rotulo, idioma: this.idioma(), portada }), tx = this.tx;
    return this.vivos.map((v, k) => {
      if (portada && k === 0) return tx.portada;
      const r = rs[k], nombre = v.cap.titulo;
      /* Un capitulo con papel se llama por el: «Introducción · Nombre» */
      const rotulo = r.rotulo || r.rol;
      if (rotulo) return nombre && nombre !== rotulo ? `${rotulo} · ${nombre}` : rotulo;
      return nombre || (r.numero ? `${tx.capitulo} ${r.numero}` : tx.capituloSinNombre);
    });
  }

  /* `entradas`: las ya armadas en esta medida (no se recorre el libro otra vez) */
  opcionesDeIndice(entradas = []) {
    const ind = new ConfigPagina(this.obra().pagina).indice;
    /* Las imagenes que ya estan; la que falta se pide y, al llegar, la hoja se vuelve a pintar (su caja no cambia) */
    const imagenes = Object.create(null);
    for (const ruta of [ind.imagen.ruta, ...(conMinis(ind) ? entradas.map((f) => f.mini) : [])]) {
      if (ruta) imagenes[ruta] = this.imagenDeIndice(ruta);
    }
    return opcionesDe(ind, this.idioma(), imagenes);
  }

  imagenDeIndice(ruta) {
    if (this.listasIndice.has(ruta)) return this.listasIndice.get(ruta);
    /* Una que no llego no se vuelve a pedir en cada medida (se escribe y se mide muy seguido): hasta reabrir */
    if (!this.pedidasIndice.has(ruta) && !this.fallidasIndice.has(ruta)) {
      this.pedidasIndice.add(ruta);
      const turno = this.turnoIndice;
      Promise.resolve(this.imagenes.vista(ruta)).then((d) => {
        if (turno !== this.turnoIndice) return;
        this.pedidasIndice.delete(ruta);
        if (d) { this.listasIndice.set(ruta, d); this.programar(); } else this.fallidasIndice.add(ruta);
      }, () => { if (turno === this.turnoIndice) { this.pedidasIndice.delete(ruta); this.fallidasIndice.add(ruta); } });
    }
    return '';
  }

  /* La pagina de cada ancla, ya medida: el capitulo empieza en su primera; un titulo, en la fila donde cae; una
     pagina libre, en la suya */
  numerosDeIndice() {
    /* Sin prototipo: un ancla nunca lee algo heredado */
    const numeros = Object.create(null), paso = this.px.H + this.px.gap;
    this.vivos.forEach((v, i) => {
      numeros[`cap-${i + 1}`] = v.primera;
      const arriba = v.editor.view.dom.getBoundingClientRect().top;
      v.editor.view.dom.querySelectorAll('[data-ancla]').forEach((t) => {
        const fila = Math.floor((t.getBoundingClientRect().top - arriba) / this.z / paso + 0.001);
        if (!(t.dataset.ancla in numeros)) numeros[t.dataset.ancla] = v.primera + Math.max(0, fila);
      });
    });
    this.paginas.forEach((q, k) => { const a = q.vista && q.vista.node.attrs; if (a && a.titulo && a.ancla && !(a.ancla in numeros)) numeros[a.ancla] = k + 1; });
    return numeros;
  }

  /* A DONDE SE PUEDE IR en «Ver como libro»: la portada, el contenido, cada capitulo (con su papel o su rotulo) y sus
     subtemas, cada uno con su pagina (1 es la primera). No depende de que el libro lleve contenido; salen en el orden
     del libro. `nivel` 1 es un capitulo, 2 un subtema. */
  destinos() {
    const c = new ConfigPagina(this.obra().pagina), caps = this.capitulosParaIndice(), portada = hayPortada(caps, c.portada), tx = this.tx;
    if (!this.paginas.length) return [];
    const numeros = this.numerosDeIndice(), lista = [];
    const pagina = (ancla) => (Number.isInteger(numeros[ancla]) && numeros[ancla] >= 1 && numeros[ancla] <= this.paginas.length ? numeros[ancla] : 0);
    const portadaPag = portada ? pagina('cap-1') : 0;
    if (portadaPag) lista.push({ nivel: 1, texto: tx.portada, pagina: portadaPag });
    const contenido = this.paginas.findIndex((q) => q.indice) + 1;
    if (contenido > 0 && c.indice.ver) lista.push({ nivel: 1, texto: tituloDeIndice(c.indice, this.idioma()), pagina: contenido });
    for (const f of entradasDe(caps, { subtemas: true, portada, rotulo: c.rotulo, idioma: this.idioma(), verRol: true })) {
      const n = pagina(f.ancla), texto = f.rotulo && f.titulo && f.rotulo !== f.titulo ? `${f.rotulo} · ${f.titulo}` : (f.rotulo || f.titulo);
      if (n && texto) lista.push({ nivel: f.nivel === 2 ? 2 : 1, texto: texto.slice(0, 120), pagina: n });
    }
    /* Por orden de pagina; con la misma pagina, el que ya iba antes */
    return lista.map((x, i) => [x, i]).sort((a, b) => a[0].pagina - b[0].pagina || a[1] - b[1]).map(([x]) => x);
  }

  /* El mismo arbol que imprime la hoja (hojasDeIndice + armar): la mesa y el PDF no pueden diferir.
     Un clic en una fila lleva a su pagina. `datosDeIndice` es lo que la hoja de impresion recibe. */
  pintarIndice(entradas, reparto, antes) {
    this.lienzo.querySelectorAll('.hoja--indice').forEach((h) => h.remove());
    this.datosDeIndice = null;
    if (!reparto.length) return;
    const numeros = this.numerosDeIndice();
    this.datosDeIndice = { numeros, reparto: [...reparto] };
    /* Las hojas del contenido llevan su numero, como en el PDF: el que les toca en el libro */
    const pie = this.pie(), suyas = this.paginas.map((q, k) => (q.indice ? k + 1 : 0)).filter(Boolean);
    const cajas = hojasDeIndice(entradas, numeros, reparto, this.opcionesDeIndice(entradas)).map((nav, i) => {
      const h = crear('section', 'hoja hoja--indice libro');
      h.append(armar(nav));
      if (pie.ver && suyas[i]) h.append(piePagina(suyas[i], 0, this.px, pie.lugar));
      h.addEventListener('click', (e) => {
        const a = e.target.closest('a.indice__fila');
        if (!a) return;
        e.preventDefault();
        const n = numeros[(a.getAttribute('href') || '').slice(1)];
        if (n) this.irA(n);
      });
      return h;
    });
    const sitio = this.vivos[antes];
    if (sitio) sitio.caja.before(...cajas);
    else if (this.vivos.length) this.lienzo.append(...cajas);     // la portada es todo el libro: al final
    else this.lienzo.prepend(...cajas);
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
        /* El rango: unas hojas que son la introduccion, la conclusion... (se parte el capitulo si hace falta) */
        { texto: tx.marcarComo, icono: 'lista', apagado: quieta, queda: true, fn: () => this.menuDeRolesRango(this.menu.x, this.menu.y, this.menu.origen) },
        { raya: true },
        /* Solo si siguen siendo las que dice el boton */
        { texto: cuenta(tx.eliminarVarias), icono: 'eliminar', aviso: true, apagado: quieta, confirmar: cuenta(tx.eliminarVariasSeguro), fn: () => { if (this.cuantasElegidas() === k) this.borrarVarias(); } }];
    }
    return [ir,
      { texto: tx.duplicarPagina, icono: 'duplicar', apagado: quieta, fn: () => { this.activoDe(h); this.duplicarPagina(h); this.decir(tx.paginaDuplicada); } },
      { texto: tx.moverA, icono: 'mover', apagado: quieta, queda: true, fn: () => this.menu.mover({ actual: n, total: this.paginas.length, primera: this.primeraDeTexto(), alMover: (d) => this.moverHasta(h, d) }) },
      ...this.accionesDePdf(p, quieta),
      ...this.accionesDeCapitulo(i),
      { raya: true },
      { texto: tx.eliminarPagina, icono: 'eliminar', aviso: true, apagado: quieta, confirmar: tx.eliminarPaginaSeguro, fn: () => { this.activoDe(h); this.borrarPagina(h); } }];
  }

  /* ---- De que PDF viene una pagina ---- */
  /* Los PDF del libro, en el orden en que aparecen (una sola vez por cambio de medida) */
  gruposDePdf() {
    if (!this.gruposCache) this.gruposCache = gruposDe(this.paginas.map((q) => ({ clave: q.vivo, attrs: q.vista ? q.vista.node.attrs : null })));
    return this.gruposCache;
  }

  grupoDePagina(p) {
    const a = p.vista ? p.vista.node.attrs : null;
    return a && grupoDe(a) ? this.gruposDePdf().find((g) => g.paginas.some((q) => this.paginas[q.i] === p)) || null : null;
  }

  /* Lo del PDF en el menu de una pagina: elegir todas las del mismo PDF, cambiarlo, o quedarse con una que sobra */
  accionesDePdf(p, quieta) {
    const tx = this.tx, g = this.grupoDePagina(p);
    if (!g) return [];
    const items = [
      { texto: tx.pdfElegirTodasMenu, icono: 'lista', fn: () => this.elegirTodasDelPdf(g, p.vivo) },
      { texto: tx.cambiarPdf, icono: 'subir', apagado: quieta || !this.alPedirCambioPdf, fn: () => this.pedirCambioPdf(g) }
    ];
    if (g.sobra) items.push({ texto: tx.quitarMarcaSobra, apagado: quieta, fn: () => this.quitarSobra(p) });
    return items;
  }

  /* Un clic derecho sobre un PDF de la lista «PDF» */
  abrirMenuPdf(g, e, origen) {
    e.preventDefault();
    const tx = this.tx, con = e.clientX || e.clientY, r = origen.getBoundingClientRect();
    const quieta = g.paginas.some((q) => !this.paginas[q.i].vivo.editor.isEditable);
    const items = [
      { texto: tx.pdfElegirTodasMenu, icono: 'lista', fn: () => this.elegirTodasDelPdf(g, null) },
      { texto: tx.cambiarPdf, icono: 'subir', apagado: quieta || !this.alPedirCambioPdf, fn: () => this.pedirCambioPdf(g) }
    ];
    this.menu.abrir(con ? e.clientX : r.left + 16, con ? e.clientY : r.top + 16, items, origen, () => this.minis.entrar());
  }

  /* «Elegir todas las de este PDF»: solo las de un capitulo (cada capitulo tiene su propio Ctrl+Z). Si el PDF esta en
     varios, el de `preferido` (el que se mira) o, si no, el que mas tiene. */
  elegirTodasDelPdf(g, preferido) {
    const tx = this.tx, porCap = new Map();
    for (const q of g.paginas) { const v = this.paginas[q.i] && this.paginas[q.i].vivo; if (v) porCap.set(v, [...(porCap.get(v) || []), q]); }
    const vivo = preferido && porCap.has(preferido) ? preferido : [...porCap.keys()].sort((a, b) => porCap.get(b).length - porCap.get(a).length)[0];
    if (!vivo) return;
    const dellas = porCap.get(vivo), nodos = dellas.map((q) => this.paginas[q.i].vista.node);
    if (this.hojaActiva || this.imagenElegida) this.soltarElegidos();
    this.eleccion = { vivo, nodos, ancla: nodos[0] };
    this.panelDeEleccion();
    this.pintarEleccion();
    this.irA(dellas[0].i + 1);
    const otras = g.paginas.length - dellas.length;
    this.decir([nodos.length === 1 ? tx.elegidaUna : `${tx.elegidas.replace('{n}', String(nodos.length))}.`, otras ? tx.pdfEnOtros.replace('{n}', String(otras)) : ''].filter(Boolean).join(' '));
  }

  /* «Quedarme con esta hoja»: deja de ser una de las que sobran */
  quitarSobra(p) {
    const h = p.vista;
    if (!h || h.bloqueada || !h.node.attrs.sobra) return;
    const e = h.editor, pos = h.getPos();
    if (typeof pos !== 'number') return;
    e.view.dispatch(closeHistory(e.state.tr.setNodeMarkup(pos, null, { ...h.node.attrs, sobra: false })));
    this.medir();
    this.decir(this.tx.sobraQuitada);
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
    if (!p) return { vivo: this.vivos[0], pos: 0 };
    /* Despues del contenido es el comienzo del capitulo que lo sigue (puede ir a mitad del libro) */
    if (p.indice) {
      const sigue = this.vivos[this.lugarDelIndice()], ultimo = this.vivos[this.vivos.length - 1];
      if (sigue) return { vivo: sigue, pos: 0 };
      return ultimo ? { vivo: ultimo, pos: ultimo.editor.state.doc.content.size } : { vivo: this.vivos[0], pos: 0 };
    }
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

  /* LA PORTADA DESDE UN PDF. La primera pagina va al comienzo de la portada que ya hay, o de un capitulo nuevo al
     comienzo del libro; las demas la siguen (ponerPaginaDePdf). El capitulo se crea con la primera pagina (si se
     cancela antes, no se crea), y si algo falla despues de crearlo, se borra. Nada de la portada vieja se borra:
     sus paginas quedan para elegirlas despues. */
  async primeraDePortada(attrs, sigue) {
    if (this.moviendo) { this.decir(this.tx.moverEspera); return null; }
    let v = this.conPortada() ? this.vivos[0] : null, nueva = false;
    /* Una portada que solo se mira (por un conflicto, por ejemplo) no recibe paginas que no se guardarian */
    if (v && !v.editor.isEditable) { this.decir(this.tx.variasQuietas); return null; }
    const viejas = v ? libresDe(v.editor.state.doc) : [];
    if (!v) {
      const r = await this.be.taller.crearCapitulo(this.obra().id);
      if (r.error) { if (sigue()) this.alFalla(r.error); return null; }
      /* Si el libro se cerro mientras tanto, el capitulo recien creado no se queda vacio en la base */
      if (!sigue()) { await this.be.taller.borrarCapitulo(r.fila.id); return null; }
      v = new CapituloVivo(new Capitulo(r.fila), this);
      this.vivos.unshift(v);
      this.lienzo.insertBefore(v.caja, this.vivos[1] ? this.vivos[1].caja : null);
      nueva = true;
      /* Sin el orden guardado, al volver a abrir quedaria al final: mejor no dejarlo */
      const ordenado = await this.ordenar();
      if (!ordenado || !sigue() || !this.vivos.includes(v)) {
        if (this.vivos.includes(v)) { this.quitarVivo(v); if (sigue()) { await this.ordenar(); this.medir(); } }
        await this.be.taller.borrarCapitulo(v.cap.id);
        return null;
      }
    }
    const e = v.editor, h = this.meterPagina(e, 0, attrs);
    if (!h) return null;
    /* Un capitulo nuevo trae un renglon vacio: despues de la portada seria una hoja en blanco */
    const d = e.state.doc, ultimo = d.lastChild;
    if (nueva && d.childCount > 1 && ultimo.type.name === 'paragraph' && !ultimo.content.size) {
      e.view.dispatch(e.state.tr.delete(d.content.size - ultimo.nodeSize, d.content.size).setMeta('addToHistory', false));
    }
    if (this.alPortada) this.alPortada('si', true);
    this.programar();
    return { h, viejas, vivo: v };
  }

  /* Las paginas de la portada anterior quedan elegidas: el autor decide si las borra */
  elegirNodos(vivo, nodos) {
    const hay = new Set(libresDe(vivo.editor.state.doc));
    const quedan = nodos.filter((n) => hay.has(n));
    if (!quedan.length) return 0;
    this.eleccion = { vivo, nodos: quedan, ancla: quedan[0] };
    this.medir();
    this.panelDeEleccion();
    return quedan.length;
  }

  hojaParaObjeto() { return this.hojaActiva || this.ponerLibre({ nombre: this.tx.paginaLibre, objetos: [] }); }

  insertar(que) {
    if (que === 'libre') { const h = this.ponerLibre({ nombre: this.tx.paginaLibre, objetos: [] }); h.hoja.focus({ preventScroll: true }); return; }
    if (que === 'cuadro') { this.hojaParaObjeto().agregar({ tipo: 'texto', texto: this.tx.escribeAqui, x: 20, y: 40, w: 60, h: 10, rot: 0, tam: '14pt', color: '', fuente: '', alinear: '' }); return; }
    if (que === 'zona') { this.hojaParaObjeto().agregar({ tipo: 'zona', nombre: this.tx.zonaNueva, x: 16, y: 50, w: 68, h: 22, rot: 0, bloques: [] }); return; }
    if (que === 'boton') { this.ponerBoton(); return; }
    if (que === 'pasaje') { this.ponerPasaje(); return; }
    if (que === 'subetapa') { this.ponerSubetapa(); return; }
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

  /* Una subetapa va siempre en el texto de arriba, en su propia linea (y abre hoja). Con un nombre de partida; el
     panel se abre para cambiarlo. */
  ponerSubetapa() {
    const { vivo, pos } = this.puntoDeInsercion(), e = vivo.editor;
    e.view.dispatch(e.state.tr.insert(pos, e.schema.nodes.subetapa.create({ texto: this.tx.subetapaEjemplo })));
    e.view.nodeDOM(pos).click();
    this.programar();
  }

  elegirSubetapa(v) {
    if (this.imagenElegida === v || this.soloMirar(v.dom)) return;
    this.soltarElegidos();
    this.imagenElegida = v;
    this.prop.deSubetapa(v);
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
      return true;
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
      const limpio = limpiarContenido({ doc: unir(a.editor.getJSON(), JSON.parse(fv)), papel: a.papel, ...a.propios() });
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
      /* El contenido iba delante de este capitulo: pasa al que le sigue (o al final), no al comienzo del libro */
      if (this.alIndiceAntes && this.obra().pagina.indice.antesDe === v.cap.id) { const sig = this.vivos[k]; this.alIndiceAntes(sig ? sig.cap.id : AL_FINAL); }
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

  /* Una portada que se reconocio sola queda fija antes de cambiarla: con nombre o con un titulo unido ya no se
     reconoceria, y dejaria de ser portada sin que nadie lo pidiera */
  fijarPortada(v) {
    if (this.esPortada(v) && new ConfigPagina(this.obra().pagina).portada === 'auto') this.alPortada('si', true);
  }

  renombrarCapitulo(v, titulo) {
    this.fijarPortada(v);
    v.tituloPropio = tituloLimpio(titulo);
    v.cap.titulo = v.tituloPropio || tituloDe(v.editor.getJSON());
    v.guardado.marcar();
    this.medir();
    this.decir(this.tx.capituloRenombrado);
  }

  /* «Sin número»: un prologo o un epilogo no cuenta; los demas se corren */
  alternarNumero(v) {
    v.numerar = !v.numerar;
    v.guardado.marcar();
    this.medir();
    this.decir(v.numerar ? this.tx.conNumeroDicho : this.tx.sinNumeroDicho);
  }

  /* El papel del capitulo (prefacio, introduccion…): no cuenta en la numeracion. `rol` '' lo quita; 'custom' lleva su texto. */
  ponerRol(v, rol, rolTexto = '') {
    v.ponerPropios({ ...v.propios(), rol, rolTexto });
    v.guardado.marcar();
    this.medir();
    this.decir(v.rol ? this.tx.rolPuesto : this.tx.rolQuitado);
  }

  /* La palabra propia del capitulo («Etapa»): con ella se rotula y cuenta aparte. Vacia = la del libro. */
  ponerPalabra(v, palabra) {
    v.palabra = palabraLimpia(palabra);
    v.guardado.marcar();
    this.medir();
    const verRotulo = new ConfigPagina(this.obra().pagina).rotulo.ver;
    this.decir(!v.palabra ? this.tx.palabraQuitada : verRotulo ? this.tx.palabraPuesta : this.tx.palabraSinRotulos);
  }

  /* La lista de papeles, en el mismo menu: los de siempre, «Otro…» (escribe el suyo) y «Quitar papel» */
  menuDeRoles(v, x, y, origen) {
    const tx = this.tx, quieto = !v.editor.isEditable;
    const items = [
      ...ROLES.map((r) => ({ texto: tx.roles[r], icono: v.rol === r ? 'ok' : undefined, radio: true, marcado: v.rol === r, apagado: quieto, fn: () => this.ponerRol(v, r) })),
      { texto: tx.rolOtro, icono: v.rol === 'custom' ? 'ok' : undefined, radio: true, marcado: v.rol === 'custom', queda: true, apagado: quieto, fn: () => this.menu.pedirTexto({ etiqueta: tx.rolOtroEtiqueta, valor: v.rolTexto, ayuda: tx.rolOtroAyuda, max: PALABRA_MAX, alListo: (t) => { if (palabraLimpia(t)) this.ponerRol(v, 'custom', t); } }) },
      { raya: true },
      { texto: tx.rolQuitar, apagado: quieto || !v.rol, fn: () => this.ponerRol(v, '') }
    ];
    this.menu.abrir(x, y, items, origen, () => this.minis.entrarAlCapitulo(v));
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
    const portada = this.conPortada();
    const items = [
      { texto: tx.cambiarNombre, queda: true, apagado: quieto, fn: () => this.menu.pedirTexto({ etiqueta: tx.nombreCapitulo, valor: v.tituloPropio, ayuda: tx.nombreCapituloAyuda, alListo: (t) => this.renombrarCapitulo(v, t) }) },
      /* La portada nunca sale en el contenido: ahi no hay nada que mostrar u ocultar */
      ...(k === 0 && portada ? [] : [{ texto: v.enIndice ? tx.ocultarDelContenido : tx.mostrarEnContenido, apagado: quieto, fn: () => this.alternarEnIndice(v) }]),
      ...(k === 0 && portada ? [] : [{ texto: v.numerar ? tx.sinNumero : tx.conNumero, apagado: quieto, fn: () => this.alternarNumero(v) }]),
      /* El papel y la palabra no tienen sentido en la portada: no lleva numero */
      ...(k === 0 && portada ? [] : [
        { texto: v.rol ? `${tx.rolDelCapitulo}: ${v.rol === 'custom' ? v.rolTexto : tx.roles[v.rol]}…` : `${tx.rolDelCapitulo}…`, queda: true, apagado: quieto, fn: () => this.menuDeRoles(v, con ? e.clientX : r.left + 16, con ? e.clientY : r.top + 16, origen) },
        { texto: v.palabra ? `${tx.palabraPropia}: ${v.palabra}…` : `${tx.palabraPropia}…`, queda: true, apagado: quieto || !!v.rol, ayuda: v.rol ? tx.palabraConRol : '', fn: () => this.menu.pedirTexto({ etiqueta: tx.palabraEtiqueta, valor: v.palabra, ayuda: tx.palabraAyuda, max: PALABRA_MAX, alListo: (t) => this.ponerPalabra(v, t) }) }
      ]),
      ...(k === 0 ? [{ texto: portada ? tx.noEsPortada : tx.esPortada, apagado: quieto, fn: () => this.alPortada(portada ? 'no' : 'si') }] : []),
      ...(k === 0 ? [{ texto: portada ? tx.cambiarPortadaPdf : tx.subirPortadaPdf, apagado: quieto, fn: () => this.alPedirPortada() }] : []),
      ...(k > 0 ? [{ raya: true }, this.opcionUnir(v, quieto)] : [])
    ];
    this.menu.abrir(con ? e.clientX : r.left + 16, con ? e.clientY : r.top + 16, items, origen, () => this.minis.entrarAlCapitulo(v));
  }

  /* «Unir con el anterior». Si el anterior es la portada, el aviso dice que esas paginas dejan el contenido. */
  opcionUnir(v, quieto) {
    const tx = this.tx, conPortada = this.vivos.indexOf(v) === 1 && this.conPortada();
    return { texto: tx.unirConAnterior, apagado: quieto, confirmar: conPortada ? tx.unirConPortadaSeguro : tx.unirSeguro, fn: () => { if (conPortada) this.fijarPortada(this.vivos[0]); this.unirConAnterior(v); } };
  }

  /* Lo de capitulos en el menu de una pagina: aqui empieza uno, o unir con el de antes si ya es la primera. Se
     mira solo el bloque y si lo que sigue trae un titulo: abrir un menu no copia el capitulo entero. */
  accionesDeCapitulo(i) {
    const tx = this.tx, p = this.paginas[i], v = p.vivo, quieto = !v.editor.isEditable;
    const indice = this.opcionIndiceDespues(i);
    if (this.paginas.findIndex((q) => q.vivo === v) === i) {
      return [...(this.vivos.indexOf(v) > 0 ? [{ ...this.opcionUnir(v, quieto), icono: 'subir' }] : []), ...indice];
    }
    const punto = this.puntoDeCorte(i);
    if (!punto) return indice;
    let conTitulo = false;
    v.editor.state.doc.forEach((n, _, k) => { if (k >= punto.indice && n.type.name === 'heading') conTitulo = true; });
    /* Una cola sin titulo (una portada en PDF) necesita nombre: se pregunta antes de partir */
    return [{ texto: tx.empiezaAqui, icono: 'hoja', apagado: quieto, queda: !conTitulo, fn: () => (conTitulo
      ? this.empezarCapituloAqui(punto)
      : this.menu.pedirTexto({ etiqueta: tx.comoSeLlama, valor: '', ayuda: tx.nombreCapituloAyuda, alListo: (t) => this.empezarCapituloAqui(punto, t) })) }, ...indice];
  }

  /* «Poner el contenido después de esta hoja». El contenido vive entre capitulos: si la hoja es la ultima de su
     capitulo, va delante del siguiente (o al final del libro); si no, el capitulo se parte justo despues de ella y
     la cola, sin nombre y fuera del contenido, es la que viene detras. Nada se pierde: es el mismo partir de
     «Este capítulo empieza aquí». */
  opcionIndiceDespues(i) {
    const tx = this.tx, p = this.paginas[i], sig = this.paginas[i + 1];
    if (!p || p.indice || !p.vivo || !this.alIndiceAntes) return [];
    if (sig && sig.indice) return [{ texto: tx.indiceYaAhi, icono: 'lista', apagado: true, fn: () => {} }];
    if (sig && sig.vivo === p.vivo) {
      const punto = this.puntoDeCorte(i + 1);
      if (!punto) return [];
      return [{ texto: tx.indiceDespues, icono: 'lista', apagado: !this.editable || !p.vivo.editor.isEditable, confirmar: tx.indiceDespuesParte, fn: () => this.indiceDespuesPartiendo(punto) }];
    }
    const destino = sig && sig.vivo ? sig.vivo.cap.id : AL_FINAL;
    return [{ texto: tx.indiceDespues, icono: 'lista', apagado: !this.editable || !p.vivo.editor.isEditable, fn: () => { this.alIndiceAntes(destino); this.decir(tx.indiceDespuesDicho); } }];
  }

  async indiceDespuesPartiendo(punto) {
    const v = punto.vivo, k = this.vivos.indexOf(v);
    if (k < 0) return;
    /* Si no se partio de verdad (no guardo, algo cambio, quedo repetido), el contenido se queda donde estaba */
    if (!(await this.empezarCapituloAqui(punto, ''))) return;
    const nuevo = this.vivos[this.vivos.indexOf(v) + 1];
    if (!nuevo) return;
    if (nuevo.enIndice) this.alternarEnIndice(nuevo);
    this.alIndiceAntes(nuevo.cap.id);
    this.decir(this.tx.indiceDespuesDicho);
  }

  /* ---- Cambiar el PDF de unas paginas ---- */
  /* El menu pide un PDF nuevo para el grupo `g` (el selector de archivos lo abre Taller). Se recuerda cual por su PDF, no por
     sus hojas: mientras el archivo sube, las hojas pueden moverse o tocarse. */
  pedirCambioPdf(g) {
    const tx = this.tx;
    if (!this.alPedirCambioPdf) return;
    if (this.moviendo) { this.decir(tx.moverEspera); return; }
    if (this.hayQuietas(g)) { this.decir(tx.variasQuietas); return; }
    this.cambioPedido = { pdf: g.pdf, sobra: g.sobra };
    this.alPedirCambioPdf();
  }

  hayQuietas(g) { return g.paginas.some((q) => { const v = this.paginas[q.i] && this.paginas[q.i].vivo; return !v || !v.editor.isEditable; }); }
  grupoPedido(pedido) { return pedido ? this.gruposDePdf().find((g) => g.pdf === pedido.pdf && g.sobra === pedido.sobra) || null : null; }

  /* Ya con el PDF nuevo leido y subido (`nuevas`: sus paginas, en orden): se hace una copia de todo el libro y se cambian,
     de una vez, las paginas del PDF viejo. Cada pagina conserva lo suyo: su nombre en el contenido y su ancla, sus objetos
     y botones, su color, su ajuste y su descripcion. Solo cambian el dibujo, el texto que se saco de el, la caja y la medida.
     - Si el PDF nuevo tiene mas paginas, van despues de la ultima del grupo.
     - Si tiene menos, las que sobran se quedan marcadas: nunca se borra nada solo.
     - Los archivos viejos no se borran: «deshacer» y las copias los necesitan.
     - `alAjustar`: si el autor eligio ajustar el libro a la proporcion del PDF, el tamaño se cambia aqui, ya con todo subido y
       con la copia hecha, y no antes: si algo falla o se cancela, el libro queda con su tamaño.
     Devuelve true si cambio algo. `r`: lo que dijo la subida ({ paginas, preguntado, ajuste }). */
  async cambiarPdf(pedido, nuevas, r, alAjustar = null) {
    const tx = this.tx;
    if (this.moviendo) { this.decir(tx.moverEspera); return false; }
    this.moviendo = true;
    try {
      let g = this.grupoPedido(pedido);
      if (!g) { this.decir(tx.cambioSinGrupo); return false; }
      if (nuevas.length !== r.paginas || !nuevas.length) { this.decir(tx.cambioFalla); return false; }
      if (this.hayQuietas(g)) { this.decir(tx.variasQuietas); return false; }
      this.confirmarEdicion();
      /* Lo ultimo escrito, a salvo antes de la copia */
      const vivos = [...g.claves];
      for (const v of vivos) {
        v.guardado.marcar();
        if (!(await v.guardado.vaciar())) { if (this.vivos.includes(v)) this.alFalla('noGuardado'); return false; }
      }
      if (this.alCopiaSegura && !(await this.alCopiaSegura())) return false;
      /* De aqui hasta cambiarlo todo no hay esperas: lo que se escribio mientras tanto se vuelve a mirar */
      g = this.grupoPedido(pedido);
      if (!g || this.hayQuietas(g)) { this.decir(g ? tx.variasQuietas : tx.cambioSinGrupo); return false; }
      const plan = planCambio(g.paginas.map((q) => ({ pagina: q.pagina, total: q.total })), nuevas.length);
      if (!plan.asignar.length) { this.decir(tx.cambioSinPaginas); return false; }
      const cambios = (d) => ({ nombre: d.nombre, fondo: d.fondo, pdf: d.pdf, pdfPagina: d.pdfPagina, pdfTotal: d.pdfTotal, anchoMm: d.anchoMm, altoMm: d.altoMm, texto: d.texto, caja: d.caja, sangre: d.sangre, sobra: false, ...(r.preguntado ? { ajuste: r.ajuste } : {}) });
      const nodoDe = (q) => this.paginas[q.i].vista.node;
      /* Primero se busca cada pagina por su nodo en su capitulo; si alguna no esta, no se toca ninguna */
      const trabajo = new Map();
      const de = (v) => { if (!trabajo.has(v)) trabajo.set(v, []); return trabajo.get(v); };
      for (const { i, n } of plan.asignar) de(this.paginas[g.paginas[i].i].vivo).push({ nodo: nodoDe(g.paginas[i]), attrs: cambios(nuevas[n - 1]) });
      for (const i of plan.sobran) de(this.paginas[g.paginas[i].i].vivo).push({ nodo: nodoDe(g.paginas[i]), attrs: { sobra: true } });
      const ultima = g.paginas[g.paginas.length - 1], vivoFinal = this.paginas[ultima.i].vivo, nodoFinal = nodoDe(ultima);
      const ajusteNuevas = r.preguntado ? r.ajuste : nodoFinal.attrs.ajuste;
      const listos = [];
      for (const [v, lista] of trabajo) {
        const e = v.editor, pos = posicionesDe(e.state.doc, lista.map((x) => x.nodo));
        if (pos.length !== lista.length) { this.decir(tx.cambioSinGrupo); return false; }
        listos.push({ v, e, pos, lista });
      }
      let finalPos = -1;
      if (plan.nuevas.length) {
        const f = posicionesDe(vivoFinal.editor.state.doc, [nodoFinal])[0];
        if (!f) { this.decir(tx.cambioSinGrupo); return false; }
        finalPos = f.pos + f.nodo.nodeSize;
      }
      const paginasNuevas = (e) => plan.nuevas.map((n) => e.schema.nodes.paginaLibre.create({ ...nuevas[n - 1], ajuste: ajusteNuevas }));
      for (const { v, e, pos, lista } of listos) {
        const tr = e.state.tr;
        for (const { pos: lugar, nodo } of pos) {
          const x = lista.find((y) => y.nodo === nodo);
          tr.setNodeMarkup(lugar, null, { ...nodo.attrs, ...x.attrs });
        }
        if (v === vivoFinal && plan.nuevas.length) tr.insert(finalPos, paginasNuevas(e));
        e.view.dispatch(closeHistory(tr.setMeta(META_PAGINA, true)));
      }
      if (plan.nuevas.length && !trabajo.has(vivoFinal)) {
        const e = vivoFinal.editor;
        e.view.dispatch(closeHistory(e.state.tr.insert(finalPos, paginasNuevas(e)).setMeta(META_PAGINA, true)));
      }
      if (alAjustar) alAjustar();
      this.soltarElegidos();
      this.soltarEleccion();
      this.medir();
      const n = plan.asignar.length;
      this.decir([
        n === 1 ? tx.pdfCambiadoUna : tx.pdfCambiado.replace('{n}', String(n)),
        plan.nuevas.length ? (plan.nuevas.length === 1 ? tx.pdfCambiadoNuevaUna : tx.pdfCambiadoNuevas.replace('{n}', String(plan.nuevas.length))) : '',
        plan.sobran.length ? (plan.sobran.length === 1 ? tx.pdfCambiadoSobraUna : tx.pdfCambiadoSobran.replace('{n}', String(plan.sobran.length))) : '',
        /* Una transaccion por capitulo: Ctrl+Z deshace de a uno, y es mejor saberlo antes de apretarlo */
        g.claves.size > 1 ? tx.pdfCambiadoVarios.replace('{n}', String(g.claves.size)) : ''
      ].filter(Boolean).join(' '));
      return true;
    } finally { this.moviendo = false; }
  }

  /* ---- Marcar un tramo de hojas como introduccion, conclusion… ---- */
  /* La lista de papeles para las hojas elegidas (la misma del capitulo, pero esta parte el capitulo si hace falta) */
  menuDeRolesRango(x, y, origen) {
    const tx = this.tx, v = this.eleccion.vivo, quieto = !v || !v.editor.isEditable;
    /* El foco vuelve a la hoja donde estaba la eleccion: se anota ahora, porque al cerrarse el menu la eleccion ya se solto */
    const primera = this.primeraElegida();
    const items = [
      ...ROLES.map((r) => ({ texto: tx.roles[r], apagado: quieto, fn: () => this.marcarRango(r) })),
      { texto: tx.rolOtro, queda: true, apagado: quieto, fn: () => this.menu.pedirTexto({ etiqueta: tx.rolOtroEtiqueta, valor: '', ayuda: tx.rolOtroAyuda, max: PALABRA_MAX, alListo: (t) => { if (palabraLimpia(t)) this.marcarRango('custom', t); } }) },
      { raya: true },
      { texto: tx.rolQuitarCap, apagado: quieto || !v || !v.rol, fn: () => this.marcarRango('') }
    ];
    this.menu.abrir(x, y, items, origen, () => { if (primera >= 0) this.minis.enfocar(primera + 1); });
  }

  /* Las hojas elegidas pasan a ser, juntas, un capitulo con ese papel. Si ya eran todo el capitulo, solo se le pone el papel.
     Si no, el capitulo se parte en hasta tres: antes / las elegidas / despues. Lo de antes y lo de despues siguen siendo del
     capitulo de siempre (su nombre, su palabra, su papel); lo de despues, si no trae titulo propio, queda fuera del contenido
     (es la continuacion). Las elegidas no llevan nombre: las nombra su papel. Nada se pierde: se guarda todo, se hace una
     copia, se crean y guardan las partes nuevas, se ordenan, y solo entonces se quita lo repetido del capitulo de antes. */
  async marcarRango(rol, rolTexto = '') {
    const tx = this.tx, el = this.eleccionParaCambiar();
    if (!el) return;
    const v = el.vivo, e = v.editor;
    if (!rol) { this.ponerRol(v, ''); return; }
    const doc = e.state.doc, bloques = [];
    for (const { pos } of posicionesDe(doc, el.nodos)) {
      const q = doc.resolve(pos);
      if (q.depth > 0) { this.decir(tx.rangoEnColumnas); return; }
      bloques.push(q.index(0));
    }
    /* Solo un tramo seguido: partir el capitulo entre la primera y la ultima cambiaria tambien las de en medio que no se eligieron */
    const unicos = [...new Set(bloques)];
    if (Math.max(...bloques) - Math.min(...bloques) + 1 !== unicos.length) { this.decir(tx.rangoNoSeguidas); return; }
    const foto = e.getJSON(), partes = partirEnTres(foto, Math.min(...bloques), Math.max(...bloques));
    if (!partes) { this.decir(tx.rangoNoSePudo); return; }
    const { plan } = partes, limpio = rolLimpio(rol, rolTexto);
    if (!limpio.rol) return;
    if (this.esPortada(v) && !plan.antes) { this.decir(tx.portadaSinPapel); return; }
    if (plan.todo) { this.ponerRol(v, limpio.rol, limpio.rolTexto); return; }
    if (this.moviendo) { this.decir(tx.moverEspera); return; }
    this.moviendo = true;
    e.setEditable(false, false);
    const sigue = () => this.vivos.includes(v) && !e.isDestroyed, creados = [];
    /* Un capitulo nuevo con su parte, ya guardado. Si falla, no queda ninguno de los que se alcanzaron a crear. */
    const crearParte = async (docParte, propios) => {
      const r = await this.be.taller.crearCapitulo(this.obra().id, propios.titulo || '');
      if (!sigue()) return null;
      if (r.error) { this.alFalla(r.error); return null; }
      const cap = new Capitulo(r.fila);
      cap.contenido = limpiarContenido({ doc: docParte, papel: v.papel, ...propios }).contenido;
      const nuevo = new CapituloVivo(cap, this);
      nuevo.guardado.marcar();
      creados.push(nuevo);
      if (!(await nuevo.guardado.vaciar()) || !sigue()) { if (sigue()) this.alFalla('noGuardado'); return null; }
      return nuevo;
    };
    const limpiarCreados = async () => {
      for (const c of creados) { this.quitarVivo(c); await this.be.taller.borrarCapitulo(c.cap.id); }
    };
    try {
      this.confirmarEdicion();
      const firma = JSON.stringify(foto);
      v.guardado.marcar();
      if (!(await v.guardado.vaciar())) { if (sigue()) this.alFalla('noGuardado'); return; }
      if (!sigue() || (this.alCopiaSegura && !(await this.alCopiaSegura())) || !sigue()) return;
      const medioPropios = { titulo: '', enIndice: true, numerar: true, rol: limpio.rol, rolTexto: limpio.rolTexto, palabra: '' };
      const conTitulo = !!partes.despues && tieneTitulo(partes.despues);
      const despuesPropios = { titulo: conTitulo ? '' : (v.tituloPropio || v.cap.titulo || ''), enIndice: conTitulo ? v.enIndice : false, numerar: v.numerar, rol: v.rol, rolTexto: v.rolTexto, palabra: v.palabra };
      const medio = plan.antes ? await crearParte(partes.medio, medioPropios) : v;
      if (!medio) { await limpiarCreados(); return; }
      const despues = partes.despues ? await crearParte(partes.despues, despuesPropios) : null;
      if (partes.despues && !despues) { await limpiarCreados(); return; }
      const nuevos = [plan.antes ? medio : null, despues].filter(Boolean);
      this.vivos.splice(this.vivos.indexOf(v) + 1, 0, ...nuevos);
      const despuesDeV = v.caja.nextSibling;
      for (const n of nuevos) this.lienzo.insertBefore(n.caja, despuesDeV);
      const ordenado = await this.ordenar();
      if (!sigue()) return;
      if (!ordenado || JSON.stringify(e.getJSON()) !== firma) { this.medir(); this.decir(tx.capituloRepetido); return; }
      /* Las partes ya estan a salvo: se quita de este capitulo lo que paso a ellas, sin rastro en «deshacer» */
      const desde = posicionDeBloque(e.state.doc, plan.antes ? plan.desde : plan.hasta + 1);
      e.view.dispatch(e.state.tr.delete(desde, e.state.doc.content.size).setMeta(META_PAGINA, true).setMeta('addToHistory', false));
      if (!plan.antes) v.ponerPropios({ ...v.propios(), rol: limpio.rol, rolTexto: limpio.rolTexto });
      this.soltarElegidos();
      this.soltarEleccion();
      v.guardado.marcar();
      const cabeza = await v.guardado.vaciar();
      if (!sigue()) return;
      this.activo = medio;
      this.medir();
      this.irA(medio.primera);
      this.minis.entrarAlCapitulo(medio);
      this.decir(cabeza ? tx.rangoMarcado : tx.rangoMarcadoPendiente);
    } finally {
      if (sigue()) e.setEditable(this.editable && !v.guardado.parado, false);
      this.moviendo = false;
    }
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
    /* La copia no sale en el contenido: dos filas iguales confunden. Se le pone nombre si hace falta. */
    this.meterPagina(e, pos + 1, { ...JSON.parse(JSON.stringify(h.attrs)), titulo: '', ancla: '' });
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
    /* Antes del contenido: al final del capitulo anterior a el, o al comienzo del libro si va primero */
    if (p.indice) {
      const k = this.lugarDelIndice(), previo = this.vivos[k - 1];
      return previo ? { vivo: previo, pos: previo.editor.state.doc.content.size } : { vivo: this.vivos[0], pos: 0 };
    }
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
    /* La portada siempre va primero: ni se mueve, ni nada se pone delante de ella (lo soltado ahi va despues) */
    const portada = this.conPortada() ? this.vivos[0] : null;
    if (v === portada) { this.decir(this.tx.portadaPrimero); return; }
    /* Soltado sobre el contenido: delante del capitulo al que precede */
    let antes = p ? (p.vivo || this.vivos[this.lugarDelIndice()] || null) : null;
    const corrida = antes === portada && portada !== null;
    if (corrida) antes = this.vivos[1] || null;
    if (antes === v) { if (corrida) this.decir(this.tx.portadaPrimero); return; }
    this.vivos = this.vivos.filter((x) => x !== v);
    const i = antes ? this.vivos.indexOf(antes) : this.vivos.length;
    this.vivos.splice(i, 0, v);
    this.lienzo.insertBefore(v.caja, antes ? antes.caja : null);
    this.ordenar();
    this.medir();
    this.decir(corrida ? `${this.tx.capituloMovido} ${this.tx.portadaPrimero}` : this.tx.capituloMovido);
  }

  /* El lugar y el tamaño que un boton tiene ahora en su hoja, en la medida de la pagina libre (porcentajes, letra en pt):
     se mide el boton de la mesa, no se inventa. Cabe en la caja del texto (nunca menos de 20 x 6 mm) y su centro no se mueve. */
  medidaLibre(v) {
    const base = { x: 30, y: 45, w: 40, h: 7, tam: '12pt' };
    const c = new ConfigPagina(this.obra().pagina), p = this.px, m = c.aPorcentajes(), flujo = v.dom.closest('.flujo');
    const caja = v.dom.querySelector('.boton--suelta') || v.dom, ancho = caja.offsetWidth, alto = caja.offsetHeight;
    if (!flujo || !ancho || !alto) return base;
    const z = this.z || 1, f = flujo.getBoundingClientRect(), r = caja.getBoundingClientRect(), anclaY = (v.dom.getBoundingClientRect().top - f.top) / z;
    const paso = p.alto + p.mt + p.mb + p.gap, fila = Math.max(0, Math.floor((anclaY + 0.5) / paso));
    const cx = p.ml + (r.left + r.width / 2 - f.left) / z, cy = p.mt + ((r.top + r.height / 2 - f.top) / z - fila * paso);
    const letra = Math.round(parseFloat(getComputedStyle(caja).fontSize) * 0.75 * 2) / 2;
    const w = Math.min(100 - m.izq - m.der, Math.max((20 / c.anchoMm) * 100, (ancho / p.W) * 100));
    const h = Math.min(100 - m.sup - m.inf, Math.max((6 / c.altoMm) * 100, (alto / p.H) * 100));
    const x = tope((cx / p.W) * 100 - w / 2, m.izq, 100 - m.der - w), y = tope((cy / p.H) * 100 - h / 2, m.sup, 100 - m.inf - h);
    const num = (n) => Math.round(n * 100) / 100;
    return { x: num(x), y: num(y), w: num(w), h: num(h), tam: letra >= 6 && letra <= 72 ? `${letra}pt` : base.tam };
  }

  /* Una imagen del texto pasa a su propia pagina libre, exacta */
  pasarALibre(v) {
    const a = v.node.attrs, e = this.vivos.find((x) => x.editor.view.dom.contains(v.dom)).editor, pos = v.getPos();
    const id = `o-${crypto.getRandomValues(new Uint32Array(1))[0].toString(16).padStart(8, '0')}`;
    /* Un boton lleva todo lo suyo (texto, accion, colores, icono, aspecto) a una pagina libre: ahi se mueve, se gira y se agranda sin ancla */
    const objeto = v.node.type.name === 'boton'
      ? { id, ...datosDeBoton(a), tipo: 'boton', ...this.medidaLibre(v), rot: a.suelto ? a.suelto.rot : 0 }
      : { id, tipo: 'imagen', ruta: a.ruta, x: 18, y: 16, w: 64, h: 40, rot: 0, crop: { l: 0, t: 0, r: 0, b: 0 }, alt: a.alt, decorativa: a.decorativa };
    if (e.state.doc.resolve(pos).depth) { this.decir(this.tx.pasarLibreEnColumnas); return; }
    const n = e.schema.nodes.paginaLibre.create({ nombre: this.tx.paginaLibre, objetos: [objeto] });
    e.view.dispatch(closeHistory(e.state.tr.replaceWith(pos, pos + 1, n)));
    this.imagenElegida = null;
    this.prop.ocultar();
    this.medir();
  }

  /* El boton del texto cambio (arrastrado): el panel muestra lo nuevo */
  alCambiarBoton(v) { if (this.imagenElegida === v) this.prop.deBoton(v); this.revisarSueltos(); }

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
  /* `o.acciones`: un WeakMap donde cada boton de la copia queda con lo que hace (sus datos ya limpios). La copia es
     inerte: el visor encuentra el boton por donde cae el clic. */
  clon(p, esc, o = {}) {
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
    /* Los botones, antes de quitar nada: la hoja y su copia tienen entonces las mismas piezas, en el mismo orden */
    if (o.acciones && !p.indice) this.emparejarBotones(p, p.vista ? p.vista.hoja : p.vivo.caja, d, o.acciones);
    /* Una imagen que aun no llego no tiene direccion: sin esto se veria su texto alternativo (el de toda una pagina de PDF) */
    d.querySelectorAll('img:not([src])').forEach((i) => { i.alt = ''; });
    /* Los sellos de PDF son de la mesa: ni la miniatura ni «Ver como libro» los llevan (y el PDF se arma con los datos) */
    d.querySelectorAll('.marco, .fantasma, .guia, .seg, .sale, .asa, .hoja__falla, .sello-pdf').forEach((n) => n.remove());
    [d, ...d.querySelectorAll('.hoja--cargando')].forEach((n) => n.classList.remove('hoja--cargando'));
    /* La marca de elegida es de la mesa: ni la copia de una hoja ni la de un capitulo entero la llevan */
    [d, ...d.querySelectorAll('.hoja--elegida')].forEach((n) => n.classList.remove('hoja--elegida'));
    const baja = p.vista || p.indice ? 0 : p.fila * (this.px.H + this.px.gap);
    /* Una copia no repite los `id` de la hoja (los titulos son anclas del contenido): dos del mismo nombre en la pagina confunden al navegador y a los lectores de pantalla */
    [d, ...d.querySelectorAll('[id]')].forEach((n) => n.removeAttribute('id'));
    d.classList.add('clon__dentro');
    d.style.transform = `scale(${esc}) translateY(${-baja}px)`;
    d.removeAttribute('tabindex');
    c.inert = true;
    c.append(d);
    return c;
  }

  /* Cada boton de la copia `copia` queda con lo que hace el de la hoja `origen`: sus datos ya limpios (`datosDeBoton`).
     En el texto el boton sabe su nodo; en una pagina libre se busca su objeto por su id. Un boton suelto se mide por su
     pieza de adentro (su marco no tiene alto). */
  emparejarBotones(p, origen, copia, acciones) {
    const SEL = '.obj--boton, .boton-suelto, .boton:not(.boton--suelta):not(.obj)';
    const a = origen.querySelectorAll(SEL), b = copia.querySelectorAll(SEL);
    if (a.length !== b.length) return;
    /* La copia de una hoja de texto es una fila del capitulo: solo cuentan los botones que caen en esa fila */
    let arriba = -Infinity, abajo = Infinity;
    if (p.vivo && !p.vista) {
      const px = this.px;
      arriba = origen.getBoundingClientRect().top + p.fila * (px.H + px.gap) * this.z;
      abajo = arriba + px.H * this.z;
    }
    a.forEach((e, i) => {
      const r = (e.classList.contains('boton-suelto') ? e.querySelector('.boton--suelta') || e : e).getBoundingClientRect(), medio = r.top + r.height / 2;
      if (medio < arriba || medio > abajo) return;
      let datos = null;
      if (e.vistaBoton) datos = datosDeBoton(e.vistaBoton.node.attrs);
      else if (e.dataset.o) {
        for (const h of this.vistas) {
          const obj = h.hoja.contains(e) && h.objetos.find((x) => x.id === e.dataset.o);
          if (obj) { datos = datosDeBoton(obj); break; }
        }
      }
      const visual = b[i].classList.contains('boton-suelto') ? b[i].querySelector('.boton--suelta') : b[i];
      if (datos && visual) acciones.set(visual, datos);
    });
  }
}
