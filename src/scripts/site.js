/* =============================================================
   site.js — todo el comportamiento del cliente, en un solo sitio.

   Ojo: el TEXTO ya no se cambia aqui. Astro lo escribe en el
   servidor, un idioma por URL. Este archivo solo se ocupa de:
     · abrir y cerrar menu, hoja de plataformas y glosario
     · el selector de idioma (que ahora navega, no traduce)
     · las animaciones de entrada
   ============================================================= */
import { TERMS } from '../i18n/terms.js';
import { CARDS, GLOSS } from '../i18n/term-cards.js';
import { VIDEOS } from '../data/videos.js';
import { UI } from '../i18n/ui.js';
import { CONTACT } from '../data/social.js';

const d = document;
const lang = d.documentElement.lang || 'es';
const t = (k) => (UI[lang] && UI[lang][k]) || UI.en[k] || k;

/* Bloquear el scroll deja un style="" vacio; se retira al soltar.

   Se cuenta en vez de encenderse y apagarse porque las hojas se apilan:
   la de las cuentas se abre desde la de las plataformas, y al cerrar la
   de encima el scroll tiene que seguir bloqueado por la de debajo. */
let locks = 0;
function lockScroll(on) {
  locks = Math.max(0, locks + (on ? 1 : -1));
  if (locks > 0) { d.body.style.overflow = 'hidden'; return; }
  d.body.style.removeProperty('overflow');
  if (!d.body.getAttribute('style')) d.body.removeAttribute('style');
}

/* ---------- Cabecera ----------------------------------------
   En escritorio la cabecera flota transparente sobre el hero. En
   cuanto la pagina se mueve, vuelve a ponerse el pinar detras para
   que la pastilla no quede suelta sobre la seccion de hueso.      */
function initHeader() {
  const header = d.querySelector('.site-header');
  if (!header) return;
  const hero = d.querySelector('.hero');
  let ticking = false;

  const sync = () => {
    const moved = scrollY > 24;
    header.classList.toggle('is-scrolled', moved);
    /* Tambien en la raiz: hay cosas fuera de la cabecera —el boton de
       movil— que quieren saber si la pagina ya se movio. */
    d.documentElement.classList.toggle('is-scrolled', moved);

    /* La firma espera a que el nombre grande salga de pantalla. Sin hero
       —las paginas interiores— no hay nada que esperar. */
    header.classList.toggle('is-past-hero', !hero || scrollY > hero.offsetHeight * 0.6);

    ticking = false;
  };
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sync);
  }, { passive: true });
  sync();
}

/* ---------- El campo verde ----------------------------------
   La UNICA logica que mueve el fondo. No anima elementos: mueve el
   degradado, escribiendo tres variables que el CSS usa para colocar y
   dimensionar la masa de luz.

   Va con senos y no con fotogramas a proposito. Un seno frena solo al
   llegar a los extremos y cambia de sentido sin canto — es el easing,
   no algo aplicado encima. Y como los tres van a periodos que no encajan
   entre si, el conjunto no vuelve nunca a repetirse igual.

   Los margenes de movimiento no estan aqui: los declara el CSS, que es
   quien sabe si estamos en movil o en escritorio. Este bucle solo los
   lee y se mueve dentro de ellos.                                     */
function initFieldGlow() {
  const field = d.querySelector('.hero__field, .phero__field, .cpage__field');
  if (!field) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const TAU = Math.PI * 2;
  let cfg, raf = 0, last = 0, onScreen = true;
  let mx = 0, my = 0, tmx = 0, tmy = 0;

  /* El CSS manda: aqui solo se leen los limites que haya puesto para
     este ancho de pantalla. Se relee al cambiar de tamano. */
  const readCfg = () => {
    const cs = getComputedStyle(field);
    const n = (k, f) => { const v = parseFloat(cs.getPropertyValue(k)); return isNaN(v) ? f : v; };
    cfg = {
      cycle: n('--iris-cycle', 11) * 1000,
      xMid:  n('--iris-x-mid', 69), xAmp: n('--iris-x-amp', 9),
      yMid:  n('--iris-y-mid', 61), yAmp: n('--iris-y-amp', 8),
      breath: n('--iris-breath-amp', .17),
      pull:  n('--iris-pull', 2)
    };
  };

  const tick = (now) => {
    /* A ~30 por segundo basta: lo que se mueve tarda once segundos en dar
       la vuelta, y repintar la mitad de veces cuesta la mitad. */
    if (now - last > 32) {
      last = now;
      const t = (now / cfg.cycle) * TAU;
      mx += (tmx - mx) * 0.03;            // el raton llega tarde, a proposito
      my += (tmy - my) * 0.03;
      const x = cfg.xMid + cfg.xAmp * Math.sin(t)              + mx * cfg.pull;
      const y = cfg.yMid + cfg.yAmp * Math.sin(t * 0.73 + 1.1) + my * cfg.pull;
      const b = 1 + cfg.breath * Math.sin(t * 0.61 + 2.3);
      field.style.setProperty('--iris-x', x.toFixed(2) + '%');
      field.style.setProperty('--iris-y', y.toFixed(2) + '%');
      field.style.setProperty('--iris-breath', b.toFixed(4));
    }
    raf = requestAnimationFrame(tick);
  };

  const start = () => { if (!raf && onScreen && !d.hidden) raf = requestAnimationFrame(tick); };
  const stop  = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  readCfg();
  addEventListener('resize', readCfg, { passive: true });

  /* Nada se pinta si el hero no esta a la vista, ni si la pestana lo esta. */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen ? start() : stop(); })
      .observe(field);
  }
  d.addEventListener('visibilitychange', () => (d.hidden ? stop() : start()));

  if (!matchMedia('(hover: none)').matches) {
    addEventListener('pointermove', (e) => {
      tmx = (e.clientX / innerWidth  - 0.5) * 2;
      tmy = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  start();
}

/* ---------- Menu ------------------------------------------- */
function initNav() {
  const btn = d.querySelector('.nav-toggle');
  const nav = d.getElementById('site-nav');
  if (!btn || !nav) return;

  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-label', t(open ? 'a11y.menuClose' : 'a11y.menu'));
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  /* Elegir una fila cierra el menu, sea la que sea. Escribirme es un
     boton y no un enlace, asi que sin nombrarlo se quedaba abierto por
     detras de la hoja — y el menu seguia diciendo que estaba desplegado. */
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a, [data-open-contact]')) setOpen(false);
  });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); }
  });
}

/* ---------- Hoja generica ----------------------------------
   Las hojas se pueden apilar —la de las cuentas se abre desde la de las
   plataformas—, asi que hay una pila. Sirve para dos cosas: que Escape
   cierre solo la de encima, y que el scroll no se suelte antes de
   tiempo. */
const openSheets = [];

function sheet(panelId, closeAttr) {
  const panel = d.getElementById(panelId);
  if (!panel) return null;
  const closeBtn = panel.querySelector('button[' + closeAttr + ']');
  let lastFocus = null;

  const open = () => {
    if (openSheets.includes(panel)) return;
    lastFocus = d.activeElement;
    panel.hidden = false;
    void panel.offsetHeight;              // punto de partida para la transicion
    panel.classList.add('is-open');
    openSheets.push(panel);
    lockScroll(true);
    if (closeBtn) closeBtn.focus();
  };
  const close = () => {
    const i = openSheets.indexOf(panel);
    if (i === -1) return;                 // ya estaba cerrada: no contar de menos
    openSheets.splice(i, 1);
    panel.classList.remove('is-open');
    lockScroll(false);
    setTimeout(() => { if (!panel.classList.contains('is-open')) panel.hidden = true; }, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  panel.querySelectorAll('[' + closeAttr + ']').forEach((el) => el.addEventListener('click', close));
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openSheets[openSheets.length - 1] === panel) close();
  });
  return { panel, open, close };
}

function initSocial() {
  const s = sheet('social-panel', 'data-close-social');
  const opener = d.querySelector('[data-open-social]');
  if (s && opener) opener.addEventListener('click', s.open);
}
/* ---------- Dos cuentas, una por idioma ----------------------
   Instagram y TikTok tienen casa en español y casa en ingles. La ficha
   sigue siendo un enlace de verdad: sin JavaScript lleva a la de casa,
   que es la de español. Aqui se le pone la hoja delante.

   Solo se intercepta el clic limpio. Con Ctrl, con Cmd, con Mayus o con
   el boton de en medio se abre el enlace tal cual: quien pide una
   pestana nueva esta pidiendo el destino, no una pregunta. */
/* «Caminemos» abre la hoja de las tres puertas. Hay dos botones que la
   abren —el de la barra ancha y el del menu— y en las paginas de seccion
   uno mas, asi que se cablean todos y no solo el primero. */
function initContact() {
  const s = sheet('contact-panel', 'data-close-contact');
  if (!s) return;
  d.querySelectorAll('[data-open-contact]').forEach((b) => b.addEventListener('click', s.open));
}

