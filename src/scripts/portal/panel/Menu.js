/* El menu del panel (Panel.astro → .panel__riel).

   · DOS MODOS, como un tema claro y uno oscuro: el boton de arriba (aria-pressed: pulsado
     es Developer-Mode) cambia de modo. Con el modo cambian las secciones que se ven en la
     barra (las del otro llevan `hidden`) y el aspecto del panel (<html data-modo>, que
     terminal.css y panel.css leen). «Acceso» esta abajo en los dos.
   · El modo lo dice la direccion: panel.js llama a mostrarModo() al llegar a cada seccion.
     Pulsar el boton no cambia nada por si solo: le pide al panel que vaya a la ultima
     seccion del otro modo (`alCambiarModo`), y asi «atrás» del navegador lo deshace.
   · En el telefono, las secciones van detras de un boton «Menú · <seccion>» que se cierra
     al elegir o con Escape (y el foco vuelve al boton).
   · Nada se guarda (las pruebas prohiben el almacenamiento del navegador en el portal). */
export class Menu {
  /** @param {Element} riel
      @param {{ enfocar?: (id: string) => void, alCambiarModo?: () => void }} [opciones] */
  constructor(riel, opciones = {}) {
    this.riel = riel;
    this.enfocar = typeof opciones.enfocar === 'function' ? opciones.enfocar : () => {};
    this.alCambiarModo = typeof opciones.alCambiarModo === 'function' ? opciones.alCambiarModo : () => {};
    this.boton = riel.querySelector('[data-menu-boton]');
    this.actual = riel.querySelector('[data-menu-actual]');
    this.botonModo = riel.querySelector('[data-modo-boton]');
    this.voz = riel.querySelector('[data-modo-voz]');
    this.modo = '';
    riel.addEventListener('click', (e) => this.alClic(e));
    riel.addEventListener('keydown', (e) => this.alTecla(e));
  }

  /* Quien tiene una sola seccion (un miembro) no necesita ni el boton «Menú» ni el de modos. */
  solo(es) {
    this.riel.classList.toggle('is-solo', es);
    if (this.boton) this.boton.hidden = es;
  }

  /* Pone el panel en `modo` ('self' | 'dev'): las secciones de la barra, el boton y el
     aspecto. `anunciar`: decirlo en voz alta (cuando lo pidio el boton, no al llegar). */
  mostrarModo(modo, anunciar = false) {
    if (!modo || modo === this.modo) return;
    this.modo = modo;
    document.documentElement.dataset.modo = modo;
    this.riel.querySelectorAll('[data-modo-grupo]').forEach((g) => { g.hidden = g.dataset.modoGrupo !== modo; });
    if (this.botonModo) this.botonModo.setAttribute('aria-pressed', String(modo === 'dev'));
    /* Para el fondo: de dia no se mueve nada (fondo.js lo escucha) */
    document.dispatchEvent(new CustomEvent('alef:modo', { detail: { modo } }));
    if (anunciar && this.voz && this.botonModo) {
      this.voz.textContent = '';
      const texto = modo === 'dev' ? this.botonModo.dataset.avisoDev : this.botonModo.dataset.avisoSelf;
      setTimeout(() => { this.voz.textContent = texto || ''; }, 30);
    }
  }

  /* Marca la seccion en que estas. */
  marcar(id, titulo) {
    this.riel.querySelectorAll('[data-nav]').forEach((enlace) => {
      /* «true» y no «page»: site.js usa a[aria-current="page"] para el aviso «Ya estas aqui» del menu
         del sitio, y esto es la seccion de DENTRO de la pagina, no otra pagina. */
      if (enlace.dataset.nav === id) enlace.setAttribute('aria-current', 'true');
      else enlace.removeAttribute('aria-current');
    });
    if (this.actual) this.actual.textContent = titulo || '';
    /* Llegar a una seccion (tocandola, o con «atrás») cierra el menu del telefono. */
    this.abrirEnTelefono(false);
  }

  get abiertoEnTelefono() { return this.riel.classList.contains('is-menu-abierto'); }

  abrirEnTelefono(abierto) {
    this.riel.classList.toggle('is-menu-abierto', abierto);
    if (this.boton) this.boton.setAttribute('aria-expanded', String(abierto));
  }

  alClic(e) {
    const el = e.target.closest ? e.target.closest('[data-modo-boton], [data-menu-boton], [data-nav]') : null;
    if (!el || !this.riel.contains(el)) return;
    if (el.hasAttribute('data-modo-boton')) { this.alCambiarModo(); return; }
    if (el.hasAttribute('data-menu-boton')) { this.abrirEnTelefono(!this.abiertoEnTelefono); return; }
    /* Elegir otra seccion cambia la direccion y el panel hace el resto (marcar() cierra el menu
       y el foco va a su titulo). Elegir la que YA esta abierta no cambia nada: aqui se cierra
       el menu y se lleva el foco, que si no se quedaria en un enlace escondido. */
    if (el.getAttribute('aria-current') === 'true') {
      e.preventDefault();
      this.abrirEnTelefono(false);
      this.enfocar(el.dataset.nav);
    }
  }

  alTecla(e) {
    if (e.key !== 'Escape' || !this.abiertoEnTelefono) return;
    this.abrirEnTelefono(false);
    /* (en la pantalla grande el boton no se ve: el foco no se manda a un boton escondido) */
    if (this.boton && this.boton.offsetParent !== null) this.boton.focus();
  }

  olvidar() {
    this.abrirEnTelefono(false);
    if (this.actual) this.actual.textContent = '';
    this.modo = '';
    delete document.documentElement.dataset.modo;
  }
}
