/* «EL JUEGO QUE EL AMOR YA GANO»: EL TIC TAC TOE SOBRE PAPIRO, CUADRO A CUADRO (video de Brand Assets).

   El Tic Tac Toe es del fundador (carpeta «fraterni Icon/TicTacToe», copiada a public/assets/tictactoe/):
   un tablero de maderos dorados y las piezas de la Pasion — los clavos cruzados, la moneda, los
   clavos con lanza, la corona de espinas y la cruz — que se van poniendo una a una; y al final,
   los corazones rojos: el amor, que ya gano. Aqui NO se dibuja nada de eso: se usan SUS dibujos
   tal cual (cada uno es un SVG de 1080 x 1080 con su sombra) y solo se pone en escena:
     · el tablero se pinta de izquierda a derecha, como una mano que pasa el pincel;
     · cada pieza CAE sobre su casilla (llega de mas grande y mas arriba, y se asienta);
     · los corazones aparecen y laten dos veces (lub-dub), como el amor que no se va.
   Todo sobre un papiro CLARO (el primero salio oscuro): papel de papiro color crema con fibras en
   las dos direcciones, uniones de las tiras y motas, con los bordes apenas oscurecidos.

   Como la lluvia (animacion/lluvia.js), no depende del reloj ni del azar de verdad: el azar sale de
   una semilla (solo se gasta al pintar el papel, una vez), el tiempo lo cuenta quien llama
   (`avanzar` y `pintar`) y se dibuja en un tamaño LOGICO que el lienzo escala.
   Las piezas se dibujan UNA vez, a la medida real, cada una recortada a su caja (`prepararCapas`,
   necesita el navegador); `crearPapiro` solo las mueve y es puro (se prueba en Node con capas falsas).
   El juego dura siempre lo mismo: si el video es mas corto, todo va mas rapido (`velocidad`). */

/* Los dibujos del fundador: el tablero y, en el orden en que se ponen, las piezas y los corazones */
export const COMPONENTES = [
  { id: 'tablero', url: '/assets/tictactoe/tablero.svg' },
  { id: 'clavos', url: '/assets/tictactoe/clavos.svg' },
  { id: 'moneda', url: '/assets/tictactoe/moneda.svg' },
  { id: 'lanza', url: '/assets/tictactoe/lanza.svg' },
  { id: 'corona', url: '/assets/tictactoe/corona.svg' },
  { id: 'cruz', url: '/assets/tictactoe/cruz.svg' },
  /* Los corazones vienen casi transparentes (fill-opacity .13): aqui se pintan macizos y se les da la
     fuerza al aparecer */
  { id: 'corazones', url: '/assets/tictactoe/corazones.svg', macizo: true }
];

/* El guion (milisegundos de JUEGO): cuando llega cada cosa */
export const GUION = [
  { capa: 'tablero', tipo: 'barrido', t0: 600, t1: 1700 },
  { capa: 'clavos', tipo: 'cae', t0: 2000, t1: 2500 },
  { capa: 'moneda', tipo: 'cae', t0: 2700, t1: 3200 },
  { capa: 'lanza', tipo: 'cae', t0: 3400, t1: 3900 },
  { capa: 'corona', tipo: 'cae', t0: 4100, t1: 4600 },
  { capa: 'cruz', tipo: 'cae', t0: 4800, t1: 5300 },
  { capa: 'corazones', tipo: 'aparece', t0: 5900, t1: 6700 }
];
/* Los latidos de los corazones (lub, dub, y otra vez) */
export const LATIDOS = [6800, 7050, 7700, 7950];

const JUEGO_MS = 8300;
const ENTRA_MS = 500;
const SALE_MS = 800;
export const PAPIRO = { JUEGO_MS, ENTRA_MS, SALE_MS };

const LADO = 1080;          // el lado del cuadrado en que estan dibujados los componentes
const AMPLIA = 1.75;        // cuanto se agranda ese cuadrado respecto al lado corto del cuadro
const VELO = '#F3EACB';     // se entra desde (y se sale hacia) el color del papel, no desde lo oscuro

const suave = (q) => q * q * (3 - 2 * q);

/* Donde cae el cuadrado de 1080 dentro del cuadro logico, y cuanto se amplia */
export function geometria(ancho, alto) {
  const e = Math.min(ancho, alto) * AMPLIA / LADO;
  return { e, ox: ancho / 2 - (LADO / 2) * e, oy: alto / 2 - (LADO / 2) * e };
}

