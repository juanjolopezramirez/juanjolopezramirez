# Cómo cambiar los textos

Guía para editar la página sin romperla. En español, porque es para ti.

---

## Primero: por qué no te funcionó editar el HTML

Lo intentaste bien. El problema es que `index.html` **no es donde viven los textos**.

Si abres `index.html` y ves esto:

```html
<h2 class="links__title" data-i18n="links.title">Find me here:</h2>
```

Ese `Find me here:` **no se ve nunca**. Es solo un respaldo por si el JavaScript falla.
La parte que manda es `data-i18n="links.title"`: al cargar la página, el archivo
`js/i18n.js` busca la clave `links.title` en el idioma activo y **reemplaza** ese texto.

> **Regla:** si un elemento tiene `data-i18n`, su texto se edita en `js/i18n.js`, no en el HTML.

---

## Dónde vive cada cosa

| Qué quieres cambiar | Archivo | Cómo encontrarlo |
|---|---|---|
| Cualquier texto visible (títulos, párrafos, botones) | `js/i18n.js` | Busca la clave que dice el HTML |
| Definiciones del glosario (Ahavá, Emet, Ágape) | `js/glossary.js` | Busca el nombre del término |
| Enlaces de redes sociales | `index.html` | Busca `href="https://`  |
| Tu correo | `index.html` | Busca `mailto:` |
| Colores, tamaños, animaciones | `styles.css` | — |

---

## Cambiar un texto, paso a paso

Digamos que quieres cambiar **"Encuéntrame aquí:"**.

**1.** Abre `index.html` y busca ese texto o algo parecido. Encuentras:

```html
<h2 class="links__title" data-i18n="links.title">Find me here:</h2>
```

**2.** Copia la clave: `links.title`

**3.** Abre `js/i18n.js` y busca `links.title`. Vas a encontrar **cinco**, una por idioma:

```js
    es: {
      ...
      'links.title':    'Encuéntrame aquí:',
```

**4.** Cambia **solo lo que está entre las comillas simples de la derecha**:

```js
      'links.title':    'Mis redes:',
```

**5.** Guarda, y en el navegador presiona **Ctrl + Shift + R**.

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

`js/i18n.js` tiene cinco bloques, en este orden:

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
> y no dentro de `w.JJ.i18n = {…}` que está más abajo. Si te equivocas, ese idioma se ve todo
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

Las palabras subrayadas con puntitos abren un panel. Todo eso vive en `js/glossary.js`.

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

Estos sí están en `index.html`. Busca `href="https://` y verás:

```html
<a class="link-chip net--linkedin" href="https://www.linkedin.com/in/juanjoselopezramirez"
```

Cambia solo la dirección entre comillas. **Ojo:** cada red aparece **dos veces** — una en
la fila visible y otra en el panel de "todas mis plataformas". Cambia ambas.

Pendientes de confirmar: Instagram, GitHub, Facebook, TikTok, YouTube, X y VSCO.

---

## No veo mis cambios

El navegador guarda copias viejas de los archivos. Por eso los enlaces llevan `?v=13`:

```html
<link rel="stylesheet" href="styles.css?v=13" />
<script src="js/i18n.js?v=13" defer></script>
```

**Si editaste y no ves nada:**

1. Presiona **Ctrl + Shift + R** (recarga forzada).
2. Si aún no, sube el número: cambia **todos** los `?v=13` a `?v=14` en `index.html`.

---

## Lo que es mejor no tocar

- Las **claves** del diccionario (`'links.title'`, `'about.p1'`…).
- Las **llaves** `{ }` y **corchetes** `[ ]`.
- Los `data-i18n`, `data-glossary`, `data-term` del HTML.
- La carpeta `assets/`, salvo para reemplazar una imagen por otra con el mismo nombre.

Si algo se rompe y no sabes qué fue: los archivos son texto plano. Deshaz con **Ctrl + Z**
hasta que vuelva a funcionar, y prueba de nuevo con un cambio más pequeño.
