/* Lo que comparten los formularios del panel (el codigo de la app, invitar, el alta de
   un dispositivo): marcar un campo con su error y anunciarlo, y quitar la marca. */

/* Marca un campo con su error y lo anuncia (el texto entra un instante despues: un
   aviso que aparece ya lleno suele callar). `textoDe` traduce la clave al texto. */
export function errorEnForm(form, campo, clave, textoDe) {
  const err = form.querySelector('[data-error]');
  if (campo) {
    campo.setAttribute('aria-invalid', 'true');
    if (err && !err.id) err.id = `panel-error-${form.dataset.form}`;
    /* El aviso se SUMA a la ayuda del campo (la instruccion), no la reemplaza. */
    if (!campo.hasAttribute('data-desc-base')) campo.setAttribute('data-desc-base', campo.getAttribute('aria-describedby') || '');
    if (err) campo.setAttribute('aria-describedby', `${campo.getAttribute('data-desc-base')} ${err.id}`.trim());
    campo.focus();
  }
  if (!err) return;
  err.textContent = '';
  err.hidden = false;
  setTimeout(() => { err.textContent = textoDe(clave); }, 30);
}

/* Le devuelve a un campo su ayuda de siempre. */
export function quitarMarcaCampo(campo) {
  campo.removeAttribute('aria-invalid');
  if (!campo.hasAttribute('data-desc-base')) return;
  const base = campo.getAttribute('data-desc-base');
  if (base) campo.setAttribute('aria-describedby', base); else campo.removeAttribute('aria-describedby');
  campo.removeAttribute('data-desc-base');
}

export function limpiarForm(form) {
  const err = form.querySelector('[data-error]');
  if (err) { err.hidden = true; err.textContent = ''; }
  form.querySelectorAll('[aria-invalid]').forEach(quitarMarcaCampo);
}
