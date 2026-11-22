/* LOS EFECTOS DE UNA NOTA: como entra su titulo (y su texto) y el movimiento suave que puede quedarle al titulo. Una lista
   FIJA (notaEnPdf.js: ENTRADAS_NOTA, BUCLES_NOTA), elegida una vez por libro en el Taller. La misma pieza anima la hoja del
   lector, la pagina /nota/ y la muestra del Taller, con la Web Animations API: nada de hojas de estilo propias, nada de HTML.

     entrada   aparece   la tinta sale del papel (opacidad)
               sube      sube un poco mientras aparece
               letra     el titulo se escribe letra por letra (el texto aparece despues)
               tinta     la tinta se asienta: de borrosa a nitida
     bucle     brillo    cada tanto un brillo de oro cruza el titulo
               respira   el titulo se aclara y vuelve, muy despacio
               subraya   una raya de oro se traza bajo el titulo, se queda y se va

   Reglas: solo opacidad, transform, filtro y la posicion de un fondo (nada que mueva el resto de la hoja); el bucle empieza
   cuando termino la entrada y se para al cerrar la nota (`parar()`) o mientras la pestaña no se ve; con «reducir movimiento»
   no hay movimiento: la entrada es solo un fundido corto y no hay bucle. Lo que se lee con un lector de pantalla no cambia:
   las letras sueltas van escondidas y el titulo entero queda escrito aparte, y al terminar la entrada (o al parar antes) el
   titulo vuelve a ser su texto, sin trozos. El brillo solo corre donde el navegador sabe recortar un fondo a la letra. */
import { entradaValida, bucleValido } from './notaEnPdf.js';

const SALE = 'cubic-bezier(.16, 1, .3, 1)';
const LETRAS_MAX = 80;

export const reducido = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Las letras de un texto como las ve quien lee (una letra con su tilde, un emoji, es una) */
function letrasDe(s) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].map((x) => x.segment);
  return Array.from(s);
}

/* ¿Sabe este navegador pintar un fondo solo dentro de las letras? Sin eso, el brillo dejaria el titulo invisible. */
const recortaALetra = () => typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && (CSS.supports('background-clip', 'text') || CSS.supports('-webkit-background-clip', 'text'));

/* El titulo, letra por letra: cada palabra en un trozo que no se parte, cada letra en el suyo. Escondidas para el lector de
   pantalla; el titulo entero queda en un trozo invisible. Devuelve las letras. */
function partirEnLetras(el) {
  const texto = el.textContent || '';
  const letras = letrasDe(texto);
  if (!letras.length || letras.length > LETRAS_MAX) return [];
  const oculto = document.createElement('span');
  oculto.textContent = texto;
  Object.assign(oculto.style, { position: 'absolute', width: '1px', height: '1px', margin: '-1px', padding: '0', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: '0' });
  const vista = document.createElement('span');
  vista.setAttribute('aria-hidden', 'true');
  const salida = [];
  let palabra = null;
  for (const l of letras) {
    if (/^\s+$/.test(l)) { palabra = null; vista.append(document.createTextNode(l)); continue; }
    if (!palabra) { palabra = document.createElement('span'); palabra.style.whiteSpace = 'nowrap'; vista.append(palabra); }
    const s = document.createElement('span');
    s.textContent = l;
    palabra.append(s);
    salida.push(s);
  }
  el.replaceChildren(oculto, vista);
  return salida;
}

