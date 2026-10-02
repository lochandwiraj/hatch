'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { Views } from '@/lib/supabase'
import { Glyph } from '@/components/ui/Glyph'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/components/auth/AuthProvider'
import Header from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

type RegisteredEvent = Views<'user_registered_events'>

/**
 * A day in the grid holds either the event itself, on its event_date, or one
 * day of one of its phases. A hackathon's rounds are the part a student plans
 * around, so a phase occupies every day it runs rather than only its first.
 */
type Entry =
  | { kind: 'event'; key: string; id: string; title: string }
  | { kind: 'phase'; key: string; id: string; title: string; phase: number; first: boolean; last: boolean }

/** events.phases is jsonb: read it defensively, never trust its shape. */
function readPhases(value: unknown): { phase: number; start: string; end: string }[] {
  if (!Array.isArray(value)) return []
  return value
    .map((raw) => {
      const r = (raw ?? {}) as Record<string, unknown>
      const n = Number(r.phase)
      return {
        phase: Number.isInteger(n) ? n : 0,
        start: typeof r.start === 'string' ? r.start.slice(0, 10) : '',
        end: typeof r.end === 'string' ? r.end.slice(0, 10) : '',
      }
    })
    .filter((r) => r.phase > 0 && r.start)
    .sort((a, b) => a.phase - b.phase)
}

/**
 * Every YYYY-MM-DD from start to end inclusive, stepped in UTC.
 *
 * UTC because the stored dates are plain days: stepping them through local
 * time would shift a phase by one day for anyone east of Greenwich, which is
 * every user this product has.
 */
function eachDay(start: string, end: string): string[] {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = (end || start).split('-').map(Number)
  if (!sy || !sm || !sd || !ey || !em || !ed) return []
  let t = Date.UTC(sy, sm - 1, sd)
  const last = Date.UTC(ey, em - 1, ed)
  if (Number.isNaN(t) || Number.isNaN(last) || last < t) return []
  const out: string[] = []
  // A phase longer than a year is a data error, not something to render.
  while (t <= last && out.length < 366) {
    const d = new Date(t)
    out.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    )
    t += 86400000
  }
  return out
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * The calendar. Operate mode: a student opens this to see what they have
 * committed to and when.
 *
 * The month grid used to say nothing. Each cell held a number and, if something
 * was on that day, a 4px dot, so the one question a calendar exists to answer —
 * what is on — could only be answered by reading a separate list beside it. The
 * cells were `cursor-default`, so nothing was clickable either. Now every cell
 * carries the actual titles and each one is a link.
 *
 * Also gone: three skeleton bars that the brief bans outright, two filled cards,
 * a legend whose "Today" swatch was ink-raised drawn on ink-raised and therefore
 * invisible, and month-navigation buttons in the same colour as the panel behind
 * them.
 *
 * The week starts Monday, which is how a college term is read in India, and the
 * month grid is laptop-only: on a phone it becomes the agenda, because 42 cells
 * at 48px wide is a worse answer than a list.
 */
