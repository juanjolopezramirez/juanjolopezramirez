/* Las casas, y a cual va cada quien.

   (El texto que se LEE en cada ficha —pregunta, correccion, porque, mision
   y vision— vive en `manifesto.js`, que tambien lo usa la pagina de cada
   casa. Aqui quedan la direccion, el logo y la pista corta, que es lo que
   se enseña si a una casa le falta su manifiesto.)

   `grupo` dice en que bloque del directorio va cada una: 'exposicion'
   (Let Be y Recvid, arriba y lado a lado) o 'fraterni' (los productos
   Fraterni, abajo, en pestañas y dentro del marco de Fraterni Ventures).

   `padre` dice de quien es un producto: Fraterni Academy es de FraterniU y
   Fraterni Business es de Fraterni Us. Las pestañas los ponen juntos, y el
   orden de esta lista es el suyo: cada madre y, detras, lo suyo. `corto` es
   como se llama el producto en su pestaña, que ya va pegada a la de su
   madre: «Fraterni» se leeria dos veces seguidas.

   `wordmark` es el logotipo con el nombre escrito. Si lo hay, la ficha lo
   pone en lugar del nombre en texto, y `logo` es entonces el simbolo.

   ESTA PAGINA YA NO RECOGE NADA. Antes habia un asistente de diez pasos que
   guardaba la solicitud en una base de datos; ahora la solicitud se hace en
   la casa que la va a atender, que es donde esta el equipo y donde estan las
   respuestas. Aqui solo se decide por cual puerta.

   Y esa decision es TODO el trabajo de esta pagina. Un directorio que solo
   pone nombres obliga al visitante a adivinar; si adivina mal escribe al
   sitio equivocado y la peticion muere ahi. De cada casa quedan aqui:

     role   el oficio, en tres palabras.
     hint   el criterio. Una frase que dice a que se viene y otra que dice
            con que se sale. Sin la primera, las casas suenan igual.

   DOS DE ELLAS ENSEÑAN, que es donde alguien puede dudar. La linea que las
   separa tiene que estar en el texto o no esta en ninguna parte: Recvid
   asesora en un OFICIO —camara, edicion, marketing— y FraterniU forma a la
   PERSONA que lo va a ejercer. No compiten: una va antes.

   RECVID ADEMAS DICE LO QUE YA NO VENDE. Dejo de ejecutar por encargo, y
   no solo el rodaje: tambien el marketing. Lo que ofrece es el consejo
   para que lo hagas tu; hacerlo en tu lugar es la excepcion, no el
   catalogo. Callarlo seria dejar que alguien pida un video de marca o una
   campaña, se vaya a otra pagina y descubra alli que no era el sitio.

   FRATERNI VENTURES VA APARTE, y no por jerarquia: es la matriz. En el
   directorio no se explica —ni pregunta ni frase—: su logotipo encierra a
   la familia, y el enlace lleva a su sitio, que es donde se habla de
   sociedad, inversion y prensa.

   El enlace sale del sitio, asi que se enseña el dominio: quien pulsa tiene
   derecho a saber a donde va antes de pulsar. */

