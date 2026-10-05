'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'

/**
 * The frame for the college screens.
 *
 * Deliberately the same furniture as the admin shell — masthead, eyebrow, stat
 * ledger — so the two read as one product rather than a bolt-on. What differs
 * is authority: an admin sees every college, a college sees only its own, and
 * the gate below is a profile role rather than an address list, because the
 * database enforces the same rule and the two must not be able to disagree.
 */

export type CollegeContext = {
  /** The college being viewed. Null while loading, or if an admin has none. */
  collegeId: string | null
  collegeName: string
  /** True when the viewer is an administrator rather than the college itself. */
  asAdmin: boolean
}

export function useCollegeAccess() {
  const { profile, loading } = useAuth()
  const [ctx, setCtx] = useState<CollegeContext | null>(null)
  const [denied, setDenied] = useState(false)

  const role = (profile as { role?: string } | null)?.role ?? 'student'
  const ownCollegeId = (profile as { college_id?: string | null } | null)?.college_id ?? null

  useEffect(() => {
    if (loading || !profile) return
    if (role !== 'college' && role !== 'admin') {
      setDenied(true)
      return
    }

    let cancelled = false
    const run = async () => {
      // A college views itself. An admin views whichever college is named in
      // the query string, falling back to the one with the most students so
      // the screen is never empty on arrival.
      const wanted =
        role === 'admin' ? new URLSearchParams(window.location.search).get('college') : ownCollegeId

      if (role === 'college') {
        if (!ownCollegeId) {
          setDenied(true)
          return
        }
        const { data } = await supabase.from('colleges').select('name').eq('id', ownCollegeId).single()
        if (!cancelled) setCtx({ collegeId: ownCollegeId, collegeName: data?.name ?? 'Your college', asAdmin: false })
        return
      }

      if (wanted) {
        const { data } = await supabase.from('colleges').select('id,name').eq('id', wanted).single()
        if (!cancelled && data) {
          setCtx({ collegeId: data.id, collegeName: data.name, asAdmin: true })
          return
        }
      }
      const { data: all } = await supabase.from('colleges').select('id,name').order('name')
      if (!cancelled) {
        const first = all?.[0]
        setCtx({
          collegeId: first?.id ?? null,
          collegeName: first?.name ?? 'No colleges yet',
          asAdmin: true,
        })
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [loading, profile, role, ownCollegeId])

  return { ctx, denied, role, loading: loading || (!ctx && !denied) }
}

function Denied() {
  return (
    <div className="min-h-screen bg-ink">
      <Header />
      <div className="px-4 py-16 lg:px-12">
        <p data-mono className="text-mono text-signal">403</p>
        <h1 className="mt-3 font-display text-display-m text-type-primary">Not your screen</h1>
        <p className="mt-3 max-w-tight font-serif text-body text-type-secondary">
          This area is for colleges. Your account does not have that permission.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex min-h-touch items-center border border-rule-strong px-6 py-3 font-sans text-ui text-type-primary hover:border-signal hover:text-signal"
        >
          Back to your dashboard
        </Link>
      </div>
    </div>
  )
}

export interface Stat {
  label: string
  value: React.ReactNode
  note?: string
}

export function CollegeShell({
  title,
  lede,
  stats,
  actions,
  children,
}: {
  title: string
  lede?: string
  stats?: Stat[]
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const { ctx, denied, loading } = useCollegeAccess()

  if (denied) return <Denied />

  if (loading || !ctx) {
    return (
      <div className="min-h-screen bg-ink">
        <Header />
        <p data-mono className="px-4 py-16 text-mono text-type-muted lg:px-12" role="status">
          Loading
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule-strong pb-4">
          <div className="min-w-0">
            <p data-mono className="text-mono text-type-muted">
              college{ctx.asAdmin ? ' · viewed as admin' : ''}
            </p>
            <h1 className="mt-1 break-words font-display text-display-m text-type-primary">
              {ctx.collegeName}
            </h1>
            {lede ? <p className="mt-2 font-sans text-ui-s text-type-secondary">{lede}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ctx.asAdmin ? <CollegePicker current={ctx.collegeId} /> : null}
            <CollegeTabs current={title} />
            {actions}
          </div>
        </div>

        {stats?.length ? (
          <dl className="mt-6 flex flex-wrap border-l border-t border-rule">
            {stats.map((s) => (
              <div key={s.label} className="grow basis-[150px] border-b border-r border-rule px-3 py-3">
                <dt className="font-sans text-label uppercase text-type-muted">{s.label}</dt>
                <dd data-mono className="mt-1 text-mono-l text-type-primary">
                  {s.value}
                </dd>
                {s.note ? (
                  <dd className="mt-1 font-sans text-ui-s text-type-muted">{s.note}</dd>
                ) : null}
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-8">{children}</div>
      </main>
    </div>
  )
}

/**
 * Admin only. Falling back to the first college alphabetically was fine for a
 * smoke test and useless in practice: an administrator opening this screen is
 * looking for a particular institution, not whichever one sorts first.
 */
function CollegePicker({ current }: { current: string | null }) {
  const [options, setOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    let cancelled = false
    supabase
      .from('colleges')
      .select('id,name')
      .order('name')
      .then(({ data }) => {
        if (!cancelled) setOptions(data ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <label className="flex items-center gap-2">
      <span className="font-sans text-label uppercase text-type-muted">College</span>
      <select
        value={current ?? ''}
        onChange={(e) => {
          const url = new URL(window.location.href)
          url.searchParams.set('college', e.target.value)
          window.location.assign(url.toString())
        }}
        className="min-h-touch max-w-[260px] border border-rule-strong bg-ink-sunken px-3 py-2 font-sans text-ui-s text-type-primary focus:border-signal focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  )
}

const TABS = [
  { href: '/college', label: 'Overview' },
  { href: '/college/students', label: 'Students' },
]

/** Keeps ?college= across the tabs so an admin does not lose their choice. */
function collegeHref(href: string) {
  if (typeof window === 'undefined') return href
  const chosen = new URLSearchParams(window.location.search).get('college')
  return chosen ? `${href}?college=${chosen}` : href
}

function CollegeTabs({ current }: { current: string }) {
  return (
    <nav className="flex items-center" aria-label="College sections">
      {TABS.map((t, i) => {
        const active = t.label === current
        return (
          <Link
            key={t.href}
            href={collegeHref(t.href)}
            aria-current={active ? 'page' : undefined}
            className={`${i > 0 ? '-ml-px' : ''} inline-flex min-h-touch items-center border px-4 py-2 font-sans text-ui-s ${
              active
                ? 'border-signal text-signal'
                : 'border-rule-strong text-type-secondary hover:border-signal hover:text-signal'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Loading. One mono line: the brief bans skeleton placeholders. */
export function CollegeLoading({ what }: { what: string }) {
  return (
    <p data-mono className="py-8 text-mono text-type-muted" role="status" aria-live="polite">
      Loading {what}
    </p>
  )
}
