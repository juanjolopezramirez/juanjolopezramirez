/* EL SONIDO DE «EL JUEGO QUE EL AMOR YA GANO» (solo existe en el archivo que se baja).

   Rustico y suave (2026-11-01, pedido del fundador: el primero era de cine, de metal y de golpes
   hondos; ahora suena a taller de carpintero y a papiro): madera, barro, cuerda y papel, todo en
   voz baja, en una sala pequeña y calida, sin agudos que piquen.
     el tablero   cada linea es un roce de pigmento sobre papiro (ruido suave que sube un poco de tono) y,
                  al soltarla, un «toc» de madera apenas; la cuarta cierra con un toc mas hondo;
     los clavos   dos toques secos de hierro viejo (un toc de madera y un tintineo apagado y bajo);
     la moneda    un tintineo de barro, corto, que rebota una vez;
     la lanza     un silbo de aire corto y un toc de madera;
     la corona    ramitas secas que crujen (rafagas cortas de ruido medio) y un toc;
     la cruz      el toc mayor: madera pesada, un golpe hondo y redondo, sin retumbar;
     los corazones  una cuerda pulsada, tres notas de re mayor una tras otra, que se apagan despacio:
                    el amor ya gano, sin ruido; y el latido (lub-dub) late muy bajito por debajo.
   Debajo de todo, un zumbido grave y apenas audible (como el aire de una casa de adobe).
   Los momentos los da animacion/papiro.js (`eventos`: cuando empieza y acaba cada cosa, en
   milisegundos del video), asi que sonido e imagen van juntos por construccion. El azar es el de la
   semilla: suena igual cada vez. */
import { crearEstudio } from './estudio.js';

/** @param {{ duracion: number, eventos: {tipo: string, t0: number, t1: number}[], azar: () => number }} p
    duracion en segundos; los tiempos de `eventos`, en milisegundos del video. */
