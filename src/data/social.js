/* Las ocho plataformas, en un solo sitio.
   El orden de este array es el orden en que aparecen.
   `row: true` = sale en la fila visible del hero. */
export const SOCIAL = [
  { id: 'linkedin',  name: 'LinkedIn',  row: true,  href: 'https://www.linkedin.com/in/juanjoselopezramirez' },
  { id: 'github',    name: 'GitHub',    row: true,  href: 'https://github.com/juanjolopezramirez' },
  { id: 'instagram', name: 'Instagram', row: true,  href: 'https://www.instagram.com/juanjolopezramirez' },
  { id: 'vsco',      name: 'VSCO',      row: true,  href: 'https://vsco.co/juanjolopezramirez' },
  { id: 'facebook',  name: 'Facebook',  row: false, href: 'https://www.facebook.com/juanjolopezramirez' },
  { id: 'tiktok',    name: 'TikTok',    row: false, href: 'https://www.tiktok.com/@juanjolopezramirez' },
  { id: 'youtube',   name: 'YouTube',   row: false, href: 'https://www.youtube.com/@juanjolopezramirez' },
  { id: 'x',         name: 'X',         row: false, href: 'https://x.com/juanjolopezr' }
];

/* Las secciones del sitio. Añade una aquí y aparece en el menú y en el pie.

   `soon: true` = la página existe pero todavía no tiene nada dentro. Se
   muestra apagada y avisa a quien lee con el oído. Cuando escribas la
   página, borra esa línea y vuelve a encenderse sola. */
export const NAV = [
  { slug: 'work',     key: 'nav.work',     soon: true },
  { slug: 'projects', key: 'nav.projects', soon: true },
  { slug: 'writing',  key: 'nav.writing',  soon: true },
  { slug: 'about',    key: 'nav.about',    soon: true }
];

/* Escribirme será por WhatsApp. Mientras no haya número, no hay enlace:
   un <a> sin destino es una promesa que no se cumple, así que es un
   botón que lo dice. Pon el número aquí y quita `soon`. */
export const CONTACT = {
  channel: 'whatsapp',
  href: '',
  soon: true
};