function initAccounts() {
  const s = sheet('account-panel', 'data-close-account');
  if (!s) return;
  const title = d.getElementById('account-panel-title');
  const groups = d.querySelectorAll('[data-account-group]');

  d.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const chip = e.target.closest('[data-accounts]');
    if (!chip) return;
    e.preventDefault();
    const id = chip.getAttribute('data-accounts');
    groups.forEach((g) => { g.hidden = g.getAttribute('data-account-group') !== id; });
    title.textContent = chip.getAttribute('data-account-name') || '';
    s.open();
  });
}

/* ---------- La altura, quieta --------------------------------
   `--vh0` se escribe en la cabecera, antes de pintar. Aqui solo se
   vigila si hace falta volver a medirla.

   La condicion es el ANCHO, no el alto. Esconder la barra del navegador
   cambia el alto y nada mas; girar el telefono cambia los dos. Mirando
   solo el ancho se distingue una cosa de la otra sin tener que adivinar:
   si el ancho no se mueve, no ha pasado nada que justifique recolocar la
   pagina. Eso deja fuera tambien al teclado, que sube y baja el alto. */
function initViewportLock() {
  let w = innerWidth;
  addEventListener('resize', () => {
    if (Math.abs(innerWidth - w) < 40) return;
    w = innerWidth;
    d.documentElement.style.setProperty('--vh0', innerHeight + 'px');
  }, { passive: true });
}

/* ---------- Lo que sale de la foto --------------------------
   Con raton los objetos salen al pasar por encima y se recogen al
   salir; de eso se encarga `:hover` y aqui no hace falta nada.

   En una pantalla tactil no hay `hover`: el primer toque los saca y el
   segundo los recoge. Es la copia entera la que escucha, no un boton
   —no hay nada que pulsar, solo una foto que se abre. */
function initOrbit() {
  const fig = d.querySelector('[data-orbit]');
  if (!fig) return;

  /* La salida no puede existir antes del primer contacto: hasta que no
     han salido una vez, no hay nada de lo que despedirse. */
  const played = () => fig.classList.add('has-played');
  fig.addEventListener('pointerenter', played, { once: true });

  if (matchMedia('(hover: hover)').matches) return;   // con raton manda el CSS
  fig.addEventListener('click', () => { played(); fig.classList.toggle('is-open'); });
}

/* ---------- Selector de idioma ------------------------------
   Ya no traduce: cada bandera es un enlace a la misma pagina en
   otro idioma. Solo abre y cierra.                              */
function initLang() {
  const root = d.querySelector('[data-lang]');
  if (!root) return;
  const btn  = root.querySelector('[data-lang-toggle]');
  const list = root.querySelector('.lang__list');
  const info = root.querySelector('[data-lang-info]');
  let hideTimer = null;

  const setNote = (open) => {
    root.classList.toggle('is-note-open', open);
    if (info) info.setAttribute('aria-expanded', String(open));
  };

  const setOpen = (open) => {
    clearTimeout(hideTimer);
    btn.setAttribute('aria-expanded', String(open));

    if (open) {
      list.hidden = false;
      void list.offsetHeight;              // punto de partida para la entrada
      root.classList.add('is-open', 'has-used');
    } else {
      root.classList.remove('is-open');
      setNote(false);                      // la nota no sobrevive al cierre
      // Se esconde al terminar la salida, no antes: si no, no hay salida.
      hideTimer = setTimeout(() => {
        if (!root.classList.contains('is-open')) list.hidden = true;
      }, 440);
    }
  };

  btn.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));

  if (info) {
    info.addEventListener('click', () =>
      setNote(!root.classList.contains('is-note-open')));
  }

  root.querySelectorAll('[data-lang-close]').forEach((el) =>
    el.addEventListener('click', () => setOpen(false)));

  d.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !root.classList.contains('is-open')) return;
    // Escape cierra primero la nota; el segundo cierra la hoja.
    if (root.classList.contains('is-note-open')) { setNote(false); return; }
    setOpen(false); btn.focus();
  });

  d.addEventListener('click', (e) => {
    if (!root.contains(e.target) && root.classList.contains('is-open')) setOpen(false);
  });
}

/* ---------- Apariencia: el interruptor y los cuatro modos -----
   EL INTERRUPTOR cambia al momento a la contraria de la que se ve, y la
   deja fija. La hoja con los cuatro modos no tiene boton propio: sale al
   dejar el raton encima, manteniendo pulsado con el dedo o con la flecha
   abajo. Elegir cambia la pagina —con los colores fundiendose— y la hoja se cierra un
   instante despues, para que se vea el visto moverse a la elegida.

   Se guarda en este navegador: `claro`, `oscuro` o `sol`. Automatico no
   se guarda — se borra lo guardado y manda el dispositivo. La cabecera lo
   pone antes de pintar en la pagina siguiente (Base.astro), y si hay otra
   pestaña abierta, cambia con esta.

   SEGUN EL SOL: `data-tema` lleva la que toca AHORA, claro u oscuro, y
   se vuelve a mirar cada minuto y al volver a la pestaña. El lugar se saca
   una sola vez de la zona horaria (data/zonas.js, que se baja solo
   entonces) y se guarda; la cuenta del sol vive en la cabecera (jlrSol). */
