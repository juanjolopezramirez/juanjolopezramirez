/* LA FICHA DEL LIBRO (supabase/016): resumen, tema, «Lo que encontrarás» (hasta 5 lineas) y «Para quién». Es lo que lee
   quien abre el libro y toca «Sobre este libro» en el lector (lector/hojaFicha.js), en un enlace privado y en Recursos.

   Se entra desde «Ajustes del libro»: este archivo pone ahi su rotulo y su boton (no hace falta tocar el marcado del
   Taller), y arma su ventana nodo por nodo, como NotaEditor y «Ajustes del libro». Todo lo escrito entra como texto
   (textContent / value), nunca como HTML. Al guardar se limpia con la misma regla del lector (lector/ficha.js) y se
   entrega con `alGuardar(ficha)`, que la pone en la obra y la guarda por el camino de siempre (el autoguardado).
   Cada enlace privado se lleva una COPIA al crearse (Publicar.js); para cambiar la de uno ya hecho, «Actualizar la ficha». */
import { limpiarFicha, TOPES } from '../../../../lector/ficha.js';

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

export class Ficha {
  /* `ajustes`: el <dialog> «Ajustes del libro» (alli va la entrada). `leer()`: la ficha de la obra abierta (o null).
     `alGuardar(ficha)`: la pone en la obra y la guarda; devuelve (o promete) true solo si la base ya la tiene. `alDecir(t)`:
     lo dice la mesa. */
  constructor(ajustes, { tx, leer, alGuardar, alDecir = () => {} }) {
    Object.assign(this, { ajustes, tx, leer, alGuardar, alDecir });
    this.n = ++cuenta;
    this.entrada();
    this.armar();
  }

  id(s) { return `tal-ficha-${s}-${this.n}`; }

  /* ---- En «Ajustes del libro»: el rotulo, una linea de ayuda, el boton y como esta ---- */
  entrada() {
    const tx = this.tx;
    this.boton = h('button', { clase: 'tal-btn', type: 'button', 'aria-describedby': this.id('estado') });
    this.estado = h('span', { clase: 'tal-ficha__estado', id: this.id('estado') });
    const caja = h('div', { clase: 'tal-ficha__entrada' }, [
      h('p', { clase: 'tal-rotulo', texto: tx.fichaRotulo }),
      h('p', { clase: 'tal-ayuda', texto: tx.fichaAyuda }),
      h('div', { clase: 'tal-ficha__fila' }, [this.boton, this.estado])
    ]);
    const fin = [...this.ajustes.children].reverse().find((x) => x.classList.contains('tal-fila'));
    if (fin) this.ajustes.insertBefore(caja, fin); else this.ajustes.append(caja);
    this.boton.addEventListener('click', () => this.abrir());
    /* Cada vez que se abre «Ajustes del libro», dice si ya hay ficha */
    new MutationObserver(() => { if (this.ajustes.open) this.pintarEntrada(); }).observe(this.ajustes, { attributes: true, attributeFilter: ['open'] });
    this.pintarEntrada();
  }

  pintarEntrada() {
    const f = limpiarFicha(this.leer());
    const hay = Object.keys(f).length > 0;
    this.boton.textContent = hay ? this.tx.fichaEditar : this.tx.fichaEscribir;
    this.estado.textContent = hay ? this.tx.fichaLlena : this.tx.fichaVacia;
  }

