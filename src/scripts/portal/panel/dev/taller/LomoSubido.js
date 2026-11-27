/* LA IMAGEN DEL LOMO, en el «Lomo ▾» de la cinta. El autor sube su lomo entero (un PDF, PNG, JPG, WebP o SVG) y aqui se
   vuelve un PNG a la medida del lomo del libro (LomoLibro.js → planDeLomo): si su forma se parece a la del lomo (menos de un
   4 % de diferencia) se escala; si no, se abre la ventana de recorte (panel/dev/RecorteImagen.js) con el marco centrado:
   el autor lo mueve y lo acerca, o elige «Rellenar con el color del lomo» (la imagen entera, y lo que falta del color del
   lomo). Nunca se estira. Una imagen acostada se pone de pie. Mientras la pestaña siga abierta, «Ajustar el recorte…»
   vuelve a abrir la ventana con la imagen de antes (la original no se guarda: al recargar ya no esta).
   Arriba se dice la medida ideal (LomoLibro.js → medidaIdealDeLomo), segun el grueso y las hojas de ahora. Tambien se
   puede soltar el archivo en la caja (panel/soltar.js).

   El PNG se sube como las demas imagenes del libro, a `taller/<libro>/img/lomo-<azar>.png` (la misma carpeta y la misma
   cuenta que la imagen de arriba del contenido), y queda en `pagina.lomo.imagen = { ruta }`. «Ver como libro» la pinta en
   su lomo (VistaLibro.js) y la copia del libro la guarda (RutasLibro.js). Al quitarla, el archivo queda en el cajon como
   las demas imagenes que se dejan de usar.

   PARA UN ENLACE PRIVADO (lomoDeEdicion): una copia pequeña en WebP (unos 64 a 96 px de ancho y 1200 de alto, 20 a 60 KB)
   viaja dentro de la edicion, en hojas[0].lomo.img (lector/lomo.js), como una direccion «data:»: asi no hace falta tocar la
   base ni la funcion `vista`, y la politica del sitio ya deja `img-src data:`.

   Todo se arma nodo por nodo y con textContent. Las imagenes se leen como direcciones «data:» (la politica no deja «blob:»). */
import { encajeDeLomo, esRutaDelLomo, estiloDeLomo, grosorDelLomoMm, LOMO_COLOR, lomoParaEdicion, medidaDeLomoAceptable, medidaIdealDeLomo, mmTexto, planDeLomo } from '../../../../contenido/taller/LomoLibro.js';
import { encajeDeRecorte } from '../../../../contenido/taller/Recorte.js';
import { imagenDeLomoValida } from '../../../../lector/lomo.js';
import { recortarImagen } from '../RecorteImagen.js';
import { zonaDeSoltar } from '../../soltar.js';
import { esSvg, svgAPng } from './SvgAImagen.js';
import { medidasDe, revisarArchivo } from '../../../archivos.js';
/* Pdf.js pide pdf.js solo al abrir un PDF: importarlo aqui no baja nada de mas */
import { abrirPdf, leerPagina } from './Pdf.js';

const azar = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
const LADO_PDF = 2400;                 // el lado largo de la pagina del PDF, al pintarla
const ESPERA_MS = 15000;
const TIPOS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
let cuenta = 0;

function h(tag, attrs = {}, hijos = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'texto') e.textContent = v;
    else if (k === 'clase') e.className = v;
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of [].concat(hijos)) if (c) e.append(c);
  return e;
}

const aDireccion = (blob) => new Promise((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.onerror = () => mal(new Error('leer'));
  r.readAsDataURL(blob);
});

/* Una imagen ya lista para dibujar, de una direccion «data:», o un error si no se deja leer a tiempo */
async function abrirImagen(dir) {
  const img = new Image();
  img.decoding = 'async';
  img.src = dir;
  await Promise.race([img.decode(), new Promise((_, mal) => { setTimeout(() => mal(new Error('tarda')), ESPERA_MS); })]);
  if (!(img.naturalWidth > 0) || !(img.naturalHeight > 0)) throw new Error('vacia');
  /* Lo que llega de un SVG o un PDF ya viene a la medida; esto es por si acaso */
  if (!medidaDeLomoAceptable({ w: img.naturalWidth, h: img.naturalHeight })) throw Object.assign(new Error('grande'), { grande: true });
  return img;
}

