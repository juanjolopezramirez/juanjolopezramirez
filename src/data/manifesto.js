/* Lo que es cada casa, dicho para que lo entienda cualquiera.

   El texto sale del documento de copy del fundador
   (`copy-web-fraterni-letbe-recvid.md`), adaptado a esta pagina: el
   «remate» de ese documento es aqui el subtitulo del «¿Por qué?», no una
   linea mas en la cara de la pregunta.

   LAS PIEZAS, en el orden en que se leen, con su largo maximo:

     pregunta  una sola: el gancho. 13 palabras.
     tacha     lo que te venden para resolverlo, no lo que culpas: «otro
               software mas» si, «suerte» o «tiempo» no. Si es una lista,
               van pasando en bucle, siempre tachadas. LA PRIMERA ESTA
               ELEGIDA A PROPOSITO y no se mueve: es la que se lee primero y
               la que se queda quieta sin guion o con el movimiento reducido.
               5 palabras cada una.
     pone      la respuesta, escrita a mano al lado. Siempre a la vista.
               7 palabras.
     remate    la linea que le da la vuelta a la pregunta. Encabeza el
               «¿Por qué?»: primero la vuelta, despues la razon. 12 palabras.
     porque    la razon, detras del boton «¿Por qué?». 65 palabras.
     que       la sublinea: lo que es la casa. 18 palabras.
     origen    por que existe, en primera persona.
     mision    un infinitivo y un objeto grande.
     vision    un estado del mundo. Nunca «Que + subjuntivo».
               Las tres, una linea cada una detras del icono de informacion.
               `larga` las explica en la pagina de la casa, si la casa
               tiene pagina; si no, no hace falta.
     como      con que piensa llegar. Solo en la pagina de la casa.

   EL PAR ES DE LA MISMA CATEGORIA. La tachada y la respuesta van en la misma
   linea, una al lado de la otra, y el ojo espera un reemplazo: si no son de
   la misma categoria gramatical, la sustitucion no suena. Let Be, FraterniU,
   Fraterni Us y Business, en sustantivos; Recvid y Academy, en infinitivos.
   Una tachada nueva tiene que ser de la categoria de su lista.

   TERRITORIOS. Let Be es infraestructura: que te encuentren. Recvid es
   relato: que te recuerden. Business es sistema: que funcione sin ti.
   Ninguna usa el vocabulario de la otra, y ninguna sublinea se apoya en otra
   marca sin explicarse sola —quien no conozca FraterniU tiene que entender
   Academy igual—. La excepcion es Business, que es justo la que junta a las
   otras tres y por eso las nombra.

   NINGUNA VENDE DEPENDENCIA; TODAS VENDEN CAPACIDAD. Solo lo que te sirve;
   te enseña a mostrarlo; un camino propio; saber para que lo aprendes; un
   camino compartido; un sistema que no te necesite. Es lo que dice, en una
   linea, el lema de Fraterni Ventures sobre el marco de la familia.

   EL CRITERIO ES EL DEL CODIGO ALEF: el vault `suEssencia` (emet-y-met,
   prueba-forense-del-fruto, najash, bitul, sindrome-de-lamec). Emet, verdad,
   se escribe con Alef, Mem y Tav: origen, proceso y conclusion. Sin el Alef
   queda Met: funciona en apariencia y no vive. Por eso:

   1. TRES PATAS. Origen, mision y vision: sin el origen, la ficha dice que
      hace la casa y a donde va, pero no por que existe.
   2. LA RESPUESTA A MANO APUNTA AL PARA QUE y no promete un resultado. Asi
      no reclama la ultima palabra (el filtro de la fe).
   3. LO TACHADO NO ES UN ERROR: es lo que se ofrece sin para que, el
      najash. Tachar para exhibir que uno sabe mas es el sindrome de Lamec.
   4. QUE NOS PUEDAN DEJAR. El filtro del amor mide si el autor se vuelve
      prescindible: un sistema que no te necesite, un camino que puedas
      seguir sin que nadie te empuje.
   5. LA PRESENCIA SALE DEL ORIGEN, NO DEL EJEMPLO.

   LOS ORIGENES TIENEN QUE SER CIERTOS. Un origen inventado es la forma mas
   pura de Met. Los de FraterniU, Academy y Fraterni Us son borradores del
   documento de copy, pendientes de confirmar: van marcados.

   CAMBIOS SOBRE EL DOCUMENTO, y por que:
   - Recvid mantiene la vision «Marcas que no necesitan a nadie para sonar a
     ellas mismas»: la de «no con presupuesto» ya se habia descartado.
   - Su «¿Por qué?» dice «todas las marcas» y no «las otras veinte»: una
     cifra que no dice de donde sale no va. Y sin «no se contrata, se
     aprende», que tambien se habia quitado.
   - El «¿Por qué?» de Let Be ya no abre con «La pregunta no es...»: ahora el
     remate va justo encima y lo diria dos veces.

   ESCRITO PARA UN NIÑO QUE ACABA DE APRENDER A LEER, sin superlativos y sin
   prometer como hecho lo que es un plan (capitulo 9 del marco).

   LA AUTORIDAD NO ES DE UNO. Es de Dios, que es amor, y se ve en hacer las
   cosas por el bien del otro sin buscarle daño. No se reclama: se nota.

   LA FAMILIA. Let Be y Recvid son la exposicion. Los productos Fraterni van
   por ramas: FraterniU es la persona y Fraterni Academy su escuela; Fraterni
   Us es el grupo y Fraterni Business, que cuelga de Us, junta a Let Be,
   Recvid y Fraterni Us para que una empresa funcione sin su dueño.
   Fraterni Ventures es la matriz: su logotipo y su lema encierran a la
   familia. El mapa entero esta en `ecosistema-fraterni.md`.

   EN LOS CINCO IDIOMAS. El español es el original y manda: si cambia, se
   cambian los otros cuatro con el. Las traducciones no son literales —se
   traduce lo que la frase hace, no palabra por palabra— pero guardan las
   mismas reglas: el par tachada/respuesta sigue siendo de la misma categoria
   (en ingles los infinitivos de Recvid y Academy van en gerundio, que es
   como se nombra una accion en una lista), y el portugues es el de Portugal,
   el frances trata de usted y el italiano tutea, como el resto del sitio.
   Si a una pieza le faltara un idioma, `say()` cae al español. */

