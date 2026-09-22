import { RAMA, esRama, cartasElegidas, pasoDe, lecturaDe } from '../data/ruta/diagnostico.js';
import { PASOS } from '../data/ruta/pasos.js';
import { LANGS } from '../i18n/ui.js';

/* DONDE ATERRIZA CADA RECORRIDO.

   ESTE SITIO ES ESTATICO. Se construye entero y se sirve desde GitHub
   Pages, donde no corre codigo de servidor.

   POR ESO ESTE FICHERO NO VIVE EN `src/pages/`. Puesto alli, Astro ve un
   endpoint que pide servidor y la construccion entera se cae con
   NoAdapterInstalled — probado—. Aqui no lo ve nadie y el sitio compila
   igual.

   COMO SE ENCHUFA, el dia que haya donde:

     1. `npm i @astrojs/<el-adaptador>` y ponerlo en astro.config.mjs.
     2. Mover este fichero a `src/pages/api/recorrido.js` y arreglar las
        tres rutas de los imports: `../data/` pasa a `../../data/`.
     3. Poner `RECOLECTOR_URL` —y `RECOLECTOR_TOKEN` si hace falta— en las
        variables de entorno del despliegue.
     4. En scripts/ruta.js, poner `RECOLECTOR` apuntando a `/api/recorrido`.

   Mientras tanto no se pierde nada: el guion del navegador manda a la
   direccion que tenga configurada y, si no hay ninguna o falla, deja el
   recorrido en una cola en el dispositivo y lo reintenta la proxima vez.

   `prerender = false` es lo que dice «esto no es una pagina, es codigo que
   corre».

   QUE SE GUARDA Y QUE NO. Rama, cartas, paso, lectura, idioma y fecha. Ni
   nombre, ni correo, ni telefono, ni nada que identifique: el dato personal
   entra cuando la persona escribe por WhatsApp, y entonces lo tiene
   WhatsApp, no esta tabla.

   NO SE CONFIA EN LO QUE LLEGA. El paso y la lectura se vuelven a calcular
   aqui desde las cartas. Si alguien manda «paso: tav» a mano, se ignora: lo
   que se guarda es lo que de verdad dicen las cartas, o los doscientos
   recorridos que van a servir para decidir no valdrian nada. */

export const prerender = false;

const MAX_CARTAS = 6;
const RECOLECTOR = import.meta.env.RECOLECTOR_URL ?? process.env.RECOLECTOR_URL ?? '';

const no = (motivo, estado = 400) =>
  new Response(JSON.stringify({ ok: false, motivo }), {
    status: estado,
    headers: { 'content-type': 'application/json' }
  });

export async function POST({ request }) {
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return no('El cuerpo no es JSON.');
  }

  const { rama, idioma, cartas } = cuerpo ?? {};

  if (!esRama(rama)) return no('Rama desconocida.');
  if (!LANGS.includes(idioma)) return no('Idioma desconocido.');
  if (!Array.isArray(cartas) || !cartas.length || cartas.length > MAX_CARTAS) {
    return no(`Entre 1 y ${MAX_CARTAS} cartas.`);
  }
  if (cartas.some((c) => typeof c !== 'string')) return no('Las cartas van por su id.');
  if (new Set(cartas).size !== cartas.length) return no('Hay una carta repetida.');

  /* Las cartas tienen que existir en la baraja de esa rama. */
  const elegidas = cartasElegidas(rama, cartas);
  if (elegidas.length !== cartas.length) return no('Alguna carta no es de esa baraja.');

  const paso = pasoDe(elegidas);
  const lectura = lecturaDe(elegidas);
  if (!PASOS.includes(paso)) return no('No se pudo calcular el paso.', 500);

  const fila = {
    version: 1,
    rama,
    voz: RAMA[rama].voz,
    baraja: RAMA[rama].baraja,
    idioma,
    cartas,
    paso,
    lectura,
    creado: new Date().toISOString()
  };

  /* Sin recolector configurado el recorrido no se tira: se contesta que no
     se guardo, y el navegador lo deja en su cola para reintentarlo. */
  if (!RECOLECTOR) {
    return new Response(JSON.stringify({ ok: true, guardado: false, motivo: 'Sin recolector configurado.' }), {
      status: 202,
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const r = await fetch(RECOLECTOR, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(import.meta.env.RECOLECTOR_TOKEN ? { authorization: `Bearer ${import.meta.env.RECOLECTOR_TOKEN}` } : {})
      },
      body: JSON.stringify(fila)
    });
    if (!r.ok) return no('El recolector no lo aceptó.', 502);
  } catch {
    return no('No se pudo hablar con el recolector.', 502);
  }

  return new Response(JSON.stringify({ ok: true, guardado: true }), {
    status: 201,
    headers: { 'content-type': 'application/json' }
  });
}

/* Un GET aqui no devuelve recorridos. Se leen en la base, no por la web. */
export function GET() {
  return no('Este endpoint solo recibe.', 405);
}
