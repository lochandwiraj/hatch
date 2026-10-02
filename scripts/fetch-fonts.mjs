/**
 * Downloads the latin woff2 for every family/weight/style app/layout.tsx asks
 * for, so the production build stops fetching fonts.gstatic.com at build time.
 */
import { mkdirSync, writeFileSync, existsSync } from 'fs'

const OUT = 'app/fonts'
mkdirSync(OUT, { recursive: true })

// A modern UA, or the CSS API serves ttf instead of woff2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const FAMILIES = [
  { css: 'Barlow+Condensed', file: 'barlow-condensed', weights: [700, 800], italic: false },
  { css: 'Public+Sans', file: 'public-sans', weights: [400, 500, 600], italic: false },
  { css: 'Source+Serif+4', file: 'source-serif-4', weights: [400, 600], italic: true },
  { css: 'JetBrains+Mono', file: 'jetbrains-mono', weights: [400, 500], italic: false },
]

const results = []

for (const fam of FAMILIES) {
  // ital,wght tuples must be ascending: all normals, then all italics.
  const spec = fam.italic
    ? `ital,wght@${fam.weights.map((w) => `0,${w}`).join(';')};${fam.weights.map((w) => `1,${w}`).join(';')}`
    : `wght@${fam.weights.join(';')}`
  const url = `https://fonts.googleapis.com/css2?family=${fam.css}:${spec}&display=swap`

  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) {
    console.error(`FAILED css for ${fam.css}: ${res.status}`)
    process.exit(1)
  }
  const css = await res.text()

  // Blocks are preceded by a /* subset */ comment; keep latin only.
  const chunks = css.split('/*').slice(1)
  for (const chunk of chunks) {
    const subset = chunk.slice(0, chunk.indexOf('*/')).trim()
    if (subset !== 'latin') continue
    const weight = chunk.match(/font-weight:\s*(\d+)/)?.[1]
    const style = /font-style:\s*italic/.test(chunk) ? 'italic' : 'normal'
    const src = chunk.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
    if (!weight || !src) continue

    const name = `${fam.file}-${weight}${style === 'italic' ? '-italic' : ''}.woff2`
    const path = `${OUT}/${name}`
    if (!existsSync(path)) {
      const bin = await fetch(src, { headers: { 'User-Agent': UA } })
      if (!bin.ok) {
        console.error(`FAILED download ${name}: ${bin.status}`)
        process.exit(1)
      }
      writeFileSync(path, Buffer.from(await bin.arrayBuffer()))
    }
    results.push({ family: fam.file, weight, style, name })
  }
}

console.log(`${results.length} files in ${OUT}:`)
for (const r of results) console.log(`  ${r.name}  (${r.family} ${r.weight} ${r.style})`)
