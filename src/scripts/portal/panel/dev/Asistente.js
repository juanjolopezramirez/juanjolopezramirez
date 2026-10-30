/* Un formulario por pasos (components/portal/dev/Ruta.astro, Paso.astro y Pie.astro).

   Se ve un paso cada vez; los demas siguen en la pagina (escondidos), asi que nada de lo
   escrito se pierde al ir y venir, y «Guardar borrador» lee el formulario entero.
     ir(paso)       al paso (su id o su numero); el foco va a su titulo
     pasoDe(el)     en que paso esta un campo (para llevar a el los errores)
     marcar(ids)    los pasos con algo que revisar (en la ruta, con palabras y no solo color)
   `alCambiar(id)` se llama al llegar a cada paso (EditorContenido pinta «Revisar»). */
export class Asistente {
  constructor(form, { alCambiar, pasoDe } = {}) {
    this.form = form;
    this.pasos = [...form.querySelectorAll('[data-etapa]')];
    this.botones = [...form.querySelectorAll('[data-ir-etapa]')];
    this.anterior = form.querySelector('[data-dev-anterior]');
    this.siguiente = form.querySelector('[data-dev-siguiente]');
    this.alCambiar = alCambiar;
    this.i = 0;
    /* Quien no ve oye, al llegar, «Paso 2 de 5: El PDF» (lo de antes del nombre no se ve) */
    if (pasoDe) {
      this.pasos.forEach((p, k) => {
        const h = p.querySelector('.dev__paso-titulo');
        if (!h) return;
        const voz = document.createElement('span');
        voz.className = 'sr-only';
        voz.textContent = pasoDe.replace('{n}', k + 1).replace('{total}', this.pasos.length);
        h.prepend(voz);
      });
    }
    this.botones.forEach((b) => b.addEventListener('click', () => this.ir(b.dataset.irEtapa)));
    if (this.anterior) this.anterior.addEventListener('click', () => this.ir(this.i - 1));
    if (this.siguiente) this.siguiente.addEventListener('click', () => this.ir(this.i + 1));
  }

  get ids() { return this.pasos.map((p) => p.dataset.etapa); }
  get actual() { return this.ids[this.i]; }

  ir(paso, { foco = true } = {}) {
    const i = typeof paso === 'number' ? paso : this.ids.indexOf(paso);
    if (i < 0 || i >= this.pasos.length) return;
    this.i = i;
    this.pasos.forEach((p, k) => { p.hidden = k !== i; });
    this.botones.forEach((b, k) => {
      if (k === i) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    if (this.anterior) this.anterior.hidden = i === 0;
    if (this.siguiente) this.siguiente.hidden = i === this.pasos.length - 1;
    if (this.alCambiar) this.alCambiar(this.actual);
    if (foco) {
      const h = this.pasos[i].querySelector('.dev__paso-titulo');
      if (h) h.focus();
    }
  }

  pasoDe(el) {
    const p = el && el.closest ? el.closest('[data-etapa]') : null;
    return p && this.form.contains(p) ? p.dataset.etapa : null;
  }

  marcar(ids) {
    const con = new Set(ids);
    for (const b of this.botones) this.ponerMarca(b, con.has(b.dataset.irEtapa));
  }
  /* Un paso que ya no tiene nada que revisar (se arreglo lo marcado) */
  desmarcar(id) {
    const b = this.botones.find((x) => x.dataset.irEtapa === id);
    if (b) this.ponerMarca(b, false);
  }
  ponerMarca(b, si) {
    b.classList.toggle('dev__ruta-boton--error', si);
    const voz = b.querySelector('[data-ruta-error]');
    if (voz) voz.hidden = !si;
  }
  limpiar() { this.marcar([]); }
}
