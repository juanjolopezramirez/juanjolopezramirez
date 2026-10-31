-- THE ALEF CODE · 010 · La piedra angular de un eje es UNA DE SUS TRES ÁREAS
--
-- Lo pidió el fundador (2026-10-30): «no tengo por qué escribir los dominios, ejes o áreas: deben ser
-- opciones múltiples para seleccionar». En 009 la piedra era un texto libre; ahora es el id de un área
-- del propio eje (El Lazo: intimate, root o tribe; ...). La lista es la de src/data/portal/tablero.js
-- (tools/test-portal.mjs vigila que sean idénticas).
--
-- Requiere 009. Se puede volver a pegar sin romper nada. Si hubiera filas viejas con texto libre, esta
-- regla las rechazaría: se borran antes (009 se aplicó el 2026-10-30 y estaba vacía).

delete from public.tablero_piedras
 where not (
    (eje = 'center' and piedra in ('essence', 'course', 'meaning'))
    or
    (eje = 'bond' and piedra in ('intimate', 'root', 'tribe'))
    or
    (eje = 'terrain' and piedra in ('pulse', 'figure', 'refuge'))
    or
    (eje = 'base' and piedra in ('vocation', 'reserve', 'rhythm'))
  );

alter table public.tablero_piedras drop constraint if exists tablero_piedras_piedra_es_un_area;
alter table public.tablero_piedras add constraint tablero_piedras_piedra_es_un_area
  check (
    (eje = 'center' and piedra in ('essence', 'course', 'meaning'))
    or
    (eje = 'bond' and piedra in ('intimate', 'root', 'tribe'))
    or
    (eje = 'terrain' and piedra in ('pulse', 'figure', 'refuge'))
    or
    (eje = 'base' and piedra in ('vocation', 'reserve', 'rhythm'))
  );

-- (la regla de 009 de que tenga entre 1 y 80 letras y no esté en blanco se queda: es más ancha, no estorba)
