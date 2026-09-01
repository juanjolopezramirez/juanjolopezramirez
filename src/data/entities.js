import { PARTNERS } from './partners.js';
import { PROJECTS } from './projects.js';
import { NAV } from './social.js';

/* Toda casa que sale en la pagina, buscable por su id.

   Una casa es un cliente con el que he caminado o un proyecto mio, y las
   dos listas ya existen — esto solo las junta para poder preguntar por
   una sin saber en cual de las dos vive. Sirve para que el nombre de una
   casa se escriba UNA vez: el credito de un video, la tarjeta y la cinta
   de logos leen todos de aqui, asi que no pueden decir cosas distintas.

   `kind` no es un campo que haya que acordarse de poner: sale de la lista
   de la que viene cada una. Si esta en PARTNERS es un aliado, si esta en
   PROJECTS es de casa. Anadir una casa a su lista es todo lo que hay que
   hacer — aqui no se toca nada. */
export const ENTITIES = [
  ...PARTNERS.map((e) => ({ ...e, kind: 'work' })),
  ...PROJECTS.map((e) => ({ ...e, kind: 'projects' }))
];

export const ENTITY = Object.fromEntries(ENTITIES.map((e) => [e.id, e]));

/* La direccion de cada casa: /es/recvid/, /en/casa-san-pedro/…

   Casi siempre es su id, pero un id que se lee bien en el codigo no
   siempre se lee bien en una URL: `u` no dice nada y `fraterniu` si. Por
   eso una casa puede traer su propio `slug`.

   La pagina de una casa cuelga del idioma, al mismo nivel que las
   secciones, asi que ninguna casa puede llamarse como una: Astro da
   prioridad a la ruta fija y la casa se quedaria sin pagina, en silencio.
   El aviso salta al construir, que es cuando todavia se puede arreglar. */
export const slugOf = (e) => e.slug ?? e.id;

export const ENTITY_BY_SLUG = Object.fromEntries(ENTITIES.map((e) => [slugOf(e), e]));

{
  const reservadas = new Set(NAV.map((n) => n.slug));
  const choque = ENTITIES.map(slugOf).filter((s) => reservadas.has(s));
  if (choque.length) {
    throw new Error(
      'Una casa se llama como una seccion y se quedaria sin pagina: ' + choque.join(', ')
    );
  }
}

/* =============================================================
   LOS FILTROS

   Cuatro ejes, y una casa puede llevar etiquetas de todos: por lo que
   hice, por a que se dedica, por cuando fue y por como esta hoy.

   COMO SE COMPORTAN. Dentro de un mismo eje las etiquetas SUMAN: marcar
   «Marca» y «Audiovisual» ensena las que sean una cosa o la otra. Entre
   ejes se CRUZAN: con «Marca» y «2025» puestos quedan las de marca que
   ademas sean de 2025. Es lo que espera cualquiera que haya filtrado
   algo alguna vez, y es lo que hace que cuatro ejes no se estorben.

   Ningun eje lleva boton de «todas»: no marcar nada en un eje ya es no
   filtrar por el. Un boton que no quita nada solo ocupa sitio.

   COMO SE LLENA. Cada casa declara una lista plana en su fichero:

     { id: 'bodega', name: 'Bodega', …,
       tags: ['marca', 'audiovisual', 'gastronomia', '2025', 'activo'] }

   Y cada etiqueta que se use tiene que estar nombrada aqui abajo, en su
   eje y en los cinco idiomas. La barra se construye sola con las que de
   verdad estan puestas en las casas de esa pagina: nunca ofrece filtrar
   por algo que no va a encontrar, y si no hay ninguna no se pinta.

   Los ejemplos van comentados porque son inventados. Descomenta los que
   valgan, borra los que no y anade los que falten.
   ============================================================= */
export const AXES = {
  work: {
    label: { es: 'Tipo de trabajo', en: 'Type of work', pt: 'Tipo de trabalho', fr: 'Type de travail', it: 'Tipo di lavoro' },
    tags: {
      // marca:       { es: 'Marca',       en: 'Brand',       pt: 'Marca',       fr: 'Marque',       it: 'Marchio' },
      // audiovisual: { es: 'Audiovisual', en: 'Audiovisual', pt: 'Audiovisual', fr: 'Audiovisuel',  it: 'Audiovisivo' },
      // web:         { es: 'Web',         en: 'Web',         pt: 'Web',         fr: 'Web',          it: 'Web' },
      // estrategia:  { es: 'Estrategia',  en: 'Strategy',    pt: 'Estrategia',  fr: 'Strategie',    it: 'Strategia' },
    }
  },
  sector: {
    label: { es: 'Sector', en: 'Sector', pt: 'Setor', fr: 'Secteur', it: 'Settore' },
    tags: {
      comunidad:   { es: 'Comunidad',   en: 'Community',   pt: 'Comunidade',  fr: 'Communauté',  it: 'Comunità' },
      audiovisual: { es: 'Audiovisual', en: 'Audiovisual', pt: 'Audiovisual', fr: 'Audiovisuel', it: 'Audiovisivo' },
      software:    { es: 'Software',    en: 'Software',    pt: 'Software',    fr: 'Logiciel',    it: 'Software' },
      deporte:     { es: 'Deporte',     en: 'Sport',       pt: 'Esporte',     fr: 'Sport',       it: 'Sport' },
      gastronomia: { es: 'Gastronomía', en: 'Food',        pt: 'Gastronomia',  fr: 'Gastronomie', it: 'Gastronomia' },
      inmobiliaria:{ es: 'Inmobiliaria',en: 'Real estate', pt: 'Imobiliária', fr: 'Immobilier',  it: 'Immobiliare' },
      finanzas:    { es: 'Finanzas',    en: 'Finance',     pt: 'Finanças',    fr: 'Finance',     it: 'Finanza' },
    }
  },
  year: {
    label: { es: 'Año', en: 'Year', pt: 'Ano', fr: 'Annee', it: 'Anno' },
    /* Los anos no se traducen, pero se nombran igual que el resto para que
       el eje no necesite un caso aparte. */
    tags: {
      // '2026': { es: '2026', en: '2026', pt: '2026', fr: '2026', it: '2026' },
      // '2025': { es: '2025', en: '2025', pt: '2025', fr: '2025', it: '2025' },
      // '2024': { es: '2024', en: '2024', pt: '2024', fr: '2024', it: '2024' },
    }
  },
  status: {
    label: { es: 'Estado', en: 'Status', pt: 'Estado', fr: 'Statut', it: 'Stato' },
    tags: {
      // activo:    { es: 'Activo',    en: 'Active',   pt: 'Ativo',      fr: 'En cours',  it: 'Attivo' },
      // terminado: { es: 'Terminado', en: 'Finished', pt: 'Concluido',  fr: 'Termine',   it: 'Concluso' },
      // pausa:     { es: 'En pausa',  en: 'On hold',  pt: 'Em pausa',   fr: 'En pause',  it: 'In pausa' },
    }
  }
};

/* En que eje vive cada etiqueta. Sale de AXES, asi que declarar una
   etiqueta arriba es todo lo que hay que hacer. */
export const AXIS_OF = Object.fromEntries(
  Object.entries(AXES).flatMap(([axis, a]) => Object.keys(a.tags).map((tag) => [tag, axis]))
);
