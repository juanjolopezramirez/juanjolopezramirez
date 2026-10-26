/* La tarjeta del portal «The Alef Code» (components/portal/Tarjeta.astro) cobra vida.

   QUE HACE
     1. Abre el backend (real, demo o ninguno: backend.js) y mira quien eres.
     2. Enseña UNA pantalla de la hoja segun quien seas (estado.js → pantallaPara):
        sin sesion → entrar · pendiente · rechazado · aprobado (y te manda al panel).
     3. Atiende los formularios y los botones: entrar, pedir acceso, olvide mi
        contraseña, contraseña nueva, guardar el motivo, Google, salir.

   REGLAS
     · Todo texto que se pinta es `textContent` (nada de innerHTML): ni lo que
       escribe quien entra ni lo que contesta el servidor llega al DOM como HTML.
     · Los mensajes de error salen de textos.js por CLAVE; jamas el del servidor.
     · La pantalla la decide el SERVIDOR (perfil leido con RLS), no esta pagina:
       forzar una pantalla desde la consola no abre nada, porque el panel vuelve a
       comprobarlo y los datos los guarda la base detras de sus reglas.
     · Al cambiar de pantalla el foco va al titulo nuevo (si lo pidio una persona)
       y los errores se anuncian con role="alert". */
import { abrirBackend } from './backend.js';
import { bitacora, esperaDeEntrada, modoFondo } from './carga.js';
import { correoValido, errorDeClave, idiomaDe, limpiar, pantallaPara, rutaPanel } from './estado.js';

const TARDO = Symbol('tardo');
const limite = (promesa, ms = 15000) =>
  Promise.race([promesa, new Promise((resolver) => setTimeout(() => resolver(TARDO), ms))]);
const hay = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

/* A estas se puede ir con un botón `data-ir` (las demás las decide el codigo). */
const IR_A = ['entrar', 'pedir', 'recuperar'];

const raiz = document.querySelector('[data-portal]');
/* Dentro de un marco AJENO la tarjeta no se abre (como el panel): sus botones tapados
   por otra pagina se podrian pulsar sin querer. */
const enMarcoAjeno = (() => { try { return window.top !== window.self; } catch (e) { return true; } })();
if (raiz && !enMarcoAjeno) iniciar(raiz);

function leerTextos() {
  try { return JSON.parse(document.getElementById('portal-textos').textContent); } catch (e) { return null; }
}

