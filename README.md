# juanjo-web

Sitio personal de Juanjo López Ramírez. **Astro**, estático, cinco idiomas, una URL por idioma.

---

## Cómo ver la página

**No abras ningún archivo con doble clic.** Con Astro no funciona, y es a propósito
(más abajo explico por qué). Se ve así:

```bash
cd juanjo-web
npm install      # solo la primera vez
npm run dev
```

Y abres en el navegador:

```
http://localhost:4321
```

Eso es todo. La raíz te manda a `/es/`. Mientras `npm run dev` esté corriendo, cada vez que
guardes un archivo la página se actualiza sola. Para pararlo: **Ctrl + C** en esa terminal.

### Por qué no puedes abrir el archivo directamente

Si abres `dist/index.html` con doble clic vas a ver una página en blanco o sin estilos. Dos
razones, las dos correctas:

1. **Las rutas son absolutas.** Las imágenes apuntan a `/assets/…`, que significa *desde la
   raíz del sitio*. Al abrir un archivo suelto, el navegador busca en la raíz de tu disco duro.
2. **La raíz es una redirección.** `dist/index.html` no tiene contenido: solo manda a `/es/`.

Ambas cosas son exactamente lo que hace falta para que funcione publicado. Un servidor las
resuelve; abrir un archivo suelto, no.

| Comando | Qué hace |
|---|---|
| `npm run dev` | **El de todos los días.** Servidor local, recarga sola |
| `npm run build` | Genera el sitio final en `dist/` |
| `npm run preview` | Sirve `dist/` tal como quedará publicado — para revisar antes de subir |

---

## Las 25 páginas

Cinco secciones × cinco idiomas:

```
/es/            /es/work/   /es/projects/   /es/writing/   /es/about/
/en/  /pt/  /fr/  /it/   … lo mismo en cada uno
```

**Por qué una URL por idioma:** antes el idioma se cambiaba en el navegador y Google solo
veía una versión. Ahora cada idioma se indexa, se puede compartir un enlace en un idioma
concreto, y cada página declara sus `hreflang`. El selector de banderas ya no traduce: navega,
y **conserva la sección** — desde `/es/work/` te lleva a `/en/work/`.

> Las direcciones están en inglés (`/es/work/`) aunque el texto esté en español. Es a
> propósito: una sola ruta por sección, más simple de mantener. Si prefieres `/es/trabajo/`
> se puede, pero multiplica los archivos por cinco.

---

## Mapa de archivos

```
juanjo-web/
├── astro.config.mjs        idiomas y rutas
├── public/assets/          imágenes, logos, iconos, banderas
└── src/
    ├── data/
    │   ├── social.js       ← las 8 redes y las 4 secciones del menú
    │   └── icons.js        ← los SVG en línea (generado, no editar a mano)
    ├── i18n/
    │   ├── ui.js           ← TODOS LOS TEXTOS de la interfaz
    │   ├── terms.js        ← glosario: Ahavá, Emet, Ágape
    │   ├── term-cards.js   ← las tres lecturas de cada palabra (el libro)
    │   ├── term-book.js    ← la cuarta: PaRDeS, la PARE y las fuentes
    │   └── utils.js        helpers
    ├── layouts/Base.astro  cabeza, cabecera, pie, paneles
    ├── components/         Header · Hero · SocialRow · Panels · LangPicker · Footer · Icon
    ├── pages/
    │   ├── index.astro     redirige a /es/
    │   └── [lang]/         index · work · projects · writing · about
    ├── scripts/site.js     todo el comportamiento del cliente
    └── styles/             tokens.css · base.css · tablet.css · desktop.css · paper.css · sketch.css
```

**Ver [TEXTOS.md](TEXTOS.md)** para cambiar cualquier palabra sin romper nada.

---

## Las secciones, y por qué estas

La propuesta viene de tu perfil: eres consultor **y** creador, y esas dos cosas atraen
públicos distintos.

| Sección | Qué va aquí | Para quién |
|---|---|---|
| **Trabajo** | Marcas, identidades, piezas hechas para clientes | Quien te va a contratar |
| **Proyectos** | Fraterni(U), Su Essencia, lo tuyo propio | Quien quiere entenderte |
| **Escritos** | Ensayos, estudios, el manuscrito | Quien te va a leer |
| **Sobre el camino** | Quién eres, de dónde vienes | Todos, al final |

Separar *Trabajo* de *Proyectos* es la decisión importante: un cliente quiere ver que sabes
resolver lo suyo; un lector quiere ver qué construyes cuando nadie te paga. Mezclarlos
confunde a los dos.

**Escritos es la que más te va a rendir.** Todo tu material ya está en Markdown. Cuando
quieras, esa sección puede leer archivos `.md` directamente y convertirlos en páginas.

Si quieres otro orden o quitar una, se edita `NAV` en `src/data/social.js` y aparece o
desaparece del menú y del pie a la vez.

---

## Papel y tinta

El sitio se dibuja como una hoja de papel mate sobre la que se han marcado ideas con tinta.
Los colores y las tipografías de la casa no cambian: cambia el soporte y el trazo.

