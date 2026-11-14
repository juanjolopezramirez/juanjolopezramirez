/* COMPARTIR UN LIBRO CON UN ENLACE PRIVADO (etapa A3a). La ventana «Compartir» del Taller.

   Dos cosas, en este orden:
     1. LA EDICION: el autor saca su PDF con «Hacer el PDF», lo guarda y lo sube aqui. Se revisa (RevisarPdf.js: paginas,
        proporcion, titulo, que no traiga la direccion del Taller impresa, que el contenido salte a donde dice), se pinta
        cada pagina a 1600 px en WebP (y la de 900 sale de reducir esa), se sube todo a `taller/<libro>/ediciones/<id>/` y, AL FINAL, se escribe la fila:
        una edicion a medias no existe. De cada libro quedan las 5 ultimas.
     2. LOS ENLACES: un secreto de 32 bytes al azar (crypto.getRandomValues) que se ve UNA VEZ, en una direccion
        https://<sitio>/<idioma>/vista/#k=<secreto>. La base solo guarda su huella (SHA-256). Vence a los 7, 30 o 90 dias
        (nunca «para siempre») y se puede apagar; un enlace apagado no se vuelve a encender.

   Aqui no se guarda el secreto en ninguna parte: vive en el cuadro de «tu enlace» hasta que se cierra la ventana o se crea otro.
   Todo texto de la pagina se escribe con textContent. Lo que sube y baja pasa por be.taller (real.js / demo.js). */
import { crearToken, direccion, diasValidos, estadoDe, huella, nombreLimpio, vencimiento, DIAS, DIAS_POR_DEFECTO, EDICIONES_MAX } from '../../../../contenido/taller/Enlaces.js';
import { hojasDeEdicion } from '../../../../contenido/taller/PaginasEdicion.js';
import { revisarPdf } from '../../../../contenido/taller/RevisarPdf.js';
import { revisarArchivo } from '../../../archivos.js';
import { mirar, pintar } from './LeerEdicion.js';

const poner = (t, datos) => Object.entries(datos || {}).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), t || '');
const SUBIDAS_A_LA_VEZ = 4;
const ANCHOS = [900, 1600];
const AZAR_ID = () => crypto.randomUUID();
const pad = (n) => String(n).padStart(3, '0');

export const rutasDeEdicion = (obraId, id, paginas) => {
  const base = `taller/${obraId}/ediciones/${id}/`;
  const rutas = [`${base}original.pdf`];
  for (let n = 1; n <= paginas; n++) for (const w of ANCHOS) rutas.push(`${base}p${pad(n)}-${w}.webp`);
  return rutas;
};

export class Publicar {
  /* `contexto()` → { obraId, titulo, idioma, ratioLibro, numeros, paginasMesa } (guardado y medido al momento);
     `obraId()` el id del libro abierto (barato: para repintar la lista sin guardar ni medir); `be()` el backend de ahora; `lang` el idioma de la pagina para la direccion */
  constructor(dialogo, { tx, be, contexto, obraId, textoDe, fecha, lang }) {
    Object.assign(this, { dialogo, tx, be, contexto, obraId, textoDe, fecha, lang });
    const q = (s) => dialogo.querySelector(s);
    this.q = q;
    this.actual = q('[data-cp-actual]');
    this.duro = q('[data-cp-duro]');
    this.archivo = q('[data-cp-archivo]');
    this.subir = q('[data-cp-subir]');
    this.parar = q('[data-cp-parar]');
    this.estado = q('[data-cp-estado]');
    this.avance = q('[data-cp-avance]');
    this.titulo = q('[data-cp-enlaces-titulo]');
    this.fallas = q('[data-cp-fallas]');
    this.lista = q('[data-cp-lista]');
    this.nombre = q('[data-cp-nombre]');
    this.dias = q('[data-cp-dias]');
    this.crear = q('[data-cp-crear]');
    this.nuevo = q('[data-cp-nuevo]');
    this.direccion = q('[data-cp-direccion]');
    this.copiar = q('[data-cp-copiar]');
    this.dicho = q('[data-cp-dicho]');
    this.cerrarBoton = q('[data-cp-cerrar]');
    this.ocupado = false;
    this.turno = 0;
    this.vida = 0;
    this.ultima = null;
    for (const d of DIAS) {
      const o = document.createElement('option');
      o.value = String(d);
      o.textContent = poner(tx.cpDias, { n: d });
      if (d === DIAS_POR_DEFECTO) o.selected = true;
      this.dias.append(o);
    }
    this.subir.addEventListener('click', () => { if (!this.ocupado) this.archivo.click(); });
    this.archivo.addEventListener('change', () => {
      const f = this.archivo.files && this.archivo.files[0];
      this.archivo.value = '';
      if (f) this.leer(f);
    });
    this.parar.addEventListener('click', () => { this.turno++; this.avance.textContent = ''; this.estado.textContent = this.tx.cpParando; });
    this.crear.addEventListener('click', () => this.nuevoEnlace());
    this.copiar.addEventListener('click', () => this.copiarEnlace());
    this.direccion.addEventListener('focus', () => this.direccion.select());
    this.cerrarBoton.addEventListener('click', () => this.cerrar());
    /* Mientras sube no se cierra con Escape: se para con «Parar» y se limpia lo subido */
    dialogo.addEventListener('cancel', (e) => { if (this.ocupado) e.preventDefault(); });
    dialogo.addEventListener('close', () => this.olvidarSecreto());
  }

