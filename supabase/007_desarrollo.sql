-- THE ALEF CODE · 007 · Developer-Mode: libros, casas y etapas
--
-- Lo que el fundador edita desde el panel (Developer-Mode) para cambiar la página
-- pública SIN pedírselo a nadie:
--   · biblioteca  los libros NUEVOS de Recursos (los de data/biblioteca.js siguen en el código)
--   · casas       las empresas con las que he trabajado (clase 'trabajo') y los proyectos
--                 que estoy construyendo (clase 'proyecto'), con su página estilo Notion
--   · etapas      las etapas nuevas de «¿Por dónde he caminado?» (Sobre el camino)
--
-- Cómo llega a la página: al darle «Publicar», la página se vuelve a armar en GitHub y
-- lee SOLO las filas con «publicado = true» (tools/traer-contenido.mjs, con la clave
-- publicable). Los borradores nunca salen de aquí.
--
-- Las reglas de cada campo son las mismas que las de src/scripts/contenido/*.js (el
-- panel valida antes de guardar); estas son la defensa de la base, por si acaso.
--
-- NADA SE BORRA. Las tablas «libros» y «tarjetas» de 002 eran esqueletos y están
-- vacías: se quedan como están (sin uso). Este archivo crea tablas nuevas con la forma
-- de las piezas del panel.
--
-- Requiere 001 (es_admin(), que con 006 pide el código del celular) y 002
-- (tocar_editado()). Se puede volver a pegar sin romper nada.
--
-- Quién ve y quién escribe (igual que 002):
--   · Cualquiera (incluso sin entrar) ve lo que tiene «publicado = true».
--   · SOLO el admin crea, cambia, publica o borra.

-- Los topes de tamaño cuentan BYTES (una letra hebrea son dos, una china tres) y son
-- holgados: el panel (src/scripts/contenido) corta antes por letras.

-- ¿Todas las rutas de un objeto { idioma: ruta } siguen el patrón? (para los CHECK)
-- Un valor que no es texto (un null de JSON) cuenta como malo.
create or replace function public.rutas_validas(j jsonb, patron text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(j) = 'object'
     and coalesce((select bool_and(jsonb_typeof(j -> e.key) = 'string' and coalesce(e.value ~ patron, false))
                     from jsonb_each_text(j) as e), true);
$$;

-- ¿Las claves de un objeto son todas códigos de idioma (o la que se diga en «extra»)?
create or replace function public.claves_de_idioma(j jsonb, extra text default '')
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(j) = 'object'
     and coalesce((select bool_and(k ~ '^[a-z]{2}$' or (extra <> '' and k = extra)) from jsonb_object_keys(j) as k), true);
$$;

-- ¿Cada PDF de un libro es el SUYO, en su idioma? { es: 'libros/<id>/es.pdf' }
create or replace function public.pdf_de_libro(libro text, pdf jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(pdf) = 'object'
     and coalesce((select bool_and(coalesce(e.value = 'libros/' || libro || '/' || e.key || '.pdf', false))
                     from jsonb_each_text(pdf) as e), true);
$$;

-- Las reglas (CHECK) las corre quien escribe, y solo escribe el admin (authenticated).
-- «anon» nunca escribe: no le hacen falta.
revoke execute on function public.rutas_validas(jsonb, text) from public, anon;
revoke execute on function public.claves_de_idioma(jsonb, text) from public, anon;
revoke execute on function public.pdf_de_libro(text, jsonb) from public, anon;
grant execute on function public.rutas_validas(jsonb, text) to authenticated;
grant execute on function public.claves_de_idioma(jsonb, text) to authenticated;
grant execute on function public.pdf_de_libro(text, jsonb) to authenticated;

-- ------------------------------------------------------------------- biblioteca
create table if not exists public.biblioteca (
  id              text primary key check (id ~ '^[a-z][a-z0-9]{0,39}$'),
  seccion         text not null check (char_length(seccion) <= 40 and seccion ~ '^[a-z][a-z0-9]*$'),
  tipo            text not null check (tipo in ('tapa-dura', 'revista', 'comic')),
  grosor          text not null default '' check (grosor in ('', 'fino', 'medio', 'grueso')),
  tono            text not null default '' check (tono in ('', 'ocre', 'salvia', 'pizarra', 'tierra', 'niebla', 'arena')),
  idioma_original text not null check (idioma_original ~ '^[a-z]{2}$'),
  titulo          jsonb not null check (public.claves_de_idioma(titulo) and titulo ? idioma_original
                                        and octet_length(titulo::text) <= 16000),
  subtitulo       jsonb not null default '{}'::jsonb check (public.claves_de_idioma(subtitulo) and octet_length(subtitulo::text) <= 24000),
  -- { idioma: 'libros/<id>/<idioma>.pdf' }: el SUYO en cada idioma, y el del original no falta
  pdf             jsonb not null check (public.claves_de_idioma(pdf) and pdf ? idioma_original
                                        and public.rutas_validas(pdf, '^libros/[a-z][a-z0-9]{0,39}/[a-z]{2}\.pdf$')
                                        and public.pdf_de_libro(id, pdf)),
  -- { idioma | 'todos': 'lomos/<id>[.<idioma>]-<azar>.png' } (PNG: la estantería mide PNG,
  -- no WebP; el trozo al azar porque el cajón «portadas» es público y el lomo de un
  -- borrador no debe poder adivinarse)
  lomo            jsonb not null default '{}'::jsonb check (public.claves_de_idioma(lomo, 'todos')
                                        and public.rutas_validas(lomo, '^lomos/[a-z][a-z0-9]{0,39}(\.[a-z]{2})?-[a-z0-9]{6,16}\.png$')),
  etiquetas       text[] not null default '{}' check (cardinality(etiquetas) <= 12 and array_position(etiquetas, null) is null
                                        and octet_length(array_to_string(etiquetas, ',')) <= 2000),
  ia              jsonb not null default '{}'::jsonb check (jsonb_typeof(ia) = 'object' and octet_length(ia::text) <= 2000),
  publicado       boolean not null default false,
  orden           integer not null default 0 check (orden between 0 and 100000),
  creado          timestamptz not null default now(),
  editado         timestamptz not null default now()
);

-- ------------------------------------------------------------------------ casas
create table if not exists public.casas (
  id              text primary key check (char_length(id) <= 40 and id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
                                          -- las secciones de la web y las páginas sueltas (data/entities.js)
                                          and id not in ('work', 'projects', 'writing', 'about', 'contact', 'direct', 'meet', 'portal', 'status')),
  clase           text not null check (clase in ('trabajo', 'proyecto')),
  name            text not null check (char_length(name) between 1 and 80),
  idioma_original text not null check (idioma_original ~ '^[a-z]{2}$'),
  role            jsonb not null default '{}'::jsonb check (public.claves_de_idioma(role) and octet_length(role::text) <= 16000),
  blurb           jsonb not null default '{}'::jsonb check (public.claves_de_idioma(blurb) and octet_length(blurb::text) <= 40000),
  tags            text[] not null default '{}' check (cardinality(tags) <= 12 and array_position(tags, null) is null
                                 and octet_length(array_to_string(tags, ',')) <= 2000),
  -- { src: 'casas/<id>/<archivo>.png|webp', w, h, scale } (el panel lo pide; null solo en un borrador viejo)
  logo            jsonb check (logo is null or (jsonb_typeof(logo) = 'object'
                                 and coalesce((logo->>'src') ~ ('^casas/' || id || '/[a-z0-9]+([.-][a-z0-9]+)*\.(png|webp)$'), false)
                                 and octet_length(logo::text) <= 500)),
  avatar          text not null default '' check (avatar = '' or avatar ~ ('^casas/' || id || '/[a-z0-9]+([.-][a-z0-9]+)*\.(png|webp)$')),
  banner          text not null default '' check (banner = '' or banner ~ ('^casas/' || id || '/[a-z0-9]+([.-][a-z0-9]+)*\.(jpg|png|webp)$')),
  works           jsonb not null default '[]'::jsonb check (jsonb_typeof(works) = 'array' and jsonb_array_length(works) <= 40
                                 and octet_length(works::text) <= 60000),
  -- { idioma: { version: 1, bloques: [...] } }: bloques del editor, NUNCA HTML
  cuerpo          jsonb not null default '{}'::jsonb check (public.claves_de_idioma(cuerpo) and octet_length(cuerpo::text) <= 2000000),
  ia              jsonb not null default '{}'::jsonb check (jsonb_typeof(ia) = 'object' and octet_length(ia::text) <= 2000),
  publicado       boolean not null default false,
  orden           integer not null default 0 check (orden between 0 and 100000),
  creado          timestamptz not null default now(),
  editado         timestamptz not null default now()
);

-- ----------------------------------------------------------------------- etapas
create table if not exists public.etapas (
  id              text primary key check (char_length(id) <= 40 and id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  cuando          text not null check (cuando ~ '^[0-9]{4}$'),
  idioma_original text not null check (idioma_original ~ '^[a-z]{2}$'),
  titulo          jsonb not null check (public.claves_de_idioma(titulo) and titulo ? idioma_original and octet_length(titulo::text) <= 12000),
  texto           jsonb not null check (public.claves_de_idioma(texto) and texto ? idioma_original and octet_length(texto::text) <= 80000),
  -- (sin «hoy»: la etapa donde termina la línea es una sola y vive en src/data/camino.js)
  ia             jsonb not null default '{}'::jsonb check (jsonb_typeof(ia) = 'object' and octet_length(ia::text) <= 2000),
  publicado       boolean not null default false,
  orden           integer not null default 0 check (orden between 0 and 100000),
  creado          timestamptz not null default now(),
  editado         timestamptz not null default now()
);

-- Las casas se piden por clase (Trabajos / Proyectos) y en su orden
create index if not exists casas_clase_orden on public.casas (clase, orden);

-- ------------------------------ lo mismo para las tres: RLS, permisos, «editado»
do $$
declare t text;
begin
  foreach t in array array['biblioteca', 'casas', 'etapas'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to anon', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('drop trigger if exists %I on public.%I', t || '_editado', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.tocar_editado()', t || '_editado', t);
    -- El admin lo puede todo (ver también los borradores)
    execute format('drop policy if exists %I on public.%I', t || '_todo_el_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()))', t || '_todo_el_admin', t);
    -- Lo publicado lo ve cualquiera (sin entrar y entrando)
    execute format('drop policy if exists %I on public.%I', t || '_leer_publicado', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (publicado)', t || '_leer_publicado', t);
  end loop;
end;
$$;

-- --------------------------------------------------------------- el almacén
-- Un cajón NUEVO y PRIVADO para los PDF de los libros: «libros». Las imágenes (lomos,
-- logos, cabeceras, las imágenes de los bloques) van en «portadas» (004), que ya es
-- público y solo acepta jpeg/png/webp, dentro de sus carpetas lomos/, casas/<id>/ y
-- bloques/<id>/. La ruta que guarda el panel empieza por la carpeta: «libros/…» es este
-- cajón; lo demás, «portadas».
insert into storage.buckets (id, name, public)
values ('libros', 'libros', false)
on conflict (id) do update set public = false;

do $$
begin
  update storage.buckets
     set file_size_limit = 52428800,
         allowed_mime_types = array['application/pdf']
   where id = 'libros';
exception when undefined_column then
  raise notice 'No pude poner los limites por SQL: ponlos en el panel (Storage → libros → Edit): 50 MB, application/pdf.';
end;
$$;

-- Solo el admin sube, cambia, borra y ve los PDF (también los de borradores).
drop policy if exists "alef_libros_admin_ver" on storage.objects;
create policy "alef_libros_admin_ver" on storage.objects
  for select to authenticated
  using (bucket_id = 'libros' and (select public.es_admin()));

drop policy if exists "alef_libros_admin_subir" on storage.objects;
create policy "alef_libros_admin_subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'libros' and (select public.es_admin()));

drop policy if exists "alef_libros_admin_cambiar" on storage.objects;
create policy "alef_libros_admin_cambiar" on storage.objects
  for update to authenticated
  using (bucket_id = 'libros' and (select public.es_admin()))
  with check (bucket_id = 'libros' and (select public.es_admin()));

drop policy if exists "alef_libros_admin_borrar" on storage.objects;
create policy "alef_libros_admin_borrar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'libros' and (select public.es_admin()));

-- La compilación (con la clave publicable, sin entrar) baja SOLO el PDF de un libro
-- PUBLICADO, y solo si esa ruta es la que el libro dice. Las páginas de esos libros ya
-- se ven en la web como imágenes; el PDF de un borrador no sale nunca.
drop policy if exists "alef_libros_leer_publicados" on storage.objects;
create policy "alef_libros_leer_publicados" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'libros'
    and exists (
      select 1 from public.biblioteca b
       where b.publicado
         -- el nombre dentro del cajón es «<id>/<idioma>.pdf», SIN «libros/» delante
         -- (src/scripts/contenido/Almacen.js → ubicacion)
         and b.id = (storage.foldername(objects.name))[1]
         and b.pdf ->> split_part(storage.filename(objects.name), '.', 1) = 'libros/' || objects.name
    )
  );
