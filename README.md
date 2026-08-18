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
    │   └── utils.js        helpers
    ├── layouts/Base.astro  cabeza, cabecera, pie, paneles
    ├── components/         Header · Hero · SocialRow · Panels · LangPicker · Footer · Icon
    ├── pages/
    │   ├── index.astro     redirige a /es/
    │   └── [lang]/         index · work · projects · writing · about
    ├── scripts/site.js     todo el comportamiento del cliente
    └── styles/             base.css · tablet.css · desktop.css
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

## Escritorio y tablet

Ya no existe el aviso de «en construcción».

**Cabecera larga** (desde 1024 px): marca a la izquierda, las cuatro secciones al centro con
un subrayado Iris que marca dónde estás, e idioma + menú a la derecha.

**El botón de idioma cambia de sitio según el ancho**, y a propósito:

| Ancho | Dónde vive | Cómo se abre |
|---|---|---|
| Móvil (< 600 px) | Flotando abajo a la derecha, sobre la página | Hacia **arriba** |
| Tablet y escritorio (≥ 600 px) | En la cabecera, junto al menú | Hacia **abajo** |

En móvil el pulgar llega abajo, no arriba; en pantallas anchas hay sitio en la cabecera y
flotando estorbaría. Es la misma pieza y el mismo componente: solo cambia `position` en
`tablet.css`, y el desplegable se voltea con `top`/`bottom`.

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

**3.** Listo. Cada vez que hagas `git push`, el flujo de `.github/workflows/deploy.yml`
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