function initTema() {
  const html = d.documentElement;
  const root = d.querySelector('[data-tema-picker]');
  if (!root) return;
  const interruptor = root.querySelector('[data-tema-switch]');
  const list = root.querySelector('.lang__list');
  const opciones = [...root.querySelectorAll('[data-tema-set]')];
  const oscuroSistema = matchMedia('(prefers-color-scheme: dark)');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MODOS = ['claro', 'oscuro', 'sol'];
  let hideTimer = null;
  let fundido = null;
  let cierre = null;
  let reloj = null;
  let abrirTimer = null;
  let soltarTimer = null;
  let zonaLuego = () => {};                // la monta SOLO DONDE SE NOTA, mas abajo
  let pulsado = null;
  let largo = false;

  const leer = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const escribir = (k, v) => {
    try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }
    catch (e) { /* sin almacenamiento: vale para esta pagina */ }
  };
  const valido = (m) => (MODOS.includes(m) ? m : 'sistema');
  let elegido = valido(leer('jlr:tema'));

  const oscuroAhora = () => {
    const t = html.getAttribute('data-tema');
    return t ? t === 'oscuro' : oscuroSistema.matches;
  };

  const pintar = () => {
    const toca = elegido === 'sol' ? (window.jlrSol ? window.jlrSol() : null) : elegido;
    const nuevo = toca === 'claro' || toca === 'oscuro' ? toca : null;
    if (nuevo !== html.getAttribute('data-tema')) {
      if (!reducido) {
        html.classList.add('tema-cambia');
        clearTimeout(fundido);
        fundido = setTimeout(() => { html.classList.remove('tema-cambia'); zonaLuego(0); }, 480);
      }
      if (nuevo) html.setAttribute('data-tema', nuevo);
      else html.removeAttribute('data-tema');
    }
    interruptor.setAttribute('aria-checked', String(oscuroAhora()));
    opciones.forEach((b) =>
      b.setAttribute('aria-pressed', String(b.getAttribute('data-tema-set') === elegido)));
    clearInterval(reloj);
    if (elegido === 'sol') reloj = setInterval(pintar, 60000);
  };

  const elegir = (modo) => {
    elegido = modo;
    escribir('jlr:tema', modo === 'sistema' ? null : modo);
    pintar();
    if (modo === 'sol' && !leer('jlr:sol')) {
      import('../data/zonas.js').then(({ lugar }) => {
        const c = lugar();
        if (!c) return;                   // se queda con la estimacion
        escribir('jlr:sol', c);
        pintar();
      }).catch(() => {});
    }
  };

  const enfocar = () =>
    (opciones.find((b) => b.getAttribute('aria-pressed') === 'true') || opciones[0]).focus();

  const setOpen = (open, foco = false) => {
    clearTimeout(hideTimer);
    clearTimeout(abrirTimer);
    clearTimeout(soltarTimer);
    if (open) {
      if (!root.classList.contains('is-open')) {
        list.hidden = false;
        void list.offsetHeight;            // punto de partida para la entrada
        root.classList.add('is-open', 'has-used');
      }
      if (foco) enfocar();
    } else {
      root.classList.remove('is-open');
      hideTimer = setTimeout(() => {
        if (!root.classList.contains('is-open')) list.hidden = true;
        zonaLuego(0);
      }, 440);
    }
  };

  interruptor.addEventListener('click', () => {
    clearTimeout(abrirTimer);              // quien pulsa quiere cambiar, no la hoja
    if (largo) { largo = false; return; }  // venia de mantener pulsado
    elegir(oscuroAhora() ? 'claro' : 'oscuro');
  });

  /* Mantener pulsado (dedo o lapiz) abre la hoja en vez de cambiar. */
  interruptor.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    largo = false;
    clearTimeout(pulsado);
    pulsado = setTimeout(() => { largo = true; setOpen(true); }, 480);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
    interruptor.addEventListener(ev, () => clearTimeout(pulsado)));
  interruptor.addEventListener('contextmenu', (e) => e.preventDefault());

  interruptor.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown') return;
    e.preventDefault();
    setOpen(true, true);
  });

  /* Con raton: encima un momento abre la hoja; al salir se cierra. Los
     retrasos dejan cruzar el hueco entre el boton y la hoja. Cuenta el
     RATON de verdad, no si la pantalla dice tener uno: un portatil tactil
     con raton se lo cree a medias. Y solo en escritorio: en movil el boton
     aparece y se va segun la zona, y si asoma bajo un cursor quieto —una
     tablet con trackpad— la hoja se abria sola. */
  const porRaton = (e) => e.pointerType === 'mouse' && matchMedia('(min-width: 1024px)').matches;
  root.addEventListener('pointerenter', (e) => {
    if (!porRaton(e)) return;
    clearTimeout(soltarTimer);
    if (!root.classList.contains('is-open')) abrirTimer = setTimeout(() => setOpen(true), 450);
  });
  root.addEventListener('pointerleave', (e) => {
    if (!porRaton(e)) return;
    clearTimeout(abrirTimer);
    if (root.classList.contains('is-open')) soltarTimer = setTimeout(() => setOpen(false), 320);
  });

  opciones.forEach((b) => b.addEventListener('click', () => {
    elegir(b.getAttribute('data-tema-set'));
    clearTimeout(cierre);
    cierre = setTimeout(() => setOpen(false), reducido ? 0 : 560);
  }));

  root.querySelectorAll('[data-tema-close]').forEach((el) => el.addEventListener('click', () => setOpen(false)));
  d.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !root.classList.contains('is-open')) return;
    const volver = root.contains(d.activeElement);
    setOpen(false);
    if (volver) interruptor.focus();
  });
  d.addEventListener('click', (e) => {
    if (!root.contains(e.target) && root.classList.contains('is-open')) setOpen(false);
  });

  /* SOLO DONDE SE NOTA (movil y tablet, donde el boton cuelga del canto).

     El tema solo cambia el papel: el hero, las paginas de Caminemos, el cielo
     del planeta y la cinta de aliados son de noche siempre. Pulsar el boton
     sobre ellos no cambiaba nada que se viera, y un boton que no hace nada
     parece roto. Asi que asoma solo cuando lo que hay en pantalla es papel, y
     se hunde en el canto cuando no.

     Como se sabe si es papel: se miran tres puntos de la pantalla y, en cada
     uno, la primera superficie GRANDE que pinta algo (una foto o una ficha
     pequeña no cuentan). Si su color es uno de los papeles del tema puesto
     —`--papel`, `--papel-2`, `--papel-alto`—, ahi se nota. Un campo o un
     cielo pintan con degradado: eso ya dice que no. Basta con dos de tres.

     No se mira durante el salto entre pantallas ni mientras los colores se
     funden: a mitad de camino el color no es ni uno ni otro. */
  const colgado = matchMedia('(max-width: 1023px)');
  const muestra = d.createElement('i');
  muestra.hidden = true;
  d.body.appendChild(muestra);
  const aRgb = (v) => { muestra.style.color = ''; muestra.style.color = v; return getComputedStyle(muestra).color; };
  const transparente = (c) => c === 'transparent' || /^rgba\([^)]*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);

  const fondoEn = (x, y) => {
    for (const el of d.elementsFromPoint(x, y)) {
      if (el === root || el.closest('.site-header, .lang__list, .lang__scrim, [aria-modal="true"]')) continue;
      if (el.getBoundingClientRect().width < innerWidth * 0.6) continue;
      const s = getComputedStyle(el);
      if (s.backgroundImage !== 'none') return null;
      if (!transparente(s.backgroundColor)) return s.backgroundColor;
    }
    return null;
  };
  const hayPapel = () => {
    const cs = getComputedStyle(html);
    const papeles = new Set(['--papel', '--papel-2', '--papel-alto'].map((v) => aRgb(cs.getPropertyValue(v).trim())));
    const x = innerWidth / 2;
    return [0.38, 0.62, 0.86].filter((f) => papeles.has(fondoEn(x, innerHeight * f))).length >= 2;
  };

  let dentro = null;
  const zona = () => {
    if (!colgado.matches) {
      root.classList.remove('is-fuera', 'is-dentro', 'is-quieta');
      root.inert = false;
      dentro = null;
      return;
    }
    if (root.classList.contains('is-open') || html.classList.contains('tema-cambia')) return;
    const toca = hayPapel();
    if (toca === dentro) return;
    /* La primera vez que no toca, se esconde sin despedirse: al abrir la
       pagina no hay nada de lo que irse. */
    const primera = dentro === null;
    dentro = toca;
    root.classList.toggle('is-quieta', primera && !toca);
    root.classList.toggle('is-dentro', toca);
    root.classList.toggle('is-fuera', !toca);
    root.inert = !toca;
  };
  let relojZona = 0;
  zonaLuego = (ms = 160) => { clearTimeout(relojZona); relojZona = setTimeout(zona, ms); };
  addEventListener('scroll', () => zonaLuego(), { passive: true });
  addEventListener('scrollend', () => zonaLuego(40));
  addEventListener('resize', () => zonaLuego(200));
  colgado.addEventListener('change', () => zonaLuego(0));
  addEventListener('load', () => zonaLuego(0));
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => zonaLuego(0));
  zona();

  // Otra pestaña, el dispositivo o volver a esta: se repinta lo que toque.
  addEventListener('storage', (e) => {
    if (e.key === 'jlr:tema') elegido = valido(e.newValue);
    if (e.key === 'jlr:tema' || e.key === 'jlr:sol') pintar();
  });
  oscuroSistema.addEventListener('change', pintar);
  d.addEventListener('visibilitychange', () => { if (!d.hidden && elegido === 'sol') pintar(); });

  pintar();
}

/* ---------- Lo que aun no esta -------------------------------
   Un boton marcado con data-soon dice por que no lleva a ningun sitio.
   El aviso se anuncia solo (role=status) y se retira a los seis segundos. */
function initSoon() {
  const box = d.getElementById('toast');
  const text = d.getElementById('toast-text');
  if (!box || !text) return;
  let timer;

  const hide = () => {
    clearTimeout(timer);
    box.classList.remove('is-open');
    setTimeout(() => { if (!box.classList.contains('is-open')) box.hidden = true; }, 320);
  };
  const show = (key) => {
    text.textContent = t(key);
    box.hidden = false;
    void box.offsetHeight;                 // punto de partida para la transicion
    box.classList.add('is-open');
    clearTimeout(timer);
    timer = setTimeout(hide, 6000);
  };

  d.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-soon]');
    if (btn) { show(btn.getAttribute('data-soon')); return; }
    if (e.target.closest('[data-close-toast]')) hide();
  });
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) hide(); });
}

/* ---------- Glosario ---------------------------------------- */
const LETTER = /[0-9A-Za-zÀ-ÖØ-öø-ÿ]/;

