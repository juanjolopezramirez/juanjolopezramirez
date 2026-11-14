/* Pone en la pagina la hoja de una fuente de Google. Devuelve si existe: si Google no la conoce,
   el navegador avisa y el Taller dice «no encontré esa fuente». */
import { urlGoogle } from '../../../../contenido/taller/fuentes.js';

const puestas = new Map();

export function cargarFuente(nombre) {
  const url = urlGoogle(nombre);
  if (!url) return Promise.resolve(false);
  if (puestas.has(nombre)) return puestas.get(nombre);
  const promesa = new Promise((ok) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = url;
    l.onload = () => ok(true);
    l.onerror = () => { l.remove(); puestas.delete(nombre); ok(false); };
    document.head.append(l);
  });
  puestas.set(nombre, promesa);
  return promesa;
}

const ESPERA_LETRAS_MS = 8000;
const PESOS = ['400', '700'];
/* Espera a que de verdad lleguen las letras del libro: la hoja de cada fuente y los pesos que usa el texto y los titulos,
   con una letra latina y una hebrea (Google sirve el hebreo en otro trozo). Devuelve false si algo no llego a tiempo:
   quien llama lo dice, en vez de medir el libro con la letra de reserva sin avisar. */
export async function esperarLetras(nombres, cuerpo) {
  const lista = [...new Set([...(Array.isArray(nombres) ? nombres : []), cuerpo].filter(Boolean))];
  let bien = true;
  const trabajo = Promise.all(lista.map(async (n) => {
    if (!(await cargarFuente(n))) { bien = false; return; }
    const r = await Promise.allSettled(PESOS.map((p) => document.fonts.load(`${p} 16px "${n}"`, 'Aא')));
    if (r.some((x) => x.status === 'rejected')) bien = false;
  }));
  let vencio = false, reloj = 0;
  try {
    await Promise.race([trabajo, new Promise((ok) => { reloj = setTimeout(() => { vencio = true; ok(); }, ESPERA_LETRAS_MS); })]);
  } finally { clearTimeout(reloj); }
  return bien && !vencio;
}
