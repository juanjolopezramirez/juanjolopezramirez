/* De un Documento (el editor estilo Notion) a un arbol NEUTRO de nodos:
     { tag, attrs, hijos }   un elemento
     { texto }               un texto (se pinta escapado, siempre)
   Lo pinta components/Bloques.astro en la pagina publica (Astro escapa texto y
   atributos). PURO, para probarlo en Node.

   LA SEGURIDAD NO DEPENDE DE QUE ALGUIEN HAYA VALIDADO ANTES: aqui se vuelve a armar el
   Documento desde el JSON (bloques.js limpia en el constructor) y solo salen las
   etiquetas de ETIQUETAS, con los atributos de ATRIBUTOS. Los enlaces pasan otra vez por
   enlaceSeguro(); las imagenes son rutas del almacen convertidas a /assets/remoto/…; los
   videos, un id de YouTube de 11 letras en youtube-nocookie (el unico marco que deja la
   politica de contenido, tools/politica-contenido.mjs). */
import { Documento } from './Documento.js';
import { enlaceSeguro } from './comun.js';
import { rutaPublica } from './publicar.js';

export const ETIQUETAS = new Set(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'footer', 'figure', 'figcaption', 'img',
  'div', 'iframe', 'a', 'hr', 'br', 'strong', 'em']);
const ATRIBUTOS = new Set(['class', 'href', 'target', 'rel', 'src', 'alt', 'loading', 'decoding', 'title', 'allow',
  'allowfullscreen', 'referrerpolicy', 'data-n', 'width', 'height']);

const el = (tag, attrs = {}, hijos = []) => ({ tag, attrs, hijos });
const txt = (texto) => ({ texto });

/* Un trozo de texto con sus marcas. «\n» es un salto de linea. */
function trozo(t) {
  const partes = [];
  t.t.split('\n').forEach((linea, i) => { if (i) partes.push(el('br')); if (linea) partes.push(txt(linea)); });
  let nodo = partes.length === 1 ? partes[0] : el('span-grupo', {}, partes);
  if (t.b) nodo = el('strong', {}, [nodo]);
  if (t.i) nodo = el('em', {}, [nodo]);
  if (t.href && enlaceSeguro(t.href)) {
    const fuera = t.href.startsWith('https://');
    nodo = el('a', { href: t.href, ...(fuera ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }, [nodo]);
  }
  return nodo;
}
/* «span-grupo» no es una etiqueta: es una lista de hermanos (se aplana al final) */
const aplanar = (nodos) => nodos.flatMap((n) => (n.tag === 'span-grupo' ? aplanar(n.hijos) : [n.hijos ? { ...n, hijos: aplanar(n.hijos) } : n]));
const trozos = (ts) => aplanar(ts.map(trozo));

function bloque(b, o) {
  switch (b.tipo) {
    case 'parrafo': return b.texto.length ? el('p', { class: 'bloque-p' }, trozos(b.texto)) : null;
    case 'titulo': return el(b.nivel === 3 ? 'h3' : 'h2', { class: 'bloque-titulo' }, trozos(b.texto));
    case 'lista': return el(b.ordenada ? 'ol' : 'ul', { class: 'bloque-lista' }, b.items.map((it) => el('li', {}, trozos(it))));
    case 'cita': return el('blockquote', { class: 'bloque-cita' }, [el('p', {}, trozos(b.texto)), ...(b.autor ? [el('footer', {}, [txt(b.autor)])] : [])]);
    case 'imagen': {
      if (!b.src) return null;
      const pie = [b.pie, b.ia ? o.textos.imagenIA : ''].filter(Boolean).join(' ');
      return el('figure', { class: 'bloque-imagen' }, [
        el('img', { src: rutaPublica(b.src), alt: b.decorativa ? '' : b.alt, loading: 'lazy', decoding: 'async' }),
        ...(pie ? [el('figcaption', {}, [txt(pie)])] : [])
      ]);
    }
    case 'video': {
      if (b.fuente !== 'youtube' || !/^[A-Za-z0-9_-]{11}$/.test(b.ref)) return null;
      return el('figure', { class: 'bloque-video' }, [
        el('div', { class: 'bloque-video__marco' }, [el('iframe', {
          src: `https://www.youtube-nocookie.com/embed/${b.ref}`,
          title: b.titulo, loading: 'lazy', referrerpolicy: 'strict-origin-when-cross-origin',
          allow: 'encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true
        })]),
        ...(b.ia ? [el('figcaption', {}, [txt(o.textos.videoIA)])] : [])
      ]);
    }
    case 'columnas':
      return el('div', { class: 'bloque-columnas', 'data-n': String(b.columnas.length) },
        b.columnas.map((col) => el('div', { class: 'bloque-columna' }, col.map((x) => bloque(x, o)).filter(Boolean))));
    case 'boton':
      if (!b.href || !enlaceSeguro(b.href)) return null;
      return el('p', { class: 'bloque-boton-fila' }, [el('a', {
        class: `bloque-boton${b.estilo === 'suave' ? ' bloque-boton--suave' : ''}`, href: b.href,
        ...(b.href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})
      }, [txt(b.texto)])]);
    case 'separador': return el('hr', { class: 'bloque-separador' });
    default: return null;               // un componente (aun no se ofrece) o algo desconocido: nada
  }
}

/* Ultima red: solo etiquetas y atributos de la lista */
function filtrar(n) {
  if ('texto' in n) return n;
  if (!ETIQUETAS.has(n.tag)) return null;
  const attrs = {};
  for (const [k, v] of Object.entries(n.attrs || {})) if (ATRIBUTOS.has(k)) attrs[k] = v;
  return { tag: n.tag, attrs, hijos: (n.hijos || []).map(filtrar).filter(Boolean) };
}

/* `json` es lo que guardo el editor ({ version, bloques }); `textos` trae las frases del
   aviso de IA de una imagen o un video (i18n/origen.js). */
export function aNodos(json, textos = { imagenIA: '', videoIA: '' }) {
  const doc = new Documento(json);
  return doc.bloques.map((b) => bloque(b, { textos })).filter(Boolean).map(filtrar).filter(Boolean);
}
