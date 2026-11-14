/* LA PORTADA LIVIANA de un libro, para su vista previa (/<id>/portada.jpg).

   WhatsApp no pinta miniaturas de mas de ~300 KB. La primera pagina del PDF a 900 px casi siempre pesa menos
   (la de Ahava, 120 KB) y entonces se usa tal cual y esta pagina NO se genera. Solo la hay para el libro
   cuya portada pesa mas que OG_MAX_BYTES (scripts/biblioteca.js): se reduce a ANCHO_LIVIANA px de ancho y se
   baja la calidad hasta que quepa (data/enlaces-libros.js → aligerar). `sharp` no esta en package.json (Astro lo
   trae como dependencia opcional): si no carga, se sirve la imagen original y se avisa en el registro. */
import fs from 'node:fs';
import { enlacesDeLibros, aligerar } from '../../data/enlaces-libros.js';

export function getStaticPaths() {
  return enlacesDeLibros(String(import.meta.env.SITE || '')).filter((l) => l.liviana).map((l) => ({ params: { book: l.id }, props: { archivo: l.liviana } }));
}

export async function GET({ props }) {
  const { buffer } = await aligerar(fs.readFileSync(props.archivo));
  return new Response(buffer, { headers: { 'Content-Type': 'image/jpeg' } });
}
