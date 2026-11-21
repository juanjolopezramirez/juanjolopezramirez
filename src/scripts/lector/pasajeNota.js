/* EL TEXTO DE UNA CITA, listo para pintar (puro: la red pasa por biblia/cargar.js, que recibe su `fetch`). Lo usan la hoja del
   lector y la pagina /nota/. La version es la del idioma del libro: Reina-Valera 1909 (es) o World English Bible (en).
   La limpieza para leer (corchetes del traductor, versalitas, rotulos del Salmo 119) es de biblia/mostrar.js: aqui no hay
   otra. Devuelve datos; quien pinta usa textContent. */
import { cargarPasaje, cobertura, limitarVersos } from '../biblia/cargar.js';
import { textoParaLeer } from '../biblia/mostrar.js';
import { deCanonica } from '../biblia/referencias.js';
import { NOMBRE_VERSION, versionDeIdioma } from './notaTexto.js';

/* → { estado, version, nombre, versos: [{ cap, v, t, omitido }], recortado, parcial, varios }
     estado 'ok'          hay texto (`parcial`: solo una parte del pasaje existe en esta version)
            'numeracion'  esta version cuenta ese pasaje de otra manera: no hay texto que mostrar, no es un fallo
            'error'       no llego (sin red, archivo roto) o la cita no existe
   `omitido`: un versiculo que esta version deja fuera (WEB: Lc 17:36, Hch 8:37...). `recortado`: se muestran los primeros. */
export async function pasajeDeNota(nota, idioma, { base = '/', fetch } = {}) {
  const version = versionDeIdioma(idioma);
  const salida = { estado: 'error', version, nombre: NOMBRE_VERSION[version], versos: [], recortado: false, parcial: false, varios: false };
  const ref = nota && nota.k === 'c' ? deCanonica(nota.r) : null;
  if (!ref) return salida;
  const c = cobertura(ref, version);
  if (c === 'numeracion') return { ...salida, estado: 'numeracion' };
  if (c === 'invalida') return salida;
  const versos = await cargarPasaje(ref, version, fetch ? { base, fetch } : { base });
  if (!versos) return salida;
  const corto = limitarVersos(versos);
  const lista = corto.versos.map(({ cap, v, t }) => {
    const limpio = textoParaLeer(t, { version, libro: ref.libro, cap, v });
    return { cap, v, t: limpio, omitido: !limpio };
  });
  return { ...salida, estado: 'ok', versos: lista, recortado: corto.recortado, parcial: c === 'parcial', varios: ref.cap2 != null };
}