const esPdf = (a) => !!a && (a.type === 'application/pdf' || /\.pdf$/i.test(String(a.name || '')));

/* La primera pagina de un PDF, pintada con su lado largo a LADO_PDF px → una direccion «data:» */
async function paginaDePdf(archivo) {
  const doc = await abrirPdf(archivo);
  try {
    const v = (await doc.getPage(1)).getViewport({ scale: 1 });
    const px = v.width > v.height ? { ancho: LADO_PDF, alto: 1 } : { ancho: 1, alto: LADO_PDF };
    const p = await leerPagina(doc, 1, px);
    return await aDireccion(p.blob);
  } finally {
    try { doc.loadingTask.destroy(); } catch (e) { /* ya cerrado */ }
  }
}

/* La imagen de pie (si `girar`, 90° a la derecha: el titulo de una imagen acostada queda de arriba abajo). El lienzo girado
   no pasa de DE_PIE_MAX px de lado: el PNG del lomo mide 2400 de alto como mucho, mas no hace falta. */
const DE_PIE_MAX = 4800;
function dePie(img, girar) {
  const w = img.naturalWidth, hh = img.naturalHeight;
  if (!medidaDeLomoAceptable({ w, h: hh })) throw Object.assign(new Error('grande'), { grande: true });
  if (!girar) return { fuente: img, w, h: hh };
  const k = Math.min(1, DE_PIE_MAX / Math.max(w, hh));
  const cw = Math.max(1, Math.round(hh * k)), ch = Math.max(1, Math.round(w * k));
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const g = c.getContext('2d');
  g.translate(cw, 0);
  g.rotate(Math.PI / 2);
  g.drawImage(img, 0, 0, ch, cw);
  return { fuente: c, w: cw, h: ch };
}

/* EL PNG DEL LOMO: la imagen, segun el plan y lo elegido, sobre el color del lomo. `eleccion`: { modo: 'escalar' |
   'rellenar' } o { modo: 'recortar', recorte } (el marco de la ventana, normalizado, sobre la imagen ya de pie). */
async function pngDeLomo(img, plan, eleccion, color) {
  const pie = dePie(img, plan.girar);
  const e = eleccion.modo === 'recortar' && eleccion.recorte
    ? encajeDeRecorte(eleccion.recorte, { w: pie.w, h: pie.h }, plan)
    : encajeDeLomo(plan, eleccion.modo, { w: pie.w, h: pie.h });
  if (!e) throw new Error('encaje');
  const c = document.createElement('canvas');
  c.width = plan.ancho; c.height = plan.alto;
  const g = c.getContext('2d');
  g.fillStyle = color || LOMO_COLOR;
  g.fillRect(0, 0, c.width, c.height);
  g.imageSmoothingQuality = 'high';
  g.drawImage(pie.fuente, e.s.x, e.s.y, e.s.w, e.s.h, e.d.x, e.d.y, e.d.w, e.d.h);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
  c.width = 0; c.height = 0;
  if (pie.fuente !== img) { pie.fuente.width = 0; pie.fuente.height = 0; }
  if (!blob || blob.type !== 'image/png') throw new Error('png');
  return blob;
}

/* ---- Para un enlace privado ---- */
const WEBP_ALTO = 1200, WEBP_ALTO_MAX = 4000, WEBP_ANCHO = { min: 16, max: 96 }, WEBP_BIEN = 82000;   // ~60 KB en base64
const WEBP_TOPES = [WEBP_ANCHO.max, 64, 48];

/* La medida de la copia pequeña para un ancho tope: siempre con la forma de la imagen (nunca se estira); un lomo muy fino se
   hace mas alto, no mas ancho */
function medidaPequena(forma, tope) {
  let alto = WEBP_ALTO, ancho = Math.round(alto * forma);
  if (ancho > tope) { ancho = tope; alto = Math.round(ancho / forma); }
  if (ancho < WEBP_ANCHO.min) { ancho = WEBP_ANCHO.min; alto = Math.min(WEBP_ALTO_MAX, Math.round(ancho / forma)); }
  return { ancho, alto };
}

/* La copia pequeña del lomo (una direccion «data:image/webp», o PNG si el navegador no hace WebP, como Safari), o '' si no
   se pudo. Tiene que pasar la misma revision que el lector (lector/lomo.js → imagenDeLomoValida: largo y medidas de la
   cabecera). Un PNG pesa mucho mas que un WebP: si no cabe, se prueba mas angosto (64 px, despues 48). `dir`: la imagen del
   lomo como «data:». */
