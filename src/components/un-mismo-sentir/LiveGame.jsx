import React, { useEffect, useRef, useState } from 'react';
import WritingDeck from './WritingDeck.jsx';
import { gameMessage } from './live-session.js';

const roomKey = 'ums-live-room';
const phases = {
  lobby: 'Sala de espera', starting: 'Ya empezamos', proposals: 'Propón una categoría', wheel: 'La ruleta',
  answers: 'Escribe tus respuestas', reveal: 'Las coincidencias', voting: '¿Quién la propuso?',
  standings: 'Clasificación', final: 'Resultado final', incomplete: 'Partida inconclusa',
};

const getSavedRoom = () => localStorage.getItem(roomKey) || '';
const writingMotionReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealedScore(comparisons, participant, position) {
  return Math.max(0, ...comparisons.map(match => {
    if (match.first === participant) return match.first_matches[position];
    if (match.second === participant) return match.second_matches[position];
    return 0;
  }));
}

function LiveRoomProgress({ room }) {
  const rows = room.answer_progress ?? [];
  return <aside className="ums-room-progress" aria-labelledby="live-progress">
    <h2 id="live-progress">En la sala</h2>
    <p>{rows.filter(row => row.submitted).length} de {rows.length} terminaron</p>
    <ul className="ums-progress-list">{rows.map(row => {
      const player = room.participants.find(member => member.id === row.participant_id);
      if (!player) return null;
      return <li key={player.id}>
        <div className="ums-progress-person">
          <strong>{player.alias}{player.id === room.viewer_id && ' (tú)'}</strong>
          <span className={player.online ? 'ums-progress-connection' : 'ums-progress-connection is-offline'}>{player.online ? 'En línea' : 'Sin conexión'}</span>
        </div>
        <ul className="ums-progress-cards" aria-label={`Cartas de ${player.alias}`}>
          {row.written.map((written, index) => <li className={written ? 'is-written' : undefined} key={index}>
            <span aria-hidden="true">{index + 1}</span><span className="ums-visually-hidden">Carta {index + 1} {written ? 'escrita' : 'pendiente'}</span>
          </li>)}
        </ul>
        <small>{row.submitted ? 'Terminó' : 'Sin entregar'}</small>
      </li>;
    })}</ul>
  </aside>;
}

