-- =============================================================
-- La tabla de solicitudes, y lo que la protege.
--
-- Pegar entero en Supabase -> SQL Editor -> Run. Una sola vez.
--
-- LO IMPORTANTE, EN UNA FRASE: la clave anonima viaja en la pagina —esta
-- pensada para eso— asi que lo que impide que alguien LEA las solicitudes
-- no es esconder la clave, es que aqui abajo no hay ninguna politica de
-- SELECT. Con RLS encendido, lo que no tiene politica esta prohibido.
--
-- Traducido: cualquiera puede enviar, nadie puede leer. Tu las lees desde
-- el panel de Supabase, que no pasa por RLS.
--
-- CASI TODO SON RESPUESTAS CERRADAS, y esa es la razon de la tabla. Un
-- campo con cinco valores posibles se puede agrupar y ordenar: «ensename
-- las de Let Be con presupuesto alto», «cuantas van de sector publico».
-- Con tres parrafos de texto libre eso no se puede preguntar.
-- =============================================================

create table if not exists public.solicitudes (
  id           uuid        primary key default gen_random_uuid(),
  creada_en    timestamptz not null default now(),

  -- El codigo que se le enseña al enviar: JLR-7F3K9. Es lo unico con lo
  -- que se puede consultar la etapa, y no da acceso a nada mas.
  code         text        not null unique,

  -- quien escribe
  name         text        not null,
  email        text        not null,
  phone        text,
  channel      text        not null,   -- whatsapp | mail | call

  -- que pide
  line         text        not null,   -- lista: puede pedir varias a la vez
  needs        text,                   -- lista, depende de `line`
  mode         text        not null,   -- remote | onsite | hybrid
  location     text,                   -- solo si hay que desplazarse
  -- La audiencia tambien es una lista: casi nadie le vende a un solo tipo
  -- de cliente. `audience_main` es cual manda, que es lo que de verdad
  -- sirve para agrupar y ordenar. Con una sola marcada, es esa.
  audience     text        not null,   -- lista
  audience_main text       not null,   -- b2b | b2c | b2g | nonprofit | personal

  -- El presupuesto es un RANGO. Se guardan los indices de las paradas del
  -- deslizador y no las cifras: la parada 4 es el mismo escalon en las tres
  -- monedas, asi que dos solicitudes se pueden comparar aunque vengan en
  -- monedas distintas. `budget_label` es la misma cifra en letra, para
  -- leerla sin hacer cuentas. Los indices van vacios si marco «no lo se».
  budget_from  smallint,
  budget_to    smallint,
  budget_label text        not null,   -- «4 M – 20 M COP» o «tbd»
  currency     text        not null,   -- COP | USD | EUR

  timing       text        not null,   -- now | 1-3m | thisyear | exploring
  impact       text        not null,   -- company | customers | community | sector | unsure
  detail       text,                   -- lo unico abierto, y opcional

  lang         text,                   -- en que idioma llego

  -- lo que pongo yo despues, al evaluar. No hay politica de UPDATE, asi
  -- que esto solo se toca desde el panel.
  estado       text        not null default 'nueva',
  notas        text
);

alter table public.solicitudes enable row level security;

-- Por si se corre dos veces.
drop policy if exists "cualquiera puede enviar una solicitud" on public.solicitudes;

-- LA UNICA POLITICA. Insertar, y nada mas.
--
-- El `with check` no es decoracion: son los mismos limites que pone el
-- formulario, puestos donde no se pueden saltar. Un robot que hable
-- directamente con la API se salta el HTML entero; esto no se lo salta.
--
-- Y las listas de valores no estan por gusto: si manana añades una opcion
-- en enquiry.js, hay que añadirla AQUI TAMBIEN o la solicitud se rechaza
-- en silencio. Es el precio de que la base no acepte basura.
create policy "cualquiera puede enviar una solicitud"
  on public.solicitudes
  for insert
  to anon
  with check (
    char_length(code) between 8 and 12
    and code ~ '^JLR-[A-Z0-9]{6}$'
    and char_length(name)                     between 1 and 120
    and char_length(email)                    between 3 and 200
    and char_length(coalesce(phone, ''))      <= 40
    and channel  in ('whatsapp', 'mail', 'call')
    -- `line` y `needs` son listas, no valores: se comprueba el largo y no
    -- la pertenencia, porque puede pedir Let Be y Recvid a la vez.
    --
    -- EL TECHO DE `needs` NO ES REDONDO POR GUSTO. Hay 21 opciones entre las
    -- tres casas y marcarlas todas son 190 caracteres: con el limite en 200
    -- quedaban diez de margen, y la opcion numero 22 habria empezado a
    -- rechazar envios EN SILENCIO —la solicitud se va al respaldo del correo
    -- y nadie se entera—. 400 deja sitio para crecer sin volver aqui.
    and char_length(line)                     between 1 and 60
    and char_length(coalesce(needs, ''))      <= 400
    and mode     in ('remote', 'onsite', 'hybrid')
    and char_length(coalesce(location, ''))   <= 120
    and char_length(audience)                 between 1 and 80
    and audience_main in ('b2b', 'b2c', 'b2g', 'nonprofit', 'personal')
    and currency in ('COP', 'USD', 'EUR')
    and (budget_from is null or budget_from between 0 and 7)
    and (budget_to   is null or budget_to   between 0 and 7)
    and (budget_from is null or budget_to is null or budget_from <= budget_to)
    and char_length(budget_label)             between 1 and 40
    and timing   in ('now', '1-3m', 'thisyear', 'exploring')
    and impact   in ('company', 'customers', 'community', 'sector', 'unsure')
    and char_length(coalesce(detail, ''))     <= 600
    and char_length(coalesce(lang, ''))       <= 5
  );

