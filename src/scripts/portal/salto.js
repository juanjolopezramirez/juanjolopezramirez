/* EL SALTO AL HIPERESPACIO de The Alef Code (2026-10-26, lo pidio el fundador:
   «una animacion tipo video de inmersion al hiperespacio, tipo matriz»).

   Un campo de letras —hebreo, griego y signos de codigo— que vienen hacia ti
   desde el centro de la pantalla, cada una con su estela, como las estrellas al
   saltar a la velocidad de la luz. Tres sentidos:

     entrar   del sitio al portal (site.js): la pagina se cubre de noche y las
              letras ACELERAN hacia ti. Se navega a los 420 ms de siempre (el
              telon), asi que no se espera nada de mas.
     llegar   ya en el portal (fondo.js, si vienes del sitio): las letras llegan
              lanzadas y FRENAN hasta quedarse quietas; el lienzo se apaga y queda
              la red de signos. Va detras de la ventana, que se enciende como una
              pantalla de tubo (terminal.css, `js-llegada`).
     salir    del portal al sitio (site.js): las letras se RECOGEN hacia el centro
              mientras la ventana se apaga; en el sitio, el telon nace de noche y
              se levanta como un amanecer (base.css, `curtain-noche`).

   CUIDADOS
   - Quien llama decide si hay salto: con «reducir movimiento» o con el fondo en
     pausa no se llama y se navega al instante.
   - Todos los cuadros que de la pantalla, densidad de pixeles hasta 1.5, y como mucho 140
     letras (menos en pantallas chicas); las lejanas son solo estela. Si la
     pestaña se esconde, se para.
   - Sin arameo: fuera del portal no se descarga su letra, y saldrian cajas.
   - Nada se guarda en el navegador. Todo es `aria-hidden`: es decoracion. */

const GLIFOS = [...'אבגדהוזחטיכלמנסעפצקרשת', ...'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ', ...'{}<>/$#=;:+01'];
const LETRA = '"JetBrains Mono", ui-monospace, "Cascadia Mono", Consolas, monospace';
/* SIN tope de cuadros (2026-10-26: a 30 por segundo el salto «se trababa»). Dura menos
   de un segundo y con 140 letras cuesta ~3 ms por cuadro: va a lo que de la pantalla. */
export const SALTO_MS = 420;    // lo que dura entrar o salir: lo que ya tardaba el telon en navegar
export const LLEGADA_MS = 650;  // lo que tardan las letras en frenar al llegar

const azar = () => GLIFOS[(Math.random() * GLIFOS.length) | 0];

/* Calentar: medir las letras una vez en un lienzo de 1 px antes de saltar. Asi el
   primer cuadro del salto no se come el tiempo de preparar la letra. */
export function calentar() {
  try {
    const c = document.createElement('canvas').getContext('2d');
    if (!c) return;
    c.font = `500 20px ${LETRA}`;
    c.measureText(GLIFOS.join(''));
  } catch (e) { /* da igual: solo es para ir mas rapido */ }
}

