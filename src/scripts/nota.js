/* /nota/#n=…: la pagina a la que lleva una NOTA de un PDF (una definicion o una cita) cuando se abre en un visor de PDF
   cualquiera. Muestra lo mismo que la hoja del lector (lector/hojaNota.js), con las mismas piezas. La nota viaja tras el
   «#» (no llega a ningun servidor) y se lee como dato ajeno: notaDeEnlace la limpia, y todo se pinta con textContent.

   Cualquiera puede escribir una direccion /nota/ con lo que quiera dentro. Por eso aqui, y no en el lector:
     - una linea fija dice que la nota viene del enlace que se abrio (no es una pagina del sitio que lo afirme);
     - la direccion de la fuente lleva su dominio escrito aparte, para ver a donde lleva antes de tocarla;
     - si la nota no dice de que libro es (sin `l`), la direccion de la fuente queda como texto, sin enlace. */
import { notaDeEnlace } from './lector/notaEnPdf.js';
import { idiomaDeNota, rotuloDeCita } from './lector/notaTexto.js';
import { ponerFuente, pintarReferencia, lineaRecomendada, llenarCita } from './lector/hojaNota.js';
import { UI } from '../i18n/ui.js';

const caja = document.querySelector('[data-nota]');
const hoja = caja && caja.querySelector('[data-hoja]');
const vacio = caja && caja.querySelector('[data-vacio]');
const origen = caja && caja.querySelector('[data-origen]');
let vuelta = 0;            // otra nota (cambio el «#») deja sin efecto lo que aun estaba cargando

function nodo(tag, clase, texto) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto != null) n.textContent = texto;
  return n;
}

function pintar() {
  if (!caja || !hoja) return;
  const mia = ++vuelta;
  hoja.replaceChildren();
  hoja.hidden = true;
  vacio.hidden = true;
  origen.hidden = true;
  const base = import.meta.env.BASE_URL;
  const ruta = location.pathname.endsWith('/') ? location.pathname : location.pathname + '/';
  const nota = notaDeEnlace(location.origin + ruta + location.hash, { origenes: [location.origin + base] });
  if (!nota) { vacio.hidden = false; document.title = 'Nota · Note'; return; }
  const preferido = (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es';
  const idioma = idiomaDeNota(nota, preferido);
  const tl = (k) => UI[idioma]['lector.' + k] || UI.es['lector.' + k] || k;
  document.documentElement.lang = idioma;
  origen.textContent = tl('notaOrigen');
  origen.hidden = false;

  if (nota.k === 'd') {
    const t = nodo('h1', 'lector__nota-t', nota.t);
    ponerFuente(t, nota.ft);
    hoja.appendChild(t);
    if (nota.d) {
      const d = nodo('p', 'lector__nota-texto', nota.d);
      ponerFuente(d, nota.fd);
      hoja.appendChild(d);
    }
    if (nota.r || nota.rf) {
      const pie = nodo('p', 'lector__nota-pie');
      pie.appendChild(nodo('b', '', tl('fuente') + ': '));
      pintarReferencia(pie, nota, idioma, { anfitrion: true, conEnlace: !!nota.l });
      hoja.appendChild(pie);
    }
    document.title = nota.t;
    hoja.hidden = false;
    return;
  }

  const nombre = rotuloDeCita(nota, idioma);
  const versos = nodo('div', 'lector__nota-caja');
  const estado = nodo('p', 'lector__nota-estado');
  estado.setAttribute('role', 'status');
  const pie = nodo('p', 'lector__nota-pie');
  const extra = nodo('div', 'lector__nota-extra');
  const rec = lineaRecomendada(nota, idioma, tl);
  const titulo = nodo('h1', 'lector__nota-t', nombre);
  titulo.tabIndex = -1;
  hoja.append(titulo, versos, estado, pie, ...(rec ? [rec] : []), extra);
  document.title = nombre;
  hoja.hidden = false;
  llenarCita({ nota, idioma, tl, base, caja: versos, estado, pie, extra, vigente: () => mia === vuelta, foco: titulo });
}

pintar();
/* Otro enlace de nota abierto en la misma pestaña solo cambia el «#»: la pagina no se recarga, se vuelve a pintar */
addEventListener('hashchange', pintar);
