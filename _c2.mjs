import sharp from 'sharp';
const src = 'public/assets/img/me-hero.png';
// mas atras: el cuadro crece, asi que la cara ocupa menos dentro del circulo
const cands = { a: { left: 210, top: 0, size: 410 }, b: { left: 155, top: 0, size: 465 } };
for (const [k, c] of Object.entries(cands)) {
  await sharp(src).extract({ left: c.left, top: c.top, width: c.size, height: c.size })
    .resize(512, 512).png().toFile('./_tmp/try-' + k + '.png');
}
console.log('done');
