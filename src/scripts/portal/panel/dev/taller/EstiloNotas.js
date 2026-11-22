/* «ESTILO DE LAS NOTAS»: como se ven TODAS las notas del libro en el lector. Una sola ventana, para todo el libro:
     - la letra de los versiculos (la misma de la ventana de la referencia biblica: ConfigPagina.notas.letraVersos);
     - los colores: de las referencias biblicas (titulo y versiculos) y de las definiciones (palabra y descripcion), cada uno
       para el tema claro y para el oscuro del lector ('' = el de siempre);
     - el efecto al abrir y el movimiento suave mientras esta abierta (la lista fija del lector: notaEnPdf.js).
   Se ve en vivo sobre los dos papeles del lector (colorNota.js), con los mismos efectos que el lector (efectosNota.js). Un
   color que se lee poco (menos de 4.5 a 1) se avisa, no se prohibe; el lector, con menos de 3 a 1, usa el de siempre.

   Se abre desde «Nota ▾» (este archivo pone alli su boton: no hace falta tocar el marcado del Taller) y desde la ventana de
   una nota. Al guardar entrega un parche de `pagina.notas` con `alGuardar(parche)`; se guarda por el camino de siempre.
   Todo se arma nodo por nodo; lo escrito entra como texto, nunca como HTML. */
