/* Cambiar los datos de una pieza del texto desde afuera (el panel, MathLive). Tiptap solo da
   `updateAttributes` a sus vistas hechas con su clase; las de aqui son funciones sueltas y la piden aqui. */
export const cambiador = (editor, getPos) => (attrs) => {
  const pos = getPos();
  if (typeof pos !== 'number') return;
  const n = editor.state.doc.nodeAt(pos);
  if (n) editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, null, { ...n.attrs, ...attrs }));
};
