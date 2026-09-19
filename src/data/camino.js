/* ¿Por donde he caminado? — las etapas de la linea de tiempo (Camino.astro).

   DE DONDE SALE. De tres sitios, y de ninguno mas:
   - la seccion «Memoir» de la primera version de esta pagina (2024): las
     seis etapas que el fundador escribio sobre su origen, su alef;
   - su perfil de LinkedIn (septiembre de 2026): el colegio y la carrera,
     su trabajo en IntouchCX y su trabajo por cuenta propia;
   - lo que el mismo dijo despues: los años, su paso a la fe y lo que esta
     haciendo hoy.
   El origen de Fraterni es el de manifesto.js. No se inventa nada: un
   origen inventado es Met.

   LO QUE CAMBIO al pasarlo a la voz de la casa:
   - una o dos frases por etapa, para un niño que acaba de aprender a leer;
   - sin superlativos ni el tono de LinkedIn: «hand-selected», «high-stakes»,
     «top-tier», «rigorous» se quedaron fuera. Se dice que paso, no lo
     importante que fue: «me eligieron», no «seleccionado a mano»;
   - sin VUCA ni «El dilema de las redes sociales»: piden saber que son;
   - los tres puestos de IntouchCX van en una sola etapa: cuentan un mismo
     camino —atender, cuidar, enseñar— y en tres parecian un curriculum;
   - la ultima etapa de la «Memoir» era «"Este es el camino" — ?», una
     pregunta abierta. Ahora contesta con lo que dice el resto del sitio.

   LOS NOMBRES. IntouchCX, Booking.com y DeVry van con su nombre porque asi
   estan en su perfil publico, y el fundador lo confirmo. La Universidad de
   La Sabana (dos semestres, 2022) la pidio nombrar el. Va con su nombre
   entero, no «La Sabana» a secas: fuera de Colombia no se entenderia.

   CUANDO. Los años los dio el fundador o salen de LinkedIn (el colegio
   termino en junio de 2021). La pandemia, en sus palabras: la cuarentena
   empezo en marzo de 2020, duro hasta septiembre u octubre, y despues
   siguieron controles muy estrictos; eso es lo que se llevo el final del
   colegio, y por eso la etapa lo nombra aunque su año sea el del grado.

   Los años van escondidos en la niebla y se aclaran al tocar el punto o el
   año (initCamino): el camino se lee primero por lo que paso, y la fecha es
   para quien la busca. «Hoy» no se esconde: no es una fecha, es a donde
   llega el camino. Dentro de un mismo año van en el orden en que pasaron.

   HOY SE DICE EN GERUNDIO. Let Be, Recvid y la familia Fraterni todavia se
   estan sacando: «estoy construyendo», no «soy fundador de». Lo que aun no
   existe no se cuenta como hecho (capitulo 9 del marco).

   LA FE. Se crio catolico y a principios de 2024 paso a ser cristiano: son
   sus palabras, y la etapa no dice mas que eso. Lo que ese paso significa
   lo dice la ultima etapa, con lo que ya dice el resto del sitio.

   IDIOMAS. El español es el original y manda; los otros cuatro se tradujeron
   cuando el fundador aprobo el texto. Si cambia una etapa, se cambian las
   cinco. Como en el resto del sitio: el portugues es el de Portugal, y las
   palabras de la cita —ligero, un solo camino, ahavá— son las que ya usa
   cada idioma en ella (ui.js).

   LOS TITULOS siguen el camino, de etapa en etapa, y dicen que paso, no
   donde: «Un final sin despedida» y no «La pandemia». Van en la letra de
   los titulos, sin nada a mano: el fundador los prefiere asi.

   `hoy: true` es la etapa donde termina la linea. */
