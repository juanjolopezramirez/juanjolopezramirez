/* Las secciones del panel de «The Alef Code» (/[lang]/portal/panel/).

   `grupo` dice donde va en el menu; `admin: true` quiere decir que solo las ve
   el admin (panel.js quita del DOM las demas para quien no lo es). OJO: esto es
   comodidad, no seguridad. Lo que protege los datos son las reglas de la base
   (supabase/*.sql): un miembro que se pusiera a mano la seccion «diario» solo
   veria filas suyas, y las del admin no le llegarian jamas.

   Cuando llegue la estructura definitiva de cada seccion, se añade aqui y en
   textos.js → panel.secciones (y, si necesita campos nuevos en la base, un
   archivo NUEVO supabase/007_….sql). */
export const GRUPOS = ['miembros', 'sitio', 'accesos', 'privado'];

export const SECCIONES = [
  { id: 'inicio', grupo: 'miembros', admin: false },
  { id: 'escribir', grupo: 'sitio', admin: true },
  { id: 'libros', grupo: 'sitio', admin: true },
  { id: 'proyectos', grupo: 'sitio', admin: true },
  { id: 'trabajos', grupo: 'sitio', admin: true },
  { id: 'videos', grupo: 'sitio', admin: true },
  { id: 'accesos', grupo: 'accesos', admin: true },
  { id: 'seguridad', grupo: 'accesos', admin: true },
  { id: 'diario', grupo: 'privado', admin: true },
  { id: 'habitos', grupo: 'privado', admin: true },
  { id: 'crecimiento', grupo: 'privado', admin: true }
];

/* Las que tienen su pantalla hecha; el resto enseña «Pronto». */
export const HECHAS = ['inicio', 'accesos', 'seguridad'];

export const IDS = SECCIONES.map((s) => s.id);
export const idsPara = (esAdmin) => SECCIONES.filter((s) => esAdmin || !s.admin).map((s) => s.id);
