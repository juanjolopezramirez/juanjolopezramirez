/* ARRASTRAR Y SOLTAR ARCHIVOS en el panel y en el Taller. Es un extra: cada lugar sigue teniendo su boton (el teclado
   y el lector de pantalla no lo necesitan).

   Reglas:
     · Solo se actua si lo que se arrastra trae ARCHIVOS (`Files`). Arrastrar una miniatura, un trozo de texto o un
       enlace (`text/uri-list` sin archivo) sigue como siempre: aqui no se toca.
     · Un archivo por vez. Se mira su extension, su tipo (MIME), su tope de tamaño y sus primeros bytes (los mismos de
       archivos.js → revisarArchivo: Almacen.esDelFormato). Lo que no sirve se dice: «Ese archivo no sirve aquí: …».
     · Mientras se arrastra, cada lugar que acepta se marca; el que esta debajo, mas fuerte, y se anuncia.
     · LA GUARDIA DE LA VENTANA: un archivo soltado fuera de un lugar no abre el archivo en la pestaña (se perderia lo que
       no se guardo). Lo hace `guardiaDeVentana`.

   Un lugar «reclama» el evento (WeakSet): uno de afuera ya no lo toma, y la guardia tampoco. ProseMirror tambien puede
   tomarlo (preventDefault en su handleDrop): eso tambien cuenta como tomado.

   Las partes puras (sin pantalla) se prueban en tools/test-soltar.mjs. */
import { esDelFormato } from '../../contenido/Almacen.js';
import { TOPES } from '../archivos.js';

/* ---- Puro ---- */
export const SVG_TOPE = 4 * 1024 * 1024;                  // el mismo de SvgAImagen.js
export const TOPE_DE = { ...TOPES, svg: SVG_TOPE };
const MIME = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' };
const EXT = { pdf: 'pdf', png: 'png', jpg: 'jpg', jpeg: 'jpg', webp: 'webp', svg: 'svg' };
export const IMAGENES = ['png', 'jpg', 'webp'];

/* ¿Trae archivos? `types` es un DOMStringList o una lista */
export function llevaArchivos(dt) {
  const tipos = dt && dt.types;
  if (!tipos) return false;
  return typeof tipos.contains === 'function' ? tipos.contains('Files') : Array.from(tipos).includes('Files');
}

/* La extension que dice el nombre (jpeg → jpg), o '' */
export function extDeNombre(nombre) {
  const m = /\.([a-z0-9]{1,5})$/i.exec(String(nombre || ''));
  return m ? EXT[m[1].toLowerCase()] || '' : '';
}

/* Lo que pide un <input accept="…">: la lista de extensiones (de sus MIME y de sus .ext) */
export function extsDeAccept(accept) {
  const s = new Set();
  for (const parte of String(accept || '').split(',')) {
    const tipo = parte.trim().toLowerCase();
    if (!tipo) continue;
    if (tipo.startsWith('.')) { if (EXT[tipo.slice(1)]) s.add(EXT[tipo.slice(1)]); } else if (MIME[tipo]) s.add(MIME[tipo]);
  }
  return [...s];
}

/* La primera revision, sin leer el archivo: { ok, ext } o { ok: false, clave, ext? }.
   El nombre manda; el MIME, si lo hay, tiene que decir lo mismo (Windows a veces no lo da: entonces deciden los bytes). */
export function revisarNombre(archivo, acepta) {
  if (!archivo || typeof archivo.size !== 'number') return { ok: false, clave: 'sinArchivo' };
  const ext = extDeNombre(archivo.name);
  const mime = String(archivo.type || '').toLowerCase();
  if (!ext || !acepta.includes(ext)) return { ok: false, clave: 'tipo', ext };
  if (mime && MIME[mime] !== ext) return { ok: false, clave: 'falso', ext };
  if (!(archivo.size > 0)) return { ok: false, clave: 'vacio', ext };
  if (archivo.size > TOPE_DE[ext]) return { ok: false, clave: 'grande', ext };
  return { ok: true, ext };
}

/* Un solo archivo: { archivo } o { clave } */
export function unArchivo(dt) {
  const n = dt && dt.files ? dt.files.length : 0;
  if (n === 0) return { clave: 'sinArchivo' };
  if (n > 1) return { clave: 'uno' };
  return { archivo: dt.files[0] };
}

