/* ARMAR: del arbol neutro { tag, clase, attrs, estilo, hijos } o { texto } a elementos de verdad, uno por uno
   (nunca HTML escrito). Pasan por aqui la hoja de impresion y los botones de la mesa: la misma puerta en los dos
   lados. Nada se confia: cada etiqueta, atributo y estilo se vuelve a mirar contra las listas de hoja.js. */
import { ATRIBUTOS_HOJA, ATRIBUTOS_SVG, ESTILOS_HOJA, ETIQUETAS_HOJA, ETIQUETAS_SVG } from './hoja.js';
import { enlaceSeguro } from '../comun.js';
import { TEX_MAX } from './tipos/formula.js';
import { D_MAX, PUNTOS_MAX, RE_D, RE_PUNTOS, RE_TRANSFORM } from './iconosBoton.js';

const SVG = 'http://www.w3.org/2000/svg';
const NUMERO = /^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

/* Un icono es solo formas y numeros: nada de enlaces, estilos, imagenes ni texto que el navegador ejecute */
const numeroCorto = (x) => x.length <= 32 && NUMERO.test(x);
function valorSvg(k, v) {
  switch (k) {
    case 'viewBox': { const p = v.trim().split(/[\s,]+/); return v.length <= 160 && p.length === 4 && p.every(numeroCorto); }
    case 'aria-hidden': return v === 'true';
    case 'focusable': return v === 'false';
    case 'd': return v.length <= D_MAX && RE_D.test(v);
    case 'points': return v.length <= PUNTOS_MAX && RE_PUNTOS.test(v);
    case 'fill': case 'stroke': return v === 'none' || v === 'currentColor';
    case 'fill-rule': return v === 'nonzero' || v === 'evenodd';
    case 'stroke-linecap': return v === 'round' || v === 'butt' || v === 'square';
    case 'stroke-linejoin': return v === 'round' || v === 'miter' || v === 'bevel';
    case 'transform': return v.length <= 300 && RE_TRANSFORM.test(v);
    default: return numeroCorto(v);
  }
}

export function valorSeguro(tag, k, v) {
  if (typeof v !== 'string') return false;
  if (ATRIBUTOS_SVG.has(k)) return ETIQUETAS_SVG.has(tag) && valorSvg(k, v);
  if (k === 'src') return tag === 'img' && /^data:image\/(webp|png|jpeg);base64,/.test(v);
  if (k === 'href') return tag === 'a' && (v.startsWith('#') ? /^#[a-z0-9-]+$/.test(v) : enlaceSeguro(v));
  if (k === 'id') return /^[a-z0-9-]+$/.test(v);
  if (k === 'start') return /^\d{1,5}$/.test(v);
  if (k === 'data-tex') return v.length <= TEX_MAX;
  if (k === 'dir') return v === 'rtl' || v === 'ltr' || v === 'auto';
  if (k === 'lang') return /^[a-z]{2}$/.test(v);
  return true;
}

/* LOS ESTILOS. Antes solo se miraba el nombre de la propiedad; ahora tambien su valor, y el aspecto de un boton
   (bordes, radio, sombra, opacidad) solo pasa si es exactamente lo que fabrica aspectoBoton.js: numeros con tope,
   colores de 6 cifras (la sombra suave lleva ademas su transparencia), palabras de una lista. Nunca texto libre. */
const HEX = /^#[0-9a-f]{6}$/;
const HEX_SOMBRA = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/;
const MEDIDA = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:%|mm|px)$/i;
const MALO = /url\s*\(|expression|image-set|@|[<>{};\x5c]|\/\*|!important|\bvar\s*\(/i;
const TRANSFORMAR = /^(?:translate\(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:mm|px), ?-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:mm|px)\)(?: rotate\(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?deg\))?|rotate\(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?deg\))$/i;
/* rotate(Ndeg), o translate(N mm|px, N mm|px) seguido o no de rotate(Ndeg): lo unico que pide un objeto o un boton suelto */
/* Ya con la forma buena, los numeros tambien: finitos y con tope (500 mm|px, 360 grados). `1e999` pasaria la forma */
function transformarEnTope(v) {
  const todos = [...v.matchAll(/(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(mm|px|deg)/gi)];
  return todos.length > 0 && todos.every((m) => { const n = Number(m[1]); return Number.isFinite(n) && Math.abs(n) <= (m[2].toLowerCase() === 'deg' ? 360 : 500); });
}
const SOMBRA = /^(-?\d{1,2})px (-?\d{1,2})px (\d{1,2})px (#[0-9a-f]{6}(?:[0-9a-f]{2})?)$/;
export function estiloSeguro(k, v) {
  if (typeof v !== 'string' || v.length > 300 || MALO.test(v)) return false;
  switch (k) {
    case 'border-width': return /^[0-8]px$/.test(v);
    case 'border-style': return v === 'solid' || v === 'dotted' || v === 'dashed';
    case 'border-color': return HEX.test(v) || v === 'currentcolor';
    case 'border-radius': { const m = /^(\d{1,3})px$/.exec(v); return !!m && (Number(m[1]) <= 40 || Number(m[1]) === 999); }
    case 'box-shadow': { const m = SOMBRA.exec(v); return !!m && Math.abs(m[1]) <= 20 && Math.abs(m[2]) <= 20 && Number(m[3]) <= 40 && HEX_SOMBRA.test(m[4]); }
    case 'opacity': return /^(?:0?\.\d{1,2}|1)$/.test(v) && Number(v) >= .2;
    case 'font-weight': return v === '400' || v === '700';
    case 'color': return HEX.test(v) || v === 'currentcolor';
    case 'background-color': return HEX.test(v) || v === 'transparent';
    case 'left': case 'top': case 'width': case 'height': return MEDIDA.test(v) && Math.abs(parseFloat(v)) <= 100000;
    case 'transform': return TRANSFORMAR.test(v) && transformarEnTope(v);
    case 'text-align': return ['left', 'center', 'right', 'justify'].includes(v);
    case 'grid-template-columns': return /^\d+(?:\.\d+)?fr(?: \d+(?:\.\d+)?fr){0,11}$/.test(v);
    case 'font-size': return /^\d{1,3}(?:\.\d{1,2})?(?:pt|em|%)$/.test(v);
    case 'font-family': return /^[^()]*$/.test(v);
    default: return false;
  }
}

/* La misma puerta para los estilos de un elemento que ya existe (los botones de la mesa) */
export function ponerEstilo(e, estilo) {
  for (const [k, v] of Object.entries(estilo || {})) if (ESTILOS_HOJA.has(k) && estiloSeguro(k, v)) e.style.setProperty(k, v);
}

/* Las formas del icono solo dentro de su <svg>, y lo demas solo fuera de el */
export function armar(n, enSvg = false) {
  if (!n || typeof n !== 'object') return null;
  if (typeof n.texto === 'string') return enSvg ? null : document.createTextNode(n.texto);
  if (!ETIQUETAS_HOJA.has(n.tag)) return null;
  const svg = n.tag === 'svg' || enSvg;
  if (svg !== ETIQUETAS_SVG.has(n.tag)) return null;
  const e = svg ? document.createElementNS(SVG, n.tag) : document.createElement(n.tag);
  if (n.clase) e.setAttribute('class', String(n.clase));
  for (const [k, v] of Object.entries(n.attrs || {})) if (ATRIBUTOS_HOJA.has(k) && valorSeguro(n.tag, k, v)) e.setAttribute(k, v);
  ponerEstilo(e, n.estilo);
  for (const h of n.hijos || []) { const c = armar(h, svg); if (c) e.append(c); }
  return e;
}
