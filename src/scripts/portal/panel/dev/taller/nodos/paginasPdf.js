/* La parte de EDITOR de un PDF de diseño: en el texto solo hay una marca con el id de la pieza.
   `pintar` llena la caja con sus paginas y se vuelve a llamar cada vez que llega una, asi se ven
   apenas se suben. */
import { Node } from '@tiptap/core';

export const PaginasPdf = Node.create({
  name: 'paginasPdf',
  group: 'block',
  atom: true,
  draggable: true,
  addOptions() { return { pintar: () => () => {} }; },
  addAttributes() { return { pieza: { default: '' } }; },
  parseHTML() { return [{ tag: 'div[data-paginas-pdf]', getAttrs: (e) => ({ pieza: e.getAttribute('data-paginas-pdf') }) }]; },
  renderHTML({ node }) { return ['div', { 'data-paginas-pdf': node.attrs.pieza }]; },
  addNodeView() {
    const { pintar } = this.options;
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.className = 'tal-pieza';
      dom.contentEditable = 'false';
      const soltar = pintar(node.attrs.pieza, dom);
      return { dom, destroy: () => soltar && soltar(), stopEvent: (e) => e.target instanceof HTMLElement && !!e.target.closest('button'), ignoreMutation: () => true };
    };
  }
});
