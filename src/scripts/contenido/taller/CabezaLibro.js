/* EL ENCABEZADO CORRIDO, sin pantalla: que dice arriba de cada hoja de texto. Lo arman igual la mesa y la hoja de
   impresion, asi cada hoja dice lo mismo en los dos lados.

   El texto junta, en este orden y solo las partes encendidas: el rotulo («Capítulo 2»), el nombre del capitulo, su
   papel («Introducción») y la subetapa en que va («Actividades»). Una parte que no hay, o que repite otra, no sale.
   Un capitulo oculto y sin nombre (el que queda al poner el contenido a mitad de otro) hereda el encabezado del
   capitulo de antes: para quien lee sigue siendo el mismo capitulo. */
import { hijosDe, rotulosDe, textoIndice, tipoDe } from './IndiceLibro.js';
import { SUBETAPA_MAX } from './tipos/subetapa.js';

export const CABEZA_MAX = 90;
const SEPARADOR = ' · ';

/* La subetapa de un bloque de arriba, o null si no lo es. Lee igual el JSON guardado y el nodo vivo. */
const subetapaDeBloque = (n) => (tipoDe(n) === 'subetapa' ? textoIndice((n.attrs || {}).texto, SUBETAPA_MAX) : null);

/* Las subetapas de un capitulo en el orden del texto (solo bloques de arriba) */
export const subetapasDe = (doc) => hijosDe(doc).map(subetapaDeBloque).filter((t) => t !== null);

/* El texto sin pasarse de CABEZA_MAX y sin dejar medio emoji al final */
export const recortarCabeza = (t) => (t.length <= CABEZA_MAX ? t : `${t.slice(0, CABEZA_MAX - 1).replace(/[\uD800-\uDBFF]$/, '')}…`);

/* Por capitulo: { rotulo, nombre, rol, inicial (la subetapa con que empieza: la de antes si hereda), final (la
   ultima que lleva al terminar) }. `capitulos`: los de IndiceLibro ({ titulo, enIndice, rol, rolTexto, palabra, numerar, doc }). */
export function contextosDeCabeza(capitulos, { rotulo = {}, idioma = 'es', portada = false } = {}) {
  const rs = rotulosDe(capitulos, { rotulo, idioma, portada });
  let antes = null;
  return capitulos.map((c, k) => {
    const nombre = textoIndice(c.titulo, 300), suyas = subetapasDe(c.doc);
    /* Hereda el capitulo oculto al que nadie le puso nombre a mano (un titulo dentro de la cola no es un nombre:
       para quien lee sigue siendo el mismo capitulo); si el de antes es la portada, no hay nada que heredar */
    const hereda = k > 0 && !(portada && k === 1) && c.enIndice === false && !c.tituloPropio && antes;
    const ctx = hereda
      ? { rotulo: antes.rotulo, nombre: antes.nombre, rol: antes.rol, inicial: antes.final }
      : { rotulo: rs[k].rotulo, nombre, rol: rs[k].rol, inicial: '' };
    ctx.final = suyas.length ? suyas[suyas.length - 1] : ctx.inicial;
    antes = ctx;
    return ctx;
  });
}

/* El texto de una hoja. `sub`: la subetapa que le toca. `partes`: las de ConfigPagina.cabeza. Vacio = sin encabezado. */
export function textoDeCabeza(ctx, sub, partes) {
  const p = partes || {}, trozos = [];
  const poner = (t) => { if (t && !trozos.some((x) => x.toLowerCase() === t.toLowerCase())) trozos.push(t); };
  if (p.rotulo) poner(ctx.rotulo);
  if (p.nombre) poner(ctx.nombre);
  if (p.rol) poner(ctx.rol);
  if (p.subetapa) poner(sub);
  return recortarCabeza(trozos.join(SEPARADOR));
}

/* Un texto como cadena de CSS (`content: "…"`). Se escapan las comillas, la barra y los controles; tambien el
   parentesis y la arroba, para que ningun nombre de capitulo escriba «url(» o «@import» en la hoja de impresion
   (que rechaza ese estilo entero). Cada escape es hexadecimal y lleva su espacio de cierre. */
export const cadenaCss = (texto) => `"${String(texto).replace(/[\\"()@\u0000-\u001F\u007F\u2028\u2029]/g, (c) => `\\${c.codePointAt(0).toString(16)} `)}"`;