/* Mientras se arrastra solo se ve el MIME de cada cosa (no el nombre): ¿alguna podria servir? Sin MIME, quizas. */
export function quizasSirve(dt, acepta) {
  const items = dt && dt.items ? Array.from(dt.items).filter((i) => i.kind === 'file') : [];
  if (!items.length) return true;
  if (items.length > 1) return false;
  const t = String(items[0].type || '').toLowerCase();
  return !t || acepta.includes(MIME[t]);
}

/* Los primeros bytes: un SVG es texto con <svg; lo demas, la firma de su formato */
export function bytesDeSvg(bytes) {
  let t = '';
  for (let i = 0; i < Math.min(bytes.length, 1024); i++) t += String.fromCharCode(bytes[i]);
  return /<svg[\s>]/i.test(t);
}
export const bytesValen = (bytes, ext) => (ext === 'svg' ? bytesDeSvg(bytes) : esDelFormato(bytes, ext));

/* Windows a veces no da el MIME: ya revisado por sus bytes, el archivo sale con el tipo de su extension (asi lo que sigue,
   que mira `type`, no rechaza un PNG bueno) */
const TIPO_DE = Object.fromEntries(Object.entries(MIME).map(([t, e]) => [e, t]));
export function conTipo(archivo, ext) {
  if (!archivo || archivo.type || !TIPO_DE[ext]) return archivo;
  return new File([archivo], archivo.name, { type: TIPO_DE[ext], lastModified: archivo.lastModified });
}

/* La revision entera (con los bytes): { ok, ext } o { ok: false, clave, ext } */
export async function revisarSoltado(archivo, acepta) {
  const r = revisarNombre(archivo, acepta);
  if (!r.ok) return r;
  let bytes;
  try { bytes = new Uint8Array(await archivo.slice(0, r.ext === 'svg' ? 1024 : 32).arrayBuffer()); } catch (e) { return { ok: false, clave: 'falso', ext: r.ext }; }
  return bytesValen(bytes, r.ext) ? r : { ok: false, clave: 'falso', ext: r.ext };
}

/* Como se nombra lo que va en un lugar: «un PDF», «una imagen (PNG, JPG o WebP)», «un PDF o una imagen (…)» */
const NOMBRE_EXT = { png: 'PNG', jpg: 'JPG', webp: 'WebP', svg: 'SVG', pdf: 'PDF' };
export function nombreDeTipos(acepta, tx) {
  const t = tx || {};
  const imgs = acepta.filter((e) => e !== 'pdf');
  const lista = (xs) => xs.map((e) => NOMBRE_EXT[e]).reduce((a, b, i, l) => (i === 0 ? b : i === l.length - 1 ? `${a}${t.o || ' o '}${b}` : `${a}, ${b}`), '');
  const poner = (s, l) => String(s || '').replace('{lista}', l);
  if (!imgs.length) return t.tipoPdf || 'un PDF';
  if (imgs.length === 1 && imgs[0] === 'svg' && !acepta.includes('pdf')) return t.tipoSvg || 'un SVG';
  return poner(acepta.includes('pdf') ? t.tipoPdfOImagen : t.tipoImagen, lista(imgs));
}

/* Lo que se dice cuando no sirve */
export function textoDeFalla(clave, acepta, tx, ext) {
  const t = tx || {};
  if (clave === 'uno') return t.uno || '';
  if (clave === 'sinArchivo') return t.sinArchivo || '';
  const porque = clave === 'grande' ? String(t.grande || '').replace('{mb}', String(Math.round((TOPE_DE[ext] || TOPE_DE.pdf) / 1048576)))
    : clave === 'tipo' ? String(t.tipo || '').replace('{tipos}', nombreDeTipos(acepta, t))
      : clave === 'vacio' ? t.vacio : t.falso;
  return String(t.noSirve || '').replace('{porque}', porque || '');
}

/* El rotulo mientras se arrastra encima: «Suelta el PDF aquí», «Suelta la imagen aquí»… */
export function textoDeEncima(acepta, tx) {
  const t = tx || {};
  if (acepta.length === 1 && acepta[0] === 'pdf') return t.encimaPdf;
  if (acepta.length === 1 && acepta[0] === 'svg') return t.encimaSvg;
  if (!acepta.includes('pdf')) return t.encimaImagen;
  return t.encima;
}

/* EL PDF SOLTADO EN LA MESA: que se puede hacer con el. `sobrePdf`: se solto sobre una hoja que viene de un PDF. */
export function opcionesDePdf({ editable, sobrePdf } = {}) {
  if (!editable) return [];
  return ['sueltas', 'portada', ...(sobrePdf ? ['cambiar'] : [])];
}

