/* LOS CASOS DE CADA TIPO DE BLOQUE: uno bueno y uno hostil. Todo tipo tiene que tener los dos, o
   tools/revisar-tipos-taller.mjs para la compilacion. Un caso `hostil` tiene que salir limpio. */
export const CASOS = {
  parrafo: {
    bueno: [{ type: 'paragraph', attrs: { capital: true, alinear: 'centro' }, content: [{ type: 'text', text: 'Hola' }] }],
    hostil: [{ type: 'paragraph', attrs: { onclick: 'x', alinear: 'url(x)' }, content: [{ type: 'text', text: '<script>', marks: [{ type: 'link', attrs: { href: 'javascript:x' } }] }] }]
  },
  titulo: {
    bueno: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'T' }] }, { type: 'heading', attrs: { level: 2, id: 't-0a1b2c3d' }, content: [{ type: 'text', text: 'Con ancla' }] }],
    hostil: [{ type: 'heading', attrs: { level: 99 }, content: [{ type: 'text', text: 'T' }] }, { type: 'heading', attrs: { level: 1, id: '"><script>' }, content: [{ type: 'text', text: 'T' }] }]
  },
  lista: {
    bueno: [{ type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }] }] }],
    hostil: [{ type: 'orderedList', attrs: { start: 'x' }, content: [{ type: 'listItem' }] }]
  },
  cita: {
    bueno: [{ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }] }],
    hostil: [{ type: 'blockquote', attrs: { cite: 'javascript:x' } }]
  },
  separador: { bueno: [{ type: 'horizontalRule' }], hostil: [{ type: 'horizontalRule', attrs: { style: 'x' } }] },
  imagen: {
    bueno: [{ type: 'imagen', attrs: { ruta: 'taller/o/img/a.webp', alt: 'A', anchoPct: 50 } }],
    hostil: [{ type: 'imagen', attrs: { ruta: 'https://malo.com/x.png', alt: '"><script>', anchoPct: 9999 } }]
  },
  columnas: {
    bueno: [{ type: 'columnas', attrs: { anchos: [1, 2] }, content: [{ type: 'columna', content: [{ type: 'paragraph' }] }, { type: 'columna', content: [{ type: 'paragraph' }] }] }],
    hostil: [{ type: 'columnas', attrs: { anchos: ['1fr;background:url(x)', 1e9] }, content: [] }]
  },
  paginaLibre: {
    bueno: [{ type: 'paginaLibre', attrs: { fondo: 'taller/o/p/2.webp', titulo: 'Portada del capítulo', ancla: 'p-00ff00aa', objetos: [] } },
      { type: 'paginaLibre', attrs: { fondo: 'taller/o/pdf/p0003-aa.webp', pdf: 'taller/o/pdf/original-aa.pdf', pdfPagina: 3, sobra: true, objetos: [] } },
      { type: 'paginaLibre', attrs: { fondo: 'taller/o/p/1.webp', objetos: [
      { id: 'o-abcd1234', tipo: 'imagen', ruta: 'taller/o/i.webp', x: 10, y: 10, w: 40, h: 30, rot: 12, crop: { l: .1, t: 0, r: .2, b: 0 } },
      { id: 'o-abcd1235', tipo: 'texto', texto: 'Hola', x: 5, y: 5, w: 50, h: 10, tam: '14pt', color: '#123456' },
      { id: 'o-abcd1236', tipo: 'zona', nombre: 'Quiz', x: 5, y: 60, w: 50, h: 20 },
      { id: 'o-abcd1237', tipo: 'boton', texto: 'Copiar', accion: 'copiar', copia: 'Hola', x: 5, y: 80, w: 40, h: 7, fondo: '#123456', aspecto: { estilo: 'contorno', borde: 3, sombra: { tipo: 'suave' } } }
    ] } }],
    hostil: [{ type: 'paginaLibre', attrs: { titulo: { x: 1 }, ancla: 'p-x" onload="y', objetos: [] } },
      { type: 'paginaLibre', attrs: { pdfPagina: { x: 1 }, sobra: '<script>', pdf: 'https://malo.com/x.pdf', objetos: [] } },
      { type: 'paginaLibre', attrs: { titulo: '<script>'.repeat(40), ancla: 'javascript:x' } },
      { type: 'paginaLibre', attrs: { fondo: 'https://malo.com/x.png', objetos: [
      { tipo: 'imagen', ruta: 'javascript:x', x: 'a', crop: { l: 9 } }, { tipo: 'script', texto: '<x>' },
      { tipo: 'texto', texto: '<script>', tam: '1pt;x', color: 'red;x:url(y)', fuente: 'x");}' },
      { tipo: 'boton', texto: '<b>', accion: 'x', enlace: 'javascript:alert(1)', copia: 5, fondo: 'url(x)' }
    ] } }]
  },
  boton: {
    bueno: [{ type: 'boton', attrs: { texto: 'Abrir', accion: 'enlace', enlace: 'https://fraterni.co/x', alinear: 'centro', fondo: '#123456', icono: { nombre: 'enlace' }, lado: 'der' } }, { type: 'boton', attrs: { texto: 'Copiar', accion: 'copiar', copia: 'Un prompt', icono: { nombre: 'copiar' }, lado: 'solo' } },
      { type: 'boton', attrs: { texto: 'Empezar', accion: 'enlace', enlace: 'https://fraterni.co/z', fondo: '#58cc02', color: '#ffffff', aspecto: { estilo: 'duolingo', borde: 2, bordeColor: '#112233', linea: 'punteado', radio: 8, negrita: true, opacidad: 80, sombra: { tipo: 'dura', auto: false, color: '#46a302' } }, suelto: { dx: 12.3, dy: -4, rot: 15 } } },
      { type: 'boton', attrs: { texto: 'Mio', accion: 'enlace', enlace: 'https://fraterni.co/y', icono: { propio: { caja: [0, 0, 24, 24], formas: [{ t: 'circle', cx: 12, cy: 12, r: 8, relleno: true }, { t: 'path', d: 'M4 4l16 16', trazo: 2, punta: 'round', union: 'round', transform: 'rotate(45 12 12)' }] } } } }],
    hostil: [{ type: 'boton', attrs: { texto: 'x', fondo: '#58cc02', aspecto: { estilo: 'url(x)', borde: 99999, bordeColor: 'red;x:url(y)', linea: '"><x', radio: '1e9;x', negrita: 'si', opacidad: -5, sombra: { tipo: 'url(x)', auto: 'x', color: 'expression(1)' }, onclick: 'x' }, suelto: { dx: 1e9, dy: '</style>', rot: Infinity } } },
      { type: 'boton', attrs: JSON.parse('{"texto":"x","aspecto":{"__proto__":{"estilo":"duolingo"},"sombra":{"__proto__":{"tipo":"dura"},"tipo":"dura","color":"#zzzzzz"}},"suelto":{"__proto__":{"dx":9},"rot":"9"}}') },
      { type: 'boton', attrs: { texto: 'x', aspecto: 'url(x)', suelto: [1, 2] } },
      { type: 'paginaLibre', attrs: { objetos: [{ tipo: 'boton', texto: 'x', aspecto: { estilo: 'duolingo', borde: 1e9, radio: -3, sombra: { tipo: 'dura', color: 'url(x)' } } }] } },
      { type: 'boton', attrs: { texto: 5, accion: 'borrar', enlace: 'javascript:alert(1)', copia: {}, fondo: 'red;x:url(y)', color: 7, alinear: 'url(x)', onclick: 'x', lado: 'url(x)', icono: { nombre: '__proto__' } } },
      { type: 'boton', attrs: { texto: 'x', icono: { propio: { caja: [0, 0, 'a', 24], formas: [{ t: 'circle', r: 1, relleno: true }] } } } },
      { type: 'boton', attrs: { texto: 'x', icono: { propio: { caja: [0, 0, 24, 24], formas: [
        { t: 'script', d: 'alert(1)' }, { t: 'image', href: 'javascript:alert(1)' }, { t: 'path', d: 'M0 0 url(javascript:x)', relleno: true },
        { t: 'path', d: 'M0 0L9 9', relleno: true, onload: 'alert(1)', transform: 'translate(0) url(x)', fill: 'url(#x)' }, { t: 'use', href: '#a' },
        { t: 'polygon', points: '0,0 1,1"><script>', relleno: true }, { t: 'rect', x: 'Infinity', y: 0, width: 1, height: 1, relleno: true }
      ] } } } }]
  },
  pasaje: {
    bueno: [{ type: 'pasaje', attrs: { texto: 'Porque de tal manera amó Dios al mundo,\nque ha dado a su Hijo unigénito', referencia: 'Juan 3:16' } }, { type: 'pasaje', attrs: { texto: 'שְׁמַע יִשְׂרָאֵל', referencia: 'Deuteronomio 6:4' } }],
    hostil: [{ type: 'pasaje', attrs: { texto: '<script>alert(1)</script>‮abc', referencia: { x: 1 }, onclick: 'x', dir: 'url(x)' } }]
  },
  subetapa: {
    bueno: [{ type: 'subetapa', attrs: { texto: 'Actividades' } }, { type: 'subetapa', attrs: { texto: 'Quiz' } }],
    hostil: [{ type: 'subetapa', attrs: { texto: '<script>alert(1)</script>'.repeat(5) + 'x'.repeat(100), onclick: 'x', dir: 'url(x)' } },
      { type: 'subetapa', attrs: { texto: { x: 1 } } },
      { type: 'columnas', attrs: { anchos: [1, 1] }, content: [{ type: 'columna', content: [{ type: 'subetapa', attrs: { texto: 'Dentro' } }] }, { type: 'columna', content: [{ type: 'paragraph' }] }] }]
  },
  formula: {
    bueno: [{ type: 'paragraph', content: [{ type: 'formula', attrs: { tex: '\\frac{a}{b}^2' } }] }, { type: 'formula', attrs: { tex: 'x^2' } }],
    hostil: [{ type: 'paragraph', content: [{ type: 'formula', attrs: { tex: '\\href{javascript:alert(1)}{x}\u0007', onclick: 'x' } }] }]
  },
  paginasPdf: {
    bueno: [{ type: 'paginasPdf', attrs: { pieza: 'p-1' } }],
    hostil: [{ type: 'paginasPdf', attrs: { pieza: '../../x' } }]
  }
};
