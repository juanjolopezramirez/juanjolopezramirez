-- ÁLEF · 006 · Ser admin pide el código de tu app (nivel «aal2»)
--
-- Desde aquí, la base solo trata a una cuenta como ADMIN si además de entrar
-- (Google o correo) escribió en ESTA sesión el código de 6 números de su app
-- (panel → «Seguridad»). Sin el código, aunque alguien tuviera tu cuenta de
-- Google, «Quién entra», tu diario, tus hábitos, lo que publicas y los videos
-- siguen cerrados: lo comprueba el SERVIDOR en cada consulta.
--
-- Funciona porque TODAS las reglas de admin (001, 002, 003, 004 y la función
-- decidir_acceso) preguntan a una sola función: public.es_admin() (revisado:
-- ninguna otra regla lee la tabla «admins»; 990 lo vigila). Aquí solo cambia
-- esa función. La tabla «admins» sigue diciéndole a la página que eres admin
-- (para que te pida el código); lo que abre los datos es esta función.
--
-- ORDEN (importa):
--   1. Publicado el panel con «Seguridad», añade tu celular Y un segundo
--      dispositivo de respaldo (otra app o tu gestor de contraseñas). Hazlo
--      desde la misma conexión de principio a fin.
--   2. Sal, vuelve a entrar y comprueba que el panel te pide el código.
--   3. Pega este archivo ENTERO en Supabase → SQL Editor → Run.
--   Si algún admin no tiene todavía un dispositivo confirmado, NO hace nada: se
--   para con un aviso, para que nadie se quede fuera. La función solo se crea
--   dentro de ese mismo bloque: no hay forma de aplicarla saltándose el seguro.
--   4. Después, corre 990_comprobar_rls.sql: la 11 dice true y la 12 y la 13
--      salen vacías.
--
-- SI PIERDES EL CELULAR (y el respaldo): supabase/910_deshacer_006.sql, desde
-- el SQL Editor de tu cuenta de Supabase. Ninguna clave pasa por ningún chat.
--
-- Se puede volver a pegar sin romper nada. Requiere 001.

do $guardia$
begin
  -- El seguro: TODO admin tiene que tener al menos un dispositivo confirmado.
  if exists (
    select 1 from public.admins a
     where not exists (
       select 1 from auth.mfa_factors f
        where f.user_id = a.user_id and f.status = 'verified'
     )
  ) then
    raise exception 'Primero añade tu celular en el panel → Seguridad. Sin un dispositivo confirmado, este cambio te dejaría fuera.';
  end if;

  execute $f$
    create or replace function public.es_admin()
    returns boolean
    language sql
    stable
    security definer
    set search_path = ''
    as $$
      select coalesce((select auth.jwt()->>'aal'), 'aal1') in ('aal2', 'aal3')
         and exists (
           select 1 from public.admins a where a.user_id = (select auth.uid())
         );
    $$
  $f$;

  revoke all on function public.es_admin() from public, anon;
  grant execute on function public.es_admin() to authenticated;
end;
$guardia$;
