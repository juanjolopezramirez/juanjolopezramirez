/* El editor de bloques estilo Notion (Developer-Mode → Trabajos y Proyectos → «Su página»).

   Una lista de bloques que se escriben en el sitio:
     · parrafo, titulo, subtitulo y cita se escriben DIRECTO (contenteditable), con
       Negrita, Cursiva y Enlace. Enter parte el parrafo y abre uno nuevo; Mayus+Enter es
       un salto de linea; borrar en un parrafo vacio lo quita; «/» en un parrafo vacio abre
       el menu de bloques (como en Notion);
     · lista, imagen, video, columnas, boton y separador tienen sus campos;
     · cada bloque se sube, se baja o se quita con sus botones (teclado incluido).

   LO QUE ENTRA Y LO QUE SALE: al pegar, solo texto (nunca el HTML del portapapeles). Al
   leer, el DOM de lo escrito se convierte en TROZOS ({ t, b, i, href }) y nada mas: lo que
   no es texto, negrita, cursiva o un enlace seguro se pierde. Al pintar, los trozos se
   vuelven nodos con createElement/textContent. Nunca innerHTML.

   Las columnas llevan dentro otro EditorBloques (sin columnas: no caben unas en otras).
   Las imagenes elegidas no se suben aqui: se avisan (`alElegirImagen`) y las sube el
   editor de la casa al guardar. */
import { Documento } from '../../../contenido/Documento.js';
import { nuevoId, COLUMNAS_MAX } from '../../../contenido/bloques.js';
import { enlaceSeguro } from '../../../contenido/comun.js';

const MENU = ['parrafo', 'titulo', 'subtitulo', 'lista', 'cita', 'imagen', 'video', 'columnas', 'boton', 'separador'];
const ESCRITOS = new Set(['parrafo', 'titulo', 'subtitulo', 'cita']);

/* El id de 11 letras de un video de YouTube, venga como venga (enlace largo, corto,
   shorts, embed o el id solo), o '' */
export function idDeYoutube(texto) {
  const t = String(texto || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return t;
  let u;
  try { u = new URL(t); } catch (e) { return ''; }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id = '';
  if (host === 'youtu.be') id = u.pathname.slice(1, 12);
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/) || [])[1] || '';
  }
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
}

/* ---- Del DOM escrito a trozos, y de trozos al DOM ---------------------------------------- */
export function domATrozos(raiz) {
  const salida = [];
  const empujar = (t, m) => salida.push({ t, ...(m.b ? { b: true } : {}), ...(m.i ? { i: true } : {}), ...(m.href ? { href: m.href } : {}) });
  const andar = (n, m) => {
    if (n.nodeType === 3) { if (n.nodeValue) empujar(n.nodeValue, m); return; }
    if (n.nodeType !== 1) return;
    const tag = n.tagName;
    if (tag === 'BR') { empujar('\n', m); return; }
    const m2 = { ...m };
    if (tag === 'B' || tag === 'STRONG' || /^(bold|[6-9]00)$/.test(n.style.fontWeight)) m2.b = true;
    if (tag === 'I' || tag === 'EM' || n.style.fontStyle === 'italic') m2.i = true;
    if (tag === 'A') { const h = n.getAttribute('href'); if (enlaceSeguro(h)) m2.href = h; }
    /* Un <div> o <p> que el navegador mete al escribir es un salto de linea */
    if ((tag === 'DIV' || tag === 'P') && salida.length && !salida[salida.length - 1].t.endsWith('\n')) empujar('\n', m);
    n.childNodes.forEach((h) => andar(h, m2));
  };
  raiz.childNodes.forEach((h) => andar(h, {}));
  /* Juntar los trozos vecinos con las mismas marcas, y sin saltos al final */
  const juntos = [];
  for (const x of salida) {
    const ult = juntos[juntos.length - 1];
    if (ult && !!ult.b === !!x.b && !!ult.i === !!x.i && ult.href === x.href) ult.t += x.t;
    else juntos.push({ ...x });
  }
  while (juntos.length && /^\n*$/.test(juntos[juntos.length - 1].t)) juntos.pop();
  if (juntos.length) juntos[juntos.length - 1].t = juntos[juntos.length - 1].t.replace(/\n+$/, '');
  return juntos.filter((x) => x.t);
}

