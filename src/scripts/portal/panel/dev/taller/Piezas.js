/* LOS DISEÑOS DE FIGMA DENTRO DEL LIBRO: adjuntar, revisar la zona segura, marcar zonas,
   reemplazar y borrar.

   Adjuntar va en orden para no perder nada: primero el PDF original a la caja privada, luego la
   fila «procesando», luego la marca en el texto, y entonces cada pagina se pinta, se sube y se ve.

   LAS PAGINAS NUEVAS VAN APARTE hasta que estan todas (`parciales`, que no se guarda): si una falla,
   la pieza sigue siendo la de antes. Reemplazar conserva el lugar (el texto solo guarda el id) y las
   zonas pagina por pagina; antes hace una copia del libro, y si esa copia falla no sigue. */
import { Pieza, PAGINAS_MAX } from '../../../../contenido/taller/Pieza.js';
import { ConfigPagina } from '../../../../contenido/taller/ConfigPagina.js';
import { bytes } from '../../../../contenido/comun.js';
import { abrirPdf, leerPagina, medidasDelPdf } from './Pdf.js';
import { Zonas } from './Zonas.js';

const azar = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
const TOPE_BYTES = 3900000;          // el de supabase/012: las paginas de una pieza, su texto y sus zonas
const CADA_CUANTAS = 10;             // cada cuantas paginas se dice el avance a quien no ve la pantalla
const ARMADO_MS = 5000;

export class Piezas {
  constructor(caja, o) {
    Object.assign(this, { caja, ...o });        // tx, be, imagenes, obra(), pestana, alAviso, alDecir, alError, alInsertar, alQuitar, alCopia, alEditor
    this.piezas = new Map();
    this.vistas = new Map();                    // id → cajas del texto que muestran esta pieza
    this.parciales = new Map();                 // id → las paginas que van llegando
    this.abierta = '';
    this.segura = true;
    this.pendiente = '';
  }

  cargar(filas) { this.piezas = new Map(filas.map((f) => [f.id, new Pieza(f)])); }
  usadas() { return Object.fromEntries([...this.piezas].map(([k, p]) => [k, p.aDatos()])); }

  /* ---- La caja que se ve dentro del texto ---- */
  enTexto(id, dom) {
    if (!this.vistas.has(id)) this.vistas.set(id, new Set());
    this.vistas.get(id).add(dom);
    this.pintarEnTexto(id);
    return () => this.vistas.get(id).delete(dom);
  }

