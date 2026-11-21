/* EL GEMELO DE UN BOTON DEL PDF (etapa 5b del lector). El boton que el Taller dibuja en la hoja es una imagen: no se hunde ni
   cambia lo que dice. Si su enlace trae el aspecto (`&b=`, lector/botonEnPdf.js), el lector pone encima un gemelo de verdad,
   del mismo tamaño, que al pulsarlo baja lo que mide su escalon (el escalon desaparece: se pinta el papel `pf` encima) y,
   en uno de copiar, dice «Copiado» un momento.

   La cara del gemelo es la MISMA imagen de la pagina, recortada al boton: asi su letra, su icono y sus colores son los del
   PDF, sin adivinar nada. Solo «Copiado» se dibuja: el relleno `f`, la letra `c` y la fuente de la lista fija de las notas
   (FUENTES_NOTA, que llega como parametro: este archivo no la importa, para no meter las notas en el paquete de todas las
   paginas). Un nombre de letra que no esta en la lista nunca se vuelve una direccion ni un CSS: se usa la del sitio.

   Todo lo que viene del enlace es hostil: los textos van con textContent, los colores (#rrggbb ya limpios, y se miran otra
   vez) y los numeros con style.setProperty. Nada de HTML escrito a mano. */
import { copiaDeEnlace, irDeEnlace, pareceEnlaceBoton, pareceEnlaceCopia } from './botonEnPdf.js';
import { textoDeCopia } from './copiaEnPdf.js';

export const COPIADO_MS = 1500;                 // lo que dura «Copiado» en la cara del boton
export const COPIADO_POR_IDIOMA = Object.freeze({ es: 'Copiado', en: 'Copied' });
const HEX = /^#[0-9a-f]{6}$/;
const LINEA_CSS = Object.freeze({ solido: 'solid', punteado: 'dotted', rayado: 'dashed' });
export const LADO_MIN = 0.01;                   // un boton mas pequeño que esto (en fraccion de la hoja) no es un boton
export const AREA_MAX = 0.6;                    // ni uno que tapa mas de esto de la hoja: es una trampa
export const GEMELOS_MAX = 40;                  // por pagina: los demas botones quedan como los de siempre
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const redondo = (v) => Math.round(v * 100000) / 100000;

/* ¿DICE ser un boton? (copiar o /ir/) */
export const pareceBoton = (href, opciones) => pareceEnlaceBoton(href, opciones);

/* Lo que hace un enlace de boton del PDF:
     { tipo: 'copia', texto, aspecto | null }   copiar (con aspecto o el de siempre)
     { tipo: 'ir', url, aspecto | null }        abrir una direccion https en otra pestaña
   o null (no es un boton, o dice serlo y no lo es). Un copiar con un aspecto que no se deja leer (`&b=` falso) copia igual,
   como el de siempre, sin gemelo: el texto si es bueno. */
export function botonDeEnlace(href, opciones) {
  if (typeof href !== 'string') return null;
  const c = copiaDeEnlace(href);
  if (c) return { tipo: 'copia', texto: c.texto, aspecto: c.aspecto };
  if (pareceEnlaceCopia(href)) {
    const i = href.indexOf('&b=');
    const t = i > 0 ? textoDeCopia(href.slice(0, i)) : null;
    return t ? { tipo: 'copia', texto: t, aspecto: null } : null;
  }
  const r = irDeEnlace(href, opciones);
  return r ? { tipo: 'ir', url: r.url, aspecto: r.aspecto } : null;
}

/* Las medidas del gemelo. `L`: la caja del enlace en la hoja { x, y, w, h } (fracciones de 0 a 1), que es la CARA del boton
   (el escalon de abajo no cuenta en la caja del enlace). Devuelve, o null si la caja no sirve:
     caja      { x, y, w, h } del gemelo entero: la cara y su escalon (recortado al borde de la hoja)
     cara      que parte del alto del gemelo es la cara (0..1)
     lh        el escalon, en partes del alto del GEMELO (lo que baja la cara al pulsarla)
     hunde     si baja de verdad: hace falta el escalon, su color y el papel para taparlo
     radio     'pildora' o el radio en partes del alto del gemelo
     fs, bw    la letra y el borde, en partes del alto del gemelo
     recorte   { w, h, x, y }: la imagen de la hoja dentro de la cara, en partes de la cara */
