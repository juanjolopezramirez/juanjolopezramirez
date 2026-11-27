/* LA VENTANA DE UNA NOTA: «Definición» o «Referencia bíblica» sobre las letras elegidas (marcas de nodos/notas.js).

   Se abre con los dos botones de «Insertar» (`data-b-nota`), con Ctrl+Mayús+D / Ctrl+Mayús+E, o tocando una nota que ya
   esta (entonces cambia o se quita). Se arma aqui, nodo por nodo: lo escrito entra siempre como texto (textContent), nunca
   como HTML. Lo que se guarda pasa por la misma regla que el lector (notasLibro.js → limpiarNota).

   - Definicion: la palabra (sale de lo elegido), lo que significa, de donde viene (APA por partes, con su vista en vivo, o
     escrita a mano) y la letra de la palabra y la de la explicacion (solo las de FUENTES_NOTA, cada una vista en su letra).
   - Cita: se lee de lo elegido (biblia/referencias.js); se puede corregir. Muestra el texto (RV1909 en un libro en español,
     WEB en uno en ingles) y deja elegir «Mi versión recomendada para leer», que el libro recuerda (la que mas usan sus citas).
     Si lo elegido trae varias («Jeremías 1:4-5 y el Salmo 139»), ofrece «Marcar 2 referencias»: una nota sobre cada una (cada
     una se llama con su referencia entera: «Mateo 4:3», aunque en el texto diga «y 4:3»).
     «Letra de los versículos (todo el libro)»: UNA para todas las citas del libro (ConfigPagina.notas.letraVersos), elegida
     aqui mismo; cada opcion se ve en su letra y el texto de muestra la usa. Se guarda al cambiarla, como los otros ajustes
     del libro; sin elegir, el PDF lleva la de los libros nuevos (notasLibro.letraDeVersos).
   - «Estilo de las notas…» (EstiloNotas.js): colores por tema y efectos de todas las notas del libro, con la letra de los
     versiculos. Su boton va en «Nota ▾» y aqui abajo; necesita `notasLibro()` y `alNotasLibro(parche)`. */
import { Selector } from './Selector.js';
import { cargarFuente } from './Fuentes.js';
import { EVENTO_AVISO, EVENTO_NOTA, notaEnCursor } from './nodos/notas.js';
import { citaEscrita, citasDeSeleccion, hrefsDeNotas, letraDeVersos, marcaDeNota, notaDeMarca, SELECCION_MAX, textoConMapa, versionDelLibro } from '../../../../contenido/taller/notasLibro.js';
import { enlaceDeNota, FUENTES_NOTA, limpiarNota, TOPES } from '../../../../lector/notaEnPdf.js';
import { referenciaAPA, NOMBRE_VERSION, versionDeIdioma } from '../../../../lector/notaTexto.js';
import { deCanonica, rotulo } from '../../../../biblia/referencias.js';
import { cargarPasaje, limitarVersos } from '../../../../biblia/cargar.js';
import { textoParaLeer } from '../../../../biblia/mostrar.js';
import { familiaCss } from '../../../../contenido/taller/fuentes.js';
import { estiloDeNotas, pesosDeLibro } from '../../../../contenido/taller/notasLibro.js';
import { pesoMasCercano } from '../../../../lector/notaEnPdf.js';
import { EstiloNotas, pedirConPesos } from './EstiloNotas.js';

/* Las versiones que se ofrecen (Bible Gateway las conoce por estas siglas) */
export const VERSIONES_RECOMENDADAS = Object.freeze({
  es: [['NVI', 'Nueva Versión Internacional'], ['RVR1960', 'Reina-Valera 1960'], ['LBLA', 'La Biblia de las Américas'], ['NBLA', 'Nueva Biblia de las Américas'],
    ['NTV', 'Nueva Traducción Viviente'], ['DHH', 'Dios Habla Hoy'], ['RVA-2015', 'Reina Valera Actualizada'], ['TLA', 'Traducción en Lenguaje Actual']],
  en: [['NIV', 'New International Version'], ['ESV', 'English Standard Version'], ['KJV', 'King James Version'], ['NLT', 'New Living Translation'],
    ['NASB', 'New American Standard Bible'], ['CSB', 'Christian Standard Bible'], ['NKJV', 'New King James Version']]
});
const VERSOS_VISTA = 8;
/* Letras de ojo chico: en la muestra, mas cuerpo (como en la hoja del lector, base.css) */
const LETRAS_GRANDES = new Set(['estonia', 'petemoss']);
const ESPERA_MS = 220;

