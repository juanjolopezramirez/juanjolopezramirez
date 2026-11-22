/* LA HOJA DE UNA NOTA: lo que se abre al tocar una palabra con definicion o una cita biblica dentro de un libro en PDF.
   site.js la carga la primera vez que hace falta (import()), y la deja dentro del lector (#book-panel): en el telefono sube
   desde abajo como «Más»; de 820 px para arriba es una ficha de papel junto al muelle (base.css, «La nota»).

   Una definicion: la palabra, su descripcion y su fuente (APA). Cada una con la letra que eligio el autor, solo de la lista
   fija de notaEnPdf.js (FUENTES_NOTA); nunca un estilo que venga en la nota. Una cita: el texto de la Biblia en la version
   del idioma del libro (pasajeNota.js), su nombre, y la version que recomienda el autor con su enlace a Bible Gateway.

   Todo se escribe con textContent y nodos: nada de HTML a mano. Mientras esta abierta, lo de detras queda inerte (como
   «Más»); Escape la cierra (site.js lo pide por orden) y el foco vuelve a quien la abrio. */
import { FUENTES_NOTA, fuenteValida, hojaDeFuente } from './notaEnPdf.js';
import { referenciaAPA, rotuloDeCita, recomendada } from './notaTexto.js';
import { pasajeDeNota } from './pasajeNota.js';
import { enlaceGateway } from '../biblia/referencias.js';
import { coloresSobre } from './colorNota.js';
import { animarNota } from './efectosNota.js';

const SVG = 'http://www.w3.org/2000/svg';

function nodo(tag, clase, texto) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto != null) n.textContent = texto;
  return n;
}
function icono(trazos) {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  for (const d of trazos) {
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', d);
    s.appendChild(p);
  }
  return s;
}
/* Un enlace que sale del sitio: otra pestaña, sin decir de donde se viene */
function fuera(href, texto, etiqueta) {
  const a = nodo('a', 'lector__nota-enlace', texto);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.referrerPolicy = 'no-referrer';
  if (etiqueta) a.setAttribute('aria-label', etiqueta);
  a.appendChild(icono(['M8 16L16 8', 'M9.5 8H16v6.5']));
  return a;
}

/* Las letras que el sitio no trae ya se piden al usarse: una hoja de Google por familia, una sola vez por pagina */
const pedidas = new Set();
function pedirFuente(id) {
  if (!fuenteValida(id) || FUENTES_NOTA[id].sitio || pedidas.has(id)) return;
  pedidas.add(id);
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = hojaDeFuente(id);
  l.referrerPolicy = 'no-referrer';
  l.dataset.notaFuente = id;
  document.head.appendChild(l);
}
export function ponerFuente(el, id) {
  if (!fuenteValida(id)) return;
  pedirFuente(id);
  el.style.fontFamily = FUENTES_NOTA[id].css;
  el.dataset.fuente = id;
}

/* La referencia APA en un parrafo: la cursiva es <i>, la direccion un enlace.
   `anfitrion`: junto al enlace, su dominio escrito aparte y sin enlace (asi se ve a donde lleva antes de tocarlo).
   `conEnlace: false`: la direccion queda como texto, sin enlace (la pagina /nota/ con una nota que no dice de que libro es). */
export function pintarReferencia(p, nota, idioma, { anfitrion = false, conEnlace = true } = {}) {
  for (const t of referenciaAPA(nota, idioma)) {
    if (t.url) {
      p.appendChild(conEnlace ? fuera(t.url, t.t) : nodo('span', 'lector__nota-url', t.t));
      if (anfitrion) {
        let host = '';
        try { host = new URL(t.url).hostname; } catch (e) { host = ''; }
        if (host) p.append(' ', nodo('span', 'lector__nota-host', host));
      }
    } else if (t.cursiva) p.appendChild(nodo('i', '', t.t));
    else p.appendChild(document.createTextNode(t.t));
  }
}
/* Un hueco del texto ({t}, {q}, {v}, {n}) con lo que escribio el autor o el lector: con una funcion, para que un «$&» o
   un «$1» dentro del valor no se lean como patrones de replace() */