export async function sintetizarPapiro({ duracion, eventos, azar }) {
  /* volumen: medido en Chromium, el de antes tenia pico 0.61 y RMS -19.6 dB; este, pico ~0.3 y RMS ~ -28 dB
     (unos 8 dB mas bajo, «algo», no un susurro) */
  const e = crearEstudio({ duracion, azar, entra: 1.0, sale: 1.4, volumen: 1.7 });

  /* El aire de la casa: un zumbido grave y suave, apenas se oye */
  e.drone([55, 82.41], 0, duracion, 0.010, { subida: 2.0, bajada: 1.4, corte: 200 });

  /* Un «toc» de madera: un tono medio que cae un poco y un chasquido corto y opaco; redondo, sin brillo */
  const toc = (desde, nivel, base = 190, pan = 0, sala = 0.35) => {
    const g = e.voz(sala, pan);
    e.sobre(g, desde, 0.004, nivel, 0.16);
    e.tono('sine', base, desde, desde + 0.3, g).frequency.exponentialRampToValueAtTime(base * 0.62, desde + 0.14);
    const c = e.voz(sala * 0.7, pan);
    e.sobre(c, desde, 0.002, nivel * 0.7, 0.035);
    e.fuenteRuido(desde, desde + 0.1, e.filtro('bandpass', 900, 1.0, c));
  };
  /* Un golpe hondo y redondo (la madera pesada): baja y se apaga pronto; sin retumbo */
  const hondo = (desde, nivel, base = 78, cola = 0.5, pan = 0) => {
    const g = e.voz(0.45, pan);
    e.sobre(g, desde, 0.006, nivel, cola);
    e.tono('sine', base, desde, desde + cola + 0.3, g).frequency.exponentialRampToValueAtTime(base * 0.7, desde + cola);
    const r = e.voz(0.3, pan);
    e.sobre(r, desde, 0.004, nivel * 0.4, 0.07);
    e.fuenteRuido(desde, desde + 0.2, e.filtro('lowpass', 420, 0.7, r));
  };
  /* Un roce suave (pigmento sobre papiro, un soplo): ruido medio que sube un poco de tono, sin agudos */
  const roce = (desde, largo, nivel, f0, f1, pan = 0) => {
    const g = e.voz(0.35, pan);
    g.gain.setValueAtTime(0.0001, desde);
    g.gain.linearRampToValueAtTime(nivel, desde + largo * 0.45);
    g.gain.linearRampToValueAtTime(0.0001, desde + largo);
    const b = e.filtro('bandpass', f0, 0.9, g);
    b.frequency.setValueAtTime(f0, desde);
    b.frequency.exponentialRampToValueAtTime(f1, desde + largo);
    e.fuenteRuido(desde, desde + largo + 0.05, e.filtro('lowpass', 2400, 0.6, b));
  };
  /* Un tintineo apagado (hierro viejo o barro): pocos parciales, medios y bajos, que se apagan pronto */
  const tintineo = (desde, parciales, nivel, decaimiento, pan = 0) => {
    parciales.forEach((f, i) => {
      const g = e.voz(0.55, pan);
      e.sobre(g, desde, 0.003, nivel / (i + 1), decaimiento / (1 + i * 0.5));
      e.tono('sine', f, desde, desde + decaimiento + 0.1, g);
    });
  };
  /* Una cuerda pulsada (suave, de laud): una nota que nace de golpe y se apaga despacio */
  const cuerda = (desde, frecuencia, nivel, cola, pan = 0) => {
    const g = e.voz(0.9, pan);
    e.sobre(g, desde, 0.006, nivel, cola);
    const velo = e.filtro('lowpass', 1500, 0.7, g);
    e.tono('triangle', frecuencia, desde, desde + cola + 0.3, velo);
    e.tono('sine', frecuencia * 2, desde, desde + cola * 0.5 + 0.3, velo);
  };

  let latidos = 0;
  for (const ev of eventos) {
    const t0 = ev.t0 / 1000, t1 = ev.t1 / 1000;
    if (t0 >= duracion - 0.2) continue;
    const dur = Math.max(0.2, t1 - t0);
    switch (ev.tipo) {
      case 'trazo': {
        /* una linea del tablero: el roce del pigmento mientras el pincel pasa (las dos verticales suenan a la
           izquierda y la derecha, las horizontales al centro) y un toc al soltarlo; el de la cuarta, que
           cierra el tablero, es el mas hondo */
        const pan = [-0.3, 0.3, -0.1, 0.1][ev.i] || 0;
        roce(t0, dur, 0.045, 320, 1100 + ev.i * 100, pan);
        if (ev.i === 3) hondo(t1, 0.07, 82, 0.45); else toc(t1, 0.035, 210 - ev.i * 14, pan);
        break;
      }
      case 'clavos':
        toc(t1 - 0.04, 0.06, 170, -0.2);
        tintineo(t1 - 0.02, [880, 1320], 0.012, 0.35, -0.2);
        break;
      case 'moneda':
        toc(t1 - 0.04, 0.035, 250, 0.25);
        tintineo(t1 - 0.03, [1180, 1770], 0.014, 0.5, 0.25);
        tintineo(t1 + 0.17, [1180], 0.006, 0.3, 0.25);              // la moneda rebota una vez
        break;
      case 'lanza':
        roce(t1 - 0.3, 0.28, 0.03, 500, 2000, 0.2);                 // el silbo de la lanza
        toc(t1 - 0.04, 0.06, 150, 0.2);
        tintineo(t1 - 0.02, [760], 0.01, 0.35, 0.2);
        break;
      case 'corona': {
        /* las espinas: ramitas secas que crujen, y debajo un toc */
        for (let i = 0; i < 4; i++) {
          const d = t1 - 0.3 + i * 0.07 + azar() * 0.02;
          const g = e.voz(0.4, azar() * 0.8 - 0.4);
          e.sobre(g, d, 0.003, 0.03, 0.07);
          e.fuenteRuido(d, d + 0.12, e.filtro('bandpass', 1700 + azar() * 900, 1.4, g));
        }
        toc(t1 - 0.02, 0.05, 140);
        break;
      }
      case 'cruz':
        /* el toc mayor: madera pesada, hondo y redondo, y se apaga pronto */
        roce(t1 - 0.45, 0.42, 0.025, 160, 700);
        hondo(t1 - 0.04, 0.16, 68, 0.8);
        toc(t1 - 0.04, 0.05, 120);
        break;
      case 'corazones': {
        /* el amor gana, sin ruido: re mayor pulsado en cuerda, una nota tras otra (re, la, re, fa#), muy suave */
        [[146.83, 0, -0.15], [220, 0.22, 0.1], [293.66, 0.44, -0.05], [369.99, 0.7, 0.15]].forEach(([f, d, pan]) => {
          cuerda(t0 + d, f, 0.03, 3.4 - d, pan);
        });
        break;
      }
      case 'latido': {
        /* lub y dub: un pulso grave y suave, casi un recuerdo */
        const g = e.voz(0.5);
        e.sobre(g, t0, 0.012, latidos++ % 2 === 0 ? 0.055 : 0.035, 0.2);
        e.tono('sine', 60, t0, t0 + 0.5, g).frequency.exponentialRampToValueAtTime(46, t0 + 0.22);
        break;
      }
      default:
        break;
    }
  }
  return e.ctx.startRendering();
}