-- Las nuevas primero, que es como se van a mirar siempre.
create index if not exists solicitudes_creada_en_idx
  on public.solicitudes (creada_en desc);


-- =============================================================
-- CONSULTAR LA ETAPA, SIN PODER LEER NADA MAS
--
-- La tabla sigue sin politica de SELECT: nadie puede leerla. Lo que se
-- expone es esta funcion, que recibe un codigo y devuelve UNA PALABRA.
--
-- `security definer` es lo que la deja saltarse RLS por dentro; el
-- `search_path` fijo es lo que impide que alguien la engañe creando
-- objetos con el mismo nombre en otro esquema. Las dos cosas van juntas o
-- la funcion es un agujero.
--
-- Aunque alguien acertara un codigo a fuerza de intentarlo, lo unico que
-- obtendria es «leida» o «aceptada». Ni el nombre, ni el presupuesto, ni
-- las notas.
-- =============================================================
create or replace function public.estado_solicitud(codigo text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select estado from public.solicitudes
  where code = upper(trim(codigo))
  limit 1;
$$;

revoke all on function public.estado_solicitud(text) from public;
grant execute on function public.estado_solicitud(text) to anon;


-- =============================================================
-- PARA MIRARLAS
--
-- Lo que da tener respuestas cerradas. Pegar en el SQL Editor:
--
--   -- por linea y presupuesto
--   select line, budget_label, count(*)
--   from solicitudes group by 1, 2 order by 3 desc;
--
--   -- las que valen la pena mirar primero. `budget_from` es un indice, no
--   -- una cifra, asi que esto vale igual en pesos, dolares o euros.
--   select creada_en, name, line, budget_label, impact, detail
--   from solicitudes
--   where estado = 'nueva' and budget_from >= 4
--   order by creada_en desc;
--
--   -- buscar una por su codigo
--   select * from solicitudes where code = 'JLR-7F3K9';
--
--   -- la diagnostica 4 del marco, en frio
--   select impact, count(*) from solicitudes group by 1 order by 2 desc;
--
--   -- por tipo de cliente principal
--   select audience_main, count(*) from solicitudes group by 1 order by 2 desc;
--
--
-- DESPUES DE CORRER ESTO
--
-- 1. Settings -> API: copia «Project URL» y la clave «anon public».
--    Van en un fichero .env en la raiz de juanjo-web:
--
--      PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
--      PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
--
--    Y en GitHub, las mismas dos como «Repository secrets» para que el
--    despliegue las tenga. Sin ellas la pagina no se rompe: el formulario
--    abre el correo con todo escrito, que es el plan de respaldo.
--
-- 2. COMPRUEBA QUE NADIE PUEDE LEER. Con la clave anonima:
--
--      curl "$URL/rest/v1/solicitudes?select=*" -H "apikey: $ANON"
--
--    Tiene que devolver [] y nunca las filas. Si devuelve filas, hay una
--    politica de SELECT de mas y hay que borrarla.
--
-- 3. QUE TE AVISE. Database -> Webhooks, un webhook de INSERT sobre esta
--    tabla apuntando a lo que uses para el correo. Sin esto las solicitudes
--    llegan bien y no te enteras hasta que entras al panel.
--
-- 4. LA PAUSA POR INACTIVIDAD. Los proyectos gratis se suspenden tras unos
--    dias sin actividad. Una solicitud que llegue con el proyecto pausado
--    no se pierde —cae en el respaldo del correo— pero confirma la politica
--    vigente antes de confiarle el canal principal.
-- =============================================================
