/* La biblioteca de Recursos (/es/writing/): los datos y nada mas.

   Tres listas. Las SECCIONES son los temas en que se guardan los libros; los
   TIPOS dicen como es cada clase de libro; y los LIBROS dicen cual es cada uno.
   Aqui no hay codigo: comprobar() y variante() viven en scripts/biblioteca.js
   (puras, con prueba en Node) y las llama Biblioteca.astro al compilar.

   DOS CLASES DE LIBRO.

   · LOS DE UNA PALABRA (`glosario: true`): ahava, emet, agape, rhema. Su texto
     sale de terms.js, term-cards.js y term-book.js, en los CINCO idiomas, y no
     se escribe aqui. Son los unicos libros en cinco idiomas. Tambien abren
     desde las palabras subrayadas de toda la web. Son REVISTAS (pasta blanda).
     (Timoteo es una palabra del glosario, pero no tiene libro escrito: en
     cuanto lo tenga, una linea aqui.)

   · LOS DEMAS: SOLO EN ESPAÑOL E INGLES, y no todos en los dos. `idiomas` dice
     en cuales esta, `titulo` lo tiene en cada uno, y su PDF va en
     books/<id>.es.pdf y/o books/<id>.en.pdf (tools/books.py). Un libro de
     un solo idioma se ve igual en todas las paginas de la web, con una marca
     ES o EN cuando su idioma no es el de la pagina.

   - AÑADIR UN LIBRO: una linea en LIBROS. El orden de la lista es el orden en
     la estanteria. Si falta algo (su palabra, su PDF convertido, su titulo en
     un idioma), la compilacion se para y dice que.
   - UN TEMA SIN LIBROS no se dibuja: ni «pronto» ni su nombre. El dia que
     llegue su primer libro, el estante aparece solo, en su orden.
   - LA PORTADA tampoco se declara: si el libro tiene PDF se usa su primera
     pagina; si no, se dibuja con la palabra. EL LOMO tampoco, pero se puede
     diseñar: public/assets/lomos/<id>.<idioma>.svg o <id>.svg (ver
     data/lomos.js). Sin archivo, el lomo se dibuja solo.
   - El id del libro es tambien su direccion: /es/writing/#libertad. Por eso
     es una palabra en minusculas sin guiones, y no se repite.

   Campos de un libro:
     id        'libertad'
     seccion   un id de SECCIONES
     tipo      'tapa-dura' | 'revista' | 'comic'   (ver TIPOS)
     glosario  true solo en los de una palabra
     idiomas   ['es'] | ['en'] | ['es', 'en']       (no en los de una palabra)
     titulo    { es: '…', en: '…' } y, si quiere, subtitulo { … } (no en los de una palabra)
     grosor    'fino' | 'medio' | 'grueso'  (opcional: si no, sale de las paginas)
     tono      'ocre' | 'salvia' | 'pizarra' | 'tierra' | 'niebla' | 'arena'
               (opcional: el color de su lomo y de su portada dibujada; si no,
               el del carton de su PDF, o pino)
*/

import LIBROS_DEL_PANEL from './remoto/biblioteca.js';
import { BOOKS } from './books.js';

/* El orden es el de la lista que pidio el fundador.

   «Teologia» es la de los libros de una palabra (Ahava, Emet, Agape, Rhema…).
   «Contrabando teologico» es la de sus libros propios —«Nada que demostrar» y
   los que vengan—: lo que se cuela de contrabando en la teologia. */
export const SECCIONES = [
  { id: 'tecnologia',   nombre: { es: 'Tecnología',   en: 'Technology',  pt: 'Tecnologia',  fr: 'Technologie', it: 'Tecnologia' } },
  { id: 'teologia',     nombre: { es: 'Teología',     en: 'Theology',    pt: 'Teologia',    fr: 'Théologie',   it: 'Teologia' } },
  { id: 'contrabando',  nombre: { es: 'Contrabando teológico', en: 'Theological contraband', pt: 'Contrabando teológico', fr: 'Contrebande théologique', it: 'Contrabbando teologico' } },
  { id: 'diseno',       nombre: { es: 'Diseño',       en: 'Design',      pt: 'Design',      fr: 'Design',      it: 'Design' } },
  { id: 'musica',       nombre: { es: 'Música',       en: 'Music',       pt: 'Música',      fr: 'Musique',     it: 'Musica' } },
  { id: 'prompts',      nombre: { es: 'Prompts',      en: 'Prompts',     pt: 'Prompts',     fr: 'Prompts',     it: 'Prompt' } },
  { id: 'viajes',       nombre: { es: 'Viajes',       en: 'Travel',      pt: 'Viagens',     fr: 'Voyages',     it: 'Viaggi' } },
  { id: 'experiencias', nombre: { es: 'Experiencias', en: 'Experiences', pt: 'Experiências', fr: 'Expériences', it: 'Esperienze' } }
];

