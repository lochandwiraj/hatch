import Link from 'next/link'
import { Glyph, type GlyphName } from './Glyph'

/**
 * Empty state.
 *
 * This database is mostly empty on purpose: 0 rows in event_attendance,
 * payment_submissions, external_events and more. Empty is the common case
 * here, not an edge case, so a blank region counts as a bug. Every list,
 * table and panel routes through this.
 *
 * No apology, no illustration, no emoji. State the fact, offer the way out.
 */
export function EmptyState({
  glyph = 'search',
  title,
  detail,
  action,
}: {
  glyph?: GlyphName
  title: string
  detail?: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-rule py-6">
      <Glyph name={glyph} size={16} className="text-type-muted" />
      <p className="font-display text-title uppercase text-type-primary">{title}</p>
      {detail ? (
        <p className="max-w-measure font-serif text-ui-s text-type-secondary">{detail}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="ml-auto inline-flex min-h-touch items-center border border-rule-strong px-4 py-2 font-sans text-ui-s text-type-primary hover:border-signal hover:text-signal active:border-signal active:text-signal"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}

export default EmptyState