/* ---- Textos (del JSON del panel) ---- */
let textos = null;
export function textosDeSoltar() {
  if (textos) return textos;
  try { textos = JSON.parse(document.getElementById('portal-textos').textContent).panel.soltar || {}; } catch (e) { textos = {}; }
  return textos;
}

/* ---- Lo que se ve y se oye ---- */
let voz = null, aviso = null, avisoReloj = 0;
const donde = () => {
  /* Dentro de una ventana modal abierta, o de la mesa del Taller (lo demas queda inerte mientras esta abierta) */
  const abiertas = [...document.querySelectorAll('dialog[open]')];
  const modal = abiertas.reverse().find((d) => { try { return d.matches(':modal'); } catch (e) { return false; } });
  return modal || document.querySelector('[data-tal-mesa]:not([hidden])') || document.body;
};
function nodo(clase, rol) {
  const e = document.createElement('p');
  e.className = clase;
  e.setAttribute('role', rol);
  return e;
}
/* Para el lector de pantalla, sin verse (lo que se arrastra encima) */
export function anunciar(texto) {
  if (!voz) voz = nodo('soltar-voz', 'status');
  const d = donde();
  if (voz.parentNode !== d) d.append(voz);
  voz.textContent = '';
  requestAnimationFrame(() => { voz.textContent = texto || ''; });
}
/* Visible un momento y leido (lo que no sirvio) */
export function avisar(texto) {
  if (!texto) return;
  if (!aviso) aviso = nodo('soltar-aviso', 'status');
  const d = donde();
  if (aviso.parentNode !== d) d.append(aviso);
  aviso.textContent = '';
  aviso.hidden = false;
  requestAnimationFrame(() => { aviso.textContent = texto; });
  clearTimeout(avisoReloj);
  avisoReloj = setTimeout(() => { aviso.hidden = true; aviso.textContent = ''; }, 5000);
}

/* Mientras haya un archivo en el aire, <html data-soltar-listo>: cada lugar que acepta se marca suave */
let listoReloj = 0;
function listo(si) {
  clearTimeout(listoReloj);
  const h = document.documentElement;
  /* 600 ms: Firefox repite `dragover` mas despacio que Chrome cuando el raton esta quieto */
  if (si) { h.setAttribute('data-soltar-listo', ''); listoReloj = setTimeout(() => listo(false), 600); } else h.removeAttribute('data-soltar-listo');
}

const reclamados = new WeakSet();
export const reclamado = (e) => reclamados.has(e) || e.defaultPrevented;

