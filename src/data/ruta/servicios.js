import { HOUSES } from '../houses.js';

/* A DONDE LLEVA CADA PASO, y con que nombre.

   Nunca se entrega solo el nombre de una marca. Una marca no es una
   respuesta: la respuesta es un trabajo con nombre, con lo que incluye y
   con cuanto dura. La marca es quien lo atiende, y se dice despues.

   EL PRECIO NO SALE EN PANTALLA. Se habla por WhatsApp, donde ya se sabe de
   que tamaño es el trabajo. Poner un rango aqui obligaria a inventarlo, y
   una cifra inventada en una pagina es exactamente lo que esta ruta esta
   tratando de no ser.

   LO QUE NO HACE FALTA TODAVIA ES OBLIGATORIO. Sale siempre, en todos los
   resultados, y es lo unico que prueba que esto no es un catalogo: decir
   que no hace falta algo que se podria vender hoy.

   SI UNA MARCA NO HA ABIERTO SE DICE. No se esconde el paso ni se ofrece
   como si estuviera lista: se nombra el trabajo, se dice que todavia no
   esta abierta y se ofrece avisar. `abierta` sale de houses.js —de si la
   marca tiene direccion propia— y no se escribe a mano aqui: el dia que
   abra, se le pone la url alli y esto se entera solo.

   EL ESPAÑOL ES EL ORIGINAL; los otros cuatro son traduccion. */

const marca = (id) => {
  const h = HOUSES.find((x) => x.id === id);
  if (!h) throw new Error(`La ruta apunta a una marca que no existe: ${id}`);
  return { id: h.id, nombre: h.name, url: h.url ?? null, dominio: h.domain ?? null, abierta: Boolean(h.url) };
};