export async function webpDeLomo(dir) {
  if (typeof dir !== 'string' || !dir.startsWith('data:image/')) return '';
  try {
    const img = await abrirImagen(dir);
    const forma = img.naturalWidth / img.naturalHeight;
    for (const tope of WEBP_TOPES) {
      const { ancho, alto } = medidaPequena(forma, tope);
      const c = document.createElement('canvas');
      c.width = ancho; c.height = alto;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, ancho, alto);
      let salida = '';
      for (const q of [0.82, 0.72, 0.6, 0.48, 0.36]) {
        salida = c.toDataURL('image/webp', q);
        if (!salida.startsWith('data:image/webp')) { salida = c.toDataURL('image/png'); break; }
        if (salida.length <= WEBP_BIEN) break;
      }
      c.width = 0; c.height = 0;
      if (imagenDeLomoValida(salida)) return salida;
    }
    return '';
  } catch (e) { return ''; }
}

/* Lo que Taller.contextoDeCompartir entrega del lomo: los datos limpios, la ruta de la imagen (solo si es de la carpeta de
   ESTE libro, `obraId`) y quien la trae del cajon */
export function contextoDeLomo(pagina, dame, obraId) {
  return { ...lomoParaEdicion(pagina && pagina.lomo, pagina && pagina.anchoMm, obraId), obraId, dame };
}

/* El lomo de una edicion nueva (Publicar.js): { c?, t?, x?, g?, img? }. Si la imagen no se puede traer o achicar, va sin ella
   (Publicar.js lo dice). Solo se pide al cajon una imagen de la carpeta de este libro. */
export async function lomoDeEdicion(ctx) {
  if (!ctx || typeof ctx !== 'object') return null;
  const salida = { ...(ctx.datos || {}) };
  if (ctx.ruta && esRutaDelLomo(ctx.ruta, ctx.obraId) && typeof ctx.dame === 'function') {
    try {
      const img = await webpDeLomo(await ctx.dame(ctx.ruta));
      if (img) salida.img = img;
    } catch (e) { /* sin imagen */ }
  }
  return Object.keys(salida).length ? salida : null;
}

/* ---- En la cinta ---- */
export class LomoSubido {
  /* `caja`: el hueco del «Lomo ▾» ([data-tal-lomo-imagen]). `libro()` → { id, pagina, hojas, editable } o null.
     `subir(ruta, archivo)` → { error? } (el cajon del Taller). `imagenes()` → las imagenes del libro (Imagenes.js).
     `turno()`: cambia al abrir otro libro (lo que llega tarde se tira). `alCambiar(imagen | null)`: la pone o la quita del
     libro y lo guarda. `alDecir(t)`, `alError(clave)`: lo dice la mesa. */
  constructor(caja, { tx, libro, subir, imagenes, turno = () => 0, alCambiar, alDecir = () => {}, alError = () => {} }) {
    Object.assign(this, { caja, tx, libro, subir, imagenes, turno, alCambiar, alDecir, alError });
    this.n = ++cuenta;
    this.ocupado = false;
    /* La imagen de la ultima subida, para «Ajustar el recorte…» (solo en esta pestaña): { img, turno, libro, recorte } */
    this.original = null;
    this.armar();
  }

