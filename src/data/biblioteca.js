/* La biblioteca de Recursos (/es/writing/).

   Dos listas y nada mas. Las SECCIONES son los temas en que se guardan los
   libros; los LIBROS dicen en cual esta cada uno. Un libro es una palabra
   que ya tiene su libro (terms.js, term-cards.js, term-book.js): aqui no se
   escribe ni un titulo, todo sale de alli.

   - AÑADIR UN LIBRO: una linea en LIBROS. El orden de la lista es el orden
     en la estanteria. Su palabra tiene que existir en TERMS, GLOSS, CARDS y
     DEEP; si no, la compilacion se para y dice cual falta.
   - UNA SECCION SIN LIBROS sale como «pronto»: no hay bandera que cambiar,
     se deduce de que ningun libro la nombra. El dia que llegue su primer
     libro, sale sola como estante.
   - LA PORTADA tampoco se declara: si el libro tiene PDF en el idioma de la
     pagina (books.js) se usa su primera pagina (la imagen de 900 px); si no,
     la portada se dibuja con la palabra.

   El id del libro es tambien su direccion: /es/writing/#ahava. Por eso es una
   palabra en minusculas sin guiones, no puede repetirse y no puede llamarse
   como otra ancla de la pagina. */
import { TERMS } from '../i18n/terms.js';
import { GLOSS, CARDS } from '../i18n/term-cards.js';
import { DEEP } from '../i18n/term-book.js';

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

export const LIBROS = [
  { id: 'ahava', seccion: 'teologia' },
  { id: 'emet',  seccion: 'teologia' },
  { id: 'agape', seccion: 'teologia' },
  { id: 'rhema', seccion: 'teologia' }
];

/* Ids de una sola palabra que la pagina ya usa (la biblioteca, el panel del
   libro, sus iconos): un libro con ese id taparia la ancla. Los demas ids de
   la pagina llevan guion (`book-panel`, `biblio-titulo`) y no pueden chocar
   porque el id de un libro no puede llevarlo. */
const RESERVADOS = new Set(['top', 'main', 'biblioteca', 'book', 'flip', 'arrow', 'info', 'mark', 'corner', 'toast',
  'curtain', 'globe', 'lockup', 'links', 'mas']);

/* Lo que makePages (site.js) necesita para armar el libro: si falta una de
   estas, el libro se abriria en blanco o rompiendo. */
const LECTURAS = ['now', 'history', 'theology'];
const NIVELES = ['peshat', 'remez', 'derash', 'sod', 'sources'];

/* Se comprueba al compilar: un libro mal puesto no llega a publicarse. */
(function comprobar() {
  const secciones = new Set(SECCIONES.map((s) => s.id));
  const vistos = new Set();
  for (const b of LIBROS) {
    const donde = `biblioteca.js: el libro «${b.id}»`;
    if (!/^[a-z][a-z0-9]*$/.test(b.id)) throw new Error(`${donde} tiene un id que no es una palabra en minusculas sin guiones.`);
    if (!Object.hasOwn(TERMS, b.id) || !Object.hasOwn(GLOSS, b.id) || !Object.hasOwn(CARDS, b.id) || !Object.hasOwn(DEEP, b.id)) {
      throw new Error(`${donde} no tiene su palabra completa en TERMS, GLOSS, CARDS y DEEP.`);
    }
    for (const k of LECTURAS) if (!CARDS[b.id][k]) throw new Error(`${donde} no tiene la lectura «${k}» en CARDS.`);
    for (const k of NIVELES) if (!DEEP[b.id][k]) throw new Error(`${donde} no tiene «${k}» en DEEP.`);
    if (!Array.isArray(DEEP[b.id].sources)) throw new Error(`${donde} tiene «sources» en DEEP y no es una lista.`);
    if (!secciones.has(b.seccion)) throw new Error(`${donde} esta en la seccion «${b.seccion}», que no existe.`);
    if (vistos.has(b.id)) throw new Error(`${donde} esta repetido.`);
    if (RESERVADOS.has(b.id)) throw new Error(`${donde} se llama como una ancla de la pagina.`);
    vistos.add(b.id);
  }
  for (const s of SECCIONES) {
    for (const l of ['es', 'en', 'pt', 'fr', 'it']) {
      if (!s.nombre[l]) throw new Error(`biblioteca.js: la seccion «${s.id}» no tiene nombre en «${l}».`);
    }
  }
})();
