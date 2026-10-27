/* La base de toda seccion del panel que hace algo («Quién entra», «Seguridad» y, luego,
   las de Developer-Mode y Self-Mode).

   Cada seccion vive en su caja (el elemento cuyos hijos directos son su aviso
   `[data-aviso]` y su error `[data-error]`) y recibe del panel lo comun (`ctx`):
   el backend, si eres admin, quien eres, los textos y las ayudas (aTiempo,
   conOcupado, plantilla, poner, fecha, textoDe).

   El panel le dice dos cosas: `alEntrar()` cuando se abre y `olvidar()` cuando la
   persona sale (lo que se vio de otros se borra de la pagina). */
export class Seccion {
  /** @param {Element|null} caja  @param {object} ctx */
  constructor(caja, ctx) {
    this.caja = caja;
    this.ctx = ctx;
  }

  /* Un miembro no tiene las secciones del admin: panel.js las quita del DOM al abrir (la
     seccion ya estaba hecha, asi que su caja sigue en memoria pero fuera de la pagina). */
  get existe() { return !!this.caja && this.caja.isConnected; }

  alEntrar() {}
  olvidar() {}

  /* Un aviso que recibe el foco: el boton que se pulso puede desaparecer. */
  avisar(texto) {
    const el = this.caja && this.caja.querySelector(':scope > [data-aviso]');
    if (!el) return;
    el.hidden = false;
    el.textContent = texto || '';
    el.focus();
  }

  error(clave) {
    const el = this.caja && this.caja.querySelector(':scope > [data-error]');
    if (!el) return;
    el.textContent = '';
    el.hidden = false;
    setTimeout(() => { el.textContent = this.ctx.textoDe(clave); }, 30);
  }

  limpiar() {
    if (!this.caja) return;
    this.caja.querySelectorAll(':scope > [data-aviso], :scope > [data-error]').forEach((el) => { el.hidden = true; el.textContent = ''; });
  }
}
