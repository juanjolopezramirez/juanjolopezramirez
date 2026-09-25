/* La cuarta lectura: ve mas hondo, leela con PaRDeS.

   Las tres lecturas de term-cards.js son la puerta de entrada — quien se
   queda en «Lo que es» no pierde nada. Esto es la habitacion de detras,
   para quien quiere seguir caminando. Por eso va al final del libro y
   nunca en lugar de las otras tres.

   Cuatro niveles clasicos de la lectura judia de la Escritura:

     peshat   lo literal: gramatica, raiz, cuantas veces aparece
     remez    el patron que ya esta dentro del texto
     derash   la ensenanza que se saca de el
     sod      lo mistico

   Entre remez y derash va LA PARE: la linea donde el suelo deja de ser
   comprobable y pasa a ser ofrecido. Cada nivel lleva su etiqueta
   —verificable, tradicion, especulativo o hueco honesto— porque una
   cuenta bien hecha no es por eso un hallazgo.

   Rhema y Agape son griegas: PaRDeS es una adaptacion para ellas, no su
   casa, y el libro lo dice (`greek: true`).

   Fuente: mini-libro «Four Words, Two Ways to Read Them», corregido
   contra los lexicos. Todos los valores numericos recalculados letra por
   letra: ahava 13, ejad 13, emet 441, met 440, agape 93. */

