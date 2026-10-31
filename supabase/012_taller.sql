-- THE ALEF CODE · 012 · El Taller de libros
--
-- Lo pidió el fundador (2026-10-31): escribir sus libros en Developer-Mode y sacar el PDF. Todo es
-- SOLO del admin (con 006, con el código del celular). Nada de aquí se lee sin entrar y nada llega
-- a la web: el PDF se sube en «Recursos», como siempre.
--
--   taller_obras       un libro o un escrito: título, página (mm, márgenes, letra), fuentes
--   taller_capitulos   un capítulo por fila: el guardado automático solo envía el abierto
--   taller_piezas      un PDF de diseño traído de Figma: sus páginas y sus zonas
--   taller_versiones   copias del libro para volver atrás; no se editan nunca
--
-- DOS PESTAÑAS NO SE PISAN: cada fila lleva `rev`, que sube sola aquí, y `pestana`, quién guardó. El
-- panel guarda solo si `rev` sigue siendo la que leyó (src/scripts/contenido/taller/Repositorio.js).
--
-- El número 011 está reservado para el test del dominó (pendientes/tablero-y-domino).
-- Requiere 001 (es_admin()), 002 (tocar_editado()) y 006. Se puede volver a pegar sin romper nada.

-- ------------------------------------------------------------------ las tablas
create table if not exists public.taller_obras (
  id       uuid primary key default gen_random_uuid(),
  titulo   text not null check (char_length(titulo) between 1 and 200),
  idioma   text not null default 'es' check (idioma ~ '^[a-z]{2}$'),
  pagina   jsonb not null default '{}' check (jsonb_typeof(pagina) = 'object' and octet_length(pagina::text) <= 8000),
  fuentes  text[] not null default '{}' check (cardinality(fuentes) <= 40 and array_position(fuentes, null) is null and octet_length(array_to_string(fuentes, ',')) <= 2800),
  rev      integer not null default 1,
  pestana  uuid,
  creado   timestamptz not null default now(),
  editado  timestamptz not null default now()
);

create table if not exists public.taller_capitulos (
  id        uuid primary key default gen_random_uuid(),
  obra_id   uuid not null references public.taller_obras (id) on delete cascade,
  orden     integer not null default 0 check (orden between 0 and 100000),
  titulo    text not null default '' check (char_length(titulo) <= 300),
  contenido jsonb not null default '{}' check (jsonb_typeof(contenido) = 'object' and octet_length(contenido::text) <= 3500000),
  letras    integer not null default 0 check (letras >= 0),
  rev       integer not null default 1,
  pestana   uuid,
  creado    timestamptz not null default now(),
  editado   timestamptz not null default now()
);
create index if not exists taller_capitulos_obra on public.taller_capitulos (obra_id, orden);

create table if not exists public.taller_piezas (
  id        uuid primary key default gen_random_uuid(),
  obra_id   uuid not null references public.taller_obras (id) on delete cascade,
  nombre    text not null default '' check (char_length(nombre) <= 160),
  estado    text not null default 'procesando' check (estado in ('procesando', 'lista')),
  pdf       text not null check (pdf ~ '^taller/' and char_length(pdf) <= 200),
  ancho_mm  numeric not null check (ancho_mm > 0),
  alto_mm   numeric not null check (alto_mm > 0),
  dpi       integer not null default 300 check (dpi between 1 and 600),
  ajuste    text not null default 'contener' check (ajuste in ('contener', 'cubrir')),
  paginas   jsonb not null default '[]' check (jsonb_typeof(paginas) = 'array' and jsonb_array_length(paginas) <= 200 and octet_length(paginas::text) <= 4000000),
  rev       integer not null default 1,
  pestana   uuid,
  creado    timestamptz not null default now(),
  editado   timestamptz not null default now()
);
create index if not exists taller_piezas_obra on public.taller_piezas (obra_id);

create table if not exists public.taller_versiones (
  id      uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.taller_obras (id) on delete cascade,
  motivo  text not null check (motivo in ('auto', 'manual', 'reemplazar', 'restaurar', 'conflicto')),
  nombre  text not null default '' check (char_length(nombre) <= 120),
  huella  text not null,
  copia   jsonb not null check (octet_length(copia::text) <= 40000000 and jsonb_typeof(copia) = 'object'
                                and coalesce(jsonb_typeof(copia -> 'obra'), '') = 'object'
                                and coalesce(jsonb_typeof(copia -> 'capitulos'), '') = 'array'
                                and coalesce(jsonb_typeof(copia -> 'piezas'), '') = 'array'),
  creado  timestamptz not null default now()
);
create index if not exists taller_versiones_obra on public.taller_versiones (obra_id, creado desc);

