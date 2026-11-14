/* VER COMO LIBRO: el libro abierto con el giro de hoja y el lomo del lector de la web. Es el mismo motor
   (StPageFlip, `page-flip`), la misma hoja que se dobla desde la esquina y los mismos estilos (hojeo.css).
   Lo que se ve son copias de las hojas de la mesa; con ellas se mira, y los botones del libro funcionan.

   Un libro de 300 paginas no puede tener 300 copias vivas: las 300 hojas existen, vacias y del mismo tamaño,
   y solo las del pliego que se ve y las de sus vecinos tienen la copia dibujada (pliegos.js → ventana).

   Tres gustos, que se recuerdan mientras la pestaña siga abierta: tapa dura o revista, ver el lomo en perspectiva, y el
   sonido de la hoja. Con el lomo a la vista el libro se mira en 3D y ya no se arrastra con el raton: se pasa
   con las flechas, los botones y un clic a cada lado, porque la libreria mide el raton en un plano plano.

   IR A UNA PARTE (la lista «Ir a…», una fila del contenido, el boton «Contenido», la barra, Inicio y Fin, RePag y AvPag):
   las hojas giran una tras otra, rapido (pliegos.js → planDeViaje); si hay mas de diez pliegos, el libro salta sin girar
   hasta diez antes del destino. El motor gira una hoja a la vez: la siguiente sale cuando la anterior cae.

   VOLVER: cada salto (todos los de arriba, no pasar una hoja suelta) deja el lugar de donde se salio en una pila de hasta 20
   (pliegos.js → apilarVuelta). «Volver» (o la tecla B) saca el ultimo y viaja hasta alli, sin apilar; se repite hasta vaciarla.
   La pila vive solo en la memoria del visor y se vacia al cerrar el libro.

   LA BARRA: un control de 1 a la ultima pagina. Al arrastrarla dice la pagina; al soltarla (`change`) viaja a ese pliego. Sigue
   al libro cuando se pasa una hoja de otra manera. Un teclado que la mueve paso a paso cuenta como UN salto (no llena la pila).

   LOS LIBROS DEL LOMO Y DEL AVISO son del libro (ConfigPagina.lomo / .aviso): el lomo y las tapas se pintan de
   lo que el autor eligio en la cinta, y el aviso (lo que dice y como se ve al tocar un boton) se cambia aqui mismo. */
import { apilarVuelta, barraDePliego, cantoDe, lomoDe, ladoDe, paginaDelContenido, paginasDe, pliegoALaVuelta, pliegoDe, pliegoDeBarra, pliegoVecino, planDeViaje, sacarVuelta, ventana } from './pliegos.js';
import { SelectorColor } from './SelectorColor.js';
import { enlaceDeBoton } from '../../../../contenido/taller/tipos/boton.js';
import { estiloDeLomo } from '../../../../contenido/taller/LomoLibro.js';
import { AVISO_CASOS, colorDeAviso, limpiarAviso, textoDeAviso } from '../../../../contenido/taller/AvisoLibro.js';

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const LIGERA = 850, PESADA = 1300, CALMA = 300;   // lo que tarda una hoja (ms): la del lector de la web
const RAPIDA = 95, RAPIDA_DURA = 150;            // y cuando pasan muchas seguidas
const TOPE_VIAJE = 10;                            // pliegos que giran de verdad en un viaje; el resto se salta
const FRANJA_SALE_MS = 220;
/* La libreria se pide una vez, y solo al abrir el primer libro */
let libreria = null;
const traerLibreria = () => {
  if (!libreria) libreria = import('page-flip').catch((e) => { libreria = null; throw e; });
  return libreria;
};

/* Lo primero de un texto, en una linea, para decirlo en un aviso (el original nunca se corta) */
const CORTO = 80;
const textoCorto = (t) => {
  const letras = Array.from(String(t == null ? '' : t).replace(/\s+/g, ' ').trim());
  return letras.length > CORTO ? `${letras.slice(0, CORTO).join('')}…` : letras.join('');
};

/* Los tres gustos duran lo que la pestaña: el portal no guarda nada en el navegador (tools/test-portal.mjs lo exige) */
const gustos = { dura: true, lomo: false, sonido: false };
const leerPref = () => ({ ...gustos });
const guardarPref = (p) => Object.assign(gustos, { dura: p.dura !== false, lomo: p.lomo === true, sonido: p.sonido === true });

