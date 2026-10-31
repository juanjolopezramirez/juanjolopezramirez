/* EL TEXTO DE UN CAPITULO: el JSON que produce el editor (ProseMirror), revisado.

   LA REGLA: lo que entra a la base y lo que sale hacia la vista pasa por aqui. Solo quedan los
   tipos del registro (tipos/indice.js), sus atributos y las marcas de marcas.js. De lo que no
   se conoce se conserva el TEXTO y se cuenta en `descartados`: un libro nunca pierde palabras
   en silencio, y por eso tampoco se corta: si algo pasa de los topes, no se guarda y se avisa.

   Aqui no se usan `trozos()` ni `textoCrudo` de bloques.js: uno corta a las 2000 letras y el otro
   quita las marcas invisibles que el hebreo y el arabe necesitan para leerse bien. */
import { bytes, objeto } from '../comun.js';
import { POR_NODO } from './tipos/indice.js';
import { limpiarMarcas } from './marcas.js';
import { el, txt } from './tipos/ayuda.js';

export const TOPE_BYTES = 3 * 1000 * 1000;
export const TOPE_NODOS = 50000;
const PROFUNDIDAD_MAX = 40;
const VERSION = 1;

/* Quita controles y lo que da la vuelta al texto; conserva ZWJ, ZWNJ, LRM y RLM */
const QUITAR = /[\u0000-\u0008\u000B-\u001F\u007F‪-‮⁦-⁩﻿]/g;
export const textoLibro = (v) => (typeof v === 'string' ? v.replace(QUITAR, '') : '');

const LLAVE = /\{([^{}\n]{1,60})\}/g;

function soloTexto(n) {
  const o = objeto(n);
  if (typeof o.text === 'string') return textoLibro(o.text);
  return (Array.isArray(o.content) ? o.content : []).map(soloTexto).join(' ').trim();
}

function limpiarNodo(n, cuenta, prof, enColumnas) {
  const o = objeto(n);
  cuenta.nodos++;
  const tipo = POR_NODO.get(o.type);
  if (!tipo || prof > PROFUNDIDAD_MAX || (o.type === 'columnas' && enColumnas)) {
    cuenta.descartados++;
    const t = soloTexto(o);
    return t ? [{ type: 'paragraph', attrs: { capital: false, alinear: '' }, content: [{ type: 'text', text: t }] }] : [];
  }
  const attrs = tipo.datos(o.type, objeto(o.attrs));
  const salida = { type: o.type, attrs };
  if (tipo.contiene === 'enlinea') salida.content = enLinea(o.content, cuenta);
  else if (tipo.contiene === 'bloques') {
    const dentro = enColumnas || o.type === 'columnas';
    const hijos = bloques(o.content, cuenta, prof + 1, dentro);
    if (o.type === 'columnas') {
      const cols = hijos.filter((h) => h.type === 'columna').slice(0, attrs.anchos.length);
      while (cols.length < attrs.anchos.length) cols.push({ type: 'columna', attrs: {}, content: [vacio()] });
      salida.content = cols;
    } else salida.content = hijos.length || !(tipo.minimo && tipo.minimo(o.type)) ? hijos : [vacio()];
  }
  if (salida.content && !salida.content.length) delete salida.content;
  return [salida];
}
const vacio = () => ({ type: 'paragraph', attrs: { capital: false, alinear: '' } });

function bloques(lista, cuenta, prof, enColumnas) {
  return (Array.isArray(lista) ? lista : []).flatMap((n) => limpiarNodo(n, cuenta, prof, enColumnas));
}

function enLinea(lista, cuenta) {
  const salida = [];
  for (const n of Array.isArray(lista) ? lista : []) {
    const o = objeto(n);
    cuenta.nodos++;
    if (o.type === 'hardBreak') { salida.push({ type: 'hardBreak' }); continue; }
    const t = o.type === 'text' ? textoLibro(o.text) : soloTexto(o);
    if (o.type !== 'text') cuenta.descartados++;
    if (!t) continue;
    cuenta.letras += t.length;
    const marcas = o.type === 'text' ? limpiarMarcas(o.marks) : [];
    /* Un enlace que no pasa las reglas pierde el enlace, no el texto: se cuenta para avisar */
    if (Array.isArray(o.marks) && o.marks.some((m) => objeto(m).type === 'link') && !marcas.some((m) => m.type === 'link')) cuenta.descartados++;
    salida.push({ type: 'text', text: t, ...(marcas.length ? { marks: marcas } : {}) });
  }
  return salida;
}

/* { contenido: { version, doc }, letras, nodos, descartados } */
export function limpiarContenido(json) {
  const o = objeto(json), doc = objeto(o.doc || o), cuenta = { nodos: 0, letras: 0, descartados: 0 };
  const hijos = bloques(doc.content, cuenta, 0, false);
  return { contenido: { version: VERSION, doc: { type: 'doc', content: hijos.length ? hijos : [vacio()] } }, ...cuenta };
}

/* ¿Cabe? Si no, no se guarda: nunca se corta un libro */
export function cabeEnElCapitulo(limpio) {
  return limpio.nodos <= TOPE_NODOS && bytes(limpio.contenido) <= TOPE_BYTES;
}

/* Las llaves que aparecen en el texto, sin repetir */
export function llavesDe(contenido) {
  const halladas = new Set();
  const andar = (n) => {
    if (typeof n.text === 'string') for (const m of n.text.matchAll(LLAVE)) halladas.add(m[1].trim());
    (n.content || []).forEach(andar);
  };
  andar(objeto(objeto(contenido).doc));
  return [...halladas];
}

/* ---- Del JSON al arbol neutro -------------------------------------------------- */
function marcado(n) {
  let nodo = txt(n.text);
  for (const m of n.marks || []) {
    if (m.type === 'bold') nodo = el('strong', '', [nodo]);
    else if (m.type === 'italic') nodo = el('em', '', [nodo]);
    else if (m.type === 'underline') nodo = el('u', '', [nodo]);
    else if (m.type === 'strike') nodo = el('s', '', [nodo]);
    else if (m.type === 'link') nodo = el('a', '', [nodo], { href: m.attrs.href });
    else if (m.type === 'textStyle') {
      const a = m.attrs, estilo = {};
      if (a.color) estilo.color = a.color;
      if (a.fontSize) estilo['font-size'] = a.fontSize;
      if (a.fontFamily) estilo['font-family'] = `"${a.fontFamily}", Georgia, serif`;
      nodo = el('span', '', [nodo], {}, estilo);
    }
  }
  return nodo;
}

function aArbol(n, salida, o) {
  if (n.type === 'text') return marcado(n);
  if (n.type === 'hardBreak') return el('br');
  const tipo = POR_NODO.get(n.type);
  if (!tipo) return null;
  const hijos = (n.content || []).map((h) => aArbol(h, salida, o)).filter(Boolean);
  return tipo[salida]({ ...n, attrs: n.attrs || {} }, hijos, o);
}

/* `salida` es 'pdf' o 'web'. Se vuelve a limpiar: esto no depende de que alguien haya limpiado antes */
export function aNodos(contenido, salida, o = {}) {
  return limpiarContenido(contenido).contenido.doc.content.map((n) => aArbol(n, salida, o)).filter(Boolean);
}
