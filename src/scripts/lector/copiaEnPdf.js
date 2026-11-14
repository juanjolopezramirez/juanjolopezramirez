/* EL BOTON DE COPIAR DENTRO DE UN PDF. Un PDF no puede tocar el portapapeles, pero si puede llevar un ENLACE. El Taller exporta el
   boton de copiar como un enlace a `https://juanjolopezramirez.com/copiar/#t=<texto>`: el texto viaja en la direccion (tras el «#»,
   que nunca llega a ningun servidor). El lector de Recursos y del enlace privado reconoce ese enlace y COPIA el texto en lugar de
   abrirlo; un visor de PDF cualquiera lo abre en esa pagina, que muestra el texto y tiene su boton de copiar.
   Puro: sin pagina, sin red. Lo usan el dibujo del PDF (boton.js, armar.js), el filtro de las ediciones y el lector. */
export const BASE_COPIA = 'https://juanjolopezramirez.com/copiar/#t=';
export const COPIA_MAX = 5000;               // letras: lo mismo que el boton del Taller
export const HREF_COPIA_MAX = 18000;         // 5000 letras bien escritas con %XX caben de sobra
const CODIFICADO = /^[A-Za-z0-9\-._~!*'()%]*$/;
/* Controles, invisibles y marcas de direccion: los rangos van en numeros (0x..), sin escribir los caracteres */
const RANGOS = [[0, 8], [0xb, 0xc], [0xe, 0x1f], [0x7f, 0x9f], [0x200b, 0x200f], [0x202a, 0x202e], [0x2060, 0x2060], [0x2066, 0x2069], [0xfeff, 0xfeff]];
const OCULTOS = new RegExp('[' + RANGOS.map(([a, b]) => String.fromCharCode(a) + (b > a ? '-' + String.fromCharCode(b) : '')).join('') + ']', 'g');

export const esEnlaceCopia = (href) => typeof href === 'string' && href.startsWith(BASE_COPIA) && href.length <= HREF_COPIA_MAX && CODIFICADO.test(href.slice(BASE_COPIA.length));

/* El enlace de un texto: null si no hay nada que copiar */
export function enlaceDeCopia(texto) {
  const t = typeof texto === 'string' ? texto.replace(OCULTOS, '').slice(0, COPIA_MAX) : '';
  if (!t.trim()) return null;
  const href = BASE_COPIA + encodeURIComponent(t).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  return esEnlaceCopia(href) ? href : null;
}

/* El texto de un enlace de copia, o null si no es uno (o viene mal escrito) */
export function textoDeCopia(href) {
  if (!esEnlaceCopia(href)) return null;
  try {
    const t = decodeURIComponent(href.slice(BASE_COPIA.length)).replace(OCULTOS, '').slice(0, COPIA_MAX);
    return t.trim() ? t : null;
  } catch (e) { return null; }
}