/* LA GUARDIA: sobre lo que no es un lugar, un archivo no se puede soltar (el cursor lo dice) y, si se suelta, no se abre */
let guardia = false;
export function guardiaDeVentana(w = window) {
  if (guardia) return;
  guardia = true;
  w.addEventListener('dragover', (e) => {
    if (!llevaArchivos(e.dataTransfer)) return;
    listo(true);
    if (reclamados.has(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'none';
  });
  w.addEventListener('drop', (e) => {
    if (!llevaArchivos(e.dataTransfer)) return;
    listo(false);
    if (reclamado(e)) return;
    e.preventDefault();
    avisar(textosDeSoltar().fuera);
  });
  w.addEventListener('dragend', () => listo(false));
}

/* UN LUGAR (o muchos, por delegacion): `buscar(objetivo)` → { zona, acepta, activa?, alSoltar(archivo, evento) } o null.
   La `zona` es el elemento que se marca. Devuelve con que soltarlo. */
export function soltarEn(raiz, buscar) {
  let encima = null, salir = 0;
  const tx = () => textosDeSoltar();
  const marcar = (z, estado) => {
    if (encima && encima !== z) encima.removeAttribute('data-soltar-encima');
    encima = z;
    if (z) z.setAttribute('data-soltar-encima', estado);
  };
  const lugar = (e) => {
    const l = buscar(e.target);
    return l && l.zona && (!l.activa || l.activa()) ? l : null;
  };
  const alPasar = (e) => {
    if (!llevaArchivos(e.dataTransfer) || reclamados.has(e)) return;
    clearTimeout(salir);
    const l = lugar(e);
    if (!l) { if (encima && !encima.contains(e.target)) marcar(null); return; }
    reclamados.add(e);
    e.preventDefault();
    const sirve = quizasSirve(e.dataTransfer, l.acepta);
    e.dataTransfer.dropEffect = sirve ? 'copy' : 'none';
    if (encima !== l.zona) {
      l.zona.setAttribute('data-soltar-texto', textoDeEncima(l.acepta, tx()) || '');
      if (l.chip) l.zona.setAttribute('data-soltar-chip', '');
      if (sirve) anunciar(textoDeEncima(l.acepta, tx()));
    }
    marcar(l.zona, sirve ? 'si' : 'no');
  };
  /* Salir de un hijo a otro tambien dispara `dragleave` (y en WebKit, con un archivo de fuera, `relatedTarget` es null):
     se espera un momento, y el `dragover` que sigue dentro lo cancela. Sin parpadeo y sin repetir el anuncio. */
  const alSalir = () => {
    if (!encima) return;
    clearTimeout(salir);
    salir = setTimeout(() => marcar(null), 60);
  };
  const alSoltar = async (e) => {
    clearTimeout(salir);
    if (!llevaArchivos(e.dataTransfer) || reclamado(e)) { marcar(null); return; }
    const l = lugar(e);
    marcar(null);
    if (!l) return;
    reclamados.add(e);
    e.preventDefault();
    const uno = unArchivo(e.dataTransfer);
    if (!uno.archivo) { avisar(textoDeFalla(uno.clave, l.acepta, tx())); return; }
    const r = await revisarSoltado(uno.archivo, l.acepta);
    if (!r.ok) { avisar(textoDeFalla(r.clave, l.acepta, tx(), r.ext)); return; }
    try { await l.alSoltar(conTipo(uno.archivo, r.ext), e, r.ext); } catch (x) { avisar(tx().fallo); }
  };
  raiz.addEventListener('dragenter', alPasar);
  raiz.addEventListener('dragover', alPasar);
  raiz.addEventListener('dragleave', alSalir);
  raiz.addEventListener('drop', alSoltar);
  return () => {
    clearTimeout(salir);
    marcar(null);
    raiz.removeEventListener('dragenter', alPasar);
    raiz.removeEventListener('dragover', alPasar);
    raiz.removeEventListener('dragleave', alSalir);
    raiz.removeEventListener('drop', alSoltar);
  };
}

/* Un solo lugar fijo. Se marca para el aviso suave mientras hay un archivo en el aire. */
export function zonaDeSoltar(zona, { acepta, activa, alSoltar, chip = false }) {
  zona.setAttribute('data-soltar-zona', '');
  return soltarEn(zona, () => ({ zona, acepta: typeof acepta === 'function' ? acepta() : acepta, activa, alSoltar, chip }));
}

/* Darle el archivo a un <input type="file"> como si se hubiera elegido: lo demas (nombre, medir, subir) sigue igual.
   (Un navegador viejo sin `new DataTransfer()` lanza: quien llama lo dice.) */
export function ponerEnInput(input, archivo) {
  const dt = new DataTransfer();
  dt.items.add(archivo);
  input.files = dt.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/* LOS FORMULARIOS de Developer-Mode (Libros, Trabajos, Proyectos y sus bloques): cada «Elegir…» (.dev__elegir con su
   input.dev__archivo) recibe lo que su `accept` pide. Por delegacion: tambien los que se agregan despues (otra version,
   un bloque de imagen). */
export function soltarEnFormularios(raiz) {
  const SEL = 'input.dev__archivo[type="file"]';
  return soltarEn(raiz, (objetivo) => {
    if (!objetivo || !objetivo.closest) return null;
    let elegir = objetivo.closest('.dev__elegir');
    /* Sobre la etiqueta o la ayuda de un campo con un solo archivo, tambien vale */
    if (!elegir) { const c = objetivo.closest('.dev__campo'); if (c && c.querySelectorAll(SEL).length === 1) elegir = c.querySelector('.dev__elegir'); }
    const input = elegir && elegir.querySelector(SEL);
    if (!input || input.disabled || !raiz.contains(elegir)) return null;
    const acepta = extsDeAccept(input.accept);
    if (!acepta.length) return null;
    const campo = elegir.closest('.dev__campo');
    const zona = campo && campo.querySelectorAll('input[type="file"]').length === 1 ? campo : elegir;
    return { zona, acepta, chip: zona === campo, alSoltar: (archivo) => { ponerEnInput(input, archivo); input.focus({ preventScroll: true }); } };
  });
}
