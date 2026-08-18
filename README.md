# Personal Web Page

Mobile-first personal page for Juanjo López Ramírez. A linktree that behaves like the brand:
quiet, semantic, and honest about where it stops.

> **Editing the copy?** See **[TEXTOS.md](TEXTOS.md)** — a plain-Spanish guide to where every
> string lives and how to change it without breaking the page. Short version: the words are in
> `js/i18n.js`, not in `index.html`.

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
├── TEXTOS.md           how to edit the copy (in Spanish)
└── js/
    ├── i18n.js         es / en / pt / fr dictionary and swap
    ├── glossary.js     Hebrew and Greek terms, definitions, APA sources
    ├── reveal.js       IntersectionObserver fade-ups
    └── ui.js           menu, "more platforms", language toggle, banner
```

Scripts are plain `<script defer>` (no ES modules) so the page also works when opened
straight from the filesystem.

**There is not a single `style` attribute in `index.html`.** Brand colours, animation
staggers and reveal delays all live in `styles.css`, keyed by class or `:nth-child`. The only
custom property set from JavaScript is `--banner-h`, because it is a measured height and
cannot be known ahead of time. That keeps the markup semantic and every visual decision
inside the stylesheet, where the media queries can reach it.

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
| Display | Young Serif — header name only |
| Signature | `signature.svg`, inlined and written stroke by stroke |
| Role | *Creator & Brand Consultant*, under the signature, translated per language |
| Languages | es · en · pt · fr · it |
| Footer | `nada-que-demostrar.svg` — the logo, not typed text |
| Text | Bricolage Grotesque — everything read, and every numeral |
| Hand | Petemoss — exactly one word: *ligero* / *lightly* |
| Forest tilt | `3.52deg`, set as `--rot` on `.portrait__forest` |

Contrast: Slate on Bone is 10.1:1. Bone on Pine is 10.4:1.

## How the pieces work

**The two images are separate on purpose.** `forest-only.png` sits behind at 3.52°;
`just-me.png` rises 220 ms later. Both use `.reveal`, which translates and fades — never
scales. Things arrive as though pulled, not as though swelling into existence.

**The name is said once.** The signature carries it, so the header wordmark and the
*Nada que demostrar* logo both sit at 20% opacity — present as watermarks, not repeating the
name at full voice. The footer opacity is on the wrapper, not the image, because `.reveal`
owns the image's own opacity and the two would override each other.

**The language picker shows where you are, not where you would go.** Four languages —
Español, English, Português, Français. The button carries the flag of the language you are
*currently reading*; tapping it fans the other three upward, 55 ms apart. A small globe badge
sits on the corner so a flag reads as "language" rather than "country", and the button pulses
three times on arrival, then stops asking. Opening fills the picker with the header's own
Pine 700 and turns the flag a full 360° on a long, soft curve (`--ease-smooth`); the offsets
absorb the padding so the button never moves. `position: fixed`, bottom-right, clear of the
safe-area insets. The choice persists in `localStorage`.

**The "•••" sits in the row itself, beside VSCO**, so it costs no vertical space. It opens a
sheet over the page holding all seven platforms, staggered 45 ms apart, each keeping its circle
and its hover colour. The sheet is an overlay on purpose: expanding the list inline pushed the
portrait down, and a photo that jumps is worse than a tap.

**The portrait is as large as the screen allows, never larger.**
`min(80vw, 19rem, max(9rem, calc(100vh - 500px)))` — the last term is the height left over
once the name, the links and the arrow have taken their share. On a 812 px phone it renders
at 300 px; on a 667 px one it steps down to 167 px so the arrow stays visible. Sizing it on
width alone pushed the arrow 60 px off a short screen.

**The cover is meant to be seen whole.** Signature, role, tagline, links, portrait and the
scroll arrow all fit above the fold on a 375×812 screen — the arrow ends at 699 px. That is why
the links moved above the portrait and the portrait is capped at `min(64vw, 15rem)`.

**On hover each chip fills with its platform's own colour and bounces once.** Every network
has a class — `.net--linkedin`, `.net--github`, and so on — and the class carries two custom
properties, `--brand-bg` (a colour *or* a gradient) and `--brand-fg` (the icon):

| | background | icon |
|---|---|---|
| LinkedIn | `#0A66C2` | white |
| GitHub | `#242C34` | white |
| Instagram | 45° gradient `#f09433 → #bc1888` | white |
| VSCO | `#F1EFE9` | `#141414` |
| Facebook | `#1877F2` | white |
| TikTok | 45° gradient `#25F4EE → #010101 → #FE2C55` | white |
| YouTube | `#FF0000` | white |
| X | `#000000` | white |

The chips are transparent at rest, so the page still reads as the mockup. `chipBounce` animates
the `scale` property — not `transform` — so it composes with the reveal instead of cancelling it.

**Row order:** LinkedIn · GitHub · Instagram · VSCO · ••• — then the sheet continues with
Facebook · TikTok · YouTube · X, so the eight read as one uninterrupted sequence.

**The signature is inlined, not an `<img>`**, so its twelve strokes can arrive in turn —
65 ms apart, starting at 150 ms. `prefers-reduced-motion` shows them all at once.

**The flags are circular in the file, not clipped by CSS.** All four are drawn on a 40×40
viewBox with a `<circle cx=20 cy=20 r=20>` clip path, so the circle is exactly centred and
nothing is cut off. Clipping a square flag with `border-radius` gave an off-centre, chopped
result — the shape belongs in the artwork, not in the stylesheet.

**Desktop (≥1024px) is not built.** Rather than stretch the mobile layout and pretend, the
page shows an amber notice saying the wide version is on its way, and holds the mobile
composition in a 34rem column on a darker ground. The notice is dismissible per session.

**`prefers-reduced-motion`** removes every transition and shows all content immediately.

## TODO before publishing

1. **Replace the social URLs.** Seven `href`s in `index.html` are marked with
   `<!-- TODO Juanjo -->`. They are plausible guesses, not confirmed profiles:
   LinkedIn, Instagram, GitHub, TikTok, YouTube, X. The website link
   (`juanjolopezramirez.com`) is the one that came from your own assets.
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