| Archivo | Qué hace |
|---|---|
| `src/styles/tokens.css` | La paleta **Paper & Ink** (claro) y **Charcoal & Chalk** (oscuro): `--paper`, `--paper-raised`, `--paper-border`, `--ink`, `--ink-muted`, `--ink-soft`. Se enchufan a los roles que ya existían (`--papel`, `--papel-2`, `--papel-alto`) en `base.css`; no sustituyen a los cinco de la marca. |
| `src/styles/paper.css` | El grano y la fibra del papel, como `background-image` de las superficies. **Una sola lista** de selectores: si una hoja nueva pide `--papel`, se añade ahí. |
| `src/styles/sketch.css` | Los trazos: subrayados, marcos de tarjeta, la costura del pie. Cada forma es un SVG en una variable `--tr-*` que se usa como `mask`, así que el color lo pone el tema. |

**Reglas que conviene no romper**

- **El oro es de la corrección escrita** (y de la línea del camino). Los trazos van en tinta
  (`--ink`, `--trazo-suave`) o en `currentColor`; nunca en `--ring`.
- **La letra sigue siendo el slate de la casa de día.** `ink-muted` da 4.4:1 sobre el papel y no
  llega para texto pequeño. Si algún día se quiere la letra en tinta, es una línea en `base.css`:
  `--slate: var(--ink)`.
- **Los trazos van fuera de flujo** (`::before`/`::after` con `position: absolute` y
  `pointer-events: none`): las pantallas de la portada caben justas y no admiten altura extra.
- **El grano no se anima ni se pone fijo en pantalla.** Va con la hoja.
- **El botón de tema en móvil mira el fondo.** `initTema` (en `site.js`) decide si hay papel debajo
  leyendo el color de fondo de la primera superficie grande, y trata cualquier `background-image`
  como «campo o cielo, no papel». El grano de `paper.css` ES un `background-image`, así que
  `soloGrano()` lo reconoce (SVG en data-URI y nada más). Si algún día el papel lleva otra imagen de
  fondo, hay que enseñársela ahí o el botón dejará de asomar en móvil.
- **El hero es papel bajo 1200 px.** Ya no hay campo verde animado en móvil ni tablet: el bloque
  «EL HERO, EN HOJA» (`paper.css`, al final) reasigna el color de cada pieza (letra, redes, botones,
  ficha) a tinta sobre papel, **solo cambia colores y fondos, nunca tamaños ni márgenes**, porque la
  primera pantalla va justa en un teléfono bajo (5 px de holgura a 375×667). Desde 1200 px el hero es
  el de siempre: columna verde a la izquierda, hoja a la derecha.
- **El pinar que queda lleva grano** solo en las pastillas de la cabecera y los discos de las redes.
  La columna verde del hero de escritorio y las páginas de pinar (`/meet/`, `/direct/`) siguen lisas.
- **La cita (`Rhema.astro`) es una frase, no una ficha.** Su maqueta está en `base.css` y se pinta
  con tres variables locales (`--rh-tinta`, `--rh-suave`, `--rh-oro`, `--rh-trazo`): papel por
  defecto, y la columna verde de escritorio las pone en hueso. La comilla, la raya sobre la firma y
  el aro de la cara son trazos de `sketch.css`. No hay que duplicar reglas por contexto: se cambian
  las variables.
- **Antes de tocar la altura de algo en la portada, mide el salto entre pantallas.** `initDiapositivas`
  se apaga para TODA la página si una sola pantalla mide más que la ventana + 8 px. Ya están apagadas
  por diseño —páginas más altas que el móvil— `/projects/` y las de pinar a 375×667 y 360×640, y las
  páginas de casa (`/recvid/`…) en todos los tamaños; eso no es una rotura, es scroll normal.
- **La niebla del páramo** (`niebla.css` + `Ligero.astro`, solo en la portada: «¿Qué significa
  caminar ligero?»). Es un velo de nubes SVG **delante** del dibujo que lo tapa al empezar y se abre
  mientras se baja, y unas pocas nubes más **entre** sus planos 3D. Las nubes son SVG de ruido
  fractal (`public/assets/paramo/nubes/`, cinco formas × claro/oscuro, las genera una semilla fija).
  Se mueven con animaciones atadas al scroll de CSS —las mismas que ya mueven el «ojo»—: sin JS.
  **Regla: a los 70% del recorrido no queda ninguna nube delante y el dibujo se ve entero.** Sin
  movimiento reducido o sin `animation-timeline` (Firefox) no hay velo. En móvil se ocultan las
  nubes chicas (cada SVG con ruido se rasteriza una vez a su tamaño de pantalla). Para activarla en
  «Sobre el camino»: `<Ligero nubes />`.
- La 404 y el aviso de «la página llegó a medias» **no** usan estas hojas a propósito: tienen que
  salir aunque las hojas no carguen.

Para un trazo nuevo: añade **una** forma como `--tr-algo` en `sketch.css`, súmala a la lista del
molde común y pídela con `mask-image` + `background: <token de tinta>`.

