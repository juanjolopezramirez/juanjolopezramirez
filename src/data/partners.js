/* Con quienes he caminado. El orden de este array es el orden en que
   pasan por la cinta.

   `name` es lo que oye quien no ve el logo, asi que va el nombre de la
   casa y no el del fichero. `w` y `h` son los del original: los pide el
   navegador para reservar el hueco antes de descargarlo, y sin ellos la
   fila da un salto al cargar.

   `scale` es la escala optica — el porque esta explicado en projects.js,
   que usa la misma cinta y la misma regla.

   Los logos vienen en blanco sobre transparente, que es lo normal en una
   marca: por eso la cinta va sobre Night y no sobre hueso — en hueso no
   se verian. Al anadir uno nuevo, comprueba que sea claro; si viene en
   oscuro, no sirve para este fondo. */
/* Estas casas tambien tienen tarjeta y pagina propia. Los campos que las
   llenan —role, blurb, tags, slug, banner, works— son opcionales y estan
   explicados enteros, con un ejemplo para copiar, arriba de PROJECTS en
   projects.js: son los mismos para las dos listas y se explican una vez. */
export const PARTNERS = [
  { id: 'casa-san-pedro', name: 'Casa San Pedro', src: '/assets/partners/casa-san-pedro.svg', w: 287,  h: 220, scale: 1.10,
    tags: ['gastronomia'],
    blurb: {
      es: 'Cocina italiana y mediterránea entre Cajicá y Villa de Leyva. En un oficio donde lo difícil no es abrir sino seguir abierto, llevan diez años haciéndolo.',
      en: 'Italian and Mediterranean cooking between Cajicá and Villa de Leyva. In a trade where the hard part is not opening but staying open, they are ten years in.',
      pt: 'Cozinha italiana e mediterrânica entre Cajicá e Villa de Leyva. Num ofício onde o difícil não é abrir mas continuar aberto, levam dez anos a fazê-lo.',
      fr: 'Cuisine italienne et méditerranéenne entre Cajicá et Villa de Leyva. Dans un métier où le dur n’est pas d’ouvrir mais de rester ouvert, ils tiennent depuis dix ans.',
      it: 'Cucina italiana e mediterranea tra Cajicá e Villa de Leyva. In un mestiere dove il difficile non è aprire ma restare aperti, lo fanno da dieci anni.'
    } },
  { id: 'bodega',         name: 'Bodega Inmobiliaria', src: '/assets/partners/bodega.png',         w: 480,  h: 193, webp: '/assets/partners/bodega.webp', scale: 0.88,
    tags: ['inmobiliaria'],
    blurb: {
      es: 'Quince años de finca raíz en Bogotá y la Sabana. Vender una casa no es vender un producto: lo que cambia de manos es el sitio donde alguien va a vivir.',
      en: 'Fifteen years in property across Bogotá and the Sabana. Selling a home is not selling a product: what changes hands is the place where someone will live.',
      pt: 'Quinze anos de imobiliário em Bogotá e na Sabana. Vender uma casa não é vender um produto: o que muda de mãos é o sítio onde alguém vai viver.',
      fr: 'Quinze ans d’immobilier à Bogotá et dans la Sabana. Vendre une maison n’est pas vendre un produit : ce qui change de mains, c’est le lieu où quelqu’un va vivre.',
      it: 'Quindici anni di immobiliare a Bogotá e nella Sabana. Vendere una casa non è vendere un prodotto: ciò che passa di mano è il posto dove qualcuno vivrà.'
    } },
  /* Estas dos no son clientes: son casa. Por eso llevan su propia linea
     de «que es» y no la que pone la lista — y esa linea dice de quien es,
     que es mas concreto que llamarlas aliadas y no dice menos. */
  { id: 'capitalxmio',    name: 'Capitalxm.io',   src: '/assets/partners/capitalxmio.svg',    w: 1278, h: 188, scale: 0.62,
    tags: ['finanzas', 'inmobiliaria', 'software'],
    role: {
      es: 'Proyecto de mi padre', en: 'My father’s project', pt: 'Projeto do meu pai',
      fr: 'Le projet de mon père', it: 'Il progetto di mio padre'
    },
    blurb: {
      es: 'De la preventa a la financiación de un proyecto inmobiliario: fiduciaria, constructor e inversionista, y el dinero que solo se mueve cuando la obra se mueve.',
      en: 'From presale to funding on a real estate project: trustee, developer and investor, and money that only moves when the building actually moves.',
      pt: 'Da pré-venda ao financiamento de um projeto imobiliário: fiduciária, construtor e investidor, e o dinheiro que só se move quando a obra se move.',
      fr: 'De la prévente au financement d’un projet immobilier : fiduciaire, promoteur et investisseur, et un argent qui ne bouge que lorsque le chantier bouge.',
      it: 'Dalla prevendita al finanziamento di un progetto immobiliare: fiduciaria, costruttore e investitore, e il denaro che si muove solo quando si muove il cantiere.'
    } },
  { id: 'su-essencia',    name: 'Su Essencia',    src: '/assets/partners/su-essencia.svg',    w: 1565, h: 306, scale: 0.68,
    tags: ['comunidad'],
    role: {
      es: 'Proyecto de mi madre', en: 'My mother’s project', pt: 'Projeto da minha mãe',
      fr: 'Le projet de ma mère', it: 'Il progetto di mia madre'
    },
    blurb: {
      es: 'Comunidad digital para volver a lo esencial: desde el amor y la verdad, lejos del ritual. Recursos para cuidar tres vínculos: con Dios, con uno mismo y con los demás.',
      en: 'Digital community for returning to the essential: from love and truth, far from ritual. Resources for tending three bonds: with God, with yourself and with others.',
      pt: 'Comunidade digital para voltar ao essencial: desde o amor e a verdade, longe do ritual. Recursos para cuidar de três vínculos: com Deus, consigo e com os outros.',
      fr: 'Communauté numérique pour revenir à l’essentiel : depuis l’amour et la vérité, loin du rituel. De quoi soigner trois liens : à Dieu, à soi-même et aux autres.',
      it: 'Comunità digitale per tornare all’essenziale: dall’amore e dalla verità, lontano dal rituale. Risorse per curare tre legami: con Dio, con sé stessi e con gli altri.'
    } }
];
