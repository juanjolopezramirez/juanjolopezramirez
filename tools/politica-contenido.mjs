/* LA POLITICA DE CONTENIDO (CSP) de todo el sitio (2026-10-26, la pidio el
   fundador: «que no intercepten ni hagan ingenieria inversa»).

   Que hace: cada pagina publicada lleva, nada mas empezar su <head>, una regla
   para el navegador que dice QUE puede ejecutar y DE DONDE puede cargar cosas.
   Si alguien lograra colar un guion en la pagina (lo que se llama XSS: la forma
   real de robar la sesion de quien entro al portal), el navegador se NEGARIA a
   correrlo. No esconde el codigo (eso no es posible en una web) ni impide abrir
   las herramientas del navegador: impide que codigo AJENO corra aqui.

     guiones    solo los del propio sitio (/_astro/…) y los que van escritos
                dentro de la pagina, cada uno por su HUELLA (sha256): si cambia
                una letra, ya no corre. Las huellas se calculan aqui, pagina por
                pagina, al terminar la compilacion. Nada de 'unsafe-inline' ni
                'unsafe-eval'. El unico manejador escrito en el HTML permitido es
                el de las letras de Google (`onload="this.media='all'"`).
     estilos    los del sitio, los que van dentro de cada pagina (el sitio los
                mete enteros en el HTML a proposito: astro.config.mjs) y la hoja
                de Google Fonts. Un estilo colado no ejecuta nada.
     letras     el sitio y fonts.gstatic.com.
     conexiones el sitio y TU proyecto de Supabase (sale de PUBLIC_SUPABASE_URL;
                sin el, solo el sitio).
     marcos     solo el reproductor de YouTube sin cookies (los tres videos de
                Piezas, que site.js abre al pulsarlos). Si algun dia se mete otra
                pagina ajena, se añade aqui (MARCOS) o el navegador no la abre.
     objetos    ninguno (object-src 'none'); <base> y formularios solo hacia el sitio.

   SEGURO: si una pagina trae un manejador en linea que no es el permitido
   (onclick="…" y compañia), la compilacion se PARA: con esta politica no
   funcionaria, y es mejor saberlo aqui que en la web publicada.

   Va en una etiqueta <meta>, porque GitHub Pages no deja poner cabeceras. Por eso
   no lleva `frame-ancestors` (las <meta> lo ignoran): el panel ya se niega a
   abrirse dentro de un marco ajeno (panel.js, entrar.js). */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MANEJADOR_PERMITIDO = "this.media='all'";
export const MARCOS = ['https://www.youtube-nocookie.com'];
/* El navegador calcula la huella con los saltos de linea ya en LF: aqui igual. */
const huella = (texto) => `'sha256-${createHash('sha256').update(texto.replace(/\r\n?/g, '\n'), 'utf8').digest('base64')}'`;
/* Lo que NO se ejecuta (datos). Todo lo demas se trata como guion y lleva su huella. */
const DATOS = /^(application\/json|application\/ld\+json)$/i;

/* La politica para UNA pagina (su HTML ya compilado). Devuelve el HTML con la <meta>
   puesta. Lanza si la pagina no se puede proteger con seguridad. */
export function ponerPolitica(html, { supabase = '' } = {}) {
  const guiones = new Set();
  const pares = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  /* Si la cuenta de aperturas no cuadra con los pares, la lectura de aqui y la del
     navegador podrian no coincidir: mejor parar. */
  if (pares.length !== (html.match(/<script\b/gi) || []).length) throw new Error('etiquetas <script> que no se dejan leer con seguridad');
  for (const m of pares) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;                             // de fuera: lo cubre 'self'
    const tipo = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
    if (tipo && DATOS.test(tipo)) continue;                              // datos: no se ejecutan
    if (/<!--|<script/i.test(m[2])) throw new Error('un guion en linea con «<!--» o «<script» dentro: el navegador lo leeria distinto');
    guiones.add(huella(m[2]));
  }
  /* Los manejadores en linea (onclick=…), con cualquier comilla, fuera de guiones y estilos. */
  const sinCuerpos = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const manejadores = [];
  for (const [etiqueta] of sinCuerpos.matchAll(/<[a-z][^>]*>/gi)) {
    for (const m of etiqueta.matchAll(/\son[a-z]+\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) manejadores.push(m[1] ?? m[2] ?? m[3]);
  }
  const raros = manejadores.filter((h) => h !== MANEJADOR_PERMITIDO);
  if (raros.length) throw new Error(`manejador en linea que la politica bloquearia: ${JSON.stringify(raros[0]).slice(0, 80)}`);

  const conexiones = ["'self'"];
  if (supabase) conexiones.push(supabase, supabase.replace(/^https:/, 'wss:'));
  const reglas = [
    "default-src 'self'",
    `script-src 'self' ${[...guiones].join(' ')}${manejadores.length ? ` 'unsafe-hashes' ${huella(MANEJADOR_PERMITIDO)}` : ''}`.trim(),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "media-src 'self'",
    `connect-src ${conexiones.join(' ')}`,
    `frame-src ${MARCOS.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests'
  ];
  const meta = `<meta http-equiv="Content-Security-Policy" content="${reglas.join('; ')}">`;
  if (html.includes('http-equiv="Content-Security-Policy"')) throw new Error('la pagina ya trae una politica');
  /* Justo despues de <meta charset>: la politica solo vale para lo que viene DESPUES.
     Las paginas de redireccion de Astro (/direct/) no lo traen: ahi va tras el doctype. */
  let nuevo = html.replace(/<meta charset="[^"]*">/i, (m) => m + meta);
  if (nuevo === html) nuevo = html.replace(/^<!doctype html>/i, (m) => m + meta);
  if (nuevo === html) throw new Error('no encontre donde poner la politica');
  return nuevo;
}

async function paginas(dir) {
  const salida = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const r = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...await paginas(r));
    else if (e.name.endsWith('.html')) salida.push(r);
  }
  return salida;
}

/* La integracion de Astro: al terminar de compilar, a cada pagina su politica. */
export function politicaDeContenido({ supabase = '' } = {}) {
  return {
    name: 'politica-de-contenido',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const raiz = fileURLToPath(dir);
        const lista = await paginas(raiz);
        for (const f of lista) {
          try {
            await writeFile(f, ponerPolitica(await readFile(f, 'utf8'), { supabase }));
          } catch (e) {
            throw new Error(`\n\n  POLITICA DE CONTENIDO: ${path.relative(raiz, f)}: ${e.message}\n`);
          }
        }
        logger.info(`politica de contenido puesta en ${lista.length} paginas`);
      }
    }
  };
}
