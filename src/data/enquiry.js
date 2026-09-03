/* Las preguntas de la solicitud.

   Antes eran tres cajas de texto abiertas. Contestarlas bien costaba diez
   minutos, y quien llega a pedir un presupuesto no viene a escribir tres
   parrafos: se iba. Ahora casi todo se responde con un clic.

   Lo que se gana no es solo velocidad. Una respuesta cerrada se puede
   ORDENAR: se pueden mirar todas las solicitudes de Let Be con presupuesto
   alto, o todas las de sector publico. Tres parrafos de texto libre no se
   pueden mirar asi.

   LO QUE SE PIERDE, y hay que saberlo: matiz. Por eso queda una caja libre
   al final, corta y opcional — quien tenga algo que no cabe en las
   opciones, lo escribe ahi.

   `needs` cuelga de `line`: elegir Let Be enseña sus opciones y esconde las
   demas. Es lo que hace que el formulario no ensene veinte casillas de
   golpe cuando solo cuatro te sirven.

   Los ids en ingles y sin acentos a proposito: van tal cual a la base de
   datos, donde se van a filtrar y agrupar. Lo que se lee viene de `label`. */

/* La linea de trabajo. Cada una dice lo que hace, porque nadie tiene por
   que saberse de memoria que es Recvid antes de pedirle nada.

   TRES, Y SE PUEDEN MARCAR VARIAS. Habia una cuarta, «Otra cosa», y estaba
   mal puesta: la pregunta admite marcar varias, y «otra cosa» no se puede
   marcar CON Let Be — o es una de las tres o no lo es. Una opcion que
   contradice a las demas en una lista de casillas es un error de diseño, no
   una salida. Quien no encaje en ninguna tiene la caja libre del final.

   LAS TRES ASESORAN. No hay una casa que piense y dos que ejecuten: cada
   una decide y hace lo suyo. Por eso las tres frases estan cortadas igual
   —que decidir, y luego hacerlo— y lo que cambia es el terreno: lo que se
   construye, lo que se cuenta, y de que vive el negocio. */
export const LINES = [
  {
    id: 'let-be',
    logo: '/assets/projects/let-be.svg',
    /* Escala optica: el de Let Be es mucho mas ancho que alto y a la
       misma altura que los demas pesa el doble en la fila. */
    logoScale: 0.78,
    label: { es: 'Let Be', en: 'Let Be', pt: 'Let Be', fr: 'Let Be', it: 'Let Be' },
    hint: {
      es: 'Qué construir, y construirlo: páginas, chatbots y automatizaciones.',
      en: 'What to build, and building it: websites, chatbots and automations.',
      pt: 'O que construir, e construí-lo: páginas, chatbots e automações.',
      fr: 'Quoi construire, et le construire : sites, chatbots et automatisations.',
      it: 'Cosa costruire, e costruirlo: siti, chatbot e automazioni.'
    }
  },
  {
    id: 'recvid',
    logo: '/assets/projects/recvid.svg',
    logoScale: 1,
    label: { es: 'Recvid', en: 'Recvid', pt: 'Recvid', fr: 'Recvid', it: 'Recvid' },
    hint: {
      es: 'Qué contar, y rodarlo: video, contenido, campañas y pauta.',
      en: 'What to tell, and shooting it: video, content, campaigns and ads.',
      pt: 'O que contar, e filmá-lo: vídeo, conteúdo, campanhas e tráfego.',
      fr: 'Quoi raconter, et le tourner : vidéo, contenu, campagnes et publicité.',
      it: 'Cosa raccontare, e girarlo: video, contenuti, campagne e advertising.'
    }
  },
  {
    id: 'brand',
    mark: 'mark',
    /* LA CASA PROPIA. Lleva el ictus y no un logo porque aqui firma el.

       Se llamo un rato «Marca y crecimiento» para que se notara que hay
       negocio y no solo identidad, y el añadido sobraba: una etiqueta que
       necesita dos palabras para explicarse ya no es una etiqueta. Lo que
       tenia que decirlo era la frase de debajo, y ahora lo dice. */
    label: { es: 'Marca', en: 'Brand', pt: 'Marca', fr: 'Marque', it: 'Marchio' },
    hint: {
      es: 'Quién eres y de qué vives: identidad, clientes que vuelven y números.',
      en: 'Who you are and what you live on: identity, returning customers, numbers.',
      pt: 'Quem és e de que vives: identidade, clientes que voltam e números.',
      fr: 'Qui vous êtes et de quoi vous vivez : identité, clients fidèles, chiffres.',
      it: 'Chi sei e di cosa vivi: identità, clienti che tornano e numeri.'
    }
  }
];

