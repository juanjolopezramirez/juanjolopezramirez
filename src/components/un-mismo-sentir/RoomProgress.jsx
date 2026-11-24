import React from 'react';

const simulatedTimings = [
  [900, 2400, 3800, 4500],
  [1300, 2700, 4100, 4900],
  [1850, 3150, 4600, 5400],
];

export const roomReadyAfter = Math.max(...simulatedTimings.map((times) => times[3]));

export default function RoomProgress({ players, words, submitted, elapsed }) {
  const rows = players.map((name, index) => {
    const timings = simulatedTimings[index - 1];
    return index === 0
      ? { name: `${name} (tú)`, cards: words.map((word) => Boolean(word.trim())), done: submitted }
      : { name, cards: timings.slice(0, 3).map((time) => elapsed >= time), done: elapsed >= timings[3] };
  });

  return <aside className="ums-room-progress" aria-labelledby="room-progress-title">
    <h2 id="room-progress-title">En la sala</h2>
    <p>{rows.filter(({ done }) => done).length} de {players.length} terminaron</p>
    <ul className="ums-progress-list">
      {rows.map(({ name, cards, done }, index) => <li key={index}>
        <div className="ums-progress-person">
          <strong>{name}</strong>
          <span className="ums-progress-connection">En línea</span>
        </div>
        <ul className="ums-progress-cards" aria-label={`Cartas de ${name}`}>
          {cards.map((written, position) => <li key={position} className={written ? 'is-written' : undefined}>
            <span aria-hidden="true">{position + 1}</span><span className="ums-visually-hidden">Carta {position + 1} {written ? 'escrita' : 'pendiente'}</span>
          </li>)}
        </ul>
        <small>{done ? 'Terminó' : 'Escribiendo'}</small>
      </li>)}
    </ul>
    <small className="ums-progress-note">Participación simulada</small>
  </aside>;
}
