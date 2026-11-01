/* DEVELOPER-MODE → TALLER (components/portal/dev/Taller.astro): donde se escriben los libros.

   La lista de libros vive en el panel. Al abrir uno, la mesa ocupa toda la ventana (Mesa.js): se pasa a
   <body>, porque el marco del panel tiene un filtro y atraparia a lo que quiera cubrir la pantalla.

   Esta clase hace lo que no es de la mesa: abrir y cerrar, la migracion, los conflictos entre pestañas,
   las copias y el PDF. Lo que se guarda pasa por TextoLibro.js y un libro nunca se corta: si no cabe, se
   dice. Si otra pestaña cambio lo mismo, el guardado se detiene y pregunta (Repositorio.decidir).

   El celular es para leer y revisar: lo decide el dedo (`TELEFONO`), no el ancho, porque ampliar la
   pantalla en un computador tambien la hace angosta y ahi se sigue escribiendo. */
import { Seccion } from '../Seccion.js';
import { Obra, Capitulo } from '../../../contenido/taller/Obra.js';
import { colorDeLetra, ConfigPagina, LADO_MAX, LADO_MIN, mmAPx, pxAMm, TAMANOS } from '../../../contenido/taller/ConfigPagina.js';
import { limpiarContenido, llavesDe } from '../../../contenido/taller/TextoLibro.js';
import { aVersion2, necesitaMigrar } from '../../../contenido/taller/Migrar.js';
import { aHoja } from '../../../contenido/taller/hoja.js';
import { IDIOMAS } from '../../../contenido/comun.js';
import { Cinta } from './taller/Cinta.js';
import { Mesa } from './taller/Mesa.js';
import { VistaLibro } from './taller/VistaLibro.js';
import { Imagenes } from './taller/Imagenes.js';
import { Vista } from './taller/Vista.js';
import { cargarFuente } from './taller/Fuentes.js';
import { importarPdf } from './taller/Importar.js';
import { Formulas } from './taller/Formulas.js';
import { bajarLibro, entregar, nombreDeArchivo } from './taller/Descarga.js';
import { SelectorColor } from './taller/SelectorColor.js';
import { RECIENTES_MAX, textosPocoVisibles } from '../../../contenido/taller/colores.js';

const COPIA_MS = 10 * 60 * 1000;
const ARMADO_MS = 5000;
const TELEFONO = '(hover: none) and (pointer: coarse)';
const FALLAS = ['red', 'conflicto', 'permiso', 'lleno'];
const azar = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
const enTelefono = () => window.matchMedia(TELEFONO).matches;
const DICHO_MS = 6000;
const GUARDAR_COLORES_MS = 800;
const REINTENTO_OBRA_MS = 5000;

function recorrer(n, fn) { fn(n); (n.content || []).forEach((h) => recorrer(h, fn)); }
function rutasDe(doc, salida = new Set()) {
  recorrer(doc, (n) => {
    const a = n.attrs || {};
    if (n.type === 'imagen' && a.ruta) salida.add(a.ruta);
    if (n.type === 'paginaLibre') {
      if (a.fondo) salida.add(a.fondo);
      (a.objetos || []).forEach((o) => { if (o.ruta) salida.add(o.ruta); });
    }
  });
  return salida;
}
function sinAlt(doc) {
  let n = 0;
  recorrer(doc, (x) => {
    const a = x.attrs || {};
    if (x.type === 'imagen' && !a.alt && !a.decorativa) n++;
    if (x.type === 'paginaLibre') {
      if (a.fondo && !a.alt && (a.texto || '').length < 20) n++;
      (a.objetos || []).forEach((o) => { if (o.tipo === 'imagen' && !o.alt && !o.decorativa) n++; });
    }
  });
  return n;
}

