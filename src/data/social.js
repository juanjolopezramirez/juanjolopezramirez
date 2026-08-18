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

/* Las secciones del sitio. Añade una aquí y aparece en el menú y en el pie. */
export const NAV = [
  { slug: 'work',     key: 'nav.work' },
  { slug: 'projects', key: 'nav.projects' },
  { slug: 'writing',  key: 'nav.writing' },
  { slug: 'about',    key: 'nav.about' }
];
