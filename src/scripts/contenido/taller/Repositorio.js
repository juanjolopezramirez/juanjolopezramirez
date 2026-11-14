/* DONDE VIVE EL TALLER. El panel solo conoce esta forma; nada lanza: todo devuelve `{ ok }` o
   `{ error }`.

     obras() · abrir(obraId) · crearObra(datos) · guardarObra(datos, pestana) · borrarObra(id)
     crearCapitulo(obraId, titulo) · guardarCapitulo(datos, pestana) · ordenar(obraId, ids) · borrarCapitulo(id)
     crearPieza(datos) · guardarPieza(datos, pestana) · borrarPieza(id)
     copia(obraId, motivo, nombre) · versiones(obraId) · restaurar(versionId)
     ediciones(obraId) · crearEdicion(datos) · borrarEdicion(id)            (supabase/013_publicar.sql)
     enlaces(edicionId) · crearEnlace(datos) · apagarEnlace(id)
     libroDe(obraId) · vincularLibro(obraId, libroId) · desvincularLibro(obraId) · copiarARecursos(obraId, edicionId, libroId, lang)
     quitarPdfDeRecursos(obraId, libroId, ruta)   (014)

   DOS PESTAÑAS NO SE PISAN. Cada fila lleva `rev`, que la base sube sola, y `pestana`, quien
   guardo. Se guarda SOLO si `rev` sigue siendo la que se leyo. Si no, `decidir` mira quien
   escribio: si fui yo (mi guardado anterior llego tarde) se sigue; si fue otra, es un conflicto
   y nunca se sobrescribe en silencio. */
import { deFila } from '../comun.js';
import { VERSION_CONTENIDO } from './Migrar.js';
import { DIAS_MAX, NOMBRE_MAX } from './Enlaces.js';
import { nombrePdfDeRecursos, planDeCopia, veredictoDeId } from './Recursos.js';

export function decidir(actual, pestana) {
  if (!actual) return { error: 'permiso' };
  return actual.pestana === pestana ? { reintentar: true, rev: actual.rev } : { error: 'conflicto', rev: actual.rev };
}

const nuevoId = () => crypto.randomUUID();
/* Un capitulo nace vacio: su nombre es el primer titulo que escriba el autor, nunca uno puesto por el sistema */
const contenidoNuevo = () => ({ version: VERSION_CONTENIDO, doc: { type: 'doc', content: [{ type: 'paragraph' }] } });
const copiaProfunda = (v) => JSON.parse(JSON.stringify(v));
const COPIAS_AUTO = 30;

/* EN MEMORIA: la misma forma, para probar en Node y en el modo demo */
export class RepositorioTallerMemoria {
  constructor() { this.obrasM = new Map(); this.capitulosM = new Map(); this.piezasM = new Map(); this.versionesL = []; this.edicionesM = new Map(); this.enlacesM = new Map(); this.reloj = () => Date.now();
    /* Los dos pies de la demo y las pruebas: ¿hay ya algo con ese id en Recursos? y copiar un archivo de un cajon a otro */
    this.libroOcupado = async () => false;
    this.copiarArchivo = async () => ({ ok: true });
    this.quitarArchivoRecursos = async () => ({ ok: true });
  }

