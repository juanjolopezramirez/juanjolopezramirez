import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

function CardSeal() {
  return <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
    <path d="M40 5 75 40 40 75 5 40Z M40 14 66 40 40 66 14 40Z" stroke="currentColor" />
    <circle cx="33" cy="40" r="12" stroke="currentColor" />
    <circle cx="47" cy="40" r="12" stroke="currentColor" />
    <circle cx="40" cy="40" r="2" fill="currentColor" />
  </svg>;
}

export default function WritingDeck({ words, setWords, error, reduced }) {
  const [active, setActive] = useState(0);
  const [covered, setCovered] = useState([false, false, false]);
  const [announcement, setAnnouncement] = useState('');
  const [direction, setDirection] = useState(0);
  const input = useRef(null);
  const invalid = Boolean(error.message) && error.field === `word-${active}`;
  const hidden = covered[active];
  const filled = words.map((word) => Boolean(word.trim()));

  useEffect(() => {
    if (!error.message || !error.field.startsWith('word-')) return;
    const index = Number(error.field.slice(5));
    setDirection(0);
    setActive(index);
    setCovered((cards) => cards.map((value, position) => position === index ? false : value));
  }, [error]);

  useEffect(() => {
    if (invalid && !hidden) input.current?.focus();
  }, [invalid, hidden, error]);

  function select(index) {
    if (index < 0 || index >= words.length || index === active) return;
    setCovered((cards) => cards.map((value, position) => position === active ? value || filled[active] : value));
    setDirection(Math.sign(index - active));
    setActive(index);
    setAnnouncement(`Carta ${index + 1} de ${words.length}.`);
  }

  function flip() {
    setDirection(0);
    setCovered((cards) => cards.map((value, index) => index === active ? !value : value));
    setAnnouncement(hidden ? 'Carta abierta.' : 'Carta boca abajo.');
  }

  function move(offset) {
    const target = active + offset;
    if (target < 0 || target >= words.length) return;
    const swap = (items) => items.map((item, index) =>
      index === active ? items[target] : index === target ? items[active] : item);
    setWords(swap);
    setCovered(swap);
    setDirection(offset);
    setActive(target);
    setAnnouncement(`Carta movida a la posición ${target + 1}.`);
  }

  return <div className="ums-writing-deck">
    <nav className="ums-deck-index" aria-label="Orden de las cartas">
      {words.map((_, index) => <button type="button" key={index} aria-current={active === index ? 'step' : undefined}
        aria-label={`Carta ${index + 1}, ${filled[index] ? 'con respuesta' : 'vacía'}`} onClick={() => select(index)}>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <span>{filled[index] ? 'Escrita' : 'Vacía'}</span>
      </button>)}
    </nav>
    <div className="ums-card-stack">
      <motion.div className={`ums-writing-card ${hidden ? 'ums-writing-card--back' : ''}`}
        key={`${active}-${hidden}`}
        initial={reduced ? false : { x: direction * 34, rotate: direction * 4, rotateY: direction ? 0 : -64, opacity: .35 }}
        animate={{ x: 0, rotate: 0, rotateY: 0, opacity: 1 }}
        transition={{ duration: reduced ? 0 : .28, ease: 'easeOut' }}>
        <motion.div className="ums-card-swipe" drag="x" dragConstraints={{ left: 0, right: 0 }}
          dragElastic={reduced ? 0 : .22} dragMomentum={false}
          onDragEnd={(_, { offset, velocity }) => {
            const horizontal = Math.abs(offset.x) > Math.abs(offset.y) * 1.4;
            if (horizontal && (Math.abs(offset.x) > 48 || (Math.abs(offset.x) > 16 && Math.abs(velocity.x) > 450))) {
              select(active + (offset.x < 0 ? 1 : -1));
            }
          }}>
          <span>Carta {active + 1} de {words.length}</span><CardSeal />
        </motion.div>
        {hidden ? <div className="ums-card-back-copy"><CardSeal /><p>Respuesta oculta</p></div> :
          <label className="ums-field ums-card-entry" htmlFor={`word-${active}`}>
            Respuesta {active + 1}
            <input ref={input} id={`word-${active}`} value={words[active]} autoComplete="off" maxLength={32}
              placeholder="Por ejemplo, Toy Story" aria-invalid={invalid || undefined}
              aria-describedby={invalid ? 'form-error' : undefined}
              onChange={(event) => setWords((previous) => previous.map((word, index) => index === active ? event.target.value : word))} />
          </label>}
      </motion.div>
    </div>
    <div className="ums-deck-actions" aria-label="Controles de la carta">
      <button type="button" className="ums-secondary" onClick={flip}>{hidden ? 'Mostrar respuesta' : 'Voltear carta'}</button>
      <button type="button" className="ums-secondary" aria-disabled={active === 0} onClick={() => move(-1)}>Mover antes</button>
      <button type="button" className="ums-secondary" aria-disabled={active === words.length - 1} onClick={() => move(1)}>Mover después</button>
    </div>
    <span className="ums-visually-hidden" role="status">{announcement}</span>
  </div>;
}
