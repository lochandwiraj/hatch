import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

/**
 * Guard: no foreground may sit on a background it cannot be read against, in
 * either theme.
 *
 * This exists because the bug it catches shipped repeatedly. Codemods stripped
 * colour keys out of object literals but left the consuming JSX, so elements
 * kept a fill whose text had been set to the same token: a badge reading
 * "published" became a flat green rectangle, "Delete" became an orange one, the
 * initial inside a user avatar vanished, and three links inside a callout on the
 * About page disappeared entirely. Nothing threw, and the pages looked
 * deliberate enough to survive several review passes.
 *
 * Colour arrives three ways here, and all three are checked:
 *   1. one className chunk        bg-signal ... text-signal
 *   2. a parent fill, child text  <div bg-signal><span text-signal>
 *   3. an inline style object     style={{ background: 'var(--signal)',
 *                                          color: 'var(--signal)' }}
 *
 * Three rules keep it honest, each learned from a wrong answer this check gave:
 *   - Tailwind variants pair within their own layer. `bg-signal hover:bg-ink
 *     hover:text-signal` is fine, because on hover the fill is ink. Comparing
 *     hover text against the base fill invented a bug that was not there.
 *   - A child carrying its own `bg-` is not sitting on its ancestor's fill.
 *   - A ternary's arms never mix. Each arm is scored on its own, or the fill
 *     from one branch gets paired with the text colour from another.
 *
 * Token values are parsed out of globals.css rather than restated, because a
 * hardcoded copy agrees with itself while the palette moves underneath it, and
 * an earlier version of this file reported stale numbers as if they were live.
 *
 * No regex drives the class matching. Backslashes do not survive every heredoc
 * on this project, and a pattern that silently degrades from \s to s reports a
 * clean scan on known-bad input.
 */

const AA = 4.5
const WINDOW = 8
const ROOTS = process.argv.slice(2).length ? process.argv.slice(2) : ['app', 'components']