  armar() {
    const tx = this.tx;
    this.archivo = h('input', { type: 'file', hidden: true, tabindex: '-1', 'aria-hidden': 'true',
      accept: '.pdf,.png,.jpg,.jpeg,.webp,.svg,application/pdf,image/png,image/jpeg,image/webp,image/svg+xml' });
    this.bPoner = h('button', { clase: 'tal-btn', type: 'button', texto: tx.lomoImagenPoner });
    this.bAjustar = h('button', { clase: 'tal-btn', type: 'button', texto: tx.lomoImagenAjustar, hidden: true });
    this.bQuitar = h('button', { clase: 'tal-btn', type: 'button', texto: tx.lomoImagenQuitar, hidden: true });
    this.ideal = h('p', { clase: 'tal-ayuda tal-lomo__ideal' });
    this.estado = h('p', { clase: 'tal-ayuda tal-lomo__estado', role: 'status' });
    this.aviso = h('p', { clase: 'tal-ayuda tal-lomo__aviso', texto: tx.lomoImagenRecorte, hidden: true });
    this.caja.replaceChildren(
      h('p', { clase: 'tal-rotulo', texto: tx.lomoImagen }),
      this.ideal,
      h('div', { clase: 'tal-lomo__imagen-fila' }, [this.bPoner, this.bAjustar, this.bQuitar]),
      this.estado,
      this.aviso,
      this.archivo
    );
    this.estado.textContent = tx.lomoImagenAyuda;
    this.bPoner.addEventListener('click', () => { if (!this.ocupado) this.archivo.click(); });
    this.archivo.addEventListener('change', () => {
      const a = this.archivo.files && this.archivo.files[0];
      this.archivo.value = '';
      if (a) this.traer(a);
    });
    this.bAjustar.addEventListener('click', () => this.ajustar());
    this.bQuitar.addEventListener('click', () => this.quitar());
    /* Soltar el archivo en la caja: lo mismo que elegirlo */
    zonaDeSoltar(this.caja, {
      acepta: ['pdf', 'png', 'jpg', 'webp', 'svg'], chip: true,
      activa: () => { const l = this.libro(); return !!(l && l.editable) && !this.ocupado; },
      alSoltar: (a) => this.traer(a)
    });
    /* La medida ideal cambia con el grueso (y las hojas): se vuelve a decir al abrir el «Lomo ▾» y al escribir el grueso.
       (Despues del que lo guarda: este escucha mas adentro, por eso espera un momento.) */
    const panel = this.caja.closest('.tal-lomo');
    const plegable = this.caja.closest('details');
    /* La imagen de antes (para «Ajustar el recorte…») vive mientras el «Lomo ▾» siga abierto: al cerrarlo, o al salir
       del libro (la mesa se esconde), se suelta y no queda ocupando memoria */
    if (plegable) plegable.addEventListener('toggle', () => { if (plegable.open) this.pintarIdeal(); else this.soltarOriginal(); });
    const mesa = this.caja.closest('[data-tal-mesa]');
    if (mesa) new MutationObserver(() => { if (mesa.hidden) this.soltarOriginal(); }).observe(mesa, { attributes: true, attributeFilter: ['hidden'] });
    if (panel) panel.addEventListener('input', () => setTimeout(() => this.pintarIdeal(), 0));
  }

  soltarOriginal() {
    if (!this.original || this.ocupado) return;
    this.original = null;
    this.pintar();
  }

  /* El lomo pequeño de la cinta ([data-tal-lomo-muestra]) lleva la imagen encima, si hay */
  muestra() {
    const p = this.caja.closest('.tal-lomo');
    return p ? p.querySelector('[data-tal-lomo-muestra]') : null;
  }

  /* «Tamaño ideal: 154 × 2400 px (13,5 × 210 mm, 290 ppp)» con el grueso y las hojas de ahora */
  pintarIdeal() {
    const l = this.libro();
    /* El grueso que se esta escribiendo cuenta ya (el libro lo guarda un poco despues); vacio = automatico */
    const campo = this.caja.closest('.tal-lomo') && this.caja.closest('.tal-lomo').querySelector('[name="lomoGrosor"]');
    const escrito = campo ? (campo.value === '' ? 'auto' : Number(campo.value)) : null;
    const lomo = l && l.pagina ? (escrito === null || (escrito !== 'auto' && !Number.isFinite(escrito)) ? l.pagina.lomo : { ...l.pagina.lomo, grosor: escrito }) : null;
    const m = lomo ? medidaIdealDeLomo(lomo, l.hojas, { anchoMm: l.pagina.anchoMm, altoMm: l.pagina.altoMm }) : null;
    this.ideal.hidden = !m;
    this.ideal.textContent = m ? this.tx.lomoIdeal.replace('{w}', m.ancho).replace('{h}', m.alto).replace('{g}', mmTexto(m.grosorMm)).replace('{a}', mmTexto(m.altoMm)).replace('{ppp}', m.ppp) : '';
  }

