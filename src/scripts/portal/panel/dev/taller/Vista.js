/* SACAR EL PDF. Una pagina aparte del sitio (/taller-hoja/) en un marco fuera de la vista: el libro se le
   manda por mensaje, se arma con el mismo estilo de la mesa, y el navegador abre su ventana de imprimir. */
const RUTA = '/taller-hoja/';
const ESPERA_MS = 20000;              // lo que puede tardar la pagina del marco en contestar

export class Vista {
  constructor(marco, { alPintar, alFallar }) {
    this.marco = marco;
    this.alPintar = alPintar;
    this.alFallar = alFallar;
    this.pendiente = null;
    this.numero = 0;
    this.alRecibir = (e) => this.recibir(e);
    window.addEventListener('message', this.alRecibir);
  }

  recibir(e) {
    if (e.source !== this.marco.contentWindow || e.origin !== window.location.origin) return;
    const m = e.data || {};
    if (m.tipo === 'lista') {
      if (this.pendiente) this.marco.contentWindow.postMessage(this.pendiente, window.location.origin);
    } else if (m.id !== this.numero) return;
    else if (m.tipo === 'pintada') { clearTimeout(this.reloj); this.pendiente = null; this.alPintar(); } else if (m.tipo === 'fallo') { clearTimeout(this.reloj); this.pendiente = null; this.alFallar(); }
  }

  /* { css, nodos, fuentes, titulo, idioma } */
  pintar(hoja) {
    this.numero += 1;
    this.pendiente = { tipo: 'pintar', id: this.numero, ...hoja };
    clearTimeout(this.reloj);
    this.reloj = setTimeout(() => { this.pendiente = null; this.alFallar(); }, ESPERA_MS);
    if (this.marco.getAttribute('src')) this.marco.contentWindow.location.replace(RUTA);
    else this.marco.src = RUTA;
  }

  imprimir() { this.marco.contentWindow.focus(); this.marco.contentWindow.print(); }

  soltar() { clearTimeout(this.reloj); window.removeEventListener('message', this.alRecibir); }
}
