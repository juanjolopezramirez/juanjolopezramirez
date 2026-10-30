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
   Mas cine (2026-10-30, pedido del fundador): un grave de templo que sube todo el juego, aire que se junta
   antes de cada golpe, golpes que caen por debajo de lo que se oye y se alargan en la sala, y al final
   el amor llega sin ruido, como una luz.
   Los momentos los da animacion/papiro.js (`eventos`: cuando empieza y acaba cada cosa, en
   milisegundos del video), asi que sonido e imagen van juntos por construccion. El azar es el de la
   semilla: suena igual cada vez. */
import { crearEstudio } from './estudio.js';

/** @param {{ duracion: number, eventos: {tipo: string, t0: number, t1: number}[], azar: () => number }} p
    duracion en segundos; los tiempos de `eventos`, en milisegundos del video. */
export async function sintetizarPapiro({ duracion, eventos, azar }) {
  const e = crearEstudio({ duracion, azar, entra: 1.2, sale: 1.6, volumen: 1.3 });
  const { ctx } = e;
  const llegada = eventos.find((v) => v.tipo === 'corazones');
  const tCorazones = llegada ? llegada.t0 / 1000 : duracion * 0.7;

  /* El grave oscuro de fondo (mi, la, mi, la): llena la sala como el aire de un templo */
  e.drone([41.2, 55, 82.41, 110], 0, duracion, 0.022, { subida: 2.4, bajada: 1.6, corte: 280 });
  /* Una marea que SUBE durante todo el juego (la tension) y se abre en el acorde cuando llegan los corazones */
  const marea = e.voz(1.0, 0);
  marea.gain.setValueAtTime(0.0001, 0);
  marea.gain.linearRampToValueAtTime(0.03, Math.max(1, tCorazones));
  marea.gain.exponentialRampToValueAtTime(0.0001, Math.min(duracion, tCorazones + 2.4));
  const fm = e.filtro('lowpass', 420, 0.8, marea);
  fm.frequency.setValueAtTime(260, 0);
  fm.frequency.exponentialRampToValueAtTime(900, Math.max(1, tCorazones));
  for (const n of [55, 82.41, 110]) e.tono('sawtooth', n, 0, Math.min(duracion, tCorazones + 2.5), fm);

  /* El aire que se junta antes de un golpe (un «riser» al reves): ruido que sube de tono y de fuerza */
  const aire = (hasta, largo, nivel, f0, f1, pan = 0) => {
    const g = e.voz(1.0, pan);
    g.gain.setValueAtTime(0.0001, hasta - largo);
    g.gain.exponentialRampToValueAtTime(nivel, hasta - 0.02);
    g.gain.linearRampToValueAtTime(0.0001, hasta + 0.05);
    const b = e.filtro('bandpass', f0, 1.2, g);
    b.frequency.setValueAtTime(f0, hasta - largo);
    b.frequency.exponentialRampToValueAtTime(f1, hasta);
    e.fuenteRuido(hasta - largo, hasta + 0.1, b);
  };
  /* Un golpe grave de cine: el tono cae por debajo de lo que se oye y se alarga en la sala; un soplo oscuro lo acompaña */
  const golpe = (desde, nivel, base, cola) => {
    const g = e.voz(0.8);
    e.sobre(g, desde, 0.008, nivel, cola);
    e.tono('sine', base, desde, desde + cola + 0.4, g).frequency.exponentialRampToValueAtTime(base * 0.55, desde + cola);
    const r = e.voz(0.9);
    e.sobre(r, desde, 0.004, nivel * 0.55, Math.min(0.9, cola * 0.5));
    e.fuenteRuido(desde, desde + 1.2, e.filtro('lowpass', 480, 0.8, r));
  };
  /* Un «tin» de metal: parciales agudos que se apagan despacio en una sala grande */
  const metal = (desde, parciales, nivel, decaimiento, sala = 1.3, pan = 0) => {
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
      case 'trazo': {
        /* una linea del tablero: el roce de la madera, que sube de tono mientras el pincel pasa (las dos verticales
           suenan a la izquierda y la derecha, las horizontales al centro), y un golpe sordo al soltarlo; el de la
           cuarta linea, que cierra el tablero, es el hondo */
        const pan = [-0.35, 0.35, -0.1, 0.1][ev.i] || 0;
        const g = e.voz(0.9, pan);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.09, t0 + dur * 0.5);
        g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
        const banda = e.filtro('bandpass', 240, 1.4, g);
        banda.frequency.setValueAtTime(240, t0);
        banda.frequency.exponentialRampToValueAtTime(1500 + ev.i * 120, t0 + dur);
        e.fuenteRuido(t0, t0 + dur + 0.05, banda);
        if (ev.i === 3) golpe(t1, 0.15, 64, 1.8); else golpe(t1, 0.05, 90 - ev.i * 6, 0.7);
        break;
      }
      case 'clavos':
        aire(t1 - 0.04, 0.4, 0.035, 500, 3000, -0.2);
        metal(t1 - 0.04, [2100, 3150], 0.05, 0.9, 1.4, -0.2);
        golpe(t1 - 0.04, 0.13, 92, 1.3);
        break;
      case 'moneda':
        aire(t1 - 0.04, 0.35, 0.02, 1200, 5000, 0.25);
        metal(t1 - 0.04, [2300, 3450, 4700], 0.045, 2.0, 1.6, 0.25);
        metal(t1 + 0.16, [2300, 3450], 0.02, 1.2, 1.6, 0.25);      // la moneda rebota una vez
        golpe(t1 - 0.04, 0.06, 110, 0.9);
        break;
      case 'lanza':
        aire(t1 - 0.04, 0.45, 0.045, 300, 4500, 0.2);              // el silbido de la lanza
        metal(t1 - 0.04, [2800, 4200], 0.045, 1.0, 1.4, 0.2);
        golpe(t1 - 0.04, 0.12, 100, 1.2);
        break;
      case 'corona': {
        /* el rasguño de las espinas, y debajo un grave oscuro e inquieto (dos notas pegadas que laten) */
        for (let i = 0; i < 4; i++) {
          const d = t1 - 0.3 + i * 0.07 + azar() * 0.02;
          const g = e.voz(0.9, azar() * 0.8 - 0.4);
          e.sobre(g, d, 0.003, 0.05, 0.1);
          e.fuenteRuido(d, d + 0.15, e.filtro('bandpass', 3000 + azar() * 1800, 1.6, g));
        }
        const oscuro = e.voz(1.2);
        e.sobre(oscuro, t1 - 0.2, 0.25, 0.035, 1.8);
        e.tono('sine', 98, t1 - 0.2, t1 + 2.2, oscuro);
        e.tono('sine', 103.8, t1 - 0.2, t1 + 2.2, oscuro);
        golpe(t1 - 0.02, 0.11, 105, 1.2);
        break;
      }
      case 'cruz': {
        /* el golpe mayor: el aire se junta casi un segundo, y cae un grave enorme con un tañido que se alarga */
        aire(t1 - 0.04, 0.9, 0.06, 140, 2200);
        golpe(t1 - 0.04, 0.3, 50, 3.2);
        metal(t1 - 0.04, [196, 294, 392], 0.04, 3.2, 1.6, 0);
        const metales = e.voz(1.4);
        e.sobre(metales, t1 - 0.04, 0.05, 0.04, 2.6);
        const fb = e.filtro('lowpass', 420, 0.8, metales);
        e.tono('sawtooth', 98, t1 - 0.04, t1 + 3, fb);
        e.tono('sawtooth', 147, t1 - 0.04, t1 + 3, fb);
        break;
      }
      case 'corazones': {
        /* el amor gana, sin ruido: un acorde luminoso (re mayor) florece muy despacio, con un brillo apenas audible */
        const flor = e.voz(1.6, 0.1);
        e.sobre(flor, t0, 1.4, 0.06, 4.4);
        const velo = e.filtro('lowpass', 1800, 0.7, flor);
        for (const n of [146.83, 220, 293.66, 369.99, 587.33]) {
          e.tono('sine', n, t0, t0 + 6, flor);
          e.tono('triangle', n * 1.004, t0, t0 + 6, velo);
        }
        const brillo = e.voz(1.8, -0.2);
        e.sobre(brillo, t0 + 0.5, 1.8, 0.008, 3.4);
        for (const n of [1174.66, 1567.98]) e.tono('sine', n, t0 + 0.5, t0 + 6, brillo);
        break;
      }
      case 'latido': {
        /* lub y dub: un pulso grave y suave, casi un recuerdo */
        const g = e.voz(0.8);
        e.sobre(g, t0, 0.01, latidos++ % 2 === 0 ? 0.1 : 0.06, 0.22);
        e.tono('sine', 56, t0, t0 + 0.5, g).frequency.exponentialRampToValueAtTime(42, t0 + 0.22);
        break;
      }
      default:
        break;
    }
  }

  return ctx.startRendering();
}
