/* VER COMO LIBRO: el libro abierto con el giro de hoja y el lomo del lector de la web. Es el mismo motor
   (StPageFlip, `page-flip`), la misma hoja que se dobla desde la esquina y los mismos estilos (hojeo.css).
   Solo mira: lo que se ve son copias de las hojas de la mesa.

   Un libro de 300 paginas no puede tener 300 copias vivas: las 300 hojas existen, vacias y del mismo tamaño,
   y solo las del pliego que se ve y las de sus vecinos tienen la copia dibujada (pliegos.js → ventana).

   Tres gustos, que se recuerdan mientras la pestaña siga abierta: tapa dura o revista, ver el lomo en perspectiva, y el
   sonido de la hoja. Con el lomo a la vista el libro se mira en 3D y ya no se arrastra con el raton: se pasa
   con las flechas, los botones y un clic a cada lado, porque la libreria mide el raton en un plano plano. */
import { cantoDe, lomoDe, ladoDe, paginasDe, pliegoDe, pliegoVecino, ventana } from './pliegos.js';

const crear = (tag, clase) => { const e = document.createElement(tag); if (clase) e.className = clase; return e; };
const LIGERA = 850, PESADA = 1300, CALMA = 300;   // lo que tarda una hoja (ms): la del lector de la web
/* La libreria se pide una vez, y solo al abrir el primer libro */
let libreria = null;
const traerLibreria = () => {
  if (!libreria) libreria = import('page-flip').catch((e) => { libreria = null; throw e; });
  return libreria;
};

/* Los tres gustos duran lo que la pestaña: el portal no guarda nada en el navegador (tools/test-portal.mjs lo exige) */
const gustos = { dura: true, lomo: false, sonido: false };
const leerPref = () => ({ ...gustos });
const guardarPref = (p) => Object.assign(gustos, { dura: p.dura !== false, lomo: p.lomo === true, sonido: p.sonido === true });

