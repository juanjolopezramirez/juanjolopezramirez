-- ÁLEF · 004 · Almacén de archivos (portadas e imágenes, videos)
--
-- Dos cajones (buckets):
--   portadas   PÚBLICO para leer (las imágenes que salen en la página).
--   videos     PRIVADO. Solo el admin sube y lee, por ahora.
-- En los dos, SOLO el admin sube, cambia o borra.
--
-- Los límites (portadas ~5 MB y solo jpeg/png/webp; videos solo mp4/webm, con el
-- tope de tu plan) se intentan poner aquí abajo y, si no se pueden por SQL, se
-- ponen en el panel (Storage → el cajón → Edit).
-- LO QUE NO ESTÁ AQUÍ, a propósito: que los miembros aprobados vean los videos «de miembros»: eso se
-- escribe cuando se construya la sección Videos, comprobando en la
-- documentación de Supabase cómo conviven las reglas con las URL firmadas.
--
-- Requiere 001 (usa es_admin()). Se puede volver a pegar sin romper nada.

insert into storage.buckets (id, name, public)
values ('portadas', 'portadas', true),
       ('videos', 'videos', false)
on conflict (id) do update set public = excluded.public;

-- El tamaño máximo y los tipos de archivo de cada cajón. Va en un bloque aparte
-- que NO rompe el archivo si estas columnas se llamaran distinto: en ese caso
-- avisa y se ponen a mano en el panel (Storage → el cajón → Edit).
-- Nada de image/svg+xml en «portadas»: un SVG podría llevar scripts y se serviría
-- desde el dominio de Supabase.
do $$
begin
  update storage.buckets
     set file_size_limit = 5242880,
         allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
   where id = 'portadas';
  update storage.buckets
     set file_size_limit = 52428800,
         allowed_mime_types = array['video/mp4', 'video/webm']
   where id = 'videos';
exception when undefined_column then
  raise notice 'No pude poner los limites por SQL: ponlos en el panel (Storage → el cajon → Edit).';
end;
$$;

-- Un cajón público se puede LEER sin ninguna regla; subir, cambiar y borrar
-- siempre piden regla. Aquí, solo el admin.

drop policy if exists "alef_admin_ver" on storage.objects;
create policy "alef_admin_ver" on storage.objects
  for select to authenticated
  using (bucket_id in ('portadas', 'videos') and (select public.es_admin()));

drop policy if exists "alef_admin_subir" on storage.objects;
create policy "alef_admin_subir" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('portadas', 'videos') and (select public.es_admin()));

drop policy if exists "alef_admin_cambiar" on storage.objects;
create policy "alef_admin_cambiar" on storage.objects
  for update to authenticated
  using (bucket_id in ('portadas', 'videos') and (select public.es_admin()))
  with check (bucket_id in ('portadas', 'videos') and (select public.es_admin()));

drop policy if exists "alef_admin_borrar" on storage.objects;
create policy "alef_admin_borrar" on storage.objects
  for delete to authenticated
  using (bucket_id in ('portadas', 'videos') and (select public.es_admin()));
