/* LAS PAGINAS DE LA IZQUIERDA, con tres maneras de verlas:
     «Hojas»     cada hoja en miniatura, con su capitulo arriba (la de siempre);
     «Capítulos» una sola fila por capitulo (nombre, papel, paginas, cuantas son de PDF), que se abre para ver sus hojas;
     «PDF»       solo las hojas que vienen de un PDF, juntas por PDF.
   Las dos ultimas son solo texto y numeros: no copian ninguna hoja, asi un libro de 300 paginas se pinta igual de rapido.
   La vista elegida vive en una variable del modulo (dura mientras la pestaña este abierta; nada se guarda en el navegador).

   Una pagina libre se arrastra sola; una pagina de texto no, porque sale de como corre el texto: lo que se arrastra es
   el capitulo, por su nombre. Soltar sobre un texto pone la pagina al terminar un parrafo: nunca parte una frase.

   Pintar una miniatura copia su hoja, asi que solo se pintan las que estan a la vista. */
import { grupoDe, paginaDe } from '../../../../contenido/taller/OrigenPdf.js';

const crear = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; };
const ESCALA = .2;
const ANCHO_MAX = 112;            // lo que cabe en la columna, para hojas grandes como carta u oficio
const DESARMAR_MS = 3000;         // lo mismo que el boton rojo del panel
const PROPIOS = new Set(['pagina', 'paginas', 'capitulo']);   // lo que esta columna pone al arrastrar
export const VISTAS = ['hojas', 'capitulos', 'pdf'];

/* La vista de la barra y los capitulos abiertos en «Capítulos» (por id): en el modulo, no en el navegador */
let VISTA = 'hojas';
const ABIERTOS = new Set();

export class Miniaturas {
  constructor(caja, mesa) {
    Object.assign(this, { caja, mesa });
    this.linea = crear('div', 'marca-soltar');
    this.arrastrado = null;
    this.pedidas = new Map();
    this.barra = caja.parentNode.querySelector('[data-tal-vistas]');
    this.preparar();
    caja.addEventListener('keydown', (e) => this.alTeclear(e));
    caja.addEventListener('contextmenu', (e) => {
      const b = e.target.closest('.mini');
      if (b) { mesa.abrirMenu(Number(b.dataset.n) - 1, e, b); return; }
      /* Sobre el nombre de un capitulo: cambiarlo, sacarlo del contenido, unirlo con el de antes */
      const t = e.target.closest('.cap-mini, .cap-fila');
      if (t && t.capitulo) { mesa.abrirMenuCapitulo(t.capitulo, e, t); return; }
      const g = e.target.closest('.pdf-cab');
      if (g && g.grupo) mesa.abrirMenuPdf(g.grupo, e, g);
    });
    this.visor = new IntersectionObserver((lista) => lista.forEach((e) => { if (e.isIntersecting) this.llenar(e.target); }), { root: caja, rootMargin: '300px' });
    caja.addEventListener('dragend', () => { this.arrastrado = null; this.linea.remove(); });
    caja.addEventListener('dragover', (e) => this.alPasar(e));
    caja.addEventListener('dragleave', (e) => { if (!caja.contains(e.relatedTarget)) this.linea.remove(); });
    caja.addEventListener('drop', (e) => this.alSoltar(e));
  }

  /* ---- El selector de vistas: un grupo de opciones, una sola parada de tabulador y flechas para cambiar ---- */
  preparar() {
    const b = this.barra;
    if (!b) return;
    const ops = [...b.querySelectorAll('[data-vista]')];
    this.marcarVista();
    ops.forEach((o) => o.addEventListener('click', () => this.ponerVista(o.dataset.vista)));
    b.addEventListener('keydown', (e) => {
      const i = ops.indexOf(document.activeElement), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (i < 0 || (d === undefined && e.key !== 'Home' && e.key !== 'End')) return;
      e.preventDefault();
      const k = e.key === 'Home' ? 0 : e.key === 'End' ? ops.length - 1 : (i + d + ops.length) % ops.length;
      this.ponerVista(ops[k].dataset.vista);
      ops[k].focus();
    });
  }

  get vista() { return VISTA; }

  ponerVista(v) {
    if (!VISTAS.includes(v) || v === VISTA) return;
    VISTA = v;
    this.marcarVista();
    this.pintar();
    this.mesa.decir(this.mesa.tx.vistaPuesta[v]);
  }

