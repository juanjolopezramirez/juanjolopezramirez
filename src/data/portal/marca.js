/* BRAND ASSETS (Developer-Mode → «Brand Assets», panel/dev/Marca.js).

   El catalogo de los logos y iconos de SUS proyectos, ordenados por categoria, para bajarlos
   en SVG o PNG, en el color y el tamaño que se pida. Solo lo que el fundador pidio
   (2026-10-30): los logos de sus proyectos (The Alef Code, su marca, Let Be, Recvid, las casas
   de Fraterni, los ejes, principios y permanentes, Cordillera, su libro). NO entran las marcas
   de clientes («Otras marcas»: Bodega, Capitalxm…), ni los iconos de la web (redes, banderas,
   flechas), ni el de Instagram (`mini-logo.svg`).

   Cada pieza:
     id        nombre corto, sin espacios: sale en el nombre del archivo que se baja.
     nombre    como se ve en la lista (español: el panel va solo en español).
     ruta      donde vive (public/…), o `letra` ('logo' | 'mem' | 'tav') para las tres letras
               en pixeles de src/assets/alef/ (las lee Marca.js con `?raw`).
     colores   'uno'   un solo color: se puede cambiar por el que se pida;
               'fijo'  varios colores o mascaras: sale tal cual lo dibujo el fundador.
     base      el color de la pieza «tal cual» cuando su dibujo usa currentColor (las letras).
     vista     el fondo de la miniatura: 'noche' para lo claro, 'hueso' para lo oscuro.

   Hay una prueba (tools/test-portal.mjs) que mira que cada ruta exista y sea un SVG seguro,
   que no se repita ningun id, que cada pieza «uno» SI cambie de color y que no haya marcas de
   clientes. (Ficha de lo «fijo»: Marca.js le esconde los colores.)

   Let Be (2026-10-30): el logo es el NUEVO (la palabra, projects/let-be.svg, y su ícono, avatars/let-be.svg: los de la
   reestructuracion a «Let Be Develop»). El «Let Be a color» viejo (webIcons/letbeLogo(Color)) se quito.
   El eje «El Lazo» (Bond) volvio con su archivo correcto (`fraterni Icon/Axis/bondIcon.svg`); el primero que llego (bondCard.svg) no lo era.

   NO entra `mark-icon.svg` («marca en dos tintas»): es la misma marca con un estilo que cambia
   de color segun el tema del sistema, asi que lo que se baja dependeria del computador. La
   pieza «Marca» ya ofrece Iris y Hueso. */

export const CATEGORIAS = [
  { id: 'alef', titulo: 'The Alef Code', linea: 'Las tres letras de Emet, en pixeles.' },
  { id: 'juanjo', titulo: 'Juan José López Ramírez', linea: 'Mi marca personal.' },
  { id: 'letbe', titulo: 'Let Be', linea: 'La casa de ser encontrado.' },
  { id: 'recvid', titulo: 'Recvid', linea: 'La casa de ser recordado.' },
  { id: 'fraterni', titulo: 'Fraterni', linea: 'La casa matriz y sus productos.' },
  { id: 'ejes', titulo: 'Fraterni · Los cuatro ejes', linea: 'El Centro, el Lazo, la Base y el Entorno.' },
  { id: 'principios', titulo: 'Fraterni · Los cuatro principios', linea: 'Propósito, carácter, presencia y conciencia.' },
  { id: 'permanentes', titulo: 'Fraterni · Los tres permanentes', linea: 'Fe, esperanza y amor.' },
  { id: 'otros', titulo: 'Otros proyectos', linea: 'Cordillera Unida FC y Nada que demostrar.' }
];

