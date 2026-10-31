/* EL GUARDADO AUTOMATICO. Se guarda a los 2 s de dejar de escribir y, si no se para de escribir,
   cada 15 s. Nunca hay dos guardados a la vez: uno se pisaria con el otro.

   No usa `ctx.conOcupado` ni `aTiempo`: el primero se salta la tarea si hay otra corriendo (un
   guardado perdido) y el segundo dice «sin red» mientras la peticion sigue viva. Por eso quien
   decide si hubo conflicto es Repositorio.decidir(), nunca el reloj.

   `guardar()` devuelve { ok } o { error }. Estados: sucio, guardando, guardado, red, conflicto,
   permiso, lleno.

   LO QUE PASA SI FALLA. Lo escrito sigue marcado como sin guardar, siempre:
     conflicto        se detiene hasta que el fundador decida (`seguir`)
     lleno, permiso   no se reintenta solo, pero el proximo cambio vuelve a probar: al recortar
                      el capitulo, o al volver a entrar, se guarda
     cualquier otro   se reintenta solo, cada vez mas espaciado (la red va y viene) */
const INACTIVO_MS = 2000;
const MAXIMO_MS = 15000;
const REINTENTO_MS = 5000;
const REINTENTO_TOPE_MS = 60000;

export class Autoguardado {
  constructor({ guardar, alEstado, inactivoMs = INACTIVO_MS, maximoMs = MAXIMO_MS, reintentoMs = REINTENTO_MS, reintentoTopeMs = REINTENTO_TOPE_MS }) {
    Object.assign(this, { guardar, alEstado, inactivoMs, maximoMs, reintentoMs, reintentoTopeMs });
    this.sucio = false;
    this.parado = false;
    this.corriendo = null;
    this.reloj = null;
    this.desde = 0;
    this.espera = reintentoMs;
  }

  /* Hubo un cambio */
  marcar() {
    const estaba = this.sucio;
    this.sucio = true;
    if (this.parado) return;
    if (!estaba) { this.desde = Date.now(); this.alEstado('sucio'); }
    clearTimeout(this.reloj);
    const falta = Math.max(0, this.maximoMs - (Date.now() - this.desde));
    this.reloj = setTimeout(() => this.correr(), Math.min(this.inactivoMs, falta));
  }

  async correr() {
    clearTimeout(this.reloj);
    if (this.corriendo) return this.corriendo;
    if (!this.sucio || this.parado) return undefined;
    this.corriendo = this.unaVez().finally(() => { this.corriendo = null; });
    return this.corriendo;
  }

  async unaVez() {
    this.sucio = false;
    this.alEstado('guardando');
    let r;
    try { r = await this.guardar(); } catch (e) { r = { error: 'red' }; }
    if (r && r.ok) {
      this.espera = this.reintentoMs;
      if (this.sucio) { this.reloj = setTimeout(() => this.correr(), this.inactivoMs); this.alEstado('sucio'); } else this.alEstado('guardado');
      return;
    }
    this.sucio = true;
    this.desde = Date.now();
    const motivo = (r && r.error) || 'red';
    if (motivo === 'conflicto') { this.parado = true; this.alEstado('conflicto'); return; }
    if (motivo === 'lleno' || motivo === 'permiso') { this.alEstado(motivo); return; }
    this.alEstado('red');
    this.reloj = setTimeout(() => this.correr(), this.espera);
    this.espera = Math.min(this.espera * 2, this.reintentoTopeMs);
  }

  /* Antes de cambiar de capitulo o de salir: guarda YA y espera. Devuelve si quedo guardado. */
  async vaciar() {
    clearTimeout(this.reloj);
    if (this.corriendo) await this.corriendo;
    if (this.sucio && !this.parado) await this.correr();
    return !this.sucio;
  }

  /* Tras resolver un conflicto */
  seguir() { this.parado = false; }
  soltar() { clearTimeout(this.reloj); this.sucio = false; this.parado = false; this.espera = this.reintentoMs; }
}
