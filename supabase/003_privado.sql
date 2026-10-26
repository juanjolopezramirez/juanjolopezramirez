-- ÁLEF · 003 · Lo privado (diario, hábitos, crecimiento)
--
-- Tu lugar para el journaling, el habit tracker y todo lo de tu crecimiento
-- personal. Por ahora es SOLO del admin (como en el panel, donde estas
-- secciones solo las ve el admin): un miembro aprobado no puede escribir aquí.
-- Si algún día quieres abrirlo a cada miembro, se cambia es_admin() por
-- esta_aprobado() en las reglas de abajo (cada uno vería solo lo suyo).
--
-- Cada fila es de quien la escribe (user_id = auth.uid()): ni siendo admin se
-- leen filas ajenas desde la página. (Quien maneja
-- el proyecto desde el panel de Supabase sí puede ver las tablas en crudo, y
-- ese eres tú; si algún día quieres que ni eso sea posible, se puede cifrar el
-- diario en el navegador con una frase tuya. Se deja para después.)
--
-- Son ESQUELETOS: cuando me expliques la estructura, se añaden campos con un
-- archivo nuevo (007_...). Requiere 001 y 002 (usa es_admin() y tocar_editado()).
-- Se puede volver a pegar sin romper nada.

-- ------------------------------------------------------------------- diario
create table if not exists public.diario (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha    date not null default current_date,
  texto    text not null default '' check (char_length(texto) <= 20000),
  creado   timestamptz not null default now(),
  editado  timestamptz not null default now()
);
create index if not exists diario_user_fecha on public.diario (user_id, fecha desc);

-- ------------------------------------------------------------------ hábitos
create table if not exists public.habitos (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre   text not null check (char_length(nombre) between 1 and 80),
  activo   boolean not null default true,
  orden    integer not null default 0,
  creado   timestamptz not null default now(),
  -- Para que un registro no pueda colgarse del hábito de OTRA persona:
  unique (id, user_id)
);
create index if not exists habitos_user on public.habitos (user_id, orden);

create table if not exists public.registros_habito (
  habito_id uuid not null,
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha     date not null default current_date,
  hecho     boolean not null default true,
  primary key (habito_id, fecha),
  foreign key (habito_id, user_id) references public.habitos (id, user_id) on delete cascade
);
create index if not exists registros_habito_user_fecha on public.registros_habito (user_id, fecha desc);

-- -------------------------------------------------------------- crecimiento
create table if not exists public.crecimiento (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo     text not null default 'nota' check (char_length(tipo) between 1 and 40),
  titulo   text not null default '' check (char_length(titulo) <= 200),
  cuerpo   text not null default '' check (char_length(cuerpo) <= 20000),
  fecha    date not null default current_date,
  creado   timestamptz not null default now(),
  editado  timestamptz not null default now()
);
create index if not exists crecimiento_user_fecha on public.crecimiento (user_id, fecha desc);

-- ----------------------- las cuatro: RLS, permisos mínimos, y una sola regla
-- «la fila es tuya y eres el admin». Sin sesión, no se ve ni se escribe nada.
-- Un miembro aprobado, pendiente o rechazado, tampoco.
do $$
declare t text;
begin
  foreach t in array array['diario', 'habitos', 'registros_habito', 'crecimiento'] loop
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

-- «editado» solo en las que lo llevan
drop trigger if exists diario_editado on public.diario;
create trigger diario_editado before update on public.diario
  for each row execute function public.tocar_editado();

drop trigger if exists crecimiento_editado on public.crecimiento;
create trigger crecimiento_editado before update on public.crecimiento
  for each row execute function public.tocar_editado();
