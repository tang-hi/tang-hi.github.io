// Generates public/og.png (1200x630) — the default social/share card.
// It frames the site favicon on a clean card next to the blog title, so links
// shared to Twitter/WeChat/Slack and AI answer cards show real branding instead
// of a stretched icon. Re-run after changing the favicon or title:
//   node scripts/gen-og.mjs
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const W = 1200
const H = 630

const TITLE = "Don't Panic"
const TAGLINE = 'Learn, think, and write.'
const BYLINE = 'tang-hi · tangdh.life'

const FG = '#2e405b' // theme foreground
const MUTED = '#6b7892'
const FAINT = '#98a2b8'

// favicon sits in a white card on the left; favicon bg is already white so it blends
const ICON = 320
const ICON_X = 110
const ICON_Y = (H - ICON) / 2
const CARD_PAD = 22

const background = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <!-- faint dotted grid, echoing the site background -->
  <defs>
    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="${FG}" opacity="0.05"/>
    </pattern>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="16" flood-color="${FG}" flood-opacity="0.10"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <!-- left accent bar -->
  <rect x="0" y="0" width="14" height="${H}" fill="${FG}"/>
  <!-- favicon card -->
  <rect x="${ICON_X - CARD_PAD}" y="${ICON_Y - CARD_PAD}"
        width="${ICON + CARD_PAD * 2}" height="${ICON + CARD_PAD * 2}"
        rx="28" fill="#ffffff" stroke="#e7ebf1" stroke-width="2" filter="url(#soft)"/>
  <!-- text block -->
  <text x="520" y="288" font-family="Georgia, 'Times New Roman', serif" font-size="104"
        font-weight="800" fill="${FG}">${TITLE}</text>
  <text x="524" y="356" font-family="Helvetica, Arial, sans-serif" font-size="40"
        fill="${MUTED}">${TAGLINE}</text>
  <text x="524" y="412" font-family="Helvetica, Arial, sans-serif" font-size="30"
        fill="${FAINT}">${BYLINE}</text>
</svg>`

const favicon = await sharp(path.join(root, 'public/favicon.jpg'))
  .resize(ICON, ICON)
  .toBuffer()

await sharp(Buffer.from(background))
  .composite([{ input: favicon, left: ICON_X, top: Math.round(ICON_Y) }])
  .png()
  .toFile(path.join(root, 'public/og.png'))

const { size } = fs.statSync(path.join(root, 'public/og.png'))
console.log(`public/og.png written (${(size / 1024).toFixed(1)} KB, ${W}x${H})`)