export function geometriaGemelo(L, aspecto) {
  if (!L || ![L.x, L.y, L.w, L.h].every(num)) return null;
  const x = Math.max(0, L.x), y = Math.max(0, L.y);
  const w = Math.min(L.w, 1 - x), h = Math.min(L.h, 1 - y);
  if (!(w >= LADO_MIN && h >= LADO_MIN) || w * h > AREA_MAX) return null;
  const a = aspecto || {};
  const lh = num(a.lh) && a.lh > 0 ? Math.min(a.lh, 1 - (y + h)) : 0;
  const alto = h + lh;
  const parte = (v) => (num(v) && v > 0 ? redondo(v / alto) : 0);
  return {
    caja: { x: redondo(x), y: redondo(y), w: redondo(w), h: redondo(alto) },
    cara: redondo(h / alto),
    lh: parte(lh),
    hunde: lh > 0 && HEX.test(a.s || '') && HEX.test(a.pf || ''),
    radio: a.rr === 1 ? 'pildora' : parte(a.rr),
    fs: parte(a.fs),
    bw: parte(a.bw),
    recorte: { w: redondo(1 / w), h: redondo(1 / h), x: redondo(-x / w), y: redondo(-y / h) }
  };
}

/* ¿Se puede dibujar «Copiado» en la cara? Hace falta un fondo que tape la letra impresa: el relleno opaco, o el papel debajo.
   Un boton que es solo un icono no tiene sitio para la palabra: ahi sale la pastilla de siempre. */
export function caraDibujable(aspecto) {
  if (!aspecto) return false;
  if (aspecto.l === 'solo' || (!aspecto.x && aspecto.i)) return false;
  return HEX.test(aspecto.pf || '') || (HEX.test(aspecto.f || '') && !aspecto.o);
}

/* Lo que dice al copiar: el del Taller (`k`), o «Copiado» en el idioma del libro */
export function rotuloCopiado(aspecto, idioma) {
  const k = aspecto && typeof aspecto.k === 'string' ? aspecto.k.trim() : '';
  return k || COPIADO_POR_IDIOMA[idioma === 'en' ? 'en' : 'es'];
}

/* La letra de «Copiado»: el id de FUENTES_NOTA cuya familia es la del boton (sin mirar mayusculas), o null (la del sitio) */
export function fuenteDeBoton(fu, fuentes) {
  if (typeof fu !== 'string' || !fu || !fuentes) return null;
  const buscada = fu.trim().toLowerCase();
  for (const id of Object.keys(fuentes)) {
    const f = fuentes[id];
    if (f && typeof f.familia === 'string' && f.familia.toLowerCase() === buscada) return id;
  }
  return null;
}

/* Las variables del gemelo (propiedad → valor). Solo numeros y colores #rrggbb que se vuelven a mirar aqui. */
export function variablesGemelo(g, aspecto) {
  const a = aspecto || {}, v = {};
  const color = (k, nombre) => { if (HEX.test(a[k] || '')) v[nombre] = a[k]; };
  v['--gb-cara'] = String(g.cara);
  v['--gb-lh'] = String(g.lh);
  v['--gb-rr'] = g.radio === 'pildora' ? '' : String(g.radio);
  v['--gb-fs'] = String(g.fs || 0.5 * g.cara);
  v['--gb-bw'] = String(g.bw);
  v['--gb-fw'] = String(g.recorte.w);
  v['--gb-fh'] = String(g.recorte.h);
  v['--gb-fx'] = String(g.recorte.x);
  v['--gb-fy'] = String(g.recorte.y);
  color('f', '--gb-f'); color('c', '--gb-c'); color('s', '--gb-s'); color('pf', '--gb-pf'); color('bc', '--gb-bc');
  if (Number.isInteger(a.o) && a.o >= 20 && a.o < 100) v['--gb-o'] = String(a.o / 100);
  if (typeof a.bl === 'string' && Object.prototype.hasOwnProperty.call(LINEA_CSS, a.bl)) v['--gb-bl'] = LINEA_CSS[a.bl];
  if (v['--gb-rr'] === '') delete v['--gb-rr'];
  return v;
}

/* ARMA el gemelo con el `document` que se le pase (el de verdad, o uno de mentira en las pruebas):
     <button|a class="flip__link flip__boton" data-flip-boton="copia|ir">
       <span class="flip__boton-papel"></span>                  el papel que tapa el escalon al pulsar
       <span class="flip__boton-cara">                          la cara, que baja
         <img class="flip__boton-foto" alt="">                  el boton del PDF, recortado de la pagina
         <span class="flip__boton-rotulo"></span>               «Copiado», solo cuando toca
       </span>
     </button>
   Sus hijos no reciben toques (base.css): la libreria de las hojas deja pasar el toque solo si cae en el boton mismo.
   `etiqueta`: su nombre para quien no ve. La letra de «Copiado» la pone despues quien lo arma (hojaNota.ponerFuente), y solo
   si el gemelo salio: sin caja buena no se pide ninguna letra. */
