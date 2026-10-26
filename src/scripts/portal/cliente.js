/* El cliente de Supabase. Se carga con `import()` SOLO en las paginas del
   portal: el resto del sitio no pesa ni un byte mas por esto.

   LAS OPCIONES, a proposito:
     flowType            'pkce'. El valor por defecto de la libreria es 'implicit'
                         (verificado en node_modules/@supabase/auth-js): ahi el
                         permiso viaja en la direccion (#access_token=…). Con
                         PKCE vuelve un `?code=` de un solo uso que el propio
                         cliente canjea.
     detectSessionInUrl  true: el cliente canjea ese `?code=` al arrancar y deja
                         la direccion limpia (verificado en GoTrueClient.js).
     persistSession      true: la sesion queda en el aparato (localStorage).
                         Es lo que hace que no pidas la contraseña cada vez; y es
                         la razon por la que el portal no lleva scripts de
                         terceros ni `innerHTML` (un XSS leeria esa sesion).
     autoRefreshToken    true.

   `clave` es la PUBLICA. config.js ya rechazo la secreta. */
export async function crearCliente({ url, clave }) {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, clave, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
  });
}
