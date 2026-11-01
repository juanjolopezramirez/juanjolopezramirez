/* EL EDITOR DE UN CAPITULO. Es el unico archivo que trae Tiptap: va en el trozo del Taller, nunca llega a
   quien no lo abre. Cada capitulo tiene el suyo.

   Lo propio del libro va como atributos de parrafo y de titulo (`capital`, `alinear`) y lo que se
   guarda pasa siempre por TextoLibro.js: el editor propone, la lista de permitidos decide. */
import { Editor, Extension } from '@tiptap/core';
import { Fragment, Slice } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { Color, FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Llaves } from './Llaves.js';
import { limpiarPegado } from './pegado.js';
import { Imagen } from './nodos/imagen.js';
import { Columna, Columnas } from './nodos/columnas.js';
import { PaginasPdf } from './nodos/paginasPdf.js';
import { PaginaLibre } from './nodos/paginaLibre.js';
import { Formula } from './nodos/formula.js';
import { Boton } from './nodos/boton.js';
import { POR_NODO } from '../../../../contenido/taller/tipos/indice.js';

const MARGEN_BARRA_PX = 80;
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

/* Lo pegado trae los datos que quiera, y un dibujo que falla deja el editor roto hasta recargar. Por eso
   las piezas sin texto adentro pasan por su lista de permitidos antes de dibujarse. */
function nodoLimpio(n) {
  const fila = POR_NODO.get(n.type.name);
  if (fila && fila.contiene === 'nada' && fila.datos) return n.type.create(fila.datos(n.type.name, n.attrs), null, n.marks);
  if (n.type.name === 'columnas') return n.type.create(fila.datos('columnas', n.attrs), fragmentoLimpio(n.content), n.marks);
  return n.isText || !n.content.size ? n : n.copy(fragmentoLimpio(n.content));
}
function fragmentoLimpio(f) {
  const hijos = [];
  f.forEach((n) => hijos.push(nodoLimpio(n)));
  return Fragment.fromArray(hijos);
}

export function crearEditor(elemento, o) {
  return new Editor({
    element: elemento,
    content: o.contenido,
    editable: o.editable,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, code: false, codeBlock: false, trailingNode: false, link: { openOnClick: false, autolink: false, linkOnPaste: false } }),
      TextStyle, FontSize, FontFamily, Color, Superscript, Subscript, Formato, Llaves,
      Imagen.configure({ mesa: o.mesa }),
      Columna, Columnas, PaginasPdf,
      PaginaLibre.configure({ mesa: o.mesa }),
      Formula.configure({ mesa: o.mesa }),
      Boton.configure({ mesa: o.mesa })
    ],
    editorProps: {
      transformPastedHTML: limpiarPegado,
      transformPasted: (s) => new Slice(fragmentoLimpio(s.content), s.openStart, s.openEnd),
      attributes: { class: 'libro flujo', 'aria-label': o.etiqueta, 'aria-multiline': 'true', spellcheck: 'true', lang: o.idioma },
      /* Que el cursor nunca quede pegado al borde de la mesa */
      scrollMargin: { top: MARGEN_BARRA_PX, bottom: 60, left: 0, right: 0 },
      scrollThreshold: { top: MARGEN_BARRA_PX, bottom: 60, left: 0, right: 0 },
      handleKeyDown: (vista, e) => {
        if (e.altKey && e.key === 'F10') { e.preventDefault(); o.alBarra(); return true; }
        /* Enter sobre una imagen, una formula o un boton hace lo mismo que el clic */
        const sel = vista.state.selection;
        if (e.key === 'Enter' && sel.node && ['imagen', 'formula', 'boton'].includes(sel.node.type.name)) { e.preventDefault(); vista.nodeDOM(sel.from).click(); return true; }
        return false;
      }
    },
    onUpdate: () => o.alCambiar(),
    onSelectionUpdate: () => o.alMover(),
    onFocus: () => o.alEnfocar()
  });
}
