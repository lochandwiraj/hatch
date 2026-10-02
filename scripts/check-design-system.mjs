#!/usr/bin/env node
/**
 * Section 4 guard. Run: node scripts/check-design-system.mjs
 *
 * Section 4 asks for a lint rule on box-shadow. This is that, plus the other
 * rules in the same section that are cheap to check and expensive to notice by
 * eye: radius, gradients, backdrop blur, off-scale spacing, three equal
 * columns, banned font families and stray hex colours.
 */
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

function list(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).split('\n').map((s) => s.trim()).filter(Boolean)
  } catch {
    return []
  }
}

const files = [
  ...list('git ls-files "app/*.tsx" "app/**/*.tsx" "app/**/*.css" "components/**/*.tsx"'),
  ...list('git ls-files --others --exclude-standard "app/*.tsx" "app/**/*.tsx" "app/**/*.css" "components/**/*.tsx"'),
]

// The 4px scale. Anything else does not exist in the theme and renders nothing.
const SPACING_OK = new Set(['0', '1', '2', '3', '4', '6', '8', '12', '16', '24', '32', '48', 'px', 'full', 'touch', 'auto'])
const SPACING_PREFIX =
  /(?<![\w-])(?:sm:|md:|lg:|xl:|hover:|focus:|active:|group-hover:|motion-reduce:)*-?(?:px|py|pt|pb|pl|pr|p|mx|my|mt|mb|ml|mr|m|gap-x|gap-y|gap|space-x|space-y)-([\w.]+)/g

// Google's own logo mark keeps its brand colours, as does Razorpay's checkout.
const BRAND_HEX = /#(4285F4|34A853|FBBC05|EA4335)/i

const rules = [
  { re: /box-shadow|boxShadow|textShadow|\bshadow-(sm|md|lg|xl|2xl|inner)\b|drop-shadow-/, msg: 'shadow (section 4: none, repo-wide)' },
  { re: /\brounded(-[a-z0-9[\]]+)?\b|border-radius|borderRadius:/, msg: 'border radius (section 4: 0px everywhere)' },
  { re: /linear-gradient|radial-gradient|conic-gradient|bg-gradient-to-/, msg: 'gradient' },
  { re: /backdrop-blur|backdropFilter|backdrop-filter/, msg: 'backdrop blur' },
  { re: /grid-cols-3\b/, msg: 'three equal columns' },
  { re: /\b(Inter|Geist|Space Grotesk)\b/, msg: 'banned font family' },
  { re: /@heroicons|lucide-react|react-icons/, msg: 'icon package' },
  { re: /\bring-[a-z0-9-]+/, msg: 'ring utility (compiles to box-shadow)' },
]

const failures = []

for (const f of files) {
  let src
  try {
    src = readFileSync(f, 'utf8')
  } catch {
    continue
  }
  const isCss = f.endsWith('.css')

  src.split('\n').forEach((line, i) => {
    const n = i + 1
    const t = line.trim()
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return

    // Explicitly setting a radius or shadow to zero is compliance, not a
    // violation, wherever it appears.
    if (/border-?[Rr]adius:\s*['"]?0|boxShadow:\s*['"]?none|box-shadow:\s*none/.test(line)) return

    for (const r of rules) {
      // globals.css legitimately defines the reset and the hairline patterns.
      if (isCss && /border-radius:\s*0|repeating-linear-gradient/.test(line)) continue
      if (r.re.test(line)) failures.push(`${f}:${n}  ${r.msg}`)
    }

    if (!isCss) {
      for (const m of line.matchAll(SPACING_PREFIX)) {
        if (!SPACING_OK.has(m[1]) && !m[1].startsWith('[')) {
          failures.push(`${f}:${n}  off-scale spacing "${m[0]}" (allowed: 4 8 12 16 24 32 48 64 96 128 192)`)
        }
      }
      for (const m of line.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
        if (!BRAND_HEX.test(m[0])) failures.push(`${f}:${n}  raw hex ${m[0]}, use a token`)
      }
    }
  })
}

if (failures.length) {
  console.error(`DESIGN SYSTEM CHECK FAILED (${failures.length})\n` + failures.slice(0, 40).map((x) => '  ' + x).join('\n'))
  if (failures.length > 40) console.error(`  ... and ${failures.length - 40} more`)
  process.exit(1)
}

console.log(`design system check passed: ${files.length} files, no shadows, radius, gradients, blur, three-column grids, off-scale spacing or raw hex`)
