/* RECURSOS (Developer-Mode → Recursos): antes de subir algo, se elige QUE (Panel.astro, textos
   panel.recursos; hoy solo el libro funciona, el video y el escrito dicen «Pronto»).

   Es solo cambiar de vista: la tarjeta «Libro» enseña el editor de libros (EditorLibro.js,
   que ya esta cargado y con su lista) y «Elegir otra cosa» vuelve a las tarjetas. Lo que se
   estaba escribiendo no se pierde al volver: el editor solo se esconde.

   Va por delegacion en `raiz` porque un miembro no tiene esta seccion (panel.js la quita del DOM). */
export class Recursos {
  /** @param {Element} raiz */
  constructor(raiz) {
    this.raiz = raiz;
    raiz.addEventListener('click', (e) => this.alClic(e));
  }

  get cajas() {
    const r = this.raiz.querySelector('[data-recursos]');
    return r ? { elegir: r.querySelector('[data-recursos-elegir]'), libro: r.querySelector('[data-recursos-libro]') } : null;
  }

  alClic(e) {
    const el = e.target.closest ? e.target.closest('[data-recursos-abrir], [data-recursos-volver]') : null;
    const c = this.cajas;
    if (!el || !c || !this.raiz.contains(el)) return;
    const abrir = el.hasAttribute('data-recursos-abrir');
    c.elegir.hidden = abrir;
    c.libro.hidden = !abrir;
    /* El foco sigue a lo que se ve y dice DONDE estas: al abrir, «Elegir otra cosa» (lo primero
       del editor); al volver, la pregunta «¿Qué vas a subir?» (tiene tabindex="-1"). */
    const destino = abrir ? c.libro.querySelector('[data-recursos-volver]') : c.elegir.querySelector('#recursos-pregunta');
    if (destino) destino.focus();
  }

  /* Al salir, se vuelve a las tarjetas (nada se guarda: la proxima vez que entre, de cero) */
  olvidar() {
    const c = this.cajas;
    if (!c) return;
    c.elegir.hidden = false;
    c.libro.hidden = true;
  }
}
