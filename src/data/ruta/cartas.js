/* LA BARAJA. Cada carta es un par, y el par es el juego entero.

   IZQUIERDA — lo que quiero. Escrito como lo diria quien tiene el negocio a
   las once de la noche, no como lo escribiria un consultor. «Estoy cansado
   de hacerlo todo yo» y no «optimizacion de la carga operativa».

   DERECHA — de que depende. Empieza boca abajo y se voltea al elegir. Dice
   en una frase concreta que hace falta para que ese deseo se cumpla. Ahi
   esta el juego: ver la distancia entre lo que uno quiere y lo que eso pide.

   LOS DOS CAMPOS QUE HACEN LA CUENTA:

     quiere   el paso donde vive el deseo si se lee tal cual.
     depende  el paso donde vive lo que hace falta de verdad.

   Iguales, la carta CONFIRMA: lo que pides es justo lo que te sirve.

   LA REGLA ANTITRUCO, y no es un detalle de tono: siete de las quince
   cartas de cada rama confirman. Un sistema que siempre contesta «en
   realidad te falta otra cosa» se descubre a la primera y tira abajo la
   credibilidad de todo lo demas. Si alguien pide un chatbot y ya tiene
   mensajes repetidos y una respuesta definida para cada uno, la carta
   derecha dice que si. Al añadir cartas, mantener la proporcion por encima
   de un tercio.

   `quiere` POR DEBAJO de `depende` tambien existe y no es Met: es pedir algo
   cuyo requisito esta mas adelante. No cuenta como ir adelantado.

   EL ESPAÑOL ES EL ORIGINAL. Los otros cuatro idiomas son traduccion de
   este, asi que al cambiar una carta hay que cambiar las cinco. */

const r = (ronda, pregunta, cartas) => ({ ronda, pregunta, cartas });

