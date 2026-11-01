/* LOS COLORES DEL LIBRO. El papel lo elige el fundador; la letra automatica sale de aqui, para que siempre
   se lea. Es pura: la usan la mesa y la hoja que se imprime, asi los dos lados dan el mismo color. */
import { objeto } from '../comun.js';
import { colorValido } from './marcas.js';

export const PAPEL_BASE = '#ffffff';
export const RECIENTES_MAX = 12;
const LEGIBLE = 4.5;                          // el contraste minimo de un texto
const VISIBLE = 3;                            // por debajo de esto, un texto ya casi no se ve
const ENLACE = '#1a4f8a';

export const MUESTRAS = [
  '#ffffff', '#fbf6e9', '#f3e7d3', '#e8dcc4', '#dce6d8', '#d6e3ec', '#e7d8e6', '#f4d9cf',
  '#111111', '#2b2b2b', '#1f2a44', '#1e3a34', '#4a2c2a', '#7a1f2b', '#b8860b', '#2f7bff'
];

const canal = (v) => { const c = v / 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
function luz(hex) {
  const n = parseInt(hex.slice(1), 16);
  return .2126 * canal(n >> 16) + .7152 * canal((n >> 8) & 255) + .0722 * canal(n & 255);
}

export function contraste(a, b) {
  const x = luz(a), y = luz(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

/* La letra que se lee sobre este papel. Entre el negro suave y el blanco siempre uno pasa; si no, el negro puro. */
export function tintaPara(papel) {
  const mejor = ['#111111', '#ffffff'].find((c) => contraste(c, papel) >= LEGIBLE);
  return mejor || '#000000';
}

/* Las tres variables de estilo de una hoja de este papel */
export function tonosDe(color) {
  const papel = colorValido(color) || PAPEL_BASE, tinta = tintaPara(papel);
  return { papel, tinta, enlace: contraste(ENLACE, papel) >= LEGIBLE ? ENLACE : tinta };
}

export const variablesDe = (color) => {
  const t = tonosDe(color);
  return { '--hoja-papel': t.papel, '--hoja-tinta': t.tinta, '--hoja-enlace': t.enlace };
};

/* Lo pintado a mano no sigue al papel: cuantos textos ya casi no se ven sobre su hoja */
export function textosPocoVisibles(contenido, base) {
  let n = 0;
  const mirar = (color, papel) => { const c = colorValido(color); if (c && contraste(c, papel) < VISIBLE) n++; };
  const recorrer = (nodo, papel) => {
    const o = objeto(nodo);
    if (o.type === 'paginaLibre') {
      const a = objeto(o.attrs), hoja = a.fondo ? PAPEL_BASE : colorValido(a.papel) || papel;
      for (const x of Array.isArray(a.objetos) ? a.objetos : []) if (x.tipo === 'texto') mirar(x.color, hoja);
      return;
    }
    if (o.type === 'text') for (const m of Array.isArray(o.marks) ? o.marks : []) if (m.type === 'textStyle') mirar(objeto(m.attrs).color, papel);
    for (const h of Array.isArray(o.content) ? o.content : []) recorrer(h, papel);
  };
  recorrer(objeto(contenido).doc, colorValido(objeto(contenido).papel) || colorValido(base) || PAPEL_BASE);
  return n;
}