/* Como entra un trozo (no letra a letra): los cuadros y lo que dura */
function cuadrosDeEntrada(id, quieto) {
  if (quieto) return [[{ opacity: 0 }, { opacity: 1 }], 200];
  if (id === 'sube') return [[{ opacity: 0, transform: 'translateY(.55rem)' }, { opacity: 1, transform: 'none' }], 560];
  if (id === 'tinta') return [[{ opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0)' }], 720];
  return [[{ opacity: 0 }, { opacity: 1 }], 460];
}

/* Anima la ENTRADA de un trozo de texto que acaba de llegar (el pasaje de una cita llega despues que el titulo).
   `retraso` en ms. Devuelve la animacion (o null). */
export function entrarTexto(el, id, { retraso = 0, quieto = reducido() } = {}) {
  if (!el || typeof el.animate !== 'function' || !entradaValida(id)) return null;
  const [cuadros, ms] = cuadrosDeEntrada(id === 'letra' ? 'aparece' : id, quieto);
  return el.animate(cuadros, { duration: ms, delay: quieto ? 0 : retraso, easing: SALE, fill: 'backwards' });
}

/* Anima una nota ya pintada. `titulo`: su titulo. `textos`: lo que va debajo y ya esta (la descripcion). `oro()`: el oro de
   ese papel ('#…'). Devuelve { parar(), texto(el) }: `texto(el)` hace entrar un trozo que llega tarde (el pasaje). */
export function animarNota({ titulo, textos = [], entrada = '', bucle = '', oro = () => '#c08a2e', quieto = reducido() } = {}) {
  const vivas = [];
  let bucleVivo = null, parado = false, alVer = null;
  const guardar = (a) => { if (a) vivas.push(a); return a; };
  const puede = !!titulo && typeof titulo.animate === 'function';
  if (!puede) return { parar() {}, texto() { return null; }, recolorear() {} };

  /* La entrada del titulo, y cuando termina. Letra por letra: el texto de antes, para volver a el al terminar. */
  let fin = 0;
  let partido = null;
  const unir = () => { if (partido !== null && titulo.isConnected) titulo.textContent = partido; partido = null; };
  if (entradaValida(entrada)) {
    const original = titulo.textContent || '';
    const letras = entrada === 'letra' && !quieto ? partirEnLetras(titulo) : [];
    if (letras.length) partido = original;
    if (letras.length) {
      const paso = Math.min(34, 620 / letras.length);
      letras.forEach((s, i) => guardar(s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 60 + i * paso, easing: 'ease-out', fill: 'backwards' })));
      fin = 60 + letras.length * paso + 300;
    } else {
      const [cuadros, ms] = cuadrosDeEntrada(entrada === 'letra' ? 'aparece' : entrada, quieto);
      guardar(titulo.animate(cuadros, { duration: ms, easing: SALE, fill: 'backwards' }));
      fin = ms;
    }
  }
  const tras = entrada === 'letra' && !quieto ? Math.min(fin - 200, 520) : 110;
  textos.forEach((el, i) => guardar(entrarTexto(el, entrada, { retraso: tras + i * 70, quieto })));

  /* El bucle: solo con movimiento, y despues de la entrada */
  const empezarBucle = () => {
    if (parado || quieto || !bucleValido(bucle) || !titulo.isConnected) return;
    unir();
    const g = oro() || '#c08a2e';
    if (bucle === 'respira') {
      bucleVivo = { a: titulo.animate([{ opacity: 1 }, { opacity: 0.74 }, { opacity: 1 }], { duration: 6400, iterations: Infinity, easing: 'ease-in-out' }), quitar() {} };
    } else if (bucle === 'brillo' && recortaALetra()) {
      /* La letra pinta el fondo: un degradado de su propio color con una franja de oro que pasa y se va. Quieto, es su color. */
      const c = getComputedStyle(titulo).color;
      const antes = { bi: titulo.style.backgroundImage, bs: titulo.style.backgroundSize, bc: titulo.style.backgroundClip, wbc: titulo.style.webkitBackgroundClip, co: titulo.style.color, bp: titulo.style.backgroundPosition };
      Object.assign(titulo.style, { backgroundImage: `linear-gradient(100deg, ${c} 42%, ${g} 50%, ${c} 58%)`, backgroundSize: '260% 100%', backgroundPosition: '100% 0', webkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' });
      const a = titulo.animate([
        { backgroundPosition: '100% 0', offset: 0 },
        { backgroundPosition: '0% 0', offset: 0.32, easing: 'ease-in-out' },
        { backgroundPosition: '0% 0', offset: 1 }
      ], { duration: 7200, iterations: Infinity, easing: 'ease-in-out' });
      bucleVivo = { a, quitar() { Object.assign(titulo.style, { backgroundImage: antes.bi, backgroundSize: antes.bs, backgroundClip: antes.bc, webkitBackgroundClip: antes.wbc, color: antes.co, backgroundPosition: antes.bp }); } };
    } else if (bucle === 'subraya') {
      const raya = document.createElement('span');
      raya.setAttribute('aria-hidden', 'true');
      raya.dataset.notaRaya = '';
      const posAntes = titulo.style.position;
      if (getComputedStyle(titulo).position === 'static') titulo.style.position = 'relative';
      Object.assign(raya.style, { position: 'absolute', left: '0', bottom: '-.28em', width: 'min(4.5rem, 70%)', height: '2px', borderRadius: '2px', background: g, transformOrigin: 'left center', transform: 'scaleX(0)', pointerEvents: 'none' });
      titulo.append(raya);
      const a = raya.animate([
        { transform: 'scaleX(0)', opacity: 1, offset: 0, easing: SALE },
        { transform: 'scaleX(1)', opacity: 1, offset: 0.22 },
        { transform: 'scaleX(1)', opacity: 1, offset: 0.7, easing: 'ease-in' },
        { transform: 'scaleX(1)', opacity: 0, offset: 0.86 },
        { transform: 'scaleX(1)', opacity: 0, offset: 1 }
      ], { duration: 6800, iterations: Infinity });
      bucleVivo = { a, quitar() { raya.remove(); titulo.style.position = posAntes; } };
    }
    if (!bucleVivo) return;
    /* Mientras la pestaña no se ve, quieto */
    alVer = () => { if (!bucleVivo) return; if (document.hidden) bucleVivo.a.pause(); else bucleVivo.a.play(); };
    document.addEventListener('visibilitychange', alVer);
  };
  /* Al terminar la entrada, el titulo vuelve a ser su texto; un poco despues empieza el bucle */
  const juntar = partido !== null ? setTimeout(unir, Math.max(0, fin) + 40) : 0;
  const espera = setTimeout(empezarBucle, Math.max(0, fin) + 900);
  const quitarBucle = () => {
    if (bucleVivo) { try { bucleVivo.a.cancel(); } catch { /* ya no esta */ } bucleVivo.quitar(); bucleVivo = null; }
    if (alVer) document.removeEventListener('visibilitychange', alVer);
    alVer = null;
  };

  return {
    texto: (el) => (parado ? null : guardar(entrarTexto(el, entrada, { retraso: 0, quieto }))),
    /* El papel cambio de tema: el brillo lleva el color del titulo dentro de su degradado y se vuelve a armar con el nuevo.
       Los otros bucles no llevan color propio. */
    recolorear() {
      if (parado || !bucleVivo || bucle !== 'brillo') return;
      quitarBucle();
      empezarBucle();
    },
    parar() {
      if (parado) return;
      parado = true;
      clearTimeout(espera);
      clearTimeout(juntar);
      for (const a of vivas) { try { a.cancel(); } catch { /* ya no esta */ } }
      quitarBucle();
      unir();
    }
  };
}
