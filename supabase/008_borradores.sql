-- THE ALEF CODE · 008 · Los borradores de Developer-Mode
--
-- Lo pidió el fundador (2026-10-27): poder «Guardar borrador» en cualquier etapa de un
-- formulario, aunque esté A MEDIAS (un libro sin su PDF todavía), y que cambiar algo que
-- YA está en la web no lo cambie en la web hasta que lo vuelva a publicar.
--
-- CÓMO: los borradores viven APARTE, en una tabla que solo ve el admin. Las tablas de 007
-- (biblioteca, casas, etapas) solo reciben algo COMPLETO, al publicarlo; sus reglas no se
-- aflojan. La compilación de la web (tools/traer-contenido.mjs) sigue leyendo solo esas
-- tablas, con «publicado = true»: un borrador no sale nunca.
--
--   borradores (tabla, id)   un borrador por cosa: lo nuevo que aún no se publicó, o los
--                            cambios a algo publicado que aún no se publican
--
-- Y LOS PDF LLEVAN UN TROZO AL AZAR en su nombre (libros/<id>/<idioma>-<azar>.pdf), como
-- ya los lomos y las imágenes: el PDF nuevo de un borrador no pisa el del libro publicado,
-- que la compilación sigue bajando hasta que se publique el cambio. Los nombres sin trozo
-- (los de antes) siguen valiendo.
--
-- Requiere 001 (es_admin(), que con 006 pide el código del celular), 002 (tocar_editado()) y
-- 007. Se puede volver a pegar sin romper nada.

-- --------------------------------------------------------------------- borradores
create table if not exists public.borradores (
  tabla   text not null check (tabla in ('biblioteca', 'casas', 'etapas')),
  id      text not null check (char_length(id) between 1 and 40 and id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Trabajos y Proyectos comparten la tabla «casas»: la clase dice de cuál es el borrador
  clase   text check (clase is null or clase in ('trabajo', 'proyecto')),
  -- Lo que hay en el formulario, tal cual lo guardó el panel (src/scripts/contenido: los
  -- modelos limpian todo al leerlo). Puede estar a medias. NUNCA se pinta en la web.
  fila    jsonb not null check (jsonb_typeof(fila) = 'object' and octet_length(fila::text) <= 2500000),
  creado  timestamptz not null default now(),
  editado timestamptz not null default now(),
  primary key (tabla, id)
);

alter table public.borradores enable row level security;
revoke all on table public.borradores from anon, authenticated;
-- Nadie sin entrar llega a esta tabla, ni para leer. Entrando, solo el admin (la regla de abajo).
grant select, insert, update, delete on table public.borradores to authenticated;

-- Cada borrador con la forma de su tabla: las casas dicen su clase (y solo ellas), y un
-- libro se llama como un libro (una palabra). Con nombre, para que volver a pegar las ponga.
alter table public.borradores drop constraint if exists borradores_clase_check;
alter table public.borradores add constraint borradores_clase_check
  check ((tabla = 'casas') = (clase is not null));
alter table public.borradores drop constraint if exists borradores_id_biblioteca_check;
alter table public.borradores add constraint borradores_id_biblioteca_check
  check (tabla <> 'biblioteca' or id ~ '^[a-z][a-z0-9]{0,39}$');

drop trigger if exists borradores_editado on public.borradores;
create trigger borradores_editado before update on public.borradores
  for each row execute function public.tocar_editado();

drop policy if exists borradores_todo_el_admin on public.borradores;
create policy borradores_todo_el_admin on public.borradores
  for all to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- ------------------------------------------------- el PDF con su trozo al azar
-- ¿Cada PDF de un libro es el SUYO, en su idioma? libros/<id>/<idioma>.pdf (los de antes)
-- o libros/<id>/<idioma>-<azar>.pdf. El id y el idioma ya pasaron su regla (solo letras,
-- cifras y guiones), así que se pueden poner dentro del patrón; el «case» asegura que el
-- idioma se mira ANTES de usarlo. 007 la define igual (volver a pegar 007 no la deshace).
create or replace function public.pdf_de_libro(libro text, pdf jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(pdf) = 'object'
     and libro ~ '^[a-z][a-z0-9]{0,39}$'
     and coalesce((select bool_and(case when e.key ~ '^[a-z]{2}$'
                                        then e.value ~ ('^libros/' || libro || '/' || e.key || '(-[a-z0-9]{6,16})?\.pdf$')
                                        else false end)
                     from jsonb_each_text(pdf) as e), true);
$$;
revoke execute on function public.pdf_de_libro(text, jsonb) from public, anon;
grant execute on function public.pdf_de_libro(text, jsonb) to authenticated;

-- La regla del PDF de biblioteca (007 la creó sin nombre; en la base se llama
-- biblioteca_check1) se cambia por una con nombre que acepta el trozo al azar. Se busca
-- por lo que dice (usa pdf_de_libro), no por su nombre: así vale en cualquier base.
do $$
declare c text;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.biblioteca'::regclass and contype = 'c'
              and conname <> 'biblioteca_pdf_check'
              and pg_get_constraintdef(oid) like '%pdf_de_libro%'
  loop
    execute format('alter table public.biblioteca drop constraint %I', c);
  end loop;
end $$;
alter table public.biblioteca drop constraint if exists biblioteca_pdf_check;
alter table public.biblioteca add constraint biblioteca_pdf_check check (
  public.claves_de_idioma(pdf) and pdf ? idioma_original
  and public.rutas_validas(pdf, '^libros/[a-z][a-z0-9]{0,39}/[a-z]{2}(-[a-z0-9]{6,16})?\.pdf$')
  and public.pdf_de_libro(id, pdf)
);

-- La compilación (con la clave publicable, sin entrar) baja SOLO el PDF de un libro
-- PUBLICADO, y solo si esa ruta es la que el libro dice en su idioma. El idioma sale del
-- nombre del archivo: «es.pdf» o «es-<azar>.pdf» → «es».
drop policy if exists "alef_libros_leer_publicados" on storage.objects;
create policy "alef_libros_leer_publicados" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'libros'
    and exists (
      select 1 from public.biblioteca b
       where b.publicado
         -- el nombre dentro del cajón es «<id>/<idioma>[-<azar>].pdf», SIN «libros/» delante
         -- (src/scripts/contenido/Almacen.js → ubicacion)
         and b.id = (storage.foldername(objects.name))[1]
         and b.pdf ->> split_part(split_part(storage.filename(objects.name), '.', 1), '-', 1) = 'libros/' || objects.name
    )
  );

-- ------------------------------------------------- una casa no cambia de clase
-- Trabajos y Proyectos comparten «casas»: publicar un Trabajo con el id de un Proyecto no
-- debe convertirlo en Trabajo. El panel ya lo mira antes; esto lo asegura en la base,
-- aunque haya dos pestañas a la vez.
create or replace function public.casas_clase_fija()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.clase is distinct from old.clase then
    raise exception 'Una casa no cambia de clase (% → %).', old.clase, new.clase using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function public.casas_clase_fija() from public, anon;

drop trigger if exists casas_clase_fija on public.casas;
create trigger casas_clase_fija before update on public.casas
  for each row execute function public.casas_clase_fija();
