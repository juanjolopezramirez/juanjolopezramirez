import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import WritingDeck from './WritingDeck.jsx';
import RoomProgress, { roomReadyAfter } from './RoomProgress.jsx';
import { ROOM, SCORE_UNITS, GUESTS, MODES, ROUNDS, WRITING_TIMES, ORIGINAL_PAIRS, ROUND_FORMATS, makePairs, normalize, validAnswer, matchPoints, ranking, formatScore } from './demo.js';

const emptyWords = ['', '', ''];

function Cover({ mark, reduced }) {
  return <figure className="ums-cover">
    <div className="ums-cover-mark">
      <motion.svg viewBox="0 0 260 260" fill="none" aria-hidden="true"
        initial={reduced ? false : { opacity: 0, scale: .88 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduced ? 0 : .55, ease: 'easeOut' }}>
        <circle cx="130" cy="130" r="112" stroke="currentColor" strokeOpacity=".42" />
        <circle cx="130" cy="130" r="97" stroke="currentColor" strokeDasharray="1 8" strokeOpacity=".7" />
        <path d="M130 6v18m0 212v18M6 130h18m212 0h18" stroke="currentColor" strokeOpacity=".8" />
      </motion.svg>
      <img src={mark} width="19" height="32" alt="" />
    </div>
    <figcaption>El Ichthys de mi marca aparece donde se encuentran dos trazos. Al responder la misma pregunta, nosotros también descubrimos lo que compartimos.</figcaption>
  </figure>;
}

function ModeIcon({ mode }) {
  const paths = {
    parejas: <><circle cx="8" cy="12" r="4" /><circle cx="16" cy="12" r="4" /></>,
    equipos: <><path d="M3 8h7v8H3zM14 8h7v8h-7z" /></>,
    individual: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>,
    perspectiva: <><path d="M3 7a8 8 0 0 1 0 10m18-10a8 8 0 0 0 0 10" /><circle cx="12" cy="12" r="3" /></>,
  };
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">{paths[mode]}</svg>;
}

function Action({ children, onClick, secondary = false, type = 'button', disabled, busy }) {
  return <button type={type} className={secondary ? 'ums-secondary' : 'ums-primary'}
    onClick={onClick} disabled={disabled} aria-disabled={busy || undefined}>{children}</button>;
}

function Field({ id, label, error, ...props }) {
  return <label className="ums-field" htmlFor={id}>
    {label}
    <input id={id} aria-invalid={error || undefined} aria-describedby={error ? 'form-error' : undefined} {...props} />
  </label>;
}

function ErrorText({ message }) {
  return message && <p className="ums-error" id="form-error" role="alert">{message}</p>;
}

function Countdown({ deadline, children }) {
  const [remaining, setRemaining] = useState(() => Math.ceil((deadline - Date.now()) / 1000));
  useEffect(() => {
    const refresh = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    const timer = window.setInterval(refresh, 200);
    return () => window.clearInterval(timer);
  }, [deadline]);
  return <div className="ums-clock"><time dateTime={`PT${remaining}S`}>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</time>{children}</div>;
}

const wheelDuration = 2.15;
const wheelEase = [.12, .7, .15, 1];

