/* DEL LIBRO A LA HOJA: lo que se imprime. La pantalla y el PDF usan EL MISMO estilo del libro (`cssLibro`)
   y el mismo motor del navegador: por eso cada pagina empieza en la misma palabra en los dos lados
   (prueba de la Etapa 1: 65 paginas iguales). La caja del texto mide pixeles enteros; el margen de
   impresion absorbe la fraccion, asi la hoja sale exacta en milimetros.

   `aHoja` es PURA, para probarla en Node: devuelve el estilo y un arbol neutro, y la pagina /taller-hoja/
   lo convierte en elementos uno por uno. Todo numero que entra al estilo ya paso por ConfigPagina, y
   toda fuente por fuentes.js, asi que aqui no llega nada escrito por nadie. */
import { colorDeLetra, ConfigPagina } from './ConfigPagina.js';
import { familiaCss } from './fuentes.js';
import { aNodos } from './TextoLibro.js';
import { colorValido } from './marcas.js';
import { PAPEL_BASE, TINTA_SOBRE_PDF, tonosDe, variablesDe } from './colores.js';
import { objeto } from '../comun.js';
import { el, txt } from './tipos/ayuda.js';
import { FUENTE_HEBREO } from './tipos/pasaje.js';
import { FORMAS } from './iconosBoton.js';

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
export const ESTILOS_HOJA = new Set(['color', 'background-color', 'font-size', 'font-family', 'text-align', 'width', 'height', 'left', 'top', 'transform', 'grid-template-columns']);

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
  return `.libro, .libro .capitulo, .libro .pag-libre, .libro .hoja { color: ${letra}; }
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
.libro .indice a { color: inherit; }
.libro .boton { box-sizing: border-box; display: block; width: fit-content; max-width: 100%; margin: .8em 0; padding: .5em 1.2em; border-radius: .45em; background: var(--hoja-tinta); color: var(--hoja-papel); font-size: .95em; line-height: 1.3; text-align: center; text-decoration: none; overflow-wrap: anywhere; break-inside: avoid; }
.libro .boton--centro { margin-left: auto; margin-right: auto; }
.libro .boton--derecha { margin-left: auto; }
.libro .obj--boton { display: flex; align-items: center; justify-content: center; max-width: none; margin: 0; padding: .2em .6em; }
.libro .boton--icono { display: flex; align-items: center; justify-content: center; gap: .45em; }
.libro .boton__icono { width: 1.15em; height: 1.15em; flex: none; overflow: hidden; }
.libro .boton--solo { padding-left: .75em; padding-right: .75em; }
.libro .boton--solo:not(.obj) { position: relative; }
.libro .boton--solo .boton__texto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
${porLetra}
${porTitulo}`;
}

/* Para imprenta: el papel crece 9 pt (3,2 mm) por lado, y la caja del texto se queda donde estaba */
const SANGRE_PT = 9, SANGRE_PX = 12;

const fijas = (v) => Object.entries(variablesDe(v)).map(([k, x]) => `${k}: ${x};`).join(' ');
const nombre = (color) => color.slice(1);

