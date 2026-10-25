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
    │   ├── biblioteca.js   ← los temas, los tipos de libro y la lista de libros (solo datos)
    │   ├── lomos.js        ← busca los lomos diseñados a mano (solo al compilar)
    │   └── icons.js        ← los SVG en línea (generado, no editar a mano)
    ├── i18n/
    │   ├── ui.js           ← TODOS LOS TEXTOS de la interfaz
    │   ├── terms.js        ← glosario: Ahavá, Emet, Ágape
    │   ├── term-cards.js   ← las tres lecturas de cada palabra (el libro)
    │   ├── term-book.js    ← la cuarta: PaRDeS, la PARE y las fuentes
    │   └── utils.js        helpers
    ├── layouts/Base.astro  cabeza, cabecera, pie, paneles
    ├── components/         Header · Hero · SocialRow · Panels · LangPicker · Footer · Icon · Biblioteca
    ├── pages/
    │   ├── index.astro     redirige a /es/
    │   └── [lang]/         index · work · projects · writing · about
    ├── scripts/
    │   ├── site.js         todo el comportamiento del cliente
    │   └── biblioteca.js   piezas puras: qué idioma abre cada libro, grosor, color del lomo, la ola, la comprobación
    └── styles/             tokens.css · base.css · tablet.css · desktop.css · paper.css · sketch.css · niebla.css · carga.css · biblioteca.css
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
  defecto, y la columna verde de escritorio las pone en hueso. La raya sobre la firma y el aro de la
  cara son trazos de `sketch.css`. No hay que duplicar reglas por contexto: se cambian las variables.
- **Las comillas de la cita son dos piezas dibujadas a mano** (`public/assets/comillas/primera.svg` y
  `segunda.svg`, trazadas de un boceto a lápiz; las dos juntas fueron la medida para colocarlas). Son
  una máscara y el color lo pone la cita con `--rh-tinta`: tinta sobre papel, hueso sobre el pinar
  (negro o blanco, nunca verde). **Se mecen en contrafase**: suben y bajan un 9% de su propio alto
  (`translate`, 3,6 s de ida, arranque y llegada suaves) y cuando una baja la otra sube, como un
  balancín; es lo único de la cita que se mueve, y con movimiento reducido se quedan quietas.
  Para cambiar el movimiento: `comillaVaiven` en `base.css` (la amplitud es el `9%`; para que bailen
  juntas, quitar el `animation-delay` de la segunda).
- **Antes de tocar la altura de algo en la portada, mide el salto entre pantallas.** `initDiapositivas`
  se apaga para TODA la página si una sola pantalla mide más que la ventana + 8 px. Ya están apagadas
  por diseño —páginas más altas que el móvil— `/projects/` y las de pinar a 375×667 y 360×640, y las
  páginas de casa (`/recvid/`…) en todos los tamaños; eso no es una rotura, es scroll normal.
- **La niebla del páramo** (`niebla.css` + `Ligero.astro`, solo en la portada: «¿Qué significa
  caminar ligero?»). Un velo de nubes SVG **delante** del dibujo que lo tapa al empezar y se abre
  mientras se baja, y nubes **intercaladas** entre sus planos 3D: unas detrás de la figura (se
  quedan) y otras delante (`ligero__nube--pasa`, se retiran con el scroll). Las nubes son SVG de
  ruido fractal (`public/assets/paramo/nubes/`, cinco formas × claro/oscuro, las genera una semilla
  fija). Se mueven con animaciones atadas al scroll de CSS —las mismas que ya mueven el «ojo»—: sin JS.
  **Regla: el dibujo se posa a los 88% del recorrido y a partir de ahí no queda ninguna nube
  delante.** **El recorrido depende del formato de la pantalla**: en el teléfono (de pie) mide 220svh
  (120svh de scroll; fue de 300 y se sentía largo, con una cola de 60svh sin nada que pasara) y en un
  portátil o escritorio (apaisada) 340svh (240 de scroll, 211 de animación y 29 de cola), porque con
  220 el paralaje pasaba de un golpe de rueda. Es un solo número por formato en `base.css`
  (`.ligero { min-height }`). **El pie se desliza sobre el páramo** cuando este es lo último de la
  página y la pantalla es apaisada (`main:has(> section.ligero:last-of-type) + .site-footer`, con
  margen negativo de su propia altura, que mide `initPie()` en `site.js` y deja en `--pie-h`): sin
  eso la escena fija se soltaba al final y subía lo que mide el pie, y el sujeto quedaba cortado
  contra la cabecera, a la deriva. En cuanto se ponga otra sección debajo, esto se apaga solo. Sin
  movimiento reducido o sin `animation-timeline` (Firefox) no hay velo ni nubes de delante. En móvil se ocultan las chicas y las más grandes (`*--esc`): cada SVG
  con ruido se rasteriza una vez a su tamaño de pantalla. Para activarla en «Sobre el camino»:
  `<Ligero nubes />`.
