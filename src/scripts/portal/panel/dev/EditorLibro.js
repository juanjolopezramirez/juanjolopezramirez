/* Developer-Mode → Libros (components/portal/dev/EditorLibro.astro).

   Lo propio de un libro:
     · el PDF de su idioma original y, si hay, el de cada version (otra lengua);
     · el LOMO: al elegir (o soltar) el PNG se mide AQUI, antes de subirlo, contra la regla
       de su grosor (contenido/medidas.js), y se pinta de pie en un estante pequeño. Si no
       tiene la forma, se abre la ventana de recorte (RecorteImagen.js) con el marco del
       grosor elegido (o, en automatico, el de los tres que menos corta): sale un PNG de la
       medida del ejemplo (240, 300 o 375 × 1200) y queda en el mismo campo. Si se cancela,
       no se guarda, se dice que medida debe tener y «Recortar el lomo…» la vuelve a abrir.
       Arriba, la medida ideal del grosor elegido;
     · las rutas del almacen salen del id (Libro.rutaPdf / rutaLomo), con un trozo al azar:
       el lomo, porque el cajon de imagenes es publico y un borrador no se adivina; el PDF,
       para que el de un borrador no pise el del libro ya publicado. */
import { EditorContenido } from './EditorContenido.js';
import { Libro } from '../../../contenido/Libro.js';
import { LOMOS, GROSORES, RATIO_LOMO } from '../../../contenido/medidas.js';
import { encajeDeLomo, medidaDeLomoAceptable } from '../../../contenido/taller/LomoLibro.js';
import { encajeDeRecorte } from '../../../contenido/taller/Recorte.js';
import { TONOS } from '../../../biblioteca.js';
import { medidasDe } from '../../archivos.js';
import { recortarImagen } from './RecorteImagen.js';
import { ponerEnInput } from '../soltar.js';

/* El grosor (de los tres) cuya forma se parece mas a la de una imagen: el que menos corta */
export const grosorMasCercano = (m) => GROSORES.reduce((a, g) => (Math.abs(Math.log((m.w / m.h) / RATIO_LOMO[g])) < Math.abs(Math.log((m.w / m.h) / RATIO_LOMO[a])) ? g : a), GROSORES[0]);

/* El color promedio del borde de una imagen (para «Rellenar» cuando no se eligio un color del lomo) */
function colorDelBorde(fuente, w, h) {
  const c = document.createElement('canvas');
  c.width = 32; c.height = Math.max(1, Math.round(32 * (h / w)));
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(fuente, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let r = 0, v = 0, b = 0, n = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    if (x > 0 && y > 0 && x < c.width - 1 && y < c.height - 1) continue;
    const i = (y * c.width + x) * 4;
    r += d[i]; v += d[i + 1]; b += d[i + 2]; n++;
  }
  c.width = 0; c.height = 0;
  const hex = (x) => Math.round(x / n).toString(16).padStart(2, '0');
  return n ? `#${hex(r)}${hex(v)}${hex(b)}` : '#2b3a43';
}

export class EditorLibro extends EditorContenido {
  static id = 'libros';
  static Tipo = Libro;
  static plantillaVersion = 'version-libro';

  armar() {
    super.armar();
    this.lomoRevision = null;                  // { ok, texto } del ultimo PNG elegido
    const f = this.form;
    /* Un PNG nuevo puede pedir recorte; cambiar el grosor solo vuelve a medir */
    f.elements.lomo.addEventListener('change', () => this.revisarLomo(!this.poniendoRecorte));
    f.querySelectorAll('input[name="grosor"]').forEach((r) => r.addEventListener('change', () => { this.pintarIdeal(); this.revisarLomo(false); }));
    this.$('[data-lomo-recortar]').addEventListener('click', () => this.recortarLomo());
    this.pintarIdeal();
  }

  /* «Tamaño ideal: 300 × 1200 px (lomo medio).» o, en automatico, las tres medidas */
  pintarIdeal() {
    const lx = this.lx, g = (this.form.querySelector('input[name="grosor"]:checked') || {}).value || '';
    const e = g && LOMOS[g] ? LOMOS[g].ejemplo : null;
    this.$('[data-lomo-ideal]').textContent = e
      ? String(lx.lomoIdeal || '').replace('{w}', e.w).replace('{h}', e.h).replace('{grosor}', ((lx.grosores && lx.grosores[g]) || g).toLowerCase())
      : lx.lomoIdealAuto || '';
  }

