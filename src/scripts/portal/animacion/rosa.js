/* LA ROSA DE LOS VIENTOS, DIBUJADA CUADRO A CUADRO (para los videos de «Brand Assets»).

   Es la misma brujula del sitio (components/Rosa.astro, animada por styles/carga.css: dos aros
   que se dibujan y se borran mientras giran, la aguja con el norte rayado, tiza blanca sobre el
   pinar) pero hecha para EXPORTAR: el tiempo lo cuenta quien llama (`avanzar(dt)`), y cada
   `pintar(ctx)` dibuja ESE instante. Los trazos de abajo son los de Rosa.astro, letra por letra
   (tools/test-portal.mjs vigila que no se separen), y los tiempos son los de carga.css (2 s por
   vuelta).

   Dos escenas:
     'brujula'  la rosa girando sin parar (la del telon entre paginas y la de la espera);
     'libro'    el cargador del libro: una marca por pagina que pasa de «buscando» (tenue, va y
                viene) a «llego» (viva, gruesa, con un pulso); cuando llegan todas, la rosa se
                apaga y se dibuja la marca de «listo» encima (site.js, ldBegin y ldDone).
   La marca de cada pagina sale de un numero fijo por posicion (no del azar): el mismo libro dibuja
   siempre la misma rosa, igual que el de la pagina.

   Todo se dibuja en una capa del tamaño REAL (`escala` = pixeles por unidad logica), asi la tiza y
   los trazos quedan nitidos a 720p, 1080p o 4K. El azar (los granos de la tiza) es el de la semilla. */

const CAJA = 160;                                  // el viewBox de la rosa
const HUESO = '#F1EFE9';
const PINAR = '#1D2E1F';
const VUELTA_MS = 2000;                            // lo que dura una vuelta (carga.css: 2s)

/* Los trazos (tal cual en Rosa.astro) */
export const ARO_A = 'M150.5 80.0C150.1 82.5 149.4 90.1 148.1 95.0C146.9 99.8 145.2 104.6 143.0 109.1C140.9 113.6 138.2 118.0 135.2 121.9C132.1 125.8 128.5 129.4 124.7 132.5C120.9 135.6 116.6 138.3 112.2 140.6C107.8 142.8 103.1 144.6 98.4 145.9C93.7 147.2 88.8 148.2 83.8 148.6C78.9 149.0 73.8 149.1 68.9 148.4C64.0 147.8 59.0 146.6 54.3 144.8C49.7 143.0 45.2 140.5 41.1 137.7C37.0 134.8 33.3 131.3 30.0 127.7C26.6 124.0 23.6 119.9 21.0 115.7C18.4 111.5 16.1 107.0 14.2 102.4C12.4 97.7 10.9 92.8 10.1 87.8C9.2 82.9 8.9 77.6 9.3 72.6C9.7 67.5 10.8 62.3 12.5 57.6C14.2 52.8 16.7 48.1 19.5 43.9C22.2 39.7 25.6 35.8 29.2 32.3C32.8 28.8 36.8 25.6 41.0 23.0C45.1 20.3 49.7 18.0 54.3 16.3C58.9 14.6 63.8 13.4 68.6 12.7C73.5 12.1 78.5 12.0 83.3 12.3C88.2 12.7 93.0 13.6 97.7 14.7C102.4 15.9 107.1 17.5 111.6 19.5C116.1 21.5 120.6 23.8 124.7 26.7C128.8 29.6 132.8 32.9 136.2 36.7C139.5 40.5 142.5 45.0 144.8 49.5C147.0 54.1 148.8 59.1 149.9 64.1C151.1 69.1 151.6 74.4 151.6 79.5C151.7 84.6 150.4 92.4 150.2 94.9';
export const ARO_B = 'M146.3 80.0C146.0 82.3 145.5 89.5 144.5 94.0C143.5 98.6 142.0 103.1 140.1 107.4C138.2 111.7 135.9 116.0 133.2 119.8C130.4 123.6 127.2 127.3 123.7 130.4C120.1 133.5 116.1 136.2 111.9 138.4C107.8 140.6 103.2 142.3 98.7 143.6C94.2 144.8 89.5 145.6 84.8 146.1C80.1 146.5 75.3 146.6 70.5 146.2C65.8 145.8 60.9 145.1 56.3 143.7C51.7 142.3 47.0 140.4 42.9 137.8C38.8 135.3 34.8 132.1 31.5 128.6C28.2 125.1 25.3 121.0 22.9 116.8C20.6 112.6 18.8 108.0 17.4 103.4C16.1 98.9 15.2 94.2 14.7 89.5C14.2 84.8 14.1 80.1 14.6 75.4C15.0 70.8 15.9 66.1 17.2 61.7C18.6 57.3 20.5 52.9 22.7 48.9C25.0 44.8 27.7 41.0 30.6 37.4C33.6 33.8 36.9 30.4 40.5 27.4C44.0 24.4 47.9 21.5 52.1 19.2C56.2 16.8 60.7 14.8 65.4 13.4C70.0 12.1 75.0 11.3 79.8 11.2C84.7 11.1 89.7 11.8 94.4 13.0C99.1 14.2 103.7 16.2 107.9 18.4C112.2 20.6 116.2 23.4 119.9 26.4C123.6 29.4 127.1 32.7 130.2 36.3C133.2 39.9 136.1 43.8 138.4 47.9C140.6 52.0 142.4 56.6 143.6 61.1C144.7 65.7 145.3 70.5 145.3 75.1C145.4 79.8 144.1 86.7 143.9 89.0';
export const NORTE = 'M0.4 -50.5C4.6 -39 10.8 -22.6 15.4 -8.2C16.2 -4.8 13.8 -3.2 10.6 -3.6C4.2 -3 -5.4 -3.8 -11.6 -3.4C-14.8 -3.3 -16.3 -5.4 -15.2 -8.4C-10.4 -22.8 -5.2 -37.6 -0.6 -50.2';
export const RAYADO = 'M-7.4 -9.4L-1.2 -24.2M-2 -8.6L5.8 -26.4M4.4 -8.4L9.6 -19.6';
export const SUR = 'M-0.5 50.8C-4.8 39.4 -11 23.4 -15.1 8.6C-16.1 5.2 -13.6 3.5 -10.4 3.8C-4.2 3.1 5.6 4 11.8 3.6C15 3.5 16.4 5.6 15.3 8.6C10.6 22.6 5.2 37.2 0.8 50.4';
export const PIVOTE = 'M3.2 -0.4C3.3 2.2 1.3 3.5 -0.6 3.2C-2.9 3 -3.6 0.8 -3.1 -0.9C-2.4 -3 0.6 -3.6 2.1 -2.4C2.9 -1.8 3.3 -1 3.4 0.2';
export const LISTO = 'M48 84C55 91 63 100 69 110C81 88 98 66 118 48';

