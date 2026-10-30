/* BRAND ASSETS (Developer-Mode → «Brand Assets»; Panel.astro → dev/EditorMarca.astro).

   La lista de logos e iconos de sus proyectos (data/portal/marca.js) ya viene armada en la
   pagina. Aqui pasa lo demas: al elegir uno se abre su FICHA (como queda, y sus opciones) y se
   baja en SVG o en PNG con el color, el fondo y el tamaño que se pida.

   Todo ocurre en el navegador de quien lo usa: se lee el archivo del propio sitio (o una de
   las tres letras, que vienen dentro), se pinta con las piezas puras de marca/svg.js, y el PNG
   se dibuja en un <canvas>. Nada se sube, nada se guarda (las pruebas prohiben el almacenamiento
   del navegador en el portal) y nada de HTML escrito a mano: lo de afuera entra como
   <img src="data:…">, que ademas es lo unico que la politica de seguridad deja. Un SVG que no
   pase `esSeguro` no se pinta ni se baja.

   Los errores salen JUNTO a lo que los causo: el del color, bajo su campo; el de bajar, junto
   al boton; solo el de «no pude abrir esta pieza» va arriba de la seccion. */
import { Seccion } from '../Seccion.js';
import { ACTIVOS, CATEGORIAS, TONOS, FONDOS, TAMANO_MAX } from '../../../../data/portal/marca.js';
import {
  colorValido, comoDireccion, conFondo, conMedida, esSeguro, leerCaja, medidasPara, mejorFondo,
  nombreDeArchivo, normalizarColor, recolorar
} from '../../marca/svg.js';
import logoAlef from '../../../../assets/alef/logo.svg?raw';
import memSvg from '../../../../assets/alef/mem.svg?raw';
import tavSvg from '../../../../assets/alef/tav.svg?raw';

const LETRAS = { logo: logoAlef, mem: memSvg, tav: tavSvg };
const MARGEN = 0.08;       // «con un poco de aire»: el 8 % del lado mas largo
const VISTA_LADO = 480;    // el lado mas largo de la vista previa, en px
const ESPERA_IMAGEN_MS = 15000;   // si el navegador no dibuja la pieza en este tiempo, es un fallo
const HEBREO = /([֐-׿]+)/;
/* La imagen de la vista cuando no hay pieza: un SVG vacio (nunca un cuadro roto) */
const VACIO = 'data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%2F%3E';

export class Marca extends Seccion {
  /** @param {Element} raiz  @param {object} ctx */
  constructor(raiz, ctx) {
    super(raiz.querySelector('[data-dev="marca"]'), ctx);
    this.raiz = raiz;
    this.tx = (ctx.p && ctx.p.marca) || {};
    this.cache = new Map();      // id → texto del SVG ya leido
    this.actual = null;          // { activo, svg, caja } de la pieza abierta
    this.abierta = null;         // el boton de la lista que la abrio (para devolverle el foco)
    this.ocupado = false;
    this.turno = 0;              // para ignorar lo que llega tarde (otra pieza ya abierta)
    if (!this.caja) return;
    this.lista = this.caja.querySelector('[data-marca-lista]');
    this.ficha = this.caja.querySelector('[data-marca-ficha]');
    this.form = this.caja.querySelector('[data-marca-form]');
    this.caja.addEventListener('click', (e) => this.alClic(e));
    /* «change» sirve para todo (radios, casilla, lista); «input» solo para el color que se escribe */
    this.form.addEventListener('change', () => this.refrescar());
    this.form.addEventListener('input', (e) => { if (e.target === this.form.elements.hex) this.refrescar(); });
    this.form.addEventListener('submit', (e) => { e.preventDefault(); this.bajar(); });
    /* Las piezas nacen apagadas (aria-disabled) hasta que este modulo carga: ya responden */
    this.caja.querySelectorAll('[data-marca-abrir]').forEach((b) => b.removeAttribute('aria-disabled'));
  }

