import { defineConfig } from 'astro/config';

// ---------------------------------------------------------------
// Una URL por idioma: /es/, /en/, /pt/, /fr/, /it/
//
// GITHUB PAGES — lee esto antes de publicar:
//
//   A) Dominio propio (juanjolopezramirez.com)  → deja `base` como está.
//   B) Repo llamado <usuario>.github.io          → deja `base` como está.
//   C) Cualquier otro nombre de repo             → el sitio vive en
//      https://<usuario>.github.io/<repo>/ y HAY QUE poner:
//
//        base: '/<nombre-del-repo>/',
//
//      Sin eso, las imágenes y los enlaces apuntan a la raíz y no cargan.
// ---------------------------------------------------------------
export default defineConfig({
  site: 'https://juanjolopezramirez.com',
  base: '/',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'pt', 'fr', 'it'],
    routing: { prefixDefaultLocale: true }
  },
  build: { format: 'directory' }
});
