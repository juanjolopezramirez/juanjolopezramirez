/* LOS DOS JUEGOS, Y LA MATRIZ QUE SALE DE CRUZARLOS.

   EISENHOWER NECESITA DOS EJES y una carta que se manda a un lado o al
   otro solo da uno. Hacerla entera a deslizamientos pediria dos pasadas
   sobre la baraja —treinta y cuatro gestos— y para el decimoquinto ya
   nadie esta leyendo. Asi que cada juego pone un eje:

     JUEGO 1 · deslizar  ->  URGENCIA      me urge / puede esperar
     JUEGO 2 · la lista  ->  IMPORTANCIA   primero / despues / algun dia / no va

   Cruzados dan la matriz completa, y aparece sola en el resultado sin que
   nadie haya tenido que rellenar cuatro cajas. Lo que la hace util no es
   el dibujo: es el cuadrante de lo urgente que no importa. Eso es lo que
   se lleva los dias, y solo se ve cuando los dos ejes ya estan puestos.

   LOS NIVELES SON SUYOS, no el esquema de letras de los juegos de pelea.
   Primero, despues, algun dia y no va: cuatro cosas que cualquiera sabe
   decir de una tarea sin que nadie le explique nada.

   `peso` ordena los niveles de mas a menos importante. `importa` es la
   linea que parte la matriz: primero y despues cuentan como importante,
   algun dia y no va, no.

   EL ESPAÑOL ES EL ORIGINAL; los otros cuatro son traduccion. */

/* ============================================================
   JUEGO 1 — DESLIZAR. El eje de la urgencia.
   ============================================================ */
export const URGENCIA = {
  pregunta: {
    es: '¿Esto te urge?',
    en: 'Is this urgent for you?',
    pt: 'Isto urge-te?',
    fr: 'C’est urgent pour toi ?',
    it: 'Questo ti urge?'
  },
  ayuda: {
    es: 'Manda la carta a la izquierda o a la derecha. Puedes devolverla si te arrepientes.',
    en: 'Send the card left or right. You can take it back if you change your mind.',
    pt: 'Manda a carta para a esquerda ou para a direita. Podes devolvê-la se mudares de ideias.',
    fr: 'Envoie la carte à gauche ou à droite. Tu peux la reprendre si tu changes d’avis.',
    it: 'Manda la carta a sinistra o a destra. Puoi riprenderla se cambi idea.'
  },
  si: {
    es: 'Me urge', en: 'Urgent', pt: 'Urge-me', fr: 'Urgent', it: 'Mi urge'
  },
  no: {
    es: 'Puede esperar', en: 'Can wait', pt: 'Pode esperar',
    fr: 'Peut attendre', it: 'Può aspettare'
  }
};

/* ============================================================
   JUEGO 2 — LA LISTA. El eje de la importancia.
   ============================================================ */
export const NIVELES = [
  {
    id: 'primero', peso: 3, importa: true,
    nombre: {
      es: 'Primero', en: 'First', pt: 'Primeiro', fr: 'D’abord', it: 'Prima'
    },
    pista: {
      es: 'Si esto no pasa, lo demás no importa.',
      en: 'If this does not happen, the rest does not matter.',
      pt: 'Se isto não acontecer, o resto não importa.',
      fr: 'Si ça n’arrive pas, le reste n’a pas d’importance.',
      it: 'Se questo non succede, il resto non conta.'
    }
  },
  {
    id: 'despues', peso: 2, importa: true,
    nombre: {
      es: 'Después', en: 'After that', pt: 'Depois', fr: 'Ensuite', it: 'Dopo'
    },
    pista: {
      es: 'Va, pero detrás de lo de arriba.',
      en: 'It goes, but behind what is above.',
      pt: 'Vai, mas atrás do de cima.',
      fr: 'Ça vient, mais après ce qui est au-dessus.',
      it: 'Ci va, ma dietro a quello sopra.'
    }
  },
  {
    id: 'algunDia', peso: 1, importa: false,
    nombre: {
      es: 'Algún día', en: 'Someday', pt: 'Um dia', fr: 'Un jour', it: 'Un giorno'
    },
    pista: {
      es: 'Me gustaría, pero no este año.',
      en: 'I would like to, but not this year.',
      pt: 'Gostaria, mas não este ano.',
      fr: 'J’aimerais, mais pas cette année.',
      it: 'Mi piacerebbe, ma non quest’anno.'
    }
  },
  {
    id: 'noVa', peso: 0, importa: false,
    nombre: {
      es: 'No va', en: 'Not for me', pt: 'Não vai', fr: 'Non merci', it: 'Non va'
    },
    pista: {
      es: 'Esto no es para mí.',
      en: 'This one is not for me.',
      pt: 'Isto não é para mim.',
      fr: 'Ce n’est pas pour moi.',
      it: 'Questo non fa per me.'
    }
  }
];

