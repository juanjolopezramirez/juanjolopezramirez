/* DEL LIBRO A LA HOJA: lo que se imprime. La pantalla y el PDF usan EL MISMO estilo del libro (`cssLibro`)
   y el mismo motor del navegador: por eso cada pagina empieza en la misma palabra en los dos lados
   (prueba de la Etapa 1: 65 paginas iguales). La caja del texto mide pixeles enteros; el margen de
   impresion absorbe la fraccion, asi la hoja sale exacta en milimetros.

   `aHoja` es PURA, para probarla en Node: devuelve el estilo y un arbol neutro, y la pagina /taller-hoja/
   lo convierte en elementos uno por uno. Todo numero que entra al estilo ya paso por ConfigPagina, y
   toda fuente por fuentes.js, asi que aqui no llega nada escrito por nadie. */
import { CABEZA_INTERLINEA, colorDeLetra, ConfigPagina, ladoDelNumero } from './ConfigPagina.js';
import { cadenaCss, contextosDeCabeza, textoDeCabeza } from './CabezaLibro.js';
import { familiaCss } from './fuentes.js';
import { aNodos, propiosDe } from './TextoLibro.js';
import { colorValido } from './marcas.js';
import { PAPEL_BASE, TINTA_SOBRE_PDF, tonosDe, variablesDe } from './colores.js';
import { objeto } from '../comun.js';
import { el } from './tipos/ayuda.js';
import { FUENTE_HEBREO } from './tipos/pasaje.js';
import { FORMAS } from './iconosBoton.js';
import { conMinis, entradasDe, hayPortada, hojasDeIndice, lugarDelIndice, opcionesDeIndice } from './IndiceLibro.js';

const tieneClase = (n, c) => !!n && ((n.clase || '').split(' ').includes(c) || (n.hijos || []).some((h) => tieneClase(h, c)));

/* Lo unico que el arbol puede pedir. La pagina de la vista vuelve a mirar estas listas. */
export const ETIQUETAS_HOJA = new Set(['section', 'nav', 'div', 'figure', 'figcaption', 'img', 'p', 'h1', 'h2', 'h3',
  'ul', 'ol', 'li', 'blockquote', 'hr', 'br', 'a', 'span', 'strong', 'em', 'u', 's', 'sup', 'sub']);
