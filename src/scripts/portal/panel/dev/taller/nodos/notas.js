/* LAS NOTAS SOBRE UNA PALABRA: dos marcas del editor, sobre cualquier trozo de texto elegido.
     definicion   { t, d, r | rf, ft, fd }   la palabra, lo que significa, de donde viene (APA) y sus letras
     citaBiblica  { r, x, rv }                la cita en forma canonica, como se lee y la version recomendada
   Las dos excluyen al enlace y entre ellas: el PDF no puede llevar un enlace dentro de otro. Lo que se pega pasa por la
   MISMA regla que el lector (notasLibro.js → limpiarNota): una nota que no la pasa no entra.

   En la mesa se ven como un <span class="nota"> con sus datos en `data-nota`; al sacar el PDF, TextoLibro las vuelve el enlace
   /nota/#n=… Un clic sobre una abre su ventana (NotaEditor.js), igual que Ctrl+Mayus+D (definicion) o Ctrl+Mayus+E (cita)
   con el cursor dentro. El editor solo AVISA (evento `tal-nota` en su nodo): la ventana vive aparte. */
import { Mark, getMarkRange } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { AddMarkStep } from '@tiptap/pm/transform';
import { marcaLimpia, notaDeMarca } from '../../../../../contenido/taller/notasLibro.js';
import { tituloDeNota } from '../../../../../lector/notaEnPdf.js';

export const EVENTO_NOTA = 'tal-nota';
/* El idioma del libro, tal como el editor lo dice en su `lang` (Editor.js); sin el, español */
function idiomaDelEditor(editor) {
  const a = editor && editor.options && editor.options.editorProps ? editor.options.editorProps.attributes : null;
  return a && typeof a === 'object' && a.lang === 'en' ? 'en' : 'es';
}
export const EVENTO_AVISO = 'tal-nota-aviso';
const ESPERA_CLIC_MS = 260;
/* En la pista que sale al pasar sobre una nota (como el resto de la mesa, en español) */
const AYUDA_CLIC = 'Toca para ver o cambiar la nota';
const LLAVES = { definicion: ['t', 'd', 'r', 'rf', 'ft', 'fd'], citaBiblica: ['r', 'x', 'rv'] };

/* Los datos de un <span data-nota> (pegado o cortado dentro del editor), ya limpios; null si no son una nota de este tipo */
const leidos = new WeakMap();
function datosDe(e, tipo) {
  if (!leidos.has(e)) {
    let x = null;
    try { x = JSON.parse(e.getAttribute('data-nota') || 'null'); } catch { x = null; }
    leidos.set(e, x && typeof x === 'object' && !Array.isArray(x) ? marcaLimpia({ type: x.type, attrs: x.attrs }) : null);
  }
  const m = leidos.get(e);
  return m && m.type === tipo ? m.attrs : null;
}

/* Avisa a la ventana: `desde`/`hasta` es el tramo de la nota (o de la seleccion, si no se esta sobre una) */
function avisar(editor, tipo, tramo) {
  editor.view.dom.dispatchEvent(new CustomEvent(EVENTO_NOTA, { bubbles: true, detail: { editor, tipo, ...tramo } }));
}

/* Tiptap compara los datos con `===`: la referencia por partes es un objeto, y dos trozos de la misma nota (una parte en
   negrita) traen cada uno el suyo. Se comparan solo los datos planos. */
const planos = (a) => Object.fromEntries(Object.entries(a || {}).filter(([, v]) => v === null || typeof v !== 'object'));

/* El tramo de una nota de este tipo donde esta el cursor, con sus datos; null si no hay */
export function notaEnCursor(state, tipo) {
  const t = state.schema.marks[tipo];
  if (!t) return null;
  const $p = state.doc.resolve(state.selection.from);
  const m = [$p.nodeAfter, $p.nodeBefore].map((n) => n && n.isText && n.marks.find((x) => x.type === t)).find(Boolean);
  if (!m) return null;
  const r = getMarkRange($p, t, planos(m.attrs));
  /* Con letras elegidas, solo si quedan dentro de esa nota */
  if (!r || (!state.selection.empty && (state.selection.from < r.from || state.selection.to > r.to))) return null;
  return { desde: r.from, hasta: r.to, attrs: m.attrs };
}

