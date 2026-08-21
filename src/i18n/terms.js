/* Glosario: hebreo y griego. Definicion, alfabeto original y fuente APA. */

export const TERMS = {

    /* ---------------------------------------------------------- */
    ahava: {
      script:   'אַהֲבָה',          // written right to left
      dir:      'rtl',
      language: { es: 'Hebreo bíblico', en: 'Biblical Hebrew', pt: 'Hebraico bíblico', fr: 'Hébreu biblique', it: 'Ebraico biblico' },
      title:    { es: 'Ahavá', en: 'Ahavah', pt: 'Ahavá', fr: 'Ahava', it: 'Ahavà' },
      forms:    ['ahavá', 'ahavah', 'ahavà', 'ahava'],
      def: {
        es: 'Amor. No nombra un sentimiento que ocurre, sino una decisión que se toma: querer el bien del otro antes de sentirlo. Su valor numérico es 13, el mismo de ejad, «uno».',
        en: 'Love. It names not a feeling that happens but a decision that is made: willing the good of the other before feeling it. Its numerical value is 13, the same as echad, “one”.',
        pt: 'Amor. Não nomeia um sentimento que acontece, mas uma decisão que se toma: querer o bem do outro antes de senti-lo. Seu valor numérico é 13, o mesmo de ejad, «um».',
        it: 'Amore. Non indica un sentimento che accade, ma una decisione che si prende: volere il bene dell’altro prima di sentirlo. Il suo valore numerico è 13, lo stesso di ejad, «uno».',
        fr: 'Amour. Il ne nomme pas un sentiment qui arrive, mais une décision que l’on prend : vouloir le bien de l’autre avant de le ressentir. Sa valeur numérique est 13, la même qu’ejad, « un ».'
      },
      source: 'Brown, F., Driver, S. R., & Briggs, C. A. (1906). A Hebrew and English lexicon of the Old Testament. Clarendon Press. (Strong H160)'
    },

    /* ---------------------------------------------------------- */
    emet: {
      script:   'אֱמֶת',
      dir:      'rtl',
      language: { es: 'Hebreo bíblico', en: 'Biblical Hebrew', pt: 'Hebraico bíblico', fr: 'Hébreu biblique', it: 'Ebraico biblico' },
      title:    { es: 'Emet', en: 'Emet', pt: 'Emet', fr: 'Emet', it: 'Emet' },
      forms:    ['emet'],
      def: {
        es: 'Verdad. Se escribe con la primera, la del medio y la última letra del alfabeto hebreo: principio, proceso y final. Si se le quita la primera (א, álef) queda met: muerto.',
        en: 'Truth. Written with the first, middle and last letters of the Hebrew alphabet: beginning, process and end. Remove the first (א, alef) and met remains: dead.',
        pt: 'Verdade. Escreve-se com a primeira, a do meio e a última letra do alfabeto hebraico: princípio, processo e fim. Se tirar a primeira (א, álef), resta met: morto.',
        it: 'Verità. Si scrive con la prima, la centrale e l’ultima lettera dell’alfabeto ebraico: principio, processo e fine. Togliendo la prima (א, alef) resta met: morto.',
        fr: 'Vérité. Elle s’écrit avec la première, la médiane et la dernière lettre de l’alphabet hébreu : début, processus et fin. Ôtez la première (א, alef) et il reste met : mort.'
      },
      source: 'Brown, F., Driver, S. R., & Briggs, C. A. (1906). A Hebrew and English lexicon of the Old Testament. Clarendon Press. (Strong H571)'
    },

    /* ---------------------------------------------------------- */
    agape: {
      script:   'ἀγάπη',
      dir:      'ltr',
      language: { es: 'Griego del Nuevo Testamento', en: 'New Testament Greek', pt: 'Grego do Novo Testamento', fr: 'Grec du Nouveau Testament', it: 'Greco del Nuovo Testamento' },
      title:    { es: 'Ágape', en: 'Agape', pt: 'Ágape', fr: 'Agapè', it: 'Agape' },
      forms:    ['ágape', 'agapè', 'agape'],
      def: {
        es: 'Amor que decide y da sin esperar retorno. Aparece más de 300 veces en el Nuevo Testamento; eros, ninguna.',
        en: 'Love that decides and gives without expecting return. It appears more than 300 times in the New Testament; eros, not once.',
        pt: 'Amor que decide e dá sem esperar retorno. Aparece mais de 300 vezes no Novo Testamento; eros, nenhuma.',
        it: 'Amore che decide e dona senza attendere ritorno. Compare più di 300 volte nel Nuovo Testamento; eros, nessuna.',
        fr: 'Amour qui décide et donne sans attendre de retour. Il apparaît plus de 300 fois dans le Nouveau Testament ; eros, pas une seule.'
      },
      source: 'Bauer, W., Danker, F. W., Arndt, W. F., & Gingrich, F. W. (2000). A Greek-English lexicon of the New Testament and other early Christian literature (3rd ed.). University of Chicago Press. (Strong G26)'
},

    /* ---------------------------------------------------------- */
    rhema: {
      script:   'ῥῆμα',
      dir:      'ltr',
      language: { es: 'Griego del Nuevo Testamento', en: 'New Testament Greek', pt: 'Grego do Novo Testamento', fr: 'Grec du Nouveau Testament', it: 'Greco del Nuovo Testamento' },
      title:    { es: 'Rhema', en: 'Rhema', pt: 'Rhema', fr: 'Rhèma', it: 'Rhema' },
      forms:    ['rhema', 'rhēma', 'rhèma'],
      def: {
        es: 'La palabra dicha. Frente a logos —la Palabra entera, el mensaje— rhema es la que se pronuncia en un momento concreto, para alguien concreto. No es una frase que se elige: es una que se recibe, y después se carga.',
        en: 'The spoken word. Against logos — the whole Word, the message — rhema is the one uttered at a particular moment, to a particular person. Not a phrase you choose: one you receive, and then carry.',
        pt: 'A palavra dita. Diante de logos — a Palavra inteira, a mensagem — rhema é a que se pronuncia num momento concreto, para alguém concreto. Não é uma frase que se escolhe: é uma que se recebe, e depois se carrega.',
        it: 'La parola detta. Rispetto a logos — la Parola intera, il messaggio — rhema è quella pronunciata in un momento preciso, per qualcuno preciso. Non è una frase che si sceglie: è una che si riceve, e poi si porta.',
        fr: 'La parole dite. Face à logos — la Parole entière, le message — rhèma est celle qui se prononce à un moment précis, pour quelqu’un de précis. Non une phrase que l’on choisit : une que l’on reçoit, et que l’on porte ensuite.'
      },
      source: 'Bauer, W., Danker, F. W., Arndt, W. F., & Gingrich, F. W. (2000). A Greek-English lexicon of the New Testament and other early Christian literature (3rd ed.). University of Chicago Press. (Strong G4487)'
    },
    /* ---------------------------------------------------------- */
    /* No es una palabra, es un nombre — pero se explica igual: quien lee
       "el espiritu de Timoteo" y no sabe quien fue, no tiene por que */
    timoteo: {
      script:   'Τιμόθεος',
      dir:      'ltr',
      language: { es: 'Griego del Nuevo Testamento', en: 'New Testament Greek', pt: 'Grego do Novo Testamento', fr: 'Grec du Nouveau Testament', it: 'Greco del Nuovo Testamento' },
      title:    { es: 'Timoteo', en: 'Timothy', pt: 'Timóteo', fr: 'Timothée', it: 'Timoteo' },
      forms:    ['timoteo', 'timóteo', 'timothy', 'timothée'],

      /* Este termino no se explica en una frase como los demas: lleva su
         propio titulo, un segundo bloque y un acordeon. Los campos son
         opcionales — el resto del glosario no los tiene y el panel los
         salta sin enterarse. */
      defTitle: {
        es: '¿Quién fue Timoteo?',
        en: 'Who was Timothy?',
        pt: 'Quem foi Timóteo?',
        fr: 'Qui était Timothée ?',
        it: 'Chi era Timoteo?'
      },
      def: {
        es: 'Un joven líder y colaborador de confianza del apóstol Pablo, reconocido por su carácter probado, su lealtad y su capacidad para resguardar la esencia de un mensaje sin buscar el protagonismo personal ni dejarse mover por el entorno.',
        en: 'A young leader and trusted co-worker of the apostle Paul, known for his proven character, his loyalty, and his ability to guard the essence of a message without seeking the spotlight or being swayed by his surroundings.',
        pt: 'Um jovem líder e colaborador de confiança do apóstolo Paulo, reconhecido pelo seu carácter provado, pela sua lealdade e pela sua capacidade de resguardar a essência de uma mensagem sem procurar protagonismo pessoal nem se deixar mover pelo ambiente.',
        fr: 'Un jeune dirigeant et collaborateur de confiance de l’apôtre Paul, reconnu pour son caractère éprouvé, sa loyauté et sa capacité à préserver l’essence d’un message sans chercher les projecteurs ni se laisser emporter par son entourage.',
        it: 'Un giovane leader e collaboratore di fiducia dell’apostolo Paolo, riconosciuto per il suo carattere provato, la sua lealtà e la sua capacità di custodire l’essenza di un messaggio senza cercare il protagonismo personale né lasciarsi muovere dall’ambiente.'
      },

      sections: [{
        title: {
          es: 'Contar historias con su espíritu',
          en: 'Telling stories with his spirit',
          pt: 'Contar histórias com o seu espírito',
          fr: 'Raconter des histoires avec son esprit',
          it: 'Raccontare storie con il suo spirito'
        },
        body: {
          es: 'Es comunicar desde la custodia del origen. Significa construir narrativas con intención trascendente, donde el diseño y el audiovisual no buscan el aplauso efímero ni la manipulación comercial, sino revelar la verdad de un proyecto con audacia, sentido de servicio y criterio impecable.',
          en: 'It means communicating as a custodian of the origin. Building narratives with lasting intent, where design and film chase neither fleeting applause nor commercial manipulation, but reveal the truth of a project with boldness, a sense of service, and impeccable judgement.',
          pt: 'É comunicar a partir da custódia da origem. Significa construir narrativas com intenção transcendente, onde o design e o audiovisual não procuram o aplauso efémero nem a manipulação comercial, mas revelar a verdade de um projeto com audácia, sentido de serviço e critério impecável.',
          fr: 'C’est communiquer en gardien de l’origine. Bâtir des récits à l’intention durable, où le design et l’audiovisuel ne cherchent ni l’applaudissement éphémère ni la manipulation commerciale, mais révèlent la vérité d’un projet avec audace, sens du service et jugement impeccable.',
          it: 'È comunicare come custode dell’origine. Costruire narrazioni con intenzione duratura, dove il design e l’audiovisivo non cercano l’applauso effimero né la manipolazione commerciale, ma rivelano la verità di un progetto con audacia, senso del servizio e criterio impeccabile.'
        }
      }],

      pillars: {
        title: {
          es: 'Los tres pilares (2 Timoteo 1:7)',
          en: 'The three pillars (2 Timothy 1:7)',
          pt: 'Os três pilares (2 Timóteo 1:7)',
          fr: 'Les trois piliers (2 Timothée 1:7)',
          it: 'I tre pilastri (2 Timoteo 1:7)'
        },
        items: [
          {
            n: '01',
            label: { es: 'Poder — Audacia', en: 'Power — Boldness', pt: 'Poder — Audácia', fr: 'Puissance — Audace', it: 'Potenza — Audacia' },
            body: {
              es: 'Crear con carácter y firmeza. Proponer estrategias valientes que asumen riesgos calculados, evitando soluciones tibias o genéricas.',
              en: 'Creating with character and firmness. Proposing brave strategies that take calculated risks, avoiding lukewarm or generic solutions.',
              pt: 'Criar com carácter e firmeza. Propor estratégias corajosas que assumem riscos calculados, evitando soluções mornas ou genéricas.',
              fr: 'Créer avec caractère et fermeté. Proposer des stratégies courageuses qui prennent des risques calculés, en évitant les solutions tièdes ou génériques.',
              it: 'Creare con carattere e fermezza. Proporre strategie coraggiose che assumono rischi calcolati, evitando soluzioni tiepide o generiche.'
            }
          },
          {
            n: '02',
            label: { es: 'Amor — Intención', en: 'Love — Intent', pt: 'Amor — Intenção', fr: 'Amour — Intention', it: 'Amore — Intenzione' },
            body: {
              es: 'Poner el propósito y el impacto humano en el centro. Trabajar para construir el valor real del cliente, no para alimentar el ego del creador.',
              en: 'Putting purpose and human impact at the centre. Working to build the client’s real value, not to feed the maker’s ego.',
              pt: 'Colocar o propósito e o impacto humano no centro. Trabalhar para construir o valor real do cliente, não para alimentar o ego do criador.',
              fr: 'Mettre le propos et l’impact humain au centre. Travailler à bâtir la valeur réelle du client, non à nourrir l’ego du créateur.',
              it: 'Mettere il proposito e l’impatto umano al centro. Lavorare per costruire il valore reale del cliente, non per alimentare l’ego del creatore.'
            }
          },
          {
            n: '03',
            label: { es: 'Dominio propio — Rigor', en: 'Self-control — Rigour', pt: 'Domínio próprio — Rigor', fr: 'Maîtrise de soi — Rigueur', it: 'Padronanza di sé — Rigore' },
            body: {
              es: 'Diseñar con disciplina, cabeza fría y filtro. Mantener el orden visual y la coherencia técnica sin dejarse arrastrar por modas pasajeras.',
              en: 'Designing with discipline, a cool head and a filter. Holding visual order and technical coherence without being dragged along by passing trends.',
              pt: 'Desenhar com disciplina, cabeça fria e filtro. Manter a ordem visual e a coerência técnica sem se deixar arrastar por modas passageiras.',
              fr: 'Concevoir avec discipline, sang-froid et filtre. Tenir l’ordre visuel et la cohérence technique sans se laisser entraîner par les modes passagères.',
              it: 'Progettare con disciplina, testa fredda e filtro. Mantenere l’ordine visivo e la coerenza tecnica senza farsi trascinare dalle mode passeggere.'
            }
          }
        ]
      }
    }
  };
