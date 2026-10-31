/* DEL LIBRO A LA HOJA: lo que la vista de paginas (/taller-hoja/) pinta y lo que se imprime.

   `aHoja` es PURA, para probarla en Node: devuelve el estilo y un arbol neutro, y la pagina de la
   vista lo convierte en elementos uno por uno. Todo numero que entra al estilo ya paso por
   ConfigPagina, y toda fuente por fuentes.js, asi que aqui no llega nada escrito por nadie. */
import { ConfigPagina } from './ConfigPagina.js';
import { familiaCss } from './fuentes.js';
import { aNodos } from './TextoLibro.js';
import { el, txt } from './tipos/ayuda.js';

/* Lo unico que el arbol puede pedir. La pagina de la vista vuelve a mirar estas listas. */
export const ETIQUETAS_HOJA = new Set(['section', 'nav', 'div', 'figure', 'figcaption', 'img', 'p', 'h1', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'blockquote', 'hr', 'br', 'a', 'span', 'strong', 'em', 'u', 's']);
export const ATRIBUTOS_HOJA = new Set(['src', 'alt', 'href', 'id', 'start']);
export const ESTILOS_HOJA = new Set(['color', 'font-size', 'font-family', 'text-align', 'width', 'grid-template-columns']);

function css(config, fuentes) {
  const c = new ConfigPagina(config), m = c.margenes, b = c.cuerpo;
  const numero = (lugar) => (c.numeros.ver ? `@bottom-${lugar} { content: counter(page); font: 9pt ${familiaCss(b.fuente)}; }` : '');
  const reglas = c.numeros.lugar === 'pie-centro'
    ? `@page { ${numero('center')} }`
    : (() => {
      const izq = c.numeros.lugar === 'pie-exterior' ? 'left' : 'right', der = izq === 'left' ? 'right' : 'left';
      return `@page :left { ${numero(izq)} } @page :right { ${numero(der)} }`;
    })();
  return `@page { size: ${c.anchoMm}mm ${c.altoMm}mm; margin: ${m.sup}mm ${m.der}mm ${m.inf}mm ${m.izq}mm; }
${reglas}
@page disenada { margin: 0; @bottom-center { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }
html, body { margin: 0; background: #fff; color: #111; }
.libro { font: ${b.tamanoPt}pt/${b.interlinea} ${familiaCss(b.fuente)}; }
.libro p { margin: 0 0 .55em; }
.libro h1 { font-size: 1.9em; line-height: 1.2; margin: 0 0 1em; }
.libro h2 { font-size: 1.45em; line-height: 1.25; margin: 1.1em 0 .5em; }
.libro h3 { font-size: 1.2em; line-height: 1.3; margin: 1em 0 .4em; }
.libro h4 { font-size: 1.05em; line-height: 1.3; margin: 1em 0 .4em; }
.libro h1, .libro h2, .libro h3, .libro h4 { break-after: avoid; }
.capitulo { break-before: page; }
.indice { break-after: page; } .indice h1 { margin-bottom: .8em; }
.indice a { display: block; color: inherit; text-decoration: none; margin-bottom: .3em; }
.indice a::after { content: target-counter(attr(href), page); float: right; }
.capital::first-letter { initial-letter: 3; font-weight: 700; margin-right: .06em; }
.capital[data-split-from]::first-letter { initial-letter: normal; font-weight: inherit; margin-right: 0; }
.imagen { margin: 1em 0; break-inside: avoid; } .imagen img { max-width: 100%; height: auto; } .imagen figcaption { font-size: .85em; margin-top: .4em; }
.columnas { display: grid; gap: 6mm; margin: 1em 0; break-inside: avoid; }
.columna > :first-child { margin-top: 0; }
blockquote { margin: 1em 1.2em; font-style: italic; }
hr { border: 0; border-top: 1px solid #888; margin: 1.4em 0; }
.pieza { display: contents; }
.pag-disenada { page: disenada; break-before: page; break-after: page; width: ${c.anchoMm}mm; height: ${c.altoMm}mm; overflow: hidden; }
.pag-disenada img { display: block; width: 100%; height: 100%; }
.pag-disenada--contener img { object-fit: contain; } .pag-disenada--cubrir img { object-fit: cover; }`;
}

/* `capitulos` ya en orden. `o`: { piezas: {id: datos}, imagenes: {ruta: data:…} } */
export function aHoja(obra, capitulos, o = {}) {
  const config = new ConfigPagina(obra.pagina);
  const con = capitulos.map((c, i) => ({ id: `cap-${i + 1}`, titulo: c.titulo, cuerpo: aNodos(c.contenido, 'pdf', o) }));
  const nodos = [];
  if (config.indice) {
    nodos.push(el('nav', 'indice', [el('h1', '', [txt('Contenido')]),
      ...con.filter((c) => c.titulo).map((c) => el('a', '', [txt(c.titulo)], { href: `#${c.id}` }))]));
  }
  for (const c of con) nodos.push(el('section', 'capitulo', [...(c.titulo ? [el('h1', '', [txt(c.titulo)], { id: c.id })] : []), ...c.cuerpo]));
  return { css: css(config, obra.fuentes), nodos: [el('div', 'libro', nodos)], fuentes: obra.fuentes || [], titulo: obra.titulo || '', idioma: obra.idioma || 'es' };
}
