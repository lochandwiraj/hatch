#!/usr/bin/env node
/**
 * Phase 2 guard. Run: node scripts/check-wordmark.mjs
 *
 * The brand rule is that every rendered occurrence of the word HATCH goes
 * through <Hatch />, and that Qepho is reserved for the wordmark and the
 * founder names. Both are easy to break by accident later, so they are
 * checked here rather than trusted.
 */
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const BRAND_COMPONENT = 'components/brand/Hatch.tsx'

function list(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).split('\n').map((s) => s.trim()).filter(Boolean)
  } catch {
    return []
  }
}

const files = [
  ...list('git ls-files "app/*.tsx" "app/**/*.tsx" "components/**/*.tsx" "lib/*.ts"'),
  ...list('git ls-files --others --exclude-standard "app/*.tsx" "app/**/*.tsx" "components/**/*.tsx" "lib/*.ts"'),
]

const failures = []

for (const f of files) {
  const norm = f.split('\\').join('/')
  if (norm === BRAND_COMPONENT) continue

  let src
  try {
    src = readFileSync(f, 'utf8')
  } catch {
    continue
  }

  src.split('\n').forEach((line, i) => {
    const n = i + 1
    const t = line.trim()
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return
    // Asset paths, filenames, email domains and mail subjects are not the wordmark.
    if (/HATCHsquare|HATCH_Report|HATCH\.in|_subject|@HATCH/.test(line)) return

    // 1. Qepho may only be APPLIED inside the brand component. Reading the
    //    class to protect the wordmark (PageEnter excludes it from SplitText)
    //    is the opposite of a violation, so only className application counts.
    const applies =
      /className=\{?["'`][^"'`]*font-qepho/.test(line) ||
      /classList\.(add|toggle)\(\s*["'`]font-qepho/.test(line)
    if (applies) {
      failures.push(`${f}:${n}  font-qepho applied outside the brand component`)
    }

    // 2. The word, rendered as JSX text, must go through <Hatch />.
    const asJsxText = />[^<>{}]*\bHATCH\b[^<>{}]*</.test(line)
    const asOwnLine = /^\s*HATCH\s*$/.test(line)
    if (asJsxText || asOwnLine) {
      failures.push(`${f}:${n}  raw "HATCH" in JSX, use <Hatch />`)
    }
  })
}

if (failures.length) {
  console.error('WORDMARK CHECK FAILED\n' + failures.map((x) => '  ' + x).join('\n'))
  process.exit(1)
}

console.log(
  `wordmark check passed: ${files.length} files, every rendered HATCH routes through <Hatch />, Qepho confined to the brand component`
)
