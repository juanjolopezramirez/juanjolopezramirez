/* EL SONIDO DE LA LLUVIA (solo existe en el archivo que se baja: el portal en vivo sigue en silencio).

   Pedido del fundador (2026-10-30): «cinematografico, envolvente, que intrigue y sea sutil».
   Se FABRICA con el estudio de animacion/estudio.js (una sala de eco largo y oscuro, niveles
   bajos), sin grabar ni descargar nada, y con el azar de la semilla: suena igual cada vez.

   Lo que suena, en capas:
     · un ZUMBIDO grave que respira (el «cuerpo» de la escena), con acordes abiertos y un poco
       inquietantes: la א en re con quinta y novena (abierto, expectante), la מ sobre do con una
       septima menor (suspendido, latiendo), la ת sobre re con un semitono pegado (oscuro);
     · gotas: la lluvia son notas sueltas, suaves, que caen en la sala y se apagan lejos (tantas
       como signos cambian, mas fuertes cuanto mas fuerte llueve; imagen y sonido van juntos);
     · una TENSION que sube mientras la letra se descifra (aire que se abre y un brillo agudo
       apenas audible), y al quedar entera, el GOLPE: un grave que cae y se alarga en la sala;
         א  un destello alto y esperanzado despues del golpe;
         מ  un latido de fondo (un pulso grave por segundo, como el barrido amarillo);
         ת  en vez de subir, el tono BAJA hasta el golpe, y el aire se va como el de una
            pantalla que se apaga.
   Todo entra despacio (casi un segundo) y se va con un fundido largo. */
import { TIEMPO } from './lluvia.js';
import { crearEstudio } from './estudio.js';

const ARMONIA = {
  entrada: { notas: [73.42, 110, 164.81], gotas: [293.66, 349.23, 392, 440, 523.25, 587.33], raiz: 73.42 },
  carga: { notas: [65.41, 98, 116.54], gotas: [261.63, 311.13, 392, 466.16, 523.25], raiz: 65.41 },
  salida: { notas: [55, 73.42, 77.78], gotas: [233.08, 277.18, 311.13, 349.23], raiz: 73.42 }
};

/** @param {{ modo: string, duracion: number, fps: number, pasos: number[], fuerza: number[], azar: () => number }} p
    duracion en segundos; pasos[i] y fuerza[i], lo que paso en el cuadro i. */
