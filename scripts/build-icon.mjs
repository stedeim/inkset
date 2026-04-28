// Generate build/icon.icns from an inline SVG design.
//
// Design spec (Warm Antiquarian Modernism):
//   - Rounded-square background, Ink Black (#1C1917).
//   - Large Antique Gold (#C8A96E) serif "I" centered, ~60% of canvas height.
//   - Serifs drawn geometrically so the file renders without any external fonts.
//
// Pipeline:
//   1. Rasterize the SVG to a 1024×1024 PNG via sharp.
//   2. Resize into every size macOS needs, naming per Apple's `iconutil` spec.
//   3. Call `iconutil -c icns` to produce build/icon.icns.
//
// Run with: node scripts/build-icon.mjs
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const buildDir = join(__dirname, '..', 'build')
const iconset = join(buildDir, 'icon.iconset')

const SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="224" ry="224" fill="#1C1917"/>
  <!-- Antique-gold serif "I": stem + top/bottom serifs -->
  <g fill="#C8A96E">
    <rect x="452" y="264" width="120" height="496" rx="4" ry="4"/>
    <rect x="348" y="264" width="328" height="46" rx="4" ry="4"/>
    <rect x="348" y="714" width="328" height="46" rx="4" ry="4"/>
    <!-- Inner serif detail — slim corner notches for Cormorant-ish tapering -->
    <rect x="348" y="310" width="44" height="12"/>
    <rect x="632" y="310" width="44" height="12"/>
    <rect x="348" y="702" width="44" height="12"/>
    <rect x="632" y="702" width="44" height="12"/>
  </g>
</svg>`

const SIZES = [
  { name: 'icon_16x16.png', size: 16 },
  { name: 'icon_16x16@2x.png', size: 32 },
  { name: 'icon_32x32.png', size: 32 },
  { name: 'icon_32x32@2x.png', size: 64 },
  { name: 'icon_128x128.png', size: 128 },
  { name: 'icon_128x128@2x.png', size: 256 },
  { name: 'icon_256x256.png', size: 256 },
  { name: 'icon_256x256@2x.png', size: 512 },
  { name: 'icon_512x512.png', size: 512 },
  { name: 'icon_512x512@2x.png', size: 1024 }
]

async function main() {
  mkdirSync(buildDir, { recursive: true })
  rmSync(iconset, { recursive: true, force: true })
  mkdirSync(iconset, { recursive: true })

  const svgBuffer = Buffer.from(SVG, 'utf-8')
  const source = await sharp(svgBuffer, { density: 512 })
    .resize(1024, 1024)
    .png()
    .toBuffer()
  writeFileSync(join(buildDir, 'icon.png'), source)

  for (const { name, size } of SIZES) {
    const out = join(iconset, name)
    await sharp(source).resize(size, size).png().toFile(out)
  }

  // iconutil ships with macOS — produces a proper multi-resolution .icns.
  execSync(`iconutil -c icns "${iconset}" -o "${join(buildDir, 'icon.icns')}"`, {
    stdio: 'inherit'
  })

  console.log(`✔ build/icon.icns generated`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
