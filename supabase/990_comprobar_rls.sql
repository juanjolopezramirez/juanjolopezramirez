-- ÁLEF · 990 · Comprobar que las reglas están puestas
--
-- Solo LEE: no cambia nada. Pégalo en Supabase → SQL Editor → Run después de
-- 001..008 (y de la semilla). El editor enseña el resultado de la ÚLTIMA
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
--  Tras 008 (borradores):
--  15. «Borradores»                rls true, anon_lee false, una regla del admin (ALL).
--  16. «Regla del PDF»             solo biblioteca_pdf_check.
--  17. «pdf_de_libro»              true, true, false, false.
--  18. «entiende_el_azar»          true.
--  19. «casas_clase_fija»          una fila.
--  Tras 009 (tablero):
--  20. «Tablero»                   dos filas (lecturas y piedras): rls true, anon_lee false, una regla
--                                  tablero_*_solo_lo_mio:ALL cada una.
--  Tras 013 (compartir con un enlace privado):
--  24. «Compartir»                 dos filas (ediciones y enlaces): rls true, anon_lee false, una regla
--                                  *_todo_el_admin:ALL cada una.
--  24. tambien anon_escribe false.
--  25. «Lo que el admin cambia»    true SOLO en taller_enlaces · revocado.
--  26. «Disparadores y funciones»  2 disparadores; las tres funciones: security_definer false, anon y authenticated
--                                  false, service_role true solo en taller_contar_vista.
--  27. «vista y actividad»         UNA regla sobre casas.id (reglas_sobre_casas_id = 1), true, y la columna libro_id.
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

-- 15. Borradores (008): rls true, anon_lee false, 1 regla borradores_todo_el_admin:ALL
select c.relrowsecurity as rls, has_table_privilege('anon', c.oid, 'SELECT') as anon_lee,
       (select string_agg(policyname || ':' || cmd, ', ') from pg_policies
         where schemaname = 'public' and tablename = 'borradores') as reglas
  from pg_class c where c.oid = 'public.borradores'::regclass;

-- 16. La regla del PDF de biblioteca (DEBE salir solo biblioteca_pdf_check)
select conname from pg_constraint
 where conrelid = 'public.biblioteca'::regclass and contype = 'c'
   and pg_get_constraintdef(oid) like '%pdf_de_libro%';

-- 17. pdf_de_libro con trozo al azar (DEBE: true, true, false, false)
select public.pdf_de_libro('libro', '{"es":"libros/libro/es.pdf"}'),
       public.pdf_de_libro('libro', '{"es":"libros/libro/es-abc123.pdf"}'),
       public.pdf_de_libro('libro', '{"es":"libros/otro/es-abc123.pdf"}'),
       public.pdf_de_libro('libro', '{"es":"libros/libro/en-abc123.pdf"}');

-- 18. La regla de leer PDF entiende el trozo al azar (DEBE decir true)
select qual like '%split_part(split_part%' as entiende_el_azar
  from pg_policies where schemaname = 'storage' and policyname = 'alef_libros_leer_publicados';

-- 19. Una casa no cambia de clase (DEBE salir 1 fila: casas_clase_fija)
select tgname from pg_trigger where tgrelid = 'public.casas'::regclass and tgname = 'casas_clase_fija';

-- 20. El tablero (009): 2 filas, rls true, anon_lee false, 1 regla «_solo_lo_mio:ALL» cada una
select c.relname as tabla, c.relrowsecurity as rls, has_table_privilege('anon', c.oid, 'SELECT') as anon_lee,
       (select string_agg(policyname || ':' || cmd, ', ') from pg_policies
         where schemaname = 'public' and tablename = c.relname) as reglas
  from pg_class c where c.oid in ('public.tablero_lecturas'::regclass, 'public.tablero_piedras'::regclass)
 order by 1;

