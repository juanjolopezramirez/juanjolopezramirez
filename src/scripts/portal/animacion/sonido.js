/* EL SONIDO DEL VIDEO (solo existe en el archivo que se baja: el portal en vivo sigue en silencio).

   Se FABRICA, no se graba ni se descarga: unos cuantos osciladores y un poco de ruido, mezclados
   en un OfflineAudioContext (un estudio de audio que trabaja mas rapido que el tiempo real y no
   necesita altavoces ni permiso). El ruido sale del mismo azar con semilla que la imagen, asi el
   mismo video suena igual cada vez.

   Que suena:
     · la lluvia: «ticks» suaves y agudos, tantos como signos cambian, mas fuertes cuanto mas
       fuerte llueve (los pasos de la lluvia los da lluvia.js, cuadro a cuadro: imagen y sonido
       van juntos por construccion);
     · la letra: mientras se descifra, y un acorde al quedar entera;
         entrada (א)  una subida de tono y un acorde brillante (la mayor);
         carga (מ)    un pulso suave que late una vez por segundo, y un acorde tranquilo;
         salida (ת)   una bajada de tono y, al final, el golpe grave de una pantalla de tubo que se apaga.
   Todo entra con un fundido de 80 ms y sale con uno de medio segundo. */
import { TIEMPO } from './lluvia.js';

export const FRECUENCIA = 48000;
const NOTAS = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];        // pentatonica de do: los ticks nunca desafinan

/** @param {{ modo: string, duracion: number, fps: number, pasos: number[], fuerza: number[], azar: () => number }} p
    duracion en segundos; pasos[i] y fuerza[i], lo que paso en el cuadro i. */
