/**
 * TTFs for the attendance PDF.
 *
 * jsPDF cannot read woff2, so it cannot reuse app/fonts. It also cannot set a
 * variable axis: a variable TTF embeds and renders at its default instance,
 * which is Regular for both families below. That is fine here, because the
 * report leans on size, case and colour for hierarchy rather than weight, and
 * takes its one bold cut from Barlow Condensed, which ships static.
 *
 * Google's CSS API is not used: its legacy endpoint serves a subsetted format
 * whose first bytes are not sfnt, and jsPDF turns that into silent garbage.
 * These come from the Google Fonts repository as real TTFs, and each one is
 * checked for an sfnt signature before it is written.
 *
 * Run: node scripts/fetch-pdf-fonts.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'

const OUT = 'public/fonts'
mkdirSync(OUT, { recursive: true })

const BASE = 'https://raw.githubusercontent.com/google/fonts/main'

const WANT = [
  { from: `${BASE}/ofl/barlowcondensed/BarlowCondensed-Bold.ttf`, file: 'barlow-condensed-bold.ttf' },
  { from: `${BASE}/ofl/publicsans/PublicSans[wght].ttf`, file: 'public-sans.ttf' },
  { from: `${BASE}/ofl/jetbrainsmono/JetBrainsMono[wght].ttf`, file: 'jetbrains-mono.ttf' },
]

for (const w of WANT) {
  const res = await fetch(w.from)
  if (!res.ok) {
    console.error(`download failed for ${w.file}: ${res.status}`)
    process.exit(1)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const tag = buf.subarray(0, 4)
  const isTtf =
    (tag[0] === 0x00 && tag[1] === 0x01 && tag[2] === 0x00 && tag[3] === 0x00) ||
    tag.toString('ascii') === 'true'
  if (!isTtf) {
    console.error(`${w.file} is not truetype (starts ${tag.toString('hex')}) — refusing to write`)
    process.exit(1)
  }
  writeFileSync(`${OUT}/${w.file}`, buf)
  console.log(`${w.file}  ${(buf.length / 1024).toFixed(0)}KB  sfnt ok`)
}
