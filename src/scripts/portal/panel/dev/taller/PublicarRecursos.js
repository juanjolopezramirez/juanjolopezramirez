/* PUBLICAR EN RECURSOS, dentro de la ventana «Compartir» del Taller (etapa A3b). Aqui solo esta la pantalla; las cuentas
   y el orden de los pasos viven en contenido/taller/Recursos.js (con pruebas en Node).

   Lo que ve el autor:
     · la edicion que se publica es SIEMPRE la ultima (se dice su fecha y sus paginas; si hay una mas nueva, se avisa);
     · la direccion del libro (/es/writing/#id) se propone desde el titulo y NO cambia despues de publicar;
     · el tema lo elige el; la pasta sale de «Con tapa dura» de la edicion (blanda → revista, dura → tapa dura);
     · antes de confirmar se dice que Recursos es publico (con la direccion), y hace falta un segundo clic, que no vale si
       llega pegado al primero (doble clic) ni si entre medias se cambia algo;
     · publicar otra edicion REEMPLAZA el mismo libro; borrar el libro del Taller o una edicion NO lo quita de Recursos;
     · «Quitar de Recursos» corta la descarga del PDF al instante; el libro sigue en la web hasta el proximo «Actualizar la web».
   Publicar no crea ni apaga enlaces privados. Todo texto se escribe con textContent. */
import { Libro } from '../../../../contenido/Libro.js';
import { TEMAS, proponerId, publicarLibro, quitarDeRecursos, recortarTitulo } from '../../../../contenido/taller/Recursos.js';

const poner = (t, datos) => Object.entries(datos || {}).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), t || '');
const CLAVES = {
  idNoValido: 'rcIdNoValido', idCambia: 'rcIdCambia', idOcupado: 'rcIdOcupado', temaNoExiste: 'rcTemaFalta', tituloFalta: 'rcTituloFalta',
  idNoVinculado: 'rcFalla', archivoRuta: 'rcFalla', noExiste: 'rcFalla', hayBorrador: 'rcHayBorrador', edicionNueva: 'rcEdicionNueva'
};
/* El segundo clic de una confirmacion no vale si llega antes de esto (un doble clic no confirma por accidente) */
export const ESPERA_CONFIRMAR_MS = 800;

export class PublicarRecursos {
  /* `seccion` es el nodo de la ventana; `be()` el backend; `obraId()` el libro abierto. El idioma y el titulo salen de la
     ultima edicion (`pintar(ed)`). */
  constructor(seccion, { tx, be, obraId, textoDe, fecha, lang }) {
    Object.assign(this, { seccion, tx, be, obraId, textoDe, fecha, lang });
    const q = (s) => seccion.querySelector(s);
    this.q = q;
    this.edicionTxt = q('[data-rc-edicion]');
    this.yaTxt = q('[data-rc-ya]');
    this.id = q('[data-rc-id]');
    this.idAyuda = q('[data-rc-id-ayuda]');
    this.tit = q('[data-rc-titulo]');
    this.corte = q('[data-rc-corte]');
    this.tema = q('[data-rc-tema]');
    this.pasta = q('[data-rc-pasta]');
    this.publicar = q('[data-rc-publicar]');
    this.quitar = q('[data-rc-quitar]');
    this.aviso = q('[data-rc-aviso]');
    this.estado = q('[data-rc-estado]');
    this.ed = null;
    this.libroId = '';
    this.ocupado = false;
    this.vida = 0;       // cambia al salir del libro: lo que llegue despues de eso ya no se pinta
    this.turno = 0;      // cada pintar() lo sube: solo vale el ultimo
    this.sucioId = false;
    this.armado = false;
    this.armadoEn = 0;
    this.armadoQuitar = false;
    this.armadoQuitarEn = 0;
    const op = document.createElement('option');
    op.value = '';
    op.textContent = tx.rcElige;
    this.tema.append(op);
    for (const t of TEMAS) { const o = document.createElement('option'); o.value = t.id; o.textContent = t.nombre; this.tema.append(o); }
    this.id.addEventListener('input', () => { this.desarmar(); this.sucioId = true; this.id.value = this.id.value.toLowerCase().replace(/[^a-z0-9]/g, ''); this.pintarAyudaId(); });
    this.tit.addEventListener('input', () => {
      this.desarmar();
      this.tit.dataset.tocado = '1';
      this.corte.hidden = true;
      if (!this.sucioId && !this.libroId) { this.id.value = proponerId(this.tit.value); this.pintarAyudaId(); }
    });
    this.tema.addEventListener('change', () => this.desarmar());
    this.publicar.addEventListener('click', () => this.alPublicar());
    this.publicar.addEventListener('blur', () => this.desarmar());
    this.quitar.addEventListener('click', () => this.alQuitar());
    this.quitar.addEventListener('blur', () => this.desarmarQuitar());
  }

