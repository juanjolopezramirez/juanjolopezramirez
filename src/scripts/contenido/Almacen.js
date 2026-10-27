/* Donde vive cada archivo subido (Supabase Storage). EL CONTRATO, que comparten el panel
   al subir, tools/traer-contenido.mjs al bajar y la regla de 007 que deja bajar los PDF
   publicados:

     la ruta que se guarda en la fila   el cajon    el nombre dentro del cajon
     libros/<id>/<idioma>.pdf           libros      <id>/<idioma>.pdf   (SIN «libros/» delante)
     lomos/…  casas/<id>/…  bloques/…   portadas    la ruta entera

   Si el nombre dentro del cajon «libros» llevara «libros/» delante, la regla de 007
   (storage.foldername(name)[1] = id del libro) no lo encontraria y el PDF publicado no
   se podria bajar: por eso la cuenta se hace SOLO aqui. */
import { rutaAlmacen, CARPETAS } from './comun.js';

const EXTS = { libros: ['pdf'], lomos: ['png'], casas: ['jpg', 'png', 'webp'], bloques: ['jpg', 'png', 'webp'], portadas: ['jpg', 'png', 'webp'] };
/* El tipo de cada extension: lo que se declara al subir (el cajon lo comprueba) */
export const TIPO_MIME = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

/* { cajon, nombre, mime } o null si la ruta no es del almacen. */
export function ubicacion(ruta) {
  const carpeta = typeof ruta === 'string' ? ruta.split('/')[0] : '';
  if (!CARPETAS.includes(carpeta) || !rutaAlmacen(ruta, EXTS[carpeta])) return null;
  const mime = TIPO_MIME[ruta.slice(ruta.lastIndexOf('.') + 1)];
  if (carpeta === 'libros') return { cajon: 'libros', nombre: ruta.slice('libros/'.length), mime };
  return { cajon: 'portadas', nombre: ruta, mime };
}

/* Ancho y alto de una imagen por su cabecera, sin dependencias (PNG, JPEG y WebP), o
   null. Lo necesita el avatar en mapa de bits de una casa (Cards.astro: avatarW/avatarH)
   y el panel para recordar la medida antes de subir. */
export function medidasDeImagen(bytes, ext) {
  const b = bytes instanceof Uint8Array ? bytes : null;
  if (!b || !esDelFormato(b, ext)) return null;
  const u16 = (i, le) => (le ? b[i] | (b[i + 1] << 8) : (b[i] << 8) | b[i + 1]);
  const u32 = (i) => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
  const bueno = (w, h) => (w > 0 && h > 0 && w <= 30000 && h <= 30000 ? { w, h } : null);
  if (ext === 'png') return b.length >= 24 ? bueno(u32(16), u32(20)) : null;
  if (ext === 'webp') {
    const tipo = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (tipo === 'VP8 ' && b.length >= 30) return bueno(u16(26, true) & 0x3fff, u16(28, true) & 0x3fff);
    if (tipo === 'VP8L' && b.length >= 25) {
      const n = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return bueno((n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1);
    }
    if (tipo === 'VP8X' && b.length >= 30) return bueno(1 + (b[24] | (b[25] << 8) | (b[26] << 16)), 1 + (b[27] | (b[28] << 8) | (b[29] << 16)));
    return null;
  }
  if (ext === 'jpg') {
    /* Se recorren los bloques hasta el SOF (el que trae las medidas) */
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marca = b[i + 1];
      const largo = u16(i + 2);
      if (marca >= 0xc0 && marca <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marca)) return bueno(u16(i + 7), u16(i + 5));
      i += 2 + largo;
    }
  }
  return null;
}

/* Los primeros bytes de cada formato: lo que se sube (y lo que se baja al compilar)
   tiene que SER lo que dice ser, no un HTML con otro nombre. */
export function esDelFormato(bytes, ext) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(0);
  const empieza = (...xs) => xs.every((x, i) => b[i] === x);
  if (ext === 'pdf') return empieza(0x25, 0x50, 0x44, 0x46, 0x2d);                       // %PDF-
  if (ext === 'png') return empieza(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (ext === 'jpg') return empieza(0xff, 0xd8, 0xff);
  if (ext === 'webp') return empieza(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return false;
}
