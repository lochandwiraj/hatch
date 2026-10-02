'use client'

import Link from 'next/link'
import Header from '@/components/layout/Header'
import { Glyph } from '@/components/ui/Glyph'
import { useAuth } from '@/components/auth/AuthProvider'

/**
 * The shared furniture behind the four admin screens.
 *
 * They were four copies of the same page: the same gate, the same masthead, the
 * same stat strip, the same filter chips, and the same three sort buttons
 * written out by hand twelve times in total. They had drifted — different
 * container widths, different heading sizes, three spellings of the same filter
 * chip — and each carried its own list of administrator addresses.
 *
 * Everything that is identical lives here now, so the four screens cannot drift
 * again and a fix lands in one place.
 */

/**
 * Who may open an admin screen.
 *
 * Copied verbatim from the four pages rather than corrected, because changing
 * it changes who can administer a live product. Two notes for whoever owns this:
 * Header.tsx carries a different list (lowercase `dwiraj@hatch.in`), and the
 * `@HATCH.in` domain is not the live one — the product runs on hatchevent.in —
 * so only the two Gmail addresses actually grant access today.
 */
export const ADMIN_EMAILS = [
  'dwiraj06@gmail.com',
  'pokkalilochan@gmail.com',
  'dwiraj@HATCH.in',
  'lochan@HATCH.in',
]

export function useIsAdmin(): boolean {
  const { user } = useAuth()
  return ADMIN_EMAILS.includes(user?.email || '')
}