  async obras() {
    return { ok: true, filas: [...this.obrasM.values()].map(copiaProfunda) };
  }
  async abrir(id) {
    const obra = this.obrasM.get(id);
    if (!obra) return { error: 'noExiste' };
    const de = (m) => [...m.values()].filter((x) => x.obraId === id).map(copiaProfunda);
    return { ok: true, obra: copiaProfunda(obra), capitulos: de(this.capitulosM).sort((a, b) => a.orden - b.orden), piezas: de(this.piezasM) };
  }
  async crearObra(datos) {
    const id = datos.id || nuevoId();
    const fila = { ...copiaProfunda(datos), id, rev: 1, pestana: null };
    this.obrasM.set(id, fila);
    await this.crearCapitulo(id);
    return { ok: true, id };
  }
  guardar(mapa, datos, pestana) {
    const a = mapa.get(datos.id);
    if (!a) return { error: 'noExiste' };
    if (a.rev !== datos.rev) return decidir(a, pestana);
    const rev = a.rev + 1;
    /* Como en la base: guardar un capitulo no toca su lugar en el libro */
    const { orden, ...resto } = copiaProfunda(datos);
    mapa.set(datos.id, { ...a, ...resto, ...(mapa === this.capitulosM ? {} : { orden }), rev, pestana });
    return { ok: true, rev };
  }
  async guardarObra(datos, pestana) { return this.guardar(this.obrasM, datos, pestana); }
  quitarFilas(id) {
    const habia = this.obrasM.delete(id);
    for (const m of [this.capitulosM, this.piezasM]) for (const [k, v] of m) if (v.obraId === id) m.delete(k);
    return habia;
  }
  async borrarObra(id) {
    if (!this.quitarFilas(id)) return { error: 'noExiste' };
    /* Como en la base (on delete cascade): sus copias se van con el */
    this.versionesL = this.versionesL.filter((v) => v.obraId !== id);
    for (const e of [...this.edicionesM.values()]) if (e.obraId === id) this.quitarEdicion(e.id);
    return { ok: true };
  }
  async crearCapitulo(obraId, titulo = '') {
    const id = nuevoId();
    const orden = [...this.capitulosM.values()].filter((c) => c.obraId === obraId).length;
    const fila = { id, obraId, orden, titulo, contenido: contenidoNuevo(), letras: 0, rev: 1, pestana: null };
    this.capitulosM.set(id, fila);
    return { ok: true, fila: copiaProfunda(fila) };
  }
  async guardarCapitulo(datos, pestana) { return this.guardar(this.capitulosM, datos, pestana); }
  async ordenar(_, ids) {
    ids.forEach((id, i) => { const c = this.capitulosM.get(id); if (c) c.orden = i; });
    return { ok: true };
  }
  async borrarCapitulo(id) { this.capitulosM.delete(id); return { ok: true }; }
  async crearPieza(datos) {
    const id = datos.id || nuevoId();
    this.piezasM.set(id, { ...copiaProfunda(datos), id, rev: 1, pestana: null });
    return { ok: true, id };
  }
  async guardarPieza(datos, pestana) { return this.guardar(this.piezasM, datos, pestana); }
  async borrarPieza(id) { this.piezasM.delete(id); return { ok: true }; }

