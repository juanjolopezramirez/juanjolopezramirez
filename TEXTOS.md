# Cómo cambiar los textos

> Esta guía es para el proyecto **Astro** (`juanjo-web/`).
> La versión vieja sin framework está en `../Personal Web Page/` y ya no se toca.

Guía para editar la página sin romperla. En español, porque es para ti.

---

## Dónde están los textos

Todos en **`src/i18n/ui.js`**, agrupados por idioma. Los componentes `.astro` no llevan texto
escrito: llaman a una clave, así:

```astro
<h2 class="links__title">{t('links.title')}</h2>
```

Ese `t('links.title')` va a buscar la clave `links.title` en el idioma de la página.

> **Regla:** si ves `t('algo')` en un archivo `.astro`, ese texto se edita en `src/i18n/ui.js`.
> Nunca dentro del `.astro`.

---

## Dónde vive cada cosa

| Qué quieres cambiar | Archivo | Cómo encontrarlo |
|---|---|---|
| Cualquier texto visible (títulos, párrafos, botones) | `src/i18n/ui.js` | Busca la clave |
| Definiciones del glosario (Ahavá, Emet, Ágape) | `src/i18n/terms.js` | Busca el término |
| Enlaces de redes sociales | `src/data/social.js` | Todos juntos, una vez |
| Qué secciones salen en el menú | `src/data/social.js` | El array `NAV` |
| Tu correo | `src/components/Header.astro` | Busca `mailto:` |
| Colores, tamaños, animaciones | `src/styles/base.css` | — |
| Escritorio y tablet | `src/styles/desktop.css` · `tablet.css` | — |

---

## Cambiar un texto, paso a paso

Digamos que quieres cambiar **"Encuéntrame aquí:"**.

**1.** Busca esa clave en los componentes. La encuentras así:

```astro
<h2 class="links__title">{t('links.title')}</h2>
```

**2.** Copia la clave: `links.title`

**3.** Abre `src/i18n/ui.js` y busca `links.title`. Vas a encontrar **cinco**, una por idioma:

```js
    es: {
      ...
      'links.title':    'Encuéntrame aquí:',
```

**4.** Cambia **solo lo que está entre las comillas simples de la derecha**:

```js
      'links.title':    'Mis redes:',
```

**5.** Guarda. Si tienes `npm run dev` corriendo, la página se actualiza sola.

Si no cambia nada, ve al final de esta guía, sección *"No veo mis cambios"*.

---

## Las tres reglas para no romper nada

Una línea del diccionario se ve así:

```js
      'links.title':    'Encuéntrame aquí:',
```
```
       └─ clave ─┘      └──── tu texto ────┘ └ coma
```

**1. No toques la clave** (lo de la izquierda). Si la cambias, el texto desaparece.

**2. No borres las comillas ni la coma final.** Todo lo tuyo va *dentro* de las comillas
simples, y la línea termina en coma.

**3. Cuidado con el apóstrofo.** Si tu texto lleva `'`, el navegador cree que ahí termina.

Mal:
```js
      'about.p4': 'No separo quién soy de lo que construyo',   ← bien, no lleva apóstrofo
      'nav.write': 'Escríbeme, es rápido',                     ← bien
      'algo':      'l'architecture de mes convictions',        ← ROMPE la página
```

Bien — usa comillas dobles por fuera:
```js
      'algo':      "l'architecture de mes convictions",
```

O el apóstrofo tipográfico `’`, que no rompe nada:
```js
      'algo':      'l’architecture de mes convictions',
```

> Si la página se queda en blanco después de editar, casi seguro es un apóstrofo.
> Abre la consola del navegador (F12) y te dirá la línea exacta.

---

## Los cinco idiomas

`src/i18n/ui.js` tiene cinco bloques, en este orden:

```js
  var DICT = {
    en: {  ...inglés...    },
    es: {  ...español...   },
    pt: {  ...portugués... },
    fr: {  ...francés...   },
    it: {  ...italiano...  }
  };
```

Si cambias un texto, **cámbialo en los cinco**, o ese idioma se queda con lo viejo.