export async function sintetizar({ modo, duracion, fps, pasos, fuerza, azar }) {
  const ctx = new OfflineAudioContext(2, Math.ceil(duracion * FRECUENCIA), FRECUENCIA);
  const inicio = TIEMPO.letraInicio / 1000;
  const fin = (TIEMPO.letraInicio + TIEMPO.letraMs) / 1000;

  /* La salida: un compresor suave (para que nada sature) y los fundidos */
  const compresor = ctx.createDynamicsCompressor();
  compresor.connect(ctx.destination);
  const maestro = ctx.createGain();
  maestro.connect(compresor);
  maestro.gain.setValueAtTime(0, 0);
  maestro.gain.linearRampToValueAtTime(0.9, 0.08);
  maestro.gain.setValueAtTime(0.9, Math.max(0.1, duracion - 0.5));
  maestro.gain.linearRampToValueAtTime(0, duracion);

  /* Ruido con semilla (dos segundos, se reutiliza) */
  const ruido = ctx.createBuffer(1, FRECUENCIA * 2, FRECUENCIA);
  const datos = ruido.getChannelData(0);
  for (let i = 0; i < datos.length; i++) datos[i] = azar() * 2 - 1;
  const fuenteRuido = (desde, hasta, destino) => {
    const s = ctx.createBufferSource();
    s.buffer = ruido;
    s.loop = true;
    s.connect(destino);
    s.start(desde);
    s.stop(hasta);
    return s;
  };
  const tono = (tipo, frecuencia, desde, hasta, destino) => {
    const o = ctx.createOscillator();
    o.type = tipo;
    o.frequency.setValueAtTime(frecuencia, desde);
    o.connect(destino);
    o.start(desde);
    o.stop(hasta);
    return o;
  };
  const volumen = (destino, nivel = 0) => { const g = ctx.createGain(); g.gain.value = nivel; g.connect(destino); return g; };
  const sobre = (g, desde, subida, nivel, bajada) => {         // una envolvente: sube a `nivel` y se apaga
    g.gain.setValueAtTime(0.0001, desde);
    g.gain.linearRampToValueAtTime(nivel, desde + subida);
    g.gain.exponentialRampToValueAtTime(0.0001, desde + subida + bajada);
  };

  /* LA LLUVIA: un tick por cuadro como mucho, con probabilidad segun cuantos signos cambiaron */
  for (let i = 0; i < pasos.length; i++) {
    const n = pasos[i];
    if (!n || azar() > Math.min(1, n / 10)) continue;
    const desde = i / fps + azar() * 0.02;
    if (desde >= duracion - 0.05) continue;
    const pan = ctx.createStereoPanner();
    pan.pan.value = azar() * 1.6 - 0.8;
    pan.connect(maestro);
    const g = volumen(pan);
    sobre(g, desde, 0.002, 0.03 * Math.min(1, fuerza[i] || 0), 0.05);
    tono('sine', NOTAS[(azar() * NOTAS.length) | 0] * (azar() < 0.3 ? 2 : 1), desde, desde + 0.07, g);
  }

  /* LA LETRA */
  if (modo === 'entrada') {
    const subida = volumen(maestro);
    subida.gain.setValueAtTime(0, inicio);
    subida.gain.linearRampToValueAtTime(0.1, fin - 0.1);
    subida.gain.linearRampToValueAtTime(0, fin + 0.05);
    const o = tono('triangle', 110, inicio, fin + 0.1, subida);
    o.frequency.exponentialRampToValueAtTime(880, fin);
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.setValueAtTime(300, inicio);
    filtro.frequency.exponentialRampToValueAtTime(4000, fin);
    const aire = volumen(maestro);
    aire.gain.setValueAtTime(0, inicio);
    aire.gain.linearRampToValueAtTime(0.05, fin - 0.1);
    aire.gain.linearRampToValueAtTime(0, fin + 0.05);
    filtro.connect(aire);
    fuenteRuido(inicio, fin + 0.1, filtro);
    for (const [f, nivel] of [[880, 0.14], [1318.5, 0.09], [1760, 0.04]]) {
      const g = volumen(maestro);
      sobre(g, fin, 0.01, nivel, 1.3);
      tono('sine', f, fin, fin + 1.5, g);
    }
  } else if (modo === 'carga') {
    /* un pulso por segundo (como el barrido amarillo): dos notas con el volumen subiendo y bajando */
    const pulso = volumen(maestro, 0.035);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 1;
    const profundidad = ctx.createGain();
    profundidad.gain.value = 0.03;
    lfo.connect(profundidad);
    profundidad.connect(pulso.gain);
    lfo.start(0.2);
    lfo.stop(duracion);
    tono('sine', 330, 0.2, duracion, pulso);
    tono('sine', 495, 0.2, duracion, pulso);
    for (const [f, nivel] of [[659.25, 0.1], [987.77, 0.05]]) {
      const g = volumen(maestro);
      sobre(g, fin, 0.02, nivel, 1.4);
      tono('sine', f, fin, fin + 1.6, g);
    }
  } else {
    /* salida: baja de tono mientras se descifra, y al final el golpe grave de la pantalla que se apaga */
    const baja = volumen(maestro);
    baja.gain.setValueAtTime(0, inicio);
    baja.gain.linearRampToValueAtTime(0.09, inicio + 0.3);
    baja.gain.linearRampToValueAtTime(0, fin);
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 1800;
    filtro.connect(baja);
    const o = tono('sawtooth', 880, inicio, fin + 0.05, filtro);
    o.frequency.exponentialRampToValueAtTime(55, fin);
    const golpe = volumen(maestro);
    sobre(golpe, fin, 0.005, 0.3, 0.9);
    const grave = tono('sine', 70, fin, fin + 1, golpe);
    grave.frequency.exponentialRampToValueAtTime(38, fin + 0.8);
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 900;
    const soplo = volumen(maestro);
    sobre(soplo, fin, 0.003, 0.12, 0.18);
    lpf.connect(soplo);
    fuenteRuido(fin, fin + 0.3, lpf);
  }

  return ctx.startRendering();
}
