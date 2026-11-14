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
import { colorDeLetra, ConfigPagina, IMAGEN_INDICE_ALTOS, LADO_MAX, LADO_MIN, mmAPx, pxAMm, TAMANOS } from '../../../contenido/taller/ConfigPagina.js';
import { limpiarContenido, llavesDe, propiosAGuardar, propiosDe } from '../../../contenido/taller/TextoLibro.js';
import { rutasDelLibro } from '../../../contenido/taller/RutasLibro.js';
import { aVersion2, necesitaMigrar } from '../../../contenido/taller/Migrar.js';
import { aHoja } from '../../../contenido/taller/hoja.js';
import { IDIOMAS } from '../../../contenido/comun.js';
import { Cinta } from './taller/Cinta.js';
import { Mesa } from './taller/Mesa.js';
import { VistaLibro } from './taller/VistaLibro.js';
import { Imagenes } from './taller/Imagenes.js';
import { esSvg, svgAPng } from './taller/SvgAImagen.js';
import { Vista } from './taller/Vista.js';
import { cargarFuente } from './taller/Fuentes.js';
import { importarPdf, subirPdf } from './taller/Importar.js';
import { Formulas } from './taller/Formulas.js';
import { bajarLibro, entregar, nombreDeArchivo } from './taller/Descarga.js';
import { SelectorColor } from './taller/SelectorColor.js';
import { Selector } from './taller/Selector.js';
import { BorrarLibro } from './taller/BorrarLibro.js';
import { Publicar } from './taller/Publicar.js';
import { ratioDeHoja } from '../../../contenido/taller/RevisarPdf.js';
import { icono } from './taller/iconos.js';
import { familiaCss } from '../../../contenido/taller/fuentes.js';
import { RECIENTES_MAX, textosPocoVisibles, variablesDe } from '../../../contenido/taller/colores.js';
import { AL_FINAL, hojasDeIndice } from '../../../contenido/taller/IndiceLibro.js';
import { armar } from '../../../contenido/taller/armar.js';
import { estiloDeLomo } from '../../../contenido/taller/LomoLibro.js';

const COPIA_MS = 10 * 60 * 1000;
const ARMADO_MS = 5000;
const TELEFONO = '(hover: none) and (pointer: coarse)';
const FALLAS = ['red', 'conflicto', 'permiso', 'lleno'];
const azar = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
const enTelefono = () => window.matchMedia(TELEFONO).matches;
const DICHO_MS = 6000;
const GUARDAR_COLORES_MS = 800;
const REINTENTO_OBRA_MS = 5000;
const IMAGENES_MS = 15 * 60 * 1000;
const CAMPOS_CAPITAL = new Set(['capitalEstilo', 'capitalFuente', 'capitalLineas', 'capitalSepara']);
/* Los margenes listos, en mm. «Normal» es el de un libro nuevo: sale de ConfigPagina, no se repite aqui. */
const MARGENES_LISTOS = {
  normal: new ConfigPagina({}).margenes,
  estrecho: { sup: 12, inf: 14, izq: 12, der: 12 },
  amplio: { sup: 25, inf: 28, izq: 25, der: 25 }
};

