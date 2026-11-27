/* LA VENTANA PARA RECORTAR una imagen a una forma fija (el lomo del Taller, el lomo de estanteria de Recursos).

   recortarImagen({ fuente, w, h, aspecto, salida, recorte?, estilo?, rellenar? })
     → { modo: 'recortar', recorte } | { modo: 'rellenar' } | null (cancelar)

   `fuente`: lo que se dibuja (una imagen o un lienzo de `w` x `h` px, ya de pie). `aspecto`: ancho / alto del marco.
   `salida`: { ancho, alto } del PNG que se hara (para decir su medida y avisar si se vera borroso). `estilo`: 'taller'
   (los botones del Taller) o 'panel'. Las cuentas son de contenido/taller/Recorte.js; aqui solo se dibuja y se escucha.

   Se mueve arrastrando (raton, dedo o lapiz: Pointer Events), se acerca con la rueda, con dos dedos o con + y −; con el
   foco en el marco, las flechas lo mueven (Mayus: diez veces mas). Es un <dialog> modal: el foco no sale, Escape cancela.
   El lienzo se suelta al cerrar (ancho 0): una imagen grande no queda ocupando memoria. Todo nodo por nodo, sin HTML. */
import { ampliacionDe, escalarRecorte, limitarRecorte, moverRecorte, recorteInicial, seVeBorrosa, zoomDe } from '../../../contenido/taller/Recorte.js';

const PASO = 0.01;               // una flecha: 1 % de la imagen
const PASO_ZOOM = 1.15;
const LADO_VISTA = 1600;         // la imagen se pinta en la ventana con este lado como mucho

let textos = null;
function tx() {
  if (textos) return textos;
  try { textos = JSON.parse(document.getElementById('portal-textos').textContent).panel.recorte || {}; } catch (e) { textos = {}; }
  return textos;
}
const poner = (s, o) => Object.entries(o).reduce((texto, [k, v]) => texto.replaceAll(`{${k}}`, String(v)), String(s || ''));
const pct = (x) => Math.round(x * 100);

function h(tag, attrs = {}, hijos = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'texto') e.textContent = v;
    else if (k === 'clase') e.className = v;
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of [].concat(hijos)) if (c) e.append(c);
  return e;
}

let cuenta = 0;

export function recortarImagen(o) {
  return new Promise((listo) => { new Recortador(o, listo).abrir(); });
}

class Recortador {
  constructor({ fuente, w, h: alto, aspecto, salida, recorte, estilo = 'panel', rellenar = true }, listo) {
    this.img = { w, h: alto };
    Object.assign(this, { fuente, aspecto, salida, estilo, conRellenar: rellenar, listo });
    this.r = limitarRecorte(recorte || recorteInicial(this.img, aspecto), this.img, aspecto) || recorteInicial(this.img, aspecto);
    this.dedos = new Map();
    this.n = ++cuenta;
  }

  armar() {
    const t = tx(), n = this.n, taller = this.estilo === 'taller';
    const boton = (texto, fuerte) => h('button', { type: 'button', texto,
      clase: taller ? `tal-btn${fuerte ? ' tal-btn--fuerte' : ''}` : `portal__boton${fuerte ? '' : ' portal__boton--suave'}` });
    this.lienzo = h('canvas', { clase: 'rec__lienzo', 'aria-hidden': 'true' });
    this.marco = h('div', { clase: 'rec__marco', tabindex: '0', role: 'group', 'aria-roledescription': t.marcoRol || 'marco',
      'aria-label': t.marco, 'aria-describedby': `rec-teclas-${n}` });
    this.foto = h('div', { clase: 'rec__foto' }, [this.lienzo, this.marco]);
    this.escena = h('div', { clase: 'rec__escena' }, [this.foto]);
    this.bMenos = h('button', { type: 'button', clase: 'rec__zoom-btn', 'aria-label': t.alejar, title: t.alejar, texto: '−' });
    this.bMas = h('button', { type: 'button', clase: 'rec__zoom-btn', 'aria-label': t.acercar, title: t.acercar, texto: '+' });
    this.zoom = h('span', { clase: 'rec__zoom', 'aria-hidden': 'true' });
    this.medida = h('p', { clase: 'rec__medida' });
    this.aviso = h('p', { clase: 'rec__aviso', hidden: true, texto: t.borrosa });
    this.voz = h('p', { clase: 'soltar-voz', role: 'status' });
    this.bUsar = boton(t.usar, true);
    this.bRellenar = this.conRellenar ? boton(t.rellenar, false) : null;
    this.bCancelar = boton(t.cancelar, false);
    this.dialogo = h('dialog', { clase: `rec rec--${taller ? 'taller' : 'panel'}`, 'aria-labelledby': `rec-t-${n}`, 'aria-describedby': `rec-d-${n}` }, [
      h('h2', { clase: 'rec__titulo', id: `rec-t-${n}`, texto: t.titulo }),
      h('p', { clase: 'rec__texto', id: `rec-d-${n}`, texto: t.ayuda }),
      this.escena,
      h('div', { clase: 'rec__barra' }, [
        h('div', { clase: 'rec__zooms' }, [this.bMenos, this.zoom, this.bMas]),
        this.medida
      ]),
      this.aviso,
      h('p', { clase: 'soltar-voz', id: `rec-teclas-${n}`, texto: t.teclas }),
      this.voz,
      h('div', { clase: 'rec__botones' }, [this.bCancelar, this.bRellenar, this.bUsar])
    ]);
  }

