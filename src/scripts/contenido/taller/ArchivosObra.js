/* LOS ARCHIVOS DE UN LIBRO DEL TALLER en el cajon privado: `taller/<obra>/img/…` y `taller/<obra>/pdf/…`.
   Para borrar un libro entero hay que encontrarlos todos, y el cajon los da por carpetas y de a paginas.
   Aqui no se habla con la red: `listar` llega de afuera (real.js, demo.js), asi se prueba en Node. */
export const ES_ID_OBRA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const POR_PAGINA = 100;
export const POR_TANDA = 100;
const HONDO = 4;                     // hoy son tres niveles (img, pdf y ediciones/<id>): mas hondo no hay que buscar

/* `listar(carpeta, desde)` → { data: [{ name, id, metadata }], error }; una carpeta llega con id null.
   Devuelve { ok, archivos: [{ ruta, peso }] }, con la ruta como la guardan las filas («taller/…»). */
export async function listarObra(listar, obraId) {
  if (!ES_ID_OBRA.test(String(obraId))) return { error: 'invalido' };
  const archivos = [];
  const recorrer = async (carpeta, hondo) => {
    for (let desde = 0; ; desde += POR_PAGINA) {
      const { data, error } = await listar(carpeta, desde);
      if (error || !Array.isArray(data)) throw new Error('lista');
      for (const x of data) {
        const nombre = `${carpeta}/${x.name}`;
        if (x.id === null || x.id === undefined) { if (hondo < HONDO) await recorrer(nombre, hondo + 1); }
        else archivos.push({ ruta: `taller/${nombre}`, peso: Number(x.metadata && x.metadata.size) || 0 });
      }
      if (data.length < POR_PAGINA) return;
    }
  };
  try { await recorrer(obraId, 0); } catch (e) { return { error: 'red' }; }
  return { ok: true, archivos };
}

/* Solo lo que esta dentro de la carpeta de ESTE libro, y como lo nombra el cajon (sin «taller/»).
   Aunque la lista traiga otra cosa, de aqui no sale. */
export function nombresDeObra(rutas, obraId) {
  if (!ES_ID_OBRA.test(String(obraId))) return [];
  const pre = `taller/${obraId}/`;
  return [...new Set(rutas)].filter((r) => typeof r === 'string' && r.startsWith(pre) && !r.includes('..') && r.length > pre.length).map((r) => r.slice('taller/'.length));
}

export function enTandas(lista, n) {
  const t = [];
  for (let i = 0; i < lista.length; i += n) t.push(lista.slice(i, i + n));
  return t;
}

/* «15,1 MB» */
export function pesoLegible(bytes) {
  const n = Math.max(0, Number(bytes) || 0);
  const [v, u] = n >= 1024 ** 3 ? [n / 1024 ** 3, 'GB'] : n >= 1024 ** 2 ? [n / 1024 ** 2, 'MB'] : [n / 1024, 'KB'];
  return `${v.toLocaleString('es', { maximumFractionDigits: 1 })} ${u}`;
}
