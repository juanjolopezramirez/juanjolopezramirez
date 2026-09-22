import { RAMA, esRama, cartasElegidas, diagnosticar } from '../data/ruta/diagnostico.js';
import { NIVEL } from '../data/ruta/juegos.js';
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

const MAX_URGENTES = 20;   /* la baraja entera, por si alguien marca todo */
const MAX_NIVELES = 8;
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

  const { rama, idioma, urgentes, niveles } = cuerpo ?? {};

  if (!esRama(rama)) return no('Rama desconocida.');
  if (!LANGS.includes(idioma)) return no('Idioma desconocido.');

  /* JUEGO 1 — las que se mandaron a la derecha. */
  if (!Array.isArray(urgentes) || urgentes.length > MAX_URGENTES) {
    return no(`Las urgentes van en una lista de como mucho ${MAX_URGENTES}.`);
  }
  if (urgentes.some((c) => typeof c !== 'string')) return no('Las cartas van por su id.');
  if (new Set(urgentes).size !== urgentes.length) return no('Hay una carta repetida.');
  if (cartasElegidas(rama, urgentes).length !== urgentes.length) {
    return no('Alguna carta no es de esa baraja.');
  }

  /* JUEGO 2 — donde quedo cada una. */
  if (!niveles || typeof niveles !== 'object' || Array.isArray(niveles)) {
    return no('Los niveles van en un objeto.');
  }
  const ids = Object.keys(niveles);
  if (!ids.length || ids.length > MAX_NIVELES) return no(`Entre 1 y ${MAX_NIVELES} cartas en la lista.`);
  if (cartasElegidas(rama, ids).length !== ids.length) return no('Alguna carta de la lista no es de esa baraja.');
  if (ids.some((id) => !NIVEL[niveles[id]])) return no('Hay un nivel que no existe.');

  /* EL PASO Y LA LECTURA SE RECALCULAN AQUI. Lo que llegue en el cuerpo
     diciendo en que paso quedo alguien se ignora: si no, los recorridos
     que van a servir para decidir no valdrian nada. */
  const dx = diagnosticar(rama, urgentes, niveles);
  if (!dx || !PASOS.includes(dx.paso)) return no('No se pudo calcular el paso.', 500);
  const { paso, lectura } = dx;

  const fila = {
    version: 1,
    rama,
    voz: RAMA[rama].voz,
    baraja: RAMA[rama].baraja,
    idioma,
    urgentes,
    niveles,
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