- La 404 y el aviso de «la página llegó a medias» **no** usan estas hojas a propósito: tienen que
  salir aunque las hojas no carguen.

Para un trazo nuevo: añade **una** forma como `--tr-algo` en `sketch.css`, súmala a la lista del
molde común y pídela con `mask-image` + `background: <token de tinta>`.

---

## El libro de una palabra: la carga

Cuando un libro tiene su PDF (`tools/books.py` → `src/data/books.js`, hoy Ahavá en
español), el libro son N imágenes y la librería `page-flip`. Antes el panel se abría con una caja
vacía y se confiaba en que todo llegara; si algo se quedaba a medias, el libro salía roto o no salía.
Ahora **el libro no se ve hasta estar entero** y mientras llega ocupa su lugar una carga que dice qué
pasa (`carga.css`, markup en `Panels.astro` → `#book-load`, lógica en `site.js` → «La carga»):

- **La rosa** es el loader de Uiverse (Nawsome), **dibujada a mano con los trazos del resto del
  sitio**: tiza sobre el pinar. Aros de una vuelta que se pasan del punto de partida (se dibujan y
  se borran mientras giran, `pathLength` en 100), agujas contorneadas con el norte rayado, marcas
  que son rayas cortas cada una distinta de su vecina (el pulso sale de un número fijo por posición,
  en `site.js`), una máscara de ruido (`--tiza`) que le quita cuerpo a las líneas, el subrayado
  `--tr-sub-fino` bajo el título y el marco `--tr-marco` en los botones. **Sin color, a propósito**
  (se pidió «blanco o negro, como tinta o lápiz»): es blanco sobre el pinar y lo único que distingue
  una cosa de otra es el peso y la opacidad del trazo. Tiene **una marca por página**: busca (el
  barrido del original, tenue) y se vuelve viva y más gruesa cuando esa página llegó y se
  decodificó; al terminar, una marca de «listo» se dibuja encima. Con movimiento reducido nada gira:
  el aro es una barra de progreso (`--p`), la aguja mira al norte.
- **Los pasos** son «Abriendo el lector → Trayendo las páginas 4 de 10 → Encuadernando el libro →
  Listo», más «un libro de N páginas, se pasan con un toque o las flechas». Cinco idiomas
  (`book.load.*` en `ui.js`).
- **Si tarda** (7 s) avisa y ofrece «Leerlo en texto» (solo si el libro tiene versión escrita: los de
  una palabra; un libro solo en PDF no la tiene) y, si la tapa y el primer pliego ya llegaron,
  «Abrirlo ya». **Si falla** (una imagen, tras 2 reintentos; o la librería, tras 3 intentos) ofrece
  «Intentar otra vez» y «Leerlo en texto». El texto es el libro escrito de siempre (`makePages`).
  Si lo que falló fue la librería, reintentar **recarga** la página y reabre el libro solo
  (`sessionStorage`, `jl-libro`): un `import()` fallido el navegador lo recuerda, y tras un despliegue
  nuevo el archivo con el nombre viejo ya no existe.
- **Si el libro llega al instante** (cache) la carga ni se ve: aparece con 0,3 s de retraso y, si llegó
  a verse, se queda como mínimo 0,9 s para poder leerse. Cerrar el panel o abrir otro libro lo corta
  todo (`fbGen`).

Reglas que no se rompen sin perder esto:

- **Las imágenes del libro no llevan `loading="lazy"`.** Las páginas que `page-flip` no muestra están
  en `display:none` y una imagen perezosa ahí no se pide nunca: la hoja giraba en blanco.
- **`decode()` nunca se espera sin tope.** Con la pestaña oculta el navegador no decodifica y la
  promesa no se resuelve hasta volver (se comprobó): por eso no se espera con la pestaña oculta ni más
  de 1,5 s (`DECODE_CAP`).
