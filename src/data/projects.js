/* Lo que estoy construyendo. Mismo formato que PARTNERS y misma cinta:
   solo cambian la lista y el rotulo que la encabeza.

   `scale` es la escala optica. No todos los logos pueden medir lo mismo de
   alto: uno muy apaisado a la misma altura que una letra suelta pesa el
   triple en la fila. El numero iguala el area que ocupa cada uno, pero
   amortiguada —(1.7 / proporcion) ^ 0.35, entre 0.62 y 1.30—, porque
   igualarla del todo dispara las letras altas y aplasta los logotipos
   largos. Con esto la diferencia entre el mas y el menos pesado baja de
   7.8 a 3.6 veces.

   Fraterni va en mapa de bits y no en vectorial como los demas. Su SVG
   lleva una imagen incrustada dentro —779KB para un logo que se ve a
   150px—, asi que se rasteriza una vez y pesa 4KB. El resto son curvas
   de verdad y entran tal cual. */
export const PROJECTS = [
  /* La marca propia tambien es un proyecto, asi que la firma entra con
     el resto. Tira del SVG que ya vive en /logos: es el mismo fichero que
     firma la portada de arranque, y duplicarlo seria pedir que se separen.
     Proporcion 2.28 -> escala 0.90 por la misma regla que los demas. */
  { id: 'juanjo',     name: 'Juanjo López Ramírez', src: '/assets/logos/signature.svg', w: 572, h: 251, scale: 0.90 },
  { id: 'fraterni',   name: 'Fraterni',       src: '/assets/projects/fraterni.png',   w: 600, h: 143, webp: '/assets/projects/fraterni.webp', scale: 0.73 },
  { id: 'u',          name: 'U',              src: '/assets/projects/u.svg',          w: 132, h: 307, scale: 1.30 },
  { id: 'cordillera', name: 'Cordillera UTD', src: '/assets/projects/cordillera.svg', w: 290, h: 308, scale: 1.23 },
  { id: 'let-be',     name: 'Let Be',         src: '/assets/projects/let-be.svg',     w: 519, h: 323, scale: 1.02 },
  { id: 'recvid',     name: 'Recvid',         src: '/assets/projects/recvid.svg',     w: 290, h: 298, scale: 1.22 }
];