  /* Como esta el libro abierto: los botones, y la imagen en la muestra */
  pintar() {
    const l = this.libro();
    /* La imagen de antes es de ESTE libro, abierto esta vez: si se abrio otro, ya no vale */
    if (this.original && (this.original.turno !== this.turno() || !l || this.original.libro !== l.id)) this.original = null;
    const ruta = l && l.pagina && l.pagina.lomo.imagen && esRutaDelLomo(l.pagina.lomo.imagen.ruta, l.id) ? l.pagina.lomo.imagen.ruta : '';
    if (!ruta) this.original = null;
    const editable = !!(l && l.editable);
    this.aviso.hidden = !ruta;
    this.bPoner.textContent = ruta ? this.tx.lomoImagenCambiar : this.tx.lomoImagenPoner;
    this.bPoner.disabled = !editable || this.ocupado;
    this.bAjustar.hidden = !(ruta && this.original);
    this.bAjustar.disabled = !editable || this.ocupado;
    this.bQuitar.hidden = !ruta;
    this.bQuitar.disabled = !editable || this.ocupado;
    if (!editable && l) this.estado.textContent = this.tx.lomoImagenSoloEditar;
    else if (!this.ocupado && this.estado.textContent === this.tx.lomoImagenSoloEditar) this.estado.textContent = this.tx.lomoImagenAyuda;
    this.pintarIdeal();
    this.pintarMuestra(ruta);
  }

  pintarMuestra(ruta) {
    const m = this.muestra();
    if (!m) return;
    let img = m.querySelector('.tal-lomo__muestra-img');
    if (!ruta) { if (img) img.remove(); m.classList.remove('tal-lomo__muestra--imagen'); this.rutaMuestra = ''; return; }
    if (this.rutaMuestra === ruta && img) return;
    this.rutaMuestra = ruta;
    const im = this.imagenes();
    if (!im) return;
    Promise.resolve(im.dame(ruta)).then((dir) => {
      if (this.rutaMuestra !== ruta || typeof dir !== 'string' || !dir.startsWith('data:image/')) return;
      img = m.querySelector('.tal-lomo__muestra-img') || h('img', { clase: 'tal-lomo__muestra-img', alt: '' });
      img.src = dir;
      if (!img.isConnected) m.append(img);
      m.classList.add('tal-lomo__muestra--imagen');
    }).catch(() => {});
  }

  decir(t) { this.estado.textContent = t; }

  ocupar(si) {
    this.ocupado = si;
    this.caja.setAttribute('aria-busy', String(si));
    this.pintar();
  }

  /* El plan del lomo de AHORA (el grueso y las hojas pueden haber cambiado) para una imagen */
  planPara(img) {
    const l = this.libro();
    if (!l || !l.pagina) return null;
    const c = l.pagina;
    return planDeLomo({ w: img.naturalWidth, h: img.naturalHeight }, { grosorMm: grosorDelLomoMm(c.lomo, l.hojas, c.anchoMm), altoMm: c.altoMm });
  }

  /* ---- Traer un archivo: de lo que sea a una imagen, y el plan ---- */
  async traer(archivo) {
    const l = this.libro();
    if (!l || !l.editable || this.ocupado) return;
    const turno = this.turno();
    this.ocupar(true);
    this.decir(this.tx.lomoImagenLeyendo);
    try {
      const dir = await this.leer(archivo, l.id);
      if (!dir) return;
      if (turno !== this.turno()) return;
      const img = await abrirImagen(dir);
      const plan = this.planPara(img);
      if (!plan) { this.decir(this.tx.lomoImagenNoLee); return; }
      /* Ya tiene la forma del lomo: se escala sin preguntar (y queda «Ajustar el recorte…» por si acaso) */
      if (plan.cabe) { await this.hacer(img, plan, { modo: 'escalar' }, turno); return; }
      this.decir('');
      const eleccion = await this.preguntar(img, plan, null);
      if (turno !== this.turno()) return;
      if (!eleccion) { this.decir(this.tx.lomoImagenAyuda); return; }
      await this.hacer(img, plan, eleccion, turno);
    } catch (e) {
      if (turno === this.turno()) this.decir(e && e.grande ? this.tx.lomoImagenGrande : this.tx.lomoImagenNoLee);
    } finally {
      this.ocupar(false);
      /* Tras la ventana, el boton que la abrio estaba apagado: el foco no se pierde */
      if (!document.activeElement || document.activeElement === document.body) (this.bAjustar.hidden ? this.bPoner : this.bAjustar).focus();
    }
  }

