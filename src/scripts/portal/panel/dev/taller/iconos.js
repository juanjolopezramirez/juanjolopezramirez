/* LOS ICONOS DEL TALLER: un solo trazo en una caja de 16. Los usa la cinta (Taller.astro) y el panel. */
export const TRAZOS = {
  deshacer: 'M6 4 3 7l3 3M3 7h6.5a3.5 3.5 0 0 1 0 7H7',
  rehacer: 'M10 4l3 3-3 3M13 7H6.5a3.5 3.5 0 0 0 0 7H9',
  adelante: 'M8 13.5V5M4.5 8.5 8 5l3.5 3.5M3 2h10',
  atras: 'M8 2.5V11M4.5 7.5 8 11l3.5-3.5M3 14h10',
  subir: 'M8 13V3M4 7l4-4 4 4',
  bajar: 'M8 3v10M4 9l4 4 4-4',
  duplicar: 'M5.5 5.5h8v8h-8zM10.5 5.5v-3h-8v8h3',
  eliminar: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 8.5h5.6l.7-8.5M6.7 7v4M9.3 7v4',
  recortar: 'M4.5 1.5v10h10M1.5 4.5h10v10',
  sinRecorte: 'M4.5 1.5v10h10M1.5 4.5h10v10M2 14 14 2',
  imagen: 'M2 3h12v10H2zM2 11l3.5-3.5 3 3 2-2L14 12M10.5 6h.01',
  cuadro: 'M3 4V2.5h10V4M8 2.5v11M6 13.5h4',
  zona: 'M2.5 5V2.5H5M11 2.5h2.5V5M13.5 11v2.5H11M5 13.5H2.5V11',
  boton: 'M2 5h12v6H2zM5 8h6',
  izquierda: 'M2 3.5h12M2 6.5h8M2 9.5h12M2 12.5h8',
  centro: 'M2 3.5h12M4 6.5h8M2 9.5h12M4 12.5h8',
  derecha: 'M2 3.5h12M6 6.5h8M2 9.5h12M6 12.5h8',
  justificado: 'M2 3.5h12M2 6.5h12M2 9.5h12M2 12.5h12',
  lista: 'M6 4h8M6 8h8M6 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01',
  listaNum: 'M6 4h8M6 8h8M6 12h8M2.5 2.5v3M2 10h1.6L2 12.8h1.7',
  cita: 'M3 5h3.5v3.5H5L3.5 11M9.5 5H13v3.5h-1.5L10 11'
};

export function icono(nombre) {
  const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
  s.setAttribute('class', 'tal-svg');
  s.setAttribute('viewBox', '0 0 16 16');
  s.setAttribute('aria-hidden', 'true');
  p.setAttribute('d', TRAZOS[nombre]);
  s.append(p);
  return s;
}