export class Taller extends Seccion {
  constructor(raiz, ctx) {
    super(raiz.querySelector('[data-taller]'), ctx);
    this.tx = (ctx.p && ctx.p.taller) || {};
    this.pestana = crypto.randomUUID();
    this.obra = null;
    this.mesa = null;
    this.ultimaCopia = 0;
    this.imprimirId = 0;
    this.enFalla = false;
    this.estados = new Map();
    this.conflictos = [];
    this.turnoError = 0;
    this.turnoObra = 0;
    this.sesion = 0;
    if (!this.caja) return;
    const q = (s) => this.caja.querySelector(s);
    this.q = q;
    this.lista = q('[data-tal-obras]');
    this.nodoMesa = q('[data-tal-mesa]');
    this.casaMesa = this.nodoMesa.parentElement;
    const m = (s) => this.nodoMesa.querySelector(s);
    this.m = m;
    this.estado = m('[data-tal-estado]');
    this.anuncio = m('[data-tal-anuncio]');
    this.dicho = m('[data-tal-dicho]');
    this.nodoMesa.addEventListener('keydown', (e) => {
      if (e.key === 'F6' && this.mesa) { e.preventDefault(); this.mesa.saltar(e.shiftKey ? -1 : 1); }
    });
    this.conflicto = m('[data-tal-conflicto]');
    this.avance = m('[data-tal-avance]');
    this.errorEl = m('[data-tal-error]');
    this.imagenes = new Imagenes((r) => ctx.be.taller.bajar(r));
    q('[data-tal-crear]').addEventListener('submit', (e) => { e.preventDefault(); this.crear(e.currentTarget); });
    m('[data-tal-volver]').addEventListener('click', () => this.volver());
    m('[data-tal-titulo]').addEventListener('change', (e) => { this.obra.titulo = e.target.value.trim() || this.obra.titulo; e.target.value = this.obra.titulo; this.guardarObra(); });
    m('[data-tal-deshacer]').addEventListener('click', () => this.historia('undo'));
    m('[data-tal-rehacer]').addEventListener('click', () => this.historia('redo'));
    m('[data-tal-libro]').addEventListener('click', (e) => this.vistaLibro.abrir(e.currentTarget));
    m('[data-tal-imprimir]').addEventListener('click', () => this.sacarPdf());
    m('[data-tal-bajar]').addEventListener('click', () => this.bajar());
    m('[data-tal-version]').addEventListener('click', () => this.guardarVersion());
    m('[data-tal-quedarme]').addEventListener('click', () => this.resolver(true));
    m('[data-tal-traer]').addEventListener('click', () => this.resolver(false));
    this.formulas = new Formulas(m('[data-tal-formula]'), { tx: this.tx, alError: (c) => this.error(c) });
    this.prepararPagina();
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.vaciarTodo(); });
    window.addEventListener('beforeunload', (e) => { if (this.haySinGuardar()) e.preventDefault(); });
  }

  get be() { return this.ctx.be; }

  alEntrar() {
    this.limpiar();
    if (!this.be || !this.be.taller) { this.avisar(this.tx.sinBase); return; }
    if (!this.obra) this.cargarLista();
  }

  /* Lo que se anuncia tambien se lee en el pie: quien no usa lector de pantalla necesita saberlo igual */
  decir(t) {
    this.anuncio.textContent = '';
    this.dicho.textContent = t || '';
    clearTimeout(this.relojDicho);
    this.relojDicho = setTimeout(() => { this.dicho.textContent = ''; }, DICHO_MS);
    clearTimeout(this.relojAnuncio);
    this.relojAnuncio = setTimeout(() => { this.anuncio.textContent = t || ''; }, 30);
  }

  /* El error se queda a la vista en la mesa; en la lista, donde siempre */
  error(clave) {
    const c = clave === 'lleno' ? 'tallerLleno' : clave;
    if (!this.obra) { super.error(c); return; }
    this.errorEl.textContent = '';
    this.errorEl.hidden = false;
    clearTimeout(this.relojTexto);
    this.relojTexto = setTimeout(() => { this.errorEl.textContent = this.ctx.textoDe(c); }, 30);
    clearTimeout(this.relojError);
    /* No se va solo: tras un rato, con lo proximo que se haga. Si se va mientras se mira a otro lado, no se supo */
    const turno = ++this.turnoError;
    this.relojError = setTimeout(() => {
      const quitar = () => { if (turno === this.turnoError) this.errorEl.hidden = true; };
      this.nodoMesa.addEventListener('pointerdown', quitar, { once: true });
      this.nodoMesa.addEventListener('keydown', quitar, { once: true });
    }, 7000);
  }

  /* ---- Las obras ---- */
  async cargarLista(enfocar = '') {
    const r = await this.ctx.aTiempo(this.be.taller.obras());
    if (r.error) { this.error(r.error); return; }
    this.lista.replaceChildren();
    for (const o of r.filas) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tal-obra';
      b.textContent = o.titulo;
      b.addEventListener('click', () => this.abrirObra(o.id));
      li.append(b);
      this.lista.append(li);
      if (o.id === enfocar) b.focus();
    }
    this.q('[data-tal-sin-obras]').hidden = r.filas.length > 0;
  }

  async crear(f) {
    const titulo = f.elements.titulo.value.trim();
    if (!titulo) { this.error('invalido'); return; }
    if (!this.be || !this.be.taller) { this.avisar(this.tx.sinBase); return; }
    const obra = new Obra({ titulo, pagina: new ConfigPagina({}).aDatos() });
    const r = await this.be.taller.crearObra(obra.aDatos());
    if (r.error) { this.error(r.error); return; }
    f.reset();
    await this.abrirObra(r.id);
  }

  /* Un doble clic no abre dos veces: la segunda dejaria editores huerfanos que aun guardan */
  async abrirObra(id) {
    if (this.abriendo) return;
    this.abriendo = true;
    try { await this.abrirYa(id); } finally { this.abriendo = false; }
  }

  async abrirYa(id) {
    this.limpiar();
    const sesion = this.sesion;
    const r = await this.ctx.aTiempo(this.be.taller.abrir(id));
    if (r.error) { this.error(r.error); return; }
    let capitulos = r.capitulos.map((c) => new Capitulo(c));
    if (!capitulos.length) {
      const c = await this.be.taller.crearCapitulo(id, `${this.tx.capitulo} 1`);
      if (c.error) { this.error(c.error); return; }
      capitulos = [new Capitulo(c.fila)];
    }
    /* Lo que venga de la version anterior: una copia, y se convierte */
    let faltaPdf = false;
    if (capitulos.some((c) => necesitaMigrar(c.contenido))) {
      const copia = await this.be.taller.copia(id, 'manual');
      if (copia.error) { this.error(copia.error === 'lleno' ? 'copiaGrande' : 'copiaFallo'); return; }
      capitulos.forEach((c) => { if (necesitaMigrar(c.contenido)) { c.contenido = aVersion2(c, r.piezas); c.pendiente = true; } });
      faltaPdf = capitulos.some((c) => c.pendiente && c.contenido.doc.content.some((n) => n.type === 'paginasPdf'));
    }
    if (sesion !== this.sesion) return;
    this.obra = new Obra(r.obra);
    this.obra.fuentes.forEach(cargarFuente);
    /* A pantalla completa: fuera del panel, que atraparia lo que quiere cubrir la ventana */
    document.body.append(this.nodoMesa);
    this.nodoMesa.hidden = false;
    this.aislar(true);
    this.tituloPanel = document.title;
    document.title = `${this.obra.titulo} · ${this.tx.tituloVentana}`;
    this.m('[data-tal-titulo]').value = this.obra.titulo;
    this.ponerPagina();
    /* Una sola mesa y una sola cinta: escuchan sobre los mismos nodos, y una segunda duplicaria cada accion */
    this.mesa = this.mesaUnica = this.mesaUnica || new Mesa(this.nodoMesa, {
      tx: this.tx, ctx: this.ctx, pestana: this.pestana, imagenes: this.imagenes, editable: !enTelefono(),
      obra: () => this.obra.aDatos(),
      alEstadoGlobal: (v, e) => this.alEstado(v, e),
      alFalla: (c) => this.error(c),
      alDecir: (t) => this.decir(t),
      alImagen: () => this.m('[data-b-imagen-archivo]').click()
    });
    this.mesa.recordarColor = (c) => this.recordarColor(c);
    this.mesa.alActivo = (v) => { if (this.colorCapitulo) this.colorCapitulo.poner(v.papel); };
    this.cinta = this.cinta || new Cinta(this.m('[data-tal-cinta]'), {
      tx: this.tx, fuentes: this.obra.fuentes, editor: () => (this.mesa && this.mesa.activo ? this.mesa.activo.editor : null),
      alError: (c) => this.error(c),
      alImagen: (a) => this.subirImagen(a),
      alPdf: (a) => this.traerPdf(a),
      alNuevaFuente: (n) => this.agregarFuente(n),
      alInsertar: (q) => this.mesa.insertar(q),
      alVolver: () => this.mesa.aLaHoja(),
      alColor: (c) => this.recordarColor(c),
      recientes: () => (this.obra ? this.obra.pagina.colores : []),
      alFormula: () => this.mesa.nuevaFormula()
    });
    this.cinta.ponerFuentes(this.obra.fuentes);
    this.mesa.editable = !enTelefono();
    this.mesa.cinta = this.cinta;
    this.mesa.formulas = this.formulas;
    this.vistaLibro = this.vistaLibro || new VistaLibro(this.m('[data-tal-vista-libro]'), { mesa: this.mesa, tx: this.tx });
    this.vistaLibro.mesa = this.mesa;
    await document.fonts.ready;
    this.mesa.abrir(capitulos);
    this.pintarColores();
    if (faltaPdf) this.error('pdfViejoFalta');
    for (const v of this.mesa.vivos) if (v.cap.pendiente) v.guardado.marcar();
    this.pintarVersiones();
    this.m('[data-tal-titulo]').focus();
  }

  async volver() {
    if (!(await this.vaciarTodo())) { this.error('noGuardado'); return; }
    const id = this.obra.id;
    this.cerrarObra();
    await this.cargarLista(id);
  }

  /* Con la mesa abierta, lo de atras no existe para el teclado ni para un lector de pantalla. MathLive
     cuelga su lista de sugerencias del <body>: esa sigue viva. */
  aislar(si) {
    if (si) {
      this.apartados = [...document.body.children].filter((n) => n !== this.nodoMesa && !n.inert && !n.id.startsWith('mathlive'));
      this.apartados.forEach((n) => { n.inert = true; });
    } else {
      (this.apartados || []).forEach((n) => { n.inert = false; });
      this.apartados = [];
    }
  }

  cerrarObra() {
    this.aislar(false);
    if (this.tituloPanel) { document.title = this.tituloPanel; this.tituloPanel = ''; }
    this.formulas.cerrar(false);
    if (this.vistaLibro) { this.vistaLibro.origen = null; this.vistaLibro.cerrar(); this.vistaLibro.mesa = null; }
    if (this.mesa) { this.mesa.cerrar(); this.mesa = null; }
    if (this.vista) { this.vista.soltar(); this.vista = null; }
    const marco = this.m('[data-tal-marco]'), nuevo = marco.cloneNode(false);
    nuevo.removeAttribute('src');
    marco.replaceWith(nuevo);
    this.imagenes.olvidar();
    for (const r of [this.relojAnuncio, this.relojTexto, this.relojDicho, this.relojError, this.relojColores, this.relojObra]) clearTimeout(r);
    this.obraSucia = false;
    this.colorCapitulo = null;
    if (this.responder) this.responder('no');
    this.m('[data-tal-colores]').replaceChildren();
    this.turnoObra++;
    this.turnoError++;
    this.errorEl.hidden = true;
    this.anuncio.textContent = '';
    this.dicho.textContent = '';
    this.obra = null;
    this.imprimirId = 0;
    this.estados.clear();
    this.conflictos = [];
    this.m('[data-tal-cinta]').inert = false;
    for (const n of [this.avance, this.estado, this.errorEl]) n.textContent = '';
    this.m('[data-tal-versiones]').replaceChildren();
    this.m('[data-tal-titulo]').value = '';
    this.conflicto.hidden = true;
    this.nodoMesa.hidden = true;
    this.casaMesa.append(this.nodoMesa);
  }

  /* ---- Guardar ---- */
  async vaciarTodo() {
    if (!this.mesa) return true;
    this.mesa.confirmarEdicion();
    const r = await Promise.all(this.mesa.vivos.map((v) => v.guardado.vaciar()));
    const libro = this.obraSucia ? await this.guardarObra() : true;
    return libro && r.every(Boolean);
  }

  haySinGuardar() { return !!this.mesa && (this.obraSucia || this.mesa.hayEdicion() || this.mesa.vivos.some((v) => v.guardado.sucio || v.guardado.corriendo)); }

  alEstado(v, e) {
    this.estados.set(v, e);
    const lista = [...this.estados.values()], textos = this.tx.estados || {};
    const peor = FALLAS.find((x) => lista.includes(x)) || (lista.includes('guardando') ? 'guardando' : lista.includes('sucio') ? 'sucio' : 'guardado');
    this.estado.textContent = textos[peor] || '';
    this.estado.dataset.estado = peor;
    if (FALLAS.includes(e)) { this.enFalla = true; this.decir(textos[e]); }
    if (e === 'guardado' && this.enFalla && !FALLAS.some((x) => lista.includes(x))) { this.enFalla = false; this.decir(textos.guardado); }
    if (e === 'sucio' && Date.now() - this.ultimaCopia > COPIA_MS) {
      this.ultimaCopia = Date.now();
      this.be.taller.copia(this.obra.id, 'auto').then((r) => { if (r.error) this.error(r.error === 'lleno' ? 'copiaGrande' : 'copiaFallo'); });
    }
    if (e === 'conflicto') {
      /* Puede estar escribiendo: el foco va al aviso y no a un boton, que un espacio pulsaria */
      /* Lo escrito en un cuadro abierto entra primero al capitulo: con el capitulo bloqueado se perderia */
      this.mesa.confirmarEdicion();
      if (!this.conflictos.includes(v)) this.conflictos.push(v);
      v.editor.setEditable(false, false);
      this.m('[data-tal-cinta]').inert = true;
      this.conflicto.hidden = false;
      this.conflicto.focus();
    }
    if (e === 'lleno') this.error('tallerLleno');
    if (e === 'permiso') this.error('permiso');
  }

  async copiaSegura(motivo) {
    const r = await this.be.taller.copia(this.obra.id, motivo);
    if (!r.error) return true;
    this.error(r.error === 'lleno' ? 'copiaGrande' : 'copiaFallo');
    return false;
  }

  /* Dos pestañas: quien decide es el fundador. La copia guarda lo de la otra pestaña; lo de aqui, si se
     va a descartar, sale en un archivo antes de cambiarlo. Si hay varios capitulos en conflicto se
     resuelven uno por uno: el aviso no se va hasta el ultimo. */
  async resolver(quedarme) {
    if (this.resolviendo) return;
    this.resolviendo = true;
    try { await this.resolverYa(quedarme); } finally { this.resolviendo = false; }
  }

  async resolverYa(quedarme) {
    const v = this.conflictos[0];
    if (!v || !(await this.copiaSegura('conflicto'))) return;
    const r = await this.be.taller.abrir(this.obra.id);
    if (r.error) { this.error(r.error); return; }
    const fila = r.capitulos.find((x) => x.id === v.cap.id);
    if (!fila) { this.error('noExiste'); return; }
    if (!quedarme) this.bajarCapitulo(v);
    v.cap.rev = fila.rev;
    this.conflictos.shift();
    if (!this.conflictos.length) {
      this.conflicto.hidden = true;
      this.m('[data-tal-cinta]').inert = false;
    }
    v.guardado.seguir();
    v.editor.setEditable(!enTelefono(), false);
    this.pintarVersiones();
    if (quedarme) {
      v.guardado.sucio = false;
      v.guardado.marcar();
      await v.guardado.vaciar();
    } else {
      const contenido = necesitaMigrar(fila.contenido) ? aVersion2(fila, r.piezas) : fila.contenido;
      v.cap.contenido = contenido;
      v.cap.titulo = fila.titulo;
      v.papel = limpiarContenido(contenido).contenido.papel || '';
      v.pintarPapel();
      if (v === this.mesa.activo && this.colorCapitulo) this.colorCapitulo.poner(v.papel);
      v.guardado.soltar();
      v.ponerTexto(limpiarContenido(contenido).contenido.doc);
      this.alEstado(v, 'guardado');
      this.mesa.medir();
    }
    if (this.conflictos.length) this.conflicto.focus(); else v.editor.view.dom.focus();
  }

  historia(cmd) {
    const h = this.mesa.hojaActiva, e = h ? h.editor : (this.mesa.activo && this.mesa.activo.editor);
    if (e) e.commands[cmd]();
  }

  /* ---- La pagina del libro ---- */
  prepararPagina() {
    const f = this.m('[data-tal-pagina]');
    const tam = f.elements.tamano;
    TAMANOS.forEach((t) => { const o = document.createElement('option'); o.value = t.id; o.textContent = `${t.nombre} · ${mmAPx(t.anchoMm)} × ${mmAPx(t.altoMm)} px`; tam.append(o); });
    IDIOMAS.forEach((l) => { const o = document.createElement('option'); o.value = l.id; o.textContent = l.nombre; f.elements.idioma.append(o); });
    tam.addEventListener('change', () => {
      const t = TAMANOS.find((x) => x.id === tam.value);
      if (t) { f.elements.anchoMm.value = t.anchoMm; f.elements.altoMm.value = t.altoMm; }
      this.ponerPx();
      this.leerPagina();
    });
    f.addEventListener('change', (e) => {
      if (e.target === tam) return;
      if (e.target.name === 'anchoPx') f.elements.anchoMm.value = pxAMm(Number(e.target.value));
      if (e.target.name === 'altoPx') f.elements.altoMm.value = pxAMm(Number(e.target.value));
      const t = /Px$/.test(e.target.name) && this.formatoDe(Number(f.elements.anchoPx.value), Number(f.elements.altoPx.value));
      if (t) { f.elements.anchoMm.value = t.anchoMm; f.elements.altoMm.value = t.altoMm; }
      this.leerPagina();
    });
    f.elements.imprenta.title = this.tx.imprentaAyuda;
    this.m('[data-tal-proporcion]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-pr]');
      if (b && this.responder) this.responder(b.dataset.pr);
    });
    this.m('[data-tal-proporcion]').addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.responder) { e.preventDefault(); this.responder('no'); } });
    f.addEventListener('submit', (e) => e.preventDefault());
  }

  ponerPagina() {
    const f = this.m('[data-tal-pagina]'), c = this.obra.pagina;
    f.elements.idioma.value = this.obra.idioma;
    f.elements.anchoMm.value = c.anchoMm; f.elements.altoMm.value = c.altoMm;
    for (const m of ['sup', 'inf', 'izq', 'der']) f.elements[m].value = c.margenes[m];
    f.elements.tamanoPt.value = c.cuerpo.tamanoPt; f.elements.interlinea.value = c.cuerpo.interlinea;
    f.elements.numerosVer.checked = c.numeros.ver; f.elements.indice.checked = c.indice; f.elements.imprenta.checked = c.imprenta;
    f.elements.lugar.value = c.numeros.lugar;
    this.ponerPx();
    const fu = f.elements.fuente;
    fu.replaceChildren(...this.obra.fuentes.map((n) => { const o = document.createElement('option'); o.value = n; o.textContent = n; return o; }));
    fu.value = c.cuerpo.fuente;
  }

  formatoDe(ancho, alto) { return TAMANOS.find((x) => mmAPx(x.anchoMm) === ancho && mmAPx(x.altoMm) === alto); }

  /* Los px que pide Figma, al lado de los milimetros: los dos campos dicen lo mismo */
  ponerPx() {
    const f = this.m('[data-tal-pagina]');
    f.elements.anchoPx.value = mmAPx(Number(f.elements.anchoMm.value));
    f.elements.altoPx.value = mmAPx(Number(f.elements.altoMm.value));
    const t = this.formatoDe(Number(f.elements.anchoPx.value), Number(f.elements.altoPx.value));
    f.elements.tamano.value = t ? t.id : '';
  }

  leerPagina() {
    const f = this.m('[data-tal-pagina]'), n = (k) => Number(f.elements[k].value);
    const campos = ['anchoMm', 'altoMm', 'sup', 'inf', 'izq', 'der', 'tamanoPt', 'interlinea'];
    const vacio = campos.find((k) => f.elements[k].value === '');
    if (vacio) { f.elements[vacio].setAttribute('aria-invalid', 'true'); this.error('campoVacio'); return; }
    campos.forEach((k) => f.elements[k].setAttribute('aria-invalid', 'false'));
    /* Fuera de rango no se adivina: una hoja que no cabe no se vuelve A5 en silencio */
    if ([n('anchoMm'), n('altoMm')].some((v) => v < LADO_MIN || v > LADO_MAX)) { this.error('tamanoFuera'); this.ponerPagina(); return; }
    const nueva = new ConfigPagina({
      ...this.obra.pagina.aDatos(), imprenta: f.elements.imprenta.checked,
      anchoMm: n('anchoMm'), altoMm: n('altoMm'),
      margenes: { sup: n('sup'), inf: n('inf'), izq: n('izq'), der: n('der') },
      numeros: { ver: f.elements.numerosVer.checked, lugar: f.elements.lugar.value }, indice: f.elements.indice.checked,
      cuerpo: { fuente: f.elements.fuente.value, tamanoPt: n('tamanoPt'), interlinea: n('interlinea') }
    });
    if (nueva.errores().length) { this.error('margenes'); return; }
    this.obra.pagina = nueva;
    this.obra.idioma = f.elements.idioma.value;
    this.ponerPx();
    this.mesa.vivos.forEach((v) => v.editor.view.dom.setAttribute('lang', this.obra.idioma));
    this.guardarObra();
    this.mesa.repintarHojas();
    if (this.mesa.hojaActiva) this.mesa.alElegir(this.mesa.hojaActiva);
  }

  /* ---- Los colores del libro ---- */
  /* El papel de todo el libro, el del capitulo donde va el cursor, y el color de cada titulo y cada letra */
  pintarColores() {
    const tx = this.tx, p = () => this.obra.pagina, selector = (etiqueta, valor, alCambiar) => {
      const s = new SelectorColor({ tx, etiqueta, valor, recientes: () => p().colores, alCambiar: (c) => { this.recordarColor(c); alCambiar(c); } });
      const l = document.createElement('div');
      l.className = 'tal-colores__uno';
      l.append(Object.assign(document.createElement('span'), { textContent: etiqueta }), s.nodo);
      return [l, s];
    };
    const libro = (cambiar) => (c) => { cambiar(c); this.guardarObra(); this.mesa.repintarHojas(); };
    const [cap, sCap] = selector(tx.colorCapitulo, this.mesa.activo ? this.mesa.activo.papel : '', (c) => this.ponerPapelCapitulo(c));
    this.colorCapitulo = sCap;
    const filas = [
      selector(tx.colorLibro, p().papel, libro((c) => { p().papel = c; }))[0], cap,
      ...[1, 2, 3].map((n) => selector(tx.niveles[`t${n}`], p().titulos[`t${n}`], libro((c) => { p().titulos[`t${n}`] = c; }))[0]),
      ...this.obra.fuentes.map((f) => selector(f, colorDeLetra(p(), f), libro((c) => { if (c) p().letras[f] = c; else delete p().letras[f]; }))[0])
    ];
    this.m('[data-tal-colores]').replaceChildren(...filas);
  }

  ponerPapelCapitulo(c) {
    const v = this.mesa.activo;
    if (!v || !v.editor.isEditable) return;
    v.papel = c;
    v.pintarPapel();
    v.guardado.marcar();
    this.mesa.medir();
  }

  /* Los ultimos colores usados viajan con el libro. Se guardan juntos: escoger seguido no gasta una escritura por color. */
  recordarColor(c) {
    if (!c) return;
    const p = this.obra.pagina;
    p.colores = [c, ...p.colores.filter((x) => x !== c)].slice(0, RECIENTES_MAX);
    clearTimeout(this.relojColores);
    this.relojColores = setTimeout(() => { if (this.obra) this.guardarObra(); }, GUARDAR_COLORES_MS);
  }

  agregarFuente(nombre) {
    if (!this.obra.fuentes.includes(nombre)) this.obra.fuentes.push(nombre);
    this.cinta.ponerFuentes(this.obra.fuentes);
    this.ponerPagina();
    this.pintarColores();
    this.guardarObra();
  }

  /* `obra` se toma al comenzar: la respuesta puede llegar con el libro ya cerrado u otro abierto. Si falla la
     red se reintenta solo: un color no puede desaparecer al reabrir. */
  async guardarObra() {
    const obra = this.obra;
    if (!obra) return false;
    clearTimeout(this.relojObra);
    let r = await this.be.taller.guardarObra(obra.aDatos(), this.pestana);
    if (r.reintentar) { obra.rev = r.rev; r = await this.be.taller.guardarObra(obra.aDatos(), this.pestana); }
    if (r.ok) {
      obra.rev = r.rev;
      if (obra === this.obra) this.obraSucia = false;
      return true;
    }
    if (obra !== this.obra) return false;
    if (r.error === 'red') {
      this.obraSucia = true;
      this.relojObra = setTimeout(() => this.guardarObra(), REINTENTO_OBRA_MS);
    }
    if (r.error !== 'conflicto') { this.error(r.error); return false; }
    this.obraSucia = false;
    this.error('conflicto');
    const id = obra.id;
    const a = await this.be.taller.abrir(id);
    if (a.error || !this.obra || this.obra.id !== id) return;
    this.obra = new Obra(a.obra);
    this.m('[data-tal-titulo]').value = this.obra.titulo;
    this.ponerPagina();
    this.cinta.ponerFuentes(this.obra.fuentes);
    this.pintarColores();
    this.mesa.repintarHojas();
    return false;
  }

  /* ---- Lo que entra de fuera ---- */
  async subirImagen(archivo) {
    const ext = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[archivo.type];
    if (!ext) { this.error('archivoTipo'); return; }
    const ruta = `taller/${this.obra.id}/img/${azar()}.${ext}`;
    const r = await this.be.taller.subir(ruta, archivo);
    if (r.error) { this.error(r.error); return; }
    const dir = await this.imagenes.poner(ruta, archivo);
    const img = new Image();
    const turno = this.turnoObra;
    img.onload = () => { if (turno === this.turnoObra) this.mesa.ponerImagen(ruta, img.width / img.height); };
    img.src = dir;
  }

  /* Si el libro se cierra a medio camino, lo que falta no entra en el siguiente */
  async traerPdf(archivo) {
    let anterior = null;
    const turno = this.turnoObra, sigue = () => turno === this.turnoObra;
    await importarPdf(archivo, {
      be: this.be, obra: this.obra.aDatos(), tx: this.tx, imagenes: this.imagenes, sigue,
      alProporcion: (m) => this.preguntarProporcion(m, sigue),
      alPagina: (a) => { anterior = this.mesa.ponerPaginaDePdf(a, anterior); },
      alAviso: (t) => { if (sigue()) this.avance.textContent = t; },
      alDecir: (t) => this.decir(t),
      alError: (c) => this.error(c)
    });
    if (sigue()) this.mesa.medir();
  }

  /* El PDF tiene otra proporcion que el libro: decide el fundador. Ajustar el libro cambia todas sus hojas. */
  async preguntarProporcion(m, sigue) {
    const caja = this.m('[data-tal-proporcion]'), imagenes = this.mesa.imagenesPuestas();
    if (this.responder) this.responder('no');
    this.m('[data-pr-nota]').textContent = imagenes ? this.tx.pdfEstiraImagenes.replace('{n}', String(imagenes)) : '';
    caja.hidden = false;
    /* Puede estar escribiendo: el foco va al aviso y no a un boton, que un espacio pulsaria */
    caja.focus();
    const q = await new Promise((ok) => {
      const r = (x) => { if (this.responder === r) { this.responder = null; caja.hidden = true; } ok(x); };
      this.responder = r;
    });
    if (this.mesa && !this.responder) this.mesa.aLaHoja();
    if (q === 'no' || !sigue()) return null;
    if (q !== 'libro') return { ajuste: q };
    const p = this.obra.pagina, ancho = Math.round((p.altoMm * m.anchoMm * 100) / m.altoMm) / 100;
    const nueva = new ConfigPagina({ ...p.aDatos(), anchoMm: ancho });
    if (ancho < LADO_MIN || ancho > LADO_MAX) { this.error('tamanoFuera'); return null; }
    if (nueva.errores().length) { this.error('margenes'); return null; }
    this.obra.pagina = nueva;
    this.ponerPagina();
    this.guardarObra();
    this.mesa.repintarHojas();
    return { ajuste: 'contener', pagina: nueva.aDatos() };
  }

  /* ---- Sacar el PDF ---- */
  asegurarVista() {
    if (this.vista) return;
    this.vista = new Vista(this.m('[data-tal-marco]'), {
      alPintar: () => { this.avance.textContent = ''; this.vista.imprimir(); },
      alFallar: () => { this.avance.textContent = ''; this.error('vistaFallo'); }
    });
  }

  async sacarPdf() {
    if (!(await this.vaciarTodo())) { this.error('noGuardado'); return; }
    this.mesa.medir();
    this.avance.textContent = this.tx.preparandoPdf;
    const caps = this.mesa.vivos.map((v) => v.cap);
    const rutas = new Set();
    caps.forEach((c) => rutasDe(c.contenido.doc || {}, rutas));
    const { mapa, faltan } = await this.imagenes.todas([...rutas]);
    if (faltan.length) { this.avance.textContent = ''; this.error('imagenFalta'); return; }
    const llaves = [...new Set(caps.flatMap((c) => llavesDe(c.contenido)))];
    const alts = caps.reduce((s, c) => s + sinAlt(c.contenido.doc || {}), 0);
    const tenues = caps.reduce((s, c) => s + textosPocoVisibles(c.contenido, this.obra.pagina.papel), 0);
    const sangran = this.obra.pagina.imprenta && caps.some((c) => (c.contenido.doc.content || []).some((n) => n.type === 'paginaLibre' && n.attrs.sangre));
    const dice = [
      sangran ? this.tx.imprentaSangre : '',
      tenues ? this.tx.colorPocoVisible.replace('{n}', String(tenues)) : '',
      llaves.length ? this.tx.llavesEnPdf.replace('{llaves}', llaves.map((x) => `{${x}}`).join(', ')) : '',
      alts ? this.tx.imagenesSinAlt.replace('{n}', String(alts)) : ''
    ].filter(Boolean).join(' ');
    if (dice) this.decir(dice);
    this.asegurarVista();
    this.vista.pintar(aHoja(this.obra.aDatos(), caps.map((c) => c.aDatos()), { imagenes: mapa, indice: this.mesa.entradasDeIndice() }));
  }

  /* ---- Copias ---- */
  async bajar() {
    const quedo = await this.vaciarTodo();
    const r = await this.be.taller.abrir(this.obra.id);
    if (r.error) { this.error(r.error); return; }
    const faltan = await bajarLibro({ obra: r.obra, capitulos: r.capitulos, piezas: r.piezas, conArchivos: this.m('[data-tal-con-archivos]').checked, bajar: (x) => this.be.taller.bajar(x), rutasDe });
    if (!quedo) this.mesa.vivos.filter((v) => v.guardado.sucio).forEach((v) => this.bajarCapitulo(v));
    if (faltan) this.error('copiaIncompleta');
  }

  async guardarVersion() {
    await this.vaciarTodo();
    if (!(await this.copiaSegura('manual'))) return;
    this.decir(this.tx.versionHecha);
    this.pintarVersiones();
  }

  async pintarVersiones() {
    const r = await this.be.taller.versiones(this.obra.id);
    if (r.error) return;
    const ul = this.m('[data-tal-versiones]');
    ul.replaceChildren(...r.filas.map((v) => {
      const li = document.createElement('li');
      const s = document.createElement('span');
      const nombre = `${this.ctx.fecha(v.creado)} · ${(this.tx.motivos || {})[v.motivo] || v.motivo}`;
      s.textContent = nombre;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tal-btn';
      b.textContent = this.tx.restaurar;
      b.setAttribute('aria-label', `${this.tx.restaurar}: ${nombre}`);
      b.addEventListener('click', () => this.restaurar(v.id, b));
      b.addEventListener('blur', () => this.desarmar(b));
      li.append(s, b);
      return li;
    }));
  }

  desarmar(b) {
    clearTimeout(this.armado);
    if (b.dataset.armado !== '1') return;
    b.dataset.armado = '';
    b.textContent = this.tx.restaurar;
  }

  async restaurar(id, b) {
    if (b.dataset.armado !== '1') {
      b.dataset.armado = '1';
      b.textContent = this.tx.confirmarRestaurar;
      this.decir(this.tx.confirmarRestaurar);
      this.armado = setTimeout(() => this.desarmar(b), ARMADO_MS);
      return;
    }
    const obra = this.obra.id;
    const quedo = await this.vaciarTodo();
    if (!quedo) this.mesa.vivos.filter((v) => v.guardado.sucio).forEach((v) => this.bajarCapitulo(v));
    const parados = this.mesa.vivos.map((v) => [v, v.guardado.parado, v.guardado.sucio]);
    this.mesa.vivos.forEach((v) => { v.guardado.soltar(); v.editor.setEditable(false, false); });
    this.m('[data-tal-cinta]').inert = true;
    const r = await this.be.taller.restaurar(id);
    if (r.error) {
      /* No se pudo: todo queda como estaba, con lo escrito otra vez pendiente de guardar */
      this.m('[data-tal-cinta]').inert = false;
      for (const [v, parado, sucio] of parados) {
        v.editor.setEditable(!enTelefono() && !parado, false);
        if (sucio) { v.guardado.parado = parado; v.guardado.marcar(); }
      }
      this.error(r.error === 'lleno' ? 'copiaGrande' : r.error);
      this.m('[data-tal-cinta]').inert = this.conflictos.length > 0;
      return;
    }
    this.m('[data-tal-cinta]').inert = false;
    this.cerrarObra();
    await this.abrirObra(obra);
    this.decir(this.tx.restaurado);
  }

  /* El panel lo llama antes de cerrar la sesion. El texto se toma antes de esperar: si el guardado tarda
     mas que la salida, el editor ya no estaria. */
  async antesDeSalir() {
    if (!this.mesa) return;
    this.mesa.confirmarEdicion();
    const titulo = this.obra.titulo, fotos = this.mesa.vivos.map((v) => [v, v.doc, v.papel]);
    await this.vaciarTodo();
    for (const [v, doc, papel] of fotos) if (v.guardado.sucio) this.entregarCapitulo(titulo, v.cap, doc, papel);
  }

  bajarCapitulo(v) { this.entregarCapitulo(this.obra.titulo, v.cap, v.doc, v.papel); }

  entregarCapitulo(titulo, c, doc, papel) {
    entregar(JSON.stringify({ formato: 'taller-capitulo', titulo: c.titulo, contenido: { version: 2, ...(papel ? { papel } : {}), doc } }), nombreDeArchivo(`${titulo} ${c.titulo}`));
  }

  /* `sesion` detiene un libro que se estaba abriendo: tras salir, no se pinta */
  olvidar() {
    this.sesion++;
    if (this.obra) this.cerrarObra();
    this.lista.replaceChildren();
  }
}
