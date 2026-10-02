/**
 * Tier logic. Single source of truth.
 *
 * WHY THIS EXISTS: `events.required_tier` and `user_profiles.subscription_tier`
 * are nullable `text` in the live database with NO check constraint. The old
 * hand-written types in lib/supabase.ts claimed they were enums. They are not.
 * So a null, or a typo, or a tier value this build has never heard of, can and
 * does reach the client. Normalize at the boundary, never trust the row.
 *
 * The two directions are deliberately asymmetric, and that asymmetry is the
 * whole point of this file:
 *   an unknown REQUIRED tier  -> most restrictive  (fail closed, never leak)
 *   an unknown USER tier      -> least privilege   (free)
 * Defaulting a required_tier to 'free' would unlock every paid event the
 * moment a row is written badly. Do not "simplify" that away.
 */

export const TIERS = ['free', 'basic_99', 'premium_149'] as const
export type Tier = (typeof TIERS)[number]

const RANK: Record<Tier, number> = { free: 0, basic_99: 1, premium_149: 2 }

const MOST_RESTRICTIVE: Tier = 'premium_149'
const LEAST_PRIVILEGE: Tier = 'free'

function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIERS as readonly string[]).includes(value)
}

/** Normalize a tier read from `user_profiles.subscription_tier`. Fails to free. */
export function normalizeUserTier(value: unknown): Tier {
  return isTier(value) ? value : LEAST_PRIVILEGE
}

/** Normalize a tier read from `events.required_tier`. Fails CLOSED. */
export function normalizeRequiredTier(value: unknown): Tier {
  return isTier(value) ? value : MOST_RESTRICTIVE
}

export function tierRank(tier: Tier): number {
  return RANK[tier]
}

/**
 * Visibility gate. Limit 1 of 2.
 * A user may open an event when their rank is at or above the event's.
 */
export function canAccessEvent(requiredTier: unknown, userTier: unknown): boolean {
  return RANK[normalizeUserTier(userTier)] >= RANK[normalizeRequiredTier(requiredTier)]
}

/** Display name, as shown to users. */
export function tierName(value: unknown): string {
  switch (normalizeUserTier(value)) {
    case 'basic_99':
      return 'Explorer'
    case 'premium_149':
      return 'Professional'
    default:
      return 'Free'
  }
}

export const TIER_PRICING: Record<Tier, { monthly: number; annual: number; saving: number }> = {
  free: { monthly: 0, annual: 0, saving: 0 },
  basic_99: { monthly: 99, annual: 999, saving: 189 },
  premium_149: { monthly: 149, annual: 1499, saving: 289 },
}

/**
 * Monthly attendance cap. Limit 2 of 2, and the real product constraint.
 *
 * These are FALLBACKS ONLY, for optimistic render before the RPC resolves.
 * The database is authoritative: read `user_attendance_stats.monthly_limit`,
 * or call `get_attendance_limit`. Never gate an action on this constant.
 * Verified against the live database 2026-10-01: free 5, basic_99 10.
 * premium_149 has never been observed, so it is not guessed here.
 */
export const FALLBACK_MONTHLY_CAP: Record<Tier, number | null> = {
  free: 5,
  basic_99: 10,
  premium_149: null,
}

/** Rupee formatting. Indian grouping, no decimals, no currency-code noise. */
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

// ---------------------------------------------------------------------------
// Self-check. Run with: npx tsx lib/tier.ts   (or ts-node)
// The security-relevant assertions are the two fail-direction cases.
// ---------------------------------------------------------------------------
declare const require: { main?: unknown } | undefined
declare const module: unknown

function demo() {
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
