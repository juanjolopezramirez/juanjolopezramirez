/* De donde viene un texto publicado desde el panel (Developer-Mode): en que idioma se
   escribio y que hizo la IA. Lo pidio el fundador (2026-10-27): que quien lee sepa si
   una traduccion la hizo una IA, o que partes se hicieron con IA.

   enSuIdioma(o, lang, original)  el texto en el idioma de la pagina; si no esta, en el
                                  que se escribio; si no, en español. Y en cual salio,
                                  para poner lang="pt" y decir «Escrito en portugués».
   avisos(...)                    las lineas que se enseñan debajo, ya escritas.

   LOS TEXTOS, SOLO EN ESPAÑOL hasta que el fundador los apruebe (la regla de la casa):
   en las otras paginas salen en español, con lang="es". Los nombres de los idiomas no
   son textos de la casa: los da el navegador (Intl.DisplayNames) en el idioma del aviso. */
const TEXTOS = {
  es: {
    escritoEn: 'Escrito en {idioma}.',
    imagenIA: 'Imagen hecha con IA.',
    videoIA: 'Video hecho con IA.',
    traducido: 'Traducción hecha con IA.',
    hecho: 'Con ayuda de IA: {partes}.',
    partes: {
      texto: 'el texto', portada: 'la portada', lomo: 'el lomo', imagenes: 'las imágenes',
      video: 'el video', voz: 'la voz', musica: 'la música', codigo: 'el código'
    }
  }
};

const tiene = (o, k) => !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

export function enSuIdioma(o, lang, original) {
  if (!o || typeof o !== 'object') return { texto: typeof o === 'string' ? o : '', idioma: lang };
  for (const l of [lang, original, 'es']) if (l && tiene(o, l) && o[l]) return { texto: o[l], idioma: l };
  const otro = Object.keys(o).find((l) => o[l]);
  return otro ? { texto: o[otro], idioma: otro } : { texto: '', idioma: lang };
}

function nombreDeIdioma(codigo, en) {
  try { return new Intl.DisplayNames([en], { type: 'language' }).of(codigo) || codigo; } catch (e) { return codigo; }
}
function juntar(lista, en) {
  try { return new Intl.ListFormat(en, { style: 'long', type: 'conjunction' }).format(lista); } catch (e) { return lista.join(', '); }
}

/* «en inglés», «in Portuguese»…: lo que oye quien usa lector de pantalla cuando un libro
   esta en otro idioma que la pagina. Para español e ingles, las frases de siempre
   (ui.js → lib.in.es / lib.in.en); para los demas (un libro del panel en portugues), la
   misma forma con el nombre que da el navegador. */
const EN = { es: 'en', en: 'in', pt: 'em', fr: 'en', it: 'in' };
export function enElIdioma(lang, idioma, t) {
  const clave = 'lib.in.' + idioma;
  const hecha = typeof t === 'function' ? t(clave) : clave;
  if (hecha && hecha !== clave) return hecha;
  const pagina = tiene(EN, lang) ? lang : 'es';
  return `${EN[pagina]} ${nombreDeIdioma(idioma, pagina)}`;
}

/* Las lineas del aviso para algo que se ve en `mostrado` dentro de la pagina `lang`.
   Devuelve { lang (el de los textos del aviso), lineas: [...], nota: { texto, lang } | null }. */
/* Las frases que llevan en su pie una imagen o un video del editor hechos con IA */
export function textosDeBloques(lang) {
  const en = tiene(TEXTOS, lang) ? lang : 'es';
  return { lang: en, imagenIA: TEXTOS[en].imagenIA, videoIA: TEXTOS[en].videoIA };
}

/* `sinIdioma`: donde el idioma ya se ve de otra forma (la marca «PT» de un libro), no se
   repite «Escrito en portugués». */
export function avisos({ lang, mostrado, ia, sinIdioma = false }) {
  const en = tiene(TEXTOS, lang) ? lang : 'es';
  const tx = TEXTOS[en];
  const lineas = [];
  if (!sinIdioma && mostrado && mostrado !== lang) lineas.push(tx.escritoEn.replace('{idioma}', nombreDeIdioma(mostrado, en)));
  const uso = ia && typeof ia === 'object' ? ia : {};
  if (Array.isArray(uso.traducciones) && uso.traducciones.includes(mostrado)) lineas.push(tx.traducido);
  const partes = (Array.isArray(uso.partes) ? uso.partes : []).filter((p) => tiene(tx.partes, p)).map((p) => tx.partes[p]);
  if (partes.length) lineas.push(tx.hecho.replace('{partes}', juntar(partes, en)));
  return { lang: en, lineas, nota: typeof uso.nota === 'string' && uso.nota ? uso.nota : null };
}
