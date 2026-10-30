/* Guardar y leer el contenido de Developer-Mode. Dos repositorios con la misma cara:

     RepositorioSupabase  la base de verdad (supabase/007 y 008: escribe solo el admin con su
                          codigo; la web lee solo lo publicado)
     RepositorioMemoria   la demostracion (?demo=admin) y las pruebas: nada sale de la pagina

   DOS SITIOS (008), y por eso un borrador nunca se cuela en la web:
     · la tabla de su clase (biblioteca, casas, etapas): solo lo COMPLETO, al publicarlo;
     · la tabla «borradores»: lo que se guarda a medias, o los cambios a algo ya publicado
       que aun no se publican. Solo la ve el admin.

   Cada cosa de la lista es una ENTRADA: lo que hay en la web (`enBase`, o null) y su
   borrador (`borrador`, o null). Las acciones:
     guardarBorrador(obj, { nuevo })   a medias vale (validar({ borrador: true }))
     publicar(obj)                     completo (validar()): a su tabla con publicado, y su borrador se va
     quitarDeLaWeb(id)                 sigue en su tabla, sin publicar
     descartar(id)                     se va el borrador (vuelve lo publicado)
     borrar(id)                        se va todo

   Nada lanza: { ok: true } o { error: '<clave>' }, como portal/real.js. `Tipo` es la clase
   (Libro, Trabajo, Proyecto, Etapa): de ella salen la tabla y, en las casas, la `clase`. */

const invalido = (r) => ({ error: 'invalido', errores: r.errores, avisos: r.avisos, faltan: r.faltan || [] });

/* Un error de la base, en una palabra que el panel sabe decir. */
export function claveDeErrorBase(error) {
  const codigo = error && typeof error.code === 'string' ? error.code : '';
  if (codigo === '42501' || codigo === 'PGRST301' || codigo === 'PGRST302') return 'permiso';
  if (codigo === '23505') return 'repetido';
  if (codigo === '23514' || codigo === '22P02' || codigo === '23502') return 'invalido';
  /* (sin red, supabase-js trae el TypeError del navegador en el mensaje) */
  if (error && /TypeError|NetworkError|network|Load failed/i.test(String(error.message || ''))) return 'red';
  return 'generico';
}

/* Lo que hay de una cosa: lo publicado (o lo que estuvo y se quito) y su borrador. */
export class Entrada {
  constructor(id, enBase, borrador) {
    this.id = id;
    this.enBase = enBase || null;
    this.borrador = borrador || null;
  }
  /* Lo que se edita: el borrador si lo hay, si no lo que esta en su tabla */
  get actual() { return this.borrador || this.enBase; }
  get publicado() { return !!(this.enBase && this.enBase.publicado); }
  /*  borrador    solo borrador (nunca publicado, o quitado y con cambios)
      publicado   en la web, sin cambios pendientes
      cambios     en la web, y con un borrador que aun no se publica
      fuera       estuvo en la web y se quito (sin borrador) */
  get estado() {
    if (this.publicado) return this.borrador ? 'cambios' : 'publicado';
    return this.borrador || !this.enBase ? 'borrador' : 'fuera';
  }
}

const juntar = (Tipo, filas, borradores) => {
  const ids = [...new Set([...filas.map((f) => f.id), ...borradores.map((b) => b.id)])];
  const de = (lista, id) => lista.find((x) => x.id === id);
  return ids.map((id) => {
    const f = de(filas, id);
    const b = de(borradores, id);
    return new Entrada(id, f ? Tipo.deFila(f) : null, b ? Tipo.deFila({ ...b.fila, id }) : null);
  }).sort((a, b) => (a.actual.orden - b.actual.orden) || a.id.localeCompare(b.id));
};

export class RepositorioMemoria {
  /* `compartido`: las casas (Trabajos y Proyectos) comparten tabla, como en la base */
  constructor(Tipo, compartido = null) {
    this.Tipo = Tipo;
    this.filas = compartido ? compartido.filas : new Map();
    this.borradores = compartido ? compartido.borradores : new Map();
  }
  deMiClase(f) { return !this.Tipo.clase || f.clase === this.Tipo.clase; }
  async listar() {
    const filas = [...this.filas.values()].filter((f) => this.deMiClase(f));
    const borr = [...this.borradores.values()].filter((b) => !this.Tipo.clase || b.clase === this.Tipo.clase);
    return { entradas: juntar(this.Tipo, filas, borr) };
  }
  async guardarBorrador(obj, { nuevo = false } = {}) {
    const r = obj.validar({ borrador: true });
    if (!r.ok) return invalido(r);
    const en = this.filas.get(obj.id);
    const b = this.borradores.get(obj.id);
    if (nuevo && (en || b)) return { error: 'repetido' };
    /* Un Trabajo no pisa a un Proyecto que se llame igual (comparten tabla) */
    if (this.Tipo.clase && ((en && en.clase !== this.Tipo.clase) || (b && b.clase !== this.Tipo.clase))) return { error: 'repetido' };
    this.borradores.set(obj.id, { id: obj.id, clase: this.Tipo.clase || null, fila: obj.aFila() });
    return { ok: true, faltan: r.faltan || [] };
  }
  async publicar(obj) {
    const r = obj.validar();
    if (!r.ok) return invalido(r);
    const en = this.filas.get(obj.id);
    if (this.Tipo.clase && en && en.clase !== this.Tipo.clase) return { error: 'repetido' };
    this.filas.set(obj.id, { ...obj.aFila(), publicado: true });
    this.borradores.delete(obj.id);
    return { ok: true, avisos: r.avisos };
  }
  async quitarDeLaWeb(id) {
    const en = this.filas.get(id);
    if (!en || !this.deMiClase(en)) return { error: 'noExiste' };
    this.filas.set(id, { ...en, publicado: false });
    return { ok: true };
  }
  async descartar(id) {
    if (!this.borradores.has(id)) return { error: 'noExiste' };
    this.borradores.delete(id);
    return { ok: true };
  }
  async borrar(id) {
    const habia = this.filas.has(id) || this.borradores.has(id);
    this.filas.delete(id);
    this.borradores.delete(id);
    return habia ? { ok: true } : { error: 'noExiste' };
  }
}

