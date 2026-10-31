/* LAS FUENTES DEL TALLER.

   Las de la marca y Estonia estan siempre; ademas, el fundador puede escribir el nombre de
   cualquier fuente de Google. Ese nombre termina dentro de una direccion y de una regla de
   estilo, asi que solo pasa si es lo que parece: letras y numeros separados por un espacio. */
export const FUENTES_MARCA = ['Young Serif', 'Bricolage Grotesque', 'Petemoss', 'Estonia'];
export const FUENTES_MAX = 40;

const NOMBRE = /^[A-Za-z0-9]+( [A-Za-z0-9]+){0,7}$/;
export const nombreDeFuente = (v) => typeof v === 'string' && v.length <= 60 && NOMBRE.test(v);

/* Una hoja por familia: si una sola no existe, Google rechaza la peticion entera y no cargaria ninguna */
export const urlGoogle = (nombre) => (nombreDeFuente(nombre)
  ? `https://fonts.googleapis.com/css2?family=${nombre.replace(/ /g, '+')}&display=swap` : '');

export const familiaCss = (nombre) => (nombreDeFuente(nombre) ? `"${nombre}", Georgia, serif` : 'Georgia, serif');

export function listaDeFuentes(lista) {
  const salida = [...FUENTES_MARCA];
  for (const n of Array.isArray(lista) ? lista : []) {
    if (nombreDeFuente(n) && !salida.includes(n) && salida.length < FUENTES_MAX) salida.push(n);
  }
  return salida;
}
