-- ÁLEF · 001 · Perfiles y acceso
--
-- Qué hace este archivo: crea quién es quién y quién puede entrar.
--   admins        las personas que mandan. NO se puede añadir a nadie desde la
--                 página: solo desde este editor SQL (ver 900_semilla_admin).
--   perfiles      una fila por cuenta: su estado (pendiente / aprobado /
--                 rechazado). Cada persona ve la suya; el admin ve todas.
--   invitaciones  correos que el admin ya dejó aprobados de antemano.
--
-- Cómo se usa: pégalo ENTERO en Supabase → SQL Editor → Run. Se puede volver
-- a pegar sin romper nada (usa «if not exists» y «create or replace»).
--
-- REGLAS QUE NO SE ROMPEN:
--   · Toda tabla lleva «enable row level security» (RLS). Con RLS puesto y sin
--     ninguna regla que lo permita, la API devuelve CERO filas, aunque alguien
--     tenga la clave pública. Por eso la clave pública puede estar en el sitio.
--   · A los roles «anon» (sin entrar) y «authenticated» (con sesión) se les
--     quita todo y se les da SOLO lo que necesitan (privilegio mínimo).
--   · Las funciones que se saltan RLS («security definer») llevan
--     «set search_path = ''» y nombres de tabla completos (public.xxx), y se
--     les quita el permiso de ejecutar a «public»/«anon».
--   · La clave «service_role» (o «secret») NO se usa en ningún sitio de la web.
--   · En Supabase → Authentication, deja «Confirm email» ENCENDIDO si usas
--     correo y contraseña, y los registros anónimos APAGADOS. Una invitación
--     solo aprueba sola a quien entra con GOOGLE (que ya verificó su correo): a
--     quien entra con correo y contraseña lo apruebas tú, con un clic.

-- Lo que se cree DE AQUÍ EN ADELANTE en este esquema no se regala a nadie: hay
-- que dar los permisos a mano (grant) y encender RLS. Si algún día creas una
-- tabla a mano y la API dice «permission denied», es esto: falta su «grant».
-- Que la API pueda ver el esquema (lo que hay dentro sigue cerrado: grants + RLS).
grant usage on schema public to anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;

-- ------------------------------------------------------------------ admins
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  creado  timestamptz not null default now()
);

alter table public.admins enable row level security;
revoke all on table public.admins from anon, authenticated;
grant select on table public.admins to authenticated;

-- Una sola regla: cada persona puede ver si ELLA es admin. No hay regla de
-- crear, cambiar ni borrar: así nadie puede hacerse admin desde la web.
drop policy if exists admins_ver_el_propio on public.admins;
create policy admins_ver_el_propio on public.admins
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- --------------------------------------------------------------- perfiles
create table if not exists public.perfiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  correo       text not null default '',
  nombre       text not null default '' check (char_length(nombre) <= 80 and nombre !~ '[<>\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]'),
  motivo       text not null default '' check (char_length(motivo) <= 300 and motivo !~ '[<>\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]'),
  estado       text not null default 'pendiente'
                 check (estado in ('pendiente', 'aprobado', 'rechazado')),
  creado       timestamptz not null default now(),
  decidido_en  timestamptz,
  decidido_por uuid references auth.users (id) on delete set null
);

create index if not exists perfiles_estado_creado on public.perfiles (estado, creado desc);
create index if not exists perfiles_decidido_por on public.perfiles (decidido_por);

-- ------------------------------------------- funciones que miran las tablas
-- Las usan las reglas de TODAS las demás tablas. Corren con los permisos de
-- quien las creó (security definer) para poder leer admins y perfiles sin que
-- esas tablas tengan que enseñarse a nadie.

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;

create or replace function public.esta_aprobado()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles p
    where p.id = (select auth.uid()) and p.estado = 'aprobado'
  );
$$;

revoke all on function public.es_admin()      from public, anon;
revoke all on function public.esta_aprobado() from public, anon;
grant execute on function public.es_admin()      to authenticated;
grant execute on function public.esta_aprobado() to authenticated;

