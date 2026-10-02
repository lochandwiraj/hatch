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

  /** Events bucketed by YYYY-MM-DD, so a cell is one map lookup. */
  const byDate = useMemo(() => {
    const map = new Map<string, RegisteredEvent[]>()
    for (const e of events) {
      const key = (e.event_date ?? '').slice(0, 10)
      if (!key) continue
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return map
  }, [events])

  const todayKey = toKey(new Date())
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // getDay() is Sunday-first; shift so Monday leads.
  const lead = (new Date(year, month, 1).getDay() + 6) % 7
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

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
                  const dayEvents = byDate.get(key) ?? []
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

                      {/* The titles themselves. A dot never answered the question. */}
                      <ul className="mt-1 space-y-1">
                        {dayEvents.map((e) => (
                          <li key={e.registration_id ?? e.id}>
                            <Link
                              href={`/events/${e.id}`}
                              title={e.title ?? ''}
                              className="block truncate border-l-2 border-signal pl-1 font-sans text-ui-s text-type-primary hover:text-signal active:text-signal"
                            >
                              {e.title}
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