export const DEEP = {
  /* ---------------------------------------------------------- */
  ahava: {
    checked: true,
    peshat: {
      tag: 'verifiable',
      es: 'אַהֲבָה, de la raíz אהב, «amar». Aparece 40 veces en la Biblia hebrea, desde el amor humano (Jonatán por David, 1 Samuel 18:1) hasta el amor de pacto de Dios por Israel. No tiene nada de metáfora: es la palabra llana para decir amor.',
      en: 'אַהֲבָה, from the root אהב, “to love”. It appears 40 times in the Hebrew Bible, from human love (Jonathan for David, 1 Samuel 18:1) to God’s covenant love for Israel. Nothing metaphorical about it: it is the plain word for love.',
      pt: 'אַהֲבָה, da raiz אהב, «amar». Aparece 40 vezes na Bíblia hebraica, desde o amor humano (Jónatas por David, 1 Samuel 18:1) até ao amor de aliança de Deus por Israel. Não tem nada de metáfora: é a palavra simples para dizer amor.',
      fr: 'אַהֲבָה, de la racine אהב, « aimer ». Le mot apparaît 40 fois dans la Bible hébraïque, de l’amour humain (Jonathan pour David, 1 Samuel 18:1) à l’amour d’alliance de Dieu pour Israël. Rien de métaphorique : c’est le mot simple pour dire l’amour.',
      it: 'אַהֲבָה, dalla radice אהב, «amare». Compare 40 volte nella Bibbia ebraica, dall’amore umano (Gionata per Davide, 1 Samuele 18:1) all’amore di patto di Dio per Israele. Niente di metaforico: è la parola semplice per dire amore.'
    },
    remez: {
      tag: 'verifiable',
      es: 'Ahavá vale 13. Ejad, «uno» —la palabra que cierra el Shemá, la confesión central de Israel (Deuteronomio 6:4)— también vale 13. Un eco numérico entre dos de las palabras que más peso cargan en la Torá. La cuenta se puede rehacer; el patrón solo está ahí para que lo notes.',
      en: 'Ahavah is 13. Echad, “one” — the word that closes the Shema, Israel’s central confession (Deuteronomy 6:4) — is also 13. A numeric echo between two of the most load-bearing words in the Torah. Anyone can redo the sum; the pattern is only there to be noticed.',
      pt: 'Ahavá vale 13. Ejad, «um» — a palavra que fecha o Shemá, a confissão central de Israel (Deuteronómio 6:4) — também vale 13. Um eco numérico entre duas das palavras que mais peso carregam na Torá. A conta pode refazer-se; o padrão só está ali para que o notes.',
      fr: 'Ahava vaut 13. Ejad, « un » — le mot qui clôt le Shema, la confession centrale d’Israël (Deutéronome 6:4) — vaut aussi 13. Un écho numérique entre deux des mots qui portent le plus de poids dans la Torah. Le calcul se refait ; le motif est seulement là pour être remarqué.',
      it: 'Ahavà vale 13. Ejad, «uno» — la parola che chiude lo Shemà, la confessione centrale d’Israele (Deuteronomio 6:4) — vale anch’essa 13. Un’eco numerica tra due delle parole che portano più peso nella Torà. Il conto si può rifare; lo schema è lì solo per essere notato.'
    },
    derash: {
      tag: 'tradition',
      es: 'La tradición rabínica lee ahavá como acción, no como sentimiento: el amor al prójimo se vuelve deberes concretos —visitar al enfermo, consolar al que está de luto, tratar con honradez— porque el sentimiento solo no cumple el mandato.',
      en: 'Rabbinic tradition reads ahavah as action, not sentiment: love of neighbour becomes concrete duties — visiting the sick, comforting mourners, dealing honestly — because feeling alone does not fulfil the command.',
      pt: 'A tradição rabínica lê ahavá como ação, não como sentimento: o amor ao próximo torna-se deveres concretos — visitar o doente, consolar quem está de luto, agir com honestidade — porque o sentimento sozinho não cumpre o mandamento.',
      fr: 'La tradition rabbinique lit ahava comme une action, non comme un sentiment : l’amour du prochain devient des devoirs concrets — visiter le malade, consoler l’endeuillé, agir avec honnêteté — parce que le sentiment seul n’accomplit pas le commandement.',
      it: 'La tradizione rabbinica legge ahavà come azione, non come sentimento: l’amore del prossimo diventa doveri concreti — visitare il malato, consolare chi è in lutto, agire con onestà — perché il sentimento da solo non compie il comandamento.'
    },
    sod: {
      tag: 'speculative',
      es: '13 (ahavá) + 13 (ejad) = 26 = יהוה, el Nombre. Leído en devoción: el amor y la unidad juntos dan el Nombre mismo. La suma es correcta y cualquiera la repite; lo que significa es una lectura que se ofrece por su belleza, no una prueba de nada sobre el Nombre.',
      en: '13 (ahavah) + 13 (echad) = 26 = יהוה, the Name. Read devotionally: love and oneness together equal the Name itself. The sum is correct and anyone can repeat it; what it means is a reading offered for its beauty, not proof of anything about the Name.',
      pt: '13 (ahavá) + 13 (ejad) = 26 = יהוה, o Nome. Lido em devoção: o amor e a unidade juntos dão o próprio Nome. A soma é correta e qualquer um a repete; o que significa é uma leitura oferecida pela sua beleza, não uma prova de nada sobre o Nome.',
      fr: '13 (ahava) + 13 (ejad) = 26 = יהוה, le Nom. Lu dans la dévotion : l’amour et l’unité ensemble donnent le Nom lui-même. La somme est juste et chacun peut la refaire ; ce qu’elle signifie est une lecture offerte pour sa beauté, non une preuve de quoi que ce soit sur le Nom.',
      it: '13 (ahavà) + 13 (ejad) = 26 = יהוה, il Nome. Letto nella devozione: l’amore e l’unità insieme danno il Nome stesso. La somma è corretta e chiunque la può rifare; ciò che significa è una lettura offerta per la sua bellezza, non una prova di nulla sul Nome.'
    },
    sources: [
      'Brown, F., Driver, S. R., & Briggs, C. A. (1906). A Hebrew and English lexicon of the Old Testament. Clarendon Press. (Strong H157, H160)'
    ]
  },

  /* ---------------------------------------------------------- */
  rhema: {
    greek: true,
    peshat: {
      tag: 'verifiable',
      es: 'ῥῆμα: un enunciado, algo dicho. En la Septuaginta traduce a menudo el hebreo דָּבָר (davar, «palabra, cosa»). En el uso real se cruza mucho con λόγος: ese es el dato del léxico, no una nota al pie.',
      en: 'ῥῆμα: an utterance, a thing said. In the Septuagint it regularly renders Hebrew דָּבָר (davar, “word, thing”). In real usage it overlaps heavily with λόγος — that is the lexical fact, not a footnote to it.',
      pt: 'ῥῆμα: um enunciado, algo dito. Na Septuaginta traduz muitas vezes o hebraico דָּבָר (davar, «palavra, coisa»). No uso real cruza-se muito com λόγος: esse é o dado do léxico, não uma nota de rodapé.',
      fr: 'ῥῆμα : un énoncé, une chose dite. Dans la Septante, il rend souvent l’hébreu דָּבָר (davar, « parole, chose »). Dans l’usage réel, il recoupe largement λόγος : c’est le fait lexical, pas une note de bas de page.',
      it: 'ῥῆμα: un enunciato, una cosa detta. Nella Settanta rende spesso l’ebraico דָּבָר (davar, «parola, cosa»). Nell’uso reale si sovrappone molto a λόγος: è il dato del lessico, non una nota a piè di pagina.'
    },
    remez: {
      tag: 'verifiable',
      es: 'Rhema se junta alrededor de momentos de recibir y responder: oír (Romanos 10:17), recordar (Lucas 24:8, las mujeres «se acordaron de sus palabras»), ser probado y contestar con una (Mateo 4:4, «no solo de pan vivirá el hombre, sino de toda palabra que sale de la boca de Dios»). Cuando aparece rhema, algo se recibe y se actúa. El patrón se puede comprobar; el porqué ya es interpretación.',
      en: 'Rhema gathers around moments of receiving and responding: hearing (Romans 10:17), remembering (Luke 24:8, the women “remembered his words”), being tested and answering with one (Matthew 4:4, “man shall not live by bread alone, but by every word that proceeds from the mouth of God”). When rhema appears, something is received and acted on. The pattern can be checked; the why is interpretation.',
      pt: 'Rhema junta-se à volta de momentos de receber e responder: ouvir (Romanos 10:17), lembrar (Lucas 24:8, as mulheres «lembraram-se das suas palavras»), ser provado e responder com uma (Mateus 4:4, «nem só de pão viverá o homem, mas de toda a palavra que sai da boca de Deus»). Quando aparece rhema, algo se recebe e se põe em prática. O padrão pode comprovar-se; o porquê já é interpretação.',
      fr: 'Rhèma se rassemble autour de moments où l’on reçoit et où l’on répond : entendre (Romains 10:17), se souvenir (Luc 24:8, les femmes « se souvinrent de ses paroles »), être éprouvé et répondre par une parole (Matthieu 4:4, « l’homme ne vivra pas de pain seulement, mais de toute parole qui sort de la bouche de Dieu »). Quand rhèma apparaît, quelque chose est reçu et mis en acte. Le motif se vérifie ; le pourquoi relève de l’interprétation.',
      it: 'Rhema si raccoglie attorno a momenti di ricevere e rispondere: ascoltare (Romani 10:17), ricordare (Luca 24:8, le donne «si ricordarono delle sue parole»), essere messi alla prova e rispondere con una parola (Matteo 4:4, «non di solo pane vivrà l’uomo, ma di ogni parola che esce dalla bocca di Dio»). Quando compare rhema, qualcosa viene ricevuto e messo in pratica. Lo schema si può verificare; il perché è già interpretazione.'
    },
    derash: {
      tag: 'tradition',
      es: 'Aquí es donde pertenece la lectura popular de «una palabra personal para ti». Como aplicación devocional —no como léxico— es una práctica antigua y válida: leer la Escritura buscando la línea que habla a tu momento presente. Archivada como Peshat, dice demasiado; archivada aquí, es justo para lo que sirve este nivel.',
      en: 'This is where the popular “personal word for you” belongs. As devotional application — not as lexicography — it is an old and valid practice: reading Scripture for the line that speaks into your present moment. Filed as Peshat, it claims too much; filed here, it is exactly what this level is for.',
      pt: 'É aqui que pertence a leitura popular de «uma palavra pessoal para ti». Como aplicação devocional — não como léxico — é uma prática antiga e válida: ler a Escritura à procura da linha que fala ao teu momento presente. Arquivada como Peshat, diz demasiado; arquivada aqui, é exatamente aquilo para que serve este nível.',
      fr: 'C’est ici que se range la lecture populaire de « la parole personnelle pour vous ». Comme application dévotionnelle — non comme lexicographie — c’est une pratique ancienne et valable : lire l’Écriture en cherchant la ligne qui parle à votre moment présent. Classée en Peshat, elle en dit trop ; classée ici, c’est exactement ce à quoi sert ce niveau.',
      it: 'È qui che appartiene la lettura popolare della «parola personale per te». Come applicazione devozionale — non come lessico — è una pratica antica e valida: leggere la Scrittura cercando la riga che parla al tuo momento presente. Archiviata come Peshat, dice troppo; archiviata qui, è esattamente ciò a cui serve questo livello.'
    },
    sod: {
      tag: 'gap',
      es: 'Con honestidad: aquí hay poco. No existe una tradición mística asentada alrededor de rhema como la que hay para las palabras hebreas de este libro; la isopsefía griega es una práctica más pequeña y más tardía que la guematría hebrea. En vez de forzar una lectura que no está, este nivel se queda abierto.',
      en: 'Honestly, thin. There is no established mystical tradition around rhema like the one around the Hebrew words in this book; Greek isopsephy is a smaller, later body of practice than Hebrew gematria. Rather than force a reading that is not there, this level stays open.',
      pt: 'Com honestidade: aqui há pouco. Não existe uma tradição mística assente à volta de rhema como a que há para as palavras hebraicas deste livro; a isopsefia grega é uma prática mais pequena e mais tardia do que a guematria hebraica. Em vez de forçar uma leitura que não existe, este nível fica em aberto.',
      fr: 'Honnêtement, il y a peu. Il n’existe pas de tradition mystique établie autour de rhèma comme celle des mots hébreux de ce livre ; l’isopséphie grecque est une pratique plus restreinte et plus tardive que la guématrie hébraïque. Plutôt que de forcer une lecture qui n’existe pas, ce niveau reste ouvert.',
      it: 'Onestamente, qui c’è poco. Non esiste una tradizione mistica consolidata attorno a rhema come quella delle parole ebraiche di questo libro; l’isopsefia greca è una pratica più piccola e più tarda della ghematria ebraica. Invece di forzare una lettura che non c’è, questo livello resta aperto.'
    },
    sources: [
      'Bauer, W., Danker, F. W., Arndt, W. F., & Gingrich, F. W. (2000). A Greek-English lexicon of the New Testament and other early Christian literature (3rd ed.). University of Chicago Press. (Strong G4487)',
      'Carson, D. A. (1996). Exegetical fallacies (2nd ed.). Baker Academic.'
    ]
  },

  /* ---------------------------------------------------------- */
  emet: {
    checked: true,
    peshat: {
      tag: 'verifiable',
      es: 'אֱמֶת: firmeza, fidelidad, verdad. Raíz אמן, «ser firme, sostener»: la misma de amén, «así sea, queda firme». En esta palabra la verdad es algo que aguanta peso, no solo algo exacto.',
      en: 'אֱמֶת: firmness, faithfulness, truth. Root אמן, “to be firm, to support” — the same as amen, “so be it, it stands”. In this word, truth is something that bears weight, not only something accurate.',
      pt: 'אֱמֶת: firmeza, fidelidade, verdade. Raiz אמן, «ser firme, sustentar»: a mesma de ámen, «assim seja, fica firme». Nesta palavra a verdade é algo que aguenta peso, não só algo exato.',
      fr: 'אֱמֶת : fermeté, fidélité, vérité. Racine אמן, « être ferme, soutenir » — la même qu’amen, « ainsi soit-il, c’est établi ». Dans ce mot, la vérité est quelque chose qui porte du poids, pas seulement quelque chose d’exact.',
      it: 'אֱמֶת: fermezza, fedeltà, verità. Radice אמן, «essere saldo, sostenere»: la stessa di amen, «così sia, è stabilito». In questa parola la verità è qualcosa che regge un peso, non solo qualcosa di esatto.'
    },
    remez: {
      tag: 'verifiable',
      es: 'Álef es la letra 1 de 22; Mem, la 13, la más cercana al centro de las tres «letras madre»; Tav, la 22, la última. Principio, medio y final, escritos con el principio, el medio y el final del propio alfabeto. Comprobado posición por posición.',
      en: 'Alef is letter 1 of 22; Mem is the 13th, the closest of the three “mother letters” to the centre; Tav is the 22nd, the last. Beginning, middle and end, spelled with the beginning, middle and end of the alphabet itself. Checked position by position.',
      pt: 'Álef é a letra 1 de 22; Mem, a 13.ª, a mais próxima do centro das três «letras mães»; Tav, a 22.ª, a última. Princípio, meio e fim, escritos com o princípio, o meio e o fim do próprio alfabeto. Comprovado posição a posição.',
      fr: 'Alef est la lettre 1 sur 22 ; Mem la 13e, la plus proche du centre parmi les trois « lettres mères » ; Tav la 22e, la dernière. Début, milieu et fin, écrits avec le début, le milieu et la fin de l’alphabet lui-même. Vérifié position par position.',
      it: 'Alef è la lettera 1 di 22; Mem la 13ª, la più vicina al centro tra le tre «lettere madri»; Tav la 22ª, l’ultima. Principio, mezzo e fine, scritti con il principio, il mezzo e la fine dell’alfabeto stesso. Verificato posizione per posizione.'
    },
    derash: {
      tag: 'tradition',
      es: 'Dos enseñanzas, las dos con juego de palabras. Álef-mem-tav como «la verdad abarca del principio al fin»: una lección sobre la integridad en el tiempo, no una afirmación sobre el origen de la palabra. Y emet (441) menos álef (1) da met (440), «muerto»: la verdad separada de su origen se derrumba en muerte.',
      en: 'Two teachings, both wordplay. Alef-mem-tav as “truth spans beginning to end”: a lesson about integrity over time, not a claim about where the word comes from. And emet (441) minus alef (1) is met (440), “dead”: truth cut off from its origin collapses into death.',
      pt: 'Dois ensinamentos, ambos com jogo de palavras. Álef-mem-tav como «a verdade abrange do princípio ao fim»: uma lição sobre a integridade no tempo, não uma afirmação sobre a origem da palavra. E emet (441) menos álef (1) dá met (440), «morto»: a verdade separada da sua origem desmorona-se em morte.',
      fr: 'Deux enseignements, tous deux fondés sur un jeu de mots. Alef-mem-tav comme « la vérité va du début à la fin » : une leçon sur l’intégrité dans le temps, non une affirmation sur l’origine du mot. Et emet (441) moins alef (1) donne met (440), « mort » : la vérité coupée de son origine s’effondre dans la mort.',
      it: 'Due insegnamenti, entrambi giochi di parole. Alef-mem-tav come «la verità va dal principio alla fine»: una lezione sull’integrità nel tempo, non un’affermazione sull’origine della parola. Ed emet (441) meno alef (1) dà met (440), «morto»: la verità separata dalla sua origine crolla nella morte.'
    },
    sod: {
      tag: 'tradition',
      es: 'El Talmud lo dice directamente: «el sello del Santo, bendito sea, es emet» (Shabat 55a; Yomá 69b). La verdad como la firma de Dios sobre la realidad, no solo una virtud humana. Es la rara de las cuatro: una frase del propio Talmud y no una glosa mística posterior. Sigue siendo tradición, pero temprana y central.',
      en: 'The Talmud says it directly: “the seal of the Holy One, blessed be He, is emet” (Shabbat 55a; Yoma 69b). Truth as God’s own signature on reality, not only a human virtue. The odd one of the four: a direct Talmudic statement, not a later mystical gloss. Still tradition, but early and central.',
      pt: 'O Talmude di-lo diretamente: «o selo do Santo, bendito seja, é emet» (Shabat 55a; Yomá 69b). A verdade como a assinatura de Deus sobre a realidade, não só uma virtude humana. É a diferente das quatro: uma frase do próprio Talmude e não uma glosa mística posterior. Continua a ser tradição, mas antiga e central.',
      fr: 'Le Talmud le dit directement : « le sceau du Saint, béni soit-Il, est emet » (Shabbat 55a ; Yoma 69b). La vérité comme signature de Dieu sur le réel, pas seulement une vertu humaine. C’est l’exception des quatre : une phrase du Talmud lui-même, non une glose mystique plus tardive. Cela reste de la tradition, mais ancienne et centrale.',
      it: 'Il Talmud lo dice direttamente: «il sigillo del Santo, benedetto Egli sia, è emet» (Shabbat 55a; Yomà 69b). La verità come firma di Dio sulla realtà, non solo una virtù umana. È l’eccezione tra le quattro: una frase del Talmud stesso e non una glossa mistica successiva. Resta tradizione, ma antica e centrale.'
    },
    sources: [
      'Brown, F., Driver, S. R., & Briggs, C. A. (1906). A Hebrew and English lexicon of the Old Testament. Clarendon Press. (Strong H571)',
      'Talmud Bavli, Shabbat 55a; Yoma 69b.'
    ]
  },

  /* ---------------------------------------------------------- */
  agape: {
    greek: true,
    checked: true,
    peshat: {
      tag: 'verifiable',
      es: 'ἀγάπη: amor como voluntad y benevolencia, distinto de eros (el deseo) y de philía (la amistad entre iguales). Se traduce «amor» 86 veces en la King James, casi siempre en contextos de don, sacrificio y mandato.',
      en: 'ἀγάπη: love as will and goodwill, distinct from eros (desire) and philia (friendship between equals). Translated “love” 86 times in the King James, gathered in contexts of gift, sacrifice and command.',
      pt: 'ἀγάπη: amor como vontade e benevolência, distinto de eros (o desejo) e de philía (a amizade entre iguais). Traduz-se «amor» 86 vezes na King James, quase sempre em contextos de dom, sacrifício e mandamento.',
      fr: 'ἀγάπη : l’amour comme volonté et bienveillance, distinct d’eros (le désir) et de philia (l’amitié entre égaux). Traduit « amour » 86 fois dans la King James, surtout dans des contextes de don, de sacrifice et de commandement.',
      it: 'ἀγάπη: amore come volontà e benevolenza, distinto da eros (il desiderio) e da philia (l’amicizia tra pari). Tradotto «amore» 86 volte nella King James, quasi sempre in contesti di dono, sacrificio e comandamento.'
    },
    remez: {
      tag: 'verifiable',
      es: 'El patrón es el reparto mismo: agapē en todas partes, eros en ninguna. El Nuevo Testamento tenía eros a mano en el griego de su tiempo y no lo usó ni una vez: un silencio tan deliberado como una palabra elegida. Es un recuento, no una interpretación.',
      en: 'The distribution is the pattern: agapē everywhere, eros nowhere. The New Testament had eros at hand in the Greek of its time and did not use it once — a silence as deliberate as a chosen word. A count, not an interpretation.',
      pt: 'O padrão é a própria distribuição: agapē por todo o lado, eros em lado nenhum. O Novo Testamento tinha eros à mão no grego do seu tempo e não o usou uma única vez: um silêncio tão deliberado como uma palavra escolhida. É uma contagem, não uma interpretação.',
      fr: 'Le motif, c’est la répartition elle-même : agapē partout, eros nulle part. Le Nouveau Testament avait eros sous la main dans le grec de son temps et ne l’a pas employé une seule fois — un silence aussi délibéré qu’un mot choisi. Un décompte, pas une interprétation.',
      it: 'Lo schema è la distribuzione stessa: agapē ovunque, eros da nessuna parte. Il Nuovo Testamento aveva eros a portata di mano nel greco del suo tempo e non lo usò neppure una volta: un silenzio deliberato quanto una parola scelta. Un conteggio, non un’interpretazione.'
    },
    derash: {
      tag: 'tradition',
      es: '1 Corintios 13 define agapē entero por lo que hace, no por lo que siente: es paciente, es bondadoso, no busca lo suyo, no guarda rencor. Es la lectura más influyente de esta palabra en la tradición cristiana, y habla de conducta, no de emoción.',
      en: '1 Corinthians 13 defines agapē entirely by what it does, not by what it feels: patient, kind, not self-seeking, keeps no record of wrongs. The most influential reading of this word in the Christian tradition — and it is about behaviour, not emotion.',
      pt: '1 Coríntios 13 define agapē inteiramente pelo que faz, não pelo que sente: é paciente, é bondoso, não procura os seus interesses, não guarda rancor. É a leitura mais influente desta palavra na tradição cristã, e fala de conduta, não de emoção.',
      fr: '1 Corinthiens 13 définit agapē entièrement par ce qu’il fait, non par ce qu’il ressent : patient, bon, ne cherchant pas son intérêt, ne tenant pas compte du mal. La lecture la plus influente de ce mot dans la tradition chrétienne — et elle parle de conduite, pas d’émotion.',
      it: '1 Corinzi 13 definisce agapē interamente per ciò che fa, non per ciò che sente: è paziente, è benevolo, non cerca il proprio interesse, non tiene conto del male ricevuto. È la lettura più influente di questa parola nella tradizione cristiana, e parla di condotta, non di emozione.'
    },
    sod: {
      tag: 'speculative',
      es: 'Isopsefía: ἀγάπη = 93, comprobado letra por letra. Una lectura muy compartida reduce 93 sumando sus cifras —9 + 3 = 12, 1 + 2 = 3— y ve ahí la Trinidad. Dicho con claridad: ningún isopsefista antiguo reducía así los números; es numerología moderna aplicada a un método antiguo. Lo verificable es 93. Lo demás, si se ofrece, es por su belleza y nunca como prueba.',
      en: 'Isopsephy: ἀγάπη = 93, checked letter by letter. A widely shared reading reduces 93 by adding its digits — 9 + 3 = 12, 1 + 2 = 3 — and sees the Trinity there. Said plainly: no ancient isopsephist reduced numbers this way; it is modern numerology applied to an ancient method. What can be verified is 93. The rest, if offered at all, is for its beauty and never as proof.',
      pt: 'Isopsefia: ἀγάπη = 93, comprovado letra a letra. Uma leitura muito partilhada reduz 93 somando os seus algarismos — 9 + 3 = 12, 1 + 2 = 3 — e vê ali a Trindade. Dito com clareza: nenhum isopsefista antigo reduzia assim os números; é numerologia moderna aplicada a um método antigo. O verificável é 93. O resto, se for oferecido, é pela sua beleza e nunca como prova.',
      fr: 'Isopséphie : ἀγάπη = 93, vérifié lettre par lettre. Une lecture très répandue réduit 93 en additionnant ses chiffres — 9 + 3 = 12, 1 + 2 = 3 — et y voit la Trinité. Disons-le clairement : aucun isopséphiste antique ne réduisait ainsi les nombres ; c’est de la numérologie moderne appliquée à une méthode ancienne. Ce qui se vérifie, c’est 93. Le reste, s’il est offert, l’est pour sa beauté et jamais comme preuve.',
      it: 'Isopsefia: ἀγάπη = 93, verificato lettera per lettera. Una lettura molto diffusa riduce 93 sommandone le cifre — 9 + 3 = 12, 1 + 2 = 3 — e vi vede la Trinità. Detto chiaramente: nessun isopsefista antico riduceva così i numeri; è numerologia moderna applicata a un metodo antico. Ciò che si verifica è 93. Il resto, se offerto, lo è per la sua bellezza e mai come prova.'
    },
    sources: [
      'Bauer, W., Danker, F. W., Arndt, W. F., & Gingrich, F. W. (2000). A Greek-English lexicon of the New Testament and other early Christian literature (3rd ed.). University of Chicago Press. (Strong G26)'
    ]
  }
};