  marcarVista() {
    if (!this.barra) return;
    for (const o of this.barra.querySelectorAll('[data-vista]')) {
      const es = o.dataset.vista === VISTA;
      o.setAttribute('aria-checked', String(es));
      o.tabIndex = es ? 0 : -1;
    }
    this.caja.dataset.vista = VISTA;
  }

  /* Las copias de las paginas llevan el texto del libro: no se quedan al cerrarlo */
  vaciar() {
    clearTimeout(this.relojSupr);
    this.relojSupr = 0;
    this.arrastrado = null;
    this.visor.disconnect();
    this.pedidas = new Map();
    this.caja.replaceChildren();
  }

  /* Quien tiene el foco, para devolverselo a lo mismo despues de pintar */
  claveDeFoco() {
    const a = document.activeElement;
    if (!a || !this.caja.contains(a)) return '';
    if (a.dataset.n && a.classList.contains('mini')) return `n:${a.dataset.n}`;
    if (a.capitulo) return `c:${a.capitulo.cap.id}`;
    if (a.classList.contains('pdf-cab')) return `g:${a.dataset.g}`;
    return '';
  }

  enfocarClave(c) {
    const [t, v] = [c[0], c.slice(2)];
    if (t === 'n') this.enfocar(Number(v));
    else if (t === 'c') { const x = [...this.caja.querySelectorAll('.cap-mini, .cap-fila')].find((o) => o.capitulo && o.capitulo.cap.id === v); if (x) { this.caja.querySelectorAll('[tabindex="0"]').forEach((o) => { o.tabIndex = -1; }); x.tabIndex = 0; x.focus(); } }
    else if (t === 'g') { const x = this.caja.querySelector(`.pdf-cab[data-g="${v}"]`); if (x) { x.tabIndex = 0; x.focus(); } }
  }

  pintar() {
    const m = this.mesa, ant = this.caja.scrollTop, conFoco = this.claveDeFoco();
    this.visor.disconnect();
    this.caja.replaceChildren();
    this.pedidas = new Map();
    this.escala = Math.min(ESCALA, ANCHO_MAX / m.px.W);
    this.caja.dataset.vista = VISTA;
    if (VISTA === 'capitulos') this.pintarCapitulos();
    else if (VISTA === 'pdf') this.pintarPdf();
    else this.pintarHojas();
    this.caja.scrollTop = ant;
    this.marcar();
    if (conFoco) this.enfocarClave(conFoco);
  }

