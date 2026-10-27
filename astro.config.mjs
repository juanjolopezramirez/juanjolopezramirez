import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { esClaveSecreta, limpiarUrl, revisarVariables } from './src/scripts/portal/estado.js';
import { politicaDeContenido } from './tools/politica-contenido.mjs';

// ---------------------------------------------------------------
// EL PORTAL «ÁLEF»: las dos variables se revisan ANTES de compilar.
// Todo lo que empieza por PUBLIC_ viaja dentro del JS publicado: una clave
// secreta puesta ahi por error se leeria desde el navegador aunque el codigo la
// ignore. Si hay algo mal, la compilacion se PARA con una frase clara (y sin
// repetir el valor). Sin ninguna de las dos, todo sigue: el portal sale «apagado».
// Detalle en PORTAL.md y en src/scripts/portal/estado.js → revisarVariables.
// ---------------------------------------------------------------
let supabaseUrl = '';
{
  const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'PUBLIC_');
  const r = revisarVariables(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
  if (!r.ok) throw new Error('\n\n  PORTAL ÁLEF: ' + r.motivo + '\n  Corrige el archivo .env (o los Secrets de GitHub) y vuelve a compilar.\n');
  // Y CUALQUIER otra PUBLIC_ con una clave secreta tambien para todo (se dice el nombre, nunca el valor).
  const secretas = Object.keys(env).filter((k) => esClaveSecreta(String(env[k]).trim()));
  if (secretas.length) throw new Error('\n\n  PORTAL: ' + secretas.join(', ') + ' tiene una clave SECRETA de Supabase. Nada que empiece por PUBLIC_ puede llevarla: se publicaria. Quitala y, como ya se vio, generala de nuevo en Supabase.\n');
  if (r.ok && !r.vacio) supabaseUrl = limpiarUrl(env.PUBLIC_SUPABASE_URL);   // para la politica de contenido (connect-src)
}

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
  // La politica de contenido (CSP) de cada pagina: tools/politica-contenido.mjs
  integrations: [politicaDeContenido({ supabase: supabaseUrl })],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'pt', 'fr', 'it'],
    routing: { prefixDefaultLocale: true }
  },
  build: {
    format: 'directory',
    // La hoja de estilos va DENTRO de cada pagina y no en /_astro/. GitHub
    // Pages guarda el HTML diez minutos y cada publicacion cambia el nombre
    // del CSS: un HTML guardado pedia una hoja que ya no existia y la pagina
    // salia sin estilos. Dentro, HTML y estilos llegan siempre juntos.
    inlineStylesheets: 'always'
  }
});