/* Que necesita, por linea. Varias a la vez: casi nadie quiere una sola cosa.

   Salen de lo que dice cada casa de si misma en projects.js, no de una
   lista generica de servicios. Let Be se describe como «paginas, chatbots
   y automatizaciones a la medida», asi que eso es lo que se ofrece — mas
   las dos que siempre acaban pidiendose y no estaban: integrar con lo que
   ya usan, y el mantenimiento de despues.

   Siete en cada una. No es capricho: por debajo de cinco la lista se
   siente corta y obliga a marcar «otra cosa»; por encima de siete deja de
   leerse y se marca la primera que suene.

   LA TERCERA NO ES UNA LISTA DE ENTREGABLES como las otras dos. Las tres
   primeras son lo que se ve —marca personal, identidad, sitio— y las
   cuatro siguientes son lo que la hace rendir: quien repite, quien habla
   bien de ti, que dicen los numeros y quien te acompaña mientras decides.
   Esa segunda mitad es la que no existia y era justo el trabajo. */
export const NEEDS = {
  'let-be': [
    { id: 'techadvice', mark: 'compass', label: { es: 'Consultoría de tecnología', en: 'Technology consulting', pt: 'Consultoria de tecnologia', fr: 'Conseil en technologie', it: 'Consulenza tecnologica' } },
    { id: 'web', mark: 'monitor',         label: { es: 'Página web',        en: 'Website',          pt: 'Site',              fr: 'Site web',          it: 'Sito web' } },
    { id: 'shop', mark: 'cart',        label: { es: 'Tienda online',     en: 'Online shop',      pt: 'Loja online',       fr: 'Boutique en ligne', it: 'Negozio online' } },
    { id: 'chatbot', mark: 'chat',     label: { es: 'Chatbot',           en: 'Chatbot',          pt: 'Chatbot',           fr: 'Chatbot',           it: 'Chatbot' } },
    { id: 'automation', mark: 'bolt',  label: { es: 'Automatizar tareas', en: 'Automating tasks', pt: 'Automatizar tarefas', fr: 'Automatiser des tâches', it: 'Automatizzare compiti' } },
    { id: 'integration', mark: 'link', label: { es: 'Integraciones',     en: 'Integrations',     pt: 'Integrações',       fr: 'Intégrations',      it: 'Integrazioni' } },
    { id: 'upkeep', mark: 'wrench',      label: { es: 'Mantenimiento',     en: 'Maintenance',      pt: 'Manutenção',        fr: 'Maintenance',       it: 'Manutenzione' } }
  ],
  recvid: [
    { id: 'brandfilm', mark: 'play', label: { es: 'Video de marca',      en: 'Brand film',        pt: 'Vídeo de marca',      fr: 'Film de marque',    it: 'Video di marca' } },
    { id: 'social', mark: 'chat',    label: { es: 'Contenido para redes', en: 'Social content',   pt: 'Conteúdo para redes', fr: 'Contenu réseaux',   it: 'Contenuti social' } },
    { id: 'campaign', mark: 'megaphone',  label: { es: 'Campaña',             en: 'Campaign',          pt: 'Campanha',            fr: 'Campagne',          it: 'Campagna' } },
    { id: 'ads', mark: 'coin',       label: { es: 'Pauta y anuncios',    en: 'Paid ads',          pt: 'Tráfego pago',        fr: 'Publicité payante', it: 'Advertising a pagamento' } },
    { id: 'content', mark: 'file',   label: { es: 'Estrategia de contenido', en: 'Content strategy', pt: 'Estratégia de conteúdo', fr: 'Stratégie de contenu', it: 'Strategia di contenuti' } },
    { id: 'event', mark: 'calendar',     label: { es: 'Cubrir un evento',    en: 'Event coverage',    pt: 'Cobrir um evento',    fr: 'Couvrir un événement', it: 'Coprire un evento' } },
    { id: 'photo', mark: 'camera',     label: { es: 'Fotografía',          en: 'Photography',       pt: 'Fotografia',          fr: 'Photographie',      it: 'Fotografia' } }
  ],
  brand: [
    { id: 'personal', mark: 'mark',    label: { es: 'Marca personal',   en: 'Personal brand',  pt: 'Marca pessoal',     fr: 'Marque personnelle', it: 'Marca personale' } },
    { id: 'identity', mark: 'palette', label: { es: 'Identidad visual', en: 'Visual identity', pt: 'Identidade visual', fr: 'Identité visuelle',  it: 'Identità visiva' } },
    { id: 'positioning', mark: 'pin',  label: { es: 'Posicionamiento',  en: 'Positioning',     pt: 'Posicionamento',    fr: 'Positionnement',     it: 'Posizionamento' } },
    { id: 'loyalty', mark: 'ticket',   label: { es: 'Fidelización y programas VIP', en: 'Loyalty and VIP programmes', pt: 'Fidelização e programas VIP', fr: 'Fidélisation et programmes VIP', it: 'Fidelizzazione e programmi VIP' } },
    { id: 'reputation', mark: 'quote', label: { es: 'Reseñas y reputación', en: 'Reviews and reputation', pt: 'Avaliações e reputação', fr: 'Avis et réputation', it: 'Recensioni e reputazione' } },
    { id: 'data', mark: 'search',      label: { es: 'Datos y medición', en: 'Data and measurement', pt: 'Dados e medição', fr: 'Données et mesure', it: 'Dati e misurazione' } },
    { id: 'coaching', mark: 'route',   label: { es: 'Acompañamiento',   en: 'Coaching',        pt: 'Acompanhamento',    fr: 'Accompagnement',     it: 'Accompagnamento' } }
  ]
};

