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
  /* LA CASA SIN LOGOS. Hay encargos cuya marca no autorizo que su nombre ni
     su logo salieran de aqui, y un logo sacado de la marca de agua de sus
     propios videos no es una autorizacion. Antes esta ficha llevaba el
     nombre y el logotipo del cliente; ahora lleva un mas —`mark: 'mas'`— y
     un rotulo. El trabajo no se esconde, la firma ajena si.

     Sin `src`: no hay fichero que ensenar, y tanto la cinta como la cara
     redonda saben poner el icono en su lugar. `w` y `h` solo ordenan la
     cinta, asi que cuadrado y ya. */
  { id: 'otras-marcas',
    name: { es: 'Otras marcas', en: 'Other brands', pt: 'Outras marcas', fr: 'Autres marques', it: 'Altri marchi' },
    mark: 'mas', w: 1, h: 1, scale: 1,
    tags: ['finanzas'],
    role: { es: 'Trabajos por encargo', en: 'Commissioned work', pt: 'Trabalhos por encomenda', fr: 'Travaux de commande', it: 'Lavori su commissione' },
    blurb: {
      es: 'Piezas hechas para marcas que no autorizaron que su nombre ni su logo salieran aquí. El trabajo es mío; la firma es suya. Quedan bajo clave y se enseñan a quien las pida.',
      en: 'Pieces made for brands that did not authorise their name or logo here. The work is mine; the signature is theirs. They stay behind a key and are shown on request.',
      pt: 'Peças feitas para marcas que não autorizaram que o seu nome nem o seu logótipo aparecessem aqui. O trabalho é meu; a assinatura é delas. Ficam sob chave e mostram-se a quem as pedir.',
      fr: 'Des pièces faites pour des marques qui n’ont pas autorisé leur nom ni leur logo ici. Le travail est le mien ; la signature est la leur. Elles restent sous clé et se montrent à qui les demande.',
      it: 'Pezzi fatti per marchi che non hanno autorizzato né il loro nome né il loro logo qui. Il lavoro è mio; la firma è loro. Restano sotto chiave e si mostrano a chi le chiede.'
    } },
  /* Estas dos no son clientes, y por eso llevan su propia linea de «que es»
     y no la que pone la lista: son aliadas. Antes esa linea decia de quien
     era cada una —el proyecto de mi padre, el de mi madre—; se cambio por
     «Aliado» porque en una tarjeta publica lo que importa es la relacion
     de trabajo, no el parentesco (decision del fundador). */
  { id: 'capitalxmio',    name: 'Capitalxm.io',   src: '/assets/partners/capitalxmio.svg',    w: 1278, h: 188, scale: 0.62,
    tags: ['finanzas', 'inmobiliaria', 'software'],
    role: { es: 'Aliado', en: 'Ally', pt: 'Aliado', fr: 'Allié', it: 'Alleato' },
    blurb: {
      es: 'De la preventa a la financiación de un proyecto inmobiliario: fiduciaria, constructor e inversionista, y el dinero que solo se mueve cuando la obra se mueve.',
      en: 'From presale to funding on a real estate project: trustee, developer and investor, and money that only moves when the building actually moves.',
      pt: 'Da pré-venda ao financiamento de um projeto imobiliário: fiduciária, construtor e investidor, e o dinheiro que só se move quando a obra se move.',
      fr: 'De la prévente au financement d’un projet immobilier : fiduciaire, promoteur et investisseur, et un argent qui ne bouge que lorsque le chantier bouge.',
      it: 'Dalla prevendita al finanziamento di un progetto immobiliare: fiduciaria, costruttore e investitore, e il denaro che si muove solo quando si muove il cantiere.'
    } },
  { id: 'su-essencia',    name: 'Su Essencia',    src: '/assets/partners/su-essencia.svg',    w: 1565, h: 306, scale: 0.68,
    tags: ['comunidad'],
    role: { es: 'Aliado', en: 'Ally', pt: 'Aliado', fr: 'Allié', it: 'Alleato' },
    blurb: {
      es: 'Comunidad digital para volver a lo esencial: desde el amor y la verdad, lejos del ritual. Recursos para cuidar tres vínculos: con Dios, con uno mismo y con los demás.',
      en: 'Digital community for returning to the essential: from love and truth, far from ritual. Resources for tending three bonds: with God, with yourself and with others.',
      pt: 'Comunidade digital para voltar ao essencial: desde o amor e a verdade, longe do ritual. Recursos para cuidar de três vínculos: com Deus, consigo e com os outros.',
      fr: 'Communauté numérique pour revenir à l’essentiel : depuis l’amour et la vérité, loin du rituel. De quoi soigner trois liens : à Dieu, à soi-même et aux autres.',
      it: 'Comunità digitale per tornare all’essenziale: dall’amore e dalla verità, lontano dal rituale. Risorse per curare tre legami: con Dio, con sé stessi e con gli altri.'
    } }
];
