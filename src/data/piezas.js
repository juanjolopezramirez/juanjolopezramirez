/* Los videos que hice, en la pagina de la casa para la que los hice.

   CADA PIEZA:
     id           su nombre corto, unico.
     casa         el id de la casa (PARTNERS o PROJECTS). Toda pieza tiene
                  su casa con tarjeta: ninguna se queda suelta.
     orientacion  'vertical' u 'horizontal'. La tarjeta lo dice con su icono,
                  y el visor se abre con la forma de la pieza.
     seg          lo que dura, en segundos.
     archivo      donde viven el video y su portada, sin extension, bajo
                  /assets/videos/piezas/. De ahi salen .mp4, .webp y .jpg.
     youtube      solo las que viven en YouTube: el id del video. Mientras
                  este vacio, la tarjeta dice «pronto» y no abre nada. Su
                  portada es la del propio corto, la misma que en YouTube.
     clave        true si la pieza NO se publica todavia. Son trabajos
                  reales, pero llevan impresa la marca de quien los encargo
                  y esa marca no autorizo que saliera aqui. Cuando exista la
                  clave dinamica, estas son las que quedaran detras de ella;
                  mientras tanto no salen del ordenador: ni tarjeta, ni
                  portada, ni fichero en el sitio.
     title        en los cinco idiomas.

   DONDE VIVEN. Las verticales son cortas y van dentro del sitio, comprimidas
   a 720x1280 y unos 2 Mbps: en un telefono se ven igual que el original y
   pesan entre 2 y 10 MB. Los tres cortometrajes del colegio son largos y
   horizontales, y GitHub no acepta ficheros de mas de 100 MB: van a YouTube,
   y aqui solo esta su portada.

   El orden es el de la pagina: lo mas reciente y lo mas representativo
   primero, y las versiones de una misma pieza, juntas. */