export default function CalendarPage() {
  const { profile, user } = useAuth()
  const [cursor, setCursor] = useState(new Date())
  const [events, setEvents] = useState<RegisteredEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Keyed on the id: AuthProvider returns a new profile object on every
  // refresh, which re-ran this against an unchanged user.
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    supabase
      .from('user_registered_events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) toast.error('Could not load your calendar')
        else setEvents(data ?? [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

/** Everything that lands on a day, keyed YYYY-MM-DD, so a cell is one lookup. */
  const byDate = useMemo(() => {
    const map = new Map<string, Entry[]>()
    const push = (day: string, entry: Entry) => {
      if (!day) return
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(entry)
    }
    for (const e of events) {
      const id = String(e.id ?? '')
      const title = e.title ?? ''
      const key = String(e.registration_id ?? e.id ?? title)
      push((e.event_date ?? '').slice(0, 10), { kind: 'event', key, id, title })
      for (const ph of readPhases((e as { phases?: unknown }).phases)) {
        const days = eachDay(ph.start, ph.end)
        days.forEach((day, i) =>
          push(day, {
            kind: 'phase',
            key: `${key}-p${ph.phase}-${day}`,
            id,
            title,
            phase: ph.phase,
            first: i === 0,
            last: i === days.length - 1,
          })
        )
      }
    }
    return map
  }, [events])

  /** The phases of an event, for the agenda column. */
  const phasesOf = (e: RegisteredEvent) => readPhases((e as { phases?: unknown }).phases)

  const todayKey = toKey(new Date())
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // getDay() is Sunday-first; shift so Monday leads.
  const lead = (new Date(year, month, 1).getDay() + 6) % 7
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // Counts events, not phase days: eight rows for one hackathon is not
  // "eight events this month".
  const monthCount = events.filter((e) => {
    const k = (e.event_date ?? '').slice(0, 10)
    return k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
  }).length

  const upcoming = events
    .filter((e) => (e.event_date ?? '') >= todayKey)
    .sort((a, b) => String(a.event_date).localeCompare(String(b.event_date)))

  const move = (dir: -1 | 1) =>
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1))

  if (!profile) {
    return (
      <div className="min-h-screen bg-ink">
        <Header />
        <div className="px-4 py-16 lg:px-12" role="status" aria-live="polite">
          <p data-mono className="text-mono text-type-secondary">Loading</p>
          <div className="mt-3 h-px w-full bg-rule">
            <div className="h-px w-1/3 bg-signal" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink">
      <Header />

      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 lg:px-12">
        {/* Masthead. The month leads, because that is what changes. */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-rule-strong pb-4">
          <div>
            <p className="font-sans text-label uppercase text-type-muted">Calendar</p>
            <h1 className="mt-1 font-display text-display-m text-type-primary">
              {MONTHS[month]} <span className="text-type-muted">{year}</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <p className="font-sans text-ui-s text-type-secondary">
              <span data-mono className="text-mono-l text-type-primary">{monthCount}</span>{' '}
              {monthCount === 1 ? 'event' : 'events'} this month
            </p>
            <div className="flex items-center">
              <button
                onClick={() => move(-1)}
                aria-label="Previous month"
                className="inline-flex min-h-touch items-center border border-rule-strong px-3 py-2 text-type-primary hover:border-signal hover:text-signal active:border-signal active:text-signal"
              >
                <Glyph name="chevron-left" size={14} />
              </button>
              <button
                onClick={() => setCursor(new Date())}
                className="-ml-px inline-flex min-h-touch items-center border border-rule-strong px-4 py-2 font-sans text-ui-s text-type-primary hover:border-signal hover:text-signal active:border-signal active:text-signal"
              >
                Today
              </button>
              <button
                onClick={() => move(1)}
                aria-label="Next month"
                className="-ml-px inline-flex min-h-touch items-center border border-rule-strong px-3 py-2 text-type-primary hover:border-signal hover:text-signal active:border-signal active:text-signal"
              >
                <Glyph name="chevron-right" size={14} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p data-mono className="py-8 text-mono text-type-muted">Loading your registrations</p>
        ) : (
          <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-8">
            {/* The month. Laptop only. */}
            <section className="hidden lg:col-span-8 lg:block" aria-label={`${MONTHS[month]} ${year}`}>
              <div className="grid grid-cols-7 border-l border-t border-rule">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="border-b border-r border-rule px-2 py-2 text-center font-sans text-label uppercase text-type-muted"
                  >
                    {d}
                  </div>
                ))}

                {cells.map((day, i) => {
                  if (!day) return <div key={i} className="min-h-[108px] border-b border-r border-rule bg-ink-sunken" />
                  const key = toKey(new Date(year, month, day))
                  const dayEntries = byDate.get(key) ?? []
                  const isToday = key === todayKey
                  const isPast = key < todayKey
                  return (
                    <div
                      key={i}
                      className={`min-h-[108px] border-b border-r border-rule p-2 ${isToday ? 'border-t-2 border-t-signal' : ''}`}
                    >
                      <span
                        data-mono
                        className={`block text-mono ${
                          isToday ? 'text-signal' : isPast ? 'text-type-muted' : 'text-type-secondary'
                        }`}
                      >
                        {String(day).padStart(2, '0')}
                      </span>

                      {/* The titles themselves. A dot never answered the question.
                          A phase day carries the round rather than repeating the
                          title as if the event started again. */}
                      <ul className="mt-1 space-y-1">
                        {dayEntries.map((entry) => (
                          <li key={entry.key}>
                            <Link
                              href={`/events/${entry.id}`}
                              title={
                                entry.kind === 'phase'
                                  ? `${entry.title} — phase ${entry.phase}`
                                  : entry.title
                              }
                              className={`block truncate border-l-2 pl-1 font-sans text-ui-s hover:text-signal active:text-signal ${
                                entry.kind === 'event'
                                  ? 'border-signal text-type-primary'
                                  : 'border-rule-strong text-type-secondary'
                              }`}
                            >
                              {entry.kind === 'phase' ? (
                                <>
                                  <span data-mono className="text-mono text-type-muted">
                                    P{entry.phase}
                                  </span>{' '}
                                  {entry.title}
                                </>
                              ) : (
                                entry.title
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* The agenda. The whole page on a phone, a companion at lg. */}
            <section className="lg:col-span-4" aria-labelledby="agenda-heading">
              <h2
                id="agenda-heading"
                className="border-b border-rule-strong pb-2 font-display text-title uppercase text-type-primary"
              >
                Coming up
              </h2>

              {upcoming.length === 0 ? (
                <EmptyState
                  glyph="calendar"
                  title="Nothing ahead"
                  detail="Events you register for appear here by date."
                  action={{ label: 'Browse events', href: '/events' }}
                />
              ) : (
                <ol>
                  {upcoming.map((e) => (
                    <li key={e.registration_id ?? e.id}>
                      <Link
                        href={`/events/${e.id}`}
                        className="row-rule block border-b border-rule py-3 pl-3 hover:text-signal"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span data-mono className="text-mono text-signal">
                            {shortDate(e.event_date)}
                          </span>
                          {e.event_time ? (
                            <span data-mono className="shrink-0 text-mono text-type-muted">
                              {e.event_time}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 font-sans text-ui text-type-primary">{e.title}</p>
                        <p className="mt-1 truncate font-sans text-ui-s text-type-muted">
                          {[e.organizer, e.mode].filter(Boolean).join(' · ')}
                        </p>
                        {phasesOf(e).length > 0 ? (
                          <ul className="mt-2 border-t border-rule">
                            {phasesOf(e).map((ph) => (
                              <li
                                key={ph.phase}
                                className="flex items-baseline justify-between gap-3 py-1"
                              >
                                <span className="font-sans text-ui-s text-type-secondary">
                                  Phase {ph.phase}
                                </span>
                                <span data-mono className="text-mono text-type-muted">
                                  {shortDate(ph.start)}
                                  {ph.end && ph.end !== ph.start ? ` – ${shortDate(ph.end)}` : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ol>
              )}

              {/* Past registrations stay reachable without crowding what is next. */}
              {events.length > upcoming.length ? (
                <p className="mt-4 font-sans text-ui-s text-type-muted">
                  <span data-mono className="text-mono text-type-secondary">
                    {events.length - upcoming.length}
                  </span>{' '}
                  past {events.length - upcoming.length === 1 ? 'event' : 'events'} in your record.
                </p>
              ) : null}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

/**
 * Formats the DATE PART of the stored timestamp, without going through a Date.
 *
 * event_date is stored at UTC midnight, so `new Date(value)` rendered in IST
 * pushes it to 05:30 the same day — and anything stored later in the UTC day
 * rolls over entirely. That is how the month grid came to show an event on the
 * 31st while the agenda beside it called the same event the 1st: the grid
 * buckets on the raw string, the agenda was converting. The string is the
 * authority here, so both now read it the same way.
 */
function shortDate(value: string | null | undefined): string {
  const key = (value ?? '').slice(0, 10)
  const [y, m, d] = key.split('-').map(Number)
  if (!y || !m || !d || m < 1 || m > 12) return '--'
  return `${String(d).padStart(2, '0')} ${MONTH_ABBR[m - 1]}`
}