  /* Una hoja de la lista. `fila`: sin copia, solo su numero y lo que es (las vistas cortas). */
  crearMini(p, n, { fila = false, etiqueta = '', arrastrable = true } = {}) {
    const m = this.mesa, tx = m.tx, b = crear('div', fila ? 'mini mini--fila' : 'mini');
    b.tabIndex = -1;
    /* Un arbol que deja elegir varias: el capitulo arriba y sus paginas debajo */
    b.setAttribute('role', 'treeitem');
    b.setAttribute('aria-level', fila || p.vivo ? '2' : '1');
    b.setAttribute('aria-selected', String(m.estaElegida(p)));
    /* El nombre accesible lleva lo mismo que se ve: en las filas cortas, «PDF 3 · Capítulo»; en las hojas, que es de un PDF */
    const dePdf = p.vista && grupoDe(p.vista.node.attrs) ? this.etiquetaDe(p) : '';
    const nombre = `${tx.pagina2} ${n}${fila && etiqueta ? `. ${etiqueta}` : dePdf ? `. ${dePdf}` : ''}`;
    b.setAttribute('aria-label', nombre);
    b.dataset.n = String(n);
    if (fila) b.append(crear('span', 'mini__n', String(n)), crear('span', 'mini__etiqueta', etiqueta));
    else {
      b.append(crear('span', 'mini__n', String(n)), crear('span', 'mini__hoja'));
      b.lastChild.style.cssText = `width:${m.px.W * this.escala}px;height:${m.px.H * this.escala}px`;
    }
    /* De un PDF: una marca de la mesa («PDF», o «Sobra»), nunca del libro */
    const a = p.vista ? p.vista.node.attrs : null;
    if (a && grupoDe(a)) {
      b.dataset.pdf = a.sobra ? tx.miniSobra : tx.miniPdf;
      b.classList.toggle('mini--sobra', a.sobra === true);
      b.setAttribute('aria-description', a.sobra ? tx.selloSobra : tx.deUnPdf);
    }
    if (p.vista) {
      if (arrastrable) {
        b.draggable = true;
        b.title = tx.arrastrarPagina;
        const v = p.vista;
        /* Si es de las elegidas, se lleva el bloque; si no, se elige sola y va sola, como en las presentaciones */
        b.addEventListener('dragstart', (e) => {
          const k = Number(b.dataset.n) - 1, bloque = m.cuantasElegidas() > 1 && m.estaElegida(m.paginas[k]);
          if (!bloque) m.elegirMini(k, 'uno');
          this.arrastrado = bloque ? { varias: true } : { vista: v };
          e.dataTransfer.setData('text/plain', bloque ? 'paginas' : 'pagina');
          e.dataTransfer.effectAllowed = 'move';
        });
      }
      if (m.segura && m.seSale(p.vista)) { b.append(crear('span', 'punto')); b.setAttribute('aria-label', `${nombre}. ${tx.fueraDeZona}`); }
    }
    /* Como en las presentaciones: clic elige una, Mayus+clic las de en medio, Ctrl+clic suma o quita una */
    b.addEventListener('mousedown', (e) => { if (e.shiftKey) e.preventDefault(); });
    b.addEventListener('click', (e) => {
      const k = Number(b.dataset.n), modo = e.shiftKey ? 'rango' : e.ctrlKey || e.metaKey ? 'alternar' : 'uno';
      m.elegirMini(k - 1, modo, this.visibles());
      if (modo === 'uno') m.irA(k);
      else this.enfocar(k);   // Mayus+clic no mueve el foco solo: Supr y las flechas siguen desde aqui
    });
    this.pedidas.set(b, p);
    return b;
  }

  /* Las hojas que se ven ahora en la columna (indices de `mesa.paginas`): en «PDF» no estan las hojas de en medio que no son de
     un PDF, y un rango con Mayus no debe elegir lo que no se ve */
  visibles() { return new Set([...this.caja.querySelectorAll('.mini[data-n]')].map((b) => Number(b.dataset.n) - 1)); }

  /* El papel de un capitulo, escrito: «Introducción», lo que el autor puso en «Otro…», o '' */
  rolDe(c) { return c.rol ? (c.rol === 'custom' ? c.rolTexto : this.mesa.tx.roles[c.rol] || '') : ''; }

  /* ---- Hojas: la de siempre ---- */
  pintarHojas() {
    const m = this.mesa;
    let grupo = null, cap, n = 0;
    /* La portada del libro se llama asi, no «Capítulo 1», y los demas sin nombre cuentan desde despues de ella */
    const portada = m.vivos.length && m.conPortada() ? m.vivos[0] : null, nombres = m.nombresDeCapitulos();
    for (const p of m.paginas) {
      n++;
      if (p.vivo !== cap) {
        cap = p.vivo;
        grupo = crear('div', 'bloque-mini');
        grupo.setAttribute('role', 'none');
        if (cap) {
          const c = cap;
          const nombre = nombres[m.vivos.indexOf(c)];
          /* El texto de la fila es el mismo de siempre; el papel se dibuja aparte (data-rol), como una etiqueta */
          const t = crear('div', 'cap-mini');
          t.append(crear('span', 'cap-mini__nombre', `▤ ${nombre}`));
          const rol = this.rolDe(c);
          if (rol && c !== portada) { t.dataset.rol = rol; t.setAttribute('aria-description', `${m.tx.rolDelCapitulo}: ${rol}`); }
          t.setAttribute('role', 'treeitem');
          t.setAttribute('aria-level', '1');
          t.setAttribute('aria-selected', 'false');
          t.draggable = c !== portada;
          t.tabIndex = -1;
          t.title = m.tx.arrastrarCapitulo;
          if (c === portada) { t.classList.add('cap-mini--portada'); t.title = m.tx.arrastrarPortada; }
          /* Fuera del contenido: se ve apagado y lo dice */
          else if (!c.enIndice) { t.classList.add('cap-mini--fuera'); t.title = `${m.tx.fueraDelContenido}. ${m.tx.arrastrarCapitulo}`; t.setAttribute('aria-description', m.tx.fueraDelContenido); }
          t.capitulo = c;
          t.addEventListener('dragstart', (e) => { this.arrastrado = { capitulo: c }; e.dataTransfer.setData('text/plain', 'capitulo'); e.dataTransfer.effectAllowed = 'move'; });
          grupo.append(t);
        }
        this.caja.append(grupo);
      }
      grupo.append(this.crearMini(p, n));
    }
    for (const b of this.pedidas.keys()) this.visor.observe(b);
  }

