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
*/

/* El orden es el de la lista que pidio el fundador. */
export const SECCIONES = [
  { id: 'tecnologia',   nombre: { es: 'Tecnología',   en: 'Technology',  pt: 'Tecnologia',  fr: 'Technologie', it: 'Tecnologia' } },
  { id: 'teologia',     nombre: { es: 'Teología',     en: 'Theology',    pt: 'Teologia',    fr: 'Théologie',   it: 'Teologia' } },
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

export const LIBROS = [
  { id: 'ahava', seccion: 'teologia', tipo: 'revista', glosario: true },
  { id: 'emet',  seccion: 'teologia', tipo: 'revista', glosario: true },
  { id: 'agape', seccion: 'teologia', tipo: 'revista', glosario: true },
  { id: 'rhema', seccion: 'teologia', tipo: 'revista', glosario: true }
];