- **Una imagen que no contesta en 12 s** (`STALL`) se pide de nuevo con otra URL (`&r=1`); con ahorro
  de datos o red de 3G para abajo solo se pide la de 900 px.
- **El libro ya tiene su tamaño mientras carga** (`flipBox` con ancho y alto, `visibility:hidden`) y
  comparte celda de la rejilla con la carga: así queda centrada justo encima y al llegar nada salta.
- **El golpe del libro suena cuando el libro se ve, no cuando se toca.** El golpe contra la mesa
  (`slam.mp3`) iba atado al toque, y con una carga lenta se oía mientras solo se veía la carga. Ahora,
  en un libro en PDF, `open()` solo despierta el audio (`wake()`, que necesita el toque) y es
  `openFlip` quien llama a `slam()` cuando `reveal()` termina: si el libro llegó antes de verse la
  carga (`'enseguida'`), cae con el cartón de `book-throw` como siempre; si la carga llegó a verse (o
  es un reintento, o hay movimiento reducido), suena **una vez al llegar, más bajo** (`soft`, 0,38 en
  vez de 0,6) y solo si el audio ya está despierto (si no, el golpe esperaría y sonaría en el
  siguiente toque). Si la carga falla, no suena nada. El libro de texto no cambia: aparece al instante
  y suena en el toque.

Para ver la carga sin una conexión mala: un proxy delante del servidor de desarrollo que retrase o
rompa `/books/…` (la 5.ª página con 500, que no conteste, etc.) enseña todos los estados. Para
comprobar el sonido sin fiarse del oído, se envuelve `AudioBufferSourceNode.prototype.start` y se
anota cuándo suena cada cosa y si `#book-load` está a la vista: ningún golpe puede caer con la carga
visible.

---

## La biblioteca de Recursos

`/es/writing/` (Recursos) va en este orden: **cabecera** (tres libros sobre su repisa) → **estanterías** →
**Destacados** (una sección tipo Netflix: cartelera, filas de portadas y un buscador, con parallax). Las
estanterías son un mueble por tema, con los libros de canto —se ve el lomo— sobre repisas en 3D, en una
sala clara de oro pastel. Al pasar el
ratón, el lomo sube y sus vecinos le siguen como una ola. Un toque o un clic lo abre.
(`components/Biblioteca.astro`, estilos en `styles/biblioteca.css`.) Lo que sigue (preguntas y
actividades dentro de los libros, la puerta del pez) está en `biblioteca-interactiva-recursos.md`,
en la carpeta de arriba.

### La cabecera (y la de Trabajos)

**Ya no hay «por dónde seguir» en ninguna cabecera de sección (`PageHero`):** los enlaces a las otras pestañas (el sello y las
puertas de `PageHero`) se quitaron de Recursos y de Trabajos, y en su lugar va algo de la propia página
(`PageHero`, slot `aside`; estilos en `styles/hero-aside.css`). El contenido por defecto del slot
(sello + puertas) sigue en `PageHero.astro` pero **ninguna página lo usa ya**.

- **Recursos:** `components/RepisaLibros.astro`: las tres primeras de `PORTADAS` de frente sobre UNA repisa,
  con su sombra larga, como aparecen en Destacados (tocar un libro lo abre; el de una portada suelta solo
  se ve). Colores y sombras: los de la sala (`--r-*`, repartidos también a `.hrepisa` en `biblioteca.css`).
  Desde 1200 px el lado de la cabecera es el pinar (de día y de noche): la sombra larga se hace negra y el
  aro de foco, claro. El abanico de tres libros inclinados que estuvo aquí del 2026-10-19 al 2026-10-25 se
  quitó (no gustó): ya no existe en el código.
- **Trabajos:** `components/AbanicoTrabajos.astro`: tres portadas de video **en abanico, como las de
  Proyectos** (mismas clases `.covers*` de `base.css`). Las piezas salen de `ABANICO_TRABAJOS` en
  `src/data/piezas.js`: **tres** ids de `PIEZAS_PUBLICAS`, verticales y con tarjeta en el carril de la
  página (solo la hay si su casa está en `PARTNERS`); si no, la compilación para. Cada portada es un botón que abre **su video** en el visor de la página: lleva
  `data-abre-pieza` con el id de la pieza y `initPiezas` (`site.js`) abre la tarjeta del carril que tiene el
  mismo `data-pieza-id`; así el visor, el foco que vuelve y siguiente / anterior son los de siempre y
  las portadas de la cabecera no cuentan en la lista. Se levanta una sola vez (WCAG 2.2.2), primero la del
  medio. Sin texto encima.