  idiomaDe() { return (this.ed && this.ed.idioma) || 'es'; }

  /* Al salir del libro o de la sesion: nada de lo escrito se lleva al libro siguiente */
  cerrarYa() {
    this.vida++;
    this.turno++;
    this.desarmar();
    this.desarmarQuitar();
    this.sucioId = false;
    delete this.tit.dataset.tocado;
    this.id.value = '';
    this.id.readOnly = false;
    this.tit.value = '';
    this.tema.value = '';
    this.corte.hidden = true;
    this.corte.textContent = '';
    this.idAyuda.textContent = '';
    this.estado.textContent = '';
    this.yaTxt.hidden = true;
    this.quitar.hidden = true;
    this.ed = null;
    this.libroId = '';
    this.ocupado = false;
  }

  desarmar() {
    this.armado = false;
    this.aviso.hidden = true;
    this.publicar.textContent = this.tx.rcPublicar;
    this.publicar.removeAttribute('data-armado');
  }

  desarmarQuitar() {
    this.armadoQuitar = false;
    this.quitar.textContent = this.tx.rcQuitar;
  }

  pintarAyudaId() {
    this.idAyuda.textContent = this.id.value ? poner(this.tx.rcDireccionAyuda, { lang: this.lang, id: this.id.value }) : '';
  }

  /* Cada vez que la ventana se pinta: `ed` es la ultima edicion (o null). «Quitar de Recursos» se ve aunque no haya ediciones. */
  async pintar(ed) {
    const be = this.be(), turno = ++this.turno, obraId = this.obraId();
    this.ed = ed;
    this.quitar.hidden = true;
    this.yaTxt.hidden = true;
    const sinBase = !be || !obraId;
    for (const n of [this.id, this.tit, this.tema, this.publicar]) n.disabled = sinBase || !ed || this.ocupado;
    let entrada = null;
    if (!sinBase) {
      const [l, lista] = await Promise.all([be.taller.libroDe(obraId), be.contenido.repositorio(Libro).listar()]);
      if (turno !== this.turno) return;
      this.libroId = l.ok ? l.libroId : '';
      entrada = this.libroId && lista.entradas ? lista.entradas.find((x) => x.id === this.libroId) || null : null;
      if (this.libroId) {
        this.yaTxt.hidden = false;
        this.yaTxt.textContent = poner(this.tx.rcYa, { id: this.libroId, estado: entrada && entrada.publicado ? this.tx.rcEstadoPublicado : this.tx.rcEstadoFuera });
        this.quitar.hidden = !(entrada && entrada.publicado);
      }
    }
    if (!ed || sinBase) { this.edicionTxt.textContent = this.tx.rcSinEdicion; return; }
    this.edicionTxt.textContent = poner(this.tx.rcEdicion, { fecha: this.fecha(ed.creado), n: ed.paginas });
    this.pasta.textContent = poner(this.tx.rcPasta, { pasta: ed.blando === false ? this.tx.rcPastaDura : this.tx.rcPastaBlanda });
    const previo = entrada && entrada.enBase ? entrada.enBase : null;
    this.id.readOnly = !!this.libroId;
    /* La direccion sale del titulo de ESTA edicion, nunca de lo que hubiera de otro libro */
    if (this.libroId) this.id.value = this.libroId;
    else if (!this.sucioId) this.id.value = proponerId(this.tit.dataset.tocado ? this.tit.value : ed.titulo);
    if (!this.tit.dataset.tocado) {
      const t = recortarTitulo(previo && previo.titulo[this.idiomaDe()] ? previo.titulo[this.idiomaDe()] : ed.titulo);
      this.tit.value = t.texto;
      this.corte.hidden = !t.recortado;
      this.corte.textContent = t.recortado ? this.tx.rcCorte : '';
    }
    if (previo && !this.tema.value) this.tema.value = previo.seccion;
    this.pintarAyudaId();
  }