/* El largo de un trazo (lo que SVG llama `pathLength` en la rosa del sitio): se mide muestreando sus
   curvas. Solo entiende lo que usa la rosa (M, L, Q, C y numeros absolutos). */
export function largoDe(d) {
  const t = String(d).match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) || [];
  let i = 0, x = 0, y = 0, total = 0;
  const n = () => Number(t[i++]);
  const paso = (px, py) => { total += Math.hypot(px - x, py - y); x = px; y = py; };
  while (i < t.length) {
    const c = t[i++];
    if (c === 'M') { x = n(); y = n(); }
    else if (c === 'L') paso(n(), n());
    else if (c === 'Q') {
      const [x1, y1, x2, y2] = [n(), n(), n(), n()], [x0, y0] = [x, y];
      for (let s = 1; s <= 24; s++) { const u = s / 24, v = 1 - u; paso(v * v * x0 + 2 * v * u * x1 + u * u * x2, v * v * y0 + 2 * v * u * y1 + u * u * y2); }
    } else if (c === 'C') {
      const [x1, y1, x2, y2, x3, y3] = [n(), n(), n(), n(), n(), n()], [x0, y0] = [x, y];
      for (let s = 1; s <= 24; s++) {
        const u = s / 24, v = 1 - u;
        paso(v ** 3 * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u ** 3 * x3, v ** 3 * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u ** 3 * y3);
      }
    } else throw new Error('trazo no soportado: ' + c);
  }
  return total;
}

/* Las marcas del libro: una por pagina, repartidas en el aro desde arriba hacia la derecha, cada una
   un poco distinta de su vecina (numeros fijos por posicion: el mismo libro, la misma rosa). Es la
   misma cuenta de site.js (ldBegin). */
export function marcasDe(n) {
  return Array.from({ length: n }, (_, i) => {
    const jit = (k) => { const x = Math.sin((i + 1) * 91.17 + k * 17.31) * 10000; return x - Math.floor(x) - 0.5; };
    const y0 = 54 + jit(2) * 2.6, len = 10.5 + jit(3) * 3.2;
    const f = (v) => v.toFixed(1);
    const d = 'M' + f(jit(5) * 0.8) + ',' + f(y0) + ' Q' + f(jit(4) * 2.2) + ',' + f(y0 + len / 2) + ' ' + f(jit(6) * 0.9) + ',' + f(y0 + len);
    return { d, giro: 180 + (360 * i) / n + jit(1) * 5, largo: largoDe(d) };
  });
}

/* La linea de tiempo de «el libro llega» (ms): las paginas van llegando una tras otra, y cuando
   llega la ultima la rosa se apaga y se dibuja el «listo». Cabe en el video mas corto. */
