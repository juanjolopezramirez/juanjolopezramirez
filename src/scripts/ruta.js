import { BARAJA } from '../data/ruta/cartas.js';
import { PASO, FALTA } from '../data/ruta/pasos.js';
import { TODAVIA_NO } from '../data/ruta/servicios.js';
import { RAMA, diagnosticar } from '../data/ruta/diagnostico.js';
import { RUTA, di, rellenar } from '../data/ruta/textos.js';
import { CONTACT } from '../data/social.js';

/* EL JUEGO. Tres pantallas que se turnan y una cuenta al final.

   NO SE PIDE NADA HASTA DESPUES DEL RESULTADO. Ni correo ni telefono ni
   nombre. El resultado se entrega primero y completo; despues, si la
   persona quiere, escribe. Un formulario antes del resultado convierte
   esto en un anzuelo, que es lo contrario de lo que la ruta dice ser.

   SE PUEDE VOLVER ATRAS SIN PERDER NADA. Lo elegido vive en `elegidas`,
   por numero de ronda, asi que retroceder solo cambia que ronda se mira;
   al volver adelante la carta sigue marcada y la derecha, volteada.

   EL RECORRIDO SE GUARDA AL FINAL, no carta por carta: a mitad de camino
   todavia no hay nada que contar, y mandar cinco peticiones para guardar
   una sola cosa es ruido.

   DONDE SE MANDA. `RECOLECTOR` esta vacio a proposito: este sitio es
   estatico y hoy no hay a donde mandarlo (ver src/server/recorrido.js).
   Mientras este vacio —o mientras falle— el recorrido se queda en una cola
   en el dispositivo y se reintenta la proxima visita. El dia que haya
   direccion, se pone aqui y la cola se vacia sola. */

const RECOLECTOR = '';
const COLA = 'jlr:ruta:cola';
const SESION = 'jlr:ruta:estado';

const d = document;
const caja = d.querySelector('[data-ruta]');

