/* «Seguridad» (solo admin): el codigo de 6 numeros de una app.

   La lista de dispositivos, añadir uno (QR + clave + su primer codigo) y quitar uno
   (nunca el ultimo desde aqui: para eso esta la receta de PORTAL.md). El QR es una
   imagen `data:image/svg+xml` que da Supabase: entra por `img.src`, nunca como HTML. */
import { Seccion } from './Seccion.js';
import { codigoValido } from '../estado.js';
import { errorEnForm, limpiarForm } from './formulario.js';

export class Seguridad extends Seccion {
  constructor(raiz, ctx) {
    super(raiz.querySelector('[data-seguridad]'), ctx);
    this.ps = (ctx.p && ctx.p.seguridad) || {};
    this.altaId = null;
    this.secreto = '';          // la clave del dispositivo a medias, tal cual (para «Copiar»); se borra al cerrar
    if (this.caja) this.armar();
  }

  alEntrar() {
    if (this.existe && this.ctx.esAdmin) this.pintar();
  }

  cerrarAlta() {
    const alta = this.caja.querySelector('[data-alta]');
    alta.hidden = true;
    this.caja.querySelector('[data-qr]').replaceChildren();
    this.caja.querySelector('[data-secreto]').textContent = '';
    this.secreto = '';
    const form = alta.querySelector('form');
    form.elements.codigo.value = '';
    limpiarForm(form);
    this.caja.querySelector('[data-agregar]').hidden = false;
    this.altaId = null;
  }

  /* Devuelve si pudo pintar: «Listo» solo se dice si la lista de verdad se puso al dia. */
  async pintar() {
    const { be, aTiempo, plantilla, poner, fecha, conOcupado } = this.ctx;
    const ps = this.ps;
    if (!this.caja || !be || !be.mfa) return false;
    const r = await aTiempo(be.mfa.factores());
    if (r.error) { this.error(r.error); return false; }
    const lista = this.caja.querySelector('[data-lista="dispositivos"]');
    const base = plantilla('dispositivo');
    lista.replaceChildren();
    r.lista.forEach((f) => {
      if (!base) return;
      const li = base.cloneNode(true).firstElementChild;
      poner(li, 'nombre', f.nombre);
      poner(li, 'fecha', `${ps.agregado || ''} ${fecha(f.creado)}`.trim());
      const b = li.querySelector('[data-quitar]');
      if (r.lista.length < 2) b.remove();
      else {
        b.setAttribute('aria-label', `${b.textContent} (${f.nombre})`);
        b.addEventListener('click', () => conOcupado(b, async () => {
          this.limpiar();
          const q = await aTiempo(be.mfa.quitar(f.id));
          if (q.error) { this.error(q.error); return; }
          if (await this.pintar()) this.avisar(ps.quitado);
        }, () => this.error('generico')));
      }
      lista.appendChild(li);
    });
    this.caja.querySelector('[data-unico]').hidden = r.lista.length !== 1;
    this.caja.querySelector('[data-estado-codigo]').textContent = r.lista.length ? ps.activo : ps.inactivo;
    return true;
  }

  armar() {
    const { aTiempo, conOcupado, textoDe } = this.ctx;
    const ps = this.ps;
    const seg = this.caja;
    const agregar = seg.querySelector('[data-agregar]');
    const alta = seg.querySelector('[data-alta]');
    const formAlta = alta.querySelector('form');
    const fallo = () => this.error('generico');

    agregar.addEventListener('click', () => conOcupado(agregar, async () => {
      const be = this.ctx.be;
      if (!be || !be.mfa) return;
      this.limpiar();
      const r = await aTiempo(be.mfa.inscribir());
      if (r.error) { this.error(r.error); return; }
      this.altaId = r.id;
      const img = new Image();
      img.alt = ps.qr || '';
      img.width = 180; img.height = 180;
      img.src = r.qr;
      seg.querySelector('[data-qr]').replaceChildren(img);
      /* La clave se lee en grupos de 4; «Copiar» copia la de verdad, sin espacios. */
      this.secreto = r.secreto;
      seg.querySelector('[data-secreto]').textContent = this.secreto.replace(/(.{4})(?=.)/g, '$1 ');
      agregar.hidden = true;
      alta.hidden = false;
      formAlta.elements.codigo.focus();
    }, fallo));

    formAlta.addEventListener('submit', (e) => {
      e.preventDefault();
      const campo = formAlta.elements.codigo;
      limpiarForm(formAlta);
      if (!codigoValido(campo.value)) { errorEnForm(formAlta, campo, 'codigoMalo', textoDe); return; }
      conOcupado(formAlta.querySelector('button[type="submit"]'), async () => {
        const r = await aTiempo(this.ctx.be.mfa.confirmar(this.altaId, campo.value));
        if (r.error) { errorEnForm(formAlta, campo, r.error, textoDe); return; }
        this.cerrarAlta();
        if (await this.pintar()) this.avisar(ps.listo);
      }, () => errorEnForm(formAlta, campo, 'generico', textoDe));
    });

    const copiar = seg.querySelector('[data-copiar]');
    copiar.addEventListener('click', () => {
      if (!this.secreto || !navigator.clipboard) return;
      navigator.clipboard.writeText(this.secreto).then(() => this.avisar(ps.copiada), () => {});
    });

    const otras = seg.querySelector('[data-cerrar-otras]');
    otras.addEventListener('click', () => conOcupado(otras, async () => {
      const be = this.ctx.be;
      if (!be || !be.mfa) return;
      this.limpiar();
      const r = await aTiempo(be.mfa.cerrarOtras());
      if (r.error) { this.error(r.error); return; }
      this.avisar(ps.otrasCerradas);
    }, fallo));

    /* Cancelar: el dispositivo a medias se borra (si no, quedaria colgado sin confirmar). */
    alta.querySelector('[data-cancelar]').addEventListener('click', () => {
      if (this.ctx.ocupado) return;           // mientras se confirma, no se cancela (no chocan)
      const id = this.altaId;
      this.cerrarAlta();
      const be = this.ctx.be;
      if (id && be && be.mfa) be.mfa.quitar(id);
      agregar.focus();
    });
  }

  olvidar() {
    if (!this.caja) return;
    this.caja.querySelector('[data-qr]').replaceChildren();
    this.caja.querySelector('[data-secreto]').textContent = '';
    this.secreto = '';
  }
}