export const NIVEL = Object.fromEntries(NIVELES.map((n) => [n.id, n]));

/* ============================================================
   LA MATRIZ — lo que sale de cruzar los dos ejes.

   Los nombres no son los de un manual: «importante y no urgente» no le
   dice nada a nadie a las once de la noche. «Ponle fecha» si.
   ============================================================ */
export const CUADRANTES = {
  /* urgente + importante */
  ahora: {
    urgente: true, importa: true,
    nombre: { es: 'Ahora', en: 'Now', pt: 'Agora', fr: 'Maintenant', it: 'Adesso' },
    que: {
      es: 'Te urge y además importa. Es por donde se empieza.',
      en: 'Urgent and it matters. This is where you start.',
      pt: 'Urge-te e além disso importa. É por aqui que se começa.',
      fr: 'C’est urgent et ça compte. C’est par là qu’on commence.',
      it: 'Ti urge e per di più conta. È da qui che si comincia.'
    }
  },
  /* importante, no urgente */
  fecha: {
    urgente: false, importa: true,
    nombre: { es: 'Ponle fecha', en: 'Put a date on it', pt: 'Marca uma data', fr: 'Mets-y une date', it: 'Dagli una data' },
    que: {
      es: 'Importa y no te aprieta. Es lo que se deja para siempre, y lo que más rinde.',
      en: 'It matters and it is not pressing. This is what gets postponed forever, and what pays off most.',
      pt: 'Importa e não te aperta. É o que se deixa para sempre, e o que mais rende.',
      fr: 'Ça compte et ça ne presse pas. C’est ce qu’on repousse toujours, et ce qui rapporte le plus.',
      it: 'Conta e non ti stringe. È quello che si rimanda per sempre, e quello che rende di più.'
    }
  },
  /* urgente, no importante */
  roba: {
    urgente: true, importa: false,
    nombre: { es: 'Te roba el día', en: 'It eats your day', pt: 'Rouba-te o dia', fr: 'Ça te mange la journée', it: 'Ti ruba la giornata' },
    que: {
      es: 'Te aprieta pero tú mismo lo mandaste abajo. Esto es lo que se lleva las horas.',
      en: 'It presses you, but you sent it down yourself. This is what takes the hours.',
      pt: 'Aperta-te mas tu próprio o mandaste para baixo. Isto é o que leva as horas.',
      fr: 'Ça te presse, mais c’est toi qui l’as mis en bas. C’est ça qui prend les heures.',
      it: 'Ti stringe ma sei tu che l’hai mandato in fondo. È questo che si prende le ore.'
    }
  },
  /* ni lo uno ni lo otro */
  suelta: {
    urgente: false, importa: false,
    nombre: { es: 'Suéltalo', en: 'Let it go', pt: 'Larga', fr: 'Laisse tomber', it: 'Lascialo' },
    que: {
      es: 'Ni te urge ni lo pusiste arriba. No hace falta hacer nada con esto.',
      en: 'Not urgent and you did not put it up top. Nothing needs doing here.',
      pt: 'Nem te urge nem o puseste em cima. Não é preciso fazer nada com isto.',
      fr: 'Ni urgent ni placé en haut. Il n’y a rien à faire avec ça.',
      it: 'Né ti urge né l’hai messo in alto. Non serve farci niente.'
    }
  }
};

/* En que cuadrante cae una carta, cruzando los dos ejes. */
export const cuadranteDe = (urgente, nivelId) => {
  const importa = NIVEL[nivelId]?.importa ?? false;
  if (urgente && importa) return 'ahora';
  if (!urgente && importa) return 'fecha';
  if (urgente && !importa) return 'roba';
  return 'suelta';
};

/* CUANTAS CARTAS PASAN A LA LISTA. Ordenar diecisiete es un trabajo, no
   un juego; ordenar dos no dice nada. Pasan las que urgen, con un tope; y
   si urgieron muy pocas, se completa con las siguientes de la baraja para
   que la lista tenga con que compararse. */
export const LISTA_MAX = 6;
export const LISTA_MIN = 4;