  pintarEnTexto(id) {
    const p = this.piezas.get(id);
    const paginas = this.parciales.get(id) || (p ? p.paginas : []);
    for (const dom of this.vistas.get(id) || []) {
      const cabeza = document.createElement('p');
      cabeza.className = 'tal-pieza__cabeza';
      const uno = paginas.length === 1 ? this.tx.piezaResumenUna : this.tx.piezaResumen;
      cabeza.textContent = p ? uno.replace('{nombre}', p.nombre).replace('{n}', String(paginas.length)) : this.tx.piezaNoEsta;
      const tiras = document.createElement('div');
      tiras.className = 'tal-pieza__tira';
      for (const g of p ? paginas.slice(0, 8) : []) {
        const img = document.createElement('img');
        img.alt = '';
        this.imagenes.dame(g.ruta).then((d) => { if (d) img.src = d; });
        tiras.append(img);
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'portal__boton portal__boton--suave';
      b.textContent = this.tx.revisar;
      if (p) b.setAttribute('aria-label', `${this.tx.revisar}: ${p.nombre}`);
      b.addEventListener('click', () => this.abrir(id, b));
      dom.replaceChildren(cabeza, tiras, ...(p ? [b] : []));
    }
  }

  /* ---- Adjuntar ---- */
  async adjuntar(archivo) {
    const obra = this.obra();
    const id = crypto.randomUUID();
    const ruta = `taller/${obra.id}/${id}/original-${azar()}.pdf`;
    let doc;
    try { doc = await abrirPdf(archivo); } catch (e) { this.alError('pdfNoAbre'); return; }
    try {
      const medidas = await medidasDelPdf(doc);
      if (medidas.paginas > PAGINAS_MAX) { this.alError('pdfLargo'); return; }
      const sube = await this.be.taller.subir(ruta, archivo);
      if (sube.error) { this.alError(sube.error); return; }
      const datos = new Pieza({ id, obraId: obra.id, nombre: archivo.name.replace(/\.pdf$/i, ''), pdf: ruta, anchoMm: medidas.anchoMm, altoMm: medidas.altoMm });
      const cr = await this.be.taller.crearPieza(datos.aDatos());
      if (cr.error) { this.alError(cr.error); return; }
      this.piezas.set(id, datos);
      this.alInsertar(id);
      if (await this.procesar(datos, doc, medidas.paginas)) { this.abrir(id); return; }
      /* No quedo entero: se quita la marca del texto, y lo subido queda en la caja privada */
      await this.be.taller.borrarPieza(id);
      this.piezas.delete(id);
      this.alQuitar(id);
    } finally { doc.loadingTask.destroy(); }
  }

  /* Devuelve si quedo entero. Mientras tanto, la pieza guardada no se toca. */
  async procesar(pieza, doc, total, cambios = {}) {
    const px = new ConfigPagina(this.obra().pagina).pxPara(pieza.dpi);
    const viejas = pieza.paginas;
    const nuevas = [];
    this.parciales.set(pieza.id, nuevas);
    this.alDecir(this.tx.leyendo.replace('{n}', '1').replace('{total}', String(total)));
    try {
      for (let n = 1; n <= total; n++) {
        const dice = this.tx.leyendo.replace('{n}', String(n)).replace('{total}', String(total));
        this.alAviso(dice);
        if (n % CADA_CUANTAS === 0) this.alDecir(dice);
        const g = await leerPagina(doc, n, px);
        const ruta = `taller/${pieza.obraId}/${pieza.id}/p${String(n).padStart(4, '0')}-${azar()}.${g.ext}`;
        const s = await this.be.taller.subir(ruta, new File([g.blob], `p${n}.${g.ext}`, { type: g.blob.type }));
        if (s.error) { this.alError(s.error); return false; }
        await this.imagenes.poner(ruta, g.blob);
        const antes = viejas[n - 1];
        nuevas.push({ n, ruta, w: g.w, h: g.h, texto: g.texto, alt: antes ? antes.alt : '', caja: g.caja, sangre: g.sangre, zonas: antes ? antes.zonas : [] });
        this.pintarEnTexto(pieza.id);
      }
    } catch (e) {
      this.alError('pdfNoAbre');
      return false;
    } finally {
      this.parciales.delete(pieza.id);
      this.alAviso('');
    }
    const limpia = new Pieza({ ...pieza.aDatos(), ...cambios, estado: 'lista', paginas: nuevas });
    const r = await this.guardar(limpia);
    if (!r.ok) { this.pintarEnTexto(pieza.id); return false; }
    this.piezas.set(pieza.id, limpia);
    this.pintarEnTexto(pieza.id);
    this.alAviso(this.tx.piezaLista);
    this.alDecir(this.tx.piezaLista);
    return true;
  }

  async guardar(pieza) {
    if (bytes(pieza.paginas) > TOPE_BYTES) { this.alError('tallerLleno'); return { error: 'lleno' }; }
    let r = await this.be.taller.guardarPieza(pieza.aDatos(), this.pestana);
    if (r.reintentar) { pieza.rev = r.rev; r = await this.be.taller.guardarPieza(pieza.aDatos(), this.pestana); }
    if (r.ok) pieza.rev = r.rev; else this.alError(r.error || 'conflicto');
    return r;
  }

  /* ---- Revisar una pieza ---- */
  cerrar() {
    const id = this.abierta;
    this.abierta = '';
    this.caja.hidden = true;
    this.caja.replaceChildren();
    const vuelta = this.origen;
    this.origen = null;
    if (id) (vuelta && vuelta.isConnected ? vuelta : this.alEditor()).focus();
  }

  abrir(id, origen) {
    const p = this.piezas.get(id);
    if (!p) return;
    this.abierta = id;
    if (origen) this.origen = origen;
    this.caja.hidden = false;
    const t = this.caja.ownerDocument.querySelector('template[data-tal-plantilla="pieza"]').content.cloneNode(true);
    const q = (s) => t.querySelector(s);
    q('[data-nombre]').textContent = p.nombre;
    q('[data-cerrar]').addEventListener('click', () => this.cerrar());
    this.pintarAvisos(q('[data-avisos]'), p);
    const interruptor = q('[data-segura]');
    interruptor.checked = this.segura;
    interruptor.addEventListener('change', () => { this.segura = interruptor.checked; this.caja.classList.toggle('tal-sin-segura', !this.segura); });
    this.caja.classList.toggle('tal-sin-segura', !this.segura);
    const ajuste = q('[data-ajuste]');
    ajuste.value = p.ajuste;
    ajuste.addEventListener('change', () => { p.ajuste = ajuste.value === 'cubrir' ? 'cubrir' : 'contener'; this.guardar(p); });
    const archivo = q('[data-archivo]');
    q('[data-reemplazar]').addEventListener('click', () => archivo.click());
    archivo.addEventListener('change', () => { if (archivo.files[0]) this.reemplazar(p, archivo.files[0]); archivo.value = ''; });
    const borrar = q('[data-borrar]');
    borrar.addEventListener('click', () => this.borrar(p, borrar));
    borrar.addEventListener('blur', () => this.desarmar(borrar));
    const lista = q('[data-paginas]');
    const m = new ConfigPagina(this.obra().pagina).aPorcentajes();
    p.paginas.forEach((g, i) => lista.append(this.pagina(p, g, i, m)));
    this.caja.replaceChildren(t);
    const activo = document.activeElement;
    if (origen || !activo || activo === document.body || activo.closest('[data-tal-barra]')) {
      const titulo = this.caja.querySelector('[data-nombre]');
      if (titulo) titulo.focus();
    }
  }

  pintarAvisos(ul, p) {
    const r = p.revisarContraLibro(new ConfigPagina(this.obra().pagina));
    const obra = this.obra().pagina;
    const dice = [];
    const lados = (l) => l.map((x) => this.tx.lados[x]).join(', ');
    if (!r.proporcion) dice.push(this.tx.avisoProporcion.replace('{pdf}', `${p.anchoMm} × ${p.altoMm}`).replace('{libro}', `${obra.anchoMm} × ${obra.altoMm}`));
    else if (!r.tamano) dice.push(this.tx.avisoTamano.replace('{pdf}', `${p.anchoMm} × ${p.altoMm}`).replace('{libro}', `${obra.anchoMm} × ${obra.altoMm}`));
    for (const f of r.fuera) dice.push((f.sangre ? this.tx.avisoSangre : this.tx.avisoFuera).replace('{n}', String(f.n)).replace('{lados}', lados(f.lados)));
    if (r.sinTexto.length) dice.push(this.tx.avisoSinTexto.replace('{n}', r.sinTexto.join(', ')));
    if (r.resolucionBaja) dice.push(this.tx.avisoResolucion);
    if (!dice.length) dice.push(this.tx.avisoTodoBien);
    ul.replaceChildren(...dice.map((d) => { const li = document.createElement('li'); li.textContent = d; return li; }));
  }

  pagina(p, g, i, m) {
    const f = document.createElement('figure');
    f.className = 'tal-hoja';
    const lienzo = document.createElement('div');
    lienzo.className = 'tal-lienzo';
    lienzo.style.aspectRatio = g.w && g.h ? `${g.w}/${g.h}` : '148/210';
    const img = document.createElement('img');
    img.alt = g.alt || g.texto.slice(0, 300) || `${this.tx.pagina2} ${g.n}`;
    this.imagenes.dame(g.ruta).then((d) => { if (d) img.src = d; });
    const segura = document.createElement('div');
    segura.className = 'tal-segura';
    Object.assign(segura.style, { top: `${m.sup}%`, bottom: `${m.inf}%`, left: `${m.izq}%`, right: `${m.der}%` });
    const rot = document.createElement('span');
    rot.textContent = this.tx.zonaSegura;
    segura.append(rot);
    lienzo.append(img, segura);
    const pie = document.createElement('figcaption');
    const titulo = document.createElement('p');
    titulo.textContent = `${this.tx.pagina2} ${g.n}`;
    const alt = document.createElement('label');
    const s = document.createElement('span');
    s.textContent = this.tx.altPagina;
    const inp = document.createElement('input');
    inp.className = 'portal__entrada'; inp.value = g.alt; inp.maxLength = 600;
    inp.addEventListener('change', () => { p.paginas[i] = { ...p.paginas[i], alt: inp.value }; this.guardar(p); });
    alt.append(s, inp);
    const acciones = document.createElement('div');
    acciones.className = 'tal-fila';
    const boton = (texto) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'portal__boton portal__boton--suave';
      b.textContent = texto;
      b.setAttribute('aria-label', `${texto}, ${this.tx.pagina2.toLowerCase()} ${g.n}`);
      return b;
    };
    const marcar = boton(this.tx.marcarZona);
    marcar.setAttribute('aria-pressed', 'false');
    const agregar = boton(this.tx.agregarZona);
    const ayuda = document.createElement('p');
    ayuda.className = 'tal-ayuda';
    ayuda.textContent = this.tx.marcarAyuda;
    ayuda.hidden = true;
    acciones.append(marcar, agregar);
    const lista = document.createElement('div');
    const zonas = new Zonas(lienzo, lista, g, { tx: this.tx, vuelta: agregar, alCambiar: (z) => { p.paginas[i] = { ...p.paginas[i], zonas: z }; this.guardar(p); } });
    marcar.addEventListener('click', () => {
      const si = marcar.getAttribute('aria-pressed') !== 'true';
      marcar.setAttribute('aria-pressed', String(si));
      ayuda.hidden = !si;
      zonas.marcando(si);
    });
    agregar.addEventListener('click', () => zonas.agregar(undefined, true));
    pie.append(titulo, alt, acciones, ayuda, lista);
    f.append(lienzo, pie);
    return f;
  }

