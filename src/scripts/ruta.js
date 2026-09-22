import { cartasDe } from '../data/ruta/cartas.js';
import { PASO, FALTA } from '../data/ruta/pasos.js';
import { TODAVIA_NO } from '../data/ruta/servicios.js';
import { NIVELES, LISTA_MAX } from '../data/ruta/juegos.js';
import { RAMA, diagnosticar, paraLaLista } from '../data/ruta/diagnostico.js';
import { RUTA, di, rellenar } from '../data/ruta/textos.js';
import { CONTACT } from '../data/social.js';

/* EL JUEGO. Dos mecanicas, un diagnostico.

   NO SE PIDE NADA HASTA DESPUES DEL RESULTADO. Ni correo ni telefono ni
   nombre. Un formulario antes del resultado convierte esto en un anzuelo,
   que es lo contrario de lo que la ruta dice ser.

   EL ARRASTRE ES EL ADORNO, NO EL MECANISMO. Todo se puede jugar tocando
   los dos botones de los lados, con el raton o con el teclado. Quien
   arrastra tiene algo bonito; quien no, tiene exactamente el mismo juego.
   Por eso el arrastre vive en `pointer*` y no en la API de arrastrar y
   soltar del navegador, que en un telefono no existe.

   EL RECORRIDO SE GUARDA AL FINAL, no carta por carta: a mitad de camino
   todavia no hay nada que contar.

   DONDE SE MANDA. `RECOLECTOR` esta vacio a proposito: este sitio es
   estatico y hoy no hay a donde mandarlo (ver src/server/recorrido.js).
   Mientras este vacio —o mientras falle— el recorrido se queda en una cola
   en el dispositivo y se reintenta la proxima visita. */

const RECOLECTOR = '';
const COLA = 'jlr:ruta:cola';
const SESION = 'jlr:ruta:estado';
const UMBRAL = 90;          /* cuanto hay que arrastrar para que la carta se vaya */
const VUELO = 420;          /* lo que tarda en irse, en ms */

const d = document;
const caja = d.querySelector('[data-ruta]');

