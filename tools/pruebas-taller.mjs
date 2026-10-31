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
  paginasPdf: {
    bueno: [{ type: 'paginasPdf', attrs: { pieza: 'p-1' } }],
    hostil: [{ type: 'paginasPdf', attrs: { pieza: '../../x' } }]
  }
};