  async copia(obraId, motivo, nombre = '') {
    const r = await this.abrir(obraId);
    if (r.error) return r;
    const texto = JSON.stringify([r.obra, r.capitulos, r.piezas]);
    const ultima = this.versionesL.find((v) => v.obraId === obraId);
    if (motivo === 'auto' && ultima && ultima.huella === texto) return { ok: true, omitida: true };
    this.versionesL.unshift({ id: nuevoId(), obraId, motivo, nombre, creado: new Date().toISOString(), huella: texto, copia: copiaProfunda(r) });
    const auto = this.versionesL.filter((v) => v.obraId === obraId && v.motivo === 'auto');
    for (const v of auto.slice(COPIAS_AUTO)) this.versionesL.splice(this.versionesL.indexOf(v), 1);
    return { ok: true };
  }
  async versiones(obraId) {
    return { ok: true, filas: this.versionesL.filter((v) => v.obraId === obraId).map(({ id, motivo, nombre, creado }) => ({ id, motivo, nombre, creado })) };
  }
  /* ---- Compartir (supabase/013_publicar.sql): ediciones y enlaces. Las mismas reglas que la base. ---- */
  quitarEdicion(id) {
    this.edicionesM.delete(id);
    for (const [k, v] of this.enlacesM) if (v.edicionId === id) this.enlacesM.delete(k);
  }
  async ediciones(obraId) {
    /* Las mas nuevas primero; con la misma hora (dos seguidas), la ultima que se hizo */
    const filas = [...this.edicionesM.values()].filter((e) => e.obraId === obraId).map((e, i) => [e, i])
      .sort((a, b) => (a[0].creado < b[0].creado ? 1 : a[0].creado > b[0].creado ? -1 : b[1] - a[1])).map(([e]) => e)
      .map(({ id, titulo, idioma, paginas, ratio, blando, creado }) => ({ id, titulo, idioma, paginas, ratio, blando, creado }));
    return { ok: true, filas };
  }
  async crearEdicion(d) {
    if (!this.obrasM.has(d.obraId)) return { error: 'noExiste' };
    const paginas = d.paginas, hojas = copiaProfunda(d.hojas);
    if (!Number.isInteger(paginas) || paginas < 1 || paginas > 300 || !Array.isArray(hojas) || hojas.length !== paginas) return { error: 'lleno' };
    if (!(d.ratio > 0.2 && d.ratio < 5) || !d.titulo || d.titulo.length > 200 || JSON.stringify(hojas).length > 4000000) return { error: 'lleno' };
    const id = d.id || nuevoId();
    const carpeta = `taller/${d.obraId}/ediciones/${id}/`;
    this.edicionesM.set(id, { id, obraId: d.obraId, titulo: d.titulo, idioma: d.idioma || 'es', paginas, ratio: d.ratio, blando: d.blando !== false, carpeta, pdf: `${carpeta}original.pdf`, hojas, creado: new Date(this.reloj()).toISOString() });
    return { ok: true, id, carpeta };
  }
  async borrarEdicion(id) {
    if (!this.edicionesM.has(id)) return { error: 'noExiste' };
    this.quitarEdicion(id);
    return { ok: true };
  }
  async enlaces(edicionId) {
    const filas = [...this.enlacesM.values()].filter((e) => e.edicionId === edicionId)
      .sort((a, b) => (a.creado < b.creado ? 1 : a.creado > b.creado ? -1 : 0))
      .map(({ hash, ...resto }) => ({ ...resto }));
    return { ok: true, filas };
  }
  /* `hash` es el bytea de la huella: una barra, una x y 64 letras. Como en la base, la hora y los contadores los pone ella */
  async crearEnlace(d) {
    if (!this.edicionesM.has(d.edicionId)) return { error: 'noExiste' };
    if (typeof d.hash !== 'string' || !/^\\x[0-9a-f]{64}$/.test(d.hash)) return { error: 'lleno' };
    if ([...this.enlacesM.values()].some((e) => e.hash === d.hash)) return { error: 'generico' };
    const nombre = String(d.nombre || '');
    if (nombre.length > NOMBRE_MAX) return { error: 'lleno' };
    const ahora = this.reloj();
    const quiere = Date.parse(d.vence);
    if (!Number.isFinite(quiere) || quiere <= ahora) return { error: 'lleno' };
    const vence = new Date(Math.min(quiere, ahora + DIAS_MAX * 86400000)).toISOString();
    const id = d.id || nuevoId();
    this.enlacesM.set(id, { id, edicionId: d.edicionId, hash: d.hash, nombre, creado: new Date(ahora).toISOString(), vence, revocado: false, vistas: 0, ultimaVista: null });
    return { ok: true, id, vence };
  }
  /* Solo se apaga: un enlace apagado no se enciende */
  async apagarEnlace(id) {
    const e = this.enlacesM.get(id);
    if (!e) return { error: 'noExiste' };
    e.revocado = true;
    return { ok: true };
  }

