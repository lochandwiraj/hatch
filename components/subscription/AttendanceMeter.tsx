'use client'

import Link from 'next/link'
import { FALLBACK_MONTHLY_CAP, type Tier } from '@/lib/tier'

/**
 * The monthly attendance cap.
 *
 * It is one line: label, cells, count. The previous version was a block that
 * reserved a tall box for a strip of thin cells and left most of it empty,
 * which made the single most important number on the dashboard read as filler.
 *
 * free is 5 a month, Explorer 10, both verified against the live database.
 * `cap` comes from user_attendance_stats.monthly_limit or get_attendance_limit;
 * the constant is a first-paint fallback and never a gate.
 */
export function AttendanceMeter({
  tier,
  used,
  cap,
  variant = 'full',
  className = '',
}: {
  tier: Tier
  used: number
  cap?: number | null
  variant?: 'full' | 'compact'
  className?: string
}) {
  const limit = cap ?? FALLBACK_MONTHLY_CAP[tier]

  // Unlimited, or a tier whose cap has not been read yet. Claim nothing.
  if (limit == null) return null

  const consumed = Math.min(Math.max(used, 0), limit)
  const left = limit - consumed
  const exhausted = left === 0
  const last = left === 1
  const text = `${left} of ${limit} events left this month`
  const tone = exhausted ? 'text-locked' : last ? 'text-deadline' : 'text-type-primary'

  if (variant === 'compact') {
    return (
      <Link
        href="/subscription"
        className={`inline-flex items-center gap-2 border border-rule px-3 py-2 ${className}`}
        aria-label={text}
      >
        <span data-mono className={`text-mono ${tone}`}>
          {left}/{limit}
        </span>
      </Link>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      <span className="font-sans text-label uppercase text-type-muted">Events left this month</span>

      {/* The cells sit inline and keep their own height, so the row stays a row. */}
      <span className="flex min-w-[96px] flex-1 gap-px" role="img" aria-label={text}>
        {Array.from({ length: limit }, (_, i) => {
          const isUsed = i < consumed
          return (
            <span
              key={i}
              className={`h-4 flex-1 overflow-hidden border ${
                isUsed
                  ? exhausted
                    ? 'border-locked'
                    : 'border-signal'
                  : last
                    ? 'border-deadline'
                    : 'border-rule'
              }`}
            >
              <span
                aria-hidden
                className={`block h-full w-full origin-left ${exhausted ? 'bg-locked' : 'bg-signal'}`}
                style={{
                  transform: `scaleX(${isUsed ? 1 : 0})`,
                  transition: 'transform var(--dur-state) var(--ease-enter)',
                }}
              />
            </span>
          )
        })}
      </span>

      <span data-mono aria-live="polite" className={`text-mono ${tone}`}>
        {left}/{limit}
      </span>

      {exhausted ? (
        <Link href="/subscription/upgrade" className="font-sans text-ui-s text-signal rule-underline">
          Raise the cap
        </Link>
      ) : null}
    </div>
  )
}

export default AttendanceMeter
