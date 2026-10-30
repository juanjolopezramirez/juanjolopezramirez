/* EL TIC TAC TOE SOBRE PAPIRO, DIBUJADO CUADRO A CUADRO (para el video de «Brand Assets»).

   Pedido del fundador (2026-10-30): «un juego de Tic Tac Toe, pero como en el papel, tipo papel
   papiro». Se hace como la lluvia (animacion/lluvia.js): nada depende del reloj ni del azar de
   verdad.
     · El azar sale de una semilla (`crearAzar`, de lluvia.js): la misma semilla da el mismo video.
     · El tiempo lo cuenta quien llama: `avanzar(dt)` y `pintar(ctx)`.
     · Se dibuja en un tamaño LOGICO (`ancho` x `alto`) con el lienzo ya escalado (`ctx.setTransform`);
       el papel, que es lo mas pesado, se pinta UNA vez en un lienzo del tamaño real (`escala`).

   El papel: color de papiro, fibras en las dos direcciones, uniones de las tiras, manchas, motas,
   y los bordes oscurecidos. La tinta: cada trazo va de la mano (un temblor suave), se dibuja de
   principio a fin con presion que sube y baja, y deja un halo (la tinta que se corre). El juego
   esta escrito: X abre en el centro y gana por la columna del medio; la raya final va en rojo
   almagre, como las mayusculas de los escribas. El juego dura siempre lo mismo: si el video es
   mas corto, la pluma va mas rapida (\`velocidad\`). */

const TINTA = '#2B1C0F';
const ALMAGRE = '#8B2A14';
const VELO = '#1A1208';
/* Lo que dura el juego (ms de juego) y lo que hay que dejar para entrar y salir */
const JUEGO_MS = 8300;
const ENTRA_MS = 500;
const SALE_MS = 800;

/* El juego: casillas 0..8 (fila por fila). X gana por la columna del medio (1-4-7). */
const JUGADAS = [
  { quien: 'X', casilla: 4 }, { quien: 'O', casilla: 0 }, { quien: 'X', casilla: 1 },
  { quien: 'O', casilla: 3 }, { quien: 'X', casilla: 7 }
];
const GANADORA = [1, 4, 7];

/* Un ruido suave de un solo valor: `n` valores al azar entre -1 y 1 que se unen con curvas */
const ruidoSuave = (azar, n = 6) => {
  const k = Array.from({ length: n }, () => azar() * 2 - 1);
  return (u) => {
    const x = Math.min(0.9999, Math.max(0, u)) * (n - 1);
    const i = Math.floor(x), f = x - i;
    const s = f * f * (3 - 2 * f);
    return k[i] * (1 - s) + k[i + 1] * s;
  };
};

/* El papel (se pinta una vez). `lienzoDe(w, h)` da un lienzo con contexto 2D. */
function pintarPapel(lienzoDe, ancho, alto, escala, azar) {
  const lienzo = lienzoDe(Math.round(ancho * escala), Math.round(alto * escala));
  const c = lienzo.getContext('2d');
  if (!c) throw new Error('lienzo');
  c.setTransform(escala, 0, 0, escala, 0, 0);
  const base = c.createLinearGradient(0, 0, 0, alto);
  base.addColorStop(0, '#DAC594');
  base.addColorStop(0.5, '#CFB885');
  base.addColorStop(1, '#C3A870');
  c.fillStyle = base;
  c.fillRect(0, 0, ancho, alto);

  /* manchas grandes, oscuras y claras */
  for (let i = 0; i < 16; i++) {
    const x = azar() * ancho, y = azar() * alto, r = 80 + azar() * 190;
    const clara = azar() < 0.4;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, clara ? 'rgba(242,228,185,.16)' : `rgba(120,85,40,${0.05 + azar() * 0.07})`);
    g.addColorStop(1, 'rgba(120,85,40,0)');
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }

  /* fibras: casi todas a lo largo, otras cruzadas (asi se hace el papiro: dos capas de tiras) */
  c.lineCap = 'round';
  const fibras = Math.round(ancho * alto / 800);
  for (let i = 0; i < fibras; i++) {
    const largo = 30 + azar() * 190;
    const x = azar() * ancho, y = azar() * alto;
    c.strokeStyle = azar() < 0.55 ? `rgba(124,90,43,${0.03 + azar() * 0.08})` : `rgba(244,230,190,${0.05 + azar() * 0.09})`;
    c.lineWidth = 0.5 + azar() * 1.1;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + largo, y + (azar() * 3 - 1.5)); c.stroke();
  }
  for (let i = 0; i < fibras / 3; i++) {
    const largo = 20 + azar() * 110;
    const x = azar() * ancho, y = azar() * alto;
    c.strokeStyle = `rgba(124,90,43,${0.03 + azar() * 0.07})`;
    c.lineWidth = 0.5 + azar() * 0.9;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (azar() * 3 - 1.5), y + largo); c.stroke();
  }

  /* las uniones de las tiras: lineas casi horizontales, una oscura y una clara pegada */
  for (let y = 60 + azar() * 40; y < alto; y += 90 + azar() * 50) {
    c.strokeStyle = 'rgba(110,78,36,.10)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(0, y); c.lineTo(ancho, y + (azar() * 6 - 3)); c.stroke();
    c.strokeStyle = 'rgba(246,234,198,.12)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, y + 2); c.lineTo(ancho, y + 2 + (azar() * 6 - 3)); c.stroke();
  }

  /* motas */
  for (let i = 0; i < 2600; i++) {
    c.fillStyle = `rgba(78,52,22,${0.07 + azar() * 0.2})`;
    c.beginPath(); c.arc(azar() * ancho, azar() * alto, 0.35 + azar() * 0.8, 0, Math.PI * 2); c.fill();
  }

  /* los bordes se oscurecen (papel viejo) */
  const v = c.createRadialGradient(ancho / 2, alto / 2, Math.min(ancho, alto) * 0.3, ancho / 2, alto / 2, Math.hypot(ancho, alto) / 2);
  v.addColorStop(0, 'rgba(70,45,18,0)');
  v.addColorStop(0.7, 'rgba(70,45,18,.22)');
  v.addColorStop(1, 'rgba(60,38,14,.62)');
  c.fillStyle = v;
  c.fillRect(0, 0, ancho, alto);
  return lienzo;
}

