/* LO QUE CORRE DENTRO DEL MARCO DE LA VISTA. Espera el libro del panel, arma los elementos uno por
   uno (nunca HTML escrito), carga las fuentes y pagina. Solo acepta mensajes de la pagina que lo
   contiene, y vuelve a mirar las listas de hoja.js: aqui no se confia en lo que llega. */
import { ATRIBUTOS_HOJA, ESTILOS_HOJA, ETIQUETAS_HOJA } from '../../contenido/taller/hoja.js';
import { urlGoogle } from '../../contenido/taller/fuentes.js';
import { enlaceSeguro } from '../../contenido/comun.js';
import { paginar } from './Paginador.js';

const ESPERA_FUENTE_MS = 4000;
const MARGEN_VISTA_PX = 28;
const avisar = (m) => window.parent.postMessage(m, window.location.origin);

function valorSeguro(tag, k, v) {
  if (typeof v !== 'string') return false;
  if (k === 'src') return tag === 'img' && /^data:image\/(webp|png|jpeg);base64,/.test(v);
  if (k === 'href') return v.startsWith('#') ? /^#[a-z0-9-]+$/.test(v) : enlaceSeguro(v);
  if (k === 'id') return /^[a-z0-9-]+$/.test(v);
  if (k === 'start') return /^\d{1,5}$/.test(v);
  return true;
}

function armar(n) {
  if (typeof n.texto === 'string') return document.createTextNode(n.texto);
  if (!ETIQUETAS_HOJA.has(n.tag)) return null;
  const e = document.createElement(n.tag);
  if (n.clase) e.className = String(n.clase);
  for (const [k, v] of Object.entries(n.attrs || {})) if (ATRIBUTOS_HOJA.has(k) && valorSeguro(n.tag, k, v)) e.setAttribute(k, v);
  for (const [k, v] of Object.entries(n.estilo || {})) if (ESTILOS_HOJA.has(k) && typeof v === 'string') e.style.setProperty(k, v);
  for (const h of n.hijos || []) { const c = armar(h); if (c) e.append(c); }
  return e;
}

/* Cada familia en su hoja, y se espera a que esten: si no, las paginas se cuentan con otra letra */
async function fuentes(nombres) {
  await Promise.all(nombres.map((nombre) => new Promise((ok) => {
    const url = urlGoogle(nombre);
    if (!url) { ok(); return; }
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = url; l.dataset.pagedjsIgnore = '1';
    l.onload = ok; l.onerror = ok;
    document.head.append(l);
  })));
  const pesos = ['400', '700'];
  await Promise.race([
    Promise.allSettled(nombres.flatMap((n) => pesos.map((p) => document.fonts.load(`${p} 16px "${n}"`)))),
    new Promise((ok) => setTimeout(ok, ESPERA_FUENTE_MS))
  ]);
}

/* La pagina se ve entera en el ancho del marco. Solo en pantalla: al imprimir no se escala nada. */
function ajustar() {
  const pagina = document.querySelector('.pagedjs_page');
  if (!pagina) return;
  const ancho = pagina.offsetWidth + MARGEN_VISTA_PX;
  document.documentElement.style.setProperty('--zoom', String(Math.min(1, window.innerWidth / ancho)));
}
window.addEventListener('resize', ajustar);

window.addEventListener('message', async (e) => {
  if (e.source !== window.parent || e.origin !== window.location.origin) return;
  const m = e.data || {};
  if (m.tipo !== 'pintar') return;
  try {
    /* El PDF toma de aqui su titulo y su idioma: los lectores de pantalla los anuncian */
    if (typeof m.titulo === 'string' && m.titulo) document.title = m.titulo;
    if (/^[a-z]{2}$/.test(m.idioma)) document.documentElement.lang = m.idioma;
    await fuentes(Array.isArray(m.fuentes) ? m.fuentes : []);
    const t = document.createElement('template');
    (m.nodos || []).forEach((n) => { const c = armar(n); if (c) t.content.append(c); });
    const paginas = await paginar(String(m.css), t.content, document.querySelector('#destino'));
    ajustar();
    avisar({ tipo: 'pintada', id: m.id, paginas });
  } catch (err) {
    avisar({ tipo: 'fallo', id: m.id });
  }
});
avisar({ tipo: 'lista' });
