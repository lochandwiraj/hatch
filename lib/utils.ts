import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  normalizeUserTier,
  normalizeRequiredTier,
  canAccessEvent,
  tierName,
  formatRupees,
  TIER_PRICING,
  FALLBACK_MONTHLY_CAP,
  type Tier,
} from './tier'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Dates. Every one of these accepts null, because the live schema is full of
 * nullable timestamps: event_date on the registered-events view, deadlines on
 * 6 of 13 events, attended_at, reviewed_at and so on. Returning an em dash was
 * never an option (banned), so an absent date renders as an empty string and
 * the caller simply shows nothing.
 */
function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDate(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return ''
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatDateShort(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return ''
  return new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

export function formatTime(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return ''
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(d)
}

/** Re-exported so there is one tier implementation, not two. See lib/tier.ts. */
export { normalizeUserTier, normalizeRequiredTier, canAccessEvent, formatRupees, TIER_PRICING }
export type { Tier }

export function getSubscriptionTierName(tier: string | null | undefined): string {
  return tierName(tier)
}

export function getSubscriptionTierPrice(tier: string | null | undefined, isAnnual = false): string {
  const t = normalizeUserTier(tier)
  if (t === 'free') return formatRupees(0)
  const p = TIER_PRICING[t]
  return isAnnual ? `${formatRupees(p.annual)}/year` : formatRupees(p.monthly)
}

/**
 * The monthly attendance cap. CORRECTED.
 *
 * This used to return 5 / 7 / unlimited, describing a "curated events" limit
 * that does not exist in the database. The real constraint is the monthly
 * attendance cap: free 5, Explorer 10, verified against the live data.
 * Prefer user_attendance_stats.monthly_limit or get_attendance_limit; this is
 * a first-paint fallback. null means "not known", never "unlimited".
 */
export function getEventLimit(tier: string | null | undefined): number | null {
  return FALLBACK_MONTHLY_CAP[normalizeUserTier(tier)]
}

export function getEventLimitDescription(tier: string | null | undefined): string {
  const cap = getEventLimit(tier)
  return cap == null ? 'Highest monthly limit' : `${cap} events per month`
}

export function getManualEventLimit(tier: string | null | undefined): number {
  return normalizeUserTier(tier) === 'free' ? 2 : -1
}

export function getAnnualDiscount(tier: string | null | undefined) {
  const t = normalizeUserTier(tier)
  if (t === 'free') return null
  const p = TIER_PRICING[t]
  return { monthly: p.monthly * 12, annual: p.annual, savings: p.saving }
}

/** Kept for existing callers. Delegates to the fail-closed gate in tier.ts. */
export function isEventAccessible(
  eventTier: string | null | undefined,
  userTier: string | null | undefined
): boolean {
  return canAccessEvent(eventTier, userTier)
}

export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return ''
  return text.length <= maxLength ? text : text.slice(0, maxLength) + '...'
}