/* Como es cada clase de libro.
     blando   pasta blanda: la tapa y la contratapa se doblan como el resto de
              las hojas, no hay cartones, el papel suena a papel, el lomo es
              fino y lleva grapa.
     ratio    ancho / alto esperado. Solo avisa si el PDF se aleja mucho de el
              (tools/books.py lo mide); no para nada. */
export const TIPOS = {
  'tapa-dura': { blando: false, ratio: 0.7143 },   // 5:7
  'revista':   { blando: true,  ratio: 0.7071 },   // A4
  'comic':     { blando: true,  ratio: 0.65 }
};

/* LA CARTELERA de Destacados: el libro grande que abre la seccion, como el
   estreno de Netflix (Destacados.astro). Es el id de un libro de LIBROS: si no
   esta en la lista, la compilacion se para y lo dice; si esta pero no se puede
   abrir en el idioma de una pagina (sin version que abrir), en esa pagina sale el
   primero que si. Lo ideal es uno con portada de verdad (con PDF): su primera
   pagina hace de fondo y se mueve con el scroll. */
export const CARTELERA = 'ahava';

/* LAS PORTADAS de Recursos. Las TRES PRIMERAS salen en la cabecera, de frente sobre
   una repisa (RepisaLibros.astro), y las SUELTAS (la de un libro que aun se
   escribe) salen ademas en la fila «Pronto» de Destacados. Cada una es:
     { id }       un libro de LIBROS: se ve su portada y, al tocarla, se abre
     { imagen, ancho, alto, titulo, subtitulo }
                  la portada SUELTA de un libro que aun se esta escribiendo: solo
                  se ve (no hay a donde llevar). La imagen va en
                  public/assets/portadas/. El dia que tenga su PDF, se pasa a LIBROS
                  y aqui se quita la suelta.
   Pueden ser las que sean (o ninguna); la cabecera enseña las tres primeras. */
export const PORTADAS = [
  { id: 'ahava' },
  { imagen: 'assets/portadas/nada-que-demostrar.jpg', ancho: 840, alto: 1189, titulo: 'Nada que demostrar', subtitulo: 'El juego que el Amor ya ganó' },
  { id: 'emet' }
];

/* `tono` es el color del libro, de los de TONOS (scripts/biblioteca.js): lo usan
   su lomo y su portada dibujada. Cada uno el suyo, y alternados: oro claro,
   salvia, pizarra y oro hondo; asi la estanteria no es una fila del mismo pino. */
export const LIBROS_DEL_CODIGO = [
  { id: 'ahava', seccion: 'teologia', tipo: 'revista', glosario: true, tono: 'ocre' },
  { id: 'emet',  seccion: 'teologia', tipo: 'revista', glosario: true, tono: 'salvia' },
  { id: 'agape', seccion: 'teologia', tipo: 'revista', glosario: true, tono: 'pizarra' },
  { id: 'rhema', seccion: 'teologia', tipo: 'revista', glosario: true, tono: 'tierra' }
];

/* Y detras, los que el fundador publico desde el panel (Developer-Mode): llegan en
   remoto/biblioteca.js, ya en esta misma forma y con `panel: true` (y su idioma
   original, que puede no ser ni español ni ingles). Sin nada publicado, la lista es la
   de siempre. */
/* Un libro del panel sale solo en los idiomas cuyo PDF se convirtio (tools/books.py salta,
   con aviso, un PDF roto o con paginas fuera de lo normal); si no quedo ninguno, se queda
   fuera ese libro y la web se publica igual. Los del codigo, en cambio, paran la
   compilacion si les falta algo (scripts/biblioteca.js → comprobar). */
const convertido = (l) => {
  const idiomas = (l.idiomas || []).filter((x) => Object.prototype.hasOwnProperty.call(BOOKS, l.id) && Object.prototype.hasOwnProperty.call(BOOKS[l.id], x));
  if (!idiomas.length) return null;
  /* El titulo y el subtitulo, solo en los idiomas que quedan (comprobar() no deja un
     subtitulo en un idioma que el libro no tiene) */
  const solo = (o) => Object.fromEntries(Object.entries(o || {}).filter(([x]) => idiomas.includes(x)));
  const { subtitulo, ...resto } = l;
  const sub = solo(subtitulo);
  return { ...resto, idiomas, titulo: solo(l.titulo), ...(Object.keys(sub).length ? { subtitulo: sub } : {}) };
};
export const LIBROS = [...LIBROS_DEL_CODIGO, ...LIBROS_DEL_PANEL.map(convertido).filter(Boolean)];