function linkTerms() {
  const forms = [];
  Object.keys(TERMS).forEach((id) => TERMS[id].forms.forEach((f) => forms.push({ id, f })));
  forms.sort((a, b) => b.f.length - a.f.length);
  const re = new RegExp('(' + forms.map((x) => x.f).join('|') + ')', 'gi');
  const lookup = forms.reduce((a, x) => (a[x.f.toLowerCase()] = x.id, a), {});

  d.querySelectorAll('[data-glossary]').forEach((scope) => {
    const walker = d.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.parentElement && n.parentElement.closest('.term')) continue;
      re.lastIndex = 0;
      if (re.test(n.nodeValue)) nodes.push(n);
    }
    nodes.forEach((node) => {
      const text = node.nodeValue;
      const frag = d.createDocumentFragment();
      let last = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        const start = m.index, end = start + m[0].length;
        if (LETTER.test(text.charAt(start - 1) || '') || LETTER.test(text.charAt(end) || '')) continue;
        /* Un <button> es una caja atomica para el navegador, y eso abre un
           punto de corte a su lado donde las reglas normales no lo
           permitirian: "la Verdad (Emet)" partia justo detras del
           parentesis y lo dejaba solo al final del renglon. No se arregla
           desde CSS —un boton ignora `display: inline`—, asi que la
           puntuacion que abre antes y la que cierra despues se meten con el
           termino en una misma caja que no se puede partir. */
        let pre = text.slice(last, start);
        const open = (pre.match(/[([«¿¡"'\u2018\u201C]+$/) || [''])[0];
        if (open) pre = pre.slice(0, -open.length);
        const close = (text.slice(end).match(/^[)\]»"'.,;:!?\u2019\u201D]+/) || [''])[0];

        if (pre) frag.appendChild(d.createTextNode(pre));

        const b = d.createElement('button');
        b.type = 'button';
        b.className = 'term';
        b.setAttribute('data-term', lookup[m[0].toLowerCase()]);
        b.textContent = m[0];

        const wrap = d.createElement('span');
        wrap.className = 'term-wrap';
        if (open) wrap.appendChild(d.createTextNode(open));
        wrap.appendChild(b);
        if (close) wrap.appendChild(d.createTextNode(close));
        frag.appendChild(wrap);

        last = end + close.length;
      }
      if (!last) return;
      if (last < text.length) frag.appendChild(d.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  });
}

/* Ensena una de las tres lecturas y marca su pestana. `aria-selected` no
   es decoracion: es lo unico que le dice a quien escucha cual esta puesta,
   y ademas es de lo que cuelga el pez que se termina de dibujar. */
let pickCard = () => {};

function initGlossary() {
  const s = sheet('term-panel', 'data-close-term');
  if (!s) return;
  const el = (id) => d.getElementById(id);
  linkTerms();

  const tabsBar = el('term-tabs');
  pickCard = (cards, which) => {
    const text = cards[which] || cards.now;
    el('term-panel-card').textContent = text[lang] || text.es;
    tabsBar.querySelectorAll('[data-card]').forEach((b) => {
      b.setAttribute('aria-selected', String(b.getAttribute('data-card') === which));
    });
  };

  tabsBar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-card]');
    if (!b) return;
    const cards = CARDS[d.querySelector('.term-panel__sheet').getAttribute('data-term')];
    if (cards) pickCard(cards, b.getAttribute('data-card'));
  });

  d.addEventListener('click', (e) => {
    const btn = e.target.closest('.term');
    if (!btn) return;
    const term = TERMS[btn.getAttribute('data-term')];
    if (!term) return;
    d.querySelector('.term-panel__sheet').setAttribute('data-term', btn.getAttribute('data-term'));
    el('term-panel-script').textContent = term.script;
    el('term-panel-script').setAttribute('dir', term.dir);
    el('term-panel-script').setAttribute('lang', term.dir === 'rtl' ? 'he' : 'el');
    el('term-panel-title').textContent = term.title[lang] || term.title.en;
    /* «Verdad · Hebreo biblico»: la palabra en una palabra, y despues de
       donde viene. Es el mismo orden del mini-logo. */
    const gloss = GLOSS[btn.getAttribute('data-term')];
    const idioma = term.language[lang] || term.language.en;
    el('term-panel-meta').textContent = gloss ? (gloss[lang] || gloss.es) + ' · ' + idioma : idioma;
    /* Con tres lecturas manda la barra de pestanas y el parrafo unico se
       va; sin ellas —Timoteo— vuelve el parrafo de siempre. */
    const cards = CARDS[btn.getAttribute('data-term')];
    const tabs = el('term-tabs');
    const card = el('term-panel-card');
    const def = el('term-panel-def');

    tabs.hidden = !cards;
    card.hidden = !cards;
    def.hidden = !!cards;
    if (!cards) {
      def.textContent = term.def[lang] || term.def.en;
    } else {
      pickCard(cards, 'now');
    }

    /* Lo que solo tiene Timoteo. Cada hueco se vacia primero: la hoja es
       una sola y la reutilizan las cinco palabras, asi que lo que dejo la
       anterior tiene que irse antes de pintar la siguiente. */
    const pick = (o) => (o ? (o[lang] || o.en || o.es) : '');

    const dt = el('term-panel-deftitle');
    dt.textContent = pick(term.defTitle);
    dt.hidden = !term.defTitle;

    const secs = el('term-panel-sections');
    secs.textContent = '';
    secs.hidden = !term.sections;
    (term.sections || []).forEach((sec) => {
      const h = d.createElement('h3');
      h.className = 'term-panel__deftitle';
      h.textContent = pick(sec.title);
      const b = d.createElement('p');
      b.className = 'term-panel__def';
      b.textContent = pick(sec.body);
      secs.append(h, b);
    });

    const pil = el('term-panel-pillars');
    pil.textContent = '';
    pil.hidden = !term.pillars;
    if (term.pillars) {
      const h = d.createElement('h3');
      h.className = 'term-panel__deftitle';
      h.textContent = pick(term.pillars.title);
      pil.appendChild(h);
      term.pillars.items.forEach((it) => {
        const det = d.createElement('details');
        det.className = 'pillar';
        const sum = d.createElement('summary');
        sum.className = 'pillar__head';
        sum.innerHTML = '<span class="pillar__n" aria-hidden="true"></span>' +
                        '<span class="pillar__name"></span>' +
                        '<span class="pillar__mark" aria-hidden="true"></span>';
        sum.querySelector('.pillar__n').textContent = it.n;
        sum.querySelector('.pillar__name').textContent = pick(it.label);
        const body = d.createElement('p');
        body.className = 'pillar__text';
        body.textContent = pick(it.body);
        det.append(sum, body);
        pil.appendChild(det);
      });
    }

    /* No todas las palabras llevan fuente. La de Timoteo se explica sola
       y la ficha se queda mas limpia sin el aparato bibliografico. */
    const cite = d.querySelector('.term-panel__cite');
    el('term-panel-source').textContent = term.source || '';
    if (cite) cite.hidden = !term.source;
    s.open();
  });
}

/* La ficha de las piezas: el icono la despliega y la pliega. Misma idea
   que la nota del selector de idioma — la aclaracion esta ahi para quien
   la busca y no estorba a quien no. */
/* Dos pasos: el abanico abre la galeria, y de la galeria se entra en la
   ficha de una pieza. La hoja es una sola y cambia de cara — volver es
   ensenar otra vez la galeria, no cerrar y reabrir nada. */
function initCovers() {
  const fan = d.querySelector('[data-covers-open]');
  if (!fan) return;
  const sheetV = sheet('video-panel', 'data-close-video');
  if (!sheetV) return;
  const el = (id) => d.getElementById(id);
  const gallery = el('video-gallery');
  const detail = el('video-detail');

  const showGallery = () => { detail.hidden = true; gallery.hidden = false; };

  fan.addEventListener('click', () => { showGallery(); sheetV.open(); });

  d.addEventListener('click', (e) => {
    if (e.target.closest('[data-video-back]')) { showGallery(); return; }

    const pickBtn = e.target.closest('[data-video]');
    if (!pickBtn) return;
    const v = VIDEOS.find((x) => x.id === pickBtn.getAttribute('data-video'));
    if (!v) return;

    const pick = (o) => (o ? (o[lang] || o.es) : '');
    el('video-detail-webp').srcset = v.webp || '';
    el('video-detail-img').src = v.src;
    el('video-detail-img').alt = v.title.es;
    el('video-detail-title').textContent = pick(v.title);

    /* El titulo original solo cuando se esta leyendo en otro idioma: es lo
       que se ve escrito en la portada, y en español no hay nada que aclarar. */
    const orig = el('video-detail-orig');
    orig.textContent = v.title.es;
    orig.hidden = lang === 'es';

    el('video-detail-blurb').textContent = pick(v.blurb);

    /* Para quien se hizo. Las fichas de todas las marcas ya estan escritas:
       aqui solo se ensena la de esta pieza y se esconden las demas. Si la
       pieza no declara marca, el apartado entero se va — un rotulo que
       dice "Realizado para" y debajo nada es peor que no decir nada. */
    let conMarca = false;
    d.querySelectorAll('[data-brand]').forEach((p) => {
      const mia = p.getAttribute('data-brand') === v.for;
      p.hidden = !mia;
      if (mia) conMarca = true;
    });
    el('video-detail-for').hidden = !conMarca;

    const link = el('video-detail-link');
    link.href = v.href || '';
    link.hidden = !v.href;

    gallery.hidden = true;
    detail.hidden = false;
    detail.scrollTop = 0;
  });
}

/* ---------- Donde estas -------------------------------------
   Pulsar la pagina en la que ya estas recargaba la misma pantalla: se
   ve como si el sitio no respondiera. Ahora no navega — solo cierra el
   menu. Vale para la barra ancha igual que para el desplegable, porque
   el enlace muerto estaba en las dos.                                */
function initCurrent() {
  const here = sheet('here-panel', 'data-close-here');
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[aria-current="page"]');
    if (!a) return;
    e.preventDefault();
    if (here) here.open();
  });
}
/* ---------- El telon ------------------------------------------
   Al entrar: el telon esta puesto desde el primer pixel y se levanta.
   Al salir: baja, la firma se escribe, y solo entonces se navega.

   No hay enrutador: cada pagina se carga entera, como siempre. Es a
   proposito — todo lo que arranca aqui abajo (el glosario, las hojas,
   la luz del campo, las entradas) se inicializa una vez al cargar, y
   con un enrutador habria que rehacerlo en cada salto.               */
function initCurtain() {
  const el = d.getElementById('curtain');
  if (!el) return;

  const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Levantarlo. Si se ha pedido quietud se va sin ceremonia. */
  const lift = () => {
    el.classList.add('is-written');
    requestAnimationFrame(() => el.classList.add('is-lifted'));
  };
  if (quiet) { el.classList.add('is-lifted', 'is-written'); }
  else if (d.readyState === 'complete') lift();
  else addEventListener('load', lift, { once: true });

  /* Volver con el boton de atras devuelve la pagina tal cual estaba, con
     el telon a medio bajar. Hay que quitarlo a mano. */
  addEventListener('pageshow', (e) => {
    if (e.persisted) { el.classList.remove('is-falling'); el.classList.add('is-written', 'is-lifted'); }
  });

  if (quiet) return;

  const SAME = (a) => a.origin === location.origin;
  let leaving = false;

  d.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // abrir en otra pestana
    const a = e.target.closest('a');
    if (!a || !a.href) return;
    if (a.target && a.target !== '_self') return;                   // _blank y compania
    if (a.hasAttribute('download')) return;

    let url;
    try { url = new URL(a.href); } catch (_) { return; }
    if (!SAME(url)) return;                                         // fuera de casa
    if (url.pathname === location.pathname && url.hash) return;     // un ancla de la misma pagina
    if (url.href === location.href) return;

    e.preventDefault();
    if (leaving) return;
    leaving = true;

    el.classList.remove('is-lifted', 'is-written');
    void el.offsetHeight;                    // punto de partida para la transicion
    el.classList.add('is-falling');

    /* Sin firma que escribir, el telon solo tiene que cerrarse: 180ms de
       fundido y la marca asentandose. 420ms y a la siguiente. */
    setTimeout(() => { location.href = url.href; }, 420);
  });
}
/* ---------- Filtrar las casas -------------------------------
   Cuatro ejes: por lo que hice, por el sector, por el ano y por como
   esta. Los botones los pinta Astro con las etiquetas que de verdad
   llevan las casas de esta pagina; aqui solo se decide quien pasa.

   DENTRO de un eje las etiquetas suman, ENTRE ejes se cruzan. Un eje sin
   nada marcado no filtra: por eso no hace falta un boton de "todas" en
   cada uno, que es lo que convertiria cuatro filas en un muro.

   Se esconde el <li> y no la tarjeta: lo que ocupa el hueco en la rejilla
   es la fila, asi que apagando la tarjeta quedaba el agujero.

   `aria-pressed` y no una clase a secas: quien escucha tiene que saber
   cuales estan puestos, y eso no lo dice un color. */