/* `capa`: el elemento donde vive el lienzo (fijo a la ventana). Devuelve `parar()`. */
export function saltar(sentido, capa) {
  if (!capa) return { parar() {} };
  const lienzo = document.createElement('canvas');
  lienzo.className = 'salto__lienzo';
  lienzo.setAttribute('aria-hidden', 'true');
  capa.append(lienzo);
  const ctx = lienzo.getContext('2d');
  if (!ctx) return { parar() { lienzo.remove(); } };

  const d = Math.min(window.devicePixelRatio || 1, 1.5);
  const ancho = window.innerWidth, alto = window.innerHeight;
  lienzo.width = Math.round(ancho * d); lienzo.height = Math.round(alto * d);
  ctx.setTransform(d, 0, 0, d, 0, 0);
  const cx = ancho / 2, cy = alto / 2;
  const escala = Math.max(ancho, alto) * .5;
  const cuantas = Math.max(50, Math.min(140, Math.floor(ancho * alto / 6000)));

  /* Cada letra: una direccion en el plano (x, y) y una profundidad z (1 lejos, 0 encima). */
  const nueva = (lejos) => ({
    x: (Math.random() * 2 - 1) * .9, y: (Math.random() * 2 - 1) * .9,
    z: lejos ? .7 + Math.random() * .3 : .05 + Math.random() * .95,
    c: azar(), verde: Math.random() < .78
  });
  const letras = Array.from({ length: cuantas }, () => nueva(false));
  const dur = sentido === 'llegar' ? LLEGADA_MS : SALTO_MS;
  const k = escala * .18;
  /* Las 21 letras posibles (de 8 a 28 px), armadas una vez: en cada cuadro solo se
     elige una, y solo se cambia cuando cambia (nada de miles de cadenas por segundo). */
  const FUENTES = Array.from({ length: 21 }, (_, i) => `500 ${8 + i}px ${LETRA}`);

  let inicio = 0, ultimo = 0, pedido = 0, vivo = true;

  function cuadro(t) {
    pedido = 0;
    if (!vivo) return;
    if (document.hidden) { parar(); return; }
    if (!inicio) inicio = t;
    const dt = ultimo ? Math.min(50, t - ultimo) : 16;
    ultimo = t;
    const p = Math.min(1, (t - inicio) / dur);

    /* La velocidad (en profundidad por segundo): acelera al entrar, frena al llegar,
       y al salir va hacia atras (las letras se alejan, de vuelta al centro). */
    let vel;
    if (sentido === 'entrar') vel = .35 + 3.4 * p * p;
    else if (sentido === 'llegar') vel = 3.2 * (1 - p) * (1 - p);
    else vel = -(.6 + 2.4 * p);

    ctx.clearRect(0, 0, ancho, alto);
    /* Al ENTRAR, la noche la pinta el propio lienzo (200 ms): un fundido de CSS encima
       de toda la pagina partia a la mitad los cuadros por segundo. */
    if (sentido === 'entrar') {
      ctx.globalAlpha = Math.min(1, (t - inicio) / 200);
      ctx.fillStyle = '#050806';
      ctx.fillRect(0, 0, ancho, alto);
    }
    const apagar = sentido === 'llegar' ? 1 - Math.max(0, (p - .55) / .45) : 1;
    const largo = Math.min(4, Math.abs(vel) * 1.4 + .6);   // la estela, mas larga cuanto mas rapido

    /* 1. Mover y juntar las estelas en 6 trazos (2 tonos × 3 grosores): 6 «stroke» por
          cuadro en vez de uno por letra. */
    const trazos = Array.from({ length: 6 }, () => new Path2D());
    for (const l of letras) {
      const ax = cx + l.x / l.z * k, ay = cy + l.y / l.z * k;   // donde estaba
      l.z -= vel * dt / 1000;
      l.ve = false;
      if (l.z <= .03 || l.z > 1.05) { Object.assign(l, nueva(vel > 0)); if (vel < 0) l.z = .05 + Math.random() * .2; continue; }
      const x = cx + l.x / l.z * k, y = cy + l.y / l.z * k;     // donde esta
      if (x < -40 || x > ancho + 40 || y < -40 || y > alto + 40) {
        Object.assign(l, nueva(vel > 0)); if (vel < 0) l.z = .05 + Math.random() * .2; continue;
      }
      const cerca = 1 - l.z;                       // 0 lejos, 1 encima
      const nivel = cerca < .4 ? 0 : cerca < .7 ? 1 : 2;
      const camino = trazos[(l.verde ? 0 : 3) + nivel];
      camino.moveTo(x - (x - ax) * largo, y - (y - ay) * largo);
      camino.lineTo(x, y);
      l.ve = true; l.px = x; l.py = y; l.cerca = cerca;
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const nivel = i % 3;
      ctx.globalAlpha = [.2, .38, .58][nivel] * apagar;
      ctx.lineWidth = [.8, 1.4, 2.2][nivel];
      ctx.strokeStyle = i < 3 ? '#00FF66' : '#A9C47F';
      ctx.stroke(trazos[i]);
    }

    /* 2. Las letras en la cabeza: crecen al acercarse. Las lejanas (chicas y tenues)
          son solo estela: escribir texto es lo que mas cuesta en cada cuadro. */
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let relleno = '', letra = -1;                  // lo puesto: se cambia solo si cambia
    for (const l of letras) {
      if (!l.ve || l.cerca < .3) continue;
      ctx.globalAlpha = Math.min(1, .15 + l.cerca * 1.1) * apagar;
      const color = l.cerca > .6 ? '#FFFFFF' : (l.verde ? '#00FF66' : '#A9C47F');
      if (relleno !== color) { ctx.fillStyle = color; relleno = color; }
      const tam = Math.min(20, Math.round(l.cerca * 20));
      if (letra !== tam) { ctx.font = FUENTES[tam]; letra = tam; }
      ctx.fillText(l.c, l.px, l.py);
    }
    ctx.globalAlpha = 1;

    if (p >= 1 && sentido === 'llegar') { parar(); return; }
    pedido = requestAnimationFrame(cuadro);
  }

  function parar() {
    vivo = false;
    if (pedido) cancelAnimationFrame(pedido);
    pedido = 0;
    lienzo.remove();
  }

  pedido = requestAnimationFrame(cuadro);
  return { parar };
}
