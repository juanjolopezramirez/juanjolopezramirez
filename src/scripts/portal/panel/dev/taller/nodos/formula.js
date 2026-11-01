/* La parte de EDITOR de una formula: un trozo dentro del renglon. Se ve dibujada con KaTeX; al hacer clic
   se abre el campo de MathLive encima, donde `/` hace una fraccion y `^` un exponente. */
import { Node } from '@tiptap/core';
import { cambiador } from './cambiar.js';
import katex from 'katex';
import { OPCIONES_KATEX } from '../../../../../contenido/taller/tipos/formula.js';

export const Formula = Node.create({
  name: 'formula',
  group: 'inline',
  inline: true,
  atom: true,
  addOptions() { return { mesa: null }; },
  addAttributes() { return { tex: { default: '' } }; },
  parseHTML() { return [{ tag: 'span[data-tex]', getAttrs: (e) => ({ tex: e.getAttribute('data-tex') || '' }) }]; },
  renderHTML({ node }) { return ['span', { 'data-tex': node.attrs.tex }, node.attrs.tex]; },
  addNodeView() {
    const { mesa } = this.options;
    return ({ node, getPos, editor }) => {
      const updateAttributes = cambiador(editor, getPos);
      const dom = document.createElement('span');
      dom.className = 'formula formula--ed';
      dom.contentEditable = 'false';
      dom.dir = 'ltr';
      let actual = node;
      const dibujar = () => {
        dom.textContent = '';
        try { katex.render(actual.attrs.tex || '\\square', dom, OPCIONES_KATEX); } catch (e) { dom.textContent = '?'; }
      };
      dibujar();
      const vista = { getPos, updateAttributes, dom, get tex() { return actual.attrs.tex; } };
      dom.addEventListener('click', () => mesa.editarFormula(vista));
      return {
        dom,
        update(n) {
          if (n.type.name !== 'formula') return false;
          if (n.attrs.tex !== actual.attrs.tex) { actual = n; dibujar(); }
          actual = n;
          return true;
        },
        stopEvent: (e) => e.type === 'click' || e.type === 'mousedown',
        ignoreMutation: () => true
      };
    };
  }
});