-- ---------------------------------------------------------- `rev` sube sola
-- Un capítulo solo sube si cambia lo escrito: reordenar desde otra pestaña no es un conflicto.
create or replace function public.taller_subir_rev()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Dos IF y no uno con «and»: plpgsql prepara la condicion entera, y en las otras dos tablas
  -- `new.contenido` no existe.
  if tg_table_name = 'taller_capitulos' then
    if new.contenido is not distinct from old.contenido and new.titulo is not distinct from old.titulo then
      new.rev := old.rev;
      return new;
    end if;
  end if;
  new.rev := old.rev + 1;
  return new;
end;
$$;
revoke execute on function public.taller_subir_rev() from public, anon, authenticated;

-- ------------------------------------------------- lo mismo para las cuatro
do $$
declare t text;
begin
  foreach t in array array['taller_obras', 'taller_capitulos', 'taller_piezas', 'taller_versiones'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, delete on table public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_todo_el_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()))', t || '_todo_el_admin', t);
  end loop;
  -- Las versiones nunca se editan: las demás, sí
  foreach t in array array['taller_obras', 'taller_capitulos', 'taller_piezas'] loop
    execute format('grant update on table public.%I to authenticated', t);
    execute format('drop trigger if exists %I on public.%I', t || '_editado', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.tocar_editado()', t || '_editado', t);
    execute format('drop trigger if exists %I on public.%I', t || '_rev', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.taller_subir_rev()', t || '_rev', t);
  end loop;
end;
$$;

-- --------------------------------------------------------- copiar y restaurar
-- La copia se arma en el servidor. Una automática sin cambios no se repite, y de cada motivo quedan las
-- 30 últimas, menos las manuales. Devuelve true si guardó.
create or replace function public.taller_copia(p_obra uuid, p_motivo text, p_nombre text default '')
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_copia jsonb;
  v_huella text;
begin
  if not public.es_admin() then
    raise exception 'solo el admin' using errcode = '42501';
  end if;
  select jsonb_build_object(
           'obra', to_jsonb(o) - 'rev' - 'pestana' - 'editado',
           'capitulos', coalesce((select jsonb_agg(to_jsonb(c) - 'rev' - 'pestana' - 'editado' order by c.orden, c.id) from public.taller_capitulos c where c.obra_id = o.id), '[]'::jsonb),
           'piezas', coalesce((select jsonb_agg(to_jsonb(p) - 'rev' - 'pestana' - 'editado' order by p.id) from public.taller_piezas p where p.obra_id = o.id), '[]'::jsonb))
    into v_copia
    from public.taller_obras o
   where o.id = p_obra;
  if v_copia is null then
    raise exception 'no existe' using errcode = 'P0002';
  end if;
  if octet_length(v_copia::text) > 40000000 then
    raise exception 'copia muy grande' using errcode = 'TA001';
  end if;
  v_huella := md5(v_copia::text);
  if p_motivo = 'auto' and exists (
    select 1 from (select v.huella from public.taller_versiones v where v.obra_id = p_obra order by v.creado desc limit 1) u
     where u.huella = v_huella) then
    return false;
  end if;
  insert into public.taller_versiones (obra_id, motivo, nombre, huella, copia)
  values (p_obra, p_motivo, coalesce(p_nombre, ''), v_huella, v_copia);
  -- De cada motivo quedan las 30 últimas. Las que guardó el fundador a mano no se tocan nunca.
  delete from public.taller_versiones v
   using (select x.id, row_number() over (partition by x.motivo order by x.creado desc, x.id) n
            from public.taller_versiones x
           where x.obra_id = p_obra and x.motivo <> 'manual') r
   where v.id = r.id and r.n > 30;
  return true;
end;
$$;

-- Volver a una copia: antes guarda lo de ahora, y todo pasa junto o no pasa. `pestana` queda vacía:
-- así la pestaña que guardó antes no cree que esto lo escribió ella, y recibe el aviso de conflicto
-- en vez de sobrescribir lo restaurado.
create or replace function public.taller_restaurar(p_version uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_obra uuid;
  v jsonb;
begin
  if not public.es_admin() then
    raise exception 'solo el admin' using errcode = '42501';
  end if;
  select x.obra_id, x.copia into v_obra, v from public.taller_versiones x where x.id = p_version;
  if v_obra is null then
    raise exception 'no existe' using errcode = 'P0002';
  end if;
  perform public.taller_copia(v_obra, 'restaurar', '');

  update public.taller_obras o
     set titulo = v -> 'obra' ->> 'titulo',
         idioma = v -> 'obra' ->> 'idioma',
         pagina = v -> 'obra' -> 'pagina',
         fuentes = array(select jsonb_array_elements_text(v -> 'obra' -> 'fuentes')),
         pestana = null
   where o.id = v_obra;

  delete from public.taller_capitulos c
   where c.obra_id = v_obra
     and c.id not in (select (e ->> 'id')::uuid from jsonb_array_elements(v -> 'capitulos') e);
  insert into public.taller_capitulos (id, obra_id, orden, titulo, contenido, letras)
  select (e ->> 'id')::uuid, v_obra, (e ->> 'orden')::integer, e ->> 'titulo', e -> 'contenido', (e ->> 'letras')::integer
    from jsonb_array_elements(v -> 'capitulos') e
  on conflict (id) do update
     set orden = excluded.orden, titulo = excluded.titulo, contenido = excluded.contenido, letras = excluded.letras, pestana = null;

  delete from public.taller_piezas p
   where p.obra_id = v_obra
     and p.id not in (select (e ->> 'id')::uuid from jsonb_array_elements(v -> 'piezas') e);
  insert into public.taller_piezas (id, obra_id, nombre, estado, pdf, ancho_mm, alto_mm, dpi, ajuste, paginas)
  select (e ->> 'id')::uuid, v_obra, e ->> 'nombre', e ->> 'estado', e ->> 'pdf', (e ->> 'ancho_mm')::numeric,
         (e ->> 'alto_mm')::numeric, (e ->> 'dpi')::integer, e ->> 'ajuste', e -> 'paginas'
    from jsonb_array_elements(v -> 'piezas') e
  on conflict (id) do update
     set nombre = excluded.nombre, estado = excluded.estado, pdf = excluded.pdf, ancho_mm = excluded.ancho_mm,
         alto_mm = excluded.alto_mm, dpi = excluded.dpi, ajuste = excluded.ajuste, paginas = excluded.paginas, pestana = null;
end;
$$;

-- Reordenar de una vez: o queda todo o nada, y solo se toca lo que cambió de lugar.
create or replace function public.taller_ordenar(p_obra uuid, p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.taller_capitulos c
     set orden = (s.i - 1)::integer
    from unnest(p_ids) with ordinality s(id, i)
   where c.id = s.id and c.obra_id = p_obra and c.orden <> (s.i - 1)::integer;
$$;

revoke execute on function public.taller_copia(uuid, text, text) from public, anon;
revoke execute on function public.taller_restaurar(uuid) from public, anon;
revoke execute on function public.taller_ordenar(uuid, uuid[]) from public, anon;
grant execute on function public.taller_copia(uuid, text, text) to authenticated;
grant execute on function public.taller_restaurar(uuid) to authenticated;
grant execute on function public.taller_ordenar(uuid, uuid[]) to authenticated;

-- --------------------------------------------------------------- el almacén
-- Un cajón PRIVADO: taller/<obra>/… Las imágenes del libro no pasan por el cajón público «portadas»:
-- un capítulo sin publicar no debe tener direcciones que se puedan abrir.
insert into storage.buckets (id, name, public)
values ('taller', 'taller', false)
on conflict (id) do update set public = false;

do $$
begin
  update storage.buckets
     set file_size_limit = 52428800,
         allowed_mime_types = array['application/pdf', 'image/webp', 'image/jpeg', 'image/png']
   where id = 'taller';
exception when undefined_column then
  raise notice 'No pude poner los limites por SQL: ponlos en el panel (Storage → taller → Edit): 50 MB, pdf, webp, jpeg, png.';
end;
$$;

drop policy if exists "alef_taller_admin_ver" on storage.objects;
create policy "alef_taller_admin_ver" on storage.objects
  for select to authenticated
  using (bucket_id = 'taller' and (select public.es_admin()));

drop policy if exists "alef_taller_admin_subir" on storage.objects;
create policy "alef_taller_admin_subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'taller' and (select public.es_admin()));

drop policy if exists "alef_taller_admin_cambiar" on storage.objects;
create policy "alef_taller_admin_cambiar" on storage.objects
  for update to authenticated
  using (bucket_id = 'taller' and (select public.es_admin()))
  with check (bucket_id = 'taller' and (select public.es_admin()));

drop policy if exists "alef_taller_admin_borrar" on storage.objects;
create policy "alef_taller_admin_borrar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'taller' and (select public.es_admin()));
