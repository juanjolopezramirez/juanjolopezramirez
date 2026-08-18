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
    }
  };
