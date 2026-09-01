import { LANGS } from '../i18n/ui.js';
import { NAV } from '../data/social.js';
import { ENTITIES, slugOf } from '../data/entities.js';

/* El mapa del sitio, generado de las mismas listas que hacen las paginas.

   No se escribe a mano a proposito: son 25 direcciones —cinco secciones por
   cinco idiomas— y una lista escrita aparte se queda vieja en cuanto alguien
   toca `NAV` o `LANGS`. Saliendo de las mismas constantes que ya mandan sobre
   el menu y las rutas, no puede desincronizarse.

   Cada direccion declara sus cinco hermanas con `hreflang`, que es lo que le
   dice al buscador que no son cinco paginas compitiendo entre ellas sino la
   misma en cinco idiomas. */
export function GET({ site }) {
  const origin = String(site ?? '').replace(/\/$/, '');
  /* La portada, las cuatro secciones y la pagina de cada casa. Las casas
     salen de las mismas listas que pintan las tarjetas, asi que anadir
     una la mete sola en el mapa — que es la razon de que esto no se
     escriba a mano. */
  const paths = ['', ...NAV.map((n) => n.slug), ...ENTITIES.map(slugOf)];

  const url = (lang, path) => `${origin}/${lang}/${path ? path + '/' : ''}`;

  const entries = LANGS.flatMap((lang) =>
    paths.map((path) => {
      const alts = LANGS.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(l, path)}"/>`
      ).join('\n');
      return [
        '  <url>',
        `    <loc>${url(lang, path)}</loc>`,
        alts,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${url('es', path)}"/>`,
        '  </url>'
      ].join('\n');
    })
  ).join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    entries,
    '</urlset>',
    ''
  ].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