export const BARAJA = {
  /* ============================================================
     RAMA EMPRESA — la usan «por mi negocio» y «por mi marca personal».
     La marca personal cambia la voz del resultado, no las cartas: un
     deseo se dice igual lo firme una empresa o una persona con nombre.
     ============================================================ */
  empresa: [
    r(1, {
      es: '¿Qué es lo que más te pesa hoy?',
      en: 'What weighs on you most today?',
      pt: 'O que é que mais te pesa hoje?',
      fr: 'Qu’est-ce qui te pèse le plus aujourd’hui ?',
      it: 'Cos’è che ti pesa di più oggi?'
    }, [
      {
        id: 'e-conocer', quiere: 'alef', depende: 'alef',
        deseo: {
          es: 'Quiero que me conozcan más.',
          en: 'I want more people to know me.',
          pt: 'Quero que me conheçam mais.',
          fr: 'Je veux qu’on me connaisse davantage.',
          it: 'Voglio che mi conoscano di più.'
        },
        dependeDe: {
          es: 'De poder decir en una frase qué haces distinto. Sin eso, más gente mirando solo reparte confusión.',
          en: 'On being able to say in one sentence what you do differently. Without that, more eyes only spread confusion.',
          pt: 'De poderes dizer numa frase o que fazes de diferente. Sem isso, mais gente a olhar só reparte confusão.',
          fr: 'De pouvoir dire en une phrase ce que tu fais de différent. Sans ça, plus de regards ne font que répandre la confusion.',
          it: 'Dal poter dire in una frase cosa fai di diverso. Senza questo, più occhi addosso distribuiscono solo confusione.'
        }
      },
      {
        id: 'e-solo', quiere: 'tav', depende: 'mem',
        deseo: {
          es: 'Estoy cansado de hacerlo todo yo.',
          en: 'I am tired of doing everything myself.',
          pt: 'Estou cansado de fazer tudo eu.',
          fr: 'Je suis fatigué de tout faire moi-même.',
          it: 'Sono stanco di fare tutto io.'
        },
        dependeDe: {
          es: 'De que el trabajo esté escrito en alguna parte. Lo que solo vive en tu cabeza no se puede soltar.',
          en: 'On the work being written down somewhere. What lives only in your head cannot be handed over.',
          pt: 'De o trabalho estar escrito nalgum lado. O que só vive na tua cabeça não se pode largar.',
          fr: 'De ce que le travail soit écrit quelque part. Ce qui ne vit que dans ta tête ne se lâche pas.',
          it: 'Dal fatto che il lavoro sia scritto da qualche parte. Quello che vive solo nella tua testa non si può lasciare.'
        }
      },
      {
        id: 'e-porque', quiere: 'mem', depende: 'alef',
        deseo: {
          es: 'Vendo, pero no sé por qué me compran.',
          en: 'I sell, but I do not know why they buy from me.',
          pt: 'Vendo, mas não sei porque me compram.',
          fr: 'Je vends, mais je ne sais pas pourquoi on m’achète.',
          it: 'Vendo, ma non so perché mi comprano.'
        },
        dependeDe: {
          es: 'De saber qué te hace distinto. Si no sabes por qué te compran, no puedes repetirlo a propósito.',
          en: 'On knowing what sets you apart. If you do not know why they buy, you cannot repeat it on purpose.',
          pt: 'De saber o que te faz diferente. Se não sabes porque te compram, não o podes repetir de propósito.',
          fr: 'De savoir ce qui te rend différent. Si tu ignores pourquoi on t’achète, tu ne peux pas le refaire exprès.',
          it: 'Dal sapere cosa ti rende diverso. Se non sai perché ti comprano, non puoi ripeterlo apposta.'
        }
      },
      {
        id: 'e-semana', quiere: 'tav', depende: 'tav',
        deseo: {
          es: 'Quiero poder irme una semana sin que se caiga todo.',
          en: 'I want to take a week off without everything falling apart.',
          pt: 'Quero poder ir-me uma semana sem que caia tudo.',
          fr: 'Je veux pouvoir partir une semaine sans que tout s’écroule.',
          it: 'Voglio potermene andare una settimana senza che crolli tutto.'
        },
        dependeDe: {
          es: 'De que alguien más sepa hacerlo y lo tenga por escrito. Si ya lo tienes, eso es lo que sigue.',
          en: 'On someone else knowing how and having it in writing. If you already have that, this is what comes next.',
          pt: 'De outra pessoa saber fazê-lo e tê-lo por escrito. Se já o tens, é isso o que segue.',
          fr: 'De ce que quelqu’un d’autre sache le faire et l’ait par écrit. Si tu l’as déjà, c’est la suite.',
          it: 'Dal fatto che qualcun altro sappia farlo e lo abbia per iscritto. Se ce l’hai già, è questo che segue.'
        }
      }
    ]),

    r(2, {
      es: '¿Qué te gustaría poder mostrar?',
      en: 'What would you like to be able to show?',
      pt: 'O que gostarias de poder mostrar?',
      fr: 'Qu’aimerais-tu pouvoir montrer ?',
      it: 'Cosa ti piacerebbe poter mostrare?'
    }, [
      {
        id: 'e-seria', quiere: 'alef', depende: 'alef',
        deseo: {
          es: 'Quiero que mi marca se vea seria.',
          en: 'I want my brand to look serious.',
          pt: 'Quero que a minha marca pareça séria.',
          fr: 'Je veux que ma marque ait l’air sérieuse.',
          it: 'Voglio che il mio marchio sembri serio.'
        },
        dependeDe: {
          es: 'De que se vea igual en todas partes: el mismo logo, los mismos colores y el mismo tono en cada sitio.',
          en: 'On looking the same everywhere: the same logo, the same colours and the same tone in every place.',
          pt: 'De se ver igual em todo o lado: o mesmo logo, as mesmas cores e o mesmo tom em cada sítio.',
          fr: 'De se voir pareil partout : le même logo, les mêmes couleurs et le même ton à chaque endroit.',
          it: 'Dal vedersi uguale ovunque: lo stesso logo, gli stessi colori e lo stesso tono in ogni posto.'
        }
      },
      {
        id: 'e-pagina', quiere: 'alef', depende: 'alef',
        deseo: {
          es: 'Quiero tener una página propia.',
          en: 'I want a site of my own.',
          pt: 'Quero ter uma página própria.',
          fr: 'Je veux avoir mon propre site.',
          it: 'Voglio avere un sito mio.'
        },
        dependeDe: {
          es: 'De tener claro qué va a decir. Una página es el sitio donde pones lo que ya sabes decir de ti.',
          en: 'On being clear about what it will say. A site is where you put what you already know how to say about yourself.',
          pt: 'De teres claro o que vai dizer. Uma página é o sítio onde pões o que já sabes dizer de ti.',
          fr: 'D’avoir clair ce qu’il va dire. Un site, c’est l’endroit où tu poses ce que tu sais déjà dire de toi.',
          it: 'Dall’avere chiaro cosa dirà. Un sito è il posto dove metti quello che già sai dire di te.'
        }
      },
      {
        id: 'e-recomienden', quiere: 'tav', depende: 'mem',
        deseo: {
          es: 'Quiero que mis clientes me recomienden.',
          en: 'I want my clients to recommend me.',
          pt: 'Quero que os meus clientes me recomendem.',
          fr: 'Je veux que mes clients me recommandent.',
          it: 'Voglio che i miei clienti mi consiglino.'
        },
        dependeDe: {
          es: 'De que la experiencia sea igual de buena la segunda vez. Nadie recomienda algo que le salió bien por suerte.',
          en: 'On the experience being just as good the second time. Nobody recommends something that went well by luck.',
          pt: 'De a experiência ser igual de boa à segunda vez. Ninguém recomenda algo que correu bem por sorte.',
          fr: 'De ce que l’expérience soit aussi bonne la deuxième fois. Personne ne recommande ce qui a bien marché par chance.',
          it: 'Dal fatto che l’esperienza sia buona uguale la seconda volta. Nessuno consiglia una cosa andata bene per fortuna.'
        }
      }
    ]),

    r(3, {
      es: '¿Qué te está costando más trabajo?',
      en: 'What is giving you the most trouble?',
      pt: 'O que te está a custar mais trabalho?',
      fr: 'Qu’est-ce qui te demande le plus d’efforts ?',
      it: 'Cosa ti sta costando più fatica?'
    }, [
      {
        id: 'e-chatbot', quiere: 'mem', depende: 'mem',
        deseo: {
          es: 'Quiero un chatbot que responda por mí.',
          en: 'I want a chatbot to answer for me.',
          pt: 'Quero um chatbot que responda por mim.',
          fr: 'Je veux un chatbot qui réponde à ma place.',
          it: 'Voglio un chatbot che risponda per me.'
        },
        dependeDe: {
          es: 'De tener muchos mensajes repetidos y una respuesta ya definida para cada uno. Si los tienes, es justo lo que necesitas.',
          en: 'On having many repeated messages and an answer already defined for each one. If you have them, that is exactly what you need.',
          pt: 'De teres muitas mensagens repetidas e uma resposta já definida para cada uma. Se as tens, é mesmo o que precisas.',
          fr: 'D’avoir beaucoup de messages répétés et une réponse déjà définie pour chacun. Si tu les as, c’est exactement ce qu’il te faut.',
          it: 'Dall’avere molti messaggi ripetuti e una risposta già definita per ognuno. Se li hai, è proprio quello che ti serve.'
        }
      },
      {
        id: 'e-caro', quiere: 'mem', depende: 'alef',
        deseo: {
          es: 'Quiero cobrar más caro.',
          en: 'I want to charge more.',
          pt: 'Quero cobrar mais caro.',
          fr: 'Je veux facturer plus cher.',
          it: 'Voglio farmi pagare di più.'
        },
        dependeDe: {
          es: 'De que se note por qué vales más antes de decir el precio. El precio se defiende con lo que ya se ve.',
          en: 'On it being visible why you are worth more before you say the price. A price is defended with what can already be seen.',
          pt: 'De se notar porque vales mais antes de dizeres o preço. O preço defende-se com o que já se vê.',
          fr: 'De ce qu’on voie pourquoi tu vaux plus avant d’annoncer le prix. Un prix se défend avec ce qui se voit déjà.',
          it: 'Dal fatto che si veda perché vali di più prima di dire il prezzo. Il prezzo si difende con quello che già si vede.'
        }
      },
      {
        id: 'e-improvisar', quiere: 'mem', depende: 'mem',
        deseo: {
          es: 'Quiero dejar de improvisar cada pedido.',
          en: 'I want to stop improvising every order.',
          pt: 'Quero deixar de improvisar cada pedido.',
          fr: 'Je veux arrêter d’improviser chaque commande.',
          it: 'Voglio smettere di improvvisare ogni ordine.'
        },
        dependeDe: {
          es: 'De escribir el paso a paso de un pedido, de principio a fin. Eso es exactamente lo que te falta.',
          en: 'On writing an order step by step, from beginning to end. That is exactly what you are missing.',
          pt: 'De escreveres o passo a passo de um pedido, do princípio ao fim. É exatamente o que te falta.',
          fr: 'D’écrire une commande étape par étape, du début à la fin. C’est exactement ce qui te manque.',
          it: 'Dallo scrivere un ordine passo per passo, dall’inizio alla fine. È esattamente quello che ti manca.'
        }
      },
      {
        id: 'e-anopasado', quiere: 'tav', depende: 'tav',
        deseo: {
          es: 'No sé si lo del año pasado sirvió.',
          en: 'I do not know whether last year’s work paid off.',
          pt: 'Não sei se o do ano passado serviu.',
          fr: 'Je ne sais pas si ce de l’an dernier a servi.',
          it: 'Non so se quello dell’anno scorso è servito.'
        },
        dependeDe: {
          es: 'De tener anotado qué pasó cada mes. Si lo tienes, compararlo es el paso que sigue.',
          en: 'On having written down what happened each month. If you have it, comparing is the next step.',
          pt: 'De teres anotado o que aconteceu cada mês. Se o tens, compará-lo é o passo seguinte.',
          fr: 'D’avoir noté ce qui s’est passé chaque mois. Si tu l’as, comparer est l’étape suivante.',
          it: 'Dall’avere annotato cosa è successo ogni mese. Se ce l’hai, confrontarlo è il passo successivo.'
        }
      }
    ]),

    r(4, {
      es: '¿Qué quisieras que pasara solo?',
      en: 'What would you like to happen on its own?',
      pt: 'O que gostarias que acontecesse sozinho?',
      fr: 'Qu’aimerais-tu voir se faire tout seul ?',
      it: 'Cosa vorresti che succedesse da solo?'
    }, [
      {
        id: 'e-vuelvan', quiere: 'tav', depende: 'mem',
        deseo: {
          es: 'Quiero que la gente vuelva.',
          en: 'I want people to come back.',
          pt: 'Quero que as pessoas voltem.',
          fr: 'Je veux que les gens reviennent.',
          it: 'Voglio che la gente torni.'
        },
        dependeDe: {
          es: 'De que la primera vez haya valido la pena. Nadie vuelve a un sitio donde no le pasó nada.',
          en: 'On the first time having been worth it. Nobody returns to a place where nothing happened to them.',
          pt: 'De a primeira vez ter valido a pena. Ninguém volta a um sítio onde não lhe aconteceu nada.',
          fr: 'De ce que la première fois en ait valu la peine. Personne ne retourne là où il ne lui est rien arrivé.',
          it: 'Dal fatto che la prima volta sia valsa la pena. Nessuno torna in un posto dove non gli è successo niente.'
        }
      },
      {
        id: 'e-automatizar', quiere: 'tav', depende: 'mem',
        deseo: {
          es: 'Quiero automatizar lo que hago a mano.',
          en: 'I want to automate what I do by hand.',
          pt: 'Quero automatizar o que faço à mão.',
          fr: 'Je veux automatiser ce que je fais à la main.',
          it: 'Voglio automatizzare quello che faccio a mano.'
        },
        dependeDe: {
          es: 'De que ese trabajo tenga un orden fijo. Automatizar un desorden lo vuelve un desorden más rápido.',
          en: 'On that work having a fixed order. Automating a mess just makes it a faster mess.',
          pt: 'De esse trabalho ter uma ordem fixa. Automatizar uma desordem torna-a uma desordem mais rápida.',
          fr: 'De ce que ce travail ait un ordre fixe. Automatiser un désordre en fait un désordre plus rapide.',
          it: 'Dal fatto che quel lavoro abbia un ordine fisso. Automatizzare un disordine lo rende un disordine più veloce.'
        }
      },
      {
        id: 'e-sinmi', quiere: 'tav', depende: 'tav',
        deseo: {
          es: 'Quiero que el negocio funcione sin mí.',
          en: 'I want the business to run without me.',
          pt: 'Quero que o negócio funcione sem mim.',
          fr: 'Je veux que l’affaire tourne sans moi.',
          it: 'Voglio che l’attività funzioni senza di me.'
        },
        dependeDe: {
          es: 'De que otra persona pueda hacerlo igual leyendo lo que dejaste escrito. Ahí es donde estás.',
          en: 'On someone else being able to do it the same way by reading what you wrote down. That is where you are.',
          pt: 'De outra pessoa o poder fazer igual lendo o que deixaste escrito. É aí que estás.',
          fr: 'De ce qu’une autre personne puisse le faire pareil en lisant ce que tu as écrit. C’est là que tu es.',
          it: 'Dal fatto che un’altra persona possa farlo uguale leggendo quello che hai lasciato scritto. È lì che sei.'
        }
      }
    ]),

    r(5, {
      es: '¿Con cuál te quedarías si tuvieras que elegir una?',
      en: 'Which one would you keep if you had to choose?',
      pt: 'Com qual ficarias se tivesses de escolher uma?',
      fr: 'Laquelle garderais-tu s’il fallait en choisir une ?',
      it: 'Quale terresti se dovessi sceglierne una?'
    }, [
      {
        id: 'e-crecer', quiere: 'tav', depende: 'alef',
        deseo: {
          es: 'Quiero crecer sin dejar de ser lo que somos.',
          en: 'I want to grow without stopping being what we are.',
          pt: 'Quero crescer sem deixar de ser o que somos.',
          fr: 'Je veux grandir sans cesser d’être ce que nous sommes.',
          it: 'Voglio crescere senza smettere di essere quello che siamo.'
        },
        dependeDe: {
          es: 'De tener escrito qué es lo que no se negocia. Sin eso, crecer es cambiar de cosa sin darte cuenta.',
          en: 'On having written down what is not up for negotiation. Without that, growing is becoming something else without noticing.',
          pt: 'De teres escrito o que não se negoceia. Sem isso, crescer é mudar de coisa sem dares conta.',
          fr: 'D’avoir écrit ce qui ne se négocie pas. Sans ça, grandir, c’est changer de chose sans s’en rendre compte.',
          it: 'Dall’avere scritto cosa non si negozia. Senza questo, crescere è cambiare cosa senza accorgersene.'
        }
      },
      {
        id: 'e-equipo', quiere: 'mem', depende: 'alef',
        deseo: {
          es: 'Quiero que mi equipo hable igual que yo.',
          en: 'I want my team to speak the way I do.',
          pt: 'Quero que a minha equipa fale igual a mim.',
          fr: 'Je veux que mon équipe parle comme moi.',
          it: 'Voglio che la mia squadra parli come me.'
        },
        dependeDe: {
          es: 'De que exista un documento con tu forma de decir las cosas. Eso no se aprende de oído.',
          en: 'On there being a document with your way of saying things. That is not picked up by ear.',
          pt: 'De existir um documento com a tua forma de dizer as coisas. Isso não se aprende de ouvido.',
          fr: 'De l’existence d’un document avec ta façon de dire les choses. Ça ne s’apprend pas à l’oreille.',
          it: 'Dall’esistenza di un documento con il tuo modo di dire le cose. Non si impara a orecchio.'
        }
      },
      {
        id: 'e-medir', quiere: 'tav', depende: 'tav',
        deseo: {
          es: 'Quiero medir si lo que hago sirve.',
          en: 'I want to measure whether what I do works.',
          pt: 'Quero medir se o que faço serve.',
          fr: 'Je veux mesurer si ce que je fais sert.',
          it: 'Voglio misurare se quello che faccio serve.'
        },
        dependeDe: {
          es: 'De tener un número que ya estés mirando cada mes. Si lo tienes, medir es el paso correcto.',
          en: 'On having a number you are already looking at every month. If you have it, measuring is the right step.',
          pt: 'De teres um número que já estejas a ver todos os meses. Se o tens, medir é o passo certo.',
          fr: 'D’avoir un chiffre que tu regardes déjà chaque mois. Si tu l’as, mesurer est la bonne étape.',
          it: 'Dall’avere un numero che guardi già ogni mese. Se ce l’hai, misurare è il passo giusto.'
        }
      }
    ])
  ],

  /* ============================================================
     RAMA PERSONA — «vengo por mí». Los deseos son de alguien que
     trabaja, no de una empresa. El resultado va en reflexivo.
     ============================================================ */
  persona: [
    r(1, {
      es: '¿Qué es lo que más te pesa hoy?',
      en: 'What weighs on you most today?',
      pt: 'O que é que mais te pesa hoje?',
      fr: 'Qu’est-ce qui te pèse le plus aujourd’hui ?',
      it: 'Cos’è che ti pesa di più oggi?'
    }, [
      {
        id: 'p-sepan', quiere: 'alef', depende: 'alef',
        deseo: {
          es: 'Quiero que sepan lo que sé hacer.',
          en: 'I want people to know what I can do.',
          pt: 'Quero que saibam o que sei fazer.',
          fr: 'Je veux qu’on sache ce que je sais faire.',
          it: 'Voglio che sappiano cosa so fare.'
        },
        dependeDe: {
          es: 'De poder decirlo en una frase, sin currículum. Lo que no se dice corto, no lo repite nadie.',
          en: 'On being able to say it in one sentence, without a CV. What is not said short is not repeated by anyone.',
          pt: 'De o poderes dizer numa frase, sem currículo. O que não se diz curto, ninguém repete.',
          fr: 'De pouvoir le dire en une phrase, sans CV. Ce qui ne se dit pas court, personne ne le répète.',
          it: 'Dal poterlo dire in una frase, senza curriculum. Quello che non si dice corto non lo ripete nessuno.'
        }
      },
      {
        id: 'p-nosenota', quiere: 'alef', depende: 'alef',
        deseo: {
          es: 'Trabajo mucho y siento que no se nota.',
          en: 'I work a lot and I feel it does not show.',
          pt: 'Trabalho muito e sinto que não se nota.',
          fr: 'Je travaille beaucoup et j’ai l’impression que ça ne se voit pas.',
          it: 'Lavoro molto e sento che non si nota.'
        },
        dependeDe: {
          es: 'De mostrar el trabajo, no de hacer más. Lo que no se ve no existe para quien decide.',
          en: 'On showing the work, not on doing more. What is not seen does not exist for whoever decides.',
          pt: 'De mostrares o trabalho, não de fazeres mais. O que não se vê não existe para quem decide.',
          fr: 'De montrer le travail, pas d’en faire plus. Ce qui ne se voit pas n’existe pas pour qui décide.',
          it: 'Dal mostrare il lavoro, non dal farne di più. Quello che non si vede non esiste per chi decide.'
        }
      },
      {
        id: 'p-cobrar', quiere: 'mem', depende: 'alef',
        deseo: {
          es: 'No sé cómo cobrar lo que valgo.',
          en: 'I do not know how to charge what I am worth.',
          pt: 'Não sei como cobrar o que valho.',
          fr: 'Je ne sais pas comment facturer ce que je vaux.',
          it: 'Non so come farmi pagare quanto valgo.'
        },
        dependeDe: {
          es: 'De poder mostrar qué has hecho antes. El precio se sostiene con pruebas, no con argumentos.',
          en: 'On being able to show what you have done before. A price holds up with proof, not with arguments.',
          pt: 'De poderes mostrar o que já fizeste. O preço sustenta-se com provas, não com argumentos.',
          fr: 'De pouvoir montrer ce que tu as déjà fait. Un prix tient avec des preuves, pas avec des arguments.',
          it: 'Dal poter mostrare cosa hai già fatto. Il prezzo si regge sulle prove, non sugli argomenti.'
        }
      },
      {
        id: 'p-cabeza', quiere: 'tav', depende: 'tav',
        deseo: {
          es: 'Me preocupa que todo lo que sé se quede en mi cabeza.',
          en: 'It worries me that everything I know stays in my head.',
          pt: 'Preocupa-me que tudo o que sei fique na minha cabeça.',
          fr: 'Ça m’inquiète que tout ce que je sais reste dans ma tête.',
          it: 'Mi preoccupa che tutto quello che so resti nella mia testa.'
        },
        dependeDe: {
          es: 'De sacarlo de ahí: escribirlo o enseñárselo a alguien. Si ya te lo piden, ese es el paso.',
          en: 'On getting it out of there: writing it down or teaching it to someone. If people already ask you, that is the step.',
          pt: 'De o tirares de lá: escrevê-lo ou ensiná-lo a alguém. Se já to pedem, esse é o passo.',
          fr: 'De l’en sortir : l’écrire ou l’enseigner à quelqu’un. Si on te le demande déjà, c’est l’étape.',
          it: 'Dal tirarlo fuori: scriverlo o insegnarlo a qualcuno. Se già te lo chiedono, è questo il passo.'
        }
      }
    ]),

    r(2, {
      es: '¿Qué te gustaría poder mostrar?',
      en: 'What would you like to be able to show?',
      pt: 'O que gostarias de poder mostrar?',
      fr: 'Qu’aimerais-tu pouvoir montrer ?',
      it: 'Cosa ti piacerebbe poter mostrare?'
    }, [
      {
        id: 'p-portafolio', quiere: 'alef', depende: 'alef',
        deseo: {
          es: 'Quiero tener un portafolio.',
          en: 'I want a portfolio.',
          pt: 'Quero ter um portefólio.',
          fr: 'Je veux avoir un portfolio.',
          it: 'Voglio avere un portfolio.'
        },
        dependeDe: {
          es: 'De elegir tres trabajos y contarlos bien. Un portafolio no es todo lo que has hecho.',
          en: 'On picking three pieces of work and telling them well. A portfolio is not everything you have done.',
          pt: 'De escolheres três trabalhos e contá-los bem. Um portefólio não é tudo o que já fizeste.',
          fr: 'De choisir trois travaux et de bien les raconter. Un portfolio, ce n’est pas tout ce que tu as fait.',
          it: 'Dallo scegliere tre lavori e raccontarli bene. Un portfolio non è tutto quello che hai fatto.'
        }
      },
      {
        id: 'p-nombre', quiere: 'alef', depende: 'alef',
        deseo: {
          es: 'Quiero que me busquen a mí, no a mi cargo.',
          en: 'I want them to look for me, not for my job title.',
          pt: 'Quero que me procurem a mim, não ao meu cargo.',
          fr: 'Je veux qu’on me cherche moi, pas mon poste.',
          it: 'Voglio che cerchino me, non il mio ruolo.'
        },
        dependeDe: {
          es: 'De tener algo tuyo publicado con tu nombre encima. Un cargo lo ocupa cualquiera.',
          en: 'On having something of yours published with your name on it. Anyone can fill a job title.',
          pt: 'De teres algo teu publicado com o teu nome. Um cargo ocupa-o qualquer um.',
          fr: 'D’avoir quelque chose à toi publié avec ton nom dessus. Un poste, n’importe qui l’occupe.',
          it: 'Dall’avere qualcosa di tuo pubblicato con il tuo nome sopra. Un ruolo lo occupa chiunque.'
        }
      },
      {
        id: 'p-hablar', quiere: 'mem', depende: 'mem',
        deseo: {
          es: 'Quiero hablar en público sin bloquearme.',
          en: 'I want to speak in public without freezing.',
          pt: 'Quero falar em público sem bloquear.',
          fr: 'Je veux parler en public sans me bloquer.',
          it: 'Voglio parlare in pubblico senza bloccarmi.'
        },
        dependeDe: {
          es: 'De repetirlo delante de alguien que te corrija. Eso se entrena, no se lee.',
          en: 'On repeating it in front of someone who corrects you. That is trained, not read.',
          pt: 'De o repetires à frente de alguém que te corrija. Isso treina-se, não se lê.',
          fr: 'De le répéter devant quelqu’un qui te corrige. Ça s’entraîne, ça ne se lit pas.',
          it: 'Dal ripeterlo davanti a qualcuno che ti corregge. Si allena, non si legge.'
        }
      }
    ]),

    r(3, {
      es: '¿Qué te está costando más trabajo?',
      en: 'What is giving you the most trouble?',
      pt: 'O que te está a custar mais trabalho?',
      fr: 'Qu’est-ce qui te demande le plus d’efforts ?',
      it: 'Cosa ti sta costando più fatica?'
    }, [
      {
        id: 'p-aprender', quiere: 'mem', depende: 'alef',
        deseo: {
          es: 'Quiero aprender algo que me sirva ya.',
          en: 'I want to learn something useful right away.',
          pt: 'Quero aprender algo que me sirva já.',
          fr: 'Je veux apprendre quelque chose qui me serve tout de suite.',
          it: 'Voglio imparare qualcosa che mi serva subito.'
        },
        dependeDe: {
          es: 'De saber para qué lo quieres. Sin eso, cualquier curso se siente útil y ninguno cambia nada.',
          en: 'On knowing what you want it for. Without that, any course feels useful and none changes anything.',
          pt: 'De saberes para que o queres. Sem isso, qualquer curso parece útil e nenhum muda nada.',
          fr: 'De savoir pourquoi tu le veux. Sans ça, n’importe quel cours semble utile et aucun ne change rien.',
          it: 'Dal sapere a cosa ti serve. Senza questo, qualsiasi corso sembra utile e nessuno cambia niente.'
        }
      },
      {
        id: 'p-cambiar', quiere: 'tav', depende: 'alef',
        deseo: {
          es: 'Quiero cambiar de trabajo.',
          en: 'I want to change jobs.',
          pt: 'Quero mudar de trabalho.',
          fr: 'Je veux changer de travail.',
          it: 'Voglio cambiare lavoro.'
        },
        dependeDe: {
          es: 'De saber qué haces mejor que la mayoría. Cambiar sin eso es repetir el mismo puesto en otro sitio.',
          en: 'On knowing what you do better than most. Changing without that is repeating the same job somewhere else.',
          pt: 'De saberes o que fazes melhor do que a maioria. Mudar sem isso é repetir o mesmo posto noutro sítio.',
          fr: 'De savoir ce que tu fais mieux que la plupart. Changer sans ça, c’est refaire le même poste ailleurs.',
          it: 'Dal sapere cosa fai meglio della maggioranza. Cambiare senza questo è rifare lo stesso posto altrove.'
        }
      },
      {
        id: 'p-terminar', quiere: 'mem', depende: 'mem',
        deseo: {
          es: 'Quiero terminar lo que empiezo.',
          en: 'I want to finish what I start.',
          pt: 'Quero terminar o que começo.',
          fr: 'Je veux finir ce que je commence.',
          it: 'Voglio finire quello che inizio.'
        },
        dependeDe: {
          es: 'De tener un plazo y alguien a quien rendirle cuentas. Es exactamente lo que falta.',
          en: 'On having a deadline and someone to answer to. That is exactly what is missing.',
          pt: 'De teres um prazo e alguém a quem prestar contas. É exatamente o que falta.',
          fr: 'D’avoir un délai et quelqu’un à qui rendre des comptes. C’est exactement ce qui manque.',
          it: 'Dall’avere una scadenza e qualcuno a cui rendere conto. È esattamente quello che manca.'
        }
      },
      {
        id: 'p-mejorando', quiere: 'tav', depende: 'tav',
        deseo: {
          es: 'No sé si estoy mejorando.',
          en: 'I do not know whether I am getting better.',
          pt: 'Não sei se estou a melhorar.',
          fr: 'Je ne sais pas si je progresse.',
          it: 'Non so se sto migliorando.'
        },
        dependeDe: {
          es: 'De tener algo tuyo de hace un año con qué compararte. Si lo tienes, mirarlo es el paso.',
          en: 'On having something of yours from a year ago to compare with. If you have it, looking at it is the step.',
          pt: 'De teres algo teu de há um ano para comparar. Se o tens, olhá-lo é o passo.',
          fr: 'D’avoir quelque chose à toi d’il y a un an pour comparer. Si tu l’as, le regarder est l’étape.',
          it: 'Dall’avere qualcosa di tuo di un anno fa con cui confrontarti. Se ce l’hai, guardarlo è il passo.'
        }
      }
    ]),

    r(4, {
      es: '¿Qué quisieras que pasara solo?',
      en: 'What would you like to happen on its own?',
      pt: 'O que gostarias que acontecesse sozinho?',
      fr: 'Qu’aimerais-tu voir se faire tout seul ?',
      it: 'Cosa vorresti che succedesse da solo?'
    }, [
      {
        id: 'p-recomienden', quiere: 'tav', depende: 'mem',
        deseo: {
          es: 'Quiero que me recomienden sin pedirlo.',
          en: 'I want to be recommended without asking.',
          pt: 'Quero que me recomendem sem pedir.',
          fr: 'Je veux qu’on me recommande sans le demander.',
          it: 'Voglio che mi consiglino senza chiederlo.'
        },
        dependeDe: {
          es: 'De que con quien trabajas quede con ganas de repetir. La recomendación es la segunda vez, no la primera.',
          en: 'On whoever works with you wanting to do it again. A recommendation is the second time, not the first.',
          pt: 'De quem trabalha contigo ficar com vontade de repetir. A recomendação é a segunda vez, não a primeira.',
          fr: 'De ce que celui qui travaille avec toi ait envie de recommencer. La recommandation, c’est la deuxième fois, pas la première.',
          it: 'Dal fatto che chi lavora con te abbia voglia di rifarlo. Il consiglio è la seconda volta, non la prima.'
        }
      },
      {
        id: 'p-vivir', quiere: 'tav', depende: 'mem',
        deseo: {
          es: 'Quiero vivir de esto.',
          en: 'I want to make a living from this.',
          pt: 'Quero viver disto.',
          fr: 'Je veux en vivre.',
          it: 'Voglio viverci.'
        },
        dependeDe: {
          es: 'De que alguien ya te haya pagado por hacerlo, aunque sea poco. Ese es el paso que sigue.',
          en: 'On someone having already paid you for it, even a little. That is the next step.',
          pt: 'De alguém já te ter pago por isso, mesmo que pouco. Esse é o passo seguinte.',
          fr: 'De ce que quelqu’un t’ait déjà payé pour ça, même peu. C’est l’étape suivante.',
          it: 'Dal fatto che qualcuno ti abbia già pagato per farlo, anche poco. È il passo successivo.'
        }
      },
      {
        id: 'p-ensenar', quiere: 'tav', depende: 'tav',
        deseo: {
          es: 'Quiero enseñar lo que aprendí.',
          en: 'I want to teach what I have learned.',
          pt: 'Quero ensinar o que aprendi.',
          fr: 'Je veux enseigner ce que j’ai appris.',
          it: 'Voglio insegnare quello che ho imparato.'
        },
        dependeDe: {
          es: 'De tener a alguien que ya te lo pidió. Si lo tienes, enseñar es el paso correcto.',
          en: 'On having someone who has already asked you for it. If you have that, teaching is the right step.',
          pt: 'De teres alguém que já to pediu. Se o tens, ensinar é o passo certo.',
          fr: 'D’avoir quelqu’un qui te l’a déjà demandé. Si tu l’as, enseigner est la bonne étape.',
          it: 'Dall’avere qualcuno che te l’ha già chiesto. Se ce l’hai, insegnare è il passo giusto.'
        }
      }
    ]),

    r(5, {
      es: '¿Con cuál te quedarías si tuvieras que elegir una?',
      en: 'Which one would you keep if you had to choose?',
      pt: 'Com qual ficarias se tivesses de escolher uma?',
      fr: 'Laquelle garderais-tu s’il fallait en choisir une ?',
      it: 'Quale terresti se dovessi sceglierne una?'
    }, [
      {
        id: 'p-dure', quiere: 'tav', depende: 'tav',
        deseo: {
          es: 'Quiero dejar algo que dure.',
          en: 'I want to leave something that lasts.',
          pt: 'Quero deixar algo que dure.',
          fr: 'Je veux laisser quelque chose qui dure.',
          it: 'Voglio lasciare qualcosa che duri.'
        },
        dependeDe: {
          es: 'De poner por escrito lo que sabes, para que siga sin ti. Ahí es donde estás.',
          en: 'On writing down what you know, so it goes on without you. That is where you are.',
          pt: 'De pores por escrito o que sabes, para que siga sem ti. É aí que estás.',
          fr: 'De mettre par écrit ce que tu sais, pour que ça continue sans toi. C’est là que tu es.',
          it: 'Dal mettere per iscritto quello che sai, perché vada avanti senza di te. È lì che sei.'
        }
      },
      {
        id: 'p-comparar', quiere: 'mem', depende: 'alef',
        deseo: {
          es: 'Quiero dejar de compararme.',
          en: 'I want to stop comparing myself.',
          pt: 'Quero deixar de me comparar.',
          fr: 'Je veux arrêter de me comparer.',
          it: 'Voglio smettere di confrontarmi.'
        },
        dependeDe: {
          es: 'De tener claro en qué eres distinto. Sin eso, todo el mundo parece ir más adelante.',
          en: 'On being clear about what makes you different. Without that, everyone looks further ahead.',
          pt: 'De teres claro em que és diferente. Sem isso, toda a gente parece ir mais à frente.',
          fr: 'D’avoir clair en quoi tu es différent. Sans ça, tout le monde semble plus avancé.',
          it: 'Dall’avere chiaro in cosa sei diverso. Senza questo, sembrano tutti più avanti.'
        }
      },
      {
        id: 'p-gente', quiere: 'tav', depende: 'mem',
        deseo: {
          es: 'Quiero rodearme de gente que va en serio.',
          en: 'I want to be around people who are serious.',
          pt: 'Quero rodear-me de gente que vai a sério.',
          fr: 'Je veux m’entourer de gens sérieux.',
          it: 'Voglio circondarmi di gente che fa sul serio.'
        },
        dependeDe: {
          es: 'De estar haciendo algo que puedas mostrar. A esa gente se llega con trabajo, no con ganas.',
          en: 'On already doing something you can show. You reach those people with work, not with willingness.',
          pt: 'De estares a fazer algo que possas mostrar. A essa gente chega-se com trabalho, não com vontade.',
          fr: 'D’être déjà en train de faire quelque chose que tu peux montrer. On atteint ces gens avec du travail, pas avec de l’envie.',
          it: 'Dallo stare già facendo qualcosa che puoi mostrare. A quella gente ci si arriva col lavoro, non con la voglia.'
        }
      }
    ])
  ]
};

/* Todas las cartas de una rama, en una lista plana. Lo usan el guion —para
   buscar una carta por su id al recargar— y la comprobacion de abajo. */
export const cartasDe = (rama) =>
  (BARAJA[rama] ?? []).flatMap((ronda) => ronda.cartas);

/* LA REGLA ANTITRUCO, COMPROBADA AL CONSTRUIR y no confiada a la memoria.
   Si alguien añade cartas que siempre corrigen, el sitio no compila y se
   entera aqui, que es cuando todavia se puede arreglar. */
for (const rama of Object.keys(BARAJA)) {
  const cartas = cartasDe(rama);
  const confirman = cartas.filter((c) => c.quiere === c.depende).length;
  if (confirman * 3 < cartas.length) {
    throw new Error(
      `La baraja «${rama}» solo confirma ${confirman} de ${cartas.length} cartas. ` +
      'Tiene que confirmar al menos un tercio, o la ruta se lee como un truco.'
    );
  }
}