-- ------------------------------------------------------ reglas de perfiles
alter table public.perfiles enable row level security;
revoke all on table public.perfiles from anon, authenticated;
grant select on table public.perfiles to authenticated;
-- Cada persona SOLO puede cambiar su nombre y su motivo. El estado NO: ese
-- privilegio no se concede a nadie por la API (solo lo cambia decidir_acceso,
-- más abajo, y solo para el admin).
grant update (nombre, motivo) on table public.perfiles to authenticated;

-- Una sola regla de leer (dos reglas permisivas obligan a Postgres a mirar las dos).
drop policy if exists perfiles_ver_el_propio on public.perfiles;
drop policy if exists perfiles_ver_todos_el_admin on public.perfiles;
drop policy if exists perfiles_ver on public.perfiles;
create policy perfiles_ver on public.perfiles
  for select to authenticated
  using ((select auth.uid()) = id or (select public.es_admin()));

drop policy if exists perfiles_cambiar_el_propio on public.perfiles;
create policy perfiles_cambiar_el_propio on public.perfiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ----------------------------------------------------------- invitaciones
create table if not exists public.invitaciones (
  correo       text primary key
                 check (correo = lower(correo)
                        and char_length(correo) <= 254
                        and correo ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  invitada_por uuid default auth.uid() references auth.users (id) on delete set null,
  creada       timestamptz not null default now(),
  caduca       timestamptz not null default (now() + interval '60 days'),
  usada_en     timestamptz
);

create index if not exists invitaciones_invitada_por on public.invitaciones (invitada_por);

alter table public.invitaciones enable row level security;
revoke all on table public.invitaciones from anon, authenticated;
grant select, insert, delete on table public.invitaciones to authenticated;

drop policy if exists invitaciones_ver_el_admin on public.invitaciones;
create policy invitaciones_ver_el_admin on public.invitaciones
  for select to authenticated
  using ((select public.es_admin()));

drop policy if exists invitaciones_crear_el_admin on public.invitaciones;
create policy invitaciones_crear_el_admin on public.invitaciones
  for insert to authenticated
  with check ((select public.es_admin()));

drop policy if exists invitaciones_borrar_el_admin on public.invitaciones;
create policy invitaciones_borrar_el_admin on public.invitaciones
  for delete to authenticated
  using ((select public.es_admin()));

-- ------------------------------- al nacer una cuenta, nace su perfil (pendiente)
-- Si este disparador falla, la persona no puede ni registrarse (lo dice la
-- documentación de Supabase): por eso es corto y no hace nada más. Es una
-- función de disparador: nadie puede llamarla a mano.
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, correo, nombre, motivo)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    -- Sin «<» ni «>» (el panel los pinta como texto; esto es defensa extra), ni marcas que
    -- dan la vuelta al texto o no se ven (para que un nombre no parezca otro), y sin que el
    -- registro pueda fallar por lo que escriba la persona.
    left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'nombre',
                                 new.raw_user_meta_data ->> 'full_name',
                                 new.raw_user_meta_data ->> 'name', ''), '[<>\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]', '', 'g'), 80),
    left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'motivo', ''), '[<>\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]', '', 'g'), 300)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- «create or replace» (y no «drop» + «create»): borrar un disparador de auth.users
