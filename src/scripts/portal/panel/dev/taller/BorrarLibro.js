/* BORRAR UN LIBRO DEL TALLER, con todo lo suyo: capitulos, copias guardadas, imagenes y PDF.
   No se puede deshacer, asi que la ventana dice cuanto ocupa, ofrece bajar una copia antes y pide escribir
   el titulo. El orden importa: primero se miran los archivos (si no se puede, no se borra nada), luego las
   filas, y al final los archivos. Si algo falla despues de las filas, el libro ya no esta y solo queda
   espacio ocupado; al reves quedaria un libro roto. */
import { pesoLegible } from '../../../../contenido/taller/ArchivosObra.js';

const igual = (a, b) => String(a).normalize('NFC').trim() === String(b).normalize('NFC').trim();
const poner = (t, datos) => Object.entries(datos).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), t || '');

export class BorrarLibro {
  /* `be()` da el backend de ahora (cambia al entrar o salir); `copia(id)` → { ok, faltan } | { error };
     `alBorrar(texto)` avisa en la lista; `textoDe(clave)` da el error */
  constructor(dialogo, { tx, be, copia, alBorrar, textoDe }) {
    Object.assign(this, { dialogo, tx, be, copia, alBorrar, textoDe });
    const q = (s) => dialogo.querySelector(s);
    this.titulo = q('[data-tal-borrar-titulo]');
    this.cuanto = q('[data-tal-borrar-cuanto]');
    this.escribe = q('[data-tal-borrar-escribe]');
    this.estado = q('[data-tal-borrar-estado]');
    this.si = q('[data-tal-borrar-si]');
    this.no = q('[data-tal-borrar-no]');
    this.botonCopia = q('[data-tal-borrar-copia]');
    this.turno = 0;
    this.ocupado = false;
    q('[data-tal-borrar-form]').addEventListener('submit', (e) => { e.preventDefault(); this.borrar(); });
    this.escribe.addEventListener('input', () => this.revisar());
    this.no.addEventListener('click', () => this.cerrar());
    this.botonCopia.addEventListener('click', () => this.bajarCopia());
    /* Mientras trabaja no se cierra: el resultado tiene que verse */
    dialogo.addEventListener('cancel', (e) => { if (this.ocupado) e.preventDefault(); });
    dialogo.addEventListener('close', () => { this.turno++; this.obra = null; });
  }

  /* Al salir de la sesion: se cierra y se vacia aunque este trabajando, y lo que termine despues no avisa */
  cerrarYa() {
    this.vida = (this.vida || 0) + 1;
    this.turno++;
    this.obra = null;
    this.escribe.value = '';
    this.estado.textContent = '';
    if (this.dialogo.open) this.dialogo.close();
  }

  async abrir(obra) {
    const be = this.be();
    if (this.ocupado || !be || !be.taller) return;
    const turno = ++this.turno;
    this.obra = obra;
    this.titulo.textContent = poner(this.tx.borrarPregunta, { titulo: obra.titulo });
    this.cuanto.textContent = this.tx.borrarMidiendo;
    this.escribe.value = '';
    this.estado.textContent = '';
    this.revisar();
    this.dialogo.showModal();
    this.escribe.focus();
    const r = await be.taller.archivos(obra.id);
    if (turno !== this.turno) return;
    if (r.error) { this.cuanto.textContent = this.tx.borrarNoMide; return; }
    const peso = r.archivos.reduce((s, a) => s + a.peso, 0);
    this.cuanto.textContent = r.archivos.length
      ? poner(this.tx.borrarCuanto, { n: r.archivos.length, peso: pesoLegible(peso) })
      : this.tx.borrarSinArchivos;
  }

  cerrar() { if (!this.ocupado && this.dialogo.open) this.dialogo.close(); }

  revisar() {
    const listo = !!this.obra && igual(this.escribe.value, this.obra.titulo);
    this.si.disabled = this.ocupado || !listo;
    this.no.disabled = this.ocupado;
    this.botonCopia.disabled = this.ocupado;
  }

  async bajarCopia() {
    if (this.ocupado || !this.obra) return;
    const turno = this.turno;
    this.ocupado = true;
    this.revisar();
    this.estado.textContent = this.tx.borrarBajando;
    try {
      const r = await this.copia(this.obra.id);
      if (turno !== this.turno) return;
      this.estado.textContent = r.error ? this.textoDe(r.error) : r.faltan ? this.textoDe('copiaIncompleta') : this.tx.borrarCopiaLista;
    } finally {
      this.ocupado = false;
      this.revisar();
    }
  }

  async borrar() {
    const obra = this.obra, be = this.be(), vida = this.vida;
    if (this.ocupado || !obra || !be || !be.taller || !igual(this.escribe.value, obra.titulo)) return;
    this.ocupado = true;
    this.revisar();
    this.estado.textContent = this.tx.borrando;
    let aviso = '';
    try {
      const a = await be.taller.archivos(obra.id);
      if (a.error) { this.estado.textContent = this.textoDe(a.error); return; }
      const r = await be.taller.borrarObra(obra.id);
      if (r.error) { this.estado.textContent = this.textoDe(r.error); return; }
      const b = await be.taller.borrarArchivos(obra.id, a.archivos.map((x) => x.ruta));
      const faltan = b.error ? a.archivos.length : b.faltan;
      const peso = a.archivos.reduce((s, x) => s + x.peso, 0);
      aviso = faltan ? poner(this.tx.libroBorradoQuedan, { n: faltan }) : poner(this.tx.libroBorrado, { peso: pesoLegible(peso) });
    } catch (e) {
      this.estado.textContent = this.textoDe('red');
      return;
    } finally {
      this.ocupado = false;
      this.revisar();
    }
    if (vida !== this.vida) return;
    this.dialogo.close();
    this.alBorrar(aviso);
  }
}