- **Quedó la sección «LA PORTADA QUE SE DIBUJA SOLA»** (`.covers__tapa*`, de `Tapa.astro`) en
  `biblioteca.css`: la usan los libros de la cabecera, la cartelera y las filas. **NO se borra.**
- **`PORTADAS` sigue vivo** en `src/data/biblioteca.js`: las portadas **sueltas** (`{ imagen, ancho, alto,
  titulo, subtitulo }`, la de un libro que aún se escribe) salen en la fila **«Pronto»** de Destacados y, si están entre las tres primeras, en la cabecera.
  Hoy: *Nada que demostrar* (`public/assets/portadas/nada-que-demostrar.jpg`). **Cuando tenga su PDF:**
  ponlo en `books/` (`nadaquedemostrar.es.pdf`), corre `python tools/books.py`, añade su línea a `LIBROS`
  con `seccion: 'contrabando'` y en `PORTADAS` cambia la portada suelta por `{ id: 'nadaquedemostrar' }`
  (las entradas con `id` son libros de la cabecera: se ve su portada y se abren). `comprobar()` para la compilación si una portada suelta tiene una imagen fuera de
  `assets/portadas/`.
- **Los temas:** «Teología» es para los libros de una palabra (Ahavá, Emet, Ágape, Rhema…);
  **«Contrabando teológico»** (`contrabando`) es para sus libros propios, como *Nada que demostrar*.
  Sigue la regla de siempre: **un tema sin libros no se dibuja**, así que «Contrabando teológico»
  aparecerá solo con su primer libro.
- La palabra de la sección sobre los estantes es **«Libros»** (`lib.title`), no «Biblioteca»: la página se
  llama Recursos porque ahí vivirán también **los videos** (ver «Lo que falta»); las filas de Destacados
  son el sitio natural para ellos.

### Los libros: dos clases, y el idioma

- **Los libros de una palabra** (Ahavá, Emet, Ágape, Rhema): su texto sale de `terms.js`,
  `term-cards.js` y `term-book.js`, **en los cinco idiomas**, y también se abren desde las
  palabras subrayadas de toda la web. **Son los únicos libros en cinco idiomas.** Hoy son
  **revistas** (pasta blanda). Timoteo es una palabra del glosario, pero no tiene libro escrito:
  en cuanto lo tenga, una línea en `LIBROS`.
- **Los demás libros: solo en español e inglés, y no todos en los dos.** Cada uno dice en qué
  idiomas está (`idiomas`), tiene su título en cada uno y su PDF en `books/<id>.es.pdf` y/o
  `books/<id>.en.pdf`.
- **Qué ve cada página** (`variante()` en `scripts/biblioteca.js`): un libro de otro idioma se ve
  igual, con una marca **ES** o **EN** en el lomo; su nombre accesible lo dice («Libro (en
  inglés): …») y el título lleva su `lang`. La página en español abre el español y la inglesa el
  inglés; **portugués** prefiere español y **francés e italiano**, inglés (`ORDEN`). Un libro en los
  dos idiomas tiene **un solo** lomo y un solo `#id`: abre el de la página.
- **Añadir un libro:** (1) pon el PDF en `books/` (`libertad.es.pdf`, `libertad.en.pdf`), (2) corre
  `python tools/books.py` (convierte las páginas y escribe `src/data/books.js`), (3) añade **una
  línea** en `LIBROS` de `src/data/biblioteca.js` con su tema, tipo, idiomas y título, (4) míralo
  con `npm run dev`. Si falta algo (su PDF convertido, un título en un idioma…) **la compilación se
  para y dice qué**; lo que no es grave avisa (otra proporción que su tipo, un título largo para un
  lomo automático, un PDF convertido que nadie usa). GitHub convierte los PDF solo al publicar
  (`.github/workflows/astro.yml`): al repo solo van los PDF.
- **El nombre del PDF** lleva letras y cifras, empieza por una letra y no lleva guiones; es también
  su dirección (`/es/writing/#libertad`). `tools/books.py` rechaza o avisa de duplicados (`libro.es.pdf`
  y `libro_es.pdf`), de un nombre sin idioma, de más de 300 páginas, de una errata (`emmet`), y solo
  conserva los enlaces del PDF que son `http`, `https` o `mailto`.
