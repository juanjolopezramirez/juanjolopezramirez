-- THE ALEF CODE · 013 · Compartir un libro del Taller con un enlace privado
--
-- Lo pidió el fundador (2026-11-14, etapa A3a): que alguien abra un libro del Taller con un enlace, pase las
-- páginas como en Recursos, sin entrar, y que el enlace venza o él lo apague.
--
--   taller_ediciones   una EDICIÓN: el PDF que sacó del Taller, vuelto imágenes de página (900 y 1600 px) en el
--                      cajón privado «taller», con el texto y los enlaces de cada página. No se edita nunca.
--   taller_enlaces     un ENLACE a una edición: solo se guarda la HUELLA (SHA-256) del secreto, nunca el secreto.
--                      Vence a los 7, 30 o 90 días (nunca «para siempre»). Se puede apagar, y no se vuelve a encender.
--
-- QUIÉN LEE ESTO. Solo el admin (con 006, con el código del celular). NADA se le da a `anon`: quien abre el enlace
-- no habla con la base. Habla con la función de borde `vista` (supabase/functions/vista), que usa la llave de
-- servicio DESDE SU ENTORNO (nunca está en este repositorio ni en la web), busca la huella, mira que no esté
-- apagado ni vencido, cuenta la visita y firma las direcciones de las imágenes por diez minutos.
-- Aquí NO hay funciones `security definer`.
--
-- Requiere 001 (es_admin()), 006, 007 (casas) y 012 (taller_obras y el cajón «taller»). Se puede volver a pegar
-- sin romper nada. Pégalo tú en Supabase → SQL Editor; el 990 lo comprueba después.

-- ------------------------------------------------------------------ la edición
create table if not exists public.taller_ediciones (
  id       uuid primary key default gen_random_uuid(),
  obra_id  uuid not null references public.taller_obras (id) on delete cascade,
  titulo   text not null check (char_length(titulo) between 1 and 200),
  idioma   text not null default 'es' check (idioma ~ '^[a-z]{2}$'),
  paginas  integer not null check (paginas between 1 and 300),
  -- ancho / alto de la hoja (la proporción del libro: el lector arma el libro con ella)
  ratio    numeric not null check (ratio > 0.2 and ratio < 5),
  -- tapa dura (tapa y contratapa rígidas, con cartón) o pasta blanda (revista): como en Recursos
  blando   boolean not null default true,
  -- las imágenes: taller/<obra>/ediciones/<id>/p001-900.webp y p001-1600.webp, y el PDF que se subió
  carpeta  text not null check (carpeta = 'taller/' || obra_id || '/ediciones/' || id || '/'),
  pdf      text not null check (pdf = carpeta || 'original.pdf'),
  -- [{ text, links?: [{ x, y, w, h, href | page }] }, …]: lo mismo que el pages.json de Recursos
  hojas    jsonb not null check (jsonb_typeof(hojas) = 'array' and jsonb_array_length(hojas) = paginas
                                 and octet_length(hojas::text) <= 4000000),
  creado   timestamptz not null default now()
);
create index if not exists taller_ediciones_obra on public.taller_ediciones (obra_id, creado desc);

-- ------------------------------------------------------------------ el enlace
create table if not exists public.taller_enlaces (
  id          uuid primary key default gen_random_uuid(),
  edicion_id  uuid not null references public.taller_ediciones (id) on delete cascade,
  -- SHA-256 de los 32 bytes del secreto: lo único que se guarda de él
  hash        bytea not null unique check (octet_length(hash) = 32),
  nombre      text not null default '' check (char_length(nombre) <= 80),
  creado      timestamptz not null default now(),
  vence       timestamptz not null check (vence > creado and vence <= creado + interval '90 days'),
  revocado    boolean not null default false,
  vistas      integer not null default 0 check (vistas >= 0),
  ultima_vista timestamptz
);
create index if not exists taller_enlaces_edicion on public.taller_enlaces (edicion_id, creado desc);

-- Al nacer: la hora y los contadores los pone la base (no el navegador, que puede tener el reloj torcido), y nunca
-- vence mas alla de 90 dias. Sin `vence` no se crea (no se inventa una fecha). La regla de arriba lo vuelve a exigir.
create or replace function public.taller_enlace_nuevo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.creado := now();
  new.vistas := 0;
  new.ultima_vista := null;
  new.revocado := false;
  if new.vence is null then
    raise exception 'vence es obligatorio' using errcode = '23502';
  end if;
  new.vence := least(new.vence, new.creado + interval '90 days');
  return new;
