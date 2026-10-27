/* Lo que comparten todas las piezas del contenido (Libro, Trabajo, Proyecto, Etapa, los
   bloques del editor). PURO: sin DOM ni red, para probarlo en Node
   (tools/test-contenido.mjs) y usarlo igual en el panel y al compilar.

   La regla de siempre (la de scripts/biblioteca.js y portal/estado.js): lo que llega de
   fuera —un formulario, una fila de la base— nunca se usa tal cual. Se limpia, se corta,
   se busca en una lista conocida o en las claves PROPIAS de un objeto (en un objeto
   cualquiera, «constructor» o «__proto__» parecen claves validas). */
import { limpiar } from '../portal/estado.js';

export const tiene = (o, k) => !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

/* Un objeto de verdad (no una lista, no null), o uno vacio. */
export const objeto = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});

/* Texto limpio y recortado: sin controles, sin lo invisible ni lo que da la vuelta al
   texto, sin espacios en los bordes, como mucho `max` letras. Lo que no es texto da ''. */
export const texto = (valor, max) => limpiar(valor, max);

/* Igual, pero sin recortar los bordes: para los trozos de un parrafo («Hola » + «mundo»). */
const INVISIBLES = /[\u0000-\u0008\u000B-\u001F\u007F​-‏‪-‮⁠-⁩﻿]/g;
export const textoCrudo = (valor, max) => (typeof valor === 'string' ? valor.replace(INVISIBLES, '').slice(0, max) : '');

export const entero = (valor, min, max, siNo) => {
  const n = typeof valor === 'number' ? valor : Number.NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : siNo;
};

/* ---- Idiomas -----------------------------------------------------------------
   La web tiene cinco (WEB), pero lo que se escribe puede estar en cualquiera: el
   fundador pidio poder decir en que idioma esta escrito cada cosa. Esta es la lista que
   ofrece el panel; añadir uno es una linea. Los nombres van en español (el panel lo esta). */
export const WEB = ['es', 'en', 'pt', 'fr', 'it'];
export const IDIOMAS = [
  { id: 'es', nombre: 'Español' },
  { id: 'en', nombre: 'Inglés' },
  { id: 'pt', nombre: 'Portugués' },
  { id: 'fr', nombre: 'Francés' },
  { id: 'it', nombre: 'Italiano' },
  { id: 'de', nombre: 'Alemán' },
  { id: 'nl', nombre: 'Neerlandés' },
  { id: 'ca', nombre: 'Catalán' },
  { id: 'he', nombre: 'Hebreo' },
  { id: 'el', nombre: 'Griego' },
  { id: 'la', nombre: 'Latín' },
  { id: 'ar', nombre: 'Árabe' },
  { id: 'ru', nombre: 'Ruso' },
  { id: 'zh', nombre: 'Chino' },
  { id: 'ja', nombre: 'Japonés' },
  { id: 'ko', nombre: 'Coreano' },
  { id: 'qu', nombre: 'Quechua' },
  { id: 'gn', nombre: 'Guaraní' }
];
const POR_IDIOMA = new Map(IDIOMAS.map((i) => [i.id, i.nombre]));
export const idiomaValido = (l) => typeof l === 'string' && POR_IDIOMA.has(l);
export const idiomaNombre = (l) => POR_IDIOMA.get(l) || '';

/* Un texto en varios idiomas ({ es: '…', en: '…' }): solo idiomas de la lista y texto
   limpio; lo vacio o raro se cae. */
export function i18n(valor, max) {
  const o = objeto(valor);
  const salida = {};
  for (const l of Object.keys(o)) {
    if (!idiomaValido(l)) continue;
    const t = texto(o[l], max);
    if (t) salida[l] = t;
  }
  return salida;
}

/* Las etiquetas que el fundador quiera: cortas, sin repetir (sin mirar mayusculas ni
   acentos), como mucho 12. */