function Wheel({ options, winner, spinning, reduced, onStop }) {
  const shorten = (text) => Array.from(text).length > 17 ? `${Array.from(text).slice(0, 16).join('')}…` : text;
  const segment = 360 / options.length;
  const center = (index) => segment * (index + .5);
  const angle = winner === undefined ? 0 : 1440 - center(winner);
  const point = (position) => [150 + 128 * Math.sin(position * Math.PI / 180), 150 - 128 * Math.cos(position * Math.PI / 180)];
  return <div className={`ums-wheel ${spinning ? 'is-spinning' : ''}`} aria-hidden="true">
    <motion.span className="ums-wheel-pointer" key={reduced ? 'pointer-still' : 'pointer-animated'} initial={false}
      animate={{ rotate: spinning && !reduced ? [0, -12, 8, -10, 7, -9, 6, -6, 4, -3, 0] : 0 }}
      transition={spinning && !reduced ? { duration: wheelDuration, times: [0, .08, .15, .23, .31, .41, .52, .64, .77, .9, 1] } : { duration: 0 }} />
    <motion.svg key={reduced ? 'wheel-still' : 'wheel-animated'} viewBox="0 0 300 300" initial={false} animate={{ rotate: angle }}
      transition={{ duration: spinning && !reduced ? wheelDuration : 0, ease: wheelEase }}
      onAnimationComplete={() => { if (spinning) onStop(); }}>
      <circle cx="150" cy="150" r="141" className="ums-wheel-rim" />
      {options.length === 1 ? <circle cx="150" cy="150" r="128" className="ums-wheel-right" /> :
        options.map((option, index) => {
          const start = point(segment * index).join(' ');
          const end = point(segment * (index + 1)).join(' ');
          return <path key={option.category} d={`M150 150 L${start} A128 128 0 0 1 ${end} Z`}
            className={index % 2 ? 'ums-wheel-right' : 'ums-wheel-left'} />;
        })}
      <circle cx="150" cy="150" r="134" className="ums-wheel-ticks" />
      {options.map(({ category, author }, index) => (
        <text key={category} x="150" y="78" transform={`rotate(${center(index)} 150 150)`}>
          {author === 0 || (!spinning && index === winner) ? shorten(category) : index + 1}
        </text>
      ))}
      <circle cx="150" cy="150" r="17" className="ums-wheel-hub" />
      <circle cx="150" cy="150" r="4" className="ums-wheel-pin" />
    </motion.svg>
  </div>;
}

function RoundCard({ label, children, variant, reduced }) {
  return <motion.div className={`ums-round-card ums-round-card--${variant}`}
    initial={reduced ? false : { opacity: 0, x: variant === 'category' ? -18 : 0, rotateY: variant === 'author' ? -78 : 0 }}
    animate={{ opacity: 1, x: 0, rotateY: 0 }}
    transition={{ duration: reduced ? 0 : .38, ease: 'easeOut' }}>
    <span className="ums-card-label">{label}</span>
    {children}
  </motion.div>;
}

const matchLabels = ['Sin coincidencia', 'Otra posición', 'Misma posición'];
const modeScoring = {
  parejas: 'Se comparan las cartas de cada pareja.',
  equipos: 'El equipo suma el promedio de las comparaciones entre sus integrantes.',
  individual: 'Tu puntuación base es el promedio de tus comparaciones con los demás.',
  perspectiva: 'Cada persona compara sus cartas con las del objetivo. El objetivo recibe el promedio de esas comparaciones.',
};

function MatchMark({ value }) {
  return <span className={`ums-match-mark ums-match-${value}`} aria-hidden="true">
    <svg viewBox="0 0 18 12" fill="none">
      {value === 0 ? <path d="M6 6h6" stroke="currentColor" strokeLinecap="round" /> : <>
        <path d="m5 3 3 3-3 3-3-3Z" fill="currentColor" />
        {value === 2 && <path d="m13 3 3 3-3 3-3-3Z" fill="currentColor" />}
      </>}
    </svg>
  </span>;
}

function HelpDialog({ dialog, mode, grouped, timed }) {
  return <dialog ref={dialog} className="ums-dialog ums-help-dialog" aria-labelledby="help-title">
    <h2 id="help-title">Cómo jugar</h2>
    <ol className="ums-help-steps">
      <li>Propón una categoría y gira la ruleta.</li>
      <li>Escribe y ordena tres cartas. Puedes usar títulos completos.</li>
      <li>Revela las respuestas y vota por quien propuso la categoría.</li>
    </ol>
    <h3>Puntos por comparación</h3>
    <dl className="ums-help-points">
      {[2, 1, 0].map((value) => <div key={value}><dt><MatchMark value={value} />{matchLabels[value]}</dt><dd>{value} {value === 1 ? 'punto' : 'puntos'}</dd></div>)}
    </dl>
    <p><strong>{MODES[mode][0]}.</strong> {modeScoring[mode]}</p>
    <p><strong>Autoría.</strong> Acertar suma 3 puntos personales{grouped ? ' y aporta 1,5 puntos a tu grupo en esta demo' : ''}.</p>
    {timed && <p className="ums-help-clock">El reloj sigue corriendo mientras lees.</p>}
    <Action onClick={() => dialog.current.close()}>Cerrar ayuda</Action>
  </dialog>;
}