---

## Escritorio y tablet

Ya no existe el aviso de «en construcción».

**Cabecera larga** (desde 1024 px): marca a la izquierda, las cuatro secciones al centro con
un subrayado Iris que marca dónde estás, e idioma + menú a la derecha.

**El botón de idioma cambia de sitio según el ancho**, y a propósito:

| Ancho | Dónde aparece la hoja | Velo detrás |
|---|---|---|
| Móvil (< 600 px) | **Centrada** en la pantalla | Sí |
| Tablet y escritorio (≥ 600 px) | Colgando del botón, arriba a la derecha | No |

El botón vive siempre en la cabecera. Lo que cambia es dónde se abre la hoja: en una pantalla
estrecha, centrada cabe el nombre entero de cada idioma y el pulgar llega igual a las cinco
filas; en una ancha, el botón está a la vista y centrarla obligaría a cruzar la página con la
mirada. Es el mismo componente: solo cambia `position` en `tablet.css`.

La hoja entra acercándose y aclarándose (`scale` + `opacity`), y las filas se escalonan
encima de eso. Al cerrar no se esconde hasta que termina la salida — si no, no habría salida.

**La bandera y el icono de información.** Una bandera no dice «idioma», dice «país», y esa era
la confusión. Por eso cada idioma se nombra en su propio idioma, y la aclaración vive detrás de
un icono ⓘ junto a las banderas: la encuentra quien la busca y no interrumpe a quien no.
El texto está en `lang.note` (cinco idiomas) y la etiqueta del icono en `a11y.langNote`.

**Hero en dos columnas** (desde 600 px):

```
┌ firma · rol · redes ┐  ┌ foto · eslogan ┐
└─────────────────────┘  └────────────────┘
        ┌ SOBRE EL CAMINO ┐   ← centrado, debajo
```

Puse la identidad a la izquierda porque el nombre debe leerse primero. Para invertirlo,
cambia `grid-template-areas` en `src/styles/tablet.css`.

En móvil todo sigue en una columna, en el mismo orden de antes.

---

## Añadir cosas

**Una página nueva:** copia `src/pages/[lang]/work.astro`, renómbrala, y añade sus claves
`page.X.title` y `page.X.lead` a los cinco idiomas en `ui.js`. Si quieres que salga en el
menú, añádela a `NAV` en `src/data/social.js`.

**Una red social nueva:** añádela al array `SOCIAL` en `src/data/social.js`, mete su SVG en
`ICONS` (`src/data/icons.js`) con la misma clave, y añade su color en `base.css`:

```css
.net--mired { --brand-bg: #123456; --brand-fg: #FFFFFF; }
```

**Un idioma nuevo:** añádelo a `LANGS` y `META` en `ui.js`, copia un bloque completo del
diccionario, y pon su bandera circular en `public/assets/icons/`.

---

## Publicar en GitHub Pages

Ya está todo preparado. Solo tienes que hacerlo una vez:

**1.** Sube el repositorio a GitHub (la rama tiene que llamarse `main`).

**2.** En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

**3.** Listo. Cada vez que hagas `git push`, el flujo de `.github/workflows/astro.yml`
construye el sitio y lo publica solo. Puedes ver cómo va en la pestaña **Actions**.

### Lo único que puede salir mal

GitHub Pages sirve el sitio en una dirección distinta según cómo llames al repositorio, y eso
cambia dónde viven las imágenes.

| Tu caso | Dirección | Qué hacer |
|---|---|---|
| Dominio propio `juanjolopezramirez.com` | `https://juanjolopezramirez.com/` | **Nada.** Ya está |
| Repo llamado `<usuario>.github.io` | `https://<usuario>.github.io/` | **Nada.** Ya está |
| Repo con cualquier otro nombre | `https://<usuario>.github.io/<repo>/` | Abre `astro.config.mjs` y pon `base: '/<repo>/',` |

Si no pones el `base` en el tercer caso, la página carga pero **sin estilos ni imágenes**:
todo apunta a la raíz del dominio y ahí no hay nada.

Ya incluí dos archivos que GitHub Pages necesita y que se olvidan siempre:

- `public/CNAME` — tu dominio. Si **no** vas a usar dominio propio, **bórralo**.
- `public/.nojekyll` — impide que GitHub procese el sitio con Jekyll y se coma carpetas.

---

## Lo que falta

Enlaces de redes y citas APA: **confirmados por ti**. Queda:

1. Contenido real de las cuatro secciones nuevas (hoy dicen «En construcción»).
2. `og:image` y meta de redes, si vas a compartir enlaces por WhatsApp o LinkedIn.
3. Decidir si `Escritos` lee archivos Markdown directamente — es donde más rinde tu material.

---

## La versión anterior

`../Personal Web Page/` sigue ahí, intacta y funcionando. Es la versión sin framework, de una
sola página. No la borres todavía: sirve de referencia si algo aquí se ve distinto. Cuando
este proyecto te convenza, se puede archivar.
