/* Las plataformas, en un solo sitio.

   NUEVE EN EL TELEFONO, EN TRES TANDAS DE TRES. La fila del hero enseña
   tres y cada siete segundos pasa a la siguiente (initRedes). Las tandas
   las eligio el fundador y salen del orden de esta lista, de tres en tres:

     1. Facebook · Instagram · VSCO
     2. TikTok · YouTube · Pinterest
     3. LinkedIn · Platzi · GitHub

   Eran doce y se quitaron X, Spotify y WhatsApp: «quitar tanta bulla».
   Si se añade o se quita una red de las que se ven aqui, hay que dejar el
   total en multiplo de tres o una tanda queda coja.

   DIEZ DE 1200px PARA ARRIBA, EN DOS TANDAS DE CINCO. Ahi la fila es ancha
   y caben cinco de una vez, asi que se enseñan cinco y vuelve WhatsApp —
   solo ahi— como decima. `ancho: true` es eso y nada mas: esta red existe
   de 1200px en adelante, en la fila y en la hoja de todas. Por debajo no
   se pinta y las tandas de tres siguen cuadrando.

   WhatsApp sigue ademas donde siempre hizo falta, en las puertas de
   escribirme (CONTACT), en todos los anchos.

   `row: true` = la primera tanda, la que se ve sin guion y la que se ve
   primero con el.

   `soon: true`, SIN `href`: la cuenta existe o va a existir, pero todavia
   no hay direccion. Sale igual, y al tocarla avisa (`soon.social`) en vez
   de llevar a ninguna parte. Hoy no la lleva ninguna. */
export const SOCIAL = [
  /* PRIMERA TANDA: la que se ve sin guion y la primera con el. */
  { id: 'facebook',  name: 'Facebook',  row: true,  href: 'https://www.facebook.com/juanjolopezramirez' },
  /* Instagram y TikTok estan repetidos: una casa en español y otra en
     ingles. `href` se queda —es el destino de siempre y el unico que
     vale sin JavaScript— y `accounts` es lo que se ofrece cuando si lo
     hay. El idioma de cada cuenta se nombra con la clave de LANGS, asi
     que la bandera y el nombre salen de META y no se repiten aqui.

     Las dos en ingles estan reservadas pero todavia no abiertas, asi que
     van sin `href`: la misma regla que las puertas de escribirme — sin
     destino no se encienden. Se siguen enseñando a proposito, apagadas,
     porque saber que vienen tambien es informacion; al tocarlas sale el
     aviso con el porque. El dia que abran se les pone el `href` y se les
     quita `soon`, y no hay que tocar nada mas. */
  { id: 'instagram', name: 'Instagram', row: true,  href: 'https://www.instagram.com/juanjolopezramirez',
    accounts: [
      { lang: 'es', handle: '@juanjolopezramirez', href: 'https://www.instagram.com/juanjolopezramirez' },
      { lang: 'en', handle: '@juanjo7opezramirez', soon: true }
    ] },
  { id: 'vsco',      name: 'VSCO',      row: true,  href: 'https://vsco.co/juanjolopezramirez' },

  /* SEGUNDA TANDA. */
  { id: 'tiktok',    name: 'TikTok',    row: false, href: 'https://www.tiktok.com/@juanjolopezramirez',
    accounts: [
      { lang: 'es', handle: '@juanjolopezramirez', href: 'https://www.tiktok.com/@juanjolopezramirez' },
      { lang: 'en', handle: '@juanjo7opezramirez', soon: true }
    ] },
  { id: 'youtube',   name: 'YouTube',   row: false, href: 'https://www.youtube.com/@juanjolopezramirez' },
  { id: 'pinterest', name: 'Pinterest', row: false, href: 'https://www.pinterest.com/juanjo7opezramirez/' },

  /* TERCERA TANDA. */
  { id: 'linkedin',  name: 'LinkedIn',  row: false, href: 'https://www.linkedin.com/in/juanjoselopezramirez' },
  { id: 'platzi',    name: 'Platzi',    row: false, href: 'https://platzi.com/p/juanjolopezramirez/' },
  { id: 'github',    name: 'GitHub',    row: false, href: 'https://github.com/juanjolopezramirez' },

  /* LA DECIMA, SOLO DE 1200px PARA ARRIBA (ver arriba). El numero no se
     escribe en la pagina: viaja dentro del enlace, igual que en CONTACT,
     que es de donde sale. */
  { id: 'whatsapp',  name: 'WhatsApp',  row: false, ancho: true, href: 'https://wa.me/573155278033' }
];

/* Las secciones del sitio. Añade una aquí y aparece en el menú y en el pie.

   `soon: true` = la página existe pero todavía no tiene nada dentro. Se
   muestra apagada y avisa a quien lee con el oído.

   Ahora mismo no la lleva ninguna: todas las secciones se muestran
   encendidas. El mecanismo se queda — añade `soon: true` a cualquiera
   y vuelve a marcarse sola, en el menú, en las puertas y en su página. */
export const NAV = [
  { slug: 'work',     key: 'nav.work'     },
  { slug: 'projects', key: 'nav.projects' },
  { slug: 'writing',  key: 'nav.writing'  },
  { slug: 'about',    key: 'nav.about'    }
];

/* Escribirme ya no es una sola puerta: son dos, y elige quien escribe.
   El boton de la cabecera abre la hoja, y la hoja las ofrece.

   `href` es el destino y es lo unico que se guarda: ni el numero ni el
   correo se escriben en la pagina. La ficha dice "WhatsApp" o "Correo",
   y el dato viaja dentro del enlace, no en el texto.

   Una puerta sin `href` no se enciende: sale apagada y avisa, porque un
   <a> sin destino es una promesa que no se cumple. */
export const CONTACT = [
  { id: 'whatsapp', key: 'contact.whatsapp', href: 'https://wa.me/573155278033' },
  { id: 'mail',     key: 'contact.mail',     href: 'mailto:juanjo7opezramirez@gmail.com' }
];
