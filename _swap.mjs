import fs from 'fs';
const must = (h, n, w) => { if (!h.includes(n)) { console.error('MISSING: ' + w); process.exit(1); } };

/* ---------- 1. la cita: en escritorio, el recorte del hero ---------- */
let r = fs.readFileSync('src/components/Rhema.astro', 'utf8');
const crlf = r.includes('\r\n');
const fix = x => crlf ? x.replace(/\n/g, '\r\n') : x;

const rOld = fix([
'    <picture class="rhema__face">',
'      <source srcset="/assets/img/me-face.webp" type="image/webp" />',
'      <img src="/assets/img/me-face.jpg" alt="" width="512" height="512"',
'           loading="lazy" decoding="async" />',
'    </picture>'
].join('\n'));
must(r, rOld, 'rhema face picture');

const rNew = fix([
'    <!-- En escritorio la cara es el recorte del hero, sin fondo; por',
'         debajo de 1200px sigue el retrato de siempre. El navegador elige',
'         por ancho, asi que solo se descarga una. -->',
'    <picture class="rhema__face">',
'      <source media="(min-width: 1200px)" srcset="/assets/img/me-hero-face.webp" type="image/webp" />',
'      <source media="(min-width: 1200px)" srcset="/assets/img/me-hero-face.png" />',
'      <source srcset="/assets/img/me-face.webp" type="image/webp" />',
'      <img src="/assets/img/me-face.jpg" alt="" width="512" height="512"',
'           loading="lazy" decoding="async" />',
'    </picture>'
].join('\n'));
r = r.replace(rOld, rNew);
fs.writeFileSync('src/components/Rhema.astro', r, 'utf8');

/* ---------- 2. el hero: en escritorio, el retrato con fondo ---------- */
let h = fs.readFileSync('src/components/Hero.astro', 'utf8');
const hOld = fix([
'      <source media="(min-width: 1200px)" srcset="/assets/img/me-hero.webp" type="image/webp" />',
'      <source media="(min-width: 1200px)" srcset="/assets/img/me-hero.png" />'
].join('\n'));
must(h, hOld, 'hero desktop sources');
const hNew = fix([
'      <source media="(min-width: 1200px)" srcset="/assets/img/me-face.webp" type="image/webp" />',
'      <source media="(min-width: 1200px)" srcset="/assets/img/me-face.jpg" />'
].join('\n'));
h = h.replace(hOld, hNew);
fs.writeFileSync('src/components/Hero.astro', h, 'utf8');

/* ---------- 3. la precarga apunta a lo que de verdad se pinta ---------- */
let b = fs.readFileSync('src/layouts/Base.astro', 'utf8');
const bOld = 'href="/assets/img/me-hero.webp"';
must(b, bOld, 'hero preload');
b = b.replace(bOld, 'href="/assets/img/me-face.webp"');
fs.writeFileSync('src/layouts/Base.astro', b, 'utf8');

console.log('swap ok');
