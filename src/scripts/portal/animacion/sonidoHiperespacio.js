/* EL SONIDO DEL SALTO AL HIPERESPACIO (solo existe en el archivo que se baja).

   Tres partes, como la imagen (animacion/hiperespacio.js, `tiempos`):
     ACELERA   un aire que sube de tono (ruido filtrado que se abre hacia lo agudo), un zumbido
               grave que se eleva y un brillo agudo apenas audible: la tension de ir cada vez mas rapido;
     EL SALTO  el golpe: un grave que cae y se alarga en la sala, y un soplo de aire oscuro;
     FRENA     el aire baja de tono y se va, y un acorde luminoso (re mayor) florece en la sala:
               llegamos. Despues solo queda el grave calmado.
   Niveles bajos a proposito: lo sutil intriga mas que lo fuerte. El azar es el de la semilla. */
import { crearEstudio } from './estudio.js';
import { tiempos } from './hiperespacio.js';

/** @param {{ duracion: number, azar: () => number }} p  duracion en segundos */
export async function sintetizarHiperespacio({ duracion, azar }) {
  const e = crearEstudio({ duracion, azar, entra: 0.5, sale: 1.0, volumen: 2.0 });
  const { ctx } = e;
  const x = tiempos(duracion * 1000);
  const [a0, a1] = [x.acelera[0] / 1000, x.acelera[1] / 1000];
  const s1 = x.salto[1] / 1000, s0 = x.salto[0] / 1000;
  const f1 = x.frena[1] / 1000;

  /* el grave de fondo (la, mi, la) */
  e.drone([55, 82.41, 110], 0, duracion, 0.016, { subida: 1.2, bajada: 1.2, corte: 320 });

  /* 1. ACELERA: el aire sube de tono hacia lo agudo */
  const aire = e.voz(0.7);
  aire.gain.setValueAtTime(0.0001, a0);
  aire.gain.linearRampToValueAtTime(0.09, a1);
  aire.gain.linearRampToValueAtTime(0.0001, s1);
  const banda = e.filtro('bandpass', 180, 2.0, aire);
  banda.frequency.setValueAtTime(180, a0);
  banda.frequency.exponentialRampToValueAtTime(5200, a1);
  e.fuenteRuido(a0, s1 + 0.1, banda);
  /* el zumbido que se eleva */
  const zum = e.voz(0.6);
  zum.gain.setValueAtTime(0.0001, a0);
  zum.gain.linearRampToValueAtTime(0.05, a1);
  zum.gain.linearRampToValueAtTime(0.0001, s1);
  const f = e.filtro('lowpass', 900, 0.8, zum);
  const o = e.tono('sawtooth', 55, a0, s1 + 0.1, f);
  o.frequency.exponentialRampToValueAtTime(440, a1);
  /* el brillo agudo apenas audible */
  const brillo = e.voz(1.0, 0.3);
  brillo.gain.setValueAtTime(0.0001, a0);
  brillo.gain.linearRampToValueAtTime(0.012, a1);
  brillo.gain.linearRampToValueAtTime(0.0001, s1 + 0.5);
  for (const n of [880, 1320, 1760]) {
    const t = e.tono('sine', n, a0, s1 + 0.6, brillo);
    t.frequency.exponentialRampToValueAtTime(n * 2, a1);
  }

  /* 2. EL SALTO: el golpe grave que se alarga y un soplo oscuro */
  const sub = e.voz(0.25);
  e.sobre(sub, a1 - 0.03, 0.012, 0.22, 2.2);
  e.tono('sine', 62, a1 - 0.03, a1 + 2.4, sub).frequency.exponentialRampToValueAtTime(28, a1 + 2.0);
  const soplo = e.voz(0.9);
  e.sobre(soplo, a1 - 0.03, 0.006, 0.12, 0.9);
  e.fuenteRuido(a1 - 0.03, a1 + 1.2, e.filtro('lowpass', 700, 0.7, soplo));

  /* 3. FRENA: el aire baja de tono y se va; el acorde luminoso florece */
  const baja = e.voz(0.8, -0.2);
  e.sobre(baja, s0, 0.02, 0.08, Math.max(0.5, f1 - s0));
  const fb = e.filtro('bandpass', 5000, 1.4, baja);
  fb.frequency.setValueAtTime(5000, s0);
  fb.frequency.exponentialRampToValueAtTime(260, f1);
  e.fuenteRuido(s0, f1 + 0.2, fb);
  const flor = e.voz(1.5, 0.1);
  e.sobre(flor, s1, 0.8, 0.04, 3.4);
  for (const n of [146.83, 220, 293.66, 369.99, 587.33]) e.tono('sine', n, s1, Math.min(duracion, s1 + 5), flor);

  return ctx.startRendering();
}
