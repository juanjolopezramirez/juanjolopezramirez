/* SOLTAR ARCHIVOS EN EL TALLER (panel/soltar.js hace lo comun). Todo llega por los caminos que ya usan los botones, asi
   un archivo soltado y uno elegido hacen exactamente lo mismo:

     · sobre el texto de un capitulo, una imagen: Editor.js (handleDrop) pone el cursor donde cayo y avisa
       (`tal-soltar-imagen`); aqui se sube como con «Imagen» (Taller.subirImagen → Mesa.ponerImagen);
     · sobre una pagina libre, una imagen: esa pagina queda elegida y la imagen entra en ella;
     · en la mesa, un PDF: un menu pequeño (el de la pagina, MenuPagina.js) pregunta «¿Qué hago con este PDF?»: añadir sus
       paginas, ponerlo de portada o, si cayo sobre paginas de un PDF, cambiar ese PDF (Taller.traerPdf, con sus guardias);
     · los botones «Imagen», «PDF» y «Portada» de la cinta, la imagen del «Contenido», el PDF de «Compartir» y el SVG del
       icono de un boton (Propiedades) reciben lo suyo. La imagen del lomo la atiende LomoSubido.js.

   `soltarEnMesa(taller)` se llama una vez, al crear el Taller (panel.js). Lee del Taller lo que necesita en el momento de
   soltar: la mesa y la cinta nacen al abrir un libro. */
import { conTipo, IMAGENES, revisarSoltado, soltarEn, textoDeFalla, textosDeSoltar, zonaDeSoltar, avisar, opcionesDePdf, ponerEnInput } from '../../soltar.js';

const CON_SVG = [...IMAGENES, 'svg'];
const ACCION = { sueltas: ['pdfSueltas', 'hoja'], portada: ['pdfPortada', 'adelante'], cambiar: ['pdfCambiar', 'subir'] };