  /* Al salir del libro o de la sesion: se cierra, se para lo que corria y no queda ningun secreto a la vista */
  cerrarYa() {
    this.vida++;
    this.turno++;
    this.olvidarSecreto();
    if (this.dialogo.open) this.dialogo.close();
  }

  cerrar() { if (!this.ocupado && this.dialogo.open) this.dialogo.close(); }

  olvidarSecreto() {
    this.direccion.value = '';
    this.nuevo.hidden = true;
    this.dicho.textContent = '';
  }

  async abrir() {
    const be = this.be();
    if (!be || !be.taller || this.dialogo.open) return;
    this.fallas.replaceChildren();
    this.estado.textContent = '';
    this.olvidarSecreto();
    this.dialogo.showModal();
    this.subir.focus();
    await this.pintar();
  }

  /* ---- La lista: ediciones, y de cada una sus enlaces ---- */
  async pintar(enfocar = false) {
    const be = this.be(), vida = this.vida, obraId = this.obraId();
    if (!be || !obraId) { this.estado.textContent = this.tx.cpNoLibro; return; }
    this.lista.setAttribute('aria-busy', 'true');
    try {
      const r = await be.taller.ediciones(obraId);
      if (vida !== this.vida) return;
      if (r.error) { this.estado.textContent = this.textoDe(r.error); return; }
      const filas = r.filas;
      const enlaces = await Promise.all(filas.map((e) => be.taller.enlaces(e.id)));
      if (vida !== this.vida) return;
      this.ultima = filas[0] || null;
      this.actual.textContent = filas[0] ? poner(this.tx.cpActual, { fecha: this.fecha(filas[0].creado), n: filas[0].paginas }) : this.tx.cpNinguna;
      this.crear.disabled = !filas[0] || this.ocupado;
      this.lista.replaceChildren(...filas.map((e, i) => this.edicion(e, enlaces[i].ok ? enlaces[i].filas : null, i === 0, obraId)));
      if (enfocar && !this.ocupado) this.titulo.focus();
    } finally { if (!this.ocupado) this.lista.removeAttribute('aria-busy'); }
  }

  edicion(e, enlaces, esLaUltima, obraId) {
    const li = document.createElement('li');
    li.className = 'tal-comp__edicion';
    const cab = document.createElement('div');
    cab.className = 'tal-comp__cab';
    const t = document.createElement('span');
    t.textContent = poner(this.tx.cpEdicionDe, { fecha: this.fecha(e.creado), n: e.paginas }) + (esLaUltima ? ` · ${this.tx.cpLaUltima}` : '');
    const activos = enlaces ? enlaces.filter((l) => estadoDe(l) === 'activo').length : 0;
    const seguro = activos ? poner(activos === 1 ? this.tx.cpQuitarSeguro1 : this.tx.cpQuitarSeguroN, { n: activos }) : this.tx.cpQuitarSeguro;
    const quitar = this.boton(this.tx.cpQuitarEdicion, seguro, () => this.quitarEdicion(e, obraId));
    cab.append(t, quitar);
    const ul = document.createElement('ul');
    ul.className = 'tal-comp__enlaces';
    ul.setAttribute('role', 'list');
    if (!enlaces) {
      const x = document.createElement('li');
      x.textContent = this.tx.cpNoLeo;
      ul.append(x);
    } else for (const l of enlaces) ul.append(this.enlace(l));
    li.append(cab, ul);
    return li;
  }