  abrir() {
    this.armar();
    /* Dentro de la mesa del Taller si esta abierta (lo demas esta inerte), si no en el cuerpo */
    (document.querySelector('[data-tal-mesa]:not([hidden])') || document.body).append(this.dialogo);
    this.escuchar();
    this.dialogo.showModal();
    this.medir();
    this.pintar(false);
    this.marco.focus();
  }

  cerrar(valor) {
    if (this.cerrado) return;
    this.cerrado = true;
    if (this.obs) this.obs.disconnect();
    if (this.dialogo.open) this.dialogo.close();
    this.lienzo.width = 0;
    this.lienzo.height = 0;
    this.dialogo.remove();
    this.fuente = null;
    this.listo(valor);
  }

  escuchar() {
    const d = this.dialogo;
    d.addEventListener('cancel', (e) => { e.preventDefault(); this.cerrar(null); });
    /* Lo que se toca aqui no es «tocar fuera» para lo de atras: el «Lomo ▾» de la cinta se cierra con un pointerdown en el
       documento, y con el se perderian el estado y el boton al que vuelve el foco */
    d.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.bCancelar.addEventListener('click', () => this.cerrar(null));
    this.bUsar.addEventListener('click', () => this.cerrar({ modo: 'recortar', recorte: { ...this.r } }));
    if (this.bRellenar) this.bRellenar.addEventListener('click', () => this.cerrar({ modo: 'rellenar' }));
    this.bMas.addEventListener('click', () => this.escalar(PASO_ZOOM));
    this.bMenos.addEventListener('click', () => this.escalar(1 / PASO_ZOOM));
    this.marco.addEventListener('keydown', (e) => this.teclas(e));
    this.foto.addEventListener('pointerdown', (e) => this.bajar(e));
    this.foto.addEventListener('pointermove', (e) => this.mover(e));
    for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) this.foto.addEventListener(tipo, (e) => this.subir(e));
    this.foto.addEventListener('wheel', (e) => {
      e.preventDefault();
      /* Segun cuanto gira: un panel tactil manda saltos chicos y una rueda, uno de ~100 (como mucho un paso entero) */
      const giro = Math.max(-1, Math.min(1, -(e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY) / 100));
      if (giro) this.escalar(Math.pow(PASO_ZOOM, giro), this.puntoDe(e));
    }, { passive: false });
    this.obs = new ResizeObserver(() => { this.medir(); this.pintar(false); });
    this.obs.observe(this.escena);
  }

  /* La imagen entera dentro de la escena, con su forma; el lienzo, a la medida en pantalla (con su densidad) */
  medir() {
    const ew = this.escena.clientWidth, eh = this.escena.clientHeight;
    if (!(ew > 0 && eh > 0)) return;
    const k = Math.min(ew / this.img.w, eh / this.img.h);
    const fw = Math.max(1, Math.round(this.img.w * k)), fh = Math.max(1, Math.round(this.img.h * k));
    if (fw === this.fw && fh === this.fh) return;
    this.fw = fw; this.fh = fh;
    this.foto.style.width = `${fw}px`;
    this.foto.style.height = `${fh}px`;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const q = Math.min(1, LADO_VISTA / Math.max(fw * dpr, fh * dpr));
    this.lienzo.width = Math.max(1, Math.round(fw * dpr * q));
    this.lienzo.height = Math.max(1, Math.round(fh * dpr * q));
    const g = this.lienzo.getContext('2d');
    g.imageSmoothingQuality = 'high';
    if (this.fuente) g.drawImage(this.fuente, 0, 0, this.lienzo.width, this.lienzo.height);
  }

  pintar(decir = true) {
    const r = this.r, t = tx(), s = this.marco.style;
    s.left = `${r.x * 100}%`; s.top = `${r.y * 100}%`; s.width = `${r.w * 100}%`; s.height = `${r.h * 100}%`;
    const z = zoomDe(r, this.img, this.aspecto);
    this.zoom.textContent = `${pct(z)} %`;
    this.bMas.disabled = Math.abs(escalarRecorte(r, PASO_ZOOM, this.img, this.aspecto).w - r.w) < 1e-9;
    this.bMenos.disabled = z <= 1 + 1e-9;
    this.medida.textContent = poner(t.medida, { w: this.salida.ancho, h: this.salida.alto });
    const borrosa = seVeBorrosa(r, this.img, this.salida);
    if (this.aviso.hidden === borrosa) {
      this.aviso.hidden = !borrosa;
      this.marco.classList.toggle('rec__marco--borrosa', borrosa);
      if (decir && borrosa) this.decir(t.borrosa);
    }
    this.dialogo.dataset.ampliacion = String(Math.round(ampliacionDe(r, this.img, this.salida) * 100) / 100);
    if (decir) {
      clearTimeout(this.relojVoz);
      this.relojVoz = setTimeout(() => this.decir(poner(t.donde, { x: pct(r.x + r.w / 2), y: pct(r.y + r.h / 2), z: pct(z) })), 450);
    }
  }

  decir(texto) {
    this.voz.textContent = '';
    requestAnimationFrame(() => { this.voz.textContent = texto; });
  }

  poner(r) {
    if (!r) return;
    this.r = r;
    this.pintar();
  }

  escalar(factor, centro) { this.poner(escalarRecorte(this.r, factor, this.img, this.aspecto, centro)); }

  teclas(e) {
    /* Ctrl/Cmd/Alt son del navegador (Ctrl + y Ctrl − agrandan la pagina): no se tocan */
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.shiftKey ? 10 : 1;
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (d) {
      e.preventDefault();
      this.poner(moverRecorte(this.r, d[0] * PASO * k, d[1] * PASO * k, this.img, this.aspecto));
      return;
    }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); this.escalar(PASO_ZOOM); return; }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); this.escalar(1 / PASO_ZOOM); }
  }

  /* Un punto de la pantalla en partes de la imagen */
  puntoDe(e) {
    const b = this.foto.getBoundingClientRect();
    return { x: (e.clientX - b.left) / (b.width || 1), y: (e.clientY - b.top) / (b.height || 1) };
  }

  bajar(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    this.foto.setPointerCapture(e.pointerId);
    this.dedos.set(e.pointerId, this.puntoDe(e));
    this.foto.classList.add('rec__foto--moviendo');
    /* Un toque fuera del marco lo lleva ahi (centrado en el dedo) */
    if (this.dedos.size === 1 && !this.marco.contains(e.target)) {
      const p = this.puntoDe(e);
      this.poner(moverRecorte(this.r, p.x - (this.r.x + this.r.w / 2), p.y - (this.r.y + this.r.h / 2), this.img, this.aspecto));
    }
    this.marco.focus({ preventScroll: true });
  }

  mover(e) {
    if (!this.dedos.has(e.pointerId)) return;
    const antes = [...this.dedos.values()];
    const ahora = this.puntoDe(e);
    const previo = this.dedos.get(e.pointerId);
    this.dedos.set(e.pointerId, ahora);
    if (this.dedos.size === 1) {
      this.poner(moverRecorte(this.r, ahora.x - previo.x, ahora.y - previo.y, this.img, this.aspecto));
      return;
    }
    /* Dos dedos: acercar o alejar segun cambia la distancia, quieto el punto medio */
    const despues = [...this.dedos.values()];
    const dist = (l) => Math.hypot((l[0].x - l[1].x) * this.fw, (l[0].y - l[1].y) * this.fh);
    const a = dist(antes), b = dist(despues);
    if (a > 0 && b > 0) this.escalar(b / a, { x: (despues[0].x + despues[1].x) / 2, y: (despues[0].y + despues[1].y) / 2 });
  }

  subir(e) {
    this.dedos.delete(e.pointerId);
    if (!this.dedos.size) this.foto.classList.remove('rec__foto--moviendo');
  }
}