export class VistaLibro {
  /* `libro`: { config() → ConfigPagina | null, puedeCambiar(), cambiar(parche) } lo que el visor lee y guarda del libro */
  constructor(caja, { mesa, tx, titulo, libro, recientes, alColor }) {
    Object.assign(this, { caja, mesa, tx, titulo: titulo || (() => ''), libroDe: libro || { config: () => null, puedeCambiar: () => false, cambiar: () => false } });
    this.recientes = recientes || (() => []);
    this.alColor = alColor || (() => {});
    this.escena = caja.querySelector('[data-vl-escena]');
    this.dice = caja.querySelector('[data-vl-dice]');
    this.bAnt = caja.querySelector('[data-vl-ant]');
    this.bSig = caja.querySelector('[data-vl-sig]');
    this.bTapa = caja.querySelector('[data-vl-tapa]');
    this.bLomo = caja.querySelector('[data-vl-lomo]');
    this.bSonido = caja.querySelector('[data-vl-sonido]');
    this.bIr = caja.querySelector('[data-vl-ir]');
    this.menuIr = caja.querySelector('[data-vl-ir-lista]');
    this.bAviso = caja.querySelector('[data-vl-aviso]');
    this.franja = caja.querySelector('[data-vl-aviso-franja]');
    this.tira = caja.querySelector('[data-vl-botones]');
    this.tiraLista = caja.querySelector('[data-vl-botones-lista]');
    this.dAviso = caja.querySelector('[data-vl-aviso-d]');
    this.bVolver = caja.querySelector('[data-vl-volver]');
    this.bContenido = caja.querySelector('[data-vl-contenido]');
    this.barra = caja.querySelector('[data-vl-barra]');
    this.valorBarra = caja.querySelector('[data-vl-barra-valor]');
    this.pila = [];           // de donde se salto (pliegos); vive solo mientras el libro esta abierto
    this.paginaIndice = -1;   // la primera hoja del contenido (desde 0), o -1
    this.pref = leerPref();
    /* Las teclas, dichas en el boton que hace lo mismo */
    this.bAnt.title = tx.vlAntAyuda;
    this.bSig.title = tx.vlSigAyuda;
    this.bAnt.setAttribute('aria-keyshortcuts', 'ArrowLeft');
    this.bSig.setAttribute('aria-keyshortcuts', 'ArrowRight');
    caja.tabIndex = -1;      // adonde va el foco si ningun boton sirve
    this.calma = matchMedia('(prefers-reduced-motion: reduce)');
    this.gen = 0;             // cada vez que se arma o se cierra: lo que llega tarde se descarta
    this.fb = null;
    this.libro = null;
    this.hojas = [];
    this.vivas = new Map();   // pagina → su copia dibujada
    this.acciones = new WeakMap();   // boton de una copia → lo que hace (datos ya limpios)
    this.pliego = 0;          // el pliego que se ve (por su primera pagina)
    this.n = 0;
    this.pesada = false;
    this.viaje = null;        // { plan, k, parar, gen, actual, reloj }: mientras giran hojas una tras otra
    this.pendiente = null;    // lo que se pidio mientras algo giraba: se hace al caer la hoja
    this.nombreDestino = '';
    this.pruebas = 0;

    caja.querySelector('[data-vl-cerrar]').addEventListener('click', () => this.cerrar());
    this.bAnt.addEventListener('click', () => this.paso(-1, true));
    this.bSig.addEventListener('click', () => this.paso(1, true));
    this.bVolver.addEventListener('click', () => this.volver());
    this.bContenido.addEventListener('click', () => this.irAlContenido());
    this.prepararBarra();
    this.bTapa.addEventListener('click', () => { this.pref.dura = !this.pref.dura; this.cambioDePref(true); });
    this.bLomo.addEventListener('click', () => { this.pref.lomo = !this.pref.lomo; this.cambioDePref(false); });
    this.bSonido.addEventListener('click', () => { this.pref.sonido = !this.pref.sonido; this.cambioDePref(false); });
    this.bIr.addEventListener('click', () => (this.menuIr.hidden ? this.abrirIr() : this.cerrarIr(true)));
    this.bIr.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' && this.menuIr.hidden) { e.preventDefault(); e.stopPropagation(); this.abrirIr(); } });
    this.menuIr.addEventListener('keydown', (e) => this.teclaEnIr(e));
    this.menuIr.parentElement.addEventListener('focusout', (e) => { if (!this.menuIr.hidden && !this.menuIr.parentElement.contains(e.relatedTarget)) this.cerrarIr(false); });
    this.bAviso.addEventListener('click', () => this.abrirAviso());
    this.prepararAviso();
    this.pintarPref();

    /* Un clic es un clic solo si el dedo no arrastro: despues de arrastrar una hoja tambien llega «click» */
    this.escena.addEventListener('pointerdown', (e) => {
      this.abajo = { x: e.clientX, y: e.clientY };
      if (e.button === 0) this.pesarConRaton(e);
    });
    this.escena.addEventListener('click', (e) => {
      const a = this.abajo;
      this.abajo = null;
      if (this.cierraLista) { this.cierraLista = false; return; }
      if (!this.fb || (a && Math.hypot(e.clientX - a.x, e.clientY - a.y) > 6)) return;
      if (this.irDesdeIndice(e)) return;
      if (this.tocarBotonEn(e)) return;
      const r = this.libro.getBoundingClientRect();
      this.paso(e.clientX > r.left + r.width / 2 ? 1 : -1);
    });
    caja.addEventListener('keydown', (e) => {
      /* Dentro de una ventana o de la lista «Ir a…» el teclado es de ellas: ni flechas ni Escape cierran el visor */
      if (e.target.closest && e.target.closest('dialog, [data-vl-ir-lista]')) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (this.menuIr.hidden) this.cerrar(); else this.cerrarIr(true); return; }
      /* La barra tiene sus propias teclas (flechas, Inicio, Fin, RePag, AvPag): se mueve sola y al soltar el libro viaja */
      if (e.target === this.barra && /^(Arrow|Home$|End$|Page)/.test(e.key)) return;
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); this.paso(d, true); }
      else if (e.key === 'Home' && this.fb) { e.preventDefault(); this.irA(0); }
      else if (e.key === 'End' && this.fb) { e.preventDefault(); this.irA(this.n - 1); }
      /* RePag y AvPag: diez pliegos (desde donde va el viaje, si hay uno: se suman) */
      else if ((e.key === 'PageUp' || e.key === 'PageDown') && this.fb) { e.preventDefault(); this.irA(pliegoALaVuelta(this.lugar(), this.n, e.key === 'PageDown' ? 1 : -1)); }
      else if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey && !e.altKey && this.fb) { e.preventDefault(); this.volver(); }
    });
  }

  /* El libro del que se lee: su lomo, su aviso y su ancho */
  config() { return this.libroDe.config(); }
  avisoDelLibro() { const c = this.config(); return c ? limpiarAviso(c.aviso) : limpiarAviso({}); }

  /* ---- Abrir y cerrar ---- */
  abrir(desde) {
    this.origen = desde;
    this.pila = [];
    this.cola = 0;
    this.ultimaBarra = null;
    this.mesa.soltarTodo();
    this.mesa.medir();
    this.caja.hidden = false;
    /* Las miniaturas quedan tapadas: no se dibujan mientras el visor esta abierto (taller.css) */
    document.documentElement.dataset.verLibro = 'si';
    this.pintarPref();
    /* El visor es un dialogo modal: el editor que queda debajo no recibe ni el foco ni el teclado */
    this.apartados = [...(this.caja.parentElement ? this.caja.parentElement.children : [])].filter((n) => n !== this.caja && !n.inert);
    this.apartados.forEach((n) => { n.inert = true; });
    this.ac = new AbortController();
    const { signal } = this.ac;
    /* Al soltar un arrastre la libreria no avisa: se atiende aqui, donde se levanta el dedo */
    addEventListener('pointerup', () => { if (this.fb && this.fb.getState() === 'user_fold') this.aterrizar(true); }, { signal });
    /* Un boton tocado con el raton no debe ademas girar la hoja si cae en una esquina: la libreria cree que se solto en el centro */
    addEventListener('mouseup', (e) => this.alSoltar(e), { signal, capture: true });
    /* Un dedo que se levanta sobre un boton: lo mismo, y el boton si funciona (la libreria cancela el toque y no llega «click») */
    addEventListener('touchend', (e) => this.alSoltarDedo(e), { signal, capture: true });
    /* El clic que cierra la lista «Ir a…» solo la cierra: no gira la hoja ni toca un boton que estuviera debajo */
    addEventListener('pointerdown', (e) => {
      this.cierraLista = !this.menuIr.hidden && !this.menuIr.parentElement.contains(e.target);
      if (this.cierraLista) this.cerrarIr(false);
    }, { signal, capture: true });
    addEventListener('resize', () => {
      clearTimeout(this.tResize);
      this.tResize = setTimeout(() => { if (this.fb) this.armar(this.viaje ? this.viaje.plan.pasos[this.viaje.plan.pasos.length - 1] : this.pliego).catch(() => {}); }, 180);
    }, { signal });
    this.caja.querySelector('[data-vl-cerrar]').focus();
    this.armar(0).catch(() => { this.dice.textContent = this.tx.vlFalla || ''; });
  }

  cerrar() {
    this.gen++;
    clearTimeout(this.espera);
    clearTimeout(this.tResize);
    clearTimeout(this.relojAviso);
    this.frenarViaje();
    this.pendiente = null;
    this.cola = 0;
    this.pila = [];            // al cerrar el libro se olvida de donde se salto
    this.arrastrandoBarra = false;
    this.cerrarIr(false);
    if (this.dAviso.open) this.dAviso.close();
    if (this.ac) { this.ac.abort(); this.ac = null; }
    this.desmontar();
    this.pintarVuelta();
    this.pintarBarra();
    (this.apartados || []).forEach((n) => { n.inert = false; });
    this.apartados = null;
    this.caja.hidden = true;
    delete document.documentElement.dataset.verLibro;
    this.escena.replaceChildren();
    this.tira.hidden = true;
    this.tiraLista.replaceChildren();
    this.franja.classList.remove('tal-vl-aviso--visible');
    this.franja.textContent = '';
    if (this.origen) this.origen.focus();
  }

  desmontar() {
    this.frenarViaje();
    /* Lo que se pidio para el libro de antes no se le hace al nuevo: saltaria sin que nadie lo pidiera */
    this.pendiente = null;
    this.cola = 0;
    this.nombreDestino = '';
    if (this.fb) { try { this.fb.destroy(); } catch (e) { /* ya no estaba */ } }
    this.fb = null;
    this.libro = null;
    this.hojas = [];
    this.vivas = new Map();
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
    if (armarOtraVez && this.fb) this.armar(this.viaje ? this.viaje.plan.pasos[this.viaje.plan.pasos.length - 1] : this.pliego).catch(() => {});
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
    this.paginaIndice = paginaDelContenido(this.mesa.paginas);
    /* Si el libro se acorto, los lugares que ya no existen se tiran */
    this.pila = this.pila.filter((x) => x < n);
    if (!n) { this.escena.replaceChildren(); this.dice.textContent = ''; this.bAnt.disabled = this.bSig.disabled = true; this.tira.hidden = true; this.pintarVuelta(); this.pintarBarra(); return; }

    const blando = !this.pref.dura;
    /* El ancho de una pagina: lo que cabe a lo ancho (dos paginas) y a lo alto (la pagina y el carton que
       asoma por arriba y por abajo, que es un 1,8 % del ancho de cada lado) */
    const alto = this.escena.clientHeight - 24;
    const pw = Math.max(120, Math.floor(Math.min((this.escena.clientWidth - 96) / 2, alto / (p.H / p.W + 0.036), 720)));
    const over = Math.max(5, Math.round(pw * 0.018));
    const ph = Math.round(pw * p.H / p.W);
    this.pw = pw;
    this.ph = ph;
    this.esc = pw / p.W;

    /* El lomo y las tapas son del libro: lo que se eligio en la cinta (LomoLibro.js). Sin nada elegido, como siempre. */
    const cfg = this.config();
    const lomoE = estiloDeLomo(cfg ? cfg.lomo : null, this.titulo(), { autoPx: lomoDe(n, pw), pxPorMm: cfg && cfg.anchoMm > 0 ? pw / cfg.anchoMm : 1, ancho: pw });

    const libro = crear('div', 'flip');
    libro.style.width = pw * 2 + 'px';
    libro.style.setProperty('--over', over + 'px');
    libro.style.setProperty('--lomo', lomoE.grosorPx + 'px');
    for (const [k, v] of [['--board-front', lomoE.delante], ['--board-back', lomoE.detras], ['--lomo-color', lomoE.color], ['--lomo-tinta', lomoE.tinta]]) if (v) libro.style.setProperty(k, v);
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
    lomo.append(crear('span', 'flip__lomo-titulo', lomoE.texto));
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
    fb.on('flip', () => { if (this.fb === fb && !this.saltando) { this.asentar(fb.getCurrentPageIndex(), 250); this.golpe(); } });
    let antes = 'read';
    fb.on('changeState', (e) => {
      if (this.fb !== fb) return;
      if (e.data === 'flipping') this.aterrizar(false);
      if (e.data === 'read' && antes !== 'read' && antes !== 'fold_corner') {
        this.asentar(fb.getCurrentPageIndex(), 250);
        /* La hoja cayo: en un viaje sale la siguiente (en el cuadro que viene: la libreria aun cierra esta) */
        if (this.viaje) { const v = this.viaje; requestAnimationFrame(() => { if (this.viaje === v) this.siguienteHoja(); }); }
        else requestAnimationFrame(() => { if (this.fb === fb) this.alReposo(); });
      }
      antes = e.data;
    });
    this.mostrar(en2, 0);
    this.pintarBotones();
    this.pintarVuelta();
    this.pintarBarra();
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
      const c = this.nuevaCopia(i);
      this.hojas[i].append(c);
      this.vivas.set(i, c);
    }
  }

  /* La copia de la hoja `i`, del tamaño EXACTO de su hoja del libro: la hoja mide px enteros y la copia, con la escala, una
     fraccion menos; sin esto se veria una raya del papel de la hoja en el borde de abajo de una pagina oscura. */
  nuevaCopia(i) {
    const c = this.mesa.clon(this.mesa.paginas[i], this.esc, { acciones: this.acciones });
    c.style.width = `${this.pw}px`;
    c.style.height = `${this.ph}px`;
    return c;
  }

  /* Llega una imagen o cambia lo medido: se vuelve a dibujar lo que se ve, sin armar el libro otra vez. Cada copia se
     cambia por la nueva de una vez (sin pasar por la hoja vacia), asi no parpadea ni siquiera con una hoja girando. */
  refrescar() {
    if (this.caja.hidden || !this.fb || !this.mesa) return;
    clearTimeout(this.espera);
    this.espera = setTimeout(() => {
      if (this.caja.hidden || !this.fb || !this.mesa) return;
      if (this.mesa.paginas.length !== this.n) { this.armar(this.lugar()).catch(() => {}); return; }
      for (const [i, viejo] of this.vivas) {
        if (!this.mesa.paginas[i]) { viejo.remove(); this.vivas.delete(i); continue; }
        const nuevo = this.nuevaCopia(i);
        viejo.replaceWith(nuevo);
        this.vivas.set(i, nuevo);
      }
      this.paginaIndice = paginaDelContenido(this.mesa.paginas);
      this.pintarVuelta();
      this.pintarBotones();
    }, 120);
  }

  /* Se puede pasar con el libro en reposo o con una esquina levantada por el raton (`fold_corner`): esa se
     baja sola al pasar. Mientras gira o se arrastra una hoja, no. */
  quieto() { const e = this.fb && this.fb.getState(); return e === 'read' || e === 'fold_corner'; }

  /* ---- Pasar ---- */
  /* `junta`: lo pide un boton o una tecla (no un clic sobre la hoja, que ya giro la libreria). Si una hoja ya esta cayendo, las que
     se pidieron mientras tanto se cuentan, y al caer giran todas seguidas y rapido: apretar «anterior» varias veces no pierde toques. */
  paso(d, junta = false) {
    const fb = this.fb;
    if (!fb) return;
    /* Si giran muchas hojas, la que se pide se hace cuando caiga la de ahora (y las que faltaban ya no giran) */
    if (this.viaje) { this.pendiente = () => this.paso(d); this.viaje.parar = true; return; }
    if (!this.quieto()) {
      if (junta && fb.getState() === 'flipping') { this.cola = (this.cola || 0) + d; this.pendiente = () => this.pasosJuntos(); }
      return;
    }
    const dest = pliegoVecino(this.pliego, this.n, d);
    if (dest == null) return;
    this.llenar([this.pliego, dest]);
    this.pesar(d);
    if (d > 0) fb.flipNext('bottom'); else fb.flipPrev('bottom');
  }

  /* Las hojas que se pidieron mientras caia una: una sola, como siempre; varias, un viaje corto (no cuenta para «Volver») */
  pasosJuntos() {
    const k = this.cola || 0;
    this.cola = 0;
    if (!k) return;
    let destino = this.pliego;
    for (let i = 0; i < Math.abs(k); i++) { const s = pliegoVecino(destino, this.n, k > 0 ? 1 : -1); if (s == null) break; destino = s; }
    if (destino === this.pliego) return;
    if (Math.abs(k) === 1) this.paso(k > 0 ? 1 : -1);
    else this.irA(destino, '', { apilar: false });
  }

  /* Donde esta el libro o hacia donde va (si hay un viaje) */
  lugar() {
    const v = this.viaje;
    return v && v.plan.pasos.length ? v.plan.pasos[v.plan.pasos.length - 1] : this.pliego;
  }

  /* Ir a la pagina `p` (desde 0). `nombre`: como se llama el sitio, para decirlo al llegar. `apilar`: guardar de donde se sale,
     para «Volver» (todo salto lo hace; el propio «Volver» y lo que se suma a un viaje en marcha, no). */
  irA(p, nombre = '', { apilar = true } = {}) {
    const fb = this.fb;
    if (!fb) return;
    /* Pedido con algo girando: el ultimo pedido manda. La hoja de ahora termina de caer; las demas no giran.
       Un salto pedido a mitad de otro es parte de aquel: el lugar de donde salio el primero ya esta guardado. */
    if (this.viaje || !this.quieto()) {
      const opciones = { apilar: this.viaje ? false : apilar };
      this.pendiente = () => this.irA(p, nombre, opciones);
      if (this.viaje) this.viaje.parar = true;
      return;
    }
    const plan = planDeViaje(this.pliego, pliegoDe(p, this.n), this.n, { tope: this.calma.matches ? 1 : TOPE_VIAJE });
    if (!plan.pasos.length) { if (nombre) this.decirDestino(nombre); return; }
    if (apilar) { this.pila = apilarVuelta(this.pila, this.pliego); this.pintarVuelta(); }
    this.nombreDestino = nombre;
    this.viaje = { plan, k: 0, parar: false, gen: this.gen, actual: null, reloj: setTimeout(() => this.terminarViaje(true), plan.pasos.length * 1500 + 2500) };
    /* Lo que queda lejos se salta sin girar (en silencio: el viaje ya esta en marcha): las hojas que giran son las ultimas, ya con su pagina dibujada */
    if (plan.salto != null) this.saltarA(plan.salto);
    this.siguienteHoja();
  }

  /* El libro pasa de golpe al pliego `i`, sin girar */
  saltarA(i) {
    this.llenar([i]);
    this.saltando = true;
    try { this.fb.turnToPage(i); } catch (e) { /* ya estaba */ }
    this.saltando = false;
    this.mostrar(i, 0);
  }

  /* Gira la hoja que sigue del viaje. Si ya no hay (o se pidio otra cosa), el viaje termina. */
  siguienteHoja() {
    const v = this.viaje, fb = this.fb;
    if (!v || !fb) return;
    if (v.parar || v.gen !== this.gen || v.k >= v.plan.pasos.length) { this.terminarViaje(false); return; }
    const dest = v.plan.pasos[v.k++];
    v.actual = dest;
    this.llenar([dest]);
    this.pesar(v.plan.dir);
    fb.getSettings().flippingTime = this.calma.matches ? CALMA : this.pesada ? RAPIDA_DURA : RAPIDA;
    if (v.plan.dir > 0) fb.flipNext('bottom'); else fb.flipPrev('bottom');
    /* Si la libreria no la giro (no habia a donde), el viaje no se queda esperando */
    if (fb.getState() !== 'flipping') this.terminarViaje(false);
  }

  /* El viaje acabo (o se corto). Con `forzar`, algo no llego: el libro se pone en el destino de una vez. */
  terminarViaje(forzar) {
    const v = this.viaje;
    if (!v) return;
    this.frenarViaje();
    const fb = this.fb;
    if (fb && forzar) {
      const fin = v.plan.pasos[v.plan.pasos.length - 1];
      /* Si una hoja sigue girando (la pestaña estuvo oculta y el reloj de la libreria no corrio), primero se termina: saltar con
         la hoja en el aire la deja a medias */
      try { fb.getRender().finishAnimation(); } catch (e) { /* no habia nada girando */ }
      try { this.saltarA(fin); } catch (e) { /* queda donde esta */ }
    }
    if (fb) {
      fb.getSettings().flippingTime = this.calma.matches ? CALMA : LIGERA;
      this.asentar(fb.getCurrentPageIndex(), 0);
    }
    this.alReposo();
  }

  /* Deja de girar: sin reloj y sin viaje (lo que giraba termina por si solo) */
  frenarViaje() {
    const v = this.viaje;
    if (!v) return;
    clearTimeout(v.reloj);
    this.viaje = null;
  }

  /* El libro esta quieto: lo que se pidio mientras giraba se hace ahora */
  alReposo() {
    const f = this.pendiente;
    if (f) { this.pendiente = null; f(); }
    this.cola = 0;
  }

  /* ---- Volver, Contenido y la barra ---- */
  /* Regresa al ultimo lugar de donde se salto, con las hojas girando rapido (y sin apilar: asi se puede repetir hasta vaciar la pila) */
  volver() {
    if (!this.fb) return;
    if (this.viaje || !this.quieto()) {
      this.pendiente = () => this.volver();
      if (this.viaje) this.viaje.parar = true;
      return;
    }
    const { pliego, pila } = sacarVuelta(this.pila, this.pliego);
    this.pila = pila;
    this.pintarVuelta();
    if (pliego == null) return;
    this.irA(pliego, this.tx.vlVolvio, { apilar: false });
  }

  irAlContenido() {
    if (!this.fb || this.paginaIndice < 0) return;
    this.irA(this.paginaIndice, this.tx.vlContenidoDicho);
  }

  /* «Volver» y «Contenido» se encienden o se apagan; si uno tenia el foco, el foco no se pierde */
  pintarVuelta() {
    const tenia = document.activeElement;
    const sinVuelta = !this.fb || !this.pila.length;
    const sinContenido = !this.fb || this.paginaIndice < 0;
    for (const [b, apagado, ayuda, nada] of [[this.bVolver, sinVuelta, this.tx.vlVolverAyuda, this.tx.vlVolverNada], [this.bContenido, sinContenido, this.tx.vlContenidoAyuda, this.tx.vlContenidoNada]]) {
      b.disabled = apagado;
      b.title = apagado ? nada : ayuda;
    }
    this.rescatarFoco(tenia);
  }

  /* La barra: de 1 a la ultima pagina. Arrastrar dice la pagina; soltar viaja. */
  prepararBarra() {
    const b = this.barra;
    b.addEventListener('input', () => { this.arrastrandoBarra = true; this.escribirBarra(); });
    b.addEventListener('change', () => {
      this.arrastrandoBarra = false;
      if (!this.fb) return;
      const destino = pliegoDeBarra(b.value, this.n);
      if (destino === this.lugar()) { this.sincronizarBarra(); return; }
      /* Un teclado que la mueve paso a paso es UN salto para «Volver»: lo que se mueve en menos de un segundo y medio se suma al anterior */
      const ahora = performance.now();
      const seguido = this.ultimaBarra != null && ahora - this.ultimaBarra < 1500;
      this.ultimaBarra = ahora;
      this.irA(destino, '', { apilar: !seguido });
    });
    /* A un `input` siempre le sigue un `change` al soltar: NO se suelta en `pointerup` (con el dedo `change` puede llegar en otra tarea y
       la barra volveria al valor viejo antes de viajar). Solo se suelta si el dedo se levanta donde empezo (no habra `change`) o se cancela. */
    const soltar = () => setTimeout(() => { this.arrastrandoBarra = false; this.sincronizarBarra(); }, 0);
    b.addEventListener('pointerdown', () => { this.valorAlBajar = b.value; });
    b.addEventListener('pointerup', () => { if (b.value === this.valorAlBajar) soltar(); });
    b.addEventListener('pointercancel', soltar);
    b.addEventListener('blur', soltar);
  }

  /* Los extremos de la barra segun el libro de ahora */
  pintarBarra() {
    const b = this.barra, n = this.n || 1;
    b.min = '1';
    b.max = String(n);
    b.disabled = !this.fb || n < 2;
    this.sincronizarBarra();
  }

  /* La barra sigue al libro (mientras no se este arrastrando). El valor se deja si ya cae en el pliego que se ve: con el teclado,
     la pagina 3 y la 2 son el mismo pliego, y devolverla a la 2 la atascaria. */
  sincronizarBarra() {
    const b = this.barra;
    if (!b || this.arrastrandoBarra) return;
    if (!this.fb || !this.n) { this.escribirBarra(); return; }
    /* Con un viaje en marcha la barra ya esta en el destino: no vuelve atras a cada hoja que cae */
    const aqui = this.lugar();
    if (pliegoDeBarra(b.value, this.n) !== aqui) b.value = String(barraDePliego(aqui, this.n));
    this.escribirBarra();
  }

  /* «Página N de M», para quien ve y para quien escucha */
  escribirBarra() {
    const b = this.barra, tx = this.tx;
    const texto = this.n ? tx.vlBarraTexto.replace('{n}', String(Math.round(Number(b.value)) || 1)).replace('{total}', String(this.n)) : '';
    b.setAttribute('aria-valuetext', texto);
    if (this.valorBarra.textContent !== texto) this.valorBarra.textContent = texto;
  }

  /* Un boton desactivado con el foco lo suelta, y el teclado deja de llegar al visor. Si el que se apaga lo tiene, el foco pasa a otro
     boton que sirva (la barra, si no hay otro) o, si ninguno sirve, al visor entero. */
  rescatarFoco(tenia) {
    if (![this.bAnt, this.bSig, this.bVolver, this.bContenido].includes(tenia) || !tenia.disabled) return;
    const otros = tenia === this.bAnt ? [this.bSig, this.barra, this.bVolver] : tenia === this.bSig ? [this.bAnt, this.barra, this.bVolver] : tenia === this.bVolver ? [this.bContenido, this.barra, this.bAnt, this.bSig] : [this.bAnt, this.bSig, this.barra];
    (otros.find((o) => !o.disabled) || this.caja).focus();
  }

  /* Una fila del contenido lleva a su pagina. Las copias son inertes: la fila se busca por donde cayo el clic. */
  /* La fila del contenido que esta bajo ese punto: { pagina (desde 0), texto } o null */
  filaDeIndiceEn(e) {
    if (!this.libro) return null;
    const numeros = (this.mesa.datosDeIndice || {}).numeros || {};
    const fila = [...this.libro.querySelectorAll('.indice__fila')].find((a) => {
      const r = a.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    const n = fila && numeros[(fila.getAttribute('href') || '').slice(1)];
    if (!Number.isInteger(n) || n < 1) return null;
    const texto = fila.querySelector('.indice__texto');
    return { pagina: n - 1, texto: texto ? texto.textContent.trim() : '' };
  }

  irDesdeIndice(e) {
    const f = this.filaDeIndiceEn(e);
    if (!f) return false;
    this.irA(f.pagina, f.texto);
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
     camino hecho, se posa antes, y solo pasa si el pliegue cruzo el lomo. En un viaje el destino ya se sabe. */
  aterrizar(arrastrada) {
    const fb = this.fb;
    if (!fb) return;
    const total = fb.getSettings().flippingTime;
    const queda = arrastrada ? total * 0.5 : total;
    const c = fb.getFlipController().calc;
    let destino = null;
    if (this.viaje && this.viaje.actual != null) destino = this.viaje.actual;
    else if (c && (!arrastrada || c.getPosition().x <= 0)) {
      const delante = c.getDirection() === 0;
      const i = fb.getCurrentPageIndex();
      destino = pliegoDe(delante ? (i === 0 ? 1 : i + 2) : i - 1, this.n);
    }
    if (destino != null) this.mostrar(destino, queda * 0.95);
    this.sonar(this.pesada);
  }

  /* El libro, quieto en el pliego `i`: se ve, y sus vecinos quedan dibujados */
  asentar(i, ms) {
    const dest = pliegoDe(i, this.n);
    this.mostrar(dest, ms);
    this.llenar([dest]);
    if (!this.viaje) this.pintarBotones();
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
    this.sincronizarBarra();
    /* Mientras giran muchas hojas no se dice nada: un lector de pantalla no tiene que leer cada una. Se dice al llegar. */
    if (this.viaje) return;
    const num = v.map((x) => x + 1), total = String(n);
    let dicho = num.length > 1
      ? this.tx.pliegoDos.replace('{a}', String(num[0])).replace('{b}', String(num[1])).replace('{total}', total)
      : this.tx.pagDe.replace('{n}', String(num[0])).replace('{total}', total);
    if (this.nombreDestino) { dicho = this.tx.vlIrDicho.replace('{texto}', this.nombreDestino).replace('{resto}', dicho); this.nombreDestino = ''; }
    /* Un lector de pantalla repite lo que se reescribe aunque sea igual */
    if (this.dice.textContent !== dicho) this.dice.textContent = dicho;
  }

  /* Ya estaba donde se pedia: se dice igual a donde */
  decirDestino(nombre) {
    const v = paginasDe(this.pliego, this.n).map((x) => x + 1), total = String(this.n);
    const resto = v.length > 1
      ? this.tx.pliegoDos.replace('{a}', String(v[0])).replace('{b}', String(v[1])).replace('{total}', total)
      : this.tx.pagDe.replace('{n}', String(v[0])).replace('{total}', total);
    this.dice.textContent = this.tx.vlIrDicho.replace('{texto}', nombre).replace('{resto}', resto);
  }

  /* Un boton desactivado con el foco lo suelta, y el teclado deja de llegar al visor (Inicio, flechas, Esc).
     Si el que se apaga lo tiene, el foco pasa al otro boton o, si tampoco sirve, al visor entero. */
  puestosLosBotones(sinAnterior, sinSiguiente) {
    const tenia = document.activeElement;
    this.bAnt.disabled = sinAnterior;
    this.bSig.disabled = sinSiguiente;
    this.rescatarFoco(tenia);
  }

  /* El golpe: al caer una tapa el libro baja un pixel y se asienta */
  golpe() {
    if (!this.pesada || this.calma.matches || !this.libro) return;
    this.pesada = false;
    this.libro.classList.remove('is-thud');
    void this.libro.offsetWidth;
    this.libro.classList.add('is-thud');
  }

  /* El sonido de la hoja. En un viaje, una de cada tres y mas bajito: un frufru, no una rafaga. */
  sonar(pesada) {
    if (!this.pref.sonido || this.calma.matches) return;
    const v = this.viaje;
    if (v && !pesada && (v.k - 1) % 3 !== 0) return;
    try {
      const a = new Audio(import.meta.env.BASE_URL + 'sounds/' + (pesada ? 'cover.mp3' : 'page-flip.mp3'));
      a.volume = v ? 0.3 : pesada ? 0.7 : 0.5;
      const r = a.play();
      if (r && r.catch) r.catch(() => { /* el navegador no dejo sonar: no pasa nada */ });
    } catch (e) { /* sin audio */ }
  }

  /* ---- «Ir a…» ---- */
  abrirIr() {
    if (!this.fb || !this.mesa) return;
    const lista = this.mesa.destinos();
    const ops = lista.map((d) => {
      const b = crear('button', `tal-vl-ir__op${d.nivel === 2 ? ' tal-vl-ir__op--2' : ''}`);
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      b.tabIndex = -1;
      b.append(crear('span', 'tal-vl-ir__texto', d.texto), crear('span', 'tal-vl-ir__pag', String(d.pagina)));
      b.addEventListener('click', () => { this.cerrarIr(true); this.irA(d.pagina - 1, d.texto); });
      return b;
    });
    this.menuIr.replaceChildren(...(ops.length ? ops : [crear('p', 'tal-vl-ir__nada', this.tx.vlIrNada)]));
    this.menuIr.hidden = false;
    this.bIr.setAttribute('aria-expanded', 'true');
    /* El foco va a donde se esta: la ultima parte que ya empezo */
    const aqui = this.pliego + 1;
    let k = 0;
    lista.forEach((d, i) => { if (d.pagina <= aqui) k = i; });
    if (ops[k]) { ops[k].tabIndex = 0; ops[k].focus(); ops[k].scrollIntoView({ block: 'nearest' }); }
  }

  cerrarIr(devolverFoco) {
    if (this.menuIr.hidden) return;
    this.menuIr.hidden = true;
    this.bIr.setAttribute('aria-expanded', 'false');
    if (devolverFoco) this.bIr.focus();
  }

  teclaEnIr(e) {
    const ops = [...this.menuIr.querySelectorAll('.tal-vl-ir__op')];
    const hoy = ops.indexOf(document.activeElement);
    const ir = (k) => { const b = ops[Math.max(0, Math.min(ops.length - 1, k))]; if (b) { ops.forEach((o) => { o.tabIndex = -1; }); b.tabIndex = 0; b.focus(); b.scrollIntoView({ block: 'nearest' }); } };
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.cerrarIr(true); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); ir(hoy + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); ir(hoy - 1); }
    else if (e.key === 'Home') { e.preventDefault(); e.stopPropagation(); ir(0); }
    else if (e.key === 'End') { e.preventDefault(); e.stopPropagation(); ir(ops.length - 1); }
  }

  /* ---- Los botones del libro ---- */
  /* Los botones de las hojas que se ven: cada uno con la pieza de su copia y lo que hace */
  botonesVisibles() {
    const lista = [];
    for (const pg of paginasDe(this.pliego, this.n)) {
      const c = this.vivas.get(pg);
      if (!c) continue;
      for (const el of c.querySelectorAll('.boton')) { const d = this.acciones.get(el); if (d) lista.push({ el, d }); }
    }
    return lista;
  }

  /* Lo que se ve de un boton: su caja, recortada a la de su hoja (la copia recorta lo que sale de ella: un boton fuera de la hoja no se ve) */
  zonaDelBoton(el) {
    const r = el.getBoundingClientRect(), hoja = el.closest('.clon');
    if (!hoja) return r;
    const h = hoja.getBoundingClientRect();
    const left = Math.max(r.left, h.left), top = Math.max(r.top, h.top), right = Math.min(r.right, h.right), bottom = Math.min(r.bottom, h.bottom);
    return right > left && bottom > top ? { left, top, right, bottom, width: right - left, height: bottom - top } : null;
  }

  /* El boton que esta bajo el clic (el mas chico si hay varios encimados). Una copia es inerte: se busca por donde cayo. */
  botonEn(e) {
    let mejor = null, area = Infinity;
    for (const b of this.botonesVisibles()) {
      const r = this.zonaDelBoton(b.el);
      if (!r || !(r.width > 0 && r.height > 0) || e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue;
      if (r.width * r.height < area) { mejor = b; area = r.width * r.height; }
    }
    return mejor;
  }

  tocarBotonEn(e) {
    if (!this.quieto()) return false;
    const b = this.botonEn(e);
    if (!b) return false;
    this.tocarBoton(b.d);
    return true;
  }

  /* Se suelta el raton sobre un boton: se le dice a la libreria que fue en el centro, donde un clic no gira nada */
  alSoltar(e) {
    if (this.redirigiendo || !e.isTrusted || e.button !== 0 || !this.fb || !this.libro || this.pref.lomo || !this.quieto()) return;
    if (!this.escena.contains(e.target) || !this.botonEn(e)) return;
    e.stopImmediatePropagation();
    const r = this.libro.getBoundingClientRect();
    this.redirigiendo = true;
    try { window.dispatchEvent(new MouseEvent('mouseup', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0, bubbles: true })); } finally { this.redirigiendo = false; }
  }

  /* Un toque con el dedo: la libreria cancela el toque y, si lo hace en una esquina, le gira la hoja. Si el dedo cae (sin arrastrar)
     sobre un boton, la libreria no se entera: se le borra el toque que tenia empezado y el boton hace lo suyo. */
  alSoltarDedo(e) {
    const t = e.changedTouches && e.changedTouches[0];
    if (!t || !e.isTrusted || !this.fb || !this.libro || this.pref.lomo || !this.quieto() || !this.escena.contains(e.target)) return;
    const a = this.abajo;
    if (this.cierraLista || (a && Math.hypot(t.clientX - a.x, t.clientY - a.y) > 6)) return;
    const punto = { clientX: t.clientX, clientY: t.clientY };
    const b = this.botonEn(punto);
    /* Un toque sobre una fila del contenido tambien lleva a su pagina (con el dedo la libreria no deja pasar el «click») */
    const fila = b ? null : this.filaDeIndiceEn(punto);
    if (!b && !fila) return;
    e.stopImmediatePropagation();
    if (e.cancelable) e.preventDefault();
    this.abajo = null;
    try { const ui = this.fb.getUI(); if (ui) ui.touchPoint = null; this.fb.isUserTouch = false; } catch (er) { /* sin estado que borrar */ }
    if (b) this.tocarBoton(b.d); else this.irA(fila.pagina, fila.texto);
  }

  /* Lo que hace un boton: abre su enlace (solo https) o copia su texto. Y lo dice. */
  tocarBoton(d) {
    if (d.accion === 'copiar' && d.copia) this.copiar(d.copia);
    else if (d.accion === 'enlace' && enlaceDeBoton(d.enlace)) this.abrirEnlace(enlaceDeBoton(d.enlace));
    else this.avisar('falla', this.tx.vlBotonVacio);
  }

  async copiar(texto) {
    let bien = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(texto); bien = true; }
    } catch (e) { bien = false; }
    this.avisar(bien ? 'copiado' : 'falla', '', undefined, bien ? textoCorto(texto) : '');
  }

  /* Un enlace de verdad, en otra pestaña y sin darle a la pagina de origen (noopener) */
  abrirEnlace(url) {
    /* Dos aperturas casi juntas (un toque que llega dos veces, un dedo nervioso) no abren dos pestañas */
    const ahora = performance.now();
    if (this.ultimoEnlace != null && ahora - this.ultimoEnlace < 600) return;
    this.ultimoEnlace = ahora;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.hidden = true;
    this.caja.append(a);
    a.click();
    a.remove();
    this.avisar('enlace');
  }

  /* Debajo del libro, los botones de las hojas que se ven, como botones de verdad: el teclado los alcanza */
  pintarBotones() {
    if (!this.fb) { this.tira.hidden = true; return; }
    const lista = this.botonesVisibles();
    this.tira.hidden = lista.length === 0;
    const tx = this.tx;
    this.tiraLista.replaceChildren(...lista.map(({ d }) => {
      const b = crear('button', 'tal-btn', d.texto || tx.vlBotonSinTexto);
      b.type = 'button';
      const nombre = `${d.texto || tx.vlBotonSinTexto}: ${d.accion === 'copiar' ? `${tx.vlBotonCopia}${d.copia ? ` «${textoCorto(d.copia)}»` : ''}` : tx.vlBotonEnlace}`;
      b.title = nombre;
      b.setAttribute('aria-label', nombre);
      b.addEventListener('click', () => this.tocarBoton(d));
      return b;
    }));
  }

  /* ---- El aviso ---- */
  /* La franja que dice que paso. Es una zona viva (role="status"): se vacia y se vuelve a llenar para que se lea tambien
     cuando repite lo mismo. `cfg` solo se pasa al probar (lo que aun no se guardo). */
  avisar(caso, texto, cfg, detalle = '') {
    const a = cfg || this.avisoDelLibro(), f = this.franja, tx = this.tx;
    const base = texto || textoDeAviso(a, caso, { copiado: tx.avisoCopiado, enlace: tx.avisoEnlace, falla: tx.avisoFalla });
    /* Lo que se copio, a la vista: un boton pudo traer otro texto que el que dice su rotulo (solo texto, nunca HTML) */
    const dicho = detalle ? `${base} · «${detalle}»` : base;
    this.vestirAviso(f, a);
    clearTimeout(this.relojAviso);
    f.classList.remove('tal-vl-aviso--visible');
    f.textContent = '';
    requestAnimationFrame(() => {
      f.textContent = dicho;
      f.classList.add('tal-vl-aviso--visible');
    });
    this.relojAviso = setTimeout(() => {
      f.classList.remove('tal-vl-aviso--visible');
      this.relojAviso = setTimeout(() => { f.textContent = ''; }, FRANJA_SALE_MS);
    }, a.segundos * 1000);
  }

  /* Los colores y el lugar de un aviso (franja o muestra): '' es el de siempre */
  vestirAviso(nodo, a) {
    const c = colorDeAviso(a);
    nodo.style.background = c.fondo;
    nodo.style.color = c.tinta;
    nodo.style.borderColor = c.fondo;
    if (nodo === this.franja) {
      nodo.classList.toggle('tal-vl-aviso--arriba', a.lugar === 'arriba');
      nodo.classList.toggle('tal-vl-aviso--abajo', a.lugar !== 'arriba');
    }
  }

  /* La ventana del aviso: sus campos dibujan una muestra al momento; solo «Listo» lo guarda en el libro */
  prepararAviso() {
    const d = this.dAviso, tx = this.tx;
    this.cAviso = {};
    for (const c of d.querySelectorAll('[data-vl-aviso-c]')) this.cAviso[c.dataset.vlAvisoC] = c;
    this.lAviso = [...d.querySelectorAll('[data-vl-aviso-lugar]')];
    this.sAviso = d.querySelector('[data-vl-aviso-segundos]');
    this.muestraAviso = d.querySelector('[data-vl-aviso-muestra]');
    const ps = (etiqueta, clave) => {
      const s = new SelectorColor({ tx, etiqueta, valor: '', recientes: this.recientes, alCambiar: (c) => { this.alColor(c); this.borrador[clave] = c; this.pintarMuestraAviso(); } });
      const l = crear('div', 'tal-colores__uno');
      l.append(crear('span', '', etiqueta), s.nodo);
      return [l, s];
    };
    const [lf, sf] = ps(tx.avisoFondo, 'fondo'), [lt, st] = ps(tx.avisoTinta, 'tinta');
    this.colAviso = { fondo: sf, tinta: st };
    d.querySelector('[data-vl-aviso-colores]').replaceChildren(lf, lt);
    this.borrador = limpiarAviso({});
    const leer = () => {
      for (const k of AVISO_CASOS) this.borrador[k] = this.cAviso[k].value;
      this.borrador.lugar = (this.lAviso.find((r) => r.checked) || { value: 'abajo' }).value;
      this.borrador.segundos = this.sAviso.value === '' ? undefined : Number(this.sAviso.value);
      this.pintarMuestraAviso();
    };
    for (const c of Object.values(this.cAviso)) c.addEventListener('input', leer);
    for (const r of this.lAviso) r.addEventListener('change', leer);
    this.sAviso.addEventListener('input', leer);
    d.querySelector('[data-vl-aviso-probar]').addEventListener('click', () => {
      const casos = AVISO_CASOS;
      this.avisar(casos[this.pruebas++ % casos.length], '', limpiarAviso(this.borrador));
    });
    d.querySelector('[data-vl-aviso-cancelar]').addEventListener('click', () => d.close());
    d.querySelector('[data-vl-aviso-listo]').addEventListener('click', () => {
      if (this.libroDe.puedeCambiar()) this.libroDe.cambiar({ aviso: limpiarAviso(this.borrador) });
      d.close();
    });
    /* Escape cierra solo la ventana: el visor no se entera */
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape') e.stopPropagation(); });
  }

  abrirAviso() {
    if (this.caja.hidden) return;
    const d = this.dAviso, a = this.avisoDelLibro(), puede = this.libroDe.puedeCambiar();
    this.borrador = { ...a };
    for (const k of AVISO_CASOS) { this.cAviso[k].value = a[k]; this.cAviso[k].disabled = !puede; }
    for (const r of this.lAviso) { r.checked = r.value === a.lugar; r.disabled = !puede; }
    this.sAviso.value = a.segundos;
    this.sAviso.disabled = !puede;
    this.colAviso.fondo.poner(a.fondo);
    this.colAviso.tinta.poner(a.tinta);
    this.colAviso.fondo.boton.disabled = this.colAviso.tinta.boton.disabled = !puede;
    d.querySelector('[data-vl-aviso-solo-leer]').hidden = puede;
    d.querySelector('[data-vl-aviso-listo]').disabled = !puede;
    this.pruebas = 0;
    this.pintarMuestraAviso();
    d.showModal();
  }

  /* La muestra de la ventana: la franja tal como queda con lo que se ha puesto */
  pintarMuestraAviso() {
    const a = limpiarAviso(this.borrador), m = this.muestraAviso, tx = this.tx;
    const franja = crear('div', 'tal-vl-aviso tal-vl-aviso--visible', textoDeAviso(a, 'copiado', { copiado: tx.avisoCopiado }));
    this.vestirAviso(franja, a);
    m.replaceChildren(franja);
  }
}