export const poner = (plantilla, hueco, valor) => plantilla.replace(hueco, () => String(valor));

/* El pasaje: un solo parrafo con el numero de cada versiculo pequeño delante (cap:v si el pasaje cruza capitulos).
   Un versiculo que la version no trae dice eso, en vez de quedar en blanco. `fv`: la letra que eligio el libro para sus
   versiculos (solo de FUENTES_NOTA); sin ella, la de siempre. Los numeros siguen en la letra del sitio (base.css). */
export function pintarVersos(caja, pasaje, tl, fv) {
  const p = nodo('p', 'lector__nota-pasaje');
  ponerFuente(p, fv);
  pasaje.versos.forEach(({ cap, v, t, omitido }, i) => {
    if (i) p.appendChild(document.createTextNode(' '));
    const n = nodo('sup', 'lector__nota-v', pasaje.varios ? `${cap}:${v}` : String(v));
    p.appendChild(n);
    p.appendChild(document.createTextNode(' '));
    if (omitido) p.appendChild(nodo('span', 'lector__nota-omitido', tl('omitido')));
    else p.appendChild(document.createTextNode(t));
  });
  caja.replaceChildren(p);
}

/* LOS COLORES DEL LIBRO sobre el papel de ahora: `caja` es el papel (la hoja del lector o la de /nota/). El par del tema de
   ese papel (claro u oscuro, medido, no supuesto) y solo si se lee (colorNota.coloresSobre); si no, la tinta de siempre.
   Van como --nota-t (titulo) y --nota-x (descripcion o versiculos), que base.css y nota.astro leen. */
export function ponerColores(caja, nota) {
  let fondo = '';
  try { fondo = getComputedStyle(caja).backgroundColor; } catch (e) { fondo = ''; }
  const { titulo, texto } = coloresSobre(nota, fondo);
  if (titulo) caja.style.setProperty('--nota-t', titulo); else caja.style.removeProperty('--nota-t');
  if (texto) caja.style.setProperty('--nota-x', texto); else caja.style.removeProperty('--nota-x');
}
/* Mientras una nota esta abierta el tema puede cambiar (el boton del lector, o el aparato pasa a oscuro): `alCambiar()`
   se llama entonces. Devuelve la funcion que deja de mirar. */
export function mirarTema(alCambiar) {
  const html = document.documentElement;
  const mo = new MutationObserver(() => alCambiar());
  mo.observe(html, { attributes: true, attributeFilter: ['data-tema'] });
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
  if (mq) mq.addEventListener('change', alCambiar);
  return () => { mo.disconnect(); if (mq) mq.removeEventListener('change', alCambiar); };
}

/* El oro de ese papel (un token de la hoja de estilo), para el brillo y la raya de los efectos */
export const oroDe = (caja, variable) => () => {
  try { return getComputedStyle(caja).getPropertyValue(variable).trim(); } catch (e) { return ''; }
};

/* La linea de la version recomendada (o nada si el autor no puso una) */
export function lineaRecomendada(nota, idioma, tl) {
  const rec = recomendada(nota, idioma);
  if (!rec) return null;
  const p = nodo('p', 'lector__nota-rec', tl('recomendada') + ' ');
  p.appendChild(fuera(rec.href, rec.nombre, poner(tl('enGateway'), '{v}', rec.nombre)));
  return p;
}

/* El texto de una cita en sus cajas (la hoja del lector y la pagina /nota/ hacen lo mismo): cargando, el pasaje con su
   version, las notas de «solo una parte» y «se ven los primeros» (o el pasaje completo en la version recomendada), «se
   numera distinto», o el error con «Intentar otra vez». `vigente()`: si ya no (se abrio otra nota), no pinta nada.
   `foco`: a donde va el foco cuando el boton de reintentar desaparece (antes de quitarlo). */
