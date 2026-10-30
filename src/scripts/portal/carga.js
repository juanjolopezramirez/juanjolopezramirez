/* Las esperas de The Alef Code: lo que comparten la tarjeta (entrar.js) y el panel (panel.js).

   1. EL FONDO. `modoFondo('carga' | 'entrada' | 'salida' | 'reposo')` le dice a la red de
      signos (fondo.js) que llueva (con la מ amarilla), que descifre la א (verde), que descifre
      la ת (roja, al salir) o que descanse. Lo deja
      escrito en <html> y lo avisa con un evento: da igual cual de los dos
      guiones arranque primero.
   2. LA ENTRADA. `ENTRADA_MS` es lo UNICO que se espera a proposito: lo que la
      ventana tarda en apagarse y la א en descifrarse antes de ir al panel. Con
      «reducir movimiento» o con el fondo en pausa no se espera nada
      (`esperaDeEntrada`). tools/test-portal.mjs vigila que no pase de 800 ms.
   3. LA BITACORA. Las lineas de terminal bajo «Un momento…» dicen lo que de
      verdad esta pasando (conectando, mirando quien eres, revisando tu acceso):
      ni una mas, ni inventadas. Son decoracion para la vista (`aria-hidden`);
      quien usa lector oye «Un momento…». Entran con `textContent`. */
const html = document.documentElement;

export const ENTRADA_MS = 650;
/* Al SALIR, la ת (Tav) se ve este rato mientras se cierra la sesion de verdad (las dos cosas
   corren a la vez: no se suma). tools/test-portal.mjs vigila que no pase de 600 ms. */
export const SALIDA_MS = 400;

export function fondoQuieto() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches || html.classList.contains('fondo-quieto');
}

export const esperaDeEntrada = () => (fondoQuieto() ? 0 : ENTRADA_MS);
export const esperaDeSalida = () => (fondoQuieto() ? 0 : SALIDA_MS);

export function modoFondo(modo, { logo = false } = {}) {
  html.dataset.fondo = modo;
  html.dataset.fondoLogo = logo ? '1' : '';
  document.dispatchEvent(new CustomEvent('alef:fondo', { detail: { modo, logo } }));
}

const MAX_LINEAS = 3;

export function bitacora(lista, textos) {
  const t = textos || {};
  return {
    limpiar() { if (lista) lista.replaceChildren(); },
    paso(clave) {
      if (!lista || typeof t[clave] !== 'string') return;
      if ([...lista.children].some((li) => li.dataset.paso === clave)) return;
      const li = document.createElement('li');
      li.dataset.paso = clave;
      li.textContent = t[clave];
      lista.append(li);
      while (lista.children.length > MAX_LINEAS) lista.firstElementChild.remove();
    }
  };
}
