/* De quien habla el portal: el de VERDAD (Supabase), el de PRUEBA (todo en
   memoria, solo con `npm run dev`) o nadie (apagado). Los tres tienen la misma
   forma, asi que la tarjeta y el panel no saben cual es.

   LA FORMA (todo es asincrono; nada lanza: devuelve `{ ok: true, ... }` o
   `{ error: '<clave de texto>' }`, y las claves son las de data/portal/textos.js
   → errores):

     modo                        'real' | 'demo'
     sesion()                    null | { id, correo } | undefined (no se pudo saber: red)
     perfil(id)                  undefined (error de red) | null | { estado, nombre, motivo, correo, esAdmin }
     reclamarInvitacion()        'pendiente' | 'aprobado' | …  (la funcion SQL del mismo nombre)
     entrar(correo, clave)       { ok } | { error }
     registrar({ nombre, correo, clave, motivo })   { ok, necesitaCorreo } | { error }
     google()                    { ok } | { error }   (el navegador se va a Google)
     recuperar(correo)           { ok } | { error }
     nuevaClave(clave)           { ok } | { error }
     guardarMotivo(id, texto)    { ok } | { error }
     salir()                     { ok }
     alCambiar(cb)               cb(evento, sesion) cada vez que cambia quien es; devuelve «dejar de escuchar»

   y, para el panel (components/portal/Panel.astro), `accesos`:
     listarPerfiles() · decidir(id, estado) · listarInvitaciones() · invitar(correo)
     · borrarInvitacion(correo) · leer(tabla)

   EL CODIGO DE PRUEBA NO VIAJA A LA PUBLICACION: la comprobacion de `DEV` esta
   escrita tal cual para que Vite la resuelva al compilar y se lleve el resto. */
import { leerConfig } from './config.js';

export async function abrirBackend(lang) {
  const cfg = leerConfig();
  if (cfg.modo === 'real') {
    const m = await import('./real.js');
    return m.abrirReal(cfg, lang);
  }
  if (import.meta.env.DEV && cfg.modo === 'demo') {
    const m = await import('./demo.js');
    return m.abrirDemo(lang);
  }
  return null;
}
