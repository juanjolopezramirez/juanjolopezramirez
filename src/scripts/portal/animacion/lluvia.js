/* LA LLUVIA DE SIGNOS, DIBUJADA CUADRO A CUADRO (para el video de «Brand Assets»).

   Es la misma lluvia del fondo del portal (scripts/portal/fondo.js: la rejilla de letras de las
   tres lenguas, la gota con estela, el barrido, y la letra que se descifra en el centro), pero
   hecha para EXPORTAR: nada depende del reloj, de la ventana ni del azar de verdad.
     · El azar sale de una semilla (`crearAzar`): la misma semilla da el mismo video.
     · El tiempo lo cuenta quien llama: cada `avanzar(dt)` es un paso de `dt` milisegundos y cada
       `pintar(ctx)` dibuja ESE instante. Se puede ir tan rapido como se quiera.
     · Se dibuja en un tamaño LOGICO (`ancho` x `alto`, p. ej. 1280 x 720) y quien llama escala el
       lienzo (`ctx.setTransform`): a 720p, 1080p o 4K la rejilla es la misma.
   fondo.js sigue siendo el de la pagina en vivo y NO usa este archivo: los signos y los numeros
   de aqui copian los suyos (tools/test-portal.mjs vigila que los signos no se separen).

   Los tres modos (como en el portal): 'entrada' (la א, verde), 'carga' (la מ, con el barrido
   amarillo) y 'salida' (la ת, lluvia roja). Esta animacion tiene su propia linea de tiempo:
   la lluvia crece, a los 1.2 s empieza a descifrarse la letra (2 s), y al final todo se
   desvanece (para que el video se pueda repetir). */

const HEBREO = 'אבגדהוזחטיכלמנסעפצקרשת';
const GRIEGO = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
const ARAMEO = 'ܐܒܓܕܗܘܙܚܛܝܟܠܡܢܣܥܦܨܩܪܫܬ';
const CODIGO = '{}<>/$#=;:+01';
export const SIGNOS = [...HEBREO, ...GRIEGO, ...ARAMEO, ...CODIGO];
/* Las tipografias que hay que tener cargadas antes de dibujar (el hebreo lo pone la del sistema) */
export const TIPOGRAFIAS = [['500 12px "JetBrains Mono"', GRIEGO], ['500 12px "Noto Sans Syriac"', ARAMEO]];

const LETRA = '500 12px "JetBrains Mono", "Noto Sans Syriac", ui-monospace, monospace';
const LETRA_CHICA = '500 10px "JetBrains Mono", "Noto Sans Syriac", ui-monospace, monospace';
const PASO_ANCHO = 26;     // separacion de la rejilla (en pantallas anchas)
const PASO_ESTRECHO = 32;  // y en una pantalla angosta
const LOGO_LADO = 22;      // bloques de ancho de la letra
const RAPIDEZ = { entrada: 2.6, carga: 1, salida: 2.2 };

const FONDO = '#050806';
const BLANCO = '#FFFFFF', VERDE = '#00FF66', ROJO = '#FF3B3B', AMARILLO = '#FFD60A', TIZA = '#F1EFE9';
/* El tono de cada letra: su color, el de la ESTELA de la lluvia (cada letra llueve en su color: la
   א verde, la מ amarilla, la ת roja; pedido del fundador, 2026-10-30) y el brillo (r,g,b) que le late detras */
export const TONOS = {
  entrada: { color: VERDE, brillo: '0,255,102', estela: VERDE },
  carga: { color: AMARILLO, brillo: '255,214,10', estela: AMARILLO },
  salida: { color: ROJO, brillo: '255,59,59', estela: ROJO }
};

/* La linea de tiempo (milisegundos) */
export const TIEMPO = { letraInicio: 1200, letraMs: 2000, entra: 300, sale: 600 };

/* Azar con semilla (mulberry32): la misma semilla, la misma secuencia. */
export function crearAzar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Los trazos de una letra (un SVG de solo <path>) → algo que dice si un punto esta dentro.
   `lienzoDe(ancho, alto)` da un lienzo con contexto 2D (OffscreenCanvas o <canvas>). Si no se
   deja leer, devuelve null y el video sale sin letra. */
