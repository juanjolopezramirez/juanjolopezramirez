/* «SOBRE ESTE LIBRO»: la hoja que abre el «ⓘ» junto al titulo, en la banda del lector. site.js la carga la primera vez
   que se toca (import()) y la deja dentro del lector (#book-panel), como la hoja de una nota: en el telefono sube desde
   abajo; de 820 px para arriba cae debajo de la banda, junto al titulo que la abrio (base.css, «La ficha del libro»).

   Lo que dice, de arriba abajo: el titulo y su subtitulo (el autor, si se sabe), el tema (el de la ficha, o el estante de
   Recursos), el resumen, «Lo que encontrarás», «Para quién» y una fila de datos: paginas · idioma · tapa dura o revista ·
   «También en English» (que abre la otra edicion). Un libro sin ficha (los escritos en el codigo, como Ahavá) muestra
   solo el titulo, el tema y los datos.

   La ficha llega limpia, pero se limpia otra vez aqui (lector/ficha.js): es dato ajeno. Todo se escribe con textContent
   y nodos. Mientras esta abierta, lo de detras queda inerte; Escape la cierra (site.js lo pide por orden) y el foco
   vuelve al «ⓘ». */
import { fichaPorIdioma, limpiarFicha } from './ficha.js';

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
/* Un hueco ({n}, {l}, {a}) con un valor: con una funcion, para que un «$&» no se lea como patron */
const poner = (plantilla, hueco, valor) => String(plantilla).replace(hueco, () => String(valor));

/* La ficha que toca: la de un enlace privado (`ficha`), o de las de Recursos (`fichas`, por idioma) la del primer idioma
   de `orden`. → { idioma, ficha } (ficha {} si no hay) */
export function elegirFicha({ ficha, fichas, orden = [] } = {}) {
  if (fichas) {
    const r = fichaPorIdioma(fichas, orden);
    if (r) return r;
  }
  return { idioma: null, ficha: limpiarFicha(ficha) };
}

