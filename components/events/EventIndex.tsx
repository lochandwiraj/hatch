'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { EventRow, type EventRowData } from './EventRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sheet } from '@/components/ui/Sheet'
import { Glyph } from '@/components/ui/Glyph'
import { prefersReducedMotion } from '@/lib/motion-lite'
import { normalizeRequiredTier, type Tier } from '@/lib/tier'

/**
 * The filterable ledger. A ledger, never a card grid.
 *
 * The landing page and /events were each carrying their own copy of this
 * filtering, which is how the two drifted apart: the category list on /events
 * named six categories that do not exist in the data. One component now owns
 * the filters, the Flip relayout and the empty state.
 *
 * Filters are the five section 6 asks for: category, mode, tier, date range
 * and text search. On a phone the secondary ones open in a bottom sheet from a
 * sticky bar; at lg they sit inline above the ledger.
 *
 * Tier-locked rows are listed rather than filtered away, so what a paid tier
 * buys is visible. EventRow wraps those in TierLock (behaviour 7).
 */

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'networking', label: 'Networking' },
  { value: 'conference', label: 'Conference' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'other', label: 'Other' },
]

const TIERS = [
  { value: 'all', label: 'All tiers' },
  { value: 'free', label: 'Free' },
  { value: 'basic_99', label: 'Explorer' },
  { value: 'premium_149', label: 'Professional' },
]

export function EventIndex({
  events,
  userTier,
  loading = false,
  /** Hide the secondary filters where the surface is a preview, as on landing. */
  compact = false,
}: {
  events: EventRowData[]
  userTier: Tier
  loading?: boolean
  compact?: boolean
}) {
  const [category, setCategory] = useState('all')
  const [tier, setTier] = useState('all')
  const [mode, setMode] = useState<'all' | 'Online' | 'Offline'>('all')
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter((e) => {
      if (category !== 'all' && !(e.category ?? '').toLowerCase().includes(category)) return false
      if (tier !== 'all' && normalizeRequiredTier(e.required_tier) !== tier) return false
      if (mode !== 'all' && e.mode !== mode) return false
      if (from || to) {
        const d = (e.event_date ?? '').slice(0, 10)
        if (!d) return false
        if (from && d < from) return false
        if (to && d > to) return false
      }
      if (q) {
        const hay = `${e.title} ${e.organizer ?? ''} ${e.category ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [events, category, tier, mode, query, from, to])

  // Filter changes relayout with Flip: the rows that survive travel to their
  // new positions rather than the list fading and reflowing.
  useEffect(() => {
    const el = listRef.current
    if (!el || prefersReducedMotion()) return
    let cancelled = false
    import('@/lib/motion').then(({ registerGsap, Flip }) => {
      if (cancelled) return
      registerGsap()
      const state = Flip.getState(el.querySelectorAll('[data-event-row]'))
      requestAnimationFrame(() => {
        if (!cancelled) {
          Flip.from(state, { duration: 0.42, ease: 'power3.inOut', absolute: true, stagger: 0.02 })
        }
      })
    })
    return () => {
      cancelled = true
    }
  }, [category, tier, mode, query, from, to])

  const hasSecondary = mode !== 'all' || from !== '' || to !== '' || tier !== 'all'

  const secondary = (
    <div className="space-y-4">
      <div>
        <p className="font-sans text-label uppercase text-type-muted">Mode</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['all', 'Online', 'Offline'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`min-h-touch border px-3 py-2 font-sans text-ui-s ${
                mode === m ? 'border-signal bg-signal text-ink' : 'border-rule text-type-secondary'
              }`}
            >
              {m === 'all' ? 'All' : m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-sans text-label uppercase text-type-muted">Tier</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIERS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTier(t.value)}
              aria-pressed={tier === t.value}
              className={`min-h-touch border px-3 py-2 font-sans text-ui-s ${
                tier === t.value ? 'border-signal bg-signal text-ink' : 'border-rule text-type-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <label className="flex-1">
          <span className="block font-sans text-label uppercase text-type-muted">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-2 block min-h-touch w-full border border-rule bg-ink-sunken px-3 py-2 font-mono text-ui-s text-type-primary"
          />
        </label>
        <label className="flex-1">
          <span className="block font-sans text-label uppercase text-type-muted">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-2 block min-h-touch w-full border border-rule bg-ink-sunken px-3 py-2 font-mono text-ui-s text-type-primary"
          />
        </label>
      </div>
    </div>
  )

  return (
    <div>
      {/* Search plus the category row, on both widths. */}
      <div className="mb-4 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search events</span>
          <Glyph
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-type-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or organizer"
            className="block min-h-touch w-full border border-rule bg-ink-sunken py-2 pl-8 pr-3 font-sans text-ui text-type-primary placeholder-type-muted focus:border-rule-strong focus:outline-none"
          />
        </label>

        {!compact ? (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex min-h-touch items-center gap-2 border border-rule px-3 py-2 font-sans text-ui-s text-type-primary lg:hidden"
          >
            <Glyph name="filter" size={16} />
            Filters
            {hasSecondary ? (
              <span data-mono className="text-mono text-signal">
                on
              </span>
            ) : null}
          </button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            aria-pressed={category === c.value}
            className={`min-h-touch border px-3 py-2 font-sans text-ui-s ${
              category === c.value
                ? 'border-signal bg-signal text-ink'
                : 'border-rule text-type-secondary hover:border-rule-strong hover:text-type-primary'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {!compact ? (
        <>
          <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filters">
            {secondary}
          </Sheet>
          <div className="mb-4 hidden lg:block">{secondary}</div>
        </>
      ) : null}

      <div className="mb-2 flex items-baseline justify-between border-b border-rule pb-2">
        <span className="font-sans text-label uppercase text-type-muted">Event</span>
        <span data-mono className="text-mono text-type-secondary">
          {loading ? 'loading' : `${shown.length} listed`}
        </span>
      </div>

      <div ref={listRef}>
        {loading ? (
          <p data-mono className="py-6 text-mono text-type-muted">
            Fetching events
          </p>
        ) : shown.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Nothing matches these filters"
              detail="Every event here is published by hand, so the index moves in steps rather than streams."
              action={{ label: 'Clear filters', href: '/events' }}
            />
          </div>
        ) : (
          shown.map((e) => (
            <div data-event-row key={e.id}>
              <EventRow event={e} userTier={userTier} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default EventIndex