export default function LiveGame({ session, home, mark }) {
  const [roomId, setRoomId] = useState(getSavedRoom);
  const [room, setRoom] = useState(null);
  const [joining, setJoining] = useState(Boolean(new URLSearchParams(location.search).get('sala')));
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('sala') ?? '');
  const [alias, setAlias] = useState('');
  const [category, setCategory] = useState('');
  const [words, setWords] = useState(['', '', '']);
  const [vote, setVote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [notice, setNotice] = useState('');
  const [clock, setClock] = useState(Date.now());
  const skew = useRef(0);
  const actionInFlight = useRef(false);
  const progressSent = useRef('');
  const heading = useRef(null);
  const help = useRef(null);
  const viewer = room?.participants.find(({ id }) => id === room.viewer_id);
  const leader = room?.leader_id === room?.viewer_id;
  const phase = room?.phase;
  const epoch = room?.channel_epoch;
  const roundId = room?.round?.id;
  const written = words.map(word => word.trim() ? '1' : '0').join('');
  const submitted = Boolean(room?.my_words);
  const remaining = room?.deadline_at ? Math.max(0, Math.ceil((Date.parse(room.deadline_at) - clock) / 1000)) : null;
  const readWindow = room?.phase_at && clock >= Date.parse(room.phase_at) + 5000;
  const name = id => room?.participants.find(player => player.id === id)?.alias ?? 'Participante';

  async function read(id) {
    const next = await session.rpc('ums_state', { p_room: id });
    skew.current = Date.parse(next.server_at) - Date.now();
    return next;
  }

  function discardRoom() {
    localStorage.removeItem(roomKey);
    setRoomId('');
    setRoom(null);
  }

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    let inFlight = false;
    async function refresh(heartbeat = false) {
      if (!active || inFlight) return;
      inFlight = true;
      try {
        await session.guest();
        if (heartbeat) await session.action(roomId, 'heartbeat');
        const next = await read(roomId);
        if (active) {
          setConnectionError('');
          setRoom(previous => previous?.room_id === roomId && previous.revision > next.revision ? previous : next);
        }
      } catch (failure) {
        if (!active) return;
        if (failure.code === 'room_unavailable') discardRoom();
        setConnectionError(gameMessage(failure));
      } finally {
        inFlight = false;
      }
    }
    refresh(true);
    const poll = window.setInterval(() => refresh(), 3000);
    const heartbeat = window.setInterval(() => refresh(true), 7000);
    const wake = () => { if (document.visibilityState === 'visible') refresh(true); };
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', wake);
    let channel;
    if (epoch) {
      channel = session.client.channel(`ums:${roomId}:${epoch}`, { config: { private: true } })
        .on('broadcast', { event: 'revision' }, () => refresh())
        .on('presence', { event: 'sync' }, () => refresh())
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            void channel.track({ active: true });
            refresh();
          }
        });
    }
    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearInterval(heartbeat);
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', wake);
      if (channel) void session.client.removeChannel(channel);
    };
  }, [session, roomId, epoch]);

  useEffect(() => {
    const update = () => setClock(Date.now() + skew.current);
    update();
    const interval = window.setInterval(update, 150);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase !== 'starting' || remaining !== 0) return;
    let active = true;
    session.action(roomId, 'heartbeat').then(() => read(roomId))
      .then(next => { if (active) setRoom(previous => previous?.revision > next.revision ? previous : next); })
      .catch(() => { /* The periodic refresh retries on the next heartbeat. */ });
    return () => { active = false; };
  }, [phase, remaining, roomId, session]);

  useEffect(() => {
    heading.current?.focus();
    setNotice('');
  }, [phase]);

  useEffect(() => {
    setCategory('');
    setWords(['', '', '']);
    setVote('');
  }, [roundId]);

  useEffect(() => {
    if (phase !== 'answers' || !roundId || submitted || room?.pause_until) return;
    const marker = `${roundId}:${written}`;
    if (marker === progressSent.current || (written === '000' && !progressSent.current.startsWith(roundId))) return;
    const timer = window.setTimeout(() => {
      session.action(roomId, 'draft_progress', { round_id: roundId, phase, written: [...written].map(bit => bit === '1') })
        .then(() => { progressSent.current = marker; })
        .catch(() => { /* The progress indicator is independent of card submission. */ });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [phase, roundId, written, submitted, roomId, session, room?.pause_until]);

  async function run(work) {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setPending(true);
    setError('');
    try { await work(); }
    catch (failure) { setError(gameMessage(failure)); }
    finally { actionInFlight.current = false; setPending(false); }
  }

  function enter(event) {
    event.preventDefault();
    void run(async () => {
      await session.guest();
      const next = joining
        ? await session.rpc('ums_join_room', { p_code: code.trim().toUpperCase(), p_alias: alias.trim() })
        : await session.rpc('ums_create_room', { p_alias: alias.trim() });
      localStorage.setItem(roomKey, next.room_id);
      setRoomId(next.room_id);
    });
  }

  function send(action, payload = {}) {
    void run(async () => {
      try {
        await session.action(roomId, action, roundId ? { round_id: roundId, phase, ...payload } : payload);
      } catch (failure) {
        if (failure.code === 'room_unavailable') discardRoom();
        throw failure;
      }
      if (action === 'leave') { discardRoom(); return; }
      const next = await read(roomId);
      setRoom(previous => previous?.revision > next.revision ? previous : next);
    });
  }

  async function share() {
    const invitation = new URL(location.pathname, location.origin);
    invitation.searchParams.set('sala', room.code);
    try {
      await navigator.clipboard.writeText(invitation.href);
      setNotice('Enlace de invitación copiado.');
    } catch {
      setNotice(`Comparte el código ${room.code}.`);
    }
  }

  const action = (label, handler, disabled = false) => (
    <button type="button" className="ums-primary" onClick={handler} disabled={pending || disabled}>{label}</button>
  );
  const guests = room?.participants ?? [];
  const pairing = room?.pairing;

  return <div className="ums-shell">
    <header className="ums-header">
      <a className="ums-brand" href={home} aria-label="Volver al inicio de Juanjo López Ramírez">
        <img src={mark} width="19" height="32" alt="" /><span>Un mismo sentir</span>
      </a>
      <div className="ums-header-actions">
        {room?.round && <span className="ums-round">Ronda {room.round.number}</span>}
        <button type="button" className="ums-help-button" aria-label="Cómo jugar y puntuar" aria-haspopup="dialog" onClick={() => help.current.showModal()}>?</button>
      </div>
    </header>
    <main className="ums-stage">
      <section className={`ums-content ${phase === 'answers' ? 'ums-content--with-room' : ''}`}>
        <h1 ref={heading} tabIndex={-1}>{phases[phase] ?? (roomId ? 'Conectando con la sala' : 'Un mismo sentir')}</h1>
        {(error || connectionError) && <p className="ums-error" role="alert">{error || connectionError}</p>}
        {roomId && !room && action('Volver al inicio', discardRoom)}
        {!roomId && <>
          <form onSubmit={enter}>
            <label className="ums-field">Tu alias<input value={alias} minLength={2} maxLength={24} required onChange={event => setAlias(event.target.value)} /></label>
            {joining && <label className="ums-field">Código de sala<input value={code} maxLength={10} required onChange={event => setCode(event.target.value)} /></label>}
            <button className="ums-primary" type="submit" disabled={pending}>{joining ? 'Entrar a la sala' : 'Crear sala'}</button>
          </form>
          <button className="ums-secondary" type="button" onClick={() => setJoining(!joining)}>{joining ? 'Prefiero crear una sala' : 'Tengo un código'}</button>
        </>}
        {phase === 'lobby' && <>
          <div className="ums-room"><span>Código de sala<strong>{room.code}</strong></span><button className="ums-secondary" type="button" onClick={share}>Copiar invitación</button></div>
          {notice && <p role="status">{notice}</p>}
          <ul className="ums-list" aria-label="Participantes">
            {guests.map(player => <li key={player.id}><span className="ums-avatar" aria-hidden="true">{Array.from(player.alias)[0]}</span>
              <span>{player.alias}{player.id === room.viewer_id && ' (tú)'}{player.group && <small>Pareja {player.group}</small>}</span>
              <span className="ums-score">{player.ready ? 'Listo' : player.online ? 'En la sala' : 'Sin conexión'}</span>
            </li>)}
          </ul>
          {pairing?.partner_id ? <>
            <p>Tu pareja es <strong>{name(pairing.partner_id)}</strong>.</p>
            <button className="ums-secondary" type="button" disabled={pending} onClick={() => send('pair_leave')}>Salir de la pareja</button>
          </> : pairing && <>
            {pairing.incoming.map(id => <div className="ums-actions" key={id}>
              <p>{name(id)} te invitó.</p>
              {action('Aceptar pareja', () => send('pair_accept', { participant_id: id }))}
              <button className="ums-secondary" type="button" disabled={pending} onClick={() => send('pair_decline', { participant_id: id })}>Rechazar</button>
            </div>)}
            {pairing.outgoing ? <div className="ums-actions"><p>Invitación enviada a {name(pairing.outgoing)}.</p>
              <button className="ums-secondary" type="button" disabled={pending} onClick={() => send('pair_cancel')}>Cancelar invitación</button>
            </div> : guests.filter(player => player.id !== room.viewer_id && !player.group && player.online)
              .map(player => <button className="ums-secondary" key={player.id} type="button" disabled={pending}
                onClick={() => send('pair_offer', { participant_id: player.id })}>Invitar a {player.alias}</button>)}
          </>}
          <div className="ums-actions">
            {action(viewer?.ready ? 'Quitar listo' : 'Estoy listo', () => send('ready', { ready: !viewer?.ready }), !viewer?.group)}
            {leader && action('Jugar', () => send('start'), guests.length < 4 || guests.some(player => !player.ready || !player.online))}
            <button type="button" className="ums-secondary" disabled={pending} onClick={() => send('leave')}>Salir de la sala</button>
          </div>
        </>}
        {phase === 'starting' && <p className="ums-category" role="timer" aria-label="Segundos antes de comenzar">{remaining}</p>}
        {phase && !['starting', 'lobby', 'final', 'incomplete'].includes(phase) && <>
          {room.category && <p className="ums-category">{room.category.text}</p>}
          {remaining !== null && <p>Tiempo restante <time dateTime={`PT${remaining}S`}>{remaining} s</time></p>}
        </>}
        {phase === 'proposals' && (room.my_proposal ? <p>Propuesta entregada. Esperando a la sala.</p> : <form onSubmit={event => { event.preventDefault(); send('propose', { text: category }); }}>
          <label className="ums-field">Categoría<input value={category} maxLength={60} required onChange={event => setCategory(event.target.value)} /></label>
          <button className="ums-primary" type="submit" disabled={pending}>Entregar propuesta</button>
        </form>)}
        {phase === 'wheel' && leader && action('Aceptar categoría', () => send('advance'))}
        {phase === 'answers' && <div className="ums-writing-layout">
          <div className="ums-writing-main">
            {submitted ? <p>Cartas entregadas. Esperando a la sala.</p> : <form onSubmit={event => { event.preventDefault(); send('answer', { words }); }}>
              <WritingDeck words={words} setWords={setWords} error={{ field: '', message: '' }} reduced={writingMotionReduced()} maxLength={30} />
              <button className="ums-primary" type="submit" disabled={pending || words.some(word => !word.trim())}>Entregar cartas</button>
            </form>}
          </div>
          <LiveRoomProgress room={room} />
        </div>}
        {phase === 'reveal' && <>
          <p>Verde si coincide en la misma posición. Ámbar si coincide en otra. Un punto dorado señala originalidad.</p>
          <ul className="ums-answer-deck" aria-label="Respuestas de la sala">
            {room.revealed_words?.map(({ participant_id, words: entries }) => <li className="ums-answer-card" key={participant_id}>
              <strong>{name(participant_id)}</strong>
              <span className="ums-words">{entries?.map((text, index) => {
                const score = revealedScore(room.comparisons ?? [], participant_id, index);
                const color = score === 5 || score === 2 ? 2 : score ? 1 : 0;
                return <span className={`ums-face-card ums-match-${color}`} key={index}>
                  {text}{score >= 3 && <span className="ums-original-mark" aria-hidden="true" />}
                  <span className="ums-visually-hidden">. {score} puntos en su mejor comparación.</span>
                </span>;
              }) ?? 'Sin entrega'}</span>
            </li>)}
          </ul>
          {leader && action('Pasar a autoría', () => send('advance'), !readWindow)}
        </>}
        {phase === 'voting' && (room.my_vote || !room.vote_choices ? <p>Esperando a la sala.</p> : <form onSubmit={event => { event.preventDefault(); send('vote', { choice_id: vote || null }); }}>
          <label className="ums-field">Tu voto<select value={vote} onChange={event => setVote(event.target.value)}><option value="">Paso</option>
            {room.vote_choices.map(id => <option key={id} value={id}>{name(id)}</option>)}
          </select></label>
          <button className="ums-primary" type="submit" disabled={pending}>Confirmar voto</button>
        </form>)}
        {['standings', 'final', 'incomplete'].includes(phase) && <>
          {room.history?.at(-1)?.author_id && <p>Propuso la última categoría <strong>{name(room.history.at(-1).author_id)}</strong>.</p>}
          <ol className="ums-list" aria-label="Puntuaciones">
            {room.ranking?.map(row => <li key={row.participant_id ?? row.group}>
              <span className="ums-position">{row.place ?? '–'}</span>
              <span>{row.group ? `Pareja ${row.group}` : name(row.participant_id)}</span>
              <strong className="ums-score">{row.total} pts</strong>
            </li>)}
          </ol>
          {leader && (phase === 'standings' ? action('Continuar', () => send('advance'), !readWindow)
            : action('Volver al lobby', () => send('rematch')))}
        </>}
      </section>
    </main>
    <dialog className="ums-dialog" ref={help} aria-labelledby="live-help">
      <h2 id="live-help">Cómo jugar</h2>
      <p>Confirma tu pareja y escribe tres respuestas por ronda. Una coincidencia con tu pareja vale 2 puntos en la misma posición o 1 en otra. Si solo ustedes escribieron esa respuesta, vale 5 o 3.</p>
      {action('Cerrar ayuda', () => help.current.close())}
    </dialog>
  </div>;
}
