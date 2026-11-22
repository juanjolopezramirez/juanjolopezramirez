-- THE ALEF CODE · 016 · La ficha del libro («ⓘ» del lector)
--
-- La escribe el autor en el Taller y la ve quien abre el libro: en Recursos (público) y en un enlace privado.
--   taller_obras.ficha       la fuente: plana, en el idioma de la obra (resumen, tema, claves, para_quien)
--   taller_ediciones.ficha   copia al publicar una edición (lo que lee la función `vista`); el admin solo puede
--                            cambiar ESTA columna de una edición (corregir una errata sin subir otro PDF)
--   biblioteca.ficha         { idioma: ficha }, como titulo y pdf; la lee la compilación (traer-contenido.mjs)
-- Todo texto se pinta con textContent: aquí no hay HTML. NO hay funciones security definer; nada se le da a `anon`
-- (biblioteca ya la lee por la regla de «publicado»: la ficha de un libro publicado es pública a propósito).
-- Requiere 007, 012 y 013. Se puede volver a pegar sin romper nada. NO depende de 015 ni de 017 (el lomo).
-- Orden al estrenarla: 1) este SQL  2) desplegar `vista` (pide `ficha`)  3) publicar el sitio.
-- Si se vuelve a pegar 013, pegar 016 después (013 hace revoke all y quita el grant de ficha).
-- Aprobado por Juanjo el 2026-11-22 («te doy permiso»).

-- ¿Es una ficha de UN idioma? Solo estas cuatro claves; textos de una línea salvo el resumen (que admite saltos).
-- Los topes cuentan letras (char_length). El «case» va anidado: SQL no garantiza el orden de un «and».
create or replace function public.ficha_valida(j jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(j) = 'object' then
           octet_length(j::text) <= 6000
           and coalesce((
             select bool_and(
               case e.key
                 when 'resumen' then jsonb_typeof(e.value) = 'string'
                                     and char_length(e.value #>> '{}') <= 500
                                     and (e.value #>> '{}') !~ '[\x01-\x09\x0B-\x1F\x7F]'
                 when 'tema' then jsonb_typeof(e.value) = 'string'
                                     and char_length(e.value #>> '{}') <= 60
                                     and (e.value #>> '{}') !~ '[[:cntrl:]]'
                 when 'para_quien' then jsonb_typeof(e.value) = 'string'
                                     and char_length(e.value #>> '{}') <= 80
                                     and (e.value #>> '{}') !~ '[[:cntrl:]]'
                 when 'claves' then case when jsonb_typeof(e.value) = 'array' then
                                       jsonb_array_length(e.value) <= 5
                                       and not exists (
                                         select 1 from jsonb_array_elements(e.value) c
                                          where jsonb_typeof(c) <> 'string'
                                             or char_length(c #>> '{}') not between 1 and 70
                                             or (c #>> '{}') ~ '[[:cntrl:]]')
                                     else false end
                 else false
               end)
             from jsonb_each(j) as e), true)
         else false end;
$$;

-- ¿Es { idioma: ficha }? (para biblioteca)
create or replace function public.fichas_validas(j jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(j) = 'object' then
           octet_length(j::text) <= 32000
           and (select count(*) from jsonb_object_keys(j)) <= 10
           and public.claves_de_idioma(j)
           and coalesce((select bool_and(public.ficha_valida(e.value)) from jsonb_each(j) as e), true)
         else false end;
$$;
revoke execute on function public.ficha_valida(jsonb) from public, anon;
revoke execute on function public.fichas_validas(jsonb) from public, anon;
grant execute on function public.ficha_valida(jsonb) to authenticated;
grant execute on function public.fichas_validas(jsonb) to authenticated;

-- Las columnas (filas de antes: '{}', que es válida = sin ficha)
alter table public.taller_obras     add column if not exists ficha jsonb not null default '{}'::jsonb;
alter table public.taller_ediciones add column if not exists ficha jsonb not null default '{}'::jsonb;
alter table public.biblioteca       add column if not exists ficha jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.taller_obras'::regclass and conname = 'taller_obras_ficha_check') then
    alter table public.taller_obras add constraint taller_obras_ficha_check check (public.ficha_valida(ficha));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.taller_ediciones'::regclass and conname = 'taller_ediciones_ficha_check') then
    alter table public.taller_ediciones add constraint taller_ediciones_ficha_check check (public.ficha_valida(ficha));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.biblioteca'::regclass and conname = 'biblioteca_ficha_check') then
    alter table public.biblioteca add constraint biblioteca_ficha_check check (public.fichas_validas(ficha));
  end if;
end;
$$;

-- Permisos. Las RLS existentes (`*_todo_el_admin`, `biblioteca_leer_publicado`) ya cubren las columnas nuevas: no se
-- crea ninguna regla. taller_obras y biblioteca ya dan UPDATE de tabla entera al admin. De una edición, el admin
-- no podía cambiar nada (013): ahora solo `ficha`. service_role ya lee la tabla entera (013).
grant update (ficha) on table public.taller_ediciones to authenticated;

comment on column public.taller_obras.ficha is 'Ficha del libro (resumen, tema, claves, para_quien) en el idioma de la obra. Fuente de lo que se copia al publicar.';
comment on column public.taller_ediciones.ficha is 'Copia de la ficha al sacar la edición; la lee la función vista. El admin puede corregirla (única columna editable).';
comment on column public.biblioteca.ficha is '{ idioma: ficha } de un libro de Recursos; la lee tools/traer-contenido.mjs al compilar. Pública si el libro está publicado.';