const lum = (hex) => {
  const ch = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// ---------------------------------------------------------------- tokens ----
const css = readFileSync('app/globals.css', 'utf8')
const block = (marker) => {
  const at = css.indexOf(marker)
  if (at < 0) throw new Error(`globals.css: marker not found: ${marker}`)
  const open = css.indexOf('{', at)
  let depth = 0
  let end = open
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  const vars = {}
  for (const line of css.slice(open, end).split('\n')) {
    const m = line.trim().match(/^--([a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/)
    if (m) vars[m[1]] = m[2].toLowerCase()
  }
  return vars
}
const dark = block(':root {')
const THEMES = { dark, light: { ...dark, ...block(":root[data-theme='light']") } }

// ----------------------------------------------------------------- files ----
const files = []
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.next')) continue
    const p = join(dir, entry)
    statSync(p).isDirectory() ? walk(p) : (p.endsWith('.tsx') || p.endsWith('.ts')) && files.push(p)
  }
}
for (const root of ROOTS) walk(root)

// --------------------------------------------------------------- parsing ----
// Quotes and template holes separate ternary arms. ':' and '?' are deliberately
// NOT separators: splitting on them tears `hover:bg-ink` in half and silently
// drops every variant pair on the floor.
const SPLIT = ['"', "'", '`', '${', '}']

/** Inline colour, rewritten into class shape so every pass can see it. */
const normalize = (line) =>
  line
    .replace(/(?:background|backgroundColor)\s*:\s*'var\(--([a-z-]+)\)'/g, ' bg-$1 ')
    .replace(/(^|[^a-zA-Z])color\s*:\s*'var\(--([a-z-]+)\)'/g, '$1 text-$2 ')

const split = (text) => {
  let parts = [text]
  for (const sep of SPLIT) parts = parts.flatMap((p) => p.split(sep))
  return parts
}
const chunks = (line) => split(normalize(line))
/** Class names only — no inline colour. Conditional style objects are scored
 *  arm by arm in pass 3; pairing them line-wise crosses the ternary's arms. */
const classChunks = (line) => split(line)

/** {variant: {bg:[tokens], text:[tokens]}} for one chunk. */
const layers = (chunk, vars) => {
  const out = {}
  for (const raw of chunk.split(' ').filter(Boolean)) {
    const colon = raw.lastIndexOf(':')
    const variant = colon === -1 ? '' : raw.slice(0, colon)
    const token = colon === -1 ? raw : raw.slice(colon + 1)
    const kind = token.startsWith('bg-') ? 'bg' : token.startsWith('text-') ? 'text' : null
    if (!kind) continue
    const name = token.slice(kind === 'bg' ? 3 : 5)
    if (!vars[name]) continue
    out[variant] ??= { bg: [], text: [] }
    if (!out[variant][kind].includes(name)) out[variant][kind].push(name)
  }
  return out
}

const indent = (line) => line.length - line.trimStart().length
const findings = []
const add = (where, theme, msg, r) =>
  findings.push(`${where} [${theme}] ${msg} = ${r.toFixed(2)}:1${r < 1.3 ? '  INVISIBLE' : ''}`)

// --------------------------------------------------------------- passes -----
for (const [theme, vars] of Object.entries(THEMES)) {
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    const lines = src.split('\n')

    lines.forEach((line, i) => {
      // (1) one chunk, per variant layer
      for (const chunk of chunks(line)) {
        const L = layers(chunk, vars)
        const base = L['']?.bg ?? []
        for (const [variant, { bg, text }] of Object.entries(L)) {
          const fills = bg.length ? bg : base // a variant with no fill keeps the base one
          for (const f of fills)
            for (const t of text) {
              const r = ratio(vars[f], vars[t])
              if (r < AA) add(`${file}:${i + 1}`, theme, `${variant ? variant + ':' : ''}text-${t} on bg-${f}`, r)
            }
        }
      }

      // (2) a fill on this element, text colour on a child below it
      const ownFills = chunks(line).flatMap((c) => layers(c, vars)['']?.bg ?? [])
      if (!ownFills.length) return
      // A fill often sits on a wrapped attribute line indented deeper than its
      // own tag; compare children against the tag's indent, not the attribute's.
      let openIndent = indent(line)
      for (let b = i; b >= 0 && b > i - 6; b--)
        if (lines[b].trimStart().startsWith('<')) {
          openIndent = indent(lines[b])
          break
        }
      for (let k = i + 1; k < Math.min(lines.length, i + 1 + WINDOW); k++) {
        const next = lines[k]
        const trimmed = next.trim()
        if (!trimmed) continue
        // The '>' that closes a wrapped opening tag sits at the tag's own
        // indent. Breaking on it ends the scan before any child is seen, which
        // is how the About callout's three invisible links went unreported.
        if (trimmed === '>' || trimmed === '/>') continue
        if (indent(next) <= openIndent) break // the element closed; stop descending
        // its own fill replaces the ancestor's
        if (chunks(next).some((c) => (layers(c, vars)['']?.bg ?? []).length)) continue
        for (const c of classChunks(next))
          for (const t of layers(c, vars)['']?.text ?? [])
            for (const f of ownFills) {
              const r = ratio(vars[f], vars[t])
              if (r < AA) add(`${file}:${i + 1}`, theme, `bg-${f} wraps text-${t} (line ${k + 1})`, r)
            }
      }
    })

    // (3) inline style, each ternary arm scored on its own. Matches both
    // `style={{ ... }}` and `style={cond ? { ... } : { ... }}`.
    for (let i = src.indexOf('style={'); i !== -1; i = src.indexOf('style={', i + 1)) {
      let depth = 0
      let end = i
      for (let j = src.indexOf('{', i); j < src.length; j++) {
        if (src[j] === '{') depth++
        else if (src[j] === '}') {
          depth--
          if (depth === 0) {
            end = j
            break
          }
        }
      }
      const body = src.slice(i, end + 1)
      // Only leaf objects — those containing no nested '{' — are real style
      // objects. An outer group holding a ternary spans both arms, and scoring
      // it would pair one branch's fill with the other branch's text.
      const arms = []
      for (let a = body.indexOf('{'); a !== -1; a = body.indexOf('{', a + 1)) {
        let d = 0
        for (let j = a; j < body.length; j++) {
          if (body[j] === '{') d++
          else if (body[j] === '}') {
            d--
            if (d === 0) {
              const group = body.slice(a + 1, j)
              if (!group.includes('{')) arms.push(group)
              break
            }
          }
        }
      }
      for (const arm of arms) {
        const bg = arm.match(/(?:background|backgroundColor)\s*:\s*'var\(--([a-z-]+)\)'/)
        const fg = arm.match(/(?:^|[^a-zA-Z])color\s*:\s*'var\(--([a-z-]+)\)'/)
        if (!bg || !fg || !vars[bg[1]] || !vars[fg[1]]) continue
        const r = ratio(vars[bg[1]], vars[fg[1]])
        if (r < AA)
          add(
            `${file}:${src.slice(0, i).split('\n').length}`,
            theme,
            `inline color var(--${fg[1]}) on background var(--${bg[1]})`,
            r
          )
      }
    }
  }
}

