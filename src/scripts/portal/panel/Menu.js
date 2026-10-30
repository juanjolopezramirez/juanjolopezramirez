/* El menu del panel (Panel.astro → .panel__riel y .panel__barra).

   · DOS MODOS, como un tema claro y uno oscuro: el boton de arriba (aria-pressed: pulsado
     es Developer-Mode) cambia de modo. Con el modo cambian las secciones que se ven (las del
     otro llevan `hidden`, en el menu de la izquierda y en la barra de abajo) y el aspecto del
     panel (<html data-modo>, que terminal.css y panel.css leen). «Acceso» esta abajo en los dos.
   · El modo lo dice la direccion: panel.js llama a mostrarModo() al llegar a cada seccion.
     Pulsar el boton no cambia nada por si solo: le pide al panel que vaya a la ultima
     seccion del otro modo (`alCambiarModo`), y asi «atrás» del navegador lo deshace.
   · En el telefono el menu es el de una app: la barra de abajo trae las secciones del modo y
     «Más», que abre una hoja con el resto (el menu de la izquierda hecho hoja). La hoja se
     cierra al elegir, con Escape (y el foco vuelve a «Más») o tocando fuera; mientras esta
     abierta, la seccion de atras (`.panel__hoja`) no se puede tocar ni leer (`inert`).
   · Cada seccion aparece en dos sitios (menu y barra): `marcar()` pone la marca en los dos.
   · Nada se guarda (las pruebas prohiben el almacenamiento del navegador en el portal). */
