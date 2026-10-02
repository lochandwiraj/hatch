import Link from 'next/link'
import { TierLock } from './TierLock'
import { useRef } from 'react'
import { haptic } from '@/lib/motion-lite'
import { Countdown } from '@/components/ui/Countdown'
import { Glyph } from '@/components/ui/Glyph'
import { categoryInk } from './DataPlate'
import { canAccessEvent, normalizeRequiredTier, type Tier } from '@/lib/tier'

/**
 * An event is a ROW, not a card. Replaces EventCard.
 *
 * Phone: two lines. Laptop: a real table row inside the ledger. It stays a row
 * at every width, because the content is an index and a card grid would be
 * lying about what this data is.
 *
 * Only populated fields render. prize_pool exists on 1 of 13 events and
 * registration_deadline on 7 of 13, so an empty labelled cell would be the
 * normal case. Absent means absent: no row, no label, no placeholder.
 */

export interface EventRowData {
  id: string
  title: string
  organizer: string | null
  category: string | null
  mode: string | null
  event_date: string | null
  registration_deadline?: string | null
  prize_pool?: string | null
  required_tier: string | null
}

function formatDate(value: string | null): { day: string; month: string } {
  if (!value) return { day: '--', month: '---' }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { day: '--', month: '---' }
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleString('en-GB', { month: 'short' }).toUpperCase(),
  }
}

export function EventRow({ event, userTier }: { event: EventRowData; userTier: Tier }) {
  const rowRef = useRef<HTMLAnchorElement>(null)
  const locked = !canAccessEvent(event.required_tier, userTier)

  // A locked row never navigates. It shears, then opens the upgrade panel.
  if (locked) {
    return (
      <TierLock requiredTier={event.required_tier}>
        <RowBody event={event} />
      </TierLock>
    )
  }

  return (
    <Link
      ref={rowRef}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch') haptic(10)
      }}
      onClick={() => {
        const rows = Array.from(
          rowRef.current?.parentElement?.querySelectorAll<HTMLElement>('a[href^="/events/"]') ?? []
        ).filter((n) => n !== rowRef.current)
        import('@/components/motion/FlipTarget').then(({ startFlip }) =>
          startFlip(event.id, rowRef.current, rows)
        )
      }}
      href={`/events/${event.id}`}
      aria-label={event.title}
      className="block"
    >
      <RowBody event={event} />
    </Link>
  )
}

/**
 * The row's contents. Shared by the navigable row and the locked one, so a
 * locked event reads identically apart from its hatch and lock glyph.
 */
/** Presentational only, so the admin composer can preview an unsaved event. */
export function RowBody({ event }: { event: EventRowData }) {
  const { day, month } = formatDate(event.event_date)
  const ink = categoryInk(event.category)
  const required = normalizeRequiredTier(event.required_tier)
  const locked = false
  return (
    <span className="group grid min-h-touch grid-cols-[56px_1fr] items-start gap-4 border-b border-rule py-4 row-rule lg:grid-cols-[72px_1fr_160px_110px_132px] lg:items-center lg:gap-6 block">
      {/* Date */}
      <span className="block">
        <span data-mono className="block text-[22px] leading-none text-type-primary">
          {day}
        </span>
        <span data-mono className="block text-mono text-type-secondary">
          {month}
        </span>
      </span>

      {/* Title and organizer */}
      <span className="block min-w-0">
        <span
          className={`block font-display text-title uppercase ${
 locked ? 'text-type-muted' : 'text-type-primary group-hover:text-signal'
 }`}
        >
          {event.title}
        </span>
        {event.organizer ? (
          <span className="mt-1 block truncate font-sans text-ui-s text-type-secondary">
            {event.organizer}
          </span>
        ) : null}

        {/* Phone only: the facts fold under the title. */}
        <span className="mt-2 flex flex-wrap items-center gap-3 lg:hidden">
          <span className="font-sans text-label uppercase" style={{ color: ink }}>
            {event.category ?? 'Uncategorised'}
          </span>
          {event.mode ? (
            <span data-mono className="text-mono text-type-muted">
              {event.mode}
            </span>
          ) : null}
          {event.prize_pool ? (
            <span data-mono className="text-mono text-type-primary">
              {event.prize_pool}
            </span>
          ) : null}
          <Countdown deadline={event.registration_deadline} />
          {locked ? <Glyph name="lock" size={14} className="text-locked" /> : null}
        </span>
      </span>

      {/* Laptop columns */}
      <span className="hidden font-sans text-label uppercase lg:block" style={{ color: ink }}>
        {event.category ?? 'Uncategorised'}
      </span>

      <span data-mono className="hidden text-mono text-type-secondary lg:block">
        {event.mode ?? ''}
      </span>

      <span className="hidden items-center justify-end gap-2 lg:flex">
        <Countdown deadline={event.registration_deadline} />
        {event.prize_pool ? (
          <span data-mono className="text-mono text-type-primary">
            {event.prize_pool}
          </span>
        ) : null}
        {locked ? (
          <span className="flex items-center gap-1 border border-rule px-2 py-1">
            <Glyph name="lock" size={14} className="text-locked" />
            <span data-mono className="text-mono text-locked">
              {required === 'basic_99' ? '99' : '149'}
            </span>
          </span>
        ) : null}
      </span>
    </span>
  )
}


export default EventRow