/* A quien le vende quien escribe. Cambia por completo el trabajo: no se
   hace igual una marca para consumidor final que una para una alcaldia. */
export const AUDIENCE = [
  { id: 'b2b',      label: { es: 'B2B · a empresas',     en: 'B2B · to businesses',   pt: 'B2B · a empresas',    fr: 'B2B · aux entreprises', it: 'B2B · alle imprese' } },
  { id: 'b2c',      label: { es: 'B2C · a personas',     en: 'B2C · to people',       pt: 'B2C · a pessoas',     fr: 'B2C · aux particuliers', it: 'B2C · alle persone' } },
  { id: 'b2g',      label: { es: 'B2G · a lo público',   en: 'B2G · to government',   pt: 'B2G · ao público',    fr: 'B2G · au public',       it: 'B2G · al pubblico' } },
  { id: 'nonprofit',label: { es: 'Sin ánimo de lucro',   en: 'Non-profit',            pt: 'Sem fins lucrativos', fr: 'À but non lucratif',    it: 'Senza scopo di lucro' } },
  { id: 'personal', label: { es: 'Proyecto personal',    en: 'Personal project',      pt: 'Projeto pessoal',     fr: 'Projet personnel',      it: 'Progetto personale' } }
];

/* Donde trabajamos. Cambia el precio y cambia la agenda, asi que se
   pregunta antes que el presupuesto y no despues. Si hay que desplazarse,
   el paso siguiente pide el sitio. */
export const MODE = [
  { id: 'remote', mark: 'globe', label: { es: 'Remoto',     en: 'Remote',  pt: 'Remoto',     fr: 'À distance', it: 'Da remoto' } },
  { id: 'onsite', mark: 'pin',   label: { es: 'Presencial', en: 'On site', pt: 'Presencial', fr: 'Sur place',  it: 'In presenza' } },
  { id: 'hybrid', mark: 'globe', label: { es: 'Mixto',      en: 'Hybrid',  pt: 'Misto',      fr: 'Mixte',      it: 'Misto' } }
];

/* Las dos que obligan a preguntar donde. */
export const MODE_TRAVELS = ['onsite', 'hybrid'];

/* Tres monedas, y elige quien escribe.

   Las cifras NO son una conversion: son bandas equivalentes redondeadas a
   numeros que se leen. La tasa se mueve cada semana y un tope que diga
   4.183.000 no ayuda a nadie a decidir. Si se va mucho, se retocan aqui. */
export const CURRENCIES = ['COP', 'USD', 'EUR'];