// (4) one element whose fill and text colour arrive by different routes.
//
// `<label className="text-signal" style={{ background: 'var(--signal)' }}>` is
// invisible, but pass 1 only reads class names and pass 3 only reads inline
// pairs, so each saw half of it and neither complained. That shipped as the
// "Choose file" control in the payment flow: the one button a student must
// press to attach a screenshot, drawn signal on signal.
for (const [theme, vars] of Object.entries(THEMES)) {
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      const t = line.trim()
      if (!/^<[A-Za-z]/.test(t)) return
      // Gather the opening tag, which usually spans several lines.
      const span = []
      for (let k = i; k < Math.min(lines.length, i + 14); k++) {
        span.push(lines[k])
        const s = lines[k].trim()
        if (k > i && (s === '>' || s === '/>')) break
        if (k === i && /\/?>$/.test(s)) break
        if (/\/?>$/.test(s) && k > i) break
      }
      const text = span.join('\n')
      // A ternary inside the tag means the arms must be scored separately,
      // which passes 1 and 3 already do.
      if (text.includes('?')) return
      const L = layers(split(normalize(text)).join(' '), vars)
      const base = L['']
      if (!base) return
      for (const bg of base.bg)
        for (const fg of base.text) {
          const r = ratio(vars[bg], vars[fg])
          if (r < AA) add(`${file}:${i + 1}`, theme, `element mixes bg-${bg} with text-${fg}`, r)
        }
    })
  }
}

// (5) every text token must clear AA on every surface it can land on
const SURFACES = ['ink', 'ink-raised', 'ink-sunken']
const TEXT = ['type-primary', 'type-secondary', 'type-muted', 'signal', 'verified', 'deadline', 'locked']
for (const [theme, vars] of Object.entries(THEMES))
  for (const t of TEXT) {
    if (!vars[t]) {
      findings.push(`globals.css [${theme}] --${t} is not defined`)
      continue
    }
    for (const s of SURFACES) {
      const r = ratio(vars[t], vars[s])
      if (r < AA) findings.push(`globals.css [${theme}] --${t} on --${s} = ${r.toFixed(2)}:1`)
    }
  }

const unique = [...new Set(findings)]
if (unique.length) {
  for (const f of unique) console.error('  ' + f)
  console.error(`\ncontrast check FAILED: ${unique.length} issue(s)`)
  process.exit(1)
}
console.log(
  `contrast check passed: ${files.length} files, both themes, classes + inline styles, no unreadable fills and every text token clears AA on every surface`
)
