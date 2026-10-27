/* Las secciones del panel de «The Alef Code» (/[lang]/portal/panel/).

   DOS CASAS para el admin (lo pidio el fundador el 2026-10-27):
     · Self-Mode: su vida personal y profesional. Es donde EL entra («Hoy»).
     · Developer-Mode: lo que cambia la pagina publica (Proyectos, Trabajos,
       los libros de Recursos, Sobre el camino; luego Escribir y Videos).
     · Acceso: quien entra y el codigo del celular.
   Los miembros aprobados ven solo «Inicio» (el primer paso y Cuadremos). El admin
   NO lo ve: su primer paso no es el test.

   `grupo` dice donde va en el menu; `admin: true` quiere decir que solo las ve
   el admin (panel.js quita del DOM las demas para quien no lo es) y
   `soloMiembros: true` que el admin no la ve. OJO: esto es comodidad, no
   seguridad. Lo que protege los datos son las reglas de la base
   (supabase/*.sql): un miembro que se pusiera a mano la seccion «diario» solo
   veria filas suyas, y las del admin no le llegarian jamas.

   Cuando llegue la estructura definitiva de cada seccion, se añade aqui y en
   textos.js → panel.secciones (y, si necesita campos nuevos en la base, un
   archivo NUEVO supabase/007_….sql). */
export const GRUPOS = ['miembros', 'self', 'dev', 'acceso'];

/* Los grupos que se pliegan (el acordeon del menu). «miembros» tiene una sola
   entrada y no lleva boton: lo dice la entrada. */
export const PLEGABLES = ['self', 'dev', 'acceso'];

export const SECCIONES = [
  { id: 'inicio', grupo: 'miembros', admin: false, soloMiembros: true },
  { id: 'hoy', grupo: 'self', admin: true },
  { id: 'diario', grupo: 'self', admin: true },
  { id: 'habitos', grupo: 'self', admin: true },
  { id: 'crecimiento', grupo: 'self', admin: true },
  { id: 'proyectos', grupo: 'dev', admin: true },
  { id: 'trabajos', grupo: 'dev', admin: true },
  { id: 'libros', grupo: 'dev', admin: true },
  { id: 'camino', grupo: 'dev', admin: true },
  { id: 'escribir', grupo: 'dev', admin: true },
  { id: 'videos', grupo: 'dev', admin: true },
  { id: 'accesos', grupo: 'acceso', admin: true },
  { id: 'seguridad', grupo: 'acceso', admin: true }
];

/* Las que tienen su pantalla hecha; el resto enseña «Pronto». */
export const HECHAS = ['inicio', 'accesos', 'seguridad', 'libros', 'camino', 'trabajos', 'proyectos'];

export const IDS = SECCIONES.map((s) => s.id);
export const idsPara = (esAdmin) => SECCIONES
  .filter((s) => (esAdmin ? !s.soloMiembros : !s.admin))
  .map((s) => s.id);

/* Donde abre el panel si la direccion no dice otra cosa. */
export const inicioPara = (esAdmin) => (esAdmin ? 'hoy' : 'inicio');
