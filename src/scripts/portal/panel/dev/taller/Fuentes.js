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
