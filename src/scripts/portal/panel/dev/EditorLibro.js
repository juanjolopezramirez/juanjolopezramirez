/* Developer-Mode → Libros (components/portal/dev/EditorLibro.astro).

   Lo propio de un libro:
     · el PDF de su idioma original y, si hay, el de cada version (otra lengua);
     · el LOMO: al elegir el PNG se mide AQUI, antes de subirlo, contra la regla de su
       grosor (contenido/medidas.js), y se pinta de pie en un estante pequeño. Si no
       encaja, no se guarda y se dice que medida debe tener;
     · las rutas del almacen salen del id (Libro.rutaPdf / rutaLomo), con un trozo al azar:
       el lomo, porque el cajon de imagenes es publico y un borrador no se adivina; el PDF,
       para que el de un borrador no pise el del libro ya publicado. */
import { EditorContenido } from './EditorContenido.js';
import { Libro } from '../../../contenido/Libro.js';
import { LOMOS, GROSORES } from '../../../contenido/medidas.js';
import { medidasDe } from '../../archivos.js';

export class EditorLibro extends EditorContenido {
  static id = 'libros';
  static Tipo = Libro;
  static plantillaVersion = 'version-libro';

  armar() {
    super.armar();
    this.lomoRevision = null;                  // { ok, texto } del ultimo PNG elegido
    const f = this.form;
    f.elements.lomo.addEventListener('change', () => this.revisarLomo());
    f.querySelectorAll('input[name="grosor"]').forEach((r) => r.addEventListener('change', () => this.revisarLomo()));
  }

  get lx() { return (this.tx && this.tx.libros) || {}; }

  tituloDe(l) { return l.textoEn('titulo', l.idiomaOriginal) || l.id; }
  detalleDe(l) {
    const idiomas = Object.keys(l.pdf).map((x) => x.toUpperCase()).join(' · ');
    return `#${l.id}${idiomas ? ' · ' + idiomas : ''}`;
  }

  /* ---- Del formulario a los datos de un Libro -------------------------------------------- */
  leer(f) {
    const orig = f.elements.idiomaOriginal.value;
    const titulo = { [orig]: f.elements.titulo.value };
    const subtitulo = f.elements.subtitulo.value ? { [orig]: f.elements.subtitulo.value } : {};
    for (const v of this.versiones()) {
      const l = v.querySelector('[name="v-idioma"]').value;
      const t = v.querySelector('[name="v-titulo"]').value;
      if (l && t) titulo[l] = t;
    }
    const a = this.actual;
    return {
      id: f.elements.id.value.trim(),
      idiomaOriginal: orig,
      titulo,
      subtitulo,
      seccion: f.elements.seccion.value,
      tipo: (f.querySelector('input[name="tipo"]:checked') || {}).value || '',
      grosor: (f.querySelector('input[name="grosor"]:checked') || {}).value || '',
      tono: f.elements.tono.value,
      etiquetas: f.elements.etiquetas.value.split(','),
      /* Lo ya subido se queda (solo los idiomas que siguen); lo nuevo lo pone preparar() */
      pdf: a ? Object.fromEntries(Object.entries(a.pdf).filter(([l]) => titulo[l])) : {},
      lomo: a ? { ...a.lomo } : {},
      orden: a ? a.orden : 0
    };
  }

  /* Las subidas pendientes y sus rutas (salen del id y del idioma, con un trozo al azar:
     el PDF nuevo de un borrador no pisa el del libro publicado, que la web sigue usando) */
  preparar(datos) {
    const f = this.form;
    const subidas = [];
    const pdf = (lang, input) => {
      const archivo = input && input.files && input.files[0];
      const ruta = Libro.rutaPdf(datos.id, lang, this.sufijo());
      if (!archivo || !ruta) return;
      datos.pdf[lang] = ruta;
      subidas.push({ ruta, archivo });
    };
    pdf(datos.idiomaOriginal, f.elements.pdf);
    for (const v of this.versiones()) pdf(v.querySelector('[name="v-idioma"]').value, v.querySelector('[name="v-pdf"]'));
    const lomo = f.elements.lomo.files && f.elements.lomo.files[0];
    if (lomo) {
      const ruta = Libro.rutaLomo(datos.id, 'todos', 'png', this.sufijo());
      if (ruta) { datos.lomo = { todos: ruta }; subidas.push({ ruta, archivo: lomo }); }
    }
    return subidas;
  }

  /* Un lomo que no encaja no se guarda (la regla de medidas.js, medida aqui antes de subir) */
  avisosPropios() {
    const r = this.lomoRevision;
    return r && !r.ok ? [{ campo: 'lomo', clave: 'proporcionLomo', bloquea: true }] : [];
  }
  mostrarErrores(errores, avisos) {
    /* El texto del lomo ya esta escrito debajo (con sus medidas): aqui solo se marca */
    const sinLomo = errores.filter((e) => e.clave !== 'proporcionLomo');
    super.mostrarErrores(sinLomo.length === errores.length ? errores : [...sinLomo, { campo: 'lomo', clave: 'ruta' }], avisos);
    if (sinLomo.length !== errores.length && this.lomoRevision) this.marcar(this.campoDe('lomo'), this.lomoRevision.texto);
  }

