/* EL TALLER CONTRA LA BASE DE VERDAD. La demo tiene su propio repositorio y por eso no ve los fallos del
   camino real: asi paso con el boton Crear. Esta prueba corre el RepositorioTallerSupabase de verdad
   contra supabase/012_taller.sql de verdad, en un Postgres de prueba que vive en memoria (PGlite). Un
   cliente minimo traduce las llamadas de supabase-js a SQL, con su misma conducta: los errores vuelven
   en { error }, no se lanzan. Asi se prueban columnas, tipos, reglas y el flujo de `rev`.
     node tools/test-taller-base.mjs */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { RepositorioTallerSupabase } from '../src/scripts/contenido/taller/Repositorio.js';
import { Capitulo, Obra } from '../src/scripts/contenido/taller/Obra.js';
import { ConfigPagina } from '../src/scripts/contenido/taller/ConfigPagina.js';
import { limpiarContenido } from '../src/scripts/contenido/taller/TextoLibro.js';
import { tituloDe } from '../src/scripts/contenido/taller/Migrar.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create table public.interruptor (admin boolean);
  insert into public.interruptor values (true);
  grant select on public.interruptor to anon, authenticated;
  create function public.es_admin() returns boolean language sql stable as 'select admin from public.interruptor';
  create function public.tocar_editado() returns trigger language plpgsql as 'begin new.editado := now(); return new; end';