  /* ---- Capitulos: una fila por capitulo ---- */
  pintarCapitulos() {
    const m = this.mesa, tx = m.tx, portada = m.vivos.length && m.conPortada() ? m.vivos[0] : null, nombres = m.nombresDeCapitulos();
    /* Una pasada por las paginas: de cual a cual va cada capitulo, y cuantas son de PDF. Solo numeros. */
    const res = new Map();
    m.paginas.forEach((p, i) => {
      if (p.indice) return;
      let r = res.get(p.vivo);
      if (!r) res.set(p.vivo, r = { primera: i + 1, ultima: i + 1, pdf: 0, sobra: 0 });
      r.ultima = i + 1;
      const a = p.vista ? p.vista.node.attrs : null;
      if (a && grupoDe(a)) { r.pdf++; if (a.sobra) r.sobra++; }
    });
    let n = 0, bloque = null, cap;
    for (const p of m.paginas) {
      n++;
      if (p.indice) {
        if (!bloque || !bloque.dataset.indice) {
          cap = null;
          bloque = crear('div', 'bloque-mini');
          bloque.dataset.indice = '1';
          bloque.setAttribute('role', 'none');
          bloque.append(this.filaDeIndice(n, tx));
          this.caja.append(bloque);
        } else bloque.firstChild.dataset.ultima = String(n);
        continue;
      }
      if (p.vivo === cap && bloque && !bloque.dataset.indice) continue;
      cap = p.vivo;
      bloque = crear('div', 'bloque-mini');
      bloque.setAttribute('role', 'none');
      const k = m.vivos.indexOf(cap), abierto = ABIERTOS.has(cap.cap.id);
      const fila = this.filaDeCapitulo(cap, nombres[k], res.get(cap), c => c === portada, abierto);
      bloque.append(fila);
      if (abierto) {
        /* Sus hojas, en un grupo que la fila posee: un lector de pantalla las cuenta como hijas de «su capitulo» */
        const hijas = this.grupoDeHijas(fila, `c${k}`);
        let q = 0;
        for (const x of m.paginas) {
          q++;
          if (x.vivo === cap) hijas.append(this.crearMini(x, q, { fila: true, etiqueta: this.etiquetaDe(x), arrastrable: false }));
        }
        bloque.append(hijas);
      }
      this.caja.append(bloque);
    }
    /* Donde se marca una introduccion o una conclusion: con las hojas elegidas, no con el nombre del capitulo */
    this.caja.append(crear('p', 'mini-ayuda', tx.marcarComoAyuda));
  }

  /* El grupo de hojas hijas de una fila que se abre: la fila lo posee (aria-owns) */
  grupoDeHijas(fila, id) {
    const g = crear('div', 'bloque-mini');
    g.setAttribute('role', 'group');
    g.id = `tal-hijas-${id}`;
    fila.setAttribute('aria-owns', g.id);
    return g;
  }

  filaDeIndice(n, tx) {
    const f = crear('div', 'cap-fila cap-fila--indice');
    f.setAttribute('role', 'treeitem');
    f.setAttribute('aria-level', '1');
    f.setAttribute('aria-selected', 'false');
    f.tabIndex = -1;
    f.dataset.n = String(n);
    f.dataset.ultima = String(n);
    f.append(crear('span', 'cap-fila__nombre', `☰ ${tx.contenido}`));
    f.addEventListener('click', () => this.mesa.irA(n));
    return f;
  }

