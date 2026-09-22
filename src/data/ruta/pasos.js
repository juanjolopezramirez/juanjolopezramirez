/* LOS TRES PASOS DEL CAMINO, y como se nombran segun quien camina.

   El metodo se llama Emet y tiene tres pasos: el inicio, el medio y el fin.
   Aqui no se explica de donde viene el nombre ni que quiere decir. Es el
   nombre del metodo y ya; quien tenga curiosidad preguntara.

   LA VOZ CAMBIA CON LA RAMA, y no es un adorno. De un negocio se dice que
   lo vean, que le crean y que vuelvan: el sujeto es la gente de fuera. De
   una persona —y de una marca personal, que es una persona con nombre de
   marca— se dice en reflexivo: que te veas, que te creas, que vuelvas. Es
   el mismo paso mirado desde dentro.

     'tu'         el negocio. Que te vean · que te crean · que vuelvan.
     'reflexivo'  la persona y la marca personal. Que te veas · que te
                  creas · que vuelvas.

   SIN EL INICIO NO HAY NADA QUE SOSTENER. Es la unica idea del metodo que
   hace falta entender para leer el resultado, y por eso esta escrita en
   `falta` con palabras de todos los dias: todo funciona y nada significa.

   `orden` es lo que permite comparar un paso con otro: si lo que alguien
   quiere vive en un paso posterior a lo que necesita, esta construyendo el
   tejado antes que el piso. Esa cuenta vive en scripts/ruta.js. */

export const PASOS = ['alef', 'mem', 'tav'];

export const ORDEN = { alef: 0, mem: 1, tav: 2 };

export const PASO = {
  alef: {
    orden: 0,
    nombre: {
      es: 'El inicio', en: 'The start', pt: 'O início', fr: 'Le début', it: 'L’inizio'
    },
    /* La promesa del paso, en la voz de cada rama. */
    lema: {
      tu: {
        es: 'Que te vean', en: 'That they see you', pt: 'Que te vejam',
        fr: 'Qu’on te voie', it: 'Che ti vedano'
      },
      reflexivo: {
        es: 'Que te veas', en: 'That you see yourself', pt: 'Que te vejas',
        fr: 'Que tu te voies', it: 'Che tu ti veda'
      }
    },
    que: {
      es: 'Saber qué te distingue y mostrarlo igual en todas partes.',
      en: 'Knowing what sets you apart and showing it the same way everywhere.',
      pt: 'Saber o que te distingue e mostrá-lo igual em todo o lado.',
      fr: 'Savoir ce qui te distingue et le montrer pareil partout.',
      it: 'Sapere cosa ti distingue e mostrarlo uguale ovunque.'
    }
  },
  mem: {
    orden: 1,
    nombre: {
      es: 'El medio', en: 'The middle', pt: 'O meio', fr: 'Le milieu', it: 'Il mezzo'
    },
    lema: {
      tu: {
        es: 'Que te crean', en: 'That they believe you', pt: 'Que acreditem em ti',
        fr: 'Qu’on te croie', it: 'Che ti credano'
      },
      reflexivo: {
        es: 'Que te creas', en: 'That you believe yourself', pt: 'Que acredites em ti',
        fr: 'Que tu te croies', it: 'Che tu ci creda'
      }
    },
    que: {
      es: 'Que la experiencia confirme lo que prometiste.',
      en: 'That the experience confirms what you promised.',
      pt: 'Que a experiência confirme o que prometeste.',
      fr: 'Que l’expérience confirme ce que tu as promis.',
      it: 'Che l’esperienza confermi quello che hai promesso.'
    }
  },
  tav: {
    orden: 2,
    nombre: {
      es: 'El fin', en: 'The end', pt: 'O fim', fr: 'La fin', it: 'La fine'
    },
    lema: {
      tu: {
        es: 'Que vuelvan', en: 'That they come back', pt: 'Que voltem',
        fr: 'Qu’on revienne', it: 'Che tornino'
      },
      reflexivo: {
        es: 'Que vuelvas', en: 'That you come back', pt: 'Que voltes',
        fr: 'Que tu reviennes', it: 'Che tu torni'
      }
    },
    que: {
      es: 'Que quede algo cuando terminas, y por eso regresen.',
      en: 'That something remains when you finish, and that is why they return.',
      pt: 'Que fique algo quando terminas, e por isso regressem.',
      fr: 'Qu’il reste quelque chose quand tu finis, et que l’on revienne pour ça.',
      it: 'Che resti qualcosa quando finisci, e per questo tornino.'
    }
  }
};

/* Lo que pasa cuando se construye el medio y el fin sobre un inicio que no
   existe. Se dice sin humillar: nadie se equivoco, empezo por donde empieza
   todo el mundo. */
export const FALTA = {
  es: 'Todo funciona y nada significa.',
  en: 'Everything works and nothing means anything.',
  pt: 'Tudo funciona e nada significa.',
  fr: 'Tout fonctionne et rien ne signifie.',
  it: 'Tutto funziona e niente significa.'
};
