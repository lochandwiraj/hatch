'use client'

import { forwardRef, useId } from 'react'

/**
 * A text field.
 *
 * The label sits ABOVE the input and is a real <label> element. Never a
 * floating label, never placeholder-as-label: both lose the name of the field
 * the moment someone types, and placeholder-only fails for screen readers.
 *
 * Errors render beneath the field in --signal and are linked by
 * aria-describedby, with the field rule going 2px. Colour is never the only
 * signal: the message is always present too. Field-level errors never become
 * toasts.
 */

export interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string | null
  hint?: string
  /** Mono input for codes, amounts and references. */
  mono?: boolean
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, mono = false, className = '', required, ...props },
  ref
) {
  const auto = useId()
  const id = props.name ? `field-${props.name}` : auto
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="block font-sans text-label uppercase text-type-muted">
        {label}
        {required ? (
          <span className="ml-1 text-signal" aria-hidden>
            required
          </span>
        ) : null}
      </label>

      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-2 block min-h-touch w-full border bg-ink-sunken px-3 py-2 text-ui text-type-primary placeholder-type-muted focus:outline-none ${
          mono ? 'font-mono' : 'font-sans'
        } ${error ? 'border-2 border-signal' : 'border-rule focus:border-rule-strong'}`}
        {...props}
      />

      {hint && !error ? (
        <p id={hintId} className="mt-1 font-sans text-ui-s text-type-muted">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="mt-1 font-sans text-ui-s text-signal">
          {error}
        </p>
      ) : null}
    </div>
  )
})

export default Field