const poner = (t, datos) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => (datos && datos[k] !== undefined ? String(datos[k]) : m));
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
let cuenta = 0;
const id = (s) => `tal-nota-${s}-${cuenta}`;
const recortar = (s, tope) => { const l = Array.from(String(s || '').replace(/\s+/g, ' ').trim()); return l.length > tope ? l.slice(0, tope).join('').trim() : l.join(''); };

export class NotaEditor {
  /* `raiz`: la cinta (tiene los botones). `editor()`: el editor del capitulo activo. `idioma()`: el del libro. `fuenteLibro()`:
     la letra del cuerpo. `contenidos()`: el JSON de cada capitulo abierto. `alDecir(t)`: lo dice la mesa.
     `letraVersos()`: la letra de los versiculos del libro ('' sin elegir). `alLetraVersos(id)`: la guarda en el libro.
     `notasLibro()`: ConfigPagina.notas del libro (o null). `alNotasLibro(parche)`: pone el parche en `pagina.notas` y guarda. */
  constructor(raiz, { tx, editor, idioma, fuenteLibro, contenidos, alDecir, letraVersos = null, alLetraVersos = null, notasLibro = null, alNotasLibro = null }) {
    Object.assign(this, { raiz, tx, editor, idioma, fuenteLibro, contenidos, alDecir, letraVersos, alLetraVersos, notasLibro, alNotasLibro });
    cuenta++;
    this.turno = 0;
    this.armar();
    /* «Estilo de las notas…»: solo si el Taller sabe leer y guardar `pagina.notas` */
    if (notasLibro && alNotasLibro) {
      this.estilo = new EstiloNotas({
        tx, menu: raiz.querySelector('[data-b-nota="citaBiblica"]'), padre: this.dialogo.parentNode,
        leer: () => this.notasLibro(), alGuardar: (p) => this.alNotasLibro(p), alDecir: (t) => this.alDecir(t),
        /* Si se cambio la letra de los versiculos con la ventana de una referencia abierta, esta la muestra */
        alCerrar: () => {
          if (!this.dialogo.open || !this.objetivo) return;
          if (this.objetivo.tipo === 'citaBiblica') { this.fv.value = this.letraDelLibro(); this.pintarLetraVersos(); } else this.pintarLetras();
        }
      });
      this.bEstilo.hidden = false;
      this.ayudaLetras.hidden = false;
      this.quitar.style.marginRight = '0';
    }
    raiz.querySelectorAll('[data-b-nota]').forEach((b) => b.addEventListener('click', () => this.desdeBoton(b.dataset.bNota)));
    /* La marca avisa (clic o teclas) desde el texto del capitulo */
    document.addEventListener(EVENTO_NOTA, (e) => { if (e.detail && e.detail.editor) this.abrir(e.detail.editor, e.detail.tipo, e.detail); });
    /* Un enlace que no se pudo poner porque alli hay una nota: se dice, no se calla */
    document.addEventListener(EVENTO_AVISO, (e) => { if (e.detail && this.tx[e.detail.clave]) this.alDecir(this.tx[e.detail.clave]); });
  }

