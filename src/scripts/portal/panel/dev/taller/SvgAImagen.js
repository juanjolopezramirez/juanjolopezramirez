/* UN SVG QUE SE SUBE COMO IMAGEN. El libro guarda imagenes (png, jpg, webp), nunca un SVG: un SVG puede traer codigo.
   Aqui se dibuja en un lienzo, nitido, y sale un PNG. (Los iconos de los botones tienen su propio camino: SvgSubido.js.)

   Una imagen cargada en un <img> no ejecuta codigo ni pide nada de fuera, asi que dibujarla es seguro.
   Se necesita el tamaño: el del ancho/alto del archivo o, si no los tiene, el de su viewBox. */
export const LADO_MAX = 2400;           // el lado mas largo del PNG, en px
export const LADO_MIN = 1200;           // un icono chico se dibuja mas grande, para que no salga borroso
const TOPE_BYTES = 4 * 1024 * 1024;     // un SVG de mas de 4 MB no es un dibujo: no se abre
const ESPERA_MS = 15000;                // un dibujo que no se abre en 15 s se deja

export const esSvg = (archivo) => !!archivo && (archivo.type === 'image/svg+xml' || /\.svg$/i.test(String(archivo.name || '')));

/* Del texto del SVG: { w, h } o null. Sin leer nada de fuera. */
export function medidaDeSvg(texto) {
  let raiz;
  try { raiz = new DOMParser().parseFromString(String(texto), 'image/svg+xml').documentElement; } catch (e) { return null; }
  if (!raiz || raiz.localName !== 'svg' || raiz.getElementsByTagName('parsererror').length) return null;
  const PX = { px: 1, pt: 4 / 3, mm: 96 / 25.4, cm: 96 / 2.54, in: 96 };
  const num = (v) => {
    const m = /^\s*([0-9]*\.?[0-9]+)\s*(px|pt|mm|cm|in)?\s*$/i.exec(String(v == null ? '' : v));
    return m ? Number(m[1]) * PX[(m[2] || 'px').toLowerCase()] : 0;      // un «100%» no es una medida: se usa el viewBox
  };
  let w = num(raiz.getAttribute('width')), h = num(raiz.getAttribute('height'));
  if (!(w > 0 && h > 0)) {
    const vb = String(raiz.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (vb.length === 4 && vb[2] > 0 && vb[3] > 0 && vb.every(Number.isFinite)) { w = vb[2]; h = vb[3]; }
  }
  return w > 0 && h > 0 && Number.isFinite(w) && Number.isFinite(h) ? { w, h } : null;
}

/* La medida del PNG: el lado largo entre LADO_MIN y LADO_MAX, con la misma forma que el dibujo */
export function medidaPng({ w, h }) {
  const largo = Math.max(w, h), k = Math.min(LADO_MAX, Math.max(LADO_MIN, largo)) / largo;
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

/* → un File PNG, o null si no se pudo (no es un SVG legible, o el navegador no lo dibuja) */
export async function svgAPng(archivo) {
  if (!esSvg(archivo) || archivo.size > TOPE_BYTES) return null;
  try {
    const texto = await archivo.text();
    /* Un SVG con DOCTYPE o ENTITY puede inflarse al leerlo: un dibujo normal no los trae (SvgSubido.js los rechaza igual) */
    if (/<!DOCTYPE|<!ENTITY/i.test(texto)) return null;
    const medida = medidaDeSvg(texto);
    if (!medida) return null;
    const { w, h } = medidaPng(medida);
    /* Una direccion «data:» y no «blob:»: la politica del sitio deja `img-src 'self' data:` y no deja «blob:» */
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(texto);
    await Promise.race([img.decode(), new Promise((_, mal) => { setTimeout(() => mal(new Error('tarda')), ESPERA_MS); })]);
    const lienzo = document.createElement('canvas');
    lienzo.width = w;
    lienzo.height = h;
    lienzo.getContext('2d').drawImage(img, 0, 0, w, h);
    const blob = await new Promise((ok) => lienzo.toBlob(ok, 'image/png'));
    if (!blob || blob.type !== 'image/png') return null;
    const nombre = String(archivo.name || 'imagen').replace(/\.svg$/i, '') + '.png';
    return new File([blob], nombre, { type: 'image/png' });
  } catch (e) {
    return null;
  }
}