if (caja) {
  const lang = caja.dataset.lang || 'es';
  const texto = (campo) => di(campo, lang);
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const estado = {
    rama: null,
    juego: 'mazo',
    urgentes: [],
    descartadas: [],
    historial: [],        /* [{ id, lado }] para poder devolver */
    niveles: {},          /* { idDeCarta: idDeNivel } */
    guardar: true
  };

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
  const verPantalla = (cual) => {
    Object.entries(pantallas).forEach(([k, s]) => { s.hidden = k !== cual; });
  };

  const seguir = caja.querySelector('[data-seguir]');
  const seguirTexto = caja.querySelector('[data-seguir-texto]');
  const botonDeshacer = caja.querySelector('[data-deshacer]');
  const secLista = caja.querySelector('.lista');

  const mazoDe = (rama) => caja.querySelector(`.mazo[data-baraja="${RAMA[rama].baraja}"]`);

  /* ============================================================
     JUEGO 1 — EL MAZO
     ============================================================ */
  const naipesDe = (rama) => [...mazoDe(rama).querySelectorAll('.naipe')];
  const vivos = (rama) => naipesDe(rama).filter((n) => !n.classList.contains('is-fuera'));
  const arriba = (rama) => { const v = vivos(rama); return v[v.length - 1] || null; };

  function pintarMazo() {
    const mazo = mazoDe(estado.rama);
    caja.querySelectorAll('.mazo').forEach((m) => { m.hidden = m !== mazo; });
    secLista.hidden = true;

    const v = vivos(estado.rama);
    const top = v[v.length - 1] || null;

    /* Solo las tres de arriba se dibujan apiladas: mas es peso sin que se
       note, porque la cuarta ya no se ve. */
    v.forEach((n, i) => {
      const desde = v.length - 1 - i;
      n.classList.toggle('is-arriba', desde === 0);
      n.style.setProperty('--fondo', String(Math.min(desde, 3)));
      n.hidden = desde > 3;
    });

    const tanda = mazo.querySelector('[data-tanda]');
    if (tanda) tanda.textContent = top ? top.dataset.tandaTexto : '';

    mazo.querySelectorAll('.diana').forEach((b) => { b.disabled = !top; });
    botonDeshacer.hidden = !estado.historial.length;
    seguir.disabled = v.length > 0;
    seguirTexto.textContent = texto(RUTA.seguir);
    marcarPaso('mazo');
  }

  /* La carta se va volando y, cuando termina, deja de contar.

     LA GUARDA MIRA TAMBIEN EL VUELO, no solo si ya esta fuera. Entre que
     se manda una carta y que termina de salir pasan cuatro decimas, y en
     ese rato sigue siendo la de arriba: dos toques seguidos la mandaban
     dos veces y contaban dos respuestas de una sola carta. */
  function mandar(naipe, lado) {
    if (!naipe) return;
    if (naipe.classList.contains('is-fuera')) return;
    if (naipe.classList.contains('is-yendo-si') || naipe.classList.contains('is-yendo-no')) return;
    naipe.classList.add(lado === 'si' ? 'is-yendo-si' : 'is-yendo-no');
    naipe.style.transform = '';
    const id = naipe.dataset.naipe;
    (lado === 'si' ? estado.urgentes : estado.descartadas).push(id);
    estado.historial.push({ id, lado });
    guardarSesion();

    const cerrar = () => {
      naipe.classList.add('is-fuera');
      naipe.classList.remove('is-yendo-si', 'is-yendo-no');
      pintarMazo();
    };
    if (quieto) cerrar();
    else setTimeout(cerrar, VUELO);
  }

  function devolver() {
    const ultimo = estado.historial.pop();
    if (!ultimo) return;
    const lista = ultimo.lado === 'si' ? estado.urgentes : estado.descartadas;
    const i = lista.lastIndexOf(ultimo.id);
    if (i > -1) lista.splice(i, 1);
    const naipe = caja.querySelector(`[data-naipe="${ultimo.id}"]`);
    if (naipe) naipe.classList.remove('is-fuera');
    guardarSesion();
    pintarMazo();
  }

  caja.querySelectorAll('.diana').forEach((b) => {
    b.addEventListener('click', () => mandar(arriba(estado.rama), b.dataset.lado));
  });
  botonDeshacer.addEventListener('click', devolver);

  /* ---------- Arrastrar ---------- */
  let agarre = null;
  caja.addEventListener('pointerdown', (e) => {
    const naipe = e.target.closest('.naipe.is-arriba');
    if (!naipe || estado.juego !== 'mazo') return;
    agarre = { naipe, x0: e.clientX, y0: e.clientY, id: e.pointerId };
    naipe.setPointerCapture(e.pointerId);
    naipe.classList.add('is-agarrado');
  });
  caja.addEventListener('pointermove', (e) => {
    if (!agarre || e.pointerId !== agarre.id) return;
    const dx = e.clientX - agarre.x0;
    const dy = e.clientY - agarre.y0;
    agarre.dx = dx;
    agarre.naipe.style.transform = `translate(${dx}px, ${dy * 0.25}px) rotate(${dx * 0.05}deg)`;
    const mazo = mazoDe(estado.rama);
    mazo.querySelector('.diana--si').classList.toggle('is-cerca', dx > UMBRAL);
    mazo.querySelector('.diana--no').classList.toggle('is-cerca', dx < -UMBRAL);
  });
  const soltar = (e) => {
    if (!agarre || (e && e.pointerId !== agarre.id)) return;
    const { naipe, dx = 0 } = agarre;
    agarre = null;
    naipe.classList.remove('is-agarrado');
    const mazo = mazoDe(estado.rama);
    mazo.querySelectorAll('.diana').forEach((b) => b.classList.remove('is-cerca'));
    if (Math.abs(dx) > UMBRAL) mandar(naipe, dx > 0 ? 'si' : 'no');
    else naipe.style.transform = '';
  };
  caja.addEventListener('pointerup', soltar);
  caja.addEventListener('pointercancel', soltar);

  /* ============================================================
     JUEGO 2 — LA LISTA
     ============================================================ */
  const sinColocar = caja.querySelector('[data-sin]');
  let agarrada = null;   /* la ficha levantada, esperando nivel */

  function ficha(carta) {
    const li = d.createElement('li');
    const b = d.createElement('button');
    b.type = 'button';
    b.className = 'ficha';
    b.dataset.ficha = carta.id;
    b.textContent = di(carta.deseo, lang);
    b.setAttribute('aria-pressed', 'false');
    li.appendChild(b);
    return li;
  }

  function montarLista() {
    const cartas = paraLaLista(estado.rama, estado.urgentes);
    sinColocar.innerHTML = '';
    caja.querySelectorAll('[data-caja]').forEach((c) => { c.innerHTML = ''; });
    cartas.forEach((c) => {
      const nivel = estado.niveles[c.id];
      const destino = nivel ? caja.querySelector(`[data-caja="${nivel}"]`) : sinColocar;
      destino.appendChild(ficha(c));
    });
    pintarLista();
  }

  function pintarLista() {
    caja.querySelectorAll('.mazo').forEach((m) => { m.hidden = true; });
    secLista.hidden = false;
    const faltan = sinColocar.children.length;
    const aviso = caja.querySelector('[data-faltan]');
    if (aviso) aviso.textContent = faltan ? rellenar(texto(RUTA.listaFaltan), { n: faltan }) : '';
    seguir.disabled = faltan > 0;
    seguirTexto.textContent = texto(RUTA.verResultado);
    botonDeshacer.hidden = true;
    marcarPaso('lista');
  }

  function levantar(b) {
    if (agarrada === b) { soltarFicha(); return; }
    soltarFicha();
    agarrada = b;
    b.setAttribute('aria-pressed', 'true');
    secLista.classList.add('is-poniendo');
  }
  function soltarFicha() {
    if (agarrada) agarrada.setAttribute('aria-pressed', 'false');
    agarrada = null;
    secLista.classList.remove('is-poniendo');
  }

  caja.addEventListener('click', (e) => {
    const f = e.target.closest('[data-ficha]');
    if (f) { levantar(f); return; }
    const nivel = e.target.closest('[data-poner]');
    if (!nivel || !agarrada) return;
    const id = agarrada.dataset.ficha;
    const destino = caja.querySelector(`[data-caja="${nivel.dataset.poner}"]`);
    destino.appendChild(agarrada.parentElement);
    agarrada.classList.add('is-puesta');
    setTimeout(() => agarrada && agarrada.classList.remove('is-puesta'), 300);
    estado.niveles[id] = nivel.dataset.poner;
    soltarFicha();
    guardarSesion();
    pintarLista();
  });

  /* ---------- El hilo de los dos juegos ---------- */
  function marcarPaso(cual) {
    caja.querySelectorAll('[data-paso-n]').forEach((li) => {
      li.classList.toggle('is-aqui', li.dataset.pasoN === cual);
      li.classList.toggle('is-hecho',
        cual === 'lista' && li.dataset.pasoN === 'mazo');
    });
  }

  seguir.addEventListener('click', () => {
    if (seguir.disabled) return;
    if (estado.juego === 'mazo') {
      estado.juego = 'lista';
      guardarSesion();
      montarLista();
      pantallas.juego.scrollIntoView({ block: 'start', behavior: quieto ? 'auto' : 'smooth' });
    } else {
      terminar();
    }
  });

  caja.querySelector('[data-atras]').addEventListener('click', () => {
    if (estado.juego === 'lista') {
      estado.juego = 'mazo';
      guardarSesion();
      pintarMazo();
    } else {
      verPantalla('inicio');
    }
  });

  /* ---------- La bifurcacion ---------- */
  caja.querySelectorAll('[data-rama-elegir]').forEach((b) => {
    b.addEventListener('click', () => {
      reiniciar();
      estado.rama = b.dataset.ramaElegir;
      guardarSesion();
      verPantalla('juego');
      pintarMazo();
    });
  });

  function reiniciar() {
    estado.juego = 'mazo';
    estado.urgentes = [];
    estado.descartadas = [];
    estado.historial = [];
    estado.niveles = {};
    caja.querySelectorAll('.naipe').forEach((n) => {
      n.classList.remove('is-fuera', 'is-yendo-si', 'is-yendo-no');
      n.style.transform = '';
    });
  }

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

  caja.querySelector('[data-otra-vez]').addEventListener('click', () => {
    estado.rama = null;
    reiniciar();
    guardarSesion();
    verPantalla('inicio');
  });

  /* ============================================================
     EL RESULTADO
     ============================================================ */
  function terminar() {
    const dx = diagnosticar(estado.rama, estado.urgentes, estado.niveles);
    if (!dx) return;

    const p = PASO[dx.paso];
    /* El nombre y el lema van detras de dos puntos, en mitad de otra
       frase: la mayuscula ahi se lee como si empezara una frase nueva. */
    const min = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
    const nombrePaso = min(di(p.nombre, lang));
    const lema = min(di(p.lema[dx.voz], lang));
    const wa = CONTACT.find((c) => c.id === 'whatsapp' && c.href);
    const pon = (sel, txt) => { const el = caja.querySelector(sel); if (el) el.textContent = txt; };

    /* Todo lo que depende del resultado se borra antes de escribirlo: esta
       pantalla se rellena varias veces y lo que solo se pone en una rama
       se quedaba puesto en la siguiente. */
    pon('[data-fin-wa-texto]', texto(RUTA.escribir));
    const cerradaCaja = caja.querySelector('[data-fin-cerrada]');
    cerradaCaja.hidden = true;
    cerradaCaja.textContent = '';

    pon('[data-fin-paso]', rellenar(texto(RUTA.estasEn), { paso: nombrePaso, lema }));

    const equilibrio = dx.lectura === 'equilibrio';
    const cajaServicio = caja.querySelector('[data-fin-servicio-caja]');
    const cajaNo = caja.querySelector('.fin__no');

    if (equilibrio) {
      pon('[data-fin-titulo]', texto(RUTA.equilibrioTitulo));
      pon('[data-fin-cuerpo]', `${texto(RUTA.equilibrioCuerpo)} ${texto(RUTA.equilibrioSeisMeses)}`);
      cajaServicio.hidden = true;
      cajaNo.hidden = true;
    } else {
      cajaServicio.hidden = false;
      cajaNo.hidden = false;
      const met = dx.lectura === 'met';
      pon('[data-fin-titulo]', texto(met ? RUTA.metTitulo : RUTA.emetTitulo));
      pon('[data-fin-cuerpo]', met
        ? `${texto(RUTA.metCuerpo)} ${texto(FALTA)}`
        : texto(RUTA.emetCuerpo));

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
      if (!s.marca.abierta) {
        cerradaCaja.hidden = false;
        cerradaCaja.textContent = rellenar(texto(RUTA.noAbierta), { marca: s.marca.nombre });
      }
      pon('[data-fin-no]', texto(TODAVIA_NO[dx.paso]));
    }

    /* La matriz: lo urgente contra lo que importa. */
    Object.entries(dx.matriz).forEach(([k, cartas]) => {
      const ul = caja.querySelector(`[data-cuadro-cartas="${k}"]`);
      if (!ul) return;
      ul.innerHTML = '';
      if (!cartas.length) {
        const li = d.createElement('li');
        li.className = 'cuadro__vacio';
        li.textContent = texto(RUTA.matrizVacio);
        ul.appendChild(li);
      } else {
        cartas.forEach((c) => {
          const li = d.createElement('li');
          li.textContent = di(c.deseo, lang).replace(/\.$/, '');
          ul.appendChild(li);
        });
      }
      const cuadro = caja.querySelector(`[data-cuadro="${k}"]`);
      if (cuadro) cuadro.classList.toggle('is-vacio', !cartas.length);
    });

    /* Las cartas como prueba, citadas tal cual. */
    const lista = caja.querySelector('[data-fin-pruebas]');
    lista.innerHTML = '';
    dx.pruebas.forEach((c) => {
      const li = d.createElement('li');
      li.textContent = rellenar(texto(RUTA.prueba), {
        deseo: di(c.deseo, lang).replace(/\.$/, ''),
        depende: di(c.dependeDe, lang).replace(/^(De |Dal |On |D’|Sur )/, '')
      });
      lista.appendChild(li);
    });

    /* Y la prueba que sale de su propia lista, si la hay. */
    const ordenCaja = caja.querySelector('[data-fin-orden-caja]');
    const orden = caja.querySelector('[data-fin-orden]');
    orden.innerHTML = '';
    dx.inversiones.slice(0, 1).forEach((inv) => {
      const li = d.createElement('li');
      li.textContent = rellenar(texto(RUTA.ordenPrueba), {
        arriba: di(inv.arriba.deseo, lang).replace(/\.$/, ''),
        abajo: di(inv.abajo.deseo, lang).replace(/\.$/, '')
      });
      orden.appendChild(li);
    });
    ordenCaja.hidden = !dx.inversiones.length;

    /* WhatsApp con el mensaje ya escrito. */
    const enlace = caja.querySelector('[data-fin-wa]');
    if (wa) {
      let cuerpo;
      if (equilibrio) {
        cuerpo = texto(RUTA.mensajeEquilibrio);
      } else if (!dx.servicio.marca.abierta) {
        cuerpo = rellenar(texto(RUTA.mensajeEspera), { paso: nombrePaso, marca: dx.servicio.marca.nombre });
        pon('[data-fin-wa-texto]', texto(RUTA.listaEspera));
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
    if (estado.guardar) {
      mandar2({ rama: estado.rama, idioma: lang, urgentes: estado.urgentes, niveles: estado.niveles });
    }
  }

  /* ============================================================
     GUARDAR EL RECORRIDO — anonimo, y sin perderlo si no hay a donde
     ============================================================ */
  const cola = () => {
    try { return JSON.parse(localStorage.getItem(COLA) || '[]'); } catch (e) { return []; }
  };
  const encolar = (fila) => {
    try {
      const c = cola();
      c.push(fila);
      localStorage.setItem(COLA, JSON.stringify(c.slice(-50)));
    } catch (e) {}
  };

  async function mandar2(fila) {
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
    } catch (e) { encolar(completa); }
  }

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
      localStorage.removeItem(COLA);
    } catch (e) {}
  }

  /* ---------- Arranque ---------- */
  leerSesion();
  if (estado.rama) {
    /* Se vuelve a poner el mazo como estaba: las que ya se mandaron, fuera. */
    [...estado.urgentes, ...estado.descartadas].forEach((id) => {
      const n = caja.querySelector(`[data-naipe="${id}"]`);
      if (n) n.classList.add('is-fuera');
    });
    verPantalla('juego');
    if (estado.juego === 'lista') montarLista();
    else pintarMazo();
  }
  reintentar();
}