> **Cuidado con dónde pegas un bloque nuevo.** Tiene que quedar *dentro* de `var DICT = {…};`
> y no dentro de `META = {…}` que está más arriba. Si te equivocas, ese idioma se ve todo
> en inglés aunque la bandera cambie.

Si no quieres traducir algo todavía, déjalo en inglés en los demás. La página no se
rompe: si falta una clave en un idioma, usa la de inglés automáticamente.

---

## Cómo se escribe *ahavá* en cada idioma

Esto ya está resuelto, pero por si lo quieres ajustar. La clave es `hero.ahava`:

| Idioma | Clave | Valor |
|---|---|---|
| Español | `'hero.ahava'` | `'(ahavá)'` |
| Inglés | `'hero.ahava'` | `'(ahavah)'` |
| Portugués | `'hero.ahava'` | `'(ahavá)'` |
| Francés | `'hero.ahava'` | `'(ahava)'` |
| Italiano | `'hero.ahava'` | `'(ahavà)'` |

La misma palabra aparece también **dentro del párrafo** `about.p2`, escrita a mano en cada
idioma (`Ahavá` / `Ahavah` / `Ahavá` / `Ahava` / `Ahavà`). Si cambias la ortografía en `hero.ahava`,
cámbiala también ahí para que el glosario la siga reconociendo.

---

## El glosario (Ahavá, Emet, Ágape)

Las palabras subrayadas con puntitos abren un panel. Todo eso vive en `src/i18n/terms.js`.

Cada término tiene esta forma:

```js
    ahava: {
      script:   'אַהֲבָה',                    ← la palabra en hebreo
      dir:      'rtl',                        ← 'rtl' hebreo, 'ltr' griego
      language: { es: 'Hebreo bíblico', ... }, ← qué idioma es
      title:    { es: 'Ahavá', en: 'Ahavah', ... },
      forms:    ['ahavá', 'ahavah', 'ahavà', 'ahava'],  ← cómo aparece escrita
      def: {
        es: 'Amor. No nombra un sentimiento...',
        ...
      },
      source: 'Brown, F., Driver, S. R., ...'  ← la cita en APA
    },
```

**Para cambiar una definición:** edita el texto dentro de `def`.
**Para cambiar la fuente:** edita `source`.
**Para que reconozca otra forma escrita:** agrégala a `forms`.

### Para agregar un término nuevo

Copia un bloque completo, pégalo debajo, y cambia el nombre de la izquierda y su contenido.
No hace falta tocar el HTML: la página busca las palabras sola dentro de la sección
*Sobre el camino* y del eslogan.

> **Importante sobre las fuentes.** Las citas que puse son obras estándar y reales
> (Brown-Driver-Briggs para hebreo, Bauer-Danker para griego), con su número de Strong.
> **Verifícalas antes de publicar** y ajusta la edición que tengas a mano. Es tu marca la
> que dice que el origen de cada idea importa.

---

## Cambiar los enlaces de redes

Ahora están **en un solo sitio**: `src/data/social.js`.

```js
{ id: 'instagram', name: 'Instagram', row: true, href: 'https://...' },
```

Cambia solo lo de `href`. Ya no hay que editarlo dos veces: la fila del hero y el panel de
«todas mis plataformas» salen del mismo array.

`row: true` = aparece en la fila visible. `row: false` = solo dentro del panel.

Pendientes de confirmar: Instagram, GitHub, Facebook, TikTok, YouTube, X y VSCO.

---

## No veo mis cambios

Con Astro esto casi no pasa: `npm run dev` recarga solo.

Si publicaste y no ves los cambios, es que falta volver a construir:

```bash
npm run build
```

---

## Lo que es mejor no tocar

- Las **claves** del diccionario (`'links.title'`, `'about.p1'`…).
- Las **llaves** `{ }` y **corchetes** `[ ]`.
- `src/data/icons.js` — está generado a partir de los SVG; se rehace, no se edita.
- Las carpetas `node_modules/`, `dist/` y `.astro/` — se regeneran solas.
- `public/assets/`, salvo para reemplazar una imagen por otra con el mismo nombre.

Si algo se rompe y no sabes qué fue: los archivos son texto plano. Deshaz con **Ctrl + Z**
hasta que vuelva a funcionar, y prueba de nuevo con un cambio más pequeño.
