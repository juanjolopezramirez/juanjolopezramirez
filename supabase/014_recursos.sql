-- THE ALEF CODE · 014 · Publicar un libro del Taller en Recursos (etapa A3b)
--
-- Lo pidió el fundador (2026-11-14): publicar la última edición de un libro del Taller en Recursos, con una copia
-- del PDF. La fila del libro (biblioteca, publicado = true) y el PDF (cajón `libros`, libros/<id>/<idioma>-<azar>.pdf)
-- los escribe el panel con las reglas de siempre (007 y 008). Aquí solo se cuida el VÍNCULO: qué libro de Recursos
-- es de qué libro del Taller (`taller_obras.libro_id`, que 013 creó vacío).
--
--   · un libro de Recursos pertenece a UN solo libro del Taller (índice único parcial);
--   · `libro_id` se pone una vez y, publicado el libro, no cambia (la dirección /es/writing/#id es suya para siempre);
--   · ponerlo NO cuenta como un cambio del libro: `rev` no sube, así la pestaña que tiene el libro abierto no
--     recibe un «conflicto» al guardar.
--
-- SIN LLAVE FORÁNEA a `biblioteca` (a propósito: resuelve el TODO de 013). El libro de Recursos se puede quitar de la
-- web o borrar desde Developer-Mode sin tocar el libro del Taller, y borrar el libro del Taller NO quita el de
-- Recursos (es una copia aparte). Quién puede usar un id lo comprueba el panel (taller/Recursos.js) antes de
-- copiar, y el índice de abajo es la última cerradura entre dos libros del Taller.
--
-- NO hay funciones `security definer` nuevas y nada se le da a `anon`.
-- Requiere 012 y 013. Se puede volver a pegar sin romper nada. Pégalo tú en Supabase → SQL Editor; el 990 lo
-- comprueba después (consultas 28 a 30).

-- (a) un libro de Recursos, un solo libro del Taller
create unique index if not exists taller_obras_libro_id_unico on public.taller_obras (libro_id) where libro_id is not null;

-- (b) `rev` no sube si lo único que cambia es `libro_id`. La comparación es sobre TODA la fila (menos libro_id, rev y
-- editado): así, si algún día el libro gana otra columna, un cambio en ella sí cuenta. Lo demás, igual que en 012.
-- OJO CON EL ORDEN: pega SIEMPRE 014 DESPUÉS de 012. Pegar 012 otra vez vuelve a poner la `taller_subir_rev` de antes
-- (la que no conoce `libro_id`) y la pestaña abierta daría «conflicto» al publicar; el 990 (consulta 30) lo detecta.
create or replace function public.taller_subir_rev()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Dos IF y no uno con «and»: plpgsql prepara la condicion entera, y en las otras dos tablas
  -- `new.contenido` (o `new.libro_id`) no existe.
  if tg_table_name = 'taller_capitulos' then
    if new.contenido is not distinct from old.contenido and new.titulo is not distinct from old.titulo then
      new.rev := old.rev;
      return new;
    end if;
  end if;
  if tg_table_name = 'taller_obras' then
    if new.libro_id is distinct from old.libro_id
       and (to_jsonb(new) - 'libro_id' - 'rev' - 'editado') = (to_jsonb(old) - 'libro_id' - 'rev' - 'editado') then
      new.rev := old.rev;
      return new;
    end if;
  end if;
  new.rev := old.rev + 1;
  return new;
end;
$$;
revoke execute on function public.taller_subir_rev() from public, anon, authenticated;

-- (c) `libro_id`, una vez PUBLICADO, no cambia ni se borra: la dirección /es/writing/#id es del libro. Pero mientras el
-- libro de Recursos no exista (ni publicado, ni quitado, ni en borrador), se puede cambiar o quitar: así un fallo a
-- mitad de publicar no deja una dirección fija para siempre (el panel suelta el vínculo si publicar falla).
create or replace function public.taller_libro_fijo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.libro_id is not null and new.libro_id is distinct from old.libro_id then
    if exists (select 1 from public.biblioteca b where b.id = old.libro_id)
       or exists (select 1 from public.borradores d where d.tabla = 'biblioteca' and d.id = old.libro_id) then
      raise exception 'la direccion del libro en Recursos no cambia' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.taller_libro_fijo() from public, anon, authenticated;

drop trigger if exists taller_obras_libro_fijo on public.taller_obras;
create trigger taller_obras_libro_fijo before update on public.taller_obras
  for each row execute function public.taller_libro_fijo();