- **Un tema sin libros no se dibuja** (ni «pronto» ni su nombre): el día que llegue su primer libro,
  su estante aparece solo, en el orden de `SECCIONES`. Con un solo tema no hay barra de filtros.

### Tapa dura y pasta blanda

`tipo` en `LIBROS`: `tapa-dura`, `revista` o `comic` (`TIPOS` dice cuál es blanda y qué proporción
espera; solo avisa si el PDF se aleja).
- **Tapa dura:** tapa y contratapa rígidas, con cartones detrás, giro lento y sonido de cartón.
- **Pasta blanda (revista, cómic):** todas las hojas son de papel y se doblan, tapa incluida; no hay
  cartones; suena a papel; el golpe contra la mesa es más flojo; el lomo es fino y lleva grapa.
  En el lector de PDF, `page-flip` fuerza rígida la primera y la última página por `showCover`
  (verificado en la versión instalada); `buildFlip` las devuelve a blandas con
  `fb.getPage(i).setDensity('soft')`. En el de texto, `.book[data-tipo="blando"]` (`base.css`).

### El lomo

- **Se dibuja solo** si no hay archivo: el **tono** del libro (`tono` en `LIBROS`: `ocre`, `salvia`,
  `pizarra`, `tierra`, `niebla` o `arena`, los de `TONOS` en `scripts/biblioteca.js`, todos colores de la
  casa), o si no lo tiene el color del cartón de su PDF (`board`, lo mide `tools/books.py`), o el pino;
  la palabra en su alfabeto y el título girado; el texto siempre llega a 4,5:1 (`colorLomo()` oscurece
  el fondo hasta que llegue). El mismo tono pinta su portada dibujada en la cabecera y en Destacados (la cartelera y las filas).
  **La ficha de cada libro** (título, glosa, color, portada, grosor…) sale de **una sola función pura**,
  `fichaLibro()`, que usan la estantería, los libros de la cabecera y Destacados.
- **O lo diseña quien hizo el libro:** `public/assets/lomos/<id>.<idioma>.svg` o `<id>.svg` (o `.png`),
  un rectángulo lleno de borde a borde, sin sombra, marco ni transparencia (los pone el estante).
  **Medidas** (a 1200 px de alto): fino 240×1200, medio 300×1200, grueso 375×1200. Se ve a 224 / 256 /
  288 px de alto según la pantalla y de 45 a 90 px de ancho. Margen seguro: 10 % a cada lado y 72 px
  arriba y abajo; texto de al menos 80 px; se lee de arriba abajo; el lomo es un objeto y no cambia con
  el tema (evita fondos casi negros). Si las medidas se alejan más de un 4 %, o el SVG lleva código
  (`<script>`, `onclick`, `foreignObject`), **no se usa** y se avisa (`src/data/lomos.js`).
- **Grosor** por páginas (`grosorDe()`): libro de tapa dura, fino hasta 12, medio hasta 40, grueso
  más; revista o cómic, fino hasta 40. Se puede fijar con `grosor`. Sale del primer PDF que hay (no
  cambia con el idioma de la página).

### El estante, la ola y las sombras

- **La sala es clara y de oro, nunca verde** (lo pidió el fundador: «o el amarillo o el blanco de mi
  marca, y sus sombras o paleta, deben predominar»). La pared es el oro de la casa muy rebajado sobre el
  papel (`--r-pared` = `--ring-300` al 30% sobre `--paper`) con el grano del papel y una luz blanca que
  entra por arriba a la derecha; las repisas son el mismo oro más hondo y las sombras son oro hondo
  (`--ring-700`) con poca fuerza. **Todo sale de tokens de `base.css` con `color-mix`: no hay un color
  nuevo.** De noche es la misma sala con la luz baja: carbón con un fondo de oro hondo, nunca verde. El
  texto es `--slate` (no se redefine nada dentro de `.biblio`); la ficha pulsada del filtro es pizarra, no
  pino; «Seguir leyendo» es una ficha de papel (`--papel-alto`: papel de día, carbón levantado de noche). Para cambiar la pared a blanco hueso, basta
  cambiar `--r-pared` (y `--r-luz`) en `.biblio`.