export class Menu {
  /** @param {Element} riel
      @param {{ enfocar?: (id: string) => void, alCambiarModo?: () => void, ambito?: Element }} [opciones]
      `ambito`: lo que contiene el menu y la barra (.panel__cuerpo); si falta, solo el riel. */
  constructor(riel, opciones = {}) {
    this.riel = riel;
    this.ambito = opciones.ambito || riel;
    this.enfocar = typeof opciones.enfocar === 'function' ? opciones.enfocar : () => {};
    this.alCambiarModo = typeof opciones.alCambiarModo === 'function' ? opciones.alCambiarModo : () => {};
    this.botonModo = riel.querySelector('[data-modo-boton]');
    this.voz = riel.querySelector('[data-modo-voz]');
    this.modo = '';
    this.ambito.addEventListener('click', (e) => this.alClic(e));
    this.ambito.addEventListener('keydown', (e) => this.alTecla(e));
    /* Al pasar a la pantalla grande (una tableta que se gira) la hoja deja de existir: si
       seguia abierta, `.panel__hoja` se quedaria `inert` y la seccion, muerta. */
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) this.abrirEnTelefono(false); });
  }

  /* «Más» (la barra se quita del DOM para un miembro: se busca en el momento) */
  get boton() { return this.ambito.querySelector('[data-menu-boton]'); }

  /* Quien tiene una sola seccion (un miembro) no necesita ni el boton de modos ni la barra:
     el menu se le ve siempre, con su unica opcion. */
  solo(es) {
    this.riel.classList.toggle('is-solo', es);
  }

  /* Pone el panel en `modo` ('self' | 'dev'): las secciones del menu y de la barra, el boton y el
     aspecto. `anunciar`: decirlo en voz alta (cuando lo pidio el boton, no al llegar). */
  mostrarModo(modo, anunciar = false) {
    if (!modo || modo === this.modo) return;
    this.modo = modo;
    document.documentElement.dataset.modo = modo;
    this.ambito.querySelectorAll('[data-modo-grupo]').forEach((g) => { g.hidden = g.dataset.modoGrupo !== modo; });
    if (this.botonModo) this.botonModo.setAttribute('aria-pressed', String(modo === 'dev'));
    /* Para el fondo: de dia no se mueve nada (fondo.js lo escucha) */
    document.dispatchEvent(new CustomEvent('alef:modo', { detail: { modo } }));
    if (anunciar && this.voz && this.botonModo) {
      this.voz.textContent = '';
      const texto = modo === 'dev' ? this.botonModo.dataset.avisoDev : this.botonModo.dataset.avisoSelf;
      setTimeout(() => { this.voz.textContent = texto || ''; }, 30);
    }
  }

  /* Marca la seccion en que estas, en el menu y en la barra. */
  marcar(id) {
    let enBarra = false;
    this.ambito.querySelectorAll('[data-nav]').forEach((enlace) => {
      /* «true» y no «page»: site.js usa a[aria-current="page"] para el aviso «Ya estas aqui» del menu
         del sitio, y esto es la seccion de DENTRO de la pagina, no otra pagina. */
      if (enlace.dataset.nav === id) {
        enlace.setAttribute('aria-current', 'true');
        if (enlace.closest('[data-barra]') && !enlace.closest('[hidden]')) enBarra = true;
      } else enlace.removeAttribute('aria-current');
    });
    /* Si la seccion no tiene boton en la barra (Compartir, Configuración), «Más» se ve activo */
    const mas = this.boton;
    if (mas) mas.classList.toggle('is-activo', !enBarra);
    /* Llegar a una seccion (tocandola, o con «atrás») cierra la hoja del telefono. */
    this.abrirEnTelefono(false);
  }

  get abiertoEnTelefono() { return this.ambito.classList.contains('is-menu-abierto'); }

  /* La hoja de «Más». Abierta, lo de atras queda `inert` (ni se toca ni se lee); se suelta SIEMPRE
     por aqui, asi que cualquier forma de cerrarla (elegir, Escape, velo, «atrás», salir) lo suelta. */
  abrirEnTelefono(abierto) {
    if (abierto === this.abiertoEnTelefono) return;
    this.ambito.classList.toggle('is-menu-abierto', abierto);
    const boton = this.boton;
    if (boton) boton.setAttribute('aria-expanded', String(abierto));
    const hoja = this.ambito.querySelector('.panel__hoja');
    if (hoja) hoja.inert = abierto;
  }

  alClic(e) {
    const el = e.target.closest ? e.target.closest('[data-modo-boton], [data-menu-boton], [data-nav], [data-velo]') : null;
    if (!el || !this.ambito.contains(el)) return;
    if (el.hasAttribute('data-modo-boton')) { this.alCambiarModo(); return; }
    if (el.hasAttribute('data-velo')) { this.cerrarYVolver(); return; }
    if (el.hasAttribute('data-menu-boton')) {
      const abrir = !this.abiertoEnTelefono;
      this.abrirEnTelefono(abrir);
      /* Abierta la hoja, el foco va a su primera opcion (si no, el lector no sabe que se abrio) */
      if (abrir) {
        const primera = [...this.riel.querySelectorAll('.panel__menu [data-nav]')].find((enlace) => enlace.offsetParent !== null);
        if (primera) primera.focus();
      }
      return;
    }
    /* Elegir otra seccion cambia la direccion y el panel hace el resto (marcar() cierra la hoja
       y el foco va a su titulo). Elegir la que YA esta abierta no cambia nada: aqui se cierra
       la hoja y se lleva el foco, que si no se quedaria en un enlace escondido. */
    if (el.getAttribute('aria-current') === 'true') {
      e.preventDefault();
      this.abrirEnTelefono(false);
      this.enfocar(el.dataset.nav);
    }
  }

  alTecla(e) {
    if (e.key !== 'Escape' || !this.abiertoEnTelefono) return;
    this.cerrarYVolver();
  }

  /* Cierra la hoja y devuelve el foco a «Más» (en la pantalla grande el boton no se ve: el foco
     no se manda a un boton escondido) */
  cerrarYVolver() {
    this.abrirEnTelefono(false);
    const boton = this.boton;
    if (boton && boton.offsetParent !== null) boton.focus();
  }

  olvidar() {
    this.abrirEnTelefono(false);
    this.modo = '';
    delete document.documentElement.dataset.modo;
  }
}
