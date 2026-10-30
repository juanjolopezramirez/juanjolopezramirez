/* LAS ANIMACIONES DE «BRAND ASSETS» (la ficha de una animacion; Marca.js la carga la primera vez
   que se abre una: es un modulo aparte para que quien solo baja logos no lo cargue).

   Aqui se elige la forma de la pantalla, la calidad, cuanto dura y si lleva sonido, se ve un cuadro
   de muestra y se hace el video (animacion/video.js hace el trabajo). Mientras se hace:
     · todo lo elegido se bloquea y aparece «Cancelar» (el foco se va a el);
     · una barra de avance (<progress>) y una frase que cambia solo en cada cuarto (un lector de
       pantalla no tiene que leer cada cuadro);
     · «Deja esta pestaña abierta».
   Al terminar el archivo se baja solo y se dice cuanto pesa. Nada se guarda ni se sube. */
import { ANIMACIONES, FORMATOS, CALIDADES, DURACIONES } from '../../../../data/portal/animaciones.js';
import { capacidades, estimarMB, exportarVideo, pintarFotograma } from '../../animacion/video.js';

const VISTA_LADO = 560;          // el lado mas largo de la muestra, en px
const VISTA_SEGUNDOS = 3.1;      // el cuadro de muestra: cuando la letra ya casi esta entera

export class MarcaVideo {
  /** @param {import('./Marca.js').Marca} marca */
  constructor(marca) {
    this.marca = marca;
    this.tx = (marca.tx && marca.tx.video) || {};
    const v = marca.caja.querySelector('[data-marca-video]');
    this.vista = v;
    this.form = v.querySelector('[data-video-form]');
    this.lienzo = v.querySelector('[data-video-vista]');
    this.estado = v.querySelector('[data-video-estado]');
    this.avance = v.querySelector('[data-video-progreso]');
    this.hacerBoton = v.querySelector('[data-video-hacer]');
    this.cancelarBoton = v.querySelector('[data-video-cancelar]');
    this.actual = null;
    this.caps = null;
    this.control = null;         // el AbortController mientras se hace un video
    this.turnoVista = 0;
    this.claveAvance = '';
    this.form.addEventListener('change', (e) => { this.refrescar(); if (e.target.name === 'pantalla') this.pintarVista(); });
    this.form.addEventListener('submit', (e) => { e.preventDefault(); this.hacer(); });
    this.cancelarBoton.addEventListener('click', () => this.cancelarAhora());
  }

  get ocupado() { return !!this.control; }

  /* «Cancelar»: contesta AL INSTANTE («Cancelando…»), y no hace caso a una pulsacion repetida ni a
     la que llega justo al empezar (una tecla Enter sostenida pulsaria «Cancelar» recien aparecido). */
  cancelarAhora() {
    if (!this.control || this.cancelando || Date.now() - this.inicio < 400) return;
    this.cancelando = true;
    this.cancelarBoton.setAttribute('aria-busy', 'true');
    this.estado.textContent = this.tx.cancelando || '';
    this.control.abort();
  }

  /* ---- Abrir una animacion ---------------------------------------------------- */
  async abrir(id) {
    const animacion = ANIMACIONES.find((a) => a.id === id);
    if (!animacion) return;
    this.actual = animacion;
    this.form.reset();
    this.limpiarMensajes();
    this.marca.ponerNombre(this.vista.querySelector('[data-video-titulo]'), animacion.nombre);
    this.vista.querySelector('[data-video-linea]').textContent = animacion.linea;
    this.marca.lista.hidden = true;
    this.vista.hidden = false;
    this.vista.querySelector('[data-video-titulo]').focus();
    this.refrescar();
    this.pintarVista();
    if (!this.caps) this.caps = await capacidades();
    if (this.actual === animacion) this.aplicarCapacidades();
  }

  /* Apaga lo que este navegador no puede (y lo dice con palabras, no solo apagado) */
  aplicarCapacidades() {
    const { caps, tx } = this;
    const f = this.form.elements;
    let marcada = null;
    for (const c of CALIDADES) {
      const radio = [...f.calidad].find((r) => r.value === c.id);
      if (!radio) continue;
      const puede = !!(caps.video && caps.calidades[c.id]);
      radio.disabled = !puede;
      this.form.querySelector(`[data-video-calidad-nota="${c.id}"]`).textContent = puede ? '' : tx.noPuede;
      if (puede && !marcada) marcada = radio;
    }
    const elegida = [...f.calidad].find((r) => r.checked);
    if ((!elegida || elegida.disabled) && marcada) marcada.checked = true;
    if (!caps.audio) f.sonido.checked = false;
    f.sonido.disabled = !caps.audio;
    this.form.querySelector('[data-video-nota-sonido]').hidden = !!caps.audio;
    this.hacerBoton.disabled = !caps.video;
    if (!caps.video) this.mostrar(this.vista.querySelector('[data-video-error]'), tx.sinSoporte);
    this.refrescar();
  }