  /* ---- Publicar en Recursos (supabase/014_recursos.sql): el vinculo con el libro de Recursos ---- */
  async libroDe(obraId) {
    const o = this.obrasM.get(obraId);
    return o ? { ok: true, libroId: o.libroId || '' } : { error: 'noExiste' };
  }
  /* Se pone una vez y no cambia; ponerlo no sube `rev` (como la base) */
  async vincularLibro(obraId, libroId) {
    const o = this.obrasM.get(obraId);
    if (!o) return { error: 'noExiste' };
    const hayOtraObra = [...this.obrasM.values()].some((x) => x.id !== obraId && x.libroId === libroId);
    const hayEnBiblioteca = !o.libroId && !hayOtraObra ? !!(await this.libroOcupado(libroId)) : false;
    const v = veredictoDeId(libroId, { propio: o.libroId || '', hayOtraObra, hayEnBiblioteca });
    if (v.error) return { error: v.error };
    o.libroId = libroId;
    return { ok: true };
  }
  /* Soltar el vinculo: solo mientras el libro NO exista en Recursos (como la base): si un publicar fallo a medias, no queda fijo */
  async desvincularLibro(obraId) {
    const o = this.obrasM.get(obraId);
    if (!o) return { error: 'noExiste' };
    if (o.libroId && (await this.libroOcupado(o.libroId))) return { error: 'permiso' };
    o.libroId = '';
    return { ok: true };
  }
  /* Quitar de `libros` el PDF que se acaba de copiar (o el anterior): solo uno de ESTE libro de Recursos, ruta exacta */
  async quitarPdfDeRecursos(obraId, libroId, ruta) {
    const l = await this.libroDe(obraId);
    if (l.error) return l;
    if (!l.libroId || l.libroId !== libroId) return { error: 'idNoVinculado' };
    if (!nombrePdfDeRecursos(libroId, ruta)) return { error: 'archivoRuta' };
    return this.quitarArchivoRecursos(ruta);
  }
  /* El PDF de la edicion → libros/<id>/<idioma>-<azar>.pdf. Origen y destino salen de planDeCopia: nunca una ruta libre. */
  async copiarARecursos(obraId, edicionId, libroId, lang, { azar } = {}) {
    const l = await this.libroDe(obraId);
    if (l.error) return l;
    if (!l.libroId || l.libroId !== libroId) return { error: 'idNoVinculado' };
    const e = this.edicionesM.get(edicionId);
    if (!e || e.obraId !== obraId) return { error: 'noExiste' };
    const plan = planDeCopia({ obraId, edicionId, edicionPdf: e.pdf, libroId, lang, ...(azar ? { azar } : {}) });
    if (plan.error) return plan;
    const c = await this.copiarArchivo(plan.origen, plan.destino);
    return c && c.error ? c : { ok: true, ruta: plan.destino };
  }
  /* LO QUE HACE LA FUNCION DE BORDE (supabase/functions/vista), para el modo demo y las pruebas */
  buscarEnlace(hash) { return [...this.enlacesM.values()].find((e) => e.hash === hash) || null; }

  async restaurar(id) {
    const v = this.versionesL.find((x) => x.id === id);
    if (!v) return { error: 'noExiste' };
    await this.copia(v.obraId, 'restaurar', '');
    const { obra, capitulos, piezas } = copiaProfunda(v.copia);
    /* Como en la base: `rev` sigue subiendo y `pestana` queda vacia, asi otra pestaña recibe conflicto */
    const revs = new Map([...this.obrasM, ...this.capitulosM, ...this.piezasM].map(([k, x]) => [k, x.rev]));
    const subir = (x) => ({ ...x, rev: (revs.get(x.id) || 0) + 1, pestana: null });
    this.quitarFilas(v.obraId);
    this.obrasM.set(obra.id, subir(obra));
    capitulos.forEach((c) => this.capitulosM.set(c.id, subir(c)));
    piezas.forEach((p) => this.piezasM.set(p.id, subir(p)));
    return { ok: true };
  }
}

/* EN LA BASE (supabase/012_taller.sql). Las reglas estan alla: esto solo pregunta. */
const CAMPOS = {
  obra: ({ id, titulo, idioma, pagina, fuentes }) => ({ id, titulo, idioma, pagina, fuentes }),
  capitulo: ({ titulo, contenido, letras }) => ({ titulo, contenido, letras }),
  pieza: ({ nombre, estado, pdf, anchoMm, altoMm, dpi, ajuste, paginas }) => ({ nombre, estado, pdf, ancho_mm: anchoMm, alto_mm: altoMm, dpi, ajuste, paginas })
};
/* Si la red falla, el cliente de Supabase no lanza: devuelve un error SIN codigo. Eso es «sin red»,
   y el guardado lo reintenta; confundirlo con otro error lo dejaria callado para siempre. */
const CLAVES = { 42501: 'permiso', P0002: 'noExiste', 23514: 'lleno', TA001: 'lleno' };
const claveError = (e) => (!e.code ? 'red' : CLAVES[e.code] || 'generico');

