/* EL EDITOR DEL LIBRO. Es el unico archivo que trae Tiptap: va en el trozo del Taller, nunca
   llega a quien no lo abre.

   Lo propio del libro va como atributos de parrafo y de titulo (`capital`, `alinear`) y lo que se
   guarda pasa siempre por TextoLibro.js: el editor propone, la lista de permitidos decide. */
import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Color, FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style';
import { Llaves } from './Llaves.js';
import { limpiarPegado } from './pegado.js';
import { Imagen } from './nodos/imagen.js';
import { Columna, Columnas } from './nodos/columnas.js';
import { PaginasPdf } from './nodos/paginasPdf.js';

const MARGEN_BARRA_PX = 220;
const CSS_ALINEAR = { izquierda: 'left', centro: 'center', derecha: 'right', justificado: 'justify' };
const DE_CSS = Object.fromEntries(Object.entries(CSS_ALINEAR).map(([k, v]) => [v, k]));

const Formato = Extension.create({
  name: 'formatoLibro',
  addGlobalAttributes() {
    return [
      { types: ['paragraph', 'heading'], attributes: { alinear: {
        default: '',
        parseHTML: (e) => DE_CSS[e.style.textAlign] || '',
        renderHTML: (a) => (a.alinear ? { style: `text-align:${CSS_ALINEAR[a.alinear]}` } : {})
      } } },
      { types: ['paragraph'], attributes: { capital: {
        default: false,
        keepOnSplit: false,
        parseHTML: (e) => e.classList.contains('capital'),
        renderHTML: (a) => (a.capital ? { class: 'capital' } : {})
      } } }
    ];
  }
});

export function crearEditor(elemento, o) {
  return new Editor({
    element: elemento,
    content: o.contenido,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, code: false, codeBlock: false, link: { openOnClick: false, autolink: false, linkOnPaste: false } }),
      TextStyle, FontSize, FontFamily, Color, Formato, Llaves,
      Imagen.configure({ pintar: o.pintarImagen, tx: o.tx }),
      Columna, Columnas,
      PaginasPdf.configure({ pintar: o.pintarPieza })
    ],
    editorProps: {
      transformPastedHTML: limpiarPegado,
      attributes: { class: 'tal-texto', 'aria-label': o.tx.etiquetaEditor, 'aria-multiline': 'true', spellcheck: 'true', lang: o.idioma },
      /* Que el cursor nunca quede debajo de la barra, que se queda pegada arriba */
      scrollMargin: { top: MARGEN_BARRA_PX, bottom: 40, left: 0, right: 0 },
      scrollThreshold: { top: MARGEN_BARRA_PX, bottom: 40, left: 0, right: 0 },
      handleKeyDown: (_, e) => {
        if (e.altKey && e.key === 'F10') { e.preventDefault(); o.alBarra(); return true; }
        return false;
      }
    },
    onUpdate: () => o.alCambiar(),
    onSelectionUpdate: () => o.alMover(),
    onTransaction: () => o.alMover()
  });
}