  mensaje(e) {
    if (e && e.error === 'invalido') return this.tx.rcLibroNoPasa;
    const k = e && CLAVES[e.error];
    return k ? this.tx[k] : this.textoDe((e && e.error) || 'generico');
  }

  /* El primer clic enseña el aviso; el segundo (pasados 800 ms) publica */
  async alPublicar() {
    if (this.ocupado || !this.ed) return;
    if (!this.armado) {
      this.armado = true;
      this.armadoEn = performance.now();
      this.estado.textContent = '';
      this.aviso.hidden = false;
      this.aviso.textContent = poner(this.tx.rcPublicoAviso, { id: this.id.value.trim() });
      this.publicar.textContent = this.tx.rcConfirmar;
      this.publicar.setAttribute('data-armado', '1');
      return;
    }
    if (performance.now() - this.armadoEn < ESPERA_CONFIRMAR_MS) return;
    this.desarmar();
    this.ocupado = true;
    this.publicar.disabled = true;
    this.estado.textContent = this.tx.rcPublicando;
    const vida = this.vida;
    let texto = '';
    try {
      const r = await publicarLibro({
        be: this.be(), obraId: this.obraId(), edicionId: this.ed.id, libroId: this.id.value.trim(), lang: this.idiomaDe(),
        tema: this.tema.value, titulo: this.tit.value, blando: this.ed.blando
      });
      texto = r.error ? this.mensaje(r) : (r.reemplaza ? this.tx.rcReemplazado : this.tx.rcListo) + (r.sueltos ? ` ${poner(this.tx.cpSueltos, { n: r.sueltos })}` : '');
    } catch (e) {
      texto = this.tx.rcFalla;
    } finally {
      /* Pase lo que pase, los botones vuelven; y si se cerro el libro, el resultado ya no se pinta */
      if (vida === this.vida) this.ocupado = false;
    }
    if (vida !== this.vida) return;
    await this.pintar(this.ed);
    if (vida === this.vida) this.estado.textContent = texto;
  }

  async alQuitar() {
    if (this.ocupado) return;
    if (!this.armadoQuitar) { this.armadoQuitar = true; this.armadoQuitarEn = performance.now(); this.quitar.textContent = this.tx.rcQuitarSeguro; return; }
    if (performance.now() - this.armadoQuitarEn < ESPERA_CONFIRMAR_MS) return;
    this.desarmarQuitar();
    this.ocupado = true;
    const vida = this.vida;
    let texto = '';
    try {
      const r = await quitarDeRecursos({ be: this.be(), obraId: this.obraId() });
      texto = r.error ? this.mensaje(r) : this.tx.rcQuitado;
    } catch (e) {
      texto = this.tx.rcFalla;
    } finally {
      if (vida === this.vida) this.ocupado = false;
    }
    if (vida !== this.vida) return;
    await this.pintar(this.ed);
    if (vida === this.vida) this.estado.textContent = texto;
  }
}