  alClic(e) {
    const el = e.target.closest ? e.target.closest('[data-marca-abrir], [data-marca-volver]') : null;
    if (!el || !this.caja.contains(el)) return;
    if (el.hasAttribute('data-marca-volver')) { this.volver(); return; }
    this.abierta = el;
    this.abrir(el.getAttribute('data-marca-abrir'));
  }

  /* El nombre de la pieza con las letras hebreas en su idioma (un lector en español no las lee) */
  ponerNombre(el, texto) {
    el.replaceChildren(...texto.split(HEBREO).filter(Boolean).map((t) => {
      if (!HEBREO.test(t)) return document.createTextNode(t);
      const s = document.createElement('span');
      s.lang = 'he';
      s.textContent = t;
      return s;
    }));
  }

  /* ---- Leer la pieza ---------------------------------------------------------- */
  async leer(activo) {
    if (!this.cache.has(activo.id)) {
      let texto;
      if (activo.letra) texto = LETRAS[activo.letra];
      else {
        const r = await fetch(activo.ruta, { credentials: 'same-origin' });
        if (!r.ok) throw new Error('archivo');
        texto = await r.text();
      }
      if (!esSeguro(texto)) throw new Error('archivo');
      /* Las letras usan currentColor (en una <img> saldria negro): se pintan de su color */
      this.cache.set(activo.id, activo.base ? recolorar(texto, activo.base) : texto);
    }
    return this.cache.get(activo.id);
  }

  async abrir(id) {
    const activo = ACTIVOS.find((a) => a.id === id);
    if (!activo) return;
    const turno = ++this.turno;
    this.limpiar();
    const boton = this.abierta;
    if (boton) boton.setAttribute('aria-busy', 'true');
    let svg;
    try { svg = await this.leer(activo); } catch (e) { if (turno === this.turno) this.fallo('archivo'); return; } finally { if (boton) boton.removeAttribute('aria-busy'); }
    if (turno !== this.turno) return;
    const caja = leerCaja(svg);
    if (!caja) { this.fallo('imagen'); return; }
    this.actual = { activo, svg, caja };

    this.form.reset();
    this.ficha.querySelector('[data-marca-imagen]').src = VACIO;
    const fijo = activo.colores !== 'uno';
    this.ficha.querySelector('[data-marca-color]').hidden = fijo;
    this.ficha.querySelector('[data-marca-fijo]').hidden = !fijo;
    const categoria = CATEGORIAS.find((c) => c.id === activo.categoria);
    this.ponerNombre(this.ficha.querySelector('[data-marca-titulo]'), activo.nombre);
    this.ficha.querySelector('[data-marca-categoria]').textContent = categoria ? categoria.titulo : '';
    this.ficha.querySelector('[data-marca-hecho]').textContent = '';
    this.refrescar();
    this.lista.hidden = true;
    this.ficha.hidden = false;
    this.ficha.querySelector('[data-marca-titulo]').focus();
  }

  volver() {
    this.turno++;
    this.limpiar();
    this.ficha.hidden = true;
    this.lista.hidden = false;
    this.ficha.querySelector('[data-marca-imagen]').src = VACIO;
    this.actual = null;
    if (this.abierta && this.abierta.isConnected) this.abierta.focus();
  }

  /* ---- Lo que se pidio en el formulario ----------------------------------------- */
  opciones() {
    const f = this.form.elements;
    return {
      color: f.color.value,
      hex: normalizarColor(f.hex.value),
      fondo: f.fondo.value,
      margen: f.margen.checked,
      formato: f.formato.value,
      tamano: Number(f.tamano.value)
    };
  }

  /* El color con que quedara la pieza, o null si sale como esta dibujada */
  colorPedido(o) {
    if (this.actual.activo.colores !== 'uno' || o.color === 'original') return null;
    return o.color === 'otro' ? o.hex : (TONOS.find((t) => t.id === o.color) || {}).hex;
  }