export async function sintetizar({ modo, duracion, fps, pasos, fuerza, azar }) {
  const e = crearEstudio({ duracion, azar });
  const { ctx } = e;
  const a = ARMONIA[modo] || ARMONIA.entrada;
  const inicio = TIEMPO.letraInicio / 1000;
  const fin = (TIEMPO.letraInicio + TIEMPO.letraMs) / 1000;

  /* 1. El zumbido, de principio a fin */
  e.drone(a.notas, 0, duracion, 0.02, { subida: 1.6, bajada: 1.0, corte: modo === 'salida' ? 320 : 460 });

  /* 2. Las gotas: notas sueltas y suaves que caen en la sala */
  for (let i = 0; i < pasos.length; i++) {
    const n = pasos[i];
    if (!n || azar() > Math.min(1, n / 22)) continue;
    const desde = i / fps + azar() * 0.03;
    if (desde >= duracion - 0.3) continue;
    const g = e.voz(1.1, azar() * 1.4 - 0.7);
    e.sobre(g, desde, 0.008, 0.03 * Math.min(1, fuerza[i] || 0), 0.6);
    e.tono('sine', a.gotas[(azar() * a.gotas.length) | 0] * (azar() < 0.25 ? 2 : 1), desde, desde + 0.7, g);
  }

  /* 3. La tension mientras se descifra la letra */
  if (modo === 'salida') {
    /* baja: un tono que cae hasta el golpe */
    const g = e.voz(0.6);
    g.gain.setValueAtTime(0.0001, inicio);
    g.gain.linearRampToValueAtTime(0.05, inicio + 0.5);
    g.gain.linearRampToValueAtTime(0.0001, fin + 0.1);
    const f = e.filtro('lowpass', 900, 0.8, g);
    const o = e.tono('sawtooth', 196, inicio, fin + 0.15, f);
    o.frequency.exponentialRampToValueAtTime(42, fin);
  } else {
    /* sube: aire que se abre (ruido filtrado) y un brillo agudo apenas audible */
    const aire = e.voz(0.8);
    aire.gain.setValueAtTime(0.0001, inicio);
    aire.gain.linearRampToValueAtTime(modo === 'carga' ? 0.07 : 0.1, fin - 0.05);
    aire.gain.linearRampToValueAtTime(0.0001, fin + 0.15);
    const banda = e.filtro('bandpass', 160, 2.2, aire);
    banda.frequency.setValueAtTime(160, inicio);
    banda.frequency.exponentialRampToValueAtTime(2800, fin);
    e.fuenteRuido(inicio, fin + 0.2, banda);
    const brillo = e.voz(1.0, 0.3);
    brillo.gain.setValueAtTime(0.0001, inicio);
    brillo.gain.linearRampToValueAtTime(0.014, fin);
    brillo.gain.linearRampToValueAtTime(0.0001, fin + 1.2);
    for (const k of [8, 12, 16]) e.tono('sine', a.raiz * k, inicio, fin + 1.3, brillo);
  }

  /* 4. El golpe, cuando la letra queda entera */
  const nivelGolpe = modo === 'carga' ? 0.12 : modo === 'salida' ? 0.26 : 0.2;
  const sub = e.voz(0.25);
  e.sobre(sub, fin - 0.04, 0.012, nivelGolpe, 2.0);
  const caida = e.tono('sine', 54, fin - 0.04, fin + 2.2, sub);
  caida.frequency.exponentialRampToValueAtTime(30, fin + 1.8);
  const cuerpo = e.voz(0.9);
  e.sobre(cuerpo, fin - 0.04, 0.006, modo === 'salida' ? 0.1 : 0.07, 0.9);
  e.fuenteRuido(fin - 0.04, fin + 1.2, e.filtro('lowpass', modo === 'salida' ? 520 : 380, 0.7, cuerpo));
  const flor = e.voz(1.3, -0.2);                       // un acorde que solo se oye en la sala
  e.sobre(flor, fin, 0.3, 0.035, 2.6);
  for (const n of a.notas) { e.tono('sine', n * 2, fin, fin + 3.2, flor); e.tono('sine', n * 3, fin, fin + 3.2, flor); }

  if (modo === 'entrada') {                            // un destello alto y esperanzado
    const luz = e.voz(1.5, 0.4);
    e.sobre(luz, fin + 0.12, 0.5, 0.014, 3.0);
    e.tono('sine', 587.33, fin + 0.12, fin + 4, luz);
    e.tono('sine', 880, fin + 0.12, fin + 4, luz);
  } else if (modo === 'carga') {                       // el latido: un pulso grave por segundo, doble
    for (let t = 0.25; t < duracion - 0.8; t += 1) {
      for (const [dt, nivel] of [[0, 0.09], [0.28, 0.055]]) {
        const g = e.voz(0.5);
        e.sobre(g, t + dt, 0.006, nivel, 0.16);
        e.tono('sine', 58, t + dt, t + dt + 0.3, g);
      }
    }
  } else {                                             // salida: el aire se va, como una pantalla que se apaga
    const aire = e.voz(0.7);
    e.sobre(aire, fin - 0.02, 0.01, 0.07, 0.9);
    const f = e.filtro('lowpass', 1400, 0.9, aire);
    f.frequency.setValueAtTime(1400, fin);
    f.frequency.exponentialRampToValueAtTime(70, fin + 0.9);
    e.fuenteRuido(fin - 0.02, fin + 1.0, f);
  }

  return ctx.startRendering();
}