export const SERVICIO = {
  empresa: {
    alef: {
      marca: marca('recvid'),
      nombre: {
        es: 'Qué te hace distinto',
        en: 'What sets you apart',
        pt: 'O que te faz diferente',
        fr: 'Ce qui te distingue',
        it: 'Cosa ti rende diverso'
      },
      incluye: {
        es: ['Tres sesiones para encontrar la frase', 'Un documento con tu frase, tus colores y tu tono', 'Cómo se aplica en redes y en tu página'],
        en: ['Three sessions to find the sentence', 'A document with your sentence, your colours and your tone', 'How it applies on social media and on your site'],
        pt: ['Três sessões para encontrar a frase', 'Um documento com a tua frase, as tuas cores e o teu tom', 'Como se aplica nas redes e na tua página'],
        fr: ['Trois séances pour trouver la phrase', 'Un document avec ta phrase, tes couleurs et ton ton', 'Comment l’appliquer sur les réseaux et sur ton site'],
        it: ['Tre sessioni per trovare la frase', 'Un documento con la tua frase, i tuoi colori e il tuo tono', 'Come si applica sui social e sul tuo sito']
      },
      dura: {
        es: 'Dos semanas', en: 'Two weeks', pt: 'Duas semanas', fr: 'Deux semaines', it: 'Due settimane'
      }
    },
    mem: {
      marca: marca('let-be'),
      nombre: {
        es: 'Que lo que prometes funcione',
        en: 'Making what you promise work',
        pt: 'Que o que prometes funcione',
        fr: 'Que ce que tu promets fonctionne',
        it: 'Che quello che prometti funzioni'
      },
      incluye: {
        es: ['Revisión de cómo atiendes hoy, de principio a fin', 'El paso a paso escrito, para que lo siga cualquiera', 'Lo que haya que construir: página, chatbot o automatización'],
        en: ['A review of how you serve today, from start to finish', 'The step by step written down, so anyone can follow it', 'Whatever needs building: site, chatbot or automation'],
        pt: ['Revisão de como atendes hoje, do princípio ao fim', 'O passo a passo escrito, para que qualquer um o siga', 'O que houver para construir: página, chatbot ou automação'],
        fr: ['Revue de ta façon de servir aujourd’hui, du début à la fin', 'Le pas à pas écrit, pour que n’importe qui le suive', 'Ce qu’il faut construire : site, chatbot ou automatisation'],
        it: ['Revisione di come servi oggi, dall’inizio alla fine', 'Il passo per passo scritto, perché lo segua chiunque', 'Quello che serve costruire: sito, chatbot o automazione']
      },
      dura: {
        es: 'De cuatro a seis semanas', en: 'Four to six weeks', pt: 'De quatro a seis semanas',
        fr: 'De quatre à six semaines', it: 'Da quattro a sei settimane'
      }
    },
    tav: {
      marca: marca('business'),
      nombre: {
        es: 'Que funcione sin ti',
        en: 'Making it run without you',
        pt: 'Que funcione sem ti',
        fr: 'Que ça tourne sans toi',
        it: 'Che funzioni senza di te'
      },
      incluye: {
        es: ['El trabajo escrito para que otra persona lo haga igual', 'Un número que mires cada mes', 'Quién responde por cada cosa'],
        en: ['The work written down so someone else does it the same', 'A number you look at every month', 'Who answers for each thing'],
        pt: ['O trabalho escrito para que outra pessoa o faça igual', 'Um número que vejas todos os meses', 'Quem responde por cada coisa'],
        fr: ['Le travail écrit pour qu’une autre personne le fasse pareil', 'Un chiffre que tu regardes chaque mois', 'Qui répond de chaque chose'],
        it: ['Il lavoro scritto perché un’altra persona lo faccia uguale', 'Un numero che guardi ogni mese', 'Chi risponde di ogni cosa']
      },
      dura: {
        es: 'Tres meses', en: 'Three months', pt: 'Três meses', fr: 'Trois mois', it: 'Tre mesi'
      }
    }
  },

  persona: {
    alef: {
      marca: marca('fraterniu'),
      nombre: {
        es: 'Empezar por lo tuyo',
        en: 'Starting with what is yours',
        pt: 'Começar pelo que é teu',
        fr: 'Commencer par ce qui est à toi',
        it: 'Partire da quello che è tuo'
      },
      incluye: {
        es: ['Encontrar qué haces mejor que la mayoría', 'Tres trabajos tuyos, contados para que se entiendan', 'Dónde publicarlos con tu nombre'],
        en: ['Finding what you do better than most', 'Three pieces of your work, told so they are understood', 'Where to publish them under your name'],
        pt: ['Encontrar o que fazes melhor do que a maioria', 'Três trabalhos teus, contados para se perceberem', 'Onde publicá-los com o teu nome'],
        fr: ['Trouver ce que tu fais mieux que la plupart', 'Trois de tes travaux, racontés pour être compris', 'Où les publier sous ton nom'],
        it: ['Trovare cosa fai meglio della maggioranza', 'Tre tuoi lavori, raccontati perché si capiscano', 'Dove pubblicarli con il tuo nome']
      },
      dura: {
        es: 'Cuatro semanas', en: 'Four weeks', pt: 'Quatro semanas', fr: 'Quatre semaines', it: 'Quattro settimane'
      }
    },
    mem: {
      marca: marca('academy'),
      nombre: {
        es: 'Sostenerlo en el tiempo',
        en: 'Keeping it up over time',
        pt: 'Sustentá-lo no tempo',
        fr: 'Le tenir dans la durée',
        it: 'Sostenerlo nel tempo'
      },
      incluye: {
        es: ['Un plazo y alguien a quien rendirle cuentas', 'Practicar delante de alguien que corrige', 'Revisión de lo que entregas, una vez al mes'],
        en: ['A deadline and someone to answer to', 'Practising in front of someone who corrects', 'A review of what you deliver, once a month'],
        pt: ['Um prazo e alguém a quem prestar contas', 'Praticar à frente de alguém que corrige', 'Revisão do que entregas, uma vez por mês'],
        fr: ['Un délai et quelqu’un à qui rendre des comptes', 'S’exercer devant quelqu’un qui corrige', 'Une revue de ce que tu livres, une fois par mois'],
        it: ['Una scadenza e qualcuno a cui rendere conto', 'Esercitarsi davanti a chi corregge', 'Revisione di quello che consegni, una volta al mese']
      },
      dura: {
        es: 'Tres meses', en: 'Three months', pt: 'Três meses', fr: 'Trois mois', it: 'Tre mesi'
      }
    },
    tav: {
      marca: marca('us'),
      nombre: {
        es: 'Dejarlo por escrito',
        en: 'Putting it in writing',
        pt: 'Deixá-lo por escrito',
        fr: 'Le mettre par écrit',
        it: 'Metterlo per iscritto'
      },
      incluye: {
        es: ['Lo que sabes, escrito para que otro lo use', 'A quién le sirve y por dónde llega', 'Con quién seguir cuando ya no dependa de ti'],
        en: ['What you know, written so someone else can use it', 'Who it serves and how it reaches them', 'Who to continue with once it no longer depends on you'],
        pt: ['O que sabes, escrito para que outro o use', 'A quem serve e por onde chega', 'Com quem seguir quando já não dependa de ti'],
        fr: ['Ce que tu sais, écrit pour qu’un autre s’en serve', 'À qui ça sert et par où ça arrive', 'Avec qui continuer quand ça ne dépendra plus de toi'],
        it: ['Quello che sai, scritto perché un altro lo usi', 'A chi serve e da dove arriva', 'Con chi continuare quando non dipenderà più da te']
      },
      dura: {
        es: 'Tres meses', en: 'Three months', pt: 'Três meses', fr: 'Trois mois', it: 'Tre mesi'
      }
    }
  }
};

