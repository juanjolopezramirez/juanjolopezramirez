/* Las piezas pequeñas de la biblioteca, sin DOM ni `window` para poder
   probarlas en Node (tools/test-biblioteca.mjs). Las usan site.js (en el
   navegador) y Biblioteca.astro (al compilar).

   Regla de todas las funciones que reciben algo de fuera —la ancla de la
   direccion, lo que hay guardado en el aparato, un nombre de libro—: nunca se
   usa tal cual; se busca en un Set de ids que ya existen o en las claves
   PROPIAS de un objeto (`tiene`). En un objeto cualquiera, «constructor» o
   «toString» parecen ids validos. */

/* Donde se guarda el ultimo libro leido: solo su id, en texto, sin JSON. */
export const CLAVE = 'jlr:libro';

const tiene = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

/* «#ahava» → «ahava», o null si no es el id de un libro de la biblioteca.
   Una ancla mal codificada (`%E0`) hace que decodeURIComponent lance: aqui
   es solo «no es ninguno». */
export function idDeHash(hash, validos) {
  if (typeof hash !== 'string' || hash.length < 2 || hash.charAt(0) !== '#') return null;
  let id;
  try { id = decodeURIComponent(hash.slice(1)); } catch (err) { return null; }
  id = id.toLowerCase();
  return validos.has(id) ? id : null;
}

/* El ultimo libro leido, si sigue siendo un libro. `almacen` es localStorage,
   que puede faltar, estar lleno o estar bloqueado: cualquier fallo es «no hay». */
export function leerUltimo(almacen, validos) {
  try {
    const id = almacen.getItem(CLAVE);
    return typeof id === 'string' && validos.has(id) ? id : null;
  } catch (err) {
    return null;
  }
}

/* Lo guarda. Devuelve si pudo; si no puede, no pasa nada. */
export function guardarUltimo(almacen, id, validos) {
  if (!validos.has(id)) return false;
  try {
    almacen.setItem(CLAVE, id);
    return true;
  } catch (err) {
    return false;
  }
}

/* ---- Que idioma abre cada libro ------------------------------------------

   Los libros que no son de una palabra solo existen en español e ingles, y
   algunos en uno solo. La web tiene cinco idiomas, asi que hace falta una
   regla para decir que version se le ofrece a cada pagina. Primero el idioma
   de la pagina si el libro lo tiene; si no, el mas cercano: el portugues lee
   español antes que ingles; el frances y el italiano, ingles antes que español
   (el español de quien lee en esas paginas es raro, el ingles no). */
export const ORDEN = {
  es: ['es', 'en'],
  en: ['en', 'es'],
  pt: ['es', 'en'],
  fr: ['en', 'es'],
  it: ['en', 'es']
};

/* Que version de `libro` se ve en la pagina `pagina`. `BOOKS` es el indice
   que genera tools/books.py.

   Devuelve null si el libro no se puede abrir en ningun idioma, o
     { lang, pdf, cual, texto, marca }
       lang   el idioma en que esta lo que se va a abrir
       pdf    lo que dice BOOKS de ese PDF (paginas, ratio, v…), o null
       cual   la carpeta de sus imagenes: public/books/<id>/<cual>/
       texto  si hay ademas una version escrita (HTML) que ofrecer
       marca  «ES» / «EN» si el libro esta en un idioma que no es el de la
              pagina; si no, null.

   LOS DE UNA PALABRA conservan su regla de siempre: el PDF del idioma de la
   pagina, o el «all»; si no hay, se abre el texto en el idioma de la pagina
   (cinco idiomas), sin marca. */
export function variante(libro, pagina, BOOKS) {
  const hechos = tiene(BOOKS, libro.id) ? BOOKS[libro.id] : {};
  if (libro.glosario) {
    const cual = tiene(hechos, pagina) ? pagina : (tiene(hechos, 'all') ? 'all' : null);
    return { lang: pagina, pdf: cual ? hechos[cual] : null, cual, texto: true, marca: null };
  }
  for (const l of ORDEN[pagina] || ORDEN.en) {
    if (libro.idiomas.includes(l) && tiene(hechos, l)) {
      return { lang: l, pdf: hechos[l], cual: l, texto: false, marca: l !== pagina ? l.toUpperCase() : null };
    }
  }
  return null;
}