/* Google (o el enlace del correo) vuelve con `?error=…` o `#error=…` si algo fallo. */
function errorDeLaDireccion() {
  const buscar = (s) => { try { return new URLSearchParams(s); } catch (e) { return new URLSearchParams(); } };
  const q = buscar(window.location.search);
  const h = buscar(window.location.hash.replace(/^#/, ''));
  const hubo = q.has('error') || h.has('error');
  if (!hubo) return null;
  const codigo = String(q.get('error_code') || h.get('error_code') || '');
  return /otp|expired/i.test(codigo) ? 'enlaceCaducado' : 'google';
}

function iniciar(raiz) {
  const lang = idiomaDe(raiz.dataset.idioma);
  const tx = leerTextos() || {};
  const errores = tx.errores || {};
  const pantallas = new Map();
  raiz.querySelectorAll('[data-pantalla]').forEach((el) => pantallas.set(el.dataset.pantalla, el));
  const avisoDemo = raiz.querySelector('[data-demo]');
  const regionAnuncio = raiz.querySelector('[data-anuncio]');
  const log = bitacora(raiz.querySelector('[data-bitacora]'), tx.bitacora);
  let nError = 0;
  raiz.querySelectorAll('[data-error]').forEach((p) => { if (!p.id) p.id = `portal-error-${++nError}`; });

  let be = null;               // el backend (null = apagado)
  let vista = null;            // la pantalla que se ve
  let sesion = null;
  let recuperando = false;     // llego por el enlace de «olvide mi contraseña»
  let ronda = 0;               // cada vez que cambia quien eres, la anterior se descarta
  let enCurso = null;          // { id, ronda, promesa } de resolver()
  let resuelto = null;         // id de quien ya se resolvio
  let ocupado = false;
  let enfocar = false;         // la proxima pantalla la pidio una persona: llevar el foco
  let escuchando = false;
  let correoVisto = '';        // el correo que ya se escribio: no se pide dos veces (WCAG 3.3.7)

  /* ---- Pantallas y mensajes -------------------------------------------------- */
  function limpiarErrores(scope) {
    scope.querySelectorAll('[data-error]').forEach((p) => { p.hidden = true; p.textContent = ''; });
    scope.querySelectorAll('[data-listo]').forEach((p) => { p.hidden = true; });
    scope.querySelectorAll('[aria-invalid]').forEach(quitarMarca);
  }

  /* Un campo con error apunta a su aviso (`aria-describedby`), sin perder su ayuda. */
  function asociar(campo, idError) {
    if (!campo.hasAttribute('data-desc-base')) campo.setAttribute('data-desc-base', campo.getAttribute('aria-describedby') || '');
    campo.setAttribute('aria-describedby', `${campo.getAttribute('data-desc-base')} ${idError}`.trim());
  }
  function quitarMarca(campo) {
    campo.removeAttribute('aria-invalid');
    if (!campo.hasAttribute('data-desc-base')) return;
    const base = campo.getAttribute('data-desc-base');
    if (base) campo.setAttribute('aria-describedby', base); else campo.removeAttribute('aria-describedby');
    campo.removeAttribute('data-desc-base');
  }

  /* Anuncia con la region siempre presente: se vacia y se rellena un instante despues. */
  function anunciar(texto) {
    if (!regionAnuncio || !texto) return;
    regionAnuncio.textContent = '';
    setTimeout(() => { regionAnuncio.textContent = texto; }, 60);
  }
  function mostrarListo(el) {
    if (!el) return;
    el.hidden = false;
    anunciar(el.textContent);
  }

  function reiniciarOjos(scope) {
    scope.querySelectorAll('[data-ojo]').forEach((b) => {
      const campo = document.getElementById(b.getAttribute('aria-controls'));
      if (campo && campo.type === 'text') campo.type = 'password';
      b.setAttribute('aria-pressed', 'false');
      const ver = b.querySelector('[data-ojo-ver]');
      const no = b.querySelector('[data-ojo-no]');
      if (ver) ver.hidden = false;
      if (no) no.hidden = true;
    });
  }

  function mostrar(nombre, foco = false) {
    const destino = pantallas.get(nombre);
    if (!destino) return;
    /* Si el foco estaba dentro de la tarjeta, la pantalla que se esconde se lo lleva:
       hay que devolverselo a la nueva (WCAG 2.4.3), pidalo o no una persona. */
    const activo = document.activeElement;
    /* Solo el foco que estaba en la HOJA: si estaba en la barra (la pausa del fondo,
       «Inicio»), se queda alli y nadie te lo quita mientras carga. */
    const hoja = raiz.querySelector('.portal__hoja') || raiz;
    const teniaFoco = !!activo && activo !== document.body && hoja.contains(activo);
    if (nombre === 'cargando' && vista !== 'cargando') log.limpiar();
    /* El fondo acompaña: llueve mientras se espera, descifra la א al entrar, descansa en lo demas. */
    modoFondo(nombre === 'cargando' ? 'carga' : nombre === 'aprobado' ? 'entrada' : 'reposo');
    pantallas.forEach((el, n) => { el.hidden = n !== nombre; });
    vista = nombre;
    raiz.dataset.vista = nombre;
    /* La ruta de la barra de la terminal (~/entrar, ~/pedir-acceso…): la dice cada pantalla. */
    const ruta = raiz.querySelector('[data-ruta-actual]');
    if (ruta && destino.dataset.ruta) ruta.textContent = `~/${destino.dataset.ruta}`;
    limpiarErrores(destino);
    reiniciarOjos(destino);
    if (correoVisto) {
      destino.querySelectorAll('input[name="email"]').forEach((c) => { if (!c.value) c.value = correoVisto; });
    }
    const titulo = destino.querySelector('[tabindex="-1"]');
    if ((foco || teniaFoco) && titulo) { titulo.focus(); return; }
    if (titulo && nombre !== 'cargando') anunciar(titulo.textContent);
  }

  function textoDe(clave) {
    return hay(errores, clave) ? errores[clave] : (errores.generico || 'Algo no salió bien.');
  }

  /* El texto entra un instante despues de mostrar el aviso: asi los lectores de
     pantalla anuncian el cambio (un role="alert" que aparece ya lleno suele callar). */
  function mostrarError(scope, clave, campos = []) {
    scope.querySelectorAll('[aria-invalid]').forEach(quitarMarca);
    const p = scope.querySelector('[data-error]');
    campos.forEach((c) => {
      c.setAttribute('aria-invalid', 'true');
      if (p) asociar(c, p.id);
    });
    if (p) {
      p.textContent = '';
      p.hidden = false;
      setTimeout(() => { p.textContent = textoDe(clave); }, 30);
    }
    if (campos[0]) campos[0].focus();
  }

  async function conOcupado(boton, tarea) {
    if (ocupado) return;
    ocupado = true;
    if (boton) boton.setAttribute('aria-busy', 'true');
    try { return await tarea(); } finally {
      ocupado = false;
      if (boton) boton.removeAttribute('aria-busy');
    }
  }

  /* ---- Quien eres → que pantalla --------------------------------------------- */
  function irAlPanel(perfil) {
    const q = new URLSearchParams();
    if (be.modo === 'demo') q.set('demo', perfil && perfil.esAdmin ? 'admin' : 'miembro');
    /* Si pausaste el fondo aqui, el panel llega pausado (sin guardar nada en el navegador). */
    if (document.documentElement.classList.contains('fondo-quieto')) q.set('quieto', '1');
    const sufijo = q.toString() ? `?${q}` : '';
    window.location.replace(rutaPanel(lang) + sufijo);
  }

  function prepararPendiente(perfil) {
    const form = raiz.querySelector('[data-motivo-form]');
    if (!form) return;
    form.hidden = false;
    const campo = form.elements.motivo;
    if (campo && perfil && typeof perfil.motivo === 'string') campo.value = perfil.motivo;
  }

  async function trabajo(ses, mia) {
    sesion = ses;
    mostrar('cargando');
    log.paso('acceso');
    const sigue = () => mia === ronda && !recuperando;
    let perfil = await limite(be.perfil(ses.id));
    if (!sigue()) return;
    if (perfil === TARDO || perfil === undefined) { mostrar('problema', enfocar); enfocar = false; return; }

    /* Si yo la habia invitado, la cuenta pendiente pasa a aprobada aqui mismo. */
    if (perfil && perfil.estado === 'pendiente') {
      const estado = await limite(be.reclamarInvitacion());
      if (!sigue()) return;
      if (estado === 'aprobado') {
        perfil = await limite(be.perfil(ses.id));
        if (!sigue()) return;
        if (perfil === TARDO || perfil === undefined) { mostrar('problema', enfocar); enfocar = false; return; }
      }
    }

    resuelto = ses.id;
    const cual = pantallaPara({ modo: be.modo, sesion: ses, perfil });
    if (cual === 'aprobado') {
      /* La ventana se apaga y la א se descifra (ENTRADA_MS, carga.js); con el fondo quieto, al instante. */
      mostrar('aprobado');
      setTimeout(() => { if (sigue()) irAlPanel(perfil); }, esperaDeEntrada());
      return;
    }
    if (cual === 'pendiente') prepararPendiente(perfil);
    mostrar(cual, enfocar);
    enfocar = false;
  }

  function resolver(ses) {
    if (enCurso && enCurso.id === ses.id) return enCurso.promesa;
    const mia = ++ronda;
    const promesa = trabajo(ses, mia).finally(() => { if (enCurso && enCurso.ronda === mia) enCurso = null; });
    enCurso = { id: ses.id, ronda: mia, promesa };
    return promesa;
  }

  function sinSesion(foco) {
    ronda += 1;
    enCurso = null;
    resuelto = null;
    sesion = null;
    mostrar('entrar', foco);
  }

  /* ---- Los cambios de sesion que llegan solos --------------------------------- */
  function alCambiar(evento, ses) {
    if (evento === 'PASSWORD_RECOVERY') {
      recuperando = true;
      sesion = ses;
      ronda += 1;
      enCurso = null;
      mostrar('nuevaClave');
      return;
    }
    if (evento === 'SIGNED_OUT') {
      recuperando = false;
      sinSesion(enfocar);
      enfocar = false;
      return;
    }
    if (evento === 'SIGNED_IN' && ses && !recuperando && resuelto !== ses.id && !(enCurso && enCurso.id === ses.id)) {
      resolver(ses);
    }
  }

  /* ---- El arranque ------------------------------------------------------------ */
  async function arrancar() {
    mostrar('cargando');
    log.paso('conectando');
    try {
      be = be || await abrirBackend(lang);
    } catch (e) {
      mostrar('problema');
      return;
    }
    if (!be) { mostrar('apagado'); return; }
    if (avisoDemo) avisoDemo.hidden = be.modo !== 'demo';
    if (!escuchando) { escuchando = true; be.alCambiar(alCambiar); }

    /* Un `?code=` en la direccion es el permiso de un solo uso de Google o del enlace del
       correo. Si el cliente lo canjea, lo borra el mismo y hay sesion. Si NO hay sesion, el
       enlace se abrio en otro navegador (o ya se uso): no vale aqui y hay que decirlo. */
    const habiaCodigo = new URLSearchParams(window.location.search).has('code');
    let fallo = errorDeLaDireccion();
    const limpiarDireccion = () => { try { window.history.replaceState(null, '', window.location.pathname); } catch (e) { /* da igual */ } };
    if (fallo) limpiarDireccion();

    log.paso('quien');
    const ses = await limite(be.sesion());
    if (recuperando) return;                       // el enlace del correo ya cambio la pantalla
    if (ses === TARDO || ses === undefined) { mostrar('problema'); return; }   // undefined: no se pudo saber (red)
    if (!ses) {
      if (!fallo && habiaCodigo) { fallo = 'enlaceCaducado'; limpiarDireccion(); }
      mostrar('entrar');
      if (fallo) mostrarError(pantallas.get('entrar'), fallo);
      return;
    }
    await resolver(ses);
  }

  /* ---- Los formularios --------------------------------------------------------- */
  const formularios = {
    async entrar(f) {
      const { email, password } = f.elements;
      const correo = email.value.trim();
      if (!correoValido(correo)) return mostrarError(f, 'correoInvalido', [email]);
      if (!password.value) return mostrarError(f, 'credenciales', [password]);
      limpiarErrores(f);
      const r = await be.entrar(correo, password.value);
      if (r.error) return mostrarError(f, r.error, r.error === 'credenciales' ? [email, password] : []);
      password.value = '';
      const ses = await be.sesion();
      if (!ses) return mostrarError(f, 'generico');
      enfocar = true;
      await resolver(ses);
    },

    async pedir(f) {
      const { nombre, email, password, motivo } = f.elements;
      const n = limpiar(nombre.value, 80);
      const correo = email.value.trim();
      if (!n) return mostrarError(f, 'nombreVacio', [nombre]);
      if (!correoValido(correo)) return mostrarError(f, 'correoInvalido', [email]);
      const mala = errorDeClave(password.value);
      if (mala) return mostrarError(f, mala, [password]);
      limpiarErrores(f);
      const r = await be.registrar({ nombre: n, correo, clave: password.value, motivo: limpiar(motivo.value, 300) });
      if (r.error) return mostrarError(f, r.error);
      password.value = '';
      if (r.necesitaCorreo) { mostrar('correoEnviado', true); return; }
      const ses = await be.sesion();
      if (!ses) { mostrar('correoEnviado', true); return; }
      enfocar = true;
      await resolver(ses);
    },

    async recuperar(f) {
      const { email } = f.elements;
      const correo = email.value.trim();
      if (!correoValido(correo)) return mostrarError(f, 'correoInvalido', [email]);
      limpiarErrores(f);
      const r = await be.recuperar(correo);
      if (r.error) return mostrarError(f, r.error);
      mostrarListo(f.querySelector('[data-listo]'));
    },

    async nuevaClave(f) {
      const { password } = f.elements;
      const mala = errorDeClave(password.value);
      if (mala) return mostrarError(f, mala, [password]);
      limpiarErrores(f);
      const r = await be.nuevaClave(password.value);
      if (r.error) return mostrarError(f, r.error);
      password.value = '';
      recuperando = false;
      resuelto = null;
      const ses = (await be.sesion()) || sesion;
      if (!ses) { sinSesion(true); return; }
      enfocar = true;
      await resolver(ses);
    },

    async motivo(f) {
      if (!sesion) return;
      limpiarErrores(f);
      const r = await be.guardarMotivo(sesion.id, f.elements.motivo.value);
      if (r.error) return mostrarError(f, r.error);
      mostrarListo(f.querySelector('[data-listo]'));
    }
  };

  raiz.addEventListener('submit', (e) => {
    const f = e.target.closest ? e.target.closest('form[data-form]') : null;
    if (!f || !raiz.contains(f)) return;
    e.preventDefault();
    if (!be || !hay(formularios, f.dataset.form)) return;
    const boton = f.querySelector('button[type="submit"]');
    conOcupado(boton, () => formularios[f.dataset.form](f)).catch(() => mostrarError(f, 'generico'));
  });

  /* ---- Los botones --------------------------------------------------------------- */
  raiz.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('button') : null;
    if (!b || !raiz.contains(b)) return;

    if (b.hasAttribute('data-ir')) {
      if (IR_A.includes(b.dataset.ir)) mostrar(b.dataset.ir, true);
      return;
    }

    if (b.hasAttribute('data-ojo')) {
      const campo = document.getElementById(b.getAttribute('aria-controls'));
      if (!campo) return;
      const ver = campo.type === 'password';
      campo.type = ver ? 'text' : 'password';
      b.setAttribute('aria-pressed', ver ? 'true' : 'false');
      const icoVer = b.querySelector('[data-ojo-ver]');
      const icoNo = b.querySelector('[data-ojo-no]');
      if (icoVer) icoVer.hidden = ver;
      if (icoNo) icoNo.hidden = !ver;
      return;
    }

    if (b.hasAttribute('data-google')) {
      if (!be) return;
      const pantalla = b.closest('[data-pantalla]') || raiz;
      const todos = raiz.querySelectorAll('[data-google]');
      conOcupado(null, async () => {
        todos.forEach((g) => g.setAttribute('aria-busy', 'true'));
        limpiarErrores(pantalla);
        const r = await be.google();
        if (r.error) mostrarError(pantalla, r.error);
        /* Si salio bien, el navegador se va a Google (o, en la demo, entra el evento). */
      }).catch(() => mostrarError(pantalla, 'google')).finally(() => {
        todos.forEach((g) => g.removeAttribute('aria-busy'));
      });
      return;
    }

    if (b.hasAttribute('data-salir')) {
      if (!be) return;
      enfocar = true;
      be.salir().then(() => { if (vista !== 'entrar') sinSesion(true); });
      return;
    }

    if (b.hasAttribute('data-reintentar')) {
      arrancar();
    }
  });

  /* Al escribir en un campo marcado con error, se le quita la marca. */
  raiz.addEventListener('input', (e) => {
    const c = e.target;
    if (!c || !c.getAttribute) return;
    if (c.getAttribute('aria-invalid')) quitarMarca(c);
    if (c.name === 'email' && typeof c.value === 'string') correoVisto = c.value.trim();
  });

  /* Si el navegador devuelve esta pagina de su memoria («atrás» desde el panel), vendria
     a medias (la ventana apagada de la entrada, o una pantalla vieja): se recarga y se
     vuelve a preguntar al servidor quien eres. */
  window.addEventListener('pageshow', (e) => { if (e.persisted) window.location.reload(); });

  arrancar();
}
