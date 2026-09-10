/* Las casas, y a cual va cada quien.

   ESTA PAGINA YA NO RECOGE NADA. Antes habia un asistente de diez pasos que
   guardaba la solicitud en una base de datos; ahora la solicitud se hace en
   la casa que la va a atender, que es donde esta el equipo y donde estan las
   respuestas. Aqui solo se decide por cual puerta.

   Y esa decision es TODO el trabajo de esta pagina. Un directorio que solo
   pone cuatro nombres obliga al visitante a adivinar; si adivina mal escribe
   al sitio equivocado y la peticion muere ahi. Por eso cada casa dice dos
   cosas y en este orden:

     role   el oficio, en tres palabras. Es lo que se lee primero.
     hint   el criterio. Una frase que dice a que se viene y otra que dice
            con que se sale. Sin la primera, las tres suenan igual.

   LAS TRES DE ARRIBA NO SON UNA LISTA: que se construye, que se graba y
   quien lo sostiene. Cada visitante llega con una de esas tres preguntas.

   Y DOS DE ELLAS ENSEÑAN, que es donde alguien puede dudar. La linea que
   las separa tiene que estar en el texto o no esta en ninguna parte:
   Recvid asesora en un OFICIO —camara, edicion, marketing— y FraterniU
   forma a la PERSONA que lo va a ejercer. No compiten: una va antes.

   RECVID ADEMAS DICE LO QUE YA NO VENDE. Dejo de ejecutar por encargo, y
   no solo el rodaje: tambien el marketing. Lo que ofrece es el consejo
   para que lo hagas tu; hacerlo en tu lugar es la excepcion, no el
   catalogo. Callarlo seria dejar que alguien pida un video de marca o una
   campaña, se vaya a otra pagina y descubra alli que no era el sitio: la
   peticion se pierde y la culpa parece suya.

   FRATERNI VENTURES VA APARTE, y no por jerarquia: es la matriz de las tres.
   Ponerla como cuarta ficha igual haria elegir entre una empresa y su dueña,
   que no es una eleccion. Abajo, en otro registro, y para otra conversacion
   —sociedad, inversion, prensa—.

   El enlace sale del sitio, asi que se enseña el dominio: quien pulsa tiene
   derecho a saber a donde va antes de pulsar. */

export const HOUSES = [
  {
    id: 'let-be',
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
    id: 'fraterniu',
    logo: '/assets/projects/u.svg',
    logoScale: 1.3,
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
  }
];

/* La matriz. Mismo molde, otro sitio y otra conversacion. */
export const HOLDING = {
  id: 'ventures',
  logo: '/assets/projects/fraterni.png',
  webp: '/assets/projects/fraterni.webp',
  logoScale: 0.73,
  name: 'Fraterni Ventures',
  url: 'https://fraterniventures.com',
  domain: 'fraterniventures.com',
  role: {
    es: 'La matriz de las tres',
    en: 'The parent company of the three',
    pt: 'A matriz das três',
    fr: 'La maison mère des trois',
    it: 'La capogruppo delle tre'
  },
  hint: {
    es: 'Aquí se habla de sociedad, inversión y prensa. Los encargos van por las casas de arriba.',
    en: 'This is where partnership, investment and press are discussed. Commissions go through the houses above.',
    pt: 'Aqui fala-se de sociedade, investimento e imprensa. Os pedidos vão pelas casas acima.',
    fr: 'Ici on parle d’association, d’investissement et de presse. Les commandes passent par les maisons ci-dessus.',
    it: 'Qui si parla di società, investimento e stampa. Gli incarichi passano dalle case qui sopra.'
  }
};
