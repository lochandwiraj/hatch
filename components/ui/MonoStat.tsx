import { NumberRoll } from './NumberRoll'

/**
 * One figure with its label.
 *
 * Deliberately short. The previous version set every value in `mono-l`
 * (22-40px) inside a padded box, so a grid of them stretched to the tallest
 * sibling and a long string like a college name wrapped to five lines of
 * oversized monospace. Monospace is for measurement here, not for decoration:
 * a count, an amount or a date gets it, a name does not.
 *
 * `compact` is the default because these appear in rows of four or five, where
 * a tall box is all dead space.
 */
export function MonoStat({
  label,
  value,
  suffix,
  tone = 'default',
  roll = false,
  /** Large figure, for the one number a screen is actually about. */
  emphasis = false,
  className = '',
}: {
  label: string
  value: number | string | null | undefined
  suffix?: string
  tone?: 'default' | 'signal' | 'verified' | 'deadline' | 'muted'
  roll?: boolean
  emphasis?: boolean
  className?: string
}) {
  const color =
    tone === 'signal'
      ? 'text-signal'
      : tone === 'verified'
        ? 'text-verified'
        : tone === 'deadline'
          ? 'text-deadline'
          : tone === 'muted'
            ? 'text-type-muted'
            : 'text-type-primary'

  const known = value !== null && value !== undefined && value !== ''
  const numeric = typeof value === 'number' || (typeof value === 'string' && /^[\d.,:/%+-]+$/.test(value))
  const size = emphasis ? 'text-mono-l' : 'text-mono'

  return (
    <div className={`border border-rule px-3 py-2 ${className}`}>
      <p className="font-sans text-label uppercase text-type-muted">{label}</p>
      <p className={`mt-1 ${color}`}>
        {!known ? (
          <span className="font-sans text-ui-s text-type-muted">Not set</span>
        ) : roll && numeric ? (
          <NumberRoll value={value as number | string} className={size} />
        ) : numeric ? (
          <span data-mono className={size}>
            {value}
          </span>
        ) : (
          // Not a measurement, so it stays in the UI face at a readable size
          // and truncates rather than wrapping a tile out of shape.
          <span className="block truncate font-sans text-ui text-type-primary" title={String(value)}>
            {value}
          </span>
        )}
        {known && suffix ? (
          <span data-mono className="ml-1 text-mono text-type-secondary">
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  )
}

export default MonoStat