  /* Que es una hoja, en pocas letras: «PDF 3», el nombre de una pagina libre, o «Texto» */
  etiquetaDe(p) {
    const tx = this.mesa.tx, a = p.vista ? p.vista.node.attrs : null;
    if (!a) return tx.hojaDeTexto;
    if (grupoDe(a)) { const k = paginaDe(a); return `${a.sobra ? tx.miniSobra : tx.miniPdf}${k ? ` ${k}` : ''}`; }
    return a.titulo || tx.paginaLibre;
  }

  filaDeCapitulo(c, nombre, r, esPortada, abierto) {
    const m = this.mesa, tx = m.tx, f = crear('div', 'cap-fila'), portada = esPortada(c), rol = this.rolDe(c);
    f.setAttribute('role', 'treeitem');
    f.setAttribute('aria-level', '1');
    f.setAttribute('aria-selected', 'false');
    f.setAttribute('aria-expanded', String(abierto));
    f.tabIndex = -1;
    f.draggable = !portada;
    f.title = portada ? tx.arrastrarPortada : tx.arrastrarCapitulo;
    f.dataset.n = String(r.primera);
    f.dataset.ultima = String(r.ultima);
    f.capitulo = c;
    f.setAttribute('aria-description', tx.capFilaAyuda);
    if (portada) f.classList.add('cap-fila--portada');
    else if (!c.enIndice) f.classList.add('cap-fila--fuera');
    const flecha = crear('button', 'cap-fila__flecha', abierto ? '▾' : '▸');
    flecha.type = 'button';
    flecha.tabIndex = -1;
    flecha.setAttribute('aria-label', abierto ? tx.capCerrar : tx.capAbrir);
    flecha.addEventListener('click', (e) => { e.stopPropagation(); this.abrirCapitulo(c, !abierto); });
    const paginas = r.primera === r.ultima ? tx.capPagina.replace('{a}', String(r.primera)) : tx.capPaginas.replace('{a}', String(r.primera)).replace('{b}', String(r.ultima));
    const datos = [paginas, r.pdf ? tx.capDePdf.replace('{n}', String(r.pdf)) : ''].filter(Boolean).join(' · ');
    f.append(flecha, crear('span', 'cap-fila__nombre', nombre), crear('span', 'cap-fila__datos', datos));
    const pie = crear('span', 'cap-fila__pie');
    if (!portada && !c.enIndice) pie.append(crear('span', 'marca-cap', tx.capOculto));
    if (!portada && !c.numerar && !c.rol) pie.append(crear('span', 'marca-cap', tx.capSinNumero));
    if (r.sobra) pie.append(crear('span', 'marca-cap marca-cap--sobra', tx.capSobran.replace('{n}', String(r.sobra))));
    /* El papel: siempre a la vista. La portada no lleva papel. */
    if (!portada) {
      const b = crear('button', `cap-fila__rol${rol ? ' cap-fila__rol--puesto' : ''}`, tx.capPapel.replace('{r}', rol || '—'));
      b.type = 'button';
      b.tabIndex = -1;
      b.setAttribute('aria-haspopup', 'menu');
      b.title = tx.rolDelCapitulo;
      b.addEventListener('click', (e) => { e.stopPropagation(); this.abrirPapel(c, b); });
      pie.append(b);
    }
    f.append(pie);
    f.addEventListener('click', () => m.irA(r.primera));
    f.addEventListener('dragstart', (e) => { this.arrastrado = { capitulo: c }; e.dataTransfer.setData('text/plain', 'capitulo'); e.dataTransfer.effectAllowed = 'move'; });
    return f;
  }

  abrirCapitulo(c, si) {
    if (si) ABIERTOS.add(c.cap.id); else ABIERTOS.delete(c.cap.id);
    this.caja.querySelectorAll('[tabindex="0"]').forEach((o) => { o.tabIndex = -1; });
    this.pintar();
    this.entrarAlCapitulo(c);
  }

  abrirPapel(c, origen) {
    const r = origen.getBoundingClientRect();
    this.mesa.menuDeRoles(c, r.left, r.bottom + 2, origen);
  }