export function soltarEnMesa(t) {
  const nodo = t.nodoMesa;
  if (!nodo || nodo.dataset.soltar) return t;
  nodo.dataset.soltar = '1';
  const q = (s) => nodo.querySelector(s);
  const abierta = () => !!(t.obra && t.mesa && t.mesa.editable);

  /* La pagina del libro (de la mesa) bajo el punto donde se solto */
  const paginaBajo = (objetivo) => (t.mesa ? t.mesa.paginas.find((p) => p.vista && p.vista.dom && p.vista.dom.contains(objetivo)) : null);

  /* Una imagen, como el boton «Imagen». Sobre una pagina libre, en esa pagina */
  const imagen = (archivo, objetivo) => {
    const p = objetivo ? paginaBajo(objetivo) : null;
    if (p && p.vista.hoja && p.vista.hoja.contains(objetivo)) p.vista.hoja.focus({ preventScroll: true });
    t.subirImagen(archivo);
  };

  /* El PDF soltado en la mesa: el menu de tres (o dos) opciones donde cayo */
  const preguntarPdf = (archivo, e) => {
    const mesa = t.mesa, tx = textosDeSoltar();
    const p = paginaBajo(e.target);
    const sobrePdf = !!(p && mesa.grupoDePagina(p));
    const items = opcionesDePdf({ editable: abierta(), sobrePdf }).map((k) => ({
      texto: tx[ACCION[k][0]], icono: ACCION[k][1], fn: () => {
        if (k === 'sueltas') { t.traerPdf(archivo, {}); return; }
        if (k === 'portada') { t.traerPdf(archivo, { portada: true }); return; }
        /* «Cambiar el PDF»: el mismo pedido del menu de la pagina (con sus guardias); en vez del selector, este archivo */
        const g = mesa.paginas.includes(p) ? mesa.grupoDePagina(p) : null;
        if (!g) { t.decir(t.tx.cambioSinGrupo); return; }
        const antes = mesa.alPedirCambioPdf;
        mesa.alPedirCambioPdf = () => t.traerPdf(archivo, { cambiar: true });
        try { mesa.pedirCambioPdf(g); } finally { mesa.alPedirCambioPdf = antes; }
      }
    }));
    if (!items.length) return;
    const menu = mesa.menu, caja = menu.caja, nombre = caja.getAttribute('aria-label');
    caja.setAttribute('aria-label', tx.pdfQue);
    caja.addEventListener('toggle', function vuelve(ev) {
      if (ev.newState !== 'closed') return;
      caja.setAttribute('aria-label', nombre);
      caja.removeEventListener('toggle', vuelve);
    });
    const origen = nodo.contains(document.activeElement) ? document.activeElement : null;
    menu.abrir(e.clientX, e.clientY, items, origen);
  };

  /* La mesa entera: un PDF pregunta; una imagen va donde cayo (el texto lo atiende Editor.js) */
  const fondo = q('[data-tal-fondo]');
  if (fondo) {
    zonaDeSoltar(fondo, {
      acepta: ['pdf', ...CON_SVG], activa: abierta,
      alSoltar: (archivo, e, ext) => { if (ext === 'pdf') preguntarPdf(archivo, e); else imagen(archivo, e.target); }
    });
    fondo.removeAttribute('data-soltar-zona');      // la mesa entera no se marca suave: solo cuando el archivo esta encima
  }

  /* La imagen que Editor.js recibio sobre el texto: la misma revision, y el capitulo donde cayo queda activo */
  nodo.addEventListener('tal-soltar-imagen', async (e) => {
    const archivo = e.detail && e.detail.archivo;
    if (!archivo || !abierta()) return;
    const r = await revisarSoltado(archivo, CON_SVG);
    if (!r.ok) { avisar(textoDeFalla(r.clave, CON_SVG, textosDeSoltar(), r.ext)); return; }
    const v = t.mesa.vivos.find((x) => x.editor && x.editor.view && x.editor.view.dom === e.target);
    if (v) t.mesa.alEnfocarEditor(v);
    try { await t.subirImagen(conTipo(archivo, r.ext)); } catch (x) { avisar(textosDeSoltar().fallo); }
  });

  /* Los botones de la cinta */
  for (const b of nodo.querySelectorAll('[data-b-imagen]')) zonaDeSoltar(b, { acepta: CON_SVG, activa: abierta, alSoltar: (a) => imagen(a, null) });
  for (const b of nodo.querySelectorAll('[data-b-pdf]')) zonaDeSoltar(b, { acepta: ['pdf'], activa: abierta, alSoltar: (a) => t.traerPdf(a, {}) });
  for (const b of nodo.querySelectorAll('[data-b-portada]')) zonaDeSoltar(b, { acepta: ['pdf'], activa: abierta, alSoltar: (a) => t.traerPdf(a, { portada: true }) });

  /* La imagen de arriba del «Contenido» */
  const indice = q('[data-tal-indice-imagen]');
  const filaIndice = indice && indice.closest('.tal-indice-d__imagen');
  if (filaIndice) zonaDeSoltar(filaIndice, { acepta: CON_SVG, activa: abierta, chip: true, alSoltar: (a) => t.subirImagenIndice(a) });

  /* «Compartir»: el PDF de una edicion nueva (no mientras otra sube) */
  const subir = q('[data-cp-subir]');
  const seccion = subir && subir.closest('.tal-comp__seccion');
  if (seccion) zonaDeSoltar(seccion, { acepta: ['pdf'], chip: true, activa: () => !!(t.publicar && !t.publicar.ocupado), alSoltar: (a) => t.publicar.leer(a) });

  /* El icono propio de un boton (Propiedades arma su campo cada vez): el grupo que tiene el input del SVG */
  const panel = q('[data-tal-panel]');
  if (panel) {
    soltarEn(panel, (objetivo) => {
      const input = panel.querySelector('input[type="file"][accept=".svg,image/svg+xml"]');
      const zona = input && input.parentElement;
      if (!zona || !zona.contains(objetivo) || !abierta()) return null;
      return { zona, acepta: ['svg'], alSoltar: (a) => ponerEnInput(input, a) };
    });
  }
  return t;
}
