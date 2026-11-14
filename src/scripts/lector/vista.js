/* /vista/ · EL LIBRO PRIVADO DEL TALLER.

   1. Lee el secreto de la direccion (#k=<43 letras>) y LO QUITA de la barra en el acto (replaceState): la barra y el
      historial de ESTA pestaña dejan de llevarlo, y no se copia sin querer ni sale en una captura. No borra lo que ya se
      copio ni el sitio donde se pego el enlace: por eso se comparte por un canal privado. Vive solo en esta variable.
   2. Le pregunta a la funcion de borde `vista` (supabase/functions/vista). Nunca habla con la base ni con el cajon directo.
   3. Si contesta, le da el libro al lector de Recursos (site.js, evento `lector:abrir`): el mismo giro, enlaces,
      sonido y lupa. Las imagenes llegan por direcciones firmadas que valen 10 minutos: se piden nuevas cada 7.
   4. Si la funcion dice 404 —mal escrito, vencido, apagado, desconocido—, se dice una sola cosa: «Este enlace ya no abre».
      Si NO contesta (sin red, tiempo agotado, un fallo del servidor), se dice otra: «No se pudo abrir ahora», que no
      acusa al enlace.

   Lo que llega de la funcion es dato ajeno: se revisa antes de dar nada al lector (medidas, direcciones, enlaces). */
import { leerConfig } from '../portal/config.js';
import { leerToken } from '../contenido/taller/Enlaces.js';
import { hojasSeguras, PAGINAS_MAX } from '../contenido/taller/PaginasEdicion.js';
import { preguntar } from './preguntar.js';

const RENOVAR_MS = 7 * 60 * 1000;

const caja = document.querySelector('[data-vista]');
const q = (s) => caja && caja.querySelector(s);

/* El mensaje va DENTRO de la region «status» (el lector de pantalla lo anuncia). Una sola cosa para todo 404;
   `red` es otra cosa distinta: no se pudo preguntar, no es culpa del enlace. */
function noAbre(red = false) {
  if (!caja) return;
  const texto = (red ? caja.dataset.red : caja.dataset.malo) || '';
  const estado = q('[data-vista-estado]');
  q('[data-vista-titulo]').hidden = true;
  estado.hidden = false;
  estado.textContent = texto;
  q('[data-vista-abrir]').hidden = true;
  q('[data-vista-ayuda]').hidden = red;
  caja.setAttribute('data-malo-visto', '');
  document.title = texto || document.title;
}

/* → { ok, datos } | null (404: el enlace ya no abre) | { red: true } (no se pudo preguntar).
   En `npm run dev` sin variables, la demo contesta desde la memoria. */
async function pedir(cfg, token, renovar) {
  if (import.meta.env.DEV && cfg.modo === 'demo') {
    const { pedirDemo } = await import('./vistaDemo.js');
    return pedirDemo(token, renovar);
  }
  if (cfg.modo !== 'real' || !cfg.url) return { red: true };      // el sitio sin su conexion: no es culpa del enlace
  return preguntar({ url: cfg.url, clave: cfg.clave }, token, renovar);
}

/* Lo que llega se comprueba entero. Devuelve { titulo, n, ratio, blando, hojas, w900, w1600 } o null. */
function revisar(d, cfg) {
  if (!d || typeof d !== 'object') return null;
  const n = d.paginas;
  if (!Number.isInteger(n) || n < 1 || n > PAGINAS_MAX) return null;
  const ratio = Number(d.ratio);
  if (!(ratio > 0.2 && ratio < 5)) return null;
  const urls = d.urls || {};
  const demo = import.meta.env.DEV && cfg.modo === 'demo';
  const buena = (u) => typeof u === 'string'
    && (demo ? u.length < 8e6 && u.startsWith('data:image/') : u.length < 2000 && u.startsWith(`${cfg.url}/storage/v1/`));
  const lista = (a) => (Array.isArray(a) && a.length === n && a.every(buena) ? a : null);
  const w900 = lista(urls.w900), w1600 = lista(urls.w1600);
  if (!w900 || !w1600) return null;
  return { titulo: String(d.titulo || '').slice(0, 200), n, ratio, blando: d.blando === true, hojas: hojasSeguras(d.hojas, n), w900, w1600 };
}

function cuandoListo(fn) {
  if (document.documentElement.dataset.lector === 'listo') fn();
  else document.addEventListener('lector:listo', fn, { once: true });
}

async function iniciar() {
  if (!caja) return;
  /* El secreto sale de la barra ANTES de hacer nada mas, tenga o no sentido */
  const m = /^#k=([^&]*)$/.exec(location.hash);
  let token = m ? m[1] : '';
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* sin historial: sigue */ }
  if (!leerToken(token)) { noAbre(); return; }

  const cfg = leerConfig();
  const primera = await pedir(cfg, token, false);
  const libro = primera && primera.ok ? revisar(primera.datos, cfg) : null;
  if (!libro) { token = ''; noAbre(!!(primera && primera.red)); return; }

  /* Las direcciones de ahora: cambian cuando se renuevan */
  let w900 = libro.w900, w1600 = libro.w1600;
  let ultima = Date.now();
  const src = (i, w) => (w > 1000 ? w1600 : w900)[i] || '';
  async function renovar() {
    ultima = Date.now();
    const r = await pedir(cfg, token, true);
    const nuevo = r && r.ok ? revisar(r.datos, cfg) : null;
    if (nuevo && nuevo.n === libro.n) { w900 = nuevo.w900; w1600 = nuevo.w1600; }
  }
  setInterval(() => { if (!document.hidden) renovar(); }, RENOVAR_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - ultima > RENOVAR_MS - 60000) renovar(); });

  q('[data-vista-titulo]').textContent = libro.titulo;
  q('[data-vista-titulo]').hidden = false;
  document.title = libro.titulo;
  const estado = q('[data-vista-estado]');
  estado.textContent = '';
  estado.hidden = true;
  const boton = q('[data-vista-abrir]');
  const abrir = () => {
    boton.hidden = true;
    document.dispatchEvent(new CustomEvent('lector:abrir', {
      detail: {
        titulo: libro.titulo, paginas: libro.n, ratio: libro.ratio, blando: libro.blando,
        board: libro.blando ? null : ['#263B28', '#263B28'], textos: libro.hojas, src,
        alCerrar: () => { boton.hidden = false; boton.focus(); }
      }
    }));
  };
  boton.addEventListener('click', abrir);
  /* Si el lector no esta listo en unos segundos (site.js no cargo), el boton queda para intentarlo */
  const espera = setTimeout(() => { boton.hidden = false; }, 8000);
  cuandoListo(() => { clearTimeout(espera); abrir(); });
}

iniciar();