  /* ---- PDF: solo las que vienen de un PDF, juntas por PDF ---- */
  pintarPdf() {
    const m = this.mesa, tx = m.tx, grupos = m.gruposDePdf(), nombres = m.nombresDeCapitulos();
    if (!grupos.length) { this.caja.append(crear('p', 'mini-vacio', tx.pdfVacio)); return; }
    const actual = m.paginas[m.paginaActual() - 1], vivoActual = actual ? actual.vivo : null;
    let numero = 0;
    grupos.forEach((g, gi) => {
      const bloque = crear('div', 'bloque-mini'), cuantas = g.paginas.length;
      bloque.setAttribute('role', 'none');
      const cab = crear('div', 'pdf-cab');
      cab.setAttribute('role', 'treeitem');
      cab.setAttribute('aria-level', '1');
      cab.setAttribute('aria-selected', 'false');
      cab.tabIndex = -1;
      cab.dataset.g = String(gi);
      cab.grupo = g;
      cab.setAttribute('aria-description', tx.pdfCabAyuda);
      if (g.sobra) cab.classList.add('pdf-cab--sobra');
      const plural = (una, varias) => (cuantas === 1 ? una : varias).replace('{n}', String(g.sobra ? 0 : ++numero)).replace('{p}', String(cuantas));
      const titulo = g.sobra ? plural(tx.pdfGrupoSobraUna, tx.pdfGrupoSobra) : plural(tx.pdfGrupoUna, tx.pdfGrupo);
      const primera = m.paginas[g.paginas[0].i].vista.node.attrs;
      cab.append(crear('span', 'pdf-cab__titulo', titulo));
      const nombre = [primera.nombre, g.claves.size > 1 ? tx.pdfEnCapitulos.replace('{n}', String(g.claves.size)) : ''].filter(Boolean).join(' · ');
      if (nombre) cab.append(crear('span', 'pdf-cab__nombre', nombre));
      const acciones = crear('span', 'pdf-cab__acciones');
      const boton = (texto, fn) => {
        const b = crear('button', 'pdf-cab__boton', texto);
        b.type = 'button';
        b.tabIndex = -1;
        b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
        return b;
      };
      acciones.append(boton(tx.pdfElegirTodas, () => m.elegirTodasDelPdf(g, vivoActual)), boton(tx.pdfCambiarCorto, () => m.pedirCambioPdf(g)));
      cab.append(acciones);
      cab.addEventListener('click', () => m.irA(g.paginas[0].i + 1));
      bloque.append(cab);
      const hijas = this.grupoDeHijas(cab, `g${gi}`);
      for (const q of g.paginas) {
        const nombreCap = g.claves.size > 1 ? nombres[m.vivos.indexOf(q.clave)] : '';
        const etiqueta = `${tx.pdfFila.replace('{p}', q.pagina ? String(q.pagina) : '?')}${nombreCap ? ` · ${nombreCap}` : ''}`;
        hijas.append(this.crearMini(m.paginas[q.i], q.i + 1, { fila: true, etiqueta, arrastrable: false }));
      }
      bloque.append(hijas);
      this.caja.append(bloque);
    });
  }

  llenar(b) {
    const p = this.pedidas.get(b);
    if (!p) return;
    this.visor.unobserve(b);
    const h = b.querySelector('.mini__hoja');
    if (h) h.replaceChildren(this.mesa.clon(p, this.escala));
  }

  /* La copia de una hoja se saca una vez: si su imagen llega despues, se saca de nuevo */
  refrescar(vista) {
    for (const [b, p] of this.pedidas) if (p.vista === vista && b.querySelector('.clon')) this.llenar(b);
  }

  refrescarTexto(vivo) {
    for (const [b, p] of this.pedidas) if (p.vivo === vivo && !p.vista && b.querySelector('.clon')) this.llenar(b);
  }

  marcar() {
    const a = this.mesa.paginaActual();
    const dentro = this.caja.contains(document.activeElement);
    this.caja.querySelectorAll('.mini').forEach((m) => {
      const es = Number(m.dataset.n) === a;
      m.setAttribute('aria-current', String(es));
      if (!dentro) m.tabIndex = es ? 0 : -1;
    });
    /* Una fila de capitulo es la actual cuando la hoja que se mira cae en ella (y, si tambien esta abierta, la hoja manda) */
    const hayHoja = this.caja.querySelector('.mini[aria-current="true"]');
    this.caja.querySelectorAll('.cap-fila').forEach((f) => {
      const es = a >= Number(f.dataset.n) && a <= Number(f.dataset.ultima);
      f.setAttribute('aria-current', String(es));
      if (!dentro) f.tabIndex = es && !hayHoja ? 0 : -1;
    });
    /* Una sola parada: si nada quedo en 0 (la hoja actual esta cerrada o en otra vista), la primera fila */
    if (!dentro && !this.caja.querySelector('[tabindex="0"]')) {
      const primera = this.caja.querySelector('.mini, .cap-fila, .pdf-cab');
      if (primera) primera.tabIndex = 0;
    }
  }

