/* Las secciones del panel de «The Alef Code» (/[lang]/portal/panel/).

   DOS CASAS para el admin (lo pidio el fundador el 2026-10-27):
     · Self-Mode: su vida personal y profesional (Álef, Mi Día, Tablero). Es donde EL entra.
     · Developer-Mode: lo que cambia la pagina publica (Proyectos, Trabajos,
       Recursos —libros hoy; videos y escritos luego, todo en una sola seccion—, Camino).
     · Acceso: Compartir (quien entra) y Configuración (el codigo del celular).
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

/* `icono`: el dibujo de la seccion (data/icons.js), o 'alef' = la א del logo (AlefIcono).
   Los nombres que se ven (textos.js) cambiaron el 2026-10-30 y los `id` se quedaron:
   «Álef» es `hoy`, «Recursos» es `libros`, «Compartir» es `accesos`, «Configuración» es
   `seguridad`. Asi no se rompen los enlaces (#libros) ni la base. */
export const SECCIONES = [
  { id: 'inicio', grupo: 'miembros', admin: false, soloMiembros: true, icono: 'casa' },
  { id: 'hoy', grupo: 'self', admin: true, icono: 'alef' },
  { id: 'diario', grupo: 'self', admin: true, icono: 'sun' },
  { id: 'tablero', grupo: 'self', admin: true, icono: 'tablero' },
  { id: 'proyectos', grupo: 'dev', admin: true, icono: 'wrench' },
  { id: 'trabajos', grupo: 'dev', admin: true, icono: 'maletin' },
  { id: 'libros', grupo: 'dev', admin: true, icono: 'book' },
  { id: 'camino', grupo: 'dev', admin: true, icono: 'route' },
  /* No va en la barra del telefono (esta llena a 4): sale en «Más» */
  { id: 'marca', grupo: 'dev', admin: true, icono: 'palette' },
  { id: 'accesos', grupo: 'acceso', admin: true, icono: 'compartir' },
  { id: 'seguridad', grupo: 'acceso', admin: true, icono: 'ajustes' }
];

/* LA BARRA DE ABAJO DEL TELEFONO (como la de una app): las secciones de cada modo que van
   como boton propio. Siempre son 4 o menos, y el quinto boton es «Más», que abre el resto
   (Compartir y Configuración). Asi la barra nunca pasa de 5. */
export const BARRA = {
  self: ['hoy', 'diario', 'tablero'],
  dev: ['proyectos', 'trabajos', 'libros', 'camino']
};
export const BARRA_MAX = 4;
export const enBarra = (id) => Object.values(BARRA).some((ids) => ids.includes(id));

/* Las que tienen su pantalla hecha; el resto enseña «Pronto». */
export const HECHAS = ['inicio', 'accesos', 'seguridad', 'libros', 'camino', 'trabajos', 'proyectos', 'marca', 'tablero'];

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
