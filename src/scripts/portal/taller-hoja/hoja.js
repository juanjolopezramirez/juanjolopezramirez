/* LO QUE CORRE DENTRO DEL MARCO DE IMPRESION. Espera el libro del panel, arma los elementos uno por
   uno (nunca HTML escrito) y carga las fuentes. Solo acepta mensajes de la pagina que lo
   contiene, y vuelve a mirar las listas de hoja.js: aqui no se confia en lo que llega. */
import { armar } from '../../contenido/taller/armar.js';
import { urlGoogle } from '../../contenido/taller/fuentes.js';
import { OPCIONES_KATEX } from '../../contenido/taller/tipos/formula.js';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const ESPERA_FUENTE_MS = 8000;
const avisar = (m) => window.parent.postMessage(m, window.location.origin);
/* Armar los elementos y revisar cada valor vive en contenido/taller/armar.js: la mesa usa la misma puerta */

/* Cada familia en su hoja, y se espera a que esten: si no, las paginas se cuentan con otra letra. Devuelve si llegaron todas
   (si no, se avisa al panel: se imprime igual, pero no en silencio). */
async function fuentes(nombres) {
  let bien = true;
  await Promise.all(nombres.map((nombre) => new Promise((ok) => {
    const url = urlGoogle(nombre);
    if (!url) { ok(); return; }
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = url; l.dataset.pagedjsIgnore = '1';
    l.onload = ok; l.onerror = () => { bien = false; ok(); };
    document.head.append(l);
  })));
  const pesos = ['400', '700'];
  /* Con una letra latina y una hebrea: Google sirve el hebreo en otro trozo, y sin pedirlo no llega a tiempo */
  let vencio = false;
  await Promise.race([
    Promise.allSettled(nombres.flatMap((n) => pesos.map((p) => document.fonts.load(`${p} 16px "${n}"`, 'Aא')))).then((r) => { if (r.some((x) => x.status === 'rejected')) bien = false; }),
    new Promise((ok) => setTimeout(() => { vencio = true; ok(); }, ESPERA_FUENTE_MS))
  ]);
  return bien && !vencio;
}

window.addEventListener('message', async (e) => {
  if (e.source !== window.parent || e.origin !== window.location.origin) return;
  const m = e.data || {};
  if (m.tipo !== 'pintar') return;
  try {
    /* El PDF toma de aqui su titulo y su idioma: los lectores de pantalla los anuncian */
    if (typeof m.titulo === 'string' && m.titulo) document.title = m.titulo;
    if (/^[a-z]{2}$/.test(m.idioma)) document.documentElement.lang = m.idioma;
    const letras = await fuentes(Array.isArray(m.fuentes) ? m.fuentes : []);
    /* El CSS del libro nunca trae nada de fuera: si lo trae, no es el nuestro */
    const css = String(m.css);
    if (/@import|url\s*\(/i.test(css)) throw new Error('css');
    const estilo = document.createElement('style');
    estilo.textContent = css;
    document.head.append(estilo);
    const destino = document.querySelector('#destino');
    destino.replaceChildren(...(m.nodos || []).map((n) => armar(n)).filter(Boolean));
    destino.querySelectorAll('[data-tex]').forEach((f) => { const tex = f.getAttribute('data-tex'); f.textContent = ''; f.dir = 'ltr'; try { katex.render(tex, f, OPCIONES_KATEX); } catch (e) { f.textContent = tex; } });
    await document.fonts.ready;
    await Promise.all([...destino.querySelectorAll('img')].map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
    avisar({ tipo: 'pintada', id: m.id, letras });
  } catch (err) {
    avisar({ tipo: 'fallo', id: m.id });
  }
});
avisar({ tipo: 'lista' });
