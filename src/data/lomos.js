/* Los lomos de los libros diseñados a mano. SOLO EL SERVIDOR (lo importa
   Biblioteca.astro, que corre al compilar): lee el disco.

   Un lomo es un archivo en public/assets/lomos/, un rectangulo lleno de borde
   a borde: sin sombra, marco ni transparencia (los pone el estante). Se busca,
   por este orden:

     <id>.<idioma>.svg   <id>.<idioma>.png   <id>.svg   <id>.png

   para que un libro en español y en ingles pueda tener un lomo en cada
   idioma, o uno solo para los dos. Sin archivo, el lomo se dibuja solo.

   LAS MEDIDAS (ficha para quien lo diseña), a 1200 px de alto:
     fino    240 x 1200   (1:5)       libros de hasta 12 paginas y las revistas
     medio   300 x 1200   (1:4)       de 13 a 40 paginas
     grueso  375 x 1200   (5:16)      de mas de 40
   Si las medidas del archivo se alejan mas de un 4% de las de su grosor, no
   se usa (se avisa al compilar y sale el lomo automatico): mejor un lomo
   dibujado que uno aplastado. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
/* Las medidas viven en un solo sitio: las usa tambien el panel para recordarselas al
   fundador antes de subir un lomo (Developer-Mode → Libros). */
import { RATIO_LOMO as RATIO, TOLERANCIA } from '../scripts/contenido/medidas.js';

const DIR = path.join(process.cwd(), 'public', 'assets', 'lomos');
const SEGURO = /^[a-z][a-z0-9]*$/;
/* Un SVG con codigo (script, onclick…, foreignObject) no corre dentro de un
   <img>, pero si se abriera suelto en /assets/lomos/. Los lomos son del dueño o
   de quien el elija, pero un lomo que lleva codigo es casi seguro un error: no
   se usa y se avisa. */
const CON_CODIGO = /<script|\son[a-z]+\s*=|foreignObject|javascript:/i;
/* Lo ya leido: cada libro y cada idioma pregunta por el mismo archivo, y esto
   se ejecuta en cada una de las paginas. */
const visto = new Map();

/* Ancho y alto del archivo, sin dependencias: el viewBox (o width/height) del
   SVG, o la cabecera IHDR del PNG. null si no se puede leer. */
function medidas(buf, file) {
  if (file.endsWith('.png')) {
    if (buf.length < 24 || buf.toString('latin1', 1, 4) !== 'PNG') return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  const cabeza = buf.toString('utf8', 0, Math.min(buf.length, 4096));
  const vb = cabeza.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i);
  if (vb) return { w: parseFloat(vb[1]), h: parseFloat(vb[2]) };
  const w = cabeza.match(/<svg[^>]*\swidth\s*=\s*["']\s*([\d.]+)/i);
  const h = cabeza.match(/<svg[^>]*\sheight\s*=\s*["']\s*([\d.]+)/i);
  return w && h ? { w: parseFloat(w[1]), h: parseFloat(h[1]) } : null;
}

/* La direccion del lomo de `id` en `lang` para un lomo de ese `grosor`, o null. */
export function lomoDe(id, lang, grosor, base = '/') {
  if (!SEGURO.test(id) || !/^[a-z]{2}$/.test(lang) || !RATIO[grosor]) return null;
  for (const nombre of [`${id}.${lang}.svg`, `${id}.${lang}.png`, `${id}.svg`, `${id}.png`]) {
    const file = path.join(DIR, nombre);
    let info = null;
    try {
      const mtime = fs.statSync(file).mtimeMs;
      const clave = file + '|' + mtime;
      if (!visto.has(clave)) {
        const buf = fs.readFileSync(file);
        visto.set(clave, {
          m: medidas(buf, file),
          codigo: !file.endsWith('.png') && CON_CODIGO.test(buf.toString('utf8')),
          v: crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8)
        });
      }
      info = visto.get(clave);
    } catch (err) {
      continue;                         // no existe (lo normal): se prueba el siguiente nombre
    }
    const m = info.m;
    if (info.codigo) {
      console.warn(`[lomos] ${nombre}: lleva codigo (script, onclick o foreignObject); no se usa. Exportalo de nuevo como SVG sin codigo, o como PNG.`);
      continue;
    }
    if (!m || !m.w || !m.h) {
      console.warn(`[lomos] ${nombre}: no se pudo leer su tamaño; se usa el lomo automatico.`);
      continue;
    }
    const esperado = RATIO[grosor];
    if (Math.abs(m.w / m.h - esperado) / esperado > TOLERANCIA) {
      console.warn(`[lomos] ${nombre}: mide ${m.w}x${m.h} (proporcion ${(m.w / m.h).toFixed(3)}) y un lomo ${grosor} es ${esperado.toFixed(3)} `
        + `(${Math.round(esperado * 1200)}x1200); se usa el lomo automatico.`);
      continue;
    }
    return `${base}assets/lomos/${nombre}?v=${info.v}`;
  }
  return null;
}