/* ctx: { panel, tl, fondo, detras: () => [nodos], alCerrar(a, sinFoco)? } */
export function crearHojaFicha(ctx) {
  const { panel, tl } = ctx;
  const hoja = nodo('section', 'lector__nota lector__nota--info');
  hoja.id = 'lector-info';
  hoja.setAttribute('role', 'dialog');
  hoja.setAttribute('aria-modal', 'true');
  hoja.setAttribute('aria-labelledby', 'lector-info-t');
  const cerrarBtn = nodo('button', 'lector__redondo lector__nota-x');
  cerrarBtn.type = 'button';
  cerrarBtn.appendChild(icono(['M6 6l12 12M18 6L6 18']));
  const cuerpo = nodo('div', 'lector__nota-cuerpo');
  hoja.append(cerrarBtn, cuerpo);
  panel.appendChild(hoja);

  let vuelve = null;
  const abierta = () => hoja.classList.contains('is-abierta');

  function cerrar(sinFoco) {
    if (!abierta()) return;
    hoja.classList.remove('is-abierta');
    ctx.fondo.classList.remove('is-abierta', 'is-nota', 'is-info');
    ctx.detras().forEach((x) => { x.inert = false; });
    const a = vuelve;
    vuelve = null;
    if (ctx.alCerrar) ctx.alCerrar(a, !!sinFoco);
    else if (!sinFoco && a && a.isConnected) a.focus({ preventScroll: true });
  }
  cerrarBtn.addEventListener('click', () => cerrar());

  /* Un trozo con su nombre: «Lo que encontrarás», «Para quién» */
  const trozo = (titulo, ...hijos) => {
    const s = nodo('section', 'lector__info-trozo');
    s.append(nodo('h4', 'lector__info-h', titulo), ...hijos);
    return s;
  };

  /* d: { titulo, subtitulo?, autor?, tema?, ficha?, fichas?, orden?, paginas, idioma (nombre), tipo (rotulo),
          tambien?: { nombre, lang, abrir() } } */
  function pintar(d) {
    const { idioma: lengua, ficha: f } = elegirFicha(d);
    const partes = [];
    const t = nodo('h3', 'lector__nota-t lector__info-t', d.titulo || '');
    t.id = 'lector-info-t';
    partes.push(t);
    if (d.subtitulo) partes.push(nodo('p', 'lector__info-sub', d.subtitulo));
    if (d.autor) partes.push(nodo('p', 'lector__info-autor', poner(tl('infoDe'), '{a}', d.autor)));
    /* El tema: el de la ficha, o el estante del libro. Va en una pastilla, debajo del titulo (nunca encima) */
    const tema = f.tema || d.tema || '';
    if (tema) {
      const p = nodo('p', 'lector__info-tema');
      p.append(nodo('span', 'sr-only', tl('infoTema') + ': '), nodo('span', 'lector__info-chip', tema));
      if (f.tema && lengua) p.lastChild.setAttribute('lang', lengua);
      partes.push(p);
    }
    /* Lo escrito por el autor, en el idioma de la ficha */
    const escrito = [];
    if (f.resumen) escrito.push(nodo('p', 'lector__nota-texto lector__info-resumen', f.resumen));
    if (f.claves && f.claves.length) {
      const ul = nodo('ul', 'lector__info-claves');
      f.claves.forEach((c) => ul.appendChild(nodo('li', '', c)));
      escrito.push(trozo(tl('infoClaves'), ul));
    }
    if (f.para_quien) escrito.push(trozo(tl('infoPara'), nodo('p', 'lector__info-para', f.para_quien)));
    if (escrito.length) {
      const caja = nodo('div', 'lector__info-escrito');
      if (lengua) caja.setAttribute('lang', lengua);
      caja.append(...escrito);
      partes.push(caja);
    }
    /* Los datos: lo que se sabe de todo libro */
    const datos = nodo('ul', 'lector__info-datos');
    datos.setAttribute('aria-label', tl('infoDatos'));
    const dato = (texto) => { if (texto) datos.appendChild(nodo('li', '', texto)); };
    if (d.paginas > 0) dato(d.paginas === 1 ? tl('infoPagina1') : poner(tl('infoPaginas'), '{n}', d.paginas));
    dato(d.idioma);
    dato(d.tipo);
    if (d.tambien && typeof d.tambien.abrir === 'function') {
      const li = nodo('li', 'lector__info-tambien');
      const b = nodo('button', 'lector__info-otra', poner(tl('infoTambien'), '{l}', d.tambien.nombre));
      b.type = 'button';
      b.title = poner(tl('infoTambienAyuda'), '{l}', d.tambien.nombre);
      b.addEventListener('click', () => { cerrar(true); d.tambien.abrir(); });
      li.appendChild(b);
      datos.appendChild(li);
    }
    if (datos.childElementCount) partes.push(datos);
    cuerpo.replaceChildren(...partes);
  }

  /* Abre la hoja con los datos del libro que se esta leyendo. `desde`: a donde vuelve el foco al cerrar (el «ⓘ»). */
  function abrir(d, desde) {
    if (!d) return;
    if (!abierta()) vuelve = desde || document.activeElement;
    hoja.setAttribute('lang', d.lang || 'es');
    cerrarBtn.setAttribute('aria-label', tl('cerrarHoja'));
    cerrarBtn.title = tl('cerrarHoja');
    pintar(d);
    cuerpo.scrollTop = 0;
    if (!abierta()) {
      hoja.classList.add('is-abierta');
      ctx.fondo.classList.add('is-abierta', 'is-nota', 'is-info');
      ctx.detras().forEach((x) => { x.inert = true; });
    }
    cerrarBtn.focus({ preventScroll: true });
  }

  return { abrir, cerrar, abierta, hoja };
}
