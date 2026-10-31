/* DEVELOPER-MODE → TALLER (components/portal/dev/Taller.astro): donde se escriben los libros.

   Una obra se divide en capitulos; el abierto se guarda solo. Lo que se guarda pasa por
   TextoLibro.js, y un libro nunca se corta: si no cabe, se dice. Si otra pestaña cambio lo mismo,
   el guardado se detiene y pregunta (Repositorio.decidir), nunca sobrescribe en silencio.

   No hereda de EditorContenido: un libro no es un asistente de pasos. Nada de esto se publica: el
   Taller produce el PDF, y el PDF se sube en «Recursos» como siempre. Al salir se borra de la
   pagina lo que se vio; si quedara texto sin guardar, se baja a un archivo antes de perderlo.

   El celular es para leer y revisar: lo decide el dedo (`TELEFONO`), no el ancho, porque ampliar
   la pantalla en un computador tambien la hace angosta y ahi se sigue escribiendo. */
import { Seccion } from '../Seccion.js';
import { Obra, Capitulo, CAPITULOS_MAX } from '../../../contenido/taller/Obra.js';
import { ConfigPagina, TAMANOS } from '../../../contenido/taller/ConfigPagina.js';
import { limpiarContenido, cabeEnElCapitulo, llavesDe } from '../../../contenido/taller/TextoLibro.js';
import { aHoja } from '../../../contenido/taller/hoja.js';
import { IDIOMAS } from '../../../contenido/comun.js';
import { Autoguardado } from './taller/Autoguardado.js';
import { BarraFormato } from './taller/BarraFormato.js';
import { crearEditor } from './taller/Editor.js';
import { Imagenes } from './taller/Imagenes.js';
import { Piezas } from './taller/Piezas.js';
import { Vista } from './taller/Vista.js';
import { cargarFuente } from './taller/Fuentes.js';
import { bajarLibro, entregar, nombreDeArchivo } from './taller/Descarga.js';

const PINTAR_MS = 1200;
const COPIA_MS = 10 * 60 * 1000;
const ARMADO_MS = 5000;
const TELEFONO = '(hover: none) and (pointer: coarse)';
const FALLAS = ['red', 'conflicto', 'permiso', 'lleno'];
const azar = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
const enTelefono = () => window.matchMedia(TELEFONO).matches;

function quitarPieza(doc, id) {
  const copia = { ...doc };
  if (copia.content) copia.content = copia.content.filter((n) => !(n.type === 'paginasPdf' && n.attrs && n.attrs.pieza === id)).map((n) => quitarPieza(n, id));
  return copia;
}
function rutasDe(n, salida = new Set()) {
  if (n.type === 'imagen' && n.attrs && n.attrs.ruta) salida.add(n.attrs.ruta);
  (n.content || []).forEach((h) => rutasDe(h, salida));
  return salida;
}
function piezasDe(n, salida = new Set()) {
  if (n.type === 'paginasPdf' && n.attrs) salida.add(n.attrs.pieza);
  (n.content || []).forEach((h) => piezasDe(h, salida));
  return salida;
}
function sinAlt(n) {
  const aqui = n.type === 'imagen' && n.attrs && !n.attrs.alt && !n.attrs.decorativa ? 1 : 0;
  return (n.content || []).reduce((s, h) => s + sinAlt(h), aqui);
}