end;
$$;

-- Al cambiar: un enlace apagado no se vuelve a encender (si se filtro, sigue muerto). Este disparador corre para
-- TODOS los `update`, tambien los de la llave de servicio; lo unico que impide es pasar `revocado` de true a false.
-- Quien cambia que: el admin solo `revocado` (permiso de columna, abajo) y la llave de servicio solo las visitas.
create or replace function public.taller_enlace_cambia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.revocado and not new.revocado then
    raise exception 'un enlace apagado no se enciende' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.taller_enlace_nuevo() from public, anon, authenticated;
revoke execute on function public.taller_enlace_cambia() from public, anon, authenticated;

drop trigger if exists taller_enlaces_nuevo on public.taller_enlaces;
create trigger taller_enlaces_nuevo before insert on public.taller_enlaces
  for each row execute function public.taller_enlace_nuevo();
drop trigger if exists taller_enlaces_cambia on public.taller_enlaces;
create trigger taller_enlaces_cambia before update on public.taller_enlaces
  for each row execute function public.taller_enlace_cambia();

-- ------------------------------------------------- lo mismo para las dos: solo el admin
do $$
declare t text;
begin
  foreach t in array array['taller_ediciones', 'taller_enlaces'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, delete on table public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_todo_el_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()))', t || '_todo_el_admin', t);
  end loop;
end;
$$;
-- Las ediciones no se editan nunca (se hace otra). De un enlace, el admin solo cambia si está apagado.
grant update (revocado) on table public.taller_enlaces to authenticated;

-- ------------------------------------------------- el libro sabe de qué libro de Recursos viene
-- (para la etapa siguiente: publicar en Recursos). Vacío por ahora.
-- TODO A3b: sin llave foranea a `biblioteca` a proposito (el libro de Recursos puede no existir todavia). Cuando se
-- publique en Recursos hay que decidir si se une a `biblioteca (id)` y que pasa al borrar uno de los dos.
alter table public.taller_obras add column if not exists libro_id text;
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.taller_obras'::regclass and conname = 'taller_obras_libro_id_check') then
    alter table public.taller_obras add constraint taller_obras_libro_id_check
      check (libro_id is null or (char_length(libro_id) <= 40 and libro_id ~ '^[a-z][a-z0-9]*$'));
  end if;
end;
$$;

-- ------------------------------------------------- dos direcciones más son del sitio
-- /es/vista/ (el libro privado) y /es/actividad/ (la etapa siguiente) no pueden ser el nombre de una casa:
-- la casa taparía la página. Es la misma lista de src/scripts/contenido/Casa.js (RESERVADOS) y de 007.
do $$
begin
  if to_regclass('public.casas') is not null then
    alter table public.casas drop constraint if exists casas_id_check;
    alter table public.casas add constraint casas_id_check
      check (char_length(id) <= 40 and id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
             and id not in ('work', 'projects', 'writing', 'about', 'contact', 'direct', 'meet', 'portal', 'status', 'vista', 'actividad'));
  end if;
end;
$$;

-- ------------------------------------------------- la funcion de borde `vista` (llave de servicio)
-- Lee las dos tablas y cuenta visitas; NADA mas. Los permisos de tabla se dan de forma explicita: no se confia en los
-- permisos por defecto del proyecto.
grant select on public.taller_ediciones, public.taller_enlaces to service_role;
grant update (vistas, ultima_vista) on public.taller_enlaces to service_role;

-- Cuenta UNA visita, y no mas de una por minuto y enlace: la cuenta es aproximada (una vista y su recarga son una).
-- SECURITY INVOKER: la llama la funcion de borde con la llave de servicio, nadie mas puede ejecutarla.
create or replace function public.taller_contar_vista(p_enlace uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.taller_enlaces e
     set vistas = e.vistas + 1, ultima_vista = now()
   where e.id = p_enlace
     and (e.ultima_vista is null or e.ultima_vista < now() - interval '60 seconds');
$$;
revoke execute on function public.taller_contar_vista(uuid) from public, anon, authenticated;
grant execute on function public.taller_contar_vista(uuid) to service_role;
