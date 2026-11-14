/* LA FUNCION DE BORDE `vista`, EJECUTADA DE VERDAD (sin Deno ni Supabase): se carga supabase/functions/vista/index.ts tal
   cual, con un `Deno` de mentira y un cliente de Supabase de mentira que guarda las filas en memoria. Se comprueba lo
   que importa: que TODO fallo da la MISMA respuesta (cuerpo, codigo y cabeceras), que un enlace bueno entrega el libro y
   cuenta UNA visita, y que renovar las direcciones no cuenta otra.
     node tools/test-vista.mjs     (tambien lo corre tools/test-taller.mjs) */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { huella } from '../src/scripts/contenido/taller/Enlaces.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* `npm:@supabase/supabase-js@…` → el cliente de mentira */
register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(s, c, n) {
  if (s.startsWith('npm:@supabase/supabase-js')) return { url: 'data:text/javascript,' + encodeURIComponent('export const createClient = (...a) => globalThis.__crearCliente(...a);'), shortCircuit: true };
  return n(s, c);
}`));

const bd = { enlaces: [], firma: 'bien', actualizaciones: [], consultas: [], rpcs: [], reloj: () => Date.now() };
globalThis.__bd = bd;
globalThis.__crearCliente = () => ({
  from(tabla) {
    const q = { tabla, filtros: {}, accion: 'select' };
    const api = {
      select() { return api; },
      update(v) { q.accion = 'update'; q.valores = v; return api; },
      eq(k, v) { q.filtros[k] = v; return api; },
      async rpc() { return null; },
      async maybeSingle() {
        bd.consultas.push({ tabla, filtros: { ...q.filtros } });
        if (bd.error) return { data: null, error: { message: 'boom' } };
        const f = bd.enlaces.find((e) => e.hash === q.filtros.hash);
        return { data: f ? { id: f.id, revocado: f.revocado, vence: f.vence, taller_ediciones: f.edicion } : null, error: null };
      },
      then(ok, mal) {
        if (q.accion === 'update') {
          const f = bd.enlaces.find((e) => e.id === q.filtros.id && e.vistas === q.filtros.vistas);
          bd.actualizaciones.push({ ...q.valores });
          if (f) { f.vistas = q.valores.vistas; f.ultima = q.valores.ultima_vista; }
        }
        return Promise.resolve({ data: null, error: null }).then(ok, mal);
      }
    };
    return api;
  },
  async rpc(nombre, args) {
    bd.rpcs.push({ nombre, args });
    const f = bd.enlaces.find((e) => e.id === args.p_enlace);
    /* como la funcion de 013: una por minuto y enlace */
    if (nombre === 'taller_contar_vista' && f && (!f.ultima || f.ultima < bd.reloj() - 60000)) { f.vistas += 1; f.ultima = bd.reloj(); }
    return { data: null, error: null };
  },
  storage: {
    from: (cajon) => ({
      async createSignedUrls(rutas, segundos) {
        bd.firmadas = { cajon, rutas, segundos };
        if (bd.firma === 'falla') return { data: null, error: { message: 'x' } };
        return { data: rutas.map((p, i) => ({ path: p, signedUrl: bd.firma === 'una-mala' && i === 1 ? null : `https://x.supabase.co/storage/v1/object/sign/${cajon}/${p}?token=t`, error: bd.firma === 'una-mala' && i === 1 ? { message: 'no' } : null })), error: null };
      }
    })
  }
});
let manejador = null;
globalThis.Deno = {
  env: { get: (k) => ({ SUPABASE_URL: 'https://x.supabase.co', ['SUPABASE_SERVICE_' + 'ROLE_KEY']: 'llave-de-mentira-del-entorno' }[k]) },
  serve: (h) => { manejador = h; }
};
await import(pathToFileURL(path.join(raiz, 'supabase/functions/vista/index.ts')).href);

const SITIO = 'https://juanjolopezramirez.com';
const OBRA = '0123abcd-0123-4abc-8abc-0123456789ab', ED = 'fedc0123-0123-4abc-8abc-0123456789ab';
const edicion = (x = {}) => ({ titulo: 'Mi libro', idioma: 'es', paginas: 3, ratio: '0.7048', blando: true, carpeta: `taller/${OBRA}/ediciones/${ED}/`, hojas: [{ text: 'a' }, { text: 'b', links: [{ x: 0.1, y: 0.1, w: 0.1, h: 0.1, page: 0 }] }, { text: 'c' }], ...x });
const ahora = Date.now();
async function enlace(token, x = {}) {
  const h = await huella(token);
  const f = { id: crypto.randomUUID(), hash: h.bytea, revocado: false, vence: new Date(ahora + 864e5).toISOString(), vistas: 0, edicion: edicion(), ...x };
  bd.enlaces.push(f);
  return f;
}
let ipN = 0;
const pedir = (cuerpo, { metodo = 'POST', origen = SITIO, crudo, ip } = {}) => manejador(new Request('https://x.supabase.co/functions/v1/vista', {
  method: metodo, headers: { origin: origen, 'content-type': 'application/json', 'x-forwarded-for': ip || `10.0.${Math.floor(++ipN / 250)}.${ipN % 250}` }, ...(metodo === 'GET' || metodo === 'OPTIONS' ? {} : { body: crudo !== undefined ? crudo : JSON.stringify(cuerpo) })
}));
const forma = async (r) => ({ status: r.status, cuerpo: await r.text(), cabeceras: [...r.headers.entries()].sort().map(([k, v]) => `${k}: ${v}`).join('|') });

