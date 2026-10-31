/* LAS IMAGENES DEL LIBRO EN PANTALLA. Viven en un cajon privado y la politica del sitio solo deja
   imagenes del propio sitio o «data:». Se bajan con la sesion del admin y se vuelven direcciones
   «data:»: asi no hace falta abrir la politica, y un lienzo no serviria porque la vista clona los
   nodos (un lienzo clonado sale en blanco).

   Las que mas tiempo llevan sin usarse salen de la memoria a los 64 MB. */
const TOPE = 64 * 1024 * 1024;
const aDireccion = (blob) => new Promise((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.onerror = () => mal(new Error('imagen'));
  r.readAsDataURL(blob);
});

export class Imagenes {
  constructor(bajar) { this.bajar = bajar; this.mapa = new Map(); this.total = 0; this.turno = 0; }

  async dame(ruta) {
    if (!ruta) return '';
    if (this.mapa.has(ruta)) {
      const v = this.mapa.get(ruta);
      this.mapa.delete(ruta);
      this.mapa.set(ruta, v);
      return v;
    }
    const turno = this.turno;
    const r = await this.bajar(ruta);
    if (!r || !r.ok) return '';
    const dir = await aDireccion(r.blob);
    /* Lo que llega tarde, tras cerrar el libro, no vuelve a la memoria */
    return turno === this.turno ? this.guardar(ruta, dir) : '';
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

  olvidar() { this.mapa.clear(); this.total = 0; this.turno += 1; }
}
