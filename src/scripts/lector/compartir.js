/* COMPARTIR UN LIBRO: lo que se le da a la hoja de compartir del aparato y, donde no la hay, las direcciones de WhatsApp,
   Correo y Telegram del menu de repuesto. Pura (sin pagina): se prueba en Node (tools/test-lector.mjs).

   Se comparte SOLO el enlace corto del libro (https://juanjolopezramirez.com/<id>) y su titulo: nunca el PDF ni un archivo.
   Quien lo recibe abre el libro en el sitio. Drive no tiene una direccion para compartir un enlace: la hoja del aparato lo
   ofrece donde existe, y aqui no se finge. */

const URL_MAX = 300;
const TITULO_MAX = 200;

/* El enlace, solo si es https y no trae espacios, comillas ni controles; si no, null */
// eslint-disable-next-line no-control-regex
const enlaceBueno = (url) => typeof url === 'string' && url.length <= URL_MAX && /^https:\/\/[^\s<>"'`\\\u0000-\u001f\u007f]+$/.test(url);

/* El titulo, en una linea y con tope (sin controles: un salto de linea no se cuela en el asunto de un correo). El tope se
   cuenta en caracteres enteros (Array.from), no en mitades: un emoji en el borde no queda partido. Y una mitad suelta que ya
   viniera en el titulo pasa a «�»: encodeURIComponent lanzaria con ella. */
const MITAD_SUELTA = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
function tituloLimpio(t) {
  if (typeof t !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const una = t.replace(MITAD_SUELTA, '�').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  return Array.from(una).slice(0, TITULO_MAX).join('').trim();
}

/* Lo que va a navigator.share: { title, url } (sin titulo, solo { url }). Nunca `files`. null si el enlace no vale. */
export function datosParaCompartir(titulo, url) {
  if (!enlaceBueno(url)) return null;
  const title = tituloLimpio(titulo);
  return title ? { title, url } : { url };
}

/* Las tres direcciones del menu de repuesto, con todo codificado (tildes, «&», «#»…). null si el enlace no vale.
     whatsapp  https://wa.me/?text=<titulo + salto + enlace>
     correo    mailto:?subject=<titulo>&body=<enlace>
     telegram  https://t.me/share/url?url=<enlace>&text=<titulo> */
export function enlacesParaCompartir(titulo, url) {
  const d = datosParaCompartir(titulo, url);
  if (!d) return null;
  const e = encodeURIComponent;
  const t = d.title || '';
  return {
    whatsapp: 'https://wa.me/?text=' + e(t ? t + '\n' + d.url : d.url),
    correo: 'mailto:?' + (t ? 'subject=' + e(t) + '&' : '') + 'body=' + e(d.url),
    telegram: 'https://t.me/share/url?url=' + e(d.url) + (t ? '&text=' + e(t) : ''),
  };
}
