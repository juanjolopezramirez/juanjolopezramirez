/* PUBLICAR UN LIBRO DEL TALLER EN RECURSOS (etapa A3b). Las cuentas, sin pantalla ni red:

     proponerId(titulo)        la direccion que se propone (/es/writing/#id): minusculas, sin acentos, sin espacios ni
                               guiones, empieza por letra, 40 como mucho, y pasa Libro.idValido
     recortarTitulo(titulo)    el titulo de un libro de Recursos mide 120 como mucho (el de una edicion admite 200)
     tipoDeEdicion(blando)     pasta blanda → «revista»; tapa dura → «tapa-dura»
     TEMAS                     los temas de Recursos (data/biblioteca.js → SECCIONES)
     veredictoDeId(...)        ¿puede ESTE libro usar ESTE id? (nunca uno protegido ni el de otro libro)
     planDeCopia(...)          de donde a donde se copia el PDF: el origen es EXACTAMENTE el `pdf` de una edicion de
                               ese libro, y el destino es un PDF de ese id en `libros` (Libro.esPdfDe). Nunca una
                               ruta libre.
     publicarLibro({ be, … })  todo junto: vincula, copia el PDF, publica la fila y quita nada mas

   La fila se publica con las reglas de siempre (Libro.validar). Publicar NO crea ni apaga enlaces privados, y el
   enlace privado no aparece en Recursos. Todo devuelve `{ ok }` o `{ error: '<clave>' }`; nada lanza. */
import { Libro, TITULO_MAX } from '../Libro.js';
import { SECCIONES } from '../../../data/biblioteca.js';
import { idiomaValido } from '../comun.js';
import { ubicacion } from '../Almacen.js';
import { ES_ID_OBRA } from './ArchivosObra.js';

export const TEMAS = SECCIONES.map((s) => ({ id: s.id, nombre: s.nombre.es }));
const ES_UUID = ES_ID_OBRA;

export function proponerId(titulo) {
  let id = String(titulo == null ? '' : titulo).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  id = id.replace(/^[0-9]+/, '').slice(0, 40);
  if (!id) id = 'libro';
  if (!Libro.idValido(id)) id = `${id.slice(0, 35)}libro`;
  return Libro.idValido(id) ? id : '';
}

export function recortarTitulo(titulo) {
  const limpio = String(titulo == null ? '' : titulo).replace(/\s+/g, ' ').trim();
  /* Por caracteres ENTEROS (Array.from): un emoji, que ocupa dos unidades, nunca se parte por la mitad. Y como el modelo del
     libro (Libro.js → limpiar) corta por unidades, se para antes de pasar de TITULO_MAX unidades: asi tampoco lo corta el. */
  if (limpio.length <= TITULO_MAX) return { texto: limpio, recortado: false };
  let salida = '';
  for (const c of Array.from(limpio)) {
    if (salida.length + c.length > TITULO_MAX) break;
    salida += c;
  }
  return { texto: salida.trim(), recortado: true };
}

export const tipoDeEdicion = (blando) => (blando === false ? 'tapa-dura' : 'revista');

/* ¿Puede un libro del Taller usar este id?
     propio           el libro_id que YA tiene este libro (o '')
     hayOtraObra      otro libro del Taller ya lo tiene
     hayEnBiblioteca  ya hay algo con ese id en Recursos (publicado, quitado o en borrador)
   Un id protegido (los del codigo, sus alias, las anclas de la pagina) nunca vale. */
export function veredictoDeId(libroId, { propio = '', hayOtraObra = false, hayEnBiblioteca = false } = {}) {
  if (!Libro.idValido(libroId)) return { error: 'idNoValido' };
  if (propio && propio === libroId) return { ok: true, propio: true };
  if (propio) return { error: 'idCambia' };
  if (hayOtraObra || hayEnBiblioteca) return { error: 'idOcupado' };
  return { ok: true, propio: false };
}

/* El nombre DENTRO del cajon «libros» de un PDF de ESTE libro (libros/<id>/<idioma>[-<azar>].pdf), o null. Es lo unico que
   se puede quitar de Recursos desde aqui: nunca una ruta libre. */
export function nombrePdfDeRecursos(libroId, ruta) {
  if (!Libro.idValido(libroId) || typeof ruta !== 'string') return null;
  const m = ruta.match(/^libros\/([a-z][a-z0-9]*)\/([a-z]{2})(?:-[a-z0-9]{6,16})?\.pdf$/);
  if (!m || !Libro.esPdfDe(ruta, libroId, m[2])) return null;
  const u = ubicacion(ruta);
  return u && u.cajon === 'libros' && u.nombre.startsWith(`${libroId}/`) ? u.nombre : null;
}

const AZAR = () => [...crypto.getRandomValues(new Uint8Array(6))].map((b) => b.toString(16).padStart(2, '0')).join('');

/* → { origen, destino, nombreOrigen, nombreDestino } | { error } */
export function planDeCopia({ obraId, edicionId, edicionPdf, libroId, lang, azar = AZAR }) {
  if (!ES_UUID.test(String(obraId)) || !ES_UUID.test(String(edicionId))) return { error: 'archivoRuta' };
  if (!Libro.idValido(libroId)) return { error: 'idNoValido' };
  if (!idiomaValido(lang)) return { error: 'archivoRuta' };
  const origen = `taller/${obraId}/ediciones/${edicionId}/original.pdf`;
  if (edicionPdf !== origen) return { error: 'archivoRuta' };
  const destino = Libro.rutaPdf(libroId, lang, azar());
  if (!destino || !Libro.esPdfDe(destino, libroId, lang)) return { error: 'archivoRuta' };
  const de = ubicacion(origen), a = ubicacion(destino);
  if (!de || !a || de.cajon !== 'taller' || a.cajon !== 'libros') return { error: 'archivoRuta' };
  return { origen, destino, nombreOrigen: de.nombre, nombreDestino: a.nombre };
}

