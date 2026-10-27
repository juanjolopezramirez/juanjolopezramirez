/* Una casa: una empresa con la que he trabajado (Trabajo → la lista PARTNERS) o un
   proyecto que estoy construyendo (Proyecto → PROJECTS). Los mismos campos que ya
   explica data/projects.js, mas el cuerpo: su pagina, hecha con el editor de bloques,
   un Documento por idioma.

     id      su direccion: /es/<id>/ (minusculas, cifras y guiones)
     name    el nombre de la casa (una marca no se traduce)
     role    { <idioma>: '…' } que es, en una linea
     blurb   { <idioma>: '…' } la descripcion de la tarjeta
     tags    etiquetas para filtrar
     logo    { src, w, h, scale } el de la cinta (claro sobre transparente)
     avatar  el logo para el circulo (opcional)
     banner  la foto de cabecera, 1600 x 420 (opcional)
     works   [{ title: { <idioma>: '…' }, year: '2025', href? }]  lo que hice con ellos
     cuerpo  { <idioma>: Documento }  su pagina, estilo Notion

   Las dos viven en la misma tabla (casas) y las separa `clase`. */
import { TipoDeContenido } from './Tipo.js';
import { bytes, enlaceSeguro, entero, etiquetas, i18n, idiomaValido, objeto, rutaAlmacen, texto } from './comun.js';
import { Documento } from './Documento.js';

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const WORKS_MAX = 40;
export const CUERPO_MAX_BYTES = 2000000;
/* La marca de «aqui habia algo que no servia»: no es una ruta ni un enlace (no pasa ninguna
   regla, asi que nunca se pinta), y deja que revisar() lo diga en vez de perderlo callado. */
const MALO = '\u0000malo';
/* La escala optica de la cinta: entre 0.62 y 1.30 (data/projects.js explica por que). */
const ESCALA = [0.62, 1.3];

export class Casa extends TipoDeContenido {
  static tabla = 'casas';
  static clase = '';
  /* Las secciones de la web (data/social.js → NAV) y las paginas sueltas: una casa que se
     llamara asi se quedaria sin pagina (data/entities.js lo explica). */
  static RESERVADOS = ['work', 'projects', 'writing', 'about', 'contact', 'direct', 'meet', 'portal', 'status'];

  static campos(d) {
    const logo = objeto(d.logo);
    const cuerpo = {};
    for (const [l, doc] of Object.entries(objeto(d.cuerpo))) if (idiomaValido(l)) cuerpo[l] = new Documento(doc);
    const escala = typeof logo.scale === 'number' && Number.isFinite(logo.scale) ? logo.scale : 1;
    /* Lo que no sirve no se guarda (como en bloques.js): una ruta que no es del almacen o
       un enlace peligroso se quedan vacios desde aqui, y revisar() lo dice. */
    const archivo = (v, exts) => (typeof v === 'string' && rutaAlmacen(v, exts) ? v : (v ? MALO : ''));
    return {
      name: texto(d.name, 80),
      role: i18n(d.role, 120),
      blurb: i18n(d.blurb, 400),
      tags: etiquetas(d.tags),
      logo: logo.src ? {
        src: archivo(logo.src, ['png', 'webp']),
        w: entero(logo.w, 1, 10000, 0),
        h: entero(logo.h, 1, 10000, 0),
        scale: Math.min(ESCALA[1], Math.max(ESCALA[0], escala))
      } : null,
      avatar: archivo(d.avatar, ['png', 'webp']),
      banner: archivo(d.banner, ['jpg', 'webp', 'png']),
      works: (Array.isArray(d.works) ? d.works.slice(0, WORKS_MAX) : []).map((w) => {
        const o = objeto(w);
        const href = typeof o.href === 'string' ? o.href.trim() : '';
        return { title: i18n(o.title, 120), year: typeof o.year === 'string' ? o.year.trim() : '', href: enlaceSeguro(href) ? href : (href ? MALO : '') };
      }),
      cuerpo
    };
  }

