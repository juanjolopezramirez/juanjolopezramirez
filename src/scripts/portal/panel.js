/* El panel de «The Alef Code» (components/portal/Panel.astro) cobra vida.

   1. GUARDIA. Antes de enseñar nada pregunta al SERVIDOR quien eres: sin sesion
      → de vuelta al portal; con sesion pero sin estar aprobado → de vuelta al
      portal (alli ve su pantalla: pendiente o rechazado). Nada del panel se abre
      mientras tanto. Si algo tarda o falla, «No pude conectar», no un panel a medias.
   2. MENU. Una seccion a la vez, por la direccion (#accesos): el ancla se
      comprueba contra la lista de secciones que le tocan a esta persona. El admin
      abre en Self-Mode («Hoy»); un miembro, en «Inicio» (el primer paso).
      El acordeon vive en panel/Menu.js.
   3. LAS SECCIONES que hacen algo son objetos (panel/Seccion.js y sus hijas):
      «Quién entra» (panel/Accesos.js), «Seguridad» (panel/Seguridad.js) y, en
      Developer-Mode, los editores de Libros y de Sobre el camino (panel/dev/). Reciben
      de aqui lo comun (`ctx`) y el panel les avisa al entrar y al salir.

   Todo texto de otra persona (nombre, correo, motivo) entra con `textContent`. */
import { abrirBackend } from './backend.js';
import { bitacora, esperaDeSalida, fondoQuieto, modoFondo } from './carga.js';
import { anclaValida, codigoValido, idiomaDe, rutaPortal } from './estado.js';
import { idsPara, inicioPara, inicioDeModo, modoDe, modoPara } from '../../data/portal/secciones.js';
import { Menu } from './panel/Menu.js';
import { Recursos } from './panel/Recursos.js';
import { Accesos } from './panel/Accesos.js';
import { Seguridad } from './panel/Seguridad.js';
import { errorEnForm, limpiarForm } from './panel/formulario.js';

const TARDO = Symbol('tardo');
const limite = (promesa, ms = 15000) =>
  Promise.race([promesa, new Promise((resolver) => setTimeout(() => resolver(TARDO), ms))]);
const hay = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

const raiz = document.querySelector('[data-panel]');
/* Dentro de un marco AJENO el panel no se abre: un boton de «Aprobar» tapado por otra
   pagina (clickjacking) aprobaria a quien no es. GitHub Pages no manda cabeceras que lo
   impidan, asi que se comprueba aqui. */
const enMarcoAjeno = (() => { try { return window.top !== window.self; } catch (e) { return true; } })();
if (raiz && !enMarcoAjeno) iniciar(raiz);

function leerTextos() {
  try { return JSON.parse(document.getElementById('portal-textos').textContent); } catch (e) { return null; }
}