function recorrer(n, fn) { fn(n); (n.content || []).forEach((h) => recorrer(h, fn)); }
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
    if (import.meta.env.DEV) { window.__imagenesTaller = this.imagenes; window.__taller = this; }
    q('[data-tal-crear]').addEventListener('submit', (e) => { e.preventDefault(); this.crear(e.currentTarget); });
    this.borrador = new BorrarLibro(q('[data-tal-borrar]'), {
      tx: this.tx,
      be: () => this.be,
      textoDe: (c) => this.ctx.textoDe(c),
      copia: (id) => this.copiaDe(id),
      /* El libro ya se borro: aunque la lista no se pueda volver a pedir, el aviso se ve */
      alBorrar: async (aviso) => { try { await this.cargarLista(); } catch (e) { /* la lista vieja se queda */ } finally { this.avisar(aviso); } }
    });
    m('[data-tal-volver]').addEventListener('click', () => this.volver());
    m('[data-tal-titulo]').addEventListener('change', (e) => { this.obra.titulo = e.target.value.trim() || this.obra.titulo; e.target.value = this.obra.titulo; this.guardarObra(); });
    m('[data-tal-deshacer]').addEventListener('click', () => this.historia('undo'));
    m('[data-tal-rehacer]').addEventListener('click', () => this.historia('redo'));
    m('[data-tal-libro]').addEventListener('click', (e) => this.vistaLibro.abrir(e.currentTarget));
    m('[data-tal-imprimir]').addEventListener('click', () => this.sacarPdf());
    m('[data-tal-bajar]').addEventListener('click', () => this.bajar());
    /* Compartir con un enlace privado: sube el PDF que se saco y crea los enlaces (taller/Publicar.js) */
    this.publicar = new Publicar(m('[data-tal-compartir-dialogo]'), {
      tx: this.tx, be: () => this.be, textoDe: (c) => ctx.textoDe(c), fecha: (d) => ctx.fecha(d), lang: ctx.lang,
      contexto: () => this.contextoDeCompartir(), obraId: () => (this.obra ? this.obra.id : '')
    });
    m('[data-tal-compartir]').addEventListener('click', () => this.publicar.abrir());
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
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'tal-accion tal-accion--aviso tal-obra__borrar';
      const nombre = (this.tx.borrarLibro || '').split('{titulo}').join(o.titulo);
      x.setAttribute('aria-label', nombre);
      x.title = nombre;
      x.append(icono('eliminar'));
      /* Mientras ese libro se abre no se borra: la mesa quedaria sobre un libro que ya no existe */
      x.addEventListener('click', () => { if (!this.abriendo && !this.obra) this.borrador.abrir({ id: o.id, titulo: o.titulo }); });
      li.className = 'tal-obra-fila';
      li.append(b, x);
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
    clearTimeout(this.relojImagenes);
    this.limpiar();
    const sesion = this.sesion;
    const r = await this.ctx.aTiempo(this.be.taller.abrir(id));
    if (r.error) { this.error(r.error); return; }
    let capitulos = r.capitulos.map((c) => new Capitulo(c));
    if (!capitulos.length) {
      const c = await this.be.taller.crearCapitulo(id);
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
    this.mesa.alCapital = (cambios) => this.cambiarCapital(cambios);
    /* Antes de partir o unir capitulos, una copia de todo el libro */
    this.mesa.alCopiaSegura = () => this.copiaSegura('auto');
    /* Un capitulo que sale de la mesa (unido, o uno nuevo que no se pudo guardar) no se queda en la barra de estado */
    this.mesa.alQuitarVivo = (v) => { this.estados.delete(v); this.conflictos = this.conflictos.filter((c) => c !== v); };
    this.mesa.capitalDelLibro = () => ({ ...this.obra.pagina.capital, fuentes: this.obra.fuentes });
    /* «Es la portada» / «No es la portada» desde el menu del primer capitulo: es un ajuste del libro */
    this.mesa.alPortada = (valor, callado) => this.ponerPortada(valor, callado);
    this.mesa.alPedirPortada = () => this.cinta.pedirPdf('portada');
    /* «Cambiar el PDF…»: el selector de archivos; lo que pasa despues lo hace `traerPdf` con { cambiar } */
    this.mesa.alPedirCambioPdf = () => this.cinta.pedirPdf('cambiar');
    /* «Poner el contenido después de esta hoja» (menu de una hoja): delante de este capitulo, o al final */
    this.mesa.alIndiceAntes = (id) => this.ponerIndiceAntes(id);
    this.cinta = this.cinta || new Cinta(this.m('[data-tal-cinta]'), {
      tx: this.tx, fuentes: this.obra.fuentes, editor: () => (this.mesa && this.mesa.activo ? this.mesa.activo.editor : null),
      alError: (c) => this.error(c),
      alImagen: (a) => this.subirImagen(a),
      alPdf: (a, o) => this.traerPdf(a, o),
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
    /* El visor lee del libro su lomo y su aviso, y guarda el aviso por el camino de siempre (`guardarObra`) */
    const libro = {
      config: () => (this.obra ? this.obra.pagina : null),
      puedeCambiar: () => !!(this.obra && this.mesa && this.mesa.editable),
      cambiar: (parche) => {
        if (!this.obra || !this.mesa || !this.mesa.editable) return false;
        this.obra.pagina = new ConfigPagina({ ...this.obra.pagina.aDatos(), ...parche });
        this.guardarObra();
        return true;
      }
    };
    this.vistaLibro = this.vistaLibro || new VistaLibro(this.m('[data-tal-vista-libro]'), { mesa: this.mesa, tx: this.tx, titulo: () => (this.obra ? this.obra.titulo : ''), libro, recientes: () => (this.obra ? this.obra.pagina.colores : []), alColor: (c) => this.recordarColor(c) });
    this.vistaLibro.mesa = this.mesa;
    this.mesa.vistaLibro = this.vistaLibro;
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
    if (this.publicar) this.publicar.cerrarYa();
    this.aislar(false);
    if (this.tituloPanel) { document.title = this.tituloPanel; this.tituloPanel = ''; }
    this.formulas.cerrar(false);
    if (this.vistaLibro) { this.vistaLibro.origen = null; this.vistaLibro.cerrar(); this.vistaLibro.mesa = null; }
    if (this.mesa) { this.mesa.cerrar(); this.mesa = null; }
    if (this.vista) { this.vista.soltar(); this.vista = null; }
    const marco = this.m('[data-tal-marco]'), nuevo = marco.cloneNode(false);
    nuevo.removeAttribute('src');
    marco.replaceWith(nuevo);
    /* Las imagenes esperan un rato por si se vuelve, sin depender de un aviso que podria no llegar */
    this.relojImagenes = setTimeout(() => this.imagenes.olvidar(), IMAGENES_MS);
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
      const leido = limpiarContenido(contenido).contenido;
      v.papel = leido.papel || '';
      v.ponerPropios(propiosDe(leido));
      v.pintarPapel();
      if (v === this.mesa.activo && this.colorCapitulo) this.colorCapitulo.poner(v.papel);
      v.guardado.soltar();
      v.ponerTexto(limpiarContenido(contenido).contenido.doc);
      this.alEstado(v, 'guardado');
      this.mesa.medir();
    }
    if (this.conflictos.length) this.conflicto.focus(); else v.editor.view.dom.focus();
  }

  historia(cmd) { this.mesa.historia(cmd); }

  /* ---- La pagina del libro ---- */
  prepararPagina() {
    const f = this.m('[data-tal-pagina]');
    const tam = f.elements.tamano;
    /* Solo el nombre: los px para Figma estan en «Más ajustes», y la lista ya no se corta */
    TAMANOS.forEach((t) => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.nombre; tam.append(o); });
    IDIOMAS.forEach((l) => { const o = document.createElement('option'); o.value = l.id; o.textContent = l.nombre; f.elements.idioma.append(o); });
    for (const k of ['tamano', 'idioma', 'lugar', 'capitalLineas', 'indiceAntes', 'rotuloPalabra', 'rotuloCifras']) new Selector(f.elements[k]);
    this.prepararIndice(f);
    for (const k of ['fuente', 'capitalFuente', 'citaFuente']) new Selector(f.elements[k], { fuenteDe: (v) => (v ? familiaCss(v) : '') });
    const ajustes = this.m('[data-tal-ajustes]');
    tam.addEventListener('change', () => {
      const t = TAMANOS.find((x) => x.id === tam.value);
      if (t) { f.elements.anchoMm.value = t.anchoMm; f.elements.altoMm.value = t.altoMm; }
      this.ponerPx();
      this.leerPagina();
      /* «A mi medida» lleva a donde se escribe la medida */
      if (!t && !ajustes.open) ajustes.showModal();
    });
    this.m('[data-tal-mas-ajustes]').addEventListener('click', () => ajustes.showModal());
    this.m('[data-tal-ajustes-cerrar]').addEventListener('click', () => ajustes.close());
    /* Los margenes listos: un clic los pone, y los campos dicen como quedaron */
    this.m('.tal-margenes').addEventListener('click', (e) => {
      const b = e.target.closest('[data-margenes]');
      if (!b) return;
      const m = MARGENES_LISTOS[b.dataset.margenes];
      for (const k of ['sup', 'inf', 'izq', 'der']) f.elements[k].value = m[k];
      this.leerPagina();
    });
    this.prepararMenusDelTope();
    /* Los campos del libro viven en varios sitios (cinta, flechitas, ajustes, opciones del PDF), todos del mismo
       formulario: el cambio se escucha en la mesa y se lee por un solo camino */
    this.nodoMesa.addEventListener('change', (e) => {
      if (e.target.form !== f || e.target === tam || !e.target.name) return;
      /* La tabla numerada lleva el numero delante: al elegirla se enciende (se puede apagar) */
      if (e.target.name === 'indicePlantilla' && e.target.value === 'tabla') f.elements.indiceOrden.checked = true;
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

  /* Las copias y las opciones del PDF cuelgan del tope: se cierran al tocar fuera, con Escape vuelve el foco */
  prepararMenusDelTope() {
    const menus = () => this.nodoMesa.querySelectorAll('.tal-tope-mas[open]');
    document.addEventListener('pointerdown', (e) => { menus().forEach((d) => { if (!d.contains(e.target)) d.open = false; }); });
    this.m('.tal-tope').addEventListener('keydown', (e) => {
      const d = e.target.closest('.tal-tope-mas[open]');
      if (e.key !== 'Escape' || !d) return;
      e.preventDefault();
      d.open = false;
      d.querySelector('summary').focus();
    });
  }

  /* Desde el panel de la derecha: los mismos campos del libro, y por el mismo camino de siempre */
  cambiarCapital(cambios) {
    const f = this.m('[data-tal-pagina]');
    for (const [k, v] of Object.entries(cambios)) {
      if (!CAMPOS_CAPITAL.has(k)) continue;           // solo los de la capital, nunca otro campo del libro
      const c = f.elements[k];
      if (!c) continue;
      if (c.type === 'checkbox') c.checked = !!v; else c.value = v;
    }
    this.leerPagina();
  }

  ponerPagina() {
    const f = this.m('[data-tal-pagina]'), c = this.obra.pagina;
    f.elements.idioma.value = this.obra.idioma;
    f.elements.anchoMm.value = c.anchoMm; f.elements.altoMm.value = c.altoMm;
    for (const m of ['sup', 'inf', 'izq', 'der']) f.elements[m].value = c.margenes[m];
    f.elements.tamanoPt.value = c.cuerpo.tamanoPt; f.elements.interlinea.value = c.cuerpo.interlinea;
    f.elements.numerosVer.checked = c.numeros.ver; f.elements.imprenta.checked = c.imprenta;
    f.elements.indice.checked = c.indice.ver; f.elements.indiceTitulo.value = c.indice.titulo;
    f.elements.indiceSubtemas.checked = c.indice.subtemas; f.elements.indicePuntos.checked = c.indice.puntos; f.elements.indiceVerRol.checked = c.indice.verRol;
    this.ponerCabeza(c);
    this.ponerLomo(c);
    this.ponerPlantilla(c.indice);
    this.ponerRotulo(c.rotulo);
    this.llenarAntesDe();
    this.m('[data-tal-indice-opciones]').hidden = !c.indice.ver;
    f.elements.lugar.value = c.numeros.lugar;
    this.ponerPx();
    const opcion = (valor, texto) => { const o = document.createElement('option'); o.value = valor; o.textContent = texto; return o; };
    const fu = f.elements.fuente;
    fu.replaceChildren(...this.obra.fuentes.map((n) => opcion(n, n)));
    fu.value = c.cuerpo.fuente;
    /* La capital y las citas: «la del libro» o una de las del libro */
    for (const [k, valor] of [['capitalFuente', c.capital.fuente], ['citaFuente', c.cita.fuente]]) {
      f.elements[k].replaceChildren(opcion('', this.tx.fuenteDelLibro), ...this.obra.fuentes.map((n) => opcion(n, n)));
      f.elements[k].value = this.obra.fuentes.includes(valor) ? valor : '';
    }
    /* 5 renglones ya no se ofrece, pero un libro que lo tenia lo conserva */
    const lineas = f.elements.capitalLineas, cinco = lineas.querySelector('option[value="5"]');
    if (c.capital.lineas === 5 && !cinco) lineas.append(opcion('5', '5'));
    if (c.capital.lineas !== 5 && cinco) cinco.remove();
    lineas.value = String(c.capital.lineas);
    f.elements.capitalEstilo.value = c.capital.estilo;
    this.mostrarLineas(c.capital.estilo);
    f.elements.capitalSepara.value = c.capital.separaMm === 'auto' ? '' : c.capital.separaMm;
    f.elements.citaTamano.value = c.cita.tamanoPct;
    f.elements.citaSangria.value = c.cita.sangriaMm;
    f.elements.citaCursiva.checked = c.cita.cursiva;
  }

  /* Delante de que capitulo va el contenido. Antes del primero es «al comienzo»; con portada, «después de la
     portada» (nunca antes de ella). */
  llenarAntesDe() {
    const f = this.m('[data-tal-pagina]'), s = f.elements.indiceAntes, id = this.obra.pagina.indice.antesDe;
    const vivos = this.mesa ? this.mesa.vivos : [], portada = !!this.mesa && vivos.length > 0 && this.mesa.conPortada();
    const opcion = (valor, texto) => { const o = document.createElement('option'); o.value = valor; o.textContent = texto; return o; };
    /* El mismo nombre que en las miniaturas (con su rotulo, o «Capítulo N» contando como el contenido) */
    const nombres = this.mesa ? this.mesa.nombresDeCapitulos() : [];
    const nombre = (v, k) => (nombres[k] || '').slice(0, 60);
    const desde = portada ? 2 : 1;
    s.replaceChildren(opcion('', portada ? this.tx.despuesDePortada : this.tx.indiceAlComienzo), ...vivos.slice(desde).map((v, i) => opcion(v.cap.id, nombre(v, i + desde))), opcion(AL_FINAL, this.tx.indiceAlFinal));
    s.value = id === AL_FINAL || vivos.slice(desde).some((v) => v.cap.id === id) ? id : '';
    /* Sin capitulos abiertos aun, la lista no sabe nada: leerPagina conserva lo guardado */
    s.dataset.lleno = vivos.length ? '1' : '';
    /* La casilla muestra lo que hoy vale (tambien cuando la reconoce sola); leerPagina solo guarda si se cambio */
    const p = f.elements.portada, vale = this.obra.pagina.portada === 'si' || (this.obra.pagina.portada === 'auto' && portada);
    p.checked = vale;
    p.dataset.mostrado = vale ? '1' : '';
  }

  /* Lo elegido en «Va antes de». Lo guardado se conserva si la lista aun no sabe de capitulos, o si la lista no lo
     muestra (con portada, «antes del segundo» es «después de la portada»: si la portada se quita, vuelve a valer). */
  antesDeElegido(s) {
    const guardado = this.obra.pagina.indice.antesDe;
    if (!s.dataset.lleno) return guardado;
    if (s.value === '' && guardado && ![...s.options].some((o) => o.value === guardado)) return guardado;
    return s.value;
  }

  /* El contenido va delante del capitulo `id` (o al final del libro): se guarda, se enciende si estaba apagado y se mide */
  ponerIndiceAntes(id) {
    const d = this.obra.pagina.aDatos();
    this.obra.pagina = new ConfigPagina({ ...d, indice: { ...(d.indice && typeof d.indice === 'object' ? d.indice : {}), ver: true, antesDe: id } });
    this.guardarObra();
    this.mesa.medir();
    this.llenarAntesDe();
    const f = this.m('[data-tal-pagina]');
    if (f.elements.indice) f.elements.indice.checked = true;
    const opciones = this.m('[data-tal-indice-opciones]');
    if (opciones) opciones.hidden = false;
  }

  /* La portada, desde el menu del capitulo o la casilla: se guarda con el libro y la mesa se vuelve a medir */
  /* `callado`: la fija la mesa sola (al renombrar la portada o unirle un capitulo); no hay nada nuevo que decir */
  ponerPortada(valor, callado = false) {
    this.obra.pagina = new ConfigPagina({ ...this.obra.pagina.aDatos(), portada: valor });
    this.guardarObra();
    if (callado) return;
    this.mesa.medir();
    this.llenarAntesDe();
    this.decir(valor === 'si' ? this.tx.portadaSi : this.tx.portadaNo);
  }

  /* La sencilla tiene un solo alto: el campo de renglones no aplica */
  mostrarLineas(estilo) { this.m('[data-capital-lineas]').hidden = estilo === 'sencilla'; }

  formatoDe(ancho, alto) { return TAMANOS.find((x) => mmAPx(x.anchoMm) === ancho && mmAPx(x.altoMm) === alto); }

  /* Los px que pide Figma, al lado de los milimetros: los dos campos dicen lo mismo */
  ponerPx() {
    const f = this.m('[data-tal-pagina]');
    f.elements.anchoPx.value = mmAPx(Number(f.elements.anchoMm.value));
    f.elements.altoPx.value = mmAPx(Number(f.elements.altoMm.value));
    const t = this.formatoDe(Number(f.elements.anchoPx.value), Number(f.elements.altoPx.value));
    f.elements.tamano.value = t ? t.id : '';
  }

  /* La ventana «Índice»: la lista de «Va antes de» se arma al abrirla (los capitulos cambian de nombre y de orden), y
     cada plantilla se dibuja con el estilo real del libro */
  prepararIndice(f) {
    const d = this.m('[data-tal-indice-dialogo]'), archivo = this.m('[data-tal-indice-archivo]');
    this.m('[data-tal-indice-abrir]').addEventListener('click', () => { this.llenarAntesDe(); this.pintarMuestras(); d.showModal(); });
    this.m('[data-tal-indice-cerrar]').addEventListener('click', () => d.close());
    this.m('[data-tal-indice-imagen]').addEventListener('click', () => archivo.click());
    archivo.addEventListener('change', () => { const a = archivo.files[0]; archivo.value = ''; if (a) this.subirImagenIndice(a); });
    this.m('[data-tal-indice-sin-imagen]').addEventListener('click', () => { f.elements.indiceImagen.value = ''; this.leerPagina(); });
  }

  /* Las seis muestras: las mismas filas en cada plantilla, con la letra, el papel y el numero delante del libro */
  pintarMuestras() {
    const c = this.obra.pagina, f = this.m('[data-tal-pagina]'), tx = this.tx;
    const ejemplo = [
      { nivel: 1, titulo: tx.muestraUno, ancla: 'cap-1', rotulo: c.rotulo.ver ? `${tx.capitulo} 1` : '', orden: '1' },
      { nivel: 2, titulo: tx.muestraSub, ancla: 'cap-2' },
      { nivel: 1, titulo: tx.muestraDos, ancla: 'cap-3', rotulo: c.rotulo.ver ? `${tx.capitulo} 2` : '', orden: '2' }
    ];
    const papel = variablesDe(c.papel);
    for (const m of this.nodoMesa.querySelectorAll('[data-muestra]')) {
      const v = m.dataset.muestra, hoja = document.createElement('div');
      hoja.className = 'libro tal-plantilla__hoja';
      for (const [k, x] of Object.entries(papel)) hoja.style.setProperty(k, x);
      const orden = f.elements.indiceOrden.checked || v === 'tabla';
      const negrita = { n1: f.elements.indiceNegritaCap.checked, n2: f.elements.indiceNegritaSub.checked };
      hoja.append(armar(hojasDeIndice(ejemplo, { 'cap-1': 3, 'cap-2': 5, 'cap-3': 9 }, [3], { titulo: c.indice.titulo || tx.indiceTitulo, puntos: c.indice.puntos, plantilla: v, orden, negrita })[0]));
      m.replaceChildren(hoja);
      /* Una muestra no se toca: sus filas son enlaces de verdad, y no deben recibir el foco ni cambiar la pagina */
      m.inert = true;
    }
  }

  /* La imagen de arriba del contenido: se sube como las del libro y se guarda en el libro */
  async subirImagenIndice(archivo) {
    if (esSvg(archivo)) { archivo = await svgAPng(archivo); if (!archivo) { this.error('svgNoLee'); return; } }
    const ext ={ 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[archivo.type];
    if (!ext) { this.error('archivoTipo'); return; }
    const turno = this.turnoObra, ruta = `taller/${this.obra.id}/img/${azar()}.${ext}`;
    const r = await this.be.taller.subir(ruta, archivo);
    if (turno !== this.turnoObra) return;
    if (r.error) { this.error(r.error); return; }
    await this.imagenes.poner(ruta, archivo);
    if (turno !== this.turnoObra) return;
    this.m('[data-tal-pagina]').elements.indiceImagen.value = ruta;
    this.leerPagina();
    this.decir(this.tx.indiceImagenPuesta);
  }

  /* El rotulo en el menu: la palabra de la lista, u «Otra…» con la suya escrita */
  ponerRotulo(r) {
    const f = this.m('[data-tal-pagina]'), lista = [...f.elements.rotuloPalabra.options].map((o) => o.value);
    f.elements.rotuloVer.checked = r.ver;
    f.elements.rotuloPalabra.value = lista.includes(r.palabra) && r.palabra !== '*' ? r.palabra : '*';
    f.elements.rotuloOtro.value = f.elements.rotuloPalabra.value === '*' ? r.palabra : '';
    f.elements.rotuloCifras.value = r.cifras;
    this.mostrarRotulo();
  }

  ponerPlantilla(ind) {
    const f = this.m('[data-tal-pagina]');
    f.elements.indicePlantilla.value = ind.plantilla;
    f.elements.indiceOrden.checked = ind.orden;
    f.elements.indicePortadas.checked = ind.portadas;
    f.elements.indiceImagen.value = ind.imagen.ruta;
    f.elements.indiceImagenAlto.value = String(IMAGEN_INDICE_ALTOS.reduce((a, b) => (Math.abs(b - ind.imagen.altoPct) < Math.abs(a - ind.imagen.altoPct) ? b : a)));
    f.elements.indiceImagenAjuste.value = ind.imagen.ajuste;
    f.elements.indiceNegritaCap.checked = ind.negrita.n1; f.elements.indiceNegritaSub.checked = ind.negrita.n2;
    this.m('[data-tal-indice-portadas]').hidden = ind.plantilla !== 'tarjetas';
    this.m('[data-tal-indice-sin-imagen]').disabled = !ind.imagen.ruta;
  }

  /* El encabezado: sus casillas y numeros como estan guardados. Mientras se escribe un numero se deja en paz (el campo
     que tiene el foco no se pisa); el aviso dice si el margen de arriba no alcanza. */
  ponerCabeza(c, escribiendo = false) {
    const f = this.m('[data-tal-pagina]'), cb = c.cabeza;
    f.elements.cabezaVer.checked = cb.ver;
    f.elements.cabezaRotulo.checked = cb.partes.rotulo; f.elements.cabezaNombre.checked = cb.partes.nombre;
    f.elements.cabezaRol.checked = cb.partes.rol; f.elements.cabezaSubetapa.checked = cb.partes.subetapa;
    if (!escribiendo || document.activeElement !== f.elements.cabezaDistancia) f.elements.cabezaDistancia.value = cb.distanciaMm;
    if (!escribiendo || document.activeElement !== f.elements.cabezaTamano) f.elements.cabezaTamano.value = cb.tamanoPt;
    this.m('[data-tal-cabeza-opciones]').hidden = !cb.ver;
    this.m('[data-tal-cabeza-aviso]').hidden = !c.cabezaApretada();
  }

  mostrarRotulo() {
    const f = this.m('[data-tal-pagina]');
    this.m('[data-tal-rotulo-opciones]').hidden = !f.elements.rotuloVer.checked;
    this.m('[data-tal-rotulo-otro]').hidden = f.elements.rotuloPalabra.value !== '*';
  }

  leerPagina() {
    const f = this.m('[data-tal-pagina]'), n = (k) => Number(f.elements[k].value);
    this.mostrarLineas(f.elements.capitalEstilo.value);
    /* El espacio de la capital puede quedar vacio: es «automatico» */
    const campos = ['anchoMm', 'altoMm', 'sup', 'inf', 'izq', 'der', 'tamanoPt', 'interlinea', 'citaTamano', 'citaSangria'];
    const vacio = campos.find((k) => f.elements[k].value === '');
    if (vacio) { f.elements[vacio].setAttribute('aria-invalid', 'true'); this.error('campoVacio'); return; }
    campos.forEach((k) => f.elements[k].setAttribute('aria-invalid', 'false'));
    /* Fuera de rango no se adivina: una hoja que no cabe no se vuelve A5 en silencio */
    if ([n('anchoMm'), n('altoMm')].some((v) => v < LADO_MIN || v > LADO_MAX)) { this.error('tamanoFuera'); this.ponerPagina(); return; }
    const nueva = new ConfigPagina({
      ...this.obra.pagina.aDatos(), imprenta: f.elements.imprenta.checked,
      anchoMm: n('anchoMm'), altoMm: n('altoMm'),
      margenes: { sup: n('sup'), inf: n('inf'), izq: n('izq'), der: n('der') },
      numeros: { ver: f.elements.numerosVer.checked, lugar: f.elements.lugar.value },
      /* La casilla de la portada solo manda si se toco: si no, sigue 'auto' (la reconoce sola) */
      portada: f.elements.portada.checked === !!f.elements.portada.dataset.mostrado ? this.obra.pagina.portada : f.elements.portada.checked ? 'si' : 'no',
      rotulo: {
        ver: f.elements.rotuloVer.checked, cifras: f.elements.rotuloCifras.value,
        palabra: f.elements.rotuloPalabra.value === '*' ? f.elements.rotuloOtro.value : f.elements.rotuloPalabra.value
      },
      indice: {
        ver: f.elements.indice.checked, titulo: f.elements.indiceTitulo.value, subtemas: f.elements.indiceSubtemas.checked,
        puntos: f.elements.indicePuntos.checked, verRol: f.elements.indiceVerRol.checked,
        negrita: { n1: f.elements.indiceNegritaCap.checked, n2: f.elements.indiceNegritaSub.checked },
        antesDe: this.antesDeElegido(f.elements.indiceAntes),
        plantilla: f.elements.indicePlantilla.value, orden: f.elements.indiceOrden.checked, portadas: f.elements.indicePortadas.checked,
        /* Solo una imagen de este libro */
        imagen: { ruta: f.elements.indiceImagen.value.startsWith(`taller/${this.obra.id}/img/`) ? f.elements.indiceImagen.value : '', altoPct: n('indiceImagenAlto'), ajuste: f.elements.indiceImagenAjuste.value }
      },
      /* Un campo vacio es «el de siempre»: la configuracion lo vuelve a poner */
      cabeza: {
        ver: f.elements.cabezaVer.checked,
        partes: { rotulo: f.elements.cabezaRotulo.checked, nombre: f.elements.cabezaNombre.checked, rol: f.elements.cabezaRol.checked, subetapa: f.elements.cabezaSubetapa.checked },
        distanciaMm: f.elements.cabezaDistancia.value === '' ? undefined : n('cabezaDistancia'),
        tamanoPt: f.elements.cabezaTamano.value === '' ? undefined : n('cabezaTamano')
      },
      /* El texto y el grueso del lomo vienen de aqui; sus colores, de los selectores (ya estan en `pagina.lomo`) */
      lomo: { ...this.obra.pagina.lomo, texto: f.elements.lomoTexto.value, grosor: f.elements.lomoGrosor.value === '' ? 'auto' : n('lomoGrosor') },
      cuerpo: { fuente: f.elements.fuente.value, tamanoPt: n('tamanoPt'), interlinea: n('interlinea') },
      capital: {
        estilo: f.elements.capitalEstilo.value, fuente: f.elements.capitalFuente.value, lineas: n('capitalLineas'),
        separaMm: f.elements.capitalSepara.value === '' ? 'auto' : n('capitalSepara')
      },
      cita: { fuente: f.elements.citaFuente.value, tamanoPct: n('citaTamano'), sangriaMm: n('citaSangria'), cursiva: f.elements.citaCursiva.checked }
    });
    if (nueva.errores().length) { this.error('margenes'); return; }
    this.obra.pagina = nueva;
    this.obra.idioma = f.elements.idioma.value;
    this.ponerPx();
    /* Lo que se paso del borde se ve como quedo */
    f.elements.capitalSepara.value = nueva.capital.separaMm === 'auto' ? '' : nueva.capital.separaMm;
    this.mostrarLineas(nueva.capital.estilo);
    f.elements.citaTamano.value = nueva.cita.tamanoPct;
    f.elements.citaSangria.value = nueva.cita.sangriaMm;
    f.elements.indiceTitulo.value = nueva.indice.titulo;
    this.m('[data-tal-indice-opciones]').hidden = !nueva.indice.ver;
    this.ponerPlantilla(nueva.indice);
    this.ponerCabeza(nueva, true);
    this.ponerLomo(nueva, true);
    if (this.m('[data-tal-indice-dialogo]').open) this.pintarMuestras();
    /* «Otra…» sin escribir aun: se queda elegida mientras se escribe la palabra */
    if (f.elements.rotuloPalabra.value !== '*') this.ponerRotulo(nueva.rotulo); else { f.elements.rotuloOtro.value = nueva.rotulo.palabra; this.mostrarRotulo(); }
    this.mesa.vivos.forEach((v) => v.editor.view.dom.setAttribute('lang', this.obra.idioma));
    this.guardarObra();
    this.mesa.repintarHojas();
    /* La portada y la lista de «Va antes de» como quedaron */
    this.llenarAntesDe();
    if (this.mesa.hojaActiva) this.mesa.alElegir(this.mesa.hojaActiva);
    /* Si el panel habla de la capital, dice como quedo */
    this.mesa.refrescarCapital();
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
    this.pintarLomo();
  }

  /* EL LOMO: sus cuatro colores (lomo, letra y las dos tapas) son selectores; el texto y el grueso son campos del
     formulario (leerPagina). Cada color se guarda por el camino de siempre y la muestra se dibuja de nuevo. */
  pintarLomo() {
    const tx = this.tx, p = () => this.obra.pagina;
    const cambiar = (parche) => {
      const l = p().lomo;
      this.obra.pagina = new ConfigPagina({ ...p().aDatos(), lomo: { ...l, ...parche, tapas: { ...l.tapas, ...(parche.tapas || {}) } } });
      this.guardarObra();
      this.pintarMuestraLomo();
    };
    const fila = (etiqueta, valor, alCambiar) => {
      const s = new SelectorColor({ tx, etiqueta, valor, recientes: () => p().colores, alCambiar: (c) => { this.recordarColor(c); alCambiar(c); } });
      const l = document.createElement('div');
      l.className = 'tal-colores__uno';
      l.append(Object.assign(document.createElement('span'), { textContent: etiqueta }), s.nodo);
      return l;
    };
    const lomo = p().lomo;
    this.m('[data-tal-lomo-colores]').replaceChildren(
      fila(tx.lomoColor, lomo.color, (c) => cambiar({ color: c })),
      fila(tx.lomoTinta, lomo.tinta, (c) => cambiar({ tinta: c })),
      fila(tx.lomoTapaDelante, lomo.tapas.delante, (c) => cambiar({ tapas: { delante: c } })),
      fila(tx.lomoTapaDetras, lomo.tapas.detras, (c) => cambiar({ tapas: { detras: c } }))
    );
    this.pintarMuestraLomo();
  }

  /* El texto y el grueso como estan guardados (el campo que tiene el foco no se pisa), y la muestra del lomo */
  ponerLomo(c, escribiendo = false) {
    const f = this.m('[data-tal-pagina]');
    if (!escribiendo || document.activeElement !== f.elements.lomoTexto) f.elements.lomoTexto.value = c.lomo.texto;
    if (!escribiendo || document.activeElement !== f.elements.lomoGrosor) f.elements.lomoGrosor.value = c.lomo.grosor === 'auto' ? '' : c.lomo.grosor;
    f.elements.lomoTexto.placeholder = this.obra && this.obra.titulo ? this.obra.titulo : this.tx.lomoTextoAuto;
    this.pintarMuestraLomo();
  }

  /* El lomo en pequeño, con lo elegido: el color, la letra, el grueso y las tapas a los lados */
  pintarMuestraLomo() {
    const m = this.m('[data-tal-lomo-muestra]');
    if (!m || !this.obra) return;
    const c = this.obra.pagina, e = estiloDeLomo(c.lomo, this.obra.titulo, {});
    const poner = (k, v) => { if (v) m.style.setProperty(k, v); else m.style.removeProperty(k); };
    poner('--lomo-color', e.color); poner('--lomo-tinta', e.tinta);
    poner('--tapa-delante', e.delante); poner('--tapa-detras', e.detras);
    poner('--lomo-w', c.lomo.grosor === 'auto' ? '' : `${Math.round(14 + c.lomo.grosor * 1.6)}px`);
    m.querySelector('span').textContent = e.texto;
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
    /* Un SVG no se guarda como SVG (puede traer codigo): sube como PNG, dibujado nitido */
    if (esSvg(archivo)) { archivo = await svgAPng(archivo); if (!archivo) { this.error('svgNoLee'); return; } }
    const ext ={ 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[archivo.type];
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
  /* `portada`: el PDF es la portada del libro y va siempre al comienzo, se mire la pagina que se mire */
  async traerPdf(archivo, { portada = false, cambiar = false } = {}) {
    /* Uno a la vez: dos portadas a la vez crearian dos capitulos */
    if (this.importando) { this.decir(this.tx.pdfEspera); return; }
    this.importando = true;
    try { await (cambiar ? this.cambiarPdfYa(archivo) : this.traerPdfYa(archivo, portada)); } finally { this.importando = false; }
  }

  /* CAMBIAR EL PDF de unas paginas que ya estan: primero se lee y se sube todo (si algo falla, ninguna pagina del libro se
     toco); recien despues la mesa las cambia en su lugar, con una copia de seguridad antes. */
  async cambiarPdfYa(archivo) {
    const mesa = this.mesa, pedido = mesa.cambioPedido, tx = this.tx;
    mesa.cambioPedido = null;
    const g = pedido && mesa.grupoPedido(pedido);
    if (!g) { this.decir(tx.cambioSinGrupo); return; }
    if (mesa.hayQuietas(g)) { this.decir(tx.variasQuietas); return; }
    if (mesa.moviendo) { this.decir(tx.moverEspera); return; }
    const turno = this.turnoObra, sigue = () => turno === this.turnoObra, nuevas = [];
    this.decir(tx.cambiandoPdf);
    const r = await subirPdf(archivo, {
      be: this.be, obra: this.obra.aDatos(), tx, imagenes: this.imagenes, sigue,
      /* El tamaño del libro no cambia hasta que la mesa cambie las hojas (y ya haya copia): si algo falla, queda como estaba */
      alProporcion: (m) => this.preguntarProporcion(m, sigue, true),
      alPagina: (a) => { nuevas.push(a); },
      alAviso: (t) => { if (sigue()) this.avance.textContent = t; },
      alDecir: (t) => this.decir(t),
      alError: (c) => this.error(c)
    });
    if (!r || !sigue()) return;
    await mesa.cambiarPdf(pedido, nuevas, r, r.pagina ? () => this.ajustarLibro(r.pagina) : null);
  }

  /* El libro toma la proporcion del PDF (la que se eligio al preguntar) */
  ajustarLibro(pagina) {
    this.obra.pagina = new ConfigPagina(pagina);
    this.ponerPagina();
    this.guardarObra();
    this.mesa.repintarHojas();
  }

  async traerPdfYa(archivo, portada) {
    let anterior = null, primera = null, cuantas = 0, deLaPortada = null, empezada = false;
    const turno = this.turnoObra, sigue = () => turno === this.turnoObra;
    await importarPdf(archivo, {
      be: this.be, obra: this.obra.aDatos(), tx: this.tx, imagenes: this.imagenes, sigue,
      alProporcion: (m) => this.preguntarProporcion(m, sigue),
      /* `false` detiene la lectura: sin capitulo para la portada no se suben las paginas que faltan */
      alPagina: async (a) => {
        if (portada && !empezada) {
          empezada = true;
          deLaPortada = await this.mesa.primeraDePortada(a, sigue);
          if (!deLaPortada) return false;
          anterior = deLaPortada.h;
        } else anterior = this.mesa.ponerPaginaDePdf(a, anterior);
        primera = primera || anterior;
        cuantas++;
      },
      alAviso: (t) => { if (sigue()) this.avance.textContent = t; },
      alDecir: (t) => this.decir(t),
      alError: (c) => this.error(c)
    });
    if (!sigue()) return;
    this.mesa.medir();
    /* Se ve donde quedo y se dice: si no, una pagina puede parecer perdida */
    const n = this.mesa.paginas.findIndex((p) => p.vista === primera) + 1;
    if (n < 1) return;
    if (!document.activeElement.closest('.flujo, .hoja')) this.mesa.irA(n);
    if (!portada) { this.decir(this.tx.pdfQuedo.replace('{n}', String(n))); return; }
    this.llenarAntesDe();
    /* La portada vieja no se borra sola: sus paginas quedan elegidas para que el autor decida */
    const viejas = deLaPortada && deLaPortada.viejas.length ? this.mesa.elegirNodos(deLaPortada.vivo, deLaPortada.viejas) : 0;
    const subida = cuantas === 1 ? this.tx.portadaSubidaUna : this.tx.portadaSubida.replace('{n}', String(cuantas));
    this.decir([subida, viejas === 1 ? this.tx.portadaViejaUna : viejas ? this.tx.portadaVieja : ''].filter(Boolean).join(' '));
  }

  /* El PDF tiene otra proporcion que el libro: decide el fundador. Ajustar el libro cambia todas sus hojas. */
  async preguntarProporcion(m, sigue, diferir = false) {
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
    /* `diferir`: solo se dice cual es el tamaño; quien llama lo pone cuando ya subio todo */
    if (!diferir) this.ajustarLibro(nueva.aDatos());
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
    /* Los numeros del contenido, recien medidos: la hoja de impresion los usa tal cual */
    const indice = this.mesa.datosDeIndice;
    this.avance.textContent = this.tx.preparandoPdf;
    const caps = this.mesa.vivos.map((v) => v.cap);
    /* Tambien la imagen de arriba del contenido, que es del libro y no de un capitulo */
    const { mapa, faltan } = await this.imagenes.todas([...rutasDelLibro(this.obra.aDatos(), caps, { impreso: true })]);
    if (faltan.length) { this.avance.textContent = ''; this.error('imagenFalta'); return; }
    const llaves = [...new Set(caps.flatMap((c) => llavesDe(c.contenido)))];
    const alts = caps.reduce((s, c) => s + sinAlt(c.contenido.doc || {}), 0);
    const tenues = caps.reduce((s, c) => s + textosPocoVisibles(c.contenido, this.obra.pagina.papel), 0);
    const sangran = this.obra.pagina.imprenta && caps.some((c) => (c.contenido.doc.content || []).some((n) => n.type === 'paginaLibre' && n.attrs.sangre));
    /* Las hojas que quedaron de un PDF anterior se imprimen y se numeran: se avisa antes de sacarlas */
    const sobran = caps.reduce((s, c) => s + (c.contenido.doc.content || []).filter((n) => n.type === 'paginaLibre' && n.attrs && n.attrs.sobra === true).length, 0);
    const dice = [
      sobran ? (sobran === 1 ? this.tx.sobraEnLibro : this.tx.sobranEnLibro.replace('{n}', String(sobran))) : '',
      sangran ? this.tx.imprentaSangre : '',
      tenues ? this.tx.colorPocoVisible.replace('{n}', String(tenues)) : '',
      llaves.length ? this.tx.llavesEnPdf.replace('{llaves}', llaves.map((x) => `{${x}}`).join(', ')) : '',
      alts ? this.tx.imagenesSinAlt.replace('{n}', String(alts)) : ''
    ].filter(Boolean).join(' ');
    if (dice) this.decir(dice);
    this.asegurarVista();
    this.vista.pintar(aHoja(this.obra.aDatos(), caps.map((c) => c.aDatos()), { imagenes: mapa, indice }));
  }

  /* Lo que la ventana de Compartir necesita saber del libro, guardado y medido al momento (como al sacar el PDF) */
  async contextoDeCompartir() {
    if (!this.obra || !this.mesa) return null;
    if (!(await this.vaciarTodo())) { this.error('noGuardado'); return null; }
    this.mesa.medir();
    const indice = this.mesa.datosDeIndice;
    const p = this.obra.pagina;
    return {
      obraId: this.obra.id, titulo: this.obra.titulo, idioma: this.obra.idioma, ratioLibro: ratioDeHoja(p),
      numeros: indice ? indice.numeros : {}, paginasMesa: this.mesa.paginas.length
    };
  }

  /* ---- Copias ---- */
  /* La copia completa de un libro desde la lista (antes de borrarlo): con imagenes y PDF dentro */
  async copiaDe(id) {
    const r = await this.be.taller.abrir(id);
    if (r.error) return r;
    const faltan = await bajarLibro({ obra: r.obra, capitulos: r.capitulos, piezas: r.piezas, conArchivos: true, bajar: (x) => this.be.taller.bajar(x) });
    return { ok: true, faltan };
  }

  async bajar() {
    const quedo = await this.vaciarTodo();
    const r = await this.be.taller.abrir(this.obra.id);
    if (r.error) { this.error(r.error); return; }
    const faltan = await bajarLibro({ obra: r.obra, capitulos: r.capitulos, piezas: r.piezas, conArchivos: this.m('[data-tal-con-archivos]').checked, bajar: (x) => this.be.taller.bajar(x) });
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
    for (const [v, doc, papel] of fotos) if (v.guardado.sucio) this.entregarCapitulo(titulo, v, doc, papel);
  }

  bajarCapitulo(v) { this.entregarCapitulo(this.obra.titulo, v, v.doc, v.papel); }

  /* La copia de un capitulo lleva tambien su nombre puesto a mano y si sale en el contenido */
  entregarCapitulo(titulo, v, doc, papel) {
    const c = v.cap, extra = propiosAGuardar(v.propios());
    entregar(JSON.stringify({ formato: 'taller-capitulo', titulo: c.titulo, contenido: { version: 2, ...(papel ? { papel } : {}), ...extra, doc } }), nombreDeArchivo(`${titulo} ${c.titulo}`));
  }

  /* `sesion` detiene un libro que se estaba abriendo: tras salir, no se pinta */
  olvidar() {
    this.sesion++;
    if (this.borrador) this.borrador.cerrarYa();
    if (this.obra) this.cerrarObra();
    clearTimeout(this.relojImagenes);
    this.imagenes.olvidar();
    this.lista.replaceChildren();
  }
}