- **El 3D es solo CSS:** cada repisa tiene su **cara** de arriba (clara, con luz), su **canto** de frente
  (el oro hondo, que se oscurece hacia abajo) y su **filo**, y bajo el canto cae una **sombra** sobre la
  pared; todo es un `background-image` de degradados duros que se repite cada `--fila` (una repisa por
  fila, `.estante__libros::after`). Los libros se apoyan a mitad de la cara; la luz viene de arriba a la
  derecha, así que cada lomo es más claro por la derecha y su sombra cae a la izquierda. Y **todo el mueble
  proyecta una sombra larga** abajo a la izquierda: `filter: drop-shadow(var(--r-dx) var(--r-dy) 0 …)` en
  `.estante__mueble` (sin desenfoque: una copia desplazada con la silueta de libros y repisas). Los libros
  no miden todos lo mismo: `--k` (de .93 a 1) rebaja el alto del lomo, siempre apoyado en la repisa.
- **Cada fila de libros** mide lo mismo (`--fila` = `--holgura` + `--lomo-h` + `--pie`, todo en píxeles
  enteros: un valor fraccionario desalinearía la repisa que se repite en vertical). **`data-sigue-tema`**
  (en la sección) hace que `initTema` (`site.js`, `fondoEn`) la cuente como papel aunque su color no sea
  el del papel y lleve un degradado: así **el botón del tema se ve en el teléfono sobre la sala**, porque
  la sala sí cambia con el tema. Sin esa marca, la pared se leería como «un campo» y lo escondería.
  Dentro de la sala, `.estante`, `.estante__mueble` y `.estante__libros` siguen **sin fondo propio**; la
  repisa y las sombras viven en pseudoelementos.
- **La ola** (`initBiblioteca`, `ola()` en `scripts/biblioteca.js`): un solo `pointermove` pasivo por
  mueble; en cada fotograma una lectura y luego solo se escriben `--ola` y `--giro` (si cambian); el
  movimiento es `translate` y `rotate`. Solo con ratón y sin «reducir movimiento»; se apaga al salir,
  al desplazar y al cambiar de tamaño. Sin JavaScript, el CSS sube el lomo tocado y sus vecinos
  (`:hover`, `:has()`); con él, `.con-ola` apaga esa versión. Con teclado, `:focus-visible` sube el
  lomo; con movimiento reducido solo sube el tocado, un poco. El `<a>` lleva una **cola** (`.libro::after`)
  de lo que ha subido, para que el clic en la parte baja del lomo siga abriendo el libro.
- **Al acercarse el ratón** se pide la portada del PDF (la de 900 px o la de 1600 si la pantalla es
  densa), con prioridad baja y una espera de 150 ms; con ahorro de datos no se pide nada.
- **Alto contraste de Windows:** la repisa pasa a una línea del color del texto, la sombra larga no se
  pinta y cada lomo lleva su borde (`forced-colors`); sin verificar en un Windows real.

### Destacados: la sección tipo Netflix

Debajo de las estanterías (`components/Destacados.astro`, estilos al final de `biblioteca.css`,
`initDestacados` en `site.js`). Papel blanco de la casa con su grano; las repisas, sombras y aros son los de
la sala (`--r-*`), así que de noche cambian con ella. De arriba abajo:

- **La cartelera** (`CARTELERA` en `src/data/biblioteca.js`: el id de un libro; hoy `ahava`): el libro
  grande, con su **portada de fondo** (la primera página del PDF, apagada y más grande), su **portada de
  frente** inclinada con la sombra larga, el tema, el título, la línea y un botón «Abrir». Sin PDF, el fondo
  es un brillo del color del libro y la portada de frente se dibuja (`Tapa.astro`). `comprobar()` para la
  compilación si `CARTELERA` no es un libro de `LIBROS`.
- **Las filas** (una por tema con libros, en el orden de `SECCIONES`, y al final «Pronto»): las portadas de
  frente (cada una **un solo enlace** a `#id` que abre el mismo lector que el lomo; el foco vuelve a la
  tarjeta) sobre **una repisa seguida** de lado a lado de la fila (antes había una repisa por libro y las
  uniones se veían como costuras), con su cara, canto, filo y sombra, y la sombra larga de cada portada. Cada
  fila es un **riel** que se desliza de lado (scroll-snap, sin barra) con **flechas** que solo salen si la
  fila no cabe, y solo con ratón. Con dedo, se arrastra.