/** A refusal reads like the 404: stated at the top with a way out. */
function Denied() {
  return (
    <div className="min-h-screen bg-ink">
      <Header />
      <div className="px-4 py-16 lg:px-12">
        <p data-mono className="text-mono text-signal">403</p>
        <h1 className="mt-3 font-display text-display-m text-type-primary">Not your screen</h1>
        <p className="mt-3 max-w-tight font-serif text-body text-type-secondary">
          This page is for administrators. Your account does not have that permission.
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
}

/**
 * Page frame: gate, masthead, stat ledger.
 *
 * The stat ledger flows rather than sitting on a fixed column count, because a
 * four-column grid holding five figures left the fifth alone above three empty
 * cells on three of these screens.
 */
export function AdminShell({
  label,
  title,
  lede,
  actions,
  stats,
  children,
}: {
  /** The small mono eyebrow, e.g. "admin · events". */
  label: string
  title: string
  lede?: string
  actions?: React.ReactNode
  stats?: Stat[]
  children: React.ReactNode
}) {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return <Denied />

  return (
    <div className="min-h-screen bg-ink">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule-strong pb-4">
          <div>
            <p data-mono className="text-mono text-type-muted">{label}</p>
            <h1 className="mt-1 font-display text-display-m text-type-primary">{title}</h1>
            {lede ? <p className="mt-2 font-sans text-ui-s text-type-secondary">{lede}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>

        {stats?.length ? (
          <dl className="mt-6 flex flex-wrap border-l border-t border-rule">
            {stats.map((s) => (
              <div key={s.label} className="grow basis-[140px] border-b border-r border-rule px-3 py-3">
                <dt className="font-sans text-label uppercase text-type-muted">{s.label}</dt>
                <dd data-mono className="mt-1 text-mono-l text-type-primary">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-8">{children}</div>
      </main>
    </div>
  )
}

/** The primary action in a masthead. */
export function AdminAction({
  onClick,
  href,
  children,
  glyph,
}: {
  onClick?: () => void
  href?: string
  children: React.ReactNode
  glyph?: React.ComponentProps<typeof Glyph>['name']
}) {
  const cls =
    'inline-flex min-h-touch items-center gap-2 border border-signal bg-signal px-4 py-2 font-sans text-ui-s font-medium text-ink hover:bg-ink hover:text-signal active:bg-ink active:text-signal'
  const inner = (
    <>
      {glyph ? <Glyph name={glyph} size={14} /> : null}
      {children}
    </>
  )
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

/** A quiet secondary control, e.g. Refresh. */
export function AdminGhost({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-touch items-center gap-2 border border-rule-strong px-4 py-2 font-sans text-ui-s text-type-primary hover:border-signal hover:text-signal active:border-signal active:text-signal disabled:opacity-40"
    >
      {children}
    </button>
  )
}

/** One row of mutually exclusive filters. */
export function FilterChips<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-sans text-label uppercase text-type-muted">{legend}</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-touch border px-3 py-1 font-sans text-ui-s ${
            value === o.value
              ? 'border-signal bg-signal text-ink'
              : 'border-rule text-type-secondary hover:border-rule-strong hover:text-type-primary'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** The sort control. Replaces three hand-written buttons per screen. */
export function SortBar({
  options,
  sortKey,
  sortDir,
  onChange,
}: {
  options: readonly { key: string; label: string }[]
  sortKey: string
  sortDir: 'asc' | 'desc'
  onChange: (key: string, dir: 'asc' | 'desc') => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-sans text-label uppercase text-type-muted">Sort</span>
      {options.map((o) => {
        const active = sortKey === o.key
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.key, active && sortDir === 'asc' ? 'desc' : 'asc')}
            className={`min-h-touch border px-3 py-1 font-sans text-ui-s ${
              active ? 'border-signal text-signal' : 'border-rule text-type-secondary hover:border-rule-strong hover:text-type-primary'
            }`}
          >
            {o.label}
            {active ? (
              <span data-mono className="ml-1 text-mono">
                {sortDir === 'asc' ? '+' : '-'}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function AdminSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative w-full">
      <Glyph
        name="search"
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-type-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-touch w-full border border-rule bg-ink-sunken py-2 pl-8 pr-3 font-sans text-ui text-type-primary placeholder-type-muted focus:border-rule-strong focus:outline-none"
      />
    </div>
  )
}

/**
 * One record. A ruled row, not a filled card.
 *
 * `title` and `meta` stack on the left; `actions` sit right and wrap under on a
 * phone. The row-rule marker on the left edge is the same one the public index
 * uses, so an admin list reads as the same product.
 */
export function RecordRow({
  title,
  badges,
  meta,
  actions,
}: {
  title: React.ReactNode
  badges?: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <li className="row-rule border-b border-rule py-4 pl-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-sans text-ui text-type-primary">{title}</span>
            {badges}
          </div>
          {meta ? <div className="mt-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 lg:shrink-0">{actions}</div> : null}
      </div>
    </li>
  )
}

/** A small bordered control used for row actions. */
export function RowAction({
  onClick,
  href,
  danger,
  disabled,
  glyph,
  children,
}: {
  onClick?: () => void
  href?: string
  danger?: boolean
  disabled?: boolean
  glyph?: React.ComponentProps<typeof Glyph>['name']
  children: React.ReactNode
}) {
  const cls = `inline-flex min-h-touch items-center gap-1 border px-3 py-1 font-sans text-ui-s disabled:opacity-40 ${
    danger
      ? 'border-rule text-signal hover:border-signal active:border-signal'
      : 'border-rule text-type-secondary hover:border-rule-strong hover:text-type-primary active:text-type-primary'
  }`
  const inner = (
    <>
      {glyph ? <Glyph name={glyph} size={14} /> : null}
      {children}
    </>
  )
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  )
}

/** Loading. One mono line: the brief bans skeleton placeholders outright. */
export function AdminLoading({ what }: { what: string }) {
  return (
    <p data-mono className="py-8 text-mono text-type-muted" role="status" aria-live="polite">
      Loading {what}
    </p>
  )
}

/** The label/value pairs under a record title. */
export function Meta({ items }: { items: (string | null | undefined)[] }) {
  const shown = items.filter(Boolean)
  if (!shown.length) return null
  return (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-sans text-ui-s text-type-muted">
      {shown.map((s, i) => (
        <span key={i}>{s}</span>
      ))}
    </p>
  )
}

/** Stable sort by an arbitrary key, nulls last. One copy for all four screens. */
export function sortRecords<T extends Record<string, unknown>>(
  rows: T[],
  key: string,
  dir: 'asc' | 'desc'
): T[] {
  return [...rows].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    const r =
      typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return dir === 'asc' ? r : -r
  })
}

/**
 * Delete an event after showing what goes with it.
 *
 * event_deletion_impact reports the registrations and attendance records tied
 * to the event. Manage Events asked for that confirmation; the Events screen
 * deleted on a bare "Are you sure?", so the same action was safe on one screen
 * and not the other. One implementation now, used by both.
 *
 * Returns true when a delete actually happened.
 */
export async function confirmDeleteEvent(
  supabase: {
    from: (t: string) => any
  },
  eventId: string,
  title: string
): Promise<boolean> {
  let impactLine = ''
  try {
    const { data: impact } = await supabase
      .from('event_deletion_impact')
      .select('event_title, registered_users, attendance_records')
      .eq('event_id', eventId)
      .maybeSingle()
    if (impact) {
      const regs = Number(impact.registered_users ?? 0)
      const att = Number(impact.attendance_records ?? 0)
      impactLine =
        regs + att === 0
          ? '\n\nNothing else is attached to it.'
          : `\n\nThis will also remove ${regs} registration(s) and ${att} attendance record(s).`
    }
  } catch {
    impactLine = '\n\nThe impact check failed, so the blast radius is unknown.'
  }
  return confirm(`Delete "${title}" permanently?${impactLine}`)
}
