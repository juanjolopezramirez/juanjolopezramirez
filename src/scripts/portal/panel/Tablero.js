/* SELF-MODE → TABLERO (components/portal/Tablero.astro): la rueda de la vida de Fraterni.

   La rueda ya viene dibujada en la pagina (60 botones, uno por dominio). Aqui pasa lo demas:
     · se trae LA SEMANA (lunes a domingo) y cada dominio se pinta como «cargué mi cruz», «no cargué mi
       cruz» o «sin revisar»;
     · al elegir un dominio se abre su ficha: lo que mide, el interruptor (cruz o moneda, sin medios), una
       nota de «¿qué moviste?» y las ultimas semanas de ese dominio;
     · las PIEDRAS ANGULARES de cada eje: la vigente y las de antes (cambian con la etapa y la persona).

   Es privado: solo el admin (con su codigo, RLS en supabase/009_tablero.sql) y NADA se guarda en el
   navegador (las pruebas prohiben el almacenamiento y el HTML escrito a mano: todo entra con textContent).
   Al salir (`olvidar`) se borra de la pagina lo que se vio. Si guardar falla, lo escrito se queda donde esta
   y se dice: nunca se pierde en silencio. El estado en pantalla es siempre el CONFIRMADO por la base. */
import { Seccion } from './Seccion.js';
import { EJES, dominioDe, ejeDe, areaDe } from '../../../data/portal/tablero.js';
import { FECHA_MIN, deIso, fechaLocal, piedrasDe, resumen, semanaDe, sumarSemanas } from '../tablero.js';

const ESPERA_MS = 15000;
const ESTADO = (l) => (l ? (l.cargue ? 'cargue' : 'no-cargue') : 'sin');