export const LIBRO = { paginas: 10, primera: 900, apagado: 300, traza: 400, pulso: 500, entra: 300, sale: 600 };
export function tiempoLibro(duracionMs, n = LIBRO.paginas) {
  const ultima = Math.max(LIBRO.primera + 600, duracionMs * 0.6);
  const llegadas = Array.from({ length: n }, (_, i) => LIBRO.primera + ((ultima - LIBRO.primera) * i) / Math.max(1, n - 1));
  const listo = ultima + 350;
  return { llegadas, listo, fin: listo + LIBRO.traza };
}

/* Las curvas del aro (carga.css, carga-trazo): cuanto se ha dibujado (0 a 1) y cuanto ha girado el
   aro sobre si mismo, segun donde va la vuelta (u de 0 a 1). Va de un lado al otro y vuelve. */
export const dibujado = (u) => (u < 0.5 ? u / 0.5 : (1 - u) / 0.5) * 0.625;
export const giroAro = (u) => -45 - 135 * (u < 0.5 ? u / 0.5 : (1 - u) / 0.5);
/* Una marca «buscando» (carga-marca): desde donde se ve su trazo, de 0 (todo) a 1 (nada) */
export function escondida(u) {
  if (u <= 0.03 || u >= 0.47) return 1;
  if (u < 0.14) return 1 - (u - 0.03) / 0.11;
  if (u <= 0.36) return 0;
  return (u - 0.36) / 0.11;
}

/* La tiza: una tuerca de granos sueltos que le quitan cuerpo al trazo (en el sitio es una mascara de
   ruido, `--tiza`). Se arma una vez, con el azar de la semilla. */
function crearGrano(lienzoDe, azar, lado) {
  const l = lienzoDe(lado, lado), c = l.getContext('2d');
  if (!c) return null;
  const granos = 1600;                              // siempre los mismos (el grano crece con el lado: la tiza cubre igual a 720p que a 4K)
  for (let i = 0; i < granos; i++) {
    c.globalAlpha = 0.25 + azar() * 0.55;
    c.beginPath();
    c.arc(azar() * lado, azar() * lado, (0.5 + azar() * 1.1) * lado / 130, 0, Math.PI * 2);
    c.fill();
  }
  return l;
}