export const ACTIVOS = [
  /* The Alef Code */
  { id: 'alef', categoria: 'alef', nombre: 'Álef (א)', letra: 'logo', colores: 'uno', base: '#00FF66', vista: 'noche' },
  { id: 'mem', categoria: 'alef', nombre: 'Mem (מ)', letra: 'mem', colores: 'uno', base: '#FFD60A', vista: 'noche' },
  { id: 'tav', categoria: 'alef', nombre: 'Tav (ת)', letra: 'tav', colores: 'uno', base: '#FF3B3B', vista: 'noche' },

  /* Su marca */
  { id: 'firma', categoria: 'juanjo', nombre: 'Firma', ruta: '/assets/logos/signature.svg', colores: 'uno', vista: 'noche' },
  { id: 'marca', categoria: 'juanjo', nombre: 'Marca (la L-7 y el pez)', ruta: '/assets/logos/mark.svg', colores: 'uno', vista: 'noche' },
  { id: 'firma-con-marca', categoria: 'juanjo', nombre: 'Firma con marca', ruta: '/assets/logos/icon-sign.svg', colores: 'fijo', vista: 'noche' },

  /* Let Be */
  { id: 'let-be', categoria: 'letbe', nombre: 'Let Be', ruta: '/assets/projects/let-be.svg', colores: 'uno', vista: 'noche' },
  { id: 'let-be-icono', categoria: 'letbe', nombre: 'Let Be (ícono)', ruta: '/assets/avatars/let-be.svg', colores: 'uno', vista: 'noche' },

  /* Recvid */
  { id: 'recvid', categoria: 'recvid', nombre: 'Recvid', ruta: '/assets/projects/recvid.svg', colores: 'uno', vista: 'noche' },
  { id: 'recvid-color', categoria: 'recvid', nombre: 'Recvid a color', ruta: '/assets/marca/recvid-color.svg', colores: 'uno', vista: 'hueso' },

  /* Fraterni: la matriz y sus productos */
  { id: 'fraterni-ventures', categoria: 'fraterni', nombre: 'Fraterni Ventures', ruta: '/assets/projects/fraterni-ventures.svg', colores: 'uno', vista: 'noche' },
  { id: 'fraterni-academy', categoria: 'fraterni', nombre: 'Fraterni Academy', ruta: '/assets/projects/fraterni-academy.svg', colores: 'uno', vista: 'noche' },
  { id: 'fraterni-academy-icono', categoria: 'fraterni', nombre: 'Fraterni Academy (ícono)', ruta: '/assets/projects/fraterni-academy-icon.svg', colores: 'fijo', vista: 'noche' },
  { id: 'fraterni-business', categoria: 'fraterni', nombre: 'Fraterni Business', ruta: '/assets/projects/fraterni-business.svg', colores: 'uno', vista: 'noche' },
  { id: 'fraterni-business-icono', categoria: 'fraterni', nombre: 'Fraterni Business (ícono)', ruta: '/assets/projects/fraterni-business-icon.svg', colores: 'fijo', vista: 'noche' },
  { id: 'fraterniu', categoria: 'fraterni', nombre: 'FraterniU', ruta: '/assets/projects/u.svg', colores: 'fijo', vista: 'noche' },

  /* Los cuatro ejes */
  { id: 'eje-centro', categoria: 'ejes', nombre: 'El Centro', ruta: '/assets/fraterni/ejes/centro.svg', colores: 'fijo', vista: 'noche' },
  { id: 'eje-lazo', categoria: 'ejes', nombre: 'El Lazo', ruta: '/assets/fraterni/ejes/lazo.svg', colores: 'fijo', vista: 'noche' },
  { id: 'eje-base', categoria: 'ejes', nombre: 'La Base', ruta: '/assets/fraterni/ejes/base.svg', colores: 'fijo', vista: 'noche' },
  { id: 'eje-entorno', categoria: 'ejes', nombre: 'El Entorno', ruta: '/assets/fraterni/ejes/entorno.svg', colores: 'fijo', vista: 'noche' },

  /* Los cuatro principios */
  { id: 'principio-proposito', categoria: 'principios', nombre: 'Propósito', ruta: '/assets/fraterni/principios/proposito.svg', colores: 'fijo', vista: 'noche' },
  { id: 'principio-caracter', categoria: 'principios', nombre: 'Carácter', ruta: '/assets/fraterni/principios/caracter.svg', colores: 'fijo', vista: 'noche' },
  { id: 'principio-presencia', categoria: 'principios', nombre: 'Presencia', ruta: '/assets/fraterni/principios/presencia.svg', colores: 'fijo', vista: 'noche' },
  { id: 'principio-conciencia', categoria: 'principios', nombre: 'Conciencia', ruta: '/assets/fraterni/principios/conciencia.svg', colores: 'fijo', vista: 'noche' },

  /* Los tres permanentes */
  { id: 'permanente-fe', categoria: 'permanentes', nombre: 'Fe', ruta: '/assets/fraterni/permanentes/fe.svg', colores: 'fijo', vista: 'noche' },
  { id: 'permanente-esperanza', categoria: 'permanentes', nombre: 'Esperanza', ruta: '/assets/fraterni/permanentes/esperanza.svg', colores: 'fijo', vista: 'noche' },
  { id: 'permanente-amor', categoria: 'permanentes', nombre: 'Amor', ruta: '/assets/fraterni/permanentes/amor.svg', colores: 'fijo', vista: 'noche' },

  /* Otros proyectos */
  { id: 'cordillera', categoria: 'otros', nombre: 'Cordillera Unida FC', ruta: '/assets/projects/cordillera.svg', colores: 'fijo', vista: 'noche' },
  { id: 'nada-que-demostrar', categoria: 'otros', nombre: 'Nada que demostrar', ruta: '/assets/logos/nada-que-demostrar.svg', colores: 'fijo', vista: 'hueso' }
];

/* Los colores que se ofrecen (el nombre que se ve esta en textos.js → panel.marca.tonos).
   «original» es la pieza como esta dibujada; los demas pintan TODA la pieza de un color
   (solo las de `colores: 'uno'`). */
export const TONOS = [
  { id: 'verde', hex: '#00FF66' },
  { id: 'blanco', hex: '#FFFFFF' },
  { id: 'hueso', hex: '#F1EFE9' },
  { id: 'pino', hex: '#263B28' },
  { id: 'negro', hex: '#000000' },
  { id: 'rojo', hex: '#FF3B3B' },
  { id: 'amarillo', hex: '#FFD60A' },
  { id: 'iris', hex: '#7D9B4E' }
];

/* El fondo de lo que se baja (nombres en textos.js → panel.marca.fondos). null = transparente. */
export const FONDOS = [
  { id: 'transparente', hex: null },
  { id: 'noche', hex: '#050806' },
  { id: 'hueso', hex: '#F1EFE9' },
  { id: 'blanco', hex: '#FFFFFF' },
  { id: 'negro', hex: '#000000' }
];

/* El aire alrededor de la pieza: una parte del lado mas largo, por cada lado (el 1 = la pieza queda en
   un tercio del lienzo). Pedido del fundador (2026-10-30): los logos de redes se veian cortados y
   necesitaba «muchisimo» espacio para verlos enteros en el centro. */
export const ESPACIOS = [
  { id: 'ninguno', margen: 0 },
  { id: 'poco', margen: 0.08 },
  { id: 'mucho', margen: 0.4 },
  { id: 'muchisimo', margen: 1 }
];

/* El lado mas largo del PNG, en pixeles (el SVG no tiene tamaño: escala solo) */
export const TAMANOS = [256, 512, 1024, 2048, 4096];
export const TAMANO_MAX = 4096;