  /* LA VENTANA DE RECORTE para el PNG elegido: el marco con la forma del grosor (el elegido o el mas cercano). Lo que
     sale es un PNG de la medida del ejemplo, que vuelve al mismo campo (y se mide otra vez: ya encaja). */
  async recortarLomo() {
    const f = this.form, input = f.elements.lomo, archivo = input.files && input.files[0];
    if (!archivo || this.recortando) return;
    /* Ocupado desde ya (antes de cualquier espera): dos clics o dos cambios seguidos no abren dos ventanas */
    this.recortando = true;
    let imagen = null;
    try {
      const m = await medidasDe(archivo, 'png');
      /* Sus medidas, de la cabecera: una imagen enorme no se abre (colgaria la pestaña) */
      if (!m || !medidaDeLomoAceptable(m)) return;
      const elegido = (f.querySelector('input[name="grosor"]:checked') || {}).value || '';
      const g = elegido && LOMOS[elegido] ? elegido : grosorMasCercano(m);
      const salida = { ancho: LOMOS[g].ejemplo.w, alto: LOMOS[g].ejemplo.h };
      imagen = await createImageBitmap(archivo);
      const r = await recortarImagen({ fuente: imagen, w: imagen.width, h: imagen.height, aspecto: salida.ancho / salida.alto, salida, estilo: 'panel' });
      if (!r) return;
      const img = { w: imagen.width, h: imagen.height };
      const e = r.modo === 'recortar' ? encajeDeRecorte(r.recorte, img, salida) : encajeDeLomo({ ancho: salida.ancho, alto: salida.alto, cabe: false }, 'rellenar', img);
      if (!e) return;
      const c = document.createElement('canvas');
      c.width = salida.ancho; c.height = salida.alto;
      const x = c.getContext('2d');
      x.fillStyle = TONOS[f.elements.tono.value] || colorDelBorde(imagen, img.w, img.h);
      x.fillRect(0, 0, c.width, c.height);
      x.imageSmoothingQuality = 'high';
      x.drawImage(imagen, e.s.x, e.s.y, e.s.w, e.s.h, e.d.x, e.d.y, e.d.w, e.d.h);
      const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
      c.width = 0; c.height = 0;
      if (!blob) return;
      const nombre = String(archivo.name || 'lomo').replace(/\.png$/i, '') + '-recortado.png';
      this.poniendoRecorte = true;
      try { ponerEnInput(input, new File([blob], nombre, { type: 'image/png' })); } finally { this.poniendoRecorte = false; }
    } catch (e) { /* se queda el aviso de la medida */ } finally {
      if (imagen && imagen.close) imagen.close();
      this.recortando = false;
      input.focus({ preventScroll: true });
    }
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
      /* La ficha del «ⓘ» (016) no se edita aqui (la escribe el Taller): se queda la que hay. Sin esto, guardar o publicar
         desde aqui la borraria de Recursos */
      ficha: a && a.ficha ? JSON.parse(JSON.stringify(a.ficha)) : {},
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
    this.$('[data-lomo-recortar]').hidden = true;
    this.pintarIdeal();
  }
  abrir(entrada) {
    super.abrir(entrada);
    if (!entrada) {
      this.$('[data-pdf-ya]').hidden = true;
      this.$('[data-lomo-ya]').hidden = true;
      this.lomoRevision = null;
      this.$('[data-lomo-medida]').textContent = '';
      this.$('[data-estante]').hidden = true;
      this.$('[data-lomo-recortar]').hidden = true;
      this.pintarIdeal();
    }
  }

  /* ---- El lomo: medirlo y pintarlo antes de subirlo ---------------------------------------- */
  /* `conRecorte`: un PNG recien elegido sin la forma del lomo abre la ventana de recorte */
  async revisarLomo(conRecorte = false) {
    const f = this.form;
    const archivo = f.elements.lomo.files && f.elements.lomo.files[0];
    const salida = this.$('[data-lomo-medida]');
    const estante = this.$('[data-estante]');
    const recortar = this.$('[data-lomo-recortar]');
    const lx = this.lx;
    this.quitarError(f.elements.lomo);
    recortar.hidden = true;
    if (!archivo) { this.lomoRevision = null; salida.textContent = ''; estante.hidden = true; return; }
    const m = await medidasDe(archivo, 'png');
    /* Una imagen enorme (de su cabecera) no se dibuja ni se recorta: colgaria la pestaña */
    if (m && !medidaDeLomoAceptable(m)) {
      this.lomoRevision = { ok: false, texto: lx.lomoGrande };
      salida.textContent = lx.lomoGrande;
      salida.classList.add('dev__medida--mal');
      estante.hidden = true;
      return;
    }
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
    /* Sin la forma (no solo chico): se recorta aqui mismo, en vez de quedar sin guardar */
    const sinForma = !bueno && m && resultados.some((x) => x.r.clave === 'proporcion');
    recortar.hidden = !sinForma;
    if (sinForma && conRecorte) await this.recortarLomo();
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
