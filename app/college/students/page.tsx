'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui/EmptyState'
import { CollegeShell, CollegeLoading, useCollegeAccess } from '@/components/college/CollegeUI'
import { AdminSearch, FilterChips, SortBar, sortRecords } from '@/components/admin/AdminUI'
import { formatDateShort } from '@/lib/utils'

/**
 * Every student of this college, with what they have actually done.
 *
 * The filter that matters is active versus dormant: the list a placement cell
 * wants is usually the people who have never been to anything, not a
 * leaderboard of the people who have.
 */

type Row = {
  id: string
  name: string
  username: string | null
  graduation_year: number | string | null
  registrations: number
  attended: number
  last: string | null
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'dormant', label: 'Never registered' },
] as const

const SORTS = [
  { key: 'name', label: 'Name' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'graduation_year', label: 'Year' },
] as const

export default function CollegeStudentsPage() {
  const { ctx } = useCollegeAccess()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'dormant'>('all')
  const [sortKey, setSortKey] = useState<string>('registrations')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

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

      const { data: regs } = await supabase
        .from('user_registrations')
        .select('user_id, registered_at')
        .in('user_id', ids)
      const { data: att } = await supabase
        .from('event_attendance')
        .select('user_id')
        .in('user_id', ids)

      const counts = new Map<string, { n: number; a: number; last: string | null }>()
      for (const id of ids) counts.set(id, { n: 0, a: 0, last: null })
      for (const r of regs ?? []) {
        const e = counts.get(r.user_id as string)
        if (!e) continue
        e.n += 1
        const when = r.registered_at as string | null
        if (when && (!e.last || when > e.last)) e.last = when
      }
      for (const a of att ?? []) {
        const e = counts.get(a.user_id as string)
        if (e) e.a += 1
      }

      if (!cancelled) {
        setRows(
          (students ?? []).map((s) => {
            const e = counts.get(s.id)!
            return {
              id: s.id,
              name: s.full_name || s.username || 'Unnamed',
              username: s.username,
              graduation_year: s.graduation_year,
              registrations: e.n,
              attended: e.a,
              last: e.last,
            }
          })
        )
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [ctx?.collegeId])

  const shown = useMemo(() => {
    if (!rows) return []
    const q = query.trim().toLowerCase()
    const filtered = rows.filter((r) => {
      if (filter === 'active' && r.registrations === 0) return false
      if (filter === 'dormant' && r.registrations > 0) return false
      if (q && !`${r.name} ${r.username ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
    return sortRecords(
      filtered as unknown as Record<string, unknown>[],
      sortKey,
      sortDir
    ) as unknown as Row[]
  }, [rows, query, filter, sortKey, sortDir])

  const active = rows?.filter((r) => r.registrations > 0).length ?? 0

  return (
    <CollegeShell
      title="Students"
      lede="Everyone from this college on HATCH, and what they have done."
      stats={
        rows
          ? [
              { label: 'Students', value: rows.length },
              { label: 'Active', value: active },
              { label: 'Never registered', value: rows.length - active },
            ]
          : undefined
      }
    >
      <div className="space-y-3 border-b border-rule pb-3">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search by name or username" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <FilterChips legend="Activity" options={FILTERS} value={filter} onChange={setFilter} />
          <SortBar
            options={SORTS}
            sortKey={sortKey}
            sortDir={sortDir}
            onChange={(k, d) => {
              setSortKey(k)
              setSortDir(d)
            }}
          />
        </div>
      </div>

      {!rows ? (
        <CollegeLoading what="your students" />
      ) : shown.length === 0 ? (
        <EmptyState
          glyph="users"
          title="Nobody matches"
          detail={query ? 'Try a different search.' : 'No students in this group yet.'}
        />
      ) : (
        <>
          <p data-mono className="py-2 text-mono text-type-muted">
            {shown.length} shown
          </p>
          <ul>
            {shown.map((r) => (
              <li
                key={r.id}
                className="row-rule flex flex-col gap-2 border-b border-rule py-4 pl-3 lg:flex-row lg:items-baseline lg:justify-between lg:gap-6"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-sans text-ui text-type-primary">{r.name}</span>
                    {r.registrations === 0 ? (
                      <span className="border border-rule px-2 py-px font-sans text-label uppercase text-type-muted">
                        Never registered
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 font-sans text-ui-s text-type-muted">
                    @{r.username ?? '—'}
                    {r.graduation_year ? ` · class of ${r.graduation_year}` : ''}
                    {r.last ? ` · last registered ${formatDateShort(r.last)}` : ''}
                  </p>
                </div>
                <dl className="flex shrink-0 items-baseline gap-6">
                  <div className="flex items-baseline gap-2">
                    <dt className="font-sans text-label uppercase text-type-muted">Reg</dt>
                    <dd data-mono className="text-mono text-type-primary">
                      {r.registrations}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <dt className="font-sans text-label uppercase text-type-muted">Attended</dt>
                    <dd data-mono className="text-mono text-type-primary">
                      {r.attended}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </CollegeShell>
  )
}