export function leerLetra(svg, lienzoDe) {
  try {
    const caja = (svg.match(/viewBox="([^"]+)"/) || [])[1].split(/\s+/).map(Number);
    const trazos = [...svg.matchAll(/<path\b([^>]*)>/g)].map(([, attrs]) => ({
      camino: new Path2D((attrs.match(/\bd="([^"]+)"/) || [])[1] || ''),
      regla: /fill-rule="evenodd"/.test(attrs) ? 'evenodd' : 'nonzero'
    }));
    const pc = lienzoDe(Math.ceil(caja[2]), Math.ceil(caja[3])).getContext('2d');
    if (!pc || !trazos.length) return null;
    return { ancho: caja[2], alto: caja[3], dentro: (x, y) => trazos.some((t) => pc.isPointInPath(t.camino, x, y, t.regla)) };
  } catch (e) { return null; }
}

/* La lluvia. `letra`: lo que da leerLetra (o null). `duracionMs`: lo que dura el video (para el
   desvanecido del final). */
export function crearLluvia({ ancho, alto, azar, letra, modo, duracionMs }) {
  const tono = TONOS[modo] || TONOS.entrada;
  const rapidez = RAPIDEZ[modo] || 1;
  const paso = ancho < 600 ? PASO_ESTRECHO : PASO_ANCHO;
  const signoAzar = () => SIGNOS[(azar() * SIGNOS.length) | 0];
  const signoDe = (col, fila) => SIGNOS[(col * 7 + fila * 13 + ((col * fila) % 5)) % SIGNOS.length];

  let t = 0, fuerza = 0, logoP = 0, fase = 0, pasos = 0;
  const filas = Math.ceil(alto / paso);
  const celdas = [];
  const columnas = [];

  const gota = (arriba) => ({
    cab: arriba ? -azar() * filas * 0.6 : azar() * filas,
    vel: 7 + azar() * 13,                         // filas por segundo
    largo: 5 + ((azar() * 11) | 0),
    ultima: -1
  });

  for (let fila = 0, y = paso * 0.75; y < alto; fila++, y += paso) {
    for (let col = 0, x = paso / 2; x < ancho; col++, x += paso) {
      const k = { x, y, col, fila, c: signoDe(col, fila), f: ((col * 31 + fila * 17) % 628) / 100 };
      celdas.push(k);
      (columnas[col] ||= { celdas: [], gota: null }).celdas[fila] = k;
    }
  }
  columnas.forEach((c) => { c.gota = gota(false); });

  /* La letra: bloques que se descifran (cada uno con su umbral) */
  const bloques = [];
  let lado = 0, centro = { x: ancho / 2, y: alto / 2, r: 0 };
  if (letra) {
    const caja = Math.min(ancho, alto) * (ancho < 600 ? 0.52 : 0.36);
    lado = Math.max(6, Math.floor(caja / LOGO_LADO));
    const cols = LOGO_LADO, fls = Math.round(LOGO_LADO * letra.alto / letra.ancho);
    const x0 = Math.round((ancho - cols * lado) / 2), y0 = Math.round((alto - fls * lado) / 2);
    centro = { x: ancho / 2, y: alto / 2, r: Math.max(cols, fls) * lado * 0.8 };
    for (let j = 0; j < fls; j++) {
      for (let i = 0; i < cols; i++) {
        if (!letra.dentro((i + 0.5) / cols * letra.ancho, (j + 0.5) / fls * letra.alto)) continue;
        bloques.push({ x: x0 + i * lado, y: y0 + j * lado, umbral: azar() * 0.8, c: signoAzar() });
      }
    }
  }

  /* Un paso de `dt` ms: la lluvia, la letra y el barrido */
  function avanzar(dt) {
    t += dt;
    /* Descifrada la letra, la lluvia se calma (queda un hilo) */
    const descifrada = modo !== 'carga' && logoP >= 1;
    const meta = descifrada ? 0.3 : 1;
    fuerza += (meta - fuerza) * Math.min(1, dt / (meta > fuerza ? 160 : 420));
    if (t >= TIEMPO.letraInicio) logoP = Math.min(1, logoP + dt / TIEMPO.letraMs);
    fase = (fase + dt * 0.00005 * (modo === 'carga' ? 7 : 1)) % 1.3;
    pasos = 0;
    if (fuerza < 0.01) return;
    for (const c of columnas) {
      const g = c.gota;
      g.cab += g.vel * rapidez * dt / 1000;
      const aqui = Math.floor(g.cab);
      if (aqui !== g.ultima) { g.ultima = aqui; if (c.celdas[aqui]) { c.celdas[aqui].c = signoAzar(); pasos++; } }
      if (g.cab - g.largo > filas) c.gota = gota(true);
    }
  }

  /* Dibuja ESTE instante en `ctx` (ya escalado al tamaño logico). Llamarlo una vez por cuadro,
     en orden: dibujar tambien gasta azar (los signos que titilan). */
  function pintar(ctx) {
    let actual = null;
    const tinta = (color, luz) => {
      if (color !== actual) { ctx.fillStyle = color; actual = color; }
      ctx.globalAlpha = Math.max(0, Math.min(1, luz));
    };
    ctx.globalAlpha = 1;
    ctx.fillStyle = FONDO;
    ctx.fillRect(0, 0, ancho, alto);
    ctx.font = LETRA;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const barrido = (fase - 0.15) * alto;                                 // la franja que baja
    const latido = modo === 'carga' ? (0.55 + 0.45 * Math.sin(t * 0.00628)) * fuerza : 0;
    const apagado = 1 - logoP * 0.6;                                      // el campo cede ante la letra
    for (const k of celdas) {
      const ola = (Math.sin(k.x * 0.011 + k.y * 0.007 - t * 0.0008 + k.f * 0.25) + 1) / 2;
      const franja = Math.max(0, 1 - Math.abs(k.y - barrido) / 90);
      const luz = (0.045 + ola * 0.06 + franja * 0.12 * (1 - fuerza)) * apagado;
      let estela = 0;
      if (fuerza > 0.01) {
        const g = columnas[k.col] && columnas[k.col].gota;
        const d = g ? g.cab - k.fila : -1;
        if (d >= 0 && d < g.largo) estela = (1 - d / g.largo) * fuerza * apagado;
        if (estela > 0.05 && d < 1) { tinta(BLANCO, 0.45 + 0.55 * estela); ctx.fillText(k.c, k.x, k.y); continue; }
      }
      const pulso = franja * latido;
      if (pulso > estela && pulso > 0.05) tinta(AMARILLO, luz + pulso * 0.4);   // el barrido de la carga
      else if (estela > 0.02) tinta(tono.estela, luz + estela * 0.85);
      else tinta(TIZA, luz);
      ctx.fillText(k.c, k.x, k.y);
    }

    if (logoP > 0.001 && bloques.length) {
      const brillo = ctx.createRadialGradient(centro.x, centro.y, 0, centro.x, centro.y, centro.r);
      brillo.addColorStop(0, `rgba(${tono.brillo},.16)`);
      brillo.addColorStop(1, `rgba(${tono.brillo},0)`);
      actual = null;
      ctx.fillStyle = brillo;
      ctx.globalAlpha = logoP;
      ctx.fillRect(centro.x - centro.r, centro.y - centro.r, centro.r * 2, centro.r * 2);
      ctx.font = LETRA_CHICA;
      for (const b of bloques) {
        const p = (logoP - b.umbral) / 0.2;
        if (p <= 0) continue;
        if (p < 1) {
          if (azar() < 0.35) b.c = signoAzar();
          tinta(BLANCO, 0.35 + 0.55 * p);
          ctx.fillText(b.c, b.x + lado / 2, b.y + lado / 2);
        } else {
          tinta(tono.color, 0.92);
          ctx.fillRect(b.x + 1, b.y + 1, lado - 2, lado - 2);
        }
      }
    }

    /* Entra desde el negro y al final se desvanece (asi el video se repite sin salto) */
    const velo = 1 - Math.min(1, t / TIEMPO.entra) * Math.min(1, Math.max(0, (duracionMs - t) / TIEMPO.sale));
    if (velo > 0.001) {
      ctx.globalAlpha = Math.min(1, velo);
      ctx.fillStyle = FONDO;
      ctx.fillRect(0, 0, ancho, alto);
    }
    ctx.globalAlpha = 1;
  }

  return {
    avanzar, pintar,
    get tiempo() { return t; },
    get pasos() { return pasos; },               // cuantos signos cambiaron en el ultimo paso (para el sonido)
    get lluvia() { return fuerza; },             // cuanto llueve (0 a 1), tambien para el sonido
    get letra() { return logoP; }                // cuanto se ha descifrado (0 a 1)
  };
}
