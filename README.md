# Personal Web Page

Mobile-first personal page for Juanjo López Ramírez. A linktree that behaves like the brand:
quiet, semantic, and honest about where it stops.

## Structure

```
Personal Web Page/
├── index.html          semantic markup, one page
├── styles.css          mobile-first base (tokens, components)
├── main.js             entry point — starts the three modules in order
├── assets/
│   ├── logos/          mark (4 colour variants), signature, mini logo
│   ├── icons/          social + ui icons, flags
│   └── img/            forest-only.png, just-me.png
├── css/
│   ├── tablet.css      @media (min-width: 600px)
│   └── desktop.css     @media (min-width: 1024px) — the "not built yet" notice
└── js/
    ├── i18n.js         ES / EN dictionary and swap
    ├── reveal.js       IntersectionObserver fade-ups
    └── ui.js           menu, "more platforms", language toggle, banner
```

Scripts are plain `<script defer>` (no ES modules) so the page also works when opened
straight from the filesystem.

No `<style>` block and no `style` attribute anywhere in the markup: every rule lives in
`styles.css` (mobile), `css/tablet.css` (≥600px) or `css/desktop.css` (≥1024px). The HTML
names things; the CSS decides how they look.

## Run it

Any static server works. From this folder:

```bash
python -m http.server 8123
```

Then open `http://127.0.0.1:8123`.

Opening `index.html` directly by double-click works too — it is only the local server
that makes fonts and caching behave predictably.

## What is decided

| Element | Value |
|---|---|
| Slate | `#2B3A43` — every word of text on light |
| Bone | `#F1EFE9` — the only ground |
| Pine | `#263B28` — the dark field |
| Iris | `#7D9B4E` — the one line, the mark |
| Ring | `#C08A2E` — once per piece: the footer mark, the desktop notice |
| Role | Creator & Brand Consultant — under the signature, never above it |
| Display | Young Serif — header name only |
| Signature | `signature.svg`, inlined and animated stroke by stroke |
| Footer | `nada-que-demostrar.svg` — the logo, not typed text |
| Text | Bricolage Grotesque — everything read, and every numeral |
| Hand | Petemoss — exactly one word: *ligero* / *lightly* |
| Forest tilt | `3.52deg`, set as `--rot` on `.portrait__forest` |

Contrast: Slate on Bone is 10.1:1. Bone on Pine is 10.4:1.

## How the pieces work

**The cover is one screen, 80vh tall.** Signature, role, tagline, the four links, the
face and the arrow all live in a single flex column so the whole thing can be taken in
at once — the arrow that suggests scrolling is worthless below the fold. The height is
`svh`, the *small* viewport, so nothing hides behind a browser bar that is about to
reappear; plain `vh` sits underneath it for older engines.

**The face is the only thing that gives.** Everything else in the column is
`flex: 0 0 auto`; the portrait takes whatever height is left and its frame stays square
by deriving its width from that height. Below 730px of screen the *type* shrinks first,
because a name can be read smaller and a face cannot. Below 480px — a phone held
sideways — the cover stops pretending to be a screen and simply becomes as tall as what
it holds.

**The links come before the face**, because they are what the page is for; the face is
who is asking.

**The two images are separate on purpose.** `forest-only.png` sits behind at 3.52°;
`just-me.png` rises 220 ms later. Both use `.reveal`, which translates and fades — never
scales. Things arrive as though pulled, not as though swelling into existence.

**The language toggle is `position: fixed`**, bottom-right, clear of the safe-area insets,
so it can be reached at any moment. It shows the flag of the language you would switch *to*:
reading Spanish, you see the UK flag. The choice persists in `localStorage`.

