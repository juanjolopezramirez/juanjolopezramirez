/* «Quién entra» (solo admin): pendientes, con acceso, sin acceso e invitaciones.

   Las lee y las cambia la base (RLS + decidir_acceso): si quien llama no es admin, el
   servidor contesta vacio o con error, tenga la pagina el aspecto que tenga.
   Todo texto de otra persona (nombre, correo, motivo) entra con `textContent`. */
import { Seccion } from './Seccion.js';
import { correoValido } from '../estado.js';
import { errorEnForm, limpiarForm, quitarMarcaCampo } from './formulario.js';

export class Accesos extends Seccion {
  constructor(raiz, ctx) {
    super(raiz.querySelector('.panel__accesos'), ctx);
    this.pintada = false;
    this.a = (ctx.p && ctx.p.accesos) || {};
    const form = this.caja && this.caja.querySelector('[data-form="invitar"]');
    if (form) this.armarInvitar(form);
  }

  alEntrar() {
    if (!this.existe || !this.ctx.esAdmin || this.pintada) return;
    this.pintada = true;                                                  // no lanzarla dos veces a la vez
    this.recargar().then((bien) => { if (!bien) this.pintada = false; });   // si falla, se reintenta al volver a la seccion
  }

  fila(f) {
    const { plantilla, poner, fecha, yo } = this.ctx;
    const a = this.a;
    const base = plantilla('persona');
    if (!base) return null;
    const li = base.cloneNode(true).firstElementChild;
    const nombre = typeof f.nombre === 'string' && f.nombre.trim() ? f.nombre.trim() : (a.sinNombre || '');
    poner(li, 'nombre', nombre);
    poner(li, 'correo', f.correo);
    poner(li, 'motivo', f.id === yo ? (a.tu || '') : (f.motivo || (f.estado === 'pendiente' ? (a.sinMotivo || '') : '')));
    poner(li, 'fecha', `${a.pedido || ''} ${fecha(f.creado)}`.trim());
    li.querySelectorAll('[data-accion]').forEach((b) => {
      const en = String(b.dataset.en || '').split(' ');
      if (f.id === yo || !en.includes(f.estado)) { b.remove(); return; }
      b.setAttribute('aria-label', `${b.textContent} (${f.nombre || f.correo})`);
      b.addEventListener('click', () => this.decidir(f, b.dataset.accion, b));
    });
    return li;
  }

  filaInvitacion(i) {
    const { plantilla, poner, fecha } = this.ctx;
    const a = this.a;
    const base = plantilla('invitacion');
    if (!base) return null;
    const li = base.cloneNode(true).firstElementChild;
    poner(li, 'correo', i.correo);
    let estado;
    if (i.usada_en) estado = a.usada || '';
    else if (new Date(i.caduca).getTime() < Date.now()) estado = a.caducada || '';
    else estado = `${a.esperando || ''} · ${a.hasta || ''} ${fecha(i.caduca)}`.trim();
    poner(li, 'estado', estado);
    const b = li.querySelector('[data-borrar]');
    if (b) {
      b.setAttribute('aria-label', `${b.textContent} (${i.correo})`);
      b.addEventListener('click', () => this.borrarInvitacion(i.correo, b));
    }
    return li;
  }

  llenar(nombre, filas, hacer, total = filas.length) {
    const lista = this.caja.querySelector(`[data-lista="${nombre}"]`);
    const vacio = this.caja.querySelector(`[data-vacio="${nombre}"]`);
    const cuenta = this.caja.querySelector(`[data-cuenta="${nombre}"]`);
    const mas = this.caja.querySelector(`[data-mas="${nombre}"]`);
    if (!lista) return;
    lista.replaceChildren();
    filas.forEach((f) => { const li = hacer(f); if (li) lista.appendChild(li); });
    if (vacio) vacio.hidden = filas.length > 0;
    if (cuenta) cuenta.textContent = total ? `(${total})` : '';
    if (mas) mas.hidden = total <= filas.length;
  }

  /* Devuelve si pudo pintar: «Listo» solo se dice si la lista de verdad se puso al dia. */
  async recargar() {
    const be = this.ctx.be;
    const [per, inv] = await Promise.all([be.accesos.listarPerfiles(), be.accesos.listarInvitaciones()]);
    if (per.error || inv.error) { this.error(per.error || inv.error); return false; }
    const de = (estado) => per.filas.filter((f) => (estado === 'pendiente' ? f.estado !== 'aprobado' && f.estado !== 'rechazado' : f.estado === estado));
    const t = per.totales || {};
    const persona = (f) => this.fila(f);
    this.llenar('pendientes', de('pendiente'), persona, t.pendiente);
    this.llenar('aprobados', de('aprobado'), persona, t.aprobado);
    this.llenar('rechazados', de('rechazado'), persona, t.rechazado);
    this.llenar('invitaciones', inv.filas, (i) => this.filaInvitacion(i));
    return true;
  }

  decidir(f, estado, boton) {
    return this.ctx.conOcupado(boton, async () => {
      this.limpiar();
      const r = await this.ctx.be.accesos.decidir(f.id, estado);
      if (r.error) { this.error(r.error); return; }
      if (await this.recargar()) this.avisar(estado === 'aprobado' ? this.a.listoAprobado : this.a.listoRechazado);
    }, () => this.error('generico'));
  }

  borrarInvitacion(correo, boton) {
    return this.ctx.conOcupado(boton, async () => {
      this.limpiar();
      const r = await this.ctx.be.accesos.borrarInvitacion(correo);
      if (r.error) { this.error(r.error); return; }
      if (await this.recargar()) this.avisar(this.a.listoQuitado);
    }, () => this.error('generico'));
  }

  armarInvitar(form) {
    const { textoDe } = this.ctx;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!this.ctx.be || !this.ctx.esAdmin) return;
      const campo = form.elements.email;
      limpiarForm(form);
      const correo = campo.value.trim();
      if (!correoValido(correo)) { errorEnForm(form, campo, 'correoInvalido', textoDe); return; }
      this.ctx.conOcupado(form.querySelector('button[type="submit"]'), async () => {
        this.limpiar();
        const r = await this.ctx.be.accesos.invitar(correo);
        if (r.error) { errorEnForm(form, campo, r.error, textoDe); return; }
        campo.value = '';
        if (await this.recargar()) this.avisar(this.a.listoInvitado);
      }, () => this.error('generico'));
    });
    form.addEventListener('input', (e) => {
      if (e.target && e.target.removeAttribute) quitarMarcaCampo(e.target);
    });
  }

  olvidar() {
    if (!this.caja) return;
    this.caja.querySelectorAll('[data-lista]').forEach((l) => l.replaceChildren());
    this.caja.querySelectorAll('[data-cuenta]').forEach((c) => { c.textContent = ''; });
  }
}
