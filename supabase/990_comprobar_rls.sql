-- ÁLEF · 990 · Comprobar que las reglas están puestas
--
-- Solo LEE: no cambia nada. Pégalo en Supabase → SQL Editor → Run después de
-- 001..006 (y de la semilla). El editor enseña el resultado de la ÚLTIMA
-- consulta; si quieres ver las otras, córrelas una a una (selecciona y Run).
--
-- Cómo leerlo:
--   1. «Tablas sin RLS»            DEBE salir vacía.
--   2. «Tablas con RLS y sin reglas» DEBE salir vacía.
--   3. «Lo que puede hacer anon»   solo SELECT en entradas, libros, tarjetas, videos y,
--                                  tras 007, biblioteca, casas y etapas.
--   4. «Funciones que anon puede ejecutar» DEBE salir vacía (las de disparador no cuentan;
--                                  tampoco rutas_validas, claves_de_idioma ni pdf_de_libro de 007).
--   5. «Funciones sin search_path»  DEBE salir vacía.
--   6. «authenticated»             coincide con lo que da cada archivo (001..003 y 007).
--   7. «Cajones»                   portadas público, videos privado y, tras 007, libros
--                                  PRIVADO (application/pdf, 50 MB).
--   8. «storage.objects»           deben estar las cuatro reglas alef_admin_* y, tras 007,
--                                  las cinco alef_libros_* (cuatro del admin y la de leer
--                                  los PDF de libros publicados).
--  14. «Tablas de Developer-Mode»  tras 007: las tres, con sus dos reglas cada una.
--   9. «puede_cambiarse_el_estado» DEBE decir false.
--  10. «Admins»                    DEBE decir 1 (tú) una vez hecha la semilla.
--  11. «es_admin_pide_codigo»      true una vez aplicado 006 (antes, false).
--  12. «Admins sin dispositivo»    DEBE salir vacía una vez aplicado 006.
--  13. «Reglas que leen admins»    DEBE salir vacía: todo pasa por es_admin().
--  Los Advisors de Supabase (Security) avisarán, y está bien, de las 4 funciones
--  «security definer» que un usuario con sesión puede ejecutar (es_admin,
--  esta_aprobado, decidir_acceso, reclamar_invitacion): es a propósito y cada una
--  se comprueba por dentro.
--   (Si alguna vez creaste en este proyecto una tabla «solicitudes» de una versión
--   vieja del sitio, la consulta 1 o la 3 la enseñarán: bórrala con
--   «drop table public.solicitudes; drop function public.estado_solicitud(text);».)
-- Además, en el panel de Supabase → Advisors (Security y Performance): no debe
-- avisar de tablas sin RLS.

-- 1. Tablas sin RLS
select c.relname as tabla_sin_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
 order by 1;

-- 2. Tablas con RLS y sin ninguna regla (nadie podría ni leerlas: casi seguro un olvido)
select c.relname as tabla_sin_reglas
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relrowsecurity
   and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)
 order by 1;

-- 3. Lo que puede hacer alguien que NO ha entrado (anon)
-- (se pregunta directamente a Postgres con has_table_privilege: así cuenta
-- también lo que se heredó de PUBLIC, que information_schema no enseña)
select c.relname as tabla, p as permiso
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) p
 where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p', 'f')
   and has_table_privilege('anon', c.oid, p)
 order by 1, 2;

-- 4. Funciones de public que alguien sin entrar puede ejecutar
select p.proname as funcion_que_anon_puede_ejecutar
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.prorettype <> 'trigger'::regtype
   and has_function_privilege('anon', p.oid, 'execute')
 order by 1;

-- 5. Funciones «security definer» sin search_path fijo (DEBE salir vacía)
select p.proname as funcion_sin_search_path
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prosecdef and (p.proconfig is null or not exists (
         select 1 from unnest(p.proconfig) c where c like 'search_path=%'))
 order by 1;

-- 6. Lo que puede hacer alguien que SÍ entró (authenticated) en public
select c.relname as tabla, string_agg(p, ', ' order by p) as permisos
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) p
 where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p', 'f')
   and has_table_privilege('authenticated', c.oid, p)
 group by 1 order by 1;

-- 7. Los cajones de archivos: «portadas» público, «videos» privado
select id, public as publico, file_size_limit, allowed_mime_types from storage.buckets order by 1;

-- 8. Las reglas de storage.objects (deben estar las cuatro alef_admin_*)
select policyname, cmd, roles from pg_policies where schemaname = 'storage' and tablename = 'objects' order by 1;

-- 9. ¿Puede alguien con sesión cambiarse su propio «estado»? (DEBE decir false)
select has_column_privilege('authenticated', 'public.perfiles', 'estado', 'update') as puede_cambiarse_el_estado;

-- 10. Admins (debe ser 1 tras la semilla)
select count(*) as admins from public.admins;

-- 11. ¿Ser admin pide el código de la app? (true tras 006)
select pg_get_functiondef('public.es_admin()'::regprocedure) like '%aal2%' as es_admin_pide_codigo;

-- 12. Admins sin un dispositivo confirmado (DEBE salir vacía tras 006: si no, ese admin no entra)
select a.user_id as admin_sin_dispositivo
  from public.admins a
 where not exists (select 1 from auth.mfa_factors f where f.user_id = a.user_id and f.status = 'verified');

-- 14. Developer-Mode (007): biblioteca, casas y etapas, cada una con «_todo_el_admin» y
--     «_leer_publicado» (DEBE salir: 3 filas, 2 reglas cada una)
select tablename as tabla_de_developer_mode, count(*) as reglas, string_agg(policyname, ', ' order by policyname) as cuales
  from pg_policies
 where schemaname = 'public' and tablename in ('biblioteca', 'casas', 'etapas')
 group by 1 order by 1;

-- 13. Reglas que leen la tabla admins por su cuenta (DEBE salir vacía: todas pasan por es_admin())
select schemaname, tablename, policyname
  from pg_policies
 where coalesce(qual, '') || coalesce(with_check, '') ~ 'admins'
   and not (schemaname = 'public' and tablename = 'admins');