**The "•••" button opens a panel, not a longer page.** Appending the extra platforms
underneath used to push the portrait down the moment anyone was curious, which is an ugly
thing to do to a face. All seven now open in a centred `<dialog>` — icon and name, the
same borrowed brand colour on contact — and the cover behind it does not move by a pixel.
`showModal()` brings the focus trap, the Escape key and the inert page for free, so none
of that is re-implemented in script; the only thing `ui.js` adds is the transition either
side of it. The four that matter are still met first, in the cover itself.

**On hover each chip fills with its platform's own colour and bounces once.** Two custom
properties per chip carry it — `--brand-bg` (a colour *or* a gradient) and `--brand-fg`
(the icon). Both are declared in `styles.css` on a `.link-chip--<platform>` class, so the
markup only names the platform and never carries a colour:

| | background | icon |
|---|---|---|
| LinkedIn | `#0A66C2` | white |
| Instagram | 45° gradient `#f09433 → #bc1888` | white |
| GitHub | `#242C34` | white |
| VSCO | `#F1EFE9` | `#141414` |
| TikTok | 45° gradient `#25F4EE → #010101 → #FE2C55` | white |
| YouTube | `#FF0000` | white |
| X | `#000000` | white |

The chips are transparent at rest, so the page still reads as the mockup; the colour is the
one thing borrowed from outside the five, and only on contact. `chipBounce` animates the
`scale` property — not `transform` — so it composes with the reveal instead of cancelling it.

**The signature is inlined, not an `<img>`**, so its twelve strokes can arrive in turn —
115 ms apart, starting at 250 ms. Each stroke's place in that order is read from its
position in the document (`.sig__p:nth-of-type()`), so nothing has to be numbered by hand
in the markup. `prefers-reduced-motion` shows them all at once.

**The flags are circular in the file, not clipped by CSS.** Both are drawn on a 40×40
viewBox with a `<circle cx=20 cy=20 r=20>` clip path, so the circle is exactly centred and
nothing is cut off. Clipping a square flag with `border-radius` gave an off-centre, chopped
result — the shape belongs in the artwork, not in the stylesheet.

**Desktop (≥1024px) is not built.** Rather than stretch the mobile layout and pretend, the
page shows an amber notice saying the wide version is on its way, and holds the mobile
composition in a 34rem column on a darker ground. The notice is dismissible per session.

**`prefers-reduced-motion`** removes every transition and shows all content immediately.

## TODO before publishing

1. **Replace the social URLs.** Seven profiles are plausible guesses, not confirmed:
   LinkedIn, Instagram, GitHub, VSCO, TikTok, YouTube, X. Each one appears **twice** in
   `index.html` — once as a chip in the cover, once as a row in the panel — so change both.
   The website link (`juanjolopezramirez.com`) is the one that came from your own assets.
2. Add a real `og:image` and social meta if the page will be shared.
3. Decide whether the header nav needs a fifth item once there is a projects page.

## Note on the icons

The icon files inherited from the old site were mislabelled — `figma.svg` was a chevron,
`wordpress.svg` an arrow, `Docker.svg` a line of text, and `down-arrow.svg` was not an arrow
at all (it renders as small glyphs; kept as `down-arrow-mislabelled.svg`). The scroll cue now
uses `arrow-down.svg`, a filled triangle matching the mockup, with its nudge animation. Rather than ship the wrong shape
under the right name, the social and UI icons here were redrawn as one consistent monoline
set. The originals that were usable are kept beside them with an `-original` suffix.

Icons are **inlined into `index.html`**, not loaded as `<img>` or CSS masks. Two reasons:
Chrome blocks SVGs used as `mask-image` when the page is opened over `file://`, which made
every icon render blank; and inline SVG inherits `color` natively, so the per-network hover
colour works without any extra machinery.

The hover lift uses the `translate` property rather than `transform`, because `.reveal`
already owns `transform` and the two would otherwise override each other.

**Cache.** All local CSS/JS links carry a `?v=` query. Bump it when you edit those files,
or the browser will keep serving the old ones — that alone accounted for part of what
looked like broken rendering.
