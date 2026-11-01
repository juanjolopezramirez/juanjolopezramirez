/* La parte de EDITOR de una imagen dentro del texto. Va con su parrafo: en linea o a un lado. Se elige
   con un clic, y su esquina cambia el ancho arrastrando. Las demas opciones estan en el panel. */
import { Node } from '@tiptap/core';
import { cambiador } from './cambiar.js';

const crear = (tag, clase) => { const e = document.createElement(tag); if (clase) e.className = clase; return e; };

export const Imagen = Node.create({
  name: 'imagen',
  group: 'block',
  atom: true,
  draggable: true,
  addOptions() { return { mesa: null }; },
  addAttributes() {
    return {
      ruta: { default: '' }, alt: { default: '' }, decorativa: { default: false }, pie: { default: '' },
      anchoPct: { default: 100 }, alinear: { default: '' }, modo: { default: 'linea' }
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
    const { mesa } = this.options;
    return ({ node, getPos, editor }) => {
      const updateAttributes = cambiador(editor, getPos);
      const dom = crear('figure', 'imagen');
      dom.contentEditable = 'false';
      const img = crear('img');
      img.draggable = false;
      dom.append(img);
      const pie = crear('figcaption');
      dom.append(pie);
      const asa = crear('span', 'asa asa--texto');
      dom.append(asa);
      const poner = (n) => {
        dom.className = `imagen imagen--${n.attrs.modo}`;
        dom.style.width = `${n.attrs.anchoPct}%`;
        img.alt = n.attrs.decorativa ? '' : n.attrs.alt;
        pie.textContent = n.attrs.pie;
        pie.hidden = !n.attrs.pie;
      };
      let actual = node;
      poner(node);
      mesa.imagen(node.attrs.ruta).then((d) => { if (d) img.src = d; });
      const vista = { getPos, updateAttributes, get node() { return actual; }, dom };
      dom.addEventListener('click', () => mesa.elegirImagen(vista));
      dom.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || mesa.soloMirar(dom)) return;
        mesa.elegirImagen(vista);
        if (e.target !== asa) return;
        e.preventDefault();
        e.stopPropagation();
        const padre = dom.parentElement.getBoundingClientRect(), x0 = e.clientX, w0 = dom.getBoundingClientRect().width;
        let ancho = actual.attrs.anchoPct;
        const mover = (v) => { ancho = Math.min(100, Math.max(5, Math.round(((w0 + v.clientX - x0) / padre.width) * 100))); dom.style.width = `${ancho}%`; };
        const soltar = () => {
          window.removeEventListener('pointermove', mover);
          window.removeEventListener('pointerup', soltar);
          updateAttributes({ anchoPct: ancho });
        };
        window.addEventListener('pointermove', mover);
        window.addEventListener('pointerup', soltar);
      });
      return {
        dom,
        update(n) {
          /* Otra imagen: se arma de nuevo, o saldria la de antes */
          if (n.type.name !== 'imagen' || n.attrs.ruta !== actual.attrs.ruta) return false;
          actual = n;
          poner(n);
          return true;
        },
        stopEvent: (e) => e.type === 'pointerdown' || e.type === 'mousedown',
        ignoreMutation: () => true
      };
    };
  }
});
