/* La base de los editores de Developer-Mode (Libros, Sobre el camino y, luego, Trabajos y
   Proyectos). Una Seccion (../Seccion.js) que sabe:

     · la LISTA de lo que hay (borradores y publicados), con «Editar» en cada fila;
     · ABRIR el editor vacio («Nuevo …») o con algo dentro, y CERRARLO;
     · GUARDAR: lee el formulario, lo convierte en su clase (Libro, Etapa…), lo VALIDA con
       las mismas reglas que la base y la compilacion (src/scripts/contenido/), sube los
       archivos que hagan falta y solo entonces guarda; los errores salen al lado de cada
       campo, y el foco va al primero;
     · PUBLICAR / QUITAR DE LA WEB y BORRAR (dos pulsaciones, sin ventanas que tapen);
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

const BORRAR_MS = 4000;
const azar = () => {
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(36).padStart(2, '0')).join('').slice(0, 10);
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
    this.actual = null;
    this.idTocado = false;
    this.borrarHasta = 0;
    this.nVersion = 0;
    if (!this.caja) return;
    this.form = this.caja.querySelector('[data-dev-form]');
    /* Lo que se dice en voz alta sin mover el foco (borrar armado, un bloque que se movio) */
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

  /* ---- Armar los botones (una vez) ---------------------------------------------------- */
  armar() {
    const f = this.form;
    this.$('[data-dev-nuevo]').addEventListener('click', () => this.abrir(null));
    f.addEventListener('submit', (e) => { e.preventDefault(); this.guardar(); });
    f.querySelector('[data-dev-cerrar]').addEventListener('click', () => this.cerrar());
    f.querySelector('[data-dev-publicar]').addEventListener('click', (e) => this.publicar(e.currentTarget));
    f.querySelector('[data-dev-borrar]').addEventListener('click', (e) => this.borrar(e.currentTarget));
    f.querySelector('[data-dev-version]').addEventListener('click', () => {
      const v = this.agregarVersion();
      const primero = v && v.querySelector('select, input');
      if (primero) primero.focus();
    });
    f.addEventListener('click', (e) => {
      const b = e.target.closest ? e.target.closest('[data-quitar-version]') : null;
      if (!b || !f.contains(b)) return;
      b.closest('[data-version]').remove();
      f.querySelector('[data-dev-version]').focus();
    });
    /* Escribir en un campo le quita su marca de error; elegir un archivo dice cual */
    f.addEventListener('input', (e) => this.quitarError(e.target));
    f.addEventListener('change', (e) => {
      this.quitarError(e.target);
      if (e.target.type === 'file') this.nombrarArchivo(e.target);
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
    this.lista = r.filas || [];
    this.pintarLista();
    return true;
  }

  pintarLista() {
    const ul = this.$('[data-dev-lista]');
    const base = this.$('template[data-plantilla="fila-dev"]');
    ul.replaceChildren();
    for (const obj of this.lista) {
      const li = base.content.cloneNode(true).firstElementChild;
      const poner = (c, t) => { const el = li.querySelector(`[data-campo-fila="${c}"]`); if (el) el.textContent = t || ''; };
      poner('titulo', this.tituloDe(obj));
      poner('detalle', this.detalleDe(obj));
      poner('estado', obj.publicado ? this.tx.enLaWeb : this.tx.borrador);
      li.querySelector('[data-campo-fila="estado"]').classList.toggle('dev__estado--web', obj.publicado);
      const b = li.querySelector('[data-editar]');
      b.setAttribute('aria-label', `${b.textContent} (${this.tituloDe(obj)})`);
      b.addEventListener('click', () => this.abrir(obj));
      ul.appendChild(li);
    }
    this.$('[data-dev-vacio]').hidden = this.lista.length > 0;
  }

  /* ---- Abrir y cerrar el editor --------------------------------------------------------- */
  abrir(obj) {
    this.actual = obj;
    this.idTocado = false;
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
    this.pintarBotones();
    this.$('[data-dev-lista]').hidden = true;
    this.$('[data-dev-vacio]').hidden = true;
    this.$('.dev__barra').hidden = true;
    this.form.hidden = false;
    h.focus();
  }

  cerrar() {
    this.form.hidden = true;
    this.actual = null;
    this.$('[data-dev-lista]').hidden = false;
    this.$('.dev__barra').hidden = false;
    this.$('[data-dev-vacio]').hidden = this.lista.length > 0;
    this.$('[data-dev-nuevo]').focus();
  }

  pintarBotones() {
    const pub = this.form.querySelector('[data-dev-publicar]');
    const bor = this.form.querySelector('[data-dev-borrar]');
    pub.hidden = !this.actual;
    bor.hidden = !this.actual;
    if (this.actual) pub.textContent = this.actual.publicado ? pub.dataset.despublicar : pub.dataset.publicar;
    bor.textContent = bor.dataset.borrar;
    this.borrarHasta = 0;
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
  }
  quitarError(el) {
    if (!el || !el.closest) return;
    const campo = el.closest('[data-campo]');
    if (el.hasAttribute && el.hasAttribute('aria-invalid')) quitarMarcaCampo(el);
    if (!campo) return;
    const p = campo.querySelector(':scope > .dev__error');
    if (p) { p.hidden = true; p.textContent = ''; }
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
  /* Los controles de un campo que pueden llevar la marca: los que se ven (no el campo del
     enlace, escondido hasta que se pide) y no los de un bloque de dentro (columnas) */
  controlesDe(campo) {
    return [...campo.querySelectorAll('[contenteditable], input:not([type="radio"]):not([type="checkbox"]), select, textarea')]
      .filter((c) => !c.closest('[hidden]') && c.closest('[data-campo]') === campo);
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
    const c = this.controlesDe(campo)[0] || campo.querySelector('input:not([hidden]), select');
    return c || null;
  }
  mostrarErrores(errores, avisos = []) {
    const ex = this.tx.errores || {};
    let primero = null;
    const vistos = new Set();
    for (const e of errores) {
      const campo = this.campoDe(e.campo);
      if (!campo || vistos.has(campo)) continue;           // un campo, un mensaje (el primero)
      vistos.add(campo);
      this.marcar(campo, this.textoDeError(e));
      primero = primero || campo;
    }
    for (const a of avisos) {
      const campo = this.campoDe(a.campo);
      if (campo && ex[a.clave]) this.marcar(campo, ex[a.clave], true);
    }
    if (!errores.length) return;
    const arriba = this.form.querySelector('[data-error-form]');
    arriba.hidden = false;
    arriba.textContent = '';
    const n = vistos.size;
    setTimeout(() => { arriba.textContent = n > 1 && this.tx.revisaN ? this.tx.revisaN.replace('{n}', n) : (this.tx.revisa || ''); }, 30);
    const foco = primero && this.focoDeError(primero);
    if (foco) foco.focus();
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

  /* ---- Guardar, publicar, borrar ---------------------------------------------------------- */
  sufijo() { return azar(); }

  /* Devuelve si quedo guardado (las hijas que tienen algo que hacer despues lo miran) */
  async guardar() {
    if (!this.repo) return false;
    this.limpiarErrores();
    this.limpiar();
    const datos = this.leer(this.form);
    datos.ia = this.leerIA();
    datos.publicado = !!(this.actual && this.actual.publicado);
    const subidas = this.preparar(datos);
    const obj = new this.Tipo(datos);
    const v = obj.validar();
    const avisosExtra = this.avisosPropios ? this.avisosPropios() : [];
    /* Algo NUEVO con el nombre corto de uno que ya existe no se guarda (si no, lo pisaria,
       con sus archivos): se dice antes de subir nada. La base lo vuelve a mirar (insert). */
    const nuevo = !this.actual;
    const repetido = nuevo && this.lista.some((o) => o.id === obj.id) ? [{ campo: 'id', clave: 'repetido', bloquea: true }] : [];
    const errVersiones = this.erroresDeVersiones(datos);
    if (!v.ok || avisosExtra.some((a) => a.bloquea) || repetido.length || errVersiones.length) {
      this.mostrarErrores([...v.errores, ...avisosExtra.filter((a) => a.bloquea), ...repetido, ...errVersiones], v.avisos);
      return false;
    }
    const boton = this.form.querySelector('button[type="submit"]');
    let bien = false;
    await this.ctx.conOcupado(boton, async () => {
      const guardarFila = async () => {
        const r = await this.ctx.aTiempo(this.repo.guardar(obj, { nuevo }));
        if (!r.error) return true;
        if (r.error === 'repetido') this.mostrarErrores([{ campo: 'id', clave: 'repetido' }]);
        else if (r.errores) this.mostrarErrores(r.errores, r.avisos || []);
        else this.error(r.error);
        return false;
      };
      /* Algo NUEVO se crea ANTES de subir sus archivos: si el nombre corto ya existe, la base
         lo dice (y no se ha subido nada que pudiera pisar los archivos del otro) */
      if (nuevo) {
        if (!(await guardarFila())) return;
        this.actual = obj;                     // desde aqui es «editar»: si una subida falla, se reintenta
        if (this.form.elements.id) this.form.elements.id.readOnly = true;
      }
      if (subidas.length) this.avisar(this.tx.subiendo);
      for (const s of subidas) {
        /* Un PDF grande tarda: el tope crece con el archivo (1 minuto + 1 s por cada 100 KB) */
        const ms = 60000 + Math.ceil((s.archivo.size || 0) / 100000) * 1000;
        const r = await this.ctx.aTiempo(this.ctx.be.contenido.subir(s.ruta, s.archivo), ms);
        if (r.error) { this.error(r.error); if (nuevo) await this.recargar(); return; }
      }
      if (!nuevo && !(await guardarFila())) return;
      const eraNuevo = nuevo;
      this.actual = obj;
      bien = true;
      if (eraNuevo) {
        if (this.form.elements.id) this.form.elements.id.readOnly = true;
        const h = this.$('[data-dev-titulo]');
        h.textContent = h.dataset.editar;            // ya existe: lo que sigue es editarlo
      }
      this.pintarBotones();
      this.mostrarErrores([], v.avisos);
      this.vaciarArchivos();
      await this.recargar();
      this.avisar(obj.publicado ? this.tx.guardadoPublicado : this.tx.guardado);
    }, () => this.error('generico'));
    return bien;
  }

  /* Los archivos ya subidos no se vuelven a subir: se vacian los campos de archivo */
  vaciarArchivos() {
    this.form.querySelectorAll('input[type="file"]').forEach((c) => { c.value = ''; this.nombrarArchivo(c); });
    if (this.poner && this.actual) this.pintarYaSubidos(this.actual);
  }
  pintarYaSubidos() {}

  async publicar(boton) {
    if (!this.actual || !this.repo) return;
    const si = !this.actual.publicado;
    await this.ctx.conOcupado(boton, async () => {
      this.limpiar();
      const r = await this.ctx.aTiempo(this.repo.publicar(this.actual.id, si));
      if (r.error) { this.error(r.error); return; }
      this.actual.publicado = si;
      this.pintarBotones();
      await this.recargar();
      this.avisar(si ? this.tx.publicado : this.tx.despublicado);
    }, () => this.error('generico'));
  }

  /* Borrar pide dos pulsaciones: la primera arma el boton («Pulsa otra vez para borrar»,
     dicho tambien en voz alta) y lo deja armado mientras tenga el foco; al salir de el, se
     desarma. Sin ventanas que tapen. */
  async borrar(boton) {
    if (!this.actual || !this.repo) return;
    if (!this.borrarHasta) {
      this.borrarHasta = 1;
      boton.textContent = boton.dataset.seguro;
      this.decir(boton.dataset.seguro);
      boton.focus();
      const desarmar = () => { this.borrarHasta = 0; boton.textContent = boton.dataset.borrar; };
      boton.addEventListener('blur', desarmar, { once: true });
      setTimeout(() => { if (document.activeElement !== boton && this.borrarHasta) desarmar(); }, BORRAR_MS);
      return;
    }
    await this.ctx.conOcupado(boton, async () => {
      const r = await this.ctx.aTiempo(this.repo.borrar(this.actual.id));
      if (r.error) { this.error(r.error); return; }
      this.cerrar();
      await this.recargar();
      this.avisar(this.tx.borrado);
    }, () => this.error('generico'));
  }

  olvidar() {
    if (!this.caja) return;
    this.lista = [];
    this.cargado = false;
    this.actual = null;
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