export class RepositorioTallerSupabase {
  constructor(sb) { this.sb = sb; }

  async pedir(consulta) {
    try {
      const { data, error } = await consulta;
      return error ? { error: claveError(error) } : { ok: true, data };
    } catch (e) { return { error: 'red' }; }
  }

  async obras() {
    const r = await this.pedir(this.sb.from('taller_obras').select('id,titulo,editado,libro_id').order('editado', { ascending: false }).limit(200));
    return r.error ? r : { ok: true, filas: r.data.map(({ libro_id: libroId, ...resto }) => ({ ...resto, libroId: libroId || '' })) };
  }
  async abrir(id) {
    const [o, c, p] = await Promise.all([
      this.pedir(this.sb.from('taller_obras').select('id,titulo,idioma,pagina,fuentes,rev,libro_id').eq('id', id).maybeSingle()),
      this.pedir(this.sb.from('taller_capitulos').select('id,obra_id,orden,titulo,contenido,letras,rev').eq('obra_id', id).order('orden').order('id').limit(200)),
      this.pedir(this.sb.from('taller_piezas').select('id,obra_id,nombre,estado,pdf,ancho_mm,alto_mm,dpi,ajuste,paginas,rev').eq('obra_id', id).limit(500))
    ]);
    const mal = [o, c, p].find((x) => x.error);
    if (mal) return mal;
    if (!o.data) return { error: 'noExiste' };
    const pieza = (f) => ({ ...deFila(f), anchoMm: Number(f.ancho_mm), altoMm: Number(f.alto_mm) });
    return { ok: true, obra: o.data, capitulos: c.data.map(deFila), piezas: p.data.map(pieza) };
  }
  async crearObra(datos) {
    const id = nuevoId();
    const r = await this.pedir(this.sb.from('taller_obras').insert({ ...CAMPOS.obra(datos), id }));
    if (r.error) return r;
    const c = await this.crearCapitulo(id);
    return c.error ? c : { ok: true, id };
  }

  /* Guarda solo si `rev` no cambio. Sin fila: o cambio, o RLS no deja ver (la sesion se fue) */
  async cas(tabla, id, rev, fila, pestana) {
    const r = await this.pedir(this.sb.from(tabla).update({ ...fila, pestana }).eq('id', id).eq('rev', rev).select('rev'));
    if (r.error) return r;
    if (r.data.length) return { ok: true, rev: r.data[0].rev };
    const a = await this.pedir(this.sb.from(tabla).select('rev,pestana').eq('id', id).maybeSingle());
    return a.error ? a : decidir(a.data, pestana);
  }
  guardarObra(d, pestana) { return this.cas('taller_obras', d.id, d.rev, CAMPOS.obra(d), pestana); }
  guardarCapitulo(d, pestana) { return this.cas('taller_capitulos', d.id, d.rev, CAMPOS.capitulo(d), pestana); }
  guardarPieza(d, pestana) { return this.cas('taller_piezas', d.id, d.rev, CAMPOS.pieza(d), pestana); }