let bien = 0, mal = 0;
async function ok(nombre, fn) {
  try { await fn(); bien++; } catch (e) { mal++; console.log(`  FALLA  ${nombre}\n         ${e.message}`); }
}
console.log('la funcion de borde `vista`, ejecutada');
const TOKEN = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8';
const buena = await enlace(TOKEN);

await ok('un enlace bueno entrega el libro, firma las dos medidas por diez minutos y cuenta una visita', async () => {
  const r = await pedir({ k: TOKEN });
  assert.equal(r.status, 200);
  const j = JSON.parse(await r.text());
  assert.deepEqual(Object.keys(j).sort(), ['blando', 'hojas', 'idioma', 'paginas', 'ratio', 'segundos', 'titulo', 'urls']);
  assert.equal(j.titulo, 'Mi libro');
  assert.equal(j.ratio, 0.7048);
  assert.equal(j.urls.w900.length, 3);
  assert.equal(j.urls.w1600.length, 3);
  assert.ok(j.urls.w900[0].includes(`/taller/${OBRA}/ediciones/${ED}/p001-900.webp?token=`));
  assert.ok(j.urls.w1600[2].includes('/p003-1600.webp?'));
  assert.equal(bd.firmadas.cajon, 'taller');
  assert.equal(bd.firmadas.segundos, 600);
  assert.equal(bd.firmadas.rutas.length, 6);
  assert.ok(bd.firmadas.rutas.every((x) => !x.startsWith('taller/')), 'el cajon se llama taller: su nombre no va en la ruta');
  assert.equal(buena.vistas, 1);
  assert.equal(bd.rpcs.at(-1).nombre, 'taller_contar_vista');
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(r.headers.get('access-control-allow-origin'), SITIO);
  /* se busco por la huella, nunca por el secreto */
  const h = await huella(TOKEN);
  assert.equal(bd.consultas.at(-1).filtros.hash, h.bytea);
  assert.ok(!JSON.stringify(bd.consultas).includes(TOKEN));
});
await ok('renovar las direcciones no cuenta otra visita', async () => {
  const antes = buena.vistas;
  const r = await pedir({ k: TOKEN, renovar: true });
  assert.equal(r.status, 200);
  assert.equal(buena.vistas, antes);
  assert.equal((await pedir({ k: TOKEN })).status, 200);
  assert.equal(buena.vistas, antes, 'otra apertura dentro del minuto no cuenta: la cuenta es aproximada');
  buena.ultima = Date.now() - 61000;
  assert.equal((await pedir({ k: TOKEN })).status, 200);
  assert.equal(buena.vistas, antes + 1);
});
await ok('TODO fallo da la misma respuesta: mismo codigo, mismo cuerpo, mismas cabeceras', async () => {
  const t = (n) => Buffer.from(Uint8Array.from({ length: 32 }, (_, i) => (i * 7 + n) & 255)).toString('base64url');
  const apagado = t(1), vencido = t(2), sinEdicion = t(3), carpetaMala = t(4), conBorde = t(5);
  await enlace(apagado, { revocado: true });
  await enlace(vencido, { vence: new Date(ahora - 1000).toISOString() });
  await enlace(sinEdicion, { edicion: null });
  await enlace(carpetaMala, { edicion: edicion({ carpeta: 'taller/../otra/' }) });
  await enlace(conBorde, { vence: new Date(ahora).toISOString() });
  const casos = {
    desconocido: () => pedir({ k: t(99) }), apagado: () => pedir({ k: apagado }), vencido: () => pedir({ k: vencido }), sinEdicion: () => pedir({ k: sinEdicion }),
    carpetaMala: () => pedir({ k: carpetaMala }), corto: () => pedir({ k: 'abc' }), vacio: () => pedir({ k: '' }), sinK: () => pedir({}), kNumero: () => pedir({ k: 42 }),
    kLista: () => pedir({ k: [TOKEN] }), kObjeto: () => pedir({ k: { toString: 1 } }), otraForma: () => pedir({ k: `${TOKEN.slice(0, 42)}B` }), conEspacios: () => pedir({ k: ` ${TOKEN}` }),
    noJson: () => pedir(null, { crudo: 'k=' + TOKEN }), jsonVacio: () => pedir(null, { crudo: '' }), jsonNulo: () => pedir(null, { crudo: 'null' }), jsonLista: () => pedir(null, { crudo: '[1]' }),
    enorme: () => pedir({ k: TOKEN, basura: 'x'.repeat(2000) }), get: () => pedir(null, { metodo: 'GET' }), put: () => pedir({ k: TOKEN }, { metodo: 'PUT' }), delete: () => pedir({ k: TOKEN }, { metodo: 'DELETE' })
  };
  const formas = {};
  for (const [k, f] of Object.entries(casos)) formas[k] = await forma(await f());
  const unica = formas.desconocido;
  assert.equal(unica.status, 404);
  assert.deepEqual(JSON.parse(unica.cuerpo), { error: 'Este enlace ya no abre' });
  for (const [k, x] of Object.entries(formas)) assert.deepEqual(x, unica, k);
  /* y la visita del enlace bueno no se tocó por nada de lo anterior */
  const consultasAntes = bd.consultas.length;
  await pedir({ k: 'abc' }); await pedir({ k: [TOKEN] }); await pedir(null, { metodo: 'GET' });
  assert.equal(bd.consultas.length, consultasAntes, 'lo que no es un token ni llega a la base');
});
await ok('si la firma de las imagenes falla, es el mismo fallo y no cuenta visita', async () => {
  const n = (await enlace(Buffer.from(Uint8Array.from({ length: 32 }, (_, i) => 200 - i)).toString('base64url')));
  const k = Buffer.from(Uint8Array.from({ length: 32 }, (_, i) => 200 - i)).toString('base64url');
  const desconocido = await forma(await pedir({ k: 'A'.repeat(43) }));
  for (const modo of ['falla', 'una-mala']) {
    bd.firma = modo;
    assert.deepEqual(await forma(await pedir({ k })), desconocido, modo);
    assert.equal(n.vistas, 0, modo);
  }
  bd.firma = 'bien';
  bd.error = true;
  assert.deepEqual(await forma(await pedir({ k })), desconocido, 'la base falla');
  bd.error = false;
  assert.equal((await pedir({ k })).status, 200);
});
await ok('limite por IP: pasado ~30 por minuto, el mismo 404; renovar tiene su propia cuenta', async () => {
  const desconocido = await forma(await pedir({ k: 'A'.repeat(43) }, { ip: '203.0.113.9' }));
  /* 1 ya se uso arriba: quedan 29 buenas */
  for (let i = 0; i < 29; i++) assert.equal((await pedir({ k: TOKEN }, { ip: '203.0.113.9' })).status, 200, `peticion ${i + 2}`);
  assert.deepEqual(await forma(await pedir({ k: TOKEN }, { ip: '203.0.113.9' })), desconocido, 'la 31 es el mismo 404');
  assert.equal((await pedir({ k: TOKEN, renovar: true }, { ip: '203.0.113.9' })).status, 200, 'renovar tiene su cubo aparte');
  assert.equal((await pedir({ k: TOKEN }, { ip: '203.0.113.10' })).status, 200, 'otra IP, otra cuenta');
  const N3 = await import('../supabase/functions/vista/nucleo.js');
  const l = N3.crearLimitador(2, 1000);
  assert.deepEqual([l('a', 0), l('a', 1), l('a', 2), l('b', 2), l('a', 1001)], [true, true, false, true, true]);
  assert.equal(N3.ipDe(new Headers({ 'x-forwarded-for': ' 1.2.3.4 , 5.6.7.8' })), '1.2.3.4');
  assert.equal(N3.ipDe(new Headers()), 'sin-ip');
});
await ok('CORS: el preflight solo se contesta al sitio y a localhost, y no se publica nada para otros', async () => {
  const ok1 = await pedir(null, { metodo: 'OPTIONS' });
  assert.equal(ok1.status, 204);
  assert.equal(ok1.headers.get('access-control-allow-origin'), SITIO);
  assert.match(ok1.headers.get('access-control-allow-methods'), /POST/);
  const local = await pedir(null, { metodo: 'OPTIONS', origen: 'http://localhost:4321' });
  assert.equal(local.headers.get('access-control-allow-origin'), 'http://localhost:4321');
  for (const o of ['https://evil.example', 'null', 'http://juanjolopezramirez.com', 'https://juanjolopezramirez.com.evil.example']) {
    const r = await pedir(null, { metodo: 'OPTIONS', origen: o });
    assert.equal(r.headers.get('access-control-allow-origin'), null, o);
    const m = await pedir({ k: 'abc' }, { origen: o });
    assert.equal(m.headers.get('access-control-allow-origin'), null, o);
  }
});

console.log(`\n${bien} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