`);
const sql = readFileSync(join(raiz, 'supabase/012_taller.sql'), 'utf8');
await db.exec(sql);
await db.exec(sql);
await db.exec(`create table public.casas (id text primary key check (char_length(id) <= 40 and id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  and id not in ('work', 'projects', 'writing', 'about', 'contact', 'direct', 'meet', 'portal', 'status')))`);
const sql013 = readFileSync(join(raiz, 'supabase/013_publicar.sql'), 'utf8');
await db.exec(sql013);
await db.exec(sql013);
const sql014 = readFileSync(join(raiz, 'supabase/014_recursos.sql'), 'utf8');
await db.exec(sql014);
await db.exec(sql014);

const ident = (x) => `"${x}"`;
class Consulta {
  constructor(tabla) { Object.assign(this, { tabla, accion: 'select', columnas: '*', filtros: [], orden: [], tope: 0, una: '', valores: null, vuelve: '' }); }
  select(c = '*') { if (this.accion === 'select') this.columnas = c; else this.vuelve = c; return this; }
  insert(v) { this.accion = 'insert'; this.valores = v; return this; }
  update(v) { this.accion = 'update'; this.valores = v; return this; }
  delete() { this.accion = 'delete'; return this; }
  eq(k, v) { this.filtros.push([k, v]); return this; }
  order(k, o = {}) { this.orden.push(`${ident(k)} ${o.ascending === false ? 'desc' : 'asc'}`); return this; }
  limit(n) { this.tope = n; return this; }
  single() { this.una = 'una'; return this; }
  maybeSingle() { this.una = 'quiza'; return this; }
  then(ok, mal) { return this.correr().then(ok, mal); }
  valor(k) { const v = this.valores[k]; if (k === 'hash' && typeof v === 'string') return Uint8Array.from(v.slice(2).match(/../g) || [], (h) => parseInt(h, 16)); return k !== 'fuentes' && v !== null && typeof v === 'object' ? JSON.stringify(v) : v; }
  async correr() {
    const p = [], donde = () => (this.filtros.length ? ' where ' + this.filtros.map(([k, v]) => { p.push(v); return `${ident(k)} = $${p.length}`; }).join(' and ') : '');
    const t = `public.${ident(this.tabla)}`, cols = (c) => c.split(',').map((x) => ident(x.trim())).join(',');
    const vuelta = this.vuelve ? ` returning ${cols(this.vuelve)}` : '';
    let q;
    if (this.accion === 'select') q = `select ${this.columnas === '*' ? '*' : cols(this.columnas)} from ${t}${donde()}${this.orden.length ? ` order by ${this.orden.join(',')}` : ''}${this.tope ? ` limit ${this.tope}` : ''}`;
    if (this.accion === 'insert') { const k = Object.keys(this.valores); q = `insert into ${t} (${k.map(ident).join(',')}) values (${k.map((x) => { p.push(this.valor(x)); return `$${p.length}`; }).join(',')})${vuelta}`; }
    if (this.accion === 'update') { const k = Object.keys(this.valores); q = `update ${t} set ${k.map((x) => { p.push(this.valor(x)); return `${ident(x)} = $${p.length}`; }).join(',')}${donde()}${vuelta}`; }
    if (this.accion === 'delete') q = `delete from ${t}${donde()}${vuelta}`;
    try {
      const r = await db.query(q, p);
      let data = r.rows;
      if (this.una) { if (data.length > 1 || (this.una === 'una' && !data.length)) return { data: null, error: { code: 'PGRST116' } }; data = data[0] || null; }
      return { data, error: null };
    } catch (e) { if (process.env.DEBUG_SQL) console.log('SQL:', e.message); return { data: null, error: { code: e.code || 'XX', message: e.message } }; }
  }
}
const sb = {
  from: (t) => new Consulta(t),
  async rpc(n, a) {
    const k = Object.keys(a), f = k.map((x, i) => `${x} => $${i + 1}${x === 'p_ids' ? '::uuid[]' : ''}`).join(',');
    try {
      const r = await db.query(`select public.${n}(${f}) as v`, k.map((x) => (x === 'p_ids' ? `{${a[x].join(',')}}` : a[x])));
      return { data: r.rows[0].v, error: null };
    } catch (e) { return { data: null, error: { code: e.code, message: e.message } }; }
  }
};

let bien = 0, mal = 0;
async function ok(nombre, fn) {
  try { await fn(); bien++; } catch (e) { mal++; console.log(`  FALLA  ${nombre}\n         ${e.message}`); }
}
const repo = new RepositorioTallerSupabase(sb);
const A = crypto.randomUUID(), B = crypto.randomUUID();
const obraN = new Obra({ titulo: 'Mi libro', pagina: new ConfigPagina({}).aDatos() });
let id, cap, obra;

console.log('el taller contra la base');
await ok('crear un libro le da su primer capitulo, vacio: el sistema no escribe en el texto', async () => {
  const r = await repo.crearObra(obraN.aDatos());
  assert.ok(r.ok, JSON.stringify(r));
  id = r.id;
  const a = await repo.abrir(id);
  assert.ok(a.ok);
  assert.equal(a.capitulos[0].contenido.version, 2);
  assert.deepEqual(a.capitulos[0].contenido.doc.content, [{ type: 'paragraph' }]);
  obra = new Obra(a.obra);
  cap = new Capitulo(a.capitulos[0]);
});
await ok('guardar el libro: titulo, pagina y fuentes', async () => {
  obra.titulo = 'Otro'; obra.fuentes.push('Lora');
  const r = await repo.guardarObra(obra.aDatos(), A);
  assert.equal(r.rev, 2);
  obra.rev = r.rev;
  const a = await repo.abrir(id);
  assert.equal(a.obra.titulo, 'Otro');
  assert.equal(a.obra.fuentes.at(-1), 'Lora');
});
await ok('una pagina libre con imagen recortada, cuadro y zona vuelve igual', async () => {
  const hoja = { type: 'paginaLibre', attrs: { fondo: `taller/${id}/pdf/p0001-ab.webp`, anchoMm: 578.6, altoMm: 818.4, objetos: [
    { id: 'o-abcd1234', tipo: 'imagen', ruta: `taller/${id}/img/ab.webp`, x: 10, y: 10, w: 40, h: 30, rot: 12, crop: { l: .1, t: 0, r: .2, b: 0 } },
    { id: 'o-abcd1235', tipo: 'texto', texto: 'Hola', x: 5, y: 5, w: 50, h: 10, tam: '14pt', color: '#123456' },
    { id: 'o-abcd1236', tipo: 'zona', nombre: 'Quiz', x: 5, y: 60, w: 50, h: 20 }
  ] } };
  const l = limpiarContenido({ doc: { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Uno' }] }, hoja] } });
  cap.contenido = l.contenido; cap.titulo = 'Uno';
  const r = await repo.guardarCapitulo(cap.aDatos(), A);
  assert.equal(r.rev, 2);
  cap.rev = r.rev;
  const a = await repo.abrir(id);
  const o = a.capitulos[0].contenido.doc.content[1].attrs.objetos;
  assert.deepEqual(o.map((x) => x.tipo), ['imagen', 'texto', 'zona']);
  assert.equal(o[0].crop.r, .2);
  assert.equal(a.capitulos[0].contenido.doc.content[1].attrs.anchoMm, 578.6);
});
await ok('un titulo larguisimo en el texto no detiene el guardado', async () => {
  const largo = { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'a'.repeat(900) }] }] };
  const titulo = tituloDe(largo), antes = cap.titulo;
  const r = await repo.guardarCapitulo({ ...cap.aDatos(), titulo }, A);
  assert.equal(r.rev, cap.rev + 1, JSON.stringify(r));
  cap.rev = r.rev;
  cap.titulo = antes;
  const v = await repo.guardarCapitulo(cap.aDatos(), A);
  cap.rev = v.rev;
});
await ok('capitulos: se agregan al final y se reordenan sin subir `rev`', async () => {
  const d = await repo.crearCapitulo(id, 'Dos');
  assert.equal(d.fila.orden, 1);
  assert.ok((await repo.ordenar(id, [d.fila.id, cap.id])).ok);
  const a = await repo.abrir(id);
  assert.deepEqual(a.capitulos.map((c) => c.titulo), ['Dos', 'Uno']);
  assert.equal(a.capitulos[1].rev, cap.rev);
});
await ok('dos pestañas: mi guardado tardio sigue, el de otra es conflicto', async () => {
  cap.titulo = 'B';
  const b = await repo.guardarCapitulo(cap.aDatos(), B);
  assert.deepEqual(await repo.guardarCapitulo({ ...cap.aDatos(), titulo: 'tarde' }, B), { reintentar: true, rev: b.rev });
  assert.deepEqual(await repo.guardarCapitulo({ ...cap.aDatos(), titulo: 'otra' }, A), { error: 'conflicto', rev: b.rev });
  cap.rev = b.rev;
});
await ok('copias: una automatica sin cambios no se repite; restaurar deja a la otra pestaña en conflicto', async () => {
  assert.equal((await repo.copia(id, 'auto')).omitida, false);
  assert.equal((await repo.copia(id, 'auto')).omitida, true);
  const [v] = (await repo.versiones(id)).filas;
  cap.titulo = 'Despues';
  const g = await repo.guardarCapitulo(cap.aDatos(), B);
  assert.ok((await repo.restaurar(v.id)).ok);
  const a = await repo.abrir(id);
  assert.equal(a.capitulos.find((c) => c.id === cap.id).titulo, 'B');
  assert.equal((await repo.guardarCapitulo({ ...cap.aDatos(), rev: g.rev }, B)).error, 'conflicto');
});
await ok('una pieza de la version anterior se puede crear y guardar', async () => {
  const pid = crypto.randomUUID();
  const d = { id: pid, obraId: id, nombre: 'a', estado: 'procesando', pdf: `taller/${id}/${pid}/o.pdf`, anchoMm: 148, altoMm: 210, dpi: 300, ajuste: 'contener', paginas: [], rev: 1 };
  assert.ok((await repo.crearPieza(d)).ok);
  assert.equal((await repo.guardarPieza({ ...d, estado: 'lista' }, A)).rev, 2);
  assert.ok((await repo.borrarPieza(pid)).ok);
});
await ok('quien no es admin no ve nada, y sin entrar no se llega', async () => {
  await db.exec(`update public.interruptor set admin = false; set role authenticated`);
  assert.equal((await db.query('select * from public.taller_obras')).rows.length, 0);
  assert.deepEqual(await repo.copia(id, 'manual'), { error: 'permiso' });
  await db.exec(`reset role; set role anon`);
  await assert.rejects(db.query('select * from public.taller_obras'));
  await db.exec(`reset role; update public.interruptor set admin = true`);
});
await ok('una copia sin su forma no entra, y las versiones no se editan', async () => {
  await assert.rejects(db.query(`insert into public.taller_versiones (obra_id, motivo, huella, copia) values ($1, 'manual', 'x', '{}')`, [id]));
  await db.exec('set role authenticated');
  await assert.rejects(db.query(`update public.taller_versiones set nombre = 'x'`));
  await db.exec('reset role');
});
/* ---- 013: compartir con un enlace privado. Se pega dos veces: debe poder repetirse sin romper nada. ---- */
const hex = (c) => `\\x${c.repeat(32)}`;
let obra13, ed13, en13;
await ok('013: una edicion y un enlace entran por el repositorio de verdad; la hora y los contadores los pone la base', async () => {
  const o = await repo.crearObra(obraN.aDatos());
  obra13 = o.id;
  const hojas = [{ text: 'uno' }, { text: 'dos', links: [{ x: 0.1, y: 0.1, w: 0.1, h: 0.1, page: 0 }] }];
  const e = await repo.crearEdicion({ obraId: obra13, titulo: 'Mi libro', idioma: 'es', paginas: 2, ratio: 0.7048, blando: false, hojas });
  assert.ok(e.ok, JSON.stringify(e));
  ed13 = e.id;
  const lista = await repo.ediciones(obra13);
  assert.equal(lista.filas.length, 1);
  assert.equal(lista.filas[0].ratio, 0.7048);
  assert.equal(lista.filas[0].blando, false);
  assert.deepEqual(Object.keys(lista.filas[0]).sort(), ['blando', 'creado', 'id', 'idioma', 'paginas', 'ratio', 'titulo']);
  const lejos = new Date(Date.now() + 400 * 864e5).toISOString();
  const l = await repo.crearEnlace({ edicionId: ed13, hash: hex('ab'), nombre: 'Ana', vence: lejos });
  assert.ok(l.ok, JSON.stringify(l));
  en13 = l.id;
  const dias = (Date.parse(l.vence) - Date.now()) / 864e5;
  assert.ok(dias > 89 && dias <= 90.001, `nunca pasa de 90 dias: ${dias}`);
  const f = (await repo.enlaces(ed13)).filas[0];
  assert.equal(f.vistas, 0);
  assert.equal(f.revocado, false);
  assert.equal(f.nombre, 'Ana');
  assert.equal(f.hash, undefined);
});
await ok('013: lo que la base no deja entrar: carpeta rara, hojas que no cuadran, otra huella, nombre largo, ya vencido', async () => {
  const hojas = [{ text: 'a' }];
  const base = { id: crypto.randomUUID(), obra_id: obra13, titulo: 'T', idioma: 'es', paginas: 1, ratio: 0.7, hojas: JSON.stringify(hojas) };
  const ins = (x) => db.query(`insert into public.taller_ediciones (id, obra_id, titulo, idioma, paginas, ratio, carpeta, pdf, hojas) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [x.id, x.obra_id, x.titulo, x.idioma, x.paginas, x.ratio, x.carpeta, x.pdf, x.hojas]);
  const carpeta = `taller/${obra13}/ediciones/${base.id}/`;
  await ins({ ...base, carpeta, pdf: `${carpeta}original.pdf` });
  await assert.rejects(ins({ ...base, id: crypto.randomUUID(), carpeta, pdf: `${carpeta}original.pdf` }), /check/i, 'carpeta de otra edicion');
  const otra = crypto.randomUUID(), c2 = `taller/${obra13}/ediciones/${otra}/`;
  await assert.rejects(ins({ ...base, id: otra, carpeta: c2, pdf: `${c2}../x.pdf` }), /check/i, 'el pdf debe ser original.pdf');
  await assert.rejects(ins({ ...base, id: otra, carpeta: c2, pdf: `${c2}original.pdf`, paginas: 2 }), /check/i, 'hojas distintas de paginas');
  await assert.rejects(ins({ ...base, id: otra, carpeta: c2, pdf: `${c2}original.pdf`, paginas: 301, hojas: JSON.stringify(Array.from({ length: 301 }, () => ({ text: '' }))) }), /check/i, 'mas de 300');
  await assert.rejects(ins({ ...base, id: otra, carpeta: c2, pdf: `${c2}original.pdf`, ratio: 9 }), /check/i, 'ratio');
  await db.query('delete from public.taller_ediciones where id = $1', [base.id]);
  assert.equal((await repo.crearEnlace({ edicionId: ed13, hash: hex('ab'), vence: new Date(Date.now() + 864e5).toISOString() })).error, 'generico', 'misma huella');
  assert.equal((await repo.crearEnlace({ edicionId: ed13, hash: `\\x${'cd'.repeat(31)}`, vence: new Date(Date.now() + 864e5).toISOString() })).error, 'lleno', '31 bytes');
  assert.equal((await repo.crearEnlace({ edicionId: ed13, hash: hex('cd'), nombre: 'x'.repeat(81), vence: new Date(Date.now() + 864e5).toISOString() })).error, 'lleno');
  assert.equal((await repo.crearEnlace({ edicionId: ed13, hash: hex('cd'), vence: new Date(Date.now() - 864e5).toISOString() })).error, 'lleno', 'ya vencido');
});
await ok('013: el cliente no puede ponerse visitas, ni encender otra vez un enlace, ni cambiar nada salvo apagarlo', async () => {
  const hoy = new Date(Date.now() + 864e5).toISOString();
  await db.query(`insert into public.taller_enlaces (edicion_id, hash, vence, vistas, revocado, ultima_vista) values ($1, decode(substr($2::text, 3), 'hex'), $3, 99, true, now())`, [ed13, hex('ee'), hoy]);
  const r = (await db.query(`select vistas, revocado, ultima_vista from public.taller_enlaces where hash = decode(substr($1::text, 3), 'hex')`, [hex('ee')])).rows[0];
  assert.deepEqual([r.vistas, r.revocado, r.ultima_vista], [0, false, null]);
  await db.exec('set role authenticated');
  try {
    await assert.rejects(db.query(`update public.taller_enlaces set vistas = 50 where id = $1`, [en13]), /permission/i, 'vistas no son del admin');
    await assert.rejects(db.query(`update public.taller_enlaces set vence = now() + interval '1 day' where id = $1`, [en13]), /permission/i);
    await assert.rejects(db.query(`update public.taller_enlaces set hash = decode(substr($2::text, 3), 'hex') where id = $1`, [en13, hex('ff')]), /permission/i);
    await assert.rejects(db.query(`update public.taller_ediciones set titulo = 'x'`), /permission/i, 'las ediciones no se editan');
  } finally { await db.exec('reset role'); }
  await db.exec('set role authenticated');
  try {
    assert.ok((await repo.apagarEnlace(en13)).ok);
    await assert.rejects(db.query(`update public.taller_enlaces set revocado = false where id = $1`, [en13]), /apagado/i, 'un enlace apagado no se enciende');
  } finally { await db.exec('reset role'); }
  assert.equal((await db.query(`select revocado from public.taller_enlaces where id = $1`, [en13])).rows[0].revocado, true);
  /* la llave de servicio (aqui, el dueño de la tabla) si cuenta visitas */
  await db.query(`update public.taller_enlaces set vistas = vistas + 1, ultima_vista = now() where hash = decode(substr($1::text, 3), 'hex')`, [hex('ee')]);
  assert.equal((await db.query(`select vistas from public.taller_enlaces where hash = decode(substr($1::text, 3), 'hex')`, [hex('ee')])).rows[0].vistas, 1);
});
await ok('013: la funcion de borde (service_role) lee, y cuenta UNA visita por minuto y enlace; nada mas', async () => {
  const e = await repo.crearEdicion({ obraId: obra13, titulo: 'T', paginas: 1, ratio: 0.7, hojas: [{ text: '' }] });
  const l = await repo.crearEnlace({ edicionId: e.id, hash: hex('99'), vence: new Date(Date.now() + 864e5).toISOString() });
  await db.exec('set role service_role');
  try {
    assert.equal((await db.query('select 1 from public.taller_enlaces where id = $1', [l.id])).rows.length, 1);
    assert.equal((await db.query('select 1 from public.taller_ediciones where id = $1', [e.id])).rows.length, 1);
    await db.query('select public.taller_contar_vista($1)', [l.id]);
    await db.query('select public.taller_contar_vista($1)', [l.id]);
    const f = (await db.query('select vistas, ultima_vista from public.taller_enlaces where id = $1', [l.id])).rows[0];
    assert.equal(f.vistas, 1, 'la segunda dentro del minuto no cuenta');
    assert.ok(f.ultima_vista);
    await assert.rejects(db.query('update public.taller_enlaces set revocado = true where id = $1', [l.id]), /permission/i, 'la llave de servicio no apaga ni cambia nada mas');
    await assert.rejects(db.query(`update public.taller_enlaces set vence = now() + interval '1 day' where id = $1`, [l.id]), /permission/i);
    await assert.rejects(db.query(`insert into public.taller_enlaces (edicion_id, hash, vence) values ($1, decode(repeat('11', 32), 'hex'), now() + interval '1 day')`, [e.id]), /permission/i);
  } finally { await db.exec('reset role'); }
  /* pasado el minuto, cuenta otra */
  await db.query(`update public.taller_enlaces set ultima_vista = now() - interval '61 seconds' where id = $1`, [l.id]);
  await db.exec('set role service_role');
  try { await db.query('select public.taller_contar_vista($1)', [l.id]); } finally { await db.exec('reset role'); }
  assert.equal((await db.query('select vistas from public.taller_enlaces where id = $1', [l.id])).rows[0].vistas, 2);
  /* nadie mas la ejecuta */
  for (const rol of ['anon', 'authenticated']) {
    await db.exec(`set role ${rol}`);
    try { await assert.rejects(db.query('select public.taller_contar_vista($1)', [l.id]), /permission/i, rol); } finally { await db.exec('reset role'); }
  }
  /* sin `vence` no se crea un enlace (no se inventa una fecha) */
  await assert.rejects(db.query(`insert into public.taller_enlaces (edicion_id, hash) values ($1, decode(repeat('22', 32), 'hex'))`, [e.id]), (x) => x.code === '23502' || /vence/i.test(x.message));
  await repo.borrarEdicion(e.id);
});
await ok('013: quien no es admin no ve ni toca nada, y sin entrar no se llega a ninguna de las dos tablas', async () => {
  await db.exec(`update public.interruptor set admin = false; set role authenticated`);
  try {
    for (const t of ['taller_ediciones', 'taller_enlaces']) {
      assert.equal((await db.query(`select * from public.${t}`)).rows.length, 0, t);
    }
    await assert.rejects(db.query(`insert into public.taller_enlaces (edicion_id, hash, vence) values ($1, decode(substr($2::text, 3), 'hex'), now() + interval '1 day')`, [ed13, hex('11')]), /row-level|policy/i);
    assert.deepEqual(await repo.apagarEnlace(en13), { error: 'noExiste' });
  } finally { await db.exec('reset role'); await db.exec('update public.interruptor set admin = true'); }
  await db.exec('set role anon');
  try {
    for (const t of ['taller_ediciones', 'taller_enlaces']) {
      await assert.rejects(db.query(`select * from public.${t}`), /permission/i, t);
      await assert.rejects(db.query(`insert into public.${t} default values`), /permission/i, t);
    }
  } finally { await db.exec('reset role'); }
  for (const t of ['taller_ediciones', 'taller_enlaces']) {
    assert.equal((await db.query(`select relrowsecurity from pg_class where oid = $1::regclass`, [`public.${t}`])).rows[0].relrowsecurity, true, t);
    assert.equal((await db.query(`select has_table_privilege('anon', $1, 'SELECT') as v`, [`public.${t}`])).rows[0].v, false, t);
  }
});
await ok('013: borrar una edicion borra sus enlaces, y borrar el libro borra sus ediciones', async () => {
  assert.ok((await repo.borrarEdicion(ed13)).ok);
  assert.equal((await db.query('select 1 from public.taller_enlaces')).rows.length, 0);
  const e = await repo.crearEdicion({ obraId: obra13, titulo: 'T', paginas: 1, ratio: 0.7, hojas: [{ text: '' }] });
  await repo.crearEnlace({ edicionId: e.id, hash: hex('77'), vence: new Date(Date.now() + 864e5).toISOString() });
  assert.ok((await repo.borrarObra(obra13)).ok);
  assert.equal((await db.query('select 1 from public.taller_ediciones')).rows.length, 0);
  assert.equal((await db.query('select 1 from public.taller_enlaces')).rows.length, 0);
});
await ok('013: «vista» y «actividad» ya no pueden ser el nombre de una casa, y las demas siguen entrando', async () => {
  for (const mal of ['vista', 'actividad', 'work']) await assert.rejects(db.query('insert into public.casas (id) values ($1)', [mal]), /check/i, mal);
  await db.query(`insert into public.casas (id) values ('casa-san-pedro')`);
  await assert.rejects(db.query(`insert into public.taller_obras (titulo, libro_id) values ('x', 'Mal Id')`), /check/i);
  await db.query(`insert into public.taller_obras (titulo, libro_id) values ('x', 'ahava')`);
  await db.query(`delete from public.taller_obras where titulo = 'x'`);
});
await ok('013: ni una funcion sin search_path ni una «security definer», y nadie sin entrar ejecuta nada nuevo', async () => {
  const f = (await db.query(`select proname, prosecdef, proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and proname like 'taller_enlace%'`)).rows;
  assert.equal(f.length, 2);
  for (const x of f) { assert.equal(x.prosecdef, false); assert.ok((x.proconfig || []).some((c) => c.startsWith('search_path='))); }
});
/* ---- 014: publicar en Recursos. Se pega dos veces (arriba): el vinculo con el libro de Recursos ---- */
await db.exec(`create table public.biblioteca (id text primary key); create table public.borradores (tabla text, id text);
  grant select on public.biblioteca, public.borradores to authenticated`);