  /* El SVG como se pidio (color, fondo, margen), todavia sin medida; lanza 'color' si el
     «otro color» no es un color. */
  construir(o) {
    const { svg, caja } = this.actual;
    let texto = svg;
    const color = this.colorPedido(o);
    if (color !== null) {
      if (!colorValido(color)) throw new Error('color');
      texto = recolorar(texto, color);
    }
    const fondo = (FONDOS.find((x) => x.id === o.fondo) || {}).hex || null;
    return conFondo(texto, caja, fondo, o.margen ? MARGEN : 0);
  }

  /* El aviso del «otro color», pegado a su campo: la marca (aria-invalid), el texto y su vinculo */
  marcarHex(mal) {
    const campo = this.form.elements.hex;
    const aviso = this.ficha.querySelector('[data-marca-hex-error]');
    campo.setAttribute('aria-invalid', String(mal));
    campo.setAttribute('aria-describedby', mal ? 'marca-hex-ayuda marca-hex-error' : 'marca-hex-ayuda');
    if (!mal) { aviso.hidden = true; aviso.textContent = ''; return; }
    if (aviso.hidden) this.mostrar(aviso, (this.tx.errores || {}).color);
  }

  /* Pone al dia lo que se ve: la vista previa (sobre el fondo que mejor la deja ver), el campo del
     «otro color» y el tamaño (que solo vale para PNG). */
  refrescar() {
    if (!this.actual) return;
    const o = this.opciones();
    this.ficha.querySelector('[data-marca-otro]').hidden = o.color !== 'otro';
    /* Marca el color como malo solo cuando ya parece completo (7 letras con la #): no mientras se escribe */
    this.marcarHex(o.color === 'otro' && o.hex.length >= 7 && !colorValido(o.hex));
    this.form.elements.tamano.disabled = o.formato !== 'png';
    this.ficha.querySelector('[data-marca-hecho]').textContent = '';

    /* Sin fondo, lo de atras es solo para que se lea: el de mas contraste con el color de la pieza */
    const transparente = o.fondo === 'transparente';
    const pedido = this.colorPedido(o);
    const base = pedido && colorValido(pedido) ? mejorFondo(pedido) : (this.actual.activo.base ? mejorFondo(this.actual.activo.base) : this.actual.activo.vista);
    this.ficha.querySelector('[data-marca-caja]').setAttribute('data-fondo', transparente ? base : o.fondo);
    this.ficha.querySelector('[data-marca-sinfondo]').hidden = !transparente;

    let hecho;
    try { hecho = this.construir(o); } catch (e) { if (e && e.message === 'color') return; throw e; }   // «otro color» a medias: se queda la vista de antes
    const m = medidasPara(hecho.caja, VISTA_LADO);
    const img = this.ficha.querySelector('[data-marca-imagen]');
    img.src = comoDireccion(conMedida(hecho.svg, m.w, m.h));
    img.alt = `${this.tx.vista || ''} ${this.actual.activo.nombre}`.trim();
  }

  /* ---- Bajar -------------------------------------------------------------------- */
  async bajar() {
    if (!this.actual) return;
    const hechoEl = this.ficha.querySelector('[data-marca-hecho]');
    const o = this.opciones();
    let hecho;
    try { hecho = this.construir(o); } catch (e) {
      if (e && e.message === 'color') { this.marcarHex(true); this.form.elements.hex.focus(); } else this.fallo('bajar');
      return;
    }
    const png = o.formato === 'png';
    const lado = Math.min(o.tamano, TAMANO_MAX);
    const nombre = nombreDeArchivo({
      id: this.actual.activo.id,
      color: this.colorPedido(o) === null ? 'original' : (o.color === 'otro' ? o.hex : o.color),
      fondo: o.fondo, lado, formato: o.formato
    });
    /* Una segunda pulsacion mientras trabaja no se pierde en silencio: se le dice que sigue */
    if (this.ocupado) { hechoEl.textContent = (this.tx.preparando || '').replace('{archivo}', nombre); return; }
    const turno = this.turno;
    const boton = this.form.querySelector('[data-marca-bajar]');
    this.ocupado = true;
    boton.setAttribute('aria-busy', 'true');
    this.limpiar();
    if (png) hechoEl.textContent = (this.tx.preparando || '').replace('{archivo}', nombre);
    try {
      let blob;
      if (png) {
        const m = medidasPara(hecho.caja, lado, TAMANO_MAX);
        blob = await this.aPng(conMedida(hecho.svg, m.w, m.h), m.w, m.h);
      } else {
        blob = new Blob([conMedida(hecho.svg, hecho.caja.w, hecho.caja.h)], { type: 'image/svg+xml' });
      }
      /* Si mientras tanto se abrio otra pieza (o se salio), este archivo ya no se pidio: no se baja */
      if (turno !== this.turno) { hechoEl.textContent = ''; return; }
      this.entregar(blob, nombre);
      hechoEl.textContent = '';
      setTimeout(() => { if (turno === this.turno) hechoEl.textContent = (this.tx.listo || '').replace('{archivo}', nombre); }, 30);
    } catch (e) {
      hechoEl.textContent = '';
      this.fallo(e && e.message === 'imagen' ? 'imagen' : 'bajar');
    } finally {
      this.ocupado = false;
      boton.removeAttribute('aria-busy');
    }
  }