export class VistaLibro {
  constructor(caja, { mesa, tx, titulo }) {
    Object.assign(this, { caja, mesa, tx, titulo: titulo || (() => '') });
    this.escena = caja.querySelector('[data-vl-escena]');
    this.dice = caja.querySelector('[data-vl-dice]');
    this.bAnt = caja.querySelector('[data-vl-ant]');
    this.bSig = caja.querySelector('[data-vl-sig]');
    this.bTapa = caja.querySelector('[data-vl-tapa]');
    this.bLomo = caja.querySelector('[data-vl-lomo]');
    this.bSonido = caja.querySelector('[data-vl-sonido]');
    this.pref = leerPref();
    caja.tabIndex = -1;       // adonde va el foco si ningun boton sirve
    this.calma = matchMedia('(prefers-reduced-motion: reduce)');
    this.gen = 0;             // cada vez que se arma o se cierra: lo que llega tarde se descarta
    this.fb = null;
    this.libro = null;
    this.hojas = [];
    this.vivas = new Map();   // pagina → su copia dibujada
    this.pliego = 0;          // el pliego que se ve (por su primera pagina)
    this.n = 0;
    this.pesada = false;
    this.salto = null;

    caja.querySelector('[data-vl-cerrar]').addEventListener('click', () => this.cerrar());
    this.bAnt.addEventListener('click', () => this.paso(-1));
    this.bSig.addEventListener('click', () => this.paso(1));
    this.bTapa.addEventListener('click', () => { this.pref.dura = !this.pref.dura; this.cambioDePref(true); });
    this.bLomo.addEventListener('click', () => { this.pref.lomo = !this.pref.lomo; this.cambioDePref(false); });
    this.bSonido.addEventListener('click', () => { this.pref.sonido = !this.pref.sonido; this.cambioDePref(false); });
    this.pintarPref();

    /* Un clic es un clic solo si el dedo no arrastro: despues de arrastrar una hoja tambien llega «click» */
    this.escena.addEventListener('pointerdown', (e) => {
      this.abajo = { x: e.clientX, y: e.clientY };
      if (e.button === 0) this.pesarConRaton(e);
    });
    this.escena.addEventListener('click', (e) => {
      const a = this.abajo;
      this.abajo = null;
      if (!this.fb || (a && Math.hypot(e.clientX - a.x, e.clientY - a.y) > 6)) return;
      if (this.irDesdeIndice(e)) return;
      const r = this.libro.getBoundingClientRect();
      this.paso(e.clientX > r.left + r.width / 2 ? 1 : -1);
    });
    caja.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.cerrar(); return; }
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); this.paso(d); }
      else if (e.key === 'Home' && this.fb) { e.preventDefault(); this.irA(0); }
      else if (e.key === 'End' && this.fb) { e.preventDefault(); this.irA(this.n - 1); }
    });
  }

  /* ---- Abrir y cerrar ---- */
  abrir(desde) {
    this.origen = desde;
    this.mesa.soltarTodo();
    this.mesa.medir();
    this.caja.hidden = false;
    this.pintarPref();
    /* El visor es un dialogo modal: el editor que queda debajo no recibe ni el foco ni el teclado */
    this.apartados = [...(this.caja.parentElement ? this.caja.parentElement.children : [])].filter((n) => n !== this.caja && !n.inert);
    this.apartados.forEach((n) => { n.inert = true; });
    this.ac = new AbortController();
    const { signal } = this.ac;
    /* Al soltar un arrastre la libreria no avisa: se atiende aqui, donde se levanta el dedo */
    addEventListener('pointerup', () => { if (this.fb && this.fb.getState() === 'user_fold') this.aterrizar(true); }, { signal });
    addEventListener('resize', () => {
      clearTimeout(this.tResize);
      this.tResize = setTimeout(() => { if (this.fb) this.armar(this.pliego).catch(() => {}); }, 180);
    }, { signal });
    this.caja.querySelector('[data-vl-cerrar]').focus();
    this.armar(0).catch(() => { this.dice.textContent = this.tx.vlFalla || ''; });
  }

  cerrar() {
    this.gen++;
    clearTimeout(this.espera);
    clearTimeout(this.tResize);
    if (this.ac) { this.ac.abort(); this.ac = null; }
    this.desmontar();
    (this.apartados || []).forEach((n) => { n.inert = false; });
    this.apartados = null;
    this.caja.hidden = true;
    this.escena.replaceChildren();
    if (this.origen) this.origen.focus();
  }

  desmontar() {
    if (this.fb) { try { this.fb.destroy(); } catch (e) { /* ya no estaba */ } }
    this.fb = null;
    this.libro = null;
    this.hojas = [];
    this.vivas = new Map();
    this.salto = null;
  }

  /* ---- Gustos ---- */
  pintarPref() {
    const { dura, lomo, sonido } = this.pref;
    this.bTapa.setAttribute('aria-pressed', String(dura));
    this.bLomo.setAttribute('aria-pressed', String(lomo));
    this.bSonido.setAttribute('aria-pressed', String(sonido));
    this.caja.dataset.lomo = lomo ? 'si' : 'no';
    /* Con el lomo a la vista el libro esta en 3D y la esquina se mediria mal: no se levanta */
    if (this.fb) { try { this.fb.getSettings().showPageCorners = !lomo && !this.calma.matches; } catch (e) { /* sin ajuste */ } }
  }

  cambioDePref(armarOtraVez) {
    guardarPref(this.pref);
    this.pintarPref();
    if (armarOtraVez && this.fb) this.armar(this.pliego).catch(() => {});
  }

  /* ---- Armar el libro ---- */
  async armar(en) {
    const gen = ++this.gen;
    const lib = await traerLibreria();
    await new Promise((r) => requestAnimationFrame(r));       // la caja ya se pinto y tiene tamaño
    if (gen !== this.gen || this.caja.hidden || !this.mesa) return;
    this.desmontar();
    const n = this.mesa.paginas.length, p = this.mesa.px;
    this.n = n;
    if (!n) { this.escena.replaceChildren(); this.dice.textContent = ''; this.bAnt.disabled = this.bSig.disabled = true; return; }

    const blando = !this.pref.dura;
    /* El ancho de una pagina: lo que cabe a lo ancho (dos paginas) y a lo alto (la pagina y el carton que
       asoma por arriba y por abajo, que es un 1,8 % del ancho de cada lado) */
    const alto = this.escena.clientHeight - 24;
    const pw = Math.max(120, Math.floor(Math.min((this.escena.clientWidth - 96) / 2, alto / (p.H / p.W + 0.036), 720)));
    const over = Math.max(5, Math.round(pw * 0.018));
    const ph = Math.round(pw * p.H / p.W);
    this.pw = pw;
    this.esc = pw / p.W;

    const libro = crear('div', 'flip');
    libro.style.width = pw * 2 + 'px';
    libro.style.setProperty('--over', over + 'px');
    libro.style.setProperty('--lomo', lomoDe(n, pw) + 'px');
    libro.dataset.tipo = blando ? 'blando' : 'duro';
    libro.setAttribute('role', 'group');
    libro.setAttribute('aria-label', this.titulo() || this.tx.verLibro);

    const estante = crear('div', 'flip__boards');
    estante.setAttribute('aria-hidden', 'true');
    for (const lado of ['l', 'r']) {
      const b = crear('div', 'flip__board flip__board--' + lado);
      b.append(crear('span', 'flip__edges'));
      estante.append(b);
    }
    const lomo = crear('div', 'flip__lomo');
    lomo.setAttribute('aria-hidden', 'true');
    const rotulo = crear('span', 'flip__lomo-titulo');
    rotulo.textContent = this.titulo();
    lomo.append(rotulo);
    const escenario = crear('div', 'flip__stage');

    for (let i = 0; i < n; i++) {
      const h = crear('div', 'flip__page');
      if (!blando && (i === 0 || i === n - 1)) h.dataset.density = 'hard';
      this.hojas.push(h);
      escenario.append(h);
    }
    if (blando) libro.append(escenario, lomo); else libro.append(estante, escenario, lomo);
    this.escena.replaceChildren(libro);
    this.libro = libro;

    const en2 = pliegoDe(en, n);
    this.llenar([en2]);

    const fb = new lib.PageFlip(escenario, {
      width: pw, height: ph,
      size: 'stretch',
      minWidth: pw - 1, maxWidth: pw,
      minHeight: 100, maxHeight: ph,
      startPage: en2,
      showCover: true,
      usePortrait: false,
      useMouseEvents: true,
      disableFlipByClick: true,         // el clic lo atiende este archivo: tambien salta desde el contenido
      drawShadow: true,
      maxShadowOpacity: 0.55,
      flippingTime: this.calma.matches ? CALMA : LIGERA,
      showPageCorners: !this.calma.matches && !this.pref.lomo,
      mobileScrollSupport: false,
      swipeDistance: 24,
      startZIndex: 1
    });
    this.fb = fb;
    fb.loadFromHTML(this.hojas);
    /* Con `showCover` la libreria pone rigida la primera pagina (y la ultima si son pares): en una revista
       se le devuelve el papel */
    if (blando) for (const i of [0, n - 1]) { try { fb.getPage(i).setDensity('soft'); } catch (e) { /* se queda como esta */ } }
    /* Un libro ya destruido (cambio de tamaño, cierre) puede avisar tarde: no se le hace caso */
    fb.on('init', () => { if (this.fb === fb) this.asentar(fb.getCurrentPageIndex(), 0); });
    fb.on('flip', () => { if (this.fb === fb) { this.asentar(fb.getCurrentPageIndex(), 250); this.golpe(); } });
    let antes = 'read';
    fb.on('changeState', (e) => {
      if (this.fb !== fb) return;
      if (e.data === 'flipping') this.aterrizar(false);
      if (e.data === 'read' && antes !== 'read' && antes !== 'fold_corner') this.asentar(fb.getCurrentPageIndex(), 250);
      antes = e.data;
    });
    this.mostrar(en2, 0);
  }

  /* ---- Las copias vivas ---- */
  llenar(centros) {
    const quiere = ventana(centros, this.n);
    for (const [i, c] of this.vivas) {
      if (quiere.has(i)) continue;
      c.remove();
      this.vivas.delete(i);
    }
    for (const i of quiere) {
      if (this.vivas.has(i) || !this.hojas[i] || !this.mesa.paginas[i]) continue;
      const c = this.mesa.clon(this.mesa.paginas[i], this.esc);
      this.hojas[i].append(c);
      this.vivas.set(i, c);
    }
  }

  /* Llega una imagen o cambia lo medido: se vuelve a dibujar lo que se ve, sin armar el libro otra vez */
  refrescar() {
    if (this.caja.hidden || !this.fb || !this.mesa) return;
    clearTimeout(this.espera);
    this.espera = setTimeout(() => {
      if (this.caja.hidden || !this.fb || !this.mesa) return;
      if (this.mesa.paginas.length !== this.n) { this.armar(this.pliego).catch(() => {}); return; }
      for (const c of this.vivas.values()) c.remove();
      this.vivas = new Map();
      this.llenar([this.pliego]);
    }, 120);
  }

  /* Se puede pasar con el libro en reposo o con una esquina levantada por el raton (`fold_corner`): esa se
     baja sola al pasar. Mientras gira o se arrastra una hoja, no. */
  quieto() { const e = this.fb && this.fb.getState(); return e === 'read' || e === 'fold_corner'; }

  /* ---- Pasar ---- */
  paso(d) {
    const fb = this.fb;
    if (!fb || !this.quieto()) return;
    const dest = pliegoVecino(this.pliego, this.n, d);
    if (dest == null) return;
    this.llenar([this.pliego, dest]);
    this.pesar(d);
    if (d > 0) fb.flipNext('bottom'); else fb.flipPrev('bottom');
  }

  irA(p) {
    const fb = this.fb;
    if (!fb || !this.quieto()) return;
    const dest = pliegoDe(p, this.n);
    if (dest === this.pliego) return;
    this.llenar([this.pliego, dest]);
    this.salto = dest;
    this.pesada = false;
    fb.getSettings().flippingTime = this.calma.matches ? CALMA : LIGERA;
    fb.flip(dest);
  }

  /* Una fila del contenido lleva a su pagina. Las copias son inertes: la fila se busca por donde cayo el clic. */
  irDesdeIndice(e) {
    const numeros = (this.mesa.datosDeIndice || {}).numeros || {};
    const fila = [...this.libro.querySelectorAll('.indice__fila')].find((a) => {
      const r = a.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    const n = fila && numeros[(fila.getAttribute('href') || '').slice(1)];
    if (!Number.isInteger(n) || n < 1) return false;
    this.irA(n - 1);
    return true;
  }

  /* Las tapas pesan: la hoja de carton tarda mas en girar. Hay que saber ANTES de girar que hoja se mueve:
     hacia delante la de la derecha, hacia atras la de la izquierda. */
  pesar(dir) {
    const fb = this.fb;
    const i = this.pliego;
    const p = dir > 0 ? (i > 0 ? i + 1 : i) : i;
    this.pesada = [p, dir > 0 ? p + 1 : p - 1].some((x) => this.hojas[x] && this.hojas[x].dataset.density === 'hard');
    fb.getSettings().flippingTime = this.calma.matches ? CALMA : this.pesada ? PESADA : LIGERA;
  }

  /* Con raton, la libreria decide el sentido por el lado donde se agarra: aqui se pesa con la misma regla */
  pesarConRaton(e) {
    if (!this.fb || !this.libro) return;
    const r = this.libro.getBoundingClientRect();
    this.pesar(e.clientX - r.left < r.width / 2 ? -1 : 1);
  }

  /* Cuando la hoja echa a volar el libro se prepara para donde va a caer. Si venia del dedo ya lleva medio
     camino hecho, se posa antes, y solo pasa si el pliegue cruzo el lomo. */
  aterrizar(arrastrada) {
    const fb = this.fb;
    if (!fb) return;
    const total = fb.getSettings().flippingTime;
    const queda = arrastrada ? total * 0.5 : total;
    const c = fb.getFlipController().calc;
    let destino = null;
    if (this.salto != null) destino = this.salto;
    else if (c && (!arrastrada || c.getPosition().x <= 0)) {
      const delante = c.getDirection() === 0;
      const i = fb.getCurrentPageIndex();
      destino = pliegoDe(delante ? (i === 0 ? 1 : i + 2) : i - 1, this.n);
    }
    this.salto = null;
    if (destino != null) this.mostrar(destino, queda * 0.95);
    this.sonar(this.pesada);
  }

  /* El libro, quieto en el pliego `i`: se ve, y sus vecinos quedan dibujados */
  asentar(i, ms) {
    const dest = pliegoDe(i, this.n);
    this.mostrar(dest, ms);
    this.llenar([dest]);
  }

  /* Pone el libro en el pliego `i`: camara, cartones, canto, lomo, flechas y contador. Se llama cuando la hoja
     EMPIEZA a girar, con lo que va a pasar, y no cuando termina: asi el libro se centra y el carton se aparta
     a la vez que cae la tapa, no un segundo despues. */
  mostrar(i, ms) {
    if (!this.libro) return;
    const n = this.n, v = paginasDe(i, n);
    if (!v.length) return;
    this.pliego = v[0];
    const lado = ladoDe(v[0], n);
    this.libro.style.setProperty('--cam-ms', Math.round(ms || 0) + 'ms');
    this.libro.style.translate = (lado === 'r' ? -this.pw / 2 : lado === 'l' ? this.pw / 2 : 0) + 'px 0';
    this.libro.dataset.at = v[0] === 0 ? 'front' : v.length === 1 ? 'back' : 'open';
    const px = (c) => cantoDe(c, n, this.pw) + 'px';
    this.libro.style.setProperty('--stack-l', px(v[0] === 0 ? 0 : v[0]));
    this.libro.style.setProperty('--stack-r', px(n - 1 - v[v.length - 1]));
    this.puestosLosBotones(v[0] === 0, v[v.length - 1] >= n - 1);
    const num = v.map((x) => x + 1), total = String(n);
    const dicho = num.length > 1
      ? this.tx.pliegoDos.replace('{a}', String(num[0])).replace('{b}', String(num[1])).replace('{total}', total)
      : this.tx.pagDe.replace('{n}', String(num[0])).replace('{total}', total);
    /* Un lector de pantalla repite lo que se reescribe aunque sea igual */
    if (this.dice.textContent !== dicho) this.dice.textContent = dicho;
  }

  /* Un boton desactivado con el foco lo suelta, y el teclado deja de llegar al visor (Inicio, flechas, Esc).
     Si el que se apaga lo tiene, el foco pasa al otro boton o, si tampoco sirve, al visor entero. */
  puestosLosBotones(sinAnterior, sinSiguiente) {
    const tenia = document.activeElement;
    this.bAnt.disabled = sinAnterior;
    this.bSig.disabled = sinSiguiente;
    if (tenia !== this.bAnt && tenia !== this.bSig) return;
    if (!tenia.disabled) return;
    const otro = tenia === this.bAnt ? this.bSig : this.bAnt;
    (otro.disabled ? this.caja : otro).focus();
  }

  /* El golpe: al caer una tapa el libro baja un pixel y se asienta */
  golpe() {
    if (!this.pesada || this.calma.matches || !this.libro) return;
    this.pesada = false;
    this.libro.classList.remove('is-thud');
    void this.libro.offsetWidth;
    this.libro.classList.add('is-thud');
  }

  sonar(pesada) {
    if (!this.pref.sonido || this.calma.matches) return;
    try {
      const a = new Audio(import.meta.env.BASE_URL + 'sounds/' + (pesada ? 'cover.mp3' : 'page-flip.mp3'));
      a.volume = pesada ? 0.7 : 0.5;
      const r = a.play();
      if (r && r.catch) r.catch(() => { /* el navegador no dejo sonar: no pasa nada */ });
    } catch (e) { /* sin audio */ }
  }
}
