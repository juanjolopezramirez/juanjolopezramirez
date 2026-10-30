/* EL SALTO AL HIPERESPACIO, DIBUJADO CUADRO A CUADRO (para los videos de «Brand Assets»).

   Es el salto del portal (scripts/portal/salto.js: letras hebreas, griegas y signos de codigo que
   vienen hacia ti desde el centro, cada una con su estela, como las estrellas al saltar a la
   velocidad de la luz) pero hecho para EXPORTAR: el tiempo lo cuenta quien llama (`avanzar(dt)`) y
   el azar es el de la semilla, asi que el mismo video sale igual cada vez. salto.js sigue siendo el
   del sitio y NO usa este archivo; los signos y el dibujo de la estela copian los suyos
   (tools/test-portal.mjs vigila que los signos no se separen).

   En el sitio el salto dura menos de un segundo (420 ms al entrar). Aqui se estira para que se
   VEA, y trae las tres partes juntas:
     · ACELERA   las letras vienen hacia ti cada vez mas rapido (el «entrar»);
     · EL SALTO  un destello blanco, un instante;
     · FRENA     las letras llegan lanzadas y frenan hasta quedarse quietas (el «llegar»), y todo
                 se apaga en el negro (para que el video se pueda repetir).
   La linea de tiempo va por proporciones de la duracion: sirve para 4, 6 o 10 segundos. */

const GLIFOS = [...'אבגדהוזחטיכלמנסעפצקרשת', ...'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ', ...'{}<>/$#=;:+01'];
const LETRA = '"JetBrains Mono", ui-monospace, "Cascadia Mono", Consolas, monospace';
const FONDO = '#050806';
const VERDE = '#00FF66', HOJA = '#A9C47F', BLANCO = '#FFFFFF';

/* Las partes del video, como proporcion de su duracion (0 a 1) */
export const PARTES = { acelera: 0.5, salto: 0.1, frena: 0.34, entra: 0.04, sale: 0.1 };

/* Cuando empieza y acaba cada parte, en milisegundos, para una duracion dada */
export function tiempos(duracionMs) {
  const a = duracionMs * PARTES.acelera, s = a + duracionMs * PARTES.salto, f = s + duracionMs * PARTES.frena;
  return { acelera: [0, a], salto: [a, s], frena: [s, f], fin: duracionMs };
}

/* La velocidad de las letras (profundidad por segundo) en el instante `t` (ms): la del sitio,
   acelerando al entrar (.35 + 3.4 p²) y frenando al llegar (3.2 (1-p)²). */
export function velocidad(t, duracionMs) {
  const x = tiempos(duracionMs);
  if (t < x.acelera[1]) { const p = t / x.acelera[1]; return 0.35 + 3.4 * p * p; }
  if (t < x.salto[1]) return 3.75;
  if (t < x.frena[1]) { const p = (t - x.salto[1]) / (x.frena[1] - x.salto[1]); return 3.2 * (1 - p) * (1 - p); }
  return 0;
}

