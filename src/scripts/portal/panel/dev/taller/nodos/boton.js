/* La parte de EDITOR de un boton en su propia linea. En la mesa no abre ni copia: se elige con un clic, y lo
   demas esta en el panel. El alto es el mismo del PDF: si cambiara, las paginas se cortarian distinto. */
import { Node } from '@tiptap/core';
import { cambiador } from './cambiar.js';
import { botonIncompleto, estiloDeBoton } from '../../../../../contenido/taller/tipos/boton.js';

const ATRIBUTOS = { texto: '', accion: 'enlace', enlace: '', copia: '', fondo: '', color: '', alinear: '' };

export const Boton = Node.create({
  name: 'boton',
  group: 'block',
  atom: true,
  draggable: true,
  addOptions() { return { mesa: null }; },
  addAttributes() { return Object.fromEntries(Object.entries(ATRIBUTOS).map(([k, v]) => [k, { default: v }])); },
  parseHTML() {
    return [{ tag: 'div[data-boton]', getAttrs: (e) => {
      try { return JSON.parse(e.getAttribute('data-boton')); } catch (x) { return false; }
    } }];
  },
  renderHTML({ node }) { return ['div', { 'data-boton': JSON.stringify(node.attrs) }]; },
  addNodeView() {
    const { mesa } = this.options;
    return ({ node, getPos, editor }) => {
      const updateAttributes = cambiador(editor, getPos);
      const dom = document.createElement('div');
      dom.contentEditable = 'false';
      const poner = (n) => {
        const a = n.attrs;
        dom.className = `boton${a.alinear ? ` boton--${a.alinear}` : ''}${botonIncompleto(a) ? ' boton--falta' : ''}`;
        dom.textContent = a.texto;
        dom.removeAttribute('style');
        for (const [k, v] of Object.entries(estiloDeBoton(a))) dom.style.setProperty(k, v);
      };
      let actual = node;
      poner(node);
      const vista = { getPos, updateAttributes, get node() { return actual; }, dom };
      dom.addEventListener('click', () => mesa.elegirBoton(vista));
      return {
        dom,
        update(n) {
          if (n.type.name !== 'boton') return false;
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