  /* ---- La ventana, una sola vez ---- */
  armar() {
    const tx = this.tx;
    const d = this.dialogo = h('dialog', { clase: 'tal-ajustes tal-nota tal-ficha', 'aria-labelledby': this.id('t'), 'aria-describedby': this.id('sobre') });
    const f = this.form = h('form', { clase: 'tal-nota__caja', novalidate: true });
    const cuentas = [];
    /* Un campo con su contador a la derecha del nombre: «12 de 60». El contador se lee al salir del campo, no a cada letra */
    const campo = (nombre, control, max, ayuda) => {
      const c = h('span', { clase: 'tal-ficha__cuenta', id: this.id(`c${cuentas.length}`) });
      cuentas.push([control, c, max]);
      const ayudaId = ayuda ? this.id(`a${cuentas.length}`) : null;
      control.setAttribute('aria-describedby', [ayudaId, c.id].filter(Boolean).join(' '));
      control.addEventListener('input', () => this.contar(control, c, max));
      return h('label', { clase: 'tal-nota__campo' }, [
        h('span', { clase: 'tal-ficha__nombre' }, [h('span', { texto: nombre }), c]),
        control,
        ayuda ? h('span', { clase: 'tal-ficha__ayuda', id: ayudaId, texto: ayuda }) : null
      ]);
    };
    this.resumen = h('textarea', { clase: 'tal-nota__entrada tal-nota__area tal-ficha__resumen', maxlength: TOPES.resumen, rows: 5, spellcheck: 'true' });
    this.tema = h('input', { clase: 'tal-nota__entrada', maxlength: TOPES.tema, autocomplete: 'off', placeholder: tx.fichaTemaEj });
    this.para = h('input', { clase: 'tal-nota__entrada', maxlength: TOPES.para_quien, autocomplete: 'off', placeholder: tx.fichaParaEj });
    /* «Lo que encontrarás»: se ven las lineas escritas y una vacia mas, hasta 5 */
    this.claves = Array.from({ length: TOPES.claves }, (_, i) => {
      const x = h('input', { clase: 'tal-nota__entrada', maxlength: TOPES.clave, autocomplete: 'off', 'aria-label': poner(tx.fichaClave, { n: i + 1 }) });
      x.addEventListener('input', () => this.verClaves());
      return x;
    });
    this.lista = h('ol', { clase: 'tal-ficha__claves' }, this.claves.map((x) => h('li', {}, [x])));
    const claves = h('fieldset', { clase: 'tal-nota__grupo', 'aria-describedby': this.id('claves-ayuda') }, [
      h('legend', { texto: tx.fichaClaves }),
      this.lista,
      h('span', { clase: 'tal-ficha__ayuda', id: this.id('claves-ayuda'), texto: tx.fichaClavesAyuda })
    ]);
    this.error = h('p', { clase: 'tal-nota__error', role: 'alert' });
    const cancelar = h('button', { clase: 'tal-btn', type: 'button', texto: tx.cancelar });
    const guardar = this.guardarBtn = h('button', { clase: 'tal-btn tal-btn--fuerte', type: 'submit', texto: tx.fichaGuardar });
    f.append(
      h('div', { clase: 'tal-nota__cabeza' }, [h('h2', { clase: 'tal-ajustes__titulo', id: this.id('t'), texto: tx.fichaTitulo }), h('p', { clase: 'tal-nota__sobre', id: this.id('sobre'), texto: tx.fichaSobre })]),
      h('div', { clase: 'tal-nota__parte' }, [
        campo(tx.fichaResumen, this.resumen, TOPES.resumen, tx.fichaResumenAyuda),
        campo(tx.fichaTema, this.tema, TOPES.tema),
        claves,
        campo(tx.fichaPara, this.para, TOPES.para_quien)
      ]),
      this.error,
      h('div', { clase: 'tal-nota__botones' }, [cancelar, guardar])
    );
    this.cuentas = cuentas;
    d.append(f);
    (this.ajustes.closest('[data-tal-mesa]') || document.body).append(d);
    cancelar.addEventListener('click', () => d.close());
    f.addEventListener('submit', (e) => { e.preventDefault(); this.guardar(); });
    d.addEventListener('close', () => {
      this.error.textContent = '';
      /* De vuelta al boton de «Ajustes del libro». Despues de que el navegador devuelva el foco a su manera (a la otra
         ventana, que sigue abierta debajo): si no, gana el suyo */
      const a = this.vuelve;
      this.vuelve = null;
      setTimeout(() => { if (a && a.isConnected && !this.dialogo.open) a.focus({ preventScroll: true }); }, 0);
    });
  }

  contar(control, c, max) {
    const n = control.value.length;
    c.textContent = poner(this.tx.fichaCuenta, { n, max });
    c.toggleAttribute('data-cerca', n >= max * 0.9);
  }

  /* Las lineas escritas y una vacia mas (si cabe): las de en medio vacias se quedan, para no mover el foco */
  verClaves() {
    let ultima = -1;
    this.claves.forEach((x, i) => { if (x.value.trim()) ultima = i; });
    const ver = Math.min(TOPES.claves, ultima + 2);
    this.claves.forEach((x, i) => { x.parentElement.hidden = i >= ver && x !== document.activeElement; });
  }

  abrir() {
    if (this.dialogo.open) return;
    const f = limpiarFicha(this.leer());
    this.resumen.value = f.resumen || '';
    this.tema.value = f.tema || '';
    this.para.value = f.para_quien || '';
    this.claves.forEach((x, i) => { x.value = (f.claves && f.claves[i]) || ''; });
    this.verClaves();
    this.cuentas.forEach(([control, c, max]) => this.contar(control, c, max));
    this.error.textContent = '';
    this.vuelve = this.boton.isConnected ? this.boton : document.activeElement;
    this.dialogo.showModal();
    this.resumen.focus();
  }

  /* «Ficha guardada» solo cuando la base ya la tiene. Si no (sin red, otra pestaña), la ventana se queda abierta con lo
     escrito y lo dice; el Taller ya avisa el porque y, sin red, lo vuelve a intentar solo. */
  async guardar() {
    if (this.guardando) return;
    const ficha = limpiarFicha({
      resumen: this.resumen.value, tema: this.tema.value, para_quien: this.para.value,
      claves: this.claves.map((x) => x.value)
    });
    this.guardando = true;
    this.guardarBtn.disabled = true;
    this.error.textContent = '';
    let bien = false;
    try { bien = (await this.alGuardar(ficha)) === true; } catch (e) { bien = false; } finally { this.guardando = false; this.guardarBtn.disabled = false; }
    if (!bien) { this.error.textContent = this.tx.fichaNoGuardo; return; }
    if (this.dialogo.open) this.dialogo.close();
    this.pintarEntrada();
    this.alDecir(this.tx.fichaGuardada);
  }
}