function initFilter() {
  const bar = d.querySelector('[data-filter-bar]');
  const grid = d.querySelector('.cards__grid');
  if (!bar || !grid) return;
  const clear = bar.querySelector('[data-filter-clear]');
  const none = d.querySelector('[data-filter-none]');
  const rows = [...grid.querySelectorAll(':scope > li')];

  /* Lo puesto, por eje. Un Set por eje y no una lista suelta: asi
     preguntar "hay algo marcado en este eje" es mirar su tamano. */
  const on = new Map();
  bar.querySelectorAll('[data-axis]').forEach((ax) => on.set(ax.getAttribute('data-axis'), new Set()));

  const apply = () => {
    let vistas = 0;
    rows.forEach((li) => {
      const tags = (li.getAttribute('data-tags') || '').split(' ').filter(Boolean);
      /* Pasa si, para CADA eje con algo marcado, lleva al menos una suya. */
      let pasa = true;
      for (const [, marcadas] of on) {
        if (!marcadas.size) continue;
        if (!tags.some((t) => marcadas.has(t))) { pasa = false; break; }
      }
      li.hidden = !pasa;
      if (pasa) vistas++;
    });

    let algo = false;
    for (const [, marcadas] of on) if (marcadas.size) { algo = true; break; }
    if (clear) clear.hidden = !algo;
    if (none) none.hidden = vistas > 0;

    /* Al filtrar, la fila deslizante de movil se queda donde estaba y
       parece vacia: se vuelve al principio, que es donde estan las que
       acaban de quedar. */
    grid.scrollTo({ left: 0, behavior: 'smooth' });
  };

  bar.addEventListener('click', (e) => {
    if (e.target.closest('[data-filter-clear]')) {
      for (const [, marcadas] of on) marcadas.clear();
      bar.querySelectorAll('[data-filter]').forEach((b) => {
        b.classList.remove('is-on');
        b.setAttribute('aria-pressed', 'false');
      });
      apply();
      return;
    }

    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    const axis = btn.closest('[data-axis]').getAttribute('data-axis');
    const tag = btn.getAttribute('data-filter');
    const marcadas = on.get(axis);

    const ahora = !marcadas.has(tag);
    ahora ? marcadas.add(tag) : marcadas.delete(tag);
    btn.classList.toggle('is-on', ahora);
    btn.setAttribute('aria-pressed', String(ahora));
    apply();
  });
}

/* ---------- Los carriles: filas que se deslizan de lado ---------

   En movil, las casas y las piezas van en una fila que se desliza con el
   pulgar. Solo con el pulgar se quedaba corta: el gesto no siempre se
   entiende, y hasta ahora el scroll que pesa de las diapositivas se lo
   comia (ver `initDiapositivas`). Asi que cada fila lleva dos flechas a los
   costados, que la mueven de una en una, y debajo un indicador de en cual
   vas.

   SOLO CUANDO HACEN FALTA. Si todo cabe —en tablet y escritorio la fila de
   casas vuelve a ser rejilla, y las tres piezas caben en la hoja— no hay
   nada que recorrer, y flechas e indicador se esconden. Se mira al cambiar
   de tamaño y cuando el filtro esconde casas.

   EN LOS EXTREMOS LA FLECHA SE APAGA, pero no se quita: si tenia el foco,
   quitarla lo tiraria al principio de la pagina. Se decide por la posicion
   y no por el numero de la tarjeta, porque con el encuadre al centro la
   primera y la ultima no llegan a centrarse.

   LA PRIMERA ARRANCA AL CENTRO. Con el relleno de siempre la primera
   tarjeta quedaba pegada a la izquierda y la fila se veia torcida. Se le da
   a la fila un relleno de medio hueco a cada lado —lo que falta para que una
   tarjeta quede centrada—, asi la primera y la ultima se centran igual que
   las de en medio. En ese mismo hueco la fila se desvanece hacia el canto
   (mascara en el CSS): la tarjeta de al lado no se ve hasta que llega.

   Se decide si sobra por lo que miden las tarjetas, no por el scroll: el
   relleno de centrar ya hace que la fila desborde, y medirlo por ahi la
   dejaria trabada en modo carril al pasar a una pantalla donde todo cabe.

   SIN GUION no hay flechas ni indicador, y la fila se sigue deslizando con
   el dedo. El indicador no se lee: es un dibujo de donde vas. Las flechas
   si, con su nombre en el idioma de la pagina. */
function initCarriles() {
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  d.querySelectorAll('[data-carril]').forEach((pista) => {
    const caja = d.createElement('div');
    caja.className = 'carril';
    pista.parentNode.insertBefore(caja, pista);
    caja.appendChild(pista);

    const flecha = (lado, nombre) => {
      const b = d.createElement('button');
      b.type = 'button';
      b.className = 'carril__flecha carril__flecha--' + lado;
      b.setAttribute('aria-label', nombre);
      b.hidden = true;
      return b;
    };
    const antes = flecha('antes', pista.getAttribute('data-antes') || 'Anterior');
    const despues = flecha('despues', pista.getAttribute('data-despues') || 'Siguiente');
    const puntos = d.createElement('div');
    puntos.className = 'carril__puntos';
    puntos.setAttribute('aria-hidden', 'true');
    puntos.hidden = true;
    caja.append(antes, despues, puntos);

    const visibles = () => [...pista.children].filter((el) => !el.hidden);
    const centro = (r) => r.left + r.width / 2;
    const tope = () => pista.scrollWidth - pista.clientWidth;

    /* La de turno: la mas cercana al centro, salvo en los extremos. */
    const actual = () => {
      const items = visibles();
      if (pista.scrollLeft <= 2) return 0;
      if (pista.scrollLeft >= tope() - 2) return items.length - 1;
      const c = centro(pista.getBoundingClientRect());
      let mejor = 0;
      let corta = Infinity;
      items.forEach((el, i) => {
        const dist = Math.abs(centro(el.getBoundingClientRect()) - c);
        if (dist < corta) { corta = dist; mejor = i; }
      });
      return mejor;
    };

    const ir = (i) => {
      const items = visibles();
      const it = items[Math.max(0, Math.min(i, items.length - 1))];
      if (!it) return;
      const delta = centro(it.getBoundingClientRect()) - centro(pista.getBoundingClientRect());
      pista.scrollBy({ left: delta, behavior: reducido ? 'instant' : 'smooth' });
    };

    let marcado = -1;
    const pintar = () => {
      const items = visibles();
      const primera = items[0] && items[0].getBoundingClientRect();
      const ultima = items.length && items[items.length - 1].getBoundingClientRect();
      const sobra = items.length > 1 && ultima.right - primera.left > pista.clientWidth + 2;
      caja.classList.toggle('is-desborda', sobra);
      antes.hidden = despues.hidden = puntos.hidden = !sobra;
      if (!sobra) return;
      caja.style.setProperty('--carril-centro', Math.max(0, (pista.clientWidth - primera.width) / 2).toFixed(1) + 'px');
      if (puntos.children.length !== items.length) {
        puntos.replaceChildren(...items.map(() => d.createElement('span')));
        marcado = -1;
      }
      antes.setAttribute('aria-disabled', String(pista.scrollLeft <= 2));
      despues.setAttribute('aria-disabled', String(pista.scrollLeft >= tope() - 2));
      const i = actual();
      /* Solo se toca la de turno. Las vecinas siguen ahi, a los costados,
         aunque el velo las haga invisibles: un dedo que apuntaba a la flecha
         y caia un poco al lado —o que el navegador acercaba al enlace mas
         grande— abria la tarjeta que no se ve. */
      items.forEach((el, k) => el.classList.toggle('is-actual', k === i));
      if (i !== marcado) {
        [...puntos.children].forEach((p, k) => p.classList.toggle('is-on', k === i));
        marcado = i;
      }
    };

    /* Los extremos se miran en el momento, no en el atributo: si el ultimo
       repintado no llego, la flecha se quedaria apagada con sitio para ir. */
    antes.addEventListener('click', () => { if (pista.scrollLeft > 2) ir(actual() - 1); });
    despues.addEventListener('click', () => { if (pista.scrollLeft < tope() - 2) ir(actual() + 1); });

    /* Un cuadro por tanda de scroll, y un reloj de respaldo por si los cuadros
       no llegan (una pestaña en segundo plano los frena). */
    let cuadro = 0;
    let reloj = 0;
    const pronto = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(pintar);
      clearTimeout(reloj);
      reloj = setTimeout(pintar, 120);
    };
    pista.addEventListener('scroll', pronto, { passive: true });
    /* El scroll suave se detiene sin avisar; al terminar, se repinta por si
       el ultimo cuadro quedo a medias. */
    pista.addEventListener('scrollend', pintar);
    if ('ResizeObserver' in window) new ResizeObserver(pronto).observe(pista);
    /* El filtro esconde casas: cambia cuantas hay y cuanto mide la fila. */
    new MutationObserver(pronto).observe(pista, { attributes: true, attributeFilter: ['hidden'], subtree: true });
    addEventListener('load', pintar);
    pintar();
  });
}