export class Taller extends Seccion {
  constructor(raiz, ctx) {
    super(raiz.querySelector('[data-taller]'), ctx);
    this.tx = (ctx.p && ctx.p.taller) || {};
    this.pestana = crypto.randomUUID();
    this.obra = null;
    this.capitulos = [];
    this.abierto = null;
    this.editor = null;
    this.barra = null;
    this.vista = null;
    this.reloj = 0;
    this.ultimaCopia = 0;
    this.imprimirId = 0;
    this.enFalla = false;
    if (!this.caja) return;
    const q = (s) => this.caja.querySelector(s);
    this.q = q;
    this.vLista = q('[data-tal-lista]');
    this.vObra = q('[data-tal-obra]');
    this.lista = q('[data-tal-obras]');
    this.estado = q('[data-tal-estado]');
    this.anuncio = q('[data-tal-anuncio]');
    this.conflicto = q('[data-tal-conflicto]');
    this.capLista = q('[data-tal-capitulos]');
    this.vistaCaja = q('[data-tal-vista]');
    this.paginasDice = q('[data-tal-paginas]');
    this.piezasCaja = q('[data-tal-pieza]');
    this.avance = q('[data-tal-avance]');
    this.imagenes = new Imagenes((r) => ctx.be.taller.bajar(r));
    this.guardado = new Autoguardado({
      guardar: () => this.guardarAbierto(),
      alEstado: (e) => this.alEstado(e)
    });
    this.piezas = new Piezas(this.piezasCaja, {
      tx: this.tx, imagenes: this.imagenes, pestana: this.pestana,
      get be() { return ctx.be; },
      obra: () => this.obra.aDatos(),
      alAviso: (t) => { this.avance.textContent = t; },
      alDecir: (t) => this.decir(t),
      alError: (c) => this.error(c),
      alInsertar: (id) => this.editor.chain().focus().insertContent({ type: 'paginasPdf', attrs: { pieza: id } }).createParagraphNear().run(),
      alQuitar: (id) => this.quitarPiezaDelLibro(id),
      alCopia: (m) => this.copiaSegura(m),
      alEditor: () => this.editor.view.dom
    });
    q('[data-tal-crear]').addEventListener('submit', (e) => { e.preventDefault(); this.crear(e.currentTarget); });
    q('[data-tal-volver]').addEventListener('click', () => this.volver());
    q('[data-tal-titulo]').addEventListener('change', (e) => { this.obra.titulo = e.target.value.trim() || this.obra.titulo; e.target.value = this.obra.titulo; this.guardarObra(); });
    q('[data-tal-nuevo-cap]').addEventListener('click', () => this.nuevoCapitulo());
    q('[data-tal-cap-titulo]').addEventListener('input', (e) => { if (this.abierto) { this.abierto.titulo = e.target.value; this.guardado.marcar(); } });
    q('[data-tal-cap-titulo]').addEventListener('change', () => this.pintarCapitulos());
    q('[data-tal-ver]').addEventListener('click', (e) => this.alternarVista(e.currentTarget));
    q('[data-tal-ver-todo]').addEventListener('click', () => this.pintarLibro(false));
    q('[data-tal-imprimir]').addEventListener('click', () => this.pintarLibro(true));
    q('[data-tal-bajar]').addEventListener('click', () => this.bajar());
    q('[data-tal-version]').addEventListener('click', () => this.guardarVersion());
    q('[data-tal-quedarme]').addEventListener('click', () => this.resolver(true));
    q('[data-tal-traer]').addEventListener('click', () => this.resolver(false));
    this.prepararPagina();
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.guardado.vaciar(); });
    window.addEventListener('hashchange', () => this.guardado.vaciar());
    window.addEventListener('beforeunload', (e) => { if (this.guardado.sucio || this.guardado.corriendo) e.preventDefault(); });
  }

  get be() { return this.ctx.be; }

  alEntrar() {
    this.limpiar();
    if (!this.be || !this.be.taller) { this.avisar(this.tx.sinBase); return; }
    if (!this.obra) this.cargarLista();
  }

  /* Solo lo que importa oirse. Lo de cada tecla se ve, pero no se dice. */
  decir(t) {
    this.anuncio.textContent = '';
    setTimeout(() => { this.anuncio.textContent = t || ''; }, 30);
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
    const obra = new Obra({ titulo, pagina: new ConfigPagina({}).aDatos() });
    const r = await this.be.taller.crearObra(obra.aDatos());
    if (r.error) { this.error(r.error); return; }
    f.reset();
    await this.abrirObra(r.id);
  }

  async abrirObra(id) {
    this.limpiar();
    const r = await this.ctx.aTiempo(this.be.taller.abrir(id));
    if (r.error) { this.error(r.error); return; }
    this.obra = new Obra(r.obra);
    this.capitulos = r.capitulos.map((c) => new Capitulo(c));
    /* Un libro sin capitulos (se corto al crearlo) se repara aqui */
    if (!this.capitulos.length) {
      const c = await this.be.taller.crearCapitulo(id, `${this.tx.capitulo} 1`);
      if (c.error) { this.error(c.error); this.obra = null; return; }
      this.capitulos = [new Capitulo(c.fila)];
    }
    this.piezas.cargar(r.piezas);
    this.vLista.hidden = true;
    this.vObra.hidden = false;
    this.q('[data-tal-titulo]').value = this.obra.titulo;
    this.obra.fuentes.forEach(cargarFuente);
    this.ponerPagina();
    this.pintarCapitulos();
    await this.abrirCapitulo(this.capitulos[0]);
    this.pintarVersiones();
    if (enTelefono()) this.editor.setEditable(false, false);
    this.q('[data-tal-titulo]').focus();
  }

  async volver() {
    if (!(await this.guardado.vaciar())) { this.error('noGuardado'); return; }
    const id = this.obra.id;
    this.cerrarObra();
    await this.cargarLista(id);
  }

  cerrarObra() {
    if (this.editor) { this.editor.destroy(); this.editor = null; }
    if (this.vista) { this.vista.soltar(); this.vista = null; }
    /* El marco guarda el libro pintado: se cambia por uno vacio */
    const marco = this.q('[data-tal-marco]'), nuevo = marco.cloneNode(false);
    nuevo.removeAttribute('src');
    marco.replaceWith(nuevo);
    clearTimeout(this.reloj);
    this.guardado.soltar();
    this.piezas.olvidar();
    this.imagenes.olvidar();
    this.obra = null; this.abierto = null; this.capitulos = [];
    this.imprimirId = 0;
    for (const s of ['[data-tal-titulo]', '[data-tal-cap-titulo]']) this.q(s).value = '';
    for (const n of [this.capLista, this.q('[data-tal-versiones]')]) n.replaceChildren();
    for (const n of [this.avance, this.paginasDice, this.estado, this.q('[data-tal-llaves]')]) n.textContent = '';
    this.conflicto.hidden = true;
    this.q('[data-tal-barra]').inert = false;
    this.vObra.hidden = true;
    this.vLista.hidden = false;
    this.vistaCaja.hidden = true;
    this.caja.classList.remove('taller--vista');
    this.q('[data-tal-ver]').setAttribute('aria-pressed', 'false');
  }

  /* ---- Capitulos ---- */
  pintarCapitulos(foco = null) {
    this.capLista.replaceChildren();
    this.capitulos.forEach((c, i) => {
      const li = document.createElement('li');
      li.className = 'tal-cap';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tal-cap__nombre';
      b.textContent = c.titulo || `${this.tx.capitulo} ${i + 1}`;
      if (c === this.abierto) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', async () => { await this.abrirCapitulo(c, true); });
      const mover = (texto, paso) => {
        const m = document.createElement('button');
        m.type = 'button';
        m.className = 'tal-cap__mover';
        m.textContent = texto;
        m.setAttribute('aria-label', `${paso < 0 ? this.tx.subir : this.tx.bajarCap}: ${b.textContent}`);
        m.disabled = !this.capitulos[i + paso];
        m.addEventListener('click', () => this.moverCapitulo(i, paso));
        return m;
      };
      const arriba = mover('↑', -1), abajo = mover('↓', 1);
      li.append(b, arriba, abajo);
      this.capLista.append(li);
      if (foco && foco.c === c) {
        const quiero = foco.que === 'nombre' ? b : foco.que === 'arriba' ? arriba : abajo;
        (quiero.disabled ? (quiero === arriba ? abajo : arriba) : quiero).focus();
      }
    });
    this.q('[data-tal-nuevo-cap]').disabled = this.capitulos.length >= CAPITULOS_MAX;
  }

  async abrirCapitulo(cap, conFoco = false) {
    if (this.abierto && !(await this.guardado.vaciar())) { this.error('noGuardado'); return; }
    this.abierto = cap;
    this.q('[data-tal-cap-titulo]').value = cap.titulo;
    const contenido = limpiarContenido(cap.contenido).contenido.doc;
    if (!this.editor) this.crearEditor(contenido);
    else this.ponerTexto(contenido);
    this.guardado.soltar();
    this.pintarCapitulos(conFoco ? { c: cap, que: 'nombre' } : null);
    this.pintarLlaves();
    if (conFoco) this.decir(cap.titulo);
    if (!this.vistaCaja.hidden) this.pintarCapitulo();
  }

  /* Cambiar el texto del editor sin dejar rastro en «deshacer»: si no, un Ctrl+Z de mas traeria
     aqui el capitulo anterior, y el guardado lo escribiria encima de este. */
  ponerTexto(doc) {
    this.editor.chain().setMeta('addToHistory', false).setContent(doc, { emitUpdate: false }).run();
  }

  crearEditor(contenido) {
    this.editor = crearEditor(this.q('[data-tal-editor]'), {
      contenido, tx: this.tx, idioma: this.obra.idioma,
      alCambiar: () => this.alEscribir(),
      alMover: () => { if (this.barra) this.barra.actualizar(); },
      alBarra: () => { if (this.barra) this.barra.entrar(); },
      pintarImagen: (ruta, img) => this.imagenes.dame(ruta).then((d) => { if (d) img.src = d; }),
      pintarPieza: (id, dom) => this.piezas.enTexto(id, dom)
    });
    if (!this.barra) {
      this.barra = new BarraFormato(this.q('[data-tal-barra]'), {
        tx: this.tx, editor: () => this.editor, fuentes: this.obra.fuentes,
        alError: (c) => this.error(c),
        alImagen: (a) => this.subirImagen(a),
        alPdf: (a) => this.piezas.adjuntar(a),
        alNuevaFuente: (n) => this.agregarFuente(n)
      });
    } else this.barra.ponerFuentes(this.obra.fuentes);
    this.barra.actualizar();
  }

  alEscribir() {
    this.guardado.marcar();
    this.pintarLlaves();
    if (Date.now() - this.ultimaCopia > COPIA_MS) {
      this.ultimaCopia = Date.now();
      this.be.taller.copia(this.obra.id, 'auto').then((r) => { if (r.error) this.error(r.error === 'lleno' ? 'copiaGrande' : 'copiaFallo'); });
    }
    if (!this.vistaCaja.hidden) {
      clearTimeout(this.reloj);
      this.reloj = setTimeout(() => this.pintarCapitulo(), PINTAR_MS);
    }
  }

  pintarLlaves() {
    const l = this.editor ? llavesDe({ doc: this.editor.getJSON() }) : [];
    const el = this.q('[data-tal-llaves]');
    el.hidden = !l.length;
    el.textContent = l.length ? `${this.tx.llavesEn} ${l.map((x) => `{${x}}`).join(', ')}` : '';
  }

  async guardarAbierto() {
    const c = this.abierto;
    const limpio = limpiarContenido({ doc: this.editor.getJSON() });
    if (!cabeEnElCapitulo(limpio)) return { error: 'lleno' };
    if (limpio.descartados) this.avance.textContent = this.tx.descartados.replace('{n}', String(limpio.descartados));
    c.contenido = limpio.contenido;
    c.letras = limpio.letras;
    let r = await this.be.taller.guardarCapitulo(c.aDatos(), this.pestana);
    if (r.reintentar) { c.rev = r.rev; r = await this.be.taller.guardarCapitulo(c.aDatos(), this.pestana); }
    if (r.ok) { c.rev = r.rev; return { ok: true }; }
    return r;
  }

  alEstado(e) {
    const estados = this.tx.estados || {};
    this.estado.textContent = estados[e] || '';
    this.estado.dataset.estado = e;
    if (FALLAS.includes(e)) { this.enFalla = true; this.decir(estados[e]); }
    if (e === 'guardado' && this.enFalla) { this.enFalla = false; this.decir(estados.guardado); }
    if (e === 'conflicto') {
      /* Puede estar escribiendo: el foco va al aviso y no a un boton, que un espacio pulsaria.
         Y el texto se bloquea: lo escrito ahora quedaria fuera de la decision. */
      this.bloquear(true);
      this.conflicto.hidden = false;
      this.conflicto.focus();
    }
    if (e === 'lleno') this.error('tallerLleno');
    if (e === 'permiso') this.error('permiso');
  }

  /* Ni el texto ni la barra cambian mientras se decide algo. Al salir el editor puede ya no estar. */
  bloquear(si) {
    if (!this.editor) return;
    this.editor.setEditable(!si && !enTelefono(), false);
    this.q('[data-tal-barra]').inert = si;
  }

  /* `lleno` es del guardado: el aviso que se le muestra al fundador es este */
  error(clave) { super.error(clave === 'lleno' ? 'tallerLleno' : clave); }

  /* Una copia antes de algo que no se deshace. Si no se pudo, lo que venia no sigue. */
  async copiaSegura(motivo) {
    const r = await this.be.taller.copia(this.obra.id, motivo);
    if (!r.error) return true;
    this.error(r.error === 'lleno' ? 'copiaGrande' : 'copiaFallo');
    return false;
  }

  /* Dos pestañas: quien decide es el fundador. La copia de la base guarda lo de la otra pestaña. Lo
     de aqui aun no esta en la base: si se va a descartar, sale en un archivo antes de cambiarlo. */
  async resolver(quedarme) {
    if (!(await this.copiaSegura('conflicto'))) return;
    const c = this.abierto;
    const r = await this.be.taller.abrir(this.obra.id);
    if (r.error) { this.error(r.error); return; }
    const fila = r.capitulos.find((x) => x.id === c.id);
    if (!fila) { this.error('noExiste'); return; }
    if (!quedarme) this.bajarCapitulo(c);
    c.rev = fila.rev;
    this.conflicto.hidden = true;
    this.guardado.seguir();
    this.bloquear(false);
    this.pintarVersiones();
    if (quedarme) {
      this.guardado.sucio = false;
      this.guardado.marcar();
      await this.guardado.vaciar();
    } else {
      c.contenido = fila.contenido; c.titulo = fila.titulo;
      this.guardado.soltar();
      this.ponerTexto(limpiarContenido(c.contenido).contenido.doc);
      this.q('[data-tal-cap-titulo]').value = c.titulo;
      this.pintarCapitulos();
      this.alEstado('guardado');
    }
    this.editor.view.dom.focus();
  }

  async nuevoCapitulo() {
    if (!(await this.guardado.vaciar())) { this.error('noGuardado'); return; }
    const r = await this.be.taller.crearCapitulo(this.obra.id, `${this.tx.capitulo} ${this.capitulos.length + 1}`);
    if (r.error) { this.error(r.error); return; }
    const c = new Capitulo(r.fila);
    this.capitulos.push(c);
    await this.abrirCapitulo(c);
    this.q('[data-tal-cap-titulo]').focus();
  }

  async moverCapitulo(i, paso) {
    const [c] = this.capitulos.splice(i, 1);
    this.capitulos.splice(i + paso, 0, c);
    this.pintarCapitulos({ c, que: paso < 0 ? 'arriba' : 'abajo' });
    const r = await this.be.taller.ordenar(this.obra.id, this.capitulos.map((x) => x.id));
    if (r.error) this.error(r.error);
  }

  /* ---- La pagina del libro ---- */
  prepararPagina() {
    const f = this.q('[data-tal-pagina]');
    const tam = f.elements.tamano;
    TAMANOS.forEach((t) => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.nombre; tam.append(o); });
    IDIOMAS.forEach((l) => { const o = document.createElement('option'); o.value = l.id; o.textContent = l.nombre; f.elements.idioma.append(o); });
    tam.addEventListener('change', () => {
      const t = TAMANOS.find((x) => x.id === tam.value);
      if (t) { f.elements.anchoMm.value = t.anchoMm; f.elements.altoMm.value = t.altoMm; }
      this.leerPagina();
    });
    f.addEventListener('change', (e) => { if (e.target !== tam) this.leerPagina(); });
    f.addEventListener('submit', (e) => e.preventDefault());
  }

  ponerPagina() {
    const f = this.q('[data-tal-pagina]'), c = this.obra.pagina;
    f.elements.idioma.value = this.obra.idioma;
    f.elements.anchoMm.value = c.anchoMm; f.elements.altoMm.value = c.altoMm;
    for (const m of ['sup', 'inf', 'izq', 'der']) f.elements[m].value = c.margenes[m];
    f.elements.tamanoPt.value = c.cuerpo.tamanoPt; f.elements.interlinea.value = c.cuerpo.interlinea;
    f.elements.numerosVer.checked = c.numeros.ver; f.elements.indice.checked = c.indice;
    f.elements.lugar.value = c.numeros.lugar;
    const t = TAMANOS.find((x) => x.anchoMm === c.anchoMm && x.altoMm === c.altoMm);
    f.elements.tamano.value = t ? t.id : '';
    const fu = f.elements.fuente;
    fu.replaceChildren(...this.obra.fuentes.map((n) => { const o = document.createElement('option'); o.value = n; o.textContent = n; return o; }));
    fu.value = c.cuerpo.fuente;
  }

  leerPagina() {
    const f = this.q('[data-tal-pagina]'), n = (k) => Number(f.elements[k].value);
    const campos = ['anchoMm', 'altoMm', 'sup', 'inf', 'izq', 'der', 'tamanoPt', 'interlinea'];
    const vacio = campos.find((k) => f.elements[k].value === '');
    if (vacio) { f.elements[vacio].setAttribute('aria-invalid', 'true'); this.error('campoVacio'); return; }
    campos.forEach((k) => f.elements[k].setAttribute('aria-invalid', 'false'));
    const nueva = new ConfigPagina({
      anchoMm: n('anchoMm'), altoMm: n('altoMm'),
      margenes: { sup: n('sup'), inf: n('inf'), izq: n('izq'), der: n('der') },
      numeros: { ver: f.elements.numerosVer.checked, lugar: f.elements.lugar.value }, indice: f.elements.indice.checked,
      cuerpo: { fuente: f.elements.fuente.value, tamanoPt: n('tamanoPt'), interlinea: n('interlinea') }
    });
    if (nueva.errores().length) { this.error('margenes'); return; }
    this.limpiar();
    this.obra.pagina = nueva;
    this.obra.idioma = f.elements.idioma.value;
    this.editor.view.dom.setAttribute('lang', this.obra.idioma);
    this.guardarObra();
    if (!this.vistaCaja.hidden) this.pintarCapitulo();
  }

  agregarFuente(nombre) {
    if (!this.obra.fuentes.includes(nombre)) this.obra.fuentes.push(nombre);
    this.barra.ponerFuentes(this.obra.fuentes);
    this.ponerPagina();
    this.guardarObra();
  }

  /* El titulo, la pagina y las fuentes. Si otra pestaña los cambio, manda lo que esta en la base:
     se dice y se trae, no se escribe encima. */
  async guardarObra() {
    let r = await this.be.taller.guardarObra(this.obra.aDatos(), this.pestana);
    if (r.reintentar) { this.obra.rev = r.rev; r = await this.be.taller.guardarObra(this.obra.aDatos(), this.pestana); }
    if (r.ok) { this.obra.rev = r.rev; return; }
    if (r.error !== 'conflicto') { this.error(r.error); return; }
    this.error('conflicto');
    const id = this.obra.id;
    const a = await this.be.taller.abrir(id);
    if (a.error || !this.obra || this.obra.id !== id) return;
    this.obra = new Obra(a.obra);
    this.q('[data-tal-titulo]').value = this.obra.titulo;
    this.ponerPagina();
    this.barra.ponerFuentes(this.obra.fuentes);
  }

  async subirImagen(archivo) {
    const ext = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[archivo.type];
    if (!ext) { this.error('archivoTipo'); return; }
    const ruta = `taller/${this.obra.id}/img/${azar()}.${ext}`;
    const r = await this.be.taller.subir(ruta, archivo);
    if (r.error) { this.error(r.error); return; }
    await this.imagenes.poner(ruta, archivo);
    this.editor.chain().focus().insertContent({ type: 'imagen', attrs: { ruta, anchoPct: 100 } }).run();
  }

  async quitarPiezaDelLibro(id) {
    for (const c of this.capitulos) {
      if (c === this.abierto) {
        this.quitarDelEditor(id);
        continue;
      }
      if (!JSON.stringify(c.contenido).includes(id)) continue;
      c.contenido = { ...c.contenido, doc: quitarPieza(c.contenido.doc, id) };
      const r = await this.be.taller.guardarCapitulo(c.aDatos(), this.pestana);
      if (r.ok) c.rev = r.rev; else this.error(r.error || 'conflicto');
    }
  }

  /* Solo esa marca, y desde el final: puede pasar mientras escribe, y el cursor no debe moverse */
  quitarDelEditor(id) {
    const { state, view } = this.editor;
    const lugares = [];
    state.doc.descendants((n, pos) => { if (n.type.name === 'paginasPdf' && n.attrs.pieza === id) lugares.push([pos, pos + n.nodeSize]); });
    if (!lugares.length) return;
    const tr = state.tr;
    lugares.reverse().forEach(([de, a]) => tr.delete(de, a));
    view.dispatch(tr);
  }

  /* ---- Ver las paginas y sacar el PDF ---- */
  alternarVista(b) {
    const ver = this.vistaCaja.hidden;
    this.vistaCaja.hidden = !ver;
    b.setAttribute('aria-pressed', String(ver));
    this.caja.classList.toggle('taller--vista', ver);
    if (ver) this.pintarCapitulo();
    else { this.imprimirId = 0; clearTimeout(this.reloj); }
  }

  asegurarVista() {
    if (!this.vista) {
      this.vista = new Vista(this.q('[data-tal-marco]'), {
        alPintar: (n, id) => this.alPintar(n, id),
        alFallar: () => { this.paginasDice.textContent = ''; this.error('vistaFallo'); this.imprimirId = 0; }
      });
    }
    if (this.vistaCaja.hidden) {
      this.vistaCaja.hidden = false;
      this.q('[data-tal-ver]').setAttribute('aria-pressed', 'true');
      this.caja.classList.add('taller--vista');
    }
  }

  alPintar(n, id) {
    this.paginasDice.textContent = (n === 1 ? this.tx.paginaLista : this.tx.paginasListas).replace('{n}', String(n));
    if (this.pedido) { this.pedido = false; this.decir(this.paginasDice.textContent); }
    if (id === this.imprimirId) { this.imprimirId = 0; this.vista.imprimir(); }
  }

  async hojaDe(capitulos) {
    const rutas = new Set();
    const usadas = new Set();
    for (const c of capitulos) {
      rutasDe(c.contenido.doc || {}, rutas);
      piezasDe(c.contenido.doc || {}, usadas);
    }
    const piezas = this.piezas.usadas();
    for (const id of usadas) if (piezas[id]) piezas[id].paginas.forEach((g) => rutas.add(g.ruta));
    const { mapa, faltan } = await this.imagenes.todas([...rutas]);
    return { hoja: aHoja(this.obra.aDatos(), capitulos.map((c) => c.aDatos()), { piezas, imagenes: mapa }), faltan };
  }

  async pintarCapitulo() {
    if (!this.abierto) return;
    this.asegurarVista();
    this.paginasDice.textContent = this.tx.paginando;
    const limpio = limpiarContenido({ doc: this.editor.getJSON() }).contenido;
    const { hoja } = await this.hojaDe([new Capitulo({ ...this.abierto.aDatos(), contenido: limpio })]);
    this.vista.pintar(hoja);
  }

  async pintarLibro(imprimir) {
    clearTimeout(this.reloj);
    if (!(await this.guardado.vaciar())) { this.error('noGuardado'); return; }
    this.asegurarVista();
    this.paginasDice.textContent = this.tx.paginando;
    const { hoja, faltan } = await this.hojaDe(this.capitulos);
    if (imprimir && faltan.length) { this.paginasDice.textContent = ''; this.error('imagenFalta'); return; }
    const llaves = [...new Set(this.capitulos.flatMap((c) => llavesDe(c.contenido)))];
    const alts = this.capitulos.reduce((s, c) => s + sinAlt(c.contenido.doc || {}), 0);
    this.avance.textContent = !imprimir ? '' : [
      llaves.length ? this.tx.llavesEnPdf.replace('{llaves}', llaves.map((x) => `{${x}}`).join(', ')) : '',
      alts ? this.tx.imagenesSinAlt.replace('{n}', String(alts)) : ''
    ].filter(Boolean).join(' ');
    this.pedido = true;
    this.vista.pintar(hoja);
    this.imprimirId = imprimir ? this.vista.numero : 0;
  }

  async bajar() {
    const quedo = await this.guardado.vaciar();
    const r = await this.be.taller.abrir(this.obra.id);
    if (r.error) { this.error(r.error); return; }
    const faltan = await bajarLibro({ obra: r.obra, capitulos: r.capitulos, piezas: r.piezas, conArchivos: this.q('[data-tal-con-archivos]').checked, bajar: (x) => this.be.taller.bajar(x), rutasDe });
    /* Lo que no se alcanzo a guardar no esta en la base: va en su propio archivo */
    if (!quedo) this.bajarCapitulo(this.abierto);
    if (faltan) this.error('copiaIncompleta');
  }

  async guardarVersion() {
    await this.guardado.vaciar();
    if (!(await this.copiaSegura('manual'))) return;
    this.avance.textContent = this.tx.versionHecha;
    this.decir(this.tx.versionHecha);
    this.pintarVersiones();
  }

  async pintarVersiones() {
    const r = await this.be.taller.versiones(this.obra.id);
    if (r.error) return;
    const ul = this.q('[data-tal-versiones]');
    ul.replaceChildren(...r.filas.map((v) => {
      const li = document.createElement('li');
      const s = document.createElement('span');
      const nombre = `${this.ctx.fecha(v.creado)} · ${(this.tx.motivos || {})[v.motivo] || v.motivo}`;
      s.textContent = nombre;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'portal__boton portal__boton--suave';
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
    const parado = this.guardado.parado;
    const quedo = await this.guardado.vaciar();
    if (!quedo) this.bajarCapitulo(this.abierto);
    this.guardado.soltar();
    /* Mientras se restaura no se escribe: lo tecleado aqui se perderia */
    this.bloquear(true);
    const r = await this.be.taller.restaurar(id);
    if (r.error) {
      /* No se pudo: todo queda como estaba, con lo escrito otra vez pendiente de guardar */
      if (!parado) this.bloquear(false);
      if (!quedo) { this.guardado.parado = parado; this.guardado.marcar(); }
      this.error(r.error === 'lleno' ? 'copiaGrande' : r.error);
      return;
    }
    this.cerrarObra();
    await this.abrirObra(obra);
    this.decir(this.tx.restaurado);
  }

  /* El panel lo llama antes de cerrar la sesion. El texto se toma antes de esperar: si el guardado
     tarda mas que la salida, el editor ya no estaria. */
  async antesDeSalir() {
    if (!this.obra || !this.editor || !this.abierto) return;
    const c = this.abierto, titulo = this.obra.titulo, doc = this.editor.getJSON();
    if (await this.guardado.vaciar()) return;
    this.entregarCapitulo(titulo, c, doc);
  }

  bajarCapitulo(c) { this.entregarCapitulo(this.obra.titulo, c, this.editor.getJSON()); }

  entregarCapitulo(titulo, c, doc) {
    entregar(JSON.stringify({ formato: 'taller-capitulo', titulo: c.titulo, contenido: { version: 1, doc } }), nombreDeArchivo(`${titulo} ${c.titulo}`));
  }

  olvidar() {
    if (this.obra) this.cerrarObra();
    this.lista.replaceChildren();
  }
}