  /* Si las reglas no dejan borrar, la base no da error: borra cero filas. Por eso se pide la fila borrada */
  async borrarObra(id) {
    const r = await this.pedir(this.sb.from('taller_obras').delete().eq('id', id).select('id'));
    if (r.error) return r;
    return Array.isArray(r.data) && r.data.length === 1 ? { ok: true } : { error: 'noExiste' };
  }
  async borrarCapitulo(id) { return this.quitar('taller_capitulos', id); }
  async borrarPieza(id) { return this.quitar('taller_piezas', id); }
  async quitar(tabla, id) {
    const r = await this.pedir(this.sb.from(tabla).delete().eq('id', id));
    return r.error ? r : { ok: true };
  }
  async crearCapitulo(obraId, titulo = '') {
    const ya = await this.pedir(this.sb.from('taller_capitulos').select('orden').eq('obra_id', obraId).order('orden', { ascending: false }).limit(1));
    if (ya.error) return ya;
    const orden = ya.data.length ? ya.data[0].orden + 1 : 0;
    const contenido = contenidoNuevo();
    const r = await this.pedir(this.sb.from('taller_capitulos').insert({ obra_id: obraId, orden, titulo, contenido }).select('id,obra_id,orden,titulo,contenido,letras,rev').single());
    return r.error ? r : { ok: true, fila: deFila(r.data) };
  }
  async ordenar(obraId, ids) {
    const r = await this.pedir(this.sb.rpc('taller_ordenar', { p_obra: obraId, p_ids: ids }));
    return r.error ? r : { ok: true };
  }
  async crearPieza(d) {
    const r = await this.pedir(this.sb.from('taller_piezas').insert({ ...CAMPOS.pieza(d), id: d.id, obra_id: d.obraId }));
    return r.error ? r : { ok: true, id: d.id };
  }
  async copia(obraId, motivo, nombre = '') {
    const r = await this.pedir(this.sb.rpc('taller_copia', { p_obra: obraId, p_motivo: motivo, p_nombre: nombre }));
    return r.error ? r : { ok: true, omitida: r.data === false };
  }
  async versiones(obraId) {
    const r = await this.pedir(this.sb.from('taller_versiones').select('id,motivo,nombre,creado').eq('obra_id', obraId).order('creado', { ascending: false }).limit(200));
    return r.error ? r : { ok: true, filas: r.data };
  }
  async restaurar(id) {
    const r = await this.pedir(this.sb.rpc('taller_restaurar', { p_version: id }));
    return r.error ? r : { ok: true };
  }

  /* ---- Compartir (supabase/013_publicar.sql). Nunca se pide `hash` de vuelta ni `hojas` en una lista. ---- */
  async ediciones(obraId) {
    const r = await this.pedir(this.sb.from('taller_ediciones').select('id,titulo,idioma,paginas,ratio,blando,creado').eq('obra_id', obraId).order('creado', { ascending: false }).limit(20));
    return r.error ? r : { ok: true, filas: r.data.map((f) => ({ ...f, ratio: Number(f.ratio) })) };
  }
  async crearEdicion(d) {
    const id = d.id || nuevoId();
    const carpeta = `taller/${d.obraId}/ediciones/${id}/`;
    const r = await this.pedir(this.sb.from('taller_ediciones').insert({
      id, obra_id: d.obraId, titulo: d.titulo, idioma: d.idioma || 'es', paginas: d.paginas, ratio: d.ratio, blando: d.blando !== false,
      carpeta, pdf: `${carpeta}original.pdf`, hojas: d.hojas
    }));
    return r.error ? r : { ok: true, id, carpeta };
  }
  async borrarEdicion(id) {
    const r = await this.pedir(this.sb.from('taller_ediciones').delete().eq('id', id).select('id'));
    if (r.error) return r;
    return Array.isArray(r.data) && r.data.length === 1 ? { ok: true } : { error: 'noExiste' };
  }
  async enlaces(edicionId) {
    const r = await this.pedir(this.sb.from('taller_enlaces').select('id,edicion_id,nombre,creado,vence,revocado,vistas,ultima_vista').eq('edicion_id', edicionId).order('creado', { ascending: false }).limit(100));
    return r.error ? r : { ok: true, filas: r.data.map(deFila) };
  }
  async crearEnlace(d) {
    const id = d.id || nuevoId();
    const r = await this.pedir(this.sb.from('taller_enlaces').insert({ id, edicion_id: d.edicionId, hash: d.hash, nombre: d.nombre || '', vence: d.vence }).select('id,vence').single());
    return r.error ? r : { ok: true, id, vence: r.data.vence };
  }
  /* Si las reglas no dejan, la base no da error: cambia cero filas. Por eso se pide la fila */
  async apagarEnlace(id) {
    const r = await this.pedir(this.sb.from('taller_enlaces').update({ revocado: true }).eq('id', id).select('id'));
    if (r.error) return r;
    return Array.isArray(r.data) && r.data.length === 1 ? { ok: true } : { error: 'noExiste' };
  }