/* ---------- Diapositivas: el scroll que pesa -----------------

   ESTO NO ES `scroll-snap`. Snap es gradual y con iman: sigues arrastrando
   la pagina pixel a pixel y al soltar te acerca al borde mas cercano. Aqui
   el scroll CUESTA —hay que empujar hasta pasar un umbral, y mientras tanto
   la pagina cede un poco y vuelve— y cuando por fin cede, cambia la seccion
   ENTERA de una, con sus entradas escribiendose otra vez.

   POR QUE ESTA LLENO DE PUERTAS. Quedarse con la rueda del raton es de las
   cosas que mas facil rompen una pagina: deja contenido inalcanzable si una
   seccion no cabe, pelea con el dedo en un movil, y se lleva por delante el
   teclado y el buscar-en-pagina. Asi que solo entra donde no puede hacer
   daño, y en cuanto una condicion falla la pagina vuelve a ser normal:

     - raton de verdad y pantalla ancha. En tactil no se activa nunca.
     - TODAS las secciones caben enteras en la ventana. Si una no cabe se
       apaga entero: no se puede saltar por encima de lo que no se ve.
     - hacen falta al menos dos paradas, o no hay nada que saltar.
     - quien pide menos movimiento no lo tiene.
     - el teclado sigue mandando, con las teclas de siempre.
     - el gesto lateral se deja pasar: hay carruseles que lo usan.

   LAS SECCIONES CORTAS SE JUNTAN CON LA SIGUIENTE. En proyectos hay una
   cinta de 122px; convertirla en diapositiva propia dejaria al visitante
   mirando una tira con setecientos pixeles de vacio debajo. Mientras la
   suma quepa en la ventana, viajan juntas.

   LAS ENTRADAS NO SE REPROGRAMAN. `[data-lift]` ya usa un observador que se
   rearma al salir y al entrar, asi que al aterrizar en una seccion sus
   piezas vuelven a escribirse solas. Aqui no hay que tocar nada. */