export class Tablero extends Seccion {
  /** @param {Element} raiz  @param {object} ctx */
  constructor(raiz, ctx) {
    super(raiz.querySelector('[data-tablero]'), ctx);
    this.tx = (ctx.p && ctx.p.tablero) || {};
    this.semana = '';                // el lunes de la semana que se ve
    this.estaSemana = '';            // el lunes de hoy
    this.lecturas = new Map();       // clave → { cargue, nota } de la semana que se ve
    this.piedras = [];               // las filas de la base
    this.elegido = '';               // el dominio con la ficha abierta
    this.turno = 0;                  // para ignorar lo que llega tarde (otra semana ya pedida)
    this.turnoFicha = 0;
    this.turnoPiedras = 0;
    this.listo = false;              // ¿ya llego la lectura de ESTA semana? Sin ella no se guarda (se pisaria una nota que no se vio)
    this.sucio = false;              // ¿se escribio en la ficha? Lo que llega tarde no se lo pisa
    if (!this.caja) return;
    const q = (s) => this.caja.querySelector(s);
    this.rueda = q('[data-tab-rueda]');
    this.celdas = [...this.rueda.querySelectorAll('[data-clave]')];
    this.ficha = q('[data-tab-ficha]');
    this.vacio = q('[data-tab-vacio]');
    this.lista = q('[data-tab-lista]');
    this.anilloFoco = q('[data-tab-foco]');
    this.anilloElegido = q('[data-tab-elegido]');
    this.guardarBoton = this.ficha.querySelector('[type="submit"]');
    this.celdas.forEach((c) => c.addEventListener('click', () => this.elegir(c.getAttribute('data-clave'))));
    this.rueda.addEventListener('keydown', (e) => this.alTeclear(e));
    /* el aro del foco es un dibujo APARTE, al final: asi no lo tapan los vecinos que se pintan despues */
    this.rueda.addEventListener('focusin', (e) => { const c = e.target.closest ? e.target.closest('[data-clave]') : null; if (c) this.anilloFoco.setAttribute('d', c.getAttribute('d')); });
    this.rueda.addEventListener('focusout', () => this.anilloFoco.setAttribute('d', ''));
    this.lista.addEventListener('change', () => { if (this.lista.value) this.elegir(this.lista.value, true); });
    this.ficha.addEventListener('input', () => { this.sucio = true; });
    this.ficha.addEventListener('change', () => { this.sucio = true; });
    this.caja.querySelectorAll('[data-tab-semana]').forEach((b) => b.addEventListener('click', () => this.moverSemana(Number(b.getAttribute('data-tab-semana')))));
    this.ficha.addEventListener('submit', (e) => { e.preventDefault(); this.guardar(); });
    q('[data-tab-cerrar]').addEventListener('click', () => this.cerrarFicha(true));
    this.caja.querySelectorAll('[data-tab-piedra-form]').forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault();
      this.cambiarPiedra(f.closest('[data-tab-piedra]').getAttribute('data-tab-piedra'), f);
    }));
    this.celdas[0].setAttribute('tabindex', '0');           // un solo punto de tabulacion para toda la rueda
  }

  /* ---- Entrar y salir ------------------------------------------------------------- */
  alEntrar() {
    if (!this.caja || !this.ctx.esAdmin || !this.ctx.be || !this.ctx.be.tablero) return;
    const hoy = semanaDe(new Date());
    /* Si pasaron dias con el panel abierto y se cambio de semana, se salta a la de hoy */
    if (!this.semana || this.estaSemana !== hoy) { this.estaSemana = hoy; this.semana = hoy; }
    this.limpiar();
    this.cargarSemana();
    this.cargarPiedras();
  }

  olvidar() {
    this.turno++; this.turnoFicha++; this.turnoPiedras++;
    this.lecturas = new Map(); this.piedras = []; this.elegido = ''; this.semana = ''; this.estaSemana = '';
    if (!this.caja) return;
    this.listo = false; this.sucio = false;
    this.cerrarFicha(false);
    this.ficha.reset();
    this.ficha.querySelector('[data-tab-historial]').replaceChildren();
    this.ficha.querySelector('[data-tab-historial-vacio]').hidden = true;
    this.lista.value = '';
    this.caja.querySelectorAll('[data-tab-piedra-actual], [data-tab-piedra-desde]').forEach((e) => { e.textContent = ''; });
    this.caja.querySelectorAll('[data-tab-piedra-lista]').forEach((e) => { e.textContent = ''; });
    this.caja.querySelectorAll('[data-tab-piedra-form]').forEach((f) => f.reset());
    this.caja.querySelectorAll('[data-tab-clave-arco]').forEach((k) => { k.toggleAttribute('hidden', true); });
    this.pintar();
    this.limpiar();
  }

  get be() { return this.ctx.be && this.ctx.be.tablero; }
  fechaCorta(iso) { return deIso(iso).toLocaleDateString(this.ctx.lang, { day: 'numeric', month: 'long' }); }
  textoSemana(iso) { return (this.tx.semanaDel || '{fecha}').replace('{fecha}', this.fechaCorta(iso)); }

  mostrarError(texto) {
    const el = this.caja.querySelector(':scope > [data-error]');
    if (!el) return;
    el.textContent = '';
    el.hidden = false;
    setTimeout(() => { el.textContent = texto; }, 30);
  }

  /* ---- La semana ---------------------------------------------------------------------- */
  async cargarSemana() {
    const turno = ++this.turno, semana = this.semana;
    this.listo = false;
    this.pintar();
    const r = await this.ctx.aTiempo(this.be.lecturas(semana), ESPERA_MS);
    if (turno !== this.turno || !this.caja.isConnected) return;          // ya se pidio otra, o se salio
    if (!r || r.error) { this.mostrarError((this.tx.errores || {}).cargar || ''); return; }      // sin lectura no hay «Guardar»: la ficha seguiria vacia y pisaria lo que hay
    this.lecturas = new Map((r.filas || []).map((f) => [f.clave, { cargue: !!f.cargue, nota: typeof f.nota === 'string' ? f.nota : '' }]));
    this.listo = true;
    this.pintar();
    if (this.elegido) this.llenarFicha(true);
  }

  moverSemana(n) {
    const nueva = sumarSemanas(this.semana, n);
    if (nueva > this.estaSemana || nueva < FECHA_MIN) return;             // el futuro no se revisa, ni lo que la base no aceptaria
    this.semana = nueva;
    this.lecturas = new Map();
    this.sucio = false;
    this.limpiar();
    this.cargarSemana();
    if (this.elegido) this.llenarFicha();
  }

  pintarSemana() {
    const t = this.caja.querySelector('[data-tab-semana-texto]');
    const es = this.semana === this.estaSemana;
    const texto = !this.semana ? '' : es ? `${this.tx.estaSemana} · ${this.textoSemana(this.semana)}` : this.textoSemana(this.semana);
    if (t.textContent !== texto) t.textContent = texto;           // (solo si cambia: si no, el lector lo anuncia dos veces)
    const sig = this.caja.querySelector('[data-tab-semana="1"]');
    const ant = this.caja.querySelector('[data-tab-semana="-1"]');
    ant.disabled = sumarSemanas(this.semana, -1) < FECHA_MIN;
    const apagar = this.semana >= this.estaSemana;
    if (apagar && !sig.disabled && document.activeElement === sig) t.focus();      // un boton apagado con el foco lo pierde: pasa al texto
    sig.disabled = apagar;
  }

  /* Pone cada dominio en su estado (con su nombre accesible) y cuenta */
  pintar() {
    this.pintarSemana();
    const estados = this.tx.estados || {};
    for (const c of this.celdas) {
      const clave = c.getAttribute('data-clave');
      const e = ESTADO(this.lecturas.get(clave));
      c.setAttribute('data-estado', e);
      const d = dominioDe(clave), ar = areaDe(d.area), x = ejeDe(d.eje);
      const dicho = e === 'cargue' ? estados.cargue : e === 'no-cargue' ? estados.noCargue : estados.sin;
      c.setAttribute('aria-label', `${d.nombre}, ${ar.nombre}, ${x.nombre}: ${dicho}`);
      if (clave === this.elegido) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
    }
    const dom = this.elegido && this.celdas.find((x) => x.getAttribute('data-clave') === this.elegido);
    this.anilloElegido.setAttribute('d', dom ? dom.getAttribute('d') : '');
    this.guardarBoton.disabled = !this.listo;
    const r = resumen([...this.lecturas].map(([clave, l]) => ({ clave, cargue: l.cargue })));
    /* el resumen solo se dice cuando la semana ya llego (antes diria «60 por revisar» sin saberlo) */
    const resumenTexto = this.listo ? (this.tx.resumen || '').replace('{c}', r.todo.cargue).replace('{n}', r.todo.noCargue).replace('{s}', r.todo.sinRevisar) : '';
    const el = this.caja.querySelector('[data-tab-resumen]');
    if (el.textContent !== resumenTexto) el.textContent = resumenTexto;
  }

  /* ---- Moverse por la rueda con el teclado --------------------------------------------- */
  alTeclear(e) {
    const c = e.target && e.target.closest ? e.target.closest('[data-clave]') : null;
    if (!c || e.altKey || e.ctrlKey || e.metaKey) return;          // Alt+← (atras) y compañia son del navegador
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.elegir(c.getAttribute('data-clave')); return; }
    const i = this.celdas.indexOf(c);
    const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, PageDown: 5, PageUp: -5 }[e.key];
    let j = -1;
    if (paso) j = (i + paso + this.celdas.length) % this.celdas.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = this.celdas.length - 1;
    if (j < 0) return;
    e.preventDefault();
    this.celdas.forEach((x) => x.setAttribute('tabindex', '-1'));
    this.celdas[j].setAttribute('tabindex', '0');
    this.celdas[j].focus();
  }

  /* ---- La ficha de un dominio ------------------------------------------------------------ */
  elegir(clave, desdeLista = false) {
    if (!dominioDe(clave)) return;
    this.elegido = clave;
    this.sucio = false;
    this.lista.value = clave;
    this.celdas.forEach((x) => x.setAttribute('tabindex', x.getAttribute('data-clave') === clave ? '0' : '-1'));
    this.llenarFicha();
    this.ficha.hidden = false;
    this.vacio.hidden = true;
    this.pintar();
    if (!desdeLista) this.ficha.querySelector('[data-tab-ficha-titulo]').focus();      // desde la lista el foco se queda donde esta: se puede seguir bajando por ella
    this.cargarHistorial(clave);
  }

  /* `conservar`: llego la semana mientras se escribia; lo escrito no se pisa */
  llenarFicha(conservar = false) {
    const d = dominioDe(this.elegido);
    if (!d) return;
    const f = this.ficha;
    f.querySelector('[data-tab-ficha-titulo]').textContent = d.nombre;
    f.querySelector('[data-tab-ficha-donde]').textContent = (this.tx.ficha.donde || '').replace('{eje}', ejeDe(d.eje).nombre).replace('{area}', areaDe(d.area).nombre);
    f.querySelector('[data-tab-ficha-mide]').textContent = d.mide;
    if (conservar && this.sucio) return;
    const l = this.lecturas.get(this.elegido);
    const valor = ESTADO(l);
    f.querySelectorAll('[name="estado"]').forEach((r) => { r.checked = r.value === valor; });
    f.elements.nota.value = l ? l.nota : '';
    this.sucio = false;
    this.limpiarFicha();
  }

  limpiarFicha() {
    this.ficha.querySelectorAll('[data-tab-ficha-error], [data-tab-ficha-aviso]').forEach((e) => { e.hidden = true; e.textContent = ''; });
  }

  cerrarFicha(devolverFoco) {
    const clave = this.elegido;
    this.elegido = '';
    this.turnoFicha++;
    if (!this.ficha) return;
    this.ficha.hidden = true;
    this.vacio.hidden = false;
    this.limpiarFicha();
    this.celdas.forEach((x) => x.removeAttribute('aria-current'));
    this.anilloElegido.setAttribute('d', '');
    this.lista.value = '';
    if (devolverFoco && clave) { const c = this.celdas.find((x) => x.getAttribute('data-clave') === clave); if (c) c.focus(); }
  }

  /* Guardar: «sin revisar» borra la lectura; lo otro la pone. Si falla, la ficha se queda como esta. */
  async guardar() {
    if (!this.elegido || !this.listo) return;
    const clave = this.elegido, semana = this.semana;
    const estado = (this.ficha.querySelector('[name="estado"]:checked') || {}).value;
    const nota = this.ficha.elements.nota.value;
    const err = this.ficha.querySelector('[data-tab-ficha-error]');
    const aviso = this.ficha.querySelector('[data-tab-ficha-aviso]');
    err.hidden = true; aviso.hidden = true;
    if (!estado) { err.textContent = this.tx.ficha.pregunta; err.hidden = false; return; }
    const boton = this.ficha.querySelector('[type="submit"]');
    this.turno++;                       // una lectura de la semana que venga en camino es anterior a este guardado: no debe pisarlo
    await this.ctx.conOcupado(boton, async () => {
      const r = await this.ctx.aTiempo(estado === 'sin' ? this.be.quitar(semana, clave) : this.be.marcar({ semana, clave, cargue: estado === 'cargue', nota }), ESPERA_MS);
      if (!this.caja.isConnected) return;
      if (!r || r.error) { err.textContent = (this.tx.errores || {}).guardar || ''; err.hidden = false; return; }
      if (semana === this.semana) {
        if (estado === 'sin') this.lecturas.delete(clave);
        else this.lecturas.set(clave, { cargue: estado === 'cargue', nota: String(nota || '').trim() });
        this.sucio = false;
        this.pintar();
      }
      aviso.hidden = false;
      aviso.textContent = this.tx.ficha.guardado;
      aviso.focus();
      this.cargarHistorial(clave);
    }, () => { err.textContent = (this.tx.errores || {}).guardar || ''; err.hidden = false; });
  }

  /* Las ultimas semanas de ESE dominio */
  async cargarHistorial(clave) {
    const turno = ++this.turnoFicha;
    const lista = this.ficha.querySelector('[data-tab-historial]'), vacio = this.ficha.querySelector('[data-tab-historial-vacio]');
    lista.textContent = ''; vacio.hidden = true;
    const r = await this.ctx.aTiempo(this.be.historial(clave), ESPERA_MS);
    if (turno !== this.turnoFicha || clave !== this.elegido) return;
    if (!r || r.error) return;                                            // el historial es un extra: sin el, la ficha sirve igual
    const filas = r.filas || [];
    if (!filas.length) { vacio.hidden = false; return; }
    const estados = this.tx.estados || {};
    for (const f of filas) {
      const li = document.createElement('li');
      li.className = 'tab__semana-fila';
      const quien = document.createElement('p');
      quien.className = 'tab__semana-fila-estado tab__semana-fila-estado--' + (f.cargue ? 'cargue' : 'no');
      quien.textContent = `${(this.tx.ficha.semana || '{fecha}').replace('{fecha}', this.fechaCorta(f.semana))}: ${f.cargue ? estados.cargue : estados.noCargue}`;
      const nota = document.createElement('p');
      nota.className = 'tab__semana-fila-nota';
      nota.textContent = f.nota || this.tx.ficha.sinNota;
      li.append(quien, nota);
      lista.appendChild(li);
    }
  }

  /* ---- Las piedras angulares ---------------------------------------------------------------- */
  async cargarPiedras() {
    const turno = ++this.turnoPiedras;
    const r = await this.ctx.aTiempo(this.be.piedras(), ESPERA_MS);
    if (turno !== this.turnoPiedras || !this.caja.isConnected) return;          // se salio mientras llegaba: no se vuelven a poner
    if (!r || r.error) { this.mostrarError((this.tx.errores || {}).cargar || ''); return; }
    this.piedras = r.filas || [];
    this.pintarPiedras();
  }

  /* La piedra angular de cada eje es UNA DE SUS TRES AREAS: aqui se dice cual es (con su fecha), se deja
     elegida en su lista, y la rueda pone una clave de arco en el borde de esa area. */
  pintarPiedras() {
    const por = piedrasDe(this.piedras, fechaLocal(new Date()));
    const tp = this.tx.piedras || {};
    const nombreArea = (id) => (areaDe(id) || { nombre: '' }).nombre;
    const vigentes = new Set();
    for (const eje of EJES) {
      const li = this.caja.querySelector(`[data-tab-piedra="${eje.id}"]`);
      if (!li) continue;
      const { actual, anteriores } = por[eje.id];
      const valida = actual && eje.areas.some((x) => x.id === actual.piedra) ? actual : null;
      if (valida) vigentes.add(valida.piedra);
      li.querySelector('[data-tab-piedra-actual]').textContent = valida ? nombreArea(valida.piedra) : tp.ninguna;
      li.querySelector('[data-tab-piedra-desde]').textContent = valida ? (tp.desde || '{fecha}').replace('{fecha}', this.fechaCorta(valida.desde)) : '';
      const select = li.querySelector('select[name="piedra"]');
      select.value = valida ? valida.piedra : '';
      const det = li.querySelector('[data-tab-piedra-antes]'), lista = li.querySelector('[data-tab-piedra-lista]');
      lista.textContent = '';
      const antes = anteriores.filter((x) => eje.areas.some((y) => y.id === x.piedra));
      det.hidden = !antes.length;
      for (const ant of antes) {
        const x = document.createElement('li');
        x.textContent = `${nombreArea(ant.piedra)} · ${(tp.desde || '{fecha}').replace('{fecha}', this.fechaCorta(ant.desde))}`;
        lista.appendChild(x);
      }
    }
    this.caja.querySelectorAll('[data-tab-clave-arco]').forEach((k) => { k.toggleAttribute('hidden', !vigentes.has(k.getAttribute('data-tab-clave-arco'))); });      // (un <path> SVG no tiene .hidden: es del HTML)
  }

  async cambiarPiedra(eje, form) {
    const campo = form.elements.piedra, err = form.querySelector('[data-tab-piedra-error]');
    err.hidden = true;
    const piedra = campo.value;
    if (!piedra) { err.textContent = this.ctx.textoDe('tableroPiedraVacia'); err.hidden = false; return; }
    const boton = form.querySelector('[type="submit"]');
    await this.ctx.conOcupado(boton, async () => {
      const r = await this.ctx.aTiempo(this.be.ponerPiedra({ eje, piedra, desde: fechaLocal(new Date()) }), ESPERA_MS);
      if (!this.caja.isConnected) return;
      if (!r || r.error) { err.textContent = r && r.error && r.error !== 'red' && r.error !== 'generico' ? this.ctx.textoDe(r.error) : (this.tx.errores || {}).piedra; err.hidden = false; return; }
      await this.cargarPiedras();
      const area = areaDe(piedra);
      this.avisar((this.tx.piedras.cambiada || '').replace('{piedra}', () => (area ? area.nombre : '')));
    }, () => { err.textContent = (this.tx.errores || {}).piedra || ''; err.hidden = false; });
  }
}