export function llenarCita({ nota, idioma, tl, base, caja, estado, pie, extra, vigente = () => true, foco = null, alPasaje = null }) {
  const traer = async () => {
    caja.replaceChildren();
    caja.setAttribute('aria-busy', 'true');
    estado.replaceChildren(nodo('span', 'lector__nota-cargando', tl('cargandoCita')));
    pie.textContent = '';
    extra.replaceChildren();
    let pasaje;
    try { pasaje = await pasajeDeNota(nota, idioma, { base }); } catch (e) { pasaje = { estado: 'error' }; }
    if (!vigente()) return;
    caja.removeAttribute('aria-busy');
    if (pasaje.estado === 'ok') {
      estado.textContent = '';
      pintarVersos(caja, pasaje, tl, nota.fv);
      if (alPasaje && caja.firstElementChild) alPasaje(caja.firstElementChild);
      pie.textContent = pasaje.nombre;
      if (pasaje.parcial) extra.appendChild(nodo('p', 'lector__nota-aviso', tl('parcial')));
      if (pasaje.recortado) {
        /* El pasaje entero, en la version que recomienda el autor; sin ella, solo se dice que se ven los primeros */
        const href = nota.rv ? enlaceGateway(nota.r, nota.rv) : null;
        extra.appendChild(href ? fuera(href, tl('completo'), poner(tl('enGateway'), '{v}', nota.rv))
          : nodo('p', 'lector__nota-aviso', poner(tl('primerosVersos'), '{n}', pasaje.versos.length)));
      }
    } else if (pasaje.estado === 'numeracion') {
      estado.textContent = tl('numeracion');
    } else {
      const otra = boton('lector__nota-otra', tl('reintentar'), () => {
        /* El boton se va al volver a pedir: el foco no se queda en el vacio */
        if (foco && foco.isConnected) foco.focus({ preventScroll: true });
        traer();
      });
      estado.replaceChildren(nodo('span', '', tl('citaNo') + ' '), otra);
    }
  };
  return traer();
}
function boton(clase, texto, fn) {
  const b = nodo('button', clase, texto);
  b.type = 'button';
  b.addEventListener('click', fn);
  return b;
}

