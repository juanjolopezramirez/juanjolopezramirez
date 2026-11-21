/* COMO SE LEE UNA NOTA (puro: sin pagina, sin red). Lo usan la hoja del lector (hojaNota.js), la pagina /nota/ y, mas
   adelante, el Taller. Devuelve trozos de texto; quien los pinta usa textContent, nunca HTML. */
import { deCanonica, rotulo, enlaceGateway } from '../biblia/referencias.js';
import { tituloDeNota } from './notaEnPdf.js';

export const VERSION_DE = Object.freeze({ es: 'rv1909', en: 'web' });
export const NOMBRE_VERSION = Object.freeze({ rv1909: 'Reina-Valera 1909', web: 'World English Bible' });
export const versionDeIdioma = (idioma) => (idioma === 'en' ? 'web' : 'rv1909');

/* El final de una parte lleva un punto, salvo que ya cierre con uno (o con ? !) */
const conPunto = (s) => (/[.?!…]$/.test(s) ? s : s + '.');

/* La referencia de una definicion, al modo APA: «Autor. (Año). *Título*. Fuente. URL». Sin autor, el titulo va delante;
   sin año, «s. f.» / «n.d.». Trozos: [{ t, cursiva?, url? }]. Una referencia escrita a mano (rf) va tal cual. [] si no hay. */
export function referenciaAPA(nota, idioma = 'es') {
  if (!nota) return [];
  if (!nota.r) return nota.rf ? [{ t: nota.rf }] : [];
  const { a, y, ti, f, u } = nota.r;
  const fecha = { t: `(${y || (idioma === 'en' ? 'n.d.' : 's. f.')}).` };
  const salida = [];
  const espacio = () => { if (salida.length) salida.push({ t: ' ' }); };
  if (a) { salida.push({ t: conPunto(a) }); espacio(); salida.push(fecha); }
  if (ti) { espacio(); salida.push({ t: conPunto(ti), cursiva: true }); }
  if (!a && (y || ti)) { espacio(); salida.push(fecha); }
  if (f) { espacio(); salida.push({ t: conPunto(f) }); }
  if (u) { espacio(); salida.push({ t: u, url: u }); }
  return salida;
}

/* Como se nombra una cita: lo que escribio el autor o, si no, el nombre del pasaje en el idioma del libro */
export const rotuloDeCita = (nota, idioma = 'es') => (nota && nota.k === 'c' ? tituloDeNota(nota, idioma) : '');

/* La version recomendada: { nombre, href } (Bible Gateway, en el idioma del libro) o null */
export function recomendada(nota, idioma = 'es') {
  if (!nota || nota.k !== 'c' || !nota.rv) return null;
  const href = enlaceGateway(nota.r, nota.rv, idioma);
  return href ? { nombre: nota.rv, href } : null;
}

/* En que idioma leer una nota fuera del libro (la pagina /nota/): el que trae; si no, el del nombre del pasaje (si solo uno de
   los dos idiomas lo escribe asi); si no, `preferido`. */
export function idiomaDeNota(nota, preferido = 'es') {
  if (nota && (nota.l === 'es' || nota.l === 'en')) return nota.l;
  if (nota && nota.k === 'c' && nota.x) {
    const ref = deCanonica(nota.r);
    const plano = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
    const x = plano(nota.x);
    const es = plano(rotulo(ref, 'es')), en = plano(rotulo(ref, 'en'));
    const nombre = (s) => s.replace(/\s[\d:.,\-–]+$/, '');
    const enEs = x.startsWith(nombre(es)), enEn = x.startsWith(nombre(en));
    if (enEs !== enEn) return enEs ? 'es' : 'en';
  }
  return preferido === 'en' ? 'en' : 'es';
}
