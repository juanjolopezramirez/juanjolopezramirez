-- THE ALEF CODE · 009 · El Tablero de Fraterni
--
-- Lo pidió el fundador (2026-10-30). Dos tablas, SOLO del admin (como el diario de 003: cada fila es de
-- quien la escribe, y además hay que ser admin, que con 006 pide el código del celular):
--
--   tablero_lecturas   una por DOMINIO y por SEMANA: «cargué mi cruz» (true) o «no cargué mi cruz»
--                      (false), sin medios, con una nota de qué se movió. La semana es su LUNES.
--   tablero_piedras    la PIEDRA ANGULAR de cada eje con su fecha: cambia con la etapa y con la
--                      persona (en el Lazo puede ser la pareja o los padres). La vigente es la de
--                      `desde` más reciente; las anteriores quedan como historia.
--
-- Los 60 dominios (4 ejes × 3 áreas × 5) NO viven aquí: están en src/data/portal/tablero.js. La base solo
-- acepta sus nombres (la lista de abajo es idéntica a la del catálogo: tools/test-portal.mjs lo vigila) y
-- NO acepta el Amor ni los principios como casilla: no son casillas.
--
-- Requiere 001 (es_admin()) y 002 (tocar_editado()). Se puede volver a pegar sin romper nada.

-- ---------------------------------------------------------------- lecturas
create table if not exists public.tablero_lecturas (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  semana   date not null check (extract(isodow from semana) = 1),
  clave    text not null check (clave in (
    'identity', 'paradigms', 'non-negotiables', 'consistency', 'transparency',
    'direction', 'milestones', 'horizon', 'filters', 'execution',
    'core-meaning', 'solitude', 'vigilance', 'legacy', 'foundation',
    'alignment', 'fidelity', 'vulnerability', 'physical-honor', 'convergence',
    'jurisdiction', 'kinship-connection', 'sovereignty', 'resolution', 'lineage-culture',
    'circle-depth', 'allegiance', 'asymmetry-balance', 'the-council', 'synergy',
    'fuel', 'motion', 'sleep', 'stress-load', 'maintenance',
    'grooming', 'presentation', 'posture', 'vessel-respect', 'projection',
    'order', 'cleanliness', 'habitat', 'aesthetics', 'ergonomics',
    'positioning', 'mastery', 'drive', 'fulfillment', 'contribution',
    'inflow', 'retention', 'multiplication', 'liabilities', 'stability',
    'allocation', 'immersion', 'cadence', 'vitality', 'recovery'
  )),
  cargue   boolean not null,
  nota     text not null default '' check (char_length(nota) <= 500),
  creado   timestamptz not null default now(),
  editado  timestamptz not null default now(),
  unique (user_id, semana, clave)
);
create index if not exists tablero_lecturas_clave on public.tablero_lecturas (user_id, clave, semana desc);

-- ------------------------------------------------------------------ piedras
create table if not exists public.tablero_piedras (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  eje      text not null check (eje in ('center', 'bond', 'terrain', 'base')),
  piedra   text not null check (char_length(piedra) between 1 and 80),
  desde    date not null,
  creado   timestamptz not null default now(),
  unique (user_id, eje, desde)
);
create index if not exists tablero_piedras_eje on public.tablero_piedras (user_id, eje, desde desc);

-- Las reglas que se añadieron despues, CON NOMBRE y fuera de create table: asi se ponen aunque la tabla ya
-- existiera (create table if not exists no toca una tabla hecha) y volver a pegar no falla.
alter table public.tablero_lecturas drop constraint if exists tablero_lecturas_semana_rango;
alter table public.tablero_lecturas add constraint tablero_lecturas_semana_rango
  check (semana >= date '2020-01-06' and semana <= date '2100-01-01');
alter table public.tablero_piedras drop constraint if exists tablero_piedras_desde_rango;
alter table public.tablero_piedras add constraint tablero_piedras_desde_rango
  check (desde >= date '2020-01-06' and desde <= date '2100-01-01');
alter table public.tablero_piedras drop constraint if exists tablero_piedras_no_vacia;
alter table public.tablero_piedras add constraint tablero_piedras_no_vacia
  check (btrim(piedra) <> '');

-- ------------------------------------------------- lo mismo para las dos
do $$
declare t text;
begin
  foreach t in array array['tablero_lecturas', 'tablero_piedras'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_solo_lo_mio', t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      'using (user_id = (select auth.uid()) and (select public.es_admin())) '
      'with check (user_id = (select auth.uid()) and (select public.es_admin()))',
      t || '_solo_lo_mio', t);
  end loop;
end;
$$;

drop trigger if exists tablero_lecturas_editado on public.tablero_lecturas;
create trigger tablero_lecturas_editado before update on public.tablero_lecturas
  for each row execute function public.tocar_editado();