function AnswerCard({ name, words, index, getMatch, reduced }) {
  return <motion.li className="ums-answer-card"
    initial={reduced ? false : { opacity: 0, y: 8, rotateX: -24 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ delay: reduced ? 0 : index * .09, duration: reduced ? 0 : .28, ease: 'easeOut' }}>
    <strong>{name}</strong>
    <span className="ums-words">{words.map((word, position) => {
      const match = getMatch(word, position);
      return <motion.span key={word} className={`ums-face-card ums-match-${match}`}
        initial={reduced ? false : { opacity: 0, rotateY: -75 }} animate={{ opacity: 1, rotateY: 0 }}
        transition={{ delay: reduced ? 0 : match ? .42 : index * .08 + .12, duration: reduced ? 0 : .26 }}>
        {word}<MatchMark value={match} /><span className="ums-visually-hidden">. {matchLabels[match]}.</span>
      </motion.span>;
    })}</span>
  </motion.li>;
}

function ScoreList({ rows }) {
  const sorted = [...rows].sort((left, right) => right.score - left.score);
  return <ol className="ums-list" aria-label="Puntuaciones">
    {sorted.map((row) => <li key={row.id}>
      <span className="ums-position">{sorted.findIndex((item) => item.score === row.score) + 1}</span>
      <span>{row.name}{row.detail && <small>{row.detail}</small>}</span>
      <strong className="ums-score">{formatScore(row.score / SCORE_UNITS)} <small>pts</small></strong>
    </li>)}
  </ol>;
}

