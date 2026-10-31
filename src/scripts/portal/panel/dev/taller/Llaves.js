/* LAS LLAVES EN AMARILLO. Todo lo que va de { a } se pinta mientras se escribe.

   Es solo una vista: la llave no se guarda aparte, el texto sigue siendo texto. Con un libro de
   218 mil letras no se puede buscar en todo a cada tecla, asi que solo se vuelve a mirar el
   bloque que cambio (la prueba de la Fase 0 dio 5 milesimas por tecla con esto). */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const LLAVE = /\{[^{}\n]{1,60}\}/g;

function buscar(doc, desde, hasta) {
  const halladas = [];
  doc.nodesBetween(desde, hasta, (n, pos) => {
    if (!n.isTextblock) return true;
    const t = n.textBetween(0, n.content.size, '\n', '￼');
    LLAVE.lastIndex = 0;
    for (let m; (m = LLAVE.exec(t));) halladas.push(Decoration.inline(pos + 1 + m.index, pos + 1 + m.index + m[0].length, { class: 'llave' }));
    return false;
  });
  return halladas;
}

const clave = new PluginKey('llaves');

export const Llaves = Extension.create({
  name: 'llaves',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: clave,
      state: {
        init: (_, s) => DecorationSet.create(s.doc, buscar(s.doc, 0, s.doc.content.size)),
        apply(tr, set) {
          if (!tr.docChanged) return set;
          let nuevo = set.map(tr.mapping, tr.doc);
          const tam = tr.doc.content.size;
          tr.mapping.maps.forEach((mapa, i) => mapa.forEach((a, b, ini, fin) => {
            const resto = tr.mapping.slice(i + 1);
            const de = Math.min(resto.map(ini, -1), tam), al = Math.min(resto.map(fin, 1), tam);
            const r1 = tr.doc.resolve(de), r2 = tr.doc.resolve(al);
            const u = r1.depth ? r1.before(1) : de, v = r2.depth ? r2.after(1) : al;
            nuevo = nuevo.remove(nuevo.find(u, v)).add(tr.doc, buscar(tr.doc, u, Math.min(v, tam)));
          }));
          return nuevo;
        }
      },
      props: { decorations(s) { return clave.getState(s); } }
    })];
  }
});
