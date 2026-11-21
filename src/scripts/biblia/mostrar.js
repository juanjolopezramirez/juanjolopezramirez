/* EL TEXTO LISTO PARA LEER (puro: entra texto, sale texto; quien lo pinta usa textContent).

     textoParaLeer(t, { version, libro, cap, v }) → string

   Solo toca la Reina-Valera 1909, y solo lo que en la edicion impresa era tipografia, no texto:
     - los corchetes de las palabras que anadieron los traductores (en papel, cursiva): «[sea]» → «sea»;
     - las versalitas del comienzo de capitulo o de un salmo: «EN el principio» → «En el principio»,
       «JEHOVÁ es mi pastor» → «Jehová es mi pastor», «DE SIETE años» → «De siete años», «¡OH Jehová» → «¡Oh Jehová».
       Solo un tramo en mayusculas al empezar el versiculo o tras «. ! ?» o «¡ ¿» y seguido de una palabra que no va toda
       en mayusculas («Y CONOCIÓ Adam» → «Y conoció Adam»);
       las inscripciones («ESTE ES JESUS EL REY DE LOS JUDIOS», «JAH» a media frase) se quedan como estan;
     - los rotulos hebreos del Salmo 119 (ALEPH., BETH, ... TAU.) en los versiculos 1, 9, 17, ...
   La World English Bible no se toca: sus mayusculas son inscripciones de verdad y su nombre exige no cambiar el texto
   (por eso su «ALEPH» de Salmo 119:1, que viene asi de eBible.org, tambien se queda).
   Texto vacio → '' (quien llama muestra una nota: la version omite ese versiculo). */

const ROTULOS_119 = /^(?:ALEPH|BETH|GIMEL|DALETH|HE|VAU|ZAIN|CHETH|HETH|TETH|JOD|YOD|CAPH|KAPH|LAMED|MEM|NUN|SAMECH|AIN|PE|TZADDI|COPH|KOPH|RESH|SIN|SCHIN|SHIN|TAU)\.?\s+/u;
/* Nombres que siguen con mayuscula cuando no son la primera palabra del tramo («Y DIJO JEHOVÁ» → «Y dijo Jehová»). */
const PROPIOS = new Set(['JEHOVÁ', 'JAH', 'DIOS', 'JESÚS', 'JESUS', 'CRISTO', 'SEÑOR', 'DAVID', 'PABLO', 'PEDRO', 'SALOMÓN', 'ISRAEL', 'MOISÉS', 'ABRAHAM', 'JACOB', 'JUDÁ', 'JERUSALEM', 'SIÓN', 'EGIPTO', 'BABILONIA']);
const VERSALITAS = /(^|[.!?]\s+|[¡¿])([¡¿“«(]*)((?:\p{Lu}\s+)?)(\p{Lu}{2,}(?:\s+\p{Lu}{2,})*)(?=[\s,;:.!?»”)]*\p{Lu}?\p{Ll})/gu;

/* La escritura en la pared (Daniel 5:25-28) es inscripcion aunque abra el versiculo. */
const INSCRIPCIONES = new Set(['MENE', 'TEKEL', 'PERES', 'UPHARSIN']);

const capital = (w) => w.charAt(0) + w.slice(1).toLowerCase();

function sinVersalitas(t) {
  return t.replace(VERSALITAS, (todo, antes, signos, letra, tramo) => {
    if (INSCRIPCIONES.has(tramo.split(/\s+/)[0])) return todo;
    const palabras = tramo.split(/(\s+)/);
    let primera = !letra;
    const hecho = palabras.map((w) => {
      if (/^\s+$/.test(w)) return w;
      if (primera) { primera = false; return capital(w); }
      return PROPIOS.has(w) ? capital(w) : w.toLowerCase();
    }).join('');
    return antes + signos + letra + hecho;
  });
}

export function textoParaLeer(t, { version, libro, cap, v } = {}) {
  if (typeof t !== 'string' || !t) return '';
  if (version !== 'rv1909') return t;
  let s = t.replace(/\[([^[\]]*)\]/g, '$1').replace(/[[\]]/g, '');
  if (libro === 'PSA' && cap === 119 && Number.isInteger(v) && v % 8 === 1) s = s.replace(ROTULOS_119, '');
  s = sinVersalitas(s);
  return s.replace(/\s{2,}/g, ' ').trim();
}