- **El parallax** es CSS puro (`animation-timeline`, dentro de `@supports (animation-timeline: view())` y
  `prefers-reduced-motion: no-preference`; sin soporte o con movimiento reducido todo está quieto y
  completo): en la cartelera, el fondo se mueve ±34 px y la portada de frente ±48 px **en sentidos
  contrarios** mientras la cruza; en cada fila, un **haz de luz barre la pared** (`.fila__pared`, ±15%) más
  despacio que los libros y la repisa, el título entra de lado y **los libros entran de uno en uno**
  (`--i` retrasa cada uno un 6%). La cartelera y cada fila declaran su propia línea de tiempo
  (`view-timeline: --cartelera` / `--fila`) y sus hijos la usan **por nombre**: si los libros usaran
  `view()` a secas medirían el deslizamiento de su riel y no el scroll de la página. Todo es `translate` y
  `opacity`. **Para verificarlo en el panel del navegador de la app:** las líneas de tiempo sí corren ahí;
  espera ~1,5 s tras cada scroll antes de leer `getComputedStyle`.
- **Solo `es` tiene foto de fondo:** `ahava` solo tiene PDF en español (`src/data/books.js`), así que en
  en/pt/fr/it la cartelera lleva un brillo del color del libro y la portada de frente **dibujada** (`Tapa`);
  el parallax del fondo es entonces un degradado que se mueve. Con más PDF, esas páginas ganan la foto sin
  tocar nada.
- **El texto de la cartelera tiene que leerse:** es `--slate` sobre el tono del libro mezclado con el papel
  (`--d-mezcla`, 46% de día y 28% de noche). `Destacados.astro` **para la compilación** si un tono no llega a
  4,5:1 (por ejemplo `pizarra` como cartelera): pon en `CARTELERA` un libro de un tono más claro.
- **El botón del tema en el teléfono:** la sección lleva `data-sigue-tema` y `fondoEn` (`site.js`) cuenta
  como papel todo lo que haya dentro (la cartelera y las paredes de las filas llevan degradados); sin eso el
  botón se escondía sobre Destacados.
- **Flechas:** medio cuerpo fuera del riel, en el margen de la sección, para no tapar el aro de foco de la
  primera tarjeta. **En táctil no hay flechas** (el dedo arrastra el riel; es una decisión, no un olvido).
- **El movimiento solo es de pantalla** (`@media screen and (prefers-reduced-motion: no-preference)`): al
  imprimir todo se ve. Los libros usan `backwards` para soltar su capa al acabar su entrada.
- **El buscador** (solo con JavaScript): una pastilla arriba a la derecha. Cada tarjeta lleva su índice en
  `data-buscar`, armado al compilar con `indexar()` (título, línea, palabra en su alfabeto, id y tema, sin
  acentos, mayúsculas, puntos del hebreo ni tonos del griego). `coincide()` pide todas las palabras; vacío =
  todos. Esconde las tarjetas con `hidden`, **las filas que se quedan sin libros** y, mientras se busca, la
  cartelera (`data-buscando`). Sin resultados: «No encontré ese libro.» y «Ver todos».
- **Lo escrito es texto y nada más:** se lee de `input.value`, se recorta a 60 letras (`BUSCAR_MAX`) y se
  compara con `includes`. **Nunca** va a `innerHTML`, a una expresión regular, a un selector, a la dirección
  ni al almacenamiento, y el aviso de «no hay» no lo repite.
- **Para quien no ve:** una región `role="status"` dice cuántos libros quedan o que no hay (con medio
  segundo de calma). Escape vacía el cuadro; «Ver todos» lo vacía y lleva el foco a él. Las flechas no se
  esconden con el foco encima (`aria-disabled` al llegar al final).
- **Al filtrar cambia el alto de la pantalla:** `initDestacados` lanza el evento `jl:medir` y
  `initDiapositivas` vuelve a medir. La sección lleva `data-libre`.
- **Un truco de CSS que costó un bug:** `.dest__shell`, `.filas` y `.fila` llevan
  `grid-template-columns: minmax(0, 1fr)`. Sin eso, el riel (`width: max-content`) ensanchaba la columna
  entera y nunca se deslizaba.
