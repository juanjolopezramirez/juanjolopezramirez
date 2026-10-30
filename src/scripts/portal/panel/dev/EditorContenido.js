/* La base de los editores de Developer-Mode (Libros, Sobre el camino, Trabajos y Proyectos).
   Una Seccion (../Seccion.js) que sabe:

     · la LISTA de lo que hay (contenido/Repositorio.js → Entrada: lo publicado y su
       borrador), con su estado y «Editar» en cada fila;
     · ABRIR el editor vacio («Nuevo …») o con algo dentro, y CERRARLO (si hay cambios sin
       guardar, pide otra pulsacion);
     · los PASOS (Asistente.js): uno cada vez, con la ruta arriba;
     · GUARDAR BORRADOR en cualquier paso, aunque falten cosas (validar({ borrador: true })):
       lo que esta, tiene que estar bien. Un borrador NO cambia la web;
     · REVISAR (el ultimo paso): como esta cada paso, con «Cambiar»; y desde ahi PUBLICAR
       (todo completo: validar()), QUITAR DE LA WEB, DESCARTAR LOS CAMBIOS y BORRAR (estos
       dos, con dos pulsaciones, sin ventanas que tapen);
     · los errores salen al lado de cada campo, su paso queda marcado en la ruta y se va al
       primero que tenga uno;
     · las VERSIONES en otros idiomas (con su casilla «la hizo una IA») y «Lo que hizo la IA».

   Cada hija dice:
     static id, static Tipo, static plantillaVersion
     leer(form)        → los datos de su clase (sin archivos)
     poner(obj)        → llena el formulario con algo guardado
     preparar(datos)   → las subidas pendientes [{ ruta, archivo }] y las rutas ya puestas en datos
     tituloDe(obj), detalleDe(obj)  → lo que dice su fila en la lista

   Nada de lo que viene de la base entra como HTML: todo con textContent. */
import { Seccion } from '../Seccion.js';
import { quitarMarcaCampo } from '../formulario.js';
import { Asistente } from './Asistente.js';
import { Entrada } from '../../../contenido/Repositorio.js';

const ARMADO_MS = 4000;
/* 8 bytes al azar en hexadecimal: 16 letras (64 bits), el maximo que aceptan 008 y los
   modelos. Un borrador en el cajon publico no se adivina. */
const azar = () => {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
};

/* Un nombre corto a partir de un titulo: sin acentos, en minusculas. `guiones` deja
   guiones entre palabras (etapas, casas); sin ellos, una sola palabra (libros). */
