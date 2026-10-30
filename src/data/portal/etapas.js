/* Los pasos de cada formulario de Developer-Mode, en orden (components/portal/dev/Ruta.astro
   los pinta arriba; panel/dev/Asistente.js los recorre). El ultimo siempre es «Revisar»:
   ahi se ve que falta y se publica. Sus nombres, en textos.js → dev.etapas. */
export const ETAPAS = {
  libros: ['basico', 'pdf', 'lomo', 'idiomas', 'revisar'],
  camino: ['etapa', 'idiomas', 'revisar'],
  casas: ['basico', 'imagenes', 'hice', 'idiomas', 'pagina', 'revisar']
};
