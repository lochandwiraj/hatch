'use client'

import { forwardRef, useId } from 'react'
import { Glyph } from './Glyph'

/**
 * A select. Native <select> on purpose.
 *
 * A custom dropdown would cost keyboard handling, focus management, type-ahead
 * and the phone's own picker, and buy nothing this design wants. The only
 * custom part is the chevron, because the browser's own arrow is rounded.
 */

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  error?: string | null
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, className = '', required, ...props },
  ref
) {
  const auto = useId()
  const id = props.name ? `select-${props.name}` : auto
  const errorId = `${id}-error`

  return (
    <div className={className}>
      <label htmlFor={id} className="block font-sans text-label uppercase text-type-muted">
        {label}
      </label>

      <div className="relative mt-2">
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`block min-h-touch w-full appearance-none border bg-ink-sunken px-3 py-2 pr-12 font-sans text-ui text-type-primary focus:outline-none ${
            error ? 'border-2 border-signal' : 'border-rule focus:border-rule-strong'
          }`}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink text-type-primary">
              {o.label}
            </option>
          ))}
        </select>

        <Glyph
          name="chevron"
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-type-secondary"
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1 font-sans text-ui-s text-signal">
          {error}
        </p>
      ) : null}
    </div>
  )
})

export default Select