/* ctx: { panel, tl, idioma: () => 'es'|'en', base, fondo, detras: () => [nodos], verIndice(tab, vuelve), alCerrar? } */
export function crearHojaNota(ctx) {
  const { panel, tl } = ctx;
  const hoja = nodo('section', 'lector__nota');
  hoja.id = 'lector-nota';
  hoja.setAttribute('role', 'dialog');
  hoja.setAttribute('aria-modal', 'true');
  /* Su nombre dice que es («Definición: Ahavá», «Referencia bíblica: Jeremías 1:4-5»): sin una etiqueta encima del titulo */
  const cerrarBtn = nodo('button', 'lector__redondo lector__nota-x');
  cerrarBtn.type = 'button';
  cerrarBtn.appendChild(icono(['M6 6l12 12M18 6L6 18']));
  const cuerpo = nodo('div', 'lector__nota-cuerpo');
  hoja.append(cerrarBtn, cuerpo);
  panel.appendChild(hoja);

  let vuelve = null;
  let turno = 0;           // una cita que llega tarde (se abrio otra nota) no pinta nada
  let efectos = null;      // los de la nota abierta (efectosNota.js): se paran al cerrar o al abrir otra
  let notaActual = null;   // la nota abierta: sus colores se vuelven a medir si cambia el tema
  let dejarDeMirar = null;
  const otroTema = () => {
    if (!notaActual || !abierta()) return;
    /* El papel cambia en la misma vuelta (variables de la hoja de estilo): se mide despues de que se pinte */
    requestAnimationFrame(() => { if (!notaActual) return; ponerColores(hoja, notaActual); if (efectos) efectos.recolorear(); });
  };
  const pararEfectos = () => { if (efectos) efectos.parar(); efectos = null; };
  const animar = (nota, titulo, textos) => {
    pararEfectos();
    efectos = animarNota({ titulo, textos, entrada: nota.ee, bucle: nota.el, oro: oroDe(hoja, '--l-papel-oro') });
  };
  const abierta = () => hoja.classList.contains('is-abierta');

  function cerrar(sinFoco) {
    if (!abierta()) return;
    turno++;
    pararEfectos();
    notaActual = null;
    if (dejarDeMirar) dejarDeMirar();
    dejarDeMirar = null;
    hoja.classList.remove('is-abierta');
    ctx.fondo.classList.remove('is-abierta', 'is-nota');
    ctx.detras().forEach((x) => { x.inert = false; });
    const a = vuelve;
    vuelve = null;
    if (ctx.alCerrar) ctx.alCerrar(a, !!sinFoco);
    else if (!sinFoco && a && a.isConnected) a.focus({ preventScroll: true });
  }
  cerrarBtn.addEventListener('click', () => cerrar());

  const verTodas = (pestana, texto) => boton('lector__nota-ver', texto, () => {
    const a = vuelve;
    cerrar(true);
    ctx.verIndice(pestana, a);
  });

  function definicion(nota, idioma) {
    const t = nodo('h3', 'lector__nota-t', nota.t);
    t.id = 'lector-nota-t';
    ponerFuente(t, nota.ft);
    const partes = [t];
    if (nota.d) {
      const d = nodo('p', 'lector__nota-texto', nota.d);
      ponerFuente(d, nota.fd);
      partes.push(d);
    }
    if (nota.r || nota.rf) {
      const pie = nodo('p', 'lector__nota-pie');
      pie.appendChild(nodo('b', '', tl('fuente') + ': '));
      pintarReferencia(pie, nota, idioma);
      partes.push(pie);
    }
    partes.push(verTodas('palabras', tl('verPalabras')));
    cuerpo.replaceChildren(...partes);
    hoja.setAttribute('aria-label', poner(tl('definicion'), '{t}', nota.t));
    animar(nota, t, partes.filter((x) => x.classList.contains('lector__nota-texto')));
  }

  function cita(nota, idioma) {
    const nombre = rotuloDeCita(nota, idioma);
    const t = nodo('h3', 'lector__nota-t', nombre);
    t.id = 'lector-nota-t';
    const caja = nodo('div', 'lector__nota-caja');
    const estado = nodo('p', 'lector__nota-estado');
    estado.setAttribute('role', 'status');
    const pie = nodo('p', 'lector__nota-pie');
    const extra = nodo('div', 'lector__nota-extra');
    const rec = lineaRecomendada(nota, idioma, tl);
    cuerpo.replaceChildren(t, caja, estado, pie, ...(rec ? [rec] : []), extra, verTodas('citas', tl('verCitas')));
    hoja.setAttribute('aria-label', poner(tl('cita'), '{t}', nombre));
    const mio = turno;
    animar(nota, t, []);
    const fx = efectos;
    llenarCita({ nota, idioma, tl, base: ctx.base, caja, estado, pie, extra, vigente: () => mio === turno && abierta(), foco: cerrarBtn, alPasaje: (p) => { if (fx === efectos && fx) fx.texto(p); } });
  }

  /* Abre una nota (ya limpia: notaDeEnlace). `desde`: a donde vuelve el foco al cerrar. */
  function abrir(nota, desde) {
    if (!nota) return;
    const idioma = ctx.idioma();
    const yaAbierta = abierta();
    if (!yaAbierta) vuelve = desde || document.activeElement;
    turno++;
    hoja.setAttribute('lang', idioma);
    cerrarBtn.setAttribute('aria-label', tl('cerrarHoja'));
    cerrarBtn.title = tl('cerrarHoja');
    hoja.classList.toggle('lector__nota--cita', nota.k === 'c');
    /* Los colores se miden sobre el papel de ahora (el tema del lector): antes de pintar, para que la entrada ya los traiga */
    ponerColores(hoja, nota);
    notaActual = nota;
    if (!dejarDeMirar) dejarDeMirar = mirarTema(otroTema);
    if (nota.k === 'd') definicion(nota, idioma); else cita(nota, idioma);
    cuerpo.scrollTop = 0;
    if (!yaAbierta) {
      hoja.classList.add('is-abierta');
      ctx.fondo.classList.add('is-abierta', 'is-nota');
      ctx.detras().forEach((x) => { x.inert = true; });
    }
    cerrarBtn.focus({ preventScroll: true });
  }

  return { abrir, cerrar, abierta, hoja };
}
