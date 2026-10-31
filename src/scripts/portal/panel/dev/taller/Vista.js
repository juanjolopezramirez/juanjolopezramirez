/* LA VISTA DE PAGINAS. Es una pagina aparte del sitio (/taller-hoja/) dentro de un marco, para que
   el paginador no toque los estilos del portal. Se le manda el libro por mensaje, y para cortar
   un pintado a medias se recarga el marco: mas barato que limpiar lo que ya hizo.

   El marco debe estar a la vista mientras pagina: el paginador avanza con cada cuadro de pantalla
   y en uno escondido se detiene. Que tarde no es un fallo. */
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
      clearTimeout(this.reloj);
      if (this.pendiente) this.marco.contentWindow.postMessage(this.pendiente, window.location.origin);
    } else if (m.id !== this.numero) return;
    else if (m.tipo === 'pintada') { this.pendiente = null; this.alPintar(m.paginas, m.id); } else if (m.tipo === 'fallo') { this.pendiente = null; this.alFallar(); }
  }

  /* { css, nodos, fuentes } */
  pintar(hoja) {
    this.numero += 1;
    this.pendiente = { tipo: 'pintar', id: this.numero, ...hoja };
    clearTimeout(this.reloj);
    this.reloj = setTimeout(() => { this.pendiente = null; this.alFallar(); }, ESPERA_MS);
    if (this.marco.src) this.marco.contentWindow.location.replace(RUTA);
    else this.marco.src = RUTA;
  }

  imprimir() { this.marco.contentWindow.focus(); this.marco.contentWindow.print(); }

  soltar() { clearTimeout(this.reloj); window.removeEventListener('message', this.alRecibir); }
}
