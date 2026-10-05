'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui/EmptyState'
import { CollegeShell, CollegeLoading, useCollegeAccess } from '@/components/college/CollegeUI'
import { formatDateShort } from '@/lib/utils'

/**
 * What a college actually asked for: who is going out, who never has, and what
 * they go to.
 *
 * The numbers are deliberately unflattering where the data is thin. A placement
 * cell is not helped by a dashboard that implies activity it cannot evidence,
 * so a student with no registrations is counted as dormant and said so, and an
 * empty table says the pipeline is empty rather than drawing an encouraging
 * zero.
 */

type Row = {
  id: string
  full_name: string | null
  username: string | null
  graduation_year: number | string | null
  registrations: number
  attended: number
  lastSeen: string | null
  categories: string[]
}

export default function CollegeOverviewPage() {
  const { ctx } = useCollegeAccess()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [eventCount, setEventCount] = useState(0)

  useEffect(() => {
    if (!ctx?.collegeId) return
    let cancelled = false

    const load = async () => {
      const { data: students } = await supabase
        .from('user_profiles')
        .select('id,full_name,username,graduation_year')
        .eq('college_id', ctx.collegeId as string)
        .neq('role', 'college')

      const ids = (students ?? []).map((s) => s.id)
      if (!ids.length) {
        if (!cancelled) setRows([])
        return
      }

      // Registrations carry the event, which carries the category. One trip.
      const { data: regs } = await supabase
        .from('user_registrations')
        .select('user_id, registered_at, events(category, event_date, title)')
        .in('user_id', ids)

      const { data: att } = await supabase
        .from('event_attendance')
        .select('user_id')
        .in('user_id', ids)

      const byUser = new Map<string, { n: number; attended: number; cats: string[]; last: string | null }>()
      for (const id of ids) byUser.set(id, { n: 0, attended: 0, cats: [], last: null })

      for (const r of regs ?? []) {
        const e = byUser.get(r.user_id as string)
        if (!e) continue
        e.n += 1
        const ev = (r as { events?: { category?: string | null; event_date?: string | null } }).events
        if (ev?.category) e.cats.push(ev.category)
        const when = (r.registered_at as string | null) ?? ev?.event_date ?? null
        if (when && (!e.last || when > e.last)) e.last = when
      }
      for (const a of att ?? []) {
        const e = byUser.get(a.user_id as string)
        if (e) e.attended += 1
      }

      const built: Row[] = (students ?? []).map((s) => {
        const e = byUser.get(s.id)!
        return {
          id: s.id,
          full_name: s.full_name,
          username: s.username,
          graduation_year: s.graduation_year,
          registrations: e.n,
          attended: e.attended,
          lastSeen: e.last,
          categories: e.cats,
        }
      })

      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      if (!cancelled) {
        setRows(built)
        setEventCount(count ?? 0)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [ctx?.collegeId])

  const summary = useMemo(() => {
    if (!rows) return null
    const active = rows.filter((r) => r.registrations > 0)
    const mix = new Map<string, number>()
    for (const r of rows) for (const c of r.categories) mix.set(c, (mix.get(c) ?? 0) + 1)
    const cohorts = new Map<string, { total: number; active: number }>()
    for (const r of rows) {
      const key = r.graduation_year ? String(r.graduation_year) : 'Not set'
      const c = cohorts.get(key) ?? { total: 0, active: 0 }
      c.total += 1
      if (r.registrations > 0) c.active += 1
      cohorts.set(key, c)
    }
    return {
      total: rows.length,
      active: active.length,
      dormant: rows.length - active.length,
      registrations: rows.reduce((a, r) => a + r.registrations, 0),
      attended: rows.reduce((a, r) => a + r.attended, 0),
      mix: Array.from(mix.entries()).sort((a, b) => b[1] - a[1]),
      cohorts: Array.from(cohorts.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      mostActive: active.slice().sort((a, b) => b.registrations - a.registrations).slice(0, 5),
    }
  }, [rows])

  return (
    <CollegeShell
      title="Overview"
      lede="Who is going out, who has not yet, and what they go to."
      stats={
        summary
          ? [
              { label: 'Students', value: summary.total },
              {
                label: 'Active',
                value: summary.active,
                note: summary.total ? `${Math.round((summary.active / summary.total) * 100)}% of the cohort` : undefined,
              },
              { label: 'Never registered', value: summary.dormant },
              { label: 'Registrations', value: summary.registrations },
              { label: 'Attended', value: summary.attended },
              { label: 'Events listed', value: eventCount },
            ]
          : undefined
      }
    >
      {!rows ? (
        <CollegeLoading what="your students" />
      ) : rows.length === 0 ? (
        <EmptyState
          glyph="users"
          title="No students yet"
          detail="Students appear here once they sign up with this college on their profile."
        />
      ) : (
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h2 className="border-b border-rule-strong pb-2 font-display text-title uppercase text-type-primary">
              Most active
            </h2>
            {summary && summary.mostActive.length > 0 ? (
              <ol>
                {summary.mostActive.map((r, i) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule py-3"
                  >
                    <span className="flex min-w-0 items-baseline gap-3">
                      <span data-mono className="text-mono text-type-muted">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="truncate font-sans text-ui text-type-primary">
                        {r.full_name || r.username || 'Unnamed'}
                      </span>
                    </span>
                    <span className="flex items-baseline gap-4">
                      <span data-mono className="text-mono text-type-primary">
                        {r.registrations}
                      </span>
                      <span className="font-sans text-ui-s text-type-muted">
                        registered{r.lastSeen ? ` · last ${formatDateShort(r.lastSeen)}` : ''}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                glyph="calendar"
                title="Nobody has registered yet"
                detail="This fills in as students register for events through HATCH."
              />
            )}

            <h2 className="mt-12 border-b border-rule-strong pb-2 font-display text-title uppercase text-type-primary">
              By graduating year
            </h2>
            <dl>
              {summary?.cohorts.map(([year, c]) => (
                <div
                  key={year}
                  className="flex items-baseline justify-between gap-4 border-b border-rule py-3"
                >
                  <dt className="font-sans text-ui-s text-type-secondary">{year}</dt>
                  <dd className="flex items-baseline gap-4">
                    <span data-mono className="text-mono text-type-primary">
                      {c.active}/{c.total}
                    </span>
                    <span className="font-sans text-ui-s text-type-muted">active</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="mt-12 lg:col-span-4 lg:col-start-9 lg:mt-0">
            <h2 className="border-b border-rule-strong pb-2 font-display text-title uppercase text-type-primary">
              What they go to
            </h2>
            {summary && summary.mix.length > 0 ? (
              <dl>
                {summary.mix.map(([cat, n]) => (
                  <div
                    key={cat}
                    className="flex items-baseline justify-between gap-4 border-b border-rule py-3"
                  >
                    <dt className="font-sans text-ui-s text-type-secondary">{cat}</dt>
                    <dd data-mono className="text-mono text-type-primary">
                      {n}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="border-b border-rule py-3 font-sans text-ui-s text-type-muted">
                Nothing to break down yet. This shows the mix of categories your students register
                for once they start.
              </p>
            )}

            <p className="mt-6 font-sans text-ui-s text-type-muted">
              {summary?.dormant ?? 0} of {summary?.total ?? 0} students have never registered for
              anything.{' '}
              <Link href="/college/students" className="text-signal rule-underline">
                See the full list
              </Link>
            </p>
          </aside>
        </div>
      )}
    </CollegeShell>
  )
}
