// LA FUNCIÓN DE BORDE `vista` · el libro privado del Taller (etapa A3a)
//
// Quien abre un enlace /es/vista/#k=<secreto> no entra al portal ni habla con la base: le pregunta a ESTA función,
// que es lo único que lee `taller_enlaces` y `taller_ediciones` sin ser el admin (supabase/013_publicar.sql: nada
// de eso se le da a `anon`).
//
//   POST { k }                 → 200 { titulo, idioma, paginas, ratio, blando, hojas, urls: { w900, w1600 }, segundos }
//   POST { k, renovar: true }  → lo mismo, SIN contar otra visita (el lector pide direcciones nuevas antes de que
//                                 venzan las de diez minutos)
//   cualquier otra cosa        → 404 { error: "Este enlace ya no abre" }
//
// UNA SOLA RESPUESTA MALA para todo: mal escrito, desconocido, vencido, apagado, edición que ya no está, método
// equivocado, cuerpo enorme. Quien adivina no aprende nada: ni siquiera si un enlace existió.
//
// VERIFY_JWT DEBE ESTAR APAGADO. Quien abre el enlace no tiene sesión: su único secreto es el enlace. Con el
// control de JWT encendido (lo normal), la puerta de Supabase le diría «no autorizado» antes de llegar aquí.
// Se apaga al publicar la función (ver README.md): `supabase functions deploy vista --no-verify-jwt`.
//
// LA LLAVE DE SERVICIO sale del ENTORNO de la función (SUPABASE_SERVICE_ROLE_KEY, que Supabase pone solo).
// No está en este repositorio, ni en la web, ni en ningún archivo. Aquí no se escribe ni se imprime el token.
//
// No se escribe en ningún registro: lo único que se anota es la cuenta de visitas del enlace (`vistas`, `ultima_vista`),
// aproximada: a lo más una por minuto y enlace (public.taller_contar_vista, supabase/013_publicar.sql).
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import {
  CUERPO_MALO, CUERPO_MAX, ORIGENES_POR_DEFECTO, SEGUNDOS_URL, cabeceras, crearLimitador, cuerpoBueno,
  huellaBytea, ipDe, leerToken, rutasDe, vigente
} from './nucleo.js';

const URL_BASE = Deno.env.get('SUPABASE_URL') ?? '';
const LLAVE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
// Opcional: VISTA_ORIGENES="https://juanjolopezramirez.com,https://otro.example" (si no, la lista de nucleo.js)
const propios = (Deno.env.get('VISTA_ORIGENES') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const ORIGENES = propios.length ? propios : ORIGENES_POR_DEFECTO;

// Un freno por IP, en la memoria de este aislado (ver nucleo.js): una cuenta para abrir y otra aparte para renovar
const frenoAbrir = crearLimitador();
const frenoRenovar = crearLimitador();

const sb = createClient(URL_BASE, LLAVE, { auth: { persistSession: false, autoRefreshToken: false } });

const mala = (origen: string | null) => new Response(CUERPO_MALO, { status: 404, headers: cabeceras(origen, ORIGENES) });

// Lee el cuerpo sin pasar de `tope` bytes (un cuerpo sin largo declarado tampoco puede ser enorme)
async function leerCuerpo(req: Request, tope: number): Promise<string | null> {
  const dicho = Number(req.headers.get('content-length') ?? 0);
  if (dicho > tope) return null;
  if (!req.body) return '';
  const lector = req.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.length;
    if (total > tope) { try { await lector.cancel(); } catch { /* nada */ } return null; }
    partes.push(value);
  }
  const junto = new Uint8Array(total);
  let en = 0;
  for (const p of partes) { junto.set(p, en); en += p.length; }
  return new TextDecoder().decode(junto);
}

Deno.serve(async (req: Request) => {
  const origen = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabeceras(origen, ORIGENES) });
  if (req.method !== 'POST') return mala(origen);
  try {
    const texto = await leerCuerpo(req, CUERPO_MAX);
    if (texto === null) return mala(origen);
    let cuerpo: { k?: unknown; renovar?: unknown };
    try { cuerpo = JSON.parse(texto); } catch { return mala(origen); }
    if (!cuerpo || typeof cuerpo !== 'object') return mala(origen);

    // Mas de ~30 preguntas por minuto desde una misma IP: el mismo 404 de siempre
    const ip = ipDe(req.headers);
    if (!(cuerpo.renovar === true ? frenoRenovar : frenoAbrir)(ip)) return mala(origen);

    // Rápido y sin tocar la base: lo que no es un token ni se busca
    const bytes = leerToken(cuerpo.k);
    if (!bytes) return mala(origen);
    const huella = await huellaBytea(bytes);

    const { data, error } = await sb
      .from('taller_enlaces')
      .select('id, revocado, vence, taller_ediciones(titulo, idioma, paginas, ratio, blando, carpeta, hojas)')
      .eq('hash', huella)
      .maybeSingle();
    const edicion = data && (Array.isArray(data.taller_ediciones) ? data.taller_ediciones[0] : data.taller_ediciones);
    if (error || !data || !edicion || !vigente(data, Date.now())) return mala(origen);

    const rutas = rutasDe(edicion.carpeta, edicion.paginas);
    if (!rutas) return mala(origen);
    const todas = [...rutas[900], ...rutas[1600]];
    const { data: firmadas, error: malFirma } = await sb.storage.from('taller').createSignedUrls(todas, SEGUNDOS_URL);
    if (malFirma || !firmadas || firmadas.length !== todas.length || firmadas.some((f) => f.error || !f.signedUrl)) return mala(origen);
    const n = edicion.paginas;
    const urls = { 900: firmadas.slice(0, n).map((f) => f.signedUrl), 1600: firmadas.slice(n).map((f) => f.signedUrl) };

    // La visita se cuenta una vez abierto (no al renovar las direcciones), por la funcion de 013 que no cuenta mas de una por
    // minuto y enlace: `vistas` es APROXIMADO. Si falla la cuenta, el libro abre igual.
    if (cuerpo.renovar !== true) {
      try { await sb.rpc('taller_contar_vista', { p_enlace: data.id }); } catch { /* el libro abre igual */ }
    }
    return new Response(cuerpoBueno(edicion, urls), { status: 200, headers: cabeceras(origen, ORIGENES) });
  } catch {
    // Sin detalles: ni el token ni el error de la base se escriben en ningún registro
    return mala(origen);
  }
});