function cssImpresion(config, usados) {
  const c = new ConfigPagina(config), p = c.enPixeles(), b = c.cuerpo, tono = tonosDe(c.papel);
  const s = c.imprenta ? SANGRE_PX : 0, sPt = c.imprenta ? SANGRE_PT : 0;
  const tintaNumero = colorDeLetra(c, b.fuente) || tono.tinta;
  const numero = (lugar) => (c.numeros.ver ? `@bottom-${lugar} { content: counter(page); font: 9pt ${familiaCss(b.fuente)}; color: ${tintaNumero}; }` : '');
  const color3 = (x) => ['left', 'center', 'right'].map((l) => `@bottom-${l} { color: ${x}; }`).join(' ');
  /* Cada papel es una pagina con nombre: asi el color llega al borde, tambien por fuera del margen */
  const deCapitulos = [...usados.capitulos].map((x) => `@page cap-${nombre(x)} { background: ${x}; ${colorDeLetra(c, b.fuente) ? '' : color3(tonosDe(x).tinta)} }
.capitulo.papel-${nombre(x)} { page: cap-${nombre(x)}; ${fijas(x)} }`).join('\n');
  const deLibres = [...usados.libres].map((x) => `@page libre-${nombre(x)} { margin: 0; background: ${x}; @bottom-center { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }
.pag-libre.papel-${nombre(x)} { page: libre-${nombre(x)}; background: ${x}; ${fijas(x)} }`).join('\n');
  const izq = c.numeros.lugar === 'pie-exterior' ? 'left' : 'right', der = izq === 'left' ? 'right' : 'left';
  const reglas = c.numeros.lugar === 'pie-centro' ? `@page { ${numero('center')} }` : `@page :left { ${numero(izq)} } @page :right { ${numero(der)} }`;
  return `@page { size: ${p.anchoPt + sPt * 2}pt ${p.altoPt + sPt * 2}pt; margin: ${p.mt + s}px ${p.mrImpresion + s}px ${p.mbImpresion + s}px ${p.ml + s}px; background: ${tono.papel}; }
${reglas}
html, body { margin: 0; background: transparent; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.libro { width: ${p.ancho}px; ${fijas(tono.papel)} }
.capitulo { break-before: page; }
.capitulo:first-child { break-before: auto; }
.indice { break-after: page; } .indice h1 { margin-bottom: .8em; }
.indice a { display: flex; justify-content: space-between; gap: 1em; color: inherit; text-decoration: none; margin-bottom: .3em; }
.pag-libre { break-before: page; position: relative; overflow: hidden; width: ${p.anchoPt + sPt * 2}pt; height: ${p.altoPt + sPt * 2}pt; }
.pag-libre__caja { position: absolute; inset: ${sPt}pt; }
.pag-libre__fondo { position: absolute; inset: 0; width: 100%; height: 100%; }
.pag-libre__fondo--contener { object-fit: contain; } .pag-libre__fondo--cubrir { object-fit: cover; }
.pag-libre .obj { position: absolute; box-sizing: border-box; }
.obj--imagen { overflow: hidden; } .obj--imagen img { position: absolute; max-width: none; }
.obj--texto { white-space: pre-wrap; overflow-wrap: anywhere; padding: 4px; font-family: ${familiaCss(b.fuente)}; line-height: 1.3; }
${deCapitulos}
${deLibres}
.pag-libre.pag-libre--pdf { --hoja-tinta: ${TINTA_SOBRE_PDF}; }
${cssLibro(config)}`;
}

/* `capitulos` ya en orden. `o`: { imagenes: {ruta: data:…}, indice: [{ titulo, pagina }] } */
export function aHoja(obra, capitulos, o = {}) {
  const config = new ConfigPagina(obra.pagina);
  const nodos = [];
  if (config.indice && (o.indice || []).length) {
    nodos.push(el('nav', 'indice', [el('h1', '', [txt('Contenido')]),
      ...o.indice.map((f) => el('a', '', [el('span', '', [txt(f.titulo)]), el('span', '', [txt(String(f.pagina))])], { href: `#cap-${f.capitulo}` }))]));
  }
  const usados = { capitulos: new Set(), libres: new Set() };
  capitulos.forEach((c, i) => {
    const propio = colorValido(objeto(c.contenido).papel);
    if (propio) usados.capitulos.add(propio);
    const hijos = aNodos(c.contenido, 'pdf', { ...o, papelCapitulo: propio || config.papel || PAPEL_BASE, papelesLibres: usados.libres });
    nodos.push(el('section', `capitulo${propio ? ` papel-${nombre(propio)}` : ''}`, hijos, { id: `cap-${i + 1}` }));
  });
  const libro = el('div', 'libro', nodos);
  /* El hebreo de un pasaje necesita su letra, aunque el libro no la tenga en su lista */
  const fuentes = [...(obra.fuentes || [])];
  if (tieneClase(libro, 'pasaje--hebreo') && !fuentes.includes(FUENTE_HEBREO)) fuentes.push(FUENTE_HEBREO);
  return { css: cssImpresion(config, usados), nodos: [libro], fuentes, titulo: obra.titulo || '', idioma: obra.idioma || 'es' };
}