/* LO QUE NO HACE FALTA TODAVIA, por el paso donde quedo la persona. Va
   siempre, y nombra algo concreto que se podria vender hoy mismo: eso es lo
   que le da valor. */
export const TODAVIA_NO = {
  alef: {
    es: 'Todavía no necesitas automatizar ni medir. Un chatbot contesta rápido lo que aún no tienes claro, y un número no dice nada si no sabes qué estás contando.',
    en: 'You do not need to automate or measure yet. A chatbot answers quickly what you have not yet made clear, and a number says nothing if you do not know what you are counting.',
    pt: 'Ainda não precisas de automatizar nem de medir. Um chatbot responde depressa ao que ainda não tens claro, e um número não diz nada se não sabes o que estás a contar.',
    fr: 'Tu n’as pas encore besoin d’automatiser ni de mesurer. Un chatbot répond vite à ce que tu n’as pas encore clarifié, et un chiffre ne dit rien si tu ne sais pas ce que tu comptes.',
    it: 'Non ti serve ancora automatizzare né misurare. Un chatbot risponde in fretta a quello che non hai ancora chiaro, e un numero non dice niente se non sai cosa stai contando.'
  },
  mem: {
    es: 'Todavía no necesitas pensar en que funcione sin ti, ni en abrir otra línea. Eso se sostiene cuando lo de ahora ya se repite igual dos veces seguidas.',
    en: 'You do not need to think about it running without you yet, nor about opening another line. That holds once what you have now repeats the same way twice in a row.',
    pt: 'Ainda não precisas de pensar em que funcione sem ti, nem em abrir outra linha. Isso sustenta-se quando o de agora já se repete igual duas vezes seguidas.',
    fr: 'Tu n’as pas encore besoin de penser à ce que ça tourne sans toi, ni à ouvrir une autre ligne. Ça tient quand ce que tu as se répète pareil deux fois de suite.',
    it: 'Non ti serve ancora pensare che funzioni senza di te, né aprire un’altra linea. Regge quando quello di adesso si ripete uguale due volte di fila.'
  },
  tav: {
    es: 'Todavía no necesitas empezar algo nuevo. Lo que sigue es medir lo que ya tienes, y eso rinde más que abrir otro frente.',
    en: 'You do not need to start something new yet. What comes next is measuring what you already have, and that pays off more than opening another front.',
    pt: 'Ainda não precisas de começar algo novo. O que segue é medir o que já tens, e isso rende mais do que abrir outra frente.',
    fr: 'Tu n’as pas encore besoin de commencer autre chose. La suite, c’est mesurer ce que tu as déjà, et ça rapporte plus que d’ouvrir un autre front.',
    it: 'Non ti serve ancora iniziare qualcosa di nuovo. Quello che segue è misurare quello che hai già, e rende più che aprire un altro fronte.'
  }
};

export const servicioDe = (rama, paso) => SERVICIO[rama]?.[paso] ?? null;
