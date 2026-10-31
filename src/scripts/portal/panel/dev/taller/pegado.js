/* LO QUE SE PEGA DESDE WORD O DOCS. El HTML del portapapeles viene de fuera: se abre en un
   documento inerte (ahi nada corre ni carga), se le quita lo que no es texto ni forma y se
   devuelve limpio. Se conservan titulos, listas, negrita y cursiva; los colores y tamaños de
   Word no: el libro manda.

   Docs marca la negrita con un estilo en un <span>, por eso de `style` solo sobreviven
   font-weight y font-style. */
const FUERA = 'script,style,iframe,object,embed,link,meta,base,form,input,button,textarea,select,svg,math,img,video,audio,canvas,template';
const ATRIBUTOS = new Set(['style', 'href']);

function estiloUtil(valor) {
  return String(valor).split(';').map((d) => d.trim()).filter((d) => /^font-(weight|style)\s*:/i.test(d)).join(';');
}

/* Lo que se corta y se pega DENTRO del editor trae su forma (imagenes, diseños, alineacion): esa se
   conserva. El sello lo puede imitar cualquiera, asi que igual se quita lo peligroso, y al guardar
   manda TextoLibro.js. */
function internoSeguro(doc) {
  doc.querySelectorAll('script,style,iframe,object,embed,link,meta,base,form,svg,math,template').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((n) => {
    for (const a of [...n.attributes]) {
      const nombre = a.name.toLowerCase();
      if (nombre.startsWith('on') || (nombre === 'href' && !/^(https:|mailto:|\/[^/])/i.test(a.value.trim()))) n.removeAttribute(a.name);
    }
  });
  return new XMLSerializer().serializeToString(doc.body);
}

export function limpiarPegado(html) {
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  if (doc.querySelector('[data-pm-slice]')) return internoSeguro(doc);
  doc.querySelectorAll(FUERA).forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((n) => {
    for (const a of [...n.attributes]) {
      if (!ATRIBUTOS.has(a.name.toLowerCase())) n.removeAttribute(a.name);
      else if (a.name.toLowerCase() === 'style') {
        const s = estiloUtil(a.value);
        if (s) n.setAttribute('style', s); else n.removeAttribute('style');
      } else if (!/^(https:|mailto:|\/[^/])/i.test(a.value.trim())) n.removeAttribute(a.name);
    }
  });
  return new XMLSerializer().serializeToString(doc.body);
}