/* Cuanto ocupa el lomo en el estante: 'fino', 'medio' o 'grueso'.

   Sale del numero de paginas, no del idioma de la pagina, para que el estante
   no cambie de forma al cambiar de idioma: se mira el primer PDF que haya
   (español, ingles, «all», el que sea). Un libro sin PDF es un libro escrito
   de doce paginas. Una revista o un comic (pasta blanda) son delgados:
   fino hasta 40 paginas. Un libro de tapa dura: fino hasta 12, medio hasta
   40 y grueso de ahi en adelante. Un libro puede fijarse con `grosor`. */
export function grosorDe(libro, BOOKS, TIPOS) {
  if (libro.grosor) return libro.grosor;
  const hechos = tiene(BOOKS, libro.id) ? BOOKS[libro.id] : {};
  const primero = hechos.es || hechos.en || hechos.all || Object.values(hechos)[0] || null;
  const n = primero ? primero.pages : 12;
  const blando = !!(TIPOS[libro.tipo] && TIPOS[libro.tipo].blando);
  if (blando) return n <= 40 ? 'fino' : 'medio';
  return n <= 12 ? 'fino' : n <= 40 ? 'medio' : 'grueso';
}

/* ---- La ola ---------------------------------------------------------------

   Cuanto sube un lomo, y cuanto se inclina, segun lo lejos que esta del
   puntero. `x` es donde esta el puntero y `cx` el centro del lomo (en la misma
   unidad), y `R` hasta donde llega la ola: mas alla, el lomo no se entera.

   El perfil es un coseno: sube del todo (1) justo debajo del puntero, baja
   suave hasta 0 a distancia R, y los vecinos siguen al que sube. La
   inclinacion es la derivada del mismo perfil —un seno— con el signo de
   donde esta el lomo respecto al puntero: los de la izquierda se inclinan un
   poco a la izquierda y los de la derecha a la derecha, como un abanico, y el
   que esta justo debajo no se inclina nada. Maximo, `GIRO_MAX` grados. */
export const GIRO_MAX = 2.5;

export function ola(x, cx, R) {
  if (!(R > 0) || !Number.isFinite(x) || !Number.isFinite(cx)) return { ola: 0, giro: 0 };
  const d = Math.min(1, Math.abs(x - cx) / R);
  return {
    ola: 0.5 * (1 + Math.cos(Math.PI * d)),
    giro: Math.sign(cx - x) * Math.sin(Math.PI * d) * GIRO_MAX
  };
}

/* ---- El color de un lomo dibujado a mano alzada por el sitio -------------

   Un lomo sin archivo se dibuja solo: de fondo, el tono del libro (TONOS), o
   el color de su carton (tools/books.py lo mide de su portada), o el pino; encima, la palabra y el
   titulo en hueso o en pino, el que mas contraste le saque. Si ni el mejor
   llega a 4.5:1 —el ambar de Ahava, 3.6:1 con hueso—, se oscurece el fondo
   poco a poco hasta que si llegue: el color sigue siendo el del libro, pero
   se lee. */
const HUESO = '#F1EFE9';
const PINO = '#263B28';

