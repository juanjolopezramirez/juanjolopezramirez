/* La parte de EDITOR de una subetapa: la franja, dibujada con el mismo arbol del PDF (tipos/subetapa.js). Siempre abre
   una hoja nueva (el estilo de la mesa corta la columna antes). Se elige con un clic y su nombre se escribe en el panel. */
import { Node } from '@tiptap/core';
import { cambiador } from './cambiar.js';
import { datos, franjaDeSubetapa } from '../../../../../contenido/taller/tipos/subetapa.js';

const ATRIBUTOS = { texto: '' };

export const Subetapa = Node.create({
  name: 'subetapa',
  group: 'block',
  atom: true,
  draggable: true,
  addOptions() { return { mesa: null }; },
  addAttributes() { return Object.fromEntries(Object.entries(ATRIBUTOS).map(([k, v]) => [k, { default: v }])); },
  parseHTML() {
    return [{ tag: 'div[data-subetapa]', getAttrs: (e) => {
      try { return JSON.parse(e.getAttribute('data-subetapa')); } catch (x) { return false; }
    } }];
  },
  renderHTML({ node }) { return ['div', { 'data-subetapa': JSON.stringify(node.attrs) }]; },
  addNodeView() {
    const { mesa } = this.options;
    return ({ node, getPos, editor }) => {
      const updateAttributes = cambiador(editor, getPos);
      /* La franja misma, sin caja alrededor: el mismo arbol que el PDF */
      const dom = document.createElement('div');
      dom.contentEditable = 'false';
      const poner = (n) => {
        const a = datos(null, n.attrs), franja = franjaDeSubetapa(a);
        dom.className = `${franja.clase} subetapa-ed${a.texto ? '' : ' subetapa--falta'}`;
        dom.dataset.texto = a.texto;
        dom.textContent = a.texto;
      };
      let actual = node;
      poner(node);
      const vista = { getPos, updateAttributes, get node() { return actual; }, dom };
      dom.addEventListener('click', () => mesa.elegirSubetapa(vista));
      return {
        dom,
        update(n) {
          if (n.type.name !== 'subetapa') return false;
          actual = n;
          poner(n);
          return true;
        },
        stopEvent: (e) => e.type === 'click' || e.type === 'mousedown',
        ignoreMutation: () => true
      };
    };
  }
});