  get clase() { return this.constructor.clase; }

  /* Sus archivos van en casas/<id>/<archivo> (un solo nivel, como dice 007) y en ningun
     otro sitio. */
  esSuya(ruta, exts) {
    return rutaAlmacen(ruta, exts) && ruta.startsWith(`casas/${this.id}/`) && !ruta.slice(`casas/${this.id}/`.length).includes('/');
  }

  revisar(r) {
    const e = (campo, clave) => r.errores.push({ campo, clave });
    if (!ID.test(this.id) || this.id.length > 40) e('id', 'formato');
    else if (Casa.RESERVADOS.includes(this.id)) e('id', 'reservado');
    if (!this.name) e('name', 'falta');

    const archivo = (campo, ruta, exts) => {
      if (!ruta) return;
      if (!rutaAlmacen(ruta, exts)) e(campo, 'ruta');
      else if (!this.esSuya(ruta, exts)) e(campo, 'ajeno');
    };
    /* El logo es lo que pasa por la cinta: sin el, la casa no tiene cara */
    if (!this.logo) e('logo', 'falta');
    else {
      archivo('logo', this.logo.src, ['png', 'webp']);
      if (!this.logo.w || !this.logo.h) e('logo', 'sinMedidas');
    }
    archivo('avatar', this.avatar, ['png', 'webp']);
    archivo('banner', this.banner, ['jpg', 'webp', 'png']);

    this.works.forEach((w, i) => {
      if (!/^\d{4}$/.test(w.year)) e(`works.${i}.year`, 'formato');
      if (w.href && !enlaceSeguro(w.href)) e(`works.${i}.href`, 'enlace');
      if (!Object.keys(w.title).length) e(`works.${i}.title`, 'falta');
    });
    /* Las imagenes de su pagina son SUYAS: bloques/<id>/… o casas/<id>/… (no las de otra
       casa, que podrian ser de un borrador) */
    const suyas = [`bloques/${this.id}/`, `casas/${this.id}/`];
    const verImagen = (b, donde) => {
      if (b.tipo === 'imagen' && b.src && !suyas.some((p) => b.src.startsWith(p))) e(`${donde}.src`, 'ajeno');
      if (b.tipo === 'columnas') b.columnas.forEach((col, ci) => col.forEach((x, xi) => verImagen(x, `${donde}.columnas.${ci}.${xi}`)));
    };
    for (const [l, doc] of Object.entries(this.cuerpo)) doc.bloques.forEach((b, i) => verImagen(b, `cuerpo.${l}.bloques.${i}`));
    /* El mismo tope que 007 (cuerpo ≤ 2 MB): mejor decirlo aqui que un error raro al guardar */
    if (bytes(this.datosPropios().cuerpo) > CUERPO_MAX_BYTES) e('cuerpo', 'grande');
    for (const [l, doc] of Object.entries(this.cuerpo)) {
      const v = doc.validar();
      for (const x of v.errores) e(`cuerpo.${l}.${x.campo}`, x.clave);
      for (const x of v.avisos) r.avisos.push({ campo: `cuerpo.${l}.${x.campo}`, clave: x.clave });
    }
  }

  datosPropios() {
    const cuerpo = {};
    for (const [l, doc] of Object.entries(this.cuerpo)) cuerpo[l] = doc.aJSON();
    return {
      clase: this.clase,
      name: this.name, role: { ...this.role }, blurb: { ...this.blurb }, tags: [...this.tags],
      logo: this.logo ? { ...this.logo } : null, avatar: this.avatar, banner: this.banner,
      works: this.works.map((w) => ({ title: { ...w.title }, year: w.year, href: w.href })),
      cuerpo
    };
  }
}

export class Trabajo extends Casa { static clase = 'trabajo'; }
export class Proyecto extends Casa { static clase = 'proyecto'; }
