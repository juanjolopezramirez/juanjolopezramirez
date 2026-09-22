-- La tabla donde aterriza cada recorrido de «Dar el primer paso».
--
-- Se llena desde src/server/recorrido.js, que hoy no esta enchufado: el
-- sitio es estatico. Mientras tanto el navegador encola los recorridos y
-- los reintenta. Ver RUTA.md, seccion «El backend».
--
-- No hay ni un dato personal aqui, y es a proposito: el dato personal
-- aparece cuando la persona escribe por WhatsApp, y entonces lo tiene
-- WhatsApp, no esta tabla.

create table recorrido (
  id          bigserial primary key,

  -- Version del formato. El dia que cambien las cartas, los niveles o el
  -- calculo, esto sube y los recorridos viejos siguen siendo legibles sin
  -- mezclarse con los nuevos.
  version     smallint    not null default 2,

  rama        text        not null check (rama in ('mi', 'negocio', 'marca')),
  baraja      text        not null check (baraja in ('empresa', 'persona')),
  voz         text        not null check (voz in ('tu', 'reflexivo')),
  idioma      text        not null check (idioma in ('es', 'en', 'pt', 'fr', 'it')),

  -- JUEGO 1, el eje de la urgencia: las cartas que se mandaron a la
  -- derecha, en el orden en que salieron. El orden importa: dice si se
  -- cansaron a mitad del mazo.
  urgentes    text[]      not null,

  -- JUEGO 2, el eje de la importancia: donde quedo cada carta.
  --   { "e-conocer": "primero", "e-chatbot": "noVa", ... }
  niveles     jsonb       not null,

  paso        text        not null check (paso in ('alef', 'mem', 'tav')),
  lectura     text        not null check (lectura in ('emet', 'met', 'equilibrio')),

  creado      timestamptz not null default now()
);

create index recorrido_paso_lectura on recorrido (paso, lectura);
create index recorrido_creado       on recorrido (creado desc);
create index recorrido_urgentes     on recorrido using gin (urgentes);
create index recorrido_niveles      on recorrido using gin (niveles);


-- ============================================================
-- Lo que se le pregunta a la tabla
-- ============================================================

-- Que deseo aprieta mas, por rama
select rama, carta, count(*)
from recorrido, unnest(urgentes) as carta
group by rama, carta
order by count(*) desc;

-- Donde se pierde de verdad la gente
select paso, lectura, count(*)
from recorrido
group by paso, lectura
order by count(*) desc;

-- EL CUADRANTE QUE ROBA LOS DIAS: cartas que marcaron urgentes y despues
-- mandaron abajo en la lista. Con doscientos recorridos, esto dice que es
-- lo que de verdad le esta quitando las horas a la gente.
select carta, count(*)
from recorrido, unnest(urgentes) as carta
where niveles ->> carta in ('algunDia', 'noVa')
group by carta
order by count(*) desc;
