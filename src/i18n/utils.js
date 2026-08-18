import { UI, META, LANGS, DEFAULT_LANG } from './ui.js';

/** Devuelve una función t() atada a un idioma. */
export function useT(lang) {
  const pack = UI[lang] || UI[DEFAULT_LANG];
  return function t(key) {
    return pack[key] ?? UI.en[key] ?? key;
  };
}

/** /es/proyectos → /en/proyectos */
export function localePath(lang, path = '') {
  const clean = String(path).replace(/^\/+|\/+$/g, '');
  return clean ? `/${lang}/${clean}/` : `/${lang}/`;
}

export function otherLangs(current) {
  return LANGS.filter((l) => l !== current);
}

export { UI, META, LANGS, DEFAULT_LANG };
