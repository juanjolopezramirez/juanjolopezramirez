/* La parte de EDITOR de una pagina libre. Es un bloque atomico: lo de adentro lo maneja HojaLibre.js.
   Sus datos viajan en el HTML para que cortar y pegar dentro del libro no pierda la pagina. */
import { Node } from '@tiptap/core';
import { HojaLibre } from '../HojaLibre.js';

const ATRIBUTOS = { nombre: '', fondo: '', pdf: '', anchoMm: 0, altoMm: 0, ajuste: 'contener', texto: '', alt: '', caja: null, sangre: false, papel: '', objetos: [], titulo: '', ancla: '' };

export const PaginaLibre = Node.create({
  name: 'paginaLibre',
  group: 'block',
  atom: true,
  selectable: false,
  addOptions() { return { mesa: null }; },
  addAttributes() { return Object.fromEntries(Object.entries(ATRIBUTOS).map(([k, v]) => [k, { default: v }])); },
  parseHTML() {
    return [{ tag: 'div[data-pagina-libre]', getAttrs: (e) => {
      try { return JSON.parse(e.getAttribute('data-pagina-libre')); } catch (x) { return false; }
    } }];
  },
  renderHTML({ node }) { return ['div', { 'data-pagina-libre': JSON.stringify(node.attrs) }]; },
  addNodeView() {
    const { mesa } = this.options;
    return ({ node, getPos, editor }) => new HojaLibre({ node, getPos, editor, mesa });
  }
});
