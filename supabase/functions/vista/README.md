# Función `vista` — el libro privado del Taller

Lo que abre un enlace `https://juanjolopezramirez.com/es/vista/#k=…`. Sin sesión: su único secreto es el enlace.

**Está escrita pero NO publicada.** Pegar `supabase/013_publicar.sql` y publicar esta función son dos pasos
que haces tú, en ese orden, cuando quieras.

## Qué hace

`POST { k }` → busca el SHA-256 del token en `taller_enlaces` (con la llave de servicio, que sale del entorno de la
función), mira que no esté apagado ni vencido, cuenta la visita y devuelve el libro: título, páginas, proporción,
texto y enlaces de cada página, y las direcciones firmadas (10 minutos) de las imágenes a 900 y 1600 px.

Todo lo que falla (mal escrito, desconocido, vencido, apagado) devuelve **la misma** respuesta:
`404 { "error": "Este enlace ya no abre" }`.

## Publicarla (tú, a mano)

```
supabase functions deploy vista --no-verify-jwt --project-ref <tu-proyecto>
```

`--no-verify-jwt` es obligatorio: quien abre el enlace no tiene sesión; con el control de JWT encendido la puerta de
Supabase le diría «no autorizado» antes de llegar a la función. El secreto del enlace es lo que protege el libro.

No hay nada que poner en secretos: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los pone Supabase solo en el entorno
de la función. **Esa llave no va nunca al repositorio ni a la web.**

`supabase/config.toml` ya dice `verify_jwt = false` para esta función (sin llaves ni id de proyecto); el
`--no-verify-jwt` del comando lo repite a propósito.

**Al publicar de verdad**, define los sitios desde los que se puede preguntar solo con el dominio real:
`supabase secrets set VISTA_ORIGENES="https://juanjolopezramirez.com"`. Sin eso valen también `www` y `localhost:4321`
(los de probar), y no tiene por qué seguir así en producción.

## Comprobarla (después de publicarla y de pegar 013)

1. En el Taller, «Compartir» → sube el PDF, crea un enlace, ábrelo en una ventana privada.
2. Apágalo en «Compartir» y vuelve a abrirlo: debe decir «Este enlace ya no abre».
3. `curl -s -X POST <url-de-la-funcion> -H 'content-type: application/json' -d '{"k":"x"}'` → 404 con el mismo mensaje.

## Límites y cosas que debes saber

- **Freno por IP, en la memoria de la función:** ~30 preguntas por minuto por IP (y otro cubo aparte para renovar las
  direcciones). Al pasarse contesta el mismo 404 de siempre. Cada instancia de la función tiene su propia cuenta y se
  reinicia al apagarse: es un freno de cortesía. **Añade también el límite de peticiones del panel de Supabase** para esta
  función; el token son 32 bytes al azar (no se adivina), pero el ruido sí se puede evitar.
- **`vistas` es aproximado:** `public.taller_contar_vista` (013) cuenta a lo más una visita por minuto y enlace; una
  apertura y su recarga son una. No guarda quién abrió, solo cuántas veces y cuándo fue la última.
- **Apagar un enlace tarda hasta 10 minutos en cerrar las imágenes ya firmadas:** quien ya lo tenía abierto sigue viendo
  las páginas que tenía hasta que venza su dirección firmada (el libro nuevo ya no abre, y renovar falla).
- **El enlace se comparte por un canal privado** (mensaje directo, correo). Quien lo tenga lo abre; la barra del
  navegador lo suelta enseguida, pero queda en lo que tú copiaste y en el historial de donde lo pegaste.
- **Límite conocido (008 borradores):** la tabla `borradores` no se ha tocado en esta etapa y no sabe de estas tablas.
