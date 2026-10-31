/* LO QUE PUEDE LLEVAR UN TROZO DE TEXTO: negrita, cursiva, subrayado, tachado, enlace y estilo
   (color, fuente y tamaño). Lo demas se bota. Cada valor pasa por su regla porque terminan
   en un atributo o en una regla de estilo: un valor raro nunca llega a la pagina. */
import { enlaceSeguro, objeto } from '../comun.js';
import { nombreDeFuente } from './fuentes.js';

const SIMPLES = new Set(['bold', 'italic', 'underline', 'strike']);

export function colorValido(v) {
  if (typeof v !== 'string') return '';
  const t = v.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(t)) return t;
  const m = t.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (!m) return '';
  const c = m.slice(1).map(Number);
  return c.every((n) => n <= 255) ? '#' + c.map((n) => n.toString(16).padStart(2, '0')).join('') : '';
}

export function tamanoValido(v) {
  const m = typeof v === 'string' ? v.trim().match(/^(\d{1,3}(?:\.\d{1,2})?)pt$/) : null;
  if (!m) return '';
  const n = Number(m[1]);
  return n >= 1 && n <= 999 ? `${n}pt` : '';
}

export function limpiarMarcas(lista) {
  const salida = [];
  for (const m of Array.isArray(lista) ? lista : []) {
    const o = objeto(m);
    if (SIMPLES.has(o.type)) salida.push({ type: o.type });
    else if (o.type === 'link') {
      const href = objeto(o.attrs).href;
      if (enlaceSeguro(href)) salida.push({ type: 'link', attrs: { href } });
    } else if (o.type === 'textStyle') {
      const a = objeto(o.attrs), attrs = {};
      const color = colorValido(a.color), tam = tamanoValido(a.fontSize);
      if (color) attrs.color = color;
      if (tam) attrs.fontSize = tam;
      if (nombreDeFuente(a.fontFamily)) attrs.fontFamily = a.fontFamily;
      if (Object.keys(attrs).length) salida.push({ type: 'textStyle', attrs });
    }
  }
  return salida;
}
