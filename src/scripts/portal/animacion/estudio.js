/* EL ESTUDIO DE SONIDO de los videos (lo comparten animacion/sonido.js, la lluvia, y
   animacion/sonidoPapiro.js, el papiro).

   Es un OfflineAudioContext (un estudio que trabaja mas rapido que el tiempo real, sin
   altavoces ni permisos) con lo que hace falta para que suene a «pelicula» y no a «pitido»:
     · una SALA: reverberacion hecha con ruido de semilla que se apaga poco a poco (el eco largo
       y oscuro de una nave grande) — todo lo que se manda a la sala «florece» y se desvanece;
     · una mezcla corta y calida: un compresor suave y fundidos lentos de entrada y de salida;
     · piezas pequeñas: tonos, ruido, una envolvente, un zumbido grave (drone) con dos voces
       apenas desafinadas que respiran.
   El azar es el de la semilla (`azar`), no Math.random: el mismo video suena igual cada vez.
   Los niveles son bajos a proposito: lo sutil intriga mas que lo fuerte. */

export const FRECUENCIA = 48000;

/** @param {{ duracion: number, azar: () => number, entra?: number, sale?: number, volumen?: number }} p  duracion en segundos */
export function crearEstudio({ duracion, azar, entra = 0.9, sale = 1.1, volumen = 1.35 }) {
  const ctx = new OfflineAudioContext(2, Math.ceil(duracion * FRECUENCIA), FRECUENCIA);

  /* La salida: compresor suave y fundidos */
  const compresor = ctx.createDynamicsCompressor();
  compresor.threshold.value = -20;
  compresor.ratio.value = 3;
  compresor.attack.value = 0.02;
  compresor.release.value = 0.4;
  compresor.connect(ctx.destination);
  const maestro = ctx.createGain();
  maestro.connect(compresor);
  maestro.gain.setValueAtTime(0, 0);
  maestro.gain.linearRampToValueAtTime(volumen, entra);               // (medido: sin esto quedaba muy bajo para unos parlantes de portatil)
  maestro.gain.setValueAtTime(volumen, Math.max(entra, duracion - sale));
  maestro.gain.linearRampToValueAtTime(0, duracion);

  /* La sala: una respuesta de ruido que decae (3 s), oscurecida con un filtro de un polo, con un
     retardo de 25 ms antes de empezar (el sonido llega primero y luego la sala). */
  const largo = Math.floor(FRECUENCIA * 3);
  const impulso = ctx.createBuffer(2, largo, FRECUENCIA);
  for (let c = 0; c < 2; c++) {
    const d = impulso.getChannelData(c);
    let y = 0;
    const previo = Math.floor(FRECUENCIA * 0.025);
    for (let i = previo; i < largo; i++) {
      const x = (azar() * 2 - 1) * Math.pow(1 - (i - previo) / (largo - previo), 3.4);
      y += 0.28 * (x - y);                       // oscurece: quita lo agudo
      d[i] = y * 2.4;
    }
  }
  const sala = ctx.createConvolver();
  sala.normalize = true;
  sala.buffer = impulso;
  const salaNivel = ctx.createGain();
  salaNivel.gain.value = 0.8;
  sala.connect(salaNivel);
  salaNivel.connect(maestro);

  const seco = ctx.createGain();
  seco.gain.value = 0.85;
  seco.connect(maestro);

  /* Ruido con semilla (dos segundos, se reutiliza en bucle) */
  const ruido = ctx.createBuffer(1, FRECUENCIA * 2, FRECUENCIA);
  const datos = ruido.getChannelData(0);
  for (let i = 0; i < datos.length; i++) datos[i] = azar() * 2 - 1;

  /* Una «voz»: un nodo al que se conecta un sonido; lo manda al aire (seco) y, en la cantidad
     `sala`, a la sala. `pan` va de -1 (izquierda) a 1 (derecha). */
  const voz = (sala_ = 0.4, pan = 0) => {
    const g = ctx.createGain();
    let destino = g;
    if (pan !== 0) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); destino = p; }
    destino.connect(seco);
    const e = ctx.createGain();
    e.gain.value = sala_;
    destino.connect(e);
    e.connect(sala);
    return g;
  };
  const tono = (tipo, frecuencia, desde, hasta, destino) => {
    const o = ctx.createOscillator();
    o.type = tipo;
    o.frequency.setValueAtTime(frecuencia, desde);
    o.connect(destino);
    o.start(desde);
    o.stop(hasta);
    return o;
  };
  let usos = 0;
  const fuenteRuido = (desde, hasta, destino) => {
    const s = ctx.createBufferSource();
    s.buffer = ruido;
    s.loop = true;
    s.connect(destino);
    s.start(desde, (usos++ * 0.37) % 1.5);       // cada uso empieza en otro punto del ruido (si no, todos repetirian lo mismo)
    s.stop(hasta);
    return s;
  };
  const filtro = (tipo, frecuencia, q = 0.7, destino = null) => {
    const f = ctx.createBiquadFilter();
    f.type = tipo;
    f.frequency.value = frecuencia;
    f.Q.value = q;
    if (destino) f.connect(destino);
    return f;
  };
  /* Una envolvente: sube a `nivel` en `subida` segundos y se apaga en `bajada` (exponencial) */
  const sobre = (g, desde, subida, nivel, bajada) => {
    g.gain.setValueAtTime(0.0001, desde);
    g.gain.linearRampToValueAtTime(nivel, desde + subida);
    g.gain.exponentialRampToValueAtTime(0.0001, desde + subida + bajada);
  };
  /* Un zumbido grave que respira: cada nota son dos osciladores apenas desafinados (el «aleteo»
     de un coro), pasados por un filtro que se abre y se cierra despacio. Nace despacio (`subida`)
     y se va (`bajada`) al final. */
  const drone = (notas, desde, hasta, nivel, { subida = 1.8, bajada = 1.2, corte = 420, pan = 0 } = {}) => {
    const g = voz(0.7, pan);
    g.gain.setValueAtTime(0.0001, desde);
    g.gain.linearRampToValueAtTime(nivel, desde + subida);
    g.gain.setValueAtTime(nivel, Math.max(desde + subida, hasta - bajada));
    g.gain.linearRampToValueAtTime(0.0001, hasta);
    const f = filtro('lowpass', corte, 0.8, g);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const prof = ctx.createGain();
    prof.gain.value = corte * 0.3;
    lfo.connect(prof);
    prof.connect(f.frequency);
    lfo.start(desde);
    lfo.stop(hasta);
    for (const nota of notas) {
      tono('sine', nota * 0.997, desde, hasta, f);
      tono('triangle', nota * 1.003, desde, hasta, f);
    }
    return g;
  };

  return { ctx, azar, voz, tono, fuenteRuido, filtro, sobre, drone, duracion, render: () => ctx.startRendering() };
}