export function nombreCortoDe(titulo, guiones) {
  const base = String(titulo || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (guiones) return base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
  return base.replace(/[^a-z0-9]/g, '').replace(/^[0-9]+/, '').slice(0, 40);
}

export class EditorContenido extends Seccion {
  static id = '';
  static Tipo = null;
  static plantillaVersion = '';
  static guionesEnId = false;

  constructor(raiz, ctx) {
    super(raiz.querySelector(`[data-dev="${new.target.id}"]`), ctx);
    this.raiz = raiz;
    this.tx = (ctx.p && ctx.p.dev) || {};
    this.cargado = false;
    this.lista = [];
    this.entrada = null;                       // lo que se edita (Entrada), o null si es nuevo
    this.actual = null;                        // su contenido: el borrador o lo publicado
    this.sucio = false;                        // hay cambios sin guardar
    this.idTocado = false;
    this.armado = null;                        // el boton que espera su segunda pulsacion
    this.nVersion = 0;
    if (!this.caja) return;
    this.form = this.caja.querySelector('[data-dev-form]');
    /* Lo que se dice en voz alta sin mover el foco (un boton armado, un bloque que se movio) */
    this.voz = document.createElement('p');
    this.voz.className = 'sr-only';
    this.voz.setAttribute('aria-live', 'polite');
    this.caja.appendChild(this.voz);
    this.armar();
  }

  decir(texto) {
    this.voz.textContent = '';
    setTimeout(() => { this.voz.textContent = texto || ''; }, 30);
  }

  get Tipo() { return this.constructor.Tipo; }
  get repo() {
    const be = this.ctx.be;
    return be && be.contenido ? be.contenido.repositorio(this.Tipo) : null;
  }
  $(sel) { return this.caja.querySelector(sel); }
  boton(nombre) { return this.form.querySelector(`[data-dev-${nombre}]`); }

  /* ---- Armar los botones (una vez) ---------------------------------------------------- */
  armar() {
    const f = this.form;
    this.pasos = new Asistente(f, {
      alCambiar: (id) => { if (id === 'revisar') this.pintarRevisar(); },
      pasoDe: this.tx.pasoDe
    });
    this.$('[data-dev-nuevo]').addEventListener('click', () => this.abrir(null));
    f.addEventListener('submit', (e) => { e.preventDefault(); this.guardar(); });
    this.boton('cerrar').addEventListener('click', (e) => this.cerrar(e.currentTarget));
    this.boton('publicar').addEventListener('click', (e) => this.guardar({ publicar: true, boton: e.currentTarget }));
    this.boton('quitar').addEventListener('click', (e) => this.quitarDeLaWeb(e.currentTarget));
    this.boton('descartar').addEventListener('click', (e) => this.descartar(e.currentTarget));
    this.boton('borrar').addEventListener('click', (e) => this.borrar(e.currentTarget));
    this.boton('version').addEventListener('click', () => {
      const v = this.agregarVersion();
      const primero = v && v.querySelector('select, input');
      if (primero) primero.focus();
    });
    f.addEventListener('click', (e) => {
      const b = e.target.closest ? e.target.closest('[data-quitar-version]') : null;
      if (!b || !f.contains(b)) return;
      b.closest('[data-version]').remove();
      this.sucio = true;
      this.boton('version').focus();
    });
    /* Escribir en un campo le quita su marca de error (y deja el formulario «con cambios»);
       elegir un archivo dice cual */
    f.addEventListener('input', (e) => { this.sucio = true; this.quitarError(e.target); });
    f.addEventListener('change', (e) => {
      /* Elegir en que idioma se ve «Su página» no cambia nada de lo guardado */
      if (!(e.target.matches && e.target.matches('[data-pagina-idioma]'))) this.sucio = true;
      this.quitarError(e.target);
      if (e.target.type === 'file') this.nombrarArchivo(e.target);
    });
    /* Cerrar la pestaña o recargar con cambios sin guardar: el navegador pregunta */
    window.addEventListener('beforeunload', (e) => {
      if (!this.sucio || this.form.hidden) return;
      e.preventDefault();
      e.returnValue = '';
    });
    /* El nombre corto sale del titulo mientras no se toque a mano (y solo en lo nuevo) */
    const id = f.elements.id;
    const titulo = f.elements.titulo;
    if (id && titulo) {
      id.addEventListener('input', () => { this.idTocado = true; this.pintarRuta(); });
      titulo.addEventListener('input', () => {
        if (this.actual || this.idTocado) return;
        id.value = nombreCortoDe(titulo.value, this.constructor.guionesEnId);
        this.pintarRuta();
      });
    }
  }
  /* El nombre del archivo elegido, al lado de su boton (o «Ningún archivo elegido») */
  nombrarArchivo(input) {
    const caja = input.closest('.dev__elegir');
    const nombre = caja && caja.querySelector('[data-nombre-archivo]');
    if (!nombre) return;
    const archivo = input.files && input.files[0];
    nombre.textContent = archivo ? archivo.name : this.tx.ningunArchivo || '';
  }
  pintarRuta() {
    const r = this.$('[data-ruta-id]');
    if (r && this.form.elements.id) r.textContent = this.form.elements.id.value;
  }

  /* ---- La lista ------------------------------------------------------------------------ */
  alEntrar() {
    if (!this.existe || !this.ctx.esAdmin || this.cargado || !this.repo) return;
    this.cargado = true;
    this.recargar().then((bien) => { if (!bien) this.cargado = false; });
  }

  async recargar() {
    const r = await this.ctx.aTiempo(this.repo.listar());
    if (r.error) { this.error(r.error); return false; }
    this.lista = r.entradas || [];
    this.pintarLista();
    /* Lo que se esta editando, con lo que dice ahora la base */
    if (this.entrada) this.entrada = this.lista.find((e) => e.id === this.entrada.id) || this.entrada;
    return true;
  }

  pintarLista() {
    const ul = this.$('[data-dev-lista]');
    const base = this.$('template[data-plantilla="fila-dev"]');
    const estados = this.tx.estados || {};
    ul.replaceChildren();
    for (const e of this.lista) {
      const obj = e.actual;
      const li = base.content.cloneNode(true).firstElementChild;
      const poner = (c, t) => { const el = li.querySelector(`[data-campo-fila="${c}"]`); if (el) el.textContent = t || ''; };
      poner('titulo', this.tituloDe(obj));
      poner('detalle', this.detalleDe(obj));
      poner('estado', estados[e.estado] || e.estado);
      li.querySelector('[data-campo-fila="estado"]').dataset.estado = e.estado;
      const b = li.querySelector('[data-editar]');
      b.setAttribute('aria-label', `${b.textContent} (${this.tituloDe(obj)})`);
      b.addEventListener('click', () => this.abrir(e));
      ul.appendChild(li);
    }
    this.$('[data-dev-vacio]').hidden = this.lista.length > 0;
  }

  /* ---- Abrir y cerrar el editor --------------------------------------------------------- */
  abrir(entrada) {
    const obj = entrada ? entrada.actual : null;
    this.entrada = entrada;
    this.actual = obj;
    this.idTocado = false;
    this.desarmar();
    this.form.reset();
    this.form.querySelectorAll('input[type="file"]').forEach((c) => this.nombrarArchivo(c));
    this.limpiarErrores();
    this.limpiar();
    this.form.querySelectorAll('[data-version]').forEach((v) => v.remove());
    const h = this.$('[data-dev-titulo]');
    h.textContent = obj ? h.dataset.editar : h.dataset.nuevo;
    if (this.form.elements.id) this.form.elements.id.readOnly = !!obj;     // el id no cambia: es su direccion y la de sus archivos
    if (obj) this.poner(obj);
    this.pintarRuta();
    this.pintarEstado();
    this.$('[data-dev-lista]').hidden = true;
    this.$('[data-dev-vacio]').hidden = true;
    this.$('.dev__barra').hidden = true;
    this.form.hidden = false;
    this.pasos.ir(0, { foco: false });
    this.sucio = false;
    h.focus();
  }

  /* Con cambios sin guardar, cerrar pide otra pulsacion (y lo dice en voz alta) */
  cerrar(boton) {
    if (boton && this.sucio && !this.confirmar(boton)) return;
    this.desarmar();
    this.form.hidden = true;
    this.entrada = null;
    this.actual = null;
    this.sucio = false;
    this.$('[data-dev-lista]').hidden = false;
    this.$('.dev__barra').hidden = false;
    this.$('[data-dev-vacio]').hidden = this.lista.length > 0;
    this.$('[data-dev-nuevo]').focus();
  }

  /* Los botones de «Revisar», segun lo que haya: quitar solo si esta en la web; descartar
     solo si hay cambios a algo que ya esta en su tabla; borrar si existe */
  pintarEstado() {
    const e = this.entrada;
    const pub = this.boton('publicar');
    pub.textContent = e && e.estado === 'cambios' ? pub.dataset.cambios : pub.dataset.publicar;
    this.boton('quitar').hidden = !(e && e.publicado);
    this.boton('descartar').hidden = !(e && e.enBase && e.borrador);
    this.boton('borrar').hidden = !e;
    this.desarmar();
  }

  /* ---- Versiones en otros idiomas -------------------------------------------------------- */
  agregarVersion(datos) {
    const base = this.$(`template[data-plantilla="${this.constructor.plantillaVersion}"]`);
    if (!base) return null;
    const v = base.content.cloneNode(true).firstElementChild;
    const n = ++this.nVersion;
    v.querySelectorAll('[data-id]').forEach((el) => { el.id = `${this.constructor.id}-${el.dataset.id}-${n}`; });
    v.querySelectorAll('[data-para]').forEach((el) => { el.htmlFor = `${this.constructor.id}-${el.dataset.para}-${n}`; });
    v.dataset.version = String(n);
    const sel = v.querySelector('[name="v-idioma"]');
    const caja = sel && sel.closest('.dev__campo');
    if (caja) caja.dataset.campo = `version.${n}`;            // para que su error salga en su sitio
    /* Empieza en el primer idioma que aun no esta (si no, pisaria al original) */
    const usados = new Set([this.form.elements.idiomaOriginal.value, ...this.versiones().map((x) => x.querySelector('[name="v-idioma"]').value)]);
    this.form.querySelector('[data-versiones]').appendChild(v);
    if (sel && !datos) {
      const libre = [...sel.options].find((o) => !usados.has(o.value));
      if (libre) sel.value = libre.value;
    }
    if (datos) this.ponerVersion(v, datos);
    return v;
  }
  versiones() { return [...this.form.querySelectorAll('[data-version]')]; }

  /* Una version en el idioma del original, o dos en el mismo, pisarian textos y archivos */
  erroresDeVersiones(datos) {
    const vistos = new Set([datos.idiomaOriginal]);
    const errores = [];
    for (const v of this.versiones()) {
      const l = v.querySelector('[name="v-idioma"]').value;
      if (vistos.has(l)) errores.push({ campo: `version.${v.dataset.version}`, clave: 'idiomaRepetido' });
      vistos.add(l);
    }
    return errores;
  }
  ponerVersion() {}

  /* ---- «Lo que hizo la IA» ----------------------------------------------------------------- */
  leerIA() {
    const f = this.form;
    const partes = [...f.querySelectorAll('input[name="ia-partes"]:checked')].map((c) => c.value);
    const traducciones = this.versiones()
      .filter((v) => v.querySelector('input[name="v-ia"]').checked)
      .map((v) => v.querySelector('[name="v-idioma"]').value);
    return { partes, traducciones, nota: f.elements['ia-nota'] ? f.elements['ia-nota'].value : '' };
  }
  ponerIA(ia) {
    const f = this.form;
    f.querySelectorAll('input[name="ia-partes"]').forEach((c) => { c.checked = ia.partes.includes(c.value); });
    if (f.elements['ia-nota']) f.elements['ia-nota'].value = ia.nota || '';
  }

  /* ---- Errores al lado de cada campo --------------------------------------------------------- */
  limpiarErrores() {
    this.form.querySelectorAll('.dev__error').forEach((p) => { p.hidden = true; p.textContent = ''; });
    this.form.querySelectorAll('.dev__nota').forEach((p) => p.remove());
    this.form.querySelectorAll('[aria-invalid]').forEach(quitarMarcaCampo);
    const arriba = this.form.querySelector('[data-error-form]');
    arriba.hidden = true;
    arriba.textContent = '';
    const hecho = this.form.querySelector('[data-hecho]');
    if (hecho) { hecho.hidden = true; hecho.textContent = ''; }
    this.pasos.limpiar();
  }
  quitarError(el) {
    if (!el || !el.closest) return;
    const campo = el.closest('[data-campo]');
    if (el.hasAttribute && el.hasAttribute('aria-invalid')) quitarMarcaCampo(el);
    if (!campo) return;
    const p = campo.querySelector(':scope > .dev__error');
    if (p) { p.hidden = true; p.textContent = ''; }
    /* Si en su paso ya no queda nada marcado, la ruta deja de decir «tiene algo que revisar» */
    const paso = this.pasos.pasoDe(campo);
    const seccion = paso && this.form.querySelector(`[data-etapa="${paso}"]`);
    if (seccion && !seccion.querySelector('.dev__error:not([hidden])')) this.pasos.desmarcar(paso);
  }
  /* El campo de un error: «titulo» → [data-campo="titulo"]; «ia.traducciones» → el de «ia» */
  campoDe(nombre) {
    let n = nombre;
    while (n) {
      const c = this.form.querySelector(`[data-campo="${CSS.escape(n)}"]`);
      if (c) return c;
      n = n.includes('.') ? n.slice(0, n.lastIndexOf('.')) : '';
    }
    return null;
  }
  /* Los controles de un campo que pueden llevar la marca: los que se ven DENTRO del campo
     (no el del enlace, escondido hasta que se pide; el paso escondido no cuenta: el error
     tiene que quedar marcado para cuando se llegue a el) y no los de un bloque de dentro */
  controlesDe(campo) {
    return [...campo.querySelectorAll('[contenteditable], input:not([type="radio"]):not([type="checkbox"]), select, textarea')]
      .filter((c) => {
        const oculto = c.closest('[hidden]');
        return !(oculto && campo.contains(oculto)) && c.closest('[data-campo]') === campo;
      });
  }
  marcar(campo, texto, nota = false) {
    let p = campo.querySelector(nota ? ':scope > .dev__nota' : ':scope > .dev__error');
    if (!p) {
      p = document.createElement('p');
      p.className = nota ? 'dev__nota' : 'dev__error';
      campo.appendChild(p);
    }
    if (!p.id) p.id = `${this.constructor.id}-${nota ? 'nota' : 'error'}-${campo.dataset.campo.replace(/[^a-z0-9]/gi, '-')}`;
    p.textContent = texto;
    p.hidden = false;
    if (nota) return;
    /* Un grupo (radios, «Lo que hizo la IA», la pagina entera) lleva la marca en si mismo */
    const grupo = campo.tagName === 'FIELDSET' || campo.tagName === 'SECTION';
    const marcados = grupo ? [campo] : this.controlesDe(campo);
    marcados.forEach((c) => {
      if (!grupo) c.setAttribute('aria-invalid', 'true');
      if (!c.hasAttribute('data-desc-base')) c.setAttribute('data-desc-base', c.getAttribute('aria-describedby') || '');
      c.setAttribute('aria-describedby', `${c.getAttribute('data-desc-base')} ${p.id}`.trim());
    });
  }
  /* Lo que se dice de un error (las hijas pueden decir mas: el idioma y el bloque) */
  textoDeError(e) { const ex = this.tx.errores || {}; return ex[e.clave] || this.tx.revisa; }
  /* A donde va el foco con el primer error */
  focoDeError(campo) {
    const c = this.controlesDe(campo)[0] || campo.querySelector('input:checked') || campo.querySelector('input:not([hidden]), select');
    return c || null;
  }
  mostrarErrores(errores, avisos = []) {
    const ex = this.tx.errores || {};
    const marcados = [];
    for (const e of errores) {
      const campo = this.campoDe(e.campo);
      if (!campo || marcados.includes(campo)) continue;    // un campo, un mensaje (el primero)
      marcados.push(campo);
      this.marcar(campo, this.textoDeError(e));
    }
    for (const a of avisos) {
      const campo = this.campoDe(a.campo);
      if (campo && ex[a.clave]) this.marcar(campo, ex[a.clave], true);
    }
    if (!errores.length) return;
    /* Los pasos con errores quedan marcados en la ruta; se va al primero (en el orden de la
       pagina, no en el de la lista de errores) y el foco, a su primer campo marcado */
    this.pasos.marcar(marcados.map((c) => this.pasos.pasoDe(c)).filter(Boolean));
    marcados.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    const primero = marcados[0];
    const paso = primero && this.pasos.pasoDe(primero);
    if (paso && paso !== this.pasos.actual) this.pasos.ir(paso, { foco: false });
    const arriba = this.form.querySelector('[data-error-form]');
    arriba.hidden = false;
    arriba.textContent = '';
    const n = marcados.length || 1;
    setTimeout(() => { arriba.textContent = n > 1 && this.tx.revisaN ? this.tx.revisaN.replace('{n}', n) : (this.tx.revisa || ''); }, 30);
    const foco = primero && this.focoDeError(primero);
    if (foco) foco.focus();
  }

  /* Con el editor abierto, lo que salio bien («Borrador guardado…») sale al lado de los
     botones y se dice en voz alta, sin mover el foco (el de Seccion lo llevaria arriba) */
  avisar(texto) {
    const hecho = this.form && !this.form.hidden && this.form.querySelector('[data-hecho]');
    if (!hecho) { super.avisar(texto); return; }
    hecho.textContent = texto || '';
    hecho.hidden = !texto;
    this.decir(texto);
  }

  /* Con el editor abierto, un error del servidor (guardar, subir, borrar) sale al lado de
     los botones, donde se esta mirando, y no arriba del todo */
  error(clave) {
    if (!this.form || this.form.hidden) { super.error(clave); return; }
    const el = this.form.querySelector('[data-error-form]');
    el.textContent = '';
    el.hidden = false;
    setTimeout(() => { el.textContent = this.ctx.textoDe(clave); }, 30);
  }

  /* ---- «Revisar»: como esta cada paso --------------------------------------------------------- */
  /* Lo que hay en el formulario ahora, como objeto de su clase, y lo que le falta para publicar */
  revisarTodo() {
    const datos = this.leer(this.form);
    datos.ia = this.leerIA();
    this.preparar(datos);                     // lo elegido y aun sin subir tambien cuenta
    const obj = new this.Tipo(datos);
    const v = obj.validar();
    const extra = this.avisosPropios ? this.avisosPropios().filter((a) => a.bloquea) : [];
    return [...v.errores, ...extra, ...this.erroresDeVersiones(datos)];
  }
  /* El nombre que se ve de un campo (su etiqueta o su leyenda), para «Falta: Título, El PDF» */
  nombreDe(campo) {
    if (campo.hasAttribute('aria-label')) return campo.getAttribute('aria-label').trim();   // «Su página»
    /* (la imagen de un bloque no tiene etiqueta: su boton dice «Elegir la imagen») */
    const r = campo.querySelector('.portal__etiqueta, legend') || campo.querySelector('.dev__elegir-boton');
    return (r ? r.textContent : this.tx.revisa || '').trim();
  }
  pintarRevisar() {
    const ul = this.$('[data-resumen]');
    if (!ul) return;
    const rx = this.tx.revisar || {};
    const nombres = this.tx.etapas || {};
    const problemas = this.revisarTodo();
    const primero = this.pasos.ids[0];
    const porPaso = new Map();
    for (const e of problemas) {
      const campo = this.campoDe(e.campo);
      const paso = (campo && this.pasos.pasoDe(campo)) || primero;
      if (!porPaso.has(paso)) porPaso.set(paso, { falta: new Set(), mal: new Set() });
      const nombre = campo ? this.nombreDe(campo) : '';
      if (nombre) porPaso.get(paso)[e.clave === 'falta' ? 'falta' : 'mal'].add(nombre);
    }
    ul.replaceChildren();
    for (const id of this.pasos.ids) {
      if (id === 'revisar') continue;
      const p = porPaso.get(id);
      const li = document.createElement('li');
      li.className = 'dev__resumen-fila';
      li.dataset.listo = p ? 'no' : 'si';
      const nombre = document.createElement('p');
      nombre.className = 'dev__resumen-paso';
      nombre.textContent = nombres[id] || id;
      const dice = document.createElement('p');
      dice.className = 'dev__resumen-dice';
      const partes = [];
      if (p && p.falta.size) partes.push((rx.falta || '{campos}').replace('{campos}', [...p.falta].join(', ')));
      if (p && p.mal.size) partes.push((rx.mal || '{campos}').replace('{campos}', [...p.mal].join(', ')));
      dice.textContent = p ? (partes.join(' ') || this.tx.revisa || '') : (rx.listo || '');
      const cambiar = document.createElement('button');
      cambiar.type = 'button';
      cambiar.className = 'panel__boton panel__boton--suave';
      cambiar.textContent = rx.cambiar || '';
      cambiar.setAttribute('aria-label', `${rx.cambiar || ''} (${nombres[id] || id})`);
      cambiar.addEventListener('click', () => this.pasos.ir(id));
      const texto = document.createElement('div');
      texto.className = 'dev__resumen-texto';
      texto.append(nombre, dice);
      li.append(texto, cambiar);
      ul.appendChild(li);
    }
    const estados = this.tx.estados || {};
    const estado = this.entrada ? this.entrada.estado : 'borrador';
    const linea = (rx.ahora || '{estado}').replace('{estado}', estados[estado] || estado);
    /* Lo publicado sin cambios (ni guardados ni por guardar) no tiene nada que publicar:
       basta con decir como esta */
    const igual = estado === 'publicado' && !this.sucio;
    const sigue = problemas.length ? rx.faltaAlgo : (igual ? '' : rx.todoListo);
    const pub = this.boton('publicar');
    pub.textContent = this.entrada && this.entrada.publicado && !igual ? pub.dataset.cambios : pub.dataset.publicar;
    this.$('[data-revisar-estado]').textContent = `${linea} ${sigue || ''}`.trim();
  }

  /* ---- Guardar borrador y publicar ------------------------------------------------------------ */
  sufijo() { return azar(); }

  /* Guarda el borrador (a medias vale) o, con `publicar`, lo publica (completo). Lo nuevo
     se crea ANTES de subir sus archivos, sin ellos: si el nombre corto ya existe, la base
     lo dice sin haber subido nada; y si una subida falla, el borrador no apunta a un
     archivo que no esta. Devuelve si quedo guardado (las hijas lo miran). */
  async guardar({ publicar = false, boton = null } = {}) {
    if (!this.repo) return false;
    this.limpiarErrores();
    this.limpiar();
    this.desarmar();
    const datos = this.leer(this.form);
    datos.ia = this.leerIA();
    const sinSubir = JSON.parse(JSON.stringify(datos));
    const subidas = this.preparar(datos);
    const obj = new this.Tipo(datos);
    const v = publicar ? obj.validar() : obj.validar({ borrador: true });
    const avisosExtra = this.avisosPropios ? this.avisosPropios() : [];
    /* Algo NUEVO con el nombre corto de uno que ya existe no se guarda (si no, lo pisaria,
       con sus archivos): se dice antes de subir nada. La base lo vuelve a mirar (insert). */
    const nuevo = !this.entrada;
    const repetido = nuevo && this.lista.some((e) => e.id === obj.id) ? [{ campo: 'id', clave: 'repetido', bloquea: true }] : [];
    const errVersiones = this.erroresDeVersiones(datos);
    if (!v.ok || avisosExtra.some((a) => a.bloquea) || repetido.length || errVersiones.length) {
      this.mostrarErrores([...v.errores, ...avisosExtra.filter((a) => a.bloquea), ...repetido, ...errVersiones], v.avisos);
      return false;
    }
    let bien = false;
    const pulsado = boton || this.form.querySelector('button[type="submit"]');
    await this.ctx.conOcupado(pulsado, async () => {
      const responder = (r) => {
        if (!r.error) return true;
        if (r.error === 'repetido') this.mostrarErrores([{ campo: 'id', clave: 'repetido' }]);
        else if (r.errores) this.mostrarErrores(r.errores, r.avisos || []);
        else this.error(r.error);
        return false;
      };
      if (nuevo) {
        const base = new this.Tipo(sinSubir);
        if (!responder(await this.ctx.aTiempo(this.repo.guardarBorrador(base, { nuevo: true })))) return;
        this.entrada = new Entrada(obj.id, null, base);   // desde aqui es «editar»: si una subida falla, se reintenta
        this.actual = base;
        if (this.form.elements.id) this.form.elements.id.readOnly = true;
        const h = this.$('[data-dev-titulo]');
        h.textContent = h.dataset.editar;
      }
      if (subidas.length) this.avisar(this.tx.subiendo);
      for (const s of subidas) {
        /* Un PDF grande tarda: el tope crece con el archivo (1 minuto + 1 s por cada 100 KB) */
        const ms = 60000 + Math.ceil((s.archivo.size || 0) / 100000) * 1000;
        const r = await this.ctx.aTiempo(this.ctx.be.contenido.subir(s.ruta, s.archivo), ms);
        if (r.error) { this.error(r.error); if (nuevo) await this.recargar(); this.pintarEstado(); return; }
      }
      if (!nuevo || subidas.length || publicar) {
        const r = await this.ctx.aTiempo(publicar ? this.repo.publicar(obj) : this.repo.guardarBorrador(obj));
        if (!responder(r)) {
          /* No se publico, pero los archivos ya subieron: que el borrador los recuerde (si
             no, quedarian sueltos en el almacen y el borrador diria «sin PDF») */
          if (publicar && subidas.length) {
            const b = await this.ctx.aTiempo(this.repo.guardarBorrador(obj));
            if (!b.error) { this.actual = obj; this.vaciarArchivos(); }
          }
          await this.recargar();
          this.pintarEstado();
          return;
        }
      }
      const antes = this.entrada;
      this.actual = obj;
      this.sucio = false;
      bien = true;
      this.vaciarArchivos();
      /* Si la lista no se pudo leer, lo que se edita se arma aqui con lo que se acaba de hacer */
      if (!(await this.recargar()) || this.entrada === antes) {
        this.entrada = new Entrada(obj.id,
          publicar ? new this.Tipo({ ...obj.aFila(), publicado: true }) : antes && antes.enBase,
          publicar ? null : obj);
      }
      this.pintarEstado();
      this.mostrarErrores([], v.avisos);
      if (this.pasos.actual === 'revisar') this.pintarRevisar();
      const ya = this.entrada && this.entrada.publicado;
      this.avisar(publicar ? this.tx.publicado : (ya ? this.tx.guardadoCambios : this.tx.guardado));
    }, () => this.error('generico'));
    return bien;
  }

  /* Los archivos ya subidos no se vuelven a subir: se vacian los campos de archivo */
  vaciarArchivos() {
    this.form.querySelectorAll('input[type="file"]').forEach((c) => { c.value = ''; this.nombrarArchivo(c); });
    if (this.actual) this.pintarYaSubidos(this.actual);
  }
  pintarYaSubidos() {}

  /* ---- Quitar de la web, descartar, borrar ------------------------------------------------------ */
  async quitarDeLaWeb(boton) {
    if (!this.entrada || !this.repo) return;
    await this.ctx.conOcupado(boton, async () => {
      this.limpiar();
      const r = await this.ctx.aTiempo(this.repo.quitarDeLaWeb(this.entrada.id));
      if (r.error) { this.error(r.error); return; }
      await this.recargar();
      this.pintarEstado();
      this.pintarRevisar();
      this.avisar(this.tx.despublicado);
    }, () => this.error('generico'));
  }

  /* Descartar vuelve a lo que esta en su tabla: el formulario se llena con eso */
  async descartar(boton) {
    if (!this.entrada || !this.repo || !this.confirmar(boton)) return;
    await this.ctx.conOcupado(boton, async () => {
      const r = await this.ctx.aTiempo(this.repo.descartar(this.entrada.id));
      if (r.error) { this.error(r.error); return; }
      await this.recargar();
      const e = this.lista.find((x) => x.id === this.entrada.id);
      if (!e) { this.cerrar(); return; }
      this.abrir(e);
      this.pasos.ir('revisar');
      this.avisar(this.tx.descartado);
    }, () => this.error('generico'));
  }

  async borrar(boton) {
    if (!this.entrada || !this.repo || !this.confirmar(boton)) return;
    await this.ctx.conOcupado(boton, async () => {
      const r = await this.ctx.aTiempo(this.repo.borrar(this.entrada.id));
      if (r.error) { this.error(r.error); return; }
      this.sucio = false;
      this.cerrar();
      await this.recargar();
      this.avisar(this.tx.borrado);
    }, () => this.error('generico'));
  }

  /* Lo que no se deshace pide dos pulsaciones: la primera arma el boton («Pulsa otra vez
     para…», dicho tambien en voz alta) y lo deja armado mientras tenga el foco; al salir
     de el, se desarma. Sin ventanas que tapen. Devuelve si es la segunda. */
  confirmar(boton) {
    if (this.armado === boton) { this.desarmar(); return true; }
    this.desarmar();
    this.armado = boton;
    boton.dataset.normal = boton.textContent;
    boton.textContent = boton.dataset.seguro;
    this.decir(boton.dataset.voz || boton.dataset.seguro);
    boton.focus();
    boton.addEventListener('blur', () => { if (this.armado === boton) this.desarmar(); }, { once: true });
    setTimeout(() => { if (this.armado === boton && document.activeElement !== boton) this.desarmar(); }, ARMADO_MS);
    return false;
  }
  desarmar() {
    const b = this.armado;
    this.armado = null;
    if (b && b.dataset.normal) b.textContent = b.dataset.normal;
  }

  olvidar() {
    if (!this.caja) return;
    this.lista = [];
    this.cargado = false;
    this.entrada = null;
    this.actual = null;
    this.sucio = false;
    this.$('[data-dev-lista]').replaceChildren();
    if (this.form) { this.form.reset(); this.form.hidden = true; }
  }

  /* Lo que cada hija dice */
  leer() { return {}; }
  poner() {}
  preparar() { return []; }
  tituloDe(obj) { return obj.id; }
  detalleDe() { return ''; }
}
