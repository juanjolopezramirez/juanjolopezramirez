/* La parte de EDITOR de un boton en su propia linea, o suelto. En la mesa no abre ni copia: se elige con un clic, y lo
   demas esta en el panel. El alto es el mismo del PDF: si cambiara, las paginas se cortarian distinto.

   SUELTO: el boton no ocupa renglon. Su marco (sin alto) queda donde estaba su linea, y el boton se pone con
   `left`/`top` en mm desde ese punto, girado sobre su centro: la misma regla del PDF (tipos/boton.js). Se arrastra con
   el puntero (un solo Ctrl+Z por arrastre) y nunca sale de su hoja: `limites` mide la hoja donde cae su punto. */
import { Node } from '@tiptap/core';
import { cambiador } from './cambiar.js';
import { botonIncompleto, claseDeBoton, claseSuelto, datos, estiloDeBoton, hijosDeBoton } from '../../../../../contenido/taller/tipos/boton.js';
import { armar, ponerEstilo } from '../../../../../contenido/taller/armar.js';
import { acotarSuelto, estiloSuelto } from '../../../../../contenido/taller/aspectoBoton.js';

const ATRIBUTOS = { texto: '', accion: 'enlace', enlace: '', copia: '', fondo: '', color: '', alinear: '', icono: null, lado: 'izq', aspecto: null, suelto: null };
const MM = 25.4 / 96;
const UMBRAL_PX = 3;

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
      let interior = null;
      const poner = (n) => {
        /* Lo que dice el nodo puede venir pegado de fuera: se dibuja ya limpio, como en el PDF */
        const a = datos(null, n.attrs), falta = botonIncompleto(a) ? ' boton--falta' : '';
        /* Los mismos hijos que el PDF, por la misma puerta: asi mide igual */
        const hijos = hijosDeBoton(a).map((h) => armar(h)).filter(Boolean);
        dom.removeAttribute('style');
        /* className se escribe entero: lo que pone ProseMirror al elegir el nodo se guarda y se vuelve a poner */
        const elegido = dom.classList.contains('ProseMirror-selectednode');
        if (a.suelto) {
          /* Siempre el mismo elemento raiz: asi lo elegido sigue siendo el mismo al pasar de suelto a en linea */
          interior = interior || document.createElement('div');
          dom.className = claseSuelto;
          interior.className = `boton boton--suelta${claseDeBoton(a)}${falta}${arrastrando ? ' arrastrando' : ''}`;
          interior.removeAttribute('style');
          interior.replaceChildren(...hijos);
          ponerEstilo(interior, { ...estiloDeBoton(a), ...estiloSuelto(a.suelto) });
          dom.replaceChildren(interior);
        } else {
          interior = null;
          dom.className = `boton${a.alinear ? ` boton--${a.alinear}` : ''}${claseDeBoton(a)}${falta}`;
          dom.replaceChildren(...hijos);
          ponerEstilo(dom, estiloDeBoton(a));
        }
        if (elegido) dom.classList.add('ProseMirror-selectednode');
      };
      let actual = node, arrastrando = false, soltarArrastre = () => {};
      poner(node);

      /* Lo que se le permite a un boton suelto: la caja del texto de su hoja, vista desde el punto de su parrafo (mm). El PDF
         recorta todo lo que cae fuera de esa caja (los margenes), asi que la mesa tampoco lo deja salir: lo que se ve aqui es lo
         que sale. Las filas de la mesa se repiten cada alto + margenes + espacio; el punto cae en la fila de su marco. */
      const limites = () => {
        const px = mesa.px, flujo = dom.closest('.flujo');
        if (!px || !flujo) return null;
        const f = flujo.getBoundingClientRect(), r = dom.getBoundingClientRect(), z = mesa.z || 1;
        const ax = (r.left - f.left) / z, ay = (r.top - f.top) / z, paso = px.alto + px.mt + px.mb + px.gap;
        const fila = Math.max(0, Math.floor((ay + 0.5) / paso)), arriba = fila * paso - ay, abajo = fila * paso + px.alto - ay;
        return { x0: -ax * MM, x1: (px.ancho - ax) * MM, y0: arriba * MM, y1: abajo * MM };
      };
      const caja = () => (interior ? { w: interior.offsetWidth * MM, h: interior.offsetHeight * MM } : { w: 0, h: 0 });
      const acotar = (s) => { const l = limites(); return l ? acotarSuelto(s, caja(), l) : acotarSuelto(s, caja(), { x0: -1e4, x1: 1e4, y0: -1e4, y1: 1e4 }); };
      /* ¿Se salio de su caja? Pasa si el texto de arriba crece y su parrafo baja: se marca en la mesa (en el PDF se cortaria) */
      const revisar = () => {
        if (!interior) return false;
        const s = actual.attrs.suelto, t = acotar(s), fuera = !!s && (Math.abs(t.dx - s.dx) > 0.3 || Math.abs(t.dy - s.dy) > 0.3);
        interior.classList.toggle('boton--fuera', fuera);
        return fuera;
      };
      const vista = { getPos, updateAttributes, get node() { return actual; }, dom, acotar, revisar };
      dom.vistaBoton = vista;

      dom.addEventListener('click', () => mesa.elegirBoton(vista));
      dom.addEventListener('dragstart', (e) => { if (actual.attrs.suelto) e.preventDefault(); }, true);
      dom.addEventListener('pointerdown', (e) => {
        const s = actual.attrs.suelto;
        if (!s || e.button !== 0 || !e.target.closest('.boton--suelta') || mesa.soloMirar(dom)) return;
        mesa.elegirBoton(vista);
        e.preventDefault();
        e.stopPropagation();
        const z = mesa.z || 1, x0 = e.clientX, y0 = e.clientY, inicio = acotar(s);
        let nuevo = inicio, movio = false;
        soltarArrastre();
        const mover = (v) => {
          if (!interior) return;
          const px = v.clientX - x0, py = v.clientY - y0;
          if (!movio && Math.hypot(px, py) < UMBRAL_PX) return;
          if (!movio) { arrastrando = true; interior.classList.add('arrastrando'); }
          movio = true;
          nuevo = acotar({ ...inicio, dx: inicio.dx + (px / z) * MM, dy: inicio.dy + (py / z) * MM });
          ponerEstilo(interior, estiloSuelto(nuevo));
        };
        /* Se quitan siempre los cuatro oidos, salga como salga (soltar, cancelar, Escape o que el nodo muera) */
        const quitar = () => {
          window.removeEventListener('pointermove', mover);
          window.removeEventListener('pointerup', soltar);
          window.removeEventListener('pointercancel', cancelar);
          window.removeEventListener('keydown', tecla, true);
          arrastrando = false;
          if (interior) interior.classList.remove('arrastrando');
          soltarArrastre = () => {};
        };
        const soltar = () => {
          quitar();
          if (movio && interior) { updateAttributes({ suelto: nuevo }, true); mesa.alCambiarBoton(vista); }
        };
        /* Cancelar descarta: el boton vuelve a donde estaba y nada entra en el historial */
        const cancelar = () => {
          quitar();
          if (movio && interior && actual.attrs.suelto) ponerEstilo(interior, estiloSuelto(actual.attrs.suelto));
        };
        const tecla = (k) => { if (k.key === 'Escape') { k.preventDefault(); k.stopPropagation(); cancelar(); } };
        soltarArrastre = quitar;
        window.addEventListener('pointermove', mover);
        window.addEventListener('pointerup', soltar);
        window.addEventListener('pointercancel', cancelar);
        window.addEventListener('keydown', tecla, true);
      });
      return {
        dom,
        update(n) {
          if (n.type.name !== 'boton') return false;
          actual = n;
          poner(n);
          return true;
        },
        stopEvent: (e) => e.type === 'click' || e.type === 'mousedown' || (e.type === 'pointerdown' && !!actual.attrs.suelto) || (e.type === 'dragstart' && !!actual.attrs.suelto),
        ignoreMutation: () => true,
        destroy() { soltarArrastre(); }
      };
    };
  }
});
