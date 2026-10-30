/* Pruebas del portal «The Alef Code». Sin dependencias:

     node tools/test-portal.mjs

   Cuatro cosas:
     1. las piezas puras (src/scripts/portal/estado.js) con datos buenos y con
        datos hostiles;
     2. los textos y las secciones (que no falte ninguno y que la voz de la casa
        se cumpla);
     3. que NINGUNA clave secreta, ni nada que se parezca, este en el repositorio
        ni en lo compilado (dist/), y que los guiones del portal no usen
        innerHTML, eval ni localStorage;
     4. la forma del SQL (supabase/*.sql): toda tabla con RLS, funciones con
        search_path fijo, `anon` solo lee, nadie se hace admin ni se cambia el estado.

   El punto 4 lee el texto de los archivos: NO sustituye a pegar 990_comprobar_rls.sql
   en Supabase, que mira la base de verdad. Se para con codigo 1 si algo falla. */
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);
const leer = (ruta) => fs.readFileSync(path.join(raiz, ruta), 'utf8');

const E = await cargar('src/scripts/portal/estado.js');
const T = await cargar('src/data/portal/textos.js');
const S = await cargar('src/data/portal/secciones.js');

let n = 0;
let mal = 0;
const ok = (nombre, fn) => {
  try { fn(); n++; console.log('  ok  ' + nombre); } catch (e) { mal++; console.log(' MAL  ' + nombre + '\n      ' + String(e.message).split('\n')[0]); }
};

