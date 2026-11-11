/* LAS IMAGENES DEL LIBRO EN PANTALLA. Viven en un cajon privado y la politica del sitio solo deja
   imagenes del propio sitio o «data:». Se bajan con la sesion del admin y se vuelven direcciones
   «data:»: asi no hace falta abrir la politica, y un lienzo no serviria porque la vista clona los
   nodos (un lienzo clonado sale en blanco).

   Se piden de a pocas y una sola vez cada una: un libro de PDF abre decenas a la vez. Las que mas tiempo
   llevan sin usarse salen de la memoria a los 64 MB. Se quedan un rato tras cerrar el libro (Taller.js):
   su ruta nunca cambia de contenido, asi que volver enseguida no las baja otra vez.

   Una imagen de imprenta ocupa 17 MB ya abierta: con veinte en la mesa el navegador las suelta y al volver a
   ellas la hoja sale vacia un momento. Por eso la mesa ve una copia liviana (`vista`), y el PDF usa la
   original (`dame`). */
const TOPE = 64 * 1024 * 1024;
const A_LA_VEZ = 4;
const INTENTOS = 3;
const ESPERA_MS = 600;
const LIMITE_MS = 30000;              // una descarga colgada no puede tapar la fila para las demas
const aDireccion = (blob) => new Promise((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.onerror = () => mal(new Error('imagen'));
  r.readAsDataURL(blob);
});
const esperar = (ms) => new Promise((ok) => { setTimeout(ok, ms); });
const ANCHO_VISTA = 1400;
const CALIDAD_VISTA = .85;

async function aVista(dir) {
  const i = new Image();
  i.src = dir;
  await i.decode();
  if (i.naturalWidth <= ANCHO_VISTA) return dir;
  const c = document.createElement('canvas');
  c.width = ANCHO_VISTA;
  c.height = Math.round((i.naturalHeight * ANCHO_VISTA) / i.naturalWidth);
  c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
  /* Un navegador que no sabe hacer WebP devuelve PNG, que pesa diez veces mas: entonces JPEG */
  const webp = c.toDataURL('image/webp', CALIDAD_VISTA);
  return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', CALIDAD_VISTA);
}

export class Imagenes {
  constructor(bajar, espera = ESPERA_MS, limite = LIMITE_MS) {
    Object.assign(this, { bajar, espera, limite });
    this.mapa = new Map();
    this.vistas = new Map();          // ruta → la promesa de su copia liviana
    this.total = 0;
    this.turno = 0;
    this.enCurso = new Map();         // ruta → su promesa: dos hojas iguales no la bajan dos veces
    this.cola = [];
    this.activas = 0;
  }

  async dame(ruta) {
    if (!ruta) return '';
    if (this.mapa.has(ruta)) {
      const v = this.mapa.get(ruta);
      this.mapa.delete(ruta);
      this.mapa.set(ruta, v);
      return v;
    }
    if (this.enCurso.has(ruta)) return this.enCurso.get(ruta);
    const p = this.traer(ruta, this.turno).finally(() => { if (this.enCurso.get(ruta) === p) this.enCurso.delete(ruta); });
    this.enCurso.set(ruta, p);
    return p;
  }

  /* La de la mesa. Si la copia no se puede hacer, se ve la original. */
  vista(ruta) {
    if (!this.vistas.has(ruta)) {
      const p = this.dame(ruta).then((d) => (d ? aVista(d).catch(() => d) : ''));
      p.then((d) => { if (!d && this.vistas.get(ruta) === p) this.vistas.delete(ruta); });
      this.vistas.set(ruta, p);
    }
    return this.vistas.get(ruta);
  }

  async traer(ruta, turno) {
    await this.entrar();
    try {
      for (let i = 0; i < INTENTOS && turno === this.turno; i++) {
        if (i) await esperar(this.espera * i);
        const r = await Promise.race([this.bajar(ruta), esperar(this.limite).then(() => ({ error: 'red' }))]);
        /* Lo que llega tarde, tras cerrar la sesion, no vuelve a la memoria */
        if (r && r.ok) { const dir = await aDireccion(r.blob); return turno === this.turno ? this.guardar(ruta, dir) : ''; }
        if (!r || r.error !== 'red') return '';
      }
      return '';
    } catch (e) { return ''; } finally { this.salir(); }
  }

  entrar() {
    if (this.activas < A_LA_VEZ) { this.activas++; return Promise.resolve(); }
    return new Promise((ok) => { this.cola.push(ok); });
  }

  salir() {
    const siguiente = this.cola.shift();
    if (siguiente) siguiente(); else this.activas--;
  }

  guardar(ruta, dir) {
    this.mapa.set(ruta, dir);
    this.total += dir.length;
    for (const [k, v] of this.mapa) {
      if (this.total <= TOPE || k === ruta) break;
      this.mapa.delete(k);
      this.total -= v.length;
    }
    return dir;
  }

  /* De un blob recien hecho: se ve sin esperar a la red */
  async poner(ruta, blob) { return this.guardar(ruta, await aDireccion(blob)); }

  /* { mapa, faltan }: faltan son las que no se pudieron traer. Un PDF no sale con huecos en silencio. */
  async todas(rutas) {
    const mapa = {}, faltan = [];
    for (const r of rutas) { const d = await this.dame(r); if (d) mapa[r] = d; else faltan.push(r); }
    return { mapa, faltan };
  }

  olvidar() { this.mapa.clear(); this.vistas.clear(); this.enCurso.clear(); this.total = 0; this.turno += 1; }
}
