/* EL SONIDO DEL PAPIRO (solo existe en el archivo que se baja).

   Cinematografico, envolvente y sutil, como el de la lluvia, pero de un escritorio antiguo: una
   sala de eco largo, un grave calido que apenas se oye, el roce del papel al empezar, y la
   PLUMA — cada trazo suena como un rasgado fino de pluma sobre papiro, mas largo si el trazo es
   largo y mas apagado al final, con un golpecito suave al levantarla. Los trazos los da
   animacion/papiro.js (`eventos`: cuando empieza y acaba cada uno), asi que sonido e imagen van
   juntos por construccion. La raya final (roja) cierra con un golpe grave y un acorde que
   florece en la sala. El azar es el de la semilla: suena igual cada vez. */
import { crearEstudio } from './estudio.js';

/** @param {{ duracion: number, eventos: {t0: number, t1: number, ganadora: boolean}[], azar: () => number }} p
    duracion en segundos; los tiempos de `eventos`, en milisegundos del video. */
export async function sintetizarPapiro({ duracion, eventos, azar }) {
  const e = crearEstudio({ duracion, azar, entra: 1.0, sale: 1.0, volumen: 2.1 });      // el rasgado de la pluma es fino: pide mas volumen que la lluvia
  const { ctx } = e;

  /* El grave calido de fondo (la, mi, la): apenas se nota, pero llena la sala */
  e.drone([55, 82.41, 110], 0, duracion, 0.014, { subida: 2.2, bajada: 1.0, corte: 300 });

  /* El roce del papel al empezar: ruido grave que sube y baja en un segundo */
  const roce = e.voz(0.3, -0.15);
  e.sobre(roce, 0.05, 0.45, 0.07, 0.75);
  e.fuenteRuido(0.05, 1.5, e.filtro('lowpass', 1300, 0.7, roce));

  /* La pluma: un rasgado fino por trazo */
  for (const ev of eventos) {
    const t0 = ev.t0 / 1000;
    if (t0 >= duracion - 0.3) continue;
    const dur = Math.max(0.1, Math.min(ev.t1 / 1000, duracion - 0.25) - t0);
    const nivel = ev.ganadora ? 0.14 : 0.1;
    const g = e.voz(0.2, azar() * 0.6 - 0.3);
    /* la textura del rasgado: el volumen tiembla (presion irregular) y se apaga al final */
    const puntos = 16;
    const curva = new Float32Array(puntos);
    for (let i = 0; i < puntos; i++) {
      const u = (i + 0.5) / puntos;
      curva[i] = nivel * (0.4 + 0.6 * azar()) * Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.6;
    }
    g.gain.setValueCurveAtTime(curva, t0, dur);
    const banda = e.filtro('bandpass', 2300 + azar() * 1500, 1.1, g);
    e.fuenteRuido(t0, t0 + dur + 0.02, banda);
    const cuerpo = e.filtro('bandpass', 620 + azar() * 220, 0.9, g);      // un poco de «madera» de la pluma
    e.fuenteRuido(t0, t0 + dur + 0.02, cuerpo);

    /* el golpecito al levantar la pluma */
    const fin = t0 + dur;
    const toque = e.voz(0.5, azar() * 0.4 - 0.2);
    e.sobre(toque, fin, 0.004, ev.ganadora ? 0.03 : 0.016, 0.09);
    e.tono('sine', ev.ganadora ? 110 : 165, fin, fin + 0.2, toque);

    /* la raya que gana: el golpe grave y el acorde que florece */
    if (ev.ganadora) {
      const sub = e.voz(0.3);
      e.sobre(sub, fin, 0.01, 0.16, 1.7);
      const caida = e.tono('sine', 62, fin, fin + 2, sub);
      caida.frequency.exponentialRampToValueAtTime(36, fin + 1.5);
      const flor = e.voz(1.4, 0.15);
      e.sobre(flor, fin + 0.05, 0.35, 0.035, 3.0);
      for (const n of [110, 164.81, 220, 329.63]) e.tono('sine', n, fin + 0.05, fin + 4, flor);
    }
  }

  return ctx.startRendering();
}