/* LO QUE PASA AL PUBLICAR, en orden:
     1. la edicion pedida es la ULTIMA de este libro (si hay una mas nueva, se avisa)
     2. el libro de Recursos es el de ESTE libro del Taller (id nuevo y libre, o el que ya tiene), y no hay un borrador
        pendiente de el en Developer-Mode: eso NO se pisa en silencio, se pide resolverlo alli primero
     3. el libro se valida entero con una ruta provisional, ANTES de vincular ni copiar nada
     4. se vincula el id (si es la primera vez)
     5. se copia el PDF a `libros/<id>/<idioma>-<azar>.pdf`
     6. se publica la fila de `biblioteca`: la PRIMERA vez se inserta (si alguien llego con ese id entre medias, no se
        pisa: «idOcupado»); si el libro ya estaba, se REEMPLAZA (mismo id), con su lomo, tono, subtitulo y etiquetas
     7. si algo falla despues de copiar, se quita el PDF copiado (y el vinculo, si era nuevo); si sale bien y habia un PDF
        anterior de ese idioma, se quita tambien
   `be` es el backend del portal (be.taller, be.contenido). */
export async function publicarLibro({ be, obraId, edicionId, libroId, lang, tema, titulo, blando }) {
  if (!be || !be.taller || !be.contenido) return { error: 'generico' };
  if (!TEMAS.some((t) => t.id === tema)) return { error: 'temaNoExiste' };
  if (!idiomaValido(lang)) return { error: 'generico' };
  const t = recortarTitulo(titulo);
  if (!t.texto) return { error: 'tituloFalta' };

  const eds = await be.taller.ediciones(obraId);
  if (eds.error) return eds;
  if (!eds.filas.some((e) => e.id === edicionId)) return { error: 'noExiste' };
  if (eds.filas[0].id !== edicionId) return { error: 'edicionNueva' };

  const repo = be.contenido.repositorio(Libro);
  const propio = await be.taller.libroDe(obraId);
  if (propio.error) return propio;
  const lista = await repo.listar();
  if (lista.error) return lista;
  const entrada = lista.entradas.find((x) => x.id === libroId) || null;
  const v = veredictoDeId(libroId, { propio: propio.libroId || '', hayOtraObra: false, hayEnBiblioteca: !!entrada });
  if (v.error) return v;
  if (entrada && entrada.borrador) return { error: 'hayBorrador' };

  /* Si ya estaba, se parte de lo que hay (lomo, tono, subtitulo, etiquetas) y solo cambia lo que cambia una edicion nueva */
  const previo = entrada && entrada.enBase ? entrada.enBase : null;
  const base = previo ? previo.datos() : {};
  const armar = (ruta) => new Libro({
    ...base, id: libroId, idiomaOriginal: previo ? previo.idiomaOriginal : lang, publicado: true,
    seccion: tema, tipo: tipoDeEdicion(blando),
    titulo: { ...(base.titulo || {}), [lang]: t.texto },
    pdf: { ...(base.pdf || {}), [lang]: ruta }
  });
  const prueba = armar(Libro.rutaPdf(libroId, lang, 'aaaaaa')).validar();
  if (!prueba.ok) return { error: 'invalido', errores: prueba.errores };

  /* Vincular primero: el indice unico impide que dos libros del Taller se queden con el mismo id */
  const vinculoNuevo = !v.propio;
  if (vinculoNuevo) {
    const l = await be.taller.vincularLibro(obraId, libroId);
    if (l.error) return l.error === 'repetido' ? { error: 'idOcupado' } : l;
  }
  const c = await be.taller.copiarARecursos(obraId, edicionId, libroId, lang);
  if (c.error) {
    if (vinculoNuevo) await be.taller.desvincularLibro(obraId);
    return c;
  }
  const p = await repo.publicar(armar(c.ruta), { nuevo: !previo });
  if (p.error) {
    /* No quedo nada a medias: ni el PDF copiado ni el vinculo nuevo */
    await be.taller.quitarPdfDeRecursos(obraId, libroId, c.ruta);
    if (vinculoNuevo) await be.taller.desvincularLibro(obraId);
    return p.error === 'repetido' ? { error: 'idOcupado' } : p;
  }
  /* Reemplazado con exito: el PDF anterior de ese idioma ya no lo usa nadie */
  const viejo = previo && previo.pdf[lang];
  let sueltos = 0;
  if (viejo && viejo !== c.ruta) {
    const q = await be.taller.quitarPdfDeRecursos(obraId, libroId, viejo);
    if (q.error) sueltos = 1;
  }
  return { ok: true, id: libroId, ruta: c.ruta, reemplaza: !!previo, avisos: p.avisos || [], recortado: t.recortado, sueltos };
}

/* Quitar de Recursos: corta la descarga del PDF al instante; el libro sigue en la web hasta la proxima «Actualizar la web» */
export async function quitarDeRecursos({ be, obraId }) {
  if (!be || !be.taller || !be.contenido) return { error: 'generico' };
  const l = await be.taller.libroDe(obraId);
  if (l.error) return l;
  if (!l.libroId) return { error: 'noExiste' };
  return be.contenido.repositorio(Libro).quitarDeLaWeb(l.libroId);
}
