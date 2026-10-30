# Piezas de terceros que van dentro de la web

Lo que se baja con la web y no es nuestro. Las versiones exactas están en `package.json` y
`package-lock.json` (cada una con su huella de integridad).

## mediabunny 1.61.4 — MPL-2.0

- Para qué: armar el archivo MP4 de las animaciones de «Brand Assets» (portal → Developer-Mode).
  Solo se baja cuando alguien pide un video: va en su propio archivo (`/_astro/src.*.js`).
- Autor: Vanilagy. Código fuente: https://github.com/Vanilagy/mediabunny (la versión 1.61.4 también
  está en https://www.npmjs.com/package/mediabunny/v/1.61.4).
- Licencia: Mozilla Public License 2.0 — https://www.mozilla.org/MPL/2.0/
- Se usa **sin modificar**. Si algún día se cambia un archivo suyo, ese archivo cambiado tiene que
  publicarse también bajo MPL-2.0.

## Otros

- `@supabase/supabase-js` (MIT), `page-flip` (MIT) y `astro` (MIT): ver sus licencias en
  `node_modules/<paquete>/LICENSE`.
