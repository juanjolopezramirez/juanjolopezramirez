-- ÁLEF · 900 · Semilla del primer admin (EJEMPLO: no pegar tal cual)
--
-- Esto convierte UNA cuenta en admin. Es la única forma de que exista un admin:
-- desde la página no se puede (la tabla «admins» no tiene reglas de escribir).
--
-- PASOS:
--   1. Entra al portal una vez con Google usando TU cuenta (la de admin).
--      Quedará «pendiente»: es lo esperado.
--   2. Copia este archivo, cambia TU_CORREO_AQUI por tu correo de admin y
--      pégalo en Supabase → SQL Editor → Run. NO guardes la copia con tu
--      correo dentro del repositorio: el repositorio es público.
--   3. Vuelve al portal y recarga: ya eres admin y estás aprobado.
--
-- Si el correo no existe todavía en Supabase, no pasa nada: no hace nada y la
-- última consulta te lo dice (admins = 0).

insert into public.admins (user_id)
select u.id
  from auth.users u
 where lower(u.email) = lower('TU_CORREO_AQUI')
   and u.email_confirmed_at is not null
   -- Solo si esa cuenta entró con Google (que ya verificó el correo): así nadie
   -- puede quedarse con tu puesto registrándose antes con tu correo y una clave.
   and exists (select 1 from auth.identities i
                where i.user_id = u.id and i.provider = 'google'
                  and lower(i.identity_data->>'email') = lower(u.email)
                  and i.identity_data->>'email_verified' = 'true')
   and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider <> 'google')
on conflict (user_id) do nothing;

-- El admin también queda aprobado
update public.perfiles
   set estado = 'aprobado', decidido_en = now()
 where id in (select user_id from public.admins);

-- Comprobación: debe decir 1
select count(*) as admins from public.admins;
