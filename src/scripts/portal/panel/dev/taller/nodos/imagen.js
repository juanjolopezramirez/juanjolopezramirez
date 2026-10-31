/* La parte de EDITOR del bloque imagen: la imagen, su texto alternativo, su pie y su ancho.
   La imagen vive en el cajon privado; `pintar` trae sus bytes (Imagenes.js). */
import { Node } from '@tiptap/core';

export const Imagen = Node.create({
  name: 'imagen',
  group: 'block',
  atom: true,
  draggable: true,
  addOptions() { return { pintar: () => {}, tx: {} }; },
  addAttributes() {
    return {
      ruta: { default: '' }, alt: { default: '' }, decorativa: { default: false },
      pie: { default: '' }, anchoPct: { default: 100 }, alinear: { default: '' }
    };
  },
  /* Los atributos viajan en el HTML para que cortar y pegar dentro del libro no pierda la imagen */
  parseHTML() {
    return [{ tag: 'figure[data-imagen]', getAttrs: (e) => {
      try { return JSON.parse(e.getAttribute('data-imagen')); } catch (x) { return false; }
    } }];
  },
  renderHTML({ node }) { return ['figure', { 'data-imagen': JSON.stringify(node.attrs) }]; },
  addNodeView() {
    const { pintar, tx } = this.options;
    return ({ node, updateAttributes }) => {
      const dom = document.createElement('figure');
      dom.className = 'tal-imagen';
      dom.contentEditable = 'false';
      const img = document.createElement('img');
      img.alt = node.attrs.alt;
      img.style.width = `${node.attrs.anchoPct}%`;
      dom.append(img);
      const campo = (texto, valor, tipo, alCambiar, max) => {
        const l = document.createElement('label');
        const s = document.createElement('span');
        s.textContent = texto;
        const i = document.createElement('input');
        i.type = tipo;
        if (tipo === 'checkbox') i.checked = valor; else i.value = valor;
        if (max) i.maxLength = max;
        i.addEventListener('change', () => alCambiar(i));
        l.append(s, i);
        return l;
      };
      const fila = document.createElement('div');
      fila.className = 'tal-imagen__campos';
      const cAlt = campo(tx.alt, node.attrs.alt, 'text', (i) => updateAttributes({ alt: i.value }), 300);
      const cPie = campo(tx.pie, node.attrs.pie, 'text', (i) => updateAttributes({ pie: i.value }), 300);
      const cAncho = campo(tx.ancho, String(node.attrs.anchoPct), 'number', (i) => updateAttributes({ anchoPct: Number(i.value) || 100 }));
      const cAdorno = campo(tx.adorno, node.attrs.decorativa, 'checkbox', (i) => updateAttributes({ decorativa: i.checked }));
      fila.append(cAlt, cPie, cAncho, cAdorno);
      dom.append(fila);
      pintar(node.attrs.ruta, img);
      return {
        dom,
        update(n) {
          /* Otra imagen: se arma de nuevo, o saldria la de antes con estos campos */
          if (n.type.name !== 'imagen' || n.attrs.ruta !== node.attrs.ruta) return false;
          img.style.width = `${n.attrs.anchoPct}%`;
          img.alt = n.attrs.alt;
          return true;
        },
        stopEvent: (e) => e.target instanceof HTMLInputElement,
        ignoreMutation: () => true
      };
    };
  }
});
