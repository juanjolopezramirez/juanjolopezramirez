/* Las medidas de lo que se dibuja a mano: lomos, portadas, la cabecera y el avatar de
   una casa. UNA sola fuente: la usan la estanteria al compilar (data/lomos.js), el
   panel para recordarle al fundador la medida ANTES de subir, y las pruebas.

   Una regla sabe tres cosas: su proporcion (ancho / alto), un ejemplo del tamaño bueno
   (lo que el panel enseña: «300 × 1200 px») y lo minimo para que no se vea borroso.
   Se acepta el doble o la mitad del ejemplo: solo importa la proporcion, con un margen
   de TOLERANCIA (un 4%). Mejor un lomo dibujado por el sitio que uno aplastado.

   Nada de SVG subido: un SVG puede llevar codigo. Los SVG que ya estan en el repositorio
   (public/assets/lomos/) siguen valiendo; esos los revisa data/lomos.js. */
import { TIPOS } from '../../data/biblioteca.js';
import { tiene } from './comun.js';

export const TOLERANCIA = 0.04;

export class ReglaDeMedida {
  /** @param {{ nombre: string, ejemplo: {w: number, h: number}, ratio?: number|null,
               minAncho?: number, minAlto?: number, minLado?: number, formatos: string[], nota?: string }} d */
  constructor(d) {
    this.nombre = d.nombre;
    this.ejemplo = d.ejemplo;
    this.ratio = typeof d.ratio === 'number' ? d.ratio : null;
    this.minAncho = d.minAncho || 0;
    this.minAlto = d.minAlto || 0;
    this.minLado = d.minLado || 0;
    this.formatos = d.formatos;
    this.nota = d.nota || '';
    this.tolerancia = TOLERANCIA;
  }

  /* { ok: true } o { ok: false, clave, esperado }. `clave` es la de un texto del panel:
     sinMedidas (no se pudo leer el tamaño), proporcion (aplastado o estirado) o
     pequeno (se veria borroso). */
  revisar(m) {
    const w = m && m.w;
    const h = m && m.h;
    const no = (clave) => ({ ok: false, clave, esperado: this.ejemplo });
    if (!(typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0 && Number.isFinite(w) && Number.isFinite(h))) return no('sinMedidas');
    if (this.ratio !== null && Math.abs(w / h - this.ratio) / this.ratio > this.tolerancia) return no('proporcion');
    if (w < this.minAncho || h < this.minAlto || Math.max(w, h) < this.minLado) return no('pequeno');
    return { ok: true };
  }
}

/* ---- Lomos ------------------------------------------------------------------------
   A 1200 px de alto (la ficha de data/lomos.js):
     fino    240 x 1200   (1:5)    libros de hasta 12 paginas y las revistas
     medio   300 x 1200   (1:4)    de 13 a 40 paginas
     grueso  375 x 1200   (5:16)   de mas de 40
   Lleno de borde a borde: sin sombra, marco ni transparencia (los pone el estante). */
export const GROSORES = ['fino', 'medio', 'grueso'];
const LADO = { fino: 240, medio: 300, grueso: 375 };
export const RATIO_LOMO = Object.fromEntries(GROSORES.map((g) => [g, LADO[g] / 1200]));
export const LOMOS = Object.fromEntries(GROSORES.map((g) => [g, new ReglaDeMedida({
  nombre: `Lomo ${g}`,
  ejemplo: { w: LADO[g], h: 1200 },
  ratio: RATIO_LOMO[g],
  minAlto: 600,
  formatos: ['png'],
  nota: 'Lleno de borde a borde: sin sombra, marco ni transparencia.'
})]));

/* El grosor que le toca a un libro por sus paginas, si no se elige a mano. Las mismas
   reglas que la estanteria (scripts/biblioteca.js → grosorDe): pasta blanda, fino hasta
   40 paginas y medio despues; tapa dura, fino hasta 12, medio hasta 40 y grueso despues. */
export function grosorSugerido(paginas, tipo) {
  const n = Number.isInteger(paginas) && paginas > 0 ? paginas : 12;
  const blando = tiene(TIPOS, tipo) && TIPOS[tipo].blando;
  if (blando) return n <= 40 ? 'fino' : 'medio';
  return n <= 12 ? 'fino' : n <= 40 ? 'medio' : 'grueso';
}

/* ---- Portadas -----------------------------------------------------------------------
   La portada de un libro es la primera pagina de su PDF (tools/books.py la saca sola).
   Cada tipo tiene su proporcion (data/biblioteca.js → TIPOS): esto le dice al fundador
   con que medida hacer la primera pagina. Ejemplos a 1600 px de ancho. */
const NOMBRE_TIPO = { 'tapa-dura': 'tapa dura', revista: 'revista', comic: 'cómic' };
export const PORTADAS = Object.fromEntries(Object.entries(TIPOS).map(([t, v]) => [t, new ReglaDeMedida({
  nombre: `Portada de ${NOMBRE_TIPO[t] || t}`,
  ejemplo: { w: 1600, h: Math.round(1600 / v.ratio) },
  ratio: v.ratio,
  minAncho: 800,
  formatos: ['pdf'],
  nota: 'Es la primera página del PDF.'
})]));

/* ---- Las casas (Trabajos y Proyectos) -------------------------------------------------
   La cabecera de la tarjeta: 1600 x 420, y lo importante en la banda central (los 300 px
   de en medio: arriba y abajo se pierden en la tarjeta mas ancha). El avatar: 512 px el
   lado largo, fondo transparente, recortado al dibujo (sin proporcion fija). */
export const CABECERA = new ReglaDeMedida({
  nombre: 'Cabecera de la tarjeta',
  ejemplo: { w: 1600, h: 420 },
  ratio: 1600 / 420,
  minAncho: 1200,
  formatos: ['jpg', 'webp', 'png'],
  nota: 'Lo importante, en los 300 px del centro.'
});
export const AVATAR = new ReglaDeMedida({
  nombre: 'Avatar',
  ejemplo: { w: 512, h: 512 },
  minLado: 256,
  formatos: ['png', 'webp'],
  nota: 'Fondo transparente y recortado al dibujo, claro sobre oscuro.'
});