  /* Lo que se pidio */
  opciones() {
    const f = this.form.elements;
    const formato = FORMATOS.find((x) => x.id === f.pantalla.value) || FORMATOS[0];
    const calidad = CALIDADES.find((x) => x.id === f.calidad.value) || CALIDADES[1];
    const n = Number(f.duracion.value);
    return { formato, calidad, duracion: DURACIONES.includes(n) ? n : 6, conSonido: f.sonido.checked && !f.sonido.disabled };
  }

  refrescar() {
    const o = this.opciones();
    this.vista.querySelector('[data-video-peso]').textContent = (this.tx.peso || '').replace('{mb}', estimarMB(o.calidad, o.duracion, o.conSonido).toFixed(1));
    if (!this.ocupado) this.estado.textContent = '';
  }

  /* El cuadro de muestra (a la mitad de la animacion) en el lienzo de la ficha */
  async pintarVista() {
    if (!this.actual) return;
    const turno = ++this.turnoVista;
    const { formato } = this.opciones();
    try {
      await pintarFotograma({
        animacion: this.actual, formato, lienzo: this.lienzo,
        ancho: Math.round(formato.ancho * VISTA_LADO / Math.max(formato.ancho, formato.alto)), segundos: VISTA_SEGUNDOS,
        vigente: () => turno === this.turnoVista
      });
    } catch (e) { /* sin muestra: lo demas sigue sirviendo */ }
  }

  /* ---- Hacer el video ------------------------------------------------------------ */
  async hacer() {
    if (this.ocupado || !this.actual) return;
    const o = this.opciones();
    const animacion = this.actual;
    this.limpiarMensajes();
    this.control = new AbortController();
    this.inicio = Date.now();
    this.cancelando = false;
    this.claveAvance = '';
    this.bloquear(true);
    try {
      const blob = await exportarVideo({
        animacion, formato: o.formato, calidad: o.calidad, duracion: o.duracion, conSonido: o.conSonido,
        senal: this.control.signal, alProgreso: (p) => this.alProgreso(p)
      });
      if (this.actual !== animacion) return;                // se cerro la ficha mientras tanto
      const nombre = `${animacion.id}-${o.formato.id}-${o.calidad.id === '2160' ? '4k' : o.calidad.id + 'p'}-${o.duracion}s${o.conSonido ? '' : '-sin-sonido'}.mp4`;
      this.marca.entregar(blob, nombre);
      this.estado.textContent = (this.tx.listo || '').replace('{archivo}', nombre).replace('{mb}', (blob.size / 1_048_576).toFixed(1));
    } catch (e) {
      if (this.actual !== animacion) return;
      if (e && e.message === 'cancelado') this.estado.textContent = this.tx.cancelado || '';
      else this.mostrar(this.vista.querySelector('[data-video-error]'), (this.tx.errores || {})[e && (e.message === 'lienzo' || e.message === 'atascado') ? e.message : 'video']);
    } finally {
      this.control = null;
      this.cancelando = false;
      this.cancelarBoton.removeAttribute('aria-busy');
      this.bloquear(false);
    }
  }

  /* Mientras se hace: bloquea las opciones, enseña «Cancelar», el avance y el aviso de la pestaña */
  bloquear(on) {
    this.form.querySelectorAll('[data-video-grupo]').forEach((g) => { if (g.tagName === 'FIELDSET') g.disabled = on; });
    const sonido = this.form.elements.sonido;
    sonido.disabled = on || !(this.caps && this.caps.audio);
    this.hacerBoton.hidden = on;
    this.cancelarBoton.hidden = !on;
    this.avance.hidden = !on;
    this.avance.value = 0;
    this.vista.querySelector('[data-video-mantener]').hidden = !on;
    /* el boton que se pulso se esconde: el foco va a «Cancelar», y al terminar vuelve a «Hacer» */
    if (on) this.cancelarBoton.focus(); else if (this.vista.contains(document.activeElement) || document.activeElement === document.body) this.hacerBoton.focus();
  }

  alProgreso({ fase, hecho, total }) {
    const parte = { video: 0.9 * (hecho / total), sonido: 0.93, archivo: 0.97 }[fase] || 0;
    this.avance.value = parte;
    /* La frase cambia en cada cuarto del video y en cada fase: un lector de pantalla no lee cada cuadro */
    const clave = fase === 'video' ? `video-${Math.floor((hecho / total) * 4)}` : fase;
    if (clave === this.claveAvance) return;
    this.claveAvance = clave;
    this.estado.textContent = ((this.tx.progreso || {})[fase] || '').replace('{hecho}', hecho).replace('{total}', total);
  }

  /* ---- Avisos y cierre -------------------------------------------------------------- */
  mostrar(el, texto) {
    el.textContent = '';
    el.hidden = false;
    setTimeout(() => { el.textContent = texto || ''; }, 30);
  }

  limpiarMensajes() {
    const e = this.vista.querySelector('[data-video-error]');
    e.hidden = true; e.textContent = '';
    this.estado.textContent = '';
  }

  /* Al volver a la lista: si se estaba haciendo un video, se cancela */
  cerrar() {
    if (this.control) this.control.abort();
    this.turnoVista++;
    this.actual = null;
    this.vista.hidden = true;
  }

  /* Al salir del portal: igual, y todo se olvida */
  olvidar() { this.cerrar(); this.limpiarMensajes(); }
}

