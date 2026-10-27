/* De la base a la pagina publica: convierte lo PUBLICADO desde el panel en las mismas
   entradas que ya usan data/biblioteca.js (LIBROS), data/partners.js (PARTNERS),
   data/projects.js (PROJECTS) y data/camino.js (ETAPAS). Lo usa
   tools/traer-contenido.mjs al compilar. PURO: sin red ni disco (de eso se encarga el
   guion), asi se prueba en Node.

   Cada entrada lleva `panel: true` (de donde vino) y su `idiomaOriginal` y `ia`, para
   que la pagina diga «Escrito en portugués» o «Traducido con IA».

   Ademas dice que archivos hay que bajar: { ruta (la del almacen), destino (en el
   repositorio, relativo a la raiz), ext }. Los destinos se arman SOLO con ids y rutas
   ya validados por los modelos: nunca con texto libre. */
import { Libro } from './Libro.js';
import { Trabajo, Proyecto } from './Casa.js';
import { Etapa } from './Etapa.js';

/* Las imagenes del panel se sirven desde aqui (public/assets/remoto/<ruta del almacen>) */
export const CARPETA_PUBLICA = 'assets/remoto';
export const rutaPublica = (ruta) => `/${CARPETA_PUBLICA}/${ruta}`;
const ext = (ruta) => ruta.slice(ruta.lastIndexOf('.') + 1);

/* Cada fila: la valida su clase; si no pasa, se cuenta y se deja fuera (no tumba la web). */
function leer(Tipo, filas) {
  const buenas = [];
  const malas = [];
  for (const f of Array.isArray(filas) ? filas : []) {
    const obj = Tipo.deFila(f);
    const r = obj.validar();
    if (r.ok && obj.publicado) buenas.push(obj);
    else malas.push({ id: obj.id || '?', errores: r.errores });
  }
  return { buenas, malas };
}

/* ---- Libros ------------------------------------------------------------------------ */
export function paraBiblioteca(libro) {
  /* Un idioma cuenta si tiene PDF Y titulo (comprobar() pide titulo en cada idioma) */
  const idiomas = Object.keys(libro.pdf).filter((l) => libro.titulo[l]);
  const entrada = {
    id: libro.id,
    seccion: libro.seccion,
    tipo: libro.tipo,
    panel: true,
    idiomaOriginal: libro.idiomaOriginal,
    idiomas,
    titulo: Object.fromEntries(idiomas.map((l) => [l, libro.titulo[l]])),
    etiquetas: [...libro.etiquetas],
    ia: libro.ia.aFila()
  };
  const sub = Object.fromEntries(idiomas.filter((l) => libro.subtitulo[l]).map((l) => [l, libro.subtitulo[l]]));
  if (Object.keys(sub).length) entrada.subtitulo = sub;
  if (libro.grosor) entrada.grosor = libro.grosor;
  if (libro.tono) entrada.tono = libro.tono;
  return entrada;
}

/* Los PDF van a books/<id>.<idioma>.pdf (tools/books.py los convierte) y los lomos a
   public/assets/lomos/ (data/lomos.js los mide y los usa). */
export function archivosDeLibro(libro) {
  const lista = [];
  for (const l of Object.keys(libro.pdf)) {
    if (!libro.titulo[l]) continue;
    lista.push({ ruta: libro.pdf[l], destino: `books/${libro.id}.${l}.pdf`, ext: 'pdf' });
  }
  for (const [l, ruta] of Object.entries(libro.lomo)) {
    const nombre = l === 'todos' ? `${libro.id}.png` : `${libro.id}.${l}.png`;
    lista.push({ ruta, destino: `public/assets/lomos/${nombre}`, ext: 'png' });
  }
  return lista;
}

/* ---- Casas ------------------------------------------------------------------------- */
/* Las imagenes de los bloques de su cuerpo (columnas incluidas) */
function imagenesDelCuerpo(casa) {
  const rutas = [];
  const ver = (b) => {
    if (b.tipo === 'imagen' && b.src) rutas.push(b.src);
    if (b.tipo === 'columnas') b.columnas.forEach((col) => col.forEach(ver));
  };
  for (const doc of Object.values(casa.cuerpo)) doc.bloques.forEach(ver);
  return [...new Set(rutas)];
}

