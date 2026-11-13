/* BAJAR TODO EL LIBRO a un archivo: la obra, sus capitulos y sus piezas. Es tu copia de seguridad,
   y puede llevar las imagenes dentro. Volver a subirla aun no se puede. */
import { rutasDelLibro } from '../../../../contenido/taller/RutasLibro.js';

const aBase64 = (blob) => new Promise((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.onerror = () => mal(new Error('archivo'));
  r.readAsDataURL(blob);
});

export function nombreDeArchivo(titulo) {
  const base = String(titulo).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base.slice(0, 60) || 'libro'}.json`;
}

export function entregar(texto, nombre) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* Devuelve cuantos archivos no se pudieron incluir */
export async function bajarLibro({ obra, capitulos, piezas, conArchivos, bajar }) {
  const archivos = {};
  let faltan = 0;
  if (conArchivos) {
    /* Las de los capitulos y la de arriba del contenido (RutasLibro, la misma lista del PDF) */
    const imagenes = [...rutasDelLibro(obra, capitulos)];
    const rutas = [...new Set([...imagenes, ...piezas.flatMap((p) => [p.pdf, ...(p.paginas || []).map((g) => g.ruta)])].filter(Boolean))];
    for (const r of rutas) {
      const b = await bajar(r);
      if (b && b.ok) archivos[r] = await aBase64(b.blob); else faltan++;
    }
  }
  entregar(JSON.stringify({ formato: 'taller-1', fecha: new Date().toISOString(), obra, capitulos, piezas, archivos, faltan }), nombreDeArchivo(obra.titulo));
  return faltan;
}