export const PROPOSITO = {
  'let-be': {
    pregunta: {
      es: '¿Qué le falta a tu negocio para destacar en internet?',
      en: 'What is your business missing to stand out online?',
      pt: 'O que falta ao teu negócio para se destacar na internet?',
      fr: 'Que manque-t-il à votre entreprise pour se démarquer en ligne ?',
      it: 'Cosa manca alla tua attività per distinguersi online?'
    },
    /* Sustantivos. La pagina web va primera a proposito: es lo primero que
       casi todos piden. */
    tacha: {
      es: ['Una página web', 'Un chatbot', 'Una app propia', 'Otro software más', 'El primer lugar en Google', 'Un community manager', 'Más pauta'],
      en: ['A website', 'A chatbot', 'Your own app', 'Another software tool', 'First place on Google', 'A community manager', 'More ad spend'],
      pt: ['Uma página web', 'Um chatbot', 'Uma app própria', 'Mais um software', 'O primeiro lugar no Google', 'Um community manager', 'Mais anúncios'],
      fr: ['Un site web', 'Un chatbot', 'Une appli à vous', 'Encore un logiciel', 'La première place sur Google', 'Un community manager', 'Plus de pub'],
      it: ['Un sito web', 'Un chatbot', 'Un’app tutta tua', 'Un altro software', 'Il primo posto su Google', 'Un community manager', 'Più pubblicità']
    },
    pone: {
      es: 'Solo lo que tenga un para qué.',
      en: 'Only what has a purpose.',
      pt: 'Só o que tiver um para quê.',
      fr: 'Seulement ce qui a une raison d’être.',
      it: 'Solo ciò che ha uno scopo.'
    },
    remate: {
      es: 'La pregunta no es qué te falta. Es para qué.',
      en: 'The question isn’t what you’re missing. It’s what for.',
      pt: 'A pergunta não é o que te falta. É para quê.',
      fr: 'La question n’est pas ce qui vous manque. C’est pour quoi faire.',
      it: 'La domanda non è cosa ti manca. È a cosa serve.'
    },
    porque: {
      es: 'Hoy se puede construir casi todo. Un chatbot sin una pregunta que responda es un gasto con interfaz bonita; una automatización sin un proceso que sobre es trabajo nuevo disfrazado de ahorro. Por eso lo primero que hacemos no es cotizar: es entender para qué, y decirte con franqueza si la respuesta es «para nada».',
      en: 'Today almost anything can be built. A chatbot with no question to answer is an expense with a pretty interface; an automation that replaces no process is new work dressed up as savings. That’s why the first thing we do isn’t a quote: it’s understanding what for, and telling you frankly if the answer is “for nothing”.',
      pt: 'Hoje quase tudo se pode construir. Um chatbot sem uma pergunta a que responder é um gasto com uma interface bonita; uma automação sem um processo que sobre é trabalho novo disfarçado de poupança. Por isso, a primeira coisa que fazemos não é orçamentar: é perceber para quê, e dizer-te com franqueza se a resposta é «para nada».',
      fr: 'Aujourd’hui, on peut presque tout construire. Un chatbot sans question à laquelle répondre, c’est une dépense avec une jolie interface ; une automatisation qui ne remplace aucun processus, c’est du travail en plus déguisé en économie. C’est pourquoi la première chose que nous faisons n’est pas un devis : c’est comprendre pour quoi faire, et vous dire franchement si la réponse est « pour rien ».',
      it: 'Oggi si può costruire quasi tutto. Un chatbot senza una domanda a cui rispondere è una spesa con un’interfaccia carina; un’automazione che non toglie nessun processo è lavoro nuovo travestito da risparmio. Per questo la prima cosa che facciamo non è un preventivo: è capire a cosa serve, e dirti con franchezza se la risposta è «a niente».'
    },
    que: {
      es: 'Let Be construye lo digital de tu negocio. Solo lo que te sirve.',
      en: 'Let Be builds the digital side of your business. Only what serves you.',
      pt: 'A Let Be constrói o digital do teu negócio. Só o que te serve.',
      fr: 'Let Be construit le numérique de votre entreprise. Seulement ce qui vous sert.',
      it: 'Let Be costruisce il digitale della tua attività. Solo ciò che ti serve.'
    },
    origen: {
      /* Cuenta algo que paso: lo confirma el fundador. */
      corta: {
        es: 'Existimos porque vimos demasiados negocios buenos pagando por tecnología que nunca llegaron a usar.',
        en: 'We exist because we saw too many good businesses paying for technology they never ended up using.',
        pt: 'Existimos porque vimos demasiados bons negócios a pagar por tecnologia que nunca chegaram a usar.',
        fr: 'Nous existons parce que nous avons vu trop de bonnes entreprises payer pour une technologie qu’elles n’ont jamais utilisée.',
        it: 'Esistiamo perché abbiamo visto troppe buone attività pagare per una tecnologia che non hanno mai usato.'
      },
      larga: {
        es: 'No fallaba la tecnología: faltaba preguntar para qué antes de construir.',
        en: 'The technology wasn’t failing: what was missing was asking what for before building.',
        pt: 'Não era a tecnologia que falhava: faltava perguntar para quê antes de construir.',
        fr: 'Ce n’était pas la technologie qui échouait : il manquait la question « pour quoi faire ? » avant de construire.',
        it: 'Non era la tecnologia a fallire: mancava chiedersi a cosa serve prima di costruire.'
      }
    },
    mision: {
      corta: {
        es: 'Construir solo la tecnología que un negocio va a usar.',
        en: 'To build only the technology a business will actually use.',
        pt: 'Construir só a tecnologia que um negócio vai usar.',
        fr: 'Construire seulement la technologie qu’une entreprise va utiliser.',
        it: 'Costruire solo la tecnologia che un’attività userà davvero.'
      },
      larga: {
        es: 'Páginas, aplicaciones, chatbots y automatizaciones, con números que te dicen si están sirviendo. Antes de construir preguntamos para qué, y si la respuesta es «para nada», te lo decimos.',
        en: 'Websites, apps, chatbots and automations, with numbers that tell you whether they’re working. Before building we ask what for, and if the answer is “for nothing”, we tell you.',
        pt: 'Páginas, aplicações, chatbots e automações, com números que te dizem se estão a servir. Antes de construir perguntamos para quê, e se a resposta for «para nada», dizemos-te.',
        fr: 'Sites, applications, chatbots et automatisations, avec des chiffres qui vous disent s’ils servent. Avant de construire, nous demandons pour quoi faire, et si la réponse est « pour rien », nous vous le disons.',
        it: 'Siti, app, chatbot e automazioni, con numeri che ti dicono se stanno servendo. Prima di costruire chiediamo a cosa serve, e se la risposta è «a niente», te lo diciamo.'
      }
    },
    vision: {
      corta: {
        es: 'Un mercado donde ninguna empresa paga por tecnología que no usa.',
        en: 'A market where no company pays for technology it doesn’t use.',
        pt: 'Um mercado onde nenhuma empresa paga por tecnologia que não usa.',
        fr: 'Un marché où aucune entreprise ne paie pour une technologie qu’elle n’utilise pas.',
        it: 'Un mercato dove nessuna azienda paga per una tecnologia che non usa.'
      },
      larga: {
        es: 'Muchos negocios buenos no han dado bien el salto a lo digital. Queremos que lo den con lo que de verdad necesitan, hecho a su medida.',
        en: 'Many good businesses haven’t made the jump to digital well. We want them to make it with what they truly need, made to measure.',
        pt: 'Muitos bons negócios não deram bem o salto para o digital. Queremos que o deem com o que realmente precisam, feito à sua medida.',
        fr: 'Beaucoup de bonnes entreprises n’ont pas bien réussi le passage au numérique. Nous voulons qu’elles le fassent avec ce dont elles ont vraiment besoin, sur mesure.',
        it: 'Molte buone attività non hanno fatto bene il salto al digitale. Vogliamo che lo facciano con ciò di cui hanno davvero bisogno, su misura.'
      }
    },
    como: {
      es: 'Primero entendemos contigo para qué; después construimos el lugar propio de tu negocio en internet y medimos si sirvió. Junto a Recvid, que te ayuda a encontrar lo que te distingue y a mostrarlo.',
      en: 'First we work out with you what for; then we build your business’s own place online and measure whether it worked. Alongside Recvid, which helps you find what sets you apart and show it.',
      pt: 'Primeiro percebemos contigo para quê; depois construímos o lugar próprio do teu negócio na internet e medimos se serviu. Junto com a Recvid, que te ajuda a encontrar o que te distingue e a mostrá-lo.',
      fr: 'D’abord, nous comprenons avec vous pour quoi faire ; ensuite, nous construisons la place de votre entreprise en ligne et nous mesurons si elle a servi. Aux côtés de Recvid, qui vous aide à trouver ce qui vous distingue et à le montrer.',
      it: 'Prima capiamo con te a cosa serve; poi costruiamo il posto della tua attività online e misuriamo se ha funzionato. Insieme a Recvid, che ti aiuta a trovare ciò che ti distingue e a mostrarlo.'
    }
  },

  recvid: {
    pregunta: {
      es: '¿Por qué recuerdan a otras marcas y no a la tuya?',
      en: 'Why do people remember other brands and not yours?',
      pt: 'Porque é que se lembram de outras marcas e não da tua?',
      fr: 'Pourquoi se souvient-on des autres marques et pas de la vôtre ?',
      it: 'Perché si ricordano di altri marchi e non del tuo?'
    },
    /* Infinitivos. Las tendencias van primeras a proposito: son lo que mas
       se confunde con ser recordado. Contratar una agencia va tachado
       tambien a proposito: Recvid enseña para que un dia no la necesites,
       tampoco a Recvid. */
    tacha: {
      es: ['Seguir las tendencias', 'Pagar más pauta', 'Publicar todos los días', 'Tener mejor cámara', 'Contratar una agencia', 'Editar mejor', 'Grabar más'],
      en: ['Following trends', 'Paying for more ads', 'Posting every day', 'Getting a better camera', 'Hiring an agency', 'Editing better', 'Filming more'],
      pt: ['Seguir as tendências', 'Pagar mais anúncios', 'Publicar todos os dias', 'Ter uma câmara melhor', 'Contratar uma agência', 'Editar melhor', 'Gravar mais'],
      fr: ['Suivre les tendances', 'Payer plus de pub', 'Publier tous les jours', 'Avoir une meilleure caméra', 'Engager une agence', 'Mieux monter', 'Filmer plus'],
      it: ['Seguire le tendenze', 'Pagare più pubblicità', 'Pubblicare ogni giorno', 'Avere una fotocamera migliore', 'Assumere un’agenzia', 'Montare meglio', 'Girare di più']
    },
    pone: {
      es: 'Saber por qué existes.',
      en: 'Knowing why you exist.',
      pt: 'Saber porque existes.',
      fr: 'Savoir pourquoi vous existez.',
      it: 'Sapere perché esisti.'
    },
    remate: {
      es: 'La pregunta no es cuánto publicas. Es desde dónde.',
      en: 'The question isn’t how much you post. It’s where it comes from.',
      pt: 'A pergunta não é quanto publicas. É de onde.',
      fr: 'La question n’est pas combien vous publiez. C’est d’où.',
      it: 'La domanda non è quanto pubblichi. È da dove.'
    },
    porque: {
      es: 'Una tendencia te consigue la vista de hoy y te deja igual a todas las marcas que la hicieron esta semana. Y la cámara casi nunca es el problema: las marcas no se olvidan por mala imagen, se olvidan porque nunca supieron para qué existían más allá de vender. Por eso enseñamos antes de grabar.',
      en: 'A trend gets you today’s views and leaves you looking like every brand that did it this week. And the camera is almost never the problem: brands aren’t forgotten for poor image, they’re forgotten because they never knew what they existed for beyond selling. That’s why we teach before we film.',
      pt: 'Uma tendência dá-te as visualizações de hoje e deixa-te igual a todas as marcas que a fizeram esta semana. E a câmara quase nunca é o problema: as marcas não são esquecidas por má imagem, são esquecidas porque nunca souberam para que existiam além de vender. Por isso ensinamos antes de gravar.',
      fr: 'Une tendance vous apporte les vues du jour et vous rend pareil à toutes les marques qui l’ont suivie cette semaine. Et la caméra n’est presque jamais le problème : on n’oublie pas une marque pour une mauvaise image, on l’oublie parce qu’elle n’a jamais su à quoi elle servait au-delà de vendre. C’est pourquoi nous enseignons avant de filmer.',
      it: 'Una tendenza ti porta le visualizzazioni di oggi e ti lascia uguale a tutti i marchi che l’hanno seguita questa settimana. E la fotocamera non è quasi mai il problema: i marchi non si dimenticano per una brutta immagine, si dimenticano perché non hanno mai saputo a cosa servissero oltre a vendere. Per questo insegniamo prima di girare.'
    },
    /* «Te ayuda a encontrar» y no «encuentra»: lo que te distingue lo
       encuentras tu. Si lo encontrara Recvid, volverias a necesitarla. */
    que: {
      es: 'Recvid te ayuda a encontrar lo que te distingue, y te enseña a mostrarlo.',
      en: 'Recvid helps you find what sets you apart, and teaches you to show it.',
      pt: 'A Recvid ajuda-te a encontrar o que te distingue, e ensina-te a mostrá-lo.',
      fr: 'Recvid vous aide à trouver ce qui vous distingue, et vous apprend à le montrer.',
      it: 'Recvid ti aiuta a trovare ciò che ti distingue, e ti insegna a mostrarlo.'
    },
    origen: {
      /* Cuenta algo que paso: lo confirma el fundador. «El equipo» es el de
         grabar —camara, luces—, no la gente: por eso «gear» y «matériel». */
      corta: {
        es: 'Empezamos grabando lo nuestro. Ahí aprendimos que el equipo nunca fue el problema.',
        en: 'We started by filming our own work. That’s where we learned the gear was never the problem.',
        pt: 'Começámos a gravar o que era nosso. Foi aí que aprendemos que o equipamento nunca foi o problema.',
        fr: 'Nous avons commencé par filmer nos propres projets. C’est là que nous avons appris que le matériel n’a jamais été le problème.',
        it: 'Abbiamo iniziato girando le nostre cose. Lì abbiamo imparato che l’attrezzatura non è mai stata il problema.'
      },
      larga: {
        es: 'Grabando nuestros propios sketches y reels vimos que lo que hace que alguien recuerde algo no se compra: se entiende.',
        en: 'Filming our own sketches and reels, we saw that what makes someone remember something can’t be bought: it has to be understood.',
        pt: 'A gravar os nossos próprios sketches e reels, vimos que o que faz alguém lembrar-se de algo não se compra: entende-se.',
        fr: 'En filmant nos propres sketches et reels, nous avons vu que ce qui fait qu’on se souvient de quelque chose ne s’achète pas : ça se comprend.',
        it: 'Girando i nostri sketch e reel abbiamo visto che ciò che fa ricordare qualcosa non si compra: si capisce.'
      }
    },
    mision: {
      corta: {
        es: 'Enseñarle a cada marca a contar lo que solo ella puede contar.',
        en: 'To teach every brand to tell what only it can tell.',
        pt: 'Ensinar cada marca a contar o que só ela pode contar.',
        fr: 'Apprendre à chaque marque à raconter ce qu’elle seule peut raconter.',
        it: 'Insegnare a ogni marchio a raccontare ciò che solo lui può raccontare.'
      },
      larga: {
        es: 'Cámara, edición y estrategia, para las redes y para tus propios medios, explicadas para que un día lo hagas sin nosotros.',
        en: 'Camera, editing and strategy, for social media and for your own channels, explained so that one day you can do it without us.',
        pt: 'Câmara, edição e estratégia, para as redes e para os teus próprios meios, explicadas para que um dia o faças sem nós.',
        fr: 'Caméra, montage et stratégie, pour les réseaux et pour vos propres médias, expliqués pour qu’un jour vous le fassiez sans nous.',
        it: 'Ripresa, montaggio e strategia, per i social e per i tuoi canali, spiegati perché un giorno tu lo faccia senza di noi.'
      }
    },
    /* A nadie, tampoco a Recvid: una marca que necesita a quien le enseño
       para sonar a si misma no aprendio. */
    vision: {
      corta: {
        es: 'Marcas que no necesitan a nadie para sonar a ellas mismas.',
        en: 'Brands that need no one to sound like themselves.',
        pt: 'Marcas que não precisam de ninguém para soarem a si mesmas.',
        fr: 'Des marques qui n’ont besoin de personne pour sonner comme elles-mêmes.',
        it: 'Marchi che non hanno bisogno di nessuno per suonare come sé stessi.'
      },
      larga: {
        es: 'Una escuela al alcance de cualquiera que tenga algo que decir, donde aprender a grabar no dependa de tener dinero ni de nosotros.',
        en: 'A school within reach of anyone who has something to say, where learning to film depends neither on money nor on us.',
        pt: 'Uma escola ao alcance de qualquer pessoa que tenha algo a dizer, onde aprender a gravar não dependa de ter dinheiro nem de nós.',
        fr: 'Une école à la portée de quiconque a quelque chose à dire, où apprendre à filmer ne dépend ni de l’argent ni de nous.',
        it: 'Una scuola alla portata di chiunque abbia qualcosa da dire, dove imparare a girare non dipenda dai soldi né da noi.'
      }
    },
    como: {
      es: 'Hoy damos asesorías y hacemos nuestros propios sketches y reels, donde se ve lo que enseñamos. La plataforma llega pronto. Grabar por encargo, solo si el proyecto lo merece.',
      en: 'Today we give consultations and make our own sketches and reels, where you can see what we teach. The platform is coming soon. Filming to order, only if the project is worth it.',
      pt: 'Hoje damos consultoria e fazemos os nossos próprios sketches e reels, onde se vê o que ensinamos. A plataforma chega em breve. Gravar por encomenda, só se o projeto o merecer.',
      fr: 'Aujourd’hui, nous donnons des conseils et réalisons nos propres sketches et reels, où l’on voit ce que nous enseignons. La plateforme arrive bientôt. Filmer sur commande, seulement si le projet le mérite.',
      it: 'Oggi facciamo consulenze e giriamo i nostri sketch e reel, dove si vede ciò che insegniamo. La piattaforma arriva presto. Girare su commissione, solo se il progetto lo merita.'
    }
  },

  u: {
    pregunta: {
      es: '¿Por qué otros cumplen sus sueños en la pantalla y los tuyos siguen esperando?',
      en: 'Why do others live out their dreams on screen while yours keep waiting?',
      pt: 'Porque é que os outros cumprem os seus sonhos no ecrã e os teus continuam à espera?',
      fr: 'Pourquoi les autres réalisent-ils leurs rêves à l’écran pendant que les vôtres attendent encore ?',
      it: 'Perché gli altri realizzano i loro sogni sullo schermo e i tuoi restano ad aspettare?'
    },
    /* Sustantivos. «Otra app de hábitos» va primera a proposito: FraterniU es
       una app, y tacharla es el mismo gesto que Let Be tachando «una pagina
       web». */
    tacha: {
      es: ['Otra app de hábitos', 'Más motivación', 'Más disciplina', 'Otro sistema de productividad', 'Más tiempo libre', 'Otro año nuevo'],
      en: ['Another habit app', 'More motivation', 'More discipline', 'Another productivity system', 'More free time', 'Another new year'],
      pt: ['Mais uma app de hábitos', 'Mais motivação', 'Mais disciplina', 'Mais um sistema de produtividade', 'Mais tempo livre', 'Mais um ano novo'],
      fr: ['Encore une appli d’habitudes', 'Plus de motivation', 'Plus de discipline', 'Encore un système de productivité', 'Plus de temps libre', 'Encore une nouvelle année'],
      it: ['Un’altra app di abitudini', 'Più motivazione', 'Più disciplina', 'Un altro sistema di produttività', 'Più tempo libero', 'Un altro anno nuovo']
    },
    pone: {
      es: 'Un camino propio.',
      en: 'A path of your own.',
      pt: 'Um caminho próprio.',
      fr: 'Un chemin à vous.',
      it: 'Un cammino tutto tuo.'
    },
    remate: {
      es: 'La pregunta no es cuánta disciplina te falta. Es hacia dónde.',
      en: 'The question isn’t how much discipline you lack. It’s where you’re headed.',
      pt: 'A pergunta não é quanta disciplina te falta. É para onde.',
      fr: 'La question n’est pas combien de discipline vous manque. C’est vers où.',
      it: 'La domanda non è quanta disciplina ti manca. È verso dove.'
    },
    porque: {
      es: 'Ver a otros avanzar no es el problema. El problema es que ver reemplazó a avanzar: la pantalla entrega la sensación del logro sin el logro. Y lo que falta casi nunca es disciplina: es un destino lo bastante tuyo como para que la disciplina tenga sentido. Primero el rumbo. La constancia viene después.',
      en: 'Watching others move forward isn’t the problem. The problem is that watching replaced moving: the screen delivers the feeling of achievement without the achievement. And what’s missing is almost never discipline: it’s a destination that’s yours enough for discipline to make sense. Direction first. Consistency comes after.',
      pt: 'Ver os outros avançar não é o problema. O problema é que ver substituiu avançar: o ecrã entrega a sensação da conquista sem a conquista. E o que falta quase nunca é disciplina: é um destino suficientemente teu para que a disciplina faça sentido. Primeiro o rumo. A constância vem depois.',
      fr: 'Voir les autres avancer n’est pas le problème. Le problème, c’est que regarder a remplacé avancer : l’écran donne la sensation de la réussite sans la réussite. Et ce qui manque, ce n’est presque jamais la discipline : c’est une destination assez à vous pour que la discipline ait un sens. D’abord le cap. La constance vient ensuite.',
      it: 'Vedere gli altri andare avanti non è il problema. Il problema è che guardare ha sostituito avanzare: lo schermo dà la sensazione del traguardo senza il traguardo. E quello che manca non è quasi mai la disciplina: è una meta abbastanza tua perché la disciplina abbia senso. Prima la direzione. La costanza viene dopo.'
    },
    que: {
      es: 'FraterniU es una app para ordenarte y crecer.',
      en: 'FraterniU is an app to get organized and grow.',
      pt: 'A FraterniU é uma app para te organizares e cresceres.',
      fr: 'FraterniU est une appli pour vous organiser et grandir.',
      it: 'FraterniU è un’app per organizzarti e crescere.'
    },
    /* Origen, mision y vision: borradores del documento de copy, por
       confirmar. */
    origen: {
      corta: {
        es: 'Empezamos porque ordenarse no debería depender de tener a alguien encima.',
        en: 'We started because getting organized shouldn’t depend on having someone on your back.',
        pt: 'Começámos porque organizar-se não devia depender de ter alguém em cima.',
        fr: 'Nous avons commencé parce que s’organiser ne devrait pas dépendre d’avoir quelqu’un sur le dos.',
        it: 'Abbiamo iniziato perché organizzarsi non dovrebbe dipendere dall’avere qualcuno addosso.'
      },
      larga: {
        es: 'Su manifiesto lo dice así: «Dismantling chronic performance. Restoring your original identity». Desarmar la actuación de siempre y volver a lo que eres.',
        en: 'Its manifesto puts it this way: “Dismantling chronic performance. Restoring your original identity.” Taking apart the usual act and returning to who you are.',
        pt: 'O seu manifesto diz assim: «Dismantling chronic performance. Restoring your original identity». Desmontar a atuação de sempre e voltar ao que és.',
        fr: 'Son manifeste le dit ainsi : « Dismantling chronic performance. Restoring your original identity ». Défaire le rôle de toujours et revenir à ce que vous êtes.',
        it: 'Il suo manifesto lo dice così: «Dismantling chronic performance. Restoring your original identity». Smontare la recita di sempre e tornare a ciò che sei.'
      }
    },
    mision: {
      corta: {
        es: 'Darle a cada persona un camino que pueda seguir sin que nadie la empuje.',
        en: 'To give every person a path they can follow without anyone pushing them.',
        pt: 'Dar a cada pessoa um caminho que possa seguir sem que ninguém a empurre.',
        fr: 'Donner à chaque personne un chemin qu’elle peut suivre sans que personne ne la pousse.',
        it: 'Dare a ogni persona un cammino che possa seguire senza che nessuno la spinga.'
      },
      larga: {
        es: 'Su lema: «Build your path, leave your mark». Productividad y crecimiento personal y profesional en un mismo lugar, para que salgas adelante con lo tuyo y no con lo que se ve bien en la pantalla.',
        en: 'Its motto: “Build your path, leave your mark.” Productivity and personal and professional growth in one place, so you get ahead with what’s yours and not with what looks good on screen.',
        pt: 'O seu lema: «Build your path, leave your mark». Produtividade e crescimento pessoal e profissional num só lugar, para que avances com o que é teu e não com o que fica bem no ecrã.',
        fr: 'Sa devise : « Build your path, leave your mark ». Productivité et croissance personnelle et professionnelle au même endroit, pour que vous avanciez avec ce qui est à vous et non avec ce qui rend bien à l’écran.',
        it: 'Il suo motto: «Build your path, leave your mark». Produttività e crescita personale e professionale in un unico posto, perché tu vada avanti con ciò che è tuo e non con ciò che sta bene sullo schermo.'
      }
    },
    vision: {
      corta: {
        es: 'Un mundo donde crecer no dependa de la suerte ni del origen.',
        en: 'A world where growing depends neither on luck nor on where you come from.',
        pt: 'Um mundo onde crescer não dependa da sorte nem da origem.',
        fr: 'Un monde où grandir ne dépend ni de la chance ni de l’origine.',
        it: 'Un mondo dove crescere non dipenda dalla fortuna né dall’origine.'
      },
      larga: {
        es: 'Dejar de actuar para los demás y volver a lo que eres. Una app que mida lo que avanzas, y no cuántos te miran.',
        en: 'To stop performing for others and return to who you are. An app that measures how far you move, not how many people watch.',
        pt: 'Deixar de atuar para os outros e voltar ao que és. Uma app que meça o que avanças, e não quantos te veem.',
        fr: 'Cesser de jouer un rôle pour les autres et revenir à ce que vous êtes. Une appli qui mesure vos progrès, et non combien de gens vous regardent.',
        it: 'Smettere di recitare per gli altri e tornare a ciò che sei. Un’app che misuri quanto avanzi, e non quanti ti guardano.'
      }
    },
    como: {
      es: 'Estamos construyendo la app: ordena tu día, cuida tu concentración y mide lo que avanzas —no los «me gusta»—. Lo que haga falta aprender, lo enseña Fraterni Academy, su escuela.',
      en: 'We’re building the app: it organizes your day, protects your focus and measures how far you move — not the likes. Whatever needs learning, Fraterni Academy, its school, teaches.',
      pt: 'Estamos a construir a app: organiza o teu dia, cuida da tua concentração e mede o que avanças — não os «gostos». O que for preciso aprender, ensina-o a Fraterni Academy, a sua escola.',
      fr: 'Nous construisons l’appli : elle organise votre journée, protège votre concentration et mesure vos progrès — pas les « j’aime ». Ce qu’il faut apprendre, Fraterni Academy, son école, l’enseigne.',
      it: 'Stiamo costruendo l’app: organizza la tua giornata, protegge la tua concentrazione e misura quanto avanzi — non i «mi piace». Quello che serve imparare lo insegna Fraterni Academy, la sua scuola.'
    }
  },

  /* De FraterniU. Sin pagina propia: sus `larga` no se leerian en ningun
     sitio, y no las lleva. */
  academy: {
    pregunta: {
      es: '¿Por qué terminas cursos y todo sigue igual?',
      en: 'Why do you finish courses and nothing changes?',
      pt: 'Porque é que acabas cursos e tudo continua igual?',
      fr: 'Pourquoi finissez-vous des formations sans que rien ne change ?',
      it: 'Perché finisci corsi e tutto resta uguale?'
    },
    /* Infinitivos. */
    tacha: {
      es: ['Terminar otro curso', 'Tomar notas mejor', 'Conseguir otro certificado', 'Estudiar más horas', 'Buscar un mejor profesor', 'Empezar de cero otra vez'],
      en: ['Finishing another course', 'Taking better notes', 'Getting another certificate', 'Studying more hours', 'Finding a better teacher', 'Starting from scratch again'],
      pt: ['Acabar mais um curso', 'Tomar melhores apontamentos', 'Conseguir outro certificado', 'Estudar mais horas', 'Procurar um professor melhor', 'Recomeçar do zero'],
      fr: ['Finir une autre formation', 'Mieux prendre des notes', 'Obtenir un autre certificat', 'Étudier plus d’heures', 'Chercher un meilleur prof', 'Repartir de zéro'],
      it: ['Finire un altro corso', 'Prendere appunti migliori', 'Ottenere un altro certificato', 'Studiare più ore', 'Cercare un insegnante migliore', 'Ricominciare da zero']
    },
    pone: {
      es: 'Saber para qué lo aprendes.',
      en: 'Knowing what you learn it for.',
      pt: 'Saber para que o aprendes.',
      fr: 'Savoir pourquoi vous l’apprenez.',
      it: 'Sapere perché lo impari.'
    },
    remate: {
      es: 'La pregunta no es cuánto sabes. Es para qué lo querías.',
      en: 'The question isn’t how much you know. It’s what you wanted it for.',
      pt: 'A pergunta não é quanto sabes. É para que o querias.',
      fr: 'La question n’est pas ce que vous savez. C’est pour quoi vous le vouliez.',
      it: 'La domanda non è quanto sai. È a cosa ti serviva.'
    },
    porque: {
      es: 'Un curso se termina el viernes y el lunes la vida sigue igual, porque terminar y aplicar son dos cosas distintas y solo una de las dos se certifica. Aquí no se mide cuánto viste: se mide qué cambió después. Por eso cada cosa que se enseña llega con el para qué pegado, y si no tiene uno, no se enseña.',
      en: 'A course ends on Friday and on Monday life is the same, because finishing and applying are two different things and only one of them gets certified. Here we don’t measure how much you watched: we measure what changed afterwards. That’s why everything we teach comes with its purpose attached, and if it doesn’t have one, it isn’t taught.',
      pt: 'Um curso acaba na sexta e na segunda a vida continua igual, porque acabar e aplicar são duas coisas diferentes e só uma delas se certifica. Aqui não se mede quanto viste: mede-se o que mudou depois. Por isso cada coisa que se ensina chega com o para quê colado, e se não tiver um, não se ensina.',
      fr: 'Une formation se termine le vendredi et le lundi la vie reste la même, parce que finir et appliquer sont deux choses différentes et qu’une seule des deux est certifiée. Ici, on ne mesure pas ce que vous avez vu : on mesure ce qui a changé après. C’est pourquoi chaque chose enseignée arrive avec sa raison d’être, et si elle n’en a pas, elle n’est pas enseignée.',
      it: 'Un corso finisce il venerdì e il lunedì la vita resta uguale, perché finire e applicare sono due cose diverse e solo una delle due si certifica. Qui non si misura quanto hai visto: si misura cosa è cambiato dopo. Per questo ogni cosa che si insegna arriva con il suo scopo attaccato, e se non ne ha uno, non si insegna.'
    },
    que: {
      es: 'Fraterni Academy es la escuela de FraterniU: se aprueba aplicando, no terminando.',
      en: 'Fraterni Academy is FraterniU’s school: you pass by applying, not by finishing.',
      pt: 'A Fraterni Academy é a escola da FraterniU: passa-se aplicando, não acabando.',
      fr: 'Fraterni Academy est l’école de FraterniU : on réussit en appliquant, pas en finissant.',
      it: 'Fraterni Academy è la scuola di FraterniU: si supera applicando, non finendo.'
    },
    /* Borradores, por confirmar. */
    origen: {
      corta: {
        es: 'Nació porque coleccionar cursos terminados no cambió nada, y aplicar uno sí.',
        en: 'It was born because collecting finished courses changed nothing, and applying one did.',
        pt: 'Nasceu porque colecionar cursos acabados não mudou nada, e aplicar um mudou.',
        fr: 'Elle est née parce que collectionner les formations terminées n’a rien changé, et qu’en appliquer une, si.',
        it: 'È nata perché collezionare corsi finiti non ha cambiato niente, e applicarne uno sì.'
      }
    },
    mision: {
      corta: {
        es: 'Enseñar solo lo que alguien va a aplicar.',
        en: 'To teach only what someone is going to apply.',
        pt: 'Ensinar só o que alguém vai aplicar.',
        fr: 'Enseigner seulement ce que quelqu’un va appliquer.',
        it: 'Insegnare solo ciò che qualcuno applicherà.'
      }
    },
    vision: {
      corta: {
        es: 'Un aprendizaje que se mide por lo que cambia, no por lo que se certifica.',
        en: 'Learning measured by what changes, not by what gets certified.',
        pt: 'Uma aprendizagem que se mede pelo que muda, não pelo que se certifica.',
        fr: 'Un apprentissage qui se mesure à ce qui change, pas à ce qui est certifié.',
        it: 'Un apprendimento che si misura da ciò che cambia, non da ciò che si certifica.'
      }
    },
    como: {
      es: 'Todavía no abre. Se construye junto a la app: cada entrenamiento termina en algo que se practica en FraterniU.',
      en: 'Not open yet. It’s being built alongside the app: every training ends in something you practise in FraterniU.',
      pt: 'Ainda não abriu. Constrói-se junto com a app: cada treino acaba em algo que se pratica na FraterniU.',
      fr: 'Pas encore ouverte. Elle se construit avec l’appli : chaque entraînement se termine par quelque chose qu’on pratique dans FraterniU.',
      it: 'Non è ancora aperta. Si costruisce insieme all’app: ogni allenamento finisce in qualcosa che si pratica in FraterniU.'
    }
  },

  us: {
    pregunta: {
      es: '¿Por qué un grupo lleno de buenas ideas no termina ninguna?',
      en: 'Why does a group full of good ideas never finish any?',
      pt: 'Porque é que um grupo cheio de boas ideias não acaba nenhuma?',
      fr: 'Pourquoi un groupe plein de bonnes idées n’en termine aucune ?',
      it: 'Perché un gruppo pieno di buone idee non ne porta a termine nessuna?'
    },
    /* Sustantivos. */
    tacha: {
      es: ['Más reuniones', 'Un mejor grupo de WhatsApp', 'Otra herramienta de tareas', 'Más compromiso', 'Un líder más firme', 'Más tiempo'],
      en: ['More meetings', 'A better WhatsApp group', 'Another task tool', 'More commitment', 'A firmer leader', 'More time'],
      pt: ['Mais reuniões', 'Um grupo de WhatsApp melhor', 'Mais uma ferramenta de tarefas', 'Mais compromisso', 'Um líder mais firme', 'Mais tempo'],
      fr: ['Plus de réunions', 'Un meilleur groupe WhatsApp', 'Encore un outil de tâches', 'Plus d’engagement', 'Un leader plus ferme', 'Plus de temps'],
      it: ['Più riunioni', 'Un gruppo WhatsApp migliore', 'Un altro strumento per le attività', 'Più impegno', 'Un leader più deciso', 'Più tempo']
    },
    pone: {
      es: 'Un camino compartido.',
      en: 'A shared path.',
      pt: 'Um caminho partilhado.',
      fr: 'Un chemin partagé.',
      it: 'Un cammino condiviso.'
    },
    remate: {
      es: 'La pregunta no es de quién fue la idea. Es quién la sostiene.',
      en: 'The question isn’t whose idea it was. It’s who carries it.',
      pt: 'A pergunta não é de quem foi a ideia. É quem a sustenta.',
      fr: 'La question n’est pas de qui venait l’idée. C’est qui la porte.',
      it: 'La domanda non è di chi era l’idea. È chi la porta avanti.'
    },
    porque: {
      es: 'Un grupo no falla por falta de ideas: falla porque la idea es de todos y el siguiente paso no es de nadie. Las reuniones no lo arreglan, lo aplazan con buena cara. Lo que hace la diferencia es que el camino esté afuera de las cabezas, a la vista, con nombre propio en cada tramo. Eso se puede armar. La voluntad no.',
      en: 'A group doesn’t fail for lack of ideas: it fails because the idea belongs to everyone and the next step belongs to no one. Meetings don’t fix it, they postpone it with a smile. What makes the difference is a path outside people’s heads, in plain sight, with a name on every stretch. That can be built. Willpower can’t.',
      pt: 'Um grupo não falha por falta de ideias: falha porque a ideia é de todos e o passo seguinte não é de ninguém. As reuniões não o resolvem, adiam-no com boa cara. O que faz a diferença é o caminho estar fora das cabeças, à vista, com um nome em cada troço. Isso pode construir-se. A vontade não.',
      fr: 'Un groupe n’échoue pas par manque d’idées : il échoue parce que l’idée est à tout le monde et que l’étape suivante n’est à personne. Les réunions ne règlent rien, elles repoussent le problème avec le sourire. Ce qui fait la différence, c’est un chemin hors des têtes, à la vue de tous, avec un nom sur chaque tronçon. Ça, on peut le construire. La volonté, non.',
      it: 'Un gruppo non fallisce per mancanza di idee: fallisce perché l’idea è di tutti e il passo successivo non è di nessuno. Le riunioni non lo risolvono, lo rimandano col sorriso. Quello che fa la differenza è che il cammino stia fuori dalle teste, in vista, con un nome su ogni tratto. Questo si può costruire. La volontà no.'
    },
    que: {
      es: 'Fraterni Us convierte un grupo de buenas intenciones en un grupo con un camino.',
      en: 'Fraterni Us turns a group of good intentions into a group with a path.',
      pt: 'A Fraterni Us transforma um grupo de boas intenções num grupo com um caminho.',
      fr: 'Fraterni Us transforme un groupe de bonnes intentions en un groupe avec un chemin.',
      it: 'Fraterni Us trasforma un gruppo di buone intenzioni in un gruppo con un cammino.'
    },
    /* Borradores, por confirmar. */
    origen: {
      corta: {
        es: 'Salió de ver grupos buenos disolverse sin que nadie se peleara.',
        en: 'It came from watching good groups fall apart without anyone fighting.',
        pt: 'Nasceu de ver bons grupos desfazerem-se sem que ninguém discutisse.',
        fr: 'Elle est née en voyant de bons groupes se dissoudre sans que personne ne se dispute.',
        it: 'È nata vedendo buoni gruppi sciogliersi senza che nessuno litigasse.'
      }
    },
    mision: {
      corta: {
        es: 'Darle a un grupo el mismo camino que FraterniU le da a una persona.',
        en: 'To give a group the same path FraterniU gives a person.',
        pt: 'Dar a um grupo o mesmo caminho que a FraterniU dá a uma pessoa.',
        fr: 'Donner à un groupe le même chemin que FraterniU donne à une personne.',
        it: 'Dare a un gruppo lo stesso cammino che FraterniU dà a una persona.'
      }
    },
    vision: {
      corta: {
        es: 'Grupos que terminan lo que empiezan sin depender de quien más empuja.',
        en: 'Groups that finish what they start without depending on whoever pushes hardest.',
        pt: 'Grupos que acabam o que começam sem depender de quem empurra mais.',
        fr: 'Des groupes qui terminent ce qu’ils commencent sans dépendre de celui qui pousse le plus.',
        it: 'Gruppi che finiscono ciò che iniziano senza dipendere da chi spinge di più.'
      }
    },
    como: {
      es: 'Todavía no abre. Es la misma app de FraterniU con espacio para el grupo: metas compartidas y avances que se ven entre todos. De aquí sale Fraterni Business.',
      en: 'Not open yet. It’s the same FraterniU app with room for the group: shared goals and progress everyone can see. Fraterni Business grows out of it.',
      pt: 'Ainda não abriu. É a mesma app da FraterniU com espaço para o grupo: metas partilhadas e avanços que todos veem. Daqui nasce a Fraterni Business.',
      fr: 'Pas encore ouverte. C’est la même appli que FraterniU, avec de la place pour le groupe : des objectifs partagés et des progrès que tous voient. C’est d’ici que naît Fraterni Business.',
      it: 'Non è ancora aperta. È la stessa app di FraterniU con spazio per il gruppo: obiettivi condivisi e progressi che si vedono tra tutti. Da qui nasce Fraterni Business.'
    }
  },

  /* De Fraterni Us. LA TARJETA QUE CAMBIO DE FONDO: antes hablaba de que los
     clientes vuelvan; ahora dice lo que Business es, el unico nodo que junta
     a Let Be, Recvid y Fraterni Us. Por eso es tambien la unica que nombra a
     las otras marcas. */
  business: {
    pregunta: {
      es: '¿Tu empresa funciona, o funcionas tú?',
      en: 'Does your company work, or do you?',
      pt: 'A tua empresa funciona, ou funcionas tu?',
      fr: 'Est-ce votre entreprise qui tourne, ou vous ?',
      it: 'Funziona la tua azienda, o funzioni tu?'
    },
    /* Sustantivos. */
    tacha: {
      es: ['Un gerente más', 'Otro software de gestión', 'Más personal', 'Un manual de procesos', 'Más horas tuyas', 'Una reestructuración'],
      en: ['One more manager', 'Another management software', 'More staff', 'A process manual', 'More of your hours', 'A restructuring'],
      pt: ['Mais um gerente', 'Mais um software de gestão', 'Mais pessoal', 'Um manual de processos', 'Mais horas tuas', 'Uma reestruturação'],
      fr: ['Un manager de plus', 'Encore un logiciel de gestion', 'Plus de personnel', 'Un manuel de procédures', 'Plus de vos heures', 'Une restructuration'],
      it: ['Un manager in più', 'Un altro gestionale', 'Più personale', 'Un manuale dei processi', 'Più ore tue', 'Una ristrutturazione']
    },
    pone: {
      es: 'Un sistema que no te necesite.',
      en: 'A system that doesn’t need you.',
      pt: 'Um sistema que não precise de ti.',
      fr: 'Un système qui n’a pas besoin de vous.',
      it: 'Un sistema che non abbia bisogno di te.'
    },
    remate: {
      es: 'La pregunta no es cuánto trabajas. Es qué pasa cuando no estás.',
      en: 'The question isn’t how much you work. It’s what happens when you’re not there.',
      pt: 'A pergunta não é quanto trabalhas. É o que acontece quando não estás.',
      fr: 'La question n’est pas combien vous travaillez. C’est ce qui se passe quand vous n’êtes pas là.',
      it: 'La domanda non è quanto lavori. È cosa succede quando non ci sei.'
    },
    porque: {
      es: 'Hay empresas que facturan bien y aun así no existen sin su dueño: todo lo que importa pasa por una sola cabeza. Contratar a alguien más no lo resuelve, lo reparte. Lo que lo resuelve es que la empresa tenga tres cosas que una persona no puede reemplazar: infraestructura que opere sin ti, un relato que cualquiera del equipo pueda contar igual y un método que el grupo sepa seguir solo. Eso se arma una vez y queda.',
      en: 'Some companies bill well and still don’t exist without their owner: everything that matters goes through one head. Hiring someone else doesn’t solve it, it spreads it out. What solves it is giving the company three things one person can’t replace: infrastructure that runs without you, a story anyone on the team can tell the same way, and a method the group knows how to follow on its own. That gets built once and stays.',
      pt: 'Há empresas que faturam bem e mesmo assim não existem sem o dono: tudo o que importa passa por uma só cabeça. Contratar mais alguém não resolve, reparte. O que resolve é a empresa ter três coisas que uma pessoa não pode substituir: infraestrutura que opere sem ti, um relato que qualquer pessoa da equipa possa contar igual e um método que o grupo saiba seguir sozinho. Isso constrói-se uma vez e fica.',
      fr: 'Certaines entreprises facturent bien et pourtant n’existent pas sans leur patron : tout ce qui compte passe par une seule tête. Embaucher quelqu’un de plus ne règle rien, ça répartit. Ce qui règle le problème, c’est que l’entreprise ait trois choses qu’une personne ne peut pas remplacer : une infrastructure qui tourne sans vous, un récit que n’importe qui dans l’équipe peut raconter de la même façon et une méthode que le groupe sait suivre seul. Ça se construit une fois et ça reste.',
      it: 'Ci sono aziende che fatturano bene e comunque non esistono senza il loro titolare: tutto ciò che conta passa da una sola testa. Assumere qualcun altro non lo risolve, lo distribuisce. Quello che lo risolve è che l’azienda abbia tre cose che una persona non può sostituire: un’infrastruttura che funzioni senza di te, un racconto che chiunque nel team possa raccontare allo stesso modo e un metodo che il gruppo sappia seguire da solo. Si costruisce una volta e resta.'
    },
    que: {
      es: 'Fraterni Business junta las tres piezas: la infraestructura de Let Be, el criterio de Recvid y el método de Fraterni Us.',
      en: 'Fraterni Business brings the three pieces together: Let Be’s infrastructure, Recvid’s judgment and Fraterni Us’s method.',
      pt: 'A Fraterni Business junta as três peças: a infraestrutura da Let Be, o critério da Recvid e o método da Fraterni Us.',
      fr: 'Fraterni Business réunit les trois pièces : l’infrastructure de Let Be, le regard de Recvid et la méthode de Fraterni Us.',
      it: 'Fraterni Business mette insieme i tre pezzi: l’infrastruttura di Let Be, il criterio di Recvid e il metodo di Fraterni Us.'
    },
    origen: {
      corta: {
        es: 'Existimos porque una empresa que depende de una sola persona no es una empresa: es un empleo difícil.',
        en: 'We exist because a company that depends on one person isn’t a company: it’s a hard job.',
        pt: 'Existimos porque uma empresa que depende de uma só pessoa não é uma empresa: é um emprego difícil.',
        fr: 'Nous existons parce qu’une entreprise qui dépend d’une seule personne n’est pas une entreprise : c’est un emploi difficile.',
        it: 'Esistiamo perché un’azienda che dipende da una sola persona non è un’azienda: è un lavoro difficile.'
      }
    },
    mision: {
      corta: {
        es: 'Construir empresas que caminen sin quien las fundó.',
        en: 'To build companies that walk without the person who founded them.',
        pt: 'Construir empresas que caminhem sem quem as fundou.',
        fr: 'Construire des entreprises qui avancent sans celui qui les a fondées.',
        it: 'Costruire aziende che camminino senza chi le ha fondate.'
      }
    },
    vision: {
      corta: {
        es: 'Un mercado donde el dueño pueda irse un mes y nadie lo note.',
        en: 'A market where the owner can leave for a month and nobody notices.',
        pt: 'Um mercado onde o dono possa sair um mês e ninguém dê por isso.',
        fr: 'Un marché où le patron peut partir un mois sans que personne ne le remarque.',
        it: 'Un mercato dove il titolare possa andarsene per un mese e nessuno se ne accorga.'
      }
    },
    como: {
      es: 'Todavía no abre. Empieza por mirar qué depende solo de ti; después arma las tres piezas: la infraestructura con Let Be, el relato con Recvid y el método con Fraterni Us.',
      en: 'Not open yet. It starts by looking at what depends only on you; then it builds the three pieces: the infrastructure with Let Be, the story with Recvid and the method with Fraterni Us.',
      pt: 'Ainda não abriu. Começa por ver o que depende só de ti; depois monta as três peças: a infraestrutura com a Let Be, o relato com a Recvid e o método com a Fraterni Us.',
      fr: 'Pas encore ouverte. Elle commence par regarder ce qui ne dépend que de vous ; ensuite, elle assemble les trois pièces : l’infrastructure avec Let Be, le récit avec Recvid et la méthode avec Fraterni Us.',
      it: 'Non è ancora aperta. Comincia guardando cosa dipende solo da te; poi mette insieme i tre pezzi: l’infrastruttura con Let Be, il racconto con Recvid e il metodo con Fraterni Us.'
    }
  },

  /* La matriz. En el directorio no lleva ficha —su logotipo y su lema
     encierran a la familia—, pero tiene su pagina en proyectos, y ahi si se
     lee entera. */
  fraterni: {
    pregunta: {
      es: '¿Por qué mueren tantos proyectos buenos?',
      en: 'Why do so many good projects die?',
      pt: 'Porque é que morrem tantos bons projetos?',
      fr: 'Pourquoi tant de bons projets meurent-ils ?',
      it: 'Perché muoiono tanti buoni progetti?'
    },
    tacha: {
      es: ['Falta de dinero', 'Mala suerte', 'Falta de tiempo'],
      en: ['Lack of money', 'Bad luck', 'Lack of time'],
      pt: ['Falta de dinheiro', 'Azar', 'Falta de tempo'],
      fr: ['Le manque d’argent', 'La malchance', 'Le manque de temps'],
      it: ['Mancanza di soldi', 'Sfortuna', 'Mancanza di tempo']
    },
    pone: {
      es: 'Están solos.',
      en: 'They’re alone.',
      pt: 'Estão sozinhos.',
      fr: 'Ils sont seuls.',
      it: 'Sono soli.'
    },
    porque: {
      es: 'Un proyecto solo carga con todo: el nombre, las cuentas, los errores. Con hermanos, lo que aprende uno le sirve a los demás.',
      en: 'A project on its own carries everything: the name, the accounts, the mistakes. With siblings, what one learns serves the others.',
      pt: 'Um projeto sozinho carrega tudo: o nome, as contas, os erros. Com irmãos, o que um aprende serve aos outros.',
      fr: 'Un projet seul porte tout : le nom, les comptes, les erreurs. Avec des frères, ce que l’un apprend sert aux autres.',
      it: 'Un progetto da solo si carica tutto: il nome, i conti, gli errori. Con dei fratelli, ciò che impara uno serve agli altri.'
    },
    que: {
      es: 'Fraterni Ventures es la marca madre de la familia Fraterni.',
      en: 'Fraterni Ventures is the parent brand of the Fraterni family.',
      pt: 'A Fraterni Ventures é a marca-mãe da família Fraterni.',
      fr: 'Fraterni Ventures est la marque mère de la famille Fraterni.',
      it: 'Fraterni Ventures è il marchio madre della famiglia Fraterni.'
    },
    origen: {
      corta: {
        es: 'Fraterni viene de hermanos: existe para que ningún proyecto tenga que empezar solo.',
        en: 'Fraterni comes from brothers: it exists so that no project has to start alone.',
        pt: 'Fraterni vem de irmãos: existe para que nenhum projeto tenha de começar sozinho.',
        fr: 'Fraterni vient de frères : il existe pour qu’aucun projet n’ait à commencer seul.',
        it: 'Fraterni viene da fratelli: esiste perché nessun progetto debba iniziare da solo.'
      },
      /* La matriz no manda sobre las casas: las acompaña. Es el filtro del
         amor aplicado a una empresa madre. */
      larga: {
        es: 'La matriz no está para mandar sobre las casas, sino para que ninguna cargue sola.',
        en: 'The parent company isn’t there to rule over the houses, but so that none of them carries the load alone.',
        pt: 'A casa-mãe não está para mandar nas casas, mas para que nenhuma carregue sozinha.',
        fr: 'La maison mère n’est pas là pour commander les maisons, mais pour qu’aucune ne porte seule.',
        it: 'La casa madre non c’è per comandare sulle case, ma perché nessuna porti il peso da sola.'
      }
    },
    mision: {
      corta: {
        es: 'Crear proyectos que se ayuden entre ellos.',
        en: 'To create projects that help each other.',
        pt: 'Criar projetos que se ajudem entre si.',
        fr: 'Créer des projets qui s’entraident.',
        it: 'Creare progetti che si aiutino tra loro.'
      },
      larga: {
        es: 'Las casas comparten nombre, equipo y manera de trabajar. Lo que aprende una, le sirve a las otras.',
        en: 'The houses share a name, a team and a way of working. What one learns serves the others.',
        pt: 'As casas partilham nome, equipa e maneira de trabalhar. O que uma aprende serve às outras.',
        fr: 'Les maisons partagent un nom, une équipe et une façon de travailler. Ce que l’une apprend sert aux autres.',
        it: 'Le case condividono nome, squadra e modo di lavorare. Ciò che impara una serve alle altre.'
      }
    },
    vision: {
      corta: {
        es: 'Ser la marca de una familia de proyectos que duran.',
        en: 'To be the brand of a family of projects that last.',
        pt: 'Ser a marca de uma família de projetos que duram.',
        fr: 'Être la marque d’une famille de projets qui durent.',
        it: 'Essere il marchio di una famiglia di progetti che durano.'
      },
      larga: {
        es: 'Que cada proyecto nuevo nazca con hermanos en vez de solo.',
        en: 'For every new project to be born with siblings instead of alone.',
        pt: 'Que cada projeto novo nasça com irmãos em vez de sozinho.',
        fr: 'Que chaque nouveau projet naisse avec des frères plutôt que seul.',
        it: 'Che ogni nuovo progetto nasca con dei fratelli invece che da solo.'
      }
    },
    como: {
      es: 'Fraterni pone la estructura —el nombre, las cuentas, los acuerdos— para que cada casa se ocupe solo de su trabajo. Aquí se habla de sociedad, inversión y prensa; los encargos van por cada casa.',
      en: 'Fraterni provides the structure — the name, the accounts, the agreements — so each house can focus only on its work. This is the place for partnership, investment and press; commissions go through each house.',
      pt: 'A Fraterni põe a estrutura — o nome, as contas, os acordos — para que cada casa se ocupe só do seu trabalho. Aqui fala-se de sociedade, investimento e imprensa; as encomendas vão por cada casa.',
      fr: 'Fraterni apporte la structure — le nom, les comptes, les accords — pour que chaque maison ne s’occupe que de son travail. Ici, on parle d’association, d’investissement et de presse ; les commandes passent par chaque maison.',
      it: 'Fraterni mette la struttura — il nome, i conti, gli accordi — perché ogni casa si occupi solo del suo lavoro. Qui si parla di società, investimenti e stampa; gli incarichi passano da ogni casa.'
    }
  }
};

/* El directorio y la pagina de proyectos llaman a dos casas por nombres
   distintos: la startup es `fraterniu` en uno y `u` en el otro, y la matriz
   `ventures` y `fraterni`. El texto se escribe una vez y los dos lo leen. */
const ALIAS = { fraterniu: 'u', ventures: 'fraterni' };
export const propositoDe = (id) => PROPOSITO[ALIAS[id] ?? id] ?? null;