function luminancia(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const aHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/* { fondo, tinta } para un lomo automatico. `base` es un color «#rrggbb» (o
   cualquier otra cosa: entonces, el pino). */
export function colorLomo(base) {
  let fondo = /^#[0-9a-f]{6}$/i.test(base || '') ? base.toLowerCase() : PINO.toLowerCase();
  const mejor = (f) => (contraste(f, HUESO) >= contraste(f, PINO) ? HUESO : PINO);
  for (let i = 0; i < 40 && contraste(fondo, mejor(fondo)) < 4.5; i++) {
    const rgb = [1, 3, 5].map((k) => parseInt(fondo.slice(k, k + 2), 16) * 0.94);
    fondo = aHex(rgb);
  }
  return { fondo, tinta: mejor(fondo) };
}

/* ---- Los tonos de un libro -------------------------------------------------

   Un libro puede decir su tono (`tono: 'ocre'` en LIBROS) y asi su lomo en el
   estante y su portada dibujada en el inicio son del mismo color, sin depender
   de lo que mida el carton de un PDF (que Emet, Agape y Rhema no tienen: sin
   esto, los tres salian pino). Son colores de la casa (los hex repiten los de
   base.css: si alli cambian, aqui tambien; tools/test-biblioteca.mjs lo
   comprueba):
     ocre     ring y ring 300 a partes iguales: el oro del ambar del carton de Ahava
     salvia   celtic 400
     pizarra  slate
     tierra   ring 700, el oro hondo
     niebla   slate 100
     arena    ring 300
   colorLomo() se encarga de que la tinta se lea (4.5:1) sobre cada uno. */
export const TONOS = {
  ocre: '#d0a153',
  salvia: '#7aae7d',
  pizarra: '#2b3a43',
  tierra: '#9a6a1f',
  niebla: '#d6dde1',
  arena: '#e0b778'
};

/* ---- La ficha de un libro, resuelta para una pagina -----------------------

   Lo que necesitan la estanteria (Biblioteca.astro), los libros de la cabecera
   (RepisaLibros.astro) y los destacados (Destacados.astro: la cartelera y las
   filas): el mismo libro visto desde una pagina en un idioma. Vivia repetido; aqui
   se calcula una sola vez y es puro, asi que se prueba en Node.

   `datos` trae { BOOKS, TIPOS, TERMS, GLOSS } y `base` es el BASE_URL de la
   web. Devuelve null si el libro no se puede abrir en ningun idioma
   (variante() null); si no:
     id, seccion, tipo, blando, grosor, titulo, glosa
     idioma  el idioma en que esta lo que se abre; marca «ES»/«EN» o null
     color   { fondo, tinta } del lomo y de la portada dibujada
     guion, lengua, dir   la palabra en su alfabeto (solo los de una palabra)
     portada la primera pagina del PDF (900 px), o null si no hay */
export function fichaLibro(libro, pagina, datos, base) {
  const { BOOKS, TIPOS, TERMS, GLOSS } = datos;
  const v = variante(libro, pagina, BOOKS);
  if (!v) return null;
  const di = (o) => (o ? (o[pagina] ?? o.es) : '');
  const palabra = libro.glosario && tiene(TERMS, libro.id) ? TERMS[libro.id] : null;
  const hechos = tiene(BOOKS, libro.id) ? BOOKS[libro.id] : {};
  /* El tono manda; si no lo hay, el carton del PDF de la pagina o el de cualquier otro idioma */
  const carton = (v.pdf && v.pdf.board && v.pdf.board[0]) || (Object.values(hechos)[0]?.board?.[0]) || null;
  const tono = libro.tono !== undefined && tiene(TONOS, libro.tono) ? TONOS[libro.tono] : null;
  return {
    id: libro.id,
    seccion: libro.seccion,
    tipo: libro.tipo,
    blando: !!(TIPOS[libro.tipo] && TIPOS[libro.tipo].blando),
    grosor: grosorDe(libro, BOOKS, TIPOS),
    titulo: palabra ? di(palabra.title) : libro.titulo[v.lang],
    glosa: palabra ? di(GLOSS[libro.id]) : (libro.subtitulo ? libro.subtitulo[v.lang] ?? '' : ''),
    idioma: v.lang,
    marca: v.marca,
    color: colorLomo(tono || carton),
    guion: palabra ? palabra.script : null,
    lengua: palabra ? (palabra.dir === 'rtl' ? 'he' : 'el') : null,
    dir: palabra ? palabra.dir ?? 'ltr' : null,
    portada: v.pdf ? `${base}books/${libro.id}/${v.cual}/01-900.jpg?v=${v.pdf.v}` : null
  };
}

/* ---- Las portadas sueltas ---------------------------------------------------

   Una portada suelta (la de un libro que aun se escribe) es una imagen de
   public/assets/portadas/: nombre en minusculas, cifras o guiones, y jpg, png o
   webp. Sin «..», sin barras de mas. La mira comprobar() y tambien
   Destacados.astro y RepisaLibros.astro justo antes de tocar el disco. */
export const rutaPortadaValida = (ruta) => typeof ruta === 'string' && /^assets\/portadas\/[a-z0-9-]+\.(jpg|png|webp)$/.test(ruta);

/* ---- Buscar un libro --------------------------------------------------------

   El buscador de Destacados. Lo que escribe quien busca es TEXTO: se limpia, se
   compara con `includes` contra un indice que se arma al compilar, y nada
   mas. Nunca llega a una expresion regular, a un selector, a `innerHTML`, a la
   direccion ni al almacenamiento.

   normalizar(): sin acentos ni mayusculas, con una sola separacion entre
   palabras y como mucho BUSCAR_MAX letras (quien pega un libro entero no
   bloquea nada). Quita tambien los puntos del hebreo (אֱמֶת = אמת) y los tonos
   del griego (ἀγάπη = αγαπη), que NFD separa, y los caracteres invisibles que
   un copiar y pegar se trae (ancho cero, guion blando, marcas de direccion):
   solo se comparan, nunca se muestran, pero hacian que «agape» no encontrara
   «agape» pegado. Lo que no es texto da ''.
   indexar(): lo mismo para cada libro, sin el tope, juntando sus partes. */
export const BUSCAR_MAX = 60;
const MARCAS = /[̀-֑ͯ-ׇ­​-‏‪-‮⁠﻿]/g;

function limpiar(texto, max) {
  if (typeof texto !== 'string') return '';
  return texto.slice(0, 2000).normalize('NFD').replace(MARCAS, '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, max);
}
export const normalizar = (texto) => limpiar(texto, BUSCAR_MAX);
export const indexar = (partes) => (Array.isArray(partes) ? partes.map((p) => limpiar(p, 400)).filter(Boolean).join(' ') : '');

/* ¿Encaja `consulta` con `indice`? Todas sus palabras tienen que estar. Una
   consulta vacia encaja con todo (se ven todos los libros). */
export function coincide(consulta, indice) {
  const q = normalizar(consulta);
  if (!q) return true;
  const i = typeof indice === 'string' ? indice : '';
  return q.split(' ').every((p) => i.includes(p));
}

/* ---- La comprobacion de la compilacion -----------------------------------

   Un libro mal puesto no llega a publicarse: lanza un Error que dice cual y
   que le falta. Lo que no es grave (un PDF con otra proporcion que su tipo)
   no lanza: se devuelve en la lista de avisos. `datos` trae todo lo que se
   comprueba, para poder probarla con datos de mentira:
     { SECCIONES, TIPOS, LIBROS, BOOKS, TERMS, GLOSS, CARDS, DEEP, PORTADAS, CARTELERA }
   Ids de una sola palabra que la pagina ya usa: un libro con ese id taparia la
   ancla. Los demas ids de la pagina llevan guion (`book-panel`,
   `biblio-titulo`) y no pueden chocar porque el id de un libro no puede
   llevarlo. */
const RESERVADOS = new Set(['top', 'main', 'biblioteca', 'destacados', 'book', 'flip', 'arrow', 'info', 'mark', 'corner', 'toast',
  'curtain', 'globe', 'lockup', 'links', 'mas']);
/* Lo que makePages (site.js) necesita para armar un libro de una palabra: si
   falta una de estas, el libro se abriria en blanco o rompiendo. */
const LECTURAS = ['now', 'history', 'theology'];
const NIVELES = ['peshat', 'remez', 'derash', 'sod', 'sources'];
const IDIOMAS_LIBRO = ['es', 'en'];
const GROSORES = ['fino', 'medio', 'grueso'];
const IDIOMAS_WEB = ['es', 'en', 'pt', 'fr', 'it'];
/* Mas letras que estas no caben, en dos columnas, en el lomo automatico mas fino */
const TITULO_LARGO = 44;

export function comprobar(datos) {
  const { SECCIONES, TIPOS, LIBROS, BOOKS, TERMS, GLOSS, CARDS, DEEP, PORTADAS, CARTELERA } = datos;
  const avisos = [];
  const secciones = new Set(SECCIONES.map((s) => s.id));
  const vistos = new Set();

  const temas = new Set();
  for (const s of SECCIONES) {
    if (temas.has(s.id)) throw new Error(`biblioteca.js: la seccion «${s.id}» esta repetida.`);
    temas.add(s.id);
    /* El id de un tema va a una ancla de Destacados (`fila-<id>`): una palabra, y no la de la fila «Pronto» */
    if (typeof s.id !== 'string' || !/^[a-z][a-z0-9]*$/.test(s.id) || s.id === 'pronto') {
      throw new Error(`biblioteca.js: la seccion «${String(s.id)}» tiene un id que no es una palabra en minusculas sin guiones (y «pronto» es de Destacados).`);
    }
    for (const l of IDIOMAS_WEB) {
      if (!s.nombre || !s.nombre[l]) throw new Error(`biblioteca.js: la seccion «${s.id}» no tiene nombre en «${l}».`);
    }
  }

  for (const b of LIBROS) {
    const donde = `biblioteca.js: el libro «${b.id}»`;
    if (typeof b.id !== 'string' || !/^[a-z][a-z0-9]*$/.test(b.id)) throw new Error(`${donde} tiene un id que no es una palabra en minusculas sin guiones.`);
    if (vistos.has(b.id)) throw new Error(`${donde} esta repetido.`);
    if (RESERVADOS.has(b.id)) throw new Error(`${donde} se llama como una ancla de la pagina.`);
    if (!secciones.has(b.seccion)) throw new Error(`${donde} esta en la seccion «${b.seccion}», que no existe.`);
    if (!tiene(TIPOS, b.tipo)) throw new Error(`${donde} tiene el tipo «${b.tipo}», que no existe (${Object.keys(TIPOS).join(', ')}).`);
    if (b.grosor !== undefined && !GROSORES.includes(b.grosor)) throw new Error(`${donde} tiene el grosor «${b.grosor}» (usa ${GROSORES.join(', ')}).`);
    if (b.tono !== undefined && !tiene(TONOS, b.tono)) throw new Error(`${donde} tiene el tono «${b.tono}», que no existe (${Object.keys(TONOS).join(', ')}).`);

    if (b.glosario) {
      if (!tiene(TERMS, b.id) || !tiene(GLOSS, b.id) || !tiene(CARDS, b.id) || !tiene(DEEP, b.id)) {
        throw new Error(`${donde} no tiene su palabra completa en TERMS, GLOSS, CARDS y DEEP.`);
      }
      const palabra = TERMS[b.id];
      if (!palabra.title || !palabra.script || !palabra.dir || !GLOSS[b.id]) {
        throw new Error(`${donde} no tiene titulo, escritura, direccion o glosa en TERMS / GLOSS.`);
      }
      for (const k of LECTURAS) if (!CARDS[b.id][k]) throw new Error(`${donde} no tiene la lectura «${k}» en CARDS.`);
      for (const k of NIVELES) if (!DEEP[b.id][k]) throw new Error(`${donde} no tiene «${k}» en DEEP.`);
      if (!Array.isArray(DEEP[b.id].sources)) throw new Error(`${donde} tiene «sources» en DEEP y no es una lista.`);
    } else {
      if (!Array.isArray(b.idiomas) || !b.idiomas.length || b.idiomas.some((l) => !IDIOMAS_LIBRO.includes(l))) {
        throw new Error(`${donde} tiene que decir en que idiomas esta, solo ${IDIOMAS_LIBRO.join(' y/o ')}: idiomas: ['es'].`);
      }
      if (new Set(b.idiomas).size !== b.idiomas.length) throw new Error(`${donde} repite un idioma.`);
      for (const l of b.idiomas) {
        if (!b.titulo || !b.titulo[l]) throw new Error(`${donde} no tiene titulo en «${l}».`);
        if (!tiene(BOOKS, b.id) || !tiene(BOOKS[b.id], l)) {
          throw new Error(`${donde} no tiene su PDF «${l}» convertido: pon books/${b.id}.${l}.pdf y ejecuta python tools/books.py.`);
        }
      }
      for (const l of b.idiomas) {
        if (b.titulo[l].length > TITULO_LARGO) {
          avisos.push(`el titulo de «${b.id}» (${l}) tiene ${b.titulo[l].length} letras: en un lomo automatico puede quedar cortado; disenale el lomo (public/assets/lomos/${b.id}.${l}.svg).`);
        }
      }
      if (b.subtitulo) for (const l of Object.keys(b.subtitulo)) if (!b.idiomas.includes(l)) throw new Error(`${donde} tiene subtitulo en «${l}», que no es uno de sus idiomas.`);
    }
    vistos.add(b.id);

    /* El PDF se aleja mucho de lo que se espera de su tipo: no para, avisa. */
    const esperado = TIPOS[b.tipo].ratio;
    for (const [l, pdf] of Object.entries(tiene(BOOKS, b.id) ? BOOKS[b.id] : {})) {
      if (pdf && pdf.ratio && Math.abs(pdf.ratio - esperado) / esperado > 0.1) {
        avisos.push(`el libro «${b.id}» (${l}) tiene proporcion ${pdf.ratio} y su tipo «${b.tipo}» espera ${esperado}: se arma con la del PDF.`);
      }
    }
  }

  /* Las portadas (data/biblioteca.js → PORTADAS): una lista, vacia o no; cada una,
     un libro de LIBROS o una portada suelta con su imagen (en public/assets/portadas/),
     medidas y titulo. Las sueltas son las de la fila «Pronto» de Destacados. */
  if (PORTADAS !== undefined) {
    if (!Array.isArray(PORTADAS)) throw new Error('biblioteca.js: PORTADAS tiene que ser una lista.');
    PORTADAS.forEach((p, i) => {
      const donde = `biblioteca.js: la portada ${i + 1} de PORTADAS`;
      if (p.id !== undefined) {
        if (!vistos.has(p.id)) throw new Error(`${donde} nombra «${p.id}», que no esta en LIBROS.`);
      } else {
        if (!rutaPortadaValida(p.imagen)) {
          throw new Error(`${donde} necesita un id de LIBROS o una imagen del tipo assets/portadas/nombre.jpg.`);
        }
        if (!(p.ancho > 0) || !(p.alto > 0)) throw new Error(`${donde} no dice el ancho y el alto de su imagen.`);
        if (!p.titulo) throw new Error(`${donde} no tiene titulo.`);
      }
    });
  }

  /* La cartelera de Destacados: un libro que existe. */
  if (CARTELERA !== undefined && !(typeof CARTELERA === 'string' && vistos.has(CARTELERA))) {
    throw new Error(`biblioteca.js: la cartelera de Destacados nombra «${String(CARTELERA)}», que no esta en LIBROS.`);
  }

  /* Un PDF convertido que ningun libro usa: casi seguro se olvido su linea. */
  for (const id of Object.keys(BOOKS || {})) if (!vistos.has(id)) avisos.push(`hay un PDF convertido para «${id}», pero no esta en LIBROS.`);

  return avisos;
}