import { Selector } from './Selector.js';
import { SelectorColor } from './SelectorColor.js';
import { cargarFuente } from './Fuentes.js';
import { FUENTES_NOTA, ENTRADAS_NOTA, BUCLES_NOTA, colorNota, entradaValida, bucleValido } from '../../../../lector/notaEnPdf.js';
import { PAPEL_NOTA, TINTA_NOTA, ORO_NOTA, CONTRASTE_AVISO, CONTRASTE_LECTOR, contraste } from '../../../../lector/colorNota.js';
import { animarNota, reducido } from '../../../../lector/efectosNota.js';
import { letraDeVersos } from '../../../../contenido/taller/notasLibro.js';

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
const TEMAS = ['claro', 'oscuro'];
const TIPOS = ['cita', 'definicion'];
const LETRAS_GRANDES = new Set(['estonia', 'petemoss']);
/* La muestra: lo mismo que se ve en el lector (una referencia corta y una palabra de la casa) */
const MUESTRA = {
  cita: { t: 'Juan 3:16', x: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito…' },
  definicion: { t: 'Ahavá', x: 'Amor. Una decisión que se toma: querer el bien del otro.' }
};
const vacios = () => Object.fromEntries(TIPOS.map((k) => [k, { claro: ['', ''], oscuro: ['', ''] }]));

export class EstiloNotas {
  /* `menu`: donde va su boton en «Nota ▾» (o null). `leer()`: ConfigPagina.notas del libro abierto (o null).
     `alGuardar(parche)`: lo pone en `pagina.notas` y lo guarda. `alDecir(t)`: lo dice la mesa. `alCerrar()`: despues de cerrar. */
  constructor({ tx, menu = null, padre = document.body, leer, alGuardar, alDecir = () => {}, alCerrar = () => {} }) {
    Object.assign(this, { tx, leer, alGuardar, alDecir, alCerrar });
    this.n = ++cuenta;
    this.tipo = 'cita';
    this.efectos = [];
    this.armar(padre);
    if (menu) {
      this.botonMenu = h('button', { clase: 'tal-btn', type: 'button', texto: tx.enAbrir, title: tx.enAyuda });
      menu.after(this.botonMenu);
      this.botonMenu.addEventListener('click', () => { const d = this.botonMenu.closest('details'); if (d) d.open = false; this.abrir(); });
    }
  }

  id(s) { return `tal-estilo-${s}-${this.n}`; }

  armar(padre) {
    const tx = this.tx;
    const d = this.dialogo = h('dialog', { clase: 'tal-ajustes tal-nota', 'aria-labelledby': this.id('t'), 'aria-describedby': this.id('sobre') });
    const f = h('form', { clase: 'tal-nota__caja', novalidate: true });
    const campo = (etiqueta, control) => h('label', { clase: 'tal-nota__campo' }, [h('span', { texto: etiqueta }), control]);

    /* Que notas se miran: las dos clases tienen sus propios colores */
    this.bCita = h('button', { clase: 'tal-seg__op', type: 'button', 'aria-pressed': 'true', texto: tx.enCitas });
    this.bDef = h('button', { clase: 'tal-seg__op', type: 'button', 'aria-pressed': 'false', texto: tx.enDefs });
    this.bCita.addEventListener('click', () => this.ponerTipo('cita'));
    this.bDef.addEventListener('click', () => this.ponerTipo('definicion'));
    const tipos = h('div', { clase: 'tal-seg tal-nota__seg', role: 'group', 'aria-label': tx.enTipo }, [this.bCita, this.bDef]);
    /* «Referencias bíblicas» en una sola linea */
    tipos.style.maxWidth = '22rem';
    for (const b of [this.bCita, this.bDef]) b.style.whiteSpace = 'nowrap';

    /* La muestra: un papel claro y uno oscuro, uno junto al otro */
    this.papeles = Object.fromEntries(TEMAS.map((tema) => {
      const t = h('p', { 'aria-hidden': 'true' }), x = h('p', { 'aria-hidden': 'true' });
      const caja = h('div', { 'data-tema': tema }, [h('span', { texto: tema === 'claro' ? tx.enClaro : tx.enOscuro }), t, x]);
      Object.assign(caja.style, { display: 'grid', alignContent: 'start', gap: '.35rem', minWidth: '0', padding: '.75rem .85rem .85rem', borderRadius: '10px', background: PAPEL_NOTA[tema], color: TINTA_NOTA[tema], boxShadow: tema === 'oscuro' ? 'inset 0 0 0 1px rgb(241 239 233 / .14)' : 'none' });
      Object.assign(caja.firstChild.style, { font: '600 10px/1.2 system-ui, sans-serif', letterSpacing: '.02em', color: tema === 'claro' ? '#55625a' : '#b9c2b6' });
      Object.assign(t.style, { margin: '0', font: '400 22px/1.15 "Young Serif", Georgia, serif', overflowWrap: 'anywhere' });
      Object.assign(x.style, { margin: '0', font: '14px/1.55 Georgia, serif', overflowWrap: 'break-word' });
      return [tema, { caja, t, x }];
    }));
    const papeles = h('div', {}, [this.papeles.claro.caja, this.papeles.oscuro.caja]);
    Object.assign(papeles.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '.6rem' });
    this.quieto = h('p', { clase: 'tal-ayuda', texto: tx.enQuieto, hidden: true });
    const otraVez = h('button', { clase: 'tal-btn', type: 'button', texto: tx.enOtraVez });
    otraVez.addEventListener('click', () => this.pintarMuestra());
    const muestra = h('div', { clase: 'tal-nota__vista-caja' }, [h('span', { clase: 'tal-nota__rotulo', texto: tx.enMuestra }), papeles, this.quieto]);

    /* Los colores: dos filas (titulo, texto) por dos temas, de la clase elegida */
    this.selectores = {};
    const rejilla = h('div', { role: 'group', 'aria-labelledby': this.id('colores') });
    Object.assign(rejilla.style, { display: 'grid', gridTemplateColumns: 'minmax(5.5rem, auto) repeat(2, minmax(0, 1fr))', gap: '.4rem .6rem', alignItems: 'center' });
    const cabeza = (t) => { const s = h('span', { clase: 'tal-nota__rotulo', texto: t }); return s; };
    rejilla.append(h('span'), cabeza(tx.enClaro), cabeza(tx.enOscuro));
    this.nombresFila = [h('span', { clase: 'tal-nota__rotulo' }), h('span', { clase: 'tal-nota__rotulo' })];
    [0, 1].forEach((i) => {
      rejilla.append(this.nombresFila[i]);
      for (const tema of TEMAS) {
        const sel = new SelectorColor({ tx, etiqueta: '', valor: '', alCambiar: (c) => { this.colores[this.tipo][tema][i] = colorNota(c); this.pintarMuestra(); } });
        this.selectores[`${tema}${i}`] = sel;
        rejilla.append(sel.nodo);
      }
    });
    this.aviso = h('p', { clase: 'tal-ayuda', role: 'status' });
    const colores = h('fieldset', { clase: 'tal-nota__grupo' }, [h('legend', { id: this.id('colores'), texto: tx.enColores }), rejilla, this.aviso]);

    /* La letra de los versiculos (solo se ve con las referencias) */
    this.fv = h('select', { clase: 'tal-ctl', 'aria-label': tx.ncLetraVersos });
    this.fv.append(...Object.entries(FUENTES_NOTA).map(([k, v]) => h('option', { value: k, texto: v.familia })));
    this.campoFv = campo(tx.ncLetraVersos, this.fv);

    /* Los efectos: para todas las notas del libro */
    this.ee = h('select', { clase: 'tal-ctl', 'aria-label': tx.enEntrada });
    this.ee.append(h('option', { value: '', texto: tx.enEfectos[''] }), ...ENTRADAS_NOTA.map((k) => h('option', { value: k, texto: tx.enEfectos[k] || k })));
    this.el = h('select', { clase: 'tal-ctl', 'aria-label': tx.enBucle });
    this.el.append(h('option', { value: '', texto: tx.enBucles[''] }), ...BUCLES_NOTA.map((k) => h('option', { value: k, texto: tx.enBucles[k] || k })));
    const efectos = h('fieldset', { clase: 'tal-nota__grupo' }, [
      h('legend', { texto: tx.enEfectosTitulo }),
      h('div', { clase: 'tal-nota__letras' }, [campo(tx.enEntrada, this.ee), campo(tx.enBucle, this.el)]),
      h('div', {}, [otraVez])
    ]);

    this.error = h('p', { clase: 'tal-nota__error', role: 'alert' });
    const cancelar = h('button', { clase: 'tal-btn', type: 'button', texto: tx.cancelar });
    const guardar = this.botonGuardar = h('button', { clase: 'tal-btn tal-btn--fuerte', type: 'submit', texto: tx.enGuardar });
    f.append(
      h('div', { clase: 'tal-nota__cabeza' }, [h('h2', { clase: 'tal-ajustes__titulo', id: this.id('t'), texto: tx.enVentana }), h('p', { clase: 'tal-nota__sobre', id: this.id('sobre'), texto: tx.enSobre })]),
      tipos, muestra, colores, this.campoFv, efectos, this.error,
      h('div', { clase: 'tal-nota__botones' }, [cancelar, guardar])
    );
    d.append(f);
    padre.append(d);

    this.selFv = new Selector(this.fv, { fuenteDe: (v) => (FUENTES_NOTA[v] ? FUENTES_NOTA[v].css : '') });
    this.selEe = new Selector(this.ee);
    this.selEl = new Selector(this.el);
    this.fv.addEventListener('change', () => this.pintarMuestra());
    this.ee.addEventListener('change', () => this.pintarMuestra());
    this.el.addEventListener('change', () => this.pintarMuestra());
    cancelar.addEventListener('click', () => d.close());
    f.addEventListener('submit', (e) => { e.preventDefault(); this.guardar(); });
    d.addEventListener('close', () => { this.pararMuestra(); this.alCerrar(); });
  }

  /* ---- Abrir: lo que el libro tiene hoy ---- */
  abrir() {
    let n = null;
    try { n = this.leer(); } catch { n = null; }
    if (!n) { this.alDecir(this.tx.enSinLibro); return; }
    const c = n.colores && typeof n.colores === 'object' ? n.colores : {};
    this.colores = vacios();
    for (const k of TIPOS) for (const tema of TEMAS) {
      const par = c[k] && Array.isArray(c[k][tema]) ? c[k][tema] : [];
      this.colores[k][tema] = [colorNota(par[0]), colorNota(par[1])];
    }
    for (const v of Object.values(FUENTES_NOTA)) if (!v.sitio) cargarFuente(v.familia);
    this.fv.value = letraDeVersos(n.letraVersos);
    this.ee.value = entradaValida(n.entrada) ? n.entrada : '';
    this.el.value = bucleValido(n.bucle) ? n.bucle : '';
    this.error.textContent = '';
    this.ponerTipo(this.tipo, true);
    if (!this.dialogo.open) this.dialogo.showModal();
    this.pintarMuestra();
    (this.tipo === 'cita' ? this.bCita : this.bDef).focus();
  }

  ponerTipo(k, sinMuestra = false) {
    this.tipo = k === 'definicion' ? 'definicion' : 'cita';
    const tx = this.tx, cita = this.tipo === 'cita';
    this.bCita.setAttribute('aria-pressed', String(cita));
    this.bDef.setAttribute('aria-pressed', String(!cita));
    this.campoFv.hidden = !cita;
    const nombres = cita ? [tx.enTituloCita, tx.enTextoCita] : [tx.enTituloDef, tx.enTextoDef];
    this.nombresFila.forEach((s, i) => { s.textContent = nombres[i]; });
    for (const tema of TEMAS) for (const i of [0, 1]) {
      const sel = this.selectores[`${tema}${i}`];
      sel.etiqueta = `${nombres[i]}, ${tema === 'claro' ? tx.enClaro : tx.enOscuro}`.toLowerCase().replace(/^./, (l) => l.toUpperCase());
      sel.caja.setAttribute('aria-label', sel.etiqueta);
      sel.poner(this.colores ? this.colores[this.tipo][tema][i] : '');
    }
    if (!sinMuestra) this.pintarMuestra();
  }

  /* ---- La muestra: los dos papeles, con los colores que de verdad usaria el lector y el efecto elegido ---- */
  pararMuestra() {
    for (const e of this.efectos) e.parar();
    this.efectos = [];
  }

  pintarMuestra() {
    if (!this.colores) return;
    this.pararMuestra();
    const cita = this.tipo === 'cita', m = MUESTRA[this.tipo], fv = letraDeVersos(this.fv.value);
    const avisos = [];
    for (const tema of TEMAS) {
      const { t, x } = this.papeles[tema];
      const par = this.colores[this.tipo][tema];
      t.textContent = m.t;
      x.textContent = m.x;
      x.style.fontFamily = cita ? FUENTES_NOTA[fv].css : 'Georgia, serif';
      x.style.fontSize = cita && LETRAS_GRANDES.has(fv) ? '20px' : '14px';
      x.style.lineHeight = cita && LETRAS_GRANDES.has(fv) ? '1.35' : '1.55';
      [t, x].forEach((el, i) => {
        const c = par[i], k = c ? contraste(c, PAPEL_NOTA[tema]) : 21;
        /* Como el lector: un color que no llega a 3 a 1 no se usa */
        el.style.color = c && k >= CONTRASTE_LECTOR ? c : TINTA_NOTA[tema];
        if (c && k < CONTRASTE_AVISO) avisos.push({ i, tema, k });
      });
      this.efectos.push(animarNota({ titulo: t, textos: [x], entrada: this.ee.value, bucle: this.el.value, oro: () => ORO_NOTA[tema] }));
    }
    this.quieto.hidden = !reducido() || (!this.ee.value && !this.el.value);
    this.pintarAviso(avisos);
  }

  pintarAviso(avisos) {
    const tx = this.tx, cita = this.tipo === 'cita';
    const nombre = (i) => (i === 0 ? (cita ? tx.enTituloCita : tx.enTituloDef) : (cita ? tx.enTextoCita : tx.enTextoDef));
    this.aviso.textContent = avisos.map(({ i, tema, k }) => poner(tx.enPoco, {
      p: nombre(i), tema: tema === 'claro' ? tx.enElClaro : tx.enElOscuro, hacia: tema === 'claro' ? tx.enMasOscuro : tx.enMasClaro
    }) + (k < CONTRASTE_LECTOR ? ' ' + tx.enNoSe : '')).join(' ');
  }

  /* ---- Guardar: un parche de `pagina.notas` ---- */
  /* «Estilo guardado» solo cuando la base ya lo tiene (`alGuardar` devuelve o promete true); mientras, el boton espera */
  async guardar() {
    if (!this.colores || this.guardando) return;
    const parche = {
      letraVersos: letraDeVersos(this.fv.value),
      colores: Object.fromEntries(TIPOS.map((k) => [k, { claro: [...this.colores[k].claro], oscuro: [...this.colores[k].oscuro] }])),
      entrada: entradaValida(this.ee.value) ? this.ee.value : '',
      bucle: bucleValido(this.el.value) ? this.el.value : ''
    };
    let bien = false;
    this.guardando = true;
    this.botonGuardar.disabled = true;
    this.error.textContent = '';
    try { bien = (await this.alGuardar(parche)) === true; } catch { bien = false; }
    this.guardando = false;
    this.botonGuardar.disabled = false;
    if (!bien) { this.error.textContent = this.tx.enNoGuardo; return; }
    if (this.dialogo.open) this.dialogo.close();
    this.alDecir(this.tx.enGuardado);
  }
}
