const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');

const SRC = 'E:/HANCR/hancr-logo.png.jpeg';
// crop box around the framed icon within the 1024 source photo
const CROP = { x: 168, y: 158, w: 694, h: 688 };

const b64 = fs.readFileSync(SRC).toString('base64');

// 1) full-bleed cropped icon → 1024 PNG buffer
function croppedIconPng() {
  const svg =
    `<svg viewBox="0 0 ${CROP.w} ${CROP.h}" xmlns="http://www.w3.org/2000/svg">` +
    `<image href="data:image/jpeg;base64,${b64}" x="${-CROP.x}" y="${-CROP.y}" width="1024" height="1024"/></svg>`;
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } }).render().asPng();
}

const ICON = croppedIconPng();
const iconB64 = ICON.toString('base64');

// 2) place the cropped icon centered at scale S on a 1024 transparent canvas
function centered(scale) {
  const s = Math.round(1024 * scale);
  const off = Math.round((1024 - s) / 2);
  const svg =
    `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">` +
    `<image href="data:image/png;base64,${iconB64}" x="${off}" y="${off}" width="${s}" height="${s}"/></svg>`;
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 1024 },
    background: 'rgba(0,0,0,0)',
  }).render().asPng();
}

// masters (re-editable sources)
fs.writeFileSync('E:/HANCR/assets/brand/hancr-icon-1024.png', ICON);

for (const dir of [
  'E:/HANCR/apps/rider-app/assets/icon',
  'E:/HANCR/apps/driver-app/assets/icon',
]) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dir + '/icon.png', ICON); // full-bleed framed icon
  fs.writeFileSync(dir + '/icon-foreground.png', centered(0.8)); // adaptive safe-zone
  fs.writeFileSync(dir + '/splash.png', centered(0.62)); // splash mark
  console.log('wrote icons →', dir);
}
console.log('DONE');