/* Los iconos de los botones: un SVG de formas simples, nada mas. armar.js revisa cada valor. */
export const ETIQUETAS_SVG = new Set(['svg', ...FORMAS]);
export const ATRIBUTOS_SVG = new Set(['viewBox', 'aria-hidden', 'focusable', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2',
  'points', 'fill', 'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'transform']);
ETIQUETAS_SVG.forEach((t) => ETIQUETAS_HOJA.add(t));
export const ATRIBUTOS_HOJA = new Set(['src', 'alt', 'href', 'id', 'start', 'data-tex', 'dir', 'lang', ...ATRIBUTOS_SVG]);
export const ESTILOS_HOJA = new Set(['color', 'background-color', 'font-size', 'font-family', 'text-align', 'width', 'height', 'left', 'top', 'transform', 'grid-template-columns',
  /* El aspecto de un boton (aspectoBoton.js): armar.js revisa cada valor, uno por uno */
  'border-width', 'border-style', 'border-color', 'border-radius', 'box-shadow', 'opacity', 'font-weight']);

/* Las formas en que el navegador escribe una letra. Con su nombre entero: «Noto Serif» no es «Noto Serif Hebrew». */
const conLetra = (f) => [`font-family: ${f};`, `font-family: ${f},`, `"${f}"`].map((v) => `.libro [style*='${v}']`).concat(`.libro [style$='font-family: ${f}']`).join(', ');

/* LA CAPITAL. Todo en CSS del libro: la mesa y el PDF la miden igual y cortan la pagina en la misma palabra.
   - El espacio a su lado crece con ella (en 'auto'): 1,2 mm fijos la dejaban pegada al texto cuando era grande.
   - Nada sale de la caja del texto: la sencilla sube dentro de un aire que el parrafo reserva
     arriba, y una letra elegida aparte (suele traer adornos) recibe un poco de aire sobre la hundida.
   - La sencilla se mide en renglones y no en em: asi sale del mismo alto con cualquier letra (Estonia es chica).
   - `box-sizing` va escrito: el portal mide con border-box y la hoja de impresion no; con alto minimo y aire
     arriba, un parrafo corto mediria distinto en la mesa y en el PDF. */
export const SENCILLA_RENGLONES = 1.7;
/* `cap` es el de ConfigPagina (ya limpio). Aun asi, lo que va al CSS es un numero o no va. */
export function estiloCapital(cap, cuerpoPt) {
  const espacio = (factor) => (Number.isFinite(cap.separaMm) ? `${cap.separaMm}mm` : `${Math.round(cuerpoPt * factor * 100) / 100}pt`);
  /* Una letra elegida para la capital ya trae su forma: engrosarla a la fuerza la deforma */
  const letra = `font-weight: ${cap.fuente ? 400 : 700};${cap.fuente ? ` font-family: ${familiaCss(cap.fuente)};` : ''}`;
  const n = cap.lineas;
  if (cap.estilo === 'sencilla') {
    return { capital: `initial-letter: ${SENCILLA_RENGLONES} 1; ${letra} margin-right: ${espacio(0.08)};`, conCapital: `padding-top: ${Math.round((SENCILLA_RENGLONES - 1) * 100) / 100}lh;` };
  }
  return {
    capital: `initial-letter: ${n}; ${letra} margin: 0 ${espacio(0.5 + 0.15 * (n - 2))} .6mm 0;`,
    conCapital: `min-height: ${n}lh; orphans: ${n};${cap.fuente ? ' padding-top: .4lh;' : ''}`
  };
}

/* El libro por dentro: igual en el editor (raiz .libro) y en la hoja */
export function cssLibro(config) {
  const c = new ConfigPagina(config), b = c.cuerpo, t = c.titulos, cap = c.capital, ci = c.cita;
  const letra = colorDeLetra(c, b.fuente) || 'var(--hoja-tinta)';
  const { capital, conCapital } = estiloCapital(cap, b.tamanoPt);
  const cita = `margin: 1em ${ci.sangriaMm}mm; font-style: ${ci.cursiva ? 'italic' : 'normal'};${ci.tamanoPct !== 100 ? ` font-size: ${ci.tamanoPct / 100}em;` : ''}${ci.fuente ? ` font-family: ${familiaCss(ci.fuente)};` : ''}`;
  /* El hilo del pasaje: la tinta a medias con el papel. Asi sirve en papel claro y en papel oscuro. */
  const hilo = 'color-mix(in srgb, var(--hoja-tinta) 45%, var(--hoja-papel))';
  /* Cada letra con su color. Lo que se pinto a mano va en el trozo mismo, y eso siempre manda. */
  const porLetra = Object.entries(c.letras).filter(([f]) => f !== b.fuente).map(([f, x]) => `${conLetra(f)} { color: ${x}; }`).join('\n');
  const porTitulo = [1, 2, 3].filter((n) => t[`t${n}`]).map((n) => `.libro h${n} { color: ${t[`t${n}`]}; }`).join('\n');
  /* Los espacios se tratan igual que en el editor: si no, una palabra cambia de linea y la pagina se corre */
  /* El estilo de siempre va primero y no cambia; las plantillas solo tocan su propia clase */
  return `${cssBaseDe(letra, b, capital, conCapital, cita, hilo)}
${cssPlantillas(c)}
${CSS_SUBETAPA}
${porLetra}
${porTitulo}`;
}

/* LA SUBETAPA: una franja pequeña. Empieza una hoja nueva (la mesa corta la columna, el PDF la pagina; cada uno lo
   dice en su sitio), asi que no lleva margen de arriba: en los dos lados nace en lo alto de la caja del texto. */
const CSS_SUBETAPA = `.libro .subetapa { box-sizing: border-box; margin: 0 0 .9em; padding: .3em .9em; min-height: 1.9em; border-radius: .3em; font-size: .78em; font-weight: 700; line-height: 1.3; letter-spacing: .14em; text-transform: uppercase; text-align: center; background: color-mix(in srgb, var(--hoja-tinta) 9%, var(--hoja-papel)); break-after: avoid; }`;

/* LAS PLANTILLAS DEL CONTENIDO. Solo estilo, igual en la mesa y en el PDF, y nunca una imagen de fondo (la hoja de
   impresion no acepta `url(`). Las cajas de las imagenes tienen medida fija: la hoja no cambia cuando llegan.
   - La linea del tiempo: cada fila dibuja su trozo de linea (asi no queda hueco entre filas, y en un contenido de dos
     hojas cada hoja empieza y termina en un circulo). El circulo va a media altura del primer renglon.
   - Dos columnas: la hoja tiene el alto exacto de la caja del texto (menos 2 px, para que el PDF no saque una hoja
     de mas por una fraccion), y las filas llenan la primera columna antes de pasar a la segunda. */
function cssPlantillas(c) {
  const p = c.enPixeles(), img = c.indice.imagen;
  const altoImagen = Math.round((p.alto * img.altoPct) / 100);
  const raya = 'color-mix(in srgb, var(--hoja-tinta) 26%, var(--hoja-papel))', suave = 'color-mix(in srgb, var(--hoja-tinta) 7%, var(--hoja-papel))';
  const centro = 'calc(.45em + .5lh)';
  return `.libro .indice__orden { flex: none; min-width: 1.7em; font-variant-numeric: tabular-nums; }
.libro .indice__mini { flex: none; display: block; width: 2.4em; aspect-ratio: ${p.W} / ${p.H}; object-fit: cover; border-radius: .15em; background: ${suave}; }
.libro .indice__imagen { margin: 0 0 1.1em; height: ${altoImagen}px; overflow: hidden; }
.libro .indice__foto { display: block; width: 100%; height: 100%; object-fit: ${img.ajuste === 'contener' ? 'contain' : 'cover'}; }
.libro .indice--minimalista .indice__titulo { font-weight: 400; letter-spacing: .04em; margin-bottom: 1.3em; }
.libro .indice--minimalista .indice__fila { margin: 0 0 .7em; }
.libro .indice--minimalista .indice__puntos, .libro .indice--tarjetas .indice__puntos { visibility: hidden; border: 0; }
.libro .indice--minimalista .indice__rotulo { display: block; font-size: .7em; letter-spacing: .14em; text-transform: uppercase; opacity: .65; }
.libro .indice--minimalista .indice__rotulo::after, .libro .indice--tarjetas .indice__rotulo::after { content: none; }
.libro .indice--tarjetas .indice__fila--1 { align-items: center; padding: .6em .8em; margin: 0 0 .45em; border-radius: .45em; background: ${suave}; }
.libro .indice--tarjetas .indice__fila--2 + .indice__fila--1 { margin-top: .45em; }
.libro .indice--tarjetas .indice__fila--2 { padding-left: 2em; margin: 0 0 .35em; }
.libro .indice--tarjetas .indice__rotulo { display: block; font-size: .72em; letter-spacing: .08em; opacity: .7; }
.libro .indice--columnas { columns: 2; column-gap: 7mm; column-fill: auto; height: ${Math.max(0, p.alto - 2)}px; }
.libro .indice--columnas .indice__titulo, .libro .indice--columnas .indice__imagen { column-span: all; }
.libro .indice--tabla .indice__fila { margin: 0; padding: .42em 0; border-bottom: .5pt solid ${raya}; }
.libro .indice--tabla .indice__fila--2 + .indice__fila--1 { margin-top: 0; }
.libro .indice--tabla .indice__fila--2 { padding-left: 2.1em; }
.libro .indice--tabla .indice__orden { font-weight: 700; }
.libro .indice--linea .indice__fila { position: relative; margin: 0; padding: .45em 0 .45em 2.2em; }
.libro .indice--linea.indice--orden .indice__fila { padding-left: 2.7em; }
.libro .indice--linea .indice__fila--2 + .indice__fila--1 { margin-top: 0; }
.libro .indice--linea .indice__fila--2 { font-size: 1em; padding-left: 3em; }
.libro .indice--linea.indice--orden .indice__fila--2 { padding-left: 3.4em; }
.libro .indice--linea .indice__fila--2 > * { font-size: .92em; }
.libro .indice--linea .indice__fila::before { content: ""; position: absolute; left: .85em; top: 0; bottom: 0; border-left: 1.2pt solid var(--hoja-tinta); transform: translateX(-50%); }
.libro .indice--linea .indice__fila:first-of-type::before { top: ${centro}; }
.libro .indice--linea .indice__fila:last-of-type::before { bottom: auto; height: ${centro}; }
.libro .indice--linea .indice__fila:only-of-type::before { content: none; }
.libro .indice--linea .indice__fila::after { content: ""; position: absolute; left: .85em; top: ${centro}; width: .8em; height: .8em; box-sizing: border-box; transform: translate(-50%, -50%); border-radius: 50%; background: var(--hoja-papel); border: 1.2pt solid var(--hoja-tinta); }
.libro .indice--linea .indice__fila--2::after { width: .42em; height: .42em; background: var(--hoja-tinta); border: 0; }
.libro .indice--linea .indice__orden { position: absolute; left: .85em; top: ${centro}; transform: translate(-50%, -50%); z-index: 1; min-width: 1.7em; height: 1.7em; padding: 0 .3em; box-sizing: border-box; border-radius: .85em; display: flex; align-items: center; justify-content: center; background: var(--hoja-tinta); color: var(--hoja-papel); }
.libro .indice--linea .indice__orden:empty { display: none; }
.libro .indice--linea .indice__fila--1:has(.indice__orden:not(:empty))::after { content: none; }`;
}

const cssBaseDe = (letra, b, capital, conCapital, cita, hilo) => `.libro, .libro .capitulo, .libro .pag-libre, .libro .hoja { color: ${letra}; }
.libro { font: ${b.tamanoPt}pt/${b.interlinea} ${familiaCss(b.fuente)}; font-variant-ligatures: none; font-feature-settings: "liga" 0; }
.libro p, .libro h1, .libro h2, .libro h3 { white-space: break-spaces; overflow-wrap: break-word; -webkit-line-break: after-white-space; }
.libro p { margin: 0 0 .7em; orphans: 2; widows: 2; }
.libro h1 { font-size: 1.9em; line-height: 1.2; margin: 0 0 .9em; break-after: avoid; }
.libro h2 { font-size: 1.45em; line-height: 1.25; margin: 1em 0 .5em; break-after: avoid; }
.libro h3 { font-size: 1.2em; line-height: 1.3; margin: 1em 0 .4em; break-after: avoid; }
.libro .capital::first-letter { ${capital} }
.libro .capital { box-sizing: content-box; ${conCapital} }
.libro .imagen { margin: 1em 0; break-inside: avoid; }
.libro .imagen img { display: block; max-width: 100%; height: auto; }
.libro .imagen--izq { float: left; margin: .3em 1em .5em 0; }
.libro .imagen--der { float: right; margin: .3em 0 .5em 1em; }
.libro .imagen--linea img { margin: 0 auto; }
.libro .imagen figcaption { font-size: .85em; margin-top: .4em; }
.libro .columnas { display: grid; gap: 6mm; margin: 1em 0; break-inside: avoid; }
.libro .columna > :first-child { margin-top: 0; }
.libro blockquote { ${cita} }
.libro .pasaje { margin: 1.7em 0; padding: .95em 0 .85em; border-top: .75pt solid ${hilo}; border-bottom: .75pt solid ${hilo}; text-align: center; break-inside: avoid; }
.libro .pasaje blockquote { margin: 0; font: 2em/1.3 ${familiaCss('Estonia')}; font-style: normal; white-space: pre-line; overflow-wrap: break-word; font-variant-ligatures: normal; font-feature-settings: normal; }
.libro .pasaje figcaption { margin-top: .8em; font: .74em/1.3 ${familiaCss('Young Serif')}; font-style: normal; letter-spacing: .07em; color: color-mix(in srgb, var(--hoja-tinta) 68%, var(--hoja-papel)); }
.libro .pasaje--hebreo blockquote { font: 1.25em/1.55 ${familiaCss(FUENTE_HEBREO)}; }
.libro hr { border: 0; border-top: 1px solid #888; margin: 1.4em 0; }
.libro ul, .libro ol { margin: 0 0 .7em; padding-left: 1.4em; }
.libro a { color: var(--hoja-enlace); }
.libro .indice__titulo { margin: 0 0 .8em; }
.libro .indice__fila { display: flex; align-items: baseline; gap: .4em; color: inherit; text-decoration: none; margin: 0 0 .3em; break-inside: avoid; }
.libro .indice__fila--2 { padding-left: 1.3em; font-size: .92em; }
.libro .indice__fila--2 + .indice__fila--1 { margin-top: .7em; }
.libro .indice--cap-negrita .indice__fila--1, .libro .indice--sub-negrita .indice__fila--2 { font-weight: 700; }
.libro .indice__texto { min-width: 0; }
.libro .indice__rotulo:not(:last-child)::after { content: " · "; }
.libro .indice__puntos { flex: 1 1 auto; min-width: 1.5em; border-bottom: .12em dotted currentColor; opacity: .45; }
.libro .indice__num { flex: none; margin-left: auto; font-variant-numeric: tabular-nums; }
.libro .boton { box-sizing: border-box; display: block; width: fit-content; max-width: 100%; margin: .8em 0; padding: .5em 1.2em; border-radius: .45em; background: var(--hoja-tinta); color: var(--hoja-papel); font-size: .95em; line-height: 1.3; text-align: center; text-decoration: none; overflow-wrap: anywhere; break-inside: avoid; }
.libro .boton--centro { margin-left: auto; margin-right: auto; }
.libro .boton--derecha { margin-left: auto; }
.libro .obj--boton { display: flex; align-items: center; justify-content: center; max-width: none; margin: 0; padding: .2em .6em; }
.libro .boton--icono { display: flex; align-items: center; justify-content: center; gap: .45em; }
.libro .boton__icono { width: 1.15em; height: 1.15em; flex: none; overflow: hidden; }
.libro .boton--solo { padding-left: .75em; padding-right: .75em; }
.libro .boton--solo:not(.obj) { position: relative; }
.libro .boton--solo .boton__texto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.libro .boton--hueco { background-color: transparent; color: var(--hoja-tinta); }
.libro .boton--duo { font-weight: 700; }
.libro .boton-suelto { position: relative; height: 0; margin: 0; padding: 0; break-inside: avoid; }
.libro .boton-suelto > .boton--suelta { position: absolute; left: 0; top: 0; margin: 0; width: max-content; max-width: 100%; }`;

/* Para imprenta: el papel crece 9 pt (3,2 mm) por lado, y la caja del texto se queda donde estaba */
const SANGRE_PT = 9, SANGRE_PX = 12;

const fijas = (v) => Object.entries(variablesDe(v)).map(([k, x]) => `${k}: ${x};`).join(' ');
const nombre = (color) => color.slice(1);

function cssImpresion(config, usados) {
  const c = new ConfigPagina(config), p = c.enPixeles(), b = c.cuerpo, tono = tonosDe(c.papel), cab = c.cabeza;
  const s = c.imprenta ? SANGRE_PX : 0, sPt = c.imprenta ? SANGRE_PT : 0;
  const tintaNumero = colorDeLetra(c, b.fuente) || tono.tinta;
  const numero = (lugar) => (c.numeros.ver ? `@bottom-${lugar} { content: counter(page); font: 9pt ${familiaCss(b.fuente)}; color: ${tintaNumero}; }` : '');
  const color3 = (x) => ['left', 'center', 'right'].map((l) => `@bottom-${l} { color: ${x}; }`).join(' ');
  /* Cada papel es una pagina con nombre: asi el color llega al borde, tambien por fuera del margen */
  const deCapitulos = [...usados.capitulos].map((x) => `@page cap-${nombre(x)} { background: ${x}; ${colorDeLetra(c, b.fuente) ? '' : color3(tonosDe(x).tinta)} }
.capitulo.papel-${nombre(x)} { page: cap-${nombre(x)}; ${fijas(x)} }`).join('\n');
  const deLibres = [...usados.libres].map((x) => `@page libre-${nombre(x)} { margin: 0; background: ${x}; @bottom-center { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }
.pag-libre.papel-${nombre(x)} { page: libre-${nombre(x)}; background: ${x}; ${fijas(x)} }`).join('\n');
  /* El lado sale de la misma tabla que usa la mesa: pagina 2 = izquierda, pagina 1 = derecha */
  const lado = { izq: 'left', centro: 'center', der: 'right' }, l = c.numeros.lugar;
  const reglas = l === 'pie-centro' ? `@page { ${numero('center')} }`
    : l === 'pie-izquierda' || l === 'pie-derecha' ? `@page { ${numero(lado[ladoDelNumero(l, 1)])} }`
      : `@page :left { ${numero(lado[ladoDelNumero(l, 2)])} } @page :right { ${numero(lado[ladoDelNumero(l, 1)])} }`;
  /* Las paginas de texto de la portada no llevan numero, pero cuentan. Con su papel, la pagina con nombre lo lleva. */
  const sinNumero = '@bottom-center { content: none; } @bottom-left { content: none; } @bottom-right { content: none; }';
  const dePortada = usados.portada === undefined ? ''
    : usados.portada ? `\n@page portada-${nombre(usados.portada)} { background: ${usados.portada}; ${sinNumero} }
.capitulo.capitulo--portada.papel-${nombre(usados.portada)} { page: portada-${nombre(usados.portada)}; }`
      : `\n@page portada { ${sinNumero} }
.capitulo.capitulo--portada { page: portada; }`;
  /* EL ENCABEZADO. Chrome no cambia el texto de un margen a mitad de hoja: cada texto distinto es una pagina con nombre
     (cab-N), y lo que sigue a una subetapa va en su propia parte (la subetapa siempre abre hoja). La distancia es la
     del borde de arriba de la hoja (con la sangre de imprenta incluida); el renglon mide lo mismo que en la mesa. */
  const arribaPx = Math.round(((cab.distanciaMm / 25.4) * 96 + s) * 100) / 100;
  const deCabezas = [...usados.cabezas.values()].map(({ nombre: n, papel, texto }) => {
    const tinta = colorDeLetra(c, b.fuente) || (papel ? tonosDe(papel).tinta : tono.tinta);
    const fondo = papel ? `background: ${papel}; ${colorDeLetra(c, b.fuente) ? '' : color3(tonosDe(papel).tinta)} ` : '';
    const arriba = texto ? `@top-center { content: ${cadenaCss(texto)}; font: ${cab.tamanoPt}pt/${CABEZA_INTERLINEA} ${familiaCss(b.fuente)}; color: ${tinta}; text-align: center; vertical-align: top; padding-top: ${arribaPx}px; white-space: nowrap; overflow: hidden; }` : '';
    return `@page ${n} { ${fondo}${arriba} }\n.capitulo.${n}, .cabeza-parte.${n} { page: ${n}; }`;
  }).join('\n');
  const conCabezas = deCabezas ? `\n.capitulo.cabeza-envuelta { page: auto; }\n${deCabezas}` : '';
  return `@page { size: ${p.anchoPt + sPt * 2}pt ${p.altoPt + sPt * 2}pt; margin: ${p.mt + s}px ${p.mrImpresion + s}px ${p.mbImpresion + s}px ${p.ml + s}px; background: ${tono.papel}; }
${reglas}
html, body { margin: 0; background: transparent; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.libro { width: ${p.ancho}px; ${fijas(tono.papel)} }
.capitulo { break-before: page; }
.capitulo:first-child { break-before: auto; }
.indice { break-before: page; break-after: page; }
.libro > .indice:first-child { break-before: auto; }
.pag-libre { break-before: page; position: relative; overflow: hidden; width: ${p.anchoPt + sPt * 2}pt; height: ${p.altoPt + sPt * 2}pt; }
.pag-libre__caja { position: absolute; inset: ${sPt}pt; }
.pag-libre__fondo { position: absolute; inset: 0; width: 100%; height: 100%; }
.pag-libre__fondo--contener { object-fit: contain; } .pag-libre__fondo--cubrir { object-fit: cover; }
.pag-libre .obj { position: absolute; box-sizing: border-box; }
.obj--imagen { overflow: hidden; } .obj--imagen img { position: absolute; max-width: none; }
.obj--texto { white-space: pre-wrap; overflow-wrap: anywhere; padding: 4px; font-family: ${familiaCss(b.fuente)}; line-height: 1.3; }
${deCapitulos}
${deLibres}${dePortada}${conCabezas}
.subetapa { break-before: page; }
.pag-libre.pag-libre--pdf { --hoja-tinta: ${TINTA_SOBRE_PDF}; }
${cssLibro(config)}`;
}

const CABEZAS_MAX = 400;
/* La pagina con nombre de un encabezado: una por papel y texto. Sin texto ni papel propio no hace falta ninguna. */
function paginaDeCabeza(usados, papel, texto) {
  if (!papel && !texto) return null;
  const llave = `${papel}|${texto}`;
  /* Un libro normal usa unas pocas; pasado el tope, el resto comparte la ultima (mejor un encabezado repetido que
     miles de reglas) */
  if (!usados.cabezas.has(llave)) {
    if (usados.cabezas.size >= CABEZAS_MAX) return `cab-${CABEZAS_MAX}`;
    usados.cabezas.set(llave, { nombre: `cab-${usados.cabezas.size + 1}`, papel, texto });
  }
  return usados.cabezas.get(llave).nombre;
}

/* El texto de una franja de subetapa ya armada (su unico hijo de texto) */
const textoDeFranja = (n) => (n.hijos[0] && typeof n.hijos[0].texto === 'string' ? n.hijos[0].texto : '');

/* Lo que va en un capitulo para que sus hojas lleven su encabezado. Sin subetapas, el capitulo entero es de una pagina
   con nombre. Con ellas, cada parte (desde una subetapa hasta la siguiente) va envuelta y es de la suya: asi el texto
   del margen cambia justo donde empieza la hoja de la subetapa. Devuelve { clase, hijos } o null si no hace falta nada. */
function conCabeza(hijos, ctx, partes, papel, usados) {
  const esSub = (n) => n.clase === 'subetapa';
  const pagina = (sub) => paginaDeCabeza(usados, papel, textoDeCabeza(ctx, sub, partes));
  if (!hijos.some(esSub)) {
    const n = pagina(ctx.inicial);
    return n ? { clase: ` ${n}`, hijos } : null;
  }
  const trozos = [];
  let actual = { sub: ctx.inicial, nodos: [] };
  for (const n of hijos) {
    if (esSub(n)) { if (actual.nodos.length) trozos.push(actual); actual = { sub: textoDeFranja(n), nodos: [n] }; } else actual.nodos.push(n);
  }
  if (actual.nodos.length) trozos.push(actual);
  return { clase: ' cabeza-envuelta', hijos: trozos.map((t) => { const n = pagina(t.sub); return el('div', `cabeza-parte${n ? ` ${n}` : ''}`, t.nodos); }) };
}

/* Lo que el contenido necesita de cada capitulo: igual que lo arma la mesa (Mesa.capitulosParaIndice) */
export const capitulosParaIndice = (capitulos) => capitulos.map((c, i) => {
  const x = objeto(c.contenido);
  const { titulo, ...propios } = propiosDe(x);
  return { id: c.id || '', ancla: `cap-${i + 1}`, ...propios, titulo: c.titulo || '', tituloPropio: titulo, doc: objeto(x.doc) };
});

/* `capitulos` ya en orden. `o`: { imagenes: {ruta: data:…}, indice: { numeros: {ancla: pagina}, reparto: [filas por hoja] } }.
   Los numeros y el reparto los mide la mesa; las filas salen de los capitulos mismos, con la misma regla. */
export function aHoja(obra, capitulos, o = {}) {
  const config = new ConfigPagina(obra.pagina), ind = config.indice;
  const caps = capitulosParaIndice(capitulos), portada = hayPortada(caps, config.portada);
  const entradas = ind.ver && o.indice ? entradasDe(caps, { subtemas: ind.subtemas, portada, rotulo: config.rotulo, idioma: obra.idioma, minis: conMinis(ind), verRol: ind.verRol }) : [];
  const indice = entradas.length ? hojasDeIndice(entradas, o.indice.numeros, o.indice.reparto, opcionesDeIndice(ind, obra.idioma, objeto(o.imagenes))) : [];
  const nodos = [];
  const usados = { capitulos: new Set(), libres: new Set(), cabezas: new Map() };
  const contextos = config.cabeza.ver ? contextosDeCabeza(caps, { rotulo: config.rotulo, idioma: obra.idioma, portada }) : null;
  const antes = lugarDelIndice(caps, ind, portada);
  capitulos.forEach((c, i) => {
    if (i === antes) nodos.push(...indice);
    const propio = colorValido(objeto(c.contenido).papel);
    if (propio) usados.capitulos.add(propio);
    const hijos = aNodos(c.contenido, 'pdf', { ...o, papelCapitulo: propio || config.papel || PAPEL_BASE, papelesLibres: usados.libres });
    const esPortada = portada && i === 0;
    if (esPortada) usados.portada = propio || '';
    /* El encabezado de sus hojas de texto (nunca el de la portada) */
    const cabeza = contextos && !esPortada ? conCabeza(hijos, contextos[i], config.cabeza.partes, propio, usados) : null;
    nodos.push(el('section', `capitulo${esPortada ? ' capitulo--portada' : ''}${propio ? ` papel-${nombre(propio)}` : ''}${cabeza ? cabeza.clase : ''}`, cabeza ? cabeza.hijos : hijos, { id: `cap-${i + 1}` }));
  });
  if (antes >= capitulos.length) nodos.push(...indice);
  const libro = el('div', 'libro', nodos);
  /* El hebreo de un pasaje necesita su letra, aunque el libro no la tenga en su lista */
  const fuentes = [...(obra.fuentes || [])];
  if (tieneClase(libro, 'pasaje--hebreo') && !fuentes.includes(FUENTE_HEBREO)) fuentes.push(FUENTE_HEBREO);
  return { css: cssImpresion(config, usados), nodos: [libro], fuentes, titulo: obra.titulo || '', idioma: obra.idioma || 'es' };
}
