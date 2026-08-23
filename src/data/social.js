/* Las ocho plataformas, en un solo sitio.
   El orden de este array es el orden en que aparecen.
   `row: true` = sale en la fila visible del hero. */
export const SOCIAL = [
  { id: 'linkedin',  name: 'LinkedIn',  row: true,  href: 'https://www.linkedin.com/in/juanjoselopezramirez' },
  { id: 'github',    name: 'GitHub',    row: true,  href: 'https://github.com/juanjolopezramirez' },
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
  { id: 'facebook',  name: 'Facebook',  row: false, href: 'https://www.facebook.com/juanjolopezramirez' },
  { id: 'tiktok',    name: 'TikTok',    row: false, href: 'https://www.tiktok.com/@juanjolopezramirez',
    accounts: [
      { lang: 'es', handle: '@juanjolopezramirez', href: 'https://www.tiktok.com/@juanjolopezramirez' },
      { lang: 'en', handle: '@juanjo7opezramirez', soon: true }
    ] },
  { id: 'youtube',   name: 'YouTube',   row: false, href: 'https://www.youtube.com/@juanjolopezramirez' },
  { id: 'x',         name: 'X',         row: false, href: 'https://x.com/juanjolopezr' }
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