export const ETAPAS = [
  {
    id: 'bogota',
    cuando: '2002',
    titulo: {
      es: 'El primer paso',
      en: 'The first step',
      pt: 'O primeiro passo',
      fr: 'Le premier pas',
      it: 'Il primo passo'
    },
    texto: {
      es: 'Nací en Bogotá. Crecí mirando cómo la tecnología y las redes cambiaban el mundo, y quise ser parte de eso.',
      en: 'I was born in Bogotá. I grew up watching technology and social media change the world, and I wanted to be part of it.',
      pt: 'Nasci em Bogotá. Cresci a ver a tecnologia e as redes sociais mudarem o mundo, e quis fazer parte disso.',
      fr: 'Je suis né à Bogotá. J’ai grandi en voyant la technologie et les réseaux sociaux changer le monde, et j’ai voulu en faire partie.',
      it: 'Sono nato a Bogotá. Sono cresciuto guardando la tecnologia e i social cambiare il mondo, e ho voluto farne parte.'
    }
  },
  {
    id: 'colegio',
    cuando: '2013',
    titulo: {
      es: 'El mundo se hizo grande',
      en: 'The world got bigger',
      pt: 'O mundo ficou maior',
      fr: 'Le monde s’est agrandi',
      it: 'Il mondo si è fatto grande'
    },
    texto: {
      es: 'En el Gimnasio del Norte, el Bachillerato Internacional me abrió la mirada. En un campamento de verano en Stanford, la tecnología empezó a ser lo mío.',
      en: 'At Gimnasio del Norte, the International Baccalaureate opened my eyes. At a summer camp at Stanford, I found that technology was for me.',
      pt: 'No Gimnasio del Norte, o Bacharelato Internacional abriu-me os olhos. Num campo de férias em Stanford, percebi que a tecnologia era para mim.',
      fr: 'Au Gimnasio del Norte, le Baccalauréat International m’a ouvert les yeux. Dans un camp d’été à Stanford, j’ai compris que la technologie était faite pour moi.',
      it: 'Al Gimnasio del Norte, il Baccalaureato Internazionale mi ha aperto gli occhi. In un campo estivo a Stanford, ho capito che la tecnologia faceva per me.'
    }
  },
  {
    id: 'pandemia',
    cuando: '2021',
    titulo: {
      es: 'Un final sin despedida',
      en: 'An ending without a goodbye',
      pt: 'Um fim sem despedida',
      fr: 'Une fin sans adieux',
      it: 'Una fine senza addio'
    },
    texto: {
      es: 'Estudié negocios y cine, y ya hacía contenido: un podcast de deportes y video con drones. La cuarentena de 2020 y los controles que siguieron se llevaron el final del colegio.',
      en: 'I studied business and film, and I was already making content: a sports podcast and drone video. The 2020 lockdown and the restrictions that followed took away the end of school.',
      pt: 'Estudei gestão e cinema, e já fazia conteúdo: um podcast de desporto e vídeo com drones. A quarentena de 2020 e as restrições que se seguiram levaram o fim da escola.',
      fr: 'J’ai étudié la gestion et le cinéma, et je faisais déjà du contenu : un podcast de sport et de la vidéo par drone. Le confinement de 2020 et les restrictions qui ont suivi m’ont pris la fin du lycée.',
      it: 'Ho studiato economia e cinema, e facevo già contenuti: un podcast sportivo e video con i droni. Il lockdown del 2020 e le restrizioni che sono seguite si sono portati via la fine della scuola.'
    }
  },
  {
    id: 'universidad',
    cuando: '2022',
    titulo: {
      es: 'Fuera del camino marcado',
      en: 'Off the marked path',
      pt: 'Fora do caminho marcado',
      fr: 'Hors du chemin tracé',
      it: 'Fuori dal sentiero segnato'
    },
    texto: {
      es: 'Entré a la Universidad de La Sabana y salí después de dos semestres. Aprendí a seguir mi camino, aunque no todos lo entendieran.',
      en: 'I started at the Universidad de La Sabana and left after two semesters. I learned to follow my own path, even when not everyone understood it.',
      pt: 'Entrei na Universidad de La Sabana e saí ao fim de dois semestres. Aprendi a seguir o meu caminho, mesmo que nem todos o entendessem.',
      fr: 'Je suis entré à l’Universidad de La Sabana et je l’ai quittée après deux semestres. J’ai appris à suivre mon chemin, même si tout le monde ne le comprenait pas.',
      it: 'Sono entrato all’Universidad de La Sabana e l’ho lasciata dopo due semestri. Ho imparato a seguire la mia strada, anche se non tutti la capivano.'
    }
  },
  {
    id: 'intouchcx',
    cuando: '2022',
    titulo: {
      es: 'Aprender a servir',
      en: 'Learning to serve',
      pt: 'Aprender a servir',
      fr: 'Apprendre à servir',
      it: 'Imparare a servire'
    },
    texto: {
      es: 'Casi tres años en IntouchCX, atendiendo clientes de Booking.com en inglés y en español. Me eligieron para cuidar cuentas VIP de Estados Unidos, y después para formar a los que llegaban.',
      en: 'Almost three years at IntouchCX, helping Booking.com customers in English and Spanish. I was chosen to look after VIP accounts in the United States, and later to train the people who joined.',
      pt: 'Quase três anos na IntouchCX, a atender clientes da Booking.com em inglês e em espanhol. Escolheram-me para cuidar de contas VIP dos Estados Unidos e, depois, para formar quem chegava.',
      fr: 'Presque trois ans chez IntouchCX, au service des clients de Booking.com en anglais et en espagnol. On m’a choisi pour m’occuper de comptes VIP aux États-Unis, puis pour former les nouveaux arrivants.',
      it: 'Quasi tre anni in IntouchCX, ad assistere i clienti di Booking.com in inglese e in spagnolo. Mi hanno scelto per seguire account VIP degli Stati Uniti e poi per formare chi arrivava.'
    }
  },
  {
    id: 'fraterni',
    cuando: '2023',
    titulo: {
      es: 'Caminar con hermanos',
      en: 'Walking with brothers',
      pt: 'Caminhar com irmãos',
      fr: 'Marcher avec des frères',
      it: 'Camminare con fratelli'
    },
    texto: {
      es: 'De todo lo vivido nació Fraterni, que viene de hermanos: para que ningún proyecto tenga que empezar solo.',
      en: 'From everything I had lived, Fraterni was born. It comes from brothers: so that no project has to start alone.',
      pt: 'De tudo o que vivi nasceu a Fraterni, que vem de irmãos: para que nenhum projeto tenha de começar sozinho.',
      fr: 'De tout ce que j’avais vécu est né Fraterni, qui vient de frères : pour qu’aucun projet n’ait à commencer seul.',
      it: 'Da tutto ciò che avevo vissuto è nato Fraterni, che viene da fratelli: perché nessun progetto debba iniziare da solo.'
    }
  },
  {
    id: 'fe',
    cuando: '2024',
    titulo: {
      es: 'Un paso de fe',
      en: 'A step of faith',
      pt: 'Um passo de fé',
      fr: 'Un pas de foi',
      it: 'Un passo di fede'
    },
    texto: {
      es: 'Me crié siendo católico, y a principios de ese año pasé a ser cristiano.',
      en: 'I was raised Catholic, and early that year I became a Christian.',
      pt: 'Fui criado católico e, no início desse ano, passei a ser cristão.',
      fr: 'J’ai grandi catholique, et au début de cette année-là, je suis devenu chrétien.',
      it: 'Sono cresciuto cattolico e, all’inizio di quell’anno, sono diventato cristiano.'
    }
  },
  {
    id: 'devry',
    cuando: '2025',
    titulo: {
      es: 'Volver a estudiar',
      en: 'Back to studying',
      pt: 'Voltar a estudar',
      fr: 'Reprendre les études',
      it: 'Tornare a studiare'
    },
    texto: {
      es: 'Empecé Desarrollo de Software y Sistemas de Datos en DeVry, una universidad de Estados Unidos, con una beca por mérito.',
      en: 'I started Software Development and Data Systems at DeVry, a university in the United States, on a merit scholarship.',
      pt: 'Comecei Desenvolvimento de Software e Sistemas de Dados na DeVry, uma universidade dos Estados Unidos, com uma bolsa de mérito.',
      fr: 'J’ai commencé Développement logiciel et systèmes de données à DeVry, une université des États-Unis, avec une bourse au mérite.',
      it: 'Ho iniziato Sviluppo Software e Sistemi di Dati alla DeVry, un’università degli Stati Uniti, con una borsa di merito.'
    }
  },
  {
    id: 'marcas',
    cuando: '2025',
    titulo: {
      es: 'Marcas desde su origen',
      en: 'Brands from their origin',
      pt: 'Marcas a partir da origem',
      fr: 'Des marques depuis leur origine',
      it: 'Marchi dalla loro origine'
    },
    texto: {
      es: 'Por mi cuenta, como estratega y director creativo: ayudé a inmobiliarias, restaurantes, plataformas de educación y marcas personales a mostrarse como son.',
      en: 'On my own, as a strategist and creative director: I helped real estate firms, restaurants, education platforms and personal brands show themselves as they are.',
      pt: 'Por conta própria, como estratega e diretor criativo: ajudei imobiliárias, restaurantes, plataformas de educação e marcas pessoais a mostrarem-se como são.',
      fr: 'À mon compte, comme stratège et directeur de création : j’ai aidé des agences immobilières, des restaurants, des plateformes d’éducation et des marques personnelles à se montrer telles qu’elles sont.',
      it: 'In proprio, come stratega e direttore creativo: ho aiutato agenzie immobiliari, ristoranti, piattaforme di formazione e brand personali a mostrarsi come sono.'
    }
  },
  {
    id: 'hoy',
    cuando: { es: 'Hoy', en: 'Today', pt: 'Hoje', fr: 'Aujourd’hui', it: 'Oggi' },
    titulo: {
      es: 'Un solo camino',
      en: 'Just one path',
      pt: 'Um só caminho',
      fr: 'Un seul chemin',
      it: 'Un solo cammino'
    },
    hoy: true,
    texto: {
      es: 'Estoy construyendo Let Be, Recvid y la familia Fraterni. Sigo aprendiendo a caminar ligero, y el camino es uno: el amor (ahavá).',
      en: 'I’m building Let Be, Recvid and the Fraterni family. I’m still learning to walk lightly, and there is one path: love (ahavah).',
      pt: 'Estou a construir a Let Be, a Recvid e a família Fraterni. Continuo a aprender a caminhar leve, e o caminho é um só: o amor (ahavá).',
      fr: 'Je construis Let Be, Recvid et la famille Fraterni. J’apprends encore à marcher léger, et il n’y a qu’un chemin : l’amour (ahava).',
      it: 'Sto costruendo Let Be, Recvid e la famiglia Fraterni. Continuo a imparare a camminare leggero, e il cammino è uno solo: l’amore (ahavà).'
    }
  }
];
