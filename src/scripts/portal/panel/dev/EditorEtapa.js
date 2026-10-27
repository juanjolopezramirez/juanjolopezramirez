/* Developer-Mode → Sobre el camino (components/portal/dev/EditorEtapa.astro): las etapas
   nuevas de «¿Por dónde he caminado?». Sin archivos: año, titulo, texto, sus versiones en
   otros idiomas y lo que hizo la IA. */
import { EditorContenido } from './EditorContenido.js';
import { Etapa } from '../../../contenido/Etapa.js';

export class EditorEtapa extends EditorContenido {
  static id = 'camino';
  static Tipo = Etapa;
  static plantillaVersion = 'version-etapa';
  static guionesEnId = true;

  tituloDe(e) { return e.textoEn('titulo', e.idiomaOriginal) || e.id; }
  detalleDe(e) { return `${e.cuando} · ${Object.keys(e.texto).map((l) => l.toUpperCase()).join(' · ')}`; }

  leer(f) {
    const orig = f.elements.idiomaOriginal.value;
    const titulo = { [orig]: f.elements.titulo.value };
    const texto = { [orig]: f.elements.texto.value };
    for (const v of this.versiones()) {
      const l = v.querySelector('[name="v-idioma"]').value;
      const t = v.querySelector('[name="v-titulo"]').value;
      const x = v.querySelector('[name="v-texto"]').value;
      if (l && t) titulo[l] = t;
      if (l && x) texto[l] = x;
    }
    return {
      id: f.elements.id.value.trim(),
      idiomaOriginal: orig,
      cuando: f.elements.cuando.value.trim(),
      titulo,
      texto,
      orden: this.actual ? this.actual.orden : 0
    };
  }

  poner(e) {
    const f = this.form;
    f.elements.idiomaOriginal.value = e.idiomaOriginal;
    f.elements.cuando.value = e.cuando;
    f.elements.titulo.value = e.titulo[e.idiomaOriginal] || '';
    f.elements.texto.value = e.texto[e.idiomaOriginal] || '';
    f.elements.id.value = e.id;
    const idiomas = new Set([...Object.keys(e.titulo), ...Object.keys(e.texto)]);
    idiomas.delete(e.idiomaOriginal);
    for (const lang of idiomas) this.agregarVersion({ lang, titulo: e.titulo[lang], texto: e.texto[lang], ia: e.ia.traducidoConIA(lang) });
    this.ponerIA(e.ia);
  }
  ponerVersion(v, d) {
    v.querySelector('[name="v-idioma"]').value = d.lang;
    v.querySelector('[name="v-titulo"]').value = d.titulo || '';
    v.querySelector('[name="v-texto"]').value = d.texto || '';
    v.querySelector('[name="v-ia"]').checked = !!d.ia;
  }
}
