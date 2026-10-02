'use client'

import { forwardRef } from 'react'
import { usePress } from '@/components/motion/usePress'
import CircleLoader from './CircleLoader'

/**
 * Button. Rectangles only, 0px radius, no shadow.
 *
 * Hover is not decorative here: primary and secondary invert fill and text
 * INSTANTLY with no transition, which is the only permitted hover per the
 * design system. On touch there is no hover at all, so :active carries the
 * same inversion and fires immediately.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 border font-sans font-medium ' +
  'min-h-touch select-none ' +
  'disabled:opacity-40 disabled:pointer-events-none'

const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-ui-s',
  md: 'px-4 py-3 text-ui',
  lg: 'px-6 py-4 text-ui',
}

// No transition on the inversion: it is meant to feel mechanical, not eased.
const variants: Record<Variant, string> = {
  primary:
    'border-signal bg-signal text-ink ' +
    'hover:bg-ink hover:text-signal active:bg-ink active:text-signal',
  secondary:
    'border-rule-strong bg-transparent text-type-primary ' +
    'hover:bg-type-primary hover:text-ink active:bg-type-primary active:text-ink',
  ghost:
    'border-transparent bg-transparent text-type-secondary ' +
    'hover:text-type-primary active:text-type-primary',
  danger:
    'border-signal bg-transparent text-signal ' +
    'hover:bg-signal hover:text-ink active:bg-signal active:text-ink',
  outline:
    'border-rule-strong bg-transparent text-type-primary ' +
    'hover:border-signal hover:text-signal active:border-signal active:text-signal',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Disables the button and marks it busy. No spinner: spinners are decoration. */
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, children, className = '', type = 'button', ...props },
  ref
) {
  // Behaviour 10: a phone has no hover, so every control carries a 10ms tap.
  const press = usePress()
  return (
    <button
      ref={ref}
      type={type}
      {...press}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
      {loading ? <CircleLoader size={14} /> : null}
    </button>
  )
})

export default Button