export const PIEZAS = [
  /* ---------- Fraterni Ventures ---------- */
  {
    id: 'esperanza', casa: 'fraterni', orientacion: 'vertical', seg: 23, archivo: 'fraterni/esperanza',
    title: { es: 'Esperanza', en: 'Hope', pt: 'Esperança', fr: 'Espoir', it: 'Speranza' }
  },
  {
    id: 'fe', casa: 'fraterni', orientacion: 'vertical', seg: 43, archivo: 'fraterni/fe',
    title: { es: 'Fe', en: 'Faith', pt: 'Fé', fr: 'Foi', it: 'Fede' }
  },

  /* ---------- FraterniU ---------- */
  {
    id: 'el-cambio-de-felipe', casa: 'u', orientacion: 'vertical', seg: 52, archivo: 'fraterniu/el-cambio-de-felipe',
    title: { es: 'El cambio de Felipe', en: 'Felipe’s change', pt: 'A mudança do Felipe', fr: 'Le changement de Felipe', it: 'Il cambiamento di Felipe' }
  },
  {
    id: 'la-ia-para-tus-pdf', casa: 'u', orientacion: 'vertical', seg: 24, archivo: 'fraterniu/la-ia-para-tus-pdf',
    title: { es: 'La IA ideal para tus PDF', en: 'The right AI for your PDFs', pt: 'A IA ideal para os teus PDF', fr: 'L’IA idéale pour vos PDF', it: 'L’IA ideale per i tuoi PDF' }
  },
  {
    id: 'seis-anos-despues', casa: 'u', orientacion: 'vertical', seg: 39, archivo: 'fraterniu/seis-anos-despues',
    title: { es: 'Seis años después', en: 'Six years later', pt: 'Seis anos depois', fr: 'Six ans plus tard', it: 'Sei anni dopo' }
  },

  /* ---------- Juan José López Ramírez: lo del colegio ---------- */
  {
    id: 'buena-suerte', casa: 'juanjo', orientacion: 'horizontal', seg: 560, archivo: 'juanjo/buena-suerte', youtube: '0qkgWunyHyY',
    title: { es: 'Buena Suerte', en: 'Buena Suerte', pt: 'Buena Suerte', fr: 'Buena Suerte', it: 'Buena Suerte' }
  },
  {
    id: 'sin-mi-heroe', casa: 'juanjo', orientacion: 'horizontal', seg: 171, archivo: 'juanjo/sin-mi-heroe', youtube: 'oT8jYCJ1a-k',
    title: { es: 'Sin mi héroe', en: 'Sin mi héroe', pt: 'Sin mi héroe', fr: 'Sin mi héroe', it: 'Sin mi héroe' }
  },
  {
    id: 'silencio', casa: 'juanjo', orientacion: 'horizontal', seg: 323, archivo: 'juanjo/silencio', youtube: 'WuBMiVsVi6A',
    title: { es: 'Silencio', en: 'Silencio', pt: 'Silencio', fr: 'Silencio', it: 'Silencio' }
  },
  {
    id: 'color-cinematografico', casa: 'juanjo', orientacion: 'vertical', seg: 11, archivo: 'juanjo/color-cinematografico',
    title: { es: 'Color cinematográfico', en: 'Cinematic colour', pt: 'Cor cinematográfica', fr: 'Couleur cinématographique', it: 'Colore cinematografico' }
  },

  /* ---------- Bodega Inmobiliaria ---------- */
  {
    id: 'el-prado-v1', casa: 'bodega', orientacion: 'vertical', seg: 33, archivo: 'bodega/el-prado-v1',
    title: { es: 'Edificio El Prado · versión 1', en: 'El Prado building · version 1', pt: 'Edifício El Prado · versão 1', fr: 'Immeuble El Prado · version 1', it: 'Edificio El Prado · versione 1' }
  },
  {
    id: 'el-prado-v2', casa: 'bodega', orientacion: 'vertical', seg: 25, archivo: 'bodega/el-prado-v2',
    title: { es: 'Edificio El Prado · versión 2', en: 'El Prado building · version 2', pt: 'Edifício El Prado · versão 2', fr: 'Immeuble El Prado · version 2', it: 'Edificio El Prado · versione 2' }
  },
  {
    id: 'toledo-v1', casa: 'bodega', orientacion: 'vertical', seg: 22, archivo: 'bodega/toledo-v1',
    title: { es: 'Edificio Toledo · versión 1', en: 'Toledo building · version 1', pt: 'Edifício Toledo · versão 1', fr: 'Immeuble Toledo · version 1', it: 'Edificio Toledo · versione 1' }
  },
  {
    id: 'toledo-v2', casa: 'bodega', orientacion: 'vertical', seg: 26, archivo: 'bodega/toledo-v2',
    title: { es: 'Edificio Toledo · versión 2', en: 'Toledo building · version 2', pt: 'Edifício Toledo · versão 2', fr: 'Immeuble Toledo · version 2', it: 'Edificio Toledo · versione 2' }
  },

  /* ---------- Casa San Pedro ---------- */
  {
    id: 'fin-de-ano-2025', casa: 'casa-san-pedro', orientacion: 'vertical', seg: 44, archivo: 'casa-san-pedro/fin-de-ano-2025',
    title: { es: 'Fin de año 2025 en Villa de Leyva', en: 'New Year’s Eve 2025 in Villa de Leyva', pt: 'Passagem de ano 2025 em Villa de Leyva', fr: 'Réveillon 2025 à Villa de Leyva', it: 'Capodanno 2025 a Villa de Leyva' }
  },
  {
    id: 'un-dia-en-casa-san-pedro', casa: 'casa-san-pedro', orientacion: 'vertical', seg: 23, archivo: 'casa-san-pedro/un-dia-en-casa-san-pedro',
    title: { es: 'Un día en Casa San Pedro', en: 'A day at Casa San Pedro', pt: 'Um dia na Casa San Pedro', fr: 'Une journée à Casa San Pedro', it: 'Un giorno a Casa San Pedro' }
  },
  {
    id: 'la-carta', casa: 'casa-san-pedro', orientacion: 'vertical', seg: 11, archivo: 'casa-san-pedro/la-carta',
    title: { es: 'La carta', en: 'The menu', pt: 'O menu', fr: 'La carte', it: 'Il menù' }
  },

  /* ---------- Otras marcas ---------- */
  /* Bajo clave las dos: el video lleva impresa la marca de agua de quien lo
     encargo —esta en cada fotograma, tambien en la portada— y esa casa no
     autorizo que su nombre ni su logo salieran aqui. Los ficheros no viven
     en `public/`: lo que se publica se puede descargar, con clave o sin
     ella, asi que mientras no haya donde guardarlos aparte, no se suben. La
     ficha queda, para saber que existen. */
  {
    id: 'pensiones-v1', casa: 'otras-marcas', orientacion: 'vertical', seg: 145, archivo: 'otras-marcas/pensiones-v1', clave: true,
    title: { es: 'Asesoría en pensiones', en: 'Pension advice', pt: 'Assessoria em pensões', fr: 'Conseil en retraite', it: 'Consulenza sulle pensioni' }
  },
  {
    id: 'pensiones-v2', casa: 'otras-marcas', orientacion: 'vertical', seg: 78, archivo: 'otras-marcas/pensiones-v2', clave: true,
    title: { es: 'Asesoría en pensiones · versión corta', en: 'Pension advice · short version', pt: 'Assessoria em pensões · versão curta', fr: 'Conseil en retraite · version courte', it: 'Consulenza sulle pensioni · versione breve' }
  }
];

