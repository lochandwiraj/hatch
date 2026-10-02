'use client'

import { useEffect, useState } from 'react'
import { NumberRoll } from './NumberRoll'

/**
 * Motion behaviour 6. A live deadline ticker.
 *
 * registration_deadline is null on 6 of the 13 live events, so a null deadline
 * renders NOTHING: no placeholder, no "TBA", no empty labelled row. Absent is
 * absent.
 *
 * Under 72 hours the block takes --deadline. Under 6 hours the seconds pulse.
 * On phones it drops the days column under 24h to save horizontal space.
 * No colour flashing, no shake.
 */

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function Countdown({
  deadline,
  className = '',
}: {
  deadline: string | null | undefined
  className?: string
}) {
  const target = deadline ? new Date(deadline).getTime() : NaN
  const valid = !Number.isNaN(target)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!valid) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [valid])

  // No deadline on this event. Render nothing at all.
  if (!valid) return null

  const remaining = target - now
  // Closed is not news on an index where most dates have passed. Nothing is
  // rendered, exactly as for an event that never had a deadline.
  if (remaining <= 0) return null

  const { d, h, m, s } = parts(remaining)
  const hours = remaining / 3_600_000
  const urgent = hours < 72
  const critical = hours < 6
  const tone = critical ? 'text-signal' : urgent ? 'text-deadline' : 'text-type-secondary'
  const label = `${d} days ${h} hours ${m} minutes remaining`

  return (
    <span
      data-mono
      className={`inline-flex items-baseline gap-px text-mono ${tone} ${className}`}
      aria-label={label}
      aria-live={critical ? 'polite' : 'off'}
    >
      {/* DD:HH:MM:SS. Under 24h the day column is dropped on phones, where the
          horizontal space is tightest, and kept on larger screens. The old
          condition tested d === 0 inside a d > 0 branch, so it never fired. */}
      <span className={d === 0 ? 'hidden md:inline' : 'inline'}>
        <NumberRoll value={pad(d)} />
        <span aria-hidden>:</span>
      </span>
      <NumberRoll value={pad(h)} />
      <span aria-hidden>:</span>
      <NumberRoll value={pad(m)} />
      <span aria-hidden>:</span>
      <span className={critical ? 'animate-[sec_1s_ease-in-out_infinite] motion-reduce:animate-none' : ''}>
        <NumberRoll value={pad(s)} />
      </span>
      <style>{`@keyframes sec { 0%,100% { opacity: 1 } 50% { opacity: .55 } }`}</style>
    </span>
  )
}

export default Countdown
