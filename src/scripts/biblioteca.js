/* Las piezas pequeñas de la biblioteca, sin DOM ni `window` para poder
   probarlas en Node. site.js las usa en initBiblioteca().

   Regla de las tres funciones: lo que llega de fuera —la ancla de la
   direccion, lo que hay guardado en el aparato— nunca se usa tal cual; se
   busca en un Set de ids que ya existen. Un Set y no un objeto: en un
   objeto, «constructor» o «toString» parecen ids validos. */

/* Donde se guarda el ultimo libro leido: solo su id, en texto, sin JSON. */
export const CLAVE = 'jlr:libro';

/* «#ahava» → «ahava», o null si no es el id de un libro de la biblioteca.
   Una ancla mal codificada (`%E0`) hace que decodeURIComponent lance: aqui
   es solo «no es ninguno». */
export function idDeHash(hash, validos) {
  if (typeof hash !== 'string' || hash.length < 2 || hash.charAt(0) !== '#') return null;
  let id;
  try { id = decodeURIComponent(hash.slice(1)); } catch (err) { return null; }
  id = id.toLowerCase();
  return validos.has(id) ? id : null;
}

/* El ultimo libro leido, si sigue siendo un libro. `almacen` es localStorage,
   que puede faltar, estar lleno o estar bloqueado: cualquier fallo es «no hay». */
export function leerUltimo(almacen, validos) {
  try {
    const id = almacen.getItem(CLAVE);
    return typeof id === 'string' && validos.has(id) ? id : null;
  } catch (err) {
    return null;
  }
}

/* Lo guarda. Devuelve si pudo; si no puede, no pasa nada. */
export function guardarUltimo(almacen, id, validos) {
  if (!validos.has(id)) return false;
  try {
    almacen.setItem(CLAVE, id);
    return true;
  } catch (err) {
    return false;
  }
}