function crearMarca(name, clase, tecla) {
  return Mark.create({
    name,
    inclusive: false,
    excludes: 'link definicion citaBiblica',
    addAttributes() {
      const attrs = {};
      for (const k of LLAVES[name]) {
        attrs[k] = {
          default: k === 'r' && name === 'definicion' ? null : '',
          parseHTML: (e) => { const d = datosDe(e, name); return d && d[k] !== undefined ? d[k] : null; },
          renderHTML: () => ({})
        };
      }
      return attrs;
    },
    parseHTML() { return [{ tag: `span[data-nota]`, getAttrs: (e) => (datosDe(e, name) ? {} : false) }]; },
    renderHTML({ mark }) {
      const m = marcaLimpia({ type: name, attrs: mark.attrs });
      const n = m ? notaDeMarca(m) : null;
      /* La referencia entera («Mateo 4:3»), nunca solo lo escrito («4:3»), en el idioma del libro (el `lang` del editor) */
      const titulo = n ? tituloDeNota(n, idiomaDelEditor(this.editor)) : '';
      return ['span', { class: `nota ${clase}`, 'data-nota': m ? JSON.stringify(m) : '', title: titulo ? `${titulo} · ${AYUDA_CLIC}` : AYUDA_CLIC }, 0];
    },
    addKeyboardShortcuts() {
      return { [tecla]: () => { const ed = this.editor; if (!ed.isEditable) return false; const t = notaEnCursor(ed.state, name); avisar(ed, name, t || { desde: ed.state.selection.from, hasta: ed.state.selection.to }); return true; } };
    },
    addProseMirrorPlugins() {
      const ed = this.editor;
      let reloj = 0;
      const cancelar = () => { clearTimeout(reloj); reloj = 0; return false; };
      const plugins = [new Plugin({
        key: new PluginKey(`clic-${name}`),
        props: {
          /* Solo UN clic simple abre la ventana: el doble clic elige la palabra, el triple el parrafo, y poner el cursor con
             el teclado nunca la abre. Se espera un poco por si llega un segundo clic; con el rodillo puesto, el clic es del
             rodillo. */
          handleClick(view, pos, ev) {
            cancelar();
            if (!ed.isEditable || ev.button !== 0 || ev.detail !== 1 || ev.shiftKey || ev.ctrlKey || ev.metaKey || ev.altKey) return false;
            if (view.dom.closest('.tal-pintando')) return false;
            const el = ev.target && ev.target.closest ? ev.target.closest(`.nota.${clase}`) : null;
            if (!el || !view.dom.contains(el)) return false;
            const t = view.state.schema.marks[name], $p = view.state.doc.resolve(pos);
            const m = [$p.nodeAfter, $p.nodeBefore].map((n) => n && n.isText && n.marks.find((x) => x.type === t)).find(Boolean);
            if (!m) return false;
            const r = getMarkRange($p, t, planos(m.attrs));
            if (!r) return false;
            reloj = setTimeout(() => {
              reloj = 0;
              if (ed.isDestroyed || !view.state.selection.empty || view.dom.closest('.tal-pintando')) return;
              avisar(ed, name, { desde: r.from, hasta: r.to, attrs: m.attrs });
            }, ESPERA_CLIC_MS);
            return false;
          },
          handleDoubleClick: cancelar,
          handleTripleClick: cancelar,
          handleKeyDown: cancelar,
          handleDOMEvents: { pointerdown: (v, e) => { if (e.detail > 1) cancelar(); return false; } }
        }
      })];
      /* Un enlace no puede ir sobre una nota (se excluyen): si se intento, se dice en la mesa en vez de no hacer nada */
      if (name === 'definicion') {
        plugins.push(new Plugin({
          key: new PluginKey('nota-sin-enlace'),
          appendTransaction(trs, antes) {
            const tipos = [antes.schema.marks.definicion, antes.schema.marks.citaBiblica].filter(Boolean);
            for (const tr of trs) {
              for (const s of tr.steps) {
                if (!(s instanceof AddMarkStep) || s.mark.type.name !== 'link') continue;
                const desde = Math.max(0, s.from), hasta = Math.min(antes.doc.content.size, s.to);
                if (hasta > desde && tipos.some((t) => antes.doc.rangeHasMark(desde, hasta, t))) {
                  ed.view.dom.dispatchEvent(new CustomEvent(EVENTO_AVISO, { bubbles: true, detail: { clave: 'notaSinEnlace' } }));
                  return null;
                }
              }
            }
            return null;
          }
        }));
      }
      return plugins;
    }
  });
}

export const Definicion = crearMarca('definicion', 'nota--def', 'Mod-Shift-d');
export const CitaBiblica = crearMarca('citaBiblica', 'nota--cita', 'Mod-Shift-e');