export function trozosADom(raiz, trozos) {
  raiz.replaceChildren();
  for (const x of trozos || []) {
    let nodo = document.createDocumentFragment();
    x.t.split('\n').forEach((linea, i) => {
      if (i) nodo.appendChild(document.createElement('br'));
      if (linea) nodo.appendChild(document.createTextNode(linea));
    });
    const envolver = (tag, attrs = {}) => {
      const e = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      e.appendChild(nodo);
      nodo = e;
    };
    if (x.b) envolver('b');
    if (x.i) envolver('i');
    if (x.href && enlaceSeguro(x.href)) envolver('a', { href: x.href });
    raiz.appendChild(nodo);
  }
}

/* ---- Pequeñas fabricas de DOM ------------------------------------------------------------ */
function el(tag, attrs = {}, hijos = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'texto') e.textContent = v;
    else if (k === 'clase') e.className = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const h of hijos) if (h) e.appendChild(h);
  return e;
}
let contador = 0;
const unico = (base) => `bed-${base}-${++contador}`;

export class EditorBloques {
  /** @param {Element} caja
      @param {{ tx: object, dentro?: boolean, alElegirImagen?: (id, archivo) => void, cargarImagen?: (ruta) => Promise<Blob|null> }} op */
  constructor(caja, op) {
    this.caja = caja;
    this.tx = op.tx || {};
    this.dentro = !!op.dentro;
    this.alElegirImagen = op.alElegirImagen || (() => {});
    this.cargarImagen = op.cargarImagen || (async () => null);
    this.decir = op.decir || (() => {});                 // anunciar sin mover el foco (EditorContenido.decir)
    this.op = op;
    this.reemplazar = null;                // el bloque que «/» va a cambiar
    this.vacio = el('p', { clase: 'bed__vacio', texto: this.tx.vacio });
    this.lista = el('div', { clase: 'bed__lista' });
    this.botonAnadir = el('button', { type: 'button', clase: 'portal__boton portal__boton--suave bed__anadir', 'aria-expanded': 'false', texto: this.tx.anadir });
    this.menu = this.crearMenu();
    this.botonAnadir.setAttribute('aria-controls', this.menu.id);
    caja.replaceChildren(...(this.dentro ? [] : [this.vacio]), this.lista, this.botonAnadir, this.menu);
    this.botonAnadir.addEventListener('click', () => this.abrirMenu(null));
    this.pintarVacio();
  }

  /* ---- Cargar y leer ----------------------------------------------------------------------- */
  cargar(json) {
    this.lista.replaceChildren();
    const doc = new Documento(json || {});
    for (const b of doc.bloques) this.lista.appendChild(this.vista(b.aJSON()));
    this.pintarVacio();
  }
  /* Los bloques ya cargados (para columnas: llegan como JSON de bloques) */
  cargarBloques(bloques) { this.cargar({ bloques }); }

  leer() { return { version: 1, bloques: this.vistas().map((v) => this.leerVista(v)).filter(Boolean) }; }
  vistas() { return [...this.lista.children].filter((v) => v.dataset.bloque); }

  pintarVacio() { this.vacio.hidden = this.vistas().length > 0; }

  /* Para que los errores salgan en su bloque: cada vista y cada campo dicen su camino
     (cuerpo.es.bloques.3.alt), el mismo que da Casa.validar() */
  numerar(prefijo) {
    this.vistas().forEach((v, i) => {
      v.dataset.campo = `${prefijo}.${i}`;
      /* (solo los suyos: los de los bloques de dentro de unas columnas los numera su editor) */
      v.querySelectorAll(':scope > .bed__cuerpo [data-sub]').forEach((c) => {
        if (c.closest('.bed__bloque') === v) c.dataset.campo = `${prefijo}.${i}.${c.dataset.sub}`;
      });
      if (v._columnas) v._columnas.forEach((ed, c) => ed.numerar(`${prefijo}.${i}.columnas.${c}`));
    });
  }

