/* DE LA LLUVIA A UN ARCHIVO MP4 (Brand Assets → Animaciones; la pantalla es panel/dev/MarcaVideo.js).

   Todo pasa en el navegador de quien lo pide, SIN grabar la pantalla:
     1. se dibuja cada cuadro de la lluvia (animacion/lluvia.js) en un lienzo del tamaño elegido,
        mas rapido que el tiempo real y con el mismo resultado cada vez;
     2. cada cuadro se comprime a H.264 con el codificador del navegador (WebCodecs) y se va
        metiendo en un MP4;
     3. si se quiere sonido, se fabrica (animacion/sonido.js), se comprime a AAC y se mete en el
        mismo MP4.
   Armar el contenedor MP4 lo hace «mediabunny» (version fija en package.json). Se carga con
   `import()` SOLO al exportar: ni entra en la pagina ni se baja si nadie pide un video. No abre
   hilos ni usa eval ni WebAssembly (por eso cabe en la politica de seguridad del sitio).

   Lo que NO hace: ni fondo transparente (H.264 no tiene transparencia), ni garantiza que el
   archivo sea identico byte a byte en otro navegador u otro computador (si, el mismo en el
   mismo navegador), ni funciona donde el navegador no trae codificadores (`capacidades()` lo
   dice antes, y la pantalla apaga lo que no se puede). */
import { FPS, AUDIO, CALIDADES, DURACIONES, FORMATOS, medidasDeSalida } from '../../../data/portal/animaciones.js';
import { crearAzar, crearLluvia, leerLetra, TIPOGRAFIAS } from './lluvia.js';
import { sintetizar } from './sonido.js';
import logoAlef from '../../../assets/alef/logo.svg?raw';
import memSvg from '../../../assets/alef/mem.svg?raw';
import tavSvg from '../../../assets/alef/tav.svg?raw';

const LETRAS = { logo: logoAlef, mem: memSvg, tav: tavSvg };
const SEMILLA_SONIDO = 0x5bd1e995;
const PLAZO_MS = 30000;       // si un paso del codificador no responde en este tiempo, se da por atascado
const lienzoDe = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/* Espera `promesa`, pero se rinde si se cancela (`senal`) o si no responde en `PLAZO_MS`: asi
   «Cancelar» corta de verdad aunque el codificador este colgado, y un video atascado no deja la
   pantalla bloqueada para siempre. Lanza Error('cancelado') o Error('atascado'). */
const esperar = (promesa, senal) => new Promise((ok, mal) => {
  if (senal && senal.aborted) { mal(new Error('cancelado')); return; }
  const plazo = setTimeout(() => { limpiar(); mal(new Error('atascado')); }, PLAZO_MS);
  const alCancelar = () => { limpiar(); mal(new Error('cancelado')); };
  const limpiar = () => { clearTimeout(plazo); if (senal) senal.removeEventListener('abort', alCancelar); };
  if (senal) senal.addEventListener('abort', alCancelar, { once: true });
  Promise.resolve(promesa).then((v) => { limpiar(); ok(v); }, (e) => { limpiar(); mal(e); });
});

/* Cede el turno al navegador sin esperar un reloj (un setTimeout se frena cuando la pestaña no se ve) */
const ceder = () => new Promise((ok) => {
  const canal = new MessageChannel();
  canal.port1.onmessage = () => { canal.port1.close(); ok(); };
  canal.port2.postMessage(0);
});

async function cargarTipografias() {
  if (!document.fonts || !document.fonts.load) return;
  const cargas = Promise.all(TIPOGRAFIAS.map(([fuente, texto]) => document.fonts.load(fuente, texto)));
  await Promise.race([cargas, new Promise((ok) => setTimeout(ok, 4000))]).catch(() => {});
}

/* Lo que ESTE navegador puede hacer (sin cargar mediabunny): si trae codificadores de video y de
   audio, y cuales calidades acepta. {video, audio, calidades: {'720': true, …}} */
export async function capacidades() {
  const r = { video: false, audio: false, calidades: {} };
  if (typeof VideoEncoder === 'undefined' || typeof HTMLCanvasElement === 'undefined') return r;
  const ancho = FORMATOS[0];
  for (const c of CALIDADES) {
    /* 4K NO se consulta: en algunos equipos preguntarle al codificador por un video de 4K deja la
       pagina colgada (se vio en las pruebas). Se da por posible si el de 1080p lo es, y si de
       verdad no puede, el error sale al hacer el video (y la pantalla avisa que es la mas pesada). */
    if (c.lado > 1080) continue;
    const m = medidasDeSalida(ancho, c);
    try {
      const s = await VideoEncoder.isConfigSupported({ codec: c.codec, width: m.w, height: m.h, bitrate: c.bps, framerate: FPS });
      r.calidades[c.id] = !!(s && s.supported);
    } catch (e) { r.calidades[c.id] = false; }
  }
  for (const c of CALIDADES) if (c.lado > 1080) r.calidades[c.id] = !!r.calidades['1080'];
  r.video = Object.values(r.calidades).some(Boolean);
  if (typeof AudioEncoder !== 'undefined' && typeof OfflineAudioContext !== 'undefined') {
    try {
      const s = await AudioEncoder.isConfigSupported({ codec: AUDIO.codec, sampleRate: AUDIO.frecuencia, numberOfChannels: AUDIO.canales, bitrate: AUDIO.bps });
      r.audio = !!(s && s.supported);
    } catch (e) { r.audio = false; }
  }
  return r;
}

