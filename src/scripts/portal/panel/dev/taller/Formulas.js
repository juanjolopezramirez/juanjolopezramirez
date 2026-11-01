/* EL CAMPO PARA ESCRIBIR FORMULAS. MathLive pesa, asi que se baja la primera vez que se usa. Sus letras
   vienen de public/vendor (tools/copiar-pdfjs.mjs). Escribe `/` y sale una fraccion, `^` y sale un
   exponente; Enter guarda, Escape deja todo como estaba. */
import { TEX_MAX } from '../../../../contenido/taller/tipos/formula.js';

let cargado = null;

/* MathLive acepta ordenes de cualquier ventana que tenga una referencia a esta: solo pasan las nuestras */
const soloDeAqui = (e) => { if (e.data && e.data.type === 'mathlive#virtual-keyboard-message' && e.origin !== location.origin) e.stopImmediatePropagation(); };

async function libreria() {
  if (!cargado) {
    window.removeEventListener('message', soloDeAqui, true);
    window.addEventListener('message', soloDeAqui, true);
    cargado = import('mathlive').then(({ MathfieldElement }) => {
      MathfieldElement.fontsDirectory = '/vendor/mathlive/fonts';
      MathfieldElement.soundsDirectory = null;
      MathfieldElement.openUrl = () => {};
      return MathfieldElement;
    }).catch((e) => { cargado = null; throw e; });
  }
  return cargado;
}

export class Formulas {
  constructor(caja, { tx, alError }) {
    Object.assign(this, { caja, tx, alError });
    this.alGuardar = null;
    this.pedido = 0;
    caja.querySelector('[data-fx-listo]').addEventListener('click', () => this.cerrar(true));
    caja.querySelector('[data-fx-cancelar]').addEventListener('click', () => this.cerrar(false));
    caja.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.cerrar(false); } });
  }

  /* `alGuardar(tex)` recibe la formula. `sobre`: el elemento junto al que se abre. */
  async abrir(tex, sobre, alGuardar) {
    const pedido = ++this.pedido;
    let Campo;
    try { Campo = await libreria(); } catch (e) { this.alError('formulaNoCarga'); return; }
    /* MathLive tarda la primera vez: si en ese rato se cerro el libro, ya no hay donde abrir */
    if (pedido !== this.pedido) return;
    this.alGuardar = alGuardar;
    this.sobre = sobre;
    const sitio = this.caja.querySelector('[data-fx-campo]');
    const campo = new Campo();
    campo.mathVirtualKeyboardPolicy = 'manual';
    campo.setAttribute('aria-label', this.tx.formula);
    campo.value = tex;
    campo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); this.cerrar(true); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.cerrar(false); }
    }, true);
    sitio.replaceChildren(campo);
    this.campo = campo;
    this.caja.hidden = false;
    const r = sobre.getBoundingClientRect();
    this.caja.style.left = `${Math.max(8, Math.min(window.innerWidth - this.caja.offsetWidth - 8, r.left))}px`;
    this.caja.style.top = `${Math.max(8, Math.min(window.innerHeight - this.caja.offsetHeight - 8, r.bottom + 8))}px`;
    campo.focus();
  }

  cerrar(guardar) {
    this.pedido++;
    if (this.caja.hidden) return;
    const tex = this.campo.value.slice(0, TEX_MAX), fn = this.alGuardar, sobre = this.sobre;
    this.caja.hidden = true;
    this.campo.remove();
    this.campo = null;
    this.alGuardar = null;
    this.sobre = null;
    if (guardar && fn) fn(tex);
    if (sobre && sobre.isConnected) (sobre.closest('[contenteditable="true"]') || sobre).focus();
  }
}