/** @param {{ ancho:number, alto:number, azar:()=>number, duracionMs:number }} p */
export function crearHiperespacio({ ancho, alto, azar, duracionMs }) {
  const cx = ancho / 2, cy = alto / 2;
  const escala = Math.max(ancho, alto) * 0.5;
  const cuantas = Math.max(50, Math.min(140, Math.floor(ancho * alto / 6000)));
  const k = escala * 0.18;
  const x = tiempos(duracionMs);
  const glifo = () => GLIFOS[(azar() * GLIFOS.length) | 0];
  /* Cada letra: una direccion en el plano (x, y) y una profundidad z (1 lejos, 0 encima) */
  const nueva = (lejos) => ({
    x: (azar() * 2 - 1) * 0.9, y: (azar() * 2 - 1) * 0.9,
    z: lejos ? 0.7 + azar() * 0.3 : 0.05 + azar() * 0.95,
    c: glifo(), verde: azar() < 0.78, ve: false, px: 0, py: 0, cerca: 0
  });
  const letras = Array.from({ length: cuantas }, () => nueva(false));
  const FUENTES = Array.from({ length: 21 }, (_, i) => `500 ${8 + i}px ${LETRA}`);
  let t = 0, vel = 0, largo = 0.6, ultimaVel = 0;

  function avanzar(dt) {
    t += dt;
    ultimaVel = vel;
    vel = velocidad(t, duracionMs);
    /* la estela es lo que avanza la letra POR CUADRO por `largo`: a 30 cuadros por segundo avanza el doble que a 60 (el sitio),
       asi que se acorta a la mitad y la estela mide lo mismo que en el sitio */
    largo = Math.min(4, Math.abs(vel) * 1.4 + 0.6) * Math.min(1, 16.7 / dt);
    for (const l of letras) {
      l.ax = cx + l.x / l.z * k; l.ay = cy + l.y / l.z * k;   // donde estaba
      l.z -= vel * dt / 1000;
      l.ve = false;
      if (l.z <= 0.03 || l.z > 1.05) { Object.assign(l, nueva(true)); continue; }
      const px = cx + l.x / l.z * k, py = cy + l.y / l.z * k;  // donde esta
      if (px < -40 || px > ancho + 40 || py < -40 || py > alto + 40) { Object.assign(l, nueva(true)); continue; }
      l.ve = true; l.px = px; l.py = py; l.cerca = 1 - l.z;
    }
  }

  function pintar(ctx) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = FONDO;
    ctx.fillRect(0, 0, ancho, alto);
    /* al frenar, las letras se apagan con el final del video (nada de corte seco) */
    const apagar = Math.min(1, Math.max(0, (duracionMs - t) / (duracionMs * PARTES.sale)));
    const entra = Math.min(1, t / (duracionMs * PARTES.entra));

    /* 1. las estelas, juntas en 6 trazos (2 tonos × 3 grosores) */
    const trazos = Array.from({ length: 6 }, () => new Path2D());
    for (const l of letras) {
      if (!l.ve) continue;
      const nivel = l.cerca < 0.4 ? 0 : l.cerca < 0.7 ? 1 : 2;
      const camino = trazos[(l.verde ? 0 : 3) + nivel];
      camino.moveTo(l.px - (l.px - l.ax) * largo, l.py - (l.py - l.ay) * largo);
      camino.lineTo(l.px, l.py);
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const nivel = i % 3;
      ctx.globalAlpha = [0.2, 0.38, 0.58][nivel] * apagar * entra;
      ctx.lineWidth = [0.8, 1.4, 2.2][nivel];
      ctx.strokeStyle = i < 3 ? VERDE : HOJA;
      ctx.stroke(trazos[i]);
    }

    /* 2. las letras en la cabeza: crecen al acercarse (las lejanas son solo estela) */
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let relleno = '', tam0 = -1;
    for (const l of letras) {
      if (!l.ve || l.cerca < 0.3) continue;
      ctx.globalAlpha = Math.min(1, 0.15 + l.cerca * 1.1) * apagar * entra;
      const color = l.cerca > 0.6 ? BLANCO : (l.verde ? VERDE : HOJA);
      if (relleno !== color) { ctx.fillStyle = color; relleno = color; }
      const tam = Math.min(20, Math.round(l.cerca * 20));
      if (tam0 !== tam) { ctx.font = FUENTES[tam]; tam0 = tam; }
      ctx.fillText(l.c, l.px, l.py);
    }

    /* 3. el salto: un destello blanco que sube de golpe y se va (con un halo verde al centro) */
    const [s0, s1] = x.salto;
    if (t > s0 - 120 && t < s1 + (x.frena[1] - x.frena[0]) * 0.25) {
      const sube = Math.min(1, Math.max(0, (t - (s0 - 120)) / (s1 - s0 + 120)));
      const baja = t > s1 ? Math.max(0, 1 - (t - s1) / ((x.frena[1] - x.frena[0]) * 0.25)) : 1;
      const luz = sube * sube * baja;
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(ancho, alto) * 0.7);
      halo.addColorStop(0, `rgba(255,255,255,${(0.85 * luz).toFixed(3)})`);
      halo.addColorStop(0.35, `rgba(120,255,170,${(0.28 * luz).toFixed(3)})`);
      halo.addColorStop(1, 'rgba(0,255,102,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, ancho, alto);
    }
    ctx.globalAlpha = 1;
  }

  return {
    avanzar, pintar,
    get tiempo() { return t; },
    get velocidad() { return vel; },
    get aceleracion() { return vel - ultimaVel; }
  };
}