-- 21. El taller (012): 4 filas, rls true, anon_lee false, 1 regla «_todo_el_admin:ALL» cada una
select c.relname as tabla, c.relrowsecurity as rls, has_table_privilege('anon', c.oid, 'SELECT') as anon_lee,
       (select string_agg(policyname || ':' || cmd, ', ') from pg_policies
         where schemaname = 'public' and tablename = c.relname) as reglas
  from pg_class c
 where c.oid in (to_regclass('public.taller_obras'), to_regclass('public.taller_capitulos'),
                 to_regclass('public.taller_piezas'), to_regclass('public.taller_versiones'))
 order by 1;

-- 22. El cajon del taller: privado (public false), 50 MB, sus tipos; y 4 reglas
select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'taller';
select count(*) as reglas from pg_policies where schemaname = 'storage' and policyname like 'alef_taller_admin_%';

-- 23. Sus disparadores (DEBEN salir 6 filas) y las versiones no se editan (DEBE decir false)
select tgname from pg_trigger where not tgisinternal and tgname ~ '^taller_.*_(editado|rev)$' order by 1;
select has_table_privilege('authenticated', 'public.taller_versiones', 'UPDATE') as se_editan;

-- 24. Compartir con un enlace privado (013): 2 filas, rls true, anon_lee false, anon_escribe false (insert, update y
--     delete), 1 regla «_todo_el_admin:ALL» cada una
select c.relname as tabla, c.relrowsecurity as rls, has_table_privilege('anon', c.oid, 'SELECT') as anon_lee,
       (has_table_privilege('anon', c.oid, 'INSERT') or has_table_privilege('anon', c.oid, 'UPDATE')
        or has_table_privilege('anon', c.oid, 'DELETE')) as anon_escribe,
       (select string_agg(policyname || ':' || cmd, ', ') from pg_policies
         where schemaname = 'public' and tablename = c.relname) as reglas
  from pg_class c
 where c.oid in (to_regclass('public.taller_ediciones'), to_regclass('public.taller_enlaces'))
 order by 1;

-- 25. De un enlace, el admin solo puede cambiar «revocado» (DEBE salir true SOLO en la fila de revocado), y de una
--     edicion, nada (la tabla entera se mira: has_column_privilege cuenta tambien un permiso de tabla)
select t.tabla, a.attname as columna, has_column_privilege('authenticated', t.tabla::regclass, a.attname, 'UPDATE') as el_admin_puede_cambiarla
  from (values ('public.taller_ediciones'), ('public.taller_enlaces')) t(tabla)
  join pg_attribute a on a.attrelid = t.tabla::regclass and a.attnum > 0 and not a.attisdropped
 order by 1, 2;

-- 26. Sus dos disparadores (DEBEN salir 2 filas), y ninguna funcion «taller_enlace*» / «taller_contar_vista» es
--     security definer ni la ejecuta anon ni authenticated (DEBE salir: false, false, false en las tres)
select tgname from pg_trigger where not tgisinternal and tgname in ('taller_enlaces_nuevo', 'taller_enlaces_cambia') order by 1;
select p.proname, p.prosecdef as security_definer, has_function_privilege('anon', p.oid, 'execute') as anon_ejecuta,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_ejecuta,
       has_function_privilege('service_role', p.oid, 'execute') as service_role_ejecuta
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and (p.proname like 'taller_enlace%' or p.proname = 'taller_contar_vista')
 order by 1;

-- 27. «vista» y «actividad» no pueden ser una casa. DEBE salir UNA sola regla sobre casas.id con char_length (la que
--     pone 013) y decir true; si salen dos, la de 007 quedo viva con otro nombre: borrala.
select conname, pg_get_constraintdef(oid) like '%''vista''%' and pg_get_constraintdef(oid) like '%''actividad''%' as reserva_vista_y_actividad,
       (select count(*) from pg_constraint c2 where c2.conrelid = 'public.casas'::regclass and c2.contype = 'c'
           and pg_get_constraintdef(c2.oid) like '%char_length(id)%') as reglas_sobre_casas_id
  from pg_constraint where conrelid = 'public.casas'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%char_length(id)%';
select column_name from information_schema.columns where table_schema = 'public' and table_name = 'taller_obras' and column_name = 'libro_id';
