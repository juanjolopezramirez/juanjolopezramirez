/* La parte de EDITOR de un pasaje biblico. Se dibuja con el mismo arbol del PDF (tipos/pasaje.js), asi
   ocupa lo mismo en la mesa y en el papel. Se elige con un clic y se escribe en el panel. Si va en hebreo,
   su letra se trae la primera vez que aparece. */
import { Node } from '@tiptap/core';
import { cambiador } from './cambiar.js';
import { datos, esHebreo, FUENTE_HEBREO, piezaDePasaje } from '../../../../../contenido/taller/tipos/pasaje.js';
import { cargarFuente } from '../Fuentes.js';

const ATRIBUTOS = { texto: '', referencia: '' };

/* El arbol neutro { tag, clase, attrs, hijos } o { texto } a elementos. Solo lo que este bloque produce. */
function armar(n) {
  if (typeof n.texto === 'string') return document.createTextNode(n.texto);
  const e = document.createElement(n.tag);
  if (n.clase) e.className = n.clase;
  for (const [k, v] of Object.entries(n.attrs || {})) if (k === 'dir' || k === 'lang') e.setAttribute(k, v);
  for (const h of n.hijos || []) e.append(armar(h));
  return e;
}

export const Pasaje = Node.create({
  name: 'pasaje',
  group: 'block',
  atom: true,
  draggable: true,
  addOptions() { return { mesa: null }; },
  addAttributes() { return Object.fromEntries(Object.entries(ATRIBUTOS).map(([k, v]) => [k, { default: v }])); },
  parseHTML() {
    return [{ tag: 'div[data-pasaje]', getAttrs: (e) => {
      try { return JSON.parse(e.getAttribute('data-pasaje')); } catch (x) { return false; }
    } }];
  },
  renderHTML({ node }) { return ['div', { 'data-pasaje': JSON.stringify(node.attrs) }]; },
  addNodeView() {
    const { mesa } = this.options;
    return ({ node, getPos, editor }) => {
      const updateAttributes = cambiador(editor, getPos);
      /* La figura misma, sin caja alrededor: el mismo arbol que el PDF */
      const dom = document.createElement('figure');
      dom.contentEditable = 'false';
      const poner = (n) => {
        const a = datos(null, n.attrs), pieza = armar(piezaDePasaje(a));
        dom.className = `${pieza.className} pasaje-ed${a.texto ? '' : ' pasaje--falta'}`;
        dom.replaceChildren(...pieza.childNodes);
        if (esHebreo(a.texto)) cargarFuente(FUENTE_HEBREO);
      };
      let actual = node;
      poner(node);
      const vista = { getPos, updateAttributes, get node() { return actual; }, dom };
      dom.addEventListener('click', () => mesa.elegirPasaje(vista));
      return {
        dom,
        update(n) {
          if (n.type.name !== 'pasaje') return false;
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
