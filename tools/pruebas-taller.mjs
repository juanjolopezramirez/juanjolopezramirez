/* LOS CASOS DE CADA TIPO DE BLOQUE: uno bueno y uno hostil. Todo tipo tiene que tener los dos, o
   tools/revisar-tipos-taller.mjs para la compilacion. Un caso `hostil` tiene que salir limpio. */
export const CASOS = {
  parrafo: {
    bueno: [{ type: 'paragraph', attrs: { capital: true, alinear: 'centro' }, content: [{ type: 'text', text: 'Hola' }] }],
    hostil: [{ type: 'paragraph', attrs: { onclick: 'x', alinear: 'url(x)' }, content: [{ type: 'text', text: '<script>', marks: [{ type: 'link', attrs: { href: 'javascript:x' } }] }] }]
  },
  titulo: {
    bueno: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'T' }] }],
    hostil: [{ type: 'heading', attrs: { level: 99 }, content: [{ type: 'text', text: 'T' }] }]
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
    bueno: [{ type: 'paginaLibre', attrs: { fondo: 'taller/o/p/1.webp', objetos: [
      { id: 'o-abcd1234', tipo: 'imagen', ruta: 'taller/o/i.webp', x: 10, y: 10, w: 40, h: 30, rot: 12, crop: { l: .1, t: 0, r: .2, b: 0 } },
      { id: 'o-abcd1235', tipo: 'texto', texto: 'Hola', x: 5, y: 5, w: 50, h: 10, tam: '14pt', color: '#123456' },
      { id: 'o-abcd1236', tipo: 'zona', nombre: 'Quiz', x: 5, y: 60, w: 50, h: 20 },
      { id: 'o-abcd1237', tipo: 'boton', texto: 'Copiar', accion: 'copiar', copia: 'Hola', x: 5, y: 80, w: 40, h: 7, fondo: '#123456' }
    ] } }],
    hostil: [{ type: 'paginaLibre', attrs: { fondo: 'https://malo.com/x.png', objetos: [
      { tipo: 'imagen', ruta: 'javascript:x', x: 'a', crop: { l: 9 } }, { tipo: 'script', texto: '<x>' },
      { tipo: 'texto', texto: '<script>', tam: '1pt;x', color: 'red;x:url(y)', fuente: 'x");}' },
      { tipo: 'boton', texto: '<b>', accion: 'x', enlace: 'javascript:alert(1)', copia: 5, fondo: 'url(x)' }
    ] } }]
  },
  boton: {
    bueno: [{ type: 'boton', attrs: { texto: 'Abrir', accion: 'enlace', enlace: 'https://fraterni.co/x', alinear: 'centro', fondo: '#123456' } }, { type: 'boton', attrs: { texto: 'Copiar', accion: 'copiar', copia: 'Un prompt' } }],
    hostil: [{ type: 'boton', attrs: { texto: 5, accion: 'borrar', enlace: 'javascript:alert(1)', copia: {}, fondo: 'red;x:url(y)', color: 7, alinear: 'url(x)', onclick: 'x' } }]
  },
  pasaje: {
    bueno: [{ type: 'pasaje', attrs: { texto: 'Porque de tal manera amó Dios al mundo,\nque ha dado a su Hijo unigénito', referencia: 'Juan 3:16' } }, { type: 'pasaje', attrs: { texto: 'שְׁמַע יִשְׂרָאֵל', referencia: 'Deuteronomio 6:4' } }],
    hostil: [{ type: 'pasaje', attrs: { texto: '<script>alert(1)</script>‮abc', referencia: { x: 1 }, onclick: 'x', dir: 'url(x)' } }]
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
