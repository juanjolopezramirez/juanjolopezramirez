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

/* LOS DOS MODOS, como un tema claro y uno oscuro: un boton cambia de uno a otro y con el
   cambian las secciones de la barra y el aspecto del panel. «acceso» esta en los dos
   (abajo); «miembros» no es de ninguno (un miembro no tiene modos). */
export const MODOS = ['self', 'dev'];

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

/* El modo de una seccion ('self' | 'dev'), o null si es de los dos (acceso) o de ninguno. */
export const modoDe = (id) => {
  const s = SECCIONES.find((x) => x.id === id);
  return s && MODOS.includes(s.grupo) ? s.grupo : null;
};
/* La primera seccion de un modo (a donde va el boton la primera vez). */
export const inicioDeModo = (modo) => (SECCIONES.find((s) => s.grupo === modo) || {}).id || 'hoy';

/* El modo en que queda el panel al llegar a `id`: el de la seccion; si es de los dos
   (acceso), el que ya tenia; si no tenia, Self-Mode. */
export const modoPara = (id, previo) => modoDe(id) || (MODOS.includes(previo) ? previo : 'self');
