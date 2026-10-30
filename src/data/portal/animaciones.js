/* LAS ANIMACIONES DE «BRAND ASSETS» que se bajan como video MP4 (panel/dev/MarcaVideo.js).

   Son la lluvia de signos de The Alef Code (la que se ve de fondo en el portal) con una de
   las tres letras de Emet en el centro, dibujada cuadro a cuadro para que salga IGUAL cada
   vez y a cualquier resolucion (scripts/portal/animacion/lluvia.js). El sonido se fabrica al
   exportar (animacion/sonido.js); en el portal en vivo todo sigue en silencio.

   Los nombres que se ven (y las opciones) estan aqui; los textos de la pantalla, en
   textos.js → panel.marca.video.

   Hay dos motores (campo `motor`): la lluvia con una letra (animacion/lluvia.js) y el Tic Tac
   Toe sobre papiro (animacion/papiro.js). `vistaSegundos` es el instante de la muestra. */

export const ANIMACIONES = [
  { id: 'lluvia-alef', nombre: 'Lluvia con la Álef (א)', linea: 'Al entrar: cae la lluvia verde y la letra se descifra.', motor: 'lluvia', modo: 'entrada', letra: 'logo', vista: 'noche', semilla: 7, vistaSegundos: 3.1 },
  { id: 'lluvia-mem', nombre: 'Lluvia con la Mem (מ)', linea: 'Al cargar: llueve en amarillo, el barrido late y la letra se descifra.', motor: 'lluvia', modo: 'carga', letra: 'mem', vista: 'noche', semilla: 11, vistaSegundos: 3.1 },
  { id: 'lluvia-tav', nombre: 'Lluvia con la Tav (ת)', linea: 'Al salir: llueve en rojo y la letra se descifra.', motor: 'lluvia', modo: 'salida', letra: 'tav', vista: 'noche', semilla: 13, vistaSegundos: 3.1 },
  { id: 'el-juego-que-el-amor-ya-gano', nombre: 'El juego que el amor ya ganó', linea: 'Un tres en raya sobre papiro con la corona, los clavos, la moneda y la cruz. Al final, el amor.', motor: 'papiro', icono: 'tablero', vista: 'papiro', semilla: 21, vistaSegundos: 5.0 }
];

/* La forma de la pantalla. `ancho` y `alto` son el tamaño LOGICO sobre el que se dibuja la
   lluvia (la rejilla de signos es la misma sea cual sea la resolucion: solo se escala). */
export const FORMATOS = [
  { id: 'horizontal', ancho: 1280, alto: 720 },
  { id: 'vertical', ancho: 720, alto: 1280 },
  { id: 'cuadrado', ancho: 960, alto: 960 }
];

/* La calidad es el lado CORTO en pixeles (720p, 1080p, 4K = 2160). `codec` es el H.264 que
   hace falta para ese tamaño (perfil High, nivel 3.1 / 4.0 / 5.1) y `bps`, los bits por segundo. */
export const CALIDADES = [
  { id: '720', lado: 720, bps: 4_000_000, codec: 'avc1.64001f' },
  { id: '1080', lado: 1080, bps: 8_000_000, codec: 'avc1.640028' },
  { id: '2160', lado: 2160, bps: 25_000_000, codec: 'avc1.640033' }
];

export const DURACIONES = [4, 6, 10];       // segundos
export const FPS = 30;
export const AUDIO = { codec: 'mp4a.40.2', frecuencia: 48000, canales: 2, bps: 128_000 };

/* El tamaño en pixeles de un formato a una calidad: el lado corto mide `lado`, y todo es par
   (H.264 lo pide). `k` es cuanto se escala lo logico. */
export function medidasDeSalida(formato, calidad) {
  const k = calidad.lado / Math.min(formato.ancho, formato.alto);
  const par = (n) => Math.round(n / 2) * 2;
  return { w: par(formato.ancho * k), h: par(formato.alto * k), k };
}