  enlace(l) {
    const li = document.createElement('li');
    li.className = 'tal-comp__enlace';
    const estado = estadoDe(l);
    li.dataset.estado = estado;
    const nombre = document.createElement('strong');
    nombre.textContent = l.nombre || this.tx.cpSinNombre;
    const det = document.createElement('span');
    const hasta = estado === 'activo' ? poner(this.tx.cpAbreHasta, { fecha: this.fecha(l.vence) })
      : estado === 'apagado' ? this.tx.cpApagado : poner(this.tx.cpVencio, { fecha: this.fecha(l.vence) });
    const vistas = l.vistas === 1 ? this.tx.cpUnaVista : poner(this.tx.cpVistas, { n: l.vistas || 0 });
    det.textContent = [hasta, vistas, l.ultimaVista ? poner(this.tx.cpUltima, { fecha: this.fecha(l.ultimaVista) }) : ''].filter(Boolean).join(' · ');
    li.append(nombre, det);
    if (estado === 'activo') li.append(this.boton(this.tx.cpApagar, this.tx.cpApagarSeguro, () => this.apagar(l)));
    return li;
  }

  /* Un boton de dos pasos: el primero pide confirmar con el mismo boton, y se desarma si se va el foco */
  boton(texto, seguro, accion) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tal-btn';
    b.textContent = texto;
    let armado = false;
    const desarmar = () => { armado = false; b.dataset.armado = ''; b.textContent = texto; };
    b.addEventListener('click', () => {
      if (!armado) { armado = true; b.dataset.armado = '1'; b.textContent = seguro; return; }
      desarmar();
      accion();
    });
    b.addEventListener('blur', desarmar);
    return b;
  }

  /* ---- Apagar, quitar ---- */
  async apagar(l) {
    const be = this.be();
    const r = await be.taller.apagarEnlace(l.id);
    if (r.error) { this.estado.textContent = this.textoDe(r.error); return; }
    this.estado.textContent = this.tx.cpYaApagado;
    await this.pintar(true);
  }

  /* Borra los archivos de una edicion y dice cuantos no se pudieron quitar (solo ocupan espacio) */
  async quitarArchivos(obraId, id, paginas) {
    const b = await this.be().taller.borrarArchivos(obraId, rutasDeEdicion(obraId, id, paginas));
    return b && b.ok ? Number(b.faltan) || 0 : paginas * 2 + 1;
  }

  async quitarEdicion(e, obraId) {
    const be = this.be();
    const r = await be.taller.borrarEdicion(e.id);
    if (r.error) { this.estado.textContent = this.textoDe(r.error); return; }
    const faltan = await this.quitarArchivos(obraId, e.id, e.paginas);
    this.estado.textContent = faltan ? poner(this.tx.cpSueltos, { n: faltan }) : this.tx.cpEdicionQuitada;
    await this.pintar(true);
  }

  /* ---- Crear un enlace ---- */
  async nuevoEnlace() {
    const be = this.be();
    if (!be || !this.ultima || this.ocupado) return;
    this.ocupado = true;
    this.crear.disabled = true;
    this.olvidarSecreto();
    const vida = this.vida;
    try {
      const token = crearToken();
      const h = await huella(token);
      const r = await be.taller.crearEnlace({
        edicionId: this.ultima.id, hash: h.bytea, nombre: nombreLimpio(this.nombre.value),
        vence: vencimiento(diasValidos(this.dias.value))
      });
      if (vida !== this.vida) return;
      if (r.error) { this.estado.textContent = this.textoDe(r.error); return; }
      this.estado.textContent = '';
      this.direccion.value = direccion(window.location.origin, this.lang, token);
      this.nuevo.hidden = false;
      this.nombre.value = '';
      this.direccion.focus();
      this.direccion.select();
      await this.pintar();
    } finally {
      this.ocupado = false;
      this.crear.disabled = !this.ultima;
    }
  }

  async copiarEnlace() {
    const url = this.direccion.value;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.dicho.textContent = this.tx.cpCopiado;
    } catch (e) {
      this.direccion.focus();
      this.direccion.select();
      this.dicho.textContent = this.tx.cpNoCopio;
    }
  }

  /* ---- Subir una edicion ---- */
  falla(clave, datos) {
    const li = document.createElement('li');
    li.textContent = poner(this.tx[clave] || this.textoDe('generico'), datos);
    this.fallas.append(li);
  }

  ocuparTodo(si) {
    this.ocupado = si;
    this.subir.disabled = si;
    this.duro.disabled = si;
    this.crear.disabled = si || !this.ultima;
    this.cerrarBoton.disabled = si;
    this.parar.hidden = !si;
    if (si) this.lista.setAttribute('aria-busy', 'true'); else this.lista.removeAttribute('aria-busy');
  }

  /* El avance se ve en cada pagina, pero solo se ANUNCIA (region «status») en la primera, cada 10 y la ultima */
  progreso(texto, n, total) {
    this.avance.textContent = texto;
    if (n === 1 || n === total || n % 10 === 0) this.estado.textContent = texto;
  }

  async leer(archivo) {
    if (this.ocupado) return;
    const turno = ++this.turno, vida = this.vida;
    const be = this.be();
    this.fallas.replaceChildren();
    this.avance.textContent = '';
    this.estado.textContent = '';
    this.ocuparTodo(true);
    this.parar.focus();
    let leido = null, id = '', obraId = '';
    const subidas = [];
    let pendientes = [];
    const vigente = () => turno === this.turno && vida === this.vida;
    try {
      const c = await this.contexto();
      if (!c) { this.estado.textContent = this.tx.cpNoLibro; return; }
      obraId = c.obraId;
      id = AZAR_ID();
      const carpeta = `taller/${obraId}/ediciones/${id}/`;
      /* ¿Es un PDF de verdad (sus primeros bytes), y no pasa del tope? */
      const mira = await revisarArchivo(`${carpeta}original.pdf`, archivo);
      if (mira.error) { id = ''; this.falla(mira.error === 'archivoTipo' ? 'edNoPdf' : mira.error === 'archivoGrande' ? 'edTope' : 'edArchivo'); return; }

      this.estado.textContent = this.tx.cpMirando;
      try {
        leido = await mirar(archivo, { sigue: vigente, alPagina: (n, t) => this.progreso(poner(this.tx.cpMirandoPagina, { n, total: t }), n, t) });
      } catch (e) { id = ''; this.falla('edNoAbre'); return; }
      if (!vigente()) { id = ''; this.estado.textContent = vida === this.vida ? this.tx.cpParado : ''; return; }
      const rev = revisarPdf({
        paginas: leido.paginas, ratioPdf: leido.ratio, ratioLibro: c.ratioLibro, titulo: c.titulo, tituloPdf: leido.titulo,
        textos: leido.textos, saltos: leido.saltos, numeros: c.numeros, paginasMesa: c.paginasMesa
      });
      if (rev.errores.length) {
        id = '';
        rev.errores.forEach((x) => this.falla(x.clave, x));
        this.estado.textContent = this.tx.cpNoSube;
        return;
      }
      const hojas = hojasDeEdicion(leido.datos, leido.anchos, leido.altos);
      if (hojas.error) { id = ''; this.falla(hojas.error === 'grande' ? 'edGrande' : 'edLargo', { max: 300 }); return; }
      rev.avisos.forEach((x) => this.falla(x.clave, x));

      /* De cada libro quedan 5: si ya hay 5, sale la mas vieja SIN enlaces abiertos. Si todas los tienen, no se sube. */
      const previas = await be.taller.ediciones(obraId);
      if (previas.error) { id = ''; this.estado.textContent = this.textoDe(previas.error); return; }
      const sobran = previas.filas.length + 1 - EDICIONES_MAX;
      let aQuitar = [];
      if (sobran > 0) {
        const todos = await Promise.all(previas.filas.map((e) => be.taller.enlaces(e.id)));
        if (todos.some((x) => !x.ok)) { id = ''; this.falla('cpNoLeo'); return; }
        const libres = previas.filas.map((e, i) => ({ e, n: todos[i].filas.length, activos: todos[i].filas.filter((l) => estadoDe(l) === 'activo').length }))
          .filter((x) => !x.activos).reverse();
        if (libres.length < sobran) { id = ''; this.falla('cpTodasConEnlaces'); this.estado.textContent = this.tx.cpNoSube; return; }
        aQuitar = libres.slice(0, sobran);
      }

      /* El original primero; despues cada pagina a sus dos anchos. Se rinde a la primera que falla. */
      const guardar = async (ruta, blob, nombre) => {
        const r = await be.taller.subir(ruta, new File([blob], nombre, { type: blob.type || (ruta.endsWith('.pdf') ? 'application/pdf' : 'image/webp') }));
        if (r.error) throw Object.assign(new Error('subida'), { clave: r.error });
        subidas.push(ruta);
      };
      const esperar = async (limite) => { while (pendientes.length > limite) { await Promise.race(pendientes); pendientes = pendientes.filter((p) => !p.listo); } };
      const lanzar = (ruta, blob, nombre) => {
        const p = guardar(ruta, blob, nombre).then(() => { p.listo = true; }, (e) => { p.listo = true; throw e; });
        pendientes.push(p);
        /* un fallo se atiende aqui y se atiende de nuevo en Promise.all: que no quede «sin atender» */
        p.catch(() => {});
        return p;
      };
      this.estado.textContent = this.tx.cpGuardando;
      await guardar(`${carpeta}original.pdf`, archivo, 'original.pdf');
      for (let n = 1; n <= leido.paginas; n++) {
        if (!vigente()) throw Object.assign(new Error('parado'), { clave: 'parado' });
        this.progreso(poner(this.tx.cpPagina, { n, total: leido.paginas }), n, leido.paginas);
        const p = await pintar(leido.doc, n);
        if (p.error) throw Object.assign(new Error(p.error), { clave: p.error });
        lanzar(`${carpeta}p${pad(n)}-1600.webp`, p.grande, `p${n}-1600.webp`);
        await esperar(SUBIDAS_A_LA_VEZ - 1);
        lanzar(`${carpeta}p${pad(n)}-900.webp`, p.chica, `p${n}-900.webp`);
        await esperar(SUBIDAS_A_LA_VEZ - 1);
      }
      await Promise.all(pendientes);
      if (!vigente()) throw Object.assign(new Error('parado'), { clave: 'parado' });

      /* LA FILA, al final: hasta aqui, de esta edicion solo hay archivos sueltos */
      const r = await be.taller.crearEdicion({
        id, obraId, titulo: c.titulo, idioma: c.idioma, paginas: leido.paginas, ratio: Math.round(leido.ratio * 10000) / 10000,
        blando: !this.duro.checked, hojas: hojas.hojas
      });
      if (r.error) throw Object.assign(new Error('fila'), { clave: r.error });
      subidas.length = 0;
      id = '';

      /* Sale la mas vieja sin enlaces abiertos; se dice cuantos enlaces (apagados o vencidos) se van con ella */
      let muertos = 0, sueltos = 0;
      for (const { e, n } of aQuitar) {
        const b = await be.taller.borrarEdicion(e.id);
        if (b.ok) { muertos += n; sueltos += await this.quitarArchivos(obraId, e.id, e.paginas); }
      }
      this.estado.textContent = sueltos ? poner(this.tx.cpSueltos, { n: sueltos }) : muertos ? poner(this.tx.cpQuitaron, { n: muertos }) : this.tx.cpListo;
    } catch (e) {
      /* Lo que se alcanzo a subir de una edicion que no llego a existir se quita: primero se espera a las que iban en
         camino, y se piden TODAS las rutas posibles (quitar una que no existe no falla). */
      await Promise.allSettled(pendientes);
      if (obraId && id) { try { await be.taller.borrarArchivos(obraId, rutasDeEdicion(obraId, id, leido ? leido.paginas : 300)); } catch (x) { /* quedan sueltos: solo ocupan espacio */ } }
      const clave = e && e.clave;
      this.estado.textContent = '';
      if (clave === 'parado') this.estado.textContent = this.tx.cpParado;
      else if (clave === 'edSinWebp') this.falla('edSinWebp');
      else { this.falla('cpFalla'); if (clave) this.estado.textContent = this.textoDe(clave); }
    } finally {
      this.avance.textContent = '';
      if (leido && leido.doc) { try { leido.doc.loadingTask.destroy(); } catch (x) { /* ya cerrado */ } }
      this.ocuparTodo(false);
      if (this.dialogo.open) this.subir.focus();
    }
    if (vida === this.vida && this.dialogo.open) await this.pintar();
  }
}
