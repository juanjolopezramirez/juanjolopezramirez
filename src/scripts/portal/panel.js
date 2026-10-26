/* El panel de «The Alef Code» (components/portal/Panel.astro) cobra vida.

   1. GUARDIA. Antes de enseñar nada pregunta al SERVIDOR quien eres: sin sesion
      → de vuelta al portal; con sesion pero sin estar aprobado → de vuelta al
      portal (alli ve su pantalla: pendiente o rechazado). Nada del panel se abre
      mientras tanto. Si algo tarda o falla, «No pude conectar», no un panel a medias.
   2. MENU. Una seccion a la vez, por la direccion (#accesos): el ancla se
      comprueba contra la lista de secciones que le tocan a esta persona.
   3. «QUIEN ENTRA» (solo admin): pendientes, con acceso, sin acceso e invitaciones.
      Las lee y las cambia la base (RLS + decidir_acceso): si quien llama no es
      admin, el servidor contesta vacio o con error, tenga la pagina el aspecto
      que tenga.

   Todo texto de otra persona (nombre, correo, motivo) entra con `textContent`. */
import { abrirBackend } from './backend.js';
import { bitacora, fondoQuieto, modoFondo } from './carga.js';
import { anclaValida, correoValido, idiomaDe, rutaPortal } from './estado.js';
import { idsPara } from '../../data/portal/secciones.js';

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
  const a = p.accesos || {};

  const elCargando = raiz.querySelector('[data-cargando]');
  const elProblema = raiz.querySelector('[data-problema]');
  const elMarco = raiz.querySelector('[data-marco]');
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
  let accesosPintados = false;
  let ocupado = false;

  const textoDe = (clave) => (hay(errores, clave) ? errores[clave] : (errores.generico || 'Algo no salió bien.'));
  const fecha = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  /* ---- Guardia ---------------------------------------------------------------- */
  function alPortal(saliendo = false) {
    /* En la demo la direccion lleva `?demo=…`: se conserva para no perder el caso, salvo al
       SALIR (si no, el portal te volveria a meter con el mismo `?demo=`). */
    const sufijo = be && be.modo === 'demo' ? (saliendo ? '?demo=entrar' : window.location.search) : '';
    window.location.replace(rutaPortal(lang) + sufijo);
  }

  function problema() {
    modoFondo('reposo');
    elCargando.hidden = true;
    elMarco.hidden = true;
    elProblema.hidden = false;
    elProblema.focus();                      // el aviso se lee: sin foco, un aviso que aparece ya lleno suele callar
  }

  async function arrancar() {
    elProblema.hidden = true;
    elCargando.hidden = false;
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

    be.alCambiar((evento) => { if (evento === 'SIGNED_OUT') { olvidar(); alPortal(true); } });
    abrir(ses, perfil);
  }

  /* ---- Abrir el panel ------------------------------------------------------------ */
  function abrir(ses, perfil) {
    yo = ses.id;
    esAdmin = !!perfil.esAdmin;
    if (!esAdmin) raiz.querySelectorAll('[data-solo-admin]').forEach((el) => el.remove());
    ids = idsPara(esAdmin);

    const demo = raiz.querySelector('[data-demo]');
    if (demo) demo.hidden = be.modo !== 'demo';

    const nombre = typeof perfil.nombre === 'string' ? perfil.nombre.trim() : '';
    const titulo = raiz.querySelector('[data-titulo="inicio"]');
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
    const libre = !document.activeElement || document.activeElement === document.body;
    irA(anclaValida(window.location.hash, ids) || 'inicio', libre);
    window.addEventListener('hashchange', () => irA(anclaValida(window.location.hash, ids) || 'inicio', true));
  }

  function irA(id, foco) {
    raiz.querySelectorAll('[data-seccion]').forEach((s) => { s.hidden = s.dataset.seccion !== id; });
    raiz.querySelectorAll('[data-nav]').forEach((enlace) => {
      /* «true» y no «page»: site.js usa a[aria-current="page"] para el aviso «Ya estas aqui» del menu
         del sitio, y esto es la seccion de DENTRO de la pagina, no otra pagina. */
      if (enlace.dataset.nav === id) enlace.setAttribute('aria-current', 'true');
      else enlace.removeAttribute('aria-current');
    });
    /* La ruta de la barra de la terminal: ~/panel/<seccion>. */
    const ruta = raiz.querySelector('[data-ruta-actual]');
    if (ruta) ruta.textContent = `~/panel/${id}`;
    if (foco) {
      const t = raiz.querySelector(`[data-titulo="${id}"]`);
      if (t) t.focus();
    }
    if (id === 'accesos' && esAdmin && !accesosPintados) {
      accesosPintados = true;                                                 // no lanzarla dos veces a la vez
      recargarAccesos().then((bien) => { if (!bien) accesosPintados = false; });   // si falla, se reintenta al volver a la seccion
    }
  }

  /* ---- «Quién entra» ---------------------------------------------------------------- */
  const acc = raiz.querySelector('[data-seccion="accesos"]');
  const plantilla = (nombre) => {
    const t = raiz.querySelector(`template[data-plantilla="${nombre}"]`);
    return t ? t.content : null;
  };
  const poner = (fila, campo, texto) => {
    const el = fila.querySelector(`[data-campo="${campo}"]`);
    if (el) el.textContent = typeof texto === 'string' ? texto : '';
  };

  function avisar(texto) {
    const el = acc && acc.querySelector('[data-aviso]');
    if (!el) return;
    el.hidden = false;
    el.textContent = texto;
    el.focus();
  }
  function errorAcc(clave) {
    const el = acc && acc.querySelector('.panel__accesos > [data-error]');
    if (!el) return;
    el.textContent = '';
    el.hidden = false;
    setTimeout(() => { el.textContent = textoDe(clave); }, 30);
  }
  function limpiarAcc() {
    if (!acc) return;
    const av = acc.querySelector('[data-aviso]');
    if (av) { av.hidden = true; av.textContent = ''; }
    const er = acc.querySelector('.panel__accesos > [data-error]');
    if (er) { er.hidden = true; er.textContent = ''; }
  }

  function filaPersona(f) {
    const base = plantilla('persona');
    if (!base) return null;
    const li = base.cloneNode(true).firstElementChild;
    const nombre = typeof f.nombre === 'string' && f.nombre.trim() ? f.nombre.trim() : (a.sinNombre || '');
    poner(li, 'nombre', nombre);
    poner(li, 'correo', f.correo);
    poner(li, 'motivo', f.id === yo ? (a.tu || '') : (f.motivo || (f.estado === 'pendiente' ? (a.sinMotivo || '') : '')));
    poner(li, 'fecha', `${a.pedido || ''} ${fecha(f.creado)}`.trim());
    li.querySelectorAll('[data-accion]').forEach((b) => {
      const en = String(b.dataset.en || '').split(' ');
      if (f.id === yo || !en.includes(f.estado)) { b.remove(); return; }
      b.setAttribute('aria-label', `${b.textContent} (${f.nombre || f.correo})`);
      b.addEventListener('click', () => decidir(f, b.dataset.accion, b));
    });
    return li;
  }

  function filaInvitacion(i) {
    const base = plantilla('invitacion');
    if (!base) return null;
    const li = base.cloneNode(true).firstElementChild;
    poner(li, 'correo', i.correo);
    let estado;
    if (i.usada_en) estado = a.usada || '';
    else if (new Date(i.caduca).getTime() < Date.now()) estado = a.caducada || '';
    else estado = `${a.esperando || ''} · ${a.hasta || ''} ${fecha(i.caduca)}`.trim();
    poner(li, 'estado', estado);
    const b = li.querySelector('[data-borrar]');
    if (b) {
      b.setAttribute('aria-label', `${b.textContent} (${i.correo})`);
      b.addEventListener('click', () => borrarInvitacion(i.correo, b));
    }
    return li;
  }

  function llenar(nombre, filas, hacer, total = filas.length) {
    const lista = acc.querySelector(`[data-lista="${nombre}"]`);
    const vacio = acc.querySelector(`[data-vacio="${nombre}"]`);
    const cuenta = acc.querySelector(`[data-cuenta="${nombre}"]`);
    const mas = acc.querySelector(`[data-mas="${nombre}"]`);
    if (!lista) return;
    lista.replaceChildren();
    filas.forEach((f) => { const li = hacer(f); if (li) lista.appendChild(li); });
    if (vacio) vacio.hidden = filas.length > 0;
    if (cuenta) cuenta.textContent = total ? `(${total})` : '';
    if (mas) mas.hidden = total <= filas.length;
  }

  async function recargarAccesos() {
    const [per, inv] = await Promise.all([be.accesos.listarPerfiles(), be.accesos.listarInvitaciones()]);
    if (per.error || inv.error) { errorAcc(per.error || inv.error); return false; }
    const de = (estado) => per.filas.filter((f) => (estado === 'pendiente' ? f.estado !== 'aprobado' && f.estado !== 'rechazado' : f.estado === estado));
    const t = per.totales || {};
    llenar('pendientes', de('pendiente'), filaPersona, t.pendiente);
    llenar('aprobados', de('aprobado'), filaPersona, t.aprobado);
    llenar('rechazados', de('rechazado'), filaPersona, t.rechazado);
    llenar('invitaciones', inv.filas, filaInvitacion);
    return true;
  }

  /* Una accion a la vez: mientras una corre, las demas esperan. */
  async function conOcupado(boton, tarea) {
    if (ocupado) return;
    ocupado = true;
    if (boton) boton.setAttribute('aria-busy', 'true');
    try { await tarea(); } catch (e) { errorAcc('generico'); } finally {
      ocupado = false;
      if (boton) boton.removeAttribute('aria-busy');
    }
  }

  function decidir(f, estado, boton) {
    return conOcupado(boton, async () => {
      limpiarAcc();
      const r = await be.accesos.decidir(f.id, estado);
      if (r.error) { errorAcc(r.error); return; }
      if (await recargarAccesos()) avisar(estado === 'aprobado' ? a.listoAprobado : a.listoRechazado);
    });
  }

  function borrarInvitacion(correo, boton) {
    return conOcupado(boton, async () => {
      limpiarAcc();
      const r = await be.accesos.borrarInvitacion(correo);
      if (r.error) { errorAcc(r.error); return; }
      if (await recargarAccesos()) avisar(a.listoQuitado);
    });
  }

  function quitarMarcaCampo(campo) {
    campo.removeAttribute('aria-invalid');
    if (!campo.hasAttribute('data-desc-base')) return;
    const base = campo.getAttribute('data-desc-base');
    if (base) campo.setAttribute('aria-describedby', base); else campo.removeAttribute('aria-describedby');
    campo.removeAttribute('data-desc-base');
  }

  const formInvitar = acc && acc.querySelector('[data-form="invitar"]');
  if (formInvitar) {
    formInvitar.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!be || !esAdmin) return;
      const campo = formInvitar.elements.email;
      const err = formInvitar.querySelector('[data-error]');
      const mostrar = (clave) => {
        campo.setAttribute('aria-invalid', 'true');
        if (!err.id) err.id = 'panel-error-invitar';
        if (!campo.hasAttribute('data-desc-base')) campo.setAttribute('data-desc-base', campo.getAttribute('aria-describedby') || '');
        campo.setAttribute('aria-describedby', `${campo.getAttribute('data-desc-base')} ${err.id}`.trim());
        err.textContent = '';
        err.hidden = false;
        setTimeout(() => { err.textContent = textoDe(clave); }, 30);
        campo.focus();
      };
      quitarMarcaCampo(campo);
      err.hidden = true;
      const correo = campo.value.trim();
      if (!correoValido(correo)) { mostrar('correoInvalido'); return; }
      conOcupado(formInvitar.querySelector('button[type="submit"]'), async () => {
        limpiarAcc();
        const r = await be.accesos.invitar(correo);
        if (r.error) { mostrar(r.error); return; }
        campo.value = '';
        if (await recargarAccesos()) avisar(a.listoInvitado);
      });
    });
    formInvitar.addEventListener('input', (e) => {
      if (e.target && e.target.removeAttribute) quitarMarcaCampo(e.target);
    });
  }

  /* ---- Salir y reintentar --------------------------------------------------------- */
  raiz.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('button') : null;
    if (!b || !raiz.contains(b)) return;
    if (b.hasAttribute('data-salir') && be) {
      be.salir().then(() => { olvidar(); alPortal(true); });
    } else if (b.hasAttribute('data-reintentar')) {
      arrancar();
    }
  });

  /* Al salir, lo que se vio de otras personas se borra de la pagina antes de irse. */
  function olvidar() {
    elMarco.hidden = true;
    raiz.querySelectorAll('[data-lista]').forEach((l) => l.replaceChildren());
    raiz.querySelectorAll('[data-cuenta]').forEach((c) => { c.textContent = ''; });
    const saludo = raiz.querySelector('[data-titulo="inicio"]');
    if (saludo && p.secciones && p.secciones.inicio) saludo.textContent = p.secciones.inicio.titulo;
  }

  /* Si el navegador devuelve esta pagina de su memoria («atrás» tras salir), no se
     enseña lo que habia: se recarga y la guardia vuelve a preguntar al servidor. */
  window.addEventListener('pageshow', (e) => { if (e.persisted) { olvidar(); window.location.reload(); } });
  /* Y antes de guardarse en esa memoria, la lista de personas ya se va. */
  window.addEventListener('pagehide', (e) => { if (e.persisted) olvidar(); });

  arrancar();
}