  /* El SVG ya con su medida → un PNG, dibujado en un lienzo. Si el navegador no la dibuja en
     ESPERA_IMAGEN_MS, es un fallo (si no, «Bajar» se quedaria ocupado hasta recargar). */
  async aPng(svg, ancho, alto) {
    const img = new Image();
    img.decoding = 'async';
    await new Promise((ok, mal) => {
      const plazo = setTimeout(() => mal(new Error('imagen')), ESPERA_IMAGEN_MS);
      img.onload = () => { clearTimeout(plazo); ok(); };
      img.onerror = () => { clearTimeout(plazo); mal(new Error('imagen')); };
      img.src = comoDireccion(svg);
    });
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho; lienzo.height = alto;
    const c = lienzo.getContext('2d');
    if (!c) throw new Error('bajar');
    c.drawImage(img, 0, 0, ancho, alto);
    const blob = await new Promise((ok) => lienzo.toBlob(ok, 'image/png'));
    if (!blob) throw new Error('bajar');
    return blob;
  }

  /* Lo baja: un enlace con la direccion temporal del archivo, que se suelta enseguida. */
  entregar(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre; a.rel = 'noopener';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* Un aviso de error: se enseña y su texto entra un instante despues (un `role="alert"` que
     aparece ya lleno suele callar). */
  mostrar(el, texto) {
    el.textContent = '';
    el.hidden = false;
    setTimeout(() => { el.textContent = texto || ''; }, 30);
  }

  /* El error, junto a lo que lo causo: el de bajar, junto al boton; «no pude abrir esta pieza»
     (la lista esta a la vista), arriba de la seccion y se trae a la pantalla. */
  fallo(clave) {
    const textos = this.tx.errores || {};
    const texto = textos[clave] || textos.bajar || '';
    const junto = this.ficha && !this.ficha.hidden ? this.ficha.querySelector('[data-marca-bajar-error]') : null;
    if (junto) { this.mostrar(junto, texto); return; }
    const arriba = this.caja && this.caja.querySelector(':scope > [data-error]');
    if (!arriba) return;
    this.mostrar(arriba, texto);
    arriba.scrollIntoView({ block: 'nearest' });
  }

  limpiar() {
    super.limpiar();
    const junto = this.ficha && this.ficha.querySelector('[data-marca-bajar-error]');
    if (junto) { junto.hidden = true; junto.textContent = ''; }
  }

  /* Al salir: de vuelta a la lista (nada de esto se guarda) */
  olvidar() {
    this.turno++;
    this.actual = null;
    this.abierta = null;
    if (!this.caja) return;
    this.limpiar();
    if (this.ficha) {
      this.ficha.hidden = true;
      this.ficha.querySelector('[data-marca-imagen]').src = VACIO;
      this.ficha.querySelector('[data-marca-hecho]').textContent = '';
    }
    if (this.lista) this.lista.hidden = false;
  }
}
