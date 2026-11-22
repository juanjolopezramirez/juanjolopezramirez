/* EL COLOR DE UNA NOTA Y SU CONTRASTE (puro: sin pagina, sin red). Lo usan la hoja del lector y la pagina /nota/ (para no
   pintar un color que no se lee sobre el papel de ese momento) y el Taller (para avisar al elegirlo).

   Los papeles de la nota y sus tintas de siempre son los de base.css («La nota») y de pages/nota.astro: si cambian alla,
   cambian aqui. */

/* El papel de la nota en cada tema, y la tinta con la que se escribe si el libro no eligio otra */
export const PAPEL_NOTA = Object.freeze({ claro: '#f6f3ea', oscuro: '#1d2e1f' });
export const TINTA_NOTA = Object.freeze({ claro: '#23302a', oscuro: '#f1efe9' });
export const ORO_NOTA = Object.freeze({ claro: '#9a6a1f', oscuro: '#e0b778' });

/* El minimo para usar el color en el lector (letra grande: 3:1) y el minimo del aviso en el Taller (letra de lectura: 4.5:1) */
export const CONTRASTE_LECTOR = 3;
export const CONTRASTE_AVISO = 4.5;

/* [r, g, b] (0..255) de '#rrggbb', '#rgb' o 'rgb(…)' / 'rgba(…)' (como lo da getComputedStyle); null si no se entiende.
   Un rgba con transparencia no es un fondo que se pueda medir: null. */
export function leerColor(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{6})$/);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = s.match(/^#([0-9a-f]{3})$/);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16));
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (!m) return null;
  if (m[4] !== undefined) {
    const a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    if (!(a >= 0.99)) return null;
  }
  const rgb = [m[1], m[2], m[3]].map(Number);
  return rgb.every((x) => Number.isFinite(x) && x >= 0 && x <= 255) ? rgb.map(Math.round) : null;
}

/* La luminancia relativa (WCAG 2) */
export function luminancia(rgb) {
  const [r, g, b] = rgb.map((c) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* El contraste entre dos colores (1..21); 0 si alguno no se entiende */
export function contraste(a, b) {
  const x = Array.isArray(a) ? a : leerColor(a), y = Array.isArray(b) ? b : leerColor(b);
  if (!x || !y) return 0;
  const [l1, l2] = [luminancia(x), luminancia(y)].sort((p, q) => q - p);
  return (l1 + 0.05) / (l2 + 0.05);
}

/* ¿Es oscuro este papel? (mas cerca del negro que del blanco) */
export const esOscuro = (fondo) => { const c = Array.isArray(fondo) ? fondo : leerColor(fondo); return !!c && luminancia(c) < 0.18; };

/* Los colores que de verdad se usan sobre `fondo`: de la nota, el par del tema de ese papel (`cd` si es oscuro, `cl` si
   no); cada color que no llega a CONTRASTE_LECTOR se tira y queda el de siempre. → { titulo, texto } ('' = el de siempre) */
export function coloresSobre(nota, fondo) {
  const salida = { titulo: '', texto: '' };
  const c = Array.isArray(fondo) ? fondo : leerColor(fondo);
  if (!nota || !c) return salida;
  const par = esOscuro(c) ? nota.cd : nota.cl;
  if (!Array.isArray(par)) return salida;
  if (par[0] && contraste(par[0], c) >= CONTRASTE_LECTOR) salida.titulo = par[0];
  if (par[1] && contraste(par[1], c) >= CONTRASTE_LECTOR) salida.texto = par[1];
  return salida;
}
