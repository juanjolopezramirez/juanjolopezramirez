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
   parentesis, la arroba y los signos < y > (nadie cierra un estilo con «</style>»), para que ningun nombre de capitulo escriba «url(» o «@import» en la hoja de impresion
   (que rechaza ese estilo entero). Cada escape es hexadecimal y lleva su espacio de cierre. */
export const cadenaCss = (texto) => `"${String(texto).replace(/[\\"()@<>\u0000-\u001F\u007F\u2028\u2029]/g, (c) => `\\${c.codePointAt(0).toString(16)} `)}"`;

/* ---- LOS TRES LUGARES DE CADA PAGINA ----
   Cada hoja (izquierda y derecha) tiene tres lugares arriba: el borde izquierdo, el centro y el borde derecho. En cada
   uno se elige que va y si va en negrita. Es lo que se guarda en ConfigPagina.cabeza.lados: solo valores de una lista
   blanca y un texto propio ya limpio, nunca marcado. La pagina 1 es la derecha (impar = derecha, par = izquierda). */
export const PAGINAS_CABEZA = ['izquierda', 'derecha'];
export const LUGARES_CABEZA = ['izq', 'centro', 'der'];
export const QUE_CABEZA = ['nada', 'libro', 'autor', 'capitulo', 'seccion', 'numero', 'texto'];
export const TEXTO_PROPIO_MAX = 60;
export const AUTOR_MAX = 80;
export const COMBINACIONES = ['solo-capitulo', 'clasico', 'libro-autor', 'ninguno'];
/* La pagina 1 es la derecha; las impares son derechas y las pares, izquierdas (como al abrir un libro) */
export const paginaDeNumero = (n) => (Math.abs(Math.trunc(n)) % 2 === 1 ? 'derecha' : 'izquierda');

/* Un texto que el autor escribe (su nombre, o lo propio de un lugar): una linea, sin controles ni marcas de direccion */
export const textoCabezaPropio = (v, max) => textoIndice(typeof v === 'string' ? v.replace(/[\u{200B}-\u{200F}\u{2060}\u{FEFF}]/gu, '') : '', max);

const vacio = () => ({ que: 'nada', negrita: false, texto: '' });
const lugar = (que) => ({ que, negrita: false, texto: '' });
const pagina3 = (izq = 'nada', centro = 'nada', der = 'nada') => ({ izq: lugar(izq), centro: lugar(centro), der: lugar(der) });

/* Las combinaciones de partida. «Solo capitulo» es lo que el encabezado hacia hasta ahora: el nombre del capitulo en
   el centro de las dos. */
export function lugaresDeCombinacion(id) {
  switch (id) {
    case 'clasico': return { izquierda: pagina3('autor', 'nada', 'libro'), derecha: pagina3('nada', 'capitulo', 'nada') };
    case 'libro-autor': return { izquierda: pagina3('autor', 'nada', 'libro'), derecha: pagina3('autor', 'nada', 'libro') };
    case 'ninguno': return { izquierda: pagina3(), derecha: pagina3() };
    default: return { izquierda: pagina3('nada', 'capitulo', 'nada'), derecha: pagina3('nada', 'capitulo', 'nada') };
  }
}

const limpiarLugar = (v) => {
  const o = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const que = QUE_CABEZA.includes(o.que) ? o.que : 'nada';
  return que === 'nada' ? vacio() : { que, negrita: o.negrita === true, texto: textoCabezaPropio(o.texto, TEXTO_PROPIO_MAX) };
};

/* Lo guardado, limpio. Sin `lados` (un libro de antes) es «Solo capitulo», que se ve igual que antes. Un lugar que
   falta, o que dice algo que no hay, queda en «nada»: unos `lados` a medias (una hoja sin escribir, o `{}`) quedan
   en «Ninguno» a proposito. Lo que no es un objeto, o la ausencia de `lados` (un libro de antes), vale «Solo capitulo». */
export function limpiarLados(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return lugaresDeCombinacion('solo-capitulo');
  const lado = (p) => {
    const o = p && typeof p === 'object' && !Array.isArray(p) ? p : {};
    return Object.fromEntries(LUGARES_CABEZA.map((l) => [l, limpiarLugar(o[l])]));
  };
  return { izquierda: lado(v.izquierda), derecha: lado(v.derecha) };
}

/* Como se llama lo que hay: una de las combinaciones de partida, o «personalizado». El texto propio solo cuenta si
   el lugar lo usa; la negrita, si el lugar dice algo. */
const llave = (l) => (l.que === 'nada' ? 'nada' : `${l.que}${l.negrita ? '*' : ''}${l.que === 'texto' ? `:${l.texto}` : ''}`);
const huella = (lados) => JSON.stringify(PAGINAS_CABEZA.map((p) => LUGARES_CABEZA.map((l) => llave(lados[p][l]))));
export function combinacionDe(lados) {
  const h = huella(lados);
  return COMBINACIONES.find((id) => huella(lugaresDeCombinacion(id)) === h) || 'personalizado';
}

/* Los lugares de una hoja ya resueltos: por cada lugar que dice algo, { lugar, texto, numero, negrita }. `ctx` y `sub`
   como en textoDeCabeza; `cab`: ConfigPagina.cabeza; `datos`: { titulo, autor } del libro; `pagina`: 'izquierda' o
   'derecha'. El numero de pagina no lleva texto (`numero: true`): lo pone quien dibuja (la mesa) o `counter(page)`. */
export function lugaresDeCabeza(ctx, sub, cab, datos, pagina) {
  const d = datos || {}, lados = (cab && cab.lados) || lugaresDeCombinacion('solo-capitulo'), p = lados[pagina] || {};
  const resolver = (s) => {
    switch (s.que) {
      case 'libro': return recortarCabeza(textoCabezaPropio(d.titulo, 300));
      case 'autor': return recortarCabeza(textoCabezaPropio(d.autor, AUTOR_MAX));
      case 'capitulo': return textoDeCabeza(ctx, sub, cab.partes);
      case 'seccion': return recortarCabeza(sub || '');
      case 'texto': return recortarCabeza(s.texto || '');
      default: return '';
    }
  };
  const lista = [];
  for (const l of LUGARES_CABEZA) {
    const s = p[l];
    if (!s || s.que === 'nada') continue;
    if (s.que === 'numero') { lista.push({ lugar: l, texto: '', numero: true, negrita: s.negrita === true }); continue; }
    const texto = resolver(s);
    if (texto) lista.push({ lugar: l, texto, numero: false, negrita: s.negrita === true });
  }
  return lista;
}

/* EL ANCHO DE CADA LUGAR. Chrome reparte solo el ancho de las cajas del margen (en proporcion a lo que mide cada
   texto) y recorta lo que no cabe, y la mesa no puede copiarle esa cuenta: por eso el reparto se dice aqui, con
   anchos fijos, y lo usan igual la hoja de impresion (`width` de @top-left/center/right) y la mesa. Uno solo ocupa
   todo el ancho; izquierda y derecha, la mitad cada uno; si hay centro (con otro), un tercio cada uno y el centro
   justo en medio. Lo que no cabe en su lugar se corta en los dos lados. `lista`: lo que devuelve lugaresDeCabeza;
   `ancho`: el de la caja de texto, en px. Devuelve cada lugar con `x` (desde el margen izquierdo) y `ancho`. */
export function repartirCabeza(lista, ancho) {
  const n = lista.length, tercio = ancho / 3, dos = (v) => Math.round(v * 100) / 100, hayCentro = lista.some((s) => s.lugar === 'centro');
  return lista.map((s) => {
    let w = ancho, x = 0;
    if (n > 1 && hayCentro) { w = tercio; x = s.lugar === 'izq' ? 0 : s.lugar === 'centro' ? tercio : 2 * tercio; }
    else if (n > 1) { w = ancho / 2; x = s.lugar === 'izq' ? 0 : ancho / 2; }
    return { ...s, x: dos(x), ancho: dos(w) };
  });
}