/* Un JWT de mentira con la carga que se le diga (la firma no importa aqui). */
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (carga) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(carga)}.firmafalsafirmafalsafirmafalsa`;
const ANON = jwt({ role: 'anon', iss: 'supabase' });
const SERVICIO = jwt({ role: 'service_role', iss: 'supabase' });
const URL_BUENA = 'https://abcdefghijklmnop.supabase.co';

console.log('estado.js · pantalla segun quien eres');
ok('apagado y demo: lo que no es real ni demo, apagado', () => {
  assert.equal(E.pantallaPara({ modo: 'apagado' }), 'apagado');
  assert.equal(E.pantallaPara({ modo: 'cualquiera' }), 'apagado');
  assert.equal(E.pantallaPara({ modo: undefined }), 'apagado');
});
ok('sin conexion: problema; sin sesion: entrar; sin saber: cargando', () => {
  assert.equal(E.pantallaPara({ modo: 'real', conexion: false }), 'problema');
  assert.equal(E.pantallaPara({ modo: 'real', sesion: null }), 'entrar');
  assert.equal(E.pantallaPara({ modo: 'real', sesion: { id: 'x' }, perfil: undefined }), 'cargando');
});
ok('los tres estados, y un estado raro NO abre nada', () => {
  const s = { id: 'x' };
  assert.equal(E.pantallaPara({ modo: 'real', sesion: s, perfil: { estado: 'aprobado' } }), 'aprobado');
  assert.equal(E.pantallaPara({ modo: 'real', sesion: s, perfil: { estado: 'pendiente' } }), 'pendiente');
  assert.equal(E.pantallaPara({ modo: 'real', sesion: s, perfil: { estado: 'rechazado' } }), 'rechazado');
  for (const raro of ['admin', 'APROBADO', '', null, undefined, 1, {}, '__proto__']) {
    assert.notEqual(E.pantallaPara({ modo: 'real', sesion: s, perfil: { estado: raro } }), 'aprobado', String(raro));
  }
  assert.equal(E.pantallaPara({ modo: 'real', sesion: s, perfil: null }), 'pendiente');
});

console.log('estado.js · lo que se escribe');
ok('limpiar: quita controles, recorta y corta', () => {
  assert.equal(E.limpiar('  hola\u0000\u0007 mundo  ', 80), 'hola mundo');
  assert.equal(E.limpiar('abcdef', 3), 'abc');
  assert.equal(E.limpiar(null, 5), '');
  assert.equal(E.limpiar({ toString: () => 'x' }, 5), '');
  assert.equal(E.limpiar('a\nb', 10), 'a\nb');
});
ok('correoValido', () => {
  for (const b of ['a@b.co', 'juan.perez+tag@dominio.com']) assert.ok(E.correoValido(b), b);
  for (const m of ['', 'a', 'a@b', 'a b@c.co', '@b.co', 'a@@b.co', null, undefined, 7, 'a@b.c o', 'x'.repeat(250) + '@b.co']) assert.ok(!E.correoValido(m), String(m));
});
ok('errorDeClave: 10 a 72', () => {
  assert.equal(E.errorDeClave('1234567890'), null);
  assert.equal(E.errorDeClave('x'.repeat(72)), null);
  assert.equal(E.errorDeClave('123456789'), 'claveCorta');
  assert.equal(E.errorDeClave('x'.repeat(73)), 'claveLarga');
  assert.equal(E.errorDeClave(undefined), 'claveCorta');
  assert.equal(E.errorDeClave(1234567890), 'claveCorta');
});

console.log('estado.js · configuracion y claves');
ok('urlSupabaseValida: solo https://<proyecto>.supabase.co', () => {
  assert.ok(E.urlSupabaseValida(URL_BUENA));
  for (const m of ['http://abcdefghijklmnop.supabase.co', 'https://evil.com', 'https://abcdefghijklmnop.supabase.co.evil.com',
    'https://abcdefghijklmnop.supabase.co/', 'https://abc.supabase.co', '', null, undefined, 'https://abcdefghijklmnop.supabase.co@evil.com']) {
    assert.ok(!E.urlSupabaseValida(m), String(m));
  }
});
ok('esClaveSecreta: sb_secret_ y JWT de service_role, no la publica', () => {
  assert.ok(E.esClaveSecreta('sb_secret_abcdefghijklmnopqrstuvwxyz'));
  assert.ok(E.esClaveSecreta(SERVICIO));
  assert.ok(!E.esClaveSecreta(ANON));
  assert.ok(!E.esClaveSecreta('sb_publishable_abcdefghijklmnopqrstuvwxyz'));
  assert.ok(!E.esClaveSecreta(undefined));
  assert.ok(!E.esClaveSecreta('a.b.c'));
});
ok('claveVale: rechaza vacia, con espacios, enorme y secreta', () => {
  assert.ok(E.claveVale(ANON));
  assert.ok(E.claveVale('sb_publishable_abcdefghijklmnopqrstuvwxyz'));
  for (const m of ['', 'corta', 'con espacio ' + 'x'.repeat(30), 'x'.repeat(401), SERVICIO, 'sb_secret_' + 'x'.repeat(30), null, 5]) assert.ok(!E.claveVale(m), String(m).slice(0, 20));
});
ok('modoDe: real, demo (solo en desarrollo), apagado; una clave secreta NO abre el modo real', () => {
  assert.equal(E.modoDe({ url: URL_BUENA, clave: ANON }), 'real');
  assert.equal(E.modoDe({ url: URL_BUENA, clave: ANON, dev: true }), 'real');
  assert.equal(E.modoDe({ url: URL_BUENA, clave: ANON, dev: true, demo: true }), 'demo');
  assert.equal(E.modoDe({ dev: true }), 'demo');
  assert.equal(E.modoDe({}), 'apagado');
  assert.equal(E.modoDe({ demo: true }), 'apagado');                       // `?demo=` no cuenta fuera de desarrollo
  assert.equal(E.modoDe({ url: URL_BUENA, clave: SERVICIO }), 'apagado');
  assert.equal(E.modoDe({ url: URL_BUENA, clave: SERVICIO, dev: true }), 'demo');
  assert.equal(E.modoDe({ url: 'https://evil.com', clave: ANON }), 'apagado');
});

ok('limpiar: fuera lo invisible y lo que da la vuelta al texto', () => {
  assert.equal(E.limpiar('Ana‮adnA​⁦x﻿', 80), 'AnaadnAx');
  assert.equal(E.limpiar('‏hola‎', 80), 'hola');
});
ok('limpiarUrl: espacios y «/» de mas', () => {
  assert.equal(E.limpiarUrl(`  ${URL_BUENA}/  `), URL_BUENA);
  assert.equal(E.limpiarUrl(`${URL_BUENA}//`), URL_BUENA);
  assert.ok(E.urlSupabaseValida(E.limpiarUrl(`${URL_BUENA}/`)));
  assert.equal(E.limpiarUrl(undefined), undefined);
});
ok('revisarVariables: la compilacion se para con una clave secreta, una URL rara o media configuracion', () => {
  assert.deepEqual(E.revisarVariables(undefined, undefined), { ok: true, vacio: true });
  assert.deepEqual(E.revisarVariables('', '  '), { ok: true, vacio: true });
  assert.deepEqual(E.revisarVariables(URL_BUENA, ANON), { ok: true });
  assert.deepEqual(E.revisarVariables(URL_BUENA + '/', ' ' + ANON + '\n'), { ok: true });     // una «/» o un salto de linea pegados no tumban nada
  const mal = [
    [URL_BUENA, undefined], [undefined, ANON], [URL_BUENA, ''],
    [URL_BUENA, SERVICIO], [URL_BUENA, 'sb_secret_' + 'x'.repeat(30)],
    ['https://evil.com', ANON], ['http://abcdefghijklmnop.supabase.co', ANON], [URL_BUENA, 'corta'], [URL_BUENA, 'con espacio ' + 'x'.repeat(30)]
  ];
  for (const [u, k] of mal) {
    const r = E.revisarVariables(u, k);
    assert.equal(r.ok, false, String(u) + ' / ' + String(k).slice(0, 14));
    assert.ok(typeof r.motivo === 'string' && r.motivo.length > 20);
    assert.ok(!r.motivo.includes('x'.repeat(30)) && !(typeof k === 'string' && k.length > 20 && r.motivo.includes(k)), 'el aviso repite la clave');
  }
});
ok('la compilacion llama a esa revision', () => {
  const c = leer('astro.config.mjs');
  assert.match(c, /revisarVariables\(/);
  assert.match(c, /throw new Error/);
});

console.log('estado.js · errores y direcciones');
ok('claveDeError: por codigo; lo raro es generico (incluidos los nombres de Object.prototype)', () => {
  assert.equal(E.claveDeError({ code: 'invalid_credentials' }), 'credenciales');
  assert.equal(E.claveDeError({ code: 'user_not_found' }), 'credenciales');
  assert.equal(E.claveDeError({ code: 'email_not_confirmed' }), 'sinConfirmar');
  assert.equal(E.claveDeError({ code: 'weak_password' }), 'claveDebil');
  assert.equal(E.claveDeError({ code: 'same_password' }), 'claveIgual');
  assert.equal(E.claveDeError({ status: 429 }), 'demasiados');
  assert.equal(E.claveDeError({ name: 'AuthRetryableFetchError' }), 'red');
  for (const raro of [null, undefined, 'x', 5, {}, { code: 'constructor' }, { code: '__proto__' }, { code: 'toString' }, { code: 'hasOwnProperty' }]) {
    assert.equal(E.claveDeError(raro), 'generico', JSON.stringify(raro));
  }
});
ok('claveDeError: un correo que no existe y una clave mala dicen LO MISMO', () => {
  assert.equal(E.claveDeError({ code: 'user_not_found' }), E.claveDeError({ code: 'invalid_credentials' }));
});
ok('idiomaDe y rutas: siempre una direccion propia', () => {
  assert.equal(E.idiomaDe('fr'), 'fr');
  for (const raro of ['../evil', '//evil.com', 'javascript:alert(1)', '', null, undefined, '__proto__', 'ES']) assert.equal(E.idiomaDe(raro), 'es', String(raro));
  assert.equal(E.rutaPortal('en'), '/en/portal/');
  assert.equal(E.rutaPanel('pt'), '/pt/portal/panel/');
  assert.equal(E.rutaPortal('//evil.com'), '/es/portal/');
  assert.equal(E.urlPortal('https://juanjolopezramirez.com/', 'it'), 'https://juanjolopezramirez.com/it/portal/');
});
ok('anclaValida: solo las secciones que le tocan', () => {
  const ids = S.idsPara(true);
  assert.equal(E.anclaValida('#accesos', ids), 'accesos');
  assert.equal(E.anclaValida('#ACCESOS', ids), 'accesos');
  for (const raro of ['', '#', 'accesos', '#__proto__', '#constructor', '#nada', '#%E0%A4%A', '#a b', null, undefined, 3]) assert.equal(E.anclaValida(raro, ids), null, String(raro));
  assert.equal(E.anclaValida('#accesos', S.idsPara(false)), null);       // un miembro no llega a «Quién entra»
  assert.equal(E.anclaValida('#accesos', undefined), null);
});

console.log('textos y secciones');
const es = T.tp('es');
ok('tp: lo que falta sale en español y nada se rompe con idiomas raros', () => {
  for (const l of ['en', 'pt', 'fr', 'it', 'zz', '__proto__', 'constructor', undefined, null]) assert.equal(T.tp(l).nombre, 'The Alef Code', String(l));
});
ok('todo error que el codigo puede devolver tiene su texto', () => {
  const claves = new Set(['credenciales', 'correoInvalido', 'claveCorta', 'claveLarga', 'nombreVacio', 'demasiados', 'red', 'claveDebil', 'claveIgual', 'sinConfirmar', 'google', 'enlaceCaducado', 'generico']);
  for (const c of claves) assert.ok(typeof es.errores[c] === 'string' && es.errores[c].length > 3, c);
  for (const codigo of ['invalid_credentials', 'user_not_found', 'email_not_confirmed', 'weak_password', 'same_password', 'over_request_rate_limit',
    'over_email_send_rate_limit', 'request_timeout', 'provider_disabled', 'oauth_provider_not_supported', 'bad_oauth_callback', 'bad_oauth_state', 'provider_email_needs_verification']) {
    assert.ok(claves.has(E.claveDeError({ code: codigo })), codigo);
  }
});
ok('jsonSeguro: ningun texto puede cerrar la etiqueta ni romper la linea', () => {
  const j = T.jsonSeguro({ a: '</script><script>alert(1)</script>', b: '  ', c: '<!--' });
  assert.ok(!j.includes('<'));
  assert.ok(!j.includes(' ') && !j.includes(' '));
  assert.deepEqual(JSON.parse(j), { a: '</script><script>alert(1)</script>', b: '  ', c: '<!--' });
});
ok('la voz de la casa: UNA sola pregunta en la tarjeta, y es «¿Prefieres escribirme?»', () => {
  const textos = [];
  const recorrer = (o, ruta) => {
    for (const [k, v] of Object.entries(o)) {
      if (ruta === '' && k === 'panel') continue;
      if (typeof v === 'string') textos.push(v); else if (v && typeof v === 'object') recorrer(v, ruta + k + '.');
    }
  };
  recorrer(es, '');
  assert.deepEqual(textos.filter((t) => t.includes('?')), ['¿Prefieres escribirme?']);
});
ok('nunca «CEO»: es «fundador»', () => {
  const todo = JSON.stringify(es);
  assert.ok(!/\bCEO\b/i.test(todo));
});
ok('cada seccion tiene titulo y linea, cada grupo su nombre, y solo hay admin donde debe', () => {
  for (const s of S.SECCIONES) {
    assert.ok(es.panel.secciones[s.id]?.titulo, s.id);
    assert.ok(es.panel.secciones[s.id]?.linea, s.id);
    assert.ok(S.GRUPOS.includes(s.grupo), s.id);
  }
  for (const g of S.GRUPOS) assert.ok(es.panel.grupos[g], g);
  assert.deepEqual(S.idsPara(false), ['inicio']);
  assert.ok(S.idsPara(true).includes('accesos') && S.idsPara(true).includes('diario'));
  assert.ok(S.HECHAS.every((h) => S.IDS.includes(h)));
  assert.equal(new Set(S.IDS).size, S.IDS.length);
});
ok('Self-Mode y Developer-Mode: el admin entra en «Hoy» y NO ve el test; el miembro entra en el test', () => {
  assert.equal(S.inicioPara(true), 'hoy');
  assert.equal(S.inicioPara(false), 'inicio');
  assert.ok(!S.idsPara(true).includes('inicio'), 'el primer paso del admin no es el test');
  assert.ok(S.idsPara(true).includes(S.inicioPara(true)) && S.idsPara(false).includes(S.inicioPara(false)));
  const de = (g) => S.SECCIONES.filter((s) => s.grupo === g).map((s) => s.id);
  assert.equal(de('self')[0], 'hoy');
  for (const id of ['proyectos', 'trabajos', 'libros', 'camino']) assert.ok(de('dev').includes(id), id);
  assert.deepEqual(de('acceso'), ['accesos', 'seguridad']);
  assert.deepEqual(S.MODOS, ['self', 'dev']);
  for (const s of S.SECCIONES) assert.ok(!(s.admin && s.soloMiembros), s.id);
});
ok('los dos modos: la seccion dice el modo; Acceso se queda en el que estabas; al llegar sin nada, Self-Mode', () => {
  assert.equal(S.modoDe('libros'), 'dev');
  assert.equal(S.modoDe('hoy'), 'self');
  assert.equal(S.modoDe('accesos'), null);
  assert.equal(S.modoDe('inicio'), null);
  assert.equal(S.modoPara('libros', 'self'), 'dev');
  assert.equal(S.modoPara('accesos', 'dev'), 'dev');
  assert.equal(S.modoPara('seguridad', ''), 'self');
  assert.equal(S.modoPara('__proto__', 'raro'), 'self');
  assert.equal(S.inicioDeModo('self'), 'hoy');
  assert.equal(S.modoDe(S.inicioDeModo('dev')), 'dev');
});
ok('el boton de los modos: un boton de verdad con aria-pressed, nombre fijo y solo para el admin; Acceso al final de la barra', () => {
  const panel = leer('src/components/portal/Panel.astro');
  assert.match(panel, /<button class="panel__modo" type="button" aria-pressed="false" data-modo-boton data-solo-admin/);
  assert.match(panel, /aria-live="polite" data-modo-voz/);
  assert.match(panel, /data-modo-grupo=\{MODOS\.includes\(g\) \? g : undefined\}/);
  assert.equal(S.GRUPOS[S.GRUPOS.length - 1], 'acceso', 'Acceso se pinta el ultimo (abajo)');
  const menu = leer('src/scripts/portal/panel/Menu.js');
  assert.match(menu, /setAttribute\('aria-pressed', String\(modo === 'dev'\)\)/);
  assert.match(menu, /document\.documentElement\.dataset\.modo = modo/);
  assert.match(menu, /e\.key !== 'Escape'/);
  assert.match(menu, /setAttribute\('aria-current', 'true'\)/);
  /* De dia nada se mueve: el fondo se para */
  assert.match(leer('src/scripts/portal/fondo.js'), /const quieto = \(\) => reducir\.matches \|\| pausado \|\| deDia\(\)/);
});
ok('el panel cabe en la pantalla (sin scroll de pagina) y vuelve al scroll de siempre en una pantalla muy baja', () => {
  const css = leer('src/styles/panel.css');
  assert.match(css, /html:has\(\.panel\), html:has\(\.panel\) body \{ height: 100%; overflow: hidden; \}/);
  assert.match(css, /height: 100dvh/);
  assert.match(css, /@media \(max-height: 30rem\)/);
});
ok('Self-Mode de dia: el texto se lee (4.5:1) y los bordes y el foco se ven (3:1) sobre el hueso; sin oro', () => {
  const t = leer('src/styles/terminal.css');
  const self = t.slice(t.indexOf('[data-modo="self"] .pagina--noche {'));
  const val = (n) => (self.match(new RegExp(`--${n}: (#[0-9A-Fa-f]{6})`)) || [])[1];
  const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const con = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const hueso = '#F1EFE9';
  assert.ok(con('#263B28', hueso) >= 4.5, 'tiza (pino)');
  assert.ok(con(val('tiza-2'), hueso) >= 4.5, 'tiza-2 ' + val('tiza-2'));
  assert.ok(con(val('prompt'), hueso) >= 3, 'prompt ' + val('prompt'));
  assert.ok(!/--ring|#C08A2E|#9A6A1F/i.test(self.slice(0, 2000)), 'nada de oro');
  assert.match(self, /--mono: var\(--sans\)/);
});
const guionesPanel = ['src/scripts/portal/panel.js', ...fs.readdirSync(path.join(raiz, 'src/scripts/portal/panel')).filter((f) => f.endsWith('.js')).map((f) => 'src/scripts/portal/panel/' + f)];
ok('el panel: las claves de textos que usan panel.js y sus secciones existen', () => {
  for (const f of guionesPanel) {
    const src = leer(f);
    for (const m of src.matchAll(/\ba\.([a-zA-Z]+)\b/g)) assert.ok(m[1] in es.panel.accesos, f + ': a.' + m[1]);
    for (const m of src.matchAll(/\bp\.([a-zA-Z]+)\b/g)) assert.ok(m[1] in es.panel, f + ': p.' + m[1]);
    for (const m of src.matchAll(/\bps\.([a-zA-Z]+)\b/g)) assert.ok(m[1] in es.panel.seguridad, f + ': ps.' + m[1]);
  }
});

console.log('secretos y guiones');
const archivos = (dir, filtro = () => true) => {
  const salida = [];
  const ir = (d) => {
    for (const e of fs.readdirSync(path.join(raiz, d), { withFileTypes: true })) {
      const r = path.posix.join(d, e.name);
      if (e.isDirectory()) { if (!['node_modules', '.astro', '_respaldos'].includes(e.name)) ir(r); } else if (filtro(r)) salida.push(r);
    }
  };
  if (fs.existsSync(path.join(raiz, dir))) ir(dir);
  return salida;
};
const TEXTO = /\.(astro|js|mjs|ts|css|json|html|xml|md|sql|txt|svg|example)$/;
/* Este mismo archivo se queda fuera: lleva claves de MENTIRA para probar el guardian. */
const aBuscar = [...archivos('src', (r) => TEXTO.test(r)), ...archivos('supabase'),
  ...archivos('tools', (r) => /\.(mjs|py)$/.test(r) && r !== 'tools/test-portal.mjs'),
  ...['package.json', '.env.example', '.gitignore', 'astro.config.mjs', 'README.md', 'PORTAL.md'].filter((f) => fs.existsSync(path.join(raiz, f)))];

const SECRETA = /sb_secret_[A-Za-z0-9_-]{16,}/;
const UN_JWT = /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/;
ok('ni una clave secreta ni un JWT en el codigo, el SQL ni los ajustes', () => {
  const culpables = aBuscar.filter((f) => { const t = leer(f); return SECRETA.test(t) || UN_JWT.test(t); });
  assert.deepEqual(culpables, []);
});
ok('ni en lo compilado (dist/), si existe', () => {
  const dist = archivos('dist', (r) => TEXTO.test(r));
  const culpables = dist.filter((f) => { const t = leer(f); return SECRETA.test(t) || UN_JWT.test(t); });
  assert.deepEqual(culpables, []);
});
ok('«service_role» solo aparece en el guardian (estado.js y config.js)', () => {
  const donde = aBuscar.filter((f) => /service_role/i.test(leer(f)) && !f.startsWith('supabase/') && f !== 'PORTAL.md' && f !== 'README.md');
  /* `.env.example` la nombra solo para decir que NO se ponga. */
  const permitidos = ['src/scripts/portal/estado.js', 'src/scripts/portal/config.js', '.env.example'];
  assert.deepEqual(donde.filter((f) => !permitidos.includes(f)), []);
});
ok('.env no se sube, .env.example no lleva valores', () => {
  const ign = leer('.gitignore');
  assert.ok(/^\.env$/m.test(ign) && /^!\.env\.example$/m.test(ign));
  const ej = leer('.env.example').split('\n').filter((l) => /^PUBLIC_/.test(l));
  assert.ok(ej.length >= 2);
  for (const l of ej) assert.ok(/^PUBLIC_[A-Z_]+=$/.test(l.trim()), l);
});
const guionesPortal = archivos('src/scripts/portal', (r) => r.endsWith('.js'));
ok('los guiones del portal: nada de innerHTML, eval, document.write ni localStorage', () => {
  assert.ok(guionesPortal.length >= 8, guionesPortal.join(','));
  const prohibido = /\b(innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\s*\(|new Function|localStorage|sessionStorage)\b/;
  for (const f of guionesPortal) {
    const sinComentarios = leer(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!prohibido.test(sinComentarios), f);
  }
});
ok('la demo solo se carga detras de import.meta.env.DEV, y solo ella', () => {
  const b = leer('src/scripts/portal/backend.js');
  assert.match(b, /import\.meta\.env\.DEV\s*&&/);
  const importan = archivos('src', (r) => /\.(js|astro)$/.test(r)).filter((f) => /import\(\s*['"][^'"]*demo\.js['"]\s*\)/.test(leer(f)));
  assert.deepEqual(importan, ['src/scripts/portal/backend.js']);
});
ok('supabase-js: version fija (sin ^ ni ~) y solo se importa en cliente.js', () => {
  const v = JSON.parse(leer('package.json')).dependencies['@supabase/supabase-js'];
  assert.match(v, /^\d+\.\d+\.\d+$/);
  const importan = archivos('src', (r) => /\.(js|astro)$/.test(r)).filter((f) => /@supabase\/supabase-js/.test(leer(f).replace(/\/\*[\s\S]*?\*\//g, '')));
  assert.deepEqual(importan, ['src/scripts/portal/cliente.js']);
});
ok('el cliente: PKCE y no el flujo por defecto', () => {
  assert.match(leer('src/scripts/portal/cliente.js'), /flowType:\s*'pkce'/);
});
ok('las paginas del portal y de lo que va detras llevan noindex y no estan en el mapa', () => {
  for (const p of ['src/pages/[lang]/contact.astro', 'src/pages/[lang]/meet.astro']) {
    assert.match(leer(p), /\bnoindex\b/, p);
  }
  /* El portal y el panel van sobre layouts/Terminal.astro, que pone `noindex` siempre */
  assert.match(leer('src/layouts/Terminal.astro').split('---')[2], /<Base\b[^>]*\bnoindex\b/);
  for (const p of ['src/pages/[lang]/portal/index.astro', 'src/pages/[lang]/portal/panel.astro']) {
    assert.match(leer(p), /<Terminal\b/, p);
  }
  const mapa = leer('src/pages/sitemap.xml.js');
  for (const q of ['portal', 'contact', 'direct', 'meet']) assert.ok(!new RegExp(`['"]${q}['"]`).test(mapa.replace(/\/\*[\s\S]*?\*\//g, '')), q);
  for (const p of ['src/pages/[lang]/contact.astro', 'src/pages/[lang]/meet.astro']) assert.match(leer(p), /data-guardia/, p);
});

console.log('esperas, fondo y la vuelta a la portada');
ok('la entrada no hace esperar: ENTRADA_MS <= 800, y 0 con el fondo quieto o «reducir movimiento»', () => {
  const c = leer('src/scripts/portal/carga.js');
  const ms = Number((c.match(/export const ENTRADA_MS = (\d+);/) || [])[1]);
  assert.ok(ms > 0 && ms <= 800, String(ms));
  assert.match(c, /esperaDeEntrada = \(\) => \(fondoQuieto\(\) \? 0 : ENTRADA_MS\)/);
  assert.match(c, /prefers-reduced-motion: reduce/);
  assert.match(c, /fondo-quieto/);
  assert.match(leer('src/scripts/portal/entrar.js'), /setTimeout\(\(\) => \{ if \(sigue\(\)\) irAlPanel\(perfil\); \}, esperaDeEntrada\(\)\)/);
});
ok('el fondo tiene sus tres modos y se queda quieto cuando debe', () => {
  const f = leer('src/scripts/portal/fondo.js');
  assert.match(f, /const RAPIDEZ = \{ reposo: 1, carga: 1, entrada: [\d.]+ \}/);
  assert.match(f, /addEventListener\('alef:fondo'/);
  assert.match(f, /if \(quieto\(\)\) \{ pintar\(0\); return; \}/);
  assert.match(f, /document\.hidden \|\| quieto\(\)/);
});
ok('la bitacora: cada paso que se escribe tiene su texto', () => {
  const pasos = ['src/scripts/portal/entrar.js', 'src/scripts/portal/panel.js']
    .flatMap((f) => [...leer(f).matchAll(/log\.paso\('(\w+)'\)/g)].map((m) => m[1]));
  assert.ok(pasos.length >= 6);
  for (const p of pasos) assert.ok(typeof es.bitacora[p] === 'string' && es.bitacora[p], p);
});
ok('«Inicio»: la barra enlaza a la portada del idioma, en el portal y en el panel', () => {
  assert.match(leer('src/components/portal/BarraTerminal.astro'), /href=\{`\/\$\{idiomaDe\(lang\)\}\/`\}/);
  for (const f of ['src/components/portal/Tarjeta.astro', 'src/components/portal/Panel.astro']) {
    assert.match(leer(f), /<BarraTerminal\b[^>]*\blang=\{lang\}[^>]*\binicio=\{x\.inicio\}/, f);
  }
  assert.ok(es.inicio.nombre.toLowerCase().includes(es.inicio.texto.toLowerCase()), 'el nombre contiene lo que se ve (WCAG 2.5.3)');
  assert.match(es.inicio.texto, /volver/i, 'la frase entera a la vista, no solo «Inicio»');
});
ok('el salto al hiperespacio: sin telon verde de noche, y no hace esperar', () => {
  const b = leer('src/layouts/Base.astro');
  assert.match(b, /\{!noche && <Curtain \/>\}/, 'el portal no lleva el telon verde');
  assert.match(b, /curtain-noche/);
  assert.match(b, /js-llegada/);
  assert.match(b, /prefers-reduced-motion: reduce\)'\)\.matches\) h\.classList\.add\('js-llegada'\)/, 'con quietud no hay llegada');
  const s = leer('src/scripts/portal/salto.js');
  const ms = (n) => Number((s.match(new RegExp(`export const ${n} = (\\d+);`)) || [])[1]);
  assert.ok(ms('SALTO_MS') > 0 && ms('SALTO_MS') <= 450, 'SALTO_MS');
  assert.ok(ms('LLEGADA_MS') > 0 && ms('LLEGADA_MS') <= 700, 'LLEGADA_MS');
  assert.ok(!/ܐ/.test(s), 'sin arameo fuera del portal (no hay letra para el)');
  const site = leer('src/scripts/site.js');
  assert.match(site, /setTimeout\(\(\) => \{ location\.href = url\.href; \}, 420\)/, 'se navega a los 420 ms de siempre');
  assert.match(site, /if \(!e\.persisted\) return;\s*leaving = false;/, '«atrás» suelta los enlaces');
});
ok('la brujula: una sola pieza (Rosa) en el libro, el telon y la espera de la guardia', () => {
  assert.match(leer('src/components/Panels.astro'), /<Rosa prefijo="carga" idMarcas="book-load-ticks" \/>/);
  assert.match(leer('src/components/Curtain.astro'), /<Rosa prefijo="telon"/);
  assert.ok(!/curtain__mark|mark-bone/.test(leer('src/components/Curtain.astro')), 'la marca no va en el telon (no se rota ni se encierra)');
  for (const p of ['src/pages/[lang]/contact.astro', 'src/pages/[lang]/meet.astro']) assert.match(leer(p), /<EsperaRosa lang=\{lang\} \/>/, p);
  assert.match(leer('src/scripts/portal/guardia.js'), /\[data-guardia-espera\][\s\S]*?remove\(\)/);
});
ok('«atrás» no enseña una pagina vieja: el portal y el panel se recargan al volver de la memoria', () => {
  for (const f of ['src/scripts/portal/entrar.js', 'src/scripts/portal/panel.js']) {
    assert.match(leer(f), /addEventListener\('pageshow', \(e\) => \{ if \(e\.persisted\)[^}]*window\.location\.reload\(\)/, f);
  }
  assert.match(leer('src/scripts/portal/panel.js'), /function olvidar\(\)[\s\S]*?\[data-lista\][\s\S]*?replaceChildren\(\)/);
});

console.log('politica de contenido (CSP)');
const PC = await cargar('tools/politica-contenido.mjs');
ok('cada guion en linea entra por su huella; JSON y guiones de fuera no cuentan; nada de unsafe-inline/eval en script-src', () => {
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><script>uno()</script><script type="module">dos()</script>'
    + '<script type="application/json">{"a":1}</script><script type="module" src="/_astro/x.js"></script>'
    + '<link rel="stylesheet" media="print" onload="this.media=\'all\'" href="https://fonts.googleapis.com/x"></head><body></body></html>';
  const r = PC.ponerPolitica(html, { supabase: URL_BUENA });
  const meta = r.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)[1];
  const script = meta.split('; ').find((d) => d.startsWith('script-src'));
  assert.equal((script.match(/'sha256-/g) || []).length, 3, 'dos guiones + el manejador de las letras');
  assert.ok(!/unsafe-inline|unsafe-eval|\*/.test(script), script);
  assert.match(meta, /object-src 'none'/);
  assert.match(meta, /frame-src https:\/\/www\.youtube-nocookie\.com(;|$)/);
  assert.match(meta, /base-uri 'self'/);
  assert.match(meta, new RegExp(`connect-src 'self' ${URL_BUENA} ${URL_BUENA.replace('https:', 'wss:')}`));
  assert.ok(r.indexOf('Content-Security-Policy') < r.indexOf('<script>uno()'), 'la politica va antes del primer guion');
});
ok('un manejador en linea que no es el de las letras PARA la compilacion (con cualquier comilla)', () => {
  const pag = (cuerpo) => `<!DOCTYPE html><head><meta charset="UTF-8"></head><body>${cuerpo}</body>`;
  assert.throws(() => PC.ponerPolitica(pag('<button onclick="alert(1)">x</button>')), /manejador/);
  assert.throws(() => PC.ponerPolitica(pag("<img src=x onerror='alert(1)'>")), /manejador/);
  assert.throws(() => PC.ponerPolitica(pag('<img src=x onerror=alert(1)>')), /manejador/);
  assert.throws(() => PC.ponerPolitica(pag('<img src=x onload="this.media=\'all\'" onerror="alert(1)">')), /manejador/);
  assert.throws(() => PC.ponerPolitica(pag('<script>var s = "<!--";</script>')), /guion/);
  /* un «onclick=» escrito DENTRO de un guion no es un manejador */
  assert.doesNotThrow(() => PC.ponerPolitica(pag('<script>const t = \' onclick="x"\';</script>')));
});
ok('cada marco (iframe) que el sitio abre esta permitido en frame-src', () => {
  const origenes = new Set();
  for (const f of archivos('src/scripts', (r) => r.endsWith('.js'))) {
    const t = leer(f);
    if (!/createElement\('iframe'\)/.test(t)) continue;
    for (const m of t.matchAll(/`(https:\/\/[^/`$]+)\//g)) if (/embed|player|video/.test(t.slice(m.index, m.index + 80))) origenes.add(m[1]);
  }
  assert.ok(origenes.size >= 1, 'no encontre el reproductor');
  for (const o of origenes) assert.ok(PC.MARCOS.includes(o), o);
});
ok('la compilacion pone la politica en todas las paginas (astro.config.mjs)', () => {
  const c = leer('astro.config.mjs');
  assert.match(c, /integrations: \[politicaDeContenido\(\{ supabase: supabaseUrl \}\)\]/);
});
ok('lo compilado (dist/), si existe: TODAS las paginas llevan su politica', () => {
  const html = archivos('dist', (r) => r.endsWith('.html'));
  if (!html.length) return;
  const sin = html.filter((f) => !/<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'/.test(leer(f)));
  assert.deepEqual(sin, []);
});

console.log('SQL (forma, no sustituye a 990_comprobar_rls.sql)');
const sql = Object.fromEntries(archivos('supabase', (r) => r.endsWith('.sql')).map((f) => [path.posix.basename(f), leer(f)]));
const sinComentarioSql = (t) => t.replace(/^\s*--.*$/gm, '');
const base = ['001_perfiles_y_acceso.sql', '002_contenido.sql', '003_privado.sql', '004_almacen.sql', '007_desarrollo.sql'];
ok('estan los archivos de siempre', () => {
  for (const f of [...base, '900_semilla_admin.ejemplo.sql', '990_comprobar_rls.sql']) assert.ok(f in sql, f);
});
ok('TODA tabla creada tiene RLS encendido', () => {
  const todo = base.map((f) => sinComentarioSql(sql[f])).join('\n');
  const creadas = [...todo.matchAll(/create table if not exists public\.(\w+)/g)].map((m) => m[1]);
  const conRls = new Set([...todo.matchAll(/alter table public\.(\w+) enable row level security/g)].map((m) => m[1]));
  for (const m of todo.matchAll(/foreach t in array array\[([^\]]+)\]/g)) for (const nombre of m[1].matchAll(/'(\w+)'/g)) conRls.add(nombre[1]);
  assert.ok(creadas.length >= 10, 'solo ' + creadas.length);
  assert.deepEqual(creadas.filter((c) => !conRls.has(c)), []);
});
ok('toda funcion «security definer» fija su search_path', () => {
  for (const f of base) {
    const trozos = sinComentarioSql(sql[f]).split(/create or replace function/i).slice(1);
    for (const t of trozos) {
      const cabecera = t.split(/\$\$/)[0];
      if (/security definer/i.test(cabecera)) assert.match(cabecera, /set search_path\s*=\s*''/i, f + ': ' + cabecera.slice(0, 40).trim());
    }
  }
});
ok('«anon» solo lee: ningun insert, update, delete ni all para anon', () => {
  for (const f of base) {
    const t = sinComentarioSql(sql[f]);
    for (const g of t.matchAll(/grant\s[^;]*?\bto\b[^;]*;/gi)) {
      if (/\banon\b/i.test(g[0])) assert.ok(/^grant\s+(select|usage)\b/i.test(g[0].trim()) && !/\b(insert|update|delete|all|truncate)\b/i.test(g[0]), f + ': ' + g[0].slice(0, 60));
    }
  }
});
ok('nadie se hace admin ni cambia su estado desde la web', () => {
  const t = sinComentarioSql(sql['001_perfiles_y_acceso.sql']);
  assert.ok(!/create policy[^;]*on public\.admins[^;]*for\s+(insert|update|delete|all)/i.test(t));
  assert.ok(!/grant[^;]*\b(insert|update|delete)\b[^;]*on table public\.admins/i.test(t));
  assert.match(t, /grant update \(nombre, motivo\) on table public\.perfiles/);
  assert.ok(!/grant[^;]*update[^;(]*on table public\.perfiles/i.test(t.replace(/grant update \(nombre, motivo\)[^;]*;/g, '')));
  assert.match(t, /no puedes decidir sobre tu propia cuenta/);
});
ok('lo privado (003) solo se abre con «la fila es tuya Y eres el admin» (ni miembros, ni filas ajenas)', () => {
  const t = sinComentarioSql(sql['003_privado.sql']);
  const regla = /user_id = \(select auth\.uid\(\)\) and \(select public\.es_admin\(\)\)/g;
  assert.equal((t.match(regla) || []).length, 2, 'using y with check');
  assert.ok(!/esta_aprobado\(\)/.test(t), 'un miembro aprobado no escribe en lo privado');
  assert.ok(!/using \(\(select public\.es_admin\(\)\)\)/.test(t), 'ser admin, solo, no abre las filas de otros');
});
ok('006: ser admin pide el codigo (aal2), con el seguro contra quedarse fuera y la receta de deshacer', () => {
  const t = sql['006_admin_aal2.sql'];
  assert.ok(t, 'falta 006_admin_aal2.sql');
  const vivo = sinComentarioSql(t);
  assert.match(vivo, /create or replace function public\.es_admin\(\)[\s\S]*?security definer\s+set search_path = ''/);
  assert.match(vivo, /coalesce\(\(select auth\.jwt\(\)->>'aal'\), 'aal1'\) in \('aal2', 'aal3'\)\s+and exists \(\s*select 1 from public\.admins a where a\.user_id = \(select auth\.uid\(\)\)/);
  /* El seguro va ANTES de crear la funcion y en el mismo bloque: no se puede aplicar sin el. */
  const seguro = vivo.search(/raise exception/), crea = vivo.search(/create or replace function public\.es_admin/);
  assert.ok(seguro > 0 && crea > seguro, 'el seguro antes de crear');
  assert.match(vivo, /where not exists \(\s*select 1 from auth\.mfa_factors f\s+where f\.user_id = a\.user_id and f\.status = 'verified'/, 'todo admin con dispositivo');
  assert.match(vivo, /execute \$f\$/);
  assert.ok(!/esta_aprobado/.test(vivo));
  const deshacer = sinComentarioSql(sql['910_deshacer_006.sql'] || '');
  assert.match(deshacer, /create or replace function public\.es_admin\(\)/);
  assert.match(deshacer, /confirmo constant text := 'NO';/, 'el 910 viene apagado');
  assert.ok(deshacer.search(/raise exception/) < deshacer.search(/create or replace function/), 'el 910 se para antes de tocar nada');
  assert.match(deshacer, /delete from auth\.mfa_factors where user_id in \(select user_id from public\.admins\)/, 'deshacer borra los dispositivos');
  assert.match(sql['990_comprobar_rls.sql'], /es_admin_pide_codigo/);
});
ok('007: Developer-Mode escribe solo el admin, lo publicado lo lee cualquiera, y los PDF de borradores no salen', () => {
  const t = sinComentarioSql(sql['007_desarrollo.sql']);
  assert.match(t, /foreach t in array array\['biblioteca', 'casas', 'etapas'\]/);
  assert.match(t, /using \(\(select public\.es_admin\(\)\)\) with check \(\(select public\.es_admin\(\)\)\)/);
  assert.match(t, /for select to anon, authenticated using \(publicado\)/);
  assert.ok(!/drop table/i.test(t), 'nada se borra');
  /* El cajon de los PDF es privado y solo deja bajar los de libros publicados */
  assert.match(t, /values \('libros', 'libros', false\)/);
  assert.match(t, /"alef_libros_leer_publicados"[\s\S]*?where b\.publicado/);
  assert.match(t, /allowed_mime_types = array\['application\/pdf'\]/);
  /* Las mismas secciones reservadas que el modelo (Casa.RESERVADOS) */
  for (const s of ['work', 'projects', 'writing', 'about', 'contact', 'direct', 'meet', 'portal', 'status']) assert.ok(t.includes(`'${s}'`), s);
  for (const f of ['rutas_validas', 'claves_de_idioma']) assert.match(t, new RegExp(`function public\\.${f}\\([^)]*\\)[\\s\\S]*?immutable\\s+set search_path = ''`), f);
});
ok('008: los borradores los ve y los toca SOLO el admin; nadie sin entrar llega a ellos', () => {
  const t = sinComentarioSql(sql['008_borradores.sql']);
  assert.match(t, /create table if not exists public\.borradores/);
  assert.match(t, /alter table public\.borradores enable row level security/);
  assert.match(t, /revoke all on table public\.borradores from anon, authenticated/);
  assert.ok(!/grant[^;]*on table public\.borradores to[^;]*anon/.test(t), 'anon no tiene nada');
  assert.match(t, /create policy borradores_todo_el_admin on public\.borradores\s+for all to authenticated\s+using \(\(select public\.es_admin\(\)\)\)\s+with check \(\(select public\.es_admin\(\)\)\)/);
  assert.match(t, /tabla\s+text not null check \(tabla in \('biblioteca', 'casas', 'etapas'\)\)/);
  assert.match(t, /octet_length\(fila::text\) <= 2500000/, 'un borrador no puede ser enorme');
  assert.ok(!/drop table/i.test(t), 'nada se borra');
  /* La web sigue leyendo solo lo publicado: el PDF que baja es el de un libro publicado */
  assert.match(t, /"alef_libros_leer_publicados"[\s\S]*?where b\.publicado/);
  assert.match(t, /function public\.pdf_de_libro\([^)]*\)[\s\S]*?immutable\s+set search_path = ''/);
  /* Y el modelo pide lo mismo que la base: PDF con o sin su trozo al azar */
  assert.match(t, /\(-\[a-z0-9\]\{6,16\}\)\?\\\.pdf\$/);
  /* Cada borrador con la forma de su tabla, y una casa no cambia de clase */
  assert.match(t, /add constraint borradores_clase_check\s+check \(\(tabla = 'casas'\) = \(clase is not null\)\)/);
  assert.match(t, /create trigger casas_clase_fija before update on public\.casas/);
  /* Volver a pegar 007 despues de 008 no deshace el trozo al azar: las dos dicen lo mismo */
  const pdf = (s) => (s.match(/create or replace function public\.pdf_de_libro[\s\S]*?\$\$;/) || [''])[0];
  const leerPdf = (s) => (s.match(/create policy "alef_libros_leer_publicados"[\s\S]*?\);/) || [''])[0];
  const siete = sinComentarioSql(sql['007_desarrollo.sql']);
  assert.ok(pdf(t) && pdf(t) === pdf(siete), 'pdf_de_libro igual en 007 y 008');
  assert.ok(leerPdf(t) && leerPdf(t) === leerPdf(siete), 'la regla de leer los PDF igual en 007 y 008');
});
ok('el codigo de la app: seis numeros, y cada error de Supabase tiene su texto', () => {
  for (const b of ['123456', '123 456', ' 000000 ']) assert.ok(E.codigoValido(b), b);
  for (const m of ['12345', '1234567', 'abcdef', '12345a', '', null, undefined, 123456]) assert.ok(!E.codigoValido(m), String(m));
  for (const c of ['mfa_verification_failed', 'mfa_challenge_expired', 'mfa_ip_address_mismatch', 'insufficient_aal']) {
    const clave = E.claveDeError({ code: c });
    assert.ok(clave !== 'generico' && typeof es.errores[clave] === 'string', c);
  }
});
ok('el QR entra como imagen (img.src), nunca como HTML, y solo si es un SVG en data:', () => {
  assert.match(leer('src/scripts/portal/real.js'), /\/\^data:image\\\/svg\\\+xml\[;,\]\/\.test\(qr\)/);
  assert.match(leer('src/scripts/portal/panel/Seguridad.js'), /img\.src = r\.qr;/);
});
ok('la semilla es un ejemplo sin correo real, y las copias con correo no se suben', () => {
  assert.match(sql['900_semilla_admin.ejemplo.sql'], /TU_CORREO_AQUI/);
  for (const f of Object.keys(sql)) assert.ok(!/@(gmail|hotmail|outlook|yahoo)\.com/i.test(sql[f]), f);
  assert.match(leer('.gitignore'), /supabase\/900_semilla_admin\.sql/);
});

console.log(`\n${n} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
