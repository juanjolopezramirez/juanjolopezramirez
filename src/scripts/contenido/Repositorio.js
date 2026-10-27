/* Guardar y leer el contenido de Developer-Mode. Dos repositorios con la misma cara:

     RepositorioSupabase  la base de verdad (las reglas de supabase/007_*.sql dejan escribir
                          solo al admin con su codigo, y leer lo publicado a todos)
     RepositorioMemoria   la demostracion (?demo=admin) y las pruebas: nada sale de la pagina

   Los dos devuelven objetos, nunca lanzan: { ok: true } o { error: '<clave>' }, como
   portal/real.js. Guardar SIEMPRE valida antes: lo que no pasa las reglas de su clase no
   llega a la base (y la base tiene las suyas, por si acaso).

   `Tipo` es la clase (Libro, Trabajo, Proyecto, Etapa): de ella salen la tabla y, en las
   casas, la `clase` que separa Trabajos de Proyectos. */

const invalido = (r) => ({ error: 'invalido', errores: r.errores, avisos: r.avisos });

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

export class RepositorioMemoria {
  constructor(Tipo) {
    this.Tipo = Tipo;
    this.filas = new Map();
  }
  async listar() {
    const filas = [...this.filas.values()].map((f) => this.Tipo.deFila(f)).sort((a, b) => a.orden - b.orden);
    return { filas };
  }
  async leer(id) {
    return { fila: this.filas.has(id) ? this.Tipo.deFila(this.filas.get(id)) : null };
  }
  /* `nuevo`: es algo que se esta CREANDO; si ya hay uno con ese id, no se pisa (repetido) */
  async guardar(obj, { nuevo = false } = {}) {
    const r = obj.validar();
    if (!r.ok) return invalido(r);
    const antes = this.filas.get(obj.id);
    if (nuevo && antes) return { error: 'repetido' };
    /* Un Trabajo no pisa a un Proyecto que se llame igual (viven en la misma tabla) */
    if (antes && this.Tipo.clase && antes.clase !== this.Tipo.clase) return { error: 'repetido' };
    /* Guardar no publica: eso es otro paso, a proposito */
    this.filas.set(obj.id, { ...obj.aFila(), publicado: antes ? antes.publicado === true : false });
    return { ok: true, avisos: r.avisos };
  }
  async publicar(id, si) {
    if (!this.filas.has(id)) return { error: 'noExiste' };
    this.filas.set(id, { ...this.filas.get(id), publicado: si === true });
    return { ok: true };
  }
  async borrar(id) {
    if (!this.filas.has(id)) return { error: 'noExiste' };
    this.filas.delete(id);
    return { ok: true };
  }
}

export class RepositorioSupabase {
  constructor(sb, Tipo) {
    this.sb = sb;
    this.Tipo = Tipo;
  }
  consulta() {
    let q = this.sb.from(this.Tipo.tabla).select('*');
    if (this.Tipo.clase) q = q.eq('clase', this.Tipo.clase);
    return q;
  }
  async listar() {
    try {
      const { data, error } = await this.consulta().order('orden', { ascending: true });
      if (error) return { error: claveDeErrorBase(error), filas: [] };
      return { filas: (data || []).map((f) => this.Tipo.deFila(f)) };
    } catch (e) { return { error: 'red', filas: [] }; }
  }
  async leer(id) {
    try {
      const { data, error } = await this.consulta().eq('id', id).maybeSingle();
      if (error) return { error: claveDeErrorBase(error), fila: null };
      return { fila: data ? this.Tipo.deFila(data) : null };
    } catch (e) { return { error: 'red', fila: null }; }
  }
  /* `nuevo`: se CREA con insert (si el id ya existe, la base dice 23505 → «repetido» y no
     se pisa nada); si no, se actualiza con upsert. */
  async guardar(obj, { nuevo = false } = {}) {
    const r = obj.validar();
    if (!r.ok) return invalido(r);
    /* `publicado` no viaja al guardar: la base deja el que tenia (o false si es nuevo) */
    const { publicado, ...fila } = obj.aFila();
    if (nuevo) {
      try {
        const { error } = await this.sb.from(this.Tipo.tabla).insert(fila);
        return error ? { error: claveDeErrorBase(error) } : { ok: true, avisos: r.avisos };
      } catch (e) { return { error: 'red' }; }
    }
    try {
      /* Un Trabajo no pisa a un Proyecto que se llame igual (viven en la misma tabla: el
         upsert por id lo cambiaria de clase sin decir nada) */
      if (this.Tipo.clase) {
        const { data, error } = await this.sb.from(this.Tipo.tabla).select('clase').eq('id', obj.id).maybeSingle();
        if (error) return { error: claveDeErrorBase(error) };
        if (data && data.clase !== this.Tipo.clase) return { error: 'repetido' };
      }
      const { error } = await this.sb.from(this.Tipo.tabla).upsert(fila, { onConflict: 'id' });
      return error ? { error: claveDeErrorBase(error) } : { ok: true, avisos: r.avisos };
    } catch (e) { return { error: 'red' }; }
  }
  /* Publicar y borrar piden de vuelta la fila tocada: sin permiso (o sin el codigo del
     celular) la base no da error, simplemente no toca nada, y eso NO es «listo». */
  async publicar(id, si) {
    try {
      const { data, error } = await this.sb.from(this.Tipo.tabla).update({ publicado: si === true }).eq('id', id).select('id');
      if (error) return { error: claveDeErrorBase(error) };
      return Array.isArray(data) && data.length ? { ok: true } : { error: 'noExiste' };
    } catch (e) { return { error: 'red' }; }
  }
  async borrar(id) {
    try {
      const { data, error } = await this.sb.from(this.Tipo.tabla).delete().eq('id', id).select('id');
      if (error) return { error: claveDeErrorBase(error) };
      return Array.isArray(data) && data.length ? { ok: true } : { error: 'noExiste' };
    } catch (e) { return { error: 'red' }; }
  }
}