/** @param {{ ancho:number, alto:number, azar:()=>number, duracionMs:number, escala:number, lienzoDe:(w:number,h:number)=>any, modo?:'brujula'|'libro' }} p */
export function crearRosa({ ancho, alto, azar, duracionMs, escala, lienzoDe, modo = 'brujula' }) {
  const lado = Math.min(ancho, alto) * (ancho < alto ? 0.62 : 0.56);          // la rosa mide esto, en unidades logicas
  const px = Math.max(64, Math.round(lado * escala));                           // y esto, en pixeles reales
  const capaA = lienzoDe(px, px), capaB = lienzoDe(px, px);
  const a = capaA.getContext('2d'), b = capaB.getContext('2d');
  if (!a || !b) throw new Error('lienzo');
  const grano = a && b ? crearGrano(lienzoDe, azar, Math.max(64, Math.round(px * 0.94))) : null;
  const caminos = { A: new Path2D(ARO_A), B: new Path2D(ARO_B), norte: new Path2D(NORTE), rayado: new Path2D(RAYADO), sur: new Path2D(SUR), pivote: new Path2D(PIVOTE), listo: new Path2D(LISTO) };
  const largos = { A: largoDe(ARO_A), B: largoDe(ARO_B), listo: largoDe(LISTO) };
  const libro = modo === 'libro';
  const marcas = libro ? marcasDe(LIBRO.paginas).map((m) => ({ ...m, camino: new Path2D(m.d) })) : [];
  const plan = libro ? tiempoLibro(duracionMs) : null;
  let t = 0;

  /* Un trazo desde `desde` hasta `hasta` (fracciones del largo): una raya con la rayita de «dash» del tamaño justo */
  const trazo = (c, camino, largo, desde, hasta) => {
    if (hasta - desde <= 0.0005) return;
    c.setLineDash([(hasta - desde) * largo, largo * 3]);
    c.lineDashOffset = -desde * largo;
    c.stroke(camino);
    c.setLineDash([]);
  };

  /* Los eventos del sonido (ms del video) */
  const eventos = libro
    ? [...plan.llegadas.map((t0, i) => ({ tipo: 'pagina', t0, t1: t0 + LIBRO.pulso, i })), { tipo: 'listo', t0: plan.listo, t1: plan.fin }]
    : [];

  function pintarRosa() {
    const u = (t % VUELTA_MS) / VUELTA_MS;
    /* en «libro», al llegar la ultima pagina la rosa se apaga (carga-listo: .22) */
    const apaga = libro ? Math.min(1, Math.max(0, (t - plan.listo) / LIBRO.apagado)) : 0;
    const cuerpo = 1 - apaga * 0.78;
    const k = px / CAJA;
    for (const c of [a, b]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, px, px); c.setTransform(k, 0, 0, k, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round'; c.fillStyle = HUESO; c.strokeStyle = HUESO; }

    /* Los dos aros: giran dos vueltas por ciclo y se dibujan y se borran */
    const aro = (c, camino, largo, ancho, alfa) => {
      c.save();
      c.globalAlpha = alfa * cuerpo;
      c.lineWidth = ancho;
      c.translate(80, 80); c.rotate(2 * Math.PI * 2 * u); c.rotate(giroAro(u) * Math.PI / 180); c.translate(-80, -80);
      trazo(c, camino, largo, 0, dibujado(u));
      c.restore();
    };
    aro(a, caminos.A, largos.A, 5.2, 0.5);
    aro(b, caminos.B, largos.B, 3, 1);
    /* el aro fino se ve mas hacia el pie: una mascara en la pantalla, de transparente (arriba) a entera (abajo) */
    b.save();
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.globalCompositeOperation = 'destination-in';
    const g = b.createLinearGradient(0, 0, 0, px);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    b.fillStyle = g;
    b.fillRect(0, 0, px, px);
    b.restore();
    a.save(); a.setTransform(1, 0, 0, 1, 0, 0); a.drawImage(capaB, 0, 0); a.restore();

    /* Las marcas del libro */
    if (libro) {
      a.save();
      a.translate(80, 80);
      marcas.forEach((m, i) => {
        a.save();
        a.rotate(m.giro * Math.PI / 180);
        const llego = t >= plan.llegadas[i];
        if (llego) {
          const p = (t - plan.llegadas[i]) / LIBRO.pulso;
          a.globalAlpha = cuerpo;
          a.lineWidth = p >= 1 ? 4.6 : 4.6 + 3.4 * (p < 0.4 ? p / 0.4 : (1 - p) / 0.6);
          trazo(a, m.camino, m.largo, 0, 1);
        } else {
          const buscando = (u + (marcas.length - i) / marcas.length) % 1;
          a.globalAlpha = 0.5 * cuerpo;
          a.lineWidth = 3.2;
          trazo(a, m.camino, m.largo, escondida(buscando), 1);
        }
        a.restore();
      });
      a.restore();
    }

    /* La aguja: gira una vuelta por ciclo, con el norte rayado */
    a.save();
    a.translate(80, 80);
    a.rotate((45 + 360 * u) * Math.PI / 180);
    a.globalAlpha = cuerpo;
    a.lineWidth = 3; a.fillStyle = 'rgba(241,239,233,.16)'; a.fill(caminos.norte); a.stroke(caminos.norte);
    a.fillStyle = HUESO;
    a.lineWidth = 2; a.globalAlpha = 0.8 * cuerpo; a.stroke(caminos.rayado);
    a.lineWidth = 2.6; a.globalAlpha = 0.7 * cuerpo; a.stroke(caminos.sur);
    a.lineWidth = 1.6; a.globalAlpha = cuerpo; a.fill(caminos.pivote); a.stroke(caminos.pivote);
    a.restore();

    /* El «listo»: la marca se dibuja encima */
    if (libro && t > plan.listo) {
      a.save();
      a.lineWidth = 6; a.globalAlpha = 1;
      trazo(a, caminos.listo, largos.listo, 0, Math.min(1, (t - plan.listo) / LIBRO.traza));
      a.restore();
    }

    /* La tiza: los granos le quitan cuerpo al trazo */
    if (grano) {
      a.save();
      a.setTransform(1, 0, 0, 1, 0, 0);
      a.globalCompositeOperation = 'destination-out';
      for (let y = 0; y < px; y += grano.height) for (let x = 0; x < px; x += grano.width) a.drawImage(grano, x, y);
      a.restore();
    }
  }

  function pintar(ctx) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = PINAR;
    ctx.fillRect(0, 0, ancho, alto);
    pintarRosa();
    /* Entra desde el pinar y al final se desvanece (asi el video se repite sin salto) */
    const entra = Math.min(1, t / LIBRO.entra), sale = Math.min(1, Math.max(0, (duracionMs - t) / LIBRO.sale));
    ctx.globalAlpha = entra * sale;
    /* en un pixel entero (si no, la capa se remuestrea y la tiza se ablanda) */
    const alinea = (n) => Math.round(n * escala) / escala;
    ctx.drawImage(capaA, alinea((ancho - lado) / 2), alinea((alto - lado) / 2), px / escala, px / escala);
    ctx.globalAlpha = 1;
  }

  return {
    avanzar(dt) { t += dt; },
    pintar,
    eventos,
    get tiempo() { return t; },
    get fin() { return plan ? plan.fin : 0; }
  };
}
