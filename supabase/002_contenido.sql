-- ÁLEF · 002 · Contenido público
--
-- Lo que escribes tú (el admin) y se enseña en la página: entradas del blog,
-- libros, tarjetas de Proyectos y de Trabajos, y videos.
--
-- Estas tablas son ESQUELETOS: tienen lo mínimo para que las secciones del panel
-- existan y se puedan llenar. Cuando me expliques la estructura definitiva se
-- añaden campos con un archivo NUEVO (007_...); este no se vuelve a editar.
--
-- Requiere haber pegado antes 001_perfiles_y_acceso.sql (usa es_admin() y
-- esta_aprobado()). Se puede volver a pegar sin romper nada.
--
-- Quién ve y quién escribe:
--   · Cualquiera (incluso sin entrar) ve lo que tiene «publicado = true».
--   · Los videos pueden ser de tres tipos: público, solo para miembros
--     aprobados, o privado (solo tú).
--   · SOLO el admin crea, cambia o borra. Nadie más.

-- RUTAS Y ENLACES: lo que acompaña a una imagen o a un video solo puede ser
--   · un enlace https://…        · o una ruta de este sitio / del almacén (sin «:»,
--     sin «//» al principio), nunca «javascript:», «data:» ni «http:».
-- Solo escribe el admin, así que esto es defensa en profundidad: la página
-- además valida otra vez y pinta todo como texto.

-- Pone la fecha de «editado» sola cada vez que se cambia una fila.
create or replace function public.tocar_editado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.editado := now();
  return new;
end;
$$;

revoke execute on function public.tocar_editado() from public, anon, authenticated;

-- ----------------------------------------------------------------- entradas
create table if not exists public.entradas (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique
                check (char_length(slug) between 1 and 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo      text not null check (char_length(titulo) between 1 and 200),
  resumen     text not null default '' check (char_length(resumen) <= 500),
  -- El cuerpo es una LISTA de bloques (párrafo, título, cita, imagen, enlace),
  -- nunca HTML. La página los pinta con createElement/textContent.
  cuerpo      jsonb not null default '[]'::jsonb check (jsonb_typeof(cuerpo) = 'array'),
  idioma      text not null default 'es' check (idioma in ('es', 'en', 'pt', 'fr', 'it')),
  portada     text check (portada is null or (char_length(portada) <= 300
                  and portada ~ '^(https://[^[:space:]]+|/?[A-Za-z0-9_.-][A-Za-z0-9_./-]*)$')),
  publicado   boolean not null default false,
  publicado_en timestamptz,
  creado      timestamptz not null default now(),
  editado     timestamptz not null default now()
);

-- ------------------------------------------------------------------- libros
create table if not exists public.libros (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique
                check (char_length(slug) between 1 and 40 and slug ~ '^[a-z][a-z0-9]*$'),
  titulo      text not null check (char_length(titulo) between 1 and 200),
  subtitulo   text not null default '' check (char_length(subtitulo) <= 300),
  tema        text not null default '' check (char_length(tema) <= 60),
  idiomas     text[] not null default '{es}' check (idiomas <@ array['es', 'en', 'pt', 'fr', 'it']),
  tono        text check (tono is null or tono in ('ocre', 'salvia', 'pizarra', 'tierra', 'niebla', 'arena')),
  portada     text check (portada is null or (char_length(portada) <= 300
                  and portada ~ '^(https://[^[:space:]]+|/?[A-Za-z0-9_.-][A-Za-z0-9_./-]*)$')),
  pdf         text check (pdf is null or (char_length(pdf) <= 300
                  and pdf ~ '^(https://[^[:space:]]+|/?[A-Za-z0-9_.-][A-Za-z0-9_./-]*)$')),
  publicado   boolean not null default false,
  creado      timestamptz not null default now(),
  editado     timestamptz not null default now()
);

-- ----------------------------------------------------------------- tarjetas
-- Las tarjetas de Proyectos y de Trabajos (las casas con las que he caminado).
create table if not exists public.tarjetas (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('proyecto', 'trabajo')),
  titulo      text not null check (char_length(titulo) between 1 and 200),
  linea       text not null default '' check (char_length(linea) <= 400),
  -- Solo enlaces http, https o mailto (la misma regla de tools/books.py).
  enlace      text check (enlace is null or (char_length(enlace) <= 500 and enlace ~* '^(https?://|mailto:)')),
  imagen      text check (imagen is null or (char_length(imagen) <= 300
                  and imagen ~ '^(https://[^[:space:]]+|/?[A-Za-z0-9_.-][A-Za-z0-9_./-]*)$')),
  orden       integer not null default 0,
  publicado   boolean not null default false,
  creado      timestamptz not null default now(),
  editado     timestamptz not null default now()
);

-- ------------------------------------------------------------------- videos
create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null check (char_length(titulo) between 1 and 200),
  -- «ref» es la ruta dentro del almacén (storage) o el id del video (youtube, vimeo).
  fuente      text not null check (fuente in ('storage', 'youtube', 'vimeo')),
  ref         text not null check (char_length(ref) between 1 and 300
                  and (fuente <> 'youtube' or ref ~ '^[A-Za-z0-9_-]{11}$')
                  and (fuente <> 'vimeo' or ref ~ '^[0-9]+(/[A-Za-z0-9]+)?$')
                  and (fuente <> 'storage' or ref ~ '^[A-Za-z0-9_.-][A-Za-z0-9_./-]*$')),
  visibilidad text not null default 'privado' check (visibilidad in ('publico', 'miembros', 'privado')),
  orientacion text not null default 'vertical' check (orientacion in ('vertical', 'horizontal')),
  segundos    integer check (segundos is null or segundos between 0 and 86400),
  publicado   boolean not null default false,
  creado      timestamptz not null default now(),
  editado     timestamptz not null default now()
);

-- ------------------------------ lo mismo para las cuatro: RLS, permisos, aviso
do $$
declare t text;
begin
  foreach t in array array['entradas', 'libros', 'tarjetas', 'videos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to anon', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('drop trigger if exists %I on public.%I', t || '_editado', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.tocar_editado()', t || '_editado', t);
    -- El admin lo puede todo (ver también lo que aun no está publicado)
    execute format('drop policy if exists %I on public.%I', t || '_todo_el_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()))', t || '_todo_el_admin', t);
  end loop;
end;
$$;

-- Lo publicado lo ve cualquiera (sin entrar y entrando)
drop policy if exists entradas_leer_publicado on public.entradas;
create policy entradas_leer_publicado on public.entradas
  for select to anon, authenticated using (publicado);

drop policy if exists libros_leer_publicado on public.libros;
create policy libros_leer_publicado on public.libros
  for select to anon, authenticated using (publicado);

drop policy if exists tarjetas_leer_publicado on public.tarjetas;
create policy tarjetas_leer_publicado on public.tarjetas
  for select to anon, authenticated using (publicado);

-- Los videos: sin entrar, solo los públicos; entrando, los públicos y (si estás
-- aprobado) los de miembros. Son DOS reglas porque quien no ha entrado no tiene
-- permiso para llamar a esta_aprobado(). Los privados solo los ve el admin.
drop policy if exists videos_leer_publicos on public.videos;
create policy videos_leer_publicos on public.videos
  for select to anon using (publicado and visibilidad = 'publico');

drop policy if exists videos_leer_miembros on public.videos;
create policy videos_leer_miembros on public.videos
  for select to authenticated
  using (publicado and (visibilidad = 'publico'
                        or (visibilidad = 'miembros' and (select public.esta_aprobado()))));
