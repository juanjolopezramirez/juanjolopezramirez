/* LA PREGUNTA a la funcion de borde `vista` (supabase/functions/vista). Aparte de vista.js para poder probarla en Node
   con un `fetch` de mentira (tools/test-taller.mjs).

   Devuelve
     { ok: true, datos }   la funcion contesto con el libro
     null                  la funcion dijo 404: el enlace ya no abre (el mismo 404 para todo: mal escrito, vencido, apagado…)
     { red: true }         NO se pudo preguntar: sin red, tiempo agotado, un fallo del servidor, una respuesta rota o enorme.
                           No es culpa del enlace, y la pagina lo dice distinto. */
export const ESPERA_MS = 15000;
export const TOPE_RESPUESTA = 6 * 1024 * 1024;         // 300 paginas con sus dos direcciones firmadas ocupan unos 200 KB

export async function preguntar({ url, clave }, token, renovar, f = (...a) => fetch(...a)) {
  const ctl = new AbortController();
  const reloj = setTimeout(() => ctl.abort(), ESPERA_MS);
  try {
    const r = await f(`${url}/functions/v1/vista`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: clave },
      body: JSON.stringify(renovar ? { k: token, renovar: true } : { k: token }),
      cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: ctl.signal
    });
    if (r.status === 404) return null;
    if (!r.ok) return { red: true };
    const largo = Number(r.headers.get('content-length') || 0);
    if (largo > TOPE_RESPUESTA) return { red: true };
    const texto = await r.text();
    if (texto.length > TOPE_RESPUESTA) return { red: true };
    return { ok: true, datos: JSON.parse(texto) };
  } catch (e) {
    return { red: true };
  } finally {
    clearTimeout(reloj);
  }
}