export default function Game({ home, mark }) {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [screen, setScreen] = useState('inicio');
  const [alias, setAlias] = useState('');
  const [code, setCode] = useState('');
  const [host, setHost] = useState(true);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState('individual');
  const [roundCount, setRoundCount] = useState(3);
  const [writingTimes, setWritingTimes] = useState(WRITING_TIMES);
  const [deadline, setDeadline] = useState(null);
  const [round, setRound] = useState(0);
  const [category, setCategory] = useState('');
  const [usedCategories, setUsedCategories] = useState([]);
  const [pool, setPool] = useState(ROUNDS);
  const [draw, setDraw] = useState(null);
  const [marathon, setMarathon] = useState(false);
  const [format, setFormat] = useState('originales');
  const [partner, setPartner] = useState(1);
  const [pairs, setPairs] = useState(ORIGINAL_PAIRS);
  const [guestStarted, setGuestStarted] = useState(null);
  const [guestElapsed, setGuestElapsed] = useState(0);
  const [spun, setSpun] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [notice, setNotice] = useState('');
  const [words, setWords] = useState(emptyWords);
  const [vote, setVote] = useState('');
  const [error, setError] = useState({ field: '', message: '' });
  const [totals, setTotals] = useState([]);
  const [copied, setCopied] = useState('');
  const title = useRef(null);
  const modal = useRef(null);
  const help = useRef(null);
  const previous = useRef(screen);
  const players = [alias.trim(), ...GUESTS];
  const target = (round + 1) % players.length;
  const selected = draw?.options[draw.winner];
  const selectedCategory = selected?.category ?? '';
  const author = selected?.author;
  const activeMode = marathon ? (format === 'individual' || format === 'perspectiva' ? format : 'parejas') : mode;
  const grouped = activeMode === 'parejas' || activeMode === 'equipos';
  const lists = [words.map((word) => word.trim()), ...(selected?.words ?? ROUNDS[0].words)];
  const finished = marathon ? pool.length === 0 : round + 1 === roundCount;

  useEffect(() => {
    if (previous.current !== screen) {
      title.current?.focus();
      previous.current = screen;
    }
  }, [screen]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (event) => setReduced(event.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reduced && spinning) {
      setSpinning(false);
      setSpun(true);
    }
  }, [reduced, spinning]);

  function go(next) {
    setError({ field: '', message: '' });
    setNotice('');
    setDeadline(writingTimes[next] ? Date.now() + writingTimes[next] * 1000 : null);
    if (next === 'respuestas' && screen !== 'respuestas') {
      setGuestElapsed(0);
      setGuestStarted(Date.now());
    }
    setScreen(next);
  }

  useEffect(() => {
    if (!guestStarted || (screen !== 'respuestas' && screen !== 'espera')) return;
    const refresh = () => {
      const elapsed = Date.now() - guestStarted;
      setGuestElapsed(elapsed);
      if (screen === 'espera' && elapsed >= roomReadyAfter) go('revelacion');
    };
    if (screen === 'espera' && Date.now() - guestStarted >= roomReadyAfter) {
      go('revelacion');
      return;
    }
    const timer = window.setInterval(refresh, 250);
    return () => window.clearInterval(timer);
  }, [guestStarted, screen]);

  useEffect(() => {
    if (!deadline) return;
    const timer = window.setTimeout(() => {
      if (screen === 'categoria') {
        setCategory('');
        go('ruleta');
        setNotice('Se acabó el tiempo. La ruleta usará una propuesta de la sala.');
      } else if (screen === 'respuestas') {
        setDeadline(null);
        setNotice('Se acabó el tiempo. En la demo puedes volver a intentar esta etapa.');
      } else if (screen === 'autor') {
        submitVote('');
      }
    }, Math.max(0, deadline - Date.now()));
    return () => window.clearTimeout(timer);
  }, [screen, deadline, writingTimes]);


  function fail(field, message) {
    setError({ field, message });
    document.getElementById(field)?.focus();
  }

  function resetRound() {
    setCategory('');
    setDraw(null);
    setFormat('originales');
    setPartner(1);
    setPairs(ORIGINAL_PAIRS);
    setGuestStarted(null);
    setGuestElapsed(0);
    setSpun(false);
    setSpinning(false);
    setWords(emptyWords);
    setVote('');
  }

  function resetGame(next = 'inicio') {
    setRound(0);
    setUsedCategories([]);
    setPool(ROUNDS);
    setTotals([]);
    setReady(false);
    setCopied('');
    resetRound();
    go(next);
  }

  function enter(event, create) {
    event.preventDefault();
    if (alias.trim().length < 2) return fail('alias', 'Escribe un alias de al menos dos caracteres.');
    if (GUESTS.some((name) => normalize(name) === normalize(alias))) return fail('alias', 'Ese alias ya está en la sala. Prueba con otro.');
    if (!create && normalize(code) !== normalize(ROOM)) return fail('code', 'No encontramos esa sala. Para probar, usa el código SENTIR.');
    setHost(create);
    setMode('individual');
    setRoundCount(3);
    setMarathon(false);
    setWritingTimes(WRITING_TIMES);
    resetGame('lobby');
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(ROOM);
      setCopied('Código copiado.');
    } catch {
      setCopied(`Copia el código manualmente: ${ROOM}.`);
    }
  }

  function propose(event) {
    event.preventDefault();
    if (!deadline || Date.now() >= deadline) return;
    const normalized = normalize(category);
    if (normalized.length < 3) return fail('category', 'Escribe una categoría de al menos tres caracteres.');
    if (usedCategories.includes(normalized)) return fail('category', 'Esa categoría ya salió. Prueba con otra.');
    if (pool.some((item) => normalize(item.category) === normalized)) return fail('category', 'Esa categoría ya está en la ruleta. Prueba con otra.');
    setPool([...pool, { category: category.trim(), author: 0, words: ROUNDS[round % ROUNDS.length].words }]);
    go('ruleta');
  }

  function spin() {
    if (spinning || spun || !pool.length) return;
    const winner = Math.floor(Math.random() * pool.length);
    setDraw({ options: pool, winner });
    setUsedCategories([...usedCategories, normalize(pool[winner].category)]);
    setPool(pool.filter((_, index) => index !== winner));
    if (reduced) {
      setSpun(true);
      return;
    }
    setSpinning(true);
  }

  function finishSpin() {
    setSpinning(false);
    setSpun(true);
  }

  function confirmFormat(event) {
    event.preventDefault();
    if (grouped) {
      setPairs(makePairs(format, author, author === 0 ? partner : null));
      go('parejas-ronda');
    } else {
      go('respuestas');
    }
  }

  function submitWords(event) {
    event.preventDefault();
    if (!deadline || Date.now() >= deadline) return;
    const normalized = words.map(normalize);
    const invalid = normalized.findIndex((word, index) => !validAnswer(words[index]) || normalized.indexOf(word) !== index);
    if (invalid !== -1) return fail(`word-${invalid}`, 'Escribe una respuesta distinta en cada campo. Puedes usar títulos como Toy Story.');
    go(guestElapsed >= roomReadyAfter ? 'revelacion' : 'espera');
  }

  function submitVote(value) {
    setVote(value);
    go('revelar-autor');
  }

  function updateScores() {
    const rows = ranking(activeMode, players, lists, target, pairs);
    const correct = vote !== '' && Number(vote) === author;
    const roundRows = rows.map((row) => ({
      ...row,
      score: row.score + (correct && (grouped ? row.members.includes(0) : row.id === 0) ? (grouped ? 1.5 : 3) : 0),
    }));
    const scoreRows = marathon && grouped
      ? roundRows.flatMap((row) => row.members.map((id) => ({ id, name: players[id], score: row.score })))
      : roundRows;
    setTotals(scoreRows.map((row) => {
      const previousScore = totals.find(({ id }) => id === row.id)?.score ?? 0;
      const roundScore = Math.round(row.score * SCORE_UNITS);
      return { ...row, score: previousScore + roundScore };
    }));
    go('clasificacion');
  }

  function wordMatch(word, position, playerIndex) {
    const compare = (list) => matchPoints(normalize(word), position, list.map(normalize));
    if (grouped) {
      const partner = pairs.find((pair) => pair.includes(playerIndex)).find((index) => index !== playerIndex);
      return compare(lists[partner]);
    }
    if (activeMode === 'perspectiva' && playerIndex !== target) return compare(lists[target]);
    return Math.max(...lists.map((list, index) => index === playerIndex ? 0 : compare(list)));
  }

  const headings = {
    inicio: 'Un mismo sentir', crear: 'Crea una sala', unirse: 'Únete a una sala', lobby: 'Sala de espera',
    configuracion: 'Configura la partida', modalidades: 'Elige una modalidad', categoria: 'Propón una categoría',
    ruleta: 'La ruleta', formato: '¿Cómo jugar esta ronda?', 'parejas-ronda': 'Parejas de la ronda',
    respuestas: 'Escribe tres respuestas', espera: 'Cartas entregadas', revelacion: 'Las coincidencias',
    autor: '¿Quién la propuso?', 'revelar-autor': 'La autoría', clasificacion: 'Clasificación', final: 'Resultado final',
  };
  const writing = screen === 'respuestas' || screen === 'espera';
  const inRound = ['categoria', 'ruleta', 'formato', 'parejas-ronda', 'respuestas', 'espera', 'revelacion', 'autor', 'revelar-autor', 'clasificacion'].includes(screen);
  const back = { crear: 'inicio', unirse: 'inicio', configuracion: 'lobby', modalidades: 'configuracion' }[screen];
  const heading = <h1 ref={title} tabIndex={-1}>{headings[screen]}</h1>;

  return <div className="ums-shell">
    <header className="ums-header">
      <a className="ums-brand" href={home} aria-label="Volver al inicio de Juanjo López Ramírez">
        <img src={mark} width="19" height="32" alt="" /><span>Un mismo sentir</span>
      </a>
      <div className="ums-header-actions">
        {!inRound && <code className="ums-terminal-path" aria-hidden="true">~/juegos</code>}
        {inRound && <span className="ums-round">Ronda {round + 1}{!marathon && ` de ${roundCount}`}</span>}
        <button className="ums-help-button" type="button" aria-label="Cómo jugar y puntuar" aria-haspopup="dialog"
          onClick={() => help.current.showModal()}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7 7a3 3 0 0 1 6 0c0 2-3 2-3 4m0 2.5v.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
    <main className={screen === 'inicio' ? 'ums-landing' : 'ums-stage'}>
      {screen === 'inicio' && <>
        <div className="ums-intro">
          {heading}
          <p>Una categoría, tres respuestas y una sorpresa cuando las cartas se abren.</p>
          <div className="ums-actions"><Action onClick={() => go('crear')}>Crear sala</Action><Action secondary onClick={() => go('unirse')}>Unirme a una sala</Action></div>
        </div>
        <Cover mark={mark} reduced={reduced} />
      </>}
      {screen !== 'inicio' && <section className={`ums-content ${writing ? 'ums-content--with-room' : ''}`}>
        {back && <Action secondary onClick={() => go(back)}>Volver</Action>}
        {heading}
        {deadline && <Countdown deadline={deadline}>Tiempo restante</Countdown>}
        {notice && <p role="status">{notice}</p>}
        {(screen === 'crear' || screen === 'unirse') && <form onSubmit={(event) => enter(event, screen === 'crear')}>
          <p>{screen === 'crear' ? 'Elige cómo te verá el resto de la sala.' : 'Usa SENTIR para entrar a la sala de demostración.'}</p>
          <Field id="alias" label="Tu alias" value={alias} onChange={(event) => setAlias(event.target.value)} maxLength={20} error={error.field === 'alias'} />
          {screen === 'unirse' && <Field id="code" label="Código de sala" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={12} error={error.field === 'code'} />}
          <ErrorText message={error.message} />
          <Action type="submit">{screen === 'crear' ? 'Crear sala' : 'Entrar a la sala'}</Action>
        </form>}
        {screen === 'lobby' && <>
          <div className="ums-room"><div><small>Código de sala</small><strong>{ROOM}</strong></div><Action secondary onClick={copyCode}>Copiar código</Action></div>
          <p className="ums-status" role="status">{copied}</p>
          <ul className="ums-list" aria-label="Participantes">{players.map((player, index) => <li key={index}>
            <span className="ums-avatar" aria-hidden="true">{Array.from(player)[0]?.toLocaleUpperCase('es')}</span>
            <span>{player}{index === 0 && ' (tú)'}</span>
            <small className="ums-score">{index === (host ? 0 : 1) ? 'Anfitrión' : index === 0 && !ready ? 'En espera' : 'Listo'}</small>
          </li>)}</ul>
          <p>{marathon ? 'Hasta agotar la ruleta' : `${MODES[mode][0]} · ${roundCount} ${roundCount === 1 ? 'ronda' : 'rondas'}`}</p>
          <div className="ums-actions">
            <Action onClick={() => go(host ? 'configuracion' : 'categoria')}>{host ? 'Configurar partida' : 'Estoy listo y quiero jugar'}</Action>
            <Action secondary onClick={() => modal.current.showModal()}>Salir de la sala</Action>
          </div>
        </>}
        {screen === 'configuracion' && <>
          <fieldset className="ums-options">
            <legend>¿Cuándo termina la partida?</legend>
            <label className="ums-option"><input type="radio" name="duration" checked={!marathon} onChange={() => setMarathon(false)} /> Número fijo de rondas</label>
            <label className="ums-option"><input type="radio" name="duration" checked={marathon} onChange={() => setMarathon(true)} />
              <span><strong>Hasta agotar la ruleta</strong><small>Una categoría por ronda. Puedes cambiar la forma de jugar cada vez.</small></span>
            </label>
          </fieldset>
          {!marathon && <label className="ums-field">Rondas de la demo
            <select value={roundCount} onChange={(event) => setRoundCount(Number(event.target.value))}>
              <option value={1}>1 ronda</option><option value={3}>3 rondas</option>
            </select>
          </label>}
          <fieldset className="ums-timings">
            <legend>Tiempo por participante</legend>
            {Object.entries({ categoria: 'Proponer categoría', respuestas: 'Escribir respuestas', autor: 'Adivinar la autoría' }).map(([stage, label]) => (
              <label className="ums-field" key={stage}>{label}
                <select value={writingTimes[stage]} onChange={(event) => setWritingTimes({ ...writingTimes, [stage]: Number(event.target.value) })}>
                  {[15, 25, 30, 45, 60, 90, 120].map((seconds) => <option key={seconds} value={seconds}>{seconds} segundos</option>)}
                </select>
              </label>
            ))}
          </fieldset>
          {marathon ? <Action onClick={() => { setReady(true); go('categoria'); }}>Empezar partida</Action> :
            <Action onClick={() => go('modalidades')}>Elegir modalidad</Action>}
        </>}
        {screen === 'modalidades' && <form onSubmit={(event) => { event.preventDefault(); setReady(true); go('categoria'); }}>
          <fieldset className="ums-options">
            <legend>¿Con quién compararás tus palabras?</legend>
            {Object.entries(MODES).map(([key, [name, description]]) => <label className="ums-option" key={key}>
              <input type="radio" name="mode" value={key} checked={mode === key} onChange={() => setMode(key)} />
              <ModeIcon mode={key} /><span><strong>{name}</strong><small>{description}</small></span>
            </label>)}
          </fieldset>
          <Action type="submit">Empezar partida</Action>
        </form>}
        {screen === 'categoria' && <form onSubmit={propose}>
          <p>Tu propuesta irá a la ruleta. La sala descubrirá quién la escribió después de votar.</p>
          <Field id="category" label="Categoría" placeholder="Por ejemplo, recuerdos de infancia" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={72} error={error.field === 'category'} />
          <ErrorText message={error.message} />
          <Action type="submit">Añadir y abrir la ruleta</Action>
        </form>}
        {screen === 'ruleta' && <>
          {!spun && <p>La ruleta elegirá una propuesta de la sala.</p>}
          <div className="ums-wheel-stage">
            <Wheel options={draw?.options ?? pool} winner={draw?.winner} spinning={spinning} reduced={reduced} onStop={finishSpin} />
            <div className="ums-draw-results">
              {category.trim() && <p><strong>Tu propuesta</strong><br />{category.trim()}</p>}
              <div role="status">
                {spinning && <p>Girando la ruleta…</p>}
                {spun && <RoundCard label="Categoría de la ronda" variant="category" reduced={reduced}>
                  <p className="ums-category">{selectedCategory}</p>
                </RoundCard>}
              </div>
              {!spinning && <p><strong>{pool.length}</strong> {pool.length === 1 ? 'categoría pendiente' : 'categorías pendientes'}</p>}
            </div>
          </div>
          {spun ? <Action onClick={() => go(marathon ? 'formato' : 'respuestas')}>{marathon ? 'Elegir cómo jugar' : 'Escribir mis respuestas'}</Action> :
            <Action onClick={spin} busy={spinning}>Girar ruleta</Action>}
        </>}
        {screen === 'formato' && <form onSubmit={confirmFormat}>
          <p className="ums-category">{selectedCategory}</p>
          <p>Turno de decidir de <strong>{players[round % players.length]}</strong>. En la demo puedes probar su elección.</p>
          <fieldset className="ums-options">
            <legend>Elige cómo comparar las respuestas de esta ronda.</legend>
            {Object.entries(ROUND_FORMATS).map(([key, [name, description]]) => <label className="ums-option" key={key}>
              <input type="radio" name="round-format" value={key} checked={format === key} onChange={() => setFormat(key)} />
              <span><strong>{name}</strong><small>{description}</small></span>
            </label>)}
          </fieldset>
          {format === 'autor' && author === 0 && <label className="ums-field">Elige tu pareja
            <select value={partner} onChange={(event) => setPartner(Number(event.target.value))}>
              {GUESTS.map((guest, index) => <option key={guest} value={index + 1}>{guest}</option>)}
            </select>
          </label>}
          <Action type="submit">{grouped ? 'Confirmar parejas' : 'Escribir mis respuestas'}</Action>
        </form>}
        {screen === 'parejas-ronda' && <>
          <p>{ROUND_FORMATS[format][0]}</p>
          <ul className="ums-list ums-pair-list" aria-label="Parejas de la ronda">
            {pairs.map(([first, second], index) => <li key={first}><span className="ums-position">{index + 1}</span><strong>{players[first]} y {players[second]}</strong></li>)}
          </ul>
          <Action onClick={() => go('respuestas')}>Escribir mis respuestas</Action>
        </>}
        {writing && <div className="ums-writing-layout">
          <div className="ums-writing-main">
            {screen === 'respuestas' && deadline && <form onSubmit={submitWords}>
              <p className="ums-category">{selectedCategory}</p>
              <p>{activeMode === 'perspectiva' ? `¿Qué tres respuestas crees que escribirá ${players[target]}?` : 'Escribe una respuesta distinta por carta. Puedes usar nombres y títulos de varias palabras.'}</p>
              <p className="ums-deck-hint">Desliza la parte superior de la carta o elige otra posición. El orden cuenta al puntuar.</p>
              <WritingDeck words={words} setWords={setWords} error={error} reduced={reduced} />
              <ErrorText message={error.message} />
              <Action type="submit">Entregar cartas</Action>
            </form>}
            {screen === 'respuestas' && !deadline && <Action onClick={() => go('respuestas')}>Volver a intentar</Action>}
            {screen === 'espera' && <p>Las cartas se abrirán cuando termine la sala.</p>}
          </div>
          <RoomProgress players={players} words={words} submitted={screen === 'espera'} elapsed={guestElapsed} />
        </div>}
        {screen === 'revelacion' && <>
          <p className="ums-category">{selectedCategory}</p>
          <ul className="ums-match-key" aria-label="Mejor coincidencia de cada carta">
            {[2, 1, 0].map((value) => <li key={value}><MatchMark value={value} />{matchLabels[value]}</li>)}
          </ul>
          <ul className="ums-answer-deck" aria-label="Respuestas de la sala">
            {lists.map((list, index) => <AnswerCard key={index} index={index} words={list}
              name={players[index] + (activeMode === 'perspectiva' && index === target ? ' (perspectiva)' : '')}
              getMatch={(word, position) => wordMatch(word, position, index)} reduced={reduced} />)}
          </ul>
          <Action onClick={() => go('autor')}>Adivinar quién la propuso</Action>
        </>}
        {screen === 'autor' && (author === 0 ? <>
          <p>La ruleta eligió tu categoría. En esta ronda la sala intenta adivinar que tú la propusiste.</p>
          <Action onClick={() => submitVote('')}>Revelar autoría</Action>
        </> : <form onSubmit={(event) => {
          event.preventDefault();
          if (deadline && Date.now() < deadline) submitVote(vote);
        }}>
          <p className="ums-category">{selectedCategory}</p>
          <fieldset className="ums-options ums-vote-deck">
            <legend>Elige quién crees que escribió la categoría.</legend>
            {GUESTS.map((guest, index) => <motion.label className="ums-option ums-vote-card" key={guest}
              whileTap={reduced ? undefined : { scale: .97 }}>
              <input type="radio" name="author" value={index + 1} checked={vote === String(index + 1)} onChange={(event) => setVote(event.target.value)} />
              <span className="ums-avatar" aria-hidden="true">{Array.from(guest)[0]}</span><strong>{guest}</strong>
            </motion.label>)}
          </fieldset>
          <div className="ums-actions"><Action type="submit" disabled={vote === ''}>Confirmar voto</Action><Action secondary onClick={() => submitVote('')}>Omitir voto</Action></div>
        </form>)}
        {screen === 'revelar-autor' && <>
          <RoundCard label="Autoría revelada" variant="author" reduced={reduced}>
            <p className="ums-category">{players[author]} propuso «{selectedCategory}».</p>
            {vote !== '' && <p>{Number(vote) === author ? (grouped ? '¡Acertaste! +1,5 puntos para tu grupo.' : '¡Acertaste! +3 puntos de autoría.') : 'Tu voto fue para otra persona.'}</p>}
          </RoundCard>
          <Action onClick={updateScores}>Ver clasificación</Action>
        </>}
        {screen === 'clasificacion' && <>
          <p>Puntuación acumulada tras la ronda {round + 1}.{marathon && ' Los puntos se guardan por persona, aunque cambien las parejas.'}</p>
          <ScoreList rows={totals} />
          <Action onClick={() => {
            if (finished) return go('final');
            setRound(round + 1);
            resetRound();
            go(marathon ? 'ruleta' : 'categoria');
          }}>{finished ? 'Ver resultado final' : 'Jugar siguiente ronda'}</Action>
        </>}
        {screen === 'final' && <>
          <p>{marathon ? 'Salieron todas las categorías de la ruleta.' : `Así terminó la partida en modalidad ${MODES[mode][0]}.`}</p>
          <ScoreList rows={totals} />
          <Action onClick={() => resetGame('lobby')}>Volver a jugar</Action>
        </>}
      </section>}
    </main>
    <footer className="ums-footer"><span>Juego de asociación de palabras</span><span>Demostración local</span></footer>
    <HelpDialog dialog={help} mode={activeMode} grouped={grouped} timed={Boolean(deadline)} />
    <dialog ref={modal} className="ums-dialog" aria-labelledby="exit-title">
      <h2 id="exit-title">¿Salir de la sala?</h2>
      <p>Perderás el progreso de esta demostración.</p>
      <div className="ums-actions">
        <Action secondary onClick={() => modal.current.close()}>Seguir aquí</Action>
        <Action onClick={() => { modal.current.close(); resetGame(); }}>Salir de la sala</Action>
      </div>
    </dialog>
  </div>;
}