function initDiapositivas() {
  const main = d.querySelector('main');
  if (!main) return;
  /* La puerta del puntero ya no esta. Antes se pedia raton porque en movil
     las secciones eran mas altas que la ventana y quedarse con el dedo era
     dejar contenido inalcanzable. Ahora TODAS miden una ventana exacta, asi
     que no hay nada debajo que rescatar y el gesto vale igual en las tres
     pantallas. La red de seguridad de abajo —si algo no cabe, esto se
     apaga— sigue siendo la que manda. */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const RESISTENCIA = 180;   /* cuanto hay que empujar para que ceda */
  const CEDE = 18;           /* cuanto se mueve mientras la empujas */
  const VIAJE = 520;         /* lo que tarda el salto, en ms */
  const CALMA = 170;         /* sin rueda tanto rato, el esfuerzo se relaja */

  let paradas = [];
  let indice = 0;
  let volando = false;
  let esfuerzo = 0;
  let relojCalma = 0;

  /* Donde puede pararse la pagina. Se recalcula al cambiar de tamaño porque
     el texto refluye y una seccion que cabia deja de caber. */
  function armar() {
    paradas = [];
    const max = d.documentElement.scrollHeight - innerHeight;
    if (max < 40) return;

    /* EL HERO CUENTA DOBLE, O NO. En movil y tablet son dos pantallas —lo que
       cabe en la ventana y la hoja de hueso— y en escritorio una sola, porque
       alli la hoja va al lado del nombre. Preguntarselo al DOM y no al ancho:
       en escritorio el envoltorio de la primera lleva `display: contents` y no
       genera caja, asi que mide cero. Si las dos mitades miden, son dos
       pantallas; si no, el hero entero es una.

       Sin esto el hero entraba como UN hijo de dos ventanas de alto, pasaba de
       largo la comprobacion de «todo cabe» y apagaba el modulo en movil. */
    const pantallas = [];
    [...main.children].forEach((el) => {
      const mitades = [...el.querySelectorAll(':scope > .hero__first, :scope > .hero__panel')]
        .filter((p) => p.getBoundingClientRect().height > 8);
      if (mitades.length >= 2) { mitades.forEach((p) => pantallas.push(p)); return; }
      pantallas.push(el);
    });

    const grupos = [];
    pantallas.forEach((el) => {
      const c = el.getBoundingClientRect();
      if (c.height < 8) return;                      /* lo que no se ve no cuenta */
      const arriba = c.top + scrollY;
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.alto + c.height <= innerHeight) { ultimo.alto += c.height; return; }
      grupos.push({ arriba: arriba, alto: c.height });
    });

    /* La regla dura: si algo no cabe, aqui no se salta nada. */
    if (grupos.some((g) => g.alto > innerHeight + 8)) return;

    const crudas = grupos.map((g) => Math.max(0, Math.min(Math.round(g.arriba), max)));
    /* El recorte contra el final repite paradas; dos a menos de 40px son la
       misma parada. */
    paradas = crudas.filter((p, i) => i === 0 || p - crudas[i - 1] > 40);
    if (paradas.length < 2) paradas = [];
  }

  function cede(px) {
    main.style.translate = px ? '0 ' + px.toFixed(1) + 'px' : '';
  }

  /* SEGURO CONTRA UN RELOJ PARADO. `requestAnimationFrame` no corre en una
     pestaña de fondo, asi que un salto empezado justo antes de cambiar de
     pestaña se queda a medias y `volando` no se apaga nunca: al volver, la
     rueda estaria muerta. Esto lo desatasca pase lo que pase. */
  let relojSeguro = 0;
  /* Cada vuelo lleva numero. Si empieza otro, el anterior se calla al mirar
     el suyo: sin esto, dos bucles de fotogramas se pelean por la barra de
     scroll y la pagina tiembla entre dos destinos. */
  let vuelo = 0;

  function volar(destino) {
    const mio = ++vuelo;
    volando = true;
    cede(0);
    clearTimeout(relojSeguro);
    /* Generoso a proposito. Antes eran 520+600 y en una pantalla lenta el
       seguro saltaba A MITAD del vuelo: desbloqueaba la rueda con el viaje sin
       terminar y un solo empujon se comia dos secciones. El seguro es para un
       reloj PARADO, no para uno lento. */
    relojSeguro = setTimeout(() => {
      if (mio !== vuelo) return;
      volando = false; esfuerzo = 0;
    }, VIAJE + 4000);
    const desde = scrollY;
    const tramo = destino - desde;
    const t0 = performance.now();
    /* Sale rapido y aterriza suave: es lo que hace que se lea como un cambio
       de diapositiva y no como un scroll con prisa. */
    const suave = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const paso = (ahora) => {
      if (mio !== vuelo) return;               /* otro tomo el relevo */
      const p = Math.min(1, (ahora - t0) / VIAJE);
      scrollTo({ top: desde + tramo * suave(p), behavior: 'instant' });
      if (p < 1) { requestAnimationFrame(paso); return; }
      esfuerzo = 0;
      clearTimeout(relojSeguro);
      /* Un respiro antes de aceptar el siguiente empujon: sin esto, la
         inercia de un trackpad encadena tres secciones de un gesto. */
      setTimeout(() => { volando = false; }, 140);
    };
    requestAnimationFrame(paso);
  }

  function saltar(dir) {
    const siguiente = indice + dir;
    if (siguiente < 0 || siguiente >= paradas.length) return false;
    indice = siguiente;
    volar(paradas[indice]);
    return true;
  }

  addEventListener('wheel', (e) => {
    if (paradas.length < 2) return;                       /* pagina normal */
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;  /* gesto lateral, suyo es */
    e.preventDefault();
    if (volando) return;

    /* La rueda mide en lineas o en paginas segun el raton; sin normalizar,
       el umbral significa una cosa distinta en cada maquina. */
    const dy = e.deltaMode === 1 ? e.deltaY * 16
             : e.deltaMode === 2 ? e.deltaY * innerHeight
             : e.deltaY;
    esfuerzo += dy;
    clearTimeout(relojCalma);
    relojCalma = setTimeout(() => { esfuerzo = 0; cede(0); }, CALMA);

    const dir = esfuerzo > 0 ? 1 : -1;
    if (indice + dir < 0 || indice + dir >= paradas.length) { cede(0); return; }

    if (Math.abs(esfuerzo) >= RESISTENCIA) { saltar(dir); return; }
    cede(-dir * CEDE * (Math.abs(esfuerzo) / RESISTENCIA));
  }, { passive: false });

  /* El teclado no se toca por gusto: si la rueda salta secciones y las
     flechas siguen desplazando pixel a pixel, la pagina tiene dos verdades. */
  addEventListener('keydown', (e) => {
    if (paradas.length < 2 || volando) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    let hecho = false;
    if (e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === ' ') hecho = saltar(1);
    else if (e.key === 'PageUp' || e.key === 'ArrowUp') hecho = saltar(-1);
    else if (e.key === 'Home') { indice = 0; volar(paradas[0]); hecho = true; }
    else if (e.key === 'End') { indice = paradas.length - 1; volar(paradas[indice]); hecho = true; }
    if (hecho) e.preventDefault();
  });

  /* Si la pagina se mueve por su cuenta —un ancla, el buscar-en-pagina, la
     barra lateral— hay que volver a saber en que parada estamos, o el
     siguiente empujon salta desde el sitio equivocado. */
  addEventListener('scroll', () => {
    if (volando || paradas.length < 2) return;
    let mejor = 0;
    let corta = Infinity;
    paradas.forEach((p, i) => {
      const dist = Math.abs(p - scrollY);
      if (dist < corta) { corta = dist; mejor = i; }
    });
    indice = mejor;
  }, { passive: true });

  /* EL DEDO. Mismo modelo que la rueda: se acumula el arrastre, la pagina
     cede mientras empujas y salta al pasar el umbral.

     El umbral se mide contra el ALTO DE LA VENTANA y no en pixeles fijos:
     un pulgar recorre una fraccion parecida de la pantalla en un movil y en
     una tablet, pero no la misma distancia. Con un numero fijo, en tablet
     costaria la mitad.

     `preventDefault` en `touchmove` es lo que apaga el scroll nativo, y por
     eso el oyente no puede ser pasivo. Si no hay paradas se sale ANTES de
     llamarlo: con la pagina normal, el dedo es del navegador.

     EL GESTO LATERAL NO ES SUYO. Aqui se cancelaba cualquier arrastre, tambien
     el de lado, y en movil las filas que se deslizan —las casas, las piezas—
     no respondian al pulgar: el scroll horizontal nunca llegaba a empezar. Se
     decide en el primer movimiento: si va mas de lado que de arriba abajo, el
     dedo se suelta y el navegador desliza la fila. Sobre una fila deslizable
     basta con que vaya casi igual de lado. Y dentro de una hoja abierta —la
     de las piezas— el dedo es de la hoja. */
  let dedoY = 0;
  let dedoX = 0;
  let dedoActivo = false;
  let decidido = false;

  addEventListener('touchstart', (e) => {
    if (paradas.length < 2 || volando || e.touches.length !== 1) { dedoActivo = false; return; }
    if (e.target.closest && e.target.closest('[aria-modal="true"], .video-panel')) { dedoActivo = false; return; }
    dedoActivo = true;
    decidido = false;
    dedoY = e.touches[0].clientY;
    dedoX = e.touches[0].clientX;
    esfuerzo = 0;
  }, { passive: true });

  addEventListener('touchmove', (e) => {
    if (!dedoActivo || paradas.length < 2) return;
    if (!decidido) {
      const dx = Math.abs(e.touches[0].clientX - dedoX);
      const dy = Math.abs(e.touches[0].clientY - dedoY);
      const enFila = e.target.closest && e.target.closest('[data-carril], .faxis__chips');
      if (dx > dy || (enFila && dx * 1.5 >= dy && dx > 0)) { dedoActivo = false; return; }
      decidido = true;
    }
    e.preventDefault();
    if (volando) return;
    esfuerzo = dedoY - e.touches[0].clientY;
    const umbral = Math.max(70, innerHeight * 0.12);
    const dir = esfuerzo > 0 ? 1 : -1;
    if (indice + dir < 0 || indice + dir >= paradas.length) { cede(0); return; }
    if (Math.abs(esfuerzo) >= umbral) { dedoActivo = false; saltar(dir); return; }
    cede(-dir * CEDE * (Math.abs(esfuerzo) / umbral));
  }, { passive: false });

  addEventListener('touchend', () => {
    dedoActivo = false;
    if (!volando) { esfuerzo = 0; cede(0); }
  }, { passive: true });

  let relojMedida = 0;
  addEventListener('resize', () => {
    clearTimeout(relojMedida);
    relojMedida = setTimeout(() => { cede(0); armar(); }, 200);
  });

  /* Se mide despues de que las entradas hayan colocado todo: medir antes es
     medir una pagina que todavia no existe. */
  setTimeout(armar, 400);
  addEventListener('load', () => setTimeout(armar, 200));
}

/* ---------- La familia Fraterni, de una en una ---------------

   Cuatro productos seguidos eran un reguero. Van en pestañas: uno a la vez,
   y se cambia tocando la pestaña, con las flechas del teclado o deslizando
   el dedo sobre la ficha. NO AVANZA SOLO: un carrusel que cambia lo que
   estas leyendo sin que lo pidas es justo lo que las pautas de
   accesibilidad piden poder parar.

   SIN GUION no hay pestañas —el HTML las trae escondidas— y se ven las
   cuatro fichas seguidas. Los roles de panel se ponen aqui y no en el HTML:
   sin guion, un panel que dice ser de una pestaña que no se ve confunde al
   lector de pantalla. */
function initFamilia() {
  d.querySelectorAll('[data-familia]').forEach((caja) => {
    const lista = caja.querySelector('[role="tablist"]');
    const tabs = lista ? [...lista.querySelectorAll('[role="tab"]')] : [];
    const paneles = tabs.map((t) => d.getElementById(t.getAttribute('aria-controls')));
    if (!tabs.length || paneles.some((p) => !p)) return;

    paneles.forEach((p, i) => {
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', tabs[i].id);
      p.tabIndex = 0;
    });

    let actual = 0;
    /* Trae la pestaña elegida a la vista DENTRO de su fila, que en movil se
       desplaza de lado. `scrollIntoView` moveria tambien la pagina. */
    const traer = (i) => {
      const t = tabs[i].getBoundingClientRect(), l = lista.getBoundingClientRect();
      if (t.left < l.left) lista.scrollLeft -= l.left - t.left + 12;
      else if (t.right > l.right) lista.scrollLeft += t.right - l.right + 12;
    };
    const elegir = (i, foco) => {
      actual = i;
      tabs.forEach((t, k) => {
        const si = k === i;
        t.setAttribute('aria-selected', si ? 'true' : 'false');
        t.tabIndex = si ? 0 : -1;
        paneles[k].hidden = !si;
      });
      if (foco) tabs[i].focus();
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { elegir(i, false); traer(i); });
      /* Las cuatro flechas: en escritorio la fila es una columna, y ahi lo
         natural es subir y bajar. */
      t.addEventListener('keydown', (e) => {
        const n = tabs.length;
        const j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n
                : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n
                : e.key === 'Home' ? 0
                : e.key === 'End' ? n - 1
                : null;
        if (j === null) return;
        e.preventDefault();
        elegir(j, true);
        traer(j);
      });
    });

    /* Deslizar el dedo sobre la ficha pasa a la siguiente o a la anterior.
       Solo si el gesto es claramente de lado: uno diagonal es alguien que
       baja la pagina, y ese gesto es del navegador. */
    const zona = caja.querySelector('.familia__paneles');
    let x0 = null;
    let y0 = 0;
    zona.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) { x0 = null; return; }
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });
    zona.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const n = tabs.length;
      const j = dx < 0 ? (actual + 1) % n : (actual - 1 + n) % n;
      elegir(j, false);
      traer(j);
    }, { passive: true });

    lista.hidden = false;
    caja.classList.add('is-js');
    elegir(0, false);
  });
}

