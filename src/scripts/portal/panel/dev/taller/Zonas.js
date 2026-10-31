/* MARCAR ZONAS sobre una pagina de diseño: se arrastra con el dedo o el raton, y siempre se puede
   escribir la posicion con numeros (quien no puede arrastrar tambien marca). Todo en % de la
   pagina (Zona.js), asi cae igual a cualquier tamaño.

   Al escribir un numero no se reconstruye la fila: el foco se quedaria sin lugar. Solo cambia el
   dibujo, y si el valor se corrigio (una zona no puede ser menor que el minimo), se dice. */
import { Zona, ZONA_MIN } from '../../../../contenido/taller/Zona.js';

const nuevoId = () => 'z-' + [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('');
const CAMPOS = ['x', 'y', 'w', 'h'];

export class Zonas {
  /* `lienzo`: la caja de la pagina. `lista`: donde van los campos. `alCambiar(zonas)` guarda.
     `vuelta`: a donde va el foco al quitar la ultima. */
  constructor(lienzo, lista, pagina, { tx, alCambiar, vuelta }) {
    Object.assign(this, { lienzo, lista, tx, alCambiar, vuelta });
    this.zonas = pagina.zonas.map((z) => new Zona(z));
    this.activo = false;
    this.lienzo.addEventListener('pointerdown', (e) => this.empezar(e));
    this.aviso = document.createElement('p');
    this.aviso.className = 'tal-aviso';
    this.aviso.setAttribute('role', 'status');
    this.filas = document.createElement('div');
    this.filas.className = 'tal-zonas';
    this.lista.append(this.filas, this.aviso);
    this.pintarFilas();
    this.dibujar();
  }

  marcando(si) { this.activo = si; this.lienzo.classList.toggle('tal-lienzo--marcar', si); }

  punto(e) {
    const r = this.lienzo.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  }

  empezar(e) {
    if (!this.activo || e.button !== 0) return;
    e.preventDefault();
    const a = this.punto(e);
    const marco = document.createElement('div');
    marco.className = 'tal-zona tal-zona--nueva';
    this.lienzo.append(marco);
    const rect = (b) => ({ x: Math.max(0, Math.min(a.x, b.x)), y: Math.max(0, Math.min(a.y, b.y)), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) });
    const mover = (ev) => {
      const r = rect(this.punto(ev));
      Object.assign(marco.style, { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` });
    };
    const terminar = () => {
      this.lienzo.removeEventListener('pointermove', mover);
      this.lienzo.removeEventListener('pointerup', soltar);
      this.lienzo.removeEventListener('pointercancel', terminar);
      marco.remove();
    };
    const soltar = (ev) => {
      terminar();
      const r = rect(this.punto(ev));
      if (r.w >= ZONA_MIN && r.h >= ZONA_MIN) this.agregar(r);
    };
    this.lienzo.setPointerCapture(e.pointerId);
    this.lienzo.addEventListener('pointermove', mover);
    this.lienzo.addEventListener('pointerup', soltar);
    this.lienzo.addEventListener('pointercancel', terminar);
  }

  agregar(r = { x: 15, y: 40, w: 70, h: 30 }, enfocar = false) {
    this.zonas.push(new Zona({ ...r, id: nuevoId(), nombre: `${this.tx.zona} ${this.zonas.length + 1}` }));
    this.pintarFilas();
    this.cambio();
    if (enfocar) this.filas.lastElementChild.querySelector('input').focus();
  }

  quitar(i) {
    this.zonas.splice(i, 1);
    this.pintarFilas();
    this.cambio();
    const fila = this.filas.children[Math.max(0, i - 1)];
    (fila ? fila.querySelector('input') : this.vuelta).focus();
  }

  cambio() {
    this.dibujar();
    this.alCambiar(this.zonas.map((z) => z.aDatos()));
  }

  dibujar() {
    this.lienzo.querySelectorAll('.tal-zona').forEach((n) => n.remove());
    for (const z of this.zonas) {
      const caja = document.createElement('div');
      caja.className = 'tal-zona';
      Object.assign(caja.style, { left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` });
      caja.textContent = z.nombre;
      this.lienzo.append(caja);
    }
    const cruzadas = this.zonas.some((a, i) => this.zonas.some((b, j) => j > i && a.seCruzaCon(b)));
    this.aviso.textContent = cruzadas ? this.tx.zonasCruzadas : '';
  }

  pintarFilas() { this.filas.replaceChildren(...this.zonas.map((z, i) => this.fila(z, i))); }

  fila(z, i) {
    const f = document.createElement('fieldset');
    f.className = 'tal-zona-fila';
    const l = document.createElement('legend');
    l.textContent = z.nombre;
    f.append(l);
    const campos = {};
    for (const c of CAMPOS) {
      const et = document.createElement('label');
      const s = document.createElement('span');
      s.textContent = this.tx.camposZona[c];
      const inp = document.createElement('input');
      inp.type = 'number'; inp.step = '0.5'; inp.min = '0'; inp.max = '100'; inp.value = String(z[c]);
      campos[c] = inp;
      inp.addEventListener('change', () => {
        const pedido = Number(inp.value);
        const nueva = new Zona({ ...this.zonas[i].aDatos(), [c]: pedido });
        this.zonas[i] = nueva;
        CAMPOS.forEach((k) => { campos[k].value = String(nueva[k]); });
        this.cambio();
        if (nueva[c] !== pedido) this.aviso.textContent = this.tx.zonaCorregida.replace('{valor}', String(nueva[c]));
      });
      et.append(s, inp);
      f.append(et);
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'portal__boton portal__boton--suave';
    b.textContent = this.tx.quitarZona;
    b.setAttribute('aria-label', `${this.tx.quitarZona}: ${z.nombre}`);
    b.addEventListener('click', () => this.quitar(i));
    f.append(b);
    return f;
  }
}