/** @param {{ ancho: number, alto: number, azar: () => number, duracionMs: number, escala: number, lienzoDe: (w: number, h: number) => any }} p */
export function crearPapiro({ ancho, alto, azar, duracionMs, escala, lienzoDe }) {
  const papel = pintarPapel(lienzoDe, ancho, alto, escala, azar);
  const velocidad = Math.max(1, JUEGO_MS / Math.max(1000, duracionMs - ENTRA_MS - SALE_MS - 100));
  const celda = Math.min(ancho, alto) * 0.26;
  const cx = ancho / 2, cy = alto / 2;
  const centroDe = (i) => ({ x: cx + ((i % 3) - 1) * celda, y: cy + (Math.floor(i / 3) - 1) * celda });

  /* Un trazo: una lista de puntos con temblor, un ancho, una tinta y cuando empieza y acaba (ms de juego) */
  const trazos = [];
  const linea = (x0, y0, x1, y1, t0, t1, w, color = TINTA, amp = 2.2) => {
    const largo = Math.hypot(x1 - x0, y1 - y0) || 1;
    const dx = (x1 - x0) / largo, dy = (y1 - y0) / largo;
    const sobra = 2 + azar() * 7;                         // la pluma se pasa un poco
    const a = { x: x0 - dx * sobra * 0.5, y: y0 - dy * sobra * 0.5 }, b = { x: x1 + dx * sobra, y: y1 + dy * sobra };
    const n = Math.max(14, Math.round(largo / 12));
    const r = ruidoSuave(azar, 7);
    const puntos = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const t = r(u) * amp;
      puntos.push({ x: a.x + (b.x - a.x) * u - dy * t, y: a.y + (b.y - a.y) * u + dx * t });
    }
    trazos.push({ puntos, t0, t1, w, color });
  };
  const circulo = (x, y, rad, t0, t1, w) => {
    const a0 = azar() * Math.PI * 2;
    const n = 46, r = ruidoSuave(azar, 6);
    const puntos = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const ang = a0 + u * Math.PI * 2 * 1.07;           // se pasa un poco del punto de partida
      const rr = rad * (1 + 0.06 * r(u) + 0.035 * u);
      puntos.push({ x: x + Math.cos(ang) * rr, y: y + Math.sin(ang) * rr * 0.97 });
    }
    trazos.push({ puntos, t0, t1, w, color: TINTA });
  };

  /* la rejilla: cuatro lineas (dos de arriba abajo, dos de lado a lado) */
  const media = celda * 1.55;
  const peso = Math.max(3, celda * 0.034);
  [[-0.5, 600], [0.5, 950]].forEach(([k, t]) => linea(cx + k * celda, cy - media, cx + k * celda, cy + media, t, t + 560, peso));
  [[-0.5, 1300], [0.5, 1650]].forEach(([k, t]) => linea(cx - media, cy + k * celda, cx + media, cy + k * celda, t, t + 560, peso));

  /* las jugadas */
  const hueco = celda * 0.26;
  JUGADAS.forEach((j, m) => {
    const { x, y } = centroDe(j.casilla);
    const t = 2500 + m * 850;
    if (j.quien === 'X') {
      linea(x - hueco, y - hueco, x + hueco, y + hueco, t, t + 300, peso * 1.1, TINTA, 1.4);
      linea(x + hueco, y - hueco, x - hueco, y + hueco, t + 360, t + 660, peso * 1.1, TINTA, 1.4);
    } else {
      circulo(x, y, hueco * 1.08, t, t + 560, peso * 1.1);
    }
  });

  /* la raya que gana, en rojo almagre */
  const p1 = centroDe(GANADORA[0]), p2 = centroDe(GANADORA[2]);
  const tg = 2500 + JUGADAS.length * 850;
  linea(p1.x, p1.y - celda * 0.42, p2.x, p2.y + celda * 0.42, tg + 100, tg + 800, peso * 1.7, ALMAGRE, 2.6);

  /* Lo que oye el sonido: cada trazo, en milisegundos del VIDEO (el juego se acelera si el video es corto) */
  const eventos = trazos.map((z) => ({ t0: ENTRA_MS + z.t0 / velocidad, t1: ENTRA_MS + z.t1 / velocidad, ganadora: z.color === ALMAGRE }));
  let t = 0;

  function avanzar(dt) { t += dt; }

  function pintar(ctx) {
    const tj = Math.max(0, t - ENTRA_MS) * velocidad;     // el juego empieza cuando termina la entrada (si no, el primer trazo se dibuja a oscuras)
    ctx.globalAlpha = 1;
    ctx.drawImage(papel, 0, 0, ancho, alto);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const z of trazos) {
      if (tj <= z.t0) continue;
      const q = Math.min(1, (tj - z.t0) / (z.t1 - z.t0));
      const p = q * q * (3 - 2 * q);                      // la pluma arranca y frena
      const hasta = p * (z.puntos.length - 1);
      const enteros = Math.floor(hasta);
      /* El halo (la tinta que se corre): UNA sola pasada, ancha y casi transparente. Si se hiciera tramo a tramo,
         cada union se veria como una cuenta. */
      ctx.strokeStyle = z.color;
      ctx.globalAlpha = 0.09;
      ctx.lineWidth = z.w * 1.9;
      ctx.beginPath();
      ctx.moveTo(z.puntos[0].x, z.puntos[0].y);
      for (let i = 1; i <= enteros && i < z.puntos.length; i++) ctx.lineTo(z.puntos[i].x, z.puntos[i].y);
      if (enteros < z.puntos.length - 1) {
        const a0 = z.puntos[enteros], b0 = z.puntos[enteros + 1], f = hasta - enteros;
        ctx.lineTo(a0.x + (b0.x - a0.x) * f, a0.y + (b0.y - a0.y) * f);
      }
      ctx.stroke();
      /* El trazo: tramo a tramo (el ancho cambia con la presion), con tinta OPACA para que no se vean las uniones */
      ctx.globalAlpha = 1;
      for (let i = 0; i < enteros + 1 && i < z.puntos.length - 1; i++) {
        const a0 = z.puntos[i];
        let b0 = z.puntos[i + 1];
        if (i === enteros) { const f = hasta - enteros; b0 = { x: a0.x + (b0.x - a0.x) * f, y: a0.y + (b0.y - a0.y) * f }; }
        const u = (i + 0.5) / (z.puntos.length - 1);
        ctx.lineWidth = z.w * (0.72 + 0.28 * Math.sin(Math.PI * u) + 0.06 * Math.sin(i * 2.3));   // presion
        ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(b0.x, b0.y); ctx.stroke();
      }
      if (q < 1) {                                         // la punta de la pluma, mientras escribe (justo donde acaba la tinta)
        const a0 = z.puntos[enteros], b0 = z.puntos[Math.min(enteros + 1, z.puntos.length - 1)], f = hasta - enteros;
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = z.color;
        ctx.beginPath(); ctx.arc(a0.x + (b0.x - a0.x) * f, a0.y + (b0.y - a0.y) * f, z.w * 0.62, 0, Math.PI * 2); ctx.fill();
      }
    }
    /* Entra desde lo oscuro y se va a lo oscuro */
    const velo = 1 - Math.min(1, t / ENTRA_MS) * Math.min(1, Math.max(0, (duracionMs - t) / SALE_MS));
    if (velo > 0.001) {
      ctx.globalAlpha = Math.min(1, velo);
      ctx.fillStyle = VELO;
      ctx.fillRect(0, 0, ancho, alto);
    }
    ctx.globalAlpha = 1;
  }

  return { avanzar, pintar, eventos, get velocidad() { return velocidad; } };
}

export const PAPIRO = { JUEGO_MS, ENTRA_MS, SALE_MS, JUGADAS, GANADORA };
