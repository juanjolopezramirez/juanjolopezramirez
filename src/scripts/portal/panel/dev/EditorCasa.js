/* Developer-Mode → Trabajos y Proyectos (components/portal/dev/EditorCasa.astro): los campos
   de una tarjeta de la web y «Su página», el editor de bloques (EditorBloques.js), un
   documento por idioma.

   Lo propio de una casa:
     · tres imagenes (logo, avatar y cabecera) que se MIDEN AQUI antes de subir: el logo da
       su ancho y alto (los pide la cinta) y su escala optica; la cabecera tiene que ser
       1600 × 420 y el avatar no menos de 256 px (contenido/medidas.js);
     · lo que hice con ellos (works): filas que se añaden y se quitan;
     · la pagina: se escribe en el idioma original y, si se quiere, en el de cada version.
       Cambiar de idioma guarda lo escrito en memoria; las imagenes elegidas se suben
       todas al guardar;
     · las rutas del almacen llevan un trozo al azar (el cajon de imagenes es publico y
       un borrador no se adivina): casas/<id>/logo-<azar>.png, bloques/<id>/<azar>.jpg. */
import { EditorContenido } from './EditorContenido.js';
import { EditorBloques } from './EditorBloques.js';
import { Trabajo, Proyecto } from '../../../contenido/Casa.js';
import { AVATAR, CABECERA } from '../../../contenido/medidas.js';
import { idiomaNombre } from '../../../contenido/comun.js';
import { medidasDe } from '../../archivos.js';