const llamadas = [];
const sbConAlmacen = { ...sb, storage: { from: (cajon) => ({ copy: async (a, b, o) => { llamadas.push({ cajon, a, b, o }); return { data: { path: b }, error: null }; } }) } };
const repo14 = new RepositorioTallerSupabase(sbConAlmacen);
let o14, p14, ed14;
const AZAR14 = () => 'abc123def456';
await ok('014: vincular un libro de Recursos no sube `rev` ni da conflicto al guardar, y se puede repetir', async () => {
  o14 = (await repo14.crearObra(new Obra({ titulo: 'Libro para Recursos', pagina: new ConfigPagina({}).aDatos() }).aDatos())).id;
  const antes = (await db.query('select rev, titulo from public.taller_obras where id = $1', [o14])).rows[0];
  assert.deepEqual(await repo14.libroDe(o14), { ok: true, libroId: '' });
  assert.deepEqual(await repo14.vincularLibro(o14, 'milibro'), { ok: true });
  const despues = (await db.query('select rev, libro_id, titulo from public.taller_obras where id = $1', [o14])).rows[0];
  assert.equal(despues.libro_id, 'milibro');
  assert.equal(despues.rev, antes.rev, 'poner libro_id no es un cambio del libro');
  assert.deepEqual(await repo14.vincularLibro(o14, 'milibro'), { ok: true }, 'repetirlo no hace nada');
  assert.deepEqual(await repo14.libroDe(o14), { ok: true, libroId: 'milibro' });
  /* la pestaña que tenia el libro abierto guarda con la `rev` de antes: sin conflicto */
  const a = await repo14.abrir(o14);
  assert.equal(new Obra(a.obra).libroId, 'milibro');
  p14 = new Obra(a.obra);
  p14.titulo = 'Libro para Recursos 2';
  const g14 = await repo14.guardarObra(p14.aDatos(), crypto.randomUUID()); assert.ok(g14.ok, JSON.stringify(g14));
  assert.equal((await db.query('select rev from public.taller_obras where id = $1', [o14])).rows[0].rev, antes.rev + 1, 'un cambio de verdad si sube `rev`');
  assert.equal((await db.query('select libro_id from public.taller_obras where id = $1', [o14])).rows[0].libro_id, 'milibro', 'el autoguardado no toca libro_id');
  assert.equal((await repo14.obras()).filas.find((f) => f.id === o14).libroId, 'milibro');
});
await ok('014: el libro de Recursos no cambia, no lo usan dos libros, y los ids protegidos y los de otro libro no entran', async () => {
  /* publicado en Recursos (o en borrador): a la base de verdad le da igual quien pregunte, no cambia */
  await db.query(`insert into public.biblioteca (id) values ('milibro')`);
  await assert.rejects(db.query(`update public.taller_obras set libro_id = 'otro' where id = $1`, [o14]), /no cambia/);
  await assert.rejects(db.query(`update public.taller_obras set libro_id = null where id = $1`, [o14]), /no cambia/);
  assert.deepEqual(await repo14.vincularLibro(o14, 'otro'), { error: 'idCambia' });
  /* otro libro del Taller no puede quedarse con el mismo id (indice unico) */
  const o2 = (await repo14.crearObra(new Obra({ titulo: 'Segundo', pagina: new ConfigPagina({}).aDatos() }).aDatos())).id;
  assert.deepEqual(await repo14.vincularLibro(o2, 'milibro'), { error: 'idOcupado' });
  await assert.rejects(db.query(`update public.taller_obras set libro_id = 'milibro' where id = $1`, [o2]), (x) => x.code === '23505');
  /* protegidos y mal escritos: nunca */
  for (const id of ['ahava', 'ahavah', 'agapi', 'agape', 'emet', 'rhema', 'top', 'book', 'Mal Id', 'con-guion', '9libro', '', 'a'.repeat(41)]) assert.deepEqual(await repo14.vincularLibro(o2, id), { error: 'idNoValido' }, id);
  /* el id de OTRO libro de Recursos (publicado, quitado o en borrador) */
  await db.query(`insert into public.biblioteca (id) values ('libreria')`);
  await db.query(`insert into public.borradores (tabla, id) values ('biblioteca', 'enborrador')`);
  assert.deepEqual(await repo14.vincularLibro(o2, 'libreria'), { error: 'idOcupado' });
  assert.deepEqual(await repo14.vincularLibro(o2, 'enborrador'), { error: 'idOcupado' });
  assert.equal((await db.query('select libro_id from public.taller_obras where id = $1', [o2])).rows[0].libro_id, null, 'nada se quedo a medias');
  assert.deepEqual(await repo14.vincularLibro(o2, 'otroquelibre'), { ok: true });
  /* mientras NO exista en Recursos, se puede cambiar o quitar (un fallo a medias no lo deja fijo para siempre) */
  assert.deepEqual(await repo14.desvincularLibro(o2), { ok: true });
  assert.deepEqual(await repo14.libroDe(o2), { ok: true, libroId: '' });
  assert.deepEqual(await repo14.vincularLibro(o2, 'otroquelibre'), { ok: true });
  const rev2 = async () => (await db.query('select rev from public.taller_obras where id = $1', [o2])).rows[0].rev;
  const r0 = await rev2();
  await db.query(`update public.taller_obras set libro_id = 'cambiado' where id = $1`, [o2]);
  assert.equal(await rev2(), r0, 'solo libro_id: rev igual');
  await db.query(`update public.taller_obras set libro_id = 'otroquelibre', titulo = 'Segundo, otro titulo' where id = $1`, [o2]);
  assert.equal(await rev2(), r0 + 1, 'libro_id Y otra cosa: rev sube');
  await db.query(`update public.taller_obras set libro_id = 'cambiado' where id = $1`, [o2]);
  await db.query(`update public.taller_obras set libro_id = 'otroquelibre' where id = $1`, [o2]);
  await db.query(`insert into public.borradores (tabla, id) values ('biblioteca', 'otroquelibre')`);
  await assert.rejects(db.query(`update public.taller_obras set libro_id = null where id = $1`, [o2]), /no cambia/);
  assert.deepEqual(await repo14.desvincularLibro(o2), { error: 'permiso' }, 'con un borrador en Recursos ya es suyo');
  await db.query(`update public.taller_obras set libro_id = 'otroquelibre' where id = $1`, [o2]);
  assert.deepEqual(await repo14.vincularLibro('00000000-0000-4000-8000-000000000000', 'xx'), { error: 'noExiste' });
});
await ok('014: copiar a Recursos: solo el PDF de una edicion de ESTE libro, solo a libros/<su id>/<idioma>-<azar>.pdf', async () => {
  const e = await repo14.crearEdicion({ obraId: o14, titulo: 'T', idioma: 'es', paginas: 1, ratio: 0.7, hojas: [{ text: '' }] });
  ed14 = e.id;
  llamadas.length = 0;
  const r = await repo14.copiarARecursos(o14, ed14, 'milibro', 'es', { azar: AZAR14 });
  assert.deepEqual(r, { ok: true, ruta: 'libros/milibro/es-abc123def456.pdf' });
  assert.deepEqual(llamadas, [{ cajon: 'taller', a: `${o14}/ediciones/${ed14}/original.pdf`, b: 'milibro/es-abc123def456.pdf', o: { destinationBucket: 'libros' } }]);
  const { Libro } = await import('../src/scripts/contenido/Libro.js');
  assert.ok(Libro.esPdfDe(r.ruta, 'milibro', 'es'));
  llamadas.length = 0;
  /* una edicion de OTRO libro, un libro que no es el vinculado, un idioma raro: no se copia nada */
  const o3 = (await repo14.crearObra(new Obra({ titulo: 'Tercero', pagina: new ConfigPagina({}).aDatos() }).aDatos())).id;
  const e3 = await repo14.crearEdicion({ obraId: o3, titulo: 'T', paginas: 1, ratio: 0.7, hojas: [{ text: '' }] });
  assert.deepEqual(await repo14.copiarARecursos(o14, e3.id, 'milibro', 'es', { azar: AZAR14 }), { error: 'noExiste' });
  assert.deepEqual(await repo14.copiarARecursos(o14, ed14, 'otro', 'es', { azar: AZAR14 }), { error: 'idNoVinculado' });
  assert.deepEqual(await repo14.copiarARecursos(o3, e3.id, 'milibro', 'es', { azar: AZAR14 }), { error: 'idNoVinculado' }, 'el id de OTRO libro');
  assert.deepEqual(await repo14.copiarARecursos(o3, e3.id, 'ahava', 'es', { azar: AZAR14 }), { error: 'idNoVinculado' });
  assert.deepEqual(await repo14.copiarARecursos(o14, ed14, 'milibro', 'xx-no', { azar: AZAR14 }), { error: 'archivoRuta' });
  assert.deepEqual(await repo14.copiarARecursos(o14, ed14, 'milibro', 'es', { azar: () => '../../x' }), { error: 'archivoRuta' });
  assert.deepEqual(llamadas, [], 'ninguna de esas llego al almacen');
  /* y el planificador, solo: origen ajeno, ids protegidos, destino que no es de ese libro */
  const { planDeCopia } = await import('../src/scripts/contenido/taller/Recursos.js');
  const base = { obraId: o14, edicionId: ed14, edicionPdf: `taller/${o14}/ediciones/${ed14}/original.pdf`, libroId: 'milibro', lang: 'es', azar: AZAR14 };
  assert.ok(planDeCopia(base).origen);
  for (const malo of [{ edicionPdf: `taller/${o3}/ediciones/${ed14}/original.pdf` }, { edicionPdf: 'taller/../x.pdf' }, { edicionPdf: `taller/${o14}/pdf/original-abc.pdf` }, { edicionPdf: `libros/milibro/es.pdf` }, { edicionPdf: undefined },
    { obraId: '../x' }, { edicionId: 'x' }, { lang: 'es.pdf' }, { lang: '' }]) assert.equal(planDeCopia({ ...base, ...malo }).error, 'archivoRuta', JSON.stringify(malo));
  for (const id of ['ahava', 'ahavah', 'agapi', 'agape', 'emet', 'rhema', 'top', 'Milibro', 'mi-libro', '']) assert.equal(planDeCopia({ ...base, libroId: id }).error, 'idNoValido', id);
  for (const azar of [() => '', () => 'ab', () => 'x'.repeat(20), () => 'AB CD1234']) assert.equal(planDeCopia({ ...base, azar }).error, 'archivoRuta');
});
await ok('014: borrar la edicion o el libro NO toca el vinculo ni nada de Recursos (es una copia aparte)', async () => {
  llamadas.length = 0;
  assert.ok((await repo14.borrarEdicion(ed14)).ok);
  assert.deepEqual(await repo14.libroDe(o14), { ok: true, libroId: 'milibro' });
  assert.deepEqual(llamadas, []);
  assert.ok((await repo14.borrarObra(o14)).ok);
  assert.equal((await db.query(`select count(*)::int as n from public.biblioteca`)).rows[0].n, 2, 'la base del Taller no escribe en biblioteca (solo estan las dos de la prueba)');
  for (const f of (await repo14.obras()).filas) if (f.id !== id) await repo14.borrarObra(f.id);
});
await ok('014: ni funciones sin search_path ni «security definer» nuevas, y el indice unico y los tres disparadores estan', async () => {
  for (const f of ['taller_libro_fijo', 'taller_subir_rev']) {
    const x = (await db.query(`select prosecdef, proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and proname = $1`, [f])).rows[0];
    assert.equal(x.prosecdef, false, f);
    assert.ok(x.proconfig.some((c) => c.startsWith('search_path=')), f);
  }
  assert.equal((await db.query(`select 1 from pg_indexes where indexname = 'taller_obras_libro_id_unico'`)).rows.length, 1);
  assert.equal((await db.query(`select 1 from pg_constraint where conrelid = 'public.taller_obras'::regclass and contype = 'f'`)).rows.length, 0, 'sin llave foranea a biblioteca');
  assert.deepEqual((await db.query(`select tgname from pg_trigger where tgrelid = 'public.taller_obras'::regclass and not tgisinternal order by 1`)).rows.map((r) => r.tgname), ['taller_obras_editado', 'taller_obras_libro_fijo', 'taller_obras_rev']);
  for (const rol of ['anon', 'authenticated']) assert.equal((await db.query(`select has_function_privilege($1, 'public.taller_libro_fijo()', 'execute') as v`, [rol])).rows[0].v, false, rol);
});
await ok('borrar el libro borra sus capitulos y copias', async () => {
  assert.ok((await repo.borrarObra(id)).ok);
  assert.equal((await repo.obras()).filas.length, 0);
  assert.equal((await db.query('select 1 from public.taller_capitulos')).rows.length, 0);
});
console.log(`\n${bien} bien, ${mal} mal`);
await db.close();
if (mal) process.exit(1);