/* Lo que de verdad sale en la pagina. Las paginas leen esta, nunca PIEZAS:
   una pieza bajo clave no tiene tarjeta, ni portada, ni sitio en el filtro.
   PIEZAS se queda como el inventario completo de lo que he hecho. */
export const PIEZAS_PUBLICAS = PIEZAS.filter((p) => !p.clave);

/* Lo que se dice encima de las piezas de una casa, si hace falta decir algo.
   Las del colegio no son encargos: sin esta linea parecerian clientes. */
export const NOTAS = {
  'otras-marcas': {
    es: 'Estas piezas están bajo clave: las marcas que las encargaron no autorizaron que su nombre ni su logo salieran aquí. Se enseñan a quien las pida.',
    en: 'These pieces are behind a key: the brands that commissioned them did not authorise their name or logo here. They are shown on request.',
    pt: 'Estas peças estão sob chave: as marcas que as encomendaram não autorizaram que o seu nome nem o seu logótipo aparecessem aqui. Mostram-se a quem as pedir.',
    fr: 'Ces pièces sont sous clé : les marques qui les ont commandées n’ont pas autorisé leur nom ni leur logo ici. Elles se montrent à qui les demande.',
    it: 'Questi pezzi sono sotto chiave: i marchi che li hanno commissionati non hanno autorizzato né il loro nome né il loro logo qui. Si mostrano a chi li chiede.'
  },
  juanjo: {
    es: 'Trabajos del colegio. Cada uno me enseñó algo que todavía uso, y juntos me prepararon para lo que hoy construyo con Fraterni.',
    en: 'School projects. Each one taught me something I still use, and together they prepared me for what I’m building with Fraterni.',
    pt: 'Trabalhos da escola. Cada um ensinou-me algo que ainda uso, e juntos prepararam-me para o que hoje construo com a Fraterni.',
    fr: 'Des travaux faits au lycée. Chacun m’a appris quelque chose que j’utilise encore, et ensemble ils m’ont préparé à ce que je construis avec Fraterni.',
    it: 'Lavori della scuola. Ognuno mi ha insegnato qualcosa che uso ancora, e insieme mi hanno preparato a ciò che oggi costruisco con Fraterni.'
  }
};

export const piezasDe = (casa) => PIEZAS_PUBLICAS.filter((p) => p.casa === casa);

/* «3:05», «0:23». */
export const duracion = (seg) => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
