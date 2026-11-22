/* EL COLOR DEL CARTON DE UNA TAPA DURA, medido en la imagen de la tapa: la MISMA cuenta que tools/books.py board() hace con
   los libros de Recursos. La media del borde de la pagina (un 4 % de cada lado, nunca menos de 2 px), que es lo que se ve
   cuando el carton asoma por detras de las hojas.

   Puro: sin pagina ni red. `rgba` son los pixeles de un ImageData (4 bytes por pixel: rojo, verde, azul, alfa), `w` y `h`
   su ancho y alto. Books.py lo mide en una imagen de 120 px de ancho: quien llama debe reducir la tapa a ese ancho
   (ANCHO_CANTO) para que las dos cuentas den lo mismo. El alfa no cuenta (books.py pinta sin alfa).
   Devuelve '#rrggbb' o '' si los datos no sirven. */
export const ANCHO_CANTO = 120;
export const BORDE_CANTO = 0.04;

export function colorDeCanto(rgba, w, h) {
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1) return '';
  if (!rgba || typeof rgba.length !== 'number' || rgba.length < w * h * 4) return '';
  const m = Math.max(2, Math.round(w * BORDE_CANTO));
  const tot = [0, 0, 0];
  let cnt = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= m && x < w - m && y >= m && y < h - m) continue;
      const i = (y * w + x) * 4;
      tot[0] += rgba[i]; tot[1] += rgba[i + 1]; tot[2] += rgba[i + 2];
      cnt++;
    }
  }
  if (!cnt) return '';
  return '#' + tot.map((c) => Math.min(255, Math.max(0, Math.round(c / cnt))).toString(16).padStart(2, '0')).join('');
}
