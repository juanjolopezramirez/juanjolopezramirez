/* EL PANEL DE LA DERECHA: solo aparece cuando se elige algo, y flota sobre la mesa para que la hoja no
   salte. Lo que se ve al elegir depende de lo elegido: una imagen, un cuadro, un boton, una zona, una
   pagina libre o una pieza del texto. Las medidas van en milimetros; por dentro son % de la hoja.

   Cada cambio pinta el panel aparte y lo compara con el que se ve: si la forma es la misma solo se ponen
   los valores nuevos, asi nada parpadea ni pierde el foco. Se reemplaza cuando cambia lo elegido. */
import { SelectorColor } from './SelectorColor.js';
import { icono } from './iconos.js';
import { enlaceDeBoton, COPIA_MAX, TEXTO_MAX } from '../../../../contenido/taller/tipos/boton.js';
import { REFERENCIA_MAX, TEXTO_MAX as PASAJE_MAX } from '../../../../contenido/taller/tipos/pasaje.js';
import { SUBETAPA_MAX } from '../../../../contenido/taller/tipos/subetapa.js';
import { NOMBRES_ICONO, arbolIcono } from '../../../../contenido/taller/iconosBoton.js';
import { armar } from '../../../../contenido/taller/armar.js';
import { BORDE_MAX, ESTILOS, LINEAS, OPACIDAD_MIN, PILDORA, RADIO_MAX, SOMBRAS, VERDE_DUOLINGO, conEstilo, limpiarAspecto } from '../../../../contenido/taller/aspectoBoton.js';
import { leerSvg } from './SvgSubido.js';
import { anclaNueva, esAncla, RE_ANCLA_PAGINA, textoIndice, TITULO_INDICE_MAX } from '../../../../contenido/taller/IndiceLibro.js';

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const mm = (pct, base) => Math.round(pct * base) / 100;
const CIERRE_MS = 130;
const DESARMAR_MS = 3000;
const CONTROLES = 'input, select, textarea, button';
const ATRIBUTOS = ['style', 'class', 'title', 'aria-pressed', 'aria-label', 'aria-invalid', 'placeholder'];

const fuera = (n) => n.closest('.tal-color__panel');
/* Una huella corta de un texto (djb2): basta para notar que un dibujo cambio */
const huella = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const firma = (e) => [...e.querySelectorAll('*')].filter((n) => !fuera(n)).map((n) => n.tagName + (n.dataset.clave || '')).join();

function igualar(a, b) {
  if (a.selector) { a.selector.poner(b.selector.valor); return; }
  for (const k of ATRIBUTOS) { if (b.hasAttribute(k)) a.setAttribute(k, b.getAttribute(k)); else a.removeAttribute(k); }
  if (a.matches('input, textarea, select')) {
    if (a.dataset.escribiendo) return;
    if (a.type === 'checkbox') a.checked = b.checked; else a.value = b.value;
    return;
  }
  if (!a.children.length) { if (a.textContent !== b.textContent) a.textContent = b.textContent; return; }
  [...a.children].forEach((h, i) => igualar(h, b.children[i]));
}