export const HOUSES = [
  {
    id: 'let-be',
    grupo: 'exposicion',
    logo: '/assets/projects/let-be.svg',
    /* Escala optica: es mucho mas ancho que alto y a la misma altura que los
       demas pesa el doble en la fila. */
    logoScale: 0.78,
    name: 'Let Be',
    url: 'https://letbe.dev',
    domain: 'letbe.dev',
    role: {
      es: 'Desarrollo y consultoría de tecnología',
      en: 'Development and technology consulting',
      pt: 'Desenvolvimento e consultoria de tecnologia',
      fr: 'Développement et conseil en technologie',
      it: 'Sviluppo e consulenza tecnologica'
    },
    hint: {
      es: 'Construye lo que hace falta, y te dice cuándo no hace falta. Páginas, chatbots, automatizaciones e integraciones.',
      en: 'Builds what is needed, and tells you when it is not. Websites, chatbots, automations and integrations.',
      pt: 'Constrói o que faz falta, e diz-te quando não faz. Páginas, chatbots, automações e integrações.',
      fr: 'Construit ce qu’il faut, et vous dit quand il ne faut rien. Sites, chatbots, automatisations et intégrations.',
      it: 'Costruisce quello che serve, e ti dice quando non serve. Siti, chatbot, automazioni e integrazioni.'
    }
  },
  {
    id: 'recvid',
    grupo: 'exposicion',
    logo: '/assets/projects/recvid.svg',
    logoScale: 1,
    name: 'Recvid',
    url: 'https://recvid.studio',
    domain: 'recvid.studio',
    role: {
      es: 'Consultoría audiovisual y de marketing digital',
      en: 'Audiovisual and digital marketing consulting',
      pt: 'Consultoria audiovisual e de marketing digital',
      fr: 'Conseil audiovisuel et marketing digital',
      it: 'Consulenza audiovisiva e di marketing digitale'
    },
    hint: {
      es: 'Asesora en cámara, edición y marketing. Produce lo suyo —sketches y reels—; hacerlo por ti, solo si el proyecto lo merece.',
      en: 'Advises on camera, editing and marketing. Produces its own — sketches and reels; doing it for you, only if the project is worth it.',
      pt: 'Aconselha em câmara, edição e marketing. Produz o seu — sketches e reels; fazê-lo por ti, só se o projeto o merecer.',
      fr: 'Conseille sur la caméra, le montage et le marketing. Produit le sien — sketches et reels ; le faire pour vous, seulement si le projet le mérite.',
      it: 'Consiglia su ripresa, montaggio e marketing. Produce il proprio — sketch e reel; farlo per te, solo se il progetto lo merita.'
    }
  },
  {
    /* «FRATERNI!» y la U detras, del alto de sus letras: la misma firma que
       Academy y Business, con el simbolo al otro lado. La U cuelga su raya
       por debajo, como la «y» de Academy: el dibujo mide 307 de alto y la
       letra 262, de ahi el 1.17. */
    id: 'fraterniu',
    grupo: 'fraterni',
    wordmark: '/assets/projects/fraterni.png',
    wordmarkScale: 0.82,
    simboloDerecha: '/assets/projects/u.svg',
    simboloDerechaScale: 1.17,
    name: 'FraterniU',
    url: 'https://fraterniu.com',
    domain: 'fraterniu.com',
    role: {
      es: 'Formación para personas y equipos',
      en: 'Training for people and teams',
      pt: 'Formação para pessoas e equipas',
      fr: 'Formation pour personnes et équipes',
      it: 'Formazione per persone e squadre'
    },
    hint: {
      es: 'Primero el carácter: encima de él aguanta todo lo demás. Para ti, o para la gente que trabaja contigo.',
      en: 'Character first: everything else holds onto it. For you, or for the people who work with you.',
      pt: 'Primeiro o carácter: é em cima dele que o resto aguenta. Para ti, ou para quem trabalha contigo.',
      fr: 'Le caractère d’abord : c’est sur lui que tient le reste. Pour vous, ou pour ceux qui travaillent avec vous.',
      it: 'Prima il carattere: è su quello che regge tutto il resto. Per te, o per chi lavora con te.'
    }
  },
  {
    /* De FraterniU: es su escuela. Sin sitio todavia, asi que sin enlace y
       con el aviso: una ficha que lleva a una direccion que no existe es
       peor que una que dice que aun no abre. Cuando tenga direccion basta
       con poner aqui `url` y `domain`. */
    id: 'academy',
    grupo: 'fraterni',
    padre: 'fraterniu',
    corto: 'Academy',
    logo: '/assets/projects/fraterni-academy-icon.svg',
    wordmark: '/assets/projects/fraterni-academy.svg',
    name: 'Fraterni Academy',
    role: { es: 'La escuela de FraterniU' },
    hint: { es: 'Entrenamientos cortos para practicar en el día lo que se aprende.' }
  },
  {
    /* Fraterni Us: lo de FraterniU, pero para grupos. Sin sitio todavia, y
       sin logo propio: por ahora lleva el de Fraterni solo, sin segundo
       nombre (decision del fundador). Va sin simbolo delante porque no
       tiene. Sus letras llenan todo el dibujo, y las de Academy y Business
       solo el 82% (debajo va el hueco de la «y»): con `wordmarkScale` a
       0.82 las mayusculas de los tres miden lo mismo. */
    id: 'us',
    grupo: 'fraterni',
    wordmark: '/assets/projects/fraterni.png',
    wordmarkScale: 0.82,
    name: 'Fraterni Us',
    role: { es: 'Orden y crecimiento para grupos' },
    hint: { es: 'Lo mismo que FraterniU, pero para que un grupo avance junto.' }
  },
  {
    /* De Fraterni Us. Junta las otras tres piezas —la infraestructura de
       Let Be, el relato de Recvid y el metodo de Fraterni Us— para que una
       empresa funcione sin su dueño. Antes se llamaba Academy, cuando era la
       de las empresas; Academy paso a ser la escuela de FraterniU. */
    id: 'business',
    grupo: 'fraterni',
    padre: 'us',
    corto: 'Business',
    logo: '/assets/projects/fraterni-business-icon.svg',
    wordmark: '/assets/projects/fraterni-business.svg',
    name: 'Fraterni Business',
    role: { es: 'Que tu empresa funcione sin ti' },
    hint: { es: 'Junta la infraestructura de Let Be, el criterio de Recvid y el método de Fraterni Us.' }
  }
];

/* La matriz. Solo su logotipo, que encierra a la familia, y el enlace a su
   sitio. `w` y `h` son los del SVG: con ellos el navegador reserva el hueco
   antes de que llegue la imagen. */
export const HOLDING = {
  id: 'ventures',
  logo: '/assets/projects/fraterni-ventures.svg',
  w: 565,
  h: 219,
  name: 'Fraterni Ventures',
  /* Lo que dicen las seis marcas, dicho una vez (documento de copy). */
  lema: { es: 'No te damos más. Te damos el para qué.' },
  url: 'https://fraterniventures.com',
  domain: 'fraterniventures.com'
};
