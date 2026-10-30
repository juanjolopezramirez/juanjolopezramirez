/* EL SONIDO DE «EL JUEGO QUE EL AMOR YA GANO» (solo existe en el archivo que se baja).

   Cinematografico, envolvente y sutil, como el de la lluvia, pero de una escena de madera y metal:
   una sala de eco largo, un grave calido y oscuro, y cada pieza con SU sonido al caer —
     el tablero   un roce largo de madera que se abre (ruido que sube de tono) y un golpe sordo al acabar;
     los clavos   un «tin» de metal, agudo y corto, con un golpecito grave;
     la moneda    un tintineo brillante que cae y rueda (parciales altos que se apagan);
     la lanza     otro metal, mas afilado;
     la corona    un rasguño de espinas (ruido agudo en rafagas cortas);
     la cruz      un golpe grave de madera pesada que se alarga en la sala;
     los corazones  el grave oscuro se abre: un acorde luminoso (re mayor) florece en la sala, y el
                    latido (lub-dub) late por debajo. El amor ya gano: la escena termina en luz.
   Los momentos los da animacion/papiro.js (`eventos`: cuando empieza y acaba cada cosa, en
   milisegundos del video), asi que sonido e imagen van juntos por construccion. El azar es el de la
   semilla: suena igual cada vez. */
import { crearEstudio } from './estudio.js';

/** @param {{ duracion: number, eventos: {tipo: string, t0: number, t1: number}[], azar: () => number }} p
    duracion en segundos; los tiempos de `eventos`, en milisegundos del video. */
export async function sintetizarPapiro({ duracion, eventos, azar }) {
  const e = crearEstudio({ duracion, azar, entra: 1.0, sale: 1.2, volumen: 2.0 });
  const { ctx } = e;

  /* El grave oscuro de fondo (la, mi, la): casi no se nota, pero llena la sala; se abre cuando llegan los corazones */
  e.drone([55, 82.41, 110], 0, duracion, 0.016, { subida: 2.0, bajada: 1.2, corte: 300 });

  /* Un golpe grave de madera (lo usan el tablero y la cruz): un tono que cae y un soplo de ruido grave */
  const golpe = (desde, nivel, base, decaimiento) => {
    const g = e.voz(0.35);
    e.sobre(g, desde, 0.006, nivel, decaimiento);
    e.tono('sine', base, desde, desde + decaimiento + 0.3, g).frequency.exponentialRampToValueAtTime(base * 0.6, desde + decaimiento);
    const r = e.voz(0.4);
    e.sobre(r, desde, 0.004, nivel * 0.5, 0.22);
    e.fuenteRuido(desde, desde + 0.4, e.filtro('lowpass', 520, 0.8, r));
  };
  /* Un «tin» de metal: parciales agudos que se apagan, mas largos cuanto mas grande sea la sala que les des */
  const metal = (desde, parciales, nivel, decaimiento, sala = 0.9, pan = 0) => {
    parciales.forEach((f, i) => {
      const g = e.voz(sala, pan);
      e.sobre(g, desde, 0.002, 1.35 * nivel / (i + 1), decaimiento / (1 + i * 0.4));
      e.tono('sine', f, desde, desde + decaimiento + 0.2, g);
    });
  };

  let latidos = 0;
  for (const ev of eventos) {
    const t0 = ev.t0 / 1000, t1 = ev.t1 / 1000;
    if (t0 >= duracion - 0.2) continue;
    const dur = Math.max(0.2, t1 - t0);
    switch (ev.tipo) {
      case 'tablero': {
        /* el roce de la madera: ruido que sube de tono mientras el pincel pasa, y un golpe sordo al acabar */
        const g = e.voz(0.6, -0.1);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.1, t0 + dur * 0.4);
        g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
        const banda = e.filtro('bandpass', 260, 1.4, g);
        banda.frequency.setValueAtTime(260, t0);
        banda.frequency.exponentialRampToValueAtTime(1500, t0 + dur);
        e.fuenteRuido(t0, t0 + dur + 0.05, banda);
        golpe(t1, 0.1, 80, 0.7);
        break;
      }
      case 'clavos':
        metal(t1 - 0.04, [2100, 3150], 0.05, 0.4, 0.9, -0.2);
        golpe(t1 - 0.04, 0.07, 130, 0.35);
        break;
      case 'moneda':
        metal(t1 - 0.04, [2300, 3450, 4700], 0.045, 1.0, 1.1, 0.25);
        metal(t1 + 0.16, [2300, 3450], 0.02, 0.6, 1.1, 0.25);      // la moneda rebota una vez
        break;
      case 'lanza':
        metal(t1 - 0.04, [2800, 4200], 0.045, 0.45, 0.9, 0.2);
        golpe(t1 - 0.04, 0.07, 150, 0.3);
        break;
      case 'corona': {
        /* el rasguño de las espinas: rafagas cortas de ruido agudo */
        for (let i = 0; i < 4; i++) {
          const d = t1 - 0.3 + i * 0.07 + azar() * 0.02;
          const g = e.voz(0.5, azar() * 0.8 - 0.4);
          e.sobre(g, d, 0.003, 0.05, 0.07);
          e.fuenteRuido(d, d + 0.12, e.filtro('bandpass', 3000 + azar() * 1800, 1.6, g));
        }
        golpe(t1 - 0.02, 0.06, 115, 0.3);
        break;
      }
      case 'cruz':
        golpe(t1 - 0.04, 0.2, 72, 1.0);
        metal(t1 - 0.04, [196, 294], 0.03, 2.2, 1.4, 0);              // un tañido grave que se alarga en la sala
        break;
      case 'corazones': {
        /* el amor gana: un acorde luminoso (re mayor) florece despacio en la sala */
        const flor = e.voz(1.5, 0.1);
        e.sobre(flor, t0, 0.9, 0.065, 3.4);
        for (const n of [146.83, 220, 293.66, 369.99, 587.33]) e.tono('sine', n, t0, t0 + 5, flor);
        break;
      }
      case 'latido': {
        /* lub (el golpe mas fuerte) y dub (el mas suave): un pulso grave */
        const g = e.voz(0.4);
        e.sobre(g, t0, 0.006, latidos++ % 2 === 0 ? 0.16 : 0.1, 0.17);
        e.tono('sine', 58, t0, t0 + 0.4, g).frequency.exponentialRampToValueAtTime(44, t0 + 0.17);
        break;
      }
      default:
        break;
    }
  }

  return ctx.startRendering();
}
