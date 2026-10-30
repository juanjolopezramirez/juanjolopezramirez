/* Las piezas puras de «Brand Assets» (panel/dev/Marca.js): leer un SVG, pintarlo de otro
   color, ponerle fondo y margen, darle medida, y el nombre del archivo que se baja.

   Todo es TEXTO que entra y TEXTO que sale: nada toca la pagina, nada se guarda y nada va a
   la red (por eso se prueba entero en tools/test-portal.mjs). Un SVG que no pase `esSeguro`
   no se pinta ni se baja: los de la lista salen de este mismo sitio, pero se comprueban igual
   (lo que llega por la red es dato, no confianza). */

export const COLOR = /^#[0-9A-Fa-f]{6}$/;
export const colorValido = (c) => typeof c === 'string' && COLOR.test(c);
/* «00ff66» y « #00ff66 » valen: se les pone el # y se quita el aire. Lo que no es color se queda como llego. */
export const normalizarColor = (c) => { const t = String(c == null ? '' : c).trim(); return /^[0-9A-Fa-f]{6}$/.test(t) ? '#' + t : t; };

const MAX_BYTES = 2_000_000;

/* Un SVG que se deja pintar: texto que empieza en <svg y NO trae guiones, imagenes, enlaces,
   marcos, manejadores (onload=…) ni nada que salga a buscar algo fuera (url() que no sea
   #algo, @import). Los <style> de dentro se dejan (la «Marca en dos tintas» lleva uno). */
export function esSeguro(svg) {
  if (typeof svg !== 'string' || svg.length < 20 || svg.length > MAX_BYTES) return false;
  if (!/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(svg)) return false;
  if (/<\s*(script|foreignObject|image|use|iframe|object|embed|a|link|audio|video|set|animate\w*|feImage|cursor)\b/i.test(svg)) return false;
  /* tampoco etiquetas con prefijo (<svg:script>), ni espacios de nombres de mas, ni entidades, ni escapes de CSS */
  if (/<\s*[a-z][\w.-]*:[\w.-]+/i.test(svg) || /\sxmlns:[\w.-]+\s*=/i.test(svg) || /&#|\\/.test(svg)) return false;
  if (/\son[a-z]+\s*=|javascript:|(?:href|src)\s*=|@import|image-set\s*\(|\bsrc\s*\(|<!ENTITY|<!DOCTYPE/i.test(svg)) return false;
  if (/url\(\s*(?!['"]?\s*#)/i.test(svg)) return false;
  return true;
}

/* La caja del dibujo: del viewBox de la raiz o, si no tiene, de su ancho y alto. */
export function leerCaja(svg) {
  const raiz = (String(svg).match(/<svg\b[^>]*>/i) || [''])[0];
  const v = (raiz.match(/\sviewBox="([^"]+)"/i) || [])[1];
  if (v) {
    const n = v.trim().split(/[\s,]+/).map(Number);
    if (n.length === 4 && n.every(Number.isFinite) && n[2] > 0 && n[3] > 0) return { x: n[0], y: n[1], w: n[2], h: n[3] };
  }
  /* (un ancho en «%» no sirve para medir: solo cuentan los numeros solos) */
  const w = parseFloat((raiz.match(/\swidth="([\d.]+)"/i) || [])[1]);
  const h = parseFloat((raiz.match(/\sheight="([\d.]+)"/i) || [])[1]);
  return w > 0 && h > 0 ? { x: 0, y: 0, w, h } : null;
}

/* Pinta TODA la pieza de un color: cada fill y stroke (menos «none») pasa a `color`.
   Solo para las piezas de un solo color (`colores: 'uno'` en data/portal/marca.js). */
export function recolorar(svg, color) {
  if (!colorValido(color)) throw new Error('color');
  return String(svg).replace(/\s(fill|stroke)="(?!none")[^"]*"/g, ` $1="${color}"`);
}

const num = (n) => String(Math.round(n * 1000) / 1000);

/* Le pone fondo (`hex`, o ninguno si es null) y margen (una parte del lado mas largo: .08 = 8 %)
   y quita su ancho y alto, para darle la medida despues. Devuelve el SVG nuevo y su caja. */
export function conFondo(svg, caja, hex, margen = 0) {
  if (hex !== null && !colorValido(hex)) throw new Error('fondo');
  const m = margen > 0 ? Math.max(caja.w, caja.h) * Math.min(margen, 0.5) : 0;
  const c = { x: caja.x - m, y: caja.y - m, w: caja.w + 2 * m, h: caja.h + 2 * m };
  const salida = String(svg).replace(/<svg\b[^>]*>/i, (raiz) => {
    const limpia = raiz.replace(/\s(viewBox|width|height)="[^"]*"/gi, '');
    const nueva = limpia.replace(/<svg\b/i, `<svg viewBox="${num(c.x)} ${num(c.y)} ${num(c.w)} ${num(c.h)}"`);
    return hex ? `${nueva}<rect x="${num(c.x)}" y="${num(c.y)}" width="${num(c.w)}" height="${num(c.h)}" fill="${hex}"/>` : nueva;
  });
  return { svg: salida, caja: c };
}

/* El lado mas largo (`lado`) a pixeles, sin pasar de `max`, con el otro lado en proporcion. */
export function medidasPara(caja, lado, max = 4096) {
  const l = Math.min(Math.max(1, Math.round(lado)), max);
  const k = l / Math.max(caja.w, caja.h);
  return { w: Math.max(1, Math.round(caja.w * k)), h: Math.max(1, Math.round(caja.h * k)) };
}

/* Le da ancho y alto en pixeles (despues de `conFondo`, que los quita). `preserveAspectRatio="none"`:
   al redondear ancho y alto la proporcion cambia menos de un 1 %, y asi el fondo llena el lienzo
   entero (sin una raya casi invisible en un borde). */
export const conMedida = (svg, w, h) => String(svg).replace(/<svg\b/i, `<svg width="${Math.round(w)}" height="${Math.round(h)}" preserveAspectRatio="none"`);

/* De los dos fondos de la vista (noche, hueso), el que MEJOR deja ver `hex`: asi una pieza negra no
   se pierde sobre la noche ni una blanca sobre el hueso cuando no se pidio fondo. */
const luz = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contraste = (a, b) => { const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const mejorFondo = (hex) => (colorValido(hex) && contraste(hex, '#F1EFE9') > contraste(hex, '#0B110D') ? 'hueso' : 'noche');

/* El SVG como direccion `data:` (la unica que la politica de seguridad deja usar en <img>). */
export const comoDireccion = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

/* El nombre del archivo: id[-color][-sobre-fondo][-1024px].svg|png, solo letras, numeros y guiones. */
export function nombreDeArchivo({ id, color, fondo, lado, formato }) {
  const limpio = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const partes = [limpio(id)];
  if (color && color !== 'original') partes.push(limpio(color));
  if (fondo && fondo !== 'transparente') partes.push('sobre', limpio(fondo));
  if (formato === 'png' && lado) partes.push(`${Math.round(lado)}px`);
  return `${partes.filter(Boolean).join('-')}.${formato === 'png' ? 'png' : 'svg'}`;
}