  /* ---- El menu de bloques ------------------------------------------------------------------- */
  crearMenu() {
    const menu = el('div', { clase: 'bed__menu', id: unico('menu'), role: 'group', 'aria-label': this.tx.anadirAqui, hidden: true });
    for (const tipo of MENU) {
      if (this.dentro && tipo === 'columnas') continue;
      const t = (this.tx.tipos && this.tx.tipos[tipo]) || { nombre: tipo, linea: '' };
      const b = el('button', { type: 'button', clase: 'bed__opcion', 'data-tipo': tipo }, [
        el('span', { clase: 'bed__opcion-nombre', texto: t.nombre }),
        el('span', { clase: 'bed__opcion-linea', texto: t.linea })
      ]);
      b.addEventListener('click', () => this.elegir(tipo));
      menu.appendChild(b);
    }
    menu.addEventListener('keydown', (e) => {
      const ops = [...menu.querySelectorAll('.bed__opcion')];
      const i = ops.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.cerrarMenu(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); ops[(i + 1) % ops.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); ops[(i - 1 + ops.length) % ops.length].focus(); }
    });
    /* Salir del menu con Tab (o un clic fuera) lo cierra: no se queda abierto «a medias» */
    menu.addEventListener('focusout', (e) => {
      if (menu.hidden || (e.relatedTarget && menu.contains(e.relatedTarget))) return;
      setTimeout(() => { if (!menu.hidden && !menu.contains(document.activeElement)) this.cerrarMenu(false); }, 0);
    });
    return menu;
  }
  abrirMenu(reemplazar) {
    this.reemplazar = reemplazar;
    this.menu.hidden = false;
    /* «Añadir» solo dice «abierto» cuando fue el quien lo abrio (no «/» en un parrafo) */
    this.botonAnadir.setAttribute('aria-expanded', reemplazar ? 'false' : 'true');
    if (reemplazar) reemplazar.after(this.menu); else this.botonAnadir.after(this.menu);
    const primero = this.menu.querySelector('.bed__opcion');
    if (primero) primero.focus();
  }
  cerrarMenu(volver) {
    const de = this.reemplazar;
    this.menu.hidden = true;
    this.botonAnadir.setAttribute('aria-expanded', 'false');
    this.reemplazar = null;
    this.caja.appendChild(this.menu);
    if (!volver) return;
    const editable = de && de.querySelector('[contenteditable]');
    (editable || this.botonAnadir).focus();
  }
  elegir(tipo) {
    const nuevo = this.vista({ tipo: tipo === 'subtitulo' ? 'titulo' : tipo, nivel: tipo === 'subtitulo' ? 3 : 2 });
    if (this.reemplazar) this.reemplazar.replaceWith(nuevo);
    else this.lista.appendChild(nuevo);
    this.cambio();
    this.cerrarMenu(false);
    this.pintarVacio();
    this.enfocar(nuevo);
  }
  enfocar(vista, alFinal = false) {
    /* Primero lo que se escribe directo; si no, el primer campo VISIBLE (no el del enlace,
       que esta escondido hasta que se pide) */
    const campos = [...vista.querySelectorAll(':scope > .bed__cuerpo input:not([type="file"]):not([type="checkbox"]), :scope > .bed__cuerpo textarea, :scope > .bed__cuerpo select')]
      .filter((c) => !c.closest('[hidden]'));
    const objetivo = vista.querySelector(':scope > .bed__cuerpo [contenteditable]') || campos[0] || vista.querySelector('button');
    if (!objetivo) return;
    objetivo.focus();
    if (alFinal && objetivo.isContentEditable) {
      const r = document.createRange();
      r.selectNodeContents(objetivo);
      r.collapse(false);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    }
  }

  /* ---- Un bloque en pantalla ---------------------------------------------------------------- */
  vista(b) {
    const tipoMenu = b.tipo === 'titulo' && b.nivel === 3 ? 'subtitulo' : b.tipo;
    const nombre = (this.tx.tipos && this.tx.tipos[tipoMenu] && this.tx.tipos[tipoMenu].nombre) || b.tipo;
    const v = el('div', { clase: `bed__bloque bed__bloque--${b.tipo}`, 'data-bloque': tipoMenu, 'data-id': b.id || nuevoId(), role: 'group', 'aria-label': nombre });
    const barra = el('div', { clase: 'bed__barra' }, [
      el('span', { clase: 'bed__tipo', texto: nombre, 'aria-hidden': 'true' }),
      this.boton(this.tx.subir, () => this.mover(v, -1), nombre),
      this.boton(this.tx.bajar, () => this.mover(v, 1), nombre),
      this.boton(this.tx.quitar, () => this.quitar(v), nombre)
    ]);
    const cuerpo = el('div', { clase: 'bed__cuerpo' });
    v.append(barra, cuerpo);
    const armar = {
      parrafo: () => this.armarEscrito(v, cuerpo, b, 'p'),
      subtitulo: () => this.armarEscrito(v, cuerpo, b, 'h3'),
      titulo: () => this.armarEscrito(v, cuerpo, b, 'h2'),
      cita: () => this.armarCita(v, cuerpo, b),
      lista: () => this.armarLista(v, cuerpo, b),
      imagen: () => this.armarImagen(v, cuerpo, b),
      video: () => this.armarVideo(v, cuerpo, b),
      columnas: () => this.armarColumnas(v, cuerpo, b),
      boton: () => this.armarBoton(v, cuerpo, b),
      separador: () => cuerpo.appendChild(el('hr', { clase: 'bed__raya' }))
    };
    (armar[tipoMenu] || armar.parrafo)();
    return v;
  }
  boton(texto, alPulsar, de) {
    const b = el('button', { type: 'button', clase: 'bed__accion', texto, 'aria-label': `${texto} (${de})` });
    b.addEventListener('click', alPulsar);
    return b;
  }
  /* Subir y bajar dicen donde quedo el bloque («Párrafo: 2 de 5.»), o que ya no se puede */
  mover(v, paso) {
    const otro = paso < 0 ? v.previousElementSibling : v.nextElementSibling;
    if (!otro || !otro.dataset.bloque) { this.decir(paso < 0 ? this.tx.arriba : this.tx.abajo); return; }
    if (paso < 0) otro.before(v); else otro.after(v);
    this.cambio();
    const b = v.querySelector(`:scope > .bed__barra .bed__accion:nth-of-type(${paso < 0 ? 1 : 2})`);
    if (b) b.focus();
    const todas = this.vistas();
    if (this.tx.movido) this.decir(this.tx.movido.replace('{bloque}', v.getAttribute('aria-label')).replace('{n}', todas.indexOf(v) + 1).replace('{total}', todas.length));
  }
  quitar(v) {
    const vecino = v.previousElementSibling || v.nextElementSibling;
    v.remove();
    this.cambio();
    this.pintarVacio();
    this.decir(this.tx.quitado);
    if (vecino && vecino.dataset.bloque) this.enfocar(vecino, true); else this.botonAnadir.focus();
  }
  /* Añadir, mover y quitar no escriben en ningun campo: se avisa a quien edita (EditorCasa
     lo usa para saber que hay cambios sin guardar) */
  cambio() { if (this.op.alCambiar) this.op.alCambiar(); }
  campo(sub, etiqueta, control, extra) {
    const id = control.id || unico(sub);
    control.id = id;
    return el('div', { clase: 'dev__campo bed__campo', 'data-sub': sub }, [
      el('label', { clase: 'portal__etiqueta', for: id, texto: etiqueta }), control, extra || null
    ]);
  }
  casilla(nombre, texto, marcada) {
    const c = el('input', { type: 'checkbox', name: nombre });
    c.checked = !!marcada;
    return el('label', { clase: 'dev__casilla' }, [c, el('span', { texto })]);
  }

  /* Lo escrito directo: parrafo, titulo, subtitulo (y el texto de la cita) */
  armarEscrito(v, cuerpo, b, como) {
    /* En un parrafo, la pista de «/» va en el propio campo (se ve y se oye) */
    const pista = como === 'p' && !this.dentro ? this.tx.escribeBarra || this.tx.escribe : this.tx.escribe;
    const ed = el('div', {
      clase: `bed__texto bed__texto--${como}`, contenteditable: 'true', role: 'textbox', 'aria-multiline': como === 'p' ? 'true' : 'false',
      'aria-label': v.getAttribute('aria-label'), 'data-placeholder': pista, 'aria-placeholder': pista, spellcheck: 'true'
    });
    trozosADom(ed, b.texto || []);
    const marcas = this.barraDeMarcas(ed);
    const envoltura = el('div', { 'data-sub': 'texto' }, [marcas, ed]);
    cuerpo.appendChild(envoltura);
    this.teclado(v, ed, como === 'p');
    return ed;
  }
  armarCita(v, cuerpo, b) {
    this.armarEscrito(v, cuerpo, b, 'blockquote');
    const autor = el('input', { clase: 'portal__entrada', maxlength: '120', autocomplete: 'off', 'data-c': 'autor' });
    autor.value = b.autor || '';
    cuerpo.appendChild(this.campo('autor', this.tx.citaAutor, autor));
  }
  barraDeMarcas(ed) {
    const barra = el('div', { clase: 'bed__marcas', role: 'group', 'aria-label': `${this.tx.negrita}, ${this.tx.cursiva}, ${this.tx.enlace}` });
    const accion = (texto, clase, fn) => {
      const b = el('button', { type: 'button', clase: `bed__marca ${clase}`, texto });
      /* mousedown sin perder la seleccion del texto */
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', fn);
      return b;
    };
    const enlace = el('div', { clase: 'bed__enlace', id: unico('enlace'), hidden: true });
    const avisoId = unico('enlace-error');
    const ayudaId = unico('enlace-ayuda');
    const campo = el('input', { clase: 'portal__entrada dev__mono', type: 'text', 'aria-label': this.tx.enlace, 'aria-describedby': ayudaId, spellcheck: 'false', autocomplete: 'off' });
    const ayuda = el('p', { clase: 'portal__ayuda', id: ayudaId, texto: this.tx.enlaceCampo });
    const aviso = el('p', { clase: 'dev__error', id: avisoId, role: 'alert', hidden: true });
    let rango = null;
    const poner = () => {
      const h = campo.value.trim();
      if (!enlaceSeguro(h)) {
        aviso.hidden = false;
        aviso.textContent = this.op.enlaceMalo || this.tx.enlaceMalo;
        campo.setAttribute('aria-invalid', 'true');
        campo.setAttribute('aria-describedby', `${ayudaId} ${avisoId}`);
        campo.focus();
        return;
      }
      campo.removeAttribute('aria-invalid');
      campo.setAttribute('aria-describedby', ayudaId);
      ed.focus();
      if (rango) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(rango); }
      document.execCommand('createLink', false, h);
      cerrarEnlace();
    };
    const cerrarEnlace = () => { enlace.hidden = true; botonEnlace.setAttribute('aria-expanded', 'false'); };
    const quitarEnlace = () => {
      ed.focus();
      if (rango) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(rango); }
      document.execCommand('unlink');
      cerrarEnlace();
    };
    enlace.append(campo,
      accion(this.tx.enlacePon, 'bed__marca--texto', poner),
      accion(this.tx.enlaceQuita, 'bed__marca--texto', quitarEnlace),
      ayuda,
      aviso);
    campo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); poner(); }
      if (e.key === 'Escape') { e.preventDefault(); cerrarEnlace(); ed.focus(); }
    });
    const botonEnlace = accion(this.tx.enlace, 'bed__marca--a', () => {
      const s = window.getSelection();
      rango = s.rangeCount && ed.contains(s.anchorNode) ? s.getRangeAt(0).cloneRange() : null;
      const a = s.anchorNode && s.anchorNode.parentElement && s.anchorNode.parentElement.closest('a');
      campo.value = a && ed.contains(a) ? a.getAttribute('href') : '';
      aviso.hidden = true;
      campo.removeAttribute('aria-invalid');
      enlace.hidden = false;
      botonEnlace.setAttribute('aria-expanded', 'true');
      campo.focus();
    });
    botonEnlace.setAttribute('aria-expanded', 'false');
    botonEnlace.setAttribute('aria-controls', enlace.id);
    barra.append(
      accion(this.tx.negrita, 'bed__marca--b', () => { ed.focus(); document.execCommand('bold'); }),
      accion(this.tx.cursiva, 'bed__marca--i', () => { ed.focus(); document.execCommand('italic'); }),
      botonEnlace
    );
    const caja = el('div', { clase: 'bed__marcas-caja' }, [barra, enlace]);
    return caja;
  }
  teclado(v, ed, esParrafo) {
    ed.addEventListener('paste', (e) => {
      e.preventDefault();
      const texto = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
      document.execCommand('insertText', false, texto.slice(0, 20000));
    });
    /* Arrastrar y soltar tambien entra como texto puro (nunca el HTML de otra pagina) */
    ed.addEventListener('drop', (e) => {
      e.preventDefault();
      const texto = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || '';
      if (!texto) return;
      const punto = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
      ed.focus();
      if (punto && ed.contains(punto.startContainer)) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(punto); }
      document.execCommand('insertText', false, texto.slice(0, 20000));
    });
    ed.addEventListener('keydown', (e) => {
      const vacio = !ed.textContent.length;
      if (e.key === '/' && vacio && esParrafo) { e.preventDefault(); this.abrirMenu(v); return; }
      if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); document.execCommand('insertLineBreak'); return; }
      if (e.key === 'Enter') {
        e.preventDefault();
        /* Lo que hay despues del cursor se va al parrafo nuevo (como en Notion) */
        const s = window.getSelection();
        let resto = [];
        if (s.rangeCount && ed.contains(s.anchorNode)) {
          const r = s.getRangeAt(0).cloneRange();
          r.setEndAfter(ed.lastChild || ed);
          const trozo = el('div');
          trozo.appendChild(r.extractContents());
          resto = domATrozos(trozo);
        }
        const nuevo = this.vista({ tipo: 'parrafo', texto: resto });
        v.after(nuevo);
        this.pintarVacio();
        this.enfocar(nuevo);
        return;
      }
      /* Borrar en un PARRAFO vacio lo quita (como en Notion); un titulo o una cita vacios
         no: se quitan con su boton, para no perder uno sin querer */
      if (e.key === 'Backspace' && vacio && esParrafo) {
        e.preventDefault();
        const antes = v.previousElementSibling;
        v.remove();
        this.pintarVacio();
        this.decir(this.tx.quitado);
        if (antes && antes.dataset.bloque) this.enfocar(antes, true); else this.botonAnadir.focus();
      }
    });
  }

  armarLista(v, cuerpo, b) {
    const area = el('textarea', { clase: 'portal__entrada portal__entrada--texto', rows: '4', maxlength: '8000', 'data-c': 'items' });
    area.value = (b.items || []).map((it) => it.map((x) => x.t).join('')).join('\n');
    cuerpo.append(this.campo('items', this.tx.listaAyuda, area), this.casilla('ordenada', this.tx.conNumeros, b.ordenada));
  }

  armarImagen(v, cuerpo, b) {
    v.dataset.src = b.src || '';
    const nombreId = unico('imagen-nombre');
    const input = el('input', { clase: 'dev__archivo', type: 'file', accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp', 'aria-describedby': nombreId });
    const nombre = el('span', { clase: 'dev__elegir-nombre', id: nombreId, texto: b.src ? b.src.split('/').pop() : (this.op.ningunArchivo || '') });
    const elegir = el('span', { clase: 'dev__elegir' }, [input, el('span', { clase: 'dev__elegir-boton', 'aria-hidden': 'true', texto: this.tx.imagenElegir }), nombre]);
    input.setAttribute('aria-label', this.tx.imagenElegir);
    const lienzo = el('canvas', { clase: 'bed__imagen', width: '320', height: '180', 'aria-hidden': 'true' });
    const muestra = el('div', { clase: 'bed__muestra', hidden: true }, [lienzo]);
    const pintar = async (blob) => {
      try {
        const img = await createImageBitmap(blob);
        const ancho = 320;
        lienzo.width = ancho;
        lienzo.height = Math.max(1, Math.round(ancho * (img.height / img.width)));
        lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
        if (img.close) img.close();
        muestra.hidden = false;
      } catch (e) { muestra.hidden = true; }
    };
    input.addEventListener('change', () => {
      const archivo = input.files && input.files[0];
      if (!archivo) return;
      nombre.textContent = archivo.name;
      this.alElegirImagen(v.dataset.id, archivo);
      pintar(archivo);
    });
    if (b.src) this.cargarImagen(b.src).then((blob) => { if (blob) pintar(blob); }, () => {});
    const alt = el('input', { clase: 'portal__entrada', maxlength: '300', autocomplete: 'off', 'data-c': 'alt' });
    alt.value = b.alt || '';
    const pie = el('input', { clase: 'portal__entrada', maxlength: '300', autocomplete: 'off', 'data-c': 'pie' });
    pie.value = b.pie || '';
    cuerpo.append(
      el('div', { clase: 'dev__campo bed__campo', 'data-sub': 'src' }, [elegir]),
      muestra,
      this.campo('alt', this.tx.imagenAlt, alt),
      this.casilla('decorativa', this.tx.imagenDecorativa, b.decorativa),
      this.campo('pie', this.tx.imagenPie, pie),
      this.casilla('ia', this.tx.hechaIA, b.ia)
    );
  }

  armarVideo(v, cuerpo, b) {
    const enlace = el('input', { clase: 'portal__entrada dev__mono', type: 'url', autocomplete: 'off', spellcheck: 'false', 'data-c': 'ref' });
    enlace.value = b.ref ? `https://youtu.be/${b.ref}` : '';
    const estado = el('p', { clase: 'dev__medida', 'aria-live': 'polite' });
    const revisar = () => {
      const id = idDeYoutube(enlace.value);
      estado.textContent = enlace.value && !id ? this.tx.videoMalo : '';
      estado.classList.toggle('dev__medida--mal', !!(enlace.value && !id));
    };
    enlace.addEventListener('change', revisar);
    const titulo = el('input', { clase: 'portal__entrada', maxlength: '160', autocomplete: 'off', 'data-c': 'titulo' });
    titulo.value = b.titulo || '';
    cuerpo.append(this.campo('ref', this.tx.videoEnlace, enlace, estado), this.campo('titulo', this.tx.videoTitulo, titulo), this.casilla('ia', this.tx.hechaIA, b.ia));
  }

  armarColumnas(v, cuerpo, b) {
    const cuantas = el('select', { clase: 'portal__entrada dev__select dev__corto', 'data-c': 'n' });
    for (let n = 2; n <= COLUMNAS_MAX; n += 1) cuantas.appendChild(el('option', { value: String(n), texto: String(n) }));
    const cols = Array.isArray(b.columnas) && b.columnas.length >= 2 ? b.columnas : [[], []];
    cuantas.value = String(Math.min(COLUMNAS_MAX, cols.length));
    const rejilla = el('div', { clase: 'bed__columnas' });
    v._columnas = [];
    const crear = (bloques, n) => {
      const caja = el('div', { clase: 'bed__columna', role: 'group', 'aria-label': (this.tx.columna || 'Columna {n}').replace('{n}', n) });
      rejilla.appendChild(caja);
      const ed = new EditorBloques(caja, { ...this.op, dentro: true });
      ed.cargarBloques(bloques);
      v._columnas.push(ed);
    };
    cols.forEach((c, i) => crear(c, i + 1));
    cuantas.addEventListener('change', () => {
      const n = Number(cuantas.value);
      while (v._columnas.length < n) crear([], v._columnas.length + 1);
      /* Al quitar una columna, sus bloques pasan a la anterior (no se pierden) */
      while (v._columnas.length > n) {
        const ultima = v._columnas.pop();
        const destino = v._columnas[v._columnas.length - 1];
        ultima.vistas().forEach((x) => destino.lista.appendChild(x));
        destino.pintarVacio();
        ultima.caja.remove();
      }
      rejilla.dataset.n = String(n);
    });
    rejilla.dataset.n = cuantas.value;
    cuerpo.append(this.campo('columnas', this.tx.columnas, cuantas), rejilla);
  }

  armarBoton(v, cuerpo, b) {
    const texto = el('input', { clase: 'portal__entrada', maxlength: '60', autocomplete: 'off', 'data-c': 'texto' });
    texto.value = b.texto || '';
    const href = el('input', { clase: 'portal__entrada dev__mono', maxlength: '500', autocomplete: 'off', spellcheck: 'false', placeholder: this.tx.enlaceCampo, 'data-c': 'href' });
    href.value = b.href || '';
    const estilo = el('select', { clase: 'portal__entrada dev__select', 'data-c': 'estilo' }, [
      el('option', { value: 'lleno', texto: this.tx.botonLleno }), el('option', { value: 'suave', texto: this.tx.botonSuave })
    ]);
    estilo.value = b.estilo === 'suave' ? 'suave' : 'lleno';
    cuerpo.append(this.campo('texto', this.tx.botonTexto, texto), this.campo('href', this.tx.botonEnlace, href), this.campo('estilo', this.tx.botonEstilo, estilo));
  }

  /* ---- De una vista a su JSON ---------------------------------------------------------------- */
  leerVista(v) {
    const id = v.dataset.id;
    const tipo = v.dataset.bloque;
    const c = (nombre) => v.querySelector(`:scope > .bed__cuerpo [data-c="${nombre}"]`);
    const marcada = (nombre) => { const x = v.querySelector(`:scope > .bed__cuerpo input[name="${nombre}"]`); return !!(x && x.checked); };
    const escrito = () => domATrozos(v.querySelector(':scope > .bed__cuerpo [contenteditable]'));
    switch (tipo) {
      case 'parrafo': return { tipo, id, texto: escrito() };
      case 'titulo': return { tipo: 'titulo', id, nivel: 2, texto: escrito() };
      case 'subtitulo': return { tipo: 'titulo', id, nivel: 3, texto: escrito() };
      case 'cita': return { tipo, id, texto: escrito(), autor: c('autor').value };
      case 'lista': return { tipo, id, ordenada: marcada('ordenada'), items: c('items').value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => [{ t: l }]) };
      case 'imagen': return { tipo, id, src: v.dataset.src || '', alt: c('alt').value, pie: c('pie').value, decorativa: marcada('decorativa'), ia: marcada('ia') };
      case 'video': return { tipo, id, fuente: 'youtube', ref: idDeYoutube(c('ref').value), titulo: c('titulo').value, ia: marcada('ia') };
      case 'columnas': return { tipo, id, columnas: (v._columnas || []).map((ed) => ed.leer().bloques) };
      case 'boton': return { tipo, id, texto: c('texto').value, href: c('href').value.trim(), estilo: c('estilo').value };
      case 'separador': return { tipo, id };
      default: return null;
    }
  }

  /* Las imagenes de este documento (columnas incluidas): [{ vista, id }] */
  imagenes() {
    return this.vistas().flatMap((v) => (v.dataset.bloque === 'imagen' ? [v] : (v._columnas || []).flatMap((ed) => ed.imagenes())));
  }
}