export class Propiedades {
  constructor(caja, { tx, mesa }) {
    Object.assign(this, { caja, tx, mesa });
    caja.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); this.volver(); } });
    /* Mientras alguien escribe en un campo, nada le cambia el valor; al guardarlo vuelve a mandar lo guardado */
    caja.addEventListener('input', (e) => { e.target.dataset.escribiendo = '1'; }, true);
    caja.addEventListener('change', (e) => { delete e.target.dataset.escribiendo; }, true);
    /* Con el boton del raton abajo el panel no se reemplaza: el boton pulsado desapareceria y el clic se perderia */
    caja.addEventListener('pointerdown', () => { this.apretado = true; }, true);
    const soltar = () => setTimeout(() => {
      this.apretado = false;
      const f = this.pendiente;
      this.pendiente = null;
      if (f) f();
    }, 0);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
  }

  /* ---- Las piezas del panel ---- */
  accion(texto, fn, clase = '') {
    const b = crear('button', `tal-btn ${clase}`, texto);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }

  /* Un boton de icono: dice lo que hace al pasar por encima y al lector de pantalla */
  conIcono(nombre, texto, fn, clase = '') {
    const b = crear('button', `tal-accion ${clase}`);
    b.type = 'button';
    b.title = texto;
    b.setAttribute('aria-label', texto);
    b.append(icono(nombre));
    b.addEventListener('click', fn);
    return b;
  }

  /* Dos pasos: el primero se pone en rojo, y solo el segundo borra */
  armado(nombre, texto, confirmar, fn) {
    let reloj = 0;
    const desarmar = () => {
      clearTimeout(reloj);
      b.dataset.armado = '';
      b.classList.remove('tal-accion--armada');
      b.title = texto;
      b.setAttribute('aria-label', texto);
    };
    const b = this.conIcono(nombre, texto, () => {
      if (b.dataset.armado === '1') { desarmar(); fn(); return; }
      b.dataset.armado = '1';
      b.classList.add('tal-accion--armada');
      b.title = confirmar;
      b.setAttribute('aria-label', confirmar);
      this.mesa.decir(confirmar);
      reloj = setTimeout(desarmar, DESARMAR_MS);
    }, 'tal-accion--aviso');
    b.addEventListener('blur', desarmar);
    return b;
  }

  par(texto, valor, alCambiar, tipo = 'number', max = 0) {
    const l = crear('label', tipo === 'checkbox' ? 'tal-par tal-par--marca' : 'tal-par'), i = crear('input');
    i.type = tipo;
    if (tipo === 'checkbox') i.checked = valor; else i.value = valor;
    if (tipo === 'text' && max) i.maxLength = max;
    i.addEventListener('change', () => alCambiar(tipo === 'number' ? Number(i.value) : tipo === 'checkbox' ? i.checked : i.value));
    l.append(crear('span', '', texto), i);
    return l;
  }

  /* Un numero con su nombre corto adentro: seis caben en dos filas */
  medida(corto, texto, valor, alCambiar) {
    const l = crear('label', 'tal-medida'), i = crear('input');
    i.type = 'number';
    i.value = valor;
    i.title = texto;
    i.setAttribute('aria-label', texto);
    i.addEventListener('change', () => alCambiar(Number(i.value)));
    l.append(crear('span', '', corto), i);
    return l;
  }

  /* Opciones que se excluyen: `op` es [valor, texto, icono?] */
  segmento(opciones, actual, fn) {
    const g = crear('div', 'tal-seg');
    for (const [k, t, ic] of opciones) {
      const b = crear('button', 'tal-seg__op', ic ? undefined : t);
      b.type = 'button';
      if (ic) { b.title = t; b.setAttribute('aria-label', t); b.append(icono(ic)); }
      b.setAttribute('aria-pressed', String(actual === k));
      b.addEventListener('click', () => fn(k));
      g.append(b);
    }
    return g;
  }

  /* Lo que rara vez se toca se pliega. Recuerda si estaba abierto mientras dure el libro. */
  pliegue(titulo, hijos) {
    const d = crear('details', 'tal-pliegue'), s = crear('summary', '', titulo);
    s.dataset.clave = `pliegue:${titulo}`;
    /* Cada pliegue recuerda lo suyo: abrir «Icono» no abre «Posición» */
    this.abiertos = this.abiertos || {};
    d.open = !!this.abiertos[titulo];
    d.addEventListener('toggle', () => { this.abiertos[titulo] = d.open; });
    d.append(s, ...hijos);
    return d;
  }

  /* Un color con su nombre. Su lista flota: el panel no crece. */
  color(etiqueta, valor, alCambiar) {
    const l = crear('div', 'tal-par');
    const s = new SelectorColor({ tx: this.tx, etiqueta, valor, recientes: () => this.mesa.coloresUsados(), alCambiar: (c) => { this.mesa.recordarColor(c); alCambiar(c); } });
    l.append(crear('span', '', etiqueta), s.nodo);
    return l;
  }

  /* ---- Abrir, cerrar y cambiar ---- */
  /* Primero sale del campo: lo escrito se guarda, y lo que eso pida rehacer se cancela despues. El contenido
     se queda un momento, para que se vea irse. */
  ocultar() {
    const a = document.activeElement;
    if (this.caja.contains(a)) a.blur();
    this.pendiente = null;
    this.dueno = null;
    this.caja.hidden = true;
    clearTimeout(this.relojVaciar);
    this.relojVaciar = setTimeout(() => { this.caja.replaceChildren(); this.lienzo = null; }, CIERRE_MS);
  }

  escribiendo() { return !!this.caja.querySelector('[data-escribiendo]'); }

  rehacer(hacer) {
    if (this.apretado) this.pendiente = hacer;
    else hacer();
  }

  entrar() { const c = this.caja.querySelector(CONTROLES); if (c) c.focus(); }

  /* `dueno` y `clave` dicen de que se esta hablando: si son otros, el panel se reemplaza */
  poner(pintar, dueno, clave) {
    clearTimeout(this.relojVaciar);
    const nuevo = crear('div', 'tal-panel__dentro');
    this.lienzo = nuevo;
    pintar();
    const hoy = this.caja.firstElementChild, igual = hoy && dueno === this.dueno && clave === this.clave && firma(hoy) === firma(nuevo);
    this.caja.hidden = false;
    if (igual) { igualar(hoy, nuevo); return; }
    this.dueno = dueno;
    this.clave = clave;
    this.conservarFoco(() => this.caja.replaceChildren(nuevo));
  }

  /* Al reemplazarlo el foco vuelve al mismo campo, o el teclado caeria al vacio */
  conservarFoco(pintar) {
    const a = document.activeElement, dentro = this.caja.contains(a);
    const nombre = (n) => n.dataset.clave || n.getAttribute('aria-label') || (n.closest('label') || n).textContent;
    const clave = dentro ? nombre(a) : '';
    pintar();
    if (!dentro) return;
    const igual = [...this.caja.querySelectorAll(CONTROLES)].find((n) => !fuera(n) && nombre(n) === clave);
    if (igual) igual.focus(); else this.volver();
  }

  /* Al salir del panel: a la hoja, o a las miniaturas si se hablaba de varias (ir a la hoja las soltaria) */
  volver() {
    if (this.dueno === 'varias') this.mesa.minis.entrar();
    else this.mesa.aLaHoja();
  }

  /* ---- Lo elegido ---- */
  /* `v` es la hoja libre. Sin objeto elegido, se habla de la pagina. */
  deHoja(v) {
    if (v.editando || v.bloqueada) { this.ocultar(); return; }
    this.rehacer(() => {
      const o = v.objeto();
      this.poner(() => { if (o) this.deObjeto(v, o); else this.dePagina(v); }, v, `${o ? o.id : 'hoja'}:${v.recortando}`);
    });
  }

  deObjeto(v, o) {
    const tx = this.tx, p = this.mesa.config(), l = this.lienzo;
    l.append(crear('h2', '', { imagen: tx.objImagen, texto: tx.objCuadro, zona: tx.objZona, boton: tx.objBoton }[o.tipo]));
    if (v.recortando) {
      const lados = crear('div', 'tal-pares');
      for (const k of ['l', 't', 'r', 'b']) lados.append(this.par(tx.recorteLados[k], Math.round(o.crop[k] * 1000) / 10, (n) => v.cambiarRecorte(k, n / 100)));
      l.append(crear('p', '', tx.recorteAyuda), lados, this.accion(tx.listo, () => v.terminarRecorte(), 'tal-btn--fuerte'), this.accion(tx.quitarRecorte, () => v.quitarRecorte()));
      return;
    }
    if (o.tipo === 'texto') l.append(this.color(tx.colorLetra, o.color, (c) => v.cambiar({ color: c })));
    if (o.tipo === 'boton') this.camposDeBoton(o, (x) => v.cambiar(x), () => v.objeto(o.id) || o);
    if (o.tipo === 'zona') l.append(this.par(tx.nombreZona, o.nombre, (t) => v.cambiar({ nombre: t }), 'text'));
    if (o.tipo === 'imagen') l.append(this.par(tx.alt, o.alt, (t) => v.cambiar({ alt: t }), 'text'), this.par(tx.adorno, o.decorativa, (s) => v.cambiar({ decorativa: s }), 'checkbox'));
    const g = crear('div', 'tal-medidas');
    const en = (k, eje) => (n) => v.cambiar({ [k]: (n / this.mesa.config()[eje]) * 100 });
    g.append(
      this.medida('An', tx.ancho, mm(o.w, p.anchoMm), en('w', 'anchoMm')), this.medida('Al', tx.alto, mm(o.h, p.altoMm), en('h', 'altoMm')),
      this.medida('X', 'X (mm)', mm(o.x, p.anchoMm), en('x', 'anchoMm')), this.medida('Y', 'Y (mm)', mm(o.y, p.altoMm), en('y', 'altoMm'))
    );
    if (o.tipo !== 'zona') g.append(this.medida('°', tx.giro, o.rot || 0, (n) => v.cambiar({ rot: n })));
    if (o.tipo === 'texto' || o.tipo === 'boton') g.append(this.medida('pt', tx.letraPt, parseFloat(o.tam), (n) => v.cambiar({ tam: `${n}pt` })));
    l.append(this.pliegue(tx.posicion, [g]));
    const ac = crear('div', 'tal-acciones');
    if (o.tipo === 'imagen') {
      ac.append(this.conIcono('recortar', tx.recortar, () => v.abrirRecorte()));
      if (Object.values(o.crop).some(Boolean)) ac.append(this.conIcono('sinRecorte', tx.quitarRecorte, () => v.quitarRecorte()));
    }
    ac.append(
      this.conIcono('adelante', tx.adelante, () => v.capa(1)), this.conIcono('atras', tx.atras, () => v.capa(-1)), this.conIcono('duplicar', tx.duplicar, () => v.duplicar()),
      this.conIcono('eliminar', tx.eliminar, () => v.eliminar(), 'tal-accion--aviso')
    );
    l.append(ac);
  }

  dePagina(v) {
    const tx = this.tx, a = v.attrs, l = this.lienzo;
    l.append(crear('h2', '', a.fondo ? tx.paginaPdf : tx.paginaLibre));
    /* Con nombre sale en el contenido del libro, como subtema de su capitulo. El ancla se pone una vez y se queda. */
    const nombre = this.par(tx.nombreEnContenido, a.titulo || '', (t) => {
      const titulo = textoIndice(t, TITULO_INDICE_MAX), ancla = v.attrs.ancla;
      v.cambiarHoja({ titulo, ancla: titulo && !esAncla(RE_ANCLA_PAGINA, ancla) ? anclaNueva('p') : ancla });
    }, 'text', TITULO_INDICE_MAX);
    nombre.querySelector('input').placeholder = tx.nombreEnContenidoAyuda;
    l.append(nombre);
    if (a.fondo) {
      l.append(crear('p', '', tx.pdfSinColor), this.par(tx.altPagina, a.alt, (t) => v.cambiarHoja({ alt: t }), 'text'));
      l.append(this.segmento([['contener', tx.ajusteContener], ['cubrir', tx.ajusteCubrir]], a.ajuste, (k) => v.cambiarHoja({ ajuste: k })));
    } else l.append(this.color(tx.colorHoja, a.papel, (c) => v.cambiarHoja({ papel: c })));
    const agregar = crear('div', 'tal-acciones'), pagina = crear('div', 'tal-acciones');
    agregar.append(this.conIcono('imagen', tx.agregarImagen, () => this.mesa.pedirImagen()), this.conIcono('cuadro', tx.agregarCuadro, () => this.mesa.insertar('cuadro')), this.conIcono('boton', tx.agregarBoton, () => this.mesa.insertar('boton')), this.conIcono('zona', tx.agregarZona, () => this.mesa.insertar('zona')));
    pagina.append(
      this.conIcono('subir', tx.subirPagina, () => this.mesa.moverPaso(v, -1)), this.conIcono('bajar', tx.bajarPagina, () => this.mesa.moverPaso(v, 1)),
      this.conIcono('duplicar', tx.duplicarPagina, () => this.mesa.duplicarPagina(v)), this.armado('eliminar', tx.eliminarPagina, tx.eliminarPaginaSeguro, () => this.mesa.borrarPagina(v))
    );
    l.append(crear('p', 'tal-rotulo', tx.agregar), agregar, crear('p', 'tal-rotulo', tx.estaPagina), pagina);
  }

  /* La capital del libro, vista desde un parrafo que la tiene. `c`: ConfigPagina.capital mas las letras del libro.
     Cada cambio va a los campos del libro (la flechita de la cinta) y se guarda por ese mismo camino. */
  deCapital(c) { this.rehacer(() => this.poner(() => this.pintarCapital(c), 'capital', `capital:${c.estilo}`)); }

  pintarCapital(c) {
    const tx = this.tx, l = this.lienzo, cambiar = (x) => this.mesa.alCapital(x);
    l.append(crear('h2', '', tx.capital), crear('p', 'tal-ayuda', tx.capitalLibro));
    l.append(crear('p', 'tal-rotulo', tx.capitalEstilo), this.segmento([['hundida', tx.capitalHundida], ['sencilla', tx.capitalSencilla]], c.estilo, (k) => cambiar({ capitalEstilo: k })));
    const letra = crear('label', 'tal-par'), sel = crear('select', 'tal-ctl');
    sel.dataset.clave = 'capital:letra';
    for (const [v, t] of [['', tx.fuenteDelLibro], ...c.fuentes.map((f) => [f, f])]) { const o = crear('option', '', t); o.value = v; sel.append(o); }
    sel.value = c.fuentes.includes(c.fuente) ? c.fuente : '';
    sel.addEventListener('change', () => cambiar({ capitalFuente: sel.value }));
    letra.append(crear('span', '', tx.fuente), sel);
    l.append(letra);
    if (c.estilo !== 'sencilla') {
      const altos = [2, 3, 4, ...(c.lineas === 5 ? [5] : [])].map((n) => [n, String(n)]);
      l.append(crear('p', 'tal-rotulo', tx.capitalLineas), this.segmento(altos, c.lineas, (n) => cambiar({ capitalLineas: String(n) })));
    }
    /* Vacio es automatico: crece con la letra */
    const espacio = crear('label', 'tal-par'), i = crear('input');
    i.type = 'number'; i.min = '0'; i.max = '6'; i.step = '0.1';
    i.placeholder = tx.capitalAuto;
    i.value = c.separaMm === 'auto' ? '' : c.separaMm;
    i.addEventListener('change', () => cambiar({ capitalSepara: i.value }));
    espacio.append(crear('span', '', tx.capitalSepara), i);
    l.append(espacio, this.accion(tx.capitalQuitar, () => this.mesa.quitarCapital()));
  }

  /* Varias paginas elegidas en las miniaturas. Los botones leen la eleccion al pulsarse: nunca una vieja. */
  /* `r`: { n, hojas, pdf, papel, ajuste } (Varias.resumenDe). Con otra mezcla de paginas, el panel se rehace. */
  deVarias(r) { this.rehacer(() => this.poner(() => this.pintarVarias(r), 'varias', `varias:${r.n}:${r.hojas}:${r.pdf}`)); }

  pintarVarias(r) {
    const tx = this.tx, l = this.lienzo, m = this.mesa, cuenta = (t, n = r.n) => t.replace('{n}', String(n)), ac = crear('div', 'tal-acciones');
    l.append(crear('h2', '', cuenta(tx.elegidas)), crear('p', '', tx.variasAyuda));
    /* Una pagina de PDF no lleva papel: lo que no cubre toma el del libro. Por eso aqui van aparte. */
    const colorDe = !r.pdf ? tx.colorVarias : r.hojas === 1 ? tx.colorDeLaHoja : cuenta(tx.colorDeLasHojas, r.hojas);
    if (r.hojas) l.append(this.color(colorDe, r.papel, (c) => m.papelVarias({ papel: c })));
    if (r.pdf) l.append(crear('p', 'tal-rotulo', r.pdf === 1 ? tx.ajusteDeLaPdf : cuenta(tx.ajusteDeLasPdf, r.pdf)), this.segmento([['contener', tx.ajusteContener], ['cubrir', tx.ajusteCubrir]], r.ajuste, (k) => m.papelVarias({ ajuste: k })));
    ac.append(
      this.conIcono('subir', tx.subirVarias, () => m.moverVariasPaso(-1)), this.conIcono('bajar', tx.bajarVarias, () => m.moverVariasPaso(1)),
      this.conIcono('duplicar', cuenta(tx.duplicarVarias), () => m.duplicarVarias()),
      this.armado('eliminar', cuenta(tx.eliminarVarias), cuenta(tx.eliminarVariasSeguro), () => m.borrarVarias())
    );
    l.append(ac, this.accion(tx.quitarEleccion, () => m.soltarEleccion(true)));
  }

  /* Lo que hace un boton, en la linea o en una pagina libre */
  camposDeBoton(o, cambiar, vivo = () => o) {
    const tx = this.tx, l = this.lienzo;
    l.append(this.par(tx.botonTexto, o.texto, (t) => cambiar({ texto: t }), 'text', TEXTO_MAX));
    l.append(this.segmento([['enlace', tx.botonEnlace], ['copiar', tx.botonCopiar]], o.accion, (k) => cambiar({ accion: k })));
    if (o.accion === 'enlace') {
      const c = this.par(tx.botonLink, o.enlace, (t) => { if (enlaceDeBoton(t) || !t) cambiar({ enlace: t }); else { i.setAttribute('aria-invalid', 'true'); this.mesa.decir(tx.botonLinkMal); } }, 'text');
      const i = c.querySelector('input');
      i.placeholder = 'https://';
      l.append(c);
    } else {
      const c = crear('label', 'tal-par'), t = crear('textarea');
      t.value = o.copia;
      t.rows = 3;
      t.maxLength = COPIA_MAX;
      t.addEventListener('change', () => cambiar({ copia: t.value }));
      c.append(crear('span', '', tx.botonPrompt), t);
      const pie = crear('div', 'tal-junto');
      pie.append(crear('p', '', tx.botonPdfCopiar), this.accion(tx.botonProbar, async () => {
        try { await navigator.clipboard.writeText(t.value); this.mesa.decir(tx.botonCopiado); } catch (e) { this.mesa.decir(tx.botonNoCopio); }
      }));
      l.append(c, pie);
    }
    const dos = crear('div', 'tal-pares');
    dos.append(this.color(tx.colorFondoBoton, o.fondo, (c) => cambiar({ fondo: c })), this.color(tx.colorLetra, o.color, (c) => cambiar({ color: c })));
    l.append(dos, this.pliegue(tx.icono, this.camposDeIcono(o, cambiar)), this.pliegue(tx.aspecto, this.camposDeAspecto(vivo, cambiar)));
  }

  /* Como se ve un boton: relleno, contorno, solo texto, pildora o «Duolingo», con su borde, esquinas, sombra y negrita. Cada campo
     se guarda ya limpio (aspectoBoton.js); lo que no se toca queda como el boton de siempre.
     `vivo` da el boton de AHORA: el panel se parcha en su sitio y sus oyentes no deben leer lo que habia al pintarlo. */
  camposDeAspecto(vivo, cambiar) {
    const tx = this.tx, ahora = () => limpiarAspecto(vivo().aspecto) || limpiarAspecto({}), a = ahora();
    const poner = (x) => cambiar({ aspecto: limpiarAspecto({ ...ahora(), ...x }) });
    const lista = [];
    const estilo = crear('label', 'tal-par'), sel = crear('select', 'tal-ctl');
    sel.dataset.clave = 'aspecto:estilo';
    for (const k of ESTILOS) { const op = crear('option', '', tx.aspectoEstilos[k]); op.value = k; sel.append(op); }
    sel.value = a.estilo;
    /* «Duolingo» sin color de relleno parte de su verde y su letra blanca: el borde de abajo sale de ahi */
    sel.addEventListener('change', () => {
      const o = vivo();
      cambiar({ aspecto: conEstilo(ahora(), sel.value), ...(sel.value === 'duolingo' && !o.fondo ? { fondo: VERDE_DUOLINGO, ...(o.color ? {} : { color: '#ffffff' }) } : {}) });
    });
    estilo.append(crear('span', '', tx.aspectoEstilo), sel);
    lista.push(estilo);
    const g = crear('div', 'tal-medidas');
    g.append(
      this.medida('Borde', tx.aspectoBorde, a.borde, (n) => poner({ borde: Math.min(BORDE_MAX, Math.max(0, n)) })),
      this.medida('Radio', tx.aspectoRadio, a.radio === PILDORA ? RADIO_MAX : a.radio ?? '', (n) => poner({ radio: Math.min(RADIO_MAX, Math.max(0, n)) })),
      this.medida('Opac.', tx.aspectoOpacidad, a.opacidad, (n) => poner({ opacidad: Math.min(100, Math.max(OPACIDAD_MIN, n)) }))
    );
    lista.push(g);
    if (a.borde > 0) {
      lista.push(this.segmento(LINEAS.map((k) => [k, tx.aspectoLineas[k]]), a.linea, (k) => poner({ linea: k })));
      lista.push(this.color(tx.aspectoBordeColor, a.bordeColor, (c) => poner({ bordeColor: c })));
    }
    lista.push(this.par(tx.aspectoPildora, a.radio === PILDORA, (s) => poner({ radio: s ? PILDORA : 8 }), 'checkbox'));
    lista.push(crear('p', 'tal-rotulo', tx.aspectoSombra), this.segmento(SOMBRAS.map((k) => [k, tx.aspectoSombras[k]]), a.sombra.tipo, (k) => poner({ sombra: { ...ahora().sombra, tipo: k } })));
    /* El escalon de abajo: calculado del relleno (un tono mas oscuro) o del color que se elija */
    if (a.sombra.tipo === 'dura') {
      lista.push(this.par(tx.aspectoSombraAuto, a.sombra.auto, (s) => poner({ sombra: { ...ahora().sombra, auto: s } }), 'checkbox'));
      if (!a.sombra.auto) lista.push(this.color(tx.aspectoSombraColor, a.sombra.color, (c) => poner({ sombra: { ...ahora().sombra, color: c } })));
    }
    lista.push(this.par(tx.aspectoNegrita, a.negrita, (s) => poner({ negrita: s }), 'checkbox'));
    lista.push(crear('p', 'tal-ayuda', tx.aspectoAyuda), this.accion(tx.aspectoQuitar, () => cambiar({ aspecto: null })));
    return lista;
  }

  /* El icono del boton: uno de la coleccion, el propio (un SVG revisado y hecho formas), o ninguno */
  camposDeIcono(o, cambiar) {
    const tx = this.tx, rejilla = crear('div', 'tal-iconos'), actual = o.icono || null;
    const opcion = (clave, texto, icono, elegido, fn) => {
      const b = crear('button', 'tal-icono-b');
      b.type = 'button';
      b.title = texto;
      b.dataset.clave = `icono:${clave}`;
      b.setAttribute('aria-label', texto);
      b.setAttribute('aria-pressed', String(elegido));
      const dibujo = icono && armar(arbolIcono(icono));
      if (dibujo) b.append(dibujo); else b.append(crear('span', '', '—'));
      b.addEventListener('click', fn);
      return b;
    };
    rejilla.append(opcion('ninguno', tx.sinIcono, null, !actual, () => cambiar({ icono: null, lado: 'izq' })));
    for (const n of NOMBRES_ICONO) rejilla.append(opcion(n, tx.iconosBoton[n], { nombre: n }, actual?.nombre === n, () => cambiar({ icono: { nombre: n } })));
    /* Su clave lleva una huella del dibujo: otro SVG con la misma forma de arbol rehace la muestra, no la parcha */
    if (actual?.propio) rejilla.append(opcion(`propio:${huella(JSON.stringify(actual.propio))}`, tx.iconoPropio, actual, true, () => {}));
    /* El archivo se lee aqui y se vuelve formas: nunca se guarda ni se pinta tal cual llego */
    const archivo = crear('input');
    archivo.type = 'file';
    archivo.accept = '.svg,image/svg+xml';
    archivo.hidden = true;
    archivo.addEventListener('change', async () => {
      const r = await leerSvg(archivo.files[0]);
      archivo.value = '';
      if (r.error) { this.mesa.decir(tx[r.error]); return; }
      cambiar({ icono: { propio: r.icono } });
      this.mesa.decir(tx.svgListo);
    });
    const subir = this.accion(tx.iconoSubir, () => archivo.click());
    const hijos = [rejilla, subir, archivo, crear('p', 'tal-ayuda', tx.iconoAyuda)];
    if (actual) hijos.splice(1, 0, this.segmento([['izq', tx.iconoIzq], ['der', tx.iconoDer], ['solo', tx.iconoSolo]], o.lado || 'izq', (k) => cambiar({ lado: k })));
    return hijos;
  }

  /* Un boton en su propia linea */
  deBoton(v) { this.rehacer(() => this.poner(() => this.pintarBoton(v), v, 'boton')); }

  pintarBoton(v) {
    const tx = this.tx, a = v.node.attrs, l = this.lienzo, cambiar = (x) => { v.updateAttributes(x); this.deBoton(v); };
    l.append(crear('h2', '', tx.objBoton));
    this.camposDeBoton(a, cambiar, () => v.node.attrs);
    /* Donde va: en su linea (izquierda, centro, derecha) o suelto. Suelto no ocupa renglon: se arrastra y se gira. */
    const s = a.suelto, lugar = s ? 'suelto' : a.alinear || '';
    l.append(crear('p', 'tal-rotulo', tx.botonLugar), this.segmento([['', tx.alinear.izquierda, 'izquierda'], ['centro', tx.alinear.centro, 'centro'], ['derecha', tx.alinear.derecha, 'derecha'], ['suelto', tx.botonSuelto]], lugar,
      (k) => cambiar(k === 'suelto' ? { suelto: v.acotar({ dx: 0, dy: 0, rot: 0 }) } : { alinear: k, suelto: null })));
    if (s) {
      const poner = (x) => cambiar({ suelto: v.acotar({ ...(v.node.attrs.suelto || s), ...x }) }), g = crear('div', 'tal-medidas');
      g.append(this.medida('→', tx.sueltoDx, s.dx, (n) => poner({ dx: n })), this.medida('↓', tx.sueltoDy, s.dy, (n) => poner({ dy: n })), this.medida('°', tx.sueltoGiro, s.rot, (n) => poner({ rot: n })));
      l.append(crear('p', 'tal-ayuda', tx.botonSueltoAyuda), g);
    }
    const ac = crear('div', 'tal-junto');
    ac.append(this.accion(tx.pasarLibre, () => this.mesa.pasarALibre(v)), this.conIcono('eliminar', tx.eliminar, () => this.mesa.borrarImagen(v), 'tal-accion--aviso'));
    l.append(ac);
  }

  /* Un pasaje biblico: su texto (con un renglon por versiculo, si se quiere) y su referencia */
  dePasaje(v) { this.rehacer(() => this.poner(() => this.pintarPasaje(v), v, 'pasaje')); }

  pintarPasaje(v) {
    const tx = this.tx, a = v.node.attrs, l = this.lienzo, cambiar = (x) => { v.updateAttributes(x); this.dePasaje(v); };
    l.append(crear('h2', '', tx.objPasaje));
    const c = crear('label', 'tal-par'), t = crear('textarea');
    t.value = a.texto;
    t.rows = 5;
    t.maxLength = PASAJE_MAX;
    t.dir = 'auto';
    t.placeholder = tx.pasajeTextoAyuda;
    t.addEventListener('change', () => cambiar({ texto: t.value }));
    c.append(crear('span', '', tx.pasajeTexto), t);
    const r = this.par(tx.pasajeReferencia, a.referencia, (s) => cambiar({ referencia: s }), 'text', REFERENCIA_MAX);
    r.querySelector('input').placeholder = tx.pasajeReferenciaAyuda;
    l.append(c, r, crear('p', '', tx.pasajeHebreo));
    const ac = crear('div', 'tal-junto');
    ac.append(this.conIcono('eliminar', tx.eliminar, () => this.mesa.borrarImagen(v), 'tal-accion--aviso'));
    l.append(ac);
  }

  /* Una subetapa: su nombre (tres de uso comun a un clic, o el que se quiera) */
  deSubetapa(v) { this.rehacer(() => this.poner(() => this.pintarSubetapa(v), v, 'subetapa')); }

  pintarSubetapa(v) {
    const tx = this.tx, a = v.node.attrs, l = this.lienzo, cambiar = (x) => { v.updateAttributes(x); this.deSubetapa(v); };
    l.append(crear('h2', '', tx.objSubetapa), crear('p', '', tx.subetapaAyuda));
    const c = this.par(tx.subetapaNombre, a.texto, (s) => cambiar({ texto: s }), 'text', SUBETAPA_MAX);
    c.querySelector('input').placeholder = tx.subetapaEjemplo;
    const usuales = crear('div', 'tal-junto');
    usuales.append(...tx.subetapasUsuales.map((t) => this.accion(t, () => cambiar({ texto: t }))));
    l.append(c, usuales);
    const ac = crear('div', 'tal-junto');
    ac.append(this.conIcono('eliminar', tx.eliminar, () => this.mesa.borrarImagen(v), 'tal-accion--aviso'));
    l.append(ac);
  }

  /* Una imagen dentro del texto */
  deImagen(v) { this.rehacer(() => this.poner(() => this.pintarImagen(v), v, 'imagen')); }

  pintarImagen(v) {
    const tx = this.tx, a = v.node.attrs, l = this.lienzo;
    l.append(crear('h2', '', tx.objImagenTexto), crear('p', '', tx.imagenTextoAyuda));
    l.append(
      this.segmento([['linea', tx.enLinea], ['izq', tx.aIzquierda], ['der', tx.aDerecha]], a.modo, (k) => { v.updateAttributes({ modo: k }); this.deImagen(v); }),
      this.par(tx.anchoPct, a.anchoPct, (n) => v.updateAttributes({ anchoPct: n })), this.par(tx.alt, a.alt, (t) => v.updateAttributes({ alt: t }), 'text'), this.par(tx.pie, a.pie, (t) => v.updateAttributes({ pie: t }), 'text'), this.par(tx.adorno, a.decorativa, (s) => v.updateAttributes({ decorativa: s }), 'checkbox')
    );
    const ac = crear('div', 'tal-junto');
    ac.append(this.accion(tx.pasarLibre, () => this.mesa.pasarALibre(v)), this.conIcono('eliminar', tx.eliminar, () => this.mesa.borrarImagen(v), 'tal-accion--aviso'));
    l.append(ac);
  }
}