/* LAS CAPAS (necesita el navegador). Cada componente se dibuja una vez a la medida real y se recorta
   a donde hay algo (si no, el 4K serian siete lienzos de 3800 x 3800).
     texto(url)          → el SVG como texto;
     cargarImagen(svg)   → una imagen ya lista para dibujar;
     lienzoDe(w, h)      → un lienzo con contexto 2D.
   Devuelve { id: { lienzo, x, y, w, h } } con x, y, w, h en el tamaño logico del cuadro. */
export async function prepararCapas({ ancho, alto, escala, lienzoDe, cargarImagen, texto }) {
  const { e, ox, oy } = geometria(ancho, alto);
  const px = e * escala;                                   // pixeles reales por unidad del dibujo
  const capas = {};
  const M = 270;                                           // para buscar la caja se dibuja en pequeño
  for (const c of COMPONENTES) {
    let svg = await texto(c.url);
    if (c.macizo) svg = svg.replace(/fill-opacity="[^"]*"/g, 'fill-opacity="1"');
    const img = await cargarImagen(svg);
    const pq = lienzoDe(M, M).getContext('2d', { willReadFrequently: true });
    if (!pq) throw new Error('lienzo');
    pq.drawImage(img, 0, 0, M, M);
    const d = pq.getImageData(0, 0, M, M).data;
    let x0 = M, y0 = M, x1 = -1, y1 = -1;
    for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) {
      if (d[(y * M + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) continue;                                  // un componente vacio: se salta
    const k = LADO / M, margen = 8;
    const bx = Math.max(0, x0 * k - margen), by = Math.max(0, y0 * k - margen);
    const bw = Math.min(LADO, (x1 + 1) * k + margen) - bx, bh = Math.min(LADO, (y1 + 1) * k + margen) - by;
    const w = Math.max(1, Math.ceil(bw * px)), h = Math.max(1, Math.ceil(bh * px));
    const lienzo = lienzoDe(w, h);
    const cx = lienzo.getContext('2d');
    if (!cx) throw new Error('lienzo');
    cx.drawImage(img, bx, by, bw, bh, 0, 0, w, h);
    capas[c.id] = { lienzo, x: ox + bx * e, y: oy + by * e, w: bw * e, h: bh * e };
  }
  return capas;
}

/* El papel (se pinta una vez, en un lienzo del tamaño real). CLARO: crema de papiro, fibras en las
   dos direcciones, uniones de las tiras, motas, y los bordes apenas oscurecidos. */
function pintarPapel(lienzoDe, ancho, alto, escala, azar) {
  const lienzo = lienzoDe(Math.round(ancho * escala), Math.round(alto * escala));
  const c = lienzo.getContext('2d');
  if (!c) throw new Error('lienzo');
  c.setTransform(escala, 0, 0, escala, 0, 0);
  const base = c.createLinearGradient(0, 0, 0, alto);
  base.addColorStop(0, '#EEE1BB');
  base.addColorStop(0.5, '#E6D6A8');
  base.addColorStop(1, '#DCC993');
  c.fillStyle = base;
  c.fillRect(0, 0, ancho, alto);

  /* manchas grandes, claras y algo oscuras (suaves) */
  for (let i = 0; i < 14; i++) {
    const x = azar() * ancho, y = azar() * alto, r = 90 + azar() * 200;
    const clara = azar() < 0.5;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, clara ? 'rgba(250,240,208,.22)' : `rgba(140,105,55,${0.025 + azar() * 0.035})`);
    g.addColorStop(1, 'rgba(140,105,55,0)');
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }

  /* fibras: casi todas a lo largo, otras cruzadas (asi se hace el papiro: dos capas de tiras) */
  c.lineCap = 'round';
  const fibras = Math.round(ancho * alto / 800);
  for (let i = 0; i < fibras; i++) {
    const largo = 30 + azar() * 190;
    const x = azar() * ancho, y = azar() * alto;
    c.strokeStyle = azar() < 0.55 ? `rgba(140,105,55,${0.025 + azar() * 0.06})` : `rgba(250,240,208,${0.06 + azar() * 0.1})`;
    c.lineWidth = 0.5 + azar() * 1.1;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + largo, y + (azar() * 3 - 1.5)); c.stroke();
  }
  for (let i = 0; i < fibras / 3; i++) {
    const largo = 20 + azar() * 110;
    const x = azar() * ancho, y = azar() * alto;
    c.strokeStyle = `rgba(140,105,55,${0.025 + azar() * 0.05})`;
    c.lineWidth = 0.5 + azar() * 0.9;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (azar() * 3 - 1.5), y + largo); c.stroke();
  }

  /* las uniones de las tiras: lineas casi horizontales, una oscura y una clara pegada */
  for (let y = 60 + azar() * 40; y < alto; y += 90 + azar() * 50) {
    c.strokeStyle = 'rgba(130,95,45,.08)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(0, y); c.lineTo(ancho, y + (azar() * 6 - 3)); c.stroke();
    c.strokeStyle = 'rgba(252,244,214,.2)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, y + 2); c.lineTo(ancho, y + 2 + (azar() * 6 - 3)); c.stroke();
  }

  /* motas */
  for (let i = 0; i < 1800; i++) {
    c.fillStyle = `rgba(95,66,30,${0.05 + azar() * 0.13})`;
    c.beginPath(); c.arc(azar() * ancho, azar() * alto, 0.35 + azar() * 0.7, 0, Math.PI * 2); c.fill();
  }

  /* los bordes se oscurecen apenas (papel viejo, pero claro) */
  const v = c.createRadialGradient(ancho / 2, alto / 2, Math.min(ancho, alto) * 0.4, ancho / 2, alto / 2, Math.hypot(ancho, alto) / 2);
  v.addColorStop(0, 'rgba(110,78,36,0)');
  v.addColorStop(0.75, 'rgba(110,78,36,.07)');
  v.addColorStop(1, 'rgba(100,68,28,.26)');
  c.fillStyle = v;
  c.fillRect(0, 0, ancho, alto);
  return lienzo;
}

