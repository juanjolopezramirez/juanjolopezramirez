-- ÁLEF · 005 · Un índice que faltaba
--
-- registros_habito cuelga de habitos por (habito_id, user_id) y esa pareja no
-- tenía índice propio (lo marcó el Performance Advisor de Supabase). Con él,
-- borrar un hábito no recorre todos los registros. Requiere 003.
-- Se puede volver a pegar sin romper nada.

create index if not exists registros_habito_habito_user
  on public.registros_habito (habito_id, user_id);