/* Cuanto pesara, mas o menos (MB): los bits del video y del audio por los segundos que dura */
export const estimarMB = (calidad, duracion, conSonido) =>
  Math.max(0.1, ((calidad.bps + (conSonido ? AUDIO.bps : 0)) * duracion) / 8 / 1_048_576);

/* UN cuadro (para la vista previa): dibuja la lluvia a los `segundos` en `lienzo`, a `ancho` px de ancho. */
export async function pintarFotograma({ animacion, formato, lienzo, ancho, segundos, vigente }) {
  await cargarTipografias();
  const k = ancho / formato.ancho;
  lienzo.width = Math.round(formato.ancho * k);
  lienzo.height = Math.round(formato.alto * k);
  const ctx = lienzo.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('lienzo');
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const sim = crearLluvia({
    ancho: formato.ancho, alto: formato.alto, azar: crearAzar(animacion.semilla),
    letra: leerLetra(LETRAS[animacion.letra], lienzoDe), modo: animacion.modo, duracionMs: segundos * 1000 + 5000
  });
  const dt = 1000 / FPS;
  const cuadros = Math.round(segundos * FPS);
  for (let n = 0; n < cuadros; n++) {
    sim.avanzar(dt);
    sim.pintar(ctx);          // dibujar tambien gasta azar: se dibuja cada cuadro, igual que al exportar
    /* cada 12 cuadros se cede el turno (la pagina no se congela) y, si ya se pidio otra muestra, se deja esta */
    if (n % 12 === 11) { await ceder(); if (vigente && !vigente()) return; }
  }
}

/* EXPORTAR. `alProgreso({fase, hecho, total})`; `senal` es un AbortSignal para cancelar.
   Devuelve el MP4 como Blob. Lanza Error('cancelado'), Error('lienzo'), Error('atascado') u otro (la pantalla los traduce). */
export async function exportarVideo({ animacion, formato, calidad, duracion, conSonido, alProgreso, senal }) {
  const avisar = (p) => { if (alProgreso) alProgreso(p); };
  const salida = medidasDeSalida(formato, calidad);
  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource } = await import('mediabunny');
  await cargarTipografias();

  const lienzo = lienzoDe(salida.w, salida.h);
  const ctx = lienzo.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('lienzo');
  const azar = crearAzar(animacion.semilla);
  const sim = crearLluvia({
    ancho: formato.ancho, alto: formato.alto, azar, letra: leerLetra(LETRAS[animacion.letra], lienzoDe),
    modo: animacion.modo, duracionMs: duracion * 1000
  });

  if (!DURACIONES.includes(duracion)) throw new Error('video');       // solo las duraciones de la lista
  const total = Math.round(duracion * FPS);
  const dt = 1000 / FPS;
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const fuente = new CanvasSource(lienzo, { codec: 'avc', bitrate: calidad.bps, keyFrameInterval: 2, alpha: 'discard' });   // sin transparencia: ni se intenta (evita el hilo de color/alfa)
  output.addVideoTrack(fuente, { frameRate: FPS });
  let fuenteAudio = null;
  if (conSonido) {
    fuenteAudio = new AudioBufferSource({ codec: 'aac', bitrate: AUDIO.bps });
    output.addAudioTrack(fuenteAudio);
  }
  await output.start();

  const pasos = new Array(total).fill(0);
  const fuerza = new Array(total).fill(0);
  try {
    for (let n = 0; n < total; n++) {
      if (senal && senal.aborted) throw new Error('cancelado');
      sim.avanzar(dt);
      pasos[n] = sim.pasos;
      fuerza[n] = sim.lluvia;
      ctx.setTransform(salida.k, 0, 0, salida.k, 0, 0);
      sim.pintar(ctx);
      await esperar(fuente.add(n / FPS, 1 / FPS), senal);        // el codificador marca el ritmo
      avisar({ fase: 'video', hecho: n + 1, total });
      if (n % 3 === 2) await ceder();
    }
    fuente.close();
    if (fuenteAudio) {
      avisar({ fase: 'sonido', hecho: total, total });
      const buffer = await esperar(sintetizar({
        modo: animacion.modo, duracion, fps: FPS, pasos, fuerza, azar: crearAzar(animacion.semilla ^ SEMILLA_SONIDO)
      }), senal);
      await esperar(fuenteAudio.add(buffer), senal);
      fuenteAudio.close();
    }
    avisar({ fase: 'archivo', hecho: total, total });
    await esperar(output.finalize(), senal);
    if (senal && senal.aborted) throw new Error('cancelado');       // cancelar en la ultima fase tampoco baja nada
  } catch (e) {
    /* sin esperarlo: si el codificador esta colgado, cancelar tampoco responderia y la pantalla seguiria bloqueada */
    try { output.cancel().catch(() => {}); } catch (e2) { /* ya estaba cancelado o cerrado */ }
    throw e;
  }
  return new Blob([output.target.buffer], { type: 'video/mp4' });
}
