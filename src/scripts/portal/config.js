/* La configuracion del portal: de DONDE hablar con Supabase y en que modo.

   Las dos variables se ponen al compilar (Astro las deja pasar al navegador
   solo si empiezan por PUBLIC_):

     PUBLIC_SUPABASE_URL        https://<tu-proyecto>.supabase.co
     PUBLIC_SUPABASE_ANON_KEY   la clave PUBLICA (anon / publishable)

   Van en un archivo `.env` en tu computador (copia de `.env.example`; `.env` NO
   se sube nunca) y, para la publicacion, en los «Secrets» del repositorio de
   GitHub. La clave publica no abre nada por si sola: lo que protege los datos
   son las reglas de la base (supabase/*.sql). La clave SECRETA (`service_role`,
   `sb_secret_…`) no va NUNCA aqui: modoDe() la detecta y la rechaza.

   Los modos (estado.js → modoDe):
     real     hay URL y clave publica: se habla con Supabase de verdad
     demo     solo con `npm run dev` y sin variables: todo en memoria, con una
              etiqueta «Demostración» y sin red. `?demo=` elige quien eres
              (entrar, pendiente, rechazado, miembro, admin)
     apagado  la publicacion sin variables: la tarjeta dice «Pronto» y nada se rompe */
import { modoDe, claveVale, limpiarUrl } from './estado.js';

/* Cada variable se lee POR SU NOMBRE (nunca `import.meta.env` entero): asi la
   compilacion mete en el JS publicado solo estas dos, y no cualquier otra PUBLIC_
   que alguien ponga despues en `.env` o en GitHub. */
export function leerConfig() {
  const url = limpiarUrl(import.meta.env.PUBLIC_SUPABASE_URL);
  const crudo = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const clave = typeof crudo === 'string' ? crudo.trim() : crudo;
  const dev = import.meta.env.DEV === true;
  const demo = dev && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo');
  const modo = modoDe({ url, clave, dev, demo });
  if (modo !== 'real' && typeof clave === 'string' && clave && !claveVale(clave)) {
    /* Hay una clave puesta pero no sirve (o es la SECRETA): se avisa, sin enseñarla. */
    console.warn('[portal] PUBLIC_SUPABASE_ANON_KEY no es una clave publica valida: se ignora. ¿Pusiste la clave secreta? Usa solo la publica (anon / publishable).');
  }
  return { modo, url: modo === 'real' ? url : null, clave: modo === 'real' ? clave : null };
}
