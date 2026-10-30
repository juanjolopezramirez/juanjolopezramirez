/* EL SONIDO DE LA ROSA (solo existe en el archivo que se baja; en el sitio la rosa es muda).

   Cinematografico y sutil, como el de la lluvia, pero de tiza sobre un pizarron: una sala de eco
   largo, un grave tibio apenas audible y, cada vuelta (2 s), el roce de la tiza cuando el aro se
   dibuja y se borra (ruido que sube y baja de tono). En «el libro llega» ademas:
     cada pagina   un golpecito de madera, mas agudo cuanto mas avanza el libro, y un chasquido de tiza;
     el «listo»    el grave se abre en un acorde luminoso (re mayor) y la tiza traza la marca.
   Los momentos los da animacion/rosa.js (`eventos`, en milisegundos del video), asi que sonido e
   imagen van juntos por construccion. El azar es el de la semilla: suena igual cada vez. */
import { crearEstudio } from './estudio.js';

/** @param {{ duracion: number, eventos: {tipo:string,t0:number,t1:number,i?:number}[], azar: () => number }} p */
export async function sintetizarRosa({ duracion, eventos, azar }) {
  const e = crearEstudio({ duracion, azar, entra: 0.8, sale: 1.0, volumen: 2.0 });
  const { ctx } = e;
  const libro = eventos.length > 0;

  /* el grave tibio (re, la, re): casi no se nota, pero llena la sala */
  e.drone([73.42, 110, 146.83], 0, duracion, 0.016, { subida: 1.6, bajada: 1.0, corte: 340 });

  /* el roce de la tiza en cada vuelta: sube mientras el aro se dibuja (1 s) y baja cuando se borra */
  for (let c = 0; c * 2 < duracion - 0.3; c++) {
    const t0 = c * 2;
    const g = e.voz(0.5, c % 2 ? 0.25 : -0.25);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(libro ? 0.05 : 0.07, t0 + 0.75);
    g.gain.linearRampToValueAtTime(0.0001, t0 + 1.9);
    const banda = e.filtro('bandpass', 500, 1.6, g);
    banda.frequency.setValueAtTime(500, t0);
    banda.frequency.exponentialRampToValueAtTime(2600, t0 + 0.9);
    banda.frequency.exponentialRampToValueAtTime(700, t0 + 1.9);
    e.fuenteRuido(t0, t0 + 2, banda);
  }

  for (const ev of eventos) {
    const t0 = ev.t0 / 1000;
    if (t0 >= duracion - 0.2) continue;
    if (ev.tipo === 'pagina') {
      /* un golpecito de madera que sube con cada pagina, y un chasquido de tiza */
      const f = 330 * Math.pow(2, (ev.i || 0) / 12);
      const g = e.voz(0.7, -0.5 + ((ev.i || 0) % 10) / 9);
      e.sobre(g, t0, 0.003, 0.06, 0.28);
      e.tono('triangle', f, t0, t0 + 0.5, g);
      e.tono('sine', f * 2, t0, t0 + 0.5, g);
      const r = e.voz(0.4);
      e.sobre(r, t0, 0.002, 0.03, 0.05);
      e.fuenteRuido(t0, t0 + 0.1, e.filtro('bandpass', 3800 + azar() * 800, 1.8, r));
    } else if (ev.tipo === 'listo') {
      /* el acorde que se abre, y la tiza que traza la marca */
      const flor = e.voz(1.5, 0.1);
      e.sobre(flor, t0, 0.5, 0.04, 3.2);
      for (const n of [146.83, 220, 293.66, 369.99, 587.33]) e.tono('sine', n, t0, t0 + 4.5, flor);
      const dur = Math.max(0.2, (ev.t1 - ev.t0) / 1000);
      const g = e.voz(0.5, 0.2);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.08, t0 + dur * 0.5);
      g.gain.linearRampToValueAtTime(0.0001, t0 + dur + 0.1);
      const banda = e.filtro('bandpass', 1800, 1.4, g);
      banda.frequency.setValueAtTime(1800, t0);
      banda.frequency.exponentialRampToValueAtTime(3600, t0 + dur);
      e.fuenteRuido(t0, t0 + dur + 0.15, banda);
    }
  }
  return ctx.startRendering();
}