  /* ---- Publicar en Recursos (supabase/014_recursos.sql) ---- */
  async libroDe(obraId) {
    const r = await this.pedir(this.sb.from('taller_obras').select('libro_id').eq('id', obraId).maybeSingle());
    if (r.error) return r;
    return r.data ? { ok: true, libroId: r.data.libro_id || '' } : { error: 'noExiste' };
  }
  /* ¿Hay ya algo con ese id en Recursos (publicado, quitado, o en borrador)? */
  async enBiblioteca(id) {
    try {
      const [a, b] = await Promise.all([
        this.sb.from('biblioteca').select('id').eq('id', id).maybeSingle(),
        this.sb.from('borradores').select('id').eq('tabla', 'biblioteca').eq('id', id).maybeSingle()
      ]);
      if (a.error || b.error) return { error: claveError(a.error || b.error) };
      return { ok: true, hay: !!(a.data || b.data) };
    } catch (e) { return { error: 'red' }; }
  }
  /* Se pone una vez y no cambia: el indice unico de 014 cierra la puerta a dos libros con el mismo id */
  async vincularLibro(obraId, libroId) {
    const l = await this.libroDe(obraId);
    if (l.error) return l;
    let hay = false;
    if (!l.libroId) {
      const b = await this.enBiblioteca(libroId);
      if (b.error) return b;
      hay = b.hay;
    }
    const v = veredictoDeId(libroId, { propio: l.libroId, hayEnBiblioteca: hay });
    if (v.error) return { error: v.error };
    if (v.propio) return { ok: true };
    try {
      const { data, error } = await this.sb.from('taller_obras').update({ libro_id: libroId }).eq('id', obraId).select('id');
      if (error) return { error: error.code === '23505' ? 'idOcupado' : claveError(error) };
      return Array.isArray(data) && data.length === 1 ? { ok: true } : { error: 'noExiste' };
    } catch (e) { return { error: 'red' }; }
  }
  async desvincularLibro(obraId) {
    try {
      const { data, error } = await this.sb.from('taller_obras').update({ libro_id: null }).eq('id', obraId).select('id');
      if (error) return { error: claveError(error) };
      return Array.isArray(data) && data.length === 1 ? { ok: true } : { error: 'noExiste' };
    } catch (e) { return { error: 'red' }; }
  }
  /* Quita de `libros` UN PDF de ESTE libro de Recursos: la ruta exacta, de la forma libros/<su id>/<idioma>[-<azar>].pdf */
  async quitarPdfDeRecursos(obraId, libroId, ruta) {
    const l = await this.libroDe(obraId);
    if (l.error) return l;
    if (!l.libroId || l.libroId !== libroId) return { error: 'idNoVinculado' };
    const nombre = nombrePdfDeRecursos(libroId, ruta);
    if (!nombre) return { error: 'archivoRuta' };
    try {
      const { error } = await this.sb.storage.from('libros').remove([nombre]);
      return error ? { error: 'subida' } : { ok: true };
    } catch (e) { return { error: 'red' }; }
  }
  /* Copia el PDF de una edicion a `libros/<id>/<idioma>-<azar>.pdf` DENTRO del almacen (sin bajarlo). El origen sale de la
     fila de la edicion (de ESTE libro) y el destino de planDeCopia; el libro de Recursos tiene que ser el vinculado. */
  async copiarARecursos(obraId, edicionId, libroId, lang, { azar } = {}) {
    const l = await this.libroDe(obraId);
    if (l.error) return l;
    if (!l.libroId || l.libroId !== libroId) return { error: 'idNoVinculado' };
    const r = await this.pedir(this.sb.from('taller_ediciones').select('pdf').eq('id', edicionId).eq('obra_id', obraId).maybeSingle());
    if (r.error) return r;
    if (!r.data) return { error: 'noExiste' };
    const plan = planDeCopia({ obraId, edicionId, edicionPdf: r.data.pdf, libroId, lang, ...(azar ? { azar } : {}) });
    if (plan.error) return plan;
    try {
      const { error } = await this.sb.storage.from('taller').copy(plan.nombreOrigen, plan.nombreDestino, { destinationBucket: 'libros' });
      return error ? { error: 'subida' } : { ok: true, ruta: plan.destino };
    } catch (e) { return { error: 'red' }; }
  }
}
