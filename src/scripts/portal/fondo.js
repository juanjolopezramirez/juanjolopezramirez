/* La red de signos del fondo de The Alef Code (components/portal/Fondo.astro).

   Una rejilla de letras de las tres lenguas de la Escritura —hebreo, griego
   koine (las mayusculas de los papiros) y arameo (en letra siriaca, estrangela)—
   y signos de codigo, en un <canvas> que cubre la ventana. Cada signo esta casi apagado y respira con una ola lenta; cerca del
   puntero (o del dedo) se encienden en verde y algunos cambian de letra. Una
   franja mas clara baja despacio, como el barrido de una pantalla.

   TRES MODOS (2026-10-26, los pidio el fundador: «una matriz superinmersiva»).
   Los cambian entrar.js y panel.js con carga.js (`modoFondo`), sin saber nada
   de este lienzo:
     reposo   lo de siempre.
     carga    mientras se espera al servidor: cada columna llueve. La cabeza de
              la gota en blanco, la estela en el verde de la terminal, y la letra
              cambia al pasar. El barrido baja rapido y late en rojo (el tono de
              la carga). Solo aparece si la espera pasa de 150 ms: una carga
              rapida no destella.
     entrada  ya entraste: la lluvia se acelera, el campo se apaga y en el centro
              se DESCIFRA la א: bloques que titilan con letras y se fijan en
              verde, como los pixeles del logo. En el panel, si se llega desde el
              portal, la א empieza entera y se deshace en la lluvia (continuidad
              sin guardar nada en el navegador: lo dice la pagina de la que vienes).

   CUIDADOS
   - Con «reducir movimiento» se pinta UNA vez y no se anima nada (tampoco la
     lluvia ni la א: la pagina no espera por ellas, carga.js lo sabe).
   - El boton de pausa/play de la barra (WCAG 2.2.2) para la lava y los signos
     a mano: alterna los dos iconos y su nombre. Vale para esta visita: los guiones del portal no guardan nada en el
     navegador (tools/test-portal.mjs lo vigila).
   - Se para cuando la pestaña no se ve, y no pasa de ~30 cuadros por segundo.
   - La densidad de pixeles se limita a 1.5: es decoracion, no texto que leer.
   - Cada signo sale de su sitio en la rejilla, no del azar: si el telefono
     cambia de alto (la barra de direcciones que entra y sale) la red no
     parpadea, y solo se rehace entera si cambia el ancho.
   - Arranca enseguida (la carga es justo cuando mas se ve) y vuelve a pintar
     cuando llegan las letras (JetBrains Mono, que trae el griego, y Noto Sans
     Syriac, que trae el arameo). El hebreo lo dibuja la letra del sistema.
   - La א sale de los trazos del logo (assets/alef/logo.svg) con Path2D: nada
     de imagenes que cargar ni de leer pixeles.
   - Si llegas desde el sitio (`js-llegada`), encima de la red frenan las letras
     del salto al hiperespacio (salto.js) antes de que se encienda la ventana. */
import logoSvg from '../../assets/alef/logo.svg?raw';
import { saltar } from './salto.js';

const HEBREO = 'אבגדהוזחטיכלמנסעפצקרשת';
const GRIEGO = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
const ARAMEO = 'ܐܒܓܕܗܘܙܚܛܝܟܠܡܢܣܥܦܨܩܪܫܬ';
const CODIGO = '{}<>/$#=;:+01';
const SIGNOS = [...HEBREO, ...GRIEGO, ...ARAMEO, ...CODIGO];
const LETRA = '500 12px "JetBrains Mono", "Noto Sans Syriac", ui-monospace, monospace';
const LETRA_CHICA = '500 10px "JetBrains Mono", "Noto Sans Syriac", ui-monospace, monospace';
const PASO_ANCHO = 26;   // separacion de la rejilla en pantallas anchas
const PASO_ESTRECHO = 32; // y en el telefono, mas rala
const RADIO = 170;        // hasta donde llega la luz del puntero, en px
const CUADRO_MS = 33;     // ~30 cuadros por segundo
const ESPERA_CARGA = 150; // la lluvia no sale si la carga dura menos que esto
const LOGO_MS = 520;      // lo que tarda la א en descifrarse (o en deshacerse)
const LOGO_LADO = 22;     // bloques de ancho de la א
const RAPIDEZ = { reposo: 1, carga: 1, entrada: 2.6 };
const BLANCO = '#FFFFFF', VERDE = '#00FF66', ROJO = '#FF3B3B', IRIS = '#A9C47F', TIZA = '#F1EFE9';
const html = document.documentElement;

