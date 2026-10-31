/* El unico archivo que conoce a Paged.js (su ultima version es de 2024). Si hubiera que cambiarlo,
   solo se toca esto: recibe el estilo y el contenido y devuelve cuantas paginas salieron.

   La hoja se le pasa como texto: si la leyera de la pagina intentaria bajar las de Google, y la
   politica del sitio no lo deja. */
import { Previewer } from 'pagedjs';

export async function paginar(css, contenido, destino) {
  const flujo = await new Previewer().preview(contenido, [{ 'hoja.css': css }], destino);
  return flujo.total;
}