- **No se inventa nada:** solo salen libros que existen y la portada suelta de lo que se escribe. De la
  referencia (Netflix y la tienda de libros) no se toman estrellas, «Comprar» ni «autor de la semana».
- **Cadenas nuevas** (`lib.featured`, `lib.search`, `lib.search.hint`, `lib.search.none`,
  `lib.search.all`, `lib.open`; las flechas usan `carousel.prev` / `carousel.next` con el nombre de la fila): el español es el original; **en, pt, fr e it son
  borradores sin revisar** (como el resto de `lib.*`). `t()` cae al inglés, no al español, cuando falta una
  clave.

### Direcciones, historial y silencio

- **Cada libro tiene su dirección:** `/es/writing/#ahava`. Las portadas son enlaces de verdad (sin
  JavaScript llevan a su lomo). Con JavaScript, un clic abre el libro encima y deja la ancla;
  **atrás** lo cierra; abrir la dirección lo abre al cargar. Cada documento marca sus entradas del
  historial (`DOC`): si se recarga con el libro abierto, al cerrar solo se quita la ancla. Una
  ancla que no es un libro (`#foo`, `#constructor`) se ignora: solo se compara con una lista de ids
  (`idDeHash`), nunca se usa como selector ni como texto.
- **Lo que se abre sin un toque** (la dirección, atrás, adelante, recargar tras «Intentar otra vez») se
  abre **en silencio**: el navegador deja el audio dormido sin un toque y un golpe programado sonaría
  encima de otro toque, segundos después. `open(id, { silent })` no crea el audio hasta el primer toque
  o tecla (`sinToque`).
- **Mientras el libro está abierto, el resto de la página es inerte** (`inert`, en `sheet()`) para toda
  hoja con `aria-modal="true"` **en el propio panel** (hoy solo `#book-panel`). El salto de pantalla en
  pantalla de la rueda y del teclado tampoco actúa con una hoja abierta.
- **Seguir leyendo:** el último libro que se abre se guarda en el aparato (`localStorage`, `jlr:libro`, solo
  su id), la estantería lo ofrece y su lomo lleva un marcapaginas de papel. Sin almacenamiento no se
  ofrece y no pasa nada; **no viaja entre aparatos**.
- **Al filtrar** una región `role="status"` dice qué queda («Teología: 4 libros») o, al limpiar, «Todos
  los temas: N libros»; «Limpiar» lleva el foco a la primera ficha.
- **La sección lleva `data-libre`:** el salto de pantalla en pantalla la trata como una pantalla alta a
  propósito.
- **Las cadenas nuevas** son `lib.*` en `ui.js`. El español es el original; **en, pt, fr e it son
  borradores sin revisar**. `t()` cae al inglés, no al español, cuando falta una clave.

### Pruebas

`node tools/test-biblioteca.mjs` prueba las piezas puras (`scripts/biblioteca.js`): la ancla (`%E0`,
`#constructor`), lo guardado (almacén que lanza), qué idioma abre cada libro (5 páginas × todos los
casos), el grosor, el color del lomo, los tonos, la ficha de cada libro (igual en las 5 páginas), el
buscador (acentos, hebreo, griego, `.*`, `<img onerror>`, `__proto__`, diez mil letras), la ola y la
comprobación de la compilación (cada entrada mala tiene su prueba). En el navegador se probó abrir cada libro por clic, por ancla, con atrás y adelante,
con el almacenamiento forzado a fallar, la carga lenta (proxy que retrasa `/books/…`), los cinco
idiomas, 360/375/390/1280 de ancho, claro y oscuro. **Sin probar en un teléfono real, Safari de iPhone,
ni con un lector de pantalla.**

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
4. **Recursos, la segunda parte (idea tuya, aún sin construir):** un **scroll con efecto parallax** y, debajo
   de los libros, una sección **estilo panel de Netflix para los videos** (series, tutoriales…) que vayas
   poniendo en la plataforma, organizados de forma muy dinámica. Por eso la página es «Recursos» y los
   libros son solo la primera sala. Cuando llegue, conviene un registro de datos como el de los libros
   (una lista de series, cada una con sus videos) y probar el movimiento con «reducir movimiento».

---

## La versión anterior

`../Personal Web Page/` sigue ahí, intacta y funcionando. Es la versión sin framework, de una
sola página. No la borres todavía: sirve de referencia si algo aquí se ve distinto. Cuando
este proyecto te convenza, se puede archivar.