/** @param {{ ancho: number, alto: number, azar: () => number, duracionMs: number, escala: number,
      lienzoDe: (w: number, h: number) => any, capas: Record<string, {lienzo: any, x: number, y: number, w: number, h: number}> }} p */
export function crearPapiro({ ancho, alto, azar, duracionMs, escala, lienzoDe, capas }) {
  const papel = pintarPapel(lienzoDe, ancho, alto, escala, azar);
  const velocidad = Math.max(1, JUEGO_MS / Math.max(1000, duracionMs - ENTRA_MS - SALE_MS - 100));
  const aVideo = (tj) => ENTRA_MS + tj / velocidad;       // de milisegundos de juego a milisegundos del video

  /* Lo que oye el sonido: cada cosa que pasa, en milisegundos del VIDEO */
  const eventos = [
    ...GUION.map((g) => ({ tipo: g.capa, t0: aVideo(g.t0), t1: aVideo(g.t1) })),
    ...LATIDOS.map((b) => ({ tipo: 'latido', t0: aVideo(b), t1: aVideo(b + 200) }))
  ];
  let t = 0;

  function avanzar(dt) { t += dt; }

  function pintar(ctx) {
    const tj = Math.max(0, t - ENTRA_MS) * velocidad;      // el juego empieza cuando termina la entrada
    ctx.globalAlpha = 1;
    ctx.drawImage(papel, 0, 0, ancho, alto);
    for (const g of GUION) {
      const c = capas[g.capa];
      if (!c || tj <= g.t0) continue;
      const q = Math.min(1, (tj - g.t0) / (g.t1 - g.t0));
      ctx.save();
      if (g.tipo === 'barrido') {
        /* el tablero se pinta de izquierda a derecha */
        const p = suave(q);
        ctx.beginPath();
        ctx.rect(c.x, c.y, c.w * p, c.h);
        ctx.clip();
        ctx.globalAlpha = Math.min(1, q * 3);
        ctx.drawImage(c.lienzo, c.x, c.y, c.w, c.h);
      } else if (g.tipo === 'cae') {
        /* la pieza cae: llega mas grande y mas arriba, y se asienta */
        const p = 1 - Math.pow(1 - q, 3);
        const s = 1 + 0.55 * (1 - p) * (1 - p);
        const dy = -0.07 * c.h * (1 - p) - 36 * (1 - p);
        ctx.globalAlpha = Math.min(1, q * 4);
        ctx.translate(c.x + c.w / 2, c.y + c.h / 2 + dy);
        ctx.scale(s, s);
        ctx.drawImage(c.lienzo, -c.w / 2, -c.h / 2, c.w, c.h);
      } else {
        /* los corazones aparecen y laten (cada latido los agranda un instante) */
        let pulso = 0;
        for (const b of LATIDOS) { const d = (tj - b) / 110; pulso += Math.exp(-d * d); }
        const s = 1 + 0.09 * Math.min(1, pulso);
        ctx.globalAlpha = 0.9 * suave(q);
        ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
        ctx.scale(s, s);
        ctx.drawImage(c.lienzo, -c.w / 2, -c.h / 2, c.w, c.h);
      }
      ctx.restore();
    }
    /* Entra desde el color del papel y se va hacia el */
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