const EXT = { 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' };
const extDe = (archivo) => EXT[archivo.type] || (archivo.name.split('.').pop() || '').toLowerCase().replace('jpeg', 'jpg');
/* La escala optica de la cinta (data/projects.js): (1.7 / proporcion) ^ 0.35, entre 0.62 y 1.30 */
const escalaDe = (w, h) => Math.round(Math.min(1.3, Math.max(0.62, (1.7 / (w / h)) ** 0.35)) * 100) / 100;
const REGLA = { avatar: AVATAR, banner: CABECERA };

class EditorCasa extends EditorContenido {
  static plantillaVersion = 'version-casa';
  static guionesEnId = true;

  armar() {
    super.armar();
    this.imagenes = {};                       // campo → { archivo, m, ok } de lo elegido
    this.pendientes = new Map();              // id de bloque → archivo de imagen elegido
    this.docs = {};                           // idioma → { version, bloques }
    this.idiomaPagina = '';
    this.nTrabajo = 0;
    const f = this.form;
    this.bloques = new EditorBloques(this.$('[data-bloques]'), {
      tx: this.tx.bloques || {},
      alElegirImagen: (id, archivo) => this.pendientes.set(id, archivo),
      cargarImagen: (ruta) => this.cargarImagen(ruta),
      decir: (texto) => this.decir(texto),
      ningunArchivo: this.tx.ningunArchivo,
      enlaceMalo: this.tx.errores && this.tx.errores.enlace
    });
    for (const campo of ['logo', 'avatar', 'banner']) f.elements[campo].addEventListener('change', () => this.medir(campo));
    this.$('[data-otro-trabajo]').addEventListener('click', () => {
      const t = this.agregarTrabajo();
      t.querySelector('input').focus();
    });
    f.addEventListener('click', (e) => {
      const b = e.target.closest ? e.target.closest('[data-quitar-trabajo]') : null;
      if (!b || !f.contains(b)) return;
      b.closest('[data-trabajo]').remove();
      this.$('[data-otro-trabajo]').focus();
    });
    /* Los idiomas de la pagina son el original y los de cada version */
    const selector = this.$('[data-pagina-idioma]');
    selector.addEventListener('change', () => this.cambiarPagina(selector.value));
    f.addEventListener('change', (e) => {
      if (e.target.name === 'idiomaOriginal' || e.target.name === 'v-idioma') this.pintarIdiomasPagina();
    });
    f.querySelector('[data-dev-version]').addEventListener('click', () => this.pintarIdiomasPagina());
    f.addEventListener('click', (e) => {
      if (e.target.closest && e.target.closest('[data-quitar-version]')) setTimeout(() => this.pintarIdiomasPagina(), 0);
    });
  }

  get cx() { return (this.tx && this.tx.casas) || {}; }
  tituloDe(c) { return c.name || c.id; }
  detalleDe(c) { return `/${c.id}/ · ${(c.idiomaOriginal || '').toUpperCase()}`; }

  async cargarImagen(ruta) {
    const be = this.ctx.be;
    if (!be || !be.contenido || !be.contenido.descargar) return null;
    const r = await be.contenido.descargar(ruta);
    return r.ok ? r.blob : null;
  }

  /* ---- La pagina en cada idioma -------------------------------------------------------------- */
  idiomasPagina() {
    const f = this.form;
    const l = [f.elements.idiomaOriginal.value, ...this.versiones().map((v) => v.querySelector('[name="v-idioma"]').value)];
    return [...new Set(l.filter(Boolean))];
  }
  pintarIdiomasPagina() {
    const sel = this.$('[data-pagina-idioma]');
    const idiomas = this.idiomasPagina();
    /* Corregir el idioma original (de «español» a «portugués», por ejemplo) se lleva la
       pagina ya escrita al idioma nuevo: no se pierde por cambiar el nombre */
    const orig = this.form.elements.idiomaOriginal.value;
    const antes = this.originalAntes;
    if (antes && antes !== orig) {
      if (this.idiomaPagina) this.docs[this.idiomaPagina] = this.bloques.leer();
      const vacio = (d) => !d || !d.bloques || !d.bloques.length;
      if (!idiomas.includes(antes) && !vacio(this.docs[antes]) && vacio(this.docs[orig])) {
        this.docs[orig] = this.docs[antes];
        delete this.docs[antes];
        if (this.idiomaPagina === antes) this.idiomaPagina = '';
      }
    }
    this.originalAntes = orig;
    sel.replaceChildren(...idiomas.map((l) => {
      const o = document.createElement('option');
      o.value = l;
      o.textContent = idiomaNombre(l) || l;
      return o;
    }));
    if (!idiomas.includes(this.idiomaPagina)) this.cambiarPagina(idiomas[0] || '');
    else sel.value = this.idiomaPagina;
  }
  cambiarPagina(lang) {
    if (this.idiomaPagina) this.docs[this.idiomaPagina] = this.bloques.leer();
    this.idiomaPagina = lang;
    this.$('[data-pagina-idioma]').value = lang;
    this.bloques.cargar(this.docs[lang] || { bloques: [] });
  }

  /* ---- Las imagenes de la tarjeta: medirlas y verlas antes de subir ----------------------------- */
  async medir(campo) {
    const caja = this.$(`[data-imagen="${campo}"]`);
    const input = this.form.elements[campo];
    const archivo = input.files && input.files[0];
    const salida = caja.querySelector('[data-medida]');
    const muestra = caja.querySelector('[data-muestra]');
    if (!archivo) { delete this.imagenes[campo]; salida.textContent = ''; muestra.hidden = true; return; }
    const ext = extDe(archivo);
    const m = await medidasDe(archivo, ext);
    const cx = this.cx;
    const llenar = (t, ej) => t.replace('{w}', m ? m.w : '?').replace('{h}', m ? m.h : '?').replace('{ew}', ej ? ej.w : '').replace('{eh}', ej ? ej.h : '');
    let ok = !!m;
    let texto = m ? llenar(cx.logoMide) : cx.ilegible;
    if (m && REGLA[campo]) {
      const r = REGLA[campo].revisar(m);
      ok = r.ok;
      texto = r.ok ? llenar(cx.mide) : r.clave === 'pequeno' ? llenar(cx.mideChica) : llenar(cx.mideMal, REGLA[campo].ejemplo);
    }
    this.imagenes[campo] = { archivo, m, ok, ext, texto };
    salida.textContent = texto;
    salida.classList.toggle('dev__medida--mal', !ok);
    if (m) this.pintarMuestra(caja, archivo); else muestra.hidden = true;
  }
  async pintarMuestra(caja, blob) {
    const lienzo = caja.querySelector('[data-lienzo]');
    const muestra = caja.querySelector('[data-muestra]');
    try {
      const img = await createImageBitmap(blob);
      const alto = caja.dataset.imagen === 'banner' ? 105 : 80;
      lienzo.height = alto;
      lienzo.width = Math.max(1, Math.round(alto * (img.width / img.height)));
      const c = lienzo.getContext('2d');
      c.clearRect(0, 0, lienzo.width, lienzo.height);
      c.drawImage(img, 0, 0, lienzo.width, lienzo.height);
      if (img.close) img.close();
      muestra.hidden = false;
    } catch (e) { muestra.hidden = true; }
  }
  /* Un error de la pagina en un idioma que no se esta viendo: dice cual y en que bloque
     («Inglés, bloque 3: Falta esto.»); el foco va al selector de idioma de la pagina */
  textoDeError(e) {
    const base = super.textoDeError(e);
    const m = /^cuerpo\.([a-z]{2})\.bloques\.(\d+)/.exec(e.campo);
    if (!m || m[1] === this.idiomaPagina || !this.tx.enOtroIdioma) return base;
    return this.tx.enOtroIdioma.replace('{idioma}', idiomaNombre(m[1]) || m[1]).replace('{n}', Number(m[2]) + 1).replace('{texto}', base);
  }

  avisosPropios() {
    return Object.entries(this.imagenes).filter(([, x]) => !x.ok).map(([campo]) => ({ campo, clave: 'medida', bloquea: true }));
  }
  mostrarErrores(errores, avisos) {
    super.mostrarErrores(errores.map((e) => (e.clave === 'medida' ? { ...e, clave: 'ruta' } : e)), avisos);
    /* El de una imagen que no encaja ya dice su medida debajo: ese texto manda */
    for (const e of errores) if (e.clave === 'medida' && this.imagenes[e.campo]) this.marcar(this.campoDe(e.campo), this.imagenes[e.campo].texto);
  }

  /* ---- Lo que hice con ellos ----------------------------------------------------------------- */
  agregarTrabajo(w) {
    const base = this.$('template[data-plantilla="trabajo-casa"]');
    const t = base.content.cloneNode(true).firstElementChild;
    const n = ++this.nTrabajo;
    t.querySelectorAll('[data-id]').forEach((x) => { x.id = `${this.constructor.id}-${x.dataset.id}-${n}`; });
    t.querySelectorAll('[data-para]').forEach((x) => { x.htmlFor = `${this.constructor.id}-${x.dataset.para}-${n}`; });
    this.$('[data-trabajos]').appendChild(t);
    const i = this.$('[data-trabajos]').children.length - 1;
    t.dataset.campo = `works.${i}`;
    if (w) {
      t.querySelector('[name="w-titulo"]').value = w.titulo || '';
      t.querySelector('[name="w-ano"]').value = w.year || '';
      t.querySelector('[name="w-enlace"]').value = w.href || '';
    }
    return t;
  }

  /* ---- Del formulario a los datos de una casa ------------------------------------------------- */
  leer(f) {
    const orig = f.elements.idiomaOriginal.value;
    const role = f.elements.role.value ? { [orig]: f.elements.role.value } : {};
    const blurb = f.elements.blurb.value ? { [orig]: f.elements.blurb.value } : {};
    for (const v of this.versiones()) {
      const l = v.querySelector('[name="v-idioma"]').value;
      const r = v.querySelector('[name="v-role"]').value;
      const b = v.querySelector('[name="v-blurb"]').value;
      if (l && r) role[l] = r;
      if (l && b) blurb[l] = b;
    }
    /* Los trabajos: el titulo va en el idioma original */
    const filas = [...this.$('[data-trabajos]').children];
    filas.forEach((t, i) => { t.dataset.campo = `works.${i}`; });
    const works = filas.map((t) => ({
      title: { [orig]: t.querySelector('[name="w-titulo"]').value },
      year: t.querySelector('[name="w-ano"]').value.trim(),
      href: t.querySelector('[name="w-enlace"]').value.trim()
    })).filter((w) => w.title[orig] || w.year || w.href);
    /* La pagina: lo que se ve ahora y lo guardado en memoria de los otros idiomas */
    if (this.idiomaPagina) this.docs[this.idiomaPagina] = this.bloques.leer();
    this.bloques.numerar(`cuerpo.${this.idiomaPagina}.bloques`);
    const vale = new Set(this.idiomasPagina());
    const cuerpo = Object.fromEntries(Object.entries(this.docs).filter(([l, d]) => vale.has(l) && d && d.bloques && d.bloques.length));
    const a = this.actual;
    return {
      id: f.elements.id.value.trim(),
      idiomaOriginal: orig,
      name: f.elements.titulo.value,
      role, blurb,
      tags: f.elements.etiquetas.value.split(','),
      logo: a && a.logo ? { ...a.logo } : null,
      avatar: a ? a.avatar : '',
      banner: a ? a.banner : '',
      works,
      cuerpo: JSON.parse(JSON.stringify(cuerpo)),
      orden: a ? a.orden : 0
    };
  }

  preparar(datos) {
    const subidas = [];
    const id = datos.id;
    const casa = (nombre, archivo, ext) => {
      const ruta = `casas/${id}/${nombre}-${this.sufijo()}.${ext}`;
      subidas.push({ ruta, archivo });
      return ruta;
    };
    const logo = this.imagenes.logo;
    if (logo && logo.ok && logo.m) datos.logo = { src: casa('logo', logo.archivo, logo.ext), w: logo.m.w, h: logo.m.h, scale: escalaDe(logo.m.w, logo.m.h) };
    for (const campo of ['avatar', 'banner']) {
      const x = this.imagenes[campo];
      if (x && x.ok) datos[campo] = casa(campo, x.archivo, x.ext);
    }
    /* Las imagenes elegidas en los bloques (de cualquier idioma de la pagina) */
    const ver = (b) => {
      if (b.tipo === 'imagen' && this.pendientes.has(b.id)) {
        const archivo = this.pendientes.get(b.id);
        const ruta = `bloques/${id}/${this.sufijo()}.${extDe(archivo)}`;
        b.src = ruta;
        subidas.push({ ruta, archivo, bloque: b.id });
      }
      if (b.tipo === 'columnas') b.columnas.forEach((col) => col.forEach(ver));
    };
    for (const doc of Object.values(datos.cuerpo)) doc.bloques.forEach(ver);
    return subidas;
  }

  async guardar() {
    const bien = await super.guardar();
    /* Lo que se subio bien ya no esta pendiente: la ruta queda en el documento guardado */
    if (bien && this.actual) {
      for (const doc of Object.values(this.actual.cuerpo)) {
        const marcar = (b) => {
          if (b.tipo === 'imagen' && b.src) this.pendientes.delete(b.id);
          if (b.tipo === 'columnas') b.columnas.forEach((col) => col.forEach(marcar));
        };
        doc.bloques.forEach(marcar);
      }
      this.docs = Object.fromEntries(Object.entries(this.actual.cuerpo).map(([l, d]) => [l, d.aJSON()]));
      this.bloques.cargar(this.docs[this.idiomaPagina] || { bloques: [] });
      this.imagenes = {};
    }
    return bien;
  }

  /* ---- De una casa guardada al formulario ----------------------------------------------------- */
  abrir(obj) {
    this.imagenes = {};
    this.pendientes = new Map();
    this.docs = obj ? Object.fromEntries(Object.entries(obj.cuerpo).map(([l, d]) => [l, d.aJSON()])) : {};
    this.idiomaPagina = '';
    this.originalAntes = '';
    this.$('[data-trabajos]').replaceChildren();
    this.nTrabajo = 0;
    for (const caja of this.caja.querySelectorAll('[data-imagen]')) {
      caja.querySelector('[data-medida]').textContent = '';
      caja.querySelector('[data-muestra]').hidden = true;
      caja.querySelector('[data-ya]').hidden = true;
    }
    super.abrir(obj);
    this.pintarIdiomasPagina();
  }
  poner(c) {
    const f = this.form;
    f.elements.idiomaOriginal.value = c.idiomaOriginal;
    f.elements.titulo.value = c.name;
    f.elements.id.value = c.id;
    f.elements.role.value = c.role[c.idiomaOriginal] || '';
    f.elements.blurb.value = c.blurb[c.idiomaOriginal] || '';
    f.elements.etiquetas.value = c.tags.join(', ');
    const idiomas = new Set([...Object.keys(c.role), ...Object.keys(c.blurb), ...Object.keys(c.cuerpo)]);
    idiomas.delete(c.idiomaOriginal);
    for (const lang of idiomas) this.agregarVersion({ lang, role: c.role[lang], blurb: c.blurb[lang], ia: c.ia.traducidoConIA(lang) });
    for (const w of c.works) this.agregarTrabajo({ titulo: w.title[c.idiomaOriginal] || Object.values(w.title)[0] || '', year: w.year, href: w.href });
    this.ponerIA(c.ia);
    this.pintarYaSubidos(c);
  }
  ponerVersion(v, d) {
    v.querySelector('[name="v-idioma"]').value = d.lang;
    v.querySelector('[name="v-role"]').value = d.role || '';
    v.querySelector('[name="v-blurb"]').value = d.blurb || '';
    v.querySelector('[name="v-ia"]').checked = !!d.ia;
  }
  pintarYaSubidos(c) {
    const rutas = { logo: c.logo && c.logo.src, avatar: c.avatar, banner: c.banner };
    for (const [campo, ruta] of Object.entries(rutas)) {
      const caja = this.$(`[data-imagen="${campo}"]`);
      caja.querySelector('[data-ya]').hidden = !ruta;
      if (ruta) this.cargarImagen(ruta).then((blob) => { if (blob && !this.imagenes[campo]) this.pintarMuestra(caja, blob); }, () => {});
    }
  }
}

export class EditorTrabajos extends EditorCasa {
  static id = 'trabajos';
  static Tipo = Trabajo;
}
export class EditorProyectos extends EditorCasa {
  static id = 'proyectos';
  static Tipo = Proyecto;
}
