/* DONDE VIVE EL TALLER. El panel solo conoce esta forma; nada lanza: todo devuelve `{ ok }` o
   `{ error }`.

     obras() · abrir(obraId) · crearObra(datos) · guardarObra(datos, pestana) · borrarObra(id)
     crearCapitulo(obraId, titulo) · guardarCapitulo(datos, pestana) · ordenar(obraId, ids) · borrarCapitulo(id)
     crearPieza(datos) · guardarPieza(datos, pestana) · borrarPieza(id)
     copia(obraId, motivo, nombre) · versiones(obraId) · restaurar(versionId)

   DOS PESTAÑAS NO SE PISAN. Cada fila lleva `rev`, que la base sube sola, y `pestana`, quien
   guardo. Se guarda SOLO si `rev` sigue siendo la que se leyo. Si no, `decidir` mira quien
   escribio: si fui yo (mi guardado anterior llego tarde) se sigue; si fue otra, es un conflicto
   y nunca se sobrescribe en silencio. */
import { deFila } from '../comun.js';
import { VERSION_CONTENIDO } from './Migrar.js';

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
  constructor() { this.obrasM = new Map(); this.capitulosM = new Map(); this.piezasM = new Map(); this.versionesL = []; }

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
    const r = await this.pedir(this.sb.from('taller_obras').select('id,titulo,editado').order('editado', { ascending: false }).limit(200));
    return r.error ? r : { ok: true, filas: r.data };
  }
  async abrir(id) {
    const [o, c, p] = await Promise.all([
      this.pedir(this.sb.from('taller_obras').select('id,titulo,idioma,pagina,fuentes,rev').eq('id', id).maybeSingle()),
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
}
