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
  create role anon nologin; create role authenticated nologin;
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
  valor(k) { const v = this.valores[k]; return k !== 'fuentes' && v !== null && typeof v === 'object' ? JSON.stringify(v) : v; }
  async correr() {
    const p = [], donde = () => (this.filtros.length ? ' where ' + this.filtros.map(([k, v]) => { p.push(v); return `${ident(k)} = $${p.length}`; }).join(' and ') : '');
    const t = `public.${ident(this.tabla)}`, cols = (c) => c.split(',').map((x) => ident(x.trim())).join(',');
    const vuelta = this.vuelve ? ` returning ${cols(this.vuelve)}` : '';
    let q;
    if (this.accion === 'select') q = `select ${this.columnas === '*' ? '*' : cols(this.columnas)} from ${t}${donde()}${this.orden.length ? ` order by ${this.orden.join(',')}` : ''}${this.tope ? ` limit ${this.tope}` : ''}`;
    if (this.accion === 'insert') { const k = Object.keys(this.valores); q = `insert into ${t} (${k.map(ident).join(',')}) values (${k.map((x) => { p.push(this.valor(x)); return `$${p.length}`; }).join(',')})${vuelta}`; }
    if (this.accion === 'update') { const k = Object.keys(this.valores); q = `update ${t} set ${k.map((x) => { p.push(this.valor(x)); return `${ident(x)} = $${p.length}`; }).join(',')}${donde()}${vuelta}`; }
    if (this.accion === 'delete') q = `delete from ${t}${donde()}`;
    try {
      const r = await db.query(q, p);
      let data = r.rows;
      if (this.una) { if (data.length > 1 || (this.una === 'una' && !data.length)) return { data: null, error: { code: 'PGRST116' } }; data = data[0] || null; }
      return { data, error: null };
    } catch (e) { return { data: null, error: { code: e.code || 'XX', message: e.message } }; }
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
await ok('borrar el libro borra sus capitulos y copias', async () => {
  assert.ok((await repo.borrarObra(id)).ok);
  assert.equal((await repo.obras()).filas.length, 0);
  assert.equal((await db.query('select 1 from public.taller_capitulos')).rows.length, 0);
});
console.log(`\n${bien} bien, ${mal} mal`);
await db.close();
if (mal) process.exit(1);