-- pide ser su dueño; crearlo o reemplazarlo solo pide el permiso TRIGGER.
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ------------------------------------------------ decidir quién entra (admin)
-- Es la ÚNICA manera de cambiar un estado. Comprueba que quien llama es admin,
-- que el estado es uno de los tres y que no se está decidiendo a sí mismo.
create or replace function public.decidir_acceso(p_usuario uuid, p_estado text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if p_estado is null or p_estado not in ('pendiente', 'aprobado', 'rechazado') then
    raise exception 'estado no valido' using errcode = '22023';
  end if;
  if p_usuario = (select auth.uid()) then
    raise exception 'no puedes decidir sobre tu propia cuenta' using errcode = '42501';
  end if;
  if p_estado = 'aprobado' and not exists (
       select 1 from auth.users u where u.id = p_usuario and u.email_confirmed_at is not null) then
    raise exception 'su correo aun no esta confirmado' using errcode = '22023';
  end if;
  update public.perfiles
     set estado = p_estado,
         decidido_en = now(),
         decidido_por = (select auth.uid())
   where id = p_usuario;
  if not found then
    raise exception 'esa cuenta no existe' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.decidir_acceso(uuid, text) from public, anon;
grant execute on function public.decidir_acceso(uuid, text) to authenticated;

-- ------------------------------------- reclamar una invitación (cada persona)
-- La página la llama al entrar. Si la persona entró con GOOGLE (que ya verificó
-- su correo), el correo está confirmado y el admin lo había invitado (y no ha
-- caducado ni se usó), pasa a «aprobado». Si no: no hace nada.
--   · Con correo y contraseña NO se aprueba sola, aunque esté invitada: si el ajuste
--     «Confirm email» de Auth estuviera apagado, Supabase da el correo por
--     confirmado sin comprobarlo y cualquiera podría robar una invitación. A esas
--     las apruebas tú a mano.
--   · Una cuenta rechazada no se toca.
-- Devuelve el estado en que queda la cuenta.
create or replace function public.reclamar_invitacion()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_correo    text;
  v_confirmado timestamptz;
  v_estado    text;
  v_invita    uuid;
begin
  if v_uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;

  select p.estado into v_estado from public.perfiles p where p.id = v_uid;
  if v_estado is null then
    return 'sin_perfil';
  end if;
  if v_estado <> 'pendiente' then
    return v_estado;
  end if;

  select lower(u.email), u.email_confirmed_at
    into v_correo, v_confirmado
    from auth.users u where u.id = v_uid;
  if v_correo is null or v_confirmado is null then
    return 'pendiente';
  end if;
  -- Solo aprueba sola a quien entra UNICAMENTE con Google y con ESE correo
  -- verificado por Google. Así no sirve cambiarse el correo de la cuenta al de
  -- la invitación, ni haberse registrado antes con el correo de otra persona y
  -- una clave (Supabase enlazaría luego su Google a esa cuenta).
  if not exists (select 1 from auth.identities i
                  where i.user_id = v_uid and i.provider = 'google'
                    and lower(i.identity_data->>'email') = v_correo
                    and i.identity_data->>'email_verified' = 'true')
     or exists (select 1 from auth.identities i
                 where i.user_id = v_uid and i.provider <> 'google') then
    return 'pendiente';
  end if;

  update public.invitaciones i
     set usada_en = now()
   where i.correo = v_correo and i.usada_en is null and i.caduca > now()
  returning i.invitada_por into v_invita;

  if found then
    update public.perfiles
       set estado = 'aprobado', decidido_en = now(), decidido_por = v_invita
     where id = v_uid and estado = 'pendiente';
  end if;
  -- Se devuelve el estado REAL en que quedó (si el admin la rechazó justo en ese
  -- instante, no se dice «aprobado»).
  select p.estado into v_estado from public.perfiles p where p.id = v_uid;
  return coalesce(v_estado, 'pendiente');
end;
$$;

revoke all on function public.reclamar_invitacion() from public, anon;
grant execute on function public.reclamar_invitacion() to authenticated;

-- Las cuentas que ya existieran ANTES de este archivo no tienen perfil (el
-- disparador solo trabaja con las nuevas): se les crea, pendientes.
insert into public.perfiles (id, correo)
select u.id, lower(coalesce(u.email, ''))
  from auth.users u
on conflict (id) do nothing;

-- El disparador no se llama a mano: nadie necesita permiso de ejecutarlo (el
-- permiso se comprueba al CREAR el disparador, no cada vez que se dispara).
revoke execute on function public.crear_perfil() from public, anon, authenticated;