if (caja) {
  const lang = caja.dataset.lang || 'es';
  const texto = (campo) => di(campo, lang);

  /* ---------- El estado ---------- */
  const estado = {
    rama: null,
    ronda: 1,
    elegidas: {},        /* { 1: 'e-conocer', 2: 'e-seria', … } */
    guardar: true
  };

  const rondasDe = (rama) => BARAJA[RAMA[rama].baraja];
  const totalRondas = () => (estado.rama ? rondasDe(estado.rama).length : 0);
  const idsEnOrden = () =>
    Object.keys(estado.elegidas)
      .map(Number)
      .sort((a, b) => a - b)
      .map((n) => estado.elegidas[n]);

  const guardarSesion = () => {
    try { sessionStorage.setItem(SESION, JSON.stringify(estado)); } catch (e) {}
  };
  const leerSesion = () => {
    try {
      const v = JSON.parse(sessionStorage.getItem(SESION) || 'null');
      if (v && RAMA[v.rama]) Object.assign(estado, v);
    } catch (e) {}
  };

  /* ---------- Las pantallas ---------- */
  const pantallas = {};
  caja.querySelectorAll('[data-pantalla]').forEach((s) => { pantallas[s.dataset.pantalla] = s; });

  function verPantalla(cual) {
    Object.entries(pantallas).forEach(([k, s]) => { s.hidden = k !== cual; });
  }

  /* ---------- Las rondas ---------- */
  const secciones = [...caja.querySelectorAll('.ronda')];

  function seccionDe(rama, n) {
    const baraja = RAMA[rama].baraja;
    return secciones.find((s) => s.dataset.rama === baraja && Number(s.dataset.ronda) === n);
  }

  function pintarRonda() {
    const n = estado.ronda;
    const total = totalRondas();
    const activa = seccionDe(estado.rama, n);
    secciones.forEach((s) => { s.hidden = s !== activa; });

    /* Lo ya elegido en esta ronda vuelve a su sitio. */
    const elegida = estado.elegidas[n];
    const derecha = activa.querySelector('.carta--depende');
    const cara = activa.querySelector('[data-cara]');
    activa.querySelectorAll('[data-carta]').forEach((b) => {
      const suya = b.dataset.carta === elegida;
      b.setAttribute('aria-pressed', suya ? 'true' : 'false');
      if (suya) cara.textContent = b.dataset.depende;
    });
    derecha.dataset.destapada = elegida ? 'si' : 'no';

    const progreso = caja.querySelector('[data-progreso]');
    if (progreso) progreso.textContent = rellenar(texto(RUTA.ronda), { n, de: total });
    const barra = caja.querySelector('[data-barra]');
    if (barra) barra.style.width = `${Math.round((n / total) * 100)}%`;

    const seguir = caja.querySelector('[data-seguir]');
    seguir.disabled = !elegida;
    caja.querySelector('[data-seguir-texto]').textContent =
      n === total ? texto(RUTA.verResultado) : texto(RUTA.seguir);
  }

  /* ---------- Elegir una carta ---------- */
  caja.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-carta]');
    if (!boton) return;
    const seccion = boton.closest('.ronda');
    seccion.querySelectorAll('[data-carta]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    boton.setAttribute('aria-pressed', 'true');
    seccion.querySelector('[data-cara]').textContent = boton.dataset.depende;
    seccion.querySelector('.carta--depende').dataset.destapada = 'si';
    estado.elegidas[estado.ronda] = boton.dataset.carta;
    guardarSesion();
    caja.querySelector('[data-seguir]').disabled = false;
  });

  /* ---------- La bifurcacion ---------- */
  caja.querySelectorAll('[data-rama-elegir]').forEach((b) => {
    b.addEventListener('click', () => {
      estado.rama = b.dataset.ramaElegir;
      estado.ronda = 1;
      estado.elegidas = {};
      guardarSesion();
      verPantalla('juego');
      pintarRonda();
    });
  });

  /* ---------- Adelante y atras ---------- */
  caja.querySelector('[data-seguir]').addEventListener('click', () => {
    if (!estado.elegidas[estado.ronda]) return;
    if (estado.ronda < totalRondas()) {
      estado.ronda += 1;
      guardarSesion();
      pintarRonda();
      pantallas.juego.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else {
      terminar();
    }
  });

  caja.querySelector('[data-atras]').addEventListener('click', () => {
    if (estado.ronda > 1) {
      estado.ronda -= 1;
      guardarSesion();
      pintarRonda();
    } else {
      verPantalla('inicio');
    }
  });

  /* ---------- No guardar nada ---------- */
  const salir = caja.querySelector('[data-no-guardar]');
  if (salir) {
    salir.addEventListener('click', () => {
      estado.guardar = false;
      guardarSesion();
      salir.closest('.ruta__aviso').hidden = true;
      const fuera = caja.querySelector('[data-aviso-fuera]');
      if (fuera) fuera.hidden = false;
    });
  }

  /* ---------- Otra vez ---------- */
  caja.querySelector('[data-otra-vez]').addEventListener('click', () => {
    estado.rama = null;
    estado.ronda = 1;
    estado.elegidas = {};
    guardarSesion();
    verPantalla('inicio');
  });

  /* ============================================================
     EL RESULTADO
     ============================================================ */
  function terminar() {
    const ids = idsEnOrden();
    const dx = diagnosticar(estado.rama, ids);
    if (!dx) return;

    const p = PASO[dx.paso];
    /* El nombre y el lema estan escritos como frase suelta —«El inicio»,
       «Que te vean»— y aqui entran detras de dos puntos, en mitad de otra
       frase. Se les baja la primera letra: la mayuscula ahi se lee como si
       empezara una frase nueva que no empieza. */
    const minuscula = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
    const nombrePaso = minuscula(di(p.nombre, lang));
    const lema = minuscula(di(p.lema[dx.voz], lang));
    const wa = CONTACT.find((c) => c.id === 'whatsapp' && c.href);

    const pon = (sel, txt) => { const el = caja.querySelector(sel); if (el) el.textContent = txt; };

    /* TODO LO QUE DEPENDE DEL RESULTADO SE BORRA ANTES DE ESCRIBIRLO. Esta
       pantalla se rellena varias veces —«hacerlo otra vez» no recarga la
       pagina— y lo que solo se pone en una rama se quedaba puesto en la
       siguiente: el boton decia «avísame cuando abra» despues de un
       resultado con marca abierta, y el aviso de marca cerrada sobrevivia
       al caso en el que no se vende nada. Se apaga aqui y lo enciende
       quien lo necesite. */
    pon('[data-fin-wa-texto]', texto(RUTA.escribir));
    const cerradaCaja = caja.querySelector('[data-fin-cerrada]');
    cerradaCaja.hidden = true;
    cerradaCaja.textContent = '';

    /* 1 — en que paso esta */
    pon('[data-fin-paso]', rellenar(texto(RUTA.estasEn), { paso: nombrePaso, lema }));

    const equilibrio = dx.lectura === 'equilibrio';
    const cajaServicio = caja.querySelector('[data-fin-servicio-caja]');
    const cajaPruebas = caja.querySelector('[data-fin-pruebas-caja]');
    const cajaNo = caja.querySelector('.fin__no');

    if (equilibrio) {
      /* 6 — bien en los tres pasos: no se le vende nada. */
      pon('[data-fin-titulo]', texto(RUTA.equilibrioTitulo));
      pon('[data-fin-cuerpo]', `${texto(RUTA.equilibrioCuerpo)} ${texto(RUTA.equilibrioSeisMeses)}`);
      cajaServicio.hidden = true;
      cajaNo.hidden = true;
    } else {
      cajaServicio.hidden = false;
      cajaNo.hidden = false;

      /* 2 — Emet o Met, en dos frases. */
      const met = dx.lectura === 'met';
      pon('[data-fin-titulo]', texto(met ? RUTA.metTitulo : RUTA.emetTitulo));
      pon('[data-fin-cuerpo]', met
        ? `${texto(RUTA.metCuerpo)} ${texto(FALTA)}`
        : texto(RUTA.emetCuerpo));

      /* 3 — que sigue: trabajo con nombre, que incluye y cuanto dura. */
      const s = dx.servicio;
      pon('[data-fin-servicio]', di(s.nombre, lang));
      const incluye = caja.querySelector('[data-fin-incluye]');
      incluye.innerHTML = '';
      di(s.incluye, lang).forEach((linea) => {
        const li = d.createElement('li');
        li.textContent = linea;
        incluye.appendChild(li);
      });
      pon('[data-fin-dura]', di(s.dura, lang));
      pon('[data-fin-atiende]', rellenar(texto(RUTA.atiende), { marca: s.marca.nombre }));

      /* La marca que todavia no ha abierto se dice, no se esconde. */
      if (!s.marca.abierta) {
        cerradaCaja.hidden = false;
        cerradaCaja.textContent = rellenar(texto(RUTA.noAbierta), { marca: s.marca.nombre });
      }

      /* 4 — que no necesita todavia. Obligatorio, siempre. */
      pon('[data-fin-no]', texto(TODAVIA_NO[dx.paso]));
    }

    /* Las cartas como prueba, citadas tal cual. */
    const lista = caja.querySelector('[data-fin-pruebas]');
    lista.innerHTML = '';
    dx.pruebas.forEach((c) => {
      const li = d.createElement('li');
      li.textContent = rellenar(texto(RUTA.prueba), {
        deseo: di(c.deseo, lang).replace(/\.$/, ''),
        depende: di(c.dependeDe, lang).replace(/^De /, '').replace(/^Dal /, '').replace(/^On /, '')
      });
      lista.appendChild(li);
    });
    cajaPruebas.hidden = !dx.pruebas.length;

    /* 5 — WhatsApp con el mensaje ya escrito. */
    const enlace = caja.querySelector('[data-fin-wa]');
    if (wa) {
      let cuerpo;
      if (equilibrio) {
        cuerpo = texto(RUTA.mensajeEquilibrio);
      } else if (!dx.servicio.marca.abierta) {
        cuerpo = rellenar(texto(RUTA.mensajeEspera), { paso: nombrePaso, marca: dx.servicio.marca.nombre });
        caja.querySelector('[data-fin-wa-texto]').textContent = texto(RUTA.listaEspera);
      } else {
        cuerpo = rellenar(texto(RUTA.mensaje), {
          paso: nombrePaso,
          diagnostico: texto(dx.lectura === 'met' ? RUTA.dxMet : RUTA.dxEmet),
          servicio: di(dx.servicio.nombre, lang)
        });
      }
      enlace.href = `${wa.href}?text=${encodeURIComponent(cuerpo)}`;
    } else {
      enlace.hidden = true;
    }

    verPantalla('fin');
    pantallas.fin.focus();
    if (estado.guardar) mandar({ rama: estado.rama, idioma: lang, cartas: ids });
  }

  /* ============================================================
     GUARDAR EL RECORRIDO — anonimo, y sin perderlo si no hay a donde
     ============================================================ */
  function cola() {
    try { return JSON.parse(localStorage.getItem(COLA) || '[]'); } catch (e) { return []; }
  }
  function encolar(fila) {
    try {
      const c = cola();
      c.push(fila);
      localStorage.setItem(COLA, JSON.stringify(c.slice(-50)));
    } catch (e) {}
  }
  function vaciarCola() {
    try { localStorage.removeItem(COLA); } catch (e) {}
  }

  async function mandar(fila) {
    const completa = { ...fila, creado: new Date().toISOString() };
    if (!RECOLECTOR) { encolar(completa); return; }
    try {
      const r = await fetch(RECOLECTOR, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(completa),
        keepalive: true
      });
      if (!r.ok) encolar(completa);
    } catch (e) {
      encolar(completa);
    }
  }

  /* Lo que quedo esperando de otras visitas, en cuanto haya a donde. */
  async function reintentar() {
    if (!RECOLECTOR) return;
    const pendientes = cola();
    if (!pendientes.length) return;
    try {
      for (const fila of pendientes) {
        const r = await fetch(RECOLECTOR, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(fila)
        });
        if (!r.ok) return;
      }
      vaciarCola();
    } catch (e) {}
  }

  /* ---------- Arranque ---------- */
  leerSesion();
  if (estado.rama && Object.keys(estado.elegidas).length) {
    verPantalla('juego');
    pintarRonda();
  }
  reintentar();
}