/* ---------- Las fichas de las casas, del derecho y del reves --

   Cada ficha tiene tres caras apiladas en la misma celda: la de la
   pregunta, la del «¿Por qué?» y la de la mision y la vision. Los botones
   del pie le dan la vuelta; pulsar otra vez el mismo la devuelve a la
   pregunta, y Escape tambien. Como las tres ocupan el mismo sitio, la ficha
   no cambia de tamaño y la de al lado no se mueve.

   SIN GUION no hay botones —el HTML los trae escondidos— y las tres caras
   se ven seguidas. */
function initFichas() {
  d.querySelectorAll('[data-ficha]').forEach((ficha) => {
    const botonera = ficha.querySelector('.hcard__botones');
    const caras = [...ficha.querySelectorAll('.hcard__cara')];
    if (!botonera || caras.length < 2) return;
    const frente = caras[0];
    const botones = [...botonera.querySelectorAll('[aria-controls]')];
    const destino = (b) => d.getElementById(b.getAttribute('aria-controls'));
    if (botones.some((b) => !destino(b))) return;

    const ver = (cara) => {
      caras.forEach((c) => c.classList.toggle('is-vista', c === cara));
      botones.forEach((b) => b.setAttribute('aria-expanded', String(destino(b) === cara)));
    };

    botones.forEach((b) => b.addEventListener('click', () => {
      const cara = destino(b);
      ver(cara.classList.contains('is-vista') ? frente : cara);
    }));
    ficha.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || frente.classList.contains('is-vista')) return;
      const abierto = botones.find((b) => b.getAttribute('aria-expanded') === 'true');
      ver(frente);
      if (abierto) abierto.focus();
    });

    botonera.hidden = false;
    ficha.classList.add('is-js');
    ver(frente);
  });
}

/* ---------- Las respuestas de siempre, tachadas en bucle ----

   Cuando la correccion de una pregunta trae varias respuestas de siempre,
   van pasando en el mismo sitio, una detras de otra y siempre tachadas,
   mientras la buena se queda al lado: caen todas las de siempre, y la que
   falta no cambia.

   LA CAJA SIGUE A LA PALABRA DE TURNO. Apiladas en una celda, la caja medía
   lo que la mas larga, y con una corta quedaba un hueco antes de la nota.
   Ahora se le da el ancho de la que se ve, y la nota se desliza. Si la mas
   larga no cabe junto a la nota, la nota se va a su propio renglon para
   siempre (`corrige--apilada`): con unas cabria y con otras no, y la ficha
   saltaria en cada vuelta. Se mide al cargar, al cambiar de tamaño —tambien
   cuando una pestaña escondida se abre— y cuando llegan las letras.

   SOLO SE MUEVE LO QUE SE VE. Fuera de la ventana, o en una pestaña
   escondida, se para; al volver, sigue por donde iba.

   SE PARA SI TE DETIENES EN ELLA. Un texto que cambia solo y no termina es
   lo que las pautas de accesibilidad piden poder detener: con el raton o el
   foco encima de la ficha se queda quieto. Con el movimiento reducido no se
   mueve nunca: se ve la primera, la elegida a proposito. */
function initTachones() {
  const preguntas = [...d.querySelectorAll('.pregunta--ciclo')];
  if (!preguntas.length) return;

  const opciones = (p) => [...p.querySelectorAll('.corrige__tacha')];
  const ancho = (el) => el.getBoundingClientRect().width;

  const ajustar = (p) => {
    const fila = p.querySelector('.corrige');
    const caja = p.querySelector('.corrige__palabra');
    const nota = p.querySelector('.corrige__nota');
    if (!fila || !caja || !nota || !fila.clientWidth) return;   // escondida: se mide al abrirse
    const ws = opciones(p);
    const texto = d.createRange();
    texto.selectNodeContents(nota);
    const hueco = parseFloat(getComputedStyle(fila).columnGap) || 0;
    const mayor = Math.max(...ws.map(ancho));
    fila.classList.toggle('corrige--apilada', mayor + hueco + texto.getBoundingClientRect().width > fila.clientWidth);
    const deTurno = ws.find((w) => w.classList.contains('is-on')) || ws[0];
    caja.style.width = Math.ceil(ancho(deTurno)) + 'px';
  };

  preguntas.forEach(ajustar);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver((entries) => entries.forEach((e) => ajustar(e.target.closest('.pregunta'))));
    preguntas.forEach((p) => ro.observe(p.querySelector('.corrige')));
  }
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => preguntas.forEach(ajustar));

  if (!('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const PASO = 1800;     // lo que se queda cada respuesta tachada
  const relojes = new Map();
  const quietas = new Set();

  const avanzar = (p) => {
    if (quietas.has(p)) return;
    const ws = opciones(p);
    const j = (ws.findIndex((w) => w.classList.contains('is-on')) + 1) % ws.length;
    ws.forEach((w, k) => w.classList.toggle('is-on', k === j));
    ajustar(p);
  };
  const andar = (p) => {
    ajustar(p);
    if (!relojes.has(p)) relojes.set(p, setInterval(() => avanzar(p), PASO));
  };
  const parar = (p) => { clearInterval(relojes.get(p)); relojes.delete(p); };

  preguntas.forEach((p) => {
    const zona = p.closest('.hcard, .proposito') || p;
    const quieta = () => quietas.add(p);
    const suelta = () => {
      if (!zona.matches(':hover') && !zona.contains(d.activeElement)) quietas.delete(p);
    };
    zona.addEventListener('pointerenter', quieta);
    zona.addEventListener('pointerleave', suelta);
    zona.addEventListener('focusin', quieta);
    /* El foco sale antes de llegar a donde va: se mira en la vuelta
       siguiente, cuando ya se sabe si se quedo dentro de la ficha. */
    zona.addEventListener('focusout', () => setTimeout(suelta, 0));
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? andar(e.target) : parar(e.target)));
  }, { threshold: 0.05 });
  preguntas.forEach((p) => io.observe(p));
}

/* ---------- Entradas ----------------------------------------
   Dos comportamientos, no uno:

   .reveal     — las imagenes. Entran una vez y ahi se quedan.
   [data-lift] — los textos. Se levantan cada vez que vuelven a pasar
                 por la ventana, escalonados dentro de su propio bloque,
                 asi que cada scroll los vuelve a escribir.            */
function initReveal() {
  const settle = d.querySelectorAll('.reveal');
  const lift = d.querySelectorAll('[data-lift]');
  if (!settle.length && !lift.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;   // el CSS ya los muestra

  /* A partir de aqui el CSS esconde lo que va a entrar. Se pone aqui y no
     antes: si no hay observador que las descubra, no puede esconderlas.  */
  d.documentElement.classList.add('js-reveal');

  /* El escalonado se calcula una vez, por bloque padre: lo que va junto
     entra junto, en orden, y no de golpe. */
  const groups = new Map();
  lift.forEach((el) => {
    const key = el.closest('.hero__identity, .hero__panel, .about, .page') || d.body;
    const i = groups.get(key) || 0;
    groups.set(key, i + 1);
    el.style.setProperty('--d', i * 90 + 'ms');
  });

  const once = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      obs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px 10% 0px', threshold: 0.01 });
  settle.forEach((el) => once.observe(el));

  /* Sin unobserve: al salir se rearman, y al volver se escriben otra vez. */
  const again = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-in', e.isIntersecting));
  }, { rootMargin: '0px 0px -2% 0px', threshold: 0.05 });
  lift.forEach((el) => again.observe(el));

  // Red de seguridad: nada puede quedarse invisible, pase lo que pase.
  setTimeout(() => {
    d.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight * 1.5) el.classList.add('is-visible');
    });
    d.querySelectorAll('[data-lift]:not(.is-in)').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.top < innerHeight && b.bottom > 0) el.classList.add('is-in');
    });
  }, 3000);
}

initHeader();
initFieldGlow();
initNav();
initViewportLock();
initSocial();
initContact();
initAccounts();
initOrbit();
initLang();
initTema();
initSoon();
initGlossary();
initCovers();
initCurrent();
initCurtain();
initFilter();
initCarriles();
initFamilia();
initFichas();
initTachones();
initReveal();
initDiapositivas();
/* Safari en iOS no aplica `:active` a nada si la pagina no escucha el
   tacto en ningun sitio: sin esto, la ficha se enciende al pulsarla en
   Android y no hace nada en un iPhone. Un oyente vacio y pasivo basta
   para que el sistema lo de por bueno; no corre codigo ni estorba al
   desplazamiento. */
d.addEventListener('touchstart', function () {}, { passive: true });

d.documentElement.classList.add('js-ready');