function iniciar(raiz) {
  const lang = idiomaDe(raiz.dataset.idioma);
  const tx = leerTextos() || {};
  const errores = tx.errores || {};
  const p = tx.panel || {};

  const elCargando = raiz.querySelector('[data-cargando]');
  const elSaliendo = raiz.querySelector('[data-saliendo]');
  const elProblema = raiz.querySelector('[data-problema]');
  const elMarco = raiz.querySelector('[data-marco]');
  const elCodigo = raiz.querySelector('[data-codigo]');
  const log = bitacora(raiz.querySelector('[data-bitacora]'), tx.bitacora);
  /* Si se llega desde el portal (acabas de entrar), la א que alli se descifro empieza
     entera y se deshace en la lluvia. Lo dice la pagina de la que vienes: nada guardado. */
  const desdePortal = (() => {
    try {
      /* Solo al llegar de verdad (no al recargar ni al volver con «atrás»: la pagina de
         origen sigue siendo la misma y la א se repetiria). */
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav && nav.type !== 'navigate') return false;
      const de = new URL(document.referrer);
      return de.origin === window.location.origin && de.pathname === rutaPortal(lang);
    } catch (e) { return false; }
  })();

  let be = null;
  let primera = true;          // la א de la llegada sale una sola vez, no en cada «Intentar otra vez»
  let ids = [];
  let esAdmin = false;
  let yo = null;
  let ocupado = false;
  let escuchando = false;
  let abierto = false;

  /* Una peticion colgada no congela el panel: a los 15 s cuenta como «sin red». */
  const aTiempo = async (promesa, ms) => { const r = await limite(promesa, ms); return r === TARDO ? { error: 'red' } : r; };
  const textoDe = (clave) => (hay(errores, clave) ? errores[clave] : (errores.generico || 'Algo no salió bien.'));
  const fecha = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const plantilla = (nombre) => {
    const t = raiz.querySelector(`template[data-plantilla="${nombre}"]`);
    return t ? t.content : null;
  };
  const poner = (fila, campo, texto) => {
    const el = fila.querySelector(`[data-campo="${campo}"]`);
    if (el) el.textContent = typeof texto === 'string' ? texto : '';
  };
  /* Una accion a la vez: mientras una corre, las demas esperan. Si algo se rompe, el
     aviso sale donde esta la persona (`alFallar`), no en una seccion escondida. */
  async function conOcupado(boton, tarea, alFallar = () => {}) {
    if (ocupado) return;
    ocupado = true;
    if (boton) boton.setAttribute('aria-busy', 'true');
    try { await tarea(); } catch (e) { alFallar(); } finally {
      ocupado = false;
      if (boton) boton.removeAttribute('aria-busy');
    }
  }

  /* Lo comun que reciben las secciones. Lo que cambia al entrar (el backend, quien eres)
     se lee en el momento, por eso son «get». */
  const ctx = {
    p, lang, textoDe, fecha, aTiempo, conOcupado, plantilla, poner,
    get be() { return be; },
    get esAdmin() { return esAdmin; },
    get yo() { return yo; },
    get ocupado() { return ocupado; }
  };
  /* LOS DOS MODOS (solo el admin). La ultima seccion de cada uno, en memoria: el boton te
     devuelve a donde estabas en el otro modo. Pulsarlo cambia la direccion (asi «atrás» lo
     deshace) y el foco se queda en el boton. */
  const ultimaDe = { self: '', dev: '' };
  let porBoton = false;
  const menu = new Menu(raiz.querySelector('[data-riel]'), {
    ambito: raiz.querySelector('[data-marco]'),
    enfocar: (id) => { const t = raiz.querySelector(`[data-titulo="${id}"]`); if (t) t.focus(); },
    alCambiarModo: () => {
      if (!esAdmin) return;
      const otro = menu.modo === 'dev' ? 'self' : 'dev';
      porBoton = true;
      window.location.hash = '#' + (ultimaDe[otro] || inicioDeModo(otro));
    }
  });
  const secciones = { accesos: new Accesos(raiz, ctx), seguridad: new Seguridad(raiz, ctx) };
  /* Recursos: la eleccion de que subir (los libros salen por `perezosas.libros`) */
  const recursos = new Recursos(raiz);
  /* Los editores de Developer-Mode se bajan la primera vez que el admin entra a su seccion:
     un miembro, o el admin en Self-Mode, no carga su codigo. */
  const perezosas = {
    libros: () => import('./panel/dev/EditorLibro.js').then((m) => new m.EditorLibro(raiz, ctx)),
    camino: () => import('./panel/dev/EditorEtapa.js').then((m) => new m.EditorEtapa(raiz, ctx)),
    marca: () => import('./panel/dev/Marca.js').then((m) => new m.Marca(raiz, ctx)),
    tablero: () => import('./panel/Tablero.js').then((m) => new m.Tablero(raiz, ctx)),
    trabajos: () => import('./panel/dev/EditorCasa.js').then((m) => new m.EditorTrabajos(raiz, ctx)),
    proyectos: () => import('./panel/dev/EditorCasa.js').then((m) => new m.EditorProyectos(raiz, ctx))
  };
  const cargando = {};          // una sola carga por seccion, aunque se entre dos veces seguidas
  const seccionDe = (id) => {
    if (hay(secciones, id)) return Promise.resolve(secciones[id]);
    if (!esAdmin || !hay(perezosas, id)) return Promise.resolve(null);
    if (!cargando[id]) {
      cargando[id] = perezosas[id]().then((s) => { secciones[id] = s; return s; }, (e) => { delete cargando[id]; throw e; });
    }
    return cargando[id];
  };

  /* ---- Guardia ---------------------------------------------------------------- */
  function alPortal(saliendo = false) {
    /* En la demo la direccion lleva `?demo=…`: se conserva para no perder el caso, salvo al
       SALIR (si no, el portal te volveria a meter con el mismo `?demo=`). */
    let sufijo = be && be.modo === 'demo' ? (saliendo ? '?demo=entrar' : window.location.search) : '';
    /* Quien paro el fondo con el boton lo sigue teniendo parado al salir (fondo.js lee `?quieto=1`) */
    if (saliendo && document.documentElement.classList.contains('fondo-quieto')) sufijo += (sufijo ? '&' : '?') + 'quieto=1';
    window.location.replace(rutaPortal(lang) + sufijo);
  }

  function problema(texto) {
    if (saliendo) return;
    modoFondo('reposo');
    elCargando.hidden = true;
    elMarco.hidden = true;
    /* (el aviso de siempre, o uno propio: «no pude cerrar la sesion») */
    const frase = elProblema.querySelector('p');
    if (frase) frase.textContent = typeof texto === 'string' && texto ? texto : (p.problema || frase.textContent);
    elProblema.hidden = false;
    elProblema.focus();                      // el aviso se lee: sin foco, un aviso que aparece ya lleno suele callar
  }

  async function arrancar() {
    /* «Intentar otra vez» desaparece con su aviso: el foco pasa al «Un momento…» (WCAG 2.4.3) */
    const eraDelAviso = elProblema.contains(document.activeElement);
    elProblema.hidden = true;
    elCargando.hidden = false;
    if (eraDelAviso) { const t = elCargando.querySelector('[data-cargando-texto]'); if (t) t.focus(); }
    log.limpiar();
    modoFondo('carga', { logo: desdePortal && primera });
    primera = false;
    log.paso('conectando');
    try {
      be = be || await abrirBackend(lang);
    } catch (e) {
      problema();
      return;
    }
    if (!be) { alPortal(); return; }

    log.paso('quien');
    const ses = await limite(be.sesion());
    if (ses === TARDO || ses === undefined) { problema(); return; }      // undefined: no se pudo saber (red)
    if (!ses) { alPortal(); return; }
    log.paso('acceso');
    const perfil = await limite(be.perfil(ses.id));
    if (perfil === TARDO || perfil === undefined) { problema(); return; }
    if (!perfil || perfil.estado !== 'aprobado') { alPortal(); return; }

    if (!escuchando) {
      escuchando = true;
      be.alCambiar((evento) => { if (evento === 'SIGNED_OUT') salir(() => Promise.resolve()); });
    }
    /* El admin con codigo de app (seccion «Seguridad») lo escribe antes de ver nada. */
    if (perfil.esAdmin && be.mfa) {
      const n = await limite(be.mfa.nivel());
      if (n === TARDO || n === undefined) { problema(); return; }
      if (n.siguiente === 'aal2' && n.actual !== 'aal2') { pedirCodigo(ses, perfil); return; }
    }
    abrir(ses, perfil);
  }

  /* ---- El codigo de la app (solo el admin que lo puso) ------------------------------ */
  function pedirCodigo(ses, perfil) {
    if (saliendo) return;                    // ya se esta saliendo: nada reaparece (la ת sigue hasta irse)
    modoFondo('reposo');
    elCargando.hidden = true;
    elProblema.hidden = true;
    elMarco.hidden = true;
    elCodigo.hidden = false;
    const ruta = raiz.querySelector('[data-ruta-actual]');
    if (ruta) ruta.textContent = '~/panel/codigo';
    const form = elCodigo.querySelector('form');
    const campo = form.elements.codigo;
    form.onsubmit = (e) => {
      e.preventDefault();
      limpiarForm(form);
      if (!codigoValido(campo.value)) { errorEnForm(form, campo, 'codigoMalo', textoDe); return; }
      conOcupado(form.querySelector('button[type="submit"]'), async () => {
        const r = await aTiempo(be.mfa.verificar(campo.value));
        if (r.error) { errorEnForm(form, campo, r.error, textoDe); return; }
        campo.value = '';
        elCodigo.hidden = true;
        abrir(ses, perfil);
      }, () => errorEnForm(form, campo, 'generico', textoDe));
    };
    campo.focus();
  }

  /* ---- Abrir el panel ------------------------------------------------------------ */
  function abrir(ses, perfil) {
    if (saliendo) return;                    // ya se esta saliendo: nada reaparece (la ת sigue hasta irse)
    yo = ses.id;
    esAdmin = !!perfil.esAdmin;
    /* Cada quien ve lo suyo: un miembro no tiene lo del admin, y el admin no tiene el
       test (su primer paso no es ese). */
    raiz.querySelectorAll(esAdmin ? '[data-solo-miembros]' : '[data-solo-admin]').forEach((el) => el.remove());
    ids = idsPara(esAdmin);
    menu.solo(ids.length < 2);

    const demo = raiz.querySelector('[data-demo]');
    if (demo) demo.hidden = be.modo !== 'demo';

    const nombre = typeof perfil.nombre === 'string' ? perfil.nombre.trim() : '';
    const titulo = raiz.querySelector(`[data-titulo="${inicioPara(esAdmin)}"]`);
    if (titulo && nombre && p.saludo) titulo.textContent = `${p.saludo}, ${nombre}`;

    /* En la demo la memoria se pierde al cambiar de pagina: los enlaces a /contact/ y /meet/
       llevan el mismo `?demo=` para que la guardia de alli te reconozca. */
    if (be.modo === 'demo') {
      raiz.querySelectorAll('.panel__puerta').forEach((puerta) => puerta.setAttribute('href', puerta.getAttribute('href') + window.location.search));
    }

    elCargando.hidden = true;
    elProblema.hidden = true;
    elMarco.hidden = false;
    modoFondo('reposo');
    /* El panel se enciende como una pantalla de tubo: una raya que se abre (panel.css).
       Solo es la forma de aparecer: el contenido ya esta ahi y se puede usar desde el primer cuadro. */
    if (!fondoQuieto()) {
      elMarco.classList.add('is-encendiendo');
      const fin = (e) => { if (e.target !== elMarco) return; elMarco.classList.remove('is-encendiendo'); elMarco.removeEventListener('animationend', fin); };
      elMarco.addEventListener('animationend', fin);
    }

    /* Si nadie tenia el foco en otra parte (la pausa del fondo, «Inicio»), va al titulo
       de la seccion: asi el lector de pantalla dice que el panel ya esta abierto. */
    const activo = document.activeElement;
    /* (el boton de la pantalla del codigo, recien escondida, cuenta como «libre») */
    const libre = !activo || activo === document.body || (elCodigo && elCodigo.contains(activo));
    irA(anclaValida(window.location.hash, ids) || inicioPara(esAdmin), libre);
    if (!abierto) {
      abierto = true;
      window.addEventListener('hashchange', () => {
        const deBoton = porBoton;
        porBoton = false;
        irA(anclaValida(window.location.hash, ids) || inicioPara(esAdmin), !deBoton, deBoton);
      });
    }
  }

  function irA(id, foco, deBoton = false) {
    raiz.querySelectorAll('[data-seccion]').forEach((s) => { s.hidden = s.dataset.seccion !== id; });
    const t = raiz.querySelector(`[data-titulo="${id}"]`);
    /* El modo lo dice la seccion (Acceso se queda en el que estabas) */
    if (esAdmin) {
      const modo = modoPara(id, menu.modo);
      menu.mostrarModo(modo, deBoton);
      if (modoDe(id)) ultimaDe[modo] = id;
    }
    menu.marcar(id);
    /* La ruta de la barra de la terminal: ~/panel/<seccion>. */
    const ruta = raiz.querySelector('[data-ruta-actual]');
    if (ruta) ruta.textContent = `~/panel/${id}`;
    if (foco && t) t.focus();
    seccionDe(id).then((s) => { if (s) s.alEntrar(); }, () => {});
  }

  /* ---- Salir y reintentar --------------------------------------------------------- */
  /* AL SALIR se ve la ת (Tav, roja) con «Saliendo…» y el fondo la descifra en rojo. Lo que se vio
     de otras personas se borra de la pagina AL EMPEZAR (no despues de esperar), y la sesion se
     cierra de verdad mientras tanto: las dos cosas corren a la vez, asi que la ת solo alarga la
     salida lo que falte para SALIDA_MS (carga.js; 0 con el fondo quieto o «reducir movimiento»).
     Tambien entra por aqui el aviso de que la sesion se cerro sola (otra pestaña, o caduco). */
  let saliendo = false;
  async function salir(cerrar) {
    if (saliendo) return;
    saliendo = true;
    elCargando.hidden = true;
    elProblema.hidden = true;
    if (elSaliendo) {
      elSaliendo.hidden = false;
      /* El boton «Salir» se va con la ventana: el foco pasa a «Saliendo…» y asi se oye */
      const t = elSaliendo.querySelector('[data-saliendo-texto]');
      if (t) t.focus();
    }
    modoFondo('salida');
    /* olvidar() suelta el modo (Self/Dev): se conserva hasta irse, o el papel de dia
       se oscureceria justo antes de salir. */
    const modo = document.documentElement.dataset.modo;
    olvidar();
    if (modo) document.documentElement.dataset.modo = modo;
    try {
      /* Un cierre que se cuelga no deja «Saliendo…» para siempre: a los 8 s cuenta como fallo */
      const [cierre] = await Promise.all([limite(cerrar(), 8000), new Promise((resolver) => setTimeout(resolver, esperaDeSalida()))]);
      if (cierre === TARDO) throw new Error('tardo');
      alPortal(true);
    } catch (e) {
      saliendo = false;
      if (elSaliendo) elSaliendo.hidden = true;
      problema(p.salirFallo);
    }
  }

  raiz.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('button') : null;
    if (!b || !raiz.contains(b)) return;
    if (b.hasAttribute('data-salir') && be) {
      salir(() => be.salir());
    } else if (b.hasAttribute('data-reintentar')) {
      arrancar();
    }
  });

  /* Al salir, lo que se vio de otras personas se borra de la pagina antes de irse. */
  function olvidar() {
    elMarco.hidden = true;
    raiz.querySelectorAll('[data-lista]').forEach((l) => l.replaceChildren());
    raiz.querySelectorAll('[data-cuenta]').forEach((c) => { c.textContent = ''; });
    if (elCodigo) elCodigo.hidden = true;
    Object.values(secciones).forEach((s) => s.olvidar());
    recursos.olvidar();
    menu.olvidar();
    raiz.querySelectorAll('[data-titulo="inicio"], [data-titulo="hoy"]').forEach((saludo) => {
      const id = saludo.dataset.titulo;
      if (p.secciones && p.secciones[id]) saludo.textContent = p.secciones[id].titulo;
    });
  }

  /* Si el navegador devuelve esta pagina de su memoria («atrás» tras salir), no se
     enseña lo que habia: se recarga y la guardia vuelve a preguntar al servidor. */
  window.addEventListener('pageshow', (e) => { if (e.persisted) { olvidar(); window.location.reload(); } });
  /* Y antes de guardarse en esa memoria, la lista de personas ya se va. */
  window.addEventListener('pagehide', (e) => { if (e.persisted) olvidar(); });

  arrancar();
}