export class RepositorioSupabase {
  constructor(sb, Tipo) {
    this.sb = sb;
    this.Tipo = Tipo;
  }
  tabla() { return this.sb.from(this.Tipo.tabla); }
  deBorradores() {
    let q = this.sb.from('borradores').select('id,clase,fila').eq('tabla', this.Tipo.tabla);
    if (this.Tipo.clase) q = q.eq('clase', this.Tipo.clase);
    return q;
  }
  async listar() {
    try {
      let q = this.tabla().select('*');
      if (this.Tipo.clase) q = q.eq('clase', this.Tipo.clase);
      const [a, b] = await Promise.all([q.order('orden', { ascending: true }), this.deBorradores()]);
      if (a.error || b.error) return { error: claveDeErrorBase(a.error || b.error), entradas: [] };
      return { entradas: juntar(this.Tipo, a.data || [], b.data || []) };
    } catch (e) { return { error: 'red', entradas: [] }; }
  }
  /* ¿Hay ya algo con ese id (en su tabla o en borradores)? Y si lo hay, ¿de otra clase? */
  async ocupado(id) {
    const [a, b] = await Promise.all([
      this.tabla().select('id,clase').eq('id', id).maybeSingle(),
      this.sb.from('borradores').select('id,clase').eq('tabla', this.Tipo.tabla).eq('id', id).maybeSingle()
    ]);
    if (a.error || b.error) return { error: claveDeErrorBase(a.error || b.error) };
    const otra = (x) => !!(x && this.Tipo.clase && x.clase !== this.Tipo.clase);
    return { hay: !!(a.data || b.data), deOtraClase: otra(a.data) || otra(b.data) };
  }
  async guardarBorrador(obj, { nuevo = false } = {}) {
    const r = obj.validar({ borrador: true });
    if (!r.ok) return invalido(r);
    try {
      const o = await this.ocupado(obj.id);
      if (o.error) return o;
      if ((nuevo && o.hay) || o.deOtraClase) return { error: 'repetido' };
      const fila = { tabla: this.Tipo.tabla, id: obj.id, clase: this.Tipo.clase || null, fila: obj.aFila() };
      const { error } = nuevo
        ? await this.sb.from('borradores').insert(fila)
        : await this.sb.from('borradores').upsert(fila, { onConflict: 'tabla,id' });
      return error ? { error: claveDeErrorBase(error) } : { ok: true, faltan: r.faltan || [] };
    } catch (e) { return { error: 'red' }; }
  }
  async publicar(obj) {
    const r = obj.validar();
    if (!r.ok) return invalido(r);
    try {
      const o = await this.ocupado(obj.id);
      if (o.error) return o;
      if (o.deOtraClase) return { error: 'repetido' };
      const { error } = await this.tabla().upsert({ ...obj.aFila(), publicado: true }, { onConflict: 'id' });
      if (error) return { error: claveDeErrorBase(error) };
      /* Publicado: su borrador ya no hace falta. Si no se pudiera borrar, no pasa nada grave
         (el borrador es igual a lo publicado) */
      await this.sb.from('borradores').delete().eq('tabla', this.Tipo.tabla).eq('id', obj.id);
      return { ok: true, avisos: r.avisos };
    } catch (e) { return { error: 'red' }; }
  }
  /* Quitar y borrar piden de vuelta la fila tocada: sin permiso (o sin el codigo del
     celular) la base no da error, simplemente no toca nada, y eso NO es «listo». */
  async quitarDeLaWeb(id) {
    try {
      let q = this.tabla().update({ publicado: false }).eq('id', id);
      if (this.Tipo.clase) q = q.eq('clase', this.Tipo.clase);
      const { data, error } = await q.select('id');
      if (error) return { error: claveDeErrorBase(error) };
      return Array.isArray(data) && data.length ? { ok: true } : { error: 'noExiste' };
    } catch (e) { return { error: 'red' }; }
  }
  async descartar(id) {
    try {
      const { data, error } = await this.sb.from('borradores').delete().eq('tabla', this.Tipo.tabla).eq('id', id).select('id');
      if (error) return { error: claveDeErrorBase(error) };
      return Array.isArray(data) && data.length ? { ok: true } : { error: 'noExiste' };
    } catch (e) { return { error: 'red' }; }
  }
  async borrar(id) {
    try {
      const b = await this.sb.from('borradores').delete().eq('tabla', this.Tipo.tabla).eq('id', id).select('id');
      let q = this.tabla().delete().eq('id', id);
      if (this.Tipo.clase) q = q.eq('clase', this.Tipo.clase);
      const a = await q.select('id');
      if (a.error || b.error) return { error: claveDeErrorBase(a.error || b.error) };
      const tocadas = (a.data || []).length + (b.data || []).length;
      return tocadas ? { ok: true } : { error: 'noExiste' };
    } catch (e) { return { error: 'red' }; }
  }
}