export const ETIQUETAS_MAX = 12;
export const ETIQUETA_LARGO = 30;
export function etiquetas(lista) {
  if (!Array.isArray(lista)) return [];
  const vistas = new Set();
  const salida = [];
  for (const e of lista) {
    const t = texto(e, ETIQUETA_LARGO);
    const clave = t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (!t || vistas.has(clave)) continue;
    vistas.add(clave);
    salida.push(t);
    if (salida.length === ETIQUETAS_MAX) break;
  }
  return salida;
}

/* ---- Enlaces --------------------------------------------------------------------
   Un enlace que el fundador pone en un boton o en un texto. Solo tres clases:
     https://…            una pagina de fuera (nada de http, javascript:, data:…)
     mailto:alguien@x.co  un correo
     /es/…                una pagina de esta misma web (nunca «//», que es de fuera)
   Sin espacios ni comillas ni < >: lo que no encaja, no es enlace. */
const RARO = /[\s<>"'`\\]/;
export function enlaceSeguro(valor) {
  if (typeof valor !== 'string' || !valor || valor.length > 500 || RARO.test(valor)) return false;
  /* Ni lo invisible ni lo que da la vuelta al texto (un enlace que se lee al reves engaña) */
  if (new RegExp(INVISIBLES.source).test(valor)) return false;
  if (valor.startsWith('/')) return /^\/(?![/])[A-Za-z0-9\-._~/#?=&%:+]*$/.test(valor);
  if (valor.startsWith('mailto:')) return /^mailto:[^@]+@[^@]+\.[^@]+$/.test(valor);
  if (!valor.startsWith('https://')) return false;
  try {
    const u = new URL(valor);
    return u.protocol === 'https:' && !!u.hostname && u.hostname.includes('.') && !u.username && !u.password;
  } catch (e) { return false; }
}

/* ---- El almacen (Supabase Storage) ----------------------------------------------
   Toda ruta de un archivo subido empieza por una de estas carpetas y sigue con nombres
   sencillos (minusculas, cifras, punto o guion; nunca «..» ni «//»). `exts` dice que
   extensiones valen ahi: un SVG subido NO entra nunca (puede llevar codigo). */
export const CARPETAS = ['libros', 'lomos', 'portadas', 'casas', 'bloques'];
const RUTA = new RegExp(`^(${CARPETAS.join('|')})(/[a-z0-9]+(?:[.-][a-z0-9]+)*)+$`);
export function rutaAlmacen(ruta, exts) {
  if (typeof ruta !== 'string' || ruta.length > 200 || !RUTA.test(ruta)) return false;
  const punto = ruta.lastIndexOf('.');
  return punto > 0 && Array.isArray(exts) && exts.includes(ruta.slice(punto + 1));
}

/* ---- Nombres de la base -------------------------------------------------------
   En la base los campos van en snake_case (idioma_original); en el codigo, en
   camelCase (idiomaOriginal). Estas dos los pasan de una forma a otra, saltandose
   las claves que podrian tocar el prototipo. */
const PELIGROSAS = new Set(['__proto__', 'constructor', 'prototype']);
const aCamelo = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const aSerpiente = (k) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
function convertir(o, nombre) {
  const salida = {};
  for (const k of Object.keys(objeto(o))) {
    if (PELIGROSAS.has(k)) continue;
    salida[nombre(k)] = o[k];
  }
  return salida;
}
export const deFila = (fila) => convertir(fila, aCamelo);
export const aFila = (datos) => convertir(datos, aSerpiente);

/* Lo que pesa algo en la base (bytes de su JSON, no letras: una letra hebrea son dos
   bytes y una china tres). Los topes de 007 cuentan bytes; el panel avisa antes. */
export const bytes = (valor) => new TextEncoder().encode(JSON.stringify(valor ?? null)).length;

/* El resultado de toda validacion: { ok, errores: [{ campo, clave }], avisos: [{ campo, clave }] }.
   `clave` es la de un texto del panel (lo que se le dice al fundador), nunca una frase. */
export const resultado = () => ({ ok: true, errores: [], avisos: [] });
export function cerrar(r) { r.ok = r.errores.length === 0; return r; }
