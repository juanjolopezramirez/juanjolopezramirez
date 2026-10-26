/* La guardia de las paginas que van DESPUES de entrar al portal: /contact/ (el
   primer paso, con su test) y /meet/ (cuadremos un rato).

   Esconde la pagina (`[data-guardia]` nace `visibility: hidden`, ver la hoja de
   estilos de la propia pagina) hasta que el SERVIDOR confirma que la persona
   entro y esta aprobada; si no, la manda al portal.

   DOS COSAS QUE HAY QUE SABER
     · Es comodidad de recorrido, NO seguridad: la pagina es estatica y su contenido
       esta en el repositorio (publico). Lo que de verdad queda detras de una
       puerta son los datos, que viven en la base con sus reglas (supabase/*.sql).
     · Si el portal aun no esta conectado a Supabase («apagado»), la guardia se
       abre sola: no tiene a quien pedirle nada, y asi el test no queda atrapado
       detras de una puerta que nadie puede pasar. Cuando se conecta, cierra.

   En desarrollo (`npm run dev`) sin variables corre la demo: sin `?demo=miembro`
   en la direccion te manda al portal, que es justo lo que haria un visitante. */
import { abrirBackend } from './backend.js';
import { idiomaDe, rutaPortal } from './estado.js';

const TARDO = Symbol('tardo');
const limite = (promesa, ms = 15000) =>
  Promise.race([promesa, new Promise((resolver) => setTimeout(() => resolver(TARDO), ms))]);

const pagina = document.querySelector('[data-guardia]');
if (pagina) revisar(pagina);

async function revisar(pagina) {
  const lang = idiomaDe(window.location.pathname.split('/')[1]);
  let be = null;
  const alPortal = () => {
    const sufijo = be && be.modo === 'demo' ? window.location.search : '';
    window.location.replace(rutaPortal(lang) + sufijo);
  };
  const abrir = () => { pagina.dataset.guardia = 'ok'; };

  try {
    be = await abrirBackend(lang);
  } catch (e) {
    alPortal();
    return;
  }
  if (!be) { abrir(); return; }                       // portal apagado: la guardia no cierra

  const ses = await limite(be.sesion());
  if (ses === TARDO || !ses) { alPortal(); return; }
  const perfil = await limite(be.perfil(ses.id));
  if (perfil === TARDO || perfil === undefined || !perfil || perfil.estado !== 'aprobado') { alPortal(); return; }
  abrir();
}
