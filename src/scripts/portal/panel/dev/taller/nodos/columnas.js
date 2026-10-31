/* La parte de EDITOR de las columnas: de 2 a 6, cada una con su ancho en partes («1 2 1»). */
import { Node } from '@tiptap/core';

export const Columna = Node.create({
  name: 'columna',
  content: 'block+',
  isolating: true,
  parseHTML() { return [{ tag: 'div[data-columna]' }]; },
  renderHTML() { return ['div', { 'data-columna': '1', class: 'tal-columna' }, 0]; }
});

export const Columnas = Node.create({
  name: 'columnas',
  group: 'block',
  content: 'columna{2,6}',
  isolating: true,
  addAttributes() {
    return { anchos: {
      default: [1, 1],
      parseHTML: (e) => {
        const a = String(e.getAttribute('data-anchos') || '').split(' ').map(Number);
        return a.length >= 2 && a.length <= 6 && a.every((x) => x >= 1 && x <= 12) ? a : [1, 1];
      }
    } };
  },
  parseHTML() { return [{ tag: 'div[data-columnas]' }]; },
  renderHTML({ node }) {
    return ['div', { 'data-columnas': '1', 'data-anchos': node.attrs.anchos.join(' '), class: 'tal-columnas', style: `grid-template-columns:${node.attrs.anchos.map((x) => `${x}fr`).join(' ')}` }, 0];
  },
  addCommands() {
    return {
      ponerColumnas: (anchos) => ({ commands }) => commands.insertContent({
        type: 'columnas', attrs: { anchos },
        content: anchos.map(() => ({ type: 'columna', content: [{ type: 'paragraph' }] }))
      })
    };
  }
});
