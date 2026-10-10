// Erzeugt App-Icons und das Start-Logo aus assets/logo-source.webp.
// Aufruf: node scripts/make-icons.mjs
import sharp from 'sharp'

const src = 'assets/logo-source.webp'

// Icons: Innenbereich der Logo-Kachel (ohne abgerundete Ecken), vollflächig.
const INNER = { left: 325, top: 96, width: 376, height: 376 }
for (const [file, size] of [['icon-192', 192], ['icon-512', 512], ['icon-maskable-512', 512]]) {
  await sharp(src)
    .extract(INNER)
    .resize(size, size, { fit: 'cover', position: 'top' })
    .png()
    .toFile(`public/icons/${file}.png`)
}

// Vollständiges Logo (abgerundetes Quadrat, transparent außerhalb) für den Kopfbereich
const CARD = { left: 308, top: 68, width: 410, height: 427 }
const rounded = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.width}" height="${CARD.height}"><rect width="${CARD.width}" height="${CARD.height}" rx="78" fill="#fff"/></svg>`
)
await sharp(src)
  .extract(CARD)
  .ensureAlpha()
  .composite([{ input: rounded, blend: 'dest-in' }])
  .png()
  .toFile('public/icons/logo.png')
console.log('Icons und Logo erzeugt')