  marcarEleccion() {
    for (const [b, p] of this.pedidas) b.setAttribute('aria-selected', String(this.mesa.estaElegida(p)));
  }

  /* ---- El teclado: una sola parada, flechas para recorrer y Alt+flecha para mover ---- */
  entrar() { (this.caja.querySelector('[tabindex="0"]') || this.caja.querySelector('.mini, .cap-fila, .pdf-cab')).focus(); }

  enfocar(n) {
    let b = this.caja.querySelector(`.mini[data-n="${n}"]`);
    /* En «Capítulos» una hoja cerrada se alcanza por la fila de su capitulo */
    if (!b) b = [...this.caja.querySelectorAll('.cap-fila')].find((f) => n >= Number(f.dataset.n) && n <= Number(f.dataset.ultima));
    if (!b) return;
    this.caja.querySelectorAll('[tabindex="0"]').forEach((m) => { m.tabIndex = -1; });
    b.tabIndex = 0;
    b.focus();
  }

  async alTeclear(e) {
    const t = e.target, lista = [...this.caja.querySelectorAll('.cap-mini, .cap-fila, .pdf-cab, .mini')], i = lista.indexOf(t);
    if (i < 0) return;
    if (this.eligiendo(e, t, lista, i)) return;
    if (this.teclasDeFila(e, t)) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (t.dataset.n && t.classList.contains('mini')) { this.mesa.irA(Number(t.dataset.n)); this.mesa.entrarEnPagina(Number(t.dataset.n)); }
      return;
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    if (e.altKey && e.repeat) return;
    const d = e.key === 'ArrowUp' ? -1 : 1;
    if (!e.altKey) { const o = lista[i + d]; if (o) { lista.forEach((x) => { x.tabIndex = x === o ? 0 : -1; }); o.focus(); } return; }
    if (t.capitulo) { this.mesa.moverCapituloPaso(t.capitulo, d); this.entrarAlCapitulo(t.capitulo); return; }
    if (!t.classList.contains('mini') || VISTA !== 'hojas') return;
    const n = Number(t.dataset.n), p = this.mesa.paginas[n - 1];
    if (!p || !p.vista) { this.mesa.decir(this.mesa.tx.paginaDeTexto); return; }
    /* Una de varias elegidas: se mueve todo el bloque, y el foco va con el */
    if (this.mesa.cuantasElegidas() > 1 && this.mesa.estaElegida(p)) { this.mesa.moverVariasPaso(d); return; }
    await this.mesa.moverPaso(p.vista, d);
    this.enfocar(n + d);
  }