  /* ---- La ventana, una sola vez ---- */
  armar() {
    const tx = this.tx;
    const d = this.dialogo = h('dialog', { clase: 'tal-ajustes tal-nota', 'aria-labelledby': id('titulo'), 'aria-describedby': id('sobre') });
    const f = this.form = h('form', { clase: 'tal-nota__caja', novalidate: true });
    this.titulo = h('h2', { clase: 'tal-ajustes__titulo', id: id('titulo') });
    this.sobre = h('p', { clase: 'tal-nota__sobre', id: id('sobre') });

    /* Definicion */
    const campo = (etiqueta, control, clase = '') => h('label', { clase: `tal-nota__campo ${clase}`.trim() }, [h('span', { texto: etiqueta }), control]);
    this.palabra = h('input', { clase: 'tal-nota__entrada tal-nota__palabra', maxlength: TOPES.t, autocomplete: 'off', spellcheck: 'true' });
    this.texto = h('textarea', { clase: 'tal-nota__entrada tal-nota__area', maxlength: TOPES.d, rows: 4, spellcheck: 'true' });
    this.modo = 'partes';
    this.bPartes = h('button', { clase: 'tal-seg__op', type: 'button', 'aria-pressed': 'true', texto: tx.ndPorPartes });
    this.bMano = h('button', { clase: 'tal-seg__op', type: 'button', 'aria-pressed': 'false', texto: tx.ndAMano });
    this.bPartes.addEventListener('click', () => this.ponerModo('partes'));
    this.bMano.addEventListener('click', () => this.ponerModo('mano'));
    const P = this.partes = {
      a: h('input', { clase: 'tal-nota__entrada', maxlength: TOPES.parte, autocomplete: 'off' }),
      y: h('input', { clase: 'tal-nota__entrada', maxlength: 20, autocomplete: 'off', inputmode: 'numeric' }),
      ti: h('input', { clase: 'tal-nota__entrada', maxlength: TOPES.parte, autocomplete: 'off' }),
      f: h('input', { clase: 'tal-nota__entrada', maxlength: TOPES.parte, autocomplete: 'off' }),
      u: h('input', { clase: 'tal-nota__entrada', maxlength: TOPES.u, autocomplete: 'off', spellcheck: 'false', type: 'url', placeholder: tx.ndUrlAyuda })
    };
    this.cajaPartes = h('div', { clase: 'tal-nota__partes' }, [
      campo(tx.ndAutor, P.a), campo(tx.ndAnio, P.y), campo(tx.ndObra, P.ti, 'tal-nota__ancho'), campo(tx.ndFuente, P.f, 'tal-nota__ancho'), campo(tx.ndUrl, P.u, 'tal-nota__ancho')
    ]);
    this.escrita = h('textarea', { clase: 'tal-nota__entrada tal-nota__area tal-nota__area--corta', maxlength: TOPES.rf, rows: 2 });
    this.cajaMano = campo(tx.ndEscrita, this.escrita);
    this.cajaMano.hidden = true;
    this.vista = h('p', { clase: 'tal-nota__vista', 'aria-live': 'polite' });
    const ref = h('fieldset', { clase: 'tal-nota__grupo' }, [
      h('legend', { texto: tx.ndReferencia }),
      h('div', { clase: 'tal-seg tal-nota__seg', role: 'group', 'aria-label': tx.ndReferencia }, [this.bPartes, this.bMano]),
      this.cajaPartes, this.cajaMano,
      h('div', { clase: 'tal-nota__vista-caja' }, [h('span', { clase: 'tal-nota__rotulo', texto: tx.ndVista }), this.vista])
    ]);
    const opcionesFuente = (etiqueta) => {
      const s = h('select', { clase: 'tal-ctl', 'aria-label': etiqueta });
      s.append(h('option', { value: '', texto: tx.ndLaDelLibro }), ...Object.entries(FUENTES_NOTA).map(([k, v]) => h('option', { value: k, texto: v.familia })));
      return s;
    };
    this.ft = opcionesFuente(tx.ndLetraPalabra);
    this.fd = opcionesFuente(tx.ndLetraTexto);
    /* La letra de la palabra sin elegir es la que el libro puso para todas sus definiciones («Estilo de las notas») */
    if (this.ft.options[0]) this.ft.options[0].textContent = tx.ndLetraTodas;
    const letras = h('div', { clase: 'tal-nota__letras' }, [campo(tx.ndLetraPalabra, this.ft), campo(tx.ndLetraTexto, this.fd)]);
    this.ayudaLetras = h('p', { clase: 'tal-ayuda', texto: tx.ndLetraLibroAyuda, hidden: true });
    this.parteD = h('div', { clase: 'tal-nota__parte' }, [campo(tx.ndPalabra, this.palabra), campo(tx.ndTexto, this.texto), ref, h('div', {}, [letras, this.ayudaLetras])]);

    /* Cita */
    this.cita = h('input', { clase: 'tal-nota__entrada', maxlength: 120, autocomplete: 'off', spellcheck: 'false', 'aria-describedby': id('cita-ayuda') });
    this.citaAyuda = h('p', { clase: 'tal-ayuda', id: id('cita-ayuda'), texto: tx.ncCitaAyuda });
    this.cajaCita = h('div', { clase: 'tal-nota__campo-solo' }, [campo(tx.ncCita, this.cita), this.citaAyuda]);
    this.varias = h('div', { clase: 'tal-nota__varias', hidden: true });
    this.pasaje = h('blockquote', { clase: 'tal-nota__versos' });
    this.pie = h('figcaption', { clase: 'tal-nota__pie' });
    this.figura = h('figure', { clase: 'tal-nota__pasaje', 'aria-live': 'polite' }, [this.pasaje, this.pie]);
    this.version = h('select', { clase: 'tal-ctl', 'aria-label': tx.ncVersion });
    /* La letra de los versiculos: solo la lista fija, sin «la del libro» (el PDF siempre dice cual) */
    this.fv = h('select', { clase: 'tal-ctl', 'aria-label': tx.ncLetraVersos });
    this.fv.append(...Object.entries(FUENTES_NOTA).map(([k, v]) => h('option', { value: k, texto: v.familia })));
    this.parteC = h('div', { clase: 'tal-nota__parte' }, [this.cajaCita, this.varias, this.figura, campo(tx.ncVersion, this.version), campo(tx.ncLetraVersos, this.fv)]);

    /* Abajo */
    this.error = h('p', { clase: 'tal-nota__error', role: 'alert' });
    this.quitar = h('button', { clase: 'tal-btn tal-nota__quitar', type: 'button', texto: tx.notaQuitar });
    this.bEstilo = h('button', { clase: 'tal-btn', type: 'button', texto: tx.enAbrir, title: tx.enAyuda, hidden: true });
    /* A la izquierda, despues de «Quitar la nota» (que deja de empujar): lo destructivo y lo del libro, lejos de «Poner» */
    this.bEstilo.style.marginRight = 'auto';
    this.bEstilo.addEventListener('click', () => { if (this.estilo) this.estilo.abrir(); });
    this.cancelar = h('button', { clase: 'tal-btn', type: 'button', texto: tx.cancelar });
    this.listo = h('button', { clase: 'tal-btn tal-btn--fuerte', type: 'submit' });
    f.append(h('div', { clase: 'tal-nota__cabeza' }, [this.titulo, this.sobre]), this.parteD, this.parteC, this.error, h('div', { clase: 'tal-nota__botones' }, [this.quitar, this.bEstilo, this.cancelar, this.listo]));
    d.append(f);
    (this.raiz.closest('[data-tal-mesa]') || document.body).append(d);

    /* Los selectores del Taller, cada letra vista en su letra */
    this.selFt = new Selector(this.ft, { fuenteDe: (v) => this.cssDe(v, { titulo: true }) });
    this.selFd = new Selector(this.fd, { fuenteDe: (v) => this.cssDe(v) });
    this.selFv = new Selector(this.fv, { fuenteDe: (v) => this.cssDe(v) });
    this.selVersion = null;

    f.addEventListener('submit', (e) => { e.preventDefault(); this.aceptar(); });
    this.cancelar.addEventListener('click', () => d.close());
    this.quitar.addEventListener('click', () => this.quitarNota());
    d.addEventListener('close', () => this.alCerrar());
    /* Ctrl+Enter en un cuadro de varias lineas tambien guarda */
    f.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.aceptar(); } });
    for (const c of [this.palabra, this.texto, ...Object.values(P), this.escrita]) c.addEventListener('input', () => { c.removeAttribute('aria-invalid'); this.pintarVista(); });
    this.ft.addEventListener('change', () => this.pintarLetras());
    this.fd.addEventListener('change', () => this.pintarLetras());
    this.fv.addEventListener('change', () => this.cambiarLetraVersos());
    this.cita.addEventListener('input', () => { this.citaEditada = true; this.cita.removeAttribute('aria-invalid'); this.leerCita(); });
  }

  cssDe(v, { titulo = false } = {}) {
    if (v && FUENTES_NOTA[v]) return FUENTES_NOTA[v].css;
    /* La palabra sin letra propia: la de todas las definiciones del libro, o la de siempre */
    if (titulo) {
      let n = null;
      try { n = this.notasLibro ? this.notasLibro() : null; } catch { n = null; }
      const t = n && n.tituloDef;
      return t && FUENTES_NOTA[t] ? FUENTES_NOTA[t].css : '"Young Serif", Georgia, serif';
    }
    const l = this.fuenteLibro && this.fuenteLibro();
    return l ? familiaCss(l) : '';
  }

  ponerModo(m) {
    this.modo = m;
    this.bPartes.setAttribute('aria-pressed', String(m === 'partes'));
    this.bMano.setAttribute('aria-pressed', String(m === 'mano'));
    this.cajaPartes.hidden = m !== 'partes';
    this.cajaMano.hidden = m !== 'mano';
    this.pintarVista();
  }

  /* Las letras que no trae el sitio se piden al usarse (y al abrir, para verlas en la lista) */
  cargarLetras() {
    for (const v of Object.values(FUENTES_NOTA)) if (!v.sitio) cargarFuente(v.familia);
    for (const id of Object.keys(FUENTES_NOTA)) pedirConPesos(id);
  }
  pintarLetras() {
    this.palabra.style.fontFamily = this.cssDe(this.ft.value, { titulo: true });
    this.texto.style.fontFamily = this.cssDe(this.fd.value);
    /* El grosor del libro («Estilo de las notas») sobre la letra que de verdad usa ESTA definicion: el mas cercano que ella
       tenga; con una letra de un solo grosor, ninguno (como en el lector) */
    const n = this.libroNotas(), p = pesosDeLibro(n && n.pesos);
    const ft = this.ft.value || (n && n.tituloDef) || 'young-serif';
    this.palabra.style.fontWeight = String(pesoMasCercano(ft, p[2]) || '');
    this.texto.style.fontWeight = String(pesoMasCercano(this.fd.value, p[3]) || '');
  }
  libroNotas() {
    try { return this.notasLibro ? this.notasLibro() : null; } catch { return null; }
  }

  /* ---- Abrir ---- */
  desdeBoton(tipo) {
    const ed = this.editor();
    if (!ed || !ed.isEditable) { this.alDecir(this.tx.notaNoAqui); return; }
    const s = ed.state.selection;
    const ya = notaEnCursor(ed.state, tipo);
    if (ya) { this.abrir(ed, tipo, ya); return; }
    if (s.empty) { this.alDecir(this.tx.notaSinSeleccion); return; }
    this.abrir(ed, tipo, { desde: s.from, hasta: s.to });
  }

  /* El texto elegido, letra por letra con su lugar: lo que no es texto (una formula) o un salto de bloque corta */
  textoDe(doc, desde, hasta) {
    const trozos = [];
    let bloques = 0;
    doc.nodesBetween(desde, hasta, (n, pos) => {
      if (n.isTextblock) { if (bloques++) trozos.push({ corte: true }); return true; }
      if (n.isText) { const a = Math.max(desde, pos), b = Math.min(hasta, pos + n.nodeSize); if (b > a) trozos.push({ texto: n.text.slice(a - pos, b - pos), pos: a }); return false; }
      if (n.isInline) { trozos.push({ corte: true }); return false; }
      return true;
    });
    return textoConMapa(trozos);
  }

  abrir(editor, tipo, { desde, hasta, attrs } = {}) {
    if (!editor || !editor.isEditable || (tipo !== 'definicion' && tipo !== 'citaBiblica')) return;
    const doc = editor.state.doc;
    if (!Number.isInteger(desde) || !Number.isInteger(hasta) || hasta <= desde || hasta > doc.content.size) { this.alDecir(this.tx.notaSinSeleccion); return; }
    const $d = doc.resolve(desde);
    if (!$d.parent.inlineContent && !doc.resolve(Math.min(desde + 1, doc.content.size)).parent.inlineContent) { this.alDecir(this.tx.notaNoAqui); return; }
    if (this.dialogo.open) this.dialogo.close();
    /* Una seleccion enorme (mas de SELECCION_MAX letras) no se recorre letra por letra: sin citas halladas, sin palabra */
    const sel = hasta - desde > SELECCION_MAX ? { texto: '', mapa: [] } : this.textoDe(doc, desde, hasta);
    const corto = doc.textBetween(desde, Math.min(hasta, desde + 200), ' ', ' ');
    const leido = attrs ? notaDeMarca({ type: tipo, attrs }) : null;
    this.objetivo = { editor, tipo, desde, hasta, existe: !!leido, sel };
    this.error.textContent = '';
    this.titulo.textContent = tipo === 'definicion' ? this.tx.notaDef : this.tx.notaCita;
    this.sobre.textContent = poner(this.tx.notaSobre, { t: recortar(corto, 60) + (hasta - desde > 200 ? '…' : '') });
    this.parteD.hidden = tipo !== 'definicion';
    this.parteC.hidden = tipo !== 'citaBiblica';
    this.quitar.hidden = !leido;
    this.listo.textContent = leido ? this.tx.notaGuardar : this.tx.notaPoner;
    if (tipo === 'definicion') this.prepararDefinicion(leido, sel.texto); else this.prepararCita(leido, sel);
    this.dialogo.showModal();
    (tipo === 'definicion' ? (leido ? this.texto : this.palabra) : (this.varias.hidden ? this.cita : this.listo)).focus();
  }

  prepararDefinicion(n, elegido) {
    this.cargarLetras();
    this.palabra.value = n ? n.t : recortar(elegido, TOPES.t);
    this.texto.value = n && n.d ? n.d : '';
    const r = (n && n.r) || {};
    for (const k of ['a', 'y', 'ti', 'f', 'u']) { this.partes[k].value = r[k] || ''; this.partes[k].removeAttribute('aria-invalid'); }
    this.escrita.value = (n && n.rf) || '';
    this.ponerModo(n && n.rf && !n.r ? 'mano' : 'partes');
    this.ft.value = (n && n.ft) || '';
    this.fd.value = (n && n.fd) || '';
    this.pintarLetras();
    this.pintarVista();
  }

  /* La nota que dice la ventana ahora (sin limpiar), para ver y para guardar */
  notaEscrita() {
    const n = { v: 1, k: 'd', t: this.palabra.value, d: this.texto.value, ft: this.ft.value || undefined, fd: this.fd.value || undefined };
    if (this.modo === 'partes') { n.r = {}; for (const k of ['a', 'y', 'ti', 'f', 'u']) if (this.partes[k].value.trim()) n.r[k] = this.partes[k].value.trim(); }
    else n.rf = this.escrita.value;
    return n;
  }

  /* La referencia tal como saldra (APA), en vivo. Trozos de texto: la cursiva va en <i>, el enlace como texto. */
  pintarVista() {
    if (!this.objetivo || this.objetivo.tipo !== 'definicion') return;
    const n = limpiarNota({ ...this.notaEscrita(), t: this.palabra.value.trim() || '·' });
    const trozos = referenciaAPA(n, this.idioma());
    this.vista.replaceChildren(...(trozos.length ? trozos.map((x) => (x.cursiva ? h('i', { texto: x.t }) : document.createTextNode(x.t))) : [h('span', { clase: 'tal-nota__nada', texto: this.tx.ndSinReferencia })]));
  }

  /* ---- Cita ---- */
  /* La del libro ahora (o la de los libros nuevos, que es la que llevara el PDF) */
  letraDelLibro() {
    let v = '';
    try { v = this.letraVersos ? this.letraVersos() : ''; } catch { v = ''; }
    return letraDeVersos(v);
  }
  pintarLetraVersos() {
    const id = letraDeVersos(this.fv.value), grande = LETRAS_GRANDES.has(id);
    this.pasaje.style.fontFamily = FUENTES_NOTA[id].css;
    this.pasaje.style.fontSize = grande ? '20px' : '';
    this.pasaje.style.lineHeight = grande ? '1.4' : '';
    const n = this.libroNotas();
    this.pasaje.style.fontWeight = String(pesoMasCercano(id, pesosDeLibro(n && n.pesos)[1]) || '');
  }
  /* Cambia para TODO el libro: se guarda en el acto y se dice */
  cambiarLetraVersos() {
    const id = letraDeVersos(this.fv.value);
    this.pintarLetraVersos();
    if (id === this.letraDelLibro() && this.letraVersos && this.letraVersos()) return;
    if (this.alLetraVersos) this.alLetraVersos(id);
    this.alDecir(poner(this.tx.ncLetraCambiada, { f: FUENTES_NOTA[id].familia }));
  }

  prepararCita(n, sel) {
    const idioma = this.idioma();
    this.cargarLetras();
    this.fv.value = this.letraDelLibro();
    this.pintarLetraVersos();
    this.citaEditada = false;
    this.halladas = n ? [] : citasDeSeleccion(sel.texto, sel.mapa, idioma);
    this.pintarVersiones(n && n.rv !== undefined ? n.rv : this.recordada());
    if (n) this.cita.value = rotulo(deCanonica(n.r), idioma) || n.x || '';
    else this.cita.value = this.halladas.length === 1 ? this.halladas[0].x : this.halladas.length ? '' : recortar(sel.texto, 120);
    this.cita.removeAttribute('aria-invalid');
    const varias = this.halladas.length > 1;
    this.varias.hidden = !varias;
    this.cajaCita.hidden = varias;
    if (varias) {
      const lista = this.halladas.map((c) => rotulo(deCanonica(c.r), idioma) || c.x);
      this.varias.replaceChildren(
        h('p', { clase: 'tal-nota__varias-texto', texto: poner(this.tx.ncVarias, { n: lista.length, lista: lista.join(', ') }) }),
        h('ul', { clase: 'tal-nota__lista', role: 'list' }, lista.map((t) => h('li', { texto: t })))
      );
      this.listo.textContent = poner(this.tx.ncMarcarVarias, { n: lista.length });
    }
    this.leerCita();
  }

  /* La version que el libro ya usa en sus citas (o la ultima elegida aqui) */
  recordada() {
    let v = '';
    try { v = versionDelLibro(this.contenidos ? this.contenidos() : []); } catch { v = ''; }
    return v || this.ultimaVersion || '';
  }

  pintarVersiones(actual) {
    const tx = this.tx, idioma = this.idioma();
    const grupos = idioma === 'en' ? ['en', 'es'] : ['es', 'en'];
    const opciones = [h('option', { value: '', texto: tx.ncNinguna })];
    for (const g of grupos) for (const [sigla, nombre] of VERSIONES_RECOMENDADAS[g]) opciones.push(h('option', { value: sigla, texto: `${sigla} · ${nombre}` }));
    /* Una que el libro ya tenia y no esta en la lista, se respeta */
    if (actual && !opciones.some((o) => o.value === actual)) opciones.push(h('option', { value: actual, texto: actual }));
    this.version.replaceChildren(...opciones);
    if (!this.selVersion) this.selVersion = new Selector(this.version);
    this.version.value = actual || '';
  }

  /* Lo que dice la cita ahora: la que se escribio, o la hallada; null si no se entiende */
  citaActual() {
    if (this.halladas && this.halladas.length > 1 && !this.citaEditada) return { r: this.halladas[0].r };
    if (!this.citaEditada && this.halladas && this.halladas.length === 1) return { r: this.halladas[0].r };
    return citaEscrita(this.cita.value, this.idioma());
  }

  leerCita() {
    clearTimeout(this.reloj);
    const turno = ++this.turno;
    const c = this.citaActual();
    if (!c) {
      this.pasaje.replaceChildren();
      this.pie.textContent = this.cita.value.trim() ? this.tx.ncNoEntiendo : '';
      this.figura.hidden = !this.cita.value.trim();
      return;
    }
    this.figura.hidden = false;
    this.pie.textContent = this.tx.ncBuscando;
    this.reloj = setTimeout(() => this.traerVersos(c.r, turno), ESPERA_MS);
  }

  async traerVersos(r, turno) {
    const ref = deCanonica(r), version = versionDeIdioma(this.idioma());
    let versos = null;
    try { versos = await cargarPasaje(ref, version, { base: import.meta.env.BASE_URL }); } catch { versos = null; }
    if (turno !== this.turno || !this.dialogo.open) return;
    if (!versos) { this.pasaje.replaceChildren(); this.pie.textContent = this.tx.ncSinTexto; return; }
    const { versos: vista, recortado } = limitarVersos(versos, VERSOS_VISTA);
    this.pasaje.replaceChildren(...vista.map((v) => h('span', { clase: 'tal-nota__verso' }, [h('sup', { texto: String(v.v) }), document.createTextNode(textoParaLeer(v.t, { version, libro: ref.libro, cap: v.cap, v: v.v }) + ' ')])));
    const nombre = `${rotulo(ref, this.idioma()) || r} · ${NOMBRE_VERSION[version]}`;
    this.pie.textContent = recortado ? `${nombre} · ${poner(this.tx.ncRecortado, { n: VERSOS_VISTA })}` : nombre;
  }

  /* ---- Guardar ---- */
  fallar(texto, campo) {
    this.error.textContent = texto;
    if (campo) { campo.setAttribute('aria-invalid', 'true'); campo.focus(); }
  }

  aceptar() {
    const o = this.objetivo;
    if (!o || !this.dialogo.open) return;
    if (o.editor.isDestroyed) { this.dialogo.close(); return; }
    if (o.tipo === 'definicion') this.aceptarDefinicion(o); else this.aceptarCita(o);
  }

  aceptarDefinicion(o) {
    const escrita = this.notaEscrita();
    if (!escrita.t.trim()) { this.fallar(this.tx.notaSinPalabra, this.palabra); return; }
    const n = limpiarNota(escrita);
    if (!n) { this.fallar(this.tx.notaSinPalabra, this.palabra); return; }
    if (escrita.r && escrita.r.u && !(n.r && n.r.u)) { this.fallar(this.tx.notaUrlMala, this.partes.u); return; }
    if (!enlaceDeNota({ ...n, l: this.idioma() === 'en' ? 'en' : 'es' })) { this.fallar(this.tx.notaMuyLarga, this.texto); return; }
    this.poner(o, [{ desde: o.desde, hasta: o.hasta, marca: marcaDeNota(n) }]);
  }

  aceptarCita(o) {
    const rv = this.version.value || undefined;
    this.ultimaVersion = rv || '';
    const x = recortar(o.sel.texto, TOPES.x);
    if (this.halladas && this.halladas.length > 1) {
      const tramos = this.halladas.map((c) => ({ desde: c.desde, hasta: c.hasta, marca: marcaDeNota({ v: 1, k: 'c', r: c.r, x: c.x, rv }) })).filter((t) => t.marca);
      this.poner(o, tramos, poner(this.tx.notaCitasPuestas, { n: tramos.length }));
      return;
    }
    const c = this.citaActual();
    /* El cuadro del texto ya lo dice (y lo anuncia): aqui solo se marca el campo y se vuelve a el */
    if (!c) { this.figura.hidden = false; this.pie.textContent = this.tx.ncNoEntiendo; this.fallar('', this.cita); return; }
    /* Si lo elegido trae UNA cita y no se cambio, la nota va solo sobre ella (no sobre el parentesis o la frase de al lado) */
    const una = !this.citaEditada && this.halladas && this.halladas.length === 1 && !o.existe ? this.halladas[0] : null;
    const marca = marcaDeNota({ v: 1, k: 'c', r: c.r, x: una ? una.x : x, rv });
    if (!marca) { this.fallar(this.tx.ncNoEntiendo, this.cita); return; }
    this.poner(o, [{ desde: una ? una.desde : o.desde, hasta: una ? una.hasta : o.hasta, marca }]);
  }

  /* Todo en un solo paso de Ctrl+Z. Si la nota ya estaba, se quita primero (en su tramo) y se pone la nueva. */
  poner(o, tramos, dicho) {
    const ed = o.editor, tipo = ed.schema.marks[o.tipo];
    if (!tipo || !tramos.length) return;
    const tr = ed.state.tr;
    if (o.existe) tr.removeMark(o.desde, o.hasta, tipo);
    for (const t of tramos) tr.addMark(t.desde, t.hasta, tipo.create(t.marca.attrs));
    ed.view.dispatch(tr);
    this.cerrarCon(dicho || (o.existe ? this.tx.notaGuardada : this.tx.notaPuesta), tramos[tramos.length - 1].hasta);
  }

  quitarNota() {
    const o = this.objetivo;
    if (!o || !o.existe || o.editor.isDestroyed) return;
    const tipo = o.editor.schema.marks[o.tipo];
    o.editor.view.dispatch(o.editor.state.tr.removeMark(o.desde, o.hasta, tipo));
    this.cerrarCon(this.tx.notaQuitada, o.hasta);
  }

  cerrarCon(dicho, fin) {
    this.volverA = fin;
    this.dialogo.close();
    this.alDecir(dicho);
  }

  /* Al cerrar el foco vuelve al texto: despues de guardar, con el cursor tras la nota */
  alCerrar() {
    clearTimeout(this.reloj);
    this.turno++;
    const o = this.objetivo;
    this.objetivo = null;
    if (!o || o.editor.isDestroyed) return;
    const tope = o.editor.state.doc.content.size;
    /* Sin guardar (Escape, Cancelar), vuelve lo que estaba elegido */
    const sel = Number.isInteger(this.volverA) ? Math.min(this.volverA, tope) : { from: Math.min(o.desde, tope), to: Math.min(o.hasta, tope) };
    this.volverA = null;
    o.editor.chain().focus().setTextSelection(sel).run();
  }

  /* Cuantas notas distintas lleva el libro (para «Compartir»: el PDF que vuelve debe traerlas todas) */
  cuantas() {
    try { return hrefsDeNotas(this.contenidos ? this.contenidos() : [], this.idioma(), { fv: this.letraDelLibro(), estilo: this.notasLibro ? estiloDeNotas(this.notasLibro()) : undefined }).size; } catch { return undefined; }
  }
}