/* Los trazos del logo, una vez. Si el dibujo no se deja leer, no hay א (y nada se rompe). */
function leerLogo() {
  try {
    const caja = (logoSvg.match(/viewBox="([^"]+)"/) || [])[1].split(/\s+/).map(Number);
    const trazos = [...logoSvg.matchAll(/<path\b([^>]*)>/g)].map(([, attrs]) => ({
      camino: new Path2D((attrs.match(/\bd="([^"]+)"/) || [])[1] || ''),
      regla: /fill-rule="evenodd"/.test(attrs) ? 'evenodd' : 'nonzero'
    }));
    const prueba = document.createElement('canvas');
    prueba.width = Math.ceil(caja[2]); prueba.height = Math.ceil(caja[3]);
    const pc = prueba.getContext('2d');
    if (!pc || !trazos.length) return null;
    return { ancho: caja[2], alto: caja[3], dentro: (x, y) => trazos.some((t) => pc.isPointInPath(t.camino, x, y, t.regla)) };
  } catch (e) { return null; }
}

function iniciar(lienzo) {
  const ctx = lienzo.getContext('2d');
  if (!ctx) return;
  const reducir = matchMedia('(prefers-reduced-motion: reduce)');
  /* `?quieto=1`: vienes del portal con el fondo en pausa (entrar.js lo pone al ir al panel). */
  let pausado = new URLSearchParams(window.location.search).get('quieto') === '1';
  const quieto = () => reducir.matches || pausado;
  let ancho = 0, alto = 0, paso = PASO_ANCHO, celdas = [];
  let px = -9999, py = -9999, ultimo = 0, pedido = 0, antes = 0;
  const signoDe = (col, fila) => SIGNOS[(col * 7 + fila * 13 + ((col * fila) % 5)) % SIGNOS.length];
  const azar = () => SIGNOS[(Math.random() * SIGNOS.length) | 0];

  /* El modo y lo que va detras de el */
  let modo = 'reposo', cargaDesde = 0;
  let fuerza = 0;            // cuanto se ve la lluvia (0 a 1), siempre con suavidad
  let logoP = 0, logoMeta = 0;
  let fase = 0;              // donde va el barrido
  let columnas = [];         // por columna: sus celdas (por fila) y su gota
  let filas = 0;
  const logo = leerLogo();
  let bloques = [], lado = 0, centro = { x: 0, y: 0, r: 0 }, brillo = null;

  const gota = (arriba) => ({
    cab: arriba ? -Math.random() * filas * .6 : Math.random() * filas,
    vel: 7 + Math.random() * 13,                    // filas por segundo
    largo: 5 + ((Math.random() * 11) | 0),
    ultima: -1
  });

  function medirLogo() {
    bloques = [];
    if (!logo) return;
    const caja = Math.min(ancho, alto) * (ancho < 600 ? .52 : .36);
    lado = Math.max(6, Math.floor(caja / LOGO_LADO));
    const cols = LOGO_LADO, fls = Math.round(LOGO_LADO * logo.alto / logo.ancho);
    const x0 = Math.round((ancho - cols * lado) / 2), y0 = Math.round((alto - fls * lado) / 2);
    centro = { x: ancho / 2, y: alto / 2, r: Math.max(cols, fls) * lado * .8 };
    brillo = ctx.createRadialGradient(centro.x, centro.y, 0, centro.x, centro.y, centro.r);
    brillo.addColorStop(0, 'rgba(0,255,102,.16)');
    brillo.addColorStop(1, 'rgba(0,255,102,0)');
    for (let j = 0; j < fls; j++) {
      for (let i = 0; i < cols; i++) {
        if (!logo.dentro((i + .5) / cols * logo.ancho, (j + .5) / fls * logo.alto)) continue;
        bloques.push({ x: x0 + i * lado, y: y0 + j * lado, umbral: Math.random() * .8, c: azar() });
      }
    }
  }

  function medir() {
    const d = Math.min(window.devicePixelRatio || 1, 1.5);
    const nuevoAncho = window.innerWidth, nuevoAlto = window.innerHeight;
    const rehacer = nuevoAncho !== ancho;
    ancho = nuevoAncho; alto = nuevoAlto;
    lienzo.width = Math.round(ancho * d); lienzo.height = Math.round(alto * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    paso = ancho < 600 ? PASO_ESTRECHO : PASO_ANCHO;
    if (rehacer) { celdas = []; columnas = []; }
    const hechas = celdas.length ? Math.max(...celdas.map((k) => k.fila)) + 1 : 0;
    for (let fila = hechas, y = paso * .75 + hechas * paso; y < alto; fila++, y += paso) {
      for (let col = 0, x = paso / 2; x < ancho; col++, x += paso) {
        const k = { x, y, col, fila, c: signoDe(col, fila), f: ((col * 31 + fila * 17) % 628) / 100 };
        celdas.push(k);
        (columnas[col] ||= { celdas: [], gota: null }).celdas[fila] = k;
      }
    }
    filas = Math.ceil(alto / paso);
    columnas.forEach((c) => { c.gota ||= gota(false); });
    medirLogo();
  }

  /* Lo que se mueve por su cuenta: la lluvia, la א y el barrido. */
  function avanzar(dt) {
    const espera = modo === 'carga' && performance.now() - cargaDesde < ESPERA_CARGA;
    /* En la entrada, cuando la א ya esta entera la lluvia se calma: si el panel tarda en
       llegar, lo que queda en pantalla es el logo quieto, no una lluvia sin fin. */
    const descifrada = modo === 'entrada' && logoP >= 1;
    const meta = modo === 'reposo' || espera || descifrada ? 0 : 1;
    fuerza += (meta - fuerza) * Math.min(1, dt / (meta > fuerza ? 160 : 420));
    const pasoLogo = dt / LOGO_MS;
    logoP = logoMeta > logoP ? Math.min(logoMeta, logoP + pasoLogo) : Math.max(logoMeta, logoP - pasoLogo);
    fase = (fase + dt * .00005 * (modo === 'carga' && !espera ? 7 : 1)) % 1.3;
    if (fuerza < .01) return;
    const rapidez = RAPIDEZ[modo] || 1;
    for (const c of columnas) {
      const g = c.gota;
      g.cab += g.vel * rapidez * dt / 1000;
      const aqui = Math.floor(g.cab);
      if (aqui !== g.ultima) { g.ultima = aqui; if (c.celdas[aqui]) c.celdas[aqui].c = azar(); }
      if (g.cab - g.largo > filas) c.gota = gota(true);
    }
  }

  function pintar(t) {
    const mueve = !quieto();
    const dt = mueve && antes ? Math.min(100, t - antes) : 0;
    antes = mueve ? t : 0;
    if (mueve) avanzar(dt);
    const lluviaVe = mueve ? fuerza : 0;
    const logoVe = mueve ? logoP : 0;

    ctx.clearRect(0, 0, ancho, alto);
    tintaActual = null;
    ctx.font = LETRA;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const barrido = mueve ? (fase - .15) * alto : -9999;   // la franja que baja
    const latido = modo === 'carga' ? (.55 + .45 * Math.sin(t * .00628)) * lluviaVe : 0;   // ~1 vez por segundo
    const apagado = 1 - logoVe * .6;                         // el campo cede ante la א
    for (const k of celdas) {
      if (k.y > alto + paso) continue;
      const dx = k.x - px, dy = k.y - py;
      const cerca = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / RADIO);
      const ola = mueve ? (Math.sin(k.x * .011 + k.y * .007 - t * .0008 + k.f * .25) + 1) / 2 : .5;
      const franja = Math.max(0, 1 - Math.abs(k.y - barrido) / 90);
      const luz = (.045 + ola * .06 + franja * .12 * (1 - lluviaVe) + cerca * cerca * .6) * apagado;
      if (mueve && cerca > .45 && Math.random() < .03) k.c = azar();

      /* El color va fijo por familia y la luz en `globalAlpha` (un numero): nada de
         armar y leer miles de cadenas rgba() en cada cuadro. */
      let estela = 0;
      if (lluviaVe > .01) {
        const g = columnas[k.col] && columnas[k.col].gota;
        const d = g ? g.cab - k.fila : -1;
        if (d >= 0 && d < g.largo) estela = (1 - d / g.largo) * lluviaVe * apagado;
        if (estela > .05 && d < 1) { tinta(BLANCO, .45 + .55 * estela); ctx.fillText(k.c, k.x, k.y); continue; }
      }
      const rojo = franja * latido;
      if (rojo > estela && rojo > .05) tinta(ROJO, luz + rojo * .4);
      else if (estela > .02) tinta(VERDE, luz + estela * .85);
      else tinta(cerca > .3 ? IRIS : TIZA, luz);
      ctx.fillText(k.c, k.x, k.y);
    }

    if (logoVe > .001 && bloques.length) {
      tinta(brillo, logoVe);
      ctx.fillRect(centro.x - centro.r, centro.y - centro.r, centro.r * 2, centro.r * 2);
      ctx.font = LETRA_CHICA;
      for (const b of bloques) {
        const p = (logoVe - b.umbral) / .2;
        if (p <= 0) continue;
        if (p < 1) {
          if (Math.random() < .35) b.c = azar();
          tinta(BLANCO, .35 + .55 * p);
          ctx.fillText(b.c, b.x + lado / 2, b.y + lado / 2);
        } else {
          tinta(VERDE, .92);
          ctx.fillRect(b.x + 1, b.y + 1, lado - 2, lado - 2);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  let tintaActual = null;
  function tinta(color, luz) {
    if (color !== tintaActual) { ctx.fillStyle = color; tintaActual = color; }
    ctx.globalAlpha = Math.max(0, Math.min(1, luz));
  }

  function cuadro(t) {
    pedido = 0;
    if (document.hidden || quieto()) { antes = 0; return; }
    if (t - ultimo >= CUADRO_MS) { ultimo = t; pintar(t); }
    pedido = requestAnimationFrame(cuadro);
  }
  function arrancar() {
    if (quieto()) { pintar(0); return; }
    if (!pedido) pedido = requestAnimationFrame(cuadro);
  }

  /* Los modos: los pide carga.js (y lo deja escrito en <html> por si este lienzo
     arranca despues de que se pidiera). */
  function aplicar(nuevo, conLogo) {
    if (!Object.prototype.hasOwnProperty.call(RAPIDEZ, nuevo)) nuevo = 'reposo';
    if (nuevo === 'carga' && modo !== 'carga') cargaDesde = performance.now();
    modo = nuevo;
    logoMeta = modo === 'entrada' ? 1 : 0;
    if (conLogo) { logoP = 1; fuerza = 1; cargaDesde = -ESPERA_CARGA; }
  }
  document.addEventListener('alef:fondo', (e) => { aplicar(e.detail && e.detail.modo, e.detail && e.detail.logo); arrancar(); });

  /* El boton de pausa: solo tiene sentido si algo se mueve */
  const boton = document.querySelector('[data-fondo-pausa]');
  function reflejar() {
    html.classList.toggle('fondo-quieto', pausado);
    if (!boton) return;
    boton.hidden = reducir.matches;
    const nombre = pausado ? boton.dataset.seguir : boton.dataset.pausar;
    boton.setAttribute('aria-label', nombre);
    boton.title = nombre;
    boton.classList.toggle('is-quieto', pausado);
  }
  if (boton) {
    boton.addEventListener('click', () => {
      pausado = !pausado;
      reflejar();
      arrancar();
    });
  }

  /* Con el fondo quieto, el puntero repinta como mucho UNA vez por cuadro. */
  let pintura = 0;
  const repintar = () => { if (!pintura) pintura = requestAnimationFrame(() => { pintura = 0; pintar(0); }); };
  const mover = (e) => { px = e.clientX; py = e.clientY; if (quieto()) repintar(); };
  window.addEventListener('pointermove', mover, { passive: true });
  window.addEventListener('pointerdown', mover, { passive: true });
  html.addEventListener('pointerleave', () => { px = py = -9999; if (quieto()) repintar(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) arrancar(); });
  reducir.addEventListener?.('change', () => { reflejar(); arrancar(); });

  let espera = 0;
  window.addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(() => { medir(); if (quieto()) repintar(); }, 120);
  }, { passive: true });

  reflejar();
  medir();
  aplicar(html.dataset.fondo, html.dataset.fondoLogo === '1');
  arrancar();
  /* Vienes del sitio con el salto al hiperespacio: las letras llegan lanzadas y
     frenan aqui, detras de la ventana (salto.js). La cabecera solo pone
     `js-llegada` si no se pidio quietud; la pausa aqui aun no puede estar puesta. */
  if (html.classList.contains('js-llegada') && !quieto()) saltar('llegar', lienzo.parentElement);
  const letra = document.fonts?.load
    ? Promise.all([document.fonts.load('500 12px "JetBrains Mono"', GRIEGO), document.fonts.load('500 12px "Noto Sans Syriac"', ARAMEO)])
    : Promise.resolve();
  Promise.race([letra, new Promise((r) => setTimeout(r, 1500))]).catch(() => {}).then(() => { if (quieto()) pintar(0); });
}

document.querySelectorAll('[data-signos]').forEach(iniciar);