/* LAS PARADAS DEL DESLIZADOR.

   Eran cinco fichas cerradas y obligaban a elegir una banda entera: quien
   tenia ocho millones tenia que decir «4 a 20» y perder la mitad de la
   informacion. Con dos tiradores se dice un rango propio.

   Lo que se guarda son los INDICES, no las cifras. La parada 4 es el mismo
   escalon en las tres monedas, asi que dos solicitudes en monedas distintas
   se pueden comparar — que es justo lo que se pierde si se guarda el texto.
   La cifra en letra viaja aparte, para leerla sin hacer cuentas. */
export const BUDGET_STOPS = [
  { COP: '1 M',   USD: '250',     EUR: '230' },
  { COP: '2 M',   USD: '500',     EUR: '450' },
  { COP: '4 M',   USD: '1.000',   EUR: '900' },
  { COP: '10 M',  USD: '2.500',   EUR: '2.300' },
  { COP: '20 M',  USD: '5.000',   EUR: '4.500' },
  { COP: '40 M',  USD: '10.000',  EUR: '9.000' },
  { COP: '60 M',  USD: '15.000',  EUR: '14.000' },
  { COP: '+60 M', USD: '+15.000', EUR: '+14.000' }
];

/* El suelo es un millon de pesos, no cero: por debajo de eso no hay
   encargo que se pueda hacer bien, y ofrecerlo seria hacer perder el
   tiempo a los dos. La primera parada YA es el minimo. */
/* De donde arranca el rango: ni pegado al suelo ni en el techo. */
export const BUDGET_FROM = 2;
export const BUDGET_TO = 4;

export const TIMING = [
  { id: 'now',      label: { es: 'Ya',            en: 'Right away',   pt: 'Já',              fr: 'Tout de suite', it: 'Subito' } },
  { id: '1-3m',     label: { es: 'En 1–3 meses',  en: 'In 1–3 months', pt: 'Em 1–3 meses',   fr: 'Dans 1–3 mois', it: 'Tra 1–3 mesi' } },
  { id: 'thisyear', label: { es: 'Este año',      en: 'This year',    pt: 'Este ano',        fr: 'Cette année',   it: 'Quest’anno' } },
  { id: 'exploring',label: { es: 'Solo explorando', en: 'Just exploring', pt: 'Só a explorar', fr: 'Je me renseigne', it: 'Sto solo esplorando' } }
];

/* La unica pregunta que no sirve para cotizar.
   Es la diagnostica 4 del marco —«¿hay alguien mas alla del autor que se
   beneficie concretamente?»— convertida en un clic. Cerrada dice mas que
   abierta: nadie escribe «solo a mi» en una caja de texto, pero si lo
   marca cuando es una opcion entre cinco. */
export const IMPACT = [
  { id: 'company',   label: { es: 'A la empresa',      en: 'The company',       pt: 'À empresa',        fr: 'À l’entreprise',   it: 'All’azienda' } },
  { id: 'customers', label: { es: 'A sus clientes',    en: 'Its customers',     pt: 'Aos seus clientes', fr: 'À ses clients',   it: 'Ai suoi clienti' } },
  { id: 'community', label: { es: 'A una comunidad',   en: 'A community',       pt: 'A uma comunidade', fr: 'À une communauté', it: 'A una comunità' } },
  { id: 'sector',    label: { es: 'A todo un sector',  en: 'A whole sector',    pt: 'A todo um setor',  fr: 'À tout un secteur', it: 'A un intero settore' } },
  { id: 'unsure',    label: { es: 'No lo he pensado',  en: 'Haven’t thought about it', pt: 'Não pensei nisso', fr: 'Je n’y ai pas pensé', it: 'Non ci ho pensato' } }
];

export const CHANNELS = [
  { id: 'whatsapp', mark: 'whatsapp', label: { es: 'WhatsApp', en: 'WhatsApp', pt: 'WhatsApp', fr: 'WhatsApp', it: 'WhatsApp' } },
  { id: 'mail',     mark: 'mail',     label: { es: 'Correo',   en: 'Email',    pt: 'Correio',  fr: 'Courriel', it: 'Email' } },
  { id: 'call',     mark: 'phone',    label: { es: 'Llamada',  en: 'A call',   pt: 'Chamada',  fr: 'Un appel', it: 'Chiamata' } }
];
