/* Cambiar los datos de una pieza del texto desde afuera (el panel, MathLive). Tiptap solo da
   `updateAttributes` a sus vistas hechas con su clase; las de aqui son funciones sueltas y la piden aqui.
   `aparte`: el cambio es su propio paso de Ctrl+Z (arrastrar un boton no se junta con lo de antes). */
import { closeHistory } from '@tiptap/pm/history';

export const cambiador = (editor, getPos) => (attrs, aparte = false) => {
  const pos = getPos();
  if (typeof pos !== 'number') return;
  const n = editor.state.doc.nodeAt(pos);
  if (!n) return;
  const tr = editor.state.tr.setNodeMarkup(pos, null, { ...n.attrs, ...attrs });
  editor.view.dispatch(aparte ? closeHistory(tr) : tr);
};
