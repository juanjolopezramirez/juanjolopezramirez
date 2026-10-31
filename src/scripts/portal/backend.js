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

   y `mfa`, el codigo de 6 numeros de una app (solo el admin; panel.js):
     nivel()                     undefined | { actual: 'aal1'|'aal2', siguiente }  (siguiente 'aal2' = la cuenta tiene codigo)
     factores()                  { ok, lista: [{ id, nombre, creado }] } | { error }   (solo los confirmados)
     inscribir()                 { ok, id, qr (data:image/svg+xml…), secreto } | { error }
     confirmar(id, codigo)       { ok } | { error }   (el primer codigo del dispositivo nuevo)
     verificar(codigo)           { ok } | { error }   (entrar con el codigo)
     quitar(id)                  { ok } | { error }
     cerrarOtras()               { ok } | { error }   (cierra la cuenta en los demas navegadores)

   y, para el panel (components/portal/Panel.astro), `accesos`:
     listarPerfiles() · decidir(id, estado) · listarInvitaciones() · invitar(correo)
     · borrarInvitacion(correo) · leer(tabla)

   y `tablero`, Self-Mode → Tablero (panel/Tablero.js; supabase/009_tablero.sql; solo el admin):
     lecturas(semana)            { ok, filas: [{ clave, cargue, nota }] } | { error }   (semana = su lunes, «2026-10-26»)
     historial(clave)            { ok, filas: [{ semana, cargue, nota }] } | { error }  (las ultimas 12, la mas nueva primero)
     marcar({ semana, clave, cargue, nota })   { ok } | { error }   («cargue» true = cargué mi cruz, false = no la cargué)
     quitar(semana, clave)       { ok } | { error }   (vuelve a «sin revisar»)
     piedras()                   { ok, filas: [{ eje, piedra, desde }] } | { error }
     ponerPiedra({ eje, piedra, desde })   { ok } | { error }

   y `contenido`, Developer-Mode (panel/dev/*.js):
     repositorio(Tipo)           listar · leer · guardar · publicar · borrar (src/scripts/contenido/Repositorio.js)
     subir(ruta, archivo)        { ok } | { error }  (archivos.js lo revisa antes: tipo, tope, ruta)
     descargar(ruta)             { ok, blob } | { error }  (una imagen ya subida, para enseñarla en el panel)

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
