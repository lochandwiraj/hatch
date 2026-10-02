import {
  canAccessEvent,
  normalizeRequiredTier,
  normalizeUserTier,
  tierName,
  formatRupees,
  TIER_PRICING,
} from './tier'

/**
 * The tier self-check, kept out of lib/tier.ts.
 *
 * It used to live at the bottom of tier.ts behind a `require?.main === module`
 * guard.
 * Webpack cannot statically analyse that, so every production build warned
 * "Critical dependency" and shipped these assertions to the browser through
 * app/page.tsx. Nothing imports this file, so it is never bundled.
 */
// ---------------------------------------------------------------------------
// Self-check. Run with: npx tsx lib/tier.check.ts
// The security-relevant assertions are the two fail-direction cases.
// ---------------------------------------------------------------------------
declare const require: { main?: unknown } | undefined
declare const module: unknown

export function demo() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error(`FAIL: ${msg}`)
  }

  // Fails closed: an unreadable required_tier must never be openable by free.
  assert(!canAccessEvent(null, 'free'), 'null required_tier must lock out free')
  assert(!canAccessEvent(undefined, 'basic_99'), 'undefined required_tier must lock out basic')
  assert(!canAccessEvent('typo_tier', 'basic_99'), 'unknown required_tier must lock out basic')
  assert(canAccessEvent(null, 'premium_149'), 'premium may still open an unreadable event')

  // Fails to least privilege: an unreadable user tier gets free access only.
  assert(!canAccessEvent('basic_99', null), 'null user tier must not reach basic events')
  assert(!canAccessEvent('basic_99', 'admin'), 'unknown user tier must not reach basic events')
  assert(canAccessEvent('free', null), 'null user tier may still open free events')

  // Normal hierarchy.
  assert(canAccessEvent('free', 'free'), 'free opens free')
  assert(canAccessEvent('free', 'premium_149'), 'premium opens free')
  assert(!canAccessEvent('premium_149', 'basic_99'), 'basic does not open premium')

  // Naming and pricing.
  assert(tierName('basic_99') === 'Explorer', 'basic_99 is Explorer')
  assert(tierName('garbage') === 'Free', 'unknown tier displays as Free')
  assert(TIER_PRICING.basic_99.monthly * 12 - TIER_PRICING.basic_99.annual === 189, 'Explorer saving is 189')
  assert(TIER_PRICING.premium_149.monthly * 12 - TIER_PRICING.premium_149.annual === 289, 'Professional saving is 289')
  assert(formatRupees(1499) === '₹1,499', 'rupee grouping')

  console.log('tier.ts: all checks passed')
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require?.main === module) {
  demo()
}