  /* La ventana de recorte con la imagen de pie (y el marco de antes, si lo hay) → la eleccion o null */
  async preguntar(img, plan, recorte) {
    const pie = dePie(img, plan.girar);
    try {
      return await recortarImagen({ fuente: pie.fuente, w: pie.w, h: pie.h, aspecto: plan.ancho / plan.alto, salida: plan, recorte, estilo: 'taller' });
    } finally {
      if (pie.fuente !== img) { pie.fuente.width = 0; pie.fuente.height = 0; }
    }
  }

  /* «Ajustar el recorte…»: la imagen de antes, con el grueso de ahora */
  async ajustar() {
    const o = this.original, l = this.libro();
    if (!o || !l || !l.editable || this.ocupado) return;
    const turno = this.turno();
    this.ocupar(true);
    try {
      const plan = this.planPara(o.img);
      if (!plan) { this.decir(this.tx.lomoImagenNoLee); return; }
      const eleccion = await this.preguntar(o.img, plan, o.recorte);
      if (turno !== this.turno()) return;
      if (!eleccion) { this.decir(this.tx.lomoImagenSinCambio); return; }
      await this.hacer(o.img, plan, eleccion, turno);
    } catch (e) {
      if (turno === this.turno()) this.decir(e && e.grande ? this.tx.lomoImagenGrande : this.tx.lomoImagenNoLee);
    } finally {
      this.ocupar(false);
      if (!this.bAjustar.hidden) this.bAjustar.focus(); else this.bPoner.focus();
    }
  }

  /* → una direccion «data:» de la imagen, o '' (y lo dice) */
  async leer(archivo, obraId) {
    if (esSvg(archivo)) {
      const png = await svgAPng(archivo);
      if (!png) { this.alError('svgNoLee'); this.decir(''); return ''; }
      return aDireccion(png);
    }
    if (esPdf(archivo)) {
      const mira = await revisarArchivo(`taller/${obraId}/pdf/lomo.pdf`, archivo);
      if (mira.error) { this.alError(mira.error); this.decir(''); return ''; }
      return paginaDePdf(archivo);
    }
    const ext = TIPOS[archivo.type];
    if (!ext) { this.alError('archivoTipo'); this.decir(''); return ''; }
    const mira = await revisarArchivo(`taller/${obraId}/img/lomo.${ext}`, archivo);
    if (mira.error) { this.alError(mira.error); this.decir(''); return ''; }
    /* Sus medidas, de la cabecera y ANTES de dibujarla: una imagen enorme colgaria la pestaña */
    const m = await medidasDe(archivo, ext);
    if (!m) { this.decir(this.tx.lomoImagenNoLee); return ''; }
    if (!medidaDeLomoAceptable(m)) { this.decir(this.tx.lomoImagenGrande); return ''; }
    return aDireccion(archivo);
  }

  /* El PNG a la medida del lomo, subido y puesto en el libro */
  async hacer(img, plan, eleccion, turno) {
    const l = this.libro();
    if (!l || turno !== this.turno()) return;
    const color = estiloDeLomo(l.pagina.lomo, '', {}).color;
    const blob = await pngDeLomo(img, plan, eleccion, color);
    if (turno !== this.turno()) return;
    const ruta = `taller/${l.id}/img/lomo-${azar()}.png`;
    if (!ruta.startsWith(`taller/${l.id}/img/`)) return;
    const archivo = new File([blob], 'lomo.png', { type: 'image/png' });
    this.decir(this.tx.lomoImagenSubiendo);
    const r = await this.subir(ruta, archivo);
    if (turno !== this.turno()) return;
    if (!r || r.error) { this.decir(''); this.alError((r && r.error) || 'subida'); return; }
    const im = this.imagenes();
    if (im) await im.poner(ruta, archivo);
    if (turno !== this.turno()) return;
    /* Para «Ajustar el recorte…»: la imagen y el marco elegido (rellenar o escalar: el marco centrado) */
    this.original = { img, turno, libro: l.id, recorte: eleccion.modo === 'recortar' ? eleccion.recorte : null };
    this.alCambiar({ ruta });
    const dicho = plan.girar ? this.tx.lomoImagenGirada : this.tx.lomoImagenPuesta;
    this.decir(dicho);
    this.alDecir(dicho);
  }

  quitar() {
    const l = this.libro();
    if (!l || !l.editable || this.ocupado) return;
    this.original = null;
    this.alCambiar(null);
    this.decir(this.tx.lomoImagenQuitada);
    this.alDecir(this.tx.lomoImagenQuitada);
    this.bPoner.focus();
  }
}
