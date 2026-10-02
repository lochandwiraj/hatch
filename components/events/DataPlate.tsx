import { normalizeRequiredTier } from '@/lib/tier'

/**
 * The DataPlate. What stands in for a poster.
 *
 * poster_image_url is null on all 13 events in the live database, and tags is
 * empty on all 13. So this product has no images and never did. Rather than
 * reserve a grey rectangle for one that is not coming, the plate sets the data
 * itself large: the date in mono, the category in its own ink.
 *
 * It is generated from the row, so it is never missing and never wrong.
 */

const CATEGORY_INK: Record<string, string> = {
  hackathon: 'var(--cat-hackathon)',
  networking: 'var(--cat-networking)',
  conference: 'var(--cat-conference)',
  webinar: 'var(--cat-webinar)',
  other: 'var(--cat-other)',
}

export function categoryInk(category: string | null): string {
  return CATEGORY_INK[(category ?? '').trim().toLowerCase()] ?? 'var(--cat-fallback)'
}

export function DataPlate({
  date,
  category,
  organizer,
  requiredTier,
  locked = false,
  active = false,
  size = 'md',
}: {
  date: string | null
  category: string | null
  organizer: string | null
  requiredTier?: string | null
  locked?: boolean
  /** Behaviour 3: the centred plate in the rail. */
  active?: boolean
  size?: 'sm' | 'md'
}) {
  const d = date ? new Date(date) : null
  const valid = d && !Number.isNaN(d.getTime())
  const day = valid ? String(d.getDate()).padStart(2, '0') : '--'
  const month = valid ? d.toLocaleString('en-GB', { month: 'short' }).toUpperCase() : '---'
  const year = valid ? String(d.getFullYear()) : ''
  const ink = categoryInk(category)

  return (
    <div
      className={`relative flex flex-col justify-between border ${
        active ? 'border-rule-strong' : 'border-rule'
      } ${size === 'sm' ? 'min-h-[96px] p-3' : 'min-h-[132px] p-4'} ${locked ? 'hatch-locked' : ''}`}
      style={{
        // Behaviour 3: the active plate thickens its category rule to 2px.
        borderBottomWidth: active ? 2 : 1,
        borderBottomColor: active ? ink : undefined,
      }}
    >
      <div>
        <span
          data-mono
          className={`block text-mono-l leading-none ${active ? 'text-signal' : 'text-type-primary'}`}
        >
          {day}
        </span>
        <span data-mono className="block text-mono text-type-secondary">
          {month} {year}
        </span>
      </div>

      <div className="mt-3">
        <span className="block font-sans text-label uppercase" style={{ color: ink }}>
          {category ?? 'Uncategorised'}
        </span>
        {organizer ? (
          <span className="mt-1 block truncate font-sans text-ui-s text-type-muted">
            {organizer}
          </span>
        ) : null}
      </div>

      {requiredTier && normalizeRequiredTier(requiredTier) !== 'free' ? (
        <span
          data-mono
          className="absolute right-2 top-2 border border-rule px-1 text-mono text-type-muted"
        >
          {normalizeRequiredTier(requiredTier) === 'basic_99' ? '99' : '149'}
        </span>
      ) : null}
    </div>
  )
}

export default DataPlate
