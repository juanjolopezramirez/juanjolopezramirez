/* Lo que el panel revisa de un archivo ANTES de subirlo (Developer-Mode). Lo usan los dos
   backends (real.js y demo.js) y los editores:

     revisarArchivo(ruta, archivo)  { donde } o { error }: la ruta es del almacen, el
                                    archivo no pasa su tope y ES lo que dice ser (sus
                                    primeros bytes, no su nombre)
     medidasDe(archivo, ext)        { w, h } o null, leyendo solo su cabecera

   El almacen lo vuelve a mirar (tipos permitidos y tamaño de cada cajon, 004 y 007):
   esto es para decirlo antes y claro, no la unica cerradura. */
import { ubicacion, esDelFormato, medidasDeImagen } from '../contenido/Almacen.js';

export const TOPES = { pdf: 50 * 1024 * 1024, png: 5 * 1024 * 1024, jpg: 5 * 1024 * 1024, webp: 5 * 1024 * 1024 };
const extDe = (ruta) => ruta.slice(ruta.lastIndexOf('.') + 1);

async function primeros(archivo, n) {
  try { return new Uint8Array(await archivo.slice(0, n).arrayBuffer()); } catch (e) { return new Uint8Array(0); }
}

export async function revisarArchivo(ruta, archivo) {
  const donde = ubicacion(ruta);
  if (!donde) return { error: 'archivoRuta' };
  if (!archivo || typeof archivo.size !== 'number' || typeof archivo.slice !== 'function') return { error: 'archivoFalta' };
  const ext = extDe(ruta);
  if (archivo.size > TOPES[ext]) return { error: 'archivoGrande' };
  if (!esDelFormato(await primeros(archivo, 32), ext)) return { error: 'archivoTipo' };
  return { donde };
}

/* La cabecera basta para PNG y WebP; un JPEG puede llevar las medidas mas adentro. */
export async function medidasDe(archivo, ext) {
  return medidasDeImagen(await primeros(archivo, ext === 'jpg' ? 512 * 1024 : 64), ext);
}
