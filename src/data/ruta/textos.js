/* TODOS LOS TEXTOS DE LA RUTA. Ni una palabra suelta en los componentes.

   Las llaves entre corchetes las rellena el guion (scripts/ruta.js):

     {paso}     el nombre del paso — «el inicio»
     {lema}     lo que promete ese paso, en la voz de la rama
     {deseo}    la carta izquierda, citada tal cual
     {depende}  la carta derecha, citada tal cual
     {servicio} el nombre del trabajo que sigue
     {marca}    quien lo atiende
     {n} {de}   ronda actual y total

   NO SE FELICITA A NADIE. Ni «buena elección» ni «vas por buen camino».
   Quien contesta no esta haciendo un examen.

   PALABRAS QUE NO SE USAN: transformar, potenciar, impulsar, solucion
   integral, experiencia 360, ecosistema.

   EL ESPAÑOL ES EL ORIGINAL; los otros cuatro son traduccion. */

export const RUTA = {
  /* ---- La entrada ---- */
  titulo: {
    es: 'Dar el primer paso',
    en: 'Take the first step',
    pt: 'Dar o primeiro passo',
    fr: 'Faire le premier pas',
    it: 'Fare il primo passo'
  },
  entrada: {
    es: 'Son cinco preguntas. En cada una eliges lo que quieres, y yo te digo de qué depende. Al final sabrás en qué paso del camino estás.',
    en: 'Five questions. In each one you pick what you want, and I tell you what it depends on. At the end you will know which step of the path you are on.',
    pt: 'São cinco perguntas. Em cada uma escolhes o que queres, e eu digo-te de que depende. No fim saberás em que passo do caminho estás.',
    fr: 'Cinq questions. À chacune tu choisis ce que tu veux, et je te dis de quoi ça dépend. À la fin tu sauras à quelle étape du chemin tu es.',
    it: 'Sono cinque domande. In ognuna scegli cosa vuoi, e io ti dico da cosa dipende. Alla fine saprai a che passo del cammino sei.'
  },
  empezar: {
    es: 'Empezar', en: 'Start', pt: 'Começar', fr: 'Commencer', it: 'Iniziare'
  },

  /* ---- El aviso de lo que se guarda. Una linea, y con salida. ---- */
  aviso: {
    es: 'Se guardan las respuestas sin ningún dato tuyo: ni nombre, ni correo, ni teléfono.',
    en: 'Answers are saved without any of your details: no name, no email, no phone.',
    pt: 'As respostas são guardadas sem nenhum dado teu: nem nome, nem email, nem telefone.',
    fr: 'Les réponses sont enregistrées sans aucune de tes données : ni nom, ni e-mail, ni téléphone.',
    it: 'Le risposte si salvano senza nessun tuo dato: né nome, né email, né telefono.'
  },
  avisoSalir: {
    es: 'No guardar nada', en: 'Do not save anything', pt: 'Não guardar nada',
    fr: 'Ne rien enregistrer', it: 'Non salvare niente'
  },
  avisoFuera: {
    es: 'Listo, no se guarda nada de este recorrido.',
    en: 'Done, nothing from this run is saved.',
    pt: 'Pronto, não se guarda nada deste percurso.',
    fr: 'C’est fait, rien de ce parcours n’est enregistré.',
    it: 'Fatto, di questo percorso non si salva niente.'
  },

  /* ---- Paso 0: la bifurcacion ---- */
  bifurcacion: {
    es: '¿Vienes por ti o por tu negocio?',
    en: 'Are you here for yourself or for your business?',
    pt: 'Vens por ti ou pelo teu negócio?',
    fr: 'Tu viens pour toi ou pour ton activité ?',
    it: 'Vieni per te o per la tua attività?'
  },
  ramas: {
    mi: {
      es: 'Por mí', en: 'For myself', pt: 'Por mim', fr: 'Pour moi', it: 'Per me'
    },
    negocio: {
      es: 'Por mi negocio', en: 'For my business', pt: 'Pelo meu negócio',
      fr: 'Pour mon activité', it: 'Per la mia attività'
    },
    marca: {
      es: 'Por mi marca personal', en: 'For my personal brand', pt: 'Pela minha marca pessoal',
      fr: 'Pour ma marque personnelle', it: 'Per il mio marchio personale'
    }
  },

  /* ---- Las rondas ---- */
  ronda: {
    es: 'Ronda {n} de {de}', en: 'Round {n} of {de}', pt: 'Ronda {n} de {de}',
    fr: 'Manche {n} sur {de}', it: 'Turno {n} di {de}'
  },
  quiero: {
    es: 'Lo que quiero', en: 'What I want', pt: 'O que quero',
    fr: 'Ce que je veux', it: 'Quello che voglio'
  },
  deQueDepende: {
    es: 'De qué depende', en: 'What it depends on', pt: 'De que depende',
    fr: 'De quoi ça dépend', it: 'Da cosa dipende'
  },
  bocaAbajo: {
    es: 'Elige una carta y esta se voltea.',
    en: 'Pick a card and this one turns over.',
    pt: 'Escolhe uma carta e esta vira-se.',
    fr: 'Choisis une carte et celle-ci se retourne.',
    it: 'Scegli una carta e questa si gira.'
  },
  atras: {
    es: 'Atrás', en: 'Back', pt: 'Atrás', fr: 'Retour', it: 'Indietro'
  },
  seguir: {
    es: 'Seguir', en: 'Next', pt: 'Seguir', fr: 'Suivant', it: 'Avanti'
  },
  verResultado: {
    es: 'Ver dónde estoy', en: 'See where I am', pt: 'Ver onde estou',
    fr: 'Voir où j’en suis', it: 'Vedere dove sono'
  },

  /* ---- El resultado ---- */
  dondeEstas: {
    es: 'Dónde estás', en: 'Where you are', pt: 'Onde estás', fr: 'Où tu en es', it: 'Dove sei'
  },
  estasEn: {
    es: 'Estás en {paso}: {lema}.',
    en: 'You are at {paso}: {lema}.',
    pt: 'Estás n{paso}: {lema}.',
    fr: 'Tu es à {paso} : {lema}.',
    it: 'Sei a {paso}: {lema}.'
  },

  emetTitulo: {
    es: 'Lo que pides y lo que necesitas coinciden',
    en: 'What you ask for and what you need match',
    pt: 'O que pedes e o que precisas coincidem',
    fr: 'Ce que tu demandes et ce dont tu as besoin coïncident',
    it: 'Quello che chiedi e quello che ti serve coincidono'
  },
  emetCuerpo: {
    es: 'Sabes dónde estás parado y lo que pides es lo que te sirve. No hay que corregir el rumbo: hay que hacer el trabajo.',
    en: 'You know where you stand and what you ask for is what serves you. There is no course to correct: there is work to do.',
    pt: 'Sabes onde estás e o que pedes é o que te serve. Não há rumo a corrigir: há trabalho a fazer.',
    fr: 'Tu sais où tu en es et ce que tu demandes est ce qui te sert. Il n’y a pas de cap à corriger : il y a du travail à faire.',
    it: 'Sai dove sei e quello che chiedi è quello che ti serve. Non c’è rotta da correggere: c’è lavoro da fare.'
  },

  metTitulo: {
    es: 'Estás construyendo sobre un inicio que todavía no existe',
    en: 'You are building on a start that does not exist yet',
    pt: 'Estás a construir sobre um início que ainda não existe',
    fr: 'Tu construis sur un début qui n’existe pas encore',
    it: 'Stai costruendo su un inizio che ancora non esiste'
  },
  metCuerpo: {
    es: 'Lo que pides vive más adelante que lo que necesitas. No te equivocaste: empezaste por donde empieza todo el mundo, por la parte que se ve.',
    en: 'What you ask for lives further along than what you need. You did not get it wrong: you started where everyone starts, at the part that shows.',
    pt: 'O que pedes vive mais à frente do que precisas. Não te enganaste: começaste por onde toda a gente começa, pela parte que se vê.',
    fr: 'Ce que tu demandes se situe plus loin que ce dont tu as besoin. Tu ne t’es pas trompé : tu as commencé là où tout le monde commence, par la partie qui se voit.',
    it: 'Quello che chiedi sta più avanti di quello che ti serve. Non hai sbagliato: hai iniziato da dove inizia tutti, dalla parte che si vede.'
  },

  pruebaTitulo: {
    es: 'Con tus propias cartas',
    en: 'In your own cards',
    pt: 'Com as tuas próprias cartas',
    fr: 'Avec tes propres cartes',
    it: 'Con le tue stesse carte'
  },
  prueba: {
    es: 'Pediste «{deseo}», y eso depende de {depende}',
    en: 'You asked for “{deseo}”, and that depends on {depende}',
    pt: 'Pediste «{deseo}», e isso depende de {depende}',
    fr: 'Tu as demandé « {deseo} », et cela dépend de {depende}',
    it: 'Hai chiesto «{deseo}», e questo dipende da {depende}'
  },

  queSigue: {
    es: 'Qué sigue', en: 'What comes next', pt: 'O que segue', fr: 'La suite', it: 'Cosa segue'
  },
  incluye: {
    es: 'Incluye', en: 'Includes', pt: 'Inclui', fr: 'Comprend', it: 'Include'
  },
  dura: {
    es: 'Dura', en: 'Takes', pt: 'Dura', fr: 'Durée', it: 'Dura'
  },
  precio: {
    es: 'El precio lo hablamos por WhatsApp, cuando ya sepamos de qué tamaño es el trabajo.',
    en: 'We talk about the price on WhatsApp, once we know how big the work is.',
    pt: 'O preço falamos por WhatsApp, quando já soubermos do tamanho do trabalho.',
    fr: 'On parle du prix sur WhatsApp, une fois qu’on sait la taille du travail.',
    it: 'Del prezzo parliamo su WhatsApp, quando sapremo quanto è grande il lavoro.'
  },
  atiende: {
    es: 'Lo atiende {marca}', en: 'Handled by {marca}', pt: 'Atende {marca}',
    fr: 'Pris en charge par {marca}', it: 'Se ne occupa {marca}'
  },

  /* Marca que todavia no ha abierto. Se dice, no se esconde. */
  noAbierta: {
    es: '{marca} todavía no está abierta. El trabajo existe y lo hago yo mientras tanto; si prefieres esperar a que abra, te aviso.',
    en: '{marca} is not open yet. The work exists and I do it myself in the meantime; if you would rather wait until it opens, I will let you know.',
    pt: '{marca} ainda não está aberta. O trabalho existe e faço-o eu entretanto; se preferires esperar que abra, eu aviso-te.',
    fr: '{marca} n’est pas encore ouverte. Le travail existe et je le fais moi-même en attendant ; si tu préfères attendre l’ouverture, je te préviens.',
    it: '{marca} non è ancora aperta. Il lavoro esiste e lo faccio io nel frattempo; se preferisci aspettare l’apertura, ti avviso.'
  },
  listaEspera: {
    es: 'Avísame cuando abra', en: 'Tell me when it opens', pt: 'Avisa-me quando abrir',
    fr: 'Préviens-moi à l’ouverture', it: 'Avvisami quando apre'
  },

  noNecesitas: {
    es: 'Qué no necesitas todavía',
    en: 'What you do not need yet',
    pt: 'O que não precisas ainda',
    fr: 'Ce dont tu n’as pas encore besoin',
    it: 'Cosa non ti serve ancora'
  },

  /* ---- Si está bien en los tres pasos: no se le vende nada ---- */
  equilibrioTitulo: {
    es: 'No tengo nada que venderte hoy',
    en: 'I have nothing to sell you today',
    pt: 'Não tenho nada para te vender hoje',
    fr: 'Je n’ai rien à te vendre aujourd’hui',
    it: 'Non ho niente da venderti oggi'
  },
  equilibrioCuerpo: {
    es: 'Tus cartas caen en los tres pasos y en todas coincide lo que pides con lo que necesitas. Sigue con lo que estás haciendo.',
    en: 'Your cards fall across all three steps, and in every one what you ask for matches what you need. Keep doing what you are doing.',
    pt: 'As tuas cartas caem nos três passos e em todas coincide o que pedes com o que precisas. Continua com o que estás a fazer.',
    fr: 'Tes cartes tombent sur les trois étapes et partout ce que tu demandes correspond à ce dont tu as besoin. Continue ce que tu fais.',
    it: 'Le tue carte cadono su tutti e tre i passi e in ognuna coincide quello che chiedi con quello che ti serve.  Continua con quello che stai facendo.'
  },
  equilibrioSeisMeses: {
    es: 'Vuelve a medir en seis meses. Si algo se movió, aquí estará.',
    en: 'Measure again in six months. If something has shifted, it will show here.',
    pt: 'Volta a medir daqui a seis meses. Se algo se mexeu, estará aqui.',
    fr: 'Remesure dans six mois. Si quelque chose a bougé, ça se verra ici.',
    it: 'Rimisura tra sei mesi. Se qualcosa si è mosso, si vedrà qui.'
  },

  /* ---- La salida ---- */
  escribir: {
    es: 'Escribirme por WhatsApp', en: 'Message me on WhatsApp', pt: 'Escrever-me por WhatsApp',
    fr: 'M’écrire sur WhatsApp', it: 'Scrivermi su WhatsApp'
  },
  /* El mensaje ya nombra el paso, el diagnostico y el trabajo: quien lo
     recibe no tiene que preguntar por donde iba la conversacion. */
  mensaje: {
    es: 'Hola Juanjo. Hice la ruta y me salió {paso}, {diagnostico}. Lo que sigue sería «{servicio}». ¿Lo hablamos?',
    en: 'Hi Juanjo. I did the path and got {paso}, {diagnostico}. What comes next would be “{servicio}”. Can we talk?',
    pt: 'Olá Juanjo. Fiz o percurso e deu-me {paso}, {diagnostico}. O que segue seria «{servicio}». Falamos?',
    fr: 'Salut Juanjo. J’ai fait le parcours et j’ai eu {paso}, {diagnostico}. La suite serait « {servicio} ». On en parle ?',
    it: 'Ciao Juanjo. Ho fatto il percorso e mi è uscito {paso}, {diagnostico}. Quello che segue sarebbe «{servicio}». Ne parliamo?'
  },
  mensajeEquilibrio: {
    es: 'Hola Juanjo. Hice la ruta y me salió que estoy bien en los tres pasos. Te escribo por si acaso.',
    en: 'Hi Juanjo. I did the path and it says I am fine across all three steps. Writing just in case.',
    pt: 'Olá Juanjo. Fiz o percurso e deu que estou bem nos três passos. Escrevo por via das dúvidas.',
    fr: 'Salut Juanjo. J’ai fait le parcours et il dit que je suis bien sur les trois étapes. Je t’écris au cas où.',
    it: 'Ciao Juanjo. Ho fatto il percorso e dice che sto bene su tutti e tre i passi. Ti scrivo per sicurezza.'
  },
  mensajeEspera: {
    es: 'Hola Juanjo. Hice la ruta y me salió {paso}. Avísame cuando {marca} abra.',
    en: 'Hi Juanjo. I did the path and got {paso}. Let me know when {marca} opens.',
    pt: 'Olá Juanjo. Fiz o percurso e deu-me {paso}. Avisa-me quando {marca} abrir.',
    fr: 'Salut Juanjo. J’ai fait le parcours et j’ai eu {paso}. Préviens-moi quand {marca} ouvrira.',
    it: 'Ciao Juanjo. Ho fatto il percorso e mi è uscito {paso}. Avvisami quando {marca} apre.'
  },
  /* Lo que se mete en {diagnostico} del mensaje. */
  dxEmet: {
    es: 'que lo que pido y lo que necesito coinciden',
    en: 'that what I ask for and what I need match',
    pt: 'que o que peço e o que preciso coincidem',
    fr: 'que ce que je demande et ce dont j’ai besoin coïncident',
    it: 'che quello che chiedo e quello che mi serve coincidono'
  },
  /* No repite la palabra del paso: el mensaje ya dice «me salio el
     inicio», y «el inicio … un inicio» en la misma linea suena a error. */
  dxMet: {
    es: 'que voy por delante de lo que todavía me falta',
    en: 'that I am ahead of what I am still missing',
    pt: 'que vou à frente do que ainda me falta',
    fr: 'que je suis en avance sur ce qui me manque encore',
    it: 'che sono avanti rispetto a quello che ancora mi manca'
  },

  otraVez: {
    es: 'Hacerlo otra vez', en: 'Do it again', pt: 'Fazer outra vez',
    fr: 'Recommencer', it: 'Rifarlo'
  },

  /* Sin JavaScript no hay juego: se dice y se ofrece la puerta de siempre. */
  sinGuion: {
    es: 'Esta ruta necesita JavaScript para funcionar. Si no lo tienes, escríbeme y la hacemos hablando.',
    en: 'This path needs JavaScript to work. If you do not have it, write to me and we will do it by talking.',
    pt: 'Este percurso precisa de JavaScript para funcionar. Se não o tens, escreve-me e fazemo-lo a falar.',
    fr: 'Ce parcours a besoin de JavaScript. Si tu ne l’as pas, écris-moi et on le fera en parlant.',
    it: 'Questo percorso ha bisogno di JavaScript. Se non ce l’hai, scrivimi e lo facciamo parlando.'
  }
};

/* Coge el idioma que toque y, si falta, el español. */
export const di = (campo, lang) => (campo ? (campo[lang] ?? campo.es) : '');

/* Rellena {llaves}. */
export const rellenar = (plantilla, datos) =>
  String(plantilla).replace(/\{(\w+)\}/g, (_, k) => (k in datos ? datos[k] : `{${k}}`));
