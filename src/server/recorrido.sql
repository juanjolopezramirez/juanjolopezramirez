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

  -- Version del formato. El dia que cambien las cartas o el calculo, esto
  -- sube y los recorridos viejos siguen siendo legibles sin mezclarse.
  version     smallint    not null default 1,

  rama        text        not null check (rama in ('mi', 'negocio', 'marca')),
  baraja      text        not null check (baraja in ('empresa', 'persona')),
  voz         text        not null check (voz in ('tu', 'reflexivo')),
  idioma      text        not null check (idioma in ('es', 'en', 'pt', 'fr', 'it')),

  -- Los ids de las cartas, en el orden en que se eligieron. El orden
  -- importa: dice por que ronda se abandona o se cambia de idea.
  cartas      text[]      not null check (array_length(cartas, 1) between 1 and 6),

  paso        text        not null check (paso in ('alef', 'mem', 'tav')),
  lectura     text        not null check (lectura in ('emet', 'met', 'equilibrio')),

  creado      timestamptz not null default now()
);

-- Las dos preguntas que se van a hacer siempre: que deseo aparece mas, y
-- en que paso se pierde la gente.
create index recorrido_paso_lectura on recorrido (paso, lectura);
create index recorrido_creado       on recorrido (creado desc);
create index recorrido_cartas       on recorrido using gin (cartas);


-- ============================================================
-- Las dos preguntas que se van a hacer siempre
-- ============================================================

-- Que deseo aparece mas, por rama
select rama, carta, count(*)
from recorrido, unnest(cartas) as carta
group by rama, carta
order by count(*) desc;

-- Donde se pierde de verdad la gente
select paso, lectura, count(*)
from recorrido
group by paso, lectura
order by count(*) desc;