  /* ---- Reemplazar y borrar ---- */
  avisarAqui(texto) {
    const el = this.caja.querySelector('[data-pieza-dice]');
    if (el) { el.textContent = texto; el.hidden = false; }
  }

  async reemplazar(p, archivo) {
    let doc;
    try { doc = await abrirPdf(archivo); } catch (e) { this.alError('pdfNoAbre'); return; }
    try {
      const m = await medidasDelPdf(doc);
      if (m.paginas > PAGINAS_MAX) { this.alError('pdfLargo'); return; }
      const perdidas = p.paginas.slice(m.paginas).flatMap((g) => g.zonas);
      if (perdidas.length && this.pendiente !== p.id) {
        this.pendiente = p.id;
        this.avisarAqui(this.tx.zonasPerdidas.replace('{zonas}', perdidas.map((z) => z.nombre).join(', ')));
        return;
      }
      this.pendiente = '';
      if (!(await this.alCopia('reemplazar'))) return;
      const ruta = `taller/${p.obraId}/${p.id}/original-${azar()}.pdf`;
      const s = await this.be.taller.subir(ruta, archivo);
      if (s.error) { this.alError(s.error); return; }
      const cambios = { pdf: ruta, anchoMm: m.anchoMm, altoMm: m.altoMm, nombre: archivo.name.replace(/\.pdf$/i, '') };
      if (await this.procesar(p, doc, m.paginas, cambios)) this.abrir(p.id);
    } finally { doc.loadingTask.destroy(); }
  }

  desarmar(boton) {
    clearTimeout(this.armado);
    if (boton.dataset.armado !== '1') return;
    boton.dataset.armado = '';
    boton.textContent = this.tx.borrar;
  }

  /* Dos pasos: se pide confirmar en el mismo boton, sin ventanas que se bloqueen */
  async borrar(p, boton) {
    if (boton.dataset.armado !== '1') {
      boton.dataset.armado = '1';
      boton.textContent = this.tx.confirmarBorrar;
      this.alDecir(this.tx.confirmarBorrar);
      this.armado = setTimeout(() => this.desarmar(boton), ARMADO_MS);
      return;
    }
    if (!(await this.alCopia('manual'))) return;
    const r = await this.be.taller.borrarPieza(p.id);
    if (r.error) { this.alError(r.error); return; }
    this.piezas.delete(p.id);
    await this.alQuitar(p.id);
    this.origen = null;
    this.cerrar();
    this.alDecir(this.tx.piezaBorrada);
  }

  olvidar() {
    this.piezas.clear();
    this.vistas.clear();
    this.parciales.clear();
    this.origen = null;
    this.abierta = '';
    this.caja.hidden = true;
    this.caja.replaceChildren();
  }
}
