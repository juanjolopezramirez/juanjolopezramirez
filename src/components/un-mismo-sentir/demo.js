export const ROOM = 'SENTIR';
export const WRITING_TIMES = { categoria: 45, respuestas: 45, autor: 25 };
// Three comparisons per player and half-point group bonuses fit in sixths.
export const SCORE_UNITS = 6;
export const GUESTS = ['Inés', 'Mateo', 'Lucía'];
export const ORIGINAL_PAIRS = [[0, 1], [2, 3]];

export const ROUND_FORMATS = {
  originales: ['Parejas originales', 'Conserva las parejas con las que empezó la partida.'],
  autor: ['Parejas del autor', 'Quien propuso la categoría forma las parejas.'],
  azar: ['Parejas al azar', 'La sala sortea las parejas de esta ronda.'],
  individual: ['Individual', 'Cada persona compara sus cartas con las del resto.'],
  perspectiva: ['Perspectiva', 'La sala intenta anticipar las cartas de una persona.'],
};

export function makePairs(format, author, partner) {
  if (format === 'originales') return ORIGINAL_PAIRS;
  const first = format === 'autor' ? author : 0;
  const others = [0, 1, 2, 3].filter((index) => index !== first);
  const second = format === 'autor' && others.includes(partner)
    ? partner : others[Math.floor(Math.random() * others.length)];
  return [[first, second], others.filter((index) => index !== second)]
    .map((pair) => pair.sort((a, b) => a - b)).sort((a, b) => a[0] - b[0]);
}
export const MODES = {
  parejas: ['Parejas', 'Encuentra coincidencias con tu compañero.'],
  equipos: ['Equipos', 'Suma las coincidencias de tu equipo.'],
  individual: ['Individual', 'Compara tus palabras con las de toda la sala.'],
  perspectiva: ['Perspectiva', 'Piensa como la persona elegida para esta ronda.'],
};

export const ROUNDS = [
  { category: 'Una tarde de lluvia', author: 1, words: [['café', 'libro', 'manta'], ['manta', 'café', 'ventana'], ['café', 'música', 'manta']] },
  { category: 'Algo que llevarías de viaje', author: 2, words: [['mapa', 'agua', 'libro'], ['agua', 'mapa', 'cámara'], ['mapa', 'ropa', 'agua']] },
  { category: 'Un domingo perfecto', author: 3, words: [['familia', 'paseo', 'café'], ['paseo', 'familia', 'cine'], ['familia', 'café', 'paseo']] },
];

export function normalize(value) {
  return value.trim().toLocaleLowerCase('es').normalize('NFD')
    .replace(/([aeiou])\p{M}+/gu, '$1').normalize('NFC').replace(/\s+/g, ' ');
}

export function validAnswer(value) {
  return /^[\p{L}\p{N}]+(?:(?:[ ’'-]|: ?)[\p{L}\p{N}]+)*$/u.test(normalize(value));
}

export function points(left, right) {
  const comparable = right.map(normalize);
  return left.reduce((score, word, index) => score + matchPoints(normalize(word), index, comparable), 0);
}

export function matchPoints(word, position, comparable) {
  const match = comparable.indexOf(word);
  return match === position ? 2 : match >= 0 ? 1 : 0;
}

export function ranking(mode, players, lists, target, pairs = ORIGINAL_PAIRS) {
  if (mode === 'parejas' || mode === 'equipos') {
    return pairs.map(([left, right], index) => ({
      id: index,
      members: [left, right],
      name: mode === 'equipos' ? `Equipo ${index + 1}` : `Pareja ${index + 1}`,
      detail: `${players[left]} y ${players[right]}`,
      score: points(lists[left], lists[right]),
    }));
  }
  return players.map((name, index) => {
    const other = lists.filter((_, listIndex) => listIndex !== index);
    const average = other.reduce((sum, list) => sum + points(lists[index], list), 0) / other.length;
    const score = mode === 'perspectiva' && index !== target ? points(lists[index], lists[target]) : average;
    return { id: index, name, score };
  });
}

export const formatScore = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format;