  /* Las teclas de una fila de capitulo («Capítulos») y de un PDF («PDF»). Devuelve true si la tecla era suya. */
  teclasDeFila(e, t) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (t.classList.contains('cap-fila') && t.capitulo) {
      const c = t.capitulo, abierto = t.getAttribute('aria-expanded') === 'true';
      if (e.key === 'ArrowRight') { e.preventDefault(); if (!abierto) this.abrirCapitulo(c, true); return true; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (abierto) this.abrirCapitulo(c, false); return true; }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.mesa.irA(Number(t.dataset.n)); return true; }
      if ((e.key === 'p' || e.key === 'P') && !e.shiftKey) {
        e.preventDefault();
        const b = t.querySelector('.cap-fila__rol');
        if (b) this.abrirPapel(c, b); else this.mesa.decir(this.mesa.tx.portadaSinPapel);
        return true;
      }
      return false;
    }
    if (t.classList.contains('cap-fila--indice') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.mesa.irA(Number(t.dataset.n)); return true; }
    if (t.classList.contains('pdf-cab') && t.grupo) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const a = this.mesa.paginas[this.mesa.paginaActual() - 1];
        this.mesa.elegirTodasDelPdf(t.grupo, a ? a.vivo : null);
        return true;
      }
    }
    return false;
  }

  /* Las teclas de elegir. Devuelve true si la tecla era suya. Supr pide dos pulsaciones, como el boton rojo. */
  eligiendo(e, t, lista, i) {
    const m = this.mesa, tx = m.tx, n = Number(t.dataset.n), ctrl = e.ctrlKey || e.metaKey, tecla = e.key.toLowerCase();
    const borrar = e.key === 'Delete' || e.key === 'Backspace';
    if (!borrar) { clearTimeout(this.relojSupr); this.relojSupr = 0; }
    if (ctrl && (tecla === 'z' || tecla === 'y')) { e.preventDefault(); m.historia(tecla === 'y' || e.shiftKey ? 'redo' : 'undo'); return true; }
    if (e.key === 'Escape' && m.cuantasElegidas()) { e.preventDefault(); m.soltarEleccion(true); return true; }
    if (!n || !t.classList.contains('mini')) return false;
    if (ctrl && tecla === 'a') { e.preventDefault(); m.elegirMini(n - 1, 'todas'); return true; }
    if (ctrl && e.key === ' ') { e.preventDefault(); m.elegirMini(n - 1, 'alternar'); return true; }
    if (e.shiftKey && !e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const o = lista[i + (e.key === 'ArrowUp' ? -1 : 1)];
      if (!o || !o.dataset.n || !o.classList.contains('mini')) return true;
      if (!m.eleccion.ancla) m.elegirMini(n - 1, 'uno');
      lista.forEach((x) => { x.tabIndex = x === o ? 0 : -1; });
      o.focus();
      m.elegirMini(Number(o.dataset.n) - 1, 'rango', this.visibles());
      return true;
    }
    if (borrar) {
      const p = m.paginas[n - 1];
      if (!p || !m.estaElegida(p)) return false;
      e.preventDefault();
      /* La tecla sostenida no confirma, y si lo elegido cambio desde la primera pulsacion se pregunta de nuevo */
      if (e.repeat) return true;
      if (this.relojSupr && this.armadaCon === m.eleccion) { clearTimeout(this.relojSupr); this.relojSupr = 0; m.borrarVarias(); return true; }
      clearTimeout(this.relojSupr);
      this.armadaCon = m.eleccion;
      const k = m.cuantasElegidas();
      m.decir(k > 1 ? tx.suprVarias.replace('{n}', String(k)) : tx.suprUna);
      this.relojSupr = setTimeout(() => { this.relojSupr = 0; }, DESARMAR_MS);
      return true;
    }
    return false;
  }

  entrarAlCapitulo(c) {
    const t = [...this.caja.querySelectorAll('.cap-mini, .cap-fila')].find((x) => x.capitulo === c);
    if (t) { this.caja.querySelectorAll('[tabindex="0"]').forEach((o) => { o.tabIndex = -1; }); t.tabIndex = 0; t.focus(); }
  }

  /* ---- Arrastrar ---- */
  /* Soltar hojas: delante de la hoja mas cercana. Soltar un capitulo en «Capítulos»: delante de la fila de otro capitulo. */
  destino(e) {
    const filas = VISTA === 'capitulos' ? '.cap-fila:not(.cap-fila--indice)' : VISTA === 'hojas' ? '.mini' : '.sin-destino';
    for (const m of this.caja.querySelectorAll(filas)) {
      const r = m.getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) return m;
    }
    return null;
  }

  alPasar(e) {
    if (!this.arrastrado) return;
    e.preventDefault();
    const m = this.destino(e);
    if (m) m.parentNode.insertBefore(this.linea, m); else this.caja.append(this.linea);
  }

  alSoltar(e) {
    if (!this.arrastrado) return;
    e.preventDefault();
    const m = this.destino(e), lo = this.arrastrado;
    this.arrastrado = null;
    this.linea.remove();
    /* Solo lo que salio de esta columna: si un arrastre se corto a medias, algo traido de fuera no lo hereda */
    if (!PROPIOS.has(e.dataTransfer.getData('text/plain'))) return;
    if (VISTA === 'pdf') return;
    const n = m ? Number(m.dataset.n) : 0;
    if (lo.varias) this.mesa.soltarVariasAntes(n);
    else if (lo.vista) this.mesa.moverPagina(lo.vista, n);
    else this.mesa.moverCapitulo(lo.capitulo, n);
  }
}
