/* Un pasaje biblico: el texto grande en Estonia, y debajo su referencia, pequeña, en Young Serif. Dos hilos
   finos del color de la tinta lo enmarcan; nada de dorado. Nunca se parte entre dos paginas.
   Si el texto esta en hebreo, va de derecha a izquierda y en una letra hecha para el hebreo: Estonia no lo trae.
   Los saltos de linea se quedan: separan los versiculos. */
import { el, txt } from './ayuda.js';

export const tipo = 'pasaje';
export const nodos = ['pasaje'];
export const contextos = ['texto'];
export const contiene = 'nada';
export const editor = 'pasaje';
export const TEXTO_MAX = 1200;
export const REFERENCIA_MAX = 120;
export const FUENTE_HEBREO = 'Frank Ruhl Libre';

/* Hebreo es el pasaje cuya mayoria de letras es hebrea: una palabra suelta en hebreo no voltea un texto en español */
const LETRA_HEBREA = /[א-תיִ-ﭏ]/g;
const LETRA = /\p{L}/gu;
export const esHebreo = (t) => {
  const s = String(t || ''), h = (s.match(LETRA_HEBREA) || []).length;
  return h > 0 && h * 2 >= (s.match(LETRA) || []).length;
};

/* La misma limpieza del texto del libro (TextoLibro.js, sin importarlo: el lo importa a este): se van los
   controles y lo que da la vuelta al texto, y se quedan las marcas invisibles que el hebreo necesita */
const QUITAR = /[\u0000-\u0008\u000B-\u001F\u007F‪-‮⁦-⁩﻿]/g;
const limpio = (v, max) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(QUITAR, '').trim().slice(0, max) : '');

export const datos = (_, a) => ({
  texto: limpio(a.texto, TEXTO_MAX),
  referencia: limpio(a.referencia, REFERENCIA_MAX).replace(/\s+/g, ' ')
});

/* El mismo arbol en la mesa, la web y el PDF, y siempre del texto ya limpio: un renglon vacio de mas en la
   mesa haria que las paginas se cortaran distinto que en el papel */
export function piezaDePasaje(crudo) {
  const a = datos(null, crudo || {});
  const hebreo = esHebreo(a.texto);
  const cita = el('blockquote', '', [txt(a.texto)], hebreo ? { dir: 'rtl', lang: 'he' } : {});
  return el('figure', `pasaje${hebreo ? ' pasaje--hebreo' : ''}`, a.referencia ? [cita, el('figcaption', '', [txt(a.referencia)])] : [cita]);
}

export const web = (n) => piezaDePasaje(n.attrs);
export const pdf = web;
