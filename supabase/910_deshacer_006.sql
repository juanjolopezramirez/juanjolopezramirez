-- ÁLEF · 910 · DESHACER el 006 (solo si perdiste TODOS tus dispositivos)
--
-- NO es parte de la instalación. Viene APAGADO: tal cual, no hace nada y se para
-- con un aviso. Así no se ejecuta por error si algún día se pegan los archivos
-- en orden.
--
-- Úsalo solo si ya no tienes ni el celular ni el respaldo con el código de 6
-- números. Cambia abajo 'NO' por 'SI' y pégalo ENTERO en Supabase → SQL Editor →
-- Run (tu cuenta de Supabase, con su propia verificación: por eso esto no abre
-- nada a nadie más).
--
-- Hace DOS cosas, las dos necesarias:
--   1. es_admin() vuelve a ser como en 001 (admin sin código).
--   2. Borra los dispositivos del admin. Sin este paso, el panel seguiría
--      pidiendo un código que ya no puedes generar.
-- Después: sal del portal, vuelve a entrar, y EN SEGUIDA añade un dispositivo
-- nuevo en «Seguridad» (mientras no lo tengas, la cuenta no pide código) y
-- vuelve a pegar 006_admin_aal2.sql.

do $deshacer$
declare
  confirmo constant text := 'NO';   -- cambia 'NO' por 'SI' para deshacer de verdad
begin
  if confirmo <> 'SI' then
    raise exception 'El 910 está apagado. Si de verdad perdiste todos tus dispositivos, cambia NO por SI y vuelve a correrlo.';
  end if;

  execute $f$
    create or replace function public.es_admin()
    returns boolean
    language sql
    stable
    security definer
    set search_path = ''
    as $$
      select exists (
        select 1 from public.admins a where a.user_id = (select auth.uid())
      );
    $$
  $f$;

  revoke all on function public.es_admin() from public, anon;
  grant execute on function public.es_admin() to authenticated;

  delete from auth.mfa_factors where user_id in (select user_id from public.admins);
end;
$deshacer$;