  /* ---- De un Libro guardado al formulario --------------------------------------------------- */
  poner(l) {
    const f = this.form;
    f.elements.idiomaOriginal.value = l.idiomaOriginal;
    f.elements.titulo.value = l.titulo[l.idiomaOriginal] || '';
    f.elements.subtitulo.value = l.subtitulo[l.idiomaOriginal] || '';
    f.elements.id.value = l.id;
    f.elements.seccion.value = l.seccion;
    const marcar = (nombre, valor) => f.querySelectorAll(`input[name="${nombre}"]`).forEach((r) => { r.checked = r.value === valor; });
    marcar('tipo', l.tipo);
    marcar('grosor', l.grosor || '');
    f.elements.tono.value = l.tono || '';
    f.elements.etiquetas.value = l.etiquetas.join(', ');
    for (const lang of Object.keys(l.titulo)) {
      if (lang !== l.idiomaOriginal) this.agregarVersion({ lang, titulo: l.titulo[lang], ia: l.ia.traducidoConIA(lang), pdf: !!l.pdf[lang] });
    }
    this.ponerIA(l.ia);
    this.pintarYaSubidos(l);
  }
  ponerVersion(v, d) {
    v.querySelector('[name="v-idioma"]').value = d.lang;
    v.querySelector('[name="v-titulo"]').value = d.titulo || '';
    v.querySelector('[name="v-ia"]').checked = !!d.ia;
    const ya = v.querySelector('[data-pdf-ya]');
    if (ya) ya.hidden = !d.pdf;
  }
  pintarYaSubidos(l) {
    this.$('[data-pdf-ya]').hidden = !l.pdf[l.idiomaOriginal];
    this.$('[data-lomo-ya]').hidden = !Object.keys(l.lomo).length;
    this.lomoRevision = null;
    this.$('[data-lomo-medida]').textContent = '';
    this.$('[data-estante]').hidden = true;
  }
  abrir(entrada) {
    super.abrir(entrada);
    if (!entrada) {
      this.$('[data-pdf-ya]').hidden = true;
      this.$('[data-lomo-ya]').hidden = true;
      this.lomoRevision = null;
      this.$('[data-lomo-medida]').textContent = '';
      this.$('[data-estante]').hidden = true;
    }
  }

  /* ---- El lomo: medirlo y pintarlo antes de subirlo ---------------------------------------- */
  async revisarLomo() {
    const f = this.form;
    const archivo = f.elements.lomo.files && f.elements.lomo.files[0];
    const salida = this.$('[data-lomo-medida]');
    const estante = this.$('[data-estante]');
    const lx = this.lx;
    this.quitarError(f.elements.lomo);
    if (!archivo) { this.lomoRevision = null; salida.textContent = ''; estante.hidden = true; return; }
    const m = await medidasDe(archivo, 'png');
    const grosor = (f.querySelector('input[name="grosor"]:checked') || {}).value || '';
    /* Con el grosor automatico vale cualquiera de los tres (aun no se sabe cuantas paginas tendra) */
    const reglas = grosor ? [grosor] : GROSORES;
    const resultados = reglas.map((g) => ({ g, r: LOMOS[g].revisar(m) }));
    const bueno = resultados.find((x) => x.r.ok);
    const llenar = (plantilla, g) => plantilla
      .replace('{w}', m ? m.w : '?').replace('{h}', m ? m.h : '?')
      .replace('{grosor}', (lx.grosores && lx.grosores[g] || g).toLowerCase())
      .replace('{ew}', LOMOS[g].ejemplo.w).replace('{eh}', LOMOS[g].ejemplo.h);
    let texto;
    if (bueno) texto = llenar(lx.lomoMide, bueno.g);
    else if (!m) texto = lx.lomoIlegible;
    else if (resultados.some((x) => x.r.clave === 'pequeno')) texto = llenar(lx.lomoPequeno, reglas[0]);
    else texto = grosor ? llenar(lx.lomoMal, grosor) : llenar(lx.lomoMalAuto, 'medio');
    this.lomoRevision = { ok: !!bueno, texto };
    salida.textContent = texto;
    salida.classList.toggle('dev__medida--mal', !bueno);
    if (m) await this.pintarLomo(archivo, m); else estante.hidden = true;
  }

  /* El lomo de pie, a su proporcion, en un canvas (sin pedir img-src a la politica de
     contenido: el archivo no sale del navegador hasta guardar) */
  async pintarLomo(archivo, m) {
    const lienzo = this.$('[data-lomo-vista]');
    const estante = this.$('[data-estante]');
    try {
      const imagen = await createImageBitmap(archivo);
      const alto = 240;
      const ancho = Math.max(8, Math.round(alto * (m.w / m.h)));
      lienzo.width = ancho;
      lienzo.height = alto;
      const c = lienzo.getContext('2d');
      c.clearRect(0, 0, ancho, alto);
      c.drawImage(imagen, 0, 0, ancho, alto);
      if (imagen.close) imagen.close();
      estante.hidden = false;
    } catch (e) {
      estante.hidden = true;
    }
  }
}