export function armarGemelo(doc, { tipo, url, aspecto, L, etiqueta }) {
  const g = geometriaGemelo(L, aspecto);
  if (!g || (tipo !== 'copia' && tipo !== 'ir')) return null;
  const el = doc.createElement(tipo === 'ir' ? 'a' : 'button');
  el.className = 'flip__link flip__boton';
  el.dataset.flipBoton = tipo;
  if (tipo === 'ir') {
    el.href = url;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    el.referrerPolicy = 'no-referrer';
  } else {
    el.type = 'button';
  }
  if (g.hunde) el.dataset.hunde = '';
  if (aspecto && aspecto.n) el.dataset.negrita = '';
  if (g.radio === 'pildora') el.dataset.pildora = '';
  if (etiqueta) el.setAttribute('aria-label', etiqueta);
  el.style.left = g.caja.x * 100 + '%';
  el.style.top = g.caja.y * 100 + '%';
  el.style.width = g.caja.w * 100 + '%';
  el.style.height = g.caja.h * 100 + '%';
  const vars = variablesGemelo(g, aspecto);
  for (const k of Object.keys(vars)) el.style.setProperty(k, vars[k]);

  const papel = doc.createElement('span');
  papel.className = 'flip__boton-papel';
  const cara = doc.createElement('span');
  cara.className = 'flip__boton-cara';
  const foto = doc.createElement('img');
  foto.className = 'flip__boton-foto';
  foto.alt = '';
  foto.draggable = false;
  const rotulo = doc.createElement('span');
  rotulo.className = 'flip__boton-rotulo';
  rotulo.textContent = aspecto && aspecto.x ? aspecto.x : '';
  cara.append(foto, rotulo);
  el.append(papel, cara);
  for (const x of [papel, cara]) x.setAttribute('aria-hidden', 'true');
  return el;
}

/* «Copiado» en la cara (o vuelta a lo que decia). Solo textContent. */
export function ponerCopiado(el, texto) {
  const rotulo = el && el.querySelector && el.querySelector('.flip__boton-rotulo');
  if (!rotulo) return false;
  rotulo.textContent = texto;
  el.dataset.copiado = '';
  return true;
}
export function quitarCopiado(el, original) {
  const rotulo = el && el.querySelector && el.querySelector('.flip__boton-rotulo');
  if (!rotulo) return;
  rotulo.textContent = original || '';
  delete el.dataset.copiado;
}

/* EL PULSADOR: lo que pasa al pulsar un gemelo y al copiar con el. Uno por lector. `quieto()` dice si se pidio menos
   movimiento (entonces no baja); `poner`/`quitar` son setTimeout/clearTimeout (las pruebas pasan unos de mentira).
     hundir(g)            baja (si tiene escalon y no se pidio quietud); suelta el que estuviera abajo
     soltar()             vuelve el que este abajo
     teclaAbajo(g, e)     Enter o Espacio: baja. Devuelve true si hay que impedir lo de siempre (Espacio en un enlace)
     teclaArriba(g, e)    suelta; Espacio en un enlace lo abre, SOLO si el Espacio empezo en ese mismo gemelo
     copiado(g, texto, original, alFin)   la cara dice `texto` COPIADO_MS y vuelve a `original` (alFin, al volver)
     reponer()            «Copiado» se va ya (y su reloj)
     limpiar()            todo vuelve: al salir del lector */
const TECLAS = new Set(['Enter', ' ']);
export function crearPulsador({ quieto = () => false, poner = (f, ms) => setTimeout(f, ms), quitar = (t) => clearTimeout(t), ms = COPIADO_MS } = {}) {
  let hundido = null, conEspacio = null, copia = null, original = '', reloj = 0;
  const soltar = () => { if (hundido) { hundido.removeAttribute('data-pulsado'); hundido = null; } };
  const hundir = (g) => {
    soltar();
    if (!g || !g.hasAttribute('data-hunde') || quieto()) return false;
    g.setAttribute('data-pulsado', '');
    hundido = g;
    return true;
  };
  const tecla = (e) => !!e && TECLAS.has(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey;
  const enlace = (g) => g && g.tagName === 'A';
  const teclaAbajo = (g, e) => {
    if (!g || !tecla(e)) return false;
    if (e.key === ' ') conEspacio = g;
    if (!e.repeat) hundir(g);
    return e.key === ' ' && enlace(g);
  };
  const teclaArriba = (g, e) => {
    if (!g || !e || !TECLAS.has(e.key)) return;
    soltar();
    const desdeAqui = e.key === ' ' && conEspacio === g;
    if (e.key === ' ') conEspacio = null;
    if (desdeAqui && enlace(g)) g.click();
  };
  const reponer = () => {
    if (reloj) { quitar(reloj); reloj = 0; }
    if (copia) { quitarCopiado(copia, original); copia = null; }
  };
  const copiado = (g, texto, orig, alFin) => {
    reponer();
    if (!ponerCopiado(g, texto)) return false;
    copia = g;
    original = orig || '';
    reloj = poner(() => { reloj = 0; reponer(); if (alFin) alFin(); }, ms);
    return true;
  };
  const limpiar = () => { soltar(); reponer(); conEspacio = null; };
  return { hundir, soltar, teclaAbajo, teclaArriba, copiado, reponer, limpiar, abajo: () => hundido, diciendo: () => copia };
}
