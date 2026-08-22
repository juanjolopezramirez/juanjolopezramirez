/* Con quienes he caminado. El orden de este array es el orden en que
   pasan por la cinta.

   `name` es lo que oye quien no ve el logo, asi que va el nombre de la
   casa y no el del fichero. `w` y `h` son los del original: los pide el
   navegador para reservar el hueco antes de descargarlo, y sin ellos la
   fila da un salto al cargar.

   `scale` es la escala optica — el porque esta explicado en projects.js,
   que usa la misma cinta y la misma regla.

   Los logos vienen en blanco sobre transparente, que es lo normal en una
   marca: por eso la cinta va sobre Night y no sobre hueso — en hueso no
   se verian. Al anadir uno nuevo, comprueba que sea claro; si viene en
   oscuro, no sirve para este fondo. */
export const PARTNERS = [
  { id: 'casa-san-pedro', name: 'Casa San Pedro', src: '/assets/partners/casa-san-pedro.svg', w: 287,  h: 220, scale: 1.10 },
  { id: 'bodega',         name: 'Bodega',         src: '/assets/partners/bodega.png',         w: 480,  h: 193, webp: '/assets/partners/bodega.webp', scale: 0.88 },
  { id: 'capitalxmio',    name: 'Capital Mío',    src: '/assets/partners/capitalxmio.svg',    w: 1278, h: 188, scale: 0.62 },
  { id: 'su-essencia',    name: 'Su Essencia',    src: '/assets/partners/su-essencia.svg',    w: 1565, h: 306, scale: 0.68 }
];