/* `medidas` trae { <ruta>: { w, h } } de las imagenes ya bajadas (el avatar en mapa de
   bits necesita su tamaño, como en data/projects.js). */
export function paraCasa(casa, medidas = {}) {
  const e = {
    id: casa.id,
    clase: casa.clase,        // 'trabajo' → PARTNERS, 'proyecto' → PROJECTS
    name: casa.name,
    panel: true,
    idiomaOriginal: casa.idiomaOriginal,
    ia: casa.ia.aFila(),
    src: rutaPublica(casa.logo.src),
    w: casa.logo.w,
    h: casa.logo.h,
    scale: casa.logo.scale,
    tags: [...casa.tags],
    works: casa.works.map((w) => ({ title: { ...w.title }, year: w.year, ...(w.href ? { href: w.href } : {}) })),
    cuerpo: Object.fromEntries(Object.entries(casa.cuerpo).filter(([, d]) => !d.vacio).map(([l, d]) => [l, d.aJSON()]))
  };
  if (Object.keys(casa.role).length) e.role = { ...casa.role };
  if (Object.keys(casa.blurb).length) e.blurb = { ...casa.blurb };
  if (casa.avatar) {
    e.avatar = rutaPublica(casa.avatar);
    const m = medidas[casa.avatar];
    if (m && m.w && m.h) { e.avatarW = m.w; e.avatarH = m.h; }
  }
  if (casa.banner) e.banner = rutaPublica(casa.banner);
  return e;
}

export function archivosDeCasa(casa) {
  const rutas = [casa.logo.src, casa.avatar, casa.banner, ...imagenesDelCuerpo(casa)].filter(Boolean);
  return [...new Set(rutas)].map((ruta) => ({ ruta, destino: `public/${CARPETA_PUBLICA}/${ruta}`, ext: ext(ruta) }));
}

/* ---- Etapas ------------------------------------------------------------------------ */
export function paraEtapa(etapa) {
  return {
    id: etapa.id,
    cuando: etapa.cuando,
    panel: true,
    idiomaOriginal: etapa.idiomaOriginal,
    ia: etapa.ia.aFila(),
    titulo: { ...etapa.titulo },
    texto: { ...etapa.texto }
  };
}

/* ---- Todo junto ---------------------------------------------------------------------
   `filas` trae { biblioteca, casas, etapas } tal como llegan de la base. `delCodigo`
   trae los ids que ya usa la web (libros de data/biblioteca.js, casas de partners.js y
   projects.js, etapas de camino.js): una fila del panel con un id que ya existe se deja
   fuera y se avisa (no tapa lo que hay). */
export function prepararPublicacion(filas, delCodigo = {}) {
  const avisos = [];
  const usados = (k) => new Set(delCodigo[k] || []);
  const fuera = (lista, k, que) => lista.filter((o) => {
    if (!usados(k).has(o.id)) return true;
    avisos.push(`${que} «${o.id}» del panel se llama como uno que ya esta en el codigo: se deja fuera.`);
    return false;
  });

  const libros = leer(Libro, filas.biblioteca);
  const trabajos = leer(Trabajo, (filas.casas || []).filter((f) => f && f.clase === 'trabajo'));
  const proyectos = leer(Proyecto, (filas.casas || []).filter((f) => f && f.clase === 'proyecto'));
  const etapas = leer(Etapa, filas.etapas);
  for (const [que, r] of [['el libro', libros], ['el trabajo', trabajos], ['el proyecto', proyectos], ['la etapa', etapas]]) {
    for (const m of r.malas) avisos.push(`${que} «${m.id}» no pasa sus reglas (${m.errores.map((x) => `${x.campo}:${x.clave}`).join(', ') || 'no publicado'}): se deja fuera.`);
  }

  const librosBuenos = fuera(libros.buenas, 'libros', 'el libro');
  const casasBuenas = fuera([...trabajos.buenas, ...proyectos.buenas], 'casas', 'la casa');
  const etapasBuenas = fuera(etapas.buenas, 'etapas', 'la etapa');
  return {
    avisos,
    libros: librosBuenos,
    casas: casasBuenas,
    etapas: etapasBuenas,
    archivos: [...librosBuenos.flatMap(archivosDeLibro), ...casasBuenas.flatMap(archivosDeCasa)]
  };
}
